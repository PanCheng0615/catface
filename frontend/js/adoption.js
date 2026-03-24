/**
 * 领养页逻辑（Member 2）
 * 发现卡片、滑动、已喜欢、偏好、领养申请
 */
(function () {
  if (!getToken()) {
    window.location.href = 'log-in.html?redirect=' + encodeURIComponent('adoption.html');
    return;
  }

  const API = API_BASE_URL;
  let discoverList = [];
  let discoverIndex = 0;

  const panelDiscover = document.getElementById('panel-discover');
  const panelLiked = document.getElementById('panel-liked');
  const panelApplications = document.getElementById('panel-applications');
  const swipeCardPlaceholder = document.getElementById('swipeCardPlaceholder');
  const discoverEmpty = document.getElementById('discoverEmpty');
  const likedList = document.getElementById('likedList');
  const likedEmpty = document.getElementById('likedEmpty');
  const applicationsList = document.getElementById('applicationsList');
  const applicationsEmpty = document.getElementById('applicationsEmpty');

  const btnPass = document.getElementById('btnPass');
  const btnLike = document.getElementById('btnLike');
  const btnPreferences = document.getElementById('btnPreferences');
  const modalPreferences = document.getElementById('modalPreferences');
  const modalApply = document.getElementById('modalApply');
  const applyCatId = document.getElementById('applyCatId');
  const applyCatName = document.getElementById('applyCatName');
  const applyMessage = document.getElementById('applyMessage');

  // ---------- 发现：加载猫咪列表 ----------
  async function loadDiscover() {
    try {
      const res = await fetch(API + '/cats?is_available=true', {
        headers: getAuthHeaders()
      });
      const result = await res.json();
      if (!result.success) {
        alert(result.message || '加载失败');
        return;
      }
      discoverList = result.data || [];
      discoverIndex = 0;
      renderCurrentCard();
      if (discoverList.length === 0) {
        discoverEmpty.style.display = 'block';
        document.querySelector('.swipe-btns').style.display = 'none';
      }
    } catch (err) {
      console.error('loadDiscover error:', err);
      alert('网络错误，请检查后端是否启动');
    }
  }

  function renderCurrentCard() {
    swipeCardPlaceholder.innerHTML = '';
    if (discoverIndex >= discoverList.length) {
      discoverEmpty.style.display = 'block';
      document.querySelector('.swipe-btns').style.display = 'none';
      return;
    }
    const cat = discoverList[discoverIndex];
    const div = document.createElement('div');
    div.className = 'swipe-card card';
    div.innerHTML =
      '<img class="card-img" src="' + (cat.photo_url || '') + '" alt="" onerror="this.style.background=\'#f0f0f0\'">' +
      '<div class="card-body">' +
      '<div class="card-name">' + escapeHtml(cat.name) + '</div>' +
      '<div class="card-meta">' + formatMeta(cat) + '</div>' +
      '<div class="card-desc">' + escapeHtml(cat.description || '暂无介绍') + '</div>' +
      '</div>';
    swipeCardPlaceholder.appendChild(div);
  }

  function formatMeta(cat) {
    const parts = [];
    if (cat.breed) parts.push(cat.breed);
    if (cat.age_months != null) parts.push(cat.age_months + ' 月');
    if (cat.gender) parts.push(cat.gender);
    return parts.length ? parts.join(' · ') : '—';
  }

  async function swipe(direction) {
    if (discoverIndex >= discoverList.length) return;
    const cat = discoverList[discoverIndex];
    try {
      const res = await fetch(API + '/adoption/swipe', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ cat_id: cat.id, direction })
      });
      const result = await res.json();
      if (!result.success) {
        alert(result.message || '操作失败');
        return;
      }
      discoverIndex++;
      renderCurrentCard();
    } catch (err) {
      console.error('swipe error:', err);
      alert('网络错误');
    }
  }

  btnPass.addEventListener('click', function () { swipe('pass'); });
  btnLike.addEventListener('click', function () { swipe('like'); });

  // ---------- 已喜欢 ----------
  async function loadLiked() {
    try {
      const res = await fetch(API + '/adoption/liked', { headers: getAuthHeaders() });
      const result = await res.json();
      if (!result.success) {
        likedEmpty.style.display = 'block';
        return;
      }
      const cats = result.data || [];
      likedEmpty.style.display = cats.length ? 'none' : 'block';
      likedList.innerHTML = cats.map(function (cat) {
        return (
          '<div class="card">' +
          '<a href="cat-profile.html?id=' + cat.id + '">' +
          '<img class="card-img" src="' + (cat.photo_url || '') + '" alt="" onerror="this.style.background=\'#f0f0f0\'">' +
          '</a>' +
          '<div class="card-body">' +
          '<div class="card-name">' + escapeHtml(cat.name) + '</div>' +
          '<div class="card-meta">' + formatMeta(cat) + '</div>' +
          '<button type="button" class="btn btn-primary apply-btn" data-id="' + cat.id + '" data-name="' + escapeHtml(cat.name) + '">申请领养</button>' +
          '</div></div>'
        );
      }).join('');
      likedList.querySelectorAll('.apply-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          openApplyModal(this.getAttribute('data-id'), this.getAttribute('data-name'));
        });
      });
    } catch (err) {
      console.error('loadLiked error:', err);
      likedEmpty.style.display = 'block';
    }
  }

  // ---------- 我的申请 ----------
  async function loadApplications() {
    try {
      const res = await fetch(API + '/adoption/applications/me', { headers: getAuthHeaders() });
      const result = await res.json();
      if (!result.success) {
        applicationsEmpty.style.display = 'block';
        return;
      }
      const list = result.data || [];
      applicationsEmpty.style.display = list.length ? 'none' : 'block';
      const statusText = { pending: '待审核', approved: '已通过', rejected: '已拒绝' };
      applicationsList.innerHTML = list.map(function (item) {
        const cat = item.cat || {};
        return (
          '<div class="card">' +
          '<div class="card-body">' +
          '<div class="card-name">' + escapeHtml(cat.name || '') + '</div>' +
          '<div class="card-meta">状态：' + (statusText[item.status] || item.status) + '</div>' +
          '<a href="cat-profile.html?id=' + cat.id + '">查看档案</a>' +
          '</div></div>'
        );
      }).join('');
    } catch (err) {
      console.error('loadApplications error:', err);
      applicationsEmpty.style.display = 'block';
    }
  }

  // ---------- 偏好设置 ----------
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      const tab = this.getAttribute('data-tab');
      panelDiscover.style.display = tab === 'discover' ? 'block' : 'none';
      panelLiked.style.display = tab === 'liked' ? 'block' : 'none';
      panelApplications.style.display = tab === 'applications' ? 'block' : 'none';
      if (tab === 'discover') loadDiscover();
      if (tab === 'liked') loadLiked();
      if (tab === 'applications') loadApplications();
    });
  });

  btnPreferences.addEventListener('click', function () {
    modalPreferences.classList.add('show');
  });
  document.getElementById('btnPrefCancel').addEventListener('click', function () {
    modalPreferences.classList.remove('show');
  });
  document.getElementById('btnPrefSave').addEventListener('click', async function () {
    try {
      const res = await fetch(API + '/adoption/preferences', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          preferred_age: document.getElementById('prefAge').value.trim(),
          preferred_gender: document.getElementById('prefGender').value,
          preferred_breed: document.getElementById('prefBreed').value.trim()
        })
      });
      const result = await res.json();
      if (result.success) {
        modalPreferences.classList.remove('show');
        alert('偏好已保存');
      } else {
        alert(result.message || '保存失败');
      }
    } catch (err) {
      console.error('save preferences error:', err);
      alert('网络错误');
    }
  });

  // ---------- 申请领养弹窗 ----------
  function openApplyModal(catId, catName) {
    applyCatId.value = catId;
    applyCatName.textContent = catName;
    applyMessage.value = '';
    modalApply.classList.add('show');
  }

  document.getElementById('btnApplyCancel').addEventListener('click', function () {
    modalApply.classList.remove('show');
  });
  document.getElementById('btnApplySubmit').addEventListener('click', async function () {
    const id = applyCatId.value;
    if (!id) return;
    try {
      const res = await fetch(API + '/adoption/applications', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ cat_id: id, message: applyMessage.value.trim() })
      });
      const result = await res.json();
      if (result.success) {
        modalApply.classList.remove('show');
        alert('申请已提交');
        loadApplications();
        if (document.querySelector('.tab-btn[data-tab="applications"]').classList.contains('active')) {
          loadApplications();
        }
      } else {
        alert(result.message || '提交失败');
      }
    } catch (err) {
      console.error('submit application error:', err);
      alert('网络错误');
    }
  });

  function escapeHtml(s) {
    if (!s) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  loadDiscover();
})();
