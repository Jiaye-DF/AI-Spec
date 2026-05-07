#!/usr/bin/env node
// scaffold.mjs — Template scaffold executor (Node, zero-dep)
//
// 用法:
//   node scaffold.mjs --name <kebab-case> [options]
//
// options:
//   --frontend vite|next            (預設 vite)
//   --include-database              啟用,加上 alembic / SQLAlchemy / asyncpg / DB ping(預設 on)
//   --no-database                   停用 DB 相關檔案與依賴
//   --include-azure-sso             啟用,加上 backend/app/clients/azure_ad/
//   --frontend-port <n>             (預設 3000)
//   --backend-port <n>              (預設 8000)
//   --postgres-port <n>             (預設 5432)
//   --api-version <v>               (預設 v1)
//   --target <dir>                  (預設 cwd;產出根目錄)
//   --dry-run                       不寫檔,只列出將執行動作
//   --no-install                    跳過 uv sync / npm install
//   --force                         允許 target 非空(否則拒絕)

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const SCAFFOLD_ROOT = path.dirname(fileURLToPath(import.meta.url));
const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const FLAGS = new Set([
  'dry-run', 'no-install', 'force',
  'include-azure-sso', 'include-database', 'no-database',
  'help',
]);

// ─── arg parsing ────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    args[key] = FLAGS.has(key) ? true : argv[++i];
  }
  return args;
}

const HELP = `scaffold.mjs — React + FastAPI + PostgreSQL 骨架產生器

用法:
  node scaffold.mjs --name <kebab-case> [--frontend vite|next] [--include-azure-sso]
                    [--frontend-port 3000] [--backend-port 8000] [--postgres-port 5432]
                    [--api-version v1] [--target ./my-app] [--dry-run] [--no-install] [--force]

範例:
  node scaffold.mjs --name foo-app --frontend vite --target ./foo-app
  node scaffold.mjs --name bar --include-azure-sso --dry-run
`;

// ─── manifest + placeholders ────────────────────────────────────

function loadManifest() {
  return JSON.parse(fs.readFileSync(path.join(SCAFFOLD_ROOT, 'manifest.json'), 'utf8'));
}

// 把 versions 樹自動展平成 `<key>_version` placeholder。
// 例:versions.frontend.react = "19.2.5" → react_version = "19.2.5"。
function flattenVersions(node, out = {}) {
  for (const [k, v] of Object.entries(node)) {
    if (v && typeof v === 'object') flattenVersions(v, out);
    else out[`${k}_version`] = String(v);
  }
  return out;
}

function buildPlaceholders(manifest, args) {
  // include_database:預設 on;`--no-database` 顯式關閉,`--include-database` 顯式開啟
  const includeDb = args['no-database'] ? false : true;
  return {
    project_name: args.name,
    project_name_underscore: args.name.replace(/-/g, '_'),
    frontend: args.frontend ?? 'vite',
    frontend_port: args['frontend-port'] ?? '3000',
    backend_port: args['backend-port'] ?? '8000',
    postgres_port: args['postgres-port'] ?? '5432',
    api_version: args['api-version'] ?? 'v1',
    include_database: includeDb ? 'true' : 'false',
    include_azure_sso: args['include-azure-sso'] ? 'true' : 'false',
    ...flattenVersions(manifest.versions),
  };
}

function render(text, vars) {
  // 條件區塊:{{#if KEY}}...{{/if}} 或 {{#if !KEY}}...{{/if}}(否定)
  text = text.replace(/\{\{#if (!?)(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, neg, key, body) => {
    if (!(key in vars)) throw new Error(`未定義的 conditional:{{#if ${neg}${key}}}`);
    const v = vars[key];
    const truthy = v === true || v === 'true';
    const matched = neg === '!' ? !truthy : truthy;
    return matched ? body : '';
  });
  // 變數替換:{{var}}
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in vars)) throw new Error(`未定義的 placeholder:{{${key}}}`);
    return String(vars[key]);
  });
}

// ─── action filtering ───────────────────────────────────────────

const BOOL_KEYS = new Set(['include_database', 'include_azure_sso']);

function matchesWhen(action, vars) {
  if (!action.when) return true;
  for (const [k, v] of Object.entries(action.when)) {
    const lhs = BOOL_KEYS.has(k) ? vars[k] === 'true' : vars[k];
    if (lhs !== v) return false;
  }
  return true;
}

// ─── filesystem helpers ─────────────────────────────────────────

async function isEmpty(dir) {
  try {
    const entries = await fsp.readdir(dir);
    return entries.filter((e) => e !== '.git').length === 0;
  } catch {
    return true;
  }
}

// ─── action runner ──────────────────────────────────────────────

async function runAction(action, vars, target, dryRun) {
  const dstRel = action.dst ? render(action.dst, vars) : null;
  const dst = dstRel ? path.join(target, dstRel) : null;
  const src = action.src ? path.resolve(SCAFFOLD_ROOT, action.src) : null;
  const tag = (label) => `  ${dryRun ? '[dry] ' : ''}${label.padEnd(7)} ${dstRel ?? ''}`;

  switch (action.type) {
    case 'render': {
      console.log(tag('render'));
      if (dryRun) return;
      const out = render(await fsp.readFile(src, 'utf8'), vars);
      await fsp.mkdir(path.dirname(dst), { recursive: true });
      await fsp.writeFile(dst, out, 'utf8');
      return;
    }
    case 'mkdir': {
      console.log(tag('mkdir'));
      if (dryRun) return;
      await fsp.mkdir(dst, { recursive: true });
      return;
    }
    default:
      throw new Error(`未知 action type:${action.type}`);
  }
}

// ─── shell + preflight ──────────────────────────────────────────

function runShell(cmd, cwd) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, { cwd, shell: true, stdio: 'inherit' });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`))));
    p.on('error', reject);
  });
}

function whichSync(cmd) {
  const probe = process.platform === 'win32' ? `where ${cmd}` : `command -v ${cmd}`;
  return spawnSync(probe, { shell: true, stdio: 'ignore' }).status === 0;
}

async function preflight(noInstall) {
  // node 已經在跑 ⇒ 必有
  const missing = [];
  if (!noInstall) {
    for (const cmd of ['uv', 'npm']) {
      if (!whichSync(cmd)) missing.push(cmd);
    }
  }
  if (missing.length) {
    throw new Error(`PATH 缺少 ${missing.join(', ')};加 --no-install 可跳過 uv/npm 檢查`);
  }
}

// ─── main ───────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP);
    return;
  }

  if (!args.name) throw new Error('--name 必填');
  if (!KEBAB.test(args.name)) throw new Error(`--name 必須為 kebab-case:${args.name}`);

  const target = path.resolve(args.target ?? process.cwd());
  const dryRun = Boolean(args['dry-run']);
  const noInstall = Boolean(args['no-install']);
  const force = Boolean(args.force);

  const manifest = loadManifest();
  const vars = buildPlaceholders(manifest, args);

  if (!dryRun) {
    await preflight(noInstall);
    await fsp.mkdir(target, { recursive: true });
    if (!force && !(await isEmpty(target))) {
      throw new Error(`目標非空且未加 --force:${target}`);
    }
  }

  console.log(`
→ target:           ${target}
  project_name:     ${vars.project_name}
  frontend:         ${vars.frontend}
  include_database: ${vars.include_database}
  include_azure_sso:${vars.include_azure_sso}
  api_version:      ${vars.api_version}
  python:           ${vars.python_version}
  node:             ${vars.node_version}
  postgres:         ${vars.postgres_version}
  dry_run:          ${dryRun}
  no_install:       ${noInstall}
`);

  for (const action of manifest.actions) {
    if (action.$section || action.$todo) continue;
    if (!matchesWhen(action, vars)) continue;
    await runAction(action, vars, target, dryRun);
  }

  if (!dryRun && !noInstall) {
    for (const post of manifest.post_actions) {
      console.log(`\n→ ${post.label}`);
      await runShell(post.cmd, path.join(target, post.cwd));
    }
  }

  const hasDb = vars.include_database === 'true';
  const dbSteps = hasDb
    ? `  1. 確認本機 PostgreSQL 在 :${vars.postgres_port}
  2. cp .env.development.example .env  # 編輯填入 DB 連線
  3. cd backend && uv run alembic upgrade head && uv run uvicorn app.main:app --reload`
    : `  1. cp .env.development.example .env  # 編輯填入機密
  2. cd backend && uv run uvicorn app.main:app --reload`;
  console.log(`
✓ scaffold 完成。下一步:
${dbSteps}
  ${hasDb ? '4' : '3'}. cd frontend && npm run dev
  ${hasDb ? '5' : '4'}. open http://localhost:${vars.backend_port}/api/docs`);
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}`);
  process.exit(1);
});
