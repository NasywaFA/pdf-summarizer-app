# Backend Service (PDF Summarizer)

This is the backend service for the PDF Summarizer application.  
It handles file uploads, communicates with the AI service, and returns the generated summaries to the frontend.

Runs locally on:

http://localhost:5000

---

## Features

- Upload PDF files
- Forward PDF to AI Service for summarization
- Store and retrieve summary history
- REST API for frontend consumption

---

## Tech Stack

- Go
- Fiber
- GORM (PostgreSQL or SQLite)
- Multipart file upload

---

## Requirements

- Go 1.21+ recommended
- PostgreSQL or SQLite (optional, depending on config)

---

## Setup Instructions

### 1. Clone the repository

git clone <your-backend-repo-url>
cd backend

### 2. Setup environment variables
Copy .env.example to .env:

cp .env.example .env

Example .env:
# server configuration
# Env value : prod || dev
APP_ENV=dev
APP_HOST=0.0.0.0
APP_PORT=5000
APP_URL=

ML_SERVICE_URL=

# database configuration
DB_HOST=localhost
DB_USER=admin
DB_PASSWORD=admin123
DB_NAME=fiberdb
DB_PORT=5432

### 3. Install dependencies
go mod tidy

### 4. Run the backend
go run ./src

Backend will be available at:
http://localhost:5000