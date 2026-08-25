// Server-side SVG garment renderer.
// Every product image on the site is generated here from { type, hex, accent, motif }.
// viewBox is 600x750; garments are drawn symmetric around x=300.

function shade(hex, amt) {
  const n = hex.replace('#', '');
  const num = parseInt(n, 16);
  const clamp = (v) => Math.max(0, Math.min(255, v));
  const r = clamp((num >> 16) + amt);
  const g = clamp(((num >> 8) & 0xff) + amt);
  const b = clamp((num & 0xff) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ---------- motifs (small decorations placed on the garment) ----------
const MOTIFS = {
  star: (x, y, s, c) =>
    `<path transform="translate(${x},${y}) scale(${s})" fill="${c}" d="M0,-30 L8,-9 L31,-9 L13,5 L20,27 L0,14 L-20,27 L-13,5 L-31,-9 L-8,-9 Z"/>`,
  heart: (x, y, s, c) =>
    `<path transform="translate(${x},${y}) scale(${s})" fill="${c}" d="M0,24 C-28,2 -30,-16 -18,-24 C-8,-30 0,-22 0,-14 C0,-22 8,-30 18,-24 C30,-16 28,2 0,24 Z"/>`,
  rainbow: (x, y, s, c) =>
    `<g transform="translate(${x},${y}) scale(${s})" fill="none" stroke-linecap="round">
      <path d="M-30,12 A30,30 0 0 1 30,12" stroke="${c}" stroke-width="8"/>
      <path d="M-19,12 A19,19 0 0 1 19,12" stroke="#ffffff" stroke-opacity="0.85" stroke-width="7"/>
      <path d="M-9,12 A9,9 0 0 1 9,12" stroke="${c}" stroke-opacity="0.6" stroke-width="6"/>
    </g>`,
  cloud: (x, y, s, c) =>
    `<g transform="translate(${x},${y}) scale(${s})" fill="${c}">
      <circle cx="-14" cy="4" r="13"/><circle cx="2" cy="-6" r="16"/><circle cx="18" cy="5" r="12"/>
      <rect x="-22" y="4" width="48" height="13" rx="6"/>
    </g>`,
  crown: (x, y, s, c) =>
    `<g transform="translate(${x},${y}) scale(${s})" fill="${c}">
      <path d="M-28,14 L-32,-14 L-14,-2 L0,-20 L14,-2 L32,-14 L28,14 Z"/>
      <rect x="-28" y="16" width="56" height="8" rx="4"/>
    </g>`,
  bear: (x, y, s, c) =>
    `<g transform="translate(${x},${y}) scale(${s})" fill="${c}">
      <circle cx="-18" cy="-18" r="9"/><circle cx="18" cy="-18" r="9"/><circle cx="0" cy="0" r="24"/>
      <circle cx="-8" cy="-4" r="3.4" fill="#ffffff"/><circle cx="8" cy="-4" r="3.4" fill="#ffffff"/>
      <ellipse cx="0" cy="8" rx="7" ry="5.5" fill="#ffffff"/>
    </g>`,
  flower: (x, y, s, c) =>
    `<g transform="translate(${x},${y}) scale(${s})" fill="${c}">
      <circle cx="0" cy="-16" r="9"/><circle cx="15" cy="-5" r="9"/><circle cx="9" cy="13" r="9"/>
      <circle cx="-9" cy="13" r="9"/><circle cx="-15" cy="-5" r="9"/><circle cx="0" cy="0" r="8" fill="#ffffff"/>
    </g>`,
  bolt: (x, y, s, c) =>
    `<path transform="translate(${x},${y}) scale(${s})" fill="${c}" d="M6,-30 L-16,4 L-2,4 L-6,30 L16,-6 L2,-6 Z"/>`,
  stripes: () => '' // handled inside garment bodies
};

function motifAt(name, x, y, s, c) {
  const fn = MOTIFS[name];
  return fn ? fn(x, y, s, c) : '';
}

// ---------- garment bodies ----------
// Each returns SVG markup for the garment only. o = outline color.
const GARMENTS = {
  tshirt({ hex, accent, motif, o }) {
    return `
    <g stroke="${o}" stroke-width="7" stroke-linejoin="round">
      <path d="M199,238 L108,296 L146,362 L212,326 Z" fill="${shade(hex, -12)}"/>
      <path d="M401,238 L492,296 L454,362 L388,326 Z" fill="${shade(hex, -12)}"/>
      <path d="M199,238 Q300,206 401,238 L397,556 Q300,586 203,556 Z" fill="${hex}"/>
      <path d="M251,228 Q300,274 349,228 L332,216 Q300,248 268,216 Z" fill="${accent}" stroke-width="5"/>
    </g>
    ${motifAt(motif, 300, 392, 1.5, accent)}`;
  },
  hoodie({ hex, accent, motif, o }) {
    return `
    <g stroke="${o}" stroke-width="7" stroke-linejoin="round">
      <path d="M240,232 Q300,128 360,232 Q300,268 240,232 Z" fill="${shade(hex, -20)}"/>
      <path d="M196,244 L104,306 L144,372 L210,334 Z" fill="${shade(hex, -12)}"/>
      <path d="M404,244 L496,306 L456,372 L390,334 Z" fill="${shade(hex, -12)}"/>
      <path d="M196,244 Q300,214 404,244 L399,556 Q300,588 201,556 Z" fill="${hex}"/>
      <path d="M248,470 L352,470 L338,540 L262,540 Z" fill="${shade(hex, -14)}"/>
      <line x1="284" y1="262" x2="284" y2="310" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>
      <line x1="316" y1="262" x2="316" y2="310" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>
    </g>
    ${motifAt(motif, 300, 380, 1.25, accent)}`;
  },
  dress({ hex, accent, motif, o }) {
    return `
    <g stroke="${o}" stroke-width="7" stroke-linejoin="round">
      <path d="M236,230 L188,282 L226,316 L250,292 Z" fill="${shade(hex, -12)}"/>
      <path d="M364,230 L412,282 L374,316 L350,292 Z" fill="${shade(hex, -12)}"/>
      <path d="M236,230 Q300,204 364,230 L372,348 L228,348 Z" fill="${hex}"/>
      <path d="M228,348 L372,348 L448,560 Q300,600 152,560 Z" fill="${shade(hex, 10)}"/>
      <rect x="224" y="336" width="152" height="22" rx="11" fill="${accent}" stroke-width="5"/>
      <path d="M256,224 Q300,262 344,224 L330,214 Q300,240 270,214 Z" fill="${accent}" stroke-width="5"/>
    </g>
    ${motifAt(motif, 300, 470, 1.5, accent)}`;
  },
  pants({ hex, accent, o }) {
    return `
    <g stroke="${o}" stroke-width="7" stroke-linejoin="round">
      <path d="M212,254 L388,254 L394,318 L312,318 L306,560 L232,560 L226,318 Z" fill="${hex}" fill-rule="evenodd"/>
      <path d="M388,254 L394,318 L312,318 L306,560 L368,560 L374,318" fill="${hex}"/>
      <path d="M212,254 L388,254 L392,312 L306,312 L302,560 L234,560 L228,388 L224,560 M224,388 L218,560" fill="none" stroke="none"/>
      <path d="M212,254 L388,254 L396,560 L318,560 L300,368 L282,560 L204,560 Z" fill="${hex}"/>
      <rect x="206" y="236" width="188" height="34" rx="12" fill="${accent}"/>
      <rect x="204" y="530" width="92" height="30" rx="8" fill="${shade(hex, -18)}" stroke-width="5"/>
      <rect x="304" y="530" width="92" height="30" rx="8" fill="${shade(hex, -18)}" stroke-width="5"/>
    </g>`;
  },
  shorts({ hex, accent, o }) {
    return `
    <g stroke="${o}" stroke-width="7" stroke-linejoin="round">
      <path d="M214,266 L386,266 L402,442 L314,442 L300,352 L286,442 L198,442 Z" fill="${hex}"/>
      <rect x="208" y="246" width="184" height="34" rx="12" fill="${accent}"/>
      <path d="M198,414 L286,414 M314,414 L402,414" stroke="${shade(hex, -20)}" stroke-width="6"/>
      <path d="M262,250 L262,268 M338,250 L338,268" stroke="${shade(hex, -24)}" stroke-width="5" stroke-linecap="round"/>
    </g>`;
  },
  skirt({ hex, accent, motif, o }) {
    return `
    <g stroke="${o}" stroke-width="7" stroke-linejoin="round">
      <path d="M228,272 L372,272 L432,458 Q300,494 168,458 Z" fill="${hex}"/>
      <path d="M262,274 L246,464 M300,276 L300,472 M338,274 L354,464" stroke="${shade(hex, -16)}" stroke-width="5" fill="none"/>
      <rect x="220" y="250" width="160" height="30" rx="12" fill="${accent}"/>
    </g>
    ${motifAt(motif, 300, 396, 1.05, accent)}`;
  },
  romper({ hex, accent, motif, o }) {
    return `
    <g stroke="${o}" stroke-width="7" stroke-linejoin="round">
      <path d="M206,240 L128,288 L160,346 L218,316 Z" fill="${shade(hex, -12)}"/>
      <path d="M394,240 L472,288 L440,346 L382,316 Z" fill="${shade(hex, -12)}"/>
      <path d="M206,240 Q300,210 394,240 L390,470 L332,470 L332,512 L268,512 L268,470 L210,470 Z" fill="${hex}"/>
      <path d="M254,230 Q300,270 346,230 L330,218 Q300,246 270,218 Z" fill="${accent}" stroke-width="5"/>
      <circle cx="280" cy="492" r="6" fill="${accent}" stroke-width="4"/>
      <circle cx="300" cy="492" r="6" fill="${accent}" stroke-width="4"/>
      <circle cx="320" cy="492" r="6" fill="${accent}" stroke-width="4"/>
    </g>
    ${motifAt(motif, 300, 360, 1.3, accent)}`;
  },
  jacket({ hex, accent, motif, o }) {
    return `
    <g stroke="${o}" stroke-width="7" stroke-linejoin="round">
      <path d="M196,244 L102,304 L142,372 L208,336 Z" fill="${shade(hex, -14)}"/>
      <path d="M404,244 L498,304 L458,372 L392,336 Z" fill="${shade(hex, -14)}"/>
      <path d="M196,244 Q300,214 404,244 L399,556 Q300,586 201,556 Z" fill="${hex}"/>
      <path d="M300,252 L300,560" stroke="${shade(hex, -34)}" stroke-width="9"/>
      <path d="M258,234 L300,252 L342,234 L352,262 L300,286 L248,262 Z" fill="${shade(hex, -20)}"/>
      <rect x="228" y="440" width="52" height="40" rx="8" fill="${shade(hex, -16)}" stroke-width="5"/>
      <rect x="320" y="440" width="52" height="40" rx="8" fill="${shade(hex, -16)}" stroke-width="5"/>
      <circle cx="300" cy="300" r="7" fill="${accent}" stroke-width="4"/>
    </g>
    ${motifAt(motif, 352, 340, 0.8, accent)}`;
  }
};

/**
 * Render one garment as a full SVG document.
 * opts: { type, hex, accent, motif, bg } — bg: 'card' (dark gradient), 'none' (transparent), or a css color
 */
function renderGarment(opts) {
  const { type = 'tshirt', hex = '#f7a8c4', accent = '#ffffff', motif = 'star', bg = 'card' } = opts;
  const o = shade(hex, -70);
  const draw = GARMENTS[type] || GARMENTS.tshirt;
  const body = draw({ hex, accent, motif, o });

  let bgLayer = '';
  if (bg === 'card') {
    bgLayer = `<rect width="600" height="750" fill="#ffffff"/>`;
  } else if (bg && bg !== 'none') {
    bgLayer = `<rect width="600" height="750" fill="${bg}"/>`;
  }

  const shadow = bg === 'none' ? '' : `<ellipse cx="300" cy="622" rx="150" ry="22" fill="#000000" opacity="0.35"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">${bgLayer}${shadow}${body}</svg>`;
}

/**
 * Render a "poster" — a rich gradient art card used as a 3D hero texture.
 * opts: { type, hex, accent, motif, from, to, title }
 */
function renderPoster(opts) {
  const { type = 'dress', hex = '#f7a8c4', accent = '#ffffff', motif = 'star', from = '#2a2135', to = '#0e0f13', title = '' } = opts;
  const o = shade(hex, -70);
  const draw = GARMENTS[type] || GARMENTS.tshirt;
  const body = draw({ hex, accent, motif, o });
  const label = title
    ? `<text x="300" y="700" text-anchor="middle" font-family="Verdana, sans-serif" font-size="30" letter-spacing="10" fill="#e6c586">${title.toUpperCase()}</text>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">
    <defs>
      <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="${hex}" stop-opacity="0.30"/><stop offset="100%" stop-color="${hex}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="600" height="750" fill="url(#pg)"/>
    <rect width="600" height="750" fill="url(#glow)"/>
    <circle cx="92" cy="120" r="46" fill="${hex}" opacity="0.14"/>
    <circle cx="520" cy="620" r="70" fill="${accent}" opacity="0.10"/>
    <circle cx="510" cy="110" r="26" fill="${accent}" opacity="0.16"/>
    ${motifAt('star', 96, 620, 0.8, '#e6c586')}
    ${motifAt('star', 520, 210, 0.55, '#e6c586')}
    <ellipse cx="300" cy="620" rx="160" ry="24" fill="#000000" opacity="0.4"/>
    ${body}
    ${label}
    <rect x="6" y="6" width="588" height="738" rx="18" fill="none" stroke="#e6c586" stroke-opacity="0.35" stroke-width="3"/>
  </svg>`;
}

module.exports = { renderGarment, renderPoster, shade };
