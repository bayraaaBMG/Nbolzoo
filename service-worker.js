// ===== NBolzoo service worker =====
//
// ХУУЧИН ХУВИЛБАР ямар ч cache хийдэггүй, бүх хүсэлтийг шууд сүлжээгээр дамжуулдаг
// байсан. Тэр нь "хуучирсан контент харагдах" эрсдэлийг арилгасан боловч PWA-г
// утгагүй болгосон: суулгасан апп нь интернэт тасрахад ХООСОН цагаан хуудас болдог.
//
// Одоо стратеги нь контентын төрлөөр ХУВААГДАНА:
//
//   1. Хуудас (HTML)        → network-first. Сүлжээ байвал ҮРГЭЛЖ шинийг авна,
//                             зөвхөн тасарсан үед cache-аас үзүүлнэ. Ингэснээр
//                             шинэчлэлт хэзээ ч хоцрохгүй.
//   2. Статик файл (CSS/JS/ → stale-while-revalidate. Шууд cache-аас гаргаад
//      зураг/фонт/аудио)      арын талд шинэчилнэ. Хуудас нь ҮРГЭЛЖ сүлжээнээс
//                             шинээр ирдэг тул шинэ HTML + хуучин JS гэсэн зөрүү
//                             дараагийн ачаалалд засагдана.
//   3. Firebase / Firestore → cache-д ОРОХГҮЙ, шууд сүлжээгээр. Бодит цагийн
//      / Google / gstatic      өгөгдлийг хэзээ ч хуучирсан хувилбараар үзүүлэхгүй.
//
// Админ хуудсыг зориуд cache-д хийхгүй — тэр нь бүхэлдээ бодит цагийн өгөгдөл.

const VERSION = "nb-v3";
const SHELL_CACHE = VERSION + "-shell";
const ASSET_CACHE = VERSION + "-assets";

// Офлайн үед хамгийн багадаа нүүр хуудас нээгдэх ёстой.
const PRECACHE = ["/", "/index.html", "/css/style.css", "/logo.svg", "/manifest.json"];

self.addEventListener("install", event => {
  event.waitUntil(
    // Нэг файл ачаалагдахгүй байх нь суулгалтыг бүхэлд нь зогсоох шалтгаан биш.
    caches.open(SHELL_CACHE)
      .then(c => Promise.allSettled(PRECACHE.map(u => c.add(new Request(u, { cache: "reload" })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    // Хувилбар солигдоход хуучин cache-ийг бүрэн арилгана — эс бөгөөс хэрэглэгчийн
    // төхөөрөмж дээр хэдэн хувилбарын хог хуримтлагдана.
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-д ХЭЗЭЭ Ч оруулж болохгүй домэйн/зам.
function isLiveData(url) {
  return /(^|\.)(googleapis|gstatic|firebaseio|firebaseapp|google-analytics|googletagmanager)\.com$/.test(url.hostname)
    || url.pathname.startsWith("/admin");
}

function isStaticAsset(url) {
  return /\.(css|js|svg|png|jpe?g|webp|woff2?|mp3|ico|json)$/i.test(url.pathname);
}

self.addEventListener("fetch", event => {
  const req = event.request;
  // POST/PUT зэрэг нь хэзээ ч cache-д орохгүй; өөр домэйны хүсэлтийг хөндөхгүй.
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) {
    // Гадаад домэйн: Firebase/Google бол шууд өнгөрүүлнэ (ямар ч оролцоогүй).
    return;
  }
  if (isLiveData(url)) return;

  // --- 1. Хуудас: network-first ---
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then(c => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          // Сүлжээ тасарсан: тухайн хуудас, эс бөгөөс нүүр хуудсыг үзүүлнэ.
          caches.match(req).then(hit => hit || caches.match("/index.html"))
        )
    );
    return;
  }

  // --- 2. Статик файл: stale-while-revalidate ---
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then(hit => {
        const fresh = fetch(req)
          .then(res => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(ASSET_CACHE).then(c => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => hit);           // офлайн: cache-д байгаагаар хангана
        return hit || fresh;
      })
    );
    return;
  }

  // --- 3. Бусад: шууд сүлжээгээр, хөндөхгүй ---
});
