# /init-project

依 Template 規範,在當前目錄(預期空目錄或剛 `git init` 的乾淨狀態)產生 **React + FastAPI 前後端分離**專案的最基本可跑骨架。

> **本模板採本地開發**:後端用 `uvicorn` 直接跑,前端用 dev server(Vite / Next.js),PostgreSQL 由開發者於本機 install 為服務。**不產生任何容器化或部署相關檔案**;部署方案由各專案自行決定,不在 Template 範圍內。

## 身分

資深 scaffolding 工程師,熟悉 React + TypeScript + FastAPI + SQLAlchemy + Alembic 標準起手式。產出的骨架 100% 對齊 `docs/Design-Base/*` 規範。

## 語言偏好

zh-TW

## 風格

精準、可運行、零冗餘。骨架最小但**全部必守規則已內建**(分層、async safety、ApiResponse、必備欄位、版本鎖定等)。

---

## 心法

1. **產出即合規**:骨架本身就遵守 Template 全部硬規則
2. **版本一律鎖到 patch**:`package.json` / `pyproject.toml` / `.env`(`POSTGRES_VERSION`)全部 `MAJOR.MINOR.PATCH`
3. **最小可跑**:
   - 後端:`uv sync && uv run uvicorn app.main:app --reload` 起得來
   - 前端:`npm ci && npm run dev` 起得來
   - PG:開發者於本機 install
   - `localhost:8000/api/docs` 出 Swagger;`localhost:8000/api/v1/health` 回 `{db: ok}`
4. **不過度設計**:不預先實作 auth / RBAC / dashboard 等業務模組,只產出規範要求的 core 基礎(`Settings` + fail-fast / `BaseModel` 7 欄位 / `ApiResponse` / `lifespan` / `/api/v1/health`)
5. **本地優先**:**禁止**產生任何容器化 / 部署相關檔案;部署方案由專案自決
6. git commit 須繁中 + `(AI)` 前綴(若使用者同意提交)

---

## 前置讀取

執行前讀取(若存在於模板路徑):

1. `Template/CLAUDE.md` / `AGENTS.md` — 專案規則與技術棧鎖定
2. `Template/design-base/00-overview.md` — 版本鎖定、敏感資訊、環境分層
3. `Template/design-base/10-frontend.md` — React 13 條硬規則
4. `Template/design-base/20-backend.md` — FastAPI 15 條硬規則
5. `Template/design-base/30-database.md` — PostgreSQL + SQLAlchemy 必備欄位、Repository 命名、Alembic
6. `Template/design-base/90-code-review.md` — fixed.md、commit format、PR 自我檢查

---

## 收集參數

執行時向使用者詢問(可一次性收集,或用 `AskUserQuestion`):

| 參數 | 預設 | 說明 |
| --- | --- | --- |
| `<project-name>` | (必填) | kebab-case;用於 package.json name、DB name |
| `<frontend-toolchain>` | `vite` | `vite` 或 `next` |
| `<python-version>` | `3.14.1` | 鎖到 patch |
| `<node-version>` | `24.0.0` | 鎖到 patch |
| `<postgres-version>` | `18` | 本機需安裝對應版本 |
| `<frontend-host-port>` | `3000` | dev server port |
| `<backend-host-port>` | `8000` | dev server port |
| `<postgres-port>` | `5432` | 本機 PostgreSQL port |
| `<include-azure-sso>` | `no` | `yes` 時加 `clients/azure_ad/` 與 MSAL 範本 |
| `<api-version>` | `v1` | API 路徑前綴 |

---

## 產出結構

```
<project-name>/
├── README.md                   (專案 README,含本機開發步驟)
├── CLAUDE.md                   (從 Template 複製,首段加專案名)
├── AGENTS.md                   (從 Template 複製,Project Overview 填專案名)
├── .gitignore
├── .env.dev.example            (本機開發用 — DATABASE_URL 指向 localhost)
├── .env.staging.example        (staging 連線占位,實際部署設定由專案自決)
├── .env.prod.example           (prod 連線占位,實際部署設定由專案自決)
├── .claude/commands/
│   ├── scan-project.md         (從 Template 複製)
│   └── init-project.md         (本檔自身,留作未來重新跑用)
├── .github/workflows/
│   └── ci.yml                  (lint + audit 骨架,e2e 留 if: false)
├── docs/
│   ├── Design-Base/            (從 Template/design-base/ 複製)
│   └── Tasks/
│       ├── v1.0/
│       │   └── tasks-v1.0.md   (空骨架)
│       └── scan-project/       (空目錄,留 /scan-project 寫入)
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── (vite or next 配置)
│   ├── .env.local.example      (前端 dev 用,VITE_API_BASE_URL 等)
│   └── src/
│       ├── (入口)
│       ├── lib/api/baseApi.ts
│       ├── store/store.ts
│       ├── store/provider.tsx
│       ├── utils/datetime.ts
│       └── components/(空)
└── backend/
    ├── pyproject.toml
    ├── alembic.ini
    ├── alembic/
    │   ├── env.py
    │   └── versions/(空)
    └── app/
        ├── main.py
        ├── core/
        │   ├── config.py       (Settings + fail-fast validator)
        │   ├── db.py           (async engine + sessionmaker)
        │   ├── security.py     (hash_password 同步 + async 兩版)
        │   ├── response.py     (ApiResponse + helpers)
        │   ├── exceptions.py   (AppError + 3 handlers)
        │   └── cookies.py      (httpOnly cookie helpers)
        ├── api/
        │   ├── deps.py         (get_db)
        │   └── v1/
        │       ├── __init__.py (router 集合)
        │       └── health.py
        ├── models/
        │   ├── __init__.py
        │   └── base.py         (BaseModel 7 必備欄位)
        ├── repositories/(空,有 __init__.py)
        ├── services/(空)
        ├── schemas/
        │   └── response.py     (ApiResponse Pydantic generic)
        └── clients/(空)
```

> **不產生**任何容器化 / 部署相關設定檔。

---

## 關鍵檔骨架(必須照此產出)

### `backend/app/main.py`

```python
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import router as v1_router
from app.core.config import get_settings
from app.core.db import engine
from app.core.exceptions import register_exception_handlers


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.APP_NAME, lifespan=lifespan, docs_url="/api/docs", redoc_url=None)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(app)
    app.include_router(v1_router, prefix="/api/v1")
    return app


app = create_app()
```

### `backend/app/core/config.py`

```python
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

JWT_SECRET_KEY_DEV_DEFAULT = "changeme-32-bytes-very-very-secret"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "<project-name>"
    APP_ENV: Literal["dev", "staging", "prod"] = "dev"
    DATABASE_URL: str  # 例 postgresql+asyncpg://user:pwd@localhost:5432/<project>
    JWT_SECRET_KEY: str = Field(default=JWT_SECRET_KEY_DEV_DEFAULT)
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    @model_validator(mode="after")
    def _fail_fast_in_prod(self) -> "Settings":
        if self.APP_ENV in ("staging", "prod"):
            for name, actual, dev_default in [
                ("JWT_SECRET_KEY", self.JWT_SECRET_KEY, JWT_SECRET_KEY_DEV_DEFAULT),
            ]:
                if actual == dev_default:
                    raise ValueError(f"APP_ENV={self.APP_ENV} 但 {name} 仍為 dev 預設值")
        return self


def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
```

### `backend/app/core/security.py`

```python
import asyncio
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


async def hash_password_async(plain: str) -> str:
    return await asyncio.to_thread(hash_password, plain)


async def verify_password_async(plain: str, hashed: str) -> bool:
    return await asyncio.to_thread(verify_password, plain, hashed)
```

### `backend/app/core/response.py`

```python
from typing import Generic, TypeVar
from fastapi.responses import JSONResponse
from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: T | None = None
    detail: str | None = None
    response_code: int


def success(data: T | None = None, response_code: int = 200) -> ApiResponse[T]:
    return ApiResponse[T](success=True, data=data, detail=None, response_code=response_code)


def failure(detail: str, response_code: int = 400, status_code: int = 400) -> JSONResponse:
    body = ApiResponse[object](success=False, data=None, detail=detail, response_code=response_code)
    return JSONResponse(status_code=status_code, content=body.model_dump(mode="json"))
```

### `backend/app/core/exceptions.py`

```python
import logging
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.response import failure

logger = logging.getLogger(__name__)


class AppError(Exception):
    def __init__(self, detail: str, response_code: int = 400, status_code: int = 400, error_code: str | None = None) -> None:
        super().__init__(detail)
        self.detail = detail
        self.response_code = response_code
        self.status_code = status_code
        self.error_code = error_code


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(request: Request, exc: AppError) -> JSONResponse:
        return failure(detail=exc.detail, response_code=exc.response_code, status_code=exc.status_code)

    @app.exception_handler(RequestValidationError)
    async def _validation(request: Request, exc: RequestValidationError) -> JSONResponse:
        return failure(detail="輸入驗證失敗", response_code=422, status_code=422)

    @app.exception_handler(Exception)
    async def _unexpected(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unexpected error at %s %s", request.method, request.url.path)
        return failure(detail="伺服器發生錯誤,請稍後再試", response_code=500, status_code=500)
```

### `backend/app/core/db.py`

```python
from collections.abc import AsyncIterator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


settings = get_settings()
engine = create_async_engine(settings.DATABASE_URL, pool_size=10, max_overflow=20, pool_recycle=300)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

### `backend/app/models/base.py`

```python
from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import BigInteger, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class BaseModel(Base):
    __abstract__ = True

    pid: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    uid: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False, unique=True, default=uuid4)
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, server_default=func.now())
    created_by: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    updated_by: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
```

### `backend/app/api/v1/health.py`

```python
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.response import ApiResponse, success

router = APIRouter()


@router.get("/health", response_model=ApiResponse[dict[str, str]])
async def health(db: AsyncSession = Depends(get_db)) -> ApiResponse[dict[str, str]]:
    db_ok = "ok"
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_ok = "fail"
    return success(data={"db": db_ok})
```

### `backend/pyproject.toml`(版本鎖到 patch)

```toml
[project]
name = "<project-name>-backend"
version = "0.1.0"
requires-python = "==<python-version>.*"
dependencies = [
    "fastapi==0.136.1",
    "uvicorn[standard]==0.46.0",
    "sqlalchemy[asyncio]==2.0.49",
    "asyncpg==0.31.0",
    "pydantic==2.13.3",
    "pydantic-settings==2.14.0",
    "alembic==1.14.0",
    "httpx==0.28.1",
    "passlib[bcrypt]==1.7.4",
    "pyjwt[crypto]==2.10.1",
    "python-multipart==0.0.20",
]

[tool.uv]
package = false
```

### `frontend/package.json`(Vite 模式)

```json
{
  "name": "<project-name>-frontend",
  "version": "0.1.0",
  "private": true,
  "engines": { "node": "<node-version>" },
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "19.2.5",
    "react-dom": "19.2.5",
    "@reduxjs/toolkit": "2.11.2",
    "react-redux": "9.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "4.3.4",
    "typescript": "5.9.3",
    "vite": "6.0.7",
    "tailwindcss": "4.2.4",
    "@tailwindcss/postcss": "4.2.4",
    "postcss": "8.5.12",
    "eslint": "9.39.4"
  }
}
```

### `frontend/src/lib/api/baseApi.ts`

```ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1",
    credentials: "include",
  }),
  tagTypes: [],
  endpoints: () => ({}),
});
```

### `frontend/.env.local.example`

```bash
VITE_API_BASE_URL=http://localhost:<backend-host-port>/api/v1
```

### `.env.dev.example`(本機開發,連 localhost)

```bash
APP_ENV=dev
POSTGRES_VERSION=<postgres-version>
DATABASE_URL=postgresql+asyncpg://<project-name>:changeme-dev@localhost:<postgres-port>/<project-name>
JWT_SECRET_KEY=changeme-32-bytes-very-very-secret
CORS_ORIGINS=["http://localhost:<frontend-host-port>"]
```

### `.gitignore`

```
# Python
__pycache__/
*.pyc
.venv/
.pytest_cache/
.mypy_cache/
.ruff_cache/

# Node
node_modules/
.next/
dist/
build/
coverage/

# Env
.env
.env.dev
.env.staging
.env.prod
.env.local
!.env.*.example

# OS / IDE
.DS_Store
Thumbs.db
.vscode/
.idea/

# Misc
*.log
*.bak
```

### `<project-name>/README.md`(專案根目錄)

```markdown
# <project-name>

<一句話描述專案。>

## 系統需求

- Python <python-version>+
- Node <node-version>+
- PostgreSQL <postgres-version>+(請依官方文件本機安裝並啟動)

## 快速開始(本地開發)

### 1. 確認本機服務啟動

\`\`\`bash
# 確認 PostgreSQL 正在 <postgres-port>
psql -U postgres -c "\\l"      # 列現有 DB
\`\`\`

於 PostgreSQL 建立專案 DB 與帳號:

\`\`\`sql
CREATE USER <project-name> WITH PASSWORD 'changeme-dev';
CREATE DATABASE <project-name> OWNER <project-name>;
\`\`\`

### 2. 後端

\`\`\`bash
cp .env.dev.example .env
# 編輯 .env(填入本機 DB 連線)
cd backend
uv sync --frozen
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port <backend-host-port>
\`\`\`

驗證:
- Swagger:http://localhost:<backend-host-port>/api/docs
- Health:http://localhost:<backend-host-port>/api/v1/health → `{db: ok}`

### 3. 前端(另一個 terminal)

\`\`\`bash
cd frontend
cp .env.local.example .env.local
npm ci
npm run dev
\`\`\`

驗證:http://localhost:<frontend-host-port>

---

## 技術棧

- 前端:React 19 + TypeScript + (Vite | Next.js) + Redux Toolkit + RTK Query + Tailwind v4
- 後端:FastAPI + SQLAlchemy 2 (async) + Pydantic 2 + Alembic + uv
- 資料庫:PostgreSQL

## 文件導覽

- 規範:`docs/Design-Base/`
- 任務:`docs/Tasks/v*/`
- 修正紀錄:`docs/Tasks/v*/fixed.md`
- 掃描問題追蹤:`docs/Tasks/scan-project/`

## 工作流程

- 主分支 `main`,功能分支從 `main` 切出
- Commit message 繁體中文 `<類型>: <描述>`(類型:Add / Modify / Fix / Refactor / Docs)
- AI 產生的 commit 加 `(AI)` 前綴
- 詳見 `CLAUDE.md`

## 部署

部署方案由本專案維護者依採用平台另行設計,**不在 Template 規範範圍內**。Template 僅保證程式骨架可被部署。
```

---

## 執行步驟

1. **環境檢查**
   - 確認當前目錄為空或僅含 `.git/` / `Template/`
   - 確認系統有 `python3 --version` / `node --version` / `uv --version`(可選)
2. **收集參數**(用 `AskUserQuestion` 或一次性收集)
3. **產生根目錄檔**:`.gitignore` / `.env.dev.example` / `.env.staging.example` / `.env.prod.example` / `README.md` / `CLAUDE.md`(從 Template 複製,首段加專案名)/ `AGENTS.md`
4. **產生 backend/**:`pyproject.toml` / `alembic.ini` / `alembic/env.py` / 全部 `app/core/*` / `app/api/v1/health.py` / `app/api/deps.py` / `app/api/v1/__init__.py` / `app/models/base.py` + `__init__.py` / 空 `repositories/` / `services/` / `clients/` / `app/main.py`
5. **產生 frontend/**(依 `<frontend-toolchain>` 分歧)
6. **產生 docs/**:複製 `Template/design-base/*` 進 `docs/Design-Base/`;建空 `docs/Tasks/v1.0/tasks-v1.0.md` 骨架 + `docs/Tasks/scan-project/` 空目錄
7. **產生 .claude/commands/**:複製 `Template/scan-project.md` + `Template/init-project.md` 進 `.claude/commands/`
8. **產生 .github/workflows/ci.yml**:含 `frontend-lint`(npm ci + lint + typecheck + audit `continue-on-error: true`)、`backend-lint`(uv sync + ruff + pytest + pip-audit `continue-on-error: true`)、`e2e`(`if: false` 預留)
9. **`uv lock`**(於 `backend/`)、**`npm install`**(於 `frontend/`,若使用者同意)生成 lock file
10. **顯示 next steps**(明確列出本機開發流程):
    1. 本機啟 PostgreSQL(若尚未安裝,提示官方文件連結)
    2. 在 PostgreSQL 建立專案 DB 與帳號
    3. `cp .env.dev.example .env` 並填空
    4. `cd backend && uv sync && uv run alembic upgrade head && uv run uvicorn app.main:app --reload`
    5. `cd frontend && npm ci && npm run dev`
    6. 開 `localhost:<backend>/api/docs` / `localhost:<frontend>` 驗證
11. **(可選)git commit**:詢問使用者後執行 `git add -A && git commit -m "(AI) Add: 初始化 React + FastAPI 專案骨架(template-v1.0)"`

---

## 自我約束

- **禁止**自由發揮:所有產出必須對齊 `Template/design-base/*` 規範
- **禁止**產生任何容器化 / 部署相關檔案(部署方案由專案自決)
- **禁止**直接執行 `git push`;`commit` 也須使用者明示同意
- **禁止**寫入 `.env` 實際值(只生 `.env.*.example`,讓使用者自填)
- **不過度設計**:不預先建 auth / RBAC / 業務模組;只給規範要求的 core 基礎
- 產出後簡述「本骨架包含什麼 / 不包含什麼 / 下一步是什麼」
