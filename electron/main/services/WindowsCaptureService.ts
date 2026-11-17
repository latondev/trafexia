import { EventEmitter } from 'events';
import { execFile, spawn, type ChildProcess } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { createInterface } from 'readline';
import type { CapturedRequest, WindowsCaptureStatus, WindowsProcess } from '../../../shared/types';

const execFileAsync = promisify(execFile);

export class WindowsCaptureService extends EventEmitter {
  private child: ChildProcess | null = null;
  private stopping = false;
  private state: WindowsCaptureStatus = { available: false, running: false, starting: false, pids: [], error: null, certificatePath: null };
  private root: string;

  constructor() {
    super();
    this.root = [process.cwd(), path.resolve(__dirname, '../..'), process.resourcesPath]
      .find((dir) => dir && fs.existsSync(path.join(dir, 'resources', 'windows-capture', 'capture.py'))) || process.cwd();
  }

  private findEngine(): string | null {
    const toolRoot = path.join(this.root, 'resources', 'tools', 'mitmproxy');
    if (!fs.existsSync(toolRoot)) return null;
    const direct = path.join(toolRoot, 'mitmdump.exe');
    if (fs.existsSync(direct)) return direct;
    for (const entry of fs.readdirSync(toolRoot, { withFileTypes: true })) {
      const exe = path.join(toolRoot, entry.name, 'mitmdump.exe');
      if (entry.isDirectory() && fs.existsSync(exe)) return exe;
    }
    return null;
  }

  getStatus(): WindowsCaptureStatus {
    const cert = path.join(this.root, 'resources', 'tools', 'mitmproxy', 'data', 'mitmproxy-ca-cert.cer');
    return { ...this.state, pids: [...this.state.pids], available: process.platform === 'win32' && !!this.findEngine(), certificatePath: fs.existsSync(cert) ? cert : null };
  }

  async listProcesses(): Promise<WindowsProcess[]> {
    if (process.platform !== 'win32') throw new Error('Windows Apps capture requires Windows.');
    const script = '[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false); $parents = @{}; try { Get-CimInstance Win32_Process -ErrorAction Stop | ForEach-Object { $parents[[int]$_.ProcessId] = [int]$_.ParentProcessId } } catch {}; @(Get-Process | ForEach-Object { $exePath = $null; try { $exePath = $_.Path } catch {}; [pscustomobject]@{ pid = $_.Id; parentPid = $parents[[int]$_.Id]; name = $_.ProcessName; executablePath = $exePath; title = $_.MainWindowTitle } }) | ConvertTo-Json -Compress';
    const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true, timeout: 15_000, maxBuffer: 4 * 1024 * 1024, encoding: 'utf8' });
    const parsed: WindowsProcess[] = JSON.parse(stdout.replace(/^\uFEFF/, '') || '[]');
    return parsed.filter((item) => Number.isSafeInteger(item.pid) && item.pid > 4 && item.pid !== process.pid)
      .sort((a, b) => Number(!!b.title) - Number(!!a.title) || a.name.localeCompare(b.name));
  }

  async start(pids: number[]): Promise<WindowsCaptureStatus> {
    if (this.child || this.state.starting || this.stopping) throw new Error('Stop the current Windows capture before selecting another process.');
    if (!Array.isArray(pids) || !pids.length || pids.length > 64 || pids.some((pid) => !Number.isSafeInteger(pid) || pid <= 4 || pid === process.pid)) {
      throw new Error('Select between 1 and 64 valid process IDs.');
    }
    const engine = this.findEngine();
    if (process.platform !== 'win32' || !engine) throw new Error('Run scripts/setup-windows-capture.ps1 from the project folder first.');
    const processes = await this.listProcesses();
    if (pids.some((pid) => !processes.some((item) => item.pid === pid))) throw new Error('A selected process has exited. Refresh the process list and select it again.');
    const toolRoot = path.join(this.root, 'resources', 'tools', 'mitmproxy');
    const tempRoot = path.join(toolRoot, 'temp');
    const configRoot = path.join(toolRoot, 'data');
    fs.mkdirSync(tempRoot, { recursive: true });
    fs.mkdirSync(configRoot, { recursive: true });
    const logPath = path.join(tempRoot, 'windows-capture.log');
    const log = fs.createWriteStream(logPath, { flags: 'a' });
    this.state = { ...this.state, starting: true, running: false, pids: [...new Set(pids)], error: null, warning: null, capturedRequests: 0, tlsFailures: 0 };
    const child = spawn(engine, ['--mode', `local:${this.state.pids.join(',')}`, '--set', `confdir=${configRoot}`, '--set', 'flow_detail=0', '--set', 'connection_strategy=lazy', '-s', path.join(this.root, 'resources', 'windows-capture', 'capture.py')], {
      windowsHide: true,
      cwd: toolRoot,
      env: { ...process.env, TEMP: tempRoot, TMP: tempRoot, TMPDIR: tempRoot, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    this.child = child;
    let diagnostic = '';
    const appendDiagnostic = (chunk: Buffer) => {
      const value = chunk.toString('utf8');
      diagnostic = (diagnostic + value).slice(-6000);
      log.write(value);
      const tlsFailures = value.match(/Client TLS handshake failed/gi)?.length || 0;
      if (tlsFailures) {
        this.state.tlsFailures = (this.state.tlsFailures || 0) + tlsFailures;
        this.state.warning = 'Đã bắt được kết nối, nhưng bắt tay HTTPS thất bại. App có thể chưa tin chứng chỉ capture. Bấm Open HTTPS certificate để cài CA vào Current User / Trusted Root Certification Authorities, sau đó mở lại app. App dùng trust store riêng hoặc certificate pinning có thể vẫn từ chối kết nối.';
      }
    };
    child.stderr?.on('data', appendDiagnostic);
    const lines = createInterface({ input: child.stdout! });
    let ready: (() => void) | undefined;
    lines.on('line', (line) => {
      if (line === 'TRAFEXIA_READY') { ready?.(); return; }
      if (!line.startsWith('TRAFEXIA_FLOW:')) { appendDiagnostic(Buffer.from(line + '\n')); return; }
      try {
        const record = JSON.parse(line.slice('TRAFEXIA_FLOW:'.length)) as Omit<CapturedRequest, 'id'>;
        if (typeof record.url !== 'string' || typeof record.method !== 'string' || !Number.isFinite(record.timestamp)) throw new Error('Malformed capture record');
        this.state.capturedRequests = (this.state.capturedRequests || 0) + 1;
        this.emit('request', record);
      } catch (error) { log.write(`Could not import capture record: ${String(error)}\n`); }
    });
    const exited = new Promise<void>((resolve) => child.once('close', () => resolve()));
    child.once('close', (code) => {
      lines.close();
      log.end();
      if (this.child === child) {
        this.child = null;
        this.state = { ...this.state, running: false, starting: false, error: code && !this.stopping ? `Capture engine exited (${code}). ${diagnostic.trim()} Log: ${logPath}` : null };
      }
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => finish(new Error(`Windows capture did not become ready. Approve its Windows permission prompt if shown. Log: ${logPath}`)), 90_000);
        const onError = (error: Error) => finish(error);
        const onExit = () => {
          const reason = /Failed to start.*administrator|access.*denied|permission.*denied/i.test(diagnostic)
            ? 'Windows did not grant administrator permission for capture. Retry and accept the Windows permission prompt, or launch Trafexia from an Administrator PowerShell window.'
            : `Could not start Windows capture. ${diagnostic.trim()}`;
          finish(new Error(`${reason} Log: ${logPath}`));
        };
        const finish = (error?: Error) => {
          clearTimeout(timer);
          child.removeListener('error', onError);
          child.removeListener('close', onExit);
          ready = undefined;
          if (error) reject(error); else resolve();
        };
        ready = () => finish();
        child.once('error', onError);
        child.once('close', onExit);
      });
      // The local redirector's named-pipe connection completes just after the
      // addon running hook. Let it apply the PID selection before reporting
      // ready so the first request does not escape interception.
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (this.child !== child) throw new Error(`Windows capture stopped during startup. ${diagnostic.trim()} Log: ${logPath}`);
      // Retain an error listener after startup to avoid uncaught process errors.
      child.on('error', (error) => { this.state.error = error.message; });
      this.state.starting = false;
      this.state.running = true;
      return this.getStatus();
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : String(error);
      await this.stop();
      await exited;
      throw error;
    }
  }

  async stop(): Promise<void> {
    const child = this.child;
    if (!child) { this.state.running = false; this.state.starting = false; return; }
    this.stopping = true;
    const exited = new Promise<void>((resolve) => child.once('close', () => resolve()));
    try {
      if (child.pid) {
        await execFileAsync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, timeout: 10_000 }).catch(() => child.kill());
      } else { child.kill(); }
      await exited;
      this.state = { ...this.state, running: false, starting: false, pids: [], error: null };
    } finally { this.stopping = false; }
  }
}
