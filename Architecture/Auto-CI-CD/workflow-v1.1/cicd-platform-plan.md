# CI/CD 管理平台 規劃

> 本檔最終會成為 CI/CD 管理平台的完整流程設計。目前處於累積規劃階段,各 section 會逐步補上。

---

## 安全防線(多層)

> **部署平台**:Coolify。SSL termination、reverse proxy(Caddy / Traefik)、Let's Encrypt 自動續憑都由 Coolify 處理,不需另外設 Cloudflare 或反向代理。

| 層 | 機制 | 攔截目標 | 狀態 |
|----|------|----------|------|
| L1 | Coolify 內建 reverse proxy + SSL | SSL termination | 部署層自帶,不需另設 |
| L2 | GitHub Actions IP allowlist | 非 GHA 來源 | 不採用(GHA IP range 範圍很寬,且需額外維護) |
| L3 | **自訂 header 隱形濾網 + repo allowlist** | 隨機 robot scanner、外部 repo 亂打 | 已設計(本檔下方) |
| L4 | Authorization Bearer | 已知 endpoint 的攻擊者 | 既有設計(process-design-v1.1.md Stage ④' 模組 1) |
| L5 | Rate limiting(Redis) | 暴力試 token | 既有設計(30 req/min/repo) |

**設計原則**:不新增任何 GitHub repo / organisation 層級設定,L3 只重用既有 `CICD_PLATFORM_KEY`。

---

## L3 · 自訂 header 隱形濾網 — 詳細設計

### 目的

1. **隱形** — 不認識 endpoint 的 robot scanner 收到 404 → 放棄(不像 401 會引誘繼續探)
2. **身份綁定 + audit** — 每個 request 都附帶誰、哪個 repo、哪個 PR、哪個 commit,平台端可以記錄、過濾、稽核
3. **repo allowlist** — 限定只接受 Dafon-IT 組織下的 repo

### Header 4 欄(全部來自 GHA context,免設定)

| Header | GHA 來源 | 範例 |
|--------|----------|------|
| `X-DF-Author` | `github.event.pull_request.user.login` + `.user.email` | `Jiaye-DF · df.it.all@df-recycle.com.tw` |
| `X-DF-Repo` | `github.repository` | `Dafon-IT/CRM-Backend` |
| `X-DF-PR` | `github.event.pull_request.number` | `123` |
| `X-DF-Commit-SHA` | `github.sha` | `abc1234` |

外加既有的 `Authorization: Bearer <CICD_PLATFORM_KEY>`(由 L4 驗證)。

**不需要新增**:HMAC signature、timestamp、任何新 secret。

---

### GHA 端送出範例

```yaml
- name: POST /review
  env:
    PLATFORM_URL: ${{ vars.CICD_PLATFORM_URL }}
    PLATFORM_KEY: ${{ secrets.CICD_PLATFORM_KEY }}
  run: |
    curl -X POST "$PLATFORM_URL/review" \
      -H "X-DF-Author:     ${{ github.event.pull_request.user.login }} · ${{ github.event.pull_request.user.email }}" \
      -H "X-DF-Repo:       ${{ github.repository }}" \
      -H "X-DF-PR:         ${{ github.event.pull_request.number }}" \
      -H "X-DF-Commit-SHA: ${{ github.sha }}" \
      -H "Authorization:   Bearer $PLATFORM_KEY" \
      -H "Content-Type: application/json" \
      --data-binary "@/tmp/review-body.json"
```

**沒有新 secret、沒有新 vars、沒有新 setup**,4 個 X-DF-* 全部來自 GHA context。

---

### 平台端 FastAPI middleware

```python
from fastapi import Request, Response

REPO_ALLOWLIST = ["Dafon-IT/"]   # prefix match
EXPECTED_BEARER = f"Bearer {settings.CICD_PLATFORM_KEY}"

@app.middleware("http")
async def stealth_filter(req: Request, call_next):
    h = req.headers
    
    # 1. 4 個 X-DF-* header 都在?
    required = ["x-df-author", "x-df-repo", "x-df-pr", "x-df-commit-sha"]
    if not all(k in h for k in required):
        return Response(status_code=404)
    
    # 2. Bearer 對?
    if h.get("authorization") != EXPECTED_BEARER:
        return Response(status_code=404)
    
    # 3. repo 在 allowlist?
    if not any(h["x-df-repo"].startswith(p) for p in REPO_ALLOWLIST):
        return Response(status_code=404)
    
    # L3 通過,繼續處理 /review business logic
    return await call_next(req)
```

**任何一步失敗 → 一律 404(不是 401),讓 robot 以為 path 不存在。**

---

### 既有 GitHub Secrets 配置(維持不變)

| Secret | 用途 | 狀態 |
|--------|------|------|
| `CICD_PLATFORM_KEY` | Bearer token | 既有,沿用 |
| `CICD_PLATFORM_URL` | 平台 URL(repo variable) | 既有,沿用 |

**0 個新 secret · 0 個新 organisation 設定 · 0 個 per-repo 新增設定。**

---

### 取捨

| 達到 | 沒做 |
|------|------|
| ✅ Robot 掃描 → 404 → 放棄 | ❌ 沒 HMAC,Bearer leak 後可 replay |
| ✅ Audit trail(每次都有 author / repo / PR / SHA) | ❌ 沒 timestamp 防 replay |
| ✅ Repo allowlist 擋外部 repo 亂打 | ❌ 沒 body integrity 簽章 |
| ✅ 0 新 setup | |

**Bearer leak 本身就是大事**,L3 的 HMAC 那種重型保護救不了那個情境,所以拿掉合理。對「擋 robot 掃描」這個首要目標而言,Option B 已經夠用。
