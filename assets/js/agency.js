(function () {
  const mainNav = document.getElementById('mainNav');
  if (!mainNav) return;

  const updateNavbarShrink = () => {
    if (window.scrollY === 0) {
      mainNav.classList.remove('navbar-shrink');
    } else {
      mainNav.classList.add('navbar-shrink');
    }
  };

  updateNavbarShrink();
  document.addEventListener('scroll', updateNavbarShrink);

  const navLinks = mainNav.querySelectorAll('.nav-link');
  const path = window.location.pathname.replace(/\/$/, '');
  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    const normalized = href.replace(/\/$/, '');
    if (normalized === '' && path === '') {
      link.classList.add('active');
    } else if (normalized !== '' && path.endsWith(normalized)) {
      link.classList.add('active');
    }
  });
})();

// Cart functionality
const CART_KEY = 'teesme-cart';

function getCart() {
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Unable to read cart', error);
    return [];
  }
}

function saveCart(cart) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.quantity += product.quantity;
  } else {
    cart.push(product);
  }
  saveCart(cart);
  renderCart();
}

function removeFromCart(id) {
  const cart = getCart().filter((item) => item.id !== id);
  saveCart(cart);
  renderCart();
}

function updateQuantity(id, quantity) {
  const cart = getCart();
  const item = cart.find((entry) => entry.id === id);
  if (!item) return;
  item.quantity = quantity;
  saveCart(cart);
  renderCart();
}

function renderCart() {
  const cartTableBody = document.querySelector('[data-cart-table-body]');
  const cartCount = document.querySelector('[data-cart-count]');
  const cartTotal = document.querySelector('[data-cart-total]');

  if (!cartTableBody) return;

  const cart = getCart();
  cartTableBody.innerHTML = '';

  let total = 0;
  cart.forEach((item) => {
    const line = item.price * item.quantity;
    total += line;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <strong>${item.name}</strong>
        <div class="small text-muted">${item.variant || ''}</div>
      </td>
      <td>$${item.price.toFixed(2)}</td>
      <td>
        <input type="number" min="1" class="form-control form-control-sm" value="${item.quantity}" data-cart-quantity="${item.id}" aria-label="Quantity for ${item.name}">
      </td>
      <td class="text-end">$${line.toFixed(2)}</td>
      <td class="text-end">
        <button class="btn btn-link text-danger p-0" data-cart-remove="${item.id}">Remove</button>
      </td>
    `;
    cartTableBody.appendChild(row);
  });

  if (cartCount) {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = count;
  }

  if (cartTotal) {
    cartTotal.textContent = `$${total.toFixed(2)}`;
  }

  document.querySelectorAll('[data-cart-remove]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const id = button.getAttribute('data-cart-remove');
      removeFromCart(id);
    });
  });

  document.querySelectorAll('[data-cart-quantity]').forEach((input) => {
    input.addEventListener('change', () => {
      const id = input.getAttribute('data-cart-quantity');
      const quantity = Math.max(1, parseInt(input.value, 10) || 1);
      updateQuantity(id, quantity);
    });
  });
}

document.querySelectorAll('[data-add-to-cart]').forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    const dataset = button.dataset;
    addToCart({
      id: dataset.productId,
      name: dataset.productName,
      variant: dataset.productVariant,
      price: parseFloat(dataset.productPrice || '0'),
      quantity: parseInt(dataset.productQuantity || '1', 10),
    });
  });
});

if (document.readyState !== 'loading') {
  renderCart();
} else {
  document.addEventListener('DOMContentLoaded', renderCart);
}

// Square checkout hand-off
document.querySelectorAll('[data-square-checkout]').forEach((button) => {
  button.addEventListener('click', async (event) => {
    event.preventDefault();
    const cart = getCart();
    if (cart.length === 0) {
      alert('Add items to the cart before checking out.');
      return;
    }

    button.disabled = true;
    button.classList.add('disabled');
    button.textContent = 'Redirecting…';

    try {
      const response = await axios.post(button.dataset.squareCheckout, { cart });
      if (response.data && response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      } else {
        throw new Error('Missing checkout URL');
      }
    } catch (error) {
      console.error(error);
      alert('We were unable to start the Square checkout. Please try again later.');
      button.disabled = false;
      button.classList.remove('disabled');
      button.textContent = 'Checkout with Square';
    }
  });
});
