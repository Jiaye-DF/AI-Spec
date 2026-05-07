---
name: init-project
type: workflow
description: 在空目錄產生 React + TypeScript + FastAPI + PostgreSQL 骨架。當 user 說「初始化 / scaffold / 建專案 / new project」時觸發。本 skill 為薄殼,實際落檔由 `Template/scaffold/scaffold.mjs` 執行。
when_not_to_use:
  - 目錄已含 src/ 或 backend/(改用 /scan-project 評估)
  - 非 React + FastAPI + PostgreSQL 棧 → 用其他 template
inputs:
  - name: project_name
    type: kebab-case string
    required: true
  - name: frontend
    type: enum(vite | next)
    default: vite
  - name: include_azure_sso
    type: boolean
    default: false
  - name: frontend_port
    default: 3000
  - name: backend_port
    default: 8000
  - name: postgres_port
    default: 5432
  - name: api_version
    default: v1
capabilities_required:
  - shell_exec(必)— 呼叫 `node scaffold.mjs`
  - file_write(必)— 由 scaffold.mjs 處理
---

# /init-project

依 Template 規範產生 **React + FastAPI 前後端分離** 專案最小可跑骨架。版本鎖定 / 檔案地圖 / 條件分支由 [`Template/scaffold/manifest.json`](../scaffold/manifest.json) 決定;LLM **不**內嵌任何模板內容。

> **本模板採本地開發**:後端 `uvicorn` + 前端 dev server,PostgreSQL 由開發者本機 install。**不產出任何容器化 / 部署檔**。

---

## 心法

1. **不自由發揮**:落檔交給 `scaffold.mjs`,LLM 只負責**收參 + 校驗 + 呼叫**
2. **版本一律鎖到 patch**:版本在 `manifest.json` 一處,LLM 不得自行指定
3. **本地優先**:禁止產出容器化 / 部署相關檔
4. git commit 須繁中 + `(AI)` 前綴(若使用者同意提交)

---

## 執行步驟

### 1. 環境檢查

- 當前目錄為空(或僅含 `.git/`);非空時詢問是否 `--force`
- 系統 PATH 有 `node`(scaffold.mjs 必需)
- 系統 PATH 有 `uv` / `npm`(`--no-install` 模式可跳過)

### 2. 收集參數(用 `AskUserQuestion`)

對應 `manifest.json § params`:

| 參數 | 預設 | 說明 |
| --- | --- | --- |
| `project_name` | (必填) | kebab-case;校驗 `/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/` |
| `frontend` | `vite` | `vite` 或 `next`(Phase 3 才支援 next) |
| `include_azure_sso` | `false` | true 時加 `backend/app/clients/azure_ad/` |
| `frontend_port` | `3000` | dev server port |
| `backend_port` | `8000` | dev server port |
| `postgres_port` | `5432` | 本機 PostgreSQL port |
| `api_version` | `v1` | API 路徑前綴 |

### 3. 呼叫 scaffold.mjs

```bash
node <Template-path>/scaffold/scaffold.mjs \
  --name <project_name> \
  --frontend <vite|next> \
  [--include-azure-sso] \
  --frontend-port <n> --backend-port <n> --postgres-port <n> \
  --api-version <v> \
  --target <當前目錄或使用者指定>
```

**先 `--dry-run` 預覽**;確認無誤後再實際執行。

### 4. 顯示 next steps

scaffold.mjs 結束後會自動印出:本機 PG / `.env` 複製 / `alembic upgrade` / `uvicorn` / `npm run dev` / `/api/docs`。LLM 不需重述。

### 5. (可選)git commit

詢問使用者後執行:

```bash
git add -A && git commit -m "(AI) Add: 初始化 React + FastAPI 專案骨架"
```

---

## Acceptance(必跑,任一失敗不報告完成)

1. `node Template/scaffold/scaffold.mjs --name ... --dry-run` exit 0(scaffold 邏輯本身合法)
2. 實際產出後 `cd backend && uv sync --frozen` exit 0
3. `cd backend && uv run ruff check .` exit 0
4. `cd backend && uv run mypy . --strict` exit 0
5. `cd frontend && npm ci && npm run typecheck && npm run lint` exit 0
6. 啟 backend 後 `curl -s localhost:<backend_port>/api/v1/health | jq -e '.data.db == "ok"'` exit 0
7. `git status` untracked 為新建檔;**禁** dirty 既有檔

---

## 自我約束

- **禁止**自行寫檔 — 全交給 `scaffold.mjs`
- **禁止**自行指定版本號 — 一律由 `manifest.json` 決定
- **禁止**直接執行 `git push`;`git commit` 須使用者明示同意
- **禁止**寫入 `.env` 實際值(只生 `.env.*.example`)
- 產出後簡述「本骨架包含什麼 / 不包含什麼 / 下一步是什麼」,引用 `scaffold.mjs` 的 next-steps 輸出即可

---

## 與 scaffold.mjs 的關係

| 職責 | 由誰處理 |
| --- | --- |
| 收 user 參數 | LLM(本 prompt) |
| kebab-case 校驗 | scaffold.mjs(LLM 也可預檢) |
| 模板替換 + 落檔 | scaffold.mjs |
| 版本鎖定 | `manifest.json` |
| `uv lock` / `npm install` | scaffold.mjs(`--no-install` 可跳過) |
| acceptance 驗收 | LLM(跑 acceptance 命令) |
| git commit | LLM(經使用者同意) |

> 修改 scaffold 行為 → 改 `manifest.json` / `scaffold.mjs` / `templates/*.tmpl`;**不**改本檔(本檔只描述 LLM 行為)。
