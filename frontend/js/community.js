(function () {
  const API_BASE = typeof API_BASE_URL !== "undefined" ? API_BASE_URL : "";
  const getAuth = typeof getAuthHeaders === "function" ? getAuthHeaders : function () { return { "Content-Type": "application/json" }; };

  const initialPosts = [
    {
      id: 1,
      author: "Luna",
      authorInitial: "L",
      followed: false,
      image:
        "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&h=800&q=80",
      text:
        "Hi! I'm Luna 🐱 My human took me out today and I got to sunbathe! So warm and cozy!",
      likes: 23000,
      liked: false,
      comments: [
        { author: "Max", text: "Luna is so cute!" },
        { author: "Ginger", text: "Sunbathing queen ☀️" }
      ],
      time: "2h ago"
    },
    {
      id: 2,
      author: "Max",
      authorInitial: "M",
      followed: true,
      image:
        "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=600&h=800&q=80",
      text:
        "Meow! I'm Max the British Shorthair 🐾 Premium kibble only, please!",
      likes: 67000,
      liked: true,
      comments: [{ author: "Luna", text: "Share your diet plan, please!" }],
      time: "5h ago"
    },
    {
      id: 3,
      author: "Ginger",
      authorInitial: "G",
      followed: false,
      image:
        "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=600&h=800&q=80",
      text:
        "Hi humans! I'm Ginger 🧡 I'm 1 year old and super friendly! Looking for my forever home.",
      likes: 11000,
      liked: false,
      comments: [],
      time: "1d ago"
    },
    {
      id: 4,
      author: "Whiskers",
      authorInitial: "W",
      followed: false,
      image:
        "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&h=800&q=80",
      text: "Just got my checkup! 🏥 My human says I'm super healthy!",
      likes: 82000,
      liked: false,
      comments: [{ author: "Charlie", text: "Health is the best gift!" }],
      time: "3d ago"
    }
  ];

  let posts = [];
  let currentPostId = null;

  function loadPostsFromApi() {
    if (!API_BASE) {
      posts = initialPosts.slice();
      renderFeed();
      return;
    }
    fetch(API_BASE + "/community/posts", { headers: getAuth() })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (result.success && Array.isArray(result.data)) {
          posts = result.data.map(function (p) {
            return {
              id: p.id,
              author: p.author || "User",
              authorInitial: p.authorInitial || (p.author ? p.author[0] : "U"),
              followed: p.followed || false,
              image: p.image || "",
              text: p.text || "",
              likes: typeof p.likes === "number" ? p.likes : (p.likes ? p.likes.length : 0),
              liked: p.liked || false,
              comments: Array.isArray(p.comments) ? p.comments : [],
              time: p.time || ""
            };
          });
        } else {
          posts = initialPosts.slice();
        }
        renderFeed();
      })
      .catch(function () {
        posts = initialPosts.slice();
        renderFeed();
      });
  }

  const feedEl = document.getElementById("feed");
  const createOverlay = document.getElementById("createOverlay");
  const createPreview = document.getElementById("createPreview");
  const createImageInput = document.getElementById("createImage");
  const createTextInput = document.getElementById("createText");
  const createSubmit = document.getElementById("createSubmit");
  const createForm = document.getElementById("createForm");
  const postOverlay = document.getElementById("postOverlay");
  const postDetailImage = document.getElementById("postDetailImage");
  const detailAuthorAvatar = document.getElementById("detailAuthorAvatar");
  const detailAuthorName = document.getElementById("detailAuthorName");
  const detailTime = document.getElementById("detailTime");
  const detailText = document.getElementById("detailText");
  const detailFollowBtn = document.getElementById("detailFollowBtn");
  const detailLikeBtn = document.getElementById("detailLikeBtn");
  const detailLikeIcon = document.getElementById("detailLikeIcon");
  const detailLikeText = document.getElementById("detailLikeText");
  const detailLikesCount = document.getElementById("detailLikesCount");
  const detailCommentsCount = document.getElementById("detailCommentsCount");
  const commentsList = document.getElementById("commentsList");
  const commentInput = document.getElementById("commentInput");
  const commentSubmit = document.getElementById("commentSubmit");

  function formatLikes(num) {
    if (num >= 10000) {
      return (num / 1000).toFixed(0) + "k";
    }
    return String(num);
  }

  function renderFeed() {
    if (!feedEl) return;
    feedEl.innerHTML = "";
    posts.forEach(function (post) {
      const card = document.createElement("article");
      card.className = "post-card";
      card.dataset.id = post.id;
      card.innerHTML =
        '<div class="post-image-wrap">' +
        '<img class="post-image" src="' +
        post.image +
        '" alt="Post image of cat">' +
        "</div>" +
        '<div class="post-body">' +
        '<h3 class="post-title">' +
        post.text.replace(/</g, "&lt;") +
        "</h3>" +
        '<div class="post-footer">' +
        '<div class="post-author">' +
        '<div class="post-author-avatar">' +
        (post.authorInitial || post.author[0] || "C") +
        "</div>" +
        "<span>" +
        post.author +
        "</span>" +
        "</div>" +
        '<div class="post-stats">' +
        '<div class="post-stat"><span>♡</span><span>' +
        formatLikes(post.likes) +
        "</span></div>" +
        '<div class="post-stat"><span>💬</span><span>' +
        post.comments.length +
        "</span></div>" +
        "</div>" +
        "</div>" +
        "</div>";
      card.addEventListener("click", function () {
        openPostDetail(post.id);
      });
      feedEl.appendChild(card);
    });
  }

  function openCreate() {
    createOverlay.classList.add("is-open");
  }
  function closeCreate() {
    createOverlay.classList.remove("is-open");
  }

  document
    .getElementById("openCreateFromTop")
    .addEventListener("click", openCreate);
  document
    .getElementById("openCreateFromQuick")
    .addEventListener("click", openCreate);
  Array.prototype.forEach.call(
    document.querySelectorAll("[data-close-create]"),
    function (btn) {
      btn.addEventListener("click", closeCreate);
    }
  );
  createOverlay.addEventListener("click", function (e) {
    if (e.target === createOverlay) closeCreate();
  });

  createImageInput.addEventListener("change", function () {
    const file = createImageInput.files[0];
    const text = createTextInput.value.trim();
    if (file) {
      const reader = new FileReader();
      reader.onload = function (ev) {
        createPreview.innerHTML =
          '<img src="' + ev.target.result + '" alt="Preview">';
      };
      reader.readAsDataURL(file);
    } else {
      createPreview.innerHTML =
        "<span>Upload a cat photo to preview here</span>";
    }
    createSubmit.disabled = !file || !text;
  });

  createTextInput.addEventListener("input", function () {
    const file = createImageInput.files[0];
    const text = createTextInput.value.trim();
    createSubmit.disabled = !file || !text;
  });

  createForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const file = createImageInput.files[0];
    const text = createTextInput.value.trim();
    if (!file || !text) return;
    if (API_BASE && typeof getToken === "function" && getToken()) {
      fetch(API_BASE + "/community/posts", {
        method: "POST",
        headers: getAuth(),
        body: JSON.stringify({ content: text, imageUrl: null })
      })
        .then(function (res) { return res.json(); })
        .then(function (result) {
          createImageInput.value = "";
          createTextInput.value = "";
          createSubmit.disabled = true;
          createPreview.innerHTML =
            "<span>Upload a cat photo to preview here</span>";
          closeCreate();
          if (result.success && result.data) {
            posts.unshift({
              id: result.data.id,
              author: result.data.author || "You",
              authorInitial: result.data.authorInitial || "U",
              followed: true,
              image: result.data.image || "",
              text: result.data.text || text,
              likes: 0,
              liked: false,
              comments: [],
              time: result.data.time || "Just now"
            });
            renderFeed();
            openPostDetail(result.data.id);
          } else {
            alert(result.message || "发布失败");
          }
        })
        .catch(function () {
          alert("网络错误，请稍后重试");
        });
      return;
    }
    const reader = new FileReader();
    reader.onload = function (ev) {
      const newPost = {
        id: Date.now(),
        author: "You",
        authorInitial: "U",
        followed: true,
        image: ev.target.result,
        text: text,
        likes: 0,
        liked: false,
        comments: [],
        time: "Just now"
      };
      posts.unshift(newPost);
      renderFeed();
      createImageInput.value = "";
      createTextInput.value = "";
      createSubmit.disabled = true;
      createPreview.innerHTML =
        "<span>Upload a cat photo to preview here</span>";
      closeCreate();
      openPostDetail(newPost.id);
    };
    reader.readAsDataURL(file);
  });

  function openPostDetail(id) {
    const post = posts.find(function (p) {
      return p.id === id;
    });
    if (!post) return;
    currentPostId = id;
    postDetailImage.src = post.image;
    detailAuthorAvatar.textContent =
      post.authorInitial || post.author[0] || "C";
    detailAuthorName.textContent = post.author;
    detailTime.textContent = post.time;
    detailText.textContent = post.text;
    updateFollowButton(post);
    updateLikeButton(post);
    renderComments(post);
    postOverlay.classList.add("is-open");
  }

  function closePostDetail() {
    postOverlay.classList.remove("is-open");
    currentPostId = null;
  }

  document
    .getElementById("closePostOverlay")
    .addEventListener("click", closePostDetail);
  postOverlay.addEventListener("click", function (e) {
    if (e.target === postOverlay) closePostDetail();
  });

  function updateFollowButton(post) {
    if (post.followed) {
      detailFollowBtn.textContent = "Following";
      detailFollowBtn.classList.add("is-following");
    } else {
      detailFollowBtn.textContent = "Follow";
      detailFollowBtn.classList.remove("is-following");
    }
  }

  detailFollowBtn.addEventListener("click", function () {
    if (currentPostId == null) return;
    const post = posts.find(function (p) {
      return p.id === currentPostId;
    });
    if (!post) return;
    post.followed = !post.followed;
    updateFollowButton(post);
  });

  function updateLikeButton(post) {
    detailLikeIcon.textContent = post.liked ? "❤" : "♡";
    detailLikeText.textContent = post.liked ? "Liked" : "Like";
    detailLikeBtn.classList.toggle("is-liked", post.liked);
    detailLikesCount.textContent = post.likes + " likes";
    detailCommentsCount.textContent =
      post.comments.length + " comments";
  }

  detailLikeBtn.addEventListener("click", function () {
    if (currentPostId == null) return;
    const post = posts.find(function (p) {
      return p.id === currentPostId;
    });
    if (!post) return;
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    if (post.likes < 0) post.likes = 0;
    updateLikeButton(post);
    renderFeed();
  });

  function renderComments(post) {
    commentsList.innerHTML = "";
    if (!post.comments.length) {
      const empty = document.createElement("div");
      empty.style.color = "#aaa";
      empty.style.fontSize = "12px";
      empty.textContent = "No comments yet. Be the first one!";
      commentsList.appendChild(empty);
      detailCommentsCount.textContent = "0 comments";
      return;
    }
    post.comments.forEach(function (c) {
      const item = document.createElement("div");
      item.className = "comment-item";
      item.innerHTML =
        '<span class="comment-author">' +
        (c.author || "User") +
        ":</span>" +
        "<span>" +
        String(c.text || "").replace(/</g, "&lt;") +
        "</span>";
      commentsList.appendChild(item);
    });
    detailCommentsCount.textContent =
      post.comments.length + " comments";
  }

  function addComment() {
    const text = commentInput.value.trim();
    if (!text || currentPostId == null) return;
    const post = posts.find(function (p) {
      return p.id === currentPostId;
    });
    if (!post) return;
    post.comments.push({ author: "You", text: text });
    commentInput.value = "";
    renderComments(post);
    updateLikeButton(post);
    renderFeed();
  }

  commentSubmit.addEventListener("click", addComment);
  commentInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addComment();
    }
  });

  renderFeed();

  function openProfile(author) {
    if (!author) author = "Cat Lover";
    window.location.href =
      "cat-profile.html?author=" + encodeURIComponent(author);
  }

  function attachAuthorClick(card, post) {
    const authorEl = card.querySelector(".post-author");
    if (!authorEl) return;
    authorEl.style.cursor = "pointer";
    authorEl.addEventListener("click", function (e) {
      e.stopPropagation();
      openProfile(post.author);
    });
  }

  function enhancedRenderFeed() {
    if (!feedEl) return;
    feedEl.innerHTML = "";
    posts.forEach(function (post) {
      const card = document.createElement("article");
      card.className = "post-card";
      card.dataset.id = post.id;
      card.innerHTML =
        '<div class="post-image-wrap">' +
        '<img class="post-image" src="' +
        post.image +
        '" alt="Post image of cat">' +
        "</div>" +
        '<div class="post-body">' +
        '<h3 class="post-title">' +
        post.text.replace(/</g, "&lt;") +
        "</h3>" +
        '<div class="post-footer">' +
        '<div class="post-author">' +
        '<div class="post-author-avatar">' +
        (post.authorInitial || post.author[0] || "C") +
        "</div>" +
        "<span>" +
        post.author +
        "</span>" +
        "</div>" +
        '<div class="post-stats">' +
        '<div class="post-stat"><span>♡</span><span>' +
        formatLikes(post.likes) +
        "</span></div>" +
        '<div class="post-stat"><span>💬</span><span>' +
        post.comments.length +
        "</span></div>" +
        "</div>" +
        "</div>" +
        "</div>";
      card.addEventListener("click", function () {
        openPostDetail(post.id);
      });
      attachAuthorClick(card, post);
      feedEl.appendChild(card);
    });
  }

  renderFeed = enhancedRenderFeed;
  if (feedEl) loadPostsFromApi();
})();

