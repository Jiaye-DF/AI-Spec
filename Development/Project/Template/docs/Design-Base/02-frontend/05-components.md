# 05-components — 共用 Hook / Component

> **何時讀**:寫 Dialog / 共用元件 / 列表頁 / mutation 才讀。

- 跨頁 ≥ 3 次重複邏輯 → 抽共用
- **禁**頁面自宣告含 overlay / ESC / portal 的 dialog → 走 `Dialog` / `ModalDialog`
- **禁**原生 `alert` / `confirm` / `prompt` → 走 `useDialog`
- 列表頁 cursor 分頁 / 過濾 / mutation+dialog 必抽共用 hook(`useCursorPagination` / `useFilteredList` / `useMutationWithDialog` / `useConfirmMutation`)
