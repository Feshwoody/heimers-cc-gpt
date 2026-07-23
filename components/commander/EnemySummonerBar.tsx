"use client";
import { useEffect,useState } from "react";
import { DataDragonIcon } from "@/components/live/DataDragonIcon";
import { orderedEnemyRoster } from "@/lib/realtime/enemy-roster";
import { correctSummonerTimer,remainingSeconds,startSummonerTimer,summonerTimerId,timerLabel } from "@/lib/summoners/summoner-timer-state";
import type { NormalizedGameData,SharedTimer } from "@/lib/realtime/types";

const clock=(seconds:number)=>`${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
const roles=["ADC","SUPPORT","JUNGLE","MID","TOP"];
export function EnemySummonerBar({game,botlaneEnemy,timers,onChange,readOnly=false}:{game:NormalizedGameData;botlaneEnemy:string[];timers:SharedTimer[];onChange:(timers:SharedTimer[])=>void;readOnly?:boolean}){
  const [now,setNow]=useState(Date.now()),[editing,setEditing]=useState("");
  useEffect(()=>{const id=window.setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id)},[]);
  const enemies=orderedEnemyRoster(game,botlaneEnemy);
  const update=(playerId:string,spell:string)=>{
    if(readOnly)return;
    const id=summonerTimerId(playerId,spell),existing=timers.find(timer=>timer.id===id);
    if(existing?.running&&remainingSeconds(existing)>0){setEditing(id);return}
    onChange([...timers.filter(timer=>timer.id!==id),startSummonerTimer(playerId,spell,"commander")]);
  };
  const correct=(timer:SharedTimer,action:"+30"|"-30"|"ready"|number)=>{onChange([...timers.filter(item=>item.id!==timer.id),correctSummonerTimer(timer,action)]);setEditing("")};
  return <section className="enemy-summoner-bar" aria-label="Gegnerische Summoner-Timer">{enemies.map((player,index)=>{
    const playerId=player.playerId||player.summonerName||player.championName;
    return <article key={playerId}><header><DataDragonIcon type="champion" name={player.dataDragonKey||player.championName} size={42}/><span><em>{roles[index]}</em><strong>{player.championName.toUpperCase()}</strong></span></header><div>{Object.values(player.summonerSpells).filter(Boolean).map(spell=>{const id=summonerTimerId(playerId,spell),timer=timers.find(item=>item.id===id),remaining=remainingSeconds(timer,now);return <section className="enemy-spell" key={id}><button type="button" onClick={()=>update(playerId,spell)} disabled={readOnly}><DataDragonIcon type="spell" name={spell} size={34}/><span><strong>{spell.toUpperCase()}</strong><em className={remaining?"cooldown":"ready"}>{timerLabel(timer,now)}{remaining?` · ${clock(remaining)}`:""}</em></span></button>{editing===id&&timer&&<div className="timer-correction"><button onClick={()=>correct(timer,"+30")}>+30</button><button onClick={()=>correct(timer,"-30")}>-30</button><button onClick={()=>correct(timer,"ready")}>READY</button><button onClick={()=>{const value=window.prompt("Verbleibende Sekunden",String(remaining));if(value!==null&&Number.isFinite(Number(value)))correct(timer,Number(value))}}>ZEIT</button></div>}</section>})}</div></article>})}{enemies.length!==5&&process.env.NODE_ENV!=="production"&&<strong className="enemy-warning">WARNUNG: {enemies.length}/5 GEGNER IM LIVE-PAYLOAD</strong>}</section>;
}
