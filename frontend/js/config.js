// frontend/js/config.js
// Member 4 维护 — 全员必须引用此文件，不得在其他文件里硬编码 API 地址

const API_BASE_URL = "http://localhost:3000/api";

// 读取 Token
function getToken() {
  return localStorage.getItem("catface_token");
}

// 保存 Token（登录成功后调用）
function setToken(token) {
  localStorage.setItem("catface_token", token);
}

// 退出登录
function logout() {
  localStorage.removeItem("catface_token");
  window.location.href = "/frontend/pages/log-in.html";
}

// 生成带 Token 的请求头（需要登录的接口使用）
function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getToken()}`
  };
}

// 登录状态守卫 — 在需要登录才能访问的页面顶部调用
// 用法：requireLogin();
function requireLogin() {
  if (!getToken()) {
    window.location.href = "/frontend/pages/log-in.html";
  }
}
