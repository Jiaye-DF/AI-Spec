# AI-Spec

> AI 輔助開發的規格文件集 — 給 Claude Code 等 AI Agent 以及專案開發者共用的規範骨架。

本倉庫集中收錄公司專案在「**開發**」與「**部署至 Coolify**」兩個階段的通用規則。新專案啟動時依此建立骨架;既有專案可透過 `/scan-project` 針對這些規則進行健檢,輸出修正建議。

---

## 目錄結構

```
AI-Spec/
├── Coolify-Deploy/                  # Coolify + Docker Compose 部署規範
│   ├── Docker-Compose-Spec-v1.0.md
│   ├── Docker-Compose-Spec-v1.1.md
│   └── Docker-Compose-Spec-v1.2.md  # 最新版(Adminer / Seq 納入標準服務,強制 map 語法)
│
├── Development/
│   ├── Claude/
│   │   └── CLAUDE-v1.0.md           # 全專案共用的 Claude Code 基本規範
│   ├── Git-Tools/
│   │   ├── commit-all.md            # /commit-all 自訂指令
│   │   └── merge-main.md            # /merge-main 自訂指令
│   └── Project/
│       ├── spec/
│       │   ├── 00-overview-v1.0.md       # 專案通用架構(五大原則 / 路由 / 骨架)
│       │   └── 01-design-notes-v1.0.md   # 前後端 / DB / 部署設計注意事項
│       ├── scan/
│       │   └── scan-project-v1.0.md      # /scan-project 掃描規則庫
│       ├── sso-init/
│       │   ├── sso-init-express.md       # Next.js / Express 的 DF-SSO 整合
│       │   ├── sso-init-fastapi.md       # FastAPI 的 DF-SSO 整合
│       │   └── sso-init-spring.md        # Spring Boot 的 DF-SSO 整合
│       └── replit/
│           └── replit-spec-latest.md     # Replit 手機優先 RWD Web App 規格
│
└── Questions/                       # 部門遇到的問題紀錄與討論
    ├── 20260415-Questions-v1.0.md
    └── 20260415-Questions-v1.0-Gamma.md
```

---

## 文件用途速查

### 開發階段

| 想做的事 | 看哪份文件 |
| --- | --- |
| 了解 Claude Code 在任何專案都該遵守的規矩 | [Development/Claude/CLAUDE-v1.0.md](Development/Claude/CLAUDE-v1.0.md) |
| 新專案要先建什麼骨架 / 路由怎麼規劃 | [Development/Project/spec/00-overview-v1.0.md](Development/Project/spec/00-overview-v1.0.md) |
| 前後端 / DB / 部署設計時要想到什麼 | [Development/Project/spec/01-design-notes-v1.0.md](Development/Project/spec/01-design-notes-v1.0.md) |
| 接公司 DF-SSO 登入 | `Development/Project/sso-init/` 下對應框架的檔案 |
| 在 Replit 做個人工具 | [Development/Project/replit/replit-spec-latest.md](Development/Project/replit/replit-spec-latest.md) |

### 部署階段

| 想做的事 | 看哪份文件 |
| --- | --- |
| 寫 Coolify 用的 docker-compose.yml | [Coolify-Deploy/Docker-Compose-Spec-v1.2.md](Coolify-Deploy/Docker-Compose-Spec-v1.2.md) |
| 環境變數三階段(`.env.example` / `.env` / Coolify 後台)怎麼安排 | spec/00-overview + design-notes 的 `[DEP]` 章節 |

### 健檢

| 想做的事 | 看哪份文件 |
| --- | --- |
| 掃描專案找出架構 / 資安 / 部署違規 | [Development/Project/scan/scan-project-v1.0.md](Development/Project/scan/scan-project-v1.0.md) |

---

## 五大核心原則(所有專案都適用)

擷取自 [spec/00-overview-v1.0.md](Development/Project/spec/00-overview-v1.0.md),完整定義請見原檔:

1. **首頁永遠是登入頁** — `/` 未登入顯示登入表單;已登入 302 `/dashboard`。
2. **未通過驗證一律 302 `/?redirect=<原路徑>`** — 頁面與 API 行為一致,無例外。
3. **API 帶版本前綴 `/api/v{n}`**,受保護端點過 auth middleware;未登入 401,無權限 403。
4. **Response 外殼統一** `{ code, responseCode, message, data }`。
5. **環境變數三階段** — `.env.example`(commit 佔位)/ `.env`(本地 gitignore)/ Coolify 後台(線上覆蓋);`VITE_*` / `NEXT_PUBLIC_*` 走 build args。

---

## 自訂 Slash 指令

| 指令 | 說明 | 來源 |
| --- | --- | --- |
| `/commit-all` | 一鍵提交並推送當前分支所有變更(AI commit 自動加 `(AI)` 前綴) | [Development/Git-Tools/commit-all.md](Development/Git-Tools/commit-all.md) |
| `/merge-main` | 合併當前分支至 `main` 並推送 | [Development/Git-Tools/merge-main.md](Development/Git-Tools/merge-main.md) |
| `/scan-project` | 依規則庫掃描專案,結果寫入 `docs/Issues-Scan-Project.md` | [Development/Project/scan/scan-project-v1.0.md](Development/Project/scan/scan-project-v1.0.md) |

---

## 使用方式

### 新專案啟動

1. 讀 [CLAUDE-v1.0.md](Development/Claude/CLAUDE-v1.0.md) 與 [00-overview-v1.0.md](Development/Project/spec/00-overview-v1.0.md) 建立骨架。
2. 接 SSO → 依後端框架挑 `sso-init-*` 對應檔案執行初始化。
3. 寫 `docker-compose.yml` → 對照 [Docker-Compose-Spec-v1.2.md](Coolify-Deploy/Docker-Compose-Spec-v1.2.md)。
4. 上線前 `/scan-project` 跑一次健檢。

### 既有專案健檢

在專案目錄執行 `/scan-project`,Agent 會依 [scan-project-v1.0.md](Development/Project/scan/scan-project-v1.0.md) 的規則庫輸出違規清單、修正建議,並寫入 `docs/Issues-Scan-Project.md`(累積式追蹤,已修項目會從檔案移除、新增項會合併進來)。

---

## Git 規範

- 主分支 `main`,新功能從 `main` 切 feature branch。
- Commit Message 使用繁體中文,格式 `<類型>: <描述>`(`Add` / `Modify` / `Fix` / `Refactor` / `Docs`)。
- AI 產生的 commit 一律加 `(AI)` 前綴,例:`(AI) Add: 新增掃描規則`。
- 未經允許禁止 `--force` / `reset --hard` / `--no-verify` 等破壞性操作。

---

## 版本策略

- 各規格檔以 `-vX.Y.md` 命名,重大變更升版並保留舊版。
- `Coolify-Deploy/` 最新版為 **v1.2**;`Development/Project/` 各規格目前為 **v1.0**。
- 文件間互相參考時使用相對路徑連結,避免失聯。
