# AI Service (PDF Summarizer)

This service provides a simple Flask-based API for processing and summarizing PDF files using Google Gemini.

It runs locally on:

http://localhost:8000


---

## Features

- Upload PDF file
- Extract text from PDF
- Generate summary using Google Gemini API
- CORS enabled for frontend integration

---

## Requirements

Python 3.9+ is recommended.

All dependencies are listed in `requirements.txt`:

flask
flask-cors
PyPDF2
python-dotenv
google-generativeai


---

## Setup Instructions

### 1. Clone the repository

git clone <your-repo-url>
cd ai-service

### 2. Install dependencies
pip install -r requirements.txt

### 3. Setup environment variables
Copy .env.example into .env:

cp .env.example .env

Then open .env and fill your Gemini API key:

# AI API key
GEMINI_API_KEY=your_api_key

### 4. Run the service
python app.py

or if using Flask directly:

flask run --port 8000

The service will be available at:

http://localhost:8000

---

# Notes

Make sure your Gemini API key is valid.

Maximum PDF size depends on server limits and Gemini API constraints.

This service is intended for local development.

# Tech Stack

Python

Flask

Google Gemini API

PyPDF2