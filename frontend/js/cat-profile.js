/**
 * 猫咪档案页逻辑（Member 2）
 * 获取单只猫信息、展示、编辑、申请领养
 * （页面结构由宿主 HTML 提供；状态编辑使用脚本动态生成的 #editCatStatus）
 */
(function () {
  const API = API_BASE_URL;
  const params = new URLSearchParams(window.location.search);
  const catId = params.get('id');

  /** 与后端 CatStatus 枚举一致 */
  const CAT_STATUS_OPTIONS = [
    { value: 'available', label: '可领养 (available)' },
    { value: 'adopted', label: '已领养 (adopted)' },
    { value: 'fostered', label: '寄养中 (fostered)' },
    { value: 'deceased', label: '已离世 (deceased)' }
  ];

  function formatCatStatusLabel(status) {
    var map = {
      available: '可领养',
      adopted: '已领养',
      fostered: '寄养中',
      deceased: '已离世'
    };
    if (status == null || status === '') return '—';
    return map[status] || String(status);
  }

  /**
   * 在编辑面板内动态插入 / 重建 #editCatStatus（四个 CatStatus 选项）
   */
  function ensureEditCatStatusSelect() {
    var parent = document.getElementById('profileEdit');
    if (!parent) return;

    var wrap = document.getElementById('profileEditStatusWrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'profileEditStatusWrap';
      wrap.style.marginBottom = '12px';
      parent.insertBefore(wrap, parent.firstChild);
    }

    wrap.innerHTML = '';
    var lab = document.createElement('label');
    lab.htmlFor = 'editCatStatus';
    lab.textContent = '状态 (CatStatus)';
    lab.style.display = 'block';
    lab.style.marginBottom = '4px';

    var sel = document.createElement('select');
    sel.id = 'editCatStatus';
    sel.setAttribute('aria-label', 'Cat status');

    CAT_STATUS_OPTIONS.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      sel.appendChild(opt);
    });

    wrap.appendChild(lab);
    wrap.appendChild(sel);
  }

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

  function resetProfileAfterError(message) {
    currentCat = null;
    if (profileName) profileName.textContent = message || '—';
    if (profileMeta) profileMeta.textContent = '—';
    if (profileDesc) profileDesc.textContent = '—';
    if (profileTags) profileTags.innerHTML = '';
    if (profilePhoto) profilePhoto.removeAttribute('src');
    var st = ensureProfileCatStatusEl();
    if (st) st.textContent = '状态：—';
    if (sectionOrg) sectionOrg.style.display = 'none';
  }

  async function loadCat() {
    try {
      const headers = getToken() ? getAuthHeaders() : { 'Content-Type': 'application/json' };
      const res = await fetch(API + '/cats/' + encodeURIComponent(catId), { headers });
      const result = await res.json().catch(function () {
        return {};
      });

      if (res.status === 404) {
        resetProfileAfterError('未找到');
        alert(result.message || '猫咪不存在');
        return;
      }
      if (!res.ok) {
        resetProfileAfterError('加载失败');
        alert(result.message || ('加载失败 (' + res.status + ')'));
        return;
      }
      if (!result.success || !result.data) {
        resetProfileAfterError('加载失败');
        alert(result.message || '加载失败');
        return;
      }

      currentCat = result.data;
      renderProfile(currentCat);
      if (getToken() && btnApply) btnApply.style.display = 'block';
    } catch (err) {
      console.error('loadCat error:', err);
      resetProfileAfterError('加载失败');
      if (profileName) profileName.textContent = '加载失败';
      alert('网络错误，请检查后端是否启动');
    }
  }

  /** 详情区展示 cat.status（无则插入 #profileCatStatus） */
  function ensureProfileCatStatusEl() {
    var pv = document.getElementById('profileView');
    if (!pv) return null;
    var el = document.getElementById('profileCatStatus');
    if (!el) {
      el = document.createElement('p');
      el.id = 'profileCatStatus';
      el.className = 'profile-cat-status';
      var pn = document.getElementById('profileName');
      if (pn && pn.parentNode) {
        pn.parentNode.insertBefore(el, pn.nextSibling);
      } else {
        pv.insertBefore(el, pv.firstChild);
      }
    }
    return el;
  }

  function renderProfile(cat) {
    if (!cat) {
      var stOnly = ensureProfileCatStatusEl();
      if (stOnly) stOnly.textContent = '状态：—';
      return;
    }

    if (profilePhoto) {
      profilePhoto.src = cat.photo_url || '';
      profilePhoto.onerror = function () { this.style.background = '#f0f0f0'; };
    }
    if (profileName) profileName.textContent = cat.name;

    const meta = [];
    if (cat.breed) meta.push(cat.breed);
    if (cat.age_months != null) meta.push(cat.age_months + ' 月');
    if (cat.gender) meta.push(cat.gender);
    if (cat.color) meta.push(cat.color);
    if (profileMeta) profileMeta.textContent = meta.length ? meta.join(' · ') : '—';

    var statusEl = ensureProfileCatStatusEl();
    if (statusEl) {
      statusEl.textContent = '状态：' + formatCatStatusLabel(cat.status);
    }

    if (profileDesc) profileDesc.textContent = cat.description || '暂无介绍';
    if (profileTags) {
      profileTags.innerHTML = (cat.tags || []).map(function (t) {
        return '<span class="tag">' + escapeHtml(t.tag) + '</span>';
      }).join('');
    }
    if (sectionOrg && profileOrg) {
      if (cat.organization && cat.organization.name) {
        sectionOrg.style.display = 'block';
        profileOrg.innerHTML = '<p>' + escapeHtml(cat.organization.name) + '</p>' +
          (cat.organization.phone ? '<p>电话：' + escapeHtml(cat.organization.phone) + '</p>' : '') +
          (cat.organization.address ? '<p>地址：' + escapeHtml(cat.organization.address) + '</p>' : '');
      } else {
        sectionOrg.style.display = 'none';
      }
    }
  }

  if (btnEdit) {
    btnEdit.addEventListener('click', function () {
      if (!getToken()) {
        window.location.href = 'log-in.html?redirect=' + encodeURIComponent(window.location.href);
        return;
      }
      if (profileView) profileView.style.display = 'none';
      if (profileEdit) profileEdit.classList.add('show');

      ensureEditCatStatusSelect();

      var editId = document.getElementById('editId');
      if (editId) editId.value = currentCat.id;
      var en = document.getElementById('editName');
      if (en) en.value = currentCat.name;
      var eb = document.getElementById('editBreed');
      if (eb) eb.value = currentCat.breed || '';
      var eam = document.getElementById('editAgeMonths');
      if (eam) eam.value = currentCat.age_months ?? '';
      var eg = document.getElementById('editGender');
      if (eg) eg.value = currentCat.gender || '';
      var ec = document.getElementById('editColor');
      if (ec) ec.value = currentCat.color || '';
      var ed = document.getElementById('editDescription');
      if (ed) ed.value = currentCat.description || '';
      var epu = document.getElementById('editPhotoUrl');
      if (epu) epu.value = currentCat.photo_url || '';

      var statusEl = document.getElementById('editCatStatus');
      if (statusEl) {
        var sv = currentCat.status || 'available';
        statusEl.value = CAT_STATUS_OPTIONS.some(function (o) { return o.value === sv; }) ? sv : 'available';
      }
    });
  }

  if (btnCancelEdit) {
    btnCancelEdit.addEventListener('click', function () {
      if (profileEdit) profileEdit.classList.remove('show');
      if (profileView) profileView.style.display = 'block';
    });
  }

  if (btnSave) {
    btnSave.addEventListener('click', async function () {
      const id = document.getElementById('editId') && document.getElementById('editId').value;
      if (!id) {
        alert('缺少猫咪 ID');
        return;
      }

      ensureEditCatStatusSelect();
      var statusElSave = document.getElementById('editCatStatus');
      var statusPayload = (statusElSave && statusElSave.value)
        ? statusElSave.value
        : (currentCat && currentCat.status ? currentCat.status : 'available');

      const data = {
        name: document.getElementById('editName') && document.getElementById('editName').value.trim(),
        breed: document.getElementById('editBreed') ? document.getElementById('editBreed').value.trim() || null : null,
        age_months: (function () {
          var el = document.getElementById('editAgeMonths');
          if (!el || el.value === '') return null;
          return parseInt(el.value, 10);
        })(),
        gender: document.getElementById('editGender') ? document.getElementById('editGender').value || null : null,
        color: document.getElementById('editColor') ? document.getElementById('editColor').value.trim() || null : null,
        description: document.getElementById('editDescription') ? document.getElementById('editDescription').value.trim() || null : null,
        photo_url: document.getElementById('editPhotoUrl') ? document.getElementById('editPhotoUrl').value.trim() || null : null,
        status: statusPayload
      };

      if (!data.name) {
        alert('请填写名字');
        return;
      }

      try {
        const res = await fetch(API + '/cats/' + encodeURIComponent(id), {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        });
        const result = await res.json().catch(function () {
          return {};
        });
        if (res.status === 404) {
          alert(result.message || '猫咪不存在');
          return;
        }
        if (res.status === 422) {
          alert(result.message || '参数无效（请检查 status 等字段）');
          return;
        }
        if (!res.ok) {
          alert(result.message || ('保存失败 (' + res.status + ')'));
          return;
        }
        if (result.success && result.data) {
          currentCat = result.data;
          renderProfile(currentCat);
          if (profileEdit) profileEdit.classList.remove('show');
          if (profileView) profileView.style.display = 'block';
          alert('保存成功');
        } else {
          alert(result.message || '保存失败');
        }
      } catch (err) {
        console.error('updateCat error:', err);
        alert('网络错误');
      }
    });
  }

  if (btnApply) {
    btnApply.addEventListener('click', function () {
      if (!getToken()) {
        window.location.href = 'log-in.html?redirect=' + encodeURIComponent(window.location.href);
        return;
      }
      window.location.href = 'adoption.html';
    });
  }

  function escapeHtml(s) {
    if (!s) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  loadCat();
})();
