import React, { useState, useEffect } from 'react';
import { Shield, Wallet, Activity, PieChart, Info, ChevronRight, Circle, Cpu, Globe, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface HeaderProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onAuthClick: () => void;
  isLoggedIn: boolean;
}

export function Header({ currentPage, onPageChange, onAuthClick, isLoggedIn }: HeaderProps) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={cn(
        "z-[60] h-20 w-full transition-all duration-500",
        currentPage === 'landing' 
          ? cn("fixed top-0 left-0", scrollY > 50 ? "bg-bg-void/80 backdrop-blur-xl border-b border-white/5" : "bg-transparent")
          : "sticky top-0 bg-bg-void/40 backdrop-blur-3xl border-b border-white/5"
      )}
    >
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-6 md:px-12">
        {/* Logo Section */}
        <div 
          className={cn(
            "flex cursor-pointer items-center gap-5 group relative",
            currentPage !== 'landing' && "lg:hidden"
          )}
          onClick={() => onPageChange('landing')}
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 via-purple-500/20 to-teal-500/20 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt" />
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-bg-void font-display font-black transition-all duration-700 group-hover:rotate-[360deg] group-hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.15)] border border-white/20">
              S
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-2xl font-black tracking-tighter text-white leading-none group-hover:text-teal-400 transition-colors duration-500">SHADOWSWAP</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 md:gap-8 ml-auto">
          {currentPage !== 'landing' && (
            <div className="hidden md:flex items-center gap-4 px-4 py-1.5 rounded-xl border border-white/5 bg-white/[0.01] backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Globe size={10} className="text-text-4" />
                <span className="font-mono text-[9px] font-black text-text-4 uppercase tracking-widest">Arbitrum Sepolia</span>
              </div>
              <div className="h-3 w-px bg-white/5" />
              <div className="flex items-center gap-2">
                <Zap size={10} className="text-teal-500/50" />
                <span className="font-mono text-[9px] font-black text-teal-500/50 uppercase tracking-widest">12ms</span>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            {currentPage === 'landing' ? (
              <button 
                onClick={onAuthClick}
                className="hidden md:flex items-center gap-3 px-8 py-3 rounded-2xl bg-teal-500 text-bg-void text-[10px] font-black uppercase tracking-[0.2em] hover:bg-teal-400 transition-all duration-500 shadow-[0_10px_30px_rgba(31,214,200,0.2)] hover:scale-105 active:scale-95"
              >
                Launch App
                <ChevronRight size={14} />
              </button>
            ) : (
              <button 
                onClick={onAuthClick}
                className={cn(
                  "flex items-center gap-3 px-6 py-2.5 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 group",
                  isLoggedIn 
                    ? "bg-teal-500/10 border-teal-500/20 text-teal-500"
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                )}
              >
                <Wallet size={14} className={cn("transition-transform group-hover:rotate-12", isLoggedIn ? "text-teal-500" : "text-teal-500")} />
                {isLoggedIn ? '0x71C...3921' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </div>
      
    </header>
  );
}
