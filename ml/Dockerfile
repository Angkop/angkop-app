FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Sentence-BERT is baked into the image so a cold start loads it from disk instead of
# downloading ~90MB from the Hugging Face Hub first. Keep MODEL_NAME in sync with app/config.py.
ARG MODEL_NAME=all-MiniLM-L6-v2
ENV HF_HOME=/app/.cache/huggingface
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('${MODEL_NAME}')"

COPY app ./app

ENV PYTHONUNBUFFERED=1

# Hugging Face Spaces expects 7860; Cloud Run sets PORT itself (8080) and overrides this.
ENV PORT=7860
EXPOSE 7860

CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
