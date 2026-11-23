import {translations} from './translations.js?v=7';
const allowed = ['ko', 'en', 'ja'];
let selected = 'ko';
try { const stored = localStorage.getItem('orbs-preview-language'); if (allowed.includes(stored)) selected = stored; } catch { /* Korean remains the default. */ }
// A query fallback also supports language changes when browser storage is blocked.
const query = new URLSearchParams(location.search).get('lang');
export const language = allowed.includes(query) ? query : selected;
export function t(text) { return translations[text]?.[language] ?? text; }
export function tr(parts, ...values) {
  const key = parts.reduce((out, part, i) => out + (i ? `{${i - 1}}` : '') + part, '');
  return t(key).replace(/\{(\d+)\}/g, (_, i) => String(values[Number(i)]));
}
export function initLanguage() {
  document.documentElement.lang = language;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (['SCRIPT','STYLE'].includes(node.parentElement?.tagName)) continue;
    const text = node.textContent.trim();
    if (translations[text]) node.textContent = node.textContent.replace(text, t(text));
  }
  for (const el of document.querySelectorAll('[aria-label],[title],[data-copy-label],meta[name=description]')) {
    for (const attr of ['aria-label','title','data-copy-label','content']) {
      const value = el.getAttribute(attr);
      if (value && translations[value]) el.setAttribute(attr, t(value));
    }
  }
  const picker = document.getElementById('language');
  picker.value = language;
  picker.addEventListener('change', () => {
    const next = picker.value;
    if (!allowed.includes(next)) return;
    try { localStorage.setItem('orbs-preview-language', next); } catch { /* Query still persists the choice for this URL. */ }
    const url = new URL(location.href);
    url.searchParams.set('v', document.querySelector('meta[name=release]')?.content || 'dev');
    url.searchParams.set('lang', next);
    location.assign(url.href);
  });
}
