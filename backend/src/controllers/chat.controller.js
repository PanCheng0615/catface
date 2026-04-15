const { PrismaClient } = require('@prisma/client');
const { ensureRescueStaffUserForOrganization } = require('./auth.controller');

const prisma = new PrismaClient();

function isOrganizationChatRole(role) {
  return role === 'rescue_staff' || role === 'clinic_staff' || role === 'admin';
}

function buildHttpError(status, error, message) {
  const err = new Error(message);
  err.status = status;
  err.code = error;
  return err;
}

async function resolveConversationParticipants(req) {
  if (req.user.role === 'user') {
    const catId = typeof req.body.cat_id === 'string' ? req.body.cat_id.trim() : '';
    const orgUserId = typeof req.body.org_id === 'string' ? req.body.org_id.trim() : '';

    if (!catId && !orgUserId) {
      throw buildHttpError(422, 'ValidationError', 'cat_id or org_id is required');
    }

    if (catId) {
      const cat = await prisma.cat.findUnique({
        where: { id: catId },
        include: { organization: true }
      });

      if (!cat) {
        throw buildHttpError(404, 'CatNotFound', 'Cat not found');
      }

      if (!cat.organization) {
        throw buildHttpError(422, 'ChatUnavailable', 'This cat is not linked to a rescue organization yet');
      }

      const orgUser = await ensureRescueStaffUserForOrganization(cat.organization);
      return {
        userId: req.user.id,
        orgId: orgUser.id
      };
    }

    const orgUser = await prisma.user.findUnique({
      where: { id: orgUserId },
      select: { id: true, role: true }
    });

    if (!orgUser || !isOrganizationChatRole(orgUser.role)) {
      throw buildHttpError(404, 'OrganizationUserNotFound', 'Organization chat account not found');
    }

    return {
      userId: req.user.id,
      orgId: orgUser.id
    };
  }

  const userId = typeof req.body.user_id === 'string' ? req.body.user_id.trim() : '';
  if (!userId) {
    throw buildHttpError(422, 'ValidationError', 'user_id is required');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true }
  });

  if (!user || user.role !== 'user') {
    throw buildHttpError(404, 'UserNotFound', 'Adopter user not found');
  }

  return {
    userId,
    orgId: req.user.id
  };
}

function mapAttachment(attachment) {
  return {
    id: attachment.id,
    file_url: attachment.file_url,
    file_type: attachment.file_type,
    created_at: attachment.created_at
  };
}

function mapMessage(message, currentUserId) {
  return {
    id: message.id,
    conversation_id: message.conversation_id,
    sender_id: message.sender_id,
    content: message.content,
    created_at: message.created_at,
    is_mine: message.sender_id === currentUserId,
    sender: message.sender
      ? {
          id: message.sender.id,
          username: message.sender.username,
          display_name: message.sender.display_name,
          role: message.sender.role
        }
      : null,
    attachments: Array.isArray(message.attachments)
      ? message.attachments.map(mapAttachment)
      : []
  };
}

function mapConversation(conversation, currentUserId) {
  const latestMessage = Array.isArray(conversation.messages) ? conversation.messages[0] : null;
  const organization = conversation.organization || null;

  return {
    id: conversation.id,
    user_id: conversation.user_id,
    org_id: conversation.org_id,
    created_at: conversation.created_at,
    user: conversation.user
      ? {
          id: conversation.user.id,
          username: conversation.user.username,
          display_name: conversation.user.display_name,
          email: conversation.user.email
        }
      : null,
    org: conversation.org
      ? {
          id: conversation.org.id,
          username: conversation.org.username,
          display_name: conversation.org.display_name,
          email: conversation.org.email
        }
      : null,
    organization: organization
      ? {
          id: organization.id,
          name: organization.name,
          type: organization.type,
          logo_url: organization.logo_url
        }
      : null,
    latest_message: latestMessage ? mapMessage(latestMessage, currentUserId) : null
  };
}

async function enrichConversationOrganizations(conversations) {
  if (!Array.isArray(conversations) || !conversations.length) return conversations || [];
  const orgEmails = [...new Set(
    conversations
      .map((conversation) => conversation && conversation.org && conversation.org.email ? String(conversation.org.email).trim() : '')
      .filter(Boolean)
  )];
  if (!orgEmails.length) return conversations;

  const organizations = await prisma.organization.findMany({
    where: { email: { in: orgEmails } },
    select: { id: true, name: true, type: true, logo_url: true, email: true }
  });
  const organizationByEmail = new Map();
  organizations.forEach((organization) => {
    if (!organization || !organization.email) return;
    organizationByEmail.set(String(organization.email).trim(), organization);
  });

  return conversations.map((conversation) => {
    if (!conversation || !conversation.org || !conversation.org.email) return conversation;
    const match = organizationByEmail.get(String(conversation.org.email).trim());
    return {
      ...conversation,
      organization: match || null
    };
  });
}

async function getAccessibleConversation(conversationId, currentUserId) {
  return prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [
        { user_id: currentUserId },
        { org_id: currentUserId }
      ]
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
      org: {
        select: {
          id: true,
          username: true,
          display_name: true,
          email: true
        }
      }
    }
  });
}

async function createConversation(req, res) {
  try {
    const participants = await resolveConversationParticipants(req);

    const conversation = await prisma.conversation.upsert({
      where: {
        user_id_org_id: {
          user_id: participants.userId,
          org_id: participants.orgId
        }
      },
      update: {},
      create: {
        user_id: participants.userId,
        org_id: participants.orgId
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
        org: {
          select: {
            id: true,
            username: true,
            display_name: true,
            email: true
          }
        },
        messages: {
          take: 1,
          orderBy: { created_at: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                display_name: true,
                role: true
              }
            },
            attachments: true
          }
        }
      }
    });
    const enrichedList = await enrichConversationOrganizations([conversation]);
    const enrichedConversation = enrichedList[0] || conversation;

    return res.status(201).json({
      success: true,
      data: mapConversation(enrichedConversation, req.user.id),
      message: 'Conversation ready'
    });
  } catch (error) {
    console.error('createConversation error:', error);
    if (error && error.status) {
      return res.status(error.status).json({
        success: false,
        error: error.code || 'RequestError',
        message: error.message || 'Unable to create conversation'
      });
    }
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: 'Unable to create conversation'
    });
  }
}

async function getConversations(req, res) {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user_id: req.user.id },
          { org_id: req.user.id }
        ]
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
        org: {
          select: {
            id: true,
            username: true,
            display_name: true,
            email: true
          }
        },
        messages: {
          take: 1,
          orderBy: { created_at: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                display_name: true,
                role: true
              }
            },
            attachments: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    const enrichedConversations = await enrichConversationOrganizations(conversations);

    return res.json({
      success: true,
      data: enrichedConversations.map((conversation) => mapConversation(conversation, req.user.id)),
      message: 'Fetched conversations'
    });
  } catch (error) {
    console.error('getConversations error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: 'Unable to fetch conversations'
    });
  }
}

async function getMessages(req, res) {
  try {
    const conversation = await getAccessibleConversation(req.params.id, req.user.id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'ConversationNotFound',
        message: 'Conversation not found'
      });
    }

    const messages = await prisma.message.findMany({
      where: { conversation_id: conversation.id },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            display_name: true,
            role: true
          }
        },
        attachments: true
      },
      orderBy: { created_at: 'asc' }
    });
    const enrichedList = await enrichConversationOrganizations([conversation]);
    const enrichedConversation = enrichedList[0] || conversation;

    return res.json({
      success: true,
      data: {
        conversation: {
          id: enrichedConversation.id,
          user_id: enrichedConversation.user_id,
          org_id: enrichedConversation.org_id,
          user: enrichedConversation.user
            ? {
                id: enrichedConversation.user.id,
                username: enrichedConversation.user.username,
                display_name: enrichedConversation.user.display_name,
                email: enrichedConversation.user.email
              }
            : null,
          org: enrichedConversation.org
            ? {
                id: enrichedConversation.org.id,
                username: enrichedConversation.org.username,
                display_name: enrichedConversation.org.display_name,
                email: enrichedConversation.org.email
              }
            : null,
          organization: enrichedConversation.organization
            ? {
                id: enrichedConversation.organization.id,
                name: enrichedConversation.organization.name,
                type: enrichedConversation.organization.type,
                logo_url: enrichedConversation.organization.logo_url
              }
            : null
        },
        messages: messages.map((message) => mapMessage(message, req.user.id))
      },
      message: 'Fetched messages'
    });
  } catch (error) {
    console.error('getMessages error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: 'Unable to fetch messages'
    });
  }
}

async function sendMessage(req, res) {
  try {
    const conversation = await getAccessibleConversation(req.params.id, req.user.id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'ConversationNotFound',
        message: 'Conversation not found'
      });
    }

    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    const attachments = Array.isArray(req.body.attachments) ? req.body.attachments : [];

    if (!content && !attachments.length) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'Message content or attachments are required'
      });
    }

    const message = await prisma.message.create({
      data: {
        conversation_id: conversation.id,
        sender_id: req.user.id,
        content: content || '[attachment]',
        attachments: attachments.length
          ? {
              create: attachments
                .filter((attachment) => attachment && attachment.file_url)
                .map((attachment) => ({
                  file_url: attachment.file_url,
                  file_type: attachment.file_type || 'image/*'
                }))
            }
          : undefined
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            display_name: true,
            role: true
          }
        },
        attachments: true
      }
    });

    return res.status(201).json({
      success: true,
      data: mapMessage(message, req.user.id),
      message: 'Message sent'
    });
  } catch (error) {
    console.error('sendMessage error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: 'Unable to send message'
    });
  }
}

module.exports = {
  createConversation,
  getConversations,
  getMessages,
  sendMessage
};
