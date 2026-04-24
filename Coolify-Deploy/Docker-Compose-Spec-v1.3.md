# Coolify Docker Compose 配置規範 v1.3

> 本文件為 Coolify 平台部署的 Docker Compose 配置規範，給 AI Agent 與開發者實作 compose 檔時參考。

## v1.3 變更摘要

- 🔧 **Seq 密碼改由後端生成**：`SEQ_FIRSTRUN_ADMINPASSWORD:` 冒號後留空，由後端於部署時產生 10~15 字元隨機密碼寫入 Coolify Env Vars（取代原先的 `$SERVICE_PASSWORD_SEQ`，Coolify 不會展開該 magic env）
- 📖 **使用者登入方式**：部署後到 Coolify UI → Environment Variables 查 `SEQ_FIRSTRUN_ADMINPASSWORD` 的值（`is_secret=true`）
- ✨ **新增 Lint 選配服務雙向校驗**（p1.8）：依 Wizard `selected_services` 校驗 adminer / seq，勾選未生成 / 未勾選卻生成皆擋下

---

## Coolify 核心規則

1. **檔名使用 `docker-compose.yml`**（`.yml`、不要 `.yaml`）
2. **不要定義 `networks` 區塊** — Coolify 會自動管理
3. **不要在 `command` 中使用 `${Variables}`** — 變數放在 `environment` 區塊
4. **不要用 `${VAR:?error}` 語法** — 一律改成 `${VAR}`
5. **Volume 必須命名**（避免資料遺失）
6. **所有敏感資料放在 Coolify 後台 Environment Variables**，不要寫死在 compose 檔
7. **`environment` 一律使用 `key: value` map 語法**，不可用 `- KEY=value` list 語法

---

## 環境變數寫法（非常重要）

本規範**強制使用 map 語法（`key: value`）**，禁用 list 語法（`- KEY=value`）。

### 為什麼

- **與 `SERVICE_URL_*:` 一致** — Coolify 的空值注入只能用 map 形式的冒號後留空
- **避免 `=` 特殊字元陷阱** — 密碼含 `=`、`$`、`#`、空白時 list 語法要額外跳脫
- **避免型別轉型** — YAML map 可用 `"Y"`、`"123"` 明確保留字串

### 寫法規則

```yaml
# ✅ 正確：map 語法
environment:
  NODE_ENV: ${NODE_ENV}
  DATABASE_URL: ${DATABASE_URL}
  SERVICE_URL_BACKEND_3000:     # Coolify 注入值，冒號後留空
  ACCEPT_EULA: "Y"              # 需保留字串時加引號

# ❌ 錯誤：list 語法
environment:
  - NODE_ENV=${NODE_ENV}
```

### 補充

- 同一 service 的 `environment` **不可混用**兩種語法
- 值含 `:`、`#`、前後空白時用雙引號包起來：`REDIS_URL: "redis://:password@redis:6379"`
- Coolify 真正展開的 magic env 僅限 `SERVICE_URL_*` / `SERVICE_FQDN_*` / `SERVICE_PASSWORD_*` / `COMPOSE_PROJECT_NAME`；其他變數（如 `SEQ_FIRSTRUN_ADMINPASSWORD`）請於 Coolify Env Vars 面板填入，compose 寫成冒號後留空即可

---

## SERVICE_URL 環境變數

### 命名格式

`SERVICE_URL_{SERVICE_NAME}_{PORT}` — service name 必須對應 compose 中實際 service 名稱。

### 寫法規則

**冒號後保持空白**，Coolify 會自動填值。手動填值或用 `${}` 引用都會錯。

```yaml
# ✅ 正確
SERVICE_URL_BACKEND_3000:

# ❌ 錯誤
- SERVICE_URL_BACKEND_3000:             # list 語法
SERVICE_URL_BACKEND_3000: http://...    # 自行填值
SERVICE_URL_BACKEND_3000: ${SERVICE_URL_BACKEND_3000}   # ${} 引用
```

### 僅適用 HTTP/HTTPS 服務

| 協定 | SERVICE_URL | 連線方式 |
|------|-----|---------|
| HTTP/HTTPS（frontend、backend、adminer…） | ✅ | `SERVICE_URL_*:` |
| TCP（PostgreSQL、Redis、MySQL、MongoDB…） | ❌ | `DATABASE_URL` / `REDIS_URL` 等專屬變數；內部用 service name 互連（例：`postgres:5432`） |

---

## docker-compose.yml 範例（Frontend + Backend + PostgreSQL + Redis + Adminer + Seq）

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      SERVICE_URL_FRONTEND_80:
      CONTEXT_PATH: ${CONTEXT_PATH}
      VITE_API_URL: ${VITE_API_URL}
    expose:
      - "80"
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      SERVICE_URL_BACKEND_3000:
      NODE_ENV: ${NODE_ENV}
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      JWT_SECRET: ${JWT_SECRET}
      SEQ_INGESTION_URL: http://seq
      APP_NAME: backend
    expose:
      - "3000"
    depends_on:
      - postgres
      - redis
      - seq
    volumes:
      - backend-uploads:/app/uploads

  postgres:
    image: postgres:16-alpine
    # ⚠️ TCP 服務，不加 SERVICE_URL_*
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    expose:
      - "5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/01-init.sql

  redis:
    image: redis:7-alpine
    expose:
      - "6379"
    volumes:
      - redis-data:/data

  adminer:
    image: adminer:4.8.1-standalone
    environment:
      SERVICE_URL_ADMINER_8080:
      ADMINER_DEFAULT_SERVER: postgres
      ADMINER_DEFAULT_DB_DRIVER: pgsql
      ADMINER_DESIGN: pepa-linha
    expose:
      - "8080"
    depends_on:
      - postgres

  seq:
    image: datalust/seq:latest
    restart: unless-stopped
    environment:
      ACCEPT_EULA: "Y"
      SERVICE_URL_SEQ_80:
      SEQ_FIRSTRUN_ADMINUSERNAME: admin
      SEQ_FIRSTRUN_ADMINPASSWORD: ${SEQ_FIRSTRUN_ADMINPASSWORD}
    expose:
      - "80"
    volumes:
      - seq-data:/data

volumes:
  postgres-data:
    name: ${COMPOSE_PROJECT_NAME}-postgres-data
  redis-data:
    name: ${COMPOSE_PROJECT_NAME}-redis-data
  backend-uploads:
    name: ${COMPOSE_PROJECT_NAME}-backend-uploads
  seq-data:
    name: ${COMPOSE_PROJECT_NAME}-seq-data
```

### 最小範例：純前端（Vite）

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      SERVICE_URL_FRONTEND_80:
      CONTEXT_PATH: ${CONTEXT_PATH}
    expose:
      - "80"

volumes: {}
```

---

## Adminer（DB 管理容器）

輕量 DB 管理 Web UI，單檔 PHP 啟動快。透過 Coolify 分配的對外網址瀏覽器直接連線。

### 環境變數

| 變數 | 必填 | 用途 |
| --- | --- | --- |
| `SERVICE_URL_ADMINER_8080:` | ✅ | Coolify 分配對外網址（冒號後留空） |
| `ADMINER_DEFAULT_SERVER` | 建議 | 登入畫面預設 server hostname，填 compose DB service 名（例：`postgres`） |
| `ADMINER_DEFAULT_DB_DRIVER` | 建議 | `pgsql` / `server`（MySQL/MariaDB）/ `sqlite` / `mssql` / `oracle` / `mongo` |
| `ADMINER_DESIGN` | 選配 | UI 主題，建議 `pepa-linha` 或 `hydra` |
| `ADMINER_PLUGINS` | 選配 | 啟用額外 plugins，例如 `tables-filter dump-json` |

### 登入欄位對照

| Adminer 欄位 | 填什麼 |
| --- | --- |
| **System** | PostgreSQL（或對應 DB 類型） |
| **Server** | `postgres`（compose service 名稱，**不是** localhost） |
| **Username** | `${DB_USER}` |
| **Password** | `${DB_PASSWORD}` |
| **Database** | `${DB_NAME}`，可留空登入後再選 |

### 安全要求（⚠️ 非常重要）

Adminer 本身無任何存取限制，知道網址即可嘗試登入。必須遵守：

1. **`POSTGRES_PASSWORD` 絕對不能為空**
2. **正式環境必須加存取限制**：Traefik Basic Auth / IP 白名單，或平時停用 adminer service
3. **Image 綁定版本**，不要用 `adminer:latest` 進正式環境
4. **不要把 SERVICE_URL 貼在文件、README、聊天工具** — 等同洩漏 DB 後門
5. **Adminer 登入密碼 = DB 密碼**，洩漏即 DB 被拿

### 替代工具

| 工具 | Image | 適用場景 |
| --- | --- | --- |
| **Adminer** ✅ 預設 | `adminer:4.8.1-standalone` | 輕量、快速查看 |
| **pgAdmin** | `dpage/pgadmin4` | PostgreSQL 重度使用、ER 圖 / explain plan |
| **DBGate** | `dbgate/dbgate` | 多類型 DB、SQL history |
| **CloudBeaver** | `dbeaver/cloudbeaver` | 企業級多人協作、帳號權限 |

---

## Seq Log 收集（標準監控服務）

集中式 log 查詢工具，為所有專案的必備監控服務。推薦 **應用程式直接 HTTP 推送 CLEF**（透過語言對應的 SDK），不要用 Docker gelf driver + `seq-input-gelf` sidecar 的舊架構。

### 架構

```
應用程式 → SDK（批次 / 重試 / flush）→ POST http://seq/api/events/raw (CLEF) → Seq UI
```

相較舊 gelf 方案：少一個 sidecar、支援結構化欄位（message template + properties）、跨語言一致、無須 `ports` publish UDP。只有在應用程式是黑箱 image 無法改 code 時才退回舊 gelf 方案。

### Seq 關鍵規則

1. **必須設 first-run 管理員密碼（v1.3）**
   compose 寫成 `SEQ_FIRSTRUN_ADMINPASSWORD:`（冒號後留空），本系統後端於部署時**產生 10~15 字元隨機密碼**寫入 Coolify Environment Variables（`is_secret: true`），Coolify 以同名 Env Var 注入 container。`SEQ_FIRSTRUN_ADMINPASSWORD` 即 `datalust/seq` image 預設讀取的變數名，不需 docker-compose interpolation。未設會噴 `No default admin password was supplied` crash。部署後使用者到 Coolify → Environment Variables 查該值登入。密碼只在 volume 初次初始化時寫入，之後改 env 無效（要到 Seq UI 改）。

2. **不要對 Seq 容器設 healthcheck** — `datalust/seq` 鏡像不一定有 `curl` / `wget`，容易永遠失敗卡死。用 `depends_on` 串聯即可。

3. **volume 損壞要砍掉重建** — 多次部署失敗後 `seq-data` 可能殘留半成品，噴 `Failed to initialize storage`。需把 docker-compose 內的 volumes 刪除後 commit 讓 Coolify 處理，再把刪掉的部份補回 commit 再部署。

4. **compose 網路內走 `http://seq`（port 80）** — 對應 `expose: "80"` 與 `SERVICE_URL_SEQ_80:`。SDK 自動 append `/api/events/raw`。

5. **`SEQ_INGESTION_URL` 留空就 fallback console** — logger wrapper 要寫成「沒設此環境變數就只走 `console.log`」，這樣 `npm run dev` / CI 單測都不會嘗試連線。

### 應用程式配合方式

| 語言 / 框架 | 套件 | 掛接方式 |
|-------------|------|---------|
| Node.js / Next.js | [`seq-logging`](https://www.npmjs.com/package/seq-logging) | 自訂 logger wrapper |
| .NET / ASP.NET Core | `Serilog.Sinks.Seq` | Serilog sink |
| Java / Spring Boot | `seq-logback-appender` | `logback-spring.xml` |
| Python / FastAPI / Django | `seqlog` | 標準 `logging` |
| Go | `github.com/nullseed/logruseq` | logrus hook |

通用導入 pattern：

1. 裝 SDK 寫 logger wrapper（讀 `SEQ_INGESTION_URL` / `SEQ_API_KEY` / `APP_NAME`）
2. 沒設 `SEQ_INGESTION_URL` 時 fallback 只印 console
3. 替換程式內 `console.log` / `print` / `logger.info` → wrapper 呼叫
4. 用 **message template**（`"user {UserId} logged in"` + `{ UserId: 123 }`）而非字串拼接
5. 註冊 `SIGTERM` / `SIGINT` / `beforeExit` → 呼叫 SDK 的 `close()` / `flush()`
6. 統一把 `Error` 物件序列化進 CLEF 的 `exception` 欄位

---

## Lint 對選配服務的檢查（本系統專屬）

本系統在三個時機跑 Lint：AI 生成後、使用者編輯後、真部署前。對選配服務（`adminer` / `seq`）一律做**雙向校驗**：Wizard Step 5 的 `selected_services` 為 source of truth，compose 必須完全一致。

### Error（`ok=false`）

| 情境 | 錯誤訊息（摘要） |
| --- | --- |
| 勾選 adminer 但 compose 無 adminer | `selected_services 含 "adminer" 但 compose 未定義 adminer service` |
| 勾選 adminer 但缺 `SERVICE_URL_ADMINER_8080` | `service "adminer": 缺少 SERVICE_URL_ADMINER_8080` |
| 勾選 seq 但 compose 無 seq | `selected_services 含 "seq" 但 compose 未定義 seq service` |
| 勾選 seq 但缺 `SERVICE_URL_SEQ_80` | `service "seq": 缺少 SERVICE_URL_SEQ_80` |
| 勾選 seq 但缺 `ACCEPT_EULA` | `service "seq": 必須設定 ACCEPT_EULA: "Y"` |
| 勾選 seq 但缺 `SEQ_FIRSTRUN_ADMINPASSWORD` | `service "seq": 必須設定 SEQ_FIRSTRUN_ADMINPASSWORD` |
| 未勾選 adminer 但 compose 有 adminer | `compose 定義了 adminer service，但 selected_services 未勾選` |
| 未勾選 seq 但 compose 有 seq | `compose 定義了 seq service，但 selected_services 未勾選` |

### Warning（僅提示）

| 情境 | 警告訊息 |
| --- | --- |
| adminer 缺 `ADMINER_DEFAULT_SERVER` | 建議設定，登入畫面預設 server |
| adminer 缺 `ADMINER_DEFAULT_DB_DRIVER` | 建議設定，例如 `pgsql` |
| seq 缺 `SEQ_FIRSTRUN_ADMINUSERNAME` | 建議設定，預設 `admin` |

### 反向檢查為什麼是 error

Wizard 勾選連動「Application 管理頁服務清單」、「SSO 白名單」、「成本估算」。若容忍「compose 有、勾選沒有」會讓 UI 與實際部署脫鉤；更嚴重的是 adminer 可能在管理員不知情下暴露 DB 管理介面（安全事件）。因此反向檢查亦為 error，不降為 warning。

規則僅針對選配服務（`adminer` / `seq`）；**app-level service**（frontend / backend / 業務 container）不受反向規則限制。

---

## 部署流程與驗證

1. 推送程式碼到 Git → Coolify 自動部署
2. 檢查 Deployment Log / Application Log
3. 實際操作網站驗證功能
4. 進 Adminer 的 SERVICE_URL 用 DB 帳密確認連線
5. 進 Seq 的 SERVICE_URL 用管理員帳密確認 log 收集
6. 確認 `DATABASE_URL` 指向正確 DB

正式環境切換：Coolify 後台設 `DATABASE_URL`（指向 RDS 等）、`NODE_ENV=production`；Adminer 若保留必須加 Basic Auth / IP 白名單或停用；Seq 建議保留用於線上排查，務必設 API Key 保護 ingestion 端點。

---

## 常見問題排查

| 問題 | 原因 | 解法 |
|------|------|------|
| 服務間無法通訊 | 定義了 networks | 移除 networks 區塊 |
| 環境變數無效 | 使用了 `:?` 語法 | 改用 `${VAR}` |
| `environment` parse error / 變數未帶入 | 用了 `- KEY=value` | 改成 map 語法 |
| SERVICE_URL 無值 | 冒號後填了內容 | 冒號後保持空白 |
| DB / Redis 加 SERVICE_URL 無效 | TCP 服務不支援 | 不要填寫 |
| 資料遺失 | Volume 未命名 | 使用命名 Volume |
| 網站無法存取 | 沒設 expose port | 加 `expose` |
| Adminer 登入 `could not translate host name "localhost"` | Server 欄位填 localhost | 改填 DB service 名（如 `postgres`） |
| Adminer `password authentication failed` | 密碼不一致 | 確認 Coolify 的 `DB_PASSWORD` 和登入值一致 |
| Adminer 打不開 404 | `SERVICE_URL_ADMINER_8080:` 沒寫或冒號後有值 | 冒號後保持空白 |
| Seq crash `No default admin password` | 沒設密碼 | `SEQ_FIRSTRUN_ADMINPASSWORD:` 冒號後留空，後端自動注入 |
| Seq `Failed to initialize storage` | volume 殘留損壞資料 | 砍掉 `seq-data` volume 重建（Seq 規則第 3 點） |
| log 沒進 Seq | `SEQ_INGESTION_URL` 未設或填錯 | 填 `http://seq`（不加 port 或路徑） |

---

## 檔案儲存規範

1. **不要把 binary 檔案存進 DB** — 會造成 DB 肥大、備份/還原失敗
2. Binary 一律以檔案方式儲存
3. **優先使用 S3**，移機時不需處理檔案搬遷
4. 若暫用本地儲存，必須掛載命名 Volume
