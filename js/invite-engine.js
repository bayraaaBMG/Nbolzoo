// ===== УРИЛГА: динамик page-navigation engine =====
// 12 render<Type>Experience() функц тус бүр адилхнаар HTML string угсарч #inviteApp дотор
// нэг л удаа innerHTML болгодог (загвар/тоглоом/Firestore логик энд огт өөрчлөгдөөгүй).
// Энэ файл тэдгээрийг ДАХИН БИЧИХГҮЙгээр "дараагийн page аль нь вэ, нийт хэд дэх нь вэ"
// гэдгийг real-time тооцоолдог болгоно:
//   - render функц бүр .inv-card-даа data-step="<id>" (сонголтоор data-group="<key>")
//     attribute-тай (invite.js-д аль хэдийн нэмэгдсэн)
//   - "Дараах →" товч бүр onclick="invAdvance()" дуудна (invite.js-д хөрвүүлэгдсэн)
//   - HTML бэлэн болмогц render функц бүр invIndexPages(invite) нэг удаа дуудна — энэ нь
//     ЯГ ОДОО DOM дотор бодитоор ямар card-ууд байгааг (өөрөөр хэлбэл аль нэмэлт card
//     тухайн invite дээр нөхцөлт emit хийгдсэн эсэхийг) скан хийж invPages массивыг угсарна.
//   - Phase 6 (enable/disable + reorder): яг энд, invIndexPages дотор, invite.enabledPages/
//     invite.pageOrder-оор шүүх/эрэмбэлэх болно — DOM-ыг дахин угсрахгүй, зөвхөн навигацийн
//     ЛОГИК дараалал (invPages) өөрчлөгдөнө, тул render функцүүдэд хүрэх шаардлагагүй.
//   - persuade card (id="inv-s-persuade") зориудаар data-step-гүй үлдсэн: энэ бол "дараа
//     бодъё..." товчоор орох СИДЕ detour, үндсэн дараалалд ороогүй тул enable/disable/
//     reorder-т хамаарахгүй, мөн "дараагийн" тооллогод саад болохгүй.

let invPages = [];      // [{key,id,group}] — идэвхтэй render дуудлагын бодит навигацийн дараалал
let invPageIndex = -1;  // одоогийн идэвхтэй карт invPages доtorх index (олдохгүй бол өмнөх утгаараа үлдэнэ)

// #inviteApp-ийн шинэ HTML бүрд нэг л удаа persistent прогресс-бар элемент нэмнэ (12 төрлийн
// шаблон HTML string тус бүрийг хөндөхгүйгээр) — invIndexPages() дуудагдах бүрд эхлээд үүнийг
// баталгаажуулна.
function invEnsureProgressBar() {
  const app = document.getElementById("inviteApp");
  if (!app || document.getElementById("invPageProgress")) return;
  const bar = document.createElement("div");
  bar.id = "invPageProgress";
  bar.className = "inv-page-progress";
  bar.style.display = "none";
  app.insertBefore(bar, app.firstChild);
}

function invIndexPages(invite) {
  invEnsureProgressBar();
  const cards = document.querySelectorAll("#inviteApp .inv-card[data-step]");
  let order = Array.from(cards).map(c => ({ key: c.dataset.step, id: c.id, group: c.dataset.group || null }));

  // Phase 6: enabledPages — идэвхгүй болгосон key-үүдийн ЖАГСААЛТ (allowlist биш). Улмаас
  // undefined/[] хоёулаа "бүгд идэвхтэй" гэсэн үг — хуучин invite бүр өөрчлөлтгүйгээр
  // яг өнөөгийн адилхан бүрэн дараалалтай нээгдэнэ.
  if (invite && Array.isArray(invite.enabledPages) && invite.enabledPages.length) {
    const disabled = new Set(invite.enabledPages);
    order = order.filter(p => !disabled.has(p.key));
  }
  // Phase 6: pageOrder — зөвхөн заасан key-үүдийг дахин эрэмбэлнэ; жагсаалтад ороогүй
  // (жишээ нь: invite үүсгэгдсэний дараа код дээр шинэ card нэмэгдсэн) key бол төгсгөлд нь
  // хэвээрээ орно.
  if (invite && Array.isArray(invite.pageOrder) && invite.pageOrder.length) {
    const byKey = new Map(order.map(p => [p.key, p]));
    const reordered = [];
    invite.pageOrder.forEach(k => {
      if (byKey.has(k)) { reordered.push(byKey.get(k)); byKey.delete(k); }
    });
    byKey.forEach(p => reordered.push(p));
    order = reordered;
  }

  invPages = order;
  invPageIndex = -1;
}

// Одоогийн идэвхтэй карт invPages дотор аль индекст байгааг олоод, дараагийнх руу шилжинэ.
// ~85 hardcoded onclick="invGoTo('inv-s-fixed-id')" call-ийг үүгээр сольсон — "дараагийн
// page аль нь вэ" гэдэг одоо угсарсан HTML-ийн бодит DOM дараалал дээр суурилдаг тул сендэр
// зарим optional card-ыг унтраасан/дараалал өөрчилсөн ч энд өөрчлөлт хийх шаардлагагүй.
function invAdvance() {
  const activeEl = document.querySelector("#inviteApp .inv-card.active");
  const curId = activeEl ? activeEl.id : null;
  let idx = invPages.findIndex(p => p.id === curId);
  if (idx === -1) idx = invPageIndex; // persuade зэрэг detour карт дээрээс дуудагдвал сүүлд мэдэгдэж байсан үндсэн дарааллын байрлалаас үргэлжлүүлнэ
  const next = invPages[idx + 1];
  if (next) invGoTo(next.id);
}

// invGoTo(id) (invite.js) идэвхтэй карт солигдох болгонд үүнийг дуудна — persistent
// прогресс индикаторыг (өмнө нь зөвхөн Болзооны урилга дээр байсан, тоо нь буруу байсан)
// real тооцоолсон утгаар шинэчилнэ. progressGroup-той бол тухайн бүлэг дотроо тоолно
// (жишээ нь Болзооны 4 асуулт "N / 4" гэж харагдана), group байхгүй бол нийт card тооноос.
function invRenderProgress() {
  const activeEl = document.querySelector("#inviteApp .inv-card.active");
  const curId = activeEl ? activeEl.id : null;
  const idx = invPages.findIndex(p => p.id === curId);
  if (idx !== -1) invPageIndex = idx; // detour (persuade) картанд байхад invPageIndex-ийг хэвээр нь орхино

  const el = document.getElementById("invPageProgress");
  if (!el) return;
  if (idx === -1) { el.style.display = "none"; return; }

  const cur = invPages[idx];
  let within = invPages, i = idx;
  if (cur.group) {
    within = invPages.filter(p => p.group === cur.group);
    i = within.findIndex(p => p.id === curId);
  }
  if (within.length <= 1) { el.style.display = "none"; return; }
  el.style.display = "";
  el.innerHTML = `<span class="inv-progress-dots">${within.map((p, k) => `<span class="inv-done-dot${k <= i ? " done" : ""}"></span>`).join("")}</span>
    <span class="inv-progress-text">${i + 1} / ${within.length}</span>`;
}
