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
  const READ_KEY = "catface_notifications_read_ids";
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

  function loadReadMap() {
    try {
      const raw = window.localStorage.getItem(READ_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveReadMap(map) {
    try {
      window.localStorage.setItem(READ_KEY, JSON.stringify(map || {}));
    } catch (e) {}
  }

  function markAsRead(id) {
    const key = String(id || "");
    if (!key) return;
    const map = loadReadMap();
    map[key] = 1;
    saveReadMap(map);
  }

  function isReadByMap(id, map) {
    const key = String(id || "");
    if (!key) return false;
    return !!(map && map[key]);
  }

  function withReadState(items) {
    const map = loadReadMap();
    return (Array.isArray(items) ? items : []).map(function (item) {
      const cloned = Object.assign({}, item);
      if (isReadByMap(cloned.id, map)) cloned.unread_count = 0;
      return cloned;
    });
  }

  function markItemsAsRead(items) {
    const map = loadReadMap();
    let changed = false;
    (Array.isArray(items) ? items : []).forEach(function (item) {
      const id = String(item && item.id ? item.id : "");
      if (!id || map[id]) return;
      map[id] = 1;
      changed = true;
    });
    if (changed) saveReadMap(map);
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
          (n.unread_count
            ? '<span class="message-unread">' + Number(n.unread_count) + "</span>"
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
        markAsRead(data.id);
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

  function fetchTypeItems(type) {
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
        return result.data.filter(function (item) {
          return item && item.type === type;
        });
      })
      .catch(function () {
        return [];
      });
  }

  function refreshCategoryBadges() {
    if (!getToken()) {
      TYPES.forEach(function (t) { setBadgeCount(t, 0); });
      return;
    }
    Promise.all(TYPES.map(fetchTypeItems)).then(function (rows) {
      const readMap = loadReadMap();
      TYPES.forEach(function (type, idx) {
        const arr = Array.isArray(rows[idx]) ? rows[idx] : [];
        const unread = arr.reduce(function (acc, item) {
          if (!item || !item.id) return acc;
          return isReadByMap(item.id, readMap) ? acc : acc + 1;
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
        markItemsAsRead(typedItems);
        currentItems = withReadState(typedItems);
        applySearchFilter();
        refreshCategoryBadges();
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
