const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const config = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'BurnDrop',
  apiUrl: rawApiUrl.replace(/\/+$/, ''),
  maxFileSizeMb: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || '1024', 10),
  fileExpirationHours: parseInt(process.env.NEXT_PUBLIC_FILE_EXPIRATION_HOURS || '3', 10),
  instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '',
  xUrl: process.env.NEXT_PUBLIC_X_URL || '',
  linkedinUrl: process.env.NEXT_PUBLIC_LINKEDIN_URL || '',
  githubUrl: process.env.NEXT_PUBLIC_GITHUB_URL || '',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '',
};

export const maxFileSizeBytes = config.maxFileSizeMb * 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0))} ${sizes[i]}`;
}

export function formatExpiryCountdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toUpperCase();
  return ext || 'FILE';
}
