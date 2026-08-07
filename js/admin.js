function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

// If the browser restores this page from bfcache (e.g. the user hits "back"
// right after logging out), DOMContentLoaded won't fire again and the last
// rendered admin screen could flash before any redirect happens. Force a
// hard reload in that case so the auth check always runs fresh.
window.addEventListener('pageshow', (e) => {
  if (e.persisted) location.reload();
});

(async function () {
  let products = [];
  let settings = {};
  let sessionToken = null;
  let currentRole = null; // 'senior' | 'staff' | null

  // ---------------- Auth gate ----------------
  async function initAuth() {
    sessionToken = localStorage.getItem('woodora_token');
    if (!sessionToken) { location.href = '/admin-login.html'; return false; }

    const res = await fetch('/.netlify/functions/auth-me', {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });

    if (!res.ok) {
      // Token missing/expired/revoked — clear it and send back to login.
      localStorage.removeItem('woodora_token');
      localStorage.removeItem('woodora_role');
      localStorage.removeItem('woodora_email');
      location.href = '/admin-login.html';
      return false;
    }

    const data = await res.json();
    currentRole = data.role;
    document.getElementById('whoami').textContent = `Signed in as ${data.email} · role: ${currentRole}`;
    return true;
  }

  const ok = await initAuth();
  if (!ok) return;
  document.getElementById('adminApp').style.display = 'block';
  if (currentRole !== 'senior') {
    document.querySelector('[data-tab="staff"]').style.display = 'none';
    document.querySelector('[data-tab="activity"]').style.display = 'none';
  }

  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('woodora_token');
    localStorage.removeItem('woodora_role');
    localStorage.removeItem('woodora_email');
    location.href = '/admin-login.html';
  });

  // ---------------- Tabs ----------------
  document.querySelectorAll('.admin-side a[data-tab]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.admin-side a[data-tab]').forEach(x => x.classList.remove('active'));
      a.classList.add('active');
      ['products', 'import', 'settings', 'staff', 'activity'].forEach(t => {
        document.getElementById(`tab-${t}`).style.display = t === a.dataset.tab ? 'block' : 'none';
      });
      if (a.dataset.tab === 'staff') loadStaff();
      if (a.dataset.tab === 'activity') loadActivity();
    });
  });

  // ---------------- Load data ----------------
  products = await WOODORA.getProducts();
  settings = await WOODORA.getSettings();
  renderProducts();
  fillSettingsForm();

  // ---------------- Products table ----------------
  function renderProducts(filterText = '') {
    const tbody = document.getElementById('productsTbody');
    const list = products.filter(p => p.name.toLowerCase().includes(filterText.toLowerCase()));
    tbody.innerHTML = list.map(p => `
      <tr>
        <td><img src="${p.images[0]}" alt="${p.name}"></td>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>${p.color}</td>
        <td>${WOODORA.money(p.price)}${p.oldPrice ? ` <span class="price-old">${WOODORA.money(p.oldPrice)}</span>` : ''}</td>
        <td>${p.featured ? 'Yes' : '—'}</td>
        <td>
          <button class="tag-btn" data-edit="${p.id}">Edit</button>
          <button class="tag-btn" style="color:var(--danger);border-color:var(--danger)" data-del="${p.id}">Delete</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openModal(products.find(p => p.id === b.dataset.edit))));
    tbody.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Delete this product? This cannot be undone.')) return;
      products = products.filter(p => p.id !== b.dataset.del);
      await persistProducts();
      renderProducts(document.getElementById('adminSearch').value);
    }));

    document.getElementById('statTotal').textContent = products.length;
    document.getElementById('statCats').textContent = new Set(products.map(p => p.category)).size;
    document.getElementById('statSale').textContent = products.filter(p => p.oldPrice).length;
    document.getElementById('statFeatured').textContent = products.filter(p => p.featured).length;
  }

  document.getElementById('adminSearch').addEventListener('input', e => renderProducts(e.target.value));

  async function persistProducts() {
    const result = await WOODORA.saveProducts(products);
    toast(result.mode === 'server' ? 'Saved — live for all visitors' : 'Saved locally (Netlify Function not connected yet — see README)');
  }

  // ---------------- Add / edit modal ----------------
  const overlay = document.getElementById('productModalOverlay');
  const form = document.getElementById('productForm');

  document.getElementById('addProductBtn').addEventListener('click', () => openModal(null));
  document.getElementById('cancelModalBtn').addEventListener('click', () => overlay.style.display = 'none');

  function openModal(product) {
    document.getElementById('modalTitle').textContent = product ? 'Edit product' : 'Add product';
    document.getElementById('p_id').value = product?.id || '';
    document.getElementById('p_name').value = product?.name || '';
    document.getElementById('p_category').value = product?.category || '';
    document.getElementById('p_color').value = product?.color || '';
    document.getElementById('p_price').value = product?.price ?? '';
    document.getElementById('p_oldPrice').value = product?.oldPrice ?? '';
    document.getElementById('p_featured').checked = !!product?.featured;
    document.getElementById('p_description').value = product?.description || '';
    document.getElementById('p_details').value = (product?.details || []).join('\n');
    document.getElementById('p_images').value = (product?.images || []).join('\n');
    overlay.style.display = 'flex';
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const id = document.getElementById('p_id').value || 'p' + Math.random().toString(36).slice(2, 8);
    const record = {
      id,
      name: document.getElementById('p_name').value.trim(),
      category: document.getElementById('p_category').value.trim(),
      color: document.getElementById('p_color').value.trim(),
      price: Number(document.getElementById('p_price').value),
      oldPrice: document.getElementById('p_oldPrice').value ? Number(document.getElementById('p_oldPrice').value) : null,
      featured: document.getElementById('p_featured').checked,
      description: document.getElementById('p_description').value.trim(),
      details: document.getElementById('p_details').value.split('\n').map(s => s.trim()).filter(Boolean),
      images: document.getElementById('p_images').value.split('\n').map(s => s.trim()).filter(Boolean)
    };
    const idx = products.findIndex(p => p.id === id);
    if (idx >= 0) products[idx] = record; else products.push(record);
    await persistProducts();
    renderProducts(document.getElementById('adminSearch').value);
    overlay.style.display = 'none';
  });

  // ---------------- Spreadsheet import ----------------
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  document.getElementById('browseBtn').addEventListener('click', () => fileInput.click());
  ['dragenter', 'dragover'].forEach(evt => dropZone.addEventListener(evt, e => { e.preventDefault(); dropZone.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach(evt => dropZone.addEventListener(evt, e => { e.preventDefault(); dropZone.classList.remove('drag'); }));
  dropZone.addEventListener('drop', e => handleFile(e.dataTransfer.files[0]));
  fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: 'binary' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      previewImport(rows);
    };
    reader.readAsBinaryString(file);
  }

  function previewImport(rows) {
    const parsed = rows.map(r => ({
      id: String(r.id || '').trim() || 'p' + Math.random().toString(36).slice(2, 8),
      name: String(r.name || '').trim(),
      category: String(r.category || '').trim(),
      color: String(r.color || '').trim(),
      price: Number(r.price) || 0,
      oldPrice: r.oldPrice ? Number(r.oldPrice) : null,
      featured: String(r.featured).toLowerCase() === 'true',
      description: String(r.description || '').trim(),
      details: String(r.details || '').split('|').map(s => s.trim()).filter(Boolean),
      images: String(r.images || '').split('|').map(s => s.trim()).filter(Boolean)
    })).filter(r => r.name);

    const container = document.getElementById('importPreview');
    container.innerHTML = `
      <p><strong>${parsed.length}</strong> rows parsed. Review below, then confirm.</p>
      <div class="table-scroll">
        <table class="admin-table">
          <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Images</th></tr></thead>
          <tbody>${parsed.map(p => `<tr><td>${p.name}</td><td>${p.category}</td><td>${p.price}</td><td>${p.images.length}</td></tr>`).join('')}</tbody>
        </table>
      </div>
      <button class="btn btn-primary" id="confirmImportBtn" style="margin-top:16px">Add / update ${parsed.length} products</button>
    `;
    document.getElementById('confirmImportBtn').addEventListener('click', async () => {
      parsed.forEach(row => {
        const idx = products.findIndex(p => p.id === row.id);
        if (idx >= 0) products[idx] = { ...products[idx], ...row };
        else products.push(row);
      });
      await persistProducts();
      renderProducts();
      container.innerHTML = `<p style="color:var(--accent-dark);font-weight:600">Import complete — products list updated.</p>`;
    });
  }

  // ---------------- Settings ----------------
  function fillSettingsForm() {
    document.getElementById('s_whatsapp').value = settings.whatsappNumber || '';
    document.getElementById('s_phone').value = settings.phone || '';
    document.getElementById('s_email').value = settings.email || '';
    document.getElementById('s_address').value = settings.address || '';
    document.getElementById('s_map').value = settings.mapEmbed || '';
    document.getElementById('s_tiktok').value = settings.socials?.tiktok || '';
    document.getElementById('s_instagram').value = settings.socials?.instagram || '';
    document.getElementById('s_facebook').value = settings.socials?.facebook || '';
    document.getElementById('s_pinterest').value = settings.socials?.pinterest || '';
  }

  document.getElementById('settingsForm').addEventListener('submit', async e => {
    e.preventDefault();
    settings = {
      whatsappNumber: document.getElementById('s_whatsapp').value.trim(),
      phone: document.getElementById('s_phone').value.trim(),
      email: document.getElementById('s_email').value.trim(),
      address: document.getElementById('s_address').value.trim(),
      mapEmbed: document.getElementById('s_map').value.trim(),
      socials: {
        tiktok: document.getElementById('s_tiktok').value.trim(),
        instagram: document.getElementById('s_instagram').value.trim(),
        facebook: document.getElementById('s_facebook').value.trim(),
        pinterest: document.getElementById('s_pinterest').value.trim()
      }
    };
    const result = await WOODORA.saveSettings(settings);
    toast(result.mode === 'server' ? 'Settings saved — live for all visitors' : 'Settings saved locally (Netlify Function not connected yet)');
  });

  // ---------------- Staff (senior admin only) ----------------
  async function loadStaff() {
    if (currentRole !== 'senior') return;
    const res = await fetch('/.netlify/functions/staff', { headers: { Authorization: `Bearer ${sessionToken}` } });
    const data = await res.json();
    const rows = (data.directory || []).map(d => `
      <tr>
        <td>${d.name || '—'}</td>
        <td>${d.email}</td>
        <td>${d.status}</td>
        <td>${d.role || '—'}</td>
        <td>
          ${d.status === 'pending' ? `<button class="tag-btn" data-approve="${d.id}">Approve</button>` : ''}
          ${d.status === 'approved' ? `<button class="tag-btn" style="color:var(--danger);border-color:var(--danger)" data-revoke="${d.id}">Revoke</button>` : ''}
          ${d.status === 'revoked' ? `<button class="tag-btn" data-approve="${d.id}">Re-approve</button>` : ''}
          ${d.status === 'approved' && d.role === 'staff' ? `<button class="tag-btn" data-promote="${d.id}">Promote to senior</button>` : ''}
          ${d.status === 'approved' && d.role === 'senior' ? `<button class="tag-btn" data-demote="${d.id}">Demote to staff</button>` : ''}
        </td>
      </tr>`).join('');
    document.getElementById('staffTbody').innerHTML = rows || '<tr><td colspan="5">No staff requests yet.</td></tr>';

    document.querySelectorAll('[data-approve]').forEach(b => b.addEventListener('click', () => setStaffRole(b.dataset.approve, 'approve')));
    document.querySelectorAll('[data-revoke]').forEach(b => b.addEventListener('click', () => setStaffRole(b.dataset.revoke, 'revoke')));
    document.querySelectorAll('[data-promote]').forEach(b => b.addEventListener('click', () => setStaffRole(b.dataset.promote, 'promote')));
    document.querySelectorAll('[data-demote]').forEach(b => b.addEventListener('click', () => setStaffRole(b.dataset.demote, 'demote')));
  }

  async function setStaffRole(userId, action) {
    const res = await fetch('/.netlify/functions/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify({ userId, action })
    });
    const labels = { approve: 'Staff approved', revoke: 'Access revoked', promote: 'Promoted to senior', demote: 'Demoted to staff' };
    if (res.ok) { toast(labels[action] || 'Updated'); loadStaff(); }
    else toast('Could not update — check Netlify Function logs');
  }

  // ---------------- Activity log (senior admin only) ----------------
  async function loadActivity() {
    if (currentRole !== 'senior') return;
    const tbody = document.getElementById('activityTbody');
    tbody.innerHTML = '<tr><td colspan="4">Loading…</td></tr>';

    const res = await fetch('/.netlify/functions/activity', { headers: { Authorization: `Bearer ${sessionToken}` } });
    if (!res.ok) { tbody.innerHTML = '<tr><td colspan="4">Could not load activity log.</td></tr>'; return; }

    const data = await res.json();
    const rows = (data.log || []).map(entry => `
      <tr>
        <td style="white-space:nowrap">${new Date(entry.at).toLocaleString()}</td>
        <td>${entry.actorEmail}</td>
        <td>${entry.actorRole || '—'}</td>
        <td>${entry.action}</td>
      </tr>`).join('');
    tbody.innerHTML = rows || '<tr><td colspan="4">No activity recorded yet.</td></tr>';
  }
})();
