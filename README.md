# AI-Spec

> AI 輔助開發的規格文件集 — 給 Claude Code 等 AI Agent 以及專案開發者共用的規範骨架。

本倉庫集中收錄公司專案在「**開發**」「**CI/CD**」與「**部署至 Coolify**」三個階段的通用規則。新專案啟動時依此建立骨架;既有專案可透過 `/scan-project` 針對這些規則進行健檢,輸出修正建議。

---

## 適用範圍

> **適用** — 對外正式服務 / 多人協作 / 中長期維護專案。  
> 規範偏嚴格(`Development/Harness-Engineering/docs/Design-Base/`),目的是讓 AI agent 產出穩定、code review 有依據、debug 有對照基準。重複性 CRUD + AI 為主力的場景反而提速(decision fatigue 下降)。

> **不適用** — POC / spike / 一次性個人工具。  
> 嚴格規則在「明天就要丟」的程式碼上是純拖慢;這類專案改用 [`replit/`](replit/replit-spec-latest.md) 或不套規範。

---

## 目錄結構

```
AI-Spec/
├── Architecture/
│   └── Auto-CI-CD/                  # Auto-CI-CD 流程規格 + 全貌圖
│       ├── workflow-v1.0.md
│       └── diagram.html
│
├── Coolify-Deploy/                  # Coolify + Docker Compose 部署規範
│   ├── Docker-Compose-Spec-v1.0.md ~ v1.3.md
│   └── Docker-Compose-Spec-v1.4.md  # 最新版(一次性 migration container 強制 restart: "no")
│
├── Development/
│   ├── spec/                        # 通用開發規格
│   │   ├── 00-overview-v1.0.md      # 專案基本架構 / 五大原則 / 路由規則
│   │   ├── 01-design-notes-v1.0.md  # 前後端 / DB / 部署設計筆記
│   │   └── scan-project-v1.0.md     # /scan-project 健檢規則庫
│   │
│   └── Harness-Engineering/         # Harness Engineering 規範 + skills 整合包(可 fork 套用至新專案)
│       ├── README.md                # 整合包索引 + 使用協議
│       ├── AGENTS.md / CLAUDE.md    # 跨工具事實層 / Claude 特化薄層
│       ├── Skills/                  # commit-all / merge-main / init-project / sso-init / start-dev / stop-dev / create-arch-diagram
│       ├── prompts/                 # 跨 agent skill(scan-project / propose-to-tasks / reflect-rules)
│       └── docs/                    # Design-Base(開發硬規則)/ Arch / Tasks
│
├── Github-CI/                       # Auto-CI-CD 的 GitHub 實作
│   ├── Github-CI.md                 # 兩端架構說明(中央 reusable ↔ User caller)
│   ├── ci-workflows/                # 中央 repo:reusable workflow(分棧 CI 積木 + auto-cicd + e2e)
│   └── user-template/               # 給 User 的 skill:掃技術棧 → 產 caller
│
└── replit/
    └── replit-spec-latest.md        # Replit 手機優先 RWD Web App 規格
```

---

## 文件用途速查

### 開發階段

| 想做的事 | 看哪份文件 |
| --- | --- |
| 新專案要先建什麼骨架 / 路由怎麼規劃 | [Development/spec/00-overview-v1.0.md](Development/spec/00-overview-v1.0.md) |
| 前後端 / DB / 部署設計時要想到什麼 | [Development/spec/01-design-notes-v1.0.md](Development/spec/01-design-notes-v1.0.md) |
| 套用 React + FastAPI 嚴格規範整合包 | [Development/Harness-Engineering/README.md](Development/Harness-Engineering/README.md) |
| 接公司 DF-SSO 登入 | `Development/Harness-Engineering/Skills/sso-init/` 下對應框架的檔案 |
| 在 Replit 做個人工具 | [replit/replit-spec-latest.md](replit/replit-spec-latest.md) |

### CI/CD 階段

| 想做的事 | 看哪份文件 |
| --- | --- |
| 把專案接上公司 Auto-CI-CD(產 GitHub Actions caller) | [Github-CI/Github-CI.md](Github-CI/Github-CI.md) → 跑 `user-template` skill |
| 了解 Auto-CI-CD 流程全貌(機密掃描 → AI 審查 → 自動合併 → CD) | [Architecture/Auto-CI-CD/workflow-v1.0.md](Architecture/Auto-CI-CD/workflow-v1.0.md)、[diagram.html](Architecture/Auto-CI-CD/diagram.html) |

### 部署階段

| 想做的事 | 看哪份文件 |
| --- | --- |
| 寫 Coolify 用的 docker-compose.yml | [Coolify-Deploy/Docker-Compose-Spec-v1.4.md](Coolify-Deploy/Docker-Compose-Spec-v1.4.md) |
| 環境變數三階段(`.env.example` / `.env` / Coolify 後台)怎麼安排 | spec/00-overview + design-notes 的 `[DEP]` 章節 |

### 健檢

| 想做的事 | 看哪份文件 |
| --- | --- |
| 掃描專案找出架構 / 資安 / 部署違規 | [Development/spec/scan-project-v1.0.md](Development/spec/scan-project-v1.0.md) |

---

## 五大核心原則(所有專案都適用)

擷取自 [spec/00-overview-v1.0.md](Development/spec/00-overview-v1.0.md),完整定義請見原檔:

1. **首頁永遠是登入頁** — `/` 未登入顯示登入表單;已登入 302 `/dashboard`。
2. **未通過驗證一律 302 `/?redirect=<原路徑>`** — 頁面與 API 行為一致,無例外。
3. **API 帶版本前綴 `/api/v{n}`**,受保護端點過 auth middleware;未登入 401,無權限 403。
4. **Response 外殼統一** `{ code, responseCode, message, data }`。
5. **環境變數三階段** — `.env.example`(commit 佔位)/ `.env`(本地 gitignore)/ Coolify 後台(線上覆蓋);`VITE_*` / `NEXT_PUBLIC_*` 走 build args。

---

## 自訂 Slash 指令

| 指令 | 說明 | 來源 |
| --- | --- | --- |
| `/commit-all` | 一鍵提交並推送當前分支所有變更(AI commit 自動加 `(AI)` 前綴) | [Development/Harness-Engineering/Skills/commit-all/SKILL.md](Development/Harness-Engineering/Skills/commit-all/SKILL.md) |
| `/merge-main` | 合併當前分支至 `main` 並推送 | [Development/Harness-Engineering/Skills/merge-main/SKILL.md](Development/Harness-Engineering/Skills/merge-main/SKILL.md) |
| `/scan-project` | 依規則庫掃描專案,結果寫入 `docs/Issues-Scan-Project.md` | [Development/spec/scan-project-v1.0.md](Development/spec/scan-project-v1.0.md) |
| `user-template` | 掃技術棧產出 Auto-CI-CD caller(`.github/workflows/`) | [Github-CI/user-template/SKILL.md](Github-CI/user-template/SKILL.md) |

---

## 使用方式

### 新專案啟動

1. 讀 [00-overview-v1.0.md](Development/spec/00-overview-v1.0.md) 與 [01-design-notes-v1.0.md](Development/spec/01-design-notes-v1.0.md) 建立骨架。
2. 接 SSO → 跑 `/sso-init` skill,依後端框架(FastAPI / Next.js / Spring)分流初始化。
3. 接 Auto-CI-CD → 把 [Github-CI/user-template/](Github-CI/user-template/) 複製進 `.claude/skills/`,跑該 skill 產出 `.github/workflows/` caller。
4. 寫 `docker-compose.yml` → 對照 [Docker-Compose-Spec-v1.4.md](Coolify-Deploy/Docker-Compose-Spec-v1.4.md)。
5. 上線前 `/scan-project` 跑一次健檢。

### 既有專案健檢

在專案目錄執行 `/scan-project`,Agent 會依 [scan-project-v1.0.md](Development/spec/scan-project-v1.0.md) 的規則庫輸出違規清單、修正建議,並寫入 `docs/Issues-Scan-Project.md`(累積式追蹤,已修項目會從檔案移除、新增項會合併進來)。

---

## Git 規範

- 主分支 `main`,新功能從 `main` 切 feature branch。
- Commit Message 使用繁體中文,格式 `<類型>: <描述>`(`Add` / `Modify` / `Fix` / `Refactor` / `Docs`)。
- AI 產生的 commit 一律加 `(AI)` 前綴,例:`(AI) Add: 新增掃描規則`。
- 未經允許禁止 `--force` / `reset --hard` / `--no-verify` 等破壞性操作。

---

## 版本策略

- 各規格檔以 `-vX.Y.md` 命名,重大變更升版並保留舊版。
- `Coolify-Deploy/` 最新版為 **v1.4**;`Development/spec/` 與 `Architecture/Auto-CI-CD/` 各規格目前為 **v1.0**。
- `Github-CI/` 工作流範本對接中央 `ci-workflows` repo,中央與 User 端偵測表兩邊同步演進。
- 文件間互相參考時使用相對路徑連結,避免失聯。
