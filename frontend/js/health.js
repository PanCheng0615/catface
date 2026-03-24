// frontend/js/health.js
// Member 5 — 健康管理页面 API 对接

(function () {
  const API = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:3000/api';

  // ── 从 URL 参数取 catId，测试时可直接在地址栏加 ?catId=xxx ──
  const params  = new URLSearchParams(window.location.search);
  let   catId   = params.get('catId') || localStorage.getItem('catface_test_catId') || '';
  let   userId  = params.get('userId') || localStorage.getItem('catface_test_userId') || '';

  // ── DOM ──
  const catIdDisplay     = document.getElementById('current-cat-id');
  const ownerList        = document.getElementById('owner-records-list');
  const clinicList       = document.getElementById('clinic-records-list');
  const shareList        = document.getElementById('share-list');
  const addRecordForm    = document.getElementById('add-record-form');
  const addRecordSection = document.getElementById('add-record-section');
  const shareForm        = document.getElementById('share-form');
  const testPanel        = document.getElementById('test-id-panel');
  const testCatInput     = document.getElementById('test-cat-id-input');
  const testUserInput    = document.getElementById('test-user-id-input');
  const testApplyBtn     = document.getElementById('test-apply-btn');
  const statusMsg        = document.getElementById('status-msg');

  // ── 工具函数 ──
  function showStatus(msg, isError) {
    if (!statusMsg) return;
    statusMsg.textContent = msg;
    statusMsg.style.background = isError ? '#fee2e2' : '#d1fae5';
    statusMsg.style.color      = isError ? '#991b1b' : '#065f46';
    statusMsg.style.display    = 'block';
    setTimeout(() => { statusMsg.style.display = 'none'; }, 4000);
  }

  function formatDate(iso) {
    if (!iso) return '—';
    return iso.slice(0, 10);
  }

  const TYPE_LABELS = {
    vaccine:    '💉 疫苗',
    deworming:  '🐛 驱虫',
    checkup:    '🩺 体检',
    treatment:  '💊 治疗',
    surgery:    '🔪 手术',
    other:      '📋 其他'
  };

  // ── 加载全部健康数据 ──
  async function loadAll() {
    if (!catId) {
      if (ownerList)  ownerList.innerHTML  = '<p style="color:#888">请先输入猫咪 ID</p>';
      if (clinicList) clinicList.innerHTML = '<p style="color:#888">请先输入猫咪 ID</p>';
      if (shareList)  shareList.innerHTML  = '<p style="color:#888">请先输入猫咪 ID</p>';
      return;
    }

    if (catIdDisplay) catIdDisplay.textContent = catId;

    try {
      const res  = await fetch(`${API}/health/records/${catId}`);
      const body = await res.json();

      if (!body.success) { showStatus('加载失败：' + body.message, true); return; }

      renderOwnerRecords(body.data.owner_records  || []);
      renderClinicReports(body.data.clinic_reports || []);
      renderShareList(body.data.share_permissions  || []);
    } catch (e) {
      showStatus('无法连接后端，请确认服务器正在运行', true);
    }
  }

  // ── 渲染：主人健康记录 ──
  function renderOwnerRecords(records) {
    if (!ownerList) return;
    if (!records.length) {
      ownerList.innerHTML = '<p style="color:#888;font-size:14px;">暂无记录，点击下方「添加记录」按钮新增。</p>';
      return;
    }
    ownerList.innerHTML = records.map(r => `
      <div style="border:1px solid #e5e7eb;border-radius:14px;padding:14px 16px;background:#fafbfc;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <span style="font-weight:700;font-size:15px;">${TYPE_LABELS[r.record_type] || r.record_type}</span>
          <span style="font-size:12px;color:#6b7280;">${formatDate(r.date)}</span>
        </div>
        <p style="margin:6px 0 0;color:#374151;font-size:14px;">${r.description}</p>
        ${r.weight_kg    ? `<p style="margin:4px 0 0;font-size:13px;color:#6b7280;">体重：${r.weight_kg} kg</p>` : ''}
        ${r.vet_name     ? `<p style="margin:2px 0 0;font-size:13px;color:#6b7280;">医生：${r.vet_name}（${r.clinic_name || ''}）</p>` : ''}
        ${r.next_due_date ? `<p style="margin:4px 0 0;font-size:13px;color:#d97706;">下次提醒：${formatDate(r.next_due_date)}</p>` : ''}
        <div style="margin-top:10px;">
          <button onclick="deleteRecord('${r.id}')"
            style="font-size:12px;padding:5px 12px;border:1px solid #fca5a5;border-radius:999px;background:#fff;color:#dc2626;cursor:pointer;">
            删除
          </button>
        </div>
      </div>
    `).join('');
  }

  // ── 渲染：诊所报告 ──
  function renderClinicReports(reports) {
    if (!clinicList) return;
    if (!reports.length) {
      clinicList.innerHTML = '<p style="color:#888;font-size:14px;">暂无诊所上传的官方报告。</p>';
      return;
    }
    clinicList.innerHTML = reports.map(r => `
      <div style="border:1px solid #e5e7eb;border-radius:14px;padding:14px 16px;background:#f0fdf4;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <span style="font-weight:700;font-size:15px;">${TYPE_LABELS[r.report_type] || r.report_type}
            <span style="font-size:11px;background:#bbf7d0;color:#14532d;padding:2px 8px;border-radius:999px;margin-left:6px;">诊所认证</span>
          </span>
          <span style="font-size:12px;color:#6b7280;">${formatDate(r.date)}</span>
        </div>
        <p style="margin:6px 0 0;color:#374151;font-size:14px;">${r.description}</p>
        ${r.organization ? `<p style="margin:4px 0 0;font-size:13px;color:#6b7280;">来源：${r.organization.name}</p>` : ''}
        ${r.file_url ? `<a href="${r.file_url}" target="_blank" style="font-size:13px;color:#2563eb;margin-top:4px;display:inline-block;">查看附件</a>` : ''}
      </div>
    `).join('');
  }

  // ── 渲染：授权列表 ──
  function renderShareList(perms) {
    if (!shareList) return;
    if (!perms.length) {
      shareList.innerHTML = '<p style="color:#888;font-size:14px;">暂未对任何诊所授权。</p>';
      return;
    }
    shareList.innerHTML = perms.map(p => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;">
        <span style="font-size:14px;">诊所 ID：<code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;">${p.org_id}</code></span>
        <span style="font-size:13px;font-weight:700;color:${p.is_allowed ? '#059669' : '#dc2626'};">
          ${p.is_allowed ? '✅ 已授权' : '❌ 已拒绝'}
        </span>
      </div>
    `).join('');
  }

  // ── 删除健康记录 ──
  window.deleteRecord = async function (recordId) {
    if (!confirm('确定要删除这条记录吗？')) return;
    try {
      const res  = await fetch(`${API}/health/records/${recordId}`, { method: 'DELETE' });
      const body = await res.json();
      if (body.success) { showStatus('记录已删除'); loadAll(); }
      else              showStatus('删除失败：' + body.message, true);
    } catch (e) {
      showStatus('请求失败', true);
    }
  };

  // ── 添加健康记录 ──
  if (addRecordForm) {
    addRecordForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!catId || !userId) {
        showStatus('请先在上方填写猫咪 ID 和用户 ID', true);
        return;
      }

      const data = {
        user_id:      userId,
        record_type:  document.getElementById('rec-type').value,
        description:  document.getElementById('rec-desc').value.trim(),
        date:         document.getElementById('rec-date').value,
        next_due_date:document.getElementById('rec-next').value || undefined,
        weight_kg:    document.getElementById('rec-weight').value || undefined,
        vet_name:     document.getElementById('rec-vet').value.trim()  || undefined,
        clinic_name:  document.getElementById('rec-clinic').value.trim() || undefined
      };

      try {
        const res  = await fetch(`${API}/health/records/${catId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const body = await res.json();
        if (body.success) {
          showStatus('健康记录添加成功！');
          addRecordForm.reset();
          if (addRecordSection) addRecordSection.style.display = 'none';
          loadAll();
        } else {
          showStatus('添加失败：' + body.message, true);
        }
      } catch (e) {
        showStatus('请求失败，请确认服务器运行中', true);
      }
    });
  }

  // ── 设置授权 ──
  if (shareForm) {
    shareForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!catId || !userId) {
        showStatus('请先在上方填写猫咪 ID 和用户 ID', true);
        return;
      }

      const orgId     = document.getElementById('share-org-id').value.trim();
      const isAllowed = document.getElementById('share-allowed').value === 'true';

      if (!orgId) { showStatus('请输入诊所 ID', true); return; }

      try {
        const res  = await fetch(`${API}/health/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cat_id: catId, user_id: userId, org_id: orgId, is_allowed: isAllowed })
        });
        const body = await res.json();
        if (body.success) { showStatus('授权设置成功！'); loadAll(); }
        else              showStatus('失败：' + body.message, true);
      } catch (e) {
        showStatus('请求失败', true);
      }
    });
  }

  // ── 测试 ID 面板 ──
  if (testApplyBtn) {
    testApplyBtn.addEventListener('click', function () {
      const cid = testCatInput  ? testCatInput.value.trim()  : '';
      const uid = testUserInput ? testUserInput.value.trim() : '';
      if (!cid) { showStatus('请输入猫咪 ID', true); return; }
      catId  = cid;
      userId = uid;
      localStorage.setItem('catface_test_catId',  catId);
      localStorage.setItem('catface_test_userId', userId);
      showStatus('ID 已设置，正在加载数据…');
      loadAll();
    });
  }

  // ── 初始化 ──
  if (testCatInput  && catId)  testCatInput.value  = catId;
  if (testUserInput && userId) testUserInput.value = userId;

  // 添加记录区折叠
  const toggleAddBtn = document.getElementById('toggle-add-btn');
  if (toggleAddBtn && addRecordSection) {
    addRecordSection.style.display = 'none';
    toggleAddBtn.addEventListener('click', function () {
      const shown = addRecordSection.style.display !== 'none';
      addRecordSection.style.display = shown ? 'none' : 'block';
      toggleAddBtn.textContent = shown ? '+ 添加记录' : '收起';
    });
  }

  loadAll();
})();
