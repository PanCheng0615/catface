// backend/src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../utils/generateToken');
const { runKamFaceInference, findCatFaceMatches } = require('../services/cat-face.service');

const prisma = new PrismaClient();
const adopterPreferenceFieldSet = new Set(
  (((prisma._runtimeDataModel || {}).models || {}).AdopterPreference || {}).fields
    ? ((prisma._runtimeDataModel || {}).models.AdopterPreference.fields || []).map((field) => field.name)
    : []
);

function hasAdopterPreferenceField(fieldName) {
  return adopterPreferenceFieldSet.has(fieldName);
}

function normalizeCatGender(raw) {
  if (raw == null || raw === '') return null;
  const value = String(raw).trim().toLowerCase();
  if (value === 'male' || value === 'female' || value === 'unknown') return value;
  return null;
}

function normalizeNullableBoolean(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'number') {
    if (raw === 1) return true;
    if (raw === 0) return false;
  }
  const value = String(raw).trim().toLowerCase();
  if (!value) return null;
  if (['true', '1', 'yes', 'completed', 'done'].includes(value)) return true;
  if (['false', '0', 'no', 'not yet', 'not_yet', 'pending'].includes(value)) return false;
  return null;
}

function serializeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    display_name: user.display_name,
    has_cat: Boolean(user.has_cat),
    role: user.role
  };
}

function getCatFaceThreshold() {
  const threshold = Number(process.env.KAM_FACE_THRESHOLD || '0.85');
  return Number.isFinite(threshold) ? threshold : 0.85;
}

function mapCatFaceErrorToStatus(errorCode) {
  if (errorCode === 'RuntimeMissing' || errorCode === 'PipelineInitFailed' || errorCode === 'PythonRuntimeMissing') {
    return 503;
  }

  if (errorCode === 'InvalidImageData' || errorCode === 'InputImageMissing') {
    return 422;
  }

  return 500;
}

async function resolveCatFaceMatch(imageDataUrl) {
  const inference = await runKamFaceInference(imageDataUrl);
  const threshold = getCatFaceThreshold();

  if (!inference.success) {
    return {
      inference,
      threshold,
      matchResult: null,
      matchedRecord: null
    };
  }

  if (!inference.face_detected) {
    return {
      inference,
      threshold,
      matchResult: {
        bestMatch: null,
        topMatches: [],
        note: inference.warning || null
      },
      matchedRecord: null
    };
  }

  const matchResult = await findCatFaceMatches(prisma, inference.embedding, threshold);
  let matchedRecord = null;

  if (matchResult.bestMatch && matchResult.bestMatch.cat && matchResult.bestMatch.cat.id) {
    const matchedCat = await prisma.cat.findUnique({
      where: { id: matchResult.bestMatch.cat.id },
      select: {
        id: true,
        name: true,
        face_code: true,
        photo_url: true,
        status: true,
        owner_id: true,
        owner: {
          select: {
            id: true,
            email: true,
            username: true,
            display_name: true,
            role: true
          }
        }
      }
    });

    if (matchedCat) {
      matchedRecord = {
        embedding_id: matchResult.bestMatch.embedding_id,
        similarity: matchResult.bestMatch.similarity,
        provider: matchResult.bestMatch.provider,
        source_photo_url: matchResult.bestMatch.source_photo_url,
        created_at: matchResult.bestMatch.created_at,
        cat: {
          id: matchedCat.id,
          name: matchedCat.name,
          face_code: matchedCat.face_code,
          photo_url: matchedCat.photo_url,
          status: matchedCat.status,
          owner_id: matchedCat.owner_id,
          owner: serializeUser(matchedCat.owner)
        }
      };
    }
  }

  return {
    inference,
    threshold,
    matchResult,
    matchedRecord
  };
}

function slugifyName(name) {
  return String(name || 'organization')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20) || 'organization';
}

async function buildUniqueUsername(baseName) {
  let suffix = 0;

  while (true) {
    const candidate = suffix === 0 ? baseName : `${baseName}_${suffix}`;
    const existingUser = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true }
    });

    if (!existingUser) {
      return candidate;
    }

    suffix += 1;
  }
}

async function ensureRescueStaffUserForOrganization(organization) {
  const targetRole = organization.type === 'clinic' ? 'clinic_staff' : 'rescue_staff';
  const existingUser = await prisma.user.findUnique({
    where: { email: organization.email }
  });

  if (existingUser && existingUser.role !== targetRole) {
    throw new Error(`该机构邮箱已被其他账号占用，无法映射为 ${targetRole} 账号`);
  }

  if (existingUser) {
    if (existingUser.display_name !== organization.name || existingUser.password !== organization.password) {
      return prisma.user.update({
        where: { id: existingUser.id },
        data: {
          display_name: organization.name,
          password: organization.password,
          role: targetRole
        }
      });
    }

    return existingUser;
  }

  const username = await buildUniqueUsername(`org_${slugifyName(organization.name)}`);

  return prisma.user.create({
    data: {
      email: organization.email,
      password: organization.password,
      username,
      display_name: organization.name,
      role: targetRole
    }
  });
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { email, password, username, display_name, role, has_cat, adoption_preferences, owner_cat_enrollment } = req.body;

    if (!email || !password || !username) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '邮箱和密码是必填的'
      });
    }

    // 检查是否已存在用户
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      return res.status(422).json({
        success: false,
        error: 'UserExists',
        message: '该邮箱已注册'
      });
    }
    const existingUsername = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });
    if (existingUsername) {
      return res.status(422).json({
        success: false,
        error: 'UsernameExists',
        message: '该昵称已被使用，请更换一个昵称'
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    const ownerSignup = Boolean(has_cat);
    const ownerEnrollInput = owner_cat_enrollment && typeof owner_cat_enrollment === 'object'
      ? owner_cat_enrollment
      : null;

    if (ownerSignup) {
      if (!ownerEnrollInput || !ownerEnrollInput.image_data_url || !ownerEnrollInput.name) {
        return res.status(422).json({
          success: false,
          error: 'ValidationError',
          message: 'Owner sign-up requires completed cat-face enrollment and cat info.'
        });
      }

      const faceCheck = await resolveCatFaceMatch(String(ownerEnrollInput.image_data_url));
      if (!faceCheck.inference || !faceCheck.inference.success) {
        return res.status(mapCatFaceErrorToStatus(faceCheck.inference && faceCheck.inference.error_code)).json({
          success: false,
          error: (faceCheck.inference && faceCheck.inference.error_code) || 'FaceInferenceFailed',
          message: (faceCheck.inference && faceCheck.inference.message) || 'Cat face verification failed during sign-up.'
        });
      }
      if (!faceCheck.inference.face_detected) {
        return res.status(422).json({
          success: false,
          error: 'CatFaceNotDetected',
          message: faceCheck.inference.message || 'No cat face detected in the uploaded image.'
        });
      }
      if (faceCheck.matchedRecord && faceCheck.matchedRecord.cat) {
        return res.status(422).json({
          success: false,
          error: 'CatFaceAlreadyExists',
          message: 'This cat face already exists in database. Please use another cat face.'
        });
      }
    }

    // 创建用户（字段名要和 Member5 的 users 表对应）
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,                         // 必填
        display_name: display_name || '', // 可选
        has_cat: Boolean(has_cat),
        role: role || 'user'
      }
    });

    if (ownerSignup && ownerEnrollInput) {
      const requestedFaceCode = ownerEnrollInput.face_code ? String(ownerEnrollInput.face_code).trim() : '';
      let safeFaceCode = requestedFaceCode || null;
      if (safeFaceCode) {
        const existingFaceCode = await prisma.cat.findUnique({
          where: { face_code: safeFaceCode },
          select: { id: true }
        });
        if (existingFaceCode) safeFaceCode = null;
      }
      await prisma.cat.create({
        data: {
          name: String(ownerEnrollInput.name || '').trim().slice(0, 120) || 'My Cat',
          breed: ownerEnrollInput.breed ? String(ownerEnrollInput.breed).trim() : null,
          gender: normalizeCatGender(ownerEnrollInput.gender),
          is_neutered: normalizeNullableBoolean(ownerEnrollInput.is_neutered),
          is_vaccinated: normalizeNullableBoolean(ownerEnrollInput.is_vaccinated),
          intake_date: ownerEnrollInput.intake_date ? new Date(ownerEnrollInput.intake_date) : null,
          face_code: safeFaceCode,
          description: ownerEnrollInput.description ? String(ownerEnrollInput.description).trim() : null,
          photo_url: String(ownerEnrollInput.image_data_url),
          owner_id: user.id,
          status: 'adopted'
        }
      });
    }

    const prefInput = adoption_preferences && typeof adoption_preferences === 'object'
      ? adoption_preferences
      : null;
    const shouldSavePreferences = prefInput && (
      prefInput.preferred_gender ||
      prefInput.preferred_age ||
      prefInput.preferred_breed ||
      prefInput.home_environment ||
      (Array.isArray(prefInput.personality_tags) && prefInput.personality_tags.length)
    );
    if (shouldSavePreferences) {
      const createData = {
        user_id: user.id,
        preferred_gender: prefInput.preferred_gender || null,
        preferred_age: prefInput.preferred_age || null,
        preferred_breed: prefInput.preferred_breed || null
      };
      if (hasAdopterPreferenceField('home_environment')) {
        createData.home_environment = prefInput.home_environment || null;
      }
      if (hasAdopterPreferenceField('personality_tags')) {
        createData.personality_tags = Array.isArray(prefInput.personality_tags)
          ? prefInput.personality_tags.map((item) => String(item || '').trim()).filter(Boolean)
          : [];
      }
      await prisma.adopterPreference.upsert({
        where: { user_id: user.id },
        create: createData,
        update: createData
      });
    }

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
          has_cat: Boolean(user.has_cat),
          role: user.role
        }
      },
      message: '注册成功'
    });
  } catch (error) {
    console.error('register error:', error);
    if (error && error.code === 'P2002') {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '邮箱或昵称已存在，请更换后重试'
      });
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
        user: serializeUser(user)
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

// POST /api/auth/cat-face/identify
async function identifyCatFace(req, res) {
  try {
    const { image_data_url } = req.body;

    if (!image_data_url) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'image_data_url is required'
      });
    }

    const { inference, threshold, matchResult, matchedRecord } = await resolveCatFaceMatch(image_data_url);

    if (!inference.success) {
      return res.status(mapCatFaceErrorToStatus(inference.error_code)).json({
        success: false,
        error: inference.error_code || 'FaceInferenceFailed',
        message: inference.message || 'Cat face identification failed',
        data: inference
      });
    }

    if (!inference.face_detected) {
      return res.json({
        success: true,
        data: {
          matched: false,
          can_login: false,
          provider: inference.provider,
          face_detected: false,
          suggested_face_code: null,
          embedding: null,
          embedding_dim: 0,
          threshold,
          best_match: null,
          top_matches: [],
          note: inference.message || null
        },
        message: inference.message || 'No cat face detected'
      });
    }

    return res.json({
      success: true,
      data: {
        matched: Boolean(matchedRecord),
        can_login: Boolean(matchedRecord && matchedRecord.cat && matchedRecord.cat.owner),
        provider: inference.provider,
        device: inference.device,
        face_detected: true,
        suggested_face_code: inference.suggested_face_code,
        embedding: inference.embedding,
        embedding_dim: inference.embedding_dim,
        threshold,
        best_match: matchedRecord,
        top_matches: matchResult.topMatches,
        note: matchResult.note || inference.warning || null
      },
      message: matchedRecord ? 'Matched existing cat face' : 'No existing cat match found'
    });
  } catch (error) {
    console.error('identifyCatFace auth error:', error);
    return res.status(mapCatFaceErrorToStatus(error.code)).json({
      success: false,
      error: error.code || 'ServerError',
      message: error.message || 'Cat face identification failed'
    });
  }
}

// POST /api/auth/cat-face/login
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

    const { inference, threshold, matchResult, matchedRecord } = await resolveCatFaceMatch(image_data_url);

    if (!inference.success) {
      return res.status(mapCatFaceErrorToStatus(inference.error_code)).json({
        success: false,
        error: inference.error_code || 'FaceInferenceFailed',
        message: inference.message || 'Cat face login failed',
        data: inference
      });
    }

    if (!inference.face_detected) {
      return res.status(401).json({
        success: false,
        error: 'CatFaceNotDetected',
        message: inference.message || 'No cat face detected in the uploaded image.',
        data: {
          matched: false,
          can_login: false,
          face_detected: false,
          suggested_face_code: null,
          threshold
        }
      });
    }

    if (!matchedRecord) {
      return res.status(401).json({
        success: false,
        error: 'CatFaceNotMatched',
        message: 'No saved cat profile matches this photo yet.',
        data: {
          matched: false,
          can_login: false,
          face_detected: true,
          suggested_face_code: inference.suggested_face_code,
          threshold,
          top_matches: matchResult.topMatches
        }
      });
    }

    if (!matchedRecord.cat || !matchedRecord.cat.owner) {
      return res.status(409).json({
        success: false,
        error: 'CatOwnerNotLinked',
        message: 'This cat is recognized, but it is not linked to a user account yet.',
        data: {
          matched: true,
          can_login: false,
          face_detected: true,
          suggested_face_code: inference.suggested_face_code,
          threshold,
          best_match: matchedRecord
        }
      });
    }

    const owner = matchedRecord.cat.owner;
    const token = generateToken({ id: owner.id, role: owner.role });

    return res.json({
      success: true,
      data: {
        token,
        user: serializeUser(owner),
        login_method: 'cat_face',
        matched_cat: matchedRecord.cat,
        similarity: matchedRecord.similarity,
        suggested_face_code: inference.suggested_face_code,
        embedding_dim: inference.embedding_dim,
        threshold
      },
      message: 'Cat face login successful'
    });
  } catch (error) {
    console.error('loginWithCatFace error:', error);
    return res.status(mapCatFaceErrorToStatus(error.code)).json({
      success: false,
      error: error.code || 'ServerError',
      message: error.message || 'Cat face login failed'
    });
  }
}

// POST /api/auth/cat-face/bind-owner
async function bindCatFaceOwner(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Please log in first.'
      });
    }

    const { image_data_url } = req.body;
    if (!image_data_url) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'image_data_url is required'
      });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        role: true
      }
    });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'UserNotFound',
        message: 'Current user not found'
      });
    }

    const { inference, threshold, matchResult, matchedRecord } = await resolveCatFaceMatch(image_data_url);

    if (!inference.success) {
      return res.status(mapCatFaceErrorToStatus(inference.error_code)).json({
        success: false,
        error: inference.error_code || 'FaceInferenceFailed',
        message: inference.message || 'Cat face binding failed',
        data: inference
      });
    }

    if (!inference.face_detected) {
      return res.status(422).json({
        success: false,
        error: 'CatFaceNotDetected',
        message: inference.message || 'No cat face detected in the uploaded image.',
        data: {
          matched: false,
          can_login: false,
          face_detected: false,
          suggested_face_code: null,
          threshold
        }
      });
    }

    if (!matchedRecord || !matchedRecord.cat) {
      return res.status(404).json({
        success: false,
        error: 'CatFaceNotMatched',
        message: 'No saved cat profile matches this photo yet.',
        data: {
          matched: false,
          can_login: false,
          face_detected: true,
          suggested_face_code: inference.suggested_face_code,
          threshold,
          top_matches: matchResult ? matchResult.topMatches : []
        }
      });
    }

    if (matchedRecord.cat.owner && matchedRecord.cat.owner.id && matchedRecord.cat.owner.id !== userId) {
      return res.status(409).json({
        success: false,
        error: 'CatOwnerAlreadyLinked',
        message: 'This cat is already linked to another user account.',
        data: {
          matched: true,
          can_login: true,
          best_match: matchedRecord,
          threshold
        }
      });
    }

    const updatedCat = await prisma.cat.update({
      where: { id: matchedRecord.cat.id },
      data: { owner_id: userId },
      select: {
        id: true,
        name: true,
        face_code: true,
        photo_url: true,
        status: true,
        owner_id: true
      }
    });

    const token = generateToken({ id: currentUser.id, role: currentUser.role });

    return res.json({
      success: true,
      data: {
        token,
        user: serializeUser(currentUser),
        login_method: 'cat_face_bind',
        matched_cat: {
          id: updatedCat.id,
          name: updatedCat.name,
          face_code: updatedCat.face_code,
          photo_url: updatedCat.photo_url,
          status: updatedCat.status,
          owner_id: updatedCat.owner_id
        },
        similarity: matchedRecord.similarity,
        suggested_face_code: inference.suggested_face_code,
        embedding_dim: inference.embedding_dim,
        threshold
      },
      message: 'Cat profile linked to the current user account'
    });
  } catch (error) {
    console.error('bindCatFaceOwner error:', error);
    return res.status(mapCatFaceErrorToStatus(error.code)).json({
      success: false,
      error: error.code || 'ServerError',
      message: error.message || 'Cat face owner binding failed'
    });
  }
}

// POST /api/auth/cat-face/enroll-cat
async function enrollCatWithFace(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Please log in first.'
      });
    }

    const {
      image_data_url,
      name,
      breed,
      gender,
      is_neutered,
      is_vaccinated,
      intake_date,
      face_code,
      description
    } = req.body || {};

    if (!image_data_url) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'image_data_url is required'
      });
    }
    if (!name || !String(name).trim()) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'cat name is required'
      });
    }

    const faceCodeRaw = face_code ? String(face_code).trim() : '';
    let safeFaceCode = faceCodeRaw || null;
    if (safeFaceCode) {
      const existingFaceCode = await prisma.cat.findUnique({
        where: { face_code: safeFaceCode },
        select: { id: true }
      });
      if (existingFaceCode) {
        safeFaceCode = null;
      }
    }

    const createdCat = await prisma.cat.create({
      data: {
        name: String(name).trim().slice(0, 120),
        breed: breed ? String(breed).trim() : null,
        gender: gender ? String(gender).trim().toLowerCase() : null,
        is_neutered: is_neutered == null ? null : Boolean(is_neutered),
        is_vaccinated: is_vaccinated == null ? null : Boolean(is_vaccinated),
        intake_date: intake_date ? new Date(intake_date) : null,
        face_code: safeFaceCode,
        description: description ? String(description).trim() : null,
        photo_url: String(image_data_url),
        owner_id: userId,
        status: 'adopted'
      },
      select: {
        id: true,
        name: true,
        face_code: true,
        breed: true,
        gender: true,
        is_neutered: true,
        is_vaccinated: true,
        intake_date: true,
        description: true,
        owner_id: true,
        status: true
      }
    });

    await prisma.user.update({
      where: { id: userId },
      data: { has_cat: true }
    });

    return res.status(201).json({
      success: true,
      data: createdCat,
      message: 'Cat profile enrolled successfully'
    });
  } catch (error) {
    console.error('enrollCatWithFace error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: error.message || 'Cat profile enrollment failed'
    });
  }
}

// POST /api/auth/org/register
// 诊所注册：在 Organization 表和 User 表同时创建记录，一步完成
// 这样 getOrgIdForUser() 就能通过邮箱匹配找到诊所身份
async function orgRegister(req, res) {
  try {
    const { name, email, password, phone, address, license_number, type } = req.body;

    if (!name || !email || !password) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '诊所名称、邮箱、密码为必填项'
      });
    }

    if (password.length < 6) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '密码长度至少为 6 个字符'
      });
    }

    // 检查 Organization 是否已存在
    const existingOrg = await prisma.organization.findUnique({ where: { email } });
    if (existingOrg) {
      return res.status(422).json({
        success: false,
        error: 'OrgExists',
        message: '该邮箱已被注册为机构账号，请直接登录'
      });
    }

    // 检查 User 是否已存在（同一邮箱）
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(422).json({
        success: false,
        error: 'UserExists',
        message: '该邮箱已被注册为普通用户，请使用其他邮箱'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const orgType = type === 'rescue' ? 'rescue' : 'clinic';

    // 创建 Organization
    const org = await prisma.organization.create({
      data: {
        name,
        type: orgType,
        email,
        password: hashedPassword, // bcrypt 加密存储
        phone: phone || null,
        address: address || null,
        license_number: license_number || null,
        is_verified: false
      }
    });

    // 自动创建关联的 User（role=clinic_staff），由 ensureRescueStaffUserForOrganization 统一处理
    const staffUser = await ensureRescueStaffUserForOrganization(org);

    const token = generateToken({
      id: staffUser.id,
      role: staffUser.role,
      account_type: 'organization',
      organization_id: org.id,
      organization_type: org.type,
      organization_name: org.name
    });

    return res.status(201).json({
      success: true,
      data: {
        token,
        organization: {
          id: org.id,
          name: org.name,
          type: org.type,
          email: org.email,
          phone: org.phone,
          address: org.address,
          is_verified: org.is_verified
        },
        user: {
          id: staffUser.id,
          username: staffUser.username,
          display_name: staffUser.display_name,
          role: staffUser.role
        }
      },
      message: '诊所注册成功'
    });
  } catch (error) {
    console.error('orgRegister error:', error);
    if (error && error.code === 'P2002') {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '该邮箱已被注册，请更换后重试'
      });
    }
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

// POST /api/auth/org/login
async function orgLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '机构邮箱和密码是必填的'
      });
    }

    const organization = await prisma.organization.findUnique({
      where: { email }
    });

    if (!organization) {
      return res.status(401).json({
        success: false,
        error: 'InvalidCredentials',
        message: '机构邮箱或密码错误'
      });
    }

    const isMatch = await bcrypt.compare(password, organization.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'InvalidCredentials',
        message: '机构邮箱或密码错误'
      });
    }

    const rescueStaffUser = await ensureRescueStaffUserForOrganization(organization);

    const token = generateToken({
      id: rescueStaffUser.id,
      role: rescueStaffUser.role,
      account_type: 'organization',
      organization_id: organization.id,
      organization_type: organization.type,
      organization_name: organization.name
    });

    return res.json({
      success: true,
      data: {
        token,
        organization: {
          id: organization.id,
          name: organization.name,
          type: organization.type,
          email: organization.email,
          phone: organization.phone,
          address: organization.address,
          logo_url: organization.logo_url,
          description: organization.description
        },
        rescue_staff_user: {
          id: rescueStaffUser.id,
          username: rescueStaffUser.username,
          display_name: rescueStaffUser.display_name,
          role: rescueStaffUser.role
        }
      },
      message: '机构登录成功'
    });
  } catch (error) {
    console.error('orgLogin error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: error.message || '服务器错误'
    });
  }
}

module.exports = {
  register,
  login,
  identifyCatFace,
  loginWithCatFace,
  bindCatFaceOwner,
  enrollCatWithFace,
  orgRegister,
  orgLogin,
  ensureRescueStaffUserForOrganization
};
