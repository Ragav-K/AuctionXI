import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Shield, DollarSign, Users, Zap, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button, Input, Card } from './shared';
import type { Screen, AuctionSettings } from '../types/auction';
import { useAuctionStore } from '../store/auctionStore';
import { createServerApi } from '../services/api';

const defaultFormValues = {
  serverName: '',
  serverPassword: '',
  totalBudget: '',
  teamCount: '',
  playersPerTeam: '',
  maxForeign: '',
  batsmen: '',
  bowlers: '',
  allRounders: '',
};

type FormField = keyof typeof defaultFormValues;

export const CreateAuction = ({ onNavigate }: { onNavigate: (screen: Screen) => void }) => {
  const { hydrateFromServer, setUserProfile } = useAuctionStore((state) => ({
    hydrateFromServer: state.hydrateFromServer,
    setUserProfile: state.setUserProfile,
  }));

  const [formValues, setFormValues] = useState<typeof defaultFormValues>(() => ({ ...defaultFormValues }));
  const [autoUnsoldTimer, setAutoUnsoldTimer] = useState(true);
  const [publicServer, setPublicServer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: FormField) => (value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    if (error) {
      setError('');
    }
  };

  const handleSubmit = () => {
    const teams = Number(formValues.teamCount) || 0;
    const playersPerTeam = Number(formValues.playersPerTeam) || 0;
    const maxForeignPlayers = Number(formValues.maxForeign) || 0;
    const roleRules = {
      batsmen: Number(formValues.batsmen) || 0,
      bowlers: Number(formValues.bowlers) || 0,
      allRounders: Number(formValues.allRounders) || 0,
    };
    const totalRolePlayers = roleRules.batsmen + roleRules.bowlers + roleRules.allRounders;

    if (!teams || !playersPerTeam) {
      setError('Enter team count and players per team before initializing the server.');
      return;
    }

    if (totalRolePlayers !== playersPerTeam) {
      setError('Batsmen, bowlers, and all-rounders must add up exactly to players per team.');
      return;
    }

    const settings: AuctionSettings = {
      serverName: formValues.serverName.trim(),
      serverPassword: formValues.serverPassword,
      totalBudget: Number(formValues.totalBudget) || 0,
      maxTeams: teams,
      teamCount: teams,
      maxPlayers: playersPerTeam,
      playersPerTeam,
      maxForeign: maxForeignPlayers,
      maxForeignPlayers,
      rosterRequirements: roleRules,
      roleRules,
      autoUnsoldTimer,
      publicServer,
    };

    (async () => {
      try {
        setIsLoading(true);
        setError('');
        const server = await createServerApi({
          auctionSettings: {
            ...settings,
            budget: Number(formValues.totalBudget) || 0,
          },
          auctionRules: {
            teams,
            playersPerTeam,
            maxForeignPlayers,
            roleRules,
          },
        });
        hydrateFromServer(server);
        setUserProfile({
          name: formValues.serverName || 'Host',
          teamName: '',
          color: '#FFFFFF',
          role: 'host',
        });
        onNavigate('lobby');
      } catch (apiError) {
        setError(apiError instanceof Error ? apiError.message : 'Failed to create server');
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
        className="w-full max-w-4xl mb-8"
      >
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors uppercase text-xs font-bold tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-neon-green/10 rounded-xl border border-neon-green/20">
            <Settings className="w-8 h-8 text-neon-green" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Create New Auction</h2>
            <p className="text-white/40 text-sm">Configure your server rules and budget</p>
          </div>
        </div>

        <Card className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Input label="Server Name" placeholder="e.g. IPL 2026 Mega Auction" icon={Zap} value={formValues.serverName} onChange={handleChange('serverName')} />
            <Input label="Server Password" placeholder="••••••••" type="password" icon={Shield} value={formValues.serverPassword} onChange={handleChange('serverPassword')} />
            <Input label="Total Budget (Cr)" placeholder="100" icon={DollarSign} value={formValues.totalBudget} onChange={handleChange('totalBudget')} />
            <Input label="Number of Teams" placeholder="10" icon={Users} value={formValues.teamCount} onChange={handleChange('teamCount')} />
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Squad Restrictions</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <Input label="Players per Team" placeholder="18" value={formValues.playersPerTeam} onChange={handleChange('playersPerTeam')} />
              <Input label="Max Foreign" placeholder="8" value={formValues.maxForeign} onChange={handleChange('maxForeign')} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input label="Batsmen" placeholder="5" value={formValues.batsmen} onChange={handleChange('batsmen')} />
              <Input label="Bowlers" placeholder="5" value={formValues.bowlers} onChange={handleChange('bowlers')} />
              <Input label="All-rounders" placeholder="3" value={formValues.allRounders} onChange={handleChange('allRounders')} />
            </div>

            <div className="pt-4 space-y-4">
              <button
                type="button"
                onClick={() => setAutoUnsoldTimer((prev) => !prev)}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 w-full text-left"
              >
                <div>
                  <p className="text-sm font-bold">Auto-Unsold Timer</p>
                  <p className="text-xs text-white/40">Skip players after 30s of no bids</p>
                </div>
                <div className={`w-12 h-6 rounded-full relative border ${autoUnsoldTimer ? 'bg-neon-green/20 border-neon-green/30' : 'bg-white/10 border-white/10'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-300 ${autoUnsoldTimer ? 'right-1 bg-neon-green' : 'left-1 bg-white/40'}`} />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPublicServer((prev) => !prev)}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 w-full text-left"
              >
                <div>
                  <p className="text-sm font-bold">Public Server</p>
                  <p className="text-xs text-white/40">Visible in the global server list</p>
                </div>
                <div className={`w-12 h-6 rounded-full relative border ${publicServer ? 'bg-neon-green/20 border-neon-green/30' : 'bg-white/10 border-white/10'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-300 ${publicServer ? 'right-1 bg-neon-green' : 'left-1 bg-white/40'}`} />
                </div>
              </button>
            </div>
          </div>

        </Card>
        {error && (
          <div className="w-full max-w-4xl mt-6">
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="w-full max-w-4xl mt-6">
          <Button 
            variant="primary" 
            glow 
            className="w-full py-6 text-lg"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Initializing...' : 'Initialize Server'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
