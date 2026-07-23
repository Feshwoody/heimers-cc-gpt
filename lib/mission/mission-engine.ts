import { DEFAULT_MISSION_SETTINGS, OBJECTIVE_CONFIG, PHASE_MISSIONS } from "./objective-config";
import { priorityFor, selectMission } from "./mission-priority";
import type { LiveObjectiveEvent, Mission, MissionEngineInput, MissionEngineOutput, MissionSeverity, ObjectiveCycle, ObjectiveKill, ObjectiveType } from "./types";

const eventId=(event:LiveObjectiveEvent)=>event.id??`${event.name}:${event.time}:${event.killerName??""}`;
const objectiveForEvent=(event:LiveObjectiveEvent):ObjectiveType|undefined=>(Object.values(OBJECTIVE_CONFIG).find(config=>config.eventNames.includes(event.name))?.type);
const isSupported=(mode:string,map:string)=>mode.toUpperCase()==="CLASSIC"&&(map.toLowerCase().includes("summoner")||map==="");
const format=(seconds:number)=>`${Math.floor(seconds/60)}:${String(Math.max(0,seconds%60)).padStart(2,"0")}`;

export function processObjectiveEvents(events:LiveObjectiveEvent[]) {
  const seen=new Set<string>();const kills:ObjectiveKill[]=[];
  [...events].sort((a,b)=>a.time-b.time).forEach(event=>{const id=eventId(event);if(seen.has(id))return;seen.add(id);const objective=objectiveForEvent(event);if(!objective)return;const config=OBJECTIVE_CONFIG[objective];kills.push({objective,eventId:id,killTime:event.time,respawnTime:config.respawnSeconds?event.time+config.respawnSeconds:undefined,source:"live-client"})});
  return {kills,processedEventIds:[...seen]};
}

function cycleFor(type:ObjectiveType,input:MissionEngineInput,kills:ObjectiveKill[]):ObjectiveCycle {
  const config=OBJECTIVE_CONFIG[type],override=input.overrides?.[type],latest=[...kills].filter(k=>k.objective===type).sort((a,b)=>b.killTime-a.killTime)[0];
  if(override?.mode==="irrelevant")return{type,status:"irrelevant",automatic:false};
  if(override?.mode==="taken")return{type,status:"taken",automatic:false};
  let target=override?.mode==="manual"?override.targetTime:(latest?.respawnTime??(!latest?config.spawnTime:undefined));
  if(target===undefined)return{type,status:"respawn-unknown",automatic:override?.mode!=="manual",kill:latest};
  const countdown=Math.ceil(target-input.gameTime);
  if(countdown<=0){const age=-countdown;if(config.oneTime&&latest)return{type,targetTime:target,countdownSeconds:countdown,status:"taken",automatic:override?.mode!=="manual",kill:latest};if(age>config.liveWindowSeconds&&!latest)return{type,targetTime:target,countdownSeconds:countdown,status:"respawn-unknown",automatic:override?.mode!=="manual"};return{type,targetTime:target,countdownSeconds:countdown,status:"live",automatic:override?.mode!=="manual",kill:latest}}
  const status=countdown<=60?"urgent":countdown<=120?"prepare":"upcoming";
  return{type,targetTime:target,countdownSeconds:countdown,status,automatic:override?.mode!=="manual",kill:latest};
}

function objectiveMission(cycle:ObjectiveCycle,input:MissionEngineInput):Mission|undefined {
  if(cycle.countdownSeconds===undefined||cycle.status==="taken"||cycle.status==="irrelevant"||cycle.status==="respawn-unknown")return;
  const config=OBJECTIVE_CONFIG[cycle.type],seconds=cycle.countdownSeconds;
  if(seconds>120)return;
  if(cycle.type==="dragon"&&input.gameTime<240&&seconds>90)return;
  let severity:MissionSeverity,instructions:string[],soundPattern:string|undefined;
  if(seconds<=0){severity="live";instructions=config.live;soundPattern="spawn"}
  else if(seconds<=30){severity="urgent";instructions=config.urgent30;soundPattern=seconds<=10?"triple":"high-double"}
  else if(seconds<=60){severity="urgent";instructions=config.urgent60;soundPattern="double"}
  else if(seconds<=90){severity="prepare";instructions=config.prepare;soundPattern="low-double"}
  else{severity="info";instructions=config.info;soundPattern=undefined}
  const max=input.settings?.maxInstructions??DEFAULT_MISSION_SETTINGS.maxInstructions;
  const label=input.settings?.customTitles?.[cycle.type]?.trim()||config.label;
  return{id:`${cycle.type}:${cycle.targetTime}`,type:cycle.type,priority:priorityFor("engine",seconds),severity,title:seconds<=0?`${label} LIVE`:`${label} IN ${format(seconds)}`,countdownSeconds:seconds,instructions:instructions.slice(0,max),soundPattern,createdAt:new Date((input.now??Date.now())).toISOString(),source:"engine"};
}

function phaseMission(input:MissionEngineInput):Mission {
  const block=input.gameTime<240?PHASE_MISSIONS.laneStart:input.gameTime<300?PHASE_MISSIONS.laneControl:input.gameTime>=1200?PHASE_MISSIONS.baronMap:PHASE_MISSIONS.tempo;
  return{id:`phase:${block.title}`,type:"lane",priority:100,severity:"calm",title:block.title,instructions:block.instructions,createdAt:new Date(input.now??Date.now()).toISOString(),source:"engine"};
}

export function runMissionEngine(input:MissionEngineInput):MissionEngineOutput {
  const supported=isSupported(input.gameMode,input.mapName),processed=processObjectiveEvents(input.events);
  if(!supported||input.connectorStatus==="ended"||(input.settings?.enabled===false))return{supported,objectives:[],kills:processed.kills,processedEventIds:processed.processedEventIds,gameId:input.gameId};
  const settings={...DEFAULT_MISSION_SETTINGS,...input.settings,enabledObjectives:{...DEFAULT_MISSION_SETTINGS.enabledObjectives,...input.settings?.enabledObjectives}};
  const objectives=(Object.keys(OBJECTIVE_CONFIG) as ObjectiveType[]).map(type=>cycleFor(type,input,processed.kills));
  const missions=objectives.filter(c=>settings.enabledObjectives[c.type]).map(c=>objectiveMission(c,{...input,settings})).filter((m):m is Mission=>Boolean(m));
  missions.push(phaseMission(input));
  if(input.manualMission&&!input.manualMission.acknowledged&&(input.now??Date.now())-input.manualMission.createdAt<15_000)missions.push({id:input.manualMission.id,type:"manual",priority:priorityFor("manual"),severity:"urgent",title:input.manualMission.title,instructions:(input.manualMission.instructions??["Gemeinsam reagieren"]).slice(0,settings.maxInstructions),createdAt:new Date(input.manualMission.createdAt).toISOString(),expiresAt:new Date(input.manualMission.createdAt+15_000).toISOString(),source:"manual"});
  return{supported,mission:selectMission(missions),objectives,kills:processed.kills,processedEventIds:processed.processedEventIds,gameId:input.gameId};
}
