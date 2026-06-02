# AI-Spec

公司專案在「**開發 / CI/CD / Coolify 部署**」三階段的共用規範,給 AI Agent 與開發者照著做。

新專案依此建骨架;既有專案跑 `/scan-project` 健檢。

---

## 適用範圍

- **適用** — 對外服務、多人協作、中長期維護。嚴格規則讓 AI 產出穩定、review 與 debug 有依據。
- **不適用** — POC、spike、一次性個人工具。改用 [`replit/`](replit/replit-spec-latest.md) 或不套規範。

---

## 目錄結構

```
AI-Spec/
├── Architecture/Auto-CI-CD/          # 流程規格 + 全貌圖(分版本資料夾,各含 workflow-vX.Y.md / .html)
├── Coolify-Deploy/                   # Docker Compose 規範(最新 v1.4)
├── Development/
│   ├── spec/                         # 00-overview / 01-design-notes / scan-project
│   └── Harness-Engineering/          # React + FastAPI 嚴格規範整合包
│       ├── AGENTS.md / CLAUDE.md     # 跨工具事實層 / Claude 特化薄層
│       ├── Skills/                   # commit-all、merge-main、init-project、sso-init…
│       ├── prompts/                  # scan-project / propose-to-tasks / reflect-rules
│       └── docs/                     # Design-Base / Arch / Tasks
├── Github-CI/                        # Auto-CI-CD 的 GitHub 實作(ci-workflows + setup-cicd)
└── replit/                           # Replit 手機優先 RWD 規格
```

---

## 文件用途速查

| 想做的事 | 文件 |
| --- | --- |
| 新專案建骨架 / 路由規劃 | [spec/00-overview-v1.0.md](Development/spec/00-overview-v1.0.md) |
| 前後端 / DB / 部署設計筆記 | [spec/01-design-notes-v1.0.md](Development/spec/01-design-notes-v1.0.md) |
| 套 React + FastAPI 嚴格規範 | [Harness-Engineering/README.md](Development/Harness-Engineering/README.md) |
| 接 DF-SSO | `Harness-Engineering/Skills/sso-init/` 對應框架 |
| Replit 個人工具 | [replit/replit-spec-latest.md](replit/replit-spec-latest.md) |
| 接 Auto-CI-CD(產 GitHub Actions caller) | [Github-CI/Github-CI.md](Github-CI/Github-CI.md) → 跑 `setup-cicd` |
| 看 Auto-CI-CD 全貌(掃機密→AI 審→自動合併→CD) | **最新 v1.1**:[workflow-v1.1.md](Architecture/Auto-CI-CD/workflow-v1.1/workflow-v1.1.md) / [workflow-v1.1.html](Architecture/Auto-CI-CD/workflow-v1.1/workflow-v1.1.html) ・舊版 v1.0:[workflow-v1.0.md](Architecture/Auto-CI-CD/workflow-v1.0/workflow-v1.0.md) / [workflow-v1.0.html](Architecture/Auto-CI-CD/workflow-v1.0/workflow-v1.0.html) |
| 寫 Coolify docker-compose | [Docker-Compose-Spec-v1.4.md](Coolify-Deploy/Docker-Compose-Spec-v1.4.md) |
| 掃架構 / 資安 / 部署違規 | [spec/scan-project-v1.0.md](Development/spec/scan-project-v1.0.md) |

---

## 五大核心原則

完整定義見 [spec/00-overview-v1.0.md](Development/spec/00-overview-v1.0.md):

1. **首頁是登入頁** — `/` 未登入顯示登入;已登入 302 `/dashboard`。
2. **未驗證 302 `/?redirect=<原路徑>`** — 頁面與 API 一致。
3. **API `/api/v{n}` + auth middleware** — 未登入 401、無權限 403。
4. **Response 外殼** `{ code, responseCode, message, data }`。
5. **環境變數三階段** — `.env.example`(commit)/ `.env`(gitignore)/ Coolify 後台;`VITE_*` / `NEXT_PUBLIC_*` 走 build args。

---

## 自訂 Slash 指令

| 指令 | 說明 |
| --- | --- |
| `/commit-all` | 提交並推送當前分支變更(AI commit 自動加 `(AI)` 前綴) |
| `/merge-main` | 合併當前分支至 `main` |
| `/scan-project` | 健檢專案,結果寫入 `docs/Issues-Scan-Project.md` |
| `setup-cicd` | 掃技術棧產出 Auto-CI-CD caller |

---

## 新專案啟動流程

1. 讀 [00-overview](Development/spec/00-overview-v1.0.md) + [01-design-notes](Development/spec/01-design-notes-v1.0.md) 建骨架。
2. `/sso-init` 接 SSO(依框架分流)。
3. 複製 [Github-CI/setup-cicd/](Github-CI/setup-cicd/) 進 `.claude/skills/`,產 `.github/workflows/`。
4. 寫 `docker-compose.yml` 對照 [v1.4 規範](Coolify-Deploy/Docker-Compose-Spec-v1.4.md)。
5. 上線前 `/scan-project`。

既有專案直接跑 `/scan-project`,違規清單累積寫入 `docs/Issues-Scan-Project.md`。

---

## Git 規範

- 主分支 `main`,新功能切 feature branch。
- Commit:繁中、`<類型>: <描述>`(`Add` / `Modify` / `Fix` / `Refactor` / `Docs`)。
- AI commit 加 `(AI)` 前綴。
- 禁止 `--force` / `reset --hard` / `--no-verify`。

### 常用指令速查

> 日常提交 / 合併優先用 Slash 指令(`/commit-all`、`/merge-main`),下表為底層對照與發版用。

```bash
# ── 日常 ──
git status                          # 看變更
git switch -c feature/<名稱>        # 切新分支
git add -A && git commit -m "(AI) Fix: <描述>"
git push origin <分支>              # 首推加 -u 設定 upstream

# ── 合併回 main(等同 /merge-main)──
git switch main && git pull --ff-only
git merge --no-ff feature/<名稱>
git push origin main

# ── 發版打 tag(中央 reusable workflow;一律 annotated)──
git tag -a v1.0.1 -m "patch: <一句話>"   # 打在含改動的 commit 上
git push origin v1.0.1                    # push 預設不帶 tag,要顯式推
git ls-remote --tags origin v1.0.1        # 確認遠端有了
gh release create v1.0.1 --notes "<changelog>"   # 建 Release(需 gh CLI)

# ── 查看 / 安全復原 ──
git log --oneline -10
git diff v1.0.0..HEAD -- .github/workflows/   # 比對兩版差異
git revert <commit>                 # 反向 commit(不改歷史,取代 reset --hard)
```

> 完整發版 SOP(PATCH / MINOR / MAJOR、退版、Tag 保護)見 [Github-CI/RELEASE.md](Github-CI/RELEASE.md)。

---

## 版本策略

- 規格檔 `-vX.Y.md` 命名,重大變更升版並保留舊版。
- 最新:`Coolify-Deploy` **v1.4**、其餘規格檔 **v1.0**。
- Auto-CI-CD 中央 reusable workflows 走 SemVer git tag,目前釋出 **v1.0.2**(caller 以 `@v1.0.2` 釘版;發版 SOP 見 [Github-CI/RELEASE.md](Github-CI/RELEASE.md))。
- 文件互引用相對路徑。
