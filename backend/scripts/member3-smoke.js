require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { Client } = require("pg");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const base = "http://localhost:3000/api";
const actor = "19c82baa-90d4-4b32-beed-070cc31a8b7c";
const target = "34b06b97-317b-456c-b70b-01e10ef30703";
const tokenActor = jwt.sign({ id: actor, role: "user" }, process.env.JWT_SECRET, { expiresIn: "1h" });
const tokenTarget = jwt.sign({ id: target, role: "user" }, process.env.JWT_SECRET, { expiresIn: "1h" });

async function main() {
  const pg = new Client({ connectionString: process.env.DATABASE_URL });
  await pg.connect();
  const tz = await pg.query("SELECT current_setting('TIMEZONE') AS tz, now()::text AS now_text");

  const content = "member3-final-check-" + Date.now();
  const create = await fetch(base + "/community/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + tokenActor },
    body: JSON.stringify({ content })
  }).then((r) => r.json());

  const post = await prisma.post.findUnique({
    where: { id: create.data.id },
    select: { id: true, created_at: true, updated_at: true, content: true }
  });

  const followOn = await fetch(base + "/users/" + target + "/follow", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + tokenActor }
  }).then((r) => r.json());
  const followStatus = await fetch(base + "/users/" + target + "/follow-status", {
    headers: { Authorization: "Bearer " + tokenActor }
  }).then((r) => r.json());

  const n1 = await fetch(base + "/notifications?type=follows", {
    headers: { Authorization: "Bearer " + tokenTarget }
  }).then((r) => r.json());
  const ids = (n1.data || [])
    .filter((x) => Number(x.unread_count || 0) > 0)
    .slice(0, 3)
    .map((x) => x.id);
  const mark = await fetch(base + "/notifications/read", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + tokenTarget },
    body: JSON.stringify({ ids })
  }).then((r) => r.json());
  const n2 = await fetch(base + "/notifications?type=follows", {
    headers: { Authorization: "Bearer " + tokenTarget }
  }).then((r) => r.json());

  await pg.end();
  await prisma.$disconnect();

  console.log(
    JSON.stringify(
      {
        timezone: tz.rows[0],
        postSaved: {
          api_created_at: create.data.created_at,
          api_time: create.data.time,
          db_created_at: post.created_at,
          db_updated_at: post.updated_at
        },
        follow: {
          toggled: followOn.data ? followOn.data.following : null,
          status: followStatus.data ? followStatus.data.following : null
        },
        notifications: {
          before: (n1.data || [])
            .slice(0, 2)
            .map((x) => ({ id: x.id, unread_count: x.unread_count, is_read: x.is_read })),
          marked: mark,
          after: (n2.data || [])
            .slice(0, 2)
            .map((x) => ({ id: x.id, unread_count: x.unread_count, is_read: x.is_read }))
        }
      },
      null,
      2
    )
  );
}

main().catch(async (error) => {
  console.error(error);
  try {
    await prisma.$disconnect();
  } catch (_) {}
  process.exit(1);
});
