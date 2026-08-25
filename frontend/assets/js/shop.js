/* Shop listing: URL-driven filters + sort, simple chip UI */
(function () {
  const params = new URLSearchParams(location.search);
  const state = {
    gender: params.get('gender') || '',
    age: params.get('age') || '',
    category: params.get('category') || '',
    price: '',
    search: params.get('search') || '',
    sort: params.get('sort') || '',
    wishlist: params.get('wishlist') === '1'
  };

  const grid = document.getElementById('shop-grid');
  const empty = document.getElementById('shop-empty');
  const title = document.getElementById('shop-title');
  const count = document.getElementById('shop-count');
  const sortSel = document.getElementById('shop-sort');
  sortSel.value = state.sort;

  function heading() {
    if (state.wishlist) return 'My Wishlist ♥';
    if (state.search) return `Results for “${state.search}”`;
    if (state.gender) return state.gender === 'boys' ? 'Boys Collection' : 'Girls Collection';
    if (state.age) return { newborn: 'Newborn (0–12 M)', toddler: 'Toddlers (1–3 Y)', kids: 'Kids (4–12 Y)' }[state.age] || 'All Products';
    if (state.category) return state.category.charAt(0).toUpperCase() + state.category.slice(1);
    return 'All Products';
  }

  // reflect state on chips
  document.querySelectorAll('[data-filter]').forEach((group) => {
    const key = group.dataset.filter;
    group.querySelectorAll('.chip').forEach((chip) => {
      if (state[key] === chip.dataset.v) chip.classList.add('on');
      chip.addEventListener('click', () => {
        state[key] = state[key] === chip.dataset.v ? '' : chip.dataset.v;
        group.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', state[key] === c.dataset.v));
        load();
      });
    });
  });

  document.getElementById('btn-clear').addEventListener('click', () => {
    Object.assign(state, { gender: '', age: '', category: '', price: '', search: '', wishlist: false });
    document.querySelectorAll('.chip.on').forEach((c) => c.classList.remove('on'));
    load();
  });

  sortSel.addEventListener('change', () => { state.sort = sortSel.value; load(); });

  document.getElementById('btn-filters').addEventListener('click', () => {
    document.getElementById('filters').classList.toggle('hidden');
  });

  const filterPromo = document.getElementById('filter-promo');
  const shopLayout = document.getElementById('shop-layout');

  async function load() {
    title.textContent = heading();
    grid.innerHTML = '<div class="skel aspect-[3/4]"></div>'.repeat(8);
    empty.classList.add('hidden');
    const showBoysPromo = state.gender === 'boys';
    if (filterPromo) filterPromo.classList.toggle('hidden', !showBoysPromo);
    // add a 3rd column (opposite side from the filters) only while the promo is showing
    if (shopLayout) {
      shopLayout.classList.toggle('md:grid-cols-[220px_1fr]', !showBoysPromo);
      shopLayout.classList.toggle('md:grid-cols-[220px_1fr_220px]', showBoysPromo);
    }

    const q = new URLSearchParams();
    if (state.gender) q.set('gender', state.gender);
    if (state.age) q.set('age', state.age);
    if (state.category) q.set('category', state.category);
    if (state.search) q.set('search', state.search);
    if (state.sort) q.set('sort', state.sort);
    if (state.price) {
      const [min, max] = state.price.split('-');
      q.set('minPrice', min); q.set('maxPrice', max);
    }
    q.set('limit', '60');

    try {
      let { items, total } = await API.get(`/products?${q}`);
      if (state.wishlist) {
        const ids = Wish.read();
        items = items.filter((p) => ids.includes(p.id));
        total = items.length;
      }
      count.textContent = total;
      if (!items.length) {
        grid.innerHTML = '';
        empty.classList.remove('hidden');
        return;
      }
      grid.innerHTML = items.map(cardHTML).join('');
      if (window.gsap) gsap.from('#shop-grid .p-card', { opacity: 0, y: 22, duration: 0.5, stagger: 0.04, ease: 'power2.out', clearProps: 'all' });
    } catch (e) {
      grid.innerHTML = `<p class="text-soft col-span-full py-10 text-center">${e.message}</p>`;
    }
  }

  load();
})();
