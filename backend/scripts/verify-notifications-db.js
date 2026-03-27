require("dotenv").config();
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const base = "http://localhost:3000/api";

async function main() {
  const targetUserId = process.argv[2];
  if (!targetUserId) {
    console.error("Usage: node scripts/verify-notifications-db.js <userId>");
    process.exit(1);
  }

  const token = jwt.sign({ id: targetUserId, role: "user" }, process.env.JWT_SECRET, { expiresIn: "1h" });

  const list = await fetch(base + "/notifications?type=follows", {
    headers: { Authorization: "Bearer " + token }
  }).then((r) => r.json());

  if (!list.success || !Array.isArray(list.data)) {
    throw new Error("Failed to fetch notifications for verification");
  }

  const unread = list.data.find((x) => Number(x.unread_count || 0) > 0);
  if (!unread) {
    console.log(
      JSON.stringify(
        {
          success: true,
          message: "No unread follows notification available for this user.",
          checked_user_id: targetUserId
        },
        null,
        2
      )
    );
    return;
  }

  const mark = await fetch(base + "/notifications/read", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ ids: [unread.id] })
  }).then((r) => r.json());

  const row = await prisma.notificationRead.findFirst({
    where: {
      user_id: targetUserId,
      notification_id: unread.id
    }
  });

  console.log(
    JSON.stringify(
      {
        success: !!(mark && mark.success),
        checked_user_id: targetUserId,
        notification_id: unread.id,
        mark_response: mark,
        persisted_in_db: !!row,
        read_at: row ? row.read_at : null
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
