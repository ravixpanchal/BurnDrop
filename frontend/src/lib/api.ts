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

async function uploadFilesMultipart(
  fileList: File[],
  email: string,
  onProgress: (percent: number, loaded: number, total: number) => void,
): Promise<ShareCreateResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
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

export async function uploadFiles(
  files: File | File[],
  email: string,
  onProgress: (percent: number, loaded: number, total: number) => void,
): Promise<ShareCreateResponse> {
  const fileList = Array.isArray(files) ? files : [files];
  if (fileList.length === 0) {
    throw new ApiError(400, 'No files provided');
  }

  try {
    const presignedReqBody = {
      email,
      files: fileList.map((f) => ({
        filename: (f as any).webkitRelativePath || f.name,
        size_bytes: f.size,
        mime_type: f.type || null,
      })),
    };

    const presignedRes = await fetch(`${config.apiUrl}/api/shares/presigned`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(presignedReqBody),
    });

    if (presignedRes.ok) {
      const presignedData = await presignedRes.json();
      if (
        presignedData.direct_upload_supported &&
        Array.isArray(presignedData.upload_urls) &&
        presignedData.upload_urls.length === fileList.length
      ) {
        const totalSize = fileList.reduce((acc, f) => acc + f.size, 0);
        const loadedBytes = new Array(fileList.length).fill(0);

        const uploadPromises = fileList.map((file, idx) => {
          const item = presignedData.upload_urls[idx];
          return new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                loadedBytes[idx] = e.loaded;
                const grandTotalLoaded = loadedBytes.reduce((a, b) => a + b, 0);
                const percent = Math.min(100, Math.round((grandTotalLoaded / totalSize) * 100));
                onProgress(percent, grandTotalLoaded, totalSize);
              }
            });

            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                loadedBytes[idx] = file.size;
                const grandTotalLoaded = loadedBytes.reduce((a, b) => a + b, 0);
                const percent = Math.min(100, Math.round((grandTotalLoaded / totalSize) * 100));
                onProgress(percent, grandTotalLoaded, totalSize);
                resolve();
              } else {
                reject(new ApiError(xhr.status, `Direct upload to cloud storage failed for ${file.name}`));
              }
            });

            xhr.addEventListener('error', () => {
              reject(new ApiError(0, `Network error uploading ${file.name} to cloud storage`));
            });

            xhr.open('PUT', item.upload_url);
            if (file.type) {
              xhr.setRequestHeader('Content-Type', file.type);
            }
            xhr.send(file);
          });
        });

        await Promise.all(uploadPromises);

        const completeRes = await fetch(`${config.apiUrl}/api/shares/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            share_id: presignedData.share_id,
            email: email,
            files: presignedData.upload_urls.map((u: any) => ({
              file_id: u.file_id,
              filename: u.filename,
              size_bytes: u.size_bytes,
              mime_type: u.mime_type,
              storage_key: u.storage_key,
            })),
          }),
        });

        return handleResponse<ShareCreateResponse>(completeRes);
      }
    }
  } catch (err) {
    if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
      throw err;
    }
  }

  return uploadFilesMultipart(fileList, email, onProgress);
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
