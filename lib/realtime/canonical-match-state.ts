import { companionIsLive, effectiveMatchState } from "./match-state";
import { enemyRoster } from "./enemy-roster";
import type { AuthoritativeMatchState, MatchStateSource, SharedState } from "./types";

export type CanonicalMatchState={
  sessionCode:string;
  match:AuthoritativeMatchState;
  game:AuthoritativeMatchState["liveMatchData"];
  live:boolean;
  enemyPlayers:ReturnType<typeof enemyRoster>;
  enemyPlayerCount:number;
  source:MatchStateSource;
};

export function getCanonicalMatchState(sessionCode:string,state:SharedState|undefined,source:MatchStateSource,now=Date.now()):CanonicalMatchState{
  const match=effectiveMatchState(state?.matchState,now),game=match.liveMatchData;
  const enemyPlayers=game?enemyRoster(game):[];
  return{sessionCode,match,game,live:companionIsLive(match)&&Boolean(game),enemyPlayers,enemyPlayerCount:enemyPlayers.length,source};
}
