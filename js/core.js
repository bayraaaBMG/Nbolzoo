let currentUbFilter = "all";
let currentRegion = "all";
let currentMovieFilter = "all";
let currentMovieCinemaTab = "all";
let currentMovieGenre = "all";
let currentMovieSort = "rating";
let currentMovieSearch = "";
let userLikes = new Set();
let userPostLikes = new Set();
let currentPage = 1;
const itemsPerPage = 12;
let currentAimagId = null;

const cardColors = ["#CAF0F8","#E8F4F8","#FAECE7","#E0E7FF","#FEF3C7","#D1FAE5","#FCE7F3","#E0F2FE"];
function getColor(id) { return cardColors[id % cardColors.length]; }

// ===== IMAGE DATABASE =====
const WK = "https://upload.wikimedia.org/wikipedia/commons/thumb/";
const US = "https://images.unsplash.com/photo-";
const IMG = {
  // Mongolia — Wikipedia Commons
  ub:       WK+"0/03/Jugder_001.jpg/500px-Jugder_001.jpg",
  khuvsgul: WK+"a/a9/Khuvsgul.jpg/500px-Khuvsgul.jpg",
  gobi:     WK+"7/79/Gobi_Desert.jpg/500px-Gobi_Desert.jpg",
  terelj:   WK+"b/b6/Gorkhi-Terelj_National_Park.jpg/500px-Gorkhi-Terelj_National_Park.jpg",
  bayanzag: WK+"d/d7/Flaming_cliffs_5.jpg/500px-Flaming_cliffs_5.jpg",
  orkhon:   WK+"6/63/Orchon-mongolei.JPG/500px-Orchon-mongolei.JPG",
  erdene:   WK+"4/4c/%C5%9Awi%C4%85tynia_Zachodnia_w_klasztorze_Erdene_Dzuu_01.jpg/500px-%C5%9Awi%C4%85tynia_Zachodnia_w_klasztorze_Erdene_Dzuu_01.jpg",
  altai:    WK+"2/2b/GoraBeluha.jpg/500px-GoraBeluha.jpg",
  hustai:   WK+"b/b9/Khustain_Nuruu_National_Park.jpg/500px-Khustain_Nuruu_National_Park.jpg",
  genghis:  WK+"9/93/Genghis_Khan_Equestrian_Statue%2C_photo_by_Vaiz_Ha.jpg/500px-Genghis_Khan_Equestrian_Statue%2C_photo_by_Vaiz_Ha.jpg",
  steppe:   WK+"0/0a/Tree_on_the_Mongolian_steppe_%28June_1997%29.jpg/500px-Tree_on_the_Mongolian_steppe_%28June_1997%29.jpg",
  // Activities — Unsplash (free, no attribution required)
  coffee:   US+"1511632765486-a01980e01a18?w=420&h=200&fit=crop&auto=format",
  park:     US+"1441974231531-c6227db76b6e?w=420&h=200&fit=crop&auto=format",
  museum:   US+"1554907984-15263bfd63bd?w=420&h=200&fit=crop&auto=format",
  cinema:   US+"1489599849927-2ee91cede3ba?w=420&h=200&fit=crop&auto=format",
  skating:  US+"1461897689869-c3e07dab7d48?w=420&h=200&fit=crop&auto=format",
  spa:      US+"1544161515-4ab6ce6db874?w=420&h=200&fit=crop&auto=format",
  hiking:   US+"1551632811-561732d1e306?w=420&h=200&fit=crop&auto=format",
  dinner:   US+"1414235077428-338989a2e8c0?w=420&h=200&fit=crop&auto=format",
  bookshop: US+"1507003211169-0a1dd7228f2d?w=420&h=200&fit=crop&auto=format",
  pottery:  US+"1565193566173-7a0ee3dbe261?w=420&h=200&fit=crop&auto=format",
  yoga:     US+"1544367567-0f2fcb009e0b?w=420&h=200&fit=crop&auto=format",
  bowling:  US+"1535131749006-b7f58c99034b?w=420&h=200&fit=crop&auto=format",
  music:    US+"1514525253161-7a46d19cd819?w=420&h=200&fit=crop&auto=format",
  fitness:  US+"1534438327276-14e5300c3a48?w=420&h=200&fit=crop&auto=format",
  cooking:  US+"1556909114-f6e7ad7d3136?w=420&h=200&fit=crop&auto=format",
  theater:  US+"1507924538820-ede94a04019d?w=420&h=200&fit=crop&auto=format",
  bar:      US+"1574126154517-d1e0d89ef734?w=420&h=200&fit=crop&auto=format",
  couple:   US+"1516589178581-6cd7833ae3b2?w=420&h=200&fit=crop&auto=format",
  boardgame:US+"1611996575749-79a3a250f948?w=420&h=200&fit=crop&auto=format",
  archery:  US+"1508193638397-1c4234db14d8?w=420&h=200&fit=crop&auto=format",
  art:      US+"1561214115-f2f134cc4912?w=420&h=200&fit=crop&auto=format",
};

// Аймаг тус бүрийн өөрийн (Wikipedia-гийн тухайн аймгийн өгүүллийн зурагнаас авсан) жинхэнэ зураг —
// өмнө нь ганцхан 11 ерөнхий зургийг 21 аймагт давхардуулан ашигладаг байсныг сольсон.
const aimagImgDB = {
  "Архангай":    {u: WK+"4/4f/A_view_of_Arhangay.jpg/500px-A_view_of_Arhangay.jpg",                                                            s: "Wikipedia CC"},
  "Баян-Өлгий":  {u: WK+"0/09/Tavan_Bogd_Mountain.jpg/500px-Tavan_Bogd_Mountain.jpg",                                                          s: "Wikipedia CC"},
  "Баянхонгор":  {u: WK+"3/3e/Nomgon_from_the_west.jpg/500px-Nomgon_from_the_west.jpg",                                                        s: "Wikipedia CC"},
  "Говьсүмбэр":  {u: WK+"c/cb/At_Choir_Mongolia_%2811532660476%29.jpg/500px-At_Choir_Mongolia_%2811532660476%29.jpg",                          s: "Wikipedia CC"},
  "Булган":      {u: WK+"5/5b/Amarbayasgalant_monastery_temple_01.JPG/500px-Amarbayasgalant_monastery_temple_01.JPG",                          s: "Wikipedia CC"},
  "Говь-Алтай":  {u: WK+"3/32/Sutai_Mount%2C_Altai_Mountains._-_panoramio.jpg/500px-Sutai_Mount%2C_Altai_Mountains._-_panoramio.jpg",          s: "Wikipedia CC"},
  "Дархан-Уул":  {u: WK+"7/79/Darkhan.jpg/500px-Darkhan.jpg",                                                                                  s: "Wikipedia CC"},
  "Дорноговь":   {u: WK+"1/16/Gobi%2C_krajobraz_pustyni_%2820%29.jpg/500px-Gobi%2C_krajobraz_pustyni_%2820%29.jpg",                            s: "Wikipedia CC"},
  "Дорнод":      {u: WK+"b/b6/Bars_Hota_Mongolia.jpg/500px-Bars_Hota_Mongolia.jpg",                                                            s: "Wikipedia CC"},
  "Дундговь":    {u: WK+"9/91/S%C3%BCmKh%C3%B6khBurd.jpg/500px-S%C3%BCmKh%C3%B6khBurd.jpg",                                                    s: "Wikipedia CC"},
  "Завхан":      {u: WK+"6/69/Har_Nuur.jpg/500px-Har_Nuur.jpg",                                                                                s: "Wikipedia CC"},
  "Орхон":       {u: WK+"8/8a/Erdenet_02.jpg/500px-Erdenet_02.jpg",                                                                            s: "Wikipedia CC"},
  "Өвөрхангай":  {u: WK+"e/ec/ErdeneZuuMonasteryMongolia.JPG/500px-ErdeneZuuMonasteryMongolia.JPG",                                            s: "Wikipedia CC"},
  "Өмнөговь":    {u: WK+"9/90/OmnogoviLandscape.jpg/500px-OmnogoviLandscape.jpg",                                                              s: "Wikipedia CC"},
  "Сүхбаатар":   {u: WK+"b/b8/Steppe01-Obo.jpg/500px-Steppe01-Obo.jpg",                                                                        s: "Wikipedia CC"},
  "Сэлэнгэ":     {u: WK+"b/b5/Selenga.jpg/500px-Selenga.jpg",                                                                                  s: "Wikipedia CC"},
  "Төв":         {u: WK+"3/3c/Zuunmod_%282025%29.jpg/500px-Zuunmod_%282025%29.jpg",                                                            s: "Wikipedia CC"},
  "Увс":         {u: WK+"3/36/Uvs_n%C3%BAr.JPG/500px-Uvs_n%C3%BAr.JPG",                                                                        s: "Wikipedia CC"},
  "Ховд":        {u: WK+"d/d9/The_Buyant_River.jpg/500px-The_Buyant_River.jpg",                                                                s: "Wikipedia CC"},
  "Хөвсгөл":     {u: WK+"c/c8/Burentogtokh.jpg/500px-Burentogtokh.jpg",                                                                        s: "Wikipedia CC"},
  "Хэнтий":      {u: WK+"5/50/Kherlen_River.jpg/500px-Kherlen_River.jpg",                                                                      s: "Wikipedia CC"},
};

function getAimagImg(a) {
  return aimagImgDB[a.name] || {u: IMG.steppe, s: "Wikipedia CC"};
}

// Wonder type image mapping
const wonderTypeImgDB = {
  lake:      {u: IMG.khuvsgul, s: "Wikipedia CC"},
  mountain:  {u: IMG.altai,    s: "Wikipedia CC"},
  desert:    {u: IMG.gobi,     s: "Wikipedia CC"},
  volcano:   {u: IMG.khuvsgul, s: "Wikipedia CC"},
  cave:      {u: IMG.bayanzag, s: "Wikipedia CC"},
  temple:    {u: IMG.erdene,   s: "Wikipedia CC"},
  waterfall: {u: IMG.orkhon,   s: "Wikipedia CC"},
  rock:      {u: IMG.bayanzag, s: "Wikipedia CC"},
  ruins:     {u: IMG.erdene,   s: "Wikipedia CC"},
  steppe:    {u: IMG.steppe,   s: "Wikipedia CC"},
  canyon:    {u: IMG.bayanzag, s: "Wikipedia CC"},
  river:     {u: IMG.orkhon,   s: "Wikipedia CC"},
  spring:    {u: IMG.khuvsgul, s: "Wikipedia CC"},
  nomad:     {u: IMG.steppe,   s: "Wikipedia CC"},
  historic:  {u: IMG.erdene,   s: "Wikipedia CC"},
  nature:    {u: IMG.terelj,   s: "Wikipedia CC"},
};

// UB idea title keyword → image
function getIdeaImg(title) {
  const t = title.toLowerCase();
  if(t.includes("зайсан") || t.includes("хотын") || t.includes("skybar") || t.includes("sky"))
    return {u: IMG.ub,       s: "Wikipedia CC"};
  if(t.includes("сүхбаатар") || t.includes("талбай"))
    return {u: IMG.ub,       s: "Wikipedia CC"};
  if(t.includes("музей") || t.includes("heritage") || t.includes("чойжин") || t.includes("монгол cos"))
    return {u: IMG.museum,   s: "Unsplash"};
  if(t.includes("гандан") || t.includes("хийд") || t.includes("залбир"))
    return {u: IMG.erdene,   s: "Wikipedia CC"};
  if(t.includes("богд уул") || t.includes("уулд алх") || t.includes("аялал") || t.includes("хайк"))
    return {u: IMG.hiking,   s: "Unsplash"};
  if(t.includes("art") || t.includes("үзэсгэлэн") || t.includes("экспо"))
    return {u: IMG.art,      s: "Unsplash"};
  if(t.includes("кино") || t.includes("theatre") || t.includes("кинотеатр") || t.includes("шангри"))
    return {u: IMG.cinema,   s: "Unsplash"};
  if(t.includes("кофешоп") || t.includes("кафе") || t.includes("tom n") || t.includes("stupa cafe"))
    return {u: IMG.coffee,   s: "Unsplash"};
  if(t.includes("internom") || t.includes("ном"))
    return {u: IMG.bookshop, s: "Unsplash"};
  if(t.includes("жүжиг") || t.includes("опера") || t.includes("театр"))
    return {u: IMG.theater,  s: "Unsplash"};
  if(t.includes("ресторан") || t.includes("хархорум 14") || t.includes("цаатан"))
    return {u: IMG.dinner,   s: "Unsplash"};
  if(t.includes("skybar") || t.includes("sky bar") || t.includes("шөнийн"))
    return {u: IMG.bar,      s: "Unsplash"};
  if(t.includes("карао") || t.includes("mongolyrics") || t.includes("хөгжим") || t.includes("дуу"))
    return {u: IMG.music,    s: "Unsplash"};
  if(t.includes("боулинг"))
    return {u: IMG.bowling,  s: "Unsplash"};
  if(t.includes("ice") || t.includes("гулгуур") || t.includes("зимний"))
    return {u: IMG.skating,  s: "Unsplash"};
  if(t.includes("spa") || t.includes("массаж") || t.includes("тайвшрал"))
    return {u: IMG.spa,      s: "Unsplash"};
  if(t.includes("парк") || t.includes("зугаал") || t.includes("алхалт"))
    return {u: IMG.park,     s: "Unsplash"};
  if(t.includes("савлуур") || t.includes("шавар"))
    return {u: IMG.pottery,  s: "Unsplash"};
  if(t.includes("ёг") || t.includes("yoga"))
    return {u: IMG.yoga,     s: "Unsplash"};
  if(t.includes("мастер класс") || t.includes("хоол хийх"))
    return {u: IMG.cooking,  s: "Unsplash"};
  if(t.includes("фитнес") || t.includes("бэлтгэл"))
    return {u: IMG.fitness,  s: "Unsplash"};
  if(t.includes("сур харваа") || t.includes("archery"))
    return {u: IMG.archery,  s: "Unsplash"};
  if(t.includes("board game") || t.includes("тоглоом") || t.includes("тоглох"))
    return {u: IMG.boardgame,s: "Unsplash"};
  if(t.includes("хос") || t.includes("байгаль"))
    return {u: IMG.couple,   s: "Unsplash"};
  return null;
}

function imgTag(url, credit, cls, style) {
  const cred = credit === "Wikipedia CC"
    ? `<span class="card-img-credit">© Wikipedia CC</span>`
    : `<span class="card-img-credit">Unsplash</span>`;
  return `<img src="${url}" loading="lazy" alt="" class="${cls||''}" style="${style||''}" onerror="this.parentNode.removeChild(this)">${cred}`;
}

// Google Maps — API key шаардахгүй энгийн embed + шинэ tab-д нээх холбоос.
// query нь газрын нэр (жишээ: "Тэрхийн цагаан нуур, Архангай").
function mapEmbedHtml(query) {
  const q = encodeURIComponent(query + " Монгол");
  return `
    <div class="map-embed-wrap">
      <iframe src="https://www.google.com/maps?q=${q}&output=embed" loading="lazy" style="width:100%;height:220px;border:0;border-radius:10px;display:block;" allowfullscreen title="${query} — газрын зураг"></iframe>
      <a href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener" class="map-open-link">🗺 Google Maps дээр нээх →</a>
    </div>`;
}

// YouTube — тодорхой видео ID биш ХАЙЛТЫН холбоос ашиглана (movies.js-ийн trailer линктэй ижил арга барил),
// учир нь тодорхой video ID хугацааны явцад устах/хаагдах эрсдэлтэй, харин хайлтын холбоос үргэлж ажиллана.
function youtubeSearchHtml(query, label) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  return `<a href="${url}" target="_blank" rel="noopener" class="youtube-search-link">▶ ${label || "YouTube-с жишээ бичлэг үзэх"}</a>`;
}

// Кино/аймаг/хуудас бүр өөрийн HTML файл, өөрийн URL-тай тул
// navigate() зүгээр л тухайн файл руу шилждэг (жинхэнэ browser navigation).
const NAV_FILE_MAP = { home: "index.html", "aimag-detail": "aimags.html" };
function navigate(page, param) {
  const file = NAV_FILE_MAP[page] || page + ".html";
  if (param === undefined || param === null || param === "") { location.href = file; return; }
  const key = page === "expert" ? "section" : "id";
  location.href = file + "?" + key + "=" + encodeURIComponent(param);
}

function renderCard(idea) {
  const isLiked = userLikes.has(idea.id);
  const imgInfo = getIdeaImg(idea.title);
  const badge = idea.day === 1
    ? '<div class="card-badge gold" style="z-index:3">⭐ Шинэ жил</div>'
    : (idea.likes > 1500 ? '<div class="card-badge" style="z-index:3">🔥 Hot</div>' : '');
  const imageContent = imgInfo
    ? `<img src="${imgInfo.u}" loading="lazy" alt="${idea.title}" class="card-bg-img" onerror="this.remove()">
       <div class="card-img-overlay"></div>
       <span class="card-emoji-over">${idea.emoji}</span>
       <span class="card-img-credit">${imgInfo.s==="Wikipedia CC"?"© Wikipedia CC":"Unsplash"}</span>`
    : idea.emoji;
  return `
    <div class="card" onclick="openIdeaModal(${idea.id})">
      <div class="card-image" style="background: ${getColor(idea.id)}; overflow:hidden;">
        ${imageContent}
        ${badge}
      </div>
      <div class="card-body">
        <div class="card-day">📅 ${idea.day}-р өдөр</div>
        <div class="card-location">${idea.location}</div>
        <div class="card-title">${idea.title}</div>
        <div class="card-desc">${idea.desc}</div>
        <div class="card-feeling">💝 ${idea.feeling.substring(0, 80)}...</div>
        <div class="card-footer">
          <span class="card-price">${idea.priceText}</span>
          <span class="card-likes ${isLiked?'liked':''}" onclick="event.stopPropagation();toggleLike(${idea.id})">
            ${isLiked?'❤️':'🤍'} ${idea.likes + (isLiked?1:0)}
          </span>
        </div>
      </div>
    </div>`;
}

function openIdeaModal(id) {
  const idea = allUbIdeas.find(i => i.id === id);
  if(!idea) return;
  const imgInfo = getIdeaImg(idea.title);
  const isLiked = userLikes.has(idea.id);
  const imgHtml = imgInfo
    ? `<div class="modal-image" style="background:${getColor(idea.id)};position:relative;overflow:hidden;padding:0;">
        <img src="${imgInfo.u}" loading="lazy" alt="${idea.title}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.remove()">
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.2);"></div>
        <span style="position:relative;z-index:1;font-size:56px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.5));">${idea.emoji}</span>
        <span class="card-img-credit" style="z-index:2;">${imgInfo.s==="Wikipedia CC"?"© Wikipedia CC":"Unsplash"}</span>
      </div>`
    : `<div class="modal-image" style="background:${getColor(idea.id)}">${idea.emoji}</div>`;
  document.getElementById("modalContent").innerHTML = `
    <div class="modal-header">
      <h2 style="font-size: 20px;">${idea.title}</h2>
      <button class="modal-close" onclick="closeModal()" type="button">×</button>
    </div>
    <div class="modal-body">
      ${imgHtml}
      <div class="modal-meta">
        <div class="modal-meta-item">📅 <strong>${idea.day}-р өдөр</strong></div>
        <div class="modal-meta-item">📍 <strong>${idea.location}</strong></div>
        <div class="modal-meta-item">💸 <strong>${idea.priceText}</strong></div>
        <div class="modal-meta-item">❤️ <strong>${idea.likes + (isLiked?1:0)}</strong></div>
      </div>
      ${mapEmbedHtml(`${idea.location}, Улаанбаатар`)}
      <p style="margin-bottom: 16px; line-height: 1.7;">${idea.desc}</p>
      <div class="feeling-box">
        <h4>💝 Энэ болзоонд танд төрөх мэдрэмж:</h4>
        <p>${idea.feeling}</p>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn btn-primary" style="flex:1;min-width:120px" type="button" onclick="openBookingModal(${idea.id})">📅 Захиалах</button>
        <button class="btn ${isLiked?'btn-accent':'btn-ghost'}" type="button" onclick="toggleLike(${idea.id});this.className='btn ${isLiked?'btn-ghost':'btn-accent'}';this.textContent='${isLiked?'🤍 Хадгалах':'❤️ Хадгалсан'}'">
          ${isLiked?'❤️ Хадгалсан':'🤍 Хадгалах'}
        </button>
        <button class="btn btn-ghost" type="button" onclick="shareIdea('${idea.title.replace(/'/g,'').replace(/"/g,'')}', ${idea.id})">🔗 Хуваалцах</button>
      </div>
    </div>`;
  document.getElementById("modal").classList.add("show");
}

function closeModal() { document.getElementById("modal").classList.remove("show"); }

function openBookingModal(ideaId, customTitle) {
  const idea = ideaId ? allUbIdeas.find(i => i.id === ideaId) : null;
  const title = customTitle || (idea ? idea.title : "Болзооны захиалга");
  const price = idea ? idea.priceText : "Тохиролцоогоор";
  document.getElementById("modalContent").innerHTML = `
    <div class="modal-header">
      <h3>📅 Захиалга — ${title}</h3>
      <button class="modal-close" onclick="closeModal()" type="button">×</button>
    </div>
    <div class="modal-body">
      <p style="color:var(--text-light);font-size:13px;margin-bottom:16px;">Доорх мэдээллийг бөглөснөөр манай баг 24 цагийн дотор холбоо барина.</p>
      <div class="booking-form">
        <input type="text" id="bkName" placeholder="Таны нэр *" required>
        <input type="tel" id="bkPhone" placeholder="Утасны дугаар * (+976)" required>
        <input type="email" id="bkEmail" placeholder="И-мэйл хаяг">
        <input type="date" id="bkDate" min="${new Date().toISOString().split('T')[0]}">
        <select id="bkPeople">
          <option value="2">2 хүн (хос)</option>
          <option value="3">3 хүн</option>
          <option value="4">4 хүн (хосуудын бүлэг)</option>
        </select>
        <textarea id="bkNote" placeholder="Нэмэлт тайлбар (тусгай хүсэлт гэх мэт)..." rows="2"></textarea>
        <div style="background:var(--primary-extra-soft);padding:10px 14px;border-radius:8px;font-size:13px;">
          💰 Ойролцоо зардал: <strong>${price}</strong>
        </div>
        <button class="btn btn-primary" type="button" onclick="submitBooking('${title.replace(/'/g,'')}')">✅ Захиалга илгээх</button>
      </div>
    </div>`;
  document.getElementById("modal").classList.add("show");
}

function submitBooking(title) {
  const name = document.getElementById("bkName")?.value.trim();
  const phone = document.getElementById("bkPhone")?.value.trim();
  if(!name || !phone) return showToast("⚠️ Нэр болон утасны дугаараа оруулна уу");
  document.getElementById("modalContent").innerHTML = `
    <div class="modal-header">
      <h3>✅ Захиалга амжилттай</h3>
      <button class="modal-close" onclick="closeModal()" type="button">×</button>
    </div>
    <div class="modal-body">
      <div class="booking-success">
        <span class="tick">🎉</span>
        <h3 style="font-size:20px;margin-bottom:8px;">Баярлалаа, ${name}!</h3>
        <p style="color:var(--text-light);margin-bottom:16px;font-size:14px;">
          <strong>${title}</strong> болзооны захиалга бүртгэгдлээ.<br>
          Бид 24 цагийн дотор <strong>${phone}</strong> дугаарт залгана.
        </p>
        <div style="background:var(--primary-extra-soft);padding:14px;border-radius:10px;font-size:13px;text-align:left;">
          📱 WhatsApp/Viber-ээр мессеж илгээж болно<br>
          📧 info@nbolzoo.mn-д имэйл илгээж болно
        </div>
        <button class="btn btn-primary" style="margin-top:16px;width:100%" type="button" onclick="closeModal()">Хаах</button>
      </div>
    </div>`;
  showToast("🎉 Захиалга амжилттай илгээгдлээ!");
}

function shareIdea(title, id) {
  const url = `${window.location.origin}${window.location.pathname}${id ? '#idea-'+id : ''}`;
  const text = `NBolzoo — ${title} 💕\n${url}`;
  if(navigator.share) {
    navigator.share({title: 'NBolzoo', text: title, url}).catch(()=>{});
  } else if(navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast("🔗 Холбоос хуулагдлаа!")).catch(()=>{});
  } else {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta);
    ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
    showToast("🔗 Холбоос хуулагдлаа!");
  }
}

async function toggleLike(id) {
  const wasLiked = userLikes.has(id);
  if(wasLiked) { userLikes.delete(id); showToast("🤍 Хадгалсан санаанаас хасагдлаа"); }
  else { userLikes.add(id); showToast("❤️ Хадгалсан санаанд нэмэгдлээ"); }
  // Page бүр зөвхөн өөрийн container-тай тул тухайн element байгаа эсэхээр шалгана
  // (олон page нэг DOM дотор хамт байдаг байсан хуучин SPA-ийн арга барил биш).
  if(document.getElementById("ubGrid")) renderUbIdeas();
  if(document.getElementById("featuredGrid")) renderFeatured();
  if(document.getElementById("savedGrid")) renderSaved();

  if (currentUser && db) {
    const savedId = currentUser.uid + "_" + id;
    try {
      if (wasLiked) {
        await db.collection("saved").doc(savedId).delete();
      } else {
        const idea = (typeof allUbIdeas !== "undefined") ? allUbIdeas.find(i => i.id === id) : null;
        await db.collection("saved").doc(savedId).set({
          uid: currentUser.uid, ideaId: id, ideaTitle: idea ? idea.title : "",
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch(e) { console.warn("saved sync error:", e); }
  }
}

function performSearch() {
  const q = document.getElementById("searchInput").value.toLowerCase();
  if(!q) return showToast("Хайх үг оруулна уу");
  const ubResults = allUbIdeas.filter(i => i.title.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q) || i.location.toLowerCase().includes(q));
  const aimagResults = aimagsClean.filter(a => a.name.toLowerCase().includes(q));
  showToast(`🔍 "${q}" - ${ubResults.length + aimagResults.length} үр дүн олдлоо`);
  if(ubResults.length > 0) {
    navigate('ub');
    setTimeout(() => {
      document.getElementById("ubGrid").innerHTML = ubResults.slice(0,12).map(renderCard).join("");
      document.getElementById("ubPagination").innerHTML = `<span style="padding: 8px 14px; color: var(--text-light);">"${q}" гэсэн хайлтаар ${ubResults.length} санаа олдлоо</span>`;
    }, 300);
  }
}

document.querySelectorAll('[data-ub-filter]').forEach(c => {
  c.addEventListener("click", e => {
    document.querySelectorAll('[data-ub-filter]').forEach(x => x.classList.remove("active"));
    e.target.classList.add("active");
    currentUbFilter = e.target.dataset.ubFilter;
    currentPage = 1;
    renderUbIdeas();
  });
});

document.querySelectorAll('[data-region]').forEach(c => {
  c.addEventListener("click", e => {
    document.querySelectorAll('[data-region]').forEach(x => x.classList.remove("active"));
    e.target.classList.add("active");
    currentRegion = e.target.dataset.region;
    renderAimags();
  });
});

// Cinema genre chips handled via onclick in HTML

// Бодит Firebase Authentication (Google/Email) нь js/auth.js файлд байгаа бөгөөд
// currentUser, openAuth, doAuth, logoutUser зэрэг бүгд тэнд тодорхойлогдоно.

function openMobileMenu() {
  document.getElementById("mobileNavDrawer").classList.add("open");
  document.getElementById("mobileOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeMobileMenu() {
  document.getElementById("mobileNavDrawer").classList.remove("open");
  document.getElementById("mobileOverlay").classList.remove("open");
  document.body.style.overflow = "";
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  if(existing) existing.remove();
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = message;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// Хэрэглэгчийн бичсэн текстийг innerHTML-д аюулгүй оруулахын тулд escape хийнэ (XSS сэргийлэлт)
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

