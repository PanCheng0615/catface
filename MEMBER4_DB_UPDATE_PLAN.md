# 给 Member4 的数据库更新修改方案

## 这次改动的目的

为了把猫脸识别功能正式接入系统，需要让数据库能够保存两类信息：

1. 猫脸识别生成的可读编号
2. 猫脸模型输出的特征向量（embedding）

这样后续才能支持：

- 新猫录入时生成 `Cat ID`
- 同一只猫重复上传时做相似度匹配
- 登录/注册阶段给猫主人生成对应 `cat id`
- 救助机构后台 `Add New Cat` 使用真实识别结果

---

## 本次数据库结构改动

### 1. `cats` 表新增字段

新增字段：

- `face_code String? @unique`

作用：

- 存储猫脸识别生成的人类可读编号
- 用于网页展示、人工核对、跨页面引用

说明：

- 允许为空，因为历史猫咪数据可能还没有做过猫脸识别
- 加了唯一约束，避免两只猫共用同一个 `face_code`

对应 schema 位置：

- `backend/prisma/schema.prisma`

```prisma
model Cat {
  id             String     @id @default(uuid())
  name           String
  face_code      String?    @unique
  breed          String?
  ...
}
```

---

### 2. 新增 `cat_face_embeddings` 表

新增模型：

- `CatFaceEmbedding`

字段如下：

- `id`
- `cat_id`
- `embedding_json`
- `source_photo_url`
- `provider`
- `similarity_threshold`
- `created_at`

作用：

- 存模型输出的 embedding
- 允许同一只猫保存多次 embedding，后续可以做增量样本
- 支持后端做 cosine similarity 匹配

对应 schema：

```prisma
model CatFaceEmbedding {
  id                   String   @id @default(uuid())
  cat_id               String
  embedding_json       Json
  source_photo_url     String?
  provider             String
  similarity_threshold Float?
  created_at           DateTime @default(now())

  cat Cat @relation(fields: [cat_id], references: [id], onDelete: Cascade)

  @@index([cat_id])
  @@map("cat_face_embeddings")
}
```

---

## 为什么这样设计

### 不直接把 embedding 塞进 `cats`

原因：

- embedding 维度高，不适合和基础猫档案字段混在一起
- 一只猫后续可能有多张脸图，需要保留多次识别结果
- 后面如果换模型或调阈值，也更容易扩展

### 不直接用 `Cat.id` 作为猫脸编号

原因：

- `Cat.id` 是数据库主键，应该保持稳定且偏内部使用
- `face_code` 更适合前端展示和人工核对

---

## 已完成的数据库同步

本地已经执行过：

```bash
cd backend
npx prisma db push --accept-data-loss
```

当前数据库已经和最新 schema 对齐。

说明：

- `--accept-data-loss` 这次主要是因为 Prisma 提示要给 `cats.face_code` 加唯一约束
- 这不是删除表，而是确认唯一索引变更

---

## 对前端联调的影响

### Member4 需要知道的点

虽然这次核心变更在数据库，但对前端统筹会有这些影响：

1. 所有涉及猫编号展示的位置，后续优先读 `face_code`
2. 如果 `face_code` 为空，再回退到原有 `id`
3. 登录/注册、救助后台、猫档案页，如果要显示“真实猫脸编号”，不要再本地随机生成
4. 前端如果只是展示猫信息，不需要关心 `embedding_json`
5. `embedding_json` 只给后端匹配逻辑使用，不建议前端持久化存储

---

## API 层面的新数据契约

### 猫脸识别接口返回

后端识别接口会返回：

- `matched`
- `suggested_face_code`
- `embedding`
- `embedding_dim`
- `best_match`
- `top_matches`
- `threshold`

其中前端最需要关心的是：

- `suggested_face_code`
- `best_match.cat.face_code`

规则建议：

- 如果命中已有猫，前端优先显示已有 `face_code`
- 如果未命中，前端显示 `suggested_face_code`

---

## Member4 需要同步关注的页面

如果 Member4 负责前端统筹，这几个页面后续最好统一处理猫编号显示逻辑：

- `frontend/pages/index.html`
- `frontend/pages/adoption.html`
- `frontend/pages/cat-profile.html`
- `frontend/pages/health.html`
- `frontend/pages/rescue-dashboard.html`
- `frontend/pages/log-in.html`

统一建议：

- 对外展示：优先 `face_code`
- 内部接口传值：仍以数据库主键 `id` 为准

也就是：

- 页面给用户看：`face_code`
- 代码里查数据库：`id`

---

## 联调顺序建议

建议 Member4 这边按这个顺序配合：

1. 先拉取最新 `schema.prisma`
2. 确认本地数据库已执行 `prisma db push`
3. 页面里不要再写死随机 `CAT-xxx`
4. 所有猫编号展示逻辑增加 `face_code` 优先级
5. 再和 Member1 / Member6 分别联调

联调分工建议：

- Member1：登录/注册阶段生成猫脸编号
- Member6：救助后台 `Add New Cat` 使用猫脸识别
- Member4：全局页面展示逻辑、导航与前端兼容收口

---

## 兼容性约定

为了避免旧数据报错，前端展示时请遵守以下兼容规则：

### 展示猫编号

推荐写法：

```js
const displayCatCode = cat.face_code || cat.id;
```

### 不要假设所有猫都有 embedding

因为：

- 历史数据大概率没有 `CatFaceEmbedding`
- 只有做过猫脸识别的新流程数据才会有

### 不要假设所有猫都有 `face_code`

因为：

- 老数据可能仍为空
- 前端需要兜底

---

## 需要提醒 Member4 的风险点

1. `face_code` 是唯一字段，前端不要本地手写重复值
2. `embedding_json` 是高维向量，不要拿来做前端展示
3. 页面里如果还有老的本地随机 `CAT-...` 逻辑，要逐步清掉
4. 如果页面只展示 `id` 而不展示 `face_code`，用户看到的编号会和猫脸识别结果不一致

---

## 一句话版本（可直接发群里）

这次为了接入猫脸识别，数据库新增了 `Cat.face_code` 和新表 `CatFaceEmbedding`。后续前端页面展示猫编号时请优先用 `face_code`，接口内部仍用 `id`。历史数据可能没有 `face_code` 和 embedding，所以前端要做好兜底，不要再本地随机生成 `CAT-xxx`。
