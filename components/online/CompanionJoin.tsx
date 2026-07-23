"use client";
import { useState } from "react";
export function CompanionJoin({code,onJoin}:{code:string;onJoin:(name:string)=>Promise<void>}){
  const [name,setName]=useState("GS"),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const join=async()=>{setBusy(true);setError("");try{await onJoin(name.trim()||"GS")}catch(e){setError(e instanceof Error?e.message:"Beitritt fehlgeschlagen.");setBusy(false)}};
  return <main className="companion-join"><section><span>SESSION {code}</span><h1>GS COMPANION</h1><p>Einmal Namen bestätigen, danach öffnet dieser Browser die Duo-Ansicht direkt.</p><label>Anzeigename<input value={name} maxLength={40} onChange={e=>setName(e.target.value)}/></label><button disabled={busy} onClick={join}>{busy?"VERBINDE…":"DUO LINK STARTEN"}</button>{error&&<strong>{error}</strong>}</section></main>;
}
