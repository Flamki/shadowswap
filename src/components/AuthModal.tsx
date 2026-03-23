import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ChevronRight, Shield, ArrowRight, Github, Chrome } from 'lucide-react';
import { cn } from '../lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate auth
    setTimeout(() => {
      setIsLoading(false);
      onSuccess();
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-bg-void/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-bg-void/90 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          >
            {/* Decorative Elements */}
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-teal-500/10 blur-[80px]" />
            <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-purple-500/10 blur-[80px]" />

            <div className="relative p-8 md:p-10">
              {/* Header */}
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-bg-void font-display font-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    S
                  </div>
                  <div className="flex flex-col">
                    <span className="font-display text-lg font-black tracking-tighter text-white">SHADOWSWAP</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-500/70">FHE Protocol</span>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-white/5 text-text-4 transition-all hover:bg-white/10 hover:text-white"
                >
                  <X size={18} className="transition-transform group-hover:rotate-90" />
                </button>
              </div>

              {/* Tabs */}
              <div className="mb-8 flex rounded-2xl bg-white/5 p-1">
                <button
                  onClick={() => setMode('login')}
                  className={cn(
                    "flex-1 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                    mode === 'login' ? "bg-white text-bg-void shadow-lg" : "text-text-4 hover:text-white"
                  )}
                >
                  Login
                </button>
                <button
                  onClick={() => setMode('signup')}
                  className={cn(
                    "flex-1 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                    mode === 'signup' ? "bg-white text-bg-void shadow-lg" : "text-text-4 hover:text-white"
                  )}
                >
                  Sign Up
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <label className="ml-1 text-[9px] font-black uppercase tracking-[0.2em] text-text-4">Username</label>
                    <div className="group relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-4 transition-colors group-focus-within:text-teal-500">
                        <User size={16} />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="shadow_user"
                        className="w-full rounded-2xl border border-white/5 bg-white/5 py-3.5 pl-11 pr-4 text-xs text-white placeholder:text-text-4/50 outline-none transition-all focus:border-teal-500/50 focus:bg-white/10"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="ml-1 text-[9px] font-black uppercase tracking-[0.2em] text-text-4">Email Address</label>
                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-4 transition-colors group-focus-within:text-teal-500">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="user@shadowswap.io"
                      className="w-full rounded-2xl border border-white/5 bg-white/5 py-3.5 pl-11 pr-4 text-xs text-white placeholder:text-text-4/50 outline-none transition-all focus:border-teal-500/50 focus:bg-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-4">Password</label>
                    {mode === 'login' && (
                      <button type="button" className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-500 hover:text-teal-400 transition-colors">Forgot?</button>
                    )}
                  </div>
                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-4 transition-colors group-focus-within:text-teal-500">
                      <Lock size={16} />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-white/5 bg-white/5 py-3.5 pl-11 pr-4 text-xs text-white placeholder:text-text-4/50 outline-none transition-all focus:border-teal-500/50 focus:bg-white/10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative mt-4 w-full overflow-hidden rounded-2xl bg-teal-500 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-bg-void transition-all hover:bg-teal-400 active:scale-95 disabled:opacity-50"
                >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-bg-void border-t-transparent" />
                    ) : (
                      <>
                        {mode === 'login' ? 'Access Protocol' : 'Initialize Account'}
                        <ArrowRight size={14} />
                      </>
                    )}
                  </div>
                </button>
              </form>

              {/* Divider */}
              <div className="my-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-4">Or Continue With</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              {/* Social Logins */}
              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/5 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-white/10">
                  <Chrome size={14} className="text-teal-500" />
                  Google
                </button>
                <button className="flex items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/5 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-white/10">
                  <Github size={14} className="text-purple-500" />
                  GitHub
                </button>
              </div>

              {/* Footer Info */}
              <div className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-teal-500/5 p-3 border border-teal-500/10">
                <Shield size={12} className="text-teal-500" />
                <span className="text-[8px] font-bold text-teal-500/70 uppercase tracking-widest">End-to-End Encrypted Authentication</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
