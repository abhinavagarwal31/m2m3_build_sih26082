# SIH26082 POC — M2 + M3 (Team Forge)

Atmospheric Diagnostics (M2) and Air Quality Forecast (M3) proof-of-concept.

## Running locally

- **Backend** (FastAPI): runs on port 8000 via `uvicorn`
- **Frontend** (Next.js): runs on port 3000 via `npm run dev`
- In development, the frontend proxies `/api/*` requests to `http://localhost:8000`
