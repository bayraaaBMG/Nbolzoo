// ===== ADMIN: САЙТЫН ТОХИРГОО (өнгө / цэс / нүүр хуудас) =====
// Бүгд siteSettings/{key} баримтад хадгалагдана, нийтэд уншигдана, admin+ бичнэ.
// js/site-settings.js нь хуудас бүр дээр үүнийг уншиж хэрэгжүүлнэ.

// ---------- Өнгө / загвар ----------
// Аль хэдийн css/style.css-ийн :root дээр төвлөрсөн хувьсагчдыг л дарж бичнэ —
// шинэ өнгөний систем зохиоогүй, байгаагаа удирдаж байна.
const THEME_VARS = [
  ["--primary", "Үндсэн өнгө", "#0077B6"],
  ["--primary-dark", "Үндсэн (бараан)", "#023E8A"],
  ["--primary-light", "Үндсэн (цайвар)", "#00B4D8"],
  ["--primary-soft", "Үндсэн (зөөлөн)", "#CAF0F8"],
  ["--primary-extra-soft", "Үндсэн (маш зөөлөн)", "#E8F4F8"],
  ["--accent", "Онцлох өнгө", "#D85A30"],
  ["--accent-soft", "Онцлох (зөөлөн)", "#FAECE7"],
  ["--text", "Текст", "#1B263B"],
  ["--text-light", "Текст (цайвар)", "#5C6B7A"],
  ["--bg", "Дэвсгэр", "#F8FAFC"],
  ["--gold", "Алтан", "#FFB703"],
  ["--success", "Амжилт", "#06A77D"],
];

async function renderAdminTheme() {
  const el = document.getElementById("admin-theme");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  let saved = {};
  try {
    const snap = await db.collection("siteSettings").doc("theme").get();
    if (snap.exists) saved = snap.data().vars || {};
  } catch (e) { console.warn("theme load failed:", e); }

  el.innerHTML = `
    <div class="admin-note">Энд сонгосон өнгө сайтын бүх хуудсанд шууд үйлчилнэ. Хоосон орхивол кодод бичигдсэн анхны өнгө хэвээр үлдэнэ.</div>
    <div class="theme-grid">
      ${THEME_VARS.map(([v, label, def]) => {
        const cur = saved[v] || def;
        return `<div class="theme-row">
          <label for="thm_${v.slice(2)}">${escapeHtml(label)}</label>
          <div class="theme-inputs">
            <input type="color" id="thm_${v.slice(2)}" value="${escapeHtml(cur)}" data-var="${escapeHtml(v)}" oninput="adminThemePreview()">
            <code>${escapeHtml(v)}</code>
            ${saved[v] ? `<span class="cms-flag cms-flag-edited">өөрчилсөн</span>` : ""}
          </div>
        </div>`;
      }).join("")}
    </div>
    <div class="cms-edit-actions">
      <button class="btn btn-primary" type="button" onclick="adminSaveTheme()">✓ Хадгалах</button>
      <button class="btn btn-outline" type="button" onclick="adminResetTheme()">↺ Анхны өнгө рүү буцаах</button>
    </div>
    <p class="admin-section-note">Доорх нь урьдчилсан харагдац — хадгалах хүртэл зөвхөн энэ хуудсанд үйлчилнэ.</p>`;
  adminThemePreview();
}

// Хадгалахаас өмнө шууд харуулна — зөвхөн энэ browser, зөвхөн энэ хуудсанд.
function adminThemePreview() {
  document.querySelectorAll("#admin-theme input[type=color]").forEach(i => {
    document.documentElement.style.setProperty(i.dataset.var, i.value);
  });
}

async function adminSaveTheme() {
  if (!nbCan("settings.theme")) return showToast("⚠️ Танд энэ эрх алга");
  const vars = {};
  document.querySelectorAll("#admin-theme input[type=color]").forEach(i => {
    const def = (THEME_VARS.find(t => t[0] === i.dataset.var) || [])[2];
    // Анхны утгатай ижил бол хадгалахгүй — ингэснээр баримт цэвэр байж, дараа нь
    // кодын өнгө өөрчлөгдвөл автоматаар дагана.
    if (i.value.toLowerCase() !== String(def).toLowerCase()) vars[i.dataset.var] = i.value;
  });
  try {
    await db.collection("siteSettings").doc("theme").set({
      vars, updatedBy: currentUser.uid, updatedByName: currentUser.name,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    logAdminAction("settings_theme", "theme", Object.keys(vars).length + " өнгө");
    showToast("✅ Хадгалагдлаа");
    renderAdminTheme();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

async function adminResetTheme() {
  if (!nbCan("settings.theme")) return showToast("⚠️ Танд энэ эрх алга");
  if (!confirm("Бүх өнгийг кодод бичигдсэн анхны байдалд буцаах уу?")) return;
  try {
    await db.collection("siteSettings").doc("theme").set({
      vars: {}, updatedBy: currentUser.uid, updatedByName: currentUser.name,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    THEME_VARS.forEach(([v]) => document.documentElement.style.removeProperty(v));
    logAdminAction("settings_reset", "theme");
    showToast("↺ Анхны өнгө рүү буцлаа");
    renderAdminTheme();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

// ---------- Цэс ----------
// Цэсний бүтэц нь 11 HTML файл дотор бичигдсэн байдаг. Түүнийг бүхэлд нь Firestore руу
// нүүлгэхгүйгээр удирдах хамгийн найдвартай арга: аль хуудсыг цэснээс НУУХ, ямар
// НЭРТЭЙ харуулахыг л тохируулах. Ингэснээр цэс ачаалагдаагүй/алдаа гарсан ч
// HTML доторх анхны цэс хэвийн ажиллана.
const NAV_PAGES = [
  ["home", "Нүүр"], ["ub", "УБ 365"], ["aimags", "21 аймаг"], ["expert", "Зөвлөгөө"],
  ["urilga", "Урилга"], ["games", "Тоглоом"], ["gifts", "Бэлэг"], ["movies", "Кино"],
  ["community", "Нийгэмлэг"], ["saved", "Хадгалсан"], ["services", "Үйлчилгээ"],
];

async function renderAdminNavigation() {
  const el = document.getElementById("admin-navigation");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  let cfg = { hidden: [], labels: {} };
  try {
    const snap = await db.collection("siteSettings").doc("navigation").get();
    if (snap.exists) {
      const d = snap.data();
      cfg = { hidden: Array.isArray(d.hidden) ? d.hidden : [], labels: d.labels || {} };
    }
  } catch (e) { console.warn("navigation load failed:", e); }

  el.innerHTML = `
    <div class="admin-note">Цэсний холбоосыг нуух эсвэл нэрийг нь өөрчилнө. Нуусан хуудас цэснээс алга болох ч хаягаар нь шууд ороход хэвээр ажиллана — хуудсыг бүрэн хаадаггүй.</div>
    <div class="nav-cfg-list">
      ${NAV_PAGES.map(([key, def]) => {
        const hidden = cfg.hidden.includes(key);
        return `<div class="nav-cfg-row">
          <label class="nav-cfg-toggle">
            <input type="checkbox" id="navShow_${key}" ${hidden ? "" : "checked"}>
            <span>Харуулах</span>
          </label>
          <code>${escapeHtml(key)}</code>
          <input type="text" id="navLabel_${key}" value="${escapeHtml(cfg.labels[key] || "")}" placeholder="${escapeHtml(def)}" aria-label="${escapeHtml(def)} нэр">
        </div>`;
      }).join("")}
    </div>
    <div class="cms-edit-actions">
      <button class="btn btn-primary" type="button" onclick="adminSaveNavigation()">✓ Хадгалах</button>
    </div>`;
}

async function adminSaveNavigation() {
  if (!nbCan("settings.navigation")) return showToast("⚠️ Танд энэ эрх алга");
  const hidden = [], labels = {};
  NAV_PAGES.forEach(([key, def]) => {
    if (!document.getElementById("navShow_" + key).checked) hidden.push(key);
    const v = document.getElementById("navLabel_" + key).value.trim();
    if (v && v !== def) labels[key] = v;
  });
  try {
    await db.collection("siteSettings").doc("navigation").set({
      hidden, labels, updatedBy: currentUser.uid, updatedByName: currentUser.name,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    logAdminAction("settings_navigation", "navigation", hidden.length + " нуусан");
    showToast("✅ Хадгалагдлаа");
    renderAdminNavigation();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

// ---------- Нүүр хуудас ----------
// Нүүр хуудсын БОДИТООР байгаа хэсгүүд. Шинэ хэсэг зохиогоогүй — index.html дээр
// одоо байгаа блокуудыг л асаах/унтраах, гарчгийг нь солих боломж.
const HOME_SECTIONS = [
  ["banner", "Зар сурталчилгааны banner"],
  ["hero", "Толгой хэсэг (hero)"],
  ["howItWorks", "«Яаж ажилладаг вэ?» хэсэг"],
  ["today", "Өнөөдрийн болзоо"],
  ["budget", "Төсвөөр хайх"],
  ["mood", "Мэдрэмжээр хайх"],
  ["editorial", "Редакцын сонголт"],
  ["aimags", "Аймагт хамт явах уу?"],
  ["games", "Тоглоом / Урилга сурталчилгаа"],
];

async function renderAdminHomepage() {
  const el = document.getElementById("admin-homepage");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  let cfg = { hidden: [], heroTitle: "", heroSubtitle: "" };
  try {
    const snap = await db.collection("siteSettings").doc("homepage").get();
    if (snap.exists) {
      const d = snap.data();
      cfg = { hidden: Array.isArray(d.hidden) ? d.hidden : [], heroTitle: d.heroTitle || "", heroSubtitle: d.heroSubtitle || "" };
    }
  } catch (e) { console.warn("homepage load failed:", e); }

  el.innerHTML = `
    <div class="admin-note">Нүүр хуудсанд <strong>одоо байгаа</strong> хэсгүүдийг асаах/унтраах, толгойн бичвэрийг солино.</div>
    <div class="nav-cfg-list">
      ${HOME_SECTIONS.map(([key, label]) => `<div class="nav-cfg-row">
        <label class="nav-cfg-toggle">
          <input type="checkbox" id="homeShow_${key}" ${cfg.hidden.includes(key) ? "" : "checked"}>
          <span>Харуулах</span>
        </label>
        <span>${escapeHtml(label)}</span>
      </div>`).join("")}
    </div>
    <div class="form-group">
      <label for="homeHeroTitle">Толгойн гарчиг (хоосон = анхны бичвэр)</label>
      <input type="text" id="homeHeroTitle" value="${escapeHtml(cfg.heroTitle)}" placeholder="Кодод бичигдсэн анхны гарчиг хэвээр">
    </div>
    <div class="form-group">
      <label for="homeHeroSubtitle">Толгойн тайлбар (хоосон = тоог автоматаар бодож харуулна)</label>
      <input type="text" id="homeHeroSubtitle" value="${escapeHtml(cfg.heroSubtitle)}" placeholder="Хоосон бол dataset-ээс тоог автоматаар гаргана">
    </div>
    <div class="cms-edit-actions">
      <button class="btn btn-primary" type="button" onclick="adminSaveHomepage()">✓ Хадгалах</button>
    </div>`;
}

async function adminSaveHomepage() {
  if (!nbCan("settings.homepage")) return showToast("⚠️ Танд энэ эрх алга");
  const hidden = HOME_SECTIONS.filter(([k]) => !document.getElementById("homeShow_" + k).checked).map(([k]) => k);
  try {
    await db.collection("siteSettings").doc("homepage").set({
      hidden,
      heroTitle: document.getElementById("homeHeroTitle").value.trim(),
      heroSubtitle: document.getElementById("homeHeroSubtitle").value.trim(),
      updatedBy: currentUser.uid, updatedByName: currentUser.name,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    logAdminAction("settings_homepage", "homepage", hidden.length + " нуусан");
    showToast("✅ Хадгалагдлаа");
    renderAdminHomepage();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}
