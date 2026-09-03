/* Shopping bag: server-priced cart with coupon support */
(function () {
  const lines = document.getElementById('cart-lines');
  const emptyBox = document.getElementById('cart-empty');
  const body = document.getElementById('cart-body');
  let coupon = sessionStorage.getItem('ll_coupon') || '';

  async function render() {
    const items = Cart.read();
    if (!items.length) {
      body.classList.add('hidden');
      emptyBox.classList.remove('hidden');
      return;
    }
    body.classList.remove('hidden');
    emptyBox.classList.add('hidden');

    const s = await API.post('/cart/price', { items, coupon });

    const dropped = Cart.reconcile(s.lines);
    if (dropped > 0) toast(`${dropped} item${dropped > 1 ? 's' : ''} in your bag ${dropped > 1 ? 'are' : 'is'} no longer available and ${dropped > 1 ? 'were' : 'was'} removed`);

    lines.innerHTML = s.lines.map((l) => `
      <div class="p-card !rounded-xl p-4 flex gap-4">
        <a href="/product.html?id=${l.id}" class="w-24 shrink-0">
          <img src="${l.image}" alt="${l.name}" class="rounded-lg w-full aspect-[4/5] object-cover">
        </a>
        <div class="flex-1 min-w-0">
          <div class="flex justify-between gap-2">
            <a href="/product.html?id=${l.id}" class="font-display font-bold truncate hover:text-gold transition-colors">${l.name}</a>
            <button class="text-soft hover:text-red-400 text-sm shrink-0" data-rm="${l.id}|${l.size || ''}" aria-label="Remove">✕</button>
          </div>
          <p class="text-xs text-soft mt-0.5">${l.color} · Size ${l.size || '—'}</p>
          <div class="flex items-center justify-between mt-3">
            <div class="flex items-center border border-line rounded-full">
              <button class="w-8 h-8 text-soft hover:text-gold" data-q="${l.id}|${l.size || ''}|${l.qty - 1}" aria-label="Decrease">−</button>
              <span class="w-7 text-center text-sm font-bold">${l.qty}</span>
              <button class="w-8 h-8 text-soft hover:text-gold" data-q="${l.id}|${l.size || ''}|${l.qty + 1}" aria-label="Increase">+</button>
            </div>
            <div class="text-right">
              <p class="font-extrabold">${fmt(l.price * l.qty)}</p>
              <p class="text-xs text-soft line-through">${fmt(l.mrp * l.qty)}</p>
            </div>
          </div>
        </div>
      </div>`).join('');

    document.getElementById('price-rows').innerHTML = `
      <div class="flex justify-between"><span class="text-soft">Bag total (MRP)</span><span>${fmt(s.mrpTotal)}</span></div>
      <div class="flex justify-between"><span class="text-soft">Bag discount</span><span class="text-mint">− ${fmt(s.bagDiscount)}</span></div>
      ${s.coupon ? `<div class="flex justify-between"><span class="text-soft">Coupon ${s.coupon}</span><span class="text-mint">− ${fmt(s.couponOff)}</span></div>` : ''}
      <div class="flex justify-between"><span class="text-soft">Delivery</span><span>${s.shipping === 0 ? '<span class="text-mint">FREE</span>' : fmt(s.shipping)}</span></div>`;
    document.getElementById('price-total').textContent = fmt(s.total);
    document.getElementById('price-save').textContent =
      `You save ${fmt(s.bagDiscount + s.couponOff)} · Earn ${s.rewardPoints} reward points ✦`;
  }

  document.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-rm]');
    if (rm) { const [id, size] = rm.dataset.rm.split('|'); Cart.remove(id, size); render(); return; }
    const q = e.target.closest('[data-q]');
    if (q) { const [id, size, qty] = q.dataset.q.split('|'); Cart.setQty(id, size, Math.min(10, Number(qty))); render(); }
  });

  document.getElementById('coupon-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('coupon-input').value.trim().toUpperCase();
    const msg = document.getElementById('coupon-msg');
    const items = Cart.read();
    const test = await API.post('/cart/price', { items, coupon: code });
    msg.classList.remove('hidden');
    if (test.coupon) {
      coupon = code;
      sessionStorage.setItem('ll_coupon', code);
      msg.textContent = `✓ ${code} applied — you saved ${fmt(test.couponOff)}!`;
      msg.className = 'text-xs mt-2 text-mint';
    } else {
      msg.textContent = 'Invalid coupon. Try WELCOME10 or CREW20.';
      msg.className = 'text-xs mt-2 text-red-400';
    }
    render();
  });

  render().catch((e) => { lines.innerHTML = `<p class="text-soft">${e.message}</p>`; });
})();
