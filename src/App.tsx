import { useState, useEffect } from 'react';
import { AppVersion, User } from './types';
import {
  checkAuth,
  login,
  register,
  logout,
  getVersions,
  uploadVersion,
  deleteVersion,
  downloadFile,
  getAppSettings,
  updateAppSettings,
} from './api';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import VersionHistory from './components/VersionHistory';
import InstallGuide from './components/InstallGuide';
import EditProfileModal from './components/EditProfileModal';
import FeedbackSection from './components/FeedbackSection';
import {
  Download,
  Smartphone,
  CheckCircle2,
  Lock,
  ArrowRight,
  PlusCircle,
  TrendingUp,
  CreditCard,
  Check,
  SmartphoneIcon,
  Shield,
  LaptopIcon,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [appLoading, setAppLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [showScreenshot, setShowScreenshot] = useState(true);
  const [currentTab, setCurrentTab] = useState<'home' | 'feedback'>('home');

  // Load user status and version history on boot
  useEffect(() => {
    async function initData() {
      try {
        const currentUser = await checkAuth();
        setUser(currentUser);
        
        const allVersions = await getVersions();
        setVersions(allVersions);

        const settings = await getAppSettings();
        if (settings && settings.screenshotUrl) {
          setScreenshotUrl(settings.screenshotUrl);
        }
      } catch (err) {
        console.error('Failed to load initial data', err);
      } finally {
        setAppLoading(false);
      }
    }
    initData();
  }, []);

  // Sync admin mode off if logged out
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setIsAdminMode(false);
    }
  }, [user]);

  // Auth triggers
  const handleLogin = async (identifier: string, pass: string) => {
    const res = await login(identifier, pass);
    setUser(res.user);
    // Refresh versions list
    const allVersions = await getVersions();
    setVersions(allVersions);
    return res;
  };

  const handleRegister = async (username: string, email: string, pass: string) => {
    const res = await register(username, email, pass);
    setUser(res.user);
    // Refresh versions list
    const allVersions = await getVersions();
    setVersions(allVersions);
    return res;
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setIsAdminMode(false);
    showSuccess('Logged out successfully.');
  };

  // Version management triggers
  const handleUploadVersion = async (
    versionString: string,
    versionCode: number,
    releaseNotes: string,
    filename: string,
    fileBase64: string,
    fileSize: string
  ) => {
    await uploadVersion(versionString, versionCode, releaseNotes, filename, fileBase64, fileSize);
    // Refresh versions
    const allVersions = await getVersions();
    setVersions(allVersions);
  };

  const handleDeleteVersion = async (id: string) => {
    await deleteVersion(id);
    // Refresh versions
    const allVersions = await getVersions();
    setVersions(allVersions);
  };

  const handleDownloadVersion = async (id: string, filename: string) => {
    try {
      setStatusMessage('Preparing your safe APK download...');
      await downloadFile(id, filename);
      showSuccess(`Downloading ${filename}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Download failed.');
    } finally {
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const showSuccess = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Find latest active version
  const latestVersion = versions.length > 0 
    ? [...versions].sort((a, b) => b.versionCode - a.versionCode)[0] 
    : null;

  // Render App UI Mockup details (simulate KhataIndex app itself)
  const mockupLedgers = [
    { name: 'Karan Mehra (Supplier)', action: 'You Gave', amount: '₹12,400', date: 'Today, 2:15 PM', isNegative: true },
    { name: 'Sharma General Store', action: 'You Got', amount: '₹4,250', date: 'Yesterday, 6:30 PM', isNegative: false },
    { name: 'Amit Verma (Customer)', action: 'You Gave', amount: '₹1,500', date: 'July 11, 11:00 AM', isNegative: true },
    { name: 'Royal Furniture', action: 'You Got', amount: '₹22,000', date: 'July 09, 4:10 PM', isNegative: false }
  ];

  if (appLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-2xl animate-bounce shadow-xl shadow-blue-500/30">
          K
        </div>
        <p className="mt-5 text-sm font-semibold text-slate-400 animate-pulse">
          Loading KhataIndex Platform...
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#070913] text-white antialiased font-sans overflow-x-hidden">
      {/* Decorative ambient glowing circles / mesh background blobs */}
      <div className="absolute top-[-10%] left-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute top-[20%] right-[-10%] -z-10 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[130px]" />
      <div className="absolute bottom-[10%] left-[10%] -z-10 h-[500px] w-[500px] rounded-full bg-blue-600/5 blur-[120px]" />

      {/* Top Notification Bar */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 text-xs font-bold text-emerald-300 shadow-2xl backdrop-blur-md flex items-center space-x-2"
          >
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-red-500/10 border border-red-500/20 px-6 py-3 text-xs font-bold text-red-300 shadow-2xl backdrop-blur-md flex items-center space-x-2"
          >
            <span className="shrink-0 font-bold">⚠️</span>
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="ml-2 font-bold text-red-400 hover:text-white">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header */}
      <Header
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        isAdminMode={isAdminMode}
        onToggleAdminMode={() => setIsAdminMode(!isAdminMode)}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        currentTab={currentTab}
        onChangeTab={(tab) => setCurrentTab(tab)}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {isAdminMode && user?.role === 'admin' ? (
          /* Admin View */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AdminPanel
              versions={versions}
              onUpload={handleUploadVersion}
              onDelete={handleDeleteVersion}
              screenshotUrl={screenshotUrl}
              onUpdateScreenshot={(url) => setScreenshotUrl(url)}
            />
          </motion.div>
        ) : currentTab === 'feedback' ? (
          /* Separate Feedback Screen View */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Header/Title bar for Feedback page */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-6 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-md">
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Verified Feedback Portal</h1>
                <p className="text-xs text-slate-400 mt-1">Submit feature requests, bug reports, or positive feedback directly to developers.</p>
              </div>
              <button
                onClick={() => setCurrentTab('home')}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-white transition-all"
              >
                ← Back to App Showcase
              </button>
            </div>

            <FeedbackSection
              user={user}
              onOpenAuth={() => setIsAuthOpen(true)}
              onShowSuccess={showSuccess}
            />
          </motion.div>
        ) : (
          /* Public App Landing View */
          <div className="space-y-20">
            {/* HERO SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              
              {/* Hero Call To Action (Left) */}
              <div className="lg:col-span-6 space-y-8">
                <span className="inline-flex items-center rounded-full bg-white/5 px-3.5 py-1 text-xs font-semibold text-blue-300 border border-white/10 tracking-wide">
                  <Shield className="h-4 w-4 mr-1.5 text-blue-400" />
                  <span>Secure & Verified Developer Artifacts</span>
                </span>

                <div className="space-y-4">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
                    Your Digital Ledger,<br />
                    Indexed Clean &<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Always Syncing.</span>
                  </h1>
                  <p className="text-sm sm:text-base text-slate-400 max-w-lg leading-relaxed">
                    KhataIndex tracks transactions, records business credit debit logs, and indices multiple accounts in one compact mobile APK file.
                  </p>
                </div>

                {/* Primary Download CTA Card */}
                <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-6 sm:p-8 shadow-2xl space-y-5">
                  {latestVersion ? (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-black text-blue-400">
                            LATEST STABLE APK BUILD
                          </span>
                          <h2 className="text-2xl font-black text-white mt-0.5">
                            KhataIndex V{latestVersion.versionString}
                          </h2>
                        </div>
                        <span className="rounded-full bg-white/5 border border-white/10 px-3.5 py-1 text-xs font-bold text-slate-300">
                          {latestVersion.fileSize}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 bg-white/5 p-4 rounded-2xl border border-white/10 font-sans">
                        <span className="font-bold text-blue-300">What's New:</span>
                        <p className="mt-1.5 whitespace-pre-line leading-relaxed text-slate-300">{latestVersion.releaseNotes}</p>
                      </div>

                      {user ? (
                        <button
                          onClick={() => handleDownloadVersion(latestVersion.id, latestVersion.filename)}
                          className="w-full inline-flex justify-center items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-indigo-500 transition-all"
                        >
                          <Download className="h-4.5 w-4.5" />
                          <span>Download Latest APK File</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsAuthOpen(true)}
                          className="w-full inline-flex justify-center items-center space-x-2 rounded-xl bg-white text-slate-950 py-4 text-sm font-bold shadow hover:bg-slate-100 transition-all"
                        >
                          <Lock className="h-4.5 w-4.5 text-blue-600" />
                          <span>Login to Download APK</span>
                        </button>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                        <span>🚀 Released: {new Date(latestVersion.createdAt).toLocaleDateString()}</span>
                        <span className="font-bold text-blue-400">Total Downloads: {latestVersion.downloadCount}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-10 text-center text-slate-400 space-y-4">
                      <Smartphone className="h-10 w-10 mx-auto opacity-30 text-indigo-400 animate-pulse" />
                      <p className="text-sm font-bold">No application builds published yet.</p>
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => setIsAdminMode(true)}
                          className="inline-flex items-center space-x-1.5 text-xs text-blue-400 font-bold hover:underline"
                        >
                          <PlusCircle className="h-4.5 w-4.5" />
                          <span>Upload first APK now</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Compatibility Info */}
                <div className="flex items-center space-x-6 text-xs text-slate-400 pl-1">
                  <span className="flex items-center">
                    <SmartphoneIcon className="h-4 w-4 mr-1.5 text-blue-400" />
                    Android 8.0+ Compatible
                  </span>
                  <span className="flex items-center">
                    <LaptopIcon className="h-4 w-4 mr-1.5 text-indigo-400" />
                    Mobile & Desktop Web
                  </span>
                </div>
              </div>

              {/* Showcase App Mockup Design (Right) */}
              <div className="lg:col-span-6 flex justify-center items-center relative">
                <div className="relative w-full max-w-[340px] aspect-[9/18] bg-slate-950 rounded-[48px] p-3.5 shadow-2xl border-4 border-slate-800 ring-1 ring-white/10 overflow-hidden flex flex-col shrink-0">
                  
                  {/* Phone Speaker & Camera Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-slate-950 rounded-b-2xl z-20 flex items-center justify-center">
                    <div className="w-12 h-1 bg-slate-800 rounded-full mb-1" />
                  </div>

                  {/* Inside App Mockup Screen */}
                  {screenshotUrl && showScreenshot ? (
                    <div className="w-full h-full bg-slate-950 rounded-[36px] overflow-hidden relative flex flex-col justify-between select-none font-sans">
                      <div className="absolute top-3 right-3 z-30">
                        <span className="inline-flex items-center rounded-full bg-slate-900/90 px-2 py-0.5 text-[9px] font-bold text-blue-300 border border-white/10 shadow backdrop-blur-sm">
                          Screenshot View
                        </span>
                      </div>
                      <img
                        src={screenshotUrl}
                        alt="App Screenshot"
                        className="w-full h-full object-cover rounded-[36px]"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        onClick={() => setShowScreenshot(false)}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-slate-950/95 hover:bg-slate-900 text-[10px] font-black tracking-tight text-white/90 border border-white/10 hover:border-white/20 shadow-xl transition-all"
                      >
                        Try Interactive Demo
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-slate-900 rounded-[36px] overflow-hidden flex flex-col justify-between pt-6 text-white text-xs select-none relative font-sans">
                      {screenshotUrl && (
                        <div className="absolute top-2 right-2 z-30">
                          <button
                            onClick={() => setShowScreenshot(true)}
                            className="inline-flex items-center rounded-xl bg-blue-600/95 hover:bg-blue-500 px-2.5 py-1 text-[9px] font-bold text-white shadow transition-all border border-blue-500/30"
                          >
                            Show Screenshot
                          </button>
                        </div>
                      )}
                      
                      {/* App Header mockup */}
                      <div className="p-4 flex items-center justify-between border-b border-white/5 bg-slate-950/40">
                        <div className="flex items-center space-x-1.5">
                          <div className="h-6 w-6 rounded bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                            K
                          </div>
                          <span className="font-bold tracking-tight">KhataIndex</span>
                        </div>
                        <div className="flex space-x-1">
                          <Search className="h-4 w-4 text-slate-400" />
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-400 self-center" />
                        </div>
                      </div>

                      {/* App Dashboard Account Balance card mockup */}
                      <div className="px-4 py-2.5 sm:py-3 space-y-3">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-2">
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                            Total Balance
                          </div>
                          <div className="text-xl font-bold text-blue-400">
                            ₹14,350 <span className="text-[10px] text-slate-400 font-normal">due to you</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[10px]">
                            <div>
                              <span className="text-slate-400 block">You Will Get</span>
                              <span className="text-blue-300 font-bold">₹26,250</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">You Will Give</span>
                              <span className="text-red-400 font-bold">₹13,900</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* App Recent transaction list mockup */}
                      <div className="flex-1 px-4 min-h-0 overflow-hidden flex flex-col space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase shrink-0">
                          <span>Recent Ledger Cards</span>
                          <span className="text-blue-400 font-bold text-[9px] hover:underline cursor-pointer font-sans">View All</span>
                        </div>

                        <div className="space-y-1.5 overflow-y-auto pr-0.5 flex-1 min-h-0 no-scrollbar">
                          {mockupLedgers.map((ledger, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5"
                            >
                              <div className="space-y-0.5">
                                <span className="font-bold block text-[11px] text-slate-200 truncate max-w-[120px]">
                                  {ledger.name}
                                </span>
                                <span className="text-[9px] text-slate-500">{ledger.date}</span>
                              </div>

                              <div className="text-right">
                                <span
                                  className={`font-bold block text-[11px] ${
                                    ledger.isNegative ? 'text-red-400' : 'text-blue-400'
                                  }`}
                                >
                                  {ledger.amount}
                                </span>
                                <span className="text-[8px] text-slate-500 uppercase font-semibold">
                                  {ledger.action}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom controls mockup */}
                      <div className="p-3 border-t border-white/5 bg-slate-950/80 flex justify-around items-center rounded-b-[36px] text-[10px] font-bold text-slate-400 shrink-0">
                        <span className="text-blue-400 flex flex-col items-center">
                          <TrendingUp className="h-4.5 w-4.5 mb-0.5" />
                          <span>Ledgers</span>
                        </span>
                        <span className="flex flex-col items-center">
                          <CreditCard className="h-4.5 w-4.5 mb-0.5 text-slate-500" />
                          <span>Book</span>
                        </span>
                        <span className="flex flex-col items-center">
                          <Smartphone className="h-4.5 w-4.5 mb-0.5 text-slate-500" />
                          <span>Sync</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Aesthetic Backdrop Blur circle */}
                <div className="absolute -z-10 h-72 w-72 bg-blue-500/10 rounded-full blur-3xl translate-y-12" />
              </div>

            </div>

            {/* VERSION HISTORY ARCHIVES SECTION */}
            <VersionHistory
              versions={versions}
              onDownload={handleDownloadVersion}
              isLoggedIn={!!user}
              onOpenAuth={() => setIsAuthOpen(true)}
            />

            {/* INSTALL GUIDE CARD SECTION */}
            <InstallGuide />
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-slate-950/40 backdrop-blur-sm mt-20 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white">KhataIndex Digital Platform</span>
            <span>|</span>
            <span>Built securely for ledger indexing operations</span>
          </div>

          <div className="flex items-center space-x-5">
            <a href="#install-guide" className="hover:text-blue-400 transition-colors">
              Help Center
            </a>
            <span className="text-white/10">•</span>
            <a href="#versions" className="hover:text-blue-400 transition-colors">
              Build Logs
            </a>
            <span className="text-white/10">•</span>
            <span>Secure SHA-256 Checksums</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal Container */}
      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            onSuccess={(u) => {
              setUser(u);
              showSuccess(`Welcome back, ${u.username}!`);
            }}
            onLogin={handleLogin}
            onRegister={handleRegister}
          />
        )}
      </AnimatePresence>

      {/* Edit Profile Modal Container */}
      <AnimatePresence>
        {isEditProfileOpen && user && (
          <EditProfileModal
            user={user}
            isOpen={isEditProfileOpen}
            onClose={() => setIsEditProfileOpen(false)}
            onUpdateUser={(updatedUser) => setUser(updatedUser)}
            onShowSuccess={showSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
