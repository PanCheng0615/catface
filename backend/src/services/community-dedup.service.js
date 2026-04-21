const DUPLICATE_POST_WINDOW_MS = 90 * 1000;

function normalizeComparableText(value) {
  return String(value || '').trim();
}

function normalizeComparableImage(value) {
  return String(value || '').trim();
}

function buildCommentKey(comment) {
  return [
    String((comment && comment.user_id) || ''),
    normalizeComparableText(comment && comment.content),
    comment && comment.created_at ? new Date(comment.created_at).toISOString() : ''
  ].join('::');
}

function areEquivalentPosts(a, b) {
  if (!a || !b) return false;
  return (
    String(a.user_id || '') === String(b.user_id || '') &&
    normalizeComparableText(a.content) === normalizeComparableText(b.content) &&
    normalizeComparableImage(a.image_url) === normalizeComparableImage(b.image_url)
  );
}

function isImmediateDuplicatePost(latestPost, nextPostInput, options) {
  if (!latestPost) return false;
  if (!areEquivalentPosts(latestPost, nextPostInput)) return false;
  const windowMs = options && Number.isFinite(options.windowMs)
    ? Math.max(0, Number(options.windowMs))
    : DUPLICATE_POST_WINDOW_MS;
  const latestCreatedAt = latestPost.created_at ? new Date(latestPost.created_at).getTime() : NaN;
  const nextCreatedAt = nextPostInput && nextPostInput.created_at
    ? new Date(nextPostInput.created_at).getTime()
    : Date.now();
  if (!Number.isFinite(latestCreatedAt) || !Number.isFinite(nextCreatedAt)) return false;
  return Math.abs(nextCreatedAt - latestCreatedAt) <= windowMs;
}

function collectDuplicateGroups(posts) {
  const list = Array.isArray(posts) ? posts : [];
  const groups = [];

  for (let i = 0; i < list.length; ) {
    const keep = list[i];
    const duplicates = [];
    let j = i + 1;

    while (j < list.length && areEquivalentPosts(keep, list[j])) {
      duplicates.push(list[j]);
      j += 1;
    }

    if (duplicates.length) {
      groups.push({ keep, duplicates });
    }

    i = j;
  }

  return groups;
}

async function mergeDuplicatePostIntoKeep(tx, keepPost, duplicatePost) {
  const keepLikeUserIds = new Set((keepPost.likes || []).map((like) => String(like.user_id || '')));
  for (const like of duplicatePost.likes || []) {
    const userId = String((like && like.user_id) || '');
    if (!userId || keepLikeUserIds.has(userId)) continue;
    await tx.postLike.create({
      data: {
        user_id: userId,
        post_id: keepPost.id
      }
    });
    keepLikeUserIds.add(userId);
  }

  const keepCommentKeys = new Set((keepPost.comments || []).map(buildCommentKey));
  for (const comment of duplicatePost.comments || []) {
    const commentKey = buildCommentKey(comment);
    if (!commentKey || keepCommentKeys.has(commentKey)) continue;
    await tx.comment.create({
      data: {
        user_id: comment.user_id,
        post_id: keepPost.id,
        content: comment.content,
        created_at: comment.created_at
      }
    });
    keepCommentKeys.add(commentKey);
  }

  await tx.post.delete({
    where: { id: duplicatePost.id }
  });
}

async function cleanupConsecutiveDuplicatePosts(prisma, options) {
  const where = {};
  if (options && Array.isArray(options.userIds) && options.userIds.length) {
    where.user_id = { in: options.userIds };
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    include: {
      likes: { select: { user_id: true } },
      comments: { select: { user_id: true, content: true, created_at: true } }
    }
  });

  const groups = collectDuplicateGroups(posts);
  let removedCount = 0;

  for (const group of groups) {
    const keepPost = group.keep;
    for (const duplicatePost of group.duplicates) {
      await prisma.$transaction(async (tx) => {
        await mergeDuplicatePostIntoKeep(tx, keepPost, duplicatePost);
      });
      removedCount += 1;
    }
  }

  return {
    scannedCount: posts.length,
    duplicateGroupCount: groups.length,
    removedCount
  };
}

module.exports = {
  DUPLICATE_POST_WINDOW_MS,
  cleanupConsecutiveDuplicatePosts,
  isImmediateDuplicatePost
};
