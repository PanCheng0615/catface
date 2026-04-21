# CatFace 健康管理模块演讲稿 / Health Module Presentation Script
## 中英对照 · 7-8 分钟

---

## Part 1 — 开场介绍 / Opening (约 30 秒 | ~30s)

**中文：**

大家好，我是 Member 5，负责 CatFace 健康管理模块的后端和诊所端开发。今天我向大家汇报 Health 和 Clinic 这两个模块的设计与实现。

**English:**

Hello everyone, I'm Member 5, responsible for the backend and clinic-side development of CatFace's health management module. Today I'll present the design and implementation of the Health and Clinic modules.

---

## Part 2 — 背景与需求 / Background & Motivation (约 1 分钟 | ~1 min)

**中文：**

传统的猫咪健康档案管理存在三个核心痛点：

第一，**信息孤岛**——猫主人自己记录的健康数据，和宠物医院的诊断报告完全隔离，医生看病时往往无法看到完整病史。

第二，**缺乏可信认证**——主人自己写的疫苗记录，诊所无法验证真伪，容易导致重复接种或漏诊。

第三，**授权管理混乱**——猫主人无法控制哪些诊所可以查看自己猫咪的数据，隐私安全无法保障。

我们的目标，就是用一个统一的健康管理模块，把猫主人、救助机构、宠物诊所这三方连接起来。

**English:**

Traditional cat health record management has three core pain points:

First, **information silos** — health data recorded by the owner and diagnostic reports from the vet are completely isolated. Doctors often can't see the complete medical history.

Second, **lack of trusted certification** — vaccination records written by the owner can't be verified by the clinic, easily leading to repeated vaccinations or missed diagnoses.

Third, **chaotic authorization** — cat owners have no control over which clinics can access their cat's data, leaving privacy and security unprotected.

Our goal is to use a unified health management module to connect three parties: cat owners, rescue organizations, and pet clinics.

---

## Part 3 — 系统架构总览 / System Architecture (约 1 分钟 | ~1 min)

**中文：**

整个系统分为前后两端，共 6 个核心数据模型：

- `OwnerHealthRecord` — 猫主人自己创建的健康记录（疫苗、驱虫、体检等）
- `ClinicHealthReport` — 宠物诊所上传的官方医疗报告
- `ClinicRecordEndorsement` — 诊所对主人记录的官方认证背书
- `HealthSharePermission` — 猫主人授权某诊所查看数据的权限控制
- `NotificationRead` — 通知已读状态记录
- `Organization` — 扩展支持 rescue 和 clinic 两种机构类型

前端有三个入口：用户端通过 `/pages/health.html` 管理健康档案，诊所端通过 `/pages/clinic-portal.html` 上传报告和审批背书，救助机构通过自己的 Dashboard 统一管理。

**English:**

The system is divided into frontend and backend, with 6 core data models:

- `OwnerHealthRecord` — health records created by the cat owner (vaccination, deworming, checkup, etc.)
- `ClinicHealthReport` — official medical reports uploaded by pet clinics
- `ClinicRecordEndorsement` — the clinic's official certification endorsement of owner records
- `HealthSharePermission` — permission control for cat owners authorizing clinics to view data
- `NotificationRead` — notification read status records
- `Organization` — extended to support both rescue and clinic organization types

The frontend has three entry points: users manage health records through `/pages/health.html`, clinics upload reports and process endorsements via `/pages/clinic-portal.html`, and rescue organizations manage everything through their own Dashboard.

---

## Part 4 — 用户端健康档案 / User-Side Health Module (约 1.5 分钟 | ~1.5 min)

**中文：**

用户端（`health.html` + `health.js`）提供三个主要功能：

**功能一：添加健康记录**
用户可以为猫咪添加疫苗、驱虫、体检、治疗、手术等类型的记录。系统支持上传附件（图片或 PDF），并可设置下次提醒日期——比如疫苗接种后自动计算一年后的加强针时间。

```
API: POST /api/health/records/:catId
```

**功能二：查看诊所报告**
用户可以查看所有已授权诊所上传的官方报告。每份报告包含检查结论、医嘱建议、兽医签名、机构盖章等信息。用户还可以直接打印报告——系统会生成一份专业的医疗报告 HTML，支持浏览器打印为 PDF。

```
API: GET /api/clinic/reports/:reportId/print
```

**功能三：授权管理**
用户可以授权或撤销诊所的访问权限，支持"完全访问"（可上传报告）或"仅查看"两种模式，并可设置有效期。

```
API: POST /api/health/share
```

**English:**

The user side (`health.html` + `health.js`) provides three main features:

**Feature 1: Add Health Records**
Users can add records of types including vaccination, deworming, checkup, treatment, and surgery. The system supports file attachments (images or PDFs) and next-reminder dates — for example, automatically calculating the booster shot date one year after vaccination.

```
API: POST /api/health/records/:catId
```

**Feature 2: View Clinic Reports**
Users can view official reports uploaded by all authorized clinics. Each report contains examination findings, recommendations, vet signature, and clinic seal. Users can also print the report directly — the system generates a professional medical report HTML that supports browser printing to PDF.

```
API: GET /api/clinic/reports/:reportId/print
```

**Feature 3: Authorization Management**
Users can grant or revoke clinic access, supporting "Full Access" (can upload reports) or "Read Only" modes, with optional expiration dates.

```
API: POST /api/health/share
```

---

## Part 5 — 诊所端管理 / Clinic-Side Management (约 1.5 分钟 | ~1.5 min)

**中文：**

诊所端（`clinic-portal.html`）为宠物医院工作人员提供完整的猫咪健康管理后台：

**猫咪档案管理**
诊所登录后，只能看到已获得猫咪主人明确授权的患者列表。未授权或授权过期的猫咪不会显示在列表中。

```
API: GET /api/clinic/cats
```

**上传官方报告**
诊所可以为授权猫咪上传官方医疗报告，包含报告类型（疫苗接种、驱虫、血液检验、手术等）、检查结论、医嘱建议、兽医姓名和执照编号。系统会自动校验授权状态和权限类型。

```
API: POST /api/clinic/reports/:catId
```

**认证主人记录**
诊所还可以对猫主人自行记录的健康档案进行官方背书——"已确认此记录真实有效"。这条背书会显示在用户的健康护照页上，作为可信来源的标志。

```
API: POST /api/clinic/records/:recordId/endorse
```

**授权统计面板**
诊所工作人员可以在后台看到自己的授权统计：总授权数、活跃授权、已过期授权、待审批授权，一目了然。

```
API: GET /api/clinic/permissions
```

**English:**

The clinic side (`clinic-portal.html`) provides a complete cat health management backend for pet hospital staff:

**Cat Profile Management**
After logging in, clinics can only see patients for whom they have explicit authorization from the cat owner. Unauthorized or expired cats are not shown in the list.

```
API: GET /api/clinic/cats
```

**Upload Official Reports**
Clinics can upload official medical reports for authorized cats, including report type (vaccination, deworming, blood test, surgery, etc.), examination findings, recommendations, vet name, and license number. The system automatically validates authorization status and permission type.

```
API: POST /api/clinic/reports/:catId
```

**Certify Owner Records**
Clinics can also provide official endorsements for health records created by cat owners — "Confirmed as authentic and valid." This endorsement is displayed on the user's health passport page as a trusted source indicator.

```
API: POST /api/clinic/records/:recordId/endorse
```

**Authorization Statistics Panel**
Clinic staff can view their authorization statistics in the backend: total authorizations, active, expired, and pending — all at a glance.

```
API: GET /api/clinic/permissions
```

---

## Part 6 — 安全与权限控制 / Security & Authorization (约 1 分钟 | ~1 min)

**中文：**

安全是健康管理模块的生命线，我们实现了三层防护：

**第一层：JWT 身份认证**
所有接口都通过 JWT token 验证用户身份，clinic_staff 角色的用户才能访问诊所端 API。系统通过用户邮箱自动关联其所属机构。

**第二层：授权状态校验**
每次上传报告或认证记录前，后端都会检查 `HealthSharePermission` 表，确认该诊所是否被授权、授权是否在有效期内、权限类型是否为"完全访问"。

**第三层：数据隔离**
诊所只能看到自己机构的报告，跨机构访问会被拒绝。猫主人的健康数据不会泄漏给未经授权的第三方。

**English:**

Security is the lifeline of the health management module. We've implemented three layers of protection:

**Layer 1: JWT Authentication**
All APIs verify user identity through JWT tokens. Only users with the `clinic_staff` role can access clinic-side APIs. The system automatically associates users with their organization via email.

**Layer 2: Authorization Status Validation**
Before uploading reports or certifying records, the backend checks the `HealthSharePermission` table, confirming whether the clinic is authorized, whether the authorization is still valid, and whether the permission type is "Full Access."

**Layer 3: Data Isolation**
Clinics can only see reports from their own organization; cross-organization access is denied. Cat owners' health data is never leaked to unauthorized third parties.

---

## Part 7 — 数据库模型 / Database Schema (约 30 秒 | ~30s)

**中文：**

Schema 中新增了 5 张表。最核心的是 `HealthSharePermission` 表，它用 `cat_id + org_id` 作为唯一约束——这意味着同一只猫对同一个诊所只有一条授权记录，通过 upsert 操作可以原子性地更新授权状态，非常高效。

背书表 `ClinicRecordEndorsement` 同样用 `record_id + org_id` 唯一约束，保证每条主人记录每个诊所只能背书一次。

**English:**

Five new tables were added to the schema. The most critical is `HealthSharePermission`, which uses `cat_id + org_id` as a unique constraint — meaning for each cat-clinic pair there is only one authorization record. Using upsert operations allows atomic updates to authorization status, which is very efficient.

The endorsement table `ClinicRecordEndorsement` similarly uses `record_id + org_id` as a unique constraint, ensuring each owner record can only be endorsed once per clinic.

---

## Part 8 — 测试数据 / Test Data (约 30 秒 | ~30s)

**中文：**

为了让团队成员方便测试，我编写了一个 `seed_data.js` 脚本，运行 `node backend/seed_data.js` 可以一键生成：

- 60 家机构（30 救助站 + 30 诊所）
- 2000 个用户
- 3000 只猫咪档案
- 3000 条健康记录
- 2000 份诊所报告
- 以及社区帖子、领养申请、聊天记录等完整数据

**English:**

To make it easy for team members to test, I wrote a `seed_data.js` script. Running `node backend/seed_data.js` generates with one command:

- 60 organizations (30 rescue + 30 clinics)
- 2000 users
- 3000 cat profiles
- 3000 health records
- 2000 clinic reports
- Plus community posts, adoption applications, chat logs, and more

---

## Part 9 — 总结 / Summary (约 30 秒 | ~30s)

**中文：**

总结来说，Health 和 Clinic 模块实现了：

1. **统一健康档案** — 猫主人和诊所双方共同维护
2. **官方背书体系** — 主人记录获得诊所可信认证
3. **精细授权管理** — 用户掌控数据访问权
4. **专业报告生成** — 一键打印医疗文件
5. **完整测试数据** — 开箱即用

所有代码已推送到 `pc-feature/health` 分支，欢迎大家拉取测试。

**English:**

To summarize, the Health and Clinic modules deliver:

1. **Unified Health Records** — maintained collaboratively by cat owners and clinics
2. **Official Endorsement System** — owner records receive trusted clinic certification
3. **Fine-grained Authorization** — users control data access
4. **Professional Report Generation** — one-click printing of medical documents
5. **Comprehensive Test Data** — ready to use out of the box

All code has been pushed to the `pc-feature/health` branch. Pull it and start testing!

---

*演讲时长参考：Part 1 (30s) + Part 2 (60s) + Part 3 (60s) + Part 4 (90s) + Part 5 (90s) + Part 6 (60s) + Part 7 (30s) + Part 8 (30s) + Part 9 (30s) = 约 7.5 分钟*
