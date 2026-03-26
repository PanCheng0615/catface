// frontend/js/config.js
// 所有人在调用后端时，必须引入这个文件，使用 API_BASE_URL
const API_BASE_URL = "http://localhost:3000/api";

function getToken() {
  return typeof localStorage !== "undefined" ? localStorage.getItem("catface_token") : null;
}

function setToken(token) {
  if (typeof localStorage !== "undefined") localStorage.setItem("catface_token", token);
}

function logout() {
  if (typeof localStorage !== "undefined") localStorage.removeItem("catface_token");
  if (typeof window !== "undefined") window.location.href = "/pages/log-in.html";
}

function getAuthHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    "Authorization": token ? "Bearer " + token : ""
  };
}
