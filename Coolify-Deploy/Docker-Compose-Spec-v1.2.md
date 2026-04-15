# Coolify Docker Compose 配置規範 v1.2

> 本文件為 Coolify 平台部署的 Docker Compose 配置規範，給 AI Agent 與開發者實作 compose 檔時參考。
>
> **v1.2 更新**：Adminer 從「選配」提升為**標準服務**，正式列入 compose 範例。可從 Coolify 直接分配對外網址，瀏覽器連線即可檢視 / 操作 DB，不需 SSH 或 port forward。

---

## v1.2 變更摘要

- ✨ **Adminer 納入標準**：取消註解，成為預設包含的服務
- 📝 **新增 Adminer 完整操作章節**：包含 Coolify 存取步驟、登入欄位對照、安全要求
- 🔄 **替代工具對照表**：Adminer / pgAdmin / DBGate / CloudBeaver

---

## Coolify 核心規則

1. **檔名使用 `docker-compose.yml`**（`.yml`、不要 `.yaml`）
2. **不要定義 `networks` 區塊** — Coolify 會自動管理
3. **不要在 `command` 中使用 `${Variables}`** — 變數放在 `environment` 區塊
4. **不要用 `${VAR:?error}` 語法** — 一律改成 `${VAR}`
5. **Volume 必須命名**（避免資料遺失）
6. **所有敏感資料放在 Coolify 後台 Environment Variables**，不要寫死在 compose 檔

---

## SERVICE_URL 環境變數

### 命名格式

`SERVICE_URL_{SERVICE_NAME}_{PORT}` — service name 必須對應 compose 中的實際 service 名稱（不要用通用名稱如 `API`）。

### 寫法規則（非常重要）

**冒號 `:` 後面必須保持空白**，Coolify 會自動填值。手動填值或用 `${}` 引用都會錯。

```yaml
# 正確
environment:
  - SERVICE_URL_BACKEND_3000:
  - SERVICE_URL_FRONTEND_80:
  - SERVICE_URL_ADMINER_8080:

# 錯誤：不要自行填值
- SERVICE_URL_BACKEND_3000=http://backend:3000
# 錯誤：不要用 ${} 引用
- SERVICE_URL_BACKEND_3000=${SERVICE_URL_BACKEND_3000}
```

### 僅適用 HTTP/HTTPS 服務

| 協定 | 適用 SERVICE_URL | 連線方式 |
|------|------------------|---------|
| HTTP/HTTPS（frontend、backend、adminer…） | ✅ | `SERVICE_URL_*:` |
| TCP（PostgreSQL、Redis、MySQL、MongoDB…） | ❌ | 改用 `DATABASE_URL` / `REDIS_URL` 等專屬變數 |

TCP 服務在 compose 內部直接用 service name 當 hostname 互連（例如 `postgres:5432`、`redis:6379`）。

---

## docker-compose.yml 範例（Frontend + Backend + PostgreSQL + Redis + Adminer）

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      - SERVICE_URL_FRONTEND_80:
      - CONTEXT_PATH=${CONTEXT_PATH}
      - VITE_API_URL=${VITE_API_URL}
    expose:
      - "80"
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - SERVICE_URL_BACKEND_3000:
      - NODE_ENV=${NODE_ENV}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    expose:
      - "3000"
    depends_on:
      - postgres
      - redis
    volumes:
      - backend-uploads:/app/uploads

  postgres:
    image: postgres:16-alpine
    # ⚠️ TCP 服務，不要加 SERVICE_URL_POSTGRES_5432:
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    expose:
      - "5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/01-init.sql

  redis:
    image: redis:7-alpine
    # ⚠️ TCP 服務，不要加 SERVICE_URL_REDIS_6379:
    expose:
      - "6379"
    volumes:
      - redis-data:/data

  # ✨ v1.2：Adminer 為標準服務，從 Coolify 可直接連線檢視 DB
  # 正式環境務必在 Coolify 加上 Basic Auth 或 IP 白名單
  adminer:
    image: adminer:4.8.1-standalone
    environment:
      - SERVICE_URL_ADMINER_8080:
      - ADMINER_DEFAULT_SERVER=postgres
      - ADMINER_DEFAULT_DB_DRIVER=pgsql
      - ADMINER_DESIGN=pepa-linha
    expose:
      - "8080"
    depends_on:
      - postgres

volumes:
  postgres-data:
    name: ${COMPOSE_PROJECT_NAME}-postgres-data
  redis-data:
    name: ${COMPOSE_PROJECT_NAME}-redis-data
  backend-uploads:
    name: ${COMPOSE_PROJECT_NAME}-backend-uploads
```

### 最小範例：純前端（Vite）

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - SERVICE_URL_FRONTEND_80:
      - CONTEXT_PATH=${CONTEXT_PATH}
    expose:
      - "80"

volumes: {}
```

---

## Adminer（DB 管理容器）

### 用途

Adminer 是輕量級 DB 管理 Web UI（取代 phpMyAdmin）。透過 Coolify 分配的對外網址，瀏覽器打開就能連線檢視、查詢、修改 DB，不需要 SSH 或 port forward，單檔 PHP 啟動快。

### 支援的資料庫 driver

| Driver | 適用資料庫 |
| --- | --- |
| `pgsql` | PostgreSQL |
| `server` | MySQL / MariaDB |
| `sqlite` | SQLite |
| `mssql` | Microsoft SQL Server |
| `oracle` | Oracle |
| `mongo` | MongoDB（需要額外 plugin） |

### docker-compose 配置

```yaml
adminer:
  image: adminer:4.8.1-standalone
  environment:
    - SERVICE_URL_ADMINER_8080:
    - ADMINER_DEFAULT_SERVER=postgres
    - ADMINER_DEFAULT_DB_DRIVER=pgsql
    - ADMINER_DESIGN=pepa-linha
  expose:
    - "8080"
  depends_on:
    - postgres
```

### 環境變數說明

| 變數 | 必填 | 用途 |
| --- | --- | --- |
| `SERVICE_URL_ADMINER_8080:` | ✅ | Coolify 分配對外網址（冒號後保持空白） |
| `ADMINER_DEFAULT_SERVER` | 建議 | 登入畫面預設 server hostname，填 compose 中的 DB service 名（例：`postgres`） |
| `ADMINER_DEFAULT_DB_DRIVER` | 建議 | 預設 DB driver（`pgsql` / `server` / `sqlite`） |
| `ADMINER_DESIGN` | 選配 | UI 主題，建議 `pepa-linha` 或 `hydra`，比預設好看也好讀 |
| `ADMINER_PLUGINS` | 選配 | 啟用額外 plugins，例如 `tables-filter dump-json` |

### 從 Coolify 存取步驟

1. Coolify → Applications → 你的專案 → 點擊 `adminer` service
2. 複製 Coolify 分配的 SERVICE_URL（類似 `https://adminer-xxx.coolify.yourdomain.com`）
3. 瀏覽器開啟該網址，Adminer 登入畫面出現
4. 登入欄位對照 compose / Coolify 環境變數：

| Adminer 欄位 | 填什麼 |
| --- | --- |
| **System** | PostgreSQL（或對應 DB 類型） |
| **Server** | `postgres`（compose service 名稱，**不是** localhost） |
| **Username** | 對應 `POSTGRES_USER` / `${DB_USER}` |
| **Password** | 對應 `POSTGRES_PASSWORD` / `${DB_PASSWORD}` |
| **Database** | 對應 `POSTGRES_DB` / `${DB_NAME}`，可留空登入後再選 |

### 安全要求（⚠️ 非常重要）

Adminer 本身沒有任何存取限制，任何知道網址的人都能嘗試登入。以下規則**必須**遵守：

1. **`POSTGRES_PASSWORD` 絕對不能為空** — 空密碼等於 DB 公開給全世界
2. **正式環境必須加存取限制**，三選一：
   - 方案 A：Coolify → Traefik middleware 加 **Basic Auth**
   - 方案 B：Coolify → Traefik middleware 加 **IP 白名單**（限公司內網 / VPN）
   - 方案 C：平時**停用** adminer service，需要查資料時再手動 enable
3. **Image 一律綁定版本**，不要用 `adminer:latest` 進入正式環境（避免自動升級破版面）
4. **不要把 Adminer 的 SERVICE_URL 貼在文件、README 或聊天工具** — 等同洩漏 DB 後門
5. **Adminer 的登入密碼 = DB 密碼** — 這不是獨立帳號，洩漏即等於 DB 被拿

### 替代工具比較

| 工具 | Image | 適用場景 |
| --- | --- | --- |
| **Adminer** ✅ 預設 | `adminer:4.8.1-standalone` | 輕量、快速查看、單檔 PHP |
| **pgAdmin** | `dpage/pgadmin4` | PostgreSQL 重度使用、要看 ER 圖 / explain plan |
| **DBGate** | `dbgate/dbgate` | 同時管多個不同類型 DB、需要 SQL history |
| **CloudBeaver** | `dbeaver/cloudbeaver` | 企業級多人協作、需要帳號權限管理 |

選擇原則：個人 / 小團隊用 Adminer 最輕。需要多人協作或查詢歷史用 CloudBeaver。要看 PostgreSQL 的 ER 圖或效能分析用 pgAdmin。

---

## 部署流程與驗證

1. 推送程式碼到 Git → Coolify 自動偵測並部署
2. 檢查 Coolify Deployment Log
3. 檢查 Application Log
4. 實際操作網站驗證功能
5. 進入 Adminer 的 SERVICE_URL，用 DB 帳密登入確認資料庫連線與資料正確
6. 確認應用程式的 `DATABASE_URL` 指向正確 DB

正式環境切換：到 Coolify 後台設定 `DATABASE_URL`（指向 RDS 等）、`NODE_ENV=production`，Adminer 若保留必須加 Basic Auth / IP 白名單，或直接停用。

---

## 常見問題排查

| 問題 | 原因 | 解法 |
|------|------|------|
| 服務間無法通訊 | 定義了 networks | 移除 networks 區塊，讓 Coolify 管理 |
| 環境變數無效 | 使用了 `:?` 語法 | 改用 `${VAR}` |
| SERVICE_URL 無值 | 冒號後填了內容 | 冒號後保持空白 |
| DB / Redis 加 SERVICE_URL 無效 | TCP 服務不支援 | 不要填寫 SERVICE_URL |
| 資料遺失 | Volume 未命名 | 使用命名 Volume |
| 網站無法存取 | 沒設 expose port | 於該 service 加 `expose` |
| Adminer 登入 `could not translate host name "localhost"` | Server 欄位填 localhost | 改填 DB service 名稱（如 `postgres`） |
| Adminer 登入 `password authentication failed` | 密碼對不上 | 確認 Coolify 的 `DB_PASSWORD` 和 Adminer 登入值一致 |
| Adminer 打不開（404） | `SERVICE_URL_ADMINER_8080:` 沒寫或冒號後有值 | 檢查冒號後保持空白 |

---

## Seq Log 收集（選配）

Seq 是集中式 log 查詢工具。推薦走 **應用程式直接 HTTP 推送 CLEF**（透過語言對應的 SDK），不要用 Docker gelf driver + `seq-input-gelf` sidecar 的舊架構。

### 架構

```
應用程式 → SDK（批次 / 重試 / flush）→ POST http://seq/api/events/raw (CLEF) → Seq UI
```

新架構相較舊 gelf 方案的差異：

| 項目 | SDK 直推 CLEF ✅ | Docker gelf + sidecar ❌ |
|------|------------------|--------------------------|
| compose 服務數 | 只需要 `seq` 一個 | 需要 `seq` + `seq-input-gelf` |
| 結構化欄位 | ✅ message template + properties，Seq UI 可直接 filter | ❌ 只能收 stdout 文字，要靠正則解析 |
| 應用程式改動 | 需裝 SDK + 改 log 呼叫 | 不用改 |
| Coolify 例外規則 | 無 | `seq-input-gelf` 必須用 `ports` publish UDP 12201 |
| 跨平台一致性 | ✅ 任何語言皆同 | 依賴 Docker logging driver |

如果應用程式是黑箱 image 無法改 code，才退回舊 gelf 方案（v1.0 文件有範例）。

### docker-compose 配置

```yaml
services:
  seq:
    image: datalust/seq:latest
    restart: unless-stopped
    environment:
      ACCEPT_EULA: "Y"
      SERVICE_URL_SEQ_80:
      SEQ_FIRSTRUN_ADMINUSERNAME: admin
      SEQ_FIRSTRUN_ADMINPASSWORD: $SERVICE_PASSWORD_SEQ
    expose:
      - "80"
    volumes:
      - seq-data:/data

  backend:
    build:
      context: ./backend
    expose:
      - "3000"
    environment:
      - SERVICE_URL_BACKEND_3000:
      - SEQ_INGESTION_URL=http://seq
      - APP_NAME=backend
      # - SEQ_API_KEY=     # 可選，Seq UI 啟用 API key 保護時才需要
    depends_on:
      - seq

volumes:
  seq-data:
    name: ${COMPOSE_PROJECT_NAME}-seq-data
```

### Seq 關鍵規則

1. **必須設 first-run 管理員密碼** — 用 Coolify magic env `$SERVICE_PASSWORD_SEQ`，否則容器 crash 噴 `No default admin password was supplied`。部署後在 Coolify → Environment Variables 找實際值登入。密碼只在 volume 初次初始化時寫入，之後改 env 無效（要到 Seq UI 改）。

2. **不要對 Seq 容器設 healthcheck** — `datalust/seq` 鏡像不一定有 `curl` / `wget`，healthcheck 容易永遠失敗卡死整個 compose。用 `depends_on` 簡單串聯即可。

3. **volume 損壞要整個砍掉重建** — 多次部署失敗後 `seq-data` 可能殘留半成品，噴 `Failed to initialize storage`。需要將 docker-compose 檔案內的 volumes 部份刪除後 commit 讓 Coolify 處理後，再次把刪掉的部份補回，commit 再次讓 Coolify 自動建立。

4. **compose 網路內走 `http://seq`（port 80）** — 對應 `expose: "80"` 與 Coolify 的 `SERVICE_URL_SEQ_80:` 慣例。SDK 會自動 append `/api/events/raw`，不要自己寫完整路徑。

5. **`SEQ_INGESTION_URL` 留空就 fallback console** — logger wrapper 要寫成「沒設此環境變數就只走 `console.log`」，這樣 `npm run dev`、CI 單測都不會嘗試連線 Seq。

### 應用程式配合方式

Seq 的 ingestion 是 HTTP API（CLEF 格式 POST 到 `/api/events/raw`），每個語言都有對應的 SDK 幫你處理批次 / 重試 / 背景 flush。

| 語言 / 框架 | 套件 | 掛接方式 |
|-------------|------|---------|
| Node.js / Next.js | [`seq-logging`](https://www.npmjs.com/package/seq-logging) | 自訂 logger wrapper |
| .NET / ASP.NET Core | `Serilog.Sinks.Seq` | Serilog sink，原生最完整 |
| Java / Spring Boot | `seq-logback-appender` | 掛在 `logback-spring.xml` |
| Python / FastAPI / Django | `seqlog` | 掛進標準 `logging` |
| Go | `github.com/nullseed/logruseq` | logrus hook |

通用導入 pattern：

1. 裝 SDK 並寫一個 logger wrapper（讀 `SEQ_INGESTION_URL` / `SEQ_API_KEY` / `APP_NAME` 三個環境變數）
2. 沒設 `SEQ_INGESTION_URL` 時 fallback 只印 console（保留本地開發體驗）
3. 替換程式內的 `console.log` / `print` / `logger.info` → wrapper 的呼叫
4. 用 **message template**（`"user {UserId} logged in"` + `{ UserId: 123 }`）而非字串拼接，Seq 會把 `UserId` 存成可 filter 的欄位
5. 註冊 `SIGTERM` / `SIGINT` / `beforeExit` → 呼叫 SDK 的 `close()` / `flush()`，容器停機不丟最後一批 log
6. 統一把 `Error` 物件序列化進 CLEF 的 `exception` 欄位，Seq UI 才會高亮 stack trace

---

## 檔案儲存規範

1. **不要把 binary 檔案存進 DB**（圖片、文件等）— 會造成 DB 肥大、備份/還原失敗
2. Binary 一律以檔案方式儲存
3. **優先使用 S3**，移機時不需處理檔案搬遷
4. 若暫用本地儲存，必須掛載命名 Volume
