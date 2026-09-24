// XSS regression: хэрэглэгчийн оруулсан текст шинэ render зам бүрээр дамжихдаа
// escape хийгдэж байгааг шалгана. Шинэ гадаргуу (services, CMS, admin) нь хуучин
// хамгаалалтыг эвдээгүй эсэхийг барих зорилготой.
const fs = require('fs'), vm = require('vm');

// escapeHtml нь browser-ийн DOM-ийг ашигладаг тул түүний зан үйлийг ЯГ хуулбарлана:
// text node -> innerHTML нь &, <, > -г escape хийдэг ч " болон ' -г ХИЙДЭГГҮЙ.
// (escapeHtml өөрөө дараа нь тэр хоёрыг гараар нэмж escape хийдэг — үүнийг шалгаж байна.)
const fakeDocument = {
  createElement() {
    let raw = "";
    return {
      set textContent(v) { raw = v; },
      get textContent() { return raw; },
      get innerHTML() { return raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); },
    };
  },
};
const ctx = { console: { log(){}, warn(){}, error(){} }, document: fakeDocument };
vm.createContext(ctx);
// escapeHtml js/core.js дотор — зөвхөн тэр функцийг гаргаж авна.
const core = fs.readFileSync('js/core.js', 'utf8');
const m = core.match(/function escapeHtml[\s\S]*?\n}/);
if (!m) { console.log('FAIL: escapeHtml not found in js/core.js'); process.exit(1); }
vm.runInContext(m[0], ctx);
const esc = ctx.escapeHtml;

let pass = 0, fail = 0;
function t(name, ok, detail) {
  if (ok) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? ' -> ' + detail : '')); }
}

const PAYLOADS = [
  '<script>alert(1)</script>',
  '"><img src=x onerror=alert(1)>',
  "'><svg onload=alert(1)>",
  '<iframe src="javascript:alert(1)">',
  '</textarea><script>alert(1)</script>',
  '`${alert(1)}`',
  '<a href="javascript:alert(1)">x</a>',
];

// 1. escapeHtml нь HTML-ийг задлах чадвартай бүх тэмдэгтийг саармагжуулна
PAYLOADS.forEach((p, i) => {
  const out = esc(p);
  t('payload ' + (i + 1) + ' neutralised', !/[<>"']/.test(out), JSON.stringify(out).slice(0, 70));
});

// 2. Шинэ render замууд бүгд escapeHtml ашиглаж байна уу — эх кодоор шалгана.
// Хэрэглэгчийн өгөгдлийг template literal дотор escapeHtml-гүй тавьсан газрыг хайна.
const NEW_FILES = ['js/services.js', 'js/admin-services.js', 'js/admin-cms.js', 'js/admin-settings.js', 'js/admin.js', 'js/site-settings.js'];
// Хэрэглэгч/бизнес өөрөө бичдэг, тиймээс итгэж болохгүй талбарууд
const UNTRUSTED = ['name', 'desc', 'title', 'phone', 'website', 'address', 'district',
                   'reviewNote', 'submittedByName', 'authorName', 'content', 'text',
                   'email', 'actorName', 'extra', 'targetUrl', 'imageUrl'];

NEW_FILES.forEach(f => {
  const src = fs.readFileSync(f, 'utf8');
  const bad = [];
  // ${ ... } дотор escapeHtml-гүйгээр untrusted талбар шууд орсон эсэх
  const re = /\$\{([^}]{0,160})\}/g;
  let mm;
  while ((mm = re.exec(src))) {
    const expr = mm[1];
    if (expr.includes('escapeHtml') || expr.includes('encodeURIComponent')) continue;
    // Зөвхөн тоо/логик/дотоод хувьсагч бол алгасна
    const hit = UNTRUSTED.find(k => new RegExp('\\.' + k + '\\b').test(expr));
    if (hit) bad.push(hit + ' in: ' + expr.trim().slice(0, 70));
  }
  t(f + ' escapes untrusted fields', bad.length === 0, bad.slice(0, 3).join(' | '));
});

// 3. Хуучин хамгаалалт хэвээр — community/comment render
['js/community.js', 'js/core.js'].forEach(f => {
  const src = fs.readFileSync(f, 'utf8');
  t(f + ' still calls escapeHtml', /escapeHtml\(/.test(src));
});

// 4. Storage-д бичигдсэн URL нь href болж гарахдаа схемээ шалгуулдаг эсэх
const svc = fs.readFileSync('js/services.js', 'utf8');
t('services.js validates website scheme', /\^\\?\/?\(\?:\)?|\^https\?:/.test(svc) || /https\?:\\\/\\\//.test(svc));

console.log('\nxss: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
