# Project Overview v1.0 — 專案基本架構

> 用 AI 開發專案的預設架構模板。新專案啟動依此建骨架。
> 互補:[`CLAUDE-v1.0.md`](../../Claude/CLAUDE-v1.0.md)、[`scan-project-v1.0.md`](../scan/scan-project-v1.0.md)、[`Docker-Compose-Spec-v1.2.md`](../../../Coolify-Deploy/Docker-Compose-Spec-v1.2.md)、`sso-init-*`

---

## 五大原則

1. **首頁永遠是登入頁** — `/` 未登入顯示登入表單;已登入 302 `/dashboard`
2. **未通過驗證一律 302 `/?redirect=<原路徑>`** — 頁 / API 一致,無例外
3. **API 帶版本前綴 `/api/v{n}`**,受保護端點過 auth middleware;未通過 401,無權限 403
4. **Response 外殼統一** `{ code, responseCode, message, data }`(`responseCode` = 原始 HTTP status 整數)
5. **環境變數三階段** — `.env.example`(commit 佔位)/ `.env`(本地 gitignore)/ Coolify 後台(線上覆蓋);build-time 變數(`VITE_*` / `NEXT_PUBLIC_*`)走 **build args**,非 runtime env

> 驗證**實作**(token 儲存、session、refresh)以 `sso-init-*` 為準,本檔只規範行為。

---

## 預設技術棧

前端 Next.js 16 App Router / Vue 3 + Vite | 後端 FastAPI / Express(TS) / Spring Boot | DB PostgreSQL + Adminer | Log Seq | 部署 Coolify + Docker Compose | 登入 DF-SSO

---

## 路由規則

### 前端

| 路徑 | 身分 | 行為 |
| --- | --- | --- |
| `/` / `/login` | 公開 | 未登入顯示登入 / 已登入 302 `/dashboard` |
| `/logout` | 受保護 | 清 session + SSO 登出 → `/` |
| `/dashboard` | 受保護 | 登入預設落點 |
| 其他受保護頁 | 受保護 | 未登入 → 302 `/?redirect=<原路徑>` |

### 後端

業務 API 一律 `/api/v{n}`,破壞性變更升版並保留舊版過渡期。

| 路徑 | 身分 | 行為 |
| --- | --- | --- |
| `/api/v1/auth/*` | 公開 | 登入 / callback / logout |
| `/api/v{n}/*` | 受保護 | 過 auth;401 / 403 |
| `/api/docs` | 公開 | Swagger 彙整所有版本 |
| `/health` `/version` | 公開 | 監控(不帶版本) |

**版本規則**:從 `v1` 起步不可省略;breaking change → `v{n+1}` 且舊版保留過渡期;非破壞性變更留在當前版本;版本只放路徑,不放 header。

### 未授權處理(三層一致)

- 頁面 middleware → 302 `/?redirect=<原路徑>`
- 前端 API client 收 401 → 清狀態 → 302 `/?redirect=<目前頁>`
- 後端 API middleware → 401 `AUTH_REQUIRED` / `AUTH_EXPIRED`;403 `FORBIDDEN`

**權限必雙層**:前端藏按鈕 + 後端 403。只藏前端 = 資安漏洞。

---

## 最小檔案骨架

**前端**
```
src/
  app/(auth)/login/         # 公開
  app/(main)/dashboard/     # 受保護
  app/layout.tsx            # 根 layout + auth 檢查
  lib/api.ts                # 統一 api client
  lib/auth.ts               # 驗證工具(實作見 sso-init-*)
  components/  types/
```

**後端**
```
src/
  routes/v1/ routes/v2/     # 版本化,每資源一檔
  services/                 # 業務邏輯(通常跨版本共用)
  middleware/               # auth / rate-limit / logger
  schemas/v1/ schemas/v2/   # 輸入驗證
  lib/                      # db / config
migrations/
```

**根目錄必備**:`.env.example` / `.gitignore`(含 `.env`)/ `.dockerignore` / `README.md` / `Dockerfile` / `docker-compose.yml`

---

## 登入流程(DF-SSO)

1. 訪問 `/` → 登入按鈕 → 導 SSO → 驗證 → callback 回本站
2. callback 建立本站 session → 302 `/dashboard`(或 `redirect` 指定頁)
3. 登出 → 清 session + SSO 撤銷 → 302 `/`
4. Session 被中央撤銷 → 下次受保護請求立即 401

實作(session 儲存、憑證格式、refresh)以 `sso-init-*` 為準。
