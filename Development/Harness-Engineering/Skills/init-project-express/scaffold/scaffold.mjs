#!/usr/bin/env node
// scaffold.mjs — Harness-Engineering Express scaffold executor (Node, zero-dep)
//
// 用法:
//   node scaffold.mjs --name <kebab-case> [options]
//
// options:
//   --frontend vite|next            (預設 next)
//   --include-database              啟用,加上 Prisma + PostgreSQL(預設 on)
//   --no-database                   停用 DB 相關檔案與依賴
//   --frontend-port <n>             (預設 3000)
//   --backend-port <n>              (預設 8000)
//   --postgres-port <n>             (預設 5432)
//   --postgres-user <name>          PG 使用者(僅 include-database=true 用;預設 <project_name_underscore>)
//   --postgres-password <pw>        PG 密碼(僅 include-database=true 用;預設 changeme-development)
//   --api-version <v>               (預設 v1)
//   --use-docker-compose            產生 docker-compose.yml + Dockerfile(預設 off)
//   --target <dir>                  (預設 cwd;產出根目錄)
//   --dry-run                       不寫檔,只列出將執行動作
//   --no-install                    跳過 npm install / prisma generate
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
  'include-database', 'no-database',
  'use-docker-compose',
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

const HELP = `scaffold.mjs — Next.js + Express + TypeScript + PostgreSQL(Prisma) 骨架產生器

用法:
  node scaffold.mjs --name <kebab-case> [--frontend next|vite]
                    [--frontend-port 3000] [--backend-port 8000] [--postgres-port 5432]
                    [--postgres-user <name>] [--postgres-password <pw>]
                    [--api-version v1] [--use-docker-compose]
                    [--target ./my-app] [--dry-run] [--no-install] [--force]

範例:
  node scaffold.mjs --name foo-app --target ./foo-app
  node scaffold.mjs --name bar --no-database --dry-run
`;

// ─── manifest + placeholders ────────────────────────────────────

function loadManifest() {
  return JSON.parse(fs.readFileSync(path.join(SCAFFOLD_ROOT, 'manifest.json'), 'utf8'));
}

// 把 versions 樹自動展平成 `<key>_version` placeholder。
function flattenVersions(node, out = {}) {
  for (const [k, v] of Object.entries(node)) {
    if (v && typeof v === 'object') flattenVersions(v, out);
    else out[`${k}_version`] = String(v);
  }
  return out;
}

function buildPlaceholders(manifest, args) {
  const includeDb = args['no-database'] ? false : true;
  const projectNameUnderscore = args.name.replace(/-/g, '_');
  return {
    project_name: args.name,
    project_name_underscore: projectNameUnderscore,
    frontend: args.frontend ?? 'next',
    frontend_port: args['frontend-port'] ?? '3000',
    backend_port: args['backend-port'] ?? '8000',
    postgres_port: args['postgres-port'] ?? '5432',
    postgres_user: args['postgres-user'] ?? projectNameUnderscore,
    postgres_password: args['postgres-password'] ?? 'changeme-development',
    api_version: args['api-version'] ?? 'v1',
    include_database: includeDb ? 'true' : 'false',
    use_docker_compose: args['use-docker-compose'] ? 'true' : 'false',
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

const BOOL_KEYS = new Set(['include_database', 'use_docker_compose']);

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

const INSTALL_HINTS = {
  win32:  { npm: 'winget install OpenJS.NodeJS' },
  darwin: { npm: 'brew install node' },
  linux:  { npm: 'sudo apt install nodejs npm  # 或依發行版調整' },
};

function installHint(cmd) {
  const platform = INSTALL_HINTS[process.platform] ?? INSTALL_HINTS.linux;
  return platform[cmd] ?? `(請依平台自行安裝 ${cmd})`;
}

async function preflight(noInstall) {
  const missing = [];
  if (!noInstall) {
    if (!whichSync('npm')) missing.push('npm');
  }
  if (missing.length) {
    const hints = missing.map((c) => `    ${c}: ${installHint(c)}`).join('\n');
    throw new Error(
      `PATH 缺少 ${missing.join(', ')}\n` +
      `  安裝建議(${process.platform}):\n${hints}\n` +
      `  或加 --no-install 跳過 npm 檢查(scaffold 仍會落檔,但 npm install 由你之後手動跑)`,
    );
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

  const dbReport = vars.include_database === 'true'
    ? `\n  postgres_user:    ${vars.postgres_user}\n  postgres_password:${vars.postgres_password === 'changeme-development' ? '(預設)changeme-development' : '(使用者輸入,寫入 .env)'}`
    : '';
  console.log(`
→ target:             ${target}
  project_name:       ${vars.project_name}
  frontend:           ${vars.frontend}
  include_database:   ${vars.include_database}
  use_docker_compose: ${vars.use_docker_compose}
  api_version:        ${vars.api_version}
  node:               ${vars.node_version}
  postgres:           ${vars.postgres_version}${dbReport}
  dry_run:            ${dryRun}
  no_install:         ${noInstall}
`);

  for (const action of manifest.actions) {
    if (action.$section || action.$todo) continue;
    if (!matchesWhen(action, vars)) continue;
    await runAction(action, vars, target, dryRun);
  }

  if (!dryRun && !noInstall) {
    for (const post of manifest.post_actions) {
      if (!matchesWhen(post, vars)) continue;
      console.log(`\n→ ${post.label}`);
      await runShell(post.cmd, path.join(target, post.cwd));
    }
  }

  const hasDb = vars.include_database === 'true';
  const prepSteps = hasDb
    ? `  1. 確認本機 PostgreSQL 在 :${vars.postgres_port}
  2. cp .env.development.example .env  # 編輯填入 DB 連線
  3. cd backend && npx prisma migrate dev --name init && cd ..`
    : `  1. cp .env.development.example .env  # 編輯填入機密`;
  const launchStep = hasDb ? '4' : '2';
  const openStep   = hasDb ? '5' : '3';
  const stopStep   = hasDb ? '6' : '4';
  console.log(`
✓ scaffold 完成。下一步:
${prepSteps}
  ${launchStep}. 在 Claude Code 跑 /start-dev    # 自動 kill 占用 port 的舊 process,啟動 backend + frontend
  ${openStep}. open http://localhost:${vars.backend_port}/api/${vars.api_version}/health(後端健康檢查)
     open http://localhost:${vars.frontend_port}(前端首頁)
  ${stopStep}. 在 Claude Code 跑 /stop-dev     # 停止全部
`);
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}`);
  process.exit(1);
});
