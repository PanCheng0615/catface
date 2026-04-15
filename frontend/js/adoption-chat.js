(function () {
  var conversationList = document.getElementById('conversationList');
  var chatTitle = document.getElementById('chatTitle');
  var chatSubtitle = document.getElementById('chatSubtitle');
  var chatMeta = document.getElementById('chatMeta');
  var chatBody = document.getElementById('chatBody');
  var chatEmptyState = document.getElementById('chatEmptyState');
  var chatForm = document.getElementById('chatForm');
  var messageInput = document.getElementById('messageInput');
  var sendBtn = document.getElementById('sendBtn');
  var attachmentInput = document.getElementById('attachmentInput');
  var attachmentPreview = document.getElementById('attachmentPreview');
  var navHeroName = document.getElementById('navHeroName');
  var navHeroStatus = document.getElementById('navHeroStatus');
  var navAvatar = document.getElementById('navAvatar');
  var navUserName = document.getElementById('navUserName');
  var navUserHandle = document.getElementById('navUserHandle');

  var pendingImages = [];
  var activeConversationId = '';
  var conversations = [];
  var conversationRefreshTimer = null;
  var conversationRefreshInFlight = false;

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatTime(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString();
  }

  function requireLogin() {
    if (typeof isLoggedIn === 'function' && isLoggedIn()) return true;
    window.alert('Please log in first.');
    window.location.href = '/pages/log-in.html';
    return false;
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('catface_user') || 'null');
    } catch (e) {
      return null;
    }
  }

  function renderNavUser() {
    var user = getCurrentUser();
    var display = user ? (user.display_name || user.username || 'User') : 'Guest';
    var handle = user && user.username ? '@' + user.username : 'Log in to continue';
    if (navHeroName) navHeroName.textContent = display;
    if (navHeroStatus) navHeroStatus.textContent = user ? 'Active account' : 'Not logged in';
    if (navAvatar) navAvatar.textContent = display.charAt(0).toUpperCase();
    if (navUserName) navUserName.textContent = display;
    if (navUserHandle) navUserHandle.textContent = handle;
  }

  function apiRequest(path, options) {
    return fetch(API_BASE_URL + path, options).then(function (res) {
      return res.json().catch(function () {
        return { success: false, message: 'Invalid server response' };
      }).then(function (payload) {
        if (!res.ok || !payload.success) {
          throw new Error(payload.message || 'Request failed');
        }
        return payload.data;
      });
    });
  }

  function getDisplayName(conversation) {
    var organization = conversation && conversation.organization;
    if (organization && organization.name) return organization.name;
    var org = conversation && conversation.org;
    if (!org) return 'Rescue organization';
    return org.display_name || org.username || 'Rescue organization';
  }

  function getConversationMeta(conversation) {
    var latest = conversation && conversation.latest_message;
    if (!latest) return 'No messages yet';
    return latest.content === '[attachment]' ? 'Shared an attachment' : (latest.content || 'No preview');
  }

  function getQueryParams() {
    return new URLSearchParams(window.location.search);
  }

  function getRequestedConversationTarget() {
    var params = getQueryParams();
    return {
      conversationId: String(params.get('conversation') || '').trim(),
      catId: String(params.get('cat') || '').trim(),
      orgId: String(params.get('org') || '').trim()
    };
  }

  function renderConversationList() {
    if (!conversationList) return;
    if (!conversations.length) {
      conversationList.innerHTML =
        '<div class="thread-item">' +
          '<div class="thread-name">No organization chat yet</div>' +
          '<div class="thread-meta">Open a rescue contact entry first</div>' +
          '<div class="thread-snippet">Open chat from a cat profile, adoption application, or organization profile to start the direct conversation.</div>' +
        '</div>';
      return;
    }

    conversationList.innerHTML = conversations.map(function (conversation) {
      var latest = conversation.latest_message;
      return (
        '<div class="thread-item' + (conversation.id === activeConversationId ? ' active' : '') + '" data-conversation-id="' + escapeHtml(conversation.id) + '">' +
          '<div class="thread-name">' + escapeHtml(getDisplayName(conversation)) + '</div>' +
          '<div class="thread-meta">' + escapeHtml(latest ? formatTime(latest.created_at) : formatTime(conversation.created_at)) + '</div>' +
          '<div class="thread-snippet">' + escapeHtml(getConversationMeta(conversation)) + '</div>' +
        '</div>'
      );
    }).join('');

    conversationList.querySelectorAll('[data-conversation-id]').forEach(function (item) {
      item.addEventListener('click', function () {
        openConversation(item.getAttribute('data-conversation-id'));
      });
    });
  }

  function renderMessages(payload) {
    if (!chatBody) return;
    var conversation = payload && payload.conversation;
    var messages = payload && Array.isArray(payload.messages) ? payload.messages : [];

    if (chatEmptyState) chatEmptyState.style.display = 'none';
    chatTitle.textContent = getDisplayName(conversation);
    chatSubtitle.textContent = 'Use this thread to continue your adoption follow-up with the rescue organization.';
    chatMeta.textContent = 'Conversation started ' + formatTime(conversation.created_at || '');

    if (!messages.length) {
      chatBody.innerHTML = '<div class="chat-empty">No messages yet. Send the first message to begin the rescue follow-up.</div>';
      return;
    }

    chatBody.innerHTML = messages.map(function (message) {
      var text = message.content === '[attachment]' ? '' : (message.content || '');
      var images = Array.isArray(message.attachments) ? message.attachments : [];
      return (
        '<div class="msg ' + (message.is_mine ? 'mine' : 'other') + '">' +
          '<div class="msg-bubble">' +
            (text ? '<div>' + escapeHtml(text).replace(/\n/g, '<br>') + '</div>' : '') +
            (images.length
              ? '<div class="msg-images">' + images.map(function (attachment) {
                  return '<img src="' + escapeHtml(attachment.file_url) + '" alt="Attachment">';
                }).join('') + '</div>'
              : '') +
          '</div>' +
          '<div class="msg-time">' + escapeHtml(formatTime(message.created_at)) + '</div>' +
        '</div>'
      );
    }).join('');

    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function renderAttachmentPreview() {
    if (!attachmentPreview) return;
    if (!pendingImages.length) {
      attachmentPreview.innerHTML = '';
      return;
    }

    attachmentPreview.innerHTML = pendingImages.map(function (image, index) {
      return (
        '<div class="attachment-item" data-image-index="' + index + '">' +
          '<img src="' + escapeHtml(image.src) + '" alt="' + escapeHtml(image.name) + '">' +
          '<button class="attachment-remove" type="button">&#x2715;</button>' +
        '</div>'
      );
    }).join('');

    attachmentPreview.querySelectorAll('[data-image-index]').forEach(function (item) {
      item.querySelector('.attachment-remove').addEventListener('click', function () {
        var index = Number(item.getAttribute('data-image-index'));
        pendingImages.splice(index, 1);
        renderAttachmentPreview();
      });
    });
  }

  function loadConversations() {
    if (!requireLogin()) return Promise.resolve();
    return apiRequest('/chat/conversations', {
      method: 'GET',
      headers: getAuthHeaders()
    }).then(function (data) {
      conversations = Array.isArray(data) ? data : [];
      renderConversationList();
      var requestedTarget = getRequestedConversationTarget();
      if (!activeConversationId && !requestedTarget.conversationId && !requestedTarget.catId && !requestedTarget.orgId && conversations.length) {
        return openConversation(conversations[0].id).then(function () {
          return conversations;
        });
      }
      return conversations;
    });
  }

  function openConversation(conversationId) {
    if (!conversationId) return Promise.resolve();
    activeConversationId = conversationId;
    renderConversationList();
    chatBody.innerHTML = '<div class="chat-empty">Loading conversation...</div>';
    return apiRequest('/chat/conversations/' + encodeURIComponent(conversationId) + '/messages', {
      method: 'GET',
      headers: getAuthHeaders()
    }).then(function (payload) {
      renderMessages(payload);
    }).catch(function (error) {
      chatBody.innerHTML = '<div class="chat-empty">' + escapeHtml(error.message || 'Unable to load conversation.') + '</div>';
    });
  }

  function refreshActiveConversation() {
    if (!activeConversationId || conversationRefreshInFlight) return Promise.resolve();
    conversationRefreshInFlight = true;
    return loadConversations()
      .then(function () {
        return openConversation(activeConversationId);
      })
      .finally(function () {
        conversationRefreshInFlight = false;
      });
  }

  function startConversationAutoRefresh() {
    if (conversationRefreshTimer) {
      window.clearInterval(conversationRefreshTimer);
    }
    conversationRefreshTimer = window.setInterval(function () {
      if (document.hidden) return;
      refreshActiveConversation();
    }, 4000);
  }

  function ensureConversationForCat(catId) {
    return apiRequest('/chat/conversations', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ cat_id: catId })
    });
  }

  function ensureConversationForOrg(orgId) {
    return apiRequest('/chat/conversations', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ org_id: orgId })
    });
  }

  function autoOpenFromQuery() {
    var target = getRequestedConversationTarget();
    var conversationId = target.conversationId;
    var catId = target.catId;
    var orgId = target.orgId;

    if (conversationId) {
      if (!conversations.some(function (item) { return item.id === conversationId; })) {
        conversations.unshift({
          id: conversationId,
          created_at: '',
          org: { display_name: 'Loading conversation...' },
          latest_message: null
        });
        renderConversationList();
      }
      return openConversation(conversationId);
    }

    if (!catId && !orgId) {
      return Promise.resolve();
    }

    var prepareConversation = catId
      ? ensureConversationForCat(catId)
      : ensureConversationForOrg(orgId);

    return prepareConversation.then(function (conversation) {
      if (!conversation || !conversation.id) return;
      var next = new URLSearchParams(window.location.search);
      next.set('conversation', conversation.id);
      next.delete('cat');
      next.delete('org');
      window.history.replaceState(null, '', window.location.pathname + '?' + next.toString());
      conversations = conversations.filter(function (item) { return item.id !== conversation.id; });
      conversations.unshift(conversation);
      renderConversationList();
      return openConversation(conversation.id);
    }).catch(function (error) {
      chatBody.innerHTML = '<div class="chat-empty">' + escapeHtml(error.message || 'Unable to prepare the rescue conversation.') + '</div>';
    });
  }

  if (attachmentInput) {
    attachmentInput.addEventListener('change', function (event) {
      var files = Array.from(event.target.files || []).slice(0, 3);
      if (!files.length) return;
      Promise.all(files.map(function (file) {
        return new Promise(function (resolve) {
          var reader = new FileReader();
          reader.onload = function () {
            resolve({
              name: file.name,
              src: reader.result
            });
          };
          reader.readAsDataURL(file);
        });
      })).then(function (images) {
        pendingImages = images;
        renderAttachmentPreview();
      });
    });
  }

  if (chatForm) {
    chatForm.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!activeConversationId) {
        window.alert('Please open the organization conversation first.');
        return;
      }

      var content = messageInput.value.trim();
      if (!content && !pendingImages.length) return;

      sendBtn.disabled = true;
      apiRequest('/chat/conversations/' + encodeURIComponent(activeConversationId) + '/messages', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          content: content,
          attachments: pendingImages.map(function (image) {
            return {
              file_url: image.src,
              file_type: 'image/*'
            };
          })
        })
      }).then(function () {
        messageInput.value = '';
        pendingImages = [];
        if (attachmentInput) attachmentInput.value = '';
        renderAttachmentPreview();
        return loadConversations().then(function () {
          return openConversation(activeConversationId);
        });
      }).catch(function (error) {
        window.alert(error.message || 'Unable to send message.');
      }).finally(function () {
        sendBtn.disabled = false;
      });
    });
  }

  renderNavUser();
  if (!requireLogin()) return;
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      refreshActiveConversation();
    }
  });
  window.addEventListener('focus', function () {
    refreshActiveConversation();
  });
  window.addEventListener('beforeunload', function () {
    if (conversationRefreshTimer) {
      window.clearInterval(conversationRefreshTimer);
    }
  });
  loadConversations().then(function () {
    return autoOpenFromQuery();
  }).then(function () {
    startConversationAutoRefresh();
  });
})();
