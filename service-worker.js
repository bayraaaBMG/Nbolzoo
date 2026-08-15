// ===== NBolzoo — хамгийн энгийн, аюулгүй service worker =====
// Зорилго ганцхан: PWA "суулгах боломжтой" (installable) гэсэн browser-ийн шаардлагыг хангах.
// ЗОРИУДААР ямар ч offline/cache-first логик ашиглаагүй — бүх хүсэлт шууд сүлжээгээр (network)
// явна, учир нь энэ сайт Firebase/Firestore-ийн бодит цагийн өгөгдөл дээр тулгуурладаг
// (аймаг/бэлэг/кино/нийгэмлэг/урилга гэх мэт байнга шинэчлэгддэг контент). Хуучирсан хувилбар
// cache-аас үзүүлэгдэх, эсвэл шинэ өөрчлөлт харагдахгүй байх эрсдэлийг бүрэн арилгасан —
// browser дээрх өнөөгийн ажиллагаа 100% хэвээрээ, зөвхөн "суулгах" боломж нэмэгдэнэ.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
