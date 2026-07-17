// Dynamic SVG image endpoints — every product/category/hero-poster image is generated on the fly.
const express = require('express');
const { renderGarment, renderPoster } = require('../utils/garments');
const productService = require('../services/productService');
const catalog = require('../data/catalog');

const router = express.Router();

const POSTERS = [
  { type: 'dress', hex: '#f7a8c4', accent: '#e6c586', motif: 'flower', from: '#5c3a52', to: '#181019', title: 'New Season' },
  { type: 'skirt', hex: '#c9b8f0', accent: '#ffffff', motif: 'star', from: '#4a4072', to: '#141021', title: 'Girls Edit' },
  { type: 'tshirt', hex: '#9cc6ff', accent: '#eaf3ff', motif: 'bolt', from: '#324a72', to: '#0f1521', title: 'Boys Edit' },
  { type: 'dress', hex: '#ffd98a', accent: '#e07a9a', motif: 'crown', from: '#665032', to: '#1c150c', title: 'Party Wear' },
  { type: 'romper', hex: '#f2e8d8', accent: '#c9a86a', motif: 'bear', from: '#544c3e', to: '#171410', title: 'Newborn' },
  { type: 'jacket', hex: '#a8c8e8', accent: '#e6c586', motif: 'star', from: '#38485e', to: '#101620', title: 'Winter' },
  { type: 'hoodie', hex: '#98e0c0', accent: '#ffffff', motif: 'cloud', from: '#325a49', to: '#0e1a15', title: 'Mix & Match' },
  { type: 'tshirt', hex: '#ffb98a', accent: '#fff1e2', motif: 'heart', from: '#63412c', to: '#1c130d', title: 'Cute Crew' }
];

function sendSvg(res, svg) {
  res.set('Content-Type', 'image/svg+xml');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(svg);
}

// Product image: /img/p/12.svg  (?bg=none for transparent cutout used by Mix & Match)
router.get('/p/:id.svg', (req, res) => {
  const p = productService.byId(req.params.id);
  if (!p) return res.status(404).send('Not found');
  sendSvg(res, renderGarment({ type: p.type, hex: p.hex, accent: p.accent, motif: p.motif, bg: req.query.bg === 'none' ? 'none' : 'card' }));
});

// Category tile: /img/cat/girls.svg
router.get('/cat/:key.svg', (req, res) => {
  const c = catalog.categories.find((x) => x.key === req.params.key);
  if (!c) return res.status(404).send('Not found');
  sendSvg(res, renderGarment({ type: c.type, hex: c.hex, accent: c.accent, motif: c.motif, bg: 'card' }));
});

// Default 3D hero poster: /img/poster/0.svg
router.get('/poster/:n.svg', (req, res) => {
  const cfg = POSTERS[Number(req.params.n)];
  if (!cfg) return res.status(404).send('Not found');
  sendSvg(res, renderPoster(cfg));
});

// Generic garment (used by admin "new product" live preview):
// /img/g/tshirt.svg?hex=%23f7a8c4&accent=%23ffffff&motif=star&bg=none
router.get('/g/:type.svg', (req, res) => {
  const ok = (v, fb) => (/^#[0-9a-fA-F]{6}$/.test(v || '') ? v : fb);
  sendSvg(res, renderGarment({
    type: req.params.type,
    hex: ok(req.query.hex, '#9cc6ff'),
    accent: ok(req.query.accent, '#ffffff'),
    motif: req.query.motif || 'star',
    bg: req.query.bg === 'none' ? 'none' : 'card'
  }));
});

module.exports = router;
