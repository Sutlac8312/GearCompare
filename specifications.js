const booleanField = (key, label) => ({ key, label, boolean: true });
const numberField = (key, label, { min = 0.01, max = 9999.99, step = 0.01, unit, required } = {}) =>
  ({ key, label, min, max, step, unit, required });
const smallInteger = { min: 1, max: 32767, step: 1 };
const dimensions = [
  numberField('width_mm', 'Genişlik', { unit: 'mm' }),
  numberField('depth_mm', 'Derinlik', { unit: 'mm' }),
  numberField('height_mm', 'Yükseklik', { unit: 'mm' }),
];
const ioModes = { MONO: 'Mono', STEREO: 'Stereo' };

export const specificationGroups = {
  GUITAR: [
    ['Sap ve çalım', [
      numberField('string_count', 'Tel sayısı', { ...smallInteger, required: true }),
      { key: 'string_material', label: 'Tel malzemesi' },
      numberField('scale_length_mm', 'Tel ölçeği', { unit: 'mm' }),
      numberField('fret_count', 'Perde sayısı', { ...smallInteger, min: 0 }),
      numberField('nut_width_mm', 'Üst eşik genişliği', { max: 999.99, unit: 'mm' }),
      { key: 'neck_wood', label: 'Sap ağacı' },
      { key: 'fingerboard_wood', label: 'Klavye ağacı' },
    ]],
    ['Gövde ve malzemeler', [
      { key: 'body_style', label: 'Gövde biçimi' },
      { key: 'body_wood', label: 'Gövde ağacı' },
      { key: 'top_wood', label: 'Üst tabla ağacı' },
      { key: 'back_wood', label: 'Arka tabla ağacı' },
      { key: 'side_wood', label: 'Yan tabla ağacı' },
    ]],
    ['Köprü ve elektronik', [
      { key: 'bridge_type', label: 'Köprü tipi' },
      { key: 'bridge_material', label: 'Köprü malzemesi' },
      { key: 'electronics_type', label: 'Elektronik', choices: { NONE: 'Yok', PASSIVE: 'Pasif', ACTIVE: 'Aktif', MIXED: 'Karma' } },
    ]],
  ],
  AMPLIFIER: [
    ['Amfi yapısı', [
      { key: 'amp_type', label: 'Amfi tipi', required: true, choices: { TUBE: 'Lambalı', SOLID_STATE: 'Transistörlü', MODELING: 'Modellemeli', HYBRID: 'Hibrit' } },
      { key: 'form_factor', label: 'Amfi biçimi', required: true, choices: { COMBO: 'Kombo', HEAD: 'Kafa amfi' } },
      numberField('rated_power_w', 'Nominal güç', { max: 99999.99, unit: 'W', required: true }),
      numberField('channel_count', 'Kanal sayısı', smallInteger),
      booleanField('has_power_scaling', 'Güç kademesi'),
    ]],
    ['Bağlantılar', [
      booleanField('has_effects_loop', 'Efekt döngüsü'),
      booleanField('has_headphone_out', 'Kulaklık çıkışı'),
      booleanField('has_line_out', 'Hat çıkışı'),
      booleanField('has_usb', 'USB bağlantısı'),
      booleanField('has_footswitch_input', 'Ayak kumandası girişi'),
    ]],
    ['Ölçüler', [...dimensions, numberField('weight_kg', 'Ağırlık', { unit: 'kg' })]],
  ],
  PEDAL: [
    ['Efekt ve sinyal', [
      { key: 'effect_type', label: 'Efekt tipi', required: true, choices: {
        OVERDRIVE: 'Overdrive', DISTORTION: 'Distortion', FUZZ: 'Fuzz', DELAY: 'Delay', REVERB: 'Reverb',
        MODULATION: 'Modülasyon', DYNAMICS: 'Dinamik', EQ: 'EQ', MULTI_EFFECT: 'Çok efektli', OTHER: 'Diğer',
      } },
      { key: 'signal_type', label: 'Sinyal tipi', choices: { ANALOG: 'Analog', DIGITAL: 'Dijital', HYBRID: 'Hibrit' } },
      { key: 'bypass_type', label: 'Bypass tipi', choices: { TRUE_BYPASS: 'True bypass', BUFFERED: 'Buffered bypass', SWITCHABLE: 'Seçilebilir' } },
      { key: 'input_mode', label: 'Giriş düzeni', choices: ioModes },
      { key: 'output_mode', label: 'Çıkış düzeni', choices: ioModes },
      booleanField('has_expression_in', 'Expression pedalı girişi'),
      booleanField('has_tap_tempo', 'Tap tempo'),
    ]],
    ['Güç ve besleme', [
      { key: 'adapter_supply_type', label: 'Adaptör beslemesi', choices: { AC: 'AC', DC: 'DC' } },
      numberField('adapter_voltage_v', 'Adaptör gerilimi', { max: 999.99, unit: 'V' }),
      numberField('current_draw_ma', 'Akım tüketimi', { min: 1, max: 2147483647, step: 1, unit: 'mA' }),
      { key: 'dc_polarity', label: 'DC polaritesi', choices: { CENTER_NEGATIVE: 'Merkez negatif', CENTER_POSITIVE: 'Merkez pozitif' } },
      booleanField('supports_battery', 'Pil desteği'),
      { key: 'battery_type', label: 'Pil tipi' },
    ]],
    ['Ölçüler', [...dimensions, numberField('weight_g', 'Ağırlık', { max: 99999.99, unit: 'g' })]],
  ],
};

export const detailFields = {
  pickups: [
    { key: 'position', label: 'Konum', choices: { NECK: 'Sap', MIDDLE: 'Orta', BRIDGE: 'Köprü', UNDER_SADDLE: 'Eyer altı', BODY: 'Gövde', OTHER: 'Diğer' } },
    { key: 'pickup_type', label: 'Manyetik tipi', required: true },
    { key: 'model_name', label: 'Manyetik modeli' },
  ],
  speakers: [
    numberField('diameter_in', 'Hoparlör çapı', { max: 99.99, unit: 'inç', required: true }),
    numberField('quantity', 'Hoparlör adedi', { ...smallInteger, required: true }),
  ],
};

const numberFormat = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 });

export function formatSpec(field, value) {
  if (value == null || value === '') return '';
  if (field.boolean) return value ? 'Var' : 'Yok';
  if (field.choices && Object.hasOwn(field.choices, value)) return field.choices[value];
  return field.unit ? `${numberFormat.format(value)} ${field.unit}` : String(value);
}

const legacyLabels = {
  GUITAR: ['Manyetik dizilimi', 'Tel sayısı', 'Köprü tipi'],
  AMPLIFIER: ['Nominal güç', 'Amfi tipi', 'Hoparlörler'],
  PEDAL: ['Efekt tipi', 'Güç kaynağı'],
};

export function technicalGroups(product, type) {
  if (!product.specs) {
    const rows = legacyLabels[type].map((label, i) => [label, product.values?.[i]]).filter(([, value]) => value);
    return rows.length ? [['Genel özellikler', rows]] : [];
  }
  return specificationGroups[type].map(([group, fields]) => [
    group,
    fields.map((field) => [field.label, formatSpec(field, product.specs[field.key])]).filter(([, value]) => value !== ''),
  ]).filter(([, rows]) => rows.length);
}

export function pickupRows(product) {
  return (product.pickups ?? []).map((pickup) => detailFields.pickups.map((field) => formatSpec(field, pickup[field.key])));
}

export function speakerSummary(product) {
  return (product.speakers ?? []).map(({ diameter_in, quantity }) =>
    `${quantity} × ${numberFormat.format(diameter_in)} inç`).join(', ');
}

export function comparisonSpecs(product, type) {
  if (!product) return new Map();
  const specs = new Map(technicalGroups(product, type).flatMap(([, rows]) => rows));
  const pickups = pickupRows(product);
  if (pickups.length) {
    specs.set('Manyetik dizilimi', pickups.map((row) => row.filter(Boolean).join(' · ')).join('\n'));
  } else if (product.specs?.electronics_type === 'NONE') {
    specs.set('Manyetik dizilimi', 'Yok');
  }
  const speakers = speakerSummary(product);
  if (speakers || product.specs?.form_factor === 'HEAD') {
    specs.set('Hoparlörler', speakers || 'Dahili hoparlör yok');
  }
  return specs;
}

function parseField(field, raw) {
  const value = raw?.trim();
  if (!value) {
    if (field.required) throw new Error(`${field.label} alanını doldur.`);
    return undefined;
  }
  if (field.step) {
    const number = Number(value);
    const precision = field.step === 1 ? 1 : 100;
    if (!(number >= field.min && number <= field.max) || Math.abs(number * precision - Math.round(number * precision)) > 1e-7) {
      throw new Error(`${field.label} için geçerli bir sayı gir.`);
    }
    return number;
  }
  if (field.boolean && (value === 'yes' || value === 'no')) return value === 'yes';
  if (field.boolean || (field.choices && !Object.hasOwn(field.choices, value))) {
    throw new Error(`${field.label} için listeden bir değer seç.`);
  }
  return value;
}

export function readTechnicalSpecifications(input, type) {
  const specs = {};
  for (const [, fields] of specificationGroups[type]) {
    for (const field of fields) {
      const value = parseField(field, input.get(field.key));
      if (value !== undefined) specs[field.key] = value;
    }
  }
  if (type === 'PEDAL') {
    if (specs.dc_polarity && specs.adapter_supply_type !== 'DC') throw new Error('DC polaritesi için adaptör beslemesini DC seç.');
    if (specs.battery_type && specs.supports_battery !== true) throw new Error('Pil tipi girmek için pil desteğini Var seç.');
    return { specs };
  }

  const relation = type === 'GUITAR' ? 'pickups' : 'speakers';
  const fields = detailFields[relation];
  const columns = fields.map(({ key }) => input.getAll(`${relation}-${key}`));
  const rows = columns[0].map((_, index) => {
    const row = {};
    fields.forEach((field, column) => {
      const value = parseField(field, columns[column][index]);
      if (value !== undefined) row[field.key] = value;
    });
    return row;
  });

  if (type === 'GUITAR') {
    if (rows.length && specs.electronics_type === 'NONE') throw new Error('Elektroniği olmayan bir gitara manyetik eklenemez.');
    return { specs, pickups: rows.map((row, index) => ({ pickup_no: index + 1, ...row })) };
  }
  if (rows.length && specs.form_factor === 'HEAD') throw new Error('Kafa amfiye dahili hoparlör eklenemez.');
  if (new Set(rows.map(({ diameter_in }) => diameter_in)).size !== rows.length) {
    throw new Error('Her hoparlör çapı için tek satır kullan ve adedi o satıra yaz.');
  }
  return { specs, speakers: rows };
}
