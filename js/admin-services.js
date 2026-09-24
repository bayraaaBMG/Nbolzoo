// ===== ADMIN: ҮЙЛЧИЛГЭЭ / БИЗНЕСИЙН КАТАЛОГ ХЯНАЛТ =====
// Урсгал: хэрэглэгч бүртгүүлнэ (status:'pending') → admin хянана → 'approved' | 'rejected'.
// Зөвшөөрөгдсөн нь л нийтэд харагдана (firestore.rules дээр албадсан, зөвхөн UI биш).
// ТӨЛБӨР, ЗАХИАЛГА, ҮНЭЛГЭЭ ЭНД БАЙХГҮЙ — зөвхөн жагсаалт.

// ЗӨВХӨН харуулах шошго. Жинхэнэ жагсаалт нь js/services.js-ийн SERVICE_CATS —
// хоёулаа таарч байх ёстой (tests/services_test.js шалгадаг).
const SERVICE_CATEGORIES = [
  { id: "restaurant", label: "Ресторан" },
  { id: "cafe", label: "Кофе шоп" },
  { id: "flower", label: "Цэцэг" },
  { id: "gift", label: "Бэлэг" },
  { id: "photo", label: "Гэрэл зурагчин" },
  { id: "video", label: "Видео зурагчин" },
  { id: "event", label: "Эвент үйлчилгээ" },
  { id: "stay", label: "Амралтын газар" },
  { id: "activity", label: "Үйл ажиллагаа" },
  { id: "handmade", label: "Гар хийцийн бүтээгдэхүүн" },
  { id: "date", label: "Болзоонд зориулсан" },
  { id: "other", label: "Бусад" },
];
const SERVICE_STATUS_LABELS = { pending: "Хүлээгдэж буй", approved: "Зөвшөөрсөн", rejected: "Татгалзсан" };

let adminServiceStatus = "pending";

function adminServiceCatLabel(id) {
  const c = SERVICE_CATEGORIES.find(c => c.id === id);
  return c ? c.label : (id || "-");
}

async function renderAdminServices() {
  const el = document.getElementById("admin-services");
  el.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  const filters = ["pending", "approved", "rejected"].map(st =>
    `<button type="button" class="cms-type${st === adminServiceStatus ? " active" : ""}" onclick="adminSetServiceStatus('${st}')">${escapeHtml(SERVICE_STATUS_LABELS[st])}</button>`
  ).join("");
  try {
    // orderBy-г equality filter-тэй хамт ашиглавал composite index шаардагдана — үйлчилгээний
    // тоо цөөн байх тул client дээр эрэмбэлэх нь энгийн бөгөөд найдвартай (banners/reports-той ижил).
    const snap = await db.collection("services").where("status", "==", adminServiceStatus).get();
    const list = snap.docs.map(d => Object.assign({ _id: d.id }, d.data()))
      .sort((a, b) => (b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0));

    const rows = list.map(sv => {
      const acts = [];
      if (nbCan("services.review")) {
        if (sv.status !== "approved") acts.push(`<button class="btn btn-primary btn-sm" type="button" onclick="adminReviewService('${sv._id}','approved')">✓ Зөвшөөрөх</button>`);
        if (sv.status !== "rejected") acts.push(`<button class="btn btn-outline btn-sm" type="button" onclick="adminReviewService('${sv._id}','rejected')">✕ Татгалзах</button>`);
      }
      if (nbCan("services.delete")) acts.push(`<button class="btn btn-outline btn-sm" style="border-color:#ef4444;color:#ef4444" type="button" onclick="adminDeleteService('${sv._id}')">🗑 Устгах</button>`);
      return `<div class="admin-card">
        ${sv.imageUrl ? `<img src="${escapeHtml(sv.imageUrl)}" alt="" class="admin-card-thumb">` : ""}
        <div class="admin-card-main">
          <strong>${escapeHtml(sv.name || "(нэргүй)")}</strong>
          <div class="admin-card-meta">${escapeHtml(adminServiceCatLabel(sv.category))}${sv.district ? " · " + escapeHtml(sv.district) : ""} · ${escapeHtml(sv.submittedByName || "?")} · ${timeAgo(sv.createdAt)}</div>
          <div class="admin-card-desc">${escapeHtml(sv.desc || "")}</div>
          <div class="admin-card-meta">
            ${sv.price ? "💸 " + escapeHtml(sv.price) + " · " : ""}
            ${sv.hours ? "🕒 " + escapeHtml(sv.hours) + " · " : ""}
            ${sv.phone ? "☎ " + escapeHtml(sv.phone) + " · " : ""}
            ${sv.website ? "🔗 " + escapeHtml(sv.website) + " " : ""}
            ${sv.social ? "💬 " + escapeHtml(sv.social) : ""}
          </div>
          ${sv.reviewNote ? `<div class="admin-card-meta">Тэмдэглэл: ${escapeHtml(sv.reviewNote)}</div>` : ""}
        </div>
        <div class="admin-card-actions">${acts.join("")}</div>
      </div>`;
    }).join("");

    el.innerHTML = `
      <div class="cms-types">${filters}</div>
      <div class="admin-note">Бүртгүүлсэн үйлчилгээ зөвхөн <strong>зөвшөөрөгдсөний дараа</strong> нийтэд харагдана. Энэ нь Firestore дүрмээр албадагдсан.</div>
      <div class="admin-list-count">${list.length} бичлэг</div>
      ${rows || `<div class="admin-empty">${escapeHtml(SERVICE_STATUS_LABELS[adminServiceStatus])} төлөвт бичлэг алга</div>`}`;
  } catch (e) {
    el.innerHTML = `<div class="cms-types">${filters}</div><div class="admin-empty">Алдаа: ${escapeHtml(e.message)}</div>`;
  }
}

function adminSetServiceStatus(st) { adminServiceStatus = st; renderAdminServices(); }

async function adminReviewService(id, status) {
  if (!nbCan("services.review")) return showToast("⚠️ Танд энэ эрх алга");
  const note = status === "rejected" ? (prompt("Татгалзах шалтгаан (эзэнд харагдана, хоосон үлдээж болно):") || "") : "";
  try {
    await db.collection("services").doc(id).update({
      status, reviewNote: note,
      reviewedBy: currentUser.uid, reviewedByName: currentUser.name,
      reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    logAdminAction(status === "approved" ? "service_approve" : "service_reject", id, note, adminServiceStatus, status);
    showToast(status === "approved" ? "✅ Зөвшөөрөгдлөө" : "Татгалзлаа");
    renderAdminServices();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

async function adminDeleteService(id) {
  if (!nbCan("services.delete")) return showToast("⚠️ Танд энэ эрх алга");
  if (!confirm("Энэ бичлэгийг бүрмөсөн устгах уу?")) return;
  try {
    await db.collection("services").doc(id).delete();
    logAdminAction("service_delete", id);
    showToast("🗑 Устгагдлаа");
    renderAdminServices();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}
