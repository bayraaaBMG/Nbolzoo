// САЙТ ДАЯАР МӨНГӨН ДҮН БАЙХГҮЙ.
//
// Хэрэглэгчийн шийдвэр: болзооны санаа нь үнээр биш, ХААНА, ЮУ хийх вэ гэдгээрээ
// үнэ цэнтэй. Үнэ нь байнга өөрчлөгддөг тул худал мэдээлэл болох эрсдэлтэй ч
// байсан. Тиймээс сайтын аль ч хэсэгт мөнгөн дүн гарахгүй.
//
// Энэ багц нь зөвхөн "одоо байхгүй" гэдгийг биш, ДАХИН ОРЖ ИРЭХГҮЙ гэдгийг хамгаална.
const fs = require('fs');
let pass = 0, fail = 0;
const t = (n, ok, d) => { ok ? (pass++, console.log('  ok  ' + n)) : (fail++, console.log('  FAIL ' + n + (d ? ' -> ' + d : ''))); };

const jsFiles = fs.readdirSync('js').filter(f => f.endsWith('.js')).map(f => 'js/' + f);
const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));

// --- 1. ₮ тэмдэг хаана ч байхгүй ---
// Эрх зүйн хуудас зэрэгт "төлбөр авдаггүй" гэж бичих нь зөв тул ₮ тэмдгийг л хориглоно.
[...jsFiles, ...htmlFiles, 'css/style.css'].forEach(f => {
  const src = fs.readFileSync(f, 'utf8');
  const hits = (src.match(/₮/g) || []).length;
  t('no ₮ symbol in ' + f, hits === 0, hits + ' occurrence(s)');
});

// --- 2. Үнийн талбар render хийгдэхгүй ---
const RENDER = ['js/core.js', 'js/home.js', 'js/ub.js', 'js/aimags.js', 'js/gifts.js', 'js/services.js'];
RENDER.forEach(f => {
  const src = fs.readFileSync(f, 'utf8');
  t('no priceText in ' + f, !/priceText/.test(src));
  t('no price badge in ' + f, !/card-badge-price|gift-price|service-price/.test(src));
});

// --- 3. Төсвийн шүүлтүүр бүрэн алга ---
const ub = fs.readFileSync('js/ub.js', 'utf8');
t('UB_BUDGETS is gone', !/UB_BUDGETS/.test(ub));
t('budget filter state is gone', !/ubFilter\.budget/.test(ub));
t('budget is not read from the URL', !/"budget"/.test(ub));
const home = fs.readFileSync('js/home.js', 'utf8');
t('BUDGET_TIERS is gone', !/BUDGET_TIERS/.test(home));
t('renderBudgetSection is gone', !/renderBudgetSection/.test(home));
htmlFiles.forEach(f => {
  const src = fs.readFileSync(f, 'utf8');
  t('no budget section in ' + f, !/data-home-section="budget"|id="budgetChips"/.test(src));
});

// --- 4. Өгөгдөлд үнийн талбар байхгүй ---
t('no price field in gifts data', !/price\s*:\s*"/.test(fs.readFileSync('js/gifts.js', 'utf8')));
t('no price field in aimag dates', !/price\s*:\s*"/.test(fs.readFileSync('js/aimags.js', 'utf8')));

// --- 5. Admin-д үнэ засах талбар байхгүй ---
const cms = fs.readFileSync('js/admin-cms.js', 'utf8');
t('CMS has no price field', !/"price"|Үнэ|Үнийн/.test(cms));
const settings = fs.readFileSync('js/admin-settings.js', 'utf8');
t('homepage builder has no budget section', !/"budget"/.test(settings));

// --- 6. Үйлчилгээ бүртгэхэд үнэ асуухгүй ---
const svc = fs.readFileSync('js/services.js', 'utf8');
t('service form has no price input', !/svcPrice/.test(svc));
t('service submit stores no price', !/price:/.test(svc));

// --- 7. Мөнгөний тоон хэлбэр байхгүй ---
// ЗӨВХӨН мөнгө гэдэг нь ТОДОРХОЙ тохиолдлыг шалгана: ₮ тэмдэгтэй тоо, эсвэл
// "үнэ/төсөв/зардал" гэсэн үгийн ойролцоох тоо. Энгийн таслалтай тоо нь мөнгө
// гэсэн үг БИШ — js/aimags.js доторх "15,000-40,000 жил", "630,000 га",
// "10,000 орчим хадны зураг" зэрэг нь түүх/газарзүйн бодит баримт бөгөөд
// тэдгээрийг хасах нь контентыг гэмтээнэ.
const MONEY_NEAR = /(үнэ|төсөв|зардал|price|budget|cost).{0,40}\d{1,3},\d{3}|\d{1,3},\d{3}\s*₮/i;
[...jsFiles, ...htmlFiles].forEach(f => {
  const src = fs.readFileSync(f, 'utf8');
  const hit = src.match(MONEY_NEAR);
  t('no money figures in ' + f, !hit, hit ? hit[0] : '');
});

console.log('\nno-money: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
