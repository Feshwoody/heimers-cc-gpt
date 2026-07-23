# MacroBoard Production Deployment

Diese Anleitung führt von einem lokalen Checkout bis zur produktiven Vercel-Domain.

## 1. Lokalen Stand prüfen

Im Projektordner:

```powershell
npm install
npm run build
cd connector
npm install
npm run build
cd ..
```

Beide Builds müssen ohne TypeScript-Fehler enden.

## 2. Supabase vorbereiten

1. Auf Supabase ein neues Projekt erstellen.
2. Im SQL Editor `supabase/migrations/001_macroboard_sessions.sql` ausführen.
3. Unter Project Settings die Project URL und den öffentlichen Anon Key kopieren.
4. Niemals den Service-Role-Key in Git, Vercel-Clientvariablen oder den Connector eintragen.

## 3. Lokale Production-Konfiguration testen

Optional:

```powershell
Copy-Item .env.production.example .env.production
```

Werte nur lokal in `.env.production` eintragen:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=PUBLIC_ANON_KEY
```

Danach:

```powershell
npm run build
npm start
```

`http://localhost:3000/api/health` muss `status: "ok"` liefern.

## 4. GitHub-Repository erstellen

Vor dem ersten Commit prüfen:

```powershell
git status
git check-ignore .env.local .env.production node_modules connector/node_modules .next
```

Die genannten lokalen Dateien und Ordner müssen ignoriert werden.

Anschließend:

```powershell
git add .
git commit -m "Prepare MacroBoard 0.5.0 for production"
git branch -M main
git remote add origin <GITHUB_REPOSITORY_URL>
git push -u origin main
```

## 5. Vercel-Projekt erstellen

1. In Vercel `Add New > Project` öffnen.
2. GitHub-Repository auswählen.
3. Framework Preset: `Next.js`.
4. Root Directory: Repository-Wurzel.
5. Build Command: `npm run build`.
6. Output Directory nicht überschreiben.
7. Install Command: `npm install`.

## 6. Environment Variables in Vercel

Unter `Project Settings > Environment Variables` setzen:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Für Production und Preview konfigurieren. Nach jeder Änderung neu deployen, da öffentliche Next.js-Variablen beim Build eingebettet werden.

## 7. Erstes Deployment prüfen

Nach erfolgreichem Deployment:

1. Startseite öffnen.
2. `/api/health` aufrufen.
3. Prüfen, dass `version` den Wert `0.5.0` enthält.
4. Eine Session erstellen.
5. Einladung in einem zweiten Browser öffnen.
6. Presence und einen manuellen Call prüfen.

## 8. Eigene Domain verbinden

1. In Vercel `Project Settings > Domains` öffnen.
2. Domain hinzufügen, zum Beispiel `macroboard.gg`.
3. Die von Vercel geforderten DNS-Einträge beim Domainanbieter setzen.
4. Auf erfolgreiche Verifikation und HTTPS-Zertifikat warten.
5. `https://macroboard.gg/api/health` prüfen.

Es sind keine zusätzlichen Next.js-Rewrites nötig.

## 9. Connector produktiv starten

Auf dem Gaming-PC:

```powershell
cd connector
npm install
npm run build
npm run production -- --session N7K4PX --secret "CONNECTOR_SECRET" --url "https://macroboard.gg"
```

Alternativ:

```powershell
node dist/index.js --session N7K4PX --secret "CONNECTOR_SECRET" --url "https://macroboard.gg"
```

Die URL muss die Web-App-Basisadresse sein. Der Connector ergänzt `/api/connector/push` selbst.

## 10. Release-Checkliste

- Hauptprojekt-Build erfolgreich
- Connector-Build erfolgreich
- keine `.env`-Dateien im Git-Index
- keine `node_modules` oder `.next` im Git-Index
- Supabase-Migration ausgeführt
- Vercel-Variablen gesetzt
- Healthcheck erfolgreich
- Session-Erstellung erfolgreich
- Connector gegen HTTPS-Domain erfolgreich
- Domain und TLS aktiv

## Rollback

Vercel behält frühere Deployments. Bei einem Problem im Dashboard:

1. In Vercel das letzte funktionierende Deployment auswählen.
2. `Promote to Production` verwenden.
3. Datenbankschema nicht blind zurückrollen.
4. Connector weiterhin gegen dieselbe Produktionsdomain laufen lassen.
