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

## Making the admin panel "real" (shared, multi-user, roles)

The admin panel uses its own built-in email/password auth — no third-party
identity provider, and no custom domain required. Two things need to be set
up in Netlify (Site settings → Environment variables):

### 1. Netlify Functions + Netlify Blobs (the "backend")
Already scaffolded in `netlify/functions/`:
- `products.js` — GET returns the live product list, POST (auth'd) overwrites it.
- `settings.js` — same pattern for phone/socials/map/WhatsApp number.
- `staff.js` — senior-admin-only: lists staff and approves/revokes/promotes/demotes.
- `auth-login.js` — verifies email/password, issues a signed session token.
- `auth-register.js` — staff self-registration (lands as "pending").
- `auth-me.js` — lets the frontend confirm the current session's role.
- `_auth.js` — shared helper: password hashing (scrypt) + session token signing/verification (HMAC-SHA256).

Set these two Blobs credentials so `_store.js` doesn't depend on Netlify's
automatic Blobs injection (which can be unreliable):
- `BLOBS_SITE_ID` — your Project ID (Project configuration → General).
- `BLOBS_TOKEN` — a Personal Access Token (User settings → Applications).

### 2. Built-in auth (no domain, no third-party sign-in)
Set three more environment variables:
- `SENIOR_ADMIN_EMAIL` — the permanent "bootstrap" senior admin's email. This
  account always works even if the staff directory is empty or broken.
- `SENIOR_ADMIN_PASSWORD` — that account's password.
- `SESSION_SECRET` — a long random string used to sign session tokens
  (generate one with e.g. `openssl rand -hex 32`).

Redeploy after setting these. Now `/admin-login.html` shows a real email/password
sign-in and a "Request access" form for new staff. New staff registrations land
as "pending" until a senior admin approves them from the admin panel's **Staff
access** tab, which also lets any senior admin promote another approved staff
member to senior (or demote them back).

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
