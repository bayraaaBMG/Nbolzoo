function updateHeroStats() {
  const freeCount = allUbIdeas.filter(i => i.price === 0).length;
  const statNums = document.querySelectorAll(".hero-stat-num");
  if(statNums[0]) statNums[0].textContent = allUbIdeas.length + (aimagsClean.length * 9);
  if(statNums[1]) statNums[1].textContent = allUbIdeas.length;
  if(statNums[2]) statNums[2].textContent = aimagsClean.length;
  if(statNums[3]) statNums[3].textContent = aimagsClean.length * 9;
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
