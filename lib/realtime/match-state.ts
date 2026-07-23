import type { AuthoritativeMatchState, NormalizedGameData } from "./types";

export const waitingMatchState = (): AuthoritativeMatchState => ({
  gameId: null,
  gameTime: null,
  phase: "waiting",
  connectorStatus: "waiting",
  updatedAt: null,
  liveMatchData: null,
});

export function activeMatchState(game: NormalizedGameData): AuthoritativeMatchState {
  return {
    gameId: game.gameId,
    gameTime: game.gameTime,
    phase: "active",
    connectorStatus: "online",
    updatedAt: game.updatedAt,
    liveMatchData: game,
  };
}

export function endedMatchState(previous: AuthoritativeMatchState | undefined, updatedAt: string): AuthoritativeMatchState {
  return {
    gameId: previous?.gameId ?? null,
    gameTime: previous?.gameTime ?? null,
    phase: "ended",
    connectorStatus: "offline",
    updatedAt,
    liveMatchData: previous?.liveMatchData ? { ...previous.liveMatchData, status: "ended", updatedAt } as NormalizedGameData : null,
  };
}

export function effectiveMatchState(state: AuthoritativeMatchState | undefined, now = Date.now()): AuthoritativeMatchState {
  if (!state) return waitingMatchState();
  if (state.phase === "active" && state.updatedAt && now - new Date(state.updatedAt).getTime() > 10_000) {
    return { ...state, phase: "stale", connectorStatus: "stale" };
  }
  return state;
}

export const companionIsLive = (state: AuthoritativeMatchState | undefined) => Boolean(
  state?.gameId
  && Number.isFinite(state.gameTime)
  && (state.phase === "active" || state.phase === "stale"),
);

export const gameFromMatchState = (state: AuthoritativeMatchState | undefined): NormalizedGameData | undefined => {
  if (!state?.liveMatchData) return undefined;
  return state.phase === "ended"
    ? { ...state.liveMatchData, status: "ended" } as NormalizedGameData
    : state.liveMatchData;
};

export const changedGame = (previous: AuthoritativeMatchState | undefined, next: AuthoritativeMatchState | undefined) =>
  Boolean(previous?.gameId && next?.gameId && previous.gameId !== next.gameId);
