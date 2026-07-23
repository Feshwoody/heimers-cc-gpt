export type MemberRole = "support" | "heimer" | "spectator";
export type SessionMember = { memberId: string; displayName: string; role: MemberRole; onlineAt: string; connector?: boolean };
export type DuoCall = { id: string; text: string; source: string; sourceMemberId: string; timestamp: number; acknowledgedBy: string[] };
export type SharedTimer = { id: string; targetTimestamp: number | null; pausedRemaining: number; running: boolean; updatedAt: number; sourceMemberId: string };
export type NormalizedGameData = {
  gameId: string; gameTime: number; gameMode: string; mapName: string; updatedAt: string;
  status?: "active" | "ended";
  activePlayer: { summonerName: string; championName: string; level: number; team: string };
  players: Array<{ summonerName: string; championName: string; team: string; isActivePlayer: boolean; summonerSpells: { spell1: string; spell2: string }; keystone: string; runes: string[]; level: number; items: Array<string | { id: number; name: string }> }>;
  events: Array<{ name: string; time: number; killerName?: string; id?: string }>;
};
export type MissionEngineShared = {
  gameId: string;
  overrides?: Record<string, { mode: "auto"|"manual"|"taken"|"irrelevant"; targetTime?: number; updatedAt: number }>;
  firedWarnings?: string[];
  activeMissionId?: string;
  objectiveTargets?: Partial<Record<"dragon"|"grubs"|"herald"|"baron", number>>;
  objectiveKills?: Array<{ objective: string; eventId: string; killTime: number; respawnTime?: number }>;
};
export type MatchPhase = "waiting" | "active" | "stale" | "ended";
export type ConnectorStatus = "offline" | "waiting" | "online" | "stale";
export type AuthoritativeMatchState = {
  gameId: string | null;
  gameTime: number | null;
  phase: MatchPhase;
  connectorStatus: ConnectorStatus;
  updatedAt: string | null;
  liveMatchData: NormalizedGameData | null;
};
export type MatchStateSource = "persisted" | "broadcast" | "reconnect";
export type SharedState = { updatedAt: number; sourceMemberId: string; call?: DuoCall; timers?: SharedTimer[]; phase?: string; mode?: string; winCondition?: string; checks?: Record<string, boolean>; matchStartedAt?: number | null; botlaneEnemy?: string[]; missionEngine?: MissionEngineShared; matchState?: AuthoritativeMatchState };
