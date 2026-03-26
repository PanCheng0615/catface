// backend/src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const { PrismaClient, Prisma } = require('@prisma/client');
const { generateToken } = require('../utils/generateToken');
const { runKamFaceInference } = require('../services/cat-face.service');

const prisma = new PrismaClient();

function getFaceMatchThreshold() {
  const value = Number(process.env.KAM_FACE_THRESHOLD || 0.8);
  if (!Number.isFinite(value)) return 0.8;
  return value;
}

function normalizeCatGender(value) {
  if (!value) return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'male' || normalized === 'female' || normalized === 'unknown') {
    return normalized;
  }
  return undefined;
}

function calculateAgeMonths(birthday) {
  if (!birthday) return undefined;

  const date = new Date(birthday);
  if (Number.isNaN(date.getTime())) return undefined;

  const now = new Date();
  if (date > now) return undefined;

  let months = (now.getFullYear() - date.getFullYear()) * 12;
  months += now.getMonth() - date.getMonth();
  if (now.getDate() < date.getDate()) {
    months -= 1;
  }

  return Math.max(months, 0);
}

function cosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length || !vecA.length) {
    return -1;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i += 1) {
    const a = Number(vecA[i]);
    const b = Number(vecB[i]);

    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return -1;
    }

    dot += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (!normA || !normB) {
    return -1;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function findCatFaceMatches(embedding) {
  const threshold = getFaceMatchThreshold();
  const savedEmbeddings = await prisma.catFaceEmbedding.findMany({
    include: {
      cat: {
        include: {
          owner: true
        }
      }
    }
  });

  const matches = savedEmbeddings
    .map((item) => {
      const score = cosineSimilarity(embedding, item.embedding);
      if (!Number.isFinite(score) || score < 0) return null;

      return {
        score,
        cat: item.cat
          ? {
              id: item.cat.id,
              name: item.cat.name,
              face_code: item.cat.face_code,
              owner_id: item.cat.owner_id
            }
          : null,
        owner: item.cat && item.cat.owner
          ? {
              id: item.cat.owner.id,
              email: item.cat.owner.email,
              username: item.cat.owner.username,
              display_name: item.cat.owner.display_name,
              role: item.cat.owner.role
            }
          : null
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  return {
    threshold,
    matched: Boolean(matches[0] && matches[0].score >= threshold),
    bestMatch: matches[0] || null,
    topMatches: matches.slice(0, 3)
  };
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const {
      email,
      password,
      username,
      display_name,
      role,
      cat_face_code,
      cat_face_embedding,
      cat_face_image_data_url,
      cat_name,
      cat_breed,
      cat_gender,
      cat_birthday
    } = req.body;

    if (!email || !password || !username) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '邮箱和密码是必填的'
      });
    }

    // 检查邮箱和用户名是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser && existingUser.email === email) {
      return res.status(422).json({
        success: false,
        error: 'UserExists',
        message: '该邮箱已注册'
      });
    }

    if (existingUser && existingUser.username === username) {
      return res.status(422).json({
        success: false,
        error: 'UsernameExists',
        message: '该用户名已被使用'
      });
    }

    const isOwnerSignup = Boolean(
      cat_face_code ||
      cat_face_embedding ||
      cat_face_image_data_url ||
      cat_name ||
      cat_breed ||
      cat_gender ||
      cat_birthday
    );

    if (isOwnerSignup) {
      if (!cat_face_code || !Array.isArray(cat_face_embedding) || !cat_face_embedding.length) {
        return res.status(422).json({
          success: false,
          error: 'ValidationError',
          message: 'Owner sign-up requires cat face code and embedding.'
        });
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          username,
          display_name: display_name || '',
          role: role || 'user'
        }
      });

      let cat = null;

      if (isOwnerSignup) {
        cat = await tx.cat.create({
          data: {
            name: (cat_name && String(cat_name).trim()) || `${display_name || username}'s Cat`,
            breed: cat_breed ? String(cat_breed).trim() : null,
            gender: normalizeCatGender(cat_gender),
            age_months: calculateAgeMonths(cat_birthday),
            owner_id: user.id,
            face_code: String(cat_face_code).trim()
          }
        });

        await tx.catFaceEmbedding.create({
          data: {
            cat_id: cat.id,
            embedding: cat_face_embedding,
            source_image_url: cat_face_image_data_url || null
          }
        });
      }

      return { user, cat };
    });

    const { user, cat } = result;
    const token = generateToken({ id: user.id, role: user.role });

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          display_name: user.display_name,
          role: user.role
        },
        cat: cat
          ? {
              id: cat.id,
              name: cat.name,
              face_code: cat.face_code
            }
          : null
      },
      message: '注册成功'
    });
  } catch (error) {
    console.error('register error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const targets = Array.isArray(error.meta && error.meta.target) ? error.meta.target : [];

      if (targets.includes('email')) {
        return res.status(422).json({
          success: false,
          error: 'UserExists',
          message: '该邮箱已注册'
        });
      }

      if (targets.includes('username')) {
        return res.status(422).json({
          success: false,
          error: 'UsernameExists',
          message: '该用户名已被使用'
        });
      }

      if (targets.includes('face_code')) {
        return res.status(422).json({
          success: false,
          error: 'CatFaceExists',
          message: '该猫脸编号已存在，请更换图片后重试'
        });
      }

      const duplicateUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }]
        }
      });

      if (duplicateUser && duplicateUser.email === email) {
        return res.status(422).json({
          success: false,
          error: 'UserExists',
          message: '该邮箱已注册'
        });
      }

      if (duplicateUser && duplicateUser.username === username) {
        return res.status(422).json({
          success: false,
          error: 'UsernameExists',
          message: '该用户名已被使用'
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '邮箱和密码是必填的'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'InvalidCredentials',
        message: '邮箱或密码错误'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'InvalidCredentials',
        message: '邮箱或密码错误'
      });
    }

    const token = generateToken({ id: user.id, role: user.role });

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          display_name: user.display_name,
          role: user.role
        }
      },
      message: '登录成功'
    });
  } catch (error) {
    console.error('login error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

async function identifySignupCatFace(req, res) {
  try {
    const { image_data_url } = req.body;

    if (!image_data_url) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'image_data_url is required'
      });
    }

    const payload = await runKamFaceInference(image_data_url);
    const matchResult = await findCatFaceMatches(payload.data.embedding);

    payload.data.threshold = matchResult.threshold;
    payload.data.matched = matchResult.matched;
    payload.data.best_match = matchResult.bestMatch;
    payload.data.top_matches = matchResult.topMatches;

    return res.status(200).json(payload);
  } catch (error) {
    console.error('identifySignupCatFace error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: error.message || 'Cat face identification failed'
    });
  }
}

async function loginWithCatFace(req, res) {
  try {
    const { image_data_url } = req.body;

    if (!image_data_url) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'image_data_url is required'
      });
    }

    const payload = await runKamFaceInference(image_data_url);
    const matchResult = await findCatFaceMatches(payload.data.embedding);

    if (!matchResult.matched || !matchResult.bestMatch || !matchResult.bestMatch.owner) {
      return res.status(401).json({
        success: false,
        error: 'CatFaceNotMatched',
        message: 'No registered cat face matched this login attempt.',
        data: {
          suggested_face_code: payload.data.suggested_face_code,
          threshold: matchResult.threshold,
          best_match: matchResult.bestMatch,
          top_matches: matchResult.topMatches
        }
      });
    }

    const owner = matchResult.bestMatch.owner;
    const token = generateToken({ id: owner.id, role: owner.role });

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: owner,
        cat: matchResult.bestMatch.cat,
        match_score: matchResult.bestMatch.score,
        threshold: matchResult.threshold
      },
      message: 'Cat face login successful'
    });
  } catch (error) {
    console.error('loginWithCatFace error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: error.message || 'Cat face login failed'
    });
  }
}

module.exports = { register, login, identifySignupCatFace, loginWithCatFace };