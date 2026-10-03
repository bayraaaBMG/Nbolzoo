// Header нь 14 хуудсанд ДАВТАГДДАГ тул зөрөх нь цаг хугацааны асуудал.
// tools/build-header.js түүнийг үүсгэдэг; энэ багц нь:
//   1. 14 header бүгд ИЖИЛ эсэх (зөвхөн active төлвөөр зөрнө)
//   2. Генератор ажиллуулахад ямар ч өөрчлөлт гарахгүй эсэх (гараар засаад мартсан эсэх)
//   3. JS-ийн хамаарал (id/class) бүгд байгаа эсэх
const fs = require('fs'), path = require('path'), cp = require('child_process');
let pass = 0, fail = 0;
const t = (n, ok, d) => { ok ? (pass++, console.log('  ok  ' + n)) : (fail++, console.log('  FAIL ' + n + (d ? ' -> ' + d : ''))); };

const pages = fs.readdirSync('.').filter(f => f.endsWith('.html'));
const S = 'NB:HEADER:START', E = 'NB:HEADER:END';

// --- 1. Бүх хуудас header-тэй эсэх ---
const noHeader = pages.filter(p => !fs.readFileSync(p, 'utf8').includes(S));
t('every page has a generated header', noHeader.length === 0, noHeader.join(','));

// --- 2. Active төлвөөс бусдаар бүгд ижил ---
const norm = s => s
  .split(String.fromCharCode(13)).join('')
  .replace(/ class="(cat-link|header-saved) active"/g, ' class="$1"')
  .replace(/ class="active" aria-current="page"/g, '')
  .replace(/ aria-current="page"/g, '');
let ref = null, refFile = null;
const diffs = [];
for (const p of pages) {
  const h = fs.readFileSync(p, 'utf8');
  const a = h.indexOf(S);
  if (a < 0) continue;
  const block = norm(h.slice(a, h.indexOf(E)));
  if (ref === null) { ref = block; refFile = p; }
  else if (block !== ref) diffs.push(p);
}
t('all headers are identical (ignoring active state)', diffs.length === 0, diffs.join(','));

// --- 3. Committed header нь template-тэй тохирч байгаа эсэх ---
// --check нь файлыг БИЧИХГҮЙ (зөвхөн харьцуулна) — тест өөрөө файл бичвэл
// "нэг удаа унаад дараа нь дамждаг" тогтворгүй зан үйл үүсдэг байсан.
let genOk = true, genMsg = "";
try {
  cp.execFileSync(process.execPath, ['tools/build-header.js', '--check'], { stdio: 'pipe' });
} catch (e) {
  genOk = false;
  genMsg = (e.stdout || '').toString().trim().split('\n')[0];
}
t('committed header matches the template', genOk, genMsg + ' — "node tools/build-header.js" ажиллуулаад commit хийнэ үү');

// --- 4. JS-ийн хамаарал бүрэн эсэх ---
// Эдгээр id/class-ийг auth.js / core.js / notifications.js / site-settings.js хайдаг.
const REQUIRED = [
  'id="searchInput"', 'id="navAuthButtons"', 'id="navUserInfo"', 'id="navAvatar"',
  'id="notifBell"', 'id="notifBadge"', 'id="notifDropdown"', 'id="navAdminLink"',
  'id="mobileAuthButtons"', 'id="mobileNavDrawer"', 'id="mobileOverlay"',
  'id="pwaInstallSlot"', 'class="nav-actions"', 'class="mobile-nav-actions"',
  'class="cat-nav-inner"', 'mobile-menu-btn',
];
for (const sel of REQUIRED) {
  const missing = pages.filter(p => !fs.readFileSync(p, 'utf8').includes(sel));
  t('header keeps ' + sel, missing.length === 0, missing.join(','));
}

// --- 5. Гурван давхарга бодитоор байгаа эсэх ---
['class="utility-bar"', 'class="site-header"', 'class="cat-nav"'].forEach(layer => {
  const missing = pages.filter(p => !fs.readFileSync(p, 'utf8').includes(layer));
  t('all 3 layers present — ' + layer, missing.length === 0, missing.join(','));
});

// --- 6. Ангиллын цэсний холбоос бүр БОДИТ хуудас руу чиглэх эсэх ---
const home = fs.readFileSync('index.html', 'utf8');
const catKeys = [...home.matchAll(/<a class="cat-link[^"]*" data-page="([a-z]+)"/g)].map(m => m[1]);
t('category nav has 9 public links', catKeys.length === 9, catKeys.join(','));
t('admin link is present but hidden by default', /id="navAdminLink"[^>]*style="display:none;"/.test(home));
catKeys.forEach(k => t('category target exists — ' + k, fs.existsSync(k + '.html')));

// --- 7. Icon нэр бүр NB_ICONS дотор байгаа эсэх ---
const ui = fs.readFileSync('js/ui.js', 'utf8');
const icons = [...home.matchAll(/data-icon="([a-z]+)"/g)].map(m => m[1]);
const unknown = [...new Set(icons)].filter(i => !new RegExp(String.raw`^\s*` + i + ':', 'm').test(ui));
t('every header icon exists in NB_ICONS', unknown.length === 0, unknown.join(','));

// --- 8. Хуучин dropdown markup бүрэн арилсан эсэх ---
const stale = pages.filter(p => /class="nav-group"|class="nav-dropdown"|<nav class="nav">/.test(fs.readFileSync(p, 'utf8')));
t('old dropdown nav markup is gone', stale.length === 0, stale.join(','));
t('old nav CSS is gone', !/^\.nav-group \{/m.test(fs.readFileSync('css/style.css', 'utf8')));

console.log('\nheader: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
