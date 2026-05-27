# Auto-CI-CD process-design-v1.1.html 待辦

> SA 視角逐步重寫 `process-design-v1.1.html`,把過去寫到「程式碼合約」的不合格版本,改成 **人話 + 技術細節 + 系統流程圖 + 狀態機** 並存的設計文件。每一步先對齊設計決策再下筆畫 slide。

---

## 進度總覽

- [ ] **Step 2 · CI/CD 管理平台完整重寫** — baseline(/review pipeline 子集)已 commit;待用戶定整體平台架構後重寫,要納入:RAG / 報告中心 / SMTP / 成本管理 / 效率機制
- [ ] **Step 3 · CI 紅燈時 /review 是否短路** — workflow 端短路 / Platform 也吃 CI 結果 / 混合
- [ ] **Step 4 · /review 同步 vs 非同步** — 同步 long-poll / 非同步 webhook 回呼 / 折衷
- [ ] **Step 5 · PR 評論誰寫** — Platform 寫 / workflow 寫 / 兩邊都寫(各司其職)
- [ ] **Step 6 · 保護路徑判定點** — 只 workflow 判 / Platform 也感知作為審查 context
- [ ] **Step 7 · Audit DB 是否獨立第四服務** — 獨立服務 / 內嵌 Platform / Notifier 兼任
- [ ] **Step 8 · 熔斷狀態存哪、誰判** — GitHub repo variable / Platform DB / Notifier Redis
- [ ] **Step 9 · 整體資料狀態流轉圖** — 整合 Step 2~8 的決策成 SA 收尾圖

---

## 設計原則(別忘了)

- **人話 + 技術細節並存** — 卡片上半人話描述「做什麼」,下半技術細節說明「為什麼這樣設、實際在防什麼」;不是工具名 + 旗標堆疊
- **流程圖垂直繪製** — stateDiagram / flowchart 都用 TB direction
- **每步畫一張 slide** — 逐步累積,不一次堆完
- **不要表格、不要堆連結** — 條列為主
- **狀態機要存在** — 系統流程圖只看結構;真正的稽核重點是狀態機

---

## Step 1 已對齊的決策(供後續步驟參考)

- **CI = 5 個並行 job**:前端 / 後端 / 資料庫變更 / 機密外洩 / 原始碼安全
- **套件漏洞稽核** 合進前後端內(npm audit / pip-audit / OWASP DC),不獨立成 job
- **Migration 抽出來成獨立 job**:用 `paths:` filter,動到 `*/migrations/**` 才跑
- **Migration 失敗雙分支**:
  - GHA 基建錯(container 啟不來、runner OOM)→ `manual`
  - 內容不合規(缺 down、round-trip 跑不過)→ `reject`(close PR)
- **機密外洩掃描**(gitleaks)維持獨立並行 job;掃整個 git 歷史(fetch-depth: 0)
- **原始碼安全掃描**(semgrep + trivy)維持獨立並行 job

---

## 各步驟展開

### Step 2 · CI/CD 管理平台完整重寫

**Baseline 狀態**(commit `27075dd`):
- 6 張卡片(健康檢查 + 5 模組:接收入口 / 機密過濾 / OpenRouter / 判決引擎 / 發布器)
- 系統流程圖(workflow runner ↔ 平台 5 模組)
- 完整設計圖(從 /health 到 verdict 全程 + 每模組退路)
- verdict legend(4 verdict 對 workflow 動作)

**已對齊的決策**:

- **部署**:CI/CD 管理平台 deploy 在 Coolify(SSL / reverse proxy 由 Coolify 自帶,不需 Cloudflare)
- **L2 隱形濾網**:走簡化版(Option B),GHA 端送 5 個自訂 header(`X-DF-Author / Author-Email / Repo / PR / Commit-SHA`)+ 既有 Bearer,平台端 middleware 任一失敗 → 404。**0 個新 GitHub Secret / Variable / Organisation 設定**,詳見 [cicd-platform-plan.md](./cicd-platform-plan.md)。

**待用戶定整體平台架構**,要納入:

- **成本管理** — LLM token 成本 / OpenRouter model 動態挑選 / 配額
- **效率機制** — caching / 並行 / 批次處理
- **RAG**(完整前後端平台)— knowledge base / 規則庫檢索 / context 注入
- **CI / CD 報告中心** — 各 PR 報告聚合 / 歷史查詢 / dashboard
- **SMTP 集中管理** — 從獨立 Notifier service 收回平台內

**影響**:Step 2 slide 會整個重寫;系統流程圖、完整設計圖、卡片數量、verdict legend 都要改;後續 Step 3~8 的設計決策也要對齊新架構。

---

### Step 3 · CI 紅燈時 /review 是否短路

**問題**:
- 舊版 process-design §三.2:CI 紅就不打 /review,workflow 端直接定 verdict
- workflow-v1.1.md §一.⑥:Platform 一律回 verdict,workflow 再彙總

**待決定**:A. workflow 端短路 / B. Platform 也吃 CI 結果 / C. 混合策略

**影響**:Platform `/review` 的 input 合約是否要塞 CI 結果;資料流向圖差異很大。

---

### Step 4 · /review 同步 vs 非同步

**問題**:目前設計同步 POST + 5 分鐘 timeout 等回應,讓 GHA runner 卡 5 分鐘等 LLM,成本與穩定性都不理想。

**待決定**:A. 維持同步 long-poll / B. 非同步 webhook 回呼 / C. Platform 內部非同步但對 workflow 同步

**影響**:資料狀態流轉圖會有顯著差異;runner 計費。

---

### Step 5 · PR 評論誰寫

**問題**:
- 舊版 process-design §④' 模組 5「發布器」:Platform 內部寫 PR 評論
- 同份 §五:workflow 收到 verdict 後又自己寫 PR 評論
- → 寫兩次?還是只有一次?

**待決定**:A. Platform 寫 / B. workflow 寫 / C. 兩邊都寫(各司其職:Platform 寫 findings、workflow 寫 status check)

**影響**:GitHub App token 權限歸屬 — 哪個服務需要 PR write 權限。

---

### Step 6 · 保護路徑判定點

**問題**:目前 workflow runner 用 `git diff --name-only` 自己判,但 Platform 端要不要也知道保護路徑?

**待決定**:A. 只 workflow 判,Platform 不感知 / B. Platform 也知道,作為審查時的額外 context

**影響**:`/review` input 合約是否塞保護路徑列表。

---

### Step 7 · Audit DB 是否獨立第四服務

**問題**:workflow-v1.1.md §五 有獨立 Audit DB(append-only、retention 2 年、寫失敗 fail-fast),但 process-design 完全沒提 audit 怎麼落。

**待決定**:A. Audit 是獨立第四個服務(workflow / Platform / Notifier / Audit)/ B. 內嵌在 Platform 內 / C. SMTP Notifier 兼任(它已經有 DB 暫存事件)

**影響**:SA 圖要不要把 Audit 當第四個服務畫出來。

---

### Step 8 · 熔斷狀態存哪、誰判

**問題**:workflow-v1.1.md §四.5 講熔斷(1h deploy fail ≥3 或 24h rollback ≥2 → 關 auto-merge),但 process-design 沒講熔斷狀態存哪、誰判。

**待決定**:A. workflow 端 GitHub repo variable(`AUTO_MERGE_ENABLED`)/ B. Platform 端自身 DB / C. Notifier 端 Redis(它已在統計事件)

**影響**:資料狀態流轉圖要加一條熔斷狀態軸。

---

### Step 9 · 整體資料狀態流轉圖(SA 收尾)

**目標**:把 Step 1 已對齊決策(reference)+ Step 2~8 對齊決策整合成一張完整圖。

**內容構想**:
- PR 整體生命週期狀態(從 push 到 deploy / rollback / reject 等所有結束狀態)
- 各服務之間的事件流轉(workflow / Platform / Notifier / Audit / Coolify)
- 熔斷狀態軸
