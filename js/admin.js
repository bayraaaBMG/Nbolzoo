// ===== ADMIN DASHBOARD =====

function checkAdminAccess() {
  const gate = document.getElementById("adminGate");
  const panel = document.getElementById("adminPanel");
  if (!currentUser) {
    gate.innerHTML = `<div class="admin-denied">🔒 Энэ хуудсанд орохын тулд эхлээд <a onclick="openAuth('login')" style="cursor:pointer;text-decoration:underline;">нэвтэрнэ үү</a>.</div>`;
    gate.style.display = "block"; panel.style.display = "none";
    return false;
  }
  if (!nbCan("dashboard.view")) {
    gate.innerHTML = `<div class="admin-denied">⛔ Танд админ эрх байхгүй байна.<br><a onclick="navigate('home')" style="cursor:pointer;text-decoration:underline;font-size:14px;">← Нүүр хуудас руу буцах</a></div>`;
    gate.style.display = "block"; panel.style.display = "none";
    return false;
  }
  gate.style.display = "none";
  // .admin-shell-ийн CSS (display:flex, sidebar+content) ажиллахын тулд style.display-г
  // "block" гэж хатуу тохируулахгүй, зөвхөн inline override-г арилгана — ингэснээр
  // stylesheet-ийн display:flex дахин үйлчилнэ (өмнө нь "block" гэж хатуу бичсэн нь sidebar
  // + content хажуу хажуугаараа биш, зөвхөн доогуур давхарлагдаж харагдах шалтгаан байсан).
  panel.style.removeProperty("display");
  return true;
}

function initAdminDashboard() {
  try {
    if (!checkAdminAccess()) return;
    const wanted = new URLSearchParams(location.search).get("tab");
    const first = adminVisibleTabs()[0];
    if (!first) { document.getElementById("adminGate").innerHTML = `<div class="admin-denied">⛔ Танд ямар ч хэсэгт хандах эрх алга.</div>`; document.getElementById("adminGate").style.display = "block"; document.getElementById("adminPanel").style.display = "none"; return; }
    showAdminTab(wanted || first.items[0].id);
  } catch (e) {
    // Dashboard хэзээ ч бүрмөсөн хоосон үлдэж болохгүй — юу ч гэнэт эвдэрсэн ч
    // хэрэглэгчид ойлгомжтой алдаа, сэргээх зөвлөмжтэйгээр харуулна.
    console.warn("initAdminDashboard error:", e);
    const gate = document.getElementById("adminGate");
    if (gate) {
      gate.innerHTML = `<div class="admin-denied">⚠️ Dashboard ачаалахад алдаа гарлаа.<br><a onclick="location.reload()" style="cursor:pointer;text-decoration:underline;font-size:14px;">↻ Хуудсыг дахин ачаалах</a></div>`;
      gate.style.display = "block";
    }
  }
}

// Таб бүр ямар эрх шаардахыг НЭГ газар тодорхойлсон — цэс, чиглүүлэлт хоёулаа эндээс
// уншина, тиймээс "цэсэнд харагдахгүй ч URL-ээр шууд орох" гэсэн зөрүү үүсэхгүй.
// Эрхийн жинхэнэ хамгаалалт нь firestore.rules дээр — энэ нь зөвхөн UI.
const ADMIN_TABS = [
  { group: "Ерөнхий", items: [
    { id: "overview",   label: "Тойм",             icon: "📊", perm: "dashboard.view", render: () => renderAdminOverview() },
    { id: "activity",   label: "Үйл ажиллагаа",    icon: "📜", perm: "audit.read",     render: () => renderAdminActivity() },
  ]},
  { group: "Контент", items: [
    { id: "cms",        label: "Контент удирдлага", icon: "🗂", perm: "content.read",   render: () => renderAdminCms() },
    { id: "movies",     label: "Кино каталог",      icon: "🎞", perm: "content.edit",   render: () => renderAdminMovies() },
    { id: "suggestions",label: "Кино саналууд",     icon: "🎬", perm: "content.edit",   render: () => renderAdminSuggestions() },
  ]},
  { group: "Модерац", items: [
    { id: "reports",    label: "Гомдол",            icon: "🚩", perm: "moderation.reports", render: () => renderAdminReports() },
    { id: "posts",      label: "Нийтлэлүүд",        icon: "📝", perm: "moderation.hide",    render: () => renderAdminPosts() },
    { id: "comments",   label: "Сэтгэгдэл",         icon: "💬", perm: "moderation.hide",    render: () => renderAdminComments() },
  ]},
  { group: "Маркетинг", items: [
    { id: "services",   label: "Үйлчилгээ",         icon: "🏪", perm: "services.read",  render: () => renderAdminServices() },
    { id: "banners",    label: "Banner / Зар",      icon: "📢", perm: "banners.read",   render: () => renderAdminBanners() },
    { id: "invites",    label: "Урилгууд",          icon: "💌", perm: "content.read",   render: () => renderAdminInvites() },
  ]},
  { group: "Хэрэглэгч", items: [
    { id: "users",      label: "Хэрэглэгчид",       icon: "🧑‍🤝‍🧑", perm: "users.read", render: () => renderAdminUsers() },
  ]},
  { group: "Тохиргоо", items: [
    { id: "theme",      label: "Өнгө / Загвар",     icon: "🎨", perm: "settings.theme",      render: () => renderAdminTheme() },
    { id: "navigation", label: "Цэс",               icon: "🧭", perm: "settings.navigation", render: () => renderAdminNavigation() },
    { id: "homepage",   label: "Нүүр хуудас",       icon: "🏠", perm: "settings.homepage",   render: () => renderAdminHomepage() },
  ]},
];

function adminTabById(id) {
  for (const g of ADMIN_TABS) { const t = g.items.find(i => i.id === id); if (t) return t; }
  return null;
}
function adminVisibleTabs() {
  return ADMIN_TABS
    .map(g => ({ group: g.group, items: g.items.filter(i => nbCan(i.perm)) }))
    .filter(g => g.items.length);
}

// Цэсийг эрхийн дагуу зурна. Moderator-т зөвхөн хяналтын таб харагдана.
function renderAdminTabs(active) {
  const nav = document.getElementById("adminTabs");
  if (!nav) return;
  nav.innerHTML = adminVisibleTabs().map(g => `
    <div class="admin-tab-group">
      <div class="admin-tab-group-label">${escapeHtml(g.group)}</div>
      ${g.items.map(i => `<button type="button" class="admin-tab${i.id === active ? " active" : ""}" data-tab="${i.id}" onclick="showAdminTab('${i.id}')">
        <span class="admin-tab-ico" aria-hidden="true">${i.icon}</span>${escapeHtml(i.label)}
      </button>`).join("")}
    </div>`).join("");
}

function showAdminTab(tab) {
  const t = adminTabById(tab);
  // Эрхгүй таб руу орохыг оролдвол (URL-ээр эсвэл хуучин bookmark-аар) чимээгүй
  // зөвшөөрөгдсөн эхний таб руу буцаана.
  if (!t || !nbCan(t.perm)) {
    const first = adminVisibleTabs()[0];
    if (!first) return;
    if (first.items[0].id === tab) return;
    return showAdminTab(first.items[0].id);
  }
  renderAdminTabs(tab);
  document.querySelectorAll(".admin-tab-content").forEach(c => c.style.display = c.id === "admin-" + tab ? "block" : "none");
  try { history.replaceState(null, "", "admin.html?tab=" + encodeURIComponent(tab)); } catch (e) {}
  t.render();
}

// Every moderation/write action funnels through here so the Activity log tab has a
// trustworthy audit trail. Logging failure must never block the actual action, so this
// is fire-and-forget with its own try/catch — callers don't (and shouldn't) await it.
async function logAdminAction(action, targetId, extra) {
  try {
    await db.collection("adminLog").add({
      action, targetId: targetId || "", extra: extra || "",
      actorUid: currentUser.uid, actorName: currentUser.name,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) { console.warn("logAdminAction failed:", e); }
}
const ADMIN_ACTION_LABELS = {
  suggestion_approve: "Кино санал зөвшөөрсөн", suggestion_reject: "Кино санал татгалзсан",
  movie_add: "Кино нэмсэн", movie_delete: "Кино устгасан",
  post_hide: "Пост нуусан", post_unhide: "Пост дахин харуулсан", post_delete: "Пост устгасан",
  comment_hide: "Сэтгэгдэл нуусан", comment_unhide: "Сэтгэгдэл дахин харуулсан", comment_delete: "Сэтгэгдэл устгасан",
  user_ban: "Хэрэглэгч хориглосон", user_unban: "Хэрэглэгчийн хориг арилгасан",
  admin_grant: "Admin эрх олгосон", admin_revoke: "Admin эрх хассан",
  banner_add: "Banner нэмсэн", banner_toggle: "Banner идэвх өөрчилсөн", banner_delete: "Banner устгасан",
  report_hide: "Гомдлыг шийдэж контент нуусан", report_delete: "Гомдлыг шийдэж контент устгасан", report_dismiss: "Гомдлыг татгалзсан",
  moderator_grant: "Moderator эрх олгосон", moderator_revoke: "Moderator эрх хассан",
  cms_hide: "Контент нуусан", cms_show: "Контент дахин харуулсан", cms_edit: "Контент засварласан",
  cms_reorder: "Контентын дараалал өөрчилсөн", cms_add: "Шинэ контент нэмсэн", cms_reset: "Контентын өөрчлөлтийг буцаасан",
  service_approve: "Үйлчилгээ зөвшөөрсөн", service_reject: "Үйлчилгээ татгалзсан", service_delete: "Үйлчилгээ устгасан",
  settings_theme: "Өнгөний тохиргоо хадгалсан", settings_navigation: "Цэсний тохиргоо хадгалсан",
  settings_homepage: "Нүүр хуудсын тохиргоо хадгалсан", settings_reset: "Тохиргоог анхны байдалд буцаасан",
};

// ---------- Кино саналууд (movieSuggestions) ----------
async function renderAdminSuggestions() {
  const el = document.getElementById("admin-suggestions");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  try {
    const snap = await db.collection("movieSuggestions").where("status", "==", "pending").orderBy("createdAt", "desc").get();
    if (snap.empty) { el.innerHTML = `<div class="admin-empty">Хүлээгдэж буй санал алга</div>`; return; }
    el.innerHTML = snap.docs.map(d => {
      const s = d.data();
      return `<div class="admin-card">
        <div class="admin-card-main">
          <strong>${escapeHtml(s.title)}</strong> (${escapeHtml(s.year)}) — ⭐ ${escapeHtml(s.rating)}
          <div class="admin-card-meta">Санал болгосон: ${escapeHtml(s.submittedByName || "?")}</div>
          <div class="admin-card-desc">${escapeHtml(s.desc || "")}</div>
        </div>
        <div class="admin-card-actions">
          <button class="btn btn-primary" type="button" onclick="approveSuggestion('${d.id}')">✓ Зөвшөөрөх</button>
          <button class="btn btn-outline" type="button" onclick="rejectSuggestion('${d.id}')">✕ Татгалзах</button>
        </div>
      </div>`;
    }).join("");
  } catch (e) {
    el.innerHTML = `<div class="admin-empty">Ачаалахад алдаа гарлаа: ${escapeHtml(e.message)}</div>`;
  }
}

async function approveSuggestion(id) {
  try {
    const ref = db.collection("movieSuggestions").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return;
    const s = snap.data();
    const { submittedBy, submittedByName, status, createdAt, ...movieData } = s;
    movieData.dateAdded = new Date().toISOString().slice(0, 10);
    movieData.trending = false;
    await db.collection("movies").add(movieData);
    await ref.update({ status: "approved" });
    logAdminAction("suggestion_approve", id, s.title);
    showToast("✅ Кино каталогт нэмэгдлээ");
    renderAdminSuggestions();
  } catch (e) {
    showToast("⚠️ Алдаа гарлаа: " + e.message);
  }
}

async function rejectSuggestion(id) {
  try {
    await db.collection("movieSuggestions").doc(id).update({ status: "rejected" });
    logAdminAction("suggestion_reject", id);
    showToast("Санал татгалзагдлаа");
    renderAdminSuggestions();
  } catch (e) {
    showToast("⚠️ Алдаа гарлаа: " + e.message);
  }
}

// ---------- Кино каталог (movies) шууд CRUD ----------
async function renderAdminMovies() {
  const el = document.getElementById("admin-movies");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>` + adminAddMovieFormHtml();
  try {
    const snap = await db.collection("movies").orderBy("dateAdded", "desc").get();
    const list = snap.docs.map(d => ({ _dbId: d.id, ...d.data() }));
    const listHtml = list.length
      ? list.map(m => `<div class="admin-card">
          <div class="admin-card-main"><strong>${escapeHtml(m.title)}</strong> (${escapeHtml(m.year)}) — ⭐ ${escapeHtml(m.rating)}</div>
          <div class="admin-card-actions">
            <button class="btn btn-outline" style="border-color:#ef4444;color:#ef4444" type="button" onclick="adminDeleteMovieRow('${m._dbId}')">🗑 Устгах</button>
          </div>
        </div>`).join("")
      : `<div class="admin-empty">Firestore-д admin-аар нэмсэн кино алга (суурь каталог тусдаа код дотор байгаа)</div>`;
    document.getElementById("adminMoviesList").innerHTML = listHtml;
  } catch (e) {
    document.getElementById("adminMoviesList").innerHTML = `<div class="admin-empty">Алдаа: ${escapeHtml(e.message)}</div>`;
  }
}

function adminAddMovieFormHtml() {
  return `
    <div class="admin-add-form">
      <h4>+ Кино шууд нэмэх (шууд каталогт орно)</h4>
      <div class="add-movie-grid">
        <input class="cinema-input" id="admTitle" placeholder="Нэр">
        <input class="cinema-input" id="admYear" placeholder="Он">
        <input class="cinema-input" id="admRating" placeholder="Рейтинг">
        <input class="cinema-input" id="admPoster" placeholder="Poster URL" style="grid-column:1/-1">
        <input class="cinema-input" id="admGenres" placeholder="Genres (romantic, drama...)">
        <input class="cinema-input" id="admWatchUrl" placeholder="Watch URL">
        <textarea class="cinema-input" id="admDesc" placeholder="Тайлбар" style="grid-column:1/-1"></textarea>
      </div>
      <button class="btn btn-primary" type="button" onclick="adminAddMovieDirect()">✓ Каталогт нэмэх</button>
      <div id="adminMoviesList" style="margin-top:16px;"></div>
    </div>`;
}

async function adminAddMovieDirect() {
  const title = document.getElementById("admTitle").value.trim();
  if (!title) return showToast("⚠️ Нэр оруулна уу");
  const genres = document.getElementById("admGenres").value.split(",").map(g=>g.trim()).filter(Boolean);
  const movie = {
    emoji: "🎬", title,
    year: document.getElementById("admYear").value || "2024",
    rating: document.getElementById("admRating").value || "7.0",
    poster: document.getElementById("admPoster").value.trim(),
    watchUrl: document.getElementById("admWatchUrl").value.trim(),
    genres: genres.length ? genres : ["drama"],
    desc: document.getElementById("admDesc").value.trim(),
    lang: "dubbed", trending: false,
    dateAdded: new Date().toISOString().slice(0, 10),
  };
  const dbId = await saveMovieToFirebase(movie);
  if (dbId) { logAdminAction("movie_add", dbId, title); showToast("✅ Нэмэгдлээ"); renderAdminMovies(); }
  else showToast("⚠️ Алдаа гарлаа");
}

async function adminDeleteMovieRow(dbId) {
  if (!confirm("Устгах уу?")) return;
  await deleteMovieFromFirebase(dbId);
  logAdminAction("movie_delete", dbId);
  showToast("🗑 Устгагдлаа");
  renderAdminMovies();
}

// ---------- Community post moderation ----------
async function renderAdminPosts() {
  const el = document.getElementById("admin-posts");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  try {
    const snap = await db.collection("posts").orderBy("createdAt", "desc").limit(50).get();
    if (snap.empty) { el.innerHTML = `<div class="admin-empty">Пост алга</div>`; return; }
    el.innerHTML = snap.docs.map(d => {
      const p = d.data();
      return `<div class="admin-card">
        <div class="admin-card-main"><strong>${escapeHtml(p.authorName)}</strong>${p.hidden ? ' <span style="color:var(--text-lighter)">(нуугдсан)</span>' : ''}: ${escapeHtml((p.content||"").slice(0,120))}
          <div class="admin-card-meta">❤️ ${p.likeCount||0} · 💬 ${p.commentCount||0}</div>
        </div>
        <div class="admin-card-actions">
          <button class="btn btn-outline" type="button" onclick="adminTogglePostHidden('${d.id}', ${!p.hidden})">${p.hidden ? "Харуулах" : "Нуух"}</button>
          <button class="btn btn-outline" style="border-color:#ef4444;color:#ef4444" type="button" onclick="adminDeletePost('${d.id}')">🗑 Устгах</button>
        </div>
      </div>`;
    }).join("");
  } catch (e) {
    el.innerHTML = `<div class="admin-empty">Алдаа: ${escapeHtml(e.message)}</div>`;
  }
}

async function adminTogglePostHidden(id, hidden) {
  try {
    await db.collection("posts").doc(id).update({ hidden });
    logAdminAction(hidden ? "post_hide" : "post_unhide", id);
    renderAdminPosts();
  } catch (e) {
    showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || ""));
  }
}

async function adminDeletePost(id) {
  if (!confirm("Энэ постыг устгах уу?")) return;
  try {
    await db.collection("posts").doc(id).delete();
    logAdminAction("post_delete", id);
    showToast("🗑 Пост устгагдлаа");
    renderAdminPosts();
  } catch (e) {
    showToast("⚠️ Устгахад алдаа гарлаа: " + (e.message || e.code || ""));
  }
}

// ---------- Comment moderation ----------
async function renderAdminComments() {
  const el = document.getElementById("admin-comments");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  try {
    const snap = await db.collection("comments").orderBy("createdAt", "desc").limit(50).get();
    if (snap.empty) { el.innerHTML = `<div class="admin-empty">Сэтгэгдэл алга</div>`; return; }
    el.innerHTML = snap.docs.map(d => {
      const c = d.data();
      return `<div class="admin-card">
        <div class="admin-card-main"><strong>${escapeHtml(c.authorName||"?")}</strong>${c.hidden ? ' <span style="color:var(--text-lighter)">(нуугдсан)</span>' : ''}: ${escapeHtml((c.text||"").slice(0,140))}
          <div class="admin-card-meta">Пост: ${escapeHtml(c.postId||"-")}</div>
        </div>
        <div class="admin-card-actions">
          <button class="btn btn-outline" type="button" onclick="adminToggleCommentHidden('${d.id}', ${!c.hidden})">${c.hidden ? "Харуулах" : "Нуух"}</button>
          <button class="btn btn-outline" style="border-color:#ef4444;color:#ef4444" type="button" onclick="adminDeleteComment('${d.id}','${c.postId||""}')">🗑 Устгах</button>
        </div>
      </div>`;
    }).join("");
  } catch (e) {
    el.innerHTML = `<div class="admin-empty">Алдаа: ${escapeHtml(e.message)}</div>`;
  }
}

async function adminToggleCommentHidden(id, hidden) {
  try {
    await db.collection("comments").doc(id).update({ hidden });
    logAdminAction(hidden ? "comment_hide" : "comment_unhide", id);
    renderAdminComments();
  } catch (e) {
    showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || ""));
  }
}

async function adminDeleteComment(id, postId) {
  if (!confirm("Энэ сэтгэгдлийг устгах уу?")) return;
  try {
    await db.collection("comments").doc(id).delete();
    if (postId) await db.collection("posts").doc(postId).update({ commentCount: firebase.firestore.FieldValue.increment(-1) });
    logAdminAction("comment_delete", id);
    showToast("🗑 Сэтгэгдэл устгагдлаа");
    renderAdminComments();
  } catch (e) {
    showToast("⚠️ Устгахад алдаа гарлаа: " + (e.message || e.code || ""));
  }
}

// ---------- Reports / moderation queue ----------
const ADMIN_REPORT_STATUS_LABELS = { pending: "Хүлээгдэж буй", resolved: "Шийдвэрлэсэн", dismissed: "Татгалзсан" };

async function renderAdminReports() {
  const el = document.getElementById("admin-reports");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  try {
    // No orderBy alongside the equality filter — avoids needing a composite index (report
    // volume is always small enough to sort client-side, same reasoning as banners).
    const snap = await db.collection("reports").where("status", "==", "pending").get();
    const list = snap.docs.map(d => ({ _dbId: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0));
    if (!list.length) { el.innerHTML = `<div class="admin-empty">Хүлээгдэж буй гомдол алга</div>`; return; }
    el.innerHTML = list.map(r => `
      <div class="admin-card">
        <div class="admin-card-main">
          <strong>${r.targetType === "post" ? "📝 Пост" : "💬 Сэтгэгдэл"}</strong> — мэдэгдсэн: ${escapeHtml(r.reporterName || "?")}
          <div class="admin-card-desc">"${escapeHtml(r.contentPreview || "(агуулга алга/устгагдсан)")}"</div>
          ${r.reason ? `<div class="admin-card-meta">Шалтгаан: ${escapeHtml(r.reason)}</div>` : ""}
        </div>
        <div class="admin-card-actions">
          <button class="btn btn-outline" type="button" onclick="adminResolveReport('${r._dbId}','${r.targetType}','${r.targetId}',${r.postId ? `'${r.postId}'` : "null"},'hide')">Нуух</button>
          <button class="btn btn-outline" style="border-color:#ef4444;color:#ef4444" type="button" onclick="adminResolveReport('${r._dbId}','${r.targetType}','${r.targetId}',${r.postId ? `'${r.postId}'` : "null"},'delete')">🗑 Устгах</button>
          <button class="btn btn-outline" type="button" onclick="adminResolveReport('${r._dbId}','${r.targetType}','${r.targetId}',${r.postId ? `'${r.postId}'` : "null"},'dismiss')">Татгалзах</button>
        </div>
      </div>`).join("");
  } catch (e) {
    el.innerHTML = `<div class="admin-empty">Алдаа: ${escapeHtml(e.message)}</div>`;
  }
}

async function adminResolveReport(reportId, targetType, targetId, postId, action) {
  try {
    if (action === "hide") {
      await db.collection(targetType === "post" ? "posts" : "comments").doc(targetId).update({ hidden: true });
    } else if (action === "delete") {
      await db.collection(targetType === "post" ? "posts" : "comments").doc(targetId).delete();
      if (targetType === "comment" && postId) await db.collection("posts").doc(postId).update({ commentCount: firebase.firestore.FieldValue.increment(-1) });
    }
    await db.collection("reports").doc(reportId).update({
      status: action === "dismiss" ? "dismissed" : "resolved",
      resolvedAt: firebase.firestore.FieldValue.serverTimestamp(),
      resolvedBy: currentUser.uid,
    });
    logAdminAction("report_" + action, reportId, targetType + ":" + targetId);
    showToast("✅ Шийдвэрлэгдлээ");
    renderAdminReports();
  } catch (e) {
    showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || ""));
  }
}

// ---------- User management (+ owner-only admin grant/revoke) ----------
let adminUsersCache = [];
let adminUserQuery = "";

async function renderAdminUsers() {
  const el = document.getElementById("admin-users");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  try {
    const usersSnap = await db.collection("users").orderBy("createdAt", "desc").limit(100).get();
    // usersSnap-аас ТУСАД нь татаж байгаа нь санаатай: эрхийн тэмдэг/товч бол нэмэлт
    // боломж — энэ нь ямар ч шалтгаанаар унасан ч хэрэглэгчийн жагсаалт өөрөө
    // (зөвхөн тэмдэггүйгээр) хэвийн харагдах ёстой.
    let adminsSnap = null;
    try { adminsSnap = await db.collection("admins").get(); }
    catch (e) { console.warn("admins list fetch failed:", e); }
    const adminMap = {};
    if (adminsSnap) adminsSnap.docs.forEach(d => { adminMap[d.id] = d.data(); });

    adminUsersCache = usersSnap.docs.map(d => Object.assign({ uid: d.id }, d.data(), { _role: (adminMap[d.id] || {}).role || null }));
    renderAdminUsersList();
  } catch (e) {
    el.innerHTML = `<div class="admin-empty">Алдаа: ${escapeHtml(e.message)}</div>`;
  }
}

function adminFilterUsers(q) { adminUserQuery = (q || "").trim().toLowerCase(); renderAdminUsersList(); }

function renderAdminUsersList() {
  const el = document.getElementById("admin-users");
  const q = adminUserQuery;
  const list = q
    ? adminUsersCache.filter(u => (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || u.uid.toLowerCase().includes(q))
    : adminUsersCache;

  const rows = list.map(u => {
    const role = u._role;
    const roleBadge = role ? ` <span class="admin-role-badge admin-role-${role}">${NB_ROLE_LABELS[role]}</span>` : "";
    // Товч бүрийг nbCan* -аар шалгаж зурна. Энэ нь зөвхөн UI — бодит хориг rules дээр.
    const canManage = nbCanManageUserWithRole(role);
    const actions = [];
    if (canManage && nbCan("users.ban")) {
      actions.push(`<button class="btn btn-outline btn-sm" type="button" onclick="toggleUserBan('${u.uid}', ${!u.banned})">${u.banned ? "✓ Хориг арилгах" : "🚫 Хориглох"}</button>`);
    }
    if (role === null && nbCanAssignRole("moderator")) {
      actions.push(`<button class="btn btn-outline btn-sm" type="button" onclick="adminSetRole('${u.uid}','moderator')">🔍 Moderator болгох</button>`);
    }
    if (role === null && nbCanAssignRole("admin")) {
      actions.push(`<button class="btn btn-outline btn-sm" type="button" onclick="adminSetRole('${u.uid}','admin')">🛡️ Admin болгох</button>`);
    }
    if (role === "moderator" && nbCanAssignRole("moderator")) {
      if (nbCanAssignRole("admin")) actions.push(`<button class="btn btn-outline btn-sm" type="button" onclick="adminSetRole('${u.uid}','admin')">⬆ Admin болгох</button>`);
      actions.push(`<button class="btn btn-outline btn-sm" type="button" onclick="adminRevokeRole('${u.uid}','moderator')">Эрх хасах</button>`);
    }
    if (role === "admin" && nbCanAssignRole("admin")) {
      actions.push(`<button class="btn btn-outline btn-sm" type="button" onclick="adminRevokeRole('${u.uid}','admin')">Admin эрх хасах</button>`);
    }
    return `<div class="admin-card">
      <div class="admin-card-main">
        <strong>${escapeHtml(u.name || "(нэргүй)")}</strong>${roleBadge} ${u.banned ? '<span style="color:#ef4444">(хориглосон)</span>' : ""}
        <div class="admin-card-meta">${escapeHtml(u.email || "")} · uid: ${escapeHtml(u.uid)}</div>
      </div>
      <div class="admin-card-actions">${actions.join("")}</div>
    </div>`;
  }).join("");

  const note = nbRole() === "owner"
    ? "Та Owner тул Admin болон Moderator эрх олгож/хасч чадна. Owner эрхийг хэн ч (та өөрөө ч) хасах боломжгүй."
    : nbRole() === "admin"
      ? "Та зөвхөн Moderator эрх олгож/хасч чадна. Admin эрх олгох нь зөвхөн Owner-т байна."
      : "Та зөвхөн харах эрхтэй.";

  el.innerHTML = `
    <div class="admin-note">${escapeHtml(note)}</div>
    <input class="admin-search" type="search" placeholder="Нэр, имэйл, uid-аар хайх..." value="${escapeHtml(adminUserQuery)}" oninput="adminFilterUsers(this.value)" aria-label="Хэрэглэгч хайх">
    <div class="admin-list-count">${list.length} / ${adminUsersCache.length} хэрэглэгч</div>
    ${rows || `<div class="admin-empty">Тохирох хэрэглэгч олдсонгүй</div>`}`;
}

// Эрх олгох. Owner эрх ЭНД ХЭЗЭЭ Ч олгогдохгүй (зөвхөн bootstrap-аар үүсдэг).
async function adminSetRole(uid, role) {
  if (!nbCanAssignRole(role)) return showToast("⚠️ Танд энэ эрхийг олгох боломж алга");
  if (!confirm(`Энэ хэрэглэгчид ${role === "admin" ? "Admin" : "Moderator"} эрх олгох уу?`)) return;
  try {
    const userSnap = await db.collection("users").doc(uid).get();
    const u = userSnap.exists ? userSnap.data() : {};
    // Түвшин солиход эхлээд хуучныг устгана — admins/{uid} дээр in-place update
    // зориуд хаалттай (rules: allow update: if false), тиймээс үргэлж delete+create.
    try { await db.collection("admins").doc(uid).delete(); } catch (e) {}
    await db.collection("admins").doc(uid).set({
      email: u.email || "", name: u.name || "", role,
      addedBy: currentUser.uid, addedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    logAdminAction(role === "admin" ? "admin_grant" : "moderator_grant", uid, u.name || "");
    showToast("✅ Эрх олгогдлоо");
    renderAdminUsers();
  } catch (e) {
    showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || ""));
  }
}

async function adminRevokeRole(uid, role) {
  if (!nbCanAssignRole(role)) return showToast("⚠️ Танд энэ эрхийг хасах боломж алга");
  if (!confirm("Энэ хэрэглэгчийн эрхийг хасах уу?")) return;
  try {
    await db.collection("admins").doc(uid).delete();
    logAdminAction(role === "admin" ? "admin_revoke" : "moderator_revoke", uid);
    showToast("✅ Эрх хасагдлаа");
    renderAdminUsers();
  } catch (e) {
    showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || ""));
  }
}

async function toggleUserBan(uid, banned) {
  try {
    await db.collection("users").doc(uid).update({ banned });
    logAdminAction(banned ? "user_ban" : "user_unban", uid);
    showToast(banned ? "🚫 Хэрэглэгч түдгэлзүүлэгдлээ" : "✅ Хориг арилгагдлаа");
    renderAdminUsers();
  } catch (e) {
    showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || ""));
  }
}

// ---------- Ad/promo banners (нүүр хуудасны дээд хэсэг) ----------
// Байршил бүр нийтийн хуудсанд БОДИТООР байгаа slot-той тохирно. Шинэ байршил
// нэмэхдээ тухайн хуудсанд slot-ыг нь мөн нэмэх ёстой — эс бөгөөс сонгож болох ч
// хэзээ ч харагдахгүй "хуурамч" сонголт болно.
const ADMIN_BANNER_PLACEMENTS = [
  { id: "home-top", label: "Нүүр хуудасны дээд хэсэг" },
];

async function renderAdminBanners() {
  const el = document.getElementById("admin-banners");
  el.innerHTML = adminAddBannerFormHtml() + `<div id="adminBannersList"><div class="admin-loading">Ачаалж байна...</div></div>`;
  try {
    const snap = await db.collection("banners").orderBy("priority", "desc").get();
    const list = snap.docs.map(d => ({ _dbId: d.id, ...d.data() }));
    const today = new Date().toISOString().slice(0, 10);
    // Үзэлт/даралтын тоог banner тус бүрээр count() -оор авна. Бүтэлгүйтвэл тухайн
    // banner-ийн статистикийг ОГТ харуулахгүй — 0 гэж худал бичихгүй.
    const stats = {};
    await Promise.all(list.map(async b => {
      const [imp, clk] = await Promise.allSettled([
        db.collection("bannerEvents").where("bannerId", "==", b._dbId).where("type", "==", "impression").count().get(),
        db.collection("bannerEvents").where("bannerId", "==", b._dbId).where("type", "==", "click").count().get(),
      ]);
      if (imp.status === "fulfilled" && clk.status === "fulfilled") {
        stats[b._dbId] = { imp: imp.value.data().count, clk: clk.value.data().count };
      }
    }));
    document.getElementById("adminBannersList").innerHTML = list.length
      ? list.map(b => {
          const expired = (b.startDate && b.startDate > today) || (b.endDate && b.endDate < today);
          const statusLabel = !b.active ? '<span style="color:var(--text-lighter)">Идэвхгүй</span>'
            : expired ? '<span style="color:#ef4444">Хугацаа дууссан/эхлээгүй</span>'
            : '<span style="color:var(--success)">Идэвхтэй</span>';
          return `<div class="admin-card">
            <img src="${escapeHtml(b.imageUrl || "")}" alt="" style="width:90px;height:44px;object-fit:cover;border-radius:6px;flex-shrink:0;background:var(--primary-extra-soft);">
            <div class="admin-card-main">
              <strong>${escapeHtml(b.title || "(гарчиггүй)")}</strong> — ${statusLabel}
              <div class="admin-card-meta">
                Байршил: ${escapeHtml((ADMIN_BANNER_PLACEMENTS.find(p => p.id === b.placement) || {}).label || b.placement || "-")}
                · Ач холбогдол: ${b.priority ?? 0}
                · ${escapeHtml(b.startDate || "хугацаагүй")} – ${escapeHtml(b.endDate || "хугацаагүй")}
              </div>
              ${stats[b._dbId] ? `<div class="admin-card-meta">👁 ${stats[b._dbId].imp} үзэлт · 🖱 ${stats[b._dbId].clk} даралт${stats[b._dbId].imp ? " · CTR " + ((stats[b._dbId].clk / stats[b._dbId].imp) * 100).toFixed(1) + "%" : ""}</div>` : ""}
            </div>
            <div class="admin-card-actions">
              <button class="btn btn-outline" type="button" onclick="adminToggleBannerActive('${b._dbId}', ${!b.active})">${b.active ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}</button>
              <button class="btn btn-outline" style="border-color:#ef4444;color:#ef4444" type="button" onclick="adminDeleteBanner('${b._dbId}')">🗑 Устгах</button>
            </div>
          </div>`;
        }).join("")
      : `<div class="admin-empty">Одоогоор banner алга</div>`;
  } catch (e) {
    document.getElementById("adminBannersList").innerHTML = `<div class="admin-empty">Алдаа: ${escapeHtml(e.message)}</div>`;
  }
}

function adminAddBannerFormHtml() {
  return `
    <div class="admin-add-form">
      <h4>+ Шинэ banner нэмэх</h4>
      <div class="add-movie-grid">
        <div class="form-group" style="grid-column:1/-1"><label>Гарчиг</label><input type="text" id="admBnrTitle" placeholder="Дотоод тэмдэглэл / alt текст"></div>
        <div class="form-group" style="grid-column:1/-1"><label>Дарахад очих URL</label><input type="text" id="admBnrUrl" placeholder="https://..."></div>
        <div class="form-group"><label>Эхлэх огноо</label><input type="date" id="admBnrStart"></div>
        <div class="form-group"><label>Дуусах огноо</label><input type="date" id="admBnrEnd"></div>
        <div class="form-group"><label>Байршил</label><select id="admBnrPlacement">${ADMIN_BANNER_PLACEMENTS.map(p => `<option value="${p.id}">${escapeHtml(p.label)}</option>`).join("")}</select></div>
        <div class="form-group"><label>Ач холбогдол (том тоо → түрүүлж харагдана)</label><input type="number" id="admBnrPriority" value="0"></div>
        <div class="form-group"><label>Зураг (desktop, өргөн)</label><input type="file" id="admBnrImageDesktop" accept="image/*"></div>
        <div class="form-group"><label>Зураг (mobile, сонголтоор)</label><input type="file" id="admBnrImageMobile" accept="image/*"></div>
        <div class="form-group" style="grid-column:1/-1"><label><input type="checkbox" id="admBnrActive" checked style="width:auto;display:inline-block;margin-right:6px;"> Идэвхтэй (шууд харагдана)</label></div>
      </div>
      <div id="admBnrStatus" style="min-height:18px;font-size:13px;margin-bottom:8px;"></div>
      <button class="btn btn-primary" type="button" id="admBnrSaveBtn" onclick="adminAddBanner()">✓ Banner нэмэх</button>
    </div>`;
}

async function adminAddBanner() {
  const title = document.getElementById("admBnrTitle").value.trim();
  const targetUrl = document.getElementById("admBnrUrl").value.trim();
  const startDate = document.getElementById("admBnrStart").value || null;
  const endDate = document.getElementById("admBnrEnd").value || null;
  const placement = document.getElementById("admBnrPlacement").value;
  const priority = parseInt(document.getElementById("admBnrPriority").value, 10) || 0;
  const active = document.getElementById("admBnrActive").checked;
  const desktopFile = document.getElementById("admBnrImageDesktop").files[0];
  const mobileFile = document.getElementById("admBnrImageMobile").files[0];
  const statusEl = document.getElementById("admBnrStatus");
  const saveBtn = document.getElementById("admBnrSaveBtn");

  if (!desktopFile) return showToast("⚠️ Desktop зураг заавал сонгоно уу");
  if (startDate && endDate && startDate > endDate) return showToast("⚠️ Эхлэх огноо дуусах огнооноос хойш байж болохгүй");

  saveBtn.disabled = true;
  statusEl.textContent = "Байршуулж байна...";
  try {
    const stamp = Date.now();
    const desktopBlob = await compressImage(desktopFile, 1920, 600, 0.85);
    const imageUrl = await uploadBlobToStorage(`banners/${stamp}_desktop.jpg`, desktopBlob);
    let mobileImageUrl = "";
    if (mobileFile) {
      mobileImageUrl = await uploadBlobToStorage(`banners/${stamp}_mobile.jpg`, await compressImage(mobileFile, 900, 900, 0.85));
    }
    await db.collection("banners").add({
      title, targetUrl, startDate, endDate, placement, priority, active,
      imageUrl, mobileImageUrl,
      createdBy: currentUser.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    statusEl.textContent = "";
    logAdminAction("banner_add", stamp + "", title);
    showToast("✅ Banner нэмэгдлээ");
    renderAdminBanners();
  } catch (e) {
    statusEl.textContent = "⚠️ Алдаа гарлаа: " + (e.message || e.code || "Тодорхойгүй алдаа");
    console.warn("adminAddBanner error:", e);
  } finally {
    saveBtn.disabled = false;
  }
}

async function adminToggleBannerActive(id, active) {
  try {
    await db.collection("banners").doc(id).update({ active });
    logAdminAction("banner_toggle", id, active ? "active" : "inactive");
    renderAdminBanners();
  } catch (e) {
    showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || ""));
  }
}

async function adminDeleteBanner(id) {
  if (!confirm("Энэ banner-ийг устгах уу?")) return;
  try {
    await db.collection("banners").doc(id).delete();
    logAdminAction("banner_delete", id);
    showToast("🗑 Banner устгагдлаа");
    renderAdminBanners();
  } catch (e) {
    showToast("⚠️ Устгахад алдаа гарлаа: " + (e.message || e.code || ""));
  }
}

// ---------- Overview (dashboard home) ----------
// Promise.allSettled (NOT Promise.all): one collection's count failing — e.g. a brand-new
// collection whose rules haven't been published yet — must show "-" for THAT stat, not
// blank the whole Overview tab. Each stat degrades independently.
//
// Бүх тоо БОДИТ эх сурвалжаас гарна: Firestore-ийн count() aggregation, эсвэл ачаалагдсан
// dataset-ийн урт. Ямар ч тоо hardcode хийгээгүй, санаа зохиогоогүй.

// Тухайн хуудсанд ачаалагдсан dataset-ээс контентын хэмжээг тооцно. Хэрэв ямар нэг
// dataset ачаалагдаагүй бол тэр мөрийг ОГТ харуулахгүй (0 гэж худал бичихгүй).
function adminContentCounts() {
  const out = [];
  if (typeof allUbIdeas !== "undefined") out.push(["УБ 365 санаа", allUbIdeas.length]);
  if (typeof aimagsClean !== "undefined") {
    out.push(["Аймаг", aimagsClean.length]);
    out.push(["Онцлох газар", aimagsClean.reduce((n, a) => n + (a.wonders ? a.wonders.length : 0), 0)]);
    out.push(["Аймгийн санаа", aimagsClean.reduce((n, a) => n + (a.dates ? a.dates.length : 0), 0)]);
  }
  if (typeof gifts !== "undefined") out.push(["Бэлэг", gifts.length]);
  return out;
}

async function renderAdminOverview() {
  const el = document.getElementById("admin-overview");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;

  const counts = [
    ["Хэрэглэгч", "users", () => db.collection("users").count().get(), "users"],
    ["Пост", "posts", () => db.collection("posts").count().get(), "posts"],
    ["Сэтгэгдэл", "comments", () => db.collection("comments").count().get(), "comments"],
    ["Нэмсэн кино", "movies", () => db.collection("movies").count().get(), "movies"],
    ["Хадгалсан санаа", "saved", () => db.collection("saved").count().get(), null],
    ["Урилга", "invites", () => db.collection("invites").count().get(), "invites"],
  ];
  const pending = [
    ["🎬", "хүлээгдэж буй кино санал", "suggestions", () => db.collection("movieSuggestions").where("status", "==", "pending").count().get()],
    ["🚩", "хүлээгдэж буй гомдол", "reports", () => db.collection("reports").where("status", "==", "pending").count().get()],
    ["🏪", "хянагдаагүй үйлчилгээ", "services", () => db.collection("services").where("status", "==", "pending").count().get()],
  ];

  const [countRes, pendingRes, bannerRes, logRes] = await Promise.all([
    Promise.allSettled(counts.map(c => c[2]())),
    Promise.allSettled(pending.map(p => p[3]())),
    Promise.allSettled([db.collection("banners").where("active", "==", true).count().get()]),
    Promise.allSettled([db.collection("adminLog").orderBy("createdAt", "desc").limit(5).get()]),
  ]);

  const statsHtml = counts.map(([label, , , tab], i) => {
    const r = countRes[i];
    const val = r.status === "fulfilled" ? r.value.data().count.toLocaleString("mn-MN") : "-";
    const clickable = tab && nbCan(adminTabById(tab) ? adminTabById(tab).perm : "");
    return `<div class="admin-stat${clickable ? " admin-stat-link" : ""}"${clickable ? ` role="button" tabindex="0" onclick="showAdminTab('${tab}')"` : ""}>
      <div class="admin-stat-num">${val}</div><div class="admin-stat-label">${escapeHtml(label)}</div></div>`;
  }).join("");

  const activeBanners = bannerRes[0].status === "fulfilled" ? bannerRes[0].value.data().count : null;

  // "Анхаарал шаардсан" — зөвхөн БОДИТООР хүлээгдэж буй зүйл байвал л гарна.
  const todo = pending.map(([icon, label, tab], i) => {
    const r = pendingRes[i];
    if (r.status !== "fulfilled") return null;
    const n = r.value.data().count;
    if (!n) return null;
    const t = adminTabById(tab);
    if (!t || !nbCan(t.perm)) return null;
    return `<button type="button" class="admin-todo" onclick="showAdminTab('${tab}')">
      <span class="admin-todo-ico" aria-hidden="true">${icon}</span>
      <span><strong>${n}</strong> ${escapeHtml(label)}</span><span class="admin-todo-arrow" aria-hidden="true">→</span></button>`;
  }).filter(Boolean);

  const contentRows = adminContentCounts();
  const contentHtml = contentRows.length ? `
    <section class="admin-section">
      <h3 class="admin-section-title">Сайтын контент</h3>
      <div class="admin-stats-grid">
        ${contentRows.map(([l, n]) => `<div class="admin-stat"><div class="admin-stat-num">${n.toLocaleString("mn-MN")}</div><div class="admin-stat-label">${escapeHtml(l)}</div></div>`).join("")}
      </div>
      <p class="admin-section-note">Эдгээр тоо ачаалагдсан өгөгдлөөс шууд гарч байна. Нуух / дараалал солих / засахыг «Контент удирдлага» хэсгээс хийнэ.</p>
    </section>` : "";

  const logSnap = logRes[0].status === "fulfilled" ? logRes[0].value : null;
  const recentHtml = (logSnap && !logSnap.empty && nbCan("audit.read")) ? `
    <section class="admin-section">
      <h3 class="admin-section-title">Сүүлийн үйл ажиллагаа</h3>
      <div class="admin-recent">
        ${logSnap.docs.map(d => { const l = d.data(); return `<div class="admin-recent-row">
          <strong>${escapeHtml(l.actorName || "?")}</strong>
          <span>${escapeHtml(ADMIN_ACTION_LABELS[l.action] || l.action)}</span>
          <time>${timeAgo(l.createdAt)}</time></div>`; }).join("")}
      </div>
      <button type="button" class="btn btn-outline btn-sm" onclick="showAdminTab('activity')">Бүх түүхийг харах</button>
    </section>` : "";

  const anyFailed = countRes.some(r => r.status === "rejected") || pendingRes.some(r => r.status === "rejected");

  el.innerHTML = `
    <div class="admin-welcome">
      <h2>Сайн байна уу, ${escapeHtml(currentUser.name || "")}</h2>
      <p>Таны эрх: <strong>${NB_ROLE_LABELS[nbRole()] || "—"}</strong></p>
    </div>
    ${todo.length ? `<section class="admin-section"><h3 class="admin-section-title">Анхаарал шаардсан</h3><div class="admin-todo-list">${todo.join("")}</div></section>`
      : `<section class="admin-section"><div class="admin-allclear">✅ Хүлээгдэж буй хүсэлт, гомдол алга — бүгд цэвэр.</div></section>`}
    <section class="admin-section">
      <h3 class="admin-section-title">Үндсэн үзүүлэлт</h3>
      <div class="admin-stats-grid">${statsHtml}
        ${activeBanners !== null ? `<div class="admin-stat admin-stat-link" role="button" tabindex="0" onclick="showAdminTab('banners')"><div class="admin-stat-num">${activeBanners}</div><div class="admin-stat-label">Идэвхтэй banner</div></div>` : ""}
      </div>
      ${anyFailed ? `<div class="admin-note" style="margin-top:14px;">⚠️ Зарим тоо ачаалагдсангүй — Firestore rules шинэчлэгдээгүй байж болзошгүй. Ачаалагдаагүй нь "-" гэж харагдана.</div>` : ""}
    </section>
    ${contentHtml}
    ${recentHtml}`;
}

// ---------- Invitations overview (read-only — senders own/manage their own invites) ----------
async function renderAdminInvites() {
  const el = document.getElementById("admin-invites");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  try {
    const snap = await db.collection("invites").orderBy("createdAt", "desc").limit(50).get();
    if (snap.empty) { el.innerHTML = `<div class="admin-empty">Урилга алга</div>`; return; }
    el.innerHTML = `<div class="admin-note">Зөвхөн харах горим — урилгыг зөвхөн үүсгэсэн эзэн нь устгах эрхтэй.</div>` +
      snap.docs.map(d => {
        const iv = d.data();
        return `<div class="admin-card">
          <div class="admin-card-main">
            <strong>${escapeHtml(iv.type || "?")}</strong> — ${escapeHtml(iv.senderName || "?")}
            <div class="admin-card-meta">Төлөв: ${escapeHtml(iv.status || "-")} · ${timeAgo(iv.createdAt)}</div>
          </div>
        </div>`;
      }).join("");
  } catch (e) {
    el.innerHTML = `<div class="admin-empty">Алдаа: ${escapeHtml(e.message)}</div>`;
  }
}

// ---------- Activity log (append-only audit trail of admin actions) ----------
async function renderAdminActivity() {
  const el = document.getElementById("admin-activity");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  try {
    const snap = await db.collection("adminLog").orderBy("createdAt", "desc").limit(100).get();
    if (snap.empty) { el.innerHTML = `<div class="admin-empty">Үйл ажиллагааны түүх алга</div>`; return; }
    el.innerHTML = snap.docs.map(d => {
      const l = d.data();
      return `<div class="admin-card">
        <div class="admin-card-main">
          <strong>${escapeHtml(l.actorName || "?")}</strong> — ${escapeHtml(ADMIN_ACTION_LABELS[l.action] || l.action)}
          <div class="admin-card-meta">${l.extra ? escapeHtml(l.extra) + " · " : ""}${l.targetId ? "ID: " + escapeHtml(l.targetId) + " · " : ""}${timeAgo(l.createdAt)}</div>
        </div>
      </div>`;
    }).join("");
  } catch (e) {
    el.innerHTML = `<div class="admin-empty">Алдаа: ${escapeHtml(e.message)}</div>`;
  }
}
