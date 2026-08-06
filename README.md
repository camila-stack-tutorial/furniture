# Woodora — furniture storefront

A static, multipage furniture site (home, shop with filters + pagination, single
product page with an image carousel, cart, and an admin panel) built in plain
HTML/CSS/JS so it deploys to Netlify with no build step.

## What works out of the box (no setup)

- Every page, fully responsive, matching the reference design's cream / terracotta palette.
- Fixed WhatsApp button on every page (`254757706360` by default — change it in the admin **Site settings** tab or `data/settings.json`).
- Shop filters (category, price, color), sort, and a real numbered pagination control.
- Single product page with a working image carousel + related products.
- Cart with quantities, stored per-browser, checkout button that opens WhatsApp
  with an itemized message.
- Footer social icons (TikTok, Instagram, Facebook, Pinterest) pulled from one settings object.
- Admin panel in **demo mode**: open `/admin-login.html` → "Continue in demo mode."
  You can add/edit/delete products, bulk-import a spreadsheet, and edit site
  settings. Demo mode saves to `localStorage` in your browser only.

## Making the admin panel "real" (shared, multi-user, Google-login)

Right now, without any setup, admin edits only persist in your own browser
(`localStorage`) — that's the "demo mode" fallback. To make edits actually
apply for every visitor, with real Google sign-in and a senior admin who
approves staff, wire up two things:

### 1. Netlify Functions + Netlify Blobs (the "backend")
Already scaffolded in `netlify/functions/`:
- `products.js` — GET returns the live product list, POST (auth'd) overwrites it.
- `settings.js` — same pattern for phone/socials/map/WhatsApp number.
- `staff.js` — lists everyone who has signed in and lets the senior admin approve/revoke.
- `_auth.js` — shared helper that verifies the Clerk session token on POST requests.

Deploy this repo to Netlify as-is (drag-and-drop or Git) and these functions
go live automatically at `/.netlify/functions/...` — `netlify.toml` already
points to the `netlify/functions` folder. Netlify Blobs needs no extra
setup on Netlify's side.

### 2. Clerk (Google sign-in + roles)
1. Create a free project at clerk.com, enable the **Google** social connection.
2. Copy your **Publishable key** into the `data-clerk-publishable-key` attribute
   in `admin-login.html` and `admin.html` (replace `pk_test_REPLACE_WITH_YOUR_CLERK_PUBLISHABLE_KEY`).
3. In Netlify, set two environment variables:
   - `CLERK_SECRET_KEY` — from the Clerk dashboard.
   - `CLERK_SENIOR_ADMIN_EMAIL` — the one email that should always have full access
     (this person can approve/revoke everyone else from the admin **Staff access** tab).
4. Redeploy. Now `/admin-login.html` shows a real Google sign-in. New sign-ins
   land in "pending" until the senior admin approves them in the Staff tab.

Until step 2 is done, `admin-login.html` automatically falls back to demo mode
so you can still preview every admin screen.

## Bulk product import

Admin → **Import spreadsheet**. Columns: `id, name, category, color, price,
oldPrice, description, details, images, featured`. Use `|` to separate
multiple `details` or `images` in one cell. Leave `id` blank to create a new
product; use an existing `id` to update that product. A sample file is at
`data/import-template.csv`.

## File map

```
index.html, shop.html, product.html, cart.html, about.html, services.html, contact.html
admin-login.html, admin.html
css/style.css
js/data.js       – product/settings fetch + cart, with localStorage fallback
js/common.js     – shared header/footer/WhatsApp button, rendered on every page
js/shop.js       – filters, sorting, pagination
js/product.js    – single product carousel + add to cart
js/cart.js       – cart table + WhatsApp checkout message
js/admin.js      – admin CRUD, spreadsheet import, settings, staff approval
data/products.json, data/settings.json – seed data used until the backend is connected
netlify/functions/ – products.js, settings.js, staff.js, _auth.js
```

## Known limitations to flag to your developer

- Netlify Blobs is a simple JSON key-value store, not a real database — fine
  for a single-store catalog like this, but it has no versioning/rollback.
- Image uploads aren't handled — products reference image **URLs** (host
  them anywhere, e.g. Cloudinary, or your own `/images` folder).
- Spreadsheet import runs entirely in the browser (SheetJS via CDN); very
  large files (thousands of rows) may be slow on low-end phones.
