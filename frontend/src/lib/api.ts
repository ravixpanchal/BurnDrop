import { config } from './config';

export interface ShareCreateResponse {
  code: string;
  filename: string;
  size_bytes: number;
  expires_at: string;
  email_sent: boolean;
}

export interface ShareFileItem {
  id: string;
  filename: string;
  size_bytes: number;
  mime_type: string | null;
  can_preview: boolean;
}

export interface VerifyCodeResponse {
  access_token: string;
  filename: string;
  size_bytes: number;
  mime_type: string | null;
  expires_at: string;
  can_preview: boolean;
  files: ShareFileItem[];
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = 'An error occurred';
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      // ignore
    }
    throw new ApiError(response.status, detail);
  }
  return response.json();
}

export function uploadFiles(
  files: File | File[],
  email: string,
  onProgress: (percent: number, loaded: number, total: number) => void,
): Promise<ShareCreateResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    const fileList = Array.isArray(files) ? files : [files];
    fileList.forEach((f) => {
      const relPath = (f as any).webkitRelativePath || f.name;
      formData.append('files', f, relPath);
    });
    formData.append('email', email);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100), e.loaded, e.total);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        let detail = 'Upload failed';
        try {
          const res = JSON.parse(xhr.responseText);
          if (typeof res.detail === 'string') {
            detail = res.detail;
          } else if (Array.isArray(res.detail)) {
            detail = res.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
          }
        } catch {
          // ignore
        }
        reject(new ApiError(xhr.status, detail));
      }
    });

    xhr.addEventListener('error', () => {
      let detail = 'Network error. Please check your server connection.';
      try {
        if (xhr.responseText) {
          const res = JSON.parse(xhr.responseText);
          detail = typeof res.detail === 'string' ? res.detail : detail;
        }
      } catch {
        // ignore
      }
      if (xhr.status && xhr.status !== 0) {
        detail = `Server error (${xhr.status}). ${detail}`;
      }
      reject(new ApiError(xhr.status || 0, detail));
    });
    xhr.addEventListener('abort', () => reject(new ApiError(0, 'Upload cancelled')));

    xhr.open('POST', `${config.apiUrl}/api/shares`);
    xhr.send(formData);
  });
}

export function uploadFile(
  file: File,
  email: string,
  onProgress: (percent: number, loaded: number, total: number) => void,
): Promise<ShareCreateResponse> {
  return uploadFiles(file, email, onProgress);
}

export async function verifyCode(code: string): Promise<VerifyCodeResponse> {
  const response = await fetch(`${config.apiUrl}/api/shares/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  return handleResponse(response);
}

export function getDownloadUrl(fileId?: string, downloadAll?: boolean): string {
  const params = new URLSearchParams();
  if (fileId) params.append('file_id', fileId);
  if (downloadAll) params.append('download_all', 'true');
  const qs = params.toString();
  return `${config.apiUrl}/api/shares/access/download${qs ? `?${qs}` : ''}`;
}

export function getViewUrl(fileId?: string): string {
  const params = new URLSearchParams();
  if (fileId) params.append('file_id', fileId);
  const qs = params.toString();
  return `${config.apiUrl}/api/shares/access/view${qs ? `?${qs}` : ''}`;
}

export async function fetchWithAuth(url: string, accessToken: string): Promise<Response> {
  return fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function downloadFile(
  accessToken: string,
  filename: string,
  fileId?: string,
  downloadAll?: boolean,
): Promise<void> {
  const url = getDownloadUrl(fileId, downloadAll);
  const response = await fetchWithAuth(url, accessToken);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body.detail || 'Download failed');
  }
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

export async function openPreview(accessToken: string, fileId?: string): Promise<void> {
  const url = getViewUrl(fileId);
  const response = await fetchWithAuth(url, accessToken);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body.detail || 'Preview failed');
  }
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
}
