import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const app = express();
const PORT = 3000;

// Increase payload limits for APK uploads (base64 can be slightly larger)
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ limit: "150mb", extended: true }));

// Ensure data and uploads directory exists
const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const DB_FILE = path.join(DATA_DIR, "db.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Database helper functions with robust structure
interface DBUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: "admin" | "user";
  createdAt: string;
}

interface DBVersion {
  id: string;
  versionString: string;
  versionCode: number;
  releaseNotes: string;
  fileSize: string;
  filename: string;
  downloadCount: number;
  createdAt: string;
}

interface DBFeedback {
  id: string;
  userId: string;
  username: string;
  email: string;
  type: string;
  message: string;
  createdAt: string;
}

interface AppSettings {
  screenshotUrl?: string;
}

interface Database {
  users: DBUser[];
  versions: DBVersion[];
  tokens: Record<string, string>; // token -> userId
  feedbacks: DBFeedback[];
  appSettings?: AppSettings;
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function loadDatabase(): Database {
  let db: Database;
  
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      db = JSON.parse(content);
    } catch (err) {
      console.error("Error reading db file, resetting database", err);
      db = { users: [], versions: [], tokens: {}, feedbacks: [], appSettings: {} };
    }
  } else {
    db = { users: [], versions: [], tokens: {}, feedbacks: [], appSettings: {} };
  }

  // Set default versions if empty
  if (!db.versions || db.versions.length === 0) {
    db.versions = [
      {
        id: "v1-0-0",
        versionString: "1.0.0",
        versionCode: 1,
        releaseNotes: "Initial stable release of KhataIndex.\n- Lightweight ledger tracking\n- Instant calculation of accounts\n- Beautiful minimalist dark UI",
        fileSize: "8.5 MB",
        filename: "KhataIndex-v1.0.0.apk",
        downloadCount: 154,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "v1-1-0",
        versionString: "1.1.0",
        versionCode: 2,
        releaseNotes: "Performance upgrade and bug fixes.\n- Reduced APK bundle size by 15%\n- Added backup and restore triggers\n- Fixed alignment issues on wider screen devices",
        fileSize: "7.2 MB",
        filename: "KhataIndex-v1.1.0.apk",
        downloadCount: 89,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // Write mock APK files so they exist on server startup
    const mockApk1 = path.join(UPLOADS_DIR, "KhataIndex-v1.0.0.apk");
    const mockApk2 = path.join(UPLOADS_DIR, "KhataIndex-v1.1.0.apk");
    try {
      fs.writeFileSync(mockApk1, "MOCK_APK_FILE_1_STABLE_BUILD_KHATAINDEX");
      fs.writeFileSync(mockApk2, "MOCK_APK_FILE_2_PERFORMANCE_BUILD_KHATAINDEX");
    } catch (e) {
      console.error("Failed to write mock APK files", e);
    }
  }

  if (!db.tokens) {
    db.tokens = {};
  }

  if (!db.feedbacks) {
    db.feedbacks = [];
  }

  if (!db.appSettings) {
    db.appSettings = {};
  }

  // 1. Remove demo/old users from the database completely ("admin" and "user" from default seeds)
  db.users = (db.users || []).filter(
    (u) =>
      u.username.toLowerCase() !== "admin" &&
      u.username.toLowerCase() !== "user" &&
      u.id !== "1" &&
      u.id !== "2"
  );

  // 2. Ensure "Subhajit Roy" admin user exists with password "Subhajit#123"
  const targetUsername = "Subhajit Roy";
  const targetEmail = "subhajit@khataindex.com";
  const targetHash = hashPassword("Subhajit#123");

  let adminUser = db.users.find(
    (u) => u.username.toLowerCase() === targetUsername.toLowerCase()
  );

  if (!adminUser) {
    adminUser = {
      id: "admin-subhajit",
      username: targetUsername,
      email: targetEmail,
      passwordHash: targetHash,
      role: "admin",
      createdAt: new Date().toISOString(),
    };
    db.users.push(adminUser);
  } else {
    // Update credentials to make sure they match
    adminUser.passwordHash = targetHash;
    adminUser.role = "admin";
  }

  saveDatabase(db);
  return db;
}

function saveDatabase(db: Database) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

// Load DB initially
let localDb = loadDatabase();

// Initialize Firebase Admin SDK
let isFirebaseAvailable = false;
let firestoreDb: any = null;

try {
  if (getApps().length === 0) {
    initializeApp();
  }
  firestoreDb = getFirestore();
  isFirebaseAvailable = true;
  console.log("Firebase Admin successfully initialized. Primary DB: Firestore.");
} catch (err) {
  console.warn("Firebase Admin failed to initialize. Falling back to local JSON database.", err);
}

// Seed function to copy local seeds to Firestore if it's empty
async function seedFirestoreIfNeeded() {
  if (!isFirebaseAvailable || !firestoreDb) return;
  try {
    const userSnapshot = await firestoreDb.collection("users").limit(1).get();
    if (userSnapshot.empty) {
      console.log("Seeding admin and test users to Firestore...");
      for (const u of localDb.users) {
        await firestoreDb.collection("users").doc(u.id).set(u);
      }
    }
    
    const versionSnapshot = await firestoreDb.collection("versions").limit(1).get();
    if (versionSnapshot.empty) {
      console.log("Seeding default app versions to Firestore...");
      for (const v of localDb.versions) {
        await firestoreDb.collection("versions").doc(v.id).set(v);
      }
    }
  } catch (err: any) {
    console.warn("Firestore database is not accessible or enabled. Dynamically switching database backend to local JSON fallback storage. Message:", err.message || err);
    isFirebaseAvailable = false;
    firestoreDb = null;
  }
}

// Trigger seeding
seedFirestoreIfNeeded().catch(console.error);

// Database Adapter Methods
async function getUsers(): Promise<DBUser[]> {
  if (isFirebaseAvailable && firestoreDb) {
    try {
      const snapshot = await firestoreDb.collection("users").get();
      return snapshot.docs.map(doc => doc.data() as DBUser);
    } catch (e) {
      console.error("Firestore getUsers failed, using local fallback", e);
    }
  }
  return localDb.users;
}

async function findUser(identifier: string): Promise<DBUser | null> {
  const users = await getUsers();
  const lower = identifier.toLowerCase();
  return users.find(u => u.username.toLowerCase() === lower || u.email.toLowerCase() === lower) || null;
}

async function findUserById(id: string): Promise<DBUser | null> {
  if (isFirebaseAvailable && firestoreDb) {
    try {
      const doc = await firestoreDb.collection("users").doc(id).get();
      if (doc.exists) {
        return doc.data() as DBUser;
      }
    } catch (e) {
      console.error("Firestore findUserById failed, using local fallback", e);
    }
  }
  return localDb.users.find(u => u.id === id) || null;
}

async function createUser(user: DBUser): Promise<void> {
  if (isFirebaseAvailable && firestoreDb) {
    try {
      await firestoreDb.collection("users").doc(user.id).set(user);
    } catch (e) {
      console.error("Firestore createUser failed, writing to local fallback", e);
    }
  }
  localDb.users.push(user);
  saveDatabase(localDb);
}

async function updateUser(userId: string, updates: Partial<DBUser>): Promise<DBUser | null> {
  if (isFirebaseAvailable && firestoreDb) {
    try {
      await firestoreDb.collection("users").doc(userId).update(updates);
    } catch (e) {
      console.error("Firestore updateUser failed, using local fallback", e);
    }
  }

  const user = localDb.users.find(u => u.id === userId);
  if (user) {
    Object.assign(user, updates);
    saveDatabase(localDb);
    return user;
  }
  return null;
}

async function getFeedbacks(): Promise<DBFeedback[]> {
  if (isFirebaseAvailable && firestoreDb) {
    try {
      const snapshot = await firestoreDb.collection("feedbacks").get();
      return snapshot.docs.map(doc => doc.data() as DBFeedback);
    } catch (e) {
      console.error("Firestore getFeedbacks failed, using local fallback", e);
    }
  }
  return localDb.feedbacks || [];
}

async function createFeedback(feedback: DBFeedback): Promise<void> {
  if (isFirebaseAvailable && firestoreDb) {
    try {
      await firestoreDb.collection("feedbacks").doc(feedback.id).set(feedback);
    } catch (e) {
      console.error("Firestore createFeedback failed, writing to local fallback", e);
    }
  }
  if (!localDb.feedbacks) {
    localDb.feedbacks = [];
  }
  localDb.feedbacks.push(feedback);
  saveDatabase(localDb);
}

async function getAppSettings(): Promise<AppSettings> {
  if (isFirebaseAvailable && firestoreDb) {
    try {
      const doc = await firestoreDb.collection("settings").doc("global").get();
      if (doc.exists) {
        return doc.data() as AppSettings;
      }
    } catch (e) {
      console.error("Firestore getAppSettings failed, using local fallback", e);
    }
  }
  if (!localDb.appSettings) {
    localDb.appSettings = {};
  }
  return localDb.appSettings;
}

async function updateAppSettings(updates: AppSettings): Promise<AppSettings> {
  if (isFirebaseAvailable && firestoreDb) {
    try {
      await firestoreDb.collection("settings").doc("global").set(updates, { merge: true });
    } catch (e) {
      console.error("Firestore updateAppSettings failed, using local fallback", e);
    }
  }
  if (!localDb.appSettings) {
    localDb.appSettings = {};
  }
  Object.assign(localDb.appSettings, updates);
  saveDatabase(localDb);
  return localDb.appSettings;
}

async function getVersionsFromDb(): Promise<DBVersion[]> {
  if (isFirebaseAvailable && firestoreDb) {
    try {
      const snapshot = await firestoreDb.collection("versions").get();
      return snapshot.docs.map(doc => doc.data() as DBVersion);
    } catch (e) {
      console.error("Firestore getVersions failed, using local fallback", e);
    }
  }
  return localDb.versions;
}

async function createVersion(version: DBVersion): Promise<void> {
  if (isFirebaseAvailable && firestoreDb) {
    try {
      await firestoreDb.collection("versions").doc(version.id).set(version);
    } catch (e) {
      console.error("Firestore createVersion failed, writing to local fallback", e);
    }
  }
  localDb.versions.push(version);
  saveDatabase(localDb);
}

async function deleteVersionFromDb(id: string): Promise<void> {
  if (isFirebaseAvailable && firestoreDb) {
    try {
      await firestoreDb.collection("versions").doc(id).delete();
    } catch (e) {
      console.error("Firestore deleteVersion failed, writing to local fallback", e);
    }
  }
  const idx = localDb.versions.findIndex(v => v.id === id);
  if (idx !== -1) {
    localDb.versions.splice(idx, 1);
    saveDatabase(localDb);
  }
}

async function incrementDownload(id: string): Promise<void> {
  if (isFirebaseAvailable && firestoreDb) {
    try {
      await firestoreDb.collection("versions").doc(id).update({
        downloadCount: FieldValue.increment(1)
      });
    } catch (e) {
      console.error("Firestore incrementDownload failed, writing to local fallback", e);
    }
  }
  const version = localDb.versions.find(v => v.id === id);
  if (version) {
    version.downloadCount += 1;
    saveDatabase(localDb);
  }
}

async function getUserIdByToken(token: string): Promise<string | null> {
  if (isFirebaseAvailable && firestoreDb) {
    try {
      const doc = await firestoreDb.collection("tokens").doc(token).get();
      if (doc.exists) {
        return doc.data()?.userId || null;
      }
    } catch (e) {
      console.error("Firestore getUserIdByToken failed, using local fallback", e);
    }
  }
  return localDb.tokens[token] || null;
}

async function addToken(token: string, userId: string): Promise<void> {
  if (isFirebaseAvailable && firestoreDb) {
    try {
      await firestoreDb.collection("tokens").doc(token).set({
        userId,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Firestore addToken failed, writing to local fallback", e);
    }
  }
  localDb.tokens[token] = userId;
  saveDatabase(localDb);
}

async function deleteToken(token: string): Promise<void> {
  if (isFirebaseAvailable && firestoreDb) {
    try {
      await firestoreDb.collection("tokens").doc(token).delete();
    } catch (e) {
      console.error("Firestore deleteToken failed, writing to local fallback", e);
    }
  }
  delete localDb.tokens[token];
  saveDatabase(localDb);
}

// Authentication middleware
async function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }

  const token = authHeader.substring(7);
  const userId = await getUserIdByToken(token);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }

  const user = await findUserById(userId);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized: User not found" });
  }

  // Attach user object to request
  (req as any).user = user;
  next();
}

// Admin only middleware
function adminOnly(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin role required" });
  }
  next();
}

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

// Post login
app.post("/api/auth/login", async (req, res) => {
  const { loginIdentifier, password } = req.body; // username or email

  if (!loginIdentifier || !password) {
    return res.status(400).json({ error: "Username/Email and Password are required" });
  }

  const hash = hashPassword(password);
  const user = await findUser(loginIdentifier);

  if (!user || user.passwordHash !== hash) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Create token
  const token = crypto.randomBytes(32).toString("hex");
  await addToken(token, user.id);

  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser, token });
});

// Post Register (Users can register themselves)
app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, Email, and Password are required" });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters long" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long" });
  }

  // Check unique constraints
  const existing = await findUser(username) || await findUser(email);
  if (existing) {
    return res.status(400).json({ error: "Username or Email already registered" });
  }

  // Add new user (role is always 'user')
  const newUser: DBUser = {
    id: crypto.randomBytes(16).toString("hex"),
    username,
    email,
    passwordHash: hashPassword(password),
    role: "user",
    createdAt: new Date().toISOString(),
  };

  await createUser(newUser);

  // Auto-login after registration
  const token = crypto.randomBytes(32).toString("hex");
  await addToken(token, newUser.id);

  const { passwordHash, ...safeUser } = newUser;
  res.status(201).json({ user: safeUser, token });
});

// Get Me (check current auth state)
app.get("/api/auth/me", authenticate, (req, res) => {
  const user = (req as any).user;
  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser });
});

// Post Logout
app.post("/api/auth/logout", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    await deleteToken(token);
  }
  res.json({ success: true });
});

// Update authenticated user profile (Everyone can edit their profile)
app.put("/api/auth/profile", authenticate, async (req, res) => {
  const user = (req as any).user;
  const { username, email, password } = req.body;

  if (!username || !email) {
    return res.status(400).json({ error: "Username and email are required" });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters long" });
  }

  // Check duplicate constraints with other users
  const users = await getUsers();
  const duplicate = users.find(
    (u) =>
      u.id !== user.id &&
      (u.username.toLowerCase() === username.toLowerCase() ||
        u.email.toLowerCase() === email.toLowerCase())
  );

  if (duplicate) {
    return res.status(400).json({ error: "Username or Email is already taken by another user" });
  }

  const updates: Partial<DBUser> = {
    username,
    email,
  };

  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }
    updates.passwordHash = hashPassword(password);
  }

  const updatedUser = await updateUser(user.id, updates);
  if (!updatedUser) {
    return res.status(500).json({ error: "Failed to update profile" });
  }

  const { passwordHash, ...safeUser } = updatedUser;
  res.json({ user: safeUser });
});

// Submit user feedback
app.post("/api/feedback", authenticate, async (req, res) => {
  const user = (req as any).user;
  const { type, message } = req.body;

  if (!type || !message) {
    return res.status(400).json({ error: "Feedback type and message are required" });
  }

  const newFeedback: DBFeedback = {
    id: "fb-" + crypto.randomBytes(8).toString("hex"),
    userId: user.id,
    username: user.username,
    email: user.email,
    type,
    message,
    createdAt: new Date().toISOString(),
  };

  await createFeedback(newFeedback);
  res.status(201).json(newFeedback);
});

// Get all feedback entries (Admin Only)
app.get("/api/feedback", authenticate, adminOnly, async (req, res) => {
  const feedbacks = await getFeedbacks();
  const sorted = [...feedbacks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(sorted);
});

// Get app settings (Public)
app.get("/api/settings", async (req, res) => {
  const settings = await getAppSettings();
  res.json(settings);
});

// Update app settings (Admin Only)
app.put("/api/settings", authenticate, adminOnly, async (req, res) => {
  const { screenshotUrl } = req.body;
  const updated = await updateAppSettings({ screenshotUrl });
  res.json(updated);
});

// Get all app versions (sorted by latest versionCode or createdAt desc)
app.get("/api/versions", async (req, res) => {
  const versions = await getVersionsFromDb();
  const sortedVersions = [...versions].sort((a, b) => b.versionCode - a.versionCode);
  res.json(sortedVersions);
});

// Post new version (Admin Only)
app.post("/api/versions", authenticate, adminOnly, async (req, res) => {
  const { versionString, versionCode, releaseNotes, filename, fileBase64, fileSize } = req.body;

  if (!versionString || !versionCode || !releaseNotes || !filename || !fileBase64 || !fileSize) {
    return res.status(400).json({ error: "All upload fields are required" });
  }

  const versions = await getVersionsFromDb();
  const exists = versions.some((v) => v.versionCode === parseInt(versionCode));
  if (exists) {
    return res.status(400).json({ error: `Version code ${versionCode} already exists` });
  }

  try {
    // Save file to uploads directory
    const buffer = Buffer.from(fileBase64, "base64");
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = path.join(UPLOADS_DIR, safeFilename);

    fs.writeFileSync(filePath, buffer);

    const newVersion: DBVersion = {
      id: "v-" + crypto.randomBytes(8).toString("hex"),
      versionString,
      versionCode: parseInt(versionCode),
      releaseNotes,
      fileSize,
      filename: safeFilename,
      downloadCount: 0,
      createdAt: new Date().toISOString(),
    };

    await createVersion(newVersion);

    res.status(201).json(newVersion);
  } catch (error: any) {
    console.error("File upload error:", error);
    res.status(500).json({ error: "Failed to write uploaded file" });
  }
});

// Delete version (Admin Only)
app.delete("/api/versions/:id", authenticate, adminOnly, async (req, res) => {
  const versionId = req.params.id;
  const versions = await getVersionsFromDb();
  const version = versions.find((v) => v.id === versionId);

  if (!version) {
    return res.status(404).json({ error: "Version not found" });
  }

  try {
    // Delete file
    const filePath = path.join(UPLOADS_DIR, version.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await deleteVersionFromDb(versionId);

    res.json({ success: true, message: "Version deleted successfully" });
  } catch (error: any) {
    console.error("Delete file error:", error);
    res.status(500).json({ error: "Failed to delete file or version metadata" });
  }
});

// Download app/apk file (Requires Login)
app.get("/api/versions/:id/download", authenticate, async (req, res) => {
  const versionId = req.params.id;
  const versions = await getVersionsFromDb();
  const version = versions.find((v) => v.id === versionId);

  if (!version) {
    return res.status(404).json({ error: "Version not found" });
  }

  const filePath = path.join(UPLOADS_DIR, version.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Actual APK file does not exist on server" });
  }

  // Increment download count
  await incrementDownload(versionId);

  // Set response headers and send file
  res.setHeader("Content-Disposition", `attachment; filename="${version.filename}"`);
  res.setHeader("Content-Type", "application/vnd.android.package-archive");
  res.download(filePath, version.filename);
});

// -------------------------------------------------------------
// VITE OR STATIC SERVER MIDDLEWARE
// -------------------------------------------------------------
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

initServer().catch((err) => {
  console.error("Failed to start server", err);
});
