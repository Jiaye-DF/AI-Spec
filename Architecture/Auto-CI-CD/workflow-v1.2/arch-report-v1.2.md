# AI Code Review Platform / AI-First CI-CD Platform 設計總結

## 文件目的

本文件整理 AI Code Review Platform 的核心設計理念、技術架構、治理思維、知識系統設計、成本控制策略，以及商業價值主張。

此文件同時作為：

* 架構設計文件（Architecture Design）
* 產品設計文件（Product Design）
* 投資人/主管溝通版本（Executive Summary）
* 未來 SA、Tech Lead、Architect 設計基礎

---

# 一、問題背景

企業軟體開發過程中，Code Review 是必要流程。

但傳統 Review 存在幾個問題：

## 人力成本高

資深工程師需要投入大量時間：

* Review PR
* 理解上下文
* 查找歷史問題
* 驗證是否符合團隊規範

若企業：

* 每月 1000 個 PR
* 平均 Review 10~15 分鐘

則可能消耗：

* 160~250 小時/月

接近一位全職資深工程師的工時。

---

## 知識無法累積

大部分 Review 結果：

* 留在 PR
* 留在 Slack
* 留在工程師腦中

無法形成：

* 團隊知識
* 專案知識
* 歷史風險資料庫

---

## Review 標準不一致

不同 Reviewer：

* Security 關注不同
* Performance 關注不同
* Architecture 關注不同

造成：

* Review 品質不穩定
* 團隊標準難以統一

---

# 二、產品定位

本平台不是單純 AI Review 工具。

而是：

## AI-First Engineering Governance Platform

核心目標：

* 自動化 Code Review
* 建立 Project Memory
* 降低工程治理成本
* 保留專案知識
* 提供企業級 AI 治理能力

---

# 三、系統高階架構

```text
Developer
    ↓
GitHub PR
    ↓
GitHub Action
    ↓
AI Review Platform
    ↓
Review Orchestrator
    ↓
Risk Classification Engine
    ↓
Review Agent
    ↓
OpenRouter / Enterprise Model
    ↓
Review Report
    ↓
GitHub Comment
```

---

## 非同步流程

```text
Review Result
      ↓
Knowledge Extractor
      ↓
Project Memory Update
      ↓
Knowledge Graph Update
      ↓
Historical Risk Update
```

---

# 四、核心模組

## 1. GitHub Integration

負責：

* PR Trigger
* Commit Trigger
* CI Trigger
* Merge Gate

---

## 2. Review Orchestrator

負責：

* Workflow 控制
* Agent Routing
* Context 組裝
* 成本控制

---

## 3. Risk Classification Engine

負責：

* 判斷 Review 等級
* 判斷是否需要深度分析
* 決定模型選型

---

## 4. Review Agent

負責：

* Security Review
* Architecture Review
* Performance Review
* Coding Style Review

---

## 5. Project Memory

負責：

* 專案知識累積
* 歷史問題記錄
* 團隊規範保存
* 架構演進紀錄

---

## 6. Governance Dashboard

提供：

* Review 歷史
* Risk 趨勢
* Team Metrics
* Cost Analysis

---

# 五、Review 分級制度

## Level 1

低風險變更

例如：

* README
* 文件
* CSS
* UI 文案

分析內容：

* Diff Only

使用：

* 低成本模型

通常：

* 不更新 Memory

---

## Level 2

中風險變更

例如：

* Service 邏輯修改
* API 調整
* Import Dependency 變更

分析內容：

* Diff
* Related Files
* Import Chain

---

## Level 3

高風險變更

例如：

* Auth
* Permission
* Payment

分析內容：

* Diff
* Module Context
* Historical Risks
* Architecture Rules

---

## Level 4

重大架構變更

例如：

* 大規模重構
* Framework 升級
* 套件全面更新

分析內容：

* Full Project Scan
* Multi-Agent Review
* Deep Dependency Analysis

---

# 六、Risk Escalation 機制

## Rule-Based

例如：

```yaml
auth/**
payment/**
security/**
permission/**
```

直接升級。

---

## Semantic-Based

分析程式語意：

例如：

* JWT
* Role
* Permission
* Encryption
* Payment

即使檔案名稱無法判斷：

仍提高風險等級。

---

## Historical-Based

若過去曾出現：

* Auth Bypass
* JWT Bug
* Privilege Escalation

則相關模組：

自動升級。

---

## Business Criticality

不同 Repo：

風險標準不同。

例如：

金融系統：

最低 Level 3。

行銷網站：

最低 Level 1。

---

# 七、Harness Engineering 設計理念

Harness Engineering 並非特定技術。

而是一種：

## AI Governance Framework

目標：

* 提高可治理性
* 提高可推理性
* 提高可預測性

---

## 關鍵設計

### Governance Boundary

定義：

* 權限邊界
* 模組邊界
* Agent 能力邊界

---

### Sandbox

限制：

* Agent 可存取範圍
* Agent 可執行行為

---

### Architecture Contract

例如：

* Auth 必須集中管理
* Business Logic 不可散落 Controller

違反規則：

提高 Review Level。

---

# 八、Project Memory 設計

## 重要觀念

Project Memory ≠ 傳統 RAG

---

傳統 RAG：

```text
Question
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

目的：

不是文件問答。

而是：

* 保留專案知識
* 保留架構知識
* 保留風險知識

---

# 九、Memory Update Strategy

## 核心原則

不是每個 PR 都更新 Memory。

---

避免：

* 成本暴增
* Memory 污染
* Recall 品質下降

---

## 更新條件

僅：

* Architecture Change
* Critical Module Change
* New Risk Discovery
* Major Refactor

才更新。

---

## Knowledge Lifecycle

知識必須支援：

```text
Create
Update
Expire
Archive
Delete
```

避免過時資訊污染未來 Review。

---

# 十、資料儲存分層

## SQL

儲存：

* PR History
* Review Report
* Audit Log
* Cost Log

用途：

* 查詢
* 報表
* 審計

---

## Knowledge Graph

儲存：

* Service Dependency
* Module Dependency
* Architecture Relationship

用途：

* Impact Analysis
* Dependency Analysis

---

## Project Memory

儲存：

* Architecture Summary
* Historical Risk
* Team Rules
* Project Knowledge

用途：

* 未來 Review Context

---

# 十一、多租戶架構（未來規劃）

## Enterprise Mode

程式碼：

* 不離開企業內網

模型：

* Self Hosted
* Private LLM

Memory：

* Tenant Isolation

---

## SaaS Mode

使用：

* OpenRouter
* Claude
* GPT
* Gemini

降低成本。

---

## Tenant Isolation

禁止：

```text
Tenant A
↓
Tenant B
```

知識互相污染。

---

每個 Tenant：

* 獨立 Memory
* 獨立 Rule
* 獨立 Knowledge

---

# 十二、產品 KPI

## Engineering KPI

### Review Coverage

目標：

100% PR 經過 Review。

---

### Review Lead Time

目標：

2 天

↓

5 分鐘

---

### Defect Escape Rate

目標：

降低上線後缺陷數量。

---

### Reviewer Time Saved

目標：

每月節省大量資深工程師工時。

---

# 十三、商業價值

## 對工程團隊

* 提高 Review 一致性
* 保留專案知識
* 加速開發

---

## 對 Tech Lead

* 降低管理成本
* 提升治理能力

---

## 對 CTO

* 降低研發成本
* 提高研發產能
* 提升開發效率

---

## 對企業

* 降低知識流失風險
* 建立可持續演進的工程治理系統

---

# 最終定位

本平台不是單純 AI Code Reviewer。

而是：

**AI-First Engineering Governance Platform**

透過：

* AI Review
* Risk Escalation
* Project Memory
* Knowledge Graph
* Harness Engineering

建立企業級軟體工程治理能力。
