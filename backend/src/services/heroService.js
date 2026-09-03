const fs = require('fs');
const path = require('path');
const db = require('../utils/mysql-db');
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

async function uploaded() {
  const rows = await db.query('SELECT * FROM hero_slides ORDER BY id DESC');
  return rows.map((r) => ({ file: r.file, title: r.title, at: r.createdAt }));
}

// `file` is a bare filename from the older uploader, an already-rooted
// `/uploads/xxx` URL from the disk uploader, or a full `https://...` Blob URL
// on Vercel — normalise all three to a single src without double-prefixing.
const srcOf = (file) => (/^(\/|https?:\/\/)/i.test(file) ? file : `/uploads/${file}`);

// Uploaded images come first (admin content leads the 3D hero), defaults fill the rest.
async function slides() {
  const ups = (await uploaded()).map((u) => ({ src: srcOf(u.file), title: u.title || 'Cute Crew', uploaded: true, file: u.file }));
  return ups.concat(DEFAULT_SLIDES).slice(0, 12);
}

async function add(file, title) {
  await db.query('INSERT INTO hero_slides (file, title) VALUES (?, ?)', [file, title || '']);
  return slides();
}

async function remove(file) {
  await db.query('DELETE FROM hero_slides WHERE file = ?', [file]);
  const abs = path.join(config.uploadsDir, path.basename(file));
  if (fs.existsSync(abs) && path.dirname(abs) === config.uploadsDir) fs.unlinkSync(abs);
  return slides();
}

module.exports = { slides, uploaded, add, remove };
