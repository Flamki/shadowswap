import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Lock, Zap, Cpu, Network, Database, ChevronRight, 
  Binary, Fingerprint, EyeOff, Terminal, Activity, 
  Layers, Code, Share2, Key, RefreshCw, BarChart3,
  AlertTriangle, CheckCircle2, Info, ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';

export function HowItWorksPage({ onStart }: { onStart: () => void }) {
  const [activeStage, setActiveStage] = useState(0);

  const stages = [
    {
      id: "01",
      title: "ENCRYPT",
      subtitle: "Client-Side Privacy",
      desc: "Before your order ever hits the network, the ShadowSwap SDK encrypts your trade parameters (Price, Amount, Direction) locally using FHE public keys. Your plaintext data never leaves your device.",
      icon: Lock,
      tag: "@cofhe/sdk",
      color: "text-teal-500",
      bg: "bg-teal-500/5",
      border: "border-teal-500/20",
      details: [
        "Local FHE key generation",
        "AES-GCM for metadata",
        "Zero plaintext leakage"
      ]
    },
    {
      id: "02",
      title: "SUBMIT",
      subtitle: "On-Chain Commitment",
      desc: "The encrypted payload is submitted via `submitOrder()`. To the public mempool and validators, your trade is just a blob of ciphertext. Front-running bots see activity but zero intent.",
      icon: Share2,
      tag: "ARBITRUM SEPOLIA",
      color: "text-purple-500",
      bg: "bg-purple-500/5",
      border: "border-purple-500/20",
      details: [
        "Gas-optimized submission",
        "Encrypted escrow lock",
        "MEV-immune mempool"
      ]
    },
    {
      id: "03",
      title: "POOL",
      subtitle: "The Dark Reservoir",
      desc: "Your order sits in the `ShadowOrderBook` as a `euint64` handle. It is active and matchable, but its value is mathematically sealed. The pool is deep, liquid, and completely opaque.",
      icon: Database,
      tag: "ORDERBOOK.SOL",
      color: "text-blue-500",
      bg: "bg-blue-500/5",
      border: "border-blue-500/20",
      details: [
        "Encrypted state storage",
        "Public metadata only",
        "Permissionless access"
      ]
    },
    {
      id: "04",
      title: "MATCH",
      subtitle: "FHE Matching Engine",
      desc: "The heart of the protocol. Our smart contracts execute `FHE.gte()` and `FHE.select()` to find matches. The engine determines if Order A matches Order B without ever knowing the price of either.",
      icon: Cpu,
      tag: "FHE.gte()",
      color: "text-orange-500",
      bg: "bg-orange-500/5",
      border: "border-orange-500/20",
      details: [
        "Blind matching logic",
        "Encrypted price discovery",
        "Midpoint settlement"
      ]
    },
    {
      id: "05",
      title: "DECRYPT",
      subtitle: "Threshold Network",
      desc: "Once a match is cryptographically confirmed, the Threshold Network MPC performs an async decryption of the settlement results. Only the matched parties' specific outcomes are revealed.",
      icon: Key,
      tag: "MPC NETWORK",
      color: "text-pink-500",
      bg: "bg-pink-500/5",
      border: "border-pink-500/20",
      details: [
        "Distributed key shares",
        "Async unsealing process",
        "Privacy-preserving reveal"
      ]
    },
    {
      id: "06",
      title: "SETTLE",
      subtitle: "Atomic Finality",
      desc: "The `ShadowSettlement` contract executes the final token transfers. Encrypted balances are updated, and the trade is finalized on-chain with 100% privacy for the trade lifecycle.",
      icon: RefreshCw,
      tag: "SETTLEMENT.SOL",
      color: "text-emerald-500",
      bg: "bg-emerald-500/5",
      border: "border-emerald-500/20",
      details: [
        "Atomic swap execution",
        "Residual fund return",
        "On-chain proof of trade"
      ]
    }
  ];

  const privacyMatrix = [
    { stage: "Pre-submission", price: "Never", amount: "Never", dir: "Never", who: "Only trader (local)" },
    { stage: "In mempool", price: "Never", amount: "Never", dir: "Never", who: "Nobody — encrypted" },
    { stage: "On-chain (open)", price: "Never", amount: "Never", dir: "Never", who: "Nobody — euint64" },
    { stage: "Matching", price: "Never", amount: "Never", dir: "Never", who: "FHE coprocessor" },
    { stage: "Post-match", price: "Matched only", amount: "Matched only", dir: "Yes (settled)", who: "Buyer + Seller only" },
    { stage: "Public", price: "Never", amount: "Never", dir: "N/A", who: "Volume estimate only" },
  ];

  const fheOps = [
    { op: "FHE.asEuint64()", input: "inEuint64", gas: "~80k", usage: "submitOrder()" },
    { op: "FHE.gte(a,b)", input: "euint64, euint64", gas: "~120k", usage: "tryMatch()" },
    { op: "FHE.select(b,x,y)", input: "ebool, euint64, euint64", gas: "~95k", usage: "tryMatch()" },
    { op: "FHE.div(a,b)", input: "euint64, plaintext", gas: "~100k", usage: "tryMatch()" },
    { op: "FHE.allow(v,addr)", input: "euint64, address", gas: "~30k", usage: "submitOrder()" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative grainy-bg min-h-screen overflow-hidden"
    >
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[50%] h-[50%] bg-teal-500/5 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        {/* Header Section */}
        <div className="text-center mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-xl mb-8"
          >
            <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-4">Engineering Specification v1.0</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display text-[12vw] md:text-[8vw] font-black text-white mb-8 tracking-tighter leading-[0.8] uppercase"
          >
            THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-purple-400 to-orange-400">LIFECYCLE</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-text-2 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed font-light tracking-tight"
          >
            ShadowSwap is a hybrid on-chain/off-chain system where privacy is enforced entirely by <span className="text-white font-medium italic">Fully Homomorphic Encryption</span>.
          </motion.p>
        </div>

        {/* 6-Stage Lifecycle Visualizer */}
        <div className="mb-48">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left: Stage Navigation */}
            <div className="lg:col-span-4 space-y-4">
              {stages.map((stage, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStage(i)}
                  className={cn(
                    "w-full text-left p-6 rounded-2xl border transition-all duration-500 group relative overflow-hidden",
                    activeStage === i 
                      ? "bg-white/5 border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)]" 
                      : "bg-transparent border-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex items-center gap-6 relative z-10">
                    <span className={cn(
                      "font-mono text-xs font-black transition-colors duration-500",
                      activeStage === i ? stage.color : "text-text-4"
                    )}>
                      {stage.id}
                    </span>
                    <div className="flex flex-col">
                      <span className={cn(
                        "font-display text-lg font-black tracking-tight transition-colors duration-500",
                        activeStage === i ? "text-white" : "text-text-4 group-hover:text-text-2"
                      )}>
                        {stage.title}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-4 opacity-60">
                        {stage.subtitle}
                      </span>
                    </div>
                  </div>
                  {activeStage === i && (
                    <motion.div 
                      layoutId="stage-indicator"
                      className={cn("absolute left-0 top-0 bottom-0 w-1", stage.color.replace('text-', 'bg-'))} 
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Right: Stage Detail Display */}
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStage}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                  className="premium-card p-12 md:p-16 min-h-[500px] relative overflow-hidden"
                >
                  <div className="absolute -top-24 -right-24 text-[20rem] font-black text-white/[0.02] select-none pointer-events-none">
                    {stages[activeStage].id}
                  </div>

                  <div className="relative z-10">
                    <div className={cn(
                      "h-24 w-24 rounded-[2rem] flex items-center justify-center mb-12 border transition-all duration-500",
                      stages[activeStage].bg, stages[activeStage].border, stages[activeStage].color
                    )}>
                      {React.createElement(stages[activeStage].icon, { size: 48 })}
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                      <h3 className="text-5xl font-black text-white tracking-tighter uppercase">
                        {stages[activeStage].title}
                      </h3>
                      <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                        <span className="text-[10px] font-black text-text-3 uppercase tracking-[0.2em]">
                          {stages[activeStage].tag}
                        </span>
                      </div>
                    </div>

                    <p className="text-text-2 text-2xl leading-relaxed mb-12 font-light tracking-tight">
                      {stages[activeStage].desc}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {stages[activeStage].details.map((detail, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                          <CheckCircle2 size={16} className={stages[activeStage].color} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-text-3">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Privacy Matrix Section */}
        <div className="mb-48">
          <div className="text-center mb-24">
            <h2 className="font-display text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter uppercase">Privacy Matrix</h2>
            <p className="text-text-4 text-xs font-black uppercase tracking-[0.4em]">Cryptographic Guarantee of Confidentiality</p>
          </div>

          <div className="premium-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="p-8 font-mono text-[10px] font-black text-text-4 uppercase tracking-[0.3em]">Stage</th>
                    <th className="p-8 font-mono text-[10px] font-black text-text-4 uppercase tracking-[0.3em]">Price Visible</th>
                    <th className="p-8 font-mono text-[10px] font-black text-text-4 uppercase tracking-[0.3em]">Amount Visible</th>
                    <th className="p-8 font-mono text-[10px] font-black text-text-4 uppercase tracking-[0.3em]">Direction Visible</th>
                    <th className="p-8 font-mono text-[10px] font-black text-text-4 uppercase tracking-[0.3em]">Who Knows What</th>
                  </tr>
                </thead>
                <tbody>
                  {privacyMatrix.map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                      <td className="p-8">
                        <span className="text-white font-black text-sm uppercase tracking-tight">{row.stage}</span>
                      </td>
                      <td className="p-8">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-1.5 w-1.5 rounded-full", row.price === 'Never' ? "bg-red-500/50" : "bg-teal-500")} />
                          <span className={cn("text-xs font-mono font-bold", row.price === 'Never' ? "text-text-4" : "text-teal-500")}>{row.price}</span>
                        </div>
                      </td>
                      <td className="p-8">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-1.5 w-1.5 rounded-full", row.amount === 'Never' ? "bg-red-500/50" : "bg-teal-500")} />
                          <span className={cn("text-xs font-mono font-bold", row.amount === 'Never' ? "text-text-4" : "text-teal-500")}>{row.amount}</span>
                        </div>
                      </td>
                      <td className="p-8">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-1.5 w-1.5 rounded-full", row.dir === 'Never' ? "bg-red-500/50" : "bg-teal-500")} />
                          <span className={cn("text-xs font-mono font-bold", row.dir === 'Never' ? "text-text-4" : "text-teal-500")}>{row.dir}</span>
                        </div>
                      </td>
                      <td className="p-8">
                        <span className="text-text-3 text-xs font-medium italic">{row.who}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FHE Operations Showcase */}
        <div className="mb-48">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest mb-12">
                  <Binary size={12} />
                  <span>FHE Primitives</span>
                </div>
                <h2 className="font-display text-5xl md:text-7xl font-black text-white mb-12 leading-none tracking-tighter uppercase">
                  THE MATH OF <br />
                  <span className="text-orange-500 text-gradient">SHADOWS.</span>
                </h2>
                <p className="text-text-2 text-xl mb-12 leading-relaxed font-light">
                  Every trade operation on ShadowSwap is a high-cost cryptographic computation. We use the Fhenix protocol to execute logic directly on ciphertexts.
                </p>
                <div className="space-y-8">
                  {[
                    { title: "Encrypted Comparison", desc: "Determining if BUY >= SELL without revealing either value." },
                    { title: "Conditional Selection", desc: "Executing logic branches based on encrypted boolean results." },
                    { title: "Homomorphic Arithmetic", desc: "Computing midpoint settlement prices while data stays sealed." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6">
                      <div className="text-orange-500 font-black text-2xl opacity-20">0{i + 1}</div>
                      <div>
                        <h4 className="text-white font-black text-lg uppercase tracking-tight mb-2">{item.title}</h4>
                        <p className="text-text-3 text-base font-light opacity-70">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="space-y-4">
              {fheOps.map((op, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-xl flex items-center justify-between group hover:border-orange-500/30 transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                      <Terminal size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-mono text-sm font-black text-white">{op.op}</span>
                      <span className="text-[9px] font-black text-text-4 uppercase tracking-widest">{op.input}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-orange-500 font-mono text-xs font-black">{op.gas}</div>
                    <div className="text-[9px] font-black text-text-4 uppercase tracking-widest">{op.usage}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* System Components Grid */}
        <div className="mb-48">
          <div className="text-center mb-24">
            <h2 className="font-display text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter uppercase">System Components</h2>
            <p className="text-text-4 text-xs font-black uppercase tracking-[0.4em]">The Hybrid Infrastructure</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "ShadowOrderBook.sol", desc: "Core contract. Stores encrypted orders and executes FHE matching logic.", icon: Layers },
              { title: "ShadowVault.sol", desc: "Encrypted escrow. Holds trader funds for open orders with atomic security.", icon: Shield },
              { title: "ShadowSettlement.sol", desc: "Settlement executor. Runs token transfers after Threshold decryption.", icon: RefreshCw },
              { title: "Keeper Service", desc: "TypeScript off-chain engine. Triggers tryMatch() and watches for events.", icon: Activity },
              { title: "Threshold Network", desc: "MPC network. Performs async decryption for matched parties securely.", icon: Share2 },
              { title: "Fhenix CoFHE", desc: "The coprocessor. Executes high-performance FHE operations on ciphertext.", icon: Cpu },
            ].map((comp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-10 rounded-[2.5rem] border border-white/5 bg-white/[0.01] backdrop-blur-3xl hover:bg-white/[0.03] transition-all group"
              >
                <comp.icon size={32} className="text-teal-500 mb-6 transition-transform group-hover:scale-110" />
                <h4 className="text-xl font-black text-white mb-4 uppercase tracking-tight">{comp.title}</h4>
                <p className="text-text-3 text-sm leading-relaxed font-light">{comp.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative p-16 md:p-24 rounded-[4rem] border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent text-center backdrop-blur-3xl overflow-hidden group"
        >
          {/* Animated Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          
          <div className="relative z-10">
            <div className="h-24 w-24 rounded-[2rem] bg-white/5 flex items-center justify-center mx-auto mb-10 border border-white/10 group-hover:scale-110 transition-transform duration-500">
              <Activity size={48} className="text-teal-500 animate-pulse" />
            </div>
            
            <h3 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter uppercase leading-none">
              Ready to trade <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-purple-400">in the dark?</span>
            </h3>
            
            <p className="text-text-2 text-xl md:text-2xl mb-16 max-w-2xl mx-auto leading-relaxed font-light tracking-tight">
              Experience the future of private DeFi on Arbitrum Sepolia testnet. <br />
              <span className="text-white font-medium italic">No real assets required.</span>
            </p>
            
            <button 
              onClick={onStart}
              className="group relative px-16 py-8 rounded-2xl bg-white text-bg-void font-black uppercase tracking-[0.2em] text-sm hover:scale-105 transition-all duration-500 shadow-[0_30px_60px_rgba(255,255,255,0.1)] overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-4">
                Initialize Protocol
                <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-teal-400 via-purple-400 to-orange-400 opacity-0 group-hover:opacity-10 transition-opacity" />
            </button>
          </div>

          {/* Decorative Corner Icons */}
          <div className="absolute top-12 left-12 opacity-10">
            <Shield size={120} />
          </div>
          <div className="absolute bottom-12 right-12 opacity-10">
            <Lock size={120} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
