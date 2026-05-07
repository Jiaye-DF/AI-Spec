# init-project — Claude Code Skill

在空目錄產生 **React + TypeScript + FastAPI + PostgreSQL** 專案最小可跑骨架的 Claude Code skill。本地開發優先,不含容器化 / 部署檔。

> 對應觸發詞:「初始化專案」「scaffold」「建專案」「new project」「開新專案」

---

## 安裝

### Claude Code(目前唯一支援)

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
- **PostgreSQL** 18(本機 install,scaffold 不負責安裝)

---

## 用法

裝好後:

1. `cd <空目錄>`
2. 在 Claude Code 內說「初始化專案」/ 輸入 `/init-project`
3. Claude 會用 `AskUserQuestion` 問參數(專案名、port、是否啟用 Azure SSO 等)
4. Claude 先跑 `--dry-run` 預覽,確認後實際產出
5. 跑完依 next-steps 提示啟動 backend / frontend dev server

也可繞過 Claude 直接 CLI:

```bash
node ~/.claude/skills/init-project/scaffold/scaffold.mjs \
  --name my-app \
  --target ./my-app
```

完整 flag 見 `scaffold/README.md`。

---

## 包含什麼

- **Backend**:FastAPI 0.136 / SQLAlchemy 2.0 / Alembic / asyncpg / Pydantic v2
  - `app/{api,core,models,schemas,services,repositories,clients}/` 骨架
  - `/api/v1/health` endpoint(回 DB ping 結果)
  - 統一 response 格式 / exception handler / cookie helper
  - 可選 Azure AD SSO module(`--include-azure-sso`)
- **Frontend**(Vite branch):React 19 / TypeScript 5.9 strict / Redux Toolkit / Tailwind 4
  - `src/{lib,store,utils,components}/` 骨架
  - baseApi.ts 串後端 `/api/<version>/`
  - ESLint 9 flat config
- **Project root**:`.gitignore`、`.env.{development,staging,production}.example`、`README.md`
- **`docs/`**:`Design-Base/`(實作規範)+ `Arch/`(架構記錄)+ `Tasks/`(版本實作目錄)
- **`.github/workflows/ci.yml`**:GitHub Actions backend + frontend job
- **`CLAUDE.md` / `AGENTS.md`**:agent 規則,複製後產出於目標專案

## 不包含什麼

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
├── CLAUDE.md             ← agent 全局規則(scaffold 會 copy 進產出專案)
├── AGENTS.md             ← agent capabilities baseline(同上)
├── prompts/
│   └── scan-project.md   ← scaffold 會 copy 到產出專案的 .claude/commands/
├── docs/
│   ├── Design-Base/      ← 實作規範(scaffold copy_dir 進產出專案)
│   ├── Arch/             ← 架構記錄(同上)
│   └── Tasks/README.md   ← 版本實作目錄索引(同上)
└── scaffold/
    ├── scaffold.mjs      ← Node executor(zero-dep)
    ├── manifest.json     ← 版本 / 檔案地圖 / 條件分支(唯一真相)
    ├── README.md         ← scaffold 技術細節
    └── templates/
        ├── root/
        ├── backend/
        ├── frontend-vite/
        ├── docs/
        └── .github/
```

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
