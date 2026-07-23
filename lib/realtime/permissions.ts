import type { DuoCall,MemberRole,SharedState } from "./types";
export type SessionAction="ack_call"|"send_call"|"update_objectives"|"update_summoners"|"update_shared_state";
export const canPerformSessionAction=(role:MemberRole,action:SessionAction)=>role==="heimer"?action==="ack_call":role==="spectator"?false:true;
export function acknowledgeCall(call:DuoCall,displayName:string):DuoCall{return call.acknowledgedBy.includes(displayName)?call:{...call,acknowledgedBy:[...call.acknowledgedBy,displayName]}}
export function companionAcknowledgementState(call:DuoCall,displayName:string,sourceMemberId:string):SharedState{return{call:acknowledgeCall(call,displayName),updatedAt:Date.now(),sourceMemberId}}
