import { useEffect } from 'react';
import { initSocket, getSocket } from '../lib/socket';
import { useAuctionStore } from '../store/auctionStore';
import type { AuctionResolution, CurrentAuction, ServerState } from '../types/auction';

export const useAuctionSocket = () => {
  const {
    serverId,
    user,
    handleServerUpdate,
    handleBidUpdate,
    handleTimerUpdate,
    handleAuctionUpdate,
    handleAuctionEnded,
    setSocketConnected,
  } = useAuctionStore((state) => ({
    serverId: state.serverId,
    user: state.user,
    handleServerUpdate: state.handleServerUpdate,
    handleBidUpdate: state.handleBidUpdate,
    handleTimerUpdate: state.handleTimerUpdate,
    handleAuctionUpdate: state.handleAuctionUpdate,
    handleAuctionEnded: state.handleAuctionEnded,
    setSocketConnected: state.setSocketConnected,
  }));

  useEffect(() => {
    if (!serverId || !user) {
      return;
    }

    const socket = initSocket();
    if (!socket.connected) {
      socket.connect();
    }

    const cleanup = () => {
      socket.off('serverUpdate', onServerUpdate);
      socket.off('auctionStarted', onAuctionStarted);
      socket.off('auctionEnded', onAuctionEnded);
      socket.off('bidUpdate', onBidUpdate);
      socket.off('timerUpdate', onTimerUpdate);
      socket.off('serverError', onServerError);
      socket.off('connect');
      socket.off('disconnect');
    };

    const onServerUpdate = (payload: ServerState) => handleServerUpdate(payload);
    const onAuctionStarted = (payload: CurrentAuction) => handleAuctionUpdate(payload);
    const onAuctionEnded = (payload: {
      currentAuction: CurrentAuction | null;
      resolution?: AuctionResolution | null;
    }) =>
      handleAuctionEnded(payload);
    const onBidUpdate = (payload: { currentBid: number; highestBidder: any; bidHistory: any[] }) =>
      handleBidUpdate(payload);
    const onTimerUpdate = (payload: { timer: number }) => handleTimerUpdate(payload.timer);
    const onServerError = (message: { message: string }) => {
      console.error(message.message);
    };

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('serverUpdate', onServerUpdate);
    socket.on('auctionStarted', onAuctionStarted);
    socket.on('auctionEnded', onAuctionEnded);
    socket.on('bidUpdate', onBidUpdate);
    socket.on('timerUpdate', onTimerUpdate);
    socket.on('serverError', onServerError);

    socket.emit('joinServer', { serverId, user });

    return () => {
      cleanup();
    };
  }, [
    serverId,
    user?.teamId,
    handleServerUpdate,
    handleBidUpdate,
    handleTimerUpdate,
    handleAuctionUpdate,
    handleAuctionEnded,
    setSocketConnected,
  ]);
};

export const emitBid = (amount: number) => {
  const socket = getSocket();
  const { serverId, user } = useAuctionStore.getState();
  if (!serverId || !user?.teamId) return;
  socket?.emit('placeBid', {
    serverId,
    amount,
    teamId: user.teamId,
  });
};

export const emitInitAuction = (playerId: string, basePrice: number) => {
  const socket = getSocket();
  const { serverId } = useAuctionStore.getState();
  if (!serverId) return;
  socket?.emit('initAuction', {
    serverId,
    playerId,
    basePrice,
  });
};
