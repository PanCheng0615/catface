// frontend/js/config.js
// 所有人在调用后端时，必须引入这个文件，使用 API_BASE_URL
// 在其他页面 JS 之前引入：<script src="../js/config.js"></script>

function getApiBaseUrl() {
  if (typeof window === "undefined") return "http://localhost:3000/api";
  var loc = window.location;
  var port = loc.port || (loc.protocol === "https:" ? "443" : "80");
  return loc.protocol + "//" + loc.hostname + (port ? ":" + port : "") + "/api";
}

const API_BASE_URL = getApiBaseUrl();

function getToken() {
  return typeof localStorage !== "undefined" ? localStorage.getItem("catface_token") : null;
}

function getOrgToken() {
  return typeof localStorage !== "undefined" ? localStorage.getItem("catface_org_token") : null;
}

function getCurrentUser() {
  if (typeof localStorage === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("catface_user") || "null");
  } catch (e) {
    return null;
  }
}

function getOrgProfile() {
  if (typeof localStorage === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("catface_org_profile") || "null");
  } catch (e) {
    return null;
  }
}

function setToken(token) {
  if (typeof localStorage !== "undefined") localStorage.setItem("catface_token", token);
}

function logout() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("catface_token");
    localStorage.removeItem("catface_user");
    localStorage.removeItem("catface_org_token");
    localStorage.removeItem("catface_org_profile");
  }
  if (typeof window !== "undefined") window.location.href = "/pages/log-in.html";
}

/** Member4：社区等页面用于判断是否已登录 */
function isLoggedIn() {
  const token = getToken();
  const user = getCurrentUser();
  return !!(token && user && (user.id || user.username || user.email));
}

function isOrgLoggedIn() {
  const token = getOrgToken() || getToken();
  const org = getOrgProfile();
  return !!(token && org && (org.id || org.email || org.name));
}

function getAuthHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    Authorization: token ? "Bearer " + token : ""
  };
}

function getOrgAuthHeaders() {
  const token = getOrgToken() || getToken();
  return {
    "Content-Type": "application/json",
    Authorization: token ? "Bearer " + token : ""
  };
}

function setCurrentUser(user) {
  if (typeof localStorage === "undefined") return user || null;
  if (!user) {
    localStorage.removeItem("catface_user");
    return null;
  }
  localStorage.setItem("catface_user", JSON.stringify(user));
  return user;
}

function mergeCurrentUser(partialUser) {
  const current = getCurrentUser() || {};
  const next = Object.assign({}, current, partialUser || {});
  return setCurrentUser(next);
}

function applyAvatarToElement(el, avatarUrl, fallbackText) {
  if (!el) return;
  const label = String(fallbackText || "U").trim().charAt(0).toUpperCase() || "U";
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

function refreshCurrentUserAvatarUi(user) {
  if (typeof document === "undefined") return;
  const currentUser = user || getCurrentUser();
  const displayName =
    (currentUser && (currentUser.display_name || currentUser.username || currentUser.email)) || "User";
  const avatarUrl = currentUser && currentUser.avatar_url ? currentUser.avatar_url : "";
  document
    .querySelectorAll(".nav-hero-avatar, .nav-avatar, .composer-avatar, #acctAvatarBig, #navHeroAvatar, #navUserAvatar")
    .forEach(function (el) {
      applyAvatarToElement(el, avatarUrl, displayName);
    });
}

function syncCurrentUserProfile() {
  if (typeof fetch !== "function" || !getToken()) {
    const current = getCurrentUser();
    refreshCurrentUserAvatarUi(current);
    return Promise.resolve(current);
  }
  return fetch(API_BASE_URL + "/users/me", {
    method: "GET",
    headers: getAuthHeaders()
  })
    .then(function (res) {
      return res.json().then(function (payload) {
        return { ok: res.ok, payload: payload };
      });
    })
    .then(function (response) {
      const payload = response && response.payload ? response.payload : {};
      if (!response || !response.ok || !payload.success || !payload.data) {
        const current = getCurrentUser();
        refreshCurrentUserAvatarUi(current);
        return current;
      }
      const mergedUser = mergeCurrentUser(payload.data);
      refreshCurrentUserAvatarUi(mergedUser);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("catface:user-profile-sync", { detail: mergedUser }));
      }
      return mergedUser;
    })
    .catch(function () {
      const current = getCurrentUser();
      refreshCurrentUserAvatarUi(current);
      return current;
    });
}

function requireLoginForNavigation(targetPath, message) {
  if (isLoggedIn()) {
    if (typeof window !== "undefined" && targetPath) window.location.href = targetPath;
    return true;
  }
  if (typeof window !== "undefined") {
    window.alert(message || "Please log in first");
    window.location.href = "/pages/log-in.html";
  }
  return false;
}

if (typeof window !== "undefined") {
  const bootstrapCurrentUserUi = function () {
    refreshCurrentUserAvatarUi(getCurrentUser());
    const path = String((window.location && window.location.pathname) || "").toLowerCase();
    const isAccountPage = path.indexOf("/pages/account.html") >= 0;
    if (getToken() && !isAccountPage) {
      syncCurrentUserProfile();
    }
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrapCurrentUserUi, { once: true });
  } else {
    bootstrapCurrentUserUi();
  }
}
