from flask import Flask, request, jsonify
import os

from src.helper import download_hugging_face_embeddings
from src.prompt import system_prompt

from langchain_pinecone import PineconeVectorStore
from langchain_groq import ChatGroq
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

app = Flask(__name__)

# -------------------------------------------------
# Environment variables (Vercel provides these)
# -------------------------------------------------
PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

# -------------------------------------------------
# Lazy RAG chain creation (serverless-safe)
# -------------------------------------------------
def get_rag_chain():
    embeddings = download_hugging_face_embeddings()

    docsearch = PineconeVectorStore.from_existing_index(
        index_name="medical-chatbot",
        embedding=embeddings
    )

    retriever = docsearch.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 3}
    )

    chat_model = ChatGroq(
        model_name="llama-3.1-8b-instant",
        temperature=0
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("human", "{input}")
        ]
    )

    qa_chain = create_stuff_documents_chain(chat_model, prompt)
    return create_retrieval_chain(retriever, qa_chain)

# -------------------------------------------------
# API endpoint (JSON only)
# -------------------------------------------------
@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()

    if not data or "query" not in data:
        return jsonify({"error": "Query is required"}), 400

    rag_chain = get_rag_chain()

    response = rag_chain.invoke({
        "input": data["query"]
    })

    return jsonify({
        "answer": response["answer"]
    })