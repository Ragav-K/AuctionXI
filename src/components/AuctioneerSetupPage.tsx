import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from './shared';
import { useAuctionStore } from '../store/auctionStore';
import { fetchPlayersByCategory } from '../services/api';
import { emitInitAuction } from '../hooks/useAuctionSocket';
import type { Player, PlayerCategory } from '../types/auction';
import { ArrowLeft, Zap } from 'lucide-react';

const CATEGORIES: PlayerCategory[] = ['Platinum', 'Gold', 'Silver', 'Bronze'];

export const AuctioneerSetupPage = () => {
  const navigate = useNavigate();
  const { serverId, auctionStatus, currentPlayer } = useAuctionStore((state) => ({
    serverId: state.serverId,
    auctionStatus: state.auctionStatus,
    currentPlayer: state.currentPlayer,
  }));

  const [selectedCategory, setSelectedCategory] = useState<PlayerCategory>('Platinum');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [basePriceInput, setBasePriceInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPlayers = useCallback(async () => {
    if (!serverId) return;
    try {
      setLoading(true);
      setError('');
      const data = await fetchPlayersByCategory(serverId, selectedCategory);
      setPlayers(data);
      if (selectedPlayer && !data.find((player) => player.id === selectedPlayer.id)) {
        setSelectedPlayer(null);
      }
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Unable to fetch players');
    } finally {
      setLoading(false);
    }
  }, [serverId, selectedCategory, selectedPlayer]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  useEffect(() => {
    if (auctionStatus === 'running' && currentPlayer) {
      navigate('/auction/live', { replace: true });
    }
  }, [auctionStatus, currentPlayer, navigate]);

  const handlePlayerClick = (player: Player) => {
    if (player.status && player.status !== 'available') return;
    setSelectedPlayer(player);
    setBasePriceInput('');
  };

  const basePriceValue = parseFloat(basePriceInput || '0');
  const canStart = Boolean(
    selectedPlayer &&
      !loading &&
      !isSubmitting &&
      Number.isFinite(basePriceValue) &&
      basePriceValue > 0,
  );

  const handleStart = () => {
    if (!selectedPlayer || !canStart) return;
    setIsSubmitting(true);
    emitInitAuction(selectedPlayer.id!, basePriceValue);
    setTimeout(() => setIsSubmitting(false), 800);
  };

  const statusBanner = useMemo(() => {
    if (!selectedPlayer) return null;
    if (selectedPlayer.status === 'sold') return 'SOLD';
    if (selectedPlayer.status === 'unsold') return 'UNSOLD';
    return null;
  }, [selectedPlayer]);

  return (
    <div className="min-h-screen bg-dark-bg text-white px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2 text-neon-green text-sm font-black uppercase tracking-[0.2em]">
            <Zap className="w-4 h-4" />
            Auctioneer Setup
          </div>
        </div>

        {!serverId ? (
          <Card className="text-center py-20">
            <p className="text-sm text-white/60">
              Create or join an auction server first to access the control panel.
            </p>
            <Button className="mt-6" onClick={() => navigate('/')}>
              Go to Home
            </Button>
          </Card>
        ) : (
          <>
            <Card className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black">Choose a player to start the next round</h2>
                <span className="text-xs uppercase tracking-widest text-white/40">
                  Server Code: {serverId}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-[0.2em] border ${
                      selectedCategory === category
                        ? 'bg-neon-green text-navy-deep border-neon-green'
                        : 'border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white/60">
                    {selectedCategory} Players
                  </h3>
                  {loading && <span className="text-xs text-white/40">Loading...</span>}
                </div>
                {error && (
                  <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                  {players.map((player) => {
                    const disabled = player.status && player.status !== 'available';
                    const isSelected = selectedPlayer?.id === player.id;
                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => handlePlayerClick(player)}
                        disabled={disabled}
                        className={`text-left p-4 rounded-2xl border ${
                          isSelected
                            ? 'border-neon-green bg-neon-green/10'
                            : 'border-white/10 bg-white/5 hover:border-white/30'
                        } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <p className="text-xs uppercase tracking-[0.3em] text-white/40">{player.role}</p>
                        <h4 className="text-xl font-black">{player.name}</h4>
                        <p className="text-sm text-white/60">Points: {player.points ?? '--'}</p>
                        {player.status && player.status !== 'available' && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                            {player.status}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {!players.length && !loading && (
                    <p className="text-sm text-white/40 col-span-full">
                      No players found in this category.
                    </p>
                  )}
                </div>
              </Card>

              <Card className="space-y-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white/60">
                    Selected Player
                  </h3>
                  {selectedPlayer ? (
                    <div className="mt-4 p-4 rounded-xl border border-white/10 bg-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                            {selectedPlayer.role}
                          </p>
                          <p className="text-xl font-black">{selectedPlayer.name}</p>
                          <p className="text-sm text-white/60">Points: {selectedPlayer.points ?? '--'}</p>
                        </div>
                        {statusBanner && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                            {statusBanner}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-white/40 mt-2">Choose a player to configure the round.</p>
                  )}
                </div>

                {selectedPlayer && (
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-white/40">
                      Base Price (Cr)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={basePriceInput}
                      onChange={(event) => setBasePriceInput(event.target.value)}
                      placeholder="Enter base price"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-green/50"
                    />
                    <p className="text-[11px] text-white/40">
                      This amount becomes the starting bid for everyone.
                    </p>
                  </div>
                )}

                <Button
                  variant="primary"
                  glow
                  disabled={!canStart}
                  className="w-full py-4"
                  onClick={handleStart}
                >
                  {isSubmitting ? 'Launching...' : 'Start Auction'}
                </Button>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
