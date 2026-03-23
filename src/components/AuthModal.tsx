import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Shield, ArrowRight, Github, Chrome, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const inputBaseClass =
  'w-full rounded-2xl border border-white/5 bg-white/5 py-3.5 pl-11 pr-4 text-xs text-white placeholder:text-text-4/50 outline-none transition-all focus:border-teal-500/50 focus:bg-white/10';

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      onSuccess();
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-bg-void/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-[32px] border border-white/10 bg-bg-void/90 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          >
            <div className="absolute -top-28 -right-24 h-56 w-56 rounded-full bg-teal-500/10 blur-[90px]" />
            <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-purple-500/10 blur-[90px]" />

            <div className="relative grid md:grid-cols-[1fr_1.2fr]">
              <div className="hidden md:flex flex-col justify-between border-r border-white/5 bg-white/[0.02] p-10">
                <div>
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-2">
                    <Sparkles size={12} className="text-teal-500" />
                    <span className="text-[9px] font-black uppercase tracking-[0.22em] text-teal-500">Private By Default</span>
                  </div>
                  <h2 className="font-display text-4xl font-black leading-[0.9] tracking-tight text-white">
                    Enter
                    <br />
                    ShadowSwap
                  </h2>
                  <p className="mt-5 max-w-sm text-sm leading-relaxed text-text-3">
                    Authenticate securely and access encrypted trading flows with a smoother, faster interface.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-3">No Public Order Leaks</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-3">Low-Latency Secure Session</p>
                  </div>
                </div>
              </div>

              <div className="relative max-h-[92vh] overflow-y-auto p-6 sm:p-8 md:p-10">
                <div className="mb-7 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-display font-black text-bg-void shadow-[0_0_20px_rgba(255,255,255,0.2)]">
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

                <div className="relative mb-7 grid grid-cols-2 rounded-2xl bg-white/5 p-1">
                  <motion.div
                    className="absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-xl bg-white shadow-lg"
                    animate={{ x: mode === 'login' ? '0%' : '100%' }}
                    transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                  />
                  <button
                    onClick={() => setMode('login')}
                    className={cn(
                      'relative z-10 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300',
                      mode === 'login' ? 'text-bg-void' : 'text-text-4 hover:text-white',
                    )}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setMode('signup')}
                    className={cn(
                      'relative z-10 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300',
                      mode === 'signup' ? 'text-bg-void' : 'text-text-4 hover:text-white',
                    )}
                  >
                    Sign Up
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <motion.div layout transition={{ duration: 0.25, ease: 'easeOut' }} className="space-y-4">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={mode}
                        initial={{ opacity: 0, x: mode === 'signup' ? 22 : -22 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: mode === 'signup' ? -22 : 22 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-4"
                      >
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
                                className={inputBaseClass}
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
                              className={inputBaseClass}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between px-1">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-4">Password</label>
                            {mode === 'login' && (
                              <button
                                type="button"
                                className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-500 transition-colors hover:text-teal-400"
                              >
                                Forgot?
                              </button>
                            )}
                          </div>
                          <div className="group relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-4 transition-colors group-focus-within:text-teal-500">
                              <Lock size={16} />
                            </div>
                            <input
                              type="password"
                              required
                              placeholder="********"
                              className={inputBaseClass}
                            />
                          </div>
                        </div>

                        {mode === 'signup' && (
                          <div className="space-y-2">
                            <label className="ml-1 text-[9px] font-black uppercase tracking-[0.2em] text-text-4">Confirm Password</label>
                            <div className="group relative">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-4 transition-colors group-focus-within:text-teal-500">
                                <Lock size={16} />
                              </div>
                              <input
                                type="password"
                                required={mode === 'signup'}
                                placeholder="********"
                                className={inputBaseClass}
                              />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="relative mt-1 w-full overflow-hidden rounded-2xl bg-teal-500 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-bg-void transition-all hover:bg-teal-400 active:scale-95 disabled:opacity-50"
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

                <div className="my-7 flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-4">Or Continue With</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>

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

                <div className="mt-7 flex items-center justify-center gap-2 rounded-xl border border-teal-500/10 bg-teal-500/5 p-3">
                  <Shield size={12} className="text-teal-500" />
                  <span className="text-[8px] font-bold uppercase tracking-widest text-teal-500/70">
                    End-to-End Encrypted Authentication
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
