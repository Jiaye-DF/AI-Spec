# U2 — Agentic Engineer(人類角色)

> 對應架構圖第 ② 格(右上,人物圖示)。
> 學習時間:30 ~ 45 分鐘。
> 必修角色:**Agentic Engineer / Tech Lead ✅深**;PM / 高層 ✅淺;其他可選。
> 上層銜接:[U1 業務情境](U1-Business-Context.md);
> 下層銜接:[U3 Agentic Engineering](U3-Agentic-Engineering.md)、[U4 Harness Engineering](U4-Harness-Engineering.md)。

---

## 一、單元目標

學完這個單元,你應該能回答:

1. Agentic Engineer 跟傳統 PM、Tech Lead、SRE、Prompt Engineer 有什麼差別?
2. 為什麼這個角色必須跨「上層工作流」與「下層執行底座」兩層?
3. 在 Coolify 部署簽核鏈中,這個角色扮演什麼位置?

---

## 二、圖中對應內容

架構圖第 ② 格定義了 4 大職責:

```
Agentic Engineer
  ├─ 定義目標 / 需求
  ├─ 設計工作流
  ├─ 審查結果
  └─ 持續改善 Harness
```

並標出 3 條雙向箭頭:
- 與 ① 業務情境 — 提供需求 / 約束 / 資料來源 / 驗證標準。
- 與 ③ 上層工作流 — 驅動需求 / 設定目標。
- 與 ④ 執行底座 — 持續改善 Harness(這條是這個角色與一般 PM 最大的差異)。

---

## 三、四大職責詳解

### 3.1 定義目標 / 需求

- 把 U1 的業務痛點翻成**可量測的目標**(例:「測試 Log Triage 平均處理時間 ≤ 10 分鐘」)。
- 定義成功訊號(Success Signal),這條會直接餵到 U4.5 飛輪的 Reward 階段。

### 3.2 設計工作流

- 決定 U3 上層要用幾個 Agent、誰是 Leader、誰是 Worker。
- 決定 Agent 之間用 Shared Memory、Tool Gateway 還是 Message。
- 不需要寫程式,但要能畫出工作流圖並交給 U4 / U5 落實。

### 3.3 審查結果

- 看 U3 跑出來的成果(設計變更摘要、Triage 報告、品質分析)。
- 判斷哪些可以直接交付,哪些要打回去(進入 Failure Cases,餵到 U4.5)。
- **這是人類介入點,不可外包給 AI**。

### 3.4 持續改善 Harness

- 發現某個 Agent 老是出錯 → 改 Prompt、加 Guardrails、調 Tool 權限。
- 發現某個 MCP 工具被濫用 → 改 Sandbox 規則。
- 這條是 Agentic Engineer 與「使用 AI 的 PM」最大的差異 — **要動 U4 的底座**,而不是只調 U3 的 Prompt。

---

## 四、與其他角色的差異

| 角色 | 主要負責 | 是否動 U4 底座? | 是否簽 deploy? |
| --- | --- | :-: | :-: |
| 傳統 PM | 定義需求、收成果 | ✗ | ✗ |
| 傳統 Tech Lead | 系統架構、code review | △(主要動應用層) | ✓(限應用) |
| Prompt Engineer | 調 Prompt | ✗ | ✗ |
| SRE / DevOps | 部署、監控 | △(主要動基礎設施) | ✓(限基礎設施) |
| **Agentic Engineer** | **U2 4 大職責 + 跨 U3/U4 設計** | **✓** | **✓(Agent 系統)** |

→ Agentic Engineer 是把上述角色的責任**重組**而成的新角色,不是疊加。

---

## 五、與 Coolify Deploy 的關聯

雖然這個角色不直接寫 docker-compose.yml,但對 Coolify 合規有 3 個直接影響:

1. **Deploy 簽核權** — 任何 Agent 系統上 Coolify,必須由 Agentic Engineer 簽核(對應附件第 6 條 Audit Trail)。
2. **Prompt / Tool 變更也是 deploy** — 改 Prompt 等同改程式,必須走相同的 commit + push + Coolify auto-deploy 流程,**不可線上熱改**。
3. **Sandbox 規則責任歸屬** — 當 Agent 想要新工具(MCP)、新權限,由 Agentic Engineer 評估並更新 Harness 規則,不是 DevOps 自行決定。

→ **Agentic Engineer 是 Coolify 合規鏈中「人工核准」的那個節點**。

---

## 六、自我檢核

通過這 6 題即視為 U2 完成:

1. 用一句話講出 Agentic Engineer 與 Prompt Engineer 的差別(提示:能不能動 U4)。
2. 給定一個 Agent 老是 hallucinate,你會優先改 Prompt 還是改 Harness?為什麼?
3. 列出 4 大職責中,**最不能外包給 AI** 的是哪一項,為什麼?
4. 如果業務要「直接在 Coolify 後台改 Prompt 試試看」,你怎麼回應?(提示:不可線上熱改)
5. 在公司現況下,目前由誰擔任 Agentic Engineer?是專職還是兼任?
6. 寫出你最近一次「持續改善 Harness」的具體例子(改 Prompt / 加 Guardrails / 調工具權限其一)。

---

## 七、延伸閱讀

- 架構圖最下方「關係總結」一行:**Agentic Engineer = 設計與持續改善這套系統的人**。
- [U4 Harness Engineering](U4-Harness-Engineering.md) — 這個角色的「主要工作場域」。
- [Coolify-Compliance-Mapping.md](Coolify-Compliance-Mapping.md) 第 6 條 Audit Trail。
