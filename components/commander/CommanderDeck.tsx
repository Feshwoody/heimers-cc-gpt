"use client";
import { useMemo,useState } from "react";
import { DataDragonIcon } from "@/components/live/DataDragonIcon";
import { DEFAULT_MISSION_SETTINGS } from "@/lib/mission/objective-config";
import { runMissionEngine } from "@/lib/mission/mission-engine";
import type { DuoCall,NormalizedGameData,SharedState } from "@/lib/realtime/types";
import { commanderFlashUsers } from "@/lib/commander/commander-utils";

const quickCalls=[["RESET","MID SS","SUPPORT SS","JUNGLE BOT","JUNGLE TOP","HOLD POSITION"],["PEEL ME","ENGAGE READY","NO FLASH ADC","DRAKE SETUP","BARON SETUP","HEIMER TURRETS READY"]];
const objectiveLabels={dragon:"DRACHE",grubs:"GRUBS",herald:"HERALD",baron:"BARON"};
const clock=(seconds:number)=>`${String(Math.floor(Math.max(0,seconds)/60)).padStart(2,"0")}:${String(Math.max(0,seconds)%60).padStart(2,"0")}`;

export function CommanderDeck({code,game,call,shared,botlaneEnemy,onCall,onShare}:{code:string;game?:NormalizedGameData;call?:DuoCall;shared?:SharedState;botlaneEnemy:string[];onCall:(text:string)=>void;onShare:(state:SharedState)=>void}){
  const [activeCall,setActiveCall]=useState(""),[now,setNow]=useState(Date.now());
  const connectorStatus=game?"online":"offline";
  const output=useMemo(()=>game?runMissionEngine({gameId:game.gameId,gameTime:game.gameTime,gameMode:game.gameMode,mapName:game.mapName,connectorStatus,events:game.events,manualMission:call?{id:call.id,title:call.text,sourceName:call.source,createdAt:call.timestamp,acknowledged:call.acknowledgedBy.length>0}:undefined,overrides:shared?.missionEngine?.gameId===game.gameId?shared.missionEngine.overrides:{},settings:DEFAULT_MISSION_SETTINGS}):undefined,[call,game,shared?.missionEngine]);
  const mission=output?.mission,ownTeam=game?.activePlayer.team,enemies=game?.players.filter(player=>player.team!==ownTeam)??[],ordered=game?commanderFlashUsers(game,botlaneEnemy):[];
  const timers=shared?.timers??[];
  const startFlash=(index:number)=>{const id=["adc-flash","support-flash","mid-flash","jungle-flash"][index],next={id,targetTimestamp:Date.now()+300000,pausedRemaining:300000,running:true,updatedAt:Date.now(),sourceMemberId:"commander"},state:SharedState={timers:[...timers.filter(timer=>timer.id!==id),next],updatedAt:Date.now(),sourceMemberId:"commander"};onShare(state);setNow(Date.now())};
  const issue=(text:string)=>{setActiveCall(text);onCall(text);window.setTimeout(()=>setActiveCall(""),900)};
  const ours=game?.players.filter(player=>player.team===ownTeam&&["Nautilus","Heimerdinger"].includes(player.championName))??[],theirBot=botlaneEnemy.map(name=>enemies.find(player=>player.championName===name)).filter((player):player is NormalizedGameData["players"][number]=>Boolean(player));
  return <main className="commander-deck">
    <section className="commander-status"><span>SESSION {code}</span><span>CONNECTOR {game?"ONLINE":"WARTET AUF LEAGUE"}</span><span>COMPANION {call?.acknowledgedBy.length?`${call.acknowledgedBy.at(-1)} HAT VERSTANDEN`:"WARTET"}</span></section>
    {!game?<section className="commander-prematch"><div><span>MISSION ENGINE</span><strong>WARTET AUF MATCH</strong></div><div><span>OBJECTIVES</span><strong>WERDEN NACH MATCHSTART AUTOMATISCH BERECHNET</strong></div><div><span>CONNECTOR</span><strong>WARTET AUF LEAGUE</strong></div></section>:<section className={`commander-mission severity-${mission?.severity??"calm"}`}><div><span>{mission?.source==="manual"?"AKTUELLER CALL":"AKTUELLE MISSION"}</span><h1>{mission?.title??"TEMPO"}</h1>{mission?.countdownSeconds!==undefined&&<b>{clock(mission.countdownSeconds)}</b>}</div><ul>{mission?.instructions.slice(0,4).map(item=><li key={item}>{item}</li>)}</ul>{call?.acknowledgedBy.length?<strong>✓ GS HAT VERSTANDEN</strong>:null}</section>}
    <section className="commander-calls">{quickCalls.flat().map(text=><button key={text} className={activeCall===text?"active":call?.text===text&&!call.acknowledgedBy.length?"pending":call?.text===text&&call.acknowledgedBy.length?"confirmed":""} onClick={()=>issue(text)}>{text}</button>)}</section>
    <section className="commander-objectives"><span>OBJECTIVES</span>{game?output?.objectives.map(objective=><article key={objective.type} className={`${objective.status} ${mission?.type===objective.type?"important":""}`}><strong>{objectiveLabels[objective.type]}</strong><b>{objective.countdownSeconds===undefined?objective.status.toUpperCase():clock(objective.countdownSeconds)}</b><em>{objective.status.toUpperCase()}</em></article>):<p>WARTET AUF MATCH</p>}</section>
    <section className="commander-flashes"><span>RELEVANTE FLASH-TIMER</span>{[0,1,2,3].map(index=>{const player=ordered[index],id=["adc-flash","support-flash","mid-flash","jungle-flash"][index],timer=timers.find(item=>item.id===id),remaining=timer?.running&&timer.targetTimestamp?Math.max(0,Math.ceil((timer.targetTimestamp-now)/1000)):0;return <button key={id} onClick={()=>startFlash(index)} className={index<2?"botlane":""}>{player?<DataDragonIcon type="champion" name={player.championName} size={54}/>:<span className="dd-fallback">?</span>}<strong>{player?.championName.toUpperCase()??["ADC","SUPPORT","MID","JUNGLE"][index]} FLASH</strong><b>{remaining?clock(remaining):"READY"}</b></button>})}</section>
    <section className="commander-botlane"><span>BOTLANE</span><div>{ours.map(player=><span key={player.championName}><DataDragonIcon type="champion" name={player.championName} size={38}/>{player.championName.toUpperCase()}</span>)}</div><b>VS</b><div>{theirBot.length?theirBot.map(player=><span key={player.championName}><DataDragonIcon type="champion" name={player.championName} size={38}/>{player.championName.toUpperCase()}</span>):<em>WIRD ERKANNT</em>}</div></section>
    <details className="commander-more"><summary>WEITERE INFORMATIONEN</summary><a href={`/session/${code}/full`}>Vollständiges Dashboard öffnen</a></details>
  </main>;
}
