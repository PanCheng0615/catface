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

function mapMessage(message) {
  return {
    id: message.id,
    conversation_id: message.conversation_id,
    sender_id: message.sender_id,
    content: message.content,
    created_at: message.created_at,
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

function mapConversation(conversation) {
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
          role: conversation.user.role
        }
      : null,
    org: conversation.org
      ? {
          id: conversation.org.id,
          username: conversation.org.username,
          display_name: conversation.org.display_name,
          role: conversation.org.role
        }
      : null
  };
}

async function getAccessibleConversation(conversationId, currentUserId) {
  return prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ user_id: currentUserId }, { org_id: currentUserId }]
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          display_name: true,
          role: true
        }
      },
      org: {
        select: {
          id: true,
          username: true,
          display_name: true,
          role: true
        }
      }
    }
  });
}

function getConversationParticipants(req) {
  const { org_id, user_id } = req.body;

  if (req.user.role === 'rescue_staff' || req.user.role === 'admin') {
    return {
      user_id,
      org_id: req.user.id
    };
  }

  return {
    user_id: req.user.id,
    org_id
  };
}

async function createConversation(req, res) {
  try {
    const { initial_message } = req.body;
    const { user_id, org_id } = getConversationParticipants(req);

    if (!user_id || !org_id) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '必须提供 user_id 和 org_id 以创建聊天会话'
      });
    }

    const [user, org] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user_id },
        select: {
          id: true,
          username: true,
          display_name: true,
          role: true
        }
      }),
      prisma.user.findUnique({
        where: { id: org_id },
        select: {
          id: true,
          username: true,
          display_name: true,
          role: true
        }
      })
    ]);

    if (!user || !org) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: '会话参与方不存在'
      });
    }

    if (org.role !== 'rescue_staff' && req.user.role !== 'admin') {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: 'org_id 必须对应救助机构账号'
      });
    }

    const existingConversation = await prisma.conversation.findUnique({
      where: {
        user_id_org_id: {
          user_id,
          org_id
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            role: true
          }
        },
        org: {
          select: {
            id: true,
            username: true,
            display_name: true,
            role: true
          }
        }
      }
    });

    const trimmedInitialMessage = typeof initial_message === 'string'
      ? initial_message.trim()
      : '';

    if (existingConversation) {
      if (trimmedInitialMessage) {
        await prisma.message.create({
          data: {
            conversation_id: existingConversation.id,
            sender_id: req.user.id,
            content: trimmedInitialMessage
          }
        });
      }

      return res.json({
        success: true,
        data: mapConversation(existingConversation),
        message: '聊天会话已存在'
      });
    }

    const conversation = await prisma.conversation.create({
      data: {
        user_id,
        org_id,
        messages: trimmedInitialMessage
          ? {
              create: {
                sender_id: req.user.id,
                content: trimmedInitialMessage
              }
            }
          : undefined
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            role: true
          }
        },
        org: {
          select: {
            id: true,
            username: true,
            display_name: true,
            role: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      data: mapConversation(conversation),
      message: '聊天会话创建成功'
    });
  } catch (error) {
    console.error('createConversation error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

async function getConversations(req, res) {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user_id: req.user.id }, { org_id: req.user.id }]
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            role: true
          }
        },
        org: {
          select: {
            id: true,
            username: true,
            display_name: true,
            role: true
          }
        },
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1,
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
      data: conversations.map((conversation) => ({
        ...mapConversation(conversation),
        latest_message: conversation.messages[0]
          ? mapMessage(conversation.messages[0])
          : null
      })),
      message: '获取会话列表成功'
    });
  } catch (error) {
    console.error('getConversations error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

async function getMessages(req, res) {
  try {
    const conversation = await getAccessibleConversation(
      req.params.id,
      req.user.id
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: '聊天会话不存在或无权访问'
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
        conversation: mapConversation(conversation),
        messages: messages.map(mapMessage)
      },
      message: '获取消息历史成功'
    });
  } catch (error) {
    console.error('getMessages error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

async function sendMessage(req, res) {
  try {
    const conversation = await getAccessibleConversation(
      req.params.id,
      req.user.id
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: '聊天会话不存在或无权访问'
      });
    }

    const content = typeof req.body.content === 'string'
      ? req.body.content.trim()
      : '';

    if (!content) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '消息内容不能为空'
      });
    }

    const message = await prisma.message.create({
      data: {
        conversation_id: conversation.id,
        sender_id: req.user.id,
        content
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
      data: mapMessage(message),
      message: '消息发送成功'
    });
  } catch (error) {
    console.error('sendMessage error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

async function uploadConversationImages(req, res) {
  try {
    const conversation = await getAccessibleConversation(
      req.params.id,
      req.user.id
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: '聊天会话不存在或无权访问'
      });
    }

    const attachments = Array.isArray(req.body.attachments)
      ? req.body.attachments
      : req.body.file_url
        ? [{ file_url: req.body.file_url, file_type: req.body.file_type }]
        : [];

    const validAttachments = attachments
      .map((attachment) => ({
        file_url:
          typeof attachment.file_url === 'string'
            ? attachment.file_url.trim()
            : '',
        file_type:
          typeof attachment.file_type === 'string' && attachment.file_type.trim()
            ? attachment.file_type.trim()
            : 'image'
      }))
      .filter((attachment) => attachment.file_url);

    if (!validAttachments.length) {
      return res.status(422).json({
        success: false,
        error: 'ValidationError',
        message: '至少需要提供一个图片附件'
      });
    }

    const content = typeof req.body.content === 'string' && req.body.content.trim()
      ? req.body.content.trim()
      : validAttachments.length === 1
        ? 'Image attachment'
        : 'Image attachments';

    const message = await prisma.message.create({
      data: {
        conversation_id: conversation.id,
        sender_id: req.user.id,
        content,
        attachments: {
          create: validAttachments
        }
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
      data: mapMessage(message),
      message: '图片消息上传成功'
    });
  } catch (error) {
    console.error('uploadConversationImages error:', error);
    return res.status(500).json({
      success: false,
      error: 'ServerError',
      message: '服务器错误'
    });
  }
}

module.exports = {
  createConversation,
  getConversations,
  getMessages,
  sendMessage,
  uploadConversationImages
};
