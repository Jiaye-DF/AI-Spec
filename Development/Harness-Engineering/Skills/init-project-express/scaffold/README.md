# scaffold/ — init-project-express skill 執行核心

`init-project-express` skill 內部的中央 scaffold 工具。依 `manifest.json` 把 `templates/*.tmpl` 落到 target 目錄,版本號鎖在 manifest 一處。

---

## 用法

```bash
node scaffold.mjs --name my-app --target ./my-app
```

主要 flag:

| flag | 說明 | 預設 |
| --- | --- | --- |
| `--name <kebab>` | 專案名(必填) | — |
| `--frontend next\|vite` | 前端 toolchain | `next` |
| `--no-database` | 停用 Prisma / DB(預設含 DB) | (含 DB) |
| `--use-docker-compose` | 產生 docker-compose.yml + Dockerfile | off |
| `--frontend-port <n>` | dev server port | `3000` |
| `--backend-port <n>` | dev server port | `8000` |
| `--postgres-port <n>` | 本機 PG port | `5432` |
| `--api-version <v>` | API 路徑前綴 | `v1` |
| `--target <dir>` | 產出根目錄 | cwd |
| `--dry-run` | 只列動作不寫檔 | off |
| `--no-install` | 跳過 npm install / prisma generate | off |
| `--force` | 允許 target 非空 | off |

---

## 結構

```
scaffold/
├── manifest.json         版本 / 檔案地圖 / 條件分支
├── scaffold.mjs          executor(zero-dep Node ESM)
├── README.md             本檔
└── templates/
    ├── root/             .gitignore / .env.* / README.md
    ├── backend/          Express + TypeScript 全部原始碼
    ├── frontend-next/    frontend/* (Next.js App Router)
    ├── frontend-vite/    frontend/* (Vite branch)
    ├── docker/           docker-compose.yml + Dockerfile
    └── .github/          GitHub Actions workflow
```

---

## Placeholder 語法

`.tmpl` 內用雙大括號:`{{project_name}}`、`{{express_version}}`...

條件區塊:

```
{{#if include_database}}
這段只在 include_database=true 時保留
{{/if}}

{{#if !include_database}}
否定式:只在 include_database=false 時保留
{{/if}}
```

---

## 修改流程

| 想做 | 改哪 |
| --- | --- |
| 升版本(`express` 5.0.1 → 5.1.0) | 只改 `manifest.json` `versions.backend.express` |
| 新增模板檔 | 1. 建 `.tmpl` 2. 在 `manifest.actions[]` 加 `render` 條目 |
| 新增條件分支 | 1. `manifest.params` 加 param 2. `actions[]` 加 `when` 3. `scaffold.mjs` `BOOL_KEYS` 加入 key |

---

## Acceptance

1. `cd backend && npm run typecheck` exit 0
2. `cd backend && npm run dev` 起得來,`GET /api/v1/health` 回 `{"success":true,...}`
3. `cd frontend && npm run dev` 起得來,`/` 出首頁
4. (有 DB)`GET /api/v1/health` 回 `{"success":true,"data":{"db":"ok"},...}`
