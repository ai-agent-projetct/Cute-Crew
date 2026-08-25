// Upload storage abstraction.
// Locally: multer writes straight to disk, served back via /uploads/<filename>.
// On Vercel: the filesystem is read-only, so files must go to Vercel Blob instead
// (store/return the full https:// blob URL). Without a Blob token configured,
// uploads are rejected with a clear error rather than crashing the whole function.
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const isServerless = !!process.env.VERCEL;
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

function randomName(originalname, prefix) {
  const ext = (path.extname(originalname) || '.jpg').toLowerCase();
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
}

const fileFilter = (req, file, cb) => {
  const ok = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'].includes((path.extname(file.originalname) || '').toLowerCase());
  cb(ok ? null : new Error('Only image files are allowed'), ok);
};

// Serverless filesystems are read-only (mkdir/write would crash the function on
// every cold start) — use in-memory storage there regardless of whether Blob is
// configured yet; storeFile() below is what decides where the bytes end up.
let upload;
if (isServerless) {
  upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 }, fileFilter });
} else {
  if (!fs.existsSync(config.uploadsDir)) fs.mkdirSync(config.uploadsDir, { recursive: true });
  upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, config.uploadsDir),
      filename: (req, file, cb) => cb(null, randomName(file.originalname, 'up'))
    }),
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter
  });
}

// Persists an already-`upload`-processed file and returns its public URL.
async function storeFile(file, prefix = 'up') {
  if (useBlob) {
    const { put } = require('@vercel/blob');
    const name = randomName(file.originalname, prefix);
    const blob = await put(name, file.buffer, { access: 'public', contentType: file.mimetype });
    return blob.url;
  }
  if (isServerless) {
    throw Object.assign(
      new Error('Image uploads need Vercel Blob storage — add a Blob store to this project (Storage tab) to enable it.'),
      { status: 501 }
    );
  }
  return `/uploads/${file.filename}`;
}

// Best-effort delete — used when an admin removes a hero image.
async function removeFile(fileOrUrl) {
  if (!fileOrUrl) return;
  if (/^https?:\/\//i.test(fileOrUrl)) {
    if (!useBlob) return;
    try {
      const { del } = require('@vercel/blob');
      await del(fileOrUrl);
    } catch (e) {
      console.error('Blob delete failed:', e.message);
    }
    return;
  }
  if (isServerless) return;
  const abs = path.join(config.uploadsDir, path.basename(fileOrUrl));
  if (fs.existsSync(abs) && path.dirname(abs) === config.uploadsDir) fs.unlinkSync(abs);
}

module.exports = { upload, storeFile, removeFile, useBlob };
