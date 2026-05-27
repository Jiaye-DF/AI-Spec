# CI/CD 管理平台 規劃

> 本檔最終會成為 CI/CD 管理平台的完整流程設計。

---

## 部署環境

部署在 **Coolify**

---

## L3 · 自訂 header 隱形濾網

**目的**:擋 robot 掃描 + 身份綁定 + 外部 repo 過濾。
**前提**:0 個新 GitHub 設定,只重用既有 `CICD_PLATFORM_KEY`。

### GHA 端送 4 個自訂 header

| Header | 來源 |
|--------|------|
| `X-DF-Author` | PR 作者(login) |
| `X-DF-Author-Email` | PR 作者 email |
| `X-DF-Repo` | repo 全名(e.g. `Dafon-IT/CRM-Backend`) |
| `X-DF-PR` | PR 號 |
| `X-DF-Commit-SHA` | commit SHA |

外加既有的 `Authorization: Bearer $CICD_PLATFORM_KEY`。**5 個 X-DF-* 全部來自 GHA context**,不需要新 secret / variable。

### 平台端 4 道檢查(任一失敗 → 404)

1. 5 個 X-DF-* header 都在
2. `Authorization` Bearer 對
3. `X-DF-Repo` 在 allowlist(`Dafon-IT/` 開頭)
4. 通過 → 繼續 `/review` 業務邏輯

**為何回 404 不回 401**:讓 robot scanner 以為 endpoint 不存在 → 放棄繼續探。

---

## 安全防線總覽

| 層 | 機制 | 部署位置 |
|----|------|---------|
| L1 | SSL / reverse proxy | Coolify 自帶 |
| L3 | 5 個 X-DF-* + repo allowlist + 404 | FastAPI middleware |
| L4 | Bearer auth | FastAPI(既有) |
| L5 | Redis 30 req/min/repo | FastAPI(既有) |

**沒採用**:L2 IP allowlist(GHA IP range 太寬)、HMAC 簽 body(Bearer leak 救不了那種情境,過度設計)。

---

## 實作細節

GHA 端 curl 範例與平台端 middleware 程式碼:見 [process-design-v1.1.md](./process-design-v1.1.md) Stage ④ 與 Stage ④' 模組 1。
