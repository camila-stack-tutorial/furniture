(async function () {
  const PAGE_SIZE = 8;
  let all = await WOODORA.getProducts();
  const params = new URLSearchParams(location.search);

  const state = {
    categories: params.get('category') ? [params.get('category')] : [],
    colors: [],
    maxPrice: 1000,
    sort: 'default',
    page: 1,
    q: params.get('q') || ''
  };

  const categories = [...new Set(all.map(p => p.category))].sort();
  const colors = [...new Set(all.map(p => p.color))].sort();
  const highestPrice = Math.max(...all.map(p => p.price), 100);

  const colorHex = {
    Beige: '#D9C7A8', Rust: '#B65A34', Natural: '#DDCBAA', Charcoal: '#3B3833', Brown: '#6B4A32,',
    Walnut: '#5A3E2B', Black: '#1C1712', Sage: '#9CAA8C'
  };

  document.getElementById('categoryFilters').innerHTML = categories.map(c => `
    <label><input type="checkbox" value="${c}" class="cat-check" ${state.categories.includes(c) ? 'checked' : ''}> ${c}</label>
  `).join('');

  document.getElementById('colorFilters').innerHTML = colors.map(c => `
    <span class="swatch" data-color="${c}" title="${c}" style="background:${colorHex[c] || '#ccc'}"></span>
  `).join('');

  const priceRange = document.getElementById('priceRange');
  priceRange.max = Math.ceil(highestPrice / 50) * 50;
  priceRange.value = priceRange.max;
  state.maxPrice = Number(priceRange.value);
  document.getElementById('priceMax').textContent = WOODORA.money(priceRange.value);

  document.getElementById('categoryFilters').addEventListener('change', e => {
    state.categories = [...document.querySelectorAll('.cat-check:checked')].map(el => el.value);
    state.page = 1;
    render();
  });

  document.getElementById('colorFilters').addEventListener('click', e => {
    const sw = e.target.closest('.swatch');
    if (!sw) return;
    sw.classList.toggle('active');
    state.colors = [...document.querySelectorAll('.swatch.active')].map(el => el.dataset.color);
    state.page = 1;
    render();
  });

  priceRange.addEventListener('input', () => {
    state.maxPrice = Number(priceRange.value);
    document.getElementById('priceMax').textContent = WOODORA.money(priceRange.value);
    state.page = 1;
    render();
  });

  document.getElementById('sortSelect').addEventListener('change', e => {
    state.sort = e.target.value;
    render();
  });

  document.getElementById('clearFilters').addEventListener('click', () => {
    state.categories = []; state.colors = []; state.maxPrice = priceRange.max; state.q = '';
    priceRange.value = priceRange.max;
    document.getElementById('priceMax').textContent = WOODORA.money(priceRange.max);
    document.querySelectorAll('.cat-check').forEach(el => el.checked = false);
    document.querySelectorAll('.swatch').forEach(el => el.classList.remove('active'));
    state.page = 1;
    render();
  });

  function filtered() {
    return all.filter(p =>
      (!state.categories.length || state.categories.includes(p.category)) &&
      (!state.colors.length || state.colors.includes(p.color)) &&
      p.price <= state.maxPrice &&
      (!state.q || p.name.toLowerCase().includes(state.q.toLowerCase()) || p.category.toLowerCase().includes(state.q.toLowerCase()))
    );
  }

  function sorted(list) {
    const l = [...list];
    if (state.sort === 'price-asc') l.sort((a, b) => a.price - b.price);
    if (state.sort === 'price-desc') l.sort((a, b) => b.price - a.price);
    if (state.sort === 'name-asc') l.sort((a, b) => a.name.localeCompare(b.name));
    return l;
  }

  function cardHTML(p) {
    return `
    <div class="product-card">
      <a href="/product.html?id=${p.id}">
        <div class="product-thumb">
          <img src="${p.images[0]}" alt="${p.name}" loading="lazy">
          ${p.oldPrice ? '<span class="badge-sale">Sale</span>' : ''}
        </div>
      </a>
      <div class="product-info">
        <a href="/product.html?id=${p.id}"><h3>${p.name}</h3></a>
        <div class="product-meta">
          <span class="product-cat">${p.category}</span>
          <span><span class="price">${WOODORA.money(p.price)}</span>${p.oldPrice ? `<span class="price-old">${WOODORA.money(p.oldPrice)}</span>` : ''}</span>
        </div>
      </div>
      <button class="quick-add" aria-label="Add ${p.name} to cart" data-quickadd="${p.id}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6 5 2H2"/><circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></svg>
      </button>
    </div>`;
  }

  function render() {
    const list = sorted(filtered());
    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    state.page = Math.min(state.page, totalPages);
    const start = (state.page - 1) * PAGE_SIZE;
    const pageItems = list.slice(start, start + PAGE_SIZE);

    const grid = document.getElementById('shopGrid');
    grid.innerHTML = pageItems.map(cardHTML).join('');
    grid.querySelectorAll('[data-quickadd]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const p = all.find(x => x.id === btn.dataset.quickadd);
        WOODORA.addToCart(p);
        toast('Added to cart');
      });
    });

    document.getElementById('noResults').style.display = list.length ? 'none' : 'block';
    document.getElementById('resultsCount').textContent = `${list.length} product${list.length === 1 ? '' : 's'}`;

    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    const nav = document.getElementById('pagination');
    if (totalPages <= 1) { nav.innerHTML = ''; return; }
    let html = `<button ${state.page === 1 ? 'disabled' : ''} data-page="${state.page - 1}" aria-label="Previous page">‹</button>`;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - state.page) <= 1) pages.push(i);
      else if (pages[pages.length - 1] !== '…') pages.push('…');
    }
    pages.forEach(p => {
      if (p === '…') html += `<span class="dots">…</span>`;
      else html += `<button class="${p === state.page ? 'active' : ''}" data-page="${p}">${p}</button>`;
    });

    html += `<button ${state.page === totalPages ? 'disabled' : ''} data-page="${state.page + 1}" aria-label="Next page">›</button>`;
    nav.innerHTML = html;
    nav.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.page = Number(btn.dataset.page);
        render();
        window.scrollTo({ top: document.querySelector('.results-bar').offsetTop - 100, behavior: 'smooth' });
      });
    });
  }

  render();
})();
