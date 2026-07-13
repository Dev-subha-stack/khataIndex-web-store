import React, { useState, useRef, useEffect } from 'react';
import { AppVersion, Feedback } from '../types';
import { 
  Upload, 
  Trash2, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  ArrowUpCircle, 
  MessageSquare, 
  RefreshCw, 
  Mail, 
  User as UserIcon, 
  Lightbulb, 
  Bug, 
  HelpCircle, 
  Heart, 
  SlidersHorizontal,
  Image as ImageIcon,
  Settings as SettingsIcon,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import AdminDashboard from './AdminDashboard';
import { getFeedbacks, updateAppSettings } from '../api';

interface AdminPanelProps {
  versions: AppVersion[];
  onUpload: (
    versionString: string,
    versionCode: number,
    releaseNotes: string,
    filename: string,
    fileBase64: string,
    fileSize: string
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  screenshotUrl: string | null;
  onUpdateScreenshot: (url: string | null) => void;
}

export default function AdminPanel({
  versions,
  onUpload,
  onDelete,
  screenshotUrl,
  onUpdateScreenshot,
}: AdminPanelProps) {
  // Upload Form State
  const [versionString, setVersionString] = useState('');
  const [versionCode, setVersionCode] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Status State
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Feedbacks & Sub-Tabs State
  const [adminTab, setAdminTab] = useState<'builds' | 'feedbacks' | 'settings'>('builds');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState<string>('all');

  const fetchFeedbacks = async () => {
    try {
      setLoadingFeedbacks(true);
      const res = await getFeedbacks();
      setFeedbacks(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user feedback.');
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  useEffect(() => {
    if (adminTab === 'feedbacks') {
      fetchFeedbacks();
    }
  }, [adminTab]);

  // Showcase Settings States & Ref
  const [inputScreenshotUrl, setInputScreenshotUrl] = useState(screenshotUrl || '');
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const settingsFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputScreenshotUrl(screenshotUrl || '');
  }, [screenshotUrl]);

  const handleScreenshotFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate image format
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setInputScreenshotUrl(base64String);
      setSuccessMsg('Image converted successfully! Click "Save Settings" below to publish.');
    };
    reader.onerror = () => {
      setError('Failed to read the image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingSettings(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await updateAppSettings(inputScreenshotUrl || null);
      onUpdateScreenshot(inputScreenshotUrl || null);
      setSuccessMsg('App showcase settings updated successfully!');
    } catch (err: any) {
      setError(err?.message || 'Failed to update settings');
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleClearScreenshot = async () => {
    setUpdatingSettings(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await updateAppSettings(null);
      onUpdateScreenshot(null);
      setInputScreenshotUrl('');
      setSuccessMsg('Showcase screenshot removed successfully.');
    } catch (err: any) {
      setError(err?.message || 'Failed to remove screenshot');
    } finally {
      setUpdatingSettings(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setError(null);
    }
  };

  // Drag and Drop handlers
  const [isDragActive, setIsDragActive] = useState(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
 
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setError(null);
    }
  };

  // Format bytes helper
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 1;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validations
    if (!versionString.trim()) {
      setError('Version name (e.g. 1.2.0) is required.');
      return;
    }
    const codeNum = parseInt(versionCode);
    if (isNaN(codeNum) || codeNum <= 0) {
      setError('Version code must be a positive integer.');
      return;
    }
    if (!releaseNotes.trim()) {
      setError('Please add release notes detailing the upgrades.');
      return;
    }
    if (!selectedFile) {
      setError('Please select or drop an APK file to upload.');
      return;
    }

    setUploading(true);

    try {
      // Read file to Base64
      const reader = new FileReader();
      
      const fileLoadPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Extract base64 part from Data URL (format is data:*/*;base64,xxxx)
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read file contents'));
        reader.readAsDataURL(selectedFile);
      });

      const base64Data = await fileLoadPromise;
      const sizeStr = formatBytes(selectedFile.size);

      // Perform upload
      await onUpload(
        versionString.trim(),
        codeNum,
        releaseNotes.trim(),
        selectedFile.name,
        base64Data,
        sizeStr
      );

      // Reset form on success
      setVersionString('');
      setVersionCode('');
      setReleaseNotes('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccessMsg(`Version ${versionString} uploaded successfully!`);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to complete uploading process.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVersion = async (id: string, verName: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      // Automatically disarm confirmation after 4 seconds
      setTimeout(() => {
        setConfirmDeleteId(prev => prev === id ? null : prev);
      }, 4000);
      return;
    }

    setConfirmDeleteId(null);
    setError(null);
    setSuccessMsg(null);
    setDeletingId(id);
    try {
      await onDelete(id);
      setSuccessMsg(`Version ${verName} was permanently deleted.`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete version.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Overview Head */}
      <div className="border-b border-white/10 pb-5">
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center space-x-2">
          <ArrowUpCircle className="h-7 w-7 text-blue-400 animate-pulse" />
          <span>Admin Control Center</span>
        </h2>
        <p className="mt-1.5 text-sm text-slate-400">
          Upload and index new KhataIndex build artifacts, track download stats, or delete deprecated versions.
        </p>
      </div>

      {/* Interactive Telemetry & Metrics Dashboard */}
      <AdminDashboard versions={versions} />

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center space-x-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start space-x-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-300">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {/* Tab selection controls */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-2">
        <button
          onClick={() => setAdminTab('builds')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold tracking-tight transition-all flex items-center space-x-2 border-b-2 rounded-b-none ${
            adminTab === 'builds'
              ? 'border-blue-500 text-white bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Builds & Releases Manager</span>
        </button>

        <button
          onClick={() => setAdminTab('feedbacks')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold tracking-tight transition-all flex items-center space-x-2 border-b-2 rounded-b-none ${
            adminTab === 'feedbacks'
              ? 'border-blue-500 text-white bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>User Feedbacks & Suggestions</span>
          {feedbacks.length > 0 && (
            <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-sans font-extrabold ml-1.5">
              {feedbacks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('settings')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold tracking-tight transition-all flex items-center space-x-2 border-b-2 rounded-b-none ${
            adminTab === 'settings'
              ? 'border-blue-500 text-white bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <SettingsIcon className="h-4 w-4 text-blue-400" />
          <span>App Showcase Settings</span>
        </button>
      </div>

      {adminTab === 'feedbacks' ? (
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <MessageSquare className="h-5.5 w-5.5 text-indigo-400" />
                <span>User Feedbacks Directory</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Displaying feedback entries submitted by users in real-time.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={fetchFeedbacks}
                disabled={loadingFeedbacks}
                className="p-2 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 text-slate-300 transition"
                title="Refresh feedbacks"
              >
                <RefreshCw className={`h-4 w-4 ${loadingFeedbacks ? 'animate-spin text-blue-400' : ''}`} />
              </button>

              <div className="relative">
                <SlidersHorizontal className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <select
                  value={feedbackFilter}
                  onChange={(e) => setFeedbackFilter(e.target.value)}
                  className="bg-[#070913] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-slate-300 outline-none focus:border-indigo-500 transition appearance-none cursor-pointer"
                >
                  <option value="all">All Feedback Types</option>
                  <option value="suggestion">Feature Suggestions</option>
                  <option value="bug">Bug Reports</option>
                  <option value="general">General Info</option>
                  <option value="praise">Praise / Love</option>
                </select>
              </div>
            </div>
          </div>

          {loadingFeedbacks ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-400 animate-pulse">Retrieving user feedbacks...</p>
            </div>
          ) : (() => {
            const filtered = feedbacks.filter(fb => feedbackFilter === 'all' || fb.type === feedbackFilter);
            if (filtered.length === 0) {
              return (
                <div className="py-20 text-center text-slate-400">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20 text-indigo-400" />
                  <p className="text-sm font-bold">No feedback entries found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {feedbackFilter === 'all' ? 'No users have submitted any feedbacks yet.' : `No feedback entries match the filter "${feedbackFilter}".`}
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map((fb) => {
                  let badgeStyle = 'text-sky-400 bg-sky-400/10 border-sky-400/20';
                  let icon = HelpCircle;
                  if (fb.type === 'bug') {
                    badgeStyle = 'text-rose-400 bg-rose-400/10 border-rose-400/20';
                    icon = Bug;
                  } else if (fb.type === 'suggestion') {
                    badgeStyle = 'text-amber-400 bg-amber-400/10 border-amber-400/20';
                    icon = Lightbulb;
                  } else if (fb.type === 'praise') {
                    badgeStyle = 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
                    icon = Heart;
                  }
                  const IconComponent = icon;

                  return (
                    <div 
                      key={fb.id} 
                      className="group bg-slate-950/40 rounded-2xl border border-white/5 hover:border-white/10 p-5 transition duration-200 hover:shadow-lg hover:shadow-indigo-500/5 relative overflow-hidden flex flex-col justify-between"
                    >
                      {/* Accent glow on hover */}
                      <div className="absolute top-0 right-0 -mr-16 -mt-16 h-32 w-32 bg-indigo-500/0 group-hover:bg-indigo-500/5 rounded-full blur-2xl transition-all duration-300 pointer-events-none" />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white font-extrabold text-xs uppercase shrink-0">
                              {fb.username.slice(0,2)}
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-bold text-white leading-tight truncate">{fb.username}</p>
                              <p className="text-[11px] text-slate-400 flex items-center mt-0.5 truncate">
                                <Mail className="h-3 w-3 mr-1 opacity-70 shrink-0" />
                                {fb.email}
                              </p>
                            </div>
                          </div>

                          <span className={`inline-flex items-center space-x-1.5 rounded-full border px-2.5 py-1 text-xs font-bold leading-none shrink-0 ${badgeStyle}`}>
                            <IconComponent className="h-3.5 w-3.5" />
                            <span className="capitalize">{fb.type}</span>
                          </span>
                        </div>

                        <div className="bg-slate-950/80 rounded-xl border border-white/5 p-3.5 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {fb.message}
                        </div>
                      </div>

                      <div className="flex items-center text-[10px] text-slate-500 mt-4 pt-3 border-t border-white/5 justify-between">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(fb.createdAt).toLocaleString()}
                        </span>
                        <span className="font-mono text-slate-600 text-[9px] uppercase tracking-widest">{fb.id}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      ) : adminTab === 'settings' ? (
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-white/5 pb-5">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <ImageIcon className="h-5.5 w-5.5 text-blue-400" />
              <span>Showcase Settings</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Customize the app screenshot displayed inside the showcase phone on the landing page.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Control Panel Column */}
            <div className="lg:col-span-7 space-y-6">
              <form onSubmit={handleSaveSettings} className="space-y-6">
                
                {/* Method 1: File upload */}
                <div className="bg-slate-950/40 rounded-2xl border border-white/5 p-5 space-y-4">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <span className="h-5 w-5 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-sans">1</span>
                    Upload Image File
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Select a localized screenshot file (PNG, JPG, or WEBP) to automatically convert and load.
                  </p>
                  
                  <div className="relative">
                    <input
                      type="file"
                      ref={settingsFileRef}
                      onChange={handleScreenshotFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => settingsFileRef.current?.click()}
                      className="w-full h-32 rounded-2xl border-2 border-dashed border-white/10 hover:border-blue-500/50 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-2 transition duration-200 group"
                    >
                      <Upload className="h-8 w-8 text-slate-400 group-hover:text-blue-400 transition" />
                      <span className="text-xs font-bold text-slate-300">Choose Image File</span>
                      <span className="text-[10px] text-slate-500">PNG, JPG, WEBP formats up to 5MB</span>
                    </button>
                  </div>
                </div>

                {/* Method 2: Direct URL */}
                <div className="bg-slate-950/40 rounded-2xl border border-white/5 p-5 space-y-4">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <span className="h-5 w-5 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-sans">2</span>
                    Or Paste Image URL
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Alternatively, paste an existing CDN, Imgur, or cloud storage image address directly.
                  </p>
                  <input
                    type="url"
                    value={inputScreenshotUrl}
                    onChange={(e) => setInputScreenshotUrl(e.target.value)}
                    placeholder="https://example.com/screenshot.png"
                    className="w-full bg-[#070913] border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold text-white placeholder-slate-600 outline-none focus:border-blue-500 transition"
                  />
                </div>

                {/* Form Controls */}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={updatingSettings}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-black text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {updatingSettings ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    <span>Save Showcase Settings</span>
                  </button>

                  {screenshotUrl && (
                    <button
                      type="button"
                      onClick={handleClearScreenshot}
                      disabled={updatingSettings}
                      className="px-5 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold border border-red-500/20 transition"
                    >
                      Remove Screenshot
                    </button>
                  )}
                </div>

              </form>
            </div>

            {/* Live Preview Column */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-950/20 rounded-2xl border border-white/5 p-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 self-start">Live Device Preview</h4>
              
              <div className="relative w-full max-w-[220px] aspect-[9/18] bg-slate-950 rounded-[36px] p-2 border-4 border-slate-800 shadow-2xl ring-1 ring-white/5 overflow-hidden">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-20 bg-slate-950 rounded-b-xl z-20 flex items-center justify-center">
                  <div className="w-8 h-0.5 bg-slate-800 rounded-full mb-0.5" />
                </div>

                <div className="w-full h-full bg-slate-900 rounded-[28px] overflow-hidden relative flex flex-col justify-center items-center">
                  {inputScreenshotUrl ? (
                    <img
                      src={inputScreenshotUrl}
                      alt="Preview screenshot"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => {
                        setError('The provided URL could not be loaded as a valid image.');
                      }}
                    />
                  ) : (
                    <div className="p-4 text-center space-y-2">
                      <ImageIcon className="h-8 w-8 text-slate-600 mx-auto" />
                      <p className="text-[10px] font-bold text-slate-400">No Custom Screenshot</p>
                      <p className="text-[8px] text-slate-500">The site will fallback to rendering the live interactive ledger CSS mockup.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Form and List Grid */
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Upload Form Column */}
          <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-2xl rounded-3xl p-6 sm:p-8 h-fit">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center space-x-2.5">
              <Upload className="h-5 w-5 text-blue-400" />
              <span>Upload New Build APK</span>
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">
                    Version Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1.2.0"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 focus:bg-white/10 transition"
                    value={versionString}
                    onChange={(e) => setVersionString(e.target.value)}
                    disabled={uploading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">
                    Version Code
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 3"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 focus:bg-white/10 transition"
                    value={versionCode}
                    onChange={(e) => setVersionCode(e.target.value)}
                    disabled={uploading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">
                  Release Notes / Upgrades
                </label>
                <textarea
                  rows={4}
                  placeholder="List new feature changes, performance adjustments, or bug squashes here..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 focus:bg-white/10 transition"
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  disabled={uploading}
                />
              </div>

              {/* File Upload Stage */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">
                  APK Executable File
                </label>
                
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-8 px-4 text-center cursor-pointer transition-all duration-300 ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-500/10'
                      : selectedFile
                      ? 'border-blue-500/50 bg-blue-500/5'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".apk"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploading}
                  />

                  <Upload className={`h-8 w-8 mb-3 transition-transform duration-300 ${selectedFile ? 'text-blue-400 scale-110' : 'text-white/40'}`} />
                  
                  {selectedFile ? (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white break-all px-2">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatBytes(selectedFile.size)}
                      </p>
                      <span className="inline-flex items-center rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-300 mt-2">
                        Ready to index
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-xs">
                      <p className="font-bold text-white/90">
                        Drag & drop your APK here, or <span className="text-blue-400 underline">browse</span>
                      </p>
                      <p className="text-slate-400">
                        Accepts stable .apk build bundles
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full inline-flex justify-center items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-indigo-500 transition disabled:opacity-50"
              >
                {uploading ? (
                  <span className="flex items-center space-x-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Parsing & Indexing File...</span>
                  </span>
                ) : (
                  <span>Publish App Version</span>
                )}
              </button>
            </form>
          </div>

          {/* Existing Versions List Column */}
          <div className="lg:col-span-7 bg-slate-900/40 backdrop-blur-md border border-white/10 shadow-2xl rounded-3xl p-6 sm:p-8 h-fit">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center space-x-2.5">
              <Layers className="h-5 w-5 text-indigo-400" />
              <span>Currently Indexed Build Versions ({versions.length})</span>
            </h3>

            <div className="divide-y divide-white/10 max-h-[550px] overflow-y-auto pr-2">
              {versions.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">No versions have been uploaded yet.</p>
                </div>
              ) : (
                 versions.map((ver) => (
                  <div key={ver.id} className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-sans text-lg font-bold text-white">
                          V{ver.versionString}
                        </span>
                        <span className="rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                          Code: {ver.versionCode}
                        </span>
                        <span className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                          {ver.fileSize}
                        </span>
                      </div>

                      <div className="bg-white/5 p-3 rounded-2xl border border-white/10 max-h-32 overflow-y-auto">
                        <p className="text-xs text-slate-300 font-sans whitespace-pre-line">
                          {ver.releaseNotes}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 items-center text-[11px] text-slate-400">
                        <span className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          {new Date(ver.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="font-bold text-blue-400">
                          {ver.downloadCount} Downloads
                        </span>
                        <span className="truncate max-w-[150px] sm:max-w-xs" title={ver.filename}>
                          File: {ver.filename}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteVersion(ver.id, ver.versionString)}
                      disabled={deletingId === ver.id}
                      className={`self-end sm:self-center inline-flex items-center justify-center rounded-xl transition disabled:opacity-40 shrink-0 ${
                        confirmDeleteId === ver.id
                          ? "px-3.5 py-2 border border-red-500 bg-red-600 text-white text-xs font-bold animate-pulse shadow-md shadow-red-600/30"
                          : "h-10 w-10 border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                      }`}
                      title={confirmDeleteId === ver.id ? "Click again to confirm delete" : "Delete Version"}
                    >
                      {deletingId === ver.id ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                      ) : confirmDeleteId === ver.id ? (
                        <span>Confirm Delete</span>
                      ) : (
                        <Trash2 className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
