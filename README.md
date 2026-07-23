# MacroBoard – Heimers CC GPT

Mission-Control-Dashboard für League-of-Legends-Duo-Sessions. Die Anwendung kombiniert ein lokal nutzbares MacroBoard, optionale Supabase-Realtime-Sessions und einen separaten Windows-Connector für die lokale League Live Client Data API.

Version: **0.7.4**

Der Matchzustand wird als autoritativer `shared_state.matchState` persistiert. Commander und Companion laden denselben Snapshot bei Join, Refresh und Reconnect; Realtime-Tabellenupdates beschleunigen die Übernahme, der bestehende Poll bleibt Fallback für verpasste Events.

## Installation

Voraussetzungen:

- Node.js 20 oder neuer
- npm
- optional: Supabase-Projekt für Online-Sessions

```powershell
git clone <REPOSITORY_URL>
cd <REPOSITORY_ORDNER>
npm install
Copy-Item .env.example .env.local
```

Trage bei Verwendung des Online-Modus die öffentlichen Supabase-Werte in `.env.local` ein. Ohne diese Werte startet der lokale Modus.

## Entwicklung

```powershell
npm run dev
```

Die Anwendung ist anschließend unter `http://localhost:3000` erreichbar.

Produktions-Build lokal prüfen:

```powershell
npm run build
npm start
```

Healthcheck:

```text
GET http://localhost:3000/api/health
```

Antwort:

```json
{
  "status": "ok",
  "supabase": true,
  "realtime": true,
  "version": "0.7.4"
}
```

`supabase` und `realtime` sind `false`, wenn die erforderlichen Variablen nicht gesetzt wurden.

## Mission Engine V1

Die Mission Engine ist eine reine, regelbasierte Auswertung der echten League-Spielzeit und der bereits normalisierten Live-Client-Events. Sie arbeitet ausschließlich in `CLASSIC` auf Summoner's Rift und erzeugt keine taktischen Aussagen aus Positionen.

Zentrale Objective-Zeiten:

- Dragon: erster Spawn 05:00, Respawn fünf Minuten nach erkanntem Kill
- Void Grubs: einmalige Spawn-Mission bei 08:00
- Rift Herald: einmalige Spawn-Mission bei 15:00
- Baron Nashor: erster Spawn 20:00, Respawn sechs Minuten nach erkanntem Kill

Manuelle Duo-Calls haben immer Vorrang. Objective-Zielzeiten, Korrekturen und bereits abgefeuerte Warnschwellen werden in der Duo-Session synchronisiert; die laufenden Countdowns berechnet jeder Browser lokal. Fehlende Kill-Events führen bewusst zu `RESPAWN UNKNOWN` statt zu einem geschätzten Respawn.

Engine-Tests:

```powershell
npm test
```

## Environment-Dateien

- `.env.example`: Vorlage für Entwicklung und CI
- `.env.local`: lokale Werte; wird niemals committed
- `.env.production`: optionale lokale Production-Werte; wird niemals committed
- `.env.production.example`: Vorlage für Vercel
- `connector/.env.example`: Connector-Konfiguration

Erforderliche Web-App-Werte:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Nur der öffentliche Anon Key gehört in die Web-App. Service-Role-Keys dürfen weder im Browser noch im Connector liegen.

## Supabase

1. Neues Supabase-Projekt erstellen.
2. `supabase/migrations/001_macroboard_sessions.sql` im SQL Editor ausführen.
3. Project URL und Anon Key in Vercel hinterlegen.
4. Realtime für die Migrationstabellen aktiviert lassen.
5. `/api/health` nach dem Deployment prüfen.

Die enthaltenen RLS-Regeln sind für den aktuellen MVP ausgelegt. Vor einer breiten öffentlichen Freigabe sollten authentifizierte Benutzer oder serverseitig signierte RPCs und strengere Policies ergänzt werden.

## Vercel

Das Projekt verwendet den normalen Next.js-App-Router und benötigt keine Rewrites. `vercel.json`:

- markiert das Projekt als Next.js-Anwendung,
- begrenzt die Connector-Funktion auf zehn Sekunden,
- setzt grundlegende Security-Header für API-Antworten.

Deployment:

1. Repository zu GitHub pushen.
2. Repository in Vercel importieren.
3. Framework Preset `Next.js` verwenden.
4. Root Directory unverändert lassen.
5. Supabase-Variablen für `Production`, `Preview` und optional `Development` setzen.
6. deployen und `/api/health` aufrufen.

## Connector

Nach dem Erstellen einer Online-Session sieht ausschließlich der Session-Owner den fertigen GS-Link, den lokal erzeugten QR-Code und einen kopierbaren Connector-Befehl. Der GS öffnet beziehungsweise scannt nur seinen Companion-Link; Session-Code und Connector-Secret müssen dort nicht eingegeben werden. Der Companion zeigt Calls und Objective-Missionen ohne Teams, Debugdaten oder Timersteuerung und kann nach einer Interaktion Ton sowie Display Wake Lock aktivieren.

## Commander und Tablet Companion

Die drei Ansichten teilen dieselbe Session:

- `/session/CODE/commander` für Calls, Timer, Korrekturen und Debug
- `/session/CODE/companion` als reduzierte GS-Empfangsansicht
- `/session/CODE/full` für Entwicklung und Zuschauer

Der Commander erstellt die Session und kopiert im Bereich „SESSION TEILEN“ den tokenfreien GS-Link oder lässt den QR-Code scannen. Beim ersten Öffnen bestätigt GS einmal seinen Anzeigenamen; Rolle und zufällig erzeugter Member-Token werden danach nur lokal in diesem Browser gespeichert. Nach einem Refresh öffnet die Companion-Route wieder dieselbe Rolle.

Auf dem Tablet zuerst „TON AKTIVIEREN“ drücken. Optional können Display Wake Lock und Vollbild aktiviert werden. Wake Lock wird nach einem Sichtbarkeitswechsel erneut angefordert, sofern GS ihn zuvor eingeschaltet hat. Nicht unterstützte Browser laufen ohne diese Funktion weiter. Über das Browsermenü kann die PWA „Always Be Ready“ zum Home-Bildschirm hinzugefügt werden.

Die Companion-Oberfläche kann ausschließlich Calls bestätigen; Timer-, Objective- und sonstige Shared-State-Aktionen werden im Client über die gespeicherte Rolle blockiert. Die vorhandenen MVP-RLS-Regeln erlauben anonymen Tabellenzugriff weiterhin relativ breit. Eine vollständig manipulationssichere serverseitige Rollenabsicherung erfordert künftig signierte RPCs oder authentifizierte Benutzer und ist nicht durch ausgeblendete UI allein gegeben.

### Dynamische Commander-Oberfläche

Die Commander-Route unterscheidet automatisch vier Zustände:

- `prematch`: Session-Links, QR-Code und Connector-Befehl stehen im Vordergrund.
- `ingame`: gültige Connector-Daten mit `gameId` und `gameTime` öffnen ohne Reload das kompakte Control Deck.
- `stale`: nach mehr als zehn Sekunden bleiben die letzten Daten sichtbar, Countdowns werden aber als nicht aktuell markiert.
- `ended`: Missionen und Warnungen stoppen; „NEUES MATCH“ kehrt in den Prematch-Zustand zurück.

Ein neuer `gameId` setzt matchbezogene Flash-Timer zurück. Kurze Connector-Unterbrechungen verursachen dagegen keinen Layout-Reset. Ein erneuter Klick auf einen laufenden Flash-Timer öffnet die Korrektur für `+30`, `-30` oder einen direkten Sekundenwert.

Die Parameter können alternativ über `MACROBOARD_SESSION_CODE`, `MACROBOARD_CONNECTOR_SECRET`, `MACROBOARD_URL` und `CONNECTOR_DISPLAY_NAME` gesetzt werden. CLI-Parameter haben Vorrang. Ohne konfigurierte Base-URL verwenden Web-Einladungen und Connector `https://always-be-ready.de`.

Installation:

```powershell
cd connector
npm install
npm run build
```

Entwicklung:

```powershell
npm run dev -- --session N7K4PX --secret "CONNECTOR_SECRET" --url "https://always-be-ready.de"
```

Produktion:

```powershell
npm run production -- --session N7K4PX --secret "CONNECTOR_SECRET" --url "https://always-be-ready.de"
```

Direkter Start des kompilierten Connectors:

```powershell
npx tsx src/index.ts --session N7K4PX --secret "CONNECTOR_SECRET" --url "https://always-be-ready.de"
```

Mock-Modus aus dem Hauptprojekt:

```powershell
npm run connector:mock -- --session N7K4PX --secret "CONNECTOR_SECRET" --url "http://localhost:3000"
```

Der Connector ist CLI-basiert und für eine spätere Verpackung als `connector.exe` vorbereitet. Eine EXE wird bewusst nicht in Git gespeichert. Sie kann später mit einem geeigneten Node-Packager aus dem kompilierten Einstiegspunkt `connector/dist/index.js` erzeugt werden.

## Deployment

Die vollständige Schritt-für-Schritt-Anleitung steht in [DEPLOYMENT.md](DEPLOYMENT.md).

Kurzfassung:

1. Supabase-Migration ausführen.
2. Repository prüfen und zu GitHub pushen.
3. Vercel-Projekt importieren.
4. Environment Variables setzen.
5. Build und Healthcheck prüfen.
6. Domain verbinden.
7. Connector mit der HTTPS-Produktionsadresse starten.

## Domain

Eine eigene Domain wird in Vercel unter `Project Settings > Domains` verbunden. Nach erfolgreicher DNS-Prüfung sollte ausschließlich die HTTPS-Adresse als `MACROBOARD_URL` beziehungsweise `--url` im Connector verwendet werden.

Beispiel:

```env
MACROBOARD_URL=https://always-be-ready.de
```

## Troubleshooting

### Online-Modus nicht konfiguriert

Prüfe `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Nach Änderungen muss der Entwicklungsserver neu gestartet oder ein neues Vercel-Deployment erstellt werden.

### Healthcheck zeigt `supabase: false`

Die Variablen fehlen in der aktuell ausgeführten Environment. In Vercel zusätzlich prüfen, ob sie der richtigen Umgebung zugeordnet sind.

### Session kann nicht erstellt werden

Prüfe, ob die SQL-Migration vollständig ausgeführt wurde und die Tabellen im Schema `public` existieren.

### Connector meldet „Warte auf laufendes League-Spiel“

Die Live Client Data API ist nur während eines aktiven Spiels unter `127.0.0.1:2999` erreichbar.

### Connector erhält 401

Session-Code oder Connector-Secret stimmen nicht. Das Secret wird nicht über die URL übertragen und nicht protokolliert.

### Connector erhält 404 oder Netzwerkfehler

Prüfe die Produktionsadresse, `/api/health`, DNS und HTTPS. Die `--url`-Angabe darf auf die Domain zeigen, aber nicht auf `/api/connector/push`.

### Data-Dragon-Icons fehlen

Die Matchdaten bleiben als Text lesbar. Icons benötigen eine Internetverbindung zum Riot-CDN.

### Build schlägt nach einem Versionswechsel fehl

```powershell
npm install
npm run build
cd connector
npm install
npm run build
```

## Sicherheit

- `.env.local` und `.env.production` werden ignoriert.
- keine Service-Role-Keys im Browser oder Connector
- Connector-Secrets werden nicht geloggt
- Payloadgröße und Aufrufrate des Connector-Endpunkts sind begrenzt
- `node_modules`, Buildausgaben, lokale Workspace-Dateien und EXE-Dateien werden nicht committed

## Lizenz und Marken

Dieses Projekt ist kein offizielles Riot-Games-Produkt. League of Legends und zugehörige Inhalte sind Marken ihrer jeweiligen Rechteinhaber.
