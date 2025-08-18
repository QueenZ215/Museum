  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  let SHOP_DATA = [];
  let CURRENT_FILTER = 'all';

  // Price formatter
  const usd = new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' });

  async function loadShop() {
    try {
      const res = await fetch('../data/shop.json'); // adjust path if needed
      if (!res.ok) throw new Error('Failed to load shop.json');
      const json = await res.json();
      SHOP_DATA = json.items || [];
      renderShop();
      wireFilters();
    } catch (e) {
      console.error(e);
      $('#shop-container').innerHTML = '<p>Shop unavailable. Please try again later.</p>';
    }
  }

  function renderShop() {
    const wrap = $('#shop-container');
    wrap.innerHTML = ''; // clear

    const items = SHOP_DATA.filter(i => CURRENT_FILTER === 'all' ? true : i.category === CURRENT_FILTER);

    for (const i of items) {
      const card = document.createElement('div');
      card.className = 'item-card souvenir-item';
      card.setAttribute('data-id', i.id);
      card.setAttribute('data-name', i.name);
      card.setAttribute('data-price', usd.format(i.price));
      card.setAttribute('data-desc', i.desc);
      card.setAttribute('data-img', i.img);
      card.setAttribute('data-alt', i.alt);
      card.onclick = () => openModalFromCard(card);

      card.innerHTML = `
        <img src="${i.img}" alt="${i.alt}" title="${i.tooltip || ''}">
        <h3>${i.name}</h3>
        <p>${i.desc}</p>
        <p class="price"><strong>Price:</strong> ${usd.format(i.price)}</p>
        <button onclick="addToCart(this)" data-id=${i.id} data-name=${i.name} data-price=${i.price} data-image=${i.img}> ${i.name} </button>
      `;

      // Prevent button click from opening modal; wire addToCart
      card.querySelector('button').onclick = (ev) => {
        ev.stopPropagation();
        addToCart(i.id, i.name);
      };

      wrap.appendChild(card);
    }
  }

  // Filters (uses data-filter on nav buttons)
  function wireFilters() {
    $$('.nav-bar-collection [data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        CURRENT_FILTER = btn.dataset.filter;
        renderShop();
      });
    });
  }

  // Modal controls (reuse your existing functions if you already have them)
  function openModalFromCard(cardEl) {
    const m = $('#shop-modal');
    $('#shop-modal-title').textContent = cardEl.dataset.name || 'Preview';
    $('#shop-modal-image').src = cardEl.dataset.img || '';
    $('#shop-modal-image').alt = cardEl.dataset.alt || '';
    $('#shop-modal-desc').textContent = cardEl.dataset.desc || '';
    $('#shop-modal-price').textContent = cardEl.dataset.price ? `Price: ${cardEl.dataset.price}` : '';
    const add = $('#shop-modal-add');
    add.textContent = `Add ${cardEl.dataset.name || 'Item'} to Cart`;
    add.onclick = () => addToCart(cardEl.dataset.id, cardEl.dataset.name);

    m.setAttribute('aria-hidden','false');
    m.querySelector('.shop-modal__panel').focus();

    // Click outside or Esc to close
    m.onclick = (e) => { if (e.target === m) closeModal(); };
    window.addEventListener('keydown', escClose);
  }

  function closeModal() {
    $('#shop-modal').setAttribute('aria-hidden','true');
    window.removeEventListener('keydown', escClose);
  }
  function escClose(e) { if (e.key === 'Escape') closeModal(); }

  // Stub
  function addToCart(id, name) {
    alert(`Added “${name || id}” to cart — functionality coming in Phase 2.`);
  }

  // Kick it off
  document.addEventListener('DOMContentLoaded', loadShop);
