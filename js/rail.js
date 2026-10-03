// ===== КАРТЫН RAIL: ← → алхам алхмаар үзэх =====
//
// Картын жагсаалтыг хэвтээ "rail" болгож, нэг нэгээр нь алхах ← → товч нэмнэ.
//
// ЗАРЧИМ: ДАРААЛЛЫГ ОГТ ӨӨРЧИЛӨХГҮЙ. Rail нь render хийгдсэн картуудыг яг
// байгаа дарааллаар нь гүйлгэнэ — шинэ эрэмбэ зохиохгүй, шүүлтүүрийг
// хөндөхгүй. Тиймээс шүүлтүүр солигдоход rail өөрөө дагаж шинэчлэгдэнэ.
//
// Ашиглалт:  nbRail("featuredGrid")   — render хийсний ДАРАА дуудна.
//
// Хэрэв бүх карт дэлгэцэнд багтаж байвал товч, тоолуур ОГТ гарахгүй — юу ч
// хийдэггүй товч харуулах нь хэрэглэгчийг төөрөгдүүлнэ.

function nbRailReduceMotion() {
  try {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) { return false; }
}

// Нэг "алхам" = нэг картын өргөн + хоорондын зай.
function nbRailStep(track) {
  const first = track.firstElementChild;
  if (!first) return 240;
  const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || "0") || 0;
  return first.getBoundingClientRect().width + gap;
}

function nbRailIndex(track) {
  const step = nbRailStep(track);
  return step > 0 ? Math.round(track.scrollLeft / step) : 0;
}

// Хэдэн карт зэрэг харагдаж байна — тоолуурыг "3 / 8" гэж зөв харуулахад хэрэгтэй.
function nbRailPerView(track) {
  const step = nbRailStep(track);
  return step > 0 ? Math.max(1, Math.round(track.clientWidth / step)) : 1;
}

function nbRail(gridId) {
  const track = document.getElementById(gridId);
  if (!track) return;
  const cards = track.children.length;
  if (!cards) return;

  // Өмнө үүсгэсэн удирдлагыг цэвэрлэнэ (дахин render хийгдэх үед давхардахгүй).
  const prevWrap = track.closest(".rail-wrap");
  if (prevWrap) {
    const old = prevWrap.querySelector(".rail-controls");
    if (old) old.remove();
    prevWrap.replaceWith(track);
  }
  track.classList.add("rail-track");

  // Бүгд багтаж байвал rail хэрэггүй — энгийн сүлжээ хэвээр үлдэнэ.
  // scrollWidth ба clientWidth-ийг layout тогтсоны дараа харьцуулна.
  requestAnimationFrame(() => {
    if (track.scrollWidth <= track.clientWidth + 4) {
      track.classList.remove("rail-track");
      return;
    }
    nbRailBuild(track, gridId);
  });
}

function nbRailBuild(track, gridId) {
  const wrap = document.createElement("div");
  wrap.className = "rail-wrap";
  track.parentNode.insertBefore(wrap, track);
  wrap.appendChild(track);

  const controls = document.createElement("div");
  controls.className = "rail-controls";
  controls.innerHTML =
    `<button type="button" class="rail-btn rail-prev" aria-label="Өмнөх"><span aria-hidden="true">‹</span></button>` +
    `<span class="rail-count" aria-live="polite" aria-atomic="true"></span>` +
    `<button type="button" class="rail-btn rail-next" aria-label="Дараах"><span aria-hidden="true">›</span></button>`;

  // Удирдлагыг хэсгийн ГАРЧГИЙН мөрөнд тавина (байвал) — тэнд байх нь
  // "Бүгдийг үзэх"-ийн хажууд, зай хэмнэнэ. Байхгүй бол rail-ийн дээр.
  const section = track.closest("section") || track.parentElement;
  const titleRow = section ? section.querySelector(".section-title") : null;
  if (titleRow) { controls.classList.add("in-title"); titleRow.appendChild(controls); }
  else wrap.insertBefore(controls, track);

  const count = controls.querySelector(".rail-count");
  const prev = controls.querySelector(".rail-prev");
  const next = controls.querySelector(".rail-next");

  function update() {
    const total = track.children.length;
    const perView = nbRailPerView(track);
    const i = nbRailIndex(track);
    // Эхнийх нь 1-ээс эхлэх нь хүнд ойлгомжтой. Сүүлийн "хуудас" дээр
    // тоолуур нийт тооноосоо хэтрэхгүй.
    count.textContent = Math.min(i + perView, total) + " / " + total;
  }

  function go(dir) {
    const step = nbRailStep(track);
    const max = track.scrollWidth - track.clientWidth;
    let target = track.scrollLeft + dir * step;
    // Төгсгөлд давтана (loop) — "өнөөдрийн" мэдрэмжийг тасалдуулахгүй.
    if (dir > 0 && track.scrollLeft >= max - 4) target = 0;
    else if (dir < 0 && track.scrollLeft <= 4) target = max;
    track.scrollTo({ left: target, behavior: nbRailReduceMotion() ? "auto" : "smooth" });
  }

  prev.addEventListener("click", () => go(-1));
  next.addEventListener("click", () => go(1));
  track.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);

  // Гар утасны унших дараалал: хэсэг дотор фокустай үед ← → ажиллана.
  // Хэрэглэгч бичиж байх үед (input/textarea) хөндөхгүй.
  (section || wrap).addEventListener("keydown", e => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    e.preventDefault();
    go(e.key === "ArrowRight" ? 1 : -1);
  });

  update();
}

// Нэг хуудсан дээрх бүх rail-ийг нэг дор үүсгэнэ.
function nbRailAll(ids) {
  ids.forEach(id => nbRail(id));
}
