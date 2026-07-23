import type { MissionEngineOutput } from "@/lib/mission/types";
const labels={dragon:"DRACHE",grubs:"VOID GRUBS",herald:"HERALD",baron:"BARON"};
const clock=(seconds:number)=>`${String(Math.floor(Math.max(0,seconds)/60)).padStart(2,"0")}:${String(Math.max(0,seconds)%60).padStart(2,"0")}`;
export function ObjectivePriorityBar({output,stale}:{output?:MissionEngineOutput;stale:boolean}){
  return <section className="objective-priority-bar"><span>OBJECTIVES</span>{output?.objectives.map(objective=><article key={objective.type} className={`${objective.status} ${output.mission?.type===objective.type?"important":""}`}><strong>{labels[objective.type]}</strong><b>{stale?"NICHT AKTUELL":objective.countdownSeconds===undefined?objective.status.toUpperCase():clock(objective.countdownSeconds)}</b><em>{objective.status.toUpperCase()} · {objective.automatic?"AUTO":"MANUELL"}</em></article>)}</section>;
}
