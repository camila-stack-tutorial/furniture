/* ============ Woodora data layer ============
   Tries the Netlify Function (real, shared, persisted backend) first.
   Falls back to the bundled JSON + a per-browser localStorage override
   so the whole site still works while previewing locally or before
   the Netlify Function / auth pieces are wired up (see README). */

const WOODORA = (() => {
  const LS_PRODUCTS = 'woodora_products_override';
  const LS_SETTINGS = 'woodora_settings_override';
  const LS_CART = 'woodora_cart';

  async function getProducts() {
    try {
      const res = await fetch('/.netlify/functions/products');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length) return data;
      }
    } catch (e) { /* function not deployed yet — fall through */ }

    const override = localStorage.getItem(LS_PRODUCTS);
    if (override) {
      try { return JSON.parse(override); } catch (e) {}
    }
    const res = await fetch(resolvePath('data/products.json'));
    return res.json();
  }

  async function saveProducts(products) {
    try {
      const token = await getSessionToken();
      const res = await fetch('/.netlify/functions/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(products)
      });
      if (res.ok) return { ok: true, mode: 'server' };
    } catch (e) { /* fall through to local demo mode */ }
    localStorage.setItem(LS_PRODUCTS, JSON.stringify(products));
    return { ok: true, mode: 'local' };
  }

  async function getSettings() {
    try {
      const res = await fetch('/.netlify/functions/settings');
      if (res.ok) return res.json();
    } catch (e) {}
    const override = localStorage.getItem(LS_SETTINGS);
    if (override) {
      try { return JSON.parse(override); } catch (e) {}
    }
    const res = await fetch(resolvePath('data/settings.json'));
    return res.json();
  }

  async function saveSettings(settings) {
    try {
      const token = await getSessionToken();
      const res = await fetch('/.netlify/functions/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(settings)
      });
      if (res.ok) return { ok: true, mode: 'server' };
    } catch (e) {}
    localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
    return { ok: true, mode: 'local' };
  }

  async function getSessionToken() {
    return localStorage.getItem('woodora_token');
  }

  // resolves data/ paths correctly whether page is at root or /admin/ etc.
  function resolvePath(p) {
    const depth = location.pathname.split('/').filter(Boolean);
    const inSubfolder = depth.length && !depth[depth.length - 1].includes('.') ? false : false;
    return '/' + p; // site is flat, root-relative works from any page
  }

  // ---------- Cart ----------
  function getCart() {
    try { return JSON.parse(localStorage.getItem(LS_CART)) || []; } catch (e) { return []; }
  }
  function saveCart(cart) {
    localStorage.setItem(LS_CART, JSON.stringify(cart));
    updateCartBadge();
  }
  function addToCart(product, qty = 1) {
    const cart = getCart();
    const existing = cart.find(i => i.id === product.id);
    if (existing) existing.qty += qty;
    else cart.push({ id: product.id, name: product.name, price: product.price, image: product.images[0], qty });
    saveCart(cart);
  }
  function updateCartQty(id, qty) {
    let cart = getCart();
    cart = cart.map(i => i.id === id ? { ...i, qty: Math.max(1, qty) } : i);
    saveCart(cart);
  }
  function removeFromCart(id) {
    saveCart(getCart().filter(i => i.id !== id));
  }
  function cartTotal() {
    return getCart().reduce((s, i) => s + i.price * i.qty, 0);
  }
  function cartCount() {
    return getCart().reduce((s, i) => s + i.qty, 0);
  }
  function updateCartBadge() {
    document.querySelectorAll('[data-cart-count]').forEach(el => el.textContent = cartCount());
  }

  function money(n) {
    return '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 0 });
  }

  return {
    getProducts, saveProducts, getSettings, saveSettings,
    getCart, saveCart, addToCart, updateCartQty, removeFromCart,
    cartTotal, cartCount, updateCartBadge, money
  };
})();
