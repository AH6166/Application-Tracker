# Application Tracker

A personal project to track job applications, visualize progress, analyze trends, and eventually support conversational search and automation.

## Vision
- Keep a single record of every application
- Show visual insights such as status breakdowns, applications over time, and response rates
- Let a chatbot answer questions about your application history
- Optionally auto-record applications from confirmations or browser actions

## MVP goals
- Add an application with company, role, date applied, location, source, status, and notes
- View and search all applications
- Update or delete an application
- Filter by status such as Applied, Interviewing, Rejected, or Offer
- Import existing Excel exports as CSV
- Store data locally in the browser

## Current status
This starter version includes:
- A simple single-page tracker UI
- Local browser storage for applications
- CSV import support for spreadsheet-style exports
- Basic filtering and search

## Run locally
Open the index.html file in a browser, or serve the folder with a simple static server such as:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Future roadmap
- CSV mapping for common Excel headers
- Better analytics and charts
- Search and summaries with AI assistance
