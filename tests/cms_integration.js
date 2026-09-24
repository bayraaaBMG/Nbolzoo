// CMS overlay-г БОДИТ dataset дээр туршина: id-ууд таарч байна уу, hydrate нь
// массивыг байран дээр нь шинэчилж байна уу, нуусан зүйл бодитоор алга болж байна уу.
const fs = require('fs'), vm = require('vm');
let pass = 0, fail = 0;
const t = (n, ok, d) => { ok ? (pass++, console.log('  ok  ' + n)) : (fail++, console.log('  FAIL ' + n + (d ? ' -> ' + d : ''))); };

const stub = { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  createElement: () => ({ style: {}, classList: { add() {} } }), addEventListener() {} };

function load(files, names, override) {
  const ctx = { console: { log() {}, warn() {} }, document: stub, Math, Date, JSON, Set, Map,
    URLSearchParams, encodeURIComponent, decodeURIComponent, location: { search: '' },
    history: { replaceState() {} }, setTimeout, Promise,
    // Firestore-ийг дуурайж, өгсөн override-ийг буцаана
    db: { collection: () => ({ doc: () => ({ get: () => Promise.resolve({ exists: !!override, data: () => override || {} }) }) }) },
  };
  ctx.window = ctx;
  ctx.addEventListener = () => {}; ctx.removeEventListener = () => {};
  ctx.navigator = { userAgent: 'node', serviceWorker: { register: () => Promise.resolve() } };
  ctx.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  ctx.CSS = { escape: x => x };
  vm.createContext(ctx);
  const epi = '\n;' + names.map(n => 'this.' + n + ' = typeof ' + n + ' !== "undefined" ? ' + n + ' : undefined;').join('');
  vm.runInContext(files.map(f => fs.readFileSync(f, 'utf8')).join('\n;\n') + epi, ctx, { filename: files.join('+') });
  return ctx;
}

// ---- 1. CMS_SOURCES-ийн idKey нь бодит өгөгдөлтэй таарч байгаа эсэх ----
const c = load(['js/core.js', 'js/ub.js', 'js/aimags.js', 'js/gifts.js', 'js/cms.js'],
  ['allUbIdeas', 'aimagsClean', 'gifts', 'cmsApply', 'cmsHydrate', 'CMS_TYPES']);

[['ub', c.allUbIdeas], ['aimags', c.aimagsClean], ['gifts', c.gifts]].forEach(([type, arr]) => {
  t(type + ': every item has an id', arr.every(x => x.id !== undefined), 'missing on ' + arr.filter(x => x.id === undefined).length);
  t(type + ': ids are unique', new Set(arr.map(x => String(x.id))).size === arr.length,
    arr.length + ' items, ' + new Set(arr.map(x => String(x.id))).size + ' unique');
});
t('CMS_TYPES matches what is wired', JSON.stringify(c.CMS_TYPES) === JSON.stringify(['ub', 'aimags', 'gifts']), JSON.stringify(c.CMS_TYPES));

// ---- 2. Бодит өгөгдөл дээр нуулт/засвар ажиллаж байгаа эсэх ----
const firstUb = c.allUbIdeas[0], secondUb = c.allUbIdeas[1];
const out = c.cmsApply(c.allUbIdeas, { hidden: [firstUb.id], edits: { [secondUb.id]: { title: 'ЗАСВАРЛАСАН' } } }, 'id');
t('hiding a real idea removes it', !out.some(x => x.id === firstUb.id));
t('hiding removes exactly one', out.length === c.allUbIdeas.length - 1, out.length + ' vs ' + (c.allUbIdeas.length - 1));
t('editing a real idea applies', out.find(x => x.id === secondUb.id).title === 'ЗАСВАРЛАСАН');
t('editing does not mutate the source', c.allUbIdeas.find(x => x.id === secondUb.id).title !== 'ЗАСВАРЛАСАН');

// ---- 3. cmsHydrate нь массивыг БАЙРАН ДЭЭР нь шинэчилдэг эсэх ----
(async () => {
  const h = load(['js/core.js', 'js/ub.js', 'js/cms.js'], ['allUbIdeas', 'cmsHydrate'],
    { hidden: [1, 2, 3], order: [], edits: {}, added: [] });
  const ref = h.allUbIdeas;          // хуучин лавлагаа
  const before = ref.length;
  let rerendered = 0;
  await h.cmsHydrate('ub', h.allUbIdeas, 'id', () => { rerendered++; });
  t('hydrate removed hidden items', ref.length === before - 3, before + ' -> ' + ref.length);
  t('hydrate mutated the SAME array reference', ref === h.allUbIdeas);
  t('hydrate triggered exactly one re-render', rerendered === 1, 'count=' + rerendered);
  t('hidden ids really gone', ![1, 2, 3].some(id => ref.some(x => x.id === id)));

  // Өөрчлөлтгүй бол дахин зурахгүй (шаардлагагүй ажил хийхгүй)
  const h2 = load(['js/core.js', 'js/ub.js', 'js/cms.js'], ['allUbIdeas', 'cmsHydrate'],
    { hidden: [], order: [], edits: {}, added: [] });
  let r2 = 0;
  const len2 = h2.allUbIdeas.length;
  await h2.cmsHydrate('ub', h2.allUbIdeas, 'id', () => { r2++; });
  t('no override = no re-render', r2 === 0);
  t('no override = list untouched', h2.allUbIdeas.length === len2);

  // Firestore унасан үед хуудас хэвээр (fail-open)
  const h3 = load(['js/core.js', 'js/ub.js', 'js/cms.js'], ['allUbIdeas', 'cmsHydrate'], null);
  h3.db = { collection: () => { throw new Error('offline'); } };
  const len3 = h3.allUbIdeas.length;
  let r3 = 0;
  await h3.cmsHydrate('ub', h3.allUbIdeas, 'id', () => { r3++; });
  t('Firestore failure leaves content intact', h3.allUbIdeas.length === len3 && r3 === 0);

  console.log('\ncms integration: ' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
