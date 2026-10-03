// Дотоод холбоос/ассет бүр бодитоор байгаа эсэх + navigate() зорилтууд зөв эсэх.
const fs = require('fs'), path = require('path');
let pass = 0, fail = 0;
function t(n, ok, d) { if (ok) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('  FAIL ' + n + (d ? ' -> ' + d : '')); } }

const pages = fs.readdirSync('.').filter(f => f.endsWith('.html'));

// 1. script/link/img src бүр диск дээр байгаа эсэх
const missing = new Set();
for (const p of pages) {
  const h = fs.readFileSync(p, 'utf8');
  for (const m of h.matchAll(/(?:src|href)="((?!https?:|\/\/|#|mailto:|tel:|data:)[^"]+)"/g)) {
    const f = m[1].split('?')[0].split('#')[0];
    if (!f || f.endsWith('/')) continue;
    if (!fs.existsSync(f)) missing.add(p + ' -> ' + f);
  }
}
t('all local assets exist', missing.size === 0, [...missing].slice(0, 5).join(' | '));

// 2. navigate('x') бүрийн зорилт файл байгаа эсэх
const navMap = { home: 'index.html', 'aimag-detail': 'aimags.html' };
const badNav = new Set();
for (const f of [...pages, ...fs.readdirSync('js').map(x => 'js/' + x)]) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(/navigate\(['"]([a-z-]+)['"]/g)) {
    const target = navMap[m[1]] || m[1] + '.html';
    if (!fs.existsSync(target)) badNav.add(f + ' -> ' + m[1]);
  }
}
t('all navigate() targets exist', badNav.size === 0, [...badNav].slice(0, 5).join(' | '));

// 3. sitemap-ийн бүх хуудас байгаа эсэх, бүх хуудас sitemap-д байгаа эсэх
const sm = fs.readFileSync('sitemap.xml', 'utf8');
const smPages = [...sm.matchAll(/<loc>[^<]*?\/([a-z-]+\.html)<\/loc>/g)].map(m => m[1]);
const smBad = smPages.filter(p => !fs.existsSync(p));
t('sitemap entries all exist', smBad.length === 0, smBad.join(', '));
const notInSitemap = pages.filter(p => p !== 'admin.html' && !sm.includes(p) && !(p === 'index.html' && /<loc>[^<]*\/<\/loc>/.test(sm)));
t('public pages listed in sitemap', notInSitemap.length === 0, notInSitemap.join(', '));
t('admin.html NOT in sitemap', !sm.includes('admin.html'));

// 4. Шинэ script бүр хуудсандаа холбогдсон эсэх
const required = {
  'services.html': ['js/services.js', 'js/site-settings.js'],
  'admin.html': ['js/roles.js', 'js/cms.js', 'js/admin.js', 'js/admin-cms.js', 'js/admin-services.js', 'js/admin-settings.js'],
  'index.html': ['js/site-settings.js', 'js/home.js'],
};
for (const [p, reqs] of Object.entries(required)) {
  const h = fs.readFileSync(p, 'utf8');
  const miss = reqs.filter(r => !h.includes('"' + r + '"'));
  t(p + ' includes required scripts', miss.length === 0, miss.join(', '));
}

// 5. site-settings.js бүх нийтийн хуудсанд байгаа эсэх
const noSettings = pages.filter(p => !fs.readFileSync(p, 'utf8').includes('js/site-settings.js'));
t('site-settings.js on every page', noSettings.length === 0, noSettings.join(', '));

// 6. Nav цэсэнд services холбоос бүх хуудсанд байгаа эсэх
const noSvc = pages.filter(p => !fs.readFileSync(p, 'utf8').includes('data-page="services"'));
t('services nav link on every page', noSvc.length === 0, noSvc.join(', '));

// 7. Дээд цэсэнд ЯГ нэг active холбоос байх ёстой — хоёр бол хэрэглэгч хаана
// байгаагаа мэдэхгүй. Тэгийг зөвхөн цэсэнд байдаггүй хуудсанд (нууцлал/нөхцөл)
// зөвшөөрнө, тэдгээр нь зөвхөн footer-ээс холбогддог.
const NOT_IN_NAV = ['privacy.html', 'terms.html'];
for (const p of pages) {
  const h = fs.readFileSync(p, 'utf8');
  // Гурван давхаргат header: идэвхтэй холбоос нь ангиллын цэсэнд (cat-link),
  // logo дээр (нүүр) эсвэл header-ийн баруун талд (Хадгалсан) байж болно —
  // тиймээс header-ийн БҮХ блокийг шалгана.
  const a0 = h.indexOf('NB:HEADER:START');
  const navBlock = a0 < 0 ? '' : h.slice(a0, h.indexOf('mobile-nav-drawer', a0));
  const n = (navBlock.match(/aria-current="page"/g) || []).length;
  const want = NOT_IN_NAV.includes(p) ? 0 : 1;
  t(p + ' has ' + want + ' active nav link', n === want, 'found ' + n);
}

// 8. Эрх зүйн хуудас бүх хуудсын footer-ээс холбогдсон эсэх
for (const key of ['privacy', 'terms']) {
  const missing = pages.filter(p => !fs.readFileSync(p, 'utf8').includes("navigate('" + key + "')"));
  t('footer links to ' + key + ' on every page', missing.length === 0, missing.join(', '));
}
t('privacy.html exists', fs.existsSync('privacy.html'));
t('terms.html exists', fs.existsSync('terms.html'));

console.log('\nlinks: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
