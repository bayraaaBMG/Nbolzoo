#!/usr/bin/env node
// ===== ЗАСАХ БОЛОМЖТОЙ ТЕКСТИЙГ ТЭМДЭГЛЭХ =====
//
// Админ хуудас тус бүрийн статик текстийг засах боломжтой болгохын тулд
// тэдгээрт тогтвортой түлхүүр (data-text="<хуудас>.<хэш>") тавина.
//
// Яагаад ХЭШ вэ (индекс биш)?
//   * Индекс (page.1, page.2) бол текстийг нэг л зөөхөд бүх override буруу
//     элемент рүү шилждэг — хамгийн хортой эвдрэл.
//   * Хэш нь АНХНЫ бичвэрээс гарна. Тиймээс дараалал солиход түлхүүр хэвээр,
//     харин кодын бичвэрийг зассан үед түлхүүр өөрчлөгдөж хуучин override
//     автоматаар хүчингүй болно — яг зөв зан үйл (хөгжүүлэгч бичвэрээ зассан
//     бол admin-ийн хуучин хувилбар дээр нь дарагдах ёсгүй).
//
// Зөвхөн ШУУД текст агуулсан элементийг тэмдэглэнэ. JS-ээр дүүргэгддэг хоосон
// элемент, template literal, SVG, форм зэргийг ОГТ хөндөхгүй.
//
// ХАСАГДАХ хоёр хэсэг:
//   * header  — tools/build-header.js үүсгэдэг, дараагийн ажиллахад арчигдана
//   * footer  — аль хэдийн data-footer + admin "Footer" таб-аар удирдагддаг,
//               хоёр механизм зэрэг байвал аль нь үйлчилж байгаа нь ойлгомжгүй болно
//
// Ажиллуулах:  node tools/tag-texts.js

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");

// Товч/холбоосыг оруулаагүй — тэдний текстийг солих нь хаана хүргэхийг
// төөрөгдүүлэх эрсдэлтэй.
const TAGS = ["h1", "h2", "h3", "h4", "p", "label", "figcaption", "blockquote", "summary", "li", "td", "th"];

const keyFor = text => crypto.createHash("sha1").update(text.trim()).digest("hex").slice(0, 8);

function isEditable(inner) {
  const t = inner.trim();
  if (t.length < 3) return false;
  if (/\$\{|<script|<style|<svg|data-icon|<input|<textarea|<select|<img/i.test(t)) return false;
  // Дотроо блок элемент агуулсан бол текст нь нэг бүтэн биш.
  if (/<(div|section|ul|ol|table|tr|h[1-6]|p)\b/i.test(t)) return false;
  // Кирилл эсвэл латин үсэг заавал байх (зөвхөн тоо/эможи бол текст биш).
  if (!/[Ѐ-ӿA-Za-z]{3}/.test(t)) return false;
  return true;
}

const registry = {};
let totalNew = 0;

for (const file of fs.readdirSync(ROOT).filter(f => f.endsWith(".html"))) {
  const p = path.join(ROOT, file);
  let html = fs.readFileSync(p, "utf8");
  const page = file.replace(/\.html$/, "");
  let added = 0;

  // Хасагдах хүрээг ДАМЖЛАГА БҮРТ дахин тооцно.
  //
  // Яагаад? attribute нэмэх тутам мөр урсаж, offset-ууд шилждэг. Хил нэг л
  // удаа тооцвол урт хуудасны (privacy/terms) ТӨГСГӨЛД байгаа агуулга нь
  // хуучин footer-ийн индексээс хэтэрч, "footer дотор" гэж андуурагдан
  // чимээгүй алгасагддаг байв.
  const bounds = h => ({
    hdrA: h.indexOf("NB:HEADER:START"),
    hdrB: h.indexOf("NB:HEADER:END"),
    ftrA: h.indexOf('<footer class="footer">'),
  });

  // Нэг дамжлага хангалтгүй: гадна элементийг тэмдэглэхэд дотоодынх нь нөхцөл
  // өөрчлөгдөж, дараагийн дамжлагад шинээр тэмдэглэгдэх тохиолдол гардаг.
  // Тогтвортой болтол давтана — ингэснээр НЭГ удаа ажиллуулахад гаралт
  // идемпотент болж, тест түүнийг шалгаж чадна.
  for (let pass = 0; ; pass++) {
    let addedThisPass = 0;
    const b = bounds(html);
    const skip = i =>
      (b.hdrA >= 0 && i > b.hdrA && i < b.hdrB) ||
      (b.ftrA >= 0 && i > b.ftrA);
    for (const tag of TAGS) {
      const re = new RegExp(`<${tag}(\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "g");
      html = html.replace(re, (m, attrs, inner, offset) => {
        if (skip(offset)) return m;
        if ((attrs || "").includes("data-text")) return m;
        if (!isEditable(inner)) return m;
        // Ижил бичвэр → ижил түлхүүр. Давхардсаныг ч тэмдэглэнэ: нэг override
        // бүгдэд зэрэг үйлчилнэ, мөн гаралт идемпотент болно.
        const k = keyFor(inner);
        addedThisPass++;
        return `<${tag}${attrs || ""} data-text="${page}.${k}">${inner}</${tag}>`;
      });
    }
    added += addedThisPass;
    if (!addedThisPass) break;
    if (pass > 10) { console.log("  WARN " + file + ": did not converge in 10 passes"); break; }
  }

  if (added) fs.writeFileSync(p, html);
  totalNew += added;

  // Лавлахыг тэмдэглэгдсэн БҮХ зангилаанаас бүтээнэ (зөвхөн шинээс бус) — эс
  // бөгөөс хоёр дахь удаа ажиллуулахад лавлах хоосорч, admin нь анхны бичвэрийг
  // харуулж чадахгүй болно.
  let found = 0;
  for (const tag of TAGS) {
    const re = new RegExp(`<${tag}\\s[^>]*data-text="([^"]+)"[^>]*>([\\s\\S]*?)</${tag}>`, "g");
    let m;
    while ((m = re.exec(html))) { registry[m[1]] = m[2].trim(); found++; }
  }
  console.log("  " + file.padEnd(16) + added + " new, " + found + " total");
}

const out = "// ҮҮНИЙГ ГАРААР ЗАСАХГҮЙ — tools/tag-texts.js үүсгэдэг.\n" +
  "// data-text түлхүүр → кодод бичигдсэн АНХНЫ бичвэр.\n" +
  "// Admin нь үүнийг 'анхны утга' болгон харуулж, юуг өөрчилснийг тэмдэглэхэд хэрэглэнэ.\n" +
  "// ЗӨВХӨН admin.html дээр ачаалагддаг — нийтийн хуудсын жинд нөлөөлөхгүй.\n" +
  "const NB_TEXT_DEFAULTS = " + JSON.stringify(registry, null, 2) + ";\n";
fs.writeFileSync(path.join(ROOT, "js", "text-defaults.js"), out);

console.log("\n" + totalNew + " new tag(s); registry holds " + Object.keys(registry).length + " keys");
