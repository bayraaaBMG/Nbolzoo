// ===== НҮҮР ХУУДАС =====
// Banner-ийн логик нь js/banner.js дотор — бүх хуудсанд нийтлэг тул тусад нь гаргасан.

// Бүх тоог бодит dataset-ээс тооцно — HTML дотор ямар ч тоо hardcode хийгээгүй тул
// контент нэмэгдэх/хасагдахад UI автоматаар зөв тоо харуулна. Байрлалын индекс (statNums[0])
// биш data-stat нэрээр холбосон нь hero-гийн дараалал өөрчлөгдвөл ч эвдрэхгүй.
function updateHeroStats() {
  // aimag-тутамд яг 9 санаа байна гэж таамаглахгүй, бодит dates массивын уртыг нийлбэрлэнэ.
  const totalAimagIdeas = aimagsClean.reduce((sum, a) => sum + (a.dates ? a.dates.length : 0), 0);
  const stats = {
    total: allUbIdeas.length + totalAimagIdeas,
    ub: allUbIdeas.length,
    aimags: aimagsClean.length,
    aimagIdeas: totalAimagIdeas,
    // Үнэгүй санааны тоо — price === 0 гэсэн БОДИТ талбараас. Таамаглал биш.
    free: allUbIdeas.filter(i => i.price === 0).length,
  };
  document.querySelectorAll("[data-stat]").forEach(el => {
    const v = stats[el.dataset.stat];
    if (v !== undefined) el.textContent = v.toLocaleString("mn-MN");
  });
  const sub = document.getElementById("heroSubtitle");
  // Admin нүүр хуудсын тохиргоонд гараар бичвэр өгсөн бол түүнийг дарж бичихгүй
  // (js/site-settings.js нь dataset.locked тавьдаг).
  if (sub && sub.dataset.locked !== "1") {
    sub.textContent = `Улаанбаатарт ${stats.ub} санаа, ${stats.aimags} аймагт ${stats.aimagIdeas} санаа — нийт ${stats.total}`;
  }
}

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

// "Өнөөдрийн болзоо" - тухайн өдрийн дугаартай санааг эхэнд, ижил төрлийн
// саналуудыг араас нь харуулна (санамсаргүй бус, өдрийн огноон дээр суурилсан бодит сонголт).
function renderFeatured() {
  const dayOfYear = getDayOfYear();
  const todayIdea = allUbIdeas.find(i => i.day === dayOfYear) || allUbIdeas[0];
  const sameCategory = allUbIdeas.filter(i => i.id !== todayIdea.id && i.category === todayIdea.category);
  const rest = allUbIdeas.filter(i => i.id !== todayIdea.id && i.category !== todayIdea.category);
  const featured = [todayIdea, ...sameCategory, ...rest].slice(0, 8);
  document.getElementById("featuredGrid").innerHTML = featured.map(idea => renderCard(idea)).join("");
}

function renderFeaturedAimags() {
  const featured = aimagsClean.slice(0, 8);
  document.getElementById("featuredAimags").innerHTML = featured.map(renderAimagCard).join("");
}

function openRandomIdea() {
  const idea = allUbIdeas[Math.floor(Math.random() * allUbIdeas.length)];
  openIdeaModal(idea.id);
}

// "Төсвөөр хайх" - үнэгүй/бага/дунд/өндөр гэсэн 4 ангилал, тус бүрийн бодит тоогоор.
// UB 365 датаг ub.html?filter=... руу дамжуулж, тэнд шууд шүүнэ.
const BUDGET_TIERS = [
  {id: "free", emoji: "🆓", label: "Үнэгүй", test: p => p === 0},
  {id: "cheap", emoji: "💸", label: "Бага", sub: "≤50,000₮", test: p => p > 0 && p <= 50000},
  {id: "medium", emoji: "💳", label: "Дунд", sub: "≤150,000₮", test: p => p > 50000 && p <= 150000},
  {id: "expensive", emoji: "💎", label: "Өндөр", sub: ">150,000₮", test: p => p > 150000}
];
function renderBudgetSection() {
  const el = document.getElementById("budgetChips");
  if (!el) return;
  el.innerHTML = BUDGET_TIERS.map(t => {
    const count = allUbIdeas.filter(i => t.test(i.price)).length;
    return `<div class="filter-chip" onclick="location.href='ub.html?filter=${t.id}'">
      ${t.emoji} ${t.label}${t.sub ? ` <span style="opacity:.65">(${t.sub})</span>` : ""}
      · ${count} санаа
    </div>`;
  }).join("");
}

// "Мэдрэмжээр хайх" - санаа бүрийн бодит title/desc/feeling текстээс гаргасан mood-оор шүүнэ (js/ub.js).
let homeMoodFilter = MOODS[0].id;
function renderMoodSection() {
  const chipsEl = document.getElementById("moodChips");
  const gridEl = document.getElementById("moodGrid");
  if (!chipsEl || !gridEl) return;
  chipsEl.innerHTML = MOODS.map(m => {
    const count = allUbIdeas.filter(i => i.mood === m.id).length;
    return `<div class="filter-chip ${homeMoodFilter === m.id ? 'active' : ''}" onclick="selectHomeMood('${m.id}')">${m.emoji} ${m.label} <span style="opacity:.65">(${count})</span></div>`;
  }).join("");
  const matches = allUbIdeas.filter(i => i.mood === homeMoodFilter).slice(0, 4);
  gridEl.innerHTML = matches.map(idea => renderCard(idea)).join("");
  // Шүүлтүүр солигдоход жагсаалт өөрчлөгдсөн тул rail-ийг дахин барина
  // (тоолуур, товчнууд шинэ жагсаалтад тохирно).
  if (typeof nbRail === "function") nbRail("moodGrid");
}
function selectHomeMood(id) {
  homeMoodFilter = id;
  renderMoodSection();
}

// "Онцлох сонголт" - editorial pick, ямар нэг хуурамч like/тренд тоо биш,
// зөвхөн төрөл бүрээс нэг өвөрмөц санааг манай багийн сонголтоор жагсаана.
function renderEditorialPicks() {
  const el = document.getElementById("editorialGrid");
  if (!el) return;
  const seenCat = new Set();
  const picks = [];
  for (const idea of allUbIdeas) {
    if (!seenCat.has(idea.category) && picks.length < 6) {
      seenCat.add(idea.category);
      picks.push(idea);
    }
  }
  el.innerHTML = picks.map(idea => renderCard(idea)).join("");
}

function renderPromoSections() {
  const gamesInvite = document.getElementById("gamesInvitePromo");
  if (gamesInvite) {
    gamesInvite.innerHTML = `
      <div class="promo-card" onclick="navigate('games')">
        <span class="promo-card-emoji">🎮</span>
        <h3>Хосын тоглоом</h3>
        <p>Хамт тоглож, бие биенээ илүү таньж мэдэх богино тоглоомууд.</p>
        <button class="btn" type="button" onclick="event.stopPropagation();navigate('games')">Тоглох →</button>
      </div>
      <div class="promo-card alt" onclick="navigate('urilga')">
        <span class="promo-card-emoji">💌</span>
        <h3>Урилга илгээх</h3>
        <p>Болзооны санаагаа хайртай хүндээ өвөрмөц урилга болгож илгээ.</p>
        <button class="btn" type="button" onclick="event.stopPropagation();navigate('urilga')">Урилга үүсгэх →</button>
      </div>`;
  }
  const community = document.getElementById("communityPromo");
  if (community) {
    community.innerHTML = `
      <div class="promo-card wide" onclick="navigate('community')">
        <span class="promo-card-emoji">👥</span>
        <h3>Нийгэмлэгт нэгд</h3>
        <p>Бусад хосуудтай санаа, туршлагаа хуваалц, асуулт асуу, зөвлөгөө ав.</p>
        <button class="btn" type="button" onclick="event.stopPropagation();navigate('community')">Нийгэмлэг рүү орох →</button>
      </div>`;
  }
}

// ===== HERO CAROUSEL =====
// Слайд бүр нь БОДИТ контент рүү чиглэнэ. Зохиомол "хямдрал", "шинэ бүтээгдэхүүн",
// "онцгой санал" гэх мэт promo ОГТ байхгүй — слайдыг dataset-ээс өөрөөс нь бүтээнэ:
//   1. Өнөөдрийн санаа (жилийн өдрөөр)
//   2. Одоогийн улирлын санаа
//   3. Редакцын сонголт (home.js-ийн байгаа логик)
//   4. Санамсаргүй аймаг
// Ингэснээр слайд хэзээ ч хуучирахгүй, хэзээ ч худал биш.

let heroIdx = 0;
let heroTimer = null;

function currentSeason() {
  const m = new Date().getMonth(); // 0-11
  if (m <= 1 || m === 11) return "winter";
  if (m <= 4) return "spring";
  if (m <= 7) return "summer";
  return "autumn";
}

function heroBuildSlides() {
  if (typeof allUbIdeas === "undefined" || !allUbIdeas.length) return [];
  const slides = [];
  const season = currentSeason();

  const today = allUbIdeas[(getDayOfYear() - 1) % allUbIdeas.length];
  if (today) slides.push({ tag: "Өнөөдрийн санаа", idea: today });

  const seasonal = allUbIdeas.filter(i => i.season === season && i.id !== (today && today.id));
  if (seasonal.length) {
    slides.push({ tag: (SEASON_LABEL[season] || season) + "-ийн сонголт", idea: seasonal[getDayOfYear() % seasonal.length] });
  }

  // Үнэгүй санаа — хамгийн их хэрэгтэй шүүлт тул тусад нь онцолно.
  const free = allUbIdeas.filter(i => i.price === 0 && !slides.some(s => s.idea.id === i.id));
  if (free.length) slides.push({ tag: "Үнэгүй", idea: free[getDayOfYear() % free.length] });

  const rest = allUbIdeas.filter(i => !slides.some(s => s.idea.id === i.id));
  if (rest.length) slides.push({ tag: "Редакцын сонголт", idea: rest[(getDayOfYear() * 7) % rest.length] });

  return slides.slice(0, 4);
}

function renderHeroCarousel() {
  const wrap = document.getElementById("heroSlides");
  const dots = document.getElementById("heroDots");
  if (!wrap) return;
  const slides = heroBuildSlides();
  if (!slides.length) {
    // Dataset ачаалагдаагүй бол carousel-ийг бүхэлд нь нуух — хоосон хүрээ харуулахгүй.
    const c = document.getElementById("heroCarousel");
    if (c) c.style.display = "none";
    return;
  }

  wrap.innerHTML = slides.map((s, i) => {
    const img = getIdeaImg(s.idea.title, s.idea.category);
    return `<article class="hero-slide${i === 0 ? " on" : ""}" role="tabpanel" aria-label="${escapeHtml(s.tag)}">
      <div class="hero-slide-media${img ? "" : " media-fallback"}" style="background:${getColor(s.idea.id)}">
        ${img ? `<img src="${img.u}" alt="" loading="${i === 0 ? "eager" : "lazy"}" decoding="async" onerror="imgFallback(this)">` : ""}
        <span class="hero-slide-emoji">${s.idea.emoji}</span>
      </div>
      <div class="hero-slide-body">
        <span class="hero-slide-tag">${escapeHtml(s.tag)}</span>
        <h3>${escapeHtml(s.idea.title)}</h3>
        <p>${escapeHtml((s.idea.desc || "").slice(0, 90))}</p>
        <div class="hero-slide-meta">
          <span class="card-price">${escapeHtml(s.idea.priceText || "")}</span>
          <button class="btn btn-primary btn-sm" type="button" onclick="openIdeaModal(${s.idea.id})">Үзэх</button>
        </div>
      </div>
    </article>`;
  }).join("");

  if (dots) {
    dots.innerHTML = slides.map((s, i) =>
      `<button type="button" class="hero-dot${i === 0 ? " on" : ""}" role="tab" aria-selected="${i === 0}"
        aria-label="${escapeHtml(s.tag)}" onclick="heroGo(${i})"></button>`).join("");
  }
  heroIdx = 0;
  heroRestartTimer();
}

function heroGo(i) {
  const slides = document.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll(".hero-dot");
  if (!slides.length) return;
  heroIdx = (i + slides.length) % slides.length;
  slides.forEach((s, n) => s.classList.toggle("on", n === heroIdx));
  dots.forEach((d, n) => { d.classList.toggle("on", n === heroIdx); d.setAttribute("aria-selected", n === heroIdx); });
  heroRestartTimer();
}

function heroSlide(dir) { heroGo(heroIdx + dir); }

// Автомат эргэлт. Хэрэглэгч гараар сольсон бол тоолуурыг шинэчилнэ — эс бөгөөс
// дарсны дараа шууд өөр слайд руу "үсэрч" эвгүй болно.
// prefers-reduced-motion тохируулсан хүнд автомат эргэлт ОГТ ажиллахгүй.
function heroRestartTimer() {
  if (heroTimer) clearInterval(heroTimer);
  try {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  } catch (e) { /* matchMedia байхгүй орчин — автомат эргэлтийг оруулахгүй */ return; }
  heroTimer = setInterval(() => heroGo(heroIdx + 1), 6500);
}

// ===== HERO QUICK FILTER CHIPS =====
// Шүүлтүүр бүр ub.html дээр БОДИТООР ажилладаг параметр рүү чиглэнэ.
function renderHeroQuickChips() {
  const el = document.getElementById("heroQuickChips");
  if (!el || typeof allUbIdeas === "undefined") return;
  const season = currentSeason();
  const chips = [
    ["Үнэгүй", "ub.html?budget=free"],
    [SEASON_LABEL[season] || season, "ub.html?season=" + season],
    ["Кафе", "ub.html?category=" + encodeURIComponent("кафе")],
    ["Гадаа", "ub.html?category=" + encodeURIComponent("парк")],
    ["21 аймаг", "aimags.html"],
  ];
  el.innerHTML = chips.map(([label, url]) =>
    `<a class="hero-chip" href="${url}">${escapeHtml(label)}</a>`).join("");
}
