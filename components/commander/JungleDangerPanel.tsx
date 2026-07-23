"use client";
import { useState } from "react";
import type { DuoCall } from "@/lib/realtime/types";
const calls=[["JUNGLE BOT","BOT"],["JUNGLE TOP","TOP"],["JUNGLE MID","MID"],["JUNGLE SICHTBAR","SICHTBAR"]] as const;
export function JungleDangerPanel({activeCall,onCall}:{activeCall?:DuoCall;onCall:(call:string)=>void}){
  const [danger,setDanger]=useState("UNBEKANNT");
  const current=activeCall?.text.startsWith("JUNGLE ")?activeCall.text.slice(7):danger;
  return <section className="jungle-danger"><strong>JUNGLE: {current}</strong>{calls.map(([call,label])=><button key={call} onClick={()=>{setDanger(label);onCall(call)}}>{call}</button>)}</section>;
}
