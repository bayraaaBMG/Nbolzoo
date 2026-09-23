// ===== NBolzoo UI: icon system + navigation dropdowns =====
// Гадаад icon library (Lucide г.м.) татахгүй: энэ сайт build алхамгүй, статик хостинг дээр
// ажилладаг тул нэмэлт CDN script нь ачаалалт удаашруулж, offline/PWA байдалд эмзэг болгоно.
// Иймд ижил маягийн (24x24, stroke, currentColor) SVG-г шууд инлайнаар оруулав — 0 dependency,
// 0 нэмэлт сүлжээний хүсэлт, өнгө/хэмжээ нь CSS-ээс удирдагдана.
const NB_ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  city: '<path d="M3 21h18"/><path d="M5 21V7l5-3v17"/><path d="M14 21V10l5 3v8"/><path d="M8 9h.01M8 13h.01M8 17h.01"/>',
  mountain: '<path d="m3 19 6-11 4 7 2.5-4L21 19z"/><path d="M3 19h18"/>',
  gem: '<path d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18"/><path d="m9 4 3 16 3-16"/>',
  gift: '<rect x="3" y="9" width="18" height="12" rx="1.5"/><path d="M3 13h18"/><path d="M12 9v12"/><path d="M12 9S9.5 4 7.5 4a2.5 2.5 0 0 0 0 5"/><path d="M12 9s2.5-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 5.2A3.2 3.2 0 0 1 16 11"/><path d="M17.5 14.8c2.1.6 3.5 2.2 3.5 4.2"/>',
  film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16M16 4v16M3 9h5M16 9h5M3 15h5M16 15h5"/>',
  heart: '<path d="M12 20s-7-4.5-7-9.5A4 4 0 0 1 12 7a4 4 0 0 1 7 3.5c0 5-7 9.5-7 9.5z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6 8.5-6"/>',
  gamepad: '<rect x="2.5" y="7" width="19" height="10.5" rx="4"/><path d="M7 10.5v3M5.5 12h3"/><circle cx="16" cy="11.2" r="1"/><circle cx="18.2" cy="13.5" r="1"/>',
  tools: '<path d="m14.5 5.5 4 4"/><path d="M16.5 3.5a3.5 3.5 0 0 1 4 4L8 20H4v-4z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 14.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9 2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2 2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9 2 2 0 1 1 0 4 1.7 1.7 0 0 0-1.6 1z"/>',
  bell: '<path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6"/><path d="M10.5 20a2 2 0 0 0 3 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  dice: '<rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/><circle cx="8.5" cy="8.5" r="1.1"/><circle cx="15.5" cy="15.5" r="1.1"/><circle cx="12" cy="12" r="1.1"/>',
};

function nbIcon(name, size) {
  const body = NB_ICONS[name];
  if (!body) return "";
  const s = size || 18;
  return `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor"
    stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

// [data-icon="name"] бүхий элемент бүрийг SVG-ээр дүүргэнэ. Иконууд нь зөвхөн чимэглэл тул
// aria-hidden — хажуугийн текст эсвэл эцэг элементийн aria-label нь нэр болж өгнө.
function nbHydrateIcons(root) {
  (root || document).querySelectorAll("[data-icon]").forEach(el => {
    if (el.dataset.iconDone) return;
    const svg = nbIcon(el.dataset.icon, el.dataset.iconSize ? +el.dataset.iconSize : undefined);
    if (!svg) return;
    el.innerHTML = svg;
    el.dataset.iconDone = "1";
  });
}

// ---- Navigation dropdown (desktop) ----
// Click-ээр нээгдэнэ (hover биш) — ингэснээр keyboard болон touch дээр адилхан ажиллана.
function nbCloseNavGroups(except) {
  document.querySelectorAll(".nav-group.open").forEach(g => {
    if (g === except) return;
    g.classList.remove("open");
    const b = g.querySelector(".nav-group-btn");
    if (b) b.setAttribute("aria-expanded", "false");
  });
}

function nbToggleNavGroup(btn) {
  const group = btn.closest(".nav-group");
  if (!group) return;
  const willOpen = !group.classList.contains("open");
  nbCloseNavGroups(group);
  group.classList.toggle("open", willOpen);
  btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
}

document.addEventListener("click", e => {
  const btn = e.target.closest(".nav-group-btn");
  if (btn) { e.preventDefault(); nbToggleNavGroup(btn); return; }
  if (!e.target.closest(".nav-dropdown")) nbCloseNavGroups();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    const open = document.querySelector(".nav-group.open .nav-group-btn");
    nbCloseNavGroups();
    if (open) open.focus();
  }
});

nbHydrateIcons();
