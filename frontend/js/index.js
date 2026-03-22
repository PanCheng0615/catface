// frontend/js/index.js  —  Community feed + post detail
// Requires: config.js loaded first

(function () {

  /* ─────────────────────────────────────────────
     POST DATA  (mock feed data)
  ───────────────────────────────────────────── */
  var POSTS = [
    {
      id: 1,
      author: 'Luna',
      time:   '2 hours ago',
      image:  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&h=1000&q=80',
      text:   "Hi! I'm Luna 🐱 My human took me out today and I got to sunbathe! So warm and cozy outside — I stayed in the sun for three whole hours. Life is purrfect!",
      likes:  23000,
      liked:  false,
      comments: [
        { author: 'CatMom88',   text: 'So adorable!! Luna looks so happy! 😍' },
        { author: 'PurrLover',  text: 'My cat does the same thing every Sunday ☀️' },
        { author: 'WhiskerFan', text: 'That sunny spot looks absolutely perfect 🐱' }
      ]
    },
    {
      id: 2,
      author: 'Max',
      time:   '5 hours ago',
      image:  'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=800&h=1000&q=80',
      text:   "Meow! I'm Max the British Shorthair 🐾 Everyone keeps asking what I eat — I love my premium kibble! My coat has never been shinier. Ask me anything about cat nutrition!",
      likes:  67000,
      liked:  false,
      comments: [
        { author: 'TabbyTales', text: 'Max is gorgeous! What brand of kibble do you use?' },
        { author: 'CatNerd',    text: 'British Shorthairs are the best breed 💙' },
        { author: 'Meowzilla',  text: 'He looks so regal haha 👑' },
        { author: 'KibbleQueen', text: 'Diet really does make a huge difference for coat quality!' }
      ]
    },
    {
      id: 3,
      author: 'Ginger',
      time:   'Yesterday',
      image:  'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=800&h=1000&q=80',
      text:   "Hi humans! I'm Ginger 🧡 I'm 1 year old and super friendly! I love cuddles and playing with feather toys. I'm looking for my forever home — please share!",
      likes:  11000,
      liked:  false,
      comments: [
        { author: 'AdoptDontShop', text: 'Ginger is so pretty! Has she found a home yet??' },
        { author: 'OrangeCatClub', text: 'Orange cats are literally the best 🧡' },
        { author: 'KittyRescue',   text: 'Sharing this to help find her a family! 🏠' }
      ]
    },
    {
      id: 4,
      author: 'Whiskers',
      time:   'Yesterday',
      image:  'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=800&h=1000&q=80',
      text:   "Just got my annual checkup! 🏥 My human says I'm super healthy — all my numbers are purrfect! Weight: ideal. Teeth: clean. Claws: freshly trimmed. Feeling amazing!",
      likes:  82000,
      liked:  false,
      comments: [
        { author: 'VetStudent22', text: 'Purrfect numbers indeed! Great vet visit 🏥' },
        { author: 'CatParent',   text: 'My baby has her checkup next week, hoping for the same result!' },
        { author: 'DrMeow',      text: 'Happy healthy kitty 🐾' }
      ]
    },
    {
      id: 5,
      author: 'Shadow & Friends',
      time:   '2 days ago',
      image:  'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=800&h=1000&q=80',
      text:   "My siblings and I love our new litter box! 🚽 So much space for all of us. Mum got us the self-cleaning model and honestly it changed our lives. Highly recommend for multi-cat households!",
      likes:  35000,
      liked:  false,
      comments: [
        { author: 'MultiCatHome', text: 'Sibling cats are the cutest thing ever 🥰' },
        { author: 'ShadowFan',   text: 'Shadow & Friends content is always so wholesome!' },
        { author: 'CleanCatDad', text: 'Which self-cleaning model did you get? We have 4 cats!' }
      ]
    },
    {
      id: 6,
      author: 'Luna',
      time:   '2 days ago',
      image:  'https://images.unsplash.com/photo-1511275539165-cc46b1ee89bf?auto=format&fit=crop&w=800&h=1000&q=80',
      text:   "Best part of my day: cuddle time with my human! 💕 So warm and safe. I always wait by the door when they come home. Love is real, and it smells like kibble and warm laps.",
      likes:  42000,
      liked:  false,
      comments: [
        { author: 'CuddleLover', text: 'This is literally the most heartwarming thing 💕' },
        { author: 'LunaStan',    text: "Luna's posts always make my day better 🌸" },
        { author: 'HappyCats',   text: 'This is why I love cats so much 😭❤️' }
      ]
    },
    {
      id: 7,
      author: 'Charlie',
      time:   '3 days ago',
      image:  'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=800&h=1000&q=80',
      text:   "My smart collar says I ran 5 miles today! 🏃 My heart rate stayed perfect the whole time. My human is always so proud. I think I'm more athletic than most humans honestly.",
      likes:  9000,
      liked:  false,
      comments: [
        { author: 'TechCatDad',  text: '5 miles!! Charlie is fitter than me lol 🏃' },
        { author: 'SmartCollar', text: 'Which smart collar brand is this? Want one for my cat!' },
        { author: 'ActivePets',  text: 'Love seeing healthy active cats 💪' }
      ]
    },
    {
      id: 8,
      author: 'Patches',
      time:   '3 days ago',
      image:  'https://images.unsplash.com/photo-1571566882372-1598d88abd90?auto=format&fit=crop&w=800&h=1000&q=80',
      text:   "Hello! I'm Patches the calico! 🎨 I'm 2 years old, fully vaccinated, spayed, and ready for love! I get along well with other cats. Please share — I'm still looking for my forever family!",
      likes:  56000,
      liked:  false,
      comments: [
        { author: 'AdoptMe2024', text: 'Patches is STUNNING. Is she still available??' },
        { author: 'CalicoClan',  text: 'Calico cats are so unique, no two look the same 🎨' },
        { author: 'ForeverHome', text: 'Sharing this everywhere, she deserves love! 🏠' },
        { author: 'CatRescueHK', text: 'DM us! We may be able to help with rehoming 💙' }
      ]
    }
  ];


  /* ─────────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────────── */
  function fmtLikes(n) {
    if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
    return String(n);
  }

  function initial(name) {
    return (name || 'U').charAt(0).toUpperCase();
  }


  /* ─────────────────────────────────────────────
     SIDEBAR: login state
  ───────────────────────────────────────────── */
  var loginBtn = document.getElementById('sidebarLoginBtn');
  var loginTip = document.getElementById('loginTip');

  function applyUserState() {
    if (isLoggedIn()) {
      if (loginBtn) { loginBtn.textContent = 'My Account'; loginBtn.href = 'account.html'; }
      if (loginTip) loginTip.style.display = 'none';
    } else {
      if (loginBtn) { loginBtn.textContent = 'Log in'; loginBtn.href = 'log-in.html'; }
      if (loginTip) loginTip.style.display = '';
    }
  }
  applyUserState();


  /* ─────────────────────────────────────────────
     BUILD FEED CARDS
  ───────────────────────────────────────────── */
  var feed = document.getElementById('postFeed');

  POSTS.forEach(function (post) {
    var card = document.createElement('article');
    card.className = 'post-card';
    card.innerHTML =
      '<img class="cover" src="' + post.image + '" alt="' + post.author + ' post" loading="lazy">' +
      '<div class="body">' +
        '<h3 class="title">' + post.text.slice(0, 80) + (post.text.length > 80 ? '…' : '') + '</h3>' +
        '<div class="meta">' +
          '<span class="user">' +
            '<span class="avatar-sm">' + initial(post.author) + '</span>' +
            post.author +
          '</span>' +
          '<span class="likes">&#x2665; ' + fmtLikes(post.likes) + '</span>' +
        '</div>' +
      '</div>';
    card.addEventListener('click', function () { openDetail(post.id); });
    feed.appendChild(card);
  });


  /* ─────────────────────────────────────────────
     POST DETAIL OVERLAY
  ───────────────────────────────────────────── */
  var overlay    = document.getElementById('postOverlay');
  var pmImg      = document.getElementById('pmImg');
  var pmAvatar   = document.getElementById('pmAvatar');
  var pmAuthor   = document.getElementById('pmAuthor');
  var pmTime     = document.getElementById('pmTime');
  var pmText     = document.getElementById('pmText');
  var pmLikeBtn  = document.getElementById('pmLikeBtn');
  var pmHeart    = document.getElementById('pmHeart');
  var pmLikeCount    = document.getElementById('pmLikeCount');
  var pmCommentCount = document.getElementById('pmCommentCount');
  var pmComments     = document.getElementById('pmComments');
  var pmCommentForm  = document.getElementById('pmCommentForm');
  var pmCommentInput = document.getElementById('pmCommentInput');
  var pmSendBtn      = document.getElementById('pmSendBtn');
  var pmClose        = document.getElementById('pmClose');

  var currentPost = null;

  function openDetail(id) {
    var post = POSTS.find(function (p) { return p.id === id; });
    if (!post) return;
    currentPost = post;

    pmImg.src              = post.image;
    pmImg.alt              = post.author + ' post';
    pmAvatar.textContent   = initial(post.author);
    pmAuthor.textContent   = post.author;
    pmTime.textContent     = post.time;
    pmText.textContent     = post.text;
    pmLikeCount.textContent = fmtLikes(post.likes);
    updateLikeUI(post);
    renderComments(post);

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    pmCommentInput.focus();
  }

  function closeDetail() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    currentPost = null;
  }

  function updateLikeUI(post) {
    if (post.liked) {
      pmHeart.innerHTML = '&#x2665;';
      pmLikeBtn.classList.add('liked');
    } else {
      pmHeart.innerHTML = '&#x2661;';
      pmLikeBtn.classList.remove('liked');
    }
    pmLikeCount.textContent = fmtLikes(post.likes);
  }

  function renderComments(post) {
    pmComments.innerHTML = '';
    pmCommentCount.textContent = post.comments.length;

    if (post.comments.length === 0) {
      pmComments.innerHTML = '<div class="comment-empty">No comments yet — be the first! 💬</div>';
      return;
    }

    post.comments.forEach(function (c) {
      var item = document.createElement('div');
      item.className = 'comment-item';
      item.innerHTML =
        '<div class="comment-avatar">' + initial(c.author) + '</div>' +
        '<div class="comment-body">' +
          '<div class="comment-name">' + c.author + '</div>' +
          '<div class="comment-text">' + escHtml(c.text) + '</div>' +
        '</div>';
      pmComments.appendChild(item);
    });

    // scroll to bottom to show latest
    pmComments.scrollTop = pmComments.scrollHeight;
  }

  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // Like button
  pmLikeBtn.addEventListener('click', function () {
    if (!currentPost) return;
    currentPost.liked = !currentPost.liked;
    currentPost.likes += currentPost.liked ? 1 : -1;
    if (currentPost.likes < 0) currentPost.likes = 0;
    updateLikeUI(currentPost);
  });

  // Submit comment
  pmCommentForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!currentPost) return;
    var text = pmCommentInput.value.trim();
    if (!text) return;

    var userName = 'You';
    try {
      var u = JSON.parse(localStorage.getItem('catface_user') || '{}');
      if (u.display_name) userName = u.display_name;
    } catch (_) {}

    currentPost.comments.push({ author: userName, text: text });
    pmCommentInput.value = '';
    renderComments(currentPost);
  });

  // Close button
  pmClose.addEventListener('click', closeDetail);

  // Click backdrop to close
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeDetail();
  });

  // ESC key to close
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeDetail();
  });

})();
