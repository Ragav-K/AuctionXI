import React from 'react';
import { motion } from 'motion/react';
import { Gavel, Plus, ArrowRight } from 'lucide-react';
import { Button } from './shared';
import type { Screen } from '../types/auction';

export const Home = ({ onNavigate }: { onNavigate: (screen: Screen) => void }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-green/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 blur-[120px] rounded-full animate-pulse delay-1000" />
      
      {/* Stadium Light Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-white/5 to-transparent blur-3xl opacity-30 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center z-10"
      >
        <div className="flex items-center justify-center mb-6">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 glow-green">
            <Gavel className="w-12 h-12 text-neon-green" />
          </div>
        </div>
        
        <h1 className="text-7xl md:text-8xl font-black tracking-tighter mb-4 text-glow-green">
          AUCTION<span className="text-gold">XI</span>
        </h1>
        
        <p className="text-white/60 text-lg md:text-xl font-medium tracking-wide mb-12 max-w-md mx-auto">
          The ultimate multiplayer cricket auction experience. Build your dream XI.
        </p>

        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          <Button 
            variant="primary" 
            glow 
            className="w-full md:w-64 py-6 text-lg"
            onClick={() => onNavigate('create')}
          >
            <Plus className="w-6 h-6" />
            Create Auction
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full md:w-64 py-6 text-lg border-white/10 bg-white/5 backdrop-blur-md"
            onClick={() => onNavigate('join')}
          >
            <ArrowRight className="w-6 h-6" />
            Join Auction
          </Button>
        </div>
      </motion.div>

      {/* Stats / Footer info */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-12 flex gap-12 text-white/30 text-xs font-bold uppercase tracking-[0.2em]"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-white/60 text-lg">10K+</span>
          <span>Auctions Held</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-white/60 text-lg">50K+</span>
          <span>Teams Built</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-white/60 text-lg">Real-time</span>
          <span>Multiplayer</span>
        </div>
      </motion.div>
    </div>
  );
};
