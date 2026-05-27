# CI/CD 管理平台 計畫書

> 累積規劃文件,各 Step 逐步補完整設計。

---

## 概述

- **定位** — GitHub Actions 與 Coolify 之間的 AI Review + 報告 + 通知中樞
- **部署** — Coolify(SSL / reverse proxy / Let's Encrypt 自帶)

---

## 階段規劃

| # | Step | 狀態 | 摘要 |
|---|------|------|------|
| 1 | 安全防線 / API 入口 | ✅ 已設計 | L2 隱形濾網 + Bearer + repo allowlist |
| 2 | 成本管理 | ⏳ 待規劃 | LLM token 成本 / model 動態挑選 |
| 3 | 效率機制 | ⏳ 待規劃 | caching / 並行 / 批次 |
| 4 | RAG 平台 | ⏳ 待規劃 | knowledge base / 規則檢索 / context 注入 |
| 5 | CI/CD 報告中心 | ⏳ 待規劃 | PR 報告聚合 / 歷史 / dashboard |
| 6 | SMTP 集中管理 | ⏳ 待規劃 | 從 Notifier 收回平台內 |

---

## 跨 Step 已對齊的決策

- 部署在 Coolify,所有 SSL / reverse proxy / Let's Encrypt 由 Coolify 自帶
- 安全走 L2 簡化版(Option B),不新增任何 GitHub Secret / Variable / Organisation 設定
- API 入口認證 = Bearer + 5 個 X-DF-* header,任一不對 → 404(不是 401)

---

## Step 1 · 安全防線 / API 入口 ✅

### 1.1 防線總覽

| 層 | 機制 | 部署位置 |
|----|------|---------|
| L1 | SSL / reverse proxy | Coolify 自帶 |
| L2 | 5 個 X-DF-* + repo allowlist + 404 | FastAPI middleware |
| L3 | Bearer auth | FastAPI |
| L4 | Redis 30 req/min/repo | FastAPI |

### 1.2 L2 自訂 header 隱形濾網

**目的** — 擋 robot 掃描 + 身份綁定 + 外部 repo 過濾。
**前提** — 0 個新 GitHub 設定,只重用既有 `CICD_PLATFORM_KEY`。

**GHA 端送 5 個自訂 header**:

| Header | 來源 |
|--------|------|
| `X-DF-Author` | PR 作者(login) |
| `X-DF-Author-Email` | PR 作者 email |
| `X-DF-Repo` | repo 全名(e.g. `Dafon-IT/CRM-Backend`) |
| `X-DF-PR` | PR 號 |
| `X-DF-Commit-SHA` | commit SHA |

外加既有的 `Authorization: Bearer $CICD_PLATFORM_KEY`。

**平台端 4 道檢查(任一失敗 → 404)**:

1. 5 個 X-DF-* header 都在
2. `Authorization` Bearer 對
3. `X-DF-Repo` 在 allowlist(`Dafon-IT/` 開頭)
4. 通過 → 繼續 `/review` 業務邏輯

**為何回 404 不回 401**:讓 robot scanner 以為 endpoint 不存在 → 放棄繼續探。

### 1.3 實作位置

GHA 端 curl 範例與平台端 middleware 程式碼:見 [process-design-v1.1.md](./process-design-v1.1.md) Stage ④ 與 Stage ④' 模組 1。

---

## Step 2 · 成本管理 ⏳

> 待規劃。涵蓋方向:LLM token 成本記錄、OpenRouter model 動態挑選策略、配額機制、預算告警。

---

## Step 3 · 效率機制 ⏳

> 待規劃。涵蓋方向:結果 caching、並行處理、批次 review、long-running task 排程。

---

## Step 4 · RAG 平台 ⏳

> 待規劃。完整前後端 RAG service:knowledge base 維運、規則庫檢索、review 時 context 注入。

---

## Step 5 · CI/CD 報告中心 ⏳

> 待規劃。涵蓋方向:各 PR 報告聚合、歷史查詢、dashboard、長期統計、團隊指標。

---

## Step 6 · SMTP 集中管理 ⏳

> 待規劃。把目前獨立的 Notifier service 功能收進平台內,統一管理通知路由、模板、收件人對應。

---

## 待決議事項

(各 Step 規劃中陸續補上)
