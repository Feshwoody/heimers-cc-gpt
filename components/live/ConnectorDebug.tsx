"use client";
import { useState } from "react";
import type { NormalizedGameData } from "@/lib/realtime/types";
export function ConnectorDebug({game}:{game?:NormalizedGameData}){const [open,setOpen]=useState(false);return <section className="connector-debug"><div className="debug-head"><button onClick={()=>setOpen(x=>!x)}>DEBUG {open?"SCHLIESSEN":"ÖFFNEN"}</button></div>{open&&<div><dl><dt>gameId</dt><dd>{game?.gameId||"–"}</dd><dt>updatedAt</dt><dd>{game?.updatedAt||"–"}</dd><dt>Spieler</dt><dd>{game?.players.length??0}</dd><dt>Aktiver Spieler</dt><dd>{game?.activePlayer?.summonerName||"nicht erkannt"}</dd></dl><pre>{JSON.stringify(game??{status:"waiting"},null,2)}</pre></div>}</section>}
