import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { EncryptedValue } from './EncryptedValue';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orderData: {
    side: 'buy' | 'sell';
    amount: string;
    price: string;
    pair: string;
  };
}

export function OrderConfirmationModal({ isOpen, onClose, onConfirm, orderData }: OrderConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-bg-void/80 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md premium-card p-8 md:p-10 overflow-hidden"
          >
            {/* Background Glow */}
            <div className={cn(
              "absolute -top-24 -right-24 w-48 h-48 blur-[80px] rounded-full opacity-20",
              orderData.side === 'buy' ? "bg-teal-500" : "bg-orange-500"
            )} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center border",
                    orderData.side === 'buy' ? "bg-teal-500/10 border-teal-500/20 text-teal-500" : "bg-orange-500/10 border-orange-500/20 text-orange-500"
                  )}>
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-black text-white tracking-tight uppercase">Confirm Order</h3>
                    <p className="text-[10px] font-black text-text-4 uppercase tracking-widest">FHE Protected Submission</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-3 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 mb-12">
                <div className="p-6 rounded-2xl bg-bg-deep/50 border border-white/5 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-text-4 uppercase tracking-widest">Side</span>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      orderData.side === 'buy' ? "bg-teal-500/10 text-teal-500" : "bg-orange-500/10 text-orange-500"
                    )}>
                      {orderData.side}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-text-4 uppercase tracking-widest">Pair</span>
                    <span className="text-sm font-display font-black text-white tracking-tight">{orderData.pair}</span>
                  </div>

                  <div className="h-px bg-white/5" />

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-text-4 uppercase tracking-widest">Amount</span>
                      <span className="text-sm font-mono font-black text-white tracking-tight">{orderData.amount} WETH</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black text-text-4 uppercase tracking-widest">Price (Encrypted)</span>
                      <div className="flex items-center gap-1.5">
                        <Lock size={10} className="text-teal-500" />
                        <span className="text-[8px] font-black text-teal-500 uppercase tracking-widest">FHE Active</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <EncryptedValue value={orderData.price} revealed={false} unit="USDC" />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-teal-500/5 border border-teal-500/10">
                  <CheckCircle2 size={16} className="text-teal-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-teal-500/80 font-bold leading-relaxed uppercase tracking-wider">
                    Your order will be encrypted on-device. Only the matching engine can see the values within the FHE vault.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={onClose}
                  className="flex-1 py-5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-text-2 uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={onConfirm}
                  className={cn(
                    "flex-[2] py-5 rounded-2xl font-display text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 relative overflow-hidden group/btn",
                    orderData.side === 'buy' 
                      ? "bg-white text-bg-void shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(255,255,255,0.2)]" 
                      : "bg-orange-500 text-white shadow-[0_0_30_rgba(249,115,22,0.2)] hover:shadow-[0_0_50px_rgba(249,115,22,0.3)]"
                  )}
                >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    Confirm {orderData.side}
                    <ArrowRight size={14} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
