(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const e of s)if(e.type==="childList")for(const r of e.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function i(s){const e={};return s.integrity&&(e.integrity=s.integrity),s.referrerPolicy&&(e.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?e.credentials="include":s.crossOrigin==="anonymous"?e.credentials="omit":e.credentials="same-origin",e}function n(s){if(s.ep)return;s.ep=!0;const e=i(s);fetch(s.href,e)}})();const b=document.querySelector("#app"),t={loading:!0,error:"",step:"intro",table:null,storeName:"Cardapio Digital",logoEmoji:"🥟",logoUrl:null,products:[],categories:[],cart:[],customerName:"",customerPhone:"",sending:!1,statusMessage:"Aguardando preenchimento do cliente.",supabase:null};function _(o){return String(o||"").replace(/\D/g,"").slice(0,11)}function N(o){const a=_(o);return a.length<=2?a:a.length<=6?`(${a.slice(0,2)}) ${a.slice(2)}`:a.length<=10?`(${a.slice(0,2)}) ${a.slice(2,6)}-${a.slice(6)}`:`(${a.slice(0,2)}) ${a.slice(2,7)}-${a.slice(7)}`}function f(o){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(o)}function c(o){return String(o).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function E(){const i=(new URLSearchParams(window.location.search).get("path")||window.location.pathname).trim().split("/").filter(Boolean),n=i.indexOf("mesa");if(n===-1||i.length<n+3)return null;const s=Number(i[n+1]),e=i[n+2];return!Number.isInteger(s)||!e?null:{tableId:s,tableCode:e}}function y(o,a=[]){return`${o}:${a.map(i=>i.id).sort().join(",")}`}function h(){return t.cart.reduce((o,a)=>o+a.quantity,0)}function $(){return t.cart.reduce((o,a)=>{const i=a.complements.reduce((n,s)=>n+Number(s.price),0);return o+(Number(a.product.price)+i)*a.quantity},0)}function A(){throw new Error("Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY na Vercel.")}function l(){var n,s;if(!b)return;if(t.loading){b.innerHTML=`
      <main class="shell">
        <section class="page">
          <div class="loading card">
            <strong>Carregando cardápio...</strong>
            <p class="muted">Estamos validando a mesa e buscando os produtos.</p>
          </div>
        </section>
      </main>
    `,v();return}if(t.error){b.innerHTML=`
      <main class="shell">
        <section class="page">
          <div class="error card">
            <strong>Não foi possível abrir a mesa</strong>
            <p class="muted">${c(t.error)}</p>
          </div>
        </section>
      </main>
    `,v();return}if(t.step==="sent"){b.innerHTML=`
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
    `,v();return}if(t.step==="cart"){const e=t.cart.map(r=>{const d=r.complements.reduce((p,m)=>p+Number(m.price),0);return`
          <article class="cart-item">
            <div class="cart-image">
              ${r.product.image?`<img src="${c(r.product.image)}" alt="${c(r.product.name)}">`:""}
            </div>
            <div class="cart-main">
              <p class="cart-name">${c(r.product.name)}</p>
              ${r.complements.length?`<p class="cart-meta">+ ${r.complements.map(p=>c(p.name)).join(", ")}</p>`:""}
              <p class="cart-price">${f((Number(r.product.price)+d)*r.quantity)}</p>
            </div>
            <div class="cart-controls">
              <button type="button" class="mini-button" data-action="decrease-cart" data-key="${c(y(r.product.id,r.complements))}">-</button>
              <span class="mini-count">${r.quantity}</span>
              <button type="button" class="mini-button" data-action="increase-cart" data-key="${c(y(r.product.id,r.complements))}">+</button>
            </div>
          </article>
        `}).join("");b.innerHTML=`
      <main class="shell">
        <section class="page menu-shell">
          <header class="menu-header">
            <div class="store-brand">
              <div class="store-logo">
                ${t.logoUrl?`<img src="${c(t.logoUrl)}" alt="Logo">`:`<span>${c(t.logoEmoji)}</span>`}
              </div>
              <div>
                <h1 class="store-title">${c(t.storeName)}</h1>
                <p class="store-subtitle">${c(((n=t.table)==null?void 0:n.name)||"Mesa")} • ${c(t.customerName)}</p>
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
                <span class="summary-total">${f($())}</span>
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
    `,v();return}const o=t.categories.map(e=>{const r=t.products.filter(d=>d.category===e);return r.length?`
        <section class="category">
          <h3 class="category-title">${c(e)}</h3>
          <div class="products">
            ${r.map(d=>{const p=t.cart.find(u=>u.product.id===d.id&&u.complements.length===0),m=p?p.quantity:0,g=d.stock>0;return`
                  <article class="product-card">
                    <div class="product-image">
                      ${d.image?`<img src="${c(d.image)}" alt="${c(d.name)}">`:`<span>${c(d.name.slice(0,1).toUpperCase())}</span>`}
                    </div>
                    <div class="product-main">
                      <p class="product-name">${c(d.name)}</p>
                      ${d.description?`<p class="product-desc">${c(d.description)}</p>`:""}
                      <div class="product-price">${g?f(d.price):"Indisponível"}</div>
                    </div>
                    <div class="product-actions">
                      ${g?m>0?`
                              <button type="button" class="mini-button" data-action="decrease-product" data-product-id="${d.id}">-</button>
                              <span class="mini-count">${m}</span>
                              <button type="button" class="mini-button" data-action="increase-product" data-product-id="${d.id}">+</button>
                            `:`
                              <button type="button" class="secondary-button" data-action="add-product" data-product-id="${d.id}">Adicionar</button>
                            `:'<span class="muted">Sem estoque</span>'}
                    </div>
                  </article>
                `}).join("")}
          </div>
        </section>
      `:""}).join(""),a=t.products.filter(e=>!t.categories.includes(e.category)),i=a.length?`
      <section class="category">
        <h3 class="category-title">Outros</h3>
        <div class="products">
          ${a.map(e=>{const r=t.cart.find(m=>m.product.id===e.id&&m.complements.length===0),d=r?r.quantity:0,p=e.stock>0;return`
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
                    ${p?d>0?`
                            <button type="button" class="mini-button" data-action="decrease-product" data-product-id="${e.id}">-</button>
                            <span class="mini-count">${d}</span>
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
              ${t.logoUrl?`<img src="${c(t.logoUrl)}" alt="Logo">`:`<span>${c(t.logoEmoji)}</span>`}
            </div>
            <div>
              <h1 class="store-title">${c(t.storeName)}</h1>
              <p class="store-subtitle">${c(((s=t.table)==null?void 0:s.name)||"Mesa")} • ${c(t.customerName)}</p>
            </div>
          </div>
          <div class="cart-chip">Carrinho: ${h()} itens</div>
        </header>

        <section class="card">
          <p class="eyebrow">Cardápio</p>
          <h2 class="section-title">Escolha seus produtos</h2>
          <p class="card-description">Toque em adicionar para montar o pedido.</p>
          <div style="display: grid; gap: 16px; margin-top: 18px;">
            ${o||""}
            ${i}
            ${!o&&!i?'<div class="empty-box">Nenhum produto disponível no momento.</div>':""}
          </div>
        </section>

        ${h()>0?`
          <button type="button" class="floating-cart" data-action="open-cart">
            <span>Ver Carrinho (${h()})</span>
            <strong>${f($())}</strong>
          </button>
        `:""}

        <section class="status-panel">
          <p class="status-label">Status</p>
          <p class="status-message">${c(t.statusMessage)}</p>
        </section>
      </section>
    </main>
  `,v()}function v(){const o=document.querySelector("#customer-name"),a=document.querySelector("#customer-phone"),i=document.querySelector("#customer-form");o&&o.addEventListener("input",n=>{t.customerName=n.target.value,l()}),a&&a.addEventListener("input",n=>{t.customerPhone=N(n.target.value),n.target.value=t.customerPhone}),i&&i.addEventListener("submit",n=>{if(n.preventDefault(),!t.customerName.trim()||_(t.customerPhone).length<10){t.statusMessage="Preencha nome e celular com um número válido antes de continuar.",l();return}t.step="menu",t.statusMessage="Cliente identificado. Agora escolha seus produtos.",l()}),document.querySelectorAll("[data-action]").forEach(n=>{n.addEventListener("click",w)})}async function w(o){const a=o.currentTarget.getAttribute("data-action"),i=o.currentTarget.getAttribute("data-product-id"),n=o.currentTarget.getAttribute("data-key");if(a==="new-order"||a==="back-menu"){t.step="menu",l();return}if(a==="open-cart"){t.step="cart",l();return}if(a==="send-order"){await L();return}if(a==="add-product"||a==="increase-product"){const s=t.products.find(r=>r.id===i);if(!s)return;const e=t.cart.find(r=>r.product.id===i&&r.complements.length===0);if(e){if(e.quantity>=s.stock){t.statusMessage="Estoque insuficiente para adicionar mais unidades.",l();return}e.quantity+=1}else t.cart.push({product:s,quantity:1,complements:[]});t.statusMessage="Produto adicionado ao carrinho.",l();return}if(a==="decrease-product"){const s=t.cart.find(e=>e.product.id===i&&e.complements.length===0);if(!s)return;s.quantity-=1,t.cart=t.cart.filter(e=>e.quantity>0),l();return}if(a==="increase-cart"||a==="decrease-cart"){const s=t.cart.find(e=>y(e.product.id,e.complements)===n);if(!s)return;if(a==="increase-cart"&&s.quantity>=Number(s.product.stock)){t.statusMessage="Estoque insuficiente para adicionar mais unidades.",l();return}s.quantity+=a==="increase-cart"?1:-1,t.cart=t.cart.filter(e=>e.quantity>0),l()}}async function L(){if(!t.supabase||!t.table||t.cart.length===0)return;t.sending=!0,t.statusMessage="Enviando pedido...",l();const o={table_id:t.table.id,table_name:t.table.name,customer_name:t.customerName.trim(),customer_phone:_(t.customerPhone),items:t.cart.map(i=>({product_id:i.product.id,product_name:i.product.name,product_price:i.product.price,quantity:i.quantity,complements:[]})),total:$(),status:"pending",source:"customer"},{error:a}=await t.supabase.from("customer_orders").insert(o);if(t.sending=!1,a){console.error(a),t.statusMessage="Erro ao enviar o pedido. Tente novamente.",l();return}t.step="sent",t.cart=[],t.statusMessage="Pedido enviado com sucesso.",l()}async function M(){var a,i;const o=E();if(!o){t.loading=!1,t.error="A URL da mesa está incompleta. Use o QR Code com /mesa/:id/:codigo.",l();return}try{t.supabase=A();const[n,s,e,r]=await Promise.all([t.supabase.rpc("get_public_table_by_qr",{p_table_id:o.tableId,p_table_code:o.tableCode}),t.supabase.rpc("get_public_menu_products"),t.supabase.rpc("get_public_menu_categories"),t.supabase.rpc("get_public_store_settings")]);if(n.error)throw n.error;if(s.error)throw s.error;if(e.error)throw e.error;if(r.error)throw r.error;const d=(a=n.data)==null?void 0:a[0];if(!d){t.loading=!1,t.error="Mesa não encontrada. Verifique se o QR Code foi gerado corretamente.",l();return}t.table={id:Number(d.id),name:d.name,code:o.tableCode},t.products=(s.data??[]).map(u=>({id:u.id,name:u.name,description:u.description??"",price:Number(u.price),category:u.category,stock:Number(u.stock),image:u.image??""}));const p=new Map((e.data??[]).map(u=>[u.name,Number(u.sort_order)])),m=new Set([...(e.data??[]).map(u=>u.name),...t.products.map(u=>u.category)]);t.categories=[...m].sort((u,q)=>(p.get(u)??999)-(p.get(q)??999));const g=(i=r.data)==null?void 0:i[0];g&&(t.storeName=g.store_name??t.storeName,t.logoEmoji=g.logo_emoji??t.logoEmoji,t.logoUrl=g.logo_url??null),t.loading=!1,l()}catch(n){console.error(n),t.loading=!1,t.error=n instanceof Error&&n.message.includes("VITE_SUPABASE")?n.message:"Não foi possível carregar o cardápio agora. Tente novamente em instantes.",l()}}l();M();
