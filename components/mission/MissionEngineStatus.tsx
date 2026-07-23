"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_MISSION_SETTINGS, OBJECTIVE_CONFIG } from "@/lib/mission/objective-config";
import { runMissionEngine } from "@/lib/mission/mission-engine";
import type { MissionSettings, ObjectiveOverride, ObjectiveType } from "@/lib/mission/types";
import type { DuoCall, NormalizedGameData, SharedState } from "@/lib/realtime/types";

const pad = (value: number) => String(value).padStart(2, "0");
const clock = (seconds?: number) => {
  if (seconds === undefined) return "--:--";
  const value = Math.abs(seconds);
  return `${seconds < 0 ? "+" : ""}${pad(Math.floor(value / 60))}:${pad(value % 60)}`;
};
const labels: Record<ObjectiveType, string> = {
  dragon: "🐉 Dragon",
  grubs: "🟣 Grubs",
  herald: "👁 Herald",
  baron: "🟠 Baron",
};
const objectiveTypes = Object.keys(labels) as ObjectiveType[];
const thresholdBucket = (seconds: number) =>
  seconds <= 0 ? 0 : seconds <= 10 ? 10 : seconds <= 30 ? 30 : seconds <= 60 ? 60 : seconds <= 90 ? 90 : 120;

type Props = {
  game?: NormalizedGameData;
  connectorStatus: "online" | "stale" | "offline" | "ended";
  call?: DuoCall;
  shared?: SharedState["missionEngine"];
  sourceMemberId: string;
  onShare: (state: SharedState) => void;
  onAck: () => void;
};

export function MissionEngineStatus({ game, connectorStatus, call, shared, sourceMemberId, onShare, onAck }: Props) {
  const [settings, setSettings] = useState<MissionSettings>(DEFAULT_MISSION_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [correctionsOpen, setCorrectionsOpen] = useState(false);
  const [fired, setFired] = useState<string[]>([]);
  const interacted = useRef(false);
  const lastGame = useRef("");
  const shareRef = useRef(onShare);
  shareRef.current = onShare;

  const overrides = (shared?.gameId === game?.gameId ? shared?.overrides : {}) as Partial<Record<ObjectiveType, ObjectiveOverride>>;

  useEffect(() => {
    try {
      const stored = localStorage.getItem("macroboard-mission-settings");
      if (stored) setSettings({ ...DEFAULT_MISSION_SETTINGS, ...JSON.parse(stored) });
    } catch {
      // Invalid device-local preferences are ignored.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("macroboard-mission-settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (game?.gameId && lastGame.current !== game.gameId) {
      lastGame.current = game.gameId;
      setFired(shared?.gameId === game.gameId ? shared.firedWarnings ?? [] : []);
    }
  }, [game?.gameId, shared?.firedWarnings, shared?.gameId]);

  const output = useMemo(
    () =>
      game
        ? runMissionEngine({
            gameId: game.gameId,
            gameTime: game.gameTime,
            gameMode: game.gameMode,
            mapName: game.mapName,
            connectorStatus,
            events: game.events,
            manualMission: call
              ? {
                  id: call.id,
                  title: call.text,
                  sourceName: call.source,
                  createdAt: call.timestamp,
                  acknowledged: call.acknowledgedBy.length > 0,
                }
              : undefined,
            overrides,
            settings,
          })
        : undefined,
    [game, connectorStatus, call, overrides, settings],
  );

  const play = (pattern: string) => {
    if (!interacted.current || !settings.soundEnabled) return;
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = new AudioContextClass();
    const tones = pattern === "triple" ? [0, 0.16, 0.32] : pattern === "spawn" ? [0, 0.12, 0.25] : [0, 0.22];
    tones.forEach((delay, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value =
        pattern === "high-double" || pattern === "triple" ? 380 : pattern === "spawn" ? 260 + index * 80 : 205;
      gain.gain.setValueAtTime(0.1 * settings.soundVolume, context.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + delay + 0.12);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(context.currentTime + delay);
      oscillator.stop(context.currentTime + delay + 0.13);
    });
  };

  useEffect(() => {
    const mission = output?.mission;
    if (!game || !output || !mission?.soundPattern || mission.source === "manual") return;
    const bucket = thresholdBucket(mission.countdownSeconds ?? 0);
    if (bucket !== 0 && !settings.warningThresholds.includes(bucket)) return;
    const key = `${mission.id}:${bucket === 0 ? "live" : bucket}`;
    if (fired.includes(key) || shared?.firedWarnings?.includes(key)) return;
    const nextFired = [...new Set([...fired, key])];
    setFired(nextFired);
    play(mission.soundPattern);
    shareRef.current({
      missionEngine: {
        gameId: game.gameId,
        overrides: shared?.overrides ?? {},
        firedWarnings: nextFired,
        activeMissionId: mission.id,
        objectiveTargets: Object.fromEntries(output.objectives.filter((item) => item.targetTime !== undefined).map((item) => [item.type, item.targetTime])),
        objectiveKills: output.kills,
      },
      updatedAt: Date.now(),
      sourceMemberId,
    });
  }, [output?.mission, fired, game, settings.warningThresholds, shared?.firedWarnings, shared?.overrides, sourceMemberId]);

  const shareOverrides = (next: Partial<Record<ObjectiveType, ObjectiveOverride>>) => {
    if (!game) return;
    onShare({
      missionEngine: {
        gameId: game.gameId,
        overrides: next as Record<string, ObjectiveOverride>,
        firedWarnings: [...new Set([...(shared?.firedWarnings ?? []), ...fired])],
        activeMissionId: output?.mission?.id,
        objectiveTargets: Object.fromEntries((output?.objectives ?? []).filter((item) => item.targetTime !== undefined).map((item) => [item.type, item.targetTime])),
        objectiveKills: output?.kills,
      },
      updatedAt: Date.now(),
      sourceMemberId,
    });
  };
  const correct = (type: ObjectiveType, mode: ObjectiveOverride["mode"], targetTime?: number) =>
    shareOverrides({ ...overrides, [type]: { mode, targetTime, updatedAt: Date.now() } });
  const patchSettings = (patch: Partial<MissionSettings>) => setSettings((current) => ({ ...current, ...patch }));

  if (!game)
    return (
      <section className="engine-card engine-off">
        <h2>MISSION ENGINE</h2>
        <strong>WARTET AUF MATCH</strong>
      </section>
    );
  if (connectorStatus === "ended")
    return (
      <section className="engine-card engine-off">
        <h2>MISSION ENGINE</h2>
        <strong>MATCH BEENDET</strong>
      </section>
    );
  if (!output?.supported)
    return (
      <section className="engine-card engine-off">
        <h2>MISSION ENGINE</h2>
        <strong>MODUS NICHT UNTERSTÜTZT</strong>
        <p>Nur CLASSIC · Summoner&apos;s Rift</p>
      </section>
    );

  const mission = output.mission;
  return (
    <section
      className={`engine-shell severity-${mission?.severity ?? "calm"} ${settings.compactMode ? "engine-compact" : ""}`}
      onPointerDown={() => {
        interacted.current = true;
      }}
    >
      <div className="engine-card">
        <div className="engine-kicker">
          <span>{mission?.source === "manual" ? "MANUELLER DUO-CALL" : "MISSION ENGINE · AUTO"}</span>
          <button aria-label="Mission Engine Einstellungen" onClick={() => setSettingsOpen((open) => !open)}>
            ⚙
          </button>
        </div>
        <div className="engine-main">
          <div>
            <h2>{mission?.title ?? "TEMPO"}</h2>
            {mission?.countdownSeconds !== undefined && <strong>{clock(mission.countdownSeconds)}</strong>}
            {mission?.source === "manual" && <em>CALL VON {call?.source.toUpperCase()}</em>}
          </div>
          <ul>
            {mission?.instructions.slice(0, settings.maxInstructions).map((instruction) => (
              <li key={instruction}>{instruction}</li>
            ))}
          </ul>
          {mission?.source === "manual" && (
            <button className="engine-ack" onClick={onAck}>
              VERSTANDEN
            </button>
          )}
        </div>
      </div>

      <div className="objective-strip">
        <div className="objective-strip-label">NEXT OBJECTIVES</div>
        {output.objectives.map((objective) => (
          <div key={objective.type} className={`objective-chip chip-${objective.status}`}>
            <span>{labels[objective.type]}</span>
            <strong>
              {objective.status === "taken"
                ? "TAKEN"
                : objective.status === "respawn-unknown"
                  ? "RESPAWN UNKNOWN"
                  : objective.status === "irrelevant"
                    ? "NICHT RELEVANT"
                    : objective.status === "live"
                      ? "LIVE"
                      : clock(objective.countdownSeconds)}
            </strong>
            <em>{objective.automatic ? "AUTO" : "MANUELL KORRIGIERT"}</em>
          </div>
        ))}
      </div>

      <button className="correction-toggle" onClick={() => setCorrectionsOpen((open) => !open)}>
        {correctionsOpen ? "KORREKTUREN SCHLIESSEN" : "OBJECTIVES KORRIGIEREN"}
      </button>
      {correctionsOpen && (
        <div className="objective-corrections">
          {output.objectives.map((objective) => (
            <div key={objective.type}>
              <strong>{OBJECTIVE_CONFIG[objective.type].label}</strong>
              <button onClick={() => correct(objective.type, "manual", (objective.targetTime ?? game.gameTime) + 30)}>+30</button>
              <button onClick={() => correct(objective.type, "manual", (objective.targetTime ?? game.gameTime) - 30)}>-30</button>
              <button
                onClick={() => {
                  const value = prompt("Zielzeit in Spielsekunden", String(objective.targetTime ?? game.gameTime));
                  if (value !== null && Number.isFinite(Number(value))) correct(objective.type, "manual", Number(value));
                }}
              >
                ZEIT SETZEN
              </button>
              <button onClick={() => correct(objective.type, "taken")}>GENOMMEN</button>
              <button onClick={() => correct(objective.type, "irrelevant")}>NICHT RELEVANT</button>
              <button onClick={() => correct(objective.type, "auto")}>AUTO</button>
            </div>
          ))}
        </div>
      )}

      {settingsOpen && (
        <div className="engine-settings">
          <label>
            <input type="checkbox" checked={settings.enabled} onChange={(event) => patchSettings({ enabled: event.target.checked })} />
            Engine aktiv
          </label>
          <label>
            <input type="checkbox" checked={settings.soundEnabled} onChange={(event) => patchSettings({ soundEnabled: event.target.checked })} />
            Sound aktiv
          </label>
          <label>
            <input type="checkbox" checked={settings.compactMode} onChange={(event) => patchSettings({ compactMode: event.target.checked })} />
            Kompaktmodus
          </label>
          <label>
            Lautstärke
            <input type="range" min="0" max="1" step="0.05" value={settings.soundVolume} onChange={(event) => patchSettings({ soundVolume: Number(event.target.value) })} />
          </label>
          <label>
            Max. Anweisungen
            <input type="number" min="2" max="4" value={settings.maxInstructions} onChange={(event) => patchSettings({ maxInstructions: Number(event.target.value) })} />
          </label>
          <fieldset>
            <legend>Warnzeitpunkte</legend>
            {[120, 90, 60, 30, 10].map((threshold) => (
              <label key={threshold}>
                <input
                  type="checkbox"
                  checked={settings.warningThresholds.includes(threshold)}
                  onChange={(event) =>
                    patchSettings({
                      warningThresholds: event.target.checked
                        ? [...settings.warningThresholds, threshold]
                        : settings.warningThresholds.filter((value) => value !== threshold),
                    })
                  }
                />
                {threshold}s
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Objectives</legend>
            {objectiveTypes.map((type) => (
              <label key={type}>
                <input
                  type="checkbox"
                  checked={settings.enabledObjectives[type]}
                  onChange={(event) =>
                    patchSettings({ enabledObjectives: { ...settings.enabledObjectives, [type]: event.target.checked } })
                  }
                />
                {OBJECTIVE_CONFIG[type].label}
              </label>
            ))}
          </fieldset>
          <div className="engine-custom-titles">
            {objectiveTypes.map((type) => (
              <label key={type}>
                Warntext {OBJECTIVE_CONFIG[type].label}
                <input
                  value={settings.customTitles[type] ?? ""}
                  placeholder={OBJECTIVE_CONFIG[type].label}
                  onChange={(event) => patchSettings({ customTitles: { ...settings.customTitles, [type]: event.target.value } })}
                />
              </label>
            ))}
          </div>
          <div className="engine-sound-tests">
            {["low-double", "double", "high-double", "triple", "spawn"].map((pattern) => (
              <button key={pattern} onClick={() => play(pattern)}>
                TEST {pattern.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
