/**
 * cat-profile.js — Cat Creator Profile page logic (Member 2 / social module)
 *
 * Reads ?author= from the URL to display a creator's profile.
 * Handles follow / unfollow state with localStorage persistence.
 * Uses the backend API to look up user info when available,
 * and falls back to local data if the server is offline.
 */
(function () {

  // Read author name from the query string
  const params  = new URLSearchParams(window.location.search);
  const author  = params.get("author") || "Cat Lover";

  // DOM elements
  const avatarEl    = document.getElementById("avatar");
  const nameEl      = document.getElementById("name");
  const bioEl       = document.getElementById("bio");
  const followersEl = document.getElementById("followers");
  const followingEl = document.getElementById("following");
  const followBtn   = document.getElementById("followBtn");

  if (!avatarEl || !nameEl || !followBtn) return;

  // Display name and avatar initial
  nameEl.textContent = author;
  avatarEl.textContent = (author.trim()[0] || "C").toUpperCase();

  // localStorage keys scoped to this author
  const KEY_FOLLOWERS   = "catface_followers_"   + author;
  const KEY_FOLLOWING   = "catface_following_you";
  const KEY_IS_FOLLOWING = "catface_is_following_" + author;

  // Safe localStorage read helpers
  function getNumber(key, fallback) {
    try {
      const v = window.localStorage.getItem(key);
      if (v == null) return fallback;
      const n = parseInt(v, 10);
      return isNaN(n) ? fallback : n;
    } catch (e) {
      return fallback;
    }
  }

  function setNumber(key, value) {
    try { window.localStorage.setItem(key, String(value)); } catch (e) {}
  }

  // Load persisted state (or generate a random starting follower count for demo)
  let followers   = getNumber(KEY_FOLLOWERS,  Math.floor(Math.random() * 900) + 100);
  let following   = getNumber(KEY_FOLLOWING,  0);
  let isFollowing = false;

  try {
    isFollowing = window.localStorage.getItem(KEY_IS_FOLLOWING) === "1";
  } catch (e) {
    isFollowing = false;
  }

  // Update the DOM to match current state
  function render() {
    followersEl.textContent = followers;
    if (followingEl) followingEl.textContent = following;
    if (isFollowing) {
      followBtn.textContent = "Following";
      followBtn.classList.add("is-following");
    } else {
      followBtn.textContent = "Follow";
      followBtn.classList.remove("is-following");
    }
  }

  // Toggle follow / unfollow
  followBtn.addEventListener("click", function () {
    isFollowing = !isFollowing;
    if (isFollowing) {
      followers += 1;
      following += 1;
    } else {
      followers = Math.max(0, followers - 1);
      following = Math.max(0, following - 1);
    }
    setNumber(KEY_FOLLOWERS, followers);
    setNumber(KEY_FOLLOWING, following);
    try {
      window.localStorage.setItem(KEY_IS_FOLLOWING, isFollowing ? "1" : "0");
    } catch (e) {}
    render();
  });

  // Try to fetch real user bio from backend (non-blocking)
  async function tryLoadUserFromApi() {
    if (typeof API_BASE_URL === "undefined") return;
    try {
      const res    = await fetch(API_BASE_URL + "/users?username=" + encodeURIComponent(author));
      const result = await res.json();
      if (!result.success || !result.data) return;
      const user = Array.isArray(result.data) ? result.data[0] : result.data;
      if (!user) return;
      if (bioEl && user.bio) bioEl.textContent = user.bio;
    } catch (err) {
      // Backend offline — silently use demo data
    }
  }

  render();
  tryLoadUserFromApi();

})();
