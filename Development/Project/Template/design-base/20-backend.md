# 20-backend — FastAPI 後端必守規則

鎖定 **Python + FastAPI + SQLAlchemy 2 async + Pydantic 2 + Alembic + uv**。

---

## 1. 分層

```
api → services → repositories → models
        ↓
     clients(第三方)
```

**禁**跨層(api 直 import repository、service 直寫 raw SQL)。`clients/` 只由 `services` 呼叫;第三方錯誤須轉 `AppError`。

## 2. API 路由

- 統一前綴 `/api/v1`
- kebab-case 複數(`/api/v1/user-groups`)
- 路徑參數用 UID(UUID),**禁**用內部主鍵
- 多層最多兩層(`/api/v1/users/{uid}/roles`)
- 動作型用動詞後綴(`POST /api/v1/users/{uid}/disable`)

## 3. Lifespan(取代 `on_event`)

```python
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.redis = await aioredis.from_url(settings.REDIS_URL)
    yield
    await app.state.redis.aclose()
    await engine.dispose()

app = FastAPI(lifespan=lifespan, docs_url="/api/docs", redoc_url=None)
```

**禁** `@app.on_event(...)` (已棄用)。

## 4. 統一回應外殼

```python
class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: T | None = None
    detail: str | None = None
    response_code: int
```

- `data`:`null` 或 dict;**禁**直接為 array(列表須 `{items: [...], total}`)
- `detail`:使用者可讀訊息;**禁**洩漏 SQL / traceback / 內部欄位
- `response_code`:int,等同 HTTP status
- 路由 response type **必**用 Pydantic schema;**禁** `dict` / `dict[str, object]`

例外:檔案下載 (`StreamingResponse`) 豁免外殼;錯誤仍走標準 HTTP status + ApiResponse。

## 5. 認證與授權

- 登入 JWT 透過 `set_cookie(httponly=True, secure=True, samesite="lax")` 設定
- 權限檢查**集中**於 `api/deps.py`:`Depends(require_role(...))` / `Depends(require_permission(...))`
- **禁**各 router 自行解析 cookie

## 6. 例外處理

全域註冊 3 個 handler:

| 例外 | 處理 |
| --- | --- |
| `AppError` | 對應 code + detail |
| `RequestValidationError` | 欄位級錯誤 |
| `Exception` | `logger.exception(...)` + 通用「伺服器錯誤」 |

response **禁**洩漏 stack trace / SQL / table 名 / 路徑 / 內部 host / token。詳細走 log。

## 7. CORS

```python
app.add_middleware(CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # 從 env 讀,禁 ["*"]
    allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"])
```

**禁** `allow_credentials=True` + `allow_origins=["*"]` 同時。

## 8. async safety:CPU-bound 必 thread offload

async 函式內**禁**裸呼叫 ≥ 50 ms 同步 CPU 操作(bcrypt / argon2 / 大 JSON parse / 影像處理)。**必** `await asyncio.to_thread(fn, *args)`。`core/security.py` **同時**提供同步 + `*_async` 兩版。

```python
ok = await asyncio.to_thread(verify_password, plain, hashed)  # ✅
ok = verify_password(plain, hashed)                            # ❌ 卡 event loop
```

## 9. Service 多表寫入必 transaction

Service 內 ≥ 2 處跨**不同表**寫入 → **必** `async with self.db.begin():`(或 `begin_nested()` 若 caller 已包 begin)。transaction 內**禁**含長阻塞操作;hash 須在 begin 之前算完。

```python
secret_hash = await hash_password_async(payload.secret_plain)  # 先做完
async with self.db.begin():
    user = User(...); self.db.add(user); await self.db.flush()
    cred = UserMockCredential(user_uid=user.uid, secret_hash=secret_hash); self.db.add(cred)
```

## 10. 啟動 fail-fast

dev 帶預設值的敏感配置 → **必**在 `Settings._fail_fast_in_prod` 用 `@model_validator(mode="after")` 統一檢查 — `APP_ENV in ("staging","prod")` 仍為 dev 預設值即 `raise ValueError`。

```python
@model_validator(mode="after")
def _fail_fast_in_prod(self) -> "Settings":
    if self.APP_ENV in ("staging", "prod"):
        for name, actual, dev_default in [("JWT_SECRET_KEY", self.JWT_SECRET_KEY, JWT_SECRET_KEY_DEV_DEFAULT)]:
            if actual == dev_default:
                raise ValueError(f"{name} 仍為 dev 預設值")
    return self
```

新 secret 配置:加欄位 + 加進 validator 清單 + 同步 `.env*.example`。

## 11. Logging

- Python `logging` 或 `loguru`
- 例外**必** `logger.exception(...)` 保留 traceback
- log 中**禁** token / password / API key 明文;敏感欄位記錄前過濾
- 結構化:`app_name` / `request_id` / ISO UTC timestamp

## 12. 第三方 client

集中於 `app/clients/`,依服務分子目錄。用 `httpx.AsyncClient`(於 lifespan 建立)。client 須處理 timeout / retry / 錯誤轉 `AppError`。**禁**在 services / api 直 `httpx.get(...)`。

## 13. 命名

| 對象 | 慣例 | 範例 |
| --- | --- | --- |
| 模組 / 檔案 | snake_case | `account_service.py` |
| 類別 | PascalCase | `AccountService` |
| 函式 / 變數 | snake_case | `get_account_by_uid` |
| 常數 | SCREAMING_SNAKE | `MAX_RETRY_COUNT` |
| API 路徑 | kebab-case 複數 | `/api/v1/user-groups` |
| 環境變數 | SCREAMING_SNAKE | `JWT_SECRET_KEY` |
| Pydantic schema | PascalCase + 後綴 | `AccountCreateRequest` / `UserResponse` |

## 14. PEP 484 / 585

- 函式**必**標參數+回傳型別
- **禁** `Any`(異質容器用 `object`,DB session 用 `AsyncSession`)
- **禁** `typing.List` / `typing.Dict` → `list[...]` / `dict[...]`

## 15. 測試

- DB 整合測試**禁** mock SQL,須真實測試 DB(`pytest-asyncio` + alembic 跑 schema)
- 第三方:`respx` / `httpx.MockTransport`
- 測試檔案結構**對映** `app/`
