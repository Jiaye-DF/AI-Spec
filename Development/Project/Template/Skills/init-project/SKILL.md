---
name: init-project
description: 在空目錄產生 React + TypeScript + FastAPI + PostgreSQL 骨架(本地開發優先,不含容器化 / 部署檔)。當使用者說「初始化專案 / scaffold / 建專案 / new project / 開新專案」時觸發。版本鎖定 / 檔案地圖由 scaffold/manifest.json 決定,落檔由 scaffold/scaffold.mjs 執行。
---

# init-project

依本 skill 內附的 Template 規範,產生 **React + FastAPI 前後端分離**最小可跑骨架。LLM 只負責「收參 + 校驗 + 呼叫 scaffold.mjs + 跑 acceptance」,**不**自由發揮、**不**內嵌任何模板內容。

## 心法

1. **不自由發揮**:落檔交給 `scaffold/scaffold.mjs`,LLM 不得自己寫 src/.tmpl 內容
2. **版本一律鎖到 patch**:版本只在 `scaffold/manifest.json` 一處,LLM 不得自行指定
3. **本地開發優先**:後端 `uvicorn` + 前端 dev server,PostgreSQL 由開發者本機 install;**禁**產出容器化 / 部署檔
4. **輸出語言**:繁體中文(回應 / 註解 / 文件 / commit message)
5. git commit 須繁中 + `(AI)` 前綴(僅在使用者明示同意提交時執行)

## 前置讀取

skill 內已自包含完整 Template 規範,以下檔案在收參前可選擇性瀏覽:

- `CLAUDE.md` — 全局規則(技術棧、核心原則、git 流程)
- `AGENTS.md` — agent capabilities baseline
- `docs/Design-Base/00-overview/01-versions.md` — 版本鎖定原則
- `docs/Design-Base/00-overview/03-env-layers.md` — 環境分層
- `scaffold/README.md` — scaffold 工具技術細節

不需要全讀;按使用者問的範圍 just-in-time 讀取。

## 執行步驟

### 1. 環境檢查

- target 目錄為空(或僅含 `.git/`);非空時詢問是否加 `--force`
- 系統 PATH 有 `node`(scaffold.mjs 必需)
- 系統 PATH 有 `uv` 與 `npm`(`--no-install` 模式可跳過)

### 2. 收集參數(用 `AskUserQuestion`)

對應 `scaffold/manifest.json § params`:

| 參數 | 預設 | 說明 |
| --- | --- | --- |
| `project_name` | (必填) | kebab-case;校驗 `/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/` |
| `frontend` | `vite` | `vite` 或 `next`(Phase 3 才支援 next) |
| `include_azure_sso` | `false` | true 時加 `backend/app/clients/azure_ad/` |
| `frontend_port` | `3000` | dev server port |
| `backend_port` | `8000` | dev server port |
| `postgres_port` | `5432` | 本機 PostgreSQL port |
| `api_version` | `v1` | API 路徑前綴 |
| `target` | cwd | 產出根目錄 |

### 3. 呼叫 scaffold.mjs

skill 安裝後路徑通常為 `~/.claude/skills/init-project/`。從該位置呼叫:

```bash
node <skill-root>/scaffold/scaffold.mjs \
  --name <project_name> \
  --frontend <vite|next> \
  [--include-azure-sso] \
  --frontend-port <n> --backend-port <n> --postgres-port <n> \
  --api-version <v> \
  --target <當前目錄或使用者指定>
```

**先 `--dry-run` 預覽**;確認無誤後再實際執行。

### 4. 顯示 next steps

scaffold.mjs 結束後會自動印出:本機 PG 確認 / `.env` 複製 / `alembic upgrade` / `uvicorn` / `npm run dev` / `/api/docs`。LLM 不需重述。

### 5. (可選)git commit

詢問使用者後執行:

```bash
git add -A && git commit -m "(AI) Add: 初始化 React + FastAPI 專案骨架"
```

## Acceptance(必跑,任一失敗不報告完成)

1. `node <skill>/scaffold/scaffold.mjs --name ... --dry-run` exit 0(scaffold 邏輯本身合法)
2. 實際產出後 `cd backend && uv sync --frozen` exit 0
3. `cd backend && uv run ruff check .` exit 0
4. `cd backend && uv run mypy . --strict` exit 0
5. `cd frontend && npm ci && npm run typecheck && npm run lint` exit 0
6. 啟 backend 後 `curl -s localhost:<backend_port>/api/v1/health | jq -e '.data.db == "ok"'` exit 0
7. `git status` untracked 為新建檔;**禁** dirty 既有檔

## 自我約束

- **禁止**自行寫檔 — 全交給 `scaffold/scaffold.mjs`
- **禁止**自行指定版本號 — 一律由 `scaffold/manifest.json` 決定
- **禁止**直接執行 `git push`;`git commit` 須使用者明示同意
- **禁止**寫入 `.env` 實際值(只生 `.env.*.example`)
- **禁止**產出 Dockerfile / docker-compose / Coolify 部署檔(本骨架本地開發專用)
- 產出後簡述「本骨架包含什麼 / 不包含什麼 / 下一步是什麼」,引用 `scaffold.mjs` 的 next-steps 輸出即可

## 與 scaffold.mjs 的職責切割

| 職責 | 由誰處理 |
| --- | --- |
| 收 user 參數 | LLM(本 SKILL.md) |
| kebab-case 校驗 | scaffold.mjs(LLM 也可預檢) |
| 模板替換 + 落檔 | scaffold.mjs |
| 版本鎖定 | `scaffold/manifest.json` |
| `uv lock` / `npm install` | scaffold.mjs(`--no-install` 可跳過) |
| acceptance 驗收 | LLM(跑 acceptance 命令) |
| git commit | LLM(經使用者同意) |

> 修改 scaffold 行為 → 改 `scaffold/manifest.json` / `scaffold/scaffold.mjs` / `scaffold/templates/*.tmpl`;**不**改 SKILL.md(本檔只描述 LLM 行為)。
