export const categories = {
  electro: { name: 'Elektro gitar', icon: 'guitar', specs: ['Manyetik', 'Tel sayısı', 'Köprü'] },
  acoustic: { name: 'Akustik gitar', icon: 'guitar', specs: ['Manyetik', 'Tel sayısı', 'Köprü'] },
  classical: { name: 'Klasik gitar', icon: 'guitar', specs: ['Manyetik', 'Tel sayısı', 'Köprü'] },
  bass: { name: 'Bas gitar', icon: 'guitar', specs: ['Manyetik', 'Tel sayısı', 'Köprü'] },
  amp: { name: 'Amfi', icon: 'amp', specs: ['Güç', 'Amfi tipi', 'Hoparlör'] },
  pedal: { name: 'Efekt pedalı', icon: 'pedal', specs: ['Efekt tipi', 'Güç kaynağı'] },
};

const inventory = [
  {
    id: 'fender-player-ii', brand: 'Fender', model: 'Player II Stratocaster', category: 'electro', image: 'strat',
    values: ['3 × Alnico 5 single-coil', '6', 'İki noktalı tremolo'],
    source: 'https://www.fender.com/products/player-ii-stratocaster',
    prices: [37490, 38900, 40990],
  },
  {
    id: 'boss-katana', brand: 'BOSS', model: 'Katana-50 Gen 3', category: 'amp', image: 'katana',
    values: ['50 W', 'Modellemeli kombo', '1 × 12″'],
    source: 'https://www.boss.info/us/products/katana-50_gen_3/specs/',
    prices: [14990, 15490, 16200],
  },
  {
    id: 'boss-sd-1', brand: 'BOSS', model: 'SD-1 Super OverDrive', category: 'pedal', image: 'overdrive',
    values: ['Overdrive', '9 V pil veya adaptör'],
    source: 'https://www.boss.info/us/products/sd-1/',
    prices: [2890, 3140, 3290],
  },
  {
    id: 'yamaha-fg800', brand: 'Yamaha', model: 'FG800', category: 'acoustic', image: 'acoustic',
    values: ['Yok', '6', 'Ceviz sabit köprü'],
    source: 'https://usa.yamaha.com/musical-instruments/guitars-basses-amps/products/acoustic-guitars/fg-series/fg-800/specs.html',
    prices: [12990, 13750],
  },
  {
    id: 'yamaha-c40ii', brand: 'Yamaha', model: 'C40II', category: 'classical', image: 'classical',
    values: ['Yok', '6', 'Sabit köprü (gülağacı veya ceviz)'],
    source: 'https://usa.yamaha.com/musical-instruments/guitars-basses-amps/products/classical-nylon-guitars/c-cx/specs.html',
    prices: [6290, 6750, 6990],
  },
  {
    id: 'squier-jazz-bass', brand: 'Squier', model: 'Affinity Series Jazz Bass', category: 'bass', image: 'bass',
    values: ['2 × Single-coil Jazz Bass', '4', 'Dört eyerli sabit köprü'],
    source: 'https://www.fender.com/products/affinity-series-jazz-bass-1',
    prices: [17490, 18300, 18990],
  },
];

const stores = [
  { id: 'nota', name: 'Nota Müzik' },
  { id: 'ritim', name: 'Ritim Ekipman' },
  { id: 'ton', name: 'Ton Atölyesi' },
];

export function initialCatalog() {
  const day = 24 * 60 * 60 * 1000;
  const today = Date.now();
  return {
    products: inventory.map(({ prices, ...product }) => product),
    stores,
    offers: inventory.flatMap(({ id, prices }, productIndex) =>
      prices.map((price, storeIndex) => ({
        id: `${id}-${stores[storeIndex].id}`,
        product: id,
        store: stores[storeIndex].id,
        price,
        history: [12, 10, 11, 7, 8, 4, 5, 0].map((change, index) => ({
          date: new Date(today - (7 - index) * 4 * day).toISOString(),
          price: price + change * Math.max(25, Math.round(price / 1000) * 10)
            + (index === 7 ? 0 : (productIndex + 2 * storeIndex + index) % 4 * 15),
        })),
      }))
    ),
    users: [],
    guestFavorites: [],
    alerts: [],
    notifications: [],
  };
}
