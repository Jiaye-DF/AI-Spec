# Harness Engineering 架構 BreakDown v1.0 — Vibe Coding 公司版

> 定位:把 [`Harness Engineering Arch.` 架構圖](../../../../Harness%20Engineering%20Arch..jpg)**公司化客製**為「**6 學習單元 × 三角色色碼 × Coolify 合規 × Data Hub 整合**」,讓 Vibe Coding 公司(業務人員以 AI 自然語言驅動開發、IT 建治理底座)各角色快速定位該讀的層。
> **與原 Harness 架構的差異**:
> 1. **三色角色碼**(diagram.html 內視覺強化):🟢 使用者 / 🔵 IT(含 Agentic Engineer)/ 🟣 共同 / 🔴 ★ Critical
> 2. **加入 Data Hub**:L5 基礎資源新增主檔資料中心節點(對應 [`DataFlow v1.0 § 3.3`](../20260421-DataFlow-v1.0.md)),並單獨出圖 ⑤.2 表達跨層連動
> 3. **Agentic Engineer 屬 IT**(非共同角色):這是 Vibe Coding 公司的定位 — Engineer 是「把業務口語變可重複 Spec」的技術職
>
> 目標讀者:全公司(業務 / PM / Tech Lead / Agentic Engineer / DevOps / QA / 新人皆有對應路徑)。
> 互補文件:
>  - [`20260421-DataFlow-v1.0.md`](../20260421-DataFlow-v1.0.md) — 公司資料流總藍圖
>  - [`Coolify-Deploy/Docker-Compose-Spec-v1.3.md`](../../Coolify-Deploy/Docker-Compose-Spec-v1.3.md) —Coolify 部署規格
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

## 視覺索引(diagram.html)

互動式 Demo 簡報網頁:[`diagram.html`](diagram.html)(雙擊瀏覽器即開)。

**操作:**
- **翻頁**:`← / →` / `空白鍵` / `Home / End` / 右上 picker
- **放大縮小**:`+ / -` / `0` 重設 / `F` 符合視窗 / `Ctrl + 滾輪`
- **匯出**:複製 SVG、下載 SVG / PNG(2× 解析度)

### 17 張 slide 線性順序

| 序 | 工具列標籤 | 重點 / 對應 |
| --- | --- | --- |
| 0 | 0. 封面 / Vibe Coding 公司版 | 三色定義 + Demo 導覽說明 |
| 0.1 | 0.1 為什麼需要 Harness(Before vs After) | Model-only 失控 vs 8 元件治理對比 |
| 1 | 1. 五層架構總覽 | L1→L2→L3→L4 線性 + L4.5 / L5 雙腳 |
| 1.1 | 1.1 三角色責任分布(6 單元 × 三色) | RACI 總圖 — 每個角色該管哪幾格 |
| 2 | U2 — Agentic Engineer 4 大職責 | Vibe Coding 公司關鍵差異(★ 新增) |
| 3 | U3 — Agentic Engineering 上層工作流 | Control Plane + 6 種 Agent(設計 Review / 測試驗證 染共同)|
| 3.1 | U3.1 — Control Plane 內部運作 | Leader 三職責 + 回寫 Memory |
| 4 | U4 — Harness 8 元件 ★ | 管理面(設計時,6 項)+ 執行面(運行時,2 項)|
| 4.1 | U4.1 — Sandbox ★ 三層隔離 | Coolify 合規第 3 條(User NS / FS / Network)|
| 4.2 | U4.2 — Memory 雙層架構 | Redis 短期 + RAG 長期 + 業務 SME 驗收 |
| 4.3 | U4.3 — Verification / CI Pipeline | Prompt 改 = code 改;Lint + Eval 雙關卡 |
| 4.4 | U4.4 — Audit Trail 軌跡 | append-only,誰部署 / 誰改 Prompt |
| 5 | U4.5 — Domain Model Flywheel | 6 元件不可跳序;Reward 由業務確認 |
| 5.1 | U4.5.1 — Reward 標記循環 | Engineer(IT)審查 → 業務確認 ground truth |
| 6 | U5 — 基礎資源 / 系統 | Row 1 IT 平台(3 項)+ Row 2 業務知識(4 項)|
| 6.1 | U5.1 — Coolify 連動 2 個關鍵資源 | Repo + Dashboard 直連 Coolify |
| 6.2 | U5.2 — Data Hub 跨層連動 | 業務 SME 維護主檔 + IT 建 ETL |

> **U1 不出圖**:業務情境以文字承載即可(見 [U1-Business-Context.md](U1-Business-Context.md))。U2 因為是 Vibe Coding 公司關鍵差異,**新版補出一張圖**(序 2)。
> **編號規約**:統一用 `U<unit>.<sub>` 半形數(對齊 MD 檔名);picker 與本表索引完全一致。
> **新增 slide**:`0.1 Before vs After`、`1.1 RACI`、`U2 Engineer 4 大職責` 三張是 v1.0 → v1.1 新加,專為 Demo 線性敘事補位。
> **圖內容變動 → MD 同步**:`diagram.html` 是視覺層,單元 MD 是文字層。改架構節點 / 元件名稱時,兩處須一致(由本檔 § 六維護準則收口)。

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

## 三、角色三色對照(Vibe Coding 公司專屬)

`diagram.html` 內所有節點都依下表三色染色,工具列右上 legend 永遠顯示:

| 色 | 角色 | 公司內對應 | 在架構中的位置 |
| --- | --- | --- | --- |
| 🟢 **使用者** | 業務人員 / 業務主管 / PM | 不寫傳統 code,用 AI 自然語言驅動工作 | L1 業務情境、需求 Agent / 主管報告 Agent、Audit Trail 可審計人物 |
| 🔵 **IT** | Agentic Engineer / Backend / DevOps / Tech Lead | 建 Harness、定 Spec、跑 Eval、維運 Coolify | L2 Engineer、L3 Control Plane、L4 Harness 全 8 元件、L5 LLM/Repo/Dashboard |
| 🟣 **共同** | 需要業務 ground truth + IT 工程化 | QA/NPI、業務 SME(SOP)、HR/採購(主檔維護) | 品質 Agent、L4.5 Flywheel(Reward 標記)、L5 PLM/SOP/Test Logs/Data Hub |
| 🔴 ★ **Critical** | (顏色覆蓋,優先標示)| Coolify 合規關鍵點 | L4 Sandbox、L5 Repo/Dashboard、Reward 約束(LLM 不可自評)|

> 「★ Critical」是**附加標記**,不是第四種角色 — 它表達「即使你是 IT,這個節點也必須**特別小心**」。

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
- **v1.1(2026-05-11)** — Demo 化改版,專注於可直接當簡報用:
  - **新增 3 張 slide**:`0.1 Before vs After`、`1.1 RACI 三角色責任分布`、`U2 Agentic Engineer 4 大職責`(原 U2 只有文字)。
  - **編號統一**:全部改半形 `U<x>.<y>`(對齊 MD 檔名),取消全形圓圈/小數混用。
  - **染色修正**:
    - 主架構 L4 / L4.5 / L5 從 Critical/共同 改為 IT 主色(Critical 標記移到子節點)。
    - U3 設計 Review / 測試驗證 / 品質 NPI Agent 改共同(對應業務 ground truth 角色)。
    - Reward 循環中 Engineer 改 IT 主色(對齊三色定義);Pos/Neg 維持共同。
    - U5.2 Data Hub 新增「業務 SME 維護主檔」箭頭(原本只看到 IT 建 ETL,缺業務角色)。
  - **U4 8 元件分類修正**:Tests/CI 從「運維面」移到「管理面」(Prompt 改動觸發,屬設計時)。
  - **U3 Control Plane → Agent 改雙向箭頭**(原單向漏寫回 Memory)。
  - **HTML 升級為 Demo 簡報網頁**:線性導覽 + 講者註記面板 + 鍵盤翻頁 + 箭頭圖例。
- 後續變更:架構圖更新時,本目錄連同單元一併升版,避免單檔散落不同版本。
- 修正規則:任何 Coolify 合規條目調整,**必須同步更新附件 + 對應單元的 Coolify 章節**,不可只改其中一處。
