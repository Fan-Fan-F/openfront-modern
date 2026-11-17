// Admin Dashboard State
let stats = {};
let orders = [];
let products = [];
let currencies = [];
let categories = [];

// DOM Elements
const statRevenue = document.getElementById('stat-revenue');
const statOrders = document.getElementById('stat-orders');
const statPaid = document.getElementById('stat-paid');
const statProducts = document.getElementById('stat-products');
const statLowStock = document.getElementById('stat-low-stock');
const ordersTableBody = document.getElementById('orders-table-body');
const productsTableBody = document.getElementById('products-table-body');
const currenciesTableBody = document.getElementById('currencies-table-body');
const prodModalOverlay = document.getElementById('product-modal-overlay');
const productForm = document.getElementById('product-form');
const prodModalTitle = document.getElementById('product-modal-title');
const prodFormCategory = document.getElementById('prod-form-category');

// Init
async function initAdmin() {
  setupTabs();
  setupEventListeners();
  await refreshAll();
}

async function refreshAll() {
  await Promise.all([
    fetchStats(),
    fetchOrders(),
    fetchProducts(),
    fetchCurrencies(),
    fetchCategories()
  ]);
}

// Fetch APIs
async function fetchStats() {
  try {
    const res = await fetch('/api/admin/stats');
    const json = await res.json();
    if (json.success) {
      stats = json.data;
      statRevenue.textContent = `$${stats.totalRevenueUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      statOrders.textContent = stats.totalOrders;
      statPaid.textContent = stats.paidOrders;
      statProducts.textContent = stats.totalProducts;
      statLowStock.textContent = stats.lowStockProducts;
    }
  } catch (err) {
    console.error('Failed to fetch stats', err);
  }
}

async function fetchOrders() {
  try {
    const res = await fetch('/api/admin/orders');
    const json = await res.json();
    if (json.success) {
      orders = json.data;
      renderOrders();
    }
  } catch (err) {
    console.error('Failed to fetch orders', err);
  }
}

async function fetchProducts() {
  try {
    const res = await fetch('/api/products');
    const json = await res.json();
    if (json.success) {
      products = json.data;
      renderProducts();
    }
  } catch (err) {
    console.error('Failed to fetch products', err);
  }
}

async function fetchCurrencies() {
  try {
    const res = await fetch('/api/currencies');
    const json = await res.json();
    if (json.success) {
      currencies = json.data;
      renderCurrencies();
    }
  } catch (err) {
    console.error('Failed to fetch currencies', err);
  }
}

async function fetchCategories() {
  try {
    const res = await fetch('/api/categories');
    const json = await res.json();
    if (json.success) {
      categories = json.data;
      prodFormCategory.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
  } catch (err) {
    console.error('Failed to fetch categories', err);
  }
}

// Render Orders
function renderOrders() {
  if (orders.length === 0) {
    ordersTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">No orders recorded yet.</td></tr>`;
    return;
  }

  ordersTableBody.innerHTML = orders.map(o => `
    <tr>
      <td><strong>${o.orderNumber}</strong></td>
      <td style="color: var(--text-muted); font-size: 0.8rem;">${new Date(o.createdAt).toLocaleDateString()}</td>
      <td>
        <div>${o.shippingAddress.fullName}</div>
        <small style="color: var(--text-muted);">${o.shippingAddress.email}</small>
      </td>
      <td>${o.items.map(i => `${i.title} (${i.quantity})`).join(', ')}</td>
      <td><strong>${o.currency} ${o.total.toFixed(2)}</strong></td>
      <td>
        <span class="status-pill status-${o.payment.status}">${o.payment.status}</span>
        <br><small style="color: var(--text-muted);">${o.payment.method}</small>
      </td>
      <td>
        <span class="status-pill status-${o.status}">${o.status}</span>
      </td>
      <td>
        <select onchange="updateOrderStatus('${o.id}', this.value)" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; border-radius: 4px; border: 1px solid var(--border);">
          <option value="">Change Status...</option>
          <option value="paid" ${o.status === 'paid' ? 'disabled' : ''}>Mark Paid</option>
          <option value="processing" ${o.status === 'processing' ? 'disabled' : ''}>Mark Processing</option>
          <option value="shipped" ${o.status === 'shipped' ? 'disabled' : ''}>Mark Shipped</option>
          <option value="completed" ${o.status === 'completed' ? 'disabled' : ''}>Mark Completed</option>
          <option value="refunded" ${o.status === 'refunded' ? 'disabled' : ''}>Refund</option>
          <option value="cancelled" ${o.status === 'cancelled' ? 'disabled' : ''}>Cancel</option>
        </select>
      </td>
    </tr>
  `).join('');
}

// Render Products
function renderProducts() {
  if (products.length === 0) {
    productsTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No products found in catalog.</td></tr>`;
    return;
  }

  productsTableBody.innerHTML = products.map(p => `
    <tr>
      <td><code>${p.sku}</code></td>
      <td>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <img src="${p.imageUrl}" alt="" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;">
          <div>
            <strong>${p.title}</strong>
          </div>
        </div>
      </td>
      <td>${p.categoryName}</td>
      <td>$${p.price.toFixed(2)}</td>
      <td>
        <strong style="color: ${p.inventory <= 10 ? 'var(--warning)' : 'inherit'};">
          ${p.inventory}
        </strong>
      </td>
      <td>
        <button class="btn-sm" onclick="editProduct('${p.id}')">Edit</button>
        <button class="btn-sm" style="color: var(--danger); border-color: #fca5a5;" onclick="deleteProduct('${p.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

// Render Currencies
function renderCurrencies() {
  currenciesTableBody.innerHTML = currencies.map(c => `
    <tr>
      <td><strong>${c.name} (${c.code})</strong></td>
      <td><span style="font-size: 1.1rem; font-weight: bold;">${c.symbol}</span></td>
      <td>
        ${c.isBase ? '<strong>1.00 (Base)</strong>' : `
          <input type="number" step="0.01" id="rate-input-${c.code}" value="${c.rate}" style="width: 100px; padding: 0.3rem 0.5rem; border: 1px solid var(--border); border-radius: 4px;">
        `}
      </td>
      <td>
        ${c.isBase ? '<span style="color: var(--text-muted); font-size: 0.8rem;">Fixed Base</span>' : `
          <button class="btn-sm btn-sm-primary" onclick="saveRate('${c.code}')">Save Rate</button>
        `}
      </td>
    </tr>
  `).join('');
}

// Actions
window.updateOrderStatus = async function(orderId, status) {
  if (!status) return;
  try {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    await refreshAll();
  } catch (err) {
    alert(`Error updating status: ${err.message}`);
  }
};

window.saveRate = async function(code) {
  const input = document.getElementById(`rate-input-${code}`);
  const rate = parseFloat(input.value);
  if (isNaN(rate) || rate <= 0) {
    alert('Please enter a valid rate greater than 0');
    return;
  }

  try {
    const res = await fetch('/api/currencies', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, rate })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    alert(`Currency ${code} rate updated to ${rate}`);
    await fetchCurrencies();
  } catch (err) {
    alert(`Error saving rate: ${err.message}`);
  }
};

window.editProduct = function(productId) {
  const prod = products.find(p => p.id === productId);
  if (!prod) return;

  document.getElementById('prod-form-id').value = prod.id;
  document.getElementById('prod-form-title').value = prod.title;
  document.getElementById('prod-form-sku').value = prod.sku;
  document.getElementById('prod-form-category').value = prod.categoryId;
  document.getElementById('prod-form-price').value = prod.price;
  document.getElementById('prod-form-stock').value = prod.inventory;
  document.getElementById('prod-form-image').value = prod.imageUrl;
  document.getElementById('prod-form-desc').value = prod.description;

  prodModalTitle.textContent = 'Edit Product';
  prodModalOverlay.classList.add('open');
};

window.deleteProduct = async function(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  try {
    const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    await refreshAll();
  } catch (err) {
    alert(`Error deleting product: ${err.message}`);
  }
};

function setupTabs() {
  const tabButtons = document.querySelectorAll('.admin-nav-item');
  const sections = document.querySelectorAll('.admin-section');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      btn.classList.add('active');
      const tabId = `tab-${btn.getAttribute('data-tab')}`;
      const targetSection = document.getElementById(tabId);
      if (targetSection) targetSection.classList.add('active');
    });
  });
}

function setupEventListeners() {
  document.getElementById('refresh-btn').addEventListener('click', refreshAll);

  document.getElementById('reset-db-btn').addEventListener('click', async () => {
    if (!confirm('Reset all catalog, currency, and orders back to initial seed data?')) return;
    try {
      const res = await fetch('/api/admin/reset', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        alert('Database reset successfully');
        await refreshAll();
      }
    } catch (err) {
      alert(`Reset failed: ${err.message}`);
    }
  });

  document.getElementById('add-product-btn').addEventListener('click', () => {
    productForm.reset();
    document.getElementById('prod-form-id').value = '';
    prodModalTitle.textContent = 'Add New Product';
    prodModalOverlay.classList.add('open');
  });

  document.getElementById('close-prod-modal-btn').addEventListener('click', () => {
    prodModalOverlay.classList.remove('open');
  });

  prodModalOverlay.addEventListener('click', (e) => {
    if (e.target === prodModalOverlay) prodModalOverlay.classList.remove('open');
  });

  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prod-form-id').value;
    const payload = {
      title: document.getElementById('prod-form-title').value,
      sku: document.getElementById('prod-form-sku').value,
      categoryId: document.getElementById('prod-form-category').value,
      price: parseFloat(document.getElementById('prod-form-price').value),
      inventory: parseInt(document.getElementById('prod-form-stock').value, 10),
      imageUrl: document.getElementById('prod-form-image').value,
      description: document.getElementById('prod-form-desc').value
    };

    try {
      const url = id ? `/api/products/${id}` : '/api/products';
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      prodModalOverlay.classList.remove('open');
      await refreshAll();
    } catch (err) {
      alert(`Failed to save product: ${err.message}`);
    }
  });
}

// Start
initAdmin();
