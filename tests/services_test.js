// Нийтийн болон admin талын ангиллын жагсаалт ЗӨРӨХГҮЙ байх ёстой — зөрвөл
// admin дээр түүхий id ("cafe") харагдана, эсвэл сонгосон ангилал нь нийтийн
// шүүлтүүрт огт гарахгүй.
const fs = require('fs'), vm = require('vm');
let pass = 0, fail = 0;
const t = (n, ok, d) => { ok ? (pass++, console.log('  ok  ' + n)) : (fail++, console.log('  FAIL ' + n + (d ? ' -> ' + d : ''))); };

function grab(file, name) {
  const ctx = { console: { log() {}, warn() {} }, document: { getElementById: () => null, querySelectorAll: () => [] }, Math, Date, JSON, Set, Map };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(file, 'utf8') + '\n;this.' + name + ' = ' + name + ';', ctx, { filename: file });
  return ctx[name];
}
const pub = grab('js/services.js', 'SERVICE_CATS');
const adm = grab('js/admin-services.js', 'SERVICE_CATEGORIES');

t('public category list is non-empty', pub.length > 0, 'len=' + pub.length);
t('admin and public have the same count', pub.length === adm.length, pub.length + ' vs ' + adm.length);
t('ids match in order', JSON.stringify(pub.map(c => c.id)) === JSON.stringify(adm.map(c => c.id)),
  pub.map(c => c.id).join(',') + ' vs ' + adm.map(c => c.id).join(','));
t('labels match', pub.every((c, i) => c.label === adm[i].label),
  pub.filter((c, i) => c.label !== adm[i].label).map(c => c.id).join(','));
t('every category has an emoji', pub.every(c => !!c.emoji));
t('ids are unique', new Set(pub.map(c => c.id)).size === pub.length);

// Бүх шаардсан ангилал байгаа эсэх
['restaurant', 'cafe', 'flower', 'gift', 'photo', 'video', 'event', 'stay', 'activity', 'handmade', 'other'].forEach(id => {
  t('has category: ' + id, pub.some(c => c.id === id));
});

// Маягтын талбар бүр submit дээр хадгалагдаж байгаа эсэх
const src = fs.readFileSync('js/services.js', 'utf8');
['svcName', 'svcCat', 'svcDesc', 'svcPrice', 'svcHours', 'svcDistrict', 'svcAddress', 'svcPhone', 'svcWeb', 'svcSocial', 'svcImg'].forEach(f => {
  t(f + ' exists in the form', src.includes('id="' + f + '"'));
});
['price', 'hours', 'district', 'address', 'phone', 'website', 'social', 'imageUrl'].forEach(f => {
  // String.raw — эс бөгөөс '\b' нь regex-ийн үгийн хил биш, backspace тэмдэгт болно.
  const re = new RegExp(String.raw`\b` + f + String.raw`\b\s*[,:]`);
  t(f + ' is persisted on submit', re.test(src.slice(src.indexOf('collection("services").add'))));
});
t('status is forced to pending on submit', /status:\s*"pending"/.test(src));
t('external URLs are scheme-checked', /\^https\?:/.test(src));

console.log('\nservices: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
