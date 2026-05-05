# Template Index

**用途**:React + FastAPI + PostgreSQL 專案規範模板。AI agent 在下列情境讀此檔:

- user 要求 fork / 套用此 Template 至新專案 → 依〈使用協議〉操作
- user 跑 `/init-project` skill → skill 內部引用此 Template 各檔
- 需查詢 Template 內檔案位置 / 用途 → 看〈內容〉

---

## 鎖定(Locks)

- **Frontend**:React 19 + TS + (Vite | Next.js) + Redux Toolkit + RTK Query + Tailwind v4
- **Backend**:Python + FastAPI + SQLAlchemy 2 async + Pydantic 2 + Alembic + uv
- **Database**:PostgreSQL(asyncpg)
- **Dev**:本地開發(`uvicorn` + frontend dev server,不容器化)
- **Deploy**:本模板**不規範**部署細節

### 不適用(若 user 提及下列,須告知 user 此 Template 不適用)

Vue / Angular / Svelte / Express / NestJS / Spring / Django / Flask / Go / Ruby / PHP / MySQL / MariaDB / SQLite / SQL Server / Oracle / MongoDB / DynamoDB / Cassandra / CockroachDB

---

## Critical: localhost ≠ 部署環境

| | localhost(dev) | staging / prod(部署) |
| --- | --- | --- |
| `.env` 檔 | `.env.dev` | `.env.staging` / `.env.prod` |
| `DATABASE_URL` | `postgresql+asyncpg://...@localhost:5432/...` | 實際 host(`db.example.com` / RDS endpoint 等) |
| `JWT_SECRET_KEY` | 可用 dev 預設值 | **必**改 32+ 字元隨機(否則 fail-fast) |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | `["https://<frontend-domain>"]` |

### Agent 守則

- **禁止**把 `.env.dev` 內容(localhost / dev 預設 secret)用於部署
- **禁止**在 deploy 文件 / config 用 `localhost:*`
- user 說「要 deploy」但範例仍 `localhost` → 提醒 user 必須改實際 host,並指引 `.env.staging` / `.env.prod`

---

## 內容

```
Template/
├── README.md             本檔(Template index + 使用協議)
├── CLAUDE.md             Claude Code agent 規則(繁中)
├── AGENTS.md             多工具 agent 協議(Codex / Cursor / Cline / Aider)
├── scan-project.md       /scan-project skill 規格
├── init-project.md       /init-project skill 規格
└── design-base/
    ├── 00-overview.md    版本鎖定 / 機密 / API 文件 / 時區 / localhost vs 部署
    ├── 10-frontend.md    React 13 條硬規則
    ├── 20-backend.md     FastAPI 15 條硬規則
    ├── 30-database.md    PostgreSQL + SQLAlchemy 11 條硬規則
    └── 90-code-review.md fixed.md / dependency audit / commit / PR self-check
```

---

## 使用協議(AI agent 操作步驟)

### 情境 A:user 要求「複製 Template 到新專案」/「套用此 Template」

1. 確認當前目錄為空或剛 `git init`(若不空,告知 user 並暫停)
2. 複製檔案到新專案:
   - `CLAUDE.md` → `<project>/CLAUDE.md`
   - `AGENTS.md` → `<project>/AGENTS.md`
   - `scan-project.md` → `<project>/.claude/commands/scan-project.md`
   - `init-project.md` → `<project>/.claude/commands/init-project.md`
   - `design-base/*` → `<project>/docs/Design-Base/*`
3. 建議 user 跑 `/init-project` 產生 frontend / backend 骨架
4. **禁**自行創建任何容器化 / 部署檔

### 情境 B:user 跑 `/init-project`

依 `init-project.md` 執行(包含參數收集、骨架產出、本地啟動指引)。

### 情境 C:user 跑 `/scan-project`

依 `scan-project.md` 執行(掃描 + 累積式報告寫入 `docs/Tasks/scan-project/`)。

### 情境 D:user 詢問 Template 規範細節 / 衝突解決

- 讀對應 `design-base/*.md`
- 以 design-base 為地板;規則優先順序:`design-base/*` > `Arch/*` > `CLAUDE.md` > `Tasks/*`

---

## 升級協議

- 模板有版本演進 → 以 git tag 標記(`template-v1.0` 等)
- 採用方專案以 fork + cherry-pick 升級;**禁**直接覆寫已客製內容
- 各專案可在自己的 `docs/Design-Base/` 加更嚴格條款,但**不可**降低本模板的規則
