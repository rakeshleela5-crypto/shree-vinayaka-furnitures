# Shree Vinayaka Furnitures - FastAPI Backend

FastAPI backend with PostgreSQL database support, optimized for seamless deployment on **Railway**.

## Architecture & Features
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL (with SQLAlchemy 2.0 ORM)
- **Automatic Fallback**: Defaults to local SQLite (`furnitures.db`) for zero-friction local development if `DATABASE_URL` is not provided.
- **Auto-Seeding**: Populates initial furniture categories and items automatically on first run.
- **Railway Compatibility**: Auto-converts Railway `postgres://` URLs to `postgresql://` required by SQLAlchemy 2.0.
- **CORS Configured**: Allows Cloudflare Pages (`*.pages.dev`) and local dev environments (`localhost:5173`, `localhost:3000`).
- **Health Checks**: `/api/v1/health` verifies both API responsiveness and live database connectivity.

## Project Structure
```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── categories.py
│   │       │   ├── furniture.py
│   │       │   ├── health.py
│   │       │   └── inquiries.py
│   │       └── api.py
│   ├── core/
│   │   ├── config.py
│   │   └── database.py
│   ├── models/
│   │   ├── category.py
│   │   ├── furniture.py
│   │   └── inquiry.py
│   ├── schemas/
│   │   ├── category.py
│   │   ├── furniture.py
│   │   └── inquiry.py
│   ├── main.py
│   └── seed.py
├── Dockerfile
├── Procfile
├── railway.json
├── requirements.txt
└── .env.example
```

## Running Locally

1. Create a Python virtual environment and activate it:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

4. Open Swagger UI documentation:
   [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Deploying to Railway (with PostgreSQL)

### Step 1: Push Code to GitHub
Ensure this repository is pushed to your GitHub account.

### Step 2: Create Railway Project
1. Go to [railway.com](https://railway.com) and create a **New Project**.
2. Click **Provision PostgreSQL** to add a managed PostgreSQL database.

### Step 3: Deploy the FastAPI Service
1. In the same Railway project, click **New Service** -> **GitHub Repo** -> Select this repository.
2. Under service settings:
   - **Root Directory**: `backend`
3. Link PostgreSQL:
   - In your FastAPI service -> **Variables**, add:
     - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}` (or reference the Postgres plugin)
     - `CORS_ORIGINS`: `https://your-app.pages.dev,http://localhost:5173`
4. Under **Settings** -> **Networking**, click **Generate Domain** (e.g. `shree-vinayaka-backend-production.up.railway.app`).

### Step 4: Verify Deployment
Visit:
`https://<your-railway-domain>/api/v1/health`
and
`https://<your-railway-domain>/docs`
