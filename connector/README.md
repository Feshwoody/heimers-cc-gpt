# MacroBoard League Connector

Kleiner Node.js-Connector für Windows. Er liest ausschließlich die lokale Riot Live Client Data API während eines laufenden Spiels und sendet normalisierte Matchdaten an eine MacroBoard-Session.

```bash
npm install
npm run dev -- --session N7K4PX --secret "SECRET" --url "https://deine-domain.de"
```

Mock-Modus:

```bash
npm run mock -- --session N7K4PX --secret "SECRET" --url "http://localhost:3000"
```

Das selbstsignierte Zertifikat wird nur für die feste lokale Adresse `127.0.0.1:2999` akzeptiert. Globale TLS-Prüfungen bleiben aktiv.
