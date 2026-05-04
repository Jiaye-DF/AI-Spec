# 00-overview — 總覽 / 共通底線

跨專案最頂層規則,鎖定 **React + FastAPI**,本地開發優先。

---

## 1. 版本鎖定

**禁止**任何浮動版本(`^` / `~` / `*` / `latest` / `>=`)。一律鎖到 `MAJOR.MINOR.PATCH`。

- npm:`"react": "19.2.5"` ✅ / `"^19.0.0"` ❌
- pyproject:`"fastapi==0.136.1"` ✅ / `">=0.135"` ❌
- `engines.node` / `requires-python` 同樣鎖到 patch
- 本地服務版本於 `.env` 用 `POSTGRES_VERSION` / `REDIS_VERSION` 變數明示
- 升版獨立 commit:`Modify: 升級 <套件> 至 <版本>(理由)`,同 commit 含表格 + lock file +(若涉)`.env`

### Sources of Truth

`docs/Design-Base/00-overview/` 版本表格與 lock file **逐字一致**:`frontend/package-lock.json` + `backend/uv.lock` + `.env`(`POSTGRES_VERSION` / `REDIS_VERSION`)。不一致時以 lock 為準,立即修規範表。

---

## 2. 敏感資訊

- 機密(token / password / connection string / API key)**僅**透過 env(`Settings(BaseSettings)` 讀取)
- `.gitignore` 必排 `.env`、`credentials*`、`*.key`、`*.pem`
- `.env` **不可**曾被 commit(`git log --all -- .env` 須為空);若曾 commit → 全 key rotate
- 機密**禁**寫進程式碼字面值
- prod 啟動須 fail-fast(見 `20-backend.md § 啟動 fail-fast`)

---

## 3. API 文件路徑

FastAPI **必須**:`docs_url="/api/docs"`、`redoc_url=None`。**禁用**:`/swagger`、`/docs`、`/openapi`。新增/修改 API 時同步 Pydantic schema。

---

## 4. 時區

- 後端 / PostgreSQL / log 一律 **UTC+8 / Asia/Taipei**(專案可調但須**全棧一致**)
- DB schema TIMESTAMP 寫入規則須與顯示層轉換策略對齊(見 `30-database.md § 時區`)
- 取系統時間直接 `date "+%Y-%m-%d %H:%M:%S"`;**禁** `TZ=Asia/Taipei date`(雙轉換)

---

## 5. 環境分層(localhost vs 部署)

- 至少 dev / staging / prod 三層,**各自**有 `.env.{dev,staging,prod}.example`
- **dev = localhost**:`uvicorn` + frontend dev server;PostgreSQL / Redis 由開發者於本機 install;連線指向 `localhost:*`
- **staging / prod = 實際部署環境**:連線指向真實 host(例:`db.example.com`、AWS RDS endpoint 等);**禁止**用 `localhost`;部署平台 / 容器化 / CI/CD 由各專案自決
- frontend / backend 為**獨立 service**,各自 `.env*.example`;前後端透過 HTTP 通訊
- **禁混用**:`.env.dev` 直接拿去部署會連不到 DB(localhost 不存在於遠端 host),且 secret 為 dev 預設值會觸發 prod fail-fast

| | dev | staging / prod |
| --- | --- | --- |
| `.env` 檔 | `.env.dev`(從 `.env.dev.example`) | `.env.staging` / `.env.prod`(從對應 example) |
| `DATABASE_URL` | `postgresql+asyncpg://...@localhost:5432/...` | `postgresql+asyncpg://...@<real-host>:5432/...` |
| `REDIS_URL` | `redis://localhost:6379/0` | `redis://<real-host>:6379/0` |
| `JWT_SECRET_KEY` | dev 預設值(可) | **必**改 32+ 字元隨機(否則 prod fail-fast) |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | `["https://<frontend-domain>"]` |
- Template 僅保證程式骨架可被部署;具體部署設定不在規範範圍
