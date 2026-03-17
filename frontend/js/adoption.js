/**
 * adoption.js — Adoption page logic (Member 2)
 *
 * Handles swipe cards, liked-cats panel, preferences modal, apply-to-adopt
 * form, and real backend API calls.
 *
 * If the backend is not running the page still works with built-in demo data.
 * API calls are layered on top and activate automatically when the server is up.
 */
(function () {

  function runAdoptionPage() {

  // ─── 1. Built-in demo cat data (used when backend is unavailable) ─────────
  const demoCats = {
    orange: {
      id: "orange", catId: "CAT-001",
      name: "Orange", title: "Orange Boy",
      age: "1 year", gender: "Male",
      breed: "Domestic Shorthair", birthday: "2025-02-14",
      personalityProfile: "Friendly and playful", spayedNeutered: "Yes",
      vaccinationStatus: "Core vaccines completed",
      foundLocation: "Market district rescue zone",
      allergyHistory: "No known allergies",
      temperament: "Affectionate, friendly, playful", status: "Available",
      image: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&h=1000&q=80",
      summary: "A rescue-center favourite with a gentle temperament and strong interest in people.",
      rescueOrg: "XX District Stray Cat Rescue Center",
      rescueNotes: "Rescued from a market area, adapted quickly to indoor foster care.",
      accountNote: "This cat account collects Orange's rescue timeline, health updates, and adoption requirements.",
      tags: ["Friendly", "Good for First-Time Owners", "Indoor Ready"],
      requirements: ["Indoor home only", "Stable adopter contact information", "Allow 2-week adjustment period"],
      updates: ["2026-03-02: Booster vaccination and routine health review.", "2026-02-20: Strong appetite and playful daily routine reported.", "2026-02-10: New personality assessment uploaded."]
    },
    shadow: {
      id: "shadow", catId: "CAT-002",
      name: "Shadow", title: "Tuxedo Cat",
      age: "3 years", gender: "Male",
      breed: "Tuxedo Domestic Cat", birthday: "2022-09-03",
      personalityProfile: "Quiet and observant", spayedNeutered: "Yes",
      vaccinationStatus: "Vaccinated, booster pending",
      foundLocation: "Park-side rescue point",
      allergyHistory: "Mild chicken sensitivity",
      temperament: "Shy at first, affectionate after bonding", status: "Available",
      image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&h=1000&q=80",
      summary: "A calm tuxedo cat who needs patience and rewards trust with deep attachment.",
      rescueOrg: "Shadow Park Foster Network",
      rescueNotes: "Rescued near a park; recommend an adopter with some cat-care experience.",
      accountNote: "Shadow's account focuses on trust-building updates and long-term temperament observations.",
      tags: ["Experienced Adopter Preferred", "Quiet Home", "Slow Warm-Up"],
      requirements: ["Low-noise environment", "Understand shy-cat adjustment behaviour", "Home visit or virtual check before approval"],
      updates: ["2026-03-01: Started sleeping near the foster's desk.", "2026-02-24: Improved confidence around visitors.", "2026-02-06: New enrichment toys introduced."]
    },
    tiger: {
      id: "tiger", catId: "CAT-004",
      name: "Tiger", title: "Tabby Kitten",
      age: "6 months", gender: "Male",
      breed: "Tabby Domestic Shorthair", birthday: "2025-09-01",
      personalityProfile: "Energetic and social", spayedNeutered: "Yes",
      vaccinationStatus: "Kitten vaccination schedule in progress",
      foundLocation: "Shelter intake transfer",
      allergyHistory: "No known allergies",
      temperament: "Energetic, curious, social", status: "Available",
      image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&h=1000&q=80",
      summary: "A young kitten with high energy and strong play needs, ideal for an active household.",
      rescueOrg: "XX Animal Shelter",
      rescueNotes: "Transferred from shelter intake into foster; quickly showed strong social behaviour.",
      accountNote: "Tiger's account shows growth updates, play habits, and suitability notes for family adopters.",
      tags: ["Good with Kids", "Very Active", "Playful"],
      requirements: ["Daily play and enrichment", "Kitten-proof indoor space", "Active family ready for regular interaction"],
      updates: ["2026-03-03: New play-session photos uploaded.", "2026-02-18: Normal weight and appetite growth.", "2026-02-01: First socialisation milestone completed."]
    },
    whiskers: {
      id: "whiskers", catId: "CAT-003",
      name: "Whiskers", title: "Senior Cat",
      age: "8 years", gender: "Female",
      breed: "Domestic Shorthair", birthday: "2017-06-11",
      personalityProfile: "Gentle and calm", spayedNeutered: "Yes",
      vaccinationStatus: "Senior vaccine review needed",
      foundLocation: "Owner-care transition case",
      allergyHistory: "Sensitive to dust",
      temperament: "Calm, gentle, quiet", status: "Available",
      image: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&h=1000&q=80",
      summary: "A mature companion cat who prefers slow routines, quiet affection, and predictable surroundings.",
      rescueOrg: "XX Senior Cat Rescue",
      rescueNotes: "Entered rescue after an owner-care transition; adjusted well to a peaceful foster home.",
      accountNote: "Whiskers' account highlights senior care routines, wellness checks, and daily comfort needs.",
      tags: ["Quiet Home Preferred", "Senior Friendly", "Low Activity"],
      requirements: ["Quiet indoor household", "Routine wellness check commitment", "Comfortable with senior cat care"],
      updates: ["2026-03-04: Updated senior wellness report.", "2026-02-22: Excellent appetite and rest schedule.", "2026-02-11: New comfort-bed photos uploaded."]
    },
    snow: {
      id: "snow", catId: "CAT-005",
      name: "Snow", title: "White Persian Mix",
      age: "1 month", gender: "Female",
      breed: "White Persian Mix", birthday: "2026-01-28",
      personalityProfile: "Gentle and sensitive", spayedNeutered: "No",
      vaccinationStatus: "First vaccination dose completed",
      foundLocation: "Owner surrender intake",
      allergyHistory: "No allergy record",
      temperament: "Gentle, young, sensitive", status: "Available",
      image: "https://images.unsplash.com/photo-1517331156700-3c241d2b4d83?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&h=1000&q=80",
      summary: "A very young kitten who needs attentive care, a clean indoor setup, and regular grooming support.",
      rescueOrg: "XX Cat Rescue",
      rescueNotes: "Owner surrender case; under foster observation for healthy early development.",
      accountNote: "Snow's account tracks kitten-stage health milestones and grooming needs.",
      tags: ["Kitten Care", "Needs Grooming", "Quiet Environment"],
      requirements: ["Understand kitten feeding and follow-up vaccination", "Indoor-only environment", "Commit to grooming and regular updates"],
      updates: ["2026-03-05: Feeding and sleep routine notes added.", "2026-02-26: First vaccination dose recorded.", "2026-02-12: Intake notes and owner-surrender summary uploaded."]
    }
  };

  // ─── 2. DOM references ────────────────────────────────────────────────────
  const stack            = document.getElementById("card-stack");
  if (!stack) return;
  const deckWrapper      = document.getElementById("deck-wrapper");

  const nopeBtn          = document.querySelector(".swipe-btn.nope");
  const likeBtn          = document.querySelector(".swipe-btn.like");
  const openLikedPanelBtn = document.getElementById("open-liked-panel");
  const likedList        = document.getElementById("liked-list");
  const likedFullList    = document.getElementById("liked-full-list");
  const openLikedListLink = document.getElementById("open-liked-list-link");
  const likedCountTop    = document.getElementById("liked-count-top");
  const likedCountSide   = document.getElementById("liked-count-side");

  const likeToast        = document.getElementById("like-toast");
  const toastTitle       = document.getElementById("toast-title");
  const toastCopy        = document.getElementById("toast-copy");
  const toastOpenProfile = document.getElementById("toast-open-profile");
  const toastOpenLiked   = document.getElementById("toast-open-liked");

  const profileOverlay   = document.getElementById("profile-overlay");
  const likedOverlay     = document.getElementById("liked-overlay");
  const contactOverlay   = document.getElementById("contact-overlay");
  const applyOverlay     = document.getElementById("apply-overlay");
  const prefOverlay      = document.getElementById("pref-overlay");

  const profileImage        = document.getElementById("profile-image");
  const profileStatus       = document.getElementById("profile-status");
  const profileName         = document.getElementById("profile-name");
  const profileShort        = document.getElementById("profile-short");
  const profileAccountNote  = document.getElementById("profile-account-note");
  const profileOrg          = document.getElementById("profile-org");
  const profileTags         = document.getElementById("profile-tags");
  const profileCatId        = document.getElementById("profile-cat-id");
  const profileCatNameValue = document.getElementById("profile-cat-name-value");
  const profileBreed        = document.getElementById("profile-breed");
  const profileGender       = document.getElementById("profile-gender");
  const profileAge          = document.getElementById("profile-age");
  const profileBirthday     = document.getElementById("profile-birthday");
  const profilePersonality  = document.getElementById("profile-personality");
  const profileSpayed       = document.getElementById("profile-spayed");
  const profileVaccinationStatus = document.getElementById("profile-vaccination-status");
  const profileFoundLocation     = document.getElementById("profile-found-location");
  const profileAllergyHistory    = document.getElementById("profile-allergy-history");
  const profileAdoptionStatus    = document.getElementById("profile-adoption-status");
  const profileDisplayPhoto      = document.getElementById("profile-display-photo");
  const profileReqCard  = document.getElementById("profile-requirements-card");
  const profileReqList  = document.getElementById("profile-requirements-list");
  const profileUpdCard  = document.getElementById("profile-updates-card");
  const profileUpdList  = document.getElementById("profile-updates-list");

  const contactTitle      = document.getElementById("contact-title");
  const contactSubtitle   = document.getElementById("contact-subtitle");
  const applySubtitle     = document.getElementById("apply-subtitle");
  const contactForm       = document.getElementById("contact-form");
  const applyForm         = document.getElementById("apply-form");
  const applyStatus       = document.getElementById("apply-status");
  const chatThread        = document.getElementById("chat-thread");
  const chatStatusBadge   = document.getElementById("chat-status-badge");
  const chatCatImage      = document.getElementById("chat-cat-image");
  const chatMessageInput  = document.getElementById("chat-message-input");
  const chatImageInput    = document.getElementById("chat-image-input");
  const chatPreview       = document.getElementById("chat-preview");
  const chatApplyLink     = document.getElementById("chat-apply-link");
  const contactOrgBtn     = document.getElementById("contact-org-btn");
  const applyAdoptBtn     = document.getElementById("apply-adopt-btn");

  const btnPref     = document.getElementById("btn-pref");
  const btnPrefSave = document.getElementById("btn-pref-save");
  const prefStatus  = document.getElementById("pref-status");

  // ─── 3. Runtime state ────────────────────────────────────────────────────
  const likedCats       = [];
  const conversations   = {};
  let activeCatId       = null;
  let toastTimer        = null;
  let isAnimating       = false;
  let pendingChatImages = [];
  const likedPreviewLimit = 2;

  // ─── 4. Utility helpers ──────────────────────────────────────────────────
  function getCurrentCard() {
    return stack.querySelector(".cat-card:first-child");
  }

  function getCardId(card) {
    return card ? card.getAttribute("data-cat-id") : null;
  }

  function openModal(overlay) {
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeModal(overlay) {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function formatTime(value) {
    const date = typeof value === "string" ? new Date(value) : value;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // ─── 5. API helpers (graceful fallback if backend is offline) ─────────────
  async function apiPost(path, body) {
    const headers = (typeof getAuthHeaders === "function")
      ? getAuthHeaders()
      : { "Content-Type": "application/json" };
    const res = await fetch((typeof API_BASE_URL !== "undefined" ? API_BASE_URL : "http://localhost:3000/api") + path, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    return res.json();
  }

  async function apiGet(path) {
    const headers = (typeof getAuthHeaders === "function")
      ? getAuthHeaders()
      : { "Content-Type": "application/json" };
    const res = await fetch((typeof API_BASE_URL !== "undefined" ? API_BASE_URL : "http://localhost:3000/api") + path, { headers });
    return res.json();
  }

  // Record a swipe action in the backend (fire-and-forget, does not block UI)
  async function apiRecordSwipe(catId, direction) {
    try {
      await apiPost("/adoption/swipe", { cat_id: catId, direction });
    } catch (err) {
      console.warn("apiRecordSwipe failed (backend may be offline):", err.message);
    }
  }

  // Save adoption preferences to backend
  async function apiSavePreferences(prefs) {
    try {
      const result = await apiPost("/adoption/preferences", prefs);
      return result.success;
    } catch (err) {
      console.warn("apiSavePreferences failed:", err.message);
      return false;
    }
  }

  // Submit a formal adoption application to backend
  async function apiSubmitApplication(catId, formData) {
    try {
      const result = await apiPost("/adoption/applications", {
        cat_id: catId,
        message: [
          "Name: " + formData.name,
          "Phone: " + formData.phone,
          "Experience: " + formData.experience,
          "Home: " + formData.home,
          "Reason: " + formData.reason
        ].join("\n")
      });
      return result.success;
    } catch (err) {
      console.warn("apiSubmitApplication failed:", err.message);
      return false;
    }
  }

  // Optionally refresh card stack with live API data on load
  async function tryLoadCatsFromApi() {
    try {
      const result = await apiGet("/cats?is_available=true");
      if (!result.success || !result.data || !result.data.length) return;

      // Map API cat objects into the same shape as demoCats
      result.data.forEach(function (c) {
        if (demoCats[c.id]) return; // skip if already have a demo entry
        demoCats[c.id] = {
          id: c.id,
          catId: c.id.toUpperCase(),
          name: c.name || "Unknown",
          title: c.breed || "Cat",
          age: c.age_months ? c.age_months + " months" : "Unknown age",
          gender: c.gender || "Unknown",
          breed: c.breed || "Mixed",
          birthday: c.birth_date || "Unknown",
          personalityProfile: c.personality || "Friendly",
          spayedNeutered: c.is_neutered ? "Yes" : "No",
          vaccinationStatus: c.vaccination_status || "Please enquire",
          foundLocation: c.found_location || "Rescue centre",
          allergyHistory: "Please enquire",
          temperament: c.personality || "Friendly",
          status: c.is_available ? "Available" : "Adopted",
          image: c.photo_url || "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=900&q=80",
          summary: c.description || "A cat looking for a loving home.",
          rescueOrg: c.organization ? c.organization.name : "Rescue Organisation",
          rescueNotes: c.description || "",
          accountNote: "View this cat's rescue record and health notes.",
          tags: (c.tags || []).map(function (t) { return t.tag || t; }),
          requirements: [],
          updates: []
        };
      });
    } catch (err) {
      console.info("Backend not reachable, using demo data:", err.message);
    }
  }

  // ─── 6. Chat / contact modal helpers ─────────────────────────────────────
  function getOrgReply(cat, userMessage) {
    if ((userMessage.text || "").trim()) {
      return "Thanks for contacting " + cat.rescueOrg + " about " + cat.name +
        ". We received your message and will review it before guiding you to the next adoption step.";
    }
    return "We received your images for " + cat.name + ". The rescue team will review them shortly.";
  }

  function createConversation(cat) {
    return {
      status: "Awaiting your message",
      messages: [
        {
          sender: "system",
          text: "Conversation created for " + cat.name + ". Introduce yourself and share why you are interested.",
          images: [],
          time: new Date().toISOString()
        },
        {
          sender: "org",
          text: "Hello, this is " + cat.rescueOrg + ". Feel free to ask about " + cat.name + "'s personality, health, or adoption requirements.",
          images: [],
          time: new Date().toISOString()
        }
      ]
    };
  }

  function ensureConversation(catId) {
    if (!conversations[catId]) {
      conversations[catId] = createConversation(demoCats[catId]);
    }
    return conversations[catId];
  }

  function renderChatPreview() {
    if (!chatPreview) return;
    if (!pendingChatImages.length) {
      chatPreview.hidden = true;
      chatPreview.innerHTML = "";
      return;
    }
    chatPreview.hidden = false;
    chatPreview.innerHTML = pendingChatImages.map(function (image, index) {
      return [
        '<div class="chat-preview-item" data-preview-index="' + index + '">',
        '  <img src="' + image.src + '" alt="' + escapeHtml(image.name) + '">',
        '  <button type="button" aria-label="Remove image">×</button>',
        '</div>'
      ].join("");
    }).join("");
  }

  function renderChatThread(catId) {
    const conversation = ensureConversation(catId);
    const cat = demoCats[catId];
    if (!chatThread) return;

    if (chatCatImage) { chatCatImage.src = cat.image; chatCatImage.alt = cat.name + " avatar"; }
    if (contactTitle) contactTitle.textContent = "Chat about " + cat.name;
    if (contactSubtitle) contactSubtitle.textContent = cat.rescueOrg + " can review your messages before moving the adoption forward.";
    if (chatStatusBadge) chatStatusBadge.textContent = conversation.status;

    chatThread.innerHTML = conversation.messages.map(function (message) {
      const textHtml = message.text
        ? '<div class="chat-bubble">' + escapeHtml(message.text).replace(/\n/g, "<br>") + "</div>"
        : "";
      const imagesHtml = message.images && message.images.length
        ? '<div class="chat-images">' + message.images.map(function (img) {
            return '<img src="' + img.src + '" alt="' + escapeHtml(img.name || "Chat image") + '">';
          }).join("") + "</div>"
        : "";
      return [
        '<div class="chat-message ' + message.sender + '">',
        textHtml, imagesHtml,
        '<div class="chat-meta">' + formatTime(message.time) + "</div>",
        "</div>"
      ].join("");
    }).join("");

    chatThread.scrollTop = chatThread.scrollHeight;
  }

  function resetChatComposer() {
    if (chatMessageInput) chatMessageInput.value = "";
    if (chatImageInput) chatImageInput.value = "";
    pendingChatImages = [];
    renderChatPreview();
  }

  // ─── 7. Liked-cats panel ─────────────────────────────────────────────────
  function renderLikedItem(cat) {
    return [
      '<article class="liked-item" data-liked-id="' + cat.id + '">',
      '  <div class="liked-item-top">',
      '    <div>',
      '      <h3>' + escapeHtml(cat.name) + ' · ' + escapeHtml(cat.title) + '</h3>',
      '      <small>' + escapeHtml(cat.age) + ' · ' + escapeHtml(cat.gender) + ' · ' + escapeHtml(cat.temperament) + '</small>',
      '    </div>',
      '    <span class="pill-status">Saved</span>',
      '  </div>',
      '  <small>' + escapeHtml(cat.summary) + '</small>',
      '  <div class="liked-item-actions">',
      '    <button class="ghost-btn open-liked-profile" type="button">View Full Profile</button>',
      '    <button class="ghost-btn open-liked-contact" type="button">Contact Organisation</button>',
      '  </div>',
      '</article>'
    ].join("");
  }

  function updateLikedUI() {
    if (likedCountTop) likedCountTop.textContent = likedCats.length;
    if (likedCountSide) likedCountSide.textContent = likedCats.length;

    if (!likedCats.length) {
      if (likedList) likedList.innerHTML = '<div class="empty-state">No liked cats yet. Swipe right on a cat to save it here.</div>';
      if (likedFullList) likedFullList.innerHTML = '<div class="empty-state">No liked cats yet. Swipe right on a cat to save it here.</div>';
      if (openLikedListLink) openLikedListLink.hidden = true;
      return;
    }

    if (likedList) likedList.innerHTML = likedCats.slice(0, likedPreviewLimit).map(function (id) {
      return renderLikedItem(demoCats[id]);
    }).join("");

    if (likedFullList) likedFullList.innerHTML = likedCats.map(function (id) {
      return renderLikedItem(demoCats[id]);
    }).join("");

    if (openLikedListLink) {
      if (likedCats.length > likedPreviewLimit) {
        openLikedListLink.hidden = false;
        openLikedListLink.textContent = "Open liked cats list (" + likedCats.length + ")";
      } else {
        openLikedListLink.hidden = true;
      }
    }
  }

  function showToast(cat) {
    toastTitle.textContent = cat.name + " was added to your liked cats";
    toastCopy.textContent = "Open " + cat.name + "'s full account to view rescue notes and continue the adoption flow.";
    likeToast.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      likeToast.classList.remove("show");
    }, 5000);
  }

  function ensureLiked(catId) {
    if (likedCats.indexOf(catId) === -1) {
      likedCats.unshift(catId);
      updateLikedUI();
    }
  }

  // ─── 8. Profile modal ────────────────────────────────────────────────────
  function renderProfile(catId) {
    const cat = demoCats[catId];
    if (!cat) return;
    activeCatId = catId;

    profileImage.src = cat.image;
    profileImage.alt = cat.name + " profile image";
    profileStatus.textContent = cat.status;
    profileName.textContent = cat.name;
    profileShort.textContent = (cat.catId || cat.id.toUpperCase()) + " · " + cat.breed;
    profileAccountNote.textContent = cat.summary;
    profileOrg.textContent = "Rescue organisation: " + cat.rescueOrg;
    profileCatId.textContent = cat.catId || cat.id.toUpperCase();
    profileCatNameValue.textContent = cat.name;
    profileBreed.textContent = cat.breed;
    profileGender.textContent = cat.gender;
    profileAge.textContent = cat.age;
    profileBirthday.textContent = cat.birthday || "Unknown";
    profilePersonality.textContent = cat.personalityProfile || cat.temperament;
    profileSpayed.textContent = cat.spayedNeutered || "Not provided";
    profileVaccinationStatus.textContent = cat.vaccinationStatus;
    profileFoundLocation.textContent = cat.foundLocation || "Not provided";
    profileAllergyHistory.textContent = cat.allergyHistory || "No allergy record";
    profileAdoptionStatus.textContent = cat.status;
    profileDisplayPhoto.src = cat.image;
    profileDisplayPhoto.alt = cat.name + " display photo";

    profileTags.innerHTML = (cat.tags || []).map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");

    // Requirements list
    if (cat.requirements && cat.requirements.length) {
      profileReqList.innerHTML = cat.requirements.map(function (r) {
        return "<li>" + escapeHtml(r) + "</li>";
      }).join("");
      profileReqCard.style.display = "";
    } else {
      profileReqCard.style.display = "none";
    }

    // Recent updates timeline
    if (cat.updates && cat.updates.length) {
      profileUpdList.innerHTML = cat.updates.map(function (u) {
        return '<div class="timeline-item">' + escapeHtml(u) + "</div>";
      }).join("");
      profileUpdCard.style.display = "";
    } else {
      profileUpdCard.style.display = "none";
    }
  }

  function openProfile(catId) {
    if (!demoCats[catId]) return;
    ensureLiked(catId);
    renderProfile(catId);
    openModal(profileOverlay);
  }

  // ─── 9. Contact modal ────────────────────────────────────────────────────
  function openContact(catId) {
    if (!demoCats[catId]) return;
    activeCatId = catId;
    ensureConversation(catId);
    resetChatComposer();
    renderChatThread(catId);
    openModal(contactOverlay);
  }

  // ─── 10. Apply modal ─────────────────────────────────────────────────────
  function openApply(catId) {
    if (!demoCats[catId]) return;
    const cat = demoCats[catId];
    activeCatId = catId;
    applySubtitle.textContent = "Submit a formal adoption request for " + cat.name + ". The rescue organisation will review your application.";
    applyStatus.classList.remove("show");
    applyStatus.textContent = "";
    applyForm.reset();
    openModal(applyOverlay);
  }

  // ─── 11. Swipe animation ─────────────────────────────────────────────────
  function swipe(direction) {
    if (isAnimating) return;
    const current = getCurrentCard();
    if (!current) return;

    const currentCatId = getCardId(current);
    isAnimating = true;

    if (direction === "left" && nopeBtn) {
      nopeBtn.classList.add("is-active");
      setTimeout(function () { nopeBtn.classList.remove("is-active"); }, 260);
    }

    if (direction === "right" && likeBtn) {
      likeBtn.classList.add("is-active");
      setTimeout(function () { likeBtn.classList.remove("is-active"); }, 260);
      ensureLiked(currentCatId);
      showToast(demoCats[currentCatId]);
      apiRecordSwipe(currentCatId, "like");
    } else if (direction === "left") {
      apiRecordSwipe(currentCatId, "pass");
    }

    current.style.transition = "";
    current.style.transform = "";
    const cls = direction === "right" ? "swipe-right" : "swipe-left";
    current.classList.add(cls);

    current.addEventListener("transitionend", function handler() {
      current.removeEventListener("transitionend", handler);
      current.classList.remove(cls);
      current.style.transition = "";
      current.classList.remove("flipped");
      stack.appendChild(current);
      isAnimating = false;
    });
  }

  // ─── 12. Per-card drag / touch gesture ───────────────────────────────────
  stack.querySelectorAll(".cat-card").forEach(function (card) {
    const profileButton = card.querySelector(".open-profile-btn");
    const cardId = getCardId(card);

    if (profileButton) {
      profileButton.addEventListener("click", function (event) {
        event.stopPropagation();
        openProfile(cardId);
      });
    }

    card.addEventListener("click", function () {
      if (isAnimating) return;
      card.classList.toggle("flipped");
    });

    let startX = null;
    let currentX = null;
    let dragging = false;

    function onPointerDown(event) {
      if (isAnimating) return;
      if (event.target.closest(".open-profile-btn")) return;
      const e = event.touches ? event.touches[0] : event;
      startX = e.clientX;
      currentX = startX;
      dragging = true;
      card.style.transition = "";
    }

    function onPointerMove(event) {
      if (!dragging || isAnimating) return;
      const e = event.touches ? event.touches[0] : event;
      currentX = e.clientX;
      const deltaX = currentX - startX;
      if (getCurrentCard() !== card) return;
      card.style.transform = "translateX(" + deltaX + "px) rotate(" + (deltaX / 15) + "deg)";
      card.style.boxShadow = "0 16px 40px rgba(0,0,0,.25)";
      if (event.cancelable) event.preventDefault();
    }

    function onPointerUp() {
      if (!dragging || isAnimating) return;
      dragging = false;
      const current = getCurrentCard();
      if (current !== card) {
        card.style.transform = "";
        card.style.boxShadow = "";
        return;
      }
      const deltaX = currentX - startX;
      if (Math.abs(deltaX) > 80) {
        card.style.transform = "";
        card.style.boxShadow = "";
        activeCatId = cardId;
        swipe(deltaX > 0 ? "right" : "left");
      } else {
        card.style.transition = "transform 0.25s ease, box-shadow 0.25s ease";
        card.style.transform = "translateX(0) rotate(0deg)";
        card.style.boxShadow = "";
        card.addEventListener("transitionend", function handle() {
          card.removeEventListener("transitionend", handle);
          card.style.transition = "";
        });
      }
    }

    card.addEventListener("mousedown", function (event) {
      if (event.button !== 0) return;
      onPointerDown(event);
      window.addEventListener("mousemove", onPointerMove);
      window.addEventListener("mouseup", function handleUp(e) {
        window.removeEventListener("mousemove", onPointerMove);
        window.removeEventListener("mouseup", handleUp);
        onPointerUp(e);
      });
    });

    card.addEventListener("touchstart",  onPointerDown, { passive: false });
    card.addEventListener("touchmove",   onPointerMove, { passive: false });
    card.addEventListener("touchend",    onPointerUp);
    card.addEventListener("touchcancel", onPointerUp);
  });

  // ─── 13. Liked-list action delegation ────────────────────────────────────
  function handleLikedListActions(event) {
    const item = event.target.closest("[data-liked-id]");
    if (!item) return;
    const catId = item.getAttribute("data-liked-id");
    if (event.target.closest(".open-liked-profile")) openProfile(catId);
    if (event.target.closest(".open-liked-contact")) openContact(catId);
  }
  if (likedList) likedList.addEventListener("click", handleLikedListActions);
  if (likedFullList) likedFullList.addEventListener("click", handleLikedListActions);

  // ─── 14. Button event listeners (use delegation so clicks work even if DOM timing varies) ─
  if (deckWrapper) {
    deckWrapper.addEventListener("click", function (event) {
      if (event.target.closest(".swipe-btn.nope")) {
        event.preventDefault();
        swipe("left");
      } else if (event.target.closest(".swipe-btn.like")) {
        event.preventDefault();
        const current = getCurrentCard();
        activeCatId = getCardId(current);
        swipe("right");
      }
    });
  } else {
    if (nopeBtn) nopeBtn.addEventListener("click", function () { swipe("left"); });
    if (likeBtn) likeBtn.addEventListener("click", function () {
      const current = getCurrentCard();
      activeCatId = getCardId(current);
      swipe("right");
    });
  }

  if (openLikedPanelBtn) openLikedPanelBtn.addEventListener("click", function () { openModal(likedOverlay); });
  if (openLikedListLink) openLikedListLink.addEventListener("click", function () { openModal(likedOverlay); });

  if (toastOpenProfile) toastOpenProfile.addEventListener("click", function () { if (activeCatId) openProfile(activeCatId); });
  if (toastOpenLiked) toastOpenLiked.addEventListener("click", function () { openModal(likedOverlay); });

  if (contactOrgBtn) contactOrgBtn.addEventListener("click", function () { if (activeCatId) openContact(activeCatId); });
  if (applyAdoptBtn) applyAdoptBtn.addEventListener("click", function () { if (activeCatId) openApply(activeCatId); });

  if (chatApplyLink) chatApplyLink.addEventListener("click", function () {
    if (!activeCatId) return;
    closeModal(contactOverlay);
    openApply(activeCatId);
  });

  // ─── 15. Chat image picker ────────────────────────────────────────────────
  if (chatPreview) chatPreview.addEventListener("click", function (event) {
    const previewItem = event.target.closest("[data-preview-index]");
    if (!previewItem || !event.target.closest("button")) return;
    const index = Number(previewItem.getAttribute("data-preview-index"));
    pendingChatImages.splice(index, 1);
    renderChatPreview();
  });

  if (chatImageInput) chatImageInput.addEventListener("change", function (event) {
    const files = Array.from(event.target.files || []).slice(0, 3);
    if (!files.length) return;
    Promise.all(files.map(function (file) {
      return new Promise(function (resolve) {
        const reader = new FileReader();
        reader.onload = function () { resolve({ name: file.name, src: reader.result }); };
        reader.readAsDataURL(file);
      });
    })).then(function (images) {
      pendingChatImages = images;
      renderChatPreview();
    });
  });

  // ─── 16. Contact form submit (simulated org reply) ─────────────────────
  if (contactForm) contactForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!activeCatId) return;
    const convCatId = activeCatId;
    const text = chatMessageInput.value.trim();
    if (!text && !pendingChatImages.length) return;

    const conversation = ensureConversation(convCatId);
    const userMessage = { sender: "user", text: text, images: pendingChatImages.slice(), time: new Date().toISOString() };
    conversation.messages.push(userMessage);
    conversation.status = "Waiting for rescue reply";
    renderChatThread(convCatId);
    resetChatComposer();

    setTimeout(function () {
      const cat = demoCats[convCatId];
      conversation.messages.push({
        sender: "org",
        text: getOrgReply(cat, userMessage),
        images: [],
        time: new Date().toISOString()
      });
      conversation.status = "Conversation active";
      if (activeCatId === convCatId) renderChatThread(convCatId);
    }, 900);
  });

  // ─── 17. Apply form submit ────────────────────────────────────────────────
  if (applyForm) applyForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const cat = demoCats[activeCatId];
    if (!cat) return;

    const formData = {
      name:       document.getElementById("apply-name").value.trim(),
      phone:      document.getElementById("apply-phone").value.trim(),
      experience: document.getElementById("apply-experience").value,
      home:       document.getElementById("apply-home").value,
      reason:     document.getElementById("apply-reason").value.trim()
    };

    const saved = await apiSubmitApplication(activeCatId, formData);

    if (applyStatus) {
      applyStatus.textContent = saved
        ? "Application submitted to the backend. The rescue organisation will review your information and contact you."
        : "Application recorded. (Note: backend is offline — your data is not yet persisted.)";
      applyStatus.textContent += " Cat: " + cat.name + " · Status: Submitted.";
      applyStatus.classList.add("show");
    }
    applyForm.reset();
  });

  // ─── 18. Preferences modal ───────────────────────────────────────────────
  if (btnPref) {
    btnPref.addEventListener("click", function () {
      if (prefOverlay) prefOverlay.classList.add("open");
      if (prefStatus) { prefStatus.classList.remove("show"); prefStatus.textContent = ""; }
    });
  }

  if (btnPrefSave) {
    btnPrefSave.addEventListener("click", async function () {
      const prefs = {
        preferred_age:    document.getElementById("pref-age").value.trim(),
        preferred_gender: document.getElementById("pref-gender").value,
        preferred_breed:  document.getElementById("pref-breed").value.trim()
      };
      const saved = await apiSavePreferences(prefs);
      if (prefStatus) {
        prefStatus.textContent = saved
          ? "Preferences saved to your account."
          : "Preferences saved locally. (Backend offline — not yet persisted.)";
        prefStatus.classList.add("show");
      }
      if (prefOverlay) setTimeout(function () { prefOverlay.classList.remove("open"); }, 1200);
    });
  }

  // Close pref overlay via data-close-pref buttons
  document.querySelectorAll("[data-close-pref]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (prefOverlay) prefOverlay.classList.remove("open");
    });
  });

  // ─── 19. Generic modal close ─────────────────────────────────────────────
  document.querySelectorAll("[data-close]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const target = document.getElementById(btn.getAttribute("data-close"));
      if (target) closeModal(target);
    });
  });

  [profileOverlay, likedOverlay, contactOverlay, applyOverlay].filter(Boolean).forEach(function (overlay) {
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) closeModal(overlay);
    });
  });
  if (prefOverlay) prefOverlay.addEventListener("click", function (event) {
    if (event.target === prefOverlay) prefOverlay.classList.remove("open");
  });

  // ─── 20. Init ─────────────────────────────────────────────────────────────
  updateLikedUI();
  const firstCard = getCurrentCard();
  if (firstCard) activeCatId = getCardId(firstCard);

  // Try to enrich demo data with live API cats (non-blocking)
  tryLoadCatsFromApi();

  // ─── 21. "Information of the cat" button → cat-profile.html with current cat id ─
  const btnInfoCat = document.getElementById("btn-info-cat");
  if (btnInfoCat) {
    btnInfoCat.addEventListener("click", function (event) {
      event.preventDefault();
      const current = getCurrentCard();
      const catId = current ? getCardId(current) : activeCatId;
      if (catId) {
        window.location.href = "cat-profile.html?id=" + encodeURIComponent(catId);
      } else {
        alert("No cat selected. Swipe to a card first.");
      }
    });
  }

  } // end runAdoptionPage

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runAdoptionPage);
  } else {
    runAdoptionPage();
  }

})();
