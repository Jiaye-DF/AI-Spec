# 90-code-review — Code Review / 品質演進必守規則

`fixed.md` / dependency audit / commit / PR self-check。

---

## 1. `fixed.md` 規範

`tasks-v*.md` = 實作前規格、commit message = 事件流水;**`fixed.md` 補上「為什麼會發生 / 根因 / 影響範圍 / 同類如何避免」**。

### 寫入時機

修改既有程式碼且符合任一情境**必**寫入 `docs/Tasks/v{X.Y}/fixed.md`:

- bug 修補 / 設定 / env / migration 基礎設施錯誤
- 既有規格實作偏差
- 第三方升級 / API 變動 breaking change
- 效能 / 安全性回填

**不需寫入**:純依 `tasks-v*.md` 新功能、純文件 / 註解、不改行為的重命名 / 重構。

### 條目格式

```markdown
## N. <簡述>  〔YYYY-MM-DD HH:MM:SS〕

**問題**:<現象 / log>

<根因:何時被埋下、為何先前未暴露>

**修正**:<處置;多步驟 1./2./3.>

**影響檔案**:
- `path/to/file`
```

時間 `YYYY-MM-DD HH:MM:SS`(`Asia/Taipei`),全形〔〕標題尾。一條 = 一個問題;**根因**段是核心;沒寫清根因視為品質不合格。

### 雙向引用

fixed.md 涉及 task 規格被推翻 → 條目尾段附 `見 tasks-vX.Y.Z.md §N`;對應 task checkbox 後方補 `—（已改為 xxx,見 fixed.md §N）`。

---

## 2. CI Dependency Audit

`.github/workflows/ci.yml` **必**含:

- Frontend:`npm audit --audit-level=moderate`(於 `frontend-lint` 後)
- Backend:`pip-audit`(於 `backend-lint` 後;`uv pip install pip-audit && uv run pip-audit`)

容忍度 `moderate`;`moderate` / `high` / `critical` 必修。

第一輪 `continue-on-error: true` 先 surface;1–2 週清基線後改 `false`。**禁**長期保留 `continue-on-error: true`。

### 升級節奏

每月跑 `npm outdated` / `uv pip list --outdated`。major/minor 獨立 commit;patch 可批次。升級後**必**:audit 確認 CVE 未增 → lint + test → 同步 `00-overview.md § 技術棧`。

---

## 3. Commit Message

格式:`(AI?) <類型>: <描述>`(繁中)

類型:`Add` / `Modify` / `Fix` / `Refactor` / `Docs`

AI 產生**必**前綴 `(AI)`,例 `(AI) Fix: 修正 bcrypt 阻塞 event loop`。

**禁**:`--force` / `reset --hard` / `--no-verify` 未授權;skip hooks(hook 失敗去修 hook);偽造作者。

---

## 4. PR self-check

PR 前**必過**:

### 共同
- [ ] 規範遵守 `docs/Design-Base/*.md`
- [ ] `tasks-v*.md` checkbox 與頂部狀態一致
- [ ] `fixed.md` 條目(若觸發寫入時機)
- [ ] `.env.example` 同步新引用的 env
- [ ] 機密未入 commit:`git diff --staged | grep -iE "(secret|token|password|key)\s*[:=]"`
- [ ] Frontend:`npm run lint && npm run typecheck && npm run test`
- [ ] Backend:`uv run ruff check . && uv run pytest`
- [ ] CI audit 無新 high/critical
- [ ] commented-out code 已清

### 後端
- [ ] route response 用 Pydantic schema(非 `dict`)
- [ ] 受保護 endpoint 加 `Depends(require_*)`
- [ ] CPU-bound 同步操作已 `asyncio.to_thread`
- [ ] Service 多表寫入已 `async with db.begin():`
- [ ] 新加 secret 已進 `Settings._fail_fast_in_prod`
- [ ] 新 Repository `find_*` 預設過濾 `is_deleted`;不過濾版命名 `_including_deleted`

### 前端
- [ ] 元件未直 `fetch` / `axios`(走 RTK Query / `lib/api/`)
- [ ] 客戶端 env 用 `NEXT_PUBLIC_*` / `VITE_*`
- [ ] TS 無 `any`;props 獨立 `interface`
- [ ] callback `useCallback`、衍生 `useMemo`、列表元件 `React.memo`
- [ ] 文字走 i18n key;所有語系同步
- [ ] UI 不顯示 `*_uid`
- [ ] 字級不小於 `text-base`(密集 `text-sm md:text-base`)

---

## 5. 跨版本既存問題

非當版本引入但本版掃描出的舊規範違反 → 仍寫入**當版** `fixed.md`,但**必**:

1. 簡述後加 `（既存自 v{X.Y}）`
2. 根因段交代:在哪個版本 / PR 被引入 + 為何先前未暴露
3. 同類重複出現 → 條目末加 `> 同類追蹤:見 vX.Y/fixed.md §N`

`fixed.md` 是**該版本的品質演進真相**;不回填到舊版,以保「該版本完成時的當下視角」。
