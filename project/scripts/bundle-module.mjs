#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, relative, sep } from 'path';

const target = process.argv[2];
const outDir = 'tmp-bundles';

if (!target) {
  console.error('Usage: npm run bundle:module -- <folder>');
  process.exit(1);
}

const root = join(process.cwd(), target);
if (!statSync(root).isDirectory()) {
  console.error(`Not a directory: ${target}`);
  process.exit(1);
}

function walk(dir) {
  const entries = readdirSync(dir);
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      files.push(...walk(full));
    } else if (!entry.startsWith('.') && /\.(ts|tsx|js|jsx|md|json|css|mjs)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

const files = walk(root).sort();
let output = `# Bundle: ${target}\n\n`;

for (const file of files) {
  const rel = relative(process.cwd(), file).split(sep).join('/');
  output += `\n// ==== ${rel} ====\n`;
  try {
    const content = readFileSync(file, 'utf8');
    output += content;
  } catch (err) {
    output += `[unreadable: ${String(err)}]\n`;
  }
  output += '\n';
}

if (!statSync(outDir, { throwIfNoEntry: false })) {
  mkdirSync(outDir);
}

const slug = target.replace(/[^a-z0-9]/gi, '-');
const outPath = join(outDir, `${slug}.txt`);
writeFileSync(outPath, output);
console.log(`Written ${outPath} (${files.length} files)`);
