import React from 'react';
import { Activity, PieChart, Info, BarChart3, Shield, LayoutDashboard } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const navItems = [
    { id: 'trade', label: 'Trade', icon: Activity },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'how-it-works', label: 'How It Works', icon: Info },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/5 bg-bg-void/40 backdrop-blur-3xl hidden lg:flex flex-col">
      <div className="p-8">
        <div 
          className="flex cursor-pointer items-center gap-3 group" 
          onClick={() => onPageChange('landing')}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-bg-void font-display font-black transition-all duration-500 group-hover:rotate-[360deg] shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            S
          </div>
          <span className="font-display text-lg font-black tracking-tighter text-white">SHADOWSWAP</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        <div className="px-4 mb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-4">Main Menu</span>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                isActive 
                  ? "bg-white/10 text-white" 
                  : "text-text-3 hover:text-white hover:bg-white/5"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 h-full w-1 bg-teal-500" />
              )}
              <Icon size={18} className={cn(
                "transition-colors duration-300",
                isActive ? "text-teal-500" : "group-hover:text-white"
              )} />
              <span className="text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
              
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(31,214,200,0.5)]" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-6">
        <div className="rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={14} className="text-teal-500" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest">FHE Protocol</span>
          </div>
          <p className="text-[8px] text-text-3 leading-relaxed font-medium">
            Your trades are encrypted using Fully Homomorphic Encryption.
          </p>
        </div>
      </div>
    </aside>
  );
}
