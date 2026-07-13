import { AppVersion, User, Feedback } from './types';

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('khataindex_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function checkAuth(): Promise<User | null> {
  const token = localStorage.getItem('khataindex_token');
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      localStorage.removeItem('khataindex_token');
      return null;
    }
    const data = await res.json();
    return data.user;
  } catch (error) {
    console.error('Error verifying token', error);
    return null;
  }
}

export async function login(loginIdentifier: string, password: string): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginIdentifier, password }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Login failed');
  }

  const data = await res.json();
  localStorage.setItem('khataindex_token', data.token);
  return data;
}

export async function register(username: string, email: string, password: string): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Registration failed');
  }

  const data = await res.json();
  localStorage.setItem('khataindex_token', data.token);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getHeaders(),
    });
  } catch (e) {
    console.error('Error logging out on backend', e);
  }
  localStorage.removeItem('khataindex_token');
}

export async function getVersions(): Promise<AppVersion[]> {
  const res = await fetch(`${API_BASE}/versions`);
  if (!res.ok) {
    throw new Error('Failed to fetch versions');
  }
  return res.json();
}

export async function uploadVersion(
  versionString: string,
  versionCode: number,
  releaseNotes: string,
  filename: string,
  fileBase64: string,
  fileSize: string
): Promise<AppVersion> {
  const res = await fetch(`${API_BASE}/versions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      versionString,
      versionCode,
      releaseNotes,
      filename,
      fileBase64,
      fileSize,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to upload version');
  }

  return res.json();
}

export async function deleteVersion(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/versions/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to delete version');
  }
}

export function getDownloadUrl(id: string): string {
  const token = localStorage.getItem('khataindex_token') || '';
  return `${API_BASE}/versions/${id}/download?token=${encodeURIComponent(token)}`;
}

// Custom fetch for trigger direct file downloads since we want it authorized
export async function downloadFile(id: string, filename: string): Promise<void> {
  const res = await fetch(`${API_BASE}/versions/${id}/download`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Please login to download the application.');
    }
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to download file');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function updateProfile(username: string, email: string, password?: string): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ username, email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to update profile');
  }

  const data = await res.json();
  return data.user;
}

export async function submitFeedback(type: string, message: string): Promise<Feedback> {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ type, message }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to submit feedback');
  }

  return res.json();
}

export async function getFeedbacks(): Promise<Feedback[]> {
  const res = await fetch(`${API_BASE}/feedback`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to fetch feedback list');
  }

  return res.json();
}

export async function getAppSettings(): Promise<{ screenshotUrl?: string }> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) {
    throw new Error('Failed to fetch settings');
  }
  return res.json();
}

export async function updateAppSettings(screenshotUrl: string | null): Promise<{ screenshotUrl?: string }> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ screenshotUrl }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to update settings');
  }

  return res.json();
}
