// ===== ADMIN: КИНО КАТАЛОГИЙН БҮРЭН УДИРДЛАГА =====
//
// Кино хоёр эх сурвалжаас ирдэг:
//   1. Суурь каталог  — js/movies.js доторх `movies` массив (кодод бичигдсэн)
//   2. Нэмсэн кино    — Firestore `movies` collection (admin-аас нэмсэн)
//
// Frontend нь allMovies() -ээр хоёуланг нэгтгэж харуулдаг. Админ самбар мөн
// адил НЭГТГЭСЭН жагсаалтыг харуулна — эс бөгөөс "сайт дээр харагдаж байгаа
// кино админд байхгүй" гэсэн ойлгомжгүй байдал үүснэ (яг тийм байсан).
//
// Засах/устгах нь эх сурвалжаасаа хамаарна:
//   * Firestore кино → шууд засна/устгана
//   * Суурь каталог  → contentOverrides/movies дээр ДАВХАРЛАЖ засна, эсвэл
//                      нуу+на. Кодын файлыг өөрчлөхгүй тул "Буцаах" дарахад
//                      анхны өгөгдөл яг хэвээрээ эргэж ирнэ.

const ADM_MOVIE_FIELDS = [
  ["title", "Нэр", "text"],
  ["year", "Он", "text"],
  ["rating", "Үнэлгээ (0-10)", "text"],
  ["duration", "Үргэлжлэх хугацаа", "text"],
  ["poster", "Постерын зураг", "image"],
  ["genres", "Төрөл (таслалаар)", "genres"],
  ["lang", "Хэл", "lang"],
  ["emoji", "Эможи", "text"],
  ["director", "Найруулагч", "text"],
  ["desc", "Тайлбар", "textarea"],
  ["why", "Яагаад хосуудад?", "textarea"],
  ["trailer", "Trailer (embed URL)", "text"],
  ["watchUrl", "Үзэх холбоос", "text"],
  ["trending", "Трендэд харуулах", "bool"],
];

const ADM_MOVIE_TABS = [
  ["all", "Бүгд"], ["trending", "🔥 Тренд"],
  ["mongolian", "🎬 Монгол"], ["dubbed", "🎙 Хадмал"],
];

let admMovieTab = "all";
let admMovieGenre = "all";
let admMovieQuery = "";
let admMovieOverride = null;

// Админд БҮХ кино харагдана — нуусан нь ч бас (эс бөгөөс буцааж чадахгүй).
function admMovieList() {
  if (typeof movies === "undefined") return null;
  const ov = admMovieOverride || { hidden: [], edits: {}, added: [], order: [] };
  // Суурь каталогт зөвхөн ЗАСВАРЫГ тавина, нуултыг биш — нуусныг нь ялгаж
  // харуулаад "дахин харуулах" товч өгнө.
  const base = cmsApply(movies, { edits: ov.edits, added: ov.added, order: ov.order }, "id")
    .map(m => Object.assign({}, m, { _src: "base" }));
  const fb = (typeof firebaseMovies !== "undefined" ? firebaseMovies : [])
    .map(m => Object.assign({}, m, { _src: "db" }));
  return base.concat(fb);
}

function admMovieHidden(id) {
  const ov = admMovieOverride || {};
  return (ov.hidden || []).map(String).includes(String(id));
}

async function renderAdminMovies() {
  const el = document.getElementById("admin-movies");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  try {
    admMovieOverride = await cmsLoadOverride("movies");
  } catch (e) {
    console.warn("movie override load failed:", e);
    admMovieOverride = { hidden: [], order: [], edits: {}, added: [] };
  }
  renderAdminMoviesBody();
}

function admSetMovieTab(v) { admMovieTab = v; renderAdminMoviesBody(); }
function admSetMovieGenre(v) { admMovieGenre = v; renderAdminMoviesBody(); }
function admSearchMovies(v) { admMovieQuery = (v || "").trim().toLowerCase(); renderAdminMoviesBody(); }

function renderAdminMoviesBody() {
  const el = document.getElementById("admin-movies");
  const all = admMovieList();
  if (all === null) {
    el.innerHTML = `<div class="admin-empty">Киноны өгөгдөл энэ хуудсанд ачаалагдаагүй байна.</div>`;
    return;
  }

  // Шүүлтүүр нь FRONTEND-тэй ЯГ ижил логиктой — админ дээр "олдож байгаа"
  // зүйл сайт дээр ч олдоно гэдэгт итгэлтэй байхын тулд.
  let list = all;
  if (admMovieTab === "trending") list = list.filter(m => m.trending);
  else if (admMovieTab === "mongolian") list = list.filter(m => m.lang === "mongolian");
  else if (admMovieTab === "dubbed") list = list.filter(m => m.lang === "dubbed");
  if (admMovieGenre !== "all") list = list.filter(m => (m.genres || []).includes(admMovieGenre));
  if (admMovieQuery) {
    list = list.filter(m => (m.title || "").toLowerCase().includes(admMovieQuery)
      || (m.desc || "").toLowerCase().includes(admMovieQuery)
      || (m.director || "").toLowerCase().includes(admMovieQuery));
  }

  const genres = Object.keys(typeof GL !== "undefined" ? GL : {});
  const tabs = ADM_MOVIE_TABS.map(([v, l]) =>
    `<button type="button" class="cms-type${v === admMovieTab ? " active" : ""}" onclick="admSetMovieTab('${v}')">${escapeHtml(l)}</button>`).join("");
  const genreChips = [`<button type="button" class="cms-type${admMovieGenre === "all" ? " active" : ""}" onclick="admSetMovieGenre('all')">Бүх төрөл</button>`]
    .concat(genres.map(g =>
      `<button type="button" class="cms-type${g === admMovieGenre ? " active" : ""}" onclick="admSetMovieGenre('${g}')">${escapeHtml(GL[g])}</button>`)).join("");

  const editedSet = new Set(Object.keys((admMovieOverride || {}).edits || {}));

  const rows = list.map(m => {
    const key = m._src === "db" ? m._dbId : m.id;
    const hidden = m._src === "base" && admMovieHidden(m.id);
    const flags = [];
    flags.push(m._src === "db"
      ? `<span class="cms-flag cms-flag-added">Нэмсэн</span>`
      : `<span class="cms-flag">Суурь</span>`);
    if (hidden) flags.push(`<span class="cms-flag cms-flag-hidden">Нуусан</span>`);
    else flags.push(`<span class="cms-flag cms-flag-published">Харагдаж байна</span>`);
    if (m._src === "base" && editedSet.has(String(m.id))) flags.push(`<span class="cms-flag cms-flag-edited">Засварласан</span>`);
    if (m.trending) flags.push(`<span class="cms-flag cms-flag-edited">🔥 Тренд</span>`);

    return `<div class="admin-card${hidden ? " admin-card-dim" : ""}">
      ${m.poster ? `<img src="${escapeHtml(m.poster)}" alt="" class="admin-card-thumb" style="width:46px;height:68px" onerror="this.remove()">` : ""}
      <div class="admin-card-main">
        <strong>${escapeHtml(m.title || "(нэргүй)")}</strong> ${flags.join(" ")}
        <div class="admin-card-meta">
          ${escapeHtml(m.year || "")} · ⭐ ${escapeHtml(String(m.rating || "-"))}
          · ${escapeHtml((m.genres || []).map(g => (GL[g] || g)).join(", "))}
          · ${escapeHtml((typeof LANG_LABEL !== "undefined" && LANG_LABEL[m.lang]) || m.lang || "")}
        </div>
        ${m.desc ? `<div class="admin-card-desc">${escapeHtml(m.desc.slice(0, 120))}</div>` : ""}
      </div>
      <div class="admin-card-actions">
        ${nbCan("content.edit") ? `<button class="btn btn-outline btn-sm" type="button" onclick="admEditMovie('${escapeHtml(m._src)}','${escapeHtml(String(key))}')">✎ Засах</button>` : ""}
        ${m._src === "base" && nbCan("content.hide")
          ? `<button class="btn btn-outline btn-sm" type="button" onclick="admToggleMovieHidden('${escapeHtml(String(m.id))}', ${!hidden})">${hidden ? "👁 Харуулах" : "🚫 Нуух"}</button>`
          : ""}
        ${m._src === "db" && nbCan("content.delete")
          ? `<button class="btn btn-outline btn-sm" style="border-color:#ef4444;color:#ef4444" type="button" onclick="admDeleteMovie('${escapeHtml(m._dbId)}')">🗑 Устгах</button>`
          : ""}
      </div>
    </div>`;
  }).join("");

  el.innerHTML = `
    <div class="admin-note">
      Сайт дээр харагдаж байгаа <strong>бүх</strong> кино энд байна — кодын суурь каталог болон нэмсэн кино хоёулаа.
      Суурь каталогийг <strong>давхарлаж</strong> засна: кодын файл хөндөгдөхгүй тул буцаах нь үргэлж боломжтой.
    </div>
    <div class="cms-types">${tabs}</div>
    <div class="cms-types">${genreChips}</div>
    <div class="cms-toolbar">
      <input class="admin-search" type="search" placeholder="Нэр, тайлбар, найруулагчаар хайх..." value="${escapeHtml(admMovieQuery)}" oninput="admSearchMovies(this.value)" aria-label="Кино хайх">
      ${nbCan("content.create") ? `<button class="btn btn-primary btn-sm" type="button" onclick="admEditMovie('new','')">+ Шинэ кино</button>` : ""}
    </div>
    <div class="admin-list-count">${list.length} / ${all.length} кино</div>
    <div id="admMovieEditSlot"></div>
    ${rows || `<div class="admin-empty">Тохирох кино олдсонгүй</div>`}`;
}

// ---------- Засварлах / нэмэх ----------
function admMovieFieldInput(key, label, type, value) {
  const v = value === undefined || value === null ? "" : value;
  const id = "admMv_" + key;
  if (type === "textarea") return `<textarea id="${id}" rows="3">${escapeHtml(v)}</textarea>`;
  if (type === "bool") return `<label class="nav-cfg-toggle"><input type="checkbox" id="${id}" ${v ? "checked" : ""}><span>Тийм</span></label>`;
  if (type === "lang") {
    const opts = { dubbed: "Монгол хадмал", mongolian: "Монгол хэлээр", original: "Эх хэлээр" };
    return `<select id="${id}">${Object.entries(opts).map(([k, l]) =>
      `<option value="${k}"${k === v ? " selected" : ""}>${escapeHtml(l)}</option>`).join("")}</select>`;
  }
  if (type === "genres") {
    const chosen = Array.isArray(v) ? v : String(v || "").split(",").map(x => x.trim()).filter(Boolean);
    const all = Object.keys(typeof GL !== "undefined" ? GL : {});
    return `<div class="genre-pick" id="${id}">${all.map(g =>
      `<label class="nav-cfg-toggle"><input type="checkbox" value="${g}" ${chosen.includes(g) ? "checked" : ""}><span>${escapeHtml(GL[g])}</span></label>`).join("")}</div>`;
  }
  if (type === "image") {
    return `<div class="cms-img-field">
      <input type="text" id="${id}" value="${escapeHtml(v)}" placeholder="Зургийн URL, эсвэл доороос файл сонгоно уу">
      <input type="file" accept="image/*" onchange="admUploadMoviePoster(this,'${id}')">
      <div class="cms-img-status" id="${id}_status"></div>
      ${v ? `<img src="${escapeHtml(v)}" alt="" class="cms-img-preview" onerror="this.remove()">` : ""}
    </div>`;
  }
  return `<input type="text" id="${id}" value="${escapeHtml(v)}">`;
}

async function admUploadMoviePoster(input, targetId) {
  const file = input.files[0];
  if (!file) return;
  const status = document.getElementById(targetId + "_status");
  status.textContent = "Байршуулж байна...";
  try {
    const blob = await compressImage(file, 800, 1200, 0.85);
    const url = await uploadBlobToStorage(`movies/${Date.now()}/poster.jpg`, blob);
    document.getElementById(targetId).value = url;
    status.textContent = "✅ Байршлаа";
  } catch (e) {
    status.textContent = "⚠️ " + (e.message || e.code || "Алдаа гарлаа");
  }
}

function admEditMovie(src, key) {
  if (!nbCan("content.edit")) return showToast("⚠️ Танд энэ эрх алга");
  const isNew = src === "new";
  const m = isNew ? {} : (admMovieList() || []).find(x =>
    (x._src === "db" ? String(x._dbId) : String(x.id)) === String(key) && x._src === src) || {};
  const slot = document.getElementById("admMovieEditSlot");
  slot.innerHTML = `
    <div class="cms-edit" role="region" aria-label="Кино засах">
      <h4>${isNew ? "+ Шинэ кино" : "✎ " + escapeHtml(m.title || "")}
        <span class="cms-edit-id">${isNew ? "" : (src === "db" ? "нэмсэн" : "суурь каталог")}</span></h4>
      ${ADM_MOVIE_FIELDS.map(([k, label, type]) => `
        <div class="form-group">
          <label for="admMv_${k}">${escapeHtml(label)}</label>
          ${admMovieFieldInput(k, label, type, m[k])}
        </div>`).join("")}
      <div class="cms-edit-actions">
        <button class="btn btn-primary" type="button" onclick="admSaveMovie('${escapeHtml(src)}','${escapeHtml(String(key))}')">✓ Хадгалах</button>
        ${!isNew && src === "base" ? `<button class="btn btn-outline" type="button" onclick="admRevertMovie('${escapeHtml(String(key))}')">↺ Анхны байдалд буцаах</button>` : ""}
        <button class="btn btn-ghost" type="button" onclick="document.getElementById('admMovieEditSlot').innerHTML=''">Болих</button>
      </div>
    </div>`;
  slot.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function admReadMovieForm() {
  const out = {};
  ADM_MOVIE_FIELDS.forEach(([k, , type]) => {
    const node = document.getElementById("admMv_" + k);
    if (!node) return;
    if (type === "bool") { out[k] = node.checked; return; }
    if (type === "genres") {
      out[k] = [...node.querySelectorAll("input:checked")].map(i => i.value);
      return;
    }
    const v = node.value.trim();
    if (v !== "") out[k] = v;
  });
  return out;
}

async function admSaveMovie(src, key) {
  if (!nbCan("content.edit")) return showToast("⚠️ Танд энэ эрх алга");
  const data = admReadMovieForm();
  if (!data.title) return showToast("⚠️ Нэр заавал бөглөнө үү");
  if (!data.genres || !data.genres.length) return showToast("⚠️ Дор хаяж нэг төрөл сонгоно уу");
  try {
    if (src === "new") {
      data.emoji = data.emoji || "🎬";
      data.dateAdded = new Date().toISOString().slice(0, 10);
      const dbId = await saveMovieToFirebase(data);
      if (!dbId) return showToast("⚠️ Хадгалахад алдаа гарлаа");
      logAdminAction("movie_add", dbId, data.title, undefined, data);
    } else if (src === "db") {
      await db.collection("movies").doc(key).update(data);
      logAdminAction("movie_edit", key, data.title, undefined, data);
    } else {
      // Суурь каталог — кодыг хөндөхгүй, давхарлаж бичнэ.
      const before = ((admMovieOverride || {}).edits || {})[key];
      await cmsSaveOverride("movies", { ["edits." + key]: data });
      logAdminAction("movie_edit", key, data.title, before, data);
    }
    showToast("✅ Хадгалагдлаа");
    document.getElementById("admMovieEditSlot").innerHTML = "";
    if (typeof loadMoviesFromFirebase === "function") loadMoviesFromFirebase();
    renderAdminMovies();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

async function admRevertMovie(id) {
  if (!confirm("Энэ киноны засварыг устгаж, анхны өгөгдөл рүү буцаах уу?")) return;
  try {
    await cmsSaveOverride("movies", { ["edits." + id]: firebase.firestore.FieldValue.delete() });
    logAdminAction("movie_edit", String(id), "буцаасан", undefined, "анхны өгөгдөл");
    showToast("↺ Анхны байдалд буцлаа");
    document.getElementById("admMovieEditSlot").innerHTML = "";
    renderAdminMovies();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

async function admToggleMovieHidden(id, hide) {
  if (!nbCan("content.hide")) return showToast("⚠️ Танд энэ эрх алга");
  try {
    const op = hide
      ? firebase.firestore.FieldValue.arrayUnion(String(id))
      : firebase.firestore.FieldValue.arrayRemove(String(id));
    await cmsSaveOverride("movies", { hidden: op });
    logAdminAction(hide ? "movie_hide" : "movie_show", String(id), "", hide ? "харагдаж байсан" : "нуугдсан", hide ? "нуусан" : "харагдана");
    showToast(hide ? "🚫 Нуугдлаа" : "👁 Дахин харагдана");
    renderAdminMovies();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

async function admDeleteMovie(dbId) {
  if (!nbCan("content.delete")) return showToast("⚠️ Танд энэ эрх алга");
  if (!confirm("Энэ киног бүрмөсөн устгах уу?")) return;
  try {
    await deleteMovieFromFirebase(dbId);
    logAdminAction("movie_delete", dbId, "", "байсан", "устгасан");
    showToast("🗑 Устгагдлаа");
    if (typeof loadMoviesFromFirebase === "function") loadMoviesFromFirebase();
    renderAdminMovies();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}
