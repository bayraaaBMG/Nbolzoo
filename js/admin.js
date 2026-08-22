// ===== ADMIN DASHBOARD =====

function checkAdminAccess() {
  const gate = document.getElementById("adminGate");
  const panel = document.getElementById("adminPanel");
  if (!currentUser) {
    gate.innerHTML = `<div class="admin-denied">🔒 Энэ хуудсанд орохын тулд эхлээд <a onclick="openAuth('login')" style="cursor:pointer;text-decoration:underline;">нэвтэрнэ үү</a>.</div>`;
    gate.style.display = "block"; panel.style.display = "none";
    return false;
  }
  if (!currentUser.isAdmin) {
    gate.innerHTML = `<div class="admin-denied">⛔ Танд админ эрх байхгүй байна.<br><a onclick="navigate('home')" style="cursor:pointer;text-decoration:underline;font-size:14px;">← Нүүр хуудас руу буцах</a></div>`;
    gate.style.display = "block"; panel.style.display = "none";
    return false;
  }
  gate.style.display = "none"; panel.style.display = "block";
  return true;
}

function initAdminDashboard() {
  if (!checkAdminAccess()) return;
  showAdminTab("overview");
}

function showAdminTab(tab) {
  document.querySelectorAll(".admin-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
  document.querySelectorAll(".admin-tab-content").forEach(c => c.style.display = c.id === "admin-" + tab ? "block" : "none");
  if (tab === "overview") renderAdminOverview();
  else if (tab === "users") renderAdminUsers();
  else if (tab === "posts") renderAdminPosts();
  else if (tab === "comments") renderAdminComments();
  else if (tab === "reports") renderAdminReports();
  else if (tab === "suggestions") renderAdminSuggestions();
  else if (tab === "banners") renderAdminBanners();
  else if (tab === "invites") renderAdminInvites();
  else if (tab === "movies") renderAdminMovies();
  else if (tab === "activity") renderAdminActivity();
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
async function renderAdminUsers() {
  const el = document.getElementById("admin-users");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  const isOwner = currentUser.adminRole === "owner";
  try {
    const [usersSnap, adminsSnap] = await Promise.all([
      db.collection("users").orderBy("createdAt", "desc").limit(100).get(),
      isOwner ? db.collection("admins").get() : Promise.resolve(null), // only the owner needs to know who else is admin (to show grant/revoke buttons)
    ]);
    const adminMap = {};
    if (adminsSnap) adminsSnap.docs.forEach(d => { adminMap[d.id] = d.data(); });
    const rows = usersSnap.docs.map(d => {
      const u = d.data();
      const adminInfo = adminMap[d.id];
      const isOwnerRow = adminInfo && adminInfo.role === "owner";
      let roleBadge = "";
      if (isOwnerRow) roleBadge = ' <span style="color:var(--gold)">👑 Owner</span>';
      else if (adminInfo) roleBadge = ' <span style="color:var(--primary)">🛡️ Admin</span>';
      let adminBtn = "";
      if (isOwner && !isOwnerRow) {
        adminBtn = adminInfo
          ? `<button class="btn btn-outline" type="button" onclick="adminRevokeAdmin('${d.id}')">🛡️ Admin эрх хасах</button>`
          : `<button class="btn btn-outline" type="button" onclick="adminGrantAdmin('${d.id}')">🛡️ Admin болгох</button>`;
      }
      return `<div class="admin-card">
        <div class="admin-card-main">
          <strong>${escapeHtml(u.name)}</strong>${roleBadge} ${u.banned ? '<span style="color:#ef4444">(хориглосон)</span>' : ''}
          <div class="admin-card-meta">${escapeHtml(u.email||"")} · uid: ${d.id}</div>
        </div>
        <div class="admin-card-actions">
          ${!isOwnerRow ? `<button class="btn btn-outline" type="button" onclick="toggleUserBan('${d.id}', ${!u.banned})">${u.banned ? '✓ Хориг арилгах' : '🚫 Хориглох'}</button>` : ''}
          ${adminBtn}
        </div>
      </div>`;
    }).join("");
    const note = isOwner
      ? `<div class="admin-note">Та үндсэн Owner тул хэрэглэгчид admin эрх олгох/хасах боломжтой. Owner эрхийг хэн ч (өөрөө оролцоод) хасах боломжгүй.</div>`
      : `<div class="admin-note">Шинэ admin нэмэх/хасах эрх зөвхөн үндсэн Owner-д байна.</div>`;
    el.innerHTML = note + rows;
  } catch (e) {
    el.innerHTML = `<div class="admin-empty">Алдаа: ${escapeHtml(e.message)}</div>`;
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

async function adminGrantAdmin(uid) {
  if (currentUser.adminRole !== "owner") return showToast("⚠️ Зөвхөн Owner шинэ admin нэмэх боломжтой");
  if (!confirm("Энэ хэрэглэгчид admin эрх олгох уу?")) return;
  try {
    const userSnap = await db.collection("users").doc(uid).get();
    const u = userSnap.exists ? userSnap.data() : {};
    await db.collection("admins").doc(uid).set({
      email: u.email || "", name: u.name || "", role: "admin",
      addedBy: currentUser.uid, addedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    logAdminAction("admin_grant", uid, u.name || "");
    showToast("✅ Admin эрх олгогдлоо");
    renderAdminUsers();
  } catch (e) {
    showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || ""));
  }
}

async function adminRevokeAdmin(uid) {
  if (currentUser.adminRole !== "owner") return showToast("⚠️ Зөвхөн Owner admin эрх хасах боломжтой");
  if (!confirm("Энэ хэрэглэгчийн admin эрхийг хасах уу?")) return;
  try {
    await db.collection("admins").doc(uid).delete();
    logAdminAction("admin_revoke", uid);
    showToast("✅ Admin эрх хасагдлаа");
    renderAdminUsers();
  } catch (e) {
    showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || ""));
  }
}

// ---------- Ad/promo banners (нүүр хуудасны дээд хэсэг) ----------
const ADMIN_BANNER_PLACEMENTS = [{ id: "home-top", label: "Нүүр хуудасны дээд хэсэг" }];

async function renderAdminBanners() {
  const el = document.getElementById("admin-banners");
  el.innerHTML = adminAddBannerFormHtml() + `<div id="adminBannersList"><div class="admin-loading">Ачаалж байна...</div></div>`;
  try {
    const snap = await db.collection("banners").orderBy("priority", "desc").get();
    const list = snap.docs.map(d => ({ _dbId: d.id, ...d.data() }));
    const today = new Date().toISOString().slice(0, 10);
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
async function renderAdminOverview() {
  const el = document.getElementById("admin-overview");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  try {
    const [users, posts, comments, movies, saved, invites, pendingSuggestions, pendingReports] = await Promise.all([
      db.collection("users").count().get(),
      db.collection("posts").count().get(),
      db.collection("comments").count().get(),
      db.collection("movies").count().get(),
      db.collection("saved").count().get(),
      db.collection("invites").count().get(),
      db.collection("movieSuggestions").where("status", "==", "pending").count().get(),
      db.collection("reports").where("status", "==", "pending").count().get(),
    ]);
    const pendingSuggCount = pendingSuggestions.data().count;
    const pendingReportCount = pendingReports.data().count;
    el.innerHTML = `
      <div class="admin-stats-grid">
        <div class="admin-stat"><div class="admin-stat-num">${users.data().count}</div><div class="admin-stat-label">Хэрэглэгч</div></div>
        <div class="admin-stat"><div class="admin-stat-num">${posts.data().count}</div><div class="admin-stat-label">Пост</div></div>
        <div class="admin-stat"><div class="admin-stat-num">${comments.data().count}</div><div class="admin-stat-label">Сэтгэгдэл</div></div>
        <div class="admin-stat"><div class="admin-stat-num">${movies.data().count}</div><div class="admin-stat-label">Нэмсэн кино</div></div>
        <div class="admin-stat"><div class="admin-stat-num">${saved.data().count}</div><div class="admin-stat-label">Хадгалсан санаа</div></div>
        <div class="admin-stat"><div class="admin-stat-num">${invites.data().count}</div><div class="admin-stat-label">Урилга</div></div>
      </div>
      ${(pendingSuggCount > 0 || pendingReportCount > 0) ? `
        <div class="admin-note" style="display:flex;gap:20px;flex-wrap:wrap;margin-top:16px;">
          ${pendingSuggCount > 0 ? `<span style="cursor:pointer;" onclick="showAdminTab('suggestions')">🎬 <strong>${pendingSuggCount}</strong> хүлээгдэж буй кино санал →</span>` : ""}
          ${pendingReportCount > 0 ? `<span style="cursor:pointer;" onclick="showAdminTab('reports')">🚩 <strong>${pendingReportCount}</strong> хүлээгдэж буй гомдол →</span>` : ""}
        </div>` : ""}`;
  } catch (e) {
    el.innerHTML = `<div class="admin-empty">Ачаалахад алдаа гарлаа: ${escapeHtml(e.message)}<br><span style="font-size:12px">(Firestore count() aggregation дэмжигдэхгүй байж болзошгүй)</span></div>`;
  }
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
