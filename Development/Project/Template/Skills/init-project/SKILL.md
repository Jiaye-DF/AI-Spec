---
name: init-project
description: 一鍵套用 Template + 產生 React + TypeScript + FastAPI(可選 PostgreSQL)最小可跑骨架。若 cwd 含 Template/,先 cp 規範檔(CLAUDE.md / AGENTS.md / docs/Design-Base / prompts→docs/Prompts)並刪除 Template/,再跑 scaffold.mjs。當使用者說「初始化專案 / scaffold / 建專案 / new project / 開新專案」時觸發。版本鎖定 / 檔案地圖由 scaffold/manifest.json 決定。
---

# init-project

從「Template 在專案目錄裡」一路自動跑到「backend/ + frontend/ 可跑」的單入口 skill。LLM 負責:Template/ 自動展開 → 環境檢查 → 收參 + 校驗 → 呼叫 `scaffold.mjs` → 跑 acceptance。**不**自由發揮、**不**內嵌任何模板內容。

## 設計目的(使用者 3+1 動作)

| # | 誰做 | 動作 |
| --- | --- | --- |
| 1 | 使用者 | 下載 Template 資料夾 |
| 2 | 使用者 | 把 Template/ 整個 cp 進專案目錄(`<project>/Template/`) |
| 3 | 使用者 | 把 `Template/skills/init-project/` cp 到 `.claude/skills/init-project/`(專案 local 或 `~/.claude/skills/` 全域皆可) |
| 4 | 使用者 | 在專案根目錄跑 `/init-project` |
| 4a | 本 skill | 偵測 `Template/` → 規範檔自動 cp 到專案根 → **刪除 `Template/`** → 環境檢查 → scaffold backend + frontend |

## 心法

1. **不自由發揮**:落檔交給 `scaffold/scaffold.mjs`,LLM 不得自己寫 src/.tmpl 內容
2. **版本一律鎖到 patch**:版本只在 `scaffold/manifest.json` 一處,LLM 不得自行指定
3. **本地開發優先**:後端 `uvicorn` + 前端 dev server;若 `include_database=true`,PostgreSQL 由開發者本機 install
4. **輸出語言**:繁體中文(回應 / 註解 / 文件 / commit message)
5. **範圍邊界**:本 skill 含「規範檔展開」與「程式碼骨架產出」兩段 — 但**僅限 cp Template/ 已存在的內容**,LLM 不得自寫 docs/Design-Base / CLAUDE.md / AGENTS.md 任何字句
6. **不可逆動作要明示**:刪除 `Template/` 前必須再次徵詢確認

## 執行步驟

### 0. Template/ 自動套用(若 cwd 有 `Template/` 子目錄)

> 設計目的:讓使用者只要做 3 個手動動作(下載 Template / cp 到專案 / cp `skills/init-project` 到 `.claude/skills/`),其餘**全部由本 skill 接手**。

#### 0a. 偵測

檢查 `<cwd>/Template/` 是否存在。

- **不存在** → 略過本節,進 § 1(假設規範檔已就位 / 使用者已自行套過模板)
- **存在** → 進 0b

#### 0b. 同意確認(AskUserQuestion)

向使用者一次性確認下列動作會執行:

1. cp `Template/CLAUDE.md` → `<cwd>/CLAUDE.md`
2. cp `Template/AGENTS.md` → `<cwd>/AGENTS.md`
3. cp -r `Template/docs/Design-Base/` → `<cwd>/docs/Design-Base/`
4. cp -r `Template/prompts/` → `<cwd>/docs/Prompts/`(注意:目錄改名 `prompts` → `Prompts`)
5. 為 `<cwd>/docs/Prompts/*.md`(略過 `README.md`)產 `<cwd>/.claude/commands/<name>.md`,內容單行 `@docs/Prompts/<name>.md`
6. **刪除整個 `<cwd>/Template/`**(✱ 不可逆)

> 不 cp 的東西:`Template/skills/`(使用者已手動裝過)、`Template/plan/`(模板自身演進史)、`Template/README.md`(模板索引,不是專案 README)。

#### 0c. 衝突處理

若 `<cwd>/CLAUDE.md` / `AGENTS.md` / `docs/Design-Base/` / `docs/Prompts/` **任一已存在**:

- **禁**直接覆寫
- 列出衝突清單,用 `AskUserQuestion` 詢問:
  - 全部覆寫(用 Template 版蓋掉客製版)
  - 略過已存在的(只 cp 不衝突的;其他保留現狀)
  - 中止(使用者要先自行處理)

#### 0d. 執行

依使用者選擇執行步驟 1–5;最後一步「刪除 `Template/`」**獨立再確認一次**(因不可逆),確認後才刪。刪除前先確認 cwd 不在 `Template/` 子樹內(否則 PowerShell 會拒絕)。

刪除策略:
- Windows / PowerShell:`Remove-Item -Recurse -Force ./Template`
- POSIX:`rm -rf ./Template`

#### 0e. 完成 → 進 § 1

回報「Template/ 已展開並移除,規範檔已就位」,接著進環境檢查。

---

### 1. 環境檢查

#### 1a. 工具檢查(node / uv / npm)

依序檢:`node --version` / `uv --version` / `npm --version`(`exit 0` 視為已裝)。`node` 必裝(scaffold.mjs 是 node script);`uv` / `npm` 在 `--no-install` 模式可跳過。

**全部已裝** → 進 1b。

**有缺** → 列出缺的工具 + 依平台給安裝指令,**用 `AskUserQuestion`** 詢問處理方式:

| 平台 | node / npm | uv |
| --- | --- | --- |
| Windows | `winget install OpenJS.NodeJS` | `winget install astral-sh.uv` |
| macOS | `brew install node` | `brew install uv` |
| Linux(Debian/Ubuntu) | `sudo apt install nodejs npm`(版本可能舊;Phase 1 不強制 nvm) | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |

選項:
- **代為安裝**:LLM 跑上述指令(每個工具裝完後再 `--version` 驗;失敗則停下來給使用者看 stderr)
- **使用者自裝**:中止 skill,等使用者自己裝完重跑 `/init-project`
- **跳過(`--no-install`)**:僅當使用者明確只要落檔、不要 `uv sync` / `npm install`

> **禁**:不問就跑 install、改 PATH、開 admin 權限、安裝非上表所列的替代工具(nvm / fnm / pyenv / pip 等)。

#### 1b. target 目錄狀態

target 目錄允許三種狀態:
1. **空**(或僅含 `.git/`)→ 直接落檔
2. **僅含 Template 規範檔**(`CLAUDE.md` / `AGENTS.md` / `docs/Design-Base/` / `docs/Prompts/` / `.claude/commands/`)→ 這是「先 cp Template 規範,再跑 /init-project」的合法 pre-state,**加 `--force`** 後落檔(scaffold 不會動到這些規範檔)
3. **既有專案 / 其他內容** → 詢問使用者是否確認加 `--force`(可能覆寫客製檔)

> scaffold 會在 target 根層**寫入或覆寫**下列檔案,使用者若已客製須自行合併:
> - `.gitignore` / `.gitleaks.toml` / `README.md`
> - `.env.development.example` / `.env.staging.example` / `.env.production.example`
> - `.github/workflows/ci.yml` / `.github/workflows/e2e.yml`
> - `backend/**` / `frontend/**`(整個子樹)

### 2. 收集參數(用 `AskUserQuestion`)

對應 `scaffold/manifest.json § params`:

| 參數 | 預設 | 說明 |
| --- | --- | --- |
| `project_name` | (必填) | kebab-case;校驗 `/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/` |
| `frontend` | `vite` | `vite` 或 `next`(Phase 3 才支援 next) |
| `include_database` | `true` | true 時加 SQLAlchemy + asyncpg + Alembic + DB ping;false 則純 FastAPI |
| `include_azure_sso` | `false` | true 時加 `backend/app/clients/azure_ad/` |
| `frontend_port` | `3000` | dev server port |
| `backend_port` | `8000` | dev server port |
| `postgres_port` | `5432` | 本機 PostgreSQL port(僅 `include_database=true` 用) |
| `api_version` | `v1` | API 路徑前綴 |
| `target` | cwd | 產出根目錄 |

> `include_database` 必須**主動詢問**使用者(不可預設替使用者決定),其他參數可用預設值

### 3. 呼叫 scaffold.mjs

skill 安裝後路徑通常為 `~/.claude/skills/init-project/`。從該位置呼叫:

```bash
node <skill-root>/scaffold/scaffold.mjs \
  --name <project_name> \
  --frontend <vite|next> \
  [--no-database] \
  [--include-azure-sso] \
  --frontend-port <n> --backend-port <n> --postgres-port <n> \
  --api-version <v> \
  --target <當前目錄或使用者指定>
```

`include_database` 預設 on;使用者選不要 DB 時加 `--no-database`。

**先 `--dry-run` 預覽**;確認無誤後再實際執行。

### 4. 顯示 next steps

scaffold.mjs 結束後會自動印出。LLM 不需重述。

### 5. (可選)git commit

詢問使用者後執行(commit message 依本次有沒有走 § 0 而異):

- 含 § 0(套過 Template):`(AI) Add: 套用 Template 規範 + 初始化 React + FastAPI 專案骨架`
- 不含 § 0:`(AI) Add: 初始化 React + FastAPI 專案骨架`

```bash
git add -A && git commit -m "<上述 message>"
```

## Acceptance(必跑,任一失敗不報告完成)

1. `node <skill>/scaffold/scaffold.mjs --name ... --dry-run` exit 0(scaffold 邏輯本身合法)
2. 實際產出後 `cd backend && uv sync --frozen` exit 0
3. `cd backend && uv run ruff check .` exit 0
4. `cd backend && uv run mypy . --strict` exit 0
5. `cd frontend && npm ci && npm run typecheck && npm run lint` exit 0
6. 啟 backend 後驗 `/api/{api_version}/health`:
   - `include_database=true` → `curl -s localhost:<backend_port>/api/v1/health | jq -e '.data.db == "ok"'` exit 0
   - `include_database=false` → `curl -s localhost:<backend_port>/api/v1/health | jq -e '.data.status == "ok"'` exit 0
7. `git status` untracked 為新建檔;**禁** dirty 既有檔

## 自我約束

- **禁止**自行寫程式碼骨架檔 — 落檔全交給 `scaffold/scaffold.mjs`
- **禁止**自行**撰寫**規範檔內容(CLAUDE.md / AGENTS.md / docs/Design-Base / docs/Prompts)— § 0 只 cp 既有 `Template/` 內檔案,不可生成新文字
- **禁止**自行指定版本號 — 一律由 `scaffold/manifest.json` 決定
- **禁止**直接執行 `git push`;`git commit` 須使用者明示同意
- **禁止**寫入 `.env` 實際值(只生 `.env.*.example`)
- **禁止**刪除 `Template/` 之外的任何使用者既有目錄
- **禁止**在使用者拒絕 § 0 的 cp 動作後仍執行 § 1 之後的 scaffold(整個流程中止,不部分執行)
- 產出後簡述「本次套了什麼規範 / 骨架包含什麼 / 不包含什麼 / 下一步是什麼」,引用 `scaffold.mjs` 的 next-steps 輸出即可

## 與 scaffold.mjs 的職責切割

| 職責 | 由誰處理 |
| --- | --- |
| Template/ 偵測 + 規範檔 cp + 自我刪除(§ 0) | LLM(本 SKILL.md) |
| 工具偵測 + 缺套件 install 詢問(§ 1a) | LLM |
| 收 user 參數(含 include_database 詢問) | LLM |
| kebab-case 校驗 | scaffold.mjs(LLM 也可預檢) |
| 模板替換 + 條件區塊 + 落檔 | scaffold.mjs |
| 版本鎖定 | `scaffold/manifest.json` |
| `uv lock` / `npm install` | scaffold.mjs(`--no-install` 可跳過) |
| acceptance 驗收 | LLM(跑 acceptance 命令) |
| git commit | LLM(經使用者同意) |

> 修改 scaffold 行為 → 改 `scaffold/manifest.json` / `scaffold/scaffold.mjs` / `scaffold/templates/*.tmpl`;**不**改 SKILL.md(本檔只描述 LLM 行為)。
