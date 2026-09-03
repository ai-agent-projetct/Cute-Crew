/* Cute Crew — shared UI: header, footer, bottom nav, cart store, toasts, product cards, smooth scroll */

// ---------------- helpers ----------------
const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
window.fmt = fmt;

function toast(msg) {
  let box = document.getElementById('toast-box');
  if (!box) { box = document.createElement('div'); box.id = 'toast-box'; document.body.appendChild(box); }
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; setTimeout(() => t.remove(), 420); }, 2200);
}
window.toast = toast;

// ---------------- local cart / wishlist ----------------
const Cart = {
  read() { try { return JSON.parse(localStorage.getItem('ll_cart')) || []; } catch { return []; } },
  write(items) {
    localStorage.setItem('ll_cart', JSON.stringify(items));
    document.dispatchEvent(new CustomEvent('cart:changed', { detail: { count: Cart.count() } }));
  },
  count() { return Cart.read().reduce((s, i) => s + i.qty, 0); },
  add(id, size, qty = 1, silent = false) {
    const items = Cart.read();
    const key = `${id}|${size || ''}`;
    const found = items.find((i) => `${i.id}|${i.size || ''}` === key);
    if (found) found.qty = Math.min(10, found.qty + qty); else items.push({ id: Number(id), size: size || null, qty });
    Cart.write(items);
    if (!silent) toast('Added to bag ✓');
  },
  setQty(id, size, qty) {
    let items = Cart.read();
    const it = items.find((i) => i.id === Number(id) && (i.size || '') === (size || ''));
    if (it) it.qty = qty;
    items = items.filter((i) => i.qty > 0);
    Cart.write(items);
  },
  remove(id, size) { Cart.write(Cart.read().filter((i) => !(i.id === Number(id) && (i.size || '') === (size || '')))); },
  clear() { Cart.write([]); },
  // Drops any locally-stored line the server didn't price (product/mix & match
  // item deleted, or an id from before a catalog change) — otherwise the bag
  // badge (a raw local count) silently drifts from what actually renders and
  // gets charged. Call with the `lines` from POST /cart/price. Returns how
  // many lines were dropped, so callers can tell the customer why.
  reconcile(pricedLines) {
    const items = Cart.read();
    const kept = items.filter((i) => pricedLines.some((l) => l.id === i.id && (l.size || '') === (i.size || '')));
    const droppedCount = items.length - kept.length;
    if (droppedCount > 0) Cart.write(kept);
    return droppedCount;
  }
};
window.Cart = Cart;

const Wish = {
  read() { try { return JSON.parse(localStorage.getItem('ll_wish')) || []; } catch { return []; } },
  has(id) { return Wish.read().includes(Number(id)); },
  toggle(id) {
    id = Number(id);
    let list = Wish.read();
    if (list.includes(id)) { list = list.filter((x) => x !== id); toast('Removed from wishlist'); }
    else { list.push(id); toast('Saved to wishlist ♥'); }
    localStorage.setItem('ll_wish', JSON.stringify(list));
    document.dispatchEvent(new CustomEvent('wish:changed'));
    return list.includes(id);
  }
};
window.Wish = Wish;

const Auth = {
  user() { try { return JSON.parse(localStorage.getItem('ll_user')); } catch { return null; } },
  set(token, user) { localStorage.setItem('ll_token', token); localStorage.setItem('ll_user', JSON.stringify(user)); },
  logout() { localStorage.removeItem('ll_token'); localStorage.removeItem('ll_user'); location.reload(); }
};
window.Auth = Auth;

// ---------------- product card ----------------
function cardHTML(p) {
  const wished = Wish.has(p.id) ? 'on' : '';
  return `
  <div class="p-card group relative" data-id="${p.id}">
    ${p.badge ? `<span class="badge-pill">${p.badge}</span>` : ''}
    <button class="wish-btn ${wished}" data-wish="${p.id}" aria-label="Add to wishlist">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="${wished ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
    </button>
    <a href="/product.html?id=${p.id}" class="block">
      <div class="aspect-[4/5] overflow-hidden product-thumb">
        <img src="${p.image}" alt="${p.name}" loading="lazy" class="w-full h-full object-cover">
        ${p.imageHover ? `<img src="${p.imageHover}" alt="" aria-hidden="true" loading="lazy" class="thumb-hover">` : ''}
      </div>
      <div class="p-3.5">
        <div class="flex items-center justify-between gap-2">
          <p class="text-[0.7rem] uppercase tracking-[0.14em] text-soft">${p.color || ''}</p>
          <span class="rating-badge">★ ${p.rating}</span>
        </div>
        <h3 class="font-display font-semibold text-[0.95rem] mt-1 truncate">${p.name}</h3>
        <div class="flex items-baseline gap-2 mt-1.5">
          <span class="font-bold">${fmt(p.price)}</span>
          <span class="text-soft line-through text-xs">${fmt(p.mrp)}</span>
          <span class="text-mint text-xs font-bold">${p.discount}% off</span>
        </div>
      </div>
    </a>
    <div class="px-3.5 pb-3.5">
      <button class="btn-ghost w-full py-2 text-sm font-semibold" data-add="${p.id}" data-size="${(p.sizes && p.sizes[0]) || ''}">Add to Bag</button>
    </div>
  </div>`;
}
window.cardHTML = cardHTML;

// One delegated listener handles every card's wishlist/add buttons
document.addEventListener('click', (e) => {
  const addBtn = e.target.closest('[data-add]');
  if (addBtn) { Cart.add(addBtn.dataset.add, addBtn.dataset.size); return; }
  const wishBtn = e.target.closest('[data-wish]');
  if (wishBtn) {
    const on = Wish.toggle(wishBtn.dataset.wish);
    wishBtn.classList.toggle('on', on);
    wishBtn.querySelector('svg').setAttribute('fill', on ? 'currentColor' : 'none');
  }
});

// ---------------- shared layout ----------------
const NAV = [
  { href: '/', label: 'Home' },
  // { href: '/shop.html?gender=boys', label: 'Boys' },   // hidden — re-enable to restore
  // { href: '/shop.html?gender=girls', label: 'Girls' }, // hidden — re-enable to restore
  { href: '/shop.html?age=newborn', label: 'Newborn' },
  { href: '/shop.html?age=toddler', label: 'Toddlers' },
  { href: '/mix-match.html', label: 'Mix & Match', hot: true }
];

function headerHTML() {
  const user = Auth.user();
  const page = location.pathname;
  const navLinks = NAV.map((n) => `<a href="${n.href}" class="nav-link ${page === n.href.split('?')[0] && (page !== '/' || n.href === '/') && (n.href === '/' ? page === '/' : location.search === (n.href.split('?')[1] ? '?' + n.href.split('?')[1] : location.search)) ? 'active' : ''} ${n.hot ? '!text-gold' : ''}">${n.label}</a>`).join('');
  return `
  <div class="header-blur fixed top-0 left-0 right-0 z-50 border-b border-line">
    <div class="border-b border-line bg-surface">
      <div class="max-w-7xl mx-auto px-4 py-1.5 flex justify-end items-center gap-3 text-[0.7rem] font-medium text-soft">
        <a href="/our-story.html" class="hover:text-gold transition-colors">Our Story</a>
        <span aria-hidden="true" class="text-line">|</span>
        <a href="/location.html" class="hover:text-gold transition-colors">Location</a>
        <span aria-hidden="true" class="text-line">|</span>
        <a href="/contact.html" class="hover:text-gold transition-colors">Contact Us</a>
      </div>
    </div>
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex items-center gap-6 h-20">
        <a href="/" class="flex items-center shrink-0" aria-label="Cute Crew home">
          <img src="/assets/img/logo.webp?v=8" alt="Cute Crew" class="logo-img h-16 w-auto"
               onerror="if(!this.dataset.fb){this.dataset.fb=1;this.src='/assets/img/logo.png?v=8';}else{this.style.display='none';}">
        </a>
        <!-- menu sticks with search/icons on the right (desktop only — mobile keeps its own scrollable row below) -->
        <nav class="hidden md:flex items-center gap-6 text-sm shrink-0 ml-auto" aria-label="Categories">
          ${navLinks}
        </nav>
        <form action="/shop.html" class="w-full max-w-[210px] lg:max-w-xs hidden sm:block" role="search">
          <div class="relative">
            <input name="search" type="search" placeholder="Search…" class="field !py-2.5 !pl-10 !rounded-full" autocomplete="off">
            <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 text-soft" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        </form>
        <div class="flex items-center gap-1 shrink-0">
          ${user
            ? `<button id="btn-logout" class="p-2.5 text-soft hover:text-gold transition-colors" aria-label="Logout" title="Hi, ${String(user.name).split(' ')[0]} · Logout">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21a8 8 0 1 0-16 0"/><circle cx="12" cy="8" r="5"/></svg>
               </button>`
            : `<button id="btn-login" class="p-2.5 text-soft hover:text-gold transition-colors" aria-label="Login">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21a8 8 0 1 0-16 0"/><circle cx="12" cy="8" r="5"/></svg>
               </button>`}
          <a href="/shop.html?wishlist=1" class="p-2.5 text-soft hover:text-babypink transition-colors" aria-label="Wishlist">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
          </a>
          <a href="/cart.html" class="relative p-2.5 text-soft hover:text-gold transition-colors" aria-label="Shopping bag">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <span id="cart-badge" class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gold text-ink text-[0.65rem] font-extrabold hidden items-center justify-center">0</span>
          </a>
        </div>
      </div>
      <!-- mobile-only nav row (desktop shows the merged nav above instead) -->
      <nav class="flex md:hidden gap-6 overflow-x-auto -mb-px text-sm pb-2" aria-label="Categories mobile">
        ${navLinks}
      </nav>
    </div>
  </div>
  <div class="h-[9.75rem] md:h-[7rem]"></div>`;
}

function bottomNavHTML() {
  const p = location.pathname;
  const item = (href, label, icon, match) => `
    <a href="${href}" class="${p === match ? 'active' : ''}">${icon}<span>${label}</span></a>`;
  return `
  <nav class="bottom-nav" aria-label="Mobile navigation">
    ${item('/', 'Home', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>', '/')}
    ${item('/shop.html', 'Shop', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>', '/shop.html')}
    ${item('/mix-match.html', 'Mix & Match', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M21 3l-7.5 7.5"/><path d="M3 3l7.5 7.5"/><path d="M16 21h5v-5"/><path d="M8 21H3v-5"/><path d="M21 21l-7.5-7.5"/><path d="M3 21l7.5-7.5"/></svg>', '/mix-match.html')}
    ${item('/cart.html', 'Bag', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>', '/cart.html')}
  </nav>`;
}

function footerHTML() {
  return `
  <footer class="border-t border-line bg-surface mt-20">
    <div class="max-w-7xl mx-auto px-4 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
      <div class="col-span-2 md:col-span-1">
        <img src="/assets/img/logo.webp?v=8" alt="Cute Crew" class="h-16 w-auto"
             onerror="if(!this.dataset.fb){this.dataset.fb=1;this.src='/assets/img/logo.png?v=8';}else{this.style.display='none';}">
        <p class="text-soft text-sm mt-3 leading-relaxed">Premium fashion for little ones. Soft fabrics, luxury details, everyday play.</p>
        <div class="flex gap-3 mt-5 text-soft">
          <a href="#" aria-label="Instagram" class="hover:text-gold transition-colors"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg></a>
          <a href="#" aria-label="Facebook" class="hover:text-gold transition-colors"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
          <a href="#" aria-label="YouTube" class="hover:text-gold transition-colors"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22.5 6.4a3 3 0 0 0-2-2C18.9 4 12 4 12 4s-6.9 0-8.5.4a3 3 0 0 0-2 2A31 31 0 0 0 1 12a31 31 0 0 0 .5 5.6 3 3 0 0 0 2 2C5.1 20 12 20 12 20s6.9 0 8.5-.4a3 3 0 0 0 2-2A31 31 0 0 0 23 12a31 31 0 0 0-.5-5.6z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98"/></svg></a>
        </div>
      </div>
      <div>
        <p class="font-display font-bold text-sm uppercase tracking-widest text-soft mb-4">Shop</p>
        <ul class="space-y-2.5 text-sm">
          <li><a href="/shop.html?gender=boys" class="text-soft hover:text-gold transition-colors">Boys</a></li>
          <li><a href="/shop.html?gender=girls" class="text-soft hover:text-gold transition-colors">Girls</a></li>
          <li><a href="/shop.html?age=newborn" class="text-soft hover:text-gold transition-colors">Newborn</a></li>
          <li><a href="/mix-match.html" class="text-soft hover:text-gold transition-colors">Mix & Match</a></li>
        </ul>
      </div>
      <div>
        <p class="font-display font-bold text-sm uppercase tracking-widest text-soft mb-4">Help</p>
        <ul class="space-y-2.5 text-sm">
          <li><a href="#" class="text-soft hover:text-gold transition-colors">Track Order</a></li>
          <li><a href="#" class="text-soft hover:text-gold transition-colors">Returns & Exchange</a></li>
          <li><a href="#" class="text-soft hover:text-gold transition-colors">Shipping Policy</a></li>
          <li><a href="#" class="text-soft hover:text-gold transition-colors">Contact Us</a></li>
        </ul>
      </div>
      <div>
        <p class="font-display font-bold text-sm uppercase tracking-widest text-soft mb-4">Newsletter</p>
        <p class="text-soft text-sm mb-3">Get early access to drops + 100 reward points.</p>
        <form id="newsletter-form" class="flex gap-2">
          <input type="email" required placeholder="Email address" class="field !py-2.5 text-sm">
          <button class="btn-gold px-5 text-sm shrink-0">Join</button>
        </form>
      </div>
    </div>
    <div class="divider"></div>
    <div class="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-soft">
      <p>© 2026 Cute Crew · Premium Kids Fashion</p>
      <p class="flex items-center gap-3"><span>We accept:</span><span class="font-bold text-cream">UPI</span><span class="font-bold text-cream">Visa</span><span class="font-bold text-cream">Mastercard</span><span class="font-bold text-cream">COD</span><span class="font-bold text-cream">Wallet</span></p>
    </div>
  </footer>`;
}

function loginModalHTML() {
  return `
  <div id="login-modal" class="fixed inset-0 z-[80] hidden items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" data-close-login></div>
    <div class="glass relative w-full max-w-sm rounded-2xl p-7 shadow-lux">
      <button class="absolute top-4 right-4 text-soft hover:text-gold" data-close-login aria-label="Close">✕</button>
      <p class="font-display font-extrabold text-xl">Welcome back <span class="text-gold">♥</span></p>
      <p class="text-soft text-sm mt-1 mb-5">Login or create an account in seconds.</p>
      <form id="login-form" class="space-y-3">
        <input class="field" name="name" placeholder="Name (only for new accounts)">
        <input class="field" name="email" placeholder="Email" required>
        <input class="field" name="password" type="password" placeholder="Password (6+ chars)" required>
        <button class="btn-gold w-full py-3">Login / Register</button>
        <p id="login-err" class="text-red-400 text-xs hidden"></p>
      </form>
    </div>
  </div>`;
}

function updateCartBadge() {
  const b = document.getElementById('cart-badge');
  if (!b) return;
  const c = Cart.count();
  b.textContent = c;
  b.classList.toggle('hidden', c === 0);
  b.classList.toggle('flex', c > 0);
}

function mountLayout() {
  const h = document.getElementById('site-header');
  if (h) h.innerHTML = headerHTML();
  const f = document.getElementById('site-footer');
  if (f) f.innerHTML = footerHTML();
  if (!document.querySelector('.bottom-nav') && !document.body.dataset.noBottomNav) {
    document.body.insertAdjacentHTML('beforeend', bottomNavHTML());
  }
  document.body.insertAdjacentHTML('beforeend', loginModalHTML());
  updateCartBadge();

  const modal = document.getElementById('login-modal');
  const open = () => { modal.classList.remove('hidden'); modal.classList.add('flex'); };
  const close = () => { modal.classList.add('hidden'); modal.classList.remove('flex'); };
  window.openLogin = open;
  document.getElementById('btn-login')?.addEventListener('click', open);
  document.getElementById('btn-logout')?.addEventListener('click', () => Auth.logout());
  modal.querySelectorAll('[data-close-login]').forEach((el) => el.addEventListener('click', close));
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const err = document.getElementById('login-err');
    err.classList.add('hidden');
    const creds = { email: fd.get('email'), password: fd.get('password'), name: fd.get('name') };
    try {
      let res;
      try { res = await API.post('/auth/login', creds); }
      catch (loginErr) {
        if (!creds.name) throw new Error(loginErr.message + ' — add your name to create an account.');
        res = await API.post('/auth/register', creds);
      }
      Auth.set(res.token, res.user);
      toast(`Welcome, ${res.user.name}!`);
      close();
      setTimeout(() => location.reload(), 600);
    } catch (ex) { err.textContent = ex.message; err.classList.remove('hidden'); }
  });

  document.getElementById('newsletter-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    toast('Subscribed! 100 points added ✦');
    e.target.reset();
  });
}

document.addEventListener('cart:changed', updateCartBadge);

// ---------------- smooth scroll + reveals ----------------
function initSmoothScroll() {
  if (window.Lenis && !window.__lenis && window.matchMedia('(min-width: 768px)').matches) {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    window.__lenis = lenis;
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }
}

function initReveals() {
  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);
  document.querySelectorAll('.reveal').forEach((el) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });
}
window.initReveals = initReveals;

document.addEventListener('DOMContentLoaded', () => {
  mountLayout();
  initSmoothScroll();
  initReveals();
});
