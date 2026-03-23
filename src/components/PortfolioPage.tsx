import React from 'react';
import { motion } from 'framer-motion';
import { Download, ExternalLink, Lock, Search, Filter } from 'lucide-react';
import { EncryptedValue } from './EncryptedValue';
import { cn } from '../lib/utils';

export function PortfolioPage({ revealedItems, onToggleReveal }: { 
  revealedItems: Record<string, boolean>, 
  onToggleReveal: (id: string) => void
}) {
  const stats = [
    { label: 'Total Orders', value: '124' },
    { label: 'Filled', value: '98' },
    { label: 'Volume (Encrypted)', value: '45,280.50', unit: 'USDC', id: 'total-vol' },
    { label: 'Win Rate', value: '72%' },
  ];

  const orders = [
    { id: '8291', type: 'BUY', pair: 'WETH/USDC', price: '2847.50', amount: '2.50', status: 'MATCHED', time: '2m ago' },
    { id: '8288', type: 'SELL', pair: 'WETH/USDC', price: '2842.10', amount: '1.20', status: 'SETTLED', time: '15m ago' },
    { id: '8285', type: 'BUY', pair: 'WETH/USDC', price: '2840.00', amount: '5.00', status: 'SETTLED', time: '1h ago' },
    { id: '8280', type: 'SELL', pair: 'WETH/USDC', price: '2835.40', amount: '0.75', status: 'CANCELLED', time: '3h ago' },
    { id: '8275', type: 'BUY', pair: 'WETH/USDC', price: '2830.00', amount: '10.00', status: 'EXPIRED', time: '5h ago' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-7xl mx-auto px-6 py-12 grainy-bg min-h-[calc(100vh-5rem)]"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="font-display text-5xl font-black text-white tracking-tighter mb-2">PORTFOLIO</h1>
          <div className="flex items-center gap-3">
            <span className="text-text-4 font-mono text-[10px] font-bold uppercase tracking-widest">0x9e3d...2f1a</span>
            <div className="h-1 w-1 rounded-full bg-white/20" />
            <span className="text-teal-500 font-mono text-[10px] font-bold uppercase tracking-widest">Arbitrum Sepolia</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-text-2 hover:text-white hover:bg-white/10 transition-all">
            <Download size={14} />
            Export Data
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, i) => (
          <div key={i} className="premium-card p-8 group">
            <p className="text-[9px] uppercase font-black text-text-4 mb-6 tracking-[0.3em] opacity-60">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              {stat.id ? (
                <div className="flex flex-col gap-3 w-full">
                  <EncryptedValue 
                    value={stat.value} 
                    revealed={revealedItems[stat.id]} 
                    unit={stat.unit}
                    className="text-3xl font-black tracking-tighter text-white text-gradient"
                  />
                  <button 
                    onClick={() => onToggleReveal(stat.id!)}
                    className="text-[9px] text-teal-500 hover:text-teal-400 font-black uppercase tracking-widest text-left transition-colors border-b border-teal-500/20 pb-0.5 w-fit"
                  >
                    {revealedItems[stat.id!] ? 'Hide' : 'Reveal Total'}
                  </button>
                </div>
              ) : (
                <span className="text-3xl font-black tracking-tighter text-white text-gradient">{stat.value}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="premium-card overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex gap-6">
            {['All', 'Active', 'Matched', 'Settled'].map(f => (
              <button key={f} className={cn(
                "px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300",
                f === 'All' ? "bg-white text-bg-void shadow-[0_0_15px_rgba(255,255,255,0.1)]" : "text-text-4 hover:text-text-2"
              )}>{f}</button>
            ))}
          </div>
          <div className="relative w-full md:w-80 group">
            <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-text-4 group-focus-within:text-white transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH ORDERS..." 
              className="w-full bg-white/[0.03] border border-white/5 rounded-full pl-12 pr-6 py-3 text-[10px] font-black tracking-[0.2em] text-white placeholder:text-text-4 focus:outline-none focus:border-white/20 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-8 py-6 text-[9px] uppercase font-black text-text-4 tracking-[0.3em]">ID</th>
                <th className="px-8 py-6 text-[9px] uppercase font-black text-text-4 tracking-[0.3em]">Type</th>
                <th className="px-8 py-6 text-[9px] uppercase font-black text-text-4 tracking-[0.3em]">Pair</th>
                <th className="px-8 py-6 text-[9px] uppercase font-black text-text-4 tracking-[0.3em] text-right">Price</th>
                <th className="px-8 py-6 text-[9px] uppercase font-black text-text-4 tracking-[0.3em] text-right">Amount</th>
                <th className="px-8 py-6 text-[9px] uppercase font-black text-text-4 tracking-[0.3em]">Status</th>
                <th className="px-8 py-6 text-[9px] uppercase font-black text-text-4 tracking-[0.3em]">Time</th>
                <th className="px-8 py-6 text-[9px] uppercase font-black text-text-4 tracking-[0.3em] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map((order) => (
                <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors duration-500">
                  <td className="px-8 py-7 font-mono text-[10px] font-black text-text-3 tracking-tighter">#{order.id}</td>
                  <td className="px-8 py-7">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      order.type === 'BUY' ? "text-teal-500" : "text-orange-500"
                    )}>{order.type}</span>
                  </td>
                  <td className="px-8 py-7 text-[10px] font-black uppercase tracking-widest text-white">{order.pair}</td>
                  <td className="px-8 py-7 text-right">
                    <EncryptedValue 
                      value={order.price} 
                      revealed={revealedItems[`port-prc-${order.id}`]} 
                      className="text-xs font-mono font-black tracking-tighter"
                    />
                  </td>
                  <td className="px-8 py-7 text-right">
                    <EncryptedValue 
                      value={order.amount} 
                      revealed={revealedItems[`port-amt-${order.id}`]} 
                      className="text-xs font-mono font-black tracking-tighter"
                    />
                  </td>
                  <td className="px-8 py-7">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        order.status === 'MATCHED' ? "bg-teal-500 shadow-[0_0_10px_rgba(31,214,200,0.5)]" : 
                        order.status === 'SETTLED' ? "bg-white/40" : "bg-text-4"
                      )} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-2">{order.status}</span>
                    </div>
                  </td>
                  <td className="px-8 py-7 text-[10px] text-text-4 font-mono font-black uppercase tracking-widest">{order.time}</td>
                  <td className="px-8 py-7 text-right">
                    <button 
                      onClick={() => onToggleReveal(`port-prc-${order.id}`)}
                      className="text-[9px] text-teal-500 hover:text-teal-400 font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 border-b border-teal-500/20 pb-0.5"
                    >
                      {revealedItems[`port-prc-${order.id}`] ? 'Hide' : 'Reveal'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
