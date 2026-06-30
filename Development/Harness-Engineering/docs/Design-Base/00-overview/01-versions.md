# 01-versions — 版本鎖定 + 套件清單

> **何時讀**:加套件 / 升版 / 啟動新專案。本檔說明**版本鎖定政策 + 套件清單**;禁裝 / 使用規則對應 `02-frontend` / `03-backend` / `04-databases` / `90-third-party-service`。
>
> **數字的唯一真相來源是 scaffold manifest**:`Skills/init-project/scaffold/manifest.json`(Express 路線為 `Skills/init-project-express/scaffold/manifest.json`)。本檔的版本數字是給人看的鏡像,**與 manifest 衝突時以 manifest + lock file 為準**,並立即回補本檔。改版本請改 manifest,template 內以 `{{var}}` 引用。

---

## 強制鎖定(硬底線)

| 項目 | 鎖定線 | lock 範例 |
| --- | --- | --- |
| React | **`19.2.x`** | `19.2.0` |
| Next.js *(Next 路線)* | **`16.2.x`** | `16.2.7` |
| Python | **`3.14.x`** | `3.14.1` |
| Node.js | 24.x LTS | `24.0.0` |
| PostgreSQL | 18.x | `18` |

採用方專案**禁**自行降版;跨 minor 由本檔 + manifest 發動,採用方追隨。Python 3.14 下 `passlib 1.7.4` 走 bcrypt path,接受 `crypt` 模組告警風險。

---

## 鎖定原則

- **禁**浮動版本(`^` / `~` / `*` / `latest` / `>=`),一律 `MAJOR.MINOR.PATCH`
- `engines.node` / `requires-python` 同樣鎖到 patch
- 服務版本於 `.env` 用 `<SERVICE>_VERSION` 變數,`docker-compose.yml` 用 `${POSTGRES_VERSION}` 引用,**禁**直寫 image tag
- 升版**獨立 commit**:`(AI?) Modify: 升級 <套件> 從 <舊> 至 <新>(<理由>)`,同 commit 含 manifest + 本表 + lock file +(若涉)`.env`

---

## Frontend 套件(`frontend/package.json`)

> 數字鏡像自 `init-project/scaffold/manifest.json` 的 `versions.frontend`。

| 套件 | 鎖定線 | lock 範例 |
| --- | --- | --- |
| `react` / `react-dom` | 19.2.x | `19.2.0` |
| `@types/react` / `@types/react-dom` | 19.1.x | `19.1.6` / `19.1.5` |
| `next` *(Next 路線,預設)* | 16.2.x | `16.2.7` |
| `eslint-config-next` *(Next 路線)* | 16.2.x | `16.2.7` |
| `typescript` | 5.9.x | `5.9.3` |
| `@types/node` | 24.x | `24.0.0` |
| `vite` *(Vite 路線)* | 6.x | `6.0.7` |
| `@vitejs/plugin-react` *(Vite 路線)* | 4.x | `4.3.4` |
| `@reduxjs/toolkit` | 2.x | `2.11.2` |
| `react-redux` | 9.x | `9.2.0` |
| `tailwindcss` + 對應 plugin | 4.x | `4.2.4`(`tailwindcss` 與 plugin 版本必相等)|
| `postcss` | 8.x | `8.5.12` |
| `vitest` | 2.x | `2.1.9` |
| `eslint` | 9.x | `9.39.4` |
| `typescript-eslint` | 8.x | `8.62.0` |

> Tailwind plugin:Vite 路線用 `@tailwindcss/vite`,Next 路線用 `@tailwindcss/postcss`。i18n / 日期套件視專案需要,加入時補進 manifest 與本表。

---

## Backend 套件(`backend/pyproject.toml`)

> 數字鏡像自 `init-project/scaffold/manifest.json` 的 `versions.backend`(FastAPI 路線)。Express 路線的後端套件見 `init-project-express/scaffold/manifest.json`。

| 套件 | 鎖定線 | lock 範例 |
| --- | --- | --- |
| Python | 3.14.x | `3.14.1`(`requires-python = "==3.14.*"`)|
| `fastapi` | 0.136.x | `0.136.1` |
| `uvicorn[standard]` | 0.46.x | `0.46.0` |
| `pydantic` / `pydantic-settings` | 2.13.x / 2.14.x | `2.13.3` / `2.14.0` |
| `sqlalchemy` | 2.0.x | `2.0.49` |
| `asyncpg` | 0.31.x | `0.31.0` |
| `alembic` | 1.14.x | `1.14.0` |
| `pyjwt[crypto]` | 2.x | `2.10.1` |
| `passlib[bcrypt]` | 1.7.x | `1.7.4` |
| `python-multipart` | 0.0.x | `0.0.20` |
| `httpx` | 0.28.x | `0.28.1` |
| `pytest` | 8.x | `8.4.2` |
| `ruff` / `mypy` | 0.15.x / 2.1.x | `0.15.20` / `2.1.0` |
| `pip-audit` | 2.x | `2.8.0` |
| `uv`(唯一 package manager / build 工具) | 0.11.x | `0.11.25` |

> Log 套件(`loguru` 或 stdlib `logging`)二擇一,加入時補進 manifest 與本表;細節見 `03-backend/05-exceptions-and-logging.md`。

---

## Sources of Truth

優先序:**scaffold manifest.json > lock file / `.env` > 本檔**。

- `Skills/init-project/scaffold/manifest.json`(FastAPI 路線)/ `Skills/init-project-express/scaffold/manifest.json`(Express 路線)— 機器可讀、唯一權威數字來源
- `frontend/package-lock.json`(或 `pnpm-lock.yaml`)
- `backend/uv.lock`
- `.env` 的 `<SERVICE>_VERSION`(例 `POSTGRES_VERSION=18`)

任何不一致:**以 manifest / lock / `.env` 為準**,立即修本表。

---

## 升版流程

1. 升版理由(security / bug / 需求);**禁**「順手升一下」
2. 改 manifest.json 對應數字(template 以 `{{var}}` 引用,不直寫)
3. 獨立 commit + 同 commit 含:manifest + 本表 + lock file +(若涉)`.env*` / `docker-compose.yml`
4. 跨 major(React 19→20 / SQLAlchemy 2→3 / Python 3.14→3.15 / Next 16→17)→ 先寫 `docs/Tasks/v*/propose-v*.md` 評估 breaking,**禁**單一 commit 帶過
