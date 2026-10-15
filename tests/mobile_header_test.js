// Мобайл толгойн НЯГТРАЛ.
//
// Бодит төхөөрөмж дээр (390px, нэвтэрсэн) толгойд 7 элемент шахагдаж,
// хайлтын талбар уншигдахгүй нарийн болсон. Засвар нь элементийг
// ЖИЖИГРҮҮЛЭХ биш, ТООГ нь цөөлөх явдал байв.
//
// Энэ багц нь зайн төсвийг тооцоолж, цөөлсөн элементүүд эргэж ирэхгүй
// байхыг хамгаална.
const fs = require('fs');
let pass = 0, fail = 0;
const t = (n, ok, d) => { ok ? (pass++, console.log('  ok  ' + n)) : (fail++, console.log('  FAIL ' + n + (d ? ' -> ' + d : ''))); };

const css = fs.readFileSync('css/style.css', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const auth = fs.readFileSync('js/auth.js', 'utf8');

// --- 1. Мобайл дээр цөөлсөн элементүүд ---
t('search button is hidden on mobile', /\.header-search-btn \{ display: none; \}/.test(css));
t('header logout is hidden on mobile', /\.header-logout \{ display: none; \}/.test(css));
t('saved link is hidden on mobile', /\.header-saved \{ display: none; \}/.test(css));
t('signed-out auth buttons are hidden on mobile', /#navAuthButtons \{ display: none; \}/.test(css));

// --- 2. Нуусан бүрд НӨӨЦ зам байх ёстой ---
// Нуух нь зөвхөн өөр хаанаас хүрэх боломжтой үед л зөв.
t('search still runs from the magnifier', /class="header-search-ico" onclick="performSearch\(\)"/.test(html));
t('magnifier is a real button with a label', /<button type="button" class="header-search-ico"[^>]*aria-label="Хайх"/.test(html));
t('search still runs on Enter', /event\.key==='Enter'\)performSearch\(\)/.test(html));
t('logout is in the mobile drawer', /mobileAuth[\s\S]{0,300}logoutUser\(\)/.test(auth));
t('logout is in the profile modal', /onclick="logoutUser\(\)">Гарах<\/button>/.test(auth));
t('saved is reachable from the drawer', /navigate\('saved'\);closeMobileMenu\(\)/.test(html));
t('sign-in is reachable from the drawer', /id="mobileAuthButtons"[\s\S]{0,400}openAuth\('login'\)/.test(html));

// --- 3. Зайн төсөв: нэвтэрсэн төлөв (хамгийн ачаалалтай) ---
// Үлдэх элементүүд: лого · хайлт · хонх · зураг · цэс
const LOGO = 34, BELL = 34, AVATAR = 34, MENU = 36, GAP = 3, PAD = 10;
// 16px фонтоор ~11 тэмдэгт багтана — хайлтын талбар гэдэг нь танигдаж,
// бичихэд саадгүй. 320px бол 2016 оны iPhone SE — ховор ч дэмжинэ.
const SEARCH_MIN = 135;
[320, 360, 390, 430].forEach(w => {
  const actions = BELL + AVATAR + MENU + GAP * 2;
  const search = w - (PAD * 2 + LOGO + GAP * 2 + actions);
  t('search is usable at ' + w + 'px (' + search + 'px)', search >= SEARCH_MIN, search + 'px');
});

// --- 4. Толгойд 5-аас олон элемент байхгүй ---
const headStart = html.indexOf('<div class="header-inner">');
const headEnd = html.indexOf('</header>', headStart);
const head = html.slice(headStart, headEnd);
// Мобайл дээр харагдах зүйлс: logo, search, bell, avatar, menu
const mobileHidden = ['header-saved', 'navAuthButtons', 'header-search-btn', 'header-logout'];
mobileHidden.forEach(c => {
  t(c + ' exists in markup but is CSS-hidden on mobile',
    head.includes(c) && new RegExp('\.' + c.replace(/^#/, '') + '[^{]*\{ display: none').test(css.replace(/#/g, '')));
});

// --- 5. iOS фокуслахад автоматаар томрохгүй ---
// 16px-ээс бага фонттой input дээр фокуслахад iOS хуудсыг томруулдаг.
// user-scalable=no ашиглаж засах нь хүртээмжийн зөрчил тул фонтоор шийднэ.
const mob = css.slice(css.indexOf('@media (max-width: 600px)'));
// iOS нь 16px-ЭЭС БАГА фонттой input дээр фокуслахад хуудсыг автоматаар
// томруулдаг. Тиймээс яг 16px байх ёстой — 15px хангалтгүй.
// Мобайл дүрэм нь ≤860px блокоос эхэлдэг (тэр нь ≤600, ≤430-ийг ч хамарна).
const inputFont = css.match(/@media \(max-width: 860px\)[\s\S]{0,900}?\.header-search input \{[^}]*font-size: (\d+)px/);
t('mobile search font is 16px (prevents iOS auto-zoom)', inputFont && Number(inputFont[1]) >= 16, inputFont ? inputFont[1] + 'px' : 'not set');
t('zoom is never disabled', !/user-scalable=no/.test(html));

console.log('\nmobile header: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
