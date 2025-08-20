const DATA_URL = '../data/shop.json';
const CART_KEY = 'MTHcart';
const usd = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'});
// document.querySelector  = const $  = (sel, root=document) => root.querySelector(sel);/ document.querySelectorAll. = const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel)); 
let shopData = [];
let currentFilter = 'all';

function readCart() {
try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
catch { return []; }
}

function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
document.addEventListener('DOMContentLoaded', initShop);

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
    document.querySelectorAll('.nav-bar-collection [data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.CDATA_SECTION_NODE.filter || 'all';
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
            data-  ="${i.price}"
            data-  ="${i.img}">
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

function addToCart(btm) {
    const id = btn.dataset.id;
    const name = btn.dataset.name;
    const unitPrice = Number(btn.dataset.price);
    const image = btn.dataset.image;

    if (!id || !name || !Number.isFinite(unitePrice)) {
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