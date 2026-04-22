// frontend/js/health.js — Member 5

(function () {
  const API = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:3000/api';

  const params = new URLSearchParams(window.location.search);

  function readStoredUser() {
    if (typeof getCurrentUser === 'function') return getCurrentUser();
    try {
      return JSON.parse(localStorage.getItem('catface_user') || 'null');
    } catch (e) {
      return null;
    }
  }

  function readOrgProfile() {
    if (typeof getOrgProfile === 'function') return getOrgProfile();
    try {
      return JSON.parse(localStorage.getItem('catface_org_profile') || 'null');
    } catch (e) {
      return null;
    }
  }

  let currentUser = readStoredUser();
  const currentOrg = readOrgProfile();
  let catId  = params.get('catId') || localStorage.getItem('catface_current_cat_id') || localStorage.getItem('catface_test_catId') || '';
  let userId = (currentUser && currentUser.id) || params.get('userId') || localStorage.getItem('catface_test_userId') || '';

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
    deworming:  { bar: '#10b981', chip: 'chip-green',  icon: '🐛', label: 'Deworming'     },
    checkup:    { bar: '#0891b2', chip: 'chip-teal',   icon: '🩺', label: 'Checkup'       },
    treatment:  { bar: '#f59e0b', chip: 'chip-orange', icon: '💊', label: 'Treatment'      },
    surgery:    { bar: '#8b5cf6', chip: 'chip-purple', icon: '✂️',  label: 'Surgery'       },
    blood_test: { bar: '#ef4444', chip: 'chip-red',    icon: '🔬', label: 'Blood Report'  },
    vaccination:{ bar: '#3b82f6', chip: 'chip-blue',   icon: '💉', label: 'Vaccination'  },
    other:      { bar: '#94a3b8', chip: 'chip-gray',   icon: '📋', label: 'Other'        }
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

  function persistHealthContext() {
    try {
      if (catId) localStorage.setItem('catface_current_cat_id', catId);
      if (userId) localStorage.setItem('catface_current_user_id', userId);
    } catch (e) {}
  }

  function renderAccessNotice(message) {
    const empty = function (el) {
      if (!el) return;
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔒</div><p>${message}</p></div>`;
    };
    empty(ownerList);
    empty(clinicList);
    empty(shareList);
    updatePassport([], []);
    showStatus(message, true);
  }

  function isOrganizationSession() {
    const orgToken = typeof getOrgToken === 'function'
      ? getOrgToken()
      : localStorage.getItem('catface_org_token');
    return !!((currentUser && currentUser.account_type === 'organization' && currentOrg) || (orgToken && currentOrg));
  }

  async function resolveCurrentCatId() {
    if (catId) return catId;
    if (!userId) {
      currentUser = readStoredUser();
      userId = (currentUser && currentUser.id) || '';
    }
    if (!userId) return '';

    try {
      const res = await fetch(`${API}/cats`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const body = await res.json();
      if (!body.success || !Array.isArray(body.data)) return '';
      const ownedCat = body.data.find(function (cat) {
        return cat && cat.owner_id === userId;
      });
      if (!ownedCat) return '';
      catId = ownedCat.id || '';
      persistHealthContext();
      return catId;
    } catch (e) {
      return '';
    }
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

    if (nameEl) nameEl.textContent = catId ? 'Health Passport' : '— Health Passport';
    const catLabel = window._catFaceCode
      ? `Code: ${window._catFaceCode}`
      : catId ? `ID: ${catId.slice(0,8)}…` : '';
    if (metaEl) metaEl.textContent = catId
      ? `${catLabel}  ·  ${all.length} records`
      : 'Please link a cat to your account to load data';

    if (!badgesEl) return;

    function makeBadge(icon, label, date, status) {
      const cls = status === 'ok' ? 'pbadge ok' : status === 'warn' ? 'pbadge warn' : 'pbadge none';
      return `<div class="${cls}"><span class="pb-icon">${icon}</span><span class="pb-label">${label}</span><span class="pb-date">${date || '未記錄'}</span></div>`;
    }

    let html = '';
    html += makeBadge('💉', 'Vaccine',    latestVaccine   ? fmt(latestVaccine.date)   : null, latestVaccine   ? 'ok' : 'none');
    html += makeBadge('🐛', 'Deworming',  latestDeworming ? fmt(latestDeworming.date) : null, latestDeworming ? 'ok' : 'none');
    html += makeBadge('✂️', 'Neutered',   latestSurgery   ? fmt(latestSurgery.date)   : null, latestSurgery   ? 'ok' : 'none');
    html += makeBadge('⚖️', 'Weight',     latestWeight    ? latestWeight.weight_kg + ' kg' : null, latestWeight ? 'ok' : 'none');
    if (upcoming) {
      const days = daysUntil(upcoming.next_due_date);
      html += `<div class="pbadge ${days <= 7 ? 'warn' : 'ok'}"><span class="pb-icon">⏰</span><span class="pb-label">Reminder</span><span class="pb-date">${fmt(upcoming.next_due_date)} (${days >= 0 ? days+'d' : 'overdue'})</span></div>`;
    }
    badgesEl.innerHTML = html;
  }

  // ── Render owner records ──
  function renderOwnerRecords(records) {
    if (!ownerList) return;
    if (ownerCount) ownerCount.textContent = records.length + ' records';
    if (!records.length) {
      ownerList.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>No records yet. Click "Add Record" above to get started.</p></div>`;
      return;
    }
    ownerList.innerHTML = records.map(r => {
      const ti = typeInfo(r.record_type);
      const days = r.next_due_date ? daysUntil(r.next_due_date) : null;
      const reminderHtml = r.next_due_date
        ? `<span class="reminder-badge">⏰ Next: ${fmt(r.next_due_date)}${days !== null ? ` (${days >= 0 ? days+'d' : 'overdue'})` : ''}</span>`
        : '';
      let endorsementBadges = '';
      if (r.endorsements && r.endorsements.length > 0) {
        endorsementBadges = '<div style="margin-top:6px;display:flex;flex-direction:column;gap:4px;">';
        r.endorsements.forEach(e => {
          endorsementBadges += '<div style="background:#e9faf2;border:1px solid #a7f3d0;border-radius:8px;padding:6px 10px;font-size:12px;">' +
            '<span style="font-weight:700;color:#065f46;">✅ ' + (e.organization && e.organization.name ? e.organization.name : 'Clinic') + ' endorsed: </span>' +
            '<span style="color:#065f46;">' + e.endorsement + '</span>' +
            (e.note ? '<br><span style="color:#6b7280;font-size:11px;">📝 ' + e.note + '</span>' : '') +
            '</div>';
        });
        endorsementBadges += '</div>';
      }
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
            ${endorsementBadges}
            ${r.file_url ? `
            <div style="margin-top:10px;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;max-width:320px;">
              ${/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(r.file_url)
                ? `<img src="${r.file_url}" style="width:100%;max-height:180px;object-fit:cover;display:block;" loading="lazy">`
                : `<a href="${r.file_url}" target="_blank" style="display:flex;align-items:center;gap:8px;padding:10px 14px;font-size:13px;color:#2563eb;background:#f8f9fa;">📄 View Attachment PDF</a>`
              }
            </div>` : ''}
            <div class="rec-actions">
              <button onclick="deleteRecord('${r.id}')" class="btn btn-danger btn-sm">🗑 Delete</button>
              ${r.file_url ? `<a href="${r.file_url}" target="_blank" class="btn btn-ghost btn-sm" style="font-size:12px;">📎 Download</a>` : ''}
            </div>
          </div>
        </div>`;
    }).join('');
  }

  // ── Render clinic-certified reports ──
  function renderClinicReports(reports) {
    if (!clinicList) return;
    if (clinicCount) clinicCount.textContent = reports.length + ' records';
    if (!reports.length) {
      clinicList.innerHTML = `<div class="empty-state"><div class="empty-icon">🏥</div><p>No clinic reports yet.<br><span style="font-size:12px;">Authorize a clinic from the Permissions tab to start receiving reports.</span></p></div>`;
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
                <span class="clinic-badge">✅ Clinic Certified</span>
                ${r.organization ? `<span class="chip chip-gray" style="font-size:12px;">🏥 ${r.organization.name}</span>` : ''}
                ${r.vet_name ? `<span class="chip chip-gray" style="font-size:11px;">👨‍⚕️ ${r.vet_name}</span>` : ''}
              </div>
              <span class="rec-date">📅 ${fmt(r.date)}</span>
            </div>
            ${r.findings ? `<p class="rec-desc" style="color:var(--text);font-weight:600;">🔍 ${r.findings}</p>` : ''}
            <p class="rec-desc">${r.description}</p>
            ${r.recommendations ? `<p class="rec-desc" style="color:var(--green);">💡 ${r.recommendations}</p>` : ''}
            <div class="rec-meta">
              ${r.vet_license ? `<span class="chip chip-gray" style="font-size:11px;">📜 ${r.vet_license}</span>` : ''}
              ${r.file_url ? `<a href="${r.file_url}" target="_blank" class="btn btn-ghost btn-sm" style="font-size:12px;">📎 View Attachment</a>` : ''}
            </div>
            <div class="rec-actions">
              <button onclick="window.printReport('${r.id}')" class="btn btn-primary btn-sm">🖨 Print Report</button>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  window.printReport = async function (reportId) {
    try {
      showStatus('Generating report...');
      const res = await fetch(`${API}/clinic/reports/${reportId}/print`, { headers: getAuthHeaders() });
      const body = await res.json();
      if (!body.success) { showStatus('Failed to generate report: ' + body.message, true); return; }
      const printWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes');
      if (!printWindow) { showStatus('Please allow popups to print the report', true); return; }
      printWindow.document.write(body.data.html);
      printWindow.document.close();
      setTimeout(function () { printWindow.focus(); }, 300);
    } catch (e) { showStatus('Request failed', true); }
  };

  // ── 诊所列表 ──
  let availableClinics = [];

  async function loadClinicList() {
    const select = document.getElementById('share-org-id');
    const loading = document.getElementById('clinic-list-loading');
    if (!select) return;
    try {
      const res = await fetch(`${API}/health/clinics`, { headers: getAuthHeaders() });
      const body = await res.json();
      if (body.success && Array.isArray(body.data)) {
        availableClinics = body.data;
        select.innerHTML = '<option value="">— Select a clinic —</option>';
        availableClinics.forEach(function (c) {
          const verified = c.is_verified ? ' ✓ Verified' : '';
          select.innerHTML += `<option value="${c.id}">${c.name}${verified}${c.address ? ' · ' + c.address : ''}</option>`;
        });
        if (loading) { loading.style.display = 'none'; }
      } else {
        if (loading) { loading.textContent = '⚠ Could not load clinic list: ' + (body.message || ''); }
      }
    } catch (e) {
      if (loading) { loading.textContent = '⚠ Cannot connect to server. Please ensure the server is running'; }
    }
  }

  // ── 渲染授权列表（含诊所详情）──
  function renderShareList(perms) {
    if (!shareList) return;
    if (!perms.length) {
      shareList.innerHTML = `<div class="empty-state" style="padding:20px;"><div class="empty-icon" style="font-size:28px;">🔑</div><p>No clinic permissions granted yet</p></div>`;
      return;
    }
    shareList.innerHTML = perms.map(function (p) {
      const isActive = p.is_allowed && (!p.expires_at || new Date(p.expires_at) > new Date());
      const isExpired = p.expires_at && new Date(p.expires_at) <= new Date();
      const permType = p.permission_type === 'read_only' ? '👁 Read Only' : '🔓 Full Access';
      const permColor = p.permission_type === 'read_only' ? 'chip-teal' : 'chip-blue';
      const statusColor = isActive ? 'chip-green' : (isExpired ? 'chip-gray' : 'chip-red');
      const statusText = isExpired ? 'Expired' : (isActive ? 'Authorized' : 'Revoked');
      const orgName = (p.org && p.org.name) ? p.org.name : (p.org_id ? 'ID: ' + p.org_id.slice(0,8) + '…' : 'Unknown clinic');
      const expiresText = p.expires_at ? ', until ' + fmt(p.expires_at) : ', permanent';
      return `
        <div class="perm-item">
          <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
            <div class="perm-avatar">${p.is_allowed ? '🏥' : '🚫'}</div>
            <div style="min-width:0;">
              <div style="font-size:14px;font-weight:600;margin-bottom:3px;">${orgName}</div>
              <div style="font-size:12px;color:var(--muted);">
                ${permType}${expiresText}
                ${p.note ? '<br>📝 ' + p.note : ''}
              </div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;">
            <span class="chip ${statusColor}" style="font-size:12px;">${statusText}</span>
            ${p.org && p.org.is_verified ? '<span class="chip chip-blue" style="font-size:10px;">✓ 已認證</span>' : ''}
          </div>
        </div>`;
    }).join('');
  }

  // ── 加载全部数据 ──
  async function loadAll() {
    if (!userId) {
      currentUser = readStoredUser();
      userId = (currentUser && currentUser.id) || '';
    }
    if (!catId) {
      await resolveCurrentCatId();
    }
    if (!catId) {
      const empty = (el, msg) => el && (el.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>${msg}</p></div>`);
      empty(ownerList, 'This account has no cat linked. Please create and save a cat profile in "My Account" first');
      empty(clinicList, 'This account has no cat linked.');
      empty(shareList, 'This account has no cat linked.');
      showStatus('This account has no cat linked. Please create and save a cat profile in "My Account" first', true);
      return;
    }
    if (catIdDisplay) catIdDisplay.textContent = catId;
    persistHealthContext();

    try {
      const res  = await fetch(`${API}/health/records/${catId}`, {
        headers: getAuthHeaders()
      });
      const body = await res.json();
      if (!body.success) { showStatus('載入失敗：' + body.message, true); return; }

      const ownerRecords  = body.data.owner_records    || [];
      const clinicReports = body.data.clinic_reports   || [];
      const sharePerms    = body.data.share_permissions|| [];

      window._catFaceCode = body.data.cat?.face_code || null;

      updatePassport(ownerRecords, clinicReports);
      renderOwnerRecords(ownerRecords);
      renderClinicReports(clinicReports);
      renderShareList(sharePerms);
      loadClinicList();
    } catch (e) {
      showStatus('無法連接後端，請確認伺服器正在運行', true);
    }
  }

  // ── Delete record ──
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
      if (!catId) {
        await resolveCurrentCatId();
      }
      if (!catId) { showStatus('此帳號尚未關聯任何貓咪，請先在「我的帳戶」中新增並保存您的貓咪檔案', true); return; }

      const submitBtn = document.getElementById('rec-submit-btn');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '上傳中…'; }

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
            if (recUploadStatus) recUploadStatus.textContent = '✅ Attachment uploaded';
          } else {
            showStatus('Upload failed: ' + uploadBody.message, true);
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Record'; }
            return;
          }
        } catch {
          showStatus('Upload failed. Please ensure the server is running', true);
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Record'; }
          return;
        }
      }

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
          showStatus('✅ Health record added!');
          addRecordForm.reset();
          if (recFilePreview)  { recFilePreview.style.display = 'none'; recFilePreview.innerHTML = ''; }
          if (recUploadStatus) { recUploadStatus.style.display = 'none'; }
          addRecordSection.style.display = 'none';
          if (toggleAddBtn) toggleAddBtn.textContent = '＋ Add Record';
          loadAll();
        } else {
          showStatus('Add failed: ' + body.message, true);
        }
      } catch { showStatus('Request failed. Please ensure the server is running', true); }
      finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Record'; }
      }
    });
  }

  // ── Permission form (fine-grained) ──
  if (shareForm) {
    shareForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!catId) { showStatus('Please link a cat first', true); return; }
      const orgId       = document.getElementById('share-org-id').value.trim();
      const isAllowed   = document.getElementById('share-allowed').value === 'true';
      const permType    = document.getElementById('share-perm-type').value;
      const expiresAt   = document.getElementById('share-expires').value || undefined;
      const note        = document.getElementById('share-note').value.trim() || undefined;
      if (!orgId) { showStatus('Please select a clinic', true); return; }
      try {
        const res = await fetch(`${API}/health/share`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            cat_id: catId,
            org_id: orgId,
            is_allowed: isAllowed,
            permission_type: permType,
            expires_at: expiresAt,
            note: note
          })
        });
        const body = await res.json();
        if (body.success) {
          showStatus('✅ Permission saved!');
          document.getElementById('share-note').value = '';
          document.getElementById('share-expires').value = '';
          loadAll();
        }
        else showStatus('Failed: ' + body.message, true);
      } catch { showStatus('Request failed', true); }
    });
  }

  // ── Toggle add form ──
  if (toggleAddBtn && addRecordSection) {
    toggleAddBtn.addEventListener('click', function () {
      const shown = addRecordSection.style.display !== 'none';
      addRecordSection.style.display = shown ? 'none' : 'block';
      toggleAddBtn.textContent = shown ? '＋ Add Record' : 'Collapse';
    });
  }
  if (cancelAddBtn && addRecordSection) {
    cancelAddBtn.addEventListener('click', function () {
      addRecordSection.style.display = 'none';
      if (toggleAddBtn) toggleAddBtn.textContent = '＋ Add Record';
    });
  }

  // ── Initialize ──
  if (isOrganizationSession()) {
    const orgType = currentOrg && currentOrg.type === 'clinic' ? 'clinic' : 'rescue';
    const message = orgType === 'clinic'
      ? 'Clinic accounts should use the Clinic Portal instead of the owner Health page.'
      : 'Organization accounts should use the Rescue Dashboard instead of the owner Health page.';
    renderAccessNotice(message);
  } else {
    loadAll();
  }
})();
