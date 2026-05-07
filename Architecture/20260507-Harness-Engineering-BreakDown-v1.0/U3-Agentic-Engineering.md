# U3 — Agentic Engineering(上層工作流)

> 對應架構圖第 ③ 格(中段藍色區塊)。
> 學習時間:1 小時。
> 必修角色:**Tech Lead / PM ✅深**;QA(測試/品質 Agent 部分)✅深;DevOps ✅淺。
> 上層銜接:[U2 Agentic Engineer 角色](U2-Agentic-Engineer-Role.md);
> 下層銜接:[U4 Harness Engineering](U4-Harness-Engineering.md)。

---

## 一、單元目標

學完這個單元,你應該能回答:

1. Control Plane / Leader Agent 是什麼?為什麼不能讓 6 個 Agent 各跑各的?
2. 6 種 Agent 各自的責任邊界 / 觸發條件 / 輸出產物是什麼?
3. 「維運/告警 Agent」要怎麼接到 Coolify 的告警通道?

---

## 二、圖中對應內容

```
┌──────────────────────────────────────────────────────────────┐
│  Agentic Engineering(上層工作流)                            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Control Plane / Leader Agent                          │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │  │
│  │  │  任務分派    │ │ Shared Memory│ │ Tool Gateway │   │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ① 需求業務 ② 設計Review ③ 測試/驗證 ④ 品質/NPI ⑤ 維運/告警 ⑥ 主管報告 │
│  Agent       Agent        Agent       Agent      Agent      Agent  │
│                                                              │
│  多 Agent 協作完成工程交付                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 三、Control Plane / Leader Agent

### 3.1 為什麼需要

- 6 個 Agent 各跑各的會發生:重複呼工具、Memory 寫衝突、互相打架。
- Leader Agent 負責 **任務分派**(誰先做、誰拿什麼資料)、**Shared Memory** 的寫入仲裁、**Tool Gateway** 的權限控管。

### 3.2 三大元件

| 元件 | 作用 | 對應 U4 哪個元件? |
| --- | --- | --- |
| 任務分派 | 把 Agentic Engineer 的目標切成子任務,派給對應 Agent | U4 的 Prompts/Spec(Leader 自己也是個 Agent,有 Prompt) |
| Shared Memory | 跨 Agent 共用上下文,例如 Spec、客戶資料、上次跑的結果 | U4 的「文件/知識/Memory」 |
| Tool Gateway | 統一收口所有 MCP/API 呼叫,做白名單與配額管理 | U4 的「Tools/MCP/API」+「Sandbox/權限授權」 |

→ **Control Plane 是 U3 與 U4 之間的橋樑**;它本身住在 U3,但實際靠 U4 元件運作。

---

## 四、6 種 Agent 詳解

### ① 需求業務 Agent
- **觸發**:有新需求進來、或 PM 在 Spec 庫新增條目。
- **責任**:把口語需求 → 結構化規格 → 放到 Shared Memory。
- **輸出**:`docs/specs/<feature>.md`(由 U5 的 Repo/Code 持久化)。
- **必過 Eval**:規格完整度、與既有規格無衝突。

### ② 設計 Review Agent
- **觸發**:有新 PR 或新 Spec。
- **責任**:對照 [`spec/00-overview-v1.0.md`](../../Development/Project/spec/00-overview-v1.0.md) 五大原則做 review。
- **輸出**:Review 評論(寫回 PR)、設計變更摘要(對應「現在可落地用途」第 3 項)。

### ③ 測試 / 驗證 Agent
- **觸發**:CI 跑完、或 QA 手動觸發。
- **責任**:吃 Test Logs(U5),做 Triage 與 Issue 歸類(對應「現在可落地用途」第 2 項)。
- **輸出**:Issue 報告 + 推薦修正方向。
- **必過 Eval**:Triage 準確率、誤報率。

### ④ 品質 / NPI Agent
- **觸發**:NPI 階段或品質會議前。
- **責任**:對照 PLM/BOM(U5)做良率與品質分析(對應「未來可延伸用途」第 3 項)。
- **輸出**:良率報告 + 異常根因建議。

### ⑤ 維運 / 告警 Agent ★(與 Coolify 直接關聯)
- **觸發**:Coolify webhook、Seq log 異常、Dashboard metric 越界。
- **責任**:把告警自動分類、找出可能原因、@ 對應 owner。
- **輸出**:告警通知(Slack / Mail / Coolify 後台註記)。
- **★ Coolify 合規重點**:這個 Agent 必須能讀 Coolify 的 webhook,且自身告警鏈不可中斷(對應附件第 4 條可觀測性)。

### ⑥ 主管報告 Agent
- **觸發**:每週 / 每月排程。
- **責任**:把上述 5 個 Agent 的產出彙整成主管摘要(對應「現在可落地用途」第 4 項)。
- **輸出**:Markdown / Gamma 報表。

---

## 五、與 Coolify Deploy 的關聯

U3 在 Coolify 上是「**6 個 worker 容器 + 1 個 leader 容器**」,合規重點:

| 條目 | 與 U3 的關聯 |
| --- | --- |
| 1. 容器與映像 | 每個 Agent 一個 image,共用 base image 減少體積 |
| 2. Secret 管理 | LLM API key、MCP token 透過 Coolify env 注入,不入 image |
| 3. 權限與隔離 | Tool Gateway 必須在 Sandbox 內執行,不可給 Agent root 權限 |
| 4. 可觀測性 ★ | **維運/告警 Agent 是這條合規的對接者** — 自身要 health check + Trace ID |
| 5. CI/CD | Agent Prompt 改動視同 code 改動,走 Repo → Coolify 流程 |
| 6. Audit Trail | Leader Agent 所有派工紀錄必須寫入 Audit(供 Agentic Engineer 審查) |

完整定義見 [Coolify-Compliance-Mapping.md](Coolify-Compliance-Mapping.md)。

---

## 六、自我檢核

通過這 7 題即視為 U3 完成:

1. 為什麼不能直接讓 6 個 Agent 各自呼 LLM,要走 Tool Gateway?(提示:配額 / 審計)
2. Shared Memory 寫衝突怎麼處理?Leader Agent 的角色是什麼?
3. 對照「現在可落地用途」5 項,各對應到上面 6 種 Agent 中的哪幾個?
4. 維運/告警 Agent 與 Coolify webhook 的串接點在哪?failure mode 是什麼(告警 Agent 自己掛了怎麼辦)?
5. 設計 Review Agent 跟人類 reviewer 的職責怎麼切?(提示:Agent 抓格式違規,人抓商業邏輯)
6. 在公司現況下,以上 6 種 Agent **目前已落地哪幾個、缺哪幾個**?
7. 列出 Leader Agent 自己出錯時(例:派錯工)的偵測機制。

---

## 七、延伸閱讀

- [U4 Harness Engineering](U4-Harness-Engineering.md) — Tool Gateway / Sandbox / Memory 的實作層。
- 架構圖右上「**現在可落地的用途**」5 項 — 6 種 Agent 的具象產物。
- [`scan-project-v1.0.md`](../../Development/Project/scan/scan-project-v1.0.md) — 設計 Review Agent 的規則庫雛形。
