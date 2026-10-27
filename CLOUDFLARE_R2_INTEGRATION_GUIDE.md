# Cloudflare R2 Object Storage Integration Guide

## Overview
This document outlines the architecture, environment variables, API endpoints, and client-side upload pipeline implemented for the **Furniture Projects Portfolio** on the `/project` route (`https://srivinayakafurnitures.pages.dev/project`).

---

## 1. Architecture

```
[ Frontend: Cloudflare Pages (/project) ]
       │
       ├─ (1) POST /api/projects/presigned-url ──► [ FastAPI on Railway ]
       │                                                   │
       │  ◄── (2) presigned_upload_url (PUT, 1hr S3v4) ────┤ (generates key via boto3)
       │          + public_image_url                       │
       │
       ├─ (3) Direct HTTP PUT file ───────────────────────► [ Cloudflare R2 Bucket ]
       │      (with Content-Type: image/jpeg)                   (Global Edge, $0 Egress)
       │
       └─ (4) POST /api/projects ─────────────────────────► [ FastAPI on Railway ]
              (payload with metadata + public_image_url)           │
                                                                   ▼
                                                          [ PostgreSQL (Railway) ]
                                                           (furniture_projects table)
```

### Key Advantages:
1. **Zero-Latency Direct Edge Upload**: Multi-megabyte image binaries are uploaded directly from the client's browser to Cloudflare R2's global edge without congesting the Railway server's RAM or CPU.
2. **Zero Egress Fees**: Unlike AWS S3, Cloudflare R2 charges **$0 in data egress fees**.
3. **Database Consistency**: PostgreSQL only stores lightweight metadata, public CDN image URLs, and the R2 file keys.
4. **Synchronized Object Cleanup**: When `DELETE /api/projects/{id}` is executed, `boto3` purges the file from the R2 bucket and removes the record from PostgreSQL in the same operation.

---

## 2. Environment Variables

Configure these variables in your **Railway Project Settings**:

| Variable | Description | Example / Recommended Value |
|---|---|---|
| `R2_ACCOUNT_ID` | Cloudflare Account ID | `9a7b6c5d4e3f2a1b0c9d8e7f` |
| `R2_ACCESS_KEY_ID` | R2 S3-Compatible Access Key | `0123456789abcdef0123456789abcdef` |
| `R2_SECRET_ACCESS_KEY` | R2 S3-Compatible Secret Key | `fedcba9876543210fedcba9876543210fedcba98...` |
| `R2_BUCKET_NAME` | Name of your R2 bucket | `svf-store-backups` |
| `R2_PUBLIC_URL` | Public bucket domain or custom CDN domain | `https://pub-xxxxxx.r2.dev` or `https://cdn.srivinayakafurnitures.com` |

---

## 3. Cloudflare R2 Bucket CORS Policy

To allow browsers on `https://srivinayakafurnitures.pages.dev` and local development to upload directly to your R2 bucket via `PUT`, configure the following CORS rule in:
**Cloudflare Dashboard** ➔ **R2 Object Storage** ➔ Select Bucket ➔ **Settings** ➔ **CORS Policy**:

```json
[
  {
    "AllowedOrigins": [
      "https://srivinayakafurnitures.pages.dev",
      "https://shree-vinayaka-furnitures.pages.dev",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

---

## 4. API Endpoints

All endpoints are dual-mounted on both `/api/projects` and `/api/v1/projects`:

### 1. `POST /api/projects/presigned-url`
- **Request Body**:
  ```json
  {
    "filename": "Modern_Teakwood_Sofa.jpg",
    "content_type": "image/jpeg"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "presigned_upload_url": "https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com/<R2_BUCKET_NAME>/projects/abc12345-Modern_Teakwood_Sofa.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&...",
    "public_image_url": "https://pub-xxxxxx.r2.dev/projects/abc12345-Modern_Teakwood_Sofa.jpg",
    "r2_file_key": "projects/abc12345-Modern_Teakwood_Sofa.jpg"
  }
  ```

### 2. `POST /api/projects`
- **Request Body**:
  ```json
  {
    "title": "Royal Heritage Teakwood Living Suite",
    "description": "Solid Burma Teak 3+1+1 sofa with fluted accents.",
    "category": "Living Room",
    "r2_file_key": "projects/abc12345-Modern_Teakwood_Sofa.jpg",
    "image_url": "https://pub-xxxxxx.r2.dev/projects/abc12345-Modern_Teakwood_Sofa.jpg",
    "client_name": "Brigade Gateway Penthouse",
    "location": "Bengaluru, Karnataka",
    "is_featured": true
  }
  ```
- **Response (201 Created)**: Returns the newly persisted project with auto-assigned `id` and `created_at`.

### 3. `GET /api/projects`
- **Query Parameters**:
  - `category`: (Optional) e.g. `Living Room`, `Bedroom`, `Modular Kitchen`
  - `search`: (Optional) keyword filtering across titles, descriptions, and clients
- **Response (200 OK)**: Array of project items ordered newest first.

### 4. `DELETE /api/projects/{id}`
- **Response (200 OK)**:
  ```json
  {
    "status": "SUCCESS",
    "message": "Project 'Royal Heritage Teakwood Living Suite' and Cloudflare R2 storage asset deleted successfully",
    "id": 1,
    "r2_file_key": "projects/abc12345-Modern_Teakwood_Sofa.jpg",
    "r2_deleted": true
  }
  ```

---

## 5. Frontend Navigation

- **Direct URL**: `https://srivinayakafurnitures.pages.dev/project` or `http://localhost:5173/project`
- **ERP Ribbon**: Click the **☁️ Projects (R2)** button in the top desktop ribbon to switch to the projects showcase.
- **Back Button**: Click **💻 Showroom POS & ERP** to return seamlessly to the ERP desktop.
