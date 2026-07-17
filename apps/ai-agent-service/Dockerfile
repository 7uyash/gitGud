FROM python:3.11-slim

WORKDIR /app

COPY apps/ai-agent-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/ai-agent-service/app ./app

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
