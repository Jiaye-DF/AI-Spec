# 03-env-layers — 環境分層(localhost vs 部署)

> **何時讀**:deploy / 配置 env 時讀。

- 至少 dev / staging / prod 三層,**各自**有 `.env.{dev,staging,prod}.example`
- **dev = localhost**:後端 dev server + 前端 dev server;依賴服務由開發者於本機 install;連線指向 `localhost:*`
- **staging / prod = 實際部署環境**:連線指向真實 host(例:`db.example.com`、AWS RDS endpoint 等);**禁止**用 `localhost`;部署平台規範見 `06-Coolify-CD/`
- frontend / backend 為**獨立 service**,各自 `.env*.example`;前後端透過 HTTP 通訊
- **禁混用**:`.env.dev` 直接拿去部署會連不到 DB(localhost 不存在於遠端 host),且 secret 為 dev 預設值會觸發 prod fail-fast

| | dev | staging / prod |
| --- | --- | --- |
| `.env` 檔 | `.env.dev`(從 `.env.dev.example`) | `.env.staging` / `.env.prod` |
| `DATABASE_URL` | `postgresql+asyncpg://...@localhost:5432/...` | `postgresql+asyncpg://...@<real-host>:5432/...` |
| `JWT_SECRET_KEY` | dev 預設值(可) | **必**改 32+ 字元隨機(否則 prod fail-fast) |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | `["https://<frontend-domain>"]` |
