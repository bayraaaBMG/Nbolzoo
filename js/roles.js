// ===== ROLE / PERMISSION MATRIX =====
// Гурван эрхийн түвшин. Энэ файл нь ЗӨВХӨН UI-г зөв харуулахад зориулагдсан —
// бодит хамгаалалт нь firestore.rules / storage.rules дээр байна (frontend-ийг
// хэрэглэгч чөлөөтэй өөрчилж чадна гэдгийг үргэлж таамаглана).
//
//   owner     — үндсэн эзэн. Бүх эрх. Ганцхан account (js/auth.js OWNER_EMAIL).
//               Хэн ч (өөрөө ч) owner эрхийг хасах боломжгүй.
//   admin     — өдөр тутмын удирдлага. Контент, banner, үйлчилгээ, тохиргоо.
//               Owner эрхэд хүрэхээс бусад бүх зүйл.
//   moderator — зөвхөн хяналт. Пост/сэтгэгдэл нуух, гомдол шийдэх.
//               Устгах, хэрэглэгч хориглох, тохиргоо өөрчлөх эрхгүй.

const NB_ROLES = ["owner", "admin", "moderator"];

// Эрх бүрийн жагсаалт. Шинэ эрх нэмэхдээ ЭНД нэмээд, firestore.rules дээр
// тохирох хамгаалалтыг нь ЗААВАЛ давхар нэмнэ.
const NB_PERMISSIONS = {
  owner: [
    "dashboard.view",
    "content.read", "content.hide", "content.edit", "content.create", "content.delete", "content.reorder",
    "moderation.hide", "moderation.delete", "moderation.reports",
    "users.read", "users.ban", "users.delete",
    "roles.grant", "roles.revoke", "roles.grantAdmin",
    "services.read", "services.review", "services.edit", "services.delete",
    "banners.read", "banners.manage",
    "settings.theme", "settings.navigation", "settings.homepage",
    "audit.read",
  ],
  admin: [
    "dashboard.view",
    "content.read", "content.hide", "content.edit", "content.create", "content.delete", "content.reorder",
    "moderation.hide", "moderation.delete", "moderation.reports",
    "users.read", "users.ban",
    "roles.grant", "roles.revoke",          // зөвхөн moderator түвшинд (доорх canAssignRole)
    "services.read", "services.review", "services.edit", "services.delete",
    "banners.read", "banners.manage",
    "settings.theme", "settings.navigation", "settings.homepage",
    "audit.read",
  ],
  moderator: [
    "dashboard.view",
    "content.read",
    "moderation.hide", "moderation.reports",
    "users.read",
    "services.read",
    "banners.read",
    "audit.read",
  ],
};

// Одоо нэвтэрсэн хэрэглэгчийн эрхийн түвшин. Нэвтрээгүй/эрхгүй бол null.
function nbRole() {
  if (typeof currentUser === "undefined" || !currentUser) return null;
  const r = currentUser.adminRole;
  return NB_ROLES.includes(r) ? r : null;
}

// Гол шалгалт. UI-д товч/таб харуулах эсэхийг ҮРГЭЛЖ үүгээр шийднэ.
function nbCan(permission) {
  const role = nbRole();
  if (!role) return false;
  return (NB_PERMISSIONS[role] || []).includes(permission);
}

// Хэн хэнд ямар эрх өгч чадах вэ.
//   owner → admin эсвэл moderator өгч/хасч чадна
//   admin → зөвхөн moderator өгч/хасч чадна (өөрөөсөө дээш эрх өгч чадахгүй)
//   moderator → хэнд ч эрх өгч чадахгүй
// Энэ дүрэм firestore.rules дээр мөн адил хэрэгжсэн байх ёстой.
function nbCanAssignRole(targetRole) {
  const role = nbRole();
  if (role === "owner") return targetRole === "admin" || targetRole === "moderator";
  if (role === "admin") return targetRole === "moderator";
  return false;
}

// Тухайн эрхтэй хүнийг өөрчлөх (хасах/хориглох) эрхтэй эсэх.
// Owner-ийг хэн ч хөндөж чадахгүй — энэ нь lockout-оос хамгаалдаг цорын ганц баталгаа.
function nbCanManageUserWithRole(targetRole) {
  if (targetRole === "owner") return false;
  const role = nbRole();
  if (role === "owner") return true;
  // Admin нь энгийн хэрэглэгч болон moderator-ыг удирдана, өөр admin-ыг удирдахгүй —
  // ингэснээр хоёр admin бие биенээ харилцан хасах боломжгүй болно.
  if (role === "admin") return targetRole !== "admin";
  return false;
}

const NB_ROLE_LABELS = { owner: "👑 Owner", admin: "🛡️ Admin", moderator: "🔍 Moderator" };
