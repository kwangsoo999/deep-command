FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py init_db.py ./
RUN useradd --create-home game && chown -R game:game /app
USER game
EXPOSE 8000
CMD ["sh","-c","python init_db.py && uvicorn main:app --host 0.0.0.0 --port 8000"]
