// ===== ADMIN: ХУУДАСНЫ ТЕКСТ =====
//
// Сайтын статик текст бүрийг хуудас тус бүрээр орж засна.
//
// Бүтэц: tools/tag-texts.js нь текст бүрд data-text="<хуудас>.<хэш>" тавьж,
// анхны бичвэрийг js/text-defaults.js (NB_TEXT_DEFAULTS) -д бичдэг. Энэ таб нь
// түүнийг хуудсаар хуваан харуулж, засвар нь siteSettings/pageTexts дээр
// хадгалагдана.
//
// Хэш нь АНХНЫ бичвэрээс гардаг тул: хөгжүүлэгч кодын бичвэрийг зассан үед
// түлхүүр өөрчлөгдөж, admin-ийн хуучин хувилбар автоматаар хүчингүй болно.
// Тэр үед энэ таб "кодод байхгүй болсон" хэсэгт нь жагсаан, цэвэрлэх боломж өгнө.

const TEXT_PAGE_LABELS = {
  index: "Нүүр хуудас",
  ub: "УБ 365",
  aimags: "21 аймаг",
  expert: "Зөвлөгөө",
  urilga: "Урилга",
  games: "Тоглоом",
  gifts: "Бэлэг",
  movies: "Кино",
  services: "Үйлчилгээ",
  community: "Нийгэмлэг",
  saved: "Хадгалсан",
  privacy: "Нууцлалын бодлого",
  terms: "Үйлчилгээний нөхцөл",
  admin: "Админ самбар",
};

let textActivePage = "index";
let textOverrides = {};
let textQuery = "";
let textOnlyChanged = false;

// Хуудас бүрт хэдэн текст байгааг анхны лавлахаас тооцно.
function textPageKeys(page) {
  if (typeof NB_TEXT_DEFAULTS === "undefined") return [];
  return Object.keys(NB_TEXT_DEFAULTS).filter(k => k.startsWith(page + ".")).sort();
}

async function renderAdminTexts() {
  const el = document.getElementById("admin-texts");
  if (typeof NB_TEXT_DEFAULTS === "undefined") {
    el.innerHTML = `<div class="admin-empty">Текстийн лавлах ачаалагдаагүй байна.
      Терминалд <code>node tools/tag-texts.js</code> ажиллуулаад дахин оролдоно уу.</div>`;
    return;
  }
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  try {
    const snap = await db.collection("siteSettings").doc("pageTexts").get();
    textOverrides = snap.exists ? (snap.data().texts || {}) : {};
  } catch (e) {
    console.warn("pageTexts load failed:", e);
    textOverrides = {};
  }
  renderAdminTextsBody();
}

function textSwitchPage(p) { textActivePage = p; textQuery = ""; renderAdminTextsBody(); }
function textSearch(q) { textQuery = (q || "").trim().toLowerCase(); renderAdminTextsBody(); }
function textToggleChanged(v) { textOnlyChanged = v; renderAdminTextsBody(); }

function renderAdminTextsBody() {
  const el = document.getElementById("admin-texts");
  const pages = Object.keys(TEXT_PAGE_LABELS).filter(p => textPageKeys(p).length);

  const tabs = pages.map(p => {
    const keys = textPageKeys(p);
    const changed = keys.filter(k => textOverrides[k]).length;
    return `<button type="button" class="cms-type${p === textActivePage ? " active" : ""}" onclick="textSwitchPage('${p}')">
      ${escapeHtml(TEXT_PAGE_LABELS[p])} <span class="text-count">${keys.length}</span>${changed ? `<span class="cms-flag cms-flag-edited">${changed}</span>` : ""}
    </button>`;
  }).join("");

  let keys = textPageKeys(textActivePage);
  if (textQuery) {
    keys = keys.filter(k => (NB_TEXT_DEFAULTS[k] + " " + (textOverrides[k] || "")).toLowerCase().includes(textQuery));
  }
  if (textOnlyChanged) keys = keys.filter(k => textOverrides[k]);

  const rows = keys.map(k => {
    const def = NB_TEXT_DEFAULTS[k];
    const cur = textOverrides[k];
    const long = def.length > 90;
    return `<div class="text-row${cur ? " changed" : ""}">
      <div class="text-row-head">
        <code>${escapeHtml(k.split(".")[1])}</code>
        ${cur ? `<span class="cms-flag cms-flag-edited">Өөрчилсөн</span>` : ""}
      </div>
      <div class="text-original" title="Кодод бичигдсэн анхны бичвэр">${escapeHtml(def)}</div>
      ${long
        ? `<textarea id="txt_${k}" rows="3" placeholder="Анхны бичвэр хэвээр">${escapeHtml(cur || "")}</textarea>`
        : `<input type="text" id="txt_${k}" value="${escapeHtml(cur || "")}" placeholder="Анхны бичвэр хэвээр">`}
      ${cur ? `<button class="btn btn-ghost btn-sm" type="button" onclick="textRevert('${k}')">↺ Анхны бичвэр рүү</button>` : ""}
    </div>`;
  }).join("");

  const totalChanged = Object.keys(textOverrides).filter(k => textOverrides[k]).length;
  // Кодоос аль хэдийн арилсан/зассан бичвэрийн override — хэрэглэгчид харагдахгүй
  // "үл мэдэгдэх" өөрчлөлт болж үлддэг тул ил жагсааж, цэвэрлэх боломж өгнө.
  const orphans = Object.keys(textOverrides).filter(k => textOverrides[k] && !NB_TEXT_DEFAULTS[k]);

  el.innerHTML = `
    <div class="admin-note">
      Хуудас сонгоод тэр хуудасны бичвэр бүрийг засна. Хоосон орхивол кодод бичигдсэн анхны бичвэр хэвээр үлдэнэ.
      <br>Засвар нь <strong>зөвхөн ил бичвэр</strong> — HTML, холбоос оруулах боломжгүй (аюулгүй байдлын шалтгаанаар).
      ${totalChanged ? `<br>Одоо нийт <strong>${totalChanged}</strong> бичвэр өөрчлөгдсөн.` : ""}
    </div>
    <div class="cms-types">${tabs}</div>
    ${orphans.length ? `<div class="admin-note" style="border-left:3px solid var(--gold)">
      ⚠️ <strong>${orphans.length}</strong> засвар нь кодод байхгүй болсон бичвэр дээр байна (хөгжүүлэгч эх бичвэрийг зассан).
      Эдгээр нь сайтад үйлчлэхгүй.
      <button class="btn btn-outline btn-sm" type="button" onclick="textClearOrphans()">Цэвэрлэх</button>
    </div>` : ""}
    <div class="cms-toolbar">
      <input class="admin-search" type="search" placeholder="Бичвэрээр хайх..." value="${escapeHtml(textQuery)}" oninput="textSearch(this.value)" aria-label="Бичвэр хайх">
      <label class="nav-cfg-toggle" style="white-space:nowrap">
        <input type="checkbox" ${textOnlyChanged ? "checked" : ""} onchange="textToggleChanged(this.checked)">
        <span>Зөвхөн өөрчилсөн</span>
      </label>
      <button class="btn btn-primary btn-sm" type="button" onclick="textSaveAll()">✓ Хадгалах</button>
    </div>
    <div class="admin-list-count">${keys.length} / ${textPageKeys(textActivePage).length} бичвэр</div>
    ${rows || `<div class="admin-empty">Тохирох бичвэр олдсонгүй</div>`}
    ${keys.length ? `<div class="cms-edit-actions"><button class="btn btn-primary" type="button" onclick="textSaveAll()">✓ Хадгалах</button></div>` : ""}`;
}

// Нэг хуудсанд харагдаж байгаа бүх талбарыг нэг дор хадгална. Зөвхөн
// ӨӨРЧЛӨГДСӨН талбарыг бичнэ — ингэснээр баримт цэвэр байж, кодын бичвэр
// дараа нь өөрчлөгдвөл автоматаар дагана.
async function textSaveAll() {
  if (!nbCan("settings.homepage")) return showToast("⚠️ Танд энэ эрх алга");
  const patch = {};
  let changed = 0;
  textPageKeys(textActivePage).forEach(k => {
    const f = document.getElementById("txt_" + k);
    if (!f) return;                                  // шүүлтүүрээр нуугдсан
    const v = f.value.trim();
    const def = NB_TEXT_DEFAULTS[k];
    const prev = textOverrides[k] || "";
    // Хоосон эсвэл анхныхтай ижил бол override-ийг УСТГАНА.
    const next = (!v || v === def) ? null : v;
    if ((next || "") === prev) return;
    patch["texts." + k] = next === null ? firebase.firestore.FieldValue.delete() : next;
    changed++;
  });
  if (!changed) return showToast("Өөрчлөлт алга");
  try {
    const ref = db.collection("siteSettings").doc("pageTexts");
    const meta = {
      updatedBy: currentUser.uid, updatedByName: currentUser.name,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    // update() — цэгтэй зам (texts.<key>) болон FieldValue.delete() ажиллахын тулд.
    // Баримт байхгүй үед update() алддаг тул эхлээд хоосон баримт үүсгэнэ.
    try {
      await ref.update(Object.assign({}, patch, meta));
    } catch (e) {
      if (e && e.code === "not-found") {
        await ref.set({ texts: {} }, { merge: true });
        await ref.update(Object.assign({}, patch, meta));
      } else throw e;
    }
    logAdminAction("settings_texts", textActivePage, changed + " бичвэр");
    showToast("✅ " + changed + " бичвэр хадгалагдлаа");
    renderAdminTexts();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

async function textRevert(key) {
  if (!nbCan("settings.homepage")) return showToast("⚠️ Танд энэ эрх алга");
  try {
    await db.collection("siteSettings").doc("pageTexts").update({
      ["texts." + key]: firebase.firestore.FieldValue.delete(),
      updatedBy: currentUser.uid, updatedByName: currentUser.name,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    logAdminAction("settings_texts", key, "буцаасан", textOverrides[key], "анхны бичвэр");
    showToast("↺ Анхны бичвэр рүү буцлаа");
    renderAdminTexts();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

async function textClearOrphans() {
  if (!nbCan("settings.homepage")) return showToast("⚠️ Танд энэ эрх алга");
  const orphans = Object.keys(textOverrides).filter(k => textOverrides[k] && !NB_TEXT_DEFAULTS[k]);
  if (!orphans.length) return;
  if (!confirm(orphans.length + " хүчингүй засварыг устгах уу?\n\nЭдгээр нь сайтад аль хэдийн үйлчлэхгүй байгаа.")) return;
  const patch = {};
  orphans.forEach(k => { patch["texts." + k] = firebase.firestore.FieldValue.delete(); });
  try {
    await db.collection("siteSettings").doc("pageTexts").update(Object.assign({}, patch, {
      updatedBy: currentUser.uid, updatedByName: currentUser.name,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }));
    logAdminAction("settings_texts", "orphans", orphans.length + " хүчингүй засвар устгасан");
    showToast("🗑 Цэвэрлэгдлээ");
    renderAdminTexts();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}
