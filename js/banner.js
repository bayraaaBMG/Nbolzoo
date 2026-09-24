// ===== BANNER / СУРТАЛЧИЛГААНЫ СИСТЕМ (нийтийн тал) =====
// Нэг л удаа бүх идэвхтэй banner-ыг татаад, хуудсанд байгаа бүх slot-ыг дүүргэнэ.
// Байршил тус бүрд тусад нь query явуулбал хуудас бүр 3-4 уншилт хийх байсан.
//
// Хугацааг client талд шалгаж байгаа шалтгаан: "active" + огнооны хослол дээр orderBy
// хийхэд Firestore composite index шаарддаг. Banner-ийн тоо үргэлж цөөхөн байдаг тул
// бүгдийг татаад шүүх нь илүү энгийн, найдвартай (reports/services-тэй ижил хандлага).

// Хуудсанд байгаа slot бүрийн DOM id → байршлын түлхүүр.
// data-banner-slot="..." атрибуттай ЯМАР Ч элемент мөн адил ажиллана.
const BANNER_SLOTS = ["home-hero", "home-mid", "home-bottom", "ideas", "aimags", "community", "services"];

async function loadBanners() {
  const slots = document.querySelectorAll("[data-banner-slot]");
  if (!slots.length || typeof db === "undefined" || !db) return;
  let valid = [];
  try {
    const snap = await db.collection("banners").where("active", "==", true).get();
    const today = new Date().toISOString().slice(0, 10);
    valid = snap.docs
      .map(d => Object.assign({ id: d.id }, d.data()))
      // Хугацаа эхлээгүй / дууссан banner АВТОМАТААР харагдахгүй.
      .filter(b => (!b.startDate || b.startDate <= today) && (!b.endDate || b.endDate >= today))
      .filter(b => b.imageUrl)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  } catch (e) {
    // Banner ачаалагдахгүй байх нь хуудсыг эвдэх шалтгаан биш.
    console.warn("loadBanners failed:", e);
    return;
  }

  const isMobile = window.innerWidth <= 768;
  slots.forEach(slot => {
    const key = slot.dataset.bannerSlot;
    const pick = valid.find(b => b.placement === key && (!b.mobileOnly || isMobile));
    if (!pick) { slot.innerHTML = ""; return; }
    renderBanner(slot, pick);
    trackBannerEvent(pick.id, "impression");
  });
}

function renderBanner(slot, b) {
  const hasMobile = !!b.mobileImageUrl;
  const inner = `
    <span class="home-banner-label">Зар сурталчилгаа</span>
    ${hasMobile ? `<img class="home-banner-img home-banner-img-mobile" src="${escapeHtml(b.mobileImageUrl)}" alt="${escapeHtml(b.title || "")}" loading="lazy" decoding="async">` : ""}
    <img class="home-banner-img home-banner-img-desktop" src="${escapeHtml(b.imageUrl)}" alt="${escapeHtml(b.title || "")}" loading="lazy" decoding="async">`;
  // rel="sponsored" — энэ нь төлбөрт холбоос гэдгийг хайлтын систем зөв ойлгоно.
  slot.innerHTML = b.targetUrl
    ? `<a class="home-banner${hasMobile ? " has-mobile" : ""}" href="${escapeHtml(b.targetUrl)}" target="_blank" rel="noopener sponsored" onclick="trackBannerEvent('${escapeHtml(b.id)}','click')">${inner}</a>`
    : `<div class="home-banner${hasMobile ? " has-mobile" : ""}">${inner}</div>`;
}

// Banner-ийн үзэлт/даралтыг бүртгэнэ. ЗӨВХӨН нэгтгэсэн тоо гаргах зорилготой —
// хэрэглэгчийн ID, IP, хөтчийн ул мөр зэрэг хувийн мэдээлэл ОГТ хадгалахгүй.
// Бүтэлгүйтвэл чимээгүй өнгөрнө.
function trackBannerEvent(bannerId, type) {
  try {
    if (typeof db === "undefined" || !db || !bannerId) return;
    db.collection("bannerEvents").add({
      bannerId, type,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    }).catch(() => {});
  } catch (e) { /* no-op */ }
}
