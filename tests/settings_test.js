// Тохиргооны загварууд (theme / navigation / homepage / footer) нь БОДИТ markup-тай
// таарч байгаа эсэх. Зөрвөл admin дээр сонголт харагдах ч сайтад юу ч болохгүй —
// энэ нь хамгийн төөрөгдүүлсэн эвдрэл тул автоматаар шалгана.
const fs = require('fs'), vm = require('vm');
let pass = 0, fail = 0;
const t = (n, ok, d) => { ok ? (pass++, console.log('  ok  ' + n)) : (fail++, console.log('  FAIL ' + n + (d ? ' -> ' + d : ''))); };

function grab(file, names, extra) {
  const ctx = Object.assign({ console: { log() {}, warn() {} },
    document: { getElementById: () => null, querySelectorAll: () => [], querySelector: () => null, addEventListener() {} },
    Math, Date, JSON, Set, Map, Object }, extra || {});
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(file, 'utf8') + '\n;' +
    names.map(n => 'this.' + n + ' = typeof ' + n + ' !== "undefined" ? ' + n + ' : undefined;').join(''), ctx, { filename: file });
  return ctx;
}

const a = grab('js/admin-settings.js', ['THEME_VARS', 'THEME_PRESETS', 'NAV_PAGES', 'HOME_SECTIONS', 'FOOTER_FIELDS']);
const css = fs.readFileSync('css/style.css', 'utf8');
const rootBlock = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
const index = fs.readFileSync('index.html', 'utf8');

// --- 1. Theme: бүх хувьсагч :root дээр БОДИТООР байгаа эсэх, анхны утга таарч байгаа эсэх ---
a.THEME_VARS.forEach(([v, , def]) => {
  const m = rootBlock.match(new RegExp(v.replace(/-/g, '\-') + '\s*:\s*([^;]+);'));
  t('theme var exists in :root — ' + v, !!m);
  if (m) t('theme default matches CSS — ' + v, m[1].trim().toLowerCase() === def.toLowerCase(), m[1].trim() + ' vs ' + def);
});
t('has 4 presets', Object.keys(a.THEME_PRESETS).length === 4, Object.keys(a.THEME_PRESETS).join(','));
Object.entries(a.THEME_PRESETS).forEach(([id, p]) => {
  const bad = Object.entries(p.vars).filter(([k, v]) => !/^--[a-z-]+$/.test(k) || !/^#[0-9a-f]{6}$/i.test(v));
  t('preset "' + id + '" has only valid hex vars', bad.length === 0, bad.map(x => x[0]).join(','));
  const unknown = Object.keys(p.vars).filter(k => !a.THEME_VARS.some(tv => tv[0] === k));
  t('preset "' + id + '" sets only known vars', unknown.length === 0, unknown.join(','));
});

// --- 2. Navigation: бүх хуудас бодитоор байгаа эсэх, icon нь ui.js-д байгаа эсэх ---
const icons = grab('js/ui.js', ['NB_ICONS']).NB_ICONS;
a.NAV_PAGES.forEach(([key, , icon]) => {
  const file = key === 'home' ? 'index.html' : key + '.html';
  t('nav page file exists — ' + key, fs.existsSync(file));
  t('nav icon exists in NB_ICONS — ' + icon, Object.prototype.hasOwnProperty.call(icons, icon));
});

// --- 3. Homepage: түлхүүр бүр index.html дээр data-home-section-тэй таарч байгаа эсэх ---
const inHtml = [...index.matchAll(/data-home-section="([a-zA-Z]+)"/g)].map(m => m[1]);
a.HOME_SECTIONS.forEach(([key]) => t('home section exists in markup — ' + key, inHtml.includes(key)));
t('no orphan data-home-section in markup', inHtml.every(k => a.HOME_SECTIONS.some(s => s[0] === k)),
  inHtml.filter(k => !a.HOME_SECTIONS.some(s => s[0] === k)).join(','));
t('hero CTA slot exists', index.includes('id="heroCtaSlot"'));
t('heroTitle id exists', index.includes('id="heroTitle"'));

// --- 4. Footer: түлхүүр бүр БҮХ хуудсанд байгаа эсэх ---
const pages = fs.readdirSync('.').filter(f => f.endsWith('.html'));
a.FOOTER_FIELDS.forEach(([key]) => {
  const missing = pages.filter(p => !fs.readFileSync(p, 'utf8').includes('data-footer="' + key + '"'));
  t('footer key on every page — ' + key, missing.length === 0, missing.join(','));
});

// --- 5. Banner: admin-ийн байршил бүрд БОДИТ slot байгаа эсэх ---
const adminSrc = fs.readFileSync('js/admin.js', 'utf8');
// ADMIN_TABS дотор ч мөн { id: "...", label: ... } хэлбэр байдаг тул зөвхөн
// ADMIN_BANNER_PLACEMENTS блокоос салгаж авна.
const plBlock = adminSrc.slice(adminSrc.indexOf('ADMIN_BANNER_PLACEMENTS = ['),
                               adminSrc.indexOf('];', adminSrc.indexOf('ADMIN_BANNER_PLACEMENTS = [')));
const placements = [...plBlock.matchAll(/\{ id: "([a-z-]+)", label:/g)].map(m => m[1]);
const allHtml = pages.map(p => fs.readFileSync(p, 'utf8')).join('\n');
t('admin declares 7 placements', placements.length === 7, placements.join(','));
placements.forEach(p => t('banner slot exists in markup — ' + p, allHtml.includes('data-banner-slot="' + p + '"')));

// --- 6. site-settings.js нь тохиргоо бүрийг хэрэгжүүлдэг эсэх ---
const ss = fs.readFileSync('js/site-settings.js', 'utf8');
['applyThemeSetting', 'applyNavigationSetting', 'applyHomepageSetting', 'applyFooterSetting'].forEach(fn => {
  t('site-settings implements ' + fn, ss.includes('function ' + fn) && ss.includes(fn + '('));
});
t('every apply* is inside try/catch', (ss.match(/catch \(e\)/g) || []).length >= 4);
t('theme values are validated before use', /\^#\[0-9a-f\]\{3,8\}\$/.test(ss) || /#\[0-9a-f\]/.test(ss));
t('CTA url scheme is checked', /https\?:/.test(ss));

console.log('\nsettings: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
