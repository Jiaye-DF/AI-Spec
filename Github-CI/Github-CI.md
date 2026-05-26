# Auto-CI-CD — GitHub 工作流設計

> Auto-CI-CD 在 GitHub 端的實作,包裝給公司各專案使用。
> 流程規格見 [workflow-v1.0.md](../Architecture/Auto-CI-CD/workflow-v1.0/workflow-v1.0.md)(本實作對齊 v1.0;v1.1 為 Agent Platform → CI/CD 管理平台的純改名,實作尚未跟上),全貌圖見 [workflow-v1.0.html](../Architecture/Auto-CI-CD/workflow-v1.0/workflow-v1.0.html)。

---

## 兩端架構

GitHub Actions 的 **reusable workflow** 機制 —— 把 CI/CD 邏輯集中在一個私有的中央 repo,各專案只放一支薄殼 caller 去呼叫它。

- **中央端(`ci-workflows`)** — 真正的 CI/CD 邏輯。私有 repo,User 看不到內容。
- **User 端** — 每個專案 `.github/workflows/` 放一支 caller,`uses:` 連到中央。caller 不含邏輯。

好處:邏輯一處維護、全公司一致;User 不需也無從得知中央內部;改規則只動中央。

---

## 資料夾

```
Github-CI/
├── ci-workflows/        中央 repo:reusable workflow(實作)
│   ├── ci-frontend-node.yml     ┐
│   ├── ci-backend-python.yml    │ 分棧 CI 積木(步驟③)
│   ├── ci-backend-node.yml      │
│   ├── ci-backend-java.yml      ┘
│   ├── auto-cicd.yml            後續流程(步驟④~⑦,跨棧通用)
│   └── e2e.yml                  Playwright E2E
│
└── user-template/       給 User 的 skill:掃技術棧 → 產 caller
    ├── SKILL.md
    ├── ci-cd.yml                caller 模板
    └── e2e.yml                  caller 模板
```

> 本資料夾為求簡潔不嵌套 `.github/workflows/`;實際部署時,中央檔案放進 `ci-workflows` repo 的 `.github/workflows/`,User 端 caller 放進專案的 `.github/workflows/`。故 `uses:` 路徑含 `.github/workflows/`(GitHub 硬性要求)。

---

## 中央:ci-workflows

CI 綁技術棧、後續流程不綁 —— 沿這條線拆。

| 檔案 | 角色 | 內容 |
| --- | --- | --- |
| `ci-frontend-node.yml` | 分棧 CI | npm 前端(React / Vue):lint / typecheck / test / build / audit |
| `ci-backend-python.yml` | 分棧 CI | Python(FastAPI 等):ruff / mypy / pytest / alembic / pip-audit |
| `ci-backend-node.yml` | 分棧 CI | Node.js 後端:lint / typecheck / test / audit |
| `ci-backend-java.yml` | 分棧 CI | Java:`mvn -B verify`(Gradle 可換指令) |
| `auto-cicd.yml` | 後續流程 | 機密掃描 → 安全掃描 → CI 彙整 → AI 審查 → 四態判決自動合併 → CD 觸發 |
| `e2e.yml` | E2E | Playwright;預設由 caller 端 `if: false` 停用 |

`auto-cicd.yml` 跟技術棧無關 —— 它不 import 任何 CI 檔,而是收 caller 傳進來的前後端 CI 結果(`inputs.frontend_result` / `backend_result`)再走後續。新增一種棧只要加一支 `ci-*` 積木,不動 `auto-cicd.yml`。

對齊 [workflow-v1.0.md](../Architecture/Auto-CI-CD/workflow-v1.0/workflow-v1.0.md) §一:步驟③ = 分棧 CI 積木;步驟④~⑦ = `auto-cicd.yml`。

---

## User 端:user-template skill

User 專案不手抄 caller —— 跑 `user-template` skill,讓 AI 掃 `package.json` / `pyproject.toml` / `pom.xml` 自動判斷技術棧,產出對的 caller。

skill 做兩件事:

1. **掃描**前端(React / Vue / 無)與後端(Python / Node / Java)技術棧。
2. 依 `ci-cd.yml` / `e2e.yml` 模板**客製** → 寫進專案 `.github/workflows/`。

細節見 [user-template/SKILL.md](./user-template/SKILL.md)。

> **Jinja2 等 server-rendered**:HTML 模板在後端目錄裡,不是獨立可建置前端 → 視為「無獨立前端」,只接後端 CI,模板品質由後端測試涵蓋。

---

## 對應關係

caller 裡每個 job 的 `uses:` 各指向 `ci-workflows` 的一支檔:

```
 caller job              uses: ───→        ci-workflows
──────────────────────────────────────────────────────────
 frontend-ci   ──────────────────→  ci-frontend-node.yml
 backend-ci    ──┬───────────────→  ci-backend-python.yml ┐
                 ├───────────────→  ci-backend-node.yml   │ 依後端棧三選一
                 └───────────────→  ci-backend-java.yml   ┘
 auto-cicd     ──────────────────→  auto-cicd.yml          （固定)
 e2e           ──────────────────→  e2e.yml                （有前端才產)
```

`SKILL.md` 的偵測表每一列 = `ci-workflows` 的一支檔。**兩邊同步演進**:中央新增一支(例 `ci-backend-go.yml`),`SKILL.md` 偵測表就要補一列。

---

## 部署與設定

### 中央團隊(一次性)

1. 建私有 repo `ci-workflows`,把 6 支檔放進其 `.github/workflows/`。
2. Settings → Actions → General → Access:開放給組織內其他 repo 呼叫。
3. 在**組織層級**設好下列 secrets / variables(各專案自動繼承,無須逐一設):

| 類型 | 項目 |
| --- | --- |
| Variables | `AGENT_PLATFORM_URL`、`NOTIFIER_URL`、`AUDIT_URL`、`AUTO_MERGE_ENABLED` |
| Secrets | `GITLEAKS_LICENSE`、`AGENT_PLATFORM_KEY`、`AUDIT_KEY`、`AUTO_MERGE_TOKEN` |

> `COOLIFY_DEPLOY_WEBHOOK` / `COOLIFY_TOKEN` 每個專案的 Coolify app 不同,走 repo-level secret。`AUTO_MERGE_ENABLED`(熔斷開關)建議 repo-level,單一專案熔斷不影響其他。

### User 專案(每個專案)

1. 把 `user-template/` 複製進專案的 `.claude/skills/`。
2. 在專案根目錄跑該 skill → 產出 `.github/workflows/ci-cd.yml`(+ 有前端則 `e2e.yml`)。
3. 設 `main` 分支保護的 required status checks,見 Harness [07-branch-protection](../Development/Harness-Engineering/docs/Design-Base/05-CI/07-branch-protection.md)。

---

## 對齊基準

- **流程** — [Architecture/Auto-CI-CD/workflow-v1.0/workflow-v1.0.md](../Architecture/Auto-CI-CD/workflow-v1.0/workflow-v1.0.md) §一 步驟 ②~⑦、§二 保護路徑、§四.5 熔斷、§五 Audit。
- **CI 規範** — Harness [05-CI](../Development/Harness-Engineering/docs/Design-Base/05-CI/00-overview.md):job 命名 `frontend-test` / `backend-test`、觸發策略、版本鎖定(`postgres:17.2` / `uv 0.5.18`)。
- **container scan(trivy)** 不在此 —— 本流程不 build image(image 由 Coolify 部署時建置),container scan 歸 06-Coolify-CD。
