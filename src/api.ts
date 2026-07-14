import { AppVersion, User, Feedback } from './types';

const API_BASE = '/api';

// --- Client-side Sandbox Database Fallback ---
const DEFAULT_VERSIONS: AppVersion[] = [
  {
    id: 'v1-0-0',
    versionString: '1.0.0',
    versionCode: 1,
    releaseNotes: 'Initial stable release of KhataIndex.\n- Lightweight ledger tracking\n- Instant calculation of accounts\n- Beautiful minimalist dark UI',
    fileSize: '8.5 MB',
    filename: 'KhataIndex-v1.0.0.apk',
    downloadCount: 154,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'v1-1-0',
    versionString: '1.1.0',
    versionCode: 2,
    releaseNotes: 'Performance upgrade and bug fixes.\n- Reduced APK bundle size by 15%\n- Added backup and restore triggers\n- Fixed alignment issues on wider screen devices',
    fileSize: '7.2 MB',
    filename: 'KhataIndex-v1.1.0.apk',
    downloadCount: 89,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

const DEFAULT_ADMIN: User = {
  id: 'admin-subhajit',
  username: 'Subhajit Roy',
  email: 'subhajit@khataindex.com',
  role: 'admin',
  createdAt: new Date().toISOString()
};

let useLocalFallback = localStorage.getItem('khataindex_forced_local_fallback') === 'true';

export function isUsingLocalFallback(): boolean {
  return useLocalFallback;
}

export function setUsingLocalFallback(val: boolean) {
  if (useLocalFallback !== val) {
    useLocalFallback = val;
    localStorage.setItem('khataindex_forced_local_fallback', val ? 'true' : 'false');
    window.dispatchEvent(new Event('khataindex_fallback_changed'));
    console.warn(`[KhataIndex] Switched fallback mode to: ${val ? 'LOCAL SANDBOX' : 'REMOTE API'}`);
  }
}

function getLocalUsers(): User[] {
  const data = localStorage.getItem('khataindex_local_users');
  if (!data) {
    const list = [DEFAULT_ADMIN];
    localStorage.setItem('khataindex_local_users', JSON.stringify(list));
    return list;
  }
  return JSON.parse(data);
}

function saveLocalUsers(users: User[]) {
  localStorage.setItem('khataindex_local_users', JSON.stringify(users));
}

function getLocalPasswords(): Record<string, string> {
  const data = localStorage.getItem('khataindex_local_passwords');
  if (!data) {
    const list = {
      'subhajit@khataindex.com': 'Subhajit#123',
      'subhajit roy': 'Subhajit#123'
    };
    localStorage.setItem('khataindex_local_passwords', JSON.stringify(list));
    return list;
  }
  return JSON.parse(data);
}

function saveLocalPassword(identifier: string, pass: string) {
  const passes = getLocalPasswords();
  passes[identifier.toLowerCase()] = pass;
  localStorage.setItem('khataindex_local_passwords', JSON.stringify(passes));
}

function getLocalVersions(): AppVersion[] {
  const data = localStorage.getItem('khataindex_local_versions');
  if (!data) {
    localStorage.setItem('khataindex_local_versions', JSON.stringify(DEFAULT_VERSIONS));
    return DEFAULT_VERSIONS;
  }
  return JSON.parse(data);
}

function saveLocalVersions(vers: AppVersion[]) {
  localStorage.setItem('khataindex_local_versions', JSON.stringify(vers));
}

function getLocalFeedbacks(): Feedback[] {
  const data = localStorage.getItem('khataindex_local_feedbacks');
  return data ? JSON.parse(data) : [];
}

function saveLocalFeedbacks(feedbacks: Feedback[]) {
  localStorage.setItem('khataindex_local_feedbacks', JSON.stringify(feedbacks));
}

function getLocalSettings(): { screenshotUrl?: string } {
  const data = localStorage.getItem('khataindex_local_settings');
  return data ? JSON.parse(data) : {};
}

function saveLocalSettings(settings: { screenshotUrl?: string }) {
  localStorage.setItem('khataindex_local_settings', JSON.stringify(settings));
}

// Ensure local fallback states are initialized
getLocalUsers();
getLocalPasswords();
getLocalVersions();

// --- HTTP Helpers ---
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

async function safeJson(res: Response): Promise<any> {
  try {
    const text = await res.text();
    if (!text || text.trim() === '') {
      return {};
    }
    return JSON.parse(text);
  } catch (err) {
    console.error('Failed to parse JSON response safely:', err);
    return {};
  }
}

// --- API Service Exports ---

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) {
      const data = await safeJson(res);
      return data?.status === 'ok';
    }
    return false;
  } catch (err) {
    console.warn('Backend connection health check failed:', err);
    return false;
  }
}

export async function checkAuth(): Promise<User | null> {
  const token = localStorage.getItem('khataindex_token');
  if (!token) return null;

  if (useLocalFallback) {
    const users = getLocalUsers();
    const user = users.find(u => u.id === token || `local_token_${u.email}` === token || `local_token_${u.username}` === token);
    return user || null;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      if (res.status === 404) {
        setUsingLocalFallback(true);
        return checkAuth();
      }
      localStorage.removeItem('khataindex_token');
      return null;
    }
    const data = await safeJson(res);
    return data?.user || null;
  } catch (error) {
    console.warn('Backend server is unreachable. Gracefully fallback to client-side localStorage db.');
    setUsingLocalFallback(true);
    return checkAuth();
  }
}

export async function login(loginIdentifier: string, password: string): Promise<{ user: User; token: string }> {
  if (useLocalFallback) {
    const users = getLocalUsers();
    const passwords = getLocalPasswords();
    const identifierLower = loginIdentifier.trim().toLowerCase();
    
    const user = users.find(u => u.email.toLowerCase() === identifierLower || u.username.toLowerCase() === identifierLower);
    if (!user) {
      throw new Error('Invalid credentials or user not found in local sandbox.');
    }
    
    const expectedPassword = passwords[user.email.toLowerCase()] || passwords[user.username.toLowerCase()];
    if (expectedPassword !== password) {
      throw new Error('Incorrect password. (Tip: Try Subhajit#123 for Subhajit Roy)');
    }
    
    const token = `local_token_${user.email}`;
    localStorage.setItem('khataindex_token', token);
    return { user, token };
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginIdentifier, password }),
    });

    if (!res.ok) {
      if (res.status === 404) {
        setUsingLocalFallback(true);
        return login(loginIdentifier, password);
      }
      const errorData = await safeJson(res);
      throw new Error(errorData.error || 'Login failed');
    }

    const data = await safeJson(res);
    localStorage.setItem('khataindex_token', data.token);
    return data;
  } catch (error: any) {
    if (error.message && error.message.includes('not found in local sandbox')) {
      throw error;
    }
    console.warn('Backend login endpoint unavailable. Switching to local sandbox database...');
    setUsingLocalFallback(true);
    return login(loginIdentifier, password);
  }
}

export async function register(username: string, email: string, password: string): Promise<{ user: User; token: string }> {
  if (useLocalFallback) {
    const users = getLocalUsers();
    const emailLower = email.trim().toLowerCase();
    
    if (users.some(u => u.email.toLowerCase() === emailLower)) {
      throw new Error('Email already registered in local database.');
    }
    
    const newUser: User = {
      id: `user_${Date.now()}`,
      username: username.trim(),
      email: email.trim(),
      role: 'user',
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveLocalUsers(users);
    saveLocalPassword(emailLower, password);
    
    const token = `local_token_${newUser.email}`;
    localStorage.setItem('khataindex_token', token);
    return { user: newUser, token };
  }

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
      if (res.status === 404) {
        setUsingLocalFallback(true);
        return register(username, email, password);
      }
      const errorData = await safeJson(res);
      throw new Error(errorData.error || 'Registration failed');
    }

    const data = await safeJson(res);
    localStorage.setItem('khataindex_token', data.token);
    return data;
  } catch (error: any) {
    if (error.message && error.message.includes('already registered')) {
      throw error;
    }
    console.warn('Backend register endpoint unavailable. Switching to local sandbox database...');
    setUsingLocalFallback(true);
    return register(username, email, password);
  }
}

export async function logout(): Promise<void> {
  if (useLocalFallback) {
    localStorage.removeItem('khataindex_token');
    return;
  }

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
  if (useLocalFallback) {
    return getLocalVersions();
  }

  try {
    const res = await fetch(`${API_BASE}/versions`);
    if (!res.ok) {
      if (res.status === 404) {
        setUsingLocalFallback(true);
        return getVersions();
      }
      throw new Error('Failed to fetch versions');
    }
    const data = await safeJson(res);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('Backend versions endpoint unavailable. Switching to local sandbox database...');
    setUsingLocalFallback(true);
    return getVersions();
  }
}

export async function uploadVersion(
  versionString: string,
  versionCode: number,
  releaseNotes: string,
  filename: string,
  fileBase64: string,
  fileSize: string
): Promise<AppVersion> {
  if (useLocalFallback) {
    const versions = getLocalVersions();
    const newVersion: AppVersion = {
      id: `v_${Date.now()}`,
      versionString,
      versionCode,
      releaseNotes,
      filename,
      fileSize,
      downloadCount: 0,
      createdAt: new Date().toISOString()
    };
    versions.unshift(newVersion);
    saveLocalVersions(versions);
    
    try {
      localStorage.setItem(`khataindex_apk_file_${newVersion.id}`, fileBase64);
    } catch (e) {
      console.warn('Could not save APK base64 in local storage due to quota limits, using mock simulator instead.', e);
    }
    
    return newVersion;
  }

  try {
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
      if (res.status === 404) {
        setUsingLocalFallback(true);
        return uploadVersion(versionString, versionCode, releaseNotes, filename, fileBase64, fileSize);
      }
      const errorData = await safeJson(res);
      throw new Error(errorData.error || 'Failed to upload version');
    }

    return safeJson(res);
  } catch (error) {
    console.warn('Backend upload endpoint unavailable. Saving version to local sandbox database...');
    setUsingLocalFallback(true);
    return uploadVersion(versionString, versionCode, releaseNotes, filename, fileBase64, fileSize);
  }
}

export async function deleteVersion(id: string): Promise<void> {
  if (useLocalFallback) {
    const versions = getLocalVersions();
    const filtered = versions.filter(v => v.id !== id);
    saveLocalVersions(filtered);
    localStorage.removeItem(`khataindex_apk_file_${id}`);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/versions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!res.ok) {
      if (res.status === 404) {
        setUsingLocalFallback(true);
        return deleteVersion(id);
      }
      const errorData = await safeJson(res);
      throw new Error(errorData.error || 'Failed to delete version');
    }
  } catch (error) {
    console.warn('Backend delete endpoint unavailable. Deleting version from local sandbox database...');
    setUsingLocalFallback(true);
    return deleteVersion(id);
  }
}

export function getDownloadUrl(id: string): string {
  if (useLocalFallback) {
    return '#';
  }
  const token = localStorage.getItem('khataindex_token') || '';
  return `${API_BASE}/versions/${id}/download?token=${encodeURIComponent(token)}`;
}

export async function downloadFile(id: string, filename: string): Promise<void> {
  if (useLocalFallback) {
    let base64 = localStorage.getItem(`khataindex_apk_file_${id}`);
    let blob: Blob;
    
    if (base64) {
      try {
        const binaryString = window.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: 'application/vnd.android.package-archive' });
      } catch (e) {
        blob = new Blob(['MOCK_APK_FILE_SANDBOX_FALLBACK'], { type: 'application/vnd.android.package-archive' });
      }
    } else {
      blob = new Blob(['MOCK_APK_FILE_SANDBOX_FALLBACK_DEFAULT'], { type: 'application/vnd.android.package-archive' });
    }
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    const versions = getLocalVersions();
    const ver = versions.find(v => v.id === id);
    if (ver) {
      ver.downloadCount = (ver.downloadCount || 0) + 1;
      saveLocalVersions(versions);
    }
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/versions/${id}/download`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      if (res.status === 404) {
        setUsingLocalFallback(true);
        return downloadFile(id, filename);
      }
      if (res.status === 401) {
        throw new Error('Please login to download the application.');
      }
      const errorData = await safeJson(res);
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
  } catch (error) {
    console.warn('Backend download endpoint unavailable. Launching client-side APK download simulator...');
    setUsingLocalFallback(true);
    return downloadFile(id, filename);
  }
}

export async function updateProfile(username: string, email: string, password?: string): Promise<User> {
  if (useLocalFallback) {
    const token = localStorage.getItem('khataindex_token');
    const users = getLocalUsers();
    const userIndex = users.findIndex(u => u.id === token || `local_token_${u.email}` === token || `local_token_${u.username}` === token);
    
    if (userIndex === -1) {
      throw new Error('User not found in local sandbox session. Please log in again.');
    }
    
    const user = users[userIndex];
    user.username = username.trim();
    user.email = email.trim();
    saveLocalUsers(users);
    
    if (password) {
      saveLocalPassword(user.email, password);
    }
    
    const newToken = `local_token_${user.email}`;
    localStorage.setItem('khataindex_token', newToken);
    
    return user;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
      if (res.status === 404) {
        setUsingLocalFallback(true);
        return updateProfile(username, email, password);
      }
      const errorData = await safeJson(res);
      throw new Error(errorData.error || 'Failed to update profile');
    }

    const data = await safeJson(res);
    return data.user;
  } catch (error) {
    console.warn('Backend profile update endpoint unavailable. Saving profile to local sandbox database...');
    setUsingLocalFallback(true);
    return updateProfile(username, email, password);
  }
}

export async function submitFeedback(type: string, message: string): Promise<Feedback> {
  if (useLocalFallback) {
    const feedbacks = getLocalFeedbacks();
    const token = localStorage.getItem('khataindex_token');
    const users = getLocalUsers();
    const currentUser = users.find(u => u.id === token || `local_token_${u.email}` === token || `local_token_${u.username}` === token);
    
    const newFeedback: Feedback = {
      id: `f_${Date.now()}`,
      userId: currentUser?.id || 'anonymous',
      username: currentUser?.username || 'Anonymous User',
      email: currentUser?.email || 'anonymous@khataindex.com',
      type,
      message,
      createdAt: new Date().toISOString()
    };
    
    feedbacks.push(newFeedback);
    saveLocalFeedbacks(feedbacks);
    return newFeedback;
  }

  try {
    const res = await fetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ type, message }),
    });

    if (!res.ok) {
      if (res.status === 404) {
        setUsingLocalFallback(true);
        return submitFeedback(type, message);
      }
      const errorData = await safeJson(res);
      throw new Error(errorData.error || 'Failed to submit feedback');
    }

    return safeJson(res);
  } catch (error) {
    console.warn('Backend feedback endpoint unavailable. Storing feedback in local sandbox database...');
    setUsingLocalFallback(true);
    return submitFeedback(type, message);
  }
}

export async function getFeedbacks(): Promise<Feedback[]> {
  if (useLocalFallback) {
    return getLocalFeedbacks();
  }

  try {
    const res = await fetch(`${API_BASE}/feedback`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      if (res.status === 404) {
        setUsingLocalFallback(true);
        return getFeedbacks();
      }
      const errorData = await safeJson(res);
      throw new Error(errorData.error || 'Failed to fetch feedback list');
    }

    const data = await safeJson(res);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('Backend feedback list endpoint unavailable. Fetching local sandbox feedback...');
    setUsingLocalFallback(true);
    return getFeedbacks();
  }
}

export async function getAppSettings(): Promise<{ screenshotUrl?: string }> {
  if (useLocalFallback) {
    return getLocalSettings();
  }

  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) {
      if (res.status === 404) {
        setUsingLocalFallback(true);
        return getAppSettings();
      }
      throw new Error('Failed to fetch settings');
    }
    return safeJson(res);
  } catch (error) {
    console.warn('Backend settings endpoint unavailable. Switching to local settings storage...');
    setUsingLocalFallback(true);
    return getAppSettings();
  }
}

export async function updateAppSettings(screenshotUrl: string | null): Promise<{ screenshotUrl?: string }> {
  if (useLocalFallback) {
    const settings = getLocalSettings();
    if (screenshotUrl) {
      settings.screenshotUrl = screenshotUrl;
    } else {
      delete settings.screenshotUrl;
    }
    saveLocalSettings(settings);
    return settings;
  }

  try {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ screenshotUrl }),
    });

    if (!res.ok) {
      if (res.status === 404) {
        setUsingLocalFallback(true);
        return updateAppSettings(screenshotUrl);
      }
      const errorData = await safeJson(res);
      throw new Error(errorData.error || 'Failed to update settings');
    }

    return safeJson(res);
  } catch (error) {
    console.warn('Backend settings update unavailable. Saving settings to local sandbox storage...');
    setUsingLocalFallback(true);
    return updateAppSettings(screenshotUrl);
  }
}
