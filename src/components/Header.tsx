import { User } from '../types';
import { LogIn, LogOut, ShieldAlert, BookOpen, Layers, Settings, Home, MessageSquare } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  isAdminMode: boolean;
  onToggleAdminMode: () => void;
  onOpenEditProfile: () => void;
  currentTab: 'home' | 'feedback';
  onChangeTab: (tab: 'home' | 'feedback') => void;
  isFallback: boolean;
}

export default function Header({
  user,
  onOpenAuth,
  onLogout,
  isAdminMode,
  onToggleAdminMode,
  onOpenEditProfile,
  currentTab,
  onChangeTab,
  isFallback,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/40 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <button 
          onClick={() => {
            onChangeTab('home');
            if (isAdminMode) {
              onToggleAdminMode();
            }
          }}
          className="flex items-center space-x-2 sm:space-x-3 text-left focus:outline-none group shrink-0"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 transition group-hover:scale-105">
            <span className="text-white font-bold text-base sm:text-xl font-sans">K</span>
          </div>
          <div className="flex items-center">
            <span className="text-white text-lg sm:text-2xl font-light tracking-tight font-sans transition group-hover:text-blue-400">
              Khata<span className="font-bold text-white hidden xs:inline">Index</span>
            </span>
            <span className="ml-2 hidden xs:inline-flex items-center rounded-md bg-white/10 border border-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
              V1.1.0
            </span>
            {isFallback ? (
              <span className="ml-1.5 inline-flex items-center rounded-md bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 shadow-sm animate-pulse" title="Running in Local Sandbox Storage (Offline Mode)">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                Sandbox
              </span>
            ) : (
              <span className="ml-1.5 inline-flex items-center rounded-md bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 shadow-sm" title="Connected to Cloud Run Live API">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                Cloud API Live
              </span>
            )}
          </div>
        </button>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 md:space-x-4">
          <button
            onClick={() => {
              onChangeTab('home');
              if (isAdminMode) onToggleAdminMode();
            }}
            className={`flex items-center space-x-1 sm:space-x-1.5 text-xs sm:text-sm font-bold transition-all px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl ${
              currentTab === 'home' && !isAdminMode
                ? 'text-white bg-white/10'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400" />
            <span className="hidden xs:inline">Showcase</span>
          </button>

          <button
            onClick={() => {
              onChangeTab('feedback');
              if (isAdminMode) onToggleAdminMode();
            }}
            className={`flex items-center space-x-1 sm:space-x-1.5 text-xs sm:text-sm font-bold transition-all px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl ${
              currentTab === 'feedback' && !isAdminMode
                ? 'text-white bg-indigo-500/10'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-400" />
            <span className="hidden xs:inline">Feedback</span>
          </button>


          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* If Admin, show Toggle Admin Mode */}
              {user.role === 'admin' && (
                <button
                  onClick={onToggleAdminMode}
                  className={`inline-flex items-center space-x-1 rounded-full px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold transition-all border ${
                    isAdminMode
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/25'
                      : 'bg-white/5 border-white/10 text-white/90 hover:bg-white/10'
                  }`}
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-blue-400" />
                  <span className="hidden md:inline">
                    {isAdminMode ? 'View App Page' : 'Admin Console'}
                  </span>
                  <span className="md:hidden">{isAdminMode ? 'App' : 'Admin'}</span>
                </button>
              )}

              {/* User display - hidden except on larger viewports */}
              <div className="hidden flex-col items-end text-xs lg:flex">
                <span className="font-semibold text-white">{user.username}</span>
                <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold">
                  {user.role} Account
                </span>
              </div>

              {/* Edit Profile Button */}
              <button
                onClick={onOpenEditProfile}
                className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/80 transition-all hover:bg-white/10 hover:text-white shrink-0"
                title="Edit Profile Settings"
              >
                <Settings className="h-4 sm:h-4.5 sm:w-4.5 w-4 text-blue-400" />
              </button>

              {/* User Avatar Circle */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 text-xs font-bold uppercase shrink-0">
                {user.username.slice(0, 2)}
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="inline-flex h-8 sm:h-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 px-2 sm:px-3.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white text-xs sm:text-sm font-medium shrink-0"
                title="Log out"
              >
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-white text-slate-950 px-5 text-sm font-bold shadow-lg shadow-white/5 hover:bg-slate-100 transition-all"
            >
              <LogIn className="h-4 w-4 mr-1.5 text-slate-800" />
              <span>Login / Register</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
