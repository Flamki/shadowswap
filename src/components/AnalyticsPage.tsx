import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Shield, Users, Timer } from 'lucide-react';
import { cn } from '../lib/utils';

const data = [
  { time: '00:00', volume: 45000, matches: 12 },
  { time: '04:00', volume: 52000, matches: 15 },
  { time: '08:00', volume: 38000, matches: 8 },
  { time: '12:00', volume: 65000, matches: 22 },
  { time: '16:00', volume: 82000, matches: 28 },
  { time: '20:00', volume: 71000, matches: 20 },
  { time: '23:59', volume: 58000, matches: 18 },
];

export function AnalyticsPage() {
  const stats = [
    { label: 'Total Matches Today', value: '142', change: '+12%', icon: Activity },
    { label: 'Total Volume (Est.)', value: '$1.2M', change: '+5.4%', icon: BarChart },
    { label: 'Active Orders in Pool', value: '842', change: '-2.1%', icon: Shield },
    { label: 'Avg. Match Time', value: '18.5s', change: '-0.5s', icon: Timer },
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
          <h1 className="font-display text-5xl font-black text-white tracking-tighter mb-2">ANALYTICS</h1>
          <div className="flex items-center gap-3">
            <span className="text-text-4 font-mono text-[10px] font-bold uppercase tracking-widest">Arbitrum Sepolia</span>
            <div className="h-1 w-1 rounded-full bg-teal-500" />
            <span className="text-teal-500 font-mono text-[10px] font-bold uppercase tracking-widest">LIVE NETWORK</span>
          </div>
        </div>
        <div className="max-w-xs">
          <p className="text-text-4 text-[9px] font-black uppercase tracking-widest text-right leading-relaxed">
            Public statistics only — individual orders remain private through FHE encryption.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, i) => (
          <div key={i} className="premium-card p-8 group">
            <div className="flex justify-between items-start mb-8">
              <div className="p-4 rounded-2xl bg-white/[0.03] text-teal-500 border border-white/[0.05] group-hover:bg-teal-500/10 transition-colors">
                <stat.icon size={24} />
              </div>
              <span className={cn(
                "text-[9px] font-black px-3 py-1.5 rounded-full tracking-widest uppercase",
                stat.change.startsWith('+') ? "bg-teal-500/10 text-teal-500" : "bg-orange-500/10 text-orange-500"
              )}>
                {stat.change}
              </span>
            </div>
            <p className="text-[9px] uppercase font-black text-text-4 mb-3 tracking-[0.3em] opacity-60">{stat.label}</p>
            <p className="text-4xl font-black tracking-tighter text-white text-gradient">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="premium-card p-8">
          <h3 className="text-[10px] font-black text-white mb-10 uppercase tracking-[0.3em] opacity-80">24h Match Activity</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#4a5670" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  fontFamily="IBM Plex Mono"
                  dy={10}
                />
                <YAxis 
                  stroke="#4a5670" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value / 1000}k`}
                  fontFamily="IBM Plex Mono"
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '16px', backdropFilter: 'blur(12px)' }}
                  itemStyle={{ color: '#1fd6c8', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  labelStyle={{ color: '#8a9ab8', fontSize: '10px', marginBottom: '8px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em' }}
                />
                <Bar dataKey="volume" fill="#1fd6c8" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="premium-card p-8">
          <h3 className="text-[10px] font-black text-white mb-10 uppercase tracking-[0.3em] opacity-80">Matches Over Time</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorMatches" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1fd6c8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#1fd6c8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#4a5670" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  fontFamily="IBM Plex Mono"
                  dy={10}
                />
                <YAxis 
                  stroke="#4a5670" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  fontFamily="IBM Plex Mono"
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '16px', backdropFilter: 'blur(12px)' }}
                  itemStyle={{ color: '#1fd6c8', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  labelStyle={{ color: '#8a9ab8', fontSize: '10px', marginBottom: '8px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em' }}
                />
                <Area type="monotone" dataKey="matches" stroke="#1fd6c8" fillOpacity={1} fill="url(#colorMatches)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="premium-card p-12 border-teal-500/20 bg-teal-500/5">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="p-6 rounded-3xl bg-teal-500/10 text-teal-500 h-fit border border-teal-500/10 shadow-[0_0_30px_rgba(31,214,200,0.1)]">
            <Shield size={32} />
          </div>
          <div>
            <h4 className="text-white font-display text-3xl font-black mb-6 tracking-tighter">PRIVACY ASSURANCE</h4>
            <p className="text-text-3 text-base leading-relaxed mb-10 max-w-3xl opacity-80">
              While we show aggregate pool statistics for transparency, individual order data (prices, amounts, and identities) are never revealed. FHE ensures that even the data used to generate these charts was processed in a privacy-preserving manner.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-6">
              {[
                'No individual trade history exposure',
                'Zero-knowledge proof of pool solvency',
                'Encrypted volume calculations',
                'MEV-resistant matching engine'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 group">
                  <div className="h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(31,214,200,0.5)] group-hover:scale-125 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-2 group-hover:text-white transition-colors">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
