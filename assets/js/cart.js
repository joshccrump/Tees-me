(function () {
  const STORAGE_KEY = 'teesme-cart';
  const TAX_RATE = 0.06; // Adjust per location
  const baseurl = window?.SITE_CONFIG?.baseurl || '';

  function relativeUrl(path) {
    const normalizedBase = baseurl.endsWith('/') ? baseurl.slice(0, -1) : baseurl;
    if (path.startsWith('/')) {
      return `${normalizedBase}${path}` || '/';
    }
    return `${normalizedBase}/${path}`;
  }

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (error) {
      console.warn('Unable to load cart from storage', error);
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function findItem(cart, id) {
    return cart.find((item) => item.id === id);
  }

  function addItem(product) {
    const cart = loadCart();
    const existing = findItem(cart, product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.image,
        quantity: 1
      });
    }
    saveCart(cart);
    renderCartCount();
    announce(`${product.name} added to cart`);
  }

  function updateQuantity(id, quantity) {
    const cart = loadCart();
    const item = findItem(cart, id);
    if (!item) return;
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    item.quantity = quantity;
    saveCart(cart);
    renderCart();
  }

  function removeItem(id) {
    let cart = loadCart();
    cart = cart.filter((item) => item.id !== id);
    saveCart(cart);
    renderCart();
  }

  function cartTotals(cart) {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2)
    };
  }

  function renderCartCount() {
    const cart = loadCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = totalItems;
    });
  }

  function renderCart() {
    renderCartCount();
    const container = document.querySelector('[data-cart-items]');
    if (!container) return;

    const cart = loadCart();
    container.innerHTML = '';

    if (!cart.length) {
      container.innerHTML = `<p class="empty-cart">Your cart is empty. Head to the <a href="${relativeUrl('/shop/')}">shop</a> to add products.</p>`;
      updateSummary(cart);
      return;
    }

    cart.forEach((item) => {
      const article = document.createElement('article');
      article.className = 'cart-item';
      article.innerHTML = `
        <div class="cart-item-media">
          <img src="${item.image}" alt="${item.name}">
        </div>
        <div class="cart-item-body">
          <h3>${item.name}</h3>
          <p>$${item.price.toFixed(2)}</p>
          <label class="quantity-label">Qty
            <input type="number" min="1" value="${item.quantity}" data-quantity-input="${item.id}">
          </label>
        </div>
        <button class="remove" data-remove-item="${item.id}" aria-label="Remove ${item.name} from cart">&times;</button>
      `;
      container.appendChild(article);
    });

    container.querySelectorAll('[data-quantity-input]').forEach((input) => {
      input.addEventListener('change', (event) => {
        const value = parseInt(event.target.value, 10);
        updateQuantity(event.target.getAttribute('data-quantity-input'), Number.isNaN(value) ? 1 : value);
      });
    });

    container.querySelectorAll('[data-remove-item]').forEach((button) => {
      button.addEventListener('click', (event) => {
        removeItem(event.target.getAttribute('data-remove-item'));
      });
    });

    updateSummary(cart);
  }

  function updateSummary(cart) {
    const summary = cartTotals(cart);
    const subtotal = document.querySelector('[data-cart-subtotal]');
    const tax = document.querySelector('[data-cart-tax]');
    const total = document.querySelector('[data-cart-total]');
    if (subtotal) subtotal.textContent = summary.subtotal;
    if (tax) tax.textContent = summary.tax;
    if (total) total.textContent = summary.total;
  }

  function announce(message) {
    const alert = document.querySelector('[data-cart-alert]');
    if (!alert) return;
    alert.hidden = false;
    alert.textContent = message;
    alert.classList.add('show');
    setTimeout(() => alert.classList.remove('show'), 2000);
  }

  async function handleCheckout() {
    const cart = loadCart();
    if (!cart.length) {
      announce('Add items to your cart before checking out.');
      return;
    }

    const endpoint = window?.SITE_CONFIG?.square?.vercel_endpoint;
    if (!endpoint) {
      announce('Square checkout is not configured yet.');
      return;
    }

    const button = document.querySelector('[data-checkout]');
    if (button) {
      button.disabled = true;
      button.textContent = 'Redirecting...';
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          locationId: window?.SITE_CONFIG?.square?.location_id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create Square checkout session');
      }

      const data = await response.json();
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('Square checkout URL missing');
      }
    } catch (error) {
      console.error(error);
      announce('Checkout failed. Confirm your Square + Vercel integration.');
      if (button) {
        button.disabled = false;
        button.textContent = 'Checkout with Square';
      }
    }
  }

  function initSquareCheckout() {
    const checkoutButton = document.querySelector('[data-checkout]');
    if (checkoutButton) {
      checkoutButton.addEventListener('click', handleCheckout);
    }
  }

  function initAddToCartButtons() {
    document.querySelectorAll('[data-add-to-cart]').forEach((button) => {
      button.addEventListener('click', (event) => {
        const product = event.currentTarget.getAttribute('data-product');
        if (!product) return;
        addItem(JSON.parse(product));
      });
    });
  }

  function initScrollReveal() {
    if (!window.ScrollReveal) return;
    window.ScrollReveal().reveal('[data-sr]', {
      distance: '40px',
      duration: 600,
      easing: 'ease-out',
      origin: 'bottom',
      interval: 120
    });
  }

  function initNavigationToggle() {
    const toggle = document.getElementById('nav-toggle');
    if (!toggle) return;
    const label = document.querySelector('label[for="nav-toggle"]');

    function syncState() {
      const expanded = Boolean(toggle.checked);
      toggle.setAttribute('aria-expanded', expanded);
      if (label) {
        label.setAttribute('aria-expanded', expanded);
      }
    }

    toggle.addEventListener('change', syncState);
    syncState();

    document.querySelectorAll('.site-nav a').forEach((link) => {
      link.addEventListener('click', () => {
        if (toggle.checked) {
          toggle.checked = false;
          syncState();
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderCartCount();
    renderCart();
    initAddToCartButtons();
    initSquareCheckout();
    initScrollReveal();
    initNavigationToggle();
  });
})();
