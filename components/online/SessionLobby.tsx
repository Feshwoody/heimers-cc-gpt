"use client";
import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient, isOnlineConfigured } from "@/lib/supabase/client";
import { createSessionCode, createToken, sha256 } from "@/lib/session-utils";
import type { MemberRole } from "@/lib/realtime/types";
import { findStoredSession,routeForStoredSession,storeSession,type StoredSession } from "@/lib/session-management";

const input = "rounded-xl border border-white/10 bg-black/30 px-4 py-3";
export function SessionLobby() {
  const router = useRouter(); const configured = isOnlineConfigured();
  const [tab,setTab]=useState<"create"|"join">("create"); const [name,setName]=useState("Duo Queue");
  const [display,setDisplay]=useState("President Supp"); const [role,setRole]=useState<MemberRole>("support");
  const [code,setCode]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);const [previous,setPrevious]=useState<StoredSession>();
  useEffect(()=>setPrevious(findStoredSession(localStorage)),[]);
  const saveIdentity=(sessionCode:string,memberId:string,token:string)=>storeSession(localStorage,sessionCode,{memberId,memberToken:token,displayName:display,role});
  const create=async()=>{const client=getSupabaseBrowserClient();if(!client)return;setBusy(true);setError("");
    const sessionCode=createSessionCode(),ownerToken=createToken(),memberToken=createToken(),secret=createToken(),secretHash=await sha256(secret);
    const {data:s,error:e}=await client.from("macroboard_sessions").insert({code:sessionCode,name,owner_token:ownerToken,shared_state:{connectorSecretHash:secretHash,updatedAt:Date.now()}}).select("id").single();
    if(e||!s){setError(e?.message??"Session konnte nicht erstellt werden.");setBusy(false);return}
    const {data:m,error:me}=await client.from("macroboard_members").insert({session_id:s.id,display_name:display,member_token:memberToken,role}).select("id").single();
    if(me||!m){setError(me?.message??"Mitglied konnte nicht erstellt werden.");setBusy(false);return}
    saveIdentity(sessionCode,m.id,memberToken);sessionStorage.setItem(`macroboard-connector-${sessionCode}`,secret);router.push(`/session/${sessionCode}/commander`);
  };
  const join=async()=>{const client=getSupabaseBrowserClient();if(!client)return;setBusy(true);setError("");const normalized=code.toUpperCase().trim();
    const {data:s}=await client.from("macroboard_sessions").select("id,expires_at").eq("code",normalized).maybeSingle();
    if(!s){setError("Session-Code nicht gefunden.");setBusy(false);return}if(new Date(s.expires_at).getTime()<Date.now()){setError("Diese Session ist abgelaufen.");setBusy(false);return}
    const token=createToken();const {data:m,error:e}=await client.from("macroboard_members").insert({session_id:s.id,display_name:display,member_token:token,role}).select("id").single();
    if(e||!m){setError(e?.message??"Beitritt fehlgeschlagen.");setBusy(false);return}saveIdentity(normalized,m.id,token);router.push(`/session/${normalized}`);
  };
  if(!configured)return <div className="mx-auto mb-5 max-w-7xl rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-3 text-center font-bold text-amber-200">LOKALER MODUS · Online-Modus nicht konfiguriert – lokaler Modus aktiv.</div>;
  if(previous)return <section className="stored-session panel"><div><span>VORHERIGE SESSION GEFUNDEN</span><strong>{previous.code}</strong></div><button onClick={()=>router.push(routeForStoredSession(previous))}>WIEDER VERBINDEN</button><button onClick={()=>{setPrevious(undefined);setTab("create")}}>NEUE SESSION</button></section>;
  return <section className="mx-auto mb-6 max-w-7xl panel p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black tracking-[.3em] text-emerald-400">DUO LINK VERFÜGBAR</p><h2 className="text-2xl font-black">Online Duo Session</h2></div><div className="flex gap-2"><button onClick={()=>setTab("create")} className={`rounded-xl px-4 py-3 font-bold ${tab==="create"?"bg-fuchsia-600":"bg-white/5"}`}>Session erstellen</button><button onClick={()=>setTab("join")} className={`rounded-xl px-4 py-3 font-bold ${tab==="join"?"bg-fuchsia-600":"bg-white/5"}`}>Beitreten</button></div></div><div className="mt-4 grid gap-3 md:grid-cols-4">{tab==="create"&&<input className={input} value={name} onChange={e=>setName(e.target.value)} placeholder="Session-Name"/>}{tab==="join"&&<input className={`${input} uppercase tracking-[.3em]`} maxLength={6} value={code} onChange={e=>setCode(e.target.value)} placeholder="N7K4PX"/>}<input className={input} value={display} onChange={e=>setDisplay(e.target.value)} placeholder="Anzeigename"/><select className={input} value={role} onChange={e=>setRole(e.target.value as MemberRole)}><option value="support">Support</option><option value="heimer">Heimer</option><option value="spectator">Zuschauer</option></select><button disabled={busy} onClick={tab==="create"?create:join} className="rounded-xl bg-emerald-600 px-5 py-3 font-black disabled:opacity-50">{busy?"VERBINDE…":tab==="create"?"SESSION STARTEN":"SESSION BEITRETEN"}</button></div>{error&&<p className="mt-3 text-red-400">{error}</p>}</section>;
}
