import { categories } from './catalog.js';
import { readTechnicalSpecifications } from './specifications.js';
import {
  catalog, preferences, commit, updatePreferences, getProduct, productOffers,
  activeUser, parsePrice, saveOffer, notifyAlert, passwordDigest, usesDatabaseCatalog, loadDatabaseCatalog, loadPriceHistory,
  loadDatabaseUser, signInDatabase, signOutDatabase,
  requestApi,
} from './store.js';
import { empty, money, productLink } from './ui.js';
import {
  navigation, footer, catalogPage, catalogResults, productPage, comparePage,
  compareTray, accountPage, alertContents, reportsPage, adminPage, adminSpecs, adminSpecRow,
} from './views.js';

const main = document.querySelector('#main');
const header = document.querySelector('#site-header');
const tray = document.querySelector('#compare-tray');
const dialog = document.querySelector('#alert-dialog');
const status = document.querySelector('#feedback');
const pages = {
  urunler: 'Gitar ekipmanı karşılaştırma',
  urun: 'Ürün detayı',
  karsilastir: 'Ürün karşılaştırma',
  hesabim: 'Hesabım',
  raporlar: 'Raporlar',
  yonetim: 'Yönetici paneli',
};
const initialFilters = () => ({ search: '', category: '', brand: '', sort: 'default' });
let filters = initialFilters();
let reportFilters = { group: 'store', value: '', days: '30' };
let historyOffer = '';
let historyRequest;
let registration = false;
let pendingAlert = '';
let statusTimer;
let catalogState = usesDatabaseCatalog ? 'loading' : 'ready';

function route() {
  const [page, value] = location.hash.slice(1).split('/');
  try {
    return [page || 'urunler', decodeURIComponent(value || '')];
  } catch {
    return [page, ''];
  }
}

function render(focus = '') {
  const [page, value] = route();
  const product = page === 'urun' ? getProduct(value) : null;
  document.title = `${product ? `${product.brand} ${product.model}` : (Object.hasOwn(pages, page) ? pages[page] : 'Sayfa bulunamadı')} · GearCompare`;
  header.innerHTML = navigation(page === 'urun' ? 'urunler' : page);
  if (catalogState !== 'ready') {
    main.innerHTML = `<div class="shell interior">${catalogState === 'loading'
      ? '<p role="status">MySQL kataloğu yükleniyor…</p>'
      : empty('store', 'Katalog açılamadı', 'MySQL bağlantısını ve şema ayarlarını kontrol et.', '<button type="button" class="button button-primary" data-retry-catalog>Tekrar dene</button>')}</div>`;
    return;
  }
  const offers = product ? productOffers(product.id) : [];
  const offer = offers.find(({ id }) => id === historyOffer) ?? offers[0];
  if (usesDatabaseCatalog && offer && historyRequest?.offerId !== offer.id) {
    refreshPriceHistory(offer.id);
  }
  const renderPage = {
    urunler: () => catalogPage(filters),
    urun: () => product ? productPage(product, offers, offer, historyRequest) : notFound(),
    karsilastir: comparePage,
    hesabim: () => accountPage(value, registration),
    raporlar: () => reportsPage(reportFilters),
    yonetim: adminPage,
  };
  main.innerHTML = Object.hasOwn(renderPage, page) ? renderPage[page]() : notFound();
  tray.innerHTML = compareTray(page);
  restoreFocus(focus);
}

async function refreshPriceHistory(offerId) {
  const request = { offerId, state: 'loading' };
  historyRequest = request;
  try {
    request.points = await loadPriceHistory(offerId);
    request.state = 'ready';
  } catch {
    request.state = 'error';
  }
  if (historyRequest === request) {
    render(document.activeElement?.id === 'history-offer' ? '#history-offer' : '');
  }
}

function notFound() {
  return `<div class="shell interior"><h1>Sayfa bulunamadı</h1>${empty('search', 'Kataloğa dön', 'Aradığın ürünü katalogda marka veya model adıyla bulabilirsin.', '<a class="button button-primary" href="#urunler">Ürünlere dön</a>')}</div>`;
}

function restoreFocus(selector) {
  if (selector) (document.querySelector(selector) ?? main).focus({ preventScroll: true });
}

function renderCatalog(focus = '') {
  document.querySelector('#catalog-results').innerHTML = catalogResults(filters);
  tray.innerHTML = compareTray('urunler');
  restoreFocus(focus);
}

function announce(message) {
  clearTimeout(statusTimer);
  status.textContent = message;
  status.classList.add('visible');
  statusTimer = setTimeout(() => status.classList.remove('visible'), 3200);
}

function updateView(focus = '') {
  if (route()[0] === 'urunler') renderCatalog(focus);
  else render(focus);
}

function openAlert(id) {
  const product = getProduct(id);
  if (!product) return;
  dialog.innerHTML = alertContents(product);
  dialog.showModal();
}

function currentOffer() {
  const product = document.querySelector('#admin-product').value;
  const store = document.querySelector('#admin-store').value;
  const offer = productOffers(product).find((item) => item.store === store);
  document.querySelector('#offer-current').textContent = offer
    ? `Güncel fiyat: ${money(offer.price)}`
    : product && store ? 'Bu mağaza için yeni teklif oluşturulacak.' : '';
}

window.addEventListener('hashchange', () => {
  if (dialog.open) dialog.close();
  historyOffer = '';
  historyRequest = undefined;
  registration = false;
  render();
  window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
  if (pendingAlert && route()[0] === 'urun' && route()[1] === pendingAlert && activeUser()) {
    openAlert(pendingAlert);
    pendingAlert = '';
  }
});

document.addEventListener('input', (event) => {
  if (event.target.id !== 'search' || event.isComposing) return;
  filters.search = event.target.value;
  renderCatalog();
});

document.addEventListener('change', ({ target }) => {
  const value = target.value;
  switch (target.id) {
    case 'brand-filter':
    case 'sort-filter':
      filters[target.id === 'brand-filter' ? 'brand' : 'sort'] = value;
      renderCatalog(`#${target.id}`);
      break;
    case 'history-offer':
      historyOffer = value;
      render('#history-offer');
      break;
    case 'compare-0':
    case 'compare-1': {
      const compare = [...preferences.compare];
      compare[Number(target.id.at(-1))] = value;
      updatePreferences({ compare });
      render(`#${target.id}`);
      break;
    }
    case 'report-group':
      reportFilters = { ...reportFilters, group: value, value: '' };
      render('#report-group');
      break;
    case 'report-value':
    case 'report-days':
      reportFilters[target.id === 'report-value' ? 'value' : 'days'] = value;
      render(`#${target.id}`);
      break;
    case 'admin-category': {
      const type = categories[value].type;
      const fields = document.querySelector('#admin-specs');
      if (fields.dataset.productType !== type) {
        fields.innerHTML = adminSpecs(type);
        fields.dataset.productType = type;
      }
      break;
    }
    case 'admin-product':
    case 'admin-store':
      currentOffer();
      break;
  }
});

document.addEventListener('invalid', ({ target }) => {
  const details = target.closest('.spec-options');
  if (details) details.open = true;
}, true);

document.addEventListener('click', async (event) => {
  if (event.target.closest('.skip-link')) {
    event.preventDefault();
    main.focus();
    return;
  }

  if (event.target.closest('#alert-dialog a')) {
    pendingAlert = route()[1];
    dialog.close();
    return;
  }

  const button = event.target.closest('button');
  if (!button) return;
  const data = button.dataset;
  try {
    if ('retryCatalog' in data) {
      awaitDatabaseCatalog();
    } else if ('retryHistory' in data) {
      historyRequest = undefined;
      render('#history-offer');
    } else if (data.addSpecRow) {
      const list = button.closest('fieldset').querySelector('[data-spec-rows]');
      list.insertAdjacentHTML('beforeend', adminSpecRow(data.addSpecRow));
      list.lastElementChild.querySelector('input, select').focus();
    } else if ('removeSpecRow' in data) {
      const entry = button.closest('[data-spec-entry]');
      const add = entry.closest('fieldset').querySelector('[data-add-spec-row]');
      entry.remove();
      add.focus();
    } else if ('category' in data) {
      filters.category = data.category;
      renderCatalog(`[data-category="${CSS.escape(data.category)}"]`);
    } else if ('resetFilters' in data) {
      filters = initialFilters();
      const search = document.querySelector('#search');
      search.value = '';
      renderCatalog('[data-category=""]');
    } else if (data.favorite) {
      const user = activeUser();
      const saved = commit((draft) => {
        const list = draft.users.find(({ id }) => id === user?.id)?.favorites ?? draft.guestFavorites;
        const index = list.indexOf(data.favorite);
        if (index !== -1) list.splice(index, 1);
        else list.push(data.favorite);
        return index === -1;
      });
      updateView(`[data-favorite="${CSS.escape(data.favorite)}"]`);
      announce(saved ? 'Favorilere eklendi.' : 'Favorilerden çıkarıldı.');
    } else if (data.compare) {
      const compare = preferences.compare.filter(Boolean);
      const index = compare.indexOf(data.compare);
      if (index !== -1) compare.splice(index, 1);
      else if (compare.length < 2) compare.push(data.compare);
      else return announce('İki ürün seçili. Yeni ürün eklemek için bir seçimi kaldır.');
      updatePreferences({ compare });
      updateView(`[data-compare="${CSS.escape(data.compare)}"]`);
      announce(index === -1 ? 'Karşılaştırmaya eklendi.' : 'Karşılaştırmadan çıkarıldı.');
    } else if (data.priceAlert) {
      openAlert(data.priceAlert);
    } else if ('closeDialog' in data) {
      dialog.close();
    } else if ('accountMode' in data) {
      registration = !registration;
      render('[data-account-form] input');
    } else if ('signOut' in data) {
      if (usesDatabaseCatalog) await signOutDatabase();
      else updatePreferences({ userId: '' });
      registration = false;
      render('[data-account-form] input');
      announce('Oturum kapatıldı.');
    } else if (data.removeAlert) {
      const user = activeUser();
      if (!user) return;
      commit((draft) => {
        draft.alerts = draft.alerts.filter(({ id, user: owner }) => id !== data.removeAlert || owner !== user.id);
      });
      render('.tabs [aria-current]');
      announce('Fiyat alarmı silindi.');
    } else if ('adminMode' in data) {
      updatePreferences({ demoAdmin: !preferences.demoAdmin });
      render(preferences.demoAdmin ? '[data-admin] input' : '[data-admin-mode]');
    }
  } catch (error) {
    announce(error.message || 'İşlem tamamlanamadı. Tekrar dene.');
  }
});

function requiredText(value) {
  if (!value.trim()) throw new Error('Tüm zorunlu alanları doldur.');
  return value.trim();
}

async function handleAccount(form) {
  const input = new FormData(form);
  const email = input.get('email').trim().toLowerCase();
  const password = input.get('password');
  if (usesDatabaseCatalog) {
    await signInDatabase(email, password, registration);
    announce(registration ? 'Hesap oluşturuldu.' : 'Giriş yapıldı.');
    registration = false;
    render('[data-sign-out]');
    return;
  }
  let user = catalog.users.find((item) => item.email === email);
  if (registration) {
    if (user) throw new Error('Bu e-posta ile bir demo hesabı var. Giriş yapabilirsin.');
    const salt = crypto.randomUUID();
    user = { id: crypto.randomUUID(), email, salt, digest: await passwordDigest(password, salt), favorites: [] };
    commit((draft) => {
      if (draft.users.some((item) => item.email === email)) throw new Error('Bu e-posta ile bir demo hesabı var.');
      user.favorites = [...draft.guestFavorites];
      draft.users.push(user);
      draft.guestFavorites = [];
    });
  } else {
    if (!user || user.digest !== await passwordDigest(password, user.salt)) throw new Error('E-posta veya parola hatalı.');
  }
  updatePreferences({ userId: user.id });
  const product = pendingAlert ? getProduct(pendingAlert) : null;
  location.hash = product ? productLink(product) : '#hesabim/favoriler';
  announce(registration ? 'Demo hesabı oluşturuldu.' : 'Giriş yapıldı.');
}

function handleAlert(form, id) {
  const user = activeUser();
  if (!user) throw new Error('Fiyat alarmı kurmak için giriş yap.');
  const target = parsePrice(new FormData(form).get('target'));
  if (!(target > 0 && target <= 10000000)) throw new Error('Geçerli bir hedef fiyat gir.');
  commit((draft) => {
    const current = draft.alerts.find((item) => item.user === user.id && item.product === id);
    if (current?.target === target) return;
    const alert = current ?? { id: crypto.randomUUID(), user: user.id, product: id };
    const prior = alert.target ?? 0;
    alert.target = target;
    if (!current) draft.alerts.push(alert);
    const matching = draft.offers.filter((offer) => offer.product === id && offer.price > prior && offer.price <= target)
      .sort((a, b) => a.price - b.price)[0];
    if (matching) notifyAlert(draft, alert, matching, new Date().toISOString());
  });
  dialog.close();
  announce('Fiyat alarmı kaydedildi.');
}

async function handleAdmin(form, entity) {
  if (!usesDatabaseCatalog && !preferences.demoAdmin) throw new Error('Demo yönetimini aç.');
  const input = new FormData(form);
  if (entity === 'product') {
    const category = input.get('admin-category');
    const brand = requiredText(input.get('brand'));
    const model = requiredText(input.get('model'));
    const details = readTechnicalSpecifications(input, categories[category].type);
    const description = input.get('description').trim();
    const source = input.get('source').trim();
    if (source && !['https:', 'http:'].includes(new URL(source).protocol)) {
      throw new Error('Üretici sayfası için http:// veya https:// ile başlayan bir adres gir.');
    }
    if (usesDatabaseCatalog) {
      await requestApi('api/admin/products', 'POST', { brand, model, category, description, source, ...details });
      const message = await refreshDatabaseCatalog('Ürün eklendi.');
      if (form.isConnected) render('[data-admin="product"] input');
      announce(message);
      return;
    }
    const key = (name) => name.toLocaleLowerCase('tr-TR');
    commit((draft) => {
      if (draft.products.some((item) => key(item.brand) === key(brand) && key(item.model) === key(model) && item.category === category)) {
        throw new Error('Bu ürün katalogda zaten var.');
      }
      draft.products.push({ id: crypto.randomUUID(), brand, model, category, description, source, ...details });
    });
    render('[data-admin="product"] input');
    announce('Ürün eklendi.');
  } else if (entity === 'store') {
    const name = requiredText(input.get('name'));
    const website = input.get('website').trim();
    if (website && !['https:', 'http:'].includes(new URL(website).protocol)) {
      throw new Error('http:// veya https:// ile başlayan bir adres gir.');
    }
    if (usesDatabaseCatalog) {
      await requestApi('api/admin/stores', 'POST', { name, website });
      if (form.isConnected) render('[data-admin="store"] input');
      announce('Mağaza eklendi.');
      return;
    }
    commit((draft) => {
      if (draft.stores.some((store) => store.name.toLocaleLowerCase('tr-TR') === name.toLocaleLowerCase('tr-TR'))) {
        throw new Error('Bu mağaza zaten var.');
      }
      draft.stores.push({ id: crypto.randomUUID(), name, website });
    });
    render('[data-admin="store"] input');
    announce('Mağaza eklendi.');
  } else {
    const product = input.get('admin-product');
    const store = input.get('admin-store');
    const price = parsePrice(input.get('price'));
    if (!(price > 0 && price <= 10000000)) throw new Error('Geçerli bir teklif fiyatı gir.');
    const updated = commit((draft) => saveOffer(draft, product, store, price));
    form.elements.price.value = '';
    currentOffer();
    announce(updated ? 'Teklif ve fiyat geçmişi güncellendi.' : 'Teklif eklendi.');
  }
}

async function refreshDatabaseCatalog(message) {
  try {
    await loadDatabaseCatalog();
    return message;
  } catch {
    return `${message} Kataloğu görmek için sayfayı yenile.`;
  }
}

document.addEventListener('submit', async (event) => {
  const form = event.target;
  event.preventDefault();
  if (form.id === 'search-form') {
    filters.search = form.elements.search.value;
    renderCatalog();
    const equipment = document.querySelector('#equipment');
    equipment.focus({ preventScroll: true });
    equipment.scrollIntoView();
    return;
  }

  const errorRegion = form.querySelector('.form-error');
  const submit = form.querySelector('button[type="submit"]');
  errorRegion.textContent = '';
  submit.disabled = true;
  try {
    if ('accountForm' in form.dataset) await handleAccount(form);
    else if (form.dataset.alertForm) handleAlert(form, form.dataset.alertForm);
    else if (form.dataset.admin) await handleAdmin(form, form.dataset.admin);
  } catch (error) {
    errorRegion.textContent = error.message || 'İşlem tamamlanamadı. Tekrar dene.';
  } finally {
    submit.disabled = false;
  }
});

async function awaitDatabaseCatalog() {
  catalogState = 'loading';
  render();
  try {
    await Promise.all([loadDatabaseCatalog(), loadDatabaseUser().catch(() => {})]);
    catalogState = 'ready';
  } catch {
    catalogState = 'error';
  }
  render();
}

document.querySelector('#site-footer').innerHTML = footer();
if (usesDatabaseCatalog) awaitDatabaseCatalog();
else render();
