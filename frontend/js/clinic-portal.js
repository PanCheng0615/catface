// frontend/js/clinic-portal.js — Member 5

(function () {
  const API = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:3000/api';

  const params = new URLSearchParams(window.location.search);
  let orgId = params.get('orgId') || localStorage.getItem('catface_clinic_orgId') || '';
  let selectedCatId = '';
  let selectedCatName = '';

  // ── DOM ──
  const statusMsg     = document.getElementById('status-msg');
  const testOrgInput  = document.getElementById('test-org-id-input');
  const testApplyBtn  = document.getElementById('test-apply-btn');
  const currentOrgEl  = document.getElementById('current-org-id');
  const clinicNameEl  = document.getElementById('clinic-name-display');
  const clinicIdEl    = document.getElementById('clinic-id-display');
  const statCatsEl    = document.getElementById('stat-cats');
  const catListEl     = document.getElementById('authorized-cat-list');
  const noSelEl       = document.getElementById('no-selection');
  const detailEl      = document.getElementById('cat-detail-section');
  const detailName    = document.getElementById('detail-cat-name');
  const patientTags   = document.getElementById('patient-health-tags');
  const ownerRecsEl   = document.getElementById('detail-owner-records');
  const existingEl    = document.getElementById('existing-reports');
  const reportsCount  = document.getElementById('reports-count');
  const uploadForm    = document.getElementById('upload-report-form');

  // ── 颜色映射 ──
  const TYPE_COLOR = {
    vaccination:{ bar: '#3b82f6', chip: 'chip-blue',   icon: '💉', label: '疫苗接種證明' },
    vaccine:    { bar: '#3b82f6', chip: 'chip-blue',   icon: '💉', label: '疫苗接種'     },
    deworming:  { bar: '#10b981', chip: 'chip-green',  icon: '🐛', label: '驅蟲證明'     },
    checkup:    { bar: '#0891b2', chip: 'chip-teal',   icon: '🩺', label: '健康檢查報告' },
    blood_test: { bar: '#ef4444', chip: 'chip-red',    icon: '🔬', label: '血液報告'     },
    treatment:  { bar: '#f59e0b', chip: 'chip-orange', icon: '💊', label: '疾病治療'     },
    surgery:    { bar: '#8b5cf6', chip: 'chip-purple', icon: '✂️',  label: '手術/絕育證明'},
    other:      { bar: '#94a3b8', chip: 'chip-gray',   icon: '📋', label: '其他醫療文件' }
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
    showStatus._t = setTimeout(() => { statusMsg.style.display = 'none'; }, 4000);
  }

  // ── 加载授权猫咪列表 ──
  async function loadAuthorizedCats() {
    if (!orgId) { catListEl.innerHTML = `<div class="empty-state"><div class="ei">🐱</div><p>請先輸入診所 ID</p></div>`; return; }
    if (currentOrgEl) currentOrgEl.textContent = orgId;
    if (clinicIdEl)   clinicIdEl.textContent   = `診所 ID：${orgId.slice(0, 12)}…`;

    catListEl.innerHTML = `<div class="empty-state"><div class="ei">⏳</div><p>載入中…</p></div>`;
    try {
      // 同时获取诊所信息
      const [catsRes, orgsRes] = await Promise.all([
        fetch(`${API}/clinic/cats?orgId=${encodeURIComponent(orgId)}`),
        fetch(`${API}/organizations`)
      ]);
      const catsBody = await catsRes.json();
      const orgsBody = await orgsRes.json();

      if (orgsBody.success) {
        const org = orgsBody.data.find(o => o.id === orgId);
        if (org && clinicNameEl) clinicNameEl.textContent = org.name;
      }

      if (!catsBody.success) { showStatus('載入失敗：' + catsBody.message, true); return; }
      const cats = catsBody.data;
      if (statCatsEl) statCatsEl.textContent = cats.length;

      if (!cats.length) {
        catListEl.innerHTML = `<div class="empty-state"><div class="ei">🐱</div><p>暫無貓主人授權此診所查看資料<br><small>請請貓主人在健康頁面設定授權</small></p></div>`;
        return;
      }

      catListEl.innerHTML = cats.map(item => {
        const c = item.cat;
        const gMap = { male: '公', female: '母', unknown: '未知' };
        const badges = [
          c.is_vaccinated ? `<span class="chip chip-blue" style="font-size:10px;">💉 已接種</span>` : '',
          c.is_neutered   ? `<span class="chip chip-purple" style="font-size:10px;">✂️ 已絕育</span>` : '',
          c.is_dewormed   ? `<span class="chip chip-green" style="font-size:10px;">🐛 已驅蟲</span>` : ''
        ].filter(Boolean).join('');
        // 優先顯示 face_code，無則降級顯示 id 前 8 位，歷史資料無需隨機生成
        const displayCode = c.face_code ? `🐾 ${c.face_code}` : `ID: ${c.id.slice(0,8)}…`;
        return `
          <div class="cat-item" id="cat-item-${c.id}" onclick="selectCat('${c.id}', '${c.name.replace(/'/g,"\\'")}')">
            <div class="cat-avatar">🐱</div>
            <div style="flex:1;min-width:0;">
              <div class="cat-name">${c.name}</div>
              <div class="cat-meta">${c.breed || '品種未知'} · ${gMap[c.gender] || '未知'} · ${c.age_months ? c.age_months + '個月' : '年齡未知'}</div>
              <div style="font-size:11px;color:var(--muted);margin-top:2px;">${displayCode}</div>
              ${badges ? `<div class="cat-badges">${badges}</div>` : ''}
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:#94a3b8;flex-shrink:0;"><path d="M9 18l6-6-6-6"/></svg>
          </div>`;
      }).join('');

    } catch (e) {
      showStatus('無法連接後端，請確認伺服器運行中', true);
      catListEl.innerHTML = `<div class="empty-state"><div class="ei">⚠️</div><p>連線失敗</p></div>`;
    }
  }

  // ── 选中猫咪 ──
  window.selectCat = async function (catId, catName) {
    selectedCatId   = catId;
    selectedCatName = catName;

    // 更新选中样式
    document.querySelectorAll('.cat-item').forEach(el => el.classList.remove('selected'));
    const el = document.getElementById('cat-item-' + catId);
    if (el) el.classList.add('selected');

    // 显示详情区
    if (noSelEl)   noSelEl.style.display    = 'none';
    if (detailEl)  { detailEl.style.display = 'flex'; detailEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    if (detailName) detailName.textContent  = catName;

    ownerRecsEl.innerHTML  = `<div class="empty-state"><div class="ei">⏳</div><p>載入中…</p></div>`;
    existingEl.innerHTML   = `<div class="empty-state"><div class="ei">⏳</div><p>載入中…</p></div>`;

    try {
      const res  = await fetch(`${API}/health/records/${catId}`);
      const body = await res.json();
      if (!body.success) { showStatus('載入健康記錄失敗', true); return; }

      renderPatientTags(body.data.owner_records || []);
      renderOwnerRecords(body.data.owner_records || []);
      renderExistingReports(body.data.clinic_reports.filter(r => r.org_id === orgId) || []);
    } catch { showStatus('載入失敗', true); }
  };

  // ── 病患健康标签摘要 ──
  function renderPatientTags(records) {
    if (!patientTags) return;
    const hasVaccine  = records.some(r => r.record_type === 'vaccine');
    const hasDeworming= records.some(r => r.record_type === 'deworming');
    const hasSurgery  = records.some(r => r.record_type === 'surgery');
    const latestWeight= records.find(r => r.weight_kg);
    const upcoming    = records.filter(r => r.next_due_date).sort((a,b) => new Date(a.next_due_date) - new Date(b.next_due_date))[0];
    let html = '';
    if (hasVaccine)   html += `<span class="chip chip-blue">💉 有疫苗記錄</span>`;
    if (hasDeworming) html += `<span class="chip chip-green">🐛 有驅蟲記錄</span>`;
    if (hasSurgery)   html += `<span class="chip chip-purple">✂️ 有手術記錄</span>`;
    if (latestWeight) html += `<span class="chip chip-gray">⚖️ ${latestWeight.weight_kg} kg</span>`;
    if (upcoming)     html += `<span class="chip chip-orange">⏰ 下次提醒：${fmt(upcoming.next_due_date)}</span>`;
    if (!html)        html  = `<span class="chip chip-gray" style="font-size:12px;">暫無健康記錄標籤</span>`;
    patientTags.innerHTML = html;
  }

  // ── 渲染主人记录（只读）──
  function renderOwnerRecords(records) {
    if (!ownerRecsEl) return;
    if (!records.length) {
      ownerRecsEl.innerHTML = `<div class="empty-state"><div class="ei">📋</div><p>主人尚無填寫健康記錄</p></div>`;
      return;
    }
    ownerRecsEl.innerHTML = records.map(r => {
      const t = ti(r.record_type);
      return `
        <div class="rec-card">
          <div class="rec-bar" style="background:${t.bar};"></div>
          <div class="rec-body">
            <div class="rec-head">
              <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap;">
                <span class="chip ${t.chip}">${t.icon} ${t.label}</span>
                ${r.vet_name ? `<span class="chip chip-gray" style="font-size:11px;">👨‍⚕️ ${r.vet_name}${r.clinic_name ? ' · ' + r.clinic_name : ''}</span>` : ''}
              </div>
              <span style="font-size:12px;color:var(--muted);">📅 ${fmt(r.date)}</span>
            </div>
            <p class="rec-desc">${r.description}</p>
            <div class="rec-meta">
              ${r.weight_kg   ? `<span class="chip chip-gray" style="font-size:11px;">⚖️ ${r.weight_kg} kg</span>` : ''}
              ${r.next_due_date ? `<span class="chip chip-orange" style="font-size:11px;">⏰ 下次：${fmt(r.next_due_date)}</span>` : ''}
            </div>
          </div>
        </div>`;
    }).join('');
  }

  // ── 渲染本诊所已上传的报告 ──
  function renderExistingReports(reports) {
    if (!existingEl) return;
    if (reportsCount) reportsCount.textContent = reports.length + ' 份';
    if (!reports.length) {
      existingEl.innerHTML = `<div class="empty-state"><div class="ei">📄</div><p>本診所尚無已上傳報告</p></div>`;
      return;
    }
    existingEl.innerHTML = reports.map(r => {
      const t = ti(r.report_type);
      return `
        <div class="rec-card">
          <div class="rec-bar" style="background:${t.bar};"></div>
          <div class="rec-body">
            <div class="rec-head">
              <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap;">
                <span class="chip ${t.chip}">${t.icon} ${t.label}</span>
                <span class="clinic-cert-badge">✅ 已認證</span>
              </div>
              <span style="font-size:12px;color:var(--muted);">📅 ${fmt(r.date)}</span>
            </div>
            <p class="rec-desc">${r.description}</p>
            ${r.file_url ? `<div class="rec-meta"><a href="${r.file_url}" target="_blank" class="btn btn-blue btn-sm">📎 查看文件</a></div>` : ''}
            <div class="rec-actions">
              <button onclick="deleteReport('${r.id}')" class="btn btn-danger btn-sm">🗑 刪除</button>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  // ── 删除报告 ──
  window.deleteReport = async function (reportId) {
    if (!confirm('確定要刪除這份報告嗎？')) return;
    try {
      const res  = await fetch(`${API}/clinic/reports/${reportId}`, { method: 'DELETE' });
      const body = await res.json();
      if (body.success) { showStatus('報告已刪除'); selectCat(selectedCatId, selectedCatName); }
      else              showStatus('刪除失敗：' + body.message, true);
    } catch { showStatus('請求失敗', true); }
  };

  // ── 上传报告 ──
  if (uploadForm) {
    uploadForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!selectedCatId) { showStatus('請先從左側選擇一位病患', true); return; }
      if (!orgId)         { showStatus('請先填寫診所 ID', true);    return; }

      const report_type = document.getElementById('rpt-type').value;
      const date        = document.getElementById('rpt-date').value;
      const vet         = document.getElementById('rpt-vet').value.trim();
      const ref         = document.getElementById('rpt-ref').value.trim();
      let description   = document.getElementById('rpt-desc').value.trim();

      if (vet) description += `\n\n主治獸醫：${vet}`;
      if (ref) description += `\n文件編號：${ref}`;

      try {
        const res  = await fetch(`${API}/clinic/reports/${selectedCatId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ org_id: orgId, report_type, description, date })
        });
        const body = await res.json();
        if (body.success) {
          showStatus('✅ 認證報告上傳成功！');
          uploadForm.reset();
          selectCat(selectedCatId, selectedCatName);
        } else {
          showStatus('上傳失敗：' + body.message, true);
        }
      } catch { showStatus('請求失敗，請確認伺服器運行中', true); }
    });
  }

  // ── 测试面板 ──
  if (testApplyBtn) {
    testApplyBtn.addEventListener('click', function () {
      const id = testOrgInput?.value.trim();
      if (!id) { showStatus('請輸入診所 ID', true); return; }
      orgId = id;
      localStorage.setItem('catface_clinic_orgId', orgId);
      showStatus('ID 已設置，載入中…');
      loadAuthorizedCats();
    });
  }

  // ── 初始化 ──
  if (testOrgInput && orgId) testOrgInput.value = orgId;
  loadAuthorizedCats();
})();
