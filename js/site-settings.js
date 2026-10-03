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
  const [theme, nav, home, footer] = await Promise.allSettled([
    db.collection("siteSettings").doc("theme").get(),
    db.collection("siteSettings").doc("navigation").get(),
    db.collection("siteSettings").doc("homepage").get(),
    db.collection("siteSettings").doc("footer").get(),
  ]);
  if (theme.status === "fulfilled") applyThemeSetting(theme.value);
  if (nav.status === "fulfilled") applyNavigationSetting(nav.value);
  if (home.status === "fulfilled") applyHomepageSetting(home.value);
  if (footer.status === "fulfilled") { applyFooterSetting(footer.value); applyContactSetting(footer.value); }
}

// ---------- Өнгө ----------
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

// ---------- Цэс ----------
function applyNavigationSetting(snap) {
  try {
    if (!snap.exists) return;
    const d = snap.data();
    const hidden = Array.isArray(d.hidden) ? d.hidden : [];
    const labels = d.labels || {};
    const icons = d.icons || {};
    const order = Array.isArray(d.order) ? d.order : [];

    // 1) Нуух / нэр / icon
    document.querySelectorAll("[data-page]").forEach(el => {
      const key = el.dataset.page;
      // Админ холбоос энэ логикт хамаарахгүй — түүнийг эрхээр нь js/auth.js удирдана.
      if (key === "admin") return;
      if (hidden.includes(key)) { el.style.display = "none"; return; }
      if (labels[key]) {
        // Зөвхөн текстийн зангилааг солино — дотор нь байгаа icon <span> хэвээр үлдэнэ.
        const textNode = Array.from(el.childNodes).find(n => n.nodeType === 3 && n.textContent.trim());
        if (textNode) textNode.textContent = labels[key];
        else el.appendChild(document.createTextNode(labels[key]));
      }
      if (icons[key]) {
        const ico = el.querySelector("[data-icon]");
        if (ico && typeof nbIcon === "function") {
          ico.dataset.icon = icons[key];
          delete ico.dataset.iconDone;
        }
      }
    });
    if (typeof nbHydrateIcons === "function") nbHydrateIcons();

    // 2) Дараалал — ангиллын цэс нь тэгш жагсаалт (dropdown байхгүй) тул
    //    элементийг шууд эцэг рүүгээ дахин нэмэхэд дараалал солигдоно.
    const menu = document.querySelector(".cat-nav-inner");
    if (order.length && menu) {
      order.forEach(key => {
        const link = menu.querySelector(`[data-page="${CSS.escape(key)}"]`);
        if (link && link.parentElement === menu) menu.appendChild(link);
      });
      // Админ холбоосыг үргэлж хамгийн сүүлд үлдээнэ.
      const adminLink = menu.querySelector('[data-page="admin"]');
      if (adminLink && adminLink.parentElement === menu) menu.appendChild(adminLink);
    }

  } catch (e) { console.warn("applyNavigationSetting failed:", e); }
}

// ---------- Нүүр хуудас ----------
function applyHomepageSetting(snap) {
  try {
    if (!snap.exists) return;
    const d = snap.data();

    // Нуух
    (Array.isArray(d.hidden) ? d.hidden : []).forEach(key => {
      document.querySelectorAll(`[data-home-section="${CSS.escape(key)}"]`).forEach(el => { el.style.display = "none"; });
    });

    // Хэсгийн гарчиг солих — тухайн хэсэг доторх эхний h2-г л сольдог, hero-г хөндөхгүй.
    const titles = d.titles || {};
    Object.keys(titles).forEach(key => {
      const sec = document.querySelector(`[data-home-section="${CSS.escape(key)}"]`);
      if (!sec) return;
      const h = sec.querySelector("h2");
      if (h) h.textContent = titles[key];
    });

    // Дараалал — эхний эцэг элемент дотор л зөөнө (section-ууд нэг container дотор байдаг).
    const order = Array.isArray(d.order) ? d.order : [];
    if (order.length) {
      order.forEach(key => {
        const el = document.querySelector(`[data-home-section="${CSS.escape(key)}"]`);
        if (el && el.parentElement) el.parentElement.appendChild(el);
      });
    }

    if (d.heroTitle) {
      const t = document.getElementById("heroTitle");
      if (t) t.textContent = d.heroTitle;
    }
    if (d.heroSubtitle) {
      const s = document.getElementById("heroSubtitle");
      // updateHeroStats() дараа нь дахин бичихээс сэргийлж тэмдэглэнэ.
      if (s) { s.textContent = d.heroSubtitle; s.dataset.locked = "1"; }
    }

    // Нэмэлт CTA товч — зөвхөн ХОЁУЛАА (нэр ба холбоос) байвал гарна.
    if (d.ctaLabel && d.ctaUrl) {
      const slot = document.getElementById("heroCtaSlot");
      const url = String(d.ctaUrl);
      // Дотоод зам эсвэл http(s) л зөвшөөрнө — javascript: гэх мэт схемийг таслана.
      const safe = !/^[a-z]+:/i.test(url) || /^https?:\/\//i.test(url);
      if (slot && safe) {
        const a = document.createElement("a");
        a.className = "btn btn-accent";
        a.href = url;
        a.textContent = d.ctaLabel;
        if (/^https?:\/\//i.test(url)) { a.target = "_blank"; a.rel = "noopener"; }
        slot.innerHTML = "";
        slot.appendChild(a);
      }
    }
  } catch (e) { console.warn("applyHomepageSetting failed:", e); }
}

// ---------- Footer ----------
// Зөвхөн data-footer="..." тэмдэгтэй элементийн ТЕКСТИЙГ л сольдог — бүтэц, холбоос,
// загвар хөндөгдөхгүй. textContent ашигласан тул admin бичвэрээр HTML тарих боломжгүй.
function applyFooterSetting(snap) {
  try {
    if (!snap.exists) return;
    const d = snap.data();
    const texts = d.texts || {};
    const hidden = Array.isArray(d.hidden) ? d.hidden : [];
    document.querySelectorAll("[data-footer]").forEach(el => {
      const key = el.dataset.footer;
      if (hidden.includes(key)) { el.style.display = "none"; return; }
      if (texts[key]) el.textContent = texts[key];
    });
  } catch (e) { console.warn("applyFooterSetting failed:", e); }
}

// ---------- Utility bar-ийн холбоо барих холбоос ----------
// Утас, Facebook, Instagram нь ЗОХИОМОЛ байж болохгүй. HTML-д hidden байдлаар
// хоосон сууж, admin "Footer" тохиргооноос бодит утга өгвөл л харагдана.
// Тохируулаагүй бол тэр холбоос ОГТ гарахгүй — хуурамч холбоос хэзээ ч үзүүлэхгүй.
function applyContactSetting(snap) {
  try {
    if (!snap.exists) return;
    const t = snap.data().texts || {};
    const set = (id, value, href) => {
      const el = document.getElementById(id);
      if (!el || !value) return;
      // Гадаад холбоос нь зөвхөн http(s) эсвэл tel: байж болно.
      if (href && !/^(https?:\/\/|tel:)/i.test(href)) return;
      el.textContent = value;
      if (href) el.href = href;
      el.hidden = false;
    };
    if (t.phone) set("utilPhone", "☎ " + t.phone, "tel:" + String(t.phone).replace(/[^\d+]/g, ""));
    if (t.facebookUrl) set("utilFacebook", "Facebook", t.facebookUrl);
    if (t.instagramUrl) set("utilInstagram", "Instagram", t.instagramUrl);
  } catch (e) { console.warn("applyContactSetting failed:", e); }
}
