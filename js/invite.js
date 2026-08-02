// ===== УРИЛГА (invitation builder): stateless, backend шаардахгүй =====
// Бүх өгөгдлийг URL-ийн ?d= param дотор base64url-ээр кодолж дамжуулна —
// Firestore бичих шаардлагагүй тул илгээх/хүлээн авах хоёул нэвтрэх шаардлагагүй, шууд ажиллана.

const INVITE_TYPES = {
  event:    { label: "Үйл ажиллагаа", emoji: "🎉", desc: "Төрсөн өдөр, цуглаан, ажлын арга хэмжээ" },
  wedding:  { label: "Хурим",         emoji: "💍", desc: "Хуримын урилга найз нөхөд, төрөл садандаа" },
  date:     { label: "Болзооны урилга", emoji: "💕", desc: "Хамт болзох уу гэж асуудаг интерактив урилга" },
  proposal: { label: "Гэрлэх санал",  emoji: "💐", desc: "Амьдралын хамгийн чухал асуултаа тавь" },
};

function encodeInviteData(obj) {
  return btoa(encodeURIComponent(JSON.stringify(obj))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decodeInviteData(str) {
  try {
    let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    return JSON.parse(decodeURIComponent(atob(b64)));
  } catch (e) { return null; }
}
function invVal(id) { return (document.getElementById(id)?.value || "").trim(); }

function initInvitePage() {
  const params = new URLSearchParams(location.search);
  const type = params.get("type");
  const d = params.get("d");
  if (type && INVITE_TYPES[type] && d) {
    const data = decodeInviteData(d);
    if (data) { renderInviteView(type, data); return; }
  }
  renderTypePicker();
}

function renderTypePicker() {
  document.getElementById("inviteRoot").innerHTML = `
    <h1 style="margin-bottom:6px;">💌 Урилга үүсгэх</h1>
    <p style="color:var(--text-light);margin-bottom:8px;">Төрлөө сонгоод, дэлгэрэнгүйгээ бөглөөд шууд QR код хэлбэрээр аваарай.</p>
    <div class="inv-type-grid">
      ${Object.entries(INVITE_TYPES).map(([id, t]) => `
        <div class="inv-type-card" onclick="selectInviteType('${id}')">
          <div class="icon">${t.emoji}</div>
          <h3>${t.label}</h3>
          <p>${t.desc}</p>
        </div>`).join("")}
    </div>`;
}

function selectInviteType(type) {
  if (type === "date") return renderDateForm();
  if (type === "proposal") return renderProposalForm();
  renderGenericForm(type);
}

function renderGenericForm(type) {
  const t = INVITE_TYPES[type];
  const isWedding = type === "wedding";
  document.getElementById("inviteRoot").innerHTML = `
    <a class="back-btn" onclick="renderTypePicker()">← Буцах</a>
    <h2 style="margin:10px 0 4px;">${t.emoji} ${t.label} урилга</h2>
    <div class="inv-form">
      ${isWedding
        ? `<div class="form-group"><label>Хосын нэр</label><input id="invField1" placeholder="Бат & Сараа"></div>`
        : `<div class="form-group"><label>Гарчиг</label><input id="invField1" placeholder="жишээ: Төрсөн өдрийн баяр"></div>`}
      <div class="form-group"><label>Огноо</label><input type="date" id="invDate"></div>
      <div class="form-group"><label>Цаг</label><input type="time" id="invTime"></div>
      <div class="form-group"><label>Байршил</label><input id="invLocation" placeholder="жишээ: ... ресторан"></div>
      <div class="form-group"><label>Мессеж</label><textarea id="invMessage" rows="3" placeholder="Урилгын дэлгэрэнгүй..."></textarea></div>
      <button class="btn btn-primary" style="width:100%" type="button" onclick="generateInviteQr('${type}')">📱 QR код үүсгэх</button>
    </div>`;
}

function renderDateForm() {
  document.getElementById("inviteRoot").innerHTML = `
    <a class="back-btn" onclick="renderTypePicker()">← Буцах</a>
    <h2 style="margin:10px 0 4px;">💕 Болзооны урилга</h2>
    <p style="color:var(--text-light);font-size:13px;margin-bottom:16px;">Энэ бол интерактив урилга — хүлээн авагч 3 асуултад хариулж, огноо сонгоод, эцэст нь "Тийм" эсвэл "Үгүй" гэж хариулна.</p>
    <div class="inv-form">
      <div class="form-group"><label>Хэнд зориулав вэ? (заавал биш)</label><input id="invField1" placeholder="жишээ: Наранцэцэг"></div>
      <button class="btn btn-primary" style="width:100%" type="button" onclick="generateInviteQr('date')">📱 QR код үүсгэх</button>
    </div>`;
}

function renderProposalForm() {
  document.getElementById("inviteRoot").innerHTML = `
    <a class="back-btn" onclick="renderTypePicker()">← Буцах</a>
    <h2 style="margin:10px 0 4px;">💐 Гэрлэх санал</h2>
    <div class="inv-form">
      <div class="form-group"><label>Хэнд зориулав вэ?</label><input id="invField1" placeholder="жишээ: Наранцэцэг"></div>
      <div class="form-group"><label>Хувийн мессеж (заавал биш)</label><textarea id="invMessage" rows="3" placeholder="Чиний хэлмээр байгаа зүйлээ бичээрэй..."></textarea></div>
      <button class="btn btn-primary" style="width:100%" type="button" onclick="generateInviteQr('proposal')">📱 QR код үүсгэх</button>
    </div>`;
}

function generateInviteQr(type) {
  let data = {};
  if (type === "wedding") data = { names: invVal("invField1"), date: invVal("invDate"), time: invVal("invTime"), location: invVal("invLocation"), message: invVal("invMessage") };
  else if (type === "event") data = { title: invVal("invField1"), date: invVal("invDate"), time: invVal("invTime"), location: invVal("invLocation"), message: invVal("invMessage") };
  else if (type === "proposal") data = { recipient: invVal("invField1"), message: invVal("invMessage") };
  else if (type === "date") data = { recipient: invVal("invField1") };

  const encoded = encodeInviteData(data);
  const url = `${location.origin}${location.pathname}?type=${type}&d=${encoded}`;
  showInviteQr(url);
}

function showInviteQr(url) {
  const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`;
  document.getElementById("inviteRoot").innerHTML = `
    <a class="back-btn" onclick="renderTypePicker()">← Шинэ урилга үүсгэх</a>
    <div class="inv-qr-box">
      <img src="${qrImg}" width="240" height="240" alt="QR код">
      <p style="font-size:13px;color:var(--text-light);margin-bottom:10px;">Энэ QR кодыг уншуулж эсвэл доорх холбоосыг илгээж урилгаа хуваалцаарай</p>
      <div class="inv-link-row">
        <input type="text" readonly value="${escapeHtml(url)}" id="inviteLinkInput" onclick="this.select()">
        <button class="btn btn-primary" type="button" onclick="copyInviteLink()">Хуулах</button>
      </div>
    </div>`;
}

function copyInviteLink() {
  const input = document.getElementById("inviteLinkInput");
  if (!input) return;
  input.select();
  if (navigator.clipboard) navigator.clipboard.writeText(input.value).then(() => showToast("🔗 Холбоос хуулагдлаа!"));
}

// ---------- Recipient view ----------
function renderInviteView(type, data) {
  if (type === "date") return renderDateInviteExperience(data.recipient || "");
  if (type === "proposal") return renderProposalExperience(data.recipient || "", data.message || "");

  const t = INVITE_TYPES[type];
  const isWedding = type === "wedding";
  document.getElementById("inviteRoot").innerHTML = `
    <div class="inv-view-card">
      <div class="icon">${t.emoji}</div>
      <h2>${escapeHtml((isWedding ? data.names : data.title) || t.label)}</h2>
      <div class="inv-view-detail">
        📅 ${escapeHtml(data.date || "Тодорхойгүй")}${data.time ? " · " + escapeHtml(data.time) : ""}<br>
        📍 ${escapeHtml(data.location || "Тодорхойгүй")}
        ${data.message ? `<br><br>💌 ${escapeHtml(data.message)}` : ""}
      </div>
    </div>`;
}

// ================= БОЛЗООНЫ ИНТЕРАКТИВ УРИЛГА (дасан зохицуулсан, эх загвар) =================
const invAnswers = { q1: null, q2: null, q3: null, date: null };
let invCalDate = new Date();
const invMonthNames = ["1-р сар","2-р сар","3-р сар","4-р сар","5-р сар","6-р сар","7-р сар","8-р сар","9-р сар","10-р сар","11-р сар","12-р сар"];
const invDowNames = ["Ням","Дав","Мяг","Лха","Пүр","Баа","Бям"];

function renderDateInviteExperience(recipientName) {
  const app = document.getElementById("inviteRoot");
  const heading = recipientName ? `${escapeHtml(recipientName)} аа, чамайг олоход хэцүү байлаа 👀` : "Хөөх, чамайг олоход хэцүү байлаа 👀";
  app.innerHTML = `
  <div id="inviteApp">
    <div id="inv-petals"></div>
    <div id="inv-heartRain"></div>
    <div id="inv-stage">
      <div class="inv-card active" id="inv-s-intro">
        <div class="inv-eyebrow">Нэг асуулт байна</div>
        <h1>${heading}</h1>
        <p class="inv-sub">30 секунд өгөөч. Эцэст нь чамд нэг зүйл сонгуулах гэсэн юм.</p>
        <button class="inv-btn" type="button" onclick="invGoTo('inv-s-q1')">Эхлэх ✨</button>
      </div>
      <div class="inv-card" id="inv-s-q1">
        <div class="inv-progress"><span class="inv-done"></span><span></span><span></span><span></span></div>
        <div class="inv-eyebrow">Асуулт 1 / 3</div>
        <h1 style="font-size:32px;">Бид хаашаа явах вэ? 🤔</h1>
        <div class="inv-options" id="inv-opts-q1">
          <div class="inv-opt" data-val="Кино" onclick="invPick('inv-opts-q1', this, 'q1', 'inv-s-q2')"><span class="inv-emoji">🎬</span> Кино үзэх</div>
          <div class="inv-opt" data-val="Кофе" onclick="invPick('inv-opts-q1', this, 'q1', 'inv-s-q2')"><span class="inv-emoji">☕</span> Кофе шоп</div>
          <div class="inv-opt" data-val="Парк" onclick="invPick('inv-opts-q1', this, 'q1', 'inv-s-q2')"><span class="inv-emoji">🌳</span> Парк алхах</div>
          <div class="inv-opt" data-val="Хоол" onclick="invPick('inv-opts-q1', this, 'q1', 'inv-s-q2')"><span class="inv-emoji">🍜</span> Хоол идэх</div>
        </div>
      </div>
      <div class="inv-card" id="inv-s-q2">
        <div class="inv-progress"><span class="inv-done"></span><span class="inv-done"></span><span></span><span></span></div>
        <div class="inv-eyebrow">Асуулт 2 / 3</div>
        <h1 style="font-size:32px;">Юу хийхэд дуртай вэ? 😊</h1>
        <div class="inv-options" id="inv-opts-q2">
          <div class="inv-opt" data-val="Зураг авах" onclick="invPick('inv-opts-q2', this, 'q2', 'inv-s-q3')"><span class="inv-emoji">📸</span> Зураг авах</div>
          <div class="inv-opt" data-val="Тоглоом тоглох" onclick="invPick('inv-opts-q2', this, 'q2', 'inv-s-q3')"><span class="inv-emoji">🎮</span> Тоглоом тоглох</div>
          <div class="inv-opt" data-val="Зүгээр ярилцах" onclick="invPick('inv-opts-q2', this, 'q2', 'inv-s-q3')"><span class="inv-emoji">💬</span> Зүгээр ярилцах</div>
          <div class="inv-opt" data-val="Шинэ юм үзэх" onclick="invPick('inv-opts-q2', this, 'q2', 'inv-s-q3')"><span class="inv-emoji">🎨</span> Шинэ юм үзэх</div>
        </div>
      </div>
      <div class="inv-card" id="inv-s-q3">
        <div class="inv-progress"><span class="inv-done"></span><span class="inv-done"></span><span class="inv-done"></span><span></span></div>
        <div class="inv-eyebrow">Асуулт 3 / 3</div>
        <h1 style="font-size:32px;">Хэдэн цагт тохиромжтой вэ? ⏰</h1>
        <div class="inv-options" id="inv-opts-q3">
          <div class="inv-opt" data-val="Өдрөөр" onclick="invPick('inv-opts-q3', this, 'q3', 'inv-s-date')"><span class="inv-emoji">🌅</span> Өдрөөр</div>
          <div class="inv-opt" data-val="Оройн наашаа" onclick="invPick('inv-opts-q3', this, 'q3', 'inv-s-date')"><span class="inv-emoji">🌆</span> Оройн наашаа</div>
          <div class="inv-opt" data-val="Шөнөдөө" onclick="invPick('inv-opts-q3', this, 'q3', 'inv-s-date')"><span class="inv-emoji">🌙</span> Шөнөдөө</div>
        </div>
      </div>
      <div class="inv-card" id="inv-s-date">
        <div class="inv-progress"><span class="inv-done"></span><span class="inv-done"></span><span class="inv-done"></span><span class="inv-done"></span></div>
        <div class="inv-eyebrow">Сүүлчийн алхам</div>
        <h1 style="font-size:30px;">Хэзээ болзох вэ? 📅</h1>
        <div class="inv-cal-head">
          <button type="button" onclick="invChangeMonth(-1)">‹</button>
          <div class="inv-cal-month" id="invCalMonthLabel"></div>
          <button type="button" onclick="invChangeMonth(1)">›</button>
        </div>
        <div class="inv-cal-grid" id="invCalGrid"></div>
        <div class="inv-date-label" id="invDateLabel">Огноогоо сонгоно уу 👆</div>
        <button class="inv-btn" id="invDateNextBtn" type="button" style="display:none;" onclick="invGoTo('inv-s-final')">Дараах →</button>
      </div>
      <div class="inv-card" id="inv-s-final">
        <div class="inv-eyebrow">Асуулт нь энэ байлаа</div>
        <h1>Чи надтай болзох уу? 💕</h1>
        <p class="inv-sub">Дараа нь бид гоё цаг өнгөрүүлнэ, амлана.</p>
        <div class="inv-final-buttons">
          <button class="inv-btn" id="inv-yesBtn" type="button" onclick="invCelebrateDate()">Зөвшөөрөх ❤️</button>
          <button class="inv-btn inv-btn-ghost" id="inv-noBtn" type="button"
            onmouseenter="invDodge()" ontouchstart="invDodge(); event.preventDefault();">Үгүй</button>
        </div>
      </div>
      <div class="inv-card" id="inv-s-celebrate">
        <div class="inv-eyebrow">Баяр хүргэе 🎉</div>
        <h1>Тэгвэл болзоо болцгооё!</h1>
        <div class="inv-summary" id="invSummaryBox"></div>
        <p class="inv-sub" style="margin-bottom:4px;">Сая асуултыг зөв хариулсанд баярлалаа 🥹</p>
      </div>
    </div>
  </div>`;

  invStartPetals();
  invCalDate = new Date();
  invCalDate.setDate(1);
  invRenderCalendar();
}

function invGoTo(id) {
  document.querySelectorAll("#inviteApp .inv-card").forEach(c => c.classList.remove("active"));
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("active");
  el.style.animation = "none";
  void el.offsetWidth;
  el.style.animation = null;
}

function invPick(groupId, el, key, nextScreen) {
  document.querySelectorAll("#" + groupId + " .inv-opt").forEach(o => o.classList.remove("inv-picked"));
  el.classList.add("inv-picked");
  invAnswers[key] = el.dataset.val;
  setTimeout(() => invGoTo(nextScreen), 380);
}

function invStartPetals() {
  const petalEmojis = ["🌸", "🌺", "💮"];
  const container = document.getElementById("inv-petals");
  if (!container) return;
  function spawn() {
    if (!document.getElementById("inv-petals")) return; // хуудас солигдсон бол зогсооно
    const p = document.createElement("div");
    p.className = "inv-petal";
    p.textContent = petalEmojis[Math.floor(Math.random() * petalEmojis.length)];
    const startX = Math.random() * 100;
    const duration = 9 + Math.random() * 8;
    const drift = (Math.random() * 80 - 40) + "px";
    p.style.left = startX + "vw";
    p.style.animationDuration = duration + "s";
    p.style.setProperty("--drift", drift);
    p.style.fontSize = (14 + Math.random() * 14) + "px";
    container.appendChild(p);
    setTimeout(() => p.remove(), duration * 1000 + 200);
  }
  for (let i = 0; i < 6; i++) setTimeout(spawn, i * 300);
  const interval = setInterval(() => {
    if (!document.getElementById("inv-petals")) { clearInterval(interval); return; }
    spawn();
  }, 700);
}

function invRenderCalendar() {
  const grid = document.getElementById("invCalGrid");
  if (!grid) return;
  grid.innerHTML = "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  invDowNames.forEach(d => {
    const el = document.createElement("div");
    el.className = "inv-cal-dow";
    el.textContent = d;
    grid.appendChild(el);
  });
  const year = invCalDate.getFullYear();
  const month = invCalDate.getMonth();
  document.getElementById("invCalMonthLabel").textContent = year + " " + invMonthNames[month];
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 0; i < firstDow; i++) {
    const el = document.createElement("div");
    el.className = "inv-cal-day inv-empty";
    grid.appendChild(el);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const el = document.createElement("div");
    el.className = "inv-cal-day";
    el.textContent = d;
    const thisDate = new Date(year, month, d);
    thisDate.setHours(0, 0, 0, 0);
    if (thisDate < today) {
      el.classList.add("inv-past");
    } else {
      el.onclick = () => invSelectDate(thisDate);
    }
    if (invAnswers.date && thisDate.getTime() === invAnswers.date.getTime()) el.classList.add("inv-selected");
    grid.appendChild(el);
  }
}

function invChangeMonth(delta) {
  invCalDate.setMonth(invCalDate.getMonth() + delta);
  invRenderCalendar();
}

function invSelectDate(d) {
  invAnswers.date = d;
  invRenderCalendar();
  document.getElementById("invDateLabel").textContent =
    d.toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric" }) + " — тохиролцлоо! 💌";
  document.getElementById("invDateNextBtn").style.display = "inline-block";
}

function invDodge() {
  const box = document.querySelector("#inv-s-final .inv-final-buttons");
  const noBtn = document.getElementById("inv-noBtn");
  if (!box || !noBtn) return;
  const bw = box.clientWidth, bh = box.clientHeight;
  const nw = noBtn.offsetWidth, nh = noBtn.offsetHeight;
  const maxX = Math.max(bw - nw - 10, 0);
  const maxY = Math.max(bh - nh - 10, 0);
  noBtn.style.left = (Math.random() * maxX) + "px";
  noBtn.style.top = (Math.random() * maxY) + "px";
  noBtn.style.transform = "none";
}

function invHeartBurst(total, hearts) {
  const layer = document.getElementById("inv-heartRain");
  if (!layer) return;
  for (let i = 0; i < total; i++) {
    setTimeout(() => {
      const h = document.createElement("div");
      h.className = "inv-heart-fall";
      h.textContent = hearts[Math.floor(Math.random() * hearts.length)];
      h.style.left = Math.random() * 100 + "vw";
      const dur = 2.5 + Math.random() * 2.5;
      h.style.animationDuration = dur + "s";
      h.style.fontSize = (16 + Math.random() * 20) + "px";
      layer.appendChild(h);
      setTimeout(() => h.remove(), dur * 1000 + 300);
    }, i * 45);
  }
}

function invCelebrateDate() {
  invGoTo("inv-s-celebrate");
  const dateStr = invAnswers.date
    ? invAnswers.date.toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric" })
    : "(огноо сонгогдоогүй)";
  document.getElementById("invSummaryBox").innerHTML =
    "📍 Хаашаа: <b>" + escapeHtml(invAnswers.q1 || "—") + "</b><br>" +
    "✨ Юу хийх: <b>" + escapeHtml(invAnswers.q2 || "—") + "</b><br>" +
    "⏰ Хэзээ өдрийн цаг: <b>" + escapeHtml(invAnswers.q3 || "—") + "</b><br>" +
    "📅 Болзооны өдөр: <b>" + escapeHtml(dateStr) + "</b>";
  invHeartBurst(60, ["❤️","💕","💗","💖","💘"]);
  setTimeout(() => invHeartBurst(40, ["❤️","💕","💗","💖"]), 1800);
}

// ================= ГЭРЛЭХ САНАЛ (энгийн хувилбар — асуулт/огноо шаардахгүй) =================
function renderProposalExperience(recipientName, customMessage) {
  const app = document.getElementById("inviteRoot");
  const heading = recipientName ? `${escapeHtml(recipientName)} аа, чамд нэг асуулт байна...` : "Чамд нэг асуулт байна...";
  app.innerHTML = `
  <div id="inviteApp">
    <div id="inv-petals"></div>
    <div id="inv-heartRain"></div>
    <div id="inv-stage">
      <div class="inv-card active" id="inv-s-intro">
        <div class="inv-eyebrow">Хамгийн чухал асуулт</div>
        <h1>${heading}</h1>
        <p class="inv-sub">${customMessage ? escapeHtml(customMessage) : "Миний амьдралын хамгийн онцгой хүн чи."}</p>
        <div class="inv-final-buttons">
          <button class="inv-btn" id="inv-yesBtn" type="button" onclick="invCelebrateProposal()">Тийм ээ! 💍</button>
          <button class="inv-btn inv-btn-ghost" id="inv-noBtn" type="button"
            onmouseenter="invDodge()" ontouchstart="invDodge(); event.preventDefault();">Үгүй</button>
        </div>
      </div>
      <div class="inv-card" id="inv-s-celebrate">
        <div class="inv-eyebrow">Баяр хүргэе 🎉</div>
        <h1>Тэгвэл гэрлэцгээе! 💍</h1>
        <p class="inv-sub">Энэ бол чиний амьдралын хамгийн сайхан "тийм" гэсэн үг байсан гэдэгт итгэлтэй байна 🥹</p>
      </div>
    </div>
  </div>`;
  invStartPetals();
}

function invCelebrateProposal() {
  invGoTo("inv-s-celebrate");
  invHeartBurst(60, ["❤️","💍","💕","💖","💘"]);
  setTimeout(() => invHeartBurst(40, ["❤️","💍","💕","💖"]), 1800);
}
