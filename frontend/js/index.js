// frontend/js/index.js
// index.html 专属逻辑
// 依赖: config.js（必须在此文件之前引入）

(function () {

  /* =====================================================
     1. 侧边栏登录状态
     根据 Token 是否存在，切换"Log in"和"My Account"
     ===================================================== */
  const loginBtn = document.querySelector('.login-btn');
  const loginTip = document.querySelector('.login-tip');

  function applyUserState() {
    if (isLoggedIn()) {
      if (loginBtn) {
        loginBtn.textContent = 'My Account';
        loginBtn.href = 'account.html';
      }
      if (loginTip) loginTip.style.display = 'none';
    } else {
      if (loginBtn) {
        loginBtn.textContent = 'Log in';
        loginBtn.href = 'log-in.html';
      }
      if (loginTip) loginTip.style.display = '';
    }
  }

  applyUserState();


  /* =====================================================
     2. 推荐帖子详情弹窗（点赞 + 评论）
     ===================================================== */
  const cards       = document.querySelectorAll('.post-card');
  const overlay     = document.getElementById('postDetailOverlay');
  const detailImage = document.getElementById('detailImage');
  const detailTitle = document.getElementById('detailTitle');
  const detailAuthorAvatar = document.getElementById('detailAuthorAvatar');
  const detailAuthorName   = document.getElementById('detailAuthorName');
  const detailLikeBtn      = document.getElementById('detailLikeBtn');
  const detailLikeIcon     = document.getElementById('detailLikeIcon');
  const detailLikeLabel    = document.getElementById('detailLikeLabel');
  const detailLikesText    = document.getElementById('detailLikesText');
  const detailComments     = document.getElementById('detailComments');
  const commentForm        = document.getElementById('commentForm');
  const commentInput       = document.getElementById('commentInput');
  const closePostDetail    = document.getElementById('closePostDetail');
  const detailAuthorHeader = document.querySelector('.post-modal-author');

  function parseLikes(text) {
    const match = text.replace(/,/g, '').match(/(\d+)\s*(k)?/i);
    if (!match) return 0;
    let num = parseInt(match[1], 10) || 0;
    if (match[2]) num = num * 1000;
    return num;
  }

  function formatLikes(num) {
    return num >= 1000 ? (num / 1000).toFixed(0) + 'k' : String(num);
  }

  const sampleComments = [
    [
      { author: 'CatMom88',   text: 'So adorable!! 😍 Luna looks so happy!' },
      { author: 'PurrLover',  text: 'My cat does the same thing every Sunday ☀️' },
      { author: 'WhiskerFan', text: 'That sunny spot looks perfect 🐱' }
    ],
    [
      { author: 'TabbyTales', text: 'Max is gorgeous! What brand of kibble?' },
      { author: 'CatNerd',    text: 'British Shorthairs are the best breed 💙' },
      { author: 'Meowzilla',  text: 'He looks so regal haha 👑' }
    ],
    [
      { author: 'AdoptDontShop', text: 'Ginger is so pretty! Has she found a home yet??' },
      { author: 'OrangeCatClub', text: 'Orange cats are literally the best 🧡' },
      { author: 'KittyRescue',   text: 'Sharing this to help find her a family!' }
    ],
    [
      { author: 'VetStudent22', text: 'Purrfect numbers indeed! Great vet visit 🏥' },
      { author: 'CatParent',   text: 'My baby has his checkup next week, hoping for the same!' },
      { author: 'DrMeow',      text: 'Happy healthy kitty 🐾' }
    ],
    [
      { author: 'MultiCatHome', text: 'Sibling cats are the cutest thing ever 🥰' },
      { author: 'ShadowFan',   text: 'Shadow & Friends content is always so wholesome!' },
      { author: 'CatGang',     text: 'The more the merrier 😄' }
    ],
    [
      { author: 'CuddleLover', text: 'This is literally the most heartwarming thing 💕' },
      { author: 'LunaStan',    text: 'Luna's posts always make my day better 🌸' },
      { author: 'HappyCats',   text: 'This is why I love cats so much 😭❤️' }
    ],
    [
      { author: 'TechCatDad',  text: '5 miles!! Charlie is fitter than me lol 🏃' },
      { author: 'SmartCollar', text: 'Which smart collar brand is this? Want one for my cat!' },
      { author: 'ActivePets',  text: 'Love seeing healthy active cats 💪' }
    ],
    [
      { author: 'AdoptMe2024', text: 'Patches is STUNNING. Is she still available??' },
      { author: 'CalicoClan',  text: 'Calico cats are so unique, no two look the same 🎨' },
      { author: 'ForeverHome', text: 'Sharing this everywhere, she deserves love! 🏠' }
    ]
  ];

  const posts = [];
  let currentIndex = null;

  cards.forEach(function (card, index) {
    const img      = card.querySelector('.cover');
    const titleEl  = card.querySelector('.title');
    const userEl   = card.querySelector('.user');
    const likesEl  = card.querySelector('.likes');
    const authorText = userEl ? userEl.textContent.trim() : 'User';

    posts.push({
      index,
      image:    img     ? img.src              : '',
      title:    titleEl ? titleEl.textContent.trim() : '',
      author:   authorText,
      likes:    likesEl ? parseLikes(likesEl.textContent) : 0,
      liked:    false,
      comments: sampleComments[index] ? sampleComments[index].slice() : []
    });

    card.dataset.postIndex = String(index);
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => openDetail(index));

    if (userEl) {
      userEl.style.cursor = 'pointer';
      userEl.addEventListener('click', function (e) {
        e.stopPropagation();
        openProfile(authorText);
      });
    }
  });

  function updateLikeUI(post) {
    detailLikeIcon.textContent  = post.liked ? '❤' : '♡';
    detailLikeLabel.textContent = post.liked ? 'Liked' : 'Like';
    detailLikeBtn.classList.toggle('is-liked', post.liked);
    detailLikesText.textContent = formatLikes(post.likes) + ' likes';

    const card    = cards[post.index];
    const likesEl = card && card.querySelector('.likes');
    if (likesEl) likesEl.textContent = '❤️ ' + formatLikes(post.likes);
  }

  function renderComments(post) {
    detailComments.innerHTML = '';
    if (!post.comments.length) {
      detailComments.innerHTML =
        '<div style="color:#aaa;font-size:13px;padding:12px 0;text-align:center;">No comments yet. Be the first! 💬</div>';
      return;
    }
    post.comments.forEach(function (c) {
      const item = document.createElement('div');
      item.className = 'post-comment-item';
      const initials = (c.author || 'U').charAt(0).toUpperCase();
      item.innerHTML =
        '<div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:10px;">' +
          '<div style="width:28px;height:28px;border-radius:50%;background:var(--brand-light);color:var(--brand);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">' + initials + '</div>' +
          '<div>' +
            '<span class="post-comment-author" style="color:var(--text-main);font-size:13px;font-weight:600;">' + (c.author || 'User') + '</span>' +
            '<div style="color:var(--text-sub);font-size:13px;margin-top:2px;">' + String(c.text || '').replace(/</g, '&lt;') + '</div>' +
          '</div>' +
        '</div>';
      detailComments.appendChild(item);
    });
  }

  function openDetail(index) {
    const post = posts[index];
    if (!post) return;
    currentIndex = index;
    detailImage.src             = post.image || '';
    detailTitle.textContent     = post.title || '';
    detailAuthorName.textContent = post.author || 'User';
    detailAuthorAvatar.style.background = '#ddd';
    updateLikeUI(post);
    renderComments(post);
    overlay.classList.add('is-open');
  }

  function openProfile(author) {
    window.location.href = 'cat-profile.html?author=' + encodeURIComponent(author || 'Cat Lover');
  }

  function closeDetail() {
    overlay.classList.remove('is-open');
    currentIndex = null;
  }

  if (closePostDetail) closePostDetail.addEventListener('click', closeDetail);
  if (overlay) overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeDetail();
  });

  if (detailAuthorHeader) {
    detailAuthorHeader.addEventListener('click', function () {
      const name = detailAuthorName ? detailAuthorName.textContent.trim() : '';
      openProfile(name);
    });
  }

  if (detailLikeBtn) {
    detailLikeBtn.addEventListener('click', function () {
      if (currentIndex == null) return;
      const post = posts[currentIndex];
      if (!post) return;
      post.liked  = !post.liked;
      post.likes += post.liked ? 1 : -1;
      if (post.likes < 0) post.likes = 0;
      updateLikeUI(post);
    });
  }

  if (commentForm) {
    commentForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (currentIndex == null) return;
      const post = posts[currentIndex];
      if (!post) return;
      const text = commentInput.value.trim();
      if (!text) return;
      post.comments.push({ author: 'You', text });
      commentInput.value = '';
      renderComments(post);
    });
  }


  /* =====================================================
     3. 登录表单（弹窗）— 调用真实后端 API
     后端: POST /api/auth/login  { email, password }
     ===================================================== */
  const loginForm      = document.getElementById('loginForm');
  const loginEmailInput = document.getElementById('login-email');
  const loginPwdInput  = document.getElementById('login-password');
  const loginError     = document.getElementById('loginError');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');

  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const email    = loginEmailInput ? loginEmailInput.value.trim() : '';
      const password = loginPwdInput   ? loginPwdInput.value          : '';

      if (!email || !password) {
        showError(loginError, '请填写邮箱和密码');
        return;
      }

      setButtonLoading(loginSubmitBtn, true);
      clearError(loginError);

      try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const result = await res.json();

        if (result.success) {
          setToken(result.data.token);
          // 保存用户信息，供侧边栏展示
          localStorage.setItem('catface_user', JSON.stringify(result.data.user));
          applyUserState();
          closeAuthOverlay('login');
        } else {
          showError(loginError, result.message || '登录失败，请检查邮箱和密码');
        }
      } catch (err) {
        showError(loginError, '网络错误，请确认后端服务已启动');
        console.error('login error:', err);
      } finally {
        setButtonLoading(loginSubmitBtn, false);
      }
    });
  }


  /* =====================================================
     4. 注册表单（弹窗）— 调用真实后端 API
     后端: POST /api/auth/register  { email, password, username, display_name }
     ===================================================== */
  const registerForm     = document.getElementById('registerForm');
  const regNameInput     = document.getElementById('reg-name');
  const regEmailInput    = document.getElementById('reg-email');
  const regPwdInput      = document.getElementById('reg-password');
  const registerError    = document.getElementById('registerError');
  const registerSubmitBtn = document.getElementById('registerSubmitBtn');

  if (registerForm) {
    registerForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const display_name = regNameInput  ? regNameInput.value.trim()  : '';
      const email        = regEmailInput ? regEmailInput.value.trim() : '';
      const password     = regPwdInput   ? regPwdInput.value          : '';

      if (!display_name || !email || !password) {
        showError(registerError, '请填写昵称、邮箱和密码');
        return;
      }

      if (password.length < 6) {
        showError(registerError, '密码至少需要 6 位');
        return;
      }

      // 用 email 的 @ 前面部分作为 username
      const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'user';

      setButtonLoading(registerSubmitBtn, true);
      clearError(registerError);

      try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, username, display_name })
        });

        const result = await res.json();

        if (result.success) {
          setToken(result.data.token);
          localStorage.setItem('catface_user', JSON.stringify(result.data.user));
          applyUserState();
          closeAuthOverlay('register');
        } else {
          showError(registerError, result.message || '注册失败，请重试');
        }
      } catch (err) {
        showError(registerError, '网络错误，请确认后端服务已启动');
        console.error('register error:', err);
      } finally {
        setButtonLoading(registerSubmitBtn, false);
      }
    });
  }


  /* =====================================================
     工具函数
     ===================================================== */
  function showError(el, msg) {
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }

  function clearError(el) {
    if (el) { el.textContent = ''; el.style.display = 'none'; }
  }

  function setButtonLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? '请稍候...' : btn.dataset.label || btn.textContent;
  }

  function closeAuthOverlay(type) {
    const el = document.getElementById(type);
    if (el) el.classList.remove('is-open');
    // :target 方式关闭：把 hash 清掉
    if (window.location.hash === '#' + type) {
      history.pushState('', document.title, window.location.pathname);
    }
  }

})();
