// ===== ADMIN: САЙТЫН ТОХИРГОО (өнгө / цэс / нүүр хуудас) =====
// Бүгд siteSettings/{key} баримтад хадгалагдана, нийтэд уншигдана, admin+ бичнэ.
// js/site-settings.js нь хуудас бүр дээр үүнийг уншиж хэрэгжүүлнэ.

// ---------- Өнгө / загвар ----------
// Аль хэдийн css/style.css-ийн :root дээр төвлөрсөн хувьсагчдыг л дарж бичнэ —
// шинэ өнгөний систем зохиоогүй, байгаагаа удирдаж байна. Тиймээс энд сонгосон өнгө
// хуудас бүрийн товч, header, footer, карт бүрт автоматаар тархана.
const THEME_VARS = [
  ["--primary", "Үндсэн өнгө", "#0077B6"],
  ["--primary-dark", "Үндсэн (бараан) — header/footer", "#023E8A"],
  ["--primary-light", "Үндсэн (цайвар)", "#00B4D8"],
  ["--primary-soft", "Үндсэн (зөөлөн)", "#CAF0F8"],
  ["--primary-extra-soft", "Үндсэн (маш зөөлөн)", "#E8F4F8"],
  ["--accent", "Онцлох (accent) — товч", "#D85A30"],
  ["--accent-soft", "Онцлох (зөөлөн)", "#FAECE7"],
  ["--text", "Текст", "#1B263B"],
  ["--text-light", "Текст (цайвар)", "#5C6B7A"],
  ["--text-lighter", "Текст (илүү цайвар)", "#8896A6"],
  ["--bg", "Дэвсгэр (background)", "#F8FAFC"],
  ["--white", "Картны дэвсгэр", "#FFFFFF"],
  ["--border", "Хүрээ", "#E2E8F0"],
  ["--gold", "Алтан", "#FFB703"],
  ["--success", "Амжилт", "#06A77D"],
];

// Бэлэн загварууд. Preset сонгоход өнгө нь талбарт бөглөгдөнө — хадгалах хүртэл
// юу ч бичигдэхгүй тул admin эхлээд харж, хүсвэл гараар тохируулж чадна.
const THEME_PRESETS = {
  "nbolzoo": {
    label: "NBolzoo Blue (анхны)",
    vars: {}, // хоосон = кодод бичигдсэн анхны өнгө
  },
  "romantic": {
    label: "Romantic",
    vars: {
      "--primary": "#C2185B", "--primary-dark": "#880E4F", "--primary-light": "#F06292",
      "--primary-soft": "#FCE4EC", "--primary-extra-soft": "#FFF1F5",
      "--accent": "#FF7043", "--accent-soft": "#FFF0EB",
      "--text": "#3E2723", "--text-light": "#6D4C41", "--text-lighter": "#A1887F",
      "--bg": "#FFF8FA", "--white": "#FFFFFF", "--border": "#F3DDE5",
      "--gold": "#E5A00D", "--success": "#2E9E6B",
    },
  },
  "dark": {
    label: "Dark",
    vars: {
      "--primary": "#4FC3F7", "--primary-dark": "#0288D1", "--primary-light": "#81D4FA",
      "--primary-soft": "#1E293B", "--primary-extra-soft": "#172033",
      "--accent": "#FF8A65", "--accent-soft": "#2A1F1B",
      "--text": "#E8EDF4", "--text-light": "#A7B4C4", "--text-lighter": "#7B8794",
      "--bg": "#0F172A", "--white": "#1A2438", "--border": "#2C3A50",
      "--gold": "#FFC53D", "--success": "#34D399",
    },
  },
  "minimal": {
    label: "Minimal",
    vars: {
      "--primary": "#1F2937", "--primary-dark": "#111827", "--primary-light": "#4B5563",
      "--primary-soft": "#F3F4F6", "--primary-extra-soft": "#F9FAFB",
      "--accent": "#111827", "--accent-soft": "#F3F4F6",
      "--text": "#111827", "--text-light": "#4B5563", "--text-lighter": "#9CA3AF",
      "--bg": "#FFFFFF", "--white": "#FFFFFF", "--border": "#E5E7EB",
      "--gold": "#B45309", "--success": "#047857",
    },
  },
};

async function renderAdminTheme() {
  const el = document.getElementById("admin-theme");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  let saved = {}, savedPreset = "";
  try {
    const snap = await db.collection("siteSettings").doc("theme").get();
    if (snap.exists) { saved = snap.data().vars || {}; savedPreset = snap.data().preset || ""; }
  } catch (e) { console.warn("theme load failed:", e); }

  el.innerHTML = `
    <div class="admin-note">Энд сонгосон өнгө сайтын <strong>бүх хуудсанд</strong> CSS хувьсагчаар тархана — хуудас бүрт тусад нь тохируулах шаардлагагүй.</div>

    <section class="admin-section">
      <h3 class="admin-section-title">Бэлэн загвар</h3>
      <div class="cms-types">
        ${Object.entries(THEME_PRESETS).map(([id, p]) =>
          `<button type="button" class="cms-type${id === savedPreset ? " active" : ""}" onclick="adminApplyPreset('${id}')">${escapeHtml(p.label)}</button>`
        ).join("")}
      </div>
      <p class="admin-section-note">Загвар сонгоход доорх өнгө бөглөгдөнө. <strong>Хадгалах</strong> дартал сайтад үйлчлэхгүй.</p>
    </section>

    <section class="admin-section">
      <h3 class="admin-section-title">Өнгө нарийвчлан тохируулах</h3>
      <div class="theme-grid">
        ${THEME_VARS.map(([v, label, def]) => {
          const cur = saved[v] || def;
          return `<div class="theme-row">
            <label for="thm_${v.slice(2)}">${escapeHtml(label)}</label>
            <div class="theme-inputs">
              <input type="color" id="thm_${v.slice(2)}" value="${escapeHtml(cur)}" data-var="${escapeHtml(v)}" data-default="${escapeHtml(def)}" oninput="adminThemePreview()">
              <code>${escapeHtml(v)}</code>
              ${saved[v] ? `<span class="cms-flag cms-flag-edited">өөрчилсөн</span>` : ""}
            </div>
          </div>`;
        }).join("")}
      </div>
      <input type="hidden" id="thmPreset" value="${escapeHtml(savedPreset)}">
      <div class="cms-edit-actions">
        <button class="btn btn-primary" type="button" onclick="adminSaveTheme()">✓ Хадгалах</button>
        <button class="btn btn-outline" type="button" onclick="adminResetTheme()">↺ Анхны өнгө рүү буцаах</button>
      </div>
      <p class="admin-section-note">Дээрх өөрчлөлт нь урьдчилсан харагдац — зөвхөн энэ цонхонд үйлчилж байна.</p>
    </section>`;
  adminThemePreview();
}

function adminApplyPreset(id) {
  const p = THEME_PRESETS[id];
  if (!p) return;
  document.querySelectorAll("#admin-theme input[type=color]").forEach(i => {
    i.value = p.vars[i.dataset.var] || i.dataset.default;
  });
  document.getElementById("thmPreset").value = id;
  document.querySelectorAll("#admin-theme .cms-type").forEach(b => b.classList.remove("active"));
  adminThemePreview();
  showToast("Загвар тавигдлаа — хадгалахаа бүү мартаарай");
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
    // Анхны утгатай ижил бол хадгалахгүй — ингэснээр баримт цэвэр байж, дараа нь
    // кодын өнгө өөрчлөгдвөл автоматаар дагана.
    if (i.value.toLowerCase() !== String(i.dataset.default).toLowerCase()) vars[i.dataset.var] = i.value;
  });
  const preset = document.getElementById("thmPreset").value;
  try {
    const prev = await db.collection("siteSettings").doc("theme").get();
    await db.collection("siteSettings").doc("theme").set({
      vars, preset, updatedBy: currentUser.uid, updatedByName: currentUser.name,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    logAdminAction("settings_theme", "theme", Object.keys(vars).length + " өнгө",
      prev.exists ? prev.data().vars : "анхны", vars);
    showToast("✅ Хадгалагдлаа");
    renderAdminTheme();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

async function adminResetTheme() {
  if (!nbCan("settings.theme")) return showToast("⚠️ Танд энэ эрх алга");
  if (!confirm("Бүх өнгийг кодод бичигдсэн анхны байдалд буцаах уу?")) return;
  try {
    const prev = await db.collection("siteSettings").doc("theme").get();
    await db.collection("siteSettings").doc("theme").set({
      vars: {}, preset: "nbolzoo", updatedBy: currentUser.uid, updatedByName: currentUser.name,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    THEME_VARS.forEach(([v]) => document.documentElement.style.removeProperty(v));
    logAdminAction("settings_reset", "theme", "", prev.exists ? prev.data().vars : "", "анхны өнгө");
    showToast("↺ Анхны өнгө рүү буцлаа");
    renderAdminTheme();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

// ---------- Цэс ----------
// Цэс нь 12 HTML файл дотор бичигдсэн байдаг. Түүнийг бүхэлд нь Firestore руу
// нүүлгэхгүйгээр удирдах найдвартай арга: НУУХ / НЭР / ICON / ДАРААЛАЛ / БҮЛЭГ -ийг
// тохируулах. Ингэснээр тохиргоо ачаалагдаагүй ч HTML доторх анхны цэс хэвийн ажиллана.
const NAV_PAGES = [
  ["home", "Нүүр", "home", ""],
  ["ub", "УБ 365", "city", "ideas"],
  ["aimags", "21 аймаг", "mountain", "ideas"],
  ["expert", "Зөвлөгөө", "gem", "ideas"],
  ["urilga", "Урилга", "mail", "tools"],
  ["games", "Тоглоом", "gamepad", "tools"],
  ["gifts", "Бэлэг", "gift", "tools"],
  ["movies", "Кино", "film", "tools"],
  ["services", "Үйлчилгээ", "store", "tools"],
  ["community", "Нийгэмлэг", "users", ""],
  ["saved", "Хадгалсан", "heart", ""],
];
const NAV_GROUPS = [["", "Дээд түвшин (бүлэггүй)"], ["ideas", "Санаанууд"], ["tools", "Хэрэгслүүд"]];
// Сонгож болох icon-ууд нь js/ui.js-д БОДИТООР байгаа нэрс — байхгүй нэр сонговол
// хоосон дөрвөлжин гарах тул эх сурвалжаас нь авна.
function navIconChoices() { return typeof NB_ICONS !== "undefined" ? Object.keys(NB_ICONS) : []; }

let navCfgCache = null;

async function renderAdminNavigation() {
  const el = document.getElementById("admin-navigation");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  let cfg = { hidden: [], labels: {}, icons: {}, groups: {}, order: [] };
  try {
    const snap = await db.collection("siteSettings").doc("navigation").get();
    if (snap.exists) {
      const d = snap.data();
      cfg = {
        hidden: Array.isArray(d.hidden) ? d.hidden : [],
        labels: d.labels || {}, icons: d.icons || {}, groups: d.groups || {},
        order: Array.isArray(d.order) ? d.order : [],
      };
    }
  } catch (e) { console.warn("navigation load failed:", e); }
  navCfgCache = cfg;
  renderAdminNavigationBody();
}

function navOrderedPages() {
  const cfg = navCfgCache;
  const byKey = Object.fromEntries(NAV_PAGES.map(p => [p[0], p]));
  const ordered = (cfg.order || []).map(k => byKey[k]).filter(Boolean);
  const rest = NAV_PAGES.filter(p => !(cfg.order || []).includes(p[0]));
  return ordered.concat(rest);
}

function adminNavMove(key, dir) {
  const pages = navOrderedPages().map(p => p[0]);
  const i = pages.indexOf(key), j = i + dir;
  if (i < 0 || j < 0 || j >= pages.length) return;
  pages.splice(j, 0, pages.splice(i, 1)[0]);
  navCfgCache.order = pages;
  renderAdminNavigationBody();
}

function renderAdminNavigationBody() {
  const el = document.getElementById("admin-navigation");
  const cfg = navCfgCache;
  const icons = navIconChoices();
  const pages = navOrderedPages();

  el.innerHTML = `
    <div class="admin-note">
      Цэсний холбоосыг нуух, нэр/icon солих, дарааллыг өөрчлөх, бүлэгт хуваарилна.
      Нуусан хуудас цэснээс алга болох ч хаягаар нь шууд ороход хэвээр ажиллана — хуудсыг бүрэн хаадаггүй.
    </div>
    <div class="nav-cfg-list">
      ${pages.map((p, i) => {
        const [key, def, defIcon, defGroup] = p;
        const hidden = cfg.hidden.includes(key);
        const icon = cfg.icons[key] || defIcon;
        const group = cfg.groups[key] !== undefined ? cfg.groups[key] : defGroup;
        return `<div class="nav-cfg-row">
          <div class="nav-cfg-order">
            <button class="btn btn-outline btn-sm btn-icon" type="button" title="Дээш" ${i === 0 ? "disabled" : ""} onclick="adminNavMove('${key}',-1)">↑</button>
            <button class="btn btn-outline btn-sm btn-icon" type="button" title="Доош" ${i === pages.length - 1 ? "disabled" : ""} onclick="adminNavMove('${key}',1)">↓</button>
          </div>
          <label class="nav-cfg-toggle">
            <input type="checkbox" id="navShow_${key}" ${hidden ? "" : "checked"}>
            <span>Харуулах</span>
          </label>
          <code>${escapeHtml(key)}</code>
          <input type="text" id="navLabel_${key}" value="${escapeHtml(cfg.labels[key] || "")}" placeholder="${escapeHtml(def)}" aria-label="${escapeHtml(def)} нэр">
          <select id="navIcon_${key}" aria-label="${escapeHtml(def)} icon">
            ${icons.map(ic => `<option value="${ic}"${ic === icon ? " selected" : ""}>${ic}</option>`).join("")}
          </select>
          <select id="navGroup_${key}" aria-label="${escapeHtml(def)} бүлэг">
            ${NAV_GROUPS.map(([g, gl]) => `<option value="${g}"${g === group ? " selected" : ""}>${escapeHtml(gl)}</option>`).join("")}
          </select>
        </div>`;
      }).join("")}
    </div>
    <div class="cms-edit-actions">
      <button class="btn btn-primary" type="button" onclick="adminSaveNavigation()">✓ Хадгалах</button>
    </div>
    <p class="admin-section-note">Дараалал/бүлгийн өөрчлөлт нь хадгалсны дараа сайтад үйлчилнэ.</p>`;
}

async function adminSaveNavigation() {
  if (!nbCan("settings.navigation")) return showToast("⚠️ Танд энэ эрх алга");
  const hidden = [], labels = {}, icons = {}, groups = {};
  NAV_PAGES.forEach(([key, def, defIcon, defGroup]) => {
    const show = document.getElementById("navShow_" + key);
    if (show && !show.checked) hidden.push(key);
    const l = document.getElementById("navLabel_" + key);
    if (l && l.value.trim() && l.value.trim() !== def) labels[key] = l.value.trim();
    const ic = document.getElementById("navIcon_" + key);
    if (ic && ic.value !== defIcon) icons[key] = ic.value;
    const g = document.getElementById("navGroup_" + key);
    if (g && g.value !== defGroup) groups[key] = g.value;
  });
  const order = navOrderedPages().map(p => p[0]);
  try {
    const prev = await db.collection("siteSettings").doc("navigation").get();
    await db.collection("siteSettings").doc("navigation").set({
      hidden, labels, icons, groups, order,
      updatedBy: currentUser.uid, updatedByName: currentUser.name,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    logAdminAction("settings_navigation", "navigation", hidden.length + " нуусан",
      prev.exists ? { hidden: prev.data().hidden, order: prev.data().order } : "анхны",
      { hidden, order });
    showToast("✅ Хадгалагдлаа");
    renderAdminNavigation();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

// ---------- Нүүр хуудас ----------
// Нүүр хуудсын БОДИТООР байгаа хэсгүүд (index.html дээрх data-home-section).
// Шинэ хэсэг зохиоогүй — байгаагаа асаах/унтраах, дараалал солих, гарчиг өөрчлөх.
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

let homeCfgCache = null;

async function renderAdminHomepage() {
  const el = document.getElementById("admin-homepage");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  let cfg = { hidden: [], order: [], titles: {}, heroTitle: "", heroSubtitle: "", ctaLabel: "", ctaUrl: "" };
  try {
    const snap = await db.collection("siteSettings").doc("homepage").get();
    if (snap.exists) {
      const d = snap.data();
      cfg = {
        hidden: Array.isArray(d.hidden) ? d.hidden : [],
        order: Array.isArray(d.order) ? d.order : [],
        titles: d.titles || {},
        heroTitle: d.heroTitle || "", heroSubtitle: d.heroSubtitle || "",
        ctaLabel: d.ctaLabel || "", ctaUrl: d.ctaUrl || "",
      };
    }
  } catch (e) { console.warn("homepage load failed:", e); }
  homeCfgCache = cfg;
  renderAdminHomepageBody();
}

function homeOrderedSections() {
  const cfg = homeCfgCache;
  const byKey = Object.fromEntries(HOME_SECTIONS.map(s => [s[0], s]));
  const ordered = (cfg.order || []).map(k => byKey[k]).filter(Boolean);
  return ordered.concat(HOME_SECTIONS.filter(s => !(cfg.order || []).includes(s[0])));
}

function adminHomeMove(key, dir) {
  const keys = homeOrderedSections().map(s => s[0]);
  const i = keys.indexOf(key), j = i + dir;
  if (i < 0 || j < 0 || j >= keys.length) return;
  keys.splice(j, 0, keys.splice(i, 1)[0]);
  homeCfgCache.order = keys;
  renderAdminHomepageBody();
}

function renderAdminHomepageBody() {
  const el = document.getElementById("admin-homepage");
  const cfg = homeCfgCache;
  const sections = homeOrderedSections();
  el.innerHTML = `
    <div class="admin-note">Нүүр хуудсанд <strong>одоо байгаа</strong> хэсгүүдийг асаах/унтраах, дарааллыг нь солих, гарчгийг өөрчилнө.</div>

    <section class="admin-section">
      <h3 class="admin-section-title">Хэсгүүд</h3>
      <div class="nav-cfg-list">
        ${sections.map(([key, label], i) => `<div class="nav-cfg-row">
          <div class="nav-cfg-order">
            <button class="btn btn-outline btn-sm btn-icon" type="button" title="Дээш" ${i === 0 ? "disabled" : ""} onclick="adminHomeMove('${key}',-1)">↑</button>
            <button class="btn btn-outline btn-sm btn-icon" type="button" title="Доош" ${i === sections.length - 1 ? "disabled" : ""} onclick="adminHomeMove('${key}',1)">↓</button>
          </div>
          <label class="nav-cfg-toggle">
            <input type="checkbox" id="homeShow_${key}" ${cfg.hidden.includes(key) ? "" : "checked"}>
            <span>Харуулах</span>
          </label>
          <code>${escapeHtml(key)}</code>
          <input type="text" id="homeTitle_${key}" value="${escapeHtml(cfg.titles[key] || "")}" placeholder="${escapeHtml(label)}" aria-label="${escapeHtml(label)} гарчиг">
        </div>`).join("")}
      </div>
    </section>

    <section class="admin-section">
      <h3 class="admin-section-title">Толгой хэсэг (hero)</h3>
      <div class="form-group">
        <label for="homeHeroTitle">Гарчиг (хоосон = анхны бичвэр)</label>
        <input type="text" id="homeHeroTitle" value="${escapeHtml(cfg.heroTitle)}" placeholder="Кодод бичигдсэн анхны гарчиг хэвээр">
      </div>
      <div class="form-group">
        <label for="homeHeroSubtitle">Тайлбар (хоосон = тоог автоматаар бодож харуулна)</label>
        <input type="text" id="homeHeroSubtitle" value="${escapeHtml(cfg.heroSubtitle)}" placeholder="Хоосон бол dataset-ээс тоог автоматаар гаргана">
      </div>
      <div class="form-group">
        <label for="homeCtaLabel">Нэмэлт CTA товчны нэр (хоосон = товч харагдахгүй)</label>
        <input type="text" id="homeCtaLabel" value="${escapeHtml(cfg.ctaLabel)}" placeholder="Жишээ: Үйлчилгээгээ бүртгүүлэх">
      </div>
      <div class="form-group">
        <label for="homeCtaUrl">CTA холбоос</label>
        <input type="text" id="homeCtaUrl" value="${escapeHtml(cfg.ctaUrl)}" placeholder="services.html эсвэл https://...">
      </div>
    </section>

    <div class="cms-edit-actions">
      <button class="btn btn-primary" type="button" onclick="adminSaveHomepage()">✓ Хадгалах</button>
    </div>`;
}

async function adminSaveHomepage() {
  if (!nbCan("settings.homepage")) return showToast("⚠️ Танд энэ эрх алга");
  const hidden = [], titles = {};
  HOME_SECTIONS.forEach(([k, label]) => {
    const show = document.getElementById("homeShow_" + k);
    if (show && !show.checked) hidden.push(k);
    const t = document.getElementById("homeTitle_" + k);
    if (t && t.value.trim()) titles[k] = t.value.trim();
  });
  const ctaUrl = document.getElementById("homeCtaUrl").value.trim();
  // http/https биш гадаад схемийг (javascript: г.м) хүлээж авахгүй. Дотоод харьцангуй
  // зам (services.html) зөвшөөрөгдөнө.
  if (ctaUrl && /^[a-z]+:/i.test(ctaUrl) && !/^https?:\/\//i.test(ctaUrl)) {
    return showToast("⚠️ CTA холбоос нь http(s):// эсвэл дотоод зам байх ёстой");
  }
  const order = homeOrderedSections().map(s => s[0]);
  try {
    const prev = await db.collection("siteSettings").doc("homepage").get();
    await db.collection("siteSettings").doc("homepage").set({
      hidden, order, titles,
      heroTitle: document.getElementById("homeHeroTitle").value.trim(),
      heroSubtitle: document.getElementById("homeHeroSubtitle").value.trim(),
      ctaLabel: document.getElementById("homeCtaLabel").value.trim(),
      ctaUrl,
      updatedBy: currentUser.uid, updatedByName: currentUser.name,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    logAdminAction("settings_homepage", "homepage", hidden.length + " нуусан",
      prev.exists ? { hidden: prev.data().hidden, order: prev.data().order } : "анхны",
      { hidden, order });
    showToast("✅ Хадгалагдлаа");
    renderAdminHomepage();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

// ---------- Footer ----------
// Footer нь 12 HTML файл дотор давтагддаг. Бүхэлд нь Firestore руу нүүлгэлгүйгээр
// засаж болох хэсгүүдэд (data-footer="...") тогтвортой түлхүүр өгөөд, зөвхөн
// ТЕКСТИЙГ нь дарж бичнэ. Ингэснээр бүтэц/загвар хөндөгдөхгүй, тохиргоо
// ачаалагдаагүй ч HTML доторх анхны бичвэр хэвээр үлдэнэ.
const FOOTER_FIELDS = [
  ["tagline", "Танилцуулга бичвэр", "textarea"],
  ["email", "И-мэйл мөр", "text"],
  ["instagram", "Instagram мөр", "text"],
  ["facebook", "Facebook мөр", "text"],
  ["bottom", "Доод мөр (© ...)", "text"],
];

async function renderAdminFooter() {
  const el = document.getElementById("admin-footer");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  let cfg = { texts: {}, hidden: [] };
  try {
    const snap = await db.collection("siteSettings").doc("footer").get();
    if (snap.exists) {
      const d = snap.data();
      cfg = { texts: d.texts || {}, hidden: Array.isArray(d.hidden) ? d.hidden : [] };
    }
  } catch (e) { console.warn("footer load failed:", e); }

  el.innerHTML = `
    <div class="admin-note">
      Footer-ийн бичвэрийг бүх хуудсанд нэг дор өөрчилнө. Хоосон орхивол кодод бичигдсэн анхны бичвэр хэвээр үлдэнэ.
      <br><strong>Анхаар:</strong> зөвхөн бодит, ажилладаг холбоо барих мэдээлэл оруулна уу.
    </div>
    ${FOOTER_FIELDS.map(([key, label, type]) => `
      <div class="nav-cfg-row" style="align-items:flex-start">
        <label class="nav-cfg-toggle">
          <input type="checkbox" id="ftShow_${key}" ${cfg.hidden.includes(key) ? "" : "checked"}>
          <span>Харуулах</span>
        </label>
        <div style="flex:1;min-width:200px">
          <label for="ft_${key}" style="display:block;font-size:13px;font-weight:600;margin-bottom:5px;">${escapeHtml(label)}</label>
          ${type === "textarea"
            ? `<textarea id="ft_${key}" rows="2" style="width:100%">${escapeHtml(cfg.texts[key] || "")}</textarea>`
            : `<input type="text" id="ft_${key}" style="width:100%" value="${escapeHtml(cfg.texts[key] || "")}" placeholder="Анхны бичвэр хэвээр">`}
        </div>
      </div>`).join("")}
    <div class="cms-edit-actions">
      <button class="btn btn-primary" type="button" onclick="adminSaveFooter()">✓ Хадгалах</button>
    </div>`;
}

async function adminSaveFooter() {
  if (!nbCan("settings.homepage")) return showToast("⚠️ Танд энэ эрх алга");
  const texts = {}, hidden = [];
  FOOTER_FIELDS.forEach(([key]) => {
    const show = document.getElementById("ftShow_" + key);
    if (show && !show.checked) hidden.push(key);
    const f = document.getElementById("ft_" + key);
    if (f && f.value.trim()) texts[key] = f.value.trim();
  });
  try {
    const prev = await db.collection("siteSettings").doc("footer").get();
    await db.collection("siteSettings").doc("footer").set({
      texts, hidden, updatedBy: currentUser.uid, updatedByName: currentUser.name,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    logAdminAction("settings_footer", "footer", Object.keys(texts).length + " талбар",
      prev.exists ? prev.data().texts : "анхны", texts);
    showToast("✅ Хадгалагдлаа");
    renderAdminFooter();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}
