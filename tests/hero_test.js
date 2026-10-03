// Hero carousel + quick chips нь БОДИТ dataset дээр зөв render хийгдэж байгаа эсэх.
// Бодит эвдрэл нь CSS-ээс үүдсэн байсан (service worker хуучин style.css өгдөг
// байв) — гэхдээ markup өөрөө зөв гэдгийг энд тогтмол шалгана.
const fs=require('fs'),vm=require('vm');
// Хамгийн энгийн DOM dummy — зөвхөн innerHTML-ийг барина
function el(id){ const e={id,_html:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains:()=>false},
  set innerHTML(v){this._html=v;},get innerHTML(){return this._html;},
  querySelectorAll:()=>[],querySelector:()=>null,scrollIntoView(){},appendChild(){},setAttribute(){},addEventListener(){}};return e;}
const nodes={};
const doc={getElementById(id){ if(!nodes[id])nodes[id]=el(id); return nodes[id];},
  querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>el('x'),createTextNode:()=>({}),addEventListener(){},documentElement:el('html'),body:el('body')};
const ctx={console:{log(){},warn(){}},document:doc,Math,Date,JSON,Set,Map,URLSearchParams,encodeURIComponent,decodeURIComponent,
  location:{search:'',pathname:'/index.html'},history:{replaceState(){}},setTimeout,setInterval:()=>0,clearInterval(){},
  navigator:{userAgent:'node'},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},CSS:{escape:x=>x},
  matchMedia:()=>({matches:false}),innerWidth:1440,
  firebase:{firestore:Object.assign(()=>({}),{FieldValue:{}})},db:null};
ctx.window=ctx;ctx.addEventListener=()=>{};
vm.createContext(ctx);
const files=[...fs.readFileSync('index.html','utf8').matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map(m=>m[1]);
vm.runInContext(files.map(f=>fs.readFileSync(f,'utf8')).join('\n;\n'),ctx,{filename:'index'});
vm.runInContext('renderHeroCarousel(); renderHeroQuickChips(); updateHeroStats();',ctx);

const slides=nodes['heroSlides']?nodes['heroSlides']._html:'';
const dots=nodes['heroDots']?nodes['heroDots']._html:'';
const chips=nodes['heroQuickChips']?nodes['heroQuickChips']._html:'';
let pass=0,fail=0;
const t=(n,ok,d)=>{ok?(pass++,console.log('  ok  '+n)):(fail++,console.log('  FAIL '+n+(d?' -> '+d:'')));};
t('carousel rendered slides',(slides.match(/class="hero-slide[ "]/g)||[]).length>=3,(slides.match(/class="hero-slide[ "]/g)||[]).length+' slides');
t('exactly one slide starts active',(slides.match(/hero-slide on"/g)||[]).length===1,(slides.match(/hero-slide on"/g)||[]).length+'');
t('each slide has a tag label',(slides.match(/hero-slide-tag/g)||[]).length>=3);
t('each slide has a title',(slides.match(/<h3>/g)||[]).length>=3);
t('slide media box is present',(slides.match(/hero-slide-media/g)||[]).length>=3);
t('dots match slide count',(dots.match(/hero-dot/g)||[]).length===(slides.match(/class="hero-slide[ "]/g)||[]).length);
t('quick chips rendered',(chips.match(/hero-chip/g)||[]).length===4,(chips.match(/hero-chip/g)||[]).length+' chips');
t('chips link to real filters',/ub\.html\?season=/.test(chips)&&/aimags\.html/.test(chips));
t('no money chip remains',!/budget|Үнэгүй|₮/.test(chips));
t('no price shown on carousel slides',!/card-price|₮/.test(slides));
t('no NaN / undefined in output',!/undefined|NaN/.test(slides+chips),(slides+chips).match(/undefined|NaN/g)||'');
// --- CSS тал: зохион байгуулалтын гол дүрмүүд бодитоор байгаа эсэх ---
// Markup зөв ч CSS дутвал слайдууд бүтэн өргөнтэй өнгөт зурвас болж өрөгдөнө —
// яг тэр эвдрэл production дээр тохиолдсон (service worker хуучин CSS өгсөн).
const css = fs.readFileSync('css/style.css', 'utf8');
t('hero uses a 2-column grid', /\.hero-grid \{[^}]*grid-template-columns: minmax/.test(css));
t('inactive slides are hidden', /\.hero-slide \{[\s\S]{0,140}opacity: 0/.test(css));
t('active slide is in flow', /\.hero-slide\.on \{[^}]*position: relative/.test(css));
t('carousel clips its contents', /\.hero-carousel \{[\s\S]{0,140}overflow: hidden/.test(css));
t('slide media has a fixed height', /\.hero-slide-media \{[^}]*height: \d+px/.test(css));
t('hero has no full-width gradient', /\.hero \{[\s\S]{0,140}background: none/.test(css));
t('hero collapses to 1 column under 900px', /@media \(max-width: 900px\)[\s\S]{0,300}\.hero-grid \{ grid-template-columns: 1fr/.test(css));
t('mobile shows only the active slide', /@media \(max-width: 900px\)[\s\S]{0,460}\.hero-slide \{[^}]*display: none/.test(css));

console.log('\nhero: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
