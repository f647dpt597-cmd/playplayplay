# Setup: Ticket-Notify-Formular → Google Sheets

Das Formular auf `tickets.html` schickt Einträge an ein Google Apps Script, das sie in ein Google Sheet schreibt. Einrichtung dauert ~5 Minuten.

## 1. Google Sheet anlegen

1. [sheets.new](https://sheets.new) öffnen (mit dem Team-Google-Konto, nicht privat)
2. Benennen: **FSBF Ticket Notify List**

## 2. Apps Script einfügen

1. Im Sheet: **Erweiterungen → Apps Script**
2. Inhalt von `Code.gs` (in diesem Ordner) komplett in den Editor kopieren (vorhandenen Beispielcode ersetzen)
3. Speichern (Disketten-Symbol)

## 3. Als Web-App bereitstellen

1. **Bereitstellen → Neue Bereitstellung**
2. Zahnrad → Typ **Web-App**
3. Einstellungen:
   - Ausführen als: **Ich**
   - Zugriff: **Jeder** (nötig, damit das Formular ohne Login senden kann)
4. **Bereitstellen** → Zugriff autorisieren → Web-App-URL kopieren (endet auf `/exec`)

## 4. URL in die Website eintragen

In `tickets.html` die Zeile suchen:

```js
var APPS_SCRIPT_URL = '';
```

URL einfügen, committen, pushen:

```js
var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/DEIN_DEPLOYMENT/exec';
```

Solange die URL leer ist, öffnet das Formular als Fallback eine vorbefüllte E-Mail an info@fs-businessforum.com — die Seite ist also auch vor dem Setup voll funktionsfähig.

## 5. Testen

1. Web-App-URL im Browser öffnen → JSON mit `"ok": true` erscheint
2. Auf tickets.html das Formular absenden → neue Zeile im Sheet (Tab „Notify List")
3. Gleiche E-Mail nochmal absenden → keine doppelte Zeile (Dedupe greift)

## Eingebaute Schutzmaßnahmen

Honeypot-Feld (Bots füllen es, Menschen sehen es nicht), 3-Sekunden-Zeitschranke gegen Sofort-Submits, serverseitige Validierung + Längenlimits, Rate-Limit (1 Eintrag pro E-Mail / 10 Min), E-Mail-Dedupe, LockService gegen Race Conditions. Keine API-Keys im Frontend — die Web-App-URL ist öffentlich, kann aber nur Zeilen anfügen.

## Launch-Mails später versenden

Zwei Optionen:

**A) Direkt aus dem Sheet (kleine Listen):** In `Code.gs` ist `sendLaunchEmails()` vorbereitet — Betreff/Text anpassen, im Apps-Script-Editor manuell ausführen. Achtung Gmail-Quota: ~100 Mails/Tag (privates Konto), ~1500/Tag (Workspace).

**B) E-Mail-Tool (empfohlen ab ~100 Empfängern):** Sheet als CSV exportieren → in Brevo/Mailchimp importieren. Sauberes Bounce-Handling, Abmeldelinks, kein Quota-Problem. Da die Einwilligung dokumentiert im Sheet liegt (Zeitstempel + Consent-Spalte), ist der Import DSGVO-seitig sauber.

---

## Extra: Inter-Fonts lokal ablegen (DSGVO)

Google Fonts wurde aus `index.html`/`tickets.html` entfernt (DSGVO — LG München I, Az. 3 O 17493/20). Playfair Display liegt schon lokal in `assets/fonts/`. Die `@font-face`-Regeln für **Inter** existieren bereits in `styles.css`, es fehlen nur die Dateien. Bis dahin fällt der Text auf die System-Schrift zurück (sieht ok aus, aber nicht identisch).

1. https://gwfh.mranftl.com/fonts/inter öffnen → Charsets: `latin`, Styles: 300, 400, 500, 600, 700 → Download (woff2)
2. Die 5 Dateien **exakt so benannt** nach `assets/fonts/` legen:
   - `Inter-Light.woff2` (300)
   - `Inter-Regular.woff2` (400)
   - `Inter-Medium.woff2` (500)
   - `Inter-SemiBold.woff2` (600)
   - `Inter-Bold.woff2` (700)
3. Committen & pushen — fertig.
