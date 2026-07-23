"use client";
import { useEffect,useMemo,useRef,useState } from "react";
import { CommanderDeck } from "./CommanderDeck";
import { CommanderPrematch } from "./CommanderPrematch";
import { CommanderStatusBar } from "./CommanderStatusBar";
import { SessionOwnerTools } from "@/components/online/SessionOwnerTools";
import { getMatchUiState,shouldResetForGame } from "@/lib/commander/match-ui-state";
import type { AuthoritativeMatchState,DuoCall,MatchStateSource,NormalizedGameData,SessionMember,SharedState } from "@/lib/realtime/types";

type Props={code:string;secret:string;game?:NormalizedGameData&{status?:string};call?:DuoCall;shared?:SharedState;matchState:AuthoritativeMatchState;matchSource:MatchStateSource;members:SessionMember[];botlaneEnemy:string[];onCall:(text:string)=>void;onShare:(state:SharedState)=>void;onResetForGame:()=>void;onStartNewMatch:()=>void;onCreateNewSession:()=>Promise<void>;onLeave:()=>void};
export function CommanderShell({code,secret,game,call,shared,matchState,matchSource,members,botlaneEnemy,onCall,onShare,onResetForGame,onStartNewMatch,onCreateNewSession,onLeave}:Props){
  const detectedState=getMatchUiState(game),[dismissedEndedId,setDismissedEndedId]=useState(""),[confirmNew,setConfirmNew]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),endedKey=game?.gameId??"ended",state=detectedState==="ended"&&dismissedEndedId===endedKey?"prematch":detectedState,previousGameId=useRef<string|undefined>(undefined),age=game?.updatedAt?Math.max(0,Math.round((Date.now()-new Date(game.updatedAt).getTime())/1000)):0,companionOnline=members.some(member=>member.role==="heimer");
  const baseUrl=(process.env.NEXT_PUBLIC_MACROBOARD_URL||"https://always-be-ready.de").replace(/\/$/,""),companionLink=useMemo(()=>`${baseUrl}/session/${code}/companion`,[baseUrl,code]),connectorCommand=`npx tsx src/index.ts --session ${code} --secret "${secret}" --url "${baseUrl}"`;
  useEffect(()=>{if(shouldResetForGame(previousGameId.current,game?.gameId))onResetForGame();if(game?.gameId)previousGameId.current=game.gameId},[game?.gameId,onResetForGame]);
  const copy=(value:string)=>navigator.clipboard.writeText(value);
  const create=async()=>{setBusy(true);setError("");try{await onCreateNewSession()}catch(e){setError(e instanceof Error?e.message:"Session konnte nicht erstellt werden.");setBusy(false)}};
  return <main className={`commander-shell commander-${state}`}>
    <CommanderStatusBar code={code} companionOnline={companionOnline} state={state} age={age}/>
    <nav className="commander-session-actions"><button onClick={()=>copy(companionLink)}>GS-LINK</button><button onClick={()=>copy(connectorCommand)}>CONNECTOR</button><button onClick={()=>setConfirmNew(true)}>+ NEUE SESSION</button><button onClick={onLeave}>SESSION VERLASSEN</button></nav>
    {process.env.NODE_ENV!=="production"&&<small>COMMANDER MATCH STATE: gameId {matchState.gameId??"–"} · gameTime {matchState.gameTime??"–"} · phase {matchState.phase} · updatedAt {matchState.updatedAt??"–"} · Quelle {matchSource}</small>}
    {secret&&<details className="commander-share" open={state==="prematch"}><summary>{state==="prematch"?"SESSION TEILEN":"SESSION"}</summary><SessionOwnerTools code={code} connectorSecret={secret}/></details>}
    {state==="prematch"?<CommanderPrematch code={code} companionOnline={companionOnline}/>:state==="ended"?<section className="commander-ended"><span>MATCH BEENDET</span><strong>MISSION ENGINE GESTOPPT</strong><button onClick={()=>{setDismissedEndedId(game?.gameId??"ended");onStartNewMatch()}}>NEUES MATCH</button></section>:<CommanderDeck key={game?.gameId} code={code} game={game} call={call} shared={shared} botlaneEnemy={botlaneEnemy} onCall={onCall} onShare={onShare} stale={state==="stale"}/>}
    <details className="commander-more"><summary>WEITERE INFORMATIONEN</summary><a href={`/session/${code}/full`}>Vollständiges Dashboard öffnen</a></details>
    {confirmNew&&<div className="session-dialog" role="dialog" aria-modal="true" aria-labelledby="new-session-title"><section><span>SESSION-WECHSEL</span><h2 id="new-session-title">Neue Session erstellen?</h2><p>Ein neuer Session-Code, ein neues Connector-Secret, ein neuer GS-Link und ein neuer QR-Code werden erzeugt. Die bisherige Session wird nicht gelöscht.</p>{error&&<strong>{error}</strong>}<div><button disabled={busy} onClick={()=>setConfirmNew(false)}>ABBRECHEN</button><button disabled={busy} onClick={create}>{busy?"WIRD ERSTELLT…":"NEUE SESSION ERSTELLEN"}</button></div></section></div>}
  </main>;
}
