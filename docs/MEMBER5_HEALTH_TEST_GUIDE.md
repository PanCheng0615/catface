# CatFace — Member 5 医疗信息互通功能测试指南

本文档用于验证"医疗信息互通功能"第一至第三阶段的实现是否正确工作。
字段命名以 `backend/prisma/schema.prisma` 为准。

---

## 一、环境准备

### 1.1 快速启动（一键脚本）

如果后端进程已被占用，先清理端口：

```powershell
# 查找占用 3000 端口的进程
netstat -ano | findstr :3000 | findstr LISTENING

# 如果有输出，杀掉对应 PID（把 <PID> 替换成实际数字）
taskkill /F /PID <PID>
```

### 1.2 启动后端

```powershell
cd e:\catface\catface\backend
npm run dev
```

终端出现 `Server running on port 3000` 即表示启动成功。

### 1.3 启动前端

新开一个终端：

```powershell
cd e:\catface\catface\frontend
python -m http.server 5500
```

浏览器打开：`http://localhost:5500`

### 1.4 健康检查

```bash
curl -s http://localhost:3000/api/healthcheck
```

期望返回：`{"success":true, "data":"OK", "message":"Server is running"}`

### 1.5 自动跑完全部 API 测试

后端启动后，在 `backend` 目录下运行：

```powershell
cd e:\catface\catface\backend
node test_health_apis.js
```

该脚本会自动创建测试账号、跑完全部 27 项 API 测试（CRUD、权限、跨诊所等），并打印 PASS/FAIL 结果。测试数据（账号、猫咪、记录、报告）会在最后自动清理。

---

## 二、测试账号准备

需要创建两类账号进行测试：

| 角色 | 用途 | 注册方式 |
|------|------|----------|
| 普通猫主人 | 用户端功能测试 | `frontend/pages/log-in.html` 注册（需要有猫） |
| 诊所工作人员 A | 第一家诊所，上传报告 + 认证 | `clinic-portal.html` 内置诊所注册表单 |
| 诊所工作人员 B | 第二家诊所，查看授权报告 | 同上 |

> **核心机制**：诊所账号必须同时存在于 `User` 表（role=clinic_staff）和 `Organization` 表（type=clinic）里，且两者的 `email` 必须一致，后端才能通过邮箱匹配找到诊所身份。因此不能使用普通用户注册入口，必须用诊所专用注册接口。

### 2.1 普通用户账号

在 `http://localhost:5500/pages/log-in.html` 点击 **Sign Up**，注册一个普通账号。

注册后需要做以下准备工作：

1. **添加猫咪档案** — 登录后进入猫咪管理页面，创建一只猫咪（记录 `CAT_ID`）
2. **确认猫咪 ID** — 猫咪管理页面 URL 或猫咪列表卡片上会有猫咪 ID

### 2.2 诊所账号

直接打开 `http://localhost:5500/pages/clinic-portal.html`，页面顶部有"开发测试面板"，可以：

**第一次使用（注册）**：
1. 填写诊所名称（如"阳光宠物医院"）
2. 填写机构邮箱（如 `clinic_a@test.com`）
3. 填写密码（至少 6 位）
4. 可选填电话和地址
5. 点击"注册诊所"

**已有账号（登录）**：
1. 在"已有帳號？"右侧填入机构邮箱和密码
2. 点击"登入"

> 注册成功后会**自动登入**，无需额外操作。登入后可在面板中看到：
> - 诊所名称
> - Organization ID（用于用户端授权对照）
> - Token 前 40 位（调试用）

**需要几个诊所就重复几次**（例如诊所 A 和诊所 B），每次用不同的邮箱即可。

### 2.3 获取测试数据 ID

测试过程中需要以下数据 ID，请提前记录（替换为你实际的值）：

| 变量 | 说明 | 获取方式 |
|------|------|----------|
| `CAT_ID` | 测试猫咪 ID | 猫咪管理页面 URL 或猫咪卡片 |
| `CLINIC_A_ORG_ID` | 诊所A的 Organization ID | `clinic-portal.html` 开发面板中显示 |
| `CLINIC_B_ORG_ID` | 诊所B的 Organization ID | 同上 |
| 用户 Token | 普通用户 JWT | 浏览器开发者工具 → Application → Local Storage → catface_token |

### 2.4 账号对应关系图

```
┌─────────────────────────────────┐
│  普通猫主人                      │
│  - 拥有 CAT_ID                  │
│  - 在 health.html 授权给诊所     │
└────────────┬────────────────────┘
             │ 授权（cat_id + org_id + is_allowed=true）
             ▼
┌─────────────────────────────────┐
│  Organization 表（type=clinic） │
│  - CLINIC_A_ORG_ID             │
│  - CLINIC_B_ORG_ID             │
└────────────┬────────────────────┘
             │ 关联（同一 email）
             ▼
┌─────────────────────────────────┐
│  User 表（role=clinic_staff）   │
│  - clinic_a@test.com            │
│  - clinic_b@test.com            │
└─────────────────────────────────┘
             │
             ▼ 登录后自动带 org_id
┌─────────────────────────────────┐
│  clinic-portal.html             │
│  - 看到授权猫咪列表              │
│  - 上传报告 / 添加认证           │
└─────────────────────────────────┘
```

---

## 三、API 测试（后端逐接口验证）

### 3.1 健康记录 API

#### 获取猫咪健康记录

```bash
curl -s http://localhost:3000/api/health/records/{CAT_ID} `
  -H "Authorization: Bearer {USER_TOKEN}"
```

期望：`{"success":true, "data": {...}}`，包含 `cat`、`owner_records`、`clinic_reports`、`share_permissions`。

#### 新增用户健康记录

```bash
curl -s -X POST http://localhost:3000/api/health/records/{CAT_ID} `
  -H "Authorization: Bearer {USER_TOKEN}" `
  -H "Content-Type: application/json" `
  -d "{\"record_type\": \"vaccine\", \"description\": \"猫三联疫苗第一针\", \"date\": \"2026-04-10\", \"next_due_date\": \"2026-05-10\", \"weight_kg\": 4.5, \"vet_name\": \"陈医生\", \"clinic_name\": \"测试宠物医院\"}"
```

期望：返回新建记录，含 `id` 字段。记录 `RECORD_ID`。

#### 修改用户健康记录

```bash
curl -s -X PUT http://localhost:3000/api/health/records/{RECORD_ID} `
  -H "Authorization: Bearer {USER_TOKEN}" `
  -H "Content-Type: application/json" `
  -d "{\"description\": \"更新为猫三联疫苗第二针\", \"weight_kg\": 4.8}"
```

期望：`{"success":true, "data": {...}}`，描述已更新。

#### 删除用户健康记录

```bash
curl -s -X DELETE http://localhost:3000/api/health/records/{RECORD_ID} `
  -H "Authorization: Bearer {USER_TOKEN}"
```

期望：`{"success":true}`。

#### 验证：缺少必填字段

```bash
curl -s -X POST http://localhost:3000/api/health/records/{CAT_ID} `
  -H "Authorization: Bearer {USER_TOKEN}" `
  -H "Content-Type: application/json" `
  -d "{\"description\": \"no record_type\"}"
```

期望：返回 `{"success":false, "error":"ValidationError", ...}`，HTTP 状态码 **422**。

### 3.2 诊所列表 API

```bash
curl -s http://localhost:3000/api/health/clinics `
  -H "Authorization: Bearer {USER_TOKEN}"
```

期望：返回所有 `type=clinic` 的机构列表（包含 `id`、`name` 等字段）。

> **验证点**：确认返回的诊所列表可以在前端"授权管理"的下拉选择器中正确展示。

### 3.3 诊所授权 API

#### 查看某猫的诊所授权列表

```bash
curl -s http://localhost:3000/api/health/share/{CAT_ID} `
  -H "Authorization: Bearer {USER_TOKEN}"
```

期望：`{"success":true, "data": [...]}`（初始为空）。

#### 设置/更新授权（Upsert）

```bash
curl -s -X POST http://localhost:3000/api/health/share `
  -H "Authorization: Bearer {USER_TOKEN}" `
  -H "Content-Type: application/json" `
  -d "{\"cat_id\": \"{CAT_ID}\", \"org_id\": \"{CLINIC_A_ORG_ID}\", \"is_allowed\": true, \"permission_type\": \"full\", \"expires_at\": \"2026-12-31\", \"note\": \"用于年度体检\"}"
```

期望：`{"success":true, "data": {"id": "...", "is_allowed": true, "permission_type": "full", ...}}`。

再次调用（更新授权）：

```bash
curl -s -X POST http://localhost:3000/api/health/share `
  -H "Authorization: Bearer {USER_TOKEN}" `
  -H "Content-Type: application/json" `
  -d "{\"cat_id\": \"{CAT_ID}\", \"org_id\": \"{CLINIC_A_ORG_ID}\", \"is_allowed\": false, \"permission_type\": \"read_only\"}"
```

期望：`is_allowed` 变为 `false`，`permission_type` 变为 `read_only`（Upsert 生效）。

#### 验证：缺少必填字段

```bash
curl -s -X POST http://localhost:3000/api/health/share `
  -H "Authorization: Bearer {USER_TOKEN}" `
  -H "Content-Type: application/json" `
  -d "{\"cat_id\": \"{CAT_ID}\", \"org_id\": \"{CLINIC_A_ORG_ID}\"}"
```

期望：返回 HTTP **422**，错误信息提示 `is_allowed` 为必填项。

### 3.4 诊所端 API

> 以下 API 均需登录且角色为 `clinic_staff`，使用 `CLINIC_A_TOKEN`。

#### 获取已授权猫咪列表

```bash
curl -s http://localhost:3000/api/clinic/cats `
  -H "Authorization: Bearer {CLINIC_A_TOKEN}"
```

期望：返回已授权给该诊所的猫咪列表（包含猫咪信息和主人信息）。

> **前置条件**：用户已对诊所A 设置 `is_allowed: true` 的授权。

#### 上传诊所报告（含扩展字段）

```bash
curl -s -X POST http://localhost:3000/api/clinic/reports/{CAT_ID} `
  -H "Authorization: Bearer {CLINIC_A_TOKEN}" `
  -H "Content-Type: application/json" `
  -d "{\"report_type\": \"vaccination\", \"description\": \"妙三多疫苗接种完成\", \"findings\": \"猫咪健康状况良好，无异常反应\", \"recommendations\": \"14天后补种第二针，注意观察体温\", \"vet_name\": \"李医生\", \"vet_license\": \"VET-2026-001\", \"org_name\": \"测试诊所A\", \"date\": \"2026-04-15\"}"
```

期望：`{"success":true, "data": {...}}`，包含所有扩展字段（`findings`、`recommendations`、`vet_name`、`vet_license`、`org_name`）。记录 `REPORT_ID`。

#### 查看单份诊所报告

```bash
curl -s http://localhost:3000/api/clinic/reports/{REPORT_ID} `
  -H "Authorization: Bearer {CLINIC_A_TOKEN}"
```

期望：返回报告详情，含猫咪和机构信息。

#### 修改诊所报告

```bash
curl -s -X PUT http://localhost:3000/api/clinic/reports/{REPORT_ID} `
  -H "Authorization: Bearer {CLINIC_A_TOKEN}" `
  -H "Content-Type: application/json" `
  -d "{\"description\": \"更新描述\", \"findings\": \"更新检查结论\"}"
```

期望：报告描述已更新。

#### 删除诊所报告

```bash
curl -s -X DELETE http://localhost:3000/api/clinic/reports/{REPORT_ID} `
  -H "Authorization: Bearer {CLINIC_A_TOKEN}"
```

期望：`{"success":true}`。

#### 生成专业报告打印视图

```bash
curl -s http://localhost:3000/api/clinic/reports/{REPORT_ID}/print `
  -H "Authorization: Bearer {CLINIC_A_TOKEN}"
```

期望：返回 JSON，含 `data.html` 字段，为 HTML 格式的专业报告模板，包含诊所名称、报告编号、猫咪信息、主人信息、主治兽医、执照号、检查结论、医嘱建议、附件等完整字段。

> **验证点**：在浏览器中访问该 API（需要带上 Token），返回的 HTML 可直接 Ctrl+P 打印或另存为 PDF。

#### 诊所对用户记录添加官方认证

> **前置条件**：用户已添加至少一条健康记录（`RECORD_ID`）。

```bash
curl -s -X POST http://localhost:3000/api/clinic/records/{RECORD_ID}/endorse `
  -H "Authorization: Bearer {CLINIC_A_TOKEN}" `
  -H "Content-Type: application/json" `
  -d "{\"endorsement\": \"经本诊所核实，该疫苗记录真实有效。\", \"note\": \"疫苗批次号：20260401\"}"
```

期望：`{"success":true, "data": {...}}`。

再次调用（更新认证）：

```bash
curl -s -X POST http://localhost:3000/api/clinic/records/{RECORD_ID}/endorse `
  -H "Authorization: Bearer {CLINIC_A_TOKEN}" `
  -H "Content-Type: application/json" `
  -d "{\"endorsement\": \"经本诊所核实，该疫苗记录真实有效（已更新）。\", \"note\": \"疫苗批次号：20260401A\"}"
```

期望：认证内容已更新（同一条记录，Upsert）。

#### 诊所查看用户记录详情

```bash
curl -s http://localhost:3000/api/clinic/records/{RECORD_ID} `
  -H "Authorization: Bearer {CLINIC_A_TOKEN}"
```

期望：返回用户记录详情，包含诊所认证信息（`endorsements` 嵌套数组，含诊所名称和认证内容）。

#### 诊所端授权统计

```bash
curl -s http://localhost:3000/api/clinic/permissions `
  -H "Authorization: Bearer {CLINIC_A_TOKEN}"
```

期望：返回该诊所的所有授权记录，含统计信息（总数/活跃/过期等）。

### 3.5 跨诊所授权测试

> 验证第二家诊所的授权查看能力。

1. 用户对诊所B 设置 `is_allowed: true` 授权
2. 诊所B 用自己的 Token 调用 `GET /api/clinic/cats`
3. 期望：能看到该猫咪（即使诊所B从未给这只猫上传过报告）
4. 期望：能看到诊所A上传的报告（通过授权获取）
5. 期望：能看到该猫的所有用户健康记录

### 3.6 权限边界测试

```bash
# 普通用户访问诊所 API → 期望 403
curl -s http://localhost:3000/api/clinic/cats `
  -H "Authorization: Bearer {USER_TOKEN}"
# HTTP 403

# 未登录访问诊所 API → 期望 401
curl -s http://localhost:3000/api/clinic/cats
# HTTP 401
```

---

## 四、前端页面测试

### 4.1 用户端 — `health.html`

浏览器打开：`http://localhost:5500/pages/health.html`

登录后选择一个有猫咪的账号（`USER_TOKEN` 对应的账号）。

#### 4.1.1 用户健康记录区域

| 测试项 | 操作 | 期望结果 |
|--------|------|----------|
| 记录列表展示 | 进入健康页面 | 显示该猫的所有健康记录卡片 |
| 新增记录 | 点击"新增记录"按钮，填写疫苗类型 | 记录成功创建并显示在列表中 |
| 编辑记录 | 点击记录卡片的编辑按钮，修改描述 | 记录更新，显示新内容 |
| 删除记录 | 点击删除按钮 | 记录从列表移除 |
| 认证徽章 | 在有认证的记录上 | 显示诊所认证徽章（诊所名 + 认证内容 + 备注） |

#### 4.1.2 诊所报告区域

| 测试项 | 操作 | 期望结果 |
|--------|------|----------|
| 报告列表 | 切换到"诊所报告"标签页 | 显示所有诊所上传的报告卡片 |
| 报告扩展字段 | 查看诊所报告卡片 | 显示：主治兽医、检查结论、医嘱建议、兽医执照号 |
| 打印报告 | 点击报告卡片的"打印"按钮 | 新窗口/新标签页打开专业报告 HTML |
| 打印预览 | Ctrl+P 打开打印预览 | 显示完整报告，可另存为 PDF |

#### 4.1.3 授权管理区域

| 测试项 | 操作 | 期望结果 |
|--------|------|----------|
| 诊所下拉选择器 | 切换到"授权管理"标签页 | 显示所有诊所的下拉选择列表（非手动输入ID） |
| 精细化授权 | 选择诊所，设置权限类型/过期时间/备注 | 授权成功，显示在授权列表中 |
| 更新授权 | 修改已存在的授权（切换允许/拒绝） | 授权状态更新 |
| 授权状态 | 查看授权列表 | 显示每条授权的状态（允许/拒绝）、类型、过期时间、备注 |

### 4.2 诊所端 — `clinic-portal.html`

用诊所工作人员账号登录（`CLINIC_A_TOKEN`）。

浏览器打开：`http://localhost:5500/pages/clinic-portal.html`

#### 4.2.1 统计面板

| 测试项 | 操作 | 期望结果 |
|--------|------|----------|
| 统计面板 | 进入诊所门户页面 | 显示：已授权病患数、已上传报告数、已认证记录数 |

#### 4.2.2 上传报告表单

| 测试项 | 操作 | 期望结果 |
|--------|------|----------|
| 报告扩展字段表单 | 在上传报告表单中 | 显示：报告类型、描述、主治兽医姓名、兽医执照号、检查结论、医嘱建议、文件上传、日期 |
| 文件上传 | 上传一张图片或 PDF | 文件上传成功，`file_url` 字段填充 |
| 提交报告 | 填写完整表单并提交 | 报告成功创建，显示在报告列表中 |
| 报告列表 | 查看已上传报告 | 显示报告卡片，含扩展字段信息 |

#### 4.2.3 主人记录区与认证

| 测试项 | 操作 | 期望结果 |
|--------|------|----------|
| 查看已授权猫咪 | 查看左侧猫咪列表 | 显示已授权猫咪列表 |
| 查看猫咪详情 | 点击某只猫咪 | 右侧显示该猫的用户记录和诊所报告 |
| 添加认证 | 在某条用户记录上点击"添加认证" | 弹出认证 Modal |
| 认证 Modal | 填写认证说明和备注，提交 | 认证成功，记录显示诊所认证徽章 |
| 更新认证 | 对已有认证的记录再次点击"更新认证" | Modal 预填当前认证内容，提交后更新 |
| 关闭 Modal | 点击关闭按钮或 Modal 外区域 | Modal 正常关闭 |

#### 4.2.4 专业报告打印

| 测试项 | 操作 | 期望结果 |
|--------|------|----------|
| 打印按钮 | 在报告卡片上点击"打印" | 新窗口打开专业报告模板 HTML |
| 报告内容完整性 | 查看打印模板 | 包含：机构名称、报告编号、日期、猫猫信息、主人信息、主治兽医（含执照号）、报告类型、检查结论、医嘱建议、附件 |

---

## 五、跨功能集成测试

### 5.1 完整授权-报告-查看流程

```
用户（诊所A授权）
    │
    ▼
1. 用户登录 health.html，给诊所A授权（允许，完全访问）
    │
    ▼
2. 诊所A登录 clinic-portal.html，看到授权猫咪
    │
    ▼
3. 诊所A为该猫上传一份体检报告（含所有扩展字段）
    │
    ▼
4. 诊所A为用户的一条疫苗记录添加官方认证
    │
    ▼
5. 用户登录 health.html
    │
    ▼
6. 查看诊所报告区域，看到诊所A的报告（含打印按钮）
    │
    ▼
7. 点击打印，验证专业报告模板
    │
    ▼
8. 查看用户记录区域，看到认证徽章
```

### 5.2 跨诊所信息互通流程

```
用户（在诊所A获取报告）
    │
    ▼
1. 用户给诊所B授权（仅查看权限）
    │
    ▼
2. 诊所B登录 clinic-portal.html
    │
    ▼
3. 在授权猫咪列表中看到该猫（即便诊所B从未见过这只猫）
    │
    ▼
4. 点击猫咪，看到诊所A上传的报告（通过授权获取）
    │
    ▼
5. 诊所B可上传自己的报告
    │
    ▼
6. 用户在 health.html 看到来自诊所A和诊所B的报告
```

---

## 六、边界条件与异常测试

| 测试项 | 操作 | 期望结果 |
|--------|------|----------|
| 未登录访问 | 不带 Token 访问任何 API | 返回 401 Unauthorized |
| 普通用户访问诊所 API | 用 `USER_TOKEN` 访问 `/api/clinic/*` | 返回 403 Forbidden |
| 未授权猫咪 | 诊所尝试上传报告给未授权的猫 | 返回 403 或相应权限错误 |
| 上传报告不填扩展字段 | 仅填写必填字段（report_type, description, date） | 报告创建成功，可选字段为空 |
| 授权过期时间 | 设置一个过去的过期时间 | 授权仍可创建（业务层可选择是否主动拦截已过期的授权） |
| 重复认证 | 同一家诊所对同一记录两次调用 endorse | Upsert，更新而非重复创建 |
| 删除有认证的记录 | 删除一条有诊所认证的用户记录 | 关联的认证记录随级联删除 |
| 文件上传失败 | 上传超过限制的文件或无文件上传 | 返回相应错误信息 |

---

## 七、测试数据清理

测试完成后，可通过以下方式清理测试数据：

```bash
# 删除用户健康记录
curl -s -X DELETE http://localhost:3000/api/health/records/{RECORD_ID} `
  -H "Authorization: Bearer {USER_TOKEN}"

# 删除诊所报告
curl -s -X DELETE http://localhost:3000/api/clinic/reports/{REPORT_ID} `
  -H "Authorization: Bearer {CLINIC_A_TOKEN}"

# 删除授权（设置为拒绝）
curl -s -X POST http://localhost:3000/api/health/share `
  -H "Authorization: Bearer {USER_TOKEN}" `
  -H "Content-Type: application/json" `
  -d "{\"cat_id\": \"{CAT_ID}\", \"org_id\": \"{CLINIC_A_ORG_ID}\", \"is_allowed\": false}"
```

> 使用 `node test_health_apis.js` 运行自动化测试时，以上清理步骤会在脚本末尾自动执行。

---

## 八、测试检查清单

| # | 功能点 | 状态 |
|---|--------|------|
| 1 | 后端服务启动成功 | [ ] |
| 2 | 前端页面可访问 | [ ] |
| 3 | 用户健康记录 CRUD | [ ] |
| 4 | 诊所列表 API（含授权下拉选择） | [ ] |
| 5 | 授权精细化（权限类型/过期时间/备注） | [ ] |
| 6 | 诊所报告上传（含扩展字段） | [ ] |
| 7 | 诊所报告查看/修改/删除 | [ ] |
| 8 | 诊所端授权猫咪列表 | [ ] |
| 9 | 诊所端报告统计面板 | [ ] |
| 10 | 诊所对用户记录添加认证 | [ ] |
| 11 | 诊所更新已有认证 | [ ] |
| 12 | 诊所查看用户记录详情（含认证） | [ ] |
| 13 | 用户端查看认证徽章 | [ ] |
| 14 | 专业报告打印模板（HTML） | [ ] |
| 15 | 用户端报告卡片显示扩展字段 | [ ] |
| 16 | 跨诊所授权查看 | [ ] |
| 17 | 权限分层正确（普通用户 vs 诊所） | [ ] |
| 18 | 未登录访问返回 401 | [ ] |
| 19 | 边界条件测试（422 验证错误） | [ ] |
| 20 | 数据清理正常 | [ ] |

---

## 九、最近修复记录

### 2026-04-18 — v1.1 修复

| # | 问题 | 修复方式 |
|---|------|----------|
| 1 | `_prisma_migrations` 表缺失，导致 `prisma migrate` 无法识别已应用的迁移 | 手动创建表并插入 6 条迁移记录（baseline） |
| 2 | `HealthSharePermission` 模型缺少 `org` 关联字段，`GET /api/health/share/:catId` 报 500 | 在 schema 中添加 `org Organization` 关系字段及反向关联 |
| 3 | `GET /api/clinic/reports/:reportId` 路由缺失 | 新增 controller 方法和路由注册 |

---

> 测试指南版本：v1.1（基于 2026-04-18 实现状态）
> 覆盖范围：第一阶段至第三阶段完整功能
