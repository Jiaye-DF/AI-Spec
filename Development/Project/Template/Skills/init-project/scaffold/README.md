# scaffold/ — init-project skill 執行核心

`init-project` skill 內部的中央 scaffold 工具。依 `manifest.json` 把 `templates/*.tmpl` 落到 target 目錄,版本號鎖在 manifest 一處。

> **設計原則**:版本與檔案地圖只在 `manifest.json` 維護,template 內僅用 `{{var}}` 引用。本資料夾隨 skill 一起分發,target repo **不帶**任何 scaffold 殘留。

---

## 用法

skill 安裝後預設位置 `~/.claude/skills/init-project/`。直接 CLI 用法:

```bash
node ~/.claude/skills/init-project/scaffold/scaffold.mjs --name my-app --target ./my-app
```

或在 skill 開發目錄內(`Template/Skills/init-project/`):

```bash
node scaffold/scaffold.mjs --name my-app --target ./my-app
```

主要 flag:

| flag | 說明 | 預設 |
| --- | --- | --- |
| `--name <kebab>` | 專案名(必填,kebab-case) | — |
| `--frontend vite\|next` | 前端 toolchain | `vite` |
| `--no-database` | 停用 SQLAlchemy / asyncpg / Alembic / DB ping(預設含 DB) | (含 DB) |
| `--include-azure-sso` | 啟用 → 加 `backend/app/clients/azure_ad/` | off |
| `--frontend-port <n>` | dev server port | `3000` |
| `--backend-port <n>` | dev server port | `8000` |
| `--postgres-port <n>` | 本機 PG port(僅 `include_database=true` 用) | `5432` |
| `--api-version <v>` | API 路徑前綴 | `v1` |
| `--target <dir>` | 產出根目錄 | cwd |
| `--dry-run` | 只列動作不寫檔 | off |
| `--no-install` | 跳過 `uv sync` / `npm install`(同時跳過 PATH 預檢) | off |
| `--force` | 允許 target 非空 | off |

---

## 結構

```
scaffold/
├── manifest.json         版本 / 檔案地圖 / 條件分支(唯一真相)
├── scaffold.mjs          executor(zero-dep Node)
├── README.md             本檔
└── templates/
    ├── root/             專案根層(.gitignore / .env.* / README.md / ...)
    ├── backend/          backend/* 全部 .py / pyproject.toml / alembic
    ├── frontend-vite/    frontend/* (Vite branch)
    ├── frontend-next/    frontend/* (Next branch,Phase 3)
    └── .github/          GitHub Actions workflow
```

---

## Action 種類(manifest.actions[])

| type | 說明 |
| --- | --- |
| `render` | 讀 `.tmpl`,做 `{{var}}` 替換,寫到 `dst` |
| `mkdir` | 建立空目錄(`services/` 等) |

`when` 條件式(filter):
- `{ "frontend": "vite" }` — 僅當 `--frontend=vite`
- `{ "include_database": true }` — 僅當預設(或顯式 `--include-database`),即未加 `--no-database`
- `{ "include_azure_sso": true }` — 僅當有 `--include-azure-sso`

---

## Placeholder 語法

`.tmpl` 內用雙大括號:`{{project_name}}`、`{{python_version}}`、`{{react_version}}`...

完整 placeholder 清單:

- 參數類:`project_name` / `project_name_underscore` / `frontend` / `frontend_port` / `backend_port` / `postgres_port` / `api_version` / `include_database` / `include_azure_sso`
- 版本類:`manifest.versions` 樹自動展平為 `<key>_version`(例:`versions.frontend.react` → `{{react_version}}`、`versions.python` → `{{python_version}}`)
- `dst` 路徑也支援 `{{api_version}}` 之類佔位(例:`backend/app/api/{{api_version}}/health.py`)

### 條件區塊

```
{{#if include_database}}
這段只在 include_database=true 時保留
{{/if}}

{{#if !include_database}}
這段只在 include_database=false 時保留(否定式)
{{/if}}
```

bool placeholder(`include_database` / `include_azure_sso`)會以字串 `"true"` / `"false"` 注入;render 時會自動把 `"true"` 視為 truthy。

任何**未定義**的 placeholder 或 conditional 會 throw — 預期行為,避免 silent 漏置換。

---

## 修改流程

| 想做 | 改哪 |
| --- | --- |
| 升版本(`react` 19.2.5 → 19.3.0) | 只改 `manifest.json` `versions.frontend.react`(scaffold 自動展平為 `react_version` placeholder) |
| 新增模板檔(例:`backend/app/middleware.py`) | 1. 建 `.tmpl` 2. 在 `manifest.actions[]` 加 `render` 條目 |
| 改 placeholder 名稱 | 同步改 `scaffold.mjs buildPlaceholders()` + 所有引用該 placeholder 的 `.tmpl` |
| 新增條件分支(例:include_redis) | 1. `manifest.params` 加 param 2. `actions[]` 加 `when: { include_redis: true }` 3. `scaffold.mjs` `matchesWhen()` 認該 key |

---

## 與 `../SKILL.md` 的關係

`../SKILL.md`(skill 本體入口)是 Claude Code skill 的觸發描述,僅:
- 何時觸發(scaffold / 初始化 / 新專案)
- 收什麼參數(`AskUserQuestion` 對齊本檔 flag)
- 收完後執行 `node scaffold/scaffold.mjs ...`

**不**內嵌任何模板內容。所有 LLM-deterministic 的部分由本工具負責;LLM 僅負責收參與校驗。

---

## 測試

```bash
# Dry run(不寫檔,僅列動作)
node scaffold/scaffold.mjs --name test-app --dry-run --target /tmp/test

# 實際產出
node scaffold/scaffold.mjs --name test-app --target /tmp/test
```

驗收(對齊 `../SKILL.md § Acceptance`):
1. `cd backend && uv sync --frozen` exit 0
2. `cd backend && uv run uvicorn app.main:app` 起得來,`/api/docs` 出 Swagger
3. `cd frontend && npm run dev` 起得來,`/` 出首頁
4. `curl localhost:<backend-port>/api/v1/health` 回 `{db: "ok"}`
