# Shree Vinayaka Furnitures - Frontend (Vite + React + TS)

This frontend application is built with Vite, React 19, TypeScript, and Vanilla CSS design system, designed for deployment on **Cloudflare Pages**.

## Cloudflare Pages Deployment Guide

### Method 1: Git Integration (Recommended)
1. Push this repository to your GitHub account.
2. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), navigate to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
3. Select your repository.
4. Configure the build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `frontend`
5. Environment Variables:
   - Go to **Settings** -> **Environment variables**
   - Add:
     - `VITE_API_URL`: `https://<your-railway-backend-domain>/api/v1`
6. Click **Save and Deploy**.

### SPA Routing on Cloudflare Pages
The `public/_redirects` file is pre-configured with:
```
/*    /index.html   200
```
This ensures direct link navigation and browser reloads work without 404 errors.

---

### Method 2: Direct Wrangler CLI Deployment
```bash
cd frontend
npm run build
npx wrangler pages deploy dist --project-name shree-vinayaka-furnitures
```

---

## Local Development
```bash
cd frontend
npm install
npm run dev
```
Dev server will start at: `http://localhost:5173/`
