const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const {
  DUPLICATE_POST_WINDOW_MS,
  cleanupConsecutiveDuplicatePosts,
  isImmediateDuplicatePost
} = require('../services/community-dedup.service.js');

const prisma = new PrismaClient();

function envNumber(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const TRENDING_LIKE_WEIGHT = envNumber('COMMUNITY_TRENDING_LIKE_WEIGHT', 1);
const TRENDING_COMMENT_WEIGHT = envNumber('COMMUNITY_TRENDING_COMMENT_WEIGHT', 2);

const DEMO_PASSWORD = 'demo1234';
const DEMO_COMMUNITY_USERS = [
  {
    email: 'community.gege@catface.demo',
    username: '格格',
    display_name: '格格',
    avatar_url: '../assets/community/gege.png'
  },
  {
    email: 'community.luno@catface.demo',
    username: '露诺',
    display_name: '露诺',
    avatar_url: '../assets/community/luno.png'
  },
  {
    email: 'community.spidercat@catface.demo',
    username: '蜘蛛猫',
    display_name: '蜘蛛猫',
    avatar_url: '../assets/community/spider-cat.png'
  },
  {
    email: 'community.tantou@catface.demo',
    username: '探头仔',
    display_name: '探头仔',
    avatar_url: '../assets/community/tantou.png'
  },
  {
    email: 'community.maojin@catface.demo',
    username: '毛巾仔',
    display_name: '毛巾仔',
    avatar_url: '../assets/community/maojin.png'
  },
  {
    email: 'community.cesuo@catface.demo',
    username: '幸运仔',
    display_name: '幸运仔',
    avatar_url: '../assets/community/cesuo.png'
  }
];

const DEMO_COMMUNITY_POSTS = [
  {
    username: '格格',
    content:
      "Hi, I'm Gege 🐱 Female, 3 months, 1.2 kg, from University of Macau. I'm gentle and a bit shy but I love people. Volunteers say I like pets, I'm curious, and I'm pretty chill. Deworming done; vaccines still in progress.",
    image_url: '../assets/community/gege.png',
    created_at: '2026-04-11T09:00:00.000Z',
    likes: ['露诺', '探头仔', '毛巾仔'],
    comments: [
      { username: '露诺', text: 'Campus friends unite 🐾', created_at: '2026-04-11T09:20:00.000Z' }
    ]
  },
  {
    username: '露诺',
    content:
      "Luno here ✨ Male, 3 months, 1.3 kg, from UM. Quiet and curious, with two different eye colours. I'm happy to be petted and I really love cat treats. Deworming done; vaccines not finished yet.",
    image_url: '../assets/community/luno.png',
    created_at: '2026-04-11T11:00:00.000Z',
    likes: ['格格', '探头仔', '幸运仔'],
    comments: [
      { username: '格格', text: 'Those eyes are amazing ✨', created_at: '2026-04-11T11:10:00.000Z' }
    ]
  },
  {
    username: '蜘蛛猫',
    content:
      "Female, 1 year 5 months, 2.1 kg, orange tabby with white - from University of Macau. I love watching everything and I'm super agile. Volunteers say I'm sweet but I'll need patience and lots of love to really open up. Deworming done; vaccines pending.",
    image_url: '../assets/community/spider-cat.png',
    created_at: '2026-04-11T14:00:00.000Z',
    likes: ['格格', '露诺'],
    comments: [
      { username: '探头仔', text: "You're so cool on the climbing frames!", created_at: '2026-04-11T14:40:00.000Z' }
    ]
  },
  {
    username: '探头仔',
    content:
      "Male tabby and white kitten, 3 months, 1.1 kg, from UM. Active, curious, quick on my paws - and yes, you can pet me! I also have a great appetite 🍽️. Deworming done; vaccines still to complete.",
    image_url: '../assets/community/tantou.png',
    created_at: '2026-04-12T08:00:00.000Z',
    likes: ['格格', '露诺', '毛巾仔', '幸运仔'],
    comments: [
      { username: '毛巾仔', text: 'Same litter energy 🐱', created_at: '2026-04-12T08:25:00.000Z' }
    ]
  },
  {
    username: '毛巾仔',
    content:
      "Male, 4 months, 1.1 kg, from University of Macau. Quiet, gentle, and I love human pets and napping wrapped in towels 🧺✨. Cat sticks are my favourite snack. Deworming done; vaccines not complete yet.",
    image_url: '../assets/community/maojin.png',
    created_at: '2026-04-12T10:00:00.000Z',
    likes: ['格格', '露诺', '探头仔'],
    comments: [
      { username: '幸运仔', text: 'Towel gang forever!', created_at: '2026-04-12T10:15:00.000Z' }
    ]
  },
  {
    username: '幸运仔',
    content:
      "Male, 6 months, 1.5 kg, mostly white with orange patches - UM campus rescue. Outgoing, friendly, love exploring and cuddles, and humans say I have a sweet voice 🎵. Deworming done; vaccines in progress.",
    image_url: '../assets/community/cesuo.png',
    created_at: '2026-04-12T12:00:00.000Z',
    likes: ['格格', '露诺', '蜘蛛猫', '探头仔'],
    comments: [
      { username: '格格', text: 'Such a cheerful photo!', created_at: '2026-04-12T12:30:00.000Z' }
    ]
  },
  {
    username: '格格',
    content:
      '格格今日份晒太阳打卡。窗边的风很舒服，我决定认真营业，发一张软乎乎的近照给大家看。',
    image_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
    created_at: '2026-04-13T09:30:00.000Z',
    likes: ['露诺', '毛巾仔', '幸运仔'],
    comments: [
      { username: '探头仔', text: '这张好像小面包，想rua！', created_at: '2026-04-13T09:50:00.000Z' }
    ]
  },
  {
    username: '露诺',
    content:
      '今天换个角度拍照，两只眼睛的颜色在阳光下会更明显。零食已经准备好，欢迎夸夸我。',
    image_url: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&q=80',
    created_at: '2026-04-13T11:15:00.000Z',
    likes: ['格格', '蜘蛛猫', '幸运仔'],
    comments: [
      { username: '格格', text: '今天也是发光小猫一枚。', created_at: '2026-04-13T11:35:00.000Z' }
    ]
  },
  {
    username: '蜘蛛猫',
    content:
      '我又爬到高处巡逻啦。这个角度能看到很多人类路过，顺便也给自己留一张帅气存档。',
    image_url: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=800&q=80',
    created_at: '2026-04-14T08:40:00.000Z',
    likes: ['格格', '露诺', '探头仔'],
    comments: [
      { username: '幸运仔', text: '高处视角果然不一样，气场拉满。', created_at: '2026-04-14T09:00:00.000Z' }
    ]
  },
  {
    username: '探头仔',
    content:
      '探头仔今日份探头成功！刚睡醒就被拍到，耳朵还没完全立起来，但精神已经在线。',
    image_url: 'https://images.unsplash.com/photo-1571566882372-1598d88abd90?w=800&q=80',
    created_at: '2026-04-14T10:20:00.000Z',
    likes: ['露诺', '毛巾仔', '幸运仔'],
    comments: [
      { username: '毛巾仔', text: '这张真的太有表情了。', created_at: '2026-04-14T10:38:00.000Z' }
    ]
  },
  {
    username: '毛巾仔',
    content:
      '今天继续研究毛巾的正确使用方法。结论是：不管怎么卷，最后都会变成我的床。',
    image_url: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=800&q=80',
    created_at: '2026-04-15T09:10:00.000Z',
    likes: ['格格', '探头仔', '幸运仔'],
    comments: [
      { username: '露诺', text: '毛巾仔对软软的东西完全没有抵抗力。', created_at: '2026-04-15T09:28:00.000Z' }
    ]
  },
  {
    username: '幸运仔',
    content:
      '今天外出巡视回来，顺便拍了一张笑眯眯的照片。状态很好，欢迎来评论区和我打招呼。',
    image_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80',
    created_at: '2026-04-15T12:25:00.000Z',
    likes: ['格格', '露诺', '蜘蛛猫', '探头仔'],
    comments: [
      { username: '格格', text: '这张看起来心情特别好！', created_at: '2026-04-15T12:45:00.000Z' }
    ]
  }
];

async function ensureDemoCommunityData() {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
  const usersByUsername = new Map();

  for (const userData of DEMO_COMMUNITY_USERS) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        username: userData.username,
        display_name: userData.display_name,
        avatar_url: userData.avatar_url
      },
      create: {
        email: userData.email,
        password: hashedPassword,
        username: userData.username,
        display_name: userData.display_name,
        avatar_url: userData.avatar_url
      }
    });
    usersByUsername.set(userData.username, user);
  }

  for (const postData of DEMO_COMMUNITY_POSTS) {
    const author = usersByUsername.get(postData.username);
    if (!author) continue;

    const existingPost = await prisma.post.findFirst({
      where: {
        user_id: author.id,
        content: postData.content
      },
      select: { id: true }
    });

    const post = existingPost
      ? await prisma.post.update({
          where: { id: existingPost.id },
          data: {
            image_url: postData.image_url,
            created_at: new Date(postData.created_at)
          }
        })
      : await prisma.post.create({
          data: {
            user_id: author.id,
            content: postData.content,
            image_url: postData.image_url,
            created_at: new Date(postData.created_at)
          }
        });

    for (const likerUsername of postData.likes || []) {
      const liker = usersByUsername.get(likerUsername);
      if (!liker || liker.id === author.id) continue;
      await prisma.postLike.upsert({
        where: {
          user_id_post_id: {
            user_id: liker.id,
            post_id: post.id
          }
        },
        update: {},
        create: {
          user_id: liker.id,
          post_id: post.id
        }
      });
    }

    for (const commentData of postData.comments || []) {
      const commenter = usersByUsername.get(commentData.username);
      if (!commenter) continue;
      const existingComment = await prisma.comment.findFirst({
        where: {
          user_id: commenter.id,
          post_id: post.id,
          content: commentData.text
        },
        select: { id: true }
      });
      if (existingComment) continue;
      await prisma.comment.create({
        data: {
          user_id: commenter.id,
          post_id: post.id,
          content: commentData.text,
          created_at: new Date(commentData.created_at || postData.created_at)
        }
      });
    }
  }

  await cleanupConsecutiveDuplicatePosts(prisma, {
    userIds: Array.from(usersByUsername.values()).map((user) => user.id)
  });
}

function formatRelativeTime(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

function mapPostToFeed(post, currentUserId, followingSet) {
  const author = post.user;
  const authorName = author.display_name || author.username || 'User';
  const createdAt = new Date(post.created_at);
  const isSelf = !!(currentUserId && author.id === currentUserId);
  const followed =
    !currentUserId || isSelf
      ? false
      : followingSet
        ? followingSet.has(author.id)
        : false;
  return {
    id: post.id,
    author: authorName,
    authorId: author.id,
    authorUsername: author.username || '',
    authorAvatar: author.avatar_url || '',
    authorInitial: authorName.charAt(0).toUpperCase(),
    image: post.image_url || '',
    text: post.content,
    likes: post.likes.length,
    liked: currentUserId ? post.likes.some((x) => x.user_id === currentUserId) : false,
    followed,
    comments: post.comments.map((c) => ({
      id: c.id,
      author: c.user.display_name || c.user.username || 'User',
      text: c.content
    })),
    created_at: createdAt.toISOString(),
    time: formatRelativeTime(createdAt)
  };
}

function computeTrendingHotScore(likesCount, commentsCount) {
  const likes = Number(likesCount) || 0;
  const comments = Number(commentsCount) || 0;
  return likes * TRENDING_LIKE_WEIGHT + comments * TRENDING_COMMENT_WEIGHT;
}

async function getPosts(req, res) {
  try {
    const rawLimit = parseInt(req.query.limit || '20', 10);
    const rawOffset = parseInt(req.query.offset || '0', 10);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 50)) : 20;
    const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;
    const feed = String(req.query.feed || 'recommended').toLowerCase();
    const viewerId = req.user && req.user.id;

    if (feed !== 'followed') {
      await ensureDemoCommunityData();
    }

    let where = {};
    if (feed === 'followed') {
      if (!viewerId) {
        return res.json({
          success: true,
          data: [],
          pagination: { limit, offset, has_more: false, next_offset: offset },
          message: '操作成功'
        });
      }
      const followingRows = await prisma.userFollow.findMany({
        where: { follower_id: viewerId },
        select: { following_id: true }
      });
      const followingIds = followingRows.map((f) => f.following_id);
      if (!followingIds.length) {
        return res.json({
          success: true,
          data: [],
          pagination: { limit, offset, has_more: false, next_offset: offset },
          message: '操作成功'
        });
      }
      where = { user_id: { in: followingIds } };
    }

    const rows = await prisma.post.findMany({
      where,
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      skip: offset,
      take: limit + 1,
      include: {
        user: { select: { id: true, username: true, display_name: true, avatar_url: true } },
        likes: { select: { user_id: true } },
        comments: { include: { user: { select: { username: true, display_name: true } } } }
      }
    });
    const hasMore = rows.length > limit;
    const posts = hasMore ? rows.slice(0, limit) : rows;

    let followingSet = null;
    if (viewerId) {
      const authorIds = [...new Set(posts.map((p) => p.user.id).filter((id) => id !== viewerId))];
      followingSet = new Set();
      if (authorIds.length) {
        const rows = await prisma.userFollow.findMany({
          where: { follower_id: viewerId, following_id: { in: authorIds } },
          select: { following_id: true }
        });
        rows.forEach((r) => followingSet.add(r.following_id));
      }
    }

    const strictFollowedPosts =
      feed === 'followed' && viewerId
        ? posts.filter((p) => followingSet && followingSet.has(p.user.id))
        : posts;

    const data = strictFollowedPosts.map((p) => mapPostToFeed(p, viewerId, followingSet));
    return res.json({
      success: true,
      data,
      pagination: {
        limit,
        offset,
        has_more: hasMore,
        next_offset: offset + posts.length
      },
      message: '操作成功'
    });
  } catch (error) {
    console.error('getPosts error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

async function getTrendingPosts(req, res) {
  try {
    const viewerId = req.user && req.user.id;
    const rawLimit = parseInt(String(req.query.limit || '10'), 10);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 20)) : 10;

    await ensureDemoCommunityData();

    const startOfWindow = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentPosts = await prisma.post.findMany({
      where: {
        created_at: {
          gte: startOfWindow
        }
      },
      orderBy: { created_at: 'desc' },
      take: 500,
      include: {
        user: { select: { id: true, username: true, display_name: true, avatar_url: true } },
        likes: { select: { user_id: true } },
        comments: {
          include: {
            user: { select: { username: true, display_name: true } }
          }
        }
      }
    });

    let followingSet = null;
    if (viewerId) {
      const authorIds = [...new Set(recentPosts.map((p) => p.user.id).filter((id) => id !== viewerId))];
      followingSet = new Set();
      if (authorIds.length) {
        const rows = await prisma.userFollow.findMany({
          where: { follower_id: viewerId, following_id: { in: authorIds } },
          select: { following_id: true }
        });
        rows.forEach((r) => followingSet.add(r.following_id));
      }
    }

    const ranked = recentPosts
      .map((post) => {
        const likesCount = Array.isArray(post.likes) ? post.likes.length : 0;
        const commentsCount = Array.isArray(post.comments) ? post.comments.length : 0;
        const hotScore = computeTrendingHotScore(likesCount, commentsCount);
        return {
          post,
          likesCount,
          commentsCount,
          hotScore
        };
      })
      .sort((a, b) => {
        if (b.hotScore !== a.hotScore) return b.hotScore - a.hotScore;
        if (b.likesCount !== a.likesCount) return b.likesCount - a.likesCount;
        if (b.commentsCount !== a.commentsCount) return b.commentsCount - a.commentsCount;
        return new Date(b.post.created_at).getTime() - new Date(a.post.created_at).getTime();
      })
      .slice(0, limit)
      .map((row) => {
        const base = mapPostToFeed(row.post, viewerId, followingSet);
        return {
          ...base,
          likes: row.likesCount,
          comments_count: row.commentsCount,
          hot_score: row.hotScore
        };
      });

    return res.json({
      success: true,
      data: ranked,
      message: '操作成功'
    });
  } catch (error) {
    console.error('getTrendingPosts error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

async function createPost(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized', message: '请先登录' });
    }
    const content = String(req.body.content || '').trim();
    if (!content) {
      return res.status(422).json({ success: false, error: 'ValidationError', message: '内容不能为空' });
    }
    const imageUrl = req.body.image_url ? String(req.body.image_url).trim() : '';
    const normalizedImageUrl = imageUrl || null;

    const latestPost = await prisma.post.findFirst({
      where: { user_id: userId },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        user_id: true,
        content: true,
        image_url: true,
        created_at: true
      }
    });

    if (isImmediateDuplicatePost(latestPost, {
      user_id: userId,
      content,
      image_url: normalizedImageUrl,
      created_at: new Date()
    })) {
      return res.status(409).json({
        success: false,
        error: 'DuplicatePost',
        message: `检测到你在短时间内重复发布了相同内容。若想再次发布，请稍等 ${Math.ceil(DUPLICATE_POST_WINDOW_MS / 1000)} 秒后再试。`
      });
    }

    const post = await prisma.post.create({
      data: {
        user_id: userId,
        content: content.slice(0, 500),
        image_url: normalizedImageUrl
      },
      include: {
        user: { select: { id: true, username: true, display_name: true, avatar_url: true } },
        likes: { select: { user_id: true } },
        comments: { include: { user: { select: { username: true, display_name: true } } } }
      }
    });

    return res.status(201).json({
      success: true,
      data: mapPostToFeed(post, userId, new Set()),
      message: '发布成功'
    });
  } catch (error) {
    console.error('createPost error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

async function toggleLike(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized', message: '请先登录' });
    }
    const postId = req.params.id;

    const existing = await prisma.postLike.findUnique({
      where: { user_id_post_id: { user_id: userId, post_id: postId } }
    });

    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.postLike.create({ data: { user_id: userId, post_id: postId } });
    }

    const likes = await prisma.postLike.count({ where: { post_id: postId } });
    const liked = !existing;
    return res.json({
      success: true,
      data: { liked, likes },
      message: liked ? '点赞成功' : '已取消点赞'
    });
  } catch (error) {
    console.error('toggleLike error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

async function getComments(req, res) {
  try {
    const postId = req.params.id;
    const comments = await prisma.comment.findMany({
      where: { post_id: postId },
      orderBy: { created_at: 'asc' },
      include: { user: { select: { username: true, display_name: true } } }
    });
    return res.json({
      success: true,
      data: comments.map((c) => ({
        id: c.id,
        author: c.user.display_name || c.user.username || 'User',
        text: c.content
      })),
      message: '操作成功'
    });
  } catch (error) {
    console.error('getComments error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

async function addComment(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized', message: '请先登录' });
    }
    const postId = req.params.id;
    const content = String(req.body.content || '').trim();
    if (!content) {
      return res.status(422).json({ success: false, error: 'ValidationError', message: '评论内容不能为空' });
    }
    const comment = await prisma.comment.create({
      data: { user_id: userId, post_id: postId, content: content.slice(0, 500) },
      include: { user: { select: { username: true, display_name: true } } }
    });
    return res.status(201).json({
      success: true,
      data: {
        id: comment.id,
        author: comment.user.display_name || comment.user.username || 'User',
        text: comment.content
      },
      message: '评论成功'
    });
  } catch (error) {
    console.error('addComment error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

async function uploadPlaceholder(req, res) {
  try {
    const incoming = req.body && typeof req.body.imageDataUrl === 'string' ? req.body.imageDataUrl.trim() : '';
    if (!incoming) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '图片不能为空'
      });
    }
    const dataUrlPattern = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i;
    if (!dataUrlPattern.test(incoming)) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '仅支持 png/jpg/jpeg/webp/gif 的 base64 图片'
      });
    }
    const base64Part = incoming.split(',')[1] || '';
    const approxSizeBytes = Math.ceil((base64Part.length * 3) / 4);
    if (approxSizeBytes > 3 * 1024 * 1024) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '图片过大，请上传不超过 3MB 的图片'
      });
    }
    return res.json({
      success: true,
      data: { url: incoming },
      message: '上传成功（占位）'
    });
  } catch (error) {
    console.error('uploadPlaceholder error:', error);
    return res.status(500).json({ success: false, error: 'ServerError', message: '服务器错误' });
  }
}

module.exports = {
  ensureDemoCommunityData,
  getPosts,
  getTrendingPosts,
  createPost,
  toggleLike,
  getComments,
  addComment,
  uploadPlaceholder
};
