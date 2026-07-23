"use client";
import { useEffect, useState } from "react";

let cachedVersion = "15.14.1";
export function useDataDragonVersion() {
  const [version,setVersion]=useState(cachedVersion);
  useEffect(()=>{fetch("https://ddragon.leagueoflegends.com/api/versions.json").then(r=>r.ok?r.json():Promise.reject()).then((v:string[])=>{if(v[0]){cachedVersion=v[0];setVersion(v[0])}}).catch(()=>{})},[]);
  return version;
}
const championKey=(name:string)=>({Wukong:"MonkeyKing",NunuWillump:"Nunu",RenataGlasc:"Renata",BelVeth:"Belveth",KaiSa:"Kaisa",ChoGath:"Chogath",VelKoz:"Velkoz",KhaZix:"Khazix",LeBlanc:"Leblanc"}[name.replace(/[^a-zA-Z]/g,"")]??name.replace(/[^a-zA-Z]/g,""));
const spellKey=(name:string)=>({Flash:"SummonerFlash",Heal:"SummonerHeal",Ignite:"SummonerDot",Teleport:"SummonerTeleport",Exhaust:"SummonerExhaust",Cleanse:"SummonerBoost",Ghost:"SummonerHaste",Barrier:"SummonerBarrier",Smite:"SummonerSmite"}[name]??name.replace(/\s/g,""));
export function DataDragonIcon({type,name,id,size=44}:{type:"champion"|"spell"|"item";name:string;id?:number;size?:number}) {
  const version=useDataDragonVersion();const [failed,setFailed]=useState(false);
  const file=type==="champion"?`${championKey(name)}.png`:type==="spell"?`${spellKey(name)}.png`:`${id}.png`;
  const src=`https://ddragon.leagueoflegends.com/cdn/${version}/img/${type}/${file}`;
  if(failed||(!name&&type!=="item")||(type==="item"&&!id))return <span className="dd-fallback" style={{width:size,height:size}}>{name.slice(0,2).toUpperCase()||"?"}</span>;
  return <img className="dd-icon" width={size} height={size} src={src} alt={name} title={name} onError={()=>setFailed(true)}/>;
}
