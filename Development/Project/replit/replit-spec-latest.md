
## 📋 提示詞內容

```
我需要在 Replit 平台上開發一個手機優先的 RWD Web App。

【專案開發模式】
- Plan 模式：規劃專案架構、分析需求、建立文檔
- Build 模式：依據規格文件進行開發實作

【必須遵循的開發規則】

1. **程式碼品質**
   - 所有程式碼必須包含函式級註解（說明用途、參數、回傳值）
   - 註解使用繁體中文撰寫

2. **Plan 模式要求**
   - 完成所有子任務後，將完成報告記錄至 report.md
   - 需包含：任務描述、完成時間、遇到的問題、解決方案

3. **規格文件要求**
   - Plan 模式結束時產生 spec.md（技術規格文件）
   - Plan 模式結束時產生 todolist.md（任務清單）
   - spec.md 必須包含：
     * 系統流程圖 (Flow Chart)
     * 循序圖 (Sequence Diagram)
     * 類別圖/物件關聯圖 (Class/ER Diagram)
     * 資料庫 ERD（若使用資料庫）
     * API 規格定義
     * 資料結構設計
     * 模組架構說明

4. **Build 模式要求**
   - 嚴格遵循 spec.md 進行開發
   - 每次修改程式前必須確認 spec.md 的相關規格
   - 每完成一個任務後更新 todolist.md 的進度狀態

5. **專案完成文檔**
   - 撰寫完整的 README.md，必須包含：
     * 專案描述與目標
     * 完整檔案結構樹狀圖
     * 使用的技術棧清單
     * 資料庫設定說明（若使用資料庫）
     * 所有檔案清單與簡短說明
     * 安裝步驟
     * 執行方式
     * 環境需求

6. **版本控制**
   - 每個重要任務完成後建立 checkpoint
   - checkpoint 訊息必須有意義且描述清楚（例如：「✅ 完成用戶登入功能與 JWT 驗證」）

7. **語言要求**
   - 所有對話、文檔、註解皆使用繁體中文

【環境配置要求】

1. **環境變數設定**
   - 建立 `.env.development` （開發/測試環境）
   - 建立 `.env.production` （正式環境）
   - 必須包含環境變數：`CONTEXT_PATH`
     * 測試環境：`CONTEXT_PATH=/`
     * 正式環境：`CONTEXT_PATH=/foo/bar`（固定值）
   - 所有路由、資源路徑都必須使用 `CONTEXT_PATH` 前綴

2. **資料庫配置（若專案需要資料庫）**
   - **統一使用 PostgreSQL 作為資料庫**
   - 環境變數必須包含：
     * `DATABASE_URL` - PostgreSQL 連線字串
     * `DB_HOST` - 資料庫主機位址
     * `DB_PORT` - 資料庫端口（預設 5432）
     * `DB_NAME` - 資料庫名稱
     * `DB_USER` - 資料庫使用者
     * `DB_PASSWORD` - 資料庫密碼
   - 建立資料庫遷移檔案目錄：`/migrations` 或 `/prisma/migrations`
   - 建立資料庫初始化腳本：`db/init.sql`
   - 建立資料庫種子資料腳本：`db/seed.sql`（可選）

3. **package.json Scripts 配置**
   必須包含以下 scripts：
   - `dev` - 開發模式（使用 .env.development）
   - `dev:production` - 正式環境開發模式（使用 .env.production）
   - `build` - 建置測試環境
   - `build:production` - 建置正式環境
   - `preview` - 預覽建置結果
   
   若使用資料庫，額外包含：
   - `db:migrate` - 執行資料庫遷移
   - `db:seed` - 建立種子資料
   - `db:reset` - 重置資料庫

4. **AI 協作文檔**
   - 建立 `replit.md` - Replit AI 專用的開發指引文件
   - 建立 `.github/copilot-instructions.md` - GitHub Copilot 指引文件
   - 兩份文件都需包含：
     * 專案架構說明
     * 程式碼風格規範
     * 環境變數使用說明
     * 資料庫設定說明（若使用）
     * 常用開發指令
     * 重要開發注意事項

【必要專案文檔結構】

📁 專案根目錄/
├── 📄 README.md - 專案說明與使用指南
├── 📄 spec.md - 技術規格文件（含 UML 圖表）
├── 📄 report.md - 開發過程記錄與任務報告
├── 📄 todolist.md - 任務清單與進度追蹤
├── 📄 replit.md - Replit AI 開發指引
├── 📄 .env.development - 測試環境變數
├── 📄 .env.production - 正式環境變數
├── 📄 .env.example - 環境變數範例檔
├── 📁 .github/
│   └── 📄 copilot-instructions.md - GitHub Copilot 指引
├── 📁 db/ （若使用資料庫）
│   ├── 📄 init.sql - 資料庫初始化腳本
│   ├── 📄 seed.sql - 種子資料腳本
│   └── 📄 schema.sql - 資料表結構定義
├── 📁 migrations/ （若使用 ORM）
│   └── 📄 [timestamp]_[description].sql
└── 📁 src/ - 原始碼目錄

【資料庫設計規範】（若使用資料庫）

1. **PostgreSQL 版本**
   - 使用 PostgreSQL 14 或以上版本
   - 在 README.md 中明確標示所需版本

2. **資料表命名規則**
   - 使用小寫英文和底線（snake_case）
   - 複數形式命名（例如：users, products, orders）
   - 避免使用保留字

3. **欄位命名規則**
   - 使用小寫英文和底線（snake_case）
   - 主鍵統一命名為 `id`
   - 外鍵命名為 `[table_name]_id`（例如：user_id）
   - 時間戳記欄位：`created_at`, `updated_at`

4. **必要欄位**
   每個資料表都應包含：
   - `id` - 主鍵（SERIAL PRIMARY KEY 或 UUID）
   - `created_at` - 建立時間（TIMESTAMP DEFAULT CURRENT_TIMESTAMP）
   - `updated_at` - 更新時間（TIMESTAMP DEFAULT CURRENT_TIMESTAMP）

5. **資料庫文檔**
   - 在 spec.md 中繪製完整的 ERD（Entity Relationship Diagram）
   - 列出所有資料表的欄位說明
   - 說明資料表之間的關聯關係
   - 列出所有索引和約束條件

【RWD 設計要求】
- 採用 Mobile First 設計策略
- 斷點設定：手機 (<768px)、平板 (768px-1024px)、桌機 (>1024px)
- 確保觸控友善的互動設計
- 優化手機載入速度

【使用者需求收集規則】
在詢問使用者需求時，請遵循以下原則：
1. **使用數字選項**：所有選項都用數字編號，方便使用者直接輸入數字快速回答
2. **避免使用專業術語**：用日常用語說明選項
3. **提供具體範例**：讓使用者容易理解每個選項的意思
4. **明確標示預設值**：若使用者無法決定或未回答，使用預設值
5. **逐步引導**：一次詢問一個問題，不要一次問太多

【需求詢問流程】

請按照以下順序向使用者提問（使用白話文，數字選項，並標示預設值）：

**問題 1：網站類型**
「請問您想做什麼類型的網站？請輸入數字選擇：

1. 一頁式宣傳網站（像是公司介紹、活動宣傳）【預設值】
2. 純展示網站（資料都寫在網頁裡，不用儲存）
3. 有資料儲存功能的網站（資料存在瀏覽器，關掉不會消失）
4. 完整的網站系統（有管理後台可以新增修改資料）

請輸入 1-4 的數字，或直接按 Enter 使用預設值 [1]

【技術說明】
- 選項 1-2：不需要資料庫
- 選項 3：使用瀏覽器儲存（LocalStorage）
- 選項 4：使用 PostgreSQL 資料庫（系統預設）」

**問題 2：主要用途**
「請簡單描述這個網站的主要用途？

常見類型：
1. 公司形象網站
2. 個人作品集
3. 活動宣傳頁面
4. 產品介紹網站
5. 餐廳/店家介紹
6. 其他（請自行描述）

請輸入數字 1-6，或直接描述您的需求
（例如：「介紹我的咖啡店」或「展示我的攝影作品」）

如直接按 Enter，將使用「公司/個人形象展示網站」【預設值】」

**問題 3：需要的功能**
「請問需要哪些功能？（可以輸入多個數字，用逗號分隔，例如：1,3,4）

1. 圖片輪播/相簿
2. 聯絡表單
3. 地圖顯示
4. 社群媒體連結（FB、IG、LINE 等）
5. 影片播放
6. 產品/服務展示
7. 最新消息/部落格
8. 線上預約功能
9. 會員註冊/登入
10. 購物車功能

請輸入數字（可複選，例如：1,3,4），或直接按 Enter 使用預設功能
預設功能：基本的「首頁、關於我們、聯絡我們」三個區塊【預設值】

【技術說明】
- 選擇功能 9 或 10 時，將自動使用 PostgreSQL 資料庫」

**問題 4：視覺風格偏好**
「請問您喜歡什麼樣的視覺風格？請輸入數字選擇：

1. 簡約黑白風格（專業、現代感）
2. 活潑彩色風格（年輕、有活力）
3. 專業商務風格（穩重、信賴感）【預設值】
4. 溫馨暖色調（親切、溫暖）
5. 科技感風格（前衛、創新）
6. 其他（請描述您想要的顏色或風格）

請輸入數字 1-6，或直接按 Enter 使用預設值 [3]」

**收集完成後的確認**
「好的！讓我確認一下您的需求：

✅ 網站類型：[使用者選擇或預設值]
✅ 主要用途：[使用者描述或預設值]
✅ 主要功能：[使用者選擇或預設值]
✅ 視覺風格：[使用者選擇或預設值]

【系統設定】
✅ 正式環境網址路徑：/foo/bar（系統預設）
✅ 資料庫：[若選項 4 或功能包含 9/10] PostgreSQL（系統預設）
✅ 資料儲存：[若選項 3] 瀏覽器 LocalStorage

確認無誤後，我將進入 Plan 模式開始規劃專案架構。
如需修改，請告訴我要調整哪個項目（輸入 1-4 重新選擇該問題）」

請以 Plan 模式開始，先進行需求分析和架構規劃。
```

---

## 📦 PostgreSQL 配置範例

### 📄 `.env.development` 範例（含資料庫）

```env
# 開發/測試環境配置
CONTEXT_PATH=/
VITE_APP_TITLE=我的應用 (測試)
VITE_API_URL=http://localhost:3000/api
VITE_ENV=development

# PostgreSQL 資料庫配置
DATABASE_URL=postgresql://username:password@localhost:5432/myapp_dev
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp_dev
DB_USER=username
DB_PASSWORD=password
```

### 📄 `.env.production` 範例（含資料庫）

```env
# 正式環境配置
CONTEXT_PATH=/foo/bar
VITE_APP_TITLE=我的應用
VITE_API_URL=https://api.example.com
VITE_ENV=production

# PostgreSQL 資料庫配置
DATABASE_URL=postgresql://prod_user:prod_pass@db.example.com:5432/myapp_prod
DB_HOST=db.example.com
DB_PORT=5432
DB_NAME=myapp_prod
DB_USER=prod_user
DB_PASSWORD=prod_pass
```

### 📄 `.env.example` 範例（含資料庫）

```env
# 環境變數範例檔（請複製為 .env.development 或 .env.production）

# 應用程式設定
CONTEXT_PATH=/
VITE_APP_TITLE=應用名稱
VITE_API_URL=API 位址
VITE_ENV=development

# PostgreSQL 資料庫設定
DATABASE_URL=postgresql://username:password@host:5432/database_name
DB_HOST=localhost
DB_PORT=5432
DB_NAME=database_name
DB_USER=username
DB_PASSWORD=password
```

---

## 🗄️ PostgreSQL 資料庫設定

### 📝 db/init.sql 範例

```sql
-- 資料庫初始化腳本
-- 建立時間：[YYYY-MM-DD]
-- 說明：初始化資料表結構

-- 建立 users 資料表（使用者）
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- 建立更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 註解說明
COMMENT ON TABLE users IS '使用者資料表';
COMMENT ON COLUMN users.id IS '使用者 ID（主鍵）';
COMMENT ON COLUMN users.username IS '使用者名稱（唯一）';
COMMENT ON COLUMN users.email IS '電子郵件（唯一）';
COMMENT ON COLUMN users.password_hash IS '密碼雜湊值';
COMMENT ON COLUMN users.full_name IS '使用者全名';
COMMENT ON COLUMN users.is_active IS '帳號是否啟用';
COMMENT ON COLUMN users.created_at IS '建立時間';
COMMENT ON COLUMN users.updated_at IS '最後更新時間';
```

### 📝 db/seed.sql 範例

```sql
-- 種子資料腳本
-- 說明：建立測試用的初始資料

-- 插入測試使用者
INSERT INTO users (username, email, password_hash, full_name) VALUES
('admin', 'admin@example.com', '$2b$10$...', '系統管理員'),
('testuser', 'test@example.com', '$2b$10$...', '測試使用者')
ON CONFLICT (username) DO NOTHING;

-- 顯示結果
SELECT * FROM users;
```

---

## 📦 package.json Scripts 配置（含資料庫）

### 🟢 Node.js + Express + PostgreSQL

```json
{
  "name": "my-web-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "NODE_ENV=development nodemon server.js",
    "dev:production": "NODE_ENV=production nodemon server.js",
    "start": "NODE_ENV=production node server.js",
    "build": "echo 'No build step required for Node.js'",
    
    "db:migrate": "node scripts/migrate.js",
    "db:seed": "psql $DATABASE_URL -f db/seed.sql",
    "db:reset": "psql $DATABASE_URL -f db/init.sql && npm run db:seed",
    "db:create": "createdb $DB_NAME",
    "db:drop": "dropdb $DB_NAME"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.0",
    "dotenv": "^16.0.3",
    "bcrypt": "^5.1.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
```

### 🎨 Vite + Node.js API + PostgreSQL

```json
{
  "name": "my-web-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "vite --mode development",
    "dev:server": "NODE_ENV=development nodemon server/index.js",
    "dev:production": "vite --mode production",
    
    "build": "vite build --mode development",
    "build:production": "vite build --mode production",
    "preview": "vite preview",
    
    "db:migrate": "node scripts/migrate.js",
    "db:seed": "psql $DATABASE_URL -f db/seed.sql",
    "db:reset": "psql $DATABASE_URL -f db/init.sql && npm run db:seed"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.0",
    "dotenv": "^16.0.3"
  },
  "devDependencies": {
    "vite": "^4.3.9",
    "nodemon": "^2.0.22",
    "concurrently": "^8.0.1"
  }
}
```

---

## 🔌 PostgreSQL 連線範例

### Node.js (pg 套件)

```javascript
// db/connection.js

const { Pool } = require('pg');
require('dotenv').config();

/**
 * 建立 PostgreSQL 連線池
 * @returns {Pool} PostgreSQL 連線池實例
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // 或使用個別參數
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // 最大連線數
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * 測試資料庫連線
 */
pool.on('connect', () => {
  console.log('✅ 資料庫連線成功');
});

pool.on('error', (err) => {
  console.error('❌ 資料庫連線錯誤:', err);
  process.exit(-1);
});

/**
 * 執行 SQL 查詢
 * @param {string} text - SQL 查詢語句
 * @param {Array} params - 查詢參數
 * @returns {Promise<Object>} 查詢結果
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('執行查詢:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('查詢錯誤:', error);
    throw error;
  }
};

module.exports = {
  pool,
  query,
};
```

### 使用範例

```javascript
// routes/users.js

const db = require('../db/connection');

/**
 * 取得所有使用者
 * @param {Object} req - Express request 物件
 * @param {Object} res - Express response 物件
 */
async function getAllUsers(req, res) {
  try {
    const result = await db.query('SELECT * FROM users WHERE is_active = $1', [true]);
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('取得使用者失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
}

/**
 * 建立新使用者
 * @param {Object} req - Express request 物件
 * @param {Object} res - Express response 物件
 */
async function createUser(req, res) {
  const { username, email, password } = req.body;
  
  try {
    const result = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [username, email, password]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('建立使用者失敗:', error);
    res.status(500).json({
      success: false,
      message: '建立使用者失敗'
    });
  }
}

module.exports = {
  getAllUsers,
  createUser,
};
```

---

## 📋 replit.md 範本（含資料庫）

```markdown
# Replit 開發指引

## 專案概述
[專案名稱] - 手機優先的 RWD Web 應用程式

## 環境說明

### 環境變數
- **測試環境**: 使用 `.env.development`
  - `CONTEXT_PATH=/`
  - 路由前綴為根路徑
  
- **正式環境**: 使用 `.env.production`
  - `CONTEXT_PATH=/foo/bar`（系統預設值）
  - 所有路由需加上 `/foo/bar` 前綴

### 資料庫設定（PostgreSQL）

#### 連線資訊
```env
DATABASE_URL=postgresql://username:password@host:5432/database_name
```

#### 初始化資料庫
```bash
# 建立資料庫
npm run db:create

# 執行初始化腳本
npm run db:reset

# 建立種子資料
npm run db:seed
```

#### 常用資料庫指令
```bash
# 連線到資料庫
psql $DATABASE_URL

# 查看所有資料表
\dt

# 查看資料表結構
\d table_name

# 執行 SQL 檔案
psql $DATABASE_URL -f db/init.sql
```

### 開發指令

```bash
# 開發模式（測試環境）
npm run dev

# 開發模式（正式環境配置）
npm run dev:production

# 建置測試環境
npm run build

# 建置正式環境
npm run build:production

# 資料庫遷移
npm run db:migrate

# 重置資料庫
npm run db:reset
```

## 程式碼規範

### 函式註解
所有函式必須包含繁體中文註解：

```javascript
/**
 * 取得使用者資料
 * @param {string} userId - 使用者 ID
 * @returns {Promise<Object>} 使用者資料物件
 */
async function getUserData(userId) {
  // 實作...
}
```

### 資料庫查詢規範
```javascript
// ✅ 正確：使用參數化查詢（防止 SQL Injection）
const result = await db.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

// ❌ 錯誤：直接串接字串
const result = await db.query(
  `SELECT * FROM users WHERE id = ${userId}`
);
```

### 路徑處理
所有路由和資源路徑都必須使用 `CONTEXT_PATH`：

```javascript
// ✅ 正確
const apiUrl = `${import.meta.env.VITE_CONTEXT_PATH}/api/users`;

// ❌ 錯誤
const apiUrl = '/api/users';
```

## 資料庫架構

### 資料表清單
- `users` - 使用者資料
- [其他資料表...]

### ERD 圖表
詳見 `spec.md` 中的 Entity Relationship Diagram

## 重要注意事項

1. **端口配置**: 確認 `.replit` 文件中的端口設定正確
2. **環境切換**: 部署前確認使用正確的環境變數
3. **資料庫連線**: 確保 DATABASE_URL 設定正確
4. **路徑前綴**: 所有連結都要考慮 CONTEXT_PATH（正式環境為 /foo/bar）
5. **RWD 測試**: 在手機、平板、桌機三種尺寸測試
6. **SQL 安全**: 永遠使用參數化查詢，避免 SQL Injection

## 檔案結構

```
📁 專案根目錄/
├── 📁 db/
│   ├── init.sql      # 資料庫初始化
│   ├── seed.sql      # 種子資料
│   └── connection.js # 資料庫連線
├── 📁 server/
│   ├── index.js      # 伺服器入口
│   └── routes/       # API 路由
└── 📁 src/           # 前端原始碼
```

## 相關文件

- `README.md` - 包含專案描述、架構說明、技術棧清單、安裝與執行指南
- `spec.md` - 詳細的技術規格文件，包含所有 UML 圖表、API 定義、資料庫 ERD
- `report.md` - 專案開發過程的完整記錄，包含所有子任務的完成情況、遇到的問題與解決方案
- `todolist.md` - 任務清單與進度追蹤，清晰展示哪些功能已完成、哪些待實現，便於團隊協作



---


## ⚙️ Replit 配置（重要：解決 Preview 無法顯示問題）

### 🔧 端口配置說明

Replit 的 Preview 功能需要正確配置 `.replit` 文件中的端口映射。如果遇到 Preview 無法看到畫面的問題，通常是端口衝突造成的。

### 📝 配置步驟

#### Step 1: 打開 `.replit` 文件
在 Replit 專案的根目錄找到 `.replit` 文件（若沒有則新建一個）

#### Step 2: 檢查並修改端口配置

找到引起衝突的舊配置（通常是佔用 `externalPort = 80` 的配置）：

```toml
# ❌ 舊的、引起衝突的配置
[[ports]]
localPort = 5000
externalPort = 80  # <-- 這裡造成衝突
```

**修改為：**

```toml
# ✅ 修改後的舊配置（釋放 80 端口）
[[ports]]
localPort = 5000
externalPort = 8080  # <-- 改用 8080，釋放 80 端口
name = "old-service"
```

#### Step 3: 為您的 Web App 指定 80 端口

根據您使用的技術棧，添加對應的端口配置：

**🎨 使用 Vite (React/Vue 等)：**
```toml
[[ports]]
localPort = 5173
externalPort = 80
name = "web"
protocol = "http"
```

**⚛️ 使用 Create React App：**
```toml
[[ports]]
localPort = 3000
externalPort = 80
name = "web"
protocol = "http"
```

**🟢 使用 Node.js + Express：**
```toml
[[ports]]
localPort = 3000
externalPort = 80
name = "web"
protocol = "http"
```

**📄 使用靜態 HTML (Live Server)：**
```toml
[[ports]]
localPort = 8000
externalPort = 80
name = "web"
protocol = "http"
```

### 📄 完整的 `.replit` 文件範例

#### Vite 專案範例：
```toml
run = "npm run dev"
entrypoint = "index.html"

[nix]
channel = "stable-22_11"

[deployment]
run = ["npm", "run", "build:production"]
deploymentTarget = "static"
publicDir = "dist"

# 舊服務配置（如有需要保留）
[[ports]]
localPort = 5000
externalPort = 8080
name = "old-service"

# Vite 應用配置（主要 Web 服務）
[[ports]]
localPort = 5173
externalPort = 80
name = "web"
protocol = "http"

[env]
# 可在這裡設定預設環境變數
CONTEXT_PATH = "/"
```

#### Node.js + Express 專案範例：
```toml
run = "npm run dev"
entrypoint = "server.js"

[nix]
channel = "stable-22_11"

[deployment]
run = ["npm", "start"]

# Express 應用配置
[[ports]]
localPort = 3000
externalPort = 80
name = "web"
protocol = "http"

[env]
NODE_ENV = "development"
CONTEXT_PATH = "/"
```

### 🔄 重啟專案

配置完成後：
1. 點擊 Replit 上方的 **Stop** 按鈕
2. 再點擊 **Run** 按鈕重啟專案
3. 等待幾秒後，Preview 應該就能正常顯示

### ⚠️ 常見端口參考

| 技術棧 | 預設內部端口 (localPort) |
|--------|-------------------------|
| Vite | 5173 |
| Create React App | 3000 |
| Vue CLI | 8080 |
| Angular | 4200 |
| Next.js | 3000 |
| Express | 3000 |
| Flask | 5000 |
| Live Server | 8000 |

---