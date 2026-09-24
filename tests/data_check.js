// Dataset бүрэн бүтэн байдал. wonderDetails нь wonders массивтай ИНДЕКСЭЭРЭЭ тохирох
// ёстой — openWonderModal(aimagId, idx) нь байрлалаар хайдаг тул зөрвөл хэрэглэгчид
// огт өөр газрын мэдээлэл харагдана.
const fs = require('fs'), vm = require('vm');
const stub = { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  createElement: () => ({ style: {}, classList: { add() {} } }), addEventListener() {} };

function loadInto(files, names) {
  const ctx = { console: { log() {}, warn() {} }, document: stub, Math, Date, JSON, Set, Map,
    URLSearchParams, encodeURIComponent, decodeURIComponent, location: { search: '' },
    history: { replaceState() {} } };
  ctx.window = ctx; ctx.addEventListener = () => {}; ctx.CSS = { escape: x => x };
  ctx.setTimeout = setTimeout; ctx.navigator = { userAgent: 'node' };
  ctx.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  vm.createContext(ctx);
  // vm дотор top-level `const` нь context object дээр property болж суудаггүй, тиймээс
  // шаардлагатай нэрсийг эцэст нь гараар гаргаж авна.
  const epilogue = '\n;' + names.map(n => 'this.' + n + ' = typeof ' + n + ' !== "undefined" ? ' + n + ' : undefined;').join('');
  // Browser дээрх шиг нэг lexical scope — ub.js нь core.js доторх туслах функцүүдээс хамаардаг.
  const list = [].concat(files);
  const src = list.map(f => fs.readFileSync(f, 'utf8')).join('\n;\n');
  vm.runInContext(src + epilogue, ctx, { filename: list.join('+') });
  return ctx;
}

let pass = 0, fail = 0;
const t = (n, ok, d) => { ok ? (pass++, console.log('  ok  ' + n)) : (fail++, console.log('  FAIL ' + n + (d ? ' -> ' + d : ''))); };

// ---- Аймаг ----
const a = loadInto(['js/aimags.js'], ['aimagsClean', 'aimags', 'wonderDetails']);
const A = a.aimagsClean, WD = a.wonderDetails;
t('aimagsClean loaded', Array.isArray(A) && A.length > 0, 'len=' + (A && A.length));

let wonders = 0, dates = 0, flagged = 0;
const misaligned = [];
A.forEach(x => {
  wonders += (x.wonders || []).length;
  dates += (x.dates || []).length;
  const det = WD[String(x.id)];
  if (det) {
    if (det.length !== (x.wonders || []).length) {
      misaligned.push(x.name + ': ' + det.length + ' details vs ' + (x.wonders || []).length + ' wonders');
    }
    det.forEach(d => { if (d && d.needsVerification) flagged++; });
  }
});
t('wonderDetails index-aligned with wonders', misaligned.length === 0, misaligned.slice(0, 3).join(' | '));
const orphans = Object.keys(WD).filter(k => !A.some(x => String(x.id) === k));
t('no orphan wonderDetails keys', orphans.length === 0, orphans.join(','));
t('every aimag has a name and id', A.every(x => x.name && x.id !== undefined));
t('flagged wonders hide their map', A.every(x => {
  const det = WD[String(x.id)] || [];
  return det.every(d => !d || !d.needsVerification || !d.mapQuery);
}));
console.log('  ..  totals: ' + A.length + ' aimags, ' + wonders + ' wonders, ' + dates + ' date ideas, ' + flagged + ' flagged');

// ---- УБ санаанууд ----
const u = loadInto(['js/core.js', 'js/ub.js'], ['allUbIdeas', 'ubIdeaTemplates']);
const U = u.allUbIdeas;
t('allUbIdeas built', U.length === 365, 'len=' + U.length);
t('no fabricated like counts', U.every(i => i.likes === undefined));
t('every idea has a title', U.every(i => i.title && i.title.length > 2));
t('every idea has a numeric price', U.every(i => typeof i.price === 'number'));
t('every idea has a unique id', new Set(U.map(i => i.id)).size === U.length);
t('every idea has a season', U.every(i => ['winter', 'spring', 'summer', 'autumn'].includes(i.season)));

console.log('\ndata: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
