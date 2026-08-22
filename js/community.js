// ===== COMMUNITY: бодит Firestore дээр суурилсан realtime posts/comments/likes =====
let posts = []; // realtime кэш (Firestore-оос onSnapshot-оор дүүрнэ)
let postsUnsub = null;
const commentListeners = {}; // postId -> unsubscribe function
const commentsCache = {};    // postId -> [comment,...]

function subscribeToPosts() {
  if (!db) { renderPosts(); return; }
  if (postsUnsub) postsUnsub();
  postsUnsub = db.collection("posts").orderBy("createdAt", "desc").limit(50)
    .onSnapshot(snap => {
      posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderPosts();
    }, err => { console.warn("posts listener error:", err); renderPosts(); });
}

const POST_FEELINGS = ["😊","😍","🥰","😂","🥳","😢","😴","🤔"];

function renderPosts() {
  const el = document.getElementById("postsList");
  if (!el) return;
  // Admin-hidden posts (moderation) never show in the public feed, even to their own author.
  const visible = posts.filter(p => !p.hidden);
  if (!visible.length) {
    el.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--text-light);">Одоохондоо нийтлэл алга. Эхний санаагаа хуваалцаарай! 💬</div>`;
    return;
  }
  el.innerHTML = visible.map(p => `
    <div class="post">
      <div class="post-header">
        <div class="avatar">${p.authorPhoto ? `<img src="${escapeHtml(p.authorPhoto)}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : escapeHtml((p.authorName||"?").charAt(0))}</div>
        <div>
          <div class="post-author">${escapeHtml(p.authorName)}${p.feeling ? ` <span style="font-weight:400;color:var(--text-light);">санаа сэтгэл ${p.feeling}</span>` : ""}</div>
          <div class="post-time">${timeAgo(p.createdAt)}${p.location ? ` · 📍 ${escapeHtml(p.location)}` : ""}</div>
        </div>
      </div>
      <div class="post-content">${escapeHtml(p.content)}</div>
      ${p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" loading="lazy" alt="" class="post-photo" onerror="this.remove()">` : (p.emoji ? `<div class="post-image">${p.emoji}</div>` : "")}
      ${p.budget ? `<div class="post-budget-tag">💸 ${escapeHtml(p.budget)}</div>` : ""}
      <div class="post-actions">
        <div class="post-action ${userPostLikes.has(p.id)?'liked':''}" onclick="togglePostLike('${p.id}')">
          ${userPostLikes.has(p.id)?'❤️':'🤍'} <span>${p.likeCount||0}</span>
        </div>
        <div class="post-action" onclick="toggleComments('${p.id}', this)">💬 <span id="cmt-count-${p.id}">${p.commentCount||0}</span></div>
        <div class="post-action" onclick="sharePost('${p.id}')">🔗</div>
        ${(currentUser && currentUser.uid !== p.authorId) ? `<div class="post-action" onclick="openReportModal('post','${p.id}','${p.authorId}')" title="Мэдэгдэх">🚩</div>` : ""}
        ${(currentUser && (currentUser.uid===p.authorId || currentUser.isAdmin)) ? `<div class="post-action" onclick="deletePost('${p.id}')">🗑</div>` : ""}
      </div>
      <div class="comments-section" id="comments-${p.id}" style="display:none;"></div>
    </div>
  `).join("");
}

function toggleComments(postId, btn) {
  const section = document.getElementById(`comments-${postId}`);
  if (!section) return;
  const opening = section.style.display === "none";
  if (opening) {
    section.style.display = "block";
    btn.classList.add("liked");
    subscribeToComments(postId);
  } else {
    section.style.display = "none";
    btn.classList.remove("liked");
    if (commentListeners[postId]) { commentListeners[postId](); delete commentListeners[postId]; }
  }
}

function subscribeToComments(postId) {
  if (!db || commentListeners[postId]) return;
  commentListeners[postId] = db.collection("comments")
    .where("postId", "==", postId)
    .orderBy("createdAt", "asc")
    .onSnapshot(snap => {
      commentsCache[postId] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderComments(postId);
    }, err => console.warn("comments listener error:", err));
}

function renderComments(postId) {
  const section = document.getElementById(`comments-${postId}`);
  if (!section) return;
  // Admin-hidden comments (moderation) never show in the public thread.
  const cmts = (commentsCache[postId] || []).filter(c => !c.hidden);
  section.innerHTML = `
    ${cmts.map(c => `
      <div class="comment-item">
        <div class="comment-avatar">${c.authorPhoto ? `<img src="${escapeHtml(c.authorPhoto)}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : escapeHtml((c.authorName||"?").charAt(0))}</div>
        <div class="comment-body">
          <div class="comment-header-row">
            <div class="comment-author">${escapeHtml(c.authorName)}</div>
            <div style="display:flex;gap:6px;">
              ${(currentUser && currentUser.uid !== c.authorId) ? `<span class="comment-delete" onclick="openReportModal('comment','${c.id}','${c.authorId}')" title="Мэдэгдэх">🚩</span>` : ""}
              ${(currentUser && (currentUser.uid===c.authorId || currentUser.isAdmin)) ? `<span class="comment-delete" onclick="deleteComment('${c.id}','${postId}')" title="Устгах">🗑</span>` : ""}
            </div>
          </div>
          <div class="comment-text">${escapeHtml(c.text)}</div>
          <div class="comment-time">${timeAgo(c.createdAt)}</div>
        </div>
      </div>
    `).join("")}
    <div class="comment-input-row">
      ${currentUser
        ? `<input type="text" id="cmt-input-${postId}" placeholder="Сэтгэгдэл бичих..." onkeypress="if(event.key==='Enter')addComment('${postId}')"/>
           <button type="button" onclick="addComment('${postId}')">Илгээх</button>`
        : `<div style="padding:8px;color:var(--text-light);font-size:13px;">Сэтгэгдэл бичихийн тулд <a onclick="openAuth('login')" style="cursor:pointer;text-decoration:underline;">нэвтэрнэ үү</a></div>`}
    </div>`;
}

async function addComment(postId) {
  if (!currentUser) return showToast("⚠️ Эхлээд нэвтэрнэ үү");
  if (currentUser.banned) return showToast("⛔ Таны эрх түдгэлзүүлэгдсэн тул сэтгэгдэл бичих боломжгүй");
  const input = document.getElementById(`cmt-input-${postId}`);
  const text = input?.value.trim();
  if (!text) return;
  input.value = "";
  try {
    await db.collection("comments").add({
      postId, authorId: currentUser.uid, authorName: currentUser.name, authorPhoto: currentUser.photoURL || "", text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    await db.collection("posts").doc(postId).update({ commentCount: firebase.firestore.FieldValue.increment(1) });
    const post = posts.find(p => p.id === postId);
    if (post && post.authorId) createNotification(post.authorId, "comment", `${currentUser.name} таны нийтлэлд сэтгэгдэл бичлээ`, "community.html");
  } catch (e) {
    input.value = text;
    showToast("⚠️ Сэтгэгдэл илгээхэд алдаа гарлаа: " + (e.message || e.code || ""));
    console.warn(e);
  }
}

async function deleteComment(commentId, postId) {
  if (!confirm("Энэ сэтгэгдлийг устгах уу?")) return;
  try {
    await db.collection("comments").doc(commentId).delete();
    await db.collection("posts").doc(postId).update({ commentCount: firebase.firestore.FieldValue.increment(-1) });
  } catch (e) {
    showToast("⚠️ Сэтгэгдэл устгахад алдаа гарлаа");
    console.warn(e);
  }
}

async function togglePostLike(id) {
  if (!currentUser) return showToast("⚠️ Эхлээд нэвтэрнэ үү");
  const wasLiked = userPostLikes.has(id);
  const likeId = currentUser.uid + "_" + id;
  if (wasLiked) userPostLikes.delete(id); else userPostLikes.add(id);
  renderPosts();
  try {
    const postRef = db.collection("posts").doc(id);
    if (wasLiked) {
      await db.collection("likes").doc(likeId).delete();
      await postRef.update({ likeCount: firebase.firestore.FieldValue.increment(-1) });
    } else {
      await db.collection("likes").doc(likeId).set({
        uid: currentUser.uid, targetId: id, targetType: "post",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      await postRef.update({ likeCount: firebase.firestore.FieldValue.increment(1) });
      const post = posts.find(p => p.id === id);
      if (post && post.authorId) createNotification(post.authorId, "like", `${currentUser.name} таны нийтлэлд таалагдлаа гэж дарлаа`, "community.html");
    }
  } catch (e) {
    // Firestore write амжилтгүй бол optimistic UI-г буцааж, хэрэглэгчид харагдуулна
    if (wasLiked) userPostLikes.add(id); else userPostLikes.delete(id);
    renderPosts();
    showToast("⚠️ Таалагдсанаа тэмдэглэхэд алдаа гарлаа");
    console.warn("togglePostLike error:", e);
  }
}

// ---------- Facebook-шиг post attachments: зураг / байршил / сэтгэгдэл / зардал ----------
let pendingPostImage = null;    // File
let pendingPostLocation = null; // string
let pendingPostFeeling = null;  // emoji string
let pendingPostBudget = null;   // string

function renderPostAttachments() {
  const el = document.getElementById("postAttachments");
  if (!el) return;
  const chips = [];
  if (pendingPostImage) chips.push(`<div class="post-attach-chip">🖼 ${escapeHtml(pendingPostImage.name)} <span onclick="removePostImage()">✕</span></div>`);
  if (pendingPostLocation) chips.push(`<div class="post-attach-chip">📍 ${escapeHtml(pendingPostLocation)} <span onclick="removePostLocation()">✕</span></div>`);
  if (pendingPostFeeling) chips.push(`<div class="post-attach-chip">${pendingPostFeeling} <span onclick="removePostFeeling()">✕</span></div>`);
  if (pendingPostBudget) chips.push(`<div class="post-attach-chip">💸 ${escapeHtml(pendingPostBudget)} <span onclick="removePostBudget()">✕</span></div>`);
  el.innerHTML = chips.join("");
}

function onPostImageSelected(input) {
  const file = input.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) { showToast("⚠️ Зөвхөн зураг файл сонгоно уу"); input.value = ""; return; }
  pendingPostImage = file;
  renderPostAttachments();
}
function removePostImage() {
  pendingPostImage = null;
  const input = document.getElementById("postImageInput");
  if (input) input.value = "";
  renderPostAttachments();
}
function removePostLocation() { pendingPostLocation = null; renderPostAttachments(); }
function removePostFeeling() { pendingPostFeeling = null; renderPostAttachments(); }
function removePostBudget() { pendingPostBudget = null; renderPostAttachments(); }

function togglePostRow(rowId) {
  const row = document.getElementById(rowId);
  if (!row) return;
  const opening = row.style.display === "none";
  document.querySelectorAll(".post-inline-row").forEach(r => r.style.display = "none");
  const feelingRow = document.getElementById("postFeelingRow");
  if (feelingRow) feelingRow.style.display = "none";
  row.style.display = opening ? "flex" : "none";
  if (opening) row.querySelector("input")?.focus();
}

function commitPostLocation() {
  const input = document.getElementById("postLocationInput");
  const val = input?.value.trim();
  if (!val) return;
  pendingPostLocation = val;
  input.value = "";
  document.getElementById("postLocationRow").style.display = "none";
  renderPostAttachments();
}

function commitPostBudget() {
  const input = document.getElementById("postBudgetInput");
  const val = input?.value.trim();
  if (!val) return;
  pendingPostBudget = val;
  input.value = "";
  document.getElementById("postBudgetRow").style.display = "none";
  renderPostAttachments();
}

function togglePostFeelingPicker() {
  const row = document.getElementById("postFeelingRow");
  if (!row) return;
  const opening = row.style.display === "none";
  document.querySelectorAll(".post-inline-row").forEach(r => r.style.display = "none");
  if (opening) {
    row.innerHTML = POST_FEELINGS.map(e => `<span onclick="selectPostFeeling('${e}')">${e}</span>`).join("");
  }
  row.style.display = opening ? "flex" : "none";
}

function selectPostFeeling(emoji) {
  pendingPostFeeling = emoji;
  document.getElementById("postFeelingRow").style.display = "none";
  renderPostAttachments();
}

function resetPostAttachments() {
  pendingPostImage = null;
  pendingPostLocation = null;
  pendingPostFeeling = null;
  pendingPostBudget = null;
  const imgInput = document.getElementById("postImageInput");
  if (imgInput) imgInput.value = "";
  renderPostAttachments();
}

async function submitPost() {
  if (!currentUser) { showToast("⚠️ Нийтлэл бичихийн тулд эхлээд нэвтэрнэ үү"); openAuth("login"); return; }
  if (currentUser.banned) return showToast("⛔ Таны эрх түдгэлзүүлэгдсэн тул нийтлэл нэмэх боломжгүй");
  const input = document.getElementById("newPost");
  const content = input.value.trim();
  if (!content && !pendingPostImage) return showToast("Юу бичих юм?");

  const submitBtn = document.querySelector(".post-form-actions .btn-primary");
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Илгээж байна..."; }
  try {
    const postData = {
      authorId: currentUser.uid, authorName: currentUser.name, authorPhoto: currentUser.photoURL || "",
      content, emoji: pendingPostImage ? "" : "💬", likeCount: 0, commentCount: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    if (pendingPostLocation) postData.location = pendingPostLocation;
    if (pendingPostFeeling) postData.feeling = pendingPostFeeling;
    if (pendingPostBudget) postData.budget = pendingPostBudget;

    if (pendingPostImage && typeof uploadImageWithThumbnail === "function") {
      const path = `posts/${currentUser.uid}/${Date.now()}`;
      const { url, thumbUrl } = await uploadImageWithThumbnail(path, pendingPostImage);
      postData.imageUrl = url;
      postData.imageThumbUrl = thumbUrl;
    }

    await db.collection("posts").add(postData);
    input.value = "";
    resetPostAttachments();
    showToast("✅ Нийтлэл амжилттай нэмэгдлээ");
  } catch (e) {
    showToast("⚠️ Нийтлэл нэмэхэд алдаа гарлаа: " + (e.message || e.code || ""));
    console.warn(e);
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Нийтлэх"; }
  }
}

async function deletePost(id) {
  if (!confirm("Энэ нийтлэлийг устгах уу?")) return;
  try {
    await db.collection("posts").doc(id).delete();
    showToast("🗑 Нийтлэл устгагдлаа");
  } catch (e) {
    showToast("⚠️ Устгахад алдаа гарлаа: " + (e.message || e.code || ""));
    console.warn(e);
  }
}

function sharePost(id) {
  const url = `${location.origin}${location.pathname}#post-${id}`;
  if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => showToast("🔗 Холбоос хуулагдлаа!"));
}

// ---------- Report / flag content (feeds the admin moderation queue) ----------
function openReportModal(targetType, targetId, targetAuthorId) {
  if (!currentUser) return openAuth("login");
  document.getElementById("modalContent").innerHTML = `
    <div class="modal-header">
      <h3>🚩 Мэдэгдэх</h3>
      <button class="modal-close" onclick="closeModal()" type="button">×</button>
    </div>
    <div class="modal-body">
      <p style="color:var(--text-light);font-size:13px;margin-bottom:12px;">Энэ контент дүрэм зөрчиж байна гэж админд мэдэгдэх гэж байна.</p>
      <div class="form-group"><label>Шалтгаан (сонголтоор)</label><textarea id="reportReasonInput" rows="3" placeholder="Юу болсныг тайлбарлана уу..."></textarea></div>
      <div id="reportModalStatus" style="min-height:18px;font-size:13px;margin-bottom:8px;"></div>
      <button class="btn btn-primary" type="button" id="reportSubmitBtn" style="width:100%" onclick="submitReport('${targetType}','${targetId}','${targetAuthorId}')">Мэдэгдэл илгээх</button>
    </div>`;
  document.getElementById("modal").classList.add("show");
}

async function submitReport(targetType, targetId, targetAuthorId) {
  const reasonInput = document.getElementById("reportReasonInput");
  const reason = reasonInput ? reasonInput.value.trim() : "";
  const statusEl = document.getElementById("reportModalStatus");
  const btn = document.getElementById("reportSubmitBtn");
  if (btn) btn.disabled = true;
  if (statusEl) statusEl.textContent = "Илгээж байна...";
  try {
    let contentPreview = "", postId = null;
    if (targetType === "post") {
      const p = posts.find(x => x.id === targetId);
      contentPreview = ((p && p.content) || "").slice(0, 140);
    } else {
      for (const pid in commentsCache) {
        const c = (commentsCache[pid] || []).find(x => x.id === targetId);
        if (c) { contentPreview = (c.text || "").slice(0, 140); postId = pid; break; }
      }
    }
    await db.collection("reports").add({
      targetType, targetId, targetAuthorId: targetAuthorId || "", postId,
      contentPreview, reason,
      reporterId: currentUser.uid, reporterName: currentUser.name,
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    closeModal();
    showToast("✅ Мэдэгдэл илгээгдлээ. Баярлалаа!");
  } catch (e) {
    if (statusEl) statusEl.textContent = "⚠️ Алдаа гарлаа: " + (e.message || e.code || "");
    console.warn("submitReport error:", e);
  } finally {
    if (btn) btn.disabled = false;
  }
}

subscribeToPosts();
