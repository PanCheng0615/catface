(function () {
  const cards = document.querySelectorAll(".notice-card");
  const list = document.querySelector(".message-list");
  const searchInput = document.querySelector(".search-input");
  const overlay = document.getElementById("detail-overlay");
  const closeBtn = document.getElementById("detail-close-btn");
  const detailAvatar = document.getElementById("detail-avatar");
  const detailTitle = document.getElementById("detail-title");
  const detailMeta = document.getElementById("detail-meta");
  const detailBodyText = document.getElementById("detail-body-text");
  const TYPES = ["likes", "follows", "comments"];

  let activeType = "likes";
  let latestRequestId = 0;
  let currentItems = [];

  function normalizeType(t) {
    if (t === "likes" || t === "comments" || t === "follows") return t;
    return "likes";
  }

  function setActiveCard(type) {
    cards.forEach(function (card) {
      const cardType = normalizeType(card.getAttribute("data-filter"));
      card.classList.toggle("active", cardType === type);
    });
  }

  function setUrlType(type) {
    const params = new URLSearchParams(window.location.search);
    params.set("type", type);
    const next = window.location.pathname + "?" + params.toString();
    window.history.replaceState(null, "", next);
  }

  function getBadgeEl(type) {
    return document.querySelector('.notice-badge[data-count-for="' + type + '"]');
  }

  function setBadgeCount(type, count) {
    const el = getBadgeEl(type);
    if (!el) return;
    const n = Number(count) || 0;
    if (n <= 0) {
      el.hidden = true;
      el.textContent = "0";
      return;
    }
    el.hidden = false;
    el.textContent = n > 99 ? "99+" : String(n);
  }

  function bindCardAccessibility(card) {
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      card.click();
    });
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function markReadOnServer(ids) {
    const normalized = (Array.isArray(ids) ? ids : [])
      .map(function (id) { return String(id || "").trim(); })
      .filter(Boolean);
    if (!normalized.length || !getToken()) return Promise.resolve();
    return fetch(API_BASE_URL + "/notifications/read", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ ids: normalized })
    })
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .catch(function () {
        return null;
      });
  }

  function fetchNotifications(type) {
    return fetch(API_BASE_URL + "/notifications?type=" + encodeURIComponent(type), {
      method: "GET",
      headers: getAuthHeaders()
    })
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (result) {
        if (!result || !result.success || !Array.isArray(result.data)) return [];
        return result.data;
      })
      .catch(function () {
        return [];
      });
  }

  function openDetail(item) {
    detailAvatar.src =
      item.avatar_url ||
      "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=120&h=120&q=80";
    detailTitle.textContent = item.title || "Notification";
    detailMeta.textContent = (item.category || "") + " · " + (item.time || "");
    detailBodyText.textContent = item.detail || "";
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
  }

  function renderEmpty(name, message) {
    list.innerHTML =
      '<div class="message-item"><div class="message-main"><div class="message-name">' +
      escapeHtml(name) +
      '</div><div class="message-snippet">' +
      escapeHtml(message) +
      "</div></div></div>";
  }

  function render(listData) {
    if (!Array.isArray(listData) || listData.length === 0) {
      renderEmpty("No notifications", "No data in this category yet.");
      return;
    }

    list.innerHTML = listData
      .map(function (n) {
        const unread = Number(n.unread_count || 0);
        return (
          '<article class="message-item" data-id="' +
          escapeHtml(n.id) +
          '">' +
          '<img class="message-avatar" src="' +
          escapeHtml(
            n.avatar_url ||
              "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=120&h=120&q=80"
          ) +
          '" alt="">' +
          '<div class="message-main">' +
          '<div class="message-top">' +
          '<div class="message-name">' +
          escapeHtml(n.title) +
          "</div>" +
          '<div class="message-time">' +
          escapeHtml(n.time) +
          "</div>" +
          "</div>" +
          '<div class="message-snippet">' +
          escapeHtml(n.snippet || n.detail || "") +
          "</div>" +
          "</div>" +
          (unread > 0
            ? '<span class="message-unread">' + unread + "</span>"
            : "") +
          "</article>"
        );
      })
      .join("");

    const mapById = {};
    listData.forEach(function (x) {
      mapById[x.id] = x;
    });

    list.querySelectorAll(".message-item").forEach(function (el) {
      el.addEventListener("click", function () {
        const data = mapById[el.getAttribute("data-id")];
        if (!data) return;
        markReadOnServer([data.id]);
        currentItems = currentItems.map(function (x) {
          if (x.id !== data.id) return x;
          return Object.assign({}, x, { unread_count: 0 });
        });
        applySearchFilter();
        refreshCategoryBadges();
        openDetail(Object.assign({}, data, { unread_count: 0 }));
      });
    });
  }

  function applySearchFilter() {
    const key = String((searchInput && searchInput.value) || "").trim().toLowerCase();
    if (!key) {
      render(currentItems);
      return;
    }
    const filtered = currentItems.filter(function (item) {
      const haystack =
        String(item.title || "") +
        " " +
        String(item.snippet || "") +
        " " +
        String(item.detail || "") +
        " " +
        String(item.category || "");
      return haystack.toLowerCase().indexOf(key) !== -1;
    });
    if (!filtered.length) {
      renderEmpty("No match", "Try another keyword.");
      return;
    }
    render(filtered);
  }

  function refreshCategoryBadges() {
    if (!getToken()) {
      TYPES.forEach(function (t) { setBadgeCount(t, 0); });
      return;
    }
    fetchNotifications("all").then(function (allItems) {
      TYPES.forEach(function (type) {
        const arr = (Array.isArray(allItems) ? allItems : []).filter(function (item) {
          return item && item.type === type;
        });
        const unread = arr.reduce(function (acc, item) {
          const n = Number(item && item.unread_count);
          return acc + (Number.isFinite(n) && n > 0 ? 1 : 0);
        }, 0);
        setBadgeCount(type, unread);
      });
      setBadgeCount(activeType, 0);
    });
  }

  function loadNotifications(type) {
    activeType = normalizeType(type);
    setActiveCard(activeType);
    setUrlType(activeType);
    if (!getToken()) {
      renderEmpty("Please log in", "Login is required to view notifications.");
      TYPES.forEach(function (t) { setBadgeCount(t, 0); });
      return;
    }
    latestRequestId += 1;
    const requestId = latestRequestId;
    renderEmpty("Loading...", "Fetching notifications.");
    fetch(API_BASE_URL + "/notifications?type=" + encodeURIComponent(activeType), {
      method: "GET",
      headers: getAuthHeaders()
    })
      .then(function (res) {
        if (res.status === 401) {
          renderEmpty("Login expired", "Please log in again.");
          window.location.href = "/pages/log-in.html";
          return null;
        }
        if (!res.ok) {
          return null;
        }
        return res.json();
      })
      .then(function (result) {
        if (!result || requestId !== latestRequestId) return;
        if (!result.success || !Array.isArray(result.data)) {
          renderEmpty("Load failed", "Please try again later.");
          return;
        }
        const typedItems = result.data.filter(function (item) {
          return item && item.type === activeType;
        });
        const unreadIds = typedItems
          .filter(function (item) { return Number(item.unread_count || 0) > 0; })
          .map(function (item) { return item.id; });
        markReadOnServer(unreadIds).finally(function () {
          if (requestId !== latestRequestId) return;
          currentItems = typedItems.map(function (item) {
            return Object.assign({}, item, { unread_count: 0 });
          });
          applySearchFilter();
          refreshCategoryBadges();
        });
      })
      .catch(function () {
        if (requestId !== latestRequestId) return;
        renderEmpty("Network error", "Please check backend service.");
      });
  }

  cards.forEach(function (card) {
    bindCardAccessibility(card);
    card.addEventListener("click", function (event) {
      event.preventDefault();
      const nextType = normalizeType(card.getAttribute("data-filter"));
      if (nextType === activeType) return;
      loadNotifications(nextType);
    });
  });

  function closeDetail() {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
  }

  closeBtn.addEventListener("click", closeDetail);
  overlay.addEventListener("click", function (event) {
    if (event.target === overlay) closeDetail();
  });

  if (searchInput) {
    searchInput.addEventListener("input", applySearchFilter);
  }

  const params = new URLSearchParams(window.location.search);
  loadNotifications(normalizeType(params.get("type") || "likes"));
  refreshCategoryBadges();
})();
