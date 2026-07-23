import type { MemberRole } from "./types";
export type SessionView="commander"|"companion"|"full";
export const viewForRole=(role:MemberRole|null|undefined):SessionView=>role==="support"?"commander":role==="heimer"?"companion":"full";
