# Member 5 工作日志
> 维护人：Member 5（Pan Cheng）
> 分支：`pc-feature/health`
> 最后更新：2026-03-17（本次会话）

---

## 一、身份与职责

- **角色**：Member 5，数据库总管理员 + 健康管理 / 诊所模块负责人
- **核心权力**：`backend/prisma/schema.prisma` 唯一维护者，所有成员修改数据库结构必须先通知 Member 5
- **负责页面**：`health.html`、`clinic-portal.html`
- **负责 API**：`/api/health`、`/api/clinic`、`/api/organizations`、`/api/events`
- **上传接口**：`POST /api/health/upload`（图片/PDF，multer 存到 `backend/uploads/`）

---

## 二、已完成工作

### 2.1 数据库设计（schema.prisma）

文件位置：`backend/prisma/schema.prisma`

**主要升级内容：**

1. **新增枚举类型**：
   - `CatGender`：`male / female / unknown`
   - `CatStatus`：`available / adopted / fostered / deceased`
   - `HealthRecordType`：`vaccine / deworming / checkup / treatment / surgery / other`
   - `ClinicReportType`：`vaccination / deworming / checkup / blood_test / treatment / surgery / other`

2. **新增表**：`adoption_events`（领养活动）

3. **Cat 表新增字段**：`is_neutered`、`is_vaccinated`、`is_dewormed`、`intake_date`、`found_location`、`event_id`、`status`(枚举)、`gender`(枚举)

4. **AdoptionApplication 新增**：`reviewed_by`、`reviewed_at`、`reject_note`、`event_id`

5. **OwnerHealthRecord 新增**：`next_due_date`、`weight_kg`、`vet_name`、`clinic_name`、`file_url`（附件URL，本次新增）

6. **ClinicHealthReport**：新增 `updated_at`

7. **Organization**：新增 `license_number`、`is_verified`

8. **AdopterPreference**：新增 `accept_special_need`、`home_type`、`has_other_pets`、`has_children`、`preferred_color`（本次新增，供推荐算法使用）

**同步方式**：`npx prisma db push`（在 backend 目录执行）

---

### 2.2 后端 API 实现

#### 健康管理 `/api/health`

| Method | 路径 | 说明 |
|--------|------|------|
| GET | `/api/health/records/:catId` | 获取猫咪全部健康数据（主人记录+诊所报告+授权） |
| POST | `/api/health/records/:catId` | 新增主人健康记录（支持 `file_url` 附件字段） |
| PUT | `/api/health/records/:recordId` | 修改健康记录 |
| DELETE | `/api/health/records/:recordId` | 删除健康记录 |
| GET | `/api/health/share/:catId` | 查看授权列表 |
| POST | `/api/health/share` | 设置/更新诊所授权（upsert） |
| **POST** | **`/api/health/upload`** | **上传附件（图片/PDF），返回可访问的 URL** |

#### 诊所 `/api/clinic`

| Method | 路径 | 说明 |
|--------|------|------|
| GET | `/api/clinic/cats?orgId=xxx` | 获取诊所已授权猫咪列表 |
| POST | `/api/clinic/reports/:catId` | 上传官方报告（含授权校验） |
| PUT | `/api/clinic/reports/:reportId` | 修改报告 |
| DELETE | `/api/clinic/reports/:reportId` | 删除报告 |

#### 机构 `/api/organizations`

| Method | 路径 | 说明 |
|--------|------|------|
| GET | `/api/organizations` | 获取机构列表 |
| GET | `/api/organizations/:id` | 获取机构详情 |
| POST | `/api/organizations` | 注册新机构 |
| PUT | `/api/organizations/:id` | 更新机构信息 |

> ⚠️ 缺少 `POST /api/organizations/login`（机构登录），待补充。

#### 领养活动 `/api/events`

| Method | 路径 | 说明 |
|--------|------|------|
| GET | `/api/events` | 获取活动列表 |
| GET | `/api/events/:id` | 获取活动详情（含猫咪） |
| POST | `/api/events` | 创建活动 |
| PUT | `/api/events/:id` | 更新活动 |
| DELETE | `/api/events/:id` | 删除活动 |

#### server.js 路由挂载（`src/server.js`）

```js
app.use('/uploads', express.static(...))   // 上传文件静态服务
app.use('/api/auth',          authRouter);
app.use('/api/users',         usersRouter);
app.use('/api/organizations', orgRouter);
app.use('/api/events',        eventRouter);
app.use('/api/health',        healthRouter);
app.use('/api/clinic',        clinicRouter);
```

---

### 2.3 前端页面（本次会话全面重设计）

#### health.html + health.js（全新 UI）

**设计亮点：**
- 顶部**蓝色渐变健康护照卡**：自动从记录中计算展示 💉疫苗 / 🐛驱虫 / ✂️绝育 / ⚖️体重 / ⏰即将提醒
- **三标签页**：📋 健康記錄 / 🏥 診所認證 / 🔑 授權管理
- **证书式记录卡**：每种类型有专属颜色条（蓝=疫苗、绿=驱虫、紫=手术...）
- **图片上传**：选文件 → 即时预览 → 提交时先上传获取URL → 存入记录，卡片内显示图片缩略图
- 表单字段：类型、日期、下次提醒、体重、主治医师、医疗院所、描述、**附件**

**文件：**
- `frontend/pages/health.html`
- `frontend/js/health.js`

#### clinic-portal.html + clinic-portal.js（全新 UI）

**设计亮点：**
- 深蓝渐变**专业诊所 header**，显示诊所名称和授权猫咪数量
- **左右双栏**：左侧病患列表 + 右侧详情
- 病患卡片：含健康状态标签（有无疫苗/驱虫/手术记录 + 最新体重 + 提醒日期）
- 主人记录（只读）+ 本诊所已上传报告（可删除）
- 上传表单升级：报告类型 + 日期 + **主治兽医师** + **文件编号** + 描述

**文件：**
- `frontend/pages/clinic-portal.html`
- `frontend/js/clinic-portal.js`（新建）

#### account.html（整合健康入口）

- 勾选「我有猫咪」后，下方自动显示「🩺 Cat Health Records」卡片
- 包含功能标签预览 + **「Open Health Records →」** 按钮
- 按钮自动带上 `catId` 参数，跳到 health.html 直接加载该猫数据

#### index.html（侧边栏调整）

- 移除「🩺 Health」独立侧边栏导航项
- Health 功能入口已归入 Account 页面

---

### 2.4 文件上传功能（本次新增）

| 项目 | 内容 |
|------|------|
| 依赖 | `multer`（`npm install multer`） |
| 存储位置 | `backend/uploads/`（本地磁盘） |
| 访问路径 | `http://localhost:3000/uploads/<filename>` |
| 接口 | `POST /api/health/upload`，接收 `multipart/form-data`，字段名 `file` |
| 返回 | `{ success: true, data: { url, filename } }` |
| 限制 | 最大 10MB，支持 JPG/PNG/GIF/WEBP/PDF |
| 路由文件 | `backend/src/routes/health.routes.js`（含 multer 配置） |

---

### 2.5 数据库 Schema 变更历史（已推送到 main 的）

| 分支 | 内容 | 状态 |
|------|------|------|
| `db/schema-v2` | 初始大规模升级（枚举、新字段、新表） | ✅ 已合并 main |
| `db/schema-v3` | 新增 `AdopterPreference.preferred_color` | ✅ 已推送，待 PR 合并 |
| `pc-feature/health` | 新增 `OwnerHealthRecord.file_url` | ⏳ 还在功能分支，待稳定后 PR |

---

### 2.6 数据库字段字典

文件位置：`Database_Field_Dictionary.html`（项目根目录，浏览器直接打开）
- 所有 19 张表的字段名、类型、是否必填、用途说明
- 所有枚举值及含义

---

### 2.7 Seed 数据（全表覆盖）

文件位置：`backend/prisma/seed.js`

```bash
cd backend
npm run seed         # 填充数据
# 重置所有数据：
npx prisma db push --force-reset && npm run seed
```

| 表 | 条数 |
|----|------|
| organizations | 2（1救助+1诊所） |
| users | 12（10普通+1救助员+1诊所员） |
| adoption_events | 3（第2/3/4届） |
| cats | 31（来自真实 Excel） |
| adoption_applications | 41（approved/pending/rejected） |
| owner_health_records | 15 |
| clinic_health_reports | 5 |
| health_share_permissions | 5 |
| posts / comments / likes | 10 / 10 / 40 |
| conversations / messages | 4 / 16 |

**测试账号：**
```
普通用户：  alice@test.com        / test1234
救助员：    staff@rescue.com      / test1234
诊所员：    vet@clinic.com        / test1234
救助机构：  rescue@catface-seed.com / seed1234
诊所机构：  clinic@catface-seed.com / seed1234
```

---

## 三、本地环境配置

### `.env` 文件（`backend/.env`，不提交 Git）
```
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/catface_dev"
JWT_SECRET=catface_jwt_secret_key_32chars_min
JWT_EXPIRES_IN=7d
```

### 常用命令
```bash
cd backend
npm run dev                      # 启动（nodemon 热重启）
npx prisma db push               # 同步 schema 到本地 DB
npx prisma studio                # 可视化查看数据库
npm run seed                     # 填充测试数据
```

### 测试关键接口（PowerShell）
```powershell
Invoke-RestMethod "http://localhost:3000/api/healthcheck"
Invoke-RestMethod "http://localhost:3000/api/organizations"
Invoke-RestMethod "http://localhost:3000/api/clinic/cats?orgId=4fddae50-31b3-4df3-bd62-07c2ff2c962d"
```

### 快速测试用 ID（seed 数据）
```
诊所 ID：      4fddae50-31b3-4df3-bd62-07c2ff2c962d
救助机构 ID：  406df704-2d55-42d9-ba2c-2158855f176e

测试猫咪 ID：  626c12b9-5d58-41f3-957a-e4ad18c180f1
对应用户 ID：  dfdbd68f-8bdc-4e69-adf3-7700101753a6
```

---

## 四、待完成工作

### 🔴 高优先级

1. **机构登录接口**
   - `POST /api/organizations/login`（目前只有注册没有登录）
   - 参考 `auth.controller.js` 写法，返回 JWT token

2. **JWT 鉴权中间件**
   - 等 Member 1 修好 `backend/src/middleware/auth.js` 后
   - 在需要登录的接口加 `authenticate` 中间件
   - 例：`router.post('/records/:catId', authenticate, createOwnerHealthRecord)`

3. **推送 `OwnerHealthRecord.file_url` 到 main**
   - 目前只在 `pc-feature/health` 分支
   - 待功能稳定后合并，其他人 `npx prisma db push` 即可同步

### 🟡 中优先级

4. **提交 `pc-feature/health` 功能代码 PR**
   - 包含：controllers、routes、health.html、health.js、clinic-portal.html、clinic-portal.js、account.html、index.html

5. **云端文件存储**
   - 目前图片存在 `backend/uploads/` 本地目录（部署后会丢失）
   - 将来可迁移到 Cloudinary / AWS S3 / 自建 OSS

### 🟢 低优先级

6. **rescue-dashboard.html 数据对接**
   - Member 6 负责页面，数据来自 `/api/events`，协助对接

---

## 五、团队注意事项

### 数据库规范
- 任何人修改数据库结构必须先通知 Member 5
- 字段命名：`username`（不是 `name`）、`display_name`，详见 `Database_Field_Dictionary.html`
- 枚举值必须严格按 schema 填写（如 `gender` 只能 `male/female/unknown`）

### 其他成员同步数据库
```bash
git checkout main
git pull origin main
cd backend
npx prisma db push
npm run seed   # 如需重新生成测试数据
```

### 遗留跨成员问题
- **Member 1**：`auth.controller.js` 用了 `name`（应为 `username`），已通知
- **Member 2**：`cat-profile.html` 内容不对，已通知
- **Member 4**：需 pull main 最新才有 `config.js`

---

## 六、文件结构速查

```
backend/
├── prisma/
│   ├── schema.prisma              ← Member 5 唯一维护
│   └── seed.js                    ← 全表测试数据
├── src/
│   ├── controllers/
│   │   ├── health.controller.js   ← 健康记录 CRUD + 授权
│   │   ├── clinic.controller.js   ← 诊所报告 CRUD
│   │   ├── organization.controller.js
│   │   └── event.controller.js
│   ├── routes/
│   │   ├── health.routes.js       ← 含 multer 文件上传路由
│   │   ├── clinic.routes.js
│   │   ├── organization.routes.js
│   │   └── event.routes.js
│   └── server.js                  ← 路由挂载 + 静态文件服务
├── uploads/                       ← 用户上传的图片/PDF（本地存储）
├── .env                           ← 本地配置，不提交 Git
└── package.json                   ← 含 seed 脚本、multer 依赖

frontend/
├── js/
│   ├── config.js                  ← 全员共用，API_BASE_URL
│   ├── health.js                  ← 健康页完整 API 逻辑
│   └── clinic-portal.js           ← 诊所门户完整 API 逻辑（新建）
└── pages/
    ├── health.html                ← 全新 UI：护照卡+标签页+图片上传 ✅
    ├── clinic-portal.html         ← 全新 UI：专业诊所门户 ✅
    ├── account.html               ← 整合健康入口 ✅
    └── index.html                 ← 移除 Health 侧边栏项 ✅

Database_Field_Dictionary.html     ← 根目录，字段说明文档
MEMBER5_WORKLOG.md                 ← 本文件
```
