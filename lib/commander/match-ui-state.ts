export type MatchUiState="prematch"|"ingame"|"stale"|"ended";
export type MatchSnapshot={gameId?:string;gameTime?:number;updatedAt?:string;status?:string};
export function getMatchUiState(game:MatchSnapshot|undefined,now=Date.now()):MatchUiState{
  if(game?.status==="ended")return"ended";
  if(!game?.gameId||!Number.isFinite(game.gameTime))return"prematch";
  const updated=game.updatedAt?new Date(game.updatedAt).getTime():0;
  return updated&&now-updated>10_000?"stale":"ingame";
}
export const shouldResetForGame=(previousGameId:string|undefined,nextGameId:string|undefined)=>Boolean(previousGameId&&nextGameId&&previousGameId!==nextGameId);
