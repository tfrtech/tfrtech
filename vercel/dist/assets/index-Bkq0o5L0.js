(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))n(a);new MutationObserver(a=>{for(const e of a)if(e.type==="childList")for(const o of e.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function i(a){const e={};return a.integrity&&(e.integrity=a.integrity),a.referrerPolicy&&(e.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?e.credentials="include":a.crossOrigin==="anonymous"?e.credentials="omit":e.credentials="same-origin",e}function n(a){if(a.ep)return;a.ep=!0;const e=i(a);fetch(a.href,e)}})();const b=document.querySelector("#app"),A=void 0,q=void 0,t={loading:!0,error:"",step:"intro",table:null,store:{storeName:"Cardápio Digital",logoEmoji:"🥟",logoUrl:null},products:[],categories:[],cart:[],customerName:"",customerPhone:"",sending:!1,statusMessage:"Aguardando preenchimento do cliente.",supabase:null};function h(r){return r.replace(/\D/g,"").slice(0,11)}function S(r){const s=h(r);return s.length<=2?s:s.length<=6?`(${s.slice(0,2)}) ${s.slice(2)}`:s.length<=10?`(${s.slice(0,2)}) ${s.slice(2,6)}-${s.slice(6)}`:`(${s.slice(0,2)}) ${s.slice(2,7)}-${s.slice(7)}`}function f(r){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(r)}function c(r){return String(r).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function N(){const r=new URLSearchParams(window.location.search).get("path"),i=(r||window.location.pathname).split("/").filter(Boolean),n=i.indexOf("mesa");if(n===-1||i.length<n+3)return null;const a=Number(i[n+1]),e=i[n+2];return!Number.isInteger(a)||!e?null:{tableId:a,tableCode:e}}function $(r,s=[]){return`${r}:${s.map(i=>i.id).sort().join(",")}`}function y(){return t.cart.reduce((r,s)=>r+s.quantity,0)}function _(){return t.cart.reduce((r,s)=>{const i=s.complements.reduce((n,a)=>n+Number(a.price),0);return r+(Number(s.product.price)+i)*s.quantity},0)}function P(){throw new Error("Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY na Vercel.")}function l(){var n,a;if(!b)return;if(t.loading){b.innerHTML=`
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
    `,v();return}if(t.step==="cart"){const e=t.cart.map(o=>{const u=o.complements.reduce((p,m)=>p+Number(m.price),0);return`
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
              ${e||'<div class="empty-box">Carrinho vazio.</div>'}
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
    `,v();return}const r=t.categories.map(e=>{const o=t.products.filter(u=>u.category===e);return o.length?`
        <section class="category">
          <h3 class="category-title">${c(e)}</h3>
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
      `:""}).join(""),s=t.products.filter(e=>!t.categories.includes(e.category)),i=s.length?`
      <section class="category">
        <h3 class="category-title">Outros</h3>
        <div class="products">
          ${s.map(e=>{const o=t.cart.find(m=>m.product.id===e.id&&m.complements.length===0),u=o?o.quantity:0,p=e.stock>0;return`
                <article class="product-card">
                  <div class="product-image">
                    ${e.image?`<img src="${c(e.image)}" alt="${c(e.name)}">`:`<span>${c(e.name.slice(0,1).toUpperCase())}</span>`}
                  </div>
                  <div class="product-main">
                    <p class="product-name">${c(e.name)}</p>
                    ${e.description?`<p class="product-desc">${c(e.description)}</p>`:""}
                    <div class="product-price">${p?f(e.price):"Indisponível"}</div>
                  </div>
                  <div class="product-actions">
                    ${p?u>0?`
                            <button type="button" class="mini-button" data-action="decrease-product" data-product-id="${e.id}">-</button>
                            <span class="mini-count">${u}</span>
                            <button type="button" class="mini-button" data-action="increase-product" data-product-id="${e.id}">+</button>
                          `:`
                            <button type="button" class="secondary-button" data-action="add-product" data-product-id="${e.id}">Adicionar</button>
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
  `,v()}function v(){const r=document.querySelector("#customer-name"),s=document.querySelector("#customer-phone"),i=document.querySelector("#customer-form");r&&r.addEventListener("input",n=>{t.customerName=n.target.value;const a=document.querySelector('#customer-form button[type="submit"]');a&&(a.disabled=!t.customerName.trim()||h(t.customerPhone).length<10)}),s&&s.addEventListener("input",n=>{t.customerPhone=S(n.target.value),n.target.value=t.customerPhone;const a=document.querySelector('#customer-form button[type="submit"]');a&&(a.disabled=!t.customerName.trim()||h(t.customerPhone).length<10)}),i&&i.addEventListener("submit",n=>{if(n.preventDefault(),!t.customerName.trim()||h(t.customerPhone).length<10){t.statusMessage="Preencha nome e celular com um número válido antes de continuar.",l();return}t.step="menu",t.statusMessage="Cliente identificado. Agora escolha seus produtos.",l()}),document.querySelectorAll("[data-action]").forEach(n=>{n.addEventListener("click",L)})}async function L(r){const s=r.currentTarget.getAttribute("data-action"),i=r.currentTarget.getAttribute("data-product-id"),n=r.currentTarget.getAttribute("data-key");if(s==="new-order"||s==="back-menu"){t.step="menu",l();return}if(s==="open-cart"){t.step="cart",l();return}if(s==="send-order"){await w();return}if(s==="add-product"||s==="increase-product"){const a=t.products.find(o=>o.id===i);if(!a)return;const e=t.cart.find(o=>o.product.id===i&&o.complements.length===0);if(e){if(e.quantity>=a.stock){t.statusMessage="Estoque insuficiente para adicionar mais unidades.",l();return}e.quantity+=1}else t.cart.push({product:a,quantity:1,complements:[]});t.statusMessage="Produto adicionado ao carrinho.",l();return}if(s==="decrease-product"){const a=t.cart.find(e=>e.product.id===i&&e.complements.length===0);if(!a)return;a.quantity-=1,t.cart=t.cart.filter(e=>e.quantity>0),l();return}if(s==="increase-cart"||s==="decrease-cart"){const a=t.cart.find(e=>$(e.product.id,e.complements)===n);if(!a)return;if(s==="increase-cart"&&a.quantity>=Number(a.product.stock)){t.statusMessage="Estoque insuficiente para adicionar mais unidades.",l();return}a.quantity+=s==="increase-cart"?1:-1,t.cart=t.cart.filter(e=>e.quantity>0),l()}}async function w(){if(!t.supabase||!t.table||t.cart.length===0)return;t.sending=!0,t.statusMessage="Enviando pedido...",l();const r={table_id:t.table.tableId,table_name:t.table.name,customer_name:t.customerName.trim(),customer_phone:h(t.customerPhone),items:t.cart.map(i=>({product_id:i.product.id,product_name:i.product.name,product_price:i.product.price,quantity:i.quantity,complements:[]})),total:_(),status:"pending",source:"customer"},{error:s}=await t.supabase.from("customer_orders").insert(r);if(t.sending=!1,s){console.error(s),t.statusMessage="Erro ao enviar o pedido. Tente novamente.",l();return}t.step="sent",t.cart=[],t.statusMessage="Pedido enviado com sucesso.",l()}async function U(){var s,i;const r=N();if(!r){t.loading=!1,t.error="A URL da mesa está incompleta. Use o QR Code com /mesa/:id/:codigo.",l();return}try{if(!A||!q)throw new Error("Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no projeto da Vercel.");t.supabase=P();const[n,a,e,o]=await Promise.all([t.supabase.rpc("get_public_table_by_qr",{p_table_id:r.tableId,p_table_code:r.tableCode}),t.supabase.rpc("get_public_menu_products"),t.supabase.rpc("get_public_menu_categories"),t.supabase.rpc("get_public_store_settings")]);if(n.error)throw n.error;if(a.error)throw a.error;if(e.error)throw e.error;if(o.error)throw o.error;const u=(s=n.data)==null?void 0:s[0];if(!u){t.loading=!1,t.error="Mesa não encontrada. Verifique se o QR Code foi gerado corretamente.",l();return}t.table=u,t.products=(a.data??[]).map(d=>({id:d.id,name:d.name,description:d.description??"",price:Number(d.price),category:d.category,stock:Number(d.stock),image:d.image??""}));const p=new Map((e.data??[]).map(d=>[d.name,Number(d.sort_order)])),m=new Set([...(e.data??[]).map(d=>d.name),...t.products.map(d=>d.category)]);t.categories=[...m].sort((d,E)=>(p.get(d)??999)-(p.get(E)??999));const g=(i=o.data)==null?void 0:i[0];g&&(t.store.storeName=g.store_name??t.store.storeName,t.store.logoEmoji=g.logo_emoji??t.store.logoEmoji,t.store.logoUrl=g.logo_url??null),t.loading=!1,l()}catch(n){console.error(n),t.loading=!1,t.error=n instanceof Error&&n.message.includes("VITE_SUPABASE")?n.message:"Não foi possível carregar o cardápio agora. Tente novamente em instantes.",l()}}l();U();
