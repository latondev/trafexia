# Trafexia - Mobile Traffic Interception & Analyse-Tool

Eine leistungsstarke Desktop-Anwendung zum Abfangen, Analysieren und Ändern von HTTP/HTTPS-Verkehr von Mobilgeräten. Entwickelt mit Electron, Vue 3 und TypeScript.

Trafexia bietet umfassende Tools für Sicherheitsprüfungen von mobilen Apps, Reverse Engineering und API-Debugging mit erweiterten Funktionen wie SSL-Pinning-Bypass, Antwort-Simulationen (Mocking), Datenverkehr-Umleitung (Map Rules) und mehr.

---

## ✨ Hauptfunktionen

### 🔐 SSL/TLS Sicherheits-Bypass (SSL Bypass)
- **Integrierte Bypass-Skripte** - Unterstützt OkHttp3, Conscrypt, WebView, Flutter, React Native und mehr.
- **APK-Patching** - Skripte direkt in APKs injizieren, ohne dass gerootete Geräte erforderlich sind.
- **Frida-Gadget-Integration** - Dynamische Code-Injektion mit Frida für Runtime-Hooking.

### 📊 Echtzeit-Verkehrsanalyse
- **Live-Erfassung** - Fängt HTTP/HTTPS-Anfragen in Echtzeit ab und zeigt sie an.
- **Timeline-Visualisierung** - Verfolgen Sie die Verteilung und Häufigkeit von Anfragen grafisch über die Zeit.
- **Erweiterte Filter** - Filtern nach HTTP-Methode, Statuscode, Host, URL-Pfad usw.
- **Anfragenvergleich (Diff)** - Nebeneinanderliegende Vergleichsansicht, um Original- und geänderte Anfragen zu analysieren.

### 🎯 Anfragenmanipulation
- **Umleitung (Map Rules)** - Leiten Sie Anfragen mithilfe regulärer Ausdrücke (Regex) an andere URLs um.
- **Antwort-Simulation (Mock Responses)** - Erstellen Sie simulierte Antworten mit benutzerdefinierten Statuscodes, Headern und Antworttexten (Body).
- **Anfrage-Composer** - Erstellen und senden Sie manuelle HTTP-Anfragen, um Ihre APIs zu testen.
- **Verbindungsdrosselung (Throttling)** - Simulieren Sie langsame Netzwerkbedingungen, um die Leistung zu prüfen.

---

## 🚀 Schnellstart-Anleitung

### Voraussetzungen
- **Node.js** 18 oder höher
- **Android SDK** (erforderlich für APK-Patching-Funktionen)
- **macOS / Windows / Linux**

### Installation und Entwicklungsmodus
```bash
# Repository klonen
git clone https://github.com/danieldev23/trafexia.git
cd trafexia

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

### Für Produktion bauen (Build)
```bash
# Für die aktuelle Plattform bauen
npm run build

# Für macOS (Intel) bauen
npm run build:mac

# Für macOS (Apple Silicon - M1/M2/M3) bauen
npm run build:mac-arm

# Für Windows bauen
npm run build:win
```
Die generierten ausführbaren Dateien befinden sich im Ordner `dist-electron/`.

---

## 📖 Konfigurationsanleitung für Mobilgeräte

### Einrichtung unter Android

#### Schritt 1: Proxy konfigurieren
1. Öffnen Sie **Einstellungen** → **WLAN**.
2. Drücken Sie lange auf Ihr verbundenes Netzwerk und wählen Sie **Netzwerk ändern**.
3. Tippen Sie auf **Erweiterte Optionen**.
4. Stellen Sie **Proxy** auf **Manuell** ein.
5. Geben Sie die in Trafexia angezeigte **Proxy-IP** und den **Port** ein.
6. Tippen Sie auf **Speichern**.

#### Schritt 2: CA-Zertifikat installieren
1. Laden Sie das CA-Zertifikat von Trafexia herunter (per QR-Code oder Direktlink).
2. Gehen Sie zu **Einstellungen** → **Sicherheit** → **Verschlüsselung & Anmeldedaten**.
3. Wählen Sie **Vom Speicher installieren**.
4. Wählen Sie die heruntergeladene Zertifikatsdatei aus, um die Installation abzuschließen.

---

### Einrichtung unter iOS

#### Schritt 1: Proxy konfigurieren
1. Öffnen Sie **Einstellungen** → **WLAN**.
2. Tippen Sie auf das **(i)**-Symbol neben Ihrem verbundenen Netzwerk.
3. Scrollen Sie nach unten zu **Proxy konfigurieren** und wählen Sie **Manuell**.
4. Geben Sie den **Server (IP)** und den **Port** ein, die in Trafexia angegeben sind.
5. Tippen Sie auf **Sichern**.

#### Schritt 2: CA-Zertifikat installieren und aktivieren
1. Verwenden Sie Ihr iOS-Gerät, um das CA-Zertifikatsprofil über den bereitgestellten Link in Trafexia herunterzuladen.
2. Öffnen Sie **Einstellungen** → **Profil geladen** und tippen Sie auf **Installieren**.
3. Gehen Sie zu **Einstellungen** → **Allgemein** → **Info** → **Zertifikatsvertrauenseinstellungen**.
4. Aktivieren Sie das volle Vertrauen für das Trafexia CA-Zertifikat.

---

## 🔒 Sicherheit und Datenschutz
- **Verwenden Sie dieses Tool nur für Entwicklungs- und Sicherheitsprüfungen auf Ihren eigenen Geräten oder autorisierten Apps.**
- **Deinstallieren Sie das CA-Zertifikat von Ihrem Gerät, sobald Ihre Tests abgeschlossen sind.**
- Nutzen Sie dieses Tool nicht für illegale Aktivitäten oder unbefugtes Abfangen von Daten.

## 📄 Lizenz
Dieses Projekt ist unter der **Trafexia Source-Available License** lizenziert. Weitere Details finden Sie in der Datei [LICENSE](LICENSE).
