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
7. **AskUserQuestion 必有「推薦」選項**:每次呼叫 `AskUserQuestion`,**選項列表必須有一項標 `(Recommended)`** 放第一位。**選 Recommended 的雙條件**(同時滿足):
   - **(a) 命中典型意圖**:該選項是使用者觸發此 skill 時 80% 場景想要的結果(讓沒看清楚直接點的人也能落到對的位置)
   - **(b) 不會造成不可逆 / 高破壞性後果**:若典型意圖含「刪檔 / 覆寫客製內容 / 不可逆系統變更」,**Recommended 退一階**,選次安全(可逆 / 不毀資料)的選項;讓「危險但常見」的動作由使用者主動選

   例外:中性二選一(無客觀偏好,例如純「同意 / 取消」)可省標記。

   反例(別這樣設計):
   - ✗ Recommended = 「同意刪除全部既存檔案」(高破壞性,即使最常見也不能標 Recommended)
   - ✗ Recommended = 「中止」(典型意圖是執行,標中止會讓不看的人原地 stuck)

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
6. cp 其餘 `Template/skills/*`(除 `init-project` 之外的子目錄,例如 `start-dev` / `stop-dev`)→ `~/.claude/skills/<name>/`(全域,使用者其他專案也用得到)
7. **刪除整個 `<cwd>/Template/`**(✱ 不可逆)

選項(對齊心法 § 7,Recommended = 不看也不會出事的選項):

- **只 cp 不刪 Template/ (Recommended)** — 1–6 都做、跳過 7;Template/ 留在專案內,使用者之後想清再清(沒誤刪風險)
- **同意全部執行** — 走完整 1–7,含**不可逆刪除 Template/**(使用者讀過再選)
- **中止** — 什麼都不做,離開 skill

> 雖然 § 0d 對 Template/ 刪除還會獨立再確認一次,但 Recommended 仍走最安全路徑 — fail-safe 防呆。

> 不 cp 的東西:`Template/skills/init-project/`(使用者步驟 3 已自行裝過,不重蓋)、`Template/plan/`(模板自身演進史)、`Template/README.md`(模板索引,不是專案 README)。

#### 0c. 衝突處理

若 `<cwd>/CLAUDE.md` / `AGENTS.md` / `docs/Design-Base/` / `docs/Prompts/` 或 `~/.claude/skills/<name>/` **任一已存在**:

- **禁**直接覆寫
- 列出衝突清單,用 `AskUserQuestion` 詢問(對齊心法 § 7,**首項標 Recommended**):
  - **略過已存在的 (Recommended)** — 只 cp 不衝突的;客製版保留;最安全
  - **全部覆寫** — 用 Template 版蓋掉客製版(可能毀使用者既有客製,謹慎)
  - **中止** — 使用者要先自行處理

#### 0d. 執行

依使用者選擇執行步驟 1–6;最後一步「刪除 `Template/`」**獨立再確認一次**(因不可逆),確認後才刪。刪除前先確認 cwd 不在 `Template/` 子樹內(否則 PowerShell 會拒絕)。

刪除策略:
- Windows / PowerShell:`Remove-Item -Recurse -Force ./Template`
- POSIX:`rm -rf ./Template`

#### 0e. 完成 → 進 § 1

回報「Template/ 已展開並移除,規範檔 + 額外 skills(start-dev / stop-dev / ...)已就位」,接著進環境檢查。

---

### 1. 環境檢查

#### 1a. 工具檢查(node / npm / uv / python via uv)— 嚴格三層

> **設計目的**:避免「`--version` 過了就算 OK」的偽陽性 — 後續 `uv sync` / `npm install` / `uv run uvicorn` 失敗時 stderr 通常難解讀,提早 fail-fast 比較好除錯。
>
> **重要觀念**:本專案**不需要 system Python** — Python 由 uv 管理(`uv python install` 裝在 uv 沙箱內,不污染系統)。所謂「檢查 python」= 檢查 **uv 內有沒有 3.14.x**,而非 `python --version`。

讀 `scaffold/manifest.json § versions` 取得目標版本(node / python),依下表檢:

| 檢查項 | Layer 1:存在 | Layer 2:版本 | Layer 3:實際可用 |
| --- | --- | --- | --- |
| **node** | `node --version` exit 0 | 解析輸出,major == manifest `node_version` major | `node -e "console.log(1)"` 輸出 `1` |
| **npm** | `npm --version` exit 0 | major >= 10(對應 Node 24 同捆版) | (略)|
| **uv** | `uv --version` exit 0 | uv >= 0.4(能跑 `uv python`) | `uv --help` 含 `python` 子指令 |
| **python(via uv)** | (略,由 uv 提供)| (略)| `uv python find <X.Y>` exit 0(`<X.Y>` = manifest.versions.python 的前兩段,例如 `3.14.1` → `3.14`)|

**輸出格式**(列給使用者看,別吞):

```
→ 工具檢查(嚴格)
  [✓] node       v24.0.0       要求 v24       OK
  [✗] npm        ─             找不到指令
  [⚠] uv         0.1.5         要求 >= 0.4    版本太舊
  [✗] python     uv 內無 3.14   執行 `uv python install 3.14` 修復
```

#### 1a-1. 通過(全部 ✓)→ 進 § 1b

#### 1a-2. 有任一項 ✗ / ⚠ → 用 `AskUserQuestion` 詢問處理

選項:

- **代為處理**(推薦)— LLM 依下表跑 install / fix 指令;每跑完一條再回到 Layer 1–3 重驗,任一仍不通過 → 停下來貼 stderr,**禁**繼續往 § 2
- **使用者自裝** — 列出修復指令給使用者,中止 skill
- **跳過(`--no-install`)** — 僅當使用者明示只要落檔、後續 `uv sync` / `npm install` 自己跑

#### 1a-3. 修復指令對照表

| 失敗項 | Windows | macOS | Linux(Debian/Ubuntu)|
| --- | --- | --- | --- |
| node 缺 / 版本不符 | `winget install OpenJS.NodeJS.LTS`(若要鎖 v24)或 `winget install OpenJS.NodeJS` | `brew install node` | `sudo apt install nodejs npm`(版本可能舊,必要時用 [NodeSource](https://github.com/nodesource/distributions))|
| npm 缺 | 通常與 node 同捆 — 重開 shell 讓 PATH 生效;仍缺則重裝 node | 同左 | 同左 |
| uv 缺 / 版本太舊 | `winget install astral-sh.uv` 或 `winget upgrade astral-sh.uv` | `brew install uv` 或 `brew upgrade uv` | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| python 缺(uv 內)| `uv python install <X.Y>`(同上,例如 `uv python install 3.14`)| 同左 | 同左 |

> **禁止事項**:
> - 不問就跑 install / upgrade / 改 PATH / 開 admin
> - 不安裝替代工具(nvm / fnm / pyenv / pip / poetry / conda)— 鎖死 uv 一條路
> - 不調 system Python(`brew install python` / `apt install python3` / Windows 官方 installer)— Python 永遠由 uv 管理
> - 不修 `.bashrc` / `.zshrc` / 環境變數 — 安裝指令的副作用由 package manager 自己處理
> - 安裝完**必重驗**(再跑一次 Layer 1–3),不可假設 install 必成功

#### 1a-4. 安裝後 PATH 沒生效(Windows winget 常見)

`winget install` / `brew install` 完成後,**當前 shell session 的 PATH 仍是舊的** — `<tool> --version` 會繼續報 `not found`。處理流程:

1. 第一次重驗失敗 → **不要**自行猜安裝路徑去調用工具
2. 改成告知使用者:「`<tool>` 已安裝完成,但本 shell 的 PATH 尚未更新。請**關閉並重新開啟** Claude Code(或新開一個 PowerShell / Terminal 視窗),然後重跑 `/init-project`。」
3. **中止本次 skill**,等使用者重來

> **禁止語法**(PowerShell parse error 來源):
>
> ```powershell
> # ✗ 錯 — $env:VAR 後面直接接 \,parser 會把 \xxx 當下個 token,丟 UnexpectedToken
> $env:LOCALAPPDATA\Microsoft\WinGet\Packages\<...>\uv.exe --version
> ```
>
> 真有需要直接調用絕對路徑工具(極少見),用下列任一:
>
> ```powershell
> # ✓ A. call operator + 整段雙引號
> & "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\<...>\uv.exe" --version
>
> # ✓ B. Join-Path 乾淨組路徑
> $uv = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages\<...>\uv.exe'
> & $uv --version
> ```
>
> 但**正解仍是「重開 shell 讓 PATH 刷新」** — 直接 `uv --version`,不要拼絕對路徑。

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

### 2. 收集參數

#### 2a. 一般參數(用 `AskUserQuestion`)

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

#### 2b. PostgreSQL 連線(僅 `include_database=true` 進此節)

向使用者收 PG 帳密,寫到 `<target>/.env`(該檔已 `.gitignore`,不會進 git)。**禁**:寫到任何 git 追蹤的檔案、寫到終端 transcript 後不抹去、預設高熵密碼。

**先用 `AskUserQuestion` 問處理方式**:

| 選項 | 行為 |
| --- | --- |
| **完整輸入**(推薦) | LLM 接續詢問 user 與 password,寫入 `.env`;acceptance § 6 跑 DB 連線 hard check |
| **用預設值** | `postgres_user=<project_name_underscore>`、`postgres_password=changeme-development`,寫入 `.env`;acceptance § 6 仍跑 hard check(預設值在本機 PG 也得有對應 role)|
| **暫時跳過(SKIP)** | 適用「忘記 / 沒有本機 PG / 連不上」— 仍寫 `.env` 用預設值(讓 backend 起得來),但 acceptance § 6 改 SOFT(下節說明)|

**完整輸入**子流程(plain text Q&A,不用 `AskUserQuestion`):

1. `LLM 問`:「DB user 名稱?(預設 `<project_name_underscore>`)」
2. `LLM 問`:「DB password?(本地 dev 用,任意字串即可)」
3. 收完 → 確認一次:「將寫入 `<target>/.env`,內容(已馬賽克部分):`DATABASE_URL=postgresql+asyncpg://<user>:****@localhost:<postgres_port>/<db>` — 確認?」

> **注意**:`AskUserQuestion` 的 "Other" 選項在 transcript 留下使用者輸入痕跡;對 dev-only 弱密碼可以接受,但**務必告知**使用者該值會出現在對話中。若使用者要用真實高熵密碼,建議他們**選 SKIP 後手動編輯 `.env`**。

#### 2c. 把參數帶給 scaffold.mjs

skill 安裝後路徑通常為 `~/.claude/skills/init-project/`。呼叫:

```bash
node <skill-root>/scaffold/scaffold.mjs \
  --name <project_name> \
  --frontend <vite|next> \
  [--no-database] \
  [--include-azure-sso] \
  --frontend-port <n> --backend-port <n> --postgres-port <n> \
  [--postgres-user <name>] [--postgres-password <pw>] \
  --api-version <v> \
  --target <當前目錄或使用者指定>
```

`include_database` 預設 on;使用者選不要 DB 時加 `--no-database`。`--postgres-user` / `--postgres-password` 不傳則 scaffold 用預設(`<project_name_underscore>` / `changeme-development`)。

**先 `--dry-run` 預覽**;確認無誤後再實際執行。

### 3. 顯示 next steps

scaffold.mjs 結束後會自動印出。LLM 不需重述。

### 4. (可選)git commit

#### 4a. 前置判斷:cwd 有沒有 `.git/`

先檢查 `<cwd>/.git/` 是否存在(`Test-Path .git` / `[ -d .git ]`):

- **不存在** → **完全跳過本節**,不詢問使用者、不建議 `git init`(尊重使用者刻意不用 git 的決定);skill 至此結束
- **存在** → 進 § 4b

#### 4b. 詢問使用者是否 commit

用 `AskUserQuestion`(對齊心法 § 7 雙條件;commit 是可逆動作 — 即使誤點也能 `git reset HEAD~1`,故 Recommended 可命中典型意圖):

- **建立 commit (Recommended)** — 走下面 commit 流程
- **先不 commit** — 由使用者後續手動 `git add` / `git commit`(scaffold 出來的檔案保留,只是不入 commit)

#### 4c. 執行 commit(若使用者選了「建立 commit」)

commit message 依本次有沒有走 § 0 而異:

- 含 § 0(套過 Template):`(AI) Add: 套用 Template 規範 + 初始化 React + FastAPI 專案骨架`
- 不含 § 0:`(AI) Add: 初始化 React + FastAPI 專案骨架`

```bash
git add -A && git commit -m "<上述 message>"
```

> **注意**:`.env`(若 § 2b 有寫入)已在 `.gitignore` 內,`git add -A` 不會誤 commit。但仍要 `git status` 二次目視確認 — **禁**讓 `.env` 進 git。

## Acceptance(必跑,任一失敗不報告完成)

1. `node <skill>/scaffold/scaffold.mjs --name ... --dry-run` exit 0(scaffold 邏輯本身合法)
2. 實際產出後 `cd backend && uv sync --frozen` exit 0
3. `cd backend && uv run ruff check .` exit 0
4. `cd backend && uv run mypy . --strict` exit 0
5. `cd frontend && npm ci && npm run typecheck && npm run lint` exit 0
6. 啟 backend 後驗 `/api/{api_version}/health`,**模式**依 § 2b 使用者選擇分歧:
   - `include_database=false` → `curl -s localhost:<backend_port>/api/v1/health | jq -e '.data.status == "ok"'` exit 0
   - `include_database=true && § 2b 選「完整輸入」或「用預設值」` → **HARD**:`curl -s localhost:<backend_port>/api/v1/health | jq -e '.data.db == "ok"'` exit 0(連不上 DB → fail)
   - `include_database=true && § 2b 選「暫時跳過(SKIP)」` → **SOFT**:`curl -s -o /dev/null -w "%{http_code}" localhost:<backend_port>/api/v1/health` 為 `200`(backend 起得來)即可;`.data.db` 允許 `"error"` 或 `"unknown"`;**警告但不 fail**,並提醒使用者「PG 連線跳過驗證,等你裝好 PG 後重跑 `/start-dev` + 手動 curl /health 確認」
7. **僅當 cwd 有 `.git/`**:`git status` untracked 為新建檔;**禁** dirty 既有檔;**禁** `.env` 出現在 untracked / staged 清單(被 `.gitignore` 擋住才對,出現代表 .gitignore 沒生效)。無 `.git/` → 跳過本條(對齊 § 4a)
8. 確認 `~/.claude/skills/start-dev/` 與 `~/.claude/skills/stop-dev/` 已就位(§ 0b 步驟 6 cp 過去)— `ls ~/.claude/skills/` 含這兩個目錄
9. (可選)實際跑一次 `/start-dev` → backend + frontend 兩個 dev server 起得來;再跑 `/stop-dev` → 正常清掉

## 自我約束

- **禁止**自行寫程式碼骨架檔 — 落檔全交給 `scaffold/scaffold.mjs`
- **禁止**自行**撰寫**規範檔內容(CLAUDE.md / AGENTS.md / docs/Design-Base / docs/Prompts)— § 0 只 cp 既有 `Template/` 內檔案,不可生成新文字
- **禁止**自行指定版本號 — 一律由 `scaffold/manifest.json` 決定
- **禁止**直接執行 `git push`;`git commit` 須使用者明示同意
- **禁止**把使用者輸入的機密值寫入會被 git 追蹤的檔案(`.env.*.example` / `README.md` / `pyproject.toml` 等);**允許**寫到 `.env`(已 `.gitignore`),且僅限本機 dev 用值(`changeme-development` 級弱密碼或使用者明示輸入)
- **禁止**寫 `.env.staging` / `.env.production` 實際值(永遠由部署環境注入)
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
