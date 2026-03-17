/**
 * 前端 API 配置（Member 4 维护，全员使用）
 */
const API_BASE_URL = 'http://localhost:3000/api';

function getToken() {
  return localStorage.getItem('catface_token');
}

function setToken(token) {
  localStorage.setItem('catface_token', token);
}

function logout() {
  localStorage.removeItem('catface_token');
  window.location.href = 'log-in.html';
}

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + getToken()
  };
}
