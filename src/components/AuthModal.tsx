import React, { useState } from 'react';
import { User } from '../types';
import { X, Lock, Mail, User as UserIcon, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  onLogin: (identifier: string, pass: string) => Promise<{ user: User }>;
  onRegister: (username: string, email: string, pass: string) => Promise<{ user: User }>;
}

type AuthTab = 'login' | 'register';

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  onLogin,
  onRegister,
}: AuthModalProps) {
  const [tab, setTab] = useState<AuthTab>('login');
  
  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Status
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) {
      setError('Please fill in all fields.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const response = await onLogin(loginIdentifier, loginPassword);
      onSuccess(response.user);
      onClose();
      // Clear inputs
      setLoginIdentifier('');
      setLoginPassword('');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !regEmail || !regPassword || !regConfirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const response = await onRegister(regUsername, regEmail, regPassword);
      onSuccess(response.user);
      onClose();
      // Clear inputs
      setRegUsername('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/90 backdrop-blur-xl shadow-2xl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="px-6 pt-8 pb-6 border-b border-white/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-sans text-lg font-bold mb-3 shadow-lg shadow-blue-500/20">
            K
          </div>
          <h2 className="font-sans text-xl font-bold text-white">
            Welcome to KhataIndex
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Access, download, and track official ledger-indexing application builds.
          </p>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-white/10">
          <button
            className={`flex-1 py-3.5 text-center text-sm font-bold transition ${
              tab === 'login'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-white/40 hover:text-white/60'
            }`}
            onClick={() => {
              setTab('login');
              setError(null);
            }}
          >
            Login
          </button>
          <button
            className={`flex-1 py-3.5 text-center text-sm font-bold transition ${
              tab === 'register'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-white/40 hover:text-white/60'
            }`}
            onClick={() => {
              setTab('register');
              setError(null);
            }}
          >
            Register Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 flex items-start space-x-2 rounded-xl bg-red-500/10 p-3 text-xs text-red-300 border border-red-500/20">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Contents */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {tab === 'login' ? (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleLoginSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">
                    Username or Email
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute top-3 left-3.5 h-4 w-4 text-white/40" />
                    <input
                      type="text"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500 focus:bg-white/10 transition"
                      placeholder="Your username or email"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute top-3 left-3.5 h-4 w-4 text-white/40" />
                    <input
                      type="password"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500 focus:bg-white/10 transition"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="register-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleRegisterSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute top-3 left-3.5 h-4 w-4 text-white/40" />
                    <input
                      type="text"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500 focus:bg-white/10 transition"
                      placeholder="businessowner"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute top-3 left-3.5 h-4 w-4 text-white/40" />
                    <input
                      type="email"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500 focus:bg-white/10 transition"
                      placeholder="owner@mycompany.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute top-3 left-3.5 h-4 w-4 text-white/40" />
                      <input
                        type="password"
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-blue-500 focus:bg-white/10 transition"
                        placeholder="••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute top-3 left-3.5 h-4 w-4 text-white/40" />
                      <input
                        type="password"
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-blue-500 focus:bg-white/10 transition"
                        placeholder="••••••"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Register & Log In'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
