# 05-timezone — 時區

> **何時讀**:任何時間相關任務讀。

- 後端 / PostgreSQL / log 一律 **UTC+8 / Asia/Taipei**(專案可調但須**全棧一致**)
- DB schema TIMESTAMP 寫入規則須與顯示層轉換策略對齊(見 `04-databases/06-timezone.md`)
- 取系統時間直接 `date "+%Y-%m-%d %H:%M:%S"`;**禁** `TZ=Asia/Taipei date`(雙轉換)
