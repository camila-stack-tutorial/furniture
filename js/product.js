(async function () {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const all = await WOODORA.getProducts();
  const product = all.find(p => p.id === id) || all[0];
  if (!product) return;

  document.title = `${product.name} — Woodora`;
  document.getElementById('crumbName').textContent = product.name;

  let activeImg = 0;
  let qty = 1;

  function render() {
    const view = document.getElementById('productView');
    view.innerHTML = `
      <div>
        <div class="carousel-main">
          <img id="mainImg" src="${product.images[activeImg]}" alt="${product.name} view ${activeImg + 1}">
          ${product.images.length > 1 ? `
          <button class="carousel-arrow prev" aria-label="Previous image" id="prevImg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button class="carousel-arrow next" aria-label="Next image" id="nextImg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>` : ''}
        </div>
        ${product.images.length > 1 ? `
        <div class="carousel-thumbs" id="thumbRow">
          ${product.images.map((img, i) => `<img src="${img}" class="${i === activeImg ? 'active' : ''}" data-i="${i}" alt="Thumbnail ${i + 1}">`).join('')}
        </div>` : ''}
      </div>
      <div>
        <span class="pv-cat">${product.category}</span>
        <h1 class="pv-title">${product.name}</h1>
        <div class="pv-price">${WOODORA.money(product.price)} ${product.oldPrice ? `<span class="price-old">${WOODORA.money(product.oldPrice)}</span>` : ''}</div>
        <p class="pv-desc">${product.description}</p>
        <div>
          <strong style="font-size:.85rem">Color: ${product.color}</strong>
          <div class="color-swatch-row"><span class="swatch active" style="background:#c9a876;width:24px;height:24px"></span></div>
        </div>
        <div class="qty-row">
          <div class="qty-control">
            <button id="qtyMinus" aria-label="Decrease quantity">−</button>
            <span id="qtyVal">${qty}</span>
            <button id="qtyPlus" aria-label="Increase quantity">+</button>
          </div>
          <button class="btn btn-primary" id="addToCartBtn">Add to cart</button>
          <a class="btn btn-outline" id="buyOnWhatsapp" href="#" target="_blank" rel="noopener">Ask on WhatsApp</a>
        </div>
        <div class="pv-details">
          <h3 style="font-size:1.1rem">Product details</h3>
          <ul>${product.details.map(d => `<li><span>${d}</span></li>`).join('')}</ul>
        </div>
      </div>
    `;

    if (product.images.length > 1) {
      document.getElementById('prevImg').addEventListener('click', () => { activeImg = (activeImg - 1 + product.images.length) % product.images.length; render(); });
      document.getElementById('nextImg').addEventListener('click', () => { activeImg = (activeImg + 1) % product.images.length; render(); });
      document.getElementById('thumbRow').addEventListener('click', e => {
        const t = e.target.closest('img[data-i]');
        if (t) { activeImg = Number(t.dataset.i); render(); }
      });
    }

    document.getElementById('qtyMinus').addEventListener('click', () => { qty = Math.max(1, qty - 1); document.getElementById('qtyVal').textContent = qty; });
    document.getElementById('qtyPlus').addEventListener('click', () => { qty += 1; document.getElementById('qtyVal').textContent = qty; });
    document.getElementById('addToCartBtn').addEventListener('click', () => {
      WOODORA.addToCart(product, qty);
      toast(`Added ${qty} × ${product.name} to cart`);
    });

    WOODORA.getSettings().then(settings => {
      const msg = `Hi Woodora! I'd like to ask about the ${product.name} (${WOODORA.money(product.price)}).`;
      document.getElementById('buyOnWhatsapp').href = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    });
  }
  render();

  // Related products
  const related = all.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
  document.getElementById('relatedGrid').innerHTML = (related.length ? related : all.filter(p => p.id !== product.id).slice(0, 4)).map(p => `
    <div class="product-card">
      <a href="/product.html?id=${p.id}">
        <div class="product-thumb"><img src="${p.images[0]}" alt="${p.name}" loading="lazy"></div>
      </a>
      <div class="product-info">
        <a href="/product.html?id=${p.id}"><h3>${p.name}</h3></a>
        <div class="product-meta">
          <span class="product-cat">${p.category}</span>
          <span class="price">${WOODORA.money(p.price)}</span>
        </div>
      </div>
    </div>
  `).join('');
})();
