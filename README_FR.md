# Trafexia - Outil d'Interception et d'Analyse du Trafic Réseau Mobile

Une application de bureau puissante pour intercepter, analyser et manipuler le trafic HTTP/HTTPS provenant d'appareils mobiles. Conçue avec Electron, Vue 3 et TypeScript.

Trafexia fournit des outils complets pour les tests de sécurité des applications mobiles, la rétro-ingénierie (reverse engineering) et le débogage d'API avec des fonctionnalités avancées telles que le contournement du SSL pinning (SSL pinning bypass), les simulations de réponses (mocking), la redirection de trafic (map rules), et bien plus encore.

---

## ✨ Fonctionnalités Clés

### 🔐 Contournement de la Sécurité SSL/TLS (SSL Bypass)
- **Scripts de contournement intégrés** - Prise en charge d'OkHttp3, Conscrypt, WebView, Flutter, React Native, etc.
- **Modification d'APK (APK Patching)** - Injectez des scripts de contournement directement dans les APK sans nécessiter d'appareils rootés.
- **Intégration de Frida Gadget** - Injection de code dynamique avec Frida pour le hook en temps réel.

### 📊 Analyse du Trafic en Temps Réel
- **Capture en direct** - Interceptez et affichez les requêtes HTTP/HTTPS en temps réel.
- **Visualisation par Timeline** - Suivez graphiquement la répartition et la fréquence des requêtes au fil du temps.
- **Filtrage avancé** - Filtrez par méthode HTTP, code d'état, hôte, chemin URL, etc.
- **Comparaison de requêtes (Diff)** - Interface de comparaison côte à côte pour analyser les différences entre requêtes originales et modifiées.

### 🎯 Manipulation de Requêtes
- **Redirection (Map Rules)** - Redirigez les requêtes vers d'autres URL en utilisant des expressions régulières (Regex).
- **Simulations de Réponses (Mock Responses)** - Créez des réponses factices avec des codes d'état, des en-têtes (headers) et des corps de message (bodies) personnalisés.
- **Créateur de Requêtes (Composer)** - Créez et envoyez des requêtes HTTP personnalisées pour tester vos API.
- **Limitation de Bande Passante (Throttling)** - Simulez des connexions réseau lentes pour valider les performances.

---

## 🚀 Guide de Démarrage Rapide

### Prérequis
- **Node.js** 18 ou version supérieure
- **Android SDK** (nécessaire pour les fonctionnalités d'APK patching)
- **macOS / Windows / Linux**

### Installation et Mode Développement
```bash
# Cloner le dépôt
git clone https://github.com/danieldev23/trafexia.git
cd trafexia

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

### Compiler pour la Production
```bash
# Compiler pour la plateforme actuelle
npm run build

# Compiler pour macOS (Intel)
npm run build:mac

# Compiler pour macOS (Apple Silicon - M1/M2/M3)
npm run build:mac-arm

# Compiler pour Windows
npm run build:win
```
Les fichiers exécutables générés seront situés dans le dossier `dist-electron/`.

---

## 📖 Guide de Configuration Mobile

### Configuration pour Android

#### Étape 1 : Configurer le Proxy
1. Ouvrez **Paramètres** → **Wi-Fi**.
2. Appuyez longuement sur votre réseau connecté et sélectionnez **Modifier le réseau**.
3. Appuyez sur **Options avancées**.
4. Définissez le **Proxy** sur **Manuel**.
5. Saisissez l'**IP du proxy** et le **Port** (affichés dans Trafexia).
6. Appuyez sur **Enregistrer**.

#### Étape 2 : Installer le Certificat CA
1. Téléchargez le certificat CA depuis Trafexia (par code QR ou lien direct).
2. Allez dans **Paramètres** → **Sécurité** → **Chiffrement et identifiants**.
3. Sélectionnez **Installer depuis le stockage**.
4. Choisissez le fichier de certificat téléchargé pour terminer l'installation.

---

### Configuration pour iOS

#### Étape 1 : Configurer le Proxy
1. Ouvrez **Réglages** → **Wi-Fi**.
2. Appuyez sur l'icône **(i)** en face de votre réseau connecté.
3. Faites défiler vers le bas, appuyez sur **Configurer le proxy** et sélectionnez **Manuel**.
4. Saisissez le **Serveur (IP)** et le **Port** indiqués sur Trafexia.
5. Appuyez sur **Enregistrer**.

#### Étape 2 : Installer et activer la confiance pour le Certificat CA
1. Utilisez votre appareil iOS pour télécharger le profil du certificat CA depuis le lien fourni dans Trafexia.
2. Ouvrez **Réglages** → **Profil téléchargé** et procédez à l'installation.
3. Allez dans **Réglages** → **Général** → **Informations** → **Réglages de confiance des certificats**.
4. Activez la confiance totale pour le certificat Trafexia CA.

---

## 🔒 Sécurité et Confidentialité
- **Utilisez cet outil uniquement pour le développement et l'évaluation de sécurité sur vos propres appareils ou applications autorisées.**
- **Pensez à désinstaller le certificat CA de votre appareil une fois vos tests terminés.**
- N'utilisez pas cet outil à des fins malveillantes ou pour intercepter des données sans autorisation.

## 📄 Licence
Ce projet est sous licence **Trafexia Source-Available License**. Veuillez consulter le fichier [LICENSE](LICENSE) pour plus de détails.
