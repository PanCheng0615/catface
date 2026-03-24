(function () {
  window.__CATFACE_EXTERNAL_RESCUE__ = true;

  const API_BASE = "http://localhost:3000/api";

  const menuButtons = document.querySelectorAll(".menu-btn");
  const sections = document.querySelectorAll(".section");
  const statCards = document.querySelectorAll(".stat-card");
  const catListBody = document.getElementById("cat-list-body");
  const applicationListBody = document.getElementById("application-list-body");
  const notifList = document.getElementById("notif-list");
  const notifCountLabel = document.getElementById("notif-count-label");
  const notifSearchInput = document.getElementById("notif-search-input");
  const addCatToggleBtn = document.getElementById("add-cat-toggle-btn");
  const catFormPanel = document.getElementById("cat-form-panel");
  const catFormTitle = document.getElementById("cat-form-title");
  const catFormDescription = document.getElementById("cat-form-description");
  const catFormCancelBtn = document.getElementById("cat-form-cancel-btn");
  const catFormSaveBtn = document.getElementById("cat-form-save-btn");
  const catNameInput = document.getElementById("cat-name");
  const catIdInput = document.getElementById("cat-id");
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
  const openFaceIdBtn = document.getElementById("open-face-id-btn");
  const faceIdOverlay = document.getElementById("face-id-overlay");
  const faceIdCloseBtn = document.getElementById("face-id-close-btn");
  const faceIdCancelBtn = document.getElementById("face-id-cancel-btn");
  const faceIdImageInput = document.getElementById("face-id-image-input");
  const facePreviewImage = document.getElementById("face-preview-image");
  const facePreviewPlaceholder = document.getElementById("face-preview-placeholder");
  const generatedFaceId = document.getElementById("generated-face-id");
  const useFaceIdBtn = document.getElementById("use-face-id-btn");
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
  const notifActionButtons = document.querySelectorAll(".notif-actions .mini-btn");
  const dashboardFunnel = document.getElementById("dashboard-funnel");
  const dashboardTrend = document.getElementById("dashboard-trend");
  const dashboardStatusBreakdown = document.getElementById("dashboard-status-breakdown");
  const dashboardBreedPreference = document.getElementById("dashboard-breed-preference");
  const dashboardRecentRecords = document.getElementById("dashboard-recent-records");
  const dashboardAttentionList = document.getElementById("dashboard-attention-list");
  const orgLogoutBtn = document.getElementById("org-logout-btn");

  if (!catListBody || !applicationListBody || !notifList) {
    return;
  }

  const state = {
    cats: [],
    catsById: {},
    applications: [],
    applicationsById: {},
    threads: [],
    activeThreadId: null,
    activeThreadUserId: null,
    activeApplicationId: null,
    editingCatId: null,
    pendingImages: [],
    currentGeneratedFaceId: "",
    currentGeneratedEmbedding: null,
    currentCatPhoto: ""
  };

  function getAuthToken() {
    return localStorage.getItem("catface_org_token") || localStorage.getItem("catface_token") || "";
  }

  function decodeToken(token) {
    try {
      const payload = token.split(".")[1];
      const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(normalized));
    } catch (error) {
      return {};
    }
  }

  function getCurrentUserId() {
    return decodeToken(getAuthToken()).id || "";
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(value) {
    if (!value) return "Unknown";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleDateString();
  }

  function formatDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
  }

  function formatShortTime(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function formatAgeMonths(value) {
    if (value == null || Number.isNaN(Number(value))) return "Unknown";
    const months = Number(value);
    if (months < 12) return months + " month" + (months === 1 ? "" : "s");
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (!remainingMonths) return years + " year" + (years === 1 ? "" : "s");
    return years + " year" + (years === 1 ? "" : "s") + " " + remainingMonths + " month" + (remainingMonths === 1 ? "" : "s");
  }

  function humanizeCatStatus(status) {
    if (status === "adopted") return "Adopted";
    if (status === "fostered") return "Fostered";
    if (status === "deceased") return "Deceased";
    return "Available";
  }

  function catStatusTagClass(status) {
    if (status === "available") return "green";
    if (status === "fostered") return "blue";
    return "orange";
  }

  function humanizeApplicationStatus(status) {
    if (status === "approved") return "Approved";
    if (status === "rejected") return "Rejected";
    return "Pending";
  }

  function applicationStatusTagClass(status) {
    if (status === "approved") return "green";
    if (status === "rejected") return "orange";
    return "blue";
  }

  function avatarClassFromStatus(status) {
    if (status === "fostered") return "blue";
    if (status === "adopted" || status === "deceased") return "pink";
    return "";
  }

  function splitDescription(description) {
    const result = {
      personality: "",
      health: "",
      notes: "",
      summary: description || ""
    };

    String(description || "")
      .split("\n")
      .map(function (line) {
        return line.trim();
      })
      .filter(Boolean)
      .forEach(function (line) {
        if (line.indexOf("性格:") === 0) result.personality = line.replace("性格:", "").trim();
        if (line.indexOf("健康:") === 0) result.health = line.replace("健康:", "").trim();
        if (line.indexOf("備註:") === 0) result.notes = line.replace("備註:", "").trim();
      });

    return result;
  }

  function api(path, options) {
    const token = getAuthToken();
    if (!token) {
      window.location.href = "org-login.html";
      return Promise.reject(new Error("Please log in with an organization account first."));
    }

    return fetch(API_BASE + path, Object.assign({
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      }
    }, options || {})).then(async function (response) {
      const payload = await response.json().catch(function () {
        return {};
      });

      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || "Request failed.");
      }

      return payload.data;
    });
  }

  function activateSection(targetId) {
    menuButtons.forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-target") === targetId);
    });

    sections.forEach(function (section) {
      section.classList.toggle("active", section.id === targetId);
    });
  }

  function setCatFormOpen(isOpen) {
    catFormPanel.classList.toggle("collapsed-panel", !isOpen);
    addCatToggleBtn.textContent = isOpen ? "Hide Form" : "Add New Cat";
  }

  function resetCatForm() {
    state.editingCatId = null;
    state.currentGeneratedEmbedding = null;
    state.currentGeneratedFaceId = "";
    catFormTitle.textContent = "Add New Cat";
    catFormDescription.textContent = "Create a new cat account with rescue information, health summary, and adoption requirements.";
    catFormSaveBtn.textContent = "Save Cat Account";
    catNameInput.value = "";
    catIdInput.value = "";
    catIdInput.disabled = false;
    catGenderInput.value = "male";
    catBreedInput.value = "";
    catAgeInput.value = "";
    catStatusInput.value = "available";
    catLocationInput.value = "";
    catHealthInput.value = "";
    catPersonalityInput.value = "";
    catNotesInput.value = "";
    state.currentCatPhoto = "";
    catPhotoInput.value = "";
    catPhotoPreview.src = "";
    catPhotoPreview.hidden = true;
    catPhotoPlaceholder.hidden = false;
  }

  function openFaceRecognitionModal() {
    resetFaceRecognitionModal();
    faceIdOverlay.classList.add("open");
    faceIdOverlay.setAttribute("aria-hidden", "false");
  }

  function closeFaceRecognitionModal() {
    faceIdOverlay.classList.remove("open");
    faceIdOverlay.setAttribute("aria-hidden", "true");
  }

  function resetFaceRecognitionModal() {
    state.currentGeneratedFaceId = "";
    state.currentGeneratedEmbedding = null;
    generatedFaceId.textContent = "Waiting for image upload";
    generatedFaceId.title = "";
    faceIdImageInput.value = "";
    facePreviewImage.src = "";
    facePreviewImage.hidden = true;
    facePreviewPlaceholder.hidden = false;
    useFaceIdBtn.disabled = true;
  }

  function setPhotoPreview(photoUrl) {
    state.currentCatPhoto = photoUrl || "";
    if (state.currentCatPhoto) {
      catPhotoPreview.src = state.currentCatPhoto;
      catPhotoPreview.hidden = false;
      catPhotoPlaceholder.hidden = true;
    } else {
      catPhotoPreview.src = "";
      catPhotoPreview.hidden = true;
      catPhotoPlaceholder.hidden = false;
    }
  }

  function catToViewModel(cat) {
    const description = splitDescription(cat.description);
    return {
      dbId: cat.id,
      displayId: cat.face_code || cat.id,
      name: cat.name || "Unnamed",
      breed: cat.breed || "Unknown",
      gender: cat.gender || "unknown",
      age: formatAgeMonths(cat.age_months),
      age_months: cat.age_months,
      status: cat.status || "available",
      statusLabel: humanizeCatStatus(cat.status),
      avatarText: (cat.name || "C").charAt(0).toUpperCase(),
      avatarClass: avatarClassFromStatus(cat.status),
      health: description.health || (cat.is_vaccinated ? "Vaccinated" : "Not provided"),
      personality: description.personality || "Not specified",
      notes: description.notes || "",
      summary: description.summary || "No summary yet.",
      tags: Array.isArray(cat.tags) ? cat.tags.map(function (tag) { return tag.tag; }) : [],
      photo: cat.photo_url || "",
      found_location: cat.found_location || "Not provided",
      spayed: cat.is_neutered == null ? "Unknown" : (cat.is_neutered ? "Yes" : "No"),
      vaccinated: cat.is_vaccinated == null ? "Unknown" : (cat.is_vaccinated ? "Yes" : "No"),
      dewormed: cat.is_dewormed == null ? "Unknown" : (cat.is_dewormed ? "Yes" : "No"),
      intake_date: cat.intake_date,
      created_at: cat.created_at
    };
  }

  function renderCatList() {
    if (!state.cats.length) {
      catListBody.innerHTML = "<tr><td colspan=\"7\">No cats found for this organization.</td></tr>";
      return;
    }

    catListBody.innerHTML = state.cats.map(function (cat) {
      const view = catToViewModel(cat);
      return [
        "<tr>",
        "  <td>" + escapeHtml(view.displayId) + "</td>",
        "  <td>" + escapeHtml(view.name) + "</td>",
        "  <td>" + escapeHtml(view.breed) + "</td>",
        "  <td>" + escapeHtml(view.age) + "</td>",
        "  <td><span class=\"tag " + catStatusTagClass(view.status) + "\">" + escapeHtml(view.statusLabel) + "</span></td>",
        "  <td>" + escapeHtml(view.health) + "</td>",
        "  <td class=\"mini-actions\"><button class=\"mini-btn\" type=\"button\" data-cat-profile=\"" + escapeHtml(view.dbId) + "\">View</button><button class=\"mini-btn\" type=\"button\" data-cat-edit=\"" + escapeHtml(view.dbId) + "\">Edit</button></td>",
        "</tr>"
      ].join("");
    }).join("");
  }

  function fillCatForm(catId) {
    const cat = state.catsById[catId];
    if (!cat) return;

    const view = catToViewModel(cat);
    state.editingCatId = catId;
    catFormTitle.textContent = "Edit Cat Information";
    catFormDescription.textContent = "Update the selected cat account and save the latest rescue details.";
    catFormSaveBtn.textContent = "Save Changes";
    catNameInput.value = view.name;
    catIdInput.value = cat.face_code || "";
    catIdInput.disabled = true;
    catGenderInput.value = view.gender;
    catBreedInput.value = cat.breed || "";
    catAgeInput.value = cat.age_months == null ? "" : String(cat.age_months);
    catStatusInput.value = cat.status || "available";
    catLocationInput.value = cat.found_location || "";
    catHealthInput.value = splitDescription(cat.description).health || "";
    catPersonalityInput.value = view.tags.join(", ");
    catNotesInput.value = splitDescription(cat.description).notes || "";
    state.currentGeneratedEmbedding = null;
    setPhotoPreview(cat.photo_url || "");
    setCatFormOpen(true);
    catFormPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openCatProfile(catId) {
    const cat = state.catsById[catId];
    if (!cat) return;

    const view = catToViewModel(cat);
    catProfileAvatar.className = "profile-avatar" + (view.avatarClass ? " " + view.avatarClass : "");
    catProfileAvatar.textContent = view.avatarText;
    catProfileName.textContent = view.name;
    catProfileSubtitle.textContent = view.displayId + " · " + view.breed;
    catProfileStatus.textContent = view.statusLabel;
    catProfileId.textContent = view.displayId;
    catProfileNameValue.textContent = view.name;
    catProfileBreed.textContent = view.breed;
    catProfileGender.textContent = view.gender;
    catProfileAge.textContent = view.age;
    catProfileBirthday.textContent = view.intake_date ? formatDate(view.intake_date) : "Unknown";
    catProfilePersonality.textContent = view.personality;
    catProfileSpayed.textContent = view.spayed;
    catProfileVaccinationStatus.textContent = view.vaccinated;
    catProfileFoundLocation.textContent = view.found_location;
    catProfileAllergyHistory.textContent = view.notes || "No allergy record";
    catProfileAdoptionStatus.textContent = view.statusLabel;
    catProfileTags.innerHTML = view.tags.length
      ? view.tags.map(function (tag) {
          return "<span class=\"profile-tag\">" + escapeHtml(tag) + "</span>";
        }).join("")
      : "<span class=\"profile-tag\">No tags</span>";
    catProfileSummary.textContent = view.summary;

    if (view.photo) {
      catProfilePhoto.src = view.photo;
      catProfilePhoto.hidden = false;
      catProfilePhotoEmpty.hidden = true;
    } else {
      catProfilePhoto.src = "";
      catProfilePhoto.hidden = true;
      catProfilePhotoEmpty.hidden = false;
    }

    catProfileOverlay.classList.add("open");
    catProfileOverlay.setAttribute("aria-hidden", "false");
  }

  function closeCatProfile() {
    catProfileOverlay.classList.remove("open");
    catProfileOverlay.setAttribute("aria-hidden", "true");
  }

  function applicationToViewModel(application) {
    return {
      id: application.id,
      title: application.id,
      applicant: application.user && (application.user.display_name || application.user.username) || "Unknown adopter",
      contact: application.user && application.user.email || "Not provided",
      cat: application.cat && application.cat.name || "Unknown cat",
      cat_id: application.cat && application.cat.id || "",
      user_id: application.user && application.user.id || "",
      submitted: formatDate(application.created_at),
      status: application.status,
      statusLabel: humanizeApplicationStatus(application.status),
      note: application.reject_note || application.message || "No note provided.",
      reason: application.message || "No adoption statement provided."
    };
  }

  function renderApplications() {
    if (!state.applications.length) {
      applicationListBody.innerHTML = "<tr><td colspan=\"6\">No adoption applications found.</td></tr>";
      return;
    }

    applicationListBody.innerHTML = state.applications.map(function (application) {
      const view = applicationToViewModel(application);
      const locked = application.status !== "pending";
      return [
        "<tr>",
        "  <td>" + escapeHtml(view.id) + "</td>",
        "  <td>" + escapeHtml(view.cat) + "</td>",
        "  <td>" + escapeHtml(view.applicant) + "</td>",
        "  <td><span class=\"tag " + applicationStatusTagClass(view.status) + "\">" + escapeHtml(view.statusLabel) + "</span></td>",
        "  <td>" + escapeHtml(view.submitted) + "</td>",
        "  <td class=\"mini-actions\">",
        "    <button class=\"mini-btn\" type=\"button\" data-application-detail=\"" + escapeHtml(view.id) + "\">View</button>",
        "    <button class=\"mini-btn\" type=\"button\" data-application-review=\"" + escapeHtml(view.id) + "\" data-review-status=\"approved\"" + (locked ? " disabled" : "") + ">Approve</button>",
        "    <button class=\"mini-btn\" type=\"button\" data-application-review=\"" + escapeHtml(view.id) + "\" data-review-status=\"rejected\"" + (locked ? " disabled" : "") + ">Reject</button>",
        "  </td>",
        "</tr>"
      ].join("");
    }).join("");
  }

  function openApplicationDetail(applicationId) {
    const application = state.applicationsById[applicationId];
    if (!application) return;

    const view = applicationToViewModel(application);
    state.activeApplicationId = applicationId;
    applicationAvatar.textContent = view.applicant.charAt(0).toUpperCase();
    applicationTitle.textContent = view.title;
    applicationSubtitle.textContent = view.applicant + " applying for " + view.cat;
    applicationStatus.textContent = view.statusLabel;
    applicationApplicant.textContent = view.applicant;
    applicationContact.textContent = view.contact;
    applicationExperience.textContent = "No structured experience record";
    applicationSubmitted.textContent = view.submitted;
    applicationCat.textContent = view.cat;
    applicationHome.textContent = "Not provided";
    applicationSchedule.textContent = "Not provided";
    applicationNote.textContent = view.note;
    applicationReason.textContent = view.reason;
    applicationDetailOverlay.classList.add("open");
    applicationDetailOverlay.setAttribute("aria-hidden", "false");
  }

  function closeApplicationDetail() {
    state.activeApplicationId = null;
    applicationDetailOverlay.classList.remove("open");
    applicationDetailOverlay.setAttribute("aria-hidden", "true");
  }

  function renderPendingImages() {
    if (!state.pendingImages.length) {
      notifImagePreview.innerHTML = "";
      notifImagePreview.hidden = true;
      return;
    }

    notifImagePreview.hidden = false;
    notifImagePreview.innerHTML = state.pendingImages.map(function (image, index) {
      return [
        "<div class=\"notif-preview-item\">",
        "  <img src=\"" + image.src + "\" alt=\"" + escapeHtml(image.name) + "\">",
        "  <button class=\"notif-preview-remove\" type=\"button\" data-remove-image=\"" + index + "\">×</button>",
        "</div>"
      ].join("");
    }).join("");
  }

  function renderConversation(messages) {
    if (!messages.length) {
      notifConversation.innerHTML = "<div class=\"empty-state\">No messages yet.</div>";
      return;
    }

    notifConversation.innerHTML = messages.map(function (message) {
      const imagesMarkup = Array.isArray(message.attachments) && message.attachments.length
        ? "<div class=\"msg-images\">" + message.attachments.map(function (attachment) {
            return "<img src=\"" + attachment.file_url + "\" alt=\"Shared image\">";
          }).join("") + "</div>"
        : "";
      const textMarkup = message.content
        ? "<div class=\"msg-text\">" + escapeHtml(message.content === "[attachment]" ? "" : message.content) + "</div>"
        : "";
      const bubbleClass = imagesMarkup ? "msg-bubble has-media" : "msg-bubble";
      const senderClass = message.is_mine ? "org" : "user";
      return [
        "<div class=\"msg " + senderClass + "\">",
        "  <div class=\"" + bubbleClass + "\">" + imagesMarkup + textMarkup + "</div>",
        "  <div class=\"msg-time\">" + escapeHtml(formatShortTime(message.created_at)) + "</div>",
        "</div>"
      ].join("");
    }).join("");
    notifConversation.scrollTop = notifConversation.scrollHeight;
  }

  function renderThreadList() {
    const query = String(notifSearchInput.value || "").trim().toLowerCase();
    const threads = state.threads.filter(function (thread) {
      if (!query) return true;
      return [thread.title, thread.subtitle, thread.snippet].join(" ").toLowerCase().indexOf(query) >= 0;
    });

    notifCountLabel.textContent = threads.length + " active thread" + (threads.length === 1 ? "" : "s");

    if (!threads.length) {
      notifList.innerHTML = "<div class=\"empty-state\">No conversations found.</div>";
      return;
    }

    notifList.innerHTML = threads.map(function (thread) {
      return [
        "<div class=\"notif-item\" data-thread-id=\"" + escapeHtml(thread.id) + "\">",
        "  <div class=\"notif-avatar " + escapeHtml(thread.avatarClass) + "\">" + escapeHtml(thread.avatarText) + "</div>",
        "  <div class=\"notif-body\">",
        "    <div class=\"notif-head\">",
        "      <div class=\"notif-name\">" + escapeHtml(thread.title) + "</div>",
        "      <div class=\"notif-time\">" + escapeHtml(thread.timeLabel) + "</div>",
        "    </div>",
        "    <div class=\"notif-snippet\">" + escapeHtml(thread.snippet || "No message yet") + "</div>",
        "    <div class=\"notif-meta\">",
        "      <span class=\"notif-tag\">" + escapeHtml(thread.subtitle) + "</span>",
        thread.unread ? "      <span class=\"notif-unread\" aria-label=\"Unread\"></span>" : "",
        "    </div>",
        "  </div>",
        "</div>"
      ].join("");
    }).join("");
  }

  function openThread(threadId) {
    const thread = state.threads.find(function (item) {
      return item.id === threadId;
    });
    if (!thread) return;

    state.activeThreadId = thread.id;
    state.activeThreadUserId = thread.user_id;
    notifModalAvatar.className = "notif-avatar " + thread.avatarClass;
    notifModalAvatar.textContent = thread.avatarText;
    notifModalTitle.textContent = thread.title;
    notifModalSubtitle.textContent = thread.subtitle;
    notifMessageInput.value = "";
    state.pendingImages = [];
    notifImageInput.value = "";
    renderPendingImages();

    api("/chat/conversations/" + encodeURIComponent(thread.id) + "/messages").then(function (data) {
      renderConversation(data.messages || []);
      notifOverlay.classList.add("open");
      notifOverlay.setAttribute("aria-hidden", "false");
      notifMessageInput.focus();
    }).catch(function (error) {
      window.alert(error.message || "Unable to open conversation.");
    });
  }

  function closeThread() {
    state.activeThreadId = null;
    state.activeThreadUserId = null;
    notifOverlay.classList.remove("open");
    notifOverlay.setAttribute("aria-hidden", "true");
  }

  function getStatusTagClass(status) {
    if (status === "approved" || status === "available") return "green";
    if (status === "pending" || status === "fostered") return "blue";
    return "orange";
  }

  function renderStats(overview) {
    statCards.forEach(function (card) {
      const statKey = card.getAttribute("data-stat");
      const valueNode = card.querySelector(".stat-value");
      if (!valueNode) return;

      const value = overview[statKey];
      if (statKey === "approval_rate") {
        valueNode.textContent = (value || 0) + "%";
      } else if (statKey === "avg_review_hours") {
        valueNode.textContent = (value || 0) + "h";
      } else {
        valueNode.textContent = value || 0;
      }
    });
  }

  function renderFunnelChart(funnel) {
    if (!dashboardFunnel) return;

    const submitted = Math.max(funnel.submitted || 0, 1);
    const stages = [
      { label: "Submitted", value: funnel.submitted || 0 },
      { label: "Pending", value: funnel.pending || 0 },
      { label: "Approved", value: funnel.approved || 0 },
      { label: "Rejected", value: funnel.rejected || 0 }
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
        options.getMeta ? '  <div class="metric-meta">' + escapeHtml(options.getMeta(item)) + "</div>" : "",
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
        return !item.count ? "No applications in this state." : "Current workflow count in " + (item.label || item.status) + ".";
      }
    });
  }

  function renderBreedPreference(items) {
    renderMetricRows(dashboardBreedPreference, items, {
      getTitle: function (item) {
        return item.breed || "Unknown";
      },
      getMeta: function (item) {
        return (item.count || 0) + " applications mapped to this breed profile.";
      }
    });
  }

  function renderRecentRecords(records) {
    if (!dashboardRecentRecords) return;
    if (!Array.isArray(records) || !records.length) {
      dashboardRecentRecords.innerHTML = '<tr><td colspan="5">No workflow records yet.</td></tr>';
      return;
    }

    dashboardRecentRecords.innerHTML = records.map(function (record) {
      const catName = record.cat && record.cat.name ? record.cat.name : "Unknown";
      const userName = record.user && (record.user.display_name || record.user.username)
        ? (record.user.display_name || record.user.username)
        : "Unknown";
      const status = record.status || "pending";
      return [
        "<tr>",
        "  <td>" + escapeHtml(catName) + "</td>",
        "  <td>" + escapeHtml(userName) + "</td>",
        '  <td><span class="tag ' + getStatusTagClass(status) + '">' + escapeHtml(humanizeApplicationStatus(status)) + "</span></td>",
        "  <td>" + escapeHtml(formatDate(record.updated_at || record.created_at)) + "</td>",
        '  <td><button class="mini-btn" type="button" data-application-detail="' + escapeHtml(record.id) + '">' + escapeHtml(status === "pending" ? "Review" : "View") + "</button></td>",
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
      const tagClass = item.type === "conversation" ? "orange" : getStatusTagClass(item.status || "pending");
      const actionMarkup = item.type === "conversation"
        ? '<button class="mini-btn" type="button" data-thread-id="' + escapeHtml(item.conversation_id || item.id) + '">Open Chat</button>'
        : '<button class="mini-btn" type="button" data-application-detail="' + escapeHtml(item.application_id || item.id) + '">Review</button>';

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

  function renderDashboard(analytics) {
    renderStats(analytics.overview || {});
    renderFunnelChart(analytics.funnel || {});
    renderTrendChart(analytics.monthly_trend || []);
    renderStatusBreakdown(analytics.status_breakdown || []);
    renderBreedPreference(analytics.breed_preferences || []);
    renderRecentRecords(analytics.recent_applications || []);
    renderAttentionItems(analytics.attention_items || []);
  }

  function buildThreads(conversations) {
    const currentUserId = getCurrentUserId();
    state.threads = conversations.map(function (conversation) {
      const latestMessage = conversation.latest_message || {};
      const title = conversation.user && (conversation.user.display_name || conversation.user.username) || "Unknown adopter";
      return {
        id: conversation.id,
        user_id: conversation.user_id,
        avatarText: title.charAt(0).toUpperCase(),
        avatarClass: latestMessage.is_mine ? "orange" : "blue",
        title: title,
        subtitle: latestMessage.is_mine ? "Awaiting adopter reply" : "Reply needed",
        snippet: latestMessage.content || "No message yet",
        timeLabel: formatShortTime(latestMessage.created_at) || formatDate(conversation.created_at),
        unread: latestMessage.sender_id && latestMessage.sender_id !== currentUserId
      };
    });
  }

  function loadCats() {
    return api("/rescue/cats").then(function (data) {
      state.cats = Array.isArray(data) ? data : [];
      state.catsById = {};
      state.cats.forEach(function (cat) {
        state.catsById[cat.id] = cat;
      });
      renderCatList();
    });
  }

  function loadApplications() {
    return api("/rescue/applications").then(function (data) {
      state.applications = Array.isArray(data) ? data : [];
      state.applicationsById = {};
      state.applications.forEach(function (application) {
        state.applicationsById[application.id] = application;
      });
      renderApplications();
    });
  }

  function loadAnalytics() {
    return api("/rescue/analytics").then(renderDashboard);
  }

  function loadThreads() {
    return api("/chat/conversations").then(function (data) {
      buildThreads(Array.isArray(data) ? data : []);
      renderThreadList();
    });
  }

  function refreshAll() {
    return Promise.all([
      loadCats(),
      loadApplications(),
      loadAnalytics(),
      loadThreads()
    ]);
  }

  function requestCatFaceId(imageDataUrl) {
    return api("/rescue/cat-face/identify", {
      method: "POST",
      body: JSON.stringify({
        image_data_url: imageDataUrl
      })
    });
  }

  function maybeRegisterEmbedding(cat) {
    if (!state.currentGeneratedEmbedding || !cat) {
      return Promise.resolve();
    }

    return api("/rescue/cat-face/register", {
      method: "POST",
      body: JSON.stringify({
        cat_id: cat.id,
        embedding: state.currentGeneratedEmbedding,
        face_code: cat.face_code || state.currentGeneratedFaceId,
        source_photo_url: state.currentCatPhoto || null
      })
    }).catch(function () {
      return null;
    }).finally(function () {
      state.currentGeneratedEmbedding = null;
    });
  }

  function saveCatForm() {
    const payload = {
      name: catNameInput.value.trim(),
      display_id: catIdInput.value.trim() || undefined,
      gender: catGenderInput.value,
      breed: catBreedInput.value.trim(),
      age: catAgeInput.value.trim(),
      status: catStatusInput.value,
      location: catLocationInput.value.trim(),
      health: catHealthInput.value.trim(),
      personality: catPersonalityInput.value.trim(),
      notes: catNotesInput.value.trim(),
      photo_url: state.currentCatPhoto || undefined,
      tags: catPersonalityInput.value.split(",").map(function (tag) {
        return tag.trim();
      }).filter(Boolean)
    };

    if (!payload.name) {
      window.alert("Please enter the cat name.");
      return;
    }

    catFormSaveBtn.disabled = true;

    const request = state.editingCatId
      ? api("/rescue/cats/" + encodeURIComponent(state.editingCatId), {
          method: "PUT",
          body: JSON.stringify(payload)
        })
      : api("/rescue/cats", {
          method: "POST",
          body: JSON.stringify(payload)
        });

    request
      .then(function (cat) {
        return maybeRegisterEmbedding(cat).then(function () {
          return refreshAll();
        });
      })
      .then(function () {
        setCatFormOpen(false);
        resetCatForm();
      })
      .catch(function (error) {
        window.alert(error.message || "Unable to save cat.");
      })
      .finally(function () {
        catFormSaveBtn.disabled = false;
      });
  }

  function reviewApplication(applicationId, status) {
    const note = status === "rejected"
      ? window.prompt("Optional reject note:", "") || ""
      : "";

    api("/rescue/applications/" + encodeURIComponent(applicationId) + "/review", {
      method: "PUT",
      body: JSON.stringify({
        status: status,
        message: note
      })
    }).then(function () {
      if (state.activeApplicationId === applicationId) {
        closeApplicationDetail();
      }
      return refreshAll();
    }).catch(function (error) {
      window.alert(error.message || "Unable to update application.");
    });
  }

  function ensureConversationForApplication(application) {
    return api("/chat/conversations", {
      method: "POST",
      body: JSON.stringify({
        user_id: application.user_id
      })
    });
  }

  function contactApplicant(applicationId) {
    const application = applicationToViewModel(state.applicationsById[applicationId] || {});
    if (!application.user_id) return;

    ensureConversationForApplication(application)
      .then(function (conversation) {
        return loadThreads().then(function () {
          closeApplicationDetail();
          activateSection("notifications");
          openThread(conversation.id);
        });
      })
      .catch(function (error) {
        window.alert(error.message || "Unable to create conversation.");
      });
  }

  function sendMessage() {
    if (!state.activeThreadId) return;

    const content = notifMessageInput.value.trim();
    if (!content && !state.pendingImages.length) return;

    notifSendBtn.disabled = true;
    api("/chat/conversations/" + encodeURIComponent(state.activeThreadId) + "/messages", {
      method: "POST",
      body: JSON.stringify({
        content: content,
        attachments: state.pendingImages.map(function (image) {
          return {
            file_url: image.src,
            file_type: "image/*"
          };
        })
      })
    }).then(function () {
      notifMessageInput.value = "";
      state.pendingImages = [];
      notifImageInput.value = "";
      renderPendingImages();
      return loadThreads().then(function () {
        openThread(state.activeThreadId);
      });
    }).catch(function (error) {
      window.alert(error.message || "Unable to send message.");
    }).finally(function () {
      notifSendBtn.disabled = false;
    });
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
      return;
    }

    setCatFormOpen(false);
    resetCatForm();
  });

  catFormCancelBtn.addEventListener("click", function () {
    setCatFormOpen(false);
    resetCatForm();
  });

  catFormSaveBtn.addEventListener("click", saveCatForm);
  openFaceIdBtn.addEventListener("click", openFaceRecognitionModal);
  faceIdCloseBtn.addEventListener("click", closeFaceRecognitionModal);
  faceIdCancelBtn.addEventListener("click", closeFaceRecognitionModal);
  faceIdOverlay.addEventListener("click", function (event) {
    if (event.target === faceIdOverlay) closeFaceRecognitionModal();
  });

  catPhotoInput.addEventListener("change", function (event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (loadEvent) {
      setPhotoPreview(loadEvent.target.result);
    };
    reader.readAsDataURL(file);
  });

  faceIdImageInput.addEventListener("change", function (event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (loadEvent) {
      const imageDataUrl = loadEvent.target.result;
      facePreviewImage.src = imageDataUrl;
      facePreviewImage.hidden = false;
      facePreviewPlaceholder.hidden = true;
      generatedFaceId.textContent = "Analyzing cat face...";
      generatedFaceId.title = "";
      useFaceIdBtn.disabled = true;

      requestCatFaceId(imageDataUrl).then(function (result) {
        const matchedFaceCode = result.best_match && result.best_match.cat && result.best_match.cat.face_code || "";
        state.currentGeneratedFaceId = matchedFaceCode || result.suggested_face_code || "";
        state.currentGeneratedEmbedding = Array.isArray(result.embedding) ? result.embedding : null;

        if (result.matched && matchedFaceCode) {
          generatedFaceId.textContent = "Matched existing cat: " + matchedFaceCode;
        } else if (state.currentGeneratedFaceId) {
          generatedFaceId.textContent = state.currentGeneratedFaceId;
        } else {
          generatedFaceId.textContent = "No cat face detected";
        }

        generatedFaceId.title = result.note || "";
        useFaceIdBtn.disabled = !state.currentGeneratedFaceId;
      }).catch(function (error) {
        state.currentGeneratedFaceId = "";
        state.currentGeneratedEmbedding = null;
        generatedFaceId.textContent = error.message || "Cat face recognition failed";
      });
    };
    reader.readAsDataURL(file);
  });

  useFaceIdBtn.addEventListener("click", function () {
    if (!state.currentGeneratedFaceId) return;
    catIdInput.value = state.currentGeneratedFaceId;
    closeFaceRecognitionModal();
  });

  catListBody.addEventListener("click", function (event) {
    const profileButton = event.target.closest("[data-cat-profile]");
    if (profileButton) {
      openCatProfile(profileButton.getAttribute("data-cat-profile"));
      return;
    }

    const editButton = event.target.closest("[data-cat-edit]");
    if (editButton) {
      fillCatForm(editButton.getAttribute("data-cat-edit"));
    }
  });

  catProfileCloseBtn.addEventListener("click", closeCatProfile);
  catProfileOverlay.addEventListener("click", function (event) {
    if (event.target === catProfileOverlay) closeCatProfile();
  });

  applicationListBody.addEventListener("click", function (event) {
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

  dashboardRecentRecords.addEventListener("click", function (event) {
    const detailButton = event.target.closest("[data-application-detail]");
    if (detailButton) {
      activateSection("application-review");
      openApplicationDetail(detailButton.getAttribute("data-application-detail"));
    }
  });

  dashboardAttentionList.addEventListener("click", function (event) {
    const threadButton = event.target.closest("[data-thread-id]");
    if (threadButton) {
      activateSection("notifications");
      openThread(threadButton.getAttribute("data-thread-id"));
      return;
    }

    const applicationButton = event.target.closest("[data-application-detail]");
    if (applicationButton) {
      activateSection("application-review");
      openApplicationDetail(applicationButton.getAttribute("data-application-detail"));
    }
  });

  applicationCloseBtn.addEventListener("click", closeApplicationDetail);
  applicationDetailOverlay.addEventListener("click", function (event) {
    if (event.target === applicationDetailOverlay) closeApplicationDetail();
  });
  applicationContactBtn.addEventListener("click", function () {
    if (state.activeApplicationId) {
      contactApplicant(state.activeApplicationId);
    }
  });

  notifSearchInput.addEventListener("input", renderThreadList);
  notifList.addEventListener("click", function (event) {
    const item = event.target.closest("[data-thread-id]");
    if (item) {
      openThread(item.getAttribute("data-thread-id"));
    }
  });
  notifSendBtn.addEventListener("click", sendMessage);
  notifMessageInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });
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
      state.pendingImages = state.pendingImages.concat(images).slice(0, 6);
      renderPendingImages();
      notifImageInput.value = "";
    });
  });
  notifImagePreview.addEventListener("click", function (event) {
    const removeButton = event.target.closest("[data-remove-image]");
    if (!removeButton) return;

    const removeIndex = Number(removeButton.getAttribute("data-remove-image"));
    state.pendingImages = state.pendingImages.filter(function (_, index) {
      return index !== removeIndex;
    });
    renderPendingImages();
  });
  notifCloseBtn.addEventListener("click", closeThread);
  notifOverlay.addEventListener("click", function (event) {
    if (event.target === notifOverlay) closeThread();
  });

  if (notifActionButtons[0]) {
    notifActionButtons[0].addEventListener("click", function () {
      const activeThread = state.threads.find(function (thread) {
        return thread.id === state.activeThreadId;
      });
      if (activeThread) {
        activeThread.unread = false;
        renderThreadList();
      }
    });
  }

  if (notifActionButtons[1]) {
    notifActionButtons[1].addEventListener("click", function () {
      const targetApplication = state.applications.find(function (application) {
        return application.user && application.user.id === state.activeThreadUserId;
      });
      if (!targetApplication) return;
      closeThread();
      activateSection("application-review");
      openApplicationDetail(targetApplication.id);
    });
  }

  if (orgLogoutBtn) {
    orgLogoutBtn.addEventListener("click", function () {
      localStorage.removeItem("catface_org_token");
      localStorage.removeItem("catface_token");
      localStorage.removeItem("catface_org_profile");
      window.location.href = "org-login.html";
    });
  }

  refreshAll().catch(function (error) {
    window.alert(error.message || "Unable to load rescue dashboard data.");
  });
})();
if (false) {
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
    if (typeof cat.id === "string" && cat.id.indexOf("CAT-") === 0) {
      return cat.id;
    }
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
      display_id: displayId,
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

  function resetFaceRecognitionModal() {
    currentGeneratedFaceId = "";
    generatedFaceId.textContent = "Waiting for image upload";
    generatedFaceId.title = "";
    useFaceIdBtn.disabled = true;
    facePreviewImage.src = "";
    facePreviewImage.hidden = true;
    facePreviewPlaceholder.hidden = false;
    faceIdImageInput.value = "";
  }

  async function requestCatFaceId(imageDataUrl) {
    const payload = await apiRequest("/rescue/cat-face-id", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        image_data_url: imageDataUrl
      })
    });

    return payload;
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
    reader.onload = async function (loadEvent) {
      facePreviewImage.src = loadEvent.target.result;
      facePreviewImage.hidden = false;
      facePreviewPlaceholder.hidden = true;

      currentGeneratedFaceId = "";
      useFaceIdBtn.disabled = true;
      generatedFaceId.textContent = "Generating Cat Face ID...";

      try {
        const result = await requestCatFaceId(loadEvent.target.result);
        currentGeneratedFaceId = result.generated_id || "";
        generatedFaceId.textContent = currentGeneratedFaceId || "Cat Face ID unavailable";
        generatedFaceId.title = result.note || "";
        useFaceIdBtn.disabled = !currentGeneratedFaceId;
      } catch (error) {
        generatedFaceId.textContent = error.message || "Cat Face ID unavailable";
        generatedFaceId.title = "";
        window.alert("Cat Face ID generation failed: " + error.message);
      }
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
}
