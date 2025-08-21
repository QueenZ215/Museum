const DATA_URL = '../data/shop.json';
const CART_KEY = 'MTHcart';
const usd = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'});
// document.querySelector  = const $  = (sel, root=document) => root.querySelector(sel);/ document.querySelectorAll. = const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel)); 
let shopData = [];
let currentFilter = 'all';

// Cart varables
const TAX_RATE = 0.102;
const MEMBER_RATE = 0.15;
const SHIPPING_RATE = 25.00;
const VOLUME_TIERS = [
    {min:   0.00, max:   49.99, rate: 0.00 },
    {min:  50.00, max:   99.99, rate: 0.05 },
    {min: 100.00, max:  199.99, rate: 0.10 },
    {min: 200.00, max: Infinity, rate: 0.15 }
];
const DISCOUNT_PREF = 'mtghDiscountPref';
const fmt = (n) => { 
    const v = Math.abs(n); 
    const f = usd.format(v); 
    return n < 0 ? `(${f})` : f; };

function readCart() {
try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
catch { return []; }
}

function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function renderShop() {
    const wrap = document.getElementById('shop-container');
    if (!wrap) return;

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// this script being used for two pages checks which Dom content shold be loaded. using if rather then if/else makes it more expandable.
document.addEventListener('DOMContentLoaded', () => {
    const onShop = !!document.getElementById('shop-container');
    const onCart = !!document.getElementById('cart-root');
    if (onShop) initShop();
    if (onCart) initCart();
});

async function initShop() {
    wireFilters();
    await loadData();
    renderShop();
}


async function loadData() {
    const db = await fetch(DATA_URL);
    if (!db.ok) throw new Error('Faild to load shop.json');
    const json = await db.json();
    shopData = json.items || [];
}

function wireFilters() {
    const buttons = document.querySelectorAll('.nav-bar-collection [data-filter]');
    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter || 'all';
            renderShop();
        });
    });
}

function renderShop() {
    const wrap = document.getElementById('shop-container');
    if (!wrap) return;

    const items = shopData.filter(i => currentFilter === 'all' ? true : i.category === currentFilter);
    wrap.innerHTML = items.map(i => cardHTML(i)).join('');

    wrap.querySelectorAll('.shop-item').forEach(card => {
        card.addEventListener('click', (z) => {
            // If makes add to car work when rest of container brings up the card.
            if (z.target.closest('button')) return;
            console.log(card);
            openModalFromCard(card);
        });
        const btn = card.querySelector('button[data-role="add"]');
        if (btn) {
            btn.addEventListener('click', (z) => {
            z.stopPropagation();
            addToCart(btn);
        });
        }
    });
    const cart = readCart();
    for (const it of cart) {
        const card = wrap.querySelector(`.shop-item[data-id="${it.id}"]`);
        if (card) {
            const badge = card.querySelector('.qty-badge');
            if (badge) badge.textContent = `Qty: ${it.qty}`;
        }
    }
}

function cardHTML(i) {
    return `
        <div class="shop-item item-card"
            data-id="${i.id}"
            data-name="${escapeHTML(i.name)}"
            data-price="${i.price}"
            data-img="${i.img}"
            data-alt="${escapeHTML(i.alt)}
            data-desc="${escapeHTML(i.desc)}">
        <img src="${i.img}" alt="${escapeHTML(i.alt)}" title="${i.tooltip || ''}" >
        <h3>${escapeHTML(i.name)}</h3>
        <p>${escapeHTML(i.desc)}</p>
        <p class="price"><strong>Price:</strong> ${usd.format(i.price)}</p>
        <span class="qty-badge" aria-live="polite"></span>
        <button type="button" data-role="add"
            data-id="${i.id}"
            data-name="${escapeHTML(i.name)}"
            data-price="${i.price}"
            data-image="${i.img}">
            Add ${escapeHTML(i.name)} to Cart
        </button>
        </div>
        `;
}

function openModalFromCard(cardEl) {
    document.querySelector('#shop-modal-title').textContent = cardEl.dataset.name || 'Preview'; 
    document.querySelector('#shop-modal-image').src = cardEl.dataset.img || '';
    document.querySelector('#shop-modal-image').alt = cardEl.dataset.alt || '';
    document.querySelector('#shop-modal-desc').textContent = cardEl.dataset.desc || '';
    document.querySelector('#shop-modal-price').textContent = cardEl.dataset.price ? `Price: ${usd.format(Number(cardEl.dataset.price))}` : '';
    
    const add = document.querySelector('#shop-modal-add');
    add.dataset.id = cardEl.dataset.id;
    add.dataset.name = cardEl.dataset.name;
    add.dataset.price = (cardEl.dataset.price || '').toString();
    add.dataset.image = cardEl.dataset.img;
    add.textContent = `Add ${cardEl.dataset.name || 'Item'} to Cart`;
    add.onclick = function(){ addToCart(this); };

    const modal = document.querySelector('#shop-modal');
    console.log(modal);
    modal.setAttribute('aria-hidden','false');
    console.log(modal);
    const panel = modal.querySelector('.shop-modal__panel');
    console.log(modal);
    if (panel) panel.focus();
    console.log(modal);

    modal.addEventListener('click', onOverlayClick);
    window.addEventListener('keydown', escClose);
}
function onOverlayClick(z) {
    if (z.target === document.querySelector('#shop-modal')) closeModal();
}

function closeModal() {
    document.querySelector('#shop-modal').setAttribute('aria-hidden', 'true')
    window.removeEventListener('keydown', escClose);
}

function escClose(Z) {
    if (Z.key === 'Escape') closeModal();
}

function addToCart(btn) {
    console.log('addToCart dataset:', btn && btn.dataset);
    const id = btn.dataset.id;
    const name = btn.dataset.name;
    const unitPrice = Number(btn.dataset.price);
    const image = btn.dataset.image;

    if (!id || !name || !Number.isFinite(unitPrice)) {
        alert('Item missing Pricing data.');
        return;
    }
    let cart = readCart();
    const idx = cart.findIndex(it => it.id === id);
    if (idx >= 0) {
        cart[idx].qty += 1;
    } else {
        cart.push({ id, name, unitPrice, qty: 1, image });
    }
    writeCart(cart);

    const card = document.querySelector(`.shop-item[data-id="${id}"]`);
    if (card) {
        const badge = card.querySelector('.qty-badge');
        if (badge) {
            const item = cart.find(it => it.id === id);
            badge.textContent = item ? `Qty ${item.qty}` : '';
        }
    }
}
function escapeHTML(s='') {
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// Cart Functions
function initCart() {
    renderCart();
}

function renderCart() {
    const root = document.getElementById('cart-root');
    let cart = readCart().filter(it => Number(it.unitPrice) > 0);
    writeCart(cart);

    // empty cart;
    if (cart.length === 0) {
        root.innerHTML = `
        <div class="cart-actions">
            <div class="left">
                <button class="btn" onclick="location.href='shop.html'">Keep Shoping</button>
            </div>
            <div class="right">
                <lable><input type="checkbox" id="memberFlag"> Museum Member (15% off)</label>
            </div>
        </div>
        <div class="empty">Your cart is empty.</div>
        `;
        const memberFlag = document.querySelector('#memberFlag');
        memberFlag.checked = localStorage.getItem('museumMemberFlag') === '1';
        memberFlag.addEventListener('change', () => {
            localStorage.setItem('museumMemberFlag', memberFlag.checked ? '1' : '0');
            renderCart();
        });
        return;
    }

    // subtotal
    let itemTotal = 0;
    for (const it of cart) itemTotal += Number(it.unitPrice) * Number(it.qty || 0);

    // Volume discount
    let volumeRate = 0;
    for (const t of VOLUME_TIERS) {
        if (itemTotal >= t.min && itemTotal <= t.max) { volumeRate = t.rate; break;}
    }
    let volumeDiscount = itemTotal * volumeRate;

    // Member discount
    const memberChecked = (localStorage.getItem('museumMemberFlag') === '1');
    let memberDiscount = memberChecked? itemTotal * MEMBER_RATE : 0;

    // single discount rule
    let applied = 'none';
    if (memberDiscount > 0 && volumeDiscount > 0) {
        const pref = localStorage.getItem(DISCOUNT_PREF);
        if (pref === 'member' || pref === 'volume') {
            applied = pref;
        } else {
            const choice = confirm(
                `Both discounts are available:\n\nMember: ${Math.round(MEMBER_DISCOUNT_RATE*100)}%\nVolume: ${Math.round(volumeRate*100)}%\n\nOK = Member, Cancel = Volume`   
            );
            applied = choice ? 'member' : 'volume';
            localStorage.setItem(DISCOUNT_PREF, applied);
        }
    } else if (memberDiscount > 0) applied = 'member';
    else if (volumeDiscount > 0) applied = 'volume';

    if (applied === 'member') volumeDiscount = 0;
    if (applied === 'volume') memberDiscount = 0;

    // Shipping and handeling 
    const shipping = cart.length ? SHIPPING_RATE : 0;
    const taxableSubtotal = itemTotal - memberDiscount - volumeDiscount + shipping;
    const taxAmount = taxableSubtotal * TAX_RATE;
    const invoiceTotal = taxableSubtotal + taxAmount ;

    // Rows
    let rows = '';
    for (const it of cart) {
        const line = Number(it.unitPrice) * Number(it.qty || 0);
        rows += `
            <tr>
                <td style="width:72px;"><img class="thumb" src="${it.image || '../images/shop/placeholder.png'}" alt="${(it.name || 'Item') + ' thumbnail'}"></td>
                <td><strong>${it.name}</strong><br><span class="muted">Unit: ${fmt(Number(it.unitPrice))}</span></td>
                <td class="num">${Number(it.qty || 0)}</td>
                <td class="num">${fmt(line)}</td>
                <td class="num"><button class="btn secondary" data-remove="${it.id}">Remove</button></td>
            </tr>
            `;        
    }

    // Inject UI
    root.innerHTML = `
        <div class="cart-actions">
            <div class="left>
                <button class="btn" onclick="location.href='shop.html'">Keep Shoping</button>
                <button class="btn secondary" id="clearCartBtn">Clear Cart</button>
            </div>
            <div class="right">
                <lable><input type="checkbox" id="memberFlag"> Musum Member (15% off)</label>
                <button class="btn secondary" id="resetDiscountPrefBtn" title="Choose discount again">Reset Discount Choice</button>
            </div>
        </div>
        
        <table class="cart" aria-describedby="cartSummart">
            <thead>
                <tr>
                    <th scope="col">Item</th>
                    <th scope="col">Description</th>
                    <th scope="col" class="num">Qty</th>
                    <th scope="col" class="num">Amount</th>
                    <th scope="col" class="num">Actions</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        
        <div class="summary" id="cartSummary">
            <div class="row"><span>Item Subtotal: </span><span class="num">${fmt(itemTotal)}</span></div>
            <div class="row"><span>Volume Discount: </span><span class="num">${fmt(-volumeDiscount)}</span></div>
            <div class="row"><span>Member Discount: </span><span class="num">${fmt(-memberDiscount)}</span></div>
            <div class="row"><span>Shipping: </span><span class="num">${fmt(shipping)}</span></div>
            <div class="row"><span>Subtotal (Taxable): </span><span class="num">${fmt(taxableSubtotal)}</span></div>
            <div class="row"><span>Tax ${(TAX_RATE*100).toFixed(1)}%: </span><span class="num">${fmt(taxAmount)}</span></div>
            <div class="row total"><span>Incoice Total: </span><span class="num">${fmt(invoiceTotal)}</span></div>
        </div>`;
    document.getElementById('memberFlag').checked = memberChecked;
    document.getElementById('memberFlag').addEventListener('change', (z) => {
        localStorage.setItem('museumMemberFlag', z.target.chacked ? '1' : '0');
        localStorage.removeItem(DISCOUNT_PREF);
        renderCart();
    });
    document.getElementById('ckearCartBtn').addEventListener('click', () => {
        if (confirm('Clear all items from cart?')) { writeCart([]); renderCart(); }
    });

    document.getElementById('resetDiscountPrefBtn').addEventListener('click', () => {
        localStorage.removeItem(DISCOUNT_PREF);
        alert('Discount choice reset. If both discounts apply, you will be prompted again.');
    });

    document.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-remove');
            cart = readCart().filter(it => it.id !== id);
            writeCart(cart);
            renderCart();
        });
    });
} 