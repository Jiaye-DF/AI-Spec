# U5 — 基礎資源 / 系統

> 對應架構圖第 ⑤ 格(最下層)。
> 學習時間:45 ~ 60 分鐘。
> 必修角色:**新人 / 一般工程師 ✅深**;DevOps ✅深★;ML / Data ✅深;其他 ✅淺。
> 上層銜接:[U4 Harness Engineering](U4-Harness-Engineering.md)、[U4.5 Flywheel](U4.5-Domain-Model-Flywheel.md);
> 對應目標:整個系統的「物質基礎」 — 沒有這層,上面 4 層都是空談。

---

## 一、單元目標

學完這個單元,你應該能回答:

1. 6 個基礎資源各是什麼,公司分別放在哪裡?
2. 哪幾個會被 Coolify 直接「看見」(掛上去 / 連動)?
3. 新專案啟動時,需要先從哪些基礎資源「申請存取」?

---

## 二、圖中對應內容

```
┌──────────────────────────────────────────────────────────────┐
│  ⑤ 基礎資源 / 系統                                            │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                     │
│  │ LLM /    │ │ Repo /   │ │ PLM /    │                     │
│  │ Coding   │ │ Code     │ │ BOM      │                     │
│  │ Model    │ │          │ │          │                     │
│  └──────────┘ └──────────┘ └──────────┘                     │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                     │
│  │ Test     │ │ SOP /    │ │Dashboard/│                     │
│  │ Logs     │ │ 規格文件 │ │ Metrics  │                     │
│  └──────────┘ └──────────┘ └──────────┘                     │
└──────────────────────────────────────────────────────────────┘
```

---

## 三、6 個基礎資源詳解

### 3.1 LLM / Coding Model
- **公司目前**:Claude(主力)、GPT(備援)、本地 Ollama(實驗用)。
- **接入點**:由 U4 Tools/MCP 統一收口,**不可由 Agent 直呼**。
- **Coolify 關聯**:API key 由 Coolify env 注入,計費透過 LLM Gateway 集中。
- **誰要深學**:Tech Lead、ML、DevOps。

### 3.2 Repo / Code ★(與 Coolify 直接連動)
- **公司目前**:GitHub / GitLab(視專案)。
- **角色**:儲存所有 Prompts、Spec、`docker-compose.yml`、CI 設定 — **整個 Harness 的事實來源**。
- **Coolify 關聯 ★**:Coolify 監聽 push event → auto deploy。對應附件第 5 條 CI/CD。
- **誰要深學**:全員;DevOps 必過。

### 3.3 PLM / BOM
- **公司目前**:見 [`DataFlow v1.0`](../20260421-DataFlow-v1.0.md)「企業中央資料中心」。
- **角色**:工程資料來源,給「品質/NPI Agent」(U3) 與飛輪 ① 公司資料(U4.5)使用。
- **Coolify 關聯**:Agent 容器透過內網 API 讀,不可走公網。
- **誰要深學**:PM、ML、品保。

### 3.4 Test Logs
- **公司目前**:CI 系統的 raw log + 結構化 log(進 Seq)。
- **角色**:給「測試/驗證 Agent」(U3) 做 Triage、給飛輪 ④ Trajectory(U4.5)當原料。
- **Coolify 關聯**:Coolify 內 service log 也屬於 Test Logs 範疇,需 stdout 結構化。
- **誰要深學**:QA、DevOps。

### 3.5 SOP / 規格文件
- **公司目前**:這個 AI-Spec 倉庫(你正在讀的這份),加上業務部門各自的 SOP。
- **角色**:Agent 的「外部記憶」(U4.3) — RAG 索引的主要來源。
- **Coolify 關聯**:RAG 索引服務本身在 Coolify 上跑,定期從文件源同步。
- **誰要深學**:全員;PM 主筆。

### 3.6 Dashboard / Metrics ★(與 Coolify 直接連動)
- **公司目前**:Coolify 自帶 + Seq + 自建 Dashboard(視專案)。
- **角色**:U4.6 Observability 的可視化層;Agentic Engineer 的審查介面。
- **Coolify 關聯 ★**:metrics 透過 Coolify exporter 集中,Dashboard 直連。對應附件第 4 條可觀測性。
- **誰要深學**:DevOps、Tech Lead。

---

## 四、新專案啟動時要先申請的存取

依公司流程,新專案啟動時(對照 [`README.md`](../../README.md) 「使用方式」章節),需依序拿到:

1. **Repo 權限** — GitHub / GitLab 的 repo create + push。
2. **LLM Gateway token** — 走 U4 Tools/MCP,Coolify env 注入。
3. **資料中心唯讀帳號** — PLM / BOM / 員工資料(若需要)。
4. **Coolify 專案空間** — 由 DevOps 建立,綁定 Repo webhook。
5. **Seq 寫入 token** — 結構化 log 寫入。
6. **Dashboard 看板權限** — 視角色給予唯讀 / 編輯。

→ 沒拿到上述 6 項,後面 U1 ~ U4.5 都做不下去。

---

## 五、與 Coolify Deploy 的合規對照

| Coolify 合規通則 | 與 U5 的關聯 |
| --- | --- |
| 1. 容器與映像 | Repo(3.2)是 image build context;`Dockerfile` 必須在 repo 內 |
| 2. Secret 管理 | LLM token、Seq token、資料中心 token 全走 Coolify env,**不入 Repo** |
| 3. 權限與隔離 | PLM/BOM、Test Logs 走內網,Repo 設 branch protection |
| 4. 可觀測性 ★ | Test Logs(3.4) + Dashboard(3.6)是這條合規的兩個落腳點 |
| 5. CI/CD ★ | Repo(3.2)push → Coolify auto deploy 是這條合規的本體 |
| 6. Audit Trail | Repo commit history + Coolify deploy log + Dashboard 註記 = 完整 audit chain |

---

## 六、自我檢核

通過這 7 題即視為 U5 完成:

1. 6 個基礎資源中,哪 2 個跟 Coolify「直接連動」?(答:3.2 Repo + 3.6 Dashboard)
2. LLM 為什麼不可由 Agent 直呼,要走 Tools/MCP?(對照 U4.2)
3. PLM/BOM 為什麼必須走內網?(提示:資料邊界)
4. 新專案要先申請的 6 項存取,哪 1 項缺了會直接卡 Coolify 上線?(答:第 4 項 Coolify 專案空間)
5. 寫一份 `docker-compose.yml` 想拉 Seq token 進來,正確做法是?
6. SOP 文件更新後,Agent 怎麼「知道」?(提示:RAG 同步)
7. 給定一個新人入職,你給他 U5 的 reading list 與授權清單該怎麼開?

---

## 七、延伸閱讀

- [`README.md`](../../README.md) 「使用方式」章節 — 新專案啟動 SOP。
- [`DataFlow v1.0`](../20260421-DataFlow-v1.0.md) — PLM/BOM 在資料流中的位置。
- [`Docker-Compose-Spec-v1.2.md`](../../Coolify-Deploy/Docker-Compose-Spec-v1.2.md) — Repo 與 Coolify 的接線細節。
- [Coolify-Compliance-Mapping.md](Coolify-Compliance-Mapping.md) 第 4 + 第 5 條(★ U5 兩個直接連動點)。
