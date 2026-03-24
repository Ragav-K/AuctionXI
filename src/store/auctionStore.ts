import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  AuctionResolution,
  AuctionSettings,
  AuctionStatus,
  AuctionBid,
  CurrentAuction,
  Player,
  ServerState,
  Team,
  UserProfile,
  AuctionRules,
  RoleRules,
} from '../types/auction';

const defaultSettings: AuctionSettings = {
  serverName: '',
  serverPassword: '',
  totalBudget: 0,
  maxTeams: 0,
  maxPlayers: 0,
  playersPerTeam: 0,
  maxForeign: 0,
  maxForeignPlayers: 0,
  rosterRequirements: {
    batsmen: 0,
    bowlers: 0,
    allRounders: 0,
  },
  roleRules: {
    batsmen: 0,
    bowlers: 0,
    allRounders: 0,
  },
  autoUnsoldTimer: true,
  publicServer: false,
  teamCount: 0,
  budget: 0,
};

const DEFAULT_TIMER = 30;

const defaultAuctionFields = {
  currentPlayer: null as Player | null,
  basePrice: 0,
  currentBid: 0,
  highestBidder: null as Team | null,
  timer: DEFAULT_TIMER,
  bidHistory: [] as AuctionBid[],
  auctionStatus: 'idle' as AuctionStatus,
};

const fallbackId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const normalizeTeam = (team: Team | (Team & { _id?: string })) => ({
  ...team,
  id: team.id || (team as any)._id || fallbackId(),
  owner: team.owner || 'Host',
  players: team.players ?? [],
});

const normalizePlayer = (player: Player | (Player & { _id?: string })) => ({
  ...player,
  id: player.id || (player as any)._id || fallbackId(),
  name: player.name || 'No player selected',
  image: player.image || '',
  category: player.category || 'Bronze',
  role: player.role || 'Batsman',
  basePrice: player.basePrice ?? 0,
  stats: {
    matches: player.stats?.matches ?? 0,
    runs: player.stats?.runs ?? 0,
    wickets: player.stats?.wickets ?? 0,
    strikeRate: player.stats?.strikeRate ?? 0,
    average: player.stats?.average ?? 0,
  },
});

const mapAuctionFields = (auction?: CurrentAuction | null) => ({
  currentPlayer: auction?.currentPlayer ? normalizePlayer(auction.currentPlayer) : null,
  basePrice: auction?.basePrice ?? auction?.currentPlayer?.basePrice ?? 0,
  currentBid: auction?.currentBid ?? 0,
  highestBidder: auction?.highestBidder ? normalizeTeam(auction.highestBidder) : null,
  timer: auction?.timer ?? DEFAULT_TIMER,
  bidHistory: auction?.bidHistory ?? [],
  auctionStatus: auction?.auctionStatus ?? 'idle',
});

const mergeRoleRules = (primary?: Partial<RoleRules>, fallback?: Partial<RoleRules>): RoleRules => ({
  batsmen: primary?.batsmen ?? fallback?.batsmen ?? 0,
  bowlers: primary?.bowlers ?? fallback?.bowlers ?? 0,
  allRounders: primary?.allRounders ?? fallback?.allRounders ?? 0,
});

const mapServerToState = (server: ServerState) => {
  const settings = server.auctionSettings ?? defaultSettings;
  const auctionRules = server.auctionRules;
  const normalizedRoleRules = mergeRoleRules(
    auctionRules?.roleRules ?? settings.roleRules,
    settings.rosterRequirements
  );
  const playersPerTeam =
    auctionRules?.playersPerTeam ??
    settings.playersPerTeam ??
    settings.maxPlayers ??
    defaultSettings.playersPerTeam;
  const maxPlayers = settings.maxPlayers || playersPerTeam || defaultSettings.maxPlayers;
  const maxForeignPlayers =
    auctionRules?.maxForeignPlayers ??
    settings.maxForeignPlayers ??
    settings.maxForeign ??
    defaultSettings.maxForeignPlayers;

  const normalizedSettings: AuctionSettings = {
    ...defaultSettings,
    ...settings,
    maxPlayers,
    playersPerTeam,
    maxForeignPlayers,
    rosterRequirements: normalizedRoleRules,
    roleRules: normalizedRoleRules,
    maxForeign: settings.maxForeign ?? maxForeignPlayers,
    teamCount:
      settings.teamCount ??
      settings.maxTeams ??
      auctionRules?.teams ??
      defaultSettings.teamCount,
    budget: settings.budget ?? settings.totalBudget ?? defaultSettings.budget,
  };

  return {
    serverId: server.serverId,
    status: server.status,
    auctionSettings: normalizedSettings,
    auctionRules: auctionRules ?? null,
    teams: (server.teams ?? []).map(normalizeTeam),
    playerPool: (server.playerPool ?? server.auctionPool ?? []).map(normalizePlayer),
    ...mapAuctionFields(server.currentAuction),
  };
};

interface AuctionStore {
  serverId: string | null;
  roomId: string | null;
  status: 'idle' | 'waiting' | 'live' | 'finished';
  auctionSettings: AuctionSettings;
  auctionRules: AuctionRules | null;
  teams: Team[];
  playerPool: Player[];
  currentPlayer: Player | null;
  basePrice: number;
  currentBid: number;
  highestBidder: Team | null;
  timer: number;
  bidHistory: AuctionBid[];
  auctionStatus: AuctionStatus;
  lastResolution: AuctionResolution | null;
  user: UserProfile | null;
  socketConnected: boolean;
  hydrateFromServer: (server: ServerState) => void;
  handleServerUpdate: (server: ServerState) => void;
  handleBidUpdate: (payload: {
    currentBid: number;
    highestBidder: Team | null;
    bidHistory: AuctionBid[];
  }) => void;
  handleAuctionUpdate: (auction: CurrentAuction) => void;
  handleTimerUpdate: (timer: number) => void;
  handleAuctionEnded: (payload: { currentAuction: CurrentAuction | null; resolution?: AuctionResolution | null }) => void;
  setUserProfile: (user: UserProfile) => void;
  setSocketConnected: (connected: boolean) => void;
  clearState: () => void;
}

export const useAuctionStore = create<AuctionStore>()(
  persist(
    (set) => ({
      serverId: null,
      roomId: null,
      status: 'idle',
      auctionSettings: defaultSettings,
      auctionRules: null,
      teams: [],
      playerPool: [],
      ...defaultAuctionFields,
      lastResolution: null,
      user: null,
      socketConnected: false,

      hydrateFromServer: (server) =>
        set(() => ({
          roomId: server.serverId,
          ...mapServerToState(server),
        })),

      handleServerUpdate: (server) =>
        set((state) => {
          if (!server) return state;
          const mapped = mapServerToState(server);
          return {
            ...state,
            roomId: server.serverId,
            ...mapped,
          };
        }),

      handleBidUpdate: ({ currentBid, highestBidder, bidHistory }) =>
        set(() => ({
          currentBid,
          highestBidder: highestBidder ? normalizeTeam(highestBidder) : null,
          bidHistory,
        })),

      handleAuctionUpdate: (auction) =>
        set(() => ({
          ...mapAuctionFields(auction),
          lastResolution: null,
        })),

      handleTimerUpdate: (timer) =>
        set(() => ({
          timer,
        })),

      handleAuctionEnded: ({ currentAuction, resolution }) =>
        set(() => ({
          ...mapAuctionFields(currentAuction),
          lastResolution: resolution ?? null,
        })),

      setUserProfile: (user) =>
        set(() => ({
          user,
        })),

      setSocketConnected: (connected) =>
        set(() => ({
          socketConnected: connected,
        })),

      clearState: () =>
        set(() => ({
          serverId: null,
          roomId: null,
          status: 'idle',
          auctionSettings: defaultSettings,
          auctionRules: null,
          teams: [],
          playerPool: [],
          ...defaultAuctionFields,
          lastResolution: null,
          user: null,
          socketConnected: false,
        })),
    }),
    {
      name: 'auctionxi-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        serverId: state.serverId,
        roomId: state.roomId,
        status: state.status,
        auctionSettings: state.auctionSettings,
        auctionRules: state.auctionRules,
        teams: state.teams,
        playerPool: state.playerPool,
        currentPlayer: state.currentPlayer,
        basePrice: state.basePrice,
        currentBid: state.currentBid,
        highestBidder: state.highestBidder,
        timer: state.timer,
        bidHistory: state.bidHistory,
        auctionStatus: state.auctionStatus,
        lastResolution: state.lastResolution,
        user: state.user,
      }),
    }
  )
);
