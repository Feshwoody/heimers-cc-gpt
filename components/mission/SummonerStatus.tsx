"use client";
import { useState } from "react";
import type { SummonerState } from "@/lib/types";
const pad=(n:number)=>String(n).padStart(2,"0");
const clock=(s:number)=>`${pad(Math.floor(s/60))}:${pad(Math.ceil(s%60))}`;
export function SummonerStatus({items,onStart,onReset,flashOnly=false,relevantNames}:{items:SummonerState[];onStart:(id:string)=>void;onReset:(id:string)=>void;flashOnly?:boolean;relevantNames?:string[]}) {
  const [all,setAll]=useState(false);const now=Date.now();const relevant=items.filter((x,index)=>relevantNames?.some(n=>x.name.startsWith(n))||x.name.includes("Teleport")||x.id==="teleport"||(x.id.includes("flash")&&index<2));const shown=flashOnly?items.filter(x=>x.id.includes("flash")):relevantNames&&!all?relevant:items;
  return <section className="summoner-panel"><div className="section-heading"><span>GEGNERISCHE SPELLS</span><h2>Summoner Tracker</h2></div><div className="summoner-grid">{shown.map(s=>{const left=s.endAt?Math.max(0,(s.endAt-now)/1000):0;const state=!left?"ready":left<=30?"soon":"cooldown";return <button key={s.id} onClick={()=>left?onReset(s.id):onStart(s.id)} className={`summoner-${state}`}><span className="summoner-name">{s.name.replace("Gegner ","")}</span><strong>{left?clock(left):"READY"}</strong><em>{state==="ready"?"VERFÜGBAR":state==="soon"?"BALD READY":"COOLDOWN"}</em></button>})}</div>{relevantNames&&<button className="spells-toggle" onClick={()=>setAll(x=>!x)}>{all?"Relevante Spells":"Alle Spells anzeigen"}</button>}</section>;
}
