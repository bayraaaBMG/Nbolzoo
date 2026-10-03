// Хуудас бүрт орох нийтлэг код (modal, back-to-top)
document.getElementById("modal").addEventListener("click", e => {
  if(e.target.id === "modal") closeModal();
});

document.getElementById("authModal").addEventListener("click", e => {
  if(e.target.id === "authModal") closeAuth();
});

// Back-to-top
window.addEventListener("scroll", () => {
  const btn = document.getElementById("backToTop");
  if(btn) btn.classList.toggle("visible", window.scrollY > 400);
});

// Admin-аас тохируулсан өнгө / цэс / нүүр хуудсын тохиргоог хэрэгжүүлнэ.
// Бүтэлгүйтвэл хуудас анхны байдлаараа хэвийн ажиллана (js/site-settings.js-ийг үзнэ үү).
if (typeof applySiteSettings === "function") {
  applySiteSettings().catch(e => console.warn("applySiteSettings failed:", e));
}

// Хуудсанд banner slot байвал дүүргэнэ (js/banner.js). Slot байхгүй бол юу ч хийхгүй.
if (typeof loadBanners === "function") {
  loadBanners().catch(e => console.warn("loadBanners failed:", e));
}

// Sticky толгойн БОДИТ өндрийг хэмжиж --head-h -д бичнэ.
//
// CSS дээр breakpoint тутамд ойролцоо утга бичсэн ч, фонт ачаалагдах,
// нэвтэрсэн/нэвтрээгүй, PWA товч гарах зэргээс болж өндөр өөрчлөгддөг.
// Буруу утга нь шүүлтүүрийн sticky мөр толгой дор нуугдах, якорь руу
// үсрэхэд контент далдлагдах зэрэг эвдрэл үүсгэнэ — тиймээс хэмжиж тавина.
(function syncHeadHeight() {
  const head = document.querySelector(".site-head");
  // Энэ бол зөвхөн нарийвчлал нэмэх зүйл — CSS дээр breakpoint тутамд ажиллах
  // утга аль хэдийн бий. Тиймээс ямар ч эргэлзээтэй орчинд чимээгүй гарна,
  // хуудас ачаалахыг хэзээ ч зогсоохгүй.
  if (!head || typeof head.getBoundingClientRect !== "function") return;
  const apply = () => {
    try {
      const h = Math.round(head.getBoundingClientRect().height);
      if (h > 0) document.documentElement.style.setProperty("--head-h", h + "px");
    } catch (e) { /* хэмжиж чадсангүй — CSS-ийн утга хэвээр үйлчилнэ */ }
  };
  apply();
  window.addEventListener("resize", apply);
  // Фонт ачаалагдахад мөрийн өндөр өөрчлөгдөж болзошгүй.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(apply).catch(() => {});
  // Нэвтрэлтийн төлөв солигдоход товчнууд солигдож өндөр өөрчлөгдөнө.
  if (window.ResizeObserver) new ResizeObserver(apply).observe(head);
})();
