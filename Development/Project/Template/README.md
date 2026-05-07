# Template Index

**用途**:React + TypeScript + FastAPI + PostgreSQL 專案規範模板。AI agent 在下列情境讀此檔:

- user 要求 fork / 套用此 Template 至新專案 → 依〈使用協議〉操作
- user 跑 `/init-project` skill → skill 內部引用此 Template 各檔
- 需查詢 Template 內檔案位置 / 用途 → 看〈內容〉

---

## 鎖定(Locks)

- **Frontend**:React 19 + TS(`strict: true`)+ (Vite | Next.js) + Redux Toolkit + RTK Query + Tailwind v4
- **Backend**:Python + FastAPI + SQLAlchemy 2 async + Pydantic 2 + Alembic + uv
- **Database**:PostgreSQL(asyncpg)
- **Dev**:本地開發(後端 dev server + 前端 dev server,不容器化)
- **Deploy**:Coolify + Docker Compose(企業限定;見 `docs/Design-Base/06-Coolify-CD/`)

### 不適用(若 user 提及下列,告知此 Template 不適用)

Vue / Angular / Svelte / Express / NestJS / Spring / Django / Flask / Go / Ruby / PHP / MySQL / MariaDB / SQLite / SQL Server / Oracle / MongoDB / DynamoDB / Cassandra / CockroachDB / 非 Coolify 部署平台

---

## Critical: localhost ≠ 部署環境

| | localhost(dev) | staging / prod(部署) |
| --- | --- | --- |
| `.env` 檔 | `.env.dev` | `.env.staging` / `.env.prod` |
| `DATABASE_URL` | `postgresql+asyncpg://...@localhost:5432/...` | 實際 host(`db.example.com` / RDS endpoint 等) |
| `JWT_SECRET_KEY` | 可用 dev 預設值 | **必**改 32+ 字元隨機(否則 fail-fast) |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | `["https://<frontend-domain>"]` |

詳細環境分層說明見 `docs/Design-Base/00-overview/03-env-layers.md`。

### Agent 守則

- **禁止**把 `.env.dev` 內容(localhost / dev 預設 secret)用於部署
- **禁止**在 deploy 文件 / config 用 `localhost:*`
- user 說「要 deploy」但範例仍 `localhost` → 提醒 user 必須改實際 host

---

## 內容

```
Template/
├── README.md                本檔(Template index + 使用協議)
├── AGENTS.md                跨工具事實層(Commands / Code style / Just-in-time Loading 對照表)
├── CLAUDE.md                Claude 特化薄層(import AGENTS.md)
├── plan/                    Template 自身演進
│   ├── plan-v1.0.md         流程定義
│   └── report.md            詳細優化建議
├── prompts/                 跨 agent skill(YAML frontmatter)
│   ├── README.md
│   ├── init-project.md      workflow — scaffold 新專案
│   ├── propose-to-tasks.md  agent — orchestrator(從 propose 拆 tasks)
│   ├── scan-project.md      agent — 問題清單
│   └── reflect-rules.md     agent — 自適應學習
└── docs/Design-Base/
    ├── 00-overview/         跨領域共通底線(版本鎖定 / 機密 / 環境分層 / 時區 / API docs)
    ├── 01-propose/          版本演進 + Multi-agent 協議
    ├── 02-frontend/         前端硬規則
    ├── 03-backend/          後端硬規則
    ├── 04-databases/        資料庫硬規則
    ├── 05-CI/               GitHub CI 規範
    ├── 06-Coolify-CD/       Coolify 部署規範(企業限定)
    ├── 90-third-party-service/  三方服務串接(SMTP / SSO / payment)
    └── 99-code-review/      Code Review 收口
```

---

## 使用協議(AI agent 操作步驟)

### 情境 A:user 要求「複製 Template 到新專案」/「套用此 Template」

1. 確認當前目錄為空或剛 `git init`(若不空,告知 user 並暫停)
2. 複製檔案到新專案:
   - `CLAUDE.md` / `AGENTS.md` → `<project>/`
   - `prompts/*` → `<project>/docs/Prompts/*`
   - `docs/Design-Base/*` → `<project>/docs/Design-Base/*`
3. 建立 `<project>/.claude/commands/<name>.md`,每檔單行 `@docs/Prompts/<name>.md`
4. 建議 user 跑 `/init-project` 產生 frontend / backend 骨架
5. 部署規範以 `06-Coolify-CD/` 為地板;業務內容由各專案在 `<project>/docs/Tasks/v*/` 自決

### 情境 B:user 跑 `/init-project`

依 `prompts/init-project.md` 執行(包含參數收集、骨架產出、本地啟動指引、Acceptance 驗證)。

### 情境 C:user 跑 `/scan-project`

依 `prompts/scan-project.md` 執行(掃描 + 累積式報告寫入 `docs/Tasks/scan-project/`)。

### 情境 D:user 詢問 Template 規範細節 / 衝突解決

- 讀對應 `docs/Design-Base/<area>/*.md`(依 `AGENTS.md § Just-in-time Loading 對照表` 載入)
- 規則優先順序:`docs/Design-Base/* > docs/Arch/* > AGENTS.md / CLAUDE.md > docs/Tasks/*`

---

## 升級協議

- 模板有版本演進 → 以 git tag 標記(`template-v1.0` 等)
- 採用方專案以 fork + cherry-pick 升級;**禁**直接覆寫已客製內容
- 各專案可在自己的 `docs/Design-Base/` 加更嚴格條款,但**不可**降低本模板的規則
- Template 自身演進記錄於 `plan/plan-v1.0.md` + `plan/report.md`
