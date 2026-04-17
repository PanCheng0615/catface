(function () {
  const API_BASE_URL = window.API_BASE_URL || "http://localhost:3000/api";
  const form = document.getElementById("org-login-form");
  const emailInput = document.getElementById("org-email");
  const passwordInput = document.getElementById("org-password");
  const statusBox = document.getElementById("org-login-status");

  if (!form || !emailInput || !passwordInput || !statusBox) {
    return;
  }

  function showStatus(message, type) {
    statusBox.textContent = message;
    statusBox.className = "status show " + type;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showStatus("Please enter both organization email and password.", "error");
      return;
    }

    showStatus("Signing in...", "success");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/org/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Organization login failed.");
      }

      localStorage.setItem("catface_token", result.data.token);
      localStorage.setItem("catface_org_token", result.data.token);
      localStorage.setItem("catface_org_profile", JSON.stringify(result.data.organization));

      showStatus("Login successful. Redirecting to rescue dashboard...", "success");

      window.setTimeout(function () {
        window.location.href = "rescue-dashboard.html";
      }, 700);
    } catch (error) {
      showStatus(error.message, "error");
    }
  }

  form.addEventListener("submit", handleSubmit);
})();
