// ===== УРИЛГА (invitation builder) =====
// Илгээгч Google/имэйлээр нэвтэрсэн байх ёстой (Firestore-д invites/{id} баримт үүсгэнэ,
// senderUid-аар хамаарна). QR/холбоос нь ?id= — тухайн Firestore баримтын ID.
// Хүлээн авагч НЭВТРЭХ ШААРДЛАГАГҮЙ: холбоос өөрөө нэг удаагийн "нууц түлхүүр" мэт үүрэг гүйцэтгэнэ,
// хариулмагц response талбарыг нэг л удаа бичиж (status: sent → responded), илгээгч "Миний урилгууд"
// хэсэгт хариултыг харна. Хуучин ?type=&d= холбоосууд (backend-гүй үеийн) уншигдсаар байна (backward-compat).

// family нь тухайн төрөл ямар маягтын/харагдацын логик ашиглахыг заана:
// "event" — ерөнхий гарчиг/огноо/цаг/байршил/мессеж маягт, "wedding" — хосын нэртэй маягт,
// "date"/"proposal" — тусгай интерактив урсгал.
const INVITE_TYPES = {
  birthday:  { label: "Төрсөн өдөр",           emoji: "🎂", family: "birthday", group: "event" },
  party:     { label: "Үдэшлэг",                emoji: "🥳", family: "party", group: "event" },
  meeting:   { label: "Уулзалт",                emoji: "👥", family: "meeting", group: "event" },
  work:      { label: "Ажлын арга хэмжээ",      emoji: "💼", family: "work", group: "event" },
  education: { label: "Боловсрол",              emoji: "🎓", family: "education", group: "event" },
  sport:     { label: "Спорт",                  emoji: "🏆", family: "sport", group: "event" },
  culture:   { label: "Соёл урлаг",             emoji: "🎭", family: "culture", group: "event" },
  other:     { label: "Бусад",                  emoji: "🚀", family: "event", group: "event" },
  wedding:   { label: "Хурим",                  emoji: "💍", family: "wedding", desc: "Хосын түүх, RSVP, дуу хүсэлт бүхий интерактив урилга" },
  date:      { label: "Болзоо",                 emoji: "💕", family: "date", desc: "Хамт болзох уу гэж асуудаг интерактив урилга" },
  proposal:  { label: "Гэрлэх санал",           emoji: "💐", family: "proposal", desc: "Амьдралын хамгийн чухал асуултаа тавь" },
  family:    { label: "Гэр бүлийн арга хэмжээ", emoji: "👶", family: "family" },
  holiday:   { label: "Баярын урилга",          emoji: "🎊", family: "holiday" },
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

// Идэвхтэй хүлээн авагчийн Firestore invite ID (?id= холбоосоор орж ирсэн бол).
// Хуучин ?type=&d= холбоосоор орж ирсэн бол null хэвээр — тэр тохиолдолд хариулт хадгалагдахгүй.
let currentInviteId = null;
let currentInviteResponded = false;

function initInvitePage() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const type = params.get("type");
  const d = params.get("d");
  if (id) { loadInviteById(id); return; }
  if (type && INVITE_TYPES[type] && d) {
    const data = decodeInviteData(d);
    if (data) { renderInviteView(type, data); return; }
  }
  renderTypePicker();
}

async function loadInviteById(id) {
  document.getElementById("inviteRoot").innerHTML = `<p style="padding:60px 0;text-align:center;color:var(--text-light);">Ачааллаж байна...</p>`;
  if (typeof db === "undefined" || !db) { renderTypePicker(); return; }
  try {
    const snap = await db.collection("invites").doc(id).get();
    if (!snap.exists) {
      document.getElementById("inviteRoot").innerHTML = `
        <div class="inv-view-card"><div class="icon">😕</div><h2>Урилга олдсонгүй</h2>
        <p style="color:var(--text-light);">Холбоос буруу эсвэл устсан байж магадгүй.</p></div>`;
      return;
    }
    const inv = snap.data();
    if (!INVITE_TYPES[inv.type]) { renderTypePicker(); return; }
    currentInviteId = id;
    currentInviteResponded = inv.status === "responded";
    renderInviteView(inv.type, inv.data || {}, inv);
  } catch (e) {
    console.warn("loadInviteById error:", e);
    document.getElementById("inviteRoot").innerHTML = `
      <div class="inv-view-card"><div class="icon">⚠️</div><h2>Алдаа гарлаа</h2>
      <p style="color:var(--text-light);">Дахин ачаална уу.</p></div>`;
  }
}

// currentInviteId-тэй бол хариултыг Firestore-д нэг л удаа бичнэ (status: sent → responded).
// Хуучин ?d= холбоос (currentInviteId===null) эсвэл db байхгүй үед чимээгүй алгасна.
async function submitInviteResponse(response) {
  if (!currentInviteId || currentInviteResponded) return;
  if (typeof db === "undefined" || !db || typeof firebase === "undefined") return;
  currentInviteResponded = true;
  try {
    await db.collection("invites").doc(currentInviteId).update({
      status: "responded",
      response: { ...response, respondedAt: firebase.firestore.FieldValue.serverTimestamp() },
    });
  } catch (e) { console.warn("submitInviteResponse error:", e); }
}

function renderTypePicker() {
  const eventTypes = Object.entries(INVITE_TYPES).filter(([, t]) => t.group === "event");
  const otherTypes = Object.entries(INVITE_TYPES).filter(([, t]) => !t.group);
  document.getElementById("inviteRoot").innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
      <div>
        <h1 style="margin-bottom:6px;">💌 Урилга үүсгэх</h1>
        <p style="color:var(--text-light);margin-bottom:16px;">Төрлөө сонгоод, дэлгэрэнгүйгээ бөглөөд шууд QR код хэлбэрээр аваарай.</p>
      </div>
      <button type="button" class="btn btn-ghost" style="white-space:nowrap;" onclick="renderMyInvites()">📋 Миний урилгууд</button>
    </div>
    <div class="section-title"><h2 style="font-size:16px;">🎉 Үйл ажиллагаа</h2></div>
    <div class="inv-type-grid inv-type-grid-sub">
      ${eventTypes.map(([id, t]) => `
        <div class="inv-type-card inv-type-card-sub" onclick="invStartBuilder('${id}')">
          <div class="icon">${t.emoji}</div>
          <h3>${t.label}</h3>
        </div>`).join("")}
    </div>
    <div class="section-title" style="margin-top:22px;"><h2 style="font-size:16px;">Бусад төрөл</h2></div>
    <div class="inv-type-grid">
      ${otherTypes.map(([id, t]) => `
        <div class="inv-type-card" onclick="invStartBuilder('${id}')">
          <div class="icon">${t.emoji}</div>
          <h3>${t.label}</h3>
          <p>${t.desc || ""}</p>
        </div>`).join("")}
    </div>`;
}

function selectInviteType(type) {
  const t = INVITE_TYPES[type];
  if (!t) return;
  if (t.family === "date") return renderDateForm();
  if (t.family === "proposal") return renderProposalForm();
  if (t.family === "wedding") return renderWeddingForm();
  if (t.family === "birthday") return renderBirthdayForm();
  if (t.family === "work") return renderWorkForm();
  if (t.family === "family") return renderFamilyForm();
  if (t.family === "holiday") return renderHolidayForm();
  if (t.family === "party") return renderPartyForm();
  if (t.family === "meeting") return renderMeetingForm();
  if (t.family === "education") return renderEducationForm();
  if (t.family === "sport") return renderSportForm();
  if (t.family === "culture") return renderCultureForm();
  renderGenericForm(type);
}

function renderGenericForm(type) {
  const t = INVITE_TYPES[type];
  const isWedding = t.family === "wedding";
  document.getElementById("inviteRoot").innerHTML = `
    <a class="back-btn" onclick="renderTypePicker()">← Буцах</a>
    <h2 style="margin:10px 0 4px;">${t.emoji} ${t.label} урилга</h2>
    <div class="inv-form">
      ${isWedding
        ? `<div class="form-group"><label>Хосын нэр</label><input id="invField1" placeholder="Бат & Сараа"></div>`
        : `<div class="form-group"><label>Гарчиг</label><input id="invField1" placeholder="жишээ: ${escapeHtml(t.label)}"></div>`}
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
    <p style="color:var(--text-light);font-size:13px;margin-bottom:16px;">Энэ бол интерактив урилга — хүлээн авагч 4 асуултад хариулж, огноо сонгоод, эцэст нь "Тийм" эсвэл "Үгүй" гэж хариулна.</p>
    <div class="inv-form">
      <div class="form-group"><label>Хэнд зориулав вэ? (заавал биш)</label><input id="invField1" placeholder="жишээ: Наранцэцэг"></div>
      <button class="btn btn-primary" style="width:100%" type="button" onclick="generateInviteQr('date')">📱 QR код үүсгэх</button>
    </div>`;
}

function renderProposalForm() {
  document.getElementById("inviteRoot").innerHTML = `
    <a class="back-btn" onclick="renderTypePicker()">← Буцах</a>
    <h2 style="margin:10px 0 4px;">💐 Гэрлэх санал</h2>
    <p style="color:var(--text-light);font-size:13px;margin-bottom:16px;">Дурсамж, сонирхолтой баримт, тоолж эргэлзүүлэх мөч бүхий интерактив урилга.</p>
    <div class="inv-form">
      <div class="form-group"><label>Хэнд зориулав вэ?</label><input id="invField1" placeholder="жишээ: Наранцэцэг"></div>
      <div class="form-group"><label>Нандин дурсамж (заавал биш)</label><textarea id="invExtra1" rows="2" placeholder="Жишээ: Анх танилцсан өдрөө санаж байна уу?"></textarea></div>
      <div class="form-group"><label>Сонирхолтой баримтууд (мөр бүрд нэг, заавал биш)</label><textarea id="invExtra2" rows="3" placeholder="Хамт X жил байна&#10;Y газар анх уулзсан&#10;Z дуртай зүйл хоёулаа адилхан"></textarea></div>
      <div class="form-group"><label>Хувийн мессеж (заавал биш)</label><textarea id="invMessage" rows="3" placeholder="Чиний хэлмээр байгаа зүйлээ бичээрэй..."></textarea></div>
      <button class="btn btn-primary" style="width:100%" type="button" onclick="generateInviteQr('proposal')">📱 QR код үүсгэх</button>
    </div>`;
}

function renderWeddingForm() {
  document.getElementById("inviteRoot").innerHTML = `
    <a class="back-btn" onclick="renderTypePicker()">← Буцах</a>
    <h2 style="margin:10px 0 4px;">💍 Хуримын урилга</h2>
    <p style="color:var(--text-light);font-size:13px;margin-bottom:16px;">Хосын түүх, RSVP, хувцасны код, дуу хүсэлт зэрэгтэй интерактив урилга.</p>
    <div class="inv-form">
      <div class="form-group"><label>Хосын нэр</label><input id="invField1" placeholder="Бат & Сараа"></div>
      <div class="form-group"><label>Огноо</label><input type="date" id="invDate"></div>
      <div class="form-group"><label>Цаг</label><input type="time" id="invTime"></div>
      <div class="form-group"><label>Байршил</label><input id="invLocation" placeholder="жишээ: ... зочид буудал"></div>
      <div class="form-group"><label>Хосын түүх (заавал биш)</label><textarea id="invExtra1" rows="2" placeholder="Бид хэрхэн танилцсан бэ?"></textarea></div>
      <div class="form-group"><label>Хувцасны код (заавал биш)</label><input id="invExtra2" placeholder="жишээ: Хөх, цагаан өнгийн загвар"></div>
      <div class="form-group"><label>Мессеж / бэлгийн тухай тэмдэглэл (заавал биш)</label><textarea id="invMessage" rows="2" placeholder="Бэлгийн оронд ерөөл хүсье гэх мэт..."></textarea></div>
      <button class="btn btn-primary" style="width:100%" type="button" onclick="generateInviteQr('wedding')">📱 QR код үүсгэх</button>
    </div>`;
}

function renderBirthdayForm() {
  document.getElementById("inviteRoot").innerHTML = `
    <a class="back-btn" onclick="renderTypePicker()">← Буцах</a>
    <h2 style="margin:10px 0 4px;">🎂 Төрсөн өдрийн урилга</h2>
    <div class="inv-form">
      <div class="form-group"><label>Хэний төрсөн өдөр вэ?</label><input id="invField1" placeholder="жишээ: Болороо"></div>
      <div class="form-group"><label>Огноо</label><input type="date" id="invDate"></div>
      <div class="form-group"><label>Цаг</label><input type="time" id="invTime"></div>
      <div class="form-group"><label>Байршил</label><input id="invLocation" placeholder="жишээ: ... кафе"></div>
      <div class="form-group"><label>Мессеж (заавал биш)</label><textarea id="invMessage" rows="3" placeholder="Урилгын дэлгэрэнгүй..."></textarea></div>
      <button class="btn btn-primary" style="width:100%" type="button" onclick="generateInviteQr('birthday')">📱 QR код үүсгэх</button>
    </div>`;
}

function renderWorkForm() {
  document.getElementById("inviteRoot").innerHTML = `
    <a class="back-btn" onclick="renderTypePicker()">← Буцах</a>
    <h2 style="margin:10px 0 4px;">💼 Ажлын арга хэмжээний урилга</h2>
    <div class="inv-form">
      <div class="form-group"><label>Арга хэмжээний нэр</label><input id="invField1" placeholder="жишээ: Улирлын дүгнэлт"></div>
      <div class="form-group"><label>Огноо</label><input type="date" id="invDate"></div>
      <div class="form-group"><label>Цаг</label><input type="time" id="invTime"></div>
      <div class="form-group"><label>Байршил</label><input id="invLocation" placeholder="жишээ: ... оффис"></div>
      <div class="form-group"><label>Хөтөлбөр (мөр бүрд нэг зүйл, заавал биш)</label><textarea id="invExtra1" rows="3" placeholder="09:00 Нээлт&#10;10:00 Илтгэл&#10;12:00 Үдийн хоол"></textarea></div>
      <div class="form-group"><label>Хувцасны код (заавал биш)</label><input id="invExtra2" placeholder="жишээ: Business casual"></div>
      <button class="btn btn-primary" style="width:100%" type="button" onclick="generateInviteQr('work')">📱 QR код үүсгэх</button>
    </div>`;
}

function renderFamilyForm() {
  document.getElementById("inviteRoot").innerHTML = `
    <a class="back-btn" onclick="renderTypePicker()">← Буцах</a>
    <h2 style="margin:10px 0 4px;">👶 Гэр бүлийн арга хэмжээний урилга</h2>
    <div class="inv-form">
      <div class="form-group"><label>Арга хэмжээний нэр</label><input id="invField1" placeholder="жишээ: Нэрийн өдөр"></div>
      <div class="form-group"><label>Огноо</label><input type="date" id="invDate"></div>
      <div class="form-group"><label>Цаг</label><input type="time" id="invTime"></div>
      <div class="form-group"><label>Байршил</label><input id="invLocation" placeholder="жишээ: гэрийн хаяг"></div>
      <div class="form-group"><label>Юу авчрах вэ (заавал биш)</label><input id="invExtra1" placeholder="жишээ: хүүхдийн хоол, тоглоом"></div>
      <div class="form-group"><label>Мессеж (заавал биш)</label><textarea id="invMessage" rows="2" placeholder="Урилгын дэлгэрэнгүй..."></textarea></div>
      <button class="btn btn-primary" style="width:100%" type="button" onclick="generateInviteQr('family')">📱 QR код үүсгэх</button>
    </div>`;
}

function renderHolidayForm() {
  document.getElementById("inviteRoot").innerHTML = `
    <a class="back-btn" onclick="renderTypePicker()">← Буцах</a>
    <h2 style="margin:10px 0 4px;">🎊 Баярын урилга</h2>
    <div class="inv-form">
      <div class="form-group"><label>Ямар баяр вэ?</label><input id="invField1" placeholder="жишээ: Шинэ жил, Цагаан сар"></div>
      <div class="form-group"><label>Огноо</label><input type="date" id="invDate"></div>
      <div class="form-group"><label>Цаг</label><input type="time" id="invTime"></div>
      <div class="form-group"><label>Байршил</label><input id="invLocation" placeholder="жишээ: гэрийн хаяг"></div>
      <div class="form-group"><label>Мессеж (заавал биш)</label><textarea id="invMessage" rows="2" placeholder="Баярын мэндчилгээ..."></textarea></div>
      <button class="btn btn-primary" style="width:100%" type="button" onclick="generateInviteQr('holiday')">📱 QR код үүсгэх</button>
    </div>`;
}

function renderPartyForm() {
  document.getElementById("inviteRoot").innerHTML = `
    <a class="back-btn" onclick="renderTypePicker()">← Буцах</a>
    <h2 style="margin:10px 0 4px;">🥳 Үдэшлэгийн урилга</h2>
    <div class="inv-form">
      <div class="form-group"><label>Үдэшлэгийн нэр</label><input id="invField1" placeholder="жишээ: Хаус парти"></div>
      <div class="form-group"><label>Огноо</label><input type="date" id="invDate"></div>
      <div class="form-group"><label>Цаг</label><input type="time" id="invTime"></div>
      <div class="form-group"><label>Байршил</label><input id="invLocation" placeholder="жишээ: ... хаяг"></div>
      <div class="form-group"><label>Сэдэв/dress code (заавал биш)</label><input id="invExtra1" placeholder="жишээ: 90-ээд оны маскарад"></div>
      <div class="form-group"><label>Мессеж (заавал биш)</label><textarea id="invMessage" rows="2" placeholder="Урилгын дэлгэрэнгүй..."></textarea></div>
      <button class="btn btn-primary" style="width:100%" type="button" onclick="generateInviteQr('party')">📱 QR код үүсгэх</button>
    </div>`;
}

function renderMeetingForm() {
  document.getElementById("inviteRoot").innerHTML = `
    <a class="back-btn" onclick="renderTypePicker()">← Буцах</a>
    <h2 style="margin:10px 0 4px;">👥 Уулзалтын урилга</h2>
    <div class="inv-form">
      <div class="form-group"><label>Уулзалтын нэр</label><input id="invField1" placeholder="жишээ: Төслийн уулзалт"></div>
      <div class="form-group"><label>Огноо</label><input type="date" id="invDate"></div>
      <div class="form-group"><label>Цаг</label><input type="time" id="invTime"></div>
      <div class="form-group"><label>Байршил</label><input id="invLocation" placeholder="жишээ: ... кафе"></div>
      <div class="form-group"><label>Зорилго (заавал биш)</label><textarea id="invExtra1" rows="2" placeholder="Юуны талаар ярилцах вэ?"></textarea></div>
      <button class="btn btn-primary" style="width:100%" type="button" onclick="generateInviteQr('meeting')">📱 QR код үүсгэх</button>
    </div>`;
}

function renderEducationForm() {
  document.getElementById("inviteRoot").innerHTML = `
    <a class="back-btn" onclick="renderTypePicker()">← Буцах</a>
    <h2 style="margin:10px 0 4px;">🎓 Боловсролын арга хэмжээний урилга</h2>
    <div class="inv-form">
      <div class="form-group"><label>Арга хэмжээний нэр</label><input id="invField1" placeholder="жишээ: Төгсөлтийн ёслол"></div>
      <div class="form-group"><label>Огноо</label><input type="date" id="invDate"></div>
      <div class="form-group"><label>Цаг</label><input type="time" id="invTime"></div>
      <div class="form-group"><label>Байршил</label><input id="invLocation" placeholder="жишээ: ... сургууль"></div>
      <div class="form-group"><label>Хөтөлбөр (мөр бүрд нэг зүйл, заавал биш)</label><textarea id="invExtra1" rows="3" placeholder="Нээлт&#10;Илтгэл&#10;Гэрчилгээ гардуулах"></textarea></div>
      <button class="btn btn-primary" style="width:100%" type="button" onclick="generateInviteQr('education')">📱 QR код үүсгэх</button>
    </div>`;
}

function renderSportForm() {
  document.getElementById("inviteRoot").innerHTML = `
    <a class="back-btn" onclick="renderTypePicker()">← Буцах</a>
    <h2 style="margin:10px 0 4px;">🏆 Спортын арга хэмжээний урилга</h2>
    <div class="inv-form">
      <div class="form-group"><label>Арга хэмжээний нэр</label><input id="invField1" placeholder="жишээ: Хөлбөмбөгийн тэмцээн"></div>
      <div class="form-group"><label>Огноо</label><input type="date" id="invDate"></div>
      <div class="form-group"><label>Цаг</label><input type="time" id="invTime"></div>
      <div class="form-group"><label>Байршил</label><input id="invLocation" placeholder="жишээ: ... талбай"></div>
      <div class="form-group"><label>Юу авч явах вэ (заавал биш)</label><input id="invExtra1" placeholder="жишээ: спорт хувцас, ус"></div>
      <button class="btn btn-primary" style="width:100%" type="button" onclick="generateInviteQr('sport')">📱 QR код үүсгэх</button>
    </div>`;
}

function renderCultureForm() {
  document.getElementById("inviteRoot").innerHTML = `
    <a class="back-btn" onclick="renderTypePicker()">← Буцах</a>
    <h2 style="margin:10px 0 4px;">🎭 Соёл урлагийн арга хэмжээний урилга</h2>
    <div class="inv-form">
      <div class="form-group"><label>Арга хэмжээний нэр</label><input id="invField1" placeholder="жишээ: Театрын үзүүлбэр"></div>
      <div class="form-group"><label>Огноо</label><input type="date" id="invDate"></div>
      <div class="form-group"><label>Цаг</label><input type="time" id="invTime"></div>
      <div class="form-group"><label>Байршил</label><input id="invLocation" placeholder="жишээ: ... театр"></div>
      <div class="form-group"><label>Хувцасны код (заавал биш)</label><input id="invExtra1" placeholder="жишээ: Албан ёсны хувцас"></div>
      <button class="btn btn-primary" style="width:100%" type="button" onclick="generateInviteQr('culture')">📱 QR код үүсгэх</button>
    </div>`;
}

async function generateInviteQr(type) {
  const t = INVITE_TYPES[type];
  let data = {};
  if (t.family === "wedding") data = { names: invVal("invField1"), date: invVal("invDate"), time: invVal("invTime"), location: invVal("invLocation"), loveStory: invVal("invExtra1"), dressCode: invVal("invExtra2"), message: invVal("invMessage") };
  else if (t.family === "birthday") data = { recipient: invVal("invField1"), date: invVal("invDate"), time: invVal("invTime"), location: invVal("invLocation"), message: invVal("invMessage") };
  else if (t.family === "work") data = { title: invVal("invField1"), date: invVal("invDate"), time: invVal("invTime"), location: invVal("invLocation"), agenda: invVal("invExtra1"), dressCode: invVal("invExtra2") };
  else if (t.family === "family") data = { title: invVal("invField1"), date: invVal("invDate"), time: invVal("invTime"), location: invVal("invLocation"), bring: invVal("invExtra1"), message: invVal("invMessage") };
  else if (t.family === "holiday") data = { holidayName: invVal("invField1"), date: invVal("invDate"), time: invVal("invTime"), location: invVal("invLocation"), message: invVal("invMessage") };
  else if (t.family === "party") data = { title: invVal("invField1"), date: invVal("invDate"), time: invVal("invTime"), location: invVal("invLocation"), theme: invVal("invExtra1"), message: invVal("invMessage") };
  else if (t.family === "meeting") data = { title: invVal("invField1"), date: invVal("invDate"), time: invVal("invTime"), location: invVal("invLocation"), purpose: invVal("invExtra1") };
  else if (t.family === "education") data = { title: invVal("invField1"), date: invVal("invDate"), time: invVal("invTime"), location: invVal("invLocation"), program: invVal("invExtra1") };
  else if (t.family === "sport") data = { title: invVal("invField1"), date: invVal("invDate"), time: invVal("invTime"), location: invVal("invLocation"), gear: invVal("invExtra1") };
  else if (t.family === "culture") data = { title: invVal("invField1"), date: invVal("invDate"), time: invVal("invTime"), location: invVal("invLocation"), dressCode: invVal("invExtra1") };
  else if (t.family === "event") data = { title: invVal("invField1"), date: invVal("invDate"), time: invVal("invTime"), location: invVal("invLocation"), message: invVal("invMessage") };
  else if (t.family === "proposal") data = { recipient: invVal("invField1"), memory: invVal("invExtra1"), funFacts: invVal("invExtra2"), message: invVal("invMessage") };
  else if (t.family === "date") data = { recipient: invVal("invField1") };

  if (typeof currentUser === "undefined" || !currentUser) {
    showToast("⚠️ Урилга илгээхийн тулд эхлээд нэвтэрнэ үү");
    if (typeof openAuth === "function") openAuth("login");
    return;
  }
  if (typeof db === "undefined" || !db) { showToast("⚠️ Firebase холбогдоогүй байна"); return; }

  showToast("⏳ Урилгаа үүсгэж байна...");
  try {
    const ref = await db.collection("invites").add({
      type, data,
      senderUid: currentUser.uid,
      senderName: currentUser.name || "",
      status: "sent",
      response: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    const url = `${location.origin}${location.pathname}?id=${ref.id}`;
    showInviteQr(url);
  } catch (e) {
    showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || ""));
  }
}

function showInviteQr(url) {
  const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`;
  document.getElementById("inviteRoot").innerHTML = `
    <a class="back-btn" onclick="renderTypePicker()">← Шинэ урилга үүсгэх</a>
    <div class="inv-qr-box">
      <img src="${qrImg}" width="240" height="240" alt="QR код">
      <p style="font-size:13px;color:var(--text-light);margin-bottom:10px;">Энэ QR кодыг уншуулж эсвэл доорх холбоосыг илгээж урилгаа хуваалцаарай. Хүлээн авагч хариулмагц хариултыг чиний "Миний урилгууд" жагсаалтад харах боломжтой.</p>
      <div class="inv-link-row">
        <input type="text" readonly value="${escapeHtml(url)}" id="inviteLinkInput" onclick="this.select()">
        <button class="btn btn-primary" type="button" onclick="copyInviteLink()">Хуулах</button>
      </div>
      <button class="btn btn-ghost" type="button" style="margin-top:14px;width:100%" onclick="renderMyInvites()">📋 Миний урилгуудыг харах</button>
    </div>`;
}

function copyInviteLink() {
  const input = document.getElementById("inviteLinkInput");
  if (!input) return;
  input.select();
  if (navigator.clipboard) navigator.clipboard.writeText(input.value).then(() => showToast("🔗 Холбоос хуулагдлаа!"));
}

// ---------- Илгээгчийн "Миний урилгууд" жагсаалт (хариулт хараагаад) ----------
async function renderMyInvites() {
  if (typeof currentUser === "undefined" || !currentUser) {
    showToast("⚠️ Эхлээд нэвтэрнэ үү");
    if (typeof openAuth === "function") openAuth("login");
    return;
  }
  document.getElementById("inviteRoot").innerHTML = `
    <a class="back-btn" onclick="renderTypePicker()">← Буцах</a>
    <h2 style="margin:10px 0 16px;">📋 Миний илгээсэн урилгууд</h2>
    <div class="inv-my-list" id="myInvitesList"><p style="color:var(--text-light);">Ачааллаж байна...</p></div>`;
  if (typeof db === "undefined" || !db) return;
  try {
    const snap = await db.collection("invites")
      .where("senderUid", "==", currentUser.uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    const list = document.getElementById("myInvitesList");
    if (!list) return;
    if (snap.empty) { list.innerHTML = `<p style="color:var(--text-light);">Та одоогоор урилга илгээгээгүй байна.</p>`; return; }
    list.innerHTML = snap.docs.map(doc => {
      const inv = doc.data();
      const t = INVITE_TYPES[inv.type] || { label: inv.type, emoji: "💌" };
      const responded = inv.status === "responded";
      const idata = inv.data || {};
      const who = idata.recipient || idata.names || idata.title || idata.holidayName || "";
      const when = inv.createdAt && inv.createdAt.toDate ? inv.createdAt.toDate().toLocaleDateString("mn-MN") : "";
      return `
      <div class="inv-my-item ${responded ? "inv-my-responded" : ""}">
        <div class="inv-my-head">
          <span class="inv-my-emoji">${t.emoji}</span>
          <div class="inv-my-info">
            <div class="inv-my-title">${escapeHtml(t.label)}${who ? " — " + escapeHtml(who) : ""}</div>
            <div class="inv-my-date">${escapeHtml(when)}</div>
          </div>
          <span class="inv-my-status ${responded ? "responded" : ""}">${responded ? "✅ Хариулсан" : "⏳ Хүлээгдэж байна"}</span>
        </div>
        ${responded && inv.response ? `<div class="inv-my-response">${formatInviteResponse(inv.response)}</div>` : ""}
      </div>`;
    }).join("");
  } catch (e) {
    console.warn("renderMyInvites error:", e);
    const list = document.getElementById("myInvitesList");
    if (list) list.innerHTML = `<p style="color:var(--text-light);">⚠️ Ачаалахад алдаа гарлаа.</p>`;
  }
}

// Төрөл бүрийн response object-д давхцаж болох талбаруудыг нэг стандарт байдлаар харуулна
function formatInviteResponse(r) {
  const parts = [];
  if (r.q1) parts.push("📍 Хаашаа: <b>" + escapeHtml(r.q1) + "</b>");
  if (r.q2) parts.push("✨ Юу хийх: <b>" + escapeHtml(r.q2) + "</b>");
  if (r.q3) parts.push("⏰ Цаг: <b>" + escapeHtml(r.q3) + "</b>");
  if (r.q4) parts.push("🍽 Хоол: <b>" + escapeHtml(r.q4) + "</b>");
  if (r.date) parts.push("📅 Огноо: <b>" + escapeHtml(r.date) + "</b>");
  if (typeof r.clickerScore === "number") parts.push("💗 Зүрх дарах оноо: <b>" + r.clickerScore + "</b>");
  if (r.answer === "yes") parts.push("💍 Хариулт: <b>Тийм ээ!</b>");
  if (r.rsvp) parts.push("✅ RSVP: <b>" + escapeHtml(r.rsvp) + "</b>");
  if (r.meal) parts.push("🍽 Хоолны сонголт: <b>" + escapeHtml(r.meal) + "</b>");
  if (r.guests) parts.push("👨‍👩‍👧 Хүний тоо: <b>" + escapeHtml(r.guests) + "</b>");
  if (r.song) parts.push("🎵 Дуу хүсэлт: <b>" + escapeHtml(r.song) + "</b>");
  if (r.wish) parts.push("💌 " + escapeHtml(r.wish));
  return parts.join("<br>") || "—";
}

// ---------- Recipient view ----------
// targetId: сонголтоор — Урилга builder-ийн phone preview (Phase 3) яг ижил renderer-ийг
// #inviteRoot-оос өөр container-т mount хийхэд ашиглана. Бодит хүлээн авагчийн урсгал
// (loadInviteById) targetId дамжуулдаггүй тул үргэлж өнөөгийн адилхан "inviteRoot" руу ордог.
function renderInviteView(type, data, invite, targetId) {
  const t = INVITE_TYPES[type];
  if (t.family === "date") return renderDateInviteExperience(data.recipient || "", invite, targetId);
  if (t.family === "proposal") return renderProposalExperience(data.recipient || "", data, invite, targetId);
  if (t.family === "wedding") return renderWeddingExperience(data, invite, targetId);
  if (t.family === "birthday") return renderBirthdayExperience(data, invite, targetId);
  if (t.family === "work") return renderWorkExperience(data, invite, targetId);
  if (t.family === "family") return renderFamilyExperience(data, invite, targetId);
  if (t.family === "holiday") return renderHolidayExperience(data, invite, targetId);
  if (t.family === "party") return renderPartyExperience(data, invite, targetId);
  if (t.family === "meeting") return renderMeetingExperience(data, invite, targetId);
  if (t.family === "education") return renderEducationExperience(data, invite, targetId);
  if (t.family === "sport") return renderSportExperience(data, invite, targetId);
  if (t.family === "culture") return renderCultureExperience(data, invite, targetId);

  document.getElementById(targetId || "inviteRoot").innerHTML = `
    <div class="inv-view-card">
      <div class="icon">${t.emoji}</div>
      <h2>${escapeHtml(data.title || t.label)}</h2>
      <div class="inv-view-detail">
        📅 ${escapeHtml(data.date || "Тодорхойгүй")}${data.time ? " · " + escapeHtml(data.time) : ""}<br>
        📍 ${escapeHtml(data.location || "Тодорхойгүй")}
        ${data.message ? `<br><br>💌 ${escapeHtml(data.message)}` : ""}
      </div>
    </div>`;
}

// ================= БОЛЗООНЫ ИНТЕРАКТИВ УРИЛГА (дасан зохицуулсан, эх загвар) =================
const invAnswers = { q1: null, q2: null, q3: null, q4: null, date: null };
let invCalDate = new Date();
const invMonthNames = ["1-р сар","2-р сар","3-р сар","4-р сар","5-р сар","6-р сар","7-р сар","8-р сар","9-р сар","10-р сар","11-р сар","12-р сар"];
const invDowNames = ["Ням","Дав","Мяг","Лха","Пүр","Баа","Бям"];

function renderDateInviteExperience(recipientName, invite, targetId) {
  targetId = targetId || "inviteRoot";
  const app = document.getElementById(targetId);
  const heading = recipientName ? `${escapeHtml(recipientName)} аа, чамайг олоход хэцүү байлаа 👀` : "Хөөх, чамайг олоход хэцүү байлаа 👀";
  const encLines = invPickEncourageSet(true, 2);
  app.innerHTML = `
  <div id="inviteApp">
    <div id="inv-petals"></div>
    <div id="inv-heartRain"></div>
    <div id="inv-stage">
      <div class="inv-card active" id="inv-s-intro" data-step="inv-s-intro">
        <div class="inv-eyebrow">Нэг асуулт байна</div>
        <h1>${heading}</h1>
        <p class="inv-sub">30 секунд өгөөч. Эцэст нь чамд нэг зүйл сонгуулах гэсэн юм.</p>
        <button class="inv-btn" type="button" onclick="invAdvance()">Эхлэх ✨</button>
      </div>
      <div class="inv-card" id="inv-s-q1" data-step="inv-s-q1" data-group="q">
        <div class="inv-eyebrow">Асуулт</div>
        <h1 style="font-size:32px;">Бид хаашаа явах вэ? 🤔</h1>
        <div class="inv-options" id="inv-opts-q1">
          <div class="inv-opt" data-val="Кино" onclick="invPick('inv-opts-q1', this, 'q1', 'inv-s-q2')"><span class="inv-emoji">🎬</span> Кино үзэх</div>
          <div class="inv-opt" data-val="Кофе" onclick="invPick('inv-opts-q1', this, 'q1', 'inv-s-q2')"><span class="inv-emoji">☕</span> Кофе шоп</div>
          <div class="inv-opt" data-val="Парк" onclick="invPick('inv-opts-q1', this, 'q1', 'inv-s-q2')"><span class="inv-emoji">🌳</span> Парк алхах</div>
          <div class="inv-opt" data-val="Хоол" onclick="invPick('inv-opts-q1', this, 'q1', 'inv-s-q2')"><span class="inv-emoji">🍜</span> Хоол идэх</div>
        </div>
      </div>
      <div class="inv-card" id="inv-s-q2" data-step="inv-s-q2" data-group="q">
        <div class="inv-eyebrow">Асуулт</div>
        <h1 style="font-size:32px;">Юу хийхэд дуртай вэ? 😊</h1>
        <div class="inv-options" id="inv-opts-q2">
          <div class="inv-opt" data-val="Зураг авах" onclick="invPick('inv-opts-q2', this, 'q2', 'inv-s-q3')"><span class="inv-emoji">📸</span> Зураг авах</div>
          <div class="inv-opt" data-val="Тоглоом тоглох" onclick="invPick('inv-opts-q2', this, 'q2', 'inv-s-q3')"><span class="inv-emoji">🎮</span> Тоглоом тоглох</div>
          <div class="inv-opt" data-val="Зүгээр ярилцах" onclick="invPick('inv-opts-q2', this, 'q2', 'inv-s-q3')"><span class="inv-emoji">💬</span> Зүгээр ярилцах</div>
          <div class="inv-opt" data-val="Шинэ юм үзэх" onclick="invPick('inv-opts-q2', this, 'q2', 'inv-s-q3')"><span class="inv-emoji">🎨</span> Шинэ юм үзэх</div>
        </div>
      </div>
      <div class="inv-card" id="inv-s-q3" data-step="inv-s-q3" data-group="q">
        <div class="inv-eyebrow">Асуулт</div>
        <h1 style="font-size:32px;">Хэдэн цагт тохиромжтой вэ? ⏰</h1>
        <div class="inv-options" id="inv-opts-q3">
          <div class="inv-opt" data-val="Өдрөөр" onclick="invPick('inv-opts-q3', this, 'q3', 'inv-s-q4')"><span class="inv-emoji">🌅</span> Өдрөөр</div>
          <div class="inv-opt" data-val="Оройн наашаа" onclick="invPick('inv-opts-q3', this, 'q3', 'inv-s-q4')"><span class="inv-emoji">🌆</span> Оройн наашаа</div>
          <div class="inv-opt" data-val="Шөнөдөө" onclick="invPick('inv-opts-q3', this, 'q3', 'inv-s-q4')"><span class="inv-emoji">🌙</span> Шөнөдөө</div>
        </div>
      </div>
      <div class="inv-card" id="inv-s-q4" data-step="inv-s-q4" data-group="q">
        <div class="inv-eyebrow">Асуулт</div>
        <h1 style="font-size:32px;">Ямар хоол сонирхдог вэ? 🍽</h1>
        <div class="inv-options" id="inv-opts-q4">
          <div class="inv-opt" data-val=" Азийн хоол" onclick="invPick('inv-opts-q4', this, 'q4', 'inv-s-clicker')"><span class="inv-emoji">🍜</span> Azийн хоол</div>
          <div class="inv-opt" data-val="Итали хоол" onclick="invPick('inv-opts-q4', this, 'q4', 'inv-s-clicker')"><span class="inv-emoji">🍕</span> Итали хоол</div>
          <div class="inv-opt" data-val="Монгол хоол" onclick="invPick('inv-opts-q4', this, 'q4', 'inv-s-clicker')"><span class="inv-emoji">🥟</span> Монгол хоол</div>
          <div class="inv-opt" data-val="Хамаагүй" onclick="invPick('inv-opts-q4', this, 'q4', 'inv-s-clicker')"><span class="inv-emoji">🤷</span> Хамаагүй</div>
        </div>
      </div>
      <div class="inv-card" id="inv-s-clicker" data-step="inv-s-clicker">
        <div class="inv-eyebrow">Бонус тоглоом 💕</div>
        <h1 style="font-size:28px;">5 секундэд хэдэн удаа дарж чадах вэ?</h1>
        <p class="inv-sub" id="invClickerSub">Зүрхэн дээр дараад эхэлье!</p>
        <div id="invClickerHeart" onclick="invClickerTap()" style="font-size:80px;cursor:pointer;user-select:none;margin:10px 0 16px;transition:transform .1s;">💗</div>
        <div style="font-size:20px;font-weight:700;color:var(--inv-rose-deep);margin-bottom:16px;">Оноо: <span id="invClickerScore">0</span></div>
        <button class="inv-btn" id="invClickerNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
      </div>
      <div class="inv-card" id="inv-s-memory" data-step="inv-s-memory">
        <div class="inv-eyebrow">Бонус тоглоом 🎮</div>
        <h1 style="font-size:28px;">Хосуудыг олоорой!</h1>
        <p class="inv-sub">Ижил emoji-г олж хос болгоорой ✨</p>
        <div class="inv-mem-grid" id="invMemGrid"></div>
        <button class="inv-btn" id="invMemNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
      </div>
      <div class="inv-card" id="inv-s-poll" data-step="inv-s-poll">
        <div class="inv-eyebrow">Бонус тоглоом 🎮</div>
        <h1 style="font-size:28px;">Хамгийн их дуртай зүйл чинь юу вэ? 💭</h1>
        <div class="inv-options" id="inv-opts-poll">
          <div class="inv-opt" onclick="invPollPick('inv-opts-poll', this, 'inv-s-wheel')"><span class="inv-emoji">😂</span> Хамт инээх мөч</div>
          <div class="inv-opt" onclick="invPollPick('inv-opts-poll', this, 'inv-s-wheel')"><span class="inv-emoji">🤗</span> Чиний тэвэрлэг</div>
          <div class="inv-opt" onclick="invPollPick('inv-opts-poll', this, 'inv-s-wheel')"><span class="inv-emoji">💬</span> Урт ярилцлага</div>
          <div class="inv-opt" onclick="invPollPick('inv-opts-poll', this, 'inv-s-wheel')"><span class="inv-emoji">🌙</span> Чимээгүй хамт байх</div>
        </div>
      </div>
      <div class="inv-card" id="inv-s-wheel" data-step="inv-s-wheel">
        <div class="inv-eyebrow">Азын дугуй 🎡</div>
        <h1 style="font-size:26px;">Манай болзоо ямар байх бол?</h1>
        <div class="inv-wheel-wrap">
          <div class="inv-wheel-pointer">▼</div>
          <div class="inv-wheel" id="invWheel1"></div>
        </div>
        <button class="inv-btn" type="button" onclick="invSpinWheel('invWheel1','invWheelResult1','invWheelNextBtn1', INV_WHEEL_DATE)">🎡 Эргүүл!</button>
        <div id="invWheelResult1"></div>
        <button class="inv-btn" id="invWheelNextBtn1" type="button" style="display:none;margin-top:10px;" onclick="invAdvance()">Дараах →</button>
      </div>
      ${invEncourageChain(["inv-s-enc1", "inv-s-enc2"], encLines, "inv-s-date")}
      <div class="inv-card" id="inv-s-date" data-step="inv-s-date">
        <div class="inv-eyebrow">Сүүлчийн алхам</div>
        <h1 style="font-size:30px;">Хэзээ болзох вэ? 📅</h1>
        <div class="inv-cal-head">
          <button type="button" onclick="invChangeMonth(-1)">‹</button>
          <div class="inv-cal-month" id="invCalMonthLabel"></div>
          <button type="button" onclick="invChangeMonth(1)">›</button>
        </div>
        <div class="inv-cal-grid" id="invCalGrid"></div>
        <div class="inv-date-label" id="invDateLabel">Огноогоо сонгоно уу 👆</div>
        <div class="inv-countdown" id="invDateCountdown" style="display:none;"></div>
        <button class="inv-btn" id="invDateNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
      </div>
      <div class="inv-card" id="inv-s-final" data-step="inv-s-final">
        <div class="inv-eyebrow">Асуулт нь энэ байлаа</div>
        <h1>Чи надтай болзох уу? 💕</h1>
        <p class="inv-sub">Дараа нь бид гоё цаг өнгөрүүлнэ, амлана.</p>
        <div class="inv-final-buttons">
          <button class="inv-btn" id="inv-yesBtn" type="button" onclick="invAdvance()">Зөвшөөрөх ❤️</button>
          <button class="inv-btn inv-btn-ghost" id="inv-noBtn" type="button"
            onclick="invDecline()" onmouseenter="invDodge()" ontouchstart="invDodge(); event.preventDefault();">Үгүй</button>
        </div>
        <button class="inv-btn-text" type="button" onclick="invStartPersuade('inv-s-wish')">бодоод үзье...</button>
        ${INV_RSVP_HINT}
      </div>
      <div class="inv-card" id="inv-s-persuade">
        <div class="inv-persuade-img-wrap"><img id="invPersuadeImg" class="inv-persuade-img" alt="муур"></div>
        <h1 id="invPersuadeText" style="font-size:22px;"></h1>
        <button class="inv-btn" id="invPersuadeYesBtn" type="button" onclick="invGoTo('inv-s-wish')">Тийм, хамт явъя ❤️</button>
        <div style="margin-top:12px;">
          <button class="inv-btn-text" id="invPersuadeNextBtn" type="button" onclick="invPersuadeNext()">дахиад бодъё...</button>
        </div>
      </div>
      <div class="inv-card" id="inv-s-wish" data-step="inv-s-wish">
        <div class="inv-eyebrow">Бараг л боллоо 🥰</div>
        <h1 style="font-size:28px;">Юуг хамгийн ихээр хүлээж байна?</h1>
        <p class="inv-sub">Нэг өгүүлбэрээр бичээрэй (заавал биш)</p>
        <textarea id="invWishInput" rows="3" style="width:100%;border:2px solid var(--inv-line);border-radius:12px;padding:12px;font-family:inherit;font-size:14px;margin-bottom:16px;resize:vertical;" placeholder="Жишээ: Чамтай хамт байхыг хамгийн ихээр хүлээж байна..."></textarea>
        <button class="inv-btn" type="button" onclick="invCelebrateDate()">Дуусгах 🎉</button>
      </div>
      <div class="inv-card" id="inv-s-celebrate" data-step="inv-s-celebrate">
        <div class="inv-eyebrow">Баяр хүргэе 🎉</div>
        <h1>Тэгвэл болзоо болцгооё!</h1>
        <div class="inv-summary" id="invSummaryBox"></div>
        <p class="inv-sub" style="margin-bottom:4px;">Сая асуултыг зөв хариулсанд баярлалаа 🥹</p>
      </div>
    </div>
  </div>`;
  invIndexPages(invite);

  invStartPetals();
  invCalDate = new Date();
  invCalDate.setDate(1);
  invRenderCalendar();
  invSetupMemoryGame("invMemGrid", "invMemNextBtn", invMemDefaultEmojis, "💌");
  invSetupClickerGame();
  invSetupWheel("invWheel1", INV_WHEEL_DATE);
}

function invGoTo(id) {
  document.querySelectorAll("#inviteApp .inv-card").forEach(c => c.classList.remove("active"));
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("active");
  el.style.animation = "none";
  void el.offsetWidth;
  el.style.animation = null;
  if (typeof invRenderProgress === "function") invRenderProgress();
}

function invPick(groupId, el, key, nextScreen) {
  document.querySelectorAll("#" + groupId + " .inv-opt").forEach(o => o.classList.remove("inv-picked"));
  el.classList.add("inv-picked");
  invAnswers[key] = el.dataset.val;
  setTimeout(() => invGoTo(nextScreen), 380);
}

// ---------- 5 секундийн зүрх дарах хурдны тоглоом ----------
let invClickerScore = 0;
let invClickerActive = false;
let invClickerTimer = null;

function invSetupClickerGame() {
  invClickerScore = 0;
  invClickerActive = false;
  if (invClickerTimer) { clearTimeout(invClickerTimer); invClickerTimer = null; }
  const scoreEl = document.getElementById("invClickerScore");
  if (scoreEl) scoreEl.textContent = "0";
  const sub = document.getElementById("invClickerSub");
  if (sub) sub.textContent = "Зүрхэн дээр дараад эхэлье!";
  const nextBtn = document.getElementById("invClickerNextBtn");
  if (nextBtn) nextBtn.style.display = "none";
}

function invClickerTap() {
  if (!invClickerActive && invClickerTimer === null) {
    invClickerActive = true;
    invClickerScore = 0;
    const sub = document.getElementById("invClickerSub");
    if (sub) sub.textContent = "Дар, дар, дар! ⏱";
    invClickerTimer = setTimeout(invClickerEnd, 5000);
  }
  if (!invClickerActive) return;
  invClickerScore++;
  const scoreEl = document.getElementById("invClickerScore");
  if (scoreEl) scoreEl.textContent = String(invClickerScore);
  const heart = document.getElementById("invClickerHeart");
  if (heart) {
    heart.style.transform = "scale(1.3)";
    setTimeout(() => { const h = document.getElementById("invClickerHeart"); if (h) h.style.transform = "scale(1)"; }, 100);
  }
}

function invClickerEnd() {
  invClickerActive = false;
  invClickerTimer = null;
  const sub = document.getElementById("invClickerSub");
  let msg;
  if (invClickerScore >= 30) msg = "🔥 Хайрын мастер! Гараа шатаачихлаа шүү!";
  else if (invClickerScore >= 15) msg = "💖 Маш сайн! Чи их хайртай юм байна.";
  else msg = "💗 Гоё оролдлого!";
  if (sub) sub.textContent = msg;
  const nextBtn = document.getElementById("invClickerNextBtn");
  if (nextBtn) nextBtn.style.display = "inline-block";
}

// ---------- Эвлүүлэх тоглоом (N хос emoji, 3D flip) — төрөл бүр өөр emoji/сэдвээр ашиглана ----------
const invMemDefaultEmojis = ["❤️", "🌸", "✨", "🎁", "🎵", "😍"];
let invMemFlipped = [];
let invMemMatchedCount = 0;
let invMemLock = false;
let invMemGridId = "invMemGrid";
let invMemNextBtnId = "invMemNextBtn";
let invMemEmojiSet = invMemDefaultEmojis;
let invMemBackSymbol = "💌";

function invSetupMemoryGame(gridId, nextBtnId, emojiSet, backSymbol) {
  invMemGridId = gridId || "invMemGrid";
  invMemNextBtnId = nextBtnId || "invMemNextBtn";
  invMemEmojiSet = emojiSet || invMemDefaultEmojis;
  invMemBackSymbol = backSymbol || "💌";

  const grid = document.getElementById(invMemGridId);
  if (!grid) return;
  invMemFlipped = [];
  invMemMatchedCount = 0;
  invMemLock = false;
  const nextBtn = document.getElementById(invMemNextBtnId);
  if (nextBtn) nextBtn.style.display = "none";

  const deck = [...invMemEmojiSet, ...invMemEmojiSet];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  grid.innerHTML = deck.map((emoji, idx) => `
    <div class="inv-mem-card" id="${invMemGridId}-${idx}" onclick="invFlipMemCard(${idx})">
      <div class="inv-mem-card-inner">
        <div class="inv-mem-face inv-mem-back">${invMemBackSymbol}</div>
        <div class="inv-mem-face inv-mem-front" data-emoji="${emoji}">${emoji}</div>
      </div>
    </div>`).join("");
}

function invFlipMemCard(idx) {
  if (invMemLock) return;
  const card = document.getElementById(invMemGridId + "-" + idx);
  if (!card || card.classList.contains("inv-mem-flipped") || card.classList.contains("inv-mem-matched")) return;
  card.classList.add("inv-mem-flipped");
  invMemFlipped.push(idx);
  if (invMemFlipped.length < 2) return;

  invMemLock = true;
  const [i1, i2] = invMemFlipped;
  const c1 = document.getElementById(invMemGridId + "-" + i1);
  const c2 = document.getElementById(invMemGridId + "-" + i2);
  const e1 = c1.querySelector(".inv-mem-front").dataset.emoji;
  const e2 = c2.querySelector(".inv-mem-front").dataset.emoji;

  if (e1 === e2) {
    c1.classList.add("inv-mem-matched");
    c2.classList.add("inv-mem-matched");
    invMemMatchedCount++;
    invMemFlipped = [];
    invMemLock = false;
    if (invMemMatchedCount === invMemEmojiSet.length) {
      const nextBtn = document.getElementById(invMemNextBtnId);
      if (nextBtn) nextBtn.style.display = "inline-block";
    }
  } else {
    setTimeout(() => {
      c1.classList.remove("inv-mem-flipped");
      c2.classList.remove("inv-mem-flipped");
      invMemFlipped = [];
      invMemLock = false;
    }, 900);
  }
}

// ---------- Азын дугуй тоглоомын сэдэвчилсэн сегментүүд (төрөл бүрд өөр) ----------
const INV_WHEEL_DATE = [
  { emoji: "🎬", label: "Кино" }, { emoji: "☕", label: "Кофе" }, { emoji: "🌳", label: "Парк" },
  { emoji: "🍜", label: "Хоол" }, { emoji: "📸", label: "Зураг" }, { emoji: "🎵", label: "Дуу" },
];
const INV_WHEEL_PROPOSAL = [
  { emoji: "💍", label: "Тийм" }, { emoji: "💕", label: "Мөнхөд" }, { emoji: "✨", label: "Хамтдаа" },
  { emoji: "🥰", label: "Тийм ээ" }, { emoji: "💖", label: "Заавал" }, { emoji: "💫", label: "Одоо шүү" },
];
const INV_WHEEL_CELEBRATION = [
  { emoji: "🎉", label: "Баяр" }, { emoji: "🎂", label: "Бялуу" }, { emoji: "🎁", label: "Бэлэг" },
  { emoji: "🥳", label: "Хөгжилтэй" }, { emoji: "🎈", label: "Инээд" }, { emoji: "✨", label: "Дурсамж" },
];
const INV_WHEEL_FORMAL = [
  { emoji: "✅", label: "Бэлэн" }, { emoji: "🤝", label: "Хамтдаа" }, { emoji: "💼", label: "Амжилт" },
  { emoji: "🎯", label: "Зорилго" }, { emoji: "📈", label: "Ахиц" }, { emoji: "🙌", label: "Баяр хүргэе" },
];

// ---------- Азын дугуй (wheel-spin тоглоом) — сегмент бүр {emoji, label} ----------
function invSetupWheel(wheelId, segments) {
  const el = document.getElementById(wheelId);
  if (!el) return;
  const n = segments.length;
  const colors = ["#ffd3e0", "#ffe8cc", "#d3f8e2", "#d3e4ff", "#f3d3ff", "#fff3d3"];
  const gradient = segments.map((s, i) => `${colors[i % colors.length]} ${i * (360 / n)}deg ${(i + 1) * (360 / n)}deg`).join(", ");
  el.style.background = `conic-gradient(${gradient})`;
  el.innerHTML = segments.map((s, i) => {
    const angle = (i + 0.5) * (360 / n);
    return `<span class="inv-wheel-label" style="transform:rotate(${angle}deg) translate(0,-72px) rotate(${-angle}deg);">${s.emoji}</span>`;
  }).join("");
  el.style.transform = "rotate(0deg)";
  el.dataset.spinning = "0";
}

function invSpinWheel(wheelId, resultId, nextBtnId, segments) {
  const el = document.getElementById(wheelId);
  if (!el || el.dataset.spinning === "1") return;
  el.dataset.spinning = "1";
  const n = segments.length;
  const idx = Math.floor(Math.random() * n);
  const segAngle = 360 / n;
  const targetCenter = idx * segAngle + segAngle / 2;
  const finalRotation = 5 * 360 + (360 - targetCenter);
  el.style.transition = "transform 3s cubic-bezier(.17,.67,.16,1)";
  el.style.transform = `rotate(${finalRotation}deg)`;
  setTimeout(() => {
    const resEl = document.getElementById(resultId);
    if (resEl) resEl.innerHTML = `<div class="inv-wheel-result-text">${segments[idx].emoji} ${escapeHtml(segments[idx].label)}</div>`;
    const nb = document.getElementById(nextBtnId);
    if (nb) nb.style.display = "inline-block";
  }, 3100);
}

// ---------- Хөгжилтэй сонголт (poll) — invPick-тэй адил боловч хариулт бүртгэхгүй, зөвхөн зугаа ----------
function invPollPick(groupId, el, nextScreen) {
  document.querySelectorAll("#" + groupId + " .inv-opt").forEach(o => o.classList.remove("inv-picked"));
  el.classList.add("inv-picked");
  setTimeout(() => invGoTo(nextScreen), 380);
}

// ---------- Урам зориг өгөх дунд шатны карт (санамсаргүй, давтагдахгүй эерэг үг) ----------
const INV_ENCOURAGE_GENERAL = [
  { e: "🌟", t: "Чамтай уулзахыг тэсэн ядан хүлээж байна!" },
  { e: "💫", t: "Энэ мөч онцгой байх болно, амлаж байна" },
  { e: "🎈", t: "Чи ирвэл бүх зүйл илүү сайхан болно" },
  { e: "💛", t: "Хамтдаа байх цаг бол хамгийн үнэтэй зүйл шүү" },
  { e: "🥰", t: "Чамайг харахыг үнэхээр хүсч байна" },
  { e: "✨", t: "Энэ өдрийг чамтай хамт тэмдэглэхийг хүсч байна" },
  { e: "🌸", t: "Чи маш онц хүн, тэгээд бид үүнийг мэднэ" },
  { e: "😊", t: "Инээмсэглэл чинь энэ баярыг илүү гэрэлтүүлнэ" },
  { e: "💭", t: "Чамгүйгээр энэ мөч бүрэн бус байх болно" },
  { e: "🎊", t: "Бид чамайг үнэхээр хүлээж байгаа шүү" },
  { e: "🌈", t: "Сайхан мөч бидний хамт хүлээж байна" },
  { e: "💖", t: "Чиний оролцоо бидэнд маш их учиртай" },
  { e: "🎉", t: "Энэ бол бидний хамт цуглах онцгой шалтгаан" },
  { e: "🥳", t: "Чи ирэх нь бидний хамгийн том баяр байх болно" },
];
const INV_ENCOURAGE_ROMANTIC = [
  { e: "💓", t: "Чамайг бодохоор зүрх минь хурдан цохилдог" },
  { e: "🌟", t: "Чи миний өдрийг гэрэлтүүлдэг цорын ганц хүн" },
  { e: "💕", t: "Чамтай өнгөрөөх минут бүр надад үнэтэй" },
  { e: "🥰", t: "Чи миний хамгийн дуртай хүн шүү" },
  { e: "🌸", t: "Чамгүйгээр амьдрал өнгөгүй мэт санагддаг" },
  { e: "💫", t: "Чи над руу инээмсэглэхэд дэлхий зогсдог мэт санагддаг" },
  { e: "💖", t: "Энэ мөчийг чамтай хуваалцахыг хүсч байна" },
  { e: "💗", t: "Чи миний зүрхэнд тусгайлан оршдог" },
  { e: "🎁", t: "Чамтай хамт байх бүр мөч миний хувьд бэлэг" },
  { e: "🌷", t: "Чи миний өдрийг илүү гоё болгодог" },
  { e: "💘", t: "Чамд хайртай гэдгээ өдөр бүр илүү мэдэрдэг" },
  { e: "💫", t: "Чи миний эхлэл, дунд, төгсгөл бүгд болсон" },
];

// n ширхэг давхцалгүй урам зоригийн мөр сонгож авна (нэг урилга дотроо давтагдахгүй байхын тулд)
function invPickEncourageSet(romantic, n) {
  const pool = romantic ? INV_ENCOURAGE_ROMANTIC : INV_ENCOURAGE_GENERAL;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ids/lines ижил урттай массив — ids[0]→ids[1]→...→ids[last]→nextChain гинжлэнэ
function invEncourageChain(ids, lines, nextChain) {
  // nextChain хэрэглэгддэггүй болсон: гинжин хэлхээний сүүлчийн карт дараа нь DOM дэх
  // жинхэнэ дараагийн card руу invAdvance()-ээр аяндаа шилждэг тул тусад нь заах шаардлагагүй.
  return ids.map((id, i) => {
    const line = lines[i];
    return `
    <div class="inv-card" id="${id}" data-step="${id}">
      <div class="inv-encourage-emoji">${line.e}</div>
      <h1 style="font-size:24px;">${escapeHtml(line.t)}</h1>
      <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
    </div>`;
  }).join("");
}

// RSVP товчнуудын дор байнга харагдах, "Үгүй"-г зөөлнөөр няцаадаг бичвэр
const INV_RSVP_HINT = `<p class="inv-rsvp-hint">💛 Аль ч хариултаа чөлөөтэй сонгоорой</p>`;

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
  const cdEl = document.getElementById("invDateCountdown");
  if (cdEl) cdEl.style.display = "inline-block";
  invStartLiveCountdown("invDateCountdown", d);
}

// Урьд нь энэ функц "Үгүй" товчийг курсорын доор зайлсхийлгэдэг байсан (hover/touch бүрд
// санамсаргүй байрлал руу шилжинэ) — хэрэглэгчийн бодит зөвшөөрлийг хасдаг dark pattern байсан
// тул идэвхгүй болгов. "Үгүй"/"Ирэхгүй" товч одоо энгийн, бүрэн ажилладаг товч болно.
function invDodge() {
  return;
}

// "Үгүй"/"Ирэхгүй"/"Оролцохгүй" товчны бодит хариу — өмнө нь эдгээр товчинд onclick огт байгаагүй
// тул дарахад юу ч болдоггүй байсан (зөвхөн hover дээр зайлсхийдэг байсан). Одоо бодитоор
// хариултыг хадгалж, хэрэглэгчид тодорхой feedback өгнө.
function invDecline() {
  submitInviteResponse({ rsvp: "ирэхгүй" });
  document.querySelectorAll(".inv-card.active button").forEach(b => b.disabled = true);
  if (typeof showToast === "function") showToast("Хариултыг чинь хүлээн авлаа 💛");
}

// ---------- "Дараа бодъё" гэж дарахад муур зурагтай ятгах дараалал (bolzoodate.vercel.app-с санаа авсан) ----------
const INV_CAT_TAGS = ["cute", "kitten", "sleepy", "box", "cute", "kitten"];
const INV_PERSUADE_STAGES = [
  "Дахиад нэг бодоод үз дээ 🥹",
  "Нээрээ надтай явахгүй гэж үү? 😿",
  "Тийм товч чинь илүү хөөрхөн харагдаж байна шүү 🐱",
  "За за, ганцхан удаа асуучихъя л даа... тийм үү? 🥺",
];
let invPersuadeStage = 0;

// onYes: function биш, зөвхөн invGoTo-д зориулсан алхмын id өгвөл шууд түүн рүү шилжинэ;
// функц өгвөл (жишээ нь invCelebrateProposal) шууд дуудна.
function invStartPersuade(onYes) {
  invPersuadeStage = 0;
  const yesBtn = document.getElementById("invPersuadeYesBtn");
  if (yesBtn) yesBtn.onclick = typeof onYes === "function" ? onYes : () => invGoTo(onYes);
  invShowPersuadeStage();
  invGoTo("inv-s-persuade");
}

function invPersuadeNext() {
  invPersuadeStage = Math.min(invPersuadeStage + 1, INV_PERSUADE_STAGES.length - 1);
  invShowPersuadeStage();
}

function invShowPersuadeStage() {
  const textEl = document.getElementById("invPersuadeText");
  const imgEl = document.getElementById("invPersuadeImg");
  const nextBtn = document.getElementById("invPersuadeNextBtn");
  const yesBtn = document.getElementById("invPersuadeYesBtn");
  if (textEl) textEl.textContent = INV_PERSUADE_STAGES[invPersuadeStage];
  if (imgEl) {
    const tag = INV_CAT_TAGS[invPersuadeStage % INV_CAT_TAGS.length];
    imgEl.src = `https://cataas.com/cat/${tag}?width=300&height=240&t=${Date.now()}`;
  }
  const isLast = invPersuadeStage >= INV_PERSUADE_STAGES.length - 1;
  if (nextBtn) nextBtn.style.display = isLast ? "none" : "inline-block";
  if (yesBtn) yesBtn.classList.toggle("inv-btn-pulse", isLast);
}

// ---------- Сонгосон огноо хүртэлх амьд тоолуур ----------
let invCountdownTimer = null;
function invStartLiveCountdown(elId, targetDate) {
  if (invCountdownTimer) { clearInterval(invCountdownTimer); invCountdownTimer = null; }
  function update() {
    const el = document.getElementById(elId);
    if (!el) { clearInterval(invCountdownTimer); invCountdownTimer = null; return; }
    const diffMs = targetDate.getTime() - Date.now();
    if (diffMs <= 0) { el.textContent = "🎉 Өнөөдөр боллоо!"; clearInterval(invCountdownTimer); invCountdownTimer = null; return; }
    const days = Math.floor(diffMs / 86400000);
    const hours = Math.floor((diffMs % 86400000) / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    el.textContent = `⏳ Болзоонд үлдсэн: ${days} өдөр ${hours} цаг ${mins} мин`;
  }
  update();
  invCountdownTimer = setInterval(update, 60000);
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
  const wish = (document.getElementById("invWishInput")?.value || "").trim();
  invGoTo("inv-s-celebrate");
  const dateStr = invAnswers.date
    ? invAnswers.date.toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric" })
    : "(огноо сонгогдоогүй)";
  document.getElementById("invSummaryBox").innerHTML =
    "📍 Хаашаа: <b>" + escapeHtml(invAnswers.q1 || "—") + "</b><br>" +
    "✨ Юу хийх: <b>" + escapeHtml(invAnswers.q2 || "—") + "</b><br>" +
    "⏰ Хэзээ өдрийн цаг: <b>" + escapeHtml(invAnswers.q3 || "—") + "</b><br>" +
    "🍽 Хоол: <b>" + escapeHtml(invAnswers.q4 || "—") + "</b><br>" +
    "📅 Болзооны өдөр: <b>" + escapeHtml(dateStr) + "</b><br>" +
    "💗 Зүрх дарах оноо: <b>" + invClickerScore + "</b>" +
    (wish ? "<br>💌 Хүлээж байгаа зүйл: <b>" + escapeHtml(wish) + "</b>" : "");
  invHeartBurst(60, ["❤️","💕","💗","💖","💘"]);
  setTimeout(() => invHeartBurst(40, ["❤️","💕","💗","💖"]), 1800);
  submitInviteResponse({ q1: invAnswers.q1, q2: invAnswers.q2, q3: invAnswers.q3, q4: invAnswers.q4, date: dateStr, clickerScore: invClickerScore, wish });
}

// ================= ГЭРЛЭХ САНАЛ (энгийн хувилбар — асуулт/огноо шаардахгүй) =================
function renderProposalExperience(recipientName, data, invite, targetId) {
  targetId = targetId || "inviteRoot";
  data = data || {};
  const app = document.getElementById(targetId);
  const heading = recipientName ? `${escapeHtml(recipientName)} аа, чамд нэг асуулт байна...` : "Чамд нэг асуулт байна...";
  const memory = data.memory || "";
  const facts = (data.funFacts || "").split("\n").map(s => s.trim()).filter(Boolean);
  const hasMemory = !!memory;
  const hasFacts = facts.length > 0;
  const encLines = invPickEncourageSet(true, 6);

  app.innerHTML = `
  <div id="inviteApp">
    <div id="inv-petals"></div>
    <div id="inv-heartRain"></div>
    <div id="inv-stage">
      <div class="inv-card active" id="inv-s-intro" data-step="inv-s-intro">
        <div class="inv-eyebrow">Хамгийн чухал асуулт</div>
        <h1>${heading}</h1>
        <p class="inv-sub">Дараагийн хэдэн секундэд миний амьдралын хамгийн чухал асуулт байх болно 🥹</p>
        <button class="inv-btn" type="button" onclick="${hasMemory ? "invGoTo('inv-s-memory')" : (hasFacts ? "invGoTo('inv-s-facts')" : "invGoToCountdown()")}">Үргэлжлүүлэх ✨</button>
      </div>
      ${hasMemory ? `
      <div class="inv-card" id="inv-s-memory" data-step="inv-s-memory">
        <div class="inv-eyebrow">Нандин дурсамж 💭</div>
        <h1 style="font-size:26px;">Санаж байна уу?</h1>
        <p class="inv-sub" style="font-style:italic;">"${escapeHtml(memory)}"</p>
        <button class="inv-btn" type="button" onclick="${hasFacts ? "invGoTo('inv-s-facts')" : "invGoToCountdown()"}">Үргэлжлүүлэх ✨</button>
      </div>` : ""}
      ${hasFacts ? `
      <div class="inv-card" id="inv-s-facts" data-step="inv-s-facts">
        <div class="inv-eyebrow">Чи мэдэх үү... 💡</div>
        <h1 style="font-size:26px;">Бидний тухай баримтууд</h1>
        <div class="inv-summary">
          ${facts.map(f => `<div>✨ ${escapeHtml(f)}</div>`).join("")}
        </div>
        <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх ✨</button>
      </div>` : ""}
      <div class="inv-card" id="inv-s-clicker" data-step="inv-s-clicker">
        <div class="inv-eyebrow">Бонус тоглоом 💕</div>
        <h1 style="font-size:28px;">5 секундэд хэдэн удаа дарж чадах вэ?</h1>
        <p class="inv-sub" id="invClickerSub">Зүрхэн дээр дараад эхэлье!</p>
        <div id="invClickerHeart" onclick="invClickerTap()" style="font-size:80px;cursor:pointer;user-select:none;margin:10px 0 16px;transition:transform .1s;">💗</div>
        <div style="font-size:20px;font-weight:700;color:var(--inv-rose-deep);margin-bottom:16px;">Оноо: <span id="invClickerScore">0</span></div>
        <button class="inv-btn" id="invClickerNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
      </div>
      <div class="inv-card" id="inv-s-memgame" data-step="inv-s-memgame">
        <div class="inv-eyebrow">Бонус тоглоом 🎮</div>
        <h1 style="font-size:28px;">Хосуудыг олоорой!</h1>
        <p class="inv-sub">Ижил emoji-г олж хос болгоорой ✨</p>
        <div class="inv-mem-grid" id="invPropMemGrid"></div>
        <button class="inv-btn" id="invPropMemNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
      </div>
      <div class="inv-card" id="inv-s-poll1" data-step="inv-s-poll1">
        <div class="inv-eyebrow">Хөгжилтэй асуулт 💭</div>
        <h1 style="font-size:28px;">Чиний хариулт ямар байх бол? 👀</h1>
        <div class="inv-options" id="inv-opts-poll1">
          <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">😍</span> Мэдээж тийм!</div>
          <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">😭</span> Уйлчихна аа</div>
          <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">🤭</span> Гайхаад амьсгаа боогдоно</div>
          <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">💃</span> Баясаад бүжиглэнэ</div>
        </div>
      </div>
      <div class="inv-card" id="inv-s-wheel" data-step="inv-s-wheel">
        <div class="inv-eyebrow">Азын дугуй 🎡</div>
        <h1 style="font-size:26px;">Хариулт чинь юу байх бол?</h1>
        <div class="inv-wheel-wrap">
          <div class="inv-wheel-pointer">▼</div>
          <div class="inv-wheel" id="invWheel1"></div>
        </div>
        <button class="inv-btn" type="button" onclick="invSpinWheel('invWheel1','invWheelResult1','invWheelNextBtn1', INV_WHEEL_PROPOSAL)">🎡 Эргүүл!</button>
        <div id="invWheelResult1"></div>
        <button class="inv-btn" id="invWheelNextBtn1" type="button" style="display:none;margin-top:10px;" onclick="invAdvance()">Дараах →</button>
      </div>
      <div class="inv-card" id="inv-s-trivia" data-step="inv-s-trivia">
        <div class="inv-eyebrow">Мэдэж байсан уу? 💡</div>
        <h1 style="font-size:24px;">Хайртай хүнээ бодоход зүрх 3 дахин хурдан цохилдог гэдэг шүү</h1>
        <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
      </div>
      ${invEncourageChain(["inv-s-enc1", "inv-s-enc2", "inv-s-enc3", "inv-s-enc4", "inv-s-enc5", "inv-s-enc6"], encLines, "inv-s-countdown")}
      <div class="inv-card" id="inv-s-countdown" data-step="inv-s-countdown">
        <div class="inv-eyebrow">Бэлэн үү?</div>
        <h1 style="font-size:26px;">Асуулт 3 секундийн дараа...</h1>
        <div id="invCountdownNum" style="font-family:'Caveat',cursive;font-size:72px;color:var(--inv-rose-deep);margin:16px 0;">3</div>
      </div>
      <div class="inv-card" id="inv-s-final" data-step="inv-s-final">
        <div class="inv-eyebrow">Хамгийн чухал асуулт</div>
        <h1>${data.message ? escapeHtml(data.message) : "Чи надтай гэрлэх үү?"} 💍</h1>
        <div class="inv-final-buttons">
          <button class="inv-btn" id="inv-yesBtn" type="button" onclick="invCelebrateProposal()">Тийм ээ! 💍</button>
          <button class="inv-btn inv-btn-ghost" id="inv-noBtn" type="button"
            onclick="invDecline()" onmouseenter="invDodge()" ontouchstart="invDodge(); event.preventDefault();">Үгүй</button>
        </div>
        <button class="inv-btn-text" type="button" onclick="invStartPersuade(invCelebrateProposal)">бодоод үзье...</button>
        ${INV_RSVP_HINT}
      </div>
      <div class="inv-card" id="inv-s-persuade">
        <div class="inv-persuade-img-wrap"><img id="invPersuadeImg" class="inv-persuade-img" alt="муур"></div>
        <h1 id="invPersuadeText" style="font-size:22px;"></h1>
        <button class="inv-btn" id="invPersuadeYesBtn" type="button" onclick="invCelebrateProposal()">Тийм ээ! 💍</button>
        <div style="margin-top:12px;">
          <button class="inv-btn-text" id="invPersuadeNextBtn" type="button" onclick="invPersuadeNext()">дахиад бодъё...</button>
        </div>
      </div>
      <div class="inv-card" id="inv-s-celebrate" data-step="inv-s-celebrate">
        <div class="inv-eyebrow">Баяр хүргэе 🎉</div>
        <h1>Тэгвэл гэрлэцгээе! 💍</h1>
        <p class="inv-sub">Энэ бол чиний амьдралын хамгийн сайхан "тийм" гэсэн үг байсан гэдэгт итгэлтэй байна 🥹</p>
      </div>
    </div>
  </div>`;
  invIndexPages(invite);
  invStartPetals();
  invSetupClickerGame();
  invSetupMemoryGame("invPropMemGrid", "invPropMemNextBtn", ["💍", "💕", "✨", "🥰", "💫", "💖"], "💍");
  invSetupWheel("invWheel1", INV_WHEEL_PROPOSAL);
}

function invGoToCountdown() {
  invGoTo("inv-s-countdown");
  invStartProposalCountdown();
}

function invStartProposalCountdown() {
  let n = 3;
  const el = document.getElementById("invCountdownNum");
  if (!el) return;
  el.textContent = String(n);
  const timer = setInterval(() => {
    n--;
    const numEl = document.getElementById("invCountdownNum");
    if (!numEl) { clearInterval(timer); return; }
    if (n <= 0) {
      clearInterval(timer);
      invGoTo("inv-s-final");
    } else {
      numEl.textContent = String(n);
    }
  }, 800);
}

function invCelebrateProposal() {
  invGoTo("inv-s-celebrate");
  invHeartBurst(60, ["❤️","💍","💕","💖","💘"]);
  setTimeout(() => invHeartBurst(40, ["❤️","💍","💕","💖"]), 1800);
  submitInviteResponse({ answer: "yes" });
}

// ================= ХУРИМ (хосын түүх, дэлгэрэнгүй, dress code, RSVP, дуу хүсэлт) =================
function renderWeddingExperience(data, invite, targetId) {
  targetId = targetId || "inviteRoot";
  const app = document.getElementById(targetId);
  const names = data.names || "Хос";
  const encLines = invPickEncourageSet(true, 6);
  const steps = [];
  steps.push(`
    <div class="inv-card active" id="inv-s-intro" data-step="inv-s-intro">
      <div class="inv-eyebrow">Урилга</div>
      <h1>💍 ${escapeHtml(names)} хоёрын хуримд тавтай морил</h1>
      <p class="inv-sub">Та тэдний хамгийн онцгой өдрөөр хамт байхыг урьж байна.</p>
      <button class="inv-btn" type="button" onclick="invAdvance()">Дэлгэрэнгүй →</button>
    </div>`);

  if (data.loveStory) {
    steps.push(`
    <div class="inv-card" id="inv-s-story" data-step="inv-s-story">
      <div class="inv-eyebrow">Тэдний түүх 💕</div>
      <h1 style="font-size:26px;">Хэрхэн танилцсан бэ?</h1>
      <p class="inv-sub" style="font-style:italic;">"${escapeHtml(data.loveStory)}"</p>
      <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
    </div>`);
  } else {
    steps.push(`<div class="inv-card" id="inv-s-story" data-step="inv-s-story"><div class="inv-eyebrow">💕</div><h1 style="font-size:26px;">Онцгой өдөр ирлээ</h1><button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button></div>`);
  }

  steps.push(`
    <div class="inv-card" id="inv-s-details" data-step="inv-s-details">
      <div class="inv-eyebrow">Дэлгэрэнгүй мэдээлэл 📋</div>
      <h1 style="font-size:26px;">Хэзээ, хаана?</h1>
      <div class="inv-summary">
        📅 ${escapeHtml(data.date || "Тодорхойгүй")} ${data.time ? "· " + escapeHtml(data.time) : ""}<br>
        📍 ${escapeHtml(data.location || "Тодорхойгүй")}
      </div>
      ${data.location ? mapEmbedHtml(data.location) : ""}
      <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
    </div>`);

  steps.push(`
    <div class="inv-card" id="inv-s-memgame" data-step="inv-s-memgame">
      <div class="inv-eyebrow">Бонус тоглоом 🎮</div>
      <h1 style="font-size:28px;">Хосуудыг олоорой!</h1>
      <p class="inv-sub">Ижил emoji-г олж хос болгоорой ✨</p>
      <div class="inv-mem-grid" id="invWedMemGrid"></div>
      <button class="inv-btn" id="invWedMemNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
    </div>`);

  steps.push(`
    <div class="inv-card" id="inv-s-clicker" data-step="inv-s-clicker">
      <div class="inv-eyebrow">Бонус тоглоом 💍</div>
      <h1 style="font-size:28px;">5 секундэд хэдэн удаа дарж чадах вэ?</h1>
      <p class="inv-sub" id="invClickerSub">Зүрхэн дээр дараад эхэлье!</p>
      <div id="invClickerHeart" onclick="invClickerTap()" style="font-size:80px;cursor:pointer;user-select:none;margin:10px 0 16px;transition:transform .1s;">💗</div>
      <div style="font-size:20px;font-weight:700;color:var(--inv-rose-deep);margin-bottom:16px;">Оноо: <span id="invClickerScore">0</span></div>
      <button class="inv-btn" id="invClickerNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
    </div>`);

  steps.push(`
    <div class="inv-card" id="inv-s-poll1" data-step="inv-s-poll1">
      <div class="inv-eyebrow">Хөгжилтэй асуулт 💭</div>
      <h1 style="font-size:26px;">Хуримд юу хамгийн их таашаах вэ?</h1>
      <div class="inv-options" id="inv-opts-poll1">
        <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">🍰</span> Тортоо идэх</div>
        <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">💃</span> Бүжиглэх</div>
        <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">🥂</span> Ерөөл айлдах</div>
        <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">📸</span> Зураг авахуулах</div>
      </div>
    </div>`);

  steps.push(`
    <div class="inv-card" id="inv-s-wheel" data-step="inv-s-wheel">
      <div class="inv-eyebrow">Азын дугуй 🎡</div>
      <h1 style="font-size:26px;">Хуримын өдөр ямар байх бол?</h1>
      <div class="inv-wheel-wrap">
        <div class="inv-wheel-pointer">▼</div>
        <div class="inv-wheel" id="invWheel1"></div>
      </div>
      <button class="inv-btn" type="button" onclick="invSpinWheel('invWheel1','invWheelResult1','invWheelNextBtn1', INV_WHEEL_CELEBRATION)">🎡 Эргүүл!</button>
      <div id="invWheelResult1"></div>
      <button class="inv-btn" id="invWheelNextBtn1" type="button" style="display:none;margin-top:10px;" onclick="invAdvance()">Дараах →</button>
    </div>`);

  steps.push(invEncourageChain(
    ["inv-s-enc1", "inv-s-enc2", "inv-s-enc3", "inv-s-enc4", "inv-s-enc5", "inv-s-enc6"],
    encLines,
    data.dressCode ? "inv-s-dress" : "inv-s-rsvp"
  ));

  if (data.dressCode) {
    steps.push(`
    <div class="inv-card" id="inv-s-dress" data-step="inv-s-dress">
      <div class="inv-eyebrow">Хувцасны код 👗</div>
      <h1 style="font-size:26px;">Юу өмсөх вэ?</h1>
      <p class="inv-sub">${escapeHtml(data.dressCode)}</p>
      <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
    </div>`);
  }

  steps.push(`
    <div class="inv-card" id="inv-s-rsvp" data-step="inv-s-rsvp">
      <div class="inv-eyebrow">RSVP</div>
      <h1>Та ирэх үү? 💌</h1>
      <p class="inv-sub">Тэднийг дэмжихийн тулд ирнэ гэдгээ баталгаажуулаарай.</p>
      <div class="inv-final-buttons">
        <button class="inv-btn" id="inv-yesBtn" type="button" onclick="invAdvance()">Заавал ирнэ! 🎉</button>
        <button class="inv-btn inv-btn-ghost" id="inv-noBtn" type="button"
          onclick="invDecline()" onmouseenter="invDodge()" ontouchstart="invDodge(); event.preventDefault();">Ирэхгүй</button>
      </div>
      ${INV_RSVP_HINT}
    </div>`);

  if (data.message) {
    steps.push(`
    <div class="inv-card" id="inv-s-note" data-step="inv-s-note">
      <div class="inv-eyebrow">Тэмдэглэл 💌</div>
      <h1 style="font-size:24px;">Мэдэгдэл</h1>
      <p class="inv-sub">${escapeHtml(data.message)}</p>
      <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
    </div>`);
  }

  steps.push(`
    <div class="inv-card" id="inv-s-song" data-step="inv-s-song">
      <div class="inv-eyebrow">Бага хүсэлт 🎵</div>
      <h1 style="font-size:24px;">Ямар дуу тоглуулаасай гэж хүсэж байна?</h1>
      <textarea id="invSongInput" rows="2" style="width:100%;border:2px solid var(--inv-line);border-radius:12px;padding:12px;font-family:inherit;font-size:14px;margin-bottom:16px;resize:vertical;" placeholder="Дуу/дуучны нэрээ бичээрэй (заавал биш)"></textarea>
      <button class="inv-btn" type="button" onclick="invCelebrateWedding()">Дуусгах 🎉</button>
    </div>`);

  steps.push(`
    <div class="inv-card" id="inv-s-celebrate" data-step="inv-s-celebrate">
      <div class="inv-eyebrow">Баярлалаа 🎉</div>
      <h1>${escapeHtml(names)}-д баяр хүргэе!</h1>
      <p class="inv-sub" id="invWeddingCelebrateNote">Тэдэнтэй хамт баярлахыг тэсэн ядан хүлээж байна 💍</p>
    </div>`);

  app.innerHTML = `
  <div id="inviteApp">
    <div id="inv-petals"></div>
    <div id="inv-heartRain"></div>
    <div id="inv-stage">${steps.join("")}</div>
  </div>`;
  invIndexPages(invite);
  invStartPetals();
  invSetupMemoryGame("invWedMemGrid", "invWedMemNextBtn", ["💍", "🥂", "💐", "🎂", "✨", "👰"], "💌");
  invSetupClickerGame();
  invSetupWheel("invWheel1", INV_WHEEL_CELEBRATION);
}

function invCelebrateWedding() {
  const song = (document.getElementById("invSongInput")?.value || "").trim();
  invGoTo("inv-s-celebrate");
  const note = document.getElementById("invWeddingCelebrateNote");
  if (note && song) note.innerHTML = `Тэдэнтэй хамт баярлахыг тэсэн ядан хүлээж байна 💍<br><br>🎵 Хүссэн дуу: <b>${escapeHtml(song)}</b>`;
  invHeartBurst(50, ["💍","🎉","🎊","✨","🥂"]);
  setTimeout(() => invHeartBurst(35, ["💍","🎉","🎊","✨"]), 1600);
  submitInviteResponse({ rsvp: "ирнэ", song });
}

// ================= ТӨРСӨН ӨДӨР (лаа унтраах, хүслийн тэмдэглэл, тоглоом) =================
function renderBirthdayExperience(data, invite, targetId) {
  targetId = targetId || "inviteRoot";
  const app = document.getElementById(targetId);
  const name = data.recipient || "найз";
  const encLines = invPickEncourageSet(false, 6);
  app.innerHTML = `
  <div id="inviteApp">
    <div id="inv-petals"></div>
    <div id="inv-heartRain"></div>
    <div id="inv-stage">
      <div class="inv-card active" id="inv-s-intro" data-step="inv-s-intro">
        <div class="inv-eyebrow">Урилга 🎉</div>
        <h1>🎂 ${escapeHtml(name)}-ийн төрсөн өдөрт тавтай морил!</h1>
        <p class="inv-sub">${data.message ? escapeHtml(data.message) : "Хамт баярлацгаая!"}</p>
        <button class="inv-btn" type="button" onclick="invAdvance()">Дэлгэрэнгүй →</button>
      </div>
      <div class="inv-card" id="inv-s-candles" data-step="inv-s-candles">
        <div class="inv-eyebrow">Хүслээ хийгээрэй 🕯</div>
        <h1 style="font-size:26px;">Лаагаа дар аа!</h1>
        <p class="inv-sub">Лаа бүр дээр дараад, бүгдийг унтраагаарай 🎂</p>
        <div id="invCandleRow" style="display:flex;justify-content:center;gap:14px;font-size:36px;margin:20px 0;"></div>
        <button class="inv-btn" id="invCandleNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
      </div>
      <div class="inv-card" id="inv-s-details" data-step="inv-s-details">
        <div class="inv-eyebrow">Дэлгэрэнгүй мэдээлэл 📋</div>
        <h1 style="font-size:26px;">Хэзээ, хаана?</h1>
        <div class="inv-summary">
          📅 ${escapeHtml(data.date || "Тодорхойгүй")} ${data.time ? "· " + escapeHtml(data.time) : ""}<br>
          📍 ${escapeHtml(data.location || "Тодорхойгүй")}
        </div>
        ${data.location ? mapEmbedHtml(data.location) : ""}
        <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
      </div>
      <div class="inv-card" id="inv-s-memory" data-step="inv-s-memory">
        <div class="inv-eyebrow">Бонус тоглоом 🎮</div>
        <h1 style="font-size:28px;">Хосуудыг олоорой!</h1>
        <p class="inv-sub">Баярын emoji-г хос болгоорой ✨</p>
        <div class="inv-mem-grid" id="invBdayMemGrid"></div>
        <button class="inv-btn" id="invBdayMemNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
      </div>
      <div class="inv-card" id="inv-s-clicker" data-step="inv-s-clicker">
        <div class="inv-eyebrow">Бонус тоглоом 🎉</div>
        <h1 style="font-size:28px;">5 секундэд хэдэн удаа дарж чадах вэ?</h1>
        <p class="inv-sub" id="invClickerSub">Товч дээр дараад эхэлье!</p>
        <div id="invClickerHeart" onclick="invClickerTap()" style="font-size:80px;cursor:pointer;user-select:none;margin:10px 0 16px;transition:transform .1s;">🎂</div>
        <div style="font-size:20px;font-weight:700;color:var(--inv-rose-deep);margin-bottom:16px;">Оноо: <span id="invClickerScore">0</span></div>
        <button class="inv-btn" id="invClickerNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
      </div>
      <div class="inv-card" id="inv-s-poll1" data-step="inv-s-poll1">
        <div class="inv-eyebrow">Хөгжилтэй асуулт 🎁</div>
        <h1 style="font-size:26px;">Ямар бэлэг хамгийн их таалагдах вэ?</h1>
        <div class="inv-options" id="inv-opts-poll1">
          <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">🎁</span> Гэнэтийн бэлэг</div>
          <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">🎂</span> Амттай бялуу</div>
          <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">💌</span> Дулаахан мэндчилгээ</div>
          <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">🎉</span> Хамт өнгөрөөх цаг</div>
        </div>
      </div>
      <div class="inv-card" id="inv-s-wheel" data-step="inv-s-wheel">
        <div class="inv-eyebrow">Азын дугуй 🎡</div>
        <h1 style="font-size:26px;">Энэ жил юу хүлээж байна вэ?</h1>
        <div class="inv-wheel-wrap">
          <div class="inv-wheel-pointer">▼</div>
          <div class="inv-wheel" id="invWheel1"></div>
        </div>
        <button class="inv-btn" type="button" onclick="invSpinWheel('invWheel1','invWheelResult1','invWheelNextBtn1', INV_WHEEL_CELEBRATION)">🎡 Эргүүл!</button>
        <div id="invWheelResult1"></div>
        <button class="inv-btn" id="invWheelNextBtn1" type="button" style="display:none;margin-top:10px;" onclick="invAdvance()">Дараах →</button>
      </div>
      ${invEncourageChain(["inv-s-enc1", "inv-s-enc2", "inv-s-enc3", "inv-s-enc4", "inv-s-enc5", "inv-s-enc6"], encLines, "inv-s-wish")}
      <div class="inv-card" id="inv-s-wish" data-step="inv-s-wish">
        <div class="inv-eyebrow">Хүслийн тэмдэглэл ✍️</div>
        <h1 style="font-size:26px;">Төрсөн өдрийн мэндчилгээ бичээрэй</h1>
        <textarea id="invBdayWishInput" rows="3" style="width:100%;border:2px solid var(--inv-line);border-radius:12px;padding:12px;font-family:inherit;font-size:14px;margin-bottom:16px;resize:vertical;" placeholder="Сайхан төрсөн өдөр өнгөрүүлээрэй!"></textarea>
        <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
      </div>
      <div class="inv-card" id="inv-s-rsvp" data-step="inv-s-rsvp">
        <div class="inv-eyebrow">RSVP</div>
        <h1>Ирэх үү? 🎈</h1>
        <div class="inv-final-buttons">
          <button class="inv-btn" id="inv-yesBtn" type="button" onclick="invCelebrateBirthday()">Заавал ирнэ! 🎉</button>
          <button class="inv-btn inv-btn-ghost" id="inv-noBtn" type="button"
            onclick="invDecline()" onmouseenter="invDodge()" ontouchstart="invDodge(); event.preventDefault();">Ирэхгүй</button>
        </div>
        ${INV_RSVP_HINT}
      </div>
      <div class="inv-card" id="inv-s-celebrate" data-step="inv-s-celebrate">
        <div class="inv-eyebrow">Баяр хүргэе 🎉</div>
        <h1>Сайхан баярлацгаая!</h1>
        <div class="inv-summary" id="invBdaySummary"></div>
      </div>
    </div>
  </div>`;
  invIndexPages(invite);
  invStartPetals();
  invSetupBirthdayCandles();
  invSetupMemoryGame("invBdayMemGrid", "invBdayMemNextBtn", ["🎂","🎈","🎁","🕯️","🎉","🍰"], "🎊");
  invSetupClickerGame();
  invSetupWheel("invWheel1", INV_WHEEL_CELEBRATION);
}

let invCandlesLit = 6;
function invSetupBirthdayCandles() {
  invCandlesLit = 6;
  const row = document.getElementById("invCandleRow");
  if (!row) return;
  row.innerHTML = Array.from({ length: 6 }).map((_, i) => `<span id="invCandle${i}" onclick="invBlowCandle(${i})" style="cursor:pointer;">🕯️</span>`).join("");
}
function invBlowCandle(i) {
  const el = document.getElementById("invCandle" + i);
  if (!el || el.dataset.out === "1") return;
  el.textContent = "💨";
  el.dataset.out = "1";
  invCandlesLit--;
  if (invCandlesLit <= 0) {
    const nextBtn = document.getElementById("invCandleNextBtn");
    if (nextBtn) nextBtn.style.display = "inline-block";
  }
}

function invCelebrateBirthday() {
  const wish = (document.getElementById("invBdayWishInput")?.value || "").trim();
  invGoTo("inv-s-celebrate");
  document.getElementById("invBdaySummary").innerHTML = wish ? `✍️ ${escapeHtml(wish)}` : "🎂 Баярын мэнд хүргэе!";
  invHeartBurst(55, ["🎉","🎈","🎂","🎁","✨"]);
  setTimeout(() => invHeartBurst(35, ["🎉","🎈","🎊"]), 1500);
  submitInviteResponse({ rsvp: "ирнэ", wish });
}

// ================= АЖЛЫН АРГА ХЭМЖЭЭ (хөтөлбөр, dress code, RSVP + хоолны сонголт) =================
function renderWorkExperience(data, invite, targetId) {
  targetId = targetId || "inviteRoot";
  const app = document.getElementById(targetId);
  const agendaItems = (data.agenda || "").split("\n").map(s => s.trim()).filter(Boolean);
  const encLines = invPickEncourageSet(false, 8);
  const steps = [];
  steps.push(`
    <div class="inv-card active" id="inv-s-intro" data-step="inv-s-intro">
      <div class="inv-eyebrow">Урилга 💼</div>
      <h1 style="font-size:30px;">${escapeHtml(data.title || "Ажлын арга хэмжээ")}</h1>
      <p class="inv-sub">Танийг манай арга хэмжээнд урьж байна.</p>
      <button class="inv-btn" type="button" onclick="invAdvance()">Дэлгэрэнгүй →</button>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-details" data-step="inv-s-details">
      <div class="inv-eyebrow">Дэлгэрэнгүй мэдээлэл 📋</div>
      <h1 style="font-size:26px;">Хэзээ, хаана?</h1>
      <div class="inv-summary">
        📅 ${escapeHtml(data.date || "Тодорхойгүй")} ${data.time ? "· " + escapeHtml(data.time) : ""}<br>
        📍 ${escapeHtml(data.location || "Тодорхойгүй")}
      </div>
      ${data.location ? mapEmbedHtml(data.location) : ""}
      <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
    </div>`);
  if (agendaItems.length) {
    steps.push(`
    <div class="inv-card" id="inv-s-agenda" data-step="inv-s-agenda">
      <div class="inv-eyebrow">Хөтөлбөр 🗓</div>
      <h1 style="font-size:26px;">Өдрийн хөтөлбөр</h1>
      <div class="inv-summary">${agendaItems.map(a => `<div>▸ ${escapeHtml(a)}</div>`).join("")}</div>
      <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
    </div>`);
  }
  if (data.dressCode) {
    steps.push(`
    <div class="inv-card" id="inv-s-dress" data-step="inv-s-dress">
      <div class="inv-eyebrow">Хувцасны код 👔</div>
      <h1 style="font-size:26px;">Юу өмсөх вэ?</h1>
      <p class="inv-sub">${escapeHtml(data.dressCode)}</p>
      <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
    </div>`);
  }
  steps.push(`
    <div class="inv-card" id="inv-s-memgame" data-step="inv-s-memgame">
      <div class="inv-eyebrow">Бонус тоглоом 🎮</div>
      <h1 style="font-size:28px;">Хосуудыг олоорой!</h1>
      <p class="inv-sub">Ижил emoji-г олж хос болгоорой ✨</p>
      <div class="inv-mem-grid" id="invWorkMemGrid"></div>
      <button class="inv-btn" id="invWorkMemNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-clicker" data-step="inv-s-clicker">
      <div class="inv-eyebrow">Бонус тоглоом ⚡</div>
      <h1 style="font-size:28px;">5 секундэд хэдэн удаа дарж чадах вэ?</h1>
      <p class="inv-sub" id="invClickerSub">Товч дээр дараад эхэлье!</p>
      <div id="invClickerHeart" onclick="invClickerTap()" style="font-size:80px;cursor:pointer;user-select:none;margin:10px 0 16px;transition:transform .1s;">💼</div>
      <div style="font-size:20px;font-weight:700;color:var(--inv-rose-deep);margin-bottom:16px;">Оноо: <span id="invClickerScore">0</span></div>
      <button class="inv-btn" id="invClickerNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-wheel" data-step="inv-s-wheel">
      <div class="inv-eyebrow">Азын дугуй 🎡</div>
      <h1 style="font-size:26px;">Энэ арга хэмжээ ямар байх бол?</h1>
      <div class="inv-wheel-wrap">
        <div class="inv-wheel-pointer">▼</div>
        <div class="inv-wheel" id="invWheel1"></div>
      </div>
      <button class="inv-btn" type="button" onclick="invSpinWheel('invWheel1','invWheelResult1','invWheelNextBtn1', INV_WHEEL_FORMAL)">🎡 Эргүүл!</button>
      <div id="invWheelResult1"></div>
      <button class="inv-btn" id="invWheelNextBtn1" type="button" style="display:none;margin-top:10px;" onclick="invAdvance()">Дараах →</button>
    </div>`);
  steps.push(invEncourageChain(["inv-s-enc1", "inv-s-enc2", "inv-s-enc3", "inv-s-enc4", "inv-s-enc5", "inv-s-enc6", "inv-s-enc7", "inv-s-enc8"], encLines, "inv-s-rsvp"));
  steps.push(`
    <div class="inv-card" id="inv-s-rsvp" data-step="inv-s-rsvp">
      <div class="inv-eyebrow">RSVP</div>
      <h1>Та ирэх үү?</h1>
      <div class="inv-final-buttons">
        <button class="inv-btn" id="inv-yesBtn" type="button" onclick="invAdvance()">Ирнэ ✅</button>
        <button class="inv-btn inv-btn-ghost" id="inv-noBtn" type="button"
          onclick="invDecline()" onmouseenter="invDodge()" ontouchstart="invDodge(); event.preventDefault();">Ирэхгүй</button>
      </div>
      ${INV_RSVP_HINT}
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-meal" data-step="inv-s-meal">
      <div class="inv-eyebrow">Хоолны сонголт 🍽</div>
      <h1 style="font-size:26px;">Ямар хоол илүүд үзэх вэ?</h1>
      <div class="inv-options" id="inv-opts-meal">
        <div class="inv-opt" data-val="Ердийн" onclick="invCelebrateWork(this)"><span class="inv-emoji">🍖</span> Ердийн</div>
        <div class="inv-opt" data-val="Веган" onclick="invCelebrateWork(this)"><span class="inv-emoji">🥗</span> Веган</div>
        <div class="inv-opt" data-val="Аллерги/бусад" onclick="invCelebrateWork(this)"><span class="inv-emoji">⚠️</span> Аллерги/бусад</div>
      </div>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-celebrate-work" data-step="inv-s-celebrate-work">
      <div class="inv-eyebrow">Баталгаажлаа ✅</div>
      <h1 style="font-size:26px;">Уулзацгаая!</h1>
      <p class="inv-sub">Таны ирцийг бүртгэлээ. Тэнд уулзацгаая 💼</p>
    </div>`);

  app.innerHTML = `<div id="inviteApp"><div id="inv-stage">${steps.join("")}</div></div>`;
  invIndexPages(invite);
  invSetupMemoryGame("invWorkMemGrid", "invWorkMemNextBtn", ["💼","📊","🤝","📈","✅","🗓️"], "💼");
  invSetupClickerGame();
  invSetupWheel("invWheel1", INV_WHEEL_FORMAL);
}

function invCelebrateWork(el) {
  document.querySelectorAll("#inv-opts-meal .inv-opt").forEach(o => o.classList.remove("inv-picked"));
  el.classList.add("inv-picked");
  const meal = el.dataset.val;
  submitInviteResponse({ rsvp: "ирнэ", meal });
  setTimeout(() => invGoTo("inv-s-celebrate-work"), 380);
}

// ================= ГЭР БҮЛИЙН АРГА ХЭМЖЭЭ (юу авчрах, зочны тоо, мессеж) =================
function renderFamilyExperience(data, invite, targetId) {
  targetId = targetId || "inviteRoot";
  const app = document.getElementById(targetId);
  const encLines = invPickEncourageSet(false, 7);
  const steps = [];
  steps.push(`
    <div class="inv-card active" id="inv-s-intro" data-step="inv-s-intro">
      <div class="inv-eyebrow">Урилга 👶</div>
      <h1 style="font-size:30px;">${escapeHtml(data.title || "Гэр бүлийн арга хэмжээ")}</h1>
      <p class="inv-sub">${data.message ? escapeHtml(data.message) : "Гэр бүлээрээ ирээрэй!"}</p>
      <button class="inv-btn" type="button" onclick="invAdvance()">Дэлгэрэнгүй →</button>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-details" data-step="inv-s-details">
      <div class="inv-eyebrow">Дэлгэрэнгүй мэдээлэл 📋</div>
      <h1 style="font-size:26px;">Хэзээ, хаана?</h1>
      <div class="inv-summary">
        📅 ${escapeHtml(data.date || "Тодорхойгүй")} ${data.time ? "· " + escapeHtml(data.time) : ""}<br>
        📍 ${escapeHtml(data.location || "Тодорхойгүй")}
      </div>
      ${data.location ? mapEmbedHtml(data.location) : ""}
      <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
    </div>`);
  if (data.bring) {
    steps.push(`
    <div class="inv-card" id="inv-s-bring" data-step="inv-s-bring">
      <div class="inv-eyebrow">Юу авчрах вэ 🧺</div>
      <h1 style="font-size:26px;">Санал болгож буй зүйлс</h1>
      <p class="inv-sub">${escapeHtml(data.bring)}</p>
      <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
    </div>`);
  }
  steps.push(`
    <div class="inv-card" id="inv-s-guests" data-step="inv-s-guests">
      <div class="inv-eyebrow">Хэдэн хүнтэй ирэх вэ? 👨‍👩‍👧‍👦</div>
      <h1 style="font-size:26px;">Гэр бүлийн тоогоо сонгоно уу</h1>
      <div class="inv-options" id="inv-opts-guests">
        <div class="inv-opt" data-val="1-2 хүн" onclick="invPick('inv-opts-guests', this, 'guests', 'inv-s-memgame')"><span class="inv-emoji">🧑</span> 1-2 хүн</div>
        <div class="inv-opt" data-val="3-4 хүн" onclick="invPick('inv-opts-guests', this, 'guests', 'inv-s-memgame')"><span class="inv-emoji">👨‍👩‍👧</span> 3-4 хүн</div>
        <div class="inv-opt" data-val="5+ хүн" onclick="invPick('inv-opts-guests', this, 'guests', 'inv-s-memgame')"><span class="inv-emoji">👨‍👩‍👧‍👦</span> 5+ хүн</div>
      </div>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-memgame" data-step="inv-s-memgame">
      <div class="inv-eyebrow">Бонус тоглоом 🎮</div>
      <h1 style="font-size:28px;">Хосуудыг олоорой!</h1>
      <p class="inv-sub">Ижил emoji-г олж хос болгоорой ✨</p>
      <div class="inv-mem-grid" id="invFamMemGrid"></div>
      <button class="inv-btn" id="invFamMemNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-clicker" data-step="inv-s-clicker">
      <div class="inv-eyebrow">Бонус тоглоом 🏡</div>
      <h1 style="font-size:28px;">5 секундэд хэдэн удаа дарж чадах вэ?</h1>
      <p class="inv-sub" id="invClickerSub">Товч дээр дараад эхэлье!</p>
      <div id="invClickerHeart" onclick="invClickerTap()" style="font-size:80px;cursor:pointer;user-select:none;margin:10px 0 16px;transition:transform .1s;">🏡</div>
      <div style="font-size:20px;font-weight:700;color:var(--inv-rose-deep);margin-bottom:16px;">Оноо: <span id="invClickerScore">0</span></div>
      <button class="inv-btn" id="invClickerNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-wheel" data-step="inv-s-wheel">
      <div class="inv-eyebrow">Азын дугуй 🎡</div>
      <h1 style="font-size:26px;">Энэ өдөр ямар байх бол?</h1>
      <div class="inv-wheel-wrap">
        <div class="inv-wheel-pointer">▼</div>
        <div class="inv-wheel" id="invWheel1"></div>
      </div>
      <button class="inv-btn" type="button" onclick="invSpinWheel('invWheel1','invWheelResult1','invWheelNextBtn1', INV_WHEEL_CELEBRATION)">🎡 Эргүүл!</button>
      <div id="invWheelResult1"></div>
      <button class="inv-btn" id="invWheelNextBtn1" type="button" style="display:none;margin-top:10px;" onclick="invAdvance()">Дараах →</button>
    </div>`);
  steps.push(invEncourageChain(["inv-s-enc1", "inv-s-enc2", "inv-s-enc3", "inv-s-enc4", "inv-s-enc5", "inv-s-enc6", "inv-s-enc7"], encLines, "inv-s-rsvp"));
  steps.push(`
    <div class="inv-card" id="inv-s-rsvp" data-step="inv-s-rsvp">
      <div class="inv-eyebrow">RSVP</div>
      <h1>Ирэх үү? 🏡</h1>
      <div class="inv-final-buttons">
        <button class="inv-btn" id="inv-yesBtn" type="button" onclick="invCelebrateFamily()">Заавал ирнэ! ✅</button>
        <button class="inv-btn inv-btn-ghost" id="inv-noBtn" type="button"
          onclick="invDecline()" onmouseenter="invDodge()" ontouchstart="invDodge(); event.preventDefault();">Ирэхгүй</button>
      </div>
      ${INV_RSVP_HINT}
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-celebrate" data-step="inv-s-celebrate">
      <div class="inv-eyebrow">Баярлалаа 🎉</div>
      <h1>Тэгвэл хамт цуглацгаая!</h1>
      <p class="inv-sub">Гэр бүлээрээ ирнэ гэдгийг тань бүртгэлээ 🏡</p>
    </div>`);

  app.innerHTML = `
  <div id="inviteApp">
    <div id="inv-heartRain"></div>
    <div id="inv-stage">${steps.join("")}</div>
  </div>`;
  invIndexPages(invite);
  invSetupMemoryGame("invFamMemGrid", "invFamMemNextBtn", ["🏡","👨‍👩‍👧","🎈","🍰","✨","💛"], "🏡");
  invSetupClickerGame();
  invSetupWheel("invWheel1", INV_WHEEL_CELEBRATION);
}

function invCelebrateFamily() {
  invGoTo("inv-s-celebrate");
  invHeartBurst(45, ["🎉","🏡","👨‍👩‍👧‍👦","✨"]);
  submitInviteResponse({ rsvp: "ирнэ", guests: invAnswers.guests });
}

// ================= БАЯРЫН УРИЛГА (баярын тоглоом, мэндчилгээ, RSVP) =================
function renderHolidayExperience(data, invite, targetId) {
  targetId = targetId || "inviteRoot";
  const app = document.getElementById(targetId);
  const holidayName = data.holidayName || "Баяр";
  const encLines = invPickEncourageSet(false, 7);
  app.innerHTML = `
  <div id="inviteApp">
    <div id="inv-petals"></div>
    <div id="inv-heartRain"></div>
    <div id="inv-stage">
      <div class="inv-card active" id="inv-s-intro" data-step="inv-s-intro">
        <div class="inv-eyebrow">Урилга 🎊</div>
        <h1 style="font-size:28px;">🎊 ${escapeHtml(holidayName)}-ийн мэнд хүргэе!</h1>
        <p class="inv-sub">${data.message ? escapeHtml(data.message) : "Баярын өдрөөр хамт байхыг урьж байна."}</p>
        <button class="inv-btn" type="button" onclick="invAdvance()">Дэлгэрэнгүй →</button>
      </div>
      <div class="inv-card" id="inv-s-details" data-step="inv-s-details">
        <div class="inv-eyebrow">Дэлгэрэнгүй мэдээлэл 📋</div>
        <h1 style="font-size:26px;">Хэзээ, хаана?</h1>
        <div class="inv-summary">
          📅 ${escapeHtml(data.date || "Тодорхойгүй")} ${data.time ? "· " + escapeHtml(data.time) : ""}<br>
          📍 ${escapeHtml(data.location || "Тодорхойгүй")}
        </div>
        ${data.location ? mapEmbedHtml(data.location) : ""}
        <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
      </div>
      <div class="inv-card" id="inv-s-memory" data-step="inv-s-memory">
        <div class="inv-eyebrow">Бонус тоглоом 🎮</div>
        <h1 style="font-size:28px;">Хосуудыг олоорой!</h1>
        <p class="inv-sub">Баярын emoji-г хос болгоорой ✨</p>
        <div class="inv-mem-grid" id="invHolMemGrid"></div>
        <button class="inv-btn" id="invHolMemNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
      </div>
      <div class="inv-card" id="inv-s-clicker" data-step="inv-s-clicker">
        <div class="inv-eyebrow">Бонус тоглоом 🎊</div>
        <h1 style="font-size:28px;">5 секундэд хэдэн удаа дарж чадах вэ?</h1>
        <p class="inv-sub" id="invClickerSub">Товч дээр дараад эхэлье!</p>
        <div id="invClickerHeart" onclick="invClickerTap()" style="font-size:80px;cursor:pointer;user-select:none;margin:10px 0 16px;transition:transform .1s;">🎁</div>
        <div style="font-size:20px;font-weight:700;color:var(--inv-rose-deep);margin-bottom:16px;">Оноо: <span id="invClickerScore">0</span></div>
        <button class="inv-btn" id="invClickerNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
      </div>
      <div class="inv-card" id="inv-s-poll1" data-step="inv-s-poll1">
        <div class="inv-eyebrow">Хөгжилтэй асуулт 🎉</div>
        <h1 style="font-size:26px;">Баярыг хэрхэн тэмдэглэх дуртай вэ?</h1>
        <div class="inv-options" id="inv-opts-poll1">
          <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">🎆</span> Гэрэлт харваа үзэх</div>
          <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">🍽</span> Гэр бүлээрээ хооллох</div>
          <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">🎁</span> Бэлэг солилцох</div>
          <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">🥂</span> Ерөөл айлдах</div>
        </div>
      </div>
      <div class="inv-card" id="inv-s-wheel" data-step="inv-s-wheel">
        <div class="inv-eyebrow">Азын дугуй 🎡</div>
        <h1 style="font-size:26px;">Энэ баяр ямар байх бол?</h1>
        <div class="inv-wheel-wrap">
          <div class="inv-wheel-pointer">▼</div>
          <div class="inv-wheel" id="invWheel1"></div>
        </div>
        <button class="inv-btn" type="button" onclick="invSpinWheel('invWheel1','invWheelResult1','invWheelNextBtn1', INV_WHEEL_CELEBRATION)">🎡 Эргүүл!</button>
        <div id="invWheelResult1"></div>
        <button class="inv-btn" id="invWheelNextBtn1" type="button" style="display:none;margin-top:10px;" onclick="invAdvance()">Дараах →</button>
      </div>
      ${invEncourageChain(["inv-s-enc1", "inv-s-enc2", "inv-s-enc3", "inv-s-enc4", "inv-s-enc5", "inv-s-enc6", "inv-s-enc7"], encLines, "inv-s-rsvp")}
      <div class="inv-card" id="inv-s-rsvp" data-step="inv-s-rsvp">
        <div class="inv-eyebrow">RSVP</div>
        <h1>Ирэх үү? 🎉</h1>
        <div class="inv-final-buttons">
          <button class="inv-btn" id="inv-yesBtn" type="button" onclick="invCelebrateHoliday()">Заавал ирнэ! 🎊</button>
          <button class="inv-btn inv-btn-ghost" id="inv-noBtn" type="button"
            onclick="invDecline()" onmouseenter="invDodge()" ontouchstart="invDodge(); event.preventDefault();">Ирэхгүй</button>
        </div>
        ${INV_RSVP_HINT}
      </div>
      <div class="inv-card" id="inv-s-celebrate" data-step="inv-s-celebrate">
        <div class="inv-eyebrow">Баяр хүргэе 🎊</div>
        <h1>${escapeHtml(holidayName)} гэсэн үгс мэндлэе!</h1>
        <p class="inv-sub">Баярын өдрийг хамтдаа тэмдэглэцгээе 🥳</p>
      </div>
    </div>
  </div>`;
  invIndexPages(invite);
  invStartPetals();
  invSetupMemoryGame("invHolMemGrid", "invHolMemNextBtn", ["🎄","🎁","🔔","⭐","❄️","🥂"], "🎊");
  invSetupClickerGame();
  invSetupWheel("invWheel1", INV_WHEEL_CELEBRATION);
}

function invCelebrateHoliday() {
  invGoTo("inv-s-celebrate");
  invHeartBurst(55, ["🎉","🎊","❄️","⭐","🥂"]);
  setTimeout(() => invHeartBurst(35, ["🎉","🎊","✨"]), 1500);
  submitInviteResponse({ rsvp: "ирнэ" });
}

// ================= ҮДЭШЛЭГ (сэдэв, дуу хүсэлт, RSVP) =================
function renderPartyExperience(data, invite, targetId) {
  targetId = targetId || "inviteRoot";
  const app = document.getElementById(targetId);
  const encLines = invPickEncourageSet(false, 6);
  const steps = [];
  steps.push(`
    <div class="inv-card active" id="inv-s-intro" data-step="inv-s-intro">
      <div class="inv-eyebrow">Урилга 🥳</div>
      <h1 style="font-size:30px;">${escapeHtml(data.title || "Үдэшлэг")}</h1>
      <p class="inv-sub">${data.message ? escapeHtml(data.message) : "Хамт баярлацгаая!"}</p>
      <button class="inv-btn" type="button" onclick="invAdvance()">Дэлгэрэнгүй →</button>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-details" data-step="inv-s-details">
      <div class="inv-eyebrow">Дэлгэрэнгүй мэдээлэл 📋</div>
      <h1 style="font-size:26px;">Хэзээ, хаана?</h1>
      <div class="inv-summary">
        📅 ${escapeHtml(data.date || "Тодорхойгүй")} ${data.time ? "· " + escapeHtml(data.time) : ""}<br>
        📍 ${escapeHtml(data.location || "Тодорхойгүй")}
      </div>
      ${data.location ? mapEmbedHtml(data.location) : ""}
      <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
    </div>`);
  if (data.theme) {
    steps.push(`
    <div class="inv-card" id="inv-s-theme" data-step="inv-s-theme">
      <div class="inv-eyebrow">Сэдэв 🎨</div>
      <h1 style="font-size:26px;">Ямар маягаар ирэх вэ?</h1>
      <p class="inv-sub">${escapeHtml(data.theme)}</p>
      <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
    </div>`);
  }
  steps.push(`
    <div class="inv-card" id="inv-s-playlist" data-step="inv-s-playlist">
      <div class="inv-eyebrow">Дуу хүсэлт 🎵</div>
      <h1 style="font-size:24px;">Ямар дуу тоглуулаасай гэж хүсэж байна вэ?</h1>
      <textarea id="invPartySongInput" rows="2" style="width:100%;border:2px solid var(--inv-line);border-radius:12px;padding:12px;font-family:inherit;font-size:14px;margin-bottom:16px;resize:vertical;" placeholder="Дуу/дуучны нэрээ бичээрэй (заавал биш)"></textarea>
      <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-memgame" data-step="inv-s-memgame">
      <div class="inv-eyebrow">Бонус тоглоом 🎮</div>
      <h1 style="font-size:28px;">Хосуудыг олоорой!</h1>
      <p class="inv-sub">Ижил emoji-г олж хос болгоорой ✨</p>
      <div class="inv-mem-grid" id="invPartyMemGrid"></div>
      <button class="inv-btn" id="invPartyMemNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-clicker" data-step="inv-s-clicker">
      <div class="inv-eyebrow">Бонус тоглоом 🥳</div>
      <h1 style="font-size:28px;">5 секундэд хэдэн удаа дарж чадах вэ?</h1>
      <p class="inv-sub" id="invClickerSub">Товч дээр дараад эхэлье!</p>
      <div id="invClickerHeart" onclick="invClickerTap()" style="font-size:80px;cursor:pointer;user-select:none;margin:10px 0 16px;transition:transform .1s;">🎉</div>
      <div style="font-size:20px;font-weight:700;color:var(--inv-rose-deep);margin-bottom:16px;">Оноо: <span id="invClickerScore">0</span></div>
      <button class="inv-btn" id="invClickerNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-poll1" data-step="inv-s-poll1">
      <div class="inv-eyebrow">Хөгжилтэй асуулт 🕺</div>
      <h1 style="font-size:26px;">Үдэшлэгт юу хамгийн ихээр хийх дуртай вэ?</h1>
      <div class="inv-options" id="inv-opts-poll1">
        <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">💃</span> Бүжиглэх</div>
        <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">📸</span> Зураг авах</div>
        <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">🎤</span> Караоке дуулах</div>
        <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">😂</span> Инээж хөгжих</div>
      </div>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-wheel" data-step="inv-s-wheel">
      <div class="inv-eyebrow">Азын дугуй 🎡</div>
      <h1 style="font-size:26px;">Энэ үдэшлэг ямар байх бол?</h1>
      <div class="inv-wheel-wrap">
        <div class="inv-wheel-pointer">▼</div>
        <div class="inv-wheel" id="invWheel1"></div>
      </div>
      <button class="inv-btn" type="button" onclick="invSpinWheel('invWheel1','invWheelResult1','invWheelNextBtn1', INV_WHEEL_CELEBRATION)">🎡 Эргүүл!</button>
      <div id="invWheelResult1"></div>
      <button class="inv-btn" id="invWheelNextBtn1" type="button" style="display:none;margin-top:10px;" onclick="invAdvance()">Дараах →</button>
    </div>`);
  steps.push(invEncourageChain(["inv-s-enc1", "inv-s-enc2", "inv-s-enc3", "inv-s-enc4", "inv-s-enc5", "inv-s-enc6"], encLines, "inv-s-rsvp"));
  steps.push(`
    <div class="inv-card" id="inv-s-rsvp" data-step="inv-s-rsvp">
      <div class="inv-eyebrow">RSVP</div>
      <h1>Ирэх үү? 🥳</h1>
      <div class="inv-final-buttons">
        <button class="inv-btn" id="inv-yesBtn" type="button" onclick="invCelebrateParty()">Заавал ирнэ! 🎉</button>
        <button class="inv-btn inv-btn-ghost" id="inv-noBtn" type="button"
          onclick="invDecline()" onmouseenter="invDodge()" ontouchstart="invDodge(); event.preventDefault();">Ирэхгүй</button>
      </div>
      ${INV_RSVP_HINT}
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-celebrate" data-step="inv-s-celebrate">
      <div class="inv-eyebrow">Баярлалаа 🎉</div>
      <h1>Тэгвэл хамт баярлацгаая!</h1>
      <p class="inv-sub" id="invPartyNote">Тэсэн ядан хүлээж байна 🥳</p>
    </div>`);
  app.innerHTML = `<div id="inviteApp"><div id="inv-heartRain"></div><div id="inv-stage">${steps.join("")}</div></div>`;
  invIndexPages(invite);
  invSetupMemoryGame("invPartyMemGrid", "invPartyMemNextBtn", ["🥳","🎉","🎊","🕺","🎵","✨"], "🎈");
  invSetupClickerGame();
  invSetupWheel("invWheel1", INV_WHEEL_CELEBRATION);
}

function invCelebrateParty() {
  const song = (document.getElementById("invPartySongInput")?.value || "").trim();
  invGoTo("inv-s-celebrate");
  const note = document.getElementById("invPartyNote");
  if (note && song) note.innerHTML = `Тэсэн ядан хүлээж байна 🥳<br><br>🎵 Хүссэн дуу: <b>${escapeHtml(song)}</b>`;
  invHeartBurst(55, ["🎉","🥳","🎊","🕺","✨"]);
  submitInviteResponse({ rsvp: "ирнэ", song });
}

// ================= УУЛЗАЛТ (зорилго, RSVP) =================
function renderMeetingExperience(data, invite, targetId) {
  targetId = targetId || "inviteRoot";
  const app = document.getElementById(targetId);
  const encLines = invPickEncourageSet(false, 8);
  const steps = [];
  steps.push(`
    <div class="inv-card active" id="inv-s-intro" data-step="inv-s-intro">
      <div class="inv-eyebrow">Урилга 👥</div>
      <h1 style="font-size:30px;">${escapeHtml(data.title || "Уулзалт")}</h1>
      <p class="inv-sub">Таныг уулзалтад урьж байна.</p>
      <button class="inv-btn" type="button" onclick="invAdvance()">Дэлгэрэнгүй →</button>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-details" data-step="inv-s-details">
      <div class="inv-eyebrow">Дэлгэрэнгүй мэдээлэл 📋</div>
      <h1 style="font-size:26px;">Хэзээ, хаана?</h1>
      <div class="inv-summary">
        📅 ${escapeHtml(data.date || "Тодорхойгүй")} ${data.time ? "· " + escapeHtml(data.time) : ""}<br>
        📍 ${escapeHtml(data.location || "Тодорхойгүй")}
      </div>
      ${data.location ? mapEmbedHtml(data.location) : ""}
      <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
    </div>`);
  if (data.purpose) {
    steps.push(`
    <div class="inv-card" id="inv-s-purpose" data-step="inv-s-purpose">
      <div class="inv-eyebrow">Зорилго 🎯</div>
      <h1 style="font-size:26px;">Юуны талаар ярилцах вэ?</h1>
      <p class="inv-sub">${escapeHtml(data.purpose)}</p>
      <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
    </div>`);
  }
  steps.push(`
    <div class="inv-card" id="inv-s-memgame" data-step="inv-s-memgame">
      <div class="inv-eyebrow">Бонус тоглоом 🎮</div>
      <h1 style="font-size:28px;">Хосуудыг олоорой!</h1>
      <p class="inv-sub">Ижил emoji-г олж хос болгоорой ✨</p>
      <div class="inv-mem-grid" id="invMeetMemGrid"></div>
      <button class="inv-btn" id="invMeetMemNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-clicker" data-step="inv-s-clicker">
      <div class="inv-eyebrow">Бонус тоглоом ⚡</div>
      <h1 style="font-size:28px;">5 секундэд хэдэн удаа дарж чадах вэ?</h1>
      <p class="inv-sub" id="invClickerSub">Товч дээр дараад эхэлье!</p>
      <div id="invClickerHeart" onclick="invClickerTap()" style="font-size:80px;cursor:pointer;user-select:none;margin:10px 0 16px;transition:transform .1s;">👥</div>
      <div style="font-size:20px;font-weight:700;color:var(--inv-rose-deep);margin-bottom:16px;">Оноо: <span id="invClickerScore">0</span></div>
      <button class="inv-btn" id="invClickerNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-wheel" data-step="inv-s-wheel">
      <div class="inv-eyebrow">Азын дугуй 🎡</div>
      <h1 style="font-size:26px;">Энэ уулзалт ямар байх бол?</h1>
      <div class="inv-wheel-wrap">
        <div class="inv-wheel-pointer">▼</div>
        <div class="inv-wheel" id="invWheel1"></div>
      </div>
      <button class="inv-btn" type="button" onclick="invSpinWheel('invWheel1','invWheelResult1','invWheelNextBtn1', INV_WHEEL_FORMAL)">🎡 Эргүүл!</button>
      <div id="invWheelResult1"></div>
      <button class="inv-btn" id="invWheelNextBtn1" type="button" style="display:none;margin-top:10px;" onclick="invAdvance()">Дараах →</button>
    </div>`);
  steps.push(invEncourageChain(["inv-s-enc1", "inv-s-enc2", "inv-s-enc3", "inv-s-enc4", "inv-s-enc5", "inv-s-enc6", "inv-s-enc7", "inv-s-enc8"], encLines, "inv-s-rsvp"));
  steps.push(`
    <div class="inv-card" id="inv-s-rsvp" data-step="inv-s-rsvp">
      <div class="inv-eyebrow">RSVP</div>
      <h1>Ирж чадах уу?</h1>
      <div class="inv-final-buttons">
        <button class="inv-btn" id="inv-yesBtn" type="button" onclick="invCelebrateMeeting()">Ирнэ ✅</button>
        <button class="inv-btn inv-btn-ghost" id="inv-noBtn" type="button"
          onclick="invDecline()" onmouseenter="invDodge()" ontouchstart="invDodge(); event.preventDefault();">Ирэхгүй</button>
      </div>
      ${INV_RSVP_HINT}
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-celebrate" data-step="inv-s-celebrate">
      <div class="inv-eyebrow">Баталгаажлаа ✅</div>
      <h1 style="font-size:26px;">Уулзацгаая!</h1>
      <p class="inv-sub">Таны ирцийг бүртгэлээ 👥</p>
    </div>`);
  app.innerHTML = `<div id="inviteApp"><div id="inv-stage">${steps.join("")}</div></div>`;
  invIndexPages(invite);
  invSetupMemoryGame("invMeetMemGrid", "invMeetMemNextBtn", ["👥","🤝","💼","📋","✅","🎯"], "👥");
  invSetupClickerGame();
  invSetupWheel("invWheel1", INV_WHEEL_FORMAL);
}
function invCelebrateMeeting() { invGoTo("inv-s-celebrate"); submitInviteResponse({ rsvp: "ирнэ" }); }

// ================= БОЛОВСРОЛ (хөтөлбөр, RSVP) =================
function renderEducationExperience(data, invite, targetId) {
  targetId = targetId || "inviteRoot";
  const app = document.getElementById(targetId);
  const programItems = (data.program || "").split("\n").map(s => s.trim()).filter(Boolean);
  const encLines = invPickEncourageSet(false, 8);
  const steps = [];
  steps.push(`
    <div class="inv-card active" id="inv-s-intro" data-step="inv-s-intro">
      <div class="inv-eyebrow">Урилга 🎓</div>
      <h1 style="font-size:30px;">${escapeHtml(data.title || "Боловсролын арга хэмжээ")}</h1>
      <p class="inv-sub">Таныг оролцохыг урьж байна.</p>
      <button class="inv-btn" type="button" onclick="invAdvance()">Дэлгэрэнгүй →</button>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-details" data-step="inv-s-details">
      <div class="inv-eyebrow">Дэлгэрэнгүй мэдээлэл 📋</div>
      <h1 style="font-size:26px;">Хэзээ, хаана?</h1>
      <div class="inv-summary">
        📅 ${escapeHtml(data.date || "Тодорхойгүй")} ${data.time ? "· " + escapeHtml(data.time) : ""}<br>
        📍 ${escapeHtml(data.location || "Тодорхойгүй")}
      </div>
      ${data.location ? mapEmbedHtml(data.location) : ""}
      <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
    </div>`);
  if (programItems.length) {
    steps.push(`
    <div class="inv-card" id="inv-s-program" data-step="inv-s-program">
      <div class="inv-eyebrow">Хөтөлбөр 📖</div>
      <h1 style="font-size:26px;">Юу болох вэ?</h1>
      <div class="inv-summary">${programItems.map(p => `<div>▸ ${escapeHtml(p)}</div>`).join("")}</div>
      <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
    </div>`);
  }
  steps.push(`
    <div class="inv-card" id="inv-s-memgame" data-step="inv-s-memgame">
      <div class="inv-eyebrow">Бонус тоглоом 🎮</div>
      <h1 style="font-size:28px;">Хосуудыг олоорой!</h1>
      <p class="inv-sub">Ижил emoji-г олж хос болгоорой ✨</p>
      <div class="inv-mem-grid" id="invEduMemGrid"></div>
      <button class="inv-btn" id="invEduMemNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-clicker" data-step="inv-s-clicker">
      <div class="inv-eyebrow">Бонус тоглоом 🎓</div>
      <h1 style="font-size:28px;">5 секундэд хэдэн удаа дарж чадах вэ?</h1>
      <p class="inv-sub" id="invClickerSub">Товч дээр дараад эхэлье!</p>
      <div id="invClickerHeart" onclick="invClickerTap()" style="font-size:80px;cursor:pointer;user-select:none;margin:10px 0 16px;transition:transform .1s;">🎓</div>
      <div style="font-size:20px;font-weight:700;color:var(--inv-rose-deep);margin-bottom:16px;">Оноо: <span id="invClickerScore">0</span></div>
      <button class="inv-btn" id="invClickerNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-wheel" data-step="inv-s-wheel">
      <div class="inv-eyebrow">Азын дугуй 🎡</div>
      <h1 style="font-size:26px;">Энэ арга хэмжээ ямар байх бол?</h1>
      <div class="inv-wheel-wrap">
        <div class="inv-wheel-pointer">▼</div>
        <div class="inv-wheel" id="invWheel1"></div>
      </div>
      <button class="inv-btn" type="button" onclick="invSpinWheel('invWheel1','invWheelResult1','invWheelNextBtn1', INV_WHEEL_FORMAL)">🎡 Эргүүл!</button>
      <div id="invWheelResult1"></div>
      <button class="inv-btn" id="invWheelNextBtn1" type="button" style="display:none;margin-top:10px;" onclick="invAdvance()">Дараах →</button>
    </div>`);
  steps.push(invEncourageChain(["inv-s-enc1", "inv-s-enc2", "inv-s-enc3", "inv-s-enc4", "inv-s-enc5", "inv-s-enc6", "inv-s-enc7", "inv-s-enc8"], encLines, "inv-s-rsvp"));
  steps.push(`
    <div class="inv-card" id="inv-s-rsvp" data-step="inv-s-rsvp">
      <div class="inv-eyebrow">RSVP</div>
      <h1>Оролцох уу? 🎓</h1>
      <div class="inv-final-buttons">
        <button class="inv-btn" id="inv-yesBtn" type="button" onclick="invCelebrateEducation()">Оролцоно! ✅</button>
        <button class="inv-btn inv-btn-ghost" id="inv-noBtn" type="button"
          onclick="invDecline()" onmouseenter="invDodge()" ontouchstart="invDodge(); event.preventDefault();">Оролцохгүй</button>
      </div>
      ${INV_RSVP_HINT}
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-celebrate" data-step="inv-s-celebrate">
      <div class="inv-eyebrow">Баталгаажлаа 🎉</div>
      <h1 style="font-size:26px;">Тэнд уулзацгаая!</h1>
      <p class="inv-sub">Таны оролцоог бүртгэлээ 🎓</p>
    </div>`);
  app.innerHTML = `<div id="inviteApp"><div id="inv-stage">${steps.join("")}</div></div>`;
  invIndexPages(invite);
  invSetupMemoryGame("invEduMemGrid", "invEduMemNextBtn", ["🎓","📖","✏️","🏆","✅","💡"], "🎓");
  invSetupClickerGame();
  invSetupWheel("invWheel1", INV_WHEEL_FORMAL);
}
function invCelebrateEducation() { invGoTo("inv-s-celebrate"); submitInviteResponse({ rsvp: "оролцоно" }); }

// ================= СПОРТ (хэрэгсэл, RSVP) =================
function renderSportExperience(data, invite, targetId) {
  targetId = targetId || "inviteRoot";
  const app = document.getElementById(targetId);
  const encLines = invPickEncourageSet(false, 7);
  const steps = [];
  steps.push(`
    <div class="inv-card active" id="inv-s-intro" data-step="inv-s-intro">
      <div class="inv-eyebrow">Урилга 🏆</div>
      <h1 style="font-size:30px;">${escapeHtml(data.title || "Спортын арга хэмжээ")}</h1>
      <p class="inv-sub">Таныг тэмцээнд урьж байна!</p>
      <button class="inv-btn" type="button" onclick="invAdvance()">Дэлгэрэнгүй →</button>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-details" data-step="inv-s-details">
      <div class="inv-eyebrow">Дэлгэрэнгүй мэдээлэл 📋</div>
      <h1 style="font-size:26px;">Хэзээ, хаана?</h1>
      <div class="inv-summary">
        📅 ${escapeHtml(data.date || "Тодорхойгүй")} ${data.time ? "· " + escapeHtml(data.time) : ""}<br>
        📍 ${escapeHtml(data.location || "Тодорхойгүй")}
      </div>
      ${data.location ? mapEmbedHtml(data.location) : ""}
      <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
    </div>`);
  if (data.gear) {
    steps.push(`
    <div class="inv-card" id="inv-s-gear" data-step="inv-s-gear">
      <div class="inv-eyebrow">Юу авч явах вэ 🎒</div>
      <h1 style="font-size:26px;">Бэлтгэл</h1>
      <p class="inv-sub">${escapeHtml(data.gear)}</p>
      <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
    </div>`);
  }
  steps.push(`
    <div class="inv-card" id="inv-s-memgame" data-step="inv-s-memgame">
      <div class="inv-eyebrow">Бонус тоглоом 🎮</div>
      <h1 style="font-size:28px;">Хосуудыг олоорой!</h1>
      <p class="inv-sub">Ижил emoji-г олж хос болгоорой ✨</p>
      <div class="inv-mem-grid" id="invSportMemGrid"></div>
      <button class="inv-btn" id="invSportMemNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-clicker" data-step="inv-s-clicker">
      <div class="inv-eyebrow">Бонус тоглоом 💪</div>
      <h1 style="font-size:28px;">5 секундэд хэдэн удаа дарж чадах вэ?</h1>
      <p class="inv-sub" id="invClickerSub">Товч дээр дараад эхэлье!</p>
      <div id="invClickerHeart" onclick="invClickerTap()" style="font-size:80px;cursor:pointer;user-select:none;margin:10px 0 16px;transition:transform .1s;">🏆</div>
      <div style="font-size:20px;font-weight:700;color:var(--inv-rose-deep);margin-bottom:16px;">Оноо: <span id="invClickerScore">0</span></div>
      <button class="inv-btn" id="invClickerNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-poll1" data-step="inv-s-poll1">
      <div class="inv-eyebrow">Хөгжилтэй асуулт ⚽</div>
      <h1 style="font-size:26px;">Хэн түрүүлнэ гэж бодож байна?</h1>
      <div class="inv-options" id="inv-opts-poll1">
        <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">🥇</span> Бид ялна!</div>
        <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">🤝</span> Тэн жин</div>
        <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">😅</span> Оролдоно доо</div>
        <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">🎉</span> Оролцоо чухал</div>
      </div>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-wheel" data-step="inv-s-wheel">
      <div class="inv-eyebrow">Азын дугуй 🎡</div>
      <h1 style="font-size:26px;">Энэ тэмцээн ямар байх бол?</h1>
      <div class="inv-wheel-wrap">
        <div class="inv-wheel-pointer">▼</div>
        <div class="inv-wheel" id="invWheel1"></div>
      </div>
      <button class="inv-btn" type="button" onclick="invSpinWheel('invWheel1','invWheelResult1','invWheelNextBtn1', INV_WHEEL_CELEBRATION)">🎡 Эргүүл!</button>
      <div id="invWheelResult1"></div>
      <button class="inv-btn" id="invWheelNextBtn1" type="button" style="display:none;margin-top:10px;" onclick="invAdvance()">Дараах →</button>
    </div>`);
  steps.push(invEncourageChain(["inv-s-enc1", "inv-s-enc2", "inv-s-enc3", "inv-s-enc4", "inv-s-enc5", "inv-s-enc6", "inv-s-enc7"], encLines, "inv-s-rsvp"));
  steps.push(`
    <div class="inv-card" id="inv-s-rsvp" data-step="inv-s-rsvp">
      <div class="inv-eyebrow">RSVP</div>
      <h1>Тоглох уу? 🏆</h1>
      <div class="inv-final-buttons">
        <button class="inv-btn" id="inv-yesBtn" type="button" onclick="invCelebrateSport()">Заавал орно! 💪</button>
        <button class="inv-btn inv-btn-ghost" id="inv-noBtn" type="button"
          onclick="invDecline()" onmouseenter="invDodge()" ontouchstart="invDodge(); event.preventDefault();">Оролцохгүй</button>
      </div>
      ${INV_RSVP_HINT}
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-celebrate" data-step="inv-s-celebrate">
      <div class="inv-eyebrow">Баталгаажлаа 🏆</div>
      <h1>Тэнд уулзацгаая, ялалт бидэнд!</h1>
      <p class="inv-sub">Таны оролцоог бүртгэлээ 💪</p>
    </div>`);
  app.innerHTML = `<div id="inviteApp"><div id="inv-heartRain"></div><div id="inv-stage">${steps.join("")}</div></div>`;
  invIndexPages(invite);
  invSetupMemoryGame("invSportMemGrid", "invSportMemNextBtn", ["🏆","⚽","🏀","💪","🎯","🥇"], "🏆");
  invSetupClickerGame();
  invSetupWheel("invWheel1", INV_WHEEL_CELEBRATION);
}
function invCelebrateSport() {
  invGoTo("inv-s-celebrate");
  invHeartBurst(45, ["🏆","⚽","🎉","💪","✨"]);
  submitInviteResponse({ rsvp: "ирнэ" });
}

// ================= СОЁЛ УРЛАГ (хувцасны код, RSVP) =================
function renderCultureExperience(data, invite, targetId) {
  targetId = targetId || "inviteRoot";
  const app = document.getElementById(targetId);
  const encLines = invPickEncourageSet(false, 7);
  const steps = [];
  steps.push(`
    <div class="inv-card active" id="inv-s-intro" data-step="inv-s-intro">
      <div class="inv-eyebrow">Урилга 🎭</div>
      <h1 style="font-size:30px;">${escapeHtml(data.title || "Соёл урлагийн арга хэмжээ")}</h1>
      <p class="inv-sub">Таныг урлагийн үзэсгэлэнд урьж байна.</p>
      <button class="inv-btn" type="button" onclick="invAdvance()">Дэлгэрэнгүй →</button>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-details" data-step="inv-s-details">
      <div class="inv-eyebrow">Дэлгэрэнгүй мэдээлэл 📋</div>
      <h1 style="font-size:26px;">Хэзээ, хаана?</h1>
      <div class="inv-summary">
        📅 ${escapeHtml(data.date || "Тодорхойгүй")} ${data.time ? "· " + escapeHtml(data.time) : ""}<br>
        📍 ${escapeHtml(data.location || "Тодорхойгүй")}
      </div>
      ${data.location ? mapEmbedHtml(data.location) : ""}
      <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
    </div>`);
  if (data.dressCode) {
    steps.push(`
    <div class="inv-card" id="inv-s-dress" data-step="inv-s-dress">
      <div class="inv-eyebrow">Хувцасны код 👗</div>
      <h1 style="font-size:26px;">Юу өмсөх вэ?</h1>
      <p class="inv-sub">${escapeHtml(data.dressCode)}</p>
      <button class="inv-btn" type="button" onclick="invAdvance()">Үргэлжлүүлэх →</button>
    </div>`);
  }
  steps.push(`
    <div class="inv-card" id="inv-s-memgame" data-step="inv-s-memgame">
      <div class="inv-eyebrow">Бонус тоглоом 🎮</div>
      <h1 style="font-size:28px;">Хосуудыг олоорой!</h1>
      <p class="inv-sub">Ижил emoji-г олж хос болгоорой ✨</p>
      <div class="inv-mem-grid" id="invCultMemGrid"></div>
      <button class="inv-btn" id="invCultMemNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-clicker" data-step="inv-s-clicker">
      <div class="inv-eyebrow">Бонус тоглоом 🎭</div>
      <h1 style="font-size:28px;">5 секундэд хэдэн удаа дарж чадах вэ?</h1>
      <p class="inv-sub" id="invClickerSub">Товч дээр дараад эхэлье!</p>
      <div id="invClickerHeart" onclick="invClickerTap()" style="font-size:80px;cursor:pointer;user-select:none;margin:10px 0 16px;transition:transform .1s;">🎭</div>
      <div style="font-size:20px;font-weight:700;color:var(--inv-rose-deep);margin-bottom:16px;">Оноо: <span id="invClickerScore">0</span></div>
      <button class="inv-btn" id="invClickerNextBtn" type="button" style="display:none;" onclick="invAdvance()">Дараах →</button>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-poll1" data-step="inv-s-poll1">
      <div class="inv-eyebrow">Хөгжилтэй асуулт 🎨</div>
      <h1 style="font-size:26px;">Юуг хамгийн ихээр хүлээж байна вэ?</h1>
      <div class="inv-options" id="inv-opts-poll1">
        <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">🎬</span> Гол тоглолт</div>
        <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">🍷</span> Завсарлагааны цай</div>
        <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">👗</span> Хуванцарлах</div>
        <div class="inv-opt" onclick="invPollPick('inv-opts-poll1', this, 'inv-s-wheel')"><span class="inv-emoji">💬</span> Дараа нь ярилцах</div>
      </div>
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-wheel" data-step="inv-s-wheel">
      <div class="inv-eyebrow">Азын дугуй 🎡</div>
      <h1 style="font-size:26px;">Энэ үзвэр ямар байх бол?</h1>
      <div class="inv-wheel-wrap">
        <div class="inv-wheel-pointer">▼</div>
        <div class="inv-wheel" id="invWheel1"></div>
      </div>
      <button class="inv-btn" type="button" onclick="invSpinWheel('invWheel1','invWheelResult1','invWheelNextBtn1', INV_WHEEL_CELEBRATION)">🎡 Эргүүл!</button>
      <div id="invWheelResult1"></div>
      <button class="inv-btn" id="invWheelNextBtn1" type="button" style="display:none;margin-top:10px;" onclick="invAdvance()">Дараах →</button>
    </div>`);
  steps.push(invEncourageChain(["inv-s-enc1", "inv-s-enc2", "inv-s-enc3", "inv-s-enc4", "inv-s-enc5", "inv-s-enc6", "inv-s-enc7"], encLines, "inv-s-rsvp"));
  steps.push(`
    <div class="inv-card" id="inv-s-rsvp" data-step="inv-s-rsvp">
      <div class="inv-eyebrow">RSVP</div>
      <h1>Үзэхээр ирэх үү? 🎭</h1>
      <div class="inv-final-buttons">
        <button class="inv-btn" id="inv-yesBtn" type="button" onclick="invCelebrateCulture()">Заавал ирнэ! 🎉</button>
        <button class="inv-btn inv-btn-ghost" id="inv-noBtn" type="button"
          onclick="invDecline()" onmouseenter="invDodge()" ontouchstart="invDodge(); event.preventDefault();">Ирэхгүй</button>
      </div>
      ${INV_RSVP_HINT}
    </div>`);
  steps.push(`
    <div class="inv-card" id="inv-s-celebrate" data-step="inv-s-celebrate">
      <div class="inv-eyebrow">Баталгаажлаа 🎉</div>
      <h1>Тэнд уулзацгаая!</h1>
      <p class="inv-sub">Таны ирцийг бүртгэлээ 🎭</p>
    </div>`);
  app.innerHTML = `<div id="inviteApp"><div id="inv-stage">${steps.join("")}</div></div>`;
  invIndexPages(invite);
  invSetupMemoryGame("invCultMemGrid", "invCultMemNextBtn", ["🎭","🎨","🎬","🎻","✨","👏"], "🎭");
  invSetupClickerGame();
  invSetupWheel("invWheel1", INV_WHEEL_CELEBRATION);
}
function invCelebrateCulture() { invGoTo("inv-s-celebrate"); submitInviteResponse({ rsvp: "ирнэ" }); }
