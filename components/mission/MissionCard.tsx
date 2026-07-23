import type { Alert, TimerState } from "@/lib/types";

const pad = (n: number) => String(n).padStart(2, "0");
const clock = (ms: number) => `${pad(Math.floor(ms / 60000))}:${pad(Math.ceil((ms % 60000) / 1000))}`;

export function MissionCard({ alert, timer, phase, close }: { alert?: Alert; timer?: TimerState; phase: string; close: () => void }) {
  const urgent = !!alert || (timer?.running && timer.remainingMs <= 30000);
  const tone = alert?.tone === "danger" ? "danger" : alert ? "attention" : timer?.running && timer.remainingMs <= 60000 ? "urgent" : "stable";
  const title = alert?.title ?? (timer?.running ? timer.name.toUpperCase() : phase === "lane" ? "LANE KONTROLLE" : phase === "teamfight" ? "FIGHT VORBEREITEN" : phase === "baron" ? "BARON FOKUS" : "OBJECTIVE SETUP");
  const detail = alert?.detail ?? (timer?.running ? (timer.name === "Drake" ? "RESET\nCONTROL WARD\nMID PUSH" : "RESET\nVISION\nSETUP") : phase === "lane" ? "WAVE LESEN\nJUNGLE TRACKEN\nNICHT ÜBERDEHNEN" : phase === "baron" ? "VISION\nSETUP\nKEIN RANDOM FIGHT" : "WIN CONDITION PRÜFEN");
  return (
    <section key={`${title}-${timer?.remainingMs ?? 0}`} className={`mission-card mission-${tone} ${urgent ? "mission-pulse" : ""}`}>
      <div className="mission-kicker"><span>NÄCHSTE AKTION</span><span className={`status-dot status-${tone}`} /></div>
      {alert && <button aria-label="Warnung schließen" onClick={close} className="mission-close">×</button>}
      <div className="mission-content">
        <div className="mission-symbol">{alert ? "⚠" : timer?.name === "Drake" ? "◈" : timer?.name === "Baron" ? "◆" : "◎"}</div>
        <div><h2>{title}</h2>{timer?.running && !alert && <div className="mission-time">{clock(timer.remainingMs)}</div>}<p>{detail}</p></div>
      </div>
    </section>
  );
}
