# CatFace — Member 2 领养模块测试说明（给 Member 4）

本文档汇总领养相关后端接口与 `adoption.html` 前端的联调测试步骤，字段命名以 `backend/prisma/schema.prisma` 为准。

---

## 一、环境与代码

1. **拉取最新代码**（含 Prisma 迁移、`preferred_color` 等变更）

   ```bash
   git pull
   ```

2. **数据库**

   - 已安装 PostgreSQL，数据库名与项目 `backend/.env` 中 `DATABASE_URL` 一致（例如 `catface_dev`）。

3. **后端依赖与 Prisma**（在 `backend` 目录）

   ```bash
   cd backend
   npm install
   npx prisma migrate dev
   npx prisma generate
   ```

4. **环境变量**

   - 复制 `backend/.env.example` 为 `backend/.env`（若尚未配置）。
   - 填写：`DATABASE_URL`、`JWT_SECRET`（建议至少 32 位随机串）。

5. **启动后端**

   ```bash
   cd backend
   npm run dev
   ```

   终端出现 `Server running on port 3000` 即表示启动成功。

6. **健康检查**（新开终端；**URL 请用双引号**，避免 zsh 对 `?` 做通配符展开）

   ```bash
   curl -s http://localhost:3000/health
   ```

   期望返回 JSON 中含 `"success":true`。

7. **前端**

   - 浏览器打开 `frontend/pages/adoption.html`（或通过团队静态服务访问）。
   - `frontend/js/config.js` 中 `API_BASE_URL` 需指向当前后端（默认 `http://localhost:3000/api`）。

---

## 二、字段命名约定

- 请求体、响应体字段名以 **`backend/prisma/schema.prisma`** 为唯一标准。
- 领养相关示例：`cat_id`、`liked`、`preferred_age`、`preferred_gender`、`preferred_breed`、`preferred_color`、`message`、`status` 等。

---

## 三、准备测试账号（curl）

### 1）救助端账号（用于 `POST /api/cats` 建档）

```bash
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"rescue@test.com","password":"123456","username":"rescueuser","display_name":"Rescue","role":"rescue_staff"}'
```

若提示邮箱已存在，则改为登录：

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rescue@test.com","password":"123456"}'
```

从返回 JSON 中复制 **`data.token`**，记为 **`<RESCUE_TOKEN>`**。

### 2）普通用户（领养流程）

```bash
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"123456","username":"normaluser","display_name":"TestUser","role":"user"}'
```

若已注册则登录，复制 **`data.token`**，记为 **`<USER_TOKEN>`**。

---

## 四、后端接口测试清单（建议顺序）

将下面命令中的 **`<USER_TOKEN>`** / **`<RESCUE_TOKEN>`** 替换为真实 Bearer Token。

### 1. 救助端：创建猫咪（建议至少 1～3 只）

```bash
curl -s -X POST http://localhost:3000/api/cats \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <RESCUE_TOKEN>" \
  -d '{"name":"Mimi","breed":"British Shorthair","age_months":6,"gender":"female","color":"gray","tags":[{"tag":"Gentle / Calm"}]}'
```

记录返回中每只猫的 **`id`**（UUID），后续滑动、申请需使用。

### 2. 用户：保存领养偏好（含 `preferred_color`）

```bash
curl -s -X POST http://localhost:3000/api/adoption/preferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -d '{"preferred_gender":"female","preferred_age":"kitten","preferred_breed":"British Shorthair","preferred_color":"gray"}'
```

期望：`success: true`，`data` 中含 `preferred_color`。

### 3. 推荐列表

```bash
curl -s "http://localhost:3000/api/adoption/feed?limit=10" \
  -H "Authorization: Bearer <USER_TOKEN>"
```

期望：返回尚未滑动过的可领养猫；含 `recommendation_score`、`score_breakdown`（含 `preferred_color` 等维度）。

### 4. 记录滑动（右滑喜欢 / 左滑不喜欢）

将 **`<CAT_ID>`** 替换为真实猫的 `id`：

```bash
curl -s -X POST http://localhost:3000/api/adoption/swipe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -d '{"cat_id":"<CAT_ID>","liked":true}'
```

```bash
curl -s -X POST http://localhost:3000/api/adoption/swipe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -d '{"cat_id":"<CAT_ID>","liked":false}'
```

### 5. 已喜欢列表

```bash
curl -s http://localhost:3000/api/adoption/liked \
  -H "Authorization: Bearer <USER_TOKEN>"
```

### 6. 滑动历史

```bash
curl -s http://localhost:3000/api/adoption/swipes \
  -H "Authorization: Bearer <USER_TOKEN>"
```

### 7. 提交领养申请

```bash
curl -s -X POST http://localhost:3000/api/adoption/applications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -d '{"cat_id":"<CAT_ID>","message":"Test application from Member 4."}'
```

期望：成功；或业务校验失败（例如同一只猫已有 **pending** 申请）。

### 8. 我的申请列表

```bash
curl -s http://localhost:3000/api/adoption/applications/me \
  -H "Authorization: Bearer <USER_TOKEN>"
```

### 9. 取消申请（仅 **pending** 可删）

将 **`<APPLICATION_ID>`** 替换为上一步返回的申请 `id`：

```bash
curl -s -X DELETE "http://localhost:3000/api/adoption/applications/<APPLICATION_ID>" \
  -H "Authorization: Bearer <USER_TOKEN>"
```

### 10. 单猫详情（前端从申请进入详情也会使用）

```bash
curl -s http://localhost:3000/api/cats/<CAT_ID> \
  -H "Authorization: Bearer <USER_TOKEN>"
```

### 11. 推荐权重（需 **admin** 或 **rescue_staff**）

```bash
curl -s http://localhost:3000/api/adoption/scoring-config \
  -H "Authorization: Bearer <RESCUE_TOKEN>"
```

---

## 五、前端 `adoption.html` 建议测试项

1. **登录**：`localStorage` 中存在 `catface_token`（或通过团队登录页登录后再打开领养页）。
2. **推荐卡片**：能加载推荐数据（与 `/api/adoption/feed` 逻辑一致）。
3. **左右滑**：操作后刷新或重新进入页面，与后端滑动记录一致。
4. **Preferences**：保存后与后端偏好一致（若页面已接 `preferred_color`，需一并验证）。
5. **Liked Cats**：顶部/侧栏数量与列表内容一致，无「有数字、列表空白」错位。
6. **My Applications**：列表与状态（Pending / Approved / Rejected）；**View Full Profile** 在无独立 `cat-profile.html` 时仍能加载详情；**Cancel Application** 对 **pending** 申请可取消。
7. **硬刷新**（如 macOS：`Cmd+Shift+R`）后上述行为仍正常。

---

## 六、常见问题

| 现象 | 处理 |
|------|------|
| zsh：`no matches found`（URL 含 `?`） | 给 URL 加双引号，例如：`curl -s "http://localhost:3000/api/adoption/feed?limit=10"` |
| 改代码后接口行为未变 | 重启 `npm run dev` |
| `401 Unauthorized` | Token 过期或无效，重新执行 login |
| Prisma / 数据库报错 | 确认已执行 `npx prisma migrate dev` 且与仓库迁移一致 |

---

## 七、反馈时请附带

- 出问题的 **HTTP 方法 + 路径**；
- **请求体**（如有）与 **响应 JSON**（可打码 `token`）；
- 浏览器 **Console / Network** 截图或文字说明（前端问题时）；
- 终端完整报错（后端或 migrate 问题时）。

---

## 八、给 Member 4 的一句话说明

> 请按「环境 → 双账号 Token → 第四节 curl 顺序 → 第五节浏览器」完整跑一遍；字段名以 `schema.prisma` 为准；有问题把请求、响应（可打码 token）和终端报错贴回。

---

*文档维护：Member 2（领养模块）*
