import type { MissionSettings, ObjectiveType } from "./types";

export type ObjectiveDefinition = {
  type: ObjectiveType; label: string; spawnTime: number; respawnSeconds?: number; liveWindowSeconds: number; oneTime: boolean;
  eventNames: string[]; info: string[]; prepare: string[]; urgent60: string[]; urgent30: string[]; live: string[];
};

export const OBJECTIVE_CONFIG: Record<ObjectiveType, ObjectiveDefinition> = {
  dragon: { type:"dragon",label:"DRACHE",spawnTime:300,respawnSeconds:300,liveWindowSeconds:45,oneTime:false,eventNames:["DragonKill","Dragon_Kill"],info:["Wave planen","Recall vorbereiten","Gold ausgeben"],prepare:["RESET","CONTROL WARD","MID-WAVE VORBEREITEN","GEMEINSAM LOS"],urgent60:["RIVER BETRETEN","VISION AUFBAUEN","HEIMER-TÜRME VORBEREITEN","KEIN RANDOM FIGHT"],urgent30:["POSITION HALTEN","NICHT ALLEIN WARDEN","HEIMER-SETUP SCHÜTZEN"],live:["SETUP HALTEN","ENGAGE ODER PEEL BEWUSST","NICHT BLIND CHASEN"] },
  grubs: { type:"grubs",label:"VOID GRUBS",spawnTime:480,liveWindowSeconds:90,oneTime:true,eventNames:["HordeKill","VoidGrubKill","GrubKill"],info:["Topside-Status prüfen","Bot-Wave vorbereiten","Rotation bewusst entscheiden"],prepare:["TOPSIDE-STATUS PRÜFEN","KEINEN BOT-VERLUST ERZWINGEN","ROTATION NUR MIT CALL"],urgent60:["WAVE KLÄREN","CROSSMAP PRÜFEN","NICHT BLIND ROTIEREN"],urgent30:["POSITION HALTEN","BOTLANE-VERLUST ABWÄGEN"],live:["CALLED ROTATION BEFOLGEN","CROSSMAP BEACHTEN"] },
  herald: { type:"herald",label:"RIFT HERALD",spawnTime:900,liveWindowSeconds:90,oneTime:true,eventNames:["HeraldKill","RiftHeraldKill"],info:["Mid-Priority planen","Topside-Eingang prüfen","Crossmap vorbereiten"],prepare:["MID-PRIORITY PRÜFEN","TOPSIDE-EINGANG SICHERN","CROSSMAP-OPTION BEACHTEN"],urgent60:["MID-WAVE ZUERST","VISION GEMEINSAM","NICHT EINZELN FACEchecken"],urgent30:["POSITION HALTEN","CROSSMAP-CALL BEACHTEN"],live:["MID-PRIORITY HALTEN","CROSSMAP BEWUSST SPIELEN"] },
  baron: { type:"baron",label:"BARON",spawnTime:1200,respawnSeconds:360,liveWindowSeconds:120,oneTime:false,eventNames:["BaronKill","Baron_Kill"],info:["Nicht vorher sterben","Recall vorbereiten","Mid-Priority planen"],prepare:["NICHT VORHER STERBEN","CONTROL WARD","MID-PRIORITY","VISION GEMEINSAM"],urgent60:["VISION AUFBAUEN","KEIN BLINDES FACECHECKEN","MID-WAVE HALTEN"],urgent30:["POSITION HALTEN","NICHT ALLEIN WARDEN","ENGAGE ODER PEEL KLÄREN"],live:["VISION HALTEN","NICHT BLIND CHASEN","BARON-CALL BEWUSST"] },
};

export const DEFAULT_MISSION_SETTINGS: MissionSettings = {
  enabled:true,
  soundEnabled:true,
  soundVolume:0.45,
  warningThresholds:[90,60,30,10],
  maxInstructions:4,
  enabledObjectives:{dragon:true,grubs:true,herald:true,baron:true},
  compactMode:false,
  customTitles:{},
};
export const PHASE_MISSIONS = {
  laneStart: { title:"LANE START",instructions:["Wave lesen","Level 2 planen","Jungle-Start merken"] },
  laneControl: { title:"LANE CONTROL",instructions:["Jungle tracken","Hook nur mit Anschluss","Nicht überdehnen"] },
  tempo: { title:"TEMPO",instructions:["Wave zuerst","Gemeinsam resetten","Nächstes Objective prüfen"] },
  baronMap: { title:"BARON MAP",instructions:["Nicht allein sterben","Mid-Wave priorisieren","Gemeinsam Vision setzen"] },
};
