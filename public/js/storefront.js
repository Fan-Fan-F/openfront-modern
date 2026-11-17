// State
let products = [];
let categories = [];
let currencies = [];
let currentCurrency = localStorage.getItem('of_currency') || 'USD';
let cart = JSON.parse(localStorage.getItem('of_cart') || '[]');
let activeCategory = '';
let searchQuery = '';

// DOM Elements
const productsGrid = document.getElementById('products-grid');
const categoriesContainer = document.getElementById('categories-container');
const currencySelect = document.getElementById('currency-select');
const searchInput = document.getElementById('search-input');
const cartCount = document.getElementById('cart-count');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartShipping = document.getElementById('cart-shipping');
const cartTotal = document.getElementById('cart-total');
const openCheckoutBtn = document.getElementById('open-checkout-btn');
const checkoutOverlay = document.getElementById('checkout-overlay');
const checkoutForm = document.getElementById('checkout-form');
const checkoutAmountDisplay = document.getElementById('checkout-amount-display');
const payMethodSelect = document.getElementById('pay-method');
const cardInputGroup = document.getElementById('card-input-group');
const checkoutError = document.getElementById('checkout-error');
const receiptOverlay = document.getElementById('receipt-overlay');
const receiptDetails = document.getElementById('receipt-details');

// Initialize
async function init() {
  currencySelect.value = currentCurrency;

  await Promise.all([
    fetchCurrencies(),
    fetchCategories(),
    fetchProducts()
  ]);

  setupEventListeners();
  updateCartUI();
}

// Fetch APIs
async function fetchCurrencies() {
  try {
    const res = await fetch('/api/currencies');
    const json = await res.json();
    if (json.success) {
      currencies = json.data;
    }
  } catch (err) {
    console.error('Failed to load currencies', err);
  }
}

async function fetchCategories() {
  try {
    const res = await fetch('/api/categories');
    const json = await res.json();
    if (json.success) {
      categories = json.data;
      renderCategories();
    }
  } catch (err) {
    console.error('Failed to load categories', err);
  }
}

async function fetchProducts() {
  try {
    let url = '/api/products?';
    if (activeCategory) url += `category=${encodeURIComponent(activeCategory)}&`;
    if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

    const res = await fetch(url);
    const json = await res.json();
    if (json.success) {
      products = json.data;
      renderProducts();
    }
  } catch (err) {
    console.error('Failed to load products', err);
  }
}

// Currency calculation helpers
function getCurrencyMeta() {
  return currencies.find(c => c.code === currentCurrency) || { code: 'USD', symbol: '$', rate: 1.0 };
}

function formatMoney(amountUSD) {
  const meta = getCurrencyMeta();
  const converted = amountUSD * meta.rate;
  if (meta.code === 'JPY') {
    return `${meta.symbol}${Math.round(converted).toLocaleString()}`;
  }
  return `${meta.symbol}${converted.toFixed(2)}`;
}

// Render Products
function renderProducts() {
  if (products.length === 0) {
    productsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
        <h3>No products found</h3>
        <p>Try clearing your search query or choosing another category.</p>
      </div>
    `;
    return;
  }

  productsGrid.innerHTML = products.map(p => {
    const inStock = p.inventory > 0;
    return `
      <div class="product-card">
        <img src="${p.imageUrl}" alt="${p.title}" class="product-image" loading="lazy">
        <div class="product-info">
          <div class="product-category">${p.categoryName}</div>
          <h3 class="product-title">${p.title}</h3>
          <p class="product-desc">${p.description}</p>
          <div class="product-footer">
            <div>
              <div class="product-price">${formatMoney(p.price)}</div>
              <small style="font-size: 0.75rem; color: ${inStock ? 'var(--text-muted)' : 'var(--danger)'}">
                ${inStock ? `${p.inventory} in stock` : 'Out of Stock'}
              </small>
            </div>
            <button class="add-cart-btn" onclick="addToCart('${p.id}')" ${!inStock ? 'disabled' : ''}>
              ${inStock ? 'Add to Cart' : 'Sold Out'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Render Categories
function renderCategories() {
  const allBtn = `<button class="category-tab ${activeCategory === '' ? 'active' : ''}" data-category="">All Items</button>`;
  const tabs = categories.map(c => `
    <button class="category-tab ${activeCategory === c.slug ? 'active' : ''}" data-category="${c.slug}">${c.name}</button>
  `).join('');
  categoriesContainer.innerHTML = allBtn + tabs;
}

// Cart Operations
window.addToCart = function(productId) {
  const prod = products.find(p => p.id === productId);
  if (!prod || prod.inventory <= 0) return;

  const existing = cart.find(item => item.productId === productId);
  if (existing) {
    if (existing.quantity < prod.inventory) {
      existing.quantity += 1;
    } else {
      alert(`Only ${prod.inventory} units available in stock.`);
      return;
    }
  } else {
    cart.push({ productId, quantity: 1 });
  }

  saveCart();
  updateCartUI();
  openCartDrawer();
};

function updateCartQty(productId, delta) {
  const item = cart.find(i => i.productId === productId);
  if (!item) return;

  const prod = products.find(p => p.id === productId);
  const maxStock = prod ? prod.inventory : 99;

  item.quantity += delta;
  if (item.quantity > maxStock) {
    item.quantity = maxStock;
    alert(`Maximum available stock reached (${maxStock})`);
  }

  if (item.quantity <= 0) {
    cart = cart.filter(i => i.productId !== productId);
  }

  saveCart();
  updateCartUI();
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.productId !== productId);
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('of_cart', JSON.stringify(cart));
}

function getCartCalculation() {
  let subtotalUSD = 0;
  let totalCount = 0;

  for (const item of cart) {
    const prod = products.find(p => p.id === item.productId);
    if (prod) {
      subtotalUSD += prod.price * item.quantity;
      totalCount += item.quantity;
    }
  }

  const shippingUSD = totalCount > 0 ? 15.0 : 0;
  const meta = getCurrencyMeta();
  const subtotal = subtotalUSD * meta.rate;
  const shipping = shippingUSD * meta.rate;
  const tax = subtotal * 0.05;
  const total = subtotal + shipping + tax;

  return { totalCount, subtotalUSD, subtotal, shipping, tax, total };
}

function updateCartUI() {
  const { totalCount, subtotal, shipping, total } = getCartCalculation();
  cartCount.textContent = totalCount;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <p style="font-size: 2rem;">🛍️</p>
        <p style="margin-top: 0.5rem;">Your cart is empty</p>
      </div>
    `;
    cartSubtotal.textContent = formatMoney(0);
    cartShipping.textContent = formatMoney(0);
    cartTotal.textContent = formatMoney(0);
    openCheckoutBtn.disabled = true;
    return;
  }

  openCheckoutBtn.disabled = false;
  cartSubtotal.textContent = formatCalculated(subtotal);
  cartShipping.textContent = formatCalculated(shipping);
  cartTotal.textContent = formatCalculated(total);

  cartItemsContainer.innerHTML = cart.map(item => {
    const prod = products.find(p => p.id === item.productId);
    if (!prod) return '';

    return `
      <div class="cart-item">
        <img src="${prod.imageUrl}" alt="${prod.title}" class="cart-item-img">
        <div class="cart-item-details">
          <div class="cart-item-title">${prod.title}</div>
          <div class="cart-item-price">${formatMoney(prod.price)} each</div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="updateCartQty('${item.productId}', -1)">-</button>
            <span style="font-weight: 600; min-width: 20px; text-align: center;">${item.quantity}</span>
            <button class="qty-btn" onclick="updateCartQty('${item.productId}', 1)">+</button>
            <button class="remove-item-btn" onclick="removeFromCart('${item.productId}')">Remove</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function formatCalculated(amount) {
  const meta = getCurrencyMeta();
  if (meta.code === 'JPY') {
    return `${meta.symbol}${Math.round(amount).toLocaleString()}`;
  }
  return `${meta.symbol}${amount.toFixed(2)}`;
}

// Drawer & Modal Triggers
function openCartDrawer() {
  cartOverlay.classList.add('open');
}

function closeCartDrawer() {
  cartOverlay.classList.remove('open');
}

function openCheckout() {
  closeCartDrawer();
  const { total } = getCartCalculation();
  checkoutAmountDisplay.textContent = formatCalculated(total);
  checkoutError.style.display = 'none';
  checkoutOverlay.classList.add('open');
}

function closeCheckout() {
  checkoutOverlay.classList.remove('open');
}

function closeReceipt() {
  receiptOverlay.classList.remove('open');
}

// Event Listeners
function setupEventListeners() {
  // Currency switcher
  currencySelect.addEventListener('change', (e) => {
    currentCurrency = e.target.value;
    localStorage.setItem('of_currency', currentCurrency);
    renderProducts();
    updateCartUI();
  });

  // Cart button
  document.getElementById('cart-toggle-btn').addEventListener('click', openCartDrawer);
  document.getElementById('close-cart-btn').addEventListener('click', closeCartDrawer);
  cartOverlay.addEventListener('click', (e) => {
    if (e.target === cartOverlay) closeCartDrawer();
  });

  // Categories filter
  categoriesContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('category-tab')) {
      activeCategory = e.target.getAttribute('data-category');
      renderCategories();
      fetchProducts();
    }
  });

  // Search input
  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = e.target.value;
      fetchProducts();
    }, 250);
  });

  // Checkout trigger
  openCheckoutBtn.addEventListener('click', openCheckout);
  document.getElementById('close-checkout-btn').addEventListener('click', closeCheckout);
  checkoutOverlay.addEventListener('click', (e) => {
    if (e.target === checkoutOverlay) closeCheckout();
  });

  // Payment method toggle
  payMethodSelect.addEventListener('change', (e) => {
    if (e.target.value === 'mock_cod') {
      cardInputGroup.style.display = 'none';
    } else {
      cardInputGroup.style.display = 'block';
    }
  });

  // Submit Checkout Form
  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-order-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing Payment...';
    checkoutError.style.display = 'none';

    const payload = {
      items: cart,
      currency: currentCurrency,
      shippingAddress: {
        fullName: document.getElementById('cust-name').value,
        email: document.getElementById('cust-email').value,
        street: document.getElementById('cust-street').value,
        city: document.getElementById('cust-city').value,
        postalCode: document.getElementById('cust-postal').value,
        country: document.getElementById('cust-country').value
      },
      paymentMethod: payMethodSelect.value,
      cardNumber: document.getElementById('cust-card').value
    };

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Payment failed');
      }

      const order = json.data;
      // Success! Clear cart
      cart = [];
      saveCart();
      updateCartUI();
      closeCheckout();

      // Show receipt
      showOrderReceipt(order);
    } catch (err) {
      checkoutError.textContent = `❌ ${err.message}`;
      checkoutError.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Pay & Place Order';
    }
  });

  // Receipt modal close
  document.getElementById('close-receipt-btn').addEventListener('click', closeReceipt);
  document.getElementById('receipt-ok-btn').addEventListener('click', closeReceipt);
}

function showOrderReceipt(order) {
  receiptDetails.innerHTML = `
    <div style="text-align: center; margin-bottom: 1.5rem;">
      <h3 style="font-size: 1.25rem; font-weight: 800;">Order #${order.orderNumber}</h3>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">Date: ${new Date(order.createdAt).toLocaleString()}</p>
      <div style="margin-top: 0.5rem;">
        <span class="status-pill status-${order.status}">${order.status}</span>
      </div>
    </div>

    <div style="border-top: 1px solid var(--border); padding: 1rem 0;">
      <h4 style="font-size: 0.9rem; margin-bottom: 0.5rem;">Purchased Items:</h4>
      ${order.items.map(item => `
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.35rem;">
          <span>${item.title} x ${item.quantity}</span>
          <span style="font-weight: 600;">${order.currency} ${item.totalCharged.toFixed(2)}</span>
        </div>
      `).join('')}
    </div>

    <div style="border-top: 1px solid var(--border); padding-top: 0.75rem; font-size: 0.85rem;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
        <span>Subtotal</span>
        <span>${order.currency} ${order.subtotal.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
        <span>Shipping & Tax</span>
        <span>${order.currency} ${(order.shippingFee + order.tax).toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1rem; margin-top: 0.5rem; color: var(--primary);">
        <span>Total Paid</span>
        <span>${order.currency} ${order.total.toFixed(2)}</span>
      </div>
    </div>

    <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius); padding: 0.75rem; margin-top: 1rem; font-size: 0.8rem;">
      <div><strong>Shipping to:</strong> ${order.shippingAddress.fullName}, ${order.shippingAddress.street}, ${order.shippingAddress.city}</div>
      <div style="margin-top: 0.25rem;"><strong>Payment Ref:</strong> ${order.payment.transactionId} (${order.payment.method})</div>
    </div>
  `;

  receiptOverlay.classList.add('open');
}

// Start application
init();
