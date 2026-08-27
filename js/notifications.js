// ===== NOTIFICATIONS (realtime, Firestore) =====
let notifUnsub = null;
let notifItems = [];

function subscribeNotifications(uid) {
  if (!db) return;
  if (notifUnsub) notifUnsub();
  notifUnsub = db.collection("notifications")
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(30)
    .onSnapshot(snap => {
      notifItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderNotifBadge();
      if (document.getElementById("notifDropdown")?.style.display === "block") renderNotifList();
    }, err => console.warn("notifications listener error:", err));
}

function unsubscribeNotifications() {
  if (notifUnsub) { notifUnsub(); notifUnsub = null; }
  notifItems = [];
  renderNotifBadge();
}

function renderNotifBadge() {
  const badge = document.getElementById("notifBadge");
  if (!badge) return;
  const unread = notifItems.filter(n => !n.read).length;
  badge.textContent = unread > 9 ? "9+" : String(unread);
  badge.style.display = unread > 0 ? "flex" : "none";
}

function toggleNotifDropdown() {
  const dd = document.getElementById("notifDropdown");
  if (!dd) return;
  const opening = dd.style.display !== "block";
  dd.style.display = opening ? "block" : "none";
  if (opening) renderNotifList();
}

function renderNotifList() {
  const dd = document.getElementById("notifDropdown");
  if (!dd) return;
  if (!notifItems.length) {
    dd.innerHTML = `<div class="notif-empty">Мэдэгдэл алга</div>`;
    return;
  }
  dd.innerHTML = notifItems.map(n => `
    <div class="notif-item ${n.read?'':'unread'}" onclick="openNotif('${n.id}')">
      <div class="notif-msg">${escapeHtml(n.message)}</div>
      <div class="notif-time">${timeAgo(n.createdAt)}</div>
    </div>
  `).join("");
}

async function openNotif(id) {
  const n = notifItems.find(x => x.id === id);
  if (!n) return;
  if (!n.read && db) {
    try { await db.collection("notifications").doc(id).update({ read: true }); } catch(e) { console.warn(e); }
  }
  if (n.link) location.href = n.link;
}

function timeAgo(ts) {
  if (!ts || !ts.toDate) return "дөнгөж сая";
  const diffMs = Date.now() - ts.toDate().getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "дөнгөж сая";
  if (mins < 60) return mins + " мин өмнө";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + " цаг өмнө";
  return Math.floor(hrs / 24) + " өдөр өмнө";
}

// targetUid хэрэглэгчид зориулж мэдэгдэл үүсгэнэ (өөрөө өөртөө мэдэгдэл үүсгэхгүй)
async function createNotification(targetUid, type, message, link) {
  if (!db || !targetUid || !currentUser || targetUid === currentUser.uid) return;
  try {
    await db.collection("notifications").add({
      uid: targetUid, type, message, link: link || "", read: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) { console.warn("createNotification error:", e); }
}

document.addEventListener("click", (e) => {
  const bell = document.getElementById("notifBell");
  const dd = document.getElementById("notifDropdown");
  if (bell && dd && !bell.contains(e.target)) dd.style.display = "none";
});
