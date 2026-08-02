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
  if (!posts.length) {
    el.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--text-light);">Одоохондоо нийтлэл алга. Эхний санаагаа хуваалцаарай! 💬</div>`;
    return;
  }
  el.innerHTML = posts.map(p => `
    <div class="post">
      <div class="post-header">
        <div class="avatar">${p.authorPhoto ? `<img src="${p.authorPhoto}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : escapeHtml((p.authorName||"?").charAt(0))}</div>
        <div>
          <div class="post-author">${escapeHtml(p.authorName)}${p.feeling ? ` <span style="font-weight:400;color:var(--text-light);">санаа сэтгэл ${p.feeling}</span>` : ""}</div>
          <div class="post-time">${timeAgo(p.createdAt)}${p.location ? ` · 📍 ${escapeHtml(p.location)}` : ""}</div>
        </div>
      </div>
      <div class="post-content">${escapeHtml(p.content)}</div>
      ${p.imageUrl ? `<img src="${p.imageUrl}" loading="lazy" alt="" class="post-photo" onerror="this.remove()">` : (p.emoji ? `<div class="post-image">${p.emoji}</div>` : "")}
      ${p.budget ? `<div class="post-budget-tag">💸 ${escapeHtml(p.budget)}</div>` : ""}
      <div class="post-actions">
        <div class="post-action ${userPostLikes.has(p.id)?'liked':''}" onclick="togglePostLike('${p.id}')">
          ${userPostLikes.has(p.id)?'❤️':'🤍'} <span>${p.likeCount||0}</span>
        </div>
        <div class="post-action" onclick="toggleComments('${p.id}', this)">💬 <span id="cmt-count-${p.id}">${p.commentCount||0}</span></div>
        <div class="post-action" onclick="sharePost('${p.id}')">🔗</div>
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
  const cmts = commentsCache[postId] || [];
  section.innerHTML = `
    ${cmts.map(c => `
      <div class="comment-item">
        <div class="comment-avatar">${escapeHtml((c.authorName||"?").charAt(0))}</div>
        <div class="comment-body">
          <div class="comment-author">${escapeHtml(c.authorName)}</div>
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
  const input = document.getElementById(`cmt-input-${postId}`);
  const text = input?.value.trim();
  if (!text) return;
  input.value = "";
  try {
    await db.collection("comments").add({
      postId, authorId: currentUser.uid, authorName: currentUser.name, text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    await db.collection("posts").doc(postId).update({ commentCount: firebase.firestore.FieldValue.increment(1) });
    const post = posts.find(p => p.id === postId);
    if (post && post.authorId) createNotification(post.authorId, "comment", `${currentUser.name} таны нийтлэлд сэтгэгдэл бичлээ`, "community.html");
  } catch (e) {
    showToast("⚠️ Сэтгэгдэл илгээхэд алдаа гарлаа");
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
    showToast("⚠️ Нийтлэл нэмэхэд алдаа гарлаа");
    console.warn(e);
  }
  if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Нийтлэх"; }
}

async function deletePost(id) {
  if (!confirm("Энэ нийтлэлийг устгах уу?")) return;
  try {
    await db.collection("posts").doc(id).delete();
    showToast("🗑 Нийтлэл устгагдлаа");
  } catch (e) {
    showToast("⚠️ Устгахад алдаа гарлаа");
  }
}

function sharePost(id) {
  const url = `${location.origin}${location.pathname}#post-${id}`;
  if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => showToast("🔗 Холбоос хуулагдлаа!"));
}

subscribeToPosts();
