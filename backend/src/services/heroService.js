const fs = require('fs');
const path = require('path');
const store = require('../utils/store');
const config = require('../config');

// Default hero slides — real editorial photography generated for the brand.
// (Falls back gracefully: any missing file simply doesn't render as a 3D card.)
const DEFAULT_SLIDES = [
  { src: '/assets/img/real/girl-twirl.png', title: 'New Season' },
  { src: '/assets/img/real/boy-walk.png', title: 'Boys Edit' },
  { src: '/assets/img/real/girl-frock.png', title: 'Girls Edit' },
  { src: '/assets/img/real/toddler-jump.png', title: 'Toddlers' },
  { src: '/assets/img/real/party-pair.png', title: 'Party Wear' },
  { src: '/assets/img/real/baby-romper.png', title: 'Newborn' },
  { src: '/assets/img/real/winter-puffer.png', title: 'Winter' },
  { src: '/assets/img/real/night-pjs.png', title: 'Night Wear' },
  { src: '/assets/img/real/school-walk.png', title: 'School' }
];

function uploaded() {
  return store.read('hero', []);
}

// `file` is a bare filename from the older uploader but an already-rooted
// `/uploads/xxx` URL from the current one — normalise both to a single src so
// neither shape double-prefixes into `/uploads//uploads/xxx`.
const srcOf = (file) => (file.startsWith('/') ? file : `/uploads/${file}`);

// Uploaded images come first (admin content leads the 3D hero), defaults fill the rest.
function slides() {
  const ups = uploaded().map((u) => ({ src: srcOf(u.file), title: u.title || 'Cute Crew', uploaded: true, file: u.file }));
  return ups.concat(DEFAULT_SLIDES).slice(0, 12);
}

function add(file, title) {
  const list = uploaded().slice();
  list.unshift({ file, title: title || '', at: new Date().toISOString() });
  store.write('hero', list);
  return slides();
}

function remove(file) {
  const list = uploaded().filter((u) => u.file !== file);
  store.write('hero', list);
  const abs = path.join(config.uploadsDir, path.basename(file));
  if (fs.existsSync(abs) && path.dirname(abs) === config.uploadsDir) fs.unlinkSync(abs);
  return slides();
}

module.exports = { slides, uploaded, add, remove };
