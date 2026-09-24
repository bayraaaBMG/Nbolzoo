// Хуудас бүрийн script гинжийг HTML-ээс уншаад дарааллаар нь нэг sandbox дотор
// ажиллуулж, бодит browser дээр гарах "X is not defined" төрлийн алдааг барина.
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = process.argv[2] || '.';

function stubEl() {
  const el = {
    style: { setProperty(){}, removeProperty(){}, display: '' },
    classList: { add(){}, remove(){}, toggle(){}, contains(){return false;} },
    dataset: {}, children: [], childNodes: [], files: [], value: '', checked: false,
    innerHTML: '', textContent: '', scrollIntoView(){}, remove(){},
    appendChild(){}, addEventListener(){}, removeAttribute(){}, setAttribute(){},
    querySelector(){ return stubEl(); }, querySelectorAll(){ return []; },
    getContext(){ return { drawImage(){} }; }, toBlob(){}, focus(){}, click(){},
  };
  el.parentElement = null;
  return el;
}
const doc = {
  getElementById(){ return stubEl(); },
  querySelector(){ return stubEl(); },
  querySelectorAll(){ return []; },
  createElement(){ return stubEl(); },
  createTextNode(){ return {}; },
  addEventListener(){}, documentElement: stubEl(), body: stubEl(),
  readyState: 'complete',
};
const fv = { serverTimestamp:()=>({}), increment:()=>({}), arrayUnion:()=>({}), arrayRemove:()=>({}), delete:()=>({}) };
function q(){ const o={ where(){return o;}, orderBy(){return o;}, limit(){return o;},
  get:()=>Promise.resolve({empty:true,docs:[],exists:false,data:()=>({count:0})}),
  count(){return o;}, add:()=>Promise.resolve({id:'x'}), set:()=>Promise.resolve(),
  update:()=>Promise.resolve(), delete:()=>Promise.resolve(), doc(){return o;},
  collection(){return o;}, onSnapshot(){return ()=>{};} }; return o; }

const pages = fs.readdirSync(root).filter(f => f.endsWith('.html'));
let fail = 0;
for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  const srcs = [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map(m => m[1]);
  const ctx = {
    console: { log(){}, warn(){}, error(){} },
    document: doc, window: {}, location: { search: '', href: '', pathname: '/' + page },
    navigator: { userAgent: 'node', serviceWorker: { register(){ return Promise.resolve(); } } },
    localStorage: { getItem:()=>null, setItem(){}, removeItem(){} },
    setTimeout, clearTimeout, setInterval, clearInterval, Promise, Date, Math, JSON,
    URLSearchParams, Set, Map, Intl, encodeURIComponent, decodeURIComponent, CSS: { escape: s => s },
    history: { replaceState(){}, pushState(){} },
    firebase: { initializeApp(){ return {}; }, firestore: Object.assign(()=>q(), { FieldValue: fv }),
      auth: () => ({ onAuthStateChanged(){}, currentUser: null }),
      storage: () => ({ ref: () => ({ put:()=>Promise.resolve(), getDownloadURL:()=>Promise.resolve('') }) }),
      analytics: () => ({ logEvent(){} }) },
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    addEventListener(){}, removeEventListener(){}, scrollTo(){}, scrollY: 0,
    matchMedia: () => ({ matches: false, addEventListener(){}, addListener(){} }),
    innerWidth: 1280, innerHeight: 800, alert(){}, confirm:()=>true, prompt:()=>'',
  };
  ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
  vm.createContext(ctx);
  // ЧУХАЛ: бүх script-ийг НЭГ vm script болгон нийлүүлж ажиллуулна. Тусад нь
  // runInContext хийвэл файл бүрийн top-level `const/let` нь өөрийн lexical scope-д
  // үлдэж, дараагийн файлаас харагдахгүй — тэгвэл browser дээр гарах "X is not defined"
  // төрлийн бодит алдааг энэ тест барихгүй өнгөрөөнө. Browser нь classic script-үүдийг
  // нэг global lexical scope дээр ажиллуулдаг тул нийлүүлэх нь бодит байдалд ойр.
  let ok = true, err = null, loaded = 0;
  const parts = [];
  for (const src of srcs) {
    const p = path.join(root, src);
    if (!fs.existsSync(p)) { ok = false; err = 'MISSING FILE ' + src; break; }
    parts.push('//### ' + src + '\n' + fs.readFileSync(p, 'utf8'));
    loaded++;
  }
  if (ok) {
    try { vm.runInContext(parts.join('\n;\n'), ctx, { filename: page }); }
    catch (e) {
      ok = false;
      // Алдаа аль файлд гарсныг ойролцоогоор заана.
      err = e.message;
    }
  }
  if (ok) console.log('  ok  ' + page + ' (' + loaded + ' scripts)');
  else { fail++; console.log('  FAIL ' + page + ': ' + err); }
}
console.log('\npages: ' + (pages.length - fail) + '/' + pages.length + ' loaded clean');
process.exit(fail ? 1 : 0);
