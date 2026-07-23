import type { Settings, SummonerState } from "./types";
export const laneActions = [
  "Level 2 vorbereiten", "Jungle Top", "Jungle Bot", "Mid SS", "Support SS",
  "Reset", "Roam Mid", "ADC schützen", "All-in bereit",
].map((label, i) => ({ id: `lane-${i}`, label, visible: true }));
export const defaultSettings: Settings = {
  sound: true, volume: .35, thresholds: [90, 60, 30, 10], fontScale: 1, compact: false,
  warningTexts: {
    mid: "MID FEHLT – NICHT ÜBERDEHNEN",
    drake90: "DRAKE IN 90",
    drake30: "KEIN RANDOM FIGHT – POSITION HALTEN",
    drakeLive: "DRAKE LIVE",
  },
  hotkeys: { drake: "d", mid: "m", jungle: "j", reset: "r", peel: "p", engage: "e" },
  actions: laneActions,
  summonerDefaults: { flash: 300, heal: 240, ignite: 180, teleport: 360, exhaust: 240, cleanse: 240 },
};
export const summoners: SummonerState[] = [
  ["adc-flash", "Gegner ADC Flash", "flash"], ["support-flash", "Gegner Support Flash", "flash"],
  ["mid-flash", "Gegner Mid Flash", "flash"], ["jungle-flash", "Gegner Jungle Flash", "flash"],
  ["top-flash", "Gegner Top Flash", "flash"], ["heal", "Heal", "heal"], ["ignite", "Ignite", "ignite"],
  ["teleport", "Teleport", "teleport"], ["exhaust", "Exhaust", "exhaust"], ["cleanse", "Cleanse", "cleanse"],
].map(([id,name,key]) => ({ id, name, duration: defaultSettings.summonerDefaults[key], endAt: null }));
export const objectiveNames = ["Drake", "Baron", "Void Grubs", "Herald"];
