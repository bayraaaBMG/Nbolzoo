// ===== NBolzoo service worker =====
//
// Стратеги нь контентын төрлөөр хуваагдана:
//
//   1. Хуудас (HTML)        → network-first. Сүлжээ байвал ҮРГЭЛЖ шинийг авна,
//                             зөвхөн тасарсан үед cache-аас үзүүлнэ.
//   2. CSS / JS             → network-first (cache нь зөвхөн офлайн нөөц).
//   3. Зураг / фонт / аудио → stale-while-revalidate. Эдгээр нь хуудасны
//                             хувилбартай холбоогүй тул хуучин хувилбар нь
//                             зохион байгуулалтыг эвдэхгүй.
//   4. Firebase / Google    → cache-д ОРОХГҮЙ, шууд сүлжээгээр.
//      / gstatic / /admin
//
// ЯАГААД CSS/JS нь network-first вэ (ӨМНӨ stale-while-revalidate байсан):
//   HTML нь network-first учраас deploy болмогц ШИНЭ HTML ирдэг. Харин CSS/JS
//   нь stale-while-revalidate байсан тул cache-ээс ХУУЧИН хувилбар гардаг байв.
//   Үр дүнд нь deploy бүрийн дараах ПЕРВЫЙ ачаалалт бүр "шинэ HTML + хуучин CSS"
//   болж, зохион байгуулалт бүрэн эвдэрдэг байсан — бодитоор тохиолдсон.
//   CSS/JS нь HTML-ийн хувилбартай САЛШГҮЙ холбоотой тул тэдгээрийг хэзээ ч
//   HTML-ээс хоцруулж болохгүй.

const VERSION = "nb-v4";
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

// Хуудасны хувилбартай САЛШГҮЙ холбоотой — хэзээ ч хоцрох ёсгүй.
function isVersionCoupled(url) {
  return /\.(css|js)$/i.test(url.pathname);
}

// Хувилбараас хамааралгүй — хуучин хувилбар нь зохион байгуулалтыг эвдэхгүй.
function isMedia(url) {
  return /\.(svg|png|jpe?g|webp|gif|avif|woff2?|ttf|mp3|ogg|ico)$/i.test(url.pathname);
}

// Сүлжээнээс авч, амжилттай бол cache-д хуулна. Cache бичилт унасан ч
// хариултыг хэзээ ч тасалдуулахгүй.
function networkFirst(req, cacheName, fallback) {
  return fetch(req)
    .then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(cacheName).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    })
    .catch(() => caches.match(req).then(hit => hit || (fallback ? caches.match(fallback) : undefined)));
}

self.addEventListener("fetch", event => {
  const req = event.request;
  // POST/PUT зэрэг нь хэзээ ч cache-д орохгүй.
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  // Гадаад домэйныг огт хөндөхгүй (Firebase/Google/CDN шууд өнгөрнө).
  if (url.origin !== self.location.origin) return;
  if (isLiveData(url)) return;

  // --- 1. Хуудас ---
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(networkFirst(req, SHELL_CACHE, "/index.html"));
    return;
  }

  // --- 2. CSS / JS: HTML-тэй хамт шинэчлэгдэх ёстой ---
  if (isVersionCoupled(url)) {
    event.respondWith(networkFirst(req, ASSET_CACHE));
    return;
  }

  // --- 3. Зураг / фонт / аудио: stale-while-revalidate ---
  if (isMedia(url)) {
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
          .catch(() => hit);
        return hit || fresh;
      })
    );
    return;
  }

  // --- 4. Бусад: шууд сүлжээгээр, хөндөхгүй ---
});
