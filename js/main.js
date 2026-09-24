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
