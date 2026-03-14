/**
 * 通知页逻辑（Member 3）：从 GET /api/notifications 拉取列表并渲染，点击条目打开详情
 * 依赖：config.js（API_BASE_URL, getAuthHeaders）
 */
(function () {
  var API_BASE = typeof API_BASE_URL !== "undefined" ? API_BASE_URL : "";
  var getAuth = typeof getAuthHeaders === "function" ? getAuthHeaders : function () { return { "Content-Type": "application/json" }; };

  var listEl = document.getElementById("notificationList");
  var overlay = document.getElementById("detail-overlay");
  var closeBtn = document.getElementById("detail-close-btn");
  var detailAvatar = document.getElementById("detail-avatar");
  var detailTitle = document.getElementById("detail-title");
  var detailMeta = document.getElementById("detail-meta");
  var detailBodyText = document.getElementById("detail-body-text");

  function setListContent(html) {
    if (listEl) listEl.innerHTML = html;
  }

  function renderEmpty() {
    setListContent(
      '<div class="message-list-empty" style="padding: 32px 20px; text-align: center; color: #999; font-size: 14px;">暂无通知</div>'
    );
  }

  function renderLoading() {
    setListContent(
      '<div class="message-list-loading" style="padding: 32px 20px; text-align: center; color: #999; font-size: 14px;">加载中…</div>'
    );
  }

  function escapeHtml(str) {
    if (!str) return "";
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderItem(n) {
    var title = escapeHtml(n.title || "通知");
    var detail = escapeHtml(n.detail || "");
    var category = escapeHtml(n.category || "");
    var time = escapeHtml(n.time || "");
    var avatar = n.avatar_url || "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=120&h=120&q=80";
    var snippet = escapeHtml((n.snippet || n.detail || "").slice(0, 80));
    var unread = typeof n.unread_count === "number" ? n.unread_count : 0;
    return (
      '<article class="message-item" data-type="' + (n.type || "social") + '" data-title="' + title + '" data-detail="' + detail + '" data-category="' + category + '" data-time="' + time + '">' +
      '<img class="message-avatar" src="' + avatar + '" alt="">' +
      '<div class="message-main">' +
      '<div class="message-top"><div class="message-name">' + title + '</div><div class="message-time">' + time + '</div></div>' +
      '<div class="message-snippet">' + snippet + '</div>' +
      '<div class="message-meta"><span class="message-tag">' + category + '</span></div>' +
      '</div>' +
      (unread > 0 ? '<span class="message-unread">' + unread + '</span>' : '') +
      '</article>'
    );
  }

  function bindItemClicks() {
    if (!listEl || !overlay || !detailAvatar || !detailTitle || !detailMeta || !detailBodyText) return;
    var items = listEl.querySelectorAll(".message-item");
    items.forEach(function (item) {
      item.addEventListener("click", function () {
        var avatar = item.querySelector(".message-avatar");
        detailAvatar.src = avatar ? avatar.src : "";
        detailTitle.textContent = item.getAttribute("data-title") || "";
        detailMeta.textContent = (item.getAttribute("data-category") || "") + " · " + (item.getAttribute("data-time") || "");
        detailBodyText.textContent = item.getAttribute("data-detail") || "";
        overlay.classList.add("open");
        overlay.setAttribute("aria-hidden", "false");
      });
    });
  }

  function loadNotifications() {
    if (!listEl) return;
    renderLoading();
    if (!API_BASE) {
      renderEmpty();
      return;
    }
    fetch(API_BASE + "/notifications", { headers: getAuth() })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          setListContent(result.data.map(renderItem).join(""));
          bindItemClicks();
        } else {
          renderEmpty();
        }
      })
      .catch(function () {
        renderEmpty();
      });
  }

  // 分类卡片：点击切换 active
  var cards = document.querySelectorAll(".notice-card");
  cards.forEach(function (card) {
    card.addEventListener("click", function () {
      cards.forEach(function (c) { c.classList.remove("active"); });
      card.classList.add("active");
    });
  });

  if (closeBtn) closeBtn.addEventListener("click", closeDetail);
  if (overlay) overlay.addEventListener("click", function (e) { if (e.target === overlay) closeDetail(); });

  function closeDetail() {
    if (overlay) {
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
    }
  }

  loadNotifications();
})();
