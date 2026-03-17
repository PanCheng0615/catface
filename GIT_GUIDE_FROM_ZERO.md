# CatFace — Git 并行开发从零搭建手册

> **适用人群**: 完全零基础 | **系统**: Windows 10/11 | **人数**: 6人 | **工具**: GitHub Desktop（图形界面，不需要记命令）
>
> 本手册分为三部分：**一次性初始化**（只做一次）、**每日开发流程**（每天重复）、**合并代码流程**（功能完成后做）。

---

## 目录

- [第一部分：什么是 Git？用一句话理解](#第一部分什么是-git用一句话理解)
- [第二部分：一次性初始化（按顺序做，只做一次）](#第二部分一次性初始化按顺序做只做一次)
  - [步骤 1：注册 GitHub 账号（5人各自注册）](#步骤-1注册-github-账号5人各自注册)
  - [步骤 2：安装 GitHub Desktop（5人各自安装）](#步骤-2安装-github-desktop5人各自安装)
  - [步骤 3：Member 1 创建仓库（只有一人做）](#步骤-3member-1-创建仓库只有一人做)
  - [步骤 4：Member 1 搭建初始项目结构并上传](#步骤-4member-1-搭建初始项目结构并上传)
  - [步骤 5：Member 1 邀请其他4人加入仓库](#步骤-5member-1-邀请其他4人加入仓库)
  - [步骤 6：其他4人克隆仓库到本地](#步骤-6其他4人克隆仓库到本地)
  - [步骤 7：每人创建自己的分支](#步骤-7每人创建自己的分支)
- [第三部分：每日开发流程（每天重复）](#第三部分每日开发流程每天重复)
- [第四部分：功能完成后合并代码](#第四部分功能完成后合并代码)
- [第五部分：冲突处理（遇到再看）](#第五部分冲突处理遇到再看)
- [第六部分：常见问题 FAQ](#第六部分常见问题-faq)
- [附录：分支名称对照表](#附录分支名称对照表)

---

## 第一部分：什么是 Git？用一句话理解

把 Git + GitHub 想象成一个**共享网盘 + 版本历史记录**的组合：

```
你的电脑（本地）          GitHub 网站（云端）
─────────────────         ─────────────────────────
你的代码文件夹    ←同步→   catface 仓库（所有人共享）
                           ├── main 分支（最终成品，受保护）
                           ├── feature/auth 分支（Member 1 的工作区）
                           ├── feature/cats 分支（Member 2 的工作区）
                           ├── feature/community 分支（Member 3 的工作区）
                           ├── feature/frontend 分支（Member 4 的工作区）
                           ├── feature/health 分支（Member 5 的工作区）
                           └── feature/rescue 分支（Member 6 的工作区）
```

**核心概念（只需记这5个词）**：

| 词 | 意思 | 类比 |
|----|------|------|
| **Repository（仓库）** | 整个项目的代码集合 | 一个共享文件夹 |
| **Branch（分支）** | 你的独立工作区，不影响别人 | 网盘里属于你的子文件夹 |
| **Commit（提交）** | 保存当前进度并写下备注 | 按下"保存进度"并写说明 |
| **Push（推送）** | 把本地的新进度上传到 GitHub | 上传到云端 |
| **Pull Request（合并请求）** | 申请把你的改动合并进主分支 | 申请把你的工作成果并入总文件夹 |

---

## 第二部分：一次性初始化（按顺序做，只做一次）

### 步骤 1：注册 GitHub 账号（5人各自注册）

**5 个人都要做：**

1. 用浏览器打开 [https://github.com](https://github.com)
2. 点击右上角 **Sign up**
3. 填写邮箱、设置密码、选用户名
   - 用户名建议用真实名字，方便团队识别，例如 `claudia-catface`、`lydia-catface`
4. 完成邮箱验证
5. 登录成功，记下自己的用户名

> 完成后：每人把自己的 **GitHub 用户名** 发到团队群里，Member 1 需要用到所有人的用户名。

---

### 步骤 2：安装 GitHub Desktop（5人各自安装）

**5 个人都要做：**

1. 打开 [https://desktop.github.com](https://desktop.github.com)
2. 点击 **Download for Windows**，下载安装包
3. 双击安装包，一路点 Next 安装
4. 安装完成后打开 GitHub Desktop
5. 点击 **Sign in to GitHub.com**，用刚注册的账号登录
6. 设置你的名字和邮箱（这会出现在每次提交记录里）：

```
File → Options → Git
Name: 你的名字（例如 Claudia）
Email: 你注册 GitHub 用的邮箱
```

7. 点击 Save，完成设置。

---

### 步骤 3：Member 1 创建仓库（只有一人做）

> **只有 Member 1 做这一步。**

1. 在 GitHub Desktop 里，点击顶部菜单 **File → New Repository**
2. 填写信息：
   ```
   Name: catface
   Description: CatFace - 一站式猫咪社交与领养平台
   Local Path: 选择你电脑上的一个文件夹，例如 C:\Users\你的用户名\Projects
   ☑ Initialize this repository with a README
   Git Ignore: Node
   ```
3. 点击 **Create Repository**

4. 发布到 GitHub：点击右上角蓝色按钮 **Publish repository**
   ```
   Name: catface
   ☐ Keep this code private（去掉勾选，让团队成员可以访问）
   ```
5. 点击 **Publish Repository**

6. 打开浏览器访问 `https://github.com/你的用户名/catface`，确认仓库已创建。

---

### 步骤 4：Member 1 搭建初始项目结构并上传

> **只有 Member 1 做这一步。**

Member 1 需要在本地创建蓝图规定的文件夹结构，然后上传。

**1. 找到仓库所在的本地文件夹**

在 GitHub Desktop 里，点击 **Repository → Show in Explorer**，会打开仓库文件夹（例如 `C:\Users\你的用户名\Projects\catface`）

**2. 在这个文件夹里创建以下结构**（手动新建文件夹和文件）：

```
catface/
├── backend/
│   ├── src/
│   │   ├── middleware/       （空文件夹，先建着）
│   │   ├── routes/           （空文件夹）
│   │   ├── controllers/      （空文件夹）
│   │   └── utils/            （空文件夹）
│   ├── prisma/               （空文件夹）
│   ├── uploads/              （空文件夹）
│   └── .env.example          （新建文本文件，内容见下方）
├── frontend/
│   ├── pages/                （把现有的 .html 文件复制进来）
│   ├── js/                   （空文件夹）
│   └── css/                  （空文件夹）
└── README.md                 （已自动创建）
```

**3. 创建 `.env.example` 文件**

在 `backend/` 文件夹里新建一个名为 `.env.example` 的文本文件（注意：文件名就是 `.env.example`，没有其他后缀），内容为：

```
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://用户名:密码@localhost:5432/catface_dev"
JWT_SECRET=替换为随机字符串至少32位
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**4. 创建 `.gitignore` 文件**

在 `backend/` 文件夹里新建 `.gitignore` 文件，内容为：

```
node_modules/
.env
uploads/
*.log
```

> 空文件夹 Git 不会追踪，需要在每个空文件夹里放一个 `![1773307593408](image/GIT_GUIDE_FROM_ZERO/1773307593408.png)` 文件（新建一个空文本文件，命名为 `.gitkeep`）

**5. 提交并上传**

回到 GitHub Desktop：
- 左侧会显示所有新增的文件（打勾表示将被提交）
- 确认所有文件都打勾了
- 在左下角填写提交说明：
  ```
  Summary: feat: 初始化项目文件夹结构
  ```
- 点击蓝色按钮 **Commit to main**
- 点击右上角 **Push origin**，上传到 GitHub

**6. 保护 main 分支（防止直接推送）**

在浏览器中打开 GitHub 仓库：
1. 点击 **Settings** → 左侧 **Branches**
2. 点击 **Add branch protection rule**
3. Branch name pattern 填写 `main`
4. 勾选 **Require a pull request before merging**
5. 点击 **Create**

> 这样所有人就不能直接把代码推到 main，必须经过 Pull Request 审核。

---

### 步骤 5：Member 1 邀请其他4人加入仓库

> **只有 Member 1 做这一步。**

1. 在浏览器打开仓库页面
2. 点击 **Settings** → 左侧 **Collaborators**
3. 点击 **Add people**
4. 输入其他4位成员的 GitHub 用户名，逐一添加
5. 每人会收到一封邮件，**必须点击邮件里的 Accept invitation 才能获得权限**

> 通知其他4位成员查收邮件并点击接受邀请。

---

### 步骤 6：其他4人克隆仓库到本地

> **Member 2、3、4、5 做这一步（Member 1 跳过，他已经有本地仓库了）。**

**方法：在 GitHub Desktop 里克隆**

1. 打开 GitHub Desktop
2. 点击 **File → Clone Repository**
3. 点击 **URL** 标签页
4. 输入仓库地址：`https://github.com/Member1的用户名/catface`
5. Local Path 选择你电脑上的文件夹，例如 `C:\Users\你的用户名\Projects`
6. 点击 **Clone**

等待下载完成后，你的电脑上就有了整个项目文件夹。

---

### 步骤 7：每人创建自己的分支

> **5 个人各自在自己的电脑上做这一步。**

这一步非常重要。**每人必须在自己的专属分支上工作，不能在 main 分支上直接改代码。**

在 GitHub Desktop 里：

1. 确认当前在 `main` 分支（顶部中间显示当前分支名）
2. 点击顶部中间的分支名称按钮（显示 `Current Branch: main`）
3. 点击 **New Branch**
4. 按下表输入你的分支名称：

| 成员 | 分支名称 | 负责模块 |
|------|---------|---------|
| Member 1 | `feature/auth` | 后端基础 + 用户系统 |
| Member 2 | `feature/cats` | 猫咪档案 + 领养模块 |
| Member 3 | `feature/community` | 社区模块 |
| Member 4 | `feature/frontend` | 前端统筹 + 全局整合 |
| Member 5 | `feature/health` | 数据库 + 健康/诊所 |
| Member 6 | `feature/rescue` | 聊天功能 + 救助机构后台 |

5. 点击 **Create Branch**
6. 点击 **Publish Branch**，把分支推送到 GitHub

> 创建后，顶部显示的分支名变成了你的分支名（例如 `feature/auth`），以后所有工作都在这个分支上进行。

**✅ 初始化完成！** 以下进入日常工作流程。

---

## 第三部分：每日开发流程（每天重复）

> 每天开始工作前和结束工作后，重复以下流程。

### 开始工作前：同步最新代码（每天必做）

你的队友可能昨天更新了代码。开始工作前，先把最新的代码同步下来。

**在 GitHub Desktop 里：**

1. 打开 GitHub Desktop，确认当前分支是你自己的分支（例如 `feature/cats`）
2. 点击顶部菜单 **Repository → Pull**（或快捷键 `Ctrl+Shift+P`）

> 如果有队友更新了 `main` 分支的公共代码，还需要把 `main` 的更新合并进你的分支（每隔几天做一次，不用每天都做，后面"获取队友更新"有详细说明）。

### 开发中：保存进度（Commit）

**什么时候 Commit？**
- 完成了一个小功能（例如：写完了登录接口）
- 改了一些内容，想留个存档
- 下班前，把今天的工作存档
- **建议：每完成一件独立的事情就 commit 一次，不要等到改了几百行再 commit**

**怎么 Commit？**

1. 写完代码，保存文件（`Ctrl+S`）
2. 打开 GitHub Desktop，左侧会显示所有有变化的文件
3. 检查文件列表，把你不想提交的文件取消勾选（通常全选就好）
4. 在左下角填写本次提交的说明：

```
Summary（必填）: feat: 完成用户登录接口
Description（选填）: 实现了 POST /api/auth/login，返回 JWT token
```

5. 点击蓝色按钮 **Commit to feature/auth**（显示你的分支名）

### 结束工作后：上传到 GitHub（Push）

Commit 只是保存在你电脑上，还需要上传到 GitHub：

1. 在 GitHub Desktop 里，点击右上角 **Push origin** 按钮
2. 看到按钮变成 "Last fetched just now" 即表示上传成功

> **建议**：每次 Commit 后立即 Push，养成习惯，防止电脑出问题导致代码丢失。

---

## 第四部分：功能完成后合并代码

当你负责的某个功能完整写好并测试通过后，需要把代码合并进 `main` 分支。

### 第1步：确保自己的分支是最新的

在合并之前，先把 `main` 分支的最新内容同步进来，避免冲突：

1. 在 GitHub Desktop 里，点击顶部分支按钮，切换到 `main` 分支
2. 点击 **Pull origin**，下载最新的 main 代码
3. 切换回自己的分支（例如 `feature/cats`）
4. 点击顶部菜单 **Branch → Merge into Current Branch...**
5. 在弹出窗口里选择 `main`，点击 **Merge main into feature/cats**
6. 如果有冲突，见第五部分处理；没有冲突则继续
7. 点击 **Push origin** 上传

### 第2步：在 GitHub 网站发起 Pull Request

1. 打开浏览器，进入仓库页面 `https://github.com/用户名/catface`
2. GitHub 通常会显示黄色提示条："**feature/cats had recent pushes. Compare & pull request**"，点击这个按钮
3. 如果没有提示，点击 **Pull requests** 标签 → **New pull request**，选择 `base: main` ← `compare: feature/cats`
4. 填写 Pull Request 标题和说明：

```
标题: feat: 完成猫咪档案模块（Member 2）

说明:
## 本次合并内容
- 实现 GET/POST /api/cats 接口
- 实现 GET /api/cats/:id 接口
- 完成 cat-profile.html 与后端联调
- cat-profile.js 已替换为真实 API 数据

## 测试情况
- Thunder Client 测试全部通过
- 浏览器打开 cat-profile.html 无报错
```

5. 点击 **Create pull request**

### 第3步：由另一位成员审核并合并

1. 通知团队群："Member 2 发了 PR，请 Member 1 审核"
2. 审核者打开 GitHub，进入 Pull requests 标签，点击对应的 PR
3. 点击 **Files changed** 查看改了哪些内容
4. 如果没问题，回到 **Conversation** 标签，点击 **Merge pull request** → **Confirm merge**
5. 合并成功后，其他人需要同步 main（下次开始工作前 Pull 一下即可）

---

## 第五部分：冲突处理（遇到再看）

### 什么是冲突？

当两个人修改了**同一个文件的同一个地方**，Git 无法自动决定用谁的版本，就会发生冲突。

**预防冲突的最好方法：严格按蓝图分工，每人只改自己负责的文件。**

### 冲突长什么样？

文件里会出现这样的标记：

```javascript
<<<<<<< HEAD（你的代码）
const PORT = 3000;
=======
const PORT = 8080;
>>>>>>> main（对方的代码）
```

`=======` 上方是你的代码，下方是对方的代码。

### 怎么解决？

1. GitHub Desktop 会弹出提示，点击 **Open in Visual Studio Code**（或 Cursor）
2. 在文件里找到 `<<<<<<<` 标记
3. 手动决定保留哪个版本（或者合并两者），删掉所有 `<<<<<<<`、`=======`、`>>>>>>>` 标记
4. 保存文件
5. 回到 GitHub Desktop，看到冲突文件上有橙色标记
6. 勾选已解决的文件，点击 **Mark as resolved**
7. 点击 **Continue Merge**
8. 写 commit 说明，提交

### 实在看不懂怎么办？

打电话/发消息给另一个人，两个人一起看，决定最终保留哪个版本。**不要随意删除队友的代码。**

---

## 第六部分：常见问题 FAQ

### Q1：我在 main 分支上不小心改了代码，怎么办？

不要 commit！立刻做以下步骤：
1. GitHub Desktop 左侧会显示被改动的文件
2. 右键点击文件 → **Discard Changes**，撤销改动
3. 切换到自己的分支，再把刚才的改动重新做一遍

### Q2：我忘记切分支，commit 到了 main，怎么办？

先别 Push！联系 Member 1，告诉他发生了什么。他可以用命令行帮你把 commit 移到正确的分支。提交到 main 之前一定要检查左下角显示的是哪个分支。

### Q3：Push 失败，提示 "rejected"，怎么办？

说明 GitHub 上有你本地没有的更新。先 Pull（下载最新版），解决冲突后再 Push。

### Q4：队友合并了新代码到 main，我怎么把那些更新同步到我自己的分支？

1. GitHub Desktop，切换到 `main` 分支
2. 点击 **Pull origin**
3. 切回自己的分支
4. 点击 **Branch → Merge into Current Branch...**，选 `main`
5. 合并后 Push

> 建议每隔2-3天做一次这个操作，不要等到最后才同步，那时冲突会很多。

### Q5：我想看队友最新写了什么代码，怎么看？

1. GitHub Desktop，点击 **Branch**，切换到队友的分支
2. 就能在本地文件夹看到他们的代码（只读查看，不要修改）
3. 看完后切回自己的分支继续工作

### Q6：我不小心把 `.env` 文件 commit 进去了，怎么办？

立刻联系 Member 1，他需要从 Git 历史里删除这个文件。同时立刻修改所有密码和密钥（JWT Secret 等），因为一旦推上 GitHub，相当于公开了。

### Q7：如何查看某次 commit 改了什么？

在 GitHub Desktop 里，点击左侧 **History** 标签，点击任意一条 commit 记录，右边会显示具体改了哪些行。

---

## 附录：分支名称对照表

| 成员 | 分支名 | 负责模块 |
|------|--------|---------|
| Member 1 | `feature/auth` | 后端基础 + 用户系统 |
| Member 2 | `feature/cats` | 猫咪档案 + 领养模块 |
| Member 3 | `feature/community` | 社区模块 |
| Member 4 | `feature/frontend` | 前端统筹 + 全局整合 |
| Member 5 | `feature/health` | 数据库 + 健康/诊所模块 |
| Member 6 | `feature/rescue` | 聊天功能 + 救助机构后台 |

---

## 附录：每日操作速查卡

> 把这个卡片截图贴到桌面

```
┌──────────────────────────────────────────┐
│  分支对照（找到自己贴这里）：             │
│  Member 1 → feature/auth                 │
│  Member 2 → feature/cats                 │
│  Member 3 → feature/community            │
│  Member 4 → feature/frontend             │
│  Member 5 → feature/health               │
│  Member 6 → feature/rescue               │
├──────────────────────────────────────────┤
│  每天开始工作：                           │
│  1. 打开 GitHub Desktop                  │
│  2. 确认分支是"feature/你的分支"          │
│  3. 点击 Pull origin（同步最新）          │
│  4. 开始写代码                            │
├──────────────────────────────────────────┤
│  写完一小段功能：                         │
│  1. Ctrl+S 保存文件                      │
│  2. GitHub Desktop 左侧查看改动          │
│  3. 填写 Summary（一句话说明改了啥）      │
│  4. 点击 Commit to feature/xxx           │
│  5. 点击 Push origin                     │
├──────────────────────────────────────────┤
│  绝对不做的事：                           │
│  ✗ 不在 main 分支上写代码               │
│  ✗ 不 commit .env 文件                  │
│  ✗ 不修改别人负责的文件                  │
└──────────────────────────────────────────┘
```

---

---

## 附录：现有 HTML 文件迁移清单

> 由 **Member 4** 在 Phase 0 期间执行。将以下文件**复制**（不是剪切）到 `frontend/pages/` 目录。

| 文件名 | 操作 | 目标路径 |
|--------|------|---------|
| `index.html` | ✅ 复制迁入 | `frontend/pages/index.html` |
| `log-in.html` | ✅ 复制迁入 | `frontend/pages/log-in.html` |
| `account.html` | ✅ 复制迁入 | `frontend/pages/account.html` |
| `cat-profile.html` | ✅ 复制迁入 | `frontend/pages/cat-profile.html` |
| `adoption.html` | ✅ 复制迁入 | `frontend/pages/adoption.html` |
| `cat-facebook.html` | ✅ 复制迁入 | `frontend/pages/cat-facebook.html` |
| `notifications.html` | ✅ 复制迁入 | `frontend/pages/notifications.html` |
| `health.html` | ✅ 复制迁入 | `frontend/pages/health.html` |
| `clinic-portal.html` | ✅ 复制迁入 | `frontend/pages/clinic-portal.html` |
| `rescue-dashboard.html` | ✅ 复制迁入 | `frontend/pages/rescue-dashboard.html` |
| `Backend_Guide_Creator_Profile.html` | ❌ 不迁入，仅作参考文档 | 原地保留 |
| `CatFace_Progress_Log_Updated.html` | ❌ 不迁入，仅作参考文档 | 原地保留 |
| `CatFace_Project_Log.html` | ❌ 不迁入，仅作参考文档 | 原地保留 |
| `Cat_Account_Scheme_Comparison.html` | ❌ 不迁入，仅作参考文档 | 原地保留 |
| `Database_Field_Dictionary.html` | ❌ 不迁入，仅作参考文档 | 原地保留 |

> **迁入后的注意事项**: 所有 HTML 文件中的内联 `<style>` 暂时保留，等 Member 4 整理完 `style.css` 后再统一清理。所有写死的假数据暂时保留，等到 Phase 3 联调时逐步替换为真实 API。

---

*有任何 Git 问题，先看 FAQ，解决不了就截图发团队群，由 Member 1 统一处理。*
