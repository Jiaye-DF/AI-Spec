# Design Notes v1.0 — 前後端與 DB 設計注意事項

> 設計時的思考框架。配合 [`00-overview-v1.0.md`](./00-overview-v1.0.md)(架構)、[`scan-project-v1.0.md`](../scan/scan-project-v1.0.md)(掃描規則)。
> 不是違規偵測清單,是「做決定時該想到什麼」。
>
> **⚠️ 給 scan-project Agent**:本檔規範若有對應 `R-xxx`,違反時報 `R-xxx`,**不要再另開 `AD-xxx`**。AD 保留給規則庫未涵蓋的問題(邏輯、效能、商業邏輯、怪味道)。

---

## 前端 [FE]

- **元件拆分**:複用 ≥ 2 處 / 單檔 > 300 行 / JSX 巢狀 > 3 層 → 拆
- **狀態分層**:local / URL / server cache / global store,各自職責不混
- **表單驗證**:`onBlur` 或 `onSubmit`(不用 `onChange` 太吵);錯誤緊鄰欄位;送出三態
- **資料流**:props 向下、事件向上;drilling > 3 層 → context / store
- **型別**:API DTO → 衍生 UI 型別,不直接用後端裸 shape
- **錯誤邊界**:頁面級 `ErrorBoundary` 必備
- **效能**:先 profile 再 memo,不預先優化
- **無障礙底線**:語意化 tag、form label、keyboard 可操作

---

## 後端 [BE]

### 分層與職責
- **Controller** 處理 HTTP(解析 / 驗證 / 包 response),不寫業務
- **Service** 業務邏輯,不碰 req / res
- **Repository** 資料存取,不寫業務
- 禁止跨層(controller 繞過 service 直通 repository)

### 設計原則
- **DTO 入出口分開**,entity 不裸露
- **交易邊界**:跨多筆寫入 = 一個 transaction,邊界在 service
- **冪等性**:寫入接受重試(idempotency key);PUT / DELETE 天然冪等
- **副作用順序**:DB 寫在內、外部呼叫在外,失敗能補償
- **錯誤分類**:可預期(4xx + `code`)vs 非預期(5xx + 告警)

### 錯誤訊息對外最小化(⚠️ 資安,強制)

錯誤 `message` **必須通用化**,禁止夾帶:
- API 結構(endpoint / 路由 / 微服務名)
- DB schema(table / column / SQL / ORM query 原文)
- 檔案路徑、stack trace、內部 host / port
- 第三方原始錯誤訊息(可能帶 key / host)
- 業務規則判斷條件全貌

**為什麼**:協助攻擊者畫地圖 → SQL injection / 路徑推測 / 授權繞過跳板。

**分層**:前端 `message` 通用 + `code` + `requestId`;Seq log 完整錯誤;客服憑 `requestId` 查 log。

**違規 vs 正確**
```json
// ❌ DB 錯誤原文外洩
{ "code": "DB_ERROR", "responseCode": 500,
  "message": "duplicate key value violates unique constraint \"users_email_key\"" }

// ✅ 通用訊息 + code + requestId
{ "code": "EMAIL_ALREADY_EXISTS", "responseCode": 409,
  "message": "此 email 已註冊", "data": { "requestId": "req_abc123" } }
```

實作:全局 error handler 白名單放行業務錯誤,其他一律翻通用。

---

### API 格式統一(⚠️ 強制)

**路徑**:版本前綴必填 `/api/v{n}`;REST 複數名詞,禁用動詞(`/getUser`);資源巢狀 ≤ 2 層;篩選 / 排序 / 分頁走 query string。

**Response 外殼**
```json
{ "code": "SUCCESS", "responseCode": 200, "message": "操作成功", "data": { ... } }
```
- `code`:業務代碼,成功 `SUCCESS`,失敗用業務錯誤碼(例 `AUTH_INVALID_TOKEN`)
- `responseCode`:原始 HTTP status 整數(必填,與 status line 一致,避免中介層吃掉)
- `message`:人類可讀(可 i18n)
- `data`:業務資料,失敗可 `null`
- 前端以 `code` 判斷,不以 `message` 文字比對

**HTTP status × code 對應**

| Status | 用途 | 常用 code |
| --- | --- | --- |
| 200 / 201 / 204 | 成功 | `SUCCESS` / — |
| 400 | 參數格式錯 | `INVALID_PARAM` |
| 401 | 未登入 / token 失效 | `AUTH_REQUIRED` / `AUTH_EXPIRED` |
| 403 | 無權限 | `FORBIDDEN` |
| 404 | 資源不存在 | `NOT_FOUND` |
| 409 | 衝突 | `CONFLICT` |
| 422 | 業務規則不過 | `BUSINESS_RULE_VIOLATION` |
| 500 | 系統錯誤 | `INTERNAL_ERROR` |

**欄位命名** — JSON `camelCase`(`createdAt`);DB `snake_case`,服務層轉換
**時間** — ISO 8601 + UTC(`2026-04-20T08:00:00Z`);禁止毫秒 timestamp / local time
**分頁** — `{ items, page, pageSize, total }`;query `?page=1&pageSize=20`;`pageSize` ≤ 100
**排序** — `?sort=createdAt,-price`(`-` 降冪,多欄逗號串)
**篩選** — `?status=active`;範圍 `?createdAfter=<ISO>&createdBefore=<ISO>`
**批次** — `POST /batch { items: [...] }` → `{ items: [{index, code, data}...] }`(部分成功不整批失敗)
**檔案** — 上傳 `multipart/form-data`;下載 `Content-Disposition: attachment; filename*=UTF-8''...`(RFC 5987)
**Idempotency** — 寫入接受 `Idempotency-Key` header,24h 內同 key 回相同結果

---

## 資料庫 [DB]

- **關聯 vs 內嵌(JSON)**:查詢頻繁 / 要 JOIN / 要完整性 → 關聯;唯讀快照、結構不固定 → 內嵌
- **索引**:先看慢查詢再加;多欄 index 高選擇性在前;不猜測預加
- **軟刪除**:確有還原需求才用,否則真刪
- **外鍵 `ON DELETE`**:明確 `CASCADE` / `SET NULL` / `RESTRICT`,不留預設
- **命名**:名詞 + 單位(`weight_kg`、`duration_ms`);布林 `is_` / `has_` / `can_`
- **時序資料**:追加型 + 查近期 → 按月 / 週分區
- **Migration**:可回滾;schema 變更與資料搬移拆成兩個 migration
- **型別保守**:能 `VARCHAR(n)` 別 `TEXT`;能 `INT` 別 `BIGINT`;錢用 `DECIMAL`;時間 UTC

---

## 部署與運維 [DEP]

### Dockerfile 注意事項
- **Multi-stage**:build 階段含工具(compiler / devDeps),final 只留 runtime 必要
- **Layer cache 順序**:`COPY lock-file` → `install` → `COPY .`;反序會每次改程式都重灌依賴
- **Base image pin minor**:`node:20.11-alpine`、`python:3.11.8-slim`,不要只 `node:20`
- **HEALTHCHECK 工具**:用 curl/wget 前 `RUN apk add --no-cache curl`,或改用語言內建(`node -e`)
- **TZ=UTC**:`ENV TZ=UTC`,顯示時再轉時區
- **非 root user**:`RUN adduser app && USER app`(scan R-SEC-008)

### 容器生命週期

**啟動 — migration 策略**(三選一,全專案一致)
- Init container(K8s 思維)/ entrypoint 腳本 / CI job,不混用
- 多 replica 必須互斥(advisory lock 或 init container only 一份)
- 失敗 **crash 停機**,不偷偷跳過

**就緒**
- `GET /health` 淺檢(回 200)→ Coolify healthcheck 用
- `GET /health/deep` 檢 DB / Redis 就緒 → 給維運或手動查
- `GET /version` 回 `{sha, builtAt, image}` → 故障排除對版

**結束 — graceful shutdown**
- 攔 `SIGTERM` → 10 秒內:停接新 request → 等 in-flight 完成 → flush Seq → 關 DB pool
- Node:`process.on('SIGTERM', async () => { ... })`
- Python:`signal.signal(signal.SIGTERM, handler)`
- Seq SDK:記得 `close()` / `flush()`

### 環境變數三階段

```
.env.example  → commit,全 key 佔位值(文件用)
.env          → 本地開發,gitignore
Coolify 後台  → 線上,覆蓋所有
```

**Build-time vs Runtime 要分清**
- `VITE_*` / `NEXT_PUBLIC_*` / `REACT_APP_*` 在 build 時嵌入 bundle → Coolify 用 **build args**,runtime env 無效
- 後端大多 runtime env,Coolify 後台改值重啟即可

**Fallback**:本地無 `SERVICE_URL_*` 注入時,程式碼要有 fallback(`http://localhost:3000`),不 undefined

### Log 結構化最低欄位

每筆 log 必含:
- `app_name`(從 env `APP_NAME` 取)
- `timestamp`(ISO 8601 UTC)
- `level`(`debug` / `info` / `warn` / `error`)
- `request_id`(middleware 注入,跨服務 propagate)
- 登入後額外帶 `user_id`(遮罩或 hash)
- Error 必帶 `stack` — **只進 Seq,不回前端**(對應錯誤訊息對外最小化)

用 message template(`"user {UserId} logged in"` + `{UserId: 123}`),不要字串拼接(Seq 才能 filter)。

### Pre-deploy checklist

- [ ] `.env.example` 所有 key 已進 Coolify 後台
- [ ] Migration 在 staging 跑過,`down` 也驗證
- [ ] Image tag 綁 **git SHA 或 semver**,不用 `latest`
- [ ] Secret 若可能洩漏 → 已 rotate
- [ ] 新 image `/health` 回 200
- [ ] Seq 有新版 log 進來

### 回滾策略

- Image tag 禁 `latest`,否則 Coolify rollback 無目標
- Migration 必有 `down`
- 順序:先切回舊 image → 確認服務穩 → 視情況回 schema
- Schema rollback 若會丟資料,**優先加向前相容的 patch,不要硬 rollback**

### Reverse proxy 與 HTTPS

- Coolify Traefik 自動處理 HTTPS,App 本身跑 HTTP
- App 要讀正確 client IP:
  - Express `app.set('trust proxy', 1)`
  - FastAPI 加 `ProxyHeadersMiddleware`
- `Strict-Transport-Security` 等 header 見 scan R-SEC-003

### 靜態資源快取

- 前端 build 產物檔名帶 hash(`app.[hash].js`)
- Hash 檔:`Cache-Control: public, max-age=31536000, immutable`
- HTML index:`Cache-Control: no-cache`(才能拉到新 hash 對應)

### Build 再現性

- Lock file(`package-lock.json` / `pnpm-lock.yaml` / `poetry.lock` / `go.sum`)必 commit
- 執行環境版本 pin:`.nvmrc` / `package.json engines` / `python_requires`
- CI build 用 `npm ci` / `pip install --require-hashes`,不用 `npm install`

### 依賴安全掃描

- CI 跑 `npm audit` / `pip-audit` / `mvn dependency-check`
- `trivy image <tag>` 掃 base image CVE
- 高風險漏洞不 merge;base image 定期升 patch 版本

---

## 通用

- **命名**:用途 > 類型(`userList` > `arr`);避免 `data` / `info` / `obj` 無資訊量命名
- **註解**:只寫 why,不寫 what
- **Log**:關鍵業務 + 異常;流量交 APM
- **錯誤處理**:只在能處理的層捕獲;不能處理往上拋,最外層統一格式化
