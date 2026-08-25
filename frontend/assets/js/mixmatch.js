/* Mix & Match outfit builder — Garanimals-style rotating wheels (Alpine component).
 * Each row (tops / bottoms) is a wheel: the selected garment sits large in the
 * centre, neighbours fan out to the sides smaller and tilted; the arrows rotate
 * the wheel. The two wheel centres stacked together form the outfit. */
document.addEventListener('alpine:init', () => {
  Alpine.data('mixMatch', () => ({
    gender: new URLSearchParams(location.search).get('gender') === 'boys' ? 'boys' : 'girls',
    tops: [],
    bottoms: [],
    ti: 0,
    bi: 0,
    size: null,
    mobile: window.innerWidth < 768,
    fmt: window.fmt,

    async init() {
      window.addEventListener('resize', () => { this.mobile = window.innerWidth < 768; });
      await this.load();
    },

    async load() {
      const data = await API.get(`/mixmatch?gender=${this.gender}`);
      this.tops = data.tops;
      this.bottoms = data.bottoms;
      this.ti = 0;
      this.bi = this.bestBottomFor(0);
      this.size = this.sizes[1] || this.sizes[0] || null;
    },

    setGender(g) {
      if (g === this.gender) return;
      this.gender = g;
      history.replaceState(null, '', `/mix-match.html?gender=${g}`);
      this.load();
    },

    get top() { return this.tops[this.ti] || null; },
    get bottom() { return this.bottoms[this.bi] || null; },

    // ---------- wheel geometry ----------
    get wheelH() { return this.mobile ? 240 : 330; },

    wheelStyle(i, si, n) {
      // shortest signed circular distance from the selected index
      let d = (i - si) % n;
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;

      const stepX = this.mobile ? 118 : 210;
      const baseW = this.mobile ? 150 : 230;
      const abs = Math.abs(d);
      const x = d * stepX;
      const y = abs * (this.mobile ? 26 : 40);
      const rot = d * 14;
      const scale = abs === 0 ? 1 : abs === 1 ? 0.56 : 0.44;
      const visible = abs <= 2;
      return `width:${baseW}px;` +
        `transform:translateX(calc(-50% + ${x}px)) translateY(${y}px) rotate(${rot}deg) scale(${scale});` +
        `z-index:${30 - abs * 10};opacity:${visible ? 1 : 0};pointer-events:${visible ? 'auto' : 'none'};`;
    },

    // ---------- matching ----------
    matches(t, b) {
      if (!t || !b) return false;
      return (t.matches || []).includes(b.palette) || (b.matches || []).includes(t.palette) || t.palette === b.palette;
    },

    get match() { return this.matches(this.top, this.bottom); },

    get suggestions() {
      const t = this.top;
      if (!t) return [];
      return this.bottoms
        .map((p, i) => ({ p, i }))
        .filter((x) => x.i !== this.bi && this.matches(t, x.p))
        .slice(0, 4);
    },

    get sizes() {
      if (!this.top || !this.bottom) return [];
      return (this.top.sizes || []).filter((s) => (this.bottom.sizes || []).includes(s));
    },

    get total() { return (this.top?.price || 0) + (this.bottom?.price || 0); },
    get totalMrp() { return (this.top?.mrp || 0) + (this.bottom?.mrp || 0); },

    bestBottomFor(ti) {
      const t = this.tops[ti];
      const i = this.bottoms.findIndex((b) => this.matches(t, b));
      return i === -1 ? 0 : i;
    },

    // ---------- actions ----------
    pick(which, i) {
      if (which === 't') this.ti = i;
      else this.bi = i;
      if (!this.sizes.includes(this.size)) this.size = this.sizes[0] || null;
    },

    step(which, dir) {
      if (which === 't') this.pick('t', (this.ti + dir + this.tops.length) % this.tops.length);
      else this.pick('b', (this.bi + dir + this.bottoms.length) % this.bottoms.length);
    },

    shuffle() {
      if (!this.tops.length || !this.bottoms.length) return;
      const ti = Math.floor(Math.random() * this.tops.length);
      const t = this.tops[ti];
      const matching = this.bottoms.map((p, i) => ({ p, i })).filter((x) => this.matches(t, x.p));
      const pickFrom = matching.length ? matching : this.bottoms.map((p, i) => ({ p, i }));
      const bi = pickFrom[Math.floor(Math.random() * pickFrom.length)].i;
      this.pick('t', ti);
      this.pick('b', bi);
    },

    addOutfit() {
      if (!this.top || !this.bottom) return;
      if (!this.size) { toast('Pick a size first'); return; }
      Cart.add(this.top.id, this.size, 1, true);
      Cart.add(this.bottom.id, this.size, 1, true);
      toast(`Outfit added to bag ✓ (${fmt(this.total)})`);
    }
  }));
});
