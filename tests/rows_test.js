// ХЭВТЭЭ ЭГНЭЭ: кино нь төрөл тус бүрээр нэг эгнээ болж, хажуу тийш гүйнэ
// (стриминг аппын хэв маяг). Өмнө нь бүх кино нэг том тор болж, утсан дээр
// доошоо маш урт гүйлт үүсгэдэг байв.
//
// Мөн ангиллын мөрүүд (кино, бэлэг, шүүлтүүр) бүгд НЭГ МӨР байх ёстой —
// flex-wrap: wrap байсан тул утсан дээр 3-4 мөр болж задардаг байв.
const fs = require('fs'), vm = require('vm');
const nodes = {};
const el = id => ({
  id, _h: '', style: {}, dataset: {},
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  set innerHTML(v) { this._h = v; }, get innerHTML() { return this._h; },
  set textContent(v) { this._t = v; }, get textContent() { return this._t; },
  querySelector: () => null, querySelectorAll: () => [], appendChild() {},
  addEventListener() {}, getBoundingClientRect: () => ({ width: 0, height: 0 }),
});
const doc = {
  getElementById(i) { if (!nodes[i]) nodes[i] = el(i); return nodes[i]; },
  querySelector: () => null, querySelectorAll: () => [],
  createElement: () => el('x'), createTextNode: () => ({}), addEventListener() {},
  documentElement: el('html'), body: el('body'),
};
const ctx = {
  console, document: doc, Math, Date, JSON, Set, Map, Promise,
  URLSearchParams, encodeURIComponent, decodeURIComponent,
  setTimeout, setInterval: () => 0, clearInterval() {},
  location: { search: '', pathname: '/movies.html' },
  history: { replaceState() {} },
  navigator: { userAgent: 'node', serviceWorker: { register: () => Promise.resolve() } },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  CSS: { escape: x => x },
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
  requestAnimationFrame: f => f(),
  firebase: { firestore: Object.assign(() => ({}), { FieldValue: {} }) },
  db: null,
};
ctx.window = ctx;
ctx.addEventListener = () => {};
vm.createContext(ctx);

const src = fs.readFileSync('js/core.js', 'utf8') + '\n;\n' + fs.readFileSync('js/movies.js', 'utf8');
// vm доторх `let` нь context object дээр property болдоггүй тул гаднаас
// шууд оноож болохгүй — дотроос setter гаргаж авна.
const epilogue = '\n;this.f=getFilteredMovies;this.rows=movieRows;this.render=renderMovies;this.all=allMovies;'
  + 'this.setGenre=function(v){currentMovieGenre=v;};'
  + 'this.setSearch=function(v){currentMovieSearch=v;};';
try {
  vm.runInContext(src + epilogue, ctx, { filename: 'movies' });
} catch (e) {
  console.log('LOAD ERROR:', e.message);
  process.exit(1);
}

let pass = 0, fail = 0;
const t = (n, ok, d) => { ok ? (pass++, console.log('  ok  ' + n)) : (fail++, console.log('  FAIL ' + n + (d ? ' -> ' + d : ''))); };

const list = ctx.f();
const grouped = ctx.rows(list);
ctx.render();
const h = nodes['movieGrid']._h;
const rows = (h.match(/class="cine-row"/g) || []).length;
const cards = (h.match(/class="cine-card"/g) || []).length;
const rails = (h.match(/cine-row-rail/g) || []).length;

// --- Эгнээний бүтэц ---
t('movies are grouped into rows', rows > 1, rows + ' rows');
t('every row has a scrolling rail', rails === rows, rails + ' rails / ' + rows + ' rows');
t('every movie appears exactly once', cards === list.length, cards + ' cards / ' + list.length + ' movies');
t('no undefined leaks into the markup', !/undefined|NaN/.test(h));
t('rows are ordered largest first',
  grouped.every((r, i) => i === 0 || grouped[i - 1].items.length >= r.items.length),
  grouped.map(r => r.items.length).join(','));
t('no movie is duplicated across rows', (() => {
  const seen = new Set();
  for (const r of grouped) for (const m of r.items) { if (seen.has(m.id)) return false; seen.add(m.id); }
  return true;
})());

// --- Шүүсэн үед нэг эгнээ ---
ctx.setGenre('romantic');
const one = ctx.rows(ctx.f());
t('choosing a genre collapses to one row', one.length === 1, one.length + '');
ctx.setGenre('all');
ctx.setSearch('la');
t('searching collapses to one row', ctx.rows(ctx.f()).length === 1);
ctx.setSearch('');

// --- CSS: бүх ангиллын мөр НЭГ МӨР байх ---
const css = fs.readFileSync('css/style.css', 'utf8');
t('movie rows scroll horizontally', /\.cine-row-rail \{[\s\S]{0,200}overflow-x: auto/.test(css));
t('movie rows never wrap', /\.cine-row-rail \{[\s\S]{0,120}flex-wrap: nowrap/.test(css));
['gift-cat-tabs', 'cinema-tabs', 'cinema-genre-chips', 'filters'].forEach(cls => {
  const block = css.slice(css.indexOf('.gift-cat-tabs, .cinema-tabs'));
  t(cls + ' is a single scrolling row', block.includes(cls) && /flex-wrap: nowrap/.test(block));
});

// --- РЕГРЕСС: шошгын текст уншигдах өнгөтэй байх ---
// Бараан сэдвийг цайвар болгоход rgba(255,255,255,.x) -г var(--border) рүү
// буулгасан нь ТЕКСТЭД буруу байсан: цайвар дэвсгэр дээр хүрээний саарал
// текст бараг уншигдахгүй болсон.
t('cinema tab text is readable', !/\.cinema-tab \{[^}]*color: var\(--border\)/.test(css));
t('genre chip text is readable', !/\.cchip \{[^}]*color: var\(--border\)/.test(css));

console.log(String.fromCharCode(10) + 'rows: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
