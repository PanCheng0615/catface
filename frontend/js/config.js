// frontend/js/config.js
// 在其他页面 JS 之前引入：<script src="../js/config.js"></script>
// 所有人在调用后端时，必须引入这个文件，使用 API_BASE_URL

function getApiBaseUrl() {
  if (typeof window === "undefined") return "http://localhost:3000/api";
  var loc = window.location;
  var port = loc.port || (loc.protocol === "https:" ? "443" : "80");
  return loc.protocol + "//" + loc.hostname + (port ? ":" + port : "") + "/api";
}
var API_BASE_URL = getApiBaseUrl();

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
    localStorage.removeItem("catface_clinic_org_profile");
  }
  if (typeof window !== "undefined") window.location.href = "/pages/log-in.html";
}

function setClinicOrgProfile(orgProfile) {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem("catface_clinic_org_profile", JSON.stringify(orgProfile));
    } catch (e) {}
  }
}

function getClinicOrgProfile() {
  if (typeof localStorage === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("catface_clinic_org_profile") || "null");
  } catch (e) {
    return null;
  }
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
