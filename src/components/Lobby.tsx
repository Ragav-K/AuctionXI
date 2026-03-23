import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Clock, Shield, Zap, Play, LogOut, Copy } from 'lucide-react';
import { Button, Card } from './shared';
import type { Screen } from '../types/auction';
import { useAuctionStore } from '../store/auctionStore';
import { useNavigate } from 'react-router-dom';

export const Lobby = ({ onNavigate }: { onNavigate: (screen: Screen) => void }) => {
  const navigate = useNavigate();
  const { teams, auctionSettings, status, user, serverId } = useAuctionStore((state) => ({
    teams: state.teams,
    auctionSettings: state.auctionSettings,
    status: state.status,
    user: state.user,
    serverId: state.serverId,
  }));

  const maxTeamSlots = auctionSettings.teamCount || auctionSettings.maxTeams || 8;
  const emptySlots = Math.max(maxTeamSlots - teams.length, 0);
  const canStart = user?.role === 'host' && status === 'waiting';

  useEffect(() => {
    if (status === 'live') {
      onNavigate('auction');
      navigate('/auction/live');
    }
  }, [status, onNavigate, navigate]);

  const handleStartAuction = () => {
    if (!canStart) return;
    navigate('/auctioneer/setup');
  };

  return (
    <div className="min-h-screen py-20 px-4 flex flex-col items-center max-w-6xl mx-auto">
      <div className="w-full flex justify-between items-end mb-12">
        <div>
          <div className="flex items-center gap-2 text-neon-green mb-2">
            <Zap className="w-4 h-4 fill-neon-green" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Live Server</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight">
            {auctionSettings.serverName || 'Auction Lobby'}
          </h2>
          <p className="text-white/40">Waiting for all teams to join...</p>
          {serverId && (
            <button
              className="mt-2 flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 hover:text-white transition"
              onClick={() => {
                if (navigator?.clipboard?.writeText) {
                  navigator.clipboard.writeText(serverId).catch(() => {});
                }
              }}
            >
              <Copy className="w-3 h-3" /> Share Code: {serverId}
            </button>
          )}
        </div>
        
        <div className="flex gap-4">
          <Button variant="outline" className="px-6 py-3 text-sm" onClick={() => onNavigate('home')}>
            <LogOut className="w-4 h-4" />
            Leave
          </Button>
          <Button
            variant="primary"
            glow
            className="px-8 py-3 text-sm"
            onClick={handleStartAuction}
            disabled={!canStart}
          >
            <Play className="w-4 h-4 fill-navy-deep" />
            Open Setup
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-12">
        {teams.map((team, index) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden group hover:border-white/20 transition-colors">
              <div 
                className="absolute top-0 left-0 w-1 h-full" 
                style={{ backgroundColor: team.color }} 
              />
              
              <div className="flex justify-between items-start mb-6">
                <div className="p-2 bg-white/5 rounded-lg">
                  <Shield className="w-6 h-6" style={{ color: team.color }} />
                </div>
                {team.isHost && (
                  <span className="text-[10px] font-black bg-white/10 px-2 py-1 rounded uppercase tracking-widest">Host</span>
                )}
              </div>

              <h3 className="text-xl font-bold mb-1">{team.name}</h3>
              <p className="text-white/40 text-xs uppercase tracking-widest mb-6">
                Owner: {team.owner}
              </p>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Budget</span>
                  <span className="font-bold text-gold">{team.budget} Cr</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gold" 
                    style={{ width: (auctionSettings.budget || auctionSettings.totalBudget) ? `${Math.min((team.budget / (auctionSettings.budget || auctionSettings.totalBudget || 1)) * 100, 100)}%` : '100%' }} 
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Players</span>
                  <span className="font-bold">
                    {team.players?.length ?? 0} / {auctionSettings.playersPerTeam || auctionSettings.maxPlayers || 18}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

        {/* Empty Slots */}
        {[...Array(emptySlots)].map((_, i) => (
          <div key={i} className="border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center p-8 text-white/10">
            <Users className="w-8 h-8 mb-2 opacity-20" />
            <span className="text-xs font-bold uppercase tracking-widest">Waiting...</span>
          </div>
        ))}
      </div>

      <Card className="w-full bg-white/5 border-white/5 flex items-center justify-between py-4 px-8">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/40" />
            <span className="text-sm font-bold text-white/60">Auction starts in:</span>
          </div>
          <div className="flex gap-2">
            <div className="bg-white/10 px-3 py-1 rounded font-mono text-xl font-bold">04</div>
            <span className="text-xl font-bold text-white/20">:</span>
            <div className="bg-white/10 px-3 py-1 rounded font-mono text-xl font-bold">59</div>
          </div>
        </div>

        <div className="flex -space-x-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-navy-deep bg-white/10 flex items-center justify-center text-[10px] font-bold">
              {String.fromCharCode(65 + i)}
            </div>
          ))}
          <div className="w-8 h-8 rounded-full border-2 border-navy-deep bg-neon-green text-navy-deep flex items-center justify-center text-[10px] font-bold">
            +3
          </div>
        </div>
      </Card>
    </div>
  );
};
