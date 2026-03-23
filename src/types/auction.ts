export type Screen = 'home' | 'create' | 'join' | 'lobby' | 'auction';

export interface Team {
  id: string;
  name: string;
  owner: string;
  color: string;
  budget: number;
  players: Player[];
  isHost?: boolean;
}

export type PlayerRole = 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicketkeeper';
export type PlayerCategory = 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
export type AuctionStatus = 'idle' | 'running' | 'ended';

export interface Player {
  id?: string;
  name: string;
  role: PlayerRole;
  category: PlayerCategory;
  basePrice: number;
  currentTeam?: string;
  points?: number;
  stats: {
    matches: number;
    runs?: number;
    wickets?: number;
    strikeRate: number;
    average?: number;
  };
  image: string;
  description?: string;
  status?: 'available' | 'sold' | 'unsold';
  soldPrice?: number | null;
  soldTo?: {
    id: string;
    name: string;
    color?: string;
  } | null;
}

export interface RoleRules {
  batsmen: number;
  bowlers: number;
  allRounders: number;
}

export interface AuctionRules {
  teams: number;
  playersPerTeam: number;
  maxForeignPlayers: number;
  roleRules: RoleRules;
}

export interface AuctionSettings {
  serverName: string;
  serverPassword: string;
  totalBudget: number;
  maxTeams: number;
  maxPlayers: number;
  playersPerTeam: number;
  maxForeign: number;
  maxForeignPlayers: number;
  rosterRequirements: RoleRules;
  roleRules?: RoleRules;
  autoUnsoldTimer: boolean;
  publicServer: boolean;
  teamCount?: number;
  budget?: number;
}

export interface UserProfile {
  name: string;
  teamName: string;
  color: string;
  teamId?: string;
  role: 'host' | 'participant';
}

export interface AuctionBid {
  id: string;
  teamName: string;
  amount: number;
  timestamp: number | string;
}

export interface CurrentAuction {
  currentPlayer: Player | null;
  currentBid: number;
  basePrice: number;
  highestBidder: Team | null;
  timer: number;
  bidHistory: AuctionBid[];
  auctionStatus: AuctionStatus;
}

export interface AuctionPoolGrouping {
  Platinum: Player[];
  Gold: Player[];
  Silver: Player[];
  Bronze: Player[];
}

export interface AuctionPoolValidation {
  requiredPlayers: number;
  grouped: AuctionPoolGrouping;
  totals: {
    requested: number;
    available: number;
    buffer: number;
  };
  roleAvailability: Record<string, number>;
}

export interface ServerState {
  serverId: string;
  hostId: string;
  status: 'waiting' | 'live' | 'finished';
  auctionSettings: AuctionSettings;
  auctionRules?: AuctionRules;
  teams: Team[];
  playerPool: Player[];
  auctionPool?: Player[];
  soldPlayers?: Player[];
  currentAuction: CurrentAuction;
}

export interface AuctionResolution {
  player: Player;
  winner: Team | null;
  amount: number | null;
  status: Player['status'];
}
