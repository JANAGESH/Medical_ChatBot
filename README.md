# 🩺 Medical Chatbot using LLMs, LangChain & Pinecone

A complete end-to-end **Medical Chatbot** built using **Large Language Models**, **LangChain**, **Pinecone**, and **Flask**, with full **AWS deployment** and **CI/CD using GitHub Actions**.

---

## 🚀 Tech Stack

- Python
- LangChain
- Flask
- Groq AI (LLM)
- Pinecone (Vector Database)
- Docker
- AWS (EC2, ECR)
- GitHub Actions (CI/CD)

---

## 📂 Project Structure

```
.
├── app.py
├── store_index.py
├── requirements.txt
├── Dockerfile
├── .env
├── src/
│   ├── helper.py
│   ├── prompt.py
│   └── ...
└── README.md
```

---

## 🛠️ Local Setup & Running the Project

### Step 1: Clone the Repository

```bash
git clone https://github.com/JANAGESH/Medical_ChatBot.git
cd Medical_ChatBot
```

---

### Step 2: Create and Activate Conda Environment

```bash
conda create -n medicalbot python=3.10 -y
conda activate medicalbot
```

---

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

---

### Step 4: Configure Environment Variables

Create a `.env` file in the root directory and add:

```env
PINECONE_API_KEY="your_pinecone_api_key"
GROQ_API_KEY="your_groq_api_key"
```

---

### Step 5: Store Embeddings in Pinecone

```bash
python store_index.py
```

---

### Step 6: Run the Flask Application

```bash
python app.py
```

---

### Step 7: Access the Application

Open your browser and visit:

```
http://localhost:8080

```

---

## ☁️ AWS Deployment with CI/CD (GitHub Actions)

### Step 1: Create an IAM User

Create an IAM user with **programmatic access** and attach the following policies:

- AmazonEC2ContainerRegistryFullAccess
- AmazonEC2FullAccess

---

### Step 2: Create ECR Repository

Example repository URI:

```
315865595366.dkr.ecr.us-east-1.amazonaws.com/medicalbot
```

Save this URI for later use.

---

### Step 3: Launch EC2 Instance

- OS: Ubuntu
- Instance type: As required
- Open inbound ports (5000 or 80)

---

### Step 4: Install Docker on EC2

```bash
sudo apt-get update -y
sudo apt-get upgrade -y

curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

sudo usermod -aG docker ubuntu
newgrp docker
```

---

### Step 5: Configure EC2 as Self-Hosted GitHub Runner

1. Go to **GitHub Repository → Settings → Actions → Runners**
2. Click **New self-hosted runner**
3. Select **Linux**
4. Run the provided commands on your EC2 instance

---

### Step 6: Configure GitHub Secrets

Navigate to  
**GitHub Repository → Settings → Secrets and variables → Actions**

Add the following secrets:

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_DEFAULT_REGION
ECR_REPO
PINECONE_API_KEY
OPENAI_API_KEY
```

---

## 🔄 CI/CD Deployment Workflow

1. GitHub Actions builds the Docker image
2. Image is pushed to Amazon ECR
3. EC2 pulls the latest image
4. Docker container is launched
5. Application is accessible via EC2 public IP

---

## ⚠️ Important Notes

- Never commit `.env` files or API keys
- Ensure EC2 security groups allow inbound traffic
- GitHub Actions automates the deployment process

---

## 👨‍💻 Author

**Janagesh R**

Happy Building 🚀