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

// Хосууд бие биенээсээ суралцаж хамтдаа хөгждөг social community: нийтлэл бүр эдгээр 6
// төрлийн аль нэгийг сонгож болно (сонгохгүй бол "ерөнхий" 💬 хэвээр).
const POST_TYPES = [
  { id: "advice", emoji: "💡", label: "Зөвлөгөө" },
  { id: "relationship", emoji: "❤️", label: "Харилцаа" },
  { id: "dateshare", emoji: "📸", label: "Бидний болзоо" },
  { id: "travel", emoji: "✈️", label: "Аялал" },
  { id: "surprise", emoji: "🎁", label: "Сюрприз" },
  { id: "question", emoji: "❓", label: "Асуулт" },
];
function postTypeInfo(type) { return POST_TYPES.find(t => t.id === type) || null; }

let selectedPostType = "";        // compose form-ийн сонгосон төрөл ("" = ерөнхий)
let selectedPostVisibility = "public";
let currentFeedTab = "all";       // "all" | "following" | "trending"

function selectPostType(type) {
  selectedPostType = type;
  document.querySelectorAll(".post-type-chip").forEach(chip => chip.classList.toggle("active", chip.dataset.type === type));
}

function selectPostVisibility(v) {
  selectedPostVisibility = v;
}

function selectFeedTab(tab) {
  currentFeedTab = tab;
  document.querySelectorAll(".feed-tab").forEach(t => t.classList.toggle("active", t.dataset.feed === tab));
  renderPosts();
}

function visiblePostsForFeed() {
  // Admin-hidden posts (moderation) never show in the public feed, even to their own author.
  // Private posts only ever show to their own author — everyone else's Firestore read is
  // already blocked at the rules layer, but the local realtime cache can still briefly hold
  // a stale copy right after the author flips visibility, so this stays defense-in-depth.
  let list = posts.filter(p => !p.hidden && (p.visibility !== "private" || (currentUser && p.authorId === currentUser.uid)));
  if (currentFeedTab === "following") {
    list = list.filter(p => currentUser && (followingSet.has(p.authorId) || p.authorId === currentUser.uid));
  } else if (currentFeedTab === "trending") {
    list = list.filter(p => (p.helpfulCount || 0) > 0).sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0));
  }
  return list;
}

function renderFeedTabs() {
  const el = document.getElementById("feedTabs");
  if (!el) return;
  el.innerHTML = `
    <div class="feed-tab ${currentFeedTab === "all" ? "active" : ""}" data-feed="all" onclick="selectFeedTab('all')">🏠 Бүгд</div>
    <div class="feed-tab ${currentFeedTab === "following" ? "active" : ""}" data-feed="following" onclick="selectFeedTab('following')">👥 Дагасан</div>
    <div class="feed-tab ${currentFeedTab === "trending" ? "active" : ""}" data-feed="trending" onclick="selectFeedTab('trending')">🔥 Шилдэг</div>`;
}

function renderPosts() {
  const el = document.getElementById("postsList");
  if (!el) return;
  renderFeedTabs();
  const visible = visiblePostsForFeed();
  if (!visible.length) {
    const emptyMsg = currentFeedTab === "following"
      ? `Одоогоор дагасан хүмүүсийн нийтлэл алга. Сонирхолтой хүмүүсийг дагаад эхлээрэй! 👥`
      : currentFeedTab === "trending"
      ? `Одоогоор "Хэрэгтэй" гэж тэмдэглэгдсэн нийтлэл алга.`
      : `Одоохондоо нийтлэл алга. Эхний санаагаа хуваалцаарай! 💬`;
    el.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--text-light);">${emptyMsg}</div>`;
    return;
  }
  el.innerHTML = visible.map(p => {
    const typeInfo = postTypeInfo(p.type);
    const isOwn = currentUser && currentUser.uid === p.authorId;
    return `
    <div class="post">
      <div class="post-header">
        <div class="avatar" onclick="openUserProfile('${p.authorId}')" style="cursor:pointer;">${p.authorPhoto ? `<img src="${escapeHtml(p.authorPhoto)}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : escapeHtml((p.authorName||"?").charAt(0))}</div>
        <div style="flex:1;min-width:0;">
          <div class="post-author">
            <span onclick="openUserProfile('${p.authorId}')" style="cursor:pointer;">${escapeHtml(p.authorName)}</span>${p.authorType === "couple" ? " 💑" : ""}${p.feeling ? ` <span style="font-weight:400;color:var(--text-light);">санаа сэтгэл ${p.feeling}</span>` : ""}
          </div>
          <div class="post-time">${timeAgo(p.createdAt)}${p.location ? ` · 📍 ${escapeHtml(p.location)}` : ""}${p.visibility === "private" ? ` · 🔒 Зөвхөн танд` : ""}</div>
        </div>
        ${typeInfo ? `<div class="post-type-badge">${typeInfo.emoji} ${typeInfo.label}</div>` : ""}
        ${(currentUser && !isOwn) ? `<button type="button" class="post-follow-btn ${followingSet.has(p.authorId) ? "is-following" : ""}" onclick="toggleFollow('${p.authorId}')">${followingSet.has(p.authorId) ? "✓ Дагасан" : "+ Дагах"}</button>` : ""}
      </div>
      <div class="post-content">${escapeHtml(p.content)}</div>
      ${p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" loading="lazy" alt="" class="post-photo" onerror="this.remove()">` : (p.emoji ? `<div class="post-image">${p.emoji}</div>` : "")}
      ${p.budget ? `<div class="post-budget-tag">💸 ${escapeHtml(p.budget)}</div>` : ""}
      <div class="post-actions">
        <div class="post-action ${userPostLikes.has(p.id)?'liked':''}" onclick="togglePostLike('${p.id}')">
          ${userPostLikes.has(p.id)?'❤️':'🤍'} <span>${p.likeCount||0}</span>
        </div>
        <div class="post-action ${userHelpfulVotes.has(p.id)?'liked':''}" onclick="toggleHelpful('${p.id}')" title="Хэрэгтэй зөвлөгөө">
          👍 <span>${p.helpfulCount||0}</span>
        </div>
        <div class="post-action" onclick="toggleComments('${p.id}', this)">💬 <span id="cmt-count-${p.id}">${p.commentCount||0}</span></div>
        <div class="post-action ${savedPostsSet.has(p.id)?'liked':''}" onclick="toggleSavePost('${p.id}')" title="Хадгалах">${savedPostsSet.has(p.id) ? "🔖" : "📑"}</div>
        <div class="post-action" onclick="sharePost('${p.id}')">🔗</div>
        ${(currentUser && !isOwn) ? `<div class="post-action" onclick="openReportModal('post','${p.id}','${p.authorId}')" title="Мэдэгдэх">🚩</div>` : ""}
        ${(currentUser && (isOwn || currentUser.isAdmin)) ? `<div class="post-action" onclick="deletePost('${p.id}')">🗑</div>` : ""}
      </div>
      <div class="comments-section" id="comments-${p.id}" style="display:none;"></div>
    </div>`;
  }).join("");
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

// "👍 Хэрэгтэй зөвлөгөө" — ❤️-с тусдаа, өөрийн helpfulVotes/helpfulCount-той reaction. Хамгийн
// их "хэрэгтэй" гэж тэмдэглэгдсэн нийтлэлүүд Шилдэг feed tab-д гардаг (visiblePostsForFeed()).
async function toggleHelpful(id) {
  if (!currentUser) return showToast("⚠️ Эхлээд нэвтэрнэ үү");
  const wasHelpful = userHelpfulVotes.has(id);
  const voteId = currentUser.uid + "_" + id;
  if (wasHelpful) userHelpfulVotes.delete(id); else userHelpfulVotes.add(id);
  renderPosts();
  try {
    const postRef = db.collection("posts").doc(id);
    if (wasHelpful) {
      await db.collection("helpfulVotes").doc(voteId).delete();
      await postRef.update({ helpfulCount: firebase.firestore.FieldValue.increment(-1) });
    } else {
      await db.collection("helpfulVotes").doc(voteId).set({
        uid: currentUser.uid, postId: id,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      await postRef.update({ helpfulCount: firebase.firestore.FieldValue.increment(1) });
      const post = posts.find(p => p.id === id);
      if (post && post.authorId) createNotification(post.authorId, "helpful", `${currentUser.name} таны зөвлөгөөг хэрэгтэй гэж тэмдэглэлээ`, "community.html");
    }
  } catch (e) {
    if (wasHelpful) userHelpfulVotes.add(id); else userHelpfulVotes.delete(id);
    renderPosts();
    showToast("⚠️ Тэмдэглэхэд алдаа гарлаа");
    console.warn("toggleHelpful error:", e);
  }
}

async function toggleSavePost(id) {
  if (!currentUser) return showToast("⚠️ Эхлээд нэвтэрнэ үү");
  const wasSaved = savedPostsSet.has(id);
  const saveId = currentUser.uid + "_" + id;
  if (wasSaved) savedPostsSet.delete(id); else savedPostsSet.add(id);
  renderPosts();
  try {
    if (wasSaved) {
      await db.collection("savedPosts").doc(saveId).delete();
    } else {
      await db.collection("savedPosts").doc(saveId).set({
        uid: currentUser.uid, postId: id,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }
    showToast(wasSaved ? "Хадгалснаас хасагдлаа" : "🔖 Хадгаллаа");
  } catch (e) {
    if (wasSaved) savedPostsSet.add(id); else savedPostsSet.delete(id);
    renderPosts();
    showToast("⚠️ Алдаа гарлаа");
    console.warn("toggleSavePost error:", e);
  }
}

// Дагах/Дагахаа болих — targetUid==currentUser.uid бол rules-ээр аль хэдийн хориглосон.
async function toggleFollow(targetUid) {
  if (!currentUser) return openAuth("login");
  if (targetUid === currentUser.uid) return;
  const wasFollowing = followingSet.has(targetUid);
  const followId = currentUser.uid + "_" + targetUid;
  if (wasFollowing) followingSet.delete(targetUid); else followingSet.add(targetUid);
  renderPosts();
  if (typeof refreshOpenProfileModal === "function") refreshOpenProfileModal(targetUid);
  try {
    if (wasFollowing) {
      await db.collection("follows").doc(followId).delete();
    } else {
      await db.collection("follows").doc(followId).set({
        followerUid: currentUser.uid, targetUid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      if (typeof createNotification === "function") createNotification(targetUid, "follow", `${currentUser.name} таныг дагалаа`, "community.html");
    }
  } catch (e) {
    if (wasFollowing) followingSet.add(targetUid); else followingSet.delete(targetUid);
    renderPosts();
    if (typeof refreshOpenProfileModal === "function") refreshOpenProfileModal(targetUid);
    showToast("⚠️ Дагахад алдаа гарлаа");
    console.warn("toggleFollow error:", e);
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
    const postAsCoupleCheckbox = document.getElementById("postAsCoupleCheckbox");
    const postingAsCouple = postAsCoupleCheckbox && postAsCoupleCheckbox.checked && currentCouple;
    const postData = {
      authorId: currentUser.uid,
      authorName: postingAsCouple ? coupleDisplayName(currentCouple) : currentUser.name,
      authorPhoto: currentUser.photoURL || "",
      content, emoji: pendingPostImage ? "" : "💬", likeCount: 0, commentCount: 0, helpfulCount: 0,
      visibility: selectedPostVisibility === "private" ? "private" : "public",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    if (selectedPostType) postData.type = selectedPostType;
    if (postingAsCouple) { postData.authorType = "couple"; postData.coupleId = currentCouple.id; }
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
    selectPostType("");
    selectedPostVisibility = "public";
    const visSelect = document.getElementById("postVisibilitySelect");
    if (visSelect) visSelect.value = "public";
    if (postAsCoupleCheckbox) postAsCoupleCheckbox.checked = false;
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
      <button class="modal-close" onclick="closeModal()" type="button" aria-label="Хаах">×</button>
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

// ---------- Public profile (хүн бүрийн зураг/bio/нийтлэл/followers-following) ----------
let openProfileUid = null; // одоо нээлттэй байгаа профайл модалын uid (Follow товч дахин зурахад)

async function openUserProfile(uid) {
  if (!db || !uid) return;
  openProfileUid = uid;
  document.getElementById("modalContent").innerHTML = `<div class="modal-body" style="text-align:center;padding:40px 24px;">Ачааллаж байна...</div>`;
  document.getElementById("modal").classList.add("show");
  try {
    const [userSnap, postsSnap, followersCountSnap, followingCountSnap] = await Promise.all([
      db.collection("users").doc(uid).get(),
      db.collection("posts").where("authorId", "==", uid).get(), // no orderBy: avoids a composite index, sorted client-side below
      db.collection("follows").where("targetUid", "==", uid).count().get(),
      db.collection("follows").where("followerUid", "==", uid).count().get(),
    ]);
    if (!userSnap.exists) {
      document.getElementById("modalContent").innerHTML = `<div class="modal-body" style="text-align:center;padding:40px 24px;">Хэрэглэгч олдсонгүй.</div>`;
      return;
    }
    const u = userSnap.data();
    const userPosts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(p => !p.hidden && (p.visibility !== "private" || (currentUser && currentUser.uid === uid)))
      .sort((a, b) => (b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0));
    renderUserProfileModal(uid, u, userPosts, followersCountSnap.data().count, followingCountSnap.data().count);
  } catch (e) {
    console.warn("openUserProfile error:", e);
    document.getElementById("modalContent").innerHTML = `
      <div class="modal-body" style="text-align:center;padding:40px 24px;">
        <p style="margin-bottom:14px;">⚠️ Профайл ачаалахад алдаа гарлаа.</p>
        <button class="btn btn-primary" type="button" onclick="openUserProfile('${uid}')">🔄 Дахин оролдох</button>
      </div>`;
  }
}

function renderUserProfileModal(uid, u, userPosts, followersCount, followingCount) {
  const el = document.getElementById("modalContent");
  if (!el) return;
  const isOwn = currentUser && currentUser.uid === uid;
  el.innerHTML = `
    <div class="modal-header">
      <h3>👤 ${escapeHtml(u.name || "?")}</h3>
      <button class="modal-close" onclick="closeModal()" type="button" aria-label="Хаах">×</button>
    </div>
    <div class="modal-body">
      <div style="text-align:center;margin-bottom:14px;">
        <div class="avatar" style="width:72px;height:72px;font-size:28px;margin:0 auto 10px;">${u.photoURL ? `<img src="${escapeHtml(u.photoURL)}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : escapeHtml((u.name || "?").charAt(0))}</div>
        <div style="font-weight:700;font-size:17px;">${escapeHtml(u.name || "?")}</div>
        ${u.bio ? `<div style="color:var(--text-light);font-size:13px;margin-top:6px;">${escapeHtml(u.bio)}</div>` : ""}
        <div style="display:flex;justify-content:center;gap:24px;margin-top:12px;">
          <div><strong>${userPosts.length}</strong><div style="font-size:12px;color:var(--text-light);">нийтлэл</div></div>
          <div><strong>${followersCount}</strong><div style="font-size:12px;color:var(--text-light);">дагагч</div></div>
          <div><strong>${followingCount}</strong><div style="font-size:12px;color:var(--text-light);">дагасан</div></div>
        </div>
        ${(!isOwn && currentUser) ? `<button type="button" class="btn ${followingSet.has(uid) ? "btn-ghost" : "btn-primary"}" id="profileFollowBtn" style="margin-top:12px;" onclick="toggleFollow('${uid}')">${followingSet.has(uid) ? "✓ Дагасан" : "+ Дагах"}</button>` : ""}
      </div>
      <div style="border-top:1px solid var(--border);padding-top:14px;">
        ${userPosts.length ? userPosts.map(p => {
          const t = postTypeInfo(p.type);
          return `<div style="padding:10px 0;border-bottom:1px solid var(--border);font-size:13px;">
            ${t ? `<span style="color:var(--primary);">${t.emoji} ${t.label}</span> · ` : ""}${escapeHtml((p.content || "").slice(0, 100))}${(p.content || "").length > 100 ? "..." : ""}
            <div style="color:var(--text-lighter);font-size:11px;margin-top:2px;">${timeAgo(p.createdAt)} · 👍 ${p.helpfulCount || 0} · ❤️ ${p.likeCount || 0}</div>
          </div>`;
        }).join("") : `<div style="text-align:center;color:var(--text-light);padding:20px 0;">Нийтлэл алга</div>`}
      </div>
    </div>`;
}

// togglePostLike/toggleHelpful мэтийн шиг Follow ч бас optimistic тул нээлттэй профайл
// модал дээрх товчийг тэр даруй sync хийнэ (feed дээрх бусад товч renderPosts()-оор аль хэдийн шинэчлэгдсэн байна).
function refreshOpenProfileModal(uid) {
  if (openProfileUid !== uid) return;
  const modal = document.getElementById("modal");
  if (!modal || !modal.classList.contains("show")) return;
  const btn = document.getElementById("profileFollowBtn");
  if (!btn) return;
  btn.textContent = followingSet.has(uid) ? "✓ Дагасан" : "+ Дагах";
  btn.className = "btn " + (followingSet.has(uid) ? "btn-ghost" : "btn-primary");
}

// ---------- community.html-ийн auth-resolve хугацаанд дуудагдана (admin.html-тай ижил хэв
// маяг): "Хосоороо нийтлэх" checkbox зөвхөн currentCouple байгаа үед харагдана. ----------
async function initCommunityExtras() {
  const coupleRow = document.getElementById("postAsCoupleRow");
  if (!currentUser) { if (coupleRow) coupleRow.style.display = "none"; return; }
  try {
    if (typeof loadCoupleData === "function") await loadCoupleData();
  } catch (e) { console.warn("initCommunityExtras loadCoupleData error:", e); }
  if (coupleRow) coupleRow.style.display = (typeof currentCouple !== "undefined" && currentCouple) ? "block" : "none";
}

subscribeToPosts();
