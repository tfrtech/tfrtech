import { createClient } from '@supabase/supabase-js';
import './styles.css';

const root = document.querySelector('#app');

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

const state = {
  loading: true,
  error: '',
  serviceClosed: false,

  // Fluxo:
  // intro -> menu -> cart -> sent
  step: 'intro',

  table: null,

  storeName: 'Cardápio Digital',
  logoEmoji: '🥟',
  logoUrl: null,

  products: [],
  categories: [],
  cart: [],

  customerName: '',
  customerPhone: '',

  sending: false,

  statusMessage: 'Informe seu nome e celular para continuar.',

  supabase: null,
};

function phoneDigits(value) {
  return String(value || '')
    .replace(/\D/g, '')
    .slice(0, 11);
}

function formatPhone(value) {
  const digits = phoneDigits(value);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function money(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value) || 0);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function readRoute() {
  const fromQuery = new URLSearchParams(window.location.search).get('path');

  const path = (
    fromQuery ||
    window.location.pathname
  ).trim();

  const parts = path
    .split('/')
    .filter(Boolean);

  const mesaIndex = parts.indexOf('mesa');

  if (
    mesaIndex === -1 ||
    parts.length < mesaIndex + 3
  ) {
    return null;
  }

  const tableId = Number(parts[mesaIndex + 1]);
  const tableCode = parts[mesaIndex + 2];

  if (!Number.isInteger(tableId) || !tableCode) {
    return null;
  }

  return {
    tableId,
    tableCode,
  };
}

function cartKey(productId, complements = []) {
  return `${productId}:${complements
    .map((item) => item.id)
    .sort()
    .join(',')}`;
}

function cartCount() {
  return state.cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
}

function cartTotal() {
  return state.cart.reduce((sum, item) => {
    const compTotal = item.complements.reduce(
      (acc, comp) => acc + Number(comp.price || 0),
      0
    );

    return (
      sum +
      (Number(item.product.price) + compTotal) *
        item.quantity
    );
  }, 0);
}

function getClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      'Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY na Vercel.'
    );
  }

  return createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function getSupabaseAuthErrorMessage(error) {
  const message = String(
    error?.message || ''
  ).toLowerCase();

  const status = Number(
    error?.status ||
      error?.context?.status ||
      0
  );

  if (
    status === 401 ||
    message.includes('invalid api key') ||
    message.includes('apikey')
  ) {
    return 'A chave do Supabase configurada na Vercel não corresponde a este banco. Atualize VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.';
  }

  return '';
}

function render() {
  if (!root) {
    return;
  }

  /*
   * LOADING
   */
  if (state.loading) {
    root.innerHTML = `
      <main class="shell">
        <section class="page">
          <div class="loading card">
            <strong>Carregando cardápio...</strong>

            <p class="muted">
              Estamos validando a mesa e buscando os produtos.
            </p>
          </div>
        </section>
      </main>
    `;

    bindActions();
    return;
  }

  /*
   * ERROR
   */
  if (state.error) {
    root.innerHTML = `
      <main class="shell">
        <section class="page">
          <div class="error card">

            <strong>
              Não foi possível abrir a mesa
            </strong>

            <p class="muted">
              ${escapeHtml(state.error)}
            </p>

          </div>
        </section>
      </main>
    `;

    bindActions();
    return;
  }

  /*
   * LOJA FECHADA
   */
  if (state.serviceClosed) {
    root.innerHTML = `
      <main class="shell">
        <section class="page">

          <div class="error card">

            <div
              class="store-logo"
              style="margin-bottom: 14px;"
            >
              ${
                state.logoUrl
                  ? `
                    <img
                      src="${escapeHtml(state.logoUrl)}"
                      alt="Logo"
                    >
                  `
                  : `
                    <span>
                      ${escapeHtml(state.logoEmoji)}
                    </span>
                  `
              }
            </div>

            <strong>
              Fora de horário de serviço
            </strong>

            <p class="muted">
              A loja está fechada no momento.
              Tente fazer seu pedido novamente
              dentro do horário de atendimento.
            </p>

          </div>

        </section>
      </main>
    `;

    bindActions();
    return;
  }

  /*
   * ==========================================
   * TELA DE IDENTIFICAÇÃO
   * ==========================================
   */
  if (state.step === 'intro') {
    root.innerHTML = `
      <main class="shell">
        <section class="page">

          <div class="card login-card">

            <div
              class="store-logo"
              style="margin: 0 auto 16px;"
            >
              ${
                state.logoUrl
                  ? `
                    <img
                      src="${escapeHtml(state.logoUrl)}"
                      alt="Logo"
                    >
                  `
                  : `
                    <span>
                      ${escapeHtml(state.logoEmoji)}
                    </span>
                  `
              }
            </div>

            <h1
              class="store-title"
              style="text-align:center;"
            >
              ${escapeHtml(state.storeName)}
            </h1>

            <p
              class="store-subtitle"
              style="text-align:center;"
            >
              ${escapeHtml(
                state.table?.name || 'Mesa'
              )}
            </p>

            <div style="height: 18px;"></div>

            <h2
              class="section-title"
              style="text-align:center;"
            >
              Antes de começar
            </h2>

            <p
              class="card-description"
              style="text-align:center;"
            >
              Informe seus dados para fazer o pedido.
            </p>

            <form
              id="customer-form"
              style="
                display:grid;
                gap:12px;
                margin-top:20px;
              "
            >

              <div>
                <label
                  for="customer-name"
                  style="
                    display:block;
                    font-weight:600;
                    margin-bottom:6px;
                  "
                >
                  Seu nome
                </label>

                <input
                  id="customer-name"
                  class="text-input"
                  type="text"
                  placeholder="Digite seu nome"
                  value="${escapeHtml(
                    state.customerName
                  )}"
                  autocomplete="name"
                  maxlength="120"
                  required
                >
              </div>

              <div>
                <label
                  for="customer-phone"
                  style="
                    display:block;
                    font-weight:600;
                    margin-bottom:6px;
                  "
                >
                  Seu celular
                </label>

                <input
                  id="customer-phone"
                  class="text-input"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value="${escapeHtml(
                    state.customerPhone
                  )}"
                  autocomplete="tel"
                  inputmode="tel"
                  maxlength="15"
                  required
                >
              </div>

              <button
                class="primary-button"
                type="submit"
                style="margin-top:8px;"
              >
                Ver Cardápio
              </button>

            </form>

            ${
              state.statusMessage
                ? `
                  <p
                    class="status-message"
                    style="
                      text-align:center;
                      margin-top:14px;
                    "
                  >
                    ${escapeHtml(
                      state.statusMessage
                    )}
                  </p>
                `
                : ''
            }

          </div>

        </section>
      </main>
    `;

    bindActions();
    return;
  }

  /*
   * ==========================================
   * PEDIDO ENVIADO
   * ==========================================
   */
  if (state.step === 'sent') {
    root.innerHTML = `
      <main class="shell">
        <section class="page">

          <div class="sent card">

            <div
              class="store-logo"
              style="margin:0 auto 16px;"
            >
              ${
                state.logoUrl
                  ? `
                    <img
                      src="${escapeHtml(state.logoUrl)}"
                      alt="Logo"
                    >
                  `
                  : `
                    <span>
                      ${escapeHtml(state.logoEmoji)}
                    </span>
                  `
              }
            </div>

            <strong>
              Pedido enviado!
            </strong>

            <p class="muted">
              Obrigado,
              ${escapeHtml(state.customerName)}.
              Seu pedido foi registrado e está
              aguardando aprovação.
            </p>

            <p class="muted">
              ${escapeHtml(
                state.table?.name || 'Mesa'
              )}
            </p>

            <div style="margin-top:16px;">

              <button
                class="primary-button"
                data-action="new-order"
                type="button"
              >
                Fazer outro pedido
              </button>

            </div>

          </div>

        </section>
      </main>
    `;

    bindActions();
    return;
  }

  /*
   * ==========================================
   * CARRINHO
   * ==========================================
   */
  if (state.step === 'cart') {
    const items = state.cart
      .map((item) => {
        const compTotal =
          item.complements.reduce(
            (sum, comp) =>
              sum + Number(comp.price || 0),
            0
          );

        return `
          <article class="cart-item">

            <div class="cart-image">
              ${
                item.product.image
                  ? `
                    <img
                      src="${escapeHtml(
                        item.product.image
                      )}"
                      alt="${escapeHtml(
                        item.product.name
                      )}"
                    >
                  `
                  : ''
              }
            </div>

            <div class="cart-main">

              <p class="cart-name">
                ${escapeHtml(
                  item.product.name
                )}
              </p>

              ${
                item.complements.length
                  ? `
                    <p class="cart-meta">
                      +
                      ${item.complements
                        .map(
                          (c) =>
                            escapeHtml(c.name)
                        )
                        .join(', ')}
                    </p>
                  `
                  : ''
              }

              <p class="cart-price">
                ${money(
                  (Number(
                    item.product.price
                  ) + compTotal) *
                    item.quantity
                )}
              </p>

            </div>

            <div class="cart-controls">

              <button
                type="button"
                class="mini-button"
                data-action="decrease-cart"
                data-key="${escapeHtml(
                  cartKey(
                    item.product.id,
                    item.complements
                  )
                )}"
              >
                -
              </button>

              <span class="mini-count">
                ${item.quantity}
              </span>

              <button
                type="button"
                class="mini-button"
                data-action="increase-cart"
                data-key="${escapeHtml(
                  cartKey(
                    item.product.id,
                    item.complements
                  )
                )}"
              >
                +
              </button>

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

                ${
                  state.logoUrl
                    ? `
                      <img
                        src="${escapeHtml(
                          state.logoUrl
                        )}"
                        alt="Logo"
                      >
                    `
                    : `
                      <span>
                        ${escapeHtml(
                          state.logoEmoji
                        )}
                      </span>
                    `
                }

              </div>

              <div>

                <h1 class="store-title">
                  ${escapeHtml(
                    state.storeName
                  )}
                </h1>

                <p class="store-subtitle">
                  ${escapeHtml(
                    state.table?.name || 'Mesa'
                  )}
                  •
                  ${escapeHtml(
                    state.customerName
                  )}
                </p>

              </div>

            </div>

            <button
              type="button"
              class="ghost-button"
              data-action="back-menu"
            >
              ← Cardápio
            </button>

          </header>

          <section class="card">

            <h2 class="section-title">
              Seu carrinho
            </h2>

            <div class="cart-shell">

              ${
                items ||
                '<div class="empty-box">Carrinho vazio.</div>'
              }

            </div>

            <div
              class="summary"
              style="margin-top:18px;"
            >

              <div class="summary-row">

                <strong>
                  Total
                </strong>

                <span class="summary-total">
                  ${money(cartTotal())}
                </span>

              </div>

              <div
                style="
                  display:grid;
                  gap:12px;
                  margin-top:16px;
                "
              >

                <button
                  type="button"
                  class="primary-button"
                  data-action="send-order"
                  ${
                    state.sending ||
                    state.cart.length === 0
                      ? 'disabled'
                      : ''
                  }
                >
                  ${
                    state.sending
                      ? 'Enviando...'
                      : 'Enviar pedido'
                  }
                </button>

                <button
                  type="button"
                  class="secondary-button"
                  data-action="back-menu"
                >
                  Continuar escolhendo
                </button>

              </div>

            </div>

          </section>

          <section class="status-panel">

            <p class="status-label">
              Status
            </p>

            <p class="status-message">
              ${escapeHtml(
                state.statusMessage
              )}
            </p>

          </section>

        </section>
      </main>
    `;

    bindActions();
    return;
  }

  /*
   * ==========================================
   * CARDÁPIO
   * ==========================================
   */

  const groups = state.categories
    .map((category) => {
      const products =
        state.products.filter(
          (product) =>
            product.category === category
        );

      if (!products.length) {
        return '';
      }

      return `
        <section class="category">

          <h3 class="category-title">
            ${escapeHtml(category)}
          </h3>

          <div class="products">

            ${products
              .map((product) => {
                const current =
                  state.cart.find(
                    (item) =>
                      item.product.id ===
                        product.id &&
                      item.complements
                        .length === 0
                  );

                const count = current
                  ? current.quantity
                  : 0;

                const available =
                  Number(product.stock) > 0;

                return `
                  <article class="product-card">

                    <div class="product-image">

                      ${
                        product.image
                          ? `
                            <img
                              src="${escapeHtml(
                                product.image
                              )}"
                              alt="${escapeHtml(
                                product.name
                              )}"
                            >
                          `
                          : `
                            <span>
                              ${escapeHtml(
                                product.name
                                  .slice(0, 1)
                                  .toUpperCase()
                              )}
                            </span>
                          `
                      }

                    </div>

                    <div class="product-main">

                      <p class="product-name">
                        ${escapeHtml(
                          product.name
                        )}
                      </p>

                      ${
                        product.description
                          ? `
                            <p class="product-desc">
                              ${escapeHtml(
                                product.description
                              )}
                            </p>
                          `
                          : ''
                      }

                      <div class="product-price">
                        ${
                          available
                            ? money(
                                product.price
                              )
                            : 'Indisponível'
                        }
                      </div>

                    </div>

                    <div class="product-actions">

                      ${
                        available
                          ? count > 0
                            ? `
                              <button
                                type="button"
                                class="mini-button"
                                data-action="decrease-product"
                                data-product-id="${escapeHtml(
                                  product.id
                                )}"
                              >
                                -
                              </button>

                              <span class="mini-count">
                                ${count}
                              </span>

                              <button
                                type="button"
                                class="mini-button"
                                data-action="increase-product"
                                data-product-id="${escapeHtml(
                                  product.id
                                )}"
                              >
                                +
                              </button>
                            `
                            : `
                              <button
                                type="button"
                                class="secondary-button"
                                data-action="add-product"
                                data-product-id="${escapeHtml(
                                  product.id
                                )}"
                              >
                                Adicionar
                              </button>
                            `
                          : `
                            <span class="muted">
                              Sem estoque
                            </span>
                          `
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

  const uncategorized =
    state.products.filter(
      (product) =>
        !state.categories.includes(
          product.category
        )
    );

  const uncategorizedHtml =
    uncategorized.length
      ? `
        <section class="category">

          <h3 class="category-title">
            Outros
          </h3>

          <div class="products">

            ${uncategorized
              .map((product) => {
                const current =
                  state.cart.find(
                    (item) =>
                      item.product.id ===
                        product.id &&
                      item.complements
                        .length === 0
                  );

                const count = current
                  ? current.quantity
                  : 0;

                const available =
                  Number(product.stock) > 0;

                return `
                  <article class="product-card">

                    <div class="product-image">

                      ${
                        product.image
                          ? `
                            <img
                              src="${escapeHtml(
                                product.image
                              )}"
                              alt="${escapeHtml(
                                product.name
                              )}"
                            >
                          `
                          : `
                            <span>
                              ${escapeHtml(
                                product.name
                                  .slice(0, 1)
                                  .toUpperCase()
                              )}
                            </span>
                          `
                      }

                    </div>

                    <div class="product-main">

                      <p class="product-name">
                        ${escapeHtml(
                          product.name
                        )}
                      </p>

                      ${
                        product.description
                          ? `
                            <p class="product-desc">
                              ${escapeHtml(
                                product.description
                              )}
                            </p>
                          `
                          : ''
                      }

                      <div class="product-price">
                        ${
                          available
                            ? money(
                                product.price
                              )
                            : 'Indisponível'
                        }
                      </div>

                    </div>

                    <div class="product-actions">

                      ${
                        available
                          ? count > 0
                            ? `
                              <button
                                type="button"
                                class="mini-button"
                                data-action="decrease-product"
                                data-product-id="${escapeHtml(
                                  product.id
                                )}"
                              >
                                -
                              </button>

                              <span class="mini-count">
                                ${count}
                              </span>

                              <button
                                type="button"
                                class="mini-button"
                                data-action="increase-product"
                                data-product-id="${escapeHtml(
                                  product.id
                                )}"
                              >
                                +
                              </button>
                            `
                            : `
                              <button
                                type="button"
                                class="secondary-button"
                                data-action="add-product"
                                data-product-id="${escapeHtml(
                                  product.id
                                )}"
                              >
                                Adicionar
                              </button>
                            `
                          : `
                            <span class="muted">
                              Sem estoque
                            </span>
                          `
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

              ${
                state.logoUrl
                  ? `
                    <img
                      src="${escapeHtml(
                        state.logoUrl
                      )}"
                      alt="Logo"
                    >
                  `
                  : `
                    <span>
                      ${escapeHtml(
                        state.logoEmoji
                      )}
                    </span>
                  `
              }

            </div>

            <div>

              <h1 class="store-title">
                ${escapeHtml(
                  state.storeName
                )}
              </h1>

              <p class="store-subtitle">
                ${escapeHtml(
                  state.table?.name || 'Mesa'
                )}
                •
                ${escapeHtml(
                  state.customerName
                )}
              </p>

            </div>

          </div>

          <div class="cart-chip">
            Carrinho:
            ${cartCount()}
            itens
          </div>

        </header>

        <section class="card">

          <p class="eyebrow">
            Cardápio
          </p>

          <h2 class="section-title">
            Escolha seus produtos
          </h2>

          <p class="card-description">
            Toque em adicionar para montar o pedido.
          </p>

          <div
            style="
              display:grid;
              gap:16px;
              margin-top:18px;
            "
          >

            ${groups}

            ${uncategorizedHtml}

            ${
              !groups && !uncategorizedHtml
                ? `
                  <div class="empty-box">
                    Nenhum produto disponível
                    no momento.
                  </div>
                `
                : ''
            }

          </div>

        </section>

        ${
          cartCount() > 0
            ? `
              <button
                type="button"
                class="floating-cart"
                data-action="open-cart"
              >
                <span>
                  Ver Carrinho
                  (${cartCount()})
                </span>

                <strong>
                  ${money(cartTotal())}
                </strong>
              </button>
            `
            : ''
        }

        <section class="status-panel">

          <p class="status-label">
            Status
          </p>

          <p class="status-message">
            ${escapeHtml(
              state.statusMessage
            )}
          </p>

        </section>

      </section>

    </main>
  `;

  bindActions();
}

function bindActions() {
  const nameInput =
    document.querySelector(
      '#customer-name'
    );

  const phoneInput =
    document.querySelector(
      '#customer-phone'
    );

  const introForm =
    document.querySelector(
      '#customer-form'
    );

  /*
   * NOME
   */
  if (nameInput) {
    nameInput.addEventListener(
      'input',
      (event) => {
        state.customerName =
          event.target.value;
      }
    );
  }

  /*
   * TELEFONE
   */
  if (phoneInput) {
    phoneInput.addEventListener(
      'input',
      (event) => {
        state.customerPhone =
          formatPhone(
            event.target.value
          );

        event.target.value =
          state.customerPhone;
      }
    );
  }

  /*
   * FORMULÁRIO DE IDENTIFICAÇÃO
   */
  if (introForm) {
    introForm.addEventListener(
      'submit',
      (event) => {
        event.preventDefault();

        const name =
          state.customerName.trim();

        const phone =
          phoneDigits(
            state.customerPhone
          );

        if (!name) {
          state.statusMessage =
            'Informe seu nome para continuar.';

          render();
          return;
        }

        if (phone.length < 10) {
          state.statusMessage =
            'Informe um celular válido para continuar.';

          render();
          return;
        }

        state.customerName =
          name;

        state.customerPhone =
          formatPhone(phone);

        state.step =
          'menu';

        state.statusMessage =
          `Olá, ${name}! Escolha seus produtos.`;

        render();
      }
    );
  }

  /*
   * BOTÕES DO SISTEMA
   */
  document
    .querySelectorAll('[data-action]')
    .forEach((element) => {
      element.addEventListener(
        'click',
        handleAction
      );
    });
}

async function handleAction(event) {
  const action =
    event.currentTarget.getAttribute(
      'data-action'
    );

  const productId =
    event.currentTarget.getAttribute(
      'data-product-id'
    );

  const key =
    event.currentTarget.getAttribute(
      'data-key'
    );

  /*
   * NOVO PEDIDO
   */
  if (action === 'new-order') {
    state.cart = [];

    state.step = 'menu';

    state.statusMessage =
      'Escolha seus produtos.';

    render();
    return;
  }

  /*
   * VOLTAR AO CARDÁPIO
   */
  if (action === 'back-menu') {
    state.step = 'menu';

    render();
    return;
  }

  /*
   * ABRIR CARRINHO
   */
  if (action === 'open-cart') {
    state.step = 'cart';

    render();
    return;
  }

  /*
   * ENVIAR PEDIDO
   */
  if (action === 'send-order') {
    await submitOrder();
    return;
  }

  /*
   * ADICIONAR PRODUTO
   */
  if (
    action === 'add-product' ||
    action === 'increase-product'
  ) {
    const product =
      state.products.find(
        (item) =>
          String(item.id) ===
          String(productId)
      );

    if (!product) {
      return;
    }

    const current =
      state.cart.find(
        (item) =>
          String(item.product.id) ===
            String(productId) &&
          item.complements.length === 0
      );

    if (current) {
      if (
        current.quantity >=
        Number(product.stock)
      ) {
        state.statusMessage =
          'Estoque insuficiente para adicionar mais unidades.';

        render();
        return;
      }

      current.quantity += 1;
    } else {
      state.cart.push({
        product,
        quantity: 1,
        complements: [],
      });
    }

    state.statusMessage =
      'Produto adicionado ao carrinho.';

    render();
    return;
  }

  /*
   * DIMINUIR PRODUTO
   */
  if (
    action === 'decrease-product'
  ) {
    const current =
      state.cart.find(
        (item) =>
          String(item.product.id) ===
            String(productId) &&
          item.complements.length === 0
      );

    if (!current) {
      return;
    }

    current.quantity -= 1;

    state.cart =
      state.cart.filter(
        (item) =>
          item.quantity > 0
      );

    render();
    return;
  }

  /*
   * CARRINHO + / -
   */
  if (
    action === 'increase-cart' ||
    action === 'decrease-cart'
  ) {
    const item =
      state.cart.find(
        (entry) =>
          cartKey(
            entry.product.id,
            entry.complements
          ) === key
      );

    if (!item) {
      return;
    }

    if (
      action === 'increase-cart' &&
      item.quantity >=
        Number(item.product.stock)
    ) {
      state.statusMessage =
        'Estoque insuficiente para adicionar mais unidades.';

      render();
      return;
    }

    if (
      action === 'increase-cart'
    ) {
      item.quantity += 1;
    } else {
      item.quantity -= 1;
    }

    state.cart =
      state.cart.filter(
        (entry) =>
          entry.quantity > 0
      );

    render();
  }
}

async function submitOrder() {
  if (
    !state.supabase ||
    !state.table ||
    state.cart.length === 0
  ) {
    return;
  }

  /*
   * VALIDAÇÃO EXTRA
   *
   * Isso impede que o RPC receba
   * customer_name vazio.
   */
  const customerName =
    state.customerName.trim();

  const customerPhone =
    phoneDigits(
      state.customerPhone
    );

  if (!customerName) {
    state.step = 'intro';

    state.statusMessage =
      'Informe seu nome antes de enviar o pedido.';

    render();
    return;
  }

  if (customerPhone.length < 10) {
    state.step = 'intro';

    state.statusMessage =
      'Informe um celular válido antes de enviar o pedido.';

    render();
    return;
  }

  state.sending = true;

  state.statusMessage =
    'Enviando pedido...';

  render();

  const items =
    state.cart.map((item) => ({
      product_id:
        item.product.id,

      product_name:
        item.product.name,

      product_price:
        Number(item.product.price),

      quantity:
        item.quantity,

      complements:
        item.complements.map(
          (comp) => ({
            id: comp.id,
            name: comp.name,
            price: Number(
              comp.price || 0
            ),
          })
        ),
    }));

  console.log(
    'Enviando pedido:',
    {
      tableId:
        state.table.id,

      tableName:
        state.table.name,

      customerName,

      customerPhone,

      items,

      total:
        cartTotal(),
    }
  );

  const {
    data,
    error,
  } =
    await state.supabase.rpc(
      'submit_public_customer_order',
      {
        p_table_id:
          Number(state.table.id),

        p_table_name:
          state.table.name,

        p_customer_name:
          customerName,

        p_customer_phone:
          customerPhone,

        p_items:
          items,

        p_total:
          cartTotal(),
      }
    );

  state.sending = false;

  if (error) {
    console.error(
      'Erro ao enviar pedido:',
      error
    );

    /*
     * LOJA FECHADA
     */
    if (
      String(
        error.message || ''
      ).includes(
        'ONLINE_ORDERING_CLOSED'
      )
    ) {
      state.serviceClosed = true;

      state.cart = [];

      state.step = 'intro';

      state.statusMessage =
        'Loja fechada no momento.';

      render();
      return;
    }

    /*
     * NOME INVÁLIDO
     */
    if (
      String(
        error.message || ''
      ).includes(
        'INVALID_CUSTOMER_NAME'
      )
    ) {
      state.step = 'intro';

      state.statusMessage =
        'Informe seu nome antes de enviar o pedido.';

      render();
      return;
    }

    /*
     * OUTRO ERRO
     */
    state.statusMessage =
      'Erro ao enviar o pedido. Tente novamente.';

    render();
    return;
  }

  console.log(
    'Pedido criado:',
    data
  );

  state.step = 'sent';

  state.cart = [];

  state.statusMessage =
    'Pedido enviado com sucesso.';

  render();
}

async function loadData() {
  const route =
    readRoute();

  if (!route) {
    state.loading = false;

    state.error =
      'A URL da mesa está incompleta. Use o QR Code com /mesa/:id/:codigo.';

    render();

    return;
  }

  try {
    state.supabase =
      getClient();

    const [
      tableResult,
      productsResult,
      categoriesResult,
      settingsResult,
    ] =
      await Promise.all([
        state.supabase.rpc(
          'get_public_table_by_qr',
          {
            p_table_id:
              route.tableId,

            p_table_code:
              route.tableCode,
          }
        ),

        state.supabase.rpc(
          'get_public_menu_products'
        ),

        state.supabase.rpc(
          'get_public_menu_categories'
        ),

        state.supabase.rpc(
          'get_public_store_settings'
        ),
      ]);

    if (tableResult.error) {
      throw tableResult.error;
    }

    if (productsResult.error) {
      throw productsResult.error;
    }

    if (categoriesResult.error) {
      throw categoriesResult.error;
    }

    if (settingsResult.error) {
      throw settingsResult.error;
    }

    const table =
      tableResult.data?.[0];

    if (!table) {
      state.loading = false;

      state.error =
        'Mesa não encontrada. Verifique se o QR Code foi gerado corretamente.';

      render();

      return;
    }

    state.table = {
      id: Number(table.id),
      name: table.name,
      code: route.tableCode,
    };

    state.products =
      (productsResult.data ?? [])
        .map((product) => ({
          id: product.id,

          name: product.name,

          description:
            product.description ?? '',

          price:
            Number(product.price),

          category:
            product.category,

          stock:
            Number(product.stock),

          image:
            product.image ?? '',
        }));

    const sortMap =
      new Map(
        (categoriesResult.data ?? [])
          .map(
            (item) => [
              item.name,
              Number(
                item.sort_order
              ),
            ]
          )
      );

    const categories =
      new Set([
        ...(categoriesResult.data ?? [])
          .map(
            (item) =>
              item.name
          ),

        ...state.products.map(
          (item) =>
            item.category
        ),
      ]);

    state.categories =
      [...categories].sort(
        (a, b) =>
          (sortMap.get(a) ??
            999) -
          (sortMap.get(b) ??
            999)
      );

    const settings =
      settingsResult.data?.[0];

    if (settings) {
      state.storeName =
        settings.store_name ??
        state.storeName;

      state.logoEmoji =
        settings.logo_emoji ??
        state.logoEmoji;

      state.logoUrl =
        settings.logo_url ??
        null;

      /*
       * IMPORTANTE:
       *
       * Se sua função pública não retorna
       * online_ordering_enabled, isso ficará
       * simplesmente como undefined.
       */
      if (
        settings.online_ordering_enabled ===
        false
      ) {
        state.loading = false;

        state.serviceClosed =
          true;

        state.products = [];

        state.categories = [];

        state.cart = [];

        render();

        return;
      }
    }

    state.loading = false;

    /*
     * IMPORTANTE:
     *
     * Agora começa na tela de
     * identificação.
     */
    state.step = 'intro';

    state.statusMessage =
      'Informe seu nome e celular para continuar.';

    render();

  } catch (error) {
    console.error(error);

    state.loading = false;

    const authMessage =
      getSupabaseAuthErrorMessage(
        error
      );

    state.error =
      error instanceof Error &&
      error.message.includes(
        'VITE_SUPABASE'
      )
        ? error.message
        : authMessage ||
          'Não foi possível carregar o cardápio agora. Tente novamente em instantes.';

    render();
  }
}

render();

loadData();


// import { createClient } from '@supabase/supabase-js';
// import './styles.css';

// const root = document.querySelector('#app');
// const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim();
// const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

// const state = {
//   loading: true,
//   error: '',
//   serviceClosed: false,
//   step: 'intro',
//   table: null,
//   storeName: 'Cardapio Digital',
//   logoEmoji: '🥟',
//   logoUrl: null,
//   products: [],
//   categories: [],
//   cart: [],
//   customerName: '',
//   customerPhone: '',
//   sending: false,
//   statusMessage: 'Aguardando preenchimento do cliente.',
//   supabase: null,
// };

// function phoneDigits(value) {
//   return String(value || '').replace(/\D/g, '').slice(0, 11);
// }

// function formatPhone(value) {
//   const digits = phoneDigits(value);
//   if (digits.length <= 2) return digits;
//   if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
//   if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
//   return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
// }

// function money(value) {
//   return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
// }

// function escapeHtml(value) {
//   return String(value)
//     .replaceAll('&', '&amp;')
//     .replaceAll('<', '&lt;')
//     .replaceAll('>', '&gt;')
//     .replaceAll('"', '&quot;')
//     .replaceAll("'", '&#39;');
// }

// function readRoute() {
//   const fromQuery = new URLSearchParams(window.location.search).get('path');
//   const path = (fromQuery || window.location.pathname).trim();
//   const parts = path.split('/').filter(Boolean);
//   const mesaIndex = parts.indexOf('mesa');

//   if (mesaIndex === -1 || parts.length < mesaIndex + 3) return null;

//   const tableId = Number(parts[mesaIndex + 1]);
//   const tableCode = parts[mesaIndex + 2];
//   if (!Number.isInteger(tableId) || !tableCode) return null;

//   return { tableId, tableCode };
// }

// function cartKey(productId, complements = []) {
//   return `${productId}:${complements.map((item) => item.id).sort().join(',')}`;
// }

// function cartCount() {
//   return state.cart.reduce((sum, item) => sum + item.quantity, 0);
// }

// function cartTotal() {
//   return state.cart.reduce((sum, item) => {
//     const compTotal = item.complements.reduce((acc, comp) => acc + Number(comp.price), 0);
//     return sum + (Number(item.product.price) + compTotal) * item.quantity;
//   }, 0);
// }

// function getClient() {
//   if (!SUPABASE_URL || !SUPABASE_KEY) {
//     throw new Error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY na Vercel.');
//   }

//   return createClient(SUPABASE_URL, SUPABASE_KEY, {
//     auth: { persistSession: false, autoRefreshToken: false },
//   });
// }

// function getSupabaseAuthErrorMessage(error) {
//   const message = String(error?.message || '').toLowerCase();
//   const status = Number(error?.status || error?.context?.status || 0);

//   if (status === 401 || message.includes('invalid api key') || message.includes('apikey')) {
//     return 'A chave do Supabase configurada na Vercel nao corresponde a este banco. Atualize VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY para o projeto novo e publique novamente.';
//   }

//   return '';
// }

// function render() {
//   if (!root) return;

//   if (state.loading) {
//     root.innerHTML = `
//       <main class="shell">
//         <section class="page">
//           <div class="loading card">
//             <strong>Carregando cardápio...</strong>
//             <p class="muted">Estamos validando a mesa e buscando os produtos.</p>
//           </div>
//         </section>
//       </main>
//     `;
//     bindActions();
//     return;
//   }

//   if (state.error) {
//     root.innerHTML = `
//       <main class="shell">
//         <section class="page">
//           <div class="error card">
//             <strong>Não foi possível abrir a mesa</strong>
//             <p class="muted">${escapeHtml(state.error)}</p>
//           </div>
//         </section>
//       </main>
//     `;
//     bindActions();
//     return;
//   }

//   if (state.serviceClosed) {
//     root.innerHTML = `
//       <main class="shell">
//         <section class="page">
//           <div class="error card">
//             <div class="store-logo" style="margin-bottom: 14px;">
//               ${state.logoUrl ? `<img src="${escapeHtml(state.logoUrl)}" alt="Logo">` : `<span>${escapeHtml(state.logoEmoji)}</span>`}
//             </div>
//             <strong>Fora de horario de servico</strong>
//             <p class="muted">A loja esta fechada no momento. Tente fazer seu pedido novamente dentro do horario de atendimento.</p>
//           </div>
//         </section>
//       </main>
//     `;
//     bindActions();
//     return;
//   }

//   if (state.step === 'sent') {
//     root.innerHTML = `
//       <main class="shell">
//         <section class="page">
//           <div class="sent card">
//             <strong>Pedido enviado!</strong>
//             <p class="muted">Obrigado, ${escapeHtml(state.customerName)}. O pedido foi registrado.</p>
//             <div style="margin-top: 16px;">
//               <button class="primary-button" data-action="new-order" type="button">Fazer outro pedido</button>
//             </div>
//           </div>
//         </section>
//       </main>
//     `;
//     bindActions();
//     return;
//   }

//   if (state.step === 'cart') {
//     const items = state.cart
//       .map((item) => {
//         const compTotal = item.complements.reduce((sum, comp) => sum + Number(comp.price), 0);
//         return `
//           <article class="cart-item">
//             <div class="cart-image">
//               ${item.product.image ? `<img src="${escapeHtml(item.product.image)}" alt="${escapeHtml(item.product.name)}">` : ''}
//             </div>
//             <div class="cart-main">
//               <p class="cart-name">${escapeHtml(item.product.name)}</p>
//               ${item.complements.length ? `<p class="cart-meta">+ ${item.complements.map((c) => escapeHtml(c.name)).join(', ')}</p>` : ''}
//               <p class="cart-price">${money((Number(item.product.price) + compTotal) * item.quantity)}</p>
//             </div>
//             <div class="cart-controls">
//               <button type="button" class="mini-button" data-action="decrease-cart" data-key="${escapeHtml(cartKey(item.product.id, item.complements))}">-</button>
//               <span class="mini-count">${item.quantity}</span>
//               <button type="button" class="mini-button" data-action="increase-cart" data-key="${escapeHtml(cartKey(item.product.id, item.complements))}">+</button>
//             </div>
//           </article>
//         `;
//       })
//       .join('');

//     root.innerHTML = `
//       <main class="shell">
//         <section class="page menu-shell">
//           <header class="menu-header">
//             <div class="store-brand">
//               <div class="store-logo">
//                 ${state.logoUrl ? `<img src="${escapeHtml(state.logoUrl)}" alt="Logo">` : `<span>${escapeHtml(state.logoEmoji)}</span>`}
//               </div>
//               <div>
//                 <h1 class="store-title">${escapeHtml(state.storeName)}</h1>
//                 <p class="store-subtitle">${escapeHtml(state.table?.name || 'Mesa')} • ${escapeHtml(state.customerName)}</p>
//               </div>
//             </div>
//             <button type="button" class="ghost-button" data-action="back-menu">← Cardápio</button>
//           </header>

//           <section class="card">
//             <h2 class="section-title">Seu carrinho</h2>
//             <div class="cart-shell">
//               ${items || '<div class="empty-box">Carrinho vazio.</div>'}
//             </div>

//             <div class="summary" style="margin-top: 18px;">
//               <div class="summary-row">
//                 <strong>Total</strong>
//                 <span class="summary-total">${money(cartTotal())}</span>
//               </div>
//               <div style="display: grid; gap: 12px; margin-top: 16px;">
//                 <button type="button" class="primary-button" data-action="send-order" ${state.sending || state.cart.length === 0 ? 'disabled' : ''}>
//                   ${state.sending ? 'Enviando...' : 'Enviar pedido'}
//                 </button>
//                 <button type="button" class="secondary-button" data-action="back-menu">Continuar escolhendo</button>
//               </div>
//             </div>
//           </section>

//           <section class="status-panel">
//             <p class="status-label">Status</p>
//             <p class="status-message">${escapeHtml(state.statusMessage)}</p>
//           </section>
//         </section>
//       </main>
//     `;
//     bindActions();
//     return;
//   }

//   const groups = state.categories
//     .map((category) => {
//       const products = state.products.filter((product) => product.category === category);
//       if (!products.length) return '';

//       return `
//         <section class="category">
//           <h3 class="category-title">${escapeHtml(category)}</h3>
//           <div class="products">
//             ${products
//               .map((product) => {
//                 const current = state.cart.find((item) => item.product.id === product.id && item.complements.length === 0);
//                 const count = current ? current.quantity : 0;
//                 const available = product.stock > 0;

//                 return `
//                   <article class="product-card">
//                     <div class="product-image">
//                       ${product.image ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">` : `<span>${escapeHtml(product.name.slice(0, 1).toUpperCase())}</span>`}
//                     </div>
//                     <div class="product-main">
//                       <p class="product-name">${escapeHtml(product.name)}</p>
//                       ${product.description ? `<p class="product-desc">${escapeHtml(product.description)}</p>` : ''}
//                       <div class="product-price">${available ? money(product.price) : 'Indisponível'}</div>
//                     </div>
//                     <div class="product-actions">
//                       ${
//                         available
//                           ? count > 0
//                             ? `
//                               <button type="button" class="mini-button" data-action="decrease-product" data-product-id="${product.id}">-</button>
//                               <span class="mini-count">${count}</span>
//                               <button type="button" class="mini-button" data-action="increase-product" data-product-id="${product.id}">+</button>
//                             `
//                             : `
//                               <button type="button" class="secondary-button" data-action="add-product" data-product-id="${product.id}">Adicionar</button>
//                             `
//                           : '<span class="muted">Sem estoque</span>'
//                       }
//                     </div>
//                   </article>
//                 `;
//               })
//               .join('')}
//           </div>
//         </section>
//       `;
//     })
//     .join('');

//   const uncategorized = state.products.filter((product) => !state.categories.includes(product.category));
//   const uncategorizedHtml = uncategorized.length
//     ? `
//       <section class="category">
//         <h3 class="category-title">Outros</h3>
//         <div class="products">
//           ${uncategorized
//             .map((product) => {
//               const current = state.cart.find((item) => item.product.id === product.id && item.complements.length === 0);
//               const count = current ? current.quantity : 0;
//               const available = product.stock > 0;
//               return `
//                 <article class="product-card">
//                   <div class="product-image">
//                     ${product.image ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">` : `<span>${escapeHtml(product.name.slice(0, 1).toUpperCase())}</span>`}
//                   </div>
//                   <div class="product-main">
//                     <p class="product-name">${escapeHtml(product.name)}</p>
//                     ${product.description ? `<p class="product-desc">${escapeHtml(product.description)}</p>` : ''}
//                     <div class="product-price">${available ? money(product.price) : 'Indisponível'}</div>
//                   </div>
//                   <div class="product-actions">
//                     ${
//                       available
//                         ? count > 0
//                           ? `
//                             <button type="button" class="mini-button" data-action="decrease-product" data-product-id="${product.id}">-</button>
//                             <span class="mini-count">${count}</span>
//                             <button type="button" class="mini-button" data-action="increase-product" data-product-id="${product.id}">+</button>
//                           `
//                           : `
//                             <button type="button" class="secondary-button" data-action="add-product" data-product-id="${product.id}">Adicionar</button>
//                           `
//                         : '<span class="muted">Sem estoque</span>'
//                     }
//                   </div>
//                 </article>
//               `;
//             })
//             .join('')}
//         </div>
//       </section>
//     `
//     : '';

//   root.innerHTML = `
//     <main class="shell">
//       <section class="page menu-shell">
//         <header class="menu-header">
//           <div class="store-brand">
//             <div class="store-logo">
//               ${state.logoUrl ? `<img src="${escapeHtml(state.logoUrl)}" alt="Logo">` : `<span>${escapeHtml(state.logoEmoji)}</span>`}
//             </div>
//             <div>
//               <h1 class="store-title">${escapeHtml(state.storeName)}</h1>
//               <p class="store-subtitle">${escapeHtml(state.table?.name || 'Mesa')} • ${escapeHtml(state.customerName)}</p>
//             </div>
//           </div>
//           <div class="cart-chip">Carrinho: ${cartCount()} itens</div>
//         </header>

//         <section class="card">
//           <p class="eyebrow">Cardápio</p>
//           <h2 class="section-title">Escolha seus produtos</h2>
//           <p class="card-description">Toque em adicionar para montar o pedido.</p>
//           <div style="display: grid; gap: 16px; margin-top: 18px;">
//             ${groups || ''}
//             ${uncategorizedHtml}
//             ${!groups && !uncategorizedHtml ? '<div class="empty-box">Nenhum produto disponível no momento.</div>' : ''}
//           </div>
//         </section>

//         ${cartCount() > 0 ? `
//           <button type="button" class="floating-cart" data-action="open-cart">
//             <span>Ver Carrinho (${cartCount()})</span>
//             <strong>${money(cartTotal())}</strong>
//           </button>
//         ` : ''}

//         <section class="status-panel">
//           <p class="status-label">Status</p>
//           <p class="status-message">${escapeHtml(state.statusMessage)}</p>
//         </section>
//       </section>
//     </main>
//   `;
//   bindActions();
// }

// function bindActions() {
//   const nameInput = document.querySelector('#customer-name');
//   const phoneInput = document.querySelector('#customer-phone');
//   const introForm = document.querySelector('#customer-form');

//   if (nameInput) {
//     nameInput.addEventListener('input', (event) => {
//       state.customerName = event.target.value;
//       render();
//     });
//   }

//   if (phoneInput) {
//     phoneInput.addEventListener('input', (event) => {
//       state.customerPhone = formatPhone(event.target.value);
//       event.target.value = state.customerPhone;
//     });
//   }

//   if (introForm) {
//     introForm.addEventListener('submit', (event) => {
//       event.preventDefault();
//       if (!state.customerName.trim() || phoneDigits(state.customerPhone).length < 10) {
//         state.statusMessage = 'Preencha nome e celular com um número válido antes de continuar.';
//         render();
//         return;
//       }
//       state.step = 'menu';
//       state.statusMessage = 'Cliente identificado. Agora escolha seus produtos.';
//       render();
//     });
//   }

//   document.querySelectorAll('[data-action]').forEach((element) => {
//     element.addEventListener('click', handleAction);
//   });
// }

// async function handleAction(event) {
//   const action = event.currentTarget.getAttribute('data-action');
//   const productId = event.currentTarget.getAttribute('data-product-id');
//   const key = event.currentTarget.getAttribute('data-key');

//   if (action === 'new-order' || action === 'back-menu') {
//     state.step = 'menu';
//     render();
//     return;
//   }

//   if (action === 'open-cart') {
//     state.step = 'cart';
//     render();
//     return;
//   }

//   if (action === 'send-order') {
//     await submitOrder();
//     return;
//   }

//   if (action === 'add-product' || action === 'increase-product') {
//     const product = state.products.find((item) => item.id === productId);
//     if (!product) return;

//     const current = state.cart.find((item) => item.product.id === productId && item.complements.length === 0);
//     if (current) {
//       if (current.quantity >= product.stock) {
//         state.statusMessage = 'Estoque insuficiente para adicionar mais unidades.';
//         render();
//         return;
//       }
//       current.quantity += 1;
//     } else {
//       state.cart.push({ product, quantity: 1, complements: [] });
//     }

//     state.statusMessage = 'Produto adicionado ao carrinho.';
//     render();
//     return;
//   }

//   if (action === 'decrease-product') {
//     const current = state.cart.find((item) => item.product.id === productId && item.complements.length === 0);
//     if (!current) return;
//     current.quantity -= 1;
//     state.cart = state.cart.filter((item) => item.quantity > 0);
//     render();
//     return;
//   }

//   if (action === 'increase-cart' || action === 'decrease-cart') {
//     const item = state.cart.find((entry) => cartKey(entry.product.id, entry.complements) === key);
//     if (!item) return;

//     if (action === 'increase-cart' && item.quantity >= Number(item.product.stock)) {
//       state.statusMessage = 'Estoque insuficiente para adicionar mais unidades.';
//       render();
//       return;
//     }

//     item.quantity += action === 'increase-cart' ? 1 : -1;
//     state.cart = state.cart.filter((entry) => entry.quantity > 0);
//     render();
//   }
// }

// async function submitOrder() {
//   if (!state.supabase || !state.table || state.cart.length === 0) return;

//   state.sending = true;
//   state.statusMessage = 'Enviando pedido...';
//   render();

//   const items = state.cart.map((item) => ({
//       product_id: item.product.id,
//       product_name: item.product.name,
//       product_price: item.product.price,
//       quantity: item.quantity,
//       complements: [],
//     }));

//   const { error } = await state.supabase.rpc('submit_public_customer_order', {
//     p_table_id: state.table.id,
//     p_table_name: state.table.name,
//     p_customer_name: state.customerName.trim(),
//     p_customer_phone: phoneDigits(state.customerPhone),
//     p_items: items,
//     p_total: cartTotal(),
//   });

//   state.sending = false;

//   if (error) {
//     console.error(error);
//     if (String(error.message || '').includes('ONLINE_ORDERING_CLOSED')) {
//       state.serviceClosed = true;
//       state.cart = [];
//       state.step = 'intro';
//       state.statusMessage = 'Loja fechada no momento.';
//       render();
//       return;
//     }
//     state.statusMessage = 'Erro ao enviar o pedido. Tente novamente.';
//     render();
//     return;
//   }

//   state.step = 'sent';
//   state.cart = [];
//   state.statusMessage = 'Pedido enviado com sucesso.';
//   render();
// }

// async function loadData() {
//   const route = readRoute();

//   if (!route) {
//     state.loading = false;
//     state.error = 'A URL da mesa está incompleta. Use o QR Code com /mesa/:id/:codigo.';
//     render();
//     return;
//   }

//   try {
//     state.supabase = getClient();

//     const [tableResult, productsResult, categoriesResult, settingsResult] = await Promise.all([
//       state.supabase.rpc('get_public_table_by_qr', {
//         p_table_id: route.tableId,
//         p_table_code: route.tableCode,
//       }),
//       state.supabase.rpc('get_public_menu_products'),
//       state.supabase.rpc('get_public_menu_categories'),
//       state.supabase.rpc('get_public_store_settings'),
//     ]);

//     if (tableResult.error) throw tableResult.error;
//     if (productsResult.error) throw productsResult.error;
//     if (categoriesResult.error) throw categoriesResult.error;
//     if (settingsResult.error) throw settingsResult.error;

//     const table = tableResult.data?.[0];
//     if (!table) {
//       state.loading = false;
//       state.error = 'Mesa não encontrada. Verifique se o QR Code foi gerado corretamente.';
//       render();
//       return;
//     }

//     state.table = {
//       id: Number(table.id),
//       name: table.name,
//       code: route.tableCode,
//     };

//     state.products = (productsResult.data ?? []).map((product) => ({
//       id: product.id,
//       name: product.name,
//       description: product.description ?? '',
//       price: Number(product.price),
//       category: product.category,
//       stock: Number(product.stock),
//       image: product.image ?? '',
//     }));

//     const sortMap = new Map((categoriesResult.data ?? []).map((item) => [item.name, Number(item.sort_order)]));
//     const categories = new Set([
//       ...(categoriesResult.data ?? []).map((item) => item.name),
//       ...state.products.map((item) => item.category),
//     ]);
//     state.categories = [...categories].sort((a, b) => (sortMap.get(a) ?? 999) - (sortMap.get(b) ?? 999));

//     const settings = settingsResult.data?.[0];
//     if (settings) {
//       state.storeName = settings.store_name ?? state.storeName;
//       state.logoEmoji = settings.logo_emoji ?? state.logoEmoji;
//       state.logoUrl = settings.logo_url ?? null;
//       if (settings.online_ordering_enabled === false) {
//         state.loading = false;
//         state.serviceClosed = true;
//         state.products = [];
//         state.categories = [];
//         state.cart = [];
//         render();
//         return;
//       }
//     }

//     state.loading = false;
//     render();
//   } catch (error) {
//     console.error(error);
//     state.loading = false;
//     const authMessage = getSupabaseAuthErrorMessage(error);
//     state.error =
//       error instanceof Error && error.message.includes('VITE_SUPABASE')
//         ? error.message
//         : authMessage || 'Não foi possível carregar o cardápio agora. Tente novamente em instantes.';
//     render();
//   }
// }

// render();
// loadData();
