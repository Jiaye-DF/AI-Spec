# 05-exceptions-and-logging — 例外處理 + Logging

> **何時讀**:處理錯誤 / 加 log 才讀。

## 例外處理

全域註冊 3 個 handler:

| 例外 | 處理 |
| --- | --- |
| `AppError` | 對應 code + detail |
| `RequestValidationError` | 欄位級錯誤 |
| `Exception` | `logger.exception(...)` + 通用「伺服器錯誤」 |

response **禁**洩漏 stack trace / SQL / table 名 / 路徑 / 內部 host / token。詳細走 log。

## Logging

- Python `logging` 或 `loguru`
- 例外**必** `logger.exception(...)` 保留 traceback
- log 中**禁** token / password / API key 明文;敏感欄位記錄前過濾
- 結構化:`app_name` / `request_id` / ISO UTC timestamp
