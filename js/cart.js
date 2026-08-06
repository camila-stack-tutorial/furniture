(async function () {
  const settings = await WOODORA.getSettings();

  function render() {
    const cart = WOODORA.getCart();
    const el = document.getElementById('cartContainer');

    if (!cart.length) {
      el.innerHTML = `
        <div class="empty-cart">
          <h2>Your cart is empty</h2>
          <p>Browse the catalog and add something you love.</p>
          <a href="/shop.html" class="btn btn-primary">Go to shop</a>
        </div>`;
      return;
    }

    el.innerHTML = `
      <table class="cart-table">
        <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead>
        <tbody>
          ${cart.map(i => `
            <tr>
              <td>
                <div class="cart-item-info">
                  <img src="${i.image}" alt="${i.name}">
                  <span>${i.name}</span>
                </div>
              </td>
              <td>${WOODORA.money(i.price)}</td>
              <td>
                <div class="qty-control" style="width:110px">
                  <button data-minus="${i.id}" aria-label="Decrease">−</button>
                  <span>${i.qty}</span>
                  <button data-plus="${i.id}" aria-label="Increase">+</button>
                </div>
              </td>
              <td>${WOODORA.money(i.price * i.qty)}</td>
              <td><button class="cart-remove" data-remove="${i.id}">Remove</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="cart-summary">
        <div class="row"><span>Subtotal</span><span>${WOODORA.money(WOODORA.cartTotal())}</span></div>
        <div class="row" style="color:var(--ink-soft)"><span>Delivery</span><span>Confirmed on WhatsApp</span></div>
        <div class="row total"><span>Total</span><span>${WOODORA.money(WOODORA.cartTotal())}</span></div>
        <button class="btn btn-primary btn-block" id="checkoutBtn" style="margin-top:16px">Checkout on WhatsApp</button>
        <a href="/shop.html" style="display:block;text-align:center;margin-top:12px;font-size:.88rem;color:var(--ink-soft)">Continue shopping</a>
      </div>
    `;

    el.querySelectorAll('[data-plus]').forEach(b => b.addEventListener('click', () => {
      const item = WOODORA.getCart().find(i => i.id === b.dataset.plus);
      WOODORA.updateCartQty(b.dataset.plus, item.qty + 1);
      render();
    }));
    el.querySelectorAll('[data-minus]').forEach(b => b.addEventListener('click', () => {
      const item = WOODORA.getCart().find(i => i.id === b.dataset.minus);
      WOODORA.updateCartQty(b.dataset.minus, item.qty - 1);
      render();
    }));
    el.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => {
      WOODORA.removeFromCart(b.dataset.remove);
      render();
    }));
    document.getElementById('checkoutBtn')?.addEventListener('click', checkoutOnWhatsApp);
  }

  function checkoutOnWhatsApp() {
    const cart = WOODORA.getCart();
    if (!cart.length) return;
    const lines = cart.map((i, idx) => `${idx + 1}. ${i.name} — Qty ${i.qty} — ${WOODORA.money(i.price * i.qty)}`);
    const message = [
      'Hi Woodora! I would like to check out the following items:',
      '',
      ...lines,
      '',
      `Total: ${WOODORA.money(WOODORA.cartTotal())}`,
      '',
      'Please confirm availability and delivery details.'
    ].join('\n');
    window.open(`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
  }

  render();
})();
