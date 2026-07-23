import type { TimerState } from "@/lib/types";
const pad=(n:number)=>String(n).padStart(2,"0");
const clock=(ms:number)=>`${pad(Math.floor(ms/60000))}:${pad(Math.ceil((ms%60000)/1000))}`;
const level=(t:TimerState)=>!t.running&&t.fired.length?"live":t.remainingMs<=10000?"critical":t.remainingMs<=30000?"danger":t.remainingMs<=60000?"urgent":t.remainingMs<=90000?"attention":"idle";

export function ObjectiveTimers({timers,focus,onAdd,onToggle,onReset,onDirect}:{timers:TimerState[];focus?:boolean;onAdd:(id:string,s:number)=>void;onToggle:(id:string)=>void;onReset:(id:string)=>void;onDirect:(id:string,s:number)=>void}) {
  return <section className={`objective-grid ${focus?"objective-focus":""}`}>{timers.map(t=><article key={t.id} className={`objective-card objective-${level(t)}`}><div className="objective-head"><h3>{t.name}</h3><span>{level(t)==="live"?"LIVE":t.running?"COUNTDOWN":"BEREIT"}</span></div><div className="digital-timer">{level(t)==="live"?(t.name==="Drake"?"DRAGON LIVE":`${t.name.toUpperCase()} LIVE`):clock(t.remainingMs)}</div>{!focus&&<><div className="timer-add">{[30,60,90].map(s=><button key={s} onClick={()=>onAdd(t.id,s)}>+{s}s</button>)}</div><div className="timer-controls"><button disabled={t.remainingMs<=0} onClick={()=>onToggle(t.id)}>{t.running?"PAUSE":"START"}</button><button onClick={()=>onReset(t.id)}>RESET</button><input aria-label={`${t.name} Sekunden`} type="number" placeholder="SEK." onChange={e=>onDirect(t.id,Number(e.target.value)||0)}/></div></>}</article>)}</section>;
}
