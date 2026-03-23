import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { ServerModel } from '../models/Server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const playerDatasetPath = path.join(__dirname, '..', 'data', 'players.json');

const DEFAULT_TIMER_DURATION = 30;
const MINIMUM_POOL_BUFFER = 10;

const ROLE_LABEL_MAP = {
  batsmen: 'Batsman',
  bowlers: 'Bowler',
  allRounders: 'All-rounder',
};

let cachedPlayers = null;

const loadPlayers = async () => {
  if (cachedPlayers) return cachedPlayers;
  const file = await fs.readFile(playerDatasetPath, 'utf-8');
  cachedPlayers = JSON.parse(file);
  return cachedPlayers;
};

const shuffle = (arr) => {
  const clone = [...arr];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
};

const categorizePlayer = (points = 0) => {
  if (points >= 90) return 'Platinum';
  if (points >= 80) return 'Gold';
  if (points >= 70) return 'Silver';
  return 'Bronze';
};

const buildPlayerPool = (rawPlayers = []) =>
  rawPlayers.map((player) => ({
    ...player,
    id: player.id ?? uuidv4(),
    category: player.category ?? categorizePlayer(player.points ?? 0),
    status: 'available',
  }));

const serializeServer = (serverDoc) => serverDoc.toObject({ getters: true, virtuals: true });

const buildEmptyAuctionState = () => ({
  currentPlayer: null,
  currentBid: 0,
  basePrice: 0,
  highestBidder: null,
  timer: 0,
  bidHistory: [],
  auctionStatus: 'idle',
});

const buildAuctionStateForPlayer = (player, basePrice) => ({
  currentPlayer: { ...player, basePrice },
  currentBid: basePrice,
  basePrice,
  highestBidder: null,
  timer: DEFAULT_TIMER_DURATION,
  bidHistory: [],
  auctionStatus: 'running',
});

const normalizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeRoleRules = (roleRules = {}) => ({
  batsmen: normalizeNumber(roleRules.batsmen ?? roleRules.Batsmen ?? 0),
  bowlers: normalizeNumber(roleRules.bowlers ?? roleRules.Bowlers ?? 0),
  allRounders: normalizeNumber(
    roleRules.allRounders ?? roleRules.allrounders ?? roleRules.AllRounders ?? 0
  ),
});

const formatRoleRulesForSchema = (roleRules) => ({
  batsmen: roleRules.batsmen,
  bowlers: roleRules.bowlers,
  allRounders: roleRules.allRounders,
});

const normalizeAuctionRules = (input = {}) => ({
  teams: normalizeNumber(input.teams ?? input.teamCount ?? input.maxTeams ?? 0),
  playersPerTeam: normalizeNumber(input.playersPerTeam ?? input.maxPlayers ?? 0),
  maxForeignPlayers: normalizeNumber(input.maxForeignPlayers ?? input.maxForeign ?? 0),
  roleRules: normalizeRoleRules(input.roleRules ?? input.rosterRequirements ?? {}),
});

const mapSchemaRoleRules = (roleRules = {}) => ({
  batsmen: normalizeNumber(roleRules.batsmen ?? roleRules.Batsmen ?? 0),
  bowlers: normalizeNumber(roleRules.bowlers ?? roleRules.Bowlers ?? 0),
  allRounders: normalizeNumber(roleRules.allRounders ?? roleRules.allrounders ?? 0),
});

const computeMinimumPlayers = (teams, playersPerTeam) => teams * playersPerTeam + MINIMUM_POOL_BUFFER;

const validateRoleDistribution = (roleRules, playersPerTeam) => {
  ['batsmen', 'bowlers', 'allRounders'].forEach((key) => {
    if ((roleRules[key] ?? 0) < 0) {
      throw new Error('Role counts cannot be negative');
    }
  });
  const totalRoleSlots =
    (roleRules.batsmen ?? 0) + (roleRules.bowlers ?? 0) + (roleRules.allRounders ?? 0);
  if (totalRoleSlots !== playersPerTeam) {
    throw new Error('Role distribution must equal total players per team');
  }
};

const validateForeignLimit = (foreignPlayers, playersPerTeam) => {
  if (foreignPlayers >= playersPerTeam) {
    throw new Error('Foreign players must be less than total players');
  }
};

const normalizeRoleLabel = (role = '') => role.trim().toLowerCase();

const countRoleAvailability = (players) =>
  Object.entries(ROLE_LABEL_MAP).reduce((counts, [ruleKey, label]) => {
    counts[ruleKey] = players.filter(
      (player) => normalizeRoleLabel(player.role) === label.toLowerCase()
    ).length;
    return counts;
  }, {});

const ensureRoleSupply = (players, teams, roleRules) => {
  const availability = countRoleAvailability(players);
  Object.entries(ROLE_LABEL_MAP).forEach(([ruleKey, label]) => {
    const required = teams * (roleRules[ruleKey] ?? 0);
    const available = availability[ruleKey] ?? 0;
    if (available < required) {
      throw new Error(
        `Not enough ${label} players in dataset. Required ${required}, found ${available}.`
      );
    }
  });
};

const groupPlayersByCategory = (players) => {
  const grouped = {
    Platinum: [],
    Gold: [],
    Silver: [],
    Bronze: [],
  };
  players.forEach((player) => {
    const bucket = grouped[player.category] ?? grouped.Bronze;
    bucket.push(player);
  });
  return grouped;
};

const buildAuctionPool = async (rules) => {
  const { teams, playersPerTeam, roleRules } = rules;
  if (!teams || teams <= 0) {
    throw new Error('Number of teams must be greater than zero');
  }
  if (!playersPerTeam || playersPerTeam <= 0) {
    throw new Error('Players per team must be greater than zero');
  }
  validateRoleDistribution(roleRules, playersPerTeam);
  validateForeignLimit(rules.maxForeignPlayers ?? 0, playersPerTeam);

  const allPlayers = buildPlayerPool(await loadPlayers());
  if (allPlayers.length < computeMinimumPlayers(teams, playersPerTeam)) {
    throw new Error('Not enough players in dataset');
  }
  ensureRoleSupply(allPlayers, teams, roleRules);

  const requiredPlayers = computeMinimumPlayers(teams, playersPerTeam);
  const prioritized = [];
  const used = new Set();

  Object.entries(ROLE_LABEL_MAP).forEach(([ruleKey, label]) => {
    const needed = teams * (roleRules[ruleKey] ?? 0);
    if (!needed) return;
    const pool = shuffle(
      allPlayers.filter((player) => normalizeRoleLabel(player.role) === label.toLowerCase())
    );
    let allocated = 0;
    for (const player of pool) {
      if (allocated >= needed) break;
      if (used.has(player.id)) continue;
      prioritized.push(player);
      used.add(player.id);
      allocated += 1;
    }
    if (allocated < needed) {
      throw new Error(`Unable to allocate enough ${label} players from dataset`);
    }
  });

  const remaining = shuffle(allPlayers).filter((player) => !used.has(player.id));
  const selected = [...prioritized];
  for (const player of remaining) {
    if (selected.length >= requiredPlayers) break;
    selected.push(player);
    used.add(player.id);
  }

  if (selected.length < requiredPlayers) {
    throw new Error('Unable to generate complete auction pool from dataset');
  }

  return {
    requiredPlayers,
    pool: selected,
    grouped: groupPlayersByCategory(selected),
    roleAvailability: countRoleAvailability(allPlayers),
  };
};

export const getServerById = async (serverId) => {
  const server = await ServerModel.findOne({ serverId });
  return server;
};

export const createServer = async (req, res, next) => {
  try {
    const { hostName, teamName, color, auctionSettings } = req.body;
    if (!auctionSettings) {
      return res.status(400).json({ message: 'Missing auction settings' });
    }

    const normalizedRules = normalizeAuctionRules({
      ...auctionSettings,
      ...(req.body.auctionRules ?? {}),
    });

    const poolSummary = await buildAuctionPool(normalizedRules);

    const normalizedSettings = {
      ...auctionSettings,
      teamCount:
        normalizedRules.teams ??
        auctionSettings.teamCount ??
        auctionSettings.maxTeams ??
        8,
      maxTeams:
        normalizedRules.teams ??
        auctionSettings.maxTeams ??
        auctionSettings.teamCount ??
        8,
      budget: auctionSettings.budget ?? auctionSettings.totalBudget ?? 100,
      totalBudget: auctionSettings.totalBudget ?? auctionSettings.budget ?? 100,
      maxPlayers:
        normalizedRules.playersPerTeam ?? auctionSettings.maxPlayers ?? 18,
      playersPerTeam:
        normalizedRules.playersPerTeam ??
        auctionSettings.playersPerTeam ??
        auctionSettings.maxPlayers ??
        0,
      maxForeign:
        normalizedRules.maxForeignPlayers ?? auctionSettings.maxForeign ?? 0,
      maxForeignPlayers:
        normalizedRules.maxForeignPlayers ??
        auctionSettings.maxForeignPlayers ??
        auctionSettings.maxForeign ??
        0,
      rosterRequirements: formatRoleRulesForSchema(normalizedRules.roleRules),
      roleRules: formatRoleRulesForSchema(normalizedRules.roleRules),
    };

    const persistedAuctionRules = {
      teams: normalizedSettings.teamCount,
      playersPerTeam: normalizedSettings.playersPerTeam,
      maxForeignPlayers: normalizedSettings.maxForeignPlayers,
      roleRules: formatRoleRulesForSchema(normalizedRules.roleRules),
    };

    const serverId = uuidv4().slice(0, 6).toUpperCase();
    const hostId = uuidv4();
    const teams = [];

    if (hostName && teamName && color) {
      teams.push({
        name: teamName,
        owner: hostName,
        color,
        budget: normalizedSettings.budget,
        isHost: true,
        players: [],
        id: hostId,
      });
    }

    const server = await ServerModel.create({
      serverId,
      hostId,
      auctionSettings: normalizedSettings,
      auctionRules: persistedAuctionRules,
      teams,
      playerPool: poolSummary.pool,
      auctionPool: poolSummary.pool,
      soldPlayers: [],
      status: 'waiting',
      currentAuction: buildEmptyAuctionState(),
    });

    return res.status(201).json(serializeServer(server));
  } catch (error) {
    return next(error);
  }
};

export const joinServer = async (req, res, next) => {
  try {
    const { serverId, ownerName, teamName, color, serverPassword } = req.body;
    if (!serverId || !ownerName || !teamName || !color) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const server = await ServerModel.findOne({ serverId });
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    if (server.status !== 'waiting') {
      return res.status(400).json({ message: 'Auction already started' });
    }

    if (
      server.auctionSettings.serverPassword &&
      server.auctionSettings.serverPassword !== serverPassword
    ) {
      return res.status(403).json({ message: 'Invalid server password' });
    }

    const maxTeams =
      server.auctionRules?.teams ??
      server.auctionSettings.teamCount ??
      server.auctionSettings.maxTeams ??
      8;

    if (server.teams.length >= maxTeams) {
      return res.status(400).json({ message: 'Team limit reached' });
    }

    const duplicateTeam = server.teams.some(
      (team) => team.name.toLowerCase() === teamName.toLowerCase()
    );
    const duplicateColor = server.teams.some(
      (team) => team.color.toLowerCase() === color.toLowerCase()
    );

    if (duplicateTeam) {
      return res.status(409).json({ message: 'Team name already taken' });
    }
    if (duplicateColor) {
      return res.status(409).json({ message: 'Color already taken' });
    }

    const teamId = uuidv4();
    server.teams.push({
      name: teamName,
      owner: ownerName,
      color,
      budget: server.auctionSettings.budget,
      isHost: false,
      players: [],
      id: teamId,
    });
    await server.save();

    return res.status(200).json(serializeServer(server));
  } catch (error) {
    return next(error);
  }
};

export const getServerState = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const server = await ServerModel.findOne({ serverId });
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }
    return res.status(200).json(serializeServer(server));
  } catch (error) {
    return next(error);
  }
};

export const startAuction = async (req, res, next) => {
  try {
    const { serverId } = req.body;
    const server = await beginAuction(serverId);
    return res.status(200).json(serializeServer(server));
  } catch (error) {
    return next(error);
  }
};

const validateBid = (server, teamId, amount) => {
  if (!server.currentAuction?.currentPlayer) {
    throw new Error('No active player');
  }
  if (server.status !== 'live') {
    throw new Error('Auction is not live');
  }
  if (server.currentAuction.auctionStatus !== 'running') {
    throw new Error('Auction round is not active');
  }
  const team = server.teams.find((teamEntry) => teamEntry.id === teamId);
  if (!team) {
    throw new Error('Team not found');
  }
  const minBid = Math.max(
    server.currentAuction.currentBid || 0,
    server.currentAuction.currentPlayer.basePrice || 0
  );
  if (amount <= minBid) {
    throw new Error('Bid must be higher than current bid');
  }
  if (team.budget < amount) {
    throw new Error('Insufficient budget');
  }
  return team;
};

export const applyBid = async ({ serverId, teamId, amount }) => {
  const server = await ServerModel.findOne({ serverId });
  if (!server) {
    throw new Error('Server not found');
  }
  const bidder = validateBid(server, teamId, amount);
  server.currentAuction.currentBid = amount;
  server.currentAuction.highestBidder = bidder;
  server.currentAuction.timer = DEFAULT_TIMER_DURATION;
  server.currentAuction.auctionStatus = 'running';
  server.currentAuction.bidHistory.unshift({
    id: uuidv4(),
    teamId,
    teamName: bidder.name,
    amount,
    timestamp: new Date(),
  });
  server.currentAuction.bidHistory = server.currentAuction.bidHistory.slice(0, 10);
  await server.save();
  return server;
};

export const placeBid = async (req, res, next) => {
  try {
    const { serverId, teamId, amount } = req.body;
    const server = await applyBid({ serverId, teamId, amount });
    return res.status(200).json(serializeServer(server));
  } catch (error) {
    return next(error);
  }
};

export const settleCurrentPlayer = async (serverId) => {
  const server = await ServerModel.findOne({ serverId });
  if (!server) {
    throw new Error('Server not found');
  }

  const currentPlayer = server.currentAuction?.currentPlayer;
  if (!currentPlayer) {
    server.currentAuction = buildEmptyAuctionState();
    await server.save();
    return { server, resolution: null };
  }

  const finalBid = server.currentAuction.currentBid;
  let winner = null;
  const winningBidder = server.currentAuction.highestBidder;
  if (winningBidder) {
    const winnerId = winningBidder.id || winningBidder._id?.toString();
    winner = server.teams.find((team) => (team.id || team._id?.toString()) === winnerId);
    if (winner) {
      winner.players.push({
        ...currentPlayer,
        status: 'sold',
        soldPrice: finalBid,
      });
      winner.budget -= finalBid;
      currentPlayer.status = 'sold';
      currentPlayer.soldPrice = finalBid;
      currentPlayer.currentTeam = winner.name;
      currentPlayer.soldTo = {
        id: winner.id,
        name: winner.name,
        color: winner.color,
      };
      server.soldPlayers.push({
        ...currentPlayer,
      });
    }
  } else {
    currentPlayer.status = 'unsold';
  }

  server.playerPool = server.playerPool.map((player) =>
    player.id === currentPlayer.id ? { ...player, ...currentPlayer } : player
  );

  const hasAvailablePlayers = server.playerPool.some((player) => player.status === 'available');
  if (!hasAvailablePlayers) {
    server.status = 'finished';
  }

  server.currentAuction = {
    ...buildEmptyAuctionState(),
    auctionStatus: hasAvailablePlayers ? 'ended' : 'idle',
  };

  await server.save();
  return {
    server,
    resolution: {
      player: currentPlayer,
      winner: winner
        ? { id: winner.id, name: winner.name, color: winner.color }
        : null,
      amount: winner ? finalBid : null,
      status: currentPlayer.status,
    },
  };
};

export const beginAuction = async (serverId) => {
  const server = await ServerModel.findOne({ serverId });
  if (!server) {
    throw new Error('Server not found');
  }
  if (server.status === 'finished') {
    return server;
  }
  server.status = 'live';
  if (!server.currentAuction || server.currentAuction.currentPlayer) {
    server.currentAuction = buildEmptyAuctionState();
  } else {
    server.currentAuction.auctionStatus = 'idle';
  }
  await server.save();
  return server;
};

export const selectAuctionPlayer = async ({ serverId, playerId, basePrice }) => {
  const server = await ServerModel.findOne({ serverId });
  if (!server) {
    throw new Error('Server not found');
  }
  if (server.status === 'finished') {
    throw new Error('Auction has ended');
  }
  if (server.currentAuction?.auctionStatus === 'running') {
    throw new Error('Another auction is already running');
  }

  const playerIndex = server.playerPool.findIndex((player) => player.id === playerId);
  if (playerIndex === -1) {
    throw new Error('Player not found');
  }
  const player = server.playerPool[playerIndex];
  if (player.status !== 'available') {
    throw new Error('Player already processed');
  }

  const normalizedBasePrice = Number(basePrice);
  if (!Number.isFinite(normalizedBasePrice) || normalizedBasePrice <= 0) {
    throw new Error('Enter a valid base price');
  }

  server.status = 'live';
  server.currentAuction = buildAuctionStateForPlayer(player, normalizedBasePrice);
  await server.save();
  return { server, player };
};

export const getPlayersByCategory = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const { category, status } = req.query;
    const server = await ServerModel.findOne({ serverId });
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }
    let players = server.playerPool ?? [];
    if (category) {
      players = players.filter(
        (player) => player.category.toLowerCase() === String(category).toLowerCase()
      );
    }
    if (status === 'available') {
      players = players.filter((player) => player.status === 'available');
    }
    players = players.sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
    return res.status(200).json(players);
  } catch (error) {
    return next(error);
  }
};

export const previewAuctionPlayerPool = async (req, res) => {
  try {
    const rules = normalizeAuctionRules({
      teams: req.query.teams,
      playersPerTeam: req.query.playersPerTeam,
      maxForeignPlayers: req.query.maxForeignPlayers ?? req.query.maxForeign,
      roleRules: {
        batsmen: req.query.batsmen,
        bowlers: req.query.bowlers,
        allRounders: req.query.allrounders ?? req.query.allRounders,
      },
    });
    const result = await buildAuctionPool(rules);
    return res.status(200).json({
      requiredPlayers: result.requiredPlayers,
      grouped: result.grouped,
      totals: {
        requested: rules.teams * rules.playersPerTeam,
        available: result.pool.length,
        buffer: result.pool.length - rules.teams * rules.playersPerTeam,
      },
      roleAvailability: result.roleAvailability,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Unable to validate rules' });
  }
};
