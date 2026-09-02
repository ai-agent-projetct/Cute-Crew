/* Homepage: banner carousel, model wall, categories, age groups, trending carousel, new arrivals */
(async function () {
  // Banner carousel — one slide at a time. Pulls from the same /api/hero
  // endpoint the admin panel's "Hero Images" uploader feeds — every admin-
  // uploaded image shows here; falls back to 4 default photos if none uploaded.
  try {
    const { slides } = await API.get('/hero');
    const uploaded = slides.filter((s) => s.uploaded);
    const banners = uploaded.length ? uploaded : slides.slice(0, 4);
    // Every slide is one fixed 12:5 box so the carousel never changes height.
    // Uploaded banners are padded to that ratio by tools/normalize-banners.py;
    // `contain` means an un-normalised upload letterboxes instead of losing copy,
    // since these are designed artwork with headline text baked in.
    document.getElementById('banner-track').innerHTML = banners.map((s, i) => `
      <div class="swiper-slide">
        <img src="${s.src}" alt="${s.title || 'Cute Crew'}" loading="${i ? 'lazy' : 'eager'}"
             class="w-full aspect-[12/5] object-contain block bg-white">
      </div>`).join('');
    new Swiper('#banner-swiper', {
      loop: banners.length > 1,
      autoplay: { delay: 3500, disableOnInteraction: false },
      pagination: { el: '#banner-swiper .swiper-pagination', clickable: true },
      navigation: { nextEl: '#banner-swiper .swiper-button-next', prevEl: '#banner-swiper .swiper-button-prev' }
    });
  } catch (e) { console.error(e); }

  // Section two — full-width model wall (Bebe de Pino style), every look is a buyable in-stock product
  try {
    const { items } = await API.get('/products?spotlight=1&limit=8');
    document.getElementById('spotlight-track').innerHTML = items.map((p) => `
      <div class="swiper-slide">
        <a href="/product.html?id=${p.id}" class="block relative group overflow-hidden product-thumb">
          <img src="${p.image}" alt="${p.name}" loading="lazy"
               class="w-full aspect-[4/5] object-cover transition-transform duration-500 group-hover:scale-[1.04]">
          ${p.imageHover ? `<img src="${p.imageHover}" alt="" aria-hidden="true" loading="lazy" class="thumb-hover">` : ''}
          <div class="absolute inset-x-0 bottom-0 p-5 z-[2] bg-gradient-to-t from-black/80 via-black/30 to-transparent">
            <p class="font-display font-extrabold text-lg leading-tight">${p.name}</p>
            <p class="text-sm mt-1"><span class="font-bold">${fmt(p.price)}</span>
              <span class="text-soft line-through text-xs ml-1.5">${fmt(p.mrp)}</span>
              <span class="text-mint text-xs font-bold ml-1.5">In stock</span></p>
            <p class="text-gold text-xs font-bold mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">Shop this look →</p>
          </div>
        </a>
      </div>`).join('');
    new Swiper('#spotlight-swiper', {
      slidesPerView: 1.15, spaceBetween: 0, rewind: true,
      breakpoints: { 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } },
      navigation: { nextEl: '#spotlight-swiper .swiper-button-next', prevEl: '#spotlight-swiper .swiper-button-prev' }
    });
  } catch (e) { console.error(e); }
  // Categories
  try {
    const { categories, ages } = await API.get('/categories');
    const grid = document.getElementById('cat-grid');
    if (grid) {
      const mainCats = categories.filter((c) => ['boys', 'girls', 'newborn', 'toddlers'].includes(c.key));
      grid.innerHTML = mainCats.map((c) => `
        <a href="/shop.html?${c.query}" class="tile-card block group">
          <div class="aspect-[4/5] overflow-hidden">
            <img src="${c.photo || `/img/cat/${c.key}.svg`}" alt="${c.label}" loading="lazy" class="w-full h-full object-cover">
          </div>
          <div class="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/85 to-transparent">
            <p class="font-display font-bold">${c.label}</p>
            <p class="text-xs text-gold mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">Shop now →</p>
          </div>
        </a>`).join('');
    }

    const ageGrid = document.getElementById('age-grid');
    if (ageGrid) {
      ageGrid.innerHTML = ages.map((a) => `
        <div class="p-card p-6">
          <p class="font-display font-extrabold text-lg">${a.label}</p>
          <p class="text-soft text-xs mt-0.5 mb-4">${a.sub}</p>
          <div class="flex flex-wrap gap-2">
            ${a.chips.map((ch) => `<a href="/shop.html?age=${a.key}" class="chip">${ch}</a>`).join('')}
          </div>
        </div>`).join('');
    }
  } catch (e) { console.error(e); }

  // Trending carousel
  try {
    const { items } = await API.get('/products?limit=10');
    document.getElementById('trending-track').innerHTML = items
      .map((p) => `<div class="swiper-slide" style="width:auto">${cardHTML(p)}</div>`).join('');
    new Swiper('#trending-swiper', {
      slidesPerView: 1.35, spaceBetween: 16,
      breakpoints: { 640: { slidesPerView: 2.3 }, 900: { slidesPerView: 3.2 }, 1180: { slidesPerView: 4 } },
      navigation: { nextEl: '#trending-swiper .swiper-button-next', prevEl: '#trending-swiper .swiper-button-prev' }
    });
  } catch (e) { console.error(e); }

  // New arrivals
  try {
    const { items } = await API.get('/products?sort=new&limit=8');
    document.getElementById('new-grid').innerHTML = items.map(cardHTML).join('');
  } catch (e) { console.error(e); }

  if (window.ScrollTrigger) ScrollTrigger.refresh();
})();
