/* Admin panel: dashboard, hero 3D images, products, orders */
(function () {
  const loginBox = document.getElementById('admin-login');
  const panel = document.getElementById('admin-panel');

  function isAdmin() {
    const u = Auth.user();
    return u && u.role === 'admin' && API.token();
  }

  // ---------- login ----------
  document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const err = document.getElementById('admin-login-err');
    err.classList.add('hidden');
    try {
      const res = await API.post('/auth/login', { email: fd.get('email'), password: fd.get('password') });
      if (res.user.role !== 'admin') throw new Error('This account is not an admin');
      Auth.set(res.token, res.user);
      boot();
    } catch (ex) { err.textContent = ex.message; err.classList.remove('hidden'); }
  });

  document.getElementById('admin-logout').addEventListener('click', () => {
    localStorage.removeItem('ll_token');
    localStorage.removeItem('ll_user');
    location.reload();
  });

  // ---------- tabs ----------
  document.querySelectorAll('.adm-tab').forEach((t) => t.addEventListener('click', () => {
    document.querySelectorAll('.adm-tab').forEach((x) => x.classList.toggle('on', x === t));
    document.querySelectorAll('[data-panel]').forEach((p) => p.classList.toggle('hidden', p.dataset.panel !== t.dataset.tab));
    if (t.dataset.tab === 'dashboard') loadStats();
    if (t.dataset.tab === 'hero') loadHero();
    if (t.dataset.tab === 'products') loadProducts();
    if (t.dataset.tab === 'orders') loadOrders();
    if (t.dataset.tab === 'users') loadUsers();
  }));

  // ---------- dashboard ----------
  async function loadStats() {
    try {
      const s = await API.get('/admin/stats');
      const card = (label, val, tint) => `
        <div class="p-card p-5"><p class="text-soft text-xs uppercase tracking-widest">${label}</p>
        <p class="font-display font-extrabold text-2xl mt-2 ${tint}">${val}</p></div>`;
      const sa = s.stockAlerts || { out: [], low: [], outCount: 0, lowCount: 0 };
      document.getElementById('stat-cards').innerHTML =
        card('Revenue', fmt(s.revenue), 'text-gold') + card('Orders', s.orders, 'text-mint') +
        card('Products', s.products, 'text-pastelblue') +
        card('Out of Stock', sa.outCount, sa.outCount ? 'text-red-400' : 'text-mint');

      // notification badge on the Products tab + dashboard alert panel
      const totalAlerts = (sa.outCount || 0) + (sa.lowCount || 0);
      const badge = document.getElementById('stock-alert-badge');
      badge.textContent = totalAlerts;
      badge.classList.toggle('hidden', totalAlerts === 0);
      badge.classList.toggle('inline-flex', totalAlerts > 0);
      const panel = document.getElementById('stock-alert-panel');
      if (totalAlerts) {
        panel.classList.remove('hidden');
        document.getElementById('stock-alert-list').innerHTML =
          sa.out.map((p) => `<div class="flex justify-between items-center gap-3 border-b border-line pb-2">
            <span class="min-w-0"><span class="text-red-400 font-extrabold">❌ OUT</span> · <span class="font-bold">${p.name}</span></span>
            <button class="btn-ghost px-3 py-1 text-xs shrink-0" data-goto-product="${p.id}">Restock</button></div>`).join('') +
          sa.low.map((p) => `<div class="flex justify-between items-center gap-3 border-b border-line pb-2">
            <span class="min-w-0"><span class="text-peach font-extrabold">⚠️ LOW</span> · <span class="font-bold">${p.name}</span> <span class="text-soft text-xs">${p.stock} left</span></span>
            <button class="btn-ghost px-3 py-1 text-xs shrink-0" data-goto-product="${p.id}">Restock</button></div>`).join('');
      } else {
        panel.classList.add('hidden');
      }

      document.getElementById('recent-orders').innerHTML = s.recentOrders.length
        ? s.recentOrders.map((o) => `<div class="flex justify-between border-b border-line pb-2">
            <span><span class="text-gold font-bold">${o.id}</span> · ${o.customer.name}</span>
            <span>${fmt(o.summary.total)} · <span class="uppercase text-xs">${o.status}</span></span></div>`).join('')
        : 'No orders yet.';
    } catch (e) {
      if (/expired|login required/i.test(e.message)) {
        localStorage.removeItem('ll_token');
        localStorage.removeItem('ll_user');
        location.reload();
        return;
      }
      toast(e.message);
    }
  }

  // ---------- hero ----------
  const drop = document.getElementById('drop-zone');
  const fileInput = document.getElementById('hero-file');
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('border-gold'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('border-gold'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('border-gold');
    if (e.dataTransfer.files[0]) uploadHero(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) uploadHero(fileInput.files[0]); });

  async function uploadHero(file) {
    const msg = document.getElementById('hero-msg');
    msg.className = 'text-xs mt-2 text-soft';
    msg.textContent = 'Uploading…';
    const fd = new FormData();
    fd.append('image', file);
    fd.append('title', document.getElementById('hero-title').value);
    try {
      await API.post('/admin/hero', fd);
      msg.className = 'text-xs mt-2 text-mint';
      msg.textContent = '✓ Uploaded — it now floats in the homepage 3D hero!';
      fileInput.value = '';
      loadHero();
    } catch (e) {
      msg.className = 'text-xs mt-2 text-red-400';
      msg.textContent = e.message;
    }
  }

  async function loadHero() {
    const { slides } = await API.get('/hero');
    document.getElementById('hero-grid').innerHTML = slides.map((s) => `
      <div class="p-card overflow-hidden relative">
        <img src="${s.src}" alt="${s.title}" class="w-full aspect-[4/5] object-cover">
        <div class="p-2.5 flex items-center justify-between">
          <span class="text-xs font-bold truncate">${s.title || '—'}</span>
          ${s.uploaded
            ? `<button class="text-red-400 text-xs hover:underline shrink-0" data-del-hero="${encodeURIComponent(s.file)}">Delete</button>`
            : '<span class="text-[0.65rem] text-soft shrink-0">default</span>'}
        </div>
      </div>`).join('');
  }
  document.addEventListener('click', async (e) => {
    const del = e.target.closest('[data-del-hero]');
    if (del) {
      await API.del(`/admin/hero/${del.dataset.delHero}`);
      toast('Removed from hero');
      loadHero();
    }
  });

  // ---------- products ----------
  const pForm = document.getElementById('product-form');
  let editingId = null;

  const SIZE_SETS = {
    newborn: ['0-3M', '3-6M', '6-9M', '9-12M'],
    toddler: ['1Y', '2Y', '3Y'],
    kids: ['4Y', '5Y', '6Y', '7Y', '8Y', '10Y', '12Y']
  };
  function renderStockInputs(ageGroup, current) {
    const sizes = SIZE_SETS[ageGroup] || SIZE_SETS.kids;
    document.getElementById('stock-inputs').innerHTML = sizes.map((s) => `
      <label class="flex flex-col gap-1">
        <span class="text-[0.62rem] font-bold text-soft text-center">${s}</span>
        <input type="number" min="0" class="field !py-1.5 !px-1 text-center text-sm" data-stock-size="${s}" value="${current && current[s] != null ? current[s] : 12}">
      </label>`).join('');
  }
  function readStockInputs() {
    const out = {};
    document.querySelectorAll('#stock-inputs [data-stock-size]').forEach((inp) => {
      out[inp.dataset.stockSize] = Math.max(0, parseInt(inp.value, 10) || 0);
    });
    return out;
  }
  // re-render the size inputs when the age group changes (different size set)
  pForm.elements.ageGroup.addEventListener('change', () => renderStockInputs(pForm.elements.ageGroup.value, readStockInputs()));

  document.getElementById('btn-new-product').addEventListener('click', () => {
    editingId = null;
    pForm.reset();
    pForm.elements.photo.value = '';
    pForm.elements.photoHover.value = '';
    document.getElementById('product-form-title').textContent = 'New Product';
    renderStockInputs(pForm.elements.ageGroup.value, null);
    pForm.classList.remove('hidden');
    updatePreview();
  });
  document.getElementById('product-cancel').addEventListener('click', () => pForm.classList.add('hidden'));

  function updatePreview() {
    const fd = new FormData(pForm);
    const photo = pForm.elements.photo.value;
    document.getElementById('product-photo-remove').classList.toggle('hidden', !photo);
    document.getElementById('product-photo-hint').textContent = photo
      ? 'Photo uploaded ✓ — it is used everywhere on the store.'
      : 'No photo uploaded — the illustrated art (type + colours) is used.';
    document.getElementById('product-preview').src = photo ||
      `/img/g/${fd.get('type')}.svg?hex=${encodeURIComponent(fd.get('hex'))}&accent=${encodeURIComponent(fd.get('accent'))}&motif=${fd.get('motif')}`;

    // hover (flip) image — optional, so the slot shows a placeholder until one exists
    const hover = pForm.elements.photoHover.value;
    const hoverImg = document.getElementById('product-preview-hover');
    hoverImg.classList.toggle('hidden', !hover);
    document.getElementById('product-hover-placeholder').classList.toggle('hidden', !!hover);
    document.getElementById('product-photo-hover-remove').classList.toggle('hidden', !hover);
    document.getElementById('product-photo-hover-hint').textContent = hover
      ? 'Hover image set ✓ — the card flips to it on hover.'
      : "No hover image — this card won't flip.";
    if (hover) hoverImg.src = hover;
  }
  pForm.addEventListener('input', updatePreview);

  // Both image slots upload the same way — only the field they fill differs.
  function wireUpload(fileId, removeId, field, hintId, busyLabel) {
    document.getElementById(fileId).addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const hint = document.getElementById(hintId);
      hint.textContent = busyLabel;
      try {
        const fd = new FormData();
        fd.append('image', file);
        const { url } = await API.post('/admin/upload', fd);
        pForm.elements[field].value = url;
        updatePreview();
        toast('Image uploaded ✓');
      } catch (ex) {
        hint.textContent = ex.message;
      }
      e.target.value = '';
    });
    document.getElementById(removeId).addEventListener('click', () => {
      pForm.elements[field].value = '';
      updatePreview();
    });
  }
  wireUpload('product-photo-file', 'product-photo-remove', 'photo',
    'product-photo-hint', 'Uploading photo…');
  wireUpload('product-photo-hover-file', 'product-photo-hover-remove', 'photoHover',
    'product-photo-hover-hint', 'Uploading hover image…');

  pForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(pForm);
    const body = Object.fromEntries(fd.entries());
    body.mix = body.mix || null;
    body.photo = body.photo || null;
    body.photoHover = body.photoHover || null;
    body.stockBySize = readStockInputs();
    delete body.stock;
    try {
      if (editingId) await API.put(`/admin/products/${editingId}`, body);
      else await API.post('/admin/products', body);
      toast(editingId ? 'Product updated ✓' : 'Product added ✓');
      pForm.classList.add('hidden');
      loadProducts();
      loadStats();
    } catch (ex) { toast(ex.message); }
  });

  async function openEdit(id) {
    const { product } = await API.get(`/products/${id}`);
    editingId = product.id;
    pForm.reset();
    document.getElementById('product-form-title').textContent = `Edit #${product.id} — ${product.name}`;
    pForm.classList.remove('hidden');
    for (const [k, v] of Object.entries(product)) {
      const input = pForm.elements[k];
      if (input && v !== null && typeof v !== 'object') input.value = v;
    }
    pForm.elements.photo.value = product.photo || '';
    // fall back to the auto-discovered flip image so editing a product doesn't drop it
    // strip the cache-busting stamp so it isn't saved into the stored path
    pForm.elements.photoHover.value = (product.photoHover || product.imageHover || '').split('?')[0];
    renderStockInputs(product.ageGroup, product.stockBySize);
    updatePreview();
    pForm.scrollIntoView({ behavior: 'smooth' });
  }

  async function loadProducts() {
    const { items } = await API.get('/products?limit=100&sort=new');
    document.getElementById('product-list').innerHTML = items.map((p) => {
      const out = p.stock === 0;
      const low = p.stock > 0 && p.stock <= 5;
      const tag = out ? '<span class="text-red-400 text-[0.6rem] font-extrabold ml-1">OUT OF STOCK</span>'
        : low ? '<span class="text-peach text-[0.6rem] font-extrabold ml-1">LOW STOCK</span>' : '';
      const sizeChips = Object.entries(p.stockBySize || {}).map(([s, n]) =>
        `<span class="${n === 0 ? 'text-red-400' : n <= 2 ? 'text-peach' : 'text-soft'}">${s}:${n}</span>`).join('  ');
      return `
      <div class="p-card !rounded-xl p-3 flex items-center gap-3 flex-wrap">
        <img src="${p.image}" alt="" class="w-12 rounded-lg aspect-[4/5] object-cover bg-white">
        <div class="min-w-0 flex-1">
          <p class="font-bold truncate">${p.name}${tag}</p>
          <p class="text-xs text-soft">#${p.id} · ${p.gender} · ${p.category}${p.mix ? ` · <span class="text-gold">M&M ${p.mix}</span>` : ''}${p.imageHover ? ' · <span class="text-mint font-bold">FLIP ✓</span>' : ' · <span class="text-soft">no flip</span>'}</p>
          <p class="text-[0.68rem] mt-0.5">Stock &nbsp;${sizeChips} &nbsp;·&nbsp; <b class="${out ? 'text-red-400' : ''}">${p.stock} total</b></p>
        </div>
        <span class="font-bold shrink-0">${fmt(p.price)}</span>
        <button class="btn-ghost px-4 py-1.5 text-xs shrink-0" data-edit="${p.id}">Edit</button>
        <button class="text-red-400 text-xs hover:underline shrink-0" data-del-product="${p.id}">Delete</button>
      </div>`;
    }).join('');
  }

  document.addEventListener('click', async (e) => {
    const del = e.target.closest('[data-del-product]');
    if (del && confirm('Delete this product?')) {
      await API.del(`/admin/products/${del.dataset.delProduct}`);
      toast('Product deleted');
      loadProducts();
      return;
    }
    const edit = e.target.closest('[data-edit]');
    if (edit) { openEdit(edit.dataset.edit); return; }
    const goto = e.target.closest('[data-goto-product]');
    if (goto) {
      document.querySelector('.adm-tab[data-tab="products"]').click();
      openEdit(goto.dataset.gotoProduct);
    }
  });

  // ---------- orders ----------
  const STATUSES = ['placed', 'packed', 'shipped', 'delivered', 'cancelled'];
  async function loadOrders() {
    const { orders } = await API.get('/admin/orders');
    document.getElementById('order-list').innerHTML = orders.length ? orders.map((o) => `
      <div class="p-card p-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p class="font-bold"><span class="text-gold">${o.id}</span> · ${o.customer.name} · ${o.customer.phone}</p>
            <p class="text-xs text-soft mt-0.5">${new Date(o.at).toLocaleString()} · ${o.customer.address}</p>
            <p class="text-xs mt-0.5">${o.user ? `<span class="text-pastelblue">Account: ${o.user.name} (${o.user.email})</span>` : '<span class="text-soft">Guest (legacy order)</span>'}</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="font-extrabold">${fmt(o.summary.total)}</span>
            <select class="field !w-auto !py-1.5 text-xs" data-status="${o.id}">
              ${STATUSES.map((s) => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
        </div>
        <p class="text-xs text-soft mt-2">${o.summary.lines.map((l) => `${l.name} (${l.size}×${l.qty})`).join(' · ')} · ${o.payment.toUpperCase()}</p>
      </div>`).join('') : '<p class="text-soft">No orders yet.</p>';
  }
  document.addEventListener('change', async (e) => {
    const sel = e.target.closest('[data-status]');
    if (sel) {
      await API.patch(`/admin/orders/${sel.dataset.status}`, { status: sel.value });
      toast('Status updated ✓');
    }
  });

  // ---------- users ----------
  const uForm = document.getElementById('user-form');
  let editingUserId = null;

  document.getElementById('btn-new-user').addEventListener('click', () => {
    editingUserId = null;
    uForm.reset();
    uForm.elements.password.required = true;
    document.getElementById('user-form-title').textContent = 'New User';
    uForm.classList.remove('hidden');
  });
  document.getElementById('user-cancel').addEventListener('click', () => uForm.classList.add('hidden'));

  uForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(uForm);
    const body = Object.fromEntries(fd.entries());
    if (!body.password) delete body.password;
    try {
      if (editingUserId) await API.put(`/admin/users/${editingUserId}`, body);
      else await API.post('/admin/users', body);
      toast(editingUserId ? 'User updated ✓' : 'User created ✓');
      uForm.classList.add('hidden');
      loadUsers();
    } catch (ex) { toast(ex.message); }
  });

  async function loadUsers() {
    const { users } = await API.get('/admin/users');
    document.getElementById('user-list').innerHTML = users.map((u) => `
      <div class="p-card !rounded-xl p-3 flex items-center gap-4 flex-wrap">
        <span class="w-10 h-10 rounded-full ${u.role === 'admin' ? 'bg-gold text-ink' : 'bg-surface text-gold border border-line'} font-extrabold flex items-center justify-center shrink-0">${String(u.name || '?').charAt(0).toUpperCase()}</span>
        <div class="min-w-0 flex-1">
          <p class="font-bold truncate">${u.name} ${u.role === 'admin' ? '<span class="text-gold text-[0.65rem] font-extrabold tracking-widest ml-1">ADMIN</span>' : ''}</p>
          <p class="text-xs text-soft truncate">#${u.id} · ${u.email}${u.createdAt ? ` · joined ${new Date(u.createdAt).toLocaleDateString()}` : ''}</p>
        </div>
        <div class="text-right shrink-0">
          <p class="text-sm font-bold">${u.orders} order${u.orders === 1 ? '' : 's'}</p>
          <p class="text-xs text-soft">${fmt(u.spent)} spent</p>
        </div>
        <button class="btn-ghost px-4 py-1.5 text-xs shrink-0" data-edit-user="${u.id}" data-name="${u.name}" data-email="${u.email}" data-role="${u.role}">Edit</button>
        <button class="text-red-400 text-xs hover:underline shrink-0" data-del-user="${u.id}">Delete</button>
      </div>`).join('');
  }

  document.addEventListener('click', async (e) => {
    const del = e.target.closest('[data-del-user]');
    if (del && confirm('Delete this user account?')) {
      try {
        await API.del(`/admin/users/${del.dataset.delUser}`);
        toast('User deleted');
        loadUsers();
      } catch (ex) { toast(ex.message); }
      return;
    }
    const edit = e.target.closest('[data-edit-user]');
    if (edit) {
      editingUserId = edit.dataset.editUser;
      uForm.reset();
      uForm.elements.name.value = edit.dataset.name;
      uForm.elements.email.value = edit.dataset.email;
      uForm.elements.role.value = edit.dataset.role;
      uForm.elements.password.required = false;
      document.getElementById('user-form-title').textContent = `Edit User #${editingUserId} — ${edit.dataset.name}`;
      uForm.classList.remove('hidden');
      uForm.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // ---------- boot ----------
  function boot() {
    loginBox.classList.add('hidden');
    panel.classList.remove('hidden');
    loadStats();
    loadHero();
    loadProducts();
  }
  if (isAdmin()) boot();
})();
