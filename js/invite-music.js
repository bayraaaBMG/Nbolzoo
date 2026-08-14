// ===== Урилга: дэвсгэр хөгжим (background music) + theme =====
// АНХААРУУЛГА: recipient-ийн "ямар дуу сонсмоор байна?" (response.song, wedding/party,
// invite.js) бол ТАНЫ ХҮСЭЛТ гэсэн бүрэн өөр feature — үүнтэй огт хамааралгүй. Энэ файл нь
// sender-ийн эхнээс сонгож өгдөг дэвсгэр хөгжим.
//
// Бодит audio track: эх сурвалж/лиценз БАТАЛГААЖУУЛААГҮЙ тул энэ commit-д ЯМАР Ч URL
// зохиомлоор оруулаагүй (нэвтрэх боломжгүй CDN руу шууд холбогдох, лиценз тодорхойгүй
// GitHub repo-с hotlink хийх зэрэг нь re-хост хийхгүйгээр production дээр найдвартай ажиллах
// баталгаагүй тул зохисгүй гэж үзсэн). Категори бүр одоогоор ХООСОН — UI үүнийг "тун удахгүй"
// гэж ШУДАРГА харуулна, хоосон/эвдэрсэн мэт харагдуулахгүй. Бодит, шалгасан, эрх зөвшөөрөлтэй
// URL олдмогц зүгээр INV_MUSIC_LIBRARY доторх категорид {id,title,artist,url,credit} нэмнэ.
const INV_MUSIC_LIBRARY = {
  romantic: [],   // date, proposal
  wedding: [],    // wedding
  cheerful: [],   // birthday, party, family, holiday
  ambient: [],    // work, meeting, education
  energetic: [],  // sport
  classical: [],  // culture
};
const INV_MUSIC_CATEGORY_LABEL = {
  romantic: "💕 Романтик", wedding: "💍 Романтик/тансаг", cheerful: "🎉 Хөгжилтэй/дулаан",
  ambient: "🎹 Тайван", energetic: "⚡ Эрч хүчтэй", classical: "🎻 Сонгодог",
};
const INV_MUSIC_CATEGORY_BY_FAMILY = {
  date: "romantic", proposal: "romantic", wedding: "wedding",
  birthday: "cheerful", party: "cheerful", family: "cheerful", holiday: "cheerful",
  work: "ambient", meeting: "ambient", education: "ambient",
  sport: "energetic", culture: "classical", event: "ambient",
};

function invMusicCategoryForType(type) {
  const t = typeof INVITE_TYPES !== "undefined" ? INVITE_TYPES[type] : null;
  const family = t ? t.family : null;
  return INV_MUSIC_CATEGORY_BY_FAMILY[family] || "ambient";
}

// Sender builder (Алхам 3): категорийн санал болгосон дуунуудаас сонгох, өөрөө preview
// хийх, "Хөгжимгүй" сонголт хийх.
function invRenderMusicPicker(type, selectedId) {
  const category = invMusicCategoryForType(type);
  const label = INV_MUSIC_CATEGORY_LABEL[category] || "";
  const tracks = INV_MUSIC_LIBRARY[category] || [];
  const offChecked = !selectedId ? "checked" : "";
  const html = `
    <div class="inv-music-picker">
      <h4 style="margin-bottom:8px;font-size:14px;">🎵 Дэвсгэр хөгжим <span style="color:var(--text-light);font-weight:400;">— санал болгосон: ${label}</span></h4>
      <label class="inv-music-option">
        <input type="radio" name="invMusicChoice" value="" ${offChecked} onchange="invBuilderSetMusic(null)">
        <span>🔇 Хөгжимгүй</span>
      </label>
      ${tracks.length ? tracks.map(t => `
        <label class="inv-music-option">
          <input type="radio" name="invMusicChoice" value="${t.id}" ${selectedId === t.id ? "checked" : ""} onchange="invBuilderSetMusic('${t.id}')">
          <span>${escapeHtml(t.title)}${t.artist ? " — " + escapeHtml(t.artist) : ""}</span>
          <audio src="${t.url}" preload="none" controls style="height:28px;"></audio>
        </label>`).join("") : `
        <p class="inv-music-empty">Энэ ангиллын дуу тун удахгүй нэмэгдэнэ. Одоохондоо "Хөгжимгүй" сонголттойгоор урилгаа илгээж болно.</p>`}
    </div>`;
  return html;
}

// ---------- Theme ----------
const INV_THEMES = [
  { id: "classic", label: "Анхны", swatch: "#e8536e" },
  { id: "pink", label: "Romantic Pink", swatch: "#ff6f91" },
  { id: "vintage", label: "Vintage Album", swatch: "#c9a15a" },
  { id: "minimal", label: "Minimal White", swatch: "#bfc7d1" },
  { id: "elegant", label: "Elegant", swatch: "#5b3a6b" },
  { id: "cute", label: "Cute", swatch: "#ff9fc7" },
  { id: "celebration", label: "Celebration", swatch: "#f2a92e" },
  { id: "dark", label: "Dark Romantic", swatch: "#2b1f2e" },
];

function invRenderThemePicker(selectedTheme) {
  const sel = selectedTheme || "classic";
  return `
    <div class="inv-theme-picker">
      <h4 style="margin-bottom:8px;font-size:14px;">🎨 Theme</h4>
      <div class="inv-theme-swatches">
        ${INV_THEMES.map(t => `
          <div class="inv-theme-swatch ${t.id === sel ? "active" : ""}" onclick="invBuilderSetTheme('${t.id}')" title="${escapeHtml(t.label)}">
            <span class="inv-theme-swatch-dot" style="background:${t.swatch};"></span>
            <span class="inv-theme-swatch-label">${escapeHtml(t.label)}</span>
          </div>`).join("")}
      </div>
    </div>`;
}

// invite.js-ийн 12 render функц бүр өөрийн #inviteApp үүсгэсний дараа дуудна. theme класс
// нэмэх (эсвэл absent/"classic" бол юу ч нэмэхгүй — өнөөгийн харагдацтай яг адилхан) болон
// audio player угсрах хоёуланг нэг дор хийнэ.
function invApplyThemeAndMusic(invite) {
  const app = document.getElementById("inviteApp");
  if (app && invite && invite.theme && invite.theme !== "classic") {
    app.className = "inv-theme-" + invite.theme;
  }
  invSetupMusicPlayer(invite && invite.music);
}

// ---------- Recipient-side player ----------
// Autoplay policy: browser бүр user gesture-гүйгээр audio.play() хийхийг блоклодог тул
// эхлэл (Эхлэх/Дэлгэрэнгүй) товч дарагдах хүртэл ЯГ ХЭЗЭЭ Ч .play() дуудахгүй.
function invSetupMusicPlayer(music) {
  const old = document.getElementById("inv-music-audio");
  if (old) { old.pause(); old.remove(); }
  const toggleOld = document.getElementById("inv-music-toggle");
  if (toggleOld) toggleOld.remove();
  if (!music || !music.url) return;

  const app = document.getElementById("inviteApp");
  if (!app) return;

  const audio = document.createElement("audio");
  audio.id = "inv-music-audio";
  audio.src = music.url;
  audio.loop = true;
  audio.muted = false;
  app.appendChild(audio);

  const toggle = document.createElement("button");
  toggle.id = "inv-music-toggle";
  toggle.type = "button";
  toggle.className = "inv-music-toggle";
  toggle.title = "Хөгжим асаах/унтраах";
  toggle.textContent = "🔊";
  toggle.onclick = () => {
    audio.muted = !audio.muted;
    toggle.textContent = audio.muted ? "🔇" : "🔊";
  };
  app.appendChild(toggle);

  // Эхлэх/Дэлгэрэнгүй товчны дарагдсан click дээр (аль хэдийн байгаа, шинээр нэмээгүй)
  // "нэг удаа" гэсэн listener бэхлээд эхний хэрэглэгчийн gesture дээр аудио эхэлнэ.
  const startBtn = document.querySelector("#inviteApp #inv-s-intro .inv-btn, #inviteApp #inv-s-intro button");
  const startPlay = () => { audio.play().catch(() => {}); };
  if (startBtn) startBtn.addEventListener("click", startPlay, { once: true });
  else app.addEventListener("click", startPlay, { once: true });
}
