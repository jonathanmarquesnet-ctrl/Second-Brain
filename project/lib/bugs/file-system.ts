export interface BugWritable { write(data: string): Promise<void>; close(): Promise<void>; }
export interface BugFileHandle { kind: 'file'; name: string; getFile(): Promise<File>; createWritable(): Promise<BugWritable>; }
export interface BugDirectoryHandle { kind: 'directory'; name: string; values(): AsyncIterableIterator<BugHandle>; getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<BugDirectoryHandle>; getFileHandle(name: string, options?: { create?: boolean }): Promise<BugFileHandle>; }
export type BugHandle = BugFileHandle | BugDirectoryHandle;
export interface BugFile { name: string; path: string; handle: BugFileHandle; }
interface PickerWindow extends Window { showDirectoryPicker?: () => Promise<BugDirectoryHandle>; }
interface MemoryEntry { file: string; date: string; model: string; applied: boolean; }

export const MAX_REVIEW_BYTES = 60 * 1024;

const IGNORED_NAMES = new Set(['node_modules', '.next', 'out', '.git', '.projeto_x_core']);
const TEXT_EXTENSIONS = new Set(['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'json', 'css', 'scss', 'html', 'md', 'txt', 'yml', 'yaml', 'toml', 'py', 'sql', 'sh', 'go', 'rs', 'java', 'c', 'h', 'cpp', 'hpp', 'vue', 'svelte']);

function isTextFile(name: string): boolean {
  const dot = name.lastIndexOf('.');
  return dot > 0 && TEXT_EXTENSIONS.has(name.slice(dot + 1).toLowerCase());
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let activeDirectoryHandle: BugDirectoryHandle | null = null;

export function getActiveDirectory(): BugDirectoryHandle | null {
  return activeDirectoryHandle;
}

export function setActiveDirectory(handle: BugDirectoryHandle | null): void {
  activeDirectoryHandle = handle;
}

export async function readFileByPath(root: BugDirectoryHandle, path: string): Promise<string> {
  const parts = path.replace(/\\/g, '/').split('/').filter(Boolean);
  let current: BugDirectoryHandle = root;
  for (let i = 0; i < parts.length - 1; i++) {
    current = await current.getDirectoryHandle(parts[i]);
  }
  const fileHandle = await current.getFileHandle(parts[parts.length - 1]);
  if (await isTooLarge(fileHandle)) throw new Error('Arquivo excede o limite de 60 KB.');
  return readFile(fileHandle);
}

export function canPickDirectory(): boolean {
  return typeof window !== 'undefined' && typeof (window as PickerWindow).showDirectoryPicker === 'function';
}

export async function pickDirectory(): Promise<BugDirectoryHandle> {
  const picker = (window as PickerWindow).showDirectoryPicker;
  if (!picker) throw new Error('unsupported');
  const handle = await picker();
  setActiveDirectory(handle);
  return handle;
}

export async function listFiles(directory: BugDirectoryHandle, parent = ''): Promise<BugFile[]> {
  const files: BugFile[] = [];
  for await (const entry of directory.values()) {
    if (IGNORED_NAMES.has(entry.name)) continue;
    const path = parent ? `${parent}/${entry.name}` : entry.name;
    if (entry.kind === 'file') {
      if (isTextFile(entry.name)) files.push({ name: entry.name, path, handle: entry });
    } else {
      files.push(...await listFiles(entry, path));
    }
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export async function isTooLarge(file: BugFileHandle): Promise<boolean> {
  return (await file.getFile()).size > MAX_REVIEW_BYTES;
}

export async function readFile(file: BugFileHandle): Promise<string> {
  return file.getFile().then((value) => value.text());
}

export async function writeText(file: BugFileHandle, text: string): Promise<void> {
  const writer = await file.createWritable();
  await writer.write(text);
  await writer.close();
}

export async function recordAttempt(root: BugDirectoryHandle, file: string, model: string, applied: boolean): Promise<void> {
  const memory = await root.getDirectoryHandle('.projeto_x_core', { create: true });
  const target = await memory.getFileHandle('banco_memoria.json', { create: true });
  let entries: MemoryEntry[] = [];
  try {
    entries = JSON.parse(await readFile(target)) as MemoryEntry[];
    if (!Array.isArray(entries)) entries = [];
  } catch {
    entries = [];
  }
  entries.push({ file, date: new Date().toISOString(), model, applied });
  await writeText(target, JSON.stringify(entries, null, 2));
}

function backupPrefix(file: BugFile): string {
  return file.path.replace(/[^a-zA-Z0-9._-]+/g, '_');
}

async function backupsDirectory(root: BugDirectoryHandle): Promise<BugDirectoryHandle> {
  const memory = await root.getDirectoryHandle('.projeto_x_core', { create: true });
  return memory.getDirectoryHandle('backups', { create: true });
}

export async function applyFile(root: BugDirectoryHandle, file: BugFile, corrected: string, model: string): Promise<void> {
  const backups = await backupsDirectory(root);
  const backup = await backups.getFileHandle(`${backupPrefix(file)}-${Date.now()}.bak`, { create: true });
  await writeText(backup, await readFile(file.handle));
  await writeText(file.handle, corrected);
  await recordAttempt(root, file.path, model, true);
}

export async function restoreLatestBackup(root: BugDirectoryHandle, file: BugFile): Promise<boolean> {
  const backups = await backupsDirectory(root);
  const pattern = new RegExp(`^${escapeRegExp(backupPrefix(file))}-(\\d+)\\.bak$`);
  let latest: { name: string; time: number } | null = null;
  for await (const entry of backups.values()) {
    const match = pattern.exec(entry.name);
    if (!match) continue;
    const time = Number(match[1]);
    if (!latest || time > latest.time) latest = { name: entry.name, time };
  }
  if (!latest) return false;
  const backup = await backups.getFileHandle(latest.name);
  await writeText(file.handle, await readFile(backup));
  return true;
}
