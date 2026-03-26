/**
 * 猫咪档案页逻辑（Member 2）
 * 获取单只猫信息、展示、编辑、申请领养
 */
(function () {
  const API = API_BASE_URL;
  const params = new URLSearchParams(window.location.search);
  const catId = params.get('id');

  if (!catId) {
    document.body.innerHTML = '<div class="page"><p>缺少猫咪 ID，请从领养页进入。</p><a href="adoption.html">返回领养</a></div>';
    return;
  }

  const profileView = document.getElementById('profileView');
  const profileEdit = document.getElementById('profileEdit');
  const profilePhoto = document.getElementById('profilePhoto');
  const profileName = document.getElementById('profileName');
  const profileMeta = document.getElementById('profileMeta');
  const profileDesc = document.getElementById('profileDesc');
  const profileTags = document.getElementById('profileTags');
  const sectionOrg = document.getElementById('sectionOrg');
  const profileOrg = document.getElementById('profileOrg');
  const btnEdit = document.getElementById('btnEdit');
  const btnApply = document.getElementById('btnApply');
  const btnSave = document.getElementById('btnSave');
  const btnCancelEdit = document.getElementById('btnCancelEdit');

  let currentCat = null;

  async function loadCat() {
    try {
      const headers = getToken() ? getAuthHeaders() : { 'Content-Type': 'application/json' };
      const res = await fetch(API + '/cats/' + catId, { headers });
      const result = await res.json();
      if (!result.success) {
        alert(result.message || '加载失败');
        return;
      }
      currentCat = result.data;
      renderProfile(currentCat);
      if (getToken()) btnApply.style.display = 'block';
    } catch (err) {
      console.error('loadCat error:', err);
      profileName.textContent = '加载失败';
      alert('网络错误，请检查后端是否启动');
    }
  }

  function renderProfile(cat) {
    profilePhoto.src = cat.photo_url || '';
    profilePhoto.onerror = function () { this.style.background = '#f0f0f0'; };
    profileName.textContent = cat.name;
    const meta = [];
    if (cat.breed) meta.push(cat.breed);
    if (cat.age_months != null) meta.push(cat.age_months + ' 月');
    if (cat.gender) meta.push(cat.gender);
    if (cat.color) meta.push(cat.color);
    profileMeta.textContent = meta.length ? meta.join(' · ') : '—';
    profileDesc.textContent = cat.description || '暂无介绍';
    profileTags.innerHTML = (cat.tags || []).map(function (t) {
      return '<span class="tag">' + escapeHtml(t.tag) + '</span>';
    }).join('');
    if (cat.organization && cat.organization.name) {
      sectionOrg.style.display = 'block';
      profileOrg.innerHTML = '<p>' + escapeHtml(cat.organization.name) + '</p>' +
        (cat.organization.phone ? '<p>电话：' + escapeHtml(cat.organization.phone) + '</p>' : '') +
        (cat.organization.address ? '<p>地址：' + escapeHtml(cat.organization.address) + '</p>' : '');
    } else {
      sectionOrg.style.display = 'none';
    }
  }

  btnEdit.addEventListener('click', function () {
    if (!getToken()) {
      window.location.href = 'log-in.html?redirect=' + encodeURIComponent(window.location.href);
      return;
    }
    profileView.style.display = 'none';
    profileEdit.classList.add('show');
    document.getElementById('editId').value = currentCat.id;
    document.getElementById('editName').value = currentCat.name;
    document.getElementById('editBreed').value = currentCat.breed || '';
    document.getElementById('editAgeMonths').value = currentCat.age_months ?? '';
    document.getElementById('editGender').value = currentCat.gender || '';
    document.getElementById('editColor').value = currentCat.color || '';
    document.getElementById('editDescription').value = currentCat.description || '';
    document.getElementById('editPhotoUrl').value = currentCat.photo_url || '';
    var statusEl = document.getElementById('editCatStatus') || document.getElementById('editIsAvailable');
    if (statusEl) {
      var sv = currentCat.status || 'available';
      if (statusEl.id === 'editIsAvailable') {
        statusEl.value = sv === 'available' ? 'true' : 'false';
      } else {
        statusEl.value = sv;
      }
    }
  });

  btnCancelEdit.addEventListener('click', function () {
    profileEdit.classList.remove('show');
    profileView.style.display = 'block';
  });

  btnSave.addEventListener('click', async function () {
    const id = document.getElementById('editId').value;
    var statusElSave = document.getElementById('editCatStatus') || document.getElementById('editIsAvailable');
    var statusPayload;
    if (statusElSave) {
      if (statusElSave.id === 'editIsAvailable') {
        statusPayload = statusElSave.value === 'true' ? 'available' : 'unavailable';
      } else {
        statusPayload = statusElSave.value || 'available';
      }
    } else {
      statusPayload = 'available';
    }
    const data = {
      name: document.getElementById('editName').value.trim(),
      breed: document.getElementById('editBreed').value.trim() || null,
      age_months: document.getElementById('editAgeMonths').value === '' ? null : parseInt(document.getElementById('editAgeMonths').value, 10),
      gender: document.getElementById('editGender').value || null,
      color: document.getElementById('editColor').value.trim() || null,
      description: document.getElementById('editDescription').value.trim() || null,
      photo_url: document.getElementById('editPhotoUrl').value.trim() || null,
      status: statusPayload
    };
    if (!data.name) {
      alert('请填写名字');
      return;
    }
    try {
      const res = await fetch(API + '/cats/' + id, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.success) {
        currentCat = result.data;
        renderProfile(currentCat);
        profileEdit.classList.remove('show');
        profileView.style.display = 'block';
        alert('保存成功');
      } else {
        alert(result.message || '保存失败');
      }
    } catch (err) {
      console.error('updateCat error:', err);
      alert('网络错误');
    }
  });

  btnApply.addEventListener('click', function () {
    if (!getToken()) {
      window.location.href = 'log-in.html?redirect=' + encodeURIComponent(window.location.href);
      return;
    }
    window.location.href = 'adoption.html';
  });

  function escapeHtml(s) {
    if (!s) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  loadCat();
})();
