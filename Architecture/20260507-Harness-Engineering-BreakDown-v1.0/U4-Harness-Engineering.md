# U4 — Harness Engineering(下層執行底座)★ 主要 Coolify 合規層

> 對應架構圖第 ④ 格(中下藍色大區塊)。
> 學習時間:2 ~ 3 小時。
> 必修角色:**Tech Lead / Backend / DevOps ✅深★**;QA ✅深(CI/Tests 部分);其他 ✅淺。
> 上層銜接:[U3 Agentic Engineering](U3-Agentic-Engineering.md);
> 衍伸:[U4.5 Domain Model Flywheel](U4.5-Domain-Model-Flywheel.md);
> 對照:[Coolify-Compliance-Mapping.md](Coolify-Compliance-Mapping.md)(★ 必讀)。

---

## 一、單元目標

學完這個單元,你應該能回答:

1. 為什麼說 **Agent = Model + Harness**?如果只給 Model 不給 Harness,會缺什麼?
2. 8 個 Harness 元件各自解決什麼問題?哪幾個是 Coolify 合規的核心命脈?
3. 在公司現況(Coolify + Docker Compose、無 K8s)下,8 個元件分別用什麼工具實作?

---

## 二、圖中對應內容

```
┌────────────────────────────────────────────────────────────────┐
│  Harness Engineering(下層執行底座)                            │
│  共通 Agent 可控、可觀察、可治理                                │
│                                                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐  │
│  │ Prompts /   │ │ Tools /     │ │ 文件 / 知識 │ │ Sandbox /│  │
│  │ Spec        │ │ MCP / API   │ │ / Memory    │ │ 權限授權 │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘  │
│                                                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐  │
│  │ Verification│ │ Logs/Traces/│ │ Middleware/ │ │ 風險/落為│  │
│  │ / Tests/ CI │ │ Observability│ │Hooks/Guard │ │/Audit Trl│  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘  │
│                                                                │
│  Agent = Model + Harness                                       │
│  Harness 是承載 Agent 的 runtime 與 control substrate          │
└────────────────────────────────────────────────────────────────┘
```

---

## 三、為什麼 Agent = Model + Harness

只給 Model(LLM API 直呼)會缺:

- **沒有可重複執行的 Prompt 版本** → 結果不可重現。
- **沒有工具邊界** → Agent 想呼什麼就呼什麼,費用爆炸、權限失控。
- **沒有 Memory** → 每次都從零開始,無法累積 Context。
- **沒有 Sandbox** → Agent 跑 shell 會炸壞主機。
- **沒有 Tests/CI** → 改 Prompt 後沒人知道有沒有壞掉。
- **沒有 Logs/Traces** → 出錯沒人知道為什麼。
- **沒有 Hooks/Guardrails** → 沒辦法在運行中做安全檢查與風控。
- **沒有 Audit Trail** → 出事追不到責任歸屬。

→ **Harness 就是把上面 8 件事系統化的底座**。任何 Agent 上 Coolify,8 件都不能缺。

---

## 四、8 元件詳解

### 4.1 Prompts / Spec
- **作用**:Agent 的「程式碼」,以結構化文件版本管理。
- **公司實作**:存 Repo,走 Git PR review,**禁止線上熱改**。
- **Coolify 合規(★ 第 5 條)**:Prompt 變動 = code 變動,走 push → Coolify auto deploy 流程。

### 4.2 Tools / MCP / API
- **作用**:Agent 對外能呼的工具集(MCP server、REST API、DB query)。
- **公司實作**:走 Tool Gateway(U3)統一收口,Coolify env 注入 token。
- **Coolify 合規(★ 第 2 + 第 3 條)**:Token 不入 image、工具白名單寫在 Spec、不在 image 內。

### 4.3 文件 / 知識 / Memory
- **作用**:Agent 的長短期記憶 — Spec、SOP、PLM、過往執行 trace。
- **公司實作**:短期 Memory 走 Redis(Coolify 同 stack 起);長期知識走 RAG(對接 [`DataFlow`](../20260421-DataFlow-v1.0.md) 的 AI RAG 知識庫)。
- **Coolify 合規(★ 第 1 條)**:Redis volume 必須持久化、不可寫入 container 根目錄。

### 4.4 Sandbox / 權限授權 ★
- **作用**:限制 Agent 能做什麼:檔案系統 / 網路 / shell。
- **公司實作**:Docker user namespace(non-root)、檔案系統 read-only mount、網路只開內網。
- **Coolify 合規(★ 第 3 條)**:**這是 6 條合規中最容易踩雷的一條**。Docker compose 必須 `user:` 指定非 root、`read_only: true`、`tmpfs:` 限定可寫區。

### 4.5 Verification / Tests / CI
- **作用**:Prompt / Agent 改動後的回歸測試。
- **公司實作**:CI 跑 [`scan-project-v1.0.md`](../../Development/Project/scan/scan-project-v1.0.md) + Eval suite(走 U4.5 飛輪)。
- **Coolify 合規(★ 第 5 條)**:CI 不過 → Coolify 不部署;`/scan-project` 是必過項。

### 4.6 Logs / Traces / Observability ★
- **作用**:Agent 跑了什麼、花多久、結果如何。
- **公司實作**:結構化 stdout → Coolify → Seq(對應 [`DataFlow`](../20260421-DataFlow-v1.0.md))。每個 request 有 Trace ID。
- **Coolify 合規(★ 第 4 條)**:必須走 stdout(Coolify 才看得到),不可寫 file log;Trace ID 必須跨 Agent 串聯。

### 4.7 Middleware / Hooks / Guardrails
- **作用**:在每個工具呼叫 / LLM 回應前後做檢查 — PII 過濾、Token 限制、Rate limit。
- **公司實作**:Tool Gateway 內建 hook chain;Guardrails 設定走 Spec(同 4.1)。
- **Coolify 合規(★ 第 3 條)**:任何放寬 Guardrails 的變動,需走 PR + Agentic Engineer 簽核。

### 4.8 風險 / 落為 / Audit Trail ★
- **作用**:誰在什麼時候、為什麼跑了什麼、簽核了什麼。
- **公司實作**:Audit log 寫進獨立資料庫(不可與業務 DB 同庫),retention ≥ 1 年。
- **Coolify 合規(★ 第 6 條)**:**這是合規鑑定的關鍵證據**;沒 Audit Trail 等於沒上線資格。

---

## 五、與 Coolify Deploy 的合規對照(摘要)

| Coolify 合規通則 | 主要落在 8 元件的哪幾個 |
| --- | --- |
| 1. 容器與映像 | 4.3 Memory(Volume)、4.4 Sandbox(non-root) |
| 2. Secret 管理 | 4.2 Tools/MCP(Token)、4.1 Prompts(不內嵌 secret) |
| 3. 權限與隔離 ★ | 4.4 Sandbox、4.7 Hooks/Guardrails |
| 4. 可觀測性 | 4.6 Logs/Traces |
| 5. CI/CD | 4.1 Prompts(視同 code)、4.5 Tests/CI |
| 6. Audit Trail ★ | 4.8 Audit Trail |

→ **U4 是 Coolify 合規的核心戰場**。完整條目見 [Coolify-Compliance-Mapping.md](Coolify-Compliance-Mapping.md)。

---

## 六、與 Docker-Compose-Spec 的對應

公司 Coolify 用 Docker Compose,新建 Agent 服務時,`docker-compose.yml` 必須對齊 [`Docker-Compose-Spec-v1.2.md`](../../Coolify-Deploy/Docker-Compose-Spec-v1.2.md)。本單元 8 元件分別會落到 compose 檔的這些區塊:

| Harness 元件 | docker-compose.yml 區塊 |
| --- | --- |
| 4.1 Prompts | image tag(版本綁定)、healthcheck |
| 4.2 Tools/MCP | environment(Coolify env 注入)、networks |
| 4.3 Memory | volumes(持久化)、depends_on(Redis) |
| 4.4 Sandbox | user, read_only, tmpfs, cap_drop, security_opt |
| 4.5 Tests/CI | (在 CI 端,non-compose;但 image build 必須過 CI) |
| 4.6 Logs | logging driver(json-file 或 stdout) |
| 4.7 Guardrails | environment(限額參數) |
| 4.8 Audit | volumes(audit log 獨立 volume)、networks(獨立) |

---

## 七、自我檢核

通過這 10 題即視為 U4 完成(Tech Lead / DevOps 必過):

1. 解釋 `Agent = Model + Harness`,如果只給 Model 不給 Harness,8 件事中你最先補哪一件?
2. 為什麼 Prompt 改動要視同 code,走 PR 流程?
3. Sandbox 在 docker-compose.yml 裡至少要設哪 4 個欄位?
4. Trace ID 必須跨 Agent 串聯,具體做法是什麼?(提示:Header 傳遞)
5. Audit log 為什麼要與業務 DB 分庫?
6. 公司現況下,4.6 Logs/Observability 走 Seq 的接線方式是什麼?
7. Guardrails 被放寬,需要哪些人的簽核?(對照 U2)
8. 4.5 Tests/CI 的 Eval suite 從哪裡來?(提示:U4.5 飛輪)
9. 給定一個新 MCP 工具要上線,你的 6 個合規項各做哪些檢查?
10. 在 [`Docker-Compose-Spec-v1.2.md`](../../Coolify-Deploy/Docker-Compose-Spec-v1.2.md) 中找出對應到本單元 4.4 Sandbox 的具體欄位範例。

---

## 八、延伸閱讀

- [U4.5 Domain Model Flywheel](U4.5-Domain-Model-Flywheel.md) — Eval / Reward / Trajectory 的延伸學習能力。
- [Coolify-Compliance-Mapping.md](Coolify-Compliance-Mapping.md) ★ — 6 條合規的完整對照與 checklist。
- [`Docker-Compose-Spec-v1.2.md`](../../Coolify-Deploy/Docker-Compose-Spec-v1.2.md) — 落實本單元的部署規格。
- [`spec/00-overview-v1.0.md`](../../Development/Project/spec/00-overview-v1.0.md) 五大原則 §5(環境變數三階段)— 對應 4.2 Secret。
