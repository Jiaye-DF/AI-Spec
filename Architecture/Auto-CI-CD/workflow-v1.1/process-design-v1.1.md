# 目標

GitHub CI 流程的具體技術細節 — User 端 caller 怎麼接、中央 reusable repo 怎麼版控、CI 4 個 job 各跑什麼、migration 怎麼按棧偵測。

> 對應 [workflow-v1.1.md](workflow-v1.1.md) §一 步驟 ①~③(CI 本體)。④ 之後的 AI 審查 / 自動合併 / CD / Notifier / Audit 不在本檔範圍。

## 流程

1. 使用者推送 PR 到 `main`(或 push 到 `main`,merge 後再跑一次確認)
2. GitHub Actions 啟動
   1. **User 端** — 專案 `.github/workflows/ci-cd.yml`
      - 薄殼 caller,只寫 `uses:` 指向中央 reusable repo,**不含任何 build / test / 審查邏輯**
      - 由 [`user-template`](../../../Github-CI/user-template/) skill 掃技術棧後自動產出(`package.json` / `pyproject.toml` / `pom.xml` 偵測前後端棧 + migration 套件)
      - User 不可改 reusable 內容,只能改:接哪幾支 reusable、傳什麼 `with:` 參數、釘哪個 ref
   2. **中央端** — `Dafon-IT/DF-AI-Spec` repo 的 `.github/workflows/`(GitHub Actions 對 reusable workflow 的硬性路徑要求)
      - 6 支 reusable workflow:`ci-frontend-node` / `ci-backend-{python,node,java}` / `auto-cicd` / `e2e`
      - 設計來源 / 文件 / user-template skill 放在 `Github-CI/`(同 repo 不同資料夾)
      - 版本管理見 § 版本管理
3. 並行 CI 4 個 job

   | job | reusable | 跑什麼 |
   | --- | --- | --- |
   | `frontend-test` | `ci-frontend-node.yml` | Lint / typecheck / test / build → **內含 `npm audit --audit-level=high`**(step) |
   | `backend-test`(Python) | `ci-backend-python.yml` | ruff / mypy / pytest / **migration round-trip(依 `migration_tool` 分派)** + **`pip-audit`** |
   | `backend-test`(Node) | `ci-backend-node.yml` | Lint / typecheck / test / **migration round-trip** + **`npm audit`** |
   | `backend-test`(Java) | `ci-backend-java.yml` | `mvn -B verify` + **migration round-trip** + **OWASP `dependency-check-maven`**(CVSS ≥ 7 fail,過渡期 `continue-on-error: true`,報告 upload artifact) |
   | `secret-scan` | `auto-cicd.yml::secret-scan` | `gitleaks-action@v2` + `.gitleaks.toml`;需 `fetch-depth: 0` |
   | `security-scan` | `auto-cicd.yml::security-scan` | `semgrep-action@v1` + 多語 ruleset → SARIF 上傳 GitHub Code Scanning |

   > **套件漏洞稽核**是 `*-test` 內含 step(`npm audit --audit-level=high` / `pip-audit`,只擋高危),非獨立 job;audit 紅 = `*-test` 紅,branch protection require `*-test` 即可。

## Migration 偵測(per-stack 分派)

中央 `ci-backend-{python,node,java}.yml` 共用 input `migration_tool: string`。User caller 寫死值,或由 `user-template` skill 掃 manifest 自動填。

### 偵測表

| 後端棧 | `migration_tool` 值 | 偵測訊號(SKILL 自動填規則) | round-trip 指令 |
| --- | --- | --- | --- |
| Python | `alembic`(預設) | `backend/alembic.ini` + `backend/alembic/` | `alembic upgrade head` → `downgrade -1` → `upgrade head` |
| Python | `aerich`(Tortoise ORM) | `backend/pyproject.toml` 含 `tortoise-orm` + `backend/migrations/` | `aerich upgrade` → `downgrade` → `upgrade` |
| Python | `django` | `backend/manage.py` 存在 | `manage.py migrate --noinput`(僅 forward) |
| Python | `none` | 都偵測不到 | 跳過 |
| Node | `prisma` | `backend/prisma/schema.prisma` + `backend/prisma/migrations/` | `prisma migrate deploy` → `prisma migrate reset --force --skip-seed` → `prisma migrate deploy`(Prisma 無 down,用 reset) |
| Node | `typeorm` | `backend/package.json` deps 含 `typeorm` + `backend/src/migration/`(或 `migrations/`) | `typeorm migration:run` → `migration:revert` → `migration:run` |
| Node | `knex` | `backend/knexfile.{js,ts}` 存在 | `knex migrate:latest` → `migrate:rollback` → `migrate:latest` |
| Node | `none`(預設) | 都偵測不到 | 跳過 |
| Java | `flyway` | `pom.xml` 含 `flyway-core` + `src/main/resources/db/migration/` | `mvn flyway:clean flyway:migrate`(社群版無 `undo`,用 `clean + migrate` 確認 idempotent) |
| Java | `liquibase` | `pom.xml` 含 `liquibase-core` + `src/main/resources/db/changelog/` | `mvn liquibase:update` → `liquibase:rollback -Dliquibase.rollbackCount=1` → `liquibase:update` |
| Java | `none`(預設) | 都偵測不到 / Hibernate `auto-ddl` | 跳過(Hibernate auto-ddl 不算正規 migration,不做 round-trip) |

### 各工具特殊行為(規格層級已知)

| 工具 | 限制 | 規格因應 |
| --- | --- | --- |
| **Flyway 社群版** | 無 `undo`(Teams 版才有) | 用 `clean + migrate` 替代,僅驗 forward + idempotent;真正驗 down 要靠專案自己整合 |
| **Prisma migrate** | 無 down command | 用 `migrate reset --force` 重置 DB → 重跑 `migrate deploy` 驗 forward |
| **Django migrate** | 不便對單一 app 自動 downgrade(需指定 app + revision) | 僅 forward,不做 round-trip |

### DB service(reusable 端)

`ci-backend-python.yml` 已內建 `postgres:17.2` service;Node / Java 自 v1.1 起一併內建(`migration_tool != none` 才實際用到,空跑 ~5s overhead 可接受)。`DATABASE_URL` 由 reusable env 注入:`postgresql://postgres:ci-only@localhost:5432/ci_test`。

## 版本管理(中央 reusable repo)

User caller 寫 `uses: Dafon-IT/DF-AI-Spec/.github/workflows/<file>.yml@<ref>` 鎖版本。**只用 fixed tag 或 SHA,不用 floating major tag**(`@v1`):floating tag 可被 force-push 重指,User 端無法看出實際跑了哪個 commit,且單一錯誤 patch 可能瞬間散播到全公司專案。

| 寫法 | 例 | 適用 |
| --- | --- | --- |
| **fixed SemVer tag(預設)** | `@v1.0.0` / `@v1.0.1` | 一般專案;搭配 [Dependabot](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates) 自動 PR 升版 |
| **40-char commit SHA** | `@abc1234567890abcdef…` | 受監管 / 對外正式服務 / 法遵敏感系統;最高安全層級 |

完整發版 SOP / 升降版策略見 [`Github-CI/RELEASE.md`](../../../Github-CI/RELEASE.md)。要點:

- **SemVer 規則** — PATCH(`v1.0.X`)= bugfix / 不動 inputs;MINOR(`v1.X.0`)= 加新 input / reusable;MAJOR(`vX.0.0`)= breaking change(改 input 名 / 改預設行為)
- **發版** — `git tag -a v1.0.1 -m "..."` + `git push origin v1.0.1`;**不**做 `git tag -f` 重指任何 floating tag
- **退版** — 無「中央一行指令全公司退版」捷徑,User 自行改 caller tag;急停請動 `AUTO_MERGE_ENABLED=false` 熔斷開關
- **Tag 保護** — 中央 repo 啟用 protected tags(`v*` 禁 force-push / 禁刪),即使中央團隊也無法事後改 tag

### User 端 Dependabot 設定(建議)

User 專案 `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
```

中央發新 PATCH / MINOR tag 後,Dependabot 自動開 PR 升 caller 的 `uses: ...@v1.0.X` → 過 CI + reviewer approve 即合併。
