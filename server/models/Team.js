import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const playerSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => uuidv4(),
    },
    name: String,
    role: String,
    category: {
      type: String,
      enum: ['Platinum', 'Gold', 'Silver', 'Bronze'],
      default: 'Bronze',
    },
    image: String,
    basePrice: {
      type: Number,
      default: 1,
    },
    points: Number,
    description: String,
    stats: {
      matches: Number,
      runs: Number,
      wickets: Number,
      strikeRate: Number,
      average: Number,
    },
    currentTeam: String,
    soldPrice: Number,
    soldTo: {
      id: String,
      name: String,
      color: String,
    },
    status: {
      type: String,
      enum: ['available', 'sold', 'unsold'],
      default: 'available',
    },
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => uuidv4(),
    },
    name: { type: String, required: true },
    owner: { type: String, required: true },
    color: { type: String, required: true },
    budget: { type: Number, required: true },
    isHost: { type: Boolean, default: false },
    players: { type: [playerSchema], default: [] },
  },
  { _id: false }
);

export { teamSchema, playerSchema };
