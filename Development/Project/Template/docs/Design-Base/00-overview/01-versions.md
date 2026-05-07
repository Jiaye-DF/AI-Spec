# 01-versions — 版本鎖定

> **何時讀**:加套件 / 升版時讀。

**禁止**任何浮動版本(`^` / `~` / `*` / `latest` / `>=`)。一律鎖到 `MAJOR.MINOR.PATCH`。

- npm:`"react": "19.2.5"` ✅ / `"^19.0.0"` ❌
- pyproject:`"fastapi==0.136.1"` ✅ / `">=0.135"` ❌
- `engines.node` / `requires-python` 同樣鎖到 patch
- 本地服務版本於 `.env` 用 `POSTGRES_VERSION` 變數明示
- 升版獨立 commit:`Modify: 升級 <套件> 至 <版本>(理由)`,同 commit 含表格 + lock file +(若涉)`.env`

## Sources of Truth

`docs/Design-Base/00-overview/` 版本表格與 lock file **逐字一致**:`frontend/package-lock.json` + `backend/uv.lock` + `.env`(`POSTGRES_VERSION`)。不一致時以 lock 為準,立即修規範表。
