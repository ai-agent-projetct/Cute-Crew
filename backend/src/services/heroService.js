const store = require('../utils/store-mysql');
const { removeFile } = require('../utils/uploads');

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

// `file` is already a ready-to-use URL from storeFile(): either `/uploads/xxx`
// (dev, local disk) or a full https:// Vercel Blob URL (production).
function srcFor(file) {
  return /^https?:\/\//i.test(file) || file.startsWith('/') ? file : `/uploads/${file}`;
}

async function uploaded() {
  return store.getHeroSlides();
}

// Uploaded images come first (admin content leads the 3D hero), defaults fill the rest.
async function slides() {
  const ups = (await uploaded()).map((u) => ({ src: srcFor(u.file), title: u.title || 'Cute Crew', uploaded: true, file: u.file }));
  return ups.concat(DEFAULT_SLIDES).slice(0, 12);
}

async function add(file, title) {
  await store.addHeroSlide(file, title);
  return slides();
}

async function remove(file) {
  await store.removeHeroSlide(file);
  await removeFile(file);
  return slides();
}

module.exports = { slides, uploaded, add, remove };
