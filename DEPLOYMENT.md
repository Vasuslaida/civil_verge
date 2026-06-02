# CivilVerge Deployment Guide

This guide describes how to deploy the CivilVerge AI city problem tracking system to Vercel (frontend) and Render (backend).

## Deploy Backend to Render

1. Push this repository to GitHub.
2. Log in to [Render](https://render.com) and click **New** → **Web Service**.
3. Connect your GitHub repository.
4. Set the **Root Directory** to `server`.
5. Set the following build and start commands:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Under **Environment Variables**, add the environment keys required by the app:
   - `DATABASE_URL`: Your production database URL (e.g., MySQL or SQLite)
   - `JWT_SECRET`: A secure random secret key string
   - `JWT_ALGORITHM`: `HS256`
   - `JWT_EXPIRE_MINUTES`: `10080`
   - `ANTHROPIC_API_KEY`: Your Anthropic API Key (if using AI triage)
7. Deploy the service and copy the generated URL (e.g. `https://civilverge-api.onrender.com`).

---

## Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com) and click **Add New** → **Project**.
2. Import your GitHub repository.
3. Set the **Root Directory** to `client`.
4. Leave build and output settings as default:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://civilverge-api.onrender.com` (use your actual Render backend URL, without a trailing slash)
6. Deploy the project. Vercel will host your client application (e.g. `https://civilverge.vercel.app`).

---

## After Both Are Deployed

- Update backend CORS settings if you use a custom domain, or if preview URLs require specific headers.
- Update the allowed production domain inside `server/main.py` if needed.
- Enjoy your live CivilVerge application!

---

## Local Development

- **Backend**:
  ```bash
  cd server
  # Start virtual environment
  .\venv\Scripts\activate
  uvicorn main:app --reload
  ```
- **Frontend**:
  ```bash
  cd client
  npm run dev
  ```
  - The client reads backend endpoints from `.env.development` (configured to `http://localhost:8000`) automatically.
