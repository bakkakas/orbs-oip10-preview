import {t,language} from './i18n.js?v=5';
// Preview-only copy editing. No server writes or shared publishing.
export function initCopyEditor() {
  const $ = id => document.getElementById(id);
  const key = language === 'ko' ? 'orbs-oip10-preview-copy-v1' : `orbs-oip10-preview-copy-v1-${language}`;
  const nodes = [...document.querySelectorAll('[data-copy]')];
  const defaults = Object.fromEntries(nodes.map(el => [el.dataset.copy, el.innerText]));
  let saved = {...defaults};
  const valid = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 2000;
  const apply = () => nodes.forEach(el => {el.textContent = saved[el.dataset.copy];});
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      for (const name of Object.keys(defaults)) if (Object.hasOwn(parsed, name) && valid(parsed[name])) saved[name] = language === 'ko' ? parsed[name].split('\n').map(line => t(line)).join('\n') : parsed[name];
    }
  } catch { /* A blocked store or invalid older data must not break the dashboard. */ }
  apply();
  const fields = new Map();
  for (const el of nodes) {
    const name = el.dataset.copy;
    const label = document.createElement('label');
    label.textContent = el.dataset.copyLabel;
    const input = document.createElement('textarea');
    input.id = 'copy-field-' + name;
    input.rows = name.includes('description') || name.includes('note') ? 3 : 2;
    input.maxLength = 2000;
    input.required = true;
    label.htmlFor = input.id;
    label.append(input);
    $('copy-fields').append(label);
    fields.set(name, input);
  }
  const fill = values => fields.forEach((input, name) => {input.value = values[name];});
  function readDraft() {
    const draft = {};
    for (const [name, input] of fields) {
      if (!valid(input.value)) {
        $('copy-status').textContent = t('각 문구는 공백이 아닌 1~2,000자로 입력해 줘.');
        input.focus();
        return null;
      }
      draft[name] = input.value;
    }
    return draft;
  }
  $('edit-copy').addEventListener('click', () => {
    fill(saved);
    $('copy-status').textContent = '';
    $('copy-dialog').showModal();
  });
  $('cancel-copy').addEventListener('click', () => $('copy-dialog').close());
  $('reset-copy').addEventListener('click', () => {
    fill(defaults);
    $('copy-status').textContent = t('기본 문구로 채웠어. 저장하고 적용을 눌러야 반영돼.');
  });
  $('copy-form').addEventListener('submit', event => {
    event.preventDefault();
    const draft = readDraft();
    if (!draft) return;
    try { localStorage.setItem(key, JSON.stringify(draft)); }
    catch {
      $('copy-status').textContent = t('브라우저 저장소를 사용할 수 없어 저장하지 못했어. 문구 파일 받기로 내용을 보관할 수 있어.');
      return;
    }
    saved = draft;
    apply();
    $('copy-dialog').close();
  });
  $('export-copy').addEventListener('click', () => {
    const draft = readDraft();
    if (!draft) return;
    const blob = new Blob([JSON.stringify({version: 1, language, copy: draft}, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orbs-preview-copy.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('copy-status').textContent = t('문구 파일을 받았어. 공통 사이트에 반영하려면 이 파일을 전달해 줘.');
  });
}
