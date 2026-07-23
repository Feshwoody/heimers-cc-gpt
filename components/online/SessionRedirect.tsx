"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { MemberRole } from "@/lib/realtime/types";
import { viewForRole } from "@/lib/realtime/session-role";
export function SessionRedirect({code}:{code:string}){const router=useRouter();useEffect(()=>{try{const raw=localStorage.getItem(`macroboard-session-${code}`),role=(raw?JSON.parse(raw).role:null) as MemberRole|null;router.replace(`/session/${code}/${viewForRole(role)}`)}catch{router.replace(`/session/${code}/full`)}},[code,router]);return <main className="min-h-screen grid place-items-center bg-black font-black">ANSICHT WIRD GELADEN…</main>}
