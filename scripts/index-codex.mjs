#!/usr/bin/env node
/**
 * KHASLANA — Codex indexer
 *
 * Optional now. The app scans `codex/` on every load and parses anything new
 * by itself, so the folder is the source of truth whether or not this ever
 * runs. What this still buys you: a single pre-built index that loads
 * instantly and lives in a file, instead of parsing chapters in the browser.
 *
 * Run it after a big batch, or never. The parsing rules come from
 * assets/extract.js — the same file the browser uses — so the two agree.
 *
 * Usage:  node scripts/index-codex.mjs
 *         node scripts/index-codex.mjs --dir "/another/folder"
 */

import { readdir, readFile, writeFile, stat, symlink, readlink, rm } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const EX = require(join(ROOT, 'assets', 'extract.js'));

const DEFAULT_DIR = join(homedir(), 'Desktop', 'All 101 ENARM');
const argDir = process.argv.indexOf('--dir');
const SOURCE_DIR = argDir !== -1 ? process.argv[argDir + 1] : DEFAULT_DIR;

async function main() {
  let files;
  try {
    files = (await readdir(SOURCE_DIR)).filter(f => f.toLowerCase().endsWith('.html'));
  } catch {
    console.error(`\n  ✕ No encontré la carpeta:\n    ${SOURCE_DIR}\n`);
    console.error(`    Corre con --dir "/ruta/a/tus/temas" si la moviste.\n`);
    process.exit(1);
  }
  files.sort((a, b) => a.localeCompare(b, 'es'));

  /* The symlink is what lets the app open and scan chapters at all. Rebuilt
     every run, so moving the source folder is self-healing. */
  const linkPath = join(ROOT, 'codex');
  let linked = 'ya estaba';
  try {
    const cur = await readlink(linkPath).catch(() => null);
    if (cur !== SOURCE_DIR) {
      await rm(linkPath, { force: true, recursive: false }).catch(() => {});
      await symlink(SOURCE_DIR, linkPath, 'dir');
      linked = cur ? 'reapuntado' : 'creado';
    }
  } catch (err) {
    linked = `✕ no se pudo (${err.code})`;
  }

  const entries = [];
  let poor = 0;
  for (const file of files) {
    const full = join(SOURCE_DIR, file);
    const [html, info] = await Promise.all([readFile(full, 'utf8'), stat(full)]);
    const e = EX.toEntry(html, file, {
      path: full,
      bytes: info.size,
      added: info.birthtime.toISOString().slice(0, 10),
      modified: info.mtime.toISOString().slice(0, 10),
    });
    if (!e.rich) poor++;
    entries.push(e);
  }

  const used = new Set(entries.map(e => e.area));
  const payload = {
    generated: new Date().toISOString(),
    sourceDir: SOURCE_DIR,
    areas: EX.AREAS.filter(a => used.has(a.id)).map(a => ({ id: a.id, label: a.label }))
      .concat(used.has('otros') ? [{ id: 'otros', label: 'Otros' }] : []),
    entries,
  };

  await writeFile(
    join(ROOT, 'data', 'codex-index.js'),
    `/* Generado por scripts/index-codex.mjs — no editar a mano.\n` +
    `   La app también escanea codex/ sola; esto es sólo el índice previo. */\n` +
    `window.KHASLANA_CODEX = ${JSON.stringify(payload)};\n`,
    'utf8'
  );

  const byArea = {};
  for (const e of entries) byArea[e.areaLabel] = (byArea[e.areaLabel] || 0) + 1;
  const cases = entries.reduce((a, e) => a + e.cases, 0);

  console.log(`\n  ✦ Codex sellado — ${entries.length} temas · ${cases} casos clínicos\n`);
  for (const [k, v] of Object.entries(byArea).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(v).padStart(3)}  ${k}`);
  }
  if (poor) console.log(`\n    ⚠ ${poor} archivo(s) sin datos estructurados`);
  console.log(`\n    enlace  codex/ → ${linked}`);
  console.log(`    fuente  ${SOURCE_DIR}`);
  console.log(`    salida  ${join(ROOT, 'data', 'codex-index.js')}\n`);
}

main();
