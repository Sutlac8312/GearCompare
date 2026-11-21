export const categories = {
  electro: { name: 'Elektro gitar', icon: 'guitar', type: 'GUITAR' },
  acoustic: { name: 'Akustik gitar', icon: 'guitar', type: 'GUITAR' },
  classical: { name: 'Klasik gitar', icon: 'guitar', type: 'GUITAR' },
  bass: { name: 'Bas gitar', icon: 'guitar', type: 'GUITAR' },
  amp: { name: 'Amfi', icon: 'amp', type: 'AMPLIFIER' },
  pedal: { name: 'Efekt pedalı', icon: 'pedal', type: 'PEDAL' },
};

const inventory = [
  {
    id: 'fender-player-ii', brand: 'Fender', model: 'Player II Stratocaster', category: 'electro', image: 'strat',
    description: '3-Color Sunburst · Gülağacı klavyeli model',
    specs: {
      string_count: 6, string_material: 'Nikel kaplı çelik', scale_length_mm: 648, fret_count: 22, nut_width_mm: 42,
      neck_wood: 'Akçaağaç', fingerboard_wood: 'Gülağacı', body_style: 'Masif Stratocaster gövde',
      body_wood: 'Kızılağaç', bridge_type: 'İki noktalı tremolo', bridge_material: 'Çelik eyerler', electronics_type: 'PASSIVE',
    },
    pickups: [
      { pickup_no: 1, position: 'NECK', pickup_type: 'Single-coil', model_name: 'Player Series Alnico 5' },
      { pickup_no: 2, position: 'MIDDLE', pickup_type: 'Single-coil', model_name: 'Player Series Alnico 5' },
      { pickup_no: 3, position: 'BRIDGE', pickup_type: 'Single-coil', model_name: 'Player Series Alnico 5' },
    ],
    source: 'https://www.fender.com/products/player-ii-stratocaster',
    prices: [37490, 38900, 40990],
  },
  {
    id: 'boss-katana', brand: 'BOSS', model: 'Katana-50 Gen 3', category: 'amp', image: 'katana',
    specs: {
      amp_type: 'MODELING', form_factor: 'COMBO', rated_power_w: 50, has_power_scaling: true,
      has_effects_loop: false, has_headphone_out: true, has_line_out: false, has_usb: true, has_footswitch_input: true,
      width_mm: 470, depth_mm: 238, height_mm: 398, weight_kg: 11.6,
    },
    speakers: [{ diameter_in: 12, quantity: 1 }],
    source: 'https://www.boss.info/us/products/katana-50_gen_3/specs/',
    prices: [14990, 15490, 16200],
  },
  {
    id: 'boss-sd-1', brand: 'BOSS', model: 'SD-1 Super OverDrive', category: 'pedal', image: 'overdrive',
    specs: {
      effect_type: 'OVERDRIVE', signal_type: 'ANALOG', bypass_type: 'BUFFERED', input_mode: 'MONO', output_mode: 'MONO',
      adapter_supply_type: 'DC', adapter_voltage_v: 9, current_draw_ma: 10, dc_polarity: 'CENTER_NEGATIVE',
      supports_battery: true, battery_type: '9 V 6F22 veya 6LR61', has_expression_in: false, has_tap_tempo: false,
      width_mm: 73, depth_mm: 129, height_mm: 59, weight_g: 360,
    },
    source: 'https://www.boss.info/us/products/sd-1/',
    prices: [2890, 3140, 3290],
  },
  {
    id: 'yamaha-fg800', brand: 'Yamaha', model: 'FG800', category: 'acoustic', image: 'acoustic',
    specs: {
      string_count: 6, string_material: 'Çelik', scale_length_mm: 650, nut_width_mm: 43, neck_wood: 'Nato',
      fingerboard_wood: 'Ceviz', body_style: 'Dreadnought', top_wood: 'Masif ladin',
      back_wood: 'Nato veya okume', side_wood: 'Nato veya okume',
      bridge_type: 'Sabit köprü', bridge_material: 'Ceviz', electronics_type: 'NONE',
    },
    source: 'https://usa.yamaha.com/musical-instruments/guitars-basses-amps/products/acoustic-guitars/fg-series/fg-800/specs.html',
    prices: [12990, 13750],
  },
  {
    id: 'yamaha-c40ii', brand: 'Yamaha', model: 'C40II', category: 'classical', image: 'classical',
    specs: {
      string_count: 6, string_material: 'Naylon', scale_length_mm: 650, nut_width_mm: 52,
      fingerboard_wood: 'Gülağacı', body_style: 'Yamaha CG klasik gövde', top_wood: 'Ladin',
      bridge_type: 'Sabit köprü', bridge_material: 'Gülağacı veya ceviz', electronics_type: 'NONE',
    },
    source: 'https://usa.yamaha.com/musical-instruments/guitars-basses-amps/products/classical-nylon-guitars/c-cx/specs.html',
    prices: [6290, 6750, 6990],
  },
  {
    id: 'squier-jazz-bass', brand: 'Squier', model: 'Affinity Series Jazz Bass', category: 'bass', image: 'bass',
    description: '3-Color Sunburst · Akçaağaç klavyeli model',
    specs: {
      string_count: 4, string_material: 'Nikel kaplı çelik', scale_length_mm: 864, fret_count: 20, nut_width_mm: 38.1,
      neck_wood: 'Akçaağaç', fingerboard_wood: 'Akçaağaç', body_style: 'Jazz Bass gövde',
      body_wood: 'Kavak', bridge_type: 'Dört eyerli sabit köprü', electronics_type: 'PASSIVE',
    },
    pickups: [
      { pickup_no: 1, position: 'NECK', pickup_type: 'Single-coil', model_name: 'Seramik Jazz Bass' },
      { pickup_no: 2, position: 'BRIDGE', pickup_type: 'Single-coil', model_name: 'Seramik Jazz Bass' },
    ],
    source: 'https://www.fender.com/products/affinity-series-jazz-bass-1',
    prices: [17490, 18300, 18990],
  },
];

const stores = [
  { id: 'nota', name: 'Nota Müzik' },
  { id: 'ritim', name: 'Ritim Ekipman' },
  { id: 'ton', name: 'Ton Atölyesi' },
];

export function expandSeedSpecifications(database) {
  const products = database.products.map((product) => {
    if (product.specs) return product;
    const seed = inventory.find(({ id }) => id === product.id);
    if (!seed) return product;
    const { values, ...stored } = product;
    const { specs, pickups, speakers, description } = seed;
    return { ...stored, specs, pickups, speakers, description };
  });
  return { ...database, products };
}

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
