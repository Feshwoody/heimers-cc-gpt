import type { SharedTimer } from "@/lib/realtime/types";

const durations:Record<string,number>={Flash:300,Ignite:180,Exhaust:240,Heal:240,Barrier:180,Cleanse:210,Ghost:210,Teleport:360,Smite:90};
const slug=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
export const summonerTimerId=(playerId:string,spell:string)=>`summoner-${slug(playerId)}-${slug(spell)}`;
export const spellDuration=(spell:string)=>durations[spell]??300;
export const remainingSeconds=(timer:SharedTimer|undefined,now=Date.now())=>timer?.running&&timer.targetTimestamp?Math.max(0,Math.ceil((timer.targetTimestamp-now)/1000)):0;
export const timerLabel=(timer:SharedTimer|undefined,now=Date.now())=>{
  const remaining=remainingSeconds(timer,now);
  if(!remaining)return"READY";
  return remaining<=30?"BALD READY":"COOLDOWN";
};
export function startSummonerTimer(playerId:string,spell:string,sourceMemberId:string,now=Date.now()):SharedTimer{
  const seconds=spellDuration(spell);
  return{id:summonerTimerId(playerId,spell),targetTimestamp:now+seconds*1000,pausedRemaining:seconds*1000,running:true,updatedAt:now,sourceMemberId};
}
export function correctSummonerTimer(timer:SharedTimer,action:"+30"|"-30"|"ready"|number,now=Date.now()):SharedTimer{
  if(action==="ready")return{...timer,targetTimestamp:null,pausedRemaining:0,running:false,updatedAt:now};
  const current=remainingSeconds(timer,now),seconds=typeof action==="number"?Math.max(0,action):action==="+30"?current+30:Math.max(0,current-30);
  return{...timer,targetTimestamp:seconds?now+seconds*1000:null,pausedRemaining:seconds*1000,running:seconds>0,updatedAt:now};
}
