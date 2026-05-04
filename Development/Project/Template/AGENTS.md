# AGENTS.md

跨工具(Codex / Cursor / Cline / Aider / Claude Code)agent 協議。**鎖定 React + FastAPI 前後端分離,本地開發**。專案規則於 `docs/Design-Base/`。

> ⚠️ **localhost ≠ 部署環境**。下方所有 `localhost:*` 範例僅供本地開發;部署必須改實際 host,本模板**不規範**部署設定。

## Project Overview

<一句話描述。>

## Tech Stack

- **Frontend**:React 19 + TS + Redux Toolkit + RTK Query + Tailwind v4(Vite **或** Next.js)
- **Backend**:Python + FastAPI + SQLAlchemy 2 async + Pydantic 2 + Alembic + uv + httpx + `pyjwt[crypto]` + `passlib[bcrypt]`
- **Database**:PostgreSQL(asyncpg)+ Redis(`redis[hiredis]` async)
- **Versions pinned to patch**(見 `docs/Design-Base/00-overview.md § 版本鎖定原則`)

## Build / Test / Lint

```bash
# Frontend
cd frontend && npm ci && npm run lint && npm run typecheck && npm run test && npm run build

# Backend
cd backend && uv sync --frozen && uv run ruff check . && uv run mypy . && uv run pytest && uv run alembic upgrade head
```

## Local Dev(僅 localhost)

```bash
# 前提:本機 PostgreSQL + Redis 已啟動,`.env` 已從 `.env.dev.example` 複製並填空
cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000   # backend
cd frontend && npm run dev                                                       # frontend(另一 terminal)
```

> 以上指令**僅供本地開發**(localhost)。部署到 staging / prod 須改用實際 host 連線、實際 secret,且不在本模板規範範圍內。

## Code Style

- **Output**:繁體中文(回應 / 註解 / 文件 / commit)
- **Comments**:不主動加;只在 *why* 非自明時加
- **TS**:`strict: true`、禁 `any`、props 用獨立 `interface`、函式必標型別
- **Python**:PEP 484/585 強制、禁 `Any` / `typing.List` / `typing.Dict`、用 `list[...]` / `dict[...]`、`AsyncSession` from `sqlalchemy.ext.asyncio`
- **Naming**:遵循 `docs/Design-Base/*`

## Testing

- 後端整合測試**禁** mock SQL,須用真實測試 DB
- 第三方:`respx` / `httpx.MockTransport`
- 前端單元:`vitest`(Vite)/ `jest`(Next);e2e:Playwright

## PR Conventions

- Commit:`(AI?) <類型>: <描述>` (繁中);類型 `Add` / `Modify` / `Fix` / `Refactor` / `Docs`
- bug / 規範違反 → 同步 `fixed.md`(`90-code-review.md § 1`)
- `tasks-v*.md` checkbox 與頂部狀態必須一致
- PR self-check:`90-code-review.md § 4`

## Security

- 機密**僅**透過 env var 注入
- `.env` 必 gitignore,`git log --all -- .env` 須為空
- prod 啟動 fail-fast(`Settings.model_validator`)
- 機密**不可**入 log
- 偵測:`scan-project.md` `R-ENV-*` / `R-SEC-*` / `R-PII-*`
