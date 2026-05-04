# CLAUDE.md

Claude Code 在 **React + FastAPI + PostgreSQL** 專案的共通規則,**本地開發優先**。專案特定規範見 `docs/Design-Base/`。

## 核心原則

- **輸出語言**:繁體中文(回應 / 註解 / 文件 / commit message 全部)
- 簡潔:不主動建檔、不過度抽象、不預先設計未存在需求
- 不主動加註解(只在 *why* 從程式碼難推斷時加)
- 遵循既有風格,不擅自重構無關區塊
- 時區:**UTC+8 (Asia/Taipei)**;`date "+%Y-%m-%d %H:%M:%S"`;**禁** `TZ=Asia/Taipei date`
- **本地開發優先**:`uvicorn` + frontend dev server;PostgreSQL / Redis 本機 install

## localhost ≠ 部署環境

兩者完全不同,**禁混用**:

| | localhost(本地開發) | staging / prod(部署) |
| --- | --- | --- |
| `.env` | `.env.dev`(連 `localhost:5432` / `localhost:6379`) | `.env.staging` / `.env.prod`(連實際 host,例 `db.example.com`) |
| 啟動方式 | `uv run uvicorn` + `npm run dev` | 由部署平台啟動(本模板**不規範**部署細節) |
| 適用場景 | 開發者本機測試 | 提供給使用者 / QA / production |

`.env.dev` 出現的 `localhost:*` 是**本地開發專用**;部署時必須改為實際 host。**禁止**直接把 `.env.dev` 拿去部署 — 會連不到 DB,且機密為 dev 預設值會觸發 fail-fast。

## 鎖定技術棧

- **前端**:React 19 + TS + (Vite | Next.js) + Redux Toolkit + RTK Query + Tailwind v4
- **後端**:Python + FastAPI + SQLAlchemy 2 async + Pydantic 2 + Alembic + uv
- **資料庫**:PostgreSQL + Redis(asyncpg + redis-py async)

不同技術棧 → 用其他 template,本模板**不適用**。

## 任務前必讀

依任務性質載入 `docs/Design-Base/<area>/` 下**所有** `*.md`;跨領域任務同時載入多個目錄。規則衝突依〈規範優先順序〉判定。任務中規範被推翻 → commit / task doc 註明,並提醒使用者更新規範檔。

## 開發前檢查

1. `.env.example` 存在;`.env` 存在(若無提示使用者從 `.env.example` 複製)
2. `.env.example` 所有 key 已於 `.env` 填值;缺漏列出後暫停
3. 程式碼用的 env 都已登記於 `.env.example`;缺漏提醒同步
4. 本機 PostgreSQL + Redis 服務已啟動(預設 port `5432` / `6379`)

## 敏感資訊

- 機密(token / 密碼 / 連線字串 / API key)**僅**透過 env var 注入
- `.gitignore` 必排 `.env`、`credentials*`、`*.key`、`*.pem`
- 發現疑似機密入 commit → 立即提醒使用者

## 後端 API 文件

FastAPI **必須** `docs_url="/api/docs"`、`redoc_url=None`。**禁用**:`/swagger`、`/docs`、`/openapi`。新增 / 修改 API 須同步 Pydantic Request / Response schema 與欄位 description。

## 任務文件回填

`docs/Tasks/.../tasks-v*.md` 是實作前規格,完成後**必須**回填:

- 已完成 → `[ ]` 改 `[x]`
- 規格被改 → 保留 checkbox + `—（已改為 xxx,見 commit yyy）`
- 全版本完成 → 頂部加 `> **狀態:已完成（commit xxx, YYYY-MM-DD）**`
- 部分完成 → 頂部 `進行中（已完成 Phase N, 剩 ...）`

commit 是事件流水,task doc 是階段真相,兩者皆維護。

## Git 工作流程

- 主分支 `main`,功能分支從 `main` 切出
- Commit message 繁體中文 `<類型>: <描述>`,類型 `Add | Modify | Fix | Refactor | Docs`
- AI 產生的 commit **必**前綴 `(AI)`,例 `(AI) Add: 新增使用者管理功能`
- 未經明示授權,**禁**破壞性操作(`--force` / `reset --hard` / `--no-verify`)

## 規範優先順序

`docs/Design-Base/*` > `docs/Arch/*` > 本檔案 > `docs/Tasks/*`

- `docs/Design-Base/`:實作規範(程式碼風格、DB / API 規範)— 底線
- `docs/Arch/`:長期架構方向
- `docs/Tasks/`:單版本構想 / 清單,可隨版本調整
