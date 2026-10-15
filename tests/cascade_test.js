// CSS-ийн КАСКАД шалгалт.
//
// Яагаад: `.header-search-btn { display: none }` дүрэм media query дотор
// бичигдсэн ч, файлын ДООД талд `.btn { display: inline-flex }` байсан тул
// товч хэзээ ч нуугддаггүй байв. Media query нь тусгайлалт НЭМДЭГГҮЙ, ижил
// тусгайлалттай үед СҮҮЛД бичигдсэн нь ялдаг.
//
// Өмнөх тестүүд дүрэм БАЙГАА эсэхийг л шалгадаг байсан тул үүнийг алгассан.
// Энэ багц нь дүрэм ЯЛЖ байгаа эсэхийг шалгана.
const fs = require('fs');
let pass = 0, fail = 0;
const t = (n, ok, d) => { ok ? (pass++, console.log('  ok  ' + n)) : (fail++, console.log('  FAIL ' + n + (d ? ' -> ' + d : ''))); };

const css = fs.readFileSync('css/style.css', 'utf8').replace(/\r\n/g, '\n');

// Тусгайлалт: (id, class/attr/pseudo-class, element)
function specificity(sel) {
  const s = sel.trim();
  const id = (s.match(/#[\w-]+/g) || []).length;
  const cls = (s.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[a-z-]+/g) || []).length;
  const el = (s.match(/(?:^|[\s>+~])[a-z]+[\w-]*/g) || []).length;
  return id * 10000 + cls * 100 + el;
}

// Тайлбарыг хасаад, бүх дүрмийг (сонгогч, their declarations, байрлал) цуглуулна.
const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
// Дүрэм бүр @media дотор уу, гаднаа юу гэдгийг тэмдэглэнэ — энэ нь каскадын
// гол хүчин зүйл: media query ДОТОРХ дүрэм нь түүнээс ХОЙШ бичигдсэн,
// media-гүй (бүх өргөнд үйлчлэх) дүрэмд ижил тусгайлалттай үед дардаг.
const rules = [];
{
  let depth = 0, mediaDepth = null, i = 0;
  const reAt = /@media[^{]*\{/g;
  // Энгийн скан: @media нээлтийг тэмдэглээд, хаалтыг нь тоолно
  let buf = '';
  for (i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch === '{') {
      const head = buf.trim();
      depth++;
      if (/^@media/.test(head)) { mediaDepth = depth; buf = ''; continue; }
      // Дүрмийн их бие
      let j = i + 1, d = 1;
      while (j < clean.length && d > 0) { if (clean[j] === '{') d++; else if (clean[j] === '}') d--; j++; }
      const body = clean.slice(i + 1, j - 1);
      if (head && !head.startsWith('@')) {
        head.split(',').forEach(one => {
          rules.push({ sel: one.trim(), body, at: i, inMedia: mediaDepth !== null });
        });
      }
      i = j - 1; depth--;
      buf = '';
      continue;
    }
    if (ch === '}') { depth--; if (mediaDepth !== null && depth < mediaDepth) mediaDepth = null; buf = ''; continue; }
    buf += ch;
  }
}
t('parsed a plausible number of rules', rules.length > 400, rules.length + '');

// Тухайн сонгогчид ямар property эцэст нь үйлчлэхийг тооцоолно.
function winnerFor(targetSelectors, prop) {
  let best = null;
  for (const r of rules) {
    if (!targetSelectors.includes(r.sel)) continue;
    const dm = new RegExp(prop + '\s*:\s*([^;}]+)').exec(r.body);
    if (!dm) continue;
    const important = /!important/.test(dm[1]);
    const sp = specificity(r.sel);
    const score = (important ? 1e9 : 0) + sp;
    // Ижил оноотой бол СҮҮЛД бичигдсэн нь ялна
    if (!best || score > best.score || (score === best.score && r.at > best.at)) {
      best = { score, at: r.at, sel: r.sel, value: dm[1].trim(), important };
    }
  }
  return best;
}

// --- Мобайл дээр нуугдах ёстой толгойн элементүүд ---
// Эдгээр нь .btn классыг мөн агуулдаг тул .btn-ийн display-тай өрсөлдөнө.
const CASES = [
  {
    what: 'Хайх button',
    selectors: ['.header-search .header-search-btn', '.header-search-btn', '.btn', '.btn-accent'],
    expectHiddenBy: '.header-search .header-search-btn',
  },
  {
    what: 'Гарах button',
    selectors: ['.nav-actions .header-logout', '.header-logout', '.btn', '.btn-ghost'],
    expectHiddenBy: '.nav-actions .header-logout',
  },
];
for (const c of CASES) {
  const w = winnerFor(c.selectors, 'display');
  t(c.what + ' is actually hidden (cascade winner)',
    w && w.value === 'none' && w.sel === c.expectHiddenBy,
    w ? `winner "${w.sel}" -> ${w.value}` : 'no display rule found');
}

// --- Ерөнхий урхи: display: none дүрэм нь дараа ирэх дүрэмд дарагдахгүй байх ---
// Нэг класстай `X { display: none }` бичээд, доор нь нэг класстай өөр дүрэм
// ижил элементэд display өгвөл чимээгүй эвдэрнэ.
// ЗӨВХӨН жинхэнэ урхийг шалгана: @media ДОТОРХ нуулт нь түүнээс ХОЙШ
// бичигдсэн, media-ГҮЙ (бүх өргөнд үйлчлэх) дүрэмд дарагдах тохиолдол.
//
// "Үндсэндээ нуугдсан, breakpoint дээр гарна" (top-level none -> media block)
// нь ЗӨВ хэв маяг тул үүнийг зөрчил гэж үзэхгүй.
const hides = rules.filter(r => r.inMedia && /display\s*:\s*none/.test(r.body));
const overridden = [];
for (const h of hides) {
  if (/!important/.test(h.body)) continue;
  const hSpec = specificity(h.sel);
  for (const r of rules) {
    if (r.inMedia) continue;                          // media-гүй дүрэм л аюултай
    if (r.at <= h.at) continue;                       // зөвхөн ДАРАА ирэхийг
    if (!/display\s*:/.test(r.body)) continue;
    if (/display\s*:\s*none/.test(r.body)) continue;
    // Сонгогч нь ижил эсвэл тухайн элементийг мөн барьж чадах эсэх:
    // энгийн тохиолдол — яг ижил, эсвэл нуултын сонгогчийн нэг хэсэг
    const same = r.sel === h.sel;
    const subset = h.sel.split(/\s+/).includes(r.sel);
    if (!same && !subset) continue;
    if (specificity(r.sel) >= hSpec) overridden.push(h.sel + ' <- ' + r.sel + ' (no media)');
  }
}
t('no media-query display:none is beaten by a later unconditional rule',
  overridden.length === 0, overridden.slice(0, 3).join(' | '));

// --- Мобайл нуулт бүр .btn-ээс ӨНДӨР тусгайлалттай байх ---
// .btn { display: inline-flex } нь файлын доор байдаг тул нэг класстай нуулт
// автоматаар алдана.
const btnSpec = specificity('.btn');
const weakHides = hides
  .filter(h => /header-|cat-|nav-actions|utility-/.test(h.sel))
  .filter(h => specificity(h.sel) <= btnSpec)
  .filter(h => {
    // .btn-тэй огт давхцахгүй элемент бол асуудалгүй
    const html = fs.readdirSync('.').filter(f => f.endsWith('.html'))
      .map(f => fs.readFileSync(f, 'utf8')).join('');
    const cls = (h.sel.match(/\.([\w-]+)/) || [])[1];
    if (!cls) return false;
    const rx = new RegExp('class="[^"]*\b' + cls + '\b[^"]*"', 'g');
    return (html.match(rx) || []).some(x => /\bbtn\b/.test(x));
  });
t('every header hide that targets a .btn outranks .btn',
  weakHides.length === 0, weakHides.map(h => h.sel).join(', '));

console.log('\ncascade: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
