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
| [01](01-codeql-upload-sarif-permission.md) | reusable workflow 權限 × CodeQL upload-sarif | private repo 上傳 SARIF 缺 `actions: read` → `Resource not accessible by integration`;且 reusable 權限是 caller×callee 取交集,兩端都要給 |
