"use client";
import { useEffect,useMemo,useState } from "react";
import QRCode from "qrcode";
const DEFAULT_BASE_URL="https://always-be-ready.de";
export function SessionOwnerTools({code,connectorSecret}:{code:string;connectorSecret:string;companionToken?:string}){
  const [qrCode,setQrCode]=useState(""),[copied,setCopied]=useState("");
  const baseUrl=(process.env.NEXT_PUBLIC_MACROBOARD_URL||DEFAULT_BASE_URL).replace(/\/$/,"");
  const links=useMemo(()=>({commander:`${baseUrl}/session/${code}/commander`,companion:`${baseUrl}/session/${code}/companion`,full:`${baseUrl}/session/${code}/full`}),[baseUrl,code]);
  const connectorCommand=`npx tsx src/index.ts --session ${code} --secret "${connectorSecret}" --url "${baseUrl}"`;
  useEffect(()=>{QRCode.toDataURL(links.companion,{errorCorrectionLevel:"M",margin:2,width:280}).then(setQrCode).catch(()=>setQrCode(""))},[links.companion]);
  const copy=async(label:string,value:string)=>{await navigator.clipboard.writeText(value);setCopied(label);window.setTimeout(()=>setCopied(""),1600)};
  return <section className="owner-tools"><div><span>SESSION TEILEN · {code}</span><h2>GS verbinden & Connector starten</h2><p>Die Ansichtslinks enthalten nur Session-Code und Route. Secret und Mitgliedszugänge bleiben lokal.</p><div className="owner-links"><button onClick={()=>copy("commander",links.commander)}>COMMANDER-LINK</button><button onClick={()=>copy("full",links.full)}>FULL-LINK</button></div></div><div className="owner-actions"><button onClick={()=>copy("link",links.companion)}>{copied==="link"?"KOPIERT":"GS-LINK KOPIEREN"}</button><button onClick={()=>copy("command",connectorCommand)}>{copied==="command"?"KOPIERT":"CONNECTOR-BEFEHL KOPIEREN"}</button></div><div className="owner-qr">{qrCode?<img src={qrCode} alt={`QR-Code für GS-Session ${code}`}/>:<span>QR-CODE WIRD ERSTELLT</span>}<strong>QR-CODE</strong><small>Mit Tablet, Handy oder zweitem PC scannen.</small></div></section>;
}
