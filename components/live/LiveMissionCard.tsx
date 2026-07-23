import type { DuoCall, SharedState } from "@/lib/realtime/types";
const pad=(n:number)=>String(n).padStart(2,"0");const clock=(ms:number)=>`${pad(Math.floor(ms/60000))}:${pad(Math.ceil((ms%60000)/1000))}`;
export function LiveMissionCard({call,state,onAck}:{call?:DuoCall;state?:SharedState;onAck:()=>void}) {
  const timer=state?.timers?.filter(t=>t.running&&t.targetTimestamp).sort((a,b)=>(a.targetTimestamp??0)-(b.targetTimestamp??0))[0];
  const remaining=timer?.targetTimestamp?Math.max(0,timer.targetTimestamp-Date.now()):0;
  const title=call?.text??(timer?timer.id.toUpperCase():"POSITION HALTEN");
  const points=call?(call.text.includes("DRAKE")?["RESET","CONTROL WARD","MID PUSH"]:call.text.includes("BARON")?["RESET","VISION","SETUP"]:["GEMEINSAM SPIELEN","NICHT ÜBERDEHNEN"]):["WIN CONDITION PRÜFEN","OBJECTIVE VORBEREITEN"];
  return <section className={`live-mission ${call?"live-mission-call":""}`}><div className="live-mission-top"><span>AKTIVE MISSION</span>{call&&<em>CALL VON {call.source.toUpperCase()}</em>}</div><div className="live-mission-body"><div><h2>{title}</h2>{timer&&<strong>{clock(remaining)}</strong>}</div><ul>{points.slice(0,4).map(p=><li key={p}>{p}</li>)}</ul>{call&&<button onClick={onAck}>VERSTANDEN</button>}</div>{call?.acknowledgedBy.length?<p>BESTÄTIGT: {call.acknowledgedBy.join(", ")}</p>:null}</section>;
}
