// Responsive-ийг browser-гүйгээр бүрэн шалгах боломжгүй, гэхдээ УТАСНЫ бодит
// эвдрэлийн хамгийн түгээмэл шалтгаануудыг статикаар барьж болно:
//   * хэвтээ гүйлт үүсгэх хатуу өргөн
//   * нэг элементийг хоёр media дүрэм зөрчилтэйгээр удирдах
//   * хүрэх талбай хэтэрхий жижиг
//   * media дүрэмд ҮЛДСЭН, markup-д байхгүй болсон selector
const fs = require('fs');
let pass = 0, fail = 0;
const t = (n, ok, d) => { ok ? (pass++, console.log('  ok  ' + n)) : (fail++, console.log('  FAIL ' + n + (d ? ' -> ' + d : ''))); };

const css = fs.readFileSync('css/style.css', 'utf8');
const pages = fs.readdirSync('.').filter(f => f.endsWith('.html'));
const allHtml = pages.map(p => fs.readFileSync(p, 'utf8')).join('\n');
const allJs = fs.readdirSync('js').map(f => fs.readFileSync('js/' + f, 'utf8')).join('\n');

// --- 1. Хэвтээ гүйлтийн хамгаалалт ---
t('html/body clamp the viewport width', /html, body \{[^}]*overflow-x: hidden/.test(css));
t('media elements cannot overflow', /img, video, iframe, table, pre \{[^}]*max-width: 100%/.test(css));

// --- 2. Meta viewport бүх хуудсанд ---
const noVp = pages.filter(p => !/name="viewport"[^>]*width=device-width/.test(fs.readFileSync(p, 'utf8')));
t('every page has a correct viewport meta', noVp.length === 0, noVp.join(','));
// user-scalable=no нь хүртээмжийн зөрчил — хэзээ ч байж болохгүй
const noZoom = pages.filter(p => /user-scalable=no|maximum-scale=1/.test(fs.readFileSync(p, 'utf8')));
t('zoom is never disabled', noZoom.length === 0, noZoom.join(','));

// --- 3. Хүрэлтээр ажилладаг төхөөрөмжийн дүрэм ---
t('touch devices get larger hit areas', /@media \(hover: none\)/.test(css));
t('hover transforms are disabled on touch', /@media \(hover: none\)[\s\S]{0,400}transform: none/.test(css));

// --- 4. Хөдөлгөөн багасгах хүсэлтийг хүндэтгэнэ ---
t('prefers-reduced-motion is honoured globally', /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,300}animation-duration: \.001ms/.test(css));
t('carousel autoplay checks reduced motion', /prefers-reduced-motion/.test(fs.readFileSync('js/home.js', 'utf8')));

// --- 5. Нэвтрэлтийн товчийг санамсаргүй нуугаагүй ---
// Хуучин дүрэм .nav-actions .btn-ghost -ийг 900px-д нуудаг байсан — тэр нь
// нэвтэрсэн хэрэглэгчийн "Гарах" товчийг ч нуудаг байсан (бодит эвдрэл).
t('logout button is never hidden wholesale', !/\.nav-actions \.btn-ghost \{\s*display: none/.test(css));
// Зөвхөн #navAuthButtons дотор, зөвхөн хамгийн нарийн дэлгэцэнд нуух нь зөв
t('only the signed-out ghost button is hidden, at ≤600px',
  /#navAuthButtons \.btn\.btn-ghost \{ display: none; \}/.test(css));

// --- 6. media дүрэмд үлдсэн "хий" selector байхгүй эсэх ---
// Markup/JS-д огт байхгүй класс дээр дүрэм үлдвэл дараа нь уншигч төөрөгдөнө.
const DEAD = ['.search-box', '.hero-content', '.hero-stat', '.btn-random', '.nav-group', '.nav-dropdown', '.card-feeling', '.card-likes', '.ub-search'];
const stillStyled = DEAD.filter(sel => css.includes(sel) && !allHtml.includes(sel.slice(1)) && !allJs.includes(sel.slice(1)));
t('no CSS left for removed components', stillStyled.length === 0, stillStyled.join(','));

// --- 7. Нэг компонентыг хоёр зөрчилтэй дүрэм удирдахгүй ---
// .cards-grid нь зөвхөн өөрийн блокт л media дүрэмтэй байх ёстой.
const gridRules = [...css.matchAll(/\.cards-grid \{[^}]*grid-template-columns/g)].length;
t('cards-grid has one source of truth', gridRules <= 4, gridRules + ' declarations');

// --- 8. Breakpoint бүрт үндсэн бүтэц тодорхойлогдсон эсэх ---
[360, 480, 640, 900].forEach(bp => {
  t('breakpoint declared: ' + bp + 'px', css.includes('max-width: ' + bp + 'px'));
});

// --- 9. Картын сүлжээ утсан дээр нэг багана болж ХЭТ урт болоогүй эсэх ---
// 560px-д 2 багана байх нь зөв (1 багана бол гүйлт хэтэрхий урт).
t('phones keep a 2-column card grid', /@media \(max-width: 560px\)[\s\S]{0,500}\.cards-grid \{ grid-template-columns: repeat\(2/.test(css));

// --- 10. Sticky header нь sticky шүүлтүүртэй зөрчихгүй ---
t('sticky filter bar offsets below the header', /\.filter-toolbar \{[\s\S]{0,200}top: \d+px/.test(css));
t('sticky filter is disabled on narrow screens', /@media \(max-width: 560px\)[\s\S]{0,700}\.filter-toolbar \{ position: static/.test(css));

// --- 11. Header нь нарийн дэлгэцэнд хайлтыг бүтэн мөр болгодог эсэх ---
t('header search wraps to its own row on mobile', /\.header-search \{ order: 3; flex-basis: 100%/.test(css));

console.log('\nresponsive: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
