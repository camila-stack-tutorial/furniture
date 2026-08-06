/* ============ Common site chrome ============
   Header + footer are rendered from one template so every page
   (and every future page) automatically stays in sync. */

const NAV_LINKS = [
  { href: '/index.html', label: 'Home' },
  { href: '/shop.html', label: 'Shop' },
  { href: '/about.html', label: 'About' },
  { href: '/services.html', label: 'Services' },
  { href: '/contact.html', label: 'Contact' }
];

function currentFile() {
  const p = location.pathname.split('/').pop();
  return p === '' ? 'index.html' : p;
}

const ICONS = {
  tiktok: `<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.82a4.5 4.5 0 0 1-3.53-4.02h-3.01v14.36a2.7 2.7 0 1 1-2.7-2.7c.15 0 .3.01.44.03V10.4a5.72 5.72 0 0 0-.44-.02A5.72 5.72 0 1 0 13.06 16V9.66a7.5 7.5 0 0 0 4.4 1.42V8.08a4.48 4.48 0 0 1-.86-2.26Z"/></svg>`,
  instagram: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>`,
  facebook: `<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 22v-8.4h2.8l.42-3.3h-3.22V8.1c0-.95.26-1.6 1.63-1.6h1.74V3.5A23.4 23.4 0 0 0 14.3 3.3c-2.5 0-4.2 1.53-4.2 4.34v2.66H7.3v3.3h2.8V22h3.4Z"/></svg>`,
  pinterest: `<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.64 19.3c-.05-.8-.09-2.02.02-2.9.1-.78.66-4.98.66-4.98s-.17-.34-.17-.83c0-.78.45-1.36 1.02-1.36.48 0 .71.36.71.79 0 .48-.31 1.2-.46 1.87-.13.56.28 1.02.83 1.02.99 0 1.76-1.05 1.76-2.55 0-1.34-.96-2.27-2.33-2.27-1.59 0-2.52 1.19-2.52 2.42 0 .48.18.99.42 1.27.05.05.05.1.04.16-.04.18-.14.56-.16.64-.03.1-.09.13-.2.08-.75-.35-1.22-1.45-1.22-2.33 0-1.9 1.38-3.64 3.98-3.64 2.09 0 3.71 1.49 3.71 3.48 0 2.08-1.31 3.75-3.13 3.75-.61 0-1.19-.32-1.38-.7l-.38 1.43c-.14.53-.51 1.19-.76 1.6A10 10 0 1 0 12 2Z"/></svg>`
};

function renderHeader() {
  const mount = document.getElementById('siteHeader');
  if (!mount) return;
  const cur = currentFile();
  const links = NAV_LINKS.map(l => `<a href="${l.href}" class="${l.href.endsWith(cur) ? 'active' : ''}">${l.label}</a>`).join('');
  mount.innerHTML = `
  <div class="container nav">
    <a href="/index.html" class="logo">Crib Furniture</a>
    <nav class="nav-links">${links}</nav>
    <div class="nav-actions">
      <label class="nav-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="search" placeholder="Search products" id="navSearchInput" aria-label="Search products">
      </label>
      <a class="icon-btn" href="/cart.html" aria-label="Cart">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
        <span class="cart-count" data-cart-count>0</span>
      </a>
      <button class="burger" aria-label="Open menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      </button>
    </div>
  </div>
  <div class="mobile-menu">
    <button class="mobile-menu-close" aria-label="Close menu">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>
    ${NAV_LINKS.map(l => `<a href="${l.href}">${l.label}</a>`).join('')}
    <a href="/cart.html">Cart (<span data-cart-count>0</span>)</a>
  </div>`;
}

function renderFooter() {
  const mount = document.getElementById('siteFooter');
  if (!mount) return;
  mount.innerHTML = `
  <div class="container">
    <div class="footer-grid">
      <div>
        <a href="/index.html" class="logo">Crib Furniture</a>
        <p style="margin-top:14px;max-width:280px">Furniture that fits your life beautifully — handmade pieces designed for slow, comfortable living.</p>
        <div class="social-row">
          <a href="#" data-social="tiktok" target="_blank" rel="noopener" aria-label="TikTok">${ICONS.tiktok}</a>
          <a href="#" data-social="instagram" target="_blank" rel="noopener" aria-label="Instagram">${ICONS.instagram}</a>
          <a href="#" data-social="facebook" target="_blank" rel="noopener" aria-label="Facebook">${ICONS.facebook}</a>
          <a href="#" data-social="pinterest" target="_blank" rel="noopener" aria-label="Pinterest">${ICONS.pinterest}</a>
        </div>
      </div>
      <div>
        <h4>Shop</h4>
        <ul>
          <li><a href="/shop.html?category=Sofas">Sofas</a></li>
          <li><a href="/shop.html?category=Chairs">Chairs</a></li>
          <li><a href="/shop.html?category=Tables">Tables</a></li>
          <li><a href="/shop.html?category=Lighting">Lighting</a></li>
          <li><a href="/shop.html?category=Storage">Storage</a></li>
        </ul>
      </div>
      <div>
        <h4>Company</h4>
        <ul>
          <li><a href="/about.html">About us</a></li>
          <li><a href="/services.html">Services</a></li>
          <li><a href="/contact.html">Contact</a></li>
          <li><a href="/admin-login.html" target="_blank" rel="noopener">Staff login</a></li>
        </ul>
      </div>
      <div>
        <h4>Get in touch</h4>
        <ul>
          <li><a data-phone href="#">Loading…</a></li>
          <li><a data-email href="#">Loading…</a></li>
          <li><span data-address>Loading…</span></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} Crib Furniture. All rights reserved.</span>
      <span>Designed for slow living.</span>
    </div>
  </div>`;
}

document.addEventListener('DOMContentLoaded', async () => {
  renderHeader();
  renderFooter();
  WOODORA.updateCartBadge();

  const burger = document.querySelector('.burger');
  const menu = document.querySelector('.mobile-menu');
  if (burger && menu) {
    burger.addEventListener('click', () => menu.classList.add('open'));
    menu.querySelector('.mobile-menu-close')?.addEventListener('click', () => menu.classList.remove('open'));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
  }

  const searchInput = document.getElementById('navSearchInput');
  searchInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && searchInput.value.trim()) {
      location.href = `/shop.html?q=${encodeURIComponent(searchInput.value.trim())}`;
    }
  });

  const settings = await WOODORA.getSettings();
  injectWhatsAppButton(settings);
  populateSettingsIntoDOM(settings);
});

function injectWhatsAppButton(settings) {
  if (document.querySelector('.wa-float')) return;
  const a = document.createElement('a');
  a.className = 'wa-float';
  a.href = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent('Hi Crib Furniture! I have a question about your furniture.')}`;
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('aria-label', 'Chat with us on WhatsApp');
  a.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12.02 2C6.5 2 2.02 6.48 2.02 12c0 1.85.5 3.58 1.36 5.07L2 22l5.06-1.33A9.94 9.94 0 0 0 12.02 22C17.54 22 22 17.52 22 12S17.54 2 12.02 2Zm0 18.1c-1.68 0-3.24-.5-4.55-1.35l-.33-.2-3 .79.8-2.92-.21-.3A8.08 8.08 0 0 1 3.9 12c0-4.48 3.65-8.1 8.12-8.1 4.47 0 8.1 3.62 8.1 8.1 0 4.48-3.63 8.1-8.1 8.1Zm4.44-6.06c-.24-.12-1.43-.7-1.65-.79-.22-.08-.38-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.5.11-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.8-.2-.48-.4-.42-.55-.42-.14 0-.3-.02-.46-.02-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.43-.58 1.63-1.15.2-.56.2-1.04.14-1.15-.06-.1-.22-.16-.46-.28Z"/></svg>`;
  document.body.appendChild(a);
}

function populateSettingsIntoDOM(settings) {
  document.querySelectorAll('[data-phone]').forEach(el => { el.textContent = settings.phone; el.href = `tel:${settings.phone.replace(/\s/g,'')}`; });
  document.querySelectorAll('[data-email]').forEach(el => { el.textContent = settings.email; el.href = `mailto:${settings.email}`; });
  document.querySelectorAll('[data-address]').forEach(el => el.textContent = settings.address);
  document.querySelectorAll('[data-social="tiktok"]').forEach(el => el.href = settings.socials.tiktok);
  document.querySelectorAll('[data-social="instagram"]').forEach(el => el.href = settings.socials.instagram);
  document.querySelectorAll('[data-social="facebook"]').forEach(el => el.href = settings.socials.facebook);
  document.querySelectorAll('[data-social="pinterest"]').forEach(el => el.href = settings.socials.pinterest);
  document.querySelectorAll('[data-map]').forEach(el => el.src = settings.mapEmbed);
}

function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2400);
}
