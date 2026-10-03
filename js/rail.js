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
// Хэрэв бүх карт дэлгэцэнд багтаж байвал товч ОГТ гарахгүй — юу ч хийдэггүй
// товч харуулах нь хэрэглэгчийг төөрөгдүүлнэ.

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
  // Гарчгийн мөрөнд үлдсэн хуучин удирдлагыг мөн арилгана — rail дахин
  // баригдахад тэнд хоёр хос товч үлдэх боломжтой байв.
  const sec = track.closest("section") || track.parentElement;
  if (sec) sec.querySelectorAll(".rail-controls").forEach(c => c.remove());

  track.classList.add("rail-track");

  // Бүгд багтаж байвал rail хэрэггүй — энгийн сүлжээ хэвээр үлдэнэ.
  // scrollWidth ба clientWidth-ийг layout тогтсоны дараа харьцуулна.
  requestAnimationFrame(() => {
    if (track.scrollWidth <= track.clientWidth + 4) {
      track.classList.remove("rail-track");
      return;
    }
    nbRailBuild(track);
  });
}

function nbRailBuild(track) {
  const wrap = document.createElement("div");
  wrap.className = "rail-wrap";
  track.parentNode.insertBefore(wrap, track);
  wrap.appendChild(track);

  const controls = document.createElement("div");
  controls.className = "rail-controls";
  // Тоолуургүй — зөвхөн хоёр товч. Байрлалын тоо нь нүүр хуудсанд
  // шаардлагагүй мэдээлэл болж, гарчгийн мөрийг бөглөрүүлж байсан.
  controls.innerHTML =
    `<button type="button" class="rail-btn rail-prev" aria-label="Өмнөх"><span aria-hidden="true">‹</span></button>` +
    `<button type="button" class="rail-btn rail-next" aria-label="Дараах"><span aria-hidden="true">›</span></button>`;

  // Удирдлагыг хэсгийн ГАРЧГИЙН мөрөнд тавина (байвал) — тэнд байх нь
  // "Бүгдийг үзэх"-ийн хажууд, зай хэмнэнэ. Байхгүй бол rail-ийн дээр.
  const section = track.closest("section") || track.parentElement;
  const titleRow = section ? section.querySelector(".section-title") : null;
  if (titleRow) { controls.classList.add("in-title"); titleRow.appendChild(controls); }
  else wrap.insertBefore(controls, track);

  const prev = controls.querySelector(".rail-prev");
  const next = controls.querySelector(".rail-next");

  // Жинхэнэ давталт (loop): сүүлээс → эхлэл, эхлэлээс → сүүл.
  //
  // ӨМНӨ ЭВДЭРСЭН БАЙСАН: хил таних хүлцэл 4px байсан бөгөөд CSS дээр
  // scroll-snap-type: x mandatory байв. Mandatory snap нь хамгийн сүүлийн
  // байрлал (max) snap цэг биш бол хөтчийг ХОЙШ нь татаж буцаадаг. Тиймээс
  // scrollLeft нь max-д хэзээ ч хүрдэггүй → "сүүлд хүрээд өмнөх рүүгээ
  // үсэрнэ" гэсэн эвдрэл гарч, давталт хэзээ ч ажиллахгүй байв.
  // Одоо: snap нь proximity (CSS), хүлцэл нь хагас карт.
  function go(dir) {
    const step = nbRailStep(track);
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    // Хөтөч бутархай scrollLeft мэдээлдэг тул жижиг хүлцэл.
    const EPS = 2;
    let target;
    if (dir > 0) {
      // Жинхэнэ төгсгөлд байвал л эхлэл рүү. Үгүй бол нэг алхам, гэхдээ
      // max-аас хэтрэхгүй — ингэснээр СҮҮЛИЙН карт бүтнээрээ харагдсаны
      // ДАРАА давталт болно (өмнө нь сүүлийн карт тасарч үлдээд давтдаг байв).
      target = track.scrollLeft >= max - EPS ? 0 : Math.min(max, track.scrollLeft + step);
    } else {
      target = track.scrollLeft <= EPS ? max : Math.max(0, track.scrollLeft - step);
    }
    track.scrollTo({ left: target, behavior: nbRailReduceMotion() ? "auto" : "smooth" });
  }

  prev.addEventListener("click", () => go(-1));
  next.addEventListener("click", () => go(1));

  // Гарын товчлуур: хэсэг дотор фокустай үед ← → ажиллана.
  // Хэрэглэгч бичиж байх үед (input/textarea) хөндөхгүй.
  (section || wrap).addEventListener("keydown", e => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    e.preventDefault();
    go(e.key === "ArrowRight" ? 1 : -1);
  });
}

// Нэг хуудсан дээрх бүх rail-ийг нэг дор үүсгэнэ.
function nbRailAll(ids) {
  ids.forEach(id => nbRail(id));
}
