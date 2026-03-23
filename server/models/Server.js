import mongoose from 'mongoose';
import { teamSchema, playerSchema } from './Team.js';

const roleRuleSchema = new mongoose.Schema(
  {
    batsmen: {
      type: Number,
      default: 0,
    },
    bowlers: {
      type: Number,
      default: 0,
    },
    allRounders: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const auctionRulesSchema = new mongoose.Schema(
  {
    teams: Number,
    playersPerTeam: Number,
    maxForeignPlayers: Number,
    roleRules: roleRuleSchema,
  },
  { _id: false }
);

const auctionSettingsSchema = new mongoose.Schema(
  {
    teamCount: Number,
    budget: Number,
    maxPlayers: Number,
    playersPerTeam: Number,
    serverName: String,
    serverPassword: String,
    totalBudget: Number,
    maxTeams: Number,
    maxForeign: Number,
    maxForeignPlayers: Number,
    roleRules: roleRuleSchema,
    rosterRequirements: roleRuleSchema,
    autoUnsoldTimer: Boolean,
    publicServer: Boolean,
  },
  { _id: false }
);

const bidEntrySchema = new mongoose.Schema(
  {
    teamId: String,
    teamName: String,
    amount: Number,
    timestamp: {
      type: Date,
      default: () => new Date(),
    },
  },
  { _id: false }
);

const currentAuctionSchema = new mongoose.Schema(
  {
    currentPlayer: playerSchema,
    currentBid: {
      type: Number,
      default: 0,
    },
    basePrice: {
      type: Number,
      default: 0,
    },
    highestBidder: {
      type: teamSchema,
    },
    timer: {
      type: Number,
      default: 30,
    },
    bidHistory: {
      type: [bidEntrySchema],
      default: [],
    },
    auctionStatus: {
      type: String,
      enum: ['idle', 'running', 'ended'],
      default: 'idle',
    },
  },
  { _id: false }
);

const serverSchema = new mongoose.Schema(
  {
    serverId: { type: String, unique: true },
    hostId: { type: String, required: true },
    status: {
      type: String,
      enum: ['waiting', 'live', 'finished'],
      default: 'waiting',
    },
    auctionSettings: auctionSettingsSchema,
    teams: { type: [teamSchema], default: [] },
    playerPool: { type: [playerSchema], default: [] },
    currentAuction: currentAuctionSchema,
  },
  { timestamps: true }
);

serverSchema.add({
  auctionRules: { type: auctionRulesSchema, default: null },
  auctionPool: { type: [playerSchema], default: [] },
  soldPlayers: { type: [playerSchema], default: [] },
});

export const ServerModel = mongoose.model('Server', serverSchema);
