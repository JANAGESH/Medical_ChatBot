"""
Aegis AI Clinical Platform - Core AI & RAG Service Helpers.

This module provides the central interface for:
1. Lazy initialization and local caching of embedding and chat model singletons.
2. Generating 384-dimensional dense vectors using Hugging Face Sentence-Transformers.
3. Conducting Pinecone Vector similarity searches with strict Cosine relevance pruning.
4. Structuring and injecting user health profiles and historical context into LLM system prompts.
5. Ingesting and summarizing uploaded laboratory report PDF documents.
"""
import os
from typing import List
from langchain.embeddings import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

from backend.app.core.config import settings
from backend.app.core.prompts import system_prompt

# Globals to cache components for efficient reuse
_embeddings = None
_docsearch = None
_chat_model = None

def download_hugging_face_embeddings():
    """
    Downloads and caches the Hugging Face sentence embeddings model.
    Uses 'sentence-transformers/all-MiniLM-L6-v2' returning 384 dimensions.
    """
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL)
    return _embeddings


def get_docsearch():
    """
    Lazily initializes and returns the Pinecone Vector Store connection.
    """
    global _docsearch
    if _docsearch is not None:
        return _docsearch

    pinecone_key = settings.PINECONE_API_KEY
    if not pinecone_key:
        raise ValueError("Missing PINECONE_API_KEY. Please verify your environment configuration.")

    os.environ["PINECONE_API_KEY"] = pinecone_key

    # Initialize Embeddings
    embeddings = download_hugging_face_embeddings()

    # Load existing Pinecone Index
    _docsearch = PineconeVectorStore.from_existing_index(
        index_name=settings.PINECONE_INDEX,
        embedding=embeddings
    )
    return _docsearch


def get_chat_model():
    """
    Lazily initializes and returns the ChatGroq LLM model.
    """
    global _chat_model
    if _chat_model is not None:
        return _chat_model

    groq_key = settings.GROQ_API_KEY
    if not groq_key:
        raise ValueError("Missing GROQ_API_KEY. Please verify your environment configuration.")

    os.environ["GROQ_API_KEY"] = groq_key

    # Initialize Groq LLM
    _chat_model = ChatGroq(
        model_name="llama-3.1-8b-instant",
        temperature=0
    )
    return _chat_model


def run_rag_query(message: str, history_records: List, user_profile: dict = None) -> tuple:
    """
    Executes a high-fidelity RAG query with dynamic profile personalization and clinical patient memory:
    1. Retrieves the top 5 matches from the Pinecone vector index.
    2. Enforces a strict cosine similarity relevance score threshold (0.65).
    3. Prunes out low-relevance noise to prevent unrelated context leakage.
    4. Formats dynamic source citations and confidence metrics.
    5. Feeds isolated session memory and relevant context into the LLM context.
    6. Returns a tuple of (reply_text, list_of_sources) for structured database persistence.
    """
    chat_model = get_chat_model()
    docs_with_scores = []

    # 1. Query vector database for matching documents along with similarity scores (k=5)
    try:
        docsearch = get_docsearch()
        # Cosine similarity metric: 0.0 (unrelated) to 1.0 (identical)
        docs_with_scores = docsearch.similarity_search_with_score(message, k=5)
    except Exception as e:
        print(f"Warning: RAG vector search connection failed ({e}). Falling back to general LLM query.")

    # 2. Relevance threshold filtering (prune noise)
    # Sweet spot for 'all-MiniLM-L6-v2' similarity scoring:
    # - High Confidence: >= 0.65 (Strong, direct clinical match)
    # - Low Confidence Fallback: 0.58 to 0.64 (Potential matching context)
    # - Anything < 0.58 is discarded to prevent noise/leakage (AIDS/chemotherapy filters).
    relevance_threshold = 0.65
    low_confidence_threshold = 0.58
    relevant_docs = []

    for doc, score in docs_with_scores:
        score_val = float(score)
        if score_val >= relevance_threshold:
            doc.metadata["confidence_score"] = score_val
            doc.metadata["confidence_tier"] = "High Confidence"
            relevant_docs.append(doc)
        elif score_val >= low_confidence_threshold:
            doc.metadata["confidence_score"] = score_val
            doc.metadata["confidence_tier"] = "Low Confidence Fallback"
            relevant_docs.append(doc)

    # 3. Dynamic Context Formatting with Source & Page Citations
    sources_list = []
    if relevant_docs:
        context_parts = []
        for idx, doc in enumerate(relevant_docs):
            src_path = doc.metadata.get("source", "Medical Reference Book")
            src_name = os.path.basename(src_path)  # Keep filename only
            page_num = str(doc.metadata.get("page", "Unknown Page"))
            confidence = float(doc.metadata.get("confidence_score", 0.0))
            tier = doc.metadata.get("confidence_tier", "High Confidence")
            
            # Format text context block for LLM prompt grounding
            context_parts.append(
                f"--- CLINICAL MANUAL REFERENCE {idx + 1} ({tier.upper()}) ---\n"
                f"Source Document: {src_name} (Page {page_num})\n"
                f"Match Confidence Score: {confidence * 100:.1f}%\n"
                f"Text Segment:\n{doc.page_content.strip()}\n"
            )
            
            # Append structured source dictionary for JSON client rendering
            sources_list.append({
                "source": src_name,
                "page": page_num,
                "confidence": confidence,
                "content": doc.page_content.strip()
            })
            
        context_str = "\n".join(context_parts)
    else:
        # Fallback when no high or low confidence data exists in vector index
        context_str = "No clinical manual references match this query in the vector index. Answer using your own comprehensive, expert medical and general knowledge naturally and directly."

    # 4. Construct Patient Profile Metrics and Memory Guidelines
    profile_str = ""
    if user_profile and any(user_profile.values()):
        # Calculate Age from DOB YYYY-MM-DD
        age_str = "Not specified"
        dob = user_profile.get("dob")
        if dob:
            try:
                from datetime import datetime
                dob_date = datetime.strptime(dob, "%Y-%m-%d")
                today = datetime.today()
                age = today.year - dob_date.year - ((today.month, today.day) < (dob_date.month, dob_date.day))
                age_str = f"{age} years old"
            except:
                age_str = "Unknown Age"

        name = user_profile.get("name") or "User"
        gender = user_profile.get("gender") or "Not specified"
        height = user_profile.get("height") or "Not specified"
        weight = user_profile.get("weight") or "Not specified"
        nationality = user_profile.get("nationality") or "Not specified"
        
        profile_str = (
            f"--- CLINICAL PATIENT PROFILE METRICS ---\n"
            f"Full Name: {name}\n"
            f"Age: {age_str}\n"
            f"Gender: {gender}\n"
            f"Height: {height} cm\n"
            f"Weight: {weight} kg\n"
            f"Nationality/Country: {nationality}\n"
            f"PERSONALIZATION SCOPE: Intelligently adapt your response based on these metrics. For older users, provide slightly more cautious and gentler lifestyle recommendations. Customize sleep, hydration, stress, and exercise recovery tips specifically for their body build (height/weight/gender) safely and naturally. If suggesting emergency services, clinical help numbers, or telephone lines, personalize them to the patient's specified nationality/country location (e.g. 102/108/112 for India, 911 for USA, 999 for UK).\n\n"
        )

    memory_instruction = ""
    if history_records:
        memory_instruction = (
            f"--- CONVERSATIONAL MEMORY REFERENCE ---\n"
            f"Review the past chat history logs below. Aegis memory has isolated active patient concerns (e.g. sleep difficulties, prior symptom mentions, earlier headaches). Reference previous discussions naturally in your greeting or response (e.g., 'As you mentioned sleep difficulties earlier...'). Avoid repeating previous advices.\n\n"
        )

    full_context = profile_str + memory_instruction + context_str
    formatted_system = system_prompt.format(context=full_context)

    # Assemble messages list
    messages = [("system", formatted_system)]

    # 5. Inject isolated database chat history to preserve conversational memory
    for msg in history_records:
        role = "human" if msg.sender == "user" else "ai"
        messages.append((role, msg.content))

    # Add the current user query message
    messages.append(("human", message))

    # 6. Format and invoke the Groq model
    prompt_template = ChatPromptTemplate.from_messages(messages)
    response = chat_model.invoke(prompt_template.format_messages())

    return response.content, sources_list


def extract_pdf_summary(file_bytes: bytes) -> str:
    """
    Parses an uploaded PDF medical report, extracts text content,
    and returns a structured, safe educational AI summary.
    """
    try:
        from pypdf import PdfReader
        import io
        
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        
        trimmed_text = text[:8000].strip()
        if not trimmed_text:
            return "No extractable text segment detected inside the uploaded report PDF manual."

        chat_model = get_chat_model()
        summary_prompt = (
            "You are an Aegis AI medical assistant. Your task is to analyze and summarize this medical report, laboratory work, blood test, or prescription simply, calmly, and professionally.\n"
            "Explain common medical terminology simply. If there are high, low, or out-of-range values, highlight them clearly and directly as general reference findings.\n"
            "CRITICAL: Avoid diagnosing any illnesses or prescribing treatments. Always maintain a helpful, professional, non-diagnostic assistant tone. Do NOT include 'educational purpose only' or similar disclaimers.\n"
            "Use clear descriptors like: 'May indicate', 'Please consult a healthcare provider'.\n"
            "Structure your response beautifully with markdown headings and clear bullet points. Here is the report context:\n\n"
            f"{trimmed_text}"
        )
        response = chat_model.invoke([("user", summary_prompt)])
        return response.content
    except Exception as e:
        return f"Aegis analysis engine failed to parse document: {str(e)}"
