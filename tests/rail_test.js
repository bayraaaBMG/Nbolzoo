// Rail (← → алхам алхмаар үзэх). Хамгийн чухал зарчим: ДАРААЛЛЫГ ӨӨРЧЛӨХГҮЙ.
// Хэрэглэгч "Do not invent a new sort — use the existing display order" гэж
// тусгайлан хэлсэн тул үүнийг автоматаар шалгана.
const fs = require('fs'), vm = require('vm');
let pass = 0, fail = 0;
const t = (n, ok, d) => { ok ? (pass++, console.log('  ok  ' + n)) : (fail++, console.log('  FAIL ' + n + (d ? ' -> ' + d : ''))); };

const rail = fs.readFileSync('js/rail.js', 'utf8');
const css = fs.readFileSync('css/style.css', 'utf8');
const home = fs.readFileSync('index.html', 'utf8');
const ub = fs.readFileSync('js/ub.js', 'utf8');

// --- 1. Дарааллыг хөндөхгүй ---
t('rail never sorts', !/\.sort\(/.test(rail));
t('rail never reverses', !/\.reverse\(/.test(rail));
t('rail never filters the list', !/\.filter\(/.test(rail));
t('rail only scrolls, never re-renders cards', !/innerHTML\s*=\s*[^;]*renderCard/.test(rail));

// --- 2. Хоосон/багтсан тохиолдолд удирдлага гарахгүй ---
t('no controls when nothing to scroll', /scrollWidth <= track\.clientWidth/.test(rail));
t('bails out on an empty list', /if \(!cards\) return/.test(rail));

// --- 3. Төгсгөлд давтана (loop) ---
t('next loops to the start', /dir > 0 && track\.scrollLeft >= max - 4\) target = 0/.test(rail));
t('prev loops to the end', /dir < 0 && track\.scrollLeft <= 4\) target = max/.test(rail));

// --- 4. Тоолуур ---
t('counter exists', /rail-count/.test(rail));
t('counter is announced to screen readers', /aria-live="polite"/.test(rail));
t('counter never exceeds the total', /Math\.min\(i \+ perView, total\)/.test(rail));

// --- 5. Гарын товчлуур ---
t('arrow keys are handled', /ArrowLeft[\s\S]{0,60}ArrowRight|ArrowRight[\s\S]{0,60}ArrowLeft/.test(rail));
t('typing is never hijacked', /tagName === "INPUT"[\s\S]{0,80}TEXTAREA/.test(rail));
t('contentEditable is respected', /isContentEditable/.test(rail));

// --- 6. Хүртээмж ---
t('prev button has a label', /aria-label="Өмнөх"/.test(rail));
t('next button has a label', /aria-label="Дараах"/.test(rail));
t('arrow glyphs are hidden from screen readers', /<span aria-hidden="true">‹/.test(rail));
t('reduced motion disables smooth scroll', /nbRailReduceMotion\(\) \? "auto" : "smooth"/.test(rail));

// --- 7. Дахин барихад давхардахгүй ---
t('rebuild removes old controls', /\.rail-controls[\s\S]{0,120}remove\(\)/.test(rail));
t('rebuild unwraps the previous wrapper', /replaceWith\(track\)/.test(rail));

// --- 8. CSS ---
t('rail track scrolls horizontally', /\.rail-track \{[\s\S]{0,200}overflow-x: auto/.test(css));
t('rail snaps to cards', /scroll-snap-type: x mandatory/.test(css));
t('cards have a fixed rail width', /\.rail-track > \* \{[\s\S]{0,120}flex: 0 0/.test(css));
t('scrollbar is hidden', /\.rail-track::-webkit-scrollbar \{ display: none/.test(css));
t('touch targets are 44px on phones', /@media \(max-width: 560px\)[\s\S]{0,700}\.rail-btn \{ width: 44px; height: 44px/.test(css));
t('next card peeks on phones to hint scrolling', /@media \(max-width: 560px\)[\s\S]{0,600}flex-basis: 78%/.test(css));

// --- 9. Нүүр хуудсанд холбогдсон эсэх ---
t('rail.js is loaded on the homepage', home.includes('js/rail.js'));
t('rails are built after render', /nbRailAll\(\["featuredGrid", "moodGrid", "editorialGrid", "featuredAimags"\]\)/.test(home));
t('mood filter rebuilds its rail', /nbRail\("moodGrid"\)/.test(fs.readFileSync('js/home.js', 'utf8')));

// --- 10. ub.html: хуудаслалт нь мөн давтана + гарын товчлуур ---
t('ub paging loops at both ends', /if \(p < 1\) p = total;[\s\S]{0,60}p > total\) p = 1/.test(ub));
t('ub shows a page counter', /pagination-count/.test(ub));
t('ub supports arrow keys', /ArrowLeft[\s\S]{0,400}changeUbPage/.test(ub));
t('ub arrows ignore the open modal', /modal\.classList\.contains\("show"\)\) return/.test(ub));
t('ub arrows ignore text fields', /tagName === "INPUT"[\s\S]{0,80}TEXTAREA/.test(ub));

// --- 11. Бодит ажиллагаа: дараалал хадгалагдаж байгаа эсэх ---
// rail нь зөвхөн scroll хийдэг тул DOM-ийн дараалал render-ийнхтэй ижил үлдэнэ.
const ctx = { console: { log() {}, warn() {} }, Math, Date, requestAnimationFrame: fn => fn(),
  window: { matchMedia: () => ({ matches: false }), addEventListener() {} },
  getComputedStyle: () => ({ columnGap: '18px', gap: '18px' }) };
let built = null;
const makeEl = (tag) => ({
  tagName: (tag || 'div').toUpperCase(), className: '', _html: '', children: [], style: {},
  classList: { add() {}, remove() {}, contains: () => false },
  set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html; },
  appendChild(c) { this.children.push(c); built = this; },
  insertBefore() {}, replaceWith() {}, remove() {},
  closest: () => null, querySelector: () => makeEl('button'), querySelectorAll: () => [],
  addEventListener() {}, getBoundingClientRect: () => ({ width: 244 }),
  scrollLeft: 0, scrollWidth: 2000, clientWidth: 1000, scrollTo() {},
  parentNode: { insertBefore() {} }, parentElement: null, firstElementChild: null,
});
ctx.document = { getElementById: () => null, createElement: makeEl, addEventListener() {} };
ctx.window.document = ctx.document;
vm.createContext(ctx);
vm.runInContext(rail + '\n;this.nbRailStep=nbRailStep;this.nbRailPerView=nbRailPerView;this.nbRailIndex=nbRailIndex;', ctx);
const fake = makeEl('div');
fake.firstElementChild = { getBoundingClientRect: () => ({ width: 244 }) };
t('step = card width + gap', ctx.nbRailStep(fake) === 262, ctx.nbRailStep(fake) + '');
t('per-view is computed from width', ctx.nbRailPerView(fake) === 4, ctx.nbRailPerView(fake) + '');
fake.scrollLeft = 524;
t('index follows scroll position', ctx.nbRailIndex(fake) === 2, ctx.nbRailIndex(fake) + '');
t('nbRail handles a missing element', (() => { try { ctx.nbRail && ctx.nbRail('nope'); return true; } catch (e) { return false; } })());

console.log('\nrail: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
