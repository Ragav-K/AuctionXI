import type { AuctionPoolValidation, Player, ServerState } from '../types/auction';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

type HttpMethod = 'GET' | 'POST';

interface RequestOptions {
  method?: HttpMethod;
  body?: Record<string, unknown>;
}

export const warmupServer = async () => {
  await fetch(`${API_BASE}/ping`, {
    method: 'GET',
    keepalive: true,
  }).catch(() => undefined);
};

const request = async <T>(path: string, options: RequestOptions = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Request failed');
  }

  return (await response.json()) as T;
};

export const createServerApi = (payload: Record<string, unknown>) =>
  request<ServerState>('/api/server/create', { method: 'POST', body: payload });

export const joinServerApi = (payload: Record<string, unknown>) =>
  request<ServerState>('/api/server/join', { method: 'POST', body: payload });

export const fetchServerApi = (serverId: string) =>
  request<ServerState>(`/api/server/${serverId}`);

export const startServerAuctionApi = (serverId: string) =>
  request<ServerState>('/api/server/start', { method: 'POST', body: { serverId } });

export const placeBidApi = (payload: Record<string, unknown>) =>
  request<ServerState>('/api/server/bid', { method: 'POST', body: payload });

export const fetchPlayersByCategory = (serverId: string, category: string, options?: { status?: 'available' | 'all' }) => {
  const params = new URLSearchParams();
  if (category) {
    params.set('category', category);
  }
  if (options?.status === 'available') {
    params.set('status', 'available');
  }
  const query = params.toString();
  const suffix = query ? `?${query}` : '';
  return request<Player[]>(`/api/server/${serverId}/players${suffix}`);
};

interface AuctionRulePayload {
  teams: number;
  playersPerTeam: number;
  maxForeignPlayers: number;
  roleRules: {
    batsmen: number;
    bowlers: number;
    allRounders: number;
  };
}

export const validateAuctionRulesApi = (payload: AuctionRulePayload) => {
  const params = new URLSearchParams();
  params.set('teams', String(payload.teams));
  params.set('playersPerTeam', String(payload.playersPerTeam));
  params.set('maxForeignPlayers', String(payload.maxForeignPlayers));
  params.set('batsmen', String(payload.roleRules.batsmen));
  params.set('bowlers', String(payload.roleRules.bowlers));
  params.set('allRounders', String(payload.roleRules.allRounders));
  return request<AuctionPoolValidation>(`/api/auction/players?${params.toString()}`);
};
