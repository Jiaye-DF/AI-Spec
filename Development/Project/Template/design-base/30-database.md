# 30-database — PostgreSQL + SQLAlchemy 必守規則

鎖定 **PostgreSQL + SQLAlchemy 2 async + Alembic**。

---

## 1. 必備欄位

每張**業務資料表**必含:

| 角色 | 範例命名 | 型別 |
| --- | --- | --- |
| 內部主鍵 | `id` / `pid` / `ppid` | `BIGINT` 自增 |
| 對外識別碼 | `uid` / `<table>_uid` | `UUID` unique |
| 軟刪除 | `is_deleted` | `BOOLEAN` default `FALSE` |
| 建立時間 | `created_at` | `TIMESTAMP` |
| 更新時間 | `updated_at` | `TIMESTAMP` |
| 建立者 | `created_by` | `UUID` |
| 最後更新者 | `updated_by` | `UUID` |

`is_active` / `sort_order` **非全表必備**,需要時加。每欄必加 `COMMENT ON COLUMN` 中英雙語。

## 2. 對外 vs 對內識別碼

- 內部主鍵僅供 DB 內部關聯;**禁**暴露於 API / 前端
- 對外一律 UUID;FastAPI 路徑用 UID
- 外部系統 ID(Azure AD `oid` / Stripe `customer.id`)以**獨立欄位**儲存(`azure_ad_object_id UUID`),**禁**作為主鍵或對外 UID

## 3. 軟刪除

- 業務資料**禁**物理刪除;設 `is_deleted = TRUE`
- SQLAlchemy 查詢**必**預設過濾 `is_deleted == False`
- 審計 / log 類表(append-only)不適用

### Repository 命名強制

- **預設過濾版**(過濾 `is_deleted`):無後綴 — `find_by_uid` / `get_*` / `list_*`
- **不過濾版**(包含已軟刪)**必**加 `_including_deleted` 後綴
- **禁**反向命名(把過濾版叫 `find_active_*` 而把不過濾版佔用 `find_*`)

```python
async def find_by_uid(self, uid):                    # ✅ 預設過濾
async def find_by_uid_including_deleted(self, uid):  # ✅ 明確不過濾
async def find_active_by_uid(self, uid):             # ✅ 過濾 deleted + is_active=FALSE
```

## 4. 連線管理

- **必** `create_async_engine` + `async_sessionmaker`;**禁**每請求建立新連線
- 連線池參數透過 env(`pool_size` / `max_overflow` / `pool_recycle`)
- graceful shutdown 須 `await engine.dispose()`(放 lifespan shutdown)

## 5. 密碼 / 敏感資料

- 密碼**必** `passlib[bcrypt]` 或 argon2;**禁** md5 / sha1 / 明文
- bcrypt 在 async 上下文**必** `asyncio.to_thread` 包裝(`20-backend.md § 8`)
- 不可逆雜湊欄位(BCrypt hash 等)應與 PII 隔離(獨立 credential 表)
- PII 欄位 schema 加 `comment="PII"` 或 `-- PII`

## 6. SQL 安全

**禁**字串拼接 / f-string 拼 SQL → 用 SQLAlchemy ORM;raw SQL 用 `text(...).bindparams(...)`。

```python
text(f"SELECT * FROM users WHERE id = {user_id}")            # ❌ injection
text("SELECT * FROM users WHERE id = :id").bindparams(id=user_id)  # ✅
```

## 7. 數值精度

金額 / 計費 / 餘額(`amount` / `price` / `balance` / `total`):**禁** FLOAT / DOUBLE → `Numeric(18, 2)` 或整數最小單位(分)。

## 8. 時區

DB schema `TIMESTAMP` / `TIMESTAMPTZ` 須與顯示層轉換策略**全棧一致**(`00-overview.md § 4`、`10-frontend.md § 11`)。container `TZ=Asia/Taipei` + DB session timezone 對齊。**禁**前後端各做時區轉換 → 雙偏移。

## 9. SQLAlchemy Model

```python
class BaseModel(Base):
    __abstract__ = True
    pid: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    uid: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False, unique=True, default=uuid4)
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, server_default=func.now())
    created_by: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    updated_by: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
```

- 所有 Model 繼承統一 `BaseModel`
- 用 SQLAlchemy 2 風格 `mapped_column`(**禁**舊 `Column(...)`)
- `is_active` / `sort_order` **不**放 `BaseModel`

## 10. Alembic

- 命名:`v{N}_{slug}.py` 或 `YYYY_MM_DD_HHMM-{slug}.py`(專案內統一)
- **禁**修改已合併到 main 的 migration → 建新 revision
- `down_revision` **必**正確;禁孤兒 / 多頭分支
- migration 須冪等:DDL 用 `IF NOT EXISTS` / `IF EXISTS`
- prod 前 `alembic upgrade head` + `alembic downgrade -1` round-trip 驗證
- 一個 migration 只做一件事

## 11. 索引

- 外鍵欄位**必**索引
- where / order by 高頻欄位**必**索引
- 軟刪除過濾可用 partial index(`WHERE is_deleted = FALSE`)
- 命名:`idx_{table}_{column}` / `uq_{table}_{column}` / `fk_{table}_{ref}` / `trg_{table}_{action}`
