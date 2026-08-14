// ===== Урилга: 5-алхамт builder + realtime phone preview =====
// Section 1 → Тohиргоо+мэдээлэл, 2 → Зураг+дурсамж, 3 → Дуу+theme, 4 → Бүтэц/pages, 5 → Preview+Link/QR
// (доор бид 1=Төрөл+мэдээлэл, 2=Зураг, 3=Дуу+theme, 4=Бүтэц, 5=Preview/Send гэж жижиг өөрчлөлттэйгээр
// хэрэгжүүлсэн — spec-ийн 5 үндсэн алхмыг бүрэн хамарна).
//
// generateInviteQr()/selectInviteType()/render<Type>Form() (invite.js) хуучин шууд "сонгоод-
// бөглөөд-QR" урсгал хэвээрээ ажилладаг хэвээр — builder тэднийг ЗАМХЛАХГҮЙ, харин
// renderTypePicker()-ийн type-card click target-ийг үүн рүү шилжүүлсэн (invStartBuilder).
//
// Champion invite: render<Type>Experience(data, targetId) (Phase 2/3-д нэмэгдсэн targetId
// параметр) яг хэвээрээр ашиглаж, preview pane-д өөр container руу mount хийнэ — хүлээн
// авагчийн жинхэнэ үзэх function-той 100% ижил renderer, screenshot биш.

const INV_BUILDER_FIELDS = {
  date: [
    { id: "invField1", label: "Хэнд зориулав вэ? (заавал биш)", type: "text", placeholder: "жишээ: Наранцэцэг" },
  ],
  proposal: [
    { id: "invField1", label: "Хэнд зориулав вэ?", type: "text", placeholder: "жишээ: Наранцэцэг" },
    { id: "invExtra1", label: "Нандин дурсамж (заавал биш)", type: "textarea", rows: 2, placeholder: "Жишээ: Анх танилцсан өдрөө санаж байна уу?" },
    { id: "invExtra2", label: "Сонирхолтой баримтууд (мөр бүрд нэг, заавал биш)", type: "textarea", rows: 3, placeholder: "Хамт X жил байна\nY газар анх уулзсан" },
    { id: "invMessage", label: "Хувийн мессеж (заавал биш)", type: "textarea", rows: 3, placeholder: "Чиний хэлмээр байгаа зүйлээ бичээрэй..." },
  ],
  wedding: [
    { id: "invField1", label: "Хосын нэр", type: "text", placeholder: "Бат & Сараа" },
    { id: "invDate", label: "Огноо", type: "date" },
    { id: "invTime", label: "Цаг", type: "time" },
    { id: "invLocation", label: "Байршил", type: "text", placeholder: "жишээ: ... зочид буудал" },
    { id: "invExtra1", label: "Хосын түүх (заавал биш)", type: "textarea", rows: 2, placeholder: "Бид хэрхэн танилцсан бэ?" },
    { id: "invExtra2", label: "Хувцасны код (заавал биш)", type: "text", placeholder: "жишээ: Хөх, цагаан өнгийн загвар" },
    { id: "invMessage", label: "Мессеж / бэлгийн тухай тэмдэглэл (заавал биш)", type: "textarea", rows: 2, placeholder: "Бэлгийн оронд ерөөл хүсье гэх мэт..." },
  ],
  birthday: [
    { id: "invField1", label: "Хэний төрсөн өдөр вэ?", type: "text", placeholder: "жишээ: Болороо" },
    { id: "invDate", label: "Огноо", type: "date" },
    { id: "invTime", label: "Цаг", type: "time" },
    { id: "invLocation", label: "Байршил", type: "text", placeholder: "жишээ: ... кафе" },
    { id: "invMessage", label: "Мессеж (заавал биш)", type: "textarea", rows: 3, placeholder: "Урилгын дэлгэрэнгүй..." },
  ],
  work: [
    { id: "invField1", label: "Арга хэмжээний нэр", type: "text", placeholder: "жишээ: Улирлын дүгнэлт" },
    { id: "invDate", label: "Огноо", type: "date" },
    { id: "invTime", label: "Цаг", type: "time" },
    { id: "invLocation", label: "Байршил", type: "text", placeholder: "жишээ: ... оффис" },
    { id: "invExtra1", label: "Хөтөлбөр (мөр бүрд нэг зүйл, заавал биш)", type: "textarea", rows: 3, placeholder: "09:00 Нээлт\n10:00 Илтгэл\n12:00 Үдийн хоол" },
    { id: "invExtra2", label: "Хувцасны код (заавал биш)", type: "text", placeholder: "жишээ: Business casual" },
  ],
  family: [
    { id: "invField1", label: "Арга хэмжээний нэр", type: "text", placeholder: "жишээ: Нэрийн өдөр" },
    { id: "invDate", label: "Огноо", type: "date" },
    { id: "invTime", label: "Цаг", type: "time" },
    { id: "invLocation", label: "Байршил", type: "text", placeholder: "жишээ: гэрийн хаяг" },
    { id: "invExtra1", label: "Юу авчрах вэ (заавал биш)", type: "text", placeholder: "жишээ: хүүхдийн хоол, тоглоом" },
    { id: "invMessage", label: "Мессеж (заавал биш)", type: "textarea", rows: 2, placeholder: "Урилгын дэлгэрэнгүй..." },
  ],
  holiday: [
    { id: "invField1", label: "Ямар баяр вэ?", type: "text", placeholder: "жишээ: Шинэ жил, Цагаан сар" },
    { id: "invDate", label: "Огноо", type: "date" },
    { id: "invTime", label: "Цаг", type: "time" },
    { id: "invLocation", label: "Байршил", type: "text", placeholder: "жишээ: гэрийн хаяг" },
    { id: "invMessage", label: "Мессеж (заавал биш)", type: "textarea", rows: 2, placeholder: "Баярын мэндчилгээ..." },
  ],
  party: [
    { id: "invField1", label: "Үдэшлэгийн нэр", type: "text", placeholder: "жишээ: Хаус парти" },
    { id: "invDate", label: "Огноо", type: "date" },
    { id: "invTime", label: "Цаг", type: "time" },
    { id: "invLocation", label: "Байршил", type: "text", placeholder: "жишээ: ... хаяг" },
    { id: "invExtra1", label: "Сэдэв/dress code (заавал биш)", type: "text", placeholder: "жишээ: 90-ээд оны маскарад" },
    { id: "invMessage", label: "Мессеж (заавал биш)", type: "textarea", rows: 2, placeholder: "Урилгын дэлгэрэнгүй..." },
  ],
  meeting: [
    { id: "invField1", label: "Уулзалтын нэр", type: "text", placeholder: "жишээ: Төслийн уулзалт" },
    { id: "invDate", label: "Огноо", type: "date" },
    { id: "invTime", label: "Цаг", type: "time" },
    { id: "invLocation", label: "Байршил", type: "text", placeholder: "жишээ: ... кафе" },
    { id: "invExtra1", label: "Зорилго (заавал биш)", type: "textarea", rows: 2, placeholder: "Юуны талаар ярилцах вэ?" },
  ],
  education: [
    { id: "invField1", label: "Арга хэмжээний нэр", type: "text", placeholder: "жишээ: Төгсөлтийн ёслол" },
    { id: "invDate", label: "Огноо", type: "date" },
    { id: "invTime", label: "Цаг", type: "time" },
    { id: "invLocation", label: "Байршил", type: "text", placeholder: "жишээ: ... сургууль" },
    { id: "invExtra1", label: "Хөтөлбөр (мөр бүрд нэг зүйл, заавал биш)", type: "textarea", rows: 3, placeholder: "Нээлт\nИлтгэл\nГэрчилгээ гардуулах" },
  ],
  sport: [
    { id: "invField1", label: "Арга хэмжээний нэр", type: "text", placeholder: "жишээ: Хөлбөмбөгийн тэмцээн" },
    { id: "invDate", label: "Огноо", type: "date" },
    { id: "invTime", label: "Цаг", type: "time" },
    { id: "invLocation", label: "Байршил", type: "text", placeholder: "жишээ: ... талбай" },
    { id: "invExtra1", label: "Юу авч явах вэ (заавал биш)", type: "text", placeholder: "жишээ: спорт хувцас, ус" },
  ],
  culture: [
    { id: "invField1", label: "Арга хэмжээний нэр", type: "text", placeholder: "жишээ: Театрын үзүүлбэр" },
    { id: "invDate", label: "Огноо", type: "date" },
    { id: "invTime", label: "Цаг", type: "time" },
    { id: "invLocation", label: "Байршил", type: "text", placeholder: "жишээ: ... театр" },
    { id: "invExtra1", label: "Хувцасны код (заавал биш)", type: "text", placeholder: "жишээ: Албан ёсны хувцас" },
  ],
  other: [
    { id: "invField1", label: "Гарчиг", type: "text", placeholder: "жишээ: Урилга" },
    { id: "invDate", label: "Огноо", type: "date" },
    { id: "invTime", label: "Цаг", type: "time" },
    { id: "invLocation", label: "Байршил", type: "text", placeholder: "жишээ: ... газар" },
    { id: "invMessage", label: "Мессеж", type: "textarea", rows: 3, placeholder: "Урилгын дэлгэрэнгүй..." },
  ],
};

const INV_BUILDER_STEP_LABELS = ["Төрөл", "Зураг", "Дуу/Theme", "Бүтэц", "Preview"];

let invBuilder = null;
let invBuilderPreviewTimer = null;

function invStartBuilder(type) {
  if (!INVITE_TYPES[type]) return;
  invBuilder = { step: 1, type, fields: {}, photos: [], music: null, theme: "classic", enabledPages: [], pageOrder: null };
  invRenderBuilder();
}

function invBuilderFieldDefs() {
  const t = INVITE_TYPES[invBuilder.type];
  return INV_BUILDER_FIELDS[t.family] || INV_BUILDER_FIELDS.other;
}

function invBuilderCollectFields() {
  if (!invBuilder) return;
  invBuilderFieldDefs().forEach(f => { invBuilder.fields[f.id] = invVal(f.id); });
}

function invBuilderGoStep(n) {
  if (!invBuilder) return;
  invBuilderCollectFields();
  invBuilder.step = Math.max(1, Math.min(5, n));
  invRenderBuilder();
}
function invBuilderNext() { invBuilderGoStep(invBuilder.step + 1); }
function invBuilderPrev() { invBuilderGoStep(invBuilder.step - 1); }

function invBuilderSchedulePreview() {
  invBuilderCollectFields();
  if (invBuilderPreviewTimer) clearTimeout(invBuilderPreviewTimer);
  invBuilderPreviewTimer = setTimeout(invRenderBuilderPreview, 400);
}

function invRenderBuilder() {
  const root = document.getElementById("inviteRoot");
  if (!root || !invBuilder) return;
  const t = INVITE_TYPES[invBuilder.type];
  root.innerHTML = `
    <a class="back-btn" onclick="invBuilder=null;renderTypePicker()">← Урилгын төрөл сонгох</a>
    <div class="inv-builder-head">
      <h2 style="margin:6px 0 2px;">${t.emoji} ${t.label} — урилга үүсгэх</h2>
      <div class="inv-builder-steps">
        ${[1, 2, 3, 4, 5].map(n => `
          <div class="inv-builder-step-dot ${n === invBuilder.step ? "active" : ""} ${n < invBuilder.step ? "done" : ""}" onclick="invBuilderGoStep(${n})">
            <span class="inv-builder-step-num">${n < invBuilder.step ? "✓" : n}</span>
            <span class="inv-builder-step-label">${INV_BUILDER_STEP_LABELS[n - 1]}</span>
          </div>`).join("")}
      </div>
    </div>
    <div class="inv-builder-layout">
      <div class="inv-builder-editor" id="invBuilderEditor"></div>
      <div class="inv-builder-preview-col">
        <div class="inv-phone-frame">
          <div class="inv-phone-notch"></div>
          <div class="inv-phone-screen" id="invPreviewStage"></div>
        </div>
        <button class="inv-builder-preview-toggle" type="button" onclick="document.getElementById('inviteRoot').classList.toggle('inv-builder-preview-open')">📱 Preview харах/нуух</button>
      </div>
    </div>`;
  invRenderBuilderStep();
  invRenderBuilderPreview();
}

function invRenderBuilderStep() {
  const editor = document.getElementById("invBuilderEditor");
  if (!editor || !invBuilder) return;
  const t = INVITE_TYPES[invBuilder.type];
  let html;
  if (invBuilder.step === 1) html = invBuilderStep1Html(t);
  else if (invBuilder.step === 2) html = invBuilderStep2Html(t);
  else if (invBuilder.step === 3) html = invBuilderStep3Html(t);
  else if (invBuilder.step === 4) html = invBuilderStep4Html(t);
  else html = invBuilderStep5Html(t);
  editor.innerHTML = html;
  if (invBuilder.step === 1) {
    Object.entries(invBuilder.fields).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.value = val; });
  }
}

// ---------- Алхам 1: Төрөл + мэдээлэл ----------
function invBuilderStep1Html(t) {
  const fields = invBuilderFieldDefs();
  return `
    <p class="inv-builder-step-desc">${t.desc || "Урилгынхаа үндсэн мэдээллийг бөглөнө үү."}</p>
    <div class="inv-form">
      ${fields.map(f => f.type === "textarea"
        ? `<div class="form-group"><label>${escapeHtml(f.label)}</label><textarea id="${f.id}" rows="${f.rows || 3}" placeholder="${escapeHtml(f.placeholder || "")}" oninput="invBuilderSchedulePreview()"></textarea></div>`
        : `<div class="form-group"><label>${escapeHtml(f.label)}</label><input type="${f.type}" id="${f.id}" placeholder="${escapeHtml(f.placeholder || "")}" oninput="invBuilderSchedulePreview()"></div>`
      ).join("")}
    </div>
    <div class="inv-builder-nav">
      <span></span>
      <button class="btn btn-primary" type="button" onclick="invBuilderNext()">Дараах →</button>
    </div>`;
}

// ---------- Алхам 2: Зураг + дурсамж (бүрэн UI Phase 4-д нэмэгдэнэ) ----------
function invBuilderStep2Html() {
  return `
    <p class="inv-builder-step-desc">Хүссэн тооны зураг оруулаад, зураг бүрт дурсамж/тайлбар бичиж болно. Хүлээн авагч эдгээрийг "Дурсамжийн альбом" болгон нэг бол нэгээр үзнэ.</p>
    <div id="invBuilderPhotoSection"></div>
    <div class="inv-builder-nav">
      <button class="btn btn-ghost" type="button" onclick="invBuilderPrev()">← Буцах</button>
      <button class="btn btn-primary" type="button" onclick="invBuilderNext()">Дараах →</button>
    </div>`;
}

// ---------- Алхам 3: Дуу + theme (дуу Phase 5-д нэмэгдэнэ) ----------
function invBuilderStep3Html() {
  return `
    <p class="inv-builder-step-desc">Урилгынхаа өнгө/theme сонго.</p>
    <div id="invBuilderThemeSection"></div>
    <div id="invBuilderMusicSection"></div>
    <div class="inv-builder-nav">
      <button class="btn btn-ghost" type="button" onclick="invBuilderPrev()">← Буцах</button>
      <button class="btn btn-primary" type="button" onclick="invBuilderNext()">Дараах →</button>
    </div>`;
}

// ---------- Алхам 4: Бүтэц/pages (enable/disable + reorder Phase 6-д нэмэгдэнэ) ----------
function invBuilderStep4Html() {
  return `
    <p class="inv-builder-step-desc">Урилгынхаа доторх нэмэлт хуудсуудыг удирдана.</p>
    <div id="invBuilderPagesSection"></div>
    <div class="inv-builder-nav">
      <button class="btn btn-ghost" type="button" onclick="invBuilderPrev()">← Буцах</button>
      <button class="btn btn-primary" type="button" onclick="invBuilderNext()">Дараах →</button>
    </div>`;
}

// ---------- Алхам 5: Preview + Link/QR ----------
function invBuilderStep5Html(t) {
  return `
    <p class="inv-builder-step-desc">Баруун талд (эсвэл дээрх "Preview харах" товчоор) хүлээн авагчийн яг харах байдлыг үзээрэй. Бүх зүйл зөв бол доор дарж урилгаа илгээ.</p>
    <div class="inv-builder-nav">
      <button class="btn btn-ghost" type="button" onclick="invBuilderPrev()">← Буцах</button>
      <button class="btn btn-primary" id="invBuilderSubmitBtn" type="button" onclick="invSubmitBuilder()">📱 Урилга үүсгэж QR авах</button>
    </div>`;
}

// ---------- Realtime phone preview (жинхэнэ хүлээн авагчийн renderer, screenshot биш) ----------
function invRenderBuilderPreview() {
  if (!invBuilder) return;
  const stage = document.getElementById("invPreviewStage");
  if (!stage) return;
  currentInviteId = null; // preview үргэлж "хариулаагүй" төлөвтэй - submitInviteResponse() safely no-op хийнэ
  currentInviteResponded = false;
  try {
    renderInviteView(invBuilder.type, invBuilder.fields, "invPreviewStage");
  } catch (e) {
    stage.innerHTML = `<p style="padding:40px 16px;text-align:center;color:var(--text-light);font-size:13px;">Preview ачаалахад алдаа гарлаа.</p>`;
    console.warn("invRenderBuilderPreview error:", e);
  }
}

// ---------- Илгээх ----------
async function invSubmitBuilder() {
  if (!invBuilder) return;
  invBuilderCollectFields();
  const type = invBuilder.type;
  const t = INVITE_TYPES[type];

  if (typeof currentUser === "undefined" || !currentUser) {
    showToast("⚠️ Урилга илгээхийн тулд эхлээд нэвтэрнэ үү");
    if (typeof openAuth === "function") openAuth("login");
    return;
  }
  if (typeof db === "undefined" || !db) { showToast("⚠️ Firebase холбогдоогүй байна"); return; }

  const btn = document.getElementById("invBuilderSubmitBtn");
  if (btn) { btn.disabled = true; btn.textContent = "⏳ Илгээж байна..."; }
  showToast("⏳ Урилгаа үүсгэж байна...");
  try {
    const ref = await db.collection("invites").add({
      type,
      data: invBuilder.fields,
      photos: invBuilder.photos.length ? invBuilder.photos : [],
      music: invBuilder.music || null,
      theme: invBuilder.theme || "classic",
      enabledPages: invBuilder.enabledPages && invBuilder.enabledPages.length ? invBuilder.enabledPages : [],
      pageOrder: invBuilder.pageOrder && invBuilder.pageOrder.length ? invBuilder.pageOrder : [],
      senderUid: currentUser.uid,
      senderName: currentUser.name || "",
      status: "sent",
      response: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    const url = `${location.origin}${location.pathname}?id=${ref.id}`;
    invBuilder = null;
    showInviteQr(url);
  } catch (e) {
    showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || ""));
    if (btn) { btn.disabled = false; btn.textContent = "📱 Урилга үүсгэж QR авах"; }
  }
}
