// frontend/js/config.js
// 所有人在调用后端时，必须引入这个文件，使用 API_BASE_URL
// 在其他所有 JS 文件之前引入：<script src="../js/config.js"></script>

const API_BASE_URL = "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("catface_token");
}

function setToken(token) {
  localStorage.setItem("catface_token", token);
}

function logout() {
  localStorage.removeItem("catface_token");
  window.location.href = "/pages/log-in.html";
}

function isLoggedIn() {
  return !!getToken();
}

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getToken()}`
  };
}
