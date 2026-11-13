FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN --mount=type=secret,id=proxy_ca if [ -f /run/secrets/proxy_ca ]; then export PIP_CERT=/run/secrets/proxy_ca; fi; pip install --no-cache-dir -r requirements.txt
COPY main.py init_db.py ./
RUN useradd --create-home game && chown -R game:game /app
USER game
EXPOSE 8000
CMD ["sh","-c","python init_db.py && uvicorn main:app --host 0.0.0.0 --port 8000"]
