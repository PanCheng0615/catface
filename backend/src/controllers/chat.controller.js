const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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
    latest_message: latestMessage ? mapMessage(latestMessage, currentUserId) : null
  };
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
      }
    }
  });
}

async function createConversation(req, res) {
  try {
    const userId = typeof req.body.user_id === 'string' ? req.body.user_id.trim() : '';

    if (!userId) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'user_id is required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, username: true, display_name: true, email: true }
    });

    if (!user || user.role !== 'user') {
      return res.status(404).json({
        success: false,
        error: 'UserNotFound',
        message: 'Adopter user not found'
      });
    }

    const conversation = await prisma.conversation.upsert({
      where: {
        user_id_org_id: {
          user_id: userId,
          org_id: req.user.id
        }
      },
      update: {},
      create: {
        user_id: userId,
        org_id: req.user.id
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

    return res.status(201).json({
      success: true,
      data: mapConversation(conversation, req.user.id),
      message: 'Conversation ready'
    });
  } catch (error) {
    console.error('createConversation error:', error);
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

    return res.json({
      success: true,
      data: conversations.map((conversation) => mapConversation(conversation, req.user.id)),
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

    return res.json({
      success: true,
      data: {
        conversation: {
          id: conversation.id,
          user_id: conversation.user_id,
          org_id: conversation.org_id,
          user: conversation.user
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
