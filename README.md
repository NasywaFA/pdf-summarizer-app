# PDF Summarizer App

PDF Summarizer App is a full-stack AI-powered application that allows users to upload PDF documents and generate summaries using Google Gemini AI.

The project consists of three main services:

* Frontend (Next.js)
* Backend API (Go Fiber)
* AI Service (Flask + Gemini)

---

# Architecture

```text
Frontend (Next.js)
        ↓
Backend Service (Go Fiber)
        ↓
AI Service (Flask + Gemini)
        ↓
Google Gemini API
```

---

# Features

* Upload PDF documents
* Extract text from PDF files
* Generate AI-powered summaries
* Multiple summary styles
* Summary history
* REST API integration
* Responsive user interface

---

# Tech Stack

## Frontend

* Next.js (App Router)
* React
* TypeScript
* Tailwind CSS

## Backend

* Go
* Fiber
* GORM
* PostgreSQL / SQLite

## AI Service

* Python
* Flask
* Google Gemini API
* PyPDF2

---

# Project Structure

```text
pdf-summarizer-app/
│
├── frontend/      # Next.js frontend
├── backend/       # Go Fiber backend
├── ai-service/    # Flask AI service
│
└── README.md
```

---

# Services

## 1. Frontend

Frontend application for uploading PDF files and displaying generated summaries.

Runs locally on:

```text
http://localhost:3000
```

### Features

* Upload PDF files
* Select summary style
* Display generated summaries
* View summary history
* Responsive UI

### Setup

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Create `.env.local`:

```env
NODE_ENV=development
HOSTNAME=0.0.0.0

PROJECT_NAME=
NEXT_PUBLIC_BACKEND_URL=
ML_SERVICE_URL=

DEFAULT_EMAIL=
DEFAULT_PASSWORD=
```

---

## 2. Backend Service

Backend API service that handles file uploads, communicates with the AI service, and manages summary history.

Runs locally on:

```text
http://localhost:5000
```

### Features

* Upload PDF files
* Communicate with AI service
* Store summary history
* REST API support

### Setup

```bash
cd backend
go mod tidy
go run ./src
```

### Environment Variables

Create `.env`:

```env
APP_ENV=dev
APP_HOST=0.0.0.0
APP_PORT=5000
APP_URL=

ML_SERVICE_URL=

DB_HOST=localhost
DB_USER=admin
DB_PASSWORD=admin123
DB_NAME=fiberdb
DB_PORT=5432
```

---

## 3. AI Service

AI processing service responsible for extracting text from PDFs and generating summaries using Google Gemini.

Runs locally on:

```text
http://localhost:8000
```

### Features

* PDF text extraction
* AI-generated summaries
* Gemini API integration
* CORS enabled

### Setup

```bash
cd ai-service
pip install -r requirements.txt
python app.py
```

### Environment Variables

Create `.env`:

```env
GEMINI_API_KEY=your_api_key
```

---

# Installation

## 1. Clone Repository

```bash
git clone https://github.com/NasywaFA/pdf-summarizer-app.git
cd pdf-summarizer-app
```

---

## 2. Start AI Service

```bash
cd ai-service
pip install -r requirements.txt
python app.py
```

---

## 3. Start Backend Service

```bash
cd backend
go mod tidy
go run ./src
```

---

## 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# Local Development Ports

| Service    | Port |
| ---------- | ---- |
| Frontend   | 3000 |
| Backend    | 5000 |
| AI Service | 8000 |

---

# API Flow

1. User uploads PDF from frontend
2. Backend receives file upload
3. Backend sends PDF to AI Service
4. AI Service extracts text from PDF
5. Gemini generates summary
6. Summary is returned to frontend

---

# Future Improvements

* Authentication system
* Export summary to PDF
* Chat with PDF
* Multi-language summaries
* Cloud deployment
* Docker support

---

# License

This project is licensed under the MIT License.

---

# Author

Made by [NasywaFA](https://github.com/NasywaFA)

