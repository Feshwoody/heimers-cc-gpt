import type { MatchUiState } from "@/lib/commander/match-ui-state";
export function CommanderStatusBar({code,companionOnline,state,age}:{code:string;companionOnline:boolean;state:MatchUiState;age:number}){
  const connector=state==="prematch"?"WARTET":state==="stale"?"DATEN VERALTET":state==="ended"?"BEENDET":"ONLINE",match=state==="prematch"?"NOCH NICHT ERKANNT":state==="ended"?"BEENDET":"ERKANNT";
  return <header className={`commander-status state-${state}`}><span>SESSION {code}</span><span>GS {companionOnline?"ONLINE":"WARTET"}</span><span>CONNECTOR {connector}</span><span>MATCH {match}</span>{state!=="prematch"&&<span>UPDATE VOR {age} SEK.</span>}</header>;
}
