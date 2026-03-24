window.__CATFACE_EXTERNAL_RESCUE__ = true;

(function () {
  const API_BASE_URL = window.API_BASE_URL || "http://localhost:3000/api";
  const menuButtons = document.querySelectorAll(".menu-btn");
  const sections = document.querySelectorAll(".section");
  const dashboardSection = document.getElementById("dashboard");
  const applicationSection = document.getElementById("application-review");
  const catListBody = document.getElementById("cat-list-body");
  const addCatToggleBtn = document.getElementById("add-cat-toggle-btn");
  const catFormPanel = document.getElementById("cat-form-panel");
  const catFormTitle = document.getElementById("cat-form-title");
  const catFormDescription = document.getElementById("cat-form-description");
  const catFormCancelBtn = document.getElementById("cat-form-cancel-btn");
  const catFormSaveBtn = document.getElementById("cat-form-save-btn");
  const catNameInput = document.getElementById("cat-name");
  const catIdInput = document.getElementById("cat-id");
  const openFaceIdBtn = document.getElementById("open-face-id-btn");
  const catGenderInput = document.getElementById("cat-gender");
  const catBreedInput = document.getElementById("cat-breed");
  const catAgeInput = document.getElementById("cat-age");
  const catStatusInput = document.getElementById("cat-status");
  const catLocationInput = document.getElementById("cat-location");
  const catHealthInput = document.getElementById("cat-health");
  const catPersonalityInput = document.getElementById("cat-personality");
  const catNotesInput = document.getElementById("cat-notes");
  const catPhotoInput = document.getElementById("cat-photo-input");
  const catPhotoPreview = document.getElementById("cat-photo-preview");
  const catPhotoPlaceholder = document.getElementById("cat-photo-placeholder");
  const catProfileOverlay = document.getElementById("cat-profile-overlay");
  const catProfileCloseBtn = document.getElementById("cat-profile-close-btn");
  const catProfileAvatar = document.getElementById("cat-profile-avatar");
  const catProfileName = document.getElementById("cat-profile-name");
  const catProfileSubtitle = document.getElementById("cat-profile-subtitle");
  const catProfileStatus = document.getElementById("cat-profile-status");
  const catProfileId = document.getElementById("cat-profile-id");
  const catProfileNameValue = document.getElementById("cat-profile-name-value");
  const catProfileBreed = document.getElementById("cat-profile-breed");
  const catProfileGender = document.getElementById("cat-profile-gender");
  const catProfileAge = document.getElementById("cat-profile-age");
  const catProfileBirthday = document.getElementById("cat-profile-birthday");
  const catProfilePersonality = document.getElementById("cat-profile-personality");
  const catProfileSpayed = document.getElementById("cat-profile-spayed");
  const catProfileVaccinationStatus = document.getElementById("cat-profile-vaccination-status");
  const catProfileFoundLocation = document.getElementById("cat-profile-found-location");
  const catProfileAllergyHistory = document.getElementById("cat-profile-allergy-history");
  const catProfileAdoptionStatus = document.getElementById("cat-profile-adoption-status");
  const catProfileTags = document.getElementById("cat-profile-tags");
  const catProfileSummary = document.getElementById("cat-profile-summary");
  const catProfilePhoto = document.getElementById("cat-profile-photo");
  const catProfilePhotoEmpty = document.getElementById("cat-profile-photo-empty");
  const applicationDetailOverlay = document.getElementById("application-detail-overlay");
  const applicationCloseBtn = document.getElementById("application-close-btn");
  const applicationContactBtn = document.getElementById("application-contact-btn");
  const applicationAvatar = document.getElementById("application-avatar");
  const applicationTitle = document.getElementById("application-title");
  const applicationSubtitle = document.getElementById("application-subtitle");
  const applicationStatus = document.getElementById("application-status");
  const applicationApplicant = document.getElementById("application-applicant");
  const applicationContact = document.getElementById("application-contact");
  const applicationExperience = document.getElementById("application-experience");
  const applicationSubmitted = document.getElementById("application-submitted");
  const applicationCat = document.getElementById("application-cat");
  const applicationHome = document.getElementById("application-home");
  const applicationSchedule = document.getElementById("application-schedule");
  const applicationNote = document.getElementById("application-note");
  const applicationReason = document.getElementById("application-reason");
  const faceIdOverlay = document.getElementById("face-id-overlay");
  const faceIdCloseBtn = document.getElementById("face-id-close-btn");
  const faceIdCancelBtn = document.getElementById("face-id-cancel-btn");
  const faceIdImageInput = document.getElementById("face-id-image-input");
  const facePreviewImage = document.getElementById("face-preview-image");
  const facePreviewPlaceholder = document.getElementById("face-preview-placeholder");
  const generatedFaceId = document.getElementById("generated-face-id");
  const useFaceIdBtn = document.getElementById("use-face-id-btn");
  const notifOverlay = document.getElementById("notif-overlay");
  const notifCloseBtn = document.getElementById("notif-close-btn");
  const notifModalAvatar = document.getElementById("notif-modal-avatar");
  const notifModalTitle = document.getElementById("notif-modal-title");
  const notifModalSubtitle = document.getElementById("notif-modal-subtitle");
  const notifConversation = document.getElementById("notif-conversation");
  const notifMessageInput = document.getElementById("notif-message-input");
  const notifImageInput = document.getElementById("notif-image-input");
  const notifImagePreview = document.getElementById("notif-image-preview");
  const notifSendBtn = document.getElementById("notif-send-btn");
  const notifList = document.querySelector(".notif-list");
  const notifSearch = document.querySelector(".notif-search");
  const notifCountLabel = document.getElementById("notif-count-label");
  const orgLoginLink = document.getElementById("org-login-link");
  const orgLogoutBtn = document.getElementById("org-logout-btn");
  const orgSessionName = document.getElementById("org-session-name");

  if (!dashboardSection || !applicationSection || !notifList) return;

  const statCards = Array.from(dashboardSection.querySelectorAll("[data-stat]"));
  const recentRecordsTableBody = document.getElementById("dashboard-recent-records");
  const dashboardFunnel = document.getElementById("dashboard-funnel");
  const dashboardTrend = document.getElementById("dashboard-trend");
  const dashboardStatusBreakdown = document.getElementById("dashboard-status-breakdown");
  const dashboardBreedPreference = document.getElementById("dashboard-breed-preference");
  const dashboardAttentionList = document.getElementById("dashboard-attention-list");
  const applicationTableBody = applicationSection.querySelector("table tbody");

  let catOrder = ["CAT-001", "CAT-002", "CAT-003"];
  let catProfiles = {
    "CAT-001": {
      id: "CAT-001",
      avatarText: "O",
      avatarClass: "",
      name: "Orange",
      breed: "Domestic Shorthair",
      status: "Available",
      gender: "Female",
      age: "1 year",
      birthday: "2024-02-14",
      personality: "Friendly and playful",
      spayedNeutered: "Yes",
      vaccinationStatus: "Core vaccines completed",
      foundLocation: "Kowloon City",
      allergyHistory: "No known allergies",
      tags: ["Friendly", "Indoor only", "Playful"],
      summary: "Orange is a social rescue cat who adapts well to indoor homes.",
      health: "Vaccinated and neutered",
      photo: ""
    },
    "CAT-002": {
      id: "CAT-002",
      avatarText: "S",
      avatarClass: "blue",
      name: "Shadow",
      breed: "Tuxedo",
      status: "Pending",
      gender: "Male",
      age: "3 years",
      birthday: "2022-09-03",
      personality: "Quiet and observant",
      spayedNeutered: "Yes",
      vaccinationStatus: "Vaccinated, booster pending",
      foundLocation: "Sha Tin district",
      allergyHistory: "Mild chicken sensitivity",
      tags: ["Calm", "Independent", "Low-noise home"],
      summary: "Shadow is currently in the application review stage.",
      health: "Vaccinated, under observation",
      photo: ""
    },
    "CAT-003": {
      id: "CAT-003",
      avatarText: "W",
      avatarClass: "pink",
      name: "Whiskers",
      breed: "Senior Cat",
      status: "Reserved",
      gender: "Female",
      age: "8 years",
      birthday: "2017-06-11",
      personality: "Gentle and calm",
      spayedNeutered: "Yes",
      vaccinationStatus: "Senior vaccine review needed",
      foundLocation: "Tsuen Wan district",
      allergyHistory: "Sensitive to dust",
      tags: ["Senior cat", "Quiet", "Stable routine"],
      summary: "Whiskers is a senior rescue cat who thrives in peaceful homes.",
      health: "Senior check needed",
      photo: ""
    }
  };

  let localApplications = [
    {
      id: "APP-102",
      status: "pending",
      user: {
        display_name: "Jason Lee",
        email: "jason@email.com"
      },
      cat: {
        name: "Tiger",
        breed: "Tabby"
      },
      created_at: "2026-03-07T12:00:00.000Z",
      message: "Applicant has previous cat experience and asked about vaccinations."
    },
    {
      id: "APP-103",
      status: "pending",
      user: {
        display_name: "Grace Ho",
        email: "grace@email.com"
      },
      cat: {
        name: "Whiskers",
        breed: "Senior Cat"
      },
      created_at: "2026-03-06T12:00:00.000Z",
      message: "Applicant prefers a quiet home and requested interview scheduling."
    }
  ];

  let notificationThreads = [
    {
      id: "mock-jason",
      title: "Jason Lee",
      subtitle: "Application Review",
      snippet: "Asked whether Tiger has completed all vaccinations.",
      time: "6:01 PM",
      unread: true,
      avatarText: "JL",
      avatarClass: "blue",
      messages: [
        { sender: "user", text: "I would like to know whether Tiger has completed all vaccinations.", time: "5:42 PM", images: [] },
        { sender: "org", text: "Tiger has completed the rescue vaccination set.", time: "5:48 PM", images: [] }
      ]
    },
    {
      id: "mock-grace",
      title: "Grace Ho",
      subtitle: "Interview Needed",
      snippet: "Requested an interview time for Whiskers.",
      time: "Yesterday",
      unread: true,
      avatarText: "GH",
      avatarClass: "pink",
      messages: [
        { sender: "user", text: "I would like to schedule an interview for Whiskers.", time: "Yesterday", images: [] }
      ]
    }
  ];

  let activeThreadId = null;
  let editingCatId = null;
  let activeApplicationId = null;
  let pendingImages = [];
  let currentGeneratedFaceId = "";
  let currentCatPhoto = "";
  let usingRemoteNotifications = false;

  function getToken() {
    const orgToken = localStorage.getItem("catface_org_token");
    if (orgToken) {
      return orgToken;
    }

    if (typeof window.getToken === "function") {
      return window.getToken();
    }

    return localStorage.getItem("catface_token");
  }

  function getOrganizationProfile() {
    try {
      const raw = localStorage.getItem("catface_org_profile");
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function getAuthHeaders() {
    if (typeof window.getAuthHeaders === "function") {
      return window.getAuthHeaders();
    }

    const token = getToken();
    return {
      "Content-Type": "application/json",
      Authorization: token ? "Bearer " + token : ""
    };
  }

  async function apiRequest(path, options) {
    const response = await fetch(API_BASE_URL + path, options);
    const result = await response.json().catch(function () {
      return { success: false, message: "Invalid server response" };
    });

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Request failed");
    }

    return result.data;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value || "";
    return date.toISOString().slice(0, 10);
  }

  function formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value || "";
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function formatAgeFromMonths(ageMonths) {
    if (typeof ageMonths !== "number" || Number.isNaN(ageMonths)) {
      return "Unknown";
    }

    if (ageMonths < 12) {
      return `${ageMonths} month${ageMonths === 1 ? "" : "s"}`;
    }

    const years = Math.floor(ageMonths / 12);
    const months = ageMonths % 12;
    if (!months) {
      return `${years} year${years === 1 ? "" : "s"}`;
    }

    return `${years} year${years === 1 ? "" : "s"} ${months} month${months === 1 ? "" : "s"}`;
  }

  function buildDashboardCatId(cat) {
    return `CAT-${String(cat.id).replace(/-/g, "").slice(0, 6).toUpperCase()}`;
  }

  function extractDescriptionValue(description, label) {
    if (!description) return "";

    const line = String(description)
      .split("\n")
      .find(function (item) {
        return item.indexOf(label) === 0;
      });

    return line ? line.slice(label.length).trim() : "";
  }

  function mapCatRecordToProfile(cat) {
    const tags = Array.isArray(cat.tags)
      ? cat.tags.map(function (tag) {
          return tag.tag;
        })
      : [];

    const vaccineInfo = extractDescriptionValue(cat.description, "疫苗:");
    const neuteredInfo = extractDescriptionValue(cat.description, "絕育:");
    const personalityInfo = extractDescriptionValue(cat.description, "性格:");
    const remarkInfo = extractDescriptionValue(cat.description, "備註:");

    return {
      id: cat.id,
      displayId: buildDashboardCatId(cat),
      avatarText: (cat.name || "C").charAt(0).toUpperCase(),
      avatarClass: getAvatarClassFromStatus(cat.is_available ? "Available" : "Completed"),
      name: cat.name || "Unnamed cat",
      breed: cat.breed || cat.color || "Unknown",
      status: cat.is_available ? "Available" : "Completed",
      gender: cat.gender || "Unknown",
      age: formatAgeFromMonths(cat.age_months),
      birthday: "Unknown",
      personality: personalityInfo || remarkInfo || "Not specified",
      spayedNeutered: neuteredInfo || "Not provided",
      vaccinationStatus: vaccineInfo || "Not provided",
      foundLocation: "Not provided",
      allergyHistory: "No allergy record",
      tags: tags.length ? tags : ["No tags yet"],
      summary: remarkInfo || personalityInfo || cat.description || "No summary available yet.",
      health: [vaccineInfo, neuteredInfo].filter(Boolean).join(" · ") || "Not provided",
      photo: cat.photo_url || ""
    };
  }

  function activateSection(targetId) {
    menuButtons.forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-target") === targetId);
    });

    sections.forEach(function (section) {
      section.classList.toggle("active", section.id === targetId);
    });
  }

  function getStatusTagClass(status) {
    if (status === "approved" || status === "Available" || status === "Completed") return "green";
    if (status === "pending" || status === "Pending" || status === "Under Review") return "blue";
    if (status === "rejected" || status === "Rejected") return "red";
    return "orange";
  }

  function getApplicationStatusLabel(status) {
    if (status === "approved") return "Approved";
    if (status === "rejected") return "Rejected";
    return "Pending";
  }

  function getAvatarClassFromStatus(status) {
    if (status === "Pending" || status === "pending") return "blue";
    if (status === "Reserved") return "pink";
    return "";
  }

  function getStageFromStatus(status) {
    if (status === "Pending") return "Application under review";
    if (status === "Reserved") return "Reserved for interview-approved adopter";
    return "Open for applications";
  }

  function openOverlay(overlay) {
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeOverlay(overlay) {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
  }

  function renderCatList() {
    catListBody.innerHTML = catOrder.map(function (catId) {
      const profile = catProfiles[catId];
      return [
        "<tr>",
        "  <td>" + escapeHtml(profile.displayId || profile.id) + "</td>",
        "  <td>" + escapeHtml(profile.name) + "</td>",
        "  <td>" + escapeHtml(profile.breed) + "</td>",
        "  <td>" + escapeHtml(profile.age) + "</td>",
        '  <td><span class="tag ' + getStatusTagClass(profile.status) + '">' + escapeHtml(profile.status) + "</span></td>",
        "  <td>" + escapeHtml(profile.health) + "</td>",
        '  <td class="mini-actions"><button class="mini-btn" type="button" data-cat-profile="' + escapeHtml(profile.id) + '">View</button><button class="mini-btn" type="button" data-cat-edit="' + escapeHtml(profile.id) + '">Edit</button></td>',
        "</tr>"
      ].join("");
    }).join("");
  }

  function collectCatFormPayload() {
    const name = catNameInput.value.trim();
    const displayId = catIdInput.value.trim();
    const breed = catBreedInput.value.trim();

    if (!name || !displayId || !breed) {
      window.alert("Please complete at least cat name, cat ID, and breed.");
      return null;
    }

    const tags = catPersonalityInput.value
      .split(",")
      .map(function (tag) {
        return tag.trim();
      })
      .filter(Boolean);

    return {
      name: name,
      breed: breed,
      gender: catGenderInput.value,
      age: catAgeInput.value.trim(),
      status: catStatusInput.value,
      location: catLocationInput.value.trim(),
      health: catHealthInput.value.trim(),
      personality: catPersonalityInput.value.trim(),
      notes: catNotesInput.value.trim(),
      photo_url: currentCatPhoto || "",
      tags: tags
    };
  }

  function resetCatForm() {
    editingCatId = null;
    currentCatPhoto = "";
    catFormTitle.textContent = "Add New Cat";
    catFormDescription.textContent = "Create a new cat account with rescue information, health summary, and adoption requirements.";
    catFormSaveBtn.textContent = "Save Cat Account";
    catNameInput.value = "";
    catIdInput.value = "";
    catIdInput.disabled = false;
    catGenderInput.value = "Male";
    catBreedInput.value = "";
    catAgeInput.value = "";
    catStatusInput.value = "Available";
    catLocationInput.value = "";
    catHealthInput.value = "";
    catPersonalityInput.value = "";
    catNotesInput.value = "";
    catPhotoInput.value = "";
    catPhotoPreview.src = "";
    catPhotoPreview.hidden = true;
    catPhotoPlaceholder.hidden = false;
  }

  function fillCatForm(profile) {
    editingCatId = profile.id;
    currentCatPhoto = profile.photo || "";
    catFormTitle.textContent = "Edit Cat Information";
    catFormDescription.textContent = "Update the selected cat account and save the latest rescue details.";
    catFormSaveBtn.textContent = "Save Changes";
    catNameInput.value = profile.name;
    catIdInput.value = profile.displayId || profile.id;
    catIdInput.disabled = true;
    catGenderInput.value = profile.gender;
    catBreedInput.value = profile.breed;
    catAgeInput.value = profile.age;
    catStatusInput.value = profile.status;
    catLocationInput.value = profile.foundLocation || "";
    catHealthInput.value = profile.health || "";
    catPersonalityInput.value = profile.tags.join(", ");
    catNotesInput.value = profile.summary;
    catPhotoPreview.src = currentCatPhoto || "";
    catPhotoPreview.hidden = !currentCatPhoto;
    catPhotoPlaceholder.hidden = Boolean(currentCatPhoto);
  }

  function setCatFormOpen(isOpen) {
    catFormPanel.classList.toggle("collapsed-panel", !isOpen);
    addCatToggleBtn.textContent = isOpen ? "Hide Form" : "Add New Cat";
  }

  function openCatProfile(catId) {
    const profile = catProfiles[catId];
    if (!profile) return;

    catProfileAvatar.className = "profile-avatar" + (profile.avatarClass ? " " + profile.avatarClass : "");
    catProfileAvatar.textContent = profile.avatarText;
    catProfileName.textContent = profile.name;
    catProfileSubtitle.textContent = (profile.displayId || profile.id) + " · " + profile.breed;
    catProfileStatus.textContent = profile.status;
    catProfileId.textContent = profile.displayId || profile.id;
    catProfileNameValue.textContent = profile.name;
    catProfileBreed.textContent = profile.breed;
    catProfileGender.textContent = profile.gender;
    catProfileAge.textContent = profile.age;
    catProfileBirthday.textContent = profile.birthday;
    catProfilePersonality.textContent = profile.personality;
    catProfileSpayed.textContent = profile.spayedNeutered;
    catProfileVaccinationStatus.textContent = profile.vaccinationStatus;
    catProfileFoundLocation.textContent = profile.foundLocation;
    catProfileAllergyHistory.textContent = profile.allergyHistory;
    catProfileAdoptionStatus.textContent = profile.status;
    catProfileTags.innerHTML = profile.tags.map(function (tag) {
      return '<span class="profile-tag">' + escapeHtml(tag) + "</span>";
    }).join("");
    catProfileSummary.textContent = profile.summary;
    if (profile.photo) {
      catProfilePhoto.src = profile.photo;
      catProfilePhoto.hidden = false;
      catProfilePhotoEmpty.hidden = true;
    } else {
      catProfilePhoto.src = "";
      catProfilePhoto.hidden = true;
      catProfilePhotoEmpty.hidden = false;
    }
    openOverlay(catProfileOverlay);
  }

  function generateFaceId() {
    const timePart = Date.now().toString().slice(-6);
    const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
    return "CAT-FR-" + timePart + "-" + randomPart;
  }

  function resetFaceRecognitionModal() {
    currentGeneratedFaceId = "";
    generatedFaceId.textContent = "Waiting for image upload";
    facePreviewImage.src = "";
    facePreviewImage.hidden = true;
    facePreviewPlaceholder.hidden = false;
    faceIdImageInput.value = "";
  }

  async function loadRescueCats() {
    const cats = await apiRequest("/rescue/cats", {
      method: "GET",
      headers: getAuthHeaders()
    });

    const nextProfiles = {};
    const nextOrder = [];

    cats.forEach(function (cat) {
      const profile = mapCatRecordToProfile(cat);
      nextProfiles[cat.id] = profile;
      nextOrder.push(cat.id);
    });

    if (nextOrder.length) {
      catProfiles = nextProfiles;
      catOrder = nextOrder;
    } else {
      catProfiles = {};
      catOrder = [];
    }

    renderCatList();
  }

  async function saveCatForm() {
    const payload = collectCatFormPayload();
    if (!payload) {
      return;
    }

    const isEditing = Boolean(editingCatId);
    const endpoint = isEditing ? `/rescue/cats/${editingCatId}` : "/rescue/cats";
    const method = isEditing ? "PUT" : "POST";

    catFormSaveBtn.disabled = true;
    catFormSaveBtn.textContent = isEditing ? "Saving..." : "Creating...";

    try {
      await apiRequest(endpoint, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      await loadRescueCats();
      setCatFormOpen(false);
      resetCatForm();
    } catch (error) {
      window.alert(`Save failed: ${error.message}`);
    } finally {
      catFormSaveBtn.disabled = false;
      catFormSaveBtn.textContent = isEditing ? "Save Changes" : "Save Cat Account";
    }
  }

  function renderStats(overview) {
    const values = {
      available_cats: overview.available_cats || 0,
      total_applications: overview.total_applications || 0,
      approval_rate: `${overview.approval_rate || 0}%`,
      completed_adoptions: overview.completed_adoptions || 0,
      active_conversations: overview.active_conversations || 0,
      avg_review_hours: `${overview.avg_review_hours || 0}h`
    };
    const notes = {
      available_cats: `${overview.pending_applications || 0} pending applications in queue`,
      total_applications: `${overview.active_conversations || 0} active conversations supporting follow-up`,
      approval_rate: `${overview.approved_applications || 0} approved out of ${overview.total_applications || 0} total applications`,
      completed_adoptions: `${overview.monthly_approved_applications || 0} approvals updated this month`,
      active_conversations: "Tracks current rescue-to-adopter communication load",
      avg_review_hours: "Average decision time for reviewed applications"
    };

    statCards.forEach(function (card) {
      const key = card.getAttribute("data-stat");
      const valueNode = card.querySelector(".stat-value");
      const noteNode = card.querySelector(".stat-note");
      if (valueNode) {
        valueNode.textContent = values[key] !== undefined ? values[key] : "0";
      }
      if (noteNode) {
        noteNode.textContent = notes[key] || "";
      }
    });
  }

  function renderFunnelChart(funnel) {
    if (!dashboardFunnel) return;

    const submitted = Math.max(funnel.submitted || 0, 1);
    const stages = [
      { key: "submitted", label: "Submitted", value: funnel.submitted || 0 },
      { key: "pending", label: "Pending", value: funnel.pending || 0 },
      { key: "approved", label: "Approved", value: funnel.approved || 0 },
      { key: "rejected", label: "Rejected", value: funnel.rejected || 0 }
    ];

    dashboardFunnel.innerHTML = stages.map(function (stage) {
      const percentage = Math.round((stage.value / submitted) * 100);
      return [
        '<div class="funnel-stage">',
        '  <div class="funnel-head">',
        '    <div class="funnel-title">' + escapeHtml(stage.label) + '</div>',
        '    <div class="funnel-value">' + escapeHtml(String(stage.value)) + ' <span class="metric-meta">(' + escapeHtml(String(percentage)) + '%)</span></div>',
        "  </div>",
        '  <div class="funnel-track"><div class="funnel-fill" style="width:' + percentage + '%;"></div></div>',
        "</div>"
      ].join("");
    }).join("");
  }

  function renderTrendChart(points) {
    if (!dashboardTrend) return;

    if (!Array.isArray(points) || !points.length) {
      dashboardTrend.innerHTML = '<div class="empty-state">No monthly trend data yet.</div>';
      return;
    }

    const maxValue = points.reduce(function (max, point) {
      return Math.max(max, point.applications || 0, point.approved || 0);
    }, 1);

    dashboardTrend.innerHTML = points.map(function (point) {
      const applicationHeight = Math.max(Math.round(((point.applications || 0) / maxValue) * 120), point.applications ? 12 : 6);
      const approvedHeight = Math.max(Math.round(((point.approved || 0) / maxValue) * 120), point.approved ? 12 : 6);
      return [
        '<div class="trend-col">',
        '  <div class="trend-bars">',
        '    <div class="trend-bar applications" style="height:' + applicationHeight + 'px;" title="Applications: ' + escapeHtml(String(point.applications || 0)) + '"></div>',
        '    <div class="trend-bar approved" style="height:' + approvedHeight + 'px;" title="Approved: ' + escapeHtml(String(point.approved || 0)) + '"></div>',
        "  </div>",
        '  <div class="trend-label">' + escapeHtml(point.month || "") + "</div>",
        '  <div class="trend-meta">App ' + escapeHtml(String(point.applications || 0)) + ' / Approved ' + escapeHtml(String(point.approved || 0)) + "</div>",
        "</div>"
      ].join("");
    }).join("");
  }

  function renderMetricRows(container, items, options) {
    if (!container) return;

    if (!Array.isArray(items) || !items.length) {
      container.innerHTML = '<div class="empty-state">No analytics data yet.</div>';
      return;
    }

    const maxValue = items.reduce(function (max, item) {
      return Math.max(max, item.count || 0);
    }, 1);

    container.innerHTML = items.map(function (item) {
      const width = Math.round(((item.count || 0) / maxValue) * 100);
      return [
        '<div class="metric-row">',
        '  <div class="metric-head">',
        '    <div class="metric-title">' + escapeHtml(options.getTitle(item)) + '</div>',
        '    <div class="metric-value">' + escapeHtml(String(item.count || 0)) + "</div>",
        "  </div>",
        '  <div class="metric-track"><div class="metric-fill" style="width:' + width + '%;"></div></div>',
        options.getMeta
          ? '  <div class="metric-meta">' + escapeHtml(options.getMeta(item)) + "</div>"
          : "",
        "</div>"
      ].join("");
    }).join("");
  }

  function renderStatusBreakdown(items) {
    renderMetricRows(dashboardStatusBreakdown, items, {
      getTitle: function (item) {
        return item.label || item.status || "Unknown";
      },
      getMeta: function (item) {
        if (!item.count) return "No applications in this state.";
        return `Current workflow count in ${item.label || item.status}.`;
      }
    });
  }

  function renderBreedPreference(items) {
    renderMetricRows(dashboardBreedPreference, items, {
      getTitle: function (item) {
        return item.breed || "Unknown";
      },
      getMeta: function (item) {
        return `${item.count || 0} applications mapped to this breed profile.`;
      }
    });
  }

  function renderRecentRecords(records) {
    if (!recentRecordsTableBody) return;

    if (!Array.isArray(records) || !records.length) {
      recentRecordsTableBody.innerHTML = '<tr><td colspan="5">No workflow records yet.</td></tr>';
      return;
    }

    recentRecordsTableBody.innerHTML = records.map(function (record) {
      const catName = record.cat && record.cat.name ? record.cat.name : "Unknown";
      const userName = record.user && (record.user.display_name || record.user.username) ? (record.user.display_name || record.user.username) : "Unknown";
      const status = record.status || "pending";
      return [
        "<tr>",
        "  <td>" + escapeHtml(catName) + "</td>",
        "  <td>" + escapeHtml(userName) + "</td>",
        '  <td><span class="tag ' + getStatusTagClass(status) + '">' + escapeHtml(status) + "</span></td>",
        "  <td>" + escapeHtml(formatDate(record.updated_at || record.created_at)) + "</td>",
        '  <td><button class="mini-btn" type="button" data-dashboard-application="' + escapeHtml(record.id) + '">' + escapeHtml(status === "pending" ? "Review" : "View") + "</button></td>",
        "</tr>"
      ].join("");
    }).join("");
  }

  function renderAttentionItems(items) {
    if (!dashboardAttentionList) return;

    if (!Array.isArray(items) || !items.length) {
      dashboardAttentionList.innerHTML = '<div class="empty-state">No urgent items right now.</div>';
      return;
    }

    dashboardAttentionList.innerHTML = items.map(function (item) {
      const tagClass = item.type === "conversation"
        ? "orange"
        : getStatusTagClass(item.status || "pending");
      const actionMarkup = item.type === "conversation"
        ? '<button class="mini-btn" type="button" data-dashboard-conversation="' + escapeHtml(item.conversation_id || item.id) + '">Open Chat</button>'
        : '<button class="mini-btn" type="button" data-dashboard-application="' + escapeHtml(item.application_id || item.id) + '">Review</button>';
      return [
        '<div class="attention-item">',
        '  <div class="attention-head">',
        '    <div class="attention-title">' + escapeHtml(item.title || "Untitled") + "</div>",
        '    <span class="tag ' + escapeHtml(tagClass) + '">' + escapeHtml(item.label || "Attention") + "</span>",
        "  </div>",
        '  <div class="attention-subtitle">' + escapeHtml(item.subtitle || "") + "</div>",
        '  <div class="attention-meta">',
        '    <span>' + escapeHtml(formatDate(item.updated_at || "")) + "</span>",
             actionMarkup,
        "  </div>",
        "</div>"
      ].join("");
    }).join("");
  }

  function mapApplicationDetail(application) {
    const applicant = application.user && (application.user.display_name || application.user.username)
      ? (application.user.display_name || application.user.username)
      : "Unknown applicant";
    const catName = application.cat && application.cat.name ? application.cat.name : "Unknown cat";
    const catBreed = application.cat && application.cat.breed ? application.cat.breed : "Not provided";
    const statusLabel = getApplicationStatusLabel(application.status);
    const applicantMessage = application.message || "No applicant message was provided in the current schema.";

    return {
      id: application.id,
      title: application.id,
      subtitle: applicant + " applying for " + catName,
      status: statusLabel,
      statusClass: "status-" + String(application.status || "pending").toLowerCase(),
      applicant: applicant,
      contact: application.user && application.user.email ? application.user.email : "Not provided",
      experience: application.user && application.user.username ? application.user.username : "Not provided",
      submitted: formatDate(application.created_at),
      cat: catName,
      home: catBreed,
      schedule: statusLabel,
      note: formatDate(application.updated_at || application.created_at),
      reason: applicantMessage
    };
  }

  function renderApplications(applications) {
    applicationTableBody.innerHTML = applications.map(function (application) {
      const applicant = application.user && (application.user.display_name || application.user.username)
        ? (application.user.display_name || application.user.username)
        : "Unknown applicant";
      const catName = application.cat && application.cat.name ? application.cat.name : "Unknown cat";
      const statusLabel = getApplicationStatusLabel(application.status);
      const isLocked = application.status === "approved" || application.status === "rejected";

      return [
        "<tr>",
        "  <td>" + escapeHtml(application.id) + "</td>",
        "  <td>" + escapeHtml(catName) + "</td>",
        "  <td>" + escapeHtml(applicant) + "</td>",
        '  <td><span class="tag ' + getStatusTagClass(application.status) + '">' + escapeHtml(statusLabel) + "</span></td>",
        "  <td>" + escapeHtml(formatDate(application.created_at)) + "</td>",
        '  <td class="mini-actions">',
        '    <button class="mini-btn view-btn" type="button" data-application-detail="' + escapeHtml(application.id) + '">View</button>',
        '    <button class="mini-btn approve-btn" type="button" data-application-review="' + escapeHtml(application.id) + '" data-review-status="approved"' + (isLocked ? " disabled" : "") + '>Approve</button>',
        '    <button class="mini-btn reject-btn" type="button" data-application-review="' + escapeHtml(application.id) + '" data-review-status="rejected"' + (isLocked ? " disabled" : "") + '>Reject</button>',
        "  </td>",
        "</tr>"
      ].join("");
    }).join("");
  }

  function openApplicationDetail(applicationId) {
    const application = localApplications.find(function (item) {
      return item.id === applicationId;
    });
    if (!application) return;

    activeApplicationId = applicationId;
    const detail = mapApplicationDetail(application);
    applicationAvatar.textContent = detail.applicant.charAt(0).toUpperCase();
    applicationTitle.textContent = detail.title;
    applicationSubtitle.textContent = detail.subtitle;
    applicationStatus.textContent = detail.status;
    applicationStatus.className = "profile-status " + detail.statusClass;
    applicationApplicant.textContent = detail.applicant;
    applicationContact.textContent = detail.contact;
    applicationExperience.textContent = detail.experience;
    applicationSubmitted.textContent = detail.submitted;
    applicationCat.textContent = detail.cat;
    applicationHome.textContent = detail.home;
    applicationSchedule.textContent = detail.schedule;
    applicationNote.textContent = detail.note;
    applicationReason.textContent = detail.reason;
    openOverlay(applicationDetailOverlay);
  }

  async function reviewApplication(applicationId, status) {
    try {
      const updated = await apiRequest("/rescue/applications/" + applicationId + "/review", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: status })
      });

      localApplications = localApplications.map(function (application) {
        return application.id === applicationId ? updated : application;
      });
      renderApplications(localApplications);
      await loadDashboardData();
    } catch (error) {
      window.alert("Review request failed: " + error.message);
    }
  }

  function renderNotificationList(threads) {
    if (notifCountLabel) {
      notifCountLabel.textContent = `${threads.length} active threads`;
    }

    if (!threads.length) {
      notifList.innerHTML = '<div class="notif-item"><div class="notif-body"><div class="notif-name">No notifications yet</div><div class="notif-snippet">New application-related chats will appear here after a conversation is created.</div></div></div>';
      return;
    }

    notifList.innerHTML = threads.map(function (thread) {
      return [
        '<div class="notif-item" data-thread="' + escapeHtml(thread.id) + '">',
        '  <div class="notif-avatar ' + escapeHtml(thread.avatarClass || "") + '">' + escapeHtml(thread.avatarText) + "</div>",
        '  <div class="notif-body">',
        '    <div class="notif-head">',
        '      <div class="notif-name">' + escapeHtml(thread.title) + "</div>",
        '      <div class="notif-time">' + escapeHtml(thread.time) + "</div>",
        "    </div>",
        '    <div class="notif-snippet">' + escapeHtml(thread.snippet) + "</div>",
        '    <div class="notif-meta">',
        '      <span class="notif-tag">' + escapeHtml(thread.subtitle) + "</span>",
        thread.unread ? '      <span class="notif-unread" aria-label="Unread"></span>' : "",
        "    </div>",
        "  </div>",
        "</div>"
      ].join("");
    }).join("");
  }

  function buildApplicationNotificationThread(application) {
    const applicant = application.user && (application.user.display_name || application.user.username)
      ? (application.user.display_name || application.user.username)
      : "Unknown applicant";
    const catName = application.cat && application.cat.name ? application.cat.name : "Unknown cat";
    const statusLabel = getApplicationStatusLabel(application.status);
    return {
      id: `application:${application.id}`,
      threadType: "application",
      applicationId: application.id,
      application: application,
      userId: application.user && application.user.id ? application.user.id : "",
      title: `${applicant} · ${catName}`,
      subtitle: statusLabel,
      snippet: application.message || "Open this application to start a chat with the applicant.",
      time: formatDate(application.updated_at || application.created_at),
      unread: application.status === "pending",
      avatarText: (applicant.charAt(0) || "A").toUpperCase(),
      avatarClass: getStatusTagClass(application.status) === "blue" ? "blue" : (getStatusTagClass(application.status) === "red" ? "pink" : "orange"),
      messages: []
    };
  }

  async function createConversationFromApplication(application) {
    if (!application || !application.user || !application.user.id) {
      throw new Error("Applicant information is missing.");
    }

    const conversation = await apiRequest("/chat/conversations", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        user_id: application.user.id,
        initial_message: ""
      })
    });

    return conversation;
  }

  function renderPendingImages() {
    if (!pendingImages.length) {
      notifImagePreview.innerHTML = "";
      notifImagePreview.hidden = true;
      return;
    }

    notifImagePreview.hidden = false;
    notifImagePreview.innerHTML = pendingImages.map(function (image, index) {
      return [
        '<div class="notif-preview-item">',
        '  <img src="' + image.src + '" alt="' + escapeHtml(image.name) + '">',
        '  <button class="notif-preview-remove" type="button" data-remove-image="' + index + '">×</button>',
        "</div>"
      ].join("");
    }).join("");
  }

  function renderConversation(thread) {
    notifConversation.innerHTML = thread.messages.map(function (message) {
      const imageMarkup = Array.isArray(message.images) && message.images.length
        ? '<div class="msg-images">' + message.images.map(function (image) {
            return '<img src="' + image.src + '" alt="' + escapeHtml(image.name || "Shared image") + '">';
          }).join("") + "</div>"
        : "";
      const textMarkup = message.text
        ? '<div class="msg-text">' + escapeHtml(message.text) + "</div>"
        : "";
      return [
        '<div class="msg ' + message.sender + '">',
        '  <div class="msg-bubble' + (imageMarkup ? " has-media" : "") + '">' + imageMarkup + textMarkup + "</div>",
        '  <div class="msg-time">' + escapeHtml(message.time) + "</div>",
        "</div>"
      ].join("");
    }).join("");
    notifConversation.scrollTop = notifConversation.scrollHeight;
  }

  async function loadRemoteThreads() {
    const conversations = await apiRequest("/chat/conversations", {
      method: "GET",
      headers: getAuthHeaders()
    });

    const mapped = conversations.map(function (conversation) {
      const user = conversation.user || {};
      const latest = conversation.latest_message;
      return {
        id: conversation.id,
        threadType: "conversation",
        userId: user.id || "",
        title: user.display_name || user.username || "Unknown user",
        subtitle: "Adoption Chat",
        snippet: latest && latest.content ? latest.content : "Open conversation to view details.",
        time: latest ? formatTime(latest.created_at) : formatTime(conversation.created_at),
        unread: false,
        avatarText: ((user.display_name || user.username || "U").charAt(0) || "U").toUpperCase(),
        avatarClass: "blue",
        messages: []
      };
    });

    const applicationThreads = localApplications.map(buildApplicationNotificationThread);
    const conversationUserNames = new Set(
      mapped.map(function (thread) {
        return thread.userId;
      })
    );

    const mergedThreads = mapped.concat(
      applicationThreads.filter(function (thread) {
        return !thread.userId || !conversationUserNames.has(thread.userId);
      })
    );

    notificationThreads = mergedThreads;
    usingRemoteNotifications = mapped.length > 0;
    renderNotificationList(notificationThreads);
  }

  async function openThread(threadId) {
    const thread = notificationThreads.find(function (item) {
      return item.id === threadId;
    });
    if (!thread) return;

    if (thread.threadType === "application") {
      try {
        const conversation = await createConversationFromApplication(thread.application);
        await loadRemoteThreads();
        await openThread(conversation.id);
      } catch (error) {
        window.alert("Failed to start conversation: " + error.message);
      }
      return;
    }

    activeThreadId = threadId;
    notifModalAvatar.className = "notif-avatar " + (thread.avatarClass || "");
    notifModalAvatar.textContent = thread.avatarText;
    notifModalTitle.textContent = thread.title;
    notifModalSubtitle.textContent = thread.subtitle;

    if (usingRemoteNotifications) {
      try {
        const payload = await apiRequest("/chat/conversations/" + threadId + "/messages", {
          method: "GET",
          headers: getAuthHeaders()
        });

        thread.messages = payload.messages.map(function (message) {
          return {
            sender: message.sender && message.sender.role === "rescue_staff" ? "org" : "user",
            text: message.content || "",
            images: Array.isArray(message.attachments)
              ? message.attachments.map(function (attachment) {
                  return {
                    name: attachment.file_type || "Image",
                    src: attachment.file_url
                  };
                })
              : [],
            time: formatTime(message.created_at)
          };
        });
      } catch (error) {
        console.warn("Failed to load remote thread:", error.message);
      }
    }

    renderConversation(thread);
    notifMessageInput.value = "";
    pendingImages = [];
    notifImageInput.value = "";
    renderPendingImages();
    openOverlay(notifOverlay);
    notifMessageInput.focus();
  }

  async function sendMessage() {
    if (!activeThreadId) return;

    const text = notifMessageInput.value.trim();
    if (!text && !pendingImages.length) return;

    const thread = notificationThreads.find(function (item) {
      return item.id === activeThreadId;
    });
    if (!thread) return;

    if (usingRemoteNotifications) {
      try {
        if (pendingImages.length) {
          await apiRequest("/chat/conversations/" + activeThreadId + "/upload", {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              content: text,
              attachments: pendingImages.map(function (image) {
                return {
                  file_url: image.src,
                  file_type: "image"
                };
              })
            })
          });
        } else {
          await apiRequest("/chat/conversations/" + activeThreadId + "/messages", {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              content: text
            })
          });
        }

        await openThread(activeThreadId);
        return;
      } catch (error) {
        window.alert("Message send failed: " + error.message);
        return;
      }
    }

    thread.messages.push({
      sender: "org",
      text: text,
      images: pendingImages.slice(),
      time: formatTime(new Date().toISOString())
    });
    thread.snippet = text || "Shared image";
    renderConversation(thread);
    notifMessageInput.value = "";
    pendingImages = [];
    notifImageInput.value = "";
    renderPendingImages();
  }

  async function loadDashboardData() {
    try {
      await loadRescueCats();
    } catch (error) {
      console.warn("Cat list unavailable, keeping static cat list:", error.message);
    }

    try {
      const analytics = await apiRequest("/rescue/analytics", {
        method: "GET",
        headers: getAuthHeaders()
      });

      renderStats(analytics.overview || {});
      renderFunnelChart(analytics.funnel || {});
      renderTrendChart(analytics.monthly_trend || []);
      renderStatusBreakdown(analytics.status_breakdown || []);
      renderBreedPreference(analytics.breed_preferences || []);
      renderAttentionItems(analytics.attention_items || []);
      renderRecentRecords(analytics.recent_applications || []);
    } catch (error) {
      renderStats({});
      renderFunnelChart({});
      renderTrendChart([]);
      renderStatusBreakdown([]);
      renderBreedPreference([]);
      renderAttentionItems([]);
      renderRecentRecords([]);
      console.warn("Analytics unavailable, showing empty dashboard:", error.message);
    }

    try {
      const applications = await apiRequest("/rescue/applications", {
        method: "GET",
        headers: getAuthHeaders()
      });

      localApplications = applications;
      renderApplications(localApplications);
    } catch (error) {
      renderApplications(localApplications);
    }

    if (getToken()) {
      try {
        await loadRemoteThreads();
      } catch (error) {
        notificationThreads = localApplications.map(buildApplicationNotificationThread);
        usingRemoteNotifications = false;
        renderNotificationList(notificationThreads);
      }
    } else {
      notificationThreads = localApplications.map(buildApplicationNotificationThread);
      usingRemoteNotifications = false;
      renderNotificationList(notificationThreads);
    }
  }

  function updateOrganizationSessionUI() {
    const organization = getOrganizationProfile();
    const hasOrgSession = Boolean(localStorage.getItem("catface_org_token") && organization);

    if (orgSessionName) {
      orgSessionName.textContent = hasOrgSession
        ? `${organization.name} (${organization.type})`
        : "No organization session";
    }

    if (orgLoginLink) {
      orgLoginLink.style.display = hasOrgSession ? "none" : "";
    }

    if (orgLogoutBtn) {
      orgLogoutBtn.style.display = hasOrgSession ? "" : "none";
    }
  }

  menuButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      activateSection(button.getAttribute("data-target"));
    });
  });

  addCatToggleBtn.addEventListener("click", function () {
    const isCollapsed = catFormPanel.classList.contains("collapsed-panel");
    if (isCollapsed) {
      resetCatForm();
      setCatFormOpen(true);
      catFormPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      setCatFormOpen(false);
      resetCatForm();
    }
  });

  catFormCancelBtn.addEventListener("click", function () {
    setCatFormOpen(false);
    resetCatForm();
  });

  catFormSaveBtn.addEventListener("click", saveCatForm);

  catPhotoInput.addEventListener("change", function (event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (loadEvent) {
      currentCatPhoto = loadEvent.target.result;
      catPhotoPreview.src = currentCatPhoto;
      catPhotoPreview.hidden = false;
      catPhotoPlaceholder.hidden = true;
    };
    reader.readAsDataURL(file);
  });

  openFaceIdBtn.addEventListener("click", function () {
    resetFaceRecognitionModal();
    openOverlay(faceIdOverlay);
  });

  faceIdCloseBtn.addEventListener("click", function () {
    closeOverlay(faceIdOverlay);
  });

  faceIdCancelBtn.addEventListener("click", function () {
    closeOverlay(faceIdOverlay);
  });

  faceIdImageInput.addEventListener("change", function (event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (loadEvent) {
      facePreviewImage.src = loadEvent.target.result;
      facePreviewImage.hidden = false;
      facePreviewPlaceholder.hidden = true;
      currentGeneratedFaceId = generateFaceId();
      generatedFaceId.textContent = currentGeneratedFaceId;
    };
    reader.readAsDataURL(file);
  });

  useFaceIdBtn.addEventListener("click", function () {
    if (!currentGeneratedFaceId) return;
    catIdInput.value = currentGeneratedFaceId;
    closeOverlay(faceIdOverlay);
  });

  catListBody.addEventListener("click", function (event) {
    const profileButton = event.target.closest("[data-cat-profile]");
    if (profileButton) {
      openCatProfile(profileButton.getAttribute("data-cat-profile"));
      return;
    }

    const editButton = event.target.closest("[data-cat-edit]");
    if (editButton) {
      const catId = editButton.getAttribute("data-cat-edit");
      fillCatForm(catProfiles[catId]);
      setCatFormOpen(true);
      catFormPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  catProfileCloseBtn.addEventListener("click", function () {
    closeOverlay(catProfileOverlay);
  });

  catProfileOverlay.addEventListener("click", function (event) {
    if (event.target === catProfileOverlay) {
      closeOverlay(catProfileOverlay);
    }
  });

  applicationTableBody.addEventListener("click", function (event) {
    const detailButton = event.target.closest("[data-application-detail]");
    if (detailButton) {
      openApplicationDetail(detailButton.getAttribute("data-application-detail"));
      return;
    }

    const reviewButton = event.target.closest("[data-application-review]");
    if (reviewButton) {
      reviewApplication(
        reviewButton.getAttribute("data-application-review"),
        reviewButton.getAttribute("data-review-status")
      );
    }
  });

  dashboardSection.addEventListener("click", function (event) {
    const applicationButton = event.target.closest("[data-dashboard-application]");
    if (applicationButton) {
      const applicationId = applicationButton.getAttribute("data-dashboard-application");
      activateSection("application-review");
      openApplicationDetail(applicationId);
      return;
    }

    const conversationButton = event.target.closest("[data-dashboard-conversation]");
    if (conversationButton) {
      const conversationId = conversationButton.getAttribute("data-dashboard-conversation");
      activateSection("notifications");

      const thread = notificationThreads.find(function (item) {
        return item.id === conversationId;
      });

      if (thread) {
        openThread(conversationId);
        return;
      }

      loadRemoteThreads()
        .then(function () {
          openThread(conversationId);
        })
        .catch(function (error) {
          window.alert("Unable to open conversation: " + error.message);
        });
    }
  });

  applicationCloseBtn.addEventListener("click", function () {
    closeOverlay(applicationDetailOverlay);
  });

  applicationContactBtn.addEventListener("click", function () {
    if (!activeApplicationId) return;

    const application = localApplications.find(function (item) {
      return item.id === activeApplicationId;
    });
    closeOverlay(applicationDetailOverlay);
    activateSection("notifications");
    if (application) {
      const matchedThread = notificationThreads.find(function (thread) {
        return thread.applicationId === application.id || (thread.userId && application.user && thread.userId === application.user.id);
      });
      if (matchedThread) {
        openThread(matchedThread.id);
        return;
      }

      const applicationThread = buildApplicationNotificationThread(application);
      notificationThreads = [applicationThread].concat(notificationThreads);
      renderNotificationList(notificationThreads);
      openThread(applicationThread.id);
    }
  });

  applicationDetailOverlay.addEventListener("click", function (event) {
    if (event.target === applicationDetailOverlay) {
      closeOverlay(applicationDetailOverlay);
    }
  });

  notifList.addEventListener("click", function (event) {
    const item = event.target.closest("[data-thread]");
    if (!item) return;
    openThread(item.getAttribute("data-thread"));
  });

  notifSearch.addEventListener("input", function () {
    const keyword = notifSearch.value.trim().toLowerCase();
    Array.from(notifList.querySelectorAll(".notif-item")).forEach(function (item) {
      const text = item.textContent.toLowerCase();
      item.style.display = !keyword || text.indexOf(keyword) !== -1 ? "" : "none";
    });
  });

  notifSendBtn.addEventListener("click", sendMessage);

  notifImageInput.addEventListener("change", function (event) {
    const files = Array.from(event.target.files || []).slice(0, 6);
    if (!files.length) return;

    Promise.all(files.map(function (file) {
      return new Promise(function (resolve) {
        const reader = new FileReader();
        reader.onload = function (loadEvent) {
          resolve({
            name: file.name,
            src: loadEvent.target.result
          });
        };
        reader.readAsDataURL(file);
      });
    })).then(function (images) {
      pendingImages = pendingImages.concat(images).slice(0, 6);
      renderPendingImages();
      notifImageInput.value = "";
    });
  });

  notifImagePreview.addEventListener("click", function (event) {
    const removeButton = event.target.closest("[data-remove-image]");
    if (!removeButton) return;

    const index = Number(removeButton.getAttribute("data-remove-image"));
    pendingImages = pendingImages.filter(function (_, currentIndex) {
      return currentIndex !== index;
    });
    renderPendingImages();
  });

  notifMessageInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });

  notifCloseBtn.addEventListener("click", function () {
    closeOverlay(notifOverlay);
  });

  notifOverlay.addEventListener("click", function (event) {
    if (event.target === notifOverlay) {
      closeOverlay(notifOverlay);
    }
  });

  if (orgLogoutBtn) {
    orgLogoutBtn.addEventListener("click", function () {
      localStorage.removeItem("catface_org_token");
      localStorage.removeItem("catface_org_profile");
      localStorage.removeItem("catface_token");
      updateOrganizationSessionUI();
      window.location.href = "org-login.html";
    });
  }

  faceIdOverlay.addEventListener("click", function (event) {
    if (event.target === faceIdOverlay) {
      closeOverlay(faceIdOverlay);
    }
  });

  renderCatList();
  renderApplications(localApplications);
  renderNotificationList(notificationThreads);
  updateOrganizationSessionUI();
  loadDashboardData();
})();
