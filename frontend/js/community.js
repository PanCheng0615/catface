(function () {
  let posts = [];
  let currentPostId = null;
  let currentFeed = "recommended";
  let feedLoadState = "loading";
  let latestFeedRequestId = 0;

  function getCurrentUserId() {
    try {
      const raw = localStorage.getItem("catface_user");
      if (!raw) return null;
      const u = JSON.parse(raw);
      return u.id || null;
    } catch (e) {
      return null;
    }
  }

  function requireLogin() {
    if (getToken()) return true;
    alert("Please log in first.");
    window.location.href = "/pages/log-in.html";
    return false;
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setComposeInUrl(isOpen) {
    const params = new URLSearchParams(window.location.search);
    if (isOpen) params.set("compose", "1");
    else params.delete("compose");
    const next = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
    window.history.replaceState(null, "", next);
  }

  function syncUrlForMode(mode) {
    const params = new URLSearchParams(window.location.search);
    if (mode === "followed") params.set("feed", "followed");
    else params.delete("feed");
    const next = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
    window.history.replaceState(null, "", next);
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
  const detailAuthorRow = document.getElementById("detailAuthorRow") || document.querySelector(".post-modal-author");
  const closePostOverlayBtn = document.getElementById("closePostOverlay");
  const quickComposer = document.querySelector(".composer-input");
  const quickComposerSubmit = document.querySelector(".composer-submit");

  function formatLikes(num) {
    if (num >= 10000) return (num / 1000).toFixed(0) + "k";
    return String(num);
  }

  function formatPostTime(createdAtIso, fallbackText) {
    if (!createdAtIso) return fallbackText || "Just now";
    const d = new Date(createdAtIso);
    if (Number.isNaN(d.getTime())) return fallbackText || "Just now";
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return Math.floor(diffSec / 60) + "m ago";
    if (diffSec < 86400) return Math.floor(diffSec / 3600) + "h ago";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return y + "-" + m + "-" + day + " " + hh + ":" + mm;
  }

  function openCreate() {
    if (!createOverlay) return;
    if (createImageInput) createImageInput.value = "";
    if (createPreview) createPreview.innerHTML = "<span>Upload a cat photo to preview here</span>";
    if (createTextInput) {
      const quickText = quickComposer ? quickComposer.value.trim() : "";
      createTextInput.value = quickText;
    }
    createOverlay.classList.add("is-open");
    setComposeInUrl(true);
    updateCreateSubmitState();
  }

  function closeCreate() {
    if (!createOverlay) return;
    createOverlay.classList.remove("is-open");
    setComposeInUrl(false);
  }

  function updateCreateSubmitState() {
    if (!createTextInput || !createSubmit) return;
    createSubmit.disabled = !createTextInput.value.trim();
  }

  const openCreateTop = document.getElementById("btnCreatePost") || document.getElementById("openCreateFromTop");
  if (openCreateTop) openCreateTop.addEventListener("click", openCreate);
  const openCreateQuick = document.getElementById("openCreateFromQuick");
  if (openCreateQuick) openCreateQuick.addEventListener("click", openCreate);
  if (quickComposerSubmit) {
    quickComposerSubmit.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openCreate();
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-close-create]"), function (btn) {
    btn.addEventListener("click", closeCreate);
  });
  if (createOverlay) {
    createOverlay.addEventListener("click", function (e) {
      if (e.target === createOverlay) closeCreate();
    });
  }

  if (createImageInput && createTextInput && createPreview && createSubmit) {
    createImageInput.addEventListener("change", function () {
      const file = createImageInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (ev) {
          createPreview.innerHTML = '<img src="' + ev.target.result + '" alt="Preview">';
        };
        reader.readAsDataURL(file);
      } else {
        createPreview.innerHTML = "<span>Upload a cat photo to preview here</span>";
      }
      updateCreateSubmitState();
    });

    createTextInput.addEventListener("input", function () {
      updateCreateSubmitState();
    });
  }

  if (createForm && createImageInput && createTextInput && createSubmit && createPreview) {
    createForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const file = createImageInput.files[0];
      const text = createTextInput.value.trim();
      if (!text) return;
      if (!requireLogin()) return;
      createSubmit.disabled = true;

      function submitPost(imageUrl) {
        return fetch(API_BASE_URL + "/community/posts", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            content: text,
            image_url: imageUrl || null
          })
        });
      }

      function handlePostResult(result) {
        if (!result.success || !result.data) {
          alert(result.message || "Post failed");
          updateCreateSubmitState();
          return;
        }
        createImageInput.value = "";
        createTextInput.value = "";
        if (quickComposer) quickComposer.value = "";
        createPreview.innerHTML = "<span>Upload a cat photo to preview here</span>";
        updateCreateSubmitState();
        closeCreate();
        switchCommunityView("recommended");
      }

      if (!file) {
        submitPost(null)
          .then(function (res) { return res.json(); })
          .then(handlePostResult)
          .catch(function () {
            alert("Network error, please try again.");
            updateCreateSubmitState();
          });
        return;
      }

      const reader = new FileReader();
      reader.onload = function (ev) {
        const dataUrl = ev.target.result;
        fetch(API_BASE_URL + "/community/upload", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ imageDataUrl: dataUrl })
        })
          .then(function (res) { return res.json(); })
          .then(function (uploadResult) {
            const imageUrl = uploadResult.success && uploadResult.data && uploadResult.data.url
              ? uploadResult.data.url
              : dataUrl;
            return submitPost(imageUrl);
          })
          .then(function (res) { return res.json(); })
          .then(handlePostResult)
          .catch(function () {
            alert("Network error, please try again.");
            updateCreateSubmitState();
          });
      };
      reader.readAsDataURL(file);
    });
  }

  function openPostDetail(id) {
    const post = posts.find(function (p) { return p.id === id; });
    if (!post) return;
    currentPostId = id;
    if (!postOverlay || !postDetailImage || !detailAuthorAvatar || !detailAuthorName || !detailTime || !detailText) return;
    postDetailImage.src = post.image || "";
    postDetailImage.style.display = post.image ? "" : "none";
    if (post.authorAvatar) {
      detailAuthorAvatar.innerHTML = '<img src="' + escapeHtml(post.authorAvatar) + '" alt="">';
    } else {
      detailAuthorAvatar.textContent = post.authorInitial || post.author[0] || "C";
    }
    detailAuthorName.textContent = post.author;
    detailTime.textContent = post.time;
    detailText.textContent = post.text;
    updateFollowButton(post);
    updateLikeButton(post);
    renderComments(post);
    postOverlay.classList.add("is-open");
    refreshCommentsFromApi(post);
  }

  function refreshCommentsFromApi(post) {
    if (!post || !post.fromApi || !post.id) return;
    fetch(API_BASE_URL + "/community/posts/" + encodeURIComponent(post.id) + "/comments", {
      method: "GET",
      headers: getAuthHeaders()
    })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (!result.success || !Array.isArray(result.data)) return;
        post.comments = result.data;
        if (currentPostId === post.id) {
          renderComments(post);
          updateLikeButton(post);
          renderFeed();
        }
      })
      .catch(function () {});
  }

  function closePostDetail() {
    if (!postOverlay) return;
    postOverlay.classList.remove("is-open");
    currentPostId = null;
  }

  if (closePostOverlayBtn) closePostOverlayBtn.addEventListener("click", closePostDetail);
  if (postOverlay) {
    postOverlay.addEventListener("click", function (e) {
      if (e.target === postOverlay) closePostDetail();
    });
  }

  if (detailAuthorRow) {
    detailAuthorRow.addEventListener("click", function (e) {
      e.stopPropagation();
      openProfile();
    });
    detailAuthorRow.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        openProfile();
      }
    });
  }

  function updateFollowButton(post) {
    if (!detailFollowBtn) return;
    const selfId = getCurrentUserId();
    if (post.authorId && selfId && post.authorId === selfId) {
      detailFollowBtn.style.display = "none";
      return;
    }
    detailFollowBtn.style.display = "";
    if (post.followed) {
      detailFollowBtn.textContent = "Following";
      detailFollowBtn.classList.add("is-following");
    } else {
      detailFollowBtn.textContent = "Follow";
      detailFollowBtn.classList.remove("is-following");
    }
  }

  if (detailFollowBtn) {
    detailFollowBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (currentPostId == null) return;
      const post = posts.find(function (p) { return p.id === currentPostId; });
      if (!post) return;
      if (!post.authorId) {
        alert("This author cannot be followed yet.");
        return;
      }
      if (!requireLogin()) return;
      detailFollowBtn.disabled = true;
      fetch(API_BASE_URL + "/users/" + encodeURIComponent(post.authorId) + "/follow", {
        method: "POST",
        headers: getAuthHeaders()
      })
        .then(function (res) {
          if (res.status === 401) {
            window.location.href = "/pages/log-in.html";
            return null;
          }
          return res.json();
        })
        .then(function (result) {
          if (!result || !result.success || !result.data) {
            alert((result && result.message) || "Follow failed");
            return;
          }
          const on = !!result.data.following;
          posts.forEach(function (p) {
            if (p.authorId === post.authorId) p.followed = on;
          });
          updateFollowButton(post);
          renderFeed();
        })
        .catch(function () {
          alert("Network error, please try again.");
        })
        .finally(function () {
          detailFollowBtn.disabled = false;
        });
    });
  }

  function updateLikeButton(post) {
    if (!detailLikeIcon || !detailLikeText || !detailLikeBtn || !detailLikesCount || !detailCommentsCount) return;
    detailLikeIcon.textContent = post.liked ? "❤" : "♡";
    detailLikeText.textContent = post.liked ? "Liked" : "Like";
    detailLikeBtn.classList.toggle("is-liked", post.liked);
    detailLikesCount.textContent = post.likes + " likes";
    detailCommentsCount.textContent = post.comments.length + " comments";
  }

  if (detailLikeBtn) {
    detailLikeBtn.addEventListener("click", function () {
      if (currentPostId == null) return;
      const post = posts.find(function (p) { return p.id === currentPostId; });
      if (!post) return;
      if (!requireLogin()) return;
      fetch(API_BASE_URL + "/community/posts/" + encodeURIComponent(post.id) + "/like", {
        method: "POST",
        headers: getAuthHeaders()
      })
        .then(function (res) { return res.json(); })
        .then(function (result) {
          if (!result.success || !result.data) {
            alert(result.message || "Like failed");
            return;
          }
          post.liked = !!result.data.liked;
          post.likes = typeof result.data.likes === "number"
            ? result.data.likes
            : Math.max(0, post.likes + (post.liked ? 1 : -1));
          updateLikeButton(post);
          renderFeed();
        })
        .catch(function () {
          alert("Network error, please try again.");
        });
    });
  }

  function renderComments(post) {
    if (!commentsList || !detailCommentsCount) return;
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
      const authorSpan = document.createElement("span");
      authorSpan.className = "comment-author";
      authorSpan.textContent = (c.author || "User") + ":";
      const textSpan = document.createElement("span");
      textSpan.textContent = String(c.text || "");
      item.appendChild(authorSpan);
      item.appendChild(textSpan);
      commentsList.appendChild(item);
    });
    detailCommentsCount.textContent = post.comments.length + " comments";
  }

  function addComment() {
    const text = commentInput.value.trim();
    if (!text || currentPostId == null) return;
    const post = posts.find(function (p) { return p.id === currentPostId; });
    if (!post) return;
    if (!requireLogin()) return;
    fetch(API_BASE_URL + "/community/posts/" + encodeURIComponent(post.id) + "/comments", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ content: text })
    })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (!result.success || !result.data) {
          alert(result.message || "Comment failed");
          return;
        }
        post.comments.push({
          author: result.data.author || "You",
          text: result.data.text || text
        });
        commentInput.value = "";
        renderComments(post);
        updateLikeButton(post);
        renderFeed();
      })
      .catch(function () {
        alert("Network error, please try again.");
      });
  }

  if (commentSubmit) commentSubmit.addEventListener("click", addComment);
  if (commentInput) {
    commentInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        addComment();
      }
    });
  }

  function navigateToAuthor(post, fallbackAuthor) {
    let author = fallbackAuthor || (post && post.author) || "Cat Lover";
    let query = "author=" + encodeURIComponent(author);
    if (post && post.authorId) query += "&authorId=" + encodeURIComponent(post.authorId);
    try {
      window.localStorage.removeItem("catface_last_story_profile");
      if (post && post.authorId) window.localStorage.setItem("catface_last_author_id", String(post.authorId));
      if (author) window.localStorage.setItem("catface_last_author_name", String(author));
    } catch (e) {}
    window.location.href = "/pages/cat-profile.html?" + query;
  }

  function getAuthorProfileHref(post) {
    let author = (post && post.author) || "Cat Lover";
    let query = "author=" + encodeURIComponent(author);
    if (post && post.authorId) query += "&authorId=" + encodeURIComponent(post.authorId);
    return "/pages/cat-profile.html?" + query;
  }

  function openStoryProfile(storyKey, storyName) {
    const key = String(storyKey || "").trim();
    if (!key) return;
    const author = String(storyName || key);
    try {
      window.localStorage.setItem("catface_last_story_profile", key);
      window.localStorage.removeItem("catface_last_author_id");
      window.localStorage.setItem("catface_last_author_name", author);
    } catch (e) {}
    window.location.href =
      "/pages/cat-profile.html?story=" + encodeURIComponent(key) +
      "&author=" + encodeURIComponent(author);
  }

  function openProfile(author) {
    const post = posts.find(function (p) { return p.id === currentPostId; });
    navigateToAuthor(post, author);
  }

  document.querySelectorAll(".story[data-user]").forEach(function (storyEl) {
    storyEl.addEventListener("click", function () {
      const key = storyEl.getAttribute("data-user") || "";
      const nameEl = storyEl.querySelector(".story-name");
      const name = nameEl ? nameEl.textContent.trim() : key;
      const href = storyEl.getAttribute("data-story-href");
      if (href) {
        try {
          window.localStorage.setItem("catface_last_story_profile", key);
          window.localStorage.removeItem("catface_last_author_id");
          window.localStorage.setItem("catface_last_author_name", name);
        } catch (e) {}
        window.location.href = href;
        return;
      }
      openStoryProfile(key, name);
    });
    storyEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const key = storyEl.getAttribute("data-user") || "";
        const nameEl = storyEl.querySelector(".story-name");
        const name = nameEl ? nameEl.textContent.trim() : key;
        const href = storyEl.getAttribute("data-story-href");
        if (href) {
          try {
            window.localStorage.setItem("catface_last_story_profile", key);
            window.localStorage.removeItem("catface_last_author_id");
            window.localStorage.setItem("catface_last_author_name", name);
          } catch (e) {}
          window.location.href = href;
          return;
        }
        openStoryProfile(key, name);
      }
    });
    if (!storyEl.hasAttribute("tabindex")) storyEl.setAttribute("tabindex", "0");
    storyEl.setAttribute("role", "button");
  });

  function renderFeed() {
    feedEl.innerHTML = "";
    if (feedLoadState === "loading") {
      feedEl.innerHTML = '<div class="feed-status">Loading posts...</div>';
      return;
    }
    if (feedLoadState === "error") {
      feedEl.innerHTML = '<div class="feed-empty">Could not load posts. Check backend service.</div>';
      return;
    }
    if (!posts.length) {
      const emptyMsg = currentFeed === "followed"
        ? (!getToken()
            ? "Log in to see posts from creators you follow."
            : "No posts here yet. Follow someone from Recommended, then check back.")
        : "No community posts yet.";
      feedEl.innerHTML = '<div class="feed-empty">' + emptyMsg + "</div>";
      return;
    }
    posts.forEach(function (post) {
      const card = document.createElement("article");
      card.className = "post-card";
      card.dataset.id = post.id;
      const postImage = post.image || "";
      const imgHtml = postImage
        ? '<img class="post-img" src="' + escapeHtml(post.image) + '" alt="" data-open-detail="1">'
        : "";
      const safeAuthor = post.author || "User";
      const safeAuthorInitial = post.authorInitial || safeAuthor[0] || "U";
      const avatarInner = post.authorAvatar
        ? '<img src="' + escapeHtml(post.authorAvatar) + '" alt="">'
        : "<span>" + escapeHtml(safeAuthorInitial) + "</span>";
      const likeIcon = post.liked ? "&#x2665;" : "&#x2661;";
      card.innerHTML =
        '<div class="post-avatar" data-author-click="1">' + avatarInner + "</div>" +
        '<div class="post-body">' +
        '<div class="post-meta">' +
        '<span class="post-name" data-author-click="1">' + escapeHtml(safeAuthor) + "</span>" +
        '<span class="post-dot">&#x2022;</span>' +
        '<span class="post-time" data-open-detail="1">' + escapeHtml(post.time || "") + "</span>" +
        "</div>" +
        '<p class="post-text" data-open-detail="1">' + escapeHtml(post.text || "") + "</p>" +
        imgHtml +
        '<div class="post-actions">' +
        '<button type="button" class="act' + (post.liked ? " liked" : "") + '" data-open-detail="1">' +
        '<span class="ai">' + likeIcon + "</span> " + formatLikes(post.likes) +
        "</button>" +
        '<button type="button" class="act" data-open-detail="1">' +
        '<span class="ai">&#x1F4AC;</span> ' + post.comments.length +
        "</button>" +
        "</div></div>";
      card.addEventListener("click", function (e) {
        const targetNode = e.target && e.target.nodeType === 3 ? e.target.parentElement : e.target;
        const fromAuthor = targetNode && targetNode.closest
          ? targetNode.closest("[data-author-click='1']")
          : null;
        if (fromAuthor) {
          e.preventDefault();
          e.stopPropagation();
          if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
          navigateToAuthor(post);
          return;
        }
        const fromDetailTarget = targetNode && targetNode.closest
          ? targetNode.closest("[data-open-detail='1']")
          : null;
        if (!fromDetailTarget) return;
        openPostDetail(post.id);
      }, true);
      feedEl.appendChild(card);
    });
  }

  function updateTabStyles(mode) {
    document.querySelectorAll(".feed-nav [data-feed]").forEach(function (b) {
      var on = b.getAttribute("data-feed") === mode;
      b.classList.toggle("is-active", on);
      b.classList.toggle("active", on);
    });
  }

  function fetchBrowseFeed(feed) {
    closeCreate();
    currentFeed = feed;
    feedLoadState = "loading";
    renderFeed();
    latestFeedRequestId += 1;
    const requestId = latestFeedRequestId;
    const q = feed === "followed" ? "followed" : "recommended";

    if (feed === "followed" && !getToken()) {
      feedLoadState = "ok";
      posts = [];
      renderFeed();
      return;
    }

    fetch(API_BASE_URL + "/community/posts?feed=" + encodeURIComponent(q), {
      method: "GET",
      headers: getAuthHeaders()
    })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (requestId !== latestFeedRequestId || currentFeed !== feed) return;
        if (!result.success || !Array.isArray(result.data)) {
          feedLoadState = "error";
          posts = [];
          renderFeed();
          return;
        }
        let mappedPosts = result.data.map(function (p) {
          const createdAt = p.created_at || null;
          return {
            id: p.id,
            author: p.author || "User",
            authorId: p.authorId || null,
            authorAvatar: p.authorAvatar || "",
            authorInitial: p.authorInitial || "U",
            fromApi: true,
            followed: !!p.followed,
            image: p.image || "",
            text: p.text || "",
            likes: typeof p.likes === "number" ? p.likes : 0,
            liked: !!p.liked,
            comments: Array.isArray(p.comments) ? p.comments : [],
            created_at: createdAt,
            time: formatPostTime(createdAt, p.time || "Just now")
          };
        });

        if (feed === "followed") {
          mappedPosts = mappedPosts.filter(function (p) {
            return !!p.authorId && !!p.followed;
          });
          mappedPosts.forEach(function (p) { p.followed = true; });
        }

        feedLoadState = "ok";
        posts = mappedPosts;
        renderFeed();
      })
      .catch(function () {
        if (requestId !== latestFeedRequestId || currentFeed !== feed) return;
        feedLoadState = "error";
        posts = [];
        renderFeed();
      });
  }

  function switchCommunityView(mode) {
    syncUrlForMode(mode);
    updateTabStyles(mode);
    fetchBrowseFeed(mode);
  }

  document.querySelectorAll(".feed-nav [data-feed]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      switchCommunityView(btn.getAttribute("data-feed"));
    });
  });

  function initPageFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const compose = String(params.get("compose") || "").trim() === "1";
    const feed = String(params.get("feed") || "").trim().toLowerCase();
    let forceOpenCreate = false;
    try {
      window.localStorage.removeItem("catface_preferred_feed");
      forceOpenCreate = window.localStorage.getItem("catface_open_create_modal") === "1";
      if (forceOpenCreate) window.localStorage.removeItem("catface_open_create_modal");
    } catch (e) {}

    if (feed === "followed") switchCommunityView("followed");
    else switchCommunityView("recommended");

    if (compose || forceOpenCreate) {
      window.setTimeout(function () { openCreate(); }, 0);
    }
  }

  initPageFromUrl();
})();

(function () {
  const USER_KEY = "catface_user";
  function loadUser() {
    try {
      const raw = window.localStorage.getItem(USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }
  const loginBtn = document.querySelector(".login-btn");
  const user = loadUser();
  if (loginBtn) {
    if (user) {
      loginBtn.textContent = "My Account";
      loginBtn.href = "/pages/account.html";
    } else {
      loginBtn.textContent = "Log in";
      loginBtn.href = "/pages/log-in.html";
    }
  }
  var heroName = document.querySelector(".nav-hero-name");
  var heroHandle = document.querySelector(".u-handle");
  if (user) {
    if (heroName) heroName.textContent = user.display_name || user.username || user.email || "User";
    if (heroHandle) heroHandle.textContent = user.username ? "@" + user.username : "";
  }
})();

