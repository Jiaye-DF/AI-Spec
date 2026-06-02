# 02 — auto-cicd 全流程 + push 事件審查設計(規劃中)

> **狀態**:🧭 規劃中(workflow 側 YAML **未實作**)。需與平台側 push-mode `/review` **兩側一起上**。
> **日期**:2026-06-02
> **TL;DR**:目標是讓 **PR 與 push 跑同一套檢查(都過 ai-review)**,差別只在判決後動作 —— PR 走完整四態(合併 / 人工 / conflict / 關閉),**push 簡化成「reject 就擋部署,不走人工」**。卡點:平台 `/review` 目前只吃 PR 形狀,push 會被 L2 濾網回 404,需平台先支援 push-mode(見 [cicd-platform-plan Step 7](../../Architecture/Auto-CI-CD/workflow-v1.1/cicd-platform-plan.md))。

---

## 一、現況:auto-cicd.yml 兩條路

[auto-cicd.yml](../../.github/workflows/auto-cicd.yml) 有 6 個 job,依事件分兩條路:

```
            caller 先跑 frontend-ci / backend-ci(result 當 inputs 傳入)
                                  │
                         secret-scan / security-scan(永遠跑)
                                  │
            ┌─────────────────────┴─────────────────────┐
       【pull_request】                            【push 到 main】
            │                                            │
       ci-report                                    ci-report
       ai-review ──► verdict ──┐                    cd-trigger
       auto-merge ◄────────────┘                       │ needs 機密+安全須過
            │ 四態:                                     │ 且前後端沒 failure
            ├ mergeable → 自動 squash 合併               ▼
            │            (合併=push:main → 繞到右路)   發 Coolify webhook
            ├ manual    → needs-tech-lead
            ├ conflict  → 要 rebase
            └ reject    → 關 PR
```

**現況問題**:右路(push)**完全沒有 ai-review** —— 繞過 PR 的直接 push / hotfix 進 main 後,部署前**沒有任何 AI 審查關卡**,只看「掃描過 + CI 沒掛」就發 Coolify。

---

## 二、目標:PR 與 push 同一套檢查

| | PR 路 | push 路(現況) | push 路(目標) |
| --- | --- | --- | --- |
| secret / security 掃 | ✅ | ✅ | ✅ |
| **ai-review** | ✅ | ❌ 無 | ✅ **新增** |
| 判決後動作 | 四態(合併/人工/conflict/關閉) | — | **reject → 擋部署;非 reject → 部署**(不走人工) |

> reject 在 push 的意義:code 已在 main,**無法退出 main**,reject = **擋下 Coolify 部署 + 告警**。

---

## 三、workflow 側設計(待平台 ready 才實作)

### 3.1 新 `push-review` job

只在 `push:main` 跑,核心邏輯沿用 ai-review 的 health-check → /review → verdict。

### 3.2 跳過「已審過」的 push(關鍵)

auto-merge 判 mergeable 自動合併 → 那個合併**本身是一次 push:main**,但那份 code 在 PR 階段已審過,不該重審。判斷法:

```bash
# HEAD commit 是否來自「已合併 PR」(auto-merge squash 與人工合併都算)
gh api "repos/${{ github.repository }}/commits/${{ github.sha }}/pulls" \
  -q '.[] | select(.state=="closed" and .merged_at!=null) | .number'
```

- 查得到已合併 PR → **跳過 push-review**(PR 階段審過)。
- 查不到(真・直接 push / hotfix)→ **跑 push-review**。

> 用「commit 是否關聯已合併 PR」而非「比對 auto-merge 的 bot 帳號」,好處:免每 repo 設定 bot 名,且同時涵蓋人工 PR 合併。

### 3.3 reject 擋部署

```yaml
# cd-trigger 改:
cd-trigger:
  needs: [secret-scan, security-scan, push-review]
  if: >-
    github.event_name == 'push' &&
    inputs.frontend_result != 'failure' && inputs.frontend_result != 'cancelled' &&
    inputs.backend_result  != 'failure' && inputs.backend_result  != 'cancelled' &&
    needs.push-review.outputs.verdict != 'reject'
```

### 3.4 安全降級(degrade-open)— 防止把全公司部署搞掛

仿 ai-review 的 health-check:**平台不健康 / 回非 2xx(含目前 push 會吃到的 404)→ 不擋部署、只記 Audit**;**唯有平台明確回 `reject` 才擋**。理由:這支是全公司共用的中央 workflow,審查平台的可用性問題不該變成「部署被卡死」。

---

## 四、相依:平台側 push-mode `/review`(擋住目前無法上線的點)

平台 L2 濾網第 1 道要求「**5 個 X-DF-* header 都在**」,但 push **沒有** `X-DF-PR`(PR 號)→ 直接回 404;`X-DF-Author` 也綁「PR 作者」,push 上不存在。

**平台需新增 push-mode 契約**(詳見 [cicd-platform-plan Step 7](../../Architecture/Auto-CI-CD/workflow-v1.1/cicd-platform-plan.md)):

- L2 放寬:push 模式允許 `X-DF-PR` 為 sentinel(如 `none`),改以 `X-DF-Event: push` 識別。
- `X-DF-Author` 來源:PR 模式 = PR 作者;push 模式 = **commit 作者**。
- `/review` 業務邏輯:push 模式用 **commit diff**(無 `pr_number` / `pr_body`),`rules_ref` 不變,回傳 `verdict` 格式不變。

---

## 五、上線順序

1. 平台實作 push-mode `/review` + L2 放寬(cicd-platform-plan Step 7)。
2. workflow 實作 `push-review` job + cd-trigger gating(本文三節)+ safe-degrade。
3. 兩側一起測 → 發新 tag(屆時依改動性質判 MINOR:加新 job 屬向下相容)。

> **未實作前不要把 YAML 推上中央 workflow** —— 否則每個直接 push 都打到 404、走降級放行,等於「接好但暫時 inert」,給人有審查的假象卻沒真的擋。
