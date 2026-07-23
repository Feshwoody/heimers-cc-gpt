import { parseConnectorConfig } from "./cli.js";
import { getLiveGame } from "./live-client.js";
import { mockGameData } from "./mock-data.js";
import { normalizeGameData } from "./normalize-game-data.js";
import { pushGameData } from "./session-client.js";

const { sessionCode, secret, url, displayName, mock } = parseConnectorConfig(process.argv.slice(2));

if (!sessionCode || !secret) {
  console.error("Session-Code und Connector-Secret fehlen.");
  process.exit(1);
}

let running = true;
let matchActive = false;
let lastMessage = "";
let failures = 0;
const started = Date.now();
const status = (message: string) => {
  if (message !== lastMessage) {
    console.log(message);
    lastMessage = message;
  }
};

process.on("SIGINT", async () => {
  running = false;
  if (matchActive) await pushGameData(url, sessionCode, secret, undefined, true).catch(() => {});
  console.log("\nConnector beendet.");
  process.exit(0);
});

console.log(`${displayName} startet für Session ${sessionCode}.`);
while (running) {
  try {
    const data = mock ? mockGameData(started) : normalizeGameData(await getLiveGame());
    await pushGameData(url, sessionCode, secret, data);
    matchActive = true;
    failures = 0;
    status(`MATCH ERKANNT · ${data.activePlayer.championName} · ${Math.floor(data.gameTime)}s`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch {
    failures += 1;
    if (matchActive) {
      await pushGameData(url, sessionCode, secret, undefined, true).catch(() => {});
      matchActive = false;
      status("Match beendet oder Live Client nicht mehr erreichbar");
    } else {
      status(mock ? "Übertragung fehlgeschlagen" : "Warte auf laufendes League-Spiel");
    }
    await new Promise((resolve) => setTimeout(resolve, Math.min(10000, 2000 * Math.max(1, failures))));
  }
}
