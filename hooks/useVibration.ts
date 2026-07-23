"use client";
import { useCallback,useState } from "react";
export function useVibration(){const supported=typeof navigator!=="undefined"&&"vibrate" in navigator,[enabled,setEnabled]=useState(true);const vibrate=useCallback((urgent=false)=>{if(enabled&&supported)navigator.vibrate(urgent?[80,60,80]:80)},[enabled,supported]);return{supported,enabled,setEnabled,vibrate}}
