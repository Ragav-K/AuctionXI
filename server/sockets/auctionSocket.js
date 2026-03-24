import { ServerModel } from '../models/Server.js';
import {
  applyBid,
  getServerById,
  selectAuctionPlayer,
  settleCurrentPlayer,
} from '../controllers/serverController.js';

const connectedUsers = new Map(); // serverId -> Map<socketId, user>
const auctionTimers = new Map(); // serverId -> { interval, remaining }
const TIMER_DURATION = 30;

const serialize = (server) =>
  server?.toObject ? server.toObject({ getters: true, virtuals: true }) : server;

const ensureServerRoom = (serverId) => {
  if (!connectedUsers.has(serverId)) {
    connectedUsers.set(serverId, new Map());
  }
};

const clearTimer = (serverId) => {
  const entry = auctionTimers.get(serverId);
  if (entry?.interval) {
    clearInterval(entry.interval);
  }
  auctionTimers.delete(serverId);
};

const broadcastSnapshot = (io, serverId, server) => {
  const snapshot = serialize(server);
  io.to(serverId).emit('serverUpdate', snapshot);
};

const emitBidUpdate = (io, serverId, server) => {
  const snapshot = serialize(server);
  if (!snapshot?.currentAuction) return;
  io.to(serverId).emit('bidUpdate', {
    currentBid: snapshot.currentAuction.currentBid,
    highestBidder: snapshot.currentAuction.highestBidder,
    bidHistory: snapshot.currentAuction.bidHistory,
  });
};

const emitTimer = async (io, serverId, value) => {
  io.to(serverId).emit('timerUpdate', { serverId, timer: value });
  await ServerModel.updateOne(
    { serverId },
    { 'currentAuction.timer': value },
    { new: false }
  ).catch(() => {});
};

const startTimerLoop = (io, serverId) => {
  clearTimer(serverId);
  const state = { remaining: TIMER_DURATION, interval: null };
  state.interval = setInterval(async () => {
    state.remaining -= 1;
    await emitTimer(io, serverId, Math.max(state.remaining, 0));
    if (state.remaining <= 0) {
      clearTimer(serverId);
      const result = await settleCurrentPlayer(serverId).catch((error) => {
        io.to(serverId).emit('serverError', { message: error.message });
        return null;
      });
      if (!result) return;
      broadcastSnapshot(io, serverId, result.server);
      const snapshot = serialize(result.server);
      io.to(serverId).emit('auctionEnded', {
        resolution: result.resolution,
        currentAuction: snapshot.currentAuction,
      });
    }
  }, 1000);
  auctionTimers.set(serverId, state);
  emitTimer(io, serverId, state.remaining);
};

const resetTimer = async (io, serverId) => {
  const entry = auctionTimers.get(serverId);
  if (!entry) return;
  entry.remaining = TIMER_DURATION;
  await emitTimer(io, serverId, entry.remaining);
};

const userInServer = (serverId, socketId) => {
  const room = connectedUsers.get(serverId);
  if (!room) return false;
  return room.has(socketId);
};

const getConnectedUser = (serverId, socketId) => {
  const room = connectedUsers.get(serverId);
  if (!room) return null;
  return room.get(socketId) ?? null;
};

export const initAuctionSocket = (io) => {
  io.on('connection', (socket) => {
    const handleJoin = async ({ serverId, user }) => {
      try {
        const server = await getServerById(serverId);
        if (!server) {
          return socket.emit('serverError', { message: 'Server not found' });
        }
        socket.join(serverId);
        ensureServerRoom(serverId);
        connectedUsers.get(serverId).set(socket.id, user);
        broadcastSnapshot(io, serverId, server);
      } catch (error) {
        socket.emit('serverError', { message: error.message });
      }
    };

    socket.on('join_server', handleJoin);
    socket.on('joinServer', handleJoin);
    socket.on('rejoinRoom', handleJoin);

    socket.on('initAuction', async ({ serverId, playerId, basePrice }) => {
      try {
        if (!userInServer(serverId, socket.id)) {
          return socket.emit('serverError', { message: 'Join server first' });
        }
        const user = getConnectedUser(serverId, socket.id);
        if (user?.role !== 'host') {
          return socket.emit('serverError', { message: 'Only the auctioneer can start a player' });
        }
        const { server } = await selectAuctionPlayer({ serverId, playerId, basePrice });
        broadcastSnapshot(io, serverId, server);
        const snapshot = serialize(server);
        io.to(serverId).emit('auctionStarted', snapshot.currentAuction);
        startTimerLoop(io, serverId);
      } catch (error) {
        socket.emit('serverError', { message: error.message });
      }
    });

    socket.on('placeBid', async ({ serverId, teamId, amount }) => {
      try {
        if (!userInServer(serverId, socket.id)) {
          return socket.emit('serverError', { message: 'Join server first' });
        }
        const server = await applyBid({ serverId, teamId, amount });
        emitBidUpdate(io, serverId, server);
        broadcastSnapshot(io, serverId, server);
        await resetTimer(io, serverId);
      } catch (error) {
        socket.emit('serverError', { message: error.message });
      }
    });

    socket.on('disconnect', () => {
      connectedUsers.forEach((room, serverId) => {
        if (room.has(socket.id)) {
          room.delete(socket.id);
          if (!room.size) {
            clearTimer(serverId);
          }
        }
      });
    });
  });
};
