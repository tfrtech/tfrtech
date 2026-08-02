(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))n(a);new MutationObserver(a=>{for(const s of a)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function i(a){const s={};return a.integrity&&(s.integrity=a.integrity),a.referrerPolicy&&(s.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?s.credentials="include":a.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(a){if(a.ep)return;a.ep=!0;const s=i(a);fetch(a.href,s)}})();const b=document.querySelector("#app"),A=void 0,q=void 0,t={loading:!0,error:"",step:"intro",table:null,store:{storeName:"Cardápio Digital",logoEmoji:"🥟",logoUrl:null},products:[],categories:[],cart:[],customerName:"",customerPhone:"",sending:!1,statusMessage:"Aguardando preenchimento do cliente.",supabase:null};function v(r){return r.replace(/\D/g,"").slice(0,11)}function N(r){const e=v(r);return e.length<=2?e:e.length<=6?`(${e.slice(0,2)}) ${e.slice(2)}`:e.length<=10?`(${e.slice(0,2)}) ${e.slice(2,6)}-${e.slice(6)}`:`(${e.slice(0,2)}) ${e.slice(2,7)}-${e.slice(7)}`}function f(r){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(r)}function c(r){return String(r).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function S(){const r=window.location.pathname.split("/").filter(Boolean),e=r.indexOf("mesa");if(e===-1||r.length<e+3)return null;const i=Number(r[e+1]),n=r[e+2];return!Number.isInteger(i)||!n?null:{tableId:i,tableCode:n}}function $(r,e=[]){return`${r}:${e.map(i=>i.id).sort().join(",")}`}function y(){return t.cart.reduce((r,e)=>r+e.quantity,0)}function _(){return t.cart.reduce((r,e)=>{const i=e.complements.reduce((n,a)=>n+Number(a.price),0);return r+(Number(e.product.price)+i)*e.quantity},0)}function P(){throw new Error("Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY na Vercel.")}function l(){var n,a;if(!b)return;if(t.loading){b.innerHTML=`
      <main class="shell">
        <section class="page">
          <div class="loading card">
            <strong>Carregando cardápio...</strong>
            <p class="muted">Estamos validando a mesa e buscando os produtos.</p>
          </div>
        </section>
      </main>
    `;return}if(t.error){b.innerHTML=`
      <main class="shell">
        <section class="page">
          <div class="error card">
            <strong>Não foi possível abrir a mesa</strong>
            <p class="muted">${c(t.error)}</p>
          </div>
        </section>
      </main>
    `;return}if(t.step==="sent"){b.innerHTML=`
      <main class="shell">
        <section class="page">
          <div class="sent card">
            <strong>Pedido enviado!</strong>
            <p class="muted">Obrigado, ${c(t.customerName)}. O pedido foi registrado.</p>
            <div style="margin-top: 16px;">
              <button class="primary-button" data-action="new-order" type="button">Fazer outro pedido</button>
            </div>
          </div>
        </section>
      </main>
    `,h();return}if(t.step==="cart"){const s=t.cart.map(o=>{const u=o.complements.reduce((p,m)=>p+Number(m.price),0);return`
          <article class="cart-item">
            <div class="cart-image">
              ${o.product.image?`<img src="${c(o.product.image)}" alt="${c(o.product.name)}">`:""}
            </div>
            <div class="cart-main">
              <p class="cart-name">${c(o.product.name)}</p>
              ${o.complements.length?`<p class="cart-meta">+ ${o.complements.map(p=>c(p.name)).join(", ")}</p>`:""}
              <p class="cart-price">${f((Number(o.product.price)+u)*o.quantity)}</p>
            </div>
            <div class="cart-controls">
              <button type="button" class="mini-button" data-action="decrease-cart" data-key="${c($(o.product.id,o.complements))}">-</button>
              <span class="mini-count">${o.quantity}</span>
              <button type="button" class="mini-button" data-action="increase-cart" data-key="${c($(o.product.id,o.complements))}">+</button>
            </div>
          </article>
        `}).join("");b.innerHTML=`
      <main class="shell">
        <section class="page menu-shell">
          <header class="menu-header">
            <div class="store-brand">
              <div class="store-logo">
                ${t.store.logoUrl?`<img src="${c(t.store.logoUrl)}" alt="Logo">`:`<span>${c(t.store.logoEmoji)}</span>`}
              </div>
              <div>
                <h1 class="store-title">${c(t.store.storeName)}</h1>
                <p class="store-subtitle">Mesa ${((n=t.table)==null?void 0:n.tableId)??"-"} • ${c(t.customerName)}</p>
              </div>
            </div>
            <button type="button" class="ghost-button" data-action="back-menu">← Cardápio</button>
          </header>

          <section class="card">
            <h2 class="section-title">Seu carrinho</h2>
            <div class="cart-shell">
              ${s||'<div class="empty-box">Carrinho vazio.</div>'}
            </div>

            <div class="summary" style="margin-top: 18px;">
              <div class="summary-row">
                <strong>Total</strong>
                <span class="summary-total">${f(_())}</span>
              </div>
              <div style="display: grid; gap: 12px; margin-top: 16px;">
                <button type="button" class="primary-button" data-action="send-order" ${t.sending||t.cart.length===0?"disabled":""}>
                  ${t.sending?"Enviando...":"Enviar pedido"}
                </button>
                <button type="button" class="secondary-button" data-action="back-menu">Continuar escolhendo</button>
              </div>
            </div>
          </section>

          <section class="status-panel">
            <p class="status-label">Status</p>
            <p class="status-message">${c(t.statusMessage)}</p>
          </section>
        </section>
      </main>
    `,h();return}const r=t.categories.map(s=>{const o=t.products.filter(u=>u.category===s);return o.length?`
        <section class="category">
          <h3 class="category-title">${c(s)}</h3>
          <div class="products">
            ${o.map(u=>{const p=t.cart.find(d=>d.product.id===u.id&&d.complements.length===0),m=p?p.quantity:0,g=u.stock>0;return`
                  <article class="product-card">
                    <div class="product-image">
                      ${u.image?`<img src="${c(u.image)}" alt="${c(u.name)}">`:`<span>${c(u.name.slice(0,1).toUpperCase())}</span>`}
                    </div>
                    <div class="product-main">
                      <p class="product-name">${c(u.name)}</p>
                      ${u.description?`<p class="product-desc">${c(u.description)}</p>`:""}
                      <div class="product-price">${g?f(u.price):"Indisponível"}</div>
                    </div>
                    <div class="product-actions">
                      ${g?m>0?`
                              <button type="button" class="mini-button" data-action="decrease-product" data-product-id="${u.id}">-</button>
                              <span class="mini-count">${m}</span>
                              <button type="button" class="mini-button" data-action="increase-product" data-product-id="${u.id}">+</button>
                            `:`
                              <button type="button" class="secondary-button" data-action="add-product" data-product-id="${u.id}">Adicionar</button>
                            `:'<span class="muted">Sem estoque</span>'}
                    </div>
                  </article>
                `}).join("")}
          </div>
        </section>
      `:""}).join(""),e=t.products.filter(s=>!t.categories.includes(s.category)),i=e.length?`
      <section class="category">
        <h3 class="category-title">Outros</h3>
        <div class="products">
          ${e.map(s=>{const o=t.cart.find(m=>m.product.id===s.id&&m.complements.length===0),u=o?o.quantity:0,p=s.stock>0;return`
                <article class="product-card">
                  <div class="product-image">
                    ${s.image?`<img src="${c(s.image)}" alt="${c(s.name)}">`:`<span>${c(s.name.slice(0,1).toUpperCase())}</span>`}
                  </div>
                  <div class="product-main">
                    <p class="product-name">${c(s.name)}</p>
                    ${s.description?`<p class="product-desc">${c(s.description)}</p>`:""}
                    <div class="product-price">${p?f(s.price):"Indisponível"}</div>
                  </div>
                  <div class="product-actions">
                    ${p?u>0?`
                            <button type="button" class="mini-button" data-action="decrease-product" data-product-id="${s.id}">-</button>
                            <span class="mini-count">${u}</span>
                            <button type="button" class="mini-button" data-action="increase-product" data-product-id="${s.id}">+</button>
                          `:`
                            <button type="button" class="secondary-button" data-action="add-product" data-product-id="${s.id}">Adicionar</button>
                          `:'<span class="muted">Sem estoque</span>'}
                  </div>
                </article>
              `}).join("")}
        </div>
      </section>
    `:"";b.innerHTML=`
    <main class="shell">
      <section class="page menu-shell">
        <header class="menu-header">
          <div class="store-brand">
            <div class="store-logo">
              ${t.store.logoUrl?`<img src="${c(t.store.logoUrl)}" alt="Logo">`:`<span>${c(t.store.logoEmoji)}</span>`}
            </div>
            <div>
              <h1 class="store-title">${c(t.store.storeName)}</h1>
              <p class="store-subtitle">Mesa ${((a=t.table)==null?void 0:a.tableId)??"-"} • ${c(t.customerName)}</p>
            </div>
          </div>
          <div class="cart-chip">Carrinho: ${y()} itens</div>
        </header>

        <section class="card">
          <p class="eyebrow">Cardápio</p>
          <h2 class="section-title">Escolha seus produtos</h2>
          <p class="card-description">Toque em adicionar para montar o pedido.</p>
          <div style="display: grid; gap: 16px; margin-top: 18px;">
            ${r||""}
            ${i}
            ${!r&&!i?'<div class="empty-box">Nenhum produto disponível no momento.</div>':""}
          </div>
        </section>

        ${y()>0?`
          <button type="button" class="floating-cart" data-action="open-cart">
            <span>Ver Carrinho (${y()})</span>
            <strong>${f(_())}</strong>
          </button>
        `:""}

        <section class="status-panel">
          <p class="status-label">Status</p>
          <p class="status-message">${c(t.statusMessage)}</p>
        </section>
      </section>
    </main>
  `,h()}function h(){const r=document.querySelector("#customer-name"),e=document.querySelector("#customer-phone"),i=document.querySelector("#customer-form");r&&r.addEventListener("input",n=>{t.customerName=n.target.value;const a=document.querySelector('#customer-form button[type="submit"]');a&&(a.disabled=!t.customerName.trim()||v(t.customerPhone).length<10)}),e&&e.addEventListener("input",n=>{t.customerPhone=N(n.target.value),n.target.value=t.customerPhone;const a=document.querySelector('#customer-form button[type="submit"]');a&&(a.disabled=!t.customerName.trim()||v(t.customerPhone).length<10)}),i&&i.addEventListener("submit",n=>{if(n.preventDefault(),!t.customerName.trim()||v(t.customerPhone).length<10){t.statusMessage="Preencha nome e celular com um número válido antes de continuar.",l();return}t.step="menu",t.statusMessage="Cliente identificado. Agora escolha seus produtos.",l()}),document.querySelectorAll("[data-action]").forEach(n=>{n.addEventListener("click",L)})}async function L(r){const e=r.currentTarget.getAttribute("data-action"),i=r.currentTarget.getAttribute("data-product-id"),n=r.currentTarget.getAttribute("data-key");if(e==="new-order"||e==="back-menu"){t.step="menu",l();return}if(e==="open-cart"){t.step="cart",l();return}if(e==="send-order"){await M();return}if(e==="add-product"||e==="increase-product"){const a=t.products.find(o=>o.id===i);if(!a)return;const s=t.cart.find(o=>o.product.id===i&&o.complements.length===0);if(s){if(s.quantity>=a.stock){t.statusMessage="Estoque insuficiente para adicionar mais unidades.",l();return}s.quantity+=1}else t.cart.push({product:a,quantity:1,complements:[]});t.statusMessage="Produto adicionado ao carrinho.",l();return}if(e==="decrease-product"){const a=t.cart.find(s=>s.product.id===i&&s.complements.length===0);if(!a)return;a.quantity-=1,t.cart=t.cart.filter(s=>s.quantity>0),l();return}if(e==="increase-cart"||e==="decrease-cart"){const a=t.cart.find(s=>$(s.product.id,s.complements)===n);if(!a)return;if(e==="increase-cart"&&a.quantity>=Number(a.product.stock)){t.statusMessage="Estoque insuficiente para adicionar mais unidades.",l();return}a.quantity+=e==="increase-cart"?1:-1,t.cart=t.cart.filter(s=>s.quantity>0),l()}}async function M(){if(!t.supabase||!t.table||t.cart.length===0)return;t.sending=!0,t.statusMessage="Enviando pedido...",l();const r={table_id:t.table.tableId,table_name:t.table.name,customer_name:t.customerName.trim(),customer_phone:v(t.customerPhone),items:t.cart.map(i=>({product_id:i.product.id,product_name:i.product.name,product_price:i.product.price,quantity:i.quantity,complements:[]})),total:_(),status:"pending",source:"customer"},{error:e}=await t.supabase.from("customer_orders").insert(r);if(t.sending=!1,e){console.error(e),t.statusMessage="Erro ao enviar o pedido. Tente novamente.",l();return}t.step="sent",t.cart=[],t.statusMessage="Pedido enviado com sucesso.",l()}async function U(){var e,i;const r=S();if(!r){t.loading=!1,t.error="A URL da mesa está incompleta. Use o QR Code com /mesa/:id/:codigo.",l();return}try{if(!A||!q)throw new Error("Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no projeto da Vercel.");t.supabase=P();const[n,a,s,o]=await Promise.all([t.supabase.rpc("get_public_table_by_qr",{p_table_id:r.tableId,p_table_code:r.tableCode}),t.supabase.rpc("get_public_menu_products"),t.supabase.rpc("get_public_menu_categories"),t.supabase.rpc("get_public_store_settings")]);if(n.error)throw n.error;if(a.error)throw a.error;if(s.error)throw s.error;if(o.error)throw o.error;const u=(e=n.data)==null?void 0:e[0];if(!u){t.loading=!1,t.error="Mesa não encontrada. Verifique se o QR Code foi gerado corretamente.",l();return}t.table=u,t.products=(a.data??[]).map(d=>({id:d.id,name:d.name,description:d.description??"",price:Number(d.price),category:d.category,stock:Number(d.stock),image:d.image??""}));const p=new Map((s.data??[]).map(d=>[d.name,Number(d.sort_order)])),m=new Set([...(s.data??[]).map(d=>d.name),...t.products.map(d=>d.category)]);t.categories=[...m].sort((d,E)=>(p.get(d)??999)-(p.get(E)??999));const g=(i=o.data)==null?void 0:i[0];g&&(t.store.storeName=g.store_name??t.store.storeName,t.store.logoEmoji=g.logo_emoji??t.store.logoEmoji,t.store.logoUrl=g.logo_url??null),t.loading=!1,l()}catch(n){console.error(n),t.loading=!1,t.error=n instanceof Error&&n.message.includes("VITE_SUPABASE")?n.message:"Não foi possível carregar o cardápio agora. Tente novamente em instantes.",l()}}l();U();
