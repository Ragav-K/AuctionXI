import React from 'react';
import { motion } from 'motion/react';
import {
  Gavel,
  TrendingUp,
  Info,
  DollarSign,
  Zap,
  Shield,
  Award,
} from 'lucide-react';
import { Button, Card } from './shared';
import type { Screen } from '../types/auction';
import { useAuctionStore } from '../store/auctionStore';
import { emitBid } from '../hooks/useAuctionSocket';
import { useNavigate } from 'react-router-dom';

const formatCurrency = (value?: number) => `${(value ?? 0).toFixed(2)} Cr`;
const formatBidTime = (timestamp?: number | string) => {
  if (!timestamp) return '--:--';
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp));
};

export const AuctionRoom = ({ onNavigate }: { onNavigate?: (screen: Screen) => void }) => {
  const navigate = useNavigate();
  const {
    currentPlayer,
    currentBid,
    highestBidder,
    timer,
    bidHistory,
    auctionStatus,
    basePrice,
    user,
    teams,
    auctionSettings,
    lastResolution,
  } = useAuctionStore((state) => ({
    currentPlayer: state.currentPlayer,
    currentBid: state.currentBid,
    highestBidder: state.highestBidder,
    timer: state.timer,
    bidHistory: state.bidHistory,
    auctionStatus: state.auctionStatus,
    basePrice: state.basePrice,
    user: state.user,
    teams: state.teams,
    auctionSettings: state.auctionSettings,
    lastResolution: state.lastResolution,
  }));

  const userTeam = teams.find((team) => team.id === user?.teamId) || null;
  const maxPlayers = auctionSettings.playersPerTeam || auctionSettings.maxPlayers || 18;
  const rosterSlots = Array.from({ length: Math.min(maxPlayers, 4) }, (_, index) => index);

  const handleBid = (increment: number) => {
    if (!currentPlayer || !userTeam || auctionStatus !== 'running') return;
    emitBid(currentBid + increment);
  };

  const handleExit = () => {
    if (onNavigate) {
      onNavigate('lobby');
    } else {
      navigate('/');
    }
  };

  const displayBasePrice = basePrice || currentPlayer?.basePrice || 0;

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* Top Header Bar */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-navy-deep/50 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Gavel className="w-5 h-5 text-neon-green" />
            <span className="font-black tracking-tighter text-xl">AUCTION<span className="text-gold">XI</span></span>
          </div>
          <div className="h-4 w-[1px] bg-white/10 mx-2" />
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40">
            <Zap className="w-3 h-3 fill-neon-green text-neon-green" />
            {auctionSettings.serverName || 'Live Auction'}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user?.role === 'host' && (
            <Button variant="outline" className="px-4 py-2 text-xs h-9" onClick={() => navigate('/auctioneer/setup')}>
              Setup
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Your Budget</p>
              <p className="text-sm font-black text-gold">
                {formatCurrency(userTeam?.budget ?? auctionSettings.budget ?? auctionSettings.totalBudget ?? 0)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-gold bg-gold/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-gold" />
            </div>
          </div>
          <Button variant="outline" className="px-4 py-2 text-xs h-9" onClick={handleExit}>
            Exit
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden">

        {auctionStatus === 'ended' && lastResolution && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-12"
          >
            <Card className="flex items-center justify-between bg-white/5 border-white/10">
              <div className="flex items-center gap-3 text-sm">
                <Award className="w-5 h-5 text-gold" />
                <span className="font-bold">
                  {lastResolution.player.name} {lastResolution.status === 'sold' ? `sold to ${lastResolution.winner?.name} for ${formatCurrency(lastResolution.amount ?? lastResolution.player.basePrice)}` : 'went unsold'}
                </span>
              </div>
              <span className="text-xs text-white/50 uppercase tracking-widest">Select the next player to continue</span>
            </Card>
          </motion.div>
        )}
        
        {/* LEFT SIDE: Player Info */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="col-span-12 lg:col-span-4 flex flex-col gap-6"
        >
          <Card className="p-0 overflow-hidden border-white/10 relative group">
            {currentPlayer ? (
              <>
                <div className="aspect-[4/5] relative">
                  <img 
                    src={currentPlayer.image} 
                    alt={currentPlayer.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-transparent to-transparent" />
                  
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-neon-green text-navy-deep px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest w-fit mb-2">
                      {currentPlayer.role}
                    </div>
                    <h3 className="text-3xl font-black tracking-tight leading-none mb-1">{currentPlayer.name}</h3>
                    <p className="text-white/60 text-sm font-medium">{currentPlayer.currentTeam || 'Awaiting assignment'}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="min-h-[420px] flex items-center justify-center text-white/40">
                Waiting for host to queue the first player...
              </div>
            )}
          </Card>

          <Card className="flex-1 bg-white/5 border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-neon-green" />
              <h4 className="text-xs font-black uppercase tracking-widest">Player Analysis</h4>
            </div>
            {currentPlayer ? (
              <>
                <p className="text-sm text-white/60 leading-relaxed mb-4">
                  {currentPlayer.description || 'Detailed analysis will appear when AI insights are available.'}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Category</p>
                    <p className="text-lg font-black">{currentPlayer.category}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Base Price</p>
                    <p className="text-lg font-black text-gold">{formatCurrency(displayBasePrice)}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Points</p>
                    <p className="text-lg font-black">{currentPlayer.points ?? '--'}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Matches</p>
                    <p className="text-lg font-black">{currentPlayer.stats.matches}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-white/40">Player scouting report will appear once the host starts the auction.</p>
            )}
          </Card>
        </motion.div>

        {/* CENTER: Bidding Display */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <Card className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-navy-deep to-black border-white/10">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-green/10 blur-[100px] rounded-full" />
            
            <div className="z-10 text-center">
              <motion.div
                key={timer}
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-6xl font-black mb-8 ${timer < 10 && auctionStatus === 'running' ? 'text-red-500' : 'text-white/20'}`}
              >
                00:{String(Math.max(timer, 0)).padStart(2, '0')}
              </motion.div>

              <p className="text-xs font-black uppercase tracking-[0.5em] text-white/40 mb-2">Current Bid</p>
              <motion.div 
                key={currentBid}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-8xl md:text-9xl font-black text-glow-green mb-8"
              >
                {formatCurrency(currentBid)}
              </motion.div>

              <div className="flex items-center justify-center gap-4">
                <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full" style={{ backgroundColor: highestBidder?.color || '#222' }} />
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Highest Bidder</p>
                    <p className="text-sm font-black">{highestBidder?.name || 'No bids yet'}</p>
                  </div>
                </div>
              </div>

              {currentPlayer && (
                <div className="grid grid-cols-3 gap-4 text-left mt-8 text-xs uppercase tracking-widest text-white/40">
                  <div>
                    <p className="mb-1">Category</p>
                    <p className="text-white text-base font-black">{currentPlayer.category}</p>
                  </div>
                  <div>
                    <p className="mb-1">Role</p>
                    <p className="text-white text-base font-black">{currentPlayer.role}</p>
                  </div>
                  <div>
                    <p className="mb-1">Base Price</p>
                    <p className="text-gold text-base font-black">{formatCurrency(displayBasePrice)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Timer Progress Bar */}
            <div className="absolute bottom-0 left-0 w-full h-2 bg-white/5">
              <motion.div 
                className={`h-full ${timer < 10 && auctionStatus === 'running' ? 'bg-red-500' : 'bg-neon-green'}`}
                initial={{ width: '100%' }}
                animate={{ width: `${Math.max((timer / 30) * 100, 0)}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>
          </Card>

          {/* Activity Feed */}
          <Card className="h-48 bg-white/5 border-white/5 overflow-hidden flex flex-col p-0">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-white/40" />
                <h4 className="text-xs font-black uppercase tracking-widest text-white/40">Live Bidding Feed</h4>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-neon-green">Live</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {bidHistory.length ? (
                bidHistory.map((bid) => {
                  const historyKey = bid.id || `${bid.teamName}-${bid.timestamp}`;
                  return (
                  <motion.div 
                    key={historyKey}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                      <span className="font-bold">{bid.teamName}</span>
                      <span className="text-white/40">placed a bid of</span>
                      <span className="font-black text-neon-green">{formatCurrency(bid.amount)}</span>
                    </div>
                    <span className="text-[10px] font-bold text-white/20">{formatBidTime(bid.timestamp)}</span>
                  </motion.div>
                );})
              ) : (
              <p className="text-white/30 text-center text-xs">No bids yet. Be the first to bid!</p>
              )}
            </div>
          </Card>

          <Card className="bg-white/5 border-white/10 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gold" />
                <h4 className="text-xs font-black uppercase tracking-widest">Place Your Bid</h4>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                {userTeam ? `${userTeam.name}` : 'Spectator'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: '+10 Lakhs', value: 0.1 },
                { label: '+25 Lakhs', value: 0.25 },
                { label: '+50 Lakhs', value: 0.5 },
              ].map((option) => (
                <div key={option.label}>
                  <Button
                    variant="outline"
                    className="py-4 text-sm bg-white/5 border-white/10 w-full"
                    onClick={() => handleBid(option.value)}
                    disabled={!userTeam || auctionStatus !== 'running'}
                  >
                    {option.label}
                  </Button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-white/40">
              <div>
                <p className="uppercase tracking-widest mb-1">Timer</p>
                <p className="text-lg font-black text-white">{String(Math.max(timer, 0)).padStart(2, '0')}s</p>
              </div>
              <div>
                <p className="uppercase tracking-widest mb-1">Leading Team</p>
                <p className="text-lg font-black text-white">{highestBidder?.name || 'No bids yet'}</p>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
