#!/usr/bin/env node
// scaffold.mjs — Template scaffold executor (Node, zero-dep)
//
// 用法:
//   node scaffold.mjs --name <kebab-case> [options]
//
// options:
//   --frontend vite|next            (預設 vite)
//   --include-azure-sso             啟用,加上 backend/app/clients/azure_ad/
//   --frontend-port <n>             (預設 3000)
//   --backend-port <n>              (預設 8000)
//   --postgres-port <n>             (預設 5432)
//   --api-version <v>               (預設 v1)
//   --target <dir>                  (預設 cwd;產出根目錄)
//   --dry-run                       不寫檔,只列出將執行動作
//   --no-install                    跳過 uv lock / npm install
//   --force                         允許 target 非空(否則拒絕)

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCAFFOLD_ROOT = __dirname;
const TEMPLATE_ROOT = path.resolve(SCAFFOLD_ROOT, '..');

// ─── arg parsing ────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {};
  const flags = new Set(['dry-run', 'no-install', 'force', 'include-azure-sso', 'help']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    if (flags.has(key)) {
      args[key] = true;
    } else {
      args[key] = argv[++i];
    }
  }
  return args;
}

function printHelpAndExit() {
  console.log(`scaffold.mjs — React + FastAPI + PostgreSQL 骨架產生器

用法:
  node scaffold.mjs --name <kebab-case> [--frontend vite|next] [--include-azure-sso]
                    [--frontend-port 3000] [--backend-port 8000] [--postgres-port 5432]
                    [--api-version v1] [--target ./my-app] [--dry-run] [--no-install] [--force]

範例:
  node scaffold.mjs --name foo-app --frontend vite --target ./foo-app
  node scaffold.mjs --name bar --include-azure-sso --dry-run
`);
  process.exit(0);
}

// ─── validation ─────────────────────────────────────────────────

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
function validateProjectName(name) {
  if (!name) throw new Error('--name 必填');
  if (!KEBAB.test(name)) throw new Error(`--name 必須為 kebab-case(小寫 + 連字號):${name}`);
}

// ─── manifest + placeholders ────────────────────────────────────

function loadManifest() {
  const raw = fs.readFileSync(path.join(SCAFFOLD_ROOT, 'manifest.json'), 'utf8');
  return JSON.parse(raw);
}

function buildPlaceholders(manifest, args) {
  const v = manifest.versions;
  const fe = v.frontend;
  const be = v.backend;
  return {
    project_name: args.name,
    project_name_underscore: args.name.replace(/-/g, '_'),
    frontend: args.frontend ?? 'vite',
    frontend_port: args['frontend-port'] ?? '3000',
    backend_port: args['backend-port'] ?? '8000',
    postgres_port: args['postgres-port'] ?? '5432',
    api_version: args['api-version'] ?? 'v1',
    include_azure_sso: args['include-azure-sso'] ? 'true' : 'false',

    python_version: v.python,
    node_version: v.node,
    postgres_version: v.postgres,

    react_version: fe.react,
    react_dom_version: fe.react_dom,
    redux_toolkit_version: fe.redux_toolkit,
    react_redux_version: fe.react_redux,
    typescript_version: fe.typescript,
    vite_version: fe.vite,
    vite_plugin_react_version: fe.vite_plugin_react,
    tailwindcss_version: fe.tailwindcss,
    tailwindcss_postcss_version: fe.tailwindcss_postcss,
    postcss_version: fe.postcss,
    eslint_version: fe.eslint,

    fastapi_version: be.fastapi,
    uvicorn_version: be.uvicorn,
    sqlalchemy_version: be.sqlalchemy,
    asyncpg_version: be.asyncpg,
    pydantic_version: be.pydantic,
    pydantic_settings_version: be.pydantic_settings,
    alembic_version: be.alembic,
    httpx_version: be.httpx,
    passlib_bcrypt_version: be.passlib_bcrypt,
    pyjwt_crypto_version: be.pyjwt_crypto,
    python_multipart_version: be.python_multipart,
  };
}

function render(text, vars) {
  return text.replace(/\{\{(\w+)\}\}/g, (m, key) => {
    if (!(key in vars)) throw new Error(`未定義的 placeholder:{{${key}}}`);
    return String(vars[key]);
  });
}

// ─── action filtering ───────────────────────────────────────────

function matchesWhen(action, ctx) {
  if (!action.when) return true;
  for (const [k, v] of Object.entries(action.when)) {
    if (k === 'include_azure_sso') {
      if (Boolean(ctx['include-azure-sso']) !== Boolean(v)) return false;
    } else if (k === 'frontend') {
      if ((ctx.frontend ?? 'vite') !== v) return false;
    } else {
      if (ctx[k] !== v) return false;
    }
  }
  return true;
}

// ─── filesystem ops ─────────────────────────────────────────────

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function isEmpty(dir) {
  try {
    const entries = await fsp.readdir(dir);
    return entries.filter((e) => e !== '.git').length === 0;
  } catch {
    return true; // not exists = empty
  }
}

async function copyDirRecursive(src, dst) {
  await ensureDir(dst);
  const entries = await fsp.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) await copyDirRecursive(s, d);
    else await fsp.copyFile(s, d);
  }
}

// ─── action runners ─────────────────────────────────────────────

async function runAction(action, vars, target, dryRun) {
  const dst = action.dst ? path.join(target, action.dst) : null;

  switch (action.type) {
    case 'render': {
      const src = path.resolve(SCAFFOLD_ROOT, action.src);
      if (dryRun) return console.log(`  [dry] render  ${action.src} → ${action.dst}`);
      const raw = await fsp.readFile(src, 'utf8');
      const out = render(raw, vars);
      await ensureDir(path.dirname(dst));
      await fsp.writeFile(dst, out, 'utf8');
      console.log(`  render  ${action.dst}`);
      break;
    }
    case 'copy': {
      const src = path.resolve(SCAFFOLD_ROOT, action.src);
      if (dryRun) return console.log(`  [dry] copy    ${action.src} → ${action.dst}`);
      await ensureDir(path.dirname(dst));
      await fsp.copyFile(src, dst);
      console.log(`  copy    ${action.dst}`);
      break;
    }
    case 'copy_dir': {
      const src = path.resolve(SCAFFOLD_ROOT, action.src);
      if (dryRun) return console.log(`  [dry] copydir ${action.src} → ${action.dst}/`);
      await copyDirRecursive(src, dst);
      console.log(`  copydir ${action.dst}/`);
      break;
    }
    case 'mkdir': {
      if (dryRun) return console.log(`  [dry] mkdir   ${action.dst}/`);
      await ensureDir(dst);
      console.log(`  mkdir   ${action.dst}/`);
      break;
    }
    default:
      throw new Error(`未知 action type:${action.type}`);
  }
}

// ─── post actions (shell) ───────────────────────────────────────

function runShell(cmd, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, { cwd, shell: true, stdio: 'inherit' });
    proc.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`))));
    proc.on('error', reject);
  });
}

// ─── main ───────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) printHelpAndExit();

  validateProjectName(args.name);
  const target = path.resolve(args.target ?? process.cwd());
  const dryRun = Boolean(args['dry-run']);
  const noInstall = Boolean(args['no-install']);
  const force = Boolean(args.force);

  const manifest = loadManifest();
  const vars = buildPlaceholders(manifest, args);

  if (!dryRun) {
    await ensureDir(target);
    if (!force && !(await isEmpty(target))) {
      throw new Error(`目標非空且未加 --force:${target}`);
    }
  }

  console.log(`\n→ target:           ${target}`);
  console.log(`  project_name:     ${vars.project_name}`);
  console.log(`  frontend:         ${vars.frontend}`);
  console.log(`  include_azure_sso:${vars.include_azure_sso}`);
  console.log(`  python:           ${vars.python_version}`);
  console.log(`  node:             ${vars.node_version}`);
  console.log(`  postgres:         ${vars.postgres_version}`);
  console.log(`  dry_run:          ${dryRun}`);
  console.log(`  no_install:       ${noInstall}\n`);

  const ctx = {
    frontend: vars.frontend,
    'include-azure-sso': args['include-azure-sso'],
  };

  for (const action of manifest.actions) {
    if (action.$section || action.$todo) continue;
    if (!matchesWhen(action, ctx)) continue;
    await runAction(action, vars, target, dryRun);
  }

  if (!dryRun && !noInstall) {
    for (const post of manifest.post_actions) {
      if (post.skip_when_no_install && noInstall) continue;
      console.log(`\n→ ${post.label}`);
      await runShell(post.cmd, path.join(target, post.cwd));
    }
  }

  console.log(`\n✓ scaffold 完成。下一步:`);
  console.log(`  1. 確認本機 PostgreSQL 在 :${vars.postgres_port}`);
  console.log(`  2. cp .env.development.example .env  # 編輯填入 DB 連線`);
  console.log(`  3. cd backend && uv run alembic upgrade head && uv run uvicorn app.main:app --reload`);
  console.log(`  4. cd frontend && npm run dev`);
  console.log(`  5. open http://localhost:${vars.backend_port}/api/docs`);
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}`);
  process.exit(1);
});
