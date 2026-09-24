// ===== ADMIN: КОНТЕНТ УДИРДЛАГА (overlay CMS-ийн UI) =====
// js/cms.js-ийн тайлбарыг үзнэ үү: эх контент нь js/*.js файлд хэвээр байна, энэ хэсэг нь
// зөвхөн ДАВХАРЛАСАН өөрчлөлт (нуух / дараалал / засвар / нэмэх)-ийг Firestore-д бичнэ.
// Тиймээс "Буцаах" товч дарахад эх контент ЯГ хэвээрээ эргэж ирнэ — юу ч алдагдахгүй.

// Тухайн төрөл бүрийн эх жагсаалтыг хаанаас авахыг тодорхойлно. Хуудсанд тухайн dataset
// ачаалагдаагүй бол null буцаана — тэр үед "ачаалагдаагүй" гэж ИЛ хэлнэ, хоосон жагсаалт
// харуулж "контент алга" гэж төөрөгдүүлэхгүй.
const CMS_SOURCES = {
  ub: {
    idKey: "id",
    label: () => CMS_TYPE_LABELS.ub,
    list: () => (typeof allUbIdeas !== "undefined" ? allUbIdeas : null),
    title: x => x.title,
    meta: x => `${x.day}-р өдөр · ${x.category || "-"} · ${x.priceText || ""}`,
    fields: [["title", "Гарчиг", "text"], ["desc", "Тайлбар", "textarea"], ["location", "Байршил", "text"], ["feeling", "Мэдрэмж", "textarea"]],
  },
  aimags: {
    idKey: "id",
    label: () => CMS_TYPE_LABELS.aimags,
    list: () => (typeof aimagsClean !== "undefined" ? aimagsClean : null),
    title: x => x.name,
    meta: x => `${(x.wonders || []).length} онцлох газар · ${(x.dates || []).length} санаа`,
    fields: [["name", "Нэр", "text"], ["desc", "Тайлбар", "textarea"], ["history", "Түүх", "textarea"]],
  },
  gifts: {
    idKey: "id",
    label: () => CMS_TYPE_LABELS.gifts,
    list: () => (typeof gifts !== "undefined" ? gifts : null),
    title: x => x.name || x.title,
    meta: x => `${x.category || "-"}${x.price ? " · " + x.price : ""}`,
    fields: [["name", "Нэр", "text"], ["desc", "Тайлбар", "textarea"]],
  },
};

let cmsActiveType = "ub";
let cmsOverride = null;
let cmsQuery = "";
let cmsPage = 0;
const CMS_PAGE_SIZE = 25;

async function renderAdminCms() {
  const el = document.getElementById("admin-cms");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  cmsOverride = await cmsLoadOverride(cmsActiveType);
  renderAdminCmsBody();
}

function cmsSwitchType(type) {
  cmsActiveType = type; cmsQuery = ""; cmsPage = 0;
  renderAdminCms();
}
function cmsSearch(q) { cmsQuery = (q || "").trim().toLowerCase(); cmsPage = 0; renderAdminCmsBody(); }
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
      <div class="admin-empty">Энэ төрлийн өгөгдөл энэ хуудсанд ачаалагдаагүй байна — тиймээс жагсаалтыг харуулж чадахгүй.
      (admin.html дээр тухайн dataset-ийн script-ийг нэмэх шаардлагатай.)</div>`;
    return;
  }

  const ov = cmsOverride || { hidden: [], order: [], edits: {}, added: [] };
  const hiddenSet = new Set((ov.hidden || []).map(String));
  const editedSet = new Set(Object.keys(ov.edits || {}));
  const addedSet = new Set((ov.added || []).map(x => String(x[src.idKey])));

  // Admin-д БҮХ зүйл харагдана — нуусан нь ч гэсэн (эс бөгөөс буцааж чадахгүй болно).
  // Тиймээс cmsApply-г бүрэн ашиглалгүй, зөвхөн засвар/нэмэлтийг л тавина.
  const merged = cmsApply(base, { edits: ov.edits, added: ov.added, order: ov.order }, src.idKey);
  const filtered = cmsQuery
    ? merged.filter(x => (src.title(x) || "").toLowerCase().includes(cmsQuery) || String(x[src.idKey]).includes(cmsQuery))
    : merged;

  const totalPages = Math.ceil(filtered.length / CMS_PAGE_SIZE) || 1;
  const page = Math.min(cmsPage, totalPages - 1);
  const slice = filtered.slice(page * CMS_PAGE_SIZE, (page + 1) * CMS_PAGE_SIZE);

  const rows = slice.map(x => {
    const id = String(x[src.idKey]);
    const isHidden = hiddenSet.has(id);
    const flags = [];
    if (isHidden) flags.push(`<span class="cms-flag cms-flag-hidden">Нуусан</span>`);
    if (editedSet.has(id)) flags.push(`<span class="cms-flag cms-flag-edited">Засварласан</span>`);
    if (addedSet.has(id)) flags.push(`<span class="cms-flag cms-flag-added">Нэмсэн</span>`);
    return `<div class="admin-card${isHidden ? " admin-card-dim" : ""}">
      <div class="admin-card-main">
        <strong>${escapeHtml(src.title(x) || "(нэргүй)")}</strong> ${flags.join(" ")}
        <div class="admin-card-meta">#${escapeHtml(id)} · ${escapeHtml(src.meta(x) || "")}</div>
      </div>
      <div class="admin-card-actions">
        ${nbCan("content.edit") ? `<button class="btn btn-outline btn-sm" type="button" onclick="cmsOpenEdit('${escapeHtml(id)}')">✎ Засах</button>` : ""}
        ${nbCan("content.reorder") ? `<button class="btn btn-outline btn-sm" type="button" onclick="cmsPinTop('${escapeHtml(id)}')" title="Жагсаалтын эхэнд гаргах">⬆ Эхэнд</button>` : ""}
        ${nbCan("content.hide") ? `<button class="btn btn-outline btn-sm" type="button" onclick="cmsToggleHidden('${escapeHtml(id)}', ${!isHidden})">${isHidden ? "👁 Харуулах" : "🚫 Нуух"}</button>` : ""}
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
      <input class="admin-search" type="search" placeholder="Гарчиг эсвэл ID-аар хайх..." value="${escapeHtml(cmsQuery)}" oninput="cmsSearch(this.value)" aria-label="Контент хайх">
      ${nbCan("content.delete") && changeCount ? `<button class="btn btn-outline btn-sm" type="button" onclick="cmsResetAll()">↺ Бүх өөрчлөлтийг буцаах</button>` : ""}
    </div>
    <div class="admin-list-count">${filtered.length} / ${merged.length} зүйл</div>
    ${rows || `<div class="admin-empty">Тохирох зүйл олдсонгүй</div>`}
    ${totalPages > 1 ? `<div class="cms-pager">
      <button class="btn btn-outline btn-sm" type="button" ${page === 0 ? "disabled" : ""} onclick="cmsGoPage(${page - 1})">← Өмнөх</button>
      <span>${page + 1} / ${totalPages}</span>
      <button class="btn btn-outline btn-sm" type="button" ${page >= totalPages - 1 ? "disabled" : ""} onclick="cmsGoPage(${page + 1})">Дараах →</button>
    </div>` : ""}
    <div id="cmsEditSlot"></div>`;
}

async function cmsToggleHidden(id, hide) {
  if (!nbCan("content.hide")) return showToast("⚠️ Танд энэ эрх алга");
  try {
    const op = hide
      ? firebase.firestore.FieldValue.arrayUnion(id)
      : firebase.firestore.FieldValue.arrayRemove(id);
    await cmsSaveOverride(cmsActiveType, { hidden: op });
    logAdminAction(hide ? "cms_hide" : "cms_show", id, cmsActiveType);
    showToast(hide ? "🚫 Нуугдлаа" : "👁 Дахин харагдана");
    renderAdminCms();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

async function cmsPinTop(id) {
  if (!nbCan("content.reorder")) return showToast("⚠️ Танд энэ эрх алга");
  try {
    // Эхлээд хасаад дараа нь урд нь тавина — давхардахаас сэргийлнэ.
    const cur = ((cmsOverride && cmsOverride.order) || []).map(String).filter(x => x !== String(id));
    await cmsSaveOverride(cmsActiveType, { order: [String(id)].concat(cur) });
    logAdminAction("cms_reorder", id, cmsActiveType);
    showToast("⬆ Эхэнд гарлаа");
    renderAdminCms();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

function cmsOpenEdit(id) {
  const src = CMS_SOURCES[cmsActiveType];
  const base = src.list() || [];
  const ov = cmsOverride || { edits: {}, added: [] };
  const merged = cmsApply(base, { edits: ov.edits, added: ov.added }, src.idKey);
  const item = merged.find(x => String(x[src.idKey]) === String(id));
  if (!item) return;
  const slot = document.getElementById("cmsEditSlot");
  slot.innerHTML = `
    <div class="cms-edit" role="region" aria-label="Контент засах">
      <h4>✎ Засах — ${escapeHtml(src.title(item) || id)}</h4>
      ${src.fields.map(([key, label, type]) => `
        <div class="form-group">
          <label for="cmsF_${key}">${escapeHtml(label)}</label>
          ${type === "textarea"
            ? `<textarea id="cmsF_${key}" rows="3">${escapeHtml(item[key] || "")}</textarea>`
            : `<input type="text" id="cmsF_${key}" value="${escapeHtml(item[key] || "")}">`}
        </div>`).join("")}
      <div class="cms-edit-actions">
        <button class="btn btn-primary" type="button" onclick="cmsSaveEdit('${escapeHtml(String(id))}')">✓ Хадгалах</button>
        <button class="btn btn-outline" type="button" onclick="cmsRevertEdit('${escapeHtml(String(id))}')">↺ Анхны байдалд буцаах</button>
        <button class="btn btn-ghost" type="button" onclick="document.getElementById('cmsEditSlot').innerHTML=''">Болих</button>
      </div>
    </div>`;
  slot.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function cmsSaveEdit(id) {
  if (!nbCan("content.edit")) return showToast("⚠️ Танд энэ эрх алга");
  const src = CMS_SOURCES[cmsActiveType];
  const patch = {};
  src.fields.forEach(([key]) => {
    const f = document.getElementById("cmsF_" + key);
    if (f) patch[key] = f.value;
  });
  try {
    // Зөвхөн тухайн ID-гийн талбарыг шинэчилнэ (dot-path) — өөр admin-ийн зэрэг хийсэн
    // засварыг дарж бичихгүй.
    await cmsSaveOverride(cmsActiveType, { ["edits." + id]: patch });
    logAdminAction("cms_edit", id, cmsActiveType);
    showToast("✅ Хадгалагдлаа");
    document.getElementById("cmsEditSlot").innerHTML = "";
    renderAdminCms();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

async function cmsRevertEdit(id) {
  if (!nbCan("content.edit")) return showToast("⚠️ Танд энэ эрх алга");
  if (!confirm("Энэ зүйлийн засварыг устгаж, анхны эх контент руу буцаах уу?")) return;
  try {
    await cmsSaveOverride(cmsActiveType, { ["edits." + id]: firebase.firestore.FieldValue.delete() });
    logAdminAction("cms_reset", id, cmsActiveType);
    showToast("↺ Анхны байдалд буцлаа");
    document.getElementById("cmsEditSlot").innerHTML = "";
    renderAdminCms();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

async function cmsResetAll() {
  if (!nbCan("content.delete")) return showToast("⚠️ Танд энэ эрх алга");
  if (!confirm(`«${CMS_SOURCES[cmsActiveType].label()}» дээрх БҮХ өөрчлөлтийг устгах уу?\n\nЭх контент огт хөндөгдөхгүй — зөвхөн энд хийсэн нуулт/засвар/дараалал арилна.`)) return;
  try {
    await cmsSaveOverride(cmsActiveType, { hidden: [], order: [], edits: {}, added: [] });
    logAdminAction("cms_reset", cmsActiveType, "all");
    showToast("↺ Бүх өөрчлөлт буцаагдлаа");
    renderAdminCms();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}
