import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { spawn } from 'child_process';
import AdmZip from 'adm-zip';
import type {
  ApkAnalysisResult,
  ApkAnalysisProgress,
  ApkAppInfo,
  ApkEndpoint,
  ApkService,
  ApkSecret,
  ApkResource,
  ApkResourceType
} from '../../../shared/types';

export class ApkAnalysisService {
  private apktoolPath: string = 'apktool';
  private jadxPath: string = 'jadx';
  private apktoolArgsPrefix: string[] = [];
  private jadxArgsPrefix: string[] = [];

  constructor() {
    this.detectBinaries();
  }

  private detectBinaries() {
    const bundledRoots = [
      path.join(process.resourcesPath || '', 'resources', 'tools'),
      path.resolve(process.cwd(), 'resources', 'tools'),
      path.resolve(__dirname, '../../resources/tools'),
    ];
    const bundledApktool = path.join(bundledRoots.find((root) => fs.existsSync(path.join(root, 'apktool', 'apktool.jar'))) || '', 'apktool', 'apktool.jar');
    const bundledJadx = path.join(bundledRoots.find((root) => fs.existsSync(path.join(root, 'jadx', 'lib', 'jadx-1.5.6-all.jar'))) || '', 'jadx', 'lib', 'jadx-1.5.6-all.jar');

    if (process.platform === 'win32' && fs.existsSync(bundledApktool) && fs.existsSync(bundledJadx)) {
      const java = process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', 'java.exe') : 'java';
      this.apktoolPath = java;
      this.jadxPath = java;
      this.apktoolArgsPrefix = ['-jar', bundledApktool];
      this.jadxArgsPrefix = ['-cp', bundledJadx, 'jadx.cli.JadxCLI'];
      console.log('[ApkAnalysisService] Using project-bundled apktool and jadx');
      return;
    }

    const commonPaths = [
      '/opt/homebrew/bin',
      '/usr/local/bin',
      '/usr/bin',
      '/bin',
      path.join(os.homedir(), 'Library/Android/sdk/platform-tools'), // Just in case
    ];

    // Try finding apktool
    let foundApktool = false;
    for (const p of commonPaths) {
      const fullPath = path.join(p, 'apktool');
      if (fs.existsSync(fullPath)) {
        this.apktoolPath = fullPath;
        foundApktool = true;
        console.log(`[ApkAnalysisService] Found apktool at: ${fullPath}`);
        break;
      }
    }
    if (!foundApktool) {
      console.warn('[ApkAnalysisService] apktool not found in common paths, falling back to system PATH');
    }

    // Try finding jadx
    let foundJadx = false;
    for (const p of commonPaths) {
      const fullPath = path.join(p, 'jadx');
      if (fs.existsSync(fullPath)) {
        this.jadxPath = fullPath;
        foundJadx = true;
        console.log(`[ApkAnalysisService] Found jadx at: ${fullPath}`);
        break;
      }
    }
    if (!foundJadx) {
      console.warn('[ApkAnalysisService] jadx not found in common paths, falling back to system PATH');
    }
  }

  /**
   * Run a spawned child process with a promise wrapper
   */
  private runProcess(cmd: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      console.log(`[ApkAnalysisService] Executing: ${cmd} ${args.join(' ')}`);
      // Windows cannot launch .bat files directly with CreateProcess; route the bundled
      // wrappers through cmd.exe while quoting every argument.
      const child = spawn(cmd, args);
      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({ code: code ?? 0, stdout, stderr });
      });

      child.on('error', (err) => {
        console.error(`[ApkAnalysisService] Process error:`, err);
        resolve({ code: -1, stdout, stderr: err.message });
      });
    });
  }

  /**
   * Run static analysis on `.apk` or `.xapk` file
   */
  async analyze(
    filePath: string,
    onProgress: (progress: ApkAnalysisProgress) => void
  ): Promise<ApkAnalysisResult> {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trafexia-apk-'));
    console.log(`[ApkAnalysisService] Temporary working dir: ${tempDir}`);

    try {
      const ext = path.extname(filePath).toLowerCase();
      let apkPath = filePath;

      // 1. EXTRACTION STEP
      onProgress({ step: 'extracting', percent: 10, message: 'Preparing file for analysis...' });
      if (ext === '.xapk' || ext === '.zip') {
        onProgress({ step: 'extracting', percent: 30, message: 'Extracting XAPK / App Bundle...' });
        const zip = new AdmZip(filePath);
        zip.extractAllTo(tempDir, true);

        const files = fs.readdirSync(tempDir);
        const apkFiles = files.filter((f) => f.endsWith('.apk')).map((f) => path.join(tempDir, f));

        if (apkFiles.length === 0) {
          throw new Error('No APK files found inside XAPK / Zip archive');
        }

        // Find base APK (prefer filename containing 'base', fallback to largest size)
        const baseApk = apkFiles.find((f) => path.basename(f).toLowerCase().includes('base')) ||
          apkFiles.reduce((prev, current) => {
            return fs.statSync(current).size > fs.statSync(prev).size ? current : prev;
          });

        apkPath = baseApk;
        console.log(`[ApkAnalysisService] Extracted base APK: ${apkPath}`);
      } else {
        // Copy original APK to temp to keep working folder clean
        const destPath = path.join(tempDir, 'base.apk');
        fs.copyFileSync(filePath, destPath);
        apkPath = destPath;
      }
      onProgress({ step: 'extracting', percent: 100, message: 'Extraction completed!' });

      // 2. DECOMPILING STEP
      onProgress({ step: 'decompiling', percent: 10, message: 'Decompiling Android resources with apktool...' });
      const apktoolOut = path.join(tempDir, 'apktool_out');
      const apktoolResult = await this.runProcess(this.apktoolPath, [...this.apktoolArgsPrefix,
        'd',
        apkPath,
        '-o',
        apktoolOut,
        '--no-src',
        '-f'
      ]);

      if (apktoolResult.code !== 0) {
        console.warn(`[ApkAnalysisService] apktool warning (code ${apktoolResult.code}):`, apktoolResult.stderr);
      }

      onProgress({ step: 'decompiling', percent: 50, message: 'Decompiling Java bytecode with jadx...' });
      const jadxOut = path.join(tempDir, 'jadx_out');
      const jadxResult = await this.runProcess(this.jadxPath, [...this.jadxArgsPrefix,
        '-d',
        jadxOut,
        apkPath
      ]);

      if (jadxResult.code !== 0) {
        console.warn(`[ApkAnalysisService] jadx warning (code ${jadxResult.code}):`, jadxResult.stderr);
      }
      onProgress({ step: 'decompiling', percent: 100, message: 'Decompilation completed!' });

      // 3. SCANNING STEP
      onProgress({ step: 'scanning', percent: 10, message: 'Parsing manifest configuration...' });

      // Parse Manifest
      const manifestPath = path.join(apktoolOut, 'AndroidManifest.xml');
      let appInfo: ApkAppInfo = { package: '', version: '', minSdk: '' };
      let services: ApkService[] = [];
      let permissions: string[] = [];

      if (fs.existsSync(manifestPath)) {
        const manifestContent = fs.readFileSync(manifestPath, 'utf8');
        
        // App Info
        const pkgMatch = manifestContent.match(/package=["']([^"']+)["']/);
        const verMatch = manifestContent.match(/android:versionName=["']([^"']+)["']/);
        const sdkMatch = manifestContent.match(/android:minSdkVersion=["']([^"']+)["']/);

        appInfo.package = pkgMatch ? pkgMatch[1] : 'Unknown';
        appInfo.version = verMatch ? verMatch[1] : '1.0';
        appInfo.minSdk = sdkMatch ? sdkMatch[1] : '19';

        // Permissions
        const permRegex = /<uses-permission[^>]*android:name=["']([^"']+)["']/g;
        let pMatch;
        const permsSet = new Set<string>();
        while ((pMatch = permRegex.exec(manifestContent)) !== null) {
          permsSet.add(pMatch[1]);
        }
        permissions = Array.from(permsSet);

        // Components
        const componentRegex = /<(activity|service|receiver|provider)([\s\S]*?)(\/>|>([\s\S]*?)<\/\1>)/g;
        let compMatch;
        while ((compMatch = componentRegex.exec(manifestContent)) !== null) {
          const type = compMatch[1] as ApkService['type'];
          const attrs = compMatch[2];
          const inner = compMatch[4] || '';

          const nameAttr = attrs.match(/android:name=["']([^"']+)["']/);
          if (!nameAttr) continue;
          const name = nameAttr[1];

          const exportedAttr = attrs.match(/android:exported=["'](true|false)["']/);
          let exported = false;
          if (exportedAttr) {
            exported = exportedAttr[1] === 'true';
          } else {
            // Default rules: if intent-filter exists, exported is true
            exported = inner.includes('<intent-filter');
          }

          services.push({ name, type, exported });
        }
      } else {
        console.warn(`[ApkAnalysisService] AndroidManifest.xml not found at: ${manifestPath}`);
      }

      onProgress({ step: 'scanning', percent: 30, message: 'Scanning source code files...' });

      // Scan Java Files
      const endpoints: ApkEndpoint[] = [];
      const secrets: ApkSecret[] = [];
      const detectedSdks = new Set<string>();

      // Scan patterns
      const PATTERN_ENDPOINT = /https?:\/\/[^\s"'<>]{8,}/g;
      const PATTERN_RETROFIT = /@(GET|POST|PUT|DELETE|PATCH)\("([^"]+)"\)/i;
      const PATTERN_SECRET = /(api[_-]?key|token|secret|password|authorization)\s*[=:]\s*["']([^"']{8,})["']/i;
      const PATTERN_BASEURL = /(BASE_URL|API_URL|SERVER_URL|HOST)\s*[=:]\s*["']([^"']+)["']/i;

      // SDK patterns
      const SDK_RULES = [
        { name: 'Firebase', pattern: /com\.google\.firebase/ },
        { name: 'Retrofit', pattern: /com\.squareup\.retrofit2/ },
        { name: 'OkHttp', pattern: /okhttp3|com\.squareup\.okhttp/ },
        { name: 'Gson', pattern: /com\.google\.gson/ },
        { name: 'RxJava', pattern: /io\.reactivex|rx\.android/ },
        { name: 'Glide', pattern: /com\.bumptech\.glide/ },
        { name: 'Picasso', pattern: /com\.squareup\.picasso/ },
        { name: 'Facebook SDK', pattern: /com\.facebook\.FacebookSdk/ },
        { name: 'Flutter', pattern: /io\.flutter\.embedding/ },
        { name: 'React Native', pattern: /com\.facebook\.react/ },
        { name: 'AdMob', pattern: /com\.google\.android\.gms\.ads/ },
        { name: 'Realm', pattern: /io\.realm/ },
        { name: 'Room', pattern: /androidx\.room/ },
        { name: 'Dagger', pattern: /dagger\.Component|dagger\.Module/ },
      ];

      const sourcesDir = path.join(jadxOut, 'sources');
      if (fs.existsSync(sourcesDir)) {
        const javaFiles = this.walkDir(sourcesDir).filter((f) => f.endsWith('.java'));
        const totalFiles = javaFiles.length;
        console.log(`[ApkAnalysisService] Found ${totalFiles} Java files to scan`);

        for (let i = 0; i < totalFiles; i++) {
          // Send progress updates every 10% or 100 files
          if (i % Math.max(1, Math.floor(totalFiles / 10)) === 0 || i % 100 === 0) {
            const p = Math.floor(30 + (i / totalFiles) * 65);
            onProgress({
              step: 'scanning',
              percent: p,
              message: `Scanning source files (${i}/${totalFiles})...`
            });
          }

          const file = javaFiles[i];
          const relativePath = path.relative(sourcesDir, file);
          // Keep the Electron main event loop responsive while scanning large APKs.
          const content = await fs.promises.readFile(file, 'utf8');

          // Quick SDK check from imports/paths
          for (const sdk of SDK_RULES) {
            if (!detectedSdks.has(sdk.name) && sdk.pattern.test(content)) {
              detectedSdks.add(sdk.name);
            }
          }

          // Scan line by line for precise source tracing
          const lines = content.split(/\r?\n/);
          for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
            const line = lines[lineNum - 1];

            // 1. API Endpoints
            let urlMatch;
            // Reset regex index
            PATTERN_ENDPOINT.lastIndex = 0;
            while ((urlMatch = PATTERN_ENDPOINT.exec(line)) !== null) {
              const urlStr = urlMatch[0];
              if (!this.isFalsePositiveUrl(urlStr)) {
                endpoints.push({
                  url: urlStr,
                  method: 'GET',
                  source: `${relativePath}:${lineNum}`
                });
              }
            }

            // 2. Retrofit Annotations
            const retroMatch = line.match(PATTERN_RETROFIT);
            if (retroMatch) {
              const method = retroMatch[1].toUpperCase();
              const pathVal = retroMatch[2];
              endpoints.push({
                url: pathVal,
                method,
                source: `${relativePath}:${lineNum}`
              });
            }

            // 3. Secrets
            const secretMatch = line.match(PATTERN_SECRET);
            if (secretMatch) {
              const key = secretMatch[1];
              const val = secretMatch[2];
              // Exclude obvious placeholder variables/methods
              if (!val.toLowerCase().includes('placeholder') && !val.includes('API_KEY')) {
                secrets.push({
                  key,
                  value: val,
                  source: `${relativePath}:${lineNum}`
                });
              }
            }

            // 4. Base URLs
            const baseMatch = line.match(PATTERN_BASEURL);
            if (baseMatch) {
              const name = baseMatch[1];
              const val = baseMatch[2];
              if (val.startsWith('http') && !this.isFalsePositiveUrl(val)) {
                endpoints.push({
                  url: val,
                  method: `BASE (${name})`,
                  source: `${relativePath}:${lineNum}`
                });
              }
            }
          }

          // Yield periodically so window events and IPC progress updates are processed.
          if (i % 50 === 0) {
            await new Promise<void>((resolve) => setImmediate(resolve));
          }
        }
      } else {
        console.warn(`[ApkAnalysisService] jadx output 'sources' folder not found at: ${sourcesDir}`);
      }

      onProgress({ step: 'done', percent: 95, message: 'Scanning resources (images, layouts, audio)...' });

      // 4. SCAN RESOURCES (images, video, audio, font, layout, raw)
      const resources: ApkResource[] = this.scanResources(apktoolOut, jadxOut);
      console.log(`[ApkAnalysisService] Found ${resources.length} resources`);

      onProgress({ step: 'done', percent: 100, message: 'Analysis completed successfully!' });

      const result: ApkAnalysisResult = {
        appInfo,
        endpoints: this.deduplicateEndpoints(endpoints),
        services,
        permissions: permissions.sort(),
        secrets: this.deduplicateSecrets(secrets),
        sdks: Array.from(detectedSdks).sort(),
        resources,
        outputDir: tempDir,
      };

      return result;
    } catch (error) {
      console.error('[ApkAnalysisService] Analysis failed:', error);
      // Clean up on error
      this.cleanupTempDir(tempDir);
      throw error;
    }
    // NOTE: We intentionally do NOT clean up tempDir on success — kept for resource preview.
  }

  /**
   * Helper to clean up temp directories recursively
   */
  private cleanupTempDir(dirPath: string) {
    try {
      if (fs.existsSync(dirPath)) {
        // Simple recursive removal (Node.js 14+)
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`[ApkAnalysisService] Cleaned up temp dir: ${dirPath}`);
      }
    } catch (error) {
      console.error(`[ApkAnalysisService] Failed to clean up temp directory ${dirPath}:`, error);
    }
  }

  // ===== Public resource helpers =====

  /** Open the decompiled folder in Finder / Explorer */
  async openFolder(dirPath: string): Promise<void> {
    const { shell } = await import('electron');
    await shell.openPath(dirPath);
  }

  /** Copy the decompiled folder to a user-chosen destination. Returns dest path or null if cancelled. */
  async saveFolder(srcDir: string, destDir: string): Promise<void> {
    this.copyDirRecursive(srcDir, destDir);
  }

  /** Read a file inside the temp dir and return base64-encoded content. */
  readFileAsBase64(filePath: string): string {
    const buf = fs.readFileSync(filePath);
    return buf.toString('base64');
  }

  // ===== Resource scanning =====

  private scanResources(apktoolOut: string, _jadxOut: string): ApkResource[] {
    const resources: ApkResource[] = [];

    const EXT_MAP: Record<string, { type: ApkResourceType; mimeType: string }> = {
      // Images
      '.png':  { type: 'image', mimeType: 'image/png' },
      '.jpg':  { type: 'image', mimeType: 'image/jpeg' },
      '.jpeg': { type: 'image', mimeType: 'image/jpeg' },
      '.webp': { type: 'image', mimeType: 'image/webp' },
      '.gif':  { type: 'image', mimeType: 'image/gif' },
      '.svg':  { type: 'image', mimeType: 'image/svg+xml' },
      '.bmp':  { type: 'image', mimeType: 'image/bmp' },
      '.ico':  { type: 'image', mimeType: 'image/x-icon' },
      // Video
      '.mp4':  { type: 'video', mimeType: 'video/mp4' },
      '.webm': { type: 'video', mimeType: 'video/webm' },
      '.avi':  { type: 'video', mimeType: 'video/avi' },
      '.mov':  { type: 'video', mimeType: 'video/quicktime' },
      // Audio
      '.mp3':  { type: 'audio', mimeType: 'audio/mpeg' },
      '.ogg':  { type: 'audio', mimeType: 'audio/ogg' },
      '.wav':  { type: 'audio', mimeType: 'audio/wav' },
      '.m4a':  { type: 'audio', mimeType: 'audio/mp4' },
      '.flac': { type: 'audio', mimeType: 'audio/flac' },
      // Fonts
      '.ttf':  { type: 'font', mimeType: 'font/ttf' },
      '.otf':  { type: 'font', mimeType: 'font/otf' },
      '.woff': { type: 'font', mimeType: 'font/woff' },
      // Layouts
      '.xml':  { type: 'layout', mimeType: 'text/xml' },
    };

    // Scan apktool_out directory (res/, assets/)
    const dirsToScan = [
      path.join(apktoolOut, 'res'),
      path.join(apktoolOut, 'assets'),
      path.join(apktoolOut, 'lib'),
    ].filter(d => fs.existsSync(d));

    for (const dir of dirsToScan) {
      const files = this.walkDir(dir);
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        const mapped = EXT_MAP[ext];
        if (!mapped) continue;

        // Skip tiny layout XMLs in non-layout folders — include all from layout/ subfolder
        const rel = path.relative(apktoolOut, file);
        if (mapped.type === 'layout' && !rel.includes('layout') && !rel.includes('xml')) continue;

        try {
          const stat = fs.statSync(file);
          resources.push({
            name: path.basename(file),
            relativePath: rel,
            absolutePath: file,
            type: mapped.type,
            size: stat.size,
            mimeType: mapped.mimeType,
          });
        } catch {
          // ignore unreadable files
        }
      }
    }

    return resources;
  }

  /** Copy directory tree recursively */
  private copyDirRecursive(src: string, dest: string): void {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        this.copyDirRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Recursively find all files in directory
   */
  private walkDir(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(this.walkDir(fullPath));
      } else {
        results.push(fullPath);
      }
    });
    return results;
  }

  /**
   * Helper to filter out obvious false positive URLs.
   * Returns true if the URL should be EXCLUDED from results.
   */
  private isFalsePositiveUrl(url: string): boolean {
    const low = url.toLowerCase();

    // --- Loopback / local ---
    if (low.startsWith('http://localhost') || low.startsWith('http://127.0.0.1')) return true;

    // --- Incomplete or malformed / template URLs ---
    if (low.endsWith('.') || low.endsWith('%') || low.endsWith('%s') || low.endsWith('%d') || low.endsWith('}')) return true;
    if (low.includes('.%s') || low.includes('.%d') || low.includes('{%s}') || low.includes('{placeholder}')) return true;
    
    try {
      const urlObj = new URL(url);
      const host = urlObj.hostname;
      // Host shouldn't end with a dot, shouldn't contain placeholders, should have at least one dot,
      // and shouldn't contain percentage symbols or curly brackets
      if (host.endsWith('.') || host.includes('%') || host.includes('{') || host.includes('}') || !host.includes('.')) {
        return true;
      }
    } catch {
      // If not a valid absolute URL, check basic pattern
      if (!url.startsWith('http://') && !url.startsWith('https://')) return true;
      if (low.includes('%s') || low.includes('%d') || low.endsWith('.')) return true;
    }

    // --- Documentations, Specifications, Issues, Help and Guide URLs ---
    // Web APIs never contain anchors (#) or paths like docs, issues, wiki, help, guidelines, faq, support, etc.
    if (low.includes('#')) return true;
    if (
      low.includes('/issues/') ||
      low.includes('/docs/') ||
      low.includes('/doc/') ||
      low.includes('/guidelines/') ||
      low.includes('/wiki/') ||
      low.includes('/help/') ||
      low.includes('/faq/') ||
      low.includes('/getting-started') ||
      low.includes('/support/') ||
      low.includes('/tutorials/') ||
      low.includes('/tutorial/') ||
      low.includes('/policy/') ||
      low.includes('/privacy/') ||
      low.includes('/terms/') ||
      low.includes('/license/')
    ) {
      return true;
    }

    // --- XML / Schema namespaces & XML layouts (not real API endpoints) ---
    if (low.includes('schemas.') || low.includes('/xmlns/') || low.includes('xml.org') || low.includes('schema.org')) return true;
    if (low.includes('schemas.android.com') || low.includes('schemas.xmlsoap.org') || low.includes('schemas.openxmlformats.org')) return true;
    if (low.includes('www.w3.org') || low.includes('//w3.org')) return true;
    if (low.includes('ns.adobe.com')) return true;
    if (low.includes('purl.org')) return true;

    // --- Common SDK / Analytics / Ads / Crash reporting domains ---
    const sdkDomains = [
      'adjust.com', 'adjust.io',
      'applovin.com', 'applvn.com',
      'crashlytics.com', 'crashlytics.org',
      'sentry.io', 'bugsnag.com',
      'firebaseinstallations.googleapis.com',
      'firebaselogging-pa.googleapis.com',
      'firebase-settings.crashlytics.com',
      'app-measurement.com',
      'google-analytics.com',
      'doubleclick.net',
      'googleadservices.com',
      'googlesyndication.com',
      'onesignal.com',
      'mixpanel.com',
      'amplitude.com',
      'branch.io',
      'facebook.com/tr',
      'connect.facebook.net',
      'graph.facebook.com',
      'unity3d.com',
      'adcolony.com',
      'chartboost.com',
      'vungle.com',
      'ironsrc.com',
      'fyber.com',
      'adnxs.com',
      'pubmatic.com',
      'rubiconproject.com',
      'appsflyer.com',
      'fb.gg',
      'exoplayer.dev',
      'dashif.org',
      'acs.amazonaws.com',
      'shopeemobile.com',
      'cv.shopee.sg'
    ];
    if (sdkDomains.some(domain => low.includes(domain))) return true;

    // --- Static/CDN asset paths that aren't APIs ---
    if (low.includes('/download/')) return true;

    // --- Android / Google developer docs & infra ---
    if (low.includes('android.com/apk/res')) return true;
    if (low.includes('developer.android.com')) return true;
    if (low.includes('source.android.com')) return true;
    if (low.includes('developers.google.com')) return true;
    if (low.includes('issuetracker.google.com')) return true;
    if (low.includes('google.com/recaptcha')) return true;
    if (low.includes('google.com/search')) return true;
    if (low.includes('goo.gle')) return true;
    if (low.includes('support.google.com')) return true;
    if (low.includes('play.google.com')) return true;
    if (low.includes('googleusercontent.com')) return true;

    // --- Apple developer docs ---
    if (low.includes('developer.apple.com')) return true;
    if (low.includes('developer.apple.com/streaming')) return true;

    // --- Media / codec specs (not APIs) ---
    if (low.includes('aomedia.org')) return true;
    if (low.includes('mpeg.org')) return true;
    if (low.includes('hevc.org')) return true;
    if (low.includes('webmproject.org')) return true;

    // --- Open-source / tool / language docs ---
    if (low.includes('oracle.com')) return true;
    if (low.includes('apache.org')) return true;
    if (low.includes('microsoft.com')) return true;
    if (low.includes('jetbrains.com')) return true;
    if (low.includes('github.com/kotlin')) return true;
    if (low.includes('github.com/square')) return true;
    if (low.includes('github.com/google')) return true;
    if (low.includes('github.com/adjust')) return true;
    if (low.includes('github.com/facebook')) return true;
    // Any github URL that is just a link (has # anchor or ends with /wiki, /issues, /pull)
    if (low.includes('github.com') && (low.includes('#') || low.includes('/issues') || low.includes('/wiki') || low.includes('/pull'))) return true;

    // --- Generic placeholder / well-known test URLs ---
    if (low.includes('www.example.com') || low === 'https://example.com' || low === 'http://example.com') return true;
    if (low.includes('default.url')) return true;
    if (low.includes('your-api-base-url') || low.includes('your.server.com') || low.includes('your_domain')) return true;

    // --- CDN / static asset hosts that are never real API endpoints ---
    if (low.includes('cdnjs.cloudflare.com')) return true;
    if (low.includes('fonts.googleapis.com')) return true;
    if (low.includes('fonts.gstatic.com')) return true;
    if (low.includes('ajax.googleapis.com')) return true;

    return false;
  }

  private deduplicateEndpoints(arr: ApkEndpoint[]): ApkEndpoint[] {
    const seen = new Set<string>();
    return arr.filter((item) => {
      const key = `${item.method}:${item.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private deduplicateSecrets(arr: ApkSecret[]): ApkSecret[] {
    const seen = new Set<string>();
    return arr.filter((item) => {
      const key = `${item.key}:${item.value}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

