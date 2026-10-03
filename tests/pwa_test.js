// PWA нь зөвхөн "суулгах боломжтой" байх нь хангалтгүй — суулгасан апп офлайн үед
// ХООСОН хуудас болох нь бодит эвдрэл. Энэ багц нь service worker-ийн стратеги
// бодитоор байгаа эсэх, бодит цагийн өгөгдлийг cache-д ХИЙГЭЭГҮЙ эсэхийг шалгана.
const fs = require('fs');
let pass = 0, fail = 0;
const t = (n, ok, d) => { ok ? (pass++, console.log('  ok  ' + n)) : (fail++, console.log('  FAIL ' + n + (d ? ' -> ' + d : ''))); };

const sw = fs.readFileSync('service-worker.js', 'utf8');
const mf = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

// --- Service worker стратеги ---
t('SW has a versioned cache name', /const VERSION\s*=\s*"[^"]+"/.test(sw));
t('SW precaches an app shell', /PRECACHE\s*=\s*\[/.test(sw));
t('SW precaches the homepage', /"\/index\.html"/.test(sw) || /"\/"/.test(sw));
t('SW precaches the stylesheet', /css\/style\.css/.test(sw));
t('SW deletes old caches on activate', /caches\.keys\(\)[\s\S]{0,200}caches\.delete/.test(sw));
t('SW calls skipWaiting', /skipWaiting/.test(sw));
t('SW claims clients', /clients\.claim/.test(sw));

// --- Регресс: бодит цагийн өгөгдөл ХЭЗЭЭ Ч cache-д орохгүй ---
t('SW excludes googleapis/firebase hosts', /googleapis|firebaseio/.test(sw));
t('SW excludes the admin page', /\/admin/.test(sw));
t('SW ignores non-GET requests', /req\.method !== "GET"/.test(sw));
t('SW ignores cross-origin requests', /url\.origin !== self\.location\.origin/.test(sw));

// --- Хуудас нь network-first байх ёстой (шинэчлэлт хоцрохгүй) ---
const navBlock = sw.slice(sw.indexOf('req.mode === "navigate"'), sw.indexOf('isVersionCoupled(url)', sw.indexOf('req.mode === "navigate"')));
t('HTML is network-first', /networkFirst\(req, SHELL_CACHE/.test(navBlock));
t('HTML falls back to the homepage offline', /"\/index\.html"/.test(navBlock));

// --- РЕГРЕСС: CSS/JS нь ХЭЗЭЭ Ч хуудаснаас хоцрохгүй ---
// Өмнө нь CSS/JS stale-while-revalidate байсан тул deploy бүрийн дараах эхний
// ачаалалт "шинэ HTML + хуучин CSS" болж зохион байгуулалт эвдэрдэг байв.
t('CSS/JS are version-coupled', /function isVersionCoupled[\s\S]{0,160}css\|js/.test(sw));
t('CSS/JS use network-first', /isVersionCoupled\(url\)\)\s*\{\s*event\.respondWith\(networkFirst/.test(sw));
// Зөвхөн isVersionCoupled САЛААНЫ дотрыг шалгана — дараагийн (isMedia) салаа нь
// stale-while-revalidate хэрэглэдэг тул өргөн хүрээтэй regex худал унана.
const vcStart = sw.indexOf('if (isVersionCoupled(url))');
const vcBranch = sw.slice(vcStart, sw.indexOf('if (isMedia(url))', vcStart));
t('CSS/JS are NOT stale-while-revalidate', !/const fresh/.test(vcBranch));
t('CSS/JS branch returns immediately', /return;/.test(vcBranch));
t('only media uses stale-while-revalidate', /function isMedia[\s\S]{0,160}(svg|png|woff)/.test(sw));
t('media list excludes css and js', (() => {
  const m = sw.slice(sw.indexOf('function isMedia'), sw.indexOf('}', sw.indexOf('function isMedia')));
  return !/css/.test(m) && !/js/.test(m);
})());
t('cache version was bumped past v3', /VERSION = "nb-v([4-9]|\d{2,})"/.test(sw));

// --- Cache бичилт бүр унаж болохыг тооцсон байх ---
t('cache writes cannot reject the response', (sw.match(/\.catch\(\(\) => \{\}\)/g) || []).length >= 2);

// --- Manifest ---
t('manifest has a name', !!mf.name);
t('manifest is standalone', mf.display === 'standalone');
t('manifest has a start_url', !!mf.start_url);
t('manifest has a 192px icon', mf.icons.some(i => (i.sizes || '').includes('192')));
t('manifest has a 512px icon', mf.icons.some(i => (i.sizes || '').includes('512')));
t('manifest has a maskable icon', mf.icons.some(i => i.purpose === 'maskable'));
t('manifest has app shortcuts', Array.isArray(mf.shortcuts) && mf.shortcuts.length >= 3);
t('every shortcut points at a real page', (mf.shortcuts || []).every(s => fs.existsSync(s.url)),
  (mf.shortcuts || []).filter(s => !fs.existsSync(s.url)).map(s => s.url).join(','));
t('every manifest icon file exists', mf.icons.every(i => fs.existsSync(i.src)),
  mf.icons.filter(i => !fs.existsSync(i.src)).map(i => i.src).join(','));
t('theme_color matches the CSS primary',
  mf.theme_color.toLowerCase() === (fs.readFileSync('css/style.css', 'utf8').match(/--primary:\s*(#[0-9a-f]{6})/i) || [])[1].toLowerCase(),
  mf.theme_color);

// --- Бүртгэл ---
t('SW is registered from the site', /serviceWorker\.register\("service-worker\.js"\)/.test(fs.readFileSync('js/core.js', 'utf8')));
const pages = fs.readdirSync('.').filter(f => f.endsWith('.html'));
const noManifest = pages.filter(p => !fs.readFileSync(p, 'utf8').includes('rel="manifest"'));
t('every page links the manifest', noManifest.length === 0, noManifest.join(','));

console.log('\npwa: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
