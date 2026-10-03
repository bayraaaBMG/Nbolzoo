// Хайлт нь ub.html?q=... -аар ажилладаг эсэх. ӨМНӨ нь performSearch() нь
// navigate() -ээр хуудсыг дахин ачаалаад setTimeout дотор DOM засахыг оролддог
// байсан — callback хэзээ ч ажиллахгүй тул хайлт бүрэн эвдэрсэн байв.
const fs = require('fs'), vm = require('vm');
let pass = 0, fail = 0;
const t = (n, ok, d) => { ok ? (pass++, console.log('  ok  ' + n)) : (fail++, console.log('  FAIL ' + n + (d ? ' -> ' + d : ''))); };

const core = fs.readFileSync('js/core.js', 'utf8');
const ub = fs.readFileSync('js/ub.js', 'utf8');

// --- Регрессийн хамгаалалт: хуучин эвдэрсэн хэв маяг эргэж ирэхгүй байх ---
const ps = core.slice(core.indexOf('function performSearch'), core.indexOf('function performSearch') + 1400);
t('performSearch does NOT use setTimeout after navigation', !/navigate\([^)]*\)[\s\S]{0,200}setTimeout/.test(ps));
t('performSearch passes the query through the URL', /ub\.html\?q=/.test(ps));
t('performSearch url-encodes the query', /encodeURIComponent/.test(ps));
t('performSearch filters in place when already on ub.html', /renderUbIdeas/.test(ps));

// --- ub.js нь хайлтыг шүүлтүүрийн системд нэгтгэсэн эсэх ---
t('ubQuery state exists', /let ubQuery/.test(ub));
t('ubReadUrl reads q', /ubQuery\s*=\s*\(p\.get\("q"\)/.test(ub));
t('ubSyncUrl writes q', /p\.set\("q", ubQuery\)/.test(ub));
const applyBody = ub.slice(ub.indexOf('function ubApplyFilters'), ub.indexOf('function ubSyncUrl'));
t('ubApplyFilters uses the query', /if \(ubQuery\)/.test(applyBody) && /includes\(q\)/.test(applyBody));
t('ubActiveCount counts the query', /ubQuery \? 1 : 0/.test(ub));
t('ubClearQuery exists', /function ubClearQuery/.test(ub));
t('ubClearFilters also clears the query', /function ubClearFilters\(\) \{\s*\n\s*ubQuery = ""/.test(ub));
t('empty state names the query', /гэсэн хайлтад тохирох/.test(ub));
t('query is escaped before render', /escapeHtml\(ubQuery\)/.test(ub));

// --- Хайлтын логик бодит өгөгдөл дээр ажиллаж байгаа эсэх ---
const stub = { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  createElement: () => ({ style: {}, classList: { add() {} } }), addEventListener() {} };
const ctx = { console: { log() {}, warn() {} }, document: stub, Math, Date, JSON, Set, Map,
  URLSearchParams, encodeURIComponent, decodeURIComponent, location: { search: '' },
  history: { replaceState() {} }, setTimeout, navigator: { userAgent: 'node' },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, CSS: { escape: x => x } };
ctx.window = ctx; ctx.addEventListener = () => {};
vm.createContext(ctx);
// `let ubQuery` нь vm-ийн lexical scope-д сууна, context object дээр property болдоггүй —
// тиймээс гаднаас ctx.ubQuery = ... гэж оноовол дотоод хувьсагч ХЭВЭЭР үлдэнэ.
// Тестэд зөв нөлөөлөхийн тулд дотроос setter гаргаж авна.
vm.runInContext(core + '\n;\n' + ub +
  '\n;this.allUbIdeas=allUbIdeas;this.ubApplyFilters=ubApplyFilters;' +
  'this.setQuery=function(v){ubQuery=v;};', ctx);

const all = ctx.allUbIdeas;
ctx.setQuery('зайсан');
const hit = ctx.ubApplyFilters(all);
t('searching a real place finds results', hit.length > 0, 'found ' + hit.length);
t('every result actually contains the term', hit.every(i =>
  (i.title + i.desc + i.location + i.category + i.feeling).toLowerCase().includes('зайсан')));

ctx.setQuery('музей');
t('searching a category finds results', ctx.ubApplyFilters(all).length > 0);

ctx.setQuery('ээжийнхээрхжшш');
t('nonsense query returns nothing', ctx.ubApplyFilters(all).length === 0);

ctx.setQuery('');
t('empty query returns everything', ctx.ubApplyFilters(all).length === all.length);

ctx.setQuery('ЗАЙСАН');
t('search is case-insensitive', ctx.ubApplyFilters(all).length === hit.length);

console.log('\nsearch: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
