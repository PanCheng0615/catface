(function () {
  const FEED_PAGE_SIZE = 15;
  const FEED_SCROLL_THRESHOLD_PX = 800;
  let posts = [];
  let trendingById = {};
  let currentPostId = null;
  let currentFeed = "recommended";
  let activeChipFilter = "all";
  let feedLoadState = "loading";
  let latestFeedRequestId = 0;
  let pendingPostToOpen = "";
  let feedOffset = 0;
  let feedHasMore = true;
  let feedLoadingMore = false;
  let feedFillCheckTimer = 0;

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

  function optimizeCommunityImg(src, options) {
    const raw = String(src || "").trim();
    const opts = options || {};
    if (!raw || /^data:/i.test(raw) || /^blob:/i.test(raw) || /^[./]/.test(raw)) return raw;
    try {
      const url = new URL(raw, window.location.origin);
      const host = String(url.hostname || "").toLowerCase();
      if (host === "cataas.com" || /(^|\.)cataas\.com$/.test(host)) {
        // Keep the exact same URL for feed/detail/trending so fallback cat
        // images never change when the same post is opened in another view.
        return raw;
      }
      if (host === "images.unsplash.com") {
        if (opts.width) url.searchParams.set("w", String(opts.width));
        if (opts.height) url.searchParams.set("h", String(opts.height));
        url.searchParams.set("auto", "format");
        url.searchParams.set("fit", "crop");
        url.searchParams.set("q", String(opts.quality || 72));
        return url.toString();
      }
      return raw;
    } catch (e) {
      return raw;
    }
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
  const postModalBody = document.querySelector(".post-modal-body");
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
  const centerScrollEl = document.querySelector(".center");
  const storiesTrack = document.querySelector(".stories-track");
  const followSuggestionsList = document.getElementById("followSuggestionsList");
  const chipsRow = document.querySelector(".chips-row");
  const trendingList = document.getElementById("trendingList");

  const CHIP_KEYWORDS = {
    all: [],
    cute: ["cute", "gentle", "sweet", "adorable", "shy", "friendly", "cuddly"],
    handsome: ["handsome", "majestic", "elegant", "gentleman"],
    playful: ["playful", "active", "curious", "energy", "quick", "exploring"],
    lazy: ["lazy", "nap", "napping", "sleep", "chill", "quiet"],
    fluffy: ["fluffy", "soft", "fur", "furry", "towel"],
    kittens: ["kitten", "kittens", "2 months", "3 months", "4 months", "5 months"],
    senior: ["senior", "old", "8 years", "9 years", "10 years", "11 years", "12 years"],
    majestic: ["majestic", "graceful", "queen", "king", "royal"],
    derpy: ["derpy", "goofy", "silly", "funny", "clumsy"]
  };

  function formatLikes(num) {
    const n = Number(num) || 0;
    if (n >= 10000) return (n / 1000).toFixed(0) + "k";
    return String(n);
  }

  function normalizeChipLabel(chipText) {
    return String(chipText || "")
      .replace(/[^\w\s]/g, " ")
      .trim()
      .toLowerCase();
  }

  function getChipFilterKeyFromElement(chipEl) {
    if (!chipEl) return "all";
    const label = normalizeChipLabel(chipEl.textContent || "");
    if (!label) return "all";
    const key = label.split(/\s+/)[0];
    return CHIP_KEYWORDS[key] ? key : "all";
  }

  function filterPostsByActiveChip(list) {
    if (!Array.isArray(list) || !list.length) return [];
    if (activeChipFilter === "all") return list.slice();
    const keywords = CHIP_KEYWORDS[activeChipFilter] || [];
    if (!keywords.length) return list.slice();
    return list.filter(function (post) {
      const source = String((post && post.text) || "").toLowerCase();
      return keywords.some(function (kw) { return source.indexOf(kw) !== -1; });
    });
  }

  function updateChipStyles() {
    if (!chipsRow) return;
    chipsRow.querySelectorAll(".chip").forEach(function (chip) {
      const key = getChipFilterKeyFromElement(chip);
      chip.classList.toggle("active", key === activeChipFilter);
      chip.setAttribute("role", "button");
      chip.setAttribute("tabindex", "0");
      chip.setAttribute("aria-pressed", key === activeChipFilter ? "true" : "false");
    });
  }

  function bindChipFilters() {
    if (!chipsRow) return;
    chipsRow.addEventListener("click", function (e) {
      const chip = e.target && e.target.closest ? e.target.closest(".chip") : null;
      if (!chip) return;
      activeChipFilter = getChipFilterKeyFromElement(chip);
      updateChipStyles();
      renderFeed();
      scheduleFeedFillCheck();
    });
    chipsRow.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      const chip = e.target && e.target.closest ? e.target.closest(".chip") : null;
      if (!chip) return;
      e.preventDefault();
      activeChipFilter = getChipFilterKeyFromElement(chip);
      updateChipStyles();
      renderFeed();
      scheduleFeedFillCheck();
    });
    updateChipStyles();
  }

  function mergePosts(existingPosts, incomingPosts) {
    const seenIds = new Set((existingPosts || []).map(function (post) { return post.id; }));
    const merged = (existingPosts || []).slice();
    (incomingPosts || []).forEach(function (post) {
      if (!post || !post.id || seenIds.has(post.id)) return;
      seenIds.add(post.id);
      merged.push(post);
    });
    return merged;
  }

  function isNearFeedBottom() {
    if (centerScrollEl) {
      return centerScrollEl.scrollTop + centerScrollEl.clientHeight >= centerScrollEl.scrollHeight - FEED_SCROLL_THRESHOLD_PX;
    }
    const doc = document.documentElement;
    return window.innerHeight + window.scrollY >= doc.scrollHeight - FEED_SCROLL_THRESHOLD_PX;
  }

  function scheduleFeedFillCheck() {
    if (feedFillCheckTimer) return;
    feedFillCheckTimer = window.setTimeout(function () {
      feedFillCheckTimer = 0;
      maybeLoadMoreFeed();
    }, 0);
  }

  function maybeLoadMoreFeed() {
    if (feedLoadState !== "ok" || feedLoadingMore || !feedHasMore) return;
    if (isNearFeedBottom()) {
      fetchBrowseFeed(currentFeed, { append: true });
    }
  }

  function normalizeCommunityPost(p) {
    const createdAt = p.created_at || null;
    const likeNum = typeof p.likes === "number" ? p.likes : parseInt(String(p.likes == null ? "0" : p.likes), 10);
    return {
      id: p.id,
      author: p.author || "User",
      authorId: p.authorId || null,
      authorUsername: p.authorUsername || "",
      authorAvatar: p.authorAvatar || "",
      authorInitial: (p.author && p.author.charAt(0) ? p.author.charAt(0) : "U").toUpperCase(),
      fromApi: true,
      followed: !!p.followed,
      image: p.image || "",
      text: p.text || "",
      likes: Number.isFinite(likeNum) ? likeNum : 0,
      liked: !!p.liked,
      comments: Array.isArray(p.comments) ? p.comments : [],
      created_at: createdAt,
      time: formatPostTime(createdAt, p.time || "Just now")
    };
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
    let post = posts.find(function (p) { return p.id === id; });
    if (!post && trendingById[id]) {
      post = normalizeCommunityPost(trendingById[id]);
      const idx = posts.findIndex(function (p) { return p.id === post.id; });
      if (idx === -1) posts.unshift(post);
      else posts[idx] = post;
    }
    if (!post) return;
    currentPostId = id;
    if (!postOverlay || !postDetailImage || !detailAuthorAvatar || !detailAuthorName || !detailTime || !detailText) return;
    postDetailImage.src = optimizeCommunityImg(post.image || "", { width: 1200, height: 1200, quality: 80 });
    postDetailImage.style.display = post.image ? "" : "none";
    if (postModalBody) {
      postModalBody.classList.toggle("no-image", !post.image);
    }
    if (post.authorAvatar) {
      detailAuthorAvatar.innerHTML = '<img src="' + escapeHtml(optimizeCommunityImg(post.authorAvatar, { width: 128, height: 128, quality: 72 })) + '" alt="" decoding="async">';
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

  function updateSidebarFollowButtonState(buttonEl, isFollowing) {
    if (!buttonEl) return;
    buttonEl.textContent = isFollowing ? "Following" : "Follow";
    buttonEl.classList.toggle("is-following", !!isFollowing);
  }

  function buildFollowRecommendationReason(author) {
    const explicitReason = String((author && author.recommendation_reason) || "").trim();
    if (explicitReason) return explicitReason;
    const mutualCount = Number(author && author.mutual_count) || 0;
    const recentPostsCount = Number(author && author.recent_posts_count) || 0;
    if (mutualCount > 0) {
      return mutualCount + " mutual connections";
    }
    if (recentPostsCount >= 3) {
      return "Active in the last 30 days";
    }
    return "Recommended for you";
  }

  function buildFollowMeta(author) {
    const postsCount = Number(author && author.posts_count) || 0;
    const followerCount = Number(author && author.followers_count) || 0;
    const recentEngagement = Number(author && author.recent_engagement) || 0;
    return postsCount + " posts · " + followerCount + " followers · " + recentEngagement + " hot";
  }

  function renderFollowSuggestions(authors) {
    if (!followSuggestionsList) return;
    const list = Array.isArray(authors) ? authors : [];
    if (!list.length) {
      followSuggestionsList.innerHTML =
        '<div class="trend-meta" style="padding:12px 18px;color:var(--text-muted);font-size:13px;">No suggestions yet.</div>';
      return;
    }
    followSuggestionsList.innerHTML = list.map(function (author, idx) {
      const id = String((author && author.id) || "");
      const name = String((author && (author.display_name || author.username)) || "User");
      const avatar = String((author && author.avatar_url) || "");
      const recommendationReason = buildFollowRecommendationReason(author);
      const statsMeta = buildFollowMeta(author);
      const avatarHtml = avatar
        ? '<img src="' + escapeHtml(optimizeCommunityImg(avatar, { width: 96, height: 96, quality: 68 })) + '" alt="' + escapeHtml(name) + '" loading="lazy" decoding="async" fetchpriority="low">'
        : '<span style="font-size:18px;color:var(--brand);font-weight:800;">' + escapeHtml(name.charAt(0).toUpperCase()) + "</span>";
      return (
        '<div class="follow-row" data-author-id="' + escapeHtml(id) + '" data-profile-name="' + escapeHtml(name) + '">' +
          '<div class="follow-rank">#' + escapeHtml(String(idx + 1)) + "</div>" +
          '<div class="follow-avatar">' + avatarHtml + "</div>" +
          '<div class="follow-info">' +
            '<div class="follow-name">' + escapeHtml(name) + "</div>" +
            '<div class="follow-reason">' + escapeHtml(recommendationReason) + "</div>" +
            '<div class="follow-sub">' + escapeHtml(statsMeta) + "</div>" +
          "</div>" +
          '<button class="follow-btn" type="button">Follow</button>' +
        "</div>"
      );
    }).join("");
  }

  function renderTrendingPanel() {
    const wrap = trendingList;
    if (!wrap) return;
    wrap.innerHTML =
      '<div class="trend-meta" style="padding:12px 18px;color:var(--text-muted);font-size:13px;">Loading trending posts…</div>';
    fetch(API_BASE_URL + "/community/trending?limit=10", {
      method: "GET",
      headers: typeof getAuthHeaders === "function" ? getAuthHeaders() : { "Content-Type": "application/json" }
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (result) {
        if (!result || !result.success || !Array.isArray(result.data)) {
          wrap.innerHTML =
            '<div class="trend-meta" style="padding:12px 18px;color:var(--text-muted);font-size:13px;">Could not load trending.</div>';
          return;
        }
        trendingById = {};
        result.data.forEach(function (p) {
          if (p && p.id) trendingById[p.id] = p;
        });
        if (!result.data.length) {
          wrap.innerHTML =
            '<div class="trend-meta" style="padding:12px 18px;color:var(--text-muted);font-size:13px;">No posts from the past 30 days yet.</div>';
          return;
        }
        wrap.innerHTML = "";
        result.data.forEach(function (p, idx) {
          const row = document.createElement("div");
          row.className = "trend-row";
          row.setAttribute("role", "button");
          row.tabIndex = 0;
          row.style.cursor = "pointer";
          const titleText = String(p.text || "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 56) || "Community post";
          const likesCount = Number(p.likes) || 0;
          const commentsCount = Number(p.comments_count) || 0;
          const metaLine = "by " + (p.author || "Member") + " · ❤ " + likesCount + " · 💬 " + commentsCount;
          const rankLabel = "#" + String(idx + 1);
          const imgSrc = p.image || "";
          const trendImgSrc = optimizeCommunityImg(imgSrc, { width: 120, height: 120, quality: 68 });
          const thumb = imgSrc
            ? '<img class="trend-img" src="' + escapeHtml(trendImgSrc) + '" alt="" loading="lazy" decoding="async" fetchpriority="low">'
            : '<div class="trend-img" style="display:grid;place-items:center;background:var(--brand-light);font-size:20px;">&#x1F4AC;</div>';
          row.innerHTML =
            '<span class="trend-rank">' + escapeHtml(rankLabel) + '</span>' +
            thumb +
            '<div class="trend-info"><div class="trend-title">' +
            escapeHtml(titleText) +
            '</div><div class="trend-meta">' +
            escapeHtml(metaLine) +
            '</div></div><span class="trend-num">' +
            "Open" +
            "</span>";
          row.addEventListener("click", function () {
            if (p.id) openPostDetail(p.id);
          });
          row.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (p.id) openPostDetail(p.id);
            }
          });
          wrap.appendChild(row);
        });
      })
      .catch(function () {
        wrap.innerHTML =
          '<div class="trend-meta" style="padding:12px 18px;color:var(--text-muted);font-size:13px;">Could not load trending.</div>';
      });
  }

  function bindSidebarProfileCards() {
    document.querySelectorAll(".trend-row[data-profile-story]").forEach(function (rowEl) {
      rowEl.style.cursor = "pointer";
      const imgEl = rowEl.querySelector(".trend-img");
      if (imgEl) {
        imgEl.style.cursor = "pointer";
        imgEl.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          openStoryProfile(rowEl.getAttribute("data-profile-story"), rowEl.getAttribute("data-profile-name"));
        });
      }
    });

    if (followSuggestionsList) {
      followSuggestionsList.addEventListener("click", function (e) {
        const rowEl = e.target && e.target.closest ? e.target.closest(".follow-row[data-author-id]") : null;
        if (!rowEl || !followSuggestionsList.contains(rowEl)) return;
        if (e.target && e.target.closest && e.target.closest(".follow-btn")) return;
        const authorId = String(rowEl.getAttribute("data-author-id") || "").trim();
        const authorName = String(rowEl.getAttribute("data-profile-name") || "User");
        if (!authorId) return;
        navigateToAuthor({ author: authorName, authorId: authorId }, authorName);
      });
    }
  }

  function bindSidebarFollowActions() {
    if (!followSuggestionsList) return;
    followSuggestionsList.innerHTML =
      '<div class="trend-meta" style="padding:12px 18px;color:var(--text-muted);font-size:13px;">Loading suggestions…</div>';

    fetch(API_BASE_URL + "/users/follow-suggestions?limit=18", {
      method: "GET",
      headers: getAuthHeaders()
    })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (!result || !result.success || !Array.isArray(result.data)) {
          followSuggestionsList.innerHTML =
            '<div class="trend-meta" style="padding:12px 18px;color:var(--text-muted);font-size:13px;">Could not load suggestions.</div>';
          return;
        }
        renderFollowSuggestions(result.data);
      })
      .catch(function () {
        followSuggestionsList.innerHTML =
          '<div class="trend-meta" style="padding:12px 18px;color:var(--text-muted);font-size:13px;">Could not load suggestions.</div>';
      });

    followSuggestionsList.addEventListener("click", function (e) {
      const buttonEl = e.target && e.target.closest ? e.target.closest(".follow-btn") : null;
      if (!buttonEl || !followSuggestionsList.contains(buttonEl)) return;
      const rowEl = buttonEl.closest(".follow-row[data-author-id]");
      if (!rowEl) return;
      const authorId = String(rowEl.getAttribute("data-author-id") || "").trim();
      if (!authorId) return;
      e.preventDefault();
      e.stopPropagation();
      if (!requireLogin()) return;
      buttonEl.disabled = true;
      fetch(API_BASE_URL + "/users/" + encodeURIComponent(authorId) + "/follow", {
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
        .then(function (followResult) {
          if (!followResult || !followResult.success || !followResult.data) {
            alert((followResult && followResult.message) || "Follow failed");
            return;
          }
          const on = !!followResult.data.following;
          updateSidebarFollowButtonState(buttonEl, on);
          posts.forEach(function (p) {
            if (p.authorId === authorId) p.followed = on;
          });
          if (currentPostId != null) {
            const currentPost = posts.find(function (p) { return p.id === currentPostId; });
            if (currentPost && currentPost.authorId === authorId) updateFollowButton(currentPost);
          }
          renderFeed();
          loadFollowedStories();
        })
        .catch(function () {
          alert("Network error, please try again.");
        })
        .finally(function () {
          buttonEl.disabled = false;
        });
    });
  }

  function openProfile(author) {
    const post = posts.find(function (p) { return p.id === currentPostId; });
    navigateToAuthor(post, author);
  }

  function ensureStoryA11y() {
    if (!storiesTrack) return;
    storiesTrack.querySelectorAll(".story").forEach(function (storyEl) {
      if (storyEl.classList.contains("story-add")) return;
      if (!storyEl.hasAttribute("tabindex")) storyEl.setAttribute("tabindex", "0");
      storyEl.setAttribute("role", "button");
    });
  }

  function activateStory(storyEl) {
    if (!storyEl || storyEl.classList.contains("story-add")) return;
    const authorId = String(storyEl.getAttribute("data-author-id") || "").trim();
    const nameEl = storyEl.querySelector(".story-name");
    const name = nameEl ? nameEl.textContent.trim() : "";
    if (authorId) {
      navigateToAuthor({ author: name || "User", authorId: authorId }, name || "User");
      return;
    }
    const key = storyEl.getAttribute("data-user") || "";
    const href = storyEl.getAttribute("data-story-href");
    if (href) {
      try {
        window.localStorage.setItem("catface_last_story_profile", key);
        window.localStorage.removeItem("catface_last_author_id");
        window.localStorage.setItem("catface_last_author_name", name || key);
      } catch (e) {}
      window.location.href = href;
      return;
    }
    openStoryProfile(key, name || key);
  }

  if (storiesTrack) {
    storiesTrack.addEventListener("click", function (e) {
      const storyEl = e.target && e.target.closest ? e.target.closest(".story") : null;
      if (!storyEl || !storiesTrack.contains(storyEl)) return;
      activateStory(storyEl);
    });
    storiesTrack.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      const storyEl = e.target && e.target.closest ? e.target.closest(".story") : null;
      if (!storyEl || !storiesTrack.contains(storyEl)) return;
      e.preventDefault();
      activateStory(storyEl);
    });
  }
  ensureStoryA11y();

  function buildYourStoryHtml() {
    return '<div class="story story-add" role="button" tabindex="0" onclick="document.getElementById(\'btnCreatePost\').click()"><div class="story-ring"><div class="story-inner">+</div></div><span class="story-name">Your story</span></div>';
  }

  function buildStoryListHtml(users) {
    const list = Array.isArray(users) ? users : [];
    return list.slice(0, 12).map(function (user, index) {
      const display = (user && (user.display_name || user.username)) ? (user.display_name || user.username) : "User";
      const avatar = user && user.avatar_url ? String(user.avatar_url) : "";
      const id = user && user.id ? String(user.id) : "";
      const avatarInner = avatar
        ? '<img src="' + escapeHtml(optimizeCommunityImg(avatar, { width: 120, height: 120, quality: 68 })) + '" alt="' + escapeHtml(display) + '" loading="' + (index < 4 ? "eager" : "lazy") + '" decoding="async" fetchpriority="' + (index < 4 ? "high" : "low") + '">'
        : '<span style="font-size:20px;color:var(--brand);font-weight:800;">' + escapeHtml(display.charAt(0).toUpperCase()) + "</span>";
      return (
        '<div class="story" data-author-id="' + escapeHtml(id) + '">' +
          '<div class="story-ring"><div class="story-inner">' + avatarInner + "</div></div>" +
          '<span class="story-name">' + escapeHtml(display) + "</span>" +
        "</div>"
      );
    }).join("");
  }

  function renderStories(users) {
    if (!storiesTrack) return;
    const list = Array.isArray(users) ? users : [];
    const following = list.filter(function (user) {
      return String((user && user.story_source) || "") === "following";
    });
    const suggested = list.filter(function (user) {
      return String((user && user.story_source) || "") === "suggested";
    });

    let html = buildYourStoryHtml();
    if (following.length) html += buildStoryListHtml(following);
    if (following.length && suggested.length) html += '<div class="story-divider" aria-hidden="true"></div>';
    if (suggested.length) html += buildStoryListHtml(suggested);

    storiesTrack.innerHTML = html;
    ensureStoryA11y();
  }

  function fetchStoryFallbackUsers() {
    return fetch(API_BASE_URL + "/users/follow-suggestions?limit=12", {
      method: "GET",
      headers: getAuthHeaders()
    })
      .then(function (res) {
        return res.json().then(function (payload) {
          return { ok: res.ok, payload: payload };
        });
      })
      .then(function (response) {
        const payload = response.payload || {};
        if (!response.ok || !payload.success || !Array.isArray(payload.data)) return [];
        return payload.data.map(function (user) {
          return Object.assign({}, user, { story_source: "suggested" });
        });
      })
      .catch(function () {
        return [];
      });
  }

  function mergeStoryUsers(following, suggested) {
    const merged = [];
    const seen = new Set();

    (Array.isArray(following) ? following : []).forEach(function (user) {
      const id = String((user && user.id) || "").trim();
      if (!id || seen.has(id)) return;
      seen.add(id);
      merged.push(Object.assign({}, user, { story_source: "following" }));
    });

    (Array.isArray(suggested) ? suggested : []).forEach(function (user) {
      const id = String((user && user.id) || "").trim();
      if (!id || seen.has(id)) return;
      seen.add(id);
      merged.push(Object.assign({}, user, { story_source: "suggested" }));
    });

    return merged.slice(0, 12);
  }

  function loadFollowedStories() {
    if (!storiesTrack) return;
    if (!getToken()) {
      fetchStoryFallbackUsers().then(renderStories);
      return;
    }
    fetch(API_BASE_URL + "/users/follows?type=following", {
      method: "GET",
      headers: getAuthHeaders()
    })
      .then(function (res) {
        return res.json().then(function (payload) {
          return { ok: res.ok, payload: payload };
        });
      })
      .then(function (response) {
        const payload = response.payload || {};
        if (!response.ok || !payload.success || !Array.isArray(payload.data)) {
          return fetchStoryFallbackUsers().then(renderStories);
        }
        const following = payload.data.map(function (user) {
          return Object.assign({}, user, { story_source: "following" });
        });
        return fetchStoryFallbackUsers().then(function (suggested) {
          renderStories(mergeStoryUsers(following, suggested));
        });
      })
      .catch(function () {
        fetchStoryFallbackUsers().then(renderStories);
      });
  }

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
    const visiblePosts = filterPostsByActiveChip(posts);
    if (!visiblePosts.length) {
      const emptyMsg = currentFeed === "followed"
        ? (!getToken()
            ? "Log in to see posts from creators you follow."
            : "No posts here yet. Follow someone from Recommended, then check back.")
        : (activeChipFilter === "all"
            ? "No community posts yet."
            : "No posts match this tag right now.");
      feedEl.innerHTML = '<div class="feed-empty">' + emptyMsg + "</div>";
      return;
    }
    visiblePosts.forEach(function (post, index) {
      const card = document.createElement("article");
      card.className = "post-card";
      card.dataset.id = post.id;
      const postImage = post.image || "";
      const postImageSrc = optimizeCommunityImg(postImage, { width: 900, height: 900, quality: 74 });
      const imgHtml = postImage
        ? '<img class="post-img" src="' + escapeHtml(postImageSrc) + '" alt="" data-open-detail="1" loading="' + (index < 2 ? "eager" : "lazy") + '" decoding="async" fetchpriority="' + (index < 2 ? "high" : "low") + '">'
        : "";
      const safeAuthor = post.author || "User";
      const safeAuthorInitial = post.authorInitial || safeAuthor[0] || "U";
      const avatarInner = post.authorAvatar
        ? '<img src="' + escapeHtml(optimizeCommunityImg(post.authorAvatar, { width: 96, height: 96, quality: 68 })) + '" alt="" loading="' + (index < 3 ? "eager" : "lazy") + '" decoding="async" fetchpriority="' + (index < 3 ? "high" : "low") + '">'
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

    if (feedLoadingMore) {
      const loadingMore = document.createElement("div");
      loadingMore.className = "feed-status";
      loadingMore.textContent = "Loading more posts...";
      feedEl.appendChild(loadingMore);
    } else if (feedHasMore) {
      const loadHint = document.createElement("div");
      loadHint.className = "feed-status";
      loadHint.textContent = "Scroll to the bottom to load 15 more posts.";
      feedEl.appendChild(loadHint);
    }
  }

  function updateTabStyles(mode) {
    document.querySelectorAll(".feed-nav [data-feed]").forEach(function (b) {
      var on = b.getAttribute("data-feed") === mode;
      b.classList.toggle("is-active", on);
      b.classList.toggle("active", on);
    });
  }

  function fetchBrowseFeed(feed, options) {
    options = options || {};
    const append = options.append === true;
    closeCreate();
    if (append) {
      if (feedLoadingMore || !feedHasMore) return;
      feedLoadingMore = true;
      renderFeed();
    } else {
      currentFeed = feed;
      posts = [];
      feedOffset = 0;
      feedHasMore = true;
      feedLoadingMore = false;
      feedLoadState = "loading";
      renderFeed();
    }
    latestFeedRequestId += 1;
    const requestId = latestFeedRequestId;
    const q = feed === "followed" ? "followed" : "recommended";

    if (feed === "followed" && !getToken()) {
      feedLoadState = "ok";
      posts = [];
      feedOffset = 0;
      feedHasMore = false;
      feedLoadingMore = false;
      renderFeed();
      return;
    }

    fetch(
      API_BASE_URL + "/community/posts?feed=" + encodeURIComponent(q) +
      "&limit=" + FEED_PAGE_SIZE +
      "&offset=" + (append ? feedOffset : 0),
      {
      method: "GET",
      headers: getAuthHeaders()
      }
    )
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (requestId !== latestFeedRequestId || currentFeed !== feed) return;
        if (!result.success || !Array.isArray(result.data)) {
          feedLoadState = "error";
          posts = [];
          feedOffset = 0;
          feedHasMore = false;
          feedLoadingMore = false;
          renderFeed();
          return;
        }
        let mappedPosts = result.data.map(normalizeCommunityPost);

        if (feed === "followed") {
          mappedPosts = mappedPosts.filter(function (p) {
            return !!p.authorId && !!p.followed;
          });
          mappedPosts.forEach(function (p) { p.followed = true; });
        }

        feedLoadState = "ok";
        posts = append ? mergePosts(posts, mappedPosts) : mappedPosts;
        feedOffset = result.pagination && typeof result.pagination.next_offset === "number"
          ? result.pagination.next_offset
          : posts.length;
        feedHasMore = !!(result.pagination && result.pagination.has_more);
        feedLoadingMore = false;
        renderFeed();
        if (pendingPostToOpen) {
          const targetPost = posts.find(function (p) { return p.id === pendingPostToOpen; });
          if (targetPost) {
            const postId = pendingPostToOpen;
            pendingPostToOpen = "";
            window.setTimeout(function () {
              openPostDetail(postId);
            }, 0);
          }
        }
      })
      .catch(function () {
        if (requestId !== latestFeedRequestId || currentFeed !== feed) return;
        feedLoadingMore = false;
        if (!append) {
          feedLoadState = "error";
          posts = [];
          feedOffset = 0;
          feedHasMore = false;
        }
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

  if (centerScrollEl) {
    centerScrollEl.addEventListener("scroll", maybeLoadMoreFeed, { passive: true });
  } else {
    window.addEventListener("scroll", maybeLoadMoreFeed, { passive: true });
  }
  window.addEventListener("resize", scheduleFeedFillCheck);

  function initPageFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const compose = String(params.get("compose") || "").trim() === "1";
    const feed = String(params.get("feed") || "").trim().toLowerCase();
    pendingPostToOpen = String(params.get("post") || "").trim();
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
  renderTrendingPanel();
  bindSidebarProfileCards();
  bindSidebarFollowActions();
  loadFollowedStories();
  bindChipFilters();
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
  const navUserRow = document.getElementById("communityNavUser");
  const user = loadUser();
  const navHeroAvatar = document.querySelector(".nav-hero-avatar");
  const navUserAvatar = document.querySelector(".nav-avatar");
  const composerAvatar = document.querySelector(".composer-avatar");

  function applyAvatar(el, avatarUrl, fallbackText) {
    if (!el) return;
    const label = (fallbackText || "U").charAt(0).toUpperCase();
    if (avatarUrl) {
      el.textContent = "";
      el.style.backgroundImage = 'url("' + String(avatarUrl).replace(/"/g, '\\"') + '")';
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
      el.style.backgroundRepeat = "no-repeat";
    } else {
      el.textContent = label;
      el.style.backgroundImage = "";
      el.style.backgroundSize = "";
      el.style.backgroundPosition = "";
      el.style.backgroundRepeat = "";
    }
  }

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
    var displayName = user.display_name || user.username || user.email || "User";
    if (heroName) heroName.textContent = displayName;
    if (heroHandle) heroHandle.textContent = user.username ? "@" + user.username : "";
    applyAvatar(navHeroAvatar, user.avatar_url, displayName);
    applyAvatar(navUserAvatar, user.avatar_url, displayName);
    applyAvatar(composerAvatar, user.avatar_url, displayName);
  } else {
    applyAvatar(navHeroAvatar, "", "U");
    applyAvatar(navUserAvatar, "", "U");
    applyAvatar(composerAvatar, "", "U");
  }
  if (navUserRow) {
    navUserRow.addEventListener("click", function () {
      if (user) {
        window.location.href = "/pages/chat.html";
        return;
      }
      requireLoginForNavigation("/pages/chat.html", "Please log in first");
    });
  }
})();

