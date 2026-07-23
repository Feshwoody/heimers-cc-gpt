export type Phase = "lane" | "objective" | "teamfight";
export type Alert = { id: string; title: string; detail?: string; tone?: "danger" | "warn" | "info" };
export type TimerState = { id: string; name: string; endAt: number | null; remainingMs: number; running: boolean; fired: number[] };
export type ActionConfig = { id: string; label: string; visible: boolean; hotkey?: string; custom?: boolean };
export type LogEntry = { at: number; label: string; timestamp: string };
export type SummonerState = { id: string; name: string; duration: number; endAt: number | null };
export type Settings = {
  sound: boolean; volume: number; thresholds: number[]; fontScale: number; compact: boolean;
  warningTexts: { mid: string; drake90: string; drake30: string; drakeLive: string };
  hotkeys: Record<string, string>; actions: ActionConfig[]; summonerDefaults: Record<string, number>;
};
export type Preset = { id: string; name: string; settings: Settings };
export type GameSetup = { image?: string; role: string; champion: string; adc: string; enemies: string[]; spells: string[] };
export type StoredState = { settings: Settings; presets: Preset[]; activePreset: string; setup: GameSetup; logs: LogEntry[] };
