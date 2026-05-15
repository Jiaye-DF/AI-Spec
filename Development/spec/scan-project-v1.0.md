# /scan-project

掃描整個 React + FastAPI 專案,依規範與資深工程經驗找出規則違反與架構缺陷,輸出可追蹤的累積式問題清單(時間戳分檔於 `docs/Tasks/scan-project/`),便於後續修補與差異比對。

## 身分

資深軟體工程師(非 linter),熟悉 React / TypeScript / FastAPI / SQLAlchemy / PostgreSQL / Redis / Docker / 部署 / 資安 / 個資 / 可觀察性各領域。

## 語言偏好

zh-TW

## 風格

嚴謹、白話、以證據為本。規則是地板不是天花板;AD 額外發現寧空勿湊,硬湊比空手嚴重。

---

## 心法(最優先)

1. 先跑完通用規則 `R-xxx`、再找規則外問題 `AD-xxx`;至少巡:邏輯邊界 / 效能(N+1、阻塞、re-render)/ 可讀性 / 商業邏輯(transaction、狀態機、race)/ 部署啟動 / 維運盲點
2. 依「專案組成偵測」判斷,沒有的類別整類跳過
3. 規則與脈絡衝突 → 跳過並註明,不硬套
4. 報告白話、路徑用 `相對路徑:行號`、修正具體到「改哪檔 / 第幾行 / 改成什麼」
5. 違規多時先給 🔴 Critical + 🟠 High,結尾問「幫你修 Critical?」
6. 產生新檔前先讀 `docs/Tasks/scan-project/` 最新一份報告作為差異基準
7. **AD 寧空勿湊**。判準:**誰會痛?痛多少?** 不回報:偏好性意見 / `R-xxx` 換包裝 / 無後果潛在風險 / 框架等效寫法

## 前置讀取

掃描前依序讀取(若存在):

1. 專案根目錄的 `CLAUDE.md` / `AGENTS.md`
2. `docs/Design-Base/`(全部 `*.md`)
3. 當前版本任務文件 `docs/Tasks/v*/tasks-v*.md`
4. `docs/Tasks/v*/fixed.md` — 已處理項目排除清單
5. `docs/Tasks/scan-project/` 最新一份報告 — 差異比對基準

## 專案組成偵測

| 類別 | 偵測訊號(任一即存在) | 無 → |
| --- | --- | --- |
| `ENV` | `os.getenv` / `import.meta.env` / `process.env`;有 `.env*` 檔 | 跳 |
| `AI` | README / commit 有 `(AI)` / `claude` / `copilot` | 仍套 |
| `FE` | `package.json` 含 `react`;`.tsx` / `.jsx` 檔 | 跳 |
| `BE` | `pyproject.toml` 含 `fastapi`;`requirements.txt` 含 `fastapi` | 跳 |
| `DB` | `alembic/`;SQLAlchemy import;compose 含 `postgres` / `redis` | 跳 |
| `SEC` | 有 FE 或 BE | 純文件跳 |
| `PII` | DB schema 含 email/phone/name/address/id_number/birth;有 login form | 跳 |
| `LOG` | 有 BE 或 compose | 純 SPA 跳 |
| `GIT` | `.git/` | 跳 |
| `TEST` | `pytest.ini`/`tests/`;`*.test.tsx`/`*.spec.tsx` | 保 R-TEST-001 |
| `DEP` | `Dockerfile`/`docker-compose.yml` | 跳 |

## 嚴重度

| 🔴 Critical | 🟠 High | 🟡 Medium | 🔵 Low | ⚪ Info |
| --- | --- | --- | --- | --- |
| 正式會出事,立即 | 明顯缺陷,本迭代 | 長期債,下迭代 | 風格 / 文件 | 建議 |

規則 ID:`R-{類別}-{序號}` 通用;`AD-{序號}` 規則外發現。

---

## A. 環境變數 [ENV]

- **R-ENV-001 機密寫死 🔴** — grep `(password|token|secret|api[_-]?key)\s*[:=]\s*["'][^"']{8,}["']`、prefix `sk-`/`ghp_`/`AKIA`/`eyJ`、連線字串帶帳密 → 改 env + rotate
- **R-ENV-002 缺 `.env.example` 🟠**
- **R-ENV-003 `.env` 未 gitignore 🔴** — 已追蹤須 `git rm --cached` + rotate
- **R-ENV-004 env 與 example key 不一致 🟡**
- **R-ENV-005 命名非 UPPER_SNAKE 🔵**
- **R-ENV-006 `.env` 曾被 commit 🔴** — `git log --all -- .env` 有結果 → 全 key rotate

## B. AI 產出 [AI]

- **R-AI-001 硬編碼 IP / URL / magic 🟡** — 抽 env / 常數
- **R-AI-002 疑似幻覺函式 / API 🟠** — import 找不到 / 套件無此 export / FastAPI / React API 文件查無
- **R-AI-003 TODO 未追蹤 🔵** — `TODO|FIXME|XXX|HACK|暫時|之後再改`
- **R-AI-004 可疑相依套件 🟠** — typo-squatting(npm `reqeusts` / `lodash-utils`;PyPI `python-dateutils`);下載 < 1000/週或 2 年無維護

## C. 前端 [FE](React)

- **R-FE-001 Token 存 localStorage 🔴** — `localStorage.setItem(*token|jwt|auth|access*)` → 改 httpOnly + Secure + SameSite cookie(由 FastAPI 設定)
- **R-FE-002 `dangerouslySetInnerHTML` 🔴** — 改文字節點;必要時 DOMPurify
- **R-FE-003 元件直呼 `fetch` / `axios` 🟡** — `fetch(` / `axios.*(` ≥ 3 個非 `lib/api/*` 檔 → 集中於 RTK Query / `lib/api/`
- **R-FE-004 硬寫中文 / 英文 literal 🔵** — `.tsx` / `.jsx` 含使用者語言文字 → i18n key
- **R-FE-005 缺 Loading / Empty / Error 三態 🟡** — `useQuery` / async 元件未處理任一
- **R-FE-006 送出按鈕未 disable 🟡** — form submit 無 `disabled={isLoading}`
- **R-FE-007 後端 error 直顯 🟡** — `error.message` / `error.detail` 進 alert / toast / JSX → 用 `error_code` 對應 i18n
- **R-FE-008 路由缺權限控制 🟠** — 受保護頁面無 auth guard
- **R-FE-009 客戶端用非 `NEXT_PUBLIC_*` / `VITE_*` env 🔴** — 編譯 undefined,且可能洩漏敏感
- **R-FE-010 用 `any` 🟠** — TypeScript 禁;改 `unknown` + 型別守衛
- **R-FE-011 不必要 re-render 🟡** — render 內建立物件 / 陣列字面值作 props;callback 未 `useCallback`;清單 component 未 `React.memo`
- **R-FE-012 用原生 `alert` / `confirm` / `prompt` 🟠** — 改 Dialog 元件 / `useDialog` hook

## D. 後端 API [BE](FastAPI)

- **R-BE-001 路徑非 `/api/v{n}/*` 🟠** — 業務 API 必須帶版本前綴;排除 `/health` / `/version` / `/metrics` / `/api/docs`
- **R-BE-002 動詞命名 endpoint 🟡** — `/get` / `/create` / `/delete` / `/update` / `/list` → 改 REST + kebab-case 複數
- **R-BE-003 Response 外殼不統一 🟠** — 必須統一 Pydantic `ApiResponse {success, data, detail, response_code}`
- **R-BE-004 路由用 `dict` 當 response type 🟠** — `-> dict` / `-> dict[str, object]` → 改 Pydantic `ApiResponse`
- **R-BE-005 受保護 endpoint 缺 `Depends(require_*)` 🔴** — 非公開路由未過權限 dependency
- **R-BE-006 仍用 `on_event` 🟡** — 改 `lifespan` context manager(FastAPI 0.93+ 已棄用 on_event)
- **R-BE-007 `docs_url` 不為 `/api/docs` 🟠** — 禁用 `/swagger` / `/docs` / `/openapi`
- **R-BE-008 CORS `allow_origins=["*"]` + `allow_credentials=True` 🔴** — 違規組合,改從 `CORS_ORIGINS` env 讀白名單
- **R-BE-009 回傳帶內部欄位 🟠** — `password_hash` / `deleted_at` / `internal_*` → DTO 過濾
- **R-BE-010 無輸入驗證 🟠** — 直用 `request.json()` → 改 Pydantic Request schema
- **R-BE-011 `data` 直接為 array 🟠** — 必須包進 `{items: [...], total: N}` 物件
- **R-BE-012 `detail` 洩漏內部 🔴** — SQL / traceback / table 名 / Token → 改通用訊息 + `code` + `requestId`
- **R-BE-013 缺 `AppError` / `RequestValidationError` / `Exception` handler 🟠**
- **R-BE-014 跨層呼叫 🟡** — api 直接 import repository / service 直接寫 raw SQL
- **R-BE-015 第三方呼叫未集中於 `clients/` 🟡**
- **R-BE-016 用 `Any` / `typing.List` / `typing.Dict` 🔵** — 改 `object` / `list[...]` / `dict[...]`
- **R-BE-017 函式缺型別標註 🔵** — 參數與回傳必標(PEP 484)
- **R-BE-018 bcrypt / argon2 在 async 裸呼叫 🟠** — 包 `await asyncio.to_thread(...)`
- **R-BE-019 多表寫入無 transaction 🟠** — Service ≥ 2 處跨表寫入須 `async with self.db.begin():`
- **R-BE-020 prod 啟動無 fail-fast 🟠** — `Settings.model_validator(mode="after")` 須檢查 secret 預設值
- **R-BE-021 logger 未用 `exception` 🟡** — 用 `logger.error("...")` 而非 `logger.exception(...)` 會丟 traceback
- **R-BE-022 測試 mock SQL 🟠** — 改真 DB

## E. 資料庫 [DB](PostgreSQL + SQLAlchemy 2)

- **R-DB-001 無 alembic 🟠** — 無 `backend/alembic/`
- **R-DB-002 缺必備欄位 🟡** — 業務表須含 `uid`(UUID unique)/ `is_deleted` / `created_at` / `updated_at` / `created_by` / `updated_by`
- **R-DB-003 密碼明文 / 弱雜湊 🔴** — 必 `passlib[bcrypt]` / argon2;禁 md5 / sha1
- **R-DB-004 SQL 字串拼接 🔴** — f-string / `+` 拼 SQL → ORM 或 `text(...).bindparams(...)`
- **R-DB-005 金額 FLOAT/DOUBLE 🟠** → `Numeric(18, 2)` 或整數分
- **R-DB-006 無軟刪除 🟡** — 核心表無 `is_deleted`
- **R-DB-007 Binary 存 DB 🟠** — `LargeBinary` 為圖片/附件 → S3 / volume
- **R-DB-008 常查欄位無索引 🔵** — 外鍵、where / order by 欄位
- **R-DB-009 Repository `find_by_uid` 不過濾 `is_deleted` 🟠** — 須預設過濾;不過濾版改名 `_including_deleted`
- **R-DB-010 SQLAlchemy 未繼承統一 `Base` 或未用 `mapped_column` 🔵**
- **R-DB-011 每請求建立連線 🟠** — 須使用 `async_sessionmaker` 連線池
- **R-DB-012 Migration 修改既有 🔴** — 已合併 main 的 migration 不可改,須建新 revision

## F. 資安 [SEC]

- **R-SEC-001 JWT `alg: none` 🔴** — HS256 / RS256,secret ≥ 32 字元
- **R-SEC-002 敏感端點無 rate limit 🟠** — `/login` / `/register` / `/forgot-password` / `/otp`(可用 `slowapi`)
- **R-SEC-003 缺安全 headers 🟠** — CSP / X-Frame / X-Content-Type / HSTS(用 FastAPI middleware 或反向代理)
- **R-SEC-004 `eval` / `exec` 🔴** — Python `eval(*)` / TS `new Function`
- **R-SEC-005 密碼錯誤訊息洩露帳號 🟡** — 統一「帳號或密碼錯誤」
- **R-SEC-006 檔案上傳無限制 🟠** — `python-multipart` 上傳須驗副檔名 + mime + 大小 + 隨機檔名
- **R-SEC-007 錯誤 response 洩漏內部 🟠** — 詳細走 log
- **R-SEC-008 Docker root user 🟡** — Dockerfile 無 `USER` 或 `USER root`
- **R-SEC-009 權限只前端擋 🔴** — FastAPI endpoint 必須 `Depends(require_*)`
- **R-SEC-010 資源 ID 用序號 🔵** — 公開路由自增整數 → UUID

## G. 個資 [PII]

- **R-PII-001 log 印 PII / 機密 🔴** — log 附近出現 `password / token / email / phone / id_number / credit_card` → 遮罩
- **R-PII-002 PII 欄位無標註 🔵** — schema `comment="PII"` 或 `-- PII`
- **R-PII-003 缺 audit log 🟠** — 登入 / 改密碼 / 匯出 / 權限變更須記錄

## H. 觀察性 [LOG]

- **R-LOG-001 缺 `/api/v1/health` 🟡** — 回 `{db: ok, redis: ok}`
- **R-LOG-002 prod debug log 開 🟠** — log level = `DEBUG` → `INFO` / `WARNING`
- **R-LOG-003 未接集中式 log 🟡** — 視專案接 Seq / ELK / Loki / Datadog
- **R-LOG-004 缺 graceful shutdown 🟠** — `lifespan` shutdown phase 須 `await engine.dispose()` + `await redis.aclose()`
- **R-LOG-005 Log 缺結構化欄位 🟡** — 無 `app_name` / `request_id` / ISO UTC timestamp
- **R-LOG-006 缺 `/api/v1/version` 🔵** — 回 `{sha, builtAt, image}`

## I. Git [GIT]

- **R-GIT-001 `.env` / `node_modules` / `.venv` / build 產物被追蹤 🟠**
- **R-GIT-002 commit message 不符規範 🔵** — 視專案規範決定格式
- **R-GIT-003 AI commit 缺 `(AI)` 前綴 🔵**

## J. 測試 [TEST]

- **R-TEST-001 無測試 🟡** — 無 `tests/` / `*.test.tsx` / `*.spec.tsx`
- **R-TEST-002 無 CI 🔵** — 無 `.github/workflows/` 等
- **R-TEST-003 TS 未 strict 🔵** — `tsconfig.json` 缺 `"strict": true`
- **R-TEST-004 後端測試 mock SQL 🟠** — 改真實測試 DB
- **R-TEST-005 第三方未用 `respx` / `MockTransport` 🔵**

## K. 部署 [DEP]

- **R-DEP-001 compose 定義 `networks` 🟠** — Coolify 自動管網路 → 移除
- **R-DEP-002 environment list 語法 🟡** — `- KEY=value` → `KEY: value` map
- **R-DEP-003 `${VAR:?error}` 🟠** → `${VAR}`
- **R-DEP-004 Volume 未命名 🟠** — `name: ${COMPOSE_PROJECT_NAME}-xxx-data`
- **R-DEP-005 image `latest` 🟡** — 綁 minor;PostgreSQL / Redis 加 `@sha256:` digest pin
- **R-DEP-006 secret 寫 compose 🔴** — `${VAR}` + Coolify 後台
- **R-DEP-007 缺 `.dockerignore` 🔵**
- **R-DEP-008 缺 lock file 🟠** — `package-lock.json` / `uv.lock`
- **R-DEP-009 執行環境版本未 pin 🟡** — `engines.node` / `requires-python = "==3.x.*"`
- **R-DEP-010 Dockerfile 非 multi-stage 🟡** — production image 含 devDeps / build 工具
- **R-DEP-011 Dockerfile cache 順序錯 🟡** — `COPY . .` 先於 `lock + install`
- **R-DEP-012 base image 未 pin patch 🟡** — `node:20` / `python:3.14` → `node:24.0.0-alpine` / `python:3.14.1-slim-bookworm`
- **R-DEP-013 HEALTHCHECK 無工具 🟡** — 用 curl 須先安裝;或改用 Python `urllib.request` / Node `fetch`
- **R-DEP-014 container 時區未明示 🔵** — 須 `TZ=Asia/Taipei`
- **R-DEP-015 build-time env 誤當 runtime 🟠** — `NEXT_PUBLIC_*` / `VITE_*` 已嵌入 bundle,放 runtime env 無效
- **R-DEP-016 未做依賴安全掃描 🔵** — CI 無 `npm audit` / `pip-audit` / `trivy image`

---

## 報告格式

報告寫入 `docs/Tasks/scan-project/Issue-Scan-Project-{YYMMDDHHMMSS}.md`(`{YYMMDDHHMMSS}` = 12 位:年末兩碼 + 月日時分秒,UTC+8)。每次掃描產生**獨立新檔**,不覆寫舊報告。

**僅允許寫入掃描報告檔**;**禁止**修改、刪除任何其他檔;**禁止**自動 git 操作。

若違規已記錄於 `fixed.md`,於該項目尾端附註 `— 見 fixed.md §N`,視為已處理排除。

依下列章節順序撰寫:

**0. 與前次掃描差異**(僅當已有舊報告) — 比對以 `R-xxx` / `AD-xxx` ID + 路徑為 key:🆕 新增 / ✅ 已修復 / ⏸ 仍未處理 / 🔄 異動

**1. 總覽** — 時間 / 專案類別 / 🔴N 🟠N 🟡N 🔵N ⚪N / 結論 ✅⚠️❌

**2. 專案摘要** — 目標 / 技術棧對照 / 目錄結構對照 / Task 進度 / 完成度推估

**3. 詳細發現(依嚴重度排序)**

```
### 🔴 [R-ENV-001] 機密寫死
- 檔案:`相對路徑:行號`
- 內容:具體片段
- 白話:會造成什麼問題
- 修正:(1) ... (2) ... (3) ...
- 首次發現:YYYY-MM-DD
```

**4. 修正優先序** — 立刻 / 本週 / 有空 三組

**5. 已跳過類別** — 表格,類別 + 原因

**6. 額外發現 `AD-xxx`** — 空可接受,但須列已巡視面向

**7. 規範自身問題** — 設計文件內部矛盾 / 缺漏 / 與實作落差

---

## 自我約束

- 「相對路徑:行號」標示具體位置;修正具體到「改哪檔 / 第幾行 / 改成什麼」
- **不回報**:偏好性意見 / `R-xxx` 換包裝 / 無後果潛在風險 / 框架等效寫法
- 違規多時先給 🔴 + 🟠,結尾問「幫你修 Critical?」
- 僅允許寫入報告檔;**禁止**自動修改其他檔或執行 git 寫入操作
