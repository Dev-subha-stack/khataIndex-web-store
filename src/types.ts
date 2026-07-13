export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface AppVersion {
  id: string;
  versionString: string; // e.g., "1.2.0"
  versionCode: number;   // e.g., 12
  releaseNotes: string;
  fileSize: string;      // e.g., "4.2 MB"
  filename: string;
  downloadCount: number;
  createdAt: string;
}

export interface Feedback {
  id: string;
  userId: string;
  username: string;
  email: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
