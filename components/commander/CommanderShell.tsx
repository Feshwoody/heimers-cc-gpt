"use client";
import { useEffect,useRef,useState } from "react";
import { CommanderDeck } from "./CommanderDeck";
import { CommanderPrematch } from "./CommanderPrematch";
import { CommanderStatusBar } from "./CommanderStatusBar";
import { SessionOwnerTools } from "@/components/online/SessionOwnerTools";
import { getMatchUiState,shouldResetForGame } from "@/lib/commander/match-ui-state";
import type { DuoCall,NormalizedGameData,SessionMember,SharedState } from "@/lib/realtime/types";
export function CommanderShell({code,secret,game,call,shared,members,botlaneEnemy,onCall,onShare,onResetForGame,onStartNewMatch}:{code:string;secret:string;game?:NormalizedGameData&{status?:string};call?:DuoCall;shared?:SharedState;members:SessionMember[];botlaneEnemy:string[];onCall:(text:string)=>void;onShare:(state:SharedState)=>void;onResetForGame:()=>void;onStartNewMatch:()=>void}){
  const detectedState=getMatchUiState(game),[dismissedEndedId,setDismissedEndedId]=useState(""),endedKey=game?.gameId??"ended",state=detectedState==="ended"&&dismissedEndedId===endedKey?"prematch":detectedState,previousGameId=useRef<string|undefined>(undefined),age=game?.updatedAt?Math.max(0,Math.round((Date.now()-new Date(game.updatedAt).getTime())/1000)):0,companionOnline=members.some(member=>member.role==="heimer");
  useEffect(()=>{if(shouldResetForGame(previousGameId.current,game?.gameId))onResetForGame();if(game?.gameId)previousGameId.current=game.gameId},[game?.gameId,onResetForGame]);
  return <main className={`commander-shell commander-${state}`}><CommanderStatusBar code={code} companionOnline={companionOnline} state={state} age={age}/>{secret&&<details className="commander-share" open={state==="prematch"}><summary>{state==="prematch"?"SESSION TEILEN":"SESSION"}</summary><SessionOwnerTools code={code} connectorSecret={secret}/></details>}{state==="prematch"?<CommanderPrematch code={code} companionOnline={companionOnline}/>:state==="ended"?<section className="commander-ended"><span>MATCH BEENDET</span><strong>MISSION ENGINE GESTOPPT</strong><button onClick={()=>{setDismissedEndedId(game?.gameId??"ended");onStartNewMatch()}}>NEUES MATCH</button></section>:<CommanderDeck key={game?.gameId} code={code} game={game} call={call} shared={shared} botlaneEnemy={botlaneEnemy} onCall={onCall} onShare={onShare} stale={state==="stale"}/>}<details className="commander-more"><summary>WEITERE INFORMATIONEN</summary><a href={`/session/${code}/full`}>Vollständiges Dashboard öffnen</a></details></main>;
}
