/**
 * 首页 Recommended 推荐流：从社区 API 拉取帖子并渲染，点击卡片打开详情弹窗
 * 依赖：config.js（API_BASE_URL, getAuthHeaders）
 */
(function () {
  var API_BASE = typeof API_BASE_URL !== "undefined" ? API_BASE_URL : "";
  var getAuth = typeof getAuthHeaders === "function" ? getAuthHeaders : function () { return { "Content-Type": "application/json" }; };

  var feedEl = document.querySelector(".feed");
  var overlay = document.getElementById("postDetailOverlay");
  var detailImage = document.getElementById("detailImage");
  var detailTitle = document.getElementById("detailTitle");
  var detailAuthorAvatar = document.getElementById("detailAuthorAvatar");
  var detailAuthorName = document.getElementById("detailAuthorName");
  var detailLikeBtn = document.getElementById("detailLikeBtn");
  var detailLikeIcon = document.getElementById("detailLikeIcon");
  var detailLikeLabel = document.getElementById("detailLikeLabel");
  var detailLikesText = document.getElementById("detailLikesText");
  var detailComments = document.getElementById("detailComments");
  var commentForm = document.getElementById("commentForm");
  var commentInput = document.getElementById("commentInput");
  var closePostDetail = document.getElementById("closePostDetail");

  if (!feedEl || !overlay) return;

  var posts = [];
  var currentIndex = null;

  function formatLikes(num) {
    if (num >= 1000) return (num / 1000).toFixed(0) + "k";
    return String(num);
  }

  function renderFeed(list) {
    feedEl.innerHTML = "";
    list.forEach(function (post, index) {
      var card = document.createElement("article");
      card.className = "post-card";
      card.dataset.postIndex = String(index);
      card.style.cursor = "pointer";
      var imgSrc = post.image || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=533&fit=crop";
      var title = (post.text || "").replace(/</g, "&lt;");
      var author = post.author || "User";
      var likesStr = formatLikes(typeof post.likes === "number" ? post.likes : (post.likes && post.likes.length) || 0);
      card.innerHTML =
        '<img class="cover" src="' + imgSrc + '" alt="Post image">' +
        '<div class="body">' +
        '<h3 class="title">' + title + '</h3>' +
        '<div class="meta">' +
        '<span class="user"><span class="avatar"></span> ' + author + '</span>' +
        '<span class="likes">❤️ ' + likesStr + '</span>' +
        '</div></div>';
      card.addEventListener("click", function () { openDetail(index); });
      feedEl.appendChild(card);
    });
  }

  function updateLikeUI(post) {
    if (!detailLikeIcon) return;
    detailLikeIcon.textContent = post.liked ? "❤" : "♡";
    if (detailLikeLabel) detailLikeLabel.textContent = post.liked ? "Liked" : "Like";
    if (detailLikeBtn) detailLikeBtn.classList.toggle("is-liked", post.liked);
    if (detailLikesText) detailLikesText.textContent = formatLikes(post.likes) + " likes";
    var card = feedEl.querySelector('[data-post-index="' + post.index + '"]');
    var likesEl = card && card.querySelector(".likes");
    if (likesEl) likesEl.textContent = "❤️ " + formatLikes(post.likes);
  }

  function renderComments(post) {
    if (!detailComments) return;
    detailComments.innerHTML = "";
    if (!post.comments || !post.comments.length) {
      var empty = document.createElement("div");
      empty.style.color = "#aaa";
      empty.style.fontSize = "12px";
      empty.textContent = "No comments yet. Be the first one!";
      detailComments.appendChild(empty);
      return;
    }
    post.comments.forEach(function (c) {
      var item = document.createElement("div");
      item.className = "post-comment-item";
      item.innerHTML = '<span class="post-comment-author">' + (c.author || "User") + ":</span><span>" + String(c.text || "").replace(/</g, "&lt;") + "</span>";
      detailComments.appendChild(item);
    });
  }

  function openDetail(index) {
    var post = posts[index];
    if (!post) return;
    currentIndex = index;
    if (detailImage) detailImage.src = post.image || "";
    if (detailTitle) detailTitle.textContent = post.text || "";
    if (detailAuthorName) detailAuthorName.textContent = post.author || "User";
    if (detailAuthorAvatar) detailAuthorAvatar.style.background = "#ddd";
    updateLikeUI(post);
    renderComments(post);
    overlay.classList.add("is-open");
  }

  function closeDetail() {
    overlay.classList.remove("is-open");
    currentIndex = null;
  }

  if (closePostDetail) closePostDetail.addEventListener("click", closeDetail);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeDetail();
  });

  if (detailLikeBtn) {
    detailLikeBtn.addEventListener("click", function () {
      if (currentIndex == null) return;
      var post = posts[currentIndex];
      if (!post) return;
      post.liked = !post.liked;
      post.likes += post.liked ? 1 : -1;
      if (post.likes < 0) post.likes = 0;
      updateLikeUI(post);
    });
  }

  if (commentForm && commentInput) {
    commentForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (currentIndex == null) return;
      var post = posts[currentIndex];
      if (!post) return;
      var text = commentInput.value.trim();
      if (!text) return;
      if (!post.comments) post.comments = [];
      post.comments.push({ author: "You", text: text });
      commentInput.value = "";
      renderComments(post);
    });
  }

  function loadRecommendFeed() {
    if (!API_BASE) {
      feedEl.innerHTML = "<p style='padding:24px;color:#666;'>暂无推荐数据，请确保后端已启动。</p>";
      return;
    }
    feedEl.innerHTML = "<p style='padding:24px;color:#999;'>加载中…</p>";
    fetch(API_BASE + "/community/posts", { headers: getAuth() })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (result.success && Array.isArray(result.data)) {
          posts = result.data.map(function (p, i) {
            return {
              index: i,
              id: p.id,
              image: p.image || "",
              text: p.text || "",
              author: p.author || "User",
              likes: typeof p.likes === "number" ? p.likes : (p.likes ? p.likes.length : 0),
              liked: p.liked || false,
              comments: Array.isArray(p.comments) ? p.comments.slice() : []
            };
          });
          renderFeed(posts);
        } else {
          feedEl.innerHTML = "<p style='padding:24px;color:#666;'>暂无推荐帖子。</p>";
        }
      })
      .catch(function () {
        feedEl.innerHTML = "<p style='padding:24px;color:#999;'>加载失败，请检查后端是否运行在 port 3000。</p>";
      });
  }

  loadRecommendFeed();
})();
