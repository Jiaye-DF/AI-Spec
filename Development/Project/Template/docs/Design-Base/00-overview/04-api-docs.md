# 04-api-docs — API 文件路徑

> **何時讀**:寫 FastAPI 入口時讀。

FastAPI **必須**:`docs_url="/api/docs"`、`redoc_url=None`。**禁用**:`/swagger`、`/docs`、`/openapi`。新增 / 修改 API 時同步 Pydantic Request / Response schema 與欄位 description。
