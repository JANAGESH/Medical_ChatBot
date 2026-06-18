FROM python:3.10-slim

# Install system dependencies required by PyTorch CPU (like OpenMP)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . ./backend

EXPOSE 10000

CMD ["python", "-m", "uvicorn", "backend.app.main:app", "--host", "", "--port", "10000"]
