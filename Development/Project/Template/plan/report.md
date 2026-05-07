# plan-v1.0.md 流程優化與細項拆分建議

> **狀態**:草案(待 user 批准後動筆)
> **產出時間**:2026-05-07(UTC+8)
> **作者**:AI(Claude Opus 4.7 / 1M context)
> **對應**:`Template/plan/plan-v1.0.md`(user 撰寫的流程設計)
> **參照框架**:Anthropic Agent Harness Engineering + [agents.md spec](https://agents.md) + 企業 Coolify 部署現況

本報告針對 `plan-v1.0.md` 的 4 個核心目的 + 10 步流程,提供:
1. **整體點評** — 優點 / 缺口 / 建議(§1)
2. **完整資料夾結構** — 對齊 user 的 10 步,含補位(§2)
3. **細項檔案拆分** — 每個資料夾內部該有哪些檔(§3)
4. **補位設計** — prompts、Tasks 流向、code review(§4)
5. **自適應學習機制**(具體實作) — 對應核心目的 #3(§5)
6. **跨 IDE 通用機制**(具體實作) — 對應流程 #1(§6)
7. **Anthropic Harness Engineering 對照表**(§7)
8. **取捨與風險 + 待決策**(§8、§9)

標記說明:⭐⭐⭐ 必要 / ⭐⭐ 建議 / ⭐ 可選

---

## 1. 對 plan-v1.0.md 的整體點評

### 1.1 4 個核心目的

| # | 你寫的 | 點評 | 行動 |
| --- | --- | --- | --- |
| 1 | 限制前後端技術架構資料庫設計,符合安全性與資料一致性 | ✅ 現 docs/Design-Base 五份檔案已部分達成,只是過粗(每 area 一檔) | 拆檔(§3) |
| 2 | 基本 CI 功能 | ⚠️ 現 Template 只有〈90-code-review.md § 2〉一段提 CI audit,沒有獨立資料夾 | 新增 `05-CI/`(§3) |
| 3 | 自適應學習調整規範文件的變化 | ⭐ **亮點 — 但缺具體機制**。fixed.md 已是雛形,但沒有「往 docs/Design-Base 升級」的回流路徑 | §5 設計閉環 |
| 4 | 整合成 Coolify 部署規範格式 | ⚠️ 現 Template 明說「不規範部署」,跟核心目的衝突 | 改方向 — `06-Coolify-CD/` 從 Boundaries 改為**規範**(§3) |

**關鍵衝突**:現有 `Template/AGENTS.md` 開頭寫「**本模板不規範部署細節**」,但核心目的 #4 明確要納入 Coolify。**P1 必須拿掉「不規範部署」這條約定**,改成「**規範限定為 Coolify + Docker Compose,其他平台不適用**」。

### 1.2 10 步流程逐步點評

| 步驟 | 你寫的 | 優點 | 缺口 | 建議 |
| --- | --- | --- | --- | --- |
| 1 | `CLAUDE.md` / `AGENTS.md` 框架(跨 IDE + Model 通用) | 方向正確 — 對齊 agents.md spec | 沒講分工(兩檔重複會 drift)、沒講 capability baseline | §6 設計嚴格分工 |
| 2 | `00-overview/` 設計專案開發注意事項 | 從單檔升資料夾 ✅ 符合 progressive disclosure | 沒說「跨領域共通底線」放這、各 area 私有規則放對應資料夾 | §3.1 細分 |
| 3 | `01-propose/` 版本更新詳細內容(Propose vs Tasks 分工) | 補了 propose / tasks 雙軸維度 ✅ | propose / tasks 拆解規則 / multi-agent 協議要規範 | §4.2 補資料流圖 + §3.2 |
| 4 | `02-frontend/` 前端注意事項 | ✅ | 拆分 13 條現規則到子檔 | §3.3 |
| 5 | `03-backend/` 後端注意事項 | ✅ | 拆分 15 條現規則到子檔(+ performance) | §3.4 |
| 6 | `04-databases/` 資料庫注意事項 | ✅(複數 `s` 也 OK) | 拆分 11 條現規則到子檔(+ query optimization) | §3.5 |
| 7 | `05-CI/` Github CI 規範 | ✅ 新增 | 沒講 dependency audit / branch protection / OIDC | §3.6 |
| 8 | `06-Coolify-CD/` Coolify 部署規範 | ✅ 新增、對齊企業現況 | 沒講 Dockerfile / compose / healthcheck / rollback | §3.7 |
| 9 | `90-third-party-service/` 三方服務 | ✅ 補位 | 沒講 SMTP / SSO / payment 的具體子檔 | §3.8 |
| 10 | `99-code-review/` 收口 | ✅ — 對應 Anthropic verify-as-highest-leverage | 沒講 lint / performance / security checklist 等收口 | §3.9 |

### 1.3 結構性缺位(plan 沒提到但需要)

| 缺位 | 為什麼必要 | 建議 |
| --- | --- | --- |
| ⭐⭐⭐ Prompts / Skill 位置 | `init-project` / `scan-project` / `propose-to-tasks` / `reflect-rules` 跨 IDE 要怎麼放?(Claude `.claude/commands/` ≠ Codex / Cursor 路徑) | 新增 `Template/prompts/`(§4.1) |
| ⭐⭐⭐ Tasks / Fixed.md 落地路徑 | `01-propose/` 是 meta 規範,實際 task / fixed 落地在 `docs/Tasks/v*/`,需要明確聲明 | §4.2 補資料流圖 |
| ⭐⭐ 編號決策 | 連號(02/03/04)v.s. 跳號(10/20/30)需明確 | 建議資料夾連號(00-09 留 10 位)、資料夾**內部檔案**也用 00-99 連號(§2.2) |
| ⭐⭐ 跨 IDE 通用實作層 | 你只說「需要」沒說「怎麼做」 | §6 詳述 |

---

## 2. 完整資料夾結構建議

### 2.1 推薦結構

```
Development/Project/Template/
├── README.md                    # Template index(使用協議 / 升級協議)
├── AGENTS.md                    # 跨工具事實層 single source(agents.md spec 六區塊)
├── CLAUDE.md                    # Claude 特化薄層(import AGENTS.md,不重述)
├── prompts/                     # 跨 agent skill(YAML frontmatter)
│   ├── README.md                # 各 IDE / 工具如何讀取
│   ├── init-project.md          # type: workflow
│   ├── propose-to-tasks.md      # type: agent — orchestrator
│   ├── scan-project.md          # type: agent
│   └── reflect-rules.md         # type: agent — 自適應學習觸發(§5)
├── plan/                        # 本資料夾(Template 自身演進)
│   ├── plan-v1.0.md             # 流程定義(user 寫)
│   └── report.md                # 本報告
└── docs/Design-Base/
    ├── 00-overview/             # 跨領域共通底線
    ├── 01-propose/              # 版本演進 + Multi-agent 規範(meta)
    ├── 02-frontend/             # 前端硬規則
    ├── 03-backend/              # 後端硬規則
    ├── 04-databases/            # 資料庫硬規則
    ├── 05-CI/                   # GitHub CI 規範
    ├── 06-Coolify-CD/           # Coolify 部署規範(企業限定)
    ├── 90-third-party-service/  # 三方服務串接
    └── 99-code-review/          # Code Review 收口
```

### 2.2 編號規則(建議統一)

- **資料夾**:`00`-`09`(連號,留 10 位給日後擴充)+ `90`-`99`(補充類)
- **檔案內部**:`00`-`99`(連號,例如 `02-frontend/00-overview.md`、`02-frontend/01-routing-and-error.md` ...)
- **每個資料夾必有** `00-overview.md`(該領域的入口 + 風格地板)
- **檔名**:`{編號}-{kebab-case-topic}.md`,英文小寫,topic 名詞為主

### 2.3 採用方專案落地後的結構

```
<project>/
├── AGENTS.md                    # 從 Template 複製
├── CLAUDE.md                    # 從 Template 複製
├── docs/
│   ├── Design-Base/             # 從 Template/docs/Design-Base/* 全複製
│   ├── Prompts/                 # 從 Template/prompts/* 全複製(跨 agent 都讀得到)
│   └── Tasks/
│       ├── v1.0/
│       │   ├── propose-v1.0.md  # User 寫:版本目標
│       │   ├── tasks-v1.0.md    # Agent 拆:執行單元清單
│       │   ├── tasks/           # 細分子任務(可選,multi-agent 用)
│       │   │   └── task-NNN-<slug>.md
│       │   └── fixed.md         # 實作中根因累積
│       ├── reflect/             # /reflect-rules 報告累積
│       └── scan-project/        # /scan-project 報告累積
└── .claude/
    └── commands/                # Claude-only 入口
        ├── init-project.md      # 一行 `@docs/Prompts/init-project.md`
        ├── propose-to-tasks.md  # 一行 `@docs/Prompts/propose-to-tasks.md`
        ├── scan-project.md      # 一行 `@docs/Prompts/scan-project.md`
        └── reflect-rules.md     # 一行 `@docs/Prompts/reflect-rules.md`
```

---

## 3. 細項檔案拆分(中等正交粒度)

> 拆檔遵循「正交」原則:每檔對應獨立子任務情境;`00-overview.md` 收納「該 area 任何任務都要遵守的風格地板」。各檔的「現規則對應」列出來自舊 `*.md` 哪一條,確保不漏內容。

### 3.1 `00-overview/` 跨領域共通底線(6 檔)

| 檔 | 內容 | 現規則對應 |
| --- | --- | --- |
| `00-overview.md` | 入口 + 規範優先序 + Sources of Truth + 輸出語言 / 註解規則 / commit 語言 | 舊 `00-overview.md` § 1 SoT + `CLAUDE.md` 核心原則 |
| `01-versions.md` | 版本鎖到 patch(npm / pyproject / engines / `POSTGRES_VERSION`)| 舊 `00-overview.md` § 1 |
| `02-secrets.md` | 機密 env / `.gitignore` / fail-fast 引用 | 舊 `00-overview.md` § 2 + `20-backend.md` § 10 |
| `03-env-layers.md` | localhost vs 部署 / `.env.{dev,staging,prod}.example` | 舊 `00-overview.md` § 5 |
| `04-api-docs.md` | `docs_url=/api/docs` / 禁 `/swagger` | 舊 `00-overview.md` § 3 |
| `05-timezone.md` | UTC+8 / 禁 `TZ=` 雙轉換 | 舊 `00-overview.md` § 4 |

### 3.2 `01-propose/` 版本演進 + Multi-agent 規範(8 檔)

| 檔 | 內容 |
| --- | --- |
| `00-overview.md` | propose / tasks / fixed / changelog 四者關係圖 + multi-agent flow |
| `01-propose-format.md` | **User 寫的** `propose-v*.md` 格式(版本目標 / scope / 對外承諾 / 風險) |
| `02-task-decomposition.md` | **Agent 拆 tasks 方法論**:粒度(1–4 hr)/ 依賴標註 / 並行性 / Acceptance |
| `03-multi-agent-flow.md` | Orchestrator-Workers 協議 + 衝突解決(同檔互鎖)+ 進度同步 |
| `04-fixed-format.md` | `fixed.md` 條目格式(問題 / **根因** / 修正 / 影響) |
| `05-version-bump.md` | major / minor / patch 判準 |
| `06-changelog.md` | 對外 user-facing `CHANGELOG.md` 格式 |
| `07-rule-evolution.md` | `fixed.md` → reflect → docs/Design-Base 升級閉環(§5 詳述) |

### 3.3 `02-frontend/` 前端硬規則(6 檔,正交拆)

| 檔 | 內容 | 現規則對應 |
| --- | --- | --- |
| `00-overview.md` | 風格地板:TS strict / 渲染效能 / i18n / ID 隱藏 / 字級 / 命名 | 舊 § 6, 7, 8, 9, 10, 13 |
| `01-routing-and-error.md` | 路由錯誤邊界 | 舊 § 1 |
| `02-api-and-state.md` | API 呼叫集中 + 狀態管理三層 | 舊 § 2, 5 |
| `03-env-and-auth.md` | env 前綴(VITE_*/NEXT_PUBLIC_*)+ httpOnly cookie 認證 | 舊 § 3, 4 |
| `04-datetime.md` | `utils/datetime.ts` 統一入口 | 舊 § 11 |
| `05-components.md` | 共用 Hook / Component / 禁 alert | 舊 § 12 |

### 3.4 `03-backend/` 後端硬規則(9 檔,正交拆)

| 檔 | 內容 | 現規則對應 |
| --- | --- | --- |
| `00-overview.md` | 風格地板:分層 / 命名 / 型別 / 註解 | 舊 § 1, 13, 14 |
| `01-routing.md` | 路由 + ApiResponse 外殼 + Pydantic schema | 舊 § 2, 4 |
| `02-auth.md` | JWT cookie + Depends + CORS | 舊 § 5, 7 |
| `03-async-and-tx.md` | async safety + 多表 transaction | 舊 § 8, 9 |
| `04-config.md` | Settings + fail-fast + lifespan | 舊 § 3, 10 |
| `05-exceptions-and-logging.md` | 3 個 handler + logger.exception | 舊 § 6, 11 |
| `06-clients.md` | clients/* 集中 | 舊 § 12(細節在 `90-third-party-service/`) |
| `07-testing.md` | 真 DB + respx | 舊 § 15 |
| `08-performance.md` | N+1 / async 阻塞 / event loop 飢餓 | **(待補充項目)** |

### 3.5 `04-databases/` 資料庫硬規則(10 檔,正交拆)

| 檔 | 內容 | 現規則對應 |
| --- | --- | --- |
| `00-overview.md` | 風格地板:7 必備欄位 / BaseModel / 命名 | 舊 § 1, 9 |
| `01-identifiers.md` | pid / uid / 外部系統 ID | 舊 § 2 |
| `02-soft-delete.md` | is_deleted + Repository 命名 | 舊 § 3 |
| `03-passwords-and-pii.md` | bcrypt + PII 隔離 | 舊 § 5 |
| `04-sql-safety.md` | bindparams | 舊 § 6 |
| `05-precision.md` | 金額 Numeric | 舊 § 7 |
| `06-timezone.md` | TIMESTAMP 與顯示層一致 | 舊 § 8 |
| `07-connection.md` | async_sessionmaker | 舊 § 4 |
| `08-alembic.md` | migration 規範 | 舊 § 10 |
| `09-indexes-and-perf.md` | 索引 + N+1 + EXPLAIN ANALYZE | 舊 § 11 + **(待補充項目)** |

### 3.6 `05-CI/` GitHub CI 規範(9 檔)

| 檔 | 內容 |
| --- | --- |
| `00-overview.md` | workflow 結構 + 觸發策略(push / PR) |
| `01-frontend-jobs.md` | npm ci / lint / typecheck / test / build |
| `02-backend-jobs.md` | uv sync / ruff / mypy / pytest / alembic upgrade head(用測試 DB) |
| `03-dependency-audit.md` | npm audit + pip-audit(`continue-on-error: true → false` 時程) |
| `04-secret-scan.md` | gitleaks / trufflehog |
| `05-security-scan.md` | SAST(semgrep)+ container scan(trivy) |
| `06-e2e.md` | Playwright(預設 `if: false`) |
| `07-branch-protection.md` | `main` 必經 PR / required reviewers / 禁 force push |
| `08-secrets-and-oidc.md` | GitHub Secrets / OIDC / 禁明文 token |

### 3.7 `06-Coolify-CD/` Coolify 部署規範(9 檔,企業限定)

| 檔 | 內容 |
| --- | --- |
| `00-overview.md` | Coolify 介紹 + 部署模型(Git push → 自動 build & deploy) |
| `01-compose.md` | docker-compose.yml + healthcheck 指向 `/api/v1/health` |
| `02-dockerfile-backend.md` | multi-stage / uv 安裝 / 非 root |
| `03-dockerfile-frontend.md` | Vite:nginx / Next:standalone output |
| `04-env-and-secrets.md` | Coolify env 注入 + Coolify Secrets vs 環境變數 + rotation |
| `05-deploy-flow.md` | Git push main → Coolify webhook → build → deploy + staging vs prod |
| `06-rollback.md` | Coolify 內建 rollback / 緊急 git revert + push |
| `07-observability.md` | Coolify log / metrics / Sentry 整合 |
| `08-domains-and-tls.md` | Coolify 自動 TLS / domain mapping / preview env |

### 3.8 `90-third-party-service/` 三方服務(8 檔)

| 檔 | 內容 |
| --- | --- |
| `00-overview.md` | 治理:命名 / 集中位置 / 錯誤轉換契約 |
| `01-client-design.md` | clients/ 結構 + httpx.AsyncClient + error mapping + timeout / retry |
| `02-rate-and-cost.md` | rate limit + API cost log + 預警閾值 |
| `03-smtp.md` | SMTP / 信件 client 範本 |
| `04-sso-azure-ad.md` | Azure AD SSO 範本(MSAL / state CSRF / claims mapping) |
| `05-payment.md` | 金流 client 範本(Stripe / 綠界 / webhook 簽章) |
| `06-monitoring.md` | Sentry / Datadog / Loki client |
| `07-lint-bot.md` | Lint Bot / reviewdog / codecov |

### 3.9 `99-code-review/` Code Review 收口(8 檔)

| 檔 | 內容 |
| --- | --- |
| `00-overview.md` | Code Review 收口位置 + acceptance gate |
| `01-fixed-md.md` | `fixed.md` 規範(寫入時機 / 條目格式 / 雙向引用 / 跨版本既存) |
| `02-commit-message.md` | `(AI?) <類型>: <描述>` 格式 + 禁 `--force` / `--no-verify` |
| `03-pr-self-check.md` | PR self-check 列表(共同 / 後端 / 前端 / DB / 部署) |
| `04-lint-checklist.md` | Lint 通過判準(各 area lint 工具 + 容忍度) **(待補充項目)** |
| `05-performance-checklist.md` | N+1 / re-render / 大 JSON parse / DB query plan **(待補充項目)** |
| `06-security-checklist.md` | OWASP Top 10 + 機密外洩 + dependency CVE **(待補充項目)** |
| `07-review-process.md` | 流程:誰 review、何時 merge、衝突仲裁 |

---

## 4. 補位設計

### 4.1 `Template/prompts/`(跨 agent skill)⭐⭐⭐

每份 prompt 必含 frontmatter:

```yaml
---
name: <command-name>
type: workflow | agent
description: <一句話 + when to use>
when_not_to_use:
  - <條件 1>
inputs:
  - name: <param>
    type: <string | enum | bool>
    required: <true | false>
    default: <值>
capabilities_required:
  - file_read | file_write | shell_exec
---
```

並結尾 `## Acceptance` — 機械可驗收條件,任一失敗不報告完成。

### 4.2 Tasks / Fixed.md 落地流向 ⭐⭐⭐

```
規範層(Template/docs/Design-Base/01-propose/)
  └── 規定該怎麼寫 propose / tasks / fixed / changelog
            ↓ 落地
實作層(<project>/docs/Tasks/v{X.Y}/)
  ├── propose-v{X.Y}.md       # User 寫(版本目標)
  ├── tasks-v{X.Y}.md         # Agent 拆(總清單)
  ├── tasks/<task-N>.md       # Agent 拆(細節,multi-agent 認領)
  └── fixed.md                # 實作中累積(規範違反 / bug 根因)
            ↓ 累積數版本後
回流層(/reflect-rules)
  └── 將 fixed.md 反覆出現的 pattern 提煉成新規則 → 升級 docs/Design-Base
```

### 4.3 與 plan-v1.0.md 10 步流程的映射

| plan 10 步 | 落地檔 |
| --- | --- |
| 步 1 — `CLAUDE.md` / `AGENTS.md` 框架 | `Template/{AGENTS,CLAUDE}.md` |
| 步 2 — `00-overview/` | `docs/Design-Base/00-overview/*` |
| 步 3 — `01-propose/`(propose vs tasks) | `docs/Design-Base/01-propose/*` |
| 步 4 — `02-frontend/` | `docs/Design-Base/02-frontend/*` |
| 步 5 — `03-backend/` | `docs/Design-Base/03-backend/*` |
| 步 6 — `04-databases/` | `docs/Design-Base/04-databases/*` |
| 步 7 — `05-CI/` | `docs/Design-Base/05-CI/*` |
| 步 8 — `06-Coolify-CD/` | `docs/Design-Base/06-Coolify-CD/*` |
| 步 9 — `90-third-party-service/` | `docs/Design-Base/90-third-party-service/*` |
| 步 10 — `99-code-review/` | `docs/Design-Base/99-code-review/*` |
| **(補位)** Skill / Slash command | `Template/prompts/*` |

---

## 5. 自適應學習機制(對應核心目的 #3)⭐⭐⭐

### 5.1 三段式回流路徑

```
A. 觀察期(每次 commit)
   - 規範違反 / bug → 寫入該版本 fixed.md(根因 / 修正 / 影響檔案)
   - 規範被推翻 → tasks-v*.md checkbox 補「— 已改為 xxx,見 fixed.md §N」+ fixed.md 條目
   ↓
B. 反思期(/reflect-rules,建議**月度**或**版本結束時**手動觸發)
   - 讀取 docs/Tasks/v*/fixed.md 全部條目
   - 找 pattern:同一規則 ≥ 3 次違反 / 同類根因重複 / 規範矛盾
   - 產出 reflect-report-{YYMMDDHHMMSS}.md(放 docs/Tasks/reflect/)
   ↓
C. 升級期(user 批准後)
   - 修 docs/Design-Base/* 對應檔
   - docs/Design-Base 變更也要 commit(類型 `Modify`)+ 在 fixed.md 註明「升級 docs/Design-Base/xx,見 commit yyy」
   - 棄用規則 → 該檔加 `> **狀態:已棄用,見 fixed.md vX.Y §N**`
```

### 5.2 `Template/prompts/reflect-rules.md`(新 skill)

```yaml
---
name: reflect-rules
type: agent
description: 從 fixed.md 累積找規範缺口 / 規則矛盾 / 候選新規則。當 user 說「規範反思 / reflect rules / 月度 audit」時觸發。
when_not_to_use:
  - 沒有 fixed.md 累積(< 5 條條目)
  - 想直接修 docs/Design-Base(本 skill 只產報告,改規範另起 commit)
inputs:
  - name: scope
    type: enum(all | env | be | fe | db | sec)
    default: all
  - name: since
    type: ISO date
    default: 上次 reflect-report 的日期
capabilities_required:
  - file_read
  - shell_exec(可選 — 用於 git log 對應規則變更歷史)
---
```

### 5.3 `01-propose/07-rule-evolution.md` 規範

落地的回流規則 — 規定誰可以修 docs/Design-Base、什麼條件下可以修、修了之後要做什麼:

```markdown
## 規範升級條件
- 同類 fixed.md 條目 ≥ 3 個跨 ≥ 2 版本 → 候選升級為硬規則
- 規範變更必經 PR + ≥ 1 reviewer 同意
- 變更後該規則檔頭加 `> **變更紀錄:vX.Y commit xxx,理由:對應 fixed.md vX.Y §N**`
- docs/Design-Base 升級不破壞 backward-compat;新規則只規範**該 commit 之後**的 code
```

---

## 6. 跨 IDE 通用機制(對應流程 #1)⭐⭐⭐

### 6.1 嚴格分工

| 檔 | 角色 | 對什麼工具 |
| --- | --- | --- |
| `AGENTS.md` | **跨工具事實層 single source**:Commands / Testing / Code style / Git workflow / Security / Boundaries / Rule precedence | Claude / Codex / Cursor / Cline / Aider 都讀 |
| `CLAUDE.md` | **Claude 特化薄層**:Plan mode / Skill / Sub-agent / TodoWrite / Verify loop;首段 import `@AGENTS.md`,**不重述**事實 | Claude Code only |
| `prompts/*.md` | **跨工具 skill / slash command**:每份 frontmatter 標 trigger / inputs / acceptance | 各工具在自己的入口路徑指向這些檔 |

### 6.2 入口路徑對照(各工具不同,但內容同源)

| 工具 | 入口 | 載入方式 |
| --- | --- | --- |
| Claude Code | `.claude/commands/<name>.md` | 內含 `@docs/Prompts/<name>.md`(import) |
| Codex CLI | session 開頭附上 `docs/Prompts/<name>.md` 全文 / AGENTS.md 標註可呼叫 | 直讀 |
| Cursor | `.cursor/rules/` 引用 + chat 拖檔 / AGENTS.md | 規則 / 引用 |
| Cline | `.clinerules/` 引用 / AGENTS.md | 規則 |
| Aider | `--read docs/Prompts/<name>.md` 或初始 prompt 附上 | CLI 參數 |

**改規則只改一處** — `Template/docs/Design-Base/*` 與 `Template/prompts/*`。各工具入口都是 import / 直讀,不複製內容。

### 6.3 Capability Baseline(地板)

`AGENTS.md` 內聲明:

```markdown
## Agent Capabilities Baseline

本規範以「能讀檔 / 能寫檔 / 能執行 shell」為地板。
若你的工具更強(plan mode / sub-agent / hook / skill),只可**加強**遵守程度,不可**降低**:
- 有 hook → commit 格式檢查接 hook
- 有 sub-agent → scan-project / reflect-rules 可分派
- 都沒有 → 純照 docs/Prompts/*.md 步驟跑

不在地板能力清單的工具(如:純 chat 介面無 file write)→ 本規範不適用,需手動執行。
```

---

## 7. Anthropic Harness Engineering 對照表

> 確保 Template 設計對齊 Anthropic 公開的 6 大原則。

| 原則 | 落地位置 | 狀態 |
| --- | --- | --- |
| **Context as finite resource** — 只給高訊號 token | `AGENTS.md § Just-in-time Loading` 任務對照表 | ⭐⭐⭐ 必設計 |
| **Just-in-time loading** | 不預載 `Tasks/scan-project/*`、舊版 `fixed.md`,需要時才讀 | ⭐⭐⭐ |
| **Sub-agent isolation** | `prompts/scan-project.md` `context_strategy`(大專案分派子 agent) | ⭐⭐ |
| **Tool description like to a new hire** | `prompts/*.md` frontmatter `description` + `when_not_to_use` | ⭐⭐⭐ |
| **Tool 是 LLM-Computer Contract** | `prompts/*.md` 結構化 `inputs` + `## Acceptance`(機械可驗收) | ⭐⭐⭐ |
| **Skill 不該總是 load** | frontmatter `description` 講清「何時用」、長 prompt 拆檔 | ⭐⭐⭐ |
| **Workflow vs Agent 分清** | frontmatter `type: workflow | agent` | ⭐⭐ |
| **CLAUDE.md ruthless prune** | CLAUDE.md 縮到 ~35 行,不重述 AGENTS.md | ⭐⭐⭐ |
| **Imperative + ALWAYS/NEVER** | docs/Design-Base 全用 「禁 / 必」 | ✅ 現有已對齊 |
| **Verify loop** — 最高槓桿 | 每份 prompt 結尾 `## Acceptance` | ⭐⭐⭐ |
| **Persistent state via files** | `tasks-v*.md` + `fixed.md` + `reflect-report-*.md` | ✅ 雛形已有 |
| **Address root causes** | `fixed.md` 必寫根因、`/reflect-rules` 找 pattern 升級規範 | ⭐⭐⭐(§5) |

---

## 8. 取捨與風險

| 取捨 | A 方案 | B 方案 | 建議 |
| --- | --- | --- | --- |
| 編號制 | A. 連號(00-09 + 90-99) | B. 跳號(10/20/30/...) | A — plan 已定 |
| Coolify 強度 | A. 強規範(對齊企業現況) | B. 預留彈性(僅給範本) | A — 對應目的 #4,但 README 標明「企業限定」 |
| 06-Coolify-CD 是不是核心? | A. 是核心(必含) | B. Boundaries(預留位但不規範) | A — 對齊目的 #4 |
| `01-propose/` 與 `Tasks/` 關係 | A. propose 是 meta、Tasks 是落地 | B. 合併 | A — 不混淆規範 vs 內容 |
| 拆檔細度 | A. 細粒(100+ 檔) | B. 中等正交(~73 檔) | B — 拆細不為拆,正交為準 |
| docs/Design-Base 變更頻率 | A. 嚴格(只能透過 reflect-rules 流程) | B. 寬鬆(任何 PR 可改) | A — 對應目的 #3 自適應學習 |

### 風險

1. **拆檔太細 → 維護成本上升**:已採「中等正交」粒度緩解
2. **Coolify 規範鎖定 → 換平台困難**:平台無關規則(healthcheck endpoint、env 注入抽象)放 `00-overview/`
3. **自適應學習路徑沒人推 → 變死規範**:在 `01-propose/05-rule-evolution.md` 寫明「每版本結束 / 每月觸發,不跑視為品質債」
4. **跨 IDE 兼容性聲稱 vs 實測**:現實是只有 Claude 親測;緩解:寫進 README「實測支援:Claude Code;結構對齊未實測:Codex / Cursor / ...」

---

## 9. 待 user 決策事項

批准本報告前,請確認:

1. **編號制**:資料夾 `00-09 + 90-99` + 內部 `00-99`,可接受?(§2.2)
2. **拆檔細度**:採中等正交粒度(~73 檔)?(§8 取捨表)
3. **Coolify 強度**:強規範(compose 模板 / Dockerfile / healthcheck 全包)、或先骨架?
4. **自適應學習觸發頻率**:月度 / 每版本結束 / 純按需?
5. **跨 IDE 兼容範圍**:本次只實測 Claude(結構保留 Codex 兼容)、或同步測 Codex?
6. **執行階段切分**:
   - Phase 1 — 結構建立(空檔殼 + AGENTS.md / CLAUDE.md / prompts/ 改寫)
   - Phase 2 — 內容填入(docs/Design-Base 拆檔 + Coolify-CD + CI 規範)
   - Phase 3 — 自適應機制(`/reflect-rules` + 月度流程)

---

## 附錄 A — 主要參考來源

1. [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)(Anthropic, 2025-09)
2. [Writing Effective Tools for AI Agents](https://www.anthropic.com/engineering/writing-tools-for-agents)(Anthropic, 2025-09)
3. [Equipping Agents for the Real World with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)(Anthropic, 2025-10)
4. [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)(Anthropic Research, 2024-12)
5. [Best Practices for Claude Code](https://code.claude.com/docs/en/best-practices)
6. [Building Agents with the Claude Agent SDK](https://claude.com/blog/building-agents-with-the-claude-agent-sdk)
7. [Harness Design for Long-Running Apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)(Anthropic, 2025)
8. [Agent Skills Overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
9. [agents.md spec](https://agents.md) / [How to Write a Great agents.md (GitHub Blog)](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)
10. [Coolify Documentation](https://coolify.io/docs)

---

## 附錄 B — 可直接挪用的提示句型(Anthropic 官方原話)

1. `"Find the simplest solution possible, and only increase complexity when needed."`
2. `"Add complexity only when it demonstrably improves outcomes."`
3. `"For each line ask: Would removing this cause Claude to make mistakes? If not, cut it."`
4. `"Address the root cause, don't suppress the error."`
5. `"Don't make Claude guess."` — 顯式給檔名 / scenario / test preference
6. `"Gather context → take action → verify work → repeat."` — agent loop 心法
7. `"Surface the right context"` / `"smallest set of high-signal tokens"` — context 篩選
8. `"Describe a tool as you would describe it to a new hire."` — tool description 寫法
9. `"If a rule keeps being ignored, the file is too long — prune or convert to a hook."`
10. `"Treat CLAUDE.md like code: review it when things go wrong, prune it regularly."`
