import React, { Suspense, lazy, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Shield, Lock, Eye, Zap, ChevronDown, Info, AlertTriangle, CheckCircle2, Clock, Activity, Code, Cpu, Layers, BarChart3, Terminal } from 'lucide-react';
import { ThreeScene } from './components/ThreeScene';
import { EncryptedValue } from './components/EncryptedValue';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { cn } from './lib/utils';

const PortfolioPage = lazy(async () => {
  const module = await import('./components/PortfolioPage');
  return { default: module.PortfolioPage };
});

const AnalyticsPage = lazy(async () => {
  const module = await import('./components/AnalyticsPage');
  return { default: module.AnalyticsPage };
});

const HowItWorksPage = lazy(async () => {
  const module = await import('./components/HowItWorksPage');
  return { default: module.HowItWorksPage };
});

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [walletConnected, setWalletConnected] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [revealedItems, setRevealedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (currentPage !== 'landing') {
      return;
    }

    let frameId: number | null = null;
    let lastEvent: PointerEvent | null = null;

    const updateHoveredCard = () => {
      frameId = null;
      if (!lastEvent) {
        return;
      }

      const hovered = (lastEvent.target as HTMLElement | null)?.closest('.premium-card') as HTMLElement | null;
      if (!hovered) {
        return;
      }

      const rect = hovered.getBoundingClientRect();
      const x = lastEvent.clientX - rect.left;
      const y = lastEvent.clientY - rect.top;

      hovered.style.setProperty('--mouse-x', `${x}px`);
      hovered.style.setProperty('--mouse-y', `${y}px`);
    };

    const handlePointerMove = (event: PointerEvent) => {
      lastEvent = event;
      if (frameId !== null) {
        return;
      }
      frameId = requestAnimationFrame(updateHoveredCard);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [currentPage]);

  const toggleReveal = (id: string) => {
    setRevealedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAuthSuccess = () => {
    setWalletConnected(true);
    if (currentPage === 'landing') {
      setCurrentPage('trade');
    }
  };

  return (
    <div className="min-h-screen selection:bg-teal-500/30 grid-pattern">
      {currentPage !== 'landing' && (
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      )}
      
      <div className={cn(
        "transition-all duration-500",
        currentPage !== 'landing' && "lg:pl-64"
      )}>
        <Header 
          currentPage={currentPage} 
          onPageChange={setCurrentPage} 
          onAuthClick={() => setIsAuthModalOpen(true)}
          isLoggedIn={walletConnected}
        />

        <main className="relative z-10">
          {/* Global Ambient Glows */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/5 blur-[120px] rounded-full animate-pulse-slow" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
          </div>

          <AnimatePresence mode="wait">
          {currentPage === 'landing' && (
            <LandingPage 
              onStart={() => setIsAuthModalOpen(true)} 
              onHowItWorks={() => setCurrentPage('how-it-works')}
            />
          )}
          {currentPage === 'trade' && (
            <TradePage 
              revealedItems={revealedItems} 
              onToggleReveal={toggleReveal} 
            />
          )}
          {currentPage === 'portfolio' && (
            <Suspense fallback={<PageLoadingFallback />}>
              <PortfolioPage 
                revealedItems={revealedItems} 
                onToggleReveal={toggleReveal} 
              />
            </Suspense>
          )}
          {currentPage === 'analytics' && (
            <Suspense fallback={<PageLoadingFallback />}>
              <AnalyticsPage />
            </Suspense>
          )}
          {currentPage === 'how-it-works' && (
            <Suspense fallback={<PageLoadingFallback />}>
              <HowItWorksPage onStart={() => setIsAuthModalOpen(true)} />
            </Suspense>
          )}
        </AnimatePresence>
      </main>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

function PageLoadingFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center px-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-text-3">
        Loading Interface...
      </div>
    </div>
  );
}

function LandingPage({ onStart, onHowItWorks }: { onStart: () => void, onHowItWorks: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative grainy-bg"
    >
      {/* Hero Section */}
      <section className="landing-section relative min-h-screen flex flex-col items-center justify-start pt-32 md:pt-48 px-6 md:px-12 overflow-hidden">
        {/* Background Layers */}
        <div className="absolute inset-0 z-0">
          <ThreeScene type="hero" opacity={0.5} />
          
          {/* Cinematic Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,rgba(5,5,5,0.8)_100%)]" />
          
          {/* Scanline Effect */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%]" />
          
          {/* Large Background Text (Ghosted) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none opacity-[0.02]">
            <span className="font-display text-[40vw] font-black tracking-[-0.1em] leading-none">PRIVACY</span>
          </div>
        </div>
        
        <div className="relative z-10 w-full max-w-[1800px] grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Vertical Rail Text */}
          <div className="hidden lg:flex lg:col-span-1 flex-col items-center justify-center gap-12">
            <div className="h-32 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            <span className="writing-vertical-rl rotate-180 font-mono text-[10px] font-black text-text-4 uppercase tracking-[0.6em] whitespace-nowrap">
              ENCRYPTED LIQUIDITY LAYER
            </span>
            <div className="h-32 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          </div>

          {/* Main Content: Center-Left */}
          <div className="lg:col-span-10 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8 flex justify-center lg:justify-start"
            >
              <div className="group relative flex items-center gap-4 rounded-sm border-l-2 border-teal-500 bg-white/[0.02] px-6 py-3 backdrop-blur-3xl transition-all hover:bg-white/[0.05]">
                <span className="font-mono text-[11px] font-black text-teal-500 uppercase tracking-[0.3em]">
                  PROTOCOL STATUS: <span className="text-white">OPERATIONAL</span>
                </span>
                <div className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
              </div>
            </motion.div>

            <div className="relative">
              <motion.h1 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-[18vw] md:text-[14vw] lg:text-[12vw] font-black tracking-[-0.08em] text-white leading-[0.7] uppercase mb-8"
              >
                <div className="relative inline-block overflow-hidden group">
                  <span className="relative z-10">SHADOW</span>
                  <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 mix-blend-difference" />
                </div>
                <br />
                <div className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-purple-400 to-orange-400 group">
                   <span className="relative z-10">SWAP</span>
                   <div className="absolute -inset-4 bg-teal-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                </div>
              </motion.h1>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl"
            >
              <p className="text-text-2 text-xl md:text-3xl lg:text-4xl font-light mb-12 leading-[1.1] tracking-tight text-center lg:text-left">
                The dark pool DEX where your <span className="text-white font-medium italic">intent</span> stays hidden. Trade on-chain with <span className="text-white font-black underline decoration-teal-500/50 underline-offset-8">zero exposure</span>.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-8 justify-center lg:justify-start">
                {/* Buttons removed as requested */}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Technical Stats (Recipe 1) */}
          <div className="hidden lg:flex lg:col-span-1 flex-col items-center justify-center gap-16">
            <div className="flex flex-col items-center gap-2">
              <span className="font-mono text-[9px] font-black text-text-4 uppercase tracking-[0.4em]">Latency</span>
              <span className="font-mono text-xs font-black text-teal-500">12MS</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="font-mono text-[9px] font-black text-text-4 uppercase tracking-[0.4em]">Uptime</span>
              <span className="font-mono text-xs font-black text-teal-500">99.9%</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="font-mono text-[9px] font-black text-text-4 uppercase tracking-[0.4em]">Nodes</span>
              <span className="font-mono text-xs font-black text-teal-500">128</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar (Recipe 1) */}
        <div className="absolute bottom-0 left-0 w-full border-t border-white/5 bg-white/[0.01] backdrop-blur-xl px-12 py-6 hidden md:flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              <span className="font-mono text-[10px] font-black text-text-3 uppercase tracking-widest">Arbitrum Sepolia Mainnet</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] font-black text-text-4 uppercase tracking-widest">Block Height:</span>
              <span className="font-mono text-[10px] font-black text-white uppercase tracking-widest">12,492,102</span>
            </div>
          </div>
          
          <motion.div 
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-3"
          >
            <span className="font-mono text-[10px] font-black text-teal-500 uppercase tracking-[0.4em]">Secure Connection Established</span>
          </motion.div>
        </div>
      </section>

      {/* Stats / Proof Section */}
      <section className="landing-section py-32 px-4 relative">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { label: "Encrypted Volume", value: "$1.2B+", sub: "Processed via FHE", icon: BarChart3 },
              { label: "MEV Extracted", value: "$0", sub: "100% Protection", icon: Shield },
              { label: "Settlement Time", value: "< 20s", sub: "On-chain Finality", icon: Zap },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="premium-card p-12 group hover:border-teal-500/30 transition-all duration-500"
              >
                <div className="flex justify-center mb-8">
                  <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center text-text-4 group-hover:text-teal-400 transition-colors">
                    <stat.icon size={32} />
                  </div>
                </div>
                <p className="text-text-4 text-[10px] font-black uppercase tracking-[0.3em] mb-4">{stat.label}</p>
                <h3 className="text-5xl md:text-7xl font-black text-white mb-4 text-gradient">{stat.value}</h3>
                <p className="text-teal-500/60 text-xs font-black uppercase tracking-widest">{stat.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Invisible Engine - 3D Section */}
      <section className="landing-section py-48 px-4 relative overflow-hidden bg-bg-deep">
        <div className="absolute inset-0 z-0">
          <ThreeScene type="mempool" opacity={0.4} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-bg-void via-transparent to-bg-void" />
        
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-24">
            <div className="lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest mb-12">
                  <Activity size={12} />
                  <span>Real-time Mempool Visualization</span>
                </div>
                <h2 className="font-display text-6xl md:text-8xl font-black text-white mb-12 leading-[0.9] tracking-tighter">
                  THE<br />
                  <span className="text-orange-500 text-gradient">EXPOSED</span><br />
                  MEMPOOL.
                </h2>
                <p className="text-text-2 text-xl md:text-2xl mb-12 leading-tight max-w-xl font-light">
                  In a standard DEX, your trade intent is broadcast to the world. Predatory bots scan this "mempool" to front-run your orders, extracting billions in value every year.
                </p>
                <div className="flex flex-wrap gap-4">
                  {['Front-running', 'Sandwich Attacks', 'Mempool Sniping'].map((tag, i) => (
                    <span key={i} className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-text-3 text-xs font-bold uppercase tracking-widest">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>
            
            <div className="lg:w-1/2 w-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative aspect-square"
              >
                {/* Interactive 3D element placeholder or more complex SVG */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 animate-pulse-slow">
                      <svg viewBox="0 0 400 400" className="w-full h-full opacity-20">
                        <circle cx="200" cy="200" r="150" fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="10 10" />
                        <circle cx="200" cy="200" r="100" fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="5 5" />
                      </svg>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-8xl font-black text-orange-500 mb-4 animate-pulse">85%</div>
                        <div className="text-text-4 text-xs font-black uppercase tracking-[0.4em]">Exploitation Risk</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Before vs After - Comparison Section */}
      <section className="landing-section py-48 px-4 relative">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-32">
            <h2 className="font-display text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter uppercase">The Privacy Upgrade</h2>
            <p className="text-text-2 text-xl max-w-2xl mx-auto font-light">See how ShadowSwap transforms the trading experience from public exposure to total privacy.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Before */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="premium-card p-12 border-orange-500/10 bg-orange-500/[0.02]"
            >
              <div className="flex items-center justify-between mb-12">
                <span className="px-4 py-2 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest">Traditional DEX</span>
                <AlertTriangle size={20} className="text-orange-500" />
              </div>
              <div className="space-y-8 mb-12">
                {[
                  { label: "Visibility", val: "Public", status: "Exposed" },
                  { label: "MEV Protection", val: "None", status: "Vulnerable" },
                  { label: "Trade Intent", val: "Broadcasted", status: "Targeted" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center pb-6 border-b border-white/5">
                    <span className="text-text-4 text-xs font-black uppercase tracking-widest">{item.label}</span>
                    <div className="text-right">
                      <div className="text-white font-black text-lg mb-1">{item.val}</div>
                      <div className="text-orange-500 text-[10px] font-black uppercase tracking-tighter">{item.status}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-8 border-t border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-text-4 text-[10px] font-black uppercase tracking-widest">Privacy Score</span>
                  <span className="text-orange-500 font-mono font-black">12/100</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: "12%" }}
                    viewport={{ once: true }}
                    className="h-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                  />
                </div>
              </div>
            </motion.div>

            {/* After */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="premium-card p-12 border-teal-500/30 bg-teal-500/[0.05] shadow-[0_0_50px_rgba(31,214,200,0.1)]"
            >
              <div className="flex items-center justify-between mb-12">
                <span className="px-4 py-2 rounded-full bg-teal-500/10 text-teal-500 text-[10px] font-black uppercase tracking-widest">ShadowSwap</span>
                <CheckCircle2 size={20} className="text-teal-500" />
              </div>
              <div className="space-y-8 mb-12">
                {[
                  { label: "Visibility", val: "Encrypted", status: "Private" },
                  { label: "MEV Protection", val: "100%", status: "Immune" },
                  { label: "Trade Intent", val: "Sealed", status: "Protected" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center pb-6 border-b border-white/5">
                    <span className="text-text-4 text-xs font-black uppercase tracking-widest">{item.label}</span>
                    <div className="text-right">
                      <div className="text-white font-black text-lg mb-1">{item.val}</div>
                      <div className="text-teal-500 text-[10px] font-black uppercase tracking-tighter">{item.status}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-8 border-t border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-text-4 text-[10px] font-black uppercase tracking-widest">Privacy Score</span>
                  <span className="text-teal-500 font-mono font-black">99/100</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: "99%" }}
                    viewport={{ once: true }}
                    className="h-full bg-teal-500 shadow-[0_0_15px_rgba(31,214,200,0.5)]"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Scale of Privacy - Circular Stats Section */}
      <section className="landing-section py-48 px-4 relative overflow-hidden">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-32">
            <div className="lg:w-1/2">
              <div className="relative w-full aspect-square max-w-md mx-auto">
                <svg viewBox="0 0 400 400" className="w-full h-full">
                  <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#1fd6c8', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <motion.circle 
                    cx="200" cy="200" r="180" 
                    fill="none" stroke="url(#grad1)" strokeWidth="40" strokeDasharray="1130"
                    initial={{ strokeDashoffset: 1130 }}
                    whileInView={{ strokeDashoffset: 200 }}
                    viewport={{ once: true }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="opacity-20"
                  />
                  <motion.circle 
                    cx="200" cy="200" r="140" 
                    fill="none" stroke="url(#grad1)" strokeWidth="30" strokeDasharray="880"
                    initial={{ strokeDashoffset: 880 }}
                    whileInView={{ strokeDashoffset: 150 }}
                    viewport={{ once: true }}
                    transition={{ duration: 2, delay: 0.2, ease: "easeOut" }}
                    className="opacity-40"
                  />
                  <motion.circle 
                    cx="200" cy="200" r="100" 
                    fill="none" stroke="url(#grad1)" strokeWidth="20" strokeDasharray="628"
                    initial={{ strokeDashoffset: 628 }}
                    whileInView={{ strokeDashoffset: 100 }}
                    viewport={{ once: true }}
                    transition={{ duration: 2, delay: 0.4, ease: "easeOut" }}
                    className="opacity-60"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-black text-white mb-2">40TB</div>
                    <div className="text-text-4 text-[10px] font-black uppercase tracking-widest">Daily Encrypted Data</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="font-display text-5xl md:text-7xl font-black text-white mb-12 leading-none tracking-tighter">
                  PRIVACY AT<br />
                  <span className="text-teal-500 text-gradient">HYPERSCALE.</span>
                </h2>
                <div className="space-y-12">
                  {[
                    { label: "Inference Calls", val: "600M+", desc: "Monthly FHE computations processed on-chain." },
                    { label: "Network Capacity", val: "100Gbps", desc: "High-throughput encrypted data streaming." },
                    { label: "Global Nodes", val: "4,200+", desc: "Decentralized FHE validators securing the pool." },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-8">
                      <div className="text-teal-500 font-black text-2xl opacity-20">0{i + 1}</div>
                      <div>
                        <div className="flex items-center gap-4 mb-2">
                          <h4 className="text-white font-black text-lg uppercase tracking-tight">{item.label}</h4>
                          <span className="text-teal-500 font-black text-lg">{item.val}</span>
                        </div>
                        <p className="text-text-3 text-base leading-relaxed opacity-70">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Shadow SDK - Code Snippet Section */}
      <section className="landing-section py-48 px-4 relative bg-bg-void">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-24 items-center">
            <div className="lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-500 text-[10px] font-black uppercase tracking-widest mb-12">
                  <Code size={12} />
                  <span>Developer Experience</span>
                </div>
                <h2 className="font-display text-5xl md:text-7xl font-black text-white mb-12 leading-none tracking-tighter">
                  INTEGRATE IN<br />
                  <span className="text-teal-500 text-gradient">MINUTES.</span>
                </h2>
                <p className="text-text-2 text-xl mb-12 leading-relaxed font-light">
                  Building a private dApp shouldn't be hard. Our SDK abstracts away the complexity of FHE, allowing you to encrypt and trade with just a few lines of code.
                </p>
                <ul className="space-y-6">
                  {[
                    { icon: Zap, text: "Auto-encryption of trade parameters" },
                    { icon: Layers, text: "Seamless Arbitrum Sepolia integration" },
                    { icon: Cpu, text: "Optimized FHE proof generation" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-4 text-text-2 font-bold">
                      <div className="text-teal-500"><item.icon size={20} /></div>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            <div className="lg:w-1/2 w-full">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="premium-card p-0 overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)]"
              >
                <div className="bg-white/5 px-8 py-4 flex items-center justify-between border-b border-white/5">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500/50" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
                    <div className="h-3 w-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="flex items-center gap-2 text-text-4 text-[10px] font-black uppercase tracking-widest">
                    <Terminal size={12} />
                    <span>shadow-sdk.ts</span>
                  </div>
                </div>
                <div className="p-12 font-mono text-sm leading-relaxed overflow-x-auto">
                  <pre className="text-text-3">
                    <code className="block">
                      <span className="text-purple-400">import</span> {'{ ShadowSDK }'} <span className="text-purple-400">from</span> <span className="text-teal-400">'@shadowswap/sdk'</span>;{'\n\n'}
                      <span className="text-text-4">// Initialize the protocol</span>{'\n'}
                      <span className="text-purple-400">const</span> shadow = <span className="text-purple-400">new</span> <span className="text-yellow-400">ShadowSDK</span>({'{'}{'\n'}
                      {'  '}network: <span className="text-teal-400">'arbitrum-sepolia'</span>,{'\n'}
                      {'  '}privacy: <span className="text-teal-400">'FHE_MAX'</span>{'\n'}
                      {'}'});{'\n\n'}
                      <span className="text-text-4">// Encrypt and submit order</span>{'\n'}
                      <span className="text-purple-400">await</span> shadow.<span className="text-yellow-400">submitOrder</span>({'{'}{'\n'}
                      {'  '}pair: <span className="text-teal-400">'WETH/USDC'</span>,{'\n'}
                      {'  '}amount: <span className="text-orange-400">10.5</span>,{'\n'}
                      {'  '}price: <span className="text-orange-400">2845.50</span>,{'\n'}
                      {'  '}side: <span className="text-teal-400">'BUY'</span>{'\n'}
                      {'}'});{'\n\n'}
                      <span className="text-text-4">// The SDK handles encryption locally</span>{'\n'}
                      <span className="text-text-4">// Your intent never leaves your device</span>
                    </code>
                  </pre>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section - Editorial Style */}
      <section className="landing-section py-48 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-24 items-center">
            <div className="lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="font-display text-6xl md:text-[10rem] font-black text-white mb-12 leading-[0.8] tracking-tighter">
                  THE<br />
                  <span className="text-orange-500 text-gradient">EXPOSURE</span><br />
                  RISK.
                </h2>
                <p className="text-text-2 text-xl md:text-2xl mb-16 leading-tight max-w-xl font-light">
                  Public mempools are a playground for predatory bots. Every trade you make is a signal for MEV bots to front-run, sandwich, and extract value from your slippage.
                </p>
                <div className="space-y-10">
                  {[
                    { label: "FRONT-RUNNING", desc: "Bots jump ahead of your trade to profit from price impact.", icon: Zap },
                    { label: "MEMPOOL EXPOSURE", desc: "Your trade intent is visible to everyone on-chain.", icon: Eye },
                    { label: "MEV EXTRACTION", desc: "Billions are lost annually to sandwich attacks.", icon: AlertTriangle },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-8 group">
                      <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/5 text-orange-500 transition-all duration-500 group-hover:bg-orange-500/10 group-hover:scale-110">
                        <item.icon size={20} />
                      </div>
                      <div>
                        <h4 className="text-white font-black mb-2 tracking-[0.2em] text-sm uppercase">{item.label}</h4>
                        <p className="text-text-3 text-base leading-relaxed opacity-70">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
            
            <div className="lg:w-1/2 w-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="premium-card p-12 relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-orange-500/10">
                  <div className="h-full bg-orange-500 w-1/3 animate-shimmer shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
                </div>
                
                <div className="flex justify-between items-center mb-12">
                  <div className="flex items-center gap-4">
                    <div className="h-3 w-3 rounded-full bg-orange-500 animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.6)]" />
                    <span className="font-mono text-[11px] text-orange-500 uppercase tracking-[0.4em] font-black">Mempool Scanner · Live</span>
                  </div>
                  <span className="font-mono text-[11px] text-text-4 font-black tracking-tighter">0x4f2a...B8C1</span>
                </div>
                
                <div className="space-y-6 font-mono">
                  {[
                    { label: "Amount", val: "18.5 WETH", status: "VISIBLE" },
                    { label: "Price", val: "$2,847.00", status: "VISIBLE" },
                    { label: "Direction", val: "BUY", status: "VISIBLE" },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center p-6 rounded-[1.5rem] bg-white/[0.02] border border-white/[0.05] group-hover:bg-white/[0.04] transition-colors duration-500">
                      <span className="text-text-3 text-[10px] uppercase font-black tracking-[0.3em] opacity-60">{row.label}</span>
                      <div className="flex items-center gap-6">
                        <span className="text-white text-base font-black tracking-tighter">{row.val}</span>
                        <span className="text-[10px] text-orange-500/80 font-black tracking-tighter animate-pulse">← {row.status}</span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-16 p-10 rounded-[2rem] border border-orange-500/20 bg-orange-500/5 backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 text-orange-500 mb-6">
                        <Activity size={24} className="animate-bounce" />
                        <span className="text-xs font-black uppercase tracking-[0.3em]">MEV Opportunity Detected</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-6">
                        <motion.div 
                          className="h-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                          initial={{ width: "0%" }}
                          whileInView={{ width: "85%" }}
                          transition={{ duration: 2, delay: 0.5 }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-text-4">
                        <span>Scanning Blocks</span>
                        <span className="text-orange-500">85% Confidence</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section - Immersive */}
      <section className="landing-section py-48 px-4 relative overflow-hidden bg-bg-deep">
        <div className="absolute inset-0 opacity-40">
          <ThreeScene type="vault" opacity={0.6} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-bg-void via-transparent to-bg-void" />
        
        <div className="mx-auto max-w-6xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-6xl md:text-[10rem] font-black text-white mb-12 leading-[0.8] tracking-tighter">
              THE<br />
              <span className="text-teal-500 text-gradient">SHADOW</span><br />
              PROTOCOL.
            </h2>
            <p className="text-text-2 text-xl md:text-3xl mb-24 leading-tight max-w-3xl mx-auto font-light">
              ShadowSwap encrypts your orders on-chain using FHE. We match trades while they are still encrypted. No one—not even the validators—can see your trade until it is settled.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[
              { 
                icon: Lock, 
                title: "Client-Side Encryption", 
                desc: "Your order is encrypted in your browser before it ever hits the network. Your keys, your privacy.",
                color: "teal"
              },
              { 
                icon: Shield, 
                title: "On-Chain Matching", 
                desc: "The smart contract computes the match using FHE primitives. The data remains sealed throughout the process.",
                color: "teal"
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="premium-card p-16 text-left group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <item.icon size={120} />
                </div>
                <div className="h-20 w-20 rounded-3xl bg-teal-500/10 text-teal-500 flex items-center justify-center mb-12 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(31,214,200,0.1)] border border-teal-500/20">
                  <item.icon size={40} />
                </div>
                <h3 className="text-4xl font-black text-white mb-6 uppercase tracking-tight leading-none">{item.title}</h3>
                <p className="text-text-2 text-lg leading-relaxed font-medium opacity-80">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Dark Pool - Interactive Matching Visualization */}
      <section className="landing-section py-48 px-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <ThreeScene type="matching" opacity={0.5} />
        </div>
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="font-display text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter uppercase">The Dark Pool Engine</h2>
              <p className="text-text-2 text-xl max-w-2xl mx-auto font-light">Witness the invisible. Two encrypted orders meet in the dark pool, matching with mathematical certainty without ever revealing their contents.</p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
              {[
                { label: "Order A (Encrypted)", val: "0x7f...3a", color: "teal" },
                { label: "Matching State", val: "COMPUTING", color: "white" },
                { label: "Order B (Encrypted)", val: "0xa2...9e", color: "purple" },
              ].map((item, i) => (
                <div key={i} className="premium-card p-8 bg-white/[0.02] border-white/5">
                  <div className="text-text-4 text-[10px] font-black uppercase tracking-[0.4em] mb-4">{item.label}</div>
                  <div className={cn(
                    "text-2xl font-mono font-black tracking-tighter",
                    item.color === 'teal' ? "text-teal-500" : item.color === 'purple' ? "text-purple-500" : "text-white animate-pulse"
                  )}>
                    {item.val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Full Footer */}
      <footer className="border-t border-white/5 bg-bg-void/80 backdrop-blur-xl py-24 px-4 relative z-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-bg-void font-display font-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  S
                </div>
                <span className="font-display text-2xl font-black tracking-tighter text-white">SHADOWSWAP</span>
              </div>
              <p className="text-text-2 text-lg max-w-md mb-8 leading-relaxed">
                The first dark pool DEX using Fully Homomorphic Encryption (FHE) on Arbitrum Sepolia.
              </p>
              <div className="flex gap-6">
                <a href="#" className="text-text-3 hover:text-teal-500 transition-colors font-bold uppercase tracking-widest text-xs">GitHub</a>
                <a href="#" className="text-text-3 hover:text-teal-500 transition-colors font-bold uppercase tracking-widest text-xs">Fhenix Docs</a>
                <a href="#" className="text-text-3 hover:text-teal-500 transition-colors font-bold uppercase tracking-widest text-xs">Twitter</a>
              </div>
            </div>
            <div>
              <h4 className="text-text-1 font-black text-xs mb-6 uppercase tracking-[0.2em]">Platform</h4>
              <ul className="space-y-4 text-sm text-text-2 font-bold uppercase tracking-widest">
                <li><button onClick={onStart} className="hover:text-teal-500 transition-colors">Trade</button></li>
                <li><button onClick={onStart} className="hover:text-teal-500 transition-colors">Portfolio</button></li>
                <li><button onClick={onStart} className="hover:text-teal-500 transition-colors">Analytics</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-text-1 font-black text-xs mb-6 uppercase tracking-[0.2em]">Resources</h4>
              <ul className="space-y-4 text-sm text-text-2 font-bold uppercase tracking-widest">
                <li><button onClick={onHowItWorks} className="hover:text-teal-500 transition-colors">How it Works</button></li>
                <li><a href="#" className="hover:text-teal-500 transition-colors">Whitepaper</a></li>
                <li><a href="#" className="hover:text-teal-500 transition-colors">Security Audit</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-text-4 text-[10px] font-black uppercase tracking-[0.3em]">© 2026 ShadowSwap. Confidential Buildathon Submission.</p>
            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-text-4">
              <span className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-teal-500/40" /> Testnet only</span>
              <span>•</span>
              <span className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-teal-500/40" /> No real funds</span>
              <span>•</span>
              <span className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-teal-500/40" /> Arbitrum Sepolia</span>
            </div>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}

function TradePage({ revealedItems, onToggleReveal }: { 
  revealedItems: Record<string, boolean>, 
  onToggleReveal: (id: string) => void
}) {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('2847.50');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const handlePlaceOrder = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      // Simple validation
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmOrder = () => {
    console.log('Order confirmed:', { side: activeTab, amount, price });
    setIsConfirmModalOpen(false);
    setAmount('');
    // You could add a success toast here
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-[calc(100dvh-5rem)] flex flex-col grainy-bg overflow-y-auto"
    >
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <ThreeScene type="ambient" />
      </div>
      
      {/* Sub-header / Stats bar */}
      <div className="h-12 border-b border-white/5 bg-bg-void/40 backdrop-blur-md px-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 cursor-pointer hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all group">
            <span className="font-display text-sm font-black text-white tracking-tight">WETH / USDC</span>
            <ChevronDown size={14} className="text-text-4 group-hover:text-white transition-colors" />
          </div>
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-text-4 uppercase tracking-widest leading-none mb-1">Last Price</span>
              <span className="font-mono text-xs font-bold text-white tracking-tight">$2,847.50</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-text-4 uppercase tracking-widest leading-none mb-1">24h Change</span>
              <span className="font-mono text-xs font-bold text-teal-500 tracking-tight">+4.22%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-text-4 uppercase tracking-widest leading-none mb-1">24h Volume</span>
              <span className="font-mono text-xs font-bold text-text-2 tracking-tight">$1,242,891</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/5 px-3 py-1">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
            <span className="font-display text-[9px] font-bold text-teal-500 uppercase tracking-widest">Network Healthy</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 relative z-10">
        
        {/* Left: Order Form */}
        <div className="lg:col-span-3 flex flex-col lg:h-full">
          <div className="premium-card p-8 flex flex-col gap-8 lg:flex-1 lg:overflow-y-auto">
            <div className="flex items-center justify-between shrink-0">
              <h3 className="font-display text-[10px] font-black uppercase tracking-[0.3em] text-text-3">Order Terminal</h3>
              <div className="flex gap-2">
                {['Market', 'Limit'].map(t => (
                  <button key={t} className={cn(
                    "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all",
                    t === 'Limit' ? "bg-white/10 text-white" : "text-text-4 hover:text-text-2"
                  )}>{t}</button>
                ))}
              </div>
            </div>

            <div className="flex p-1.5 rounded-2xl bg-bg-deep/50 border border-white/5">
              <button 
                onClick={() => setActiveTab('buy')}
                className={cn(
                  "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500",
                  activeTab === 'buy' ? "bg-white text-bg-void shadow-[0_0_20px_rgba(255,255,255,0.1)]" : "text-text-3 hover:text-white"
                )}
              >
                BUY
              </button>
              <button 
                onClick={() => setActiveTab('sell')}
                className={cn(
                  "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500",
                  activeTab === 'sell' ? "bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.2)]" : "text-text-3 hover:text-white"
                )}
              >
                SELL
              </button>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[9px] uppercase font-black tracking-[0.2em] text-text-4">Price (USDC)</label>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1 w-1 rounded-full bg-teal-500 animate-pulse" />
                    <span className="text-[9px] font-black text-teal-500 uppercase tracking-widest">FHE Encrypted</span>
                  </div>
                </div>
                <div className="relative group overflow-hidden rounded-2xl">
                  <input 
                    type="text" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-5 font-mono text-sm text-white focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 focus:shadow-[0_0_40px_rgba(31,214,200,0.3)] transition-all group-hover:border-white/10 relative z-10"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-500/20 to-transparent -translate-x-full pointer-events-none group-focus-within:animate-shimmer z-0" />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 z-20">
                    <Lock size={16} className="text-teal-500/40" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[9px] uppercase font-black tracking-[0.2em] text-text-4">Amount (WETH)</label>
                  <span className="text-[9px] font-black text-text-4 uppercase tracking-widest">Balance: 0.00</span>
                </div>
                <div className="relative group overflow-hidden rounded-2xl">
                  <input 
                    type="text" 
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-5 font-mono text-sm text-white placeholder:text-text-4 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 focus:shadow-[0_0_40px_rgba(31,214,200,0.3)] transition-all group-hover:border-white/10 relative z-10"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-500/20 to-transparent -translate-x-full pointer-events-none group-focus-within:animate-shimmer z-0" />
                </div>
                <div className="flex gap-2">
                  {['25%', '50%', '75%', 'MAX'].map(p => (
                    <button key={p} className="flex-1 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[8px] font-black text-text-4 hover:text-white hover:border-white/10 transition-all">{p}</button>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={handlePlaceOrder}
                  className={cn(
                    "w-full py-5 rounded-2xl font-display text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 relative overflow-hidden group/btn",
                    activeTab === 'buy' 
                      ? "bg-white text-bg-void hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)]" 
                      : "bg-orange-500 text-white hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(249,115,22,0.2)] hover:shadow-[0_0_60px_rgba(249,115,22,0.4)]"
                  )}
                >
                  <div className="relative z-10">Place {activeTab} Order</div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
                  <div className="absolute inset-0 bg-teal-500/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
                </button>
                <p className="text-center mt-6 text-[9px] text-text-4 font-black uppercase tracking-[0.2em] leading-relaxed opacity-60">
                  Orders are encrypted locally<br />and matched on-chain via FHE.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Market Feed */}
        <div className="lg:col-span-6 flex flex-col lg:h-full">
          <div className="premium-card flex flex-col lg:flex-1 lg:overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <h3 className="font-display text-[10px] font-black uppercase tracking-[0.3em] text-text-3">Encrypted Market Feed</h3>
                <div className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-500 text-[8px] font-black uppercase tracking-widest border border-teal-500/20">LIVE</div>
              </div>
              <div className="flex gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
              </div>
            </div>
            
            <div className="p-8 space-y-6 lg:flex-1 lg:overflow-y-auto">
              {[
                { id: '1', type: 'match', pair: 'WETH/USDC', amount: '4.2', price: '2847.50', time: '2s ago', status: 'MATCHED' },
                { id: '2', type: 'submit', pair: 'WETH/USDC', amount: '12.0', price: '2846.80', time: '14s ago', status: 'PENDING' },
                { id: '3', type: 'match', pair: 'WETH/USDC', amount: '0.85', price: '2847.10', time: '28s ago', status: 'MATCHED' },
                { id: '4', type: 'submit', pair: 'WETH/USDC', amount: '1.5', price: '2848.00', time: '1m ago', status: 'PENDING' },
                { id: '5', type: 'match', pair: 'WETH/USDC', amount: '25.0', price: '2847.50', time: '2m ago', status: 'MATCHED' },
              ].map((item) => (
                <div key={item.id} className="group relative p-6 rounded-[1.5rem] border border-white/[0.03] bg-white/[0.01] hover:border-teal-500/20 transition-all duration-500">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        item.type === 'match' ? "bg-teal-500 shadow-[0_0_10px_rgba(31,214,200,0.5)]" : "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                      )} />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{item.type === 'match' ? 'Order Matched' : 'Order Submitted'}</span>
                      <span className="text-[9px] text-text-4 font-mono font-black uppercase tracking-widest">{item.time}</span>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                      item.status === 'MATCHED' ? "bg-teal-500/10 text-teal-500 border-teal-500/20" : "bg-orange-500/10 text-orange-500 border-orange-500/20"
                    )}>
                      {item.status}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase text-text-4 font-black tracking-[0.2em]">Amount</span>
                      <EncryptedValue value={item.amount} revealed={revealedItems[`feed-amt-${item.id}`]} unit="WETH" />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase text-text-4 font-black tracking-[0.2em]">Price</span>
                      <EncryptedValue value={item.price} revealed={revealedItems[`feed-prc-${item.id}`]} unit="USDC" />
                    </div>
                    <div className="flex items-end justify-end">
                      <button 
                        onClick={() => onToggleReveal(`feed-amt-${item.id}`)}
                        className="text-[9px] text-teal-500 hover:text-teal-400 font-black uppercase tracking-widest transition-colors border-b border-teal-500/20 pb-0.5"
                      >
                        {revealedItems[`feed-amt-${item.id}`] ? 'Hide' : 'Reveal'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: My Orders */}
        <div className="lg:col-span-3 flex flex-col lg:h-full">
          <div className="premium-card flex flex-col lg:flex-1 lg:overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
              <h3 className="font-display text-[10px] font-black uppercase tracking-[0.3em] text-text-3">My Orders</h3>
              <div className="flex gap-6 text-[9px] font-black uppercase tracking-widest">
                <button className="text-white border-b-2 border-white pb-2 transition-all">Active</button>
                <button className="text-text-4 hover:text-text-2 pb-2 transition-all">History</button>
              </div>
            </div>

            <div className="p-8 space-y-8 lg:flex-1 lg:overflow-y-auto">
              <div className="p-8 rounded-[2rem] border border-teal-500/20 bg-teal-500/5 shadow-[0_0_30px_rgba(31,214,200,0.05)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse shadow-[0_0_10px_rgba(31,214,200,0.5)]" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">BUY WETH</span>
                    </div>
                    <span className="text-[9px] text-text-4 font-mono font-black opacity-60">#8291</span>
                  </div>
                  
                  <div className="space-y-6 mb-10">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-text-4 uppercase font-black tracking-[0.2em] opacity-60">Amount</span>
                      <span className="text-xs font-mono font-black text-white tracking-tighter">2.50 WETH</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-text-4 uppercase font-black tracking-[0.2em] opacity-60">Price</span>
                      <span className="text-xs font-mono font-black text-white tracking-tighter">$2,847.50</span>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.3em]">
                        <span className="text-teal-500 flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                          Matching...
                        </span>
                        <span className="text-text-3">65%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '65%' }}
                          transition={{ duration: 2 }}
                          className="h-full bg-gradient-to-r from-teal-600 to-teal-400 rounded-full shadow-[0_0_15px_rgba(31,214,200,0.5)] relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                        </motion.div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <div className="flex items-center gap-2">
                          <Cpu size={10} className="text-teal-500/60" />
                          <span className="text-[7px] font-black text-text-4 uppercase tracking-widest">FHE Compute</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="h-1 w-1 rounded-full bg-teal-500" />
                          <span className="text-[8px] font-mono font-bold text-white">0x42...8f9</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <div className="flex items-center gap-2">
                          <Terminal size={10} className="text-teal-500/60" />
                          <span className="text-[7px] font-black text-text-4 uppercase tracking-widest">Active Node</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="h-1 w-1 rounded-full bg-teal-500" />
                          <span className="text-[8px] font-mono font-bold text-white">Node-Alpha</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-white/5">
                      <span className="text-[7px] font-black text-text-4 uppercase tracking-[0.2em]">Match ID (Encrypted)</span>
                      <span className="text-[8px] font-mono font-bold text-teal-500/60">fhe_match_7291_confidential</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-[2rem] border border-white/[0.05] bg-white/[0.01] opacity-60 hover:opacity-100 transition-opacity duration-500">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-text-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">SELL WETH</span>
                  </div>
                  <span className="text-[9px] text-text-4 font-mono font-black opacity-60">#8288</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-text-4 uppercase font-black tracking-[0.2em] opacity-60">Status</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-text-4">Settled</span>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-white/5">
              <div className="flex items-center gap-5 p-6 rounded-[1.5rem] bg-white/[0.02] border border-white/[0.05] group hover:bg-white/[0.04] transition-colors duration-500">
                <div className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-text-4 group-hover:text-white transition-colors">
                  <Clock size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] text-text-4 font-black uppercase tracking-[0.2em] leading-none mb-2 opacity-60">Next Settlement</p>
                  <p className="text-base font-mono font-black text-white tracking-tighter">04:22:15</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <OrderConfirmationModal 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmOrder}
        orderData={{
          side: activeTab,
          amount,
          price,
          pair: 'WETH / USDC'
        }}
      />
    </motion.div>
  );
}

