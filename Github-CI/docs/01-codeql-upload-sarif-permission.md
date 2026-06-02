# 01 — reusable workflow 權限 × CodeQL upload-sarif

> **日期**:2026-06-02 ・ **觸發版本**:v1.0.0 → 修正於 v1.0.1
> **TL;DR**:`security-scan` job 上傳 SARIF 失敗,不是掃出漏洞被擋,而是 **`github/codeql-action/upload-sarif` 在 private repo 需要 `actions: read` 權限**。一旦 job 顯式寫了 `permissions:` 區塊,**沒列到的權限會被設成 `none`**,所以 `actions` 變 `none` → API 被拒。而且 **reusable workflow 的有效權限 = caller 授予 × callee 宣告 的交集**,所以 caller 和 callee 兩端都要補 `actions: read`,只改一邊無效。

---

## 現象

`auto-cicd / security-scan` job 紅燈,卡在 `Run github/codeql-action/upload-sarif@v3`。log 關鍵幾行:

```
8   Warning: CodeQL Action v3 will be deprecated in December 2026. ... update ... to v4.
9   Warning: Failed to gather information for telemetry: Resource not accessible by integration
            - .../rest/actions/workflow-runs#get-a-workflow-run
13  Error:   Resource not accessible by integration
            - .../rest/actions/workflow-runs#get-a-workflow-run
14  Warning: Failed to gather information for telemetry: Resource not accessible by integration ...
```

**容易誤判的點**:看到 `security-scan` 紅燈,直覺是「semgrep 掃到高危漏洞被擋下」。但 semgrep 那步(`Run returntocorp/semgrep-action`)其實是綠的,SARIF 也產出了(`Post-processing sarif files: ["semgrep.sarif"]`)。真正掛的是**最後上傳 SARIF 那步**,而且三條訊息都指向**同一個 API**:`actions/workflow-runs#get-a-workflow-run`。

---

## 根因(三層疊起來)

### 層一:upload-sarif 在 private repo 需要 `actions: read`

`upload-sarif` 上傳時會去 call「get a workflow run」這個 Actions API(抓 run 的 context + telemetry)。讀這個 endpoint 需要 **`actions: read`** 權限。官方文件明列 private repo 的最小權限:

```yaml
permissions:
  security-events: write   # 寫 Code Scanning
  actions: read            # ← private repo 上傳 SARIF 必須
  contents: read
```

`Resource not accessible by integration` = GITHUB_TOKEN 對該資源沒權限(403),不是「找不到」。

### 層二:顯式 `permissions:` 區塊 → 沒列的權限一律 `none`

GitHub Actions 的規則,這是最反直覺的一條:

> 只要你在 workflow 或 job 寫了 `permissions:` 區塊,**未列出的每一項權限都會被設成 `none`**,而不是繼承 repo / org 預設。

當時 `security-scan` 只寫了 `contents: read` + `security-events: write`,沒寫 `actions`,於是 `actions` = `none` → 上面那個 API 被拒。

> 心法:`permissions:` 是「白名單」,不是「在預設上疊加」。寫了就要列全。

### 層三:reusable workflow 的權限是「caller × callee 取交集」

這套 CI 是 reusable workflow(`on: workflow_call`),caller 用 `uses:` 引用。reusable 的**有效 token 權限 = caller 那個 job 授予的權限 ∩ callee workflow / job 宣告的權限**。任一端把某權限設成 `none`,交集後就是 `none`。

所以即使 callee 的 `security-scan` job 補了 `actions: read`,只要 caller 的 `auto-cicd` job 的 `permissions:` 沒列 `actions`,交集後仍是 `none` → 一樣掛。**兩端都要補才有效。**

---

## 修法(v1.0.1)

兩個檔、三處:

```diff
# 1) callee:.github/workflows/auto-cicd.yml — security-scan job
   permissions:
     contents: read
     security-events: write
+    actions: read                    # private repo 上傳 SARIF 需讀 workflow-run

# 2) callee:同檔 — 升 action 版本(v3 將於 2026/12 deprecated)
-  - uses: github/codeql-action/upload-sarif@v3
+  - uses: github/codeql-action/upload-sarif@v4

# 3) caller:Github-CI/setup-cicd/ci-cd.yml — auto-cicd job
   permissions:
     contents: write
     pull-requests: write
     issues: write
     statuses: write
     security-events: write
+    actions: read            # reusable 權限取 caller×callee 交集,此處不給則 callee 補的也無效
```

> 因為改的是「補權限 + 升 action」,**不動 inputs / outputs / 行為 → 是 PATCH**,照 [RELEASE.md](../RELEASE.md) 發 `v1.0.1`(不重指 v1.0.0)。caller 端要把 `@v1.0.0` 改 `@v1.0.1` 才吃得到。

---

## 延伸知識(順手記起來)

| 主題 | 重點 |
| --- | --- |
| **fork PR 的 token** | 來自 fork 的 pull_request,GITHUB_TOKEN **一律唯讀**,不管你 `permissions:` 怎麼宣告 `write` 都會被降級 → 也會出現 `Resource not accessible by integration`。若本案改完仍失敗,先確認是不是 fork PR。 |
| **private repo 的 Code Scanning** | SARIF 上傳餵的是 GitHub Code Scanning。private / internal repo 要用 Code Scanning 需 **GitHub Advanced Security (GHAS)** 有開;沒開也會上傳失敗(訊息不同)。本案是權限問題,非 GHAS。 |
| **org 預設 token 權限** | org / repo 可把 GITHUB_TOKEN 預設設成 read-only。但只要 job 顯式列 `permissions:`(非 fork),即可在該 job 提升到所列範圍——前提是「列了」。 |
| **CodeQL Action v3 EOL** | v3 於 2026/12 deprecated,新專案直接用 `@v4`。 |

---

## 教訓 / checklist

排查 GitHub Actions 的 `Resource not accessible by integration`,依序檢查:

1. **是哪一步、哪個 API 失敗?** 順著 log 找真正紅的 step + 它 call 的 endpoint —— 別被「哪個 job 紅燈」誤導(semgrep 綠、上傳才紅)。
2. **這個 endpoint 要什麼權限?** 查 action 文件的 minimal permissions(upload-sarif → `security-events: write` + `actions: read` + `contents: read`)。
3. **job 有沒有寫 `permissions:` 區塊?** 有寫就要列全,沒列 = `none`。
4. **是不是 reusable?** 是的話 caller、callee 兩端都要列同一權限(取交集)。
5. **是不是 fork PR?** 是的話 write 一律被降級,要改用其他觸發或 `pull_request_target`(注意安全)。

---

## 參考

- GitHub Docs — [Assigning permissions to jobs](https://docs.github.com/actions/using-jobs/assigning-permissions-to-jobs)(顯式區塊 → 未列為 none)
- GitHub Docs — [Uploading a SARIF file to GitHub](https://docs.github.com/code-security/code-scanning/integrating-with-code-scanning/uploading-a-sarif-file-to-github)(upload-sarif 最小權限)
- 本 repo 發版 SOP:[Github-CI/RELEASE.md](../RELEASE.md)
- 修正 commit:`036986e`(tag `v1.0.1`)
