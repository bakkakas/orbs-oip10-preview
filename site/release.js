// Revalidate the shared release on entry/resume. Language URLs never select separate builds.
const current = document.querySelector('meta[name=release]')?.content;
let checkedAt = 0;
async function checkRelease() {
  if (!current || document.hidden || Date.now()-checkedAt < 60000) return;
  checkedAt = Date.now();
  try {
    const response = await fetch(new URL('release.json', import.meta.url), {cache:'no-store'});
    if (!response.ok) return;
    const {version} = await response.json();
    if (!/^[a-f0-9]{16}$/.test(version) || version === current) return;
    // Never discard an open editor's unsaved draft; retry on the next visibility change.
    if (document.querySelector('#copy-dialog[open]')) { checkedAt = 0; return; }
    const url = new URL(location.href);
    // Bounded retry even if a CDN edge temporarily serves older HTML.
    if (url.searchParams.get('v') === version) return;
    url.searchParams.set('v', version);
    location.replace(url.href);
  } catch { /* Offline browsing continues without disruptive errors. */ }
}
checkRelease();
document.addEventListener('visibilitychange',checkRelease);
window.addEventListener('pageshow',checkRelease);
