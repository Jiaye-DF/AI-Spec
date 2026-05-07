# 02-secrets — 敏感資訊

> **何時讀**:處理 env / auth / log 時讀。

- 機密(token / password / connection string / API key)**僅**透過 env(`Settings(BaseSettings)` 讀取)
- `.gitignore` 必排 `.env`、`credentials*`、`*.key`、`*.pem`
- `.env` **不可**曾被 commit(`git log --all -- .env` 須為空);若曾 commit → 全 key rotate
- 機密**禁**寫進程式碼字面值
- prod 啟動須 fail-fast(見 `03-backend/04-config.md § 啟動 fail-fast`)
