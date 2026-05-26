# 中央 reusable workflow 發版規範

`Dafon-IT/DF-AI-Spec/.github/workflows/` 內 6 支 reusable workflow 的版本管理 SOP。

> 對應 [process-design-v1.1.md § 版本管理](../Architecture/Auto-CI-CD/workflow-v1.1/process-design-v1.1.md#版本管理中央-reusable-repo)。

---

## 版本策略 — 只用 fixed SemVer tag 或 SHA

**不使用** floating major tag(`@v1` / `@v2`)。理由:floating tag 可被 force-push 重指,User 端 caller 無法看出實際跑了哪個 commit;單一錯誤 patch 可能瞬間散播到全公司所有專案。

| 寫法 | 例 | 適用 |
| --- | --- | --- |
| **fixed SemVer tag(預設)** | `@v1.0.0` / `@v1.0.1` | 一般專案;搭配 Dependabot 自動 PR 升版 |
| **40-char commit SHA** | `@abc1234567890abcdef…` | 受監管 / 對外正式服務 / 法遵敏感系統;最高安全層級 |

User caller 範例:

```yaml
backend-ci:
  uses: Dafon-IT/DF-AI-Spec/.github/workflows/ci-backend-python.yml@v1.0.0
  with:
    migration_tool: alembic
```

---

## 版本號規則(SemVer)

`vMAJOR.MINOR.PATCH`,以 6 支 reusable workflow 整體當作一個 release line。

| 升 | 何時 | 對 User 端 caller 的影響 |
| --- | --- | --- |
| PATCH(`v1.0.X`) | 修 bug、補 step、效能調整,**不動 inputs / outputs / 行為** | 無感升版,Dependabot 自動 PR 即可 |
| MINOR(`v1.X.0`) | 加新 input(向下相容)/ 加新 reusable(例 `ci-backend-go.yml`)/ 加非 breaking step | User 看 changelog 決定要不要用新欄位;不換 tag 沿用舊行為 |
| MAJOR(`vX.0.0`) | breaking change:改 input 名 / 改既有 input 預設行為 / 拿掉 step / `auto-cicd.yml` 判決邏輯改 | User 端 caller 必須改 tag + 確認相容性 |

對應目前狀態:
- 實作對齊 workflow-v1.0.md 規格 → 首版打 `v1.0.0`
- 之後加 migration_tool 偵測 / custom_undo_cmd / Java OWASP DC 都是 MINOR(向下相容,預設行為不變)→ 打 `v1.1.0`
- workflow-v1.1.md 規格(Agent Platform → CI/CD 管理平台 改名)實作完成後 = MAJOR → 打 `v2.0.0`(改 `AGENT_PLATFORM_URL` → `CICD_PLATFORM_URL` 是 breaking)

---

## 中央發版 SOP

### 1. PATCH(`v1.0.0` → `v1.0.1`)

```bash
# 確認改動是真 patch(不動 inputs / outputs / 行為)
git log v1.0.0..HEAD -- .github/workflows/

# 打 annotated tag(必 annotated,不用 lightweight)
git tag -a v1.0.1 -m "patch: <一句話描述>"
git push origin v1.0.1

# 在 GitHub 上建 Release(可選但建議)
gh release create v1.0.1 --notes "patch: <一句話描述>"
```

**不**做 `git tag -f v1 v1.0.1` 重指 floating tag — 我們不維護 floating tag。

### 2. MINOR(`v1.0.x` → `v1.1.0`)

```bash
# 整理 CHANGELOG / Release notes
git tag -a v1.1.0 -m "minor: 加 migration_tool 偵測 + custom_undo_cmd"
git push origin v1.1.0
gh release create v1.1.0 --notes-file <(echo "...")
```

通知公司各專案 tech-lead 看 changelog 決定要不要升;沒升的繼續用舊 tag,行為不變。

### 3. MAJOR(`v1.x.x` → `v2.0.0`)

**比 MINOR 多兩步**:
- 寫升版 migration guide(列出 breaking change + 改 caller 的步驟)
- 跑 grace period(例 2~4 週),期間舊 tag `v1.x.x` 不刪,User 自行升版

```bash
git tag -a v2.0.0 -m "major: Agent Platform → CI/CD 管理平台 改名;AGENT_PLATFORM_URL → CICD_PLATFORM_URL"
git push origin v2.0.0
```

---

## 退版

| 場景 | 動作 | 生效時間 |
| --- | --- | --- |
| **單專案退版**(發現新 tag 在某專案壞事)| User 改 caller `@v1.0.1` → `@v1.0.0` 後 push | 立即(該 branch 下次觸發) |
| **全公司退版**(新 tag 全面壞事,需立即停損)| 1. 中央通報「不要升 `v1.0.1`」 ▸ 2. 已升的專案手動退版(逐專案改 caller)▸ 3. 中央修 patch 重發 `v1.0.2` | 各專案自行協調 |
| **急停所有自動合併**(熔斷)| `gh variable set AUTO_MERGE_ENABLED --body false`(org level) | 立即;不需動 tag |

> 全公司退版**沒有**「中央一行指令搞定」的捷徑 —— 這是不用 floating tag 換來的代價,也是不用 floating tag 的好處(沒人能不知不覺被退到舊版)。急停請走熔斷開關。

---

## Tag 保護

中央 repo 應在 GitHub 設定:

- **Settings → Tags → Protected tags**:加 rule `v*`,禁止 force-push、禁止刪除
- **Settings → Branches → main**:branch protection,禁直 push、需 PR + review
- **Settings → Actions → General → Workflow permissions**:給予 reusable workflow 適當權限(本 repo 已在各 yml 內 `permissions:` 宣告)

加完保護後,即使中央團隊也不能 `git tag -f`,確保 tag 在打出來後 immutable。

---

## User 端建議(Dependabot 升版)

User 專案 `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    # 釘 SHA 的專案可加:
    # ignore: [{ dependency-name: "Dafon-IT/DF-AI-Spec/.github/workflows/*", update-types: [version-update:semver-major] }]
```

Dependabot 會掃 caller 的 `uses:` 字串,看到 `@v1.0.0` → 偵測中央有 `v1.0.1` → 自動開 PR 改 tag。配合 CI 跑過綠 + 1 個 reviewer approve 即可 merge。

---

## 異常處理

| 情況 | 處理 |
| --- | --- |
| 不小心打錯 tag 名(例 `v1.0.1` 打成 `v1.01`)| Tag 一旦 push 就 immutable;改打新 tag `v1.0.1`,把 `v1.01` 留著 |
| Tag 打到錯的 commit | 同上,打新 tag;舊 tag 在 GitHub Release UI 標 deprecated + 寫 redirect 說明 |
| 緊急安全 patch | 不走 grace period,直接 PATCH tag + 公告;User 端 Dependabot 通常 24h 內開 PR |
