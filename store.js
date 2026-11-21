import { initialCatalog } from './catalog.js';

const catalogKey = 'gearcompare.catalog.v1';
const preferenceKey = 'gearcompare.preferences.v1';

function read(storage, key, fallback) {
  try {
    return JSON.parse(storage.getItem(key)) ?? fallback();
  } catch {
    return fallback();
  }
}

export let catalog = read(localStorage, catalogKey, initialCatalog);
export let preferences = read(sessionStorage, preferenceKey, () => ({ userId: '', demoAdmin: false, compare: [] }));

export function commit(change) {
  const latest = read(localStorage, catalogKey, () => catalog);
  const result = change(latest);
  localStorage.setItem(catalogKey, JSON.stringify(latest));
  catalog = latest;
  return result;
}

export function updatePreferences(change) {
  preferences = { ...preferences, ...change };
  sessionStorage.setItem(preferenceKey, JSON.stringify(preferences));
}

export const getProduct = (id) => catalog.products.find((product) => product.id === id);
export const getStore = (id) => catalog.stores.find((store) => store.id === id);
export const activeUser = () => catalog.users.find((user) => user.id === preferences.userId);
export const favorites = () => activeUser()?.favorites ?? catalog.guestFavorites;

export function productOffers(id) {
  return catalog.offers.filter((offer) => offer.product === id).sort((a, b) => a.price - b.price);
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
