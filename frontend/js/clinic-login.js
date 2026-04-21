(function () {
  const API = window.API_BASE_URL || "http://localhost:3000/api";
  const form = document.getElementById("clinic-login-form");
  const emailInput = document.getElementById("clinic-email");
  const passwordInput = document.getElementById("clinic-password");
  const statusBox = document.getElementById("clinic-login-status");
  const submitBtn = document.getElementById("clinic-login-submit");

  if (!form || !emailInput || !passwordInput || !statusBox || !submitBtn) {
    return;
  }

  function showStatus(message, type) {
    statusBox.textContent = message || "";
    statusBox.className = "status-msg" + (message ? " " + type : "");
  }

  function clearRescueSession() {
    localStorage.removeItem("catface_org_token");
    localStorage.removeItem("catface_org_profile");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showStatus("Please enter clinic email and password.", "error");
      return;
    }

    submitBtn.disabled = true;
    showStatus("Signing in...", "success");

    try {
      const response = await fetch(`${API}/auth/org/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const payload = await response.json().catch(function () {
        return {};
      });

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Clinic login failed.");
      }

      const organization = payload.data && payload.data.organization ? payload.data.organization : null;
      if (!organization || organization.type !== "clinic") {
        clearRescueSession();
        throw new Error("This account is not a clinic organization.");
      }

      localStorage.setItem("catface_org_token", payload.data.token);
      localStorage.setItem("catface_token", payload.data.token);
      localStorage.setItem("catface_org_profile", JSON.stringify(organization));

      showStatus("Login successful. Redirecting...", "success");
      window.location.href = "clinic-portal.html";
    } catch (error) {
      showStatus(error.message || "Clinic login failed.", "error");
    } finally {
      submitBtn.disabled = false;
    }
  }

  form.addEventListener("submit", handleSubmit);
})();
