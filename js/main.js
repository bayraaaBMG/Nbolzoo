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
