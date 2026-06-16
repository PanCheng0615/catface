// frontend/js/clinic-portal.js — Member 5

(function () {
  const API = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:3000/api';

  const params = new URLSearchParams(window.location.search);
  let selectedCatId = '';
  let selectedCatName = '';

  // ── DOM ──
  const statusMsg     = document.getElementById('status-msg');
  const devAuthSection      = document.getElementById('dev-auth-section');
  const devLoggedInSection  = document.getElementById('dev-logged-in-section');
  const devClinicName       = document.getElementById('dev-clinic-name');
  const devClinicEmail      = document.getElementById('dev-clinic-email');
  const devOrgId            = document.getElementById('dev-org-id');
  const devToken            = document.getElementById('dev-token');
  const devAuthStatus       = document.getElementById('dev-auth-status');
  const clinicNameEl  = document.getElementById('clinic-name-display');
  const clinicIdEl    = document.getElementById('clinic-id-display');
  const statCatsEl         = document.getElementById('stat-cats');
  const statReportsEl     = document.getElementById('stat-reports');
  const statEndorsementsEl = document.getElementById('stat-endorsements');
  const catListEl     = document.getElementById('authorized-cat-list');
  const noSelEl       = document.getElementById('no-selection');
  const detailEl      = document.getElementById('cat-detail-section');
  const detailName    = document.getElementById('detail-cat-name');
  const patientTags   = document.getElementById('patient-health-tags');
  const ownerRecsEl  = document.getElementById('detail-owner-records');
  const existingEl    = document.getElementById('existing-reports');
  const reportsCount  = document.getElementById('reports-count');
  const uploadForm    = document.getElementById('upload-report-form');

  // ── Color map ──
  const TYPE_COLOR = {
    vaccination:{ bar: '#3b82f6', chip: 'chip-blue',   icon: '💉', label: 'Vaccination Certificate' },
    vaccine:    { bar: '#3b82f6', chip: 'chip-blue',   icon: '💉', label: 'Vaccination'     },
    deworming:  { bar: '#10b981', chip: 'chip-green',  icon: '🐛', label: 'Deworming Certificate' },
    checkup:    { bar: '#0891b2', chip: 'chip-teal',   icon: '🩺', label: 'Health Checkup Report' },
    blood_test: { bar: '#ef4444', chip: 'chip-red',    icon: '🔬', label: 'Blood Test Report'     },
    treatment:  { bar: '#f59e0b', chip: 'chip-orange', icon: '💊', label: 'Treatment Record'     },
    surgery:    { bar: '#8b5cf6', chip: 'chip-purple', icon: '✂️',  label: 'Surgery/Neutering Cert'},
    other:      { bar: '#94a3b8', chip: 'chip-gray',   icon: '📋', label: 'Other Medical Document' }
  };
  function ti(t) { return TYPE_COLOR[t] || TYPE_COLOR.other; }
  function fmt(iso) { return iso ? iso.slice(0, 10) : '—'; }

  function showStatus(msg, isError) {
    if (!statusMsg) return;
    statusMsg.textContent = msg;
    statusMsg.style.background = isError ? '#fee2e2' : '#d1fae5';
    statusMsg.style.color      = isError ? '#991b1b' : '#065f46';
    statusMsg.style.display    = 'block';
    clearTimeout(showStatus._t);
    showStatus._t = setTimeout(function () { statusMsg.style.display = 'none'; }, 5000);
  }

  // ── Load authorized cats ──
  async function loadAuthorizedCats() {
    if (!isLoggedIn()) {
      catListEl.innerHTML = '<div class="empty-state"><div class="ei">🔒</div><p>Please log in with a clinic staff account first</p></div>';
      return;
    }

    catListEl.innerHTML = '<div class="empty-state"><div class="ei">⏳</div><p>Loading...</p></div>';
    try {
      var res = await Promise.all([
        fetch(API + '/clinic/cats', { headers: getAuthHeaders() }),
        fetch(API + '/clinic/permissions', { headers: getAuthHeaders() })
      ]);
      var catsBody = await res[0].json();
      var permBody = await res[1].json();

      if (!catsBody.success) { showStatus('載入失敗：' + catsBody.message, true); return; }
      var cats = catsBody.data;

      if (statCatsEl) statCatsEl.textContent = cats.length;

      // 更新统计面板
      if (permBody.success && permBody.data && permBody.data.stats) {
        var stats = permBody.data.stats;
        if (statReportsEl) statReportsEl.textContent = stats.total || 0;
        if (statEndorsementsEl) {
          // 统计认证数：从所有已授权猫咪的健康记录中统计
          statEndorsementsEl.textContent = '—';
        }
      }

      // 更新诊所名称
      if (cats.length > 0 && cats[0].cat && cats[0].cat.owner) {
        // 诊所名称从 header 读取，已由 HTML 中的 observer 处理
      }

      if (!cats.length) {
        catListEl.innerHTML = '<div class="empty-state"><div class="ei">🐱</div><p>暫無貓主人授權此診所查看資料<br><small>請請貓主人在健康頁面設定授權</small></p></div>';
        return;
      }

      catListEl.innerHTML = cats.map(function (item) {
        var c = item.cat;
        var gMap = { male: '公', female: '母', unknown: '未知' };
        var permTypeLabel = item.permission_type === 'read_only' ? '👁' : '🔓';
        var permTypeColor = item.permission_type === 'read_only' ? 'chip-teal' : 'chip-blue';
        var badges = [
          c.is_vaccinated ? '<span class="chip chip-blue" style="font-size:10px;">💉</span>' : '',
          c.is_neutered   ? '<span class="chip chip-purple" style="font-size:10px;">✂️</span>' : '',
          c.is_dewormed   ? '<span class="chip chip-green" style="font-size:10px;">🐛</span>' : ''
        ].filter(Boolean).join('');
        var displayCode = c.face_code ? '🐾 ' + c.face_code : 'ID: ' + c.id.slice(0,8) + '…';
        return '<div class="cat-item" id="cat-item-' + c.id + '" onclick="selectCat(\'' + c.id + '\', \'' + (c.name.replace(/'/g, "\\'")) + '\')">' +
          '<div class="cat-avatar">🐱</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div class="cat-name">' + c.name + '</div>' +
            '<div class="cat-meta">' + (c.breed || '品種未知') + ' · ' + (gMap[c.gender] || '未知') + ' · ' + (c.age_months ? c.age_months + '個月' : '年齡未知') + '</div>' +
            '<div style="font-size:11px;color:var(--muted);margin-top:2px;">' + displayCode + ' ' + permTypeLabel + '</div>' +
            (badges ? '<div class="cat-badges">' + badges + '</div>' : '') +
          '</div>' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:#94a3b8;flex-shrink:0;"><path d="M9 18l6-6-6-6"/></svg>' +
        '</div>';
      }).join('');

    } catch (e) {
      showStatus('無法連接後端，請確認伺服器運行中', true);
      catListEl.innerHTML = '<div class="empty-state"><div class="ei">⚠️</div><p>連線失敗</p></div>';
    }
  }

  // ── 主人健康记录数据缓存（选中猫咪时填充）──
  var cachedOwnerRecords = [];

  // ── 选中猫咪 ──
  window.selectCat = async function (catId, catName) {
    selectedCatId   = catId;
    selectedCatName = catName;

    document.querySelectorAll('.cat-item').forEach(function (el) { el.classList.remove('selected'); });
    var el = document.getElementById('cat-item-' + catId);
    if (el) el.classList.add('selected');

    if (noSelEl)   noSelEl.style.display    = 'none';
    if (detailEl)  { detailEl.style.display = 'flex'; detailEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    if (detailName) detailName.textContent  = catName;

    ownerRecsEl.innerHTML = '<div class="empty-state"><div class="ei">⏳</div><p>載入中…</p></div>';
    existingEl.innerHTML  = '<div class="empty-state"><div class="ei">⏳</div><p>載入中…</p></div>';

    try {
      var res = await fetch(API + '/health/records/' + catId, { headers: getAuthHeaders() });
      var body = await res.json();
      if (!body.success) { showStatus('載入健康記錄失敗', true); return; }

      cachedOwnerRecords = body.data.owner_records || [];
      renderPatientTags(cachedOwnerRecords);
      renderOwnerRecords(cachedOwnerRecords);
      renderExistingReports(body.data.clinic_reports || []);
    } catch (e) { showStatus('載入失敗', true); }
  };

  // ── 认证弹窗 ──
  var endorseModal = document.getElementById('endorse-modal');
  var endorseRecordPreview = document.getElementById('endorse-record-preview');
  var endorseForm = document.getElementById('endorse-form');
  var currentEndorseRecordId = '';

  window.openEndorseModal = function (recordId) {
    currentEndorseRecordId = recordId;
    var rec = cachedOwnerRecords.find(function (r) { return r.id === recordId; });
    if (!rec) return;
    var ti2 = ti(rec.record_type);
    endorseRecordPreview.innerHTML = '<div style="font-weight:700;color:var(--primary);margin-bottom:4px;">' + ti2.icon + ' ' + ti2.label + '</div>' +
      '<div style="color:var(--muted);font-size:12px;">📅 ' + fmt(rec.date) + '</div>' +
      '<div style="margin-top:6px;font-size:13px;">' + rec.description + '</div>';
    var existing = rec.endorsements && rec.endorsements.find(function (e) { return e.organization && e.organization.id; });
    if (existing) {
      document.getElementById('endorse-text').value = existing.endorsement;
      document.getElementById('endorse-note').value = existing.note || '';
    } else {
      endorseForm.reset();
    }
    if (endorseModal) endorseModal.style.display = 'flex';
  };

  window.closeEndorseModal = function () {
    if (endorseModal) endorseModal.style.display = 'none';
    currentEndorseRecordId = '';
  };

  if (endorseModal) {
    endorseModal.addEventListener('click', function (e) {
      if (e.target === endorseModal) closeEndorseModal();
    });
  }

  if (endorseForm) {
    endorseForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!currentEndorseRecordId) return;
      var submitBtn = document.getElementById('endorse-submit-btn');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '提交中…'; }
      var endorsement = document.getElementById('endorse-text').value.trim();
      var note = document.getElementById('endorse-note').value.trim();
      try {
        var res = await fetch(API + '/clinic/records/' + currentEndorseRecordId + '/endorse', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ endorsement: endorsement, note: note || undefined })
        });
        var body = await res.json();
        if (body.success) {
          showStatus('✅ 認證添加成功！');
          closeEndorseModal();
          selectCat(selectedCatId, selectedCatName);
        } else {
          showStatus('失敗：' + body.message, true);
        }
      } catch (e) { showStatus('請求失敗', true); }
      finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '✅ 提交認證'; }
      }
    });
  }

  // ── 病患健康标签摘要 ──
  function renderPatientTags(records) {
    if (!patientTags) return;
    var hasVaccine   = records.some(function (r) { return r.record_type === 'vaccine'; });
    var hasDeworming = records.some(function (r) { return r.record_type === 'deworming'; });
    var hasSurgery   = records.some(function (r) { return r.record_type === 'surgery'; });
    var latestWeight = records.find(function (r) { return r.weight_kg; });
    var upcoming     = records.filter(function (r) { return r.next_due_date; }).sort(function (a,b) { return new Date(a.next_due_date) - new Date(b.next_due_date); })[0];
    var html = '';
    if (hasVaccine)   html += '<span class="chip chip-blue">💉 有疫苗記錄</span>';
    if (hasDeworming) html += '<span class="chip chip-green">🐛 有驅蟲記錄</span>';
    if (hasSurgery)   html += '<span class="chip chip-purple">✂️ 有手術記錄</span>';
    if (latestWeight) html += '<span class="chip chip-gray">⚖️ ' + latestWeight.weight_kg + ' kg</span>';
    if (upcoming)     html += '<span class="chip chip-orange">⏰ 下次提醒：' + fmt(upcoming.next_due_date) + '</span>';
    if (!html)        html  = '<span class="chip chip-gray" style="font-size:12px;">暫無健康記錄標籤</span>';
    patientTags.innerHTML = html;
  }

  // ── 渲染主人记录（含认证按钮）──
  function renderOwnerRecords(records) {
    if (!ownerRecsEl) return;
    if (!records.length) {
      ownerRecsEl.innerHTML = '<div class="empty-state" style="padding:24px;"><div class="ei">📋</div><p>主人尚無填寫健康記錄</p></div>';
      return;
    }
    ownerRecsEl.innerHTML = records.map(function (r) {
      var t = ti(r.record_type);
      var hasEndorsement = r.endorsements && r.endorsements.length > 0;
      var endorsementInfo = '';
      if (hasEndorsement) {
        r.endorsements.forEach(function (e) {
          endorsementInfo += '<div style="background:#e9faf2;border:1px solid #a7f3d0;border-radius:8px;padding:6px 10px;font-size:12px;margin-top:4px;">' +
            '<span style="font-weight:700;color:#065f46;">✅ ' + (e.organization && e.organization.name ? e.organization.name : '診所') + ' 已認證：</span>' +
            '<span style="color:#065f46;">' + e.endorsement + '</span>' +
            (e.note ? '<br><span style="color:#6b7280;font-size:11px;">📝 ' + e.note + '</span>' : '') +
            '</div>';
        });
      }
      return '<div class="rec-card">' +
        '<div class="rec-bar" style="background:' + t.bar + ';"></div>' +
        '<div class="rec-body">' +
          '<div class="rec-head">' +
            '<div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap;">' +
              '<span class="chip ' + t.chip + '">' + t.icon + ' ' + t.label + '</span>' +
              (hasEndorsement ? '<span class="clinic-cert-badge">✅ 已認證</span>' : '') +
              (r.vet_name ? '<span class="chip chip-gray" style="font-size:11px;">👨‍⚕️ ' + r.vet_name + (r.clinic_name ? ' · ' + r.clinic_name : '') + '</span>' : '') +
            '</div>' +
            '<span style="font-size:12px;color:var(--muted);">📅 ' + fmt(r.date) + '</span>' +
          '</div>' +
          '<p class="rec-desc">' + r.description + '</p>' +
          endorsementInfo +
          '<div class="rec-meta">' +
            (r.weight_kg    ? '<span class="chip chip-gray" style="font-size:11px;">⚖️ ' + r.weight_kg + ' kg</span>' : '') +
            (r.next_due_date ? '<span class="chip chip-orange" style="font-size:11px;">⏰ 下次：' + fmt(r.next_due_date) + '</span>' : '') +
          '</div>' +
          (r.file_url ? '<div class="rec-meta" style="margin-top:8px;"><a href="' + r.file_url + '" target="_blank" class="btn btn-blue btn-sm">📎 查看附件</a></div>' : '') +
          '<div class="rec-actions">' +
            (hasEndorsement
              ? '<button onclick="openEndorseModal(\'' + r.id + '\')" class="btn btn-secondary btn-sm">✏️ 更新認證</button>'
              : '<button onclick="openEndorseModal(\'' + r.id + '\')" class="btn btn-primary btn-sm">✅ 添加認證</button>') +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  // ── 渲染本诊所已上传的报告 ──
  function renderExistingReports(reports) {
    if (!existingEl) return;
    if (reportsCount) reportsCount.textContent = reports.length + ' 份';
    if (!reports.length) {
      existingEl.innerHTML = '<div class="empty-state" style="padding:24px;"><div class="ei">📄</div><p>本診所尚無已上傳報告</p></div>';
      return;
    }
    existingEl.innerHTML = reports.map(function (r) {
      var t = ti(r.report_type);
      return '<div class="rec-card">' +
        '<div class="rec-bar" style="background:' + t.bar + ';"></div>' +
        '<div class="rec-body">' +
          '<div class="rec-head">' +
            '<div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap;">' +
              '<span class="chip ' + t.chip + '">' + t.icon + ' ' + t.label + '</span>' +
              '<span class="clinic-cert-badge">✅ 已認證</span>' +
              (r.vet_name ? '<span class="chip chip-gray" style="font-size:11px;">👨‍⚕️ ' + r.vet_name + '</span>' : '') +
              (r.vet_license ? '<span class="chip chip-gray" style="font-size:10px;">📜 ' + r.vet_license + '</span>' : '') +
            '</div>' +
            '<span style="font-size:12px;color:var(--muted);">📅 ' + fmt(r.date) + '</span>' +
          '</div>' +
          (r.findings ? '<p class="rec-desc" style="color:var(--text);font-weight:600;">🔍 ' + r.findings + '</p>' : '') +
          '<p class="rec-desc">' + r.description + '</p>' +
          (r.recommendations ? '<p class="rec-desc" style="color:var(--green);">💡 ' + r.recommendations + '</p>' : '') +
          '<div class="rec-meta">' +
            (r.file_url ? '<a href="' + r.file_url + '" target="_blank" class="btn btn-blue btn-sm">📎 查看附件</a>' : '') +
          '</div>' +
          '<div class="rec-actions">' +
            '<button onclick="window.printReport(\'' + r.id + '\')" class="btn btn-primary btn-sm">🖨 列印報告</button>' +
            '<button onclick="deleteReport(\'' + r.id + '\')" class="btn btn-danger btn-sm">🗑 刪除</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  // ── 列印报告 ──
  window.printReport = async function (reportId) {
    try {
      showStatus('正在生成報告…');
      var res = await fetch(API + '/clinic/reports/' + reportId + '/print', { headers: getAuthHeaders() });
      var body = await res.json();
      if (!body.success) { showStatus('生成報告失敗：' + body.message, true); return; }

      var printWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes');
      if (!printWindow) { showStatus('請允許彈出視窗以列印報告', true); return; }
      printWindow.document.write(body.data.html);
      printWindow.document.close();
      setTimeout(function () { printWindow.focus(); }, 300);
    } catch (e) { showStatus('請求失敗', true); }
  };

  // ── 删除报告 ──
  window.deleteReport = async function (reportId) {
    if (!confirm('確定要刪除這份報告嗎？')) return;
    try {
      var res = await fetch(API + '/clinic/reports/' + reportId, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      var body = await res.json();
      if (body.success) { showStatus('報告已刪除'); selectCat(selectedCatId, selectedCatName); }
      else              showStatus('刪除失敗：' + body.message, true);
    } catch (e) { showStatus('請求失敗', true); }
  };

  // ── 文件选择预览 ──
  var rptFileInput   = document.getElementById('rpt-file');
  var rptFilePreview = document.getElementById('rpt-file-preview');
  var rptUploadStatus = document.getElementById('rpt-upload-status');

  if (rptFileInput) {
    rptFileInput.addEventListener('change', function () {
      var file = rptFileInput.files[0];
      if (!file || !rptFilePreview) return;
      if (file.type.startsWith('image/')) {
        var reader = new FileReader();
        reader.onload = function (e) {
          rptFilePreview.innerHTML = '<img src="' + e.target.result + '" style="max-width:100%;max-height:200px;display:block;">';
          rptFilePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        rptFilePreview.innerHTML = '<div style="padding:12px;font-size:13px;background:#f8f9fa;">📄 ' + file.name + '</div>';
        rptFilePreview.style.display = 'block';
      }
    });
  }

  // ── 上传报告（支持先上传附件）──
  if (uploadForm) {
    uploadForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!selectedCatId) { showStatus('請先從左側選擇一位病患', true); return; }

      var submitBtn = document.getElementById('rpt-submit-btn');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '上傳中…'; }

      var fileUrl = null;
      var fileInput = document.getElementById('rpt-file');
      if (fileInput && fileInput.files[0]) {
        if (rptUploadStatus) { rptUploadStatus.textContent = '正在上傳附件…'; rptUploadStatus.style.display = 'block'; }
        try {
          var formData = new FormData();
          formData.append('file', fileInput.files[0]);
          var uploadRes = await fetch(API + '/health/upload', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + getToken() },
            body: formData
          });
          var uploadBody = await uploadRes.json();
          if (uploadBody.success) {
            fileUrl = uploadBody.data.url;
            if (rptUploadStatus) rptUploadStatus.textContent = '✅ 附件上傳成功';
          } else {
            showStatus('附件上傳失敗：' + uploadBody.message, true);
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '✅ 提交認證報告'; }
            return;
          }
        } catch (e) {
          showStatus('附件上傳失敗，請確認伺服器運行中', true);
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '✅ 提交認證報告'; }
          return;
        }
      }

      var data = {
        report_type:     document.getElementById('rpt-type').value,
        description:     document.getElementById('rpt-desc').value.trim(),
        findings:        document.getElementById('rpt-findings').value.trim() || undefined,
        recommendations: document.getElementById('rpt-recommendations').value.trim() || undefined,
        vet_name:        document.getElementById('rpt-vet').value.trim() || undefined,
        vet_license:     document.getElementById('rpt-vet-license').value.trim() || undefined,
        date:            document.getElementById('rpt-date').value,
        file_url:        fileUrl || undefined
      };

      try {
        var res = await fetch(API + '/clinic/reports/' + selectedCatId, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        });
        var body = await res.json();
        if (body.success) {
          showStatus('✅ 認證報告上傳成功！');
          uploadForm.reset();
          if (rptFilePreview) { rptFilePreview.style.display = 'none'; rptFilePreview.innerHTML = ''; }
          if (rptUploadStatus) { rptUploadStatus.style.display = 'none'; }
          selectCat(selectedCatId, selectedCatName);
        } else {
          showStatus('上傳失敗：' + body.message, true);
        }
      } catch (e) { showStatus('請求失敗，請確認伺服器運行中', true); }
      finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '✅ 提交認證報告'; }
      }
    });
  }

  // ── 开发测试面板：诊所注册 ──
  var devRegisterBtn = document.getElementById('dev-register-btn');
  var devLoginBtn = document.getElementById('dev-login-btn');
  var devLogoutBtn = document.getElementById('dev-logout-btn');

  function syncDevAuthUI() {
    var token = getToken();
    var user = getCurrentUser();
    if (token && user) {
      if (devAuthSection) devAuthSection.style.display = 'none';
      if (devLoggedInSection) devLoggedInSection.style.display = 'block';

      // 优先从 clinic_org_profile 读取诊所信息
      var orgProfile = null;
      try { orgProfile = JSON.parse(localStorage.getItem('catface_clinic_org_profile') || 'null'); } catch(e){}
      var orgName = orgProfile && orgProfile.name ? orgProfile.name : (user.organization_name || user.display_name || '診所');

      if (devClinicName) devClinicName.textContent = orgName;
      if (devClinicEmail) devClinicEmail.textContent = user.email || orgProfile?.email || '';
      if (devOrgId) {
        devOrgId.value = orgProfile && orgProfile.id ? orgProfile.id : (user.organization_id || '');
      }
      if (devToken) devToken.value = token.slice(0, 40) + '…';
      // 更新诊所 header
      var headerName = document.getElementById('clinic-name-header');
      var headerLabel = document.querySelector('.clinic-id-label');
      if (headerName) headerName.textContent = orgName;
      if (headerLabel) headerLabel.textContent = '已認證醫療合作夥伴 · 官方報告上傳權限';
    } else {
      if (devAuthSection) devAuthSection.style.display = 'block';
      if (devLoggedInSection) devLoggedInSection.style.display = 'none';
    }
  }

  if (devRegisterBtn) {
    devRegisterBtn.addEventListener('click', function () {
      var name = document.getElementById('reg-name').value.trim();
      var email = document.getElementById('reg-email').value.trim();
      var password = document.getElementById('reg-password').value;
      var phone = document.getElementById('reg-phone').value.trim();
      var address = document.getElementById('reg-address').value.trim();
      if (!name || !email || !password) {
        showDevStatus('請填寫診所名稱、郵箱和密碼', true);
        return;
      }
      if (password.length < 6) {
        showDevStatus('密碼長度至少為 6 個字', true);
        return;
      }
      devRegisterBtn.disabled = true;
      devRegisterBtn.textContent = '註冊中…';
      fetch(API + '/auth/org/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, password: password, phone: phone || undefined, address: address || undefined })
      })
        .then(function (res) { return res.json(); })
        .then(function (result) {
          if (result.success && result.data) {
            var data = result.data;
            // 同时存储 token + user + org 信息
            // 兼容两种响应格式：data.user（旧）或 data.rescue_staff_user（新版）
            var staffUser = data.user || data.rescue_staff_user || {};
            setToken(data.token);
            try {
              localStorage.setItem('catface_user', JSON.stringify({
                id: staffUser.id || data.user?.id || '',
                username: staffUser.username || staffUser.display_name || 'clinic',
                display_name: staffUser.display_name || data.organization?.name || '診所',
                role: staffUser.role || 'clinic_staff',
                email: data.organization?.email || email,
                organization_id: data.organization?.id || '',
                organization_name: data.organization?.name || '',
                organization_type: data.organization?.type || 'clinic',
                account_type: 'organization'
              }));
              localStorage.setItem('catface_clinic_org_profile', JSON.stringify(data.organization || {}));
            } catch (e) {}
            showDevStatus('✅ 診所註冊成功！已自動登入。');
            syncDevAuthUI();
            loadAuthorizedCats();
            // 清空表单
            document.getElementById('reg-name').value = '';
            document.getElementById('reg-email').value = '';
            document.getElementById('reg-password').value = '';
            document.getElementById('reg-phone').value = '';
            document.getElementById('reg-address').value = '';
          } else {
            showDevStatus('註冊失敗：' + (result.message || JSON.stringify(result)), true);
          }
        })
        .catch(function () { showDevStatus('網路錯誤，請確認伺服器運行中', true); })
        .finally(function () {
          devRegisterBtn.disabled = false;
          devRegisterBtn.textContent = '📋 註冊診所';
        });
    });
  }

  if (devLoginBtn) {
    devLoginBtn.addEventListener('click', function () {
      var email = document.getElementById('dev-login-email').value.trim();
      var password = document.getElementById('dev-login-pw').value;
      if (!email || !password) { showDevStatus('請填寫郵箱和密碼', true); return; }
      devLoginBtn.disabled = true;
      devLoginBtn.textContent = '登入中…';
      fetch(API + '/auth/org/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      })
        .then(function (res) { return res.json(); })
        .then(function (result) {
          if (result.success && result.data) {
            var data = result.data;
            setToken(data.token);
            // 兼容两种响应格式：data.user（旧）或 data.rescue_staff_user（新版）
            var staffUser = data.user || data.rescue_staff_user || {};
            try {
              localStorage.setItem('catface_user', JSON.stringify({
                id: staffUser.id || '',
                username: staffUser.username || staffUser.display_name || 'clinic',
                display_name: staffUser.display_name || data.organization?.name || '診所',
                role: staffUser.role || 'clinic_staff',
                email: data.organization?.email || '',
                organization_id: data.organization?.id || '',
                organization_name: data.organization?.name || '',
                organization_type: data.organization?.type || 'clinic',
                account_type: 'organization'
              }));
              localStorage.setItem('catface_clinic_org_profile', JSON.stringify(data.organization || {}));
            } catch (e) {}
            showDevStatus('✅ 登入成功！');
            syncDevAuthUI();
            loadAuthorizedCats();
            document.getElementById('dev-login-email').value = '';
            document.getElementById('dev-login-pw').value = '';
          } else {
            showDevStatus('登入失敗：' + (result.message || '郵箱或密碼錯誤'), true);
          }
        })
        .catch(function () { showDevStatus('網路錯誤', true); })
        .finally(function () {
          devLoginBtn.disabled = false;
          devLoginBtn.textContent = '🔑 登入';
        });
    });
  }

  if (devLogoutBtn) {
    devLogoutBtn.addEventListener('click', function () {
      try {
        localStorage.removeItem('catface_token');
        localStorage.removeItem('catface_user');
        localStorage.removeItem('catface_clinic_org_profile');
      } catch (e) {}
      syncDevAuthUI();
      showStatus('已登出');
    });
  }

  function showDevStatus(msg, isError) {
    if (!devAuthStatus) return;
    devAuthStatus.textContent = msg;
    devAuthStatus.style.color = isError ? '#dc2626' : '#027a48';
    devAuthStatus.style.display = 'block';
    clearTimeout(showDevStatus._t);
    showDevStatus._t = setTimeout(function () { devAuthStatus.style.display = 'none'; }, 5000);
  }

  // ── 测试面板 ──
  var testApplyBtn = document.getElementById('test-apply-btn');
  if (testApplyBtn) {
    testApplyBtn.addEventListener('click', function () {
      if (!isLoggedIn()) { showStatus('請先登入診所工作人員帳號', true); return; }
      showStatus('載入中…');
      loadAuthorizedCats();
    });
  }

  // ── 初始化 ──
  syncDevAuthUI();
  loadAuthorizedCats();
})();
