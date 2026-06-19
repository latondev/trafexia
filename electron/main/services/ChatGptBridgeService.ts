import { join } from 'path';
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { execFile, spawn, ChildProcess } from 'child_process';
import { homedir } from 'os';

export interface BridgeStatus {
  installed: boolean;
  running: boolean;
  cloning: boolean;
  installing: boolean;
  error: string | null;
  port: number;
}

export class ChatGptBridgeService {
  private static readonly REPO_URL = 'https://github.com/basketikun/chatgpt2api.git';
  static readonly PORT = 3040;

  private readonly repoDir: string;
  private bridgeProcess: ChildProcess | null = null;
  private _cloning = false;
  private _installing = false;
  private _error: string | null = null;
  private _uvPath: string | null = null;

  constructor(userDataPath: string) {
    this.repoDir = join(userDataPath, 'chatgpt2api');
  }

  /** Fully ready = repo cloned AND uv venv exists (uv sync was run). */
  isInstalled(): boolean {
    return (
      existsSync(join(this.repoDir, 'main.py')) &&
      existsSync(join(this.repoDir, '.venv'))
    );
  }

  isRunning(): boolean {
    return this.bridgeProcess !== null && !this.bridgeProcess.killed;
  }

  getStatus(): BridgeStatus {
    return {
      installed: this.isInstalled(),
      running: this.isRunning(),
      cloning: this._cloning,
      installing: this._installing,
      error: this._error,
      port: ChatGptBridgeService.PORT,
    };
  }

  /**
   * Clone repo (if needed) and run `uv sync` to create venv with Python 3.13.
   * Idempotent — safe to call multiple times.
   */
  async clone(): Promise<void> {
    if (this._cloning || this._installing) return;
    if (this.isInstalled()) return;

    this._error = null;

    try {
      // 1. Find or install uv (handles Python version automatically via .python-version)
      const uvCmd = await this._findOrInstallUv();
      if (!uvCmd) {
        throw new Error(
          'Could not find or install uv.\n' +
          'Please install manually: brew install uv\n' +
          'Or visit: https://docs.astral.sh/uv/'
        );
      }
      this._uvPath = uvCmd;

      // 2. Clone repo if not yet cloned
      if (!existsSync(join(this.repoDir, 'main.py'))) {
        this._cloning = true;
        console.log('[ChatGptBridge] Cloning repository...');
        await this._exec('git', ['clone', '--depth=1', ChatGptBridgeService.REPO_URL, this.repoDir]);
        this._cloning = false;
        console.log('[ChatGptBridge] Clone complete.');
      }

      // 3. uv sync — downloads Python 3.13 + all dependencies into .venv
      this._installing = true;
      console.log('[ChatGptBridge] Running uv sync (may download Python 3.13)...');
      await this._exec(uvCmd, ['sync'], this.repoDir);
      console.log('[ChatGptBridge] Installation complete.');
    } catch (err: any) {
      this._error = (err as Error).message || String(err);
      console.error('[ChatGptBridge] Setup error:', this._error);
      throw err;
    } finally {
      this._cloning = false;
      this._installing = false;
    }
  }

  /** Start the uvicorn server via `uv run`. */
  async start(authKey: string): Promise<void> {
    if (this.isRunning()) return;
    if (!this.isInstalled()) throw new Error('chatgpt2api is not installed. Click "Install & Start" first.');

    this._error = null;

    const uvCmd = this._uvPath ?? await this._findUv();
    if (!uvCmd) {
      throw new Error('uv not found. Please run brew install uv and try again.');
    }
    this._uvPath = uvCmd;

    // Write .env
    writeFileSync(
      join(this.repoDir, '.env'),
      `CHATGPT2API_AUTH_KEY=${authKey}\nSTORAGE_BACKEND=json\n`,
      'utf-8'
    );

    this.bridgeProcess = spawn(
      uvCmd,
      [
        'run', 'python', '-m', 'uvicorn', 'main:app',
        '--host', '127.0.0.1',
        '--port', String(ChatGptBridgeService.PORT),
        '--no-access-log',
      ],
      {
        cwd: this.repoDir,
        env: { 
          ...process.env,
          CHATGPT2API_AUTH_KEY: authKey,
          STORAGE_BACKEND: 'json'
        },
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );

    this.bridgeProcess.stdout?.on('data', (d: Buffer) =>
      console.log('[ChatGptBridge]', d.toString().trim())
    );
    this.bridgeProcess.stderr?.on('data', (d: Buffer) =>
      console.error('[ChatGptBridge]', d.toString().trim())
    );
    this.bridgeProcess.on('exit', (code) => {
      console.log(`[ChatGptBridge] Process exited with code ${code}`);
      this.bridgeProcess = null;
    });
    this.bridgeProcess.on('error', (err) => {
      console.error('[ChatGptBridge] Process error:', err);
      this._error = err.message;
      this.bridgeProcess = null;
    });

    console.log(`[ChatGptBridge] Started on http://127.0.0.1:${ChatGptBridgeService.PORT}`);
  }

  /** Stop the running bridge server. */
  stop(): void {
    if (this.bridgeProcess) {
      this.bridgeProcess.kill('SIGTERM');
      this.bridgeProcess = null;
    }
  }

  // ===== Account Management =====

  private getAccountsFile(): string {
    return join(this.repoDir, 'data', 'accounts.json');
  }

  getAccounts(): any[] {
    const file = this.getAccountsFile();
    if (!existsSync(file)) return [];
    try {
      return JSON.parse(readFileSync(file, 'utf-8')) || [];
    } catch {
      return [];
    }
  }

  addAccount(token: string, name?: string): void {
    const accounts = this.getAccounts();
    // Prevent duplicate
    if (accounts.some(a => a.access_token === token || a.refresh_token === token)) {
      return;
    }
    accounts.push({
      email: name || `account_${Date.now()}`,
      access_token: token.startsWith('sk-') ? '' : token, // Only put in access_token if it's not sk-
      refresh_token: token.startsWith('sk-') ? token : '',
      status: 'normal',
      shared: true,
      account_type: 'free',
      is_session: false
    });
    
    const dataDir = join(this.repoDir, 'data');
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
    writeFileSync(this.getAccountsFile(), JSON.stringify(accounts, null, 2), 'utf-8');
  }

  removeAccount(token: string): void {
    let accounts = this.getAccounts();
    accounts = accounts.filter(a => a.access_token !== token && a.refresh_token !== token);
    writeFileSync(this.getAccountsFile(), JSON.stringify(accounts, null, 2), 'utf-8');
  }

  // ===== Private helpers =====

  /** Find uv binary in PATH and common install locations. */
  private async _findUv(): Promise<string | null> {
    const candidates = [
      '/opt/homebrew/bin/uv',   // Apple Silicon brew
      '/usr/local/bin/uv',      // Intel brew
      join(homedir(), '.local', 'bin', 'uv'),  // official installer
      join(homedir(), '.cargo', 'bin', 'uv'),  // cargo
      'uv',                     // PATH fallback
    ];
    for (const uvPath of candidates) {
      try {
        await this._exec(uvPath, ['--version']);
        return uvPath;
      } catch {
        // not at this location
      }
    }
    return null;
  }

  /** Find uv, installing it via brew if necessary. */
  private async _findOrInstallUv(): Promise<string | null> {
    const found = await this._findUv();
    if (found) return found;

    // Try brew install uv (brew is at a fixed path on macOS)
    const brewPaths = ['/opt/homebrew/bin/brew', '/usr/local/bin/brew', 'brew'];
    for (const brewPath of brewPaths) {
      try {
        console.log('[ChatGptBridge] Installing uv via brew...');
        await this._exec(brewPath, ['install', 'uv'], undefined, 120_000);
        return this._findUv();
      } catch {
        // try next brew location
      }
    }

    return null;
  }

  private _exec(cmd: string, args: string[], cwd?: string, timeoutMs = 300_000): Promise<void> {
    return new Promise((resolve, reject) => {
      execFile(cmd, args, { cwd, timeout: timeoutMs }, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}
