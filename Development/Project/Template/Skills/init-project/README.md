# init-project — Claude Code Skill

在空目錄產生 **React + TypeScript + FastAPI**(可選 PostgreSQL)專案最小可跑骨架的 Claude Code skill。本地開發優先,單純幫使用者起一個基本可跑環境,**不**內含 docs/Design-Base、CLAUDE.md、AGENTS.md 等 Template repo 的規範文件。

> 對應觸發詞:「初始化專案」「scaffold」「建專案」「new project」「開新專案」

---

## 安裝

把整個 `init-project/` 資料夾複製到 user-level skills 目錄:

**macOS / Linux**

```bash
git clone <repo-url>
cp -r <repo>/init-project ~/.claude/skills/
```

**Windows (PowerShell)**

```powershell
git clone <repo-url>
Copy-Item -Recurse <repo>\init-project $env:USERPROFILE\.claude\skills\
```

或專案級安裝(僅該專案可見):

```bash
cp -r <repo>/init-project <your-project>/.claude/skills/
```

裝完重啟 Claude Code,輸入 `/init-project` 或說「初始化專案」即觸發。

---

## 系統需求

- **Node.js** ≥ 22(scaffold.mjs 為 zero-dep ESM)
- **uv** ≥ 0.5(Python 套件管理;`--no-install` 可跳過)
- **npm** ≥ 10(`--no-install` 可跳過)
- **PostgreSQL** 18(僅 `include_database=true` 時需要;本機 install,scaffold 不負責安裝)

---

## 用法

裝好後:

1. `cd <空目錄>`
2. 在 Claude Code 內說「初始化專案」/ 輸入 `/init-project`
3. Claude 會用 `AskUserQuestion` 問參數(專案名、port、是否啟用資料庫 / Azure SSO 等)
4. Claude 先跑 `--dry-run` 預覽,確認後實際產出
5. 跑完依 next-steps 提示啟動 backend / frontend dev server

也可繞過 Claude 直接 CLI:

```bash
# 含資料庫(預設)
node ~/.claude/skills/init-project/scaffold/scaffold.mjs \
  --name my-app \
  --target ./my-app

# 不含資料庫
node ~/.claude/skills/init-project/scaffold/scaffold.mjs \
  --name my-app \
  --no-database \
  --target ./my-app
```

完整 flag 見 `scaffold/README.md`。

---

## 包含什麼

- **Backend**:FastAPI / Pydantic v2 / uv
  - `app/{api,core,schemas,services,clients}/` 骨架
  - `/api/v1/health` endpoint
  - 統一 response 格式 / exception handler / cookie helper
  - 可選 SQLAlchemy 2 + asyncpg + Alembic(`include_database=true`,預設)
  - 可選 Azure AD SSO module(`--include-azure-sso`)
- **Frontend**(Vite branch):React 19 / TypeScript 5.9 strict / Redux Toolkit / Tailwind 4
  - `src/{lib,store,utils,components}/` 骨架
  - baseApi.ts 串後端 `/api/<version>/`
  - ESLint 9 flat config
- **Project root**:`.gitignore`、`.env.{development,staging,production}.example`、`README.md`
- **`.github/workflows/ci.yml`**:GitHub Actions backend + frontend job

## 不包含什麼

- **docs/Design-Base / docs/Arch / docs/Tasks** — 規範文件屬 Template repo,需要時由使用者另行引入
- **CLAUDE.md / AGENTS.md** — agent 規則同上,本 skill 不複製
- **Dockerfile / docker-compose** — 本 skill 為本地開發優先,容器化請另外處理
- **Coolify / K8s 部署檔** — 同上
- **`.env` 實際值** — 只生 `.example`,實際值由開發者自填
- **next-frontend branch templates** — Phase 3 補上
- **PostgreSQL 安裝** — 開發者本機自備(scaffold 只跑 `alembic upgrade`)

---

## 結構

```
init-project/
├── SKILL.md              ← Claude Code skill entry(必要)
├── README.md             ← 本檔
└── scaffold/
    ├── scaffold.mjs      ← Node executor(zero-dep)
    ├── manifest.json     ← 版本 / 檔案地圖 / 條件分支(唯一真相)
    ├── README.md         ← scaffold 技術細節
    └── templates/
        ├── root/
        ├── backend/
        ├── frontend-vite/
        └── .github/
```

> 不再有 `docs/`、`CLAUDE.md`、`AGENTS.md`、`prompts/` — 那些是 Template repo 的內容,init-project 只是輕量 scaffold,不重複。

---

## 升級版本

版本號全部鎖在 `scaffold/manifest.json § versions`(三層樹:python / node / postgres / frontend.* / backend.*)。

```bash
# 例:升 React 19.2.5 → 19.3.0
# 編輯 scaffold/manifest.json,改 versions.frontend.react
# 不改任何 .tmpl(scaffold 自動展平為 {{react_version}} placeholder)
```

不要直接改 `.tmpl` 內的版本字串 — scaffold 會用 `{{<key>_version}}` 替換。

---

## License

(視您的需求填入,例如 MIT / Apache-2.0 / proprietary)

---

## Maintainer

(視您的需求填入)
