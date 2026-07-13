import React, { useState } from 'react';
import { User, Feedback } from '../types';
import { submitFeedback } from '../api';
import { 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  Heart, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  HelpCircle,
  Clock,
  User as UserIcon,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FeedbackSectionProps {
  user: User | null;
  onOpenAuth: () => void;
  onShowSuccess: (msg: string) => void;
}

export default function FeedbackSection({
  user,
  onOpenAuth,
  onShowSuccess,
}: FeedbackSectionProps) {
  const [feedbackType, setFeedbackType] = useState<'bug' | 'suggestion' | 'general' | 'praise'>('suggestion');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { value: 'suggestion', label: 'Feature Idea', icon: Lightbulb, color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
    { value: 'bug', label: 'Bug / Issue', icon: Bug, color: 'text-rose-400 bg-rose-400/10 border-rose-400/20' },
    { value: 'general', label: 'General Info', icon: HelpCircle, color: 'text-sky-400 bg-sky-400/10 border-sky-400/20' },
    { value: 'praise', label: 'Love & Praise', icon: Heart, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    if (!message.trim()) {
      setError('Please write some comments or details before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await submitFeedback(feedbackType, message);
      onShowSuccess('Thank you! Your feedback has been logged directly in KhataIndex Core.');
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="feedback" className="mt-16 relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/20 p-6 sm:p-8 backdrop-blur-md">
      {/* Decorative ambient background */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 h-48 w-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Pitch / Header info */}
        <div className="w-full md:w-5/12 space-y-4">
          <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Developer Feedback Desk</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Help Subhajit Shape <span className="text-indigo-400">KhataIndex</span>
          </h2>
          
          <p className="text-sm text-slate-400 leading-relaxed">
            Spotted a glitch in the indexing engine? Have an optimization idea for ledger entries? 
            Send your raw thoughts straight to our development core. All submissions are indexed in real-time.
          </p>

          <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 text-xs text-slate-400 space-y-2.5">
            <div className="flex items-center space-x-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-blue-400" />
              <span>Real-time admin alerting active</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-blue-400" />
              <span>Automatic browser system configuration diagnostics attached</span>
            </div>
          </div>
        </div>

        {/* Live Feedback form */}
        <div className="w-full md:w-7/12">
          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = feedbackType === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFeedbackType(cat.value as any)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center ${
                        isSelected 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/15 scale-[1.02]' 
                          : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mb-1.5 ${isSelected ? 'text-white' : cat.color.split(' ')[0]}`} />
                      <span className="text-[11px] font-bold tracking-tight">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Message</label>
              <textarea
                rows={4}
                required
                className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none focus:border-indigo-500 focus:bg-white/10 transition resize-none"
                placeholder={
                  feedbackType === 'bug' 
                    ? "Explain the steps to reproduce the issue, and what happened..." 
                    : feedbackType === 'suggestion' 
                    ? "Describe your ideas for new tabs, metrics, or ledger tools..." 
                    : "Write your message here..."
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {/* Authenticated user badge or action */}
            {user ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 border border-white/5 p-3 rounded-2xl">
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-400/20 flex items-center justify-center text-indigo-300 font-extrabold uppercase text-[10px]">
                    {user.username.slice(0, 2)}
                  </div>
                  <span className="text-slate-300">Submitting as <span className="text-white font-bold">{user.username}</span></span>
                </div>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 shadow-lg shadow-indigo-600/15 transition flex items-center justify-center space-x-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{submitting ? 'Sending...' : 'Submit Feedback'}</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl">
                <p className="text-xs text-amber-300">
                  You must be registered and logged in to submit verified developer feedback.
                </p>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-5 py-2.5 transition shrink-0"
                >
                  Sign In to Share
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
