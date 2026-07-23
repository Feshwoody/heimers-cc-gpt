"use client";
import { useMemo,useState } from "react";
import { DataDragonIcon } from "@/components/live/DataDragonIcon";
import { DEFAULT_MISSION_SETTINGS } from "@/lib/mission/objective-config";
import { runMissionEngine } from "@/lib/mission/mission-engine";
import type { DuoCall,NormalizedGameData,SharedState,SharedTimer } from "@/lib/realtime/types";
import { EnemySummonerBar } from "./EnemySummonerBar";
import { ObjectivePriorityBar } from "./ObjectivePriorityBar";
import { JungleDangerPanel } from "./JungleDangerPanel";

const quickCalls=["RESET","MID SS","JUNGLE BOT","JUNGLE TOP","HOLD POSITION","PEEL ME","SUPPORT SS","ENGAGE READY","NO FLASH ADC","DRAKE SETUP","BARON SETUP","HEIMER TURRETS READY"];
const clock=(seconds:number)=>`${String(Math.floor(Math.max(0,seconds)/60)).padStart(2,"0")}:${String(Math.max(0,seconds)%60).padStart(2,"0")}`;

export function CommanderDeck({game,call,shared,botlaneEnemy,onCall,onShare,stale}:{code:string;game?:NormalizedGameData;call?:DuoCall;shared?:SharedState;botlaneEnemy:string[];onCall:(text:string)=>void;onShare:(state:SharedState)=>void;stale:boolean}){
  const [activeCall,setActiveCall]=useState("");
  const connectorStatus=shared?.matchState?.connectorStatus??(stale?"stale":"online"),timers=shared?.matchState?.summonerTimers??shared?.timers??[];
  const output=useMemo(()=>game?runMissionEngine({gameId:game.gameId,gameTime:game.gameTime,gameMode:game.gameMode,mapName:game.mapName,connectorStatus:connectorStatus==="waiting"?"offline":connectorStatus,events:game.events,manualMission:call?{id:call.id,title:call.text,sourceName:call.source,createdAt:call.timestamp,acknowledged:call.acknowledgedBy.length>0}:undefined,overrides:shared?.missionEngine?.gameId===game.gameId?shared.missionEngine.overrides:{},settings:DEFAULT_MISSION_SETTINGS}):undefined,[call,connectorStatus,game,shared?.missionEngine]);
  const issue=(text:string)=>{setActiveCall(text);onCall(text);window.setTimeout(()=>setActiveCall(""),900)};
  const updateTimers=(next:SharedTimer[])=>{if(!shared?.matchState)return;onShare({timers:next,matchState:{...shared.matchState,summonerTimers:next},updatedAt:Date.now(),sourceMemberId:"commander"})};
  const mission=output?.mission,ownTeam=game?.activePlayer.team,enemies=game?.enemyPlayers??game?.players.filter(player=>player.team!==ownTeam)??[],ours=game?.players.filter(player=>player.team===ownTeam&&["Nautilus","Heimerdinger"].includes(player.championName))??[],theirBot=botlaneEnemy.map(name=>enemies.find(player=>player.championName===name)).filter((player):player is NormalizedGameData["players"][number]=>Boolean(player));
  if(!game)return null;
  return <div className="commander-deck">
    <EnemySummonerBar game={game} botlaneEnemy={botlaneEnemy} timers={timers} onChange={updateTimers}/>
    <ObjectivePriorityBar output={output} stale={stale}/>
    <div className="commander-priority-actions"><JungleDangerPanel activeCall={call} onCall={issue}/><section className="commander-calls">{quickCalls.map(text=><button key={text} className={activeCall===text?"active":call?.text===text&&!call.acknowledgedBy.length?"pending":call?.text===text&&call.acknowledgedBy.length?"confirmed":""} onClick={()=>issue(text)}>{text}</button>)}</section></div>
    <section className={`commander-mission severity-${mission?.severity??"calm"} ${stale?"is-stale":""}`}><div><span>{stale?"DATEN VERALTET":mission?.source==="manual"?`CALL VON ${call?.source.toUpperCase()}`:"AKTUELLE MISSION"}</span><h1>{mission?.title??"TEMPO"}</h1>{mission?.countdownSeconds!==undefined&&<b>{stale?"—":clock(mission.countdownSeconds)}</b>}</div><ul>{mission?.instructions.slice(0,4).map(item=><li key={item}>{item}</li>)}</ul>{call?.acknowledgedBy.length?<strong>✓ GS HAT VERSTANDEN</strong>:null}</section>
    <section className="commander-botlane"><span>BOTLANE</span><div>{ours.map(player=><span key={player.championName}><DataDragonIcon type="champion" name={player.championName} size={38}/>{player.championName.toUpperCase()}</span>)}</div><b>VS</b><div>{theirBot.length?theirBot.map(player=><span key={player.championName}><DataDragonIcon type="champion" name={player.championName} size={38}/>{player.championName.toUpperCase()}</span>):<em>WIRD ERKANNT</em>}</div></section>
  </div>;
}
