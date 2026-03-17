# CatFace — 全栈开发主骨架蓝图

> **版本**: v1.0 | **日期**: 2026-03-12 | **状态**: 正式执行文档
>
> 本文档是整个项目的最高优先级参考文件。所有分工开发必须严格遵守本文档规定的技术栈版本、文件结构、命名规范和接口标准，确保各模块可无缝合并、隔离测试与维护。

---

## 目录

1. [项目全局信息](#1-项目全局信息)
2. [技术栈（锁定版本）](#2-技术栈锁定版本)
3. [项目文件夹结构](#3-项目文件夹结构)
4. [数据库结构总览](#4-数据库结构总览)
5. [API 设计统一规范](#5-api-设计统一规范)
6. [开发阶段与顺序](#6-开发阶段与顺序)
7. [五人分工职责表](#7-五人分工职责表)
8. [编码规范与强制约定](#8-编码规范与强制约定)
9. [环境配置与启动说明](#9-环境配置与启动说明)
10. [测试策略](#10-测试策略)
11. [Git 工作流程](#11-git-工作流程)
12. [检查清单（合并前必看）](#12-检查清单合并前必看)

---

## 1. 项目全局信息

| 项目 | 内容 |
|------|------|
| **项目名称** | CatFace |
| **定位** | 以猫为主角的一站式社交+领养平台（类小红书+Tinder） |
| **核心功能** | 用户系统 / 猫咪档案 / 领养推荐(滑动) / 社区(Cat Facebook) / 健康管理 / 救助机构后台 / 诊所门户 |
| **团队人数** | 6人 |
| **截止时间** | 2026-04-20（参考 Proposal Phase 5） |
| **开发语言** | JavaScript（前后端统一，降低切换成本） |
| **代码仓库** | GitHub（每人一个分支，向 `main` 发 Pull Request） |

---

## 2. 技术栈（锁定版本）

> **警告**: 下表版本号在整个项目周期内不得随意升级。如需升级，须全员确认后统一修改。

### 2.1 后端 (Backend)

| 工具/库 | 版本 | 用途 | 安装命令 |
|---------|------|------|----------|
| **Node.js** | **20.x LTS** | 运行环境 | [nodejs.org](https://nodejs.org) 下载安装 |
| **Express.js** | **4.18.x** | Web 服务器框架 | `npm install express@4.18` |
| **Prisma ORM** | **5.x** | 数据库操作（替代手写SQL） | `npm install prisma@5 @prisma/client@5` |
| **PostgreSQL** | **16.x** | 关系型数据库 | [postgresql.org](https://www.postgresql.org/download/) 下载安装 |
| **jsonwebtoken** | **9.x** | JWT 身份认证 | `npm install jsonwebtoken@9` |
| **bcryptjs** | **2.x** | 密码加密 | `npm install bcryptjs@2` |
| **multer** | **1.x** | 文件上传处理 | `npm install multer@1` |
| **cloudinary** | **2.x** | 图片云存储 | `npm install cloudinary@2` |
| **cors** | **2.x** | 跨域请求配置 | `npm install cors@2` |
| **dotenv** | **16.x** | 环境变量管理 | `npm install dotenv@16` |
| **express-validator** | **7.x** | 请求参数验证 | `npm install express-validator@7` |
| **nodemon** | **3.x** | 开发热重载（仅 dev） | `npm install -D nodemon@3` |

### 2.2 前端 (Frontend)

| 工具 | 版本/说明 | 用途 |
|------|-----------|------|
| **HTML5** | 标准 | 页面结构（沿用现有 .html 原型） |
| **CSS3** | 标准 | 页面样式 |
| **JavaScript** | ES6+（不用 TypeScript） | 前端逻辑 + API 调用 |
| **Fetch API** | 浏览器原生 | 向后端发请求（不引入 axios，保持简单） |
| **无前端框架** | — | 不使用 React/Vue，直接在现有 HTML 上加 JS 逻辑 |

### 2.3 开发工具（全员统一安装）

| 工具 | 版本/说明 | 用途 |
|------|-----------|------|
| **VS Code / Cursor** | 最新版 | 代码编辑器 |
| **Thunder Client** | VS Code 插件 | 接口测试（替代 Postman） |
| **Git** | 2.x | 版本控制 |
| **GitHub Desktop** | 最新版 | Git 图形界面（适合新手） |
| **pgAdmin 4** | 最新版 | PostgreSQL 图形管理工具 |
| **Node.js 20 LTS** | 20.x | 必须版本一致 |

> 验证 Node 版本命令: `node -v`（输出必须是 `v20.x.x`）

---

## 3. 项目文件夹结构

```
catface/
├── backend/                        # 后端服务器（所有人共享）
│   ├── prisma/
│   │   ├── schema.prisma           # 数据库模型定义（Member 5 唯一维护者）
│   │   └── migrations/             # 自动生成，不要手动修改
│   ├── src/
│   │   ├── server.js               # 入口文件（Member 1 创建）
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT 验证中间件（Member 1）
│   │   │   └── upload.js           # 文件上传中间件（Member 5）
│   │   ├── routes/                 # 路由文件（每人负责自己的模块）
│   │   │   ├── auth.routes.js      # Member 1
│   │   │   ├── users.routes.js     # Member 1
│   │   │   ├── cats.routes.js      # Member 2
│   │   │   ├── adoption.routes.js  # Member 2
│   │   │   ├── community.routes.js # Member 3
│   │   │   ├── health.routes.js    # Member 5
│   │   │   ├── clinic.routes.js    # Member 5
│   │   │   ├── chat.routes.js      # Member 6
│   │   │   └── rescue.routes.js    # Member 6
│   │   ├── controllers/            # 业务逻辑（与 routes 一一对应）
│   │   │   ├── auth.controller.js
│   │   │   ├── users.controller.js
│   │   │   ├── cats.controller.js
│   │   │   ├── adoption.controller.js
│   │   │   ├── community.controller.js
│   │   │   ├── health.controller.js
│   │   │   ├── clinic.controller.js
│   │   │   ├── chat.controller.js
│   │   │   └── rescue.controller.js
│   │   └── utils/
│   │       ├── generateToken.js    # JWT 生成工具（Member 1）
│   │       └── cloudinary.js       # 图片上传工具（Member 5）
│   ├── uploads/                    # 本地临时上传文件夹（.gitignore 排除）
│   ├── .env                        # 环境变量（.gitignore 排除）
│   ├── .env.example                # 环境变量模板（提交到 Git）
│   ├── .gitignore
│   └── package.json
│
├── frontend/                       # 前端页面（全员参与整合）
│   ├── pages/
│   │   ├── index.html              # 首页（Member 4）           ← 从原型迁入
│   │   ├── log-in.html             # 登录/注册（Member 1）      ← 从原型迁入
│   │   ├── account.html            # 用户个人页（Member 1）     ← 从原型迁入
│   │   ├── cat-profile.html        # 猫咪档案页（Member 2）     ← 从原型迁入
│   │   ├── adoption.html           # 领养模块（Member 2）       ← 从原型迁入
│   │   ├── cat-facebook.html       # 社区首页（Member 3）       ← 从原型迁入
│   │   ├── notifications.html      # 通知页（Member 3）         ← 从原型迁入
│   │   ├── health.html             # 健康管理（Member 5）       ← 从原型迁入
│   │   ├── clinic-portal.html      # 诊所门户（Member 5）       ← 从原型迁入
│   │   └── rescue-dashboard.html   # 救助机构后台（Member 6）   ← 从原型迁入
│   ├── js/                         # 前端 JS 逻辑文件（与页面一一对应，全部新建）
│   │   ├── config.js               # API 地址配置（Member 4 创建，全员用）
│   │   ├── auth.js                 # 登录/注册逻辑（Member 1）
│   │   ├── account.js              # 用户页逻辑（Member 1）
│   │   ├── cat-profile.js          # 猫咪档案逻辑（Member 2）
│   │   ├── adoption.js             # 领养逻辑（Member 2）
│   │   ├── community.js            # 社区逻辑（Member 3）
│   │   ├── notifications.js        # 通知逻辑（Member 3）
│   │   ├── health.js               # 健康管理逻辑（Member 5）
│   │   ├── clinic-portal.js        # 诊所门户逻辑（Member 5）
│   │   ├── chat.js                 # 聊天逻辑（Member 6，嵌入 adoption.html）
│   │   └── rescue-dashboard.js     # 救助机构逻辑（Member 6）
│   └── css/
│       └── style.css               # 全局样式（Member 4 统一管理）
│
└── README.md                       # 项目启动说明（Member 1 维护）
```

> **重要约定**:
> - 每个 `.html` 文件对应一个同名的 `.js` 文件，通过 `<script src="../js/xxx.js">` 引入
> - 所有 API 调用集中写在对应的 `.js` 文件里，**不要在 HTML 里写 JS 逻辑**
> - `config.js` 是全员共用文件，定义后端地址，每人开发时引用它

---

## 4. 数据库结构总览

> 完整字段定义见 `Database_Field_Dictionary.html`。以下是表名与负责人的对应关系。

| 表名 | 描述 | 负责创建/维护 |
|------|------|---------------|
| `users` | 用户账号 | Member 1 |
| `user_follows` | 用户关注关系 | Member 3 |
| `organizations` | 救助机构 / 诊所 | Member 5 |
| `cats` | 猫咪主表 | Member 2 |
| `cat_tags` | 猫咪标签 | Member 2 |
| `cat_requirements` | 猫咪领养要求 | Member 2 |
| `cat_updates` | 猫咪动态记录 | Member 2 |
| `adopter_preferences` | 用户领养偏好 | Member 2 |
| `adoption_applications` | 领养申请 | Member 2 |
| `posts` | 社区帖子 | Member 3 |
| `post_likes` | 帖子点赞 | Member 3 |
| `comments` | 评论 | Member 3 |
| `owner_health_records` | 用户维护的健康记录 | Member 5 |
| `clinic_health_reports` | 诊所上传的健康报告 | Member 5 |
| `health_share_permissions` | 健康数据共享授权 | Member 5 |
| `conversations` | 聊天会话 | Member 6 |
| `messages` | 聊天消息 | Member 6 |
| `message_attachments` | 消息附件 | Member 6 |

> **数据库统一规则**:
> - 所有表名使用**复数小写下划线**命名（snake_case）
> - 所有主键命名为 `id`（在 Prisma schema 中统一用 `id @id @default(uuid())`）
> - 所有时间字段用 `created_at` / `updated_at`，Prisma 自动管理 `@updatedAt`
> - **任何人不得直接修改 `schema.prisma` 而不通知 Member 5**，统一由 Member 5 执行 `prisma migrate`

---

## 5. API 设计统一规范

### 5.1 URL 命名规范

```
POST   /api/auth/register          # 注册
POST   /api/auth/login             # 登录
GET    /api/users/:id              # 获取用户信息
GET    /api/cats                   # 获取猫咪列表
POST   /api/cats                   # 创建猫咪
GET    /api/cats/:id               # 获取单只猫信息
PUT    /api/cats/:id               # 更新猫咪信息
DELETE /api/cats/:id               # 删除猫咪
GET    /api/adoption/feed          # 获取领养推荐列表
POST   /api/adoption/swipe         # 记录滑动行为
GET    /api/community/posts        # 获取社区帖子列表
POST   /api/community/posts        # 发布帖子
```

- 全部以 `/api/` 开头
- 资源名称使用**复数小写**（`cats`，不是 `cat`）
- 操作动词用 HTTP Method 表达，不在 URL 里写 `/getCat`

### 5.2 统一响应格式

**所有接口** 必须按以下格式返回 JSON：

```json
// 成功响应
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}

// 失败响应
{
  "success": false,
  "error": "错误说明",
  "message": "用户可读的错误信息"
}
```

> 禁止直接 `res.send("ok")` 或返回裸数组，必须包装在上述结构中

### 5.3 HTTP 状态码规范

| 场景 | 状态码 |
|------|--------|
| 成功返回数据 | 200 |
| 成功创建资源 | 201 |
| 无 Token / Token 无效 | 401 |
| 权限不足 | 403 |
| 资源不存在 | 404 |
| 参数验证失败 | 422 |
| 服务器错误 | 500 |

### 5.4 身份认证规范

- 登录成功后返回 JWT Token，有效期 **7天**
- 需要登录才能访问的接口，前端在 Headers 里带上：
  ```
  Authorization: Bearer <token>
  ```
- 后端通过 `middleware/auth.js` 验证 Token，验证通过后将用户信息挂载到 `req.user`

### 5.5 用户角色（role）枚举值

| 值 | 角色 | 权限说明 |
|----|------|----------|
| `user` | 普通用户/猫主人 | 浏览、发帖、申请领养、管理自己的猫和健康记录 |
| `rescue_staff` | 救助组织工作人员 | 录入流浪猫信息、审核领养申请、查看数据分析 |
| `clinic_staff` | 诊所工作人员 | 上传官方健康报告（只读普通用户记录） |
| `admin` | 系统管理员（留空备用） | 全部权限 |

---

## 6. 开发阶段与顺序

> 严格按照阶段顺序开发，后一阶段依赖前一阶段的基础设施。

### Phase 0 — 项目初始化（全员，1-2天）

**目标**: 所有人的开发环境能正常运行

- [ ] Member 1: 在 GitHub 创建仓库 `catface`，建立 `main` 分支保护规则（参考 `GIT_GUIDE_FROM_ZERO.md`）
- [ ] Member 1: 搭建 `backend/` 基础结构（`server.js` 可 hello world 启动）
- [ ] Member 1: 创建 `.env.example` 文件（见第9节）
- [ ] Member 4: 将现有 10 个 HTML 原型文件复制到 `frontend/pages/` 目录（迁移清单见本节末）
- [ ] Member 4: 创建 `frontend/js/config.js`（内容见本节末）
- [ ] Member 4: 创建 `frontend/css/style.css`（可先空文件）
- [ ] Member 5: 安装 PostgreSQL 16，创建本地数据库 `catface_dev`
- [ ] Member 5: 初始化 Prisma，写出第一版 `schema.prisma`（先建 `users` + `organizations` + `cats` 三张表）
- [ ] **全员**: 克隆仓库，安装依赖，用 `node -v` 确认 Node 20，能跑起来后端服务

**HTML 原型文件迁移清单（Member 4 执行）**:

| 原始文件名 | 迁移目标路径 | 说明 |
|-----------|------------|------|
| `index.html` | `frontend/pages/index.html` | 首页 ✅ 迁入 |
| `log-in.html` | `frontend/pages/log-in.html` | 登录注册 ✅ 迁入 |
| `account.html` | `frontend/pages/account.html` | 用户个人页 ✅ 迁入 |
| `cat-profile.html` | `frontend/pages/cat-profile.html` | 猫咪档案页 ✅ 迁入 |
| `adoption.html` | `frontend/pages/adoption.html` | 领养模块 ✅ 迁入 |
| `cat-facebook.html` | `frontend/pages/cat-facebook.html` | 社区页 ✅ 迁入 |
| `notifications.html` | `frontend/pages/notifications.html` | 通知页 ✅ 迁入 |
| `health.html` | `frontend/pages/health.html` | 健康管理 ✅ 迁入 |
| `clinic-portal.html` | `frontend/pages/clinic-portal.html` | 诊所门户 ✅ 迁入 |
| `rescue-dashboard.html` | `frontend/pages/rescue-dashboard.html` | 救助机构后台 ✅ 迁入 |
| `Backend_Guide_Creator_Profile.html` | 原地保留，重命名为 `docs/` | 开发参考文档，❌ 不是页面 |
| `CatFace_Progress_Log_Updated.html` | 原地保留 | 项目日志文档，❌ 不是页面 |
| `CatFace_Project_Log.html` | 原地保留 | 项目日志文档，❌ 不是页面 |
| `Cat_Account_Scheme_Comparison.html` | 原地保留 | 方案对比文档，❌ 不是页面 |
| `Database_Field_Dictionary.html` | 原地保留 | 数据库字典文档，❌ 不是页面 |

**config.js 内容模板**:
```javascript
// frontend/js/config.js
// 所有人在调用后端时，必须引入这个文件，使用 API_BASE_URL
const API_BASE_URL = "http://localhost:3000/api";
```

---

### Phase 1 — 核心基础设施（并行开发，约1周）

**目标**: 用户可以注册、登录，猫咪数据可以存取

各成员同时开始，但 Member 1 需最先完成 Auth 中间件供他人使用：

**Member 1 先行（约2天）**:
- [ ] 完成 `POST /api/auth/register` — 注册接口
- [ ] 完成 `POST /api/auth/login` — 登录接口，返回 JWT Token
- [ ] 完成 `middleware/auth.js` — **完成后通知所有人，其他人才能开始做需要登录的接口**
- [ ] 完成登录/注册前端 JS（`log-in.html` + `auth.js`）

**Member 2、3、5、6 同步（Phase 1期间）**:
- [ ] Member 2: 完成 Prisma `cats` 相关表迁移，实现 `GET/POST /api/cats` 基础接口
- [ ] Member 3: 完成 Prisma `posts` 表迁移，实现 `GET/POST /api/community/posts` 基础接口
- [ ] Member 5: 完成所有 Prisma 表迁移（`prisma migrate dev`），确保数据库结构完整
- [ ] Member 6: 完成 Prisma `conversations`/`messages` 表迁移，搭建聊天路由骨架

---

### Phase 2 — 各模块功能开发（并行开发，约1.5周）

**目标**: 各模块后端 API 全部实现，前端完成基础联调

各成员各自完成所负责模块的完整后端 + 前端集成：

| Member | 主要交付物 |
|--------|-----------|
| Member 1 | 用户个人页（profile）、关注功能、`account.html` 联调 |
| Member 2 | 猫咪档案 CRUD、领养偏好设置、滑动/点赞记录、领养申请提交 |
| Member 3 | 帖子发布/点赞/评论、`cat-facebook.html` + `notifications.html` 联调 |
| Member 4 | 前端首页整合、导航栏联通、全局样式统一、登录状态守卫 |
| Member 5 | 健康记录增删改查、诊所报告上传、`health.html` + `clinic-portal.html` 联调 |
| Member 6 | 聊天消息收发、救助机构看板 API、`rescue-dashboard.html` 联调 |

---

### Phase 3 — 集成联调与数据替换（全员，约4天）

**目标**: 把所有 HTML 里的硬编码假数据，替换为真实 API 数据

- [ ] 每人对自己模块的前端页面做联调，用 `fetch(API_BASE_URL + ...)` 拉取真实数据
- [ ] 修复跨模块依赖问题（如：社区帖子里显示猫咪信息，需要调 Cat API）
- [ ] Member 1 统一检查所有页面的 JWT Token 传递是否正确

---

### Phase 4 — 测试与修复（约4天，2026-04-01至04-10）

**目标**: 功能完整，无明显 Bug

- [ ] 按第10节《测试策略》，每人测试自己负责的模块
- [ ] Member 4 做全流程用户路径测试（从注册→领养→发帖→健康记录）
- [ ] 收集 Bug 列表，分配修复任务

---

### Phase 5 — 文档与演示准备（2026-04-10至04-20）

- [ ] 整理演示数据（在 pgAdmin 里手动插入测试数据）
- [ ] 每人准备自己负责模块的演示说明（1-2分钟）
- [ ] Member 1 更新 `README.md`，确保别人能按说明启动项目

---

## 7. 六人分工职责表

> 每人对自己模块的**后端 API + 前端集成**负全责。Member 4 主要负责前端统筹。

| 成员 | 模块 | 负责页面 | 分支 |
|------|------|---------|------|
| Member 1 | 后端基础架构 + 用户系统 | `log-in.html`, `account.html` | `feature/auth` |
| Member 2 | 猫咪档案 + 领养模块 | `cat-profile.html`, `adoption.html` | `feature/cats` |
| Member 3 | 社区模块 | `cat-facebook.html`, `notifications.html` | `feature/community` |
| Member 4 | 前端统筹 + 全局整合 | `index.html`, `style.css`, `config.js` | `feature/frontend` |
| Member 5 | 数据库管理 + 健康/诊所 | `health.html`, `clinic-portal.html` | `feature/health` |
| Member 6 | 聊天功能 + 救助机构后台 | `rescue-dashboard.html`, 聊天弹窗 | `feature/rescue` |

### Member 1 — 后端基础架构 + 用户系统
**对应文件**: `auth.routes.js`, `users.routes.js`, `auth.controller.js`, `users.controller.js`, `middleware/auth.js`, `log-in.html`, `auth.js`, `account.js`

| 任务 | API | 前端页面 |
|------|-----|---------|
| 用户注册 | `POST /api/auth/register` | `log-in.html` 注册表单 |
| 用户登录 | `POST /api/auth/login` | `log-in.html` 登录表单 |
| 获取当前用户信息 | `GET /api/users/me` | `account.html` 个人信息显示 |
| 更新用户资料 | `PUT /api/users/me` | `account.html` 编辑保存 |
| 关注/取消关注用户 | `POST /api/users/:id/follow` | `account.html` 关注按钮 |
| JWT 中间件 | `middleware/auth.js` | — |
| GitHub 仓库初始化 | — | `README.md`, `config.js` |

**首要任务**: 在 Phase 1 第2天前完成 `auth.js` 中间件并推送，通知全员。

---

### Member 2 — 猫咪档案 + 领养模块
**对应文件**: `cats.routes.js`, `adoption.routes.js`, `cats.controller.js`, `adoption.controller.js`, `cat-profile.js`, `adoption.js`

| 任务 | API | 前端页面 |
|------|-----|---------|
| 创建猫咪档案 | `POST /api/cats` | 救助机构建档（rescue-dashboard 联动） |
| 获取猫咪列表 | `GET /api/cats` | `adoption.html` 推荐卡片 |
| 获取单只猫信息 | `GET /api/cats/:id` | `cat-profile.html` 详情页 |
| 更新猫咪信息 | `PUT /api/cats/:id` | `cat-profile.html` 编辑 |
| 记录滑动行为 | `POST /api/adoption/swipe` | `adoption.html` 左右滑动 |
| 获取已喜欢的猫 | `GET /api/adoption/liked` | `adoption.html` liked cats 列表 |
| 设置领养偏好 | `POST /api/adoption/preferences` | `adoption.html` 偏好设置弹窗 |
| 提交领养申请 | `POST /api/adoption/applications` | `adoption.html` Apply 表单 |
| 获取领养申请状态 | `GET /api/adoption/applications/me` | `adoption.html` 申请状态显示 |

---

### Member 3 — 社区模块
**对应文件**: `community.routes.js`, `community.controller.js`, `community.js`, `notifications.js`

| 任务 | API | 前端页面 |
|------|-----|---------|
| 获取帖子信息流 | `GET /api/community/posts` | `cat-facebook.html` 主页流 |
| 发布帖子 | `POST /api/community/posts` | `cat-facebook.html` 发帖弹窗 |
| 点赞/取消点赞 | `POST /api/community/posts/:id/like` | `cat-facebook.html` 点赞按钮 |
| 发表评论 | `POST /api/community/posts/:id/comments` | `cat-facebook.html` 评论框 |
| 获取评论列表 | `GET /api/community/posts/:id/comments` | `cat-facebook.html` 评论区 |
| 上传帖子图片 | `POST /api/community/upload` | 帖子图片上传 |
| 关注/取消关注 | `POST /api/users/:id/follow` | `cat-facebook.html` 关注按钮 |
| 获取通知列表 | `GET /api/notifications` | `notifications.html` 通知流 |

---

### Member 4 — 前端统筹 + 全局整合
**对应文件**: `index.html`, `style.css`, `frontend/js/config.js`，协助其他成员的前端集成

| 任务 | 说明 |
|------|------|
| 维护 `config.js` | 确保 `API_BASE_URL` 在所有 JS 文件中正确引用 |
| 首页整合 | `index.html` 导航、推荐流、模块入口连接 |
| 全局 CSS 统一 | 整理 `style.css`，消除各页面样式冲突 |
| 页面跳转逻辑 | 确保所有页面的导航跳转正确 |
| Token 管理工具函数 | 在 `config.js` 中提供 `getToken()` / `setToken()` / `logout()` 供全员使用 |
| 全流程测试 | Phase 4 中测试完整用户旅程 |
| 登录状态守卫 | 检查每个需要登录的页面是否有 redirect 逻辑 |

**config.js 标准模板（Member 4 完成）**:
```javascript
// frontend/js/config.js
const API_BASE_URL = "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("catface_token");
}

function setToken(token) {
  localStorage.setItem("catface_token", token);
}

function logout() {
  localStorage.removeItem("catface_token");
  window.location.href = "/pages/log-in.html";
}

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getToken()}`
  };
}
```

---

### Member 5 — 数据库管理 + 健康/诊所模块
**对应文件**: `prisma/schema.prisma`, `health.routes.js`, `clinic.routes.js`, `health.controller.js`, `clinic.controller.js`, `health.js`, `clinic-portal.js`, `middleware/upload.js`, `utils/cloudinary.js`

| 任务 | API | 前端页面 |
|------|-----|---------|
| **维护 Prisma schema（唯一负责人）** | 统一执行 `prisma migrate dev` | — |
| 图片/文件上传中间件 | `middleware/upload.js` | 所有上传功能共用 |
| Cloudinary 工具函数 | `utils/cloudinary.js` | 所有上传功能共用 |
| 用户编辑健康记录 | `PUT /api/health/owner/:catId` | `health.html` 用户编辑区 |
| 获取健康记录 | `GET /api/health/:catId` | `health.html` 显示 |
| 授权健康数据共享 | `POST /api/health/share` | `health.html` 授权开关 |
| 诊所上传官方报告 | `POST /api/clinic/reports/:catId` | `clinic-portal.html` |
| 诊所查看授权的猫咪列表 | `GET /api/clinic/cats` | `clinic-portal.html` |

> Member 5 需要在 **Phase 0 结束前**完成所有 Prisma 表的初始迁移并推送，其他成员才能开始写数据库相关代码。这是整个项目的关键依赖点。

---

### Member 6 — 聊天功能 + 救助机构后台
**对应文件**: `chat.routes.js`, `rescue.routes.js`, `chat.controller.js`, `rescue.controller.js`, `chat.js`, `rescue-dashboard.js`

| 任务 | API | 前端页面 |
|------|-----|---------|
| 发起聊天会话 | `POST /api/chat/conversations` | `adoption.html` 联系救助机构按钮 |
| 获取会话列表 | `GET /api/chat/conversations` | `adoption.html` 聊天入口 |
| 发送消息 | `POST /api/chat/conversations/:id/messages` | 聊天框发送按钮 |
| 获取消息历史 | `GET /api/chat/conversations/:id/messages` | 聊天框历史记录 |
| 上传图片消息 | `POST /api/chat/conversations/:id/upload` | 聊天框图片发送 |
| 救助机构登录（org账号） | `POST /api/auth/org/login`（与 Member 1 协作） | `rescue-dashboard.html` 登录 |
| 救助机构录入猫咪 | `POST /api/cats`（调用 Member 2 的接口） | `rescue-dashboard.html` 录入表单 |
| 审核领养申请 | `PUT /api/rescue/applications/:id/review` | `rescue-dashboard.html` 审核操作 |
| 查看领养申请列表 | `GET /api/rescue/applications` | `rescue-dashboard.html` 申请列表 |
| 领养数据分析看板 | `GET /api/rescue/analytics` | `rescue-dashboard.html` 图表区 |

> Member 6 的聊天功能 UI 嵌入在 `adoption.html` 页面的弹窗中，需要与 Member 2 协商弹窗的 HTML 结构，由 Member 2 在 `adoption.html` 中留出容器，Member 6 负责填充聊天逻辑。

---

## 8. 编码规范与强制约定

### 8.1 命名规范

```javascript
// 变量/函数: camelCase（驼峰）
const catProfile = {};
function getUserById(id) {}

// 常量: UPPER_SNAKE_CASE
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB

// 文件名: kebab-case（连字符）
// auth.routes.js  cats.controller.js

// 数据库字段: snake_case（下划线）
// user_id, created_at, adoption_status
```

### 8.2 目录引用规范

- 后端所有文件使用**相对路径**引用，如 `require('../middleware/auth')`
- 前端 JS 文件通过 `<script src="../js/config.js">` 引入，**config.js 必须在其他 JS 之前引入**

```html
<!-- 每个 HTML 页面底部的标准 script 顺序 -->
<script src="../js/config.js"></script>   <!-- 必须第一个 -->
<script src="../js/auth.js"></script>     <!-- 可选，只在需要用 token 时 -->
<script src="../js/xxx.js"></script>      <!-- 本页面专属 JS -->
```

### 8.3 错误处理规范

后端每个 controller 必须用 try/catch 包裹：

```javascript
// controllers/cats.controller.js 示例
async function getCatById(req, res) {
  try {
    const cat = await prisma.cat.findUnique({ where: { id: req.params.id } });
    if (!cat) {
      return res.status(404).json({ success: false, message: "猫咪不存在" });
    }
    res.json({ success: true, data: cat });
  } catch (error) {
    console.error("getCatById error:", error);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
}
```

前端每个 fetch 调用必须处理错误：

```javascript
// frontend/js/adoption.js 示例
async function loadCatFeed() {
  try {
    const response = await fetch(`${API_BASE_URL}/adoption/feed`, {
      headers: getAuthHeaders()
    });
    const result = await response.json();
    if (!result.success) {
      alert(result.message || "加载失败");
      return;
    }
    renderCatCards(result.data);
  } catch (error) {
    console.error("loadCatFeed error:", error);
    alert("网络错误，请检查后端是否启动");
  }
}
```

### 8.4 禁止事项

- **禁止**在代码里硬编码密码、密钥、数据库连接字符串（全部放 `.env`）
- **禁止**直接向 `main` 分支 push 代码（必须通过 Pull Request）
- **禁止**删除或修改其他人负责的 controller/route 文件，如需修改请先沟通
- **禁止**在 controller 里直接写 SQL 字符串（全部使用 Prisma API）
- **禁止**存储明文密码（必须使用 `bcryptjs.hash`）

---

## 9. 环境配置与启动说明

### 9.1 `.env.example` 模板（Member 1 创建，提交到 Git）

```env
# 后端服务
PORT=3000
NODE_ENV=development

# PostgreSQL 数据库
DATABASE_URL="postgresql://用户名:密码@localhost:5432/catface_dev"

# JWT
JWT_SECRET=替换为随机字符串至少32位
JWT_EXPIRES_IN=7d

# Cloudinary（图片存储，去 cloudinary.com 注册免费账号）
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

> 每位成员复制 `.env.example` 为 `.env`，填入自己本地的数据库密码。`.env` 文件绝不提交到 Git。

### 9.2 首次启动步骤

```bash
# 1. 克隆仓库
git clone https://github.com/[仓库地址]/catface.git
cd catface/backend

# 2. 安装依赖
npm install

# 3. 复制并填写环境变量
cp .env.example .env
# 用文本编辑器打开 .env，填写 DATABASE_URL 和 JWT_SECRET

# 4. 初始化数据库（Member 5 先执行，其他人后执行）
npx prisma migrate dev

# 5. 启动后端服务器
npm run dev
# 看到 "Server running on port 3000" 即为成功

# 6. 前端直接用浏览器打开 frontend/pages/index.html
```

### 9.3 `package.json` scripts 规范

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  }
}
```

---

## 10. 测试策略

### 10.1 接口测试（每人完成接口后立即测试）

使用 VS Code 插件 **Thunder Client**：
1. 安装插件后，在左侧面板找到 Thunder Client
2. 新建 Collection，命名为 `CatFace - [你的模块名]`
3. 对自己负责的每个接口都建一个请求，保存到 Collection

**测试顺序**:
1. 先测试无需 Token 的接口（注册/登录）
2. 登录获取 Token，复制到后续请求的 Authorization Header
3. 测试增删改查接口，确认数据库里真实写入了数据（用 pgAdmin 验证）

### 10.2 前端联调测试

每完成一个前端功能，用以下清单检查：

- [ ] 数据是否从真实 API 获取（不是写死的假数据）
- [ ] 未登录时是否跳转到登录页
- [ ] 提交表单后是否有成功/失败提示
- [ ] 刷新页面数据是否仍然显示（检查 localStorage 里有 Token）
- [ ] 浏览器控制台（F12）是否有报错

### 10.3 模块隔离测试（Phase 4，全员）

每人对自己模块做"破坏性测试"：
- 传入错误参数（空字符串、超长字符串、无效 ID）
- 不带 Token 访问需要登录的接口，检查是否返回 401
- 用错误角色身份访问（如普通用户访问机构接口），检查是否返回 403

---

## 11. Git 工作流程

> **完整的从零搭建教程见同目录下的 `GIT_GUIDE_FROM_ZERO.md`**，包含注册账号、安装工具、图形界面操作的每一步截图说明。

### 11.1 分支命名规范

| 成员 | 分支名 | 负责模块 |
|------|--------|---------|
| Member 1 | `feature/auth` | 后端基础 + 用户系统 |
| Member 2 | `feature/cats` | 猫咪档案 + 领养模块 |
| Member 3 | `feature/community` | 社区模块 |
| Member 4 | `feature/frontend` | 前端统筹 + 全局整合 |
| Member 5 | `feature/health` | 数据库 + 健康/诊所 |
| Member 6 | `feature/rescue` | 聊天功能 + 救助机构后台 |

### 11.2 Commit 消息格式

```
feat: 新功能       →  feat: 完成猫咪档案查询接口
fix: 修复 Bug      →  fix: 修复登录 token 过期未重定向的问题
db: 数据库变更     →  db: 添加 cat_tags 表迁移
style: 样式调整
docs: 文档更新
```

### 11.3 合并前必须满足

- [ ] 本地启动后端无报错
- [ ] Thunder Client 测试所有自己写的接口通过
- [ ] 前端页面在浏览器打开无控制台报错
- [ ] 不包含 `.env` 文件

---

## 12. 检查清单（合并前必看）

每人在向 `main` 发起 Pull Request 之前，自查以下内容：

### 后端检查

- [ ] 所有接口 URL 以 `/api/` 开头
- [ ] 所有响应格式包含 `success` + `data`/`error` + `message`
- [ ] 所有需要登录的接口使用了 `auth` 中间件
- [ ] 所有密码相关操作使用了 `bcryptjs`
- [ ] 所有 controller 函数有 try/catch
- [ ] 无硬编码的密钥或密码在代码里
- [ ] Prisma schema 变更已执行 `prisma migrate dev` 并提交迁移文件

### 前端检查

- [ ] 页面引入了 `config.js`（在其他 JS 之前）
- [ ] 所有 API 调用使用了 `API_BASE_URL`（不是写死 `localhost:3000`）
- [ ] 需要 Token 的请求使用了 `getAuthHeaders()`
- [ ] 未登录时有跳转到登录页的逻辑
- [ ] 无写死的假数据留在生产代码里

### 数据库检查（Member 5 专用）

- [ ] 新表/字段变更已写在 `schema.prisma`
- [ ] 执行 `prisma migrate dev --name 描述变更内容` 生成迁移文件
- [ ] 迁移文件已提交到 Git（`prisma/migrations/` 目录）
- [ ] 通知全员执行 `npx prisma migrate dev` 同步数据库

---

## 附录：快速参考

### 前端调用后端 API 的标准写法

```javascript
// GET 请求（不需要 body）
async function fetchCats() {
  const res = await fetch(`${API_BASE_URL}/cats`, {
    headers: getAuthHeaders()
  });
  const result = await res.json();
  return result.data;
}

// POST 请求（带 JSON body）
async function createPost(content, imageUrl) {
  const res = await fetch(`${API_BASE_URL}/community/posts`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ content, imageUrl })
  });
  const result = await res.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}

// 文件上传（multipart/form-data）
async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`${API_BASE_URL}/community/upload`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${getToken()}` }, // 注意：上传时不加 Content-Type
    body: formData
  });
  const result = await res.json();
  return result.data.url;
}
```

### 后端路由标准写法

```javascript
// backend/src/routes/cats.routes.js
const express = require('express');
const router = express.Router();
const { getCats, getCatById, createCat } = require('../controllers/cats.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getCats);                           // 需要登录
router.get('/:id', protect, getCatById);
router.post('/', protect, authorize('rescue_staff'), createCat); // 限制角色

module.exports = router;
```

```javascript
// backend/src/server.js 中注册路由
const catsRouter = require('./routes/cats.routes');
app.use('/api/cats', catsRouter);
```

---

*本文档由团队共同遵守。如有任何约定需要修改，须在团队群中讨论确认后，由 Member 1 更新本文档并通知全员。*
