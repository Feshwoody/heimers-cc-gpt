import type { MemberRole } from "./realtime/types";
export type StoredSessionIdentity={memberId:string;memberToken:string;displayName:string;role:MemberRole;companion?:boolean};
export type StoredSession={code:string;identity:StoredSessionIdentity};
export const ACTIVE_SESSION_KEY="macroboard-active-session";
export const identityKey=(code:string)=>`macroboard-session-${code}`;
export const connectorKey=(code:string)=>`macroboard-connector-${code}`;
export function storeSession(storage:Pick<Storage,"setItem">,code:string,identity:StoredSessionIdentity){storage.setItem(identityKey(code),JSON.stringify(identity));storage.setItem(ACTIVE_SESSION_KEY,code)}
export function findStoredSession(storage:Pick<Storage,"getItem"|"length"|"key">):StoredSession|undefined{
  const active=storage.getItem(ACTIVE_SESSION_KEY);const candidates=active?[identityKey(active)]:Array.from({length:storage.length},(_,index)=>storage.key(index)??"").filter(key=>key.startsWith("macroboard-session-"));
  for(const key of candidates){try{const raw=storage.getItem(key);if(raw)return{code:key.replace("macroboard-session-",""),identity:JSON.parse(raw) as StoredSessionIdentity}}catch{}}
}
export function clearSession(local:Pick<Storage,"removeItem"|"getItem">,session:Pick<Storage,"removeItem">,code:string){local.removeItem(identityKey(code));if(local.getItem(ACTIVE_SESSION_KEY)===code)local.removeItem(ACTIVE_SESSION_KEY);session.removeItem(connectorKey(code))}
export const routeForStoredSession=(stored:StoredSession)=>`/session/${stored.code}/${stored.identity.role==="support"?"commander":stored.identity.role==="heimer"?"companion":"full"}`;
