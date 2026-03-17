/**
 * config.js — Frontend API configuration (shared by all members)
 *
 * Provides the base API URL and auth-header helpers used across every page.
 * Change API_BASE_URL here when deploying to a production server.
 */
const API_BASE_URL = 'http://localhost:3000/api';

/** Returns the JWT stored in localStorage, or null if not logged in. */
function getToken() {
  return localStorage.getItem('catface_token');
}

/** Persists a JWT after a successful login or registration. */
function setToken(token) {
  localStorage.setItem('catface_token', token);
}

/** Clears the JWT and redirects to the login page. */
function logout() {
  localStorage.removeItem('catface_token');
  window.location.href = 'log-in.html';
}

/**
 * Returns headers for authenticated fetch calls.
 * Use this for every request that requires a logged-in user.
 */
function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + getToken()
  };
}
