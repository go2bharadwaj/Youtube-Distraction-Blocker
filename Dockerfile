# Use official lightweight Python image
FROM python:3.9-slim

# Set work directory inside container
WORKDIR /app

# Copy requirement files first (for layer caching)
COPY requirements.txt .
COPY requirements.lock .

# Install dependencies
RUN pip install --upgrade pip \
 && pip install -r requirements.lock

# Copy the app source code
COPY app ./app

# Expose the Cloud Run port
EXPOSE 8080

# Run FastAPI using the port Cloud Run provides
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
