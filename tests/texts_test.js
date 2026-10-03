// Хуудасны текстийн CMS. Хамгийн чухал зүйлс:
//   1. tag-texts.js нь ИДЕМПОТЕНТ (дахин ажиллуулахад юу ч нэмэгдэхгүй)
//   2. Лавлах (NB_TEXT_DEFAULTS) нь markup-тай ЯГ тохирно
//   3. Admin-ийн бичвэрээр HTML/script тарих боломжгүй
//   4. Header/footer хоёр дахин тэмдэглэгдээгүй (өөр механизмтай)
const fs = require('fs'), cp = require('child_process'), vm = require('vm');
let pass = 0, fail = 0;
const t = (n, ok, d) => { ok ? (pass++, console.log('  ok  ' + n)) : (fail++, console.log('  FAIL ' + n + (d ? ' -> ' + d : ''))); };

const pages = fs.readdirSync('.').filter(f => f.endsWith('.html'));

// --- 1. Идемпотент эсэх (файл бичихгүйгээр шалгах арга байхгүй тул
//        өмнө/дараа харьцуулна, дараа нь юу ч өөрчлөгдөөгүй байх ёстой) ---
const before = pages.map(p => fs.readFileSync(p, 'utf8'));
const defBefore = fs.readFileSync('js/text-defaults.js', 'utf8');
cp.execFileSync(process.execPath, ['tools/tag-texts.js'], { stdio: 'pipe' });
const changed = pages.filter((p, i) => fs.readFileSync(p, 'utf8') !== before[i]);
t('tag-texts is idempotent', changed.length === 0,
  changed.join(',') + ' — "node tools/tag-texts.js" ажиллуулаад commit хийнэ үү');
t('registry is stable', fs.readFileSync('js/text-defaults.js', 'utf8') === defBefore);

// --- 2. Лавлах ↔ markup тохирол ---
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('js/text-defaults.js', 'utf8') + '\n;this.D=NB_TEXT_DEFAULTS;', ctx);
const D = ctx.D;
t('registry is non-empty', Object.keys(D).length > 100, Object.keys(D).length + ' keys');

const inMarkup = new Set();
for (const p of pages) {
  for (const m of fs.readFileSync(p, 'utf8').matchAll(/data-text="([^"]+)"/g)) inMarkup.add(m[1]);
}
const notInRegistry = [...inMarkup].filter(k => !(k in D));
t('every tagged node is in the registry', notInRegistry.length === 0, notInRegistry.slice(0, 5).join(','));
const notInMarkup = Object.keys(D).filter(k => !inMarkup.has(k));
t('every registry key exists in markup', notInMarkup.length === 0, notInMarkup.slice(0, 5).join(','));

// --- 3. Түлхүүрийн хэлбэр: <хуудас>.<8 hex> ---
const badKeys = Object.keys(D).filter(k => !/^[a-z]+\.[a-f0-9]{8}$/.test(k));
t('all keys are <page>.<hash8>', badKeys.length === 0, badKeys.slice(0, 3).join(','));
// Хэш нь БИЧВЭРЭЭС гарсан байх ёстой — индекс биш (дараалал солиход зөрөхгүй)
const crypto = require('crypto');
const mismatched = Object.entries(D).filter(([k, v]) =>
  k.split('.')[1] !== crypto.createHash('sha1').update(v).digest('hex').slice(0, 8));
t('every key is the hash of its own default text', mismatched.length === 0,
  mismatched.slice(0, 3).map(x => x[0]).join(','));

// --- 4. Header/footer давхар тэмдэглэгдээгүй ---
for (const p of pages) {
  const h = fs.readFileSync(p, 'utf8');
  const a = h.indexOf('NB:HEADER:START'), b = h.indexOf('NB:HEADER:END');
  const hdr = a >= 0 ? h.slice(a, b) : '';
  t(p + ': header has no data-text', !hdr.includes('data-text'));
  const f = h.indexOf('<footer class="footer">');
  const ftr = f >= 0 ? h.slice(f) : '';
  t(p + ': footer has no data-text', !ftr.includes('data-text'));
}

// --- 5. Хэрэглэх тал: HTML тарих боломжгүй ---
const ss = fs.readFileSync('js/site-settings.js', 'utf8');
const block = ss.slice(ss.indexOf('function applyPageTexts'));
t('applyPageTexts uses textContent, not innerHTML', block.includes('textContent') && !block.includes('innerHTML'));
t('applyPageTexts skips nodes containing elements', /el\.children\.length/.test(block));
t('applyPageTexts is wrapped in try/catch', /catch \(e\)/.test(block));
t('applyPageTexts ignores non-strings', /typeof v !== "string"/.test(block));
t('pageTexts is read in applySiteSettings', /doc\("pageTexts"\)/.test(ss));

// --- 6. Admin тал ---
const at = fs.readFileSync('js/admin-texts.js', 'utf8');
t('admin texts escapes the default text', /escapeHtml\(def\)/.test(at));
t('admin texts escapes the current value', /escapeHtml\(cur \|\| ""\)/.test(at));
t('admin save is permission-gated', /nbCan\("settings\.homepage"\)/.test(at));
t('admin save deletes the override when blank', /FieldValue\.delete\(\)/.test(at));
t('admin surfaces orphaned overrides', /orphan/i.test(at));
t('admin texts is registered as a tab', /id: "texts"/.test(fs.readFileSync('js/admin.js', 'utf8')));
t('text-defaults loads only on admin.html',
  fs.readFileSync('admin.html', 'utf8').includes('js/text-defaults.js') &&
  pages.filter(p => p !== 'admin.html').every(p => !fs.readFileSync(p, 'utf8').includes('js/text-defaults.js')));

console.log('\ntexts: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
