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
    gate.innerHTML = `<div class="admin-denied">⛔ Танд админ эрх байхгүй байна.</div>`;
    gate.style.display = "block"; panel.style.display = "none";
    return false;
  }
  gate.style.display = "none"; panel.style.display = "block";
  return true;
}

function initAdminDashboard() {
  if (!checkAdminAccess()) return;
  showAdminTab("suggestions");
}

function showAdminTab(tab) {
  document.querySelectorAll(".admin-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
  document.querySelectorAll(".admin-tab-content").forEach(c => c.style.display = c.id === "admin-" + tab ? "block" : "none");
  if (tab === "suggestions") renderAdminSuggestions();
  else if (tab === "movies") renderAdminMovies();
  else if (tab === "posts") renderAdminPosts();
  else if (tab === "users") renderAdminUsers();
  else if (tab === "analytics") renderAdminAnalytics();
}

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
    showToast("✅ Кино каталогт нэмэгдлээ");
    renderAdminSuggestions();
  } catch (e) {
    showToast("⚠️ Алдаа гарлаа: " + e.message);
  }
}

async function rejectSuggestion(id) {
  try {
    await db.collection("movieSuggestions").doc(id).update({ status: "rejected" });
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
  if (dbId) { showToast("✅ Нэмэгдлээ"); renderAdminMovies(); }
  else showToast("⚠️ Алдаа гарлаа");
}

async function adminDeleteMovieRow(dbId) {
  if (!confirm("Устгах уу?")) return;
  await deleteMovieFromFirebase(dbId);
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
        <div class="admin-card-main"><strong>${escapeHtml(p.authorName)}</strong>: ${escapeHtml((p.content||"").slice(0,120))}
          <div class="admin-card-meta">❤️ ${p.likeCount||0} · 💬 ${p.commentCount||0}</div>
        </div>
        <div class="admin-card-actions">
          <button class="btn btn-outline" style="border-color:#ef4444;color:#ef4444" type="button" onclick="adminDeletePost('${d.id}')">🗑 Устгах</button>
        </div>
      </div>`;
    }).join("");
  } catch (e) {
    el.innerHTML = `<div class="admin-empty">Алдаа: ${escapeHtml(e.message)}</div>`;
  }
}

async function adminDeletePost(id) {
  if (!confirm("Энэ постыг устгах уу?")) return;
  await db.collection("posts").doc(id).delete();
  showToast("🗑 Пост устгагдлаа");
  renderAdminPosts();
}

// ---------- User management ----------
async function renderAdminUsers() {
  const el = document.getElementById("admin-users");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  try {
    const snap = await db.collection("users").orderBy("createdAt", "desc").limit(100).get();
    const rows = snap.docs.map(d => {
      const u = d.data();
      return `<div class="admin-card">
        <div class="admin-card-main">
          <strong>${escapeHtml(u.name)}</strong> ${u.banned ? '<span style="color:#ef4444">(хориглосон)</span>' : ''}
          <div class="admin-card-meta">${escapeHtml(u.email||"")} · uid: ${d.id}</div>
        </div>
        <div class="admin-card-actions">
          <button class="btn btn-outline" type="button" onclick="toggleUserBan('${d.id}', ${!u.banned})">${u.banned ? '✓ Хориг арилгах' : '🚫 Хориглох'}</button>
        </div>
      </div>`;
    }).join("");
    el.innerHTML = `<div class="admin-note">Шинэ админ нэмэхийг зөвхөн Firebase Console-с <code>admins/{uid}</code> баримт үүсгэж хийнэ (аюулгүй байдлын үүднээс dashboard-оос боломжгүй).</div>` + rows;
  } catch (e) {
    el.innerHTML = `<div class="admin-empty">Алдаа: ${escapeHtml(e.message)}</div>`;
  }
}

async function toggleUserBan(uid, banned) {
  await db.collection("users").doc(uid).update({ banned });
  showToast(banned ? "🚫 Хэрэглэгч хориглогдлоо" : "✅ Хориг арилгагдлаа");
  renderAdminUsers();
}

// ---------- Analytics ----------
async function renderAdminAnalytics() {
  const el = document.getElementById("admin-analytics");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  try {
    const [users, posts, comments, movies, saved] = await Promise.all([
      db.collection("users").count().get(),
      db.collection("posts").count().get(),
      db.collection("comments").count().get(),
      db.collection("movies").count().get(),
      db.collection("saved").count().get(),
    ]);
    el.innerHTML = `
      <div class="admin-stats-grid">
        <div class="admin-stat"><div class="admin-stat-num">${users.data().count}</div><div class="admin-stat-label">Хэрэглэгч</div></div>
        <div class="admin-stat"><div class="admin-stat-num">${posts.data().count}</div><div class="admin-stat-label">Пост</div></div>
        <div class="admin-stat"><div class="admin-stat-num">${comments.data().count}</div><div class="admin-stat-label">Сэтгэгдэл</div></div>
        <div class="admin-stat"><div class="admin-stat-num">${movies.data().count}</div><div class="admin-stat-label">Нэмсэн кино</div></div>
        <div class="admin-stat"><div class="admin-stat-num">${saved.data().count}</div><div class="admin-stat-label">Хадгалсан санаа</div></div>
      </div>`;
  } catch (e) {
    el.innerHTML = `<div class="admin-empty">Analytics ачаалахад алдаа гарлаа: ${escapeHtml(e.message)}<br><span style="font-size:12px">(Firestore count() aggregation дэмжигдэхгүй байж болзошгүй)</span></div>`;
  }
}
