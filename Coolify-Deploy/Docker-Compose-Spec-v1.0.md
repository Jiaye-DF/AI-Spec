# Coolify Docker Compose 配置規範

> 本文件為 Coolify 平台部署時的 Docker Compose 配置規範，搭配「公司基本架構提示詞.md」使用。

---

## ⚠️ Coolify 重要規則

1. **副檔名使用 `.yml`**（docker-compose.yml）
2. **不要定義 `networks` 區塊** — Coolify 會自動管理網路
3. **`command` 中不要使用 `${Variables}`** — 變數請設定在 `environment` 區塊
4. **環境變數不要使用 `:?` 預設值語法**（如 `${VAR:?VAR is required}`），應改成 `${VAR}`
5. **Volume 務必使用命名 Volume**，避免資料遺失
6. **healthcheck 必須寫真實的健康檢查**，不能只有 ping

---

## 📝 SERVICE_URL 環境變數命名規範

### 命名格式

`SERVICE_URL_{服務名稱}_{PORT}`

- 服務名稱必須對應 docker-compose.yml 中的 service name
- **不要用通用名稱如 API，要用實際的服務名稱**

### ⚠️ 寫法規則（極重要）

**在 docker-compose.yml 的 `environment` 中設定 `SERVICE_URL_*` 時，冒號 `:` 後面必須保持空白，不要填寫任何值。**

Coolify 會自動產生對應的 URL 值，手動填寫反而會造成錯誤。

```yaml
# ✅ 正確寫法 — 冒號後保持空白
environment:
  - SERVICE_URL_BACKEND_3000:
  - SERVICE_URL_FRONTEND_80:

# ❌ 錯誤寫法 — 不要自行填值
environment:
  - SERVICE_URL_BACKEND_3000=http://backend:3000
  - SERVICE_URL_FRONTEND_80=http://frontend:80

# ❌ 錯誤寫法 — 不要用 ${} 引用
environment:
  - SERVICE_URL_BACKEND_3000=${SERVICE_URL_BACKEND_3000}
```

### 常見 HTTP 服務對照表

| 服務 | 服務名稱 (docker-compose) | PORT | 環境變數 | 備註 |
|------|--------------------------|------|----------|------|
| Backend API | backend | 3000 | `SERVICE_URL_BACKEND_3000:` | HTTP 服務，可產生 URL |
| Frontend | frontend | 80 | `SERVICE_URL_FRONTEND_80:` | HTTP 服務，可產生 URL |
| LIFF | liff | 80 | `SERVICE_URL_LIFF_80:` | HTTP 服務，可產生 URL |
| Adminer | adminer | 8080 | `SERVICE_URL_ADMINER_8080:` | HTTP 服務，可產生 URL |

### ⚠️ TCP 服務不適用 SERVICE_URL（極重要）

**PostgreSQL、Redis、MySQL 等資料庫/快取服務走的是 TCP 協定，不是 HTTP，因此 `SERVICE_URL_*` 對這些服務無效。**

Coolify 的 `SERVICE_URL_*` 機制是為 HTTP/HTTPS 服務產生可存取的 URL，但 DB 和 Redis 使用的是 TCP 連線（如 `postgresql://`、`redis://`），不會透過 HTTP 對外服務，所以：

- **不要為 PostgreSQL 設定 `SERVICE_URL_POSTGRES_5432:`** — 無效
- **不要為 Redis 設定 `SERVICE_URL_REDIS_6379:`** — 無效
- 這些服務的連線請透過 `environment` 中的 `DATABASE_URL`、`REDIS_URL` 等環境變數設定
- 在 docker-compose 內部，服務之間可直接用 service name 作為 hostname 互連（如 `postgres:5432`、`redis:6379`）

```yaml
# ✅ 正確 — DB/Redis 不需要 SERVICE_URL，用專屬連線變數
services:
  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    # ❌ 不要加 SERVICE_URL_POSTGRES_5432:

  redis:
    image: redis:7-alpine
    # ❌ 不要加 SERVICE_URL_REDIS_6379:

  backend:
    environment:
      - SERVICE_URL_BACKEND_3000:
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      - REDIS_URL=redis://redis:6379
```

### 📌 SERVICE_URL 適用判斷原則

| 協定 | 適用 SERVICE_URL？ | 範例服務 |
|------|-------------------|----------|
| HTTP/HTTPS | ✅ 適用 | frontend, backend, adminer |
| TCP (非 HTTP) | ❌ 不適用 | PostgreSQL, Redis, MySQL, MongoDB |

---

## 📄 docker-compose.yml 範例

### 🟢 前端 + 後端 + PostgreSQL + Redis（完整範例）

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
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - SERVICE_URL_BACKEND_3000:
      - NODE_ENV=${NODE_ENV}
      - CONTEXT_PATH=${CONTEXT_PATH}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    expose:
      - "3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - backend-uploads:/app/uploads
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:16-alpine
    environment:
      # ⚠️ TCP 服務，不要加 SERVICE_URL_POSTGRES_5432:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    expose:
      - "5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/01-init.sql
      - ./db/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  redis:
    image: redis:7-alpine
    # ⚠️ TCP 服務，不要加 SERVICE_URL_REDIS_6379:
    expose:
      - "6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ─────────────────────────────────────────────
  # 📌 adminer 為選配服務（資料庫管理工具）
  # 用途：提供 Web UI 管理 PostgreSQL，方便查看/編輯資料
  # 若不需要資料庫管理介面，可整段移除
  # ⚠️ 正式環境建議移除或停用，避免資安風險
  # ⚠️ 若使用 adminer，必須設定登入密碼，否則任何人都能存取資料庫！
  # ─────────────────────────────────────────────
  adminer:
    image: adminer:latest
    environment:
      - SERVICE_URL_ADMINER_8080:
      - ADMINER_DEFAULT_SERVER=postgres
      - ADMINER_DESIGN=dracula
      - ADMINER_DEFAULT_DB_DRIVER=pgsql
      # ⚠️ adminer 登入時需輸入 DB 帳號密碼，請確保 PostgreSQL 已設定密碼
      # POSTGRES_PASSWORD 不可為空，否則 adminer 會拒絕登入（安全機制）
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

### 🎨 純前端專案（Vite）

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
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s

volumes: {}
```

### 🟢 Node.js + Express + PostgreSQL

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - SERVICE_URL_BACKEND_3000:
      - NODE_ENV=${NODE_ENV}
      - CONTEXT_PATH=${CONTEXT_PATH}
      - DATABASE_URL=${DATABASE_URL}
      - DB_HOST=${DB_HOST}
      - DB_PORT=${DB_PORT}
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
    expose:
      - "3000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - backend-data:/app/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:16-alpine
    environment:
      # ⚠️ TCP 服務，不要加 SERVICE_URL_POSTGRES_5432:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    expose:
      - "5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/01-init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  # 📌 adminer 為選配服務 — 若不需要資料庫管理介面可整段移除
  # ⚠️ 正式環境建議移除或停用，避免資安風險
  # ⚠️ 若使用，必須確保 PostgreSQL 已設定密碼（POSTGRES_PASSWORD 不可為空）
  adminer:
    image: adminer:latest
    environment:
      - SERVICE_URL_ADMINER_8080:
      - ADMINER_DEFAULT_SERVER=postgres
      - ADMINER_DESIGN=dracula
    expose:
      - "8080"
    depends_on:
      - postgres

volumes:
  postgres-data:
    name: ${COMPOSE_PROJECT_NAME}-postgres-data
  backend-data:
    name: ${COMPOSE_PROJECT_NAME}-backend-data
```

## 📋 coolify.md 範本（Coolify 部署開發指引）

```markdown
# Coolify 部署開發指引

## 專案概述
[專案名稱] - 手機優先的 RWD Web 應用程式，使用 Docker Compose 部署於 Coolify

## 環境說明

### Docker Compose 服務架構

| 服務 | 說明 | 內部 Port | 環境變數（冒號後留空） | 備註 |
|------|------|-----------|----------------------|------|
| frontend | 前端應用 | 80 | `SERVICE_URL_FRONTEND_80:` | HTTP |
| backend | 後端 API | 3000 | `SERVICE_URL_BACKEND_3000:` | HTTP |
| postgres | 資料庫 | 5432 | 不適用（TCP 服務） | 用 `DATABASE_URL` 連線 |
| redis | 快取 | 6379 | 不適用（TCP 服務） | 用 `REDIS_URL` 連線 |
| adminer | DB 管理（選配） | 8080 | `SERVICE_URL_ADMINER_8080:` | HTTP，僅開發環境使用 |

### 資料庫設定（PostgreSQL）

#### 開發環境
DB 包在 docker-compose 內，使用 `.env` 中的連線設定。

#### 正式環境
使用 RDS 服務，在 Coolify 後台調整 Environment Variables：
- `DATABASE_URL` 指向 RDS 連線字串
- `DB_HOST`、`DB_PORT` 等對應修改

#### 初始化資料庫
docker-compose 啟動時會自動執行掛載至 `/docker-entrypoint-initdb.d/` 的 SQL 腳本。


## Coolify 部署注意事項

### 必要規則
1. **docker-compose.yml 不要定義 networks** — Coolify 自動管理
2. **command 中不要使用 ${Variables}** — 設定在 environment 區塊
3. **環境變數不要用 `:?` 語法** — 使用 `${VAR}` 格式
4. **Volume 必須使用命名 Volume** — 避免資料遺失
5. **healthcheck 必須寫真實檢查** — 不能只有 ping
6. **SERVICE_URL_* 冒號後保持空白** — Coolify 自動填值，僅適用 HTTP 服務
7. **DB/Redis 等 TCP 服務不要加 SERVICE_URL_*** — 走 TCP 協定，不是 HTTP，SERVICE_URL 無效
8. **adminer 為選配** — 僅用於管理 PostgreSQL 的 Web 介面，不需要可移除；正式環境建議停用
9. **使用 adminer 必須設定資料庫密碼** — `POSTGRES_PASSWORD` 不可為空，否則任何人都能透過 adminer 存取資料庫，造成嚴重資安問題

### 部署後驗證清單
- [ ] 檢查 Coolify Deployment Log 無錯誤
- [ ] 檢查 Coolify Application Log 無錯誤
- [ ] 實際操作網站確認功能正常
- [ ] 確認所有服務 healthcheck 通過
- [ ] 確認資料庫連線正常

### 正式環境切換
1. 在 Coolify 後台設定 Environment Variables
2. `DATABASE_URL` 指向 RDS
3. `NODE_ENV=production`
4. 移除或停用 adminer 服務（安全考量）
```

---

## ⚙️ Coolify 部署配置重點

### 🔧 環境變數管理

在 Coolify 後台設定環境變數時：

1. **所有敏感資訊都在 Coolify 後台設定**（DB 密碼、JWT Secret 等）
2. **不要在 docker-compose.yml 中寫死密碼**
3. **使用 `${VAR}` 格式引用**，不要用 `${VAR:?error}` 格式
4. **`SERVICE_URL_*` 環境變數冒號後留空**，Coolify 會自動產生值（僅限 HTTP 服務）
5. **DB/Redis 等 TCP 服務不要加 `SERVICE_URL_*`**，改用 `DATABASE_URL`、`REDIS_URL` 等專屬變數

### 🔄 部署流程

1. 推送程式碼到 Git Repository
2. Coolify 自動偵測並開始部署
3. 等待 Docker 建置完成
4. 檢查 Deployment Log
5. 檢查 Application Log
6. 實際操作網站驗證

### ⚠️ 常見問題排查

| 問題 | 可能原因 | 解決方案 |
|------|----------|----------|
| 服務無法啟動 | healthcheck 失敗 | 檢查 healthcheck 指令是否正確 |
| 資料庫連線失敗 | 環境變數未設定 | 在 Coolify 後台確認 DATABASE_URL |
| 網站無法存取 | expose port 未設定 | 確認 docker-compose.yml 的 expose 配置 |
| 資料遺失 | Volume 未命名 | 使用命名 Volume 並指定固定名稱 |
| 環境變數無效 | 使用了 `:?` 語法 | 改用 `${VAR}` 格式 |
| 服務間無法通訊 | 定義了 networks | 移除 networks 區塊，讓 Coolify 管理 |
| SERVICE_URL 無效 | 冒號後填了值 | 冒號後保持空白，讓 Coolify 自動產生 |
| DB/Redis 加了 SERVICE_URL 但無效 | TCP 服務不支援 SERVICE_URL | 移除 SERVICE_URL，改用 DATABASE_URL / REDIS_URL |
| Seq 容器 crash 噴 `No default admin password` | 沒設 first-run admin 密碼 | 加上 `SEQ_FIRSTRUN_ADMINPASSWORD: $SERVICE_PASSWORD_SEQ` |
| Seq 噴 `Failed to initialize storage` | volume 殘留損壞資料 | Coolify UI 砍掉 `seq-data` volume 重新部署 |
| `Connection refused (seq:80)` 持續不停 | Seq 啟動失敗或還沒 Ready | 看 `docker compose logs seq` 找根因，常見是密碼未設 |
| Seq UI 完全沒事件 | gelf 管道沒接通 | 檢查 `seq-input-gelf` 是否 publish UDP 12201 到 host |
| 應用程式操作沒進 Seq | 程式根本沒 console.log | 在程式內主動加 log，gelf 不會無中生有 |

---

## 🔐 Adminer 使用規範（選配服務）

### 什麼是 Adminer？

Adminer 是一個輕量的 Web 資料庫管理工具，提供瀏覽器介面來查看、編輯 PostgreSQL 資料。功能類似 phpMyAdmin，但更輕量。

### 是否需要安裝？

- **需要 adminer 的情況**：開發階段需要透過 Web 介面檢視/編輯資料庫內容
- **不需要 adminer 的情況**：已有其他資料庫管理工具（如 DBeaver、pgAdmin）、或只透過程式碼操作資料庫
- **正式環境一律建議移除或停用**，避免對外暴露資料庫管理入口

### ⚠️ 密碼設定（極重要）

**若決定使用 adminer，PostgreSQL 必須設定密碼（`POSTGRES_PASSWORD` 不可為空）。**

adminer 的登入頁面會要求輸入資料庫帳號密碼。如果 PostgreSQL 沒有設定密碼：
- adminer 本身會拒絕空密碼登入（內建安全機制）
- 但若繞過或未正確設定，等於任何人都能存取你的資料庫
- **這是最常見的資安疏漏之一**

```yaml
# ✅ 正確 — PostgreSQL 必須設定密碼
postgres:
  environment:
    - POSTGRES_PASSWORD=${DB_PASSWORD}   # 不可為空！

# ❌ 錯誤 — 密碼為空或未設定
postgres:
  environment:
    - POSTGRES_PASSWORD=                 # 空密碼，危險！
```

確認清單：
- [ ] `POSTGRES_PASSWORD` 已設定且非空值
- [ ] `.env` 和 Coolify 後台的密碼一致
- [ ] 正式環境已移除或停用 adminer

---

## 📊 Seq Log 收集服務（選配）

### 什麼是 Seq？

Seq 是一個集中式 log 查詢/分析工具，提供 Web UI 即時查詢結構化 log。搭配 Docker 內建的 GELF logging driver，可以**完全不改應用程式**就把所有容器的 stdout/stderr 集中到 Seq UI。

### 是否需要安裝？

- **需要 Seq 的情況**：多服務環境想集中查 log、需要跨容器搜尋、不想 SSH 進機器看檔案
- **不需要 Seq 的情況**：只有單一服務、用 Coolify 內建 log viewer 已足夠、已有其他 log 平台（Loki、ELK 等）
- **正式環境建議**：若對外公開 Seq UI，務必設定強密碼（見下方規則）

### 架構與資料流

```
你的程式 console.log("xxx")
   ↓ Node.js stdout
   ↓ Docker 容器 PID 1
   ↓ Docker daemon 套用 logging driver = gelf
   ↓ UDP 送到 seq-input-gelf:12201
   ↓ seq-input-gelf 轉 HTTP POST → seq:80
   ↓ Seq 寫入儲存 → Web UI 查看
```

整條管道是 **stdout-driven**：寫到 stdout/stderr 的東西才會被收集。

### 三個必要元件

| 容器 | 用途 | Coolify 對外方式 |
|------|------|------------------|
| `seq` | Seq Server，提供儲存與 Web UI | `expose: 80` + `SERVICE_URL_SEQ_80:` |
| `seq-input-gelf` | GELF UDP → Seq HTTP 的轉接器 | **例外**：必須用 `ports` publish UDP 12201 |
| 應用容器 | 你的程式，logging driver 設為 gelf | 依需求 |

### docker-compose 配置範例

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

  seq-input-gelf:
    image: datalust/seq-input-gelf:latest
    restart: unless-stopped
    depends_on:
      - seq
    environment:
      SEQ_ADDRESS: http://seq
    ports:
      - "12201:12201/udp"
    logging:
      driver: gelf
      options:
        gelf-address: "udp://localhost:12201"
        tag: "seq-input-gelf"

  # 應用容器掛上 gelf logging driver
  backend:
    build:
      context: ./backend
    expose:
      - "3000"
    environment:
      - SERVICE_URL_BACKEND_3000:
    depends_on:
      - seq-input-gelf
    logging:
      driver: gelf
      options:
        gelf-address: "udp://localhost:12201"
        tag: "backend"

volumes:
  seq-data:
    name: ${COMPOSE_PROJECT_NAME}-seq-data
```

### ⚠️ Seq 部署規則（極重要）

#### 1. Seq 第一次啟動必須提供 admin 帳密

新版 Seq 在 first-run 時強制要求帳密，否則啟動會 crash 並噴：

```
No default admin password was supplied; set firstRun.adminPassword
or SEQ_FIRSTRUN_ADMINPASSWORD, or opt out using SEQ_FIRSTRUN_NOAUTHENTICATION.
```

**解法**：使用 Coolify magic env var `$SERVICE_PASSWORD_SEQ` 自動產生強密碼：

```yaml
environment:
  SEQ_FIRSTRUN_ADMINUSERNAME: admin
  SEQ_FIRSTRUN_ADMINPASSWORD: $SERVICE_PASSWORD_SEQ
```

部署後在 Coolify → Resource → Environment Variables 找 `SERVICE_PASSWORD_SEQ` 看實際密碼。

**注意**：`firstRun` 設定**只在 volume 第一次初始化時生效**。Seq 已啟動過後改 env var 不會改密碼，要在 Seq UI 內改。

#### 2. 不要把 seq 自己的 log 也送回自己（bootstrap deadlock）

若把 `seq` 容器的 logging driver 也設為 gelf，會發生：

- Seq 啟動時 stdout 被 gelf driver 攔截 → 嘗試送到 `udp://localhost:12201`
- 但 `seq-input-gelf` 還沒啟動 → UDP 丟失或 daemon 阻塞
- 後續 seq-input-gelf 起來時，Seq 還沒 Ready → Connection refused
- 形成連環失敗

**解法**：**`seq` 容器保留預設 json-file driver**，只有 `seq-input-gelf` 與應用容器走 gelf。代價是 Seq 自己的 log 不在 Seq 內，但這是必要的取捨——當 Seq 死掉時你還得查它為何死。

#### 3. seq-input-gelf 必須用 ports 而非 expose（規範例外）

一般 Coolify 規範建議用 `expose`，但 `seq-input-gelf` **必須用 `ports`** 把 UDP 12201 publish 到 host。原因：Docker daemon 的 gelf driver 從 host network 投遞 UDP，不走 Coolify 反向代理。

```yaml
seq-input-gelf:
  ports:
    - "12201:12201/udp"   # 正確：必須 publish 到 host
```

#### 4. 不要設 healthcheck（鏡像可能缺工具）

`datalust/seq` 鏡像不一定有 `wget` / `curl`，若用這些工具寫 healthcheck 會永遠失敗，造成整個 compose 卡死：

```
dependency failed to start: container seq is unhealthy
```

**解法**：移除所有 healthcheck，改用簡單的 `depends_on` 列表。`seq-input-gelf` 內建 retry 機制，啟動初期幾秒的 connection refused 是正常的。

```yaml
seq-input-gelf:
  depends_on:
    - seq    # 不加 condition: service_healthy
```

#### 5. Volume 損壞要砍掉重建

部署多次失敗後，`seq-data` volume 可能殘留半成品狀態，Seq 啟動時噴：

```
Migrating data from an earlier Seq version, please wait...
Failed to initialize storage; check the Seq container logs
```

**解法**：在 Coolify UI 砍掉該 volume，重新 Deploy。Coolify 會重建乾淨 volume。

```
Coolify → Resource → Storages → seq-data → Delete → Redeploy
```

### 🔑 核心觀念：log 收集是 stdout-driven

#### 什麼會自動進 Seq

只要寫到容器 stdout/stderr 的東西都會被 gelf driver 收走，包括：

1. 應用程式的 `console.log` / `console.error`
2. 框架自己的啟動訊息（如 `▲ Next.js Ready in 234ms`）
3. 未捕捉的例外（throw 沒被 catch，框架會印 stack trace 到 stderr）
4. Unhandled Promise rejection
5. 第三方套件的 log（Prisma、Mongoose、debug-mode 的 axios 等）

#### 什麼不會自動進 Seq

1. HTTP request access log（Next.js production 不印）
2. Server-side render 過程細節
3. DB query（除非 ORM 自己印）
4. 業務語意（誰登入、什麼操作）

#### 結論

**程式有印才會有紀錄。** 想看到「使用者操作」必須在程式內主動 `console.log`，gelf driver 不會無中生有。

### 應用程式如何配合

#### 方案 A：每個 API route 內部直接 console.log（小專案推薦）

```typescript
export async function GET() {
  console.log("[Me] GET /api/auth/me");
  // ...
  if (!token) {
    console.log("[Me] no_token, returning 401");
    return ...;
  }
  console.log("[Me] ok, user=" + data.username);
}
```

格式建議：`[Context] descriptive message`，方便在 Seq 用文字過濾。

#### 方案 B：框架內建 instrumentation（補錯誤網）

例如 Next.js 的 `instrumentation.ts` 提供 `onRequestError` hook，自動抓所有未捕捉的 server 端 error，不用每個 route 包 try/catch：

```typescript
export async function onRequestError(err, request, context) {
  console.error("[onRequestError]", err, request.path);
}
```

#### 方案 C：Coolify Traefik access log（不改程式）

開啟 Coolify 反向代理（Traefik）的 access log，把 Traefik 容器也用 gelf driver 送 Seq。可拿到所有 HTTP request 的 method、path、status、duration、IP，**完全不依賴應用程式**。

#### 推薦組合

- **方案 A + B**：應用層業務事件由開發者主動印，未捕獲錯誤由 instrumentation 兜底
- 若需要 HTTP 層視角再加 **方案 C**

### Seq 部署驗證清單

- [ ] Coolify Deployment Log 無錯誤
- [ ] `seq` 容器狀態 Running
- [ ] `seq-input-gelf` 容器狀態 Running
- [ ] 透過 `SERVICE_URL_SEQ_80` FQDN 可開啟 Seq UI
- [ ] 用 `admin` + `SERVICE_PASSWORD_SEQ` 可登入
- [ ] Seq UI 至少看得到 `seq-input-gelf` tag 的事件（代表管道通了）
- [ ] 觸發應用程式有 console.log 的 endpoint，Seq UI 看得到對應訊息

---

## 📁 檔案儲存規範

1. **不要在 DB 存入 binary 檔案**（圖片、文件等）— 會造成 DB 異常肥大，備份/還原可能失敗
2. binary 相關務必以檔案方式存在
3. **建議使用 S3 存放**，移機時不需處理檔案移動
4. 若暫時使用本地儲存，務必掛載命名 Volume
