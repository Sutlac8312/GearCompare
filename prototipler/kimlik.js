export const logos = {
  l1: {
    code: 'L1',
    name: 'Pena',
    shape: '<path fill="currentColor" d="M20 4C11.3 4 4.5 7.7 4.5 13.8c0 6.7 7.7 16.5 13.4 21.1a3.4 3.4 0 0 0 4.2 0c5.7-4.6 13.4-14.4 13.4-21.1C35.5 7.7 28.7 4 20 4Z"/><path d="M13.5 16h13m-10 6h7" fill="none" stroke="var(--logo-cut, #fff)" stroke-width="2.5" stroke-linecap="round"/>',
  },
  l2: {
    code: 'L2',
    name: 'Perde',
    shape: '<g transform="rotate(19 20 20)" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12.5 5.5v29m7.5-29v29m7.5-29v29M10 12h20M10 20h20M10 28h20"/></g><circle cx="20" cy="20" r="3.4" fill="currentColor" stroke="var(--logo-cut, #fff)" stroke-width="1.4"/>',
  },
  l3: {
    code: 'L3',
    name: 'GC',
    shape: '<path d="M19.4 11.1a10 10 0 1 0 1.5 15v-5.4h-7.3M35.1 12.5a10 10 0 1 0 0 14.9" fill="none" stroke="currentColor" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  l4: {
    code: 'L4',
    name: 'Yan Yana',
    shape: '<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><rect x="3.5" y="12" width="13.5" height="20" rx="3.5"/><rect x="23" y="7" width="13.5" height="20" rx="3.5"/><path d="M7.8 26h4.9m14.6-5h4.9"/></g>',
  },
};

export const designs = {
  a: { code: 'A', name: 'Sade', description: 'Açık zemin, geniş arama alanı ve ürün kartları.' },
  b: { code: 'B', name: 'Katalog', description: 'Yanda filtreler, satır satır ürünler ve hizalı fiyatlar.' },
  c: { code: 'C', name: 'Sahne', description: 'Koyu giriş, büyük gitar fotoğrafı ve sıcak vurgu.' },
};

export function wordmark(id) {
  return `<span class="wordmark wordmark-${id}" aria-label="GearCompare">
    <svg class="brand-symbol" viewBox="0 0 40 40" width="36" height="36" aria-hidden="true">${logos[id].shape}</svg>
    <span class="brand-text">Gear<span>Compare</span></span>
  </span>`;
}
