import { createClient } from '@supabase/supabase-js';
import './styles.css';

const root = document.querySelector('#app');
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

const state = {
  loading: true,
  error: '',
  step: 'intro',
  table: null,
  storeName: 'Cardapio Digital',
  logoEmoji: '🥟',
  logoUrl: null,
  products: [],
  categories: [],
  cart: [],
  customerName: '',
  customerPhone: '',
  sending: false,
  statusMessage: 'Aguardando preenchimento do cliente.',
  supabase: null,
};

function phoneDigits(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 11);
}

function formatPhone(value) {
  const digits = phoneDigits(value);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function money(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function readRoute() {
  const fromQuery = new URLSearchParams(window.location.search).get('path');
  const path = (fromQuery || window.location.pathname).trim();
  const parts = path.split('/').filter(Boolean);
  const mesaIndex = parts.indexOf('mesa');

  if (mesaIndex === -1 || parts.length < mesaIndex + 3) return null;

  const tableId = Number(parts[mesaIndex + 1]);
  const tableCode = parts[mesaIndex + 2];
  if (!Number.isInteger(tableId) || !tableCode) return null;

  return { tableId, tableCode };
}

function cartKey(productId, complements = []) {
  return `${productId}:${complements.map((item) => item.id).sort().join(',')}`;
}

function cartCount() {
  return state.cart.reduce((sum, item) => sum + item.quantity, 0);
}

function cartTotal() {
  return state.cart.reduce((sum, item) => {
    const compTotal = item.complements.reduce((acc, comp) => acc + Number(comp.price), 0);
    return sum + (Number(item.product.price) + compTotal) * item.quantity;
  }, 0);
}

function getClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY na Vercel.');
  }

  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function render() {
  if (!root) return;

  if (state.loading) {
    root.innerHTML = `
      <main class="shell">
        <section class="page">
          <div class="loading card">
            <strong>Carregando cardápio...</strong>
            <p class="muted">Estamos validando a mesa e buscando os produtos.</p>
          </div>
        </section>
      </main>
    `;
    bindActions();
    return;
  }

  if (state.error) {
    root.innerHTML = `
      <main class="shell">
        <section class="page">
          <div class="error card">
            <strong>Não foi possível abrir a mesa</strong>
            <p class="muted">${escapeHtml(state.error)}</p>
          </div>
        </section>
      </main>
    `;
    bindActions();
    return;
  }

  if (state.step === 'sent') {
    root.innerHTML = `
      <main class="shell">
        <section class="page">
          <div class="sent card">
            <strong>Pedido enviado!</strong>
            <p class="muted">Obrigado, ${escapeHtml(state.customerName)}. O pedido foi registrado.</p>
            <div style="margin-top: 16px;">
              <button class="primary-button" data-action="new-order" type="button">Fazer outro pedido</button>
            </div>
          </div>
        </section>
      </main>
    `;
    bindActions();
    return;
  }

  if (state.step === 'cart') {
    const items = state.cart
      .map((item) => {
        const compTotal = item.complements.reduce((sum, comp) => sum + Number(comp.price), 0);
        return `
          <article class="cart-item">
            <div class="cart-image">
              ${item.product.image ? `<img src="${escapeHtml(item.product.image)}" alt="${escapeHtml(item.product.name)}">` : ''}
            </div>
            <div class="cart-main">
              <p class="cart-name">${escapeHtml(item.product.name)}</p>
              ${item.complements.length ? `<p class="cart-meta">+ ${item.complements.map((c) => escapeHtml(c.name)).join(', ')}</p>` : ''}
              <p class="cart-price">${money((Number(item.product.price) + compTotal) * item.quantity)}</p>
            </div>
            <div class="cart-controls">
              <button type="button" class="mini-button" data-action="decrease-cart" data-key="${escapeHtml(cartKey(item.product.id, item.complements))}">-</button>
              <span class="mini-count">${item.quantity}</span>
              <button type="button" class="mini-button" data-action="increase-cart" data-key="${escapeHtml(cartKey(item.product.id, item.complements))}">+</button>
            </div>
          </article>
        `;
      })
      .join('');

    root.innerHTML = `
      <main class="shell">
        <section class="page menu-shell">
          <header class="menu-header">
            <div class="store-brand">
              <div class="store-logo">
                ${state.logoUrl ? `<img src="${escapeHtml(state.logoUrl)}" alt="Logo">` : `<span>${escapeHtml(state.logoEmoji)}</span>`}
              </div>
              <div>
                <h1 class="store-title">${escapeHtml(state.storeName)}</h1>
                <p class="store-subtitle">${escapeHtml(state.table?.name || 'Mesa')} • ${escapeHtml(state.customerName)}</p>
              </div>
            </div>
            <button type="button" class="ghost-button" data-action="back-menu">← Cardápio</button>
          </header>

          <section class="card">
            <h2 class="section-title">Seu carrinho</h2>
            <div class="cart-shell">
              ${items || '<div class="empty-box">Carrinho vazio.</div>'}
            </div>

            <div class="summary" style="margin-top: 18px;">
              <div class="summary-row">
                <strong>Total</strong>
                <span class="summary-total">${money(cartTotal())}</span>
              </div>
              <div style="display: grid; gap: 12px; margin-top: 16px;">
                <button type="button" class="primary-button" data-action="send-order" ${state.sending || state.cart.length === 0 ? 'disabled' : ''}>
                  ${state.sending ? 'Enviando...' : 'Enviar pedido'}
                </button>
                <button type="button" class="secondary-button" data-action="back-menu">Continuar escolhendo</button>
              </div>
            </div>
          </section>

          <section class="status-panel">
            <p class="status-label">Status</p>
            <p class="status-message">${escapeHtml(state.statusMessage)}</p>
          </section>
        </section>
      </main>
    `;
    bindActions();
    return;
  }

  const groups = state.categories
    .map((category) => {
      const products = state.products.filter((product) => product.category === category);
      if (!products.length) return '';

      return `
        <section class="category">
          <h3 class="category-title">${escapeHtml(category)}</h3>
          <div class="products">
            ${products
              .map((product) => {
                const current = state.cart.find((item) => item.product.id === product.id && item.complements.length === 0);
                const count = current ? current.quantity : 0;
                const available = product.stock > 0;

                return `
                  <article class="product-card">
                    <div class="product-image">
                      ${product.image ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">` : `<span>${escapeHtml(product.name.slice(0, 1).toUpperCase())}</span>`}
                    </div>
                    <div class="product-main">
                      <p class="product-name">${escapeHtml(product.name)}</p>
                      ${product.description ? `<p class="product-desc">${escapeHtml(product.description)}</p>` : ''}
                      <div class="product-price">${available ? money(product.price) : 'Indisponível'}</div>
                    </div>
                    <div class="product-actions">
                      ${
                        available
                          ? count > 0
                            ? `
                              <button type="button" class="mini-button" data-action="decrease-product" data-product-id="${product.id}">-</button>
                              <span class="mini-count">${count}</span>
                              <button type="button" class="mini-button" data-action="increase-product" data-product-id="${product.id}">+</button>
                            `
                            : `
                              <button type="button" class="secondary-button" data-action="add-product" data-product-id="${product.id}">Adicionar</button>
                            `
                          : '<span class="muted">Sem estoque</span>'
                      }
                    </div>
                  </article>
                `;
              })
              .join('')}
          </div>
        </section>
      `;
    })
    .join('');

  const uncategorized = state.products.filter((product) => !state.categories.includes(product.category));
  const uncategorizedHtml = uncategorized.length
    ? `
      <section class="category">
        <h3 class="category-title">Outros</h3>
        <div class="products">
          ${uncategorized
            .map((product) => {
              const current = state.cart.find((item) => item.product.id === product.id && item.complements.length === 0);
              const count = current ? current.quantity : 0;
              const available = product.stock > 0;
              return `
                <article class="product-card">
                  <div class="product-image">
                    ${product.image ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">` : `<span>${escapeHtml(product.name.slice(0, 1).toUpperCase())}</span>`}
                  </div>
                  <div class="product-main">
                    <p class="product-name">${escapeHtml(product.name)}</p>
                    ${product.description ? `<p class="product-desc">${escapeHtml(product.description)}</p>` : ''}
                    <div class="product-price">${available ? money(product.price) : 'Indisponível'}</div>
                  </div>
                  <div class="product-actions">
                    ${
                      available
                        ? count > 0
                          ? `
                            <button type="button" class="mini-button" data-action="decrease-product" data-product-id="${product.id}">-</button>
                            <span class="mini-count">${count}</span>
                            <button type="button" class="mini-button" data-action="increase-product" data-product-id="${product.id}">+</button>
                          `
                          : `
                            <button type="button" class="secondary-button" data-action="add-product" data-product-id="${product.id}">Adicionar</button>
                          `
                        : '<span class="muted">Sem estoque</span>'
                    }
                  </div>
                </article>
              `;
            })
            .join('')}
        </div>
      </section>
    `
    : '';

  root.innerHTML = `
    <main class="shell">
      <section class="page menu-shell">
        <header class="menu-header">
          <div class="store-brand">
            <div class="store-logo">
              ${state.logoUrl ? `<img src="${escapeHtml(state.logoUrl)}" alt="Logo">` : `<span>${escapeHtml(state.logoEmoji)}</span>`}
            </div>
            <div>
              <h1 class="store-title">${escapeHtml(state.storeName)}</h1>
              <p class="store-subtitle">${escapeHtml(state.table?.name || 'Mesa')} • ${escapeHtml(state.customerName)}</p>
            </div>
          </div>
          <div class="cart-chip">Carrinho: ${cartCount()} itens</div>
        </header>

        <section class="card">
          <p class="eyebrow">Cardápio</p>
          <h2 class="section-title">Escolha seus produtos</h2>
          <p class="card-description">Toque em adicionar para montar o pedido.</p>
          <div style="display: grid; gap: 16px; margin-top: 18px;">
            ${groups || ''}
            ${uncategorizedHtml}
            ${!groups && !uncategorizedHtml ? '<div class="empty-box">Nenhum produto disponível no momento.</div>' : ''}
          </div>
        </section>

        ${cartCount() > 0 ? `
          <button type="button" class="floating-cart" data-action="open-cart">
            <span>Ver Carrinho (${cartCount()})</span>
            <strong>${money(cartTotal())}</strong>
          </button>
        ` : ''}

        <section class="status-panel">
          <p class="status-label">Status</p>
          <p class="status-message">${escapeHtml(state.statusMessage)}</p>
        </section>
      </section>
    </main>
  `;
  bindActions();
}

function bindActions() {
  const nameInput = document.querySelector('#customer-name');
  const phoneInput = document.querySelector('#customer-phone');
  const introForm = document.querySelector('#customer-form');

  if (nameInput) {
    nameInput.addEventListener('input', (event) => {
      state.customerName = event.target.value;
      render();
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener('input', (event) => {
      state.customerPhone = formatPhone(event.target.value);
      event.target.value = state.customerPhone;
    });
  }

  if (introForm) {
    introForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!state.customerName.trim() || phoneDigits(state.customerPhone).length < 10) {
        state.statusMessage = 'Preencha nome e celular com um número válido antes de continuar.';
        render();
        return;
      }
      state.step = 'menu';
      state.statusMessage = 'Cliente identificado. Agora escolha seus produtos.';
      render();
    });
  }

  document.querySelectorAll('[data-action]').forEach((element) => {
    element.addEventListener('click', handleAction);
  });
}

async function handleAction(event) {
  const action = event.currentTarget.getAttribute('data-action');
  const productId = event.currentTarget.getAttribute('data-product-id');
  const key = event.currentTarget.getAttribute('data-key');

  if (action === 'new-order' || action === 'back-menu') {
    state.step = 'menu';
    render();
    return;
  }

  if (action === 'open-cart') {
    state.step = 'cart';
    render();
    return;
  }

  if (action === 'send-order') {
    await submitOrder();
    return;
  }

  if (action === 'add-product' || action === 'increase-product') {
    const product = state.products.find((item) => item.id === productId);
    if (!product) return;

    const current = state.cart.find((item) => item.product.id === productId && item.complements.length === 0);
    if (current) {
      if (current.quantity >= product.stock) {
        state.statusMessage = 'Estoque insuficiente para adicionar mais unidades.';
        render();
        return;
      }
      current.quantity += 1;
    } else {
      state.cart.push({ product, quantity: 1, complements: [] });
    }

    state.statusMessage = 'Produto adicionado ao carrinho.';
    render();
    return;
  }

  if (action === 'decrease-product') {
    const current = state.cart.find((item) => item.product.id === productId && item.complements.length === 0);
    if (!current) return;
    current.quantity -= 1;
    state.cart = state.cart.filter((item) => item.quantity > 0);
    render();
    return;
  }

  if (action === 'increase-cart' || action === 'decrease-cart') {
    const item = state.cart.find((entry) => cartKey(entry.product.id, entry.complements) === key);
    if (!item) return;

    if (action === 'increase-cart' && item.quantity >= Number(item.product.stock)) {
      state.statusMessage = 'Estoque insuficiente para adicionar mais unidades.';
      render();
      return;
    }

    item.quantity += action === 'increase-cart' ? 1 : -1;
    state.cart = state.cart.filter((entry) => entry.quantity > 0);
    render();
  }
}

async function submitOrder() {
  if (!state.supabase || !state.table || state.cart.length === 0) return;

  state.sending = true;
  state.statusMessage = 'Enviando pedido...';
  render();

  const payload = {
    table_id: state.table.id,
    table_name: state.table.name,
    customer_name: state.customerName.trim(),
    customer_phone: phoneDigits(state.customerPhone),
    items: state.cart.map((item) => ({
      product_id: item.product.id,
      product_name: item.product.name,
      product_price: item.product.price,
      quantity: item.quantity,
      complements: [],
    })),
    total: cartTotal(),
    status: 'pending',
    source: 'customer',
  };

  const { error } = await state.supabase.from('customer_orders').insert(payload);

  state.sending = false;

  if (error) {
    console.error(error);
    state.statusMessage = 'Erro ao enviar o pedido. Tente novamente.';
    render();
    return;
  }

  state.step = 'sent';
  state.cart = [];
  state.statusMessage = 'Pedido enviado com sucesso.';
  render();
}

async function loadData() {
  const route = readRoute();

  if (!route) {
    state.loading = false;
    state.error = 'A URL da mesa está incompleta. Use o QR Code com /mesa/:id/:codigo.';
    render();
    return;
  }

  try {
    state.supabase = getClient();

    const [tableResult, productsResult, categoriesResult, settingsResult] = await Promise.all([
      state.supabase.rpc('get_public_table_by_qr', {
        p_table_id: route.tableId,
        p_table_code: route.tableCode,
      }),
      state.supabase.rpc('get_public_menu_products'),
      state.supabase.rpc('get_public_menu_categories'),
      state.supabase.rpc('get_public_store_settings'),
    ]);

    if (tableResult.error) throw tableResult.error;
    if (productsResult.error) throw productsResult.error;
    if (categoriesResult.error) throw categoriesResult.error;
    if (settingsResult.error) throw settingsResult.error;

    const table = tableResult.data?.[0];
    if (!table) {
      state.loading = false;
      state.error = 'Mesa não encontrada. Verifique se o QR Code foi gerado corretamente.';
      render();
      return;
    }

    state.table = {
      id: Number(table.id),
      name: table.name,
      code: route.tableCode,
    };

    state.products = (productsResult.data ?? []).map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description ?? '',
      price: Number(product.price),
      category: product.category,
      stock: Number(product.stock),
      image: product.image ?? '',
    }));

    const sortMap = new Map((categoriesResult.data ?? []).map((item) => [item.name, Number(item.sort_order)]));
    const categories = new Set([
      ...(categoriesResult.data ?? []).map((item) => item.name),
      ...state.products.map((item) => item.category),
    ]);
    state.categories = [...categories].sort((a, b) => (sortMap.get(a) ?? 999) - (sortMap.get(b) ?? 999));

    const settings = settingsResult.data?.[0];
    if (settings) {
      state.storeName = settings.store_name ?? state.storeName;
      state.logoEmoji = settings.logo_emoji ?? state.logoEmoji;
      state.logoUrl = settings.logo_url ?? null;
    }

    state.loading = false;
    render();
  } catch (error) {
    console.error(error);
    state.loading = false;
    state.error =
      error instanceof Error && error.message.includes('VITE_SUPABASE')
        ? error.message
        : 'Não foi possível carregar o cardápio agora. Tente novamente em instantes.';
    render();
  }
}

render();
loadData();
