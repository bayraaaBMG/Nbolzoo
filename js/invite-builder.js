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

const INV_BUILDER_STEP_LABELS = ["Мэдээлэл", "Зураг", "Дуу ба загвар", "Бүтэц", "Урьдчилан харах"];

let invBuilder = null;
let invBuilderPreviewTimer = null;

function invStartBuilder(type) {
  if (!INVITE_TYPES[type]) return;
  invBuilder = { step: 1, type, fields: {}, photos: [], music: null, theme: "classic", enabledPages: [], pageOrder: null, persuade: false };
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
    <div class="inv-builder-wrap">
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
          <button class="inv-builder-preview-toggle" type="button" onclick="document.getElementById('inviteRoot').classList.toggle('inv-builder-preview-open')">📱 Урьдчилан харах</button>
          <div class="inv-phone-frame">
            <div class="inv-phone-notch"></div>
            <div class="inv-phone-screen" id="invPreviewStage"></div>
          </div>
        </div>
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
  } else if (invBuilder.step === 2) {
    invBuilderRenderPhotoSection();
  } else if (invBuilder.step === 3) {
    invBuilderRenderThemeMusicSection();
  } else if (invBuilder.step === 4) {
    invBuilderRenderPagesSection();
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

// ---------- Алхам 2: Зураг + дурсамж ----------
function invBuilderStep2Html() {
  return `
    <p class="inv-builder-step-desc">Хүссэн тооны зураг оруулаад, зураг бүрт дурсамж/тайлбар бичиж болно. Хүлээн авагч эдгээрийг "Дурсамжийн альбом" болгон нэг бол нэгээр үзнэ. Зураг илгээх үед л Storage руу байршина — энэ алхмаас гарахад юу ч алдагдахгүй.</p>
    <div id="invBuilderPhotoSection"></div>
    <div class="inv-builder-nav">
      <button class="btn btn-ghost" type="button" onclick="invBuilderPrev()">← Буцах</button>
      <button class="btn btn-primary" type="button" onclick="invBuilderNext()">Дараах →</button>
    </div>`;
}

function invBuilderRenderPhotoSection() {
  const el = document.getElementById("invBuilderPhotoSection");
  if (!el || !invBuilder) return;
  el.innerHTML = `
    <input type="file" id="invPhotoFileInput" accept="image/*" multiple style="display:none" onchange="invBuilderHandlePhotoFiles(this.files)">
    <button class="btn btn-ghost" type="button" onclick="document.getElementById('invPhotoFileInput').click()">🖼 Зураг нэмэх</button>
    <div class="inv-photo-grid" id="invPhotoGrid"></div>`;
  invBuilderRenderPhotoGrid();
}

function invBuilderRenderPhotoGrid() {
  const grid = document.getElementById("invPhotoGrid");
  if (!grid || !invBuilder) return;
  if (!invBuilder.photos.length) {
    grid.innerHTML = `<p style="color:var(--text-light);font-size:13px;margin-top:12px;">Одоогоор зураг ороогүй байна.</p>`;
    return;
  }
  grid.innerHTML = invBuilder.photos.map((p, i) => `
    <div class="inv-photo-item">
      <div class="inv-photo-thumb-wrap">
        <img src="${p.previewUrl || p.thumbUrl || p.url}" alt="">
        <button type="button" class="inv-photo-remove" onclick="invBuilderRemovePhoto(${i})" title="Устгах">✕</button>
        ${p.status === "uploading" ? `<div class="inv-photo-status inv-photo-uploading">⏳</div>` : ""}
        ${p.status === "error" ? `<div class="inv-photo-status inv-photo-error-badge">⚠️</div>` : ""}
      </div>
      <input type="text" placeholder="Жижиг гарчиг (заавал биш)" value="${escapeHtml(p.title || "")}" oninput="invBuilderUpdatePhoto(${i},'title',this.value)">
      <textarea rows="2" placeholder="Дурсамж/тайлбар (заавал биш)" oninput="invBuilderUpdatePhoto(${i},'caption',this.value)">${escapeHtml(p.caption || "")}</textarea>
      <input type="date" value="${escapeHtml(p.date || "")}" onchange="invBuilderUpdatePhoto(${i},'date',this.value)">
      ${p.status === "error" ? `<div class="inv-photo-error">⚠️ ${escapeHtml(p.error || "Байршуулахад алдаа гарлаа")}</div>` : ""}
    </div>`).join("");
}

function invBuilderHandlePhotoFiles(fileList) {
  const files = Array.from(fileList || []);
  files.forEach(file => {
    if (!file.type || !file.type.startsWith("image/")) { showToast("⚠️ Зөвхөн зураг файл сонгоно уу"); return; }
    if (file.size > 15 * 1024 * 1024) { showToast(`⚠️ "${file.name}" хэт том байна (15MB-с бага байх ёстой)`); return; }
    const previewUrl = (typeof URL !== "undefined" && URL.createObjectURL) ? URL.createObjectURL(file) : "";
    invBuilder.photos.push({ file, previewUrl, caption: "", title: "", date: "", status: "ready" });
  });
  invBuilderRenderPhotoGrid();
  invBuilderSchedulePreview();
  const input = document.getElementById("invPhotoFileInput");
  if (input) input.value = "";
}

function invBuilderUpdatePhoto(i, field, val) {
  if (!invBuilder || !invBuilder.photos[i]) return;
  invBuilder.photos[i][field] = val;
  invBuilderSchedulePreview();
}

function invBuilderRemovePhoto(i) {
  if (!invBuilder || !invBuilder.photos[i]) return;
  const p = invBuilder.photos[i];
  if (p.previewUrl && typeof URL !== "undefined" && URL.revokeObjectURL) URL.revokeObjectURL(p.previewUrl);
  invBuilder.photos.splice(i, 1);
  invBuilderRenderPhotoGrid();
  invBuilderSchedulePreview();
}

// ---------- Алхам 3: Дуу + theme ----------
function invBuilderStep3Html() {
  return `
    <p class="inv-builder-step-desc">Урилгынхаа өнгө/theme сонгоод, хүсвэл дэвсгэр хөгжим нэм.</p>
    <div id="invBuilderThemeSection"></div>
    <div id="invBuilderMusicSection"></div>
    <div class="inv-builder-nav">
      <button class="btn btn-ghost" type="button" onclick="invBuilderPrev()">← Буцах</button>
      <button class="btn btn-primary" type="button" onclick="invBuilderNext()">Дараах →</button>
    </div>`;
}

function invBuilderRenderThemeMusicSection() {
  const themeEl = document.getElementById("invBuilderThemeSection");
  const musicEl = document.getElementById("invBuilderMusicSection");
  if (themeEl && typeof invRenderThemePicker === "function") themeEl.innerHTML = invRenderThemePicker(invBuilder.theme);
  if (musicEl && typeof invRenderMusicPicker === "function") musicEl.innerHTML = invRenderMusicPicker(invBuilder.type, invBuilder.music && invBuilder.music.id);
}

function invBuilderSetTheme(themeId) {
  if (!invBuilder) return;
  invBuilder.theme = themeId;
  invBuilderRenderThemeMusicSection();
  invBuilderSchedulePreview();
}

function invBuilderSetMusic(trackId) {
  if (!invBuilder) return;
  if (!trackId) { invBuilder.music = null; invBuilderSchedulePreview(); return; }
  const category = invMusicCategoryForType(invBuilder.type);
  const track = (INV_MUSIC_LIBRARY[category] || []).find(t => t.id === trackId);
  invBuilder.music = track ? { id: track.id, url: track.url, title: track.title, credit: track.credit || "" } : null;
  invBuilderSchedulePreview();
}

// ---------- Алхам 4: Бүтэц/pages (optional хуудсыг unчкэх/асаах + чирж эрэмбэлэх) ----------
// Диск card бүрийг устгаж эвдэх эрсдэлгүйгээр: зөвхөн доорх мэдэгдэж буй "бонус" төрлийн
// key/group-үүд л checklist-д гарна (intro/RSVP/celebrate г.м fixed картууд огт харагдахгүй,
// тул sender санамсаргүй тэдгээрийг унтраах боломжгүй).
// Түлхүүрүүд бодит DOM id-тай (data-step="inv-s-X") яг тохирсон байх ёстой — key нь богино
// нэр биш, invIndexPages()-ийн c.dataset.step-ээс ирдэг ЯГ ТЭР утга (js/invite-engine.js).
const INV_TOGGLEABLE_PAGES = {
  "inv-s-memgame": "🃏 Хосыг олох тоглоом", "inv-s-memory": "🃏 Хосыг олох тоглоом",
  "inv-s-clicker": "💗 5 секундийн тоглоом",
  "inv-s-poll1": "💭 Хөгжилтэй асуулт", "inv-s-poll": "💭 Хөгжилтэй асуулт",
  "inv-s-wheel": "🎡 Азын дугуй",
  album: "🖼 Дурсамжийн альбом",
  encourage: "✨ Урам зоригийн үгс",
};
const INV_PERSUADE_ELIGIBLE_FAMILIES = new Set(["birthday", "wedding", "family", "holiday", "party"]);

function invBuilderStep4Html(t) {
  return `
    <p class="inv-builder-step-desc">Урилгынхаа доторх нэмэлт хуудсуудыг унтраах/асаах, чирж эрэмбэлэх боломжтой. Үндсэн алхмууд (эхлэл, RSVP г.м) үргэлж хэвээрээ үлдэнэ.</p>
    <div id="invBuilderPagesSection"></div>
    <div class="inv-builder-nav">
      <button class="btn btn-ghost" type="button" onclick="invBuilderPrev()">← Буцах</button>
      <button class="btn btn-primary" type="button" onclick="invBuilderNext()">Дараах →</button>
    </div>`;
}

function invBuilderRenderPagesSection() {
  const el = document.getElementById("invBuilderPagesSection");
  if (!el || !invBuilder) return;
  invRenderBuilderPreview(); // invPages-ийг (invite-engine.js) энэ төрлийн хамгийн сүүлийн render-т тааруулна

  const pages = typeof invPages !== "undefined" ? invPages : [];
  const seen = new Set();
  const items = [];
  pages.forEach(p => {
    const dedupeKey = p.group || p.key;
    if (!INV_TOGGLEABLE_PAGES[dedupeKey] || seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    items.push({ key: dedupeKey, label: INV_TOGGLEABLE_PAGES[dedupeKey] });
  });
  const disabled = new Set(invBuilder.enabledPages || []);

  const t = INVITE_TYPES[invBuilder.type];
  const persuadeEligible = t && INV_PERSUADE_ELIGIBLE_FAMILIES.has(t.family);

  el.innerHTML = `
    ${items.length ? `
    <div class="inv-page-manage-list" id="invPageManageList">
      ${items.map(it => `
        <div class="inv-page-manage-item" draggable="true" data-key="${it.key}"
             ondragstart="invPageDragStart(event)" ondragover="invPageDragOver(event)" ondrop="invPageDrop(event)" ondragend="invPageDragEnd(event)">
          <span class="inv-page-drag-handle" title="Чирж эрэмбэлэх">⠿</span>
          <label><input type="checkbox" ${disabled.has(it.key) ? "" : "checked"} onchange="invBuilderTogglePage('${it.key}', this.checked)"> ${escapeHtml(it.label)}</label>
        </div>`).join("")}
    </div>` : `<p style="color:var(--text-light);font-size:13px;">Энэ төрөлд унтраах боломжтой нэмэлт хуудас алга.</p>`}
    ${persuadeEligible ? `
    <label class="inv-page-manage-item" style="margin-top:14px;">
      <input type="checkbox" ${invBuilder.persuade ? "checked" : ""} onchange="invBuilderSetPersuade(this.checked)">
      🐱 "Бодоод үзье..." муурын дэлгэц (хүлээн авагч "Үгүй" гэхээс өмнө хөөрхөн ятгах мессеж)
    </label>` : ""}`;
}

function invBuilderTogglePage(key, isEnabled) {
  if (!invBuilder) return;
  const set = new Set(invBuilder.enabledPages || []);
  if (isEnabled) set.delete(key); else set.add(key);
  invBuilder.enabledPages = [...set];
  invBuilderSchedulePreview();
}

function invBuilderSetPersuade(isOn) {
  if (!invBuilder) return;
  invBuilder.persuade = !!isOn;
  invBuilderSchedulePreview();
}

let invPageDragKey = null;
function invPageDragStart(e) { invPageDragKey = e.currentTarget.dataset.key; }
function invPageDragOver(e) { e.preventDefault(); }
function invPageDrop(e) {
  e.preventDefault();
  const targetKey = e.currentTarget.dataset.key;
  if (!invPageDragKey || invPageDragKey === targetKey) return;
  const list = Array.from(document.querySelectorAll("#invPageManageList .inv-page-manage-item")).map(item => item.dataset.key);
  const from = list.indexOf(invPageDragKey);
  const to = list.indexOf(targetKey);
  if (from === -1 || to === -1) return;
  list.splice(to, 0, list.splice(from, 1)[0]);
  invBuilder.pageOrder = list;
  invBuilderRenderPagesSection();
  invBuilderSchedulePreview();
}
function invPageDragEnd() { invPageDragKey = null; }

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
// Preview дэх зурагнууд Storage руу хараахан upload хийгдээгүй ч (тэр зөвхөн Send дарахад
// хийгдэнэ) local blob URL (previewUrl)-ээр шууд харагдана — sender өөрчлөлт бүрийг шууд үзнэ.
function invBuilderDraftInvite() {
  return {
    type: invBuilder.type,
    data: invBuilder.fields,
    photos: invBuilder.photos.map(p => ({
      url: p.url || p.previewUrl, thumbUrl: p.thumbUrl || p.previewUrl,
      caption: p.caption || "", title: p.title || "", date: p.date || "",
    })),
    music: invBuilder.music || null,
    theme: invBuilder.theme || "classic",
    enabledPages: invBuilder.enabledPages || [],
    pageOrder: invBuilder.pageOrder || [],
    persuade: !!invBuilder.persuade,
  };
}

function invRenderBuilderPreview() {
  if (!invBuilder) return;
  const stage = document.getElementById("invPreviewStage");
  if (!stage) return;
  currentInviteId = null; // preview үргэлж "хариулаагүй" төлөвтэй - submitInviteResponse() safely no-op хийнэ
  currentInviteResponded = false;
  try {
    renderInviteView(invBuilder.type, invBuilder.fields, invBuilderDraftInvite(), "invPreviewStage");
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
  if (btn) { btn.disabled = true; }

  // Зургууд Storage руу яг ЭНД, илгээх мөчид л upload хийгдэнэ (builder-аас гарвал орфан
  // файл үлдэхгүй). Бодит upload/compress storage-utils.js-ийн uploadImageWithThumbnail()-
  // ээр дамжина; алдаа гарвал тухайн зургийг "error" төлөвт тэмдэглэж, sender-ийг 2-р алхам
  // руу буцааж бодитоор харуулна (чимээгүй алгасахгүй, зохиомол амжилт мэдэгдэхгүй).
  if (invBuilder.photos.length) {
    if (btn) btn.textContent = "📤 Зураг байршуулж байна...";
    for (let i = 0; i < invBuilder.photos.length; i++) {
      const p = invBuilder.photos[i];
      if (p.url) continue; // өмнөх оролдлогод амжилттай байршсан
      p.status = "uploading"; p.error = null;
      if (invBuilder.step === 2) invBuilderRenderPhotoGrid();
      try {
        const { url, thumbUrl } = await uploadImageWithThumbnail(`invites/${currentUser.uid}/${Date.now()}_${i}`, p.file);
        p.url = url; p.thumbUrl = thumbUrl; p.status = "done";
      } catch (e) {
        p.status = "error"; p.error = e.message || "Байршуулахад алдаа гарлаа";
      }
    }
    const failed = invBuilder.photos.filter(p => p.status === "error");
    if (failed.length) {
      showToast(`⚠️ ${failed.length} зураг байршуулж чадсангүй — дахин оролдоно уу эсвэл устгана уу`);
      if (btn) { btn.disabled = false; btn.textContent = "📱 Урилга үүсгэж QR авах"; }
      invBuilderGoStep(2);
      return;
    }
  }

  if (btn) btn.textContent = "⏳ Илгээж байна...";
  showToast("⏳ Урилгаа үүсгэж байна...");
  try {
    const ref = await db.collection("invites").add({
      type,
      data: invBuilder.fields,
      photos: invBuilder.photos.map(p => ({ url: p.url, thumbUrl: p.thumbUrl, caption: p.caption || "", title: p.title || "", date: p.date || "" })),
      music: invBuilder.music || null,
      theme: invBuilder.theme || "classic",
      enabledPages: invBuilder.enabledPages && invBuilder.enabledPages.length ? invBuilder.enabledPages : [],
      pageOrder: invBuilder.pageOrder && invBuilder.pageOrder.length ? invBuilder.pageOrder : [],
      persuade: !!invBuilder.persuade,
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
