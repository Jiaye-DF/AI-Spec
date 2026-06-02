# Github-CI 技術筆記

每次在 Auto-CI-CD / GitHub Actions 上實際踩到的問題、技術點、排查過程,寫成一篇,做為**未來學習與排查的依據**。

不是規格文件(規格在 `../Github-CI.md`、`../RELEASE.md`、`../../Architecture/`),這裡是「**踩過的坑 + 為什麼**」的累積。

---

## 怎麼寫一篇筆記

- 一個問題 / 一個技術點 = 一個檔,檔名 `NN-<主題>.md`(數字前綴排序)。
- 建議結構:**現象 → 根因 → 修法 → 為什麼這樣修 → 延伸知識 → 教訓**。
- 貼**真實 log / 真實 diff**,比事後重述精準。
- 結論先寫(TL;DR),細節在下面。

---

## 索引

| # | 主題 | 一句話 |
| --- | --- | --- |
| [01](01-codeql-upload-sarif-permission.md) | reusable workflow 權限 × CodeQL upload-sarif | 兩層問題:① 缺 `actions: read`(顯式 permissions 未列=none、reusable 取交集)② Code Scanning 需 GHAS 未開。最終解綁 Code Scanning、SARIF 改存 artifact,待組織帳號再加回 |
| [02](02-push-review-design.md) | auto-cicd 全流程 + push 事件審查設計(🧭 規劃中)| 目標讓 PR/push 跑同套檢查;push reject 擋部署、不走人工。卡平台 `/review` 需支援 push-mode(L2 放寬 X-DF-PR)。YAML 未實作,待兩側一起上 |
