import { categories } from './catalog.js';
import { catalog, activeUser, favorites, preferences, productOffers, bestPrice, getProduct, getStore } from './store.js';
import { icon, html, money, dateLabel, title, productLink, productLinkText, select, table, empty, priceChart } from './ui.js';

const categoryChoices = Object.entries(categories).map(([key, { name }]) => [key, name]);
const productChoices = () => catalog.products.map((product) => [product.id, title(product)]);
const storeChoices = () => catalog.stores.map(({ id, name }) => [id, name]);
const catalogLink = '<a class="button button-primary" href="#urunler">Ürünleri keşfet</a>';
const demoNote = '<p class="note">Mağazalar, teklifler ve fiyat geçmişi demo verisidir. Ürün görselleri temsilidir.</p>';
const priceCell = (price) => `<span class="numeric">${money(price)}</span>`;
const sortName = (a, b) => a.localeCompare(b, 'tr-TR');

const foldSearch = (text) => text.toLocaleLowerCase('tr-TR').replaceAll('ı', 'i').normalize('NFD').replace(/\p{Diacritic}/gu, '');

function storeLink(store) {
  return store.website
    ? `<a class="text-link" href="${html(store.website)}" target="_blank" rel="noopener noreferrer">${html(store.name)}</a>`
    : html(store.name);
}

export function brand() {
  return '<a class="brand" href="#urunler" aria-label="GearCompare ana sayfa"><span class="brand-mark" aria-hidden="true"></span><span class="brand-text">Gear<span>Compare</span></span></a>';
}

export function navigation(page) {
  const link = (id, label) => `<a href="#${id}"${page === id ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<div class="shell header-inner">
    ${brand()}
    <nav class="main-nav" aria-label="Ana menü">
      ${link('urunler', 'Ürünler')}${link('karsilastir', 'Karşılaştır')}${link('raporlar', 'Raporlar')}
    </nav>
    <div class="header-actions">
      <a class="icon-button" href="#hesabim/favoriler" aria-label="Favorilerim" title="Favorilerim">${icon('heart')}</a>
      <a class="button button-outline header-account" href="#hesabim" ${page === 'hesabim' ? 'aria-current="page"' : ''} aria-label="Hesabım">${icon('user')}<span>Hesabım</span></a>
    </div>
  </div>`;
}

export function footer() {
  return `<div class="shell footer-inner">
    ${brand()}
    <p>Gitar ekipmanı fiyat karşılaştırma projesi</p>
    <a class="text-link" href="#yonetim">Yönetici paneli</a>
  </div>`;
}

function productImage(product) {
  const asset = product.image;
  return asset
    ? `<img src="assets/${html(asset)}.jpg" alt="" width="512" height="512" decoding="async">`
    : icon(categories[product.category].icon);
}

function favoriteButton(product, full = false) {
  const saved = favorites().includes(product.id);
  const action = saved ? 'Favorilerden çıkar' : 'Favorilere ekle';
  const label = full ? action : `${title(product)} · ${action}`;
  return `<button type="button" class="${full ? 'button button-outline' : 'favorite-button'}${saved ? ' is-favorite' : ''}" data-favorite="${html(product.id)}" aria-label="${html(label)}" aria-pressed="${saved}" title="${html(action)}">${icon('heart')}${full ? action : ''}</button>`;
}

function compareButton(product) {
  const selected = preferences.compare.includes(product.id);
  return `<button type="button" class="button button-outline card-compare" data-compare="${html(product.id)}" aria-pressed="${selected}" title="${html(title(product))}">${icon(selected ? 'check' : 'compare')}${selected ? 'Seçildi' : 'Karşılaştır'}</button>`;
}

function productCard(product) {
  const offers = productOffers(product.id);
  return `<article class="product-card">
    <a class="product-image" href="${productLink(product)}" aria-label="${html(title(product))} ürün detayı">${productImage(product)}</a>
    <div class="card-content">
      <div class="card-brand">${html(product.brand)} <span></span> ${categories[product.category].name}</div>
      <h3><a href="${productLink(product)}">${html(product.model)}</a></h3>
      <div class="card-bottom">
        <div>
          ${offers.length ? `<strong class="card-price"><span class="sr-only">En düşük fiyat: </span>${money(offers[0].price)}</strong>
            <div class="store-count">${offers.length} mağaza</div>` : '<div class="price-label">Teklif yok</div>'}
        </div>
        <div class="card-actions">${compareButton(product)}${favoriteButton(product)}</div>
      </div>
    </div>
  </article>`;
}

const grid = (products) => `<div class="product-grid">${products.map(productCard).join('')}</div>`;

export function catalogPage(filters) {
  return `<section class="hero" aria-labelledby="hero-title">
      <div class="hero-image" aria-hidden="true"><img src="assets/hero.jpg" alt="" width="1200" height="800" fetchpriority="high"></div>
      <div class="shell hero-copy">
        <h1 id="hero-title">Sıradaki<br>tonunu bul.</h1>
        <p>Gitar, amfi ve pedalların mağaza fiyatlarını karşılaştır.</p>
        <form id="search-form" class="hero-search" role="search">
          ${icon('search')}
          <label class="sr-only" for="search">Marka, model veya ekipman ara</label>
          <input id="search" name="search" type="search" placeholder="Ekipman ara" value="${html(filters.search)}" autocomplete="off">
          <button class="button button-primary" type="submit">Ara</button>
        </form>
      </div>
    </section>
    <section id="equipment" class="shell equipment" aria-label="Ekipman kataloğu" tabindex="-1">
      <div id="catalog-results">${catalogResults(filters)}</div>
      ${demoNote}
    </section>`;
}

export function catalogResults(filters) {
  const brands = [...new Set(catalog.products.map(({ brand }) => brand))].sort(sortName);
  const query = foldSearch(filters.search.trim()).split(/\s+/).filter(Boolean);
  const products = catalog.products.filter((product) => {
    const description = foldSearch(`${title(product)} ${categories[product.category].name}`);
    return query.every((word) => description.includes(word))
      && (!filters.category || product.category === filters.category)
      && (!filters.brand || product.brand === filters.brand);
  });
  if (filters.sort === 'name') products.sort((a, b) => sortName(title(a), title(b)));
  if (filters.sort === 'low' || filters.sort === 'high') {
    const direction = filters.sort === 'low' ? 1 : -1;
    products.sort((a, b) => {
      const first = bestPrice(a.id);
      const second = bestPrice(b.id);
      if (first == null) return second == null ? 0 : 1;
      if (second == null) return -1;
      return direction * (first - second);
    });
  }
  const buttons = [['', 'Tümü'], ...categoryChoices];
  return `<div class="categories" role="group" aria-label="Ekipman kategorisi">
      ${buttons.map(([id, name]) => `<button class="category" type="button" data-category="${id}" aria-pressed="${filters.category === id}">${name}</button>`).join('')}
    </div>
    <div class="catalog-controls">
      <span class="result-count" role="status">${products.length} ürün</span>
      <div class="filters">
        ${select('brand-filter', 'Markaya göre filtrele', [['', 'Tüm markalar'], ...brands.map((brand) => [brand, brand])], filters.brand)}
        ${select('sort-filter', 'Ürünleri sırala', [['default', 'Varsayılan sıra'], ['low', 'En düşük fiyat'], ['high', 'En yüksek fiyat'], ['name', 'Ürün adı A–Z']], filters.sort)}
      </div>
    </div>
    ${products.length ? grid(products) : empty('search', 'Ürün bulunamadı', 'Başka bir marka veya model ara ya da filtreleri temizle.', '<button class="button button-outline" data-reset-filters>Filtreleri temizle</button>')}`;
}

export function productPage(product, selectedOffer) {
  const category = categories[product.category];
  const offers = productOffers(product.id);
  const offer = offers.find((item) => item.id === selectedOffer) ?? offers[0];
  return `<div class="shell interior">
    <a class="back-link" href="#urunler">${icon('back')} Ürünler</a>
    <section class="detail-intro">
      <div class="product-image detail-image">${productImage(product)}</div>
      <div class="detail-copy">
        <div class="card-brand">${html(product.brand)} <span></span> ${category.name}</div>
        <h1>${html(product.model)}</h1>
        <div class="price-label">${offers.length ? 'En düşük fiyat' : 'Teklif yok'}</div>
        <div class="detail-price">${money(offers[0]?.price)}</div>
        <div class="inline-actions">
          ${offers.length ? `<button type="button" class="button button-primary" data-price-alert="${html(product.id)}">${icon('bell')} Fiyat alarmı kur</button>` : ''}
          ${favoriteButton(product, true)}${compareButton(product)}
        </div>
      </div>
    </section>
    <div class="detail-panels">
      <section class="panel"><h2>Mağaza fiyatları</h2>
        ${offers.length ? table(['Mağaza', 'Fiyat'], offers.map((item) => [
          storeLink(getStore(item.store)), priceCell(item.price),
        ]), 'Mağaza fiyatları') : '<p>Bu ürün için henüz mağaza teklifi yok.</p>'}
      </section>
      <section class="panel"><h2>Teknik özellikler</h2>
        <dl class="spec-list">${category.specs.map((label, i) => `<div><dt>${label}</dt><dd>${html(product.values[i])}</dd></div>`).join('')}</dl>
        ${product.source ? `<a class="text-link source" href="${html(product.source)}" target="_blank" rel="noopener noreferrer">Üretici bilgileri</a>` : ''}
      </section>
    </div>
    ${offer ? `<section class="panel history">
      <div class="section-heading"><h2>Fiyat geçmişi</h2>${select('history-offer', 'Fiyat geçmişi için mağaza seç', offers.map((item) => [item.id, getStore(item.store).name]), offer.id)}</div>
      <div class="chart-wrap">${priceChart(offer.history)}</div>
      <details><summary>Fiyat kayıtlarını göster</summary>
        ${table(['Tarih', 'Fiyat'], offer.history.slice().reverse().map((item) => [dateLabel(item.date), priceCell(item.price)]), 'Fiyat geçmişi kayıtları')}
      </details>
    </section>` : ''}
    ${demoNote}
  </div>`;
}

export function comparePage() {
  const [first, second] = preferences.compare.map(getProduct);
  const rows = [
    ['Kategori', ...[first, second].map((product) => product ? categories[product.category].name : '—')],
    ['En düşük fiyat', ...[first, second].map((product) => priceCell(product && bestPrice(product.id)))],
    ...[...new Set([first, second].flatMap((product) => product ? categories[product.category].specs : []))].map((key) => [
      key, ...[first, second].map((product) => {
        const index = product ? categories[product.category].specs.indexOf(key) : -1;
        return index === -1 ? '—' : html(product.values[index]);
      }),
    ]),
  ];
  const firstOffers = first ? productOffers(first.id) : [];
  const secondOffers = second ? productOffers(second.id) : [];
  const offeredStores = [...new Set([...firstOffers, ...secondOffers].map(({ store }) => store))];
  return `<div class="shell interior">
    <div class="page-heading"><h1>Ürün karşılaştırma</h1><p>İki ürün seç, teknik özelliklerini ve mağaza fiyatlarını yan yana gör.</p></div>
    <div class="compare-picks">
      ${[first, second].map((product, index) => `<section class="panel compare-pick">
        <label for="compare-${index}">${index === 0 ? 'Birinci ürün' : 'İkinci ürün'}</label>
        ${select(`compare-${index}`, index === 0 ? 'Birinci ürün' : 'İkinci ürün',
          [['', 'Ürün seç'], ...productChoices().filter(([id]) => id !== (index === 0 ? second : first)?.id)], product?.id ?? '')}
        ${product ? `<a class="product-image compare-image" href="${productLink(product)}" aria-label="${html(title(product))} ürün detayı">${productImage(product)}</a>`
          : `<div class="empty-pick">${icon('plus')}</div>`}
      </section>`).join('')}
    </div>
    ${first && second ? `<section class="panel"><h2>Teknik özellikler</h2>
      ${table(['Özellik', productLinkText(first), productLinkText(second)], rows, 'Ürün karşılaştırması')}
    </section>
    <section class="panel"><h2>Mağaza fiyatları</h2>
      ${offeredStores.length ? table(['Mağaza', html(first.model), html(second.model)], offeredStores.map((id) => [
        html(getStore(id).name), priceCell(firstOffers.find(({ store }) => store === id)?.price), priceCell(secondOffers.find(({ store }) => store === id)?.price),
      ]), 'Mağazaya göre fiyat karşılaştırması') : '<p>Seçilen ürünler için henüz teklif yok.</p>'}
    </section>${demoNote}` : ''}
  </div>`;
}

export function compareTray(page) {
  const selected = preferences.compare.filter(Boolean).map(getProduct).filter(Boolean);
  if (!selected.length || page === 'karsilastir') return '';
  return `<div class="compare-tray-inner">
    <div class="tray-copy"><strong>Karşılaştırma</strong><span>${selected.length}/2 ürün seçildi</span></div>
    <div class="tray-items">${selected.map((product) => `<button type="button" class="tray-item" data-compare="${html(product.id)}" aria-label="${html(title(product))} seçimini kaldır">${html(product.model)}${icon('close')}</button>`).join('')}</div>
    <a class="button button-primary" href="#karsilastir">Karşılaştır</a>
  </div>`;
}

const accountTabs = [
  ['favoriler', 'Favoriler'],
  ['alarmlar', 'Fiyat alarmları'],
  ['bildirimler', 'Bildirimler'],
  ['hesap', 'Oturum'],
];

export function accountPage(tab, registration) {
  const user = activeUser();
  const tabId = accountTabs.some(([id]) => id === tab) ? tab : (user ? 'favoriler' : 'hesap');
  let body;
  if (tabId === 'favoriler') {
    const products = favorites().map(getProduct).filter(Boolean);
    body = products.length ? grid(products) : empty('heart', 'Henüz favorin yok', 'Üründeki kalbe dokunarak favorilerine ekle.', catalogLink);
  } else if (tabId === 'hesap') {
    body = user ? `<section class="panel compact"><h2>Oturum</h2><p>${html(user.email)}</p><button class="button button-outline" type="button" data-sign-out>Çıkış yap</button></section>`
      : `<section class="panel compact">
      <h2>${registration ? 'Kayıt ol' : 'Giriş yap'}</h2>
      <p>Demo hesap bu tarayıcıda saklanır. Örnek bir e-posta ve parola kullan.</p>
      <form class="form" data-account-form>
        <label>E-posta<input type="email" name="email" maxlength="120" autocomplete="email" required></label>
        <label>Parola<input type="password" name="password" minlength="8" maxlength="128" autocomplete="${registration ? 'new-password' : 'current-password'}" required></label>
        <p class="form-error" role="alert"></p>
        <button class="button button-primary" type="submit">${registration ? 'Kayıt ol' : 'Giriş yap'}</button>
      </form>
      <button class="text-link account-switch" type="button" data-account-mode>${registration ? 'Zaten hesabın var mı? Giriş yap' : 'Hesabın yok mu? Kayıt ol'}</button>
    </section>`;
  } else if (!user) {
    body = empty('user', 'Giriş yap', 'Fiyat alarmlarını ve bildirimlerini görmek için giriş yap.', '<a class="button button-primary" href="#hesabim/hesap">Giriş yap</a>');
  } else if (tabId === 'alarmlar') {
    const alerts = catalog.alerts.filter((item) => item.user === user.id);
    body = alerts.length ? `<section class="panel"><h2>Fiyat alarmlarım</h2>${table(['Ürün', 'Hedef fiyat', 'İşlem'], alerts.map((alert) => [
      productLinkText(getProduct(alert.product)), priceCell(alert.target),
      `<button type="button" class="button button-outline" data-remove-alert="${html(alert.id)}">Alarmı sil</button>`,
    ]), 'Fiyat alarmları')}</section>` : empty('bell', 'Henüz fiyat alarmın yok', 'Ürün detayında hedef fiyat belirle. Bir teklif hedefe ulaştığında burada bildirim görürsün.', catalogLink);
  } else {
    const notifications = catalog.notifications.filter((item) => item.user === user.id);
    body = notifications.length ? `<section class="panel"><h2>Fiyat bildirimlerim</h2>${table(['Ürün', 'Mağaza', 'Fiyat', 'Tarih'], notifications.map((item) => [
      productLinkText(getProduct(item.product)), html(getStore(item.store).name), priceCell(item.price), dateLabel(item.date),
    ]), 'Fiyat bildirimleri')}</section>` : empty('bell', 'Henüz bildirim yok', 'Bir mağaza teklifinde hedef fiyatına ulaşıldığında burada görünecek.');
  }

  return `<div class="shell interior"><div class="page-heading"><h1>Hesabım</h1></div>
    <nav class="tabs" aria-label="Hesap menüsü">${accountTabs.map(([id, label]) => `<a href="#hesabim/${id}"${id === tabId ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
    ${body}
  </div>`;
}

export function alertContents(product) {
  const user = activeUser();
  const current = catalog.alerts.find((item) => item.user === user?.id && item.product === product.id);
  return `<div class="dialog-heading"><h2 id="alert-title">Fiyat alarmı kur</h2><button type="button" class="icon-button" aria-label="Kapat" data-close-dialog>${icon('close')}</button></div>
    <p>${html(title(product))}</p>
    ${user ? `<form class="form" data-alert-form="${html(product.id)}">
      <label>Hedef fiyat (₺)<input type="number" name="target" value="${current?.target ?? ''}" min="0.01" max="10000000" step="0.01" required></label>
      <p class="hint">Bir mağaza teklifi bu fiyata veya altına indiğinde bildirim alırsın.</p>
      <p class="form-error" role="alert"></p>
      <button class="button button-primary" type="submit">Alarmı kaydet</button>
    </form>` : '<p class="hint">Fiyat alarmı kurmak için giriş yap.</p><a class="button button-primary" href="#hesabim/hesap">Giriş yap</a>'}`;
}

export function reportsPage(filters) {
  const choices = filters.group === 'store' ? storeChoices() : categoryChoices;
  const groupId = (offer) => filters.group === 'store' ? offer.store : getProduct(offer.product).category;
  const groupOffers = catalog.offers.filter((offer) => !filters.value || groupId(offer) === filters.value);
  const groups = choices.filter(([id]) => !filters.value || filters.value === id).map(([id, name]) => {
    const offers = groupOffers.filter((offer) => groupId(offer) === id);
    const prices = offers.map(({ price }) => price);
    return [html(name), new Set(offers.map(({ product }) => product)).size, offers.length,
      priceCell(offers.length ? Math.min(...prices) : null),
      priceCell(offers.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : null)];
  });
  const cutoff = filters.days ? Date.now() - Number(filters.days) * 86400000 : 0;
  const changes = groupOffers.flatMap((offer) => {
    const last = offer.history.at(-1);
    const prior = offer.history.slice(0, -1).findLast((item) => Date.parse(item.date) <= cutoff) ?? offer.history[0];
    if (prior === last || Date.parse(last.date) < cutoff || prior.price === last.price) return [];
    const percent = (last.price - prior.price) / prior.price * 100;
    const formatted = new Intl.NumberFormat('tr-TR', { style: 'percent', maximumFractionDigits: 1, signDisplay: 'always' }).format(percent / 100);
    return [{ offer, prior, percent, formatted }];
  }).sort((a, b) => Math.abs(b.percent) - Math.abs(a.percent));
  return `<div class="shell interior">
    <div class="page-heading"><h1>Raporlar</h1><p>Mağaza veya kategori bazında teklifleri ve fiyat değişimlerini incele.</p></div>
    <div class="report-filters">
      ${select('report-group', 'Rapor grubu', [['store', 'Mağazaya göre'], ['category', 'Kategoriye göre']], filters.group)}
      ${select('report-value', 'Rapor filtresi', [['', filters.group === 'store' ? 'Tüm mağazalar' : 'Tüm kategoriler'], ...choices], filters.value)}
    </div>
    <section class="panel"><h2>Güncel teklif özeti</h2>
      ${table([filters.group === 'store' ? 'Mağaza' : 'Kategori', 'Ürün', 'Teklif', 'En düşük fiyat', 'Ortalama fiyat'], groups, 'Güncel teklif özeti')}
    </section>
    <section class="panel"><div class="section-heading"><h2>Fiyat değişimleri</h2>${select('report-days', 'Fiyat değişimi dönemi', [['7', 'Son 7 gün'], ['30', 'Son 30 gün'], ['', 'Tüm dönemler']], filters.days)}</div>
      ${changes.length ? table(['Ürün', 'Mağaza', 'Önceki fiyat', 'Güncel fiyat', 'Değişim'], changes.map(({ offer, prior, percent, formatted }) => [
        productLinkText(getProduct(offer.product)), html(getStore(offer.store).name), priceCell(prior.price), priceCell(offer.price),
        `<span class="numeric ${percent < 0 ? 'decrease' : ''}">${formatted}</span>`,
      ]), 'Fiyat değişimleri') : '<p>Seçilen dönem ve filtre için fiyat değişimi yok.</p>'}
    </section>
    ${demoNote}
  </div>`;
}

export function adminSpecs(category) {
  return (categories[category]?.specs ?? []).map((label, i) => `<label>${label}<input name="spec-${i}" type="${label === 'Tel sayısı' ? 'number' : 'text'}"${label === 'Tel sayısı' ? ' min="1" max="24"' : ' maxlength="80"'} required></label>`).join('');
}

export function adminPage() {
  return `<div class="shell interior">
    <div class="page-heading"><h1>Yönetici paneli</h1><p>Ürün, mağaza ve teklifleri yerel demo verisinde yönet.</p></div>
    ${preferences.demoAdmin ? `<div class="admin-grid">
      <section class="panel"><h2>Ürün ekle</h2><form class="form" data-admin="product">
        <label>Marka<input name="brand" required maxlength="50"></label>
        <label>Model<input name="model" required maxlength="80"></label>
        <label>Kategori${select('admin-category', 'Ürün kategorisi', categoryChoices, 'electro', true)}</label>
        <div class="form" id="admin-specs">${adminSpecs('electro')}</div>
        <p class="form-error" role="alert"></p>
        <button class="button button-primary" type="submit">Ürün ekle</button>
      </form></section>
      <section class="panel"><h2>Mağaza ekle</h2><form class="form" data-admin="store">
        <label>Mağaza adı<input name="name" required maxlength="70"></label>
        <label>Web sitesi (isteğe bağlı)<input name="website" type="url" maxlength="200" placeholder="https://"></label>
        <p class="form-error" role="alert"></p>
        <button class="button button-primary" type="submit">Mağaza ekle</button>
      </form></section>
      <section class="panel"><h2>Teklif ekle veya güncelle</h2><form class="form" data-admin="offer">
        <label>Ürün${select('admin-product', 'Teklif ürünü', [['', 'Ürün seç'], ...productChoices()], '', true)}</label>
        <label>Mağaza${select('admin-store', 'Teklif mağazası', [['', 'Mağaza seç'], ...storeChoices()], '', true)}</label>
        <label>Fiyat (₺)<input name="price" type="number" min="0.01" max="10000000" step="0.01" required></label>
        <p id="offer-current" class="hint"></p>
        <p class="form-error" role="alert"></p>
        <button class="button button-primary" type="submit">Teklifi kaydet</button>
      </form></section>
      </div><button class="button button-outline admin-exit" type="button" data-admin-mode>Demo yönetiminden çık</button>`
      : `<section class="panel compact"><h2>Demo yönetimi</h2><p>Eklediğin kayıtlar ve fiyat güncellemeleri bu tarayıcıya kaydedilir.</p><button class="button button-primary" type="button" data-admin-mode>Demo yönetimini aç</button></section>`}
  </div>`;
}
