const shapes = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  heart: '<path d="M20.8 8.6c0 4.2-8.8 9.6-8.8 9.6S3.2 12.8 3.2 8.6a4.4 4.4 0 0 1 8.8-.5 4.4 4.4 0 0 1 8.8.5Z"/>',
  user: '<circle cx="12" cy="8" r="3.2"/><path d="M5 20v-1.4A4.6 4.6 0 0 1 9.6 14h4.8a4.6 4.6 0 0 1 4.6 4.6V20"/>',
  grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  guitar: '<path d="m12.5 11.5 6-6m-1-1 2.5-2.5 2 2-2.5 2.5m-6 6c.8 1.5.5 3.2-.7 4.4l-2.2 2.2a4.7 4.7 0 0 1-6.6-6.6l2.2-2.2c1.3-1.3 3.1-1.4 4.5-.6"/><path d="m7.1 16.9 2-2"/>',
  amp: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18m-14 4h10m-10 2.5h10M7 7.5h.01m3 0h.01"/>',
  pedal: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M6 12h12m-8-5h.01m4 0h.01m-2 2.5h.01m0 7h.01"/>',
  compare: '<rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="16" rx="1.5"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  back: '<path d="m13 6-6 6 6 6"/>',
  next: '<path d="m9 6 6 6-6 6"/>',
  store: '<path d="M4 10v10h16V10M3 10l2-5h14l2 5c0 2-4 3-4.5 0-.5 3-4.5 3-4.5 0-.5 3-4 3-4.5 0C7 13 3 12 3 10Zm7 10v-5h4v5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 6-2 6-2 8h16c0-2-2-2-2-8m-8 11a2 2 0 0 0 4 0"/>',
  chart: '<path d="M4 4v16h16M8 15l4-4 3 2 5-6"/>',
};

export function icon(name) {
  return `<svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[name]}</svg>`;
}

const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const html = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => entities[char]);
const currency = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const date = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' });
const fullDate = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
export const money = (price) => price == null ? '—' : `₺${currency.format(price)}`;
export const dayLabel = (value) => date.format(new Date(value));
export const dateLabel = (value) => fullDate.format(new Date(value));
export const title = (product) => `${product.brand} ${product.model}`;
export const productLink = (product) => `#urun/${encodeURIComponent(product.id)}`;
export const productLinkText = (product) => `<a class="text-link" href="${productLink(product)}">${html(title(product))}</a>`;

export function options(items, selected) {
  return items.map(([id, label]) => `<option value="${html(id)}"${id === selected ? ' selected' : ''}>${html(label)}</option>`).join('');
}

export function select(id, label, choices, value, required = false) {
  return `<span class="select-wrap"><select id="${id}" name="${id}" aria-label="${label}"${required ? ' required' : ''}>${options(choices, value)}</select>${icon('chevron')}</span>`;
}

export function table(headers, rows, caption) {
  return `<div class="table-wrap"><table><caption class="sr-only">${caption}</caption>
    <thead><tr>${headers.map((head) => `<th scope="col">${head}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((row) => `<tr><th scope="row">${row[0]}</th>${row.slice(1).map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}

export function empty(symbol, heading, text, action = '') {
  return `<div class="empty-state">${icon(symbol)}<h2>${heading}</h2><p>${text}</p>${action}</div>`;
}

export function priceChart(history) {
  const w = 720;
  const h = 190;
  const left = 7;
  const top = 10;
  const bottom = h - 10;
  const right = w - 7;
  const prices = history.map(({ price }) => price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const spread = max - min || Math.max(1, min * 0.1);
  const low = Math.max(0, min - spread * 0.1);
  const high = max + spread * 0.15;
  const start = Date.parse(history[0].date);
  const duration = Date.parse(history.at(-1).date) - start;
  const points = history.map(({ date, price }) => [
    duration ? left + (Date.parse(date) - start) / duration * (right - left) : (left + right) / 2,
    bottom - (price - low) / (high - low) * (bottom - top),
  ]);
  const ticks = Array.from({ length: 4 }, (_, i) => ({
    y: top + (bottom - top) * i / 3, value: Math.round(high - (high - low) * i / 3),
  }));
  const line = points.map((point) => point.join(',')).join(' ');
  return `<div class="chart" role="img" aria-label="Fiyat geçmişi çizgi grafiği">
    <div class="chart-ticks" aria-hidden="true">
      ${ticks.map(({ y, value }) => `<span style="top:${y / h * 100}%">${money(value)}</span>`).join('')}
    </div>
    <svg class="price-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
      ${ticks.map(({ y }) => `<line x1="${left}" y1="${y}" x2="${right}" y2="${y}"/>`).join('')}
      ${points.length > 1 ? `<polygon points="${points[0][0]},${bottom} ${line} ${points.at(-1)[0]},${bottom}"/><polyline points="${line}"/>` : ''}
      ${points.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="3"><title>${dayLabel(history[i].date)} · ${money(history[i].price)}</title></circle>`).join('')}
    </svg>
    <div class="chart-dates" aria-hidden="true"><span>${dayLabel(history[0].date)}</span>
      ${history.length > 1 ? `<span>${dayLabel(history.at(-1).date)}</span>` : ''}
    </div>
  </div>`;
}
