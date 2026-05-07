# 01-routing — 路由 + 統一回應

> **何時讀**:寫新 endpoint 才讀。

## API 路由

- 統一前綴 `/api/v1`
- kebab-case 複數(`/api/v1/user-groups`)
- 路徑參數用 UID(UUID),**禁**用內部主鍵
- 多層最多兩層(`/api/v1/users/{uid}/roles`)
- 動作型用動詞後綴(`POST /api/v1/users/{uid}/disable`)

## 統一回應外殼

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

例外:檔案下載(`StreamingResponse`)豁免外殼;錯誤仍走標準 HTTP status + ApiResponse。
