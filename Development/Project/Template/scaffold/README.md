# scaffold/ — Template scaffold executor

Template 唯一的中央 scaffold 工具。依 `manifest.json` 把 `templates/*.tmpl` 落到 target 目錄,版本號鎖在 manifest 一處。

> **設計原則**:Template 為唯一中央源(target repo 不帶 `scaffold/`)。版本與檔案地圖只在 `manifest.json` 維護,template 內僅用 `{{var}}` 引用。

---

## 用法

```bash
node Template/scaffold/scaffold.mjs --name my-app --target ./my-app
```

主要 flag:

| flag | 說明 | 預設 |
| --- | --- | --- |
| `--name <kebab>` | 專案名(必填,kebab-case) | — |
| `--frontend vite\|next` | 前端 toolchain | `vite` |
| `--include-azure-sso` | 啟用 → 加 `backend/app/clients/azure_ad/` | off |
| `--frontend-port <n>` | dev server port | `3000` |
| `--backend-port <n>` | dev server port | `8000` |
| `--postgres-port <n>` | 本機 PG port | `5432` |
| `--api-version <v>` | API 路徑前綴 | `v1` |
| `--target <dir>` | 產出根目錄 | cwd |
| `--dry-run` | 只列動作不寫檔 | off |
| `--no-install` | 跳過 `uv lock` / `npm install` | off |
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
| `copy` | Verbatim 複製單檔(用於 `CLAUDE.md` / `AGENTS.md` 等 Template 自身檔) |
| `copy_dir` | 遞迴複製整個目錄(用於 `docs/Design-Base/`) |
| `mkdir` | 建立空目錄(`repositories/` / `services/` 等) |

`when` 條件式(filter):
- `{ "frontend": "vite" }` — 僅當 `--frontend=vite`
- `{ "include_azure_sso": true }` — 僅當有 `--include-azure-sso`

---

## Placeholder 語法

`.tmpl` 內用雙大括號:`{{project_name}}`、`{{python_version}}`、`{{react_version}}`...

完整 placeholder 清單見 [scaffold.mjs `buildPlaceholders()`](./scaffold.mjs)。

任何**未定義**的 placeholder 會 throw — 預期行為,避免 silent 漏置換。

---

## 修改流程

| 想做 | 改哪 |
| --- | --- |
| 升版本(`react` 19.2.5 → 19.3.0) | 只改 `manifest.json` `versions.frontend.react` |
| 新增模板檔(例:`backend/app/middleware.py`) | 1. 建 `.tmpl` 2. 在 `manifest.actions[]` 加 `render` 條目 |
| 改 placeholder 名稱 | 同步改 `scaffold.mjs buildPlaceholders()` + 所有引用該 placeholder 的 `.tmpl` |
| 新增條件分支(例:include_redis) | 1. `manifest.params` 加 param 2. `actions[]` 加 `when: { include_redis: true }` 3. `scaffold.mjs` `matchesWhen()` 認該 key |

---

## 與 `prompts/init-project.md` 的關係

`prompts/init-project.md` 是 Claude Code slash command 入口,僅描述:
- 何時觸發(scaffold / 初始化 / 新專案)
- 收什麼參數(`AskUserQuestion` 對齊本檔 flag)
- 收完後執行 `node scaffold.mjs ...`

**不**內嵌任何模板內容。所有 LLM-deterministic 的部分由本工具負責;LLM 僅負責收參與校驗。

---

## 測試

```bash
# Dry run(不寫檔,僅列動作)
node Template/scaffold/scaffold.mjs --name test-app --dry-run --target /tmp/test

# 實際產出
node Template/scaffold/scaffold.mjs --name test-app --target /tmp/test
```

驗收(對齊 `prompts/init-project.md § Acceptance`):
1. `cd backend && uv sync --frozen` exit 0
2. `cd backend && uv run uvicorn app.main:app` 起得來,`/api/docs` 出 Swagger
3. `cd frontend && npm run dev` 起得來,`/` 出首頁
4. `curl localhost:<backend-port>/api/v1/health` 回 `{db: "ok"}`
