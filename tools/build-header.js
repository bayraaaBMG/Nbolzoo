#!/usr/bin/env node
// ===== HEADER / FOOTER ГЕНЕРАТОР =====
//
// Яагаад генератор вэ? Гурван давхаргат header нь 14 HTML файлд давтагддаг. Гараар
// 14 файл засвал хэзээ нэгэн цагт зөрөх нь тодорхой. JS-ээр runtime-д зурвал header
// нь above-the-fold тул layout shift (CLS) үүсгэж, SEO-д ч таарахгүй.
//
// Тиймээс: template НЭГ газар (энэ файл), гаралт нь СТАТИК HTML. Шинэчлэхдээ
//   node tools/build-header.js
// гэж ажиллуулаад commit хийнэ. tests/header_test.js нь 14 header бүгд ижил
// эсэхийг шалгадаг тул гараар засаад мартах боломжгүй.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const START = "<!-- NB:HEADER:START — tools/build-header.js үүсгэдэг. ГАРААР ЗАСАХГҮЙ. -->";
const END = "<!-- NB:HEADER:END -->";

// Ангиллын цэс. Дараалал нь хэрэглэгчийн ашиглалтын дарааллаар (санаа → хэрэгсэл → нийгэмлэг).
// Icon нэр бүр js/ui.js-ийн NB_ICONS дотор БАЙХ ёстой (tests/settings_test.js шалгадаг).
const CATEGORIES = [
  ["ub", "УБ 365", "city"],
  ["aimags", "21 аймаг", "mountain"],
  ["expert", "Зөвлөгөө", "gem"],
  ["urilga", "Урилга", "mail"],
  ["games", "Тоглоом", "gamepad"],
  ["gifts", "Бэлэг", "gift"],
  ["movies", "Кино", "film"],
  ["services", "Үйлчилгээ", "store"],
  ["community", "Нийгэмлэг", "users"],
];

// Файл → аль ангилал нь идэвхтэй. Эрх зүйн хуудас цэсэнд байхгүй тул null.
const ACTIVE = {
  "index.html": "home",
  "ub.html": "ub",
  "aimags.html": "aimags",
  "expert.html": "expert",
  "urilga.html": "urilga",
  "games.html": "games",
  "gifts.html": "gifts",
  "movies.html": "movies",
  "services.html": "services",
  "community.html": "community",
  "saved.html": "saved",
  "admin.html": "admin",
  "privacy.html": null,
  "terms.html": null,
};

function header(activeKey) {
  const cat = ([key, label, icon]) => {
    const on = key === activeKey;
    return `        <a class="cat-link${on ? " active" : ""}" data-page="${key}" onclick="navigate('${key}')"${on ? ' aria-current="page"' : ""}>` +
      `<span class="cat-ico" data-icon="${icon}" data-icon-size="19"></span><span>${label}</span></a>`;
  };

  return `${START}
<!-- 1-Р ДАВХАР: utility bar.
     Утас, Facebook, Instagram нь ЗОХИОМОЛ байж болохгүй тул HTML-д хоосон
     үлдээж, admin "Footer" тохиргооноос бөглөгдвөл л харагдана
     (js/site-settings.js → applyContactSetting). Тохируулаагүй бол энэ хэсэг
     бүрэн нуугдана — хуурамч холбоос хэзээ ч гарахгүй. -->
<div class="utility-bar" id="utilityBar">
  <div class="utility-inner">
    <div class="utility-group">
      <a class="utility-link" id="utilPhone" hidden></a>
      <span class="utility-slot" id="pwaInstallSlot"></span>
    </div>
    <div class="utility-group">
      <a class="utility-link" id="utilFacebook" target="_blank" rel="noopener" hidden>Facebook</a>
      <a class="utility-link" id="utilInstagram" target="_blank" rel="noopener" hidden>Instagram</a>
      <a class="utility-link" onclick="navigate('community')">Тусламж</a>
      <a class="utility-link" href="mailto:info@nbolzoo.mn">Санал хүсэлт</a>
    </div>
  </div>
</div>

<!-- 2-Р ДАВХАР: logo · хайлт · хэрэглэгч.
     .nav-actions класс хэвээр — js/core.js нь PWA товчийг, js/auth.js нь
     нэвтрэлтийн төлвийг түүнээс хайдаг. -->
<header class="site-header">
  <div class="header-inner">
    <a class="logo" data-page="home" onclick="navigate('home')" role="button" tabindex="0" aria-label="Нүүр хуудас"${activeKey === "home" ? ' aria-current="page"' : ""}>
      <img src="logo.svg" alt="" class="logo-icon" width="40" height="40">
      <span class="logo-wrap">
        <span class="logo-text">NBolzoo</span>
        <span class="logo-tagline">.mn</span>
      </span>
    </a>

    <div class="header-search">
      <span class="header-search-ico" data-icon="search" data-icon-size="18" aria-hidden="true"></span>
      <input type="search" id="searchInput" placeholder="Санаа, газар, аймаг хайх..."
             aria-label="Болзооны санаа хайх" onkeypress="if(event.key==='Enter')performSearch()">
      <button class="btn btn-accent header-search-btn" type="button" onclick="performSearch()">Хайх</button>
    </div>

    <div class="nav-actions">
      <a class="header-saved${activeKey === "saved" ? " active" : ""}" data-page="saved" onclick="navigate('saved')" aria-label="Хадгалсан"${activeKey === "saved" ? ' aria-current="page"' : ""}>
        <span class="nav-ico" data-icon="heart" data-icon-size="19"></span><span class="header-saved-text">Хадгалсан</span>
      </a>
      <div id="navAuthButtons">
        <button type="button" class="btn btn-ghost" onclick="openAuth('login')">Нэвтрэх</button>
        <button type="button" class="btn btn-primary" onclick="openAuth('signup')">Бүртгүүлэх</button>
      </div>
      <div id="navUserInfo" style="display:none; align-items:center; gap:8px;">
        <div class="notif-bell" id="notifBell" onclick="toggleNotifDropdown()" role="button" tabindex="0" aria-label="Мэдэгдэл">
          <span class="nav-ico" data-icon="bell"></span><span class="notif-badge" id="notifBadge" style="display:none;">0</span>
          <div class="notif-dropdown" id="notifDropdown" style="display:none;"></div>
        </div>
        <div class="avatar" id="navAvatar" style="width:34px;height:34px;font-size:13px;cursor:pointer;" onclick="openProfileModal()" role="button" tabindex="0" aria-label="Профайл нээх"></div>
        <button type="button" class="btn btn-ghost" style="font-size:13px;padding:8px 12px;" onclick="logoutUser()">Гарах</button>
      </div>
      <button type="button" class="mobile-menu-btn" onclick="openMobileMenu()" title="Цэс нээх" aria-label="Цэс нээх"><span class="nav-ico" data-icon="menu" data-icon-size="20"></span></button>
    </div>
  </div>
</header>

<!-- 3-Р ДАВХАР: ангиллын цэс. Хэвтээ, нарийн дэлгэц дээр чирж харна.
     js/site-settings.js нь цэсний тохиргоог .cat-nav-inner -ээр хэрэгжүүлнэ.
     Хуучин .nav-menu класс ЗОРИУДААР хэрэглээгүй — түүний загвар .cat-link-тэй зөрчилддөг. -->
<nav class="cat-nav" aria-label="Хэсгүүд">
  <div class="cat-nav-inner">
${CATEGORIES.map(cat).join("\n")}
        <a class="cat-link" id="navAdminLink" data-page="admin" onclick="navigate('admin')" style="display:none;"${activeKey === "admin" ? ' aria-current="page"' : ""}><span class="cat-ico" data-icon="settings" data-icon-size="19"></span><span>Админ</span></a>
  </div>
</nav>

<!-- Мобайл drawer — ангиллын цэс нарийн дэлгэц дээр чирэгддэг тул энд бүх
     холбоос + нэвтрэлт байна. -->
<div class="mobile-overlay" id="mobileOverlay" onclick="closeMobileMenu()"></div>
<div class="mobile-nav-drawer" id="mobileNavDrawer">
  <div class="mobile-nav-header">
    <span class="logo-text">NBolzoo</span>
    <button type="button" class="mobile-nav-close" onclick="closeMobileMenu()" aria-label="Цэс хаах">✕</button>
  </div>
  <div class="mobile-nav-items">
    <a onclick="navigate('home');closeMobileMenu()"${activeKey === "home" ? ' class="active" aria-current="page"' : ""}><span class="nav-ico" data-icon="home"></span>Нүүр</a>
${CATEGORIES.map(([key, label, icon]) => {
  const on = key === activeKey;
  return `    <a onclick="navigate('${key}');closeMobileMenu()"${on ? ' class="active" aria-current="page"' : ""}><span class="nav-ico" data-icon="${icon}"></span>${label}</a>`;
}).join("\n")}
    <a onclick="navigate('saved');closeMobileMenu()"${activeKey === "saved" ? ' class="active" aria-current="page"' : ""}><span class="nav-ico" data-icon="heart"></span>Хадгалсан</a>
  </div>
  <div class="mobile-nav-divider"></div>
  <div class="mobile-nav-actions" id="mobileAuthButtons">
    <button type="button" class="btn btn-ghost" style="width:100%" onclick="openAuth('login');closeMobileMenu()">Нэвтрэх</button>
    <button type="button" class="btn btn-primary" style="width:100%" onclick="openAuth('signup');closeMobileMenu()">Бүртгүүлэх</button>
  </div>
</div>
${END}`;
}

// ---- Бичих ----
// --check : файлыг БИЧИХГҮЙ, зөвхөн зөрүүтэй эсэхийг шалгаад exit code-оор хэлнэ.
// Тест үүнийг ашиглана — эс бөгөөс тест өөрөө файл бичиж, "нэг удаа унаад
// дараа нь дамждаг" тогтворгүй зан үйл үүсгэнэ.
const CHECK = process.argv.includes("--check");
let written = 0, skipped = 0, stale = [];
for (const [file, activeKey] of Object.entries(ACTIVE)) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) { console.log("  SKIP (missing) " + file); skipped++; continue; }
  let html = fs.readFileSync(p, "utf8");
  const block = header(activeKey);

  if (html.includes(START)) {
    // Дахин үүсгэх: markers хоорондыг солино.
    const a = html.indexOf(START);
    const b = html.indexOf(END) + END.length;
    html = html.slice(0, a) + block + html.slice(b);
  } else {
    // Эхний удаа: хуучин <nav class="nav"> -ээс мобайл drawer дуустал бүхэлд нь солино.
    //
    // Хил нь <main>-ийн ЯГ УРД цэг. Мөрийн төгсгөлөөр (\n) хайж болохгүй — файлууд
    // CRLF-тэй тул тэр нь хэзээ ч таарахгүй бөгөөд өмнө нь drawer-ийн хаалтын </div>
    // үлдэж, бүх хуудсын div тэнцвэр эвдэрсэн. Тиймээс <main>-ийг шууд цэг болгоно:
    // header-ээс main хүртлийн БҮХ зүйл бол бид үүсгэдэг хэсэг.
    const a = html.indexOf('  <nav class="nav">');
    if (a < 0) { console.log("  SKIP (no nav) " + file); skipped++; continue; }
    const b = html.indexOf("<main>");
    if (b < 0 || b < a) { console.log("  SKIP (no <main> after nav) " + file); skipped++; continue; }
    html = html.slice(0, a) + block + "\n\n" + html.slice(b);
  }
  if (CHECK) {
    // Мөрийн төгсгөлийг (CRLF/LF) тэгшитгээд ЗӨВХӨН агуулгыг харьцуулна.
    const norm = x => x.split(String.fromCharCode(13)).join("");
    if (norm(html) !== norm(fs.readFileSync(p, "utf8"))) stale.push(file);
  } else {
    fs.writeFileSync(p, html);
    written++;
  }
}
if (CHECK) {
  if (stale.length) {
    console.log("STALE header in: " + stale.join(", "));
    console.log('Шийдэх: node tools/build-header.js');
    process.exit(1);
  }
  console.log("all headers up to date");
} else {
  console.log("header written to " + written + " file(s)" + (skipped ? ", " + skipped + " skipped" : ""));
}
