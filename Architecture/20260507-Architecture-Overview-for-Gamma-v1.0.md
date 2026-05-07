# AI-Spec Architecture 總覽

> 把 `Architecture/` 兩份藍圖 — **DataFlow** 與 **Harness Engineering BreakDown** — 整理成一份簡報級導覽。
>
> 用途:給高層 / PM / Tech Lead / DevOps / 新人在 30 分鐘內看懂「公司資料流要往哪走、AI Agent 要怎麼落地、Coolify 上線要過哪些合規」。
>
> 來源:
> - [`20260421-DataFlow-v1.0.md`](./20260421-DataFlow-v1.0.md)
> - [`20260507-Harness-Engineering-BreakDown-v1.0/README.md`](./20260507-Harness-Engineering-BreakDown-v1.0/README.md)

---

## 為什麼有這份簡報

`Architecture/` 不是規範,而是 AI-Spec 的「**為什麼**」。

- `Development/` 講「怎麼寫」、`Coolify-Deploy/` 講「怎麼部署」 — 都是 **how**
- `Architecture/` 講「公司資料怎麼流動、AI Agent 怎麼站上既有系統」 — 這是 **why & where**
- 規範只在這個藍圖成立的前提下,才有方向感

兩份藍圖 = 兩根支柱:**資料流** + **AI Agent 落地骨架**。

---

# 第一支柱:企業內部資料流整合 (DataFlow v1.0)

---

## 公司目前的五個「各做各的」

| 領域 | 現象 |
| --- | --- |
| **登入** | 每個系統自建帳號、自建權限 |
| **開發** | 同樣需求,兩個團隊做出兩套不相容的東西 |
| **資料** | 客戶 / 員工 / 幣別在多處被複製維護 |
| **部署** | 一套系統一台 VM,流量極低也整台機器開著 |
| **AI** | 資料散亂、格式不一,RAG 無法有效索引 |

> 這份藍圖把上述五件事連成 **一條資料流**。

---

## 資料流總覽

```
Microsoft AD(單一身分來源)
      │
      ▼
統一登入閘道(AD 登入器)
      │ token / session / logout
      ▼
業務核心系統(遵循 AI-Spec)
ERP / CRM / BPM / 跨部門工具 ...
      │ 讀寫
      ▼
企業中央資料中心(Data Hub / Master Data)
員工 / 權限 / 客戶 / 幣別 / 組織 / 代碼表 / 會計
      │ 匯出 / Stream
      ├──────────┬─────────────┐
      ▼                        ▼
   Seq(結構化 log)        AI RAG 知識庫
   觀測 / 除錯              Agentic AI 使用

所有服務皆部署於 Coolify(共用 Docker 基礎設施)
```

**核心口訣:一次登入、一套規範、一份資料、一個部署平台、一個知識庫。**

---

## 五大核心模組(總覽)

| # | 模組 | 一句話 |
| --- | --- | --- |
| 3.1 | **統一企業登入平台** | AD 為單一身分來源;業務系統不直連 AD,只認閘道 session |
| 3.2 | **開發標準規範** | 架構 / API / DB / 部署 / 資安 / Log 共同底線(本倉庫即是) |
| 3.3 | **企業中央資料中心(Data Hub)** | 共用主檔集中維護於一處,其他系統一律讀、不重複定義 |
| 3.4 | **Coolify 部署管理** | 唯一部署平台,Docker Compose 為部署單位 |
| 3.5 | **AI RAG 知識庫** | Agentic AI 助理的知識基座,資料源自 Data Hub + 業務交易 + 文件庫 + Seq |

---

## 模組 3.1 — 統一登入閘道

**為什麼要這樣做**
- **單一身分來源** — 員工離職停用一次,全公司系統立即失效
- **權限集中管理** — 角色 / 群組由 AD 管,新系統只需對應角色
- **減少資安面積** — AD 帳密不需重複散落於各業務系統

**模組內涵**
- 身分來源:Microsoft AD(on-prem 或 Entra ID)
- 協議:OIDC / SAML(視 AD 能力選一)
- Session 儲存:Redis,TTL 與 AD 政策對齊
- 單一登出:中央撤銷 → 各系統下次請求即 401
- 對開發者:依後端框架提供 `sso-init-*` 模板

**行為規範**
- 所有新系統 **一律** 整合此閘道,不得自建帳號系統
- 開發環境可用 mock,但必須能一鍵切回正式閘道

---

## 模組 3.2 — 開發標準規範

**規範地圖**

| 面向 | 文件 |
| --- | --- |
| Claude / 人共同遵守 | `Development/Claude/CLAUDE-v1.0.md` |
| 專案骨架與路由 | `Development/Project/spec/00-overview-v1.0.md` |
| 前後端 / DB / 部署設計 | `Development/Project/spec/01-design-notes-v1.0.md` |
| 自動化掃描規則 | `Development/Project/scan/scan-project-v1.0.md` |
| Coolify + Docker Compose | `Coolify-Deploy/Docker-Compose-Spec-v1.2.md` |
| SSO 整合 | `Development/Project/sso-init/` |

**為什麼**
- 新系統上線:從「重新設計架構」縮短為「套規範 → 寫業務邏輯」
- API 外殼 / 錯誤處理 / Log 格式統一,Seq + AI 才能集中分析
- 既有系統可用 `/scan-project` 自動比對,輸出偏差清單

---

## 模組 3.3 — 企業中央資料中心 (Data Hub)

**主檔涵蓋範圍**

| 類別 | 範例 | 維護單位 |
| --- | --- | --- |
| 組織 | 公司、部門、職位、成本中心 | HR / 財務 |
| 人員 | 員工、在職狀態、權限群組 | HR + AD 閘道 |
| 客戶 | 主檔、聯絡人、信用額度 | 業務 + 財務 |
| 代碼表 | 幣別、國家、單位、付款條件 | 財務 |
| 會計 | 科目、稅別、發票類型 | 財務 |
| 商品 / 物料 | 品項、BOM、價格階層 | 採購 / 業務 |

**鐵律**
- 業務系統 **禁止** 在自己的 DB 重複存主檔欄位
- 主檔欄位語意變更 → 升版 + 保留過渡期
- 任何寫入必經 audit log

---

## 模組 3.4 — Coolify 部署管理

**為什麼**
- 取代「一系統一 VM」,多個服務共用一台機器
- 環境變數 / secret / 網域設定都在後台,不用 SSH
- 回滾 / 重部署一鍵完成,**不需等 IT 進機器**

**配置硬規則**(摘自 Docker-Compose-Spec v1.2)
- 副檔名 `.yml`,禁 `.yaml`
- 不要定義 `networks` 區塊(Coolify 自動管理)
- 不要用 `${VAR:?error}` 語法
- `environment` 一律 `KEY: value` map 語法,禁 `- KEY=value` list
- Volume 必須命名,`latest` tag 禁用
- 標準服務:Postgres + Adminer + Seq

---

## 模組 3.5 — AI RAG 知識庫

**資料來源**
1. Data Hub 主檔(員工、客戶、代碼)
2. 各業務系統的交易摘要(匿名化 / 權限化後)
3. 文件庫(SOP、合約、技術文件)
4. Seq log 的營運脈絡(非 PII)

**技術內涵**
- Vector DB:pgvector(與主檔共用 Postgres)或 Qdrant
- Embedding:OpenAI / Voyage / 本地 BGE
- 推論:Claude / GPT / 本地模型(依情境挑)
- 索引觸發:Data Hub CDC + 文件庫 webhook
- 權限層:依 AD 群組過濾(Row-level security)

**鐵律**
- **髒資料不索引** — 進前先清洗與語意標註
- **PII 脫敏** — 電話 / 身分證 / 內部 IP 不入向量
- **每筆回答附來源** — UI 必顯示 citation
- **權限不得繞過** — 只能檢索使用者有權看的資料

---

## 兩個待解決的根本問題

### 問題 1 — 各系統重複建立資料表
- **現象**:員工 / 權限 / 客戶 / 幣別在不同系統各自維護,長期不一致
- **根因**:過去沒有中央主檔,每個團隊起專案就複製一份 schema
- **對策**:Data Hub 成為唯一寫入來源 + 規範禁止重複定義
- **指標**:新系統啟動時主檔欄位 0 複製、員工離職 1 小時內全失效

### 問題 2 — 雲端機器成本偏高
- **現象**:流量極低的工具獨佔 VM,整月幾乎 idle 卻仍計費
- **根因**:預設「一系統 = 一 VM」+ 沒有統一部署平台
- **對策**:統一上 Coolify + 低流量降規 / 合併 + 設資源上限 + 半年無用主動下線
- **指標**:單台機器平均承載服務 ≥ 5、月雲端帳單年對比下降

---

## 雲端成本架構:為什麼成本是「架構問題」

雲端成本大多 **不是** 被單一貴的服務吃掉,而是 **長尾的 idle 資源累加而成**。

> 結論:**省錢不是砍一台大機器,而是改變部署模式。** 因此成本屬於架構決策,不是財務議題。

**痛點(一系統一 VM 模式)** — 即使 0 流量還是要付:

| 項目 | 0 流量是否付費 |
| --- | :---: |
| VM 常駐費用 | ✅ |
| 區塊儲存(磁碟) | ✅ |
| 固定 IP / LB | ✅ |
| 備份快照 | ✅ |
| 監控 / agent 授權 | ✅ |
| 流量(egress) | ❌ |

---

## 本公司 DevOps 現況限制

> ⚠️ 兩個硬限制決定了部署模式選擇:
> 1. **沒有 Kubernetes 基礎建設** — 無 cluster、無專職維運人力
> 2. **Serverless 僅限 GCP / AWS 環境** — 其他雲或地端無此能力

| 模式 | 低流量成本 | 高流量成本 | 運維複雜度 | 我們能用嗎 |
| --- | :---: | :---: | :---: | --- |
| 一系統一 VM(現狀) | 🔴 高 | 🟡 中 | 🟡 中 | ✅ 可,但最貴 |
| **共用 VM + Coolify** | 🟢 低 | 🟡 中 | 🟢 低 | ✅ **主力路線** |
| Serverless(GCP/AWS) | 🟢 極低 | 🔴 失控 | 🟢 低 | ⚠️ 限特定情境 |
| Replit / 託管 | 🟢 低 | 🔴 受限 | 🟢 極低 | ✅ 個人工具 |

**為什麼落在 Coolify** — K8s 不在選項內、Serverless 場景受限、一 VM 一系統最貴 → Coolify 最平衡。

---

## 6 大成本優化手法(依影響力排序)

1. **共用基礎設施** — 一台機器跑多 container、共用 Postgres(schema 隔離)、共用 Seq
   > 典型結果:5 台 2vCPU/4GB → 1 台 4vCPU/16GB,**帳單下降 ~70%**
2. **分層部署** — Tier 1 生產關鍵獨立、Tier 2 內部工具共用、Tier 3 實驗最小規格 + 可下線
3. **資源邊界** — Compose 一律設 `limits` 與 `reservations`,避免 noisy neighbor
4. **排程啟停** — 開發 / 報表服務非上班時段自動關
   > 40h / 168h 計算,可省 **~76%** 常駐費
5. **儲存與 log 分層** — Seq 30 天熱存、備份滾動、上傳 90 天後轉 IA
6. **CDN + 監控告警** — 前端 hash 檔走 CDN、Billing 設每日閾值、token 服務設預算上限

---

## 階段性交付路線圖

| 階段 | 核心交付 |
| --- | --- |
| Phase 0 | 本藍圖 + 規範共識(各部門 IT 對口同步) |
| Phase 1 | AD 登入閘道 + `sso-init-*` 模板 |
| Phase 2 | Data Hub MVP(員工 + 客戶 + 代碼表) |
| Phase 3 | Coolify 標準化 + Seq 上線 |
| Phase 4 | `/scan-project` 擴充 Data Hub 規則 |
| Phase 5 | AI RAG MVP + 文件庫整合 |
| Phase 6 | 舊系統收斂(資料遷移、成本優化) |

> 文件只標示 **先後邏輯**,不綁定日期。

---

# 第二支柱:Harness Engineering BreakDown v1.0

---

## 為什麼要這份 BreakDown

公司正逐步把 **AI / Agent 導入既有系統**(ERP、CRM、跨部門工具)。原始架構圖一張塞了 5 大層 + 飛輪 + 兩塊用途,**訊息密度過高,沒人有辦法一次學完**。

實務上會遇到三個問題:

1. **新人無從下手** — 不知道從哪一層開始讀
2. **跨角色溝通失準** — PM 以為 Tech Lead 在處理 Harness 合規,Tech Lead 以為 DevOps 處理 Sandbox
3. **Coolify 上線時才發現缺項** — Sandbox / Audit / Secret / Observability 不齊,卡在部署前一刻

**解法:依「圖層」切 6 個單元 × 依「角色」標必修深度 × 依「Coolify 合規」反推可驗收成果。**

---

## 6 個學習單元一覽

| 單元 | 對應圖層 | 核心內容 | Coolify 合規關聯 |
| :-: | --- | --- | --- |
| **U1** | ① 公司/業務情境 | 提升交付效率、知識複用、跨部門協作 | 無(決定 SLA) |
| **U2** | ② Agentic Engineer 人類角色 | 定義目標、設計工作流、審查、持續改善 | 核准 deploy 的人 |
| **U3** | ③ Agentic Engineering | Control Plane / Leader Agent + 6 種 Agent 分工 | 維運 Agent → Coolify 告警 |
| **U4** | ④ Harness Engineering | Prompts / Tools / Memory / Sandbox / CI / Observability / Hooks / Audit | **★ 主要合規層** |
| **U4.5** | ④.5 Domain Model Flywheel | Evals → Reward → Trajectories → Fine-tuning → Domain Model | 模型版本化 / 訓練資料 audit |
| **U5** | ⑤ 基礎資源 | LLM / Repo / PLM / Test Logs / SOP / Dashboard | Repo + Dashboard 直連 Coolify |

---

## 角色 × 必修矩陣

> ✅深 = 必須能講出細節並設計;✅淺 = 知道存在、知道找誰負責;— = 可不修。

| 角色 | U1 | U2 | U3 | U4 | U4.5 | U5 | Coolify |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| 高層 / 業務主管 | ✅深 | ✅淺 | ✅淺 | — | — | — | — |
| PM / 產品 | ✅深 | ✅深 | ✅深 | ✅淺 | — | ✅淺 | ✅淺 |
| **Agentic Engineer / Tech Lead** | ✅深 | ✅深 | ✅深 | ✅深 | ✅深 | ✅深 | ✅深 |
| Backend / DevOps(Coolify Owner) | ✅淺 | — | ✅淺 | ✅**深★** | ✅淺 | ✅**深★** | ✅**深★** |
| QA / NPI | ✅淺 | — | ✅深 | ✅深 | ✅深 | ✅淺 | ✅淺 |
| ML / Data | ✅淺 | — | ✅淺 | ✅淺 | ✅**深★** | ✅深 | ✅淺 |
| 新人 / 一般工程師 | ✅淺 | ✅淺 | — | ✅淺 | — | ✅深 | — |

> **口訣:上越決方向,下越落合規。**
> 高層讀 U1 / U2 即可;Coolify Owner 必過 U4 + U5 + 附件。

---

## 6 條 Coolify Deploy 合規通則

新專案上線前需逐條打勾:

1. **容器與映像** — Dockerfile 多階段、image tag 不用 `latest`、根目錄不寫入
2. **Secret 管理** — `.env` gitignore、Coolify 後台覆蓋、`.env.example` 只放佔位
3. **權限與隔離** — Agent 不能任意 exec、MCP 工具白名單、Sandbox 限制檔案系統
4. **可觀測性** — stdout 結構化 log、metrics 外送(Seq / Dashboard)、Trace ID 串聯
5. **CI/CD 與 Webhook** — push → Coolify auto deploy、`/scan-project` 必過、健康檢查端點
6. **Audit Trail** — 誰部署、誰改 Prompt、誰核准模型上線,皆可回溯

> 完整定義見 `Coolify-Compliance-Mapping.md`。

---

## 學習路徑(依角色)

| 角色 | 時數 | 路徑 |
| --- | :-: | --- |
| 高層 / 業務主管 | 30 分 | `U1` → `U2` 為什麼一節 → 矩陣 |
| PM / 產品 | 2 h | `U1` → `U2` → `U3` → `U4` 8 元件 → `U5` PLM/SOP → 附件 PM 簽核 |
| **Tech Lead** | 1 day | 全本依序 → 完成附件「Tech Lead 自我檢核 20 題」 |
| Backend / DevOps | 半天 | `U4` ★ → `U5` ★ → 附件 ★ → 對到 Docker-Compose-Spec |
| QA / NPI | 2 h | `U3` 測試/品質 Agent + `U4` Verification/Tests/CI + `U4.5` Evals |
| ML / Data | 3 h | `U4.5` 全本 → `U5` 全本 → 附件模型版本化章節 |
| 新人 / 一般工程師 | 1 h | `U5` → `U1`/`U2` → `U4` 8 元件總覽 |

---

# 兩支柱如何相互補強

---

## DataFlow ↔ Harness Engineering

| 面向 | DataFlow 的角色 | Harness Engineering 的角色 |
| --- | --- | --- |
| **資料** | 定義「主檔在哪、誰寫」 | 定義「Agent 能讀什麼、怎麼脫敏」 |
| **登入** | AD 閘道 = 全公司唯一身分 | Agent 也走相同閘道,不繞權限 |
| **部署** | Coolify 為唯一平台 | 6 條合規通則 = Coolify 上線門檻 |
| **觀測** | Seq 為集中 log | Trace ID + Audit Trail 串到 Seq |
| **AI** | RAG 知識庫吃 Data Hub + 文件庫 | Domain Model Flywheel 餵新資料回模型 |

> **沒有 DataFlow,Harness 沒有資料可用;沒有 Harness,Agent 沒有可控的執行底座。**

---

## 給不同角色的 30 秒指引

- **高層 / 業務主管** — 看 DataFlow §一、§二;Harness BreakDown 第三節矩陣。**結論:這條路會省成本、降資安面積、讓 AI 真的可用。**
- **PM / 產品** — DataFlow 五大模組 + 階段交付;Harness U1~U3 + 6 條合規。**結論:排需求時要對到模組,別跳過 SSO / Data Hub。**
- **Tech Lead** — 全部讀完 + 對應規範文件。**結論:你是 6 條合規的最終守門人。**
- **Backend / DevOps** — Coolify §3.4 + 成本架構 §五;Harness U4 + U5 + 附件。**結論:你決定整個專案能不能上線。**
- **新人** — Harness U5 → U1/U2 → DataFlow §二 →「資料流情境實例」§六。

---

## 接下來要做什麼

1. **內部 review** — 把這份簡報投在每月 IT 會議,對齊各部門 IT 對口
2. **個別 deep-dive** — Coolify Owner 排半天讀 U4 + U5 + Compliance Mapping,並對到自己負責的服務
3. **新專案啟動** — 用 `Development/Project/Template/` 起骨架,跑 `/scan-project` 檢查 6 條合規
4. **回饋進主分支** — 任何遇到的「規範 vs 實務」衝突,提 PR 改規範,不要改 code 繞過規範

---

## 文件索引

| 文件 | 路徑 |
| --- | --- |
| DataFlow 總藍圖 | `Architecture/20260421-DataFlow-v1.0.md` |
| Harness BreakDown README | `Architecture/20260507-Harness-Engineering-BreakDown-v1.0/README.md` |
| Coolify Compliance Mapping | 同上目錄下 `Coolify-Compliance-Mapping.md` |
| 各學習單元 | 同上目錄 `U1` ~ `U5` |
| 開發規範 | `Development/Project/spec/` |
| Coolify 部署規格 | `Coolify-Deploy/Docker-Compose-Spec-v1.3.md` |

> **本簡報只是入口。每張投影片都對應一份原始文件,Tech Lead 與 DevOps 必須讀原文。**
