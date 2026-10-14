# End-to-End Deployment Guide: Cloudflare Pages + Railway (FastAPI + PostgreSQL)

This guide walks you through deploying **Shree Vinayaka Furnitures**:
- **Backend & Database**: FastAPI + Managed PostgreSQL on **Railway**
- **Frontend**: Vite + React + TypeScript on **Cloudflare Pages**
- **Live Connection**: Connecting Cloudflare Pages to the Railway API without CORS or routing issues.

---

## Part 1: Deploy Backend & PostgreSQL on Railway

### 1. Push Code to GitHub
Make sure this repository is pushed to your GitHub account:
```bash
git init
git add .
git commit -m "Initial commit for Shree Vinayaka Furnitures"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

### 2. Create Project & Add PostgreSQL on Railway
1. Go to [railway.com](https://railway.com/) and log in.
2. Click **New Project** -> **Provision PostgreSQL**.
3. Railway will provision a managed PostgreSQL database.
4. Click on the PostgreSQL card -> **Variables** tab to see your `DATABASE_URL`.

### 3. Deploy the FastAPI Service on Railway
1. In the same Railway project, click **Create** / **New Service** -> **GitHub Repo**.
2. Select your repository.
3. In the service settings:
   - Go to **Settings** -> **Root Directory**: Set this to `backend`.
4. Connect PostgreSQL Database:
   - Go to the **Variables** tab of your FastAPI service.
   - Add variable:
     - `DATABASE_URL`: Click **Add Reference** and select `Postgres.DATABASE_URL` (or paste `${{Postgres.DATABASE_URL}}`).
     - `CORS_ORIGINS`: `https://*.pages.dev,http://localhost:5173` (allows any Cloudflare Pages domain).
5. Generate Public Domain:
   - Go to **Settings** -> **Networking** -> Click **Generate Domain**.
   - You will receive a domain like:
     `https://shree-vinayaka-backend-production.up.railway.app`

### 4. Verify Backend is Live
Open the following URLs in your browser:
- `https://<your-railway-domain>/api/v1/health` ➔ Should return `{"status": "ok", "database": "healthy"}`
- `https://<your-railway-domain>/docs` ➔ Interactive Swagger API documentation

---

## Part 2: Deploy Frontend to Cloudflare Pages

### Option A: Via Cloudflare Dashboard (Recommended for Continuous Deployment)
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com/).
2. In the sidebar, click **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
3. Select your GitHub repository.
4. Set up the build configuration:
   - **Project Name**: `shree-vinayaka-furnitures`
   - **Production branch**: `main`
   - **Framework preset**: `Vite`
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. **Add Environment Variable** (This connects Cloudflare Pages to Railway):
   - Under **Environment variables (advanced)**, add:
     - **Variable name**: `VITE_API_URL`
     - **Value**: `https://<your-railway-domain>/api/v1`
       *(Example: `https://shree-vinayaka-backend-production.up.railway.app/api/v1`)*
6. Click **Save and Deploy**.

### Option B: Via Wrangler CLI
From your terminal:
```bash
cd frontend
npm run build
npx wrangler pages deploy dist --project-name shree-vinayaka-furnitures
```
Set the environment variable in Cloudflare Dashboard -> Your Pages Project -> **Settings** -> **Environment variables** -> Add `VITE_API_URL = https://<your-railway-domain>/api/v1`.

---

## Part 3: How the Connection Works (Pre-Configured)

| Feature | How It Is Handled | File Location |
|---|---|---|
| **CORS Access** | FastAPI allows `*.pages.dev` via regex middleware, so Cloudflare never encounters CORS blocks. | [`backend/app/main.py`](file:///c:/Users/rakes/shree%20vinayaka%20furnitures/backend/app/main.py) |
| **Railway Postgres URL** | Automatically normalizes Railway's `postgres://` to `postgresql://` required by SQLAlchemy 2.0. | [`backend/app/core/config.py`](file:///c:/Users/rakes/shree%20vinayaka%20furnitures/backend/app/core/config.py) |
| **Port Binding** | Railway sets dynamic `$PORT`; Procfile and Dockerfile read `${PORT:-8000}` automatically. | [`backend/Procfile`](file:///c:/Users/rakes/shree%20vinayaka%20furnitures/backend/Procfile) |
| **Cloudflare SPA Routing** | `/* /index.html 200` prevents 404 errors on page reloads or deep links on Cloudflare Pages. | [`frontend/public/_redirects`](file:///c:/Users/rakes/shree%20vinayaka%20furnitures/frontend/public/_redirects) |
| **API Client** | Reads `import.meta.env.VITE_API_URL` set in Cloudflare, with fallback to local API. | [`frontend/src/api/client.ts`](file:///c:/Users/rakes/shree%20vinayaka%20furnitures/frontend/src/api/client.ts) |
| **Auto-Seeding** | On first startup with PostgreSQL, the backend seeds realistic categories and furniture items. | [`backend/app/seed.py`](file:///c:/Users/rakes/shree%20vinayaka%20furnitures/backend/app/seed.py) |

---

## Part 4: Testing the End-to-End Flow

1. Open your live Cloudflare Pages URL (e.g. `https://shree-vinayaka-furnitures.pages.dev`).
2. Notice the top status bar:
   - It will show a green dot with **FastAPI + PostgreSQL Online (healthy)** when connected to your Railway backend.
3. Browse furniture items (fetched live from Railway PostgreSQL).
4. Click **Inquire / Quote** on any furniture piece and submit an inquiry.
   - The quote request is saved directly into the PostgreSQL `inquiries` table on Railway!
5. Verify inquiries on Railway by visiting `https://<your-railway-domain>/docs#/Inquiries/list_inquiries_api_v1_inquiries__get`.
