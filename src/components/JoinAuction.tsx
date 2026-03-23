import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Zap, ArrowLeft, Palette, AlertCircle } from 'lucide-react';
import { Button, Input, Card } from './shared';
import type { Screen } from '../types/auction';
import { useAuctionStore } from '../store/auctionStore';
import { fetchServerApi, joinServerApi } from '../services/api';
import { TeamColorPicker } from './TeamColorPicker';

export const JoinAuction = ({ onNavigate }: { onNavigate: (screen: Screen) => void }) => {
  const [step, setStep] = useState(1);
  const [teamColor, setTeamColor] = useState('#0054FF');
  const [teamName, setTeamName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [serverCode, setServerCode] = useState('');
  const [serverPassword, setServerPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { hydrateFromServer, setUserProfile, teams } = useAuctionStore((state) => ({
    hydrateFromServer: state.hydrateFromServer,
    setUserProfile: state.setUserProfile,
    teams: state.teams,
  }));
  const [serverPasswordRequired, setServerPasswordRequired] = useState(false);

  const handleJoinServer = () => {
    if (!serverCode.trim()) {
      setError('Enter a server code');
      return;
    }
    (async () => {
      try {
        setIsLoading(true);
        setError('');
        const server = await fetchServerApi(serverCode.trim().toUpperCase());
        const requiresPassword = Boolean(server.auctionSettings.serverPassword);
        if (requiresPassword && server.auctionSettings.serverPassword !== serverPassword) {
          setError('Invalid server password');
          return;
        }
        hydrateFromServer(server);
        setServerPasswordRequired(requiresPassword);
        setStep(2);
      } catch (apiError) {
        setError(apiError instanceof Error ? apiError.message : 'Unable to find server');
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const handleCompleteJoin = () => {
    if (!ownerName.trim() || !teamName.trim()) {
      setError('Please enter both owner and team names');
      return;
    }

    if (teams.some((team) => team.color?.toLowerCase() === teamColor.toLowerCase())) {
      setError('Color already taken by another team');
      return;
    }

    (async () => {
      try {
        setIsLoading(true);
        setError('');
        const server = await joinServerApi({
          serverId: serverCode.trim().toUpperCase(),
          ownerName: ownerName.trim(),
          teamName: teamName.trim(),
          color: teamColor,
          serverPassword: serverPasswordRequired ? serverPassword : undefined,
        });
        hydrateFromServer(server);
        const joinedTeam =
          server.teams.find(
            (team) =>
              team.owner?.toLowerCase() === ownerName.trim().toLowerCase() &&
              team.name?.toLowerCase() === teamName.trim().toLowerCase()
          ) ?? server.teams[server.teams.length - 1];
        setUserProfile({
          name: ownerName.trim(),
          teamName: teamName.trim(),
          color: teamColor,
          role: 'participant',
          teamId: joinedTeam?.id,
        });
        onNavigate('lobby');
      } catch (apiError) {
        setError(apiError instanceof Error ? apiError.message : 'Unable to join server');
      } finally {
        setIsLoading(false);
      }
    })();
  };

  return (
    <div className="min-h-screen py-20 px-4 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-xl mb-8"
      >
        <button 
          onClick={() => step === 1 ? onNavigate('home') : setStep(1)}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors uppercase text-xs font-bold tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 1 ? 'Back to Home' : 'Back to Server Info'}
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-xl"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-gold/10 rounded-xl border border-gold/20">
                <Zap className="w-8 h-8 text-gold" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Join Auction</h2>
                <p className="text-white/40 text-sm">Enter server credentials to enter</p>
              </div>
            </div>

            <Card className="space-y-6">
              <Input label="Server Code" placeholder="Enter server ID" icon={Zap} value={serverCode} onChange={setServerCode} />
              <Input label="Server Password" placeholder="••••••••" type="password" icon={Shield} value={serverPassword} onChange={setServerPassword} />
              
              <Button 
                variant="secondary" 
                glow 
                className="w-full py-6 text-lg"
                onClick={handleJoinServer}
                disabled={isLoading}
              >
                {isLoading ? 'Validating...' : 'Find Server'}
              </Button>

              {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-xl"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-neon-green/10 rounded-xl border border-neon-green/20">
                <Palette className="w-8 h-8 text-neon-green" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Setup Your Team</h2>
                <p className="text-white/40 text-sm">Choose your identity for the auction</p>
              </div>
            </div>

            <Card className="space-y-8">
              <div className="space-y-2 w-full">
                <label className="text-xs font-semibold uppercase tracking-widest text-white/40 ml-1">Owner Name</label>
                <input 
                  type="text"
                  value={ownerName}
                  onChange={(e) => {
                    setOwnerName(e.target.value);
                    setError('');
                  }}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 focus:outline-none focus:border-neon-green/50 transition-colors placeholder:text-white/20"
                />
              </div>

              <div className="space-y-2 w-full">
                <label className="text-xs font-semibold uppercase tracking-widest text-white/40 ml-1">Team Name</label>
                <input 
                  type="text"
                  value={teamName}
                  onChange={(e) => {
                    setTeamName(e.target.value);
                    setError('');
                  }}
                  placeholder="e.g. Royal Challengers"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 focus:outline-none focus:border-neon-green/50 transition-colors placeholder:text-white/20"
                />
              </div>

              <div className="space-y-4">
                <label className="text-xs font-semibold uppercase tracking-widest text-white/40 ml-1">Team Color</label>
                <TeamColorPicker
                  value={teamColor}
                  onChange={(color) => {
                    setTeamColor(color);
                    setError('');
                  }}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <Button 
                variant="primary" 
                glow 
                className="w-full py-6 text-lg"
                onClick={handleCompleteJoin}
                disabled={isLoading}
              >
                {isLoading ? 'Joining...' : 'Enter Lobby'}
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
