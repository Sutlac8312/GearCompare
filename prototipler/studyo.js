import { designs, logos, wordmark } from './kimlik.js';

const logoOptions = document.querySelector('#logo-options');
const designOptions = document.querySelector('#design-options');
const preview = document.querySelector('#preview');
const previewLink = document.querySelector('#full-preview');
const selection = document.querySelector('#preview-selection');
let screenSize = 'desktop';

logoOptions.innerHTML = Object.entries(logos).map(([id, logo]) => `
  <button class="logo-option" type="button" data-logo="${id}" aria-label="${logo.code} ${logo.name}" aria-pressed="false">
    <span class="logo-sample" aria-hidden="true">${wordmark(id)}</span>
    <span class="option-label"><span class="option-code">${logo.code}</span>${logo.name}</span>
  </button>`).join('');

designOptions.innerHTML = Object.entries(designs).map(([id, design]) => `
  <button class="design-option" data-design="${id}" type="button" aria-label="${design.code} ${design.name}" aria-pressed="false">
    <span class="layout-sample layout-sample-${id}" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
    <span class="design-label"><span class="option-label"><span class="option-code">${design.code}</span>${design.name}</span>
    <span class="option-description">${design.description}</span></span>
  </button>`).join('');

function readSelection() {
  const params = new URLSearchParams(location.hash.slice(1));
  const logo = params.get('logo');
  const design = params.get('tasarim');
  return { logo: Object.hasOwn(logos, logo) ? logo : 'l1', design: Object.hasOwn(designs, design) ? design : 'a' };
}

function update() {
  const { logo, design } = readSelection();
  for (const button of logoOptions.children) button.setAttribute('aria-pressed', button.dataset.logo === logo);
  for (const button of designOptions.children) button.setAttribute('aria-pressed', button.dataset.design === design);
  const url = `ekran.html?tasarim=${design}&logo=${logo}`;
  if (preview.getAttribute('src') !== url) preview.src = url;
  previewLink.href = url;
  selection.innerHTML = `<strong>${designs[design].code} · ${designs[design].name}</strong><span>${logos[logo].code} · ${logos[logo].name}</span>`;
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const { logo, design, size } = button.dataset;
  if (logo || design) {
    const current = readSelection();
    location.hash = new URLSearchParams({ tasarim: design ?? current.design, logo: logo ?? current.logo });
  } else if (size && screenSize !== size) {
    screenSize = size;
    document.querySelector('.preview-well').classList.toggle('mobile', size === 'mobile');
    for (const control of document.querySelectorAll('[data-size]')) {
      control.setAttribute('aria-pressed', control.dataset.size === screenSize);
    }
  }
});

window.addEventListener('hashchange', update);
update();
