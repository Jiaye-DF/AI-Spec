# Project-Arch v1.0 — 專案掃描規則(`/scan-project`)

> AI 依本檔掃描專案,輸出違規/嚴重度/修正。讀者:用 AI 開發的非工程師。
> 互補:[`CLAUDE-v1.0.md`](../../Claude/CLAUDE-v1.0.md)、[`Docker-Compose-Spec-v1.2.md`](../../../Coolify-Deploy/Docker-Compose-Spec-v1.2.md)

---

## Agent 心法(最優先)

**規則是地板,不是天花板。你是資深工程師,不是 linter。**

**前置:若根目錄有 `CLAUDE.md`,先讀並遵守其中的基本原則、敏感資訊、Git 工作流程等規範;與本檔衝突時以 `CLAUDE.md` 為準。**

1. 跑完 `R-xxx` → 再找 `AD-xxx`(規則外)問題,至少巡:邏輯邊界 / 效能(N+1、阻塞、re-render)/ 可讀性(命名、魔法數字、過深巢狀)/ 商業邏輯(transaction、狀態機、race)/ 部署啟動 / 維運盲點 / 怪味道
2. 依偵測表判斷,沒有的類別整類跳過,報告註明
3. 規則與脈絡衝突 → 跳過並註明,不硬套
4. 報告白話、路徑 `相對路徑:行號`、修正具體到「改哪檔/第幾行/改成什麼」
5. 違規多先給 Critical + High,結尾問「幫你修 Critical?」

**AD 寧空勿湊,硬湊比空手嚴重。** 判準:**誰會痛?痛多少?**
不回報:偏好性意見 / `R-xxx` 換包裝 / 無後果的潛在風險 / 框架等效寫法

---

## 專案組成偵測

| 類別 | 偵測訊號(任一即存在) | 無 → |
| --- | --- | --- |
| `ENV` | 程式用 `process.env.*` / `os.getenv` / `System.getenv` / `@Value`;或有 `.env*` 檔 | 跳 |
| `AI` | README / commit 有 `(AI)` / `claude` / `copilot` | 仍套 |
| `FE` | `package.json` 含 react/vue/next/nuxt/svelte/vite/angular;或 `.vue`/`.jsx`/`.tsx`/`index.html` | 跳 |
| `BE` | `package.json` 含 express/fastify/nestjs/koa;或 `requirements.txt`/`pyproject.toml`/`pom.xml`/`go.mod`/`Cargo.toml`/`Gemfile` | 跳 |
| `DB` | `migrations/` / `prisma/` / `alembic/`;ORM import;compose 含 postgres/mysql/mongo/redis | 跳 |
| `SEC` | 有 FE 或 BE | 純文件跳 |
| `PII` | DB schema 含 email/phone/name/address/id_number/birth;或有 login/register form | 跳 |
| `LOG` | 有 BE 或 compose | 純 SPA 跳 |
| `GIT` | 有 `.git/` | 跳 |
| `TEST` | `*.test.*` / `*.spec.*` / `tests/` | 保 R-TEST-001 |
| `DEP` | `Dockerfile`/`docker-compose.yml`/`Procfile`/`vercel.json`/`replit.nix` | 跳 |

灰色地帶先掃;單檔學習專案只跑 `ENV`/`AI`/`SEC`;monorepo 分 workspace 偵測。

---

## 嚴重度

| 🔴 Critical | 🟠 High | 🟡 Medium | 🔵 Low | ⚪ Info |
| --- | --- | --- | --- | --- |
| 正式會出事,立即 | 明顯缺陷,本迭代 | 長期債,下迭代 | 風格 / 文件 | 建議 |

規則 ID:`R-{類別}-{序號}`

---

## A. 環境變數 [ENV]

**R-ENV-001 機密寫死 🔴**
檢查:grep `(password|token|secret|api[_-]?key)\s*[:=]\s*["'][^"']{8,}["']` / prefix `sk-`/`ghp_`/`AKIA`/`eyJ` / 連線字串帶帳密
修正:改 env;`.env.example` 加 key;**洩漏過立刻 rotate**。排除:`.env.example`/測試/fixtures/md

**R-ENV-002 缺 `.env.example` 🟠** — 程式用 env 但根目錄無此檔 / `.env.sample`
**R-ENV-003 `.env` 未 gitignore 🔴** — `.gitignore` 無 `.env` 或已追蹤;已追蹤 `git rm --cached` + rotate
**R-ENV-004 env 與 example key 不一致 🟡** — 雙向差集
**R-ENV-005 命名非 UPPER_SNAKE 🔵** — 小寫 / 連字號 → 改
**R-ENV-006 `.env` 曾被 commit 🔴** — `git log --all -- .env` 有結果 → 全 key rotate

## B. AI 產出 [AI]

**R-AI-001 硬編碼 IP / URL / magic 🟡** — IPv4(排 127/0)、特定 domain、業務 magic → 抽 env / 常數
**R-AI-002 疑似幻覺函式 / API 🟠** — import 在依賴找不到 / 套件無此 export / 第三方 API 文件查無
**R-AI-003 TODO 未追蹤 🔵** — grep `TODO|FIXME|XXX|HACK|暫時|之後再改`
**R-AI-004 可疑相依套件 🟠** — typo-squatting;下載 <1000/週或 2 年無維護

## C. 前端 [FE]

**R-FE-001 Token 存 localStorage 🔴** — grep `localStorage\.setItem\([^)]*(token|jwt|auth|access)` → httpOnly+Secure+SameSite cookie
**R-FE-002 `dangerouslySetInnerHTML` / `v-html` / `innerHTML=` 🔴** — 改文字節點;必要時 DOMPurify
**R-FE-003 API 呼叫散落 🟡** — `fetch(` / `axios.*(` ≥ 3 個非 api client 檔 → 集中
**R-FE-004 硬寫中文 🔵** — `.tsx`/`.vue`/`.jsx` 含中文 literal → i18n
**R-FE-005 缺 Loading/Empty/Error 三態 🟡** — async 元件未處理任一
**R-FE-006 送出按鈕未 disable 🟡** — form submit 無 `disabled`/`loading`
**R-FE-007 後端 error 直顯 🟡** — `error.message` 進 alert/toast/JSX → 用 `code` 對應
**R-FE-008 路由缺權限控制 🟠** — 受保護頁面無 auth guard

## D. 後端 API [BE]

**R-BE-001 路徑非 `/api/v{n}/*` 🟠** — 業務 API 必須帶版本前綴(例 `/api/v1/users`);純 `/api/users` 無版本視為違規。排除:`/health`/`/version`/`/metrics`/`/api/docs`
**R-BE-002 動詞命名 endpoint 🟡** — `/get`/`/create`/`/delete`/`/update`/`/list` → 改 REST
**R-BE-003 Response 外殼不統一 🟠** — → 統一 `{code, responseCode, message, data}`;`responseCode` 必為整數,等同原始 HTTP status
**R-BE-004 錯誤一律 500 🟠** — → 分 400/401/403/404/409/422
**R-BE-005 受保護 endpoint 缺 auth 🔴** — 非公開路由未過 middleware / decorator
**R-BE-006 時間非 ISO 8601 UTC 🟡** — `Date.now()` / 毫秒 timestamp → `toISOString()`
**R-BE-007 分頁格式不一 🔵** — → `{items, page, pageSize, total}`
**R-BE-008 缺 `/api/docs` 🟠** — FastAPI `docs_url` / Spring `springdoc` / Express `swagger-ui-express`
**R-BE-009 CORS `*` 🔴** — grep `origin:\s*["']\*["']`;排除純公開無 auth API
**R-BE-010 回傳帶內部欄位 🟠** — `password_hash`/`deleted_at`/`internal_*` → DTO 過濾
**R-BE-011 無輸入驗證 🟠** — 直用 `req.body.xxx` → Zod / Pydantic / class-validator

## E. 資料庫 [DB]

**R-DB-001 無 migration 🟠** — 無 `migrations/` / `prisma/migrations` / flyway / liquibase / alembic
**R-DB-002 缺 `created_at`/`updated_at` 🟡**
**R-DB-003 密碼明文 / 弱雜湊 🔴** — 無 bcrypt/argon2/scrypt;或 `md5|sha1` 用於密碼
**R-DB-004 SQL 字串拼接 🔴** — template literal / 加號 / f-string 非 parameterized → ORM / prepared
**R-DB-005 金額 FLOAT/DOUBLE 🟠** — `amount`/`price`/`balance`/`total` 浮點 → `DECIMAL(18,2)` 或整數分
**R-DB-006 無軟刪除 🟡** — 核心表無 `deleted_at`/`is_deleted`
**R-DB-007 Binary 存 DB 🟠** — `BLOB`/`BYTEA` 為圖片/附件 → S3 / volume
**R-DB-008 常查欄位無索引 🔵** — 外鍵、where/order by 欄位

## F. 資安 [SEC]

**R-SEC-001 JWT `alg: none` 🔴** — → HS256 / RS256,secret ≥ 32 字元
**R-SEC-002 敏感端點無 rate limit 🟠** — `/login` / `/register` / `/forgot-password` / `/otp`
**R-SEC-003 缺安全 headers 🟠** — CSP / X-Frame / X-Content-Type / HSTS → helmet / SecurityMiddleware / Spring Security
**R-SEC-004 `eval`/`exec`/動態執行 🔴** — grep `\beval\s*\(` / `new Function\s*\(` / `Runtime.getRuntime().exec`
**R-SEC-005 密碼錯誤訊息洩露帳號 🟡** — 統一「帳號或密碼錯誤」
**R-SEC-006 檔案上傳無限制 🟠** — 副檔名白名單 + mime + 大小 + 隨機檔名
**R-SEC-007 錯誤訊息洩露內部 🟠** — response `message` 含 stack trace / SQL 語句 / DB table 或 column 名 / ORM query / 檔案路徑 / 內部服務 host;或 prod 開 debug → 改通用訊息 + `code` + `requestId`,詳細走 Seq log
**R-SEC-008 Docker root user 🟡** — 無 `USER` 或 `USER root`
**R-SEC-009 權限只前端擋 🔴** — 前端隱藏但後端 API 無檢查
**R-SEC-010 資源 ID 用序號 🔵** — 公開路由自增整數 → UUID / ULID / slug

## G. 個資 [PII]

**R-PII-001 log 印 PII / 機密 🔴** — log 附近出現 `password/token/email/phone/id_number/credit_card` → 遮罩
**R-PII-002 PII 欄位無標註 🔵** — 標 `-- PII`
**R-PII-003 缺 audit log 🟠** — 登入 / 改密碼 / 匯出 / 權限變更無紀錄

## H. 觀察性 [LOG]

**R-LOG-001 缺 `/health` 🟡** — `GET /health` 回 `{status:"ok"}`
**R-LOG-002 prod debug log 開 🟠** — log level = debug → info / warn
**R-LOG-003 未接 Seq 🟡** — 無 `SEQ_INGESTION_URL` → 依 `Docker-Compose-Spec-v1.2.md`
**R-LOG-004 缺 graceful shutdown 🟠** — 無 `SIGTERM` handler → 重啟丟 in-flight request 與未 flush 的 log;Node `process.on('SIGTERM')` / Python `signal.signal` / 關 HTTP server + DB pool + Seq `close()`
**R-LOG-005 Log 缺結構化欄位 🟡** — log 無 `app_name` / `request_id` / ISO UTC timestamp → 補欄位,用 message template 而非字串拼接
**R-LOG-006 缺 `/version` 🔵** — 無端點回 `{sha, builtAt, image}`,故障排除無法對版

## I. Git [GIT]

**R-GIT-001 `.env` / `node_modules` / build 產物被追蹤 🟠** — `git rm --cached` + 更新 `.gitignore`
**R-GIT-002 commit message 不符規範 🔵** — 近 20 筆無 `Add|Modify|Fix|Refactor|Docs:` 前綴
**R-GIT-003 AI commit 缺 `(AI)` 🔵**

## J. 測試 [TEST]

**R-TEST-001 無測試 🟡** — 無 `*.test.*` / `*.spec.*` / `tests/`
**R-TEST-002 無 CI 🔵** — 無 `.github/workflows/` / `.gitlab-ci.yml` / `Jenkinsfile`
**R-TEST-003 TS 未 strict 🔵** — `tsconfig.json` 缺 `"strict": true`

## K. 部署 [DEP]

**R-DEP-001 compose 定義 `networks` 🟠** — 移除(Coolify 自動)
**R-DEP-002 environment list 語法 🟡** — `- KEY=value` → `KEY: value` map
**R-DEP-003 `${VAR:?error}` 🟠** — 改 `${VAR}`
**R-DEP-004 Volume 未命名 🟠** — `name: ${COMPOSE_PROJECT_NAME}-xxx-data`
**R-DEP-005 image `latest` 🟡** — 綁版本
**R-DEP-006 secret 寫 compose 🔴** — `${VAR}` + Coolify 後台
**R-DEP-007 缺 `.dockerignore` 🔵** — 排除 `node_modules`/`.git`/`.env`/`dist/`
**R-DEP-008 缺 lock file 🟠** — 無 `package-lock.json` / `pnpm-lock.yaml` / `poetry.lock` / `go.sum` / `Cargo.lock` → build 不可重現
**R-DEP-009 執行環境版本未 pin 🟡** — 無 `.nvmrc` / `package.json engines` / `python_requires` / `go.mod` Go 版本
**R-DEP-010 Dockerfile 非 multi-stage 🟡** — production image 仍含 devDeps / build 工具 → 分 build / runtime 兩階段
**R-DEP-011 Dockerfile cache 層順序錯 🟡** — `COPY . .` 先於 lock file + install,每次改程式都重灌依賴
**R-DEP-012 base image 未 pin minor 🟡** — `node:20` / `python:3.11` → `node:20.11-alpine` / `python:3.11.8-slim`
**R-DEP-013 HEALTHCHECK 無工具 🟡** — Dockerfile 宣告 HEALTHCHECK 用 curl/wget 但 image 未安裝 → `RUN apk add --no-cache curl` 或改 node / python 內建
**R-DEP-014 container 時區非 UTC 🔵** — 無 `ENV TZ=UTC` / compose `TZ: UTC` → 顯示層才轉時區
**R-DEP-015 build-time env 誤當 runtime 🟠** — `VITE_*` / `NEXT_PUBLIC_*` / `REACT_APP_*` 放 Coolify runtime env 無效(已嵌入 bundle)→ 改 build args
**R-DEP-016 未做依賴安全掃描 🔵** — CI 無 `npm audit` / `pip-audit` / `trivy image` 步驟

---

## 報告格式

**1. 總覽** — 時間 / 專案類型 / 🔴N 🟠N 🟡N 🔵N ⚪N / 結論 ✅⚠️❌

**2. 詳細發現(依嚴重度排序)**
```
### 🔴 [R-ENV-001] 機密寫死
- 檔案:`src/lib/auth.ts:12`
- 內容:`const JWT_SECRET = "..."`
- 白話:secret 公開 = 任何人可偽造登入
- 修正:(1) `process.env.JWT_SECRET` (2) `.env.example` 加 key (3) Coolify 設值 (4) 原 secret 當洩漏換新
```

**3. 修正優先序** — 立刻 / 本週 / 有空 三組

**4. 已跳過類別(必列)** — 表格:類別 + 原因

**5. 額外發現 `AD-xxx`(必列)**
```
### 🟠 [AD-001] 結帳無 transaction
- 檔案:`src/services/checkout.ts:45-82`
- 分類:商業邏輯 / 資料一致性
- 問題:扣庫存+建單+扣款無 transaction,扣款失敗殘局
- 白話:客訴 + 庫存對不齊
- 修正:DB transaction 或 Saga pattern
```
空可接受,但須列已巡視面向:
> 已巡視:邏輯邊界 / N+1 / transaction / 命名 / 狀態轉換 → 無
