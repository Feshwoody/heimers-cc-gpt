export type ObjectiveType = "dragon" | "grubs" | "herald" | "baron";
export type MissionType = "lane" | ObjectiveType | "manual";
export type MissionSeverity = "calm" | "info" | "prepare" | "urgent" | "live";
export type MissionSource = "engine" | "manual";
export type ObjectiveStatus = "upcoming" | "prepare" | "urgent" | "live" | "taken" | "respawn-unknown" | "irrelevant";

export type LiveObjectiveEvent = { name: string; time: number; killerName?: string; id?: string };
export type ManualMission = { id: string; title: string; sourceName: string; createdAt: number; acknowledged?: boolean; instructions?: string[] };
export type ObjectiveOverride = { mode: "auto" | "manual" | "taken" | "irrelevant"; targetTime?: number; updatedAt: number };
export type ObjectiveKill = { objective: ObjectiveType; eventId: string; killTime: number; respawnTime?: number; source: "live-client" };
export type ObjectiveCycle = { type: ObjectiveType; targetTime?: number; countdownSeconds?: number; status: ObjectiveStatus; automatic: boolean; kill?: ObjectiveKill };
export type Mission = { id: string; type: MissionType; priority: number; severity: MissionSeverity; title: string; countdownSeconds?: number; instructions: string[]; soundPattern?: string; createdAt: string; expiresAt?: string; source: MissionSource };
export type MissionSettings = {
  enabled: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  warningThresholds: number[];
  maxInstructions: number;
  enabledObjectives: Record<ObjectiveType, boolean>;
  compactMode: boolean;
  customTitles: Partial<Record<ObjectiveType, string>>;
};
export type MissionEngineInput = { gameId: string; gameTime: number; gameMode: string; mapName: string; connectorStatus: "online" | "stale" | "offline" | "ended"; events: LiveObjectiveEvent[]; manualMission?: ManualMission; overrides?: Partial<Record<ObjectiveType, ObjectiveOverride>>; settings?: Partial<MissionSettings>; now?: number };
export type MissionEngineOutput = { supported: boolean; mission?: Mission; objectives: ObjectiveCycle[]; kills: ObjectiveKill[]; processedEventIds: string[]; gameId: string };
