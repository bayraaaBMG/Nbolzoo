// ===== ADMIN: КОНТЕНТ УДИРДЛАГА (overlay CMS-ийн UI) =====
// js/cms.js-ийн тайлбарыг үзнэ үү: эх контент нь js/*.js файлд хэвээр байна, энэ хэсэг нь
// зөвхөн ДАВХАРЛАСАН өөрчлөлт (нуух / дараалал / засвар / нэмэх)-ийг Firestore-д бичнэ.
// Тиймээс "Буцаах" товч дарахад эх контент ЯГ хэвээрээ эргэж ирнэ — юу ч алдагдахгүй.

// Талбарын тодорхойлолт: [түлхүүр, шошго, төрөл]
// Төрөл: text | textarea | image | select | tags | number
//
// Дараах талбарууд БҮХ төрөлд нийтлэг: зураг, шошго, SEO. Эх өгөгдөлд байхгүй байсан ч
// CMS-ээр нэмбэл render хийх үед давхарлагдана (cmsApply нь зүгээр л талбар нэгтгэдэг).
const CMS_COMMON_FIELDS = [
  ["img", "Зураг", "image"],
  ["tags", "Шошго (таслалаар)", "tags"],
  ["seoTitle", "SEO гарчиг", "text"],
  ["seoDesc", "SEO тайлбар", "textarea"],
];

// Тухайн төрөл бүрийн эх жагсаалтыг хаанаас авахыг тодорхойлно. Хуудсанд тухайн dataset
// ачаалагдаагүй бол null буцаана — тэр үед "ачаалагдаагүй" гэж ИЛ хэлнэ, хоосон жагсаалт
// харуулж "контент алга" гэж төөрөгдүүлэхгүй.
const CMS_SOURCES = {
  ub: {
    idKey: "id",
    label: () => CMS_TYPE_LABELS.ub,
    list: () => (typeof allUbIdeas !== "undefined" ? allUbIdeas : null),
    title: x => x.title,
    img: x => x.img || "",
    meta: x => `${x.day}-р өдөр · ${x.category || "-"} · ${x.priceText || ""}`,
    // Ангиллын сонголтыг өгөгдлөөс гаргана — гараар бичсэн жагсаалт хоцрохоос сэргийлнэ.
    categories: () => (typeof allUbIdeas !== "undefined" ? [...new Set(allUbIdeas.map(i => i.category).filter(Boolean))].sort() : []),
    fields: [
      ["title", "Гарчиг", "text"], ["desc", "Тайлбар", "textarea"],
      ["category", "Ангилал", "select"], ["location", "Байршил", "text"],
      ["price", "Үнэ (₮)", "number"], ["feeling", "Мэдрэмж", "textarea"],
    ],
  },
  aimags: {
    idKey: "id",
    label: () => CMS_TYPE_LABELS.aimags,
    list: () => (typeof aimagsClean !== "undefined" ? aimagsClean : null),
    title: x => x.name,
    img: x => x.img || "",
    meta: x => `${(x.wonders || []).length} онцлох газар · ${(x.dates || []).length} санаа`,
    categories: () => (typeof aimagsClean !== "undefined" ? [...new Set(aimagsClean.map(a => a.region).filter(Boolean))].sort() : []),
    fields: [
      ["name", "Нэр", "text"], ["desc", "Тайлбар", "textarea"],
      ["region", "Бүс (ангилал)", "select"], ["history", "Түүх", "textarea"],
    ],
  },
  gifts: {
    idKey: "id",
    label: () => CMS_TYPE_LABELS.gifts,
    list: () => (typeof gifts !== "undefined" ? gifts : null),
    title: x => x.title,
    img: x => x.img || "",
    meta: x => `${x.cat || "-"}${x.price ? " · " + x.price : ""}`,
    categories: () => (typeof giftCategories !== "undefined" ? giftCategories.map(c => c.id) : []),
    fields: [
      ["title", "Нэр", "text"], ["desc", "Тайлбар", "textarea"],
      ["cat", "Ангилал", "select"], ["price", "Үнийн санал", "text"],
      ["why", "Яагаад", "textarea"], ["emoji", "Эможи", "text"],
    ],
  },
};

function cmsFields(type) { return CMS_SOURCES[type].fields.concat(CMS_COMMON_FIELDS); }

let cmsActiveType = "ub";
let cmsOverride = null;
let cmsQuery = "";
let cmsStatusFilter = "all";   // all | published | hidden | edited | added
let cmsPage = 0;
const CMS_PAGE_SIZE = 25;

async function renderAdminCms() {
  const el = document.getElementById("admin-cms");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  cmsOverride = await cmsLoadOverride(cmsActiveType);
  renderAdminCmsBody();
}

function cmsSwitchType(type) { cmsActiveType = type; cmsQuery = ""; cmsPage = 0; cmsStatusFilter = "all"; renderAdminCms(); }
function cmsSearch(q) { cmsQuery = (q || "").trim().toLowerCase(); cmsPage = 0; renderAdminCmsBody(); }
function cmsSetStatus(v) { cmsStatusFilter = v; cmsPage = 0; renderAdminCmsBody(); }
function cmsGoPage(p) { cmsPage = p; renderAdminCmsBody(); window.scrollTo({ top: 0, behavior: "smooth" }); }

function renderAdminCmsBody() {
  const el = document.getElementById("admin-cms");
  const src = CMS_SOURCES[cmsActiveType];
  const tabs = Object.keys(CMS_SOURCES).map(t =>
    `<button type="button" class="cms-type${t === cmsActiveType ? " active" : ""}" onclick="cmsSwitchType('${t}')">${escapeHtml(CMS_SOURCES[t].label())}</button>`
  ).join("");

  const base = src.list();
  if (base === null) {
    el.innerHTML = `<div class="cms-types">${tabs}</div>
      <div class="admin-empty">Энэ төрлийн өгөгдөл энэ хуудсанд ачаалагдаагүй байна — тиймээс жагсаалтыг харуулж чадахгүй.</div>`;
    return;
  }

  const ov = cmsOverride || { hidden: [], order: [], edits: {}, added: [] };
  const hiddenSet = new Set((ov.hidden || []).map(String));
  const editedSet = new Set(Object.keys(ov.edits || {}));
  const addedSet = new Set((ov.added || []).map(x => String(x[src.idKey])));

  // Admin-д БҮХ зүйл харагдана — нуусан нь ч гэсэн (эс бөгөөс буцааж чадахгүй болно).
  const merged = cmsApply(base, { edits: ov.edits, added: ov.added, order: ov.order }, src.idKey);
  let filtered = merged;
  if (cmsQuery) {
    filtered = filtered.filter(x => (src.title(x) || "").toLowerCase().includes(cmsQuery)
      || String(x[src.idKey]).includes(cmsQuery)
      || (x.tags || "").toLowerCase().includes(cmsQuery));
  }
  if (cmsStatusFilter !== "all") {
    filtered = filtered.filter(x => {
      const id = String(x[src.idKey]);
      if (cmsStatusFilter === "hidden") return hiddenSet.has(id);
      if (cmsStatusFilter === "published") return !hiddenSet.has(id);
      if (cmsStatusFilter === "edited") return editedSet.has(id);
      if (cmsStatusFilter === "added") return addedSet.has(id);
      return true;
    });
  }

  const totalPages = Math.ceil(filtered.length / CMS_PAGE_SIZE) || 1;
  const page = Math.min(cmsPage, totalPages - 1);
  const slice = filtered.slice(page * CMS_PAGE_SIZE, (page + 1) * CMS_PAGE_SIZE);

  const rows = slice.map((x, i) => {
    const id = String(x[src.idKey]);
    const isHidden = hiddenSet.has(id);
    const absIdx = page * CMS_PAGE_SIZE + i;
    const flags = [];
    flags.push(isHidden
      ? `<span class="cms-flag cms-flag-hidden">Нуусан</span>`
      : `<span class="cms-flag cms-flag-published">Нийтэлсэн</span>`);
    if (editedSet.has(id)) flags.push(`<span class="cms-flag cms-flag-edited">Засварласан</span>`);
    if (addedSet.has(id)) flags.push(`<span class="cms-flag cms-flag-added">Нэмсэн</span>`);
    const thumb = src.img(x);
    return `<div class="admin-card${isHidden ? " admin-card-dim" : ""}">
      ${thumb ? `<img src="${escapeHtml(thumb)}" alt="" class="admin-card-thumb" onerror="this.remove()">` : ""}
      <div class="admin-card-main">
        <strong>${escapeHtml(src.title(x) || "(нэргүй)")}</strong> ${flags.join(" ")}
        <div class="admin-card-meta">#${escapeHtml(id)} · ${escapeHtml(src.meta(x) || "")}</div>
        ${x.tags ? `<div class="admin-card-meta">🏷 ${escapeHtml(x.tags)}</div>` : ""}
      </div>
      <div class="admin-card-actions">
        ${nbCan("content.reorder") ? `
          <button class="btn btn-outline btn-sm btn-icon" type="button" title="Дээш" ${absIdx === 0 ? "disabled" : ""} onclick="cmsMove('${escapeHtml(id)}',-1)">↑</button>
          <button class="btn btn-outline btn-sm btn-icon" type="button" title="Доош" ${absIdx >= filtered.length - 1 ? "disabled" : ""} onclick="cmsMove('${escapeHtml(id)}',1)">↓</button>` : ""}
        ${nbCan("content.edit") ? `<button class="btn btn-outline btn-sm" type="button" onclick="cmsOpenEdit('${escapeHtml(id)}')">✎ Засах</button>` : ""}
        ${nbCan("content.hide") ? `<button class="btn btn-outline btn-sm" type="button" onclick="cmsToggleHidden('${escapeHtml(id)}', ${!isHidden})">${isHidden ? "👁 Нийтлэх" : "🚫 Нуух"}</button>` : ""}
        ${nbCan("content.delete") && addedSet.has(id) ? `<button class="btn btn-outline btn-sm" style="border-color:#ef4444;color:#ef4444" type="button" onclick="cmsDeleteAdded('${escapeHtml(id)}')">🗑</button>` : ""}
      </div>
    </div>`;
  }).join("");

  const changeCount = hiddenSet.size + editedSet.size + addedSet.size + (ov.order || []).length;

  el.innerHTML = `
    <div class="cms-types">${tabs}</div>
    <div class="admin-note">
      Эх контент нь сайтын кодод хэвээр байна. Энд хийсэн өөрчлөлт нь түүн дээр <strong>давхарлаж</strong> үйлчилнэ —
      тиймээс "Бүх өөрчлөлтийг буцаах" дарахад анхны контент яг хэвээрээ эргэж ирнэ.
      ${changeCount ? `<br>Одоо <strong>${changeCount}</strong> өөрчлөлт идэвхтэй.` : ""}
    </div>
    <div class="cms-toolbar">
      <input class="admin-search" type="search" placeholder="Гарчиг, ID, шошгоор хайх..." value="${escapeHtml(cmsQuery)}" oninput="cmsSearch(this.value)" aria-label="Контент хайх">
      <select class="admin-search" style="max-width:190px" onchange="cmsSetStatus(this.value)" aria-label="Төлвөөр шүүх">
        ${[["all", "Бүх төлөв"], ["published", "Нийтэлсэн"], ["hidden", "Нуусан"], ["edited", "Засварласан"], ["added", "Нэмсэн"]]
          .map(([v, l]) => `<option value="${v}"${v === cmsStatusFilter ? " selected" : ""}>${l}</option>`).join("")}
      </select>
      ${nbCan("content.create") ? `<button class="btn btn-primary btn-sm" type="button" onclick="cmsOpenCreate()">+ Шинээр нэмэх</button>` : ""}
      ${nbCan("content.delete") && changeCount ? `<button class="btn btn-outline btn-sm" type="button" onclick="cmsResetAll()">↺ Бүгдийг буцаах</button>` : ""}
    </div>
    <div class="admin-list-count">${filtered.length} / ${merged.length} зүйл</div>
    <div id="cmsEditSlot"></div>
    ${rows || `<div class="admin-empty">Тохирох зүйл олдсонгүй</div>`}
    ${totalPages > 1 ? `<div class="cms-pager">
      <button class="btn btn-outline btn-sm" type="button" ${page === 0 ? "disabled" : ""} onclick="cmsGoPage(${page - 1})">← Өмнөх</button>
      <span>${page + 1} / ${totalPages}</span>
      <button class="btn btn-outline btn-sm" type="button" ${page >= totalPages - 1 ? "disabled" : ""} onclick="cmsGoPage(${page + 1})">Дараах →</button>
    </div>` : ""}`;
}

// ---------- Нуух / нийтлэх ----------
async function cmsToggleHidden(id, hide) {
  if (!nbCan("content.hide")) return showToast("⚠️ Танд энэ эрх алга");
  try {
    const op = hide
      ? firebase.firestore.FieldValue.arrayUnion(id)
      : firebase.firestore.FieldValue.arrayRemove(id);
    await cmsSaveOverride(cmsActiveType, { hidden: op });
    logAdminAction(hide ? "cms_hide" : "cms_show", id, cmsActiveType, hide ? "нийтэлсэн" : "нуусан", hide ? "нуусан" : "нийтэлсэн");
    showToast(hide ? "🚫 Нуугдлаа" : "👁 Дахин нийтлэгдлээ");
    renderAdminCms();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

// ---------- Эрэмбэ ----------
// Одоогийн харагдаж буй дарааллыг бүтнээр нь бичээд, тухайн зүйлийг нэг байр зөөнө.
// Зөвхөн "дээр гаргах" биш бүрэн дараалал хадгалдаг тул давтан зөөлт найдвартай.
async function cmsMove(id, dir) {
  if (!nbCan("content.reorder")) return showToast("⚠️ Танд энэ эрх алга");
  const src = CMS_SOURCES[cmsActiveType];
  const ov = cmsOverride || {};
  const merged = cmsApply(src.list() || [], { edits: ov.edits, added: ov.added, order: ov.order }, src.idKey);
  const ids = merged.map(x => String(x[src.idKey]));
  const i = ids.indexOf(String(id));
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return;
  ids.splice(j, 0, ids.splice(i, 1)[0]);
  try {
    await cmsSaveOverride(cmsActiveType, { order: ids });
    logAdminAction("cms_reorder", id, cmsActiveType, "байр " + (i + 1), "байр " + (j + 1));
    renderAdminCms();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

// ---------- Засах ----------
function cmsFieldInput(key, label, type, value, src) {
  const v = value === undefined || value === null ? "" : String(value);
  const id = "cmsF_" + key;
  if (type === "textarea") return `<textarea id="${id}" rows="3">${escapeHtml(v)}</textarea>`;
  if (type === "number") return `<input type="number" id="${id}" value="${escapeHtml(v)}">`;
  if (type === "select") {
    const opts = (src.categories ? src.categories() : []);
    return `<select id="${id}">
      <option value="">— сонгоогүй —</option>
      ${opts.map(o => `<option value="${escapeHtml(o)}"${o === v ? " selected" : ""}>${escapeHtml(o)}</option>`).join("")}
      ${v && !opts.includes(v) ? `<option value="${escapeHtml(v)}" selected>${escapeHtml(v)} (одоогийн)</option>` : ""}
    </select>`;
  }
  if (type === "image") {
    return `<div class="cms-img-field">
      <input type="text" id="${id}" value="${escapeHtml(v)}" placeholder="Зургийн URL, эсвэл доороос файл сонгоно уу">
      <input type="file" accept="image/*" onchange="cmsUploadImage(this, '${id}')">
      <div class="cms-img-status" id="${id}_status"></div>
      ${v ? `<img src="${escapeHtml(v)}" alt="" class="cms-img-preview" onerror="this.remove()">` : ""}
    </div>`;
  }
  return `<input type="text" id="${id}" value="${escapeHtml(v)}">`;
}

// Зургийг шахаад Storage-ийн cms/ хавтас руу байршуулна (rules: зөвхөн admin+).
async function cmsUploadImage(input, targetId) {
  const file = input.files[0];
  if (!file) return;
  const status = document.getElementById(targetId + "_status");
  status.textContent = "Байршуулж байна...";
  try {
    const blob = await compressImage(file, 1600, 1200, 0.85);
    const url = await uploadBlobToStorage(`cms/${cmsActiveType}_${Date.now()}.jpg`, blob);
    document.getElementById(targetId).value = url;
    status.textContent = "✅ Байршлаа";
  } catch (e) {
    status.textContent = "⚠️ " + (e.message || e.code || "Алдаа гарлаа");
  }
}

function cmsOpenEdit(id) {
  const src = CMS_SOURCES[cmsActiveType];
  const ov = cmsOverride || { edits: {}, added: [] };
  const merged = cmsApply(src.list() || [], { edits: ov.edits, added: ov.added }, src.idKey);
  const item = merged.find(x => String(x[src.idKey]) === String(id));
  if (!item) return;
  const slot = document.getElementById("cmsEditSlot");
  slot.innerHTML = `
    <div class="cms-edit" role="region" aria-label="Контент засах">
      <h4>✎ Засах — ${escapeHtml(src.title(item) || id)} <span class="cms-edit-id">#${escapeHtml(String(id))}</span></h4>
      ${cmsFields(cmsActiveType).map(([key, label, type]) => `
        <div class="form-group">
          <label for="cmsF_${key}">${escapeHtml(label)}</label>
          ${cmsFieldInput(key, label, type, item[key], src)}
        </div>`).join("")}
      <div class="cms-edit-actions">
        <button class="btn btn-primary" type="button" onclick="cmsSaveEdit('${escapeHtml(String(id))}')">✓ Хадгалах</button>
        <button class="btn btn-outline" type="button" onclick="cmsRevertEdit('${escapeHtml(String(id))}')">↺ Анхны байдалд буцаах</button>
        <button class="btn btn-ghost" type="button" onclick="document.getElementById('cmsEditSlot').innerHTML=''">Болих</button>
      </div>
    </div>`;
  slot.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function cmsReadForm() {
  const src = CMS_SOURCES[cmsActiveType];
  const patch = {};
  cmsFields(cmsActiveType).forEach(([key, , type]) => {
    const f = document.getElementById("cmsF_" + key);
    if (!f) return;
    const v = f.value.trim();
    // Хоосон талбарыг бичихгүй — эс бөгөөс эх контентын утгыг хоосноор дарж бичнэ.
    if (v === "") return;
    patch[key] = type === "number" ? Number(v) : v;
  });
  return patch;
}

async function cmsSaveEdit(id) {
  if (!nbCan("content.edit")) return showToast("⚠️ Танд энэ эрх алга");
  const src = CMS_SOURCES[cmsActiveType];
  const patch = cmsReadForm();
  const before = ((cmsOverride || {}).edits || {})[id];
  try {
    // Цэгтэй зам — зөвхөн энэ ID-гийн талбарыг шинэчилнэ, зэрэг ажиллаж буй өөр
    // admin-ийн засварыг дарж бичихгүй.
    await cmsSaveOverride(cmsActiveType, { ["edits." + id]: patch });
    logAdminAction("cms_edit", id, cmsActiveType, before, patch);
    showToast("✅ Хадгалагдлаа");
    document.getElementById("cmsEditSlot").innerHTML = "";
    renderAdminCms();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

async function cmsRevertEdit(id) {
  if (!nbCan("content.edit")) return showToast("⚠️ Танд энэ эрх алга");
  if (!confirm("Энэ зүйлийн засварыг устгаж, анхны эх контент руу буцаах уу?")) return;
  const before = ((cmsOverride || {}).edits || {})[id];
  try {
    await cmsSaveOverride(cmsActiveType, { ["edits." + id]: firebase.firestore.FieldValue.delete() });
    logAdminAction("cms_reset", id, cmsActiveType, before, "анхны эх контент");
    showToast("↺ Анхны байдалд буцлаа");
    document.getElementById("cmsEditSlot").innerHTML = "";
    renderAdminCms();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

// ---------- Шинээр нэмэх ----------
// Шинэ ID нь эх өгөгдөлтэй ХЭЗЭЭ Ч мөргөлдөхгүй байх ёстой — эс бөгөөс cmsApply нь
// нэмсэн зүйлээр эх контентыг дарж бичнэ. Тиймээс одоо байгаа хамгийн том дугаараас
// нэгээр их дугаарыг сонгоно (нэмсэн зүйлсийг ч тооцно).
function cmsNextId() {
  const src = CMS_SOURCES[cmsActiveType];
  const ov = cmsOverride || {};
  const all = (src.list() || []).concat(ov.added || []);
  const max = all.reduce((m, x) => {
    const n = Number(x[src.idKey]);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return max + 1;
}

function cmsOpenCreate() {
  if (!nbCan("content.create")) return showToast("⚠️ Танд энэ эрх алга");
  const src = CMS_SOURCES[cmsActiveType];
  const slot = document.getElementById("cmsEditSlot");
  const newId = cmsNextId();
  slot.innerHTML = `
    <div class="cms-edit" role="region" aria-label="Шинэ контент нэмэх">
      <h4>+ Шинээр нэмэх — ${escapeHtml(src.label())} <span class="cms-edit-id">#${newId}</span></h4>
      <p class="service-form-note">Шинэ зүйл нь эх контентын ард нэмэгдэнэ. Устгавал эх контент огт хөндөгдөхгүй.</p>
      ${cmsFields(cmsActiveType).map(([key, label, type]) => `
        <div class="form-group">
          <label for="cmsF_${key}">${escapeHtml(label)}</label>
          ${cmsFieldInput(key, label, type, "", src)}
        </div>`).join("")}
      <div class="cms-edit-actions">
        <button class="btn btn-primary" type="button" onclick="cmsCreate(${newId})">✓ Нэмэх</button>
        <button class="btn btn-ghost" type="button" onclick="document.getElementById('cmsEditSlot').innerHTML=''">Болих</button>
      </div>
    </div>`;
  slot.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function cmsCreate(newId) {
  if (!nbCan("content.create")) return showToast("⚠️ Танд энэ эрх алга");
  const src = CMS_SOURCES[cmsActiveType];
  const item = cmsReadForm();
  const titleKey = src.fields[0][0];
  if (!item[titleKey]) return showToast("⚠️ " + src.fields[0][1] + " заавал бөглөнө үү");
  item[src.idKey] = newId;
  try {
    await cmsSaveOverride(cmsActiveType, { added: firebase.firestore.FieldValue.arrayUnion(item) });
    logAdminAction("cms_add", String(newId), cmsActiveType, undefined, item);
    showToast("✅ Нэмэгдлээ");
    document.getElementById("cmsEditSlot").innerHTML = "";
    renderAdminCms();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

// Зөвхөн CMS-ЭЭР НЭМСЭН зүйлийг устгана. Эх контентыг устгах боломж ЗОРИУДААР алга —
// түүнийг зөвхөн "нуух" боломжтой, ингэснээр буцаах нь үргэлж боломжтой хэвээр байна.
async function cmsDeleteAdded(id) {
  if (!nbCan("content.delete")) return showToast("⚠️ Танд энэ эрх алга");
  const src = CMS_SOURCES[cmsActiveType];
  const ov = cmsOverride || {};
  const item = (ov.added || []).find(x => String(x[src.idKey]) === String(id));
  if (!item) return;
  if (!confirm("Энэ нэмсэн зүйлийг устгах уу?")) return;
  try {
    await cmsSaveOverride(cmsActiveType, { added: firebase.firestore.FieldValue.arrayRemove(item) });
    logAdminAction("cms_delete", String(id), cmsActiveType, item, "устгасан");
    showToast("🗑 Устгагдлаа");
    renderAdminCms();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

async function cmsResetAll() {
  if (!nbCan("content.delete")) return showToast("⚠️ Танд энэ эрх алга");
  if (!confirm(`«${CMS_SOURCES[cmsActiveType].label()}» дээрх БҮХ өөрчлөлтийг устгах уу?\n\nЭх контент огт хөндөгдөхгүй — зөвхөн энд хийсэн нуулт/засвар/дараалал/нэмэлт арилна.`)) return;
  const before = cmsOverride;
  try {
    await cmsSaveOverride(cmsActiveType, { hidden: [], order: [], edits: {}, added: [] });
    logAdminAction("cms_reset", cmsActiveType, "all", before, "цэвэрлэсэн");
    showToast("↺ Бүх өөрчлөлт буцаагдлаа");
    renderAdminCms();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}
