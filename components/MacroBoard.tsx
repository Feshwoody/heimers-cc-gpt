"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { defaultSettings, objectiveNames, summoners as initialSummoners } from "@/lib/defaults";
import type { Alert, GameSetup, LogEntry, Phase, Preset, Settings, StoredState, SummonerState, TimerState } from "@/lib/types";
import { MissionCard } from "@/components/mission/MissionCard";
import { ObjectiveTimers } from "@/components/mission/ObjectiveTimers";
import { WinConditionPanel } from "@/components/mission/WinConditionPanel";
import { SummonerStatus } from "@/components/mission/SummonerStatus";
import type { NormalizedGameData, SharedState } from "@/lib/realtime/types";

const STORAGE = "macroboard-v1";
const pad = (n: number) => String(n).padStart(2, "0");
const clock = (seconds: number) => `${pad(Math.floor(seconds / 60))}:${pad(Math.max(0, Math.ceil(seconds % 60)))}`;
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const cloneSettings = (s: Settings): Settings => JSON.parse(JSON.stringify(s));
const initialSetup: GameSetup = { role: "Support", champion: "Nautilus", adc: "Heimerdinger", enemies: ["", "", "", "", ""], spells: ["Flash", "Ignite"] };

function Icon({ name }: { name: string }) {
  const icons: Record<string, string> = { play: "▶", pause: "Ⅱ", reset: "↻", close: "×", gear: "⚙", full: "⛶", download: "⇩", upload: "↑" };
  return <span aria-hidden>{icons[name] ?? "•"}</span>;
}

export function MacroBoard({ remoteState, onSharedState, sourceMemberId = "local", readOnly = false, liveGame, relevantSummoners }: { remoteState?: SharedState; onSharedState?: (state: SharedState) => void; sourceMemberId?: string; readOnly?: boolean; liveGame?: NormalizedGameData; relevantSummoners?: string[] } = {}) {
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<Phase>("lane");
  const [settings, setSettings] = useState<Settings>(cloneSettings(defaultSettings));
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [timers, setTimers] = useState<TimerState[]>(objectiveNames.map((name) => ({ id: name.toLowerCase().replace(" ", "-"), name, endAt: null, remainingMs: 0, running: false, fired: [] })));
  const [summoners, setSummoners] = useState<SummonerState[]>(initialSummoners);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [matchStart, setMatchStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [mode, setMode] = useState<"ENGAGE" | "PEEL">("PEEL");
  const [winCon, setWinCon] = useState("Heimer");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [setup, setSetup] = useState<GameSetup>(initialSetup);
  const [presets, setPresets] = useState<Preset[]>([{ id: "default", name: "Heimer + Nautilus", settings: cloneSettings(defaultSettings) }]);
  const [activePreset, setActivePreset] = useState("default");
  const [focusMode, setFocusMode] = useState(false);
  const [booting, setBooting] = useState(false);
  const [target, setTarget] = useState("Jinx");
  const [avoid, setAvoid] = useState("Maokai");
  const interacted = useRef(false);
  const lastRemote = useRef(0);
  const emitShared = useCallback((state: Omit<SharedState, "updatedAt" | "sourceMemberId">) => {
    if (!onSharedState || readOnly) return;
    onSharedState({ ...state, updatedAt: Date.now(), sourceMemberId });
  }, [onSharedState, readOnly, sourceMemberId]);

  useEffect(() => {
    if (!remoteState || remoteState.sourceMemberId === sourceMemberId || remoteState.updatedAt <= lastRemote.current) return;
    lastRemote.current = remoteState.updatedAt;
    if (remoteState.phase) setPhase(remoteState.phase as Phase);
    if (remoteState.mode === "ENGAGE" || remoteState.mode === "PEEL") setMode(remoteState.mode);
    if (remoteState.winCondition) setWinCon(remoteState.winCondition);
    if (remoteState.checks) setChecks(remoteState.checks);
    if (remoteState.matchStartedAt !== undefined) setMatchStart(remoteState.matchStartedAt);
    if (remoteState.timers) setTimers((current) => current.map((timer) => {
      const incoming = remoteState.timers?.find((item) => item.id === timer.id);
      if (!incoming) return timer;
      return { ...timer, endAt: incoming.targetTimestamp, remainingMs: incoming.running && incoming.targetTimestamp ? Math.max(0, incoming.targetTimestamp - Date.now()) : incoming.pausedRemaining, running: incoming.running, fired: [] };
    }));
  }, [remoteState, sourceMemberId]);

  useEffect(() => {
    if (!liveGame?.players?.length) return;
    const enemies=liveGame.players.filter(player=>player.team!==liveGame.activePlayer.team);
    const flashUsers=enemies.filter(player=>[player.summonerSpells.spell1,player.summonerSpells.spell2].includes("Flash"));
    setSummoners(current=>current.map((tracker,index)=>{
      if(index<5&&flashUsers[index]) return {...tracker,name:`${flashUsers[index].championName} Flash`};
      const spellKey=tracker.id;
      const user=enemies.find(player=>[player.summonerSpells.spell1,player.summonerSpells.spell2].some(spell=>spell.toLowerCase()===spellKey));
      return user?{...tracker,name:`${user.championName} ${user.summonerSpells.spell1.toLowerCase()===spellKey?user.summonerSpells.spell1:user.summonerSpells.spell2}`} : tracker;
    }));
  }, [liveGame]);

  const log = useCallback((label: string) => {
    const seconds = matchStart ? Math.floor((Date.now() - matchStart) / 1000) : 0;
    setLogs((old) => [...old, { at: seconds, label, timestamp: new Date().toISOString() }]);
  }, [matchStart]);

  const sound = useCallback((kind: "objective" | "alert" = "objective") => {
    if (!settings.sound || !interacted.current) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    [0, .22].forEach((delay) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = "sine"; osc.frequency.setValueAtTime(kind === "alert" ? 420 : 210, ctx.currentTime + delay);
      gain.gain.setValueAtTime(settings.volume * .16, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + delay + .14);
      osc.connect(gain).connect(ctx.destination); osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + .15);
    });
  }, [settings.sound, settings.volume]);

  const warn = useCallback((title: string, detail?: string, tone: Alert["tone"] = "danger", label?: string) => {
    const id = uid();
    setAlerts((old) => [...old, { id, title, detail, tone }]); sound(title.includes("MID") || title.includes("SUPPORT") ? "alert" : "objective"); log(label ?? title);
    window.setTimeout(() => setAlerts((old) => old.filter((item) => item.id !== id)), 6500);
  }, [log, sound]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const data = JSON.parse(raw) as StoredState;
        if (data.settings) setSettings(data.settings);
        if (data.presets?.length) setPresets(data.presets);
        if (data.activePreset) setActivePreset(data.activePreset);
        if (data.setup) setSetup(data.setup);
        if (data.logs) setLogs(data.logs);
      }
    } catch { /* ignore invalid local data */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE, JSON.stringify({ settings, presets, activePreset, setup, logs } satisfies StoredState));
  }, [hydrated, settings, presets, activePreset, setup, logs]);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      if (matchStart) setElapsed(Math.floor((now - matchStart) / 1000));
      setTimers((old) => old.map((timer) => {
        if (!timer.running || !timer.endAt) return timer;
        const remainingMs = Math.max(0, timer.endAt - now);
        const seconds = Math.ceil(remainingMs / 1000);
        const crossed = settings.thresholds.filter((t) => seconds <= t && !timer.fired.includes(t));
        if (crossed.length) {
          crossed.forEach((threshold) => {
            const isDrake = timer.name === "Drake";
            if (isDrake && threshold === 90) warn(settings.warningTexts.drake90, "1. RESET · 2. CONTROL WARD · 3. MID PUSH · 4. GEMEINSAM RIVER · 5. HEIMER SETUP", "warn", "Drake-90-Warnung");
            else if (isDrake && threshold === 30) warn(settings.warningTexts.drake30, undefined, "danger", "Drake-30-Warnung");
            else warn(`${timer.name.toUpperCase()} IN ${threshold}`, undefined, "warn", `${timer.name}-${threshold}-Warnung`);
          });
        }
        if (remainingMs === 0) {
          warn(timer.name === "Drake" ? settings.warningTexts.drakeLive : `${timer.name.toUpperCase()} LIVE`, undefined, "danger", `${timer.name} live`);
          return { ...timer, remainingMs: 0, running: false, endAt: null, fired: [...timer.fired, ...crossed] };
        }
        return { ...timer, remainingMs, fired: [...timer.fired, ...crossed] };
      }));
      setSummoners((old) => old.map((s) => s.endAt && s.endAt <= now ? { ...s, endAt: null } : s));
    };
    const id = window.setInterval(tick, 250); tick();
    return () => clearInterval(id);
  }, [matchStart, settings.thresholds, settings.warningTexts, warn]);

  useEffect(() => {
    if (!matchStart) return;
    if (elapsed === 720 || elapsed === 1200) setPhase("objective");
  }, [elapsed, matchStart]);

  const laneClick = useCallback((label: string) => {
    if (readOnly) return;
    interacted.current = true; log(label);
    if (label.toLowerCase().includes("mid ss")) warn(settings.warningTexts.mid, undefined, "danger", "Mid SS");
  }, [log, readOnly, settings.warningTexts.mid, warn]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) return;
      const key = e.key.toLowerCase();
      if (e.code === "Space") { e.preventDefault(); setAlerts((a) => a.slice(0, -1)); return; }
      if (key === settings.hotkeys.drake) setPhase("objective");
      if (key === settings.hotkeys.mid) laneClick("Mid SS");
      if (key === settings.hotkeys.jungle) laneClick("Jungle Bot");
      if (key === settings.hotkeys.reset) laneClick("Reset");
      if (key === settings.hotkeys.peel) { setMode("PEEL"); log("Peel"); }
      if (key === settings.hotkeys.engage) { setMode("ENGAGE"); log("Engage"); }
    };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, [laneClick, log, settings.hotkeys]);

  const updateTimer = (id: string, fn: (t: TimerState) => TimerState) => setTimers((old) => old.map((t) => t.id === id ? fn(t) : t));
  const addTime = (id: string, seconds: number) => {
    if (readOnly) return;
    interacted.current = true;
    updateTimer(id, (t) => ({ ...t, remainingMs: t.remainingMs + seconds * 1000, endAt: t.running ? Date.now() + t.remainingMs + seconds * 1000 : null, fired: [] }));
    log(`${objectiveNames.find((n) => n.toLowerCase().replace(" ", "-") === id)} +${seconds}`);
    const next = timers.map(t => t.id === id ? { ...t, remainingMs: t.remainingMs + seconds * 1000, endAt: t.running ? Date.now() + t.remainingMs + seconds * 1000 : null } : t);
    emitShared({ timers: next.map(t => ({ id: t.id, targetTimestamp: t.endAt, pausedRemaining: t.remainingMs, running: t.running, updatedAt: Date.now(), sourceMemberId })) });
  };
  const toggleTimer = (id: string) => updateTimer(id, (t) => {
    if (readOnly) return t;
    interacted.current = true;
    const running = !t.running;
    log(`${t.name} ${running ? "gestartet" : "pausiert"}`);
    const next = { ...t, running, endAt: running ? Date.now() + t.remainingMs : null };
    emitShared({ timers: timers.map(x => x.id === id ? next : x).map(x => ({ id: x.id, targetTimestamp: x.endAt, pausedRemaining: x.remainingMs, running: x.running, updatedAt: Date.now(), sourceMemberId })) });
    return next;
  });
  const resetTimer = (id: string) => { if (readOnly) return; updateTimer(id, (t) => ({ ...t, running: false, endAt: null, remainingMs: 0, fired: [] })); emitShared({ timers: timers.map(x => x.id === id ? { ...x, running:false,endAt:null,remainingMs:0 } : x).map(x => ({ id:x.id,targetTimestamp:x.endAt,pausedRemaining:x.remainingMs,running:x.running,updatedAt:Date.now(),sourceMemberId })) }); };
  const startSummoner = (id: string) => setSummoners((old) => old.map((s) => {
    if (s.id !== id) return s; const endAt = Date.now() + s.duration * 1000; log(s.name); return { ...s, endAt };
  }));

  const exportLog = (format: "json" | "txt") => {
    const content = format === "json" ? JSON.stringify(logs, null, 2) : logs.map((x) => `${clock(x.at)} ${x.label}`).join("\n");
    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `macroboard-log.${format}`; a.click(); URL.revokeObjectURL(a.href);
  };
  const newMatch = () => { setMatchStart(null); setElapsed(0); setLogs([]); setAlerts([]); setChecks({}); setTimers((t) => t.map((x) => ({ ...x, endAt: null, remainingMs: 0, running: false, fired: [] }))); setSummoners((s) => s.map((x) => ({ ...x, endAt: null }))); };
  const startMatch = () => {
    if (readOnly) return;
    interacted.current = true; setBooting(true);
    window.setTimeout(() => {
      const startedAt=Date.now(); setBooting(false); setPhase("lane"); setMatchStart(startedAt); setElapsed(0); emitShared({phase:"lane",matchStartedAt:startedAt});
      setLogs([{ at: 0, label: "Match gestartet", timestamp: new Date().toISOString() }]);
    }, 2100);
  };

  const activeTimer = useMemo(() => timers.filter(t => t.running).sort((a,b)=>a.remainingMs-b.remainingMs)[0], [timers]);
  const activeAlert = alerts.at(-1);

  if (!hydrated) return <main className="min-h-screen grid place-items-center bg-[#08080b]"><div className="text-fuchsia-400 tracking-[.4em]">MACROBOARD LÄDT</div></main>;

  if (booting) return <main className="boot-screen"><div className="boot-mark">CC</div><div className="boot-lines"><strong>CC GPT ONLINE</strong><strong>MISSION INITIALISIERT</strong><strong>GOOD LUCK</strong></div></main>;

  return (
    <main className={`min-h-screen grid-bg p-3 md:p-6 ${focusMode ? "focus-mode" : ""}`} style={{ fontSize: `${settings.fontScale}rem` }} onPointerDown={() => { interacted.current = true; }}>
      <header className="main-header panel mb-6 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="h-11 w-2 rounded-full bg-fuchsia-500 shadow-[0_0_22px_#d946ef]" />
          <div><p className="text-xs font-black tracking-[.42em] text-fuchsia-400">MACROBOARD</p><h1 className="text-2xl md:text-3xl font-black tracking-tight">HEIMERS CC GPT</h1></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-3 flex items-center gap-2 text-xs font-bold tracking-widest text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />CC GPT ONLINE</div>
          <button className="rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/10 px-4 py-3 font-bold" onClick={matchStart ? () => setMatchStart(null) : startMatch}>{matchStart ? `MATCH ${clock(elapsed)}` : "Match starten"}</button>
          <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-3" onClick={newMatch}>Neues Match</button>
          <button className={`rounded-xl border px-4 py-3 font-bold ${focusMode?"border-emerald-400/40 bg-emerald-400/10 text-emerald-300":"border-white/10 bg-white/5"}`} onClick={()=>setFocusMode(x=>!x)}>LEFT SCREEN</button>
          <button aria-label="Vollbild" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3" onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()}><Icon name="full" /></button>
        </div>
      </header>

      <MissionCard alert={activeAlert} timer={activeTimer} phase={elapsed >= 1200 ? "baron" : phase} close={()=>activeAlert&&setAlerts(a=>a.filter(x=>x.id!==activeAlert.id))} />
      <WinConditionPanel winCon={winCon} mode={mode} target={target} avoid={avoid} setTarget={setTarget} setAvoid={setAvoid} />

      <div className="main-grid grid gap-6 xl:grid-cols-[minmax(0,1.85fr)_minmax(360px,1fr)]">
        <section className="active-control min-w-0">
          <nav className="phase-nav mb-5 grid grid-cols-3 gap-2 panel p-2">
            {(["lane","objective","teamfight"] as Phase[]).map((p) => <button disabled={readOnly} key={p} onClick={() => {setPhase(p);emitShared({phase:p})}} className={`rounded-xl px-2 py-4 text-sm md:text-lg font-black tracking-widest transition ${phase === p ? "bg-fuchsia-500 text-white shadow-[0_0_25px_rgba(217,70,239,.25)]" : "text-zinc-400 hover:bg-white/5"}`}>{p.toUpperCase()}</button>)}
          </nav>
          {!focusMode && phase === "lane" && <Lane settings={settings} onClick={laneClick} compact={settings.compact} />}
          {(phase === "objective" || focusMode) && <ObjectiveTimers focus={focusMode} timers={timers} onAdd={addTime} onToggle={toggleTimer} onReset={resetTimer} onDirect={(id, sec) => updateTimer(id, (t) => ({ ...t, remainingMs: sec * 1000, endAt: t.running ? Date.now() + sec * 1000 : null, fired: [] }))} />}
          {!focusMode && phase === "teamfight" && <Teamfight mode={mode} setMode={(m) => { if(readOnly)return;setMode(m);log(m);emitShared({mode:m}); }} winCon={winCon} setWinCon={(w)=>{if(readOnly)return;setWinCon(w);emitShared({winCondition:w})}} checks={checks} setChecks={setChecks} />}
          <SummonerStatus relevantNames={relevantSummoners} flashOnly={focusMode} items={summoners} onStart={startSummoner} onReset={(id) => setSummoners((s) => s.map((x) => x.id === id ? { ...x, endAt: null } : x))} />
        </section>

        <aside className="side-panel space-y-4">
          <Alerts alerts={alerts} close={(id) => setAlerts((a) => a.filter((x) => x.id !== id))} />
          <Checklist checks={checks} setChecks={setChecks} />
          <Activity logs={logs} onExport={exportLog} onClear={() => setLogs([])} />
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setSetupOpen(true)} className="rounded-xl bg-white/5 border border-white/10 py-4 font-bold">Game Setup</button>
            <button onClick={() => setSettingsOpen(true)} className="rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 py-4 font-bold"><Icon name="gear" /> Einstellungen</button>
          </div>
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-center text-xl font-black tracking-[.12em] text-amber-300">OBJECTIVES &gt; KILLS</div>
        </aside>
      </div>
      {settingsOpen && <SettingsModal settings={settings} setSettings={setSettings} close={() => setSettingsOpen(false)} presets={presets} setPresets={setPresets} active={activePreset} applyPreset={(id) => { const p=presets.find(x=>x.id===id); if(p){setActivePreset(id);setSettings(cloneSettings(p.settings));} }} sound={sound} />}
      {setupOpen && <SetupModal setup={setup} setSetup={setSetup} close={() => setSetupOpen(false)} />}
    </main>
  );
}

function Lane({ settings, onClick, compact }: { settings: Settings; onClick: (s:string)=>void; compact:boolean }) {
  return <section className="panel glow p-4 md:p-6"><div className="mb-5"><p className="text-xs font-black tracking-[.3em] text-fuchsia-400">AKTIVE SPIELSTEUERUNG</p><h2 className="text-3xl font-black">Lane Control</h2></div><div className={`grid gap-3 ${compact ? "grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3"}`}>{settings.actions.filter(a=>a.visible).map((a) => <button key={a.id} onClick={()=>onClick(a.label)} className="min-h-24 rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-800 to-zinc-900 px-4 py-5 text-lg font-black hover:border-fuchsia-400 hover:bg-fuchsia-950 active:scale-[.98]">{a.label}{a.hotkey && <span className="block mt-2 text-xs text-zinc-500">{a.hotkey.toUpperCase()}</span>}</button>)}</div></section>;
}

function Objectives({ timers, onAdd, onToggle, onReset, onDirect }: { timers:TimerState[]; onAdd:(id:string,s:number)=>void; onToggle:(id:string)=>void; onReset:(id:string)=>void; onDirect:(id:string,s:number)=>void }) {
  return <section className="grid gap-4 lg:grid-cols-2">{timers.map(t=><article key={t.id} className={`panel p-5 ${t.remainingMs===0&&t.fired.length?"pulse-live border-red-500/50":""}`}><div className="flex items-center justify-between"><h3 className="text-2xl font-black">{t.name}</h3><span className={`text-xs font-bold tracking-widest ${t.running?"text-emerald-400":"text-zinc-500"}`}>{t.running?"LÄUFT":"BEREIT"}</span></div><div className="my-5 font-mono text-6xl font-black tracking-tight">{clock(t.remainingMs/1000)}</div><div className="grid grid-cols-3 gap-2">{[30,60,90].map(s=><button key={s} className="rounded-lg bg-white/5 border border-white/10 py-3 font-bold" onClick={()=>onAdd(t.id,s)}>+{s}s</button>)}</div><div className="mt-2 flex gap-2"><button disabled={t.remainingMs<=0} onClick={()=>onToggle(t.id)} className="flex-1 rounded-lg bg-fuchsia-600 disabled:opacity-30 py-3 font-bold"><Icon name={t.running?"pause":"play"} /> {t.running?"Pause":"Start"}</button><button onClick={()=>onReset(t.id)} className="rounded-lg border border-white/10 px-4"><Icon name="reset" /></button><input aria-label={`Direkte Zeit für ${t.name} in Sekunden`} type="number" min="0" placeholder="Sek." className="w-24 rounded-lg bg-black/30 border border-white/10 px-3" onChange={e=>onDirect(t.id,Number(e.target.value)||0)} /></div></article>)}</section>;
}

function Teamfight({mode,setMode,winCon,setWinCon,checks,setChecks}:{mode:"ENGAGE"|"PEEL";setMode:(m:"ENGAGE"|"PEEL")=>void;winCon:string;setWinCon:(s:string)=>void;checks:Record<string,boolean>;setChecks:React.Dispatch<React.SetStateAction<Record<string,boolean>>>}) {
  const qs=["Ist Heimer in Reichweite?","Sind Heimer-Türme aufgebaut?","Lebt der gegnerische Diver?","Ist das Ziel erreichbar?","Hook auf Carry oder nur Tank?","Nach Fight: Baron, Drake, Tower oder Reset?"];
  return <section className="panel p-5"><div className="grid grid-cols-2 gap-3">{(["ENGAGE","PEEL"] as const).map(m=><button key={m} onClick={()=>setMode(m)} className={`min-h-28 rounded-2xl text-3xl font-black ${mode===m?(m==="ENGAGE"?"bg-red-600":"bg-fuchsia-600"):"bg-white/5 text-zinc-500"}`}>{m}</button>)}</div><h3 className="mt-6 mb-3 text-sm font-black tracking-widest text-zinc-400">WIN CONDITION</h3><div className="grid grid-cols-4 gap-2">{["Heimer","Mid","Top","Jungle"].map(x=><button key={x} onClick={()=>setWinCon(x)} className={`rounded-xl py-4 font-bold ${winCon===x?"bg-fuchsia-500":"bg-white/5"}`}>{x}</button>)}</div><div className="mt-6 grid gap-2">{qs.map(q=><Check key={q} label={q} checked={!!checks[q]} onChange={()=>setChecks(c=>({...c,[q]:!c[q]}))}/>)}</div></section>;
}

function SummonerTracker({items,settings,onStart,onReset}:{items:SummonerState[];settings:Settings;onStart:(id:string)=>void;onReset:(id:string)=>void}) {
  const now=Date.now(); return <section className="panel mt-4 p-5"><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-black tracking-[.3em] text-fuchsia-400">MANUELL</p><h2 className="text-2xl font-black">Summoner-Tracker</h2></div></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{items.map(s=>{const left=s.endAt?Math.max(0,(s.endAt-now)/1000):0;return <button key={s.id} onClick={()=>left?onReset(s.id):onStart(s.id)} className={`rounded-xl border p-3 text-left ${left?"border-fuchsia-500/40 bg-fuchsia-500/10":"border-emerald-500/20 bg-emerald-500/5"}`}><span className="block text-sm font-bold">{s.name}</span><span className={`mt-2 block font-mono text-xl font-black ${left?"text-fuchsia-300":"text-emerald-400"}`}>{left?clock(left):"VERFÜGBAR"}</span><span className="text-[10px] text-zinc-500">{left?"Klicken zum Reset":`${Math.round((settings.summonerDefaults[s.id.includes("flash")?"flash":s.id]??s.duration)/60)} Min. Cooldown`}</span></button>})}</div></section>;
}

function Alerts({alerts,close}:{alerts:Alert[];close:(id:string)=>void}) { return <div className="space-y-2">{alerts.slice(-3).map(a=><article key={a.id} className={`rounded-2xl border p-5 ${a.tone==="danger"?"border-red-500/60 bg-red-500/15":a.tone==="warn"?"border-amber-400/50 bg-amber-400/10":"border-fuchsia-400/50 bg-fuchsia-400/10"}`}><div className="flex gap-3 justify-between"><div><p className="text-xl font-black">{a.title}</p>{a.detail&&<p className="mt-2 whitespace-pre-line text-sm font-bold leading-6 text-zinc-200">{a.detail.replaceAll(" · ","\n")}</p>}</div><button aria-label="Warnung schließen" onClick={()=>close(a.id)} className="h-9 w-9 shrink-0 rounded-full bg-black/30 text-xl"><Icon name="close"/></button></div></article>)}</div> }
function Check({label,checked,onChange}:{label:string;checked:boolean;onChange:()=>void}) { return <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${checked?"border-fuchsia-500/30 bg-fuchsia-500/10 text-zinc-400":"border-white/5 bg-white/[.03]"}`}><input type="checkbox" checked={checked} onChange={onChange} className="h-5 w-5 accent-fuchsia-500"/><span className={checked?"line-through":""}>{label}</span></label> }
function Checklist({checks,setChecks}:{checks:Record<string,boolean>;setChecks:React.Dispatch<React.SetStateAction<Record<string,boolean>>>}) { const groups={LANE:["Level 2 bewusst?","Jungle bekannt?","Hook mit Anschluss?"],VISION:["Control Ward?","Nicht allein warden?"],OBJECTIVE:["90 Sekunden vorher resetten","Objective vor Chase"],TEAMFIGHT:["Engage oder Peel?","Win Condition schützen","Nicht blind den Tank hooken"]}; return <section className="panel p-5"><p className="text-xs font-black tracking-[.3em] text-fuchsia-400">NAUTILUS</p><h2 className="mb-4 text-2xl font-black">Kurzcheckliste</h2>{Object.entries(groups).map(([g,items])=><div key={g} className="mb-4"><h3 className="mb-2 text-xs font-black tracking-widest text-zinc-500">{g}</h3><div className="space-y-1">{items.map(x=><Check key={x} label={x} checked={!!checks[x]} onChange={()=>setChecks(c=>({...c,[x]:!c[x]}))}/>)}</div></div>)}</section> }
function Activity({logs,onExport,onClear}:{logs:LogEntry[];onExport:(f:"json"|"txt")=>void;onClear:()=>void}) { return <section className="panel p-5"><div className="flex justify-between"><h2 className="text-xl font-black">Aktivitätsprotokoll</h2><span className="text-xs text-zinc-500">{logs.length} Events</span></div><div className="my-3 max-h-40 overflow-auto font-mono text-sm">{logs.length?logs.slice().reverse().map((x,i)=><div key={`${x.timestamp}-${i}`} className="border-b border-white/5 py-2"><span className="mr-3 text-fuchsia-400">{clock(x.at)}</span>{x.label}</div>):<p className="py-4 text-zinc-600">Noch keine Aktivität.</p>}</div><div className="flex gap-2"><button onClick={()=>onExport("json")} className="rounded-lg bg-white/5 px-3 py-2 text-sm">JSON</button><button onClick={()=>onExport("txt")} className="rounded-lg bg-white/5 px-3 py-2 text-sm">TXT</button><button onClick={onClear} className="ml-auto rounded-lg text-red-400 px-3 py-2 text-sm">Löschen</button></div></section> }

function Modal({title,close,children}:{title:string;close:()=>void;children:React.ReactNode}) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><section className="panel max-h-[94vh] w-full max-w-5xl overflow-auto p-5 md:p-7"><div className="sticky top-0 z-10 mb-6 flex items-center justify-between bg-[#17161d]/95 py-2"><h2 className="text-2xl font-black">{title}</h2><button className="h-11 w-11 rounded-full bg-white/5 text-2xl" onClick={close}><Icon name="close"/></button></div>{children}</section></div> }
function Field({label,children}:{label:string;children:React.ReactNode}) { return <label className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-500">{label}</span>{children}</label> }
const inputClass="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3";

function SettingsModal({settings,setSettings,close,presets,setPresets,active,applyPreset,sound}:{settings:Settings;setSettings:React.Dispatch<React.SetStateAction<Settings>>;close:()=>void;presets:Preset[];setPresets:React.Dispatch<React.SetStateAction<Preset[]>>;active:string;applyPreset:(id:string)=>void;sound:()=>void}) {
  const updateText=(k:keyof Settings["warningTexts"],v:string)=>setSettings(s=>({...s,warningTexts:{...s.warningTexts,[k]:v}}));
  const duplicate=()=>{const p={id:uid(),name:`${presets.find(x=>x.id===active)?.name??"Preset"} Kopie`,settings:cloneSettings(settings)};setPresets(x=>[...x,p]);};
  return <Modal title="Anpassungsmodus" close={close}><div className="grid gap-6 lg:grid-cols-2"><div className="space-y-5"><div><h3 className="mb-3 font-black text-fuchsia-400">PRESETS</h3><div className="flex gap-2"><select value={active} onChange={e=>applyPreset(e.target.value)} className={inputClass}>{presets.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><button onClick={duplicate} className="rounded-xl bg-white/5 px-4">Duplizieren</button></div><div className="mt-2 flex gap-2"><button className="text-sm text-zinc-400" onClick={()=>setPresets(ps=>ps.map(p=>p.id===active?{...p,name:prompt("Neuer Name",p.name)||p.name}:p))}>Umbenennen</button>{active!=="default"&&<button className="text-sm text-red-400" onClick={()=>setPresets(ps=>ps.filter(p=>p.id!==active))}>Löschen</button>}<button className="ml-auto text-sm text-fuchsia-400" onClick={()=>setPresets(ps=>ps.map(p=>p.id===active?{...p,settings:cloneSettings(settings)}:p))}>Preset speichern</button></div></div><div><h3 className="mb-3 font-black text-fuchsia-400">WARNUNGEN</h3><div className="space-y-3">{Object.entries(settings.warningTexts).map(([k,v])=><Field key={k} label={k}><input className={inputClass} value={v} onChange={e=>updateText(k as keyof Settings["warningTexts"],e.target.value)}/></Field>)}</div></div><Field label="Warnschwellen (Sekunden, Komma-getrennt)"><input className={inputClass} value={settings.thresholds.join(", ")} onChange={e=>setSettings(s=>({...s,thresholds:e.target.value.split(",").map(Number).filter(n=>n>0).sort((a,b)=>b-a)}))}/></Field><div className="grid grid-cols-2 gap-3"><Field label="Warnton"><button className={`${inputClass} text-left`} onClick={()=>setSettings(s=>({...s,sound:!s.sound}))}>{settings.sound?"Aktiviert":"Deaktiviert"}</button></Field><Field label={`Lautstärke ${Math.round(settings.volume*100)}%`}><input type="range" min="0" max="1" step=".05" value={settings.volume} onChange={e=>setSettings(s=>({...s,volume:Number(e.target.value)}))} className="w-full mt-3 accent-fuchsia-500"/></Field></div><button onClick={sound} className="rounded-xl bg-fuchsia-600 px-5 py-3 font-bold">Test-Sound</button></div><div className="space-y-5"><div><h3 className="mb-3 font-black text-fuchsia-400">ANSICHT</h3><div className="grid grid-cols-2 gap-3"><Field label="Schriftgröße"><select className={inputClass} value={settings.fontScale} onChange={e=>setSettings(s=>({...s,fontScale:Number(e.target.value)}))}><option value=".9">Klein</option><option value="1">Standard</option><option value="1.12">Sehr groß</option></select></Field><Field label="Dichte"><select className={inputClass} value={settings.compact?"compact":"large"} onChange={e=>setSettings(s=>({...s,compact:e.target.value==="compact"}))}><option value="large">Groß</option><option value="compact">Kompakt</option></select></Field></div></div><div><h3 className="mb-3 font-black text-fuchsia-400">QUICK ACTIONS</h3><div className="space-y-2">{settings.actions.map(a=><div key={a.id} className="grid grid-cols-[auto_1fr_70px] gap-2"><input type="checkbox" checked={a.visible} onChange={()=>setSettings(s=>({...s,actions:s.actions.map(x=>x.id===a.id?{...x,visible:!x.visible}:x)}))} className="h-6 w-6 mt-3 accent-fuchsia-500"/><input className={inputClass} value={a.label} onChange={e=>setSettings(s=>({...s,actions:s.actions.map(x=>x.id===a.id?{...x,label:e.target.value}:x)}))}/><input maxLength={1} placeholder="Key" className={inputClass} value={a.hotkey??""} onChange={e=>setSettings(s=>({...s,actions:s.actions.map(x=>x.id===a.id?{...x,hotkey:e.target.value.toLowerCase()}:x)}))}/></div>)}</div><button className="mt-2 rounded-xl bg-white/5 px-4 py-3" onClick={()=>setSettings(s=>({...s,actions:[...s.actions,{id:uid(),label:"Neue Aktion",visible:true,custom:true}]}))}>+ Eigener Button</button></div><div><h3 className="mb-3 font-black text-fuchsia-400">HOTKEYS</h3><div className="grid grid-cols-2 gap-2">{Object.entries(settings.hotkeys).map(([k,v])=><Field key={k} label={k}><input maxLength={1} className={inputClass} value={v} onChange={e=>setSettings(s=>({...s,hotkeys:{...s.hotkeys,[k]:e.target.value.toLowerCase()}}))}/></Field>)}</div><p className="mt-2 text-xs text-zinc-500">Leertaste schließt immer die letzte Warnung. Hotkeys sind in Eingabefeldern deaktiviert.</p></div><div><h3 className="mb-3 font-black text-fuchsia-400">SUMMONER-STANDARDWERTE (SEK.)</h3><div className="grid grid-cols-2 gap-2">{Object.entries(settings.summonerDefaults).map(([k,v])=><Field key={k} label={k}><input type="number" className={inputClass} value={v} onChange={e=>setSettings(s=>({...s,summonerDefaults:{...s.summonerDefaults,[k]:Number(e.target.value)}}))}/></Field>)}</div></div></div></div></Modal>;
}

function SetupModal({setup,setSetup,close}:{setup:GameSetup;setSetup:React.Dispatch<React.SetStateAction<GameSetup>>;close:()=>void}) {
  const read=(file?:File)=>{if(!file)return;const r=new FileReader();r.onload=()=>setSetup(s=>({...s,image:String(r.result)}));r.readAsDataURL(file);};
  const champs=["Nautilus","Heimerdinger","Jinx","Kai'Sa","Ezreal","Leona","Thresh","Vi","Ahri","Garen"];
  return <Modal title="Game Setup" close={close}><div className="grid gap-6 lg:grid-cols-2"><div onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();read(e.dataTransfer.files[0])}} className="grid min-h-80 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-fuchsia-500/30 bg-fuchsia-500/5 text-center">{setup.image?<img src={setup.image} alt="Screenshot-Vorschau" className="max-h-[460px] w-full object-contain"/>:<label className="cursor-pointer p-8"><div className="text-5xl text-fuchsia-400"><Icon name="upload"/></div><p className="mt-4 text-xl font-black">Screenshot hochladen</p><p className="mt-2 text-zinc-500">oder hier hineinziehen</p><input type="file" accept="image/*" className="hidden" onChange={e=>read(e.target.files?.[0])}/></label>}</div><div className="space-y-4"><div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-amber-200">Automatische Erkennung folgt in V1</div><div className="grid grid-cols-2 gap-3"><Field label="Eigene Rolle"><select className={inputClass} value={setup.role} onChange={e=>setSetup(s=>({...s,role:e.target.value}))}>{["Support","ADC","Mid","Top","Jungle"].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Eigener Champion"><select className={inputClass} value={setup.champion} onChange={e=>setSetup(s=>({...s,champion:e.target.value}))}>{champs.map(x=><option key={x}>{x}</option>)}</select></Field></div><Field label="ADC"><select className={inputClass} value={setup.adc} onChange={e=>setSetup(s=>({...s,adc:e.target.value}))}>{champs.map(x=><option key={x}>{x}</option>)}</select></Field><h3 className="pt-2 font-black text-fuchsia-400">GEGNERISCHE CHAMPIONS</h3><div className="grid grid-cols-2 gap-2">{setup.enemies.map((x,i)=><select key={i} className={inputClass} value={x} onChange={e=>setSetup(s=>({...s,enemies:s.enemies.map((v,j)=>j===i?e.target.value:v)}))}><option value="">Slot {i+1}</option>{champs.map(c=><option key={c}>{c}</option>)}</select>)}</div><h3 className="pt-2 font-black text-fuchsia-400">SUMMONER SPELLS</h3><div className="grid grid-cols-2 gap-2">{[0,1].map(i=><select key={i} className={inputClass} value={setup.spells[i]} onChange={e=>setSetup(s=>({...s,spells:s.spells.map((v,j)=>j===i?e.target.value:v)}))}>{["Flash","Ignite","Exhaust","Heal","Cleanse","Teleport"].map(x=><option key={x}>{x}</option>)}</select>)}</div><p className="text-sm text-emerald-400">Alle Angaben werden automatisch lokal gespeichert.</p></div></div></Modal>;
}
