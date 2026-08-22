// ===== БОДИТ FIREBASE AUTHENTICATION (Google + Email) =====
let currentUser = null; // { uid, name, email, photoURL, isAdmin, adminRole: 'owner'|'admin'|null }

// Цорын ганц үндсэн Owner эрхтэй account. Энэ Gmail-аар нэвтрэхэд admins/{uid}-ийг
// "owner" эрхтэйгээр автоматаар үүсгэнэ (ensureUserProfile-д). Firestore rules
// (firestore.rules-ийн isOwnerEmail()) яг ижил утгыг Firebase Auth ID token-ий
// имэйл claim-аар шалгадаг тул энэ бол зөвхөн frontend шалгалт биш — хоёр талдаа
// адилхан байлгах ёстой.
const OWNER_EMAIL = "bbayraaa20@gmail.com";

function openAuth(type) {
  document.getElementById("authModalContent").innerHTML = `
    <div class="auth-form">
      <h2>${type==='login'?'Тавтай морил! 👋':'NBolzoo-д бүртгүүл 💕'}</h2>
      <p>${type==='login'?'Бүртгэлтэй имэйлээрээ нэвтэрнэ':'Шинэ дурсамжуудаа эхлүүлье'}</p>
      <button class="btn btn-outline" type="button" style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px;" onclick="doGoogleAuth()">
        <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.03l3.05-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.97l3.05 2.33C4.66 5.17 6.65 3.58 9 3.58z"/></svg>
        Google-ээр ${type==='login'?'нэвтрэх':'бүртгүүлэх'}
      </button>
      <div class="auth-divider">эсвэл имэйлээр</div>
      ${type!=='login'?`<div class="form-group"><label>Нэр</label><input type="text" id="authName" placeholder="Таны нэр"/></div>`:''}
      <div class="form-group"><label>Имэйл</label><input type="email" id="authEmail" placeholder="email@example.com"/></div>
      <div class="form-group"><label>Нууц үг</label><input type="password" id="authPass" placeholder="••••••••"/></div>
      <button class="btn btn-primary" type="button" id="authSubmitBtn" onclick="doAuth('${type}')" style="width:100%;margin-top:4px;">${type==='login'?'Нэвтрэх':'Бүртгүүлэх'}</button>
      ${type==='login'?`<div class="auth-switch"><a onclick="doPasswordReset()">Нууц үгээ мартсан уу?</a></div>`:''}
      <div class="auth-switch">
        ${type==='login'?'Шинэ хэрэглэгч үү?':'Бүртгэлтэй юу?'} <a onclick="openAuth('${type==='login'?'signup':'login'}')">${type==='login'?'Бүртгүүлэх':'Нэвтрэх'}</a>
      </div>
    </div>`;
  document.getElementById("authModal").classList.add("show");
}

function closeAuth() { document.getElementById("authModal").classList.remove("show"); }

async function doGoogleAuth() {
  if (!auth) return showToast("⚠️ Firebase холбогдоогүй байна");
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    await ensureUserProfile(result.user, "google");
    closeAuth();
    showToast(`✅ Тавтай морил, ${result.user.displayName || "найз"}! 💕`);
  } catch (e) {
    if (e.code !== "auth/popup-closed-by-user") showToast("⚠️ Нэвтрэхэд алдаа гарлаа: " + (e.message || e.code));
  }
}

async function doAuth(type) {
  const nameEl = document.getElementById("authName");
  const email = document.getElementById("authEmail")?.value.trim();
  const pass = document.getElementById("authPass")?.value;
  if (!email || !pass) return showToast("⚠️ Имэйл болон нууц үгээ оруулна уу");
  if (pass.length < 6) return showToast("⚠️ Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой");
  if (!auth) return showToast("⚠️ Firebase холбогдоогүй байна");

  const btn = document.getElementById("authSubmitBtn");
  if (btn) { btn.disabled = true; btn.textContent = "..."; }
  try {
    if (type === "signup") {
      const name = nameEl?.value.trim() || email.split("@")[0];
      const cred = await auth.createUserWithEmailAndPassword(email, pass);
      await cred.user.updateProfile({ displayName: name });
      await ensureUserProfile(cred.user, "password", name);
      showToast(`✅ Бүртгэл амжилттай, ${name}! 💕`);
    } else {
      const cred = await auth.signInWithEmailAndPassword(email, pass);
      await ensureUserProfile(cred.user, "password");
      showToast(`✅ Тавтай морил, ${cred.user.displayName || email.split("@")[0]}! 💕`);
    }
    closeAuth();
  } catch (e) {
    showToast("⚠️ " + authErrorMessage(e.code));
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = type === "login" ? "Нэвтрэх" : "Бүртгүүлэх"; }
  }
}

async function doPasswordReset() {
  const email = document.getElementById("authEmail")?.value.trim();
  if (!email) return showToast("⚠️ Эхлээд имэйл хаягаа оруулна уу");
  try {
    await auth.sendPasswordResetEmail(email);
    showToast("✅ Нууц үг сэргээх холбоос имэйлээр илгээгдлээ");
  } catch (e) {
    showToast("⚠️ " + authErrorMessage(e.code));
  }
}

function authErrorMessage(code) {
  const map = {
    "auth/email-already-in-use": "Энэ имэйл хаяг аль хэдийн бүртгэлтэй байна",
    "auth/invalid-email": "Имэйл хаяг буруу байна",
    "auth/weak-password": "Нууц үг хэтэрхий сул байна",
    "auth/user-not-found": "Хэрэглэгч олдсонгүй",
    "auth/wrong-password": "Нууц үг буруу байна",
    "auth/invalid-credential": "Имэйл эсвэл нууц үг буруу байна",
    "auth/too-many-requests": "Хэт олон удаа буруу оролдлоо. Түр хүлээгээд дахин оролдоно уу",
  };
  return map[code] || "Алдаа гарлаа. Дахин оролдоно уу";
}

async function logoutUser() {
  try {
    await auth.signOut();
    showToast("👋 Гарлаа. Дараа уулзаарай!");
  } catch (e) {
    console.warn("logout error:", e);
  }
}

// Firestore users/{uid} баримт үүсгэх/шинэчлэх
async function ensureUserProfile(fbUser, provider, nameOverride) {
  if (!db) return;
  const ref = db.collection("users").doc(fbUser.uid);
  const snap = await ref.get();
  const name = nameOverride || fbUser.displayName || fbUser.email.split("@")[0];
  if (!snap.exists) {
    await ref.set({
      name,
      email: fbUser.email || "",
      photoURL: fbUser.photoURL || "",
      provider,
      bio: "",
      points: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    await ref.update({
      name: fbUser.displayName || snap.data().name,
      photoURL: fbUser.photoURL || snap.data().photoURL || "",
    });
  }
  await ensureOwnerAdmin(fbUser, name);
}

// Хатуу кодлогдсон Owner Gmail-аар нэвтэрсэн бол admins/{uid}-ийг "owner" эрхтэйгээр
// нэг л удаа (идэмпотент) автоматаар үүсгэнэ. Бусад хэрэглэгчид энэ функц юу ч хийхгүй.
// Бичихэд алдаа гарвал (rules эсвэл сүлжээ) чимээгүйхэн log хийгээд login-г саадгүй
// үргэлжлүүлнэ — Owner bootstrap асуудал login flow-г бүхэлд нь эвдэж болохгүй.
async function ensureOwnerAdmin(fbUser, name) {
  if (!fbUser.email || fbUser.email.toLowerCase() !== OWNER_EMAIL) return;
  try {
    const adminRef = db.collection("admins").doc(fbUser.uid);
    const adminSnap = await adminRef.get();
    if (!adminSnap.exists) {
      await adminRef.set({
        email: fbUser.email, name: name || fbUser.email.split("@")[0],
        role: "owner", addedBy: "self",
        addedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }
  } catch (e) {
    console.warn("ensureOwnerAdmin failed:", e);
  }
}

function updateAuthUI(user) {
  const authButtons = document.getElementById("navAuthButtons");
  const userInfo = document.getElementById("navUserInfo");
  const avatar = document.getElementById("navAvatar");
  const mobileAuth = document.getElementById("mobileAuthButtons");
  const adminLink = document.getElementById("navAdminLink");

  if (user) {
    if (authButtons) authButtons.style.display = "none";
    if (userInfo) userInfo.style.display = "flex";
    if (avatar) {
      if (user.photoURL) {
        avatar.innerHTML = `<img src="${user.photoURL}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      } else {
        avatar.textContent = (user.name || "?").charAt(0).toUpperCase();
      }
    }
    if (mobileAuth) mobileAuth.innerHTML = `<div style="padding:8px 4px; font-size:14px; color:var(--text);">👋 Сайн байна уу, <strong>${user.name}</strong></div><button class="btn btn-ghost" style="width:100%" type="button" onclick="logoutUser()">Гарах</button>`;
    if (adminLink) adminLink.style.display = user.isAdmin ? "" : "none";
  } else {
    if (authButtons) authButtons.style.display = "";
    if (userInfo) userInfo.style.display = "none";
    if (mobileAuth) mobileAuth.innerHTML = `<button class="btn btn-ghost" style="width:100%" type="button" onclick="openAuth('login');closeMobileMenu()">Нэвтрэх</button><button class="btn btn-primary" style="width:100%" type="button" onclick="openAuth('signup');closeMobileMenu()">Бүртгүүлэх</button>`;
    if (adminLink) adminLink.style.display = "none";
  }
}

// Тухайн хэрэглэгчийн хадгалсан санаа (saved) болон пост-лайк (likes)-ийг Firestore-оос ачаалж,
// одоо байгаа userLikes/userPostLikes Set-үүдэд оруулна (renderCard гэх мэт функцууд шууд ашиглана).
async function loadUserLikesAndSaved(uid) {
  if (!db) return;
  try {
    const savedSnap = await db.collection("saved").where("uid", "==", uid).get();
    userLikes = new Set(savedSnap.docs.map(d => d.data().ideaId));
  } catch (e) { console.warn("loadUserLikesAndSaved(saved) error:", e); }
  try {
    const likesSnap = await db.collection("likes").where("uid", "==", uid).where("targetType", "==", "post").get();
    userPostLikes = new Set(likesSnap.docs.map(d => d.data().targetId));
  } catch (e) { console.warn("loadUserLikesAndSaved(likes) error:", e); }
  try {
    const helpfulSnap = await db.collection("helpfulVotes").where("uid", "==", uid).get();
    userHelpfulVotes = new Set(helpfulSnap.docs.map(d => d.data().postId));
  } catch (e) { console.warn("loadUserLikesAndSaved(helpfulVotes) error:", e); }
  try {
    const savedPostsSnap = await db.collection("savedPosts").where("uid", "==", uid).get();
    savedPostsSet = new Set(savedPostsSnap.docs.map(d => d.data().postId));
  } catch (e) { console.warn("loadUserLikesAndSaved(savedPosts) error:", e); }
  try {
    const followSnap = await db.collection("follows").where("followerUid", "==", uid).get();
    followingSet = new Set(followSnap.docs.map(d => d.data().targetUid));
  } catch (e) { console.warn("loadUserLikesAndSaved(follows) error:", e); }

  if (document.getElementById("featuredGrid")) renderFeatured();
  if (document.getElementById("ubGrid")) renderUbIdeas();
  if (document.getElementById("savedGrid")) renderSaved();
  if (document.getElementById("postsList") && typeof renderPosts === "function") renderPosts();
}

// ===== USER PROFILE (нэр/танилцуулга/зураг засах) =====
function openProfileModal() {
  if (!currentUser) return openAuth("login");
  document.getElementById("modalContent").innerHTML = `
    <div class="modal-header">
      <h3>👤 Миний профайл</h3>
      <button class="modal-close" onclick="closeModal()" type="button">×</button>
    </div>
    <div class="modal-body">
      <div style="text-align:center;margin-bottom:16px;">
        <div class="avatar" id="profileAvatarPreview" style="width:80px;height:80px;font-size:32px;margin:0 auto 10px;">
          ${currentUser.photoURL ? `<img src="${escapeHtml(currentUser.photoURL)}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : escapeHtml((currentUser.name||"?").charAt(0))}
        </div>
        <input type="file" id="profileAvatarFile" accept="image/*" style="font-size:12px;">
      </div>
      <div class="form-group"><label>Нэр</label><input type="text" id="profileName" value="${escapeHtml(currentUser.name||"")}"></div>
      <div class="form-group"><label>Танилцуулга</label><textarea id="profileBio" rows="3">${escapeHtml(currentUser.bio||"")}</textarea></div>
      <div id="profileStatus" style="min-height:18px;font-size:13px;margin-bottom:8px;"></div>
      <button class="btn btn-primary" type="button" id="profileSaveBtn" style="width:100%" onclick="saveProfile()">Хадгалах</button>
      <button class="btn btn-ghost" type="button" style="width:100%;margin-top:10px;" onclick="openCoupleModal()">💑 Хосын дурсамж</button>
    </div>`;
  document.getElementById("modal").classList.add("show");
}

async function saveProfile() {
  const name = document.getElementById("profileName").value.trim();
  const bio = document.getElementById("profileBio").value.trim();
  const fileInput = document.getElementById("profileAvatarFile");
  const statusEl = document.getElementById("profileStatus");
  const saveBtn = document.getElementById("profileSaveBtn");
  if (!name) return showToast("⚠️ Нэрээ оруулна уу");
  if (saveBtn) saveBtn.disabled = true;
  statusEl.textContent = "Хадгалж байна...";
  try {
    const updates = { name, bio };
    if (fileInput.files && fileInput.files[0] && typeof uploadImageWithThumbnail === "function") {
      const { url } = await uploadImageWithThumbnail(`profiles/${currentUser.uid}/avatar`, fileInput.files[0]);
      updates.photoURL = url;
      await auth.currentUser.updateProfile({ photoURL: url });
    }
    await auth.currentUser.updateProfile({ displayName: name });
    await db.collection("users").doc(currentUser.uid).update(updates);
    currentUser = { ...currentUser, ...updates };
    updateAuthUI(currentUser);
    closeModal();
    showToast("✅ Профайл шинэчлэгдлээ");
  } catch (e) {
    statusEl.textContent = "⚠️ Алдаа гарлаа: " + (e.message || e.code || "Тодорхойгүй алдаа");
    console.warn("saveProfile error:", e);
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

if (auth) {
  auth.onAuthStateChanged(async (fbUser) => {
    try {
      if (fbUser) {
        let profile = { name: fbUser.displayName || fbUser.email?.split("@")[0] || "Хэрэглэгч", email: fbUser.email, photoURL: fbUser.photoURL, isAdmin: false, adminRole: null };
        if (db) {
          try {
            const snap = await db.collection("users").doc(fbUser.uid).get();
            if (snap.exists) profile = { ...profile, ...snap.data() };
            const adminSnap = await db.collection("admins").doc(fbUser.uid).get();
            profile.isAdmin = adminSnap.exists;
            profile.adminRole = adminSnap.exists ? (adminSnap.data().role || "admin") : null;
          } catch (e) { console.warn("profile load error:", e); }
        }
        currentUser = { uid: fbUser.uid, ...profile };
        updateAuthUI(currentUser);
        loadUserLikesAndSaved(fbUser.uid);
        if (typeof subscribeNotifications === "function") subscribeNotifications(fbUser.uid);
      } else {
        currentUser = null;
        userLikes = new Set();
        userPostLikes = new Set();
        userHelpfulVotes = new Set();
        savedPostsSet = new Set();
        followingSet = new Set();
        updateAuthUI(null);
        if (typeof unsubscribeNotifications === "function") unsubscribeNotifications();
        // Гарсны дараа өмнөх хэрэглэгчийн зүрх/хадгалсан төлөв дэлгэц дээр хуучин хэвээрээ
        // үлдэхгүйн тулд идэвхтэй хуудасны grid-ийг шууд дахин зурна.
        if (document.getElementById("ubGrid") && typeof renderUbIdeas === "function") renderUbIdeas();
        if (document.getElementById("featuredGrid") && typeof renderFeatured === "function") renderFeatured();
        if (document.getElementById("savedGrid") && typeof renderSaved === "function") renderSaved();
        if (document.getElementById("postsList") && typeof renderPosts === "function") renderPosts();
      }
    } catch (e) {
      // Дээрх алдаа (мэдэгдэл/лайк ачаалах, grid дахин зурах г.м. side-effect алдаа) энд
      // зогсоод байх ёстой — currentUser аль хэдийн зөв тохируулагдсан тул хуудасны өөрийн
      // init (admin.html-ийн Dashboard гэх мэт) доор ЗААВАЛ ажиллах ёстой, өөрөөр хэлбэл энэ
      // алдаа бусад бүх дараагийн init-ийг блоклож, хуудсыг бүрмөсөн хоосон үлдээж болохгүй.
      console.warn("onAuthStateChanged side-effect error:", e);
    } finally {
      // Firebase Auth async тул currentUser бэлэн болмогц хуудас өөрийн init-ээ хийх боломжтой
      // (жишээ нь admin.html — currentUser.isAdmin шалгахаас өмнө auth resolve хүлээх ёстой).
      // finally-д байрлуулснаар дээрх алдаа гарсан ч энэ мөр ЗААВАЛ ажиллана.
      if (typeof onAuthStateResolved === "function") onAuthStateResolved();
    }
  });
}
