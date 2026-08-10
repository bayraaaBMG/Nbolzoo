// ===== ХОСЫН ДУРСАМЖ (Couple Memory) =====
// Firestore схем:
//   coupleInvites/{code}   — { senderUid, senderName, status:'pending'|'accepted', partnerUid, createdAt }
//   couples/{coupleId}     — { members:[uidA,uidB], memberNames:{uid:name}, anniversaryDate, partnerInfo:{uid:{birthday,favoriteFood}}, createdAt }
//   couples/{coupleId}/memories/{memoryId} — { title, date, note, photoURL, createdBy, createdAt }

let currentCouple = null;
let coupleMemories = [];

function partnerUidOf(couple) {
  return couple.members.find(u => u !== currentUser.uid);
}

async function loadCoupleData() {
  if (!db || !currentUser) { currentCouple = null; return null; }
  const snap = await db.collection("couples").where("members", "array-contains", currentUser.uid).limit(1).get();
  currentCouple = snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  return currentCouple;
}

async function loadCoupleMemories() {
  if (!currentCouple || !db) { coupleMemories = []; return; }
  const snap = await db.collection("couples").doc(currentCouple.id).collection("memories").orderBy("date", "desc").get();
  coupleMemories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

function randomCoupleCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function generateCoupleCode() {
  if (!db || !currentUser) throw new Error("Нэвтэрнэ үү");
  const existing = await db.collection("couples").where("members", "array-contains", currentUser.uid).limit(1).get();
  if (!existing.empty) throw new Error("Та аль хэдийн хослосон байна");
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCoupleCode();
    const ref = db.collection("coupleInvites").doc(code);
    const snap = await ref.get();
    if (snap.exists) continue;
    await ref.set({
      senderUid: currentUser.uid,
      senderName: currentUser.name || "",
      status: "pending",
      partnerUid: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return code;
  }
  throw new Error("Код үүсгэхэд алдаа гарлаа, дахин оролдоно уу");
}

async function acceptCoupleCode(rawCode) {
  const code = (rawCode || "").trim().toUpperCase();
  if (!code) throw new Error("Код оруулна уу");
  if (!db || !currentUser) throw new Error("Нэвтэрнэ үү");

  const existing = await db.collection("couples").where("members", "array-contains", currentUser.uid).limit(1).get();
  if (!existing.empty) throw new Error("Та аль хэдийн хослосон байна");

  const ref = db.collection("coupleInvites").doc(code);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Код олдсонгүй");
  const inv = snap.data();
  if (inv.status !== "pending") throw new Error("Энэ код аль хэдийн ашиглагдсан байна");
  if (inv.senderUid === currentUser.uid) throw new Error("Өөрийн кодыг ашиглах боломжгүй");

  await ref.update({ status: "accepted", partnerUid: currentUser.uid });

  const coupleRef = db.collection("couples").doc();
  await coupleRef.set({
    members: [inv.senderUid, currentUser.uid],
    memberNames: { [inv.senderUid]: inv.senderName || "", [currentUser.uid]: currentUser.name || "" },
    anniversaryDate: null,
    partnerInfo: {},
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  if (typeof createNotification === "function") {
    await createNotification(inv.senderUid, "couple", `💑 ${currentUser.name || "Найз"} таны хослох хүсэлтийг зөвшөөрлөө!`, "");
  }
  return coupleRef.id;
}

async function unlinkCouple() {
  if (!currentCouple || !db) return;
  if (!confirm("Та хосоо салгахдаа итгэлтэй байна уу? Бүх дурсамж устана.")) return;
  const memSnap = await db.collection("couples").doc(currentCouple.id).collection("memories").get();
  const batch = db.batch();
  memSnap.docs.forEach(d => batch.delete(d.ref));
  batch.delete(db.collection("couples").doc(currentCouple.id));
  await batch.commit();
  currentCouple = null;
  coupleMemories = [];
  showToast("💔 Хосын холболт цуцлагдлаа");
  renderCoupleModal();
}

async function saveCoupleDetails() {
  if (!currentCouple || !db) return;
  const annivEl = document.getElementById("coupleAnniversary");
  const birthdayEl = document.getElementById("coupleBirthday");
  const foodEl = document.getElementById("coupleFavFood");

  const updates = {
    anniversaryDate: annivEl && annivEl.value ? firebase.firestore.Timestamp.fromDate(new Date(annivEl.value)) : null,
  };
  const partnerInfo = { ...(currentCouple.partnerInfo || {}) };
  partnerInfo[currentUser.uid] = {
    birthday: birthdayEl && birthdayEl.value ? firebase.firestore.Timestamp.fromDate(new Date(birthdayEl.value)) : null,
    favoriteFood: foodEl ? foodEl.value.trim() : "",
  };
  updates.partnerInfo = partnerInfo;

  await db.collection("couples").doc(currentCouple.id).update(updates);
  currentCouple = { ...currentCouple, ...updates };
  showToast("✅ Хадгаллаа");
  renderCoupleModal();
}

async function addCoupleMemory() {
  const titleEl = document.getElementById("memoryTitle");
  const dateEl = document.getElementById("memoryDate");
  const noteEl = document.getElementById("memoryNote");
  const fileEl = document.getElementById("memoryPhoto");
  const statusEl = document.getElementById("memoryStatus");
  const title = titleEl.value.trim();
  if (!title) return showToast("⚠️ Гарчиг оруулна уу");

  if (statusEl) statusEl.textContent = "Хадгалж байна...";
  try {
    let photoURL = "";
    if (fileEl.files && fileEl.files[0] && typeof uploadImageWithThumbnail === "function") {
      const { url } = await uploadImageWithThumbnail(`couples/${currentCouple.id}/memories/${Date.now()}`, fileEl.files[0]);
      photoURL = url;
    }
    await db.collection("couples").doc(currentCouple.id).collection("memories").add({
      title,
      date: dateEl.value ? firebase.firestore.Timestamp.fromDate(new Date(dateEl.value)) : firebase.firestore.FieldValue.serverTimestamp(),
      note: noteEl.value.trim(),
      photoURL,
      createdBy: currentUser.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    await loadCoupleMemories();
    renderCoupleModal();
    showToast("✅ Дурсамж нэмэгдлээ");
  } catch (e) {
    if (statusEl) statusEl.textContent = "⚠️ Алдаа: " + e.message;
  }
}

async function deleteCoupleMemory(id) {
  if (!currentCouple || !db) return;
  await db.collection("couples").doc(currentCouple.id).collection("memories").doc(id).delete();
  coupleMemories = coupleMemories.filter(m => m.id !== id);
  renderCoupleModal();
}

// ===== Огноо давхцлыг шалгах + санамж (LLM биш, deterministic) =====
const COUPLE_REMINDER_IDEAS = [
  "☕ Анх уулзсан кофешопондоо очиж, тэр өдрөө дахин ярилцаарай",
  "🌳 Богд уулын ар талаар хамт алхаарай",
  "🍽 Тусгай орой хийж, лаа асаагаад хамт хооллоорой",
  "📸 Хуучин зургуудаа хамт үзээд, шинэ зураг дарж дурсамж нэмээрэй",
  "🎁 Жижигхэн, гэнэтийн бэлэг бэлдээрэй",
];

function pickReminderIdea() {
  return COUPLE_REMINDER_IDEAS[Math.floor(Math.random() * COUPLE_REMINDER_IDEAS.length)];
}

function isTodayMonthDay(ts) {
  if (!ts || !ts.toDate) return false;
  const d = ts.toDate();
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function yearsSince(ts) {
  const now = new Date();
  return now.getFullYear() - ts.toDate().getFullYear();
}

function getCoupleReminder() {
  if (!currentCouple) return null;
  if (currentCouple.anniversaryDate && isTodayMonthDay(currentCouple.anniversaryDate)) {
    const years = yearsSince(currentCouple.anniversaryDate);
    const yearText = years > 0 ? `${years} жилийн өмнө` : "";
    return { message: `💕 ${yearText} өнөөдөр та хоёр анх уулзсан өдөр байна!`, idea: pickReminderIdea() };
  }
  for (const m of coupleMemories) {
    if (isTodayMonthDay(m.date)) {
      const years = yearsSince(m.date);
      const yearText = years > 0 ? `${years} жилийн өмнө` : "";
      return { message: `📅 ${yearText} өнөөдөр "${m.title}" болсон өдөр байна!`, idea: pickReminderIdea() };
    }
  }
  const info = currentCouple.partnerInfo || {};
  const partnerUid = partnerUidOf(currentCouple);
  const partnerBday = info[partnerUid] && info[partnerUid].birthday;
  if (partnerBday && isTodayMonthDay(partnerBday)) {
    return { message: `🎂 Өнөөдөр таны хосын төрсөн өдөр байна!`, idea: pickReminderIdea() };
  }
  return null;
}

// ===== UI =====
async function openCoupleModal() {
  if (!currentUser) return openAuth("login");
  if (!db) return showToast("⚠️ Firebase холбогдоогүй байна");
  document.getElementById("modalContent").innerHTML = `<div class="modal-body" style="text-align:center;padding:40px 24px;">Ачааллаж байна...</div>`;
  document.getElementById("modal").classList.add("show");
  try {
    await loadCoupleData();
    if (currentCouple) await loadCoupleMemories();
    renderCoupleModal();
  } catch (e) {
    console.warn("openCoupleModal error:", e);
    document.getElementById("modalContent").innerHTML = `
      <div class="modal-body" style="text-align:center;padding:40px 24px;">
        <div style="font-size:36px;margin-bottom:10px;">⚠️</div>
        <p style="margin-bottom:14px;">Ачаалахад алдаа гарлаа: ${escapeHtml(e.message || "")}</p>
        <button class="btn btn-primary" type="button" onclick="openCoupleModal()">🔄 Дахин оролдох</button>
      </div>`;
  }
}

function renderCoupleModal() {
  const el = document.getElementById("modalContent");
  if (!el) return;

  if (!currentCouple) {
    el.innerHTML = `
      <div class="modal-header">
        <h3>💑 Хосын дурсамж</h3>
        <button class="modal-close" onclick="closeModal()" type="button">×</button>
      </div>
      <div class="modal-body">
        <p style="color:var(--text-light);margin-bottom:16px;">Хосоо холбож, анхны уулзалт, дурсамж, төрсөн өдрөө хамтдаа хадгалаарай.</p>
        <div class="form-group">
          <label>Хосоо урих код үүсгэх</label>
          <button class="btn btn-primary" type="button" style="width:100%" onclick="handleGenerateCode()">Код үүсгэх</button>
          <div id="coupleCodeResult" style="margin-top:10px;font-size:14px;"></div>
        </div>
        <div class="form-group" style="margin-top:20px;">
          <label>Хосынхоо кодыг оруулах</label>
          <input type="text" id="coupleCodeInput" placeholder="жишээ: A1B2C3" style="text-transform:uppercase;">
          <button class="btn btn-ghost" type="button" style="width:100%;margin-top:8px;" onclick="handleAcceptCode()">Холбогдох</button>
        </div>
        <div id="coupleJoinStatus" style="min-height:18px;font-size:13px;"></div>
      </div>`;
    return;
  }

  const reminder = getCoupleReminder();
  const partnerUid = partnerUidOf(currentCouple);
  const partnerName = (currentCouple.memberNames && currentCouple.memberNames[partnerUid]) || "хос";
  const myInfo = (currentCouple.partnerInfo && currentCouple.partnerInfo[currentUser.uid]) || {};

  el.innerHTML = `
    <div class="modal-header">
      <h3>💑 ${escapeHtml(partnerName)}-тай хамт</h3>
      <button class="modal-close" onclick="closeModal()" type="button">×</button>
    </div>
    <div class="modal-body">
      ${reminder ? `<div style="background:var(--primary-soft);border-radius:12px;padding:14px;margin-bottom:16px;">
        <div style="font-weight:600;margin-bottom:4px;">${reminder.message}</div>
        <div style="font-size:13px;color:var(--text-light);">💡 Санал: ${reminder.idea}</div>
      </div>` : ''}
      <div class="form-group">
        <label>Анх уулзсан өдөр</label>
        <input type="date" id="coupleAnniversary" value="${currentCouple.anniversaryDate && currentCouple.anniversaryDate.toDate ? currentCouple.anniversaryDate.toDate().toISOString().slice(0,10) : ''}">
      </div>
      <div class="form-group">
        <label>Миний төрсөн өдөр</label>
        <input type="date" id="coupleBirthday" value="${myInfo.birthday && myInfo.birthday.toDate ? myInfo.birthday.toDate().toISOString().slice(0,10) : ''}">
      </div>
      <div class="form-group">
        <label>Миний дуртай хоол</label>
        <input type="text" id="coupleFavFood" value="${escapeHtml(myInfo.favoriteFood || '')}" placeholder="жишээ: Хуушуур">
      </div>
      <button class="btn btn-primary" type="button" style="width:100%" onclick="saveCoupleDetails()">Хадгалах</button>

      <div style="margin-top:24px;">
        <h4 style="margin-bottom:10px;">📸 Дурсамжууд</h4>
        <div class="form-group"><input type="text" id="memoryTitle" placeholder="Гарчиг (жишээ: Анхны болзоо)"></div>
        <div class="form-group"><input type="date" id="memoryDate"></div>
        <div class="form-group"><textarea id="memoryNote" rows="2" placeholder="Тэмдэглэл (заавал биш)"></textarea></div>
        <div class="form-group"><input type="file" id="memoryPhoto" accept="image/*" style="font-size:12px;"></div>
        <div id="memoryStatus" style="min-height:16px;font-size:13px;margin-bottom:6px;"></div>
        <button class="btn btn-ghost" type="button" style="width:100%" onclick="addCoupleMemory()">+ Дурсамж нэмэх</button>

        <div style="margin-top:16px;display:flex;flex-direction:column;gap:10px;">
          ${coupleMemories.length ? coupleMemories.map(m => `
            <div style="border:1px solid var(--border);border-radius:10px;padding:10px;display:flex;gap:10px;align-items:flex-start;">
              ${m.photoURL ? `<img src="${m.photoURL}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;flex-shrink:0;">` : ''}
              <div style="flex:1;">
                <div style="font-weight:600;font-size:14px;">${escapeHtml(m.title)}</div>
                <div style="font-size:12px;color:var(--text-light);">${m.date && m.date.toDate ? m.date.toDate().toLocaleDateString('mn-MN') : ''}</div>
                ${m.note ? `<div style="font-size:13px;margin-top:4px;">${escapeHtml(m.note)}</div>` : ''}
              </div>
              <button type="button" onclick="deleteCoupleMemory('${m.id}')" style="border:none;background:none;cursor:pointer;color:var(--text-light);">✕</button>
            </div>
          `).join('') : '<div class="empty-state">Дурсамж алга байна. Эхнийхээ нэмээрэй!</div>'}
        </div>
      </div>

      <button class="btn btn-ghost" type="button" style="width:100%;margin-top:20px;color:#B8451F;" onclick="unlinkCouple()">💔 Хосын холболт цуцлах</button>
    </div>`;
}

async function handleGenerateCode() {
  const resEl = document.getElementById("coupleCodeResult");
  resEl.textContent = "Үүсгэж байна...";
  try {
    const code = await generateCoupleCode();
    resEl.innerHTML = `Таны код: <strong style="font-size:18px;letter-spacing:2px;">${code}</strong><br>Энэ кодыг хосдоо илгээгээд, тэднийг өөрийн профайл цэсээр орж оруулахыг хүснэ үү.`;
  } catch (e) {
    resEl.textContent = "⚠️ " + e.message;
  }
}

async function handleAcceptCode() {
  const input = document.getElementById("coupleCodeInput");
  const statusEl = document.getElementById("coupleJoinStatus");
  statusEl.textContent = "Холбогдож байна...";
  try {
    await acceptCoupleCode(input.value);
    await loadCoupleData();
    await loadCoupleMemories();
    renderCoupleModal();
    showToast("💑 Амжилттай холбогдлоо!");
  } catch (e) {
    statusEl.textContent = "⚠️ " + e.message;
  }
}

// ===== 7 ХОНОГИЙН COUPLE CHALLENGE (couples/{coupleId}.challenge талбарт хадгална) =====
const CHALLENGE_DAYS = [
  { day: 1, emoji: "💛", title: "Бие биедээ 3 сайхан зүйл хэл" },
  { day: 2, emoji: "📸", title: "Хамтдаа зураг ав" },
  { day: 3, emoji: "📵", title: "30 минут утасгүй ярилц" },
  { day: 4, emoji: "🎁", title: "Жижигхэн бэлэг өг" },
  { day: 5, emoji: "🥰", title: "Анхны дурсамжаа ярилц" },
  { day: 6, emoji: "🍳", title: "Хамт хоол хий" },
  { day: 7, emoji: "🔮", title: "Ирээдүйн мөрөөдлөө ярилц" },
];

function getChallengeState() {
  if (!currentCouple) return null;
  return currentCouple.challenge || { startedAt: null, completedDays: {}, streak: 0 };
}

async function startCoupleChallenge() {
  if (!currentCouple || !db) return;
  const challenge = { startedAt: firebase.firestore.Timestamp.now(), completedDays: {}, streak: 0 };
  await db.collection("couples").doc(currentCouple.id).update({ challenge });
  currentCouple = { ...currentCouple, challenge };
}

async function markChallengeDay(day) {
  if (!currentCouple || !db) return;
  const state = getChallengeState() || {};
  const completedDays = { ...(state.completedDays || {}) };
  if (completedDays[day]) return;
  completedDays[day] = true;
  const challenge = { ...state, completedDays, streak: Object.keys(completedDays).length };
  await db.collection("couples").doc(currentCouple.id).update({ challenge });
  currentCouple = { ...currentCouple, challenge };
}

async function resetCoupleChallenge() {
  if (!currentCouple || !db) return;
  const challenge = { startedAt: firebase.firestore.Timestamp.now(), completedDays: {}, streak: 0 };
  await db.collection("couples").doc(currentCouple.id).update({ challenge });
  currentCouple = { ...currentCouple, challenge };
}
