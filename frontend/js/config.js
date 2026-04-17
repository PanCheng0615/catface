// frontend/js/config.js
// 在其他页面 JS 之前引入：<script src="../js/config.js"></script>
// 所有人在调用后端时，必须引入这个文件，使用 API_BASE_URL

const API_BASE_URL = "http://localhost:3000/api";

function getToken() {
  return typeof localStorage !== "undefined" ? localStorage.getItem("catface_token") : null;
}

function getCurrentUser() {
  if (typeof localStorage === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("catface_user") || "null");
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
  }
  if (typeof window !== "undefined") window.location.href = "/pages/log-in.html";
}

/** Member4：社区等页面用于判断是否已登录 */
function isLoggedIn() {
  const token = getToken();
  const user = getCurrentUser();
  return !!(token && user && (user.id || user.username || user.email));
}

function getAuthHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    Authorization: token ? "Bearer " + token : ""
  };
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
