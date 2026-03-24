const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function mapCat(cat) {
  return {
    id: cat.id,
    name: cat.name,
    breed: cat.breed,
    age_months: cat.age_months,
    gender: cat.gender,
    color: cat.color,
    description: cat.description,
    photo_url: cat.photo_url,
    is_available: cat.is_available,
    owner_id: cat.owner_id,
    org_id: cat.org_id,
    created_at: cat.created_at,
    updated_at: cat.updated_at,
    tags: Array.isArray(cat.tags)
      ? cat.tags.map((tag) => ({
          id: tag.id,
          tag: tag.tag,
          created_at: tag.created_at
        }))
      : []
  };
}

function parseAgeMonthsInput(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (/^\d+$/.test(normalized)) {
    return Number(normalized);
  }

  const yearMatch = normalized.match(/(\d+)\s*year/);
  const monthMatch = normalized.match(/(\d+)\s*month/);

  if (yearMatch || monthMatch) {
    const years = yearMatch ? Number(yearMatch[1]) : 0;
    const months = monthMatch ? Number(monthMatch[1]) : 0;
    return years * 12 + months;
  }

  return null;
}

function buildCatDescription({ notes, health, personality }) {
  const lines = [];

  if (personality) {
    lines.push(`性格: ${personality}`);
  }

  if (health) {
    lines.push(`健康: ${health}`);
  }

  if (notes) {
    lines.push(`備註: ${notes}`);
  }

  return lines.join('\n') || null;
}

function normalizeTagValues(tags, personality) {
  const values = [];

  if (Array.isArray(tags)) {
    tags.forEach((tag) => {
      const normalized = String(tag || '').trim();
      if (normalized) {
        values.push(normalized);
      }
    });
  }

  if (typeof personality === 'string' && personality.trim()) {
    personality
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .forEach((tag) => values.push(tag));
  }

  return Array.from(new Set(values)).slice(0, 12);
}

function mapApplication(application) {
  return {
    id: application.id,
    user_id: application.user_id,
    cat_id: application.cat_id,
    status: application.status,
    message: application.message,
    created_at: application.created_at,
    updated_at: application.updated_at,
    user: application.user
      ? {
          id: application.user.id,
          username: application.user.username,
          display_name: application.user.display_name,
          email: application.user.email
        }
      : null,
    cat: application.cat
      ? {
          id: application.cat.id,
          name: application.cat.name,
          breed: application.cat.breed,
          is_available: application.cat.is_available
        }
      : null
  };
}

function buildRecentMonthBuckets(count) {
  const now = new Date();
  const buckets = [];

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    buckets.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleString('en-US', { month: 'short' })
    });
  }

  return buckets;
}

function ensureOrganizationScope(req, res) {
  if (req.user?.role === 'admin') {
    return {
      isAdmin: true,
      organizationId: null
    };
  }

  if (!req.user?.organization_id) {
    res.status(403).json({
      success: false,
      error: 'OrganizationScopeMissing',
      message: '当前机构会话缺少 organization_id，请重新使用机构账号登录'
    });
    return null;
  }

  return {
    isAdmin: false,
    organizationId: req.user.organization_id
  };
}

async function getCats(req, res) {
  try {
    const scope = ensureOrganizationScope(req, res);
    if (!scope) return;

    const cats = await prisma.cat.findMany({
      where: scope.isAdmin ? undefined : { org_id: scope.organizationId },
      include: {
        tags: true
      },
      orderBy: [
        { created_at: 'desc' },
        { name: 'asc' }
      ]
    });

    return res.json({
      success: true,
      data: cats.map(mapCat),
      message: '获取救助机构猫咪列表成功'
    });
  } catch (error) {
    console.error('getCats error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

async function createCat(req, res) {
  try {
    const scope = ensureOrganizationScope(req, res);
    if (!scope) return;

    const {
      name,
      breed,
      gender,
      age,
      status,
      health,
      location,
      notes,
      personality,
      photo_url,
      tags
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '猫咪名称不能为空'
      });
    }

    const tagValues = normalizeTagValues(tags, personality);
    const createdCat = await prisma.cat.create({
      data: {
        name: String(name).trim(),
        breed: typeof breed === 'string' && breed.trim() ? breed.trim() : null,
        age_months: parseAgeMonthsInput(age),
        gender: typeof gender === 'string' && gender.trim() ? gender.trim() : null,
        color: typeof location === 'string' && location.trim() ? location.trim() : null,
        description: buildCatDescription({
          notes: typeof notes === 'string' ? notes.trim() : '',
          health: typeof health === 'string' ? health.trim() : '',
          personality: typeof personality === 'string' ? personality.trim() : ''
        }),
        photo_url: typeof photo_url === 'string' && photo_url.trim() ? photo_url.trim() : null,
        is_available: status === 'Available',
        org_id: scope.isAdmin
          ? (typeof req.body.org_id === 'string' && req.body.org_id.trim() ? req.body.org_id.trim() : null)
          : scope.organizationId,
        tags: tagValues.length
          ? {
              create: tagValues.map((tag) => ({ tag }))
            }
          : undefined
      },
      include: {
        tags: true
      }
    });

    return res.status(201).json({
      success: true,
      data: mapCat(createdCat),
      message: '创建猫咪档案成功'
    });
  } catch (error) {
    console.error('createCat error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

async function updateCat(req, res) {
  try {
    const scope = ensureOrganizationScope(req, res);
    if (!scope) return;

    const existingCat = scope.isAdmin
      ? await prisma.cat.findUnique({
          where: { id: req.params.id },
          include: {
            tags: true
          }
        })
      : await prisma.cat.findFirst({
          where: {
            id: req.params.id,
            org_id: scope.organizationId
          },
          include: {
            tags: true
          }
        });

    if (!existingCat) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: '猫咪档案不存在'
      });
    }

    const {
      name,
      breed,
      gender,
      age,
      status,
      health,
      location,
      notes,
      personality,
      photo_url,
      tags
    } = req.body;

    const tagValues = normalizeTagValues(tags, personality);
    const updatedCat = await prisma.cat.update({
      where: { id: req.params.id },
      data: {
        name: typeof name === 'string' && name.trim() ? name.trim() : existingCat.name,
        breed: typeof breed === 'string' ? breed.trim() || null : existingCat.breed,
        age_months: age !== undefined ? parseAgeMonthsInput(age) : existingCat.age_months,
        gender: typeof gender === 'string' ? gender.trim() || null : existingCat.gender,
        color: typeof location === 'string' ? location.trim() || null : existingCat.color,
        description: buildCatDescription({
          notes: typeof notes === 'string' ? notes.trim() : '',
          health: typeof health === 'string' ? health.trim() : '',
          personality: typeof personality === 'string' ? personality.trim() : ''
        }),
        photo_url: typeof photo_url === 'string' ? photo_url.trim() || null : existingCat.photo_url,
        is_available: status ? status === 'Available' : existingCat.is_available,
        tags: {
          deleteMany: {},
          create: tagValues.map((tag) => ({ tag }))
        }
      },
      include: {
        tags: true
      }
    });

    return res.json({
      success: true,
      data: mapCat(updatedCat),
      message: '更新猫咪档案成功'
    });
  } catch (error) {
    console.error('updateCat error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

async function getApplications(req, res) {
  try {
    const scope = ensureOrganizationScope(req, res);
    if (!scope) return;

    const where = {};
    const catScope = {};

    if (typeof req.query.status === 'string' && req.query.status.trim()) {
      where.status = req.query.status.trim();
    }

    if (typeof req.query.cat_id === 'string' && req.query.cat_id.trim()) {
      catScope.id = req.query.cat_id.trim();
    }

    if (!scope.isAdmin) {
      catScope.org_id = scope.organizationId;
    }

    if (Object.keys(catScope).length) {
      where.cat = { is: catScope };
    }

    const applications = await prisma.adoptionApplication.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            email: true
          }
        },
        cat: {
          select: {
            id: true,
            name: true,
            breed: true,
            is_available: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return res.json({
      success: true,
      data: applications.map(mapApplication),
      message: '获取领养申请列表成功'
    });
  } catch (error) {
    console.error('getApplications error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

async function reviewApplication(req, res) {
  try {
    const scope = ensureOrganizationScope(req, res);
    if (!scope) return;

    const { status, message } = req.body;
    const allowedStatuses = ['pending', 'approved', 'rejected'];

    if (!allowedStatuses.includes(status)) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'status 只能是 pending、approved 或 rejected'
      });
    }

    const existingApplication = scope.isAdmin
      ? await prisma.adoptionApplication.findUnique({
          where: { id: req.params.id }
        })
      : await prisma.adoptionApplication.findFirst({
          where: {
            id: req.params.id,
            cat: {
              is: {
                org_id: scope.organizationId
              }
            }
          }
        });

    if (!existingApplication) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: '领养申请不存在'
      });
    }

    if (existingApplication.status !== 'pending') {
      return res.status(409).json({
        success: false,
        error: 'StatusLocked',
        message: '该申请已完成审核，不能再次修改状态'
      });
    }

    const updatedApplication = await prisma.adoptionApplication.update({
      where: { id: req.params.id },
      data: {
        status,
        message:
          typeof message === 'string' && message.trim()
            ? message.trim()
            : existingApplication.message
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            email: true
          }
        },
        cat: {
          select: {
            id: true,
            name: true,
            breed: true,
            is_available: true
          }
        }
      }
    });

    return res.json({
      success: true,
      data: mapApplication(updatedApplication),
      message: '领养申请审核状态更新成功'
    });
  } catch (error) {
    console.error('reviewApplication error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

async function getAnalytics(req, res) {
  try {
    const scope = ensureOrganizationScope(req, res);
    if (!scope) return;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const catWhere = scope.isAdmin ? undefined : { org_id: scope.organizationId };
    const applicationWhere = scope.isAdmin
      ? undefined
      : {
          cat: {
            is: {
              org_id: scope.organizationId
            }
          }
        };
    const conversationWhere = scope.isAdmin ? undefined : { org_id: req.user.id };

    const [
      cats,
      applications,
      conversations
    ] = await Promise.all([
      prisma.cat.findMany({
        where: catWhere,
        select: {
          id: true,
          breed: true,
          is_available: true,
          created_at: true
        }
      }),
      prisma.adoptionApplication.findMany({
        where: applicationWhere,
        orderBy: { updated_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              display_name: true,
              email: true
            }
          },
          cat: {
            select: {
              id: true,
              name: true,
              breed: true,
              is_available: true
            }
          }
        }
      }),
      prisma.conversation.findMany({
        where: conversationWhere,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              display_name: true
            }
          },
          messages: {
            take: 1,
            orderBy: { created_at: 'desc' },
            include: {
              sender: {
                select: {
                  id: true,
                  role: true,
                  username: true,
                  display_name: true
                }
              }
            }
          }
        }
      })
    ]);

    const totalApplications = applications.length;
    const pendingApplications = applications.filter((item) => item.status === 'pending').length;
    const approvedApplications = applications.filter((item) => item.status === 'approved').length;
    const rejectedApplications = applications.filter((item) => item.status === 'rejected').length;
    const availableCats = cats.filter((item) => item.is_available).length;
    const activeConversations = conversations.length;
    const monthlyApprovedApplications = applications.filter((item) => {
      return item.status === 'approved' && item.updated_at >= monthStart;
    }).length;

    const reviewedApplications = applications.filter((item) => item.status !== 'pending');
    const avgReviewHours = reviewedApplications.length
      ? Number(
          (
            reviewedApplications.reduce((total, item) => {
              return total + (item.updated_at.getTime() - item.created_at.getTime()) / (1000 * 60 * 60);
            }, 0) / reviewedApplications.length
          ).toFixed(1)
        )
      : 0;

    const successRate = totalApplications
      ? Number(((approvedApplications / totalApplications) * 100).toFixed(1))
      : 0;

    const monthBuckets = buildRecentMonthBuckets(6);
    const monthlyTrendMap = monthBuckets.reduce((accumulator, bucket) => {
      accumulator[bucket.key] = {
        month: bucket.label,
        applications: 0,
        approved: 0
      };
      return accumulator;
    }, {});

    applications.forEach((application) => {
      const createdKey = `${application.created_at.getFullYear()}-${String(application.created_at.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyTrendMap[createdKey]) {
        monthlyTrendMap[createdKey].applications += 1;
      }

      const approvedKey = `${application.updated_at.getFullYear()}-${String(application.updated_at.getMonth() + 1).padStart(2, '0')}`;
      if (application.status === 'approved' && monthlyTrendMap[approvedKey]) {
        monthlyTrendMap[approvedKey].approved += 1;
      }
    });

    const breedPreferenceMap = {};
    applications.forEach((application) => {
      const breed = application.cat && application.cat.breed
        ? application.cat.breed
        : 'Unknown';
      breedPreferenceMap[breed] = (breedPreferenceMap[breed] || 0) + 1;
    });

    const breedPreferences = Object.entries(breedPreferenceMap)
      .map(([breed, count]) => ({ breed, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const pendingAttentionItems = applications
      .filter((application) => application.status === 'pending')
      .slice(0, 3)
      .map((application) => ({
        id: application.id,
        type: 'application',
        label: 'Pending review',
        title: `${application.user?.display_name || application.user?.username || 'Unknown adopter'} · ${application.cat?.name || 'Unknown cat'}`,
        subtitle: application.message || 'This application is waiting for a decision.',
        status: application.status,
        updated_at: application.updated_at,
        application_id: application.id
      }));

    const conversationAttentionItems = conversations
      .map((conversation) => {
        const latestMessage = Array.isArray(conversation.messages) ? conversation.messages[0] : null;
        return {
          id: conversation.id,
          user: conversation.user,
          latest_message: latestMessage
        };
      })
      .filter((conversation) => {
        return conversation.latest_message && conversation.latest_message.sender
          ? conversation.latest_message.sender.role !== 'rescue_staff' && conversation.latest_message.sender.role !== 'admin'
          : false;
      })
      .sort((a, b) => b.latest_message.created_at.getTime() - a.latest_message.created_at.getTime())
      .slice(0, 3)
      .map((conversation) => ({
        id: conversation.id,
        type: 'conversation',
        label: 'Reply needed',
        title: conversation.user?.display_name || conversation.user?.username || 'Unknown adopter',
        subtitle: conversation.latest_message?.content || 'A user sent a new message.',
        updated_at: conversation.latest_message?.created_at || null,
        conversation_id: conversation.id
      }));

    const recentApplications = applications.slice(0, 5);

    return res.json({
      success: true,
      data: {
        overview: {
          total_applications: totalApplications,
          pending_applications: pendingApplications,
          approved_applications: approvedApplications,
          rejected_applications: rejectedApplications,
          available_cats: availableCats,
          monthly_approved_applications: monthlyApprovedApplications,
          success_rate: successRate,
          approval_rate: successRate,
          completed_adoptions: approvedApplications,
          active_conversations: activeConversations,
          avg_review_hours: avgReviewHours
        },
        funnel: {
          submitted: totalApplications,
          pending: pendingApplications,
          approved: approvedApplications,
          rejected: rejectedApplications
        },
        monthly_trend: monthBuckets.map((bucket) => monthlyTrendMap[bucket.key]),
        status_breakdown: [
          { status: 'pending', label: 'Pending', count: pendingApplications },
          { status: 'approved', label: 'Approved', count: approvedApplications },
          { status: 'rejected', label: 'Rejected', count: rejectedApplications }
        ],
        breed_preferences: breedPreferences,
        attention_items: pendingAttentionItems.concat(conversationAttentionItems),
        recent_applications: recentApplications.map((application) => ({
          id: application.id,
          status: application.status,
          updated_at: application.updated_at,
          cat: application.cat
            ? {
                id: application.cat.id,
                name: application.cat.name,
                breed: application.cat.breed
              }
            : null,
          user: application.user
            ? {
                id: application.user.id,
                username: application.user.username,
                display_name: application.user.display_name
              }
            : null
        }))
      },
      message: '获取救助机构数据分析成功'
    });
  } catch (error) {
    console.error('getAnalytics error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

module.exports = {
  getCats,
  createCat,
  updateCat,
  getApplications,
  reviewApplication,
  getAnalytics
};
