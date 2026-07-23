# MacroBoard League Connector

Kleiner Node.js-Connector für Windows. Er liest ausschließlich die lokale Riot Live Client Data API während eines laufenden Spiels und sendet normalisierte Matchdaten an eine MacroBoard-Session.

## Entwicklung

```powershell
npm install
npm run dev -- --session N7K4PX --secret "CONNECTOR_SECRET" --url "https://always-be-ready.de"
```

## Produktion

```powershell
npm run build
npm run production -- --session N7K4PX --secret "CONNECTOR_SECRET" --url "https://always-be-ready.de"
```

Direkte Ausführung:

```powershell
npx tsx src/index.ts --session N7K4PX --secret "CONNECTOR_SECRET" --url "https://always-be-ready.de"
```

CLI-Werte haben Vorrang vor den optionalen Environment Variables:

```env
MACROBOARD_SESSION_CODE=N7K4PX
MACROBOARD_CONNECTOR_SECRET=CONNECTOR_SECRET
MACROBOARD_URL=https://always-be-ready.de
CONNECTOR_DISPLAY_NAME=MacroBoard Connector
```

Ohne konfigurierte URL wird `https://always-be-ready.de` verwendet. Das Secret wird weder in URLs übertragen noch protokolliert. Das selbstsignierte Zertifikat wird nur für die feste lokale Adresse `127.0.0.1:2999` akzeptiert; globale TLS-Prüfungen bleiben aktiv.
