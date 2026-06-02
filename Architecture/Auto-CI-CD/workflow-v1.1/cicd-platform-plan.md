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
| 7 | push 事件審查(non-PR review)| 🧭 規劃中 | `/review` 支援 push 形狀 + L2 放寬 `X-DF-PR`,供繞過 PR 的直接 push / hotfix 審查 |

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

## Step 7 · push 事件審查 / non-PR review 🧭 規劃中

**動機** — 讓 PR 與 push 跑同一套檢查。目前 `auto-cicd.yml` 的 push 路**不跑 ai-review**,繞過 PR 的**直接 push / hotfix** 進 main 後,部署前沒有任何 AI 審查關卡。目標:push 也送 `/review`,**verdict=reject → 擋 Coolify 部署**(push 不走四態/人工,只「reject 擋部署」)。

**卡點** — 現行 `/review` + L2 濾網是 **PR 形狀**:L2 第 1 道要求「5 個 X-DF-* 都在」,但 push 沒有 `X-DF-PR`(PR 號)→ 直接回 404;`X-DF-Author` 也綁 PR 作者,push 上不存在。

**平台需新增 push-mode 契約**:

| 項目 | PR 模式(現況) | push 模式(待加) |
|------|----------------|-------------------|
| 識別 | 預設 | 新增 header `X-DF-Event: push` |
| `X-DF-PR` | PR 號 | sentinel `none`(L2 放寬:push 模式不要求真 PR 號) |
| `X-DF-Author` | PR 作者 login | **commit 作者** |
| `/review` body | `pr_number` + `pr_body` + diff | 無 `pr_number`/`pr_body`,改 **commit diff**;`rules_ref` 不變 |
| 回傳 | `verdict`(mergeable/manual/reject)| 同;GHA push 路只取 `reject` 當「擋部署」訊號 |

**安全** — GHA 端對 push-review 採 **degrade-open**:平台不健康 / 回非 2xx → **不擋部署**、只記 Audit;唯有明確 `reject` 才擋。避免審查平台可用性問題拖垮全公司部署。

**對應 workflow 側設計** — [Github-CI/docs/02-push-review-design.md](../../../Github-CI/docs/02-push-review-design.md)(含 `push-review` job、「跳過已合併 PR 之 push」判斷、cd-trigger gating)。**兩側需一起上**,workflow 不可早於平台單獨部署(否則每個直接 push 打到 404 → 降級放行 → 假審查)。

---

## 待決議事項

(各 Step 規劃中陸續補上)
