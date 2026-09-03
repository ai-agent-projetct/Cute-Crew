/* Checkout: summary + order placement (COD demo). Ordering requires a customer profile. */
(async function () {
  let items = Cart.read();
  const coupon = sessionStorage.getItem('ll_coupon') || '';

  if (!items.length) {
    document.getElementById('checkout-body').innerHTML =
      '<p class="text-soft py-16 text-center col-span-full">Your bag is empty. <a href="/shop.html" class="text-gold underline">Go shopping →</a></p>';
    return;
  }

  // Profile required to order — show sign-in gate instead of the form
  if (!Auth.user()) {
    document.getElementById('checkout-body').innerHTML = `
      <div class="p-card p-10 text-center col-span-full max-w-lg mx-auto">
        <p class="text-4xl mb-4">👤</p>
        <p class="font-display font-extrabold text-xl">Create a profile to order</p>
        <p class="text-soft text-sm mt-2 mb-6">Sign in or create an account in seconds — your bag is saved and your orders will be tracked in your profile.</p>
        <button id="btn-checkout-login" class="btn-gold px-8 py-3.5 text-sm">Login / Create Account</button>
      </div>`;
    document.getElementById('btn-checkout-login').addEventListener('click', () => window.openLogin());
    return;
  }

  // Pre-fill contact from the profile
  setTimeout(() => {
    const form = document.getElementById('checkout-form');
    const u = Auth.user();
    if (form && u) {
      if (form.elements.name && !form.elements.name.value) form.elements.name.value = u.name || '';
      if (form.elements.email && !form.elements.email.value && String(u.email).includes('@')) form.elements.email.value = u.email;
    }
  }, 0);

  const s = await API.post('/cart/price', { items, coupon });

  const dropped = Cart.reconcile(s.lines);
  if (dropped > 0) {
    items = Cart.read();
    toast(`${dropped} item${dropped > 1 ? 's' : ''} in your bag ${dropped > 1 ? 'are' : 'is'} no longer available and ${dropped > 1 ? 'were' : 'was'} removed`);
  }

  document.getElementById('sum-lines').innerHTML = s.lines.map((l) => `
    <div class="flex gap-3 items-center">
      <img src="${l.image}" alt="" class="w-11 rounded-md aspect-[4/5] object-cover">
      <div class="min-w-0 flex-1"><p class="truncate font-semibold">${l.name}</p><p class="text-xs text-soft">Size ${l.size || '—'} × ${l.qty}</p></div>
      <span class="font-bold shrink-0">${fmt(l.price * l.qty)}</span>
    </div>`).join('');
  document.getElementById('sum-rows').innerHTML = `
    <div class="flex justify-between"><span class="text-soft">Subtotal</span><span>${fmt(s.subtotal)}</span></div>
    ${s.coupon ? `<div class="flex justify-between"><span class="text-soft">Coupon ${s.coupon}</span><span class="text-mint">− ${fmt(s.couponOff)}</span></div>` : ''}
    <div class="flex justify-between"><span class="text-soft">Delivery</span><span>${s.shipping === 0 ? '<span class="text-mint">FREE</span>' : fmt(s.shipping)}</span></div>`;
  document.getElementById('sum-total').textContent = fmt(s.total);

  document.getElementById('checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-place');
    const err = document.getElementById('checkout-err');
    err.classList.add('hidden');
    btn.disabled = true;
    btn.textContent = 'Placing order…';
    const fd = new FormData(e.target);
    try {
      const order = await API.post('/orders', {
        items, coupon,
        payment: fd.get('payment'),
        customer: {
          name: fd.get('name'), phone: fd.get('phone'), email: fd.get('email'),
          address: `${fd.get('address')}, ${fd.get('city')} - ${fd.get('pincode')}`
        }
      });
      Cart.clear();
      sessionStorage.removeItem('ll_coupon');
      document.getElementById('checkout-body').classList.add('hidden');
      document.getElementById('order-id').textContent = order.id;
      document.getElementById('order-done').classList.remove('hidden');
      window.scrollTo({ top: 0 });
    } catch (ex) {
      err.textContent = ex.message;
      err.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = 'Place Order';
    }
  });
})();
