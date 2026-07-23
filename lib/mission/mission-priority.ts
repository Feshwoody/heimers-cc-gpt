import type { Mission } from "./types";
export const priorityFor = (source: Mission["source"], countdown?: number) => {
  if (source === "manual") return 1000;
  if (countdown === undefined || countdown <= 0) return 900;
  if (countdown <= 30) return 800;
  if (countdown <= 60) return 700;
  if (countdown <= 90) return 600;
  if (countdown <= 120) return 500;
  return 100;
};
export const selectMission = (missions: Mission[]) => [...missions].sort((a,b)=>b.priority-a.priority)[0];
