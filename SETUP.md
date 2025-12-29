# Local SEO Generator - Setup Guide

## 1. Turso Database (Free)

1. Gehe zu https://turso.tech und erstelle einen Account
2. Installiere die CLI: `curl -sSfL https://get.tur.so/install.sh | bash`
3. Login: `turso auth login`
4. Erstelle eine Datenbank: `turso db create local-seo-db`
5. Hole die URL: `turso db show local-seo-db --url`
6. Erstelle ein Token: `turso db tokens create local-seo-db`
7. Kopiere beide Werte in deine `.env.local`:
   ```
   TURSO_DATABASE_URL=libsql://local-seo-db-username.turso.io
   TURSO_AUTH_TOKEN=eyJ...
   ```

## 2. OpenRouter API Key

1. Gehe zu https://openrouter.ai
2. Erstelle einen Account
3. Gehe zu https://openrouter.ai/keys
4. Erstelle einen neuen API Key
5. Kopiere in `.env.local`:
   ```
   OPENROUTER_API_KEY=sk-or-v1-...
   ```

## 3. Google Cloud Setup (für GBP Integration)

### 3.1 Projekt erstellen

1. Gehe zu https://console.cloud.google.com
2. Klicke oben auf "Projekt auswählen" > "Neues Projekt"
3. Name: `local-seo-generator`
4. Klicke "Erstellen"

### 3.2 OAuth Consent Screen

1. Gehe zu "APIs & Dienste" > "OAuth-Zustimmungsbildschirm"
2. Wähle "Extern"
3. Fülle aus:
   - App-Name: `Local SEO Generator`
   - Support-E-Mail: Deine E-Mail
   - Autorisierte Domains: `vercel.app` (und deine Domain)
   - Entwickler-Kontakt: Deine E-Mail
4. Klicke "Speichern und fortfahren"
5. Bei "Bereiche" klicke "Bereiche hinzufügen oder entfernen"
6. Suche und wähle:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/business.manage`
7. Speichern und fortfahren
8. Füge Test-Nutzer hinzu (deine E-Mail)

### 3.3 OAuth Credentials erstellen

1. Gehe zu "APIs & Dienste" > "Anmeldedaten"
2. Klicke "Anmeldedaten erstellen" > "OAuth-Client-ID"
3. Anwendungstyp: "Webanwendung"
4. Name: `Local SEO Web Client`
5. Autorisierte Weiterleitungs-URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://deine-app.vercel.app/api/auth/callback/google`
6. Klicke "Erstellen"
7. Kopiere Client-ID und Client-Secret in `.env.local`:
   ```
   GOOGLE_CLIENT_ID=123456789-xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-...
   ```

### 3.4 Google Business Profile API aktivieren

1. Gehe zu "APIs & Dienste" > "Bibliothek"
2. Suche nach "My Business" und aktiviere:
   - My Business Account Management API
   - My Business Business Information API
   - My Business Lodging API (optional)

## 4. NextAuth Secret

Generiere einen zufälligen String:
```bash
openssl rand -base64 32
```

Kopiere in `.env.local`:
```
NEXTAUTH_SECRET=dein-zufälliger-string
NEXTAUTH_URL=https://deine-app.vercel.app
```

## 5. Cron Secret

Generiere noch einen zufälligen String für den Cron-Job:
```bash
openssl rand -base64 32
```

Kopiere in `.env.local`:
```
CRON_SECRET=dein-cron-secret
```

## 6. Datenbank initialisieren

```bash
npm install
npm run db:push
```

## 7. Vercel Deployment

1. Pushe zu GitHub
2. Importiere in Vercel
3. Füge alle Environment Variables hinzu
4. Deploy!

## Environment Variables für Vercel

| Variable | Beschreibung |
|----------|--------------|
| `OPENROUTER_API_KEY` | OpenRouter API Key |
| `TURSO_DATABASE_URL` | Turso Database URL |
| `TURSO_AUTH_TOKEN` | Turso Auth Token |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret |
| `NEXTAUTH_URL` | Deine Vercel URL |
| `NEXTAUTH_SECRET` | Zufälliger Secret String |
| `CRON_SECRET` | Secret für Cron Jobs |

## Features

- Website Auto-Scan (extrahiert NAP, Services, etc.)
- 7 SEO Content Tools
- Google Login
- Direkt zu Google Business Profile posten
- Automatische wöchentliche Posts (Cron Job um 9:00 Uhr)
- Gespeicherte Businesses

## Support

Bei Fragen: Erstelle ein Issue auf GitHub
