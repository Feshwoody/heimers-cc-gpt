"use client";
import { useCallback,useEffect,useRef,useState } from "react";
type WakeSentinel={release:()=>Promise<void>;addEventListener?:(type:"release",listener:()=>void)=>void};
export function useScreenWakeLock(){
  const supported=typeof navigator!=="undefined"&&"wakeLock" in navigator,[active,setActive]=useState(false),requested=useRef(false),sentinel=useRef<WakeSentinel|null>(null);
  const request=useCallback(async()=>{requested.current=true;if(!supported)return false;try{sentinel.current=await (navigator as Navigator&{wakeLock:{request:(type:"screen")=>Promise<WakeSentinel>}}).wakeLock.request("screen");setActive(true);sentinel.current.addEventListener?.("release",()=>setActive(false));return true}catch{setActive(false);return false}},[supported]);
  useEffect(()=>{const visible=()=>{if(document.visibilityState==="visible"&&requested.current&&!active)void request()};document.addEventListener("visibilitychange",visible);return()=>document.removeEventListener("visibilitychange",visible)},[active,request]);
  return {supported,active,request};
}
