# Shree Vinayaka Furnitures

Modern full-stack web application for **Shree Vinayaka Furnitures & Teak Wood Works**.

## Tech Stack & Architecture

| Layer | Technology | Deployment Platform |
|---|---|---|
| **Frontend** | Vite, React 19, TypeScript, Vanilla CSS Design System | **Cloudflare Pages** |
| **Backend** | FastAPI (Python 3.11+), Pydantic v2 | **Railway Cloud Server** |
| **Database** | PostgreSQL (with SQLAlchemy 2.0 ORM) | **Railway Managed PostgreSQL** |

```
shree vinayaka furnitures/
├── backend/                  # FastAPI & PostgreSQL Backend (Railway)
│   ├── app/
│   │   ├── api/v1/           # Modular endpoints (furniture, categories, inquiries, health)
│   │   ├── core/             # Configuration & DB connection pool
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── main.py           # FastAPI entrypoint & CORS
│   │   └── seed.py           # Initial database populator
│   ├── Dockerfile            # Railway Docker container
│   ├── Procfile              # Railway start command
│   ├── railway.json          # Railway service deployment config
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # Vite + React + TS Frontend (Cloudflare Pages)
│   ├── public/
│   │   └── _redirects        # Cloudflare Pages SPA rewrite rule
│   ├── src/
│   │   ├── api/client.ts     # Typed API client with graceful fallback
│   │   ├── App.tsx           # Interactive furniture catalog & quote modal
│   │   └── index.css         # Artisanal teak wood design system
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

## Quickstart (Local Development)

### 1. Start FastAPI Backend
```bash
cd backend
python -m venv .venv
# Activate:
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### 2. Start Vite Frontend
In another terminal:
```bash
cd frontend
npm install
npm run dev
```
- App: [http://localhost:5173/](http://localhost:5173/)

---

## Production Deployment

### 1. Backend & PostgreSQL on Railway
1. Push this repository to GitHub.
2. In [Railway](https://railway.com), create a new project and add **PostgreSQL**.
3. Add a new service from your GitHub repo, setting **Root Directory** to `backend`.
4. Link `DATABASE_URL` variable to `${{Postgres.DATABASE_URL}}`.
5. Set `CORS_ORIGINS` to `https://<your-cloudflare-pages-domain>.pages.dev`.
6. Generate a public domain in Railway Networking settings.

### 2. Frontend on Cloudflare Pages
1. In [Cloudflare Dashboard](https://dash.cloudflare.com/), go to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
2. Select your repository with settings:
   - **Root directory**: `frontend`
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
3. In **Settings** -> **Environment variables**, add:
   - `VITE_API_URL`: `https://<your-railway-app-domain>/api/v1`
4. Deploy!
