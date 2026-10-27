import { apiFetch, notifyApiError, notifyApiSuccess } from './client';
import type { FurnitureProject, PresignedUrlResponse, ProjectCreatePayload } from '../types/project';

const getProjectsBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    const base = import.meta.env.VITE_API_URL.replace(/\/$/, '');
    return `${base}/projects`;
  }
  // When running on Cloudflare Pages, route through the Cloudflare edge proxy /api/projects
  if (typeof window !== 'undefined' && window.location.hostname.includes('pages.dev')) {
    return '/api/projects';
  }
  return 'http://localhost:8000/api/projects';
};

const BASE_URL = getProjectsBaseUrl();

/**
 * Fetch all furniture projects from PostgreSQL with optional category filtering or search keyword.
 */
export const fetchProjects = async (params?: { category?: string; search?: string }): Promise<FurnitureProject[]> => {
  try {
    const url = new URL(BASE_URL, window.location.origin);
    if (params?.category && params.category !== 'All Projects') {
      url.searchParams.set('category', params.category);
    }
    if (params?.search && params.search.trim()) {
      url.searchParams.set('search', params.search.trim());
    }

    const response = await apiFetch(url.toString(), { method: 'GET' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    notifyApiError('Failed to load furniture projects from server', error);
    throw error;
  }
};

/**
 * Request a 1-hour secure Pre-Signed PUT URL and public CDN image URL from FastAPI.
 */
export const getProjectPresignedUrl = async (
  filename: string,
  contentType: string
): Promise<PresignedUrlResponse> => {
  try {
    const url = `${BASE_URL}/presigned-url`;
    const response = await apiFetch(url, {
      method: 'POST',
      body: JSON.stringify({
        filename,
        content_type: contentType || 'image/jpeg'
      })
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.detail || `HTTP ${response.status}: Failed to generate R2 upload URL`);
    }

    return await response.json();
  } catch (error: any) {
    notifyApiError('Could not obtain Cloudflare R2 presigned upload URL', error);
    throw error;
  }
};

/**
 * Upload the file directly from the browser to Cloudflare R2 using an HTTP PUT request.
 * Streams bytes straight to Cloudflare's Global Network without routing heavy payloads through Railway.
 */
export const uploadFileToR2 = async (
  presignedUploadUrl: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presignedUploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type || 'image/jpeg');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new Error(
            `Direct Cloudflare R2 upload rejected with HTTP status ${xhr.status} (${xhr.statusText})`
          )
        );
      }
    };

    xhr.onerror = () => {
      reject(
        new Error(
          'Network or CORS error encountered while uploading to Cloudflare R2. Ensure R2 bucket CORS allows PUT from this domain.'
        )
      );
    };

    xhr.send(file);
  });
};

/**
 * Save project metadata + public_image_url + r2_file_key into PostgreSQL.
 */
export const createProject = async (payload: ProjectCreatePayload): Promise<FurnitureProject> => {
  try {
    const response = await apiFetch(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.detail || `HTTP ${response.status}: Failed to save project record`);
    }

    const created: FurnitureProject = await response.json();
    notifyApiSuccess(`Project "${created.title}" successfully published to Cloudflare R2 & catalog!`);
    return created;
  } catch (error: any) {
    notifyApiError('Failed to record project in database', error);
    throw error;
  }
};

/**
 * Delete a project: purges the object from Cloudflare R2 via boto3 and removes the row from PostgreSQL.
 */
export const deleteProject = async (
  id: number
): Promise<{ status: string; message: string; id: number }> => {
  try {
    const response = await apiFetch(`${BASE_URL}/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.detail || `HTTP ${response.status}: Failed to delete project`);
    }

    const result = await response.json();
    notifyApiSuccess('Project and Cloudflare R2 storage asset deleted successfully');
    return result;
  } catch (error: any) {
    notifyApiError('Could not delete project from storage', error);
    throw error;
  }
};
