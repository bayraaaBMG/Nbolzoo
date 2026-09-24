// ===== САЙТЫН ТОХИРГООГ НИЙТИЙН ХУУДСАНД ХЭРЭГЖҮҮЛЭХ =====
// Admin-аас siteSettings/{theme|navigation|homepage} дээр хадгалсныг уншиж хэрэгжүүлнэ.
//
// ЧУХАЛ зарчим — fail-open: энэ файлын ЮУ Ч бүтэлгүйтсэн (сүлжээгүй, Firestore унтарсан,
// дүрэм шинэчлэгдээгүй) тохиолдолд хуудас HTML/CSS дотор бичигдсэн анхны байдлаараа
// бүрэн хэвийн ажиллах ёстой. Тиймээс бүх зүйл try/catch дотор бөгөөд ямар ч тохиолдолд
// контентыг НУУХ талд алдаа гаргахгүй.

async function applySiteSettings() {
  if (typeof db === "undefined" || !db) return;
  // Гурвуулаа зэрэг, бие биенээсээ хамааралгүй — нэг нь унасан ч нөгөөдөө нөлөөлөхгүй.
  const [theme, nav, home] = await Promise.allSettled([
    db.collection("siteSettings").doc("theme").get(),
    db.collection("siteSettings").doc("navigation").get(),
    db.collection("siteSettings").doc("homepage").get(),
  ]);
  if (theme.status === "fulfilled") applyThemeSetting(theme.value);
  if (nav.status === "fulfilled") applyNavigationSetting(nav.value);
  if (home.status === "fulfilled") applyHomepageSetting(home.value);
}

// Зөвхөн :root дээрх CSS хувьсагчийг дарж бичнэ — ямар ч selector/layout хөндөхгүй.
function applyThemeSetting(snap) {
  try {
    if (!snap.exists) return;
    const vars = snap.data().vars || {};
    Object.keys(vars).forEach(k => {
      // Зөвхөн "--" -ээр эхэлсэн, hex өнгө хэлбэртэй утгыг зөвшөөрнө. Энэ нь admin
      // баримт ямар нэг байдлаар гэмтсэн ч дур зоргын CSS тарихаас сэргийлнэ.
      if (/^--[a-z0-9-]+$/i.test(k) && /^#[0-9a-f]{3,8}$/i.test(String(vars[k]))) {
        document.documentElement.style.setProperty(k, vars[k]);
      }
    });
  } catch (e) { console.warn("applyThemeSetting failed:", e); }
}

function applyNavigationSetting(snap) {
  try {
    if (!snap.exists) return;
    const d = snap.data();
    const hidden = Array.isArray(d.hidden) ? d.hidden : [];
    const labels = d.labels || {};
    // Админ холбоос энэ логикт хамаарахгүй — түүнийг эрхээр нь js/auth.js удирдана.
    document.querySelectorAll("[data-page]").forEach(el => {
      const key = el.dataset.page;
      if (key === "admin") return;
      if (hidden.includes(key)) {
        el.style.display = "none";
        return;
      }
      if (labels[key]) {
        // Зөвхөн текстийн зангилааг солино — дотор нь байгаа icon <span> хэвээр үлдэнэ.
        const textNode = Array.from(el.childNodes).find(n => n.nodeType === 3 && n.textContent.trim());
        if (textNode) textNode.textContent = labels[key];
        else el.appendChild(document.createTextNode(labels[key]));
      }
    });
    // Бүх холбоос нь нуугдсан dropdown бол бүлгийг нь бүхэлд нь нуухгүй бол хоосон
    // товч үлдэнэ.
    document.querySelectorAll(".nav-group").forEach(g => {
      const links = Array.from(g.querySelectorAll(".nav-dropdown-link"));
      if (links.length && links.every(l => l.style.display === "none")) g.style.display = "none";
    });
  } catch (e) { console.warn("applyNavigationSetting failed:", e); }
}

function applyHomepageSetting(snap) {
  try {
    if (!snap.exists) return;
    const d = snap.data();
    (Array.isArray(d.hidden) ? d.hidden : []).forEach(key => {
      document.querySelectorAll(`[data-home-section="${CSS.escape(key)}"]`).forEach(el => { el.style.display = "none"; });
    });
    if (d.heroTitle) {
      const t = document.getElementById("heroTitle");
      if (t) t.textContent = d.heroTitle;
    }
    if (d.heroSubtitle) {
      const s = document.getElementById("heroSubtitle");
      // updateHeroStats() дараа нь дахин бичихээс сэргийлж тэмдэглэнэ.
      if (s) { s.textContent = d.heroSubtitle; s.dataset.locked = "1"; }
    }
  } catch (e) { console.warn("applyHomepageSetting failed:", e); }
}
