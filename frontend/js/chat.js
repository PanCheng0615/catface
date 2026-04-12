window.__CATFACE_EXTERNAL_ADOPTION__ = true;

(function () {
  const API_BASE_URL = window.API_BASE_URL || "http://localhost:3000/api";
  const stack = document.querySelector(".card-stack");

  if (!stack) return;

  const cats = {
    orange: {
      id: "orange",
      cat_id: "CAT-001",
      name: "Orange",
      title: "Orange Boy",
      age: "1 year",
      gender: "Male",
      breed: "Domestic Shorthair",
      birthday: "2025-02-14",
      personality: "Friendly and playful",
      spayed_neutered: "Yes",
      vaccination_status: "Core vaccines completed",
      found_location: "Market district rescue zone",
      allergy_history: "No known allergies",
      temperament: "Affectionate, friendly, playful",
      status: "Available",
      image: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&h=1000&q=80",
      summary: "A rescue-center favorite with a gentle temperament and strong interest in people.",
      rescue_org: "XX District Stray Cat Rescue Center",
      rescue_notes: "Orange was rescued from a market area and adapted quickly to indoor foster care. He enjoys wand toys and seeks human contact.",
      tags: ["Friendly", "Good for First-Time Owners", "Indoor Ready"],
      org_id: null
    },
    shadow: {
      id: "shadow",
      cat_id: "CAT-002",
      name: "Shadow",
      title: "Tuxedo Cat",
      age: "3 years",
      gender: "Male",
      breed: "Tuxedo Domestic Cat",
      birthday: "2022-09-03",
      personality: "Quiet and observant",
      spayed_neutered: "Yes",
      vaccination_status: "Vaccinated, booster pending",
      found_location: "Park-side rescue point",
      allergy_history: "Mild chicken sensitivity",
      temperament: "Shy at first, affectionate after bonding",
      status: "Available",
      image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&h=1000&q=80",
      summary: "A calm tuxedo cat who needs patience in the beginning and rewards trust with deep attachment.",
      rescue_org: "Shadow Park Foster Network",
      rescue_notes: "Shadow needs a quieter home environment and adopters who understand shy-cat adjustment behavior.",
      tags: ["Experienced Adopter Preferred", "Quiet Home", "Slow Warm-Up"],
      org_id: null
    },
    tiger: {
      id: "tiger",
      cat_id: "CAT-004",
      name: "Tiger",
      title: "Tabby Kitten",
      age: "6 months",
      gender: "Male",
      breed: "Tabby Domestic Shorthair",
      birthday: "2025-09-01",
      personality: "Energetic and social",
      spayed_neutered: "Yes",
      vaccination_status: "Kitten vaccination schedule in progress",
      found_location: "Shelter intake transfer",
      allergy_history: "No known allergies",
      temperament: "Energetic, curious, social",
      status: "Available",
      image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&h=1000&q=80",
      summary: "A young kitten with high energy and strong play needs, ideal for an active household.",
      rescue_org: "XX Animal Shelter",
      rescue_notes: "Tiger quickly showed strong social behavior with people and toys in foster care.",
      tags: ["Good with Kids", "Very Active", "Playful"],
      org_id: null
    },
    whiskers: {
      id: "whiskers",
      cat_id: "CAT-003",
      name: "Whiskers",
      title: "Senior Cat",
      age: "8 years",
      gender: "Female",
      breed: "Domestic Shorthair",
      birthday: "2017-06-11",
      personality: "Gentle and calm",
      spayed_neutered: "Yes",
      vaccination_status: "Senior vaccine review needed",
      found_location: "Owner-care transition case",
      allergy_history: "Sensitive to dust",
      temperament: "Calm, gentle, quiet",
      status: "Available",
      image: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&h=1000&q=80",
      summary: "A mature companion cat who prefers slow routines, quiet affection, and predictable surroundings.",
      rescue_org: "XX Senior Cat Rescue",
      rescue_notes: "Whiskers entered rescue after an owner-care transition and adjusted well to a peaceful foster home.",
      tags: ["Quiet Home Preferred", "Senior Friendly", "Low Activity"],
      org_id: null
    },
    snow: {
      id: "snow",
      cat_id: "CAT-005",
      name: "Snow",
      title: "White Persian Mix",
      age: "1 month",
      gender: "Female",
      breed: "White Persian Mix",
      birthday: "2026-01-28",
      personality: "Gentle and sensitive",
      spayed_neutered: "No",
      vaccination_status: "First vaccination dose completed",
      found_location: "Owner surrender intake",
      allergy_history: "No allergy record",
      temperament: "Gentle, young, sensitive",
      status: "Available",
      image: "https://images.unsplash.com/photo-1517331156700-3c241d2b4d83?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&h=1000&q=80",
      summary: "A very young kitten who needs attentive care, a clean indoor setup, and regular grooming support.",
      rescue_org: "XX Cat Rescue",
      rescue_notes: "Snow is now under foster observation to ensure healthy early development.",
      tags: ["Kitten Care", "Needs Grooming", "Quiet Environment"],
      org_id: null
    }
  };

  const nopeBtn = document.querySelector(".swipe-btn.nope");
  const likeBtn = document.querySelector(".swipe-btn.like");
  const openLikedPanelBtn = document.getElementById("open-liked-panel");
  const likedList = document.getElementById("liked-list");
  const likedFullList = document.getElementById("liked-full-list");
  const openLikedListLink = document.getElementById("open-liked-list-link");
  const likedCountTop = document.getElementById("liked-count-top");
  const likedCountSide = document.getElementById("liked-count-side");
  const likeToast = document.getElementById("like-toast");
  const toastTitle = document.getElementById("toast-title");
  const toastCopy = document.getElementById("toast-copy");
  const toastOpenProfile = document.getElementById("toast-open-profile");
  const toastOpenLiked = document.getElementById("toast-open-liked");
  const profileOverlay = document.getElementById("profile-overlay");
  const likedOverlay = document.getElementById("liked-overlay");
  const contactOverlay = document.getElementById("contact-overlay");
  const applyOverlay = document.getElementById("apply-overlay");
  const profileImage = document.getElementById("profile-image");
  const profileStatus = document.getElementById("profile-status");
  const profileName = document.getElementById("profile-name");
  const profileShort = document.getElementById("profile-short");
  const profileAccountNote = document.getElementById("profile-account-note");
  const profileOrg = document.getElementById("profile-org");
  const profileTags = document.getElementById("profile-tags");
  const profileCatId = document.getElementById("profile-cat-id");
  const profileCatNameValue = document.getElementById("profile-cat-name-value");
  const profileBreed = document.getElementById("profile-breed");
  const profileGender = document.getElementById("profile-gender");
  const profileAge = document.getElementById("profile-age");
  const profileBirthday = document.getElementById("profile-birthday");
  const profilePersonality = document.getElementById("profile-personality");
  const profileSpayed = document.getElementById("profile-spayed");
  const profileVaccinationStatus = document.getElementById("profile-vaccination-status");
  const profileFoundLocation = document.getElementById("profile-found-location");
  const profileAllergyHistory = document.getElementById("profile-allergy-history");
  const profileAdoptionStatus = document.getElementById("profile-adoption-status");
  const profileDisplayPhoto = document.getElementById("profile-display-photo");
  const contactTitle = document.getElementById("contact-title");
  const contactSubtitle = document.getElementById("contact-subtitle");
  const applySubtitle = document.getElementById("apply-subtitle");
  const contactForm = document.getElementById("contact-form");
  const applyForm = document.getElementById("apply-form");
  const applyStatus = document.getElementById("apply-status");
  const chatThread = document.getElementById("chat-thread");
  const chatStatusBadge = document.getElementById("chat-status-badge");
  const chatCatImage = document.getElementById("chat-cat-image");
  const chatMessageInput = document.getElementById("chat-message-input");
  const chatImageInput = document.getElementById("chat-image-input");
  const chatPreview = document.getElementById("chat-preview");
  const chatApplyLink = document.getElementById("chat-apply-link");
  const contactOrgBtn = document.getElementById("contact-org-btn");
  const applyAdoptBtn = document.getElementById("apply-adopt-btn");

  const likedCats = [];
  const localConversations = {};
  const remoteConversationIds = {};
  let activeCatId = null;
  let toastTimer = null;
  let isAnimating = false;
  let pendingChatImages = [];

  function getToken() {
    if (typeof window.getToken === "function") {
      return window.getToken();
    }
    return localStorage.getItem("catface_token");
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
      return {
        success: false,
        message: "Invalid server response"
      };
    });

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Request failed");
    }

    return result.data;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function openModal(overlay) {
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeModal(overlay) {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
  }

  function getCurrentCard() {
    return stack.querySelector(".cat-card:first-child");
  }

  function getCardId(card) {
    return card ? card.getAttribute("data-cat-id") : null;
  }

  function getLocalConversation(catId) {
    if (!localConversations[catId]) {
      const cat = cats[catId];
      localConversations[catId] = {
        source: "mock",
        status: "Awaiting your message",
        messages: [
          {
            sender: "system",
            text: "Conversation created for " + cat.name + ". This chat is currently using local mock data until rescue org IDs are connected.",
            images: [],
            time: new Date().toISOString()
          },
          {
            sender: "org",
            text: "Hello, this is " + cat.rescue_org + ". Feel free to ask questions about " + cat.name + ".",
            images: [],
            time: new Date().toISOString()
          }
        ]
      };
    }

    return localConversations[catId];
  }

  function mapRemoteMessage(message) {
    const senderRole = message.sender && message.sender.role;
    return {
      sender: senderRole === "rescue_staff" ? "org" : "user",
      text: message.content || "",
      images: Array.isArray(message.attachments)
        ? message.attachments.map(function (attachment) {
            return {
              name: attachment.file_type || "Image",
              src: attachment.file_url
            };
          })
        : [],
      time: message.created_at
    };
  }

  async function loadRemoteConversation(catId) {
    const cat = cats[catId];
    if (!getToken() || !cat.org_id) {
      return null;
    }

    const conversation = await apiRequest("/chat/conversations", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        org_id: cat.org_id
      })
    });

    remoteConversationIds[catId] = conversation.id;

    const messagePayload = await apiRequest(
      "/chat/conversations/" + conversation.id + "/messages",
      {
        method: "GET",
        headers: getAuthHeaders()
      }
    );

    return {
      source: "api",
      status: "Conversation active",
      messages: messagePayload.messages.map(mapRemoteMessage)
    };
  }

  async function getConversation(catId) {
    try {
      const remoteConversation = await loadRemoteConversation(catId);
      if (remoteConversation) {
        localConversations[catId] = remoteConversation;
        return remoteConversation;
      }
    } catch (error) {
      console.warn("Remote chat unavailable, falling back to mock:", error.message);
    }

    return getLocalConversation(catId);
  }

  function renderChatPreview() {
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
        "</div>"
      ].join("");
    }).join("");
  }

  function renderChatThread(catId) {
    const conversation = getLocalConversation(catId);
    const cat = cats[catId];

    chatCatImage.src = cat.image;
    chatCatImage.alt = cat.name + " avatar";
    contactTitle.textContent = "Chat about " + cat.name;
    contactSubtitle.textContent = cat.rescue_org + " can review your messages and images before moving the adoption process forward.";
    chatStatusBadge.textContent = conversation.status;

    chatThread.innerHTML = conversation.messages.map(function (message) {
      const textHtml = message.text
        ? '<div class="chat-bubble">' + escapeHtml(message.text).replace(/\n/g, "<br>") + "</div>"
        : "";
      const imageHtml = message.images && message.images.length
        ? '<div class="chat-images">' + message.images.map(function (image) {
            return '<img src="' + image.src + '" alt="' + escapeHtml(image.name || "Chat image") + '">';
          }).join("") + "</div>"
        : "";

      return [
        '<div class="chat-message ' + message.sender + '">',
        textHtml,
        imageHtml,
        '<div class="chat-meta">' + formatTime(message.time) + "</div>",
        "</div>"
      ].join("");
    }).join("");

    chatThread.scrollTop = chatThread.scrollHeight;
  }

  function resetChatComposer() {
    chatMessageInput.value = "";
    chatImageInput.value = "";
    pendingChatImages = [];
    renderChatPreview();
  }

  function renderLikedItem(cat) {
    return [
      '<article class="liked-item" data-liked-id="' + cat.id + '">',
      "  <div class=\"liked-item-top\">",
      "    <div>",
      "      <h3>" + escapeHtml(cat.name + " · " + cat.title) + "</h3>",
      "      <small>" + escapeHtml(cat.age + " · " + cat.gender + " · " + cat.temperament) + "</small>",
      "    </div>",
      '    <span class="pill-status">Saved</span>',
      "  </div>",
      "  <small>" + escapeHtml(cat.summary) + "</small>",
      '  <div class="liked-item-actions">',
      '    <button class="ghost-btn open-liked-profile" type="button">View Full Profile</button>',
      '    <button class="ghost-btn open-liked-contact" type="button">Contact Organization</button>',
      "  </div>",
      "</article>"
    ].join("");
  }

  function updateLikedUI() {
    likedCountTop.textContent = likedCats.length;
    likedCountSide.textContent = likedCats.length;

    if (!likedCats.length) {
      likedList.innerHTML = '<div class="empty-state">No liked cats yet. Swipe right on a cat to save it here and continue to profile review.</div>';
      likedFullList.innerHTML = '<div class="empty-state">No liked cats yet. Swipe right on a cat to save it here and continue to profile review.</div>';
      openLikedListLink.hidden = true;
      return;
    }

    likedList.innerHTML = likedCats.slice(0, 2).map(function (catId) {
      return renderLikedItem(cats[catId]);
    }).join("");

    likedFullList.innerHTML = likedCats.map(function (catId) {
      return renderLikedItem(cats[catId]);
    }).join("");

    openLikedListLink.hidden = likedCats.length <= 2;
    if (!openLikedListLink.hidden) {
      openLikedListLink.textContent = "Open liked cats list (" + likedCats.length + ")";
    }
  }

  function showToast(cat) {
    toastTitle.textContent = cat.name + " was added to your liked cats";
    toastCopy.textContent = "Open " + cat.name + "'s full account to view profile details and continue the rescue contact flow.";
    likeToast.classList.add("show");

    if (toastTimer) {
      clearTimeout(toastTimer);
    }

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

  function renderProfile(catId) {
    const cat = cats[catId];
    if (!cat) return;

    activeCatId = catId;
    profileImage.src = cat.image;
    profileImage.alt = cat.name + " profile image";
    profileStatus.textContent = cat.status;
    profileName.textContent = cat.name;
    profileShort.textContent = cat.cat_id + " · " + cat.breed;
    profileAccountNote.textContent = cat.summary;
    profileOrg.textContent = "Rescue organization: " + cat.rescue_org;
    profileCatId.textContent = cat.cat_id;
    profileCatNameValue.textContent = cat.name;
    profileBreed.textContent = cat.breed;
    profileGender.textContent = cat.gender;
    profileAge.textContent = cat.age;
    profileBirthday.textContent = cat.birthday;
    profilePersonality.textContent = cat.personality;
    profileSpayed.textContent = cat.spayed_neutered;
    profileVaccinationStatus.textContent = cat.vaccination_status;
    profileFoundLocation.textContent = cat.found_location;
    profileAllergyHistory.textContent = cat.allergy_history;
    profileAdoptionStatus.textContent = cat.status;
    profileDisplayPhoto.src = cat.image;
    profileDisplayPhoto.alt = cat.name + " display photo";
    profileTags.innerHTML = cat.tags.map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");
  }

  function openProfile(catId) {
    ensureLiked(catId);
    renderProfile(catId);
    openModal(profileOverlay);
  }

  async function openContact(catId) {
    const cat = cats[catId];
    if (!cat) return;

    activeCatId = catId;
    resetChatComposer();
    localConversations[catId] = await getConversation(catId);
    renderChatThread(catId);
    openModal(contactOverlay);
  }

  function openApply(catId) {
    const cat = cats[catId];
    if (!cat) return;

    activeCatId = catId;
    applySubtitle.textContent = "Submit a formal adoption request for " + cat.name + ".";
    applyStatus.classList.remove("show");
    applyStatus.textContent = "";
    openModal(applyOverlay);
  }

  function swipe(direction) {
    if (isAnimating) return;

    const current = getCurrentCard();
    if (!current) return;

    const currentCatId = getCardId(current);
    isAnimating = true;

    if (direction === "right") {
      ensureLiked(currentCatId);
      showToast(cats[currentCatId]);
      likeBtn.classList.add("is-active");
      setTimeout(function () {
        likeBtn.classList.remove("is-active");
      }, 240);
    } else {
      nopeBtn.classList.add("is-active");
      setTimeout(function () {
        nopeBtn.classList.remove("is-active");
      }, 240);
    }

    current.classList.add(direction === "right" ? "swipe-right" : "swipe-left");
    current.addEventListener("transitionend", function handler() {
      current.removeEventListener("transitionend", handler);
      current.classList.remove("swipe-right", "swipe-left", "flipped");
      stack.appendChild(current);
      isAnimating = false;
    });
  }

  async function submitRemoteMessage(catId, text, images) {
    const conversationId = remoteConversationIds[catId];
    if (!conversationId) {
      throw new Error("Missing remote conversation");
    }

    if (images.length) {
      await apiRequest("/chat/conversations/" + conversationId + "/upload", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          content: text,
          attachments: images.map(function (image) {
            return {
              file_url: image.src,
              file_type: "image"
            };
          })
        })
      });
    } else {
      await apiRequest("/chat/conversations/" + conversationId + "/messages", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          content: text
        })
      });
    }

    localConversations[catId] = await loadRemoteConversation(catId);
  }

  function submitLocalMessage(catId, text, images) {
    const conversation = getLocalConversation(catId);
    conversation.messages.push({
      sender: "user",
      text: text,
      images: images.slice(),
      time: new Date().toISOString()
    });
    conversation.status = "Waiting for rescue reply";

    setTimeout(function () {
      conversation.messages.push({
        sender: "org",
        text: "Thanks for contacting " + cats[catId].rescue_org + ". We received your message and will follow up shortly.",
        images: [],
        time: new Date().toISOString()
      });
      conversation.status = "Conversation active";
      if (activeCatId === catId) {
        renderChatThread(catId);
      }
    }, 900);
  }

  stack.querySelectorAll(".cat-card").forEach(function (card) {
    const cardId = getCardId(card);
    const profileButton = card.querySelector(".open-profile-btn");

    card.addEventListener("click", function (event) {
      if (event.target.closest(".open-profile-btn")) return;
      if (isAnimating) return;
      card.classList.toggle("flipped");
    });

    if (profileButton) {
      profileButton.addEventListener("click", function (event) {
        event.stopPropagation();
        openProfile(cardId);
      });
    }
  });

  if (nopeBtn) {
    nopeBtn.addEventListener("click", function () {
      swipe("left");
    });
  }

  if (likeBtn) {
    likeBtn.addEventListener("click", function () {
      const current = getCurrentCard();
      activeCatId = getCardId(current);
      swipe("right");
    });
  }

  if (openLikedPanelBtn) {
    openLikedPanelBtn.addEventListener("click", function () {
      openModal(likedOverlay);
    });
  }

  if (openLikedListLink) {
    openLikedListLink.addEventListener("click", function () {
      openModal(likedOverlay);
    });
  }

  toastOpenProfile.addEventListener("click", function () {
    if (activeCatId) {
      openProfile(activeCatId);
    }
  });

  toastOpenLiked.addEventListener("click", function () {
    openModal(likedOverlay);
  });

  likedList.addEventListener("click", function (event) {
    const item = event.target.closest("[data-liked-id]");
    if (!item) return;

    const catId = item.getAttribute("data-liked-id");
    if (event.target.closest(".open-liked-profile")) {
      openProfile(catId);
    }
    if (event.target.closest(".open-liked-contact")) {
      openContact(catId);
    }
  });

  likedFullList.addEventListener("click", function (event) {
    const item = event.target.closest("[data-liked-id]");
    if (!item) return;

    const catId = item.getAttribute("data-liked-id");
    if (event.target.closest(".open-liked-profile")) {
      openProfile(catId);
    }
    if (event.target.closest(".open-liked-contact")) {
      openContact(catId);
    }
  });

  contactOrgBtn.addEventListener("click", function () {
    if (activeCatId) {
      openContact(activeCatId);
    }
  });

  applyAdoptBtn.addEventListener("click", function () {
    if (activeCatId) {
      openApply(activeCatId);
    }
  });

  chatPreview.addEventListener("click", function (event) {
    const previewItem = event.target.closest("[data-preview-index]");
    if (!previewItem || !event.target.closest("button")) return;

    const index = Number(previewItem.getAttribute("data-preview-index"));
    pendingChatImages.splice(index, 1);
    renderChatPreview();
  });

  chatImageInput.addEventListener("change", function (event) {
    const files = Array.from(event.target.files || []).slice(0, 3);
    if (!files.length) return;

    Promise.all(files.map(function (file) {
      return new Promise(function (resolve) {
        const reader = new FileReader();
        reader.onload = function () {
          resolve({
            name: file.name,
            src: reader.result
          });
        };
        reader.readAsDataURL(file);
      });
    })).then(function (images) {
      pendingChatImages = images;
      renderChatPreview();
    });
  });

  chatApplyLink.addEventListener("click", function () {
    if (!activeCatId) return;
    closeModal(contactOverlay);
    openApply(activeCatId);
  });

  contactForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!activeCatId) return;

    const text = chatMessageInput.value.trim();
    if (!text && !pendingChatImages.length) return;

    const images = pendingChatImages.slice();

    try {
      if (remoteConversationIds[activeCatId]) {
        await submitRemoteMessage(activeCatId, text, images);
      } else {
        submitLocalMessage(activeCatId, text, images);
      }
    } catch (error) {
      submitLocalMessage(activeCatId, text, images);
    }

    renderChatThread(activeCatId);
    resetChatComposer();
  });

  applyForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const cat = cats[activeCatId];
    applyStatus.textContent = "Your adoption application for " + cat.name + " has been submitted. Current status: Submitted.";
    applyStatus.classList.add("show");
    applyForm.reset();
  });

  document.querySelectorAll("[data-close]").forEach(function (button) {
    button.addEventListener("click", function () {
      const overlay = document.getElementById(button.getAttribute("data-close"));
      if (overlay) {
        closeModal(overlay);
      }
    });
  });

  [profileOverlay, likedOverlay, contactOverlay, applyOverlay].forEach(function (overlay) {
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        closeModal(overlay);
      }
    });
  });

  updateLikedUI();
  const firstCard = getCurrentCard();
  if (firstCard) {
    activeCatId = getCardId(firstCard);
  }
})();
