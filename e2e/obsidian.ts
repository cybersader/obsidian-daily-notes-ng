import { Page, chromium, Browser } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess, execSync } from 'child_process';
import * as os from 'os';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const E2E_VAULT_DIR = path.join(PROJECT_ROOT, 'test-vault');

/** Detect if running inside WSL2 */
function isWSL2(): boolean {
  try {
    const version = fs.readFileSync('/proc/version', 'utf-8');
    return /microsoft/i.test(version);
  } catch {
    return false;
  }
}

/** Convert a WSL2 Linux path to a Windows path */
function toWindowsPath(linuxPath: string): string {
  try {
    return execSync(`wslpath -w "${linuxPath}"`, { encoding: 'utf-8' }).trim();
  } catch {
    return linuxPath;
  }
}

/**
 * Find Obsidian executable based on platform.
 */
function findObsidianBinary(): string | null {
  const platform = os.platform();

  if (platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const candidates = [
      path.join(localAppData, 'Obsidian', 'Obsidian.exe'),
      path.join(localAppData, 'Programs', 'Obsidian', 'Obsidian.exe'),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate;
    }
    return null;
  } else if (platform === 'darwin') {
    const candidates = [
      '/Applications/Obsidian.app/Contents/MacOS/Obsidian',
      path.join(os.homedir(), 'Applications', 'Obsidian.app', 'Contents', 'MacOS', 'Obsidian'),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate;
    }
    return null;
  } else {
    // WSL2: Use Windows Obsidian.exe
    if (isWSL2()) {
      const usersDir = '/mnt/c/Users';
      if (fs.existsSync(usersDir)) {
        const users = fs.readdirSync(usersDir).filter(u =>
          !['Public', 'Default', 'Default User', 'All Users'].includes(u)
          && fs.statSync(path.join(usersDir, u)).isDirectory()
        );
        for (const user of users) {
          const candidate = path.join(usersDir, user, 'AppData', 'Local', 'Obsidian', 'Obsidian.exe');
          if (fs.existsSync(candidate)) return candidate;
        }
      }
    }

    // Linux: Common locations
    const homeDir = os.homedir();
    const candidates = [
      path.join(homeDir, 'Applications', 'Obsidian.AppImage'),
      '/usr/local/bin/obsidian',
      '/usr/bin/obsidian',
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate;
    }
    return null;
  }
}

export interface ObsidianApp {
  browser?: Browser;
  process?: ChildProcess;
  page: Page;
  isExistingInstance?: boolean;
}

async function tryConnectExisting(port: number): Promise<string | null> {
  try {
    const http = await import('http');
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${port}/json/version`, (res) => {
        let data = '';
        res.on('data', (chunk: string) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json.webSocketDebuggerUrl || null);
          } catch {
            resolve(null);
          }
        });
      });
      req.on('error', () => resolve(null));
      req.setTimeout(2000, () => { req.destroy(); resolve(null); });
    });
  } catch {
    return null;
  }
}

async function waitForCdpUrl(
  port: number,
  proc: ChildProcess,
  timeoutMs: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    let resolved = false;

    const finish = (url: string) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      clearInterval(pollTimer);
      resolve(url);
    };

    const onData = (data: Buffer) => {
      const match = data.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) finish(match[1]);
    };

    const pollTimer = setInterval(async () => {
      if (resolved) return;
      const existing = await tryConnectExisting(port);
      if (existing) finish(existing);
    }, 500);

    const timeout = setTimeout(() => {
      if (!resolved) {
        clearInterval(pollTimer);
        reject(new Error('Timeout waiting for DevTools'));
      }
    }, timeoutMs);

    proc.stdout?.on('data', onData);
    proc.stderr?.on('data', onData);
    proc.on('exit', (code) => {
      if (!resolved) {
        clearTimeout(timeout);
        clearInterval(pollTimer);
        reject(new Error(`Obsidian exited before DevTools ready (code=${code})`));
      }
    });
  });
}

export async function launchObsidian(): Promise<ObsidianApp> {
  const obsidianBinary = findObsidianBinary();
  if (!obsidianBinary) {
    throw new Error('Obsidian not found. Install from https://obsidian.md');
  }

  console.log(`Using Obsidian: ${obsidianBinary}`);
  const port = 9333;

  // Try connecting to existing instance first
  const existingUrl = await tryConnectExisting(port);
  let cdpUrl = '';
  let obsidianProcess: ChildProcess | undefined;

  if (existingUrl) {
    console.log('Connecting to existing Obsidian instance...');
    cdpUrl = existingUrl;
  } else {
    console.log('Launching Obsidian...');
    const vaultPath = isWSL2() ? toWindowsPath(E2E_VAULT_DIR) : E2E_VAULT_DIR;
    const args = [`--remote-debugging-port=${port}`, `obsidian://open?path=${encodeURIComponent(vaultPath)}`];

    if (isWSL2()) {
      obsidianProcess = spawn(obsidianBinary, args, {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } else {
      obsidianProcess = spawn(obsidianBinary, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    }

    cdpUrl = await waitForCdpUrl(port, obsidianProcess, 30000);
  }

  console.log(`CDP URL: ${cdpUrl}`);
  const browser = await chromium.connectOverCDP(cdpUrl);
  const contexts = browser.contexts();
  const page = contexts[0]?.pages()[0] || await contexts[0]?.newPage();

  if (!page) throw new Error('Could not get Obsidian page');

  return {
    browser,
    process: obsidianProcess,
    page,
    isExistingInstance: !obsidianProcess,
  };
}

/** Run an Obsidian command via the command palette */
export async function runCommand(page: Page, commandName: string): Promise<void> {
  await page.keyboard.press('Control+p');
  await page.waitForTimeout(300);
  await page.keyboard.type(commandName);
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
}

/** Wait for an Obsidian Notice to appear */
export async function waitForNotice(page: Page, text?: string, timeout = 5000): Promise<string> {
  const selector = text
    ? `.notice:has-text("${text}")`
    : '.notice';
  const notice = await page.waitForSelector(selector, { timeout });
  return notice ? await notice.textContent() || '' : '';
}
