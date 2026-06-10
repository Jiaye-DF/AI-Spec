---
name: init-project-express
description: 一鍵套用 Harness-Engineering + 產生 Next.js (App Router) + TypeScript + Express 5 + TypeScript(可選 PostgreSQL Prisma / Docker Compose)最小可跑骨架。若 cwd 含 Harness-Engineering/,先 cp 規範檔(AGENTS.md / docs/Design-Base / prompts→docs/Prompts)並刪除 Harness-Engineering/,再跑 scaffold.mjs(CLAUDE.md 由 scaffold 產生 Express 版)。當使用者說「初始化 Express 專案 / scaffold express / 建 express 專案 / new express project」時觸發。版本鎖定 / 檔案地圖由 scaffold/manifest.json 決定。
---

# init-project-express

從「Harness-Engineering 在專案目錄裡」一路自動跑到「backend/ + frontend/ 可跑」的單入口 skill。**後端為 Express 5 + TypeScript，前端為 Next.js 16 App Router。** LLM 負責：Harness-Engineering/ 自動展開 → 環境檢查 → 收參 + 校驗 → 呼叫 `scaffold.mjs` → 跑 acceptance。**不**自由發揮、**不**內嵌任何模板內容。

## 設計目的（使用者 3+1 動作）

| # | 誰做 | 動作 |
| --- | --- | --- |
| 1 | 使用者 | 下載 Harness-Engineering 資料夾 |
| 2 | 使用者 | 把 Harness-Engineering/ 整個 cp 進專案目錄（`<project>/Harness-Engineering/`） |
| 3 | 使用者 | 把 `Harness-Engineering/skills/init-project-express/` cp 到 `.claude/skills/init-project-express/`（專案 local 或 `~/.claude/skills/` 全域皆可） |
| 4 | 使用者 | 在專案根目錄跑 `/init-project-express` |
| 4a | 本 skill | 偵測 `Harness-Engineering/` → 規範檔自動 cp 到專案根 → **刪除 `Harness-Engineering/`** → 環境檢查 → scaffold backend + frontend |

## 心法

1. **不自由發揮**：落檔交給 `scaffold/scaffold.mjs`，LLM 不得自己寫 src/.tmpl 內容
2. **版本一律鎖到 patch**：版本只在 `scaffold/manifest.json` 一處，LLM 不得自行指定
3. **本地開發優先**：後端 `ts-node-dev` + 前端 dev server；若 `include_database=true`，PostgreSQL 由開發者本機 install 或以 Docker Container 跑（依 § 1c 使用者選擇）
4. **輸出語言**：繁體中文（回應 / 註解 / 文件 / commit message）
5. **範圍邊界**：本 skill 含「規範檔展開」與「程式碼骨架產出」兩段 — 但**僅限 cp Harness-Engineering/ 已存在的內容**，LLM 不得自寫 docs/Design-Base / AGENTS.md 任何字句。**CLAUDE.md 由 scaffold 在 § 2c 產生（Express 版 `scaffold/templates/root/CLAUDE.md.tmpl`），§ 0 不 cp Harness-Engineering/CLAUDE.md**
6. **不可逆動作要明示**：刪除 `Harness-Engineering/` 前必須再次徵詢確認
7. **AskUserQuestion 必有「推薦」選項**：每次呼叫 `AskUserQuestion`，**選項列表必須有一項標 `(Recommended)` 放第一位**。**選 Recommended 的雙條件**（同時滿足）：
   - **(a) 命中典型意圖**：該選項是使用者觸發此 skill 時 80% 場景想要的結果（讓沒看清楚直接點的人也能落到對的位置）
   - **(b) 不會造成不可逆 / 高破壞性後果**：若典型意圖含「刪檔 / 覆寫客製內容 / 不可逆系統變更」，**Recommended 退一階**，選次安全（可逆 / 不毀資料）的選項；讓「危險但常見」的動作由使用者主動選

   例外：中性二選一（無客觀偏好，例如純「同意 / 取消」）可省標記。

   反例（別這樣設計）：
   - ✗ Recommended = 「同意刪除全部既存檔案」（高破壞性，即使最常見也不能標 Recommended）
   - ✗ Recommended = 「中止」（典型意圖是執行，標中止會讓不看的人原地 stuck）

## 執行步驟

### 0. Harness-Engineering/ 自動套用（若 cwd 有 `Harness-Engineering/` 子目錄）

> 設計目的：讓使用者只要做 3 個手動動作（下載 Harness-Engineering / cp 到專案 / cp `skills/init-project-express` 到 `.claude/skills/`），其餘**全部由本 skill 接手**。

#### 0a. 偵測

檢查 `<cwd>/Harness-Engineering/` 是否存在。

- **不存在** → 略過本節，進 § 1（假設規範檔已就位 / 使用者已自行套過模板）
- **存在** → 進 0b

#### 0b. 同意確認（AskUserQuestion）

向使用者一次性確認下列動作會執行：

1. cp `Harness-Engineering/AGENTS.md` → `<cwd>/AGENTS.md`
2. cp -r `Harness-Engineering/docs/Design-Base/` → `<cwd>/docs/Design-Base/`
3. cp -r `Harness-Engineering/prompts/` → `<cwd>/docs/Prompts/`（注意：目錄改名 `prompts` → `Prompts`）
4. 為 `<cwd>/docs/Prompts/*.md`（略過 `README.md`）產 `<cwd>/.claude/commands/<name>.md`，內容單行 `@docs/Prompts/<name>.md`
5. cp 其餘 `Harness-Engineering/skills/*`（除 `init-project-express` 之外的子目錄，例如 `start-dev` / `stop-dev`）→ `~/.claude/skills/<name>/`（全域，使用者其他專案也用得到）
6. **刪除整個 `<cwd>/Harness-Engineering/`**（✱ 不可逆）

> **CLAUDE.md 不在本節 cp**：Express 版 CLAUDE.md 由 scaffold 在 § 2c 統一產生（`scaffold/templates/root/CLAUDE.md.tmpl`），確保技術棧描述正確。

選項（對齊心法 § 7，Recommended = 不看也不會出事的選項）：

- **只 cp 不刪 Harness-Engineering/ (Recommended)** — 步驟 1–5 都做、跳過步驟 6；Harness-Engineering/ 留在專案內，使用者之後想清再清（沒誤刪風險）
- **同意全部執行** — 走完整步驟 1–5，含**不可逆刪除 Harness-Engineering/**（使用者讀過再選）
- **中止** — 什麼都不做，離開 skill

> 雖然 § 0d 對 Harness-Engineering/ 刪除還會獨立再確認一次，但 Recommended 仍走最安全路徑 — fail-safe 防呆。

> 不 cp 的東西：`Harness-Engineering/CLAUDE.md`（由 scaffold 產 Express 版）、`Harness-Engineering/skills/init-project-express/`（使用者步驟 3 已自行裝過，不重蓋）、`Harness-Engineering/plan/`（模板自身演進史）、`Harness-Engineering/README.md`（模板索引，不是專案 README）。

#### 0c. 衝突處理

若 `<cwd>/AGENTS.md` / `docs/Design-Base/` / `docs/Prompts/` 或 `~/.claude/skills/<name>/` **任一已存在**：

- **禁**直接覆寫
- 列出衝突清單，用 `AskUserQuestion` 詢問（對齊心法 § 7，**首項標 Recommended**）：
  - **略過已存在的 (Recommended)** — 只 cp 不衝突的；客製版保留；最安全
  - **全部覆寫** — 用 Harness-Engineering 版蓋掉客製版（可能毀使用者既有客製，謹慎）
  - **中止** — 使用者要先自行處理

#### 0d. 執行

依使用者選擇執行步驟 1–5；最後一步「刪除 `Harness-Engineering/`」**獨立再確認一次**（因不可逆），確認後才刪。刪除前先確認 cwd 不在 `Harness-Engineering/` 子樹內（否則 PowerShell 會拒絕）。

刪除策略：
- Windows / PowerShell：`Remove-Item -Recurse -Force ./Harness-Engineering`
- POSIX：`rm -rf ./Harness-Engineering`

#### 0e. 完成 → 進 § 1

回報「Harness-Engineering/ 已展開並移除，規範檔 + 額外 skills（start-dev / stop-dev / ...）已就位；CLAUDE.md 將由 scaffold 在 § 2c 產生」，接著進環境檢查。

---

### 1. 環境檢查

#### 1a. 工具檢查（node / npm）— 嚴格三層

讀 `scaffold/manifest.json § versions` 取得目標版本（node），依下表檢：

| 檢查項 | Layer 1：存在 | Layer 2：版本 | Layer 3：實際可用 |
| --- | --- | --- | --- |
| **node** | `node --version` exit 0 | 解析輸出，major == manifest `node_version` major | `node -e "console.log(1)"` 輸出 `1` |
| **npm** | `npm --version` exit 0 | major >= 10 | （略） |

> **Express 版不需要 uv / Python** — 後端同樣以 Node.js 執行。

**輸出格式**：

```
→ 工具檢查
  [✓] node       v24.0.0       要求 v24       OK
  [✓] npm        10.x.x        要求 >= 10     OK
```

#### 1a-1. 通過（全部 ✓）→ 進 § 1b

#### 1a-2. 有任一項 ✗ / ⚠ → 用 `AskUserQuestion` 詢問

選項：
- **代為處理 (Recommended)** — LLM 依 § 1a-3 修復表跑 install 指令；每跑完一條再回到 Layer 1–3 重驗，任一仍不通過 → 停下來貼 stderr，**禁**繼續往 § 2
- **使用者自裝** — 列出修復指令給使用者，中止 skill
- **跳過（`--no-install`）** — 只落檔，npm install 由使用者之後跑

#### 1a-3. 修復指令對照表

| 失敗項 | Windows | macOS | Linux（Debian/Ubuntu） |
| --- | --- | --- | --- |
| node 缺 / 版本不符 | `winget install OpenJS.NodeJS.LTS`（鎖 v24）或 `winget install OpenJS.NodeJS` | `brew install node` | `sudo apt install nodejs npm`（版本可能舊；必要時用 NodeSource） |
| npm 缺 | 通常與 node 同捆 — 重開 shell 讓 PATH 生效；仍缺則重裝 node | 同左 | 同左 |

> **禁止事項**：
> - 不問就跑 install / upgrade / 改 PATH / 開 admin
> - 不安裝替代工具（nvm / fnm / volta）— 鎖死一條路
> - 安裝完**必重驗**（再跑一次 Layer 1–3），不可假設 install 必成功

#### 1a-4. 安裝後 PATH 沒生效（Windows winget 常見）

`winget install` 完成後，**當前 shell session 的 PATH 仍是舊的** — `<tool> --version` 會繼續報 `not found`。處理流程：

1. 第一次重驗失敗 → **不要**自行猜安裝路徑去調用工具
2. 改成告知使用者：「`<tool>` 已安裝完成，但本 shell 的 PATH 尚未更新。請**關閉並重新開啟** Claude Code（或新開一個 PowerShell / Terminal 視窗），然後重跑 `/init-project-express`。」
3. **中止本次 skill**，等使用者重來

> **禁止語法**（PowerShell parse error 來源）：
>
> ```powershell
> # ✗ 錯 — $env:VAR 後面直接接 \，parser 會把 \xxx 當下個 token
> $env:LOCALAPPDATA\Microsoft\WinGet\Packages\<...>\node.exe --version
> ```
>
> 真有需要直接調用絕對路徑工具（極少見），用下列任一：
>
> ```powershell
> # ✓ A. call operator + 整段雙引號
> & "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\<...>\node.exe" --version
>
> # ✓ B. Join-Path 組路徑
> $node = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages\<...>\node.exe'
> & $node --version
> ```
>
> 但**正解仍是「重開 shell 讓 PATH 刷新」** — 直接 `node --version`，不要拼絕對路徑。

#### 1b. target 目錄狀態

target 目錄允許三種狀態：
1. **空**（或僅含 `.git/`）→ 直接落檔
2. **僅含 Harness-Engineering 規範檔**（`AGENTS.md` / `docs/Design-Base/` / `docs/Prompts/` / `.claude/commands/`）→ 合法 pre-state，**加 `--force`** 後落檔（scaffold 不會動到這些規範檔）
3. **既有專案 / 其他內容** → 詢問使用者是否確認加 `--force`（可能覆寫客製檔）

> scaffold 會在 target 根層**寫入或覆寫**下列檔案：
> - `CLAUDE.md` / `.gitignore` / `.gitleaks.toml` / `README.md`
> - `.env.development.example` / `.env.staging.example` / `.env.production.example`
> - `.github/workflows/ci.yml` / `.github/workflows/e2e.yml`
> - `backend/**` / `frontend/**`（整個子樹）

#### 1c. Docker / Docker Compose 偵測

**偵測指令**：

```bash
docker --version
docker compose version    # Compose V2（推薦）
docker-compose --version  # Compose V1（回退）
```

**結果分流**：

| 偵測結果 | 行為 |
| --- | --- |
| Docker 不存在 / daemon 未啟動（exit ≠ 0） | 直接採用 localhost 模式，設 `use_docker_compose=false`，跳至 § 2；不詢問 |
| Docker 存在，但 Compose 不存在 | 同上，採 localhost 模式；可告知「Docker 可用但無 Compose，沿用 localhost」 |
| Docker 與 Compose（V1 或 V2）皆就緒 | 用 `AskUserQuestion` 詢問使用者（見下） |

**詢問選項**（僅當 Docker + Compose 皆就緒時）：

- **localhost 模式 (Recommended)** — 後端 ts-node-dev + 前端 dev server；PostgreSQL 本機 install；最快 onboard；scaffold 不產 Dockerfile / docker-compose.yml；`use_docker_compose=false`
- **Docker Compose 模式** — scaffold 額外產 `docker-compose.yml` + `frontend/Dockerfile` + `backend/Dockerfile`；PostgreSQL 以 container 跑；`use_docker_compose=true`

---

### 2. 收集參數

#### 2a. 一般參數（用 `AskUserQuestion`）

| 參數 | 預設 | 說明 |
| --- | --- | --- |
| `project_name` | （必填） | kebab-case；校驗 `/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/` |
| `frontend` | `next` | `next`（App Router，推薦）或 `vite` |
| `include_database` | `true` | true 時加 Prisma + PostgreSQL；false 則純 Express |
| `use_docker_compose` | 由 § 1c 決定 | |
| `frontend_port` | `3000` | dev server port |
| `backend_port` | `8000` | dev server port |
| `postgres_port` | `5432` | 本機 PostgreSQL port（僅 `include_database=true` 用） |
| `api_version` | `v1` | API 路徑前綴 |
| `target` | cwd | 產出根目錄 |

> `include_database` 必須**主動詢問**使用者

#### 2b. PostgreSQL 連線（僅 `include_database=true` 進此節）

向使用者收 PG 帳密，寫到 `<target>/.env`（已 `.gitignore`）。

`DATABASE_URL` 格式（Prisma）：
```
DATABASE_URL=postgresql://<user>:<password>@localhost:<postgres_port>/<project_name_underscore>
```

> **注意**：Express + Prisma 使用標準 `postgresql://`，**不**需要 `+asyncpg` 或其他 driver 前綴。

**先用 `AskUserQuestion` 問處理方式**（三個選項）：

| 選項 | 行為 |
| --- | --- |
| **完整輸入 (Recommended)** | LLM 接續詢問 user 與 password，寫入 `.env`；acceptance § 6 跑 DB 連線 hard check |
| **用預設值** | `postgres_user=<project_name_underscore>`、`postgres_password=changeme-development`，寫入 `.env`；acceptance § 6 仍跑 hard check（預設值在本機 PG 也得有對應 role） |
| **暫時跳過（SKIP）** | 適用「忘記 / 沒有本機 PG / 連不上」— 仍寫 `.env` 用預設值（讓 backend 起得來），但 acceptance § 6 改 SOFT |

**完整輸入**子流程（plain text Q&A，不用 `AskUserQuestion`）：

1. `LLM 問`：「DB user 名稱？（預設 `<project_name_underscore>`）」
2. `LLM 問`：「DB password？（本地 dev 用，任意字串即可）」
3. 收完 → 確認一次：「將寫入 `<target>/.env`，內容（已馬賽克）：`DATABASE_URL=postgresql://<user>:****@localhost:<postgres_port>/<db>` — 確認？」

> **注意**：若使用者要用真實高熵密碼，建議他們**選 SKIP 後手動編輯 `.env`**。

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

**先 `--dry-run` 預覽**；確認無誤後再實際執行。

### 3. 顯示 next steps

scaffold.mjs 結束後會自動印出。LLM 不需重述。

### 4. （可選）git commit

#### 4a. 前置判斷：cwd 有沒有 `.git/`

先檢查 `<cwd>/.git/` 是否存在（`Test-Path .git` / `[ -d .git ]`）：

- **不存在** → **完全跳過本節**，不詢問使用者、不建議 `git init`；skill 至此結束
- **存在** → 進 § 4b

#### 4b. 詢問使用者是否 commit

用 `AskUserQuestion`（commit 是可逆動作，Recommended 可命中典型意圖）：

- **建立 commit (Recommended)** — 走下面 commit 流程
- **先不 commit** — 由使用者後續手動 `git add` / `git commit`

#### 4c. 執行 commit（若使用者選了「建立 commit」）

commit message 依本次有沒有走 § 0 而異：

- 含 § 0：`(AI) Add: 套用 Harness-Engineering 規範 + 初始化 Next.js + Express 專案骨架`
- 不含 § 0：`(AI) Add: 初始化 Next.js + Express 專案骨架`

```bash
git add -A && git commit -m "<上述 message>"
```

> **注意**：`.env`（若 § 2b 有寫入）已在 `.gitignore` 內，`git add -A` 不會誤 commit。但仍要 `git status` 二次目視確認 — **禁**讓 `.env` 進 git。

## Acceptance（必跑，任一失敗不報告完成）

1. `node <skill>/scaffold/scaffold.mjs --name ... --dry-run` exit 0
2. 實際產出後 `cd backend && npm ci` exit 0
3. `cd backend && npm run lint` exit 0
4. `cd backend && npm run typecheck` exit 0
5. `cd frontend && npm ci && npm run typecheck && npm run lint` exit 0
6. 啟 backend 後驗 `/api/{api_version}/health`：
   - **localhost 模式**：直接 `npm run dev` 啟動，curl localhost
     - `include_database=false` → `curl -s localhost:<backend_port>/api/v1/health | jq -e '.data.status == "ok"'` exit 0
     - `include_database=true && § 2b 選「完整輸入」或「用預設值」` → **HARD**：`curl -s localhost:<backend_port>/api/v1/health | jq -e '.data.db == "ok"'` exit 0
     - `include_database=true && § 2b 選「SKIP」` → **SOFT**：curl 返回 `200` 即可；`.data.db` 允許 `"error"`；**警告但不 fail**
   - **Docker Compose 模式**：先 `docker compose up -d --build` 等服務 healthy，再 curl
7. **僅當 cwd 有 `.git/`**：`git status` 驗 `.env` 不出現在 untracked / staged；無 `.git/` → 跳過本條
8. 確認 `~/.claude/skills/start-dev/` 與 `~/.claude/skills/stop-dev/` 已就位（§ 0b 步驟 5 cp 過去）— `ls ~/.claude/skills/` 含這兩個目錄
9. （可選）實際跑一次 `/start-dev` → backend + frontend 兩個 dev server 起得來；再跑 `/stop-dev` → 正常清掉

## 自我約束

- **禁止**自行寫程式碼骨架檔 — 落檔全交給 `scaffold/scaffold.mjs`
- **禁止**自行**撰寫**規範檔內容（AGENTS.md / docs/Design-Base / docs/Prompts）— § 0 只 cp 既有 `Harness-Engineering/` 內檔案，不可生成新文字
- **禁止**自行指定版本號 — 一律由 `scaffold/manifest.json` 決定
- **禁止**直接執行 `git push`；`git commit` 須使用者明示同意
- **禁止**把使用者輸入的機密值寫入會被 git 追蹤的檔案
- **禁止**寫 `.env.staging` / `.env.production` 實際值
- **禁止**刪除 `Harness-Engineering/` 之外的任何使用者既有目錄
- **禁止**在使用者拒絕 § 0 的 cp 動作後仍執行 § 1 之後的 scaffold（整個流程中止，不部分執行）
- 產出後簡述「本次套了什麼規範 / 骨架包含什麼 / 不包含什麼 / 下一步是什麼」，引用 `scaffold.mjs` 的 next-steps 輸出即可

## 與 scaffold.mjs 的職責切割

| 職責 | 由誰處理 |
| --- | --- |
| Harness-Engineering/ 偵測 + 規範檔 cp + 自我刪除 | LLM |
| 工具偵測 + 缺套件 install 詢問 | LLM |
| 收 user 參數（含 include_database 詢問） | LLM |
| kebab-case 校驗 | scaffold.mjs |
| 模板替換 + 條件區塊 + 落檔（含 CLAUDE.md Express 版） | scaffold.mjs |
| 版本鎖定 | `scaffold/manifest.json` |
| `npm install` / `prisma generate` | scaffold.mjs |
| acceptance 驗收 | LLM |
| git commit | LLM（經使用者同意） |

> 修改 scaffold 行為 → 改 `scaffold/manifest.json` / `scaffold/scaffold.mjs` / `scaffold/templates/*.tmpl`；**不**改 SKILL.md（本檔只描述 LLM 行為）。
