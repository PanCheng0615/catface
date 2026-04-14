// frontend/js/health.js — Member 5

(function () {
  const API = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:3000/api';

  const params = new URLSearchParams(window.location.search);
  let catId  = params.get('catId')  || localStorage.getItem('catface_test_catId')  || '';
  let userId = params.get('userId') || localStorage.getItem('catface_test_userId') || '';

  // ── DOM ──
  const catIdDisplay     = document.getElementById('current-cat-id');
  const ownerList        = document.getElementById('owner-records-list');
  const clinicList       = document.getElementById('clinic-records-list');
  const shareList        = document.getElementById('share-list');
  const addRecordForm    = document.getElementById('add-record-form');
  const addRecordSection = document.getElementById('add-record-section');
  const shareForm        = document.getElementById('share-form');
  const testCatInput     = document.getElementById('test-cat-id-input');
  const testUserInput    = document.getElementById('test-user-id-input');
  const testApplyBtn     = document.getElementById('test-apply-btn');
  const statusMsg        = document.getElementById('status-msg');
  const ownerCount       = document.getElementById('owner-count');
  const clinicCount      = document.getElementById('clinic-count');
  const toggleAddBtn     = document.getElementById('toggle-add-btn');
  const cancelAddBtn     = document.getElementById('cancel-add-btn');

  // ── 颜色映射 ──
  const TYPE_COLOR = {
    vaccine:    { bar: '#3b82f6', chip: 'chip-blue',   icon: '💉', label: 'Vaccination' },
    deworming:  { bar: '#10b981', chip: 'chip-green',  icon: '🐛', label: 'Deworming' },
    checkup:    { bar: '#0891b2', chip: 'chip-teal',   icon: '🩺', label: 'General Checkup' },
    treatment:  { bar: '#f59e0b', chip: 'chip-orange', icon: '💊', label: 'Treatment' },
    surgery:    { bar: '#8b5cf6', chip: 'chip-purple', icon: '✂️',  label: 'Surgery' },
    blood_test: { bar: '#ef4444', chip: 'chip-red',    icon: '🔬', label: 'Blood Test' },
    vaccination:{ bar: '#3b82f6', chip: 'chip-blue',   icon: '💉', label: 'Vaccination Certificate' },
    other:      { bar: '#94a3b8', chip: 'chip-gray',   icon: '📋', label: 'Other' }
  };

  function typeInfo(t) { return TYPE_COLOR[t] || TYPE_COLOR.other; }
  function fmt(iso)    { return iso ? iso.slice(0, 10) : '—'; }

  function daysUntil(isoDate) {
    if (!isoDate) return null;
    return Math.ceil((new Date(isoDate) - new Date()) / 86400000);
  }

  function showStatus(msg, isError) {
    if (!statusMsg) return;
    statusMsg.textContent = msg;
    statusMsg.style.background = isError ? '#fee2e2' : '#d1fae5';
    statusMsg.style.color      = isError ? '#991b1b' : '#065f46';
    statusMsg.style.display    = 'block';
    clearTimeout(showStatus._t);
    showStatus._t = setTimeout(() => { statusMsg.style.display = 'none'; }, 4000);
  }

  // ── 健康护照 ──
  function updatePassport(ownerRecords, clinicReports) {
    const nameEl   = document.getElementById('passport-name');
    const metaEl   = document.getElementById('passport-meta');
    const badgesEl = document.getElementById('passport-badges');

    const all = [...ownerRecords, ...clinicReports].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latestVaccine   = all.find(r => ['vaccine','vaccination'].includes(r.record_type || r.report_type));
    const latestDeworming = all.find(r => (r.record_type || r.report_type) === 'deworming');
    const latestSurgery   = all.find(r => (r.record_type || r.report_type) === 'surgery');
    const latestWeight    = ownerRecords.find(r => r.weight_kg);
    const upcoming        = ownerRecords.filter(r => r.next_due_date)
                              .sort((a,b) => new Date(a.next_due_date) - new Date(b.next_due_date))
                              .find(r => daysUntil(r.next_due_date) >= 0);

    if (nameEl) nameEl.textContent = catId ? 'Health Passport' : '- Health Passport';
    // 優先顯示 face_code，無則顯示 id 前 8 位，兩者皆無則提示載入
    const catLabel = window._catFaceCode
      ? `Code: ${window._catFaceCode}`
      : catId ? `ID: ${catId.slice(0,8)}...` : '';
    if (metaEl) metaEl.textContent = catId
      ? `${catLabel}  ·  ${all.length} records total`
      : 'Load a cat ID to view records';

    if (!badgesEl) return;

    function makeBadge(icon, label, date, status) {
      const cls = status === 'ok' ? 'pbadge ok' : status === 'warn' ? 'pbadge warn' : 'pbadge none';
      return `<div class="${cls}"><span class="pb-icon">${icon}</span><span class="pb-label">${label}</span><span class="pb-date">${date || 'Not recorded'}</span></div>`;
    }

    let html = '';
    html += makeBadge('💉', 'Vaccines', latestVaccine ? fmt(latestVaccine.date) : null, latestVaccine ? 'ok' : 'none');
    html += makeBadge('🐛', 'Deworming', latestDeworming ? fmt(latestDeworming.date) : null, latestDeworming ? 'ok' : 'none');
    html += makeBadge('✂️', 'Spay/Neuter', latestSurgery ? fmt(latestSurgery.date) : null, latestSurgery ? 'ok' : 'none');
    html += makeBadge('⚖️', 'Latest Weight', latestWeight ? latestWeight.weight_kg + ' kg' : null, latestWeight ? 'ok' : 'none');
    if (upcoming) {
      const days = daysUntil(upcoming.next_due_date);
      html += `<div class="pbadge ${days <= 7 ? 'warn' : 'ok'}"><span class="pb-icon">⏰</span><span class="pb-label">Upcoming Reminder</span><span class="pb-date">${fmt(upcoming.next_due_date)} (in ${days} days)</span></div>`;
    }
    badgesEl.innerHTML = html;
  }

  // ── 渲染主人记录 ──
  function renderOwnerRecords(records) {
    if (!ownerList) return;
    if (ownerCount) ownerCount.textContent = records.length + ' records';
    if (!records.length) {
      ownerList.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>No records yet. Click "Add Record" in the top right.</p></div>`;
      return;
    }
    ownerList.innerHTML = records.map(r => {
      const ti = typeInfo(r.record_type);
      const days = r.next_due_date ? daysUntil(r.next_due_date) : null;
      const reminderHtml = r.next_due_date
        ? `<span class="reminder-badge">⏰ Next: ${fmt(r.next_due_date)}${days !== null ? ` (${days >= 0 ? 'in ' + days + ' days' : 'overdue'})` : ''}</span>`
        : '';
      return `
        <div class="rec-card">
          <div class="rec-card-bar" style="background:${ti.bar};"></div>
          <div class="rec-card-body">
            <div class="rec-card-head">
              <div class="rec-type-row">
                <span class="chip ${ti.chip}">${ti.icon} ${ti.label}</span>
                ${r.vet_name ? `<span class="chip chip-gray" style="font-size:12px;">👨‍⚕️ ${r.vet_name}${r.clinic_name ? ' · '+r.clinic_name : ''}</span>` : ''}
              </div>
              <span class="rec-date">📅 ${fmt(r.date)}</span>
            </div>
            <p class="rec-desc">${r.description}</p>
            <div class="rec-meta">
              ${r.weight_kg ? `<span class="chip chip-gray" style="font-size:12px;">⚖️ ${r.weight_kg} kg</span>` : ''}
              ${reminderHtml}
            </div>
            ${r.file_url ? `
            <div style="margin-top:10px;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;max-width:320px;">
              ${/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(r.file_url)
                ? `<img src="${r.file_url}" style="width:100%;max-height:180px;object-fit:cover;display:block;" loading="lazy">`
                : `<a href="${r.file_url}" target="_blank" style="display:flex;align-items:center;gap:8px;padding:10px 14px;font-size:13px;color:#2563eb;background:#f8f9fa;">📄 View PDF Attachment</a>`
              }
            </div>` : ''}
            <div class="rec-actions">
              <button onclick="deleteRecord('${r.id}')" class="btn btn-danger btn-sm">🗑 Delete</button>
              ${r.file_url ? `<a href="${r.file_url}" target="_blank" class="btn btn-ghost btn-sm" style="font-size:12px;">📎 Download Attachment</a>` : ''}
            </div>
          </div>
        </div>`;
    }).join('');
  }

  // ── 渲染诊所认证报告 ──
  function renderClinicReports(reports) {
    if (!clinicList) return;
    if (clinicCount) clinicCount.textContent = reports.length + ' records';
    if (!reports.length) {
      clinicList.innerHTML = `<div class="empty-state"><div class="empty-icon">🏥</div><p>No certified clinic reports yet.<br><span style="font-size:12px;">Grant access in "Sharing Permissions" first, then let the clinic upload through the Clinic Portal.</span></p></div>`;
      return;
    }
    clinicList.innerHTML = reports.map(r => {
      const ti = typeInfo(r.report_type);
      return `
        <div class="rec-card">
          <div class="rec-card-bar" style="background:${ti.bar};"></div>
          <div class="rec-card-body">
            <div class="rec-card-head">
              <div class="rec-type-row">
                <span class="chip ${ti.chip}">${ti.icon} ${ti.label}</span>
                <span class="clinic-badge">✅ Certified by clinic</span>
                ${r.organization ? `<span class="chip chip-gray" style="font-size:12px;">🏥 ${r.organization.name}</span>` : ''}
              </div>
              <span class="rec-date">📅 ${fmt(r.date)}</span>
            </div>
            <p class="rec-desc">${r.description}</p>
            ${r.file_url ? `<div class="rec-meta"><a href="${r.file_url}" target="_blank" class="btn btn-ghost btn-sm" style="font-size:12px;">📎 View Attachment</a></div>` : ''}
          </div>
        </div>`;
    }).join('');
  }

  // ── 渲染授权列表 ──
  function renderShareList(perms) {
    if (!shareList) return;
    if (!perms.length) {
      shareList.innerHTML = `<div class="empty-state" style="padding:20px;"><div class="empty-icon" style="font-size:28px;">🔑</div><p>No clinic permissions yet</p></div>`;
      return;
    }
    shareList.innerHTML = perms.map(p => `
      <div class="perm-item">
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="perm-avatar">${p.is_allowed ? '🏥' : '🚫'}</div>
          <div>
            <div style="font-size:14px;font-weight:600;">Clinic ID</div>
            <code style="font-size:12px;color:#6b7280;">${p.org_id}</code>
          </div>
        </div>
        <span class="chip ${p.is_allowed ? 'chip-green' : 'chip-red'}" style="font-size:13px;">
          ${p.is_allowed ? '✅ Access granted' : '❌ Access denied'}
        </span>
      </div>
    `).join('');
  }

  // ── 加载全部数据 ──
  async function loadAll() {
    if (!catId) {
      const empty = (el, msg) => el && (el.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>${msg}</p></div>`);
      empty(ownerList, 'Please enter a cat ID first');
      empty(clinicList, 'Please enter a cat ID first');
      empty(shareList, 'Please enter a cat ID first');
      return;
    }
    if (catIdDisplay) catIdDisplay.textContent = catId;

    try {
      const res  = await fetch(`${API}/health/records/${catId}`, {
        headers: getAuthHeaders()
      });
      const body = await res.json();
      if (!body.success) { showStatus('Load failed: ' + body.message, true); return; }

      const ownerRecords  = body.data.owner_records    || [];
      const clinicReports = body.data.clinic_reports   || [];
      const sharePerms    = body.data.share_permissions|| [];
      // 缓存 face_code 供护照卡展示（历史数据可能没有此字段）
      window._catFaceCode = body.data.cat?.face_code || null;

      updatePassport(ownerRecords, clinicReports);
      renderOwnerRecords(ownerRecords);
      renderClinicReports(clinicReports);
      renderShareList(sharePerms);
    } catch (e) {
      showStatus('Cannot connect to the backend. Please make sure the server is running.', true);
    }
  }

  // ── 删除记录 ──
  window.deleteRecord = async function (recordId) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const res  = await fetch(`${API}/health/records/${recordId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const body = await res.json();
      if (body.success) { showStatus('Record deleted'); loadAll(); }
      else showStatus('Delete failed: ' + body.message, true);
    } catch { showStatus('Request failed', true); }
  };

  // ── 文件选择预览 ──
  const recFileInput    = document.getElementById('rec-file');
  const recFilePreview  = document.getElementById('rec-file-preview');
  const recUploadStatus = document.getElementById('rec-upload-status');

  if (recFileInput) {
    recFileInput.addEventListener('change', function () {
      const file = recFileInput.files[0];
      if (!file || !recFilePreview) return;
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => {
          recFilePreview.innerHTML = `<img src="${e.target.result}" style="max-width:100%;max-height:200px;display:block;">`;
          recFilePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        recFilePreview.innerHTML = `<div style="padding:12px;font-size:13px;background:#f8f9fa;">📄 ${file.name}</div>`;
        recFilePreview.style.display = 'block';
      }
    });
  }

  // ── 添加记录（支持先上传文件）──
  if (addRecordForm) {
    addRecordForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!catId || !userId) { showStatus('Please enter both the cat ID and user ID first', true); return; }

      const submitBtn = document.getElementById('rec-submit-btn');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Uploading...'; }

      // 1. 如果有选文件，先上传拿到 URL
      let fileUrl = null;
      const fileInput = document.getElementById('rec-file');
      if (fileInput && fileInput.files[0]) {
        if (recUploadStatus) { recUploadStatus.textContent = 'Uploading attachment...'; recUploadStatus.style.display = 'block'; }
        try {
          const formData = new FormData();
          formData.append('file', fileInput.files[0]);
          const uploadRes  = await fetch(`${API}/health/upload`, {
            method: 'POST',
            headers: { "Authorization": `Bearer ${getToken()}` },
            body: formData
          });
          const uploadBody = await uploadRes.json();
          if (uploadBody.success) {
            fileUrl = uploadBody.data.url;
            if (recUploadStatus) recUploadStatus.textContent = '✅ Attachment uploaded successfully';
          } else {
            showStatus('Attachment upload failed: ' + uploadBody.message, true);
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Record'; }
            return;
          }
        } catch {
          showStatus('Attachment upload failed. Please make sure the server is running.', true);
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Record'; }
          return;
        }
      }

      // 提交记录（user_id 由后端 JWT 自动取得，前端不需要传）
      const data = {
        record_type:   document.getElementById('rec-type').value,
        description:   document.getElementById('rec-desc').value.trim(),
        date:          document.getElementById('rec-date').value,
        next_due_date: document.getElementById('rec-next').value   || undefined,
        weight_kg:     document.getElementById('rec-weight').value || undefined,
        vet_name:      document.getElementById('rec-vet').value.trim()    || undefined,
        clinic_name:   document.getElementById('rec-clinic').value.trim() || undefined,
        file_url:      fileUrl || undefined
      };
      try {
        const res  = await fetch(`${API}/health/records/${catId}`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        });
        const body = await res.json();
        if (body.success) {
          showStatus('✅ Health record added');
          addRecordForm.reset();
          if (recFilePreview)  { recFilePreview.style.display = 'none'; recFilePreview.innerHTML = ''; }
          if (recUploadStatus) { recUploadStatus.style.display = 'none'; }
          addRecordSection.style.display = 'none';
          if (toggleAddBtn) toggleAddBtn.textContent = '+ Add Record';
          loadAll();
        } else {
          showStatus('Create failed: ' + body.message, true);
        }
      } catch { showStatus('Request failed. Please make sure the server is running.', true); }
      finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Record'; }
      }
    });
  }

  // ── 授权设置 ──
  if (shareForm) {
    shareForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!catId) { showStatus('Please enter a cat ID first', true); return; }
      const orgId     = document.getElementById('share-org-id').value.trim();
      const isAllowed = document.getElementById('share-allowed').value === 'true';
      if (!orgId) { showStatus('Please enter a clinic ID', true); return; }
      try {
        const res  = await fetch(`${API}/health/share`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ cat_id: catId, org_id: orgId, is_allowed: isAllowed })
        });
        const body = await res.json();
        if (body.success) { showStatus('✅ Permission updated'); loadAll(); }
        else showStatus('Failed: ' + body.message, true);
      } catch { showStatus('Request failed', true); }
    });
  }

  // ── 折叠表单 ──
  if (toggleAddBtn && addRecordSection) {
    toggleAddBtn.addEventListener('click', function () {
      const shown = addRecordSection.style.display !== 'none';
      addRecordSection.style.display = shown ? 'none' : 'block';
      toggleAddBtn.textContent = shown ? '+ Add Record' : 'Collapse';
    });
  }
  if (cancelAddBtn && addRecordSection) {
    cancelAddBtn.addEventListener('click', function () {
      addRecordSection.style.display = 'none';
      if (toggleAddBtn) toggleAddBtn.textContent = '+ Add Record';
    });
  }

  // ── 测试面板 ──
  if (testApplyBtn) {
    testApplyBtn.addEventListener('click', function () {
      const cid = testCatInput  ? testCatInput.value.trim()  : '';
      const uid = testUserInput ? testUserInput.value.trim() : '';
      if (!cid) { showStatus('Please enter a cat ID', true); return; }
      catId = cid; userId = uid;
      localStorage.setItem('catface_test_catId',  catId);
      localStorage.setItem('catface_test_userId', userId);
      showStatus('ID saved. Loading...');
      loadAll();
    });
  }

  // ── 初始化 ──
  if (testCatInput  && catId)  testCatInput.value  = catId;
  if (testUserInput && userId) testUserInput.value = userId;
  loadAll();
})();
