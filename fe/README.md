# Frontend (PDF Summarizer)

This is the frontend application for the PDF Summarizer project.  
It allows users to upload PDF files, select summary style, and view generated summaries.

Runs locally on:

http://localhost:3000

---

## Features

- Upload PDF file
- Select summary style (short, detailed, bullet, etc.)
- View generated summary
- View summary history
- Responsive UI

---

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS

---

## Requirements

- Node.js 18+ recommended
- npm / pnpm / yarn

---

## Setup Instructions

### 1. Clone the repository

git clone <your-frontend-repo-url>
cd frontend

### 2. Install dependencies
npm install

# or
yarn install

# or
pnpm install

### 3. Setup environment variables
Create .env.local:

cp .env.example .env.local

Example .env.local:
NODE_ENV=development
HOSTNAME=0.0.0.0

PROJECT_NAME=
NEXT_PUBLIC_BACKEND_URL=
ML_SERVICE_URL=

DEFAULT_EMAIL=
DEFAULT_PASSWORD=

### 4. Run the development server
npm run dev

The frontend will be available at:
http://localhost:3000