# Cute Crew — Premium Kids Fashion Ecommerce

Dark-theme, simple-to-use kids fashion store (Ajio/Meesho-style simplicity) with:

- **Scroll-scrubbed hero film + 3D mockups** — a real AI-generated children's fashion film (`frontend/assets/video/hero.mp4`) is scrubbed by scroll like a hand-controlled video, while floating 3D photo cards (Three.js) fly past. Whatever images you upload in the admin panel automatically render as 3D mockup cards in the hero.
- **Real photography** — 33 photorealistic images generated with Higgsfield/Nano Banana live in `frontend/assets/img/real/`: dark editorial shots (hero, category tiles, product pages), ghost-mannequin garment shots + cutouts (mix & match, shop), and a bright Bebe de Pino-style lifestyle set (`lb-*.png`) powering the homepage **Lookbook**.
- **Campaign films** — two sunny 10-second campaign videos (`campaign-girls.mp4`, `campaign-boys.mp4`) autoplay side-by-side in the homepage "The Campaign · Spring '26" section, each linking to its collection.
- **Mix & Match outfit builder** (exact Garanimals wheel, for Girls *and* Boys) — the selected top sits large in the centre with true garment cutouts fanned around it; the round arrows rotate the wheel, same for bottoms. Smart colour matching, suggestions, shuffle, one-tap "Add Whole Outfit".
- **Profiles required to order** — customers must register/login before checkout; every order is linked to the account and visible in the admin panel.
- Shop with filters/sort, product detail with zoom, cart with coupons, COD checkout, wishlist.
- **Admin panel (full control, JWT-secured)** — dashboard with revenue/orders stats, hero image uploads, product add/edit/delete **with photo upload**, order history + status management, and **user management** (add/edit/delete customers and admins, see each user's orders and spend). Login `admin` / `admin123`.

## Run

```bash
npm install
npm start
```

- Store: http://localhost:4000
- Admin: http://localhost:4000/admin.html — login `admin` / `admin123` (demo account: `demo` / `demo1234`)
- Coupons: `WELCOME10` (10%), `CREW20` (20%)

## Share a public demo

Run `start-demo.bat` (double-click). It starts the server and opens a free Cloudflare tunnel,
printing a public `https://xxxx.trycloudflare.com` URL:

- **Store** = that URL
- **Admin** = that URL + `/admin.html`

The link works only while your PC, the server window and the tunnel window stay open,
and the random URL changes each time the tunnel restarts.

## Stack

- **Backend**: Node.js + Express REST API, JWT auth (role-based), Multer uploads, MVC (routes → services → repository). Data persists to JSON files in `backend/src/data/db/` — swap `utils/store.js` for MySQL later without touching services.
- **Frontend**: HTML5 + Tailwind (CDN) + vanilla ES6 + Alpine.js (mix & match) + Three.js (3D hero) + GSAP/ScrollTrigger (reveals) + Lenis (smooth scroll) + Swiper (carousels). Fully responsive with mobile bottom navigation. PWA manifest included.
- **Images**: every product image is an SVG generated server-side from garment type + colours (`/img/...` routes) — no external image dependencies. Admin uploads are stored in `backend/uploads/`.

## Key API routes

| Route | Purpose |
|---|---|
| `GET /api/products` | list w/ filters (`gender, age, category, search, sort, minPrice, maxPrice, mix`) |
| `GET /api/products/:id` | product + related |
| `GET /api/mixmatch?gender=girls\|boys` | tops + bottoms for the outfit builder |
| `GET /api/hero` | hero slides (admin uploads + defaults) |
| `POST /api/cart/price` | server-side cart pricing incl. coupons |
| `POST /api/orders` | place order (COD) |
| `POST /api/auth/login` / `register` | JWT auth |
| `POST /api/admin/hero` (+ DELETE) | upload/remove 3D hero images (admin) |
| `POST/PUT/DELETE /api/admin/products` | product CRUD (admin) |
| `GET /api/admin/orders`, `PATCH .../:id` | order management (admin) |
