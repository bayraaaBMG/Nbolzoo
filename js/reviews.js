// ===== ХЭРЭГЛЭГЧИЙН ҮНЭЛГЭЭ БА ТУРШЛАГА =====
//
// ЗАРЧИМ: энэ систем ХООСОН эхэлнэ. Зохиомол үнэлгээ, хуурамч сэтгэгдэл, "4.8 ★
// (1,240 үнэлгээ)" гэх мэт санаанаасаа гаргасан тоо ОГТ байхгүй. Бодит хэрэглэгч
// бичиж эхлэх хүртэл "Хараахан үнэлгээ алга" гэж ил хэлнэ — хуурамч итгэл төрүүлэхээс
// хоосон байх нь дээр.
//
// Баримтын id нь uid_ideaId — likes/saved-тай ижил хэв маяг. Үүний ач холбогдол:
//   * нэг хүн нэг санааг ЗӨВХӨН нэг удаа үнэлж чадна (дүрмээр албадсан, UI-аар биш)
//   * "би үнэлсэн эсэх" нь нэг get() — нэмэлт query шаардахгүй
//   * давхардсан үнэлгээ үүсэх боломж байхгүй тул дундаж нь хэзээ ч гажихгүй

const REVIEW_STARS = 5;
const REVIEW_MAX_LEN = 500;

// Нэг хуудсанд нэг санааны үнэлгээг дахин дахин татахгүй.
const _reviewCache = {};

function reviewDocId(uid, ideaId) { return uid + "_" + ideaId; }

// Тухайн санааны үнэлгээг татаад нэгтгэнэ. Алдаа гарвал null буцаана — тэр үед
// UI нь үнэлгээний хэсгийг ОГТ харуулахгүй (0 ★ гэж худал үзүүлэхгүй).
async function loadIdeaReviews(ideaId) {
  if (_reviewCache[ideaId]) return _reviewCache[ideaId];
  if (typeof db === "undefined" || !db) return null;
  try {
    // orderBy-г where-тэй хамт ашиглавал composite index шаардана. Нэг санааны
    // үнэлгээний тоо бага байх тул client дээр эрэмбэлэх нь энгийн бөгөөд найдвартай.
    const snap = await db.collection("ideaReviews").where("ideaId", "==", ideaId).get();
    const all = snap.docs.map(d => Object.assign({ _id: d.id }, d.data()));
    // Нуусан (модерацлагдсан) үнэлгээ дундажид ОРОХГҮЙ.
    const visible = all.filter(r => !r.hidden);
    visible.sort((a, b) => (b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0) -
                           (a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0));
    const rated = visible.filter(r => typeof r.rating === "number" && r.rating >= 1 && r.rating <= REVIEW_STARS);
    const result = {
      list: visible,
      count: rated.length,
      average: rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : null,
      mine: currentUser ? visible.find(r => r.uid === currentUser.uid) || null : null,
    };
    _reviewCache[ideaId] = result;
    return result;
  } catch (e) {
    console.warn("loadIdeaReviews failed:", e);
    return null;
  }
}

function starsHtml(value, interactive, ideaId) {
  let out = "";
  for (let i = 1; i <= REVIEW_STARS; i++) {
    const on = value !== null && value !== undefined && i <= Math.round(value);
    out += interactive
      ? `<button type="button" class="star-btn${on ? " on" : ""}" data-star="${i}"
           onclick="reviewPickStar(${ideaId}, ${i})" aria-label="${i} од">★</button>`
      : `<span class="star${on ? " on" : ""}" aria-hidden="true">★</span>`;
  }
  return out;
}

// Санааны модал дотор үнэлгээний хэсгийг зурна. Модал нь аль хэдийн нээгдсэн тул
// энэ нь async-аар дараа нь бөглөгддөг — хэрэглэгч модал нээхийн тулд хүлээхгүй.
async function renderIdeaReviews(ideaId) {
  const slot = document.getElementById("ideaReviewSlot");
  if (!slot) return;
  const data = await loadIdeaReviews(ideaId);
  if (data === null) { slot.innerHTML = ""; return; }   // уншиж чадсангүй — юу ч харуулахгүй

  const summary = data.count
    ? `<div class="review-summary">
         <span class="review-avg">${data.average.toFixed(1)}</span>
         <span class="review-stars" role="img" aria-label="${data.average.toFixed(1)} / ${REVIEW_STARS}">${starsHtml(data.average, false, ideaId)}</span>
         <span class="review-count">${data.count} хүний үнэлгээ</span>
       </div>`
    : `<p class="review-empty">Хараахан үнэлгээ алга. Явсан бол та эхний нь болоорой.</p>`;

  const form = !currentUser
    ? `<p class="review-signin"><a onclick="openAuth('login')">Нэвтэрч</a> туршлагаа хуваалцана уу.</p>`
    : data.mine
      ? `<div class="review-mine">
           <strong>Таны үнэлгээ</strong>
           <span class="review-stars">${starsHtml(data.mine.rating, false, ideaId)}</span>
           ${data.mine.text ? `<p>${escapeHtml(data.mine.text)}</p>` : ""}
           <button class="btn btn-ghost btn-sm" type="button" onclick="deleteMyReview(${ideaId})">Устгах</button>
         </div>`
      : `<div class="review-form">
           <label id="reviewStarLabel">Та хэр таалагдсан?</label>
           <div class="review-stars-pick" id="reviewStars_${ideaId}" role="group" aria-labelledby="reviewStarLabel">${starsHtml(0, true, ideaId)}</div>
           <textarea id="reviewText_${ideaId}" rows="3" maxlength="${REVIEW_MAX_LEN}"
             placeholder="Хэрхэн болсон, юу санаж байх зүйл байна уу? (сонголтоор)"></textarea>
           <div class="review-status" id="reviewStatus_${ideaId}" role="status"></div>
           <button class="btn btn-primary btn-sm" type="button" onclick="submitReview(${ideaId})">Үнэлгээ үлдээх</button>
         </div>`;

  const list = data.list.filter(r => r.text && (!data.mine || r._id !== data.mine._id));
  slot.innerHTML = `
    <div class="review-block">
      <h4>⭐ Хэрэглэгчийн туршлага</h4>
      ${summary}
      ${form}
      ${list.length ? `<div class="review-list">
        ${list.map(r => `<div class="review-item">
          <div class="review-item-head">
            <strong>${escapeHtml(r.name || "Хэрэглэгч")}</strong>
            <span class="review-stars">${starsHtml(r.rating, false, ideaId)}</span>
            <time>${timeAgo(r.createdAt)}</time>
          </div>
          <p>${escapeHtml(r.text)}</p>
        </div>`).join("")}
      </div>` : ""}
    </div>`;
}

// Од сонгох — зөвхөн UI төлөв, илгээх хүртэл юу ч бичигдэхгүй.
let _pickedStars = {};
function reviewPickStar(ideaId, n) {
  _pickedStars[ideaId] = n;
  const wrap = document.getElementById("reviewStars_" + ideaId);
  if (!wrap) return;
  wrap.querySelectorAll(".star-btn").forEach(b => {
    b.classList.toggle("on", Number(b.dataset.star) <= n);
  });
}

async function submitReview(ideaId) {
  if (!currentUser) return openAuth("login");
  const rating = _pickedStars[ideaId];
  const status = document.getElementById("reviewStatus_" + ideaId);
  if (!rating) { status.textContent = "⚠️ Од сонгоно уу"; return; }
  const text = (document.getElementById("reviewText_" + ideaId).value || "").trim().slice(0, REVIEW_MAX_LEN);
  status.textContent = "Илгээж байна...";
  try {
    await db.collection("ideaReviews").doc(reviewDocId(currentUser.uid, ideaId)).set({
      ideaId, rating, text,
      uid: currentUser.uid,
      name: currentUser.name || "Хэрэглэгч",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    delete _reviewCache[ideaId];
    delete _pickedStars[ideaId];
    showToast("✅ Баярлалаа, үнэлгээ хадгалагдлаа");
    renderIdeaReviews(ideaId);
  } catch (e) {
    status.textContent = "⚠️ Алдаа гарлаа: " + (e.message || e.code || "");
    console.warn("submitReview failed:", e);
  }
}

async function deleteMyReview(ideaId) {
  if (!currentUser) return;
  if (!confirm("Үнэлгээгээ устгах уу?")) return;
  try {
    await db.collection("ideaReviews").doc(reviewDocId(currentUser.uid, ideaId)).delete();
    delete _reviewCache[ideaId];
    showToast("🗑 Устгагдлаа");
    renderIdeaReviews(ideaId);
  } catch (e) { showToast("⚠️ Алдаа гарлаа: " + (e.message || e.code || "")); }
}
