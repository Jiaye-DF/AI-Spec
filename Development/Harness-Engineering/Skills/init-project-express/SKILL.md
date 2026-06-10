---
name: init-project-express
description: 一鍵套用 Harness-Engineering + 產生 Next.js (App Router) + TypeScript + Express 5 + TypeScript(可選 PostgreSQL Prisma / Docker Compose)最小可跑骨架。若 cwd 含 Harness-Engineering/,先 cp 規範檔(CLAUDE.md / AGENTS.md / docs/Design-Base / prompts→docs/Prompts)並刪除 Harness-Engineering/,再跑 scaffold.mjs。當使用者說「初始化 Express 專案 / scaffold express / 建 express 專案 / new express project」時觸發。版本鎖定 / 檔案地圖由 scaffold/manifest.json 決定。
---

# init-project-express

從「Harness-Engineering 在專案目錄裡」一路自動跑到「backend/ + frontend/ 可跑」的單入口 skill。**後端為 Express 5 + TypeScript,前端為 Next.js 16 App Router。** LLM 負責:Harness-Engineering/ 自動展開 → 環境檢查 → 收參 + 校驗 → 呼叫 `scaffold.mjs` → 跑 acceptance。**不**自由發揮、**不**內嵌任何模板內容。

## 設計目的(使用者 3+1 動作)

| # | 誰做 | 動作 |
| --- | --- | --- |
| 1 | 使用者 | 下載 Harness-Engineering 資料夾 |
| 2 | 使用者 | 把 Harness-Engineering/ 整個 cp 進專案目錄(`<project>/Harness-Engineering/`) |
| 3 | 使用者 | 把 `Harness-Engineering/skills/init-project-express/` cp 到 `.claude/skills/init-project-express/`(專案 local 或 `~/.claude/skills/` 全域皆可) |
| 4 | 使用者 | 在專案根目錄跑 `/init-project-express` |
| 4a | 本 skill | 偵測 `Harness-Engineering/` → 規範檔自動 cp 到專案根 → **刪除 `Harness-Engineering/`** → 環境檢查 → scaffold backend + frontend |

## 心法

1. **不自由發揮**:落檔交給 `scaffold/scaffold.mjs`,LLM 不得自己寫 src/.tmpl 內容
2. **版本一律鎖到 patch**:版本只在 `scaffold/manifest.json` 一處,LLM 不得自行指定
3. **本地開發優先**:後端 `ts-node-dev` + 前端 dev server;若 `include_database=true`,PostgreSQL 由開發者本機 install 或以 Docker Container 跑(依 § 1c 使用者選擇)
4. **輸出語言**:繁體中文(回應 / 註解 / 文件 / commit message)
5. **範圍邊界**:本 skill 含「規範檔展開」與「程式碼骨架產出」兩段 — 但**僅限 cp Harness-Engineering/ 已存在的內容**,LLM 不得自寫 docs/Design-Base / CLAUDE.md / AGENTS.md 任何字句
6. **不可逆動作要明示**:刪除 `Harness-Engineering/` 前必須再次徵詢確認
7. **AskUserQuestion 必有「推薦」選項**:每次呼叫 `AskUserQuestion`,**選項列表必須有一項標 `(Recommended)`** 放第一位。

## 執行步驟

### 0. Harness-Engineering/ 自動套用(若 cwd 有 `Harness-Engineering/` 子目錄)

與 init-project SKILL.md § 0 完全相同。偵測 → 同意確認 → 衝突處理 → 執行 → 完成後進 § 1。

---

### 1. 環境檢查

#### 1a. 工具檢查(node / npm)— 嚴格三層

讀 `scaffold/manifest.json § versions` 取得目標版本(node),依下表檢:

| 檢查項 | Layer 1:存在 | Layer 2:版本 | Layer 3:實際可用 |
| --- | --- | --- | --- |
| **node** | `node --version` exit 0 | 解析輸出,major == manifest `node_version` major | `node -e "console.log(1)"` 輸出 `1` |
| **npm** | `npm --version` exit 0 | major >= 10 | (略) |

> **Express 版不需要 uv / Python** — 後端同樣以 Node.js 執行。

**輸出格式**:

```
→ 工具檢查
  [✓] node       v24.0.0       要求 v24       OK
  [✓] npm        10.x.x        要求 >= 10     OK
```

#### 1a-1. 通過(全部 ✓)→ 進 § 1b

#### 1a-2. 有任一項 ✗ / ⚠ → 用 `AskUserQuestion` 詢問

選項:
- **代為處理 (Recommended)** — LLM 跑 install 指令,完成後重驗
- **使用者自裝** — 列出修復指令,中止 skill
- **跳過(`--no-install`)** — 只落檔,npm install 由使用者之後跑

#### 1b. target 目錄狀態

同 init-project SKILL.md § 1b。

#### 1c. Docker / Docker Compose 偵測

同 init-project SKILL.md § 1c,但 Recommended 描述改為:

- **localhost 模式 (Recommended)** — 後端 ts-node-dev + 前端 dev server;PostgreSQL 本機 install;最快 onboard;`use_docker_compose=false`
- **Docker Compose 模式** — scaffold 額外產 `docker-compose.yml` + Dockerfile;PostgreSQL 以 container 跑;`use_docker_compose=true`

---

### 2. 收集參數

#### 2a. 一般參數(用 `AskUserQuestion`)

| 參數 | 預設 | 說明 |
| --- | --- | --- |
| `project_name` | (必填) | kebab-case |
| `frontend` | `next` | `next`(App Router,推薦) 或 `vite` |
| `include_database` | `true` | true 時加 Prisma + PostgreSQL;false 則純 Express |
| `use_docker_compose` | 由 § 1c 決定 | |
| `frontend_port` | `3000` | dev server port |
| `backend_port` | `8000` | dev server port |
| `postgres_port` | `5432` | 本機 PostgreSQL port(僅 `include_database=true` 用) |
| `api_version` | `v1` | API 路徑前綴 |
| `target` | cwd | 產出根目錄 |

> `include_database` 必須**主動詢問**使用者

#### 2b. PostgreSQL 連線(僅 `include_database=true` 進此節)

向使用者收 PG 帳密,寫到 `<target>/.env`(已 `.gitignore`)。

`DATABASE_URL` 格式(Prisma):
```
DATABASE_URL=postgresql://<user>:<password>@localhost:<postgres_port>/<project_name_underscore>
```

> **注意**:Express + Prisma 使用標準 `postgresql://`,**不**需要 `+asyncpg` 或其他 driver 前綴。

**詢問方式同 init-project § 2b**,三個選項:
- **完整輸入 (Recommended)** / **用預設值** / **暫時跳過(SKIP)**

#### 2c. 把參數帶給 scaffold.mjs

```bash
node <skill-root>/scaffold/scaffold.mjs \
  --name <project_name> \
  --frontend <next|vite> \
  [--no-database] \
  [--use-docker-compose] \
  --frontend-port <n> --backend-port <n> --postgres-port <n> \
  [--postgres-user <name>] [--postgres-password <pw>] \
  --api-version <v> \
  --target <當前目錄或使用者指定>
```

**先 `--dry-run` 預覽**;確認無誤後再實際執行。

### 3. 顯示 next steps

scaffold.mjs 結束後會自動印出。LLM 不需重述。

### 4. (可選)git commit

與 init-project SKILL.md § 4 相同。commit message:
- 含 § 0:`(AI) Add: 套用 Harness-Engineering 規範 + 初始化 Next.js + Express 專案骨架`
- 不含 § 0:`(AI) Add: 初始化 Next.js + Express 專案骨架`

## Acceptance(必跑,任一失敗不報告完成)

1. `node <skill>/scaffold/scaffold.mjs --name ... --dry-run` exit 0
2. 實際產出後 `cd backend && npm ci` exit 0
3. `cd backend && npm run lint` exit 0
4. `cd backend && npm run typecheck` exit 0
5. `cd frontend && npm ci && npm run typecheck && npm run lint` exit 0
6. 啟 backend 後驗 `/api/{api_version}/health`:
   - **localhost 模式**:直接 `npm run dev` 啟動,curl localhost
     - `include_database=false` → `curl -s localhost:<backend_port>/api/v1/health | jq -e '.data.status == "ok"'` exit 0
     - `include_database=true && § 2b 選「完整輸入」或「用預設值」` → **HARD**:`curl -s localhost:<backend_port>/api/v1/health | jq -e '.data.db == "ok"'` exit 0
     - `include_database=true && § 2b 選「SKIP」` → **SOFT**:curl 返回 `200` 即可
   - **Docker Compose 模式**:先 `docker compose up -d --build` 等服務 healthy,再 curl
7. `git status` 驗 `.env` 不出現在 untracked / staged

## 自我約束

- **禁止**自行寫程式碼骨架檔 — 落檔全交給 `scaffold/scaffold.mjs`
- **禁止**自行**撰寫**規範檔內容
- **禁止**自行指定版本號 — 一律由 `scaffold/manifest.json` 決定
- **禁止**直接執行 `git push`
- **禁止**把機密值寫入 git 追蹤的檔案
- **禁止**寫 `.env.staging` / `.env.production` 實際值

## 與 scaffold.mjs 的職責切割

| 職責 | 由誰處理 |
| --- | --- |
| Harness-Engineering/ 偵測 + 規範檔 cp + 自我刪除 | LLM |
| 工具偵測 + 缺套件 install 詢問 | LLM |
| 收 user 參數(含 include_database 詢問) | LLM |
| kebab-case 校驗 | scaffold.mjs |
| 模板替換 + 條件區塊 + 落檔 | scaffold.mjs |
| 版本鎖定 | `scaffold/manifest.json` |
| `npm install` / `prisma generate` | scaffold.mjs |
| acceptance 驗收 | LLM |
| git commit | LLM(經使用者同意) |
