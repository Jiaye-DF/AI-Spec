# &lt;System&gt; — 架構 Breakdown

> **定位**:&lt;一句話描述本系統做什麼;對應的業務目標&gt;。
> **目標讀者**:&lt;標出哪些角色該讀;對應第三節矩陣&gt;。
> **互補文件**:
> - 視覺層:[`diagram.html`](diagram.html)(主架構圖 + 子流程圖,同一檔切換)
> - 規範地板:`docs/Design-Base/`
> - 版本任務:`docs/Tasks/v*/`

---

## 一、為什麼有這份 Breakdown

&lt;描述當前痛點 / 為什麼一張圖不夠 / Breakdown 解決什麼問題。3–5 點。&gt;

例:
- 新人看不懂單張架構圖,訊息密度過高
- PM / Backend / DevOps 各看不同層級的關注點
- Coolify 部署前一刻才發現缺項(audit / log / healthcheck)
- ...

本 Breakdown 解法:
- **依「層級」切**:Edge / Application(Presentation + Business + Cross-cutting)/ Data
- **依「角色」標必修**:✅深 / ✅淺 / —
- **依「流程」反查**:每條業務流程穿過哪些架構節點

---

## 二、架構層級總覽

對應 [`diagram.html`](diagram.html) 工具列「① 系統架構(主)」。

| 層級 | 內容 | Owner | Coolify 合規要點 |
| --- | --- | --- | --- |
| **Edge** | Caddy / Coolify Proxy / TLS / Domain | DevOps | TLS 自動續簽 / domain whitelist |
| **Application — Presentation** | React UI / RTK Query / i18n | Frontend Team | bundle size / CSP / 不洩漏內部 ID |
| **Application — Business** | FastAPI Routers / Domain Services | Backend Team | OpenAPI / Pydantic / 分層不互調 |
| **Application — Cross-cutting** | Auth / Logging / Audit | Backend + Security | JWT httpOnly / 結構化 log / 不洩 PII |
| **Data** | PostgreSQL(asyncpg) | DBA + Backend | 連線池 / 軟刪除 / 備份 |
| **外部信任邊界** | Sentry / Loki(可觀測性) | 各服務 owner | webhook 簽章 / PII 過濾 |

> Redis / SSO / Payment 等屬選用三方服務(`docs/Design-Base/90-third-party-service/`);若採用,需在本表追加列並擴充 `diagram.html` 主架構圖。

### 跨切關注點(Cross-cutting)為什麼獨立一層

- **Auth**:不可重複實作於每個 router;集中管理 token / RBAC
- **Logging**:結構化 stdout → Loki / Sentry,避免散落
- **Audit**:legal / 合規要求,單一進入點才能保證完整性

---

## 三、角色 × 必修矩陣

> ✅深 = 必須能講出細節並設計;✅淺 = 知道存在、知道找誰負責;— = 可不修。

| 角色 | Edge | Pres | Biz | Cross-cutting | Data | 外部 |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| 高層 / 業務主管 | — | — | ✅淺 | — | — | ✅淺 |
| PM / 產品 | — | ✅淺 | ✅深 | ✅淺 | ✅淺 | ✅淺 |
| **Tech Lead** | ✅深 | ✅深 | ✅深 | ✅深 | ✅深 | ✅深 |
| Frontend | — | ✅深 | ✅淺 | ✅淺 | — | ✅淺 |
| Backend | ✅淺 | ✅淺 | ✅深 | ✅深 | ✅深 | ✅深 |
| DevOps | ✅深 | — | ✅淺 | ✅淺 | ✅淺 | ✅淺 |
| QA / NPI | ✅淺 | ✅深 | ✅深 | ✅深 | ✅淺 | ✅淺 |
| 新人 | ✅淺 | ✅淺 | ✅淺 | — | ✅淺 | — |

口訣:**「上看流程,下看合規。」** PM 讀流程圖即可;DevOps 必過 Edge + Cross-cutting + 外部。

---

## 四、子流程清單

對應 [`diagram.html`](diagram.html) 工具列下拉。每條流程都標出「**對應架構節點**」與「**為什麼存在**」,讓人從架構圖回查到實際路徑。

| # | 流程 | 對應架構節點 | 為什麼 | Owner |
| --- | --- | --- | --- | --- |
| ② | Auth(JWT 登入) | User → Proxy → UI → API → Auth → DB | JWT httpOnly cookie 防 XSS;bcrypt 比對密碼 | Backend + Security |
| ③ | Deploy(Coolify CD) | External(GitHub)→ Proxy → 服務重啟 | main push 即部署 + 健康檢查自動回滾 | DevOps |
| &lt;...&gt; | &lt;新增流程時加列&gt; | | | |

### 新增子流程的步驟

1. 開啟 [`diagram.html`](diagram.html),找到任一 `<script type="text/plain" id="flow-XXX">` 區塊
2. 複製整段 → 改 `id` / `data-label` / `data-desc`
3. 把 `data-desc` 寫清楚「對應架構節點」+「為什麼存在」
4. 修改下方 Mermaid 內容
5. 存檔 → 重新整理瀏覽器 → 工具列下拉自動列出新流程
6. 把該流程加進本檔第四節表格

---

## 五、學習路徑建議

### 5.1 高層 / PM(30 分鐘)
打開 [`diagram.html`](diagram.html) → ① 系統架構,讀本檔第二節,跳讀第三節矩陣。

### 5.2 Tech Lead(1 小時)
全本依序讀 → ① + 所有 ② / ③ 流程都看一遍 → 對照 `docs/Design-Base/` 各層規範。

### 5.3 Frontend / Backend(30 分鐘)
讀第二節該層級欄位 → 開 [`diagram.html`](diagram.html) 看自己負責的流程(② / ③ ...)。

### 5.4 DevOps(40 分鐘)
讀第二節 Edge / Cross-cutting / Data → 開 [`diagram.html`](diagram.html) ③ Deploy 流程 → 對照 `docs/Design-Base/06-Coolify-CD/`。

### 5.5 新人(20 分鐘)
讀第二節「架構層級總覽」 → 開 [`diagram.html`](diagram.html) 把每個下拉項看過一遍。

---

## 六、與其他資料夾的關係

| | 本 bundle | `docs/Arch/adr/` | `docs/Design-Base/` | `docs/Tasks/` |
| --- | --- | --- | --- | --- |
| 內容 | 主架構 + 子流程視覺 + Breakdown | 決策紀錄 | 實作規範 | 單版本任務 |
| 變動 | 低(架構變才動) | 不可變 | 低 | 高 |
| 形式 | 1 HTML + 1 README | N 份 ADR md | N 份規範 md | 版本資料夾 |

規則優先序:`docs/Design-Base/* > docs/Arch/* > AGENTS.md / CLAUDE.md > docs/Tasks/*`

---

## 七、版本與維護

- **v1.0(YYYY-MM-DD)** — 首版,依當前架構切 N 個流程
- 架構變動 → 主圖 + 對應流程同步更新,本檔表格同步
- 修正規則:任何架構節點 rename / 移動 → 子流程的 `data-desc` 必須同步,**禁**留 dangling reference
