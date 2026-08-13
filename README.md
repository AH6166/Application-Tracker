# Application Tracker

A lightweight browser-based job application tracker built with plain HTML, CSS, and JavaScript.

## What it does today
- Track applications with company, role, date applied, location, stage, and status
- Add, edit, and delete records through an intuitive form
- Search by company or role and filter by status using summary cards
- Import application data from CSV files with header normalization for common formats
- Persist data locally using browser localStorage
- Automatically mark old review-stage applications as ghosted after 60 days

## Technology stack
- Frontend: HTML, CSS, JavaScript
- Storage: browser localStorage for the client-side version
- Backend: Express REST API with optional PostgreSQL persistence via `DATABASE_URL`
- Import: client-side CSV parsing and field normalization

## Current status
This version includes:
- Single-page tracker UI with a form for new applications
- Summary dashboard for totals, applied, rejected, ghosted, and offers
- CSV import handling for common application spreadsheet headers
- Real-time search and status filtering
- Local persistence in the browser for quick offline use
- REST API backend support with optional PostgreSQL storage when `DATABASE_URL` is configured

## Run locally
Open `index.html` in your browser, or serve the folder with a static server:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

### Run the backend
Install dependencies and start the Express API:

```bash
npm install
npm start
```

The backend runs on http://localhost:3000 by default and exposes REST endpoints at `/api/applications`.

### Enable PostgreSQL storage
Set `DATABASE_URL` before starting the server to persist data in PostgreSQL:

```bash
export DATABASE_URL="postgres://user:password@host:5432/database"
npm start
```

If `DATABASE_URL` is not set, the backend falls back to local file storage under `./data/applications.json`.

## Future roadmap
- Data visualization with charts for pipeline progress, response rates, and weekly application trends
- Analytics and insights to identify strengths, gaps, and conversion rates
- Conversational search so a chatbot can answer questions like “find my offer-stage applications” or “show applications for Company X”
- Explore integration with OpenAI APIs and LangChain to enable natural-language queries over application data
	- Server API: POST `/api/ai-query` with JSON `{ "query": "your question", "topK": 5 }` — returns `{ answer, sources }`
	- To enable: set `OPENAI_API_KEY` and run `npm install` to install `openai` (and optionally `langchain`).
	- Optional: POST `/api/ai-refresh` to rebuild the local embeddings index after data changes.
- Prototype a Chrome extension to automatically capture job postings and log new applications
- Automatic application logging from confirmations, browser actions, or import helpers
- Migration to a backend-backed app with authentication and persistent cloud storage
