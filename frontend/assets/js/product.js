/* Product detail page */
(async function () {
  const id = new URLSearchParams(location.search).get('id');
  const pdp = document.getElementById('pdp');
  if (!id) { pdp.innerHTML = '<p class="text-soft col-span-2">Product not found.</p>'; return; }

  let product, related;
  try {
    ({ product, related } = await API.get(`/products/${id}`));
  } catch (e) {
    pdp.innerHTML = `<p class="text-soft col-span-2">${e.message}</p>`;
    return;
  }

  const p = product;
  let size = null;
  document.title = `${p.name} — Cute Crew`;

  document.getElementById('crumbs').innerHTML =
    `<a href="/" class="hover:text-gold">Home</a> / <a href="/shop.html?gender=${p.gender}" class="hover:text-gold capitalize">${p.gender}</a> / <span class="text-cream">${p.name}</span>`;

  pdp.innerHTML = `
    <div>
      <div class="p-card !rounded-2xl overflow-hidden">
        <div class="aspect-[4/5] bg-white" id="pdp-zoom">
          <img id="pdp-img" src="${p.image}" alt="${p.name}" class="w-full h-full object-cover transition-transform duration-500">
        </div>
      </div>
      <div class="flex gap-3 mt-4">
        <button class="mm-thumb w-20 on" data-img="${p.image}"><img src="${p.image}" alt="" class="w-full aspect-[4/5] object-cover bg-white"></button>
        ${p.imageHover ? `<button class="mm-thumb w-20" data-img="${p.imageHover}"><img src="${p.imageHover}" alt="" class="w-full aspect-[4/5] object-cover bg-white"></button>` : ''}
        ${p.imageCut && p.imageCut !== p.image ? `<button class="mm-thumb w-20" data-img="${p.imageCut}"><img src="${p.imageCut}" alt="" class="w-full aspect-[4/5] object-cover bg-white"></button>` : ''}
      </div>
    </div>

    <div>
      <p class="text-[0.7rem] uppercase tracking-[0.2em] text-soft">${p.color} · ${p.category}</p>
      <h1 class="font-display font-extrabold text-3xl mt-1">${p.name}</h1>
      <div class="flex items-center gap-3 mt-3">
        <span class="rating-badge !text-sm">★ ${p.rating}</span>
        <span class="text-soft text-xs">${p.ratings.toLocaleString('en-IN')} ratings · <span class="text-mint">✓ Verified quality</span></span>
      </div>

      <div class="flex items-baseline gap-3 mt-5">
        <span class="text-3xl font-extrabold">${fmt(p.price)}</span>
        <span class="text-soft line-through">${fmt(p.mrp)}</span>
        <span class="text-mint font-bold">${p.discount}% off</span>
      </div>
      <p class="text-xs text-soft mt-1">Inclusive of all taxes · Earn <span class="text-gold font-bold">${Math.floor(p.price / 100) * 5} points</span></p>

      <p id="stock-line" class="mt-4 text-sm font-bold ${p.stock > 5 ? 'text-mint' : p.stock > 0 ? 'text-peach' : 'text-red-400'}">
        ${p.stock > 5 ? '✓ In stock' : p.stock > 0 ? `⚡ Only ${p.stock} left — order soon` : '✕ Out of stock'}
      </p>

      <div class="mt-6">
        <div class="flex items-center justify-between mb-2.5">
          <p class="text-xs font-bold uppercase tracking-widest text-soft">Select Size</p>
          <button class="text-xs text-gold hover:underline" id="size-guide">Size guide</button>
        </div>
        <div class="flex flex-wrap gap-2" id="size-row">
          ${p.sizes.map((s) => { const n = (p.stockBySize && p.stockBySize[s]) || 0; return `<button class="chip !px-4 !py-2.5 ${n === 0 ? 'opacity-40 line-through cursor-not-allowed' : ''}" data-s="${s}" data-stock="${n}"${n === 0 ? ' disabled' : ''}>${s}</button>`; }).join('')}
        </div>
      </div>

      <div class="flex gap-3 mt-8">
        <button id="btn-add" class="btn-gold flex-1 py-4 text-sm tracking-wide">Add to Bag</button>
        <button id="btn-buy" class="btn-ghost flex-1 py-4 text-sm tracking-wide">Buy Now</button>
        <button class="wish-btn !static !w-[52px] !h-[52px] shrink-0 ${Wish.has(p.id) ? 'on' : ''}" data-wish="${p.id}" aria-label="Wishlist">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${Wish.has(p.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
        </button>
      </div>

      <div class="grid grid-cols-3 gap-3 mt-6 text-center text-[0.7rem] text-soft">
        <div class="p-card !rounded-xl p-3">🚚<br>Free ship ₹999+</div>
        <div class="p-card !rounded-xl p-3">↩️<br>14-day returns</div>
        <div class="p-card !rounded-xl p-3">💵<br>COD available</div>
      </div>

      <div class="mt-8 space-y-3" id="accordions">
        <details class="p-card !rounded-xl p-5" open>
          <summary class="font-display font-bold cursor-pointer">Description</summary>
          <p class="text-soft text-sm mt-3 leading-relaxed">${p.description}</p>
        </details>
        <details class="p-card !rounded-xl p-5">
          <summary class="font-display font-bold cursor-pointer">Material & Care</summary>
          <p class="text-soft text-sm mt-3 leading-relaxed">${p.material}. Machine wash cold with like colours, tumble dry low, do not bleach. Iron on low if needed.</p>
        </details>
        <details class="p-card !rounded-xl p-5">
          <summary class="font-display font-bold cursor-pointer">Shipping & Returns</summary>
          <p class="text-soft text-sm mt-3 leading-relaxed">Dispatched in 24 hours. Free shipping on orders over ₹999. 14-day no-questions returns and instant exchanges.</p>
        </details>
      </div>
    </div>`;

  // size selection (out-of-stock sizes are disabled)
  const sizeRow = document.getElementById('size-row');
  const stockLine = document.getElementById('stock-line');
  sizeRow.addEventListener('click', (e) => {
    const b = e.target.closest('[data-s]');
    if (!b || b.disabled) return;
    size = b.dataset.s;
    sizeRow.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === b));
    const n = Number(b.dataset.stock);
    stockLine.textContent = n > 5 ? `✓ In stock — size ${size}` : `⚡ Only ${n} left in size ${size}`;
    stockLine.className = 'mt-4 text-sm font-bold ' + (n > 5 ? 'text-mint' : 'text-peach');
  });

  // whole product sold out → disable purchase
  if (p.stock === 0) {
    ['btn-add', 'btn-buy', 'sticky-add'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) { el.disabled = true; el.classList.add('opacity-50', 'cursor-not-allowed'); }
    });
    const add = document.getElementById('btn-add');
    if (add) add.textContent = 'Out of Stock';
  }
  document.getElementById('size-guide').addEventListener('click', () =>
    toast('Tip: sizes match age — 4Y fits most 4-year-olds.'));

  function ensureSize() {
    if (!size) {
      toast('Please select a size');
      sizeRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  }
  document.getElementById('btn-add').addEventListener('click', () => { if (ensureSize()) Cart.add(p.id, size); });
  document.getElementById('btn-buy').addEventListener('click', () => {
    if (!ensureSize()) return;
    Cart.add(p.id, size, 1, true);
    location.href = '/checkout.html';
  });

  // gallery thumbs + hover zoom
  document.querySelectorAll('[data-img]').forEach((b) => b.addEventListener('click', () => {
    document.getElementById('pdp-img').src = b.dataset.img;
    document.querySelectorAll('[data-img]').forEach((x) => x.classList.toggle('on', x === b));
  }));
  const zoom = document.getElementById('pdp-zoom');
  zoom.addEventListener('mousemove', (e) => {
    const r = zoom.getBoundingClientRect();
    const img = document.getElementById('pdp-img');
    img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    img.style.transform = 'scale(1.6)';
  });
  zoom.addEventListener('mouseleave', () => {
    const img = document.getElementById('pdp-img');
    img.style.transform = 'scale(1)';
  });

  // sticky mobile CTA
  const sticky = document.getElementById('sticky-cta');
  sticky.classList.remove('hidden');
  document.getElementById('sticky-price').textContent = fmt(p.price);
  document.getElementById('sticky-name').textContent = p.name;
  document.getElementById('sticky-add').addEventListener('click', () => { if (ensureSize()) Cart.add(p.id, size); });

  // complete the look (mix partner)
  if (p.mix) {
    try {
      const want = p.mix === 'top' ? 'bottom' : 'top';
      const { items } = await API.get(`/products?mix=${want}&gender=${p.gender === 'unisex' ? '' : p.gender}&limit=4`);
      if (items.length) {
        document.getElementById('complete-wrap').classList.remove('hidden');
        document.getElementById('complete-grid').innerHTML = items.map(cardHTML).join('');
      }
    } catch (e) { /* non-critical */ }
  }

  document.getElementById('related-grid').innerHTML = related.map(cardHTML).join('');
})();
