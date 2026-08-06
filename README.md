# Application Tracker

A personal project to track job applications, visualize progress, analyze trends, and eventually support conversational search and automation.

## Vision
- Keep a single record of every application
- Show visual insights such as status breakdowns, applications over time, and response rates
- Let a chatbot answer questions about your application history
- Optionally auto-record applications from confirmations or browser actions

## Step-by-step plan

### Phase 1 - MVP
- Add an application with company, role, date applied, location, source, status, and notes
- View and search all applications
- Update or delete an application
- Filter by status such as applied, interviewing, rejected, or offer
- Show basic summary counts

### Phase 2 - Visualization
- Charts for applications over time
- Status breakdown charts
- Response rate and interview conversion analytics

### Phase 3 - AI assistant
- Natural-language search for companies, roles, and statuses
- Questions such as "Show me all pending applications from last month"
- Simple summaries and insights from stored data

### Phase 4 - Automation
- One-click save from a browser
- Auto-import from email confirmations
- Optional browser extension for faster recording

## Tech choices
- Frontend: React or Next.js
- Backend: Node.js or Python
- Database: SQLite for the MVP, then PostgreSQL or Supabase
- Approach: local-first first, then cloud if needed

## First milestone
Build a simple CRUD app with a searchable list and a basic dashboard.
