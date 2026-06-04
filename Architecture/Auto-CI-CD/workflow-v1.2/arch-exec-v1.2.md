# AI 工程治理平台 — 主管簡報底稿

> 本文件為向上彙報用底稿，對應 `exec-report-v1.2.html` 簡報。

---

## 一、現況問題

### 人力成本高

每月 **1,000 個 PR**，平均 Review **10–15 分鐘** = **160–250 小時/月**。

這相當於一位全職資深工程師的工時，消耗在例行審查。

### 知識無法累積

Review 結果分散在 PR 留言、Slack 頻道、個人記憶，
無法形成可查詢的團隊知識庫或歷史風險資料庫。
人員異動時，知識一併流失。

### 標準不一致

不同 Reviewer 對安全、架構、效能的關注點不同，
造成 Review 品質不穩定，新人難以學習正確標準，
管理層無法量化工程品質。

---

## 二、解法定位

### AI-First Engineering Governance Platform

這不是單純的 AI Code Review 工具，而是**工程治理基礎建設**：

| 能力 | 說明 |
|------|------|
| AI 自動化 Review | PR 觸發後 5 分鐘內產出結構化審查報告 |
| 風險分級管控 | L1~L4 四級，高風險路徑自動升級深度分析 |
| Project Memory | 知識不因人員流動流失，累積越用越準 |
| 企業級治理 | 稽核記錄、成本追蹤、多租戶隔離 |

---

## 三、運作方式

```text
PR 提交
  ↓ Review Gateway 接收（驗來源、建 Job）
  ↓ Risk Engine 判斷等級 L1 ~ L4
  ↓ Context Builder 組裝上下文（diff + 關聯檔案 + 歷史風險 + 規範）
  ↓ Model Router 選擇對應 AI 模型（低成本 → 多模型協作）
  ↓ LLM 深度分析
  ↓ Review Report 回傳 GitHub PR 評論
  → 非同步：結果 → Knowledge Extractor → Project Memory 更新
```

### Review 分級一覽

| 等級 | 適用情境 | 分析深度 | 模型選型 |
|------|----------|----------|----------|
| L1 低風險 | 文件、UI 文案、CSS | Diff Only | 低成本模型 |
| L2 中風險 | API / Service 邏輯變更 | Diff + 關聯檔案 | 中階模型 |
| L3 高風險 | Auth、Payment、加密 | + 歷史風險 + 規範 | 高階模型 |
| L4 架構級 | 重構、Framework 升級 | 完整專案 + Multi-Agent | 多模型協作 |

---

## 四、對各角色的商業價值

| 角色 | 具體效益 |
|------|----------|
| **工程師** | Review 等待時間 2 天 → 5 分鐘；100% PR 覆蓋，不再遺漏 |
| **Tech Lead** | 統一 Review 標準；降低管理溝通成本；知識不隨人員異動流失 |
| **CTO** | 每月節省 160–250 小時資深工程師工時；研發產能實質提升 |
| **企業** | 可稽核的工程治理記錄；知識資產可量化，降低組織風險 |

---

## 五、發展路線 & 所需決策

### 路線規劃

**V1 MVP — 立即可驗證**
- PR Review + Risk Engine + 結構化報告輸出
- 目標：驗證 AI Review 品質與時效

**V2 — 知識積累**
- Project Memory + Knowledge Graph + 歷史風險學習
- 目標：Review 越跑越準，歷史問題不再重犯

**V3 — 完整治理平台**
- Multi-Agent Review + Security Agent + Architecture Agent
- 升級為完整 AI Engineering Governance Platform

### 需要的決策

- [ ] **部署方式**：Coolify On-Premise（程式碼不出內網）或 SaaS OpenRouter
- [ ] **LLM 預算確認**：按量計費，V1 可從低成本模型起步驗證
- [ ] **試點 Repo 選擇**：建議先從內部非核心 Repo 開始，降低風險
