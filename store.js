import { categories, expandSeedSpecifications, initialCatalog } from './catalog.js';

const catalogKey = 'gearcompare.catalog.v1';
const preferenceKey = 'gearcompare.preferences.v1';
export const usesDatabaseCatalog = document.querySelector('meta[name="gearcompare-catalog"]')?.content === 'mysql';
let serverProducts = null;
let databaseOffers = [];
const databaseStores = new Map();
let databaseUser = null;
export let databasePricingAvailable = false;

function read(storage, key, fallback) {
  try {
    return JSON.parse(storage.getItem(key)) ?? fallback();
  } catch {
    return fallback();
  }
}

export let catalog = expandSeedSpecifications(read(localStorage, catalogKey, initialCatalog));
export let preferences = read(sessionStorage, preferenceKey, () => ({ userId: '', demoAdmin: false, compare: [] }));

export async function requestApi(path, method = 'GET', data) {
  const headers = { Accept: 'application/json' };
  if (data !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(path, { method, cache: 'no-store', headers, body: JSON.stringify(data) });
  if (!response.ok) {
    const messages = {
      400: 'Girdiğin bilgileri kontrol et.', 401: 'Giriş bilgilerini veya oturumunu kontrol et.',
      403: 'Bu işlem için yetkin yok.', 409: 'Bu kayıt zaten var.',
      503: 'Veritabanına şu anda ulaşılamıyor.',
    };
    throw new Error(messages[response.status] ?? 'İşlem tamamlanamadı. Tekrar dene.');
  }
  return response.status === 204 ? null : response.json();
}

export async function loadDatabaseUser() {
  databaseUser = await requestApi('api/account/session');
}

export async function signInDatabase(email, password, register) {
  databaseUser = await requestApi(`api/account/${register ? 'register' : 'login'}`, 'POST', { email, password });
}

export async function signOutDatabase() {
  await requestApi('api/account/session', 'DELETE');
  databaseUser = null;
}

export async function loadDatabaseCatalog() {
  const [products, pricing] = await Promise.all([
    requestApi('api/products'),
    requestApi('api/offers').catch(() => ({ available: false, offers: [] })),
  ]);
  for (const { category, categoryName, productType } of products) {
    Object.defineProperty(categories, category, {
      value: {
        name: categoryName,
        icon: { GUITAR: 'guitar', AMPLIFIER: 'amp', PEDAL: 'pedal' }[productType],
        type: productType,
      },
      writable: true, enumerable: true, configurable: true,
    });
  }
  serverProducts = products;
  catalog = { ...catalog, products };
  databasePricingAvailable = pricing.available;
  databaseStores.clear();
  databaseOffers = pricing.offers.map(({ id, product, store, price }) => {
    databaseStores.set(store.id, store);
    return { id, product, store: store.id, price };
  });
  const ids = new Set(products.map(({ id }) => id));
  preferences = { ...preferences, compare: preferences.compare.map((id) => ids.has(id) ? id : '') };
}

export const loadPriceHistory = (offerId) => requestApi(`api/offers/${encodeURIComponent(offerId)}/history`);

export function commit(change) {
  const saved = expandSeedSpecifications(read(localStorage, catalogKey, initialCatalog));
  const latest = serverProducts ? { ...saved, products: serverProducts } : saved;
  const result = change(latest);
  localStorage.setItem(catalogKey, JSON.stringify(serverProducts ? { ...latest, products: saved.products } : latest));
  catalog = latest;
  return result;
}

export function updatePreferences(change) {
  preferences = { ...preferences, ...change };
  sessionStorage.setItem(preferenceKey, JSON.stringify(preferences));
}

export const getProduct = (id) => catalog.products.find((product) => product.id === id);
export const getStore = (id) => databaseStores.get(id) ?? catalog.stores.find((store) => store.id === id);
export const activeUser = () => usesDatabaseCatalog ? databaseUser : catalog.users.find((user) => user.id === preferences.userId);
export const favorites = () => activeUser()?.favorites ?? catalog.guestFavorites;

export function productOffers(id) {
  const offers = usesDatabaseCatalog ? databaseOffers : catalog.offers;
  return offers.filter((offer) => offer.product === id).sort((a, b) => a.price - b.price);
}

export const bestPrice = (id) => productOffers(id)[0]?.price;
export const parsePrice = (raw) => Math.round(Number(raw) * 100) / 100;

export function notifyAlert(database, alert, offer, timestamp) {
  database.notifications.unshift({
    id: crypto.randomUUID(), user: alert.user, alert: alert.id, offer: offer.id,
    product: offer.product, store: offer.store, price: offer.price, date: timestamp,
  });
}

export function saveOffer(database, product, store, price) {
  if (!database.products.some(({ id }) => id === product) || !database.stores.some(({ id }) => id === store)) {
    throw new Error('Geçerli bir ürün ve mağaza seç.');
  }

  const existing = database.offers.find((item) => item.product === product && item.store === store);
  if (existing?.price === price) throw new Error('Bu teklif zaten aynı fiyatta.');

  const lastDate = existing?.history.at(-1)?.date;
  const date = new Date(Math.max(Date.now(), lastDate ? Date.parse(lastDate) + 1 : 0)).toISOString();
  const previousPrice = existing?.price ?? Infinity;
  const offer = existing ?? { id: crypto.randomUUID(), product, store, history: [] };
  offer.price = price;
  offer.history.push({ date, price });
  if (!existing) database.offers.push(offer);

  for (const alert of database.alerts) {
    if (alert.product === product && previousPrice > alert.target && price <= alert.target) {
      notifyAlert(database, alert, offer, date);
    }
  }
  return Boolean(existing);
}

export async function passwordDigest(password, salt) {
  const encode = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encode.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: encode.encode(salt), iterations: 600000 },
    key, 256,
  );
  return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
