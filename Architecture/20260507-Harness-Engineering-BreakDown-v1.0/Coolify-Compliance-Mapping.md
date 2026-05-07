# Coolify Deploy 合規對照表(★ 上線前必過)

> 定位:把 6 條 Coolify 合規通則 × 6 個學習單元 × 對應現有規格文件,做成一張**可逐條打勾**的對照表。
> 適用:任何 Agent / AI 系統要上 Coolify 之前,Owner 必須完成本檔的 checklist。
> 公司前提:Coolify + Docker Compose 為主力部署平台,**無 K8s**;Serverless 僅限 GCP / AWS(模型訓練用,非主力)。
> 互補文件:[`Docker-Compose-Spec-v1.2.md`](../../Coolify-Deploy/Docker-Compose-Spec-v1.2.md)、[`spec/00-overview-v1.0.md`](../../Development/Project/spec/00-overview-v1.0.md)、[`scan-project-v1.0.md`](../../Development/Project/scan/scan-project-v1.0.md)。

---

## 一、6 條 Coolify 合規通則(完整定義)

### 第 1 條 — 容器與映像

**規則**

1. `Dockerfile` 必須多階段(builder + runtime),runtime image 不含建置工具。
2. Image tag **禁止 `latest`**,必須是 `vX.Y.Z` 或 commit SHA。
3. Container 根目錄必須 read-only(`read_only: true`),可寫區走 `tmpfs:` 或具名 volume。
4. Image 大小 ≤ 1.5 GB(含 LoRA weights ≤ 3 GB)。

**對應單元**:[U4.3 Memory](U4-Harness-Engineering.md)、[U4.4 Sandbox](U4-Harness-Engineering.md)、[U5.2 Repo](U5-Foundation-Resources.md)、[U4.5 Flywheel ⑥](U4.5-Domain-Model-Flywheel.md)。

**違規範例**

```yaml
# ✗ 違規
image: my-agent:latest
# Container 預設可寫入根目錄,沒設 read_only

# ✓ 合規
image: my-agent:v1.3.2
read_only: true
tmpfs:
  - /tmp
volumes:
  - agent-cache:/var/cache/agent
```

**檢查方式**:`docker image ls`、`docker inspect`、Coolify deploy log。

---

### 第 2 條 — Secret 管理

**規則**

1. `.env.example` 只放佔位(`API_KEY=your-key-here`),且 commit 進 Repo。
2. `.env`(本地實際值)必須 gitignore,**禁止 commit**。
3. 線上實際值由 Coolify 後台環境變數覆蓋。
4. 前端 build-time 變數(`VITE_*`、`NEXT_PUBLIC_*`)走 Coolify build args,**不走 runtime env**。
5. Token / Key 一律不入 image layer。

**對應單元**:[U4.1 Prompts](U4-Harness-Engineering.md)、[U4.2 Tools/MCP](U4-Harness-Engineering.md)、[U5.1 LLM](U5-Foundation-Resources.md)、[U5.4 Test Logs(Seq token)](U5-Foundation-Resources.md)。
**對應現有規範**:[`spec/00-overview-v1.0.md`](../../Development/Project/spec/00-overview-v1.0.md) 五大原則 §5。

**違規範例**

```dockerfile
# ✗ 違規 — token 寫死在 image
ENV ANTHROPIC_API_KEY=sk-ant-xxx

# ✓ 合規 — 由 Coolify env 注入,Dockerfile 不寫
# (留空,Coolify 後台填值)
```

**檢查方式**:`/scan-project` 規則庫;Repo 內 grep `sk-`、`AKIA`、`xoxb-` 等已知 token 前綴。

---

### 第 3 條 — 權限與隔離 ★

**規則**

1. Container 必須以非 root 執行(`user: "1000:1000"`)。
2. Capabilities drop 全部(`cap_drop: [ALL]`),只 add 必要項。
3. Agent 容器禁止 `privileged: true`、禁止掛 `/var/run/docker.sock`。
4. MCP 工具白名單必須在 Spec 內明列,新增需經 Agentic Engineer 簽核。
5. Sandbox 內檔案系統 read-only,可寫區僅限 `tmpfs` 與指定 volume。
6. Agent 容器網路只能走內網(Coolify network),對外請求走 Tool Gateway。

**對應單元**:[U4.4 Sandbox](U4-Harness-Engineering.md) ★、[U4.7 Hooks/Guardrails](U4-Harness-Engineering.md)、[U3 Tool Gateway](U3-Agentic-Engineering.md)。

**違規範例**

```yaml
# ✗ 違規
services:
  agent:
    privileged: true
    user: "0:0"  # root
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock  # 等於給 host root

# ✓ 合規
services:
  agent:
    user: "1000:1000"
    read_only: true
    cap_drop: [ALL]
    cap_add: [NET_BIND_SERVICE]  # 僅在需要綁 < 1024 port 時
    security_opt:
      - no-new-privileges:true
    networks:
      - internal
```

**檢查方式**:`/scan-project` 規則庫;Coolify deploy 前 lint。

---

### 第 4 條 — 可觀測性

**規則**

1. 所有 log 走 **stdout 結構化(JSON)**,禁止寫入 container file 系統。
2. 每個 request 必須帶 **Trace ID**,跨 Agent 透過 header 串聯。
3. 業務 metric(Agent 執行時間、Token 用量、成功率)外送 Seq + Dashboard。
4. 容器必須提供 `/health` 健康檢查端點,Coolify 用以判斷 deploy 成功。
5. 維運 / 告警 Agent 自身要有獨立的健康檢查機制(避免「告警系統自己掛了沒人知道」)。

**對應單元**:[U4.6 Logs/Traces](U4-Harness-Engineering.md) ★、[U3 維運/告警 Agent](U3-Agentic-Engineering.md)、[U5.4 Test Logs](U5-Foundation-Resources.md)、[U5.6 Dashboard](U5-Foundation-Resources.md)。
**對應現有規範**:[`Docker-Compose-Spec-v1.2.md`](../../Coolify-Deploy/Docker-Compose-Spec-v1.2.md) Seq 相關章節。

**違規範例**

```python
# ✗ 違規 — 寫 file log
logging.basicConfig(filename='/var/log/agent.log')

# ✓ 合規 — 走 stdout + JSON + Trace ID
import json, sys, uuid
trace_id = request.headers.get('X-Trace-Id', str(uuid.uuid4()))
print(json.dumps({
    'level': 'info',
    'trace_id': trace_id,
    'agent': 'review-agent',
    'event': 'tool_call',
    'tool': 'github_pr_diff',
    'duration_ms': 1234,
}), file=sys.stdout, flush=True)
```

**檢查方式**:Coolify log stream;`/scan-project` 規則庫(file logging 偵測)。

---

### 第 5 條 — CI/CD 與 Webhook ★

**規則**

1. 任何變動必須經 PR review;**禁止直接 push 到 `main`**(branch protection)。
2. Push 至 `main` 觸發 Coolify webhook,自動 build + deploy。
3. **Prompt 變動視同 code 變動**,走相同流程,禁止 Coolify 後台線上熱改 Prompt。
4. CI 必過項:`/scan-project`(必過)、Eval suite(若該服務有 U4.5 Evals)、單元測試。
5. Deploy 失敗必須 rollback 到上一個成功 image,不可留半成品。
6. 健康檢查不過 → Coolify 自動回滾。

**對應單元**:[U4.1 Prompts](U4-Harness-Engineering.md)、[U4.5 Tests/CI](U4-Harness-Engineering.md)、[U5.2 Repo](U5-Foundation-Resources.md) ★、[U2 Agentic Engineer](U2-Agentic-Engineer-Role.md)(簽核者)。

**違規範例**

- ✗ 在 Coolify 後台直接改 Prompt env var 試試看 → 沒 audit、無法回滾。
- ✓ 改 Repo 內 `prompts/review-agent.md` → PR → review → merge → Coolify auto deploy。

**檢查方式**:Repo branch protection 設定;Coolify webhook log;Audit Trail。

---

### 第 6 條 — Audit Trail ★

**規則**

1. Repo commit history(誰改了 Prompt / Spec / Compose)永久保留。
2. Coolify deploy log(誰簽核、誰部署、何時、結果)retention ≥ 1 年。
3. Agent 執行 Audit log(誰呼叫了 Agent、輸入、輸出、用了哪些工具)寫入獨立 DB,retention ≥ 1 年。
4. Model 版本切換必須記錄:版本號、訓練資料來源、Eval 結果、簽核者。
5. Audit DB 與業務 DB 必須**分庫**(避免 PII 混雜)。
6. Audit log 唯讀,禁止刪除或修改;若需修正,寫補正紀錄。

**對應單元**:[U4.8 Audit Trail](U4-Harness-Engineering.md) ★、[U2 Agentic Engineer](U2-Agentic-Engineer-Role.md)(簽核者)、[U4.5 Flywheel ⑥](U4.5-Domain-Model-Flywheel.md)、[U5.2 Repo](U5-Foundation-Resources.md)。

**違規範例**

- ✗ Audit log 與業務 DB 同庫,且業務 owner 有 DELETE 權 → 等於沒 audit。
- ✗ Coolify 後台改 env 沒留紀錄 → 出事找不到責任人。
- ✓ 獨立 audit DB + 唯讀帳號 + Coolify deploy 強制簽核欄位。

**檢查方式**:DB 權限稽核;Coolify deploy log 抽查;Repo commit log。

---

## 二、上線前合規 Checklist(影印用)

新專案 / 新 Agent 上 Coolify 前,Owner(通常是 Backend / DevOps)逐條打勾:

```
□ 第 1 條 容器與映像
  □ Dockerfile 多階段
  □ Image tag 非 latest
  □ read_only: true + tmpfs/volume 規劃
  □ Image 大小符合上限

□ 第 2 條 Secret 管理
  □ .env.example commit 且只放佔位
  □ .env 已 gitignore
  □ Coolify 後台 env 已填齊
  □ build-time var 走 build args
  □ grep 過已知 token 前綴

□ 第 3 條 權限與隔離
  □ user 非 root
  □ cap_drop: [ALL] + 必要 cap_add
  □ 無 privileged / docker.sock 掛載
  □ MCP 白名單寫進 Spec
  □ Sandbox read_only + tmpfs
  □ 網路走 internal

□ 第 4 條 可觀測性
  □ stdout JSON log
  □ Trace ID 跨 Agent 串聯
  □ metric 外送 Seq + Dashboard
  □ /health 端點
  □ 告警 Agent 自身 health check

□ 第 5 條 CI/CD
  □ main branch protection 開啟
  □ Coolify webhook 已綁
  □ Prompt 變動走 PR(無線上熱改)
  □ /scan-project 已過
  □ Eval suite 已過(若適用)
  □ Rollback 機制驗證過

□ 第 6 條 Audit Trail
  □ Repo commit history 啟用 + 不可 force push
  □ Coolify deploy log retention 設定
  □ Agent 執行 audit DB 已建,獨立於業務 DB
  □ Model 版本紀錄欄位齊全
  □ Audit DB 唯讀帳號驗證
```

---

## 三、PM 簽核項(PM 在規格簽核時要看的)

PM 不需懂技術細節,但簽 Spec 時要確認:

1. **業務情境合理**(對應 U1):這個 Agent 解的是哪個痛點?
2. **Owner 明確**(對應 U2):誰是 Agentic Engineer?誰簽 deploy?
3. **失敗處理**(對應 U3 維運/告警 Agent):告警誰收?多久回?
4. **資料邊界**(對應 U5.3 PLM/BOM、U4.8 Audit):會碰哪些公司資料?有 PII 嗎?
5. **上線節奏**(對應 SLA):多久部署一次?可不可線上熱改?(答:Prompt 不可)

---

## 四、Tech Lead 自我檢核 20 題

通過 ≥ 16 題視為 Tech Lead 合規能力達標:

1. 解釋 `Agent = Model + Harness`,並說明 8 個 Harness 元件對應 6 條合規的哪幾條。
2. 為什麼 Prompt 改動視同 code 變動?
3. Sandbox 4 個關鍵欄位是哪 4 個?
4. Trace ID 的具體傳遞機制(header name)?
5. Audit DB 為何分庫?retention 多久?
6. 維運/告警 Agent 自己掛了怎麼辦?
7. LoRA / Fine-tuning 為什麼不在 Coolify 跑?
8. 新增 MCP 工具的簽核流程?
9. `.env` / `.env.example` / Coolify 後台三者分工?
10. Coolify webhook 與 main branch 的關係?
11. 為什麼 image tag 不可用 `latest`?
12. 健康檢查端點失敗時 Coolify 行為?
13. Tool Gateway 與 Sandbox 的職責切分?
14. 飛輪 6 個元件跳過任一個的後果?
15. PM 簽核時要確認哪 5 件事?
16. 公司資料中心(DataFlow v1.0)與 Agent 的接線方式?
17. RAG 索引服務從哪些 SOP 來源同步?
18. Eval 集太小會發生什麼?
19. 給定一個 Agent 老 hallucinate,你的排查順序?(Prompt → Memory → Model → Tool)
20. Coolify 合規 6 條,哪 3 條最容易被忽略?(★ 標示者:第 3、4、6 條)

---

## 五、版本紀錄

- **v1.0(2026-05-07)** — 首版,基於當前 Coolify + Docker Compose 環境。
- 後續變更必須同步更新 [README.md](README.md) 第四節摘要與對應單元的 Coolify 章節。
