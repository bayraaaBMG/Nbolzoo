#!/usr/bin/env node
// ===== АССЕТЫН ХУВИЛБАР ТАМГА =====
//
// Асуудал: хэрэглэгчийн хөтөч (эсвэл хуучин service worker) хуучин CSS/JS-ийг
// кэшнээс үзүүлсээр байв. Сервер зөв файл өгч байсан ч утсан дээр хуучин
// загвар харагдана — засвар "хүрэхгүй".
//
// Шийдэл: файлын АГУУЛГЫН хэшийг URL-д тамгална (style.css?v=a1b2c3d4).
// Агуулга өөрчлөгдвөл URL өөрчлөгдөнө → ямар ч кэш түүнийг ШИНЭ нөөц гэж
// үзэж заавал татна. Агуулга өөрчлөгдөөгүй бол URL хэвээр → кэш хэвээр
// ажиллана (дэмий дахин татахгүй).
//
// HTML нь network-first тул шинэ HTML үргэлж ирнэ, шинэ HTML дотор шинэ
// URL байна — ингэснээр "шинэ HTML + хуучин CSS" гэсэн зөрүү бүрмөсөн арилна.
//
// Ажиллуулах:  node tools/stamp-assets.js   (commit хийхийн өмнө)
//              node tools/stamp-assets.js --check   (бичихгүй, зөрүүг шалгана)

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const CHECK = process.argv.includes("--check");

function hashOf(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return null;
  return crypto.createHash("sha1").update(fs.readFileSync(p)).digest("hex").slice(0, 8);
}

let written = 0;
const stale = [];

for (const file of fs.readdirSync(ROOT).filter(f => f.endsWith(".html"))) {
  const p = path.join(ROOT, file);
  const before = fs.readFileSync(p, "utf8");

  // Зөвхөн ДОТООД css/js — CDN (gstatic г.м) болон бусад домэйныг хөндөхгүй.
  const after = before.replace(
    /(?:href|src)="((?:css|js)\/[^"?]+\.(?:css|js))(\?v=[a-f0-9]+)?"/g,
    (m, rel) => {
      const h = hashOf(rel);
      if (!h) return m;                       // файл байхгүй — хөндөхгүй
      const attr = m.startsWith("href") ? "href" : "src";
      return `${attr}="${rel}?v=${h}"`;
    }
  );

  if (after !== before) {
    if (CHECK) stale.push(file);
    else { fs.writeFileSync(p, after); written++; }
  }
}

if (CHECK) {
  if (stale.length) {
    console.log("STALE asset stamps in: " + stale.join(", "));
    console.log("Шийдэх: node tools/stamp-assets.js");
    process.exit(1);
  }
  console.log("all asset stamps up to date");
} else {
  console.log("asset stamps written to " + written + " file(s)");
}
