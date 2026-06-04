# AI 工程治理平台（AI Engineering Governance Platform）

## 系統架構設計文件（Architecture Design Document）

版本：v1.0

狀態：Draft

---

# 1. 文件目的

## 1.1 專案目標

建立一套企業級 AI 工程治理平台，透過 AI 協助軟體開發流程中的：

* Code Review
* 風險分析
* 專案知識管理
* 架構治理
* 團隊規範管理

最終目標：

* 降低人工 Review 成本
* 提升開發效率
* 建立可持續演進的專案知識庫
* 強化企業工程治理能力

---

## 1.2 文件範圍

本文件涵蓋：

* 系統架構設計
* 服務模組設計
* 資料流設計
* Review 分級機制
* Project Memory 設計
* Multi-Tenant 架構
* 擴充性設計

不包含：

* UI/UX 設計
* Prompt 設計細節
* 雲端基礎設施部署細節

---

# 2. 整體系統架構

```text
Developer
    ↓
GitHub PR
    ↓
GitHub Action
    ↓
Review Gateway API
    ↓
Review Queue
    ↓
Review Orchestrator
    ↓
Risk Classification Engine
    ↓
Context Builder
    ↓
Model Router
    ↓
LLM Provider
    ↓
Review Report
    ↓
GitHub Comment
```

---

## 2.1 非同步知識更新流程

```text
Review Result
      ↓
Knowledge Extractor
      ↓
Memory Evaluator
      ↓
Knowledge Graph Update
      ↓
Project Memory Update
```

說明：

Code Review 完成後，不直接更新知識庫。

而是透過背景工作：

* 分析 Review 結果
* 判斷是否值得更新記憶
* 更新 Project Memory
* 更新 Knowledge Graph

避免知識污染與成本浪費。

---

# 3. 核心服務設計

## 3.1 Review Gateway

### 職責

負責接收外部請求：

* GitHub Webhook
* GitHub Action Trigger

主要功能：

* 驗證來源
* 建立 Review Job
* 推送 Queue

---

## 3.2 Review Orchestrator

### 職責

負責控制整個 Review 流程。

執行順序：

```text
接收工作
    ↓
取得 Git Diff
    ↓
風險分析
    ↓
Context 組裝
    ↓
模型選擇
    ↓
AI Review
    ↓
報告產出
```

---

## 3.3 Risk Engine

### 職責

決定：

* Risk Score
* Review Level
* 是否升級檢查

輸出範例：

```json
{
  "risk_score": 85,
  "review_level": 3
}
```

---

## 3.4 Context Builder

### 職責

組裝 AI Review 所需上下文。

來源包含：

* Git Diff
* 關聯檔案
* 歷史風險
* 團隊規範
* 架構摘要

目的：

讓 AI 不只看 Diff。

而是理解整個專案背景。

---

## 3.5 Model Router

### 職責

根據：

* Review 等級
* 成本限制
* 租戶設定

自動選擇模型。

例如：

```text
Level 1
→ GPT Mini

Level 2
→ Gemini Flash

Level 3
→ Claude Sonnet

Level 4
→ Multi-Agent Review
```

---

# 4. Review 分級制度

## Level 1：低風險

適用：

* README
* 文件
* 註解
* CSS
* UI 文案

分析內容：

```text
Diff Only
```

通常不更新 Project Memory。

---

## Level 2：中風險

適用：

* API 修改
* Service 邏輯變更
* Import Dependency 變更

分析內容：

```text
Diff
+
Related Files
```

---

## Level 3：高風險

適用：

* Authentication
* Authorization
* Payment
* Encryption
* Permission

分析內容：

```text
Diff
+
Related Files
+
Historical Risks
+
Project Rules
```

---

## Level 4：架構級變更

適用：

* 大規模重構
* Framework 升級
* 套件全面更新

分析內容：

```text
完整專案上下文
+
Knowledge Graph
+
Architecture Summary
```

---

# 5. Risk Escalation 機制

## 規則型升級（Rule-Based）

例如：

```yaml
auth/**
security/**
payment/**
permission/**
```

直接提高 Review 等級。

---

## 語意型升級（Semantic-Based）

若程式碼出現：

```text
JWT
OAuth
Role
Permission
Encryption
Stripe
```

即使檔案名稱不符合規則：

仍提高風險等級。

---

## 歷史風險升級

若專案曾出現：

* JWT 驗證問題
* 權限繞過
* 安全漏洞

未來相關模組變更時：

自動提高 Review 等級。

---

## 業務重要性升級

不同系統採用不同最低等級。

例如：

### 金融系統

最低：

```text
Level 3
```

### 行銷網站

最低：

```text
Level 1
```

---

# 6. Project Memory 設計

## 核心觀念

Project Memory ≠ 傳統 RAG

---

傳統 RAG：

```text
問題
↓
Embedding
↓
Vector Search
↓
LLM
```

---

Project Memory：

```text
Repository
↓
Analysis
↓
Knowledge Extraction
↓
Knowledge Graph
↓
Future Review
```

---

## 儲存內容

包含：

* 架構摘要
* 歷史風險
* 團隊規範
* 領域知識
* 關鍵模組資訊

---

# 7. Knowledge Lifecycle

所有知識都具備生命週期：

```text
Create
Update
Expire
Archive
Delete
```

避免過時資訊污染未來 Review。

---

# 8. 資料儲存架構

## PostgreSQL

主要保存：

* Pull Request
* Review 結果
* Audit Log
* Risk History

用途：

* 查詢
* 報表
* 稽核

---

## Object Storage

建議：

* S3
* MinIO

保存：

* Review Report
* Full Scan 結果
* 分析產物

---

## Knowledge Graph

建議：

* Neo4j

節點：

```text
Repository
Module
Service
API
Database
Risk
```

關聯：

```text
CALLS
DEPENDS_ON
USES
HAS_RISK
AFFECTS
```

---

# 9. Multi-Tenant 設計

每個租戶擁有獨立：

* Prompt
* Rules
* Project Memory
* Knowledge Graph
* Cost Policy

禁止：

```text
Tenant A
↓
Tenant B
```

知識互相污染。

---

# 10. 可觀測性（Observability）

監控項目：

* Review 次數
* Review 時間
* Risk 分布
* Token 使用量
* 成本統計
* False Positive
* False Negative

---

記錄內容：

* Prompt
* Context
* Model Response
* Review Result

---

# 11. 發展藍圖

## V1

建立：

* PR Review
* Risk Engine
* Report Generator

---

## V2

建立：

* Project Memory
* Knowledge Graph
* Historical Risk

---

## V3

建立：

* Multi-Agent Review
* Security Agent
* Architecture Agent

---

## V4

升級為：

### AI Engineering Governance Platform

涵蓋：

* SDLC Governance
* Release Risk Analysis
* Incident Analysis
* Dependency Governance
* Engineering Intelligence
