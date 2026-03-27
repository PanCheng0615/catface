/**
 * 一次性脚本：插入 1 个测试用户 + 2 条帖子，方便社区页看到数据
 * 在 backend 目录执行：node scripts/seed-community.js
 */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});
const prisma = new PrismaClient({ adapter });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("错误：未设置 DATABASE_URL，请检查 .env");
    process.exit(1);
  }

  const email = "test@catface.local";
  const username = "catfriend";

  let user = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        username,
        password: "test123456",
        display_name: "Cat Friend"
      }
    });
    console.log("已创建用户:", user.id, user.username);
  } else {
    console.log("用户已存在:", user.id, user.username);
  }

  const posts = [
    { content: "Hi! I'm a test cat 🐱 My human added this from a script!", image_url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400" },
    { content: "Meow! Second post here. Community feed is working!", image_url: null }
  ];

  for (const p of posts) {
    const existing = await prisma.post.findFirst({
      where: { user_id: user.id, content: p.content }
    });
    if (!existing) {
      await prisma.post.create({
        data: {
          user_id: user.id,
          content: p.content,
          image_url: p.image_url
        }
      });
      console.log("已创建帖子:", p.content.slice(0, 30) + "...");
    }
  }

  console.log("完成。请访问 http://localhost:3000/api/community/posts 查看。");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
