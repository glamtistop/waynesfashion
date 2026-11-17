/* Wayne's Fashion — single-page site. All content lives in data.json (editable in /admin/). */
(() => {
'use strict';
const LS_DATA = 'wf_data', LS_CART = 'wf_cart', LS_ORDERS = 'wf_orders';
let D = null;
let cart = load(LS_CART, []);
const $ = (s, el = document) => el.querySelector(s);
const app = $('#app');

function load(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { alert('Could not save (storage full?). Try smaller images.'); } }
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = v => (v === '' || v == null || isNaN(+v)) ? null : +v;
const money = v => num(v) == null ? 'Price TBA' : '$' + (+v).toFixed(2);
const telHref = p => 'tel:' + String(p).replace(/[^\d+]/g, '');

async function init() {
  const local = load(LS_DATA, null);
  if (local) D = local;
  else {
    try { D = await (await fetch('/data.json', { cache: 'no-cache' })).json(); }
    catch { app.innerHTML = '<div class="card warn">Could not load site data. Please open the site through a web server.</div>'; return; }
  }
  $('#menuBtn').onclick = () => { const n = $('#nav'); n.classList.toggle('open'); $('#menuBtn').setAttribute('aria-expanded', n.classList.contains('open')); };
  window.addEventListener('popstate', route);
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="/"]');
    if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey || a.hasAttribute('download')) return;
    e.preventDefault(); go(a.getAttribute('href'));
  });
  chrome(); route();
}

function chrome() {
  const s = D.site;
  $('#announce').textContent = s.announcement || '';
  if (s.logo) { $('#logoImg').src = s.logo; $('#logoImg').alt = s.name; $('#logoImg').hidden = false; $('#logoText').hidden = true; }
  else { $('#logoImg').hidden = true; $('#logoText').hidden = false; }
  const navCats = D.categories.filter(c => c.showInNav);
  $('#nav').innerHTML = [
    ['/', 'Home'], ...(D.trees.enabled ? [['/christmas-trees/', '🎄 Christmas Trees', 'tree']] : []),
    ['/shop/', 'Shop All'], ...navCats.map(c => ['/' + c.id + '/', c.title]),
    ['/request-an-item/', 'Request an Item'], ['/cart/', '🛒 Cart (' + cart.length + ')'], ['/contact/', 'Contact']
  ].map(([h, t, cls]) => `<a href="${h}" class="${cls || ''}">${esc(t)}</a>`).join('');
  $('#footer').innerHTML = `
    <div class="script" style="font-size:1.4rem">${esc(s.name)}</div>
    <div class="slogan" style="font-size:1rem">${esc(s.slogan)}</div>
    <p>${esc(s.address)} • <a href="${telHref(s.phone)}">${esc(s.phone)}</a> • <a href="mailto:${esc(s.email)}">${esc(s.email)}</a></p>
    <p><a href="/request-an-item/">Request an Item</a><a href="/contact/">Contact</a><a href="/privacy-policy/">Privacy Policy</a><a href="/refund-policy/">Refund Policy</a><a href="/admin/">Admin</a></p>
    <p>© ${new Date().getFullYear()} ${esc(s.name)}. ${esc(s.est)}</p>`;
}

function go(url) { history.pushState(null, '', url); route(); }
function route() {
  const path = location.pathname.replace(/index\.html$/, ''), seg = path.split('/').filter(Boolean)[0] || '';
  $('#nav').classList.remove('open'); $('#menuBtn').setAttribute('aria-expanded', 'false');
  const key = '/' + (seg ? seg + '/' : '');
  document.querySelectorAll('#nav a').forEach(x => { const on = x.getAttribute('href') === key; x.classList.toggle('active', on); on ? x.setAttribute('aria-current', 'page') : x.removeAttribute('aria-current'); });
  const fixed = { '': home, shop, 'christmas-trees': trees, 'request-an-item': inquiry, cart: cartPage, checkout, contact,
    'privacy-policy': () => policy('Privacy Policy', D.policies.privacy), 'refund-policy': () => policy('Refund Policy', D.policies.refund),
    order: () => orderDone(new URLSearchParams(location.search).get('id')), admin };
  if (fixed[seg]) fixed[seg](); else if (D.categories.some(c => c.id === seg)) category(seg); else notFound();
  meta(key);
  window.scrollTo(0, 0); app.focus({ preventScroll: true });
}
function meta(key) {
  const pg = WF_SEO.pages(D).find(p => p.path === key) || { title: "Page not found | Wayne's Fashion", desc: '', noindex: true };
  document.title = pg.title;
  const set = (sel, attr, val) => { const el = document.head.querySelector(sel); if (el) el.setAttribute(attr, val); };
  set('meta[name="description"]', 'content', pg.desc); set('meta[property="og:title"]', 'content', pg.title);
  set('meta[property="og:description"]', 'content', pg.desc); set('meta[property="og:url"]', 'content', WF_SEO.DOMAIN + key);
  set('link[rel="canonical"]', 'href', WF_SEO.DOMAIN + key); set('meta[name="robots"]', 'content', pg.noindex ? 'noindex,nofollow' : 'index,follow');
}
function notFound() { app.innerHTML = `<h1>Page not found</h1><div class="card">That page doesn't exist. <a href="/">Go to the home page</a> or <a href="/shop/">shop all departments</a>.</div>`; }

/* ---------- Public pages ---------- */
function tiles(cats) {
  return `<div class="grid">${cats.map(c => `<a class="tile" href="/${c.id}/" style="background:linear-gradient(160deg,${c.color},#000)">
    <h3>${esc(c.title)}</h3><small>${esc(c.subtitle)}</small></a>`).join('')}
    ${D.trees.enabled ? `<a class="tile" href="/christmas-trees/" style="background:linear-gradient(160deg,#1b5e20,#000)"><h3>🎄 Christmas Trees</h3><small>Pickup • Delivery • Ship (CA)</small></a>` : ''}</div>`;
}
function home() {
  const s = D.site;
  app.innerHTML = `
  <section class="hero">
    <span class="est">★ ${esc(s.est)} ★</span>
    <h1 class="hero-title">${s.logo ? `<img src="${esc(s.logo)}" alt="${esc(s.name)} — Altadena clothing store and custom screen printing" style="max-height:220px;margin:12px auto">` : `<span class="script">Wayne's</span> <span class="block">FASHION</span>`}</h1>
    <div class="slogan">${esc(s.slogan)}</div>
    <p style="max-width:640px;margin:10px auto">${esc(s.heroText)}</p>
    <div class="tagline">${esc(s.tagline)}</div>
    <p style="margin-top:16px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
      ${D.trees.enabled ? `<a class="btn" href="/christmas-trees/">🎄 Order a Christmas Tree</a>` : ''}<a class="btn gold" href="/shop/">Shop Now</a><a class="btn ghost" href="/request-an-item/">Request an Item</a></p>
  </section>
  ${tiles(D.categories.filter(c => c.showInNav))}
  <div class="infobar"><span>📍 ${esc(s.address)}</span><a href="${telHref(s.phone)}">📞 ${esc(s.phone)}</a><span>🌐 ${esc(s.website)}</span></div>
  <div class="card cta"><div><h2>Looking for something specific?</h2><p>A certain size, team, color or a custom print? Tell us what you need and we'll get back to you with price and availability.</p></div><a class="btn" href="/request-an-item/">Request an Item →</a></div>
  <div class="card"><h2>How ordering works</h2>
   <p>1. Choose your items or tree • 2. Pick <b>Pickup</b>, <b>Local Delivery</b> or <b>Ship (California)</b> • 3. Pay with Zelle, Venmo, Cash App or card (Square) • 4. We confirm by text/email and coordinate your time.</p></div>`;
}
function shop() {
  app.innerHTML = `<div class="page-head"><h1>Shop All Departments</h1><p class="note">Every department at Wayne's Fashion.</p></div>
  ${tiles(D.categories)}
  ${D.categories.map(c => c.products.length ? `<h2>${esc(c.title)}</h2>${productGrid(c)}` : '').join('')}`;
  bindAdd();
}
function productGrid(c) {
  if (!c.products.length) return `<div class="card note"><p>We're adding products to this section. Don't see what you want?</p><a class="btn" href="/request-an-item/?dept=${encodeURIComponent(c.title)}">Request an Item from ${esc(c.title)}</a> <a class="btn ghost" href="${telHref(D.site.phone)}">Call ${esc(D.site.phone)}</a></div>`;
  return `<div class="products">${c.products.map((p, i) => `<div class="product">
    <div class="img">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">` : '👕'}</div>
    <div class="body"><b>${esc(p.name)}</b><span class="note">${esc(p.description || '')}</span>
    <span class="price">${money(p.price)}</span>
    ${p.options ? `<select data-opt="${c.id}:${i}" aria-label="Option">${p.options.split(',').map(o => `<option>${esc(o.trim())}</option>`).join('')}</select>` : ''}
    ${p.soldOut ? '<span class="warn">Sold out</span>' : `<button class="btn small" data-add="${c.id}:${i}">Add to Cart</button>`}
    <a class="note" href="/request-an-item/?dept=${encodeURIComponent(c.title)}&item=${encodeURIComponent(p.name)}">Ask about this item</a></div></div>`).join('')}</div>`;
}
function bindAdd() {
  app.querySelectorAll('[data-add]').forEach(b => b.onclick = () => {
    const [cid, i] = b.dataset.add.split(':'); const c = D.categories.find(x => x.id === cid); const p = c.products[i];
    const opt = app.querySelector(`[data-opt="${cid}:${i}"]`)?.value || '';
    cart.push({ kind: 'product', name: p.name + (opt ? ' — ' + opt : ''), section: c.title, price: num(p.price), qty: 1 });
    save(LS_CART, cart); chrome(); b.textContent = 'Added ✓'; setTimeout(() => b.textContent = 'Add to Cart', 1200);
  });
}
function category(id) {
  const c = D.categories.find(x => x.id === id);
  if (!c) return home();
  app.innerHTML = `<div class="page-head" style="border-color:${c.color}"><h1>${esc(c.title)}</h1><p><b>${esc(c.subtitle)}</b></p><p>${esc(c.description)}</p></div>
  ${id === 'screen-printing' ? `<div class="card"><h2>Request a custom print quote</h2><p>Send us your design, quantity and sizes. <a class="btn small" href="/request-an-item/?dept=${encodeURIComponent(c.title)}">Request a Quote</a> <a class="btn small gold" href="${telHref(D.site.phone)}">Call</a></p></div>` : ''}
  ${productGrid(c)}
  ${c.products.length ? `<div class="card cta"><div><h2>Don't see it?</h2><p>Ask us — we can often get it or make it.</p></div><a class="btn" href="/request-an-item/?dept=${encodeURIComponent(c.title)}">Request an Item →</a></div>` : ''}`;
  bindAdd();
}

/* ---------- Christmas trees ---------- */
function trees() {
  const T = D.trees;
  if (!T.enabled) return home();
  app.innerHTML = `<div class="page-head" style="border-color:#2e7d32"><h1>🎄 Christmas Tree Lot</h1>
  <p>${esc(T.intro)}</p><p class="note">Lot opens <b>${fmtDate(T.openDate)}</b> at ${esc(D.site.address)}.</p></div>
  <form id="treeForm" class="card">
    <h3>1. Choose your tree</h3>
    <div class="choices">${T.types.map((t, i) => `<label class="choice"><input type="radio" name="type" value="${i}" ${i ? '' : 'checked'}><span>
      ${t.image ? `<img src="${esc(t.image)}" alt="" style="border-radius:8px;margin-bottom:6px">` : '🌲'} <b>${esc(t.name)}</b><span class="note">${esc(t.description)}</span></span></label>`).join('')}</div>
    <h3>2. Choose the height</h3>
    <div class="choices" id="heights"></div>
    <h3>3. Tree stand</h3>
    <div class="choices">
      <label class="choice"><input type="radio" name="stand" value="none" checked><span><b>No stand</b><span class="note">Tree only</span></span></label>
      <label class="choice"><input type="radio" name="stand" value="buy"><span><b>With stand (put on)</b><span class="note">We supply the stand and mount it ${num(T.standPrice) != null ? '+' + money(T.standPrice) : ''}</span></span></label>
      <label class="choice"><input type="radio" name="stand" value="own"><span><b>Put on my own stand</b><span class="note">Bring/have your stand ready ${num(T.standInstallPrice) != null ? '+' + money(T.standInstallPrice) : ''}</span></span></label>
    </div>
    <label for="tqty">Quantity</label><input id="tqty" type="number" min="1" max="20" value="1" inputmode="numeric">
    <div class="summary"><div class="total" id="treeTotal"></div><button class="btn" type="submit" style="width:100%;margin-top:8px">Add Tree & Continue to Checkout →</button></div>
  </form>`;
  const f = $('#treeForm');
  const drawHeights = () => {
    const ti = +f.type.value, cur = f.height?.value || 0;
    $('#heights').innerHTML = T.heights.map((h, i) => `<label class="choice"><input type="radio" name="height" value="${i}" ${+cur === i ? 'checked' : ''}><span><b>${esc(h.label)}</b><span class="price">${money(h.prices?.[T.types[ti].name])}</span></span></label>`).join('');
  };
  const calc = () => {
    const it = treeItem(f); $('#treeTotal').textContent = it.price == null ? 'Price confirmed by our team' : 'Subtotal: ' + money(it.price * it.qty);
  };
  drawHeights(); calc();
  f.addEventListener('change', e => { if (e.target.name === 'type') drawHeights(); calc(); });
  f.addEventListener('input', calc);
  f.onsubmit = e => { e.preventDefault(); cart.push(treeItem(f)); save(LS_CART, cart); chrome(); go('/checkout/'); };
}
function treeItem(f) {
  const T = D.trees, t = T.types[+f.type.value], h = T.heights[+(f.height?.value || 0)], stand = f.stand.value;
  const base = num(h.prices?.[t.name]);
  const extra = stand === 'buy' ? num(T.standPrice) : stand === 'own' ? num(T.standInstallPrice) : 0;
  const price = base == null || (stand !== 'none' && extra == null) ? null : base + (extra || 0);
  const standTxt = { none: 'No stand', buy: 'With stand — put on by us', own: 'Put on customer\'s own stand' }[stand];
  return { kind: 'tree', name: `${t.name} Christmas Tree — ${h.label}`, section: 'Christmas Trees', stand: standTxt, price, qty: Math.max(1, +$('#tqty').value || 1) };
}

/* ---------- Cart & checkout ---------- */
function totals() {
  const f = D.fulfillment; let sub = 0, tba = false;
  cart.forEach(i => i.price == null ? tba = true : sub += i.price * i.qty);
  return { sub, tba, f };
}
function cartPage() {
  if (!cart.length) { app.innerHTML = `<h1>Your Cart</h1><div class="card">Your cart is empty. <a href="/shop/">Shop now</a>${D.trees.enabled ? ' or <a href="/christmas-trees/">order a Christmas tree</a>' : ''}.</div>`; return; }
  const { sub, tba } = totals();
  app.innerHTML = `<h1>Your Cart</h1><div class="card scroll-x"><table class="admin"><tr><th>Item</th><th>Qty</th><th>Price</th><th></th></tr>
  ${cart.map((i, k) => `<tr><td><b>${esc(i.name)}</b>${i.stand ? `<br><span class="note">${esc(i.stand)}</span>` : ''}</td><td><input type="number" min="1" value="${i.qty}" data-q="${k}" style="width:70px"></td><td>${money(i.price)}</td><td><button class="btn small ghost" data-rm="${k}">Remove</button></td></tr>`).join('')}
  </table><p class="total">Subtotal: ${money(sub)}${tba ? ' + items priced by our team' : ''}</p>
  <a class="btn" href="/checkout/">Checkout →</a> <a class="btn ghost" href="/shop/">Keep shopping</a></div>`;
  app.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { cart.splice(+b.dataset.rm, 1); save(LS_CART, cart); chrome(); cartPage(); });
  app.querySelectorAll('[data-q]').forEach(b => b.onchange = () => { cart[+b.dataset.q].qty = Math.max(1, +b.value || 1); save(LS_CART, cart); cartPage(); });
}
function minDate() { const d = new Date(Date.now() + (D.fulfillment.leadHours || 24) * 3600e3); return d; }
function isoLocal(d) { return new Date(d - d.getTimezoneOffset() * 60e3).toISOString().slice(0, 10); }
function fmtDate(s) { if (!s) return ''; const d = new Date(s + 'T12:00'); return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); }

function checkout() {
  if (!cart.length) return cartPage();
  const F = D.fulfillment, hasTree = cart.some(i => i.kind === 'tree');
  // earliest whole day that is fully 24h+ away (or the lot opening day for trees)
  const md = minDate(); md.setDate(md.getDate() + (md.getHours() || md.getMinutes() ? 1 : 0));
  let earliest = isoLocal(md);
  if (hasTree && D.trees.openDate && D.trees.openDate > earliest) earliest = D.trees.openDate;
  const opts = [
    F.pickupEnabled && ['pickup', 'Pick up at store', F.pickupNote, 0],
    F.deliveryEnabled && ['delivery', `Local Delivery (+${money(F.deliveryFee)})`, F.deliveryNote, num(F.deliveryFee)],
    F.shipEnabled && ['ship', `Ship within California${num(F.shipFee) != null ? ' (+' + money(F.shipFee) + ')' : ''}`, F.shipNote, num(F.shipFee)]
  ].filter(Boolean);
  app.innerHTML = `<h1>Checkout</h1>
  <form id="co" class="card" novalidate>
    <h3>1. How do you want to get your order?</h3>
    <div class="choices">${opts.map(([v, t, n], i) => `<label class="choice"><input type="radio" name="method" value="${v}" ${i ? '' : 'checked'}><span><b>${esc(t)}</b><span class="note">${esc(n)}</span></span></label>`).join('')}</div>
    <h3>2. Your information</h3>
    <div class="row"><div><label for="name">Full name *</label><input id="name" name="name" autocomplete="name" required></div>
    <div><label for="phone">Mobile phone (for text updates) *</label><input id="phone" name="phone" type="tel" autocomplete="tel" required></div></div>
    <label for="email">Email *</label><input id="email" name="email" type="email" autocomplete="email" required>
    <div id="addr">
      <label for="street">Street address *</label><input id="street" name="street" autocomplete="street-address">
      <div class="row"><div><label for="unit">Apt / Unit / Gate code</label><input id="unit" name="unit"></div><div><label for="city">City *</label><input id="city" name="city" autocomplete="address-level2"></div></div>
      <div class="row"><div><label for="state">State *</label><input id="state" name="state" value="CA" autocomplete="address-level1"></div><div><label for="zip">ZIP code *</label><input id="zip" name="zip" inputmode="numeric" maxlength="5" autocomplete="postal-code"></div></div>
      <div id="zipMsg" style="margin-top:8px"></div>
    </div>
    <h3>3. Date & time</h3>
    <p class="note">Orders must be placed at least ${F.leadHours || 24} hours in advance.</p>
    <label for="date">Preferred date *</label><input id="date" name="date" type="date" min="${earliest}" required>
    <div class="choices" style="margin-top:10px"><label class="choice"><input type="radio" name="ampm" value="AM" checked><span><b>AM</b><span class="note">Morning</span></span></label>
      <label class="choice"><input type="radio" name="ampm" value="PM"><span><b>PM</b><span class="note">Afternoon / evening</span></span></label></div>
    <p class="note" id="timeNote"></p>
    <label for="details">Delivery / order details</label><textarea id="details" name="details" placeholder="Gate code, where to leave the tree, which room, parking notes, sizes, colors..."></textarea>
    ${hasTree ? `<p class="note">Stand choice for each tree is listed in your order summary below.</p>` : ''}
    <h3>4. Payment method</h3>
    <div class="choices">${D.payments.map((p, i) => `<label class="choice"><input type="radio" name="pay" value="${i}" ${i ? '' : 'checked'}><span><b>${esc(p.name)}</b></span></label>`).join('')}</div>
    <p class="note">${esc(D.paymentInstructions)}</p>
    <label class="choice" style="margin-top:12px"><input type="checkbox" name="agree" required><span>I agree to receive order texts and accept the <a href="/refund-policy/">Refund Policy</a> and <a href="/privacy-policy/">Privacy Policy</a>. *</span></label>
    <div class="summary"><div id="sumLines" class="note"></div><div class="total" id="coTotal"></div>
      <div id="coErr"></div><button class="btn" type="submit" style="width:100%;margin-top:8px">Place Order & Go to Payment →</button></div>
  </form>`;
  const f = $('#co');
  const upd = () => {
    const m = f.method.value, o = opts.find(x => x[0] === m), { sub, tba } = totals();
    $('#addr').classList.toggle('hidden', m === 'pickup');
    $('#timeNote').textContent = m === 'delivery' ? 'After payment we will text you the available delivery windows for your AM/PM choice, and again when we are on the way.' : m === 'pickup' ? 'We will text you when your order is ready for pickup.' : 'We will email tracking once shipped.';
    const z = f.zip.value.trim(); let zm = '';
    if (m === 'delivery' && z.length === 5) zm = F.deliveryZips.includes(z) ? '<div class="ok">✓ We deliver to ' + esc(z) + '</div>' : '<div class="warn">Sorry, ' + esc(z) + ' is outside our delivery area (5 mi of 91001 / 3 mi of 90015). Choose pickup or California shipping.</div>';
    if (m === 'ship' && f.state.value.trim() && !/^(ca|california)$/i.test(f.state.value.trim())) zm = '<div class="warn">Shipping is available within California only.</div>';
    $('#zipMsg').innerHTML = zm;
    const fee = o[3];
    $('#sumLines').innerHTML = cart.map(i => `${i.qty} × ${esc(i.name)}${i.stand ? ' (' + esc(i.stand) + ')' : ''} — ${money(i.price)}`).join('<br>') + `<br>${esc(o[1])}`;
    $('#coTotal').textContent = (tba || (m !== 'pickup' && fee == null)) ? 'Total: ' + money(sub + (fee || 0)) + ' + amount confirmed by our team' : 'Total: ' + money(sub + (fee || 0));
  };
  f.addEventListener('input', upd); f.addEventListener('change', upd); upd();
  f.onsubmit = async e => {
    e.preventDefault();
    const m = f.method.value, err = [];
    ['name', 'phone', 'email', 'date'].forEach(k => !f[k].value.trim() && err.push(k));
    if (f.email.value && !/^\S+@\S+\.\S+$/.test(f.email.value)) err.push('valid email');
    if (m !== 'pickup') ['street', 'city', 'state', 'zip'].forEach(k => !f[k].value.trim() && err.push(k));
    if (m === 'delivery' && !F.deliveryZips.includes(f.zip.value.trim())) err.push('ZIP inside delivery area');
    if (m === 'ship' && !/^(ca|california)$/i.test(f.state.value.trim())) err.push('California address');
    if (f.date.value && f.date.value < earliest) err.push('date at least 24 hours away');
    if (!f.agree.checked) err.push('agreement checkbox');
    if (err.length) { $('#coErr').innerHTML = '<div class="warn">Please complete: ' + esc(err.join(', ')) + '</div>'; return; }
    const o = opts.find(x => x[0] === m), { sub, tba } = totals(), fee = o[3] || 0;
    const id = 'WF' + Date.now().toString(36).toUpperCase().slice(-6);
    const order = {
      id, created: new Date().toLocaleString(), status: 'Awaiting payment',
      customer: { name: f.name.value.trim(), phone: f.phone.value.trim(), email: f.email.value.trim() },
      method: o[1], address: m === 'pickup' ? '' : `${f.street.value} ${f.unit.value}, ${f.city.value}, ${f.state.value} ${f.zip.value}`.replace(/\s+/g, ' '),
      date: f.date.value, ampm: f.ampm.value, details: f.details.value.trim(), payment: D.payments[+f.pay.value].name, pay: +f.pay.value,
      items: cart.map(i => ({ ...i })), subtotal: sub, fee, total: sub + fee, priceTBA: tba || (m !== 'pickup' && o[3] == null)
    };
    const all = load(LS_ORDERS, []); all.unshift(order); save(LS_ORDERS, all);
    sendOrder(order);
    cart = []; save(LS_CART, cart); chrome(); go('/order/?id=' + id);
  };
}
function orderText(o) {
  return `ORDER ${o.id}\nPlaced: ${o.created}\n\nName: ${o.customer.name}\nPhone: ${o.customer.phone}\nEmail: ${o.customer.email}\n\nMethod: ${o.method}\n${o.address ? 'Address: ' + o.address + '\n' : ''}Date: ${fmtDate(o.date)} — ${o.ampm}\nDetails: ${o.details || '-'}\n\nItems:\n${o.items.map(i => `- ${i.qty} x ${i.name}${i.stand ? ' [' + i.stand + ']' : ''} — ${money(i.price)}`).join('\n')}\n\nSubtotal: ${money(o.subtotal)}\nDelivery/Shipping: ${money(o.fee)}\nTOTAL: ${money(o.total)}${o.priceTBA ? ' (+ amount to be confirmed)' : ''}\nPayment method: ${o.payment}`;
}
async function sendOrder(o) {
  const ep = D.site.orderEndpoint;
  if (!ep) return;
  try {
    await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ _subject: `New order ${o.id} — ${o.customer.name}`, email: o.customer.email, order_id: o.id, order: orderText(o) }) });
  } catch { /* customer still has the email button on the confirmation page */ }
}
function orderDone(id) {
  const o = load(LS_ORDERS, []).find(x => x.id === id);
  if (!o) return home();
  const p = D.payments[o.pay] || D.payments[0];
  const mail = `mailto:${D.site.email}?subject=${encodeURIComponent('Payment confirmation — Order ' + o.id)}&body=${encodeURIComponent(orderText(o) + '\n\n--- Please attach your payment screenshot ---')}`;
  app.innerHTML = `<h1>Thank you, ${esc(o.customer.name.split(' ')[0])}! 🎉</h1>
  <div class="card ok"><b>Order #${esc(o.id)}</b> received. Status: <b>awaiting payment</b>. Your order is confirmed once payment is verified.</div>
  <div class="card"><h3>Step 1 — Pay ${o.priceTBA ? '' : money(o.total)} with ${esc(p.name)}</h3>
    ${o.priceTBA ? '<p class="warn">Some prices will be confirmed by our team — we will text/email your final total before you pay.</p>' : ''}
    <div class="pay">${payCard(p)}</div>
    <p class="note">Put <b>${esc(o.id)}</b> in the payment memo. Other ways to pay:</p>
    <div class="pay">${D.payments.filter(x => x !== p).map(payCard).join('')}</div></div>
  <div class="card"><h3>Step 2 — Send us your payment confirmation</h3>
    <p>Email a screenshot of your payment with your order number. We'll check the order and text you to coordinate your ${o.method.startsWith('Local') ? 'delivery window (' + esc(o.ampm) + ')' : o.method.startsWith('Pick') ? 'pickup time' : 'shipment'}.</p>
    <a class="btn" href="${mail}">📧 Email Payment Confirmation</a></div>
  <div class="card"><h3>Order summary</h3><pre class="prose" style="white-space:pre-wrap;font-family:inherit">${esc(orderText(o))}</pre>
  <button class="btn ghost small" onclick="print()">Print</button></div>`;
}
function payCard(p) {
  return `<div class="card"><b>${esc(p.name)}</b>${p.qr ? `<img src="${esc(p.qr)}" alt="${esc(p.name)} QR code">` : '<div class="qr-ph">QR code coming soon</div>'}
  ${p.handle ? (/^https?:/.test(p.handle) ? `<a class="btn small" href="${esc(p.handle)}" target="_blank" rel="noopener">Open ${esc(p.name)}</a>` : `<div><b>${esc(p.handle)}</b></div>`) : ''}<div class="note">${esc(p.note)}</div></div>`;
}


/* ---------- Request an item / quote ---------- */
const LS_INQ = 'wf_inquiries';
function inquiry() {
  const s = D.site, q = new URLSearchParams(location.search), F = D.fulfillment;
  const depts = [...D.categories.map(c => c.title), ...(D.trees.enabled ? ['Christmas Trees'] : []), 'Bulk / Team / Event Order', 'Something else'];
  const I = D.inquiry || {};
  app.innerHTML = `<div class="page-head"><h1>${esc(I.title || 'Request an Item or Quote')}</h1>
   <p>${esc(I.intro || '')}</p></div>
  <div class="steps"><div><b>1</b>Tell us what you need</div><div><b>2</b>We reply with price & availability</div><div><b>3</b>Pay, then pickup, delivery or shipping</div></div>
  <form id="iq" class="card" novalidate>
    <h2>What are you looking for?</h2>
    <label for="idept">Department *</label><select id="idept" name="dept">${depts.map(d => `<option ${q.get('dept') === d ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select>
    <label for="iitem">Item you want *</label><input id="iitem" name="item" required value="${esc(q.get('item') || '')}" placeholder="e.g. Black hoodie with my logo, fitted cap, phone charger">
    <div class="row"><div><label for="isize">Size / color / style</label><input id="isize" name="size" placeholder="e.g. XL, royal blue"></div>
      <div><label for="iqty">Quantity</label><input id="iqty" name="qty" type="number" min="1" value="1" inputmode="numeric"></div></div>
    <div class="row"><div><label for="idate">Needed by</label><input id="idate" name="date" type="date" min="${isoLocal(new Date())}"></div>
      <div><label for="ibudget">Budget (optional)</label><input id="ibudget" name="budget" placeholder="e.g. $50, or $15 per shirt"></div></div>
    <label for="idet">Details *</label><textarea id="idet" name="details" required placeholder="Describe the item, design, text, colors, or anything else that helps us find or make it."></textarea>
    <p class="note">Have a photo or design file? After you send this, reply to our email or text it to ${esc(s.phone)}.</p>
    <h2>How would you like to get it?</h2>
    <div class="choices">${[F.pickupEnabled && 'Pick up at store', F.deliveryEnabled && 'Local delivery', F.shipEnabled && 'Ship within California', 'Not sure yet'].filter(Boolean).map((t, i) => `<label class="choice"><input type="radio" name="how" value="${esc(t)}" ${i ? '' : 'checked'}><span><b>${esc(t)}</b></span></label>`).join('')}</div>
    <h2>Your contact info</h2>
    <div class="row"><div><label for="iname">Full name *</label><input id="iname" name="name" autocomplete="name" required></div>
      <div><label for="iphone">Mobile phone *</label><input id="iphone" name="phone" type="tel" autocomplete="tel" required></div></div>
    <label for="iemail">Email *</label><input id="iemail" name="email" type="email" autocomplete="email" required>
    <label>Best way to reach you</label>
    <div class="choices">${['Text', 'Call', 'Email'].map((t, i) => `<label class="choice"><input type="radio" name="reach" value="${t}" ${i ? '' : 'checked'}><span><b>${t}</b></span></label>`).join('')}</div>
    <div id="iqErr" style="margin-top:12px"></div>
    <button class="btn" type="submit" style="width:100%;margin-top:12px">Send My Request →</button>
    <p class="note">No payment now. By sending you agree to be contacted about this request. See our <a href="/privacy-policy/">Privacy Policy</a>.</p>
  </form>`;
  const f = $('#iq');
  f.onsubmit = async e => {
    e.preventDefault(); const err = [];
    ['item', 'details', 'name', 'phone', 'email'].forEach(k => !f[k].value.trim() && err.push(k));
    if (f.email.value && !/^\S+@\S+\.\S+$/.test(f.email.value)) err.push('valid email');
    if (err.length) { $('#iqErr').innerHTML = '<div class="warn" role="alert">Please complete: ' + esc(err.join(', ')) + '</div>'; return; }
    const r = { id: 'RQ' + Date.now().toString(36).toUpperCase().slice(-6), created: new Date().toLocaleString(), dept: f.dept.value, item: f.item.value.trim(), size: f.size.value.trim(), qty: f.qty.value, date: f.date.value, budget: f.budget.value.trim(), details: f.details.value.trim(), how: f.how.value, name: f.name.value.trim(), phone: f.phone.value.trim(), email: f.email.value.trim(), reach: f.reach.value };
    const all = load(LS_INQ, []); all.unshift(r); save(LS_INQ, all);
    let sent = false;
    if (s.orderEndpoint) { try { const res = await fetch(s.orderEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ _subject: `Item request ${r.id} — ${r.name}`, email: r.email, request_id: r.id, request: inqText(r) }) }); sent = res.ok; } catch { } }
    const mail = `mailto:${s.email}?subject=${encodeURIComponent('Item request ' + r.id + ' — ' + r.item)}&body=${encodeURIComponent(inqText(r))}`;
    app.innerHTML = `<h1>${sent ? 'Request sent! 🎉' : 'One more step'}</h1>
     ${sent ? `<div class="card ok">Thanks, ${esc(r.name.split(' ')[0])}. Request <b>#${esc(r.id)}</b> was sent to our team. We'll reach you by ${esc(r.reach.toLowerCase())} with price and availability.</div>`
      : `<div class="card warn">Request <b>#${esc(r.id)}</b> is ready. Tap the button below to send it to us by email, or call <a href="${telHref(s.phone)}">${esc(s.phone)}</a>.</div><p><a class="btn" href="${mail}">📧 Send Request by Email</a></p>`}
     <div class="card"><h2>Your request</h2><pre style="white-space:pre-wrap;font-family:inherit">${esc(inqText(r))}</pre>
     ${sent ? `<a class="btn ghost small" href="${mail}">Also email a copy / attach a photo</a> ` : ''}<a class="btn ghost small" href="/shop/">Back to shop</a></div>`;
    window.scrollTo(0, 0);
  };
}
function inqText(r) {
  return `ITEM REQUEST ${r.id}\nSent: ${r.created}\n\nDepartment: ${r.dept}\nItem: ${r.item}\nSize/color/style: ${r.size || '-'}\nQuantity: ${r.qty || 1}\nNeeded by: ${r.date ? fmtDate(r.date) : '-'}\nBudget: ${r.budget || '-'}\nHow to receive: ${r.how}\n\nDetails: ${r.details}\n\nName: ${r.name}\nPhone: ${r.phone}\nEmail: ${r.email}\nBest way to reach: ${r.reach}`;
}

function contact() {
  const s = D.site;
  app.innerHTML = `<div class="page-head"><h1>Contact Us</h1></div>
  <div class="row"><div class="card"><h3>Visit</h3><p>📍 ${esc(s.address)}</p><p>🕑 ${esc(s.hours)}</p>
    <p>📞 <a href="${telHref(s.phone)}">${esc(s.phone)}</a></p><p>📧 <a href="mailto:${esc(s.email)}">${esc(s.email)}</a></p>
    <iframe title="Map" src="https://maps.google.com/maps?q=${encodeURIComponent(s.address)}&output=embed" style="width:100%;height:260px;border:0;border-radius:10px" loading="lazy"></iframe></div>
  <form class="card" id="cf"><h3>Send a message</h3><label for="cn">Name</label><input id="cn" required><label for="ce">Email or phone</label><input id="ce" required>
    <label for="cm">Message</label><textarea id="cm" required></textarea><button class="btn" style="margin-top:10px">Send</button></form></div>`;
  $('#cf').onsubmit = e => { e.preventDefault(); location.href = `mailto:${s.email}?subject=${encodeURIComponent('Website message from ' + $('#cn').value)}&body=${encodeURIComponent($('#cm').value + '\n\nReply to: ' + $('#ce').value)}`; };
}
function policy(t, body) { app.innerHTML = `<div class="page-head"><h1>${t}</h1></div><div class="card prose">${esc(body)}</div>`; }

/* ---------- Admin ---------- */
let tab = 'general';
function admin() {
  if (sessionStorage.getItem('wf_admin') !== '1') {
    app.innerHTML = `<h1>Admin</h1><form class="card" id="lg"><label for="pw">Password</label><input id="pw" type="password"><button class="btn" style="margin-top:10px">Log in</button></form>`;
    $('#lg').onsubmit = e => { e.preventDefault(); if ($('#pw').value === D.site.adminPassword) { sessionStorage.setItem('wf_admin', '1'); admin(); } else alert('Wrong password'); };
    return;
  }
  const tabs = { general: 'Site Info', sections: 'Sections & Products', trees: 'Christmas Trees', delivery: 'Delivery & Shipping', payments: 'Payments & QR', policies: 'Policies', orders: 'Orders (this device)', publish: 'Save & Publish' };
  app.innerHTML = `<div class="admin"><h1>Admin</h1><p class="note">Changes save instantly in this browser. Use <b>Save & Publish</b> to download <code>data.json</code> and upload it to the website so everyone sees them.</p>
  <div class="tabs">${Object.entries(tabs).map(([k, v]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${v}</button>`).join('')}</div><div id="pane"></div></div>`;
  app.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; admin(); });
  ({ general: aGeneral, sections: aSections, trees: aTrees, delivery: aDelivery, payments: aPayments, policies: aPolicies, orders: aOrders, publish: aPublish })[tab]($('#pane'));
}
const commit = () => { save(LS_DATA, D); chrome(); };
function field(label, obj, key, type = 'text') {
  const id = 'f' + Math.random().toString(36).slice(2);
  const v = obj[key] ?? '';
  const input = type === 'textarea' ? `<textarea id="${id}">${esc(v)}</textarea>` : type === 'checkbox' ? `<input id="${id}" type="checkbox" ${v ? 'checked' : ''} style="width:auto">` : `<input id="${id}" type="${type}" value="${esc(v)}">`;
  setTimeout(() => { const el = document.getElementById(id); if (el) el.oninput = el.onchange = () => { obj[key] = type === 'checkbox' ? el.checked : el.value; commit(); }; });
  return `<label for="${id}">${label}</label>${input}`;
}
function imgField(label, obj, key) {
  const id = 'i' + Math.random().toString(36).slice(2);
  setTimeout(() => {
    const fl = document.getElementById(id); if (!fl) return;
    fl.onchange = () => { const file = fl.files[0]; if (!file) return; const r = new FileReader(); r.onload = () => shrink(r.result, url => { obj[key] = url; commit(); admin(); }); r.readAsDataURL(file); };
  });
  return `${field(label + ' (image URL)', obj, key)}<input id="${id}" type="file" accept="image/*" style="margin-top:4px">${obj[key] ? `<img src="${esc(obj[key])}" style="max-height:90px;margin-top:6px;background:#fff;border-radius:6px">` : ''}`;
}
function shrink(src, cb, max = 900) {
  const im = new Image(); im.onload = () => { const s = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = im.width * s; c.height = im.height * s; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL(src.startsWith('data:image/png') ? 'image/png' : 'image/jpeg', .85)); }; im.src = src;
}
function aGeneral(p) {
  const s = D.site;
  p.innerHTML = `<div class="card">${field('Business name', s, 'name')}${field('Established line', s, 'est')}${field('Slogan', s, 'slogan')}${field('Tagline', s, 'tagline')}
  ${field('Announcement banner (leave blank to hide)', s, 'announcement')}${field('Homepage intro', s, 'heroText', 'textarea')}
  ${imgField('Logo', s, 'logo')}
  <div class="row"><div>${field('Address', s, 'address')}</div><div>${field('Phone', s, 'phone')}</div></div>
  <div class="row"><div>${field('Order / contact email', s, 'email')}</div><div>${field('Website', s, 'website')}</div></div>
  ${field('Store hours', s, 'hours')}
  ${field('Request page title', (D.inquiry = D.inquiry || {}), 'title')}${field('Request page intro', D.inquiry, 'intro', 'textarea')}
  ${field('Order notification endpoint (e.g. Formspree URL — orders get emailed to you)', s, 'orderEndpoint')}
  ${field('Admin password', s, 'adminPassword')}</div>`;
}
function aSections(p) {
  p.innerHTML = `<div class="card"><button class="btn small gold" id="addSec">+ Add Section</button></div>` + D.categories.map((c, ci) => `
  <details class="card" ${ci === 0 ? '' : ''}><summary><b style="color:${c.color}">■</b> <b>${esc(c.title)}</b> — ${c.products.length} products</summary>
   <div class="row"><div>${field('Section name', c, 'title')}</div><div>${field('Color', c, 'color', 'color')}</div></div>
   ${field('Subtitle', c, 'subtitle')}${field('Description', c, 'description', 'textarea')}${field('Show in top menu', c, 'showInNav', 'checkbox')}
   ${field('Google title (SEO) — blank = automatic', c, 'seoTitle')}${field('Google description (SEO) — blank = automatic', c, 'seoDescription', 'textarea')}
   <p><button class="btn small ghost" data-up="${ci}">↑ Move up</button> <button class="btn small ghost" data-delsec="${ci}">Delete section</button></p>
   <h3>Products</h3>
   ${c.products.map((pr, pi) => `<div class="card"><div class="row"><div>${field('Name', pr, 'name')}</div><div>${field('Price ($)', pr, 'price', 'number')}</div></div>
     ${field('Description', pr, 'description')}${field('Options (comma separated, e.g. S,M,L,XL)', pr, 'options')}${imgField('Photo', pr, 'image')}${field('Sold out', pr, 'soldOut', 'checkbox')}
     <button class="btn small ghost" data-delp="${ci}:${pi}">Delete product</button></div>`).join('')}
   <button class="btn small" data-addp="${ci}">+ Add product</button></details>`).join('');
  $('#addSec').onclick = () => { const t = prompt('New section name (e.g. Kids, Shoes, Halloween)'); if (!t) return; D.categories.push({ id: t.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36).slice(-3), title: t, color: '#d32f2f', subtitle: '', description: '', showInNav: true, products: [] }); commit(); admin(); };
  p.querySelectorAll('[data-addp]').forEach(b => b.onclick = () => { D.categories[+b.dataset.addp].products.push({ name: 'New product', price: '', description: '', options: '', image: '' }); commit(); admin(); });
  p.querySelectorAll('[data-delp]').forEach(b => b.onclick = () => { const [c, i] = b.dataset.delp.split(':'); if (confirm('Delete product?')) { D.categories[c].products.splice(i, 1); commit(); admin(); } });
  p.querySelectorAll('[data-delsec]').forEach(b => b.onclick = () => { if (confirm('Delete this whole section and its products?')) { D.categories.splice(+b.dataset.delsec, 1); commit(); admin(); } });
  p.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { const i = +b.dataset.up; if (i > 0) { [D.categories[i - 1], D.categories[i]] = [D.categories[i], D.categories[i - 1]]; commit(); admin(); } });
}
function aTrees(p) {
  const T = D.trees;
  p.innerHTML = `<div class="card">${field('Tree page enabled', T, 'enabled', 'checkbox')}${field('Lot opening date', T, 'openDate', 'date')}${field('Intro text', T, 'intro', 'textarea')}
   <div class="row"><div>${field('Stand price — we supply & put on ($)', T, 'standPrice', 'number')}</div><div>${field('Put on customer\'s own stand ($, 0 = free)', T, 'standInstallPrice', 'number')}</div></div></div>
  <div class="card"><h3>Tree types</h3>${T.types.map((t, i) => `<div class="card">${field('Name', t, 'name')}${field('Description', t, 'description')}${imgField('Photo', t, 'image')}<button class="btn small ghost" data-delt="${i}">Delete</button></div>`).join('')}
   <button class="btn small" id="addT">+ Add tree type</button></div>
  <div class="card scroll-x"><h3>Prices by height (leave blank = "Price TBA")</h3><table><tr><th>Height</th>${T.types.map(t => `<th>${esc(t.name)}</th>`).join('')}<th></th></tr>
   ${T.heights.map((h, hi) => { h.prices = h.prices || {}; return `<tr><td>${field('', h, 'label')}</td>${T.types.map(t => `<td>${field('', h.prices, t.name, 'number')}</td>`).join('')}<td><button class="btn small ghost" data-delh="${hi}">✕</button></td></tr>`; }).join('')}</table>
   <button class="btn small" id="addH">+ Add height</button></div>`;
  $('#addT').onclick = () => { T.types.push({ name: 'New Tree', description: '', image: '' }); commit(); admin(); };
  $('#addH').onclick = () => { T.heights.push({ label: 'New size', prices: {} }); commit(); admin(); };
  p.querySelectorAll('[data-delt]').forEach(b => b.onclick = () => { if (confirm('Delete tree type?')) { T.types.splice(+b.dataset.delt, 1); commit(); admin(); } });
  p.querySelectorAll('[data-delh]').forEach(b => b.onclick = () => { T.heights.splice(+b.dataset.delh, 1); commit(); admin(); });
}
function aDelivery(p) {
  const F = D.fulfillment;
  const zipObj = { z: F.deliveryZips.join(', ') };
  p.innerHTML = `<div class="card">${field('Store pickup available', F, 'pickupEnabled', 'checkbox')}${field('Pickup note', F, 'pickupNote', 'textarea')}</div>
  <div class="card">${field('Local delivery available', F, 'deliveryEnabled', 'checkbox')}${field('Delivery fee ($)', F, 'deliveryFee', 'number')}${field('Delivery note', F, 'deliveryNote', 'textarea')}
   ${field('Delivery ZIP codes (comma separated — 5 mi of 91001 & 3 mi of 90015)', zipObj, 'z', 'textarea')}</div>
  <div class="card">${field('California shipping available', F, 'shipEnabled', 'checkbox')}${field('Shipping fee ($, blank = quoted by team)', F, 'shipFee', 'number')}${field('Shipping note', F, 'shipNote', 'textarea')}</div>
  <div class="card">${field('Minimum hours in advance', F, 'leadHours', 'number')}</div>`;
  const ta = p.querySelectorAll('textarea')[2];
  ta.addEventListener('input', () => { F.deliveryZips = ta.value.split(/[^\d]+/).filter(z => z.length === 5); commit(); });
}
function aPayments(p) {
  p.innerHTML = `<div class="card">${field('Payment instructions shown to customers', D, 'paymentInstructions', 'textarea')}</div>` +
    D.payments.map((x, i) => `<div class="card">${field('Name', x, 'name')}${field('Handle / phone / payment link (links become a button)', x, 'handle')}${field('Note', x, 'note')}${imgField('QR code', x, 'qr')}<button class="btn small ghost" data-delpay="${i}">Delete</button></div>`).join('') +
    `<button class="btn small" id="addPay">+ Add payment method</button>`;
  $('#addPay').onclick = () => { D.payments.push({ name: 'New method', handle: '', qr: '', note: '' }); commit(); admin(); };
  p.querySelectorAll('[data-delpay]').forEach(b => b.onclick = () => { if (confirm('Delete?')) { D.payments.splice(+b.dataset.delpay, 1); commit(); admin(); } });
}
function aPolicies(p) { p.innerHTML = `<div class="card">${field('Privacy Policy', D.policies, 'privacy', 'textarea')}${field('Refund Policy', D.policies, 'refund', 'textarea')}</div>`; p.querySelectorAll('textarea').forEach(t => t.style.minHeight = '260px'); }
function aOrders(p) {
  const all = load(LS_ORDERS, []);
  p.innerHTML = `<div class="card note">Orders are emailed to you through the order endpoint (Site Info tab) and by the customer's payment-confirmation email. This list only shows orders placed on this device.</div>` +
    (load(LS_INQ, []).map(r => `<details class="card"><summary><b>${esc(r.id)}</b> — item request — ${esc(r.name)} — ${esc(r.item)}</summary><pre style="white-space:pre-wrap">${esc(inqText(r))}</pre></details>`).join('')) +
    (all.length ? all.map(o => `<details class="card"><summary><b>${esc(o.id)}</b> — ${esc(o.customer.name)} — ${esc(o.method)} — ${fmtDate(o.date)} ${esc(o.ampm)}</summary><pre style="white-space:pre-wrap">${esc(orderText(o))}</pre></details>`).join('') : '<p>No orders on this device.</p>');
}
function aPublish(p) {
  p.innerHTML = `<div class="card"><h3>Publish changes</h3><ol><li>Click <b>Download data.json</b>.</li><li>Upload it to the website repository (replace the old <code>data.json</code>).</li><li>Done — everyone sees the new prices and products.</li></ol>
   <button class="btn gold" id="dl">⬇ Download data.json</button></div>
  <div class="card"><h3>Load / reset</h3><input type="file" id="up" accept=".json"><p><button class="btn ghost small" id="reset">Discard local changes (reload live data)</button> <button class="btn ghost small" id="out">Log out</button></p></div>`;
  $('#dl').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(D, null, 2)], { type: 'application/json' })); a.download = 'data.json'; a.click(); };
  $('#up').onchange = e => { const r = new FileReader(); r.onload = () => { try { D = JSON.parse(r.result); commit(); alert('Loaded'); admin(); } catch { alert('Invalid file'); } }; r.readAsText(e.target.files[0]); };
  $('#reset').onclick = () => { if (confirm('Discard all unpublished changes on this device?')) { localStorage.removeItem(LS_DATA); location.reload(); } };
  $('#out').onclick = () => { sessionStorage.removeItem('wf_admin'); go('/'); };
}

init();
})();
