import { categories, initialCatalog } from '../catalog.js';
import { html, icon, money, options, priceChart, table, title } from '../ui.js';
import { designs, logos, wordmark } from './kimlik.js';

const params = new URLSearchParams(location.search);
const design = Object.hasOwn(designs, params.get('tasarim')) ? params.get('tasarim') : 'a';
const logo = Object.hasOwn(logos, params.get('logo')) ? params.get('logo') : 'l1';
const { products, offers, stores } = initialCatalog();
const screen = document.querySelector('#screen');
const tray = document.querySelector('#comparison');
const feedback = document.querySelector('#feedback');
const saved = new Set();
let comparison = [];
let query = '';
let category = '';
let sort = 'default';
let historyStore = '';

const offerings = (id) => offers.filter((offer) => offer.product === id).sort((first, second) => first.price - second.price);
const getProduct = (id) => products.find((product) => product.id === id);
const price = (id) => offerings(id)[0]?.price;
const storeName = (id) => stores.find((store) => store.id === id).name;
const productURL = (product) => `#urun/${product.id}`;
const normalize = (text) => text.toLocaleLowerCase('tr-TR').replaceAll('ı', 'i').normalize('NFD').replace(/\p{Diacritic}/gu, '');

document.body.classList.add(`proposal-${design}`);
document.title = `GearCompare · ${designs[design].name} · ${logos[logo].name}`;

function top(page) {
  return `<div class="site-shell site-nav">
    <a href="#urunler" aria-label="GearCompare ana sayfa">${wordmark(logo)}</a>
    <nav aria-label="Önizleme menüsü">
      <a href="#urunler" ${page === 'urunler' || page === 'urun' ? 'aria-current="page"' : ''}>Ürünler</a>
      <a href="#karsilastir" ${page === 'karsilastir' ? 'aria-current="page"' : ''}>Karşılaştır</a>
    </nav>
    <a class="nav-saved" href="#favoriler" aria-label="Favoriler" ${page === 'favoriler' ? 'aria-current="page"' : ''}>${icon('heart')}<span>Favoriler</span></a>
  </div>`;
}

function search() {
  return `<form class="search-form" role="search">
    ${icon('search')}<input id="equipment-search" type="search" name="search" aria-label="Ekipman ara" placeholder="Ekipman ara" value="${html(query)}" autocomplete="off">
    <button type="submit">Ara</button>
  </form>`;
}

function intro() {
  if (design === 'b') return `<div class="catalog-heading site-shell"><h1>Ekipman kataloğu</h1>${search()}</div>`;
  if (design === 'c') return `<section class="home-hero stage-hero"><div class="stage-photo" aria-hidden="true"></div><div class="site-shell hero-content">
    <h1>Sıradaki<br>tonunu bul.</h1>
    <p>Gitar, amfi ve pedalların mağaza fiyatlarını karşılaştır.</p>
    ${search()}
  </div></section>`;
  return `<section class="home-hero quiet-hero"><div class="site-shell hero-content">
    <h1>Ekipmanını bul,<br class="small-break"> fiyatını karşılaştır.</h1>
    <p>Gitar, amfi ve pedalların mağaza fiyatlarını tek yerde gör.</p>
    ${search()}
  </div></section>`;
}

function filters() {
  return `<div class="catalog-filters" role="group" aria-label="Kategori">
    ${design === 'b' ? '<h2>Kategoriler</h2>' : ''}
    ${[['', 'Tümü'], ...Object.entries(categories).map(([id, item]) => [id, item.name])].map(([id, label]) =>
      `<button class="category" type="button" data-category="${id}" aria-pressed="${id === category}">${label}</button>`
    ).join('')}
  </div>`;
}

function photo(product, extraClass = '') {
  return `<span class="gear-photo ${extraClass}"><img src="../assets/${product.image}.jpg" alt="" width="512" height="512"></span>`;
}

function gearCard(product) {
  const item = product.id;
  const chosen = comparison.includes(item);
  return `<article class="gear-card">
    <a class="media-link" href="${productURL(product)}" aria-label="${html(title(product))} ürün detayı">${photo(product)}</a>
    <div class="gear-copy">
      <span class="gear-brand">${html(product.brand)} <span>·</span> ${categories[product.category].name}</span>
      <h3><a href="${productURL(product)}">${html(product.model)}</a></h3>
    </div>
    <div class="gear-price"><strong>${money(price(item))}</strong><span>${offerings(item).length} mağaza</span></div>
    <div class="gear-actions">
      <button class="choose" type="button" data-compare="${item}" aria-pressed="${chosen}">${icon(chosen ? 'check' : 'compare')}${chosen ? 'Seçildi' : 'Karşılaştır'}</button>
      <button class="heart" type="button" data-save="${item}" aria-pressed="${saved.has(item)}" aria-label="${html(title(product))} favori">${icon('heart')}</button>
    </div>
  </article>`;
}

function results() {
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  const list = products.filter((product) => {
    const text = normalize(`${title(product)} ${categories[product.category].name}`);
    return (!category || category === product.category) && terms.every((word) => text.includes(word));
  });
  if (sort === 'low') list.sort((a, b) => price(a.id) - price(b.id));
  if (sort === 'high') list.sort((a, b) => price(b.id) - price(a.id));
  return `<div class="products-head">
      <p role="status">${list.length} ürün</p>
      <select id="sort-products" aria-label="Ürünleri sırala">${options([['default', 'Varsayılan sıra'], ['low', 'En düşük fiyat'], ['high', 'En yüksek fiyat']], sort)}</select>
    </div>
    ${list.length ? `<div class="catalog-grid">${list.map(gearCard).join('')}</div>` : '<p class="empty">Ürün bulunamadı. Aramayı veya kategoriyi değiştir.</p>'}`;
}

function catalogPage() {
  return `${intro()}<section class="site-shell catalog-area ${design === 'b' ? 'with-sidebar' : ''}" aria-label="Ürün kataloğu">
    ${filters()}
    <div id="results">${results()}</div>
  </section>`;
}

function details(product) {
  const kind = categories[product.category];
  const listings = offerings(product.id);
  const offer = listings.find((item) => item.store === historyStore) ?? listings[0];
  return `<div class="site-shell inner-page">
    <a class="back" href="#urunler">Tüm ürünler</a>
    <section class="detail-head">
      ${photo(product, 'large-photo')}
      <div><span class="gear-brand">${html(product.brand)} · ${kind.name}</span>
        <h1>${html(product.model)}</h1>
        <div class="detail-price">${money(listings[0].price)}</div>
        <span class="gear-brand">En düşük fiyat</span>
        <button class="choose" type="button" data-compare="${product.id}" aria-pressed="${comparison.includes(product.id)}">
          ${icon(comparison.includes(product.id) ? 'check' : 'compare')}${comparison.includes(product.id) ? 'Seçildi' : 'Karşılaştır'}
        </button>
      </div>
    </section>
    <div class="detail-grid">
      <section class="panel"><h2>Mağaza fiyatları</h2>
        ${table(['Mağaza', 'Fiyat'], listings.map((item) => [storeName(item.store), money(item.price)]), 'Mağaza fiyatları')}
      </section>
      <section class="panel"><h2>Teknik özellikler</h2>
        <dl>${kind.specs.map((name, i) => `<div><dt>${name}</dt><dd>${html(product.values[i])}</dd></div>`).join('')}</dl>
      </section>
    </div>
    <section class="panel history-panel"><div class="panel-heading"><h2>Fiyat geçmişi</h2>
      <select id="market-history" aria-label="Fiyat geçmişi mağazası">${options(listings.map((item) => [item.store, storeName(item.store)]), offer.store)}</select>
    </div>${priceChart(offer.history)}</section>
  </div>`;
}

function comparePage() {
  const items = [getProduct(comparison[0]), getProduct(comparison[1])];
  const selected = items.filter(Boolean);
  const fields = [...new Set(selected.flatMap((product) => categories[product.category].specs))];
  const rows = [
    ['En düşük fiyat', ...selected.map((product) => money(price(product.id)))],
    ...fields.map((key) => [key, ...selected.map((product) => {
      const index = categories[product.category].specs.indexOf(key);
      return index === -1 ? '—' : html(product.values[index]);
    })]),
    ...stores.map((store) => [store.name, ...selected.map((product) => money(offerings(product.id).find((item) => item.store === store.id)?.price))]),
  ];
  return `<div class="site-shell inner-page"><h1>Ürün karşılaştırma</h1>
    <div class="detail-grid compare-picks">${items.map((product, i) => `<section class="panel">
      <label for="pick-${i}">${i === 0 ? 'Birinci ürün' : 'İkinci ürün'}</label>
      <select id="pick-${i}">${options([['', 'Ürün seç'], ...products.filter((item) => item.id !== items[1 - i]?.id).map((item) => [item.id, title(item)])], product?.id ?? '')}</select>
      ${product ? photo(product) : ''}
    </section>`).join('')}</div>
    ${selected.length === 2 ? `<section class="panel">${table(['Özellik / Mağaza', ...selected.map((item) => html(item.model))], rows, 'Ürün karşılaştırma')}</section>` : ''}
  </div>`;
}

function favoritesPage() {
  const items = products.filter(({ id }) => saved.has(id));
  return `<div class="site-shell inner-page"><h1>Favoriler</h1>
    ${items.length ? `<div class="catalog-grid">${items.map(gearCard).join('')}</div>` : '<p class="empty">Bir ürünün kalbine dokunarak favorilerine ekle.</p>'}
  </div>`;
}

function route() {
  const [page, id] = location.hash.slice(1).split('/');
  return [page || 'urunler', id];
}

function updateTray(page) {
  const count = comparison.filter(Boolean).length;
  tray.innerHTML = count && page !== 'karsilastir'
    ? `<div class="tray"><span>${count}/2 ürün seçildi</span><a href="#karsilastir">Karşılaştır</a></div>` : '';
}

function render() {
  const [page, id] = route();
  const product = getProduct(id);
  document.querySelector('#site-top').innerHTML = top(page);
  const pages = { urunler: catalogPage, urun: () => product ? details(product) : catalogPage(), karsilastir: comparePage, favoriler: favoritesPage };
  screen.innerHTML = (Object.hasOwn(pages, page) ? pages[page] : catalogPage)();
  updateTray(page);
}

function updateCatalog() {
  document.querySelector('#results').innerHTML = results();
}

function restoreFocus(selector) {
  (document.querySelector(selector) ?? screen).focus({ preventScroll: true });
}

document.addEventListener('input', (event) => {
  if (event.target.id !== 'equipment-search' || event.isComposing) return;
  query = event.target.value;
  updateCatalog();
});

document.addEventListener('submit', (event) => {
  if (!event.target.matches('.search-form')) return;
  event.preventDefault();
  query = event.target.elements.search.value;
  updateCatalog();
});

document.addEventListener('change', (event) => {
  const { id, value } = event.target;
  if (id === 'sort-products') {
    sort = value;
    updateCatalog();
    restoreFocus('#sort-products');
  } else if (id === 'market-history') {
    historyStore = value;
    render();
    restoreFocus('#market-history');
  } else if (id === 'pick-0' || id === 'pick-1') {
    comparison[Number(id.at(-1))] = value;
    render();
    restoreFocus(`#${id}`);
  }
});

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const data = button.dataset;
  if ('category' in data) {
    category = data.category;
    for (const choice of document.querySelectorAll('[data-category]')) {
      choice.setAttribute('aria-pressed', choice.dataset.category === category);
    }
    updateCatalog();
  } else if (data.save || data.compare) {
    const id = data.save || data.compare;
    if (data.save) {
      if (!saved.delete(id)) saved.add(id);
    } else {
      comparison = comparison.filter(Boolean);
      if (comparison.includes(id)) comparison = comparison.filter((item) => item !== id);
      else if (comparison.length < 2) comparison.push(id);
      else {
        feedback.textContent = 'Yeni ürün eklemek için önce bir seçimi kaldır.';
        return;
      }
    }
    if (route()[0] === 'urunler') {
      updateCatalog();
      updateTray('urunler');
    } else render();
    restoreFocus(`[data-${data.save ? 'save' : 'compare'}="${id}"]`);
  }
});

window.addEventListener('hashchange', () => {
  historyStore = '';
  render();
  window.scrollTo(0, 0);
  screen.focus({ preventScroll: true });
});

render();
