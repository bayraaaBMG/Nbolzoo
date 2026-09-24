// ===== ҮЙЛЧИЛГЭЭНИЙ ЖАГСААЛТ (нийтийн тал) =====
// Хэрэглэгч бизнесээ бүртгүүлнэ → admin хянана → зөвшөөрөгдсөн нь л энд гарна.
// Төлбөр, захиалга, үнэлгээ, сэтгэгдэл ЭНД БАЙХГҮЙ — зөвхөн жагсаалт, холбоо барих мэдээлэл.
// Дүн, тоо, үнэлгээ зэрэг ямар ч зохиосон өгөгдөл байхгүй: бүх талбар нь бизнес өөрөө
// бөглөж, admin шалгасан утга.

const SERVICE_CATS = [
  { id: "restaurant", label: "Ресторан / Кафе", emoji: "🍴" },
  { id: "activity", label: "Үйл ажиллагаа", emoji: "🎯" },
  { id: "gift", label: "Бэлэг / Цэцэг", emoji: "🎁" },
  { id: "photo", label: "Гэрэл зураг", emoji: "📷" },
  { id: "stay", label: "Байр / Амралт", emoji: "🏡" },
  { id: "event", label: "Эвент", emoji: "🎉" },
  { id: "other", label: "Бусад", emoji: "✨" },
];

let servicesCache = [];
let serviceFilter = "";

function serviceCat(id) { return SERVICE_CATS.find(c => c.id === id) || { label: id || "Бусад", emoji: "✨" }; }

async function renderServices() {
  const grid = document.getElementById("servicesGrid");
  if (!grid) return;
  grid.innerHTML = `<div class="admin-loading">Ачаалж байна...</div>`;
  try {
    const snap = await db.collection("services").where("status", "==", "approved").get();
    servicesCache = snap.docs.map(d => Object.assign({ _id: d.id }, d.data()))
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", "mn"));
  } catch (e) {
    console.warn("renderServices failed:", e);
    grid.innerHTML = `<div class="admin-empty">Жагсаалтыг ачаалж чадсангүй. Дараа дахин оролдоно уу.</div>`;
    return;
  }
  renderServiceFilters();
  renderServiceGrid();
  renderMyServices();
}

// Шүүлтүүрийг ЗӨВХӨН бодитоор байгаа өгөгдлөөс гаргана — хоосон ангилал харуулахгүй.
function renderServiceFilters() {
  const el = document.getElementById("serviceFilters");
  if (!el) return;
  const counts = {};
  servicesCache.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1; });
  const present = SERVICE_CATS.filter(c => counts[c.id]);
  if (!present.length) { el.innerHTML = ""; return; }
  el.innerHTML = [`<button type="button" class="filter-chip${serviceFilter ? "" : " active"}" onclick="setServiceFilter('')">Бүгд (${servicesCache.length})</button>`]
    .concat(present.map(c => `<button type="button" class="filter-chip${serviceFilter === c.id ? " active" : ""}" onclick="setServiceFilter('${c.id}')">${c.emoji} ${escapeHtml(c.label)} (${counts[c.id]})</button>`))
    .join("");
}

function setServiceFilter(cat) { serviceFilter = cat; renderServiceFilters(); renderServiceGrid(); }

function renderServiceGrid() {
  const grid = document.getElementById("servicesGrid");
  const list = serviceFilter ? servicesCache.filter(s => s.category === serviceFilter) : servicesCache;
  if (!list.length) {
    grid.innerHTML = servicesCache.length
      ? `<div class="admin-empty">Энэ ангилалд бүртгэл алга</div>`
      : `<div class="admin-empty">Одоогоор зөвшөөрөгдсөн үйлчилгээ алга. Та эхний нь болж бүртгүүлээрэй.</div>`;
    return;
  }
  grid.innerHTML = list.map(s => {
    const c = serviceCat(s.category);
    return `<article class="card service-card">
      <div class="card-image media-fallback" style="background:${getColor(s._id.charCodeAt(0) || 1)};overflow:hidden;">
        ${s.imageUrl
          ? `<img src="${escapeHtml(s.imageUrl)}" loading="lazy" decoding="async" alt="" class="card-bg-img" onerror="imgFallback(this)"><div class="card-img-overlay"></div><span class="card-emoji-over">${c.emoji}</span>`
          : `<span class="card-emoji-over card-emoji-solo">${c.emoji}</span>`}
      </div>
      <div class="card-body">
        <div class="card-location">${escapeHtml(c.label)}${s.district ? " · " + escapeHtml(s.district) : ""}</div>
        <div class="card-title">${escapeHtml(s.name || "")}</div>
        <div class="card-desc">${escapeHtml(s.desc || "")}</div>
        <div class="service-contact">
          ${s.phone ? `<a href="tel:${escapeHtml(s.phone)}">☎ ${escapeHtml(s.phone)}</a>` : ""}
          ${s.website ? `<a href="${escapeHtml(s.website)}" target="_blank" rel="noopener nofollow">🔗 Вэбсайт</a>` : ""}
          ${s.address ? `<a href="https://www.google.com/maps/search/${encodeURIComponent(s.address)}" target="_blank" rel="noopener">📍 Газрын зураг</a>` : ""}
        </div>
      </div>
    </article>`;
  }).join("");
}

// ---------- Өөрийн бүртгүүлсэн үйлчилгээ (төлөв харах) ----------
async function renderMyServices() {
  const el = document.getElementById("myServices");
  if (!el || !currentUser) { if (el) el.innerHTML = ""; return; }
  try {
    const snap = await db.collection("services").where("ownerUid", "==", currentUser.uid).get();
    const mine = snap.docs.map(d => Object.assign({ _id: d.id }, d.data()));
    if (!mine.length) { el.innerHTML = ""; return; }
    const LBL = { pending: "⏳ Хянагдаж байна", approved: "✅ Зөвшөөрөгдсөн", rejected: "✕ Татгалзсан" };
    el.innerHTML = `<div class="my-services">
      <h3>Таны бүртгүүлсэн үйлчилгээ</h3>
      ${mine.map(s => `<div class="my-service-row">
        <strong>${escapeHtml(s.name || "")}</strong>
        <span class="my-service-status status-${escapeHtml(s.status || "pending")}">${LBL[s.status] || s.status}</span>
        ${s.status === "rejected" && s.reviewNote ? `<div class="my-service-note">Шалтгаан: ${escapeHtml(s.reviewNote)}</div>` : ""}
        <button class="btn btn-ghost btn-sm" type="button" onclick="deleteMyService('${s._id}')">Устгах</button>
      </div>`).join("")}
    </div>`;
  } catch (e) { console.warn("renderMyServices failed:", e); el.innerHTML = ""; }
}

async function deleteMyService(id) {
  if (!confirm("Энэ бүртгэлээ устгах уу?")) return;
  try {
    await db.collection("services").doc(id).delete();
    showToast("🗑 Устгагдлаа");
    renderServices();
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}

// ---------- Бүртгүүлэх маягт ----------
function openServiceForm() {
  if (!currentUser) { openAuth("login"); return showToast("Эхлээд нэвтэрнэ үү"); }
  const slot = document.getElementById("serviceFormSlot");
  slot.innerHTML = `
    <form class="service-form" onsubmit="submitService(event)">
      <h3>Үйлчилгээгээ бүртгүүлэх</h3>
      <p class="service-form-note">Илгээсний дараа админ шалгаж, зөвшөөрөгдсөний дараа нийтэд харагдана.</p>
      <div class="form-group"><label for="svcName">Нэр *</label><input type="text" id="svcName" required maxlength="80"></div>
      <div class="form-group"><label for="svcCat">Ангилал *</label>
        <select id="svcCat" required>${SERVICE_CATS.map(c => `<option value="${c.id}">${escapeHtml(c.label)}</option>`).join("")}</select>
      </div>
      <div class="form-group"><label for="svcDesc">Товч тайлбар *</label><textarea id="svcDesc" rows="3" required maxlength="400"></textarea></div>
      <div class="form-group"><label for="svcDistrict">Дүүрэг / Аймаг</label><input type="text" id="svcDistrict" maxlength="60"></div>
      <div class="form-group"><label for="svcAddress">Хаяг</label><input type="text" id="svcAddress" maxlength="160"></div>
      <div class="form-group"><label for="svcPhone">Утас</label><input type="tel" id="svcPhone" maxlength="30"></div>
      <div class="form-group"><label for="svcWeb">Вэбсайт / Facebook</label><input type="url" id="svcWeb" placeholder="https://..." maxlength="200"></div>
      <div class="form-group"><label for="svcImg">Зураг (сонголтоор)</label><input type="file" id="svcImg" accept="image/*"></div>
      <div id="svcStatus" class="service-form-status" role="status"></div>
      <div class="cms-edit-actions">
        <button class="btn btn-primary" type="submit" id="svcSubmit">Илгээх</button>
        <button class="btn btn-ghost" type="button" onclick="document.getElementById('serviceFormSlot').innerHTML=''">Болих</button>
      </div>
    </form>`;
  slot.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function submitService(ev) {
  ev.preventDefault();
  if (!currentUser) return showToast("Эхлээд нэвтэрнэ үү");
  const btn = document.getElementById("svcSubmit");
  const status = document.getElementById("svcStatus");
  const website = document.getElementById("svcWeb").value.trim();
  // http/https биш схемийг (javascript: г.м) хүлээж авахгүй — энэ нь дараа нь
  // href болж render хийгддэг тул эх үүсвэр дээр нь таслах нь хамгийн найдвартай.
  if (website && !/^https?:\/\//i.test(website)) {
    status.textContent = "⚠️ Вэбсайт нь http:// эсвэл https:// -ээр эхлэх ёстой";
    return;
  }
  btn.disabled = true;
  status.textContent = "Илгээж байна...";
  try {
    let imageUrl = "";
    const file = document.getElementById("svcImg").files[0];
    if (file) {
      status.textContent = "Зураг байршуулж байна...";
      const blob = await compressImage(file, 1200, 900, 0.85);
      imageUrl = await uploadBlobToStorage(`services/${currentUser.uid}/${Date.now()}.jpg`, blob);
    }
    await db.collection("services").add({
      name: document.getElementById("svcName").value.trim(),
      category: document.getElementById("svcCat").value,
      desc: document.getElementById("svcDesc").value.trim(),
      district: document.getElementById("svcDistrict").value.trim(),
      address: document.getElementById("svcAddress").value.trim(),
      phone: document.getElementById("svcPhone").value.trim(),
      website, imageUrl,
      status: "pending",              // rules-д ч мөн албадсан — өөрөө зөвшөөрөх боломжгүй
      ownerUid: currentUser.uid,
      submittedByName: currentUser.name,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    document.getElementById("serviceFormSlot").innerHTML = "";
    showToast("✅ Илгээгдлээ — админ шалгасны дараа нийтэд харагдана");
    renderServices();
  } catch (e) {
    status.textContent = "⚠️ Алдаа гарлаа: " + (e.message || e.code || "");
    console.warn("submitService failed:", e);
  } finally {
    btn.disabled = false;
  }
}
