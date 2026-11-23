import {legacyCopy} from './legacy-copy.js?v=7';
const valid = v => typeof v === 'string' && v.trim().length > 0 && v.length <= 2000;
const normalize = v => v.replace(/\s+/g,' ').trim();
// Only genuine edits override a release's defaults; old full-form saves are migrated.
export function copyOverrides(parsed, defaults, language) {
  const overrides = {};
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return overrides;
  const modern = parsed.version === 2;
  const values = modern ? parsed.overrides : parsed;
  if (!values || typeof values !== 'object' || Array.isArray(values)) return overrides;
  for (const [name, fallback] of Object.entries(defaults)) {
    const value = values[name];
    if (!valid(value) || normalize(value) === normalize(fallback)) continue;
    if (!modern && (legacyCopy[language]?.[name] ?? []).some(old => normalize(old) === normalize(value))) continue;
    overrides[name] = value;
  }
  return overrides;
}
export function savedCopy(draft, defaults) {
  return {version:2, overrides:Object.fromEntries(Object.entries(draft).filter(([key,value]) => valid(value) && value !== defaults[key]))};
}
