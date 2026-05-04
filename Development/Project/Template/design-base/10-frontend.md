# 10-frontend — React 前端必守規則

鎖定 **React 19 + TS**(Vite **或** Next.js)+ Redux Toolkit + RTK Query + Tailwind v4。

---

## 1. 路由錯誤邊界

**必備**:Next.js `app/error.tsx` + `app/global-error.tsx`;Vite 用 React Router `errorElement` 或 `<ErrorBoundary>`。錯誤邊界**禁**顯示業務 uid;允許顯示 `error.digest`。`global-error` 因樣式未載入,允許 inline style + 中性色 hex。

## 2. API 呼叫集中

元件**禁**直呼 `fetch` / `axios`。一律走 `lib/api/*` 或 RTK Query(`createApi` + endpoints)。後端 base URL 由 env 注入,**禁**寫死。

## 3. 環境變數前綴

- Next.js → `NEXT_PUBLIC_*`
- Vite → `VITE_*`

**禁**客戶端引用無前綴 env(編譯為 undefined,且可能洩漏)。Client secret **禁**進前端 bundle。所有 env 須登記於 `.env.example`。

## 4. 認證(httpOnly cookie 由 FastAPI 設定)

- JWT 透過後端 `Response.set_cookie(httponly=True, secure=True, samesite="lax")`
- 前端**禁**讀寫該 cookie
- 取登入狀態一律透過共用 `useAuth`(內部 RTK Query `useGetMeQuery`)
- SSO callback 須驗 state CSRF

## 5. 狀態管理

- **全域**(語系 / 主題 / 登入態):Redux Toolkit slice
- **伺服器資料**(列表 / 詳情):RTK Query;**禁**自管 loading / error / cache
- **元件本地**:`useState` / `useReducer`,**禁**提升至全域

## 6. TypeScript 嚴格

- `tsconfig.json` 必含 `"strict": true`
- **禁** `any`(改 `unknown` + 型別守衛)
- 函式**必**標參數+回傳型別
- Props **必**用獨立 `interface`(非匿名行內)

```ts
interface AccountCardProps { name: string; onSelect: (uid: string) => void; }
function AccountCard({ name, onSelect }: AccountCardProps): React.ReactNode { ... }
```

## 7. 渲染效能

- callback **必** `useCallback`
- 衍生計算 **必** `useMemo`
- 清單元件 **必** `React.memo`
- **禁**在 render 內建立物件 / 陣列字面值作 props

## 8. i18n

UI 文字一律 i18n key;字典依模組分檔,新增字串時所有語系同步;缺漏視為 bug。例外:`global-error` 允許硬編碼最低限文字。

## 9. 識別碼隱藏

UI **禁**暴露內部 ID(`*_uid` / `pid` / UUID / hash)→ 顯示 name / label,空值用 fallback。例外:URL 路徑、React `key`、form hidden、`error.digest`。

## 10. 字級下限

- 桌機 (`md+`) body / 表格 / 表單 / nav / 分頁:**最低** `text-base`(16px)
- mobile 密集元素:`text-sm md:text-base`(mobile 14 / 桌機 16)
- **禁**正文用 `text-xs`;例外:group label uppercase / monospace code / hint

## 11. 日期時間顯示

對齊 DB 時區策略(`30-database.md § 時區`)。若 DB 存 UTC+8 wall-clock:**禁** `new Date(...).toLocaleString` / 帶 `timeZone`。統一 `utils/datetime.ts` 入口,**禁**各頁自寫。

```ts
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
  return m ? `${m[1]}/${m[2]}/${m[3]} ${m[4]}:${m[5]}:${m[6]}` : iso;
}
```

## 12. 共用 Hook / Component

- 跨頁 ≥ 3 次重複邏輯 → 抽共用
- **禁**頁面自宣告含 overlay / ESC / portal 的 dialog → 走 `Dialog` / `ModalDialog`
- **禁**原生 `alert` / `confirm` / `prompt` → 走 `useDialog`
- 列表頁 cursor 分頁 / 過濾 / mutation+dialog 必抽共用 hook(`useCursorPagination` / `useFilteredList` / `useMutationWithDialog` / `useConfirmMutation`)

## 13. 命名

| 對象 | 慣例 |
| --- | --- |
| 元件 | PascalCase(`AccountCard.tsx`) |
| Hook | `use` 前綴(`useAccountList.ts`) |
| 工具函式 | camelCase(`formatDate.ts`) |
| 型別/介面 | PascalCase |
| CSS Variable | kebab-case(`--color-background`) |
| 路由目錄 | kebab-case(`app/user-groups/`) |
