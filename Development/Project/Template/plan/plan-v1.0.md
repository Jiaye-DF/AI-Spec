# 目標

打造以**企業規範**為主軸的 Harness Engineering Agents 約束規範與功能。對齊 Anthropic Agent Harness Engineering 設計原則 + [agents.md spec](https://agents.md)(跨 IDE 通用)+ 企業 Coolify 部署現況(無 K8s,主走 Coolify + Docker Compose)。

## 核心目的

1. **技術架構限制** — 前後端 / 資料庫設計符合安全性與資料一致性,規則為地板,違反即修
2. **基本 CI 功能** — GitHub Actions 規範化(lint / typecheck / test / dependency audit / secret scan / branch protection)
3. **自適應學習** — `fixed.md` 累積 → `/reflect-rules` → docs/Design-Base 升級的閉環(見〈自適應學習機制〉)
4. **Coolify 部署規範** — 企業現況限定,規範化 compose / Dockerfile / healthcheck / env 注入 / rollback

## 設計原則

- **規則為地板,寧嚴勿松** — 違反即修,不允許「先放著」
- **跨 IDE / Model 通用** — `AGENTS.md` 為事實層 single source,`CLAUDE.md` 僅補充 Claude 特性,`prompts/*` 跨工具 skill
- **正交拆分** — 拆檔不為拆而拆;每檔對應**獨立子任務情境**,寫 UI/UX 純樣式不必讀 DB / API / Auth 檔。判準:
  - ✅ **拆**:會被獨立引用(例 `04-databases/05-precision.md` 只在寫金額欄位才讀)
  - ✅ **拆**:跨 area 互動(例 `00-overview/05-timezone.md` 跨 BE / FE / DB)
  - ❌ **不拆**:該 area 任何任務都要遵守的「風格地板」(命名 / 型別 / 渲染等),併入該 area 的 `00-overview.md`
- **Just-in-time loading** — 任務啟動只載入必要檔,不預載歷史報告(`fixed.md` / `reflect-report-*.md` / `scan-project/*`)
- **Verify loop** — 每個 skill 結尾必有 `## Acceptance`,任一失敗不報告完成
- **Code Review 收口** — 流程閉環,所有 area 規範完成後**必經** `99-code-review/` 檢測(對應 Anthropic「verify is highest leverage」)
- **編號制** — 主規範資料夾 `00-06`(連號)+ 補充資料夾 `90-99`(留缺口);每資料夾內檔案 `00-99` 連號

## Propose vs Tasks 分工(關鍵)

| | 角色 | 由誰寫 | 內容 |
| --- | --- | --- | --- |
| **Propose**(`propose-v*.md`)| 版本目標定義 | **User** | 本版本要做什麼 / scope / 不在範圍 / 對外承諾 |
| **Tasks**(`tasks-v*.md` / `tasks/`)| 執行單元 | **Agent**(從 propose 拆) | 可被 multi-agent 並行執行的小任務區塊;每個 task 標明依賴 / 並行性 / 接受條件 |
| **Fixed**(`fixed.md`)| 規範違反 / bug 根因 | Agent 實作中累積 | 問題 / **根因** / 修正 / 影響檔案 |

**關鍵流程**:User 寫 propose → Agent 拆 tasks(orchestrator)→ Multi-agent 並行執行(workers)→ 過程中累積 fixed → 結束時 `/reflect-rules` 回流到 docs/Design-Base。

---

## Template 整體結構

```
Development/Project/Template/
├── README.md                    # Template index(使用協議 / 升級協議)
├── AGENTS.md                    # 跨工具事實層 single source(含 Just-in-time Loading 對照表)
├── CLAUDE.md                    # Claude 特化薄層(~35 行,import AGENTS.md,不重述)
├── prompts/                     # 跨 agent skill(YAML frontmatter)
│   ├── README.md
│   ├── init-project.md          # type: workflow
│   ├── propose-to-tasks.md      # type: agent — orchestrator
│   ├── scan-project.md          # type: agent
│   └── reflect-rules.md         # type: agent
├── plan/                        # Template 自身演進
│   ├── plan-v1.0.md             # 本檔
│   └── report.md                # 詳細優化建議報告(支撐文件)
└── docs/Design-Base/
    ├── 00-overview/             # 跨領域共通底線(全域議題)
    ├── 01-propose/              # 版本目標 / Tasks 拆解 / Multi-agent 協議
    ├── 02-frontend/             # 前端硬規則
    ├── 03-backend/              # 後端硬規則
    ├── 04-databases/            # 資料庫硬規則
    ├── 05-CI/                   # GitHub CI 規範
    ├── 06-Coolify-CD/           # Coolify 部署規範(企業限定)
    ├── 90-third-party-service/  # 三方服務串接(SMTP / SSO / payment 等)
    └── 99-code-review/          # Code Review 規範(收口檢測)
```

## 採用方專案落地結構

```
<project>/
├── AGENTS.md / CLAUDE.md        # 從 Template 複製
├── docs/
│   ├── Design-Base/             # 從 Template/docs/Design-Base/* 全複製
│   ├── Prompts/                 # 從 Template/prompts/* 全複製(跨 agent 都讀得到)
│   └── Tasks/
│       ├── v1.0/
│       │   ├── propose-v1.0.md  # User 寫:版本目標
│       │   ├── tasks-v1.0.md    # Agent 拆:執行單元清單
│       │   ├── tasks/           # 細分子任務(可選,multi-agent 用)
│       │   │   └── task-NNN-<slug>.md
│       │   └── fixed.md
│       ├── reflect/             # /reflect-rules 報告
│       └── scan-project/        # /scan-project 報告
└── .claude/commands/            # Claude-only 入口(每檔一行 import)
```

---

## Just-in-time Loading 對照表(關鍵設計)

> 寫進 `Template/AGENTS.md`,讓 agent 依子任務情境精準載入,不讀無關規則。

### 永遠載入(任何任務)

- `AGENTS.md`(本檔)
- `00-overview/00-overview.md`(規範優先序 + 輸出語言)

### 依子任務載入(範例)

| 子任務 | 永遠載入 + 必讀 |
| --- | --- |
| **寫前端 UI/UX 純樣式 / 元件** | `02-frontend/00-overview.md`(風格地板:TS / 渲染 / i18n / ID 隱藏 / 字級 / 命名) |
| 寫前端 data fetching | + `02-frontend/02-api-and-state.md` |
| 寫前端登入 / 認證 | + `02-frontend/03-env-and-auth.md` |
| 寫前端日期顯示 | + `02-frontend/04-datetime.md` |
| 寫前端 Dialog / 共用 Hook | + `02-frontend/05-components.md` |
| **寫後端新 API endpoint** | `03-backend/00-overview.md` + `03-backend/01-routing.md` |
| 寫保護 endpoint | + `03-backend/02-auth.md` |
| 寫 service 跨表 / hash | + `03-backend/03-async-and-tx.md` |
| 改後端啟動 / config | + `03-backend/04-config.md` + `00-overview/02-secrets.md` |
| 加 log / 處理錯誤 | + `03-backend/05-exceptions-and-logging.md` |
| 串第三方 | + `03-backend/06-clients.md` + `90-third-party-service/01-client-design.md` |
| 寫後端測試 | + `03-backend/07-testing.md` |
| 後端效能 / N+1 | + `03-backend/08-performance.md` |
| **設計新 DB 表** | `04-databases/00-overview.md` + `04-databases/01-identifiers.md` |
| 寫 Repository | + `04-databases/02-soft-delete.md` |
| 處理使用者資料 / PII | + `04-databases/03-passwords-and-pii.md` |
| 金額欄位 | + `04-databases/05-precision.md` |
| 時間欄位 | + `04-databases/06-timezone.md` + `00-overview/05-timezone.md` |
| 寫 migration | + `04-databases/08-alembic.md` |
| 優化 query | + `04-databases/09-indexes-and-perf.md` |
| **加套件** | `00-overview/01-versions.md` |
| 改 env / secret | `00-overview/02-secrets.md` + `00-overview/03-env-layers.md` |
| 改 CI workflow | `05-CI/00-overview.md` + 對應 job 檔 |
| 寫 / 改 Dockerfile / compose | `06-Coolify-CD/01-compose.md` + `02-dockerfile-*.md` |
| 串 SMTP / SSO / payment | `90-third-party-service/00-overview.md` + `01-client-design.md` + 對應服務檔 |
| 發 PR / 收口 | `99-code-review/03-pr-self-check.md` + 對應 checklist |
| 寫 fixed.md / commit | `99-code-review/01-fixed-md.md` + `02-commit-message.md` |

### 禁預載

- `docs/Tasks/scan-project/*`(歷史 scan 報告)
- 舊版 `fixed.md`(只讀當版本)
- `reflect-report-*.md`(只在 `/reflect-rules` 任務讀)

---

## 流程設計

> 各 area 拆檔遵循「正交」原則:每檔對應獨立子任務情境。`00-overview.md` 收納「該 area 任何任務都要遵守的風格地板」。

### 步 1 — 框架層 `AGENTS.md` / `CLAUDE.md` / `prompts/`

- `Template/AGENTS.md` — 跨工具事實層,六區塊 + Capabilities Baseline + **Just-in-time Loading 對照表(完整版)** + Rule Precedence
- `Template/CLAUDE.md` — Claude 特化薄層 ~35 行,import `@AGENTS.md`,內含 Plan mode / Skill / Sub-agent / TodoWrite / Verify loop
- `Template/prompts/` — README + init-project + propose-to-tasks + scan-project + reflect-rules

### 步 2 — 跨領域共通底線 `00-overview/`(全域議題,正交拆)

- `00-overview.md` — 入口 + 規範優先序 + Sources of Truth + **輸出語言 / 註解規則 / commit 語言**(永遠讀)
- `01-versions.md` — 版本鎖到 patch(加套件 / 升版時讀)
- `02-secrets.md` — 機密 env 注入 + `.gitignore` + fail-fast(處理 env / auth / log 時讀)
- `03-env-layers.md` — localhost vs 部署 / `.env.{dev,staging,prod}.example`(deploy / 配置時讀)
- `04-api-docs.md` — `docs_url=/api/docs` / 禁 `/swagger`(寫 FastAPI 入口時讀)
- `05-timezone.md` — UTC+8 全棧一致 / 禁 `TZ=` 雙轉換(任何時間相關任務讀)

### 步 3 — Propose / Tasks / Multi-agent 規範 `01-propose/`

- `00-overview.md` — propose / tasks / fixed / changelog 關係圖 + multi-agent flow
- `01-propose-format.md` — User 寫 `propose-v*.md` 格式(版本目標 / scope / 對外承諾 / 風險)
- `02-task-decomposition.md` — Agent 拆 tasks 方法論(粒度 1–4 hr / 依賴標註 / 並行性)
- `03-multi-agent-flow.md` — Orchestrator-Workers 協議 + 衝突解決(同檔互鎖)+ 進度同步
- `04-fixed-format.md` — `fixed.md` 條目格式(問題 / **根因** / 修正 / 影響)
- `05-version-bump.md` — major / minor / patch 判準
- `06-changelog.md` — 對外 user-facing CHANGELOG 格式
- `07-rule-evolution.md` — `fixed.md` → reflect → docs/Design-Base 升級閉環

### 步 4 — 前端規範 `02-frontend/`(現 13 條 → 6 檔正交拆)

- `00-overview.md` — 鎖定棧 + **風格地板**(永遠讀):TS strict / 禁 `any` / props `interface` / `useCallback` / `useMemo` / `React.memo` / 禁 render 內字面值 / i18n key / ID 隱藏 / 字級下限 / 命名
- `01-routing-and-error.md` — 路由錯誤邊界(`error.tsx` / `errorElement` / `global-error`)— 寫 app 結構 / 頁面才讀
- `02-api-and-state.md` — API 呼叫集中(`lib/api/*` / RTK Query)+ Redux slice / RTK Query / `useState` 三層 — data fetching / 狀態管理才讀
- `03-env-and-auth.md` — env 前綴(`VITE_*` / `NEXT_PUBLIC_*`)+ httpOnly cookie / `useAuth` / SSO state CSRF — client config / 登入才讀
- `04-datetime.md` — `utils/datetime.ts` 統一入口 — 寫日期顯示才讀
- `05-components.md` — 共用 Hook / Component / 禁 `alert` / `confirm` / `prompt` — 寫 Dialog 或共用元件才讀

### 步 5 — 後端規範 `03-backend/`(現 15 條 + perf → 9 檔正交拆)

- `00-overview.md` — 鎖定棧 + **風格地板**(永遠讀):分層(api → services → repos → models / clients)/ 命名 snake_case / kebab-case API / PascalCase schema / PEP 484/585 / 禁 `Any` / `list[...]` 不用 `typing.List` / 註解 why-only
- `01-routing.md` — `/api/v1` + kebab-case 複數 + UID 路徑 + ApiResponse 外殼 + Pydantic schema(禁 `dict`)— 寫新 endpoint 才讀
- `02-auth.md` — JWT cookie + `Depends(require_*)` + CORS — 寫保護 endpoint / 登入 / CORS 才讀
- `03-async-and-tx.md` — async safety(`asyncio.to_thread`)+ 多表 transaction(`async with db.begin():`)— 寫 service 跨表 / hash / 阻塞操作才讀
- `04-config.md` — `Settings` + fail-fast 驗證 + `lifespan` 取代 `on_event` — 改 config / 啟動 flow 才讀
- `05-exceptions-and-logging.md` — 3 個 handler + `logger.exception` 結構化 + 機密過濾 — 處理錯誤 / 加 log 才讀
- `06-clients.md` — `app/clients/*` 集中 + httpx + 錯誤轉 `AppError` — 串第三方才讀(細節在 `90-third-party-service/`)
- `07-testing.md` — 真 DB 整合 + `respx` + 測試結構對映 `app/` — 寫測試才讀
- `08-performance.md` — N+1 / async 阻塞 / event loop 飢餓 / 大 JSON parse — 效能優化才讀

### 步 6 — 資料庫規範 `04-databases/`(現 11 條 + query-opt → 10 檔正交拆)

- `00-overview.md` — 鎖定棧 + **風格地板**(永遠讀):`BaseModel` 7 必備欄位 / `mapped_column` 風格 / 命名 `idx_*` / `uq_*` / `fk_*` / 禁物理刪除
- `01-identifiers.md` — `pid` 內部 / `uid` 對外 / 外部系統 ID 獨立欄位 — 設計新表才讀
- `02-soft-delete.md` — `is_deleted` + Repository 命名強制(`_including_deleted`)— 寫 Repository 才讀
- `03-passwords-and-pii.md` — bcrypt + asyncio.to_thread + PII 隔離 — 處理使用者資料才讀
- `04-sql-safety.md` — 禁字串拼接 / `text(...).bindparams(...)` — 寫 raw SQL 才讀
- `05-precision.md` — 金額 `Numeric(18, 2)` / 整數分 — 寫金額 / 計費欄位才讀
- `06-timezone.md` — TIMESTAMP 與顯示層全棧一致 — 寫時間欄位才讀
- `07-connection.md` — `async_sessionmaker` + 連線池 + `engine.dispose()` — 改連線設定才讀
- `08-alembic.md` — 命名 / 不改既有 / 一個 migration 一件事 / round-trip — 寫 migration 才讀
- `09-indexes-and-perf.md` — 外鍵 / 高頻欄位 / partial index / `EXPLAIN ANALYZE` / `selectinload` vs `joinedload` — 優化 query 才讀

### 步 7 — CI 規範 `05-CI/`(細粒,各 job / audit 獨立)

- `00-overview.md` — workflow 結構 + 觸發策略(push / PR)
- `01-frontend-jobs.md` — `npm ci` / `lint` / `typecheck` / `test` / `build`
- `02-backend-jobs.md` — `uv sync --frozen` / `ruff` / `mypy` / `pytest` / `alembic upgrade head`(測試 DB)
- `03-dependency-audit.md` — `npm audit` / `pip-audit` 容忍度 + `continue-on-error: true → false` 時程
- `04-secret-scan.md` — gitleaks / trufflehog
- `05-security-scan.md` — SAST(semgrep)+ container scan(trivy)
- `06-e2e.md` — Playwright(預設 `if: false`)
- `07-branch-protection.md` — `main` 必經 PR / required reviewers / 禁 force push
- `08-secrets-and-oidc.md` — GitHub Secrets / OIDC / 禁明文 token

### 步 8 — Coolify 部署規範 `06-Coolify-CD/`(企業限定)

- `00-overview.md` — Coolify 介紹 + 部署模型(Git push → Coolify 自動 build & deploy)
- `01-compose.md` — `docker-compose.yml` 模板 + `healthcheck:` 指向 `/api/v1/health`
- `02-dockerfile-backend.md` — multi-stage / `uv` 安裝 / 非 root
- `03-dockerfile-frontend.md` — Vite:nginx / Next:standalone output
- `04-env-and-secrets.md` — Coolify env 注入 + Coolify Secrets vs 環境變數 + rotation
- `05-deploy-flow.md` — Git push `main` → Coolify webhook → build → deploy + staging vs prod 分支策略
- `06-rollback.md` — Coolify 內建 rollback / 緊急 `git revert` + push
- `07-observability.md` — Coolify log / metrics / Sentry 整合
- `08-domains-and-tls.md` — Coolify 自動 TLS / domain mapping / preview env

### 步 9 — 三方服務串接 `90-third-party-service/`(各服務獨立檔)

- `00-overview.md` — 治理(永遠讀):命名 / 集中位置(`app/clients/<service>/`)/ 錯誤轉換契約
- `01-client-design.md` — clients/ 結構 + httpx.AsyncClient(於 lifespan)+ error mapping + timeout / retry / circuit breaker — 任何串接都讀
- `02-rate-and-cost.md` — rate limit(client 端 throttle)+ API cost log + 預警閾值
- `03-smtp.md` — SMTP / 信件 client 範本(transactional vs marketing 區隔)
- `04-sso-azure-ad.md` — Azure AD SSO 範本(MSAL / state CSRF / claims mapping)
- `05-payment.md` — 金流 client 範本(Stripe / 綠界,含 webhook 簽章驗證)
- `06-monitoring.md` — Sentry / Datadog / Loki client
- `07-lint-bot.md` — Lint Bot / reviewdog / codecov

### 步 10 — Code Review 收口 `99-code-review/`

- `00-overview.md` — Code Review 收口位置 + acceptance gate(永遠讀)
- `01-fixed-md.md` — `fixed.md` 規範(寫入時機 / 條目格式 / 雙向引用 / 跨版本既存)— 寫 fixed 才讀
- `02-commit-message.md` — `(AI?) <類型>: <描述>` 格式 + 禁 `--force` / `--no-verify`
- `03-pr-self-check.md` — PR self-check 列表(共同 / 後端 / 前端 / DB / 部署)— 發 PR 前讀
- `04-lint-checklist.md` — Lint 通過判準(各 area lint 工具 + 容忍度)
- `05-performance-checklist.md` — N+1 / re-render / 大 JSON parse / DB query plan 抽查
- `06-security-checklist.md` — OWASP Top 10 + 機密外洩偵測 + dependency CVE
- `07-review-process.md` — 流程:誰 review、何時 merge、衝突仲裁

---

## 跨 IDE 通用機制

### 嚴格分工

| 檔 | 角色 | 對什麼工具 |
| --- | --- | --- |
| `AGENTS.md` | 跨工具事實層 single source(含 Just-in-time Loading 對照表)| Claude / Codex / Cursor / Cline / Aider |
| `CLAUDE.md` | Claude 特化薄層(import `@AGENTS.md`,**不重述**)| Claude Code only |
| `prompts/*.md` | 跨工具 skill,frontmatter 標 trigger / inputs / acceptance | 各工具在自己入口指向 |

### 入口路徑對照

| 工具 | 入口 | 載入方式 |
| --- | --- | --- |
| Claude Code | `.claude/commands/<name>.md` | 內含 `@docs/Prompts/<name>.md`(import) |
| Codex CLI | session 開頭附上 `docs/Prompts/<name>.md` | 直讀 |
| Cursor | `.cursor/rules/` 引用 + chat 拖檔 | 規則 / 引用 |
| Cline | `.clinerules/` 引用 | 規則 |
| Aider | `--read docs/Prompts/<name>.md` | CLI 參數 |

**改規則只改一處** — `Template/docs/Design-Base/*` 與 `Template/prompts/*`。各工具入口都是 import / 直讀,不複製內容。

### Agent Capabilities Baseline

`AGENTS.md` 內聲明:本規範以「能讀檔 / 能寫檔 / 能執行 shell」為地板。若工具更強(plan mode / sub-agent / hook / skill),只可**加強**遵守程度,不可**降低**。

---

## Multi-agent 執行協議

### Orchestrator-Workers Pattern

```
User → 寫 propose-v{X.Y}.md(版本目標)
   ↓
Orchestrator Agent(/propose-to-tasks)
   - 讀 propose-v{X.Y}.md
   - 拆解成可並行 tasks(每 task 1–4 hr)
   - 標明依賴 / 衝突檔案 / Acceptance
   - 寫 tasks-v{X.Y}.md(總清單)+ tasks/<task-N>.md(細節)
   ↓
Worker Agents(可多個並行)
   - 各自認領 task / 從未鎖定 task pool 拉取
   - 依 Just-in-time Loading 對照表載入該 task 必要檔
   - 執行 → 寫程式 → 跑 Acceptance
   - 完成標記 tasks-v{X.Y}.md checkbox
   - 違反 / bug → 寫 fixed.md
   ↓
Orchestrator Agent(收口)
   - 等所有 task 完成
   - 跑 /scan-project 全域檢測(對齊 99-code-review/00-overview.md acceptance gate)
   - 觸發 /reflect-rules(自適應學習)
```

### 衝突解決(同檔互鎖)

- Task 級鎖:`tasks/<task-N>.md` 開頭聲明 `affected_files: [list]`
- Orchestrator 拆 task 時**避免**多 task 同檔(必要時序列化依賴)
- Worker 認領前檢查 `affected_files`,衝突則等待

### 進度同步

- 單一真相:`tasks-v{X.Y}.md` 頂部狀態(`進行中(已完成 N/M)`)
- 細節:每 task 檔頭 `status: pending | in_progress | done | blocked`
- 完成時 commit 標記 `(AI) <類型>: <描述> [task-NNN]`

---

## 自適應學習機制

### 三段式回流

```
A. 觀察期(每次 commit)
   - 規範違反 / bug → 寫 fixed.md(根因 / 修正 / 影響)
   - 規範被推翻 → tasks-v*.md checkbox 補「— 已改為 xxx,見 fixed.md §N」
   ↓
B. 反思期(月度 / 每版本結束時觸發 /reflect-rules)
   - 讀 docs/Tasks/v*/fixed.md 全部條目
   - 找 pattern:同規則 ≥ 3 次違反 / 同類根因重複 / 規範矛盾
   - 產出 reflect-report-{YYMMDDHHMMSS}.md(放 docs/Tasks/reflect/)
   ↓
C. 升級期(user 批准後)
   - 改 docs/Design-Base/* 對應檔 — 注意正交粒度,新規則對應「獨立子任務情境」才獨立檔
   - docs/Design-Base 變更 commit(類型 Modify)+ 該檔頭加變更紀錄
   - 棄用規則 → 該檔加 `> 狀態:已棄用,見 fixed.md vX.Y §N`
```

### 觸發條件

- **月度自動提醒** — 每月 1 號(預設)
- **版本結束時必觸發** — 該版本 PR merge 前
- **同類條目觸發** — `fixed.md` 同類 ≥ 3 個跨 ≥ 2 版本 → 候選升級為硬規則

### 規範升級條件

- 變更必經 PR + ≥ 1 reviewer 同意
- 變更後該規則檔頭加變更紀錄
- **不破壞 backward-compat** — 新規則只規範該 commit 之後的 code
- **新增規則優先合進既有檔** — 除非構成獨立子任務情境(對齊正交拆分原則)

---

## 規範優先序

```
docs/Design-Base/* > docs/Arch/* > AGENTS.md / CLAUDE.md > docs/Tasks/*
```

衝突依此優先序機械式判定。`AGENTS.md` 與 `CLAUDE.md` 同層,內容須一致;`CLAUDE.md` 僅補充 Claude 特性,不重述。

---

## 執行 Phase

### Phase 1 — 結構建立(優先,動到框架)

- 重寫 `Template/AGENTS.md` 為事實層 + **完整 Just-in-time Loading 對照表**(Phase 1 最重要產出)
- 重寫 `Template/CLAUDE.md` 為 Claude 特化薄層
- 建 `Template/prompts/` 五檔(README + init-project + propose-to-tasks + scan-project + reflect-rules)
- 建 `Template/docs/Design-Base/` 9 個資料夾骨架,每個資料夾先填 `00-overview.md`(入口 + 該 area 風格地板)
- 更新 `Template/README.md`

### Phase 2 — 內容填入(主體工作)

- 拆檔 `02-frontend/`(6 檔)/ `03-backend/`(9 檔)/ `04-databases/`(10 檔)— 從現 `10-/20-/30-` 三檔提取,合併「永遠一起讀」、拆出獨立子任務情境
- 補 `00-overview/`(6 檔)/ `01-propose/`(8 檔)/ `99-code-review/`(8 檔)
- 新增 `05-CI/`(9 檔)/ `06-Coolify-CD/`(9 檔)/ `90-third-party-service/`(8 檔)— 從零寫
- **每補一檔必對應更新 `AGENTS.md § Just-in-time Loading 對照表`**

### Phase 3 — Multi-agent + 自適應機制(閉環)

- 完成 `prompts/propose-to-tasks.md`(orchestrator + 拆解原則 + 衝突偵測)
- 完成 `prompts/reflect-rules.md`(回流邏輯 + pattern detection)
- 完成 `01-propose/03-multi-agent-flow.md` 與 `01-propose/07-rule-evolution.md`
- 跑首次 `/reflect-rules` 從現有經驗找 candidate rule
- 確立月度 / 版本結束觸發機制(寫進 `01-propose/00-overview.md`)

---

## 待補充項目(分散落地)

| 議題 | 落地位置 |
| --- | --- |
| **Lint** | `02-frontend/00-overview.md`(風格地板含)/ `03-backend/00-overview.md`(風格地板含)/ `05-CI/01-frontend-jobs.md` + `02-backend-jobs.md` / `99-code-review/04-lint-checklist.md` |
| **效能查詢(N+1 / re-render)** | `02-frontend/00-overview.md`(渲染效能)/ `03-backend/08-performance.md` / `04-databases/09-indexes-and-perf.md` / `99-code-review/05-performance-checklist.md` |
| **安全性漏洞檢測** | `00-overview/02-secrets.md` / `05-CI/04-secret-scan.md` + `05-security-scan.md` / `99-code-review/06-security-checklist.md`(OWASP Top 10) |

每議題在對應 area 寫硬規則,在 `99-code-review/` 寫**檢測 checklist**(收口)。

---

## 升級協議(Template 自身演進)

- Template 版本演進以 git tag 標記(`template-v1.0` / `template-v1.1`)
- 採用方專案以 fork + cherry-pick 升級;**禁**直接覆寫已客製內容
- 各專案可在自己的 `docs/Design-Base/` 加更嚴格條款,但**不可**降低本模板的規則
- 本檔每次重大改動,需更新 `report.md` 對應段落

---

## 參考

- Anthropic Engineering:[Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) / [Writing Effective Tools](https://www.anthropic.com/engineering/writing-tools-for-agents) / [Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) / [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) / [Best Practices for Claude Code](https://code.claude.com/docs/en/best-practices) / [Harness Design for Long-Running Apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- [agents.md spec](https://agents.md) / [How to Write a Great agents.md (GitHub Blog)](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)
- [Coolify Documentation](https://coolify.io/docs)
- 詳細 audit、取捨表、待決策事項見 [report.md](./report.md)
