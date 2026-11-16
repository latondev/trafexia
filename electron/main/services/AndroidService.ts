import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { AndroidDevice } from '../../../shared/types';

const execAsync = promisify(exec);

export class AndroidService {
  private adbPath: string = 'adb';
  private emulatorPath: string = 'emulator';
  private sdkRoot?: string;
  private bridgedDevices = new Set<string>();

  private get adbCommand(): string {
    return `"${this.adbPath}"`;
  }

  constructor() {
    const projectSdk = path.resolve(process.cwd(), 'android-sdk');
    const packagedSdk = path.resolve(__dirname, '../../android-sdk');
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const sdkRoot = [projectSdk, packagedSdk, path.join(localAppData, 'Trafexia', 'android-sdk')]
      .find((candidate) => fs.existsSync(path.join(candidate, 'platform-tools', 'adb.exe')));
    if (sdkRoot) {
      this.sdkRoot = sdkRoot;
      const androidUserHome = path.join(sdkRoot, 'user-home');
      const tempRoot = path.join(sdkRoot, 'temp');
      fs.mkdirSync(androidUserHome, { recursive: true });
      fs.mkdirSync(tempRoot, { recursive: true });
      process.env.ANDROID_HOME = sdkRoot;
      process.env.ANDROID_SDK_ROOT = sdkRoot;
      process.env.ANDROID_USER_HOME = androidUserHome;
      process.env.ANDROID_EMULATOR_HOME = androidUserHome;
      process.env.ANDROID_AVD_HOME = path.join(sdkRoot, 'avd');
      // Android's temporary userdata image and APK extraction can be large.
      // Keep these on the project drive too, instead of the default C: temp.
      process.env.TEMP = tempRoot;
      process.env.TMP = tempRoot;
      process.env.TMPDIR = tempRoot;
      // Optional chatgpt2api setup also downloads Python through uv at startup.
      // Keep uv-managed Python and package caches on the SDK/project drive.
      process.env.UV_PYTHON_INSTALL_DIR = path.join(sdkRoot, 'uv-python');
      process.env.UV_CACHE_DIR = path.join(sdkRoot, 'uv-cache');
      process.env.UV_PYTHON_CACHE_DIR = path.join(sdkRoot, 'uv-python-cache');
    }
    this.detectAdb();
    this.detectEmulator();
  }

  private detectAdb() {
    const home = os.homedir();
    const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    const commonPaths = [
      path.resolve(process.cwd(), 'android-sdk', 'platform-tools', 'adb.exe'),
      path.resolve(__dirname, '../../android-sdk/platform-tools/adb.exe'),
      path.join(localAppData, 'Trafexia', 'android-sdk', 'platform-tools', 'adb.exe'),
      path.join(localAppData, 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
      path.join(home, 'Library/Android/sdk/platform-tools/adb'),
      path.join(home, 'Android/Sdk/platform-tools/adb'),
      '/usr/local/bin/adb',
      '/opt/homebrew/bin/adb'
    ];

    for (const p of commonPaths) {
      if (fs.existsSync(p)) {
        this.adbPath = p;
        console.log(`[AndroidService] Found adb at: ${p}`);
        return;
      }
    }
    console.warn('[AndroidService] adb not found in common paths, falling back to system PATH');
  }

  private detectEmulator() {
    const home = os.homedir();
    const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    const commonPaths = [
      path.resolve(process.cwd(), 'android-sdk', 'emulator', 'emulator.exe'),
      path.resolve(__dirname, '../../android-sdk/emulator/emulator.exe'),
      path.join(localAppData, 'Trafexia', 'android-sdk', 'emulator', 'emulator.exe'),
      path.join(localAppData, 'Android', 'Sdk', 'emulator', 'emulator.exe'),
      path.join(home, 'Library/Android/sdk/emulator/emulator'),
      path.join(home, 'Android/Sdk/emulator/emulator'),
    ];

    for (const p of commonPaths) {
      if (fs.existsSync(p)) {
        this.emulatorPath = p;
        console.log(`[AndroidService] Found emulator at: ${p}`);
        return;
      }
    }
  }

  /**
   * List available Android Virtual Devices (AVDs)
   */
  async listAvds(): Promise<string[]> {
    try {
      const { stdout } = await execAsync(`"${this.emulatorPath}" -list-avds`);
      return stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    } catch (error) {
      console.error('[AndroidService] Failed to list AVDs:', error);
      return [];
    }
  }

  /**
   * Launch a specific AVD
   */
  async launchAvd(name: string): Promise<boolean> {
    const { spawn } = await import('child_process');
    try {
      console.log(`[AndroidService] Launching AVD: ${name}`);
      const isArm64SoftwareAvd = name.includes('ARM64');
      // The generated AVD defaults to a 10 GB data partition, which can make
      // the emulator refuse to start when the SDK drive is short on free space.
      // Emulator 37 accepts partition sizes only up to 2047 MB. Keep the
      // writable data partition small and skip potentially stale snapshots.
      const args = [`@${name}`, '-no-snapshot', '-partition-size', '2047'];
      if (isArm64SoftwareAvd) args.push('-accel', 'off');
      const sdkRoot = this.sdkRoot || process.cwd();
      const tempRoot = path.join(sdkRoot, 'temp');
      const androidUserHome = path.join(sdkRoot, 'user-home');
      fs.mkdirSync(tempRoot, { recursive: true });
      fs.mkdirSync(androidUserHome, { recursive: true });
      const safeAvdName = name.trim().replace(/[^a-zA-Z0-9._-]/g, '_');
      const logPath = path.join(tempRoot, `trafexia-emulator-${safeAvdName}.log`);
      const logFd = fs.openSync(logPath, 'a');
      const childProcess = spawn(this.emulatorPath, args, {
        detached: true,
        stdio: ['ignore', logFd, logFd],
        env: {
          ...process.env,
          ANDROID_USER_HOME: androidUserHome,
          ANDROID_EMULATOR_HOME: androidUserHome,
          ANDROID_AVD_HOME: path.join(sdkRoot, 'avd'),
          TEMP: tempRoot,
          TMP: tempRoot,
          TMPDIR: tempRoot,
          ...(isArm64SoftwareAvd ? { ANDROID_I_WANT_MY_TCG: 'yes' } : {}),
        },
      });
      try {
        await new Promise<void>((resolve, reject) => {
          childProcess.once('spawn', () => resolve());
          childProcess.once('error', reject);
        });
      } finally {
        fs.closeSync(logFd);
      }
      childProcess.unref();
      console.log(`[AndroidService] Emulator output is being written to: ${logPath}`);
      return true;
    } catch (error) {
      console.error(`[AndroidService] Failed to launch AVD ${name}:`, error);
      throw new Error(`Failed to start emulator ${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async launchDefaultEmulatorForCapture(proxyPort: number): Promise<void> {
    const avds = await this.listAvds();
    if (avds.length === 0) throw new Error('No Android AVD found. Run an emulator setup script first.');
    // The standalone Emulator button should choose the accelerated host-matching AVD.
    // ARM64 AVDs on x86_64 hosts use software emulation and are only selected for ARM-only APKs.
    const preferredAvd = avds.find((name) => !name.includes('ARM64')) || avds[0];

    const findRunningEmulator = async () => {
      const { stdout } = await execAsync(`"${this.adbPath}" devices`);
      return stdout.split(/\r?\n/).map((line) => line.trim().split(/\s+/))
        .find((parts) => parts[0]?.startsWith('emulator-') && parts[1] === 'device')?.[0] || '';
    };
    let deviceId = await findRunningEmulator();
    if (!deviceId) {
      if (!await this.launchAvd(preferredAvd)) throw new Error('Could not start the Android emulator.');
      const deadline = Date.now() + (preferredAvd.includes('ARM64') ? 600_000 : 300_000);
      while (!deviceId && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        deviceId = await findRunningEmulator();
      }
      if (!deviceId) throw new Error('Emulator did not connect to ADB in time.');
    }

    const adb = `"${this.adbPath}" -s ${deviceId}`;
    await execAsync(`${adb} wait-for-device`, { timeout: 180_000 });
    const bootDeadline = Date.now() + 600_000;
    let booted = false;
    while (!booted && Date.now() < bootDeadline) {
      try {
        const { stdout } = await execAsync(`${adb} shell getprop sys.boot_completed`, { timeout: 10_000 });
        booted = stdout.trim() === '1';
      } catch { /* wait for the emulator to finish starting */ }
      if (!booted) await new Promise((resolve) => setTimeout(resolve, 2500));
    }
    if (!booted) throw new Error('Android did not finish booting.');
    await execAsync(`${adb} shell settings put global http_proxy 10.0.2.2:${proxyPort}`, { timeout: 15_000 });
  }

  async runApkInEmulator(sourcePath: string, packageName: string, proxyPort: number, analysisOutputDir?: string): Promise<void> {
    let apkPath = sourcePath;
    let splitApks: string[] = [];
    if (analysisOutputDir) {
      if (path.extname(sourcePath).toLowerCase() === '.xapk') {
        const findApks = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
          const entryPath = path.join(dir, entry.name);
          return entry.isDirectory() ? findApks(entryPath) : (entry.isFile() && entry.name.toLowerCase().endsWith('.apk') ? [entryPath] : []);
        });
        splitApks = findApks(analysisOutputDir).sort((a, b) => {
          const aBase = path.basename(a).toLowerCase() === 'base.apk' ? -1 : 0;
          const bBase = path.basename(b).toLowerCase() === 'base.apk' ? -1 : 0;
          return aBase - bBase;
        });
        apkPath = splitApks[0] || '';
      } else {
        const analyzedCopy = path.join(analysisOutputDir, 'source.apk');
        if (fs.existsSync(analyzedCopy)) apkPath = analyzedCopy;
      }
    }
    if (!fs.existsSync(apkPath)) throw new Error('The selected APK is missing. Clear the scan, select the APK again, and retry.');
    if (!packageName || packageName === 'Unknown') throw new Error('APK package name was not detected.');
    const avds = await this.listAvds();
    if (avds.length === 0) throw new Error('No AVD found. Run scripts/setup-android-emulator.ps1 first.');
    const needsArm64 = splitApks.some((apk) => path.basename(apk).toLowerCase().includes('arm64_v8a'));
    const avdName = needsArm64 ? avds.find((name) => name.includes('ARM64')) : avds.find((name) => !name.includes('ARM64'));
    if (needsArm64 && !avdName) {
      throw new Error('This XAPK only includes ARM64 native libraries. Run scripts/setup-android-arm64-emulator.ps1, then retry.');
    }
    const selectedAvd = avdName || avds[0];

    let deviceId = '';
    const findEmulator = async () => {
      const { stdout } = await execAsync(`"${this.adbPath}" devices`);
      const ids = stdout.split(/\r?\n/).map((line) => line.trim().split(/\s+/))
        .filter((parts) => parts[0]?.startsWith('emulator-') && parts[1] === 'device').map((parts) => parts[0]);
      for (const id of ids) {
        if (!needsArm64) return id;
        try {
          const { stdout: abi } = await execAsync(`"${this.adbPath}" -s ${id} shell getprop ro.product.cpu.abi`, { timeout: 5_000 });
          if (abi.trim().startsWith('arm64')) return id;
        } catch { /* ignore devices that are still booting */ }
      }
      return '';
    };
    deviceId = await findEmulator();
    if (!deviceId) {
      if (!await this.launchAvd(selectedAvd)) throw new Error('Could not start the Android emulator.');
      const deadline = Date.now() + (needsArm64 ? 600_000 : 300_000);
      while (!deviceId && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        deviceId = await findEmulator();
      }
      if (!deviceId) throw new Error(`Matching ${needsArm64 ? 'ARM64 ' : ''}emulator did not connect to ADB in time.`);
    }

    const adb = `"${this.adbPath}" -s ${deviceId}`;
    await execAsync(`${adb} wait-for-device`, { timeout: 180_000 });
    const bootDeadline = Date.now() + (needsArm64 ? 600_000 : 300_000);
    let booted = false;
    while (!booted && Date.now() < bootDeadline) {
      try {
        const { stdout } = await execAsync(`${adb} shell getprop sys.boot_completed`, { timeout: 10_000 });
        booted = stdout.trim() === '1';
      } catch { /* keep waiting while Android boots */ }
      if (!booted) await new Promise((resolve) => setTimeout(resolve, 2500));
    }
    if (!booted) throw new Error(`Android emulator did not finish booting within ${needsArm64 ? '10' : '3'} minutes.`);

    await execAsync(`${adb} shell settings put global http_proxy 10.0.2.2:${proxyPort}`, { timeout: 15_000 });
    await execAsync(`${adb} shell am force-stop ${packageName}`, { timeout: 15_000 }).catch(() => undefined);
    const installArgs = splitApks.length > 1
      ? `install-multiple -r -d -t -g ${splitApks.map((apk) => `"${apk}"`).join(' ')}`
      : `install -r -d -t -g "${apkPath}"`;
    await execAsync(`${adb} ${installArgs}`, { timeout: 180_000, maxBuffer: 8 * 1024 * 1024 });
    await execAsync(`${adb} shell monkey -p ${packageName} 1`, { timeout: 30_000 });
  }

  async getInstalledApps(deviceId: string): Promise<string[]> {
    const { stdout } = await execAsync(`"${this.adbPath}" -s ${deviceId} shell pm list packages -3`, { timeout: 20_000 });
    return stdout.split(/\r?\n/).map((line) => line.trim().replace(/^package:/, ''))
      .filter((name) => /^[A-Za-z0-9._]+$/.test(name)).sort((a, b) => a.localeCompare(b));
  }

  async launchInstalledApp(deviceId: string, packageName: string): Promise<boolean> {
    if (!/^([A-Za-z0-9_]+\.)*[A-Za-z0-9_]+$/.test(packageName)) throw new Error('Invalid Android package name.');
    await execAsync(`"${this.adbPath}" -s ${deviceId} shell monkey -p ${packageName} 1`, { timeout: 30_000 });
    return true;
  }

  /**
   * List all connected Android devices and emulators
   */
  async listDevices(): Promise<AndroidDevice[]> {
    try {
      console.log('[AndroidService] Scanning for devices using:', this.adbPath);
      const { stdout } = await execAsync(`${this.adbCommand} devices -l`);
      const lines = stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      console.log(`[AndroidService] adb output: ${lines.length} lines`);

      // Skip the first line ("List of devices attached") and parse device info
      const devicePromises = lines.slice(1).map(async (line): Promise<AndroidDevice | null> => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        const parts = trimmed.split(/\s+/);
        if (parts.length < 2) return null;

        const id = parts[0];
        const status = parts[1];
        
        // Extract model name from the -l output (e.g. model:Pixel_4)
        const modelMatch = trimmed.match(/model:([^\s]+)/);
        const model = modelMatch ? modelMatch[1].replace(/_/g, ' ') : id;

        const type = id.startsWith('emulator-') ? 'emulator' : 'physical';
        
        // Check root and proxy settings in parallel
        const [isRooted, currentProxy] = await Promise.all([
          this.checkRoot(id),
          this.getProxySetting(id)
        ]);

        return {
          id,
          model,
          type,
          status,
          isRooted,
          currentProxy
        };
      });

      const devices = await Promise.all(devicePromises);
      return devices.filter((d): d is AndroidDevice => d !== null);
    } catch (error) {
      console.error('[AndroidService] Failed to list devices:', error);
      return [];
    }
  }

  /**
   * Check if a device has root access
   */
  private async checkRoot(deviceId: string): Promise<boolean> {
    try {
      // Try to run 'su' command
      const { stdout } = await execAsync(`${this.adbCommand} -s ${deviceId} shell which su`);
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Configure proxy on a specific device
   */
  async bridgeDevice(deviceId: string, proxyUrl: string): Promise<boolean> {
    try {
      const deviceProxy = deviceId.startsWith('emulator-')
        ? `10.0.2.2:${proxyUrl.split(':').pop()}`
        : proxyUrl;
      console.log(`[AndroidService] Configuring proxy ${deviceProxy} on device ${deviceId}`);
      await execAsync(`"${this.adbPath}" -s ${deviceId} shell settings put global http_proxy ${deviceProxy}`);
      this.bridgedDevices.add(deviceId);
      return true;
    } catch (error) {
      console.error(`[AndroidService] Failed to bridge device ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Install an APK on a specific device
   */
  async installApk(deviceId: string, apkPath: string): Promise<boolean> {
    try {
      console.log(`[AndroidService] Installing APK ${apkPath} on device ${deviceId}`);
      // -r: replace existing application
      // -d: allow version code downgrade
      // -t: allow test packages
      // -g: grant all runtime permissions
      const cmd = `"${this.adbPath}" -s ${deviceId} install -r -d -t -g "${apkPath}"`;
      await execAsync(cmd);
      console.log(`[AndroidService] APK installed successfully on ${deviceId}`);
      return true;
    } catch (error) {
      console.error(`[AndroidService] Failed to install APK on device ${deviceId}:`, error);
      
      // Attempt to uninstall first if it's a split/signature conflict
      if (error instanceof Error && (error.message.includes('MISSING_SPLIT') || error.message.includes('UPDATE_INCOMPATIBLE'))) {
        try {
          console.log(`[AndroidService] Attempting to uninstall before retry...`);
          // Try to find package name from filename (e.g. com.locket.Locket-injected.apk)
          const filename = path.basename(apkPath);
          const pkgMatch = filename.match(/^([a-zA-Z0-9._]+)/);
          if (pkgMatch) {
            await execAsync(`"${this.adbPath}" -s ${deviceId} uninstall ${pkgMatch[1]}`);
            const retryCmd = `"${this.adbPath}" -s ${deviceId} install -r -d -t -g "${apkPath}"`;
            await execAsync(retryCmd);
            return true;
          }
        } catch (retryError) {
          console.error(`[AndroidService] Uninstall/Retry failed:`, retryError);
        }
      }
      return false;
    }
  }

  /**
   * Helper to check the current proxy setting on the device
   */
  private async getProxySetting(deviceId: string): Promise<string | null> {
    try {
      const { stdout } = await execAsync(`${this.adbCommand} -s ${deviceId} shell settings get global http_proxy`);
      const val = stdout.trim();
      if (!val || val === 'null' || val === ':0') {
        return null;
      }
      return val;
    } catch {
      return null;
    }
  }

  /**
   * Clear proxy on a specific device
   */
  async clearProxy(deviceId: string): Promise<boolean> {
    try {
      console.log(`[AndroidService] Clearing proxy on device ${deviceId}`);
      await execAsync(`${this.adbCommand} -s ${deviceId} shell settings delete global http_proxy`);
      await execAsync(`${this.adbCommand} -s ${deviceId} shell settings delete global global_http_proxy_host`);
      await execAsync(`${this.adbCommand} -s ${deviceId} shell settings delete global global_http_proxy_port`);
      this.bridgedDevices.delete(deviceId);
      return true;
    } catch (error) {
      console.error(`[AndroidService] Failed to clear proxy on device ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Synchronously clear proxy on a device (used during application quit)
   */
  clearProxySync(deviceId: string): boolean {
    try {
      const { execSync } = require('child_process');
      console.log(`[AndroidService] Sync-clearing proxy on device ${deviceId}`);
      execSync(`${this.adbCommand} -s ${deviceId} shell settings delete global http_proxy`);
      execSync(`${this.adbCommand} -s ${deviceId} shell settings delete global global_http_proxy_host`);
      execSync(`${this.adbCommand} -s ${deviceId} shell settings delete global global_http_proxy_port`);
      this.bridgedDevices.delete(deviceId);
      return true;
    } catch (error) {
      console.error(`[AndroidService] Failed to sync-clear proxy on device ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Clear proxy on all bridged devices
   */
  async clearAllProxies(): Promise<void> {
    console.log(`[AndroidService] Clearing proxies on all bridged devices:`, Array.from(this.bridgedDevices));
    for (const deviceId of this.bridgedDevices) {
      await this.clearProxy(deviceId);
    }
    this.bridgedDevices.clear();
  }

  /**
   * Synchronously clear proxy on all bridged devices (for exit cleanup)
   */
  clearAllProxiesSync(): void {
    console.log(`[AndroidService] Sync-clearing proxies on all bridged devices:`, Array.from(this.bridgedDevices));
    for (const deviceId of this.bridgedDevices) {
      this.clearProxySync(deviceId);
    }
    this.bridgedDevices.clear();
  }

  /**
   * Install multiple APKs (Split APKs / App Bundle) on a specific device
   */
  async installMultipleApks(deviceId: string, apkPaths: string[]): Promise<boolean> {
    try {
      console.log(`[AndroidService] Installing ${apkPaths.length} APKs on device ${deviceId}`);
      const paths = apkPaths.map(p => `"${p}"`).join(' ');
      const cmd = `"${this.adbPath}" -s ${deviceId} install-multiple -r -d -t -g ${paths}`;
      await execAsync(cmd);
      return true;
    } catch (error) {
      console.error(`[AndroidService] Failed to install multiple APKs on device ${deviceId}:`, error);
      
      // Fallback: Attempt to uninstall first
      if (error instanceof Error && (error.message.includes('UPDATE_INCOMPATIBLE') || error.message.includes('VERSION_DOWNGRADE'))) {
        try {
          console.log(`[AndroidService] Attempting to uninstall before retry...`);
          const baseName = path.basename(apkPaths[0]);
          const pkgMatch = baseName.match(/^([a-zA-Z0-9._]+)/);
          if (pkgMatch) {
            await execAsync(`"${this.adbPath}" -s ${deviceId} uninstall ${pkgMatch[1]}`);
            const retryCmd = `"${this.adbPath}" -s ${deviceId} install-multiple -r -d -t -g ${apkPaths.map(p => `"${p}"`).join(' ')}`;
            await execAsync(retryCmd);
            return true;
          }
        } catch (retryError) {
          console.error(`[AndroidService] Uninstall/Retry failed:`, retryError);
        }
      }
      return false;
    }
  }
}
