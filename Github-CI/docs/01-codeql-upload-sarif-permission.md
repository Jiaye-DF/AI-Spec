# 01 — reusable workflow 權限 × CodeQL upload-sarif

> **日期**:2026-06-02 ・ **觸發版本**:v1.0.0 → 第一層修於 v1.0.1 → 第二層處理於 v1.0.2
> **TL;DR**:`security-scan` 上傳 SARIF 失敗其實是**兩層問題疊在一起**:
> 1. **權限層(v1.0.1 修)** — `upload-sarif` 在 private repo 需要 `actions: read`;但 job 一旦顯式寫 `permissions:` 區塊,**沒列到的權限會被設成 `none`**,且 **reusable 有效權限 = caller × callee 取交集**,所以兩端都要補才有效。補完後錯誤訊息**改變** → 進入第二層。
> 2. **功能層(v1.0.2 決策)** — 補完權限後冒出 `Code scanning is not enabled for this repository`:GitHub Code Scanning(SARIF 的目的地)在 private repo 需 **GHAS** 才能用。我們選擇**解綁 Code Scanning**(不依賴 GHAS):semgrep 照掃照擋,SARIF 改存 artifact。**等未來切換組織帳號(有 GHAS)再加回**(復原步驟見文末)。

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

## 後續:第二層浮現 —— Code Scanning 未啟用(v1.0.2)

升 v1.0.1 後重跑,**錯誤訊息變了**(這本身就是好信號:第一層通了):

```
Warning: This run ... does not have permission to access the CodeQL Action API endpoints.
         ... Code scanning is not enabled for this repository. Please enable code scanning ...
Error:   Please verify that the necessary features are enabled:
         Code scanning is not enabled for this repository.
```

這正是根因「延伸知識」裡記的事:**SARIF 上傳的目的地 GitHub Code Scanning,在 private repo 需要 GHAS(GitHub Advanced Security)才能啟用**。沒開 → upload 失敗。這不是 workflow 能修的,是 repo / org 層的付費功能設定。

### 決策:解綁 Code Scanning(不依賴 GHAS)

評估後選擇**不綁** GitHub 原生 Code Scanning,理由:

- 公司本來就有自建 **CI-CD 管理平台 + Audit** 在收結果;semgrep 的價值在「掃 + 擋」,不一定要進 GitHub 原生 Security 頁。
- 不確定當前帳號有無 GHAS 授權;綁了會讓**任何沒 GHAS 的 repo 都卡在這步紅燈**。

做法(v1.0.2):

```diff
# .github/workflows/auto-cicd.yml — security-scan job
   permissions:
-    contents: read
-    security-events: write
-    actions: read
+    contents: read          # 不綁 Code Scanning,故不需 security-events / actions

-  - uses: github/codeql-action/upload-sarif@v4
-    if: always()
-    with:
-      sarif_file: semgrep.sarif
+  # 改存 artifact;semgrep 掃到 blocking 仍 fail → 判決 row2 擋下
+  - uses: actions/upload-artifact@v4
+    if: always()
+    with:
+      name: semgrep-sarif
+      path: semgrep.sarif
+      retention-days: 7
```

caller(`setup-cicd/ci-cd.yml`)的 `auto-cicd` job 同步移除 `security-events: write` + `actions: read`(改成註解保留)。**semgrep 的掃描與擋人能力完全不變** —— 只是報告從「GitHub Code Scanning UI」改成「workflow artifact」。

### 未來切換組織帳號(有 GHAS)要加回去

兩個檔的舊邏輯都**留成註解**,不必考古。復原步驟:

1. `auto-cicd.yml` security-scan:解除 `upload-sarif` 註解、移除 `upload-artifact` 步驟,permissions 補回 `security-events: write` + `actions: read`。
2. `setup-cicd/ci-cd.yml` auto-cicd job:permissions 補回同兩項(reusable 取交集,兩端都要)。
3. 確認 repo / org **Settings → Code security → Code scanning 已啟用**。
4. 發新 tag(屆時依改動性質判 PATCH/MINOR),各專案 caller 升版。

### 發版分類:為什麼判 PATCH(v1.0.2)而非 MAJOR

[RELEASE.md](../RELEASE.md) 的 SemVer 表把「**拿掉 step**」列在 MAJOR。本次確實移除了 `upload-sarif` step,字面上像 MAJOR,但最後判 **PATCH**,理由:

- **inputs / outputs 不變、判決邏輯(四態 row1~row9)不變** —— caller 介面零變動。
- **semgrep 掃描與擋人能力完全不變** —— 只是把報告目的地從 Code Scanning 換成 artifact;step 是「替換」不是「拿掉功能」。
- **caller 無須任何動作** —— 移除的權限對 caller 是無害 no-op;只需把 tag 升到 v1.0.2。
- **本質是修損**:修正前 `security-scan` 永遠紅燈 → 判決 row2 讓**每個 PR 都被 reject、auto-merge 整條卡死**;這次是**把壞掉的行為救回**,正是 PATCH 的定義。

> 教訓:SemVer 分類看的是「**對 caller 的相容性影響**」,不是「動作的字面分類」。RELEASE.md 把「拿掉 step」歸 MAJOR,是因為**典型情況**下拿掉 step = 拿掉 caller 依賴的功能;當「拿掉 step」其實是修損 + 不影響 caller 契約時,應回歸 PATCH。判版本先問:**caller 需不需要改、行為對外有沒有變?**

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
