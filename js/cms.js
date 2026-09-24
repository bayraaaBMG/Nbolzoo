// ===== OVERLAY CMS =====
// Яагаад "overlay"? Сайтын редакцийн контент (УБ 365 санаа, 21 аймаг, бэлэг, зөвлөгөө)
// нь js/*.js файлууд дотор STATIC байдлаар байгаа — build step байхгүй тул хуудас
// шууд, хурдан render хийгддэг бөгөөд аймгийн dataset нь эх сурвалж баталгаажуулалттай
// (source / verifiedAt / needsVerification) явж ирсэн.
//
// Бүх контентыг Firestore руу нүүлгэвэл: хуудас бүр 500+ уншилт хийж, SEO/LCP муудаж,
// баталгаажуулсан өгөгдөл эрсдэлд орно. Тиймээс эх сурвалж нь JS файл ХЭВЭЭР үлдэж,
// Firestore нь зөвхөн ДАВХАРЛАСАН өөрчлөлтийг хадгална:
//
//   contentOverrides/{type} = {
//     hidden:  [id, ...]            — нуусан зүйлсийн id
//     order:   [id, ...]            — гараар өөрчилсөн дараалал (эхэнд нь)
//     edits:   { id: {title, desc, ...} }  — талбар дарж бичих
//     added:   [ {id, ...} ]        — admin-аас нэмсэн шинэ зүйл
//   }
//
// Ингэснээр нэг хуудас = НЭМЭЛТ 1 уншилт, dataset хөндөгдөхгүй, буцаах нь хялбар
// (override-ийг устгахад анхны контент яг хэвээрээ эргэж ирнэ).

const CMS_TYPES = ["ub", "aimags", "gifts", "expert", "movies"];
const CMS_TYPE_LABELS = {
  ub: "УБ 365 санаа", aimags: "Аймгууд", gifts: "Бэлэг",
  expert: "Зөвлөгөө", movies: "Кино",
};

// Нэг хуудсанд нэг төрөл л хэрэгтэй тул process бүрт cache хийнэ.
const _cmsCache = {};

// Override-ийг татна. Алдаа гарвал ХООСОН override буцаана — CMS унасан ч
// нийтийн хуудас анхны контентоороо хэвийн ажиллах ёстой (fail-open by design:
// энэ нь хамгаалалтын биш, харагдацын давхарга).
async function cmsLoadOverride(type) {
  if (_cmsCache[type]) return _cmsCache[type];
  const empty = { hidden: [], order: [], edits: {}, added: [] };
  if (typeof db === "undefined" || !db) return empty;
  try {
    const snap = await db.collection("contentOverrides").doc(type).get();
    const d = snap.exists ? snap.data() : {};
    _cmsCache[type] = {
      hidden: Array.isArray(d.hidden) ? d.hidden : [],
      order: Array.isArray(d.order) ? d.order : [],
      edits: (d.edits && typeof d.edits === "object") ? d.edits : {},
      added: Array.isArray(d.added) ? d.added : [],
    };
    return _cmsCache[type];
  } catch (e) {
    console.warn("cmsLoadOverride(" + type + ") failed:", e);
    return empty;
  }
}

// Жагсаалтад override-ийг тавина. Цэвэр функц — оролтын массивыг өөрчлөхгүй.
// idKey: тухайн төрлийн давтагдашгүй түлхүүр ("id" эсвэл "day" гэх мэт).
function cmsApply(list, ov, idKey) {
  if (!ov) return list.slice();
  const key = idKey || "id";
  const hidden = new Set((ov.hidden || []).map(String));

  // 1) admin-аас нэмсэн зүйлсийг нэгтгэнэ (id давхцвал нэмсэн нь давамгайлна)
  const added = (ov.added || []).filter(x => x && x[key] !== undefined);
  const addedIds = new Set(added.map(x => String(x[key])));
  let out = list.filter(x => !addedIds.has(String(x[key]))).concat(added);

  // 2) талбарын засварыг дарж бичнэ
  const edits = ov.edits || {};
  out = out.map(x => {
    const e = edits[String(x[key])];
    return e ? Object.assign({}, x, e) : x;
  });

  // 3) нуусныг хасна
  out = out.filter(x => !hidden.has(String(x[key])));

  // 4) гараар өгсөн дараалал — жагсаалтад байгаа нь эхэнд, бусад нь анхны дарааллаараа ард
  const order = (ov.order || []).map(String);
  if (order.length) {
    const rank = new Map(order.map((id, i) => [id, i]));
    const pinned = [], rest = [];
    out.forEach(x => (rank.has(String(x[key])) ? pinned : rest).push(x));
    pinned.sort((a, b) => rank.get(String(a[key])) - rank.get(String(b[key])));
    out = pinned.concat(rest);
  }
  return out;
}

// Нийтийн хуудсанд ашиглах товчлол: татаад шууд тавина.
async function cmsApplyTo(type, list, idKey) {
  return cmsApply(list, await cmsLoadOverride(type), idKey);
}

// Override-ийг бичнэ. ЗӨВХӨН admin+ (firestore.rules хамгаална).
//
// set({merge:true}) БИШ, update() ашиглаж байгаа шалтгаан: энэ CMS нь цэгтэй замаар
// ("edits.42") нэг талбарыг цэгцтэй шинэчилдэг бөгөөд arrayUnion/FieldValue.delete()
// зэрэг sentinel ашигладаг. set({merge:true}) нь "edits.42"-г ЦЭГТЭЙ НЭРТЭЙ ганц талбар
// гэж ойлгодог тул буруу бүтэц үүсгэнэ. update() нь цэгийг зам гэж зөв тайлдаг.
// Ганц сул тал нь баримт байхгүй үед update() алдаа өгдөг — тиймээс эхлээд хоосон
// баримтыг merge-ээр үүсгээд дахин оролдоно.
async function cmsSaveOverride(type, patch) {
  if (!CMS_TYPES.includes(type)) throw new Error("Тодорхойгүй контентын төрөл: " + type);
  const ref = db.collection("contentOverrides").doc(type);
  const payload = Object.assign({}, patch, {
    updatedBy: currentUser.uid,
    updatedByName: currentUser.name,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  try {
    await ref.update(payload);
  } catch (e) {
    if (e && e.code === "not-found") {
      await ref.set({ hidden: [], order: [], edits: {}, added: [] }, { merge: true });
      await ref.update(payload);
    } else {
      throw e;
    }
  }
  delete _cmsCache[type]; // дараагийн уншилт шинэчилсэн утгыг авна
}
