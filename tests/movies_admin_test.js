// Киноны админ: БҮРЭН CRUD.
//
// Өмнө нь админ зөвхөн Firestore-д нэмсэн киног л харуулж, устгадаг байв —
// сайт дээр харагдаж байгаа 31 суурь кино админд ОГТ байхгүй, засах ч, устгах
// ч боломжгүй байсан. "Сайт дээр байгаа зүйл админд байхгүй" нь удирдлагын
// самбарын хамгийн ойлгомжгүй эвдрэл.
const fs = require('fs'), vm = require('vm');
let pass = 0, fail = 0;
const t = (n, ok, d) => { ok ? (pass++, console.log('  ok  ' + n)) : (fail++, console.log('  FAIL ' + n + (d ? ' -> ' + d : ''))); };

const adm = fs.readFileSync('js/admin-movies.js', 'utf8');
const mov = fs.readFileSync('js/movies.js', 'utf8');
const html = fs.readFileSync('admin.html', 'utf8');
const movHtml = fs.readFileSync('movies.html', 'utf8');

// --- 1. Хоёр эх сурвалж хоёулаа админд харагдана ---
t('admin merges base catalogue and Firestore', /function admMovieList/.test(adm)
  && /typeof movies === "undefined"/.test(adm) && /firebaseMovies/.test(adm));
t('rows are tagged with their source', /_src: "base"/.test(adm) && /_src: "db"/.test(adm));
t('admin shows hidden items too', /Админд БҮХ кино харагдана/.test(adm));

// --- 2. CRUD бүрэн ---
t('create exists', /function admSaveMovie/.test(adm) && /saveMovieToFirebase/.test(adm));
t('edit exists', /function admEditMovie/.test(adm));
t('delete exists (Firestore movies)', /function admDeleteMovie/.test(adm) && /deleteMovieFromFirebase/.test(adm));
t('hide exists (base catalogue)', /function admToggleMovieHidden/.test(adm));
t('revert exists (base catalogue)', /function admRevertMovie/.test(adm));

// --- 3. Суурь каталогийг КОДОД БИШ, давхарлаж засна ---
// Кодын файлыг засвал буцаах боломжгүй болно.
t('base edits go through the overlay', /cmsSaveOverride\("movies", \{ \["edits\." \+ key\]: data \}\)/.test(adm));
t('base hide goes through the overlay', /cmsSaveOverride\("movies", \{ hidden: op \}\)/.test(adm));
t('base movies are never deleted outright', !/deleteMovieFromFirebase\([^)]*m\.id/.test(adm));

// --- 4. Бүх талбар засагдана ---
const FIELDS = ['title', 'year', 'rating', 'duration', 'poster', 'genres', 'lang',
  'emoji', 'director', 'desc', 'why', 'trailer', 'watchUrl', 'trending'];
const declared = [...adm.matchAll(/\["(\w+)", "[^"]*", "\w+"\]/g)].map(m => m[1]);
FIELDS.forEach(f => t('field editable: ' + f, declared.includes(f)));

// Frontend дээр ашиглагддаг талбар бүр админд байх ёстой
const used = new Set();
for (const m of mov.matchAll(/\bm\.(\w+)/g)) used.add(m[1]);
const important = ['title', 'year', 'rating', 'genres', 'lang', 'poster', 'desc', 'why', 'duration', 'director', 'trending'];
const missing = important.filter(f => used.has(f) && !declared.includes(f));
t('every field the site renders is editable', missing.length === 0, missing.join(','));

// --- 5. Шүүлтүүр frontend-тэй ижил ---
t('admin has the same tabs as the site', /trending[\s\S]{0,200}mongolian[\s\S]{0,200}dubbed/.test(adm));
t('admin filters by genre', /admMovieGenre !== "all"/.test(adm));
t('admin has search', /function admSearchMovies/.test(adm));
t('search covers title, desc and director', /title[\s\S]{0,120}desc[\s\S]{0,120}director/.test(adm));

// --- 6. Эрхийн хамгаалалт ---
['content.edit', 'content.hide', 'content.delete', 'content.create'].forEach(p => {
  t('gated on ' + p, adm.includes('nbCan("' + p + '")'));
});

// --- 7. Өөрчлөлт frontend дээр тусна ---
t('movies page applies the overlay', /function hydrateMovieOverrides/.test(mov));
t('overlay re-renders the grid', /cmsHydrate\("movies", movies, "id"/.test(mov));
t('movies page loads cms.js', /js\/cms\.js/.test(movHtml));
t('movies page calls hydration', /hydrateMovieOverrides\(\)/.test(movHtml));
t('admin page loads admin-movies.js', /js\/admin-movies\.js/.test(html));

// --- 8. XSS ---
t('admin escapes movie titles', /escapeHtml\(m\.title/.test(adm));
t('admin escapes poster urls', /escapeHtml\(m\.poster\)/.test(adm));
t('admin escapes field values', /escapeHtml\(v\)/.test(adm));

// --- 9. Бодит каталог дээр нэгтгэл ажиллаж байгаа эсэх ---
const ctx = {
  console: { log() {}, warn() {} }, Math, Date, JSON, Set, Map, Promise,
  document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener() {} },
  localStorage: { getItem: () => null, setItem() {} }, location: { search: '' },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
  escapeHtml: s => String(s == null ? '' : s),
  navigator: { userAgent: 'node', serviceWorker: { register: () => Promise.resolve() } },
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  setTimeout, setInterval: () => 0, clearInterval() {},
  URLSearchParams, encodeURIComponent, decodeURIComponent,
  history: { replaceState() {} }, CSS: { escape: x => x },
  requestAnimationFrame: f => f(),
};
ctx.window = ctx; ctx.addEventListener = () => {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('js/core.js', 'utf8') + '\n;\n' + mov + '\n;this.base=movies;this.all=allMovies;', ctx);
t('base catalogue is non-trivial', ctx.base.length > 20, ctx.base.length + ' movies');
t('every base movie has an id', ctx.base.every(m => m.id !== undefined));
t('base ids are unique', new Set(ctx.base.map(m => m.id)).size === ctx.base.length);
t('every base movie has genres', ctx.base.every(m => Array.isArray(m.genres) && m.genres.length));
t('allMovies includes the base catalogue', ctx.all().length >= ctx.base.length);

console.log('\nmovies admin: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
