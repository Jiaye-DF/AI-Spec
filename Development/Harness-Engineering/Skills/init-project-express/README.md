# init-project-express — Claude Code Skill

在空目錄產生 **Next.js (App Router) + TypeScript + Express 5 + TypeScript**(可選 PostgreSQL + Prisma)專案最小可跑骨架的 Claude Code skill。本地開發優先,**不**內含 docs/Design-Base、CLAUDE.md、AGENTS.md 等 Harness-Engineering repo 的規範文件。

> 對應觸發詞:「初始化 Express 專案」「scaffold express」「建 express 專案」「new express project」

---

## 安裝

把整個 `init-project-express/` 資料夾複製到 user-level skills 目錄:

**macOS / Linux**

```bash
cp -r <repo>/init-project-express ~/.claude/skills/
```

**Windows (PowerShell)**

```powershell
Copy-Item -Recurse <repo>\init-project-express $env:USERPROFILE\.claude\skills\
```

或專案級安裝:

```bash
cp -r <repo>/init-project-express <your-project>/.claude/skills/
```

裝完重啟 Claude Code,輸入 `/init-project-express` 即觸發。

---

## 系統需求

- **Node.js** ≥ 24(scaffold.mjs 為 zero-dep ESM)
- **npm** ≥ 10
- **PostgreSQL** 18(僅 `include_database=true` 時需要)

---

## 用法

1. `cd <空目錄>`
2. 在 Claude Code 內說「初始化 Express 專案」/ 輸入 `/init-project-express`
3. Claude 會用 `AskUserQuestion` 問參數(專案名、port、是否啟用資料庫等)
4. Claude 先跑 `--dry-run` 預覽,確認後實際產出
5. 跑完依 next-steps 提示啟動 backend / frontend dev server

也可繞過 Claude 直接 CLI:

```bash
node ~/.claude/skills/init-project-express/scaffold/scaffold.mjs \
  --name my-app \
  --target ./my-app

# 不含資料庫
node ~/.claude/skills/init-project-express/scaffold/scaffold.mjs \
  --name my-app \
  --no-database \
  --target ./my-app
```

---

## 包含什麼

- **Backend**:Express 5 / TypeScript strict / Zod(env 驗證)/ bcryptjs / jsonwebtoken / cookie-parser
  - `src/{routes,middleware,utils,config,types,services,clients}/` 骨架
  - `/api/v1/health` endpoint
  - 統一 response 格式(`ApiResponse<T>`)/ AppError / registerErrorHandlers
  - 可選 Prisma 6 + PostgreSQL(`include_database=true`,預設)
  - Jest + supertest smoke test
- **Frontend**:Next.js 16 App Router / TypeScript strict / Redux Toolkit / Tailwind 4
  - `src/{lib,store,utils,components}/` 骨架
  - baseApi.ts 串後端 `/api/<version>/`
  - ESLint 9 flat config
- **Project root**:`.gitignore`、`.env.{development,staging,production}.example`、`README.md`
- **`.github/workflows/ci.yml`**:GitHub Actions backend + frontend job

## 不包含什麼

- **docs/Design-Base / CLAUDE.md / AGENTS.md** — 規範文件屬 Harness-Engineering repo
- **Dockerfile / docker-compose** — 本 skill 預設本地開發優先(`--use-docker-compose` 可選)
- **`.env` 實際值** — 只生 `.example`,實際值由開發者自填
- **PostgreSQL 安裝** — 開發者本機自備

---

## 結構

```
init-project-express/
├── SKILL.md              ← Claude Code skill entry(必要)
├── README.md             ← 本檔
└── scaffold/
    ├── scaffold.mjs      ← Node executor(zero-dep)
    ├── manifest.json     ← 版本 / 檔案地圖 / 條件分支(唯一真相)
    ├── README.md         ← scaffold 技術細節
    └── templates/
        ├── root/
        ├── backend/
        ├── frontend-next/
        ├── frontend-vite/
        ├── docker/
        └── .github/
```

---

## 與 init-project(FastAPI 版)的差異

| 項目 | init-project(FastAPI) | init-project-express |
| --- | --- | --- |
| 後端語言 | Python 3.14 | Node.js 24 / TypeScript |
| 後端框架 | FastAPI + uvicorn | Express 5 + ts-node-dev |
| 套件管理 | uv | npm |
| 驗證 | Pydantic v2 | Zod |
| ORM / DB | SQLAlchemy 2 + asyncpg + Alembic | Prisma 6 + @prisma/client |
| 密碼 | passlib[bcrypt] | bcryptjs |
| JWT | pyjwt[crypto] | jsonwebtoken |
| 測試 | pytest | Jest + supertest |
| Lint | ruff + mypy | ESLint + typescript-eslint |
| DB URL 格式 | `postgresql+asyncpg://...` | `postgresql://...` |

---

## Maintainer

(視您的需求填入)
