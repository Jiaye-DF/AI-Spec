# Harness Engineering 架構 BreakDown v1.0

> 定位:把 [`Harness Engineering Arch.` 架構圖](../../../../Harness%20Engineering%20Arch..jpg)拆成「**6 個學習單元 × 角色矩陣 × Coolify 合規對照**」,讓不同層級的人各自學該學的部分,且最終結果可順利通過公司 Coolify Deploy 合規門檻。
> 目標讀者:全公司 IT(高層 / PM / Tech Lead / Backend / DevOps / QA / ML / 新人皆有對應路徑)。
> 互補文件:
>  - [`20260421-DataFlow-v1.0.md`](../20260421-DataFlow-v1.0.md) — 公司資料流總藍圖
>  - [`Coolify-Deploy/Docker-Compose-Spec-v1.2.md`](../../Coolify-Deploy/Docker-Compose-Spec-v1.2.md) — Coolify 部署規格
>  - [`Development/Project/spec/00-overview-v1.0.md`](../../Development/Project/spec/00-overview-v1.0.md) — 五大開發原則

---

## 一、為什麼要這份 BreakDown

公司目前正逐步把 AI / Agent 導入既有系統(ERP、CRM、跨部門工具)。原始架構圖一張塞了 5 大層 + 飛輪 + 兩塊用途,**訊息密度過高,沒人有辦法一次學完**。實務上會遇到三個問題:

1. **新人無從下手** — 不知道從哪一層開始讀。
2. **跨角色溝通失準** — PM 以為 Tech Lead 在處理 Harness 合規,Tech Lead 以為 DevOps 處理 Sandbox。
3. **Coolify 上線時才發現缺項** — Sandbox / Audit / Secret / Observability 不齊,卡在部署前一刻。

本 BreakDown 解法:

- **依「圖層」切 6 個學習單元**(U1 ~ U5,U4 拆 U4 + U4.5)。
- **依「角色」標出每單元必修深度**(✅深 / ✅淺 / —)。
- **依「Coolify 合規」反推每單元必須產出哪些可驗收的成果**。

---

## 二、學習單元一覽

| 單元 | 對應圖層 | 核心內容 | Coolify 合規關聯 | 文件 |
| --- | --- | --- | --- | --- |
| **U1** | ① 公司/業務情境 | 提升交付效率、知識複用、跨部門協作 | 無(決定 SLA) | [U1-Business-Context.md](U1-Business-Context.md) |
| **U2** | ② Agentic Engineer 人類角色 | 定義目標、設計工作流、審查、持續改善 Harness | 核准 deploy 的人 | [U2-Agentic-Engineer-Role.md](U2-Agentic-Engineer-Role.md) |
| **U3** | ③ Agentic Engineering 上層工作流 | Control Plane / Leader Agent + 6 種 Agent 分工 | 維運 Agent → Coolify 告警 | [U3-Agentic-Engineering.md](U3-Agentic-Engineering.md) |
| **U4** | ④ Harness Engineering 執行底座 | Prompts / Tools / Memory / Sandbox / CI / Observability / Hooks / Audit | **★ 主要合規層** | [U4-Harness-Engineering.md](U4-Harness-Engineering.md) |
| **U4.5** | ④.5 Domain Model Flywheel | Evals → Reward → Trajectories → Fine-tuning → Domain Model | 模型版本化 / 訓練資料 audit | [U4.5-Domain-Model-Flywheel.md](U4.5-Domain-Model-Flywheel.md) |
| **U5** | ⑤ 基礎資源 | LLM / Repo / PLM / Test Logs / SOP / Dashboard | Repo + Dashboard 直連 Coolify | [U5-Foundation-Resources.md](U5-Foundation-Resources.md) |
| **附件** | — | 6 條 Coolify 合規通則完整對照 | ★ 上線前必過 | [Coolify-Compliance-Mapping.md](Coolify-Compliance-Mapping.md) |

---

## 三、角色 × 必修矩陣

> ✅深 = 必須能講出細節並設計;✅淺 = 知道存在、知道找誰負責;— = 可不修。

| 角色 | U1 | U2 | U3 | U4 | U4.5 | U5 | Coolify 對照 |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| 高層 / 業務主管 | ✅深 | ✅淺 | ✅淺 | — | — | — | — |
| PM / 產品 | ✅深 | ✅深 | ✅深 | ✅淺 | — | ✅淺 | ✅淺 |
| **Agentic Engineer / Tech Lead** | ✅深 | ✅深 | ✅深 | ✅深 | ✅深 | ✅深 | ✅深 |
| Backend / DevOps(Coolify Owner) | ✅淺 | — | ✅淺 | ✅**深★** | ✅淺 | ✅**深★** | ✅**深★** |
| QA / NPI | ✅淺 | — | ✅深(測試/品質 Agent) | ✅深(CI/Tests) | ✅深(Evals) | ✅淺 | ✅淺 |
| ML / Data | ✅淺 | — | ✅淺 | ✅淺 | ✅**深★** | ✅深 | ✅淺 |
| 新人 / 一般工程師 | ✅淺 | ✅淺 | — | ✅淺 | — | ✅深 | — |

口訣:**「上越決方向,下越落合規。」** 高層讀 U1 / U2 即可,Coolify Owner 必過 U4 + U5 + 附件。

---

## 四、6 條 Coolify Deploy 合規通則(摘要)

完整定義見 [Coolify-Compliance-Mapping.md](Coolify-Compliance-Mapping.md)。新專案上線前需逐條打勾。

1. **容器與映像** — Dockerfile 多階段、image tag 不用 `latest`、根目錄不寫入。
2. **Secret 管理** — `.env` gitignore、Coolify 後台覆蓋、`.env.example` 只放佔位。
3. **權限與隔離** — Agent 不能任意 exec、MCP 工具白名單、Sandbox 限制檔案系統。
4. **可觀測性** — stdout 結構化 log、metrics 外送(Seq / Dashboard)、Trace ID 串聯。
5. **CI/CD 與 Webhook** — push → Coolify auto deploy、`/scan-project` 必過、健康檢查端點。
6. **Audit Trail** — 誰部署、誰改 Prompt、誰核准模型上線,皆可回溯。

---

## 五、學習路徑建議

### 5.1 高層 / 業務主管(30 分鐘)
`U1` → `U2`(僅讀「為什麼需要這個角色」一節)→ 跳讀本 README 第三節矩陣。

### 5.2 PM / 產品(2 小時)
`U1` → `U2` → `U3` → `U4` 的「8 元件總覽」一節 → `U5` 的「PLM/BOM 與 SOP」一節 → 附件第三節「PM 簽核項」。

### 5.3 Agentic Engineer / Tech Lead(1 天)
全本依序讀 → 完成附件最末的「Tech Lead 自我檢核 20 題」。

### 5.4 Backend / DevOps(Coolify Owner,半天)
`U4`(★ 完整)→ `U5`(★ 完整)→ 附件(★ 完整)→ 對照 [`Docker-Compose-Spec-v1.2.md`](../../Coolify-Deploy/Docker-Compose-Spec-v1.2.md) 把 6 條對到自己負責的服務。

### 5.5 QA / NPI(2 小時)
`U3` 的「測試/品質 Agent」 + `U4` 的「Verification / Tests / CI」 + `U4.5` 的「Evals」 → 附件第二條「可觀測性」。

### 5.6 ML / Data(3 小時)
`U4.5` 全本 → `U5` 全本 → 附件「模型版本化 / 訓練資料 audit」相關章節。

### 5.7 新人 / 一般工程師(1 小時)
`U5` 全本(認識基礎資源)→ `U1` / `U2`(知道公司在玩什麼)→ `U4` 的「8 元件總覽」一節即可。

---

## 六、版本與維護

- **v1.0(2026-05-07)** — 首版,依架構圖原始 5 層拆解,Coolify 合規取自當前 Coolify + Docker Compose 環境(無 K8s)。
- 後續變更:架構圖更新時,本目錄連同單元一併升版,避免單檔散落不同版本。
- 修正規則:任何 Coolify 合規條目調整,**必須同步更新附件 + 對應單元的 Coolify 章節**,不可只改其中一處。
