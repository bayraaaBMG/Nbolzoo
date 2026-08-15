// ===== Урилга: дэвсгэр хөгжим (background music) + theme =====
// АНХААРУУЛГА: recipient-ийн "ямар дуу сонсмоор байна?" (response.song, wedding/party,
// invite.js) бол ТАНЫ ХҮСЭЛТ гэсэн бүрэн өөр feature — үүнтэй огт хамааралгүй. Энэ файл нь
// sender-ийн эхнээс сонгож өгдөг дэвсгэр хөгжим.
//
// Бодит audio эх сурвалж: Kevin MacLeod (incompetech.com), Creative Commons Attribution
// лицензтэй (CC BY 3.0/4.0 — тухайн бүтээлээс хамаарна), арилжааны хэрэглээ ЗӨВШӨӨРӨГДСӨН,
// зөвхөн зохиогчийг дурдах шаардлагатай (доорх "credit" талбар яг энэ зорилготой — picker
// болон recipient тал хоёулаа үүнийг харуулна, invApplyThemeAndMusic/invRenderMusicPicker).
// Файлууд эх URL (archive.org-ийн "Kevin-MacLeod_Royalty-Free_2017_FullAlbum" цуглуулга,
// incompetech.com-ийн албан ёсны каталогийн бодит хуулбар) -аас татаж, /audio/-д ӨӨРТ ӨӨРСДӨД
// нь хост хийсэн — production дээр найдваргүй гуравдагч этгээдийн CDN руу шууд hotlink хийхгүй
// (Pixabay зэрэг олон эх сурвалж яг ийм "татаж аваад өөрөө байршуул" горимыг шаарддаг).
// Хэн ч биш commercial дуу (Ed Sheeran, Bruno Mars г.м) — 100% instrumental, зохиогчийн
// лиценз тодорхой файл л энд орсон.
const INV_MUSIC_LIBRARY = {
  romantic: [   // date, proposal
    { id: "romantic-1", title: "Sunset at Glengorm", artist: "Kevin MacLeod", url: "audio/romantic-1.mp3", credit: "Sunset at Glengorm — Kevin MacLeod (incompetech.com) — CC BY 4.0" },
    { id: "romantic-2", title: "Bittersweet", artist: "Kevin MacLeod", url: "audio/romantic-2.mp3", credit: "Bittersweet — Kevin MacLeod (incompetech.com) — CC BY 4.0" },
    { id: "romantic-3", title: "Fireflies and Stardust", artist: "Kevin MacLeod", url: "audio/romantic-3.mp3", credit: "Fireflies and Stardust — Kevin MacLeod (incompetech.com) — CC BY 4.0" },
  ],
  wedding: [    // wedding
    { id: "wedding-1", title: "Village Consort", artist: "Kevin MacLeod", url: "audio/wedding-1.mp3", credit: "Village Consort — Kevin MacLeod (incompetech.com) — CC BY 4.0" },
    { id: "wedding-2", title: "Consort for Brass", artist: "Kevin MacLeod", url: "audio/wedding-2.mp3", credit: "Consort for Brass — Kevin MacLeod (incompetech.com) — CC BY 4.0" },
    { id: "wedding-3", title: "Reign", artist: "Kevin MacLeod", url: "audio/wedding-3.mp3", credit: "Reign — Kevin MacLeod (incompetech.com) — CC BY 4.0" },
  ],
  cheerful: [   // birthday, party, family, holiday
    { id: "cheerful-1", title: "Chipper Doodle", artist: "Kevin MacLeod", url: "audio/cheerful-1.mp3", credit: "Chipper Doodle — Kevin MacLeod (incompetech.com) — CC BY 4.0" },
    { id: "cheerful-2", title: "Life of Riley", artist: "Kevin MacLeod", url: "audio/cheerful-2.mp3", credit: "Life of Riley — Kevin MacLeod (incompetech.com) — CC BY 4.0" },
    { id: "cheerful-3", title: "Golly Gee", artist: "Kevin MacLeod", url: "audio/cheerful-3.mp3", credit: "Golly Gee — Kevin MacLeod (incompetech.com) — CC BY 4.0" },
  ],
  ambient: [    // work, meeting, education
    { id: "ambient-1", title: "Airship Serenity", artist: "Kevin MacLeod", url: "audio/ambient-1.mp3", credit: "Airship Serenity — Kevin MacLeod (incompetech.com) — CC BY 4.0" },
    { id: "ambient-2", title: "Sleep and Then", artist: "Kevin MacLeod", url: "audio/ambient-2.mp3", credit: "Sleep and Then — Kevin MacLeod (incompetech.com) — CC BY 4.0" },
    { id: "ambient-3", title: "Spring Thaw", artist: "Kevin MacLeod", url: "audio/ambient-3.mp3", credit: "Spring Thaw — Kevin MacLeod (incompetech.com) — CC BY 4.0" },
  ],
  energetic: [  // sport
    { id: "energetic-1", title: "Achilles", artist: "Kevin MacLeod", url: "audio/energetic-1.mp3", credit: "Achilles — Kevin MacLeod (incompetech.com) — CC BY 4.0" },
    { id: "energetic-2", title: "Vivacity", artist: "Kevin MacLeod", url: "audio/energetic-2.mp3", credit: "Vivacity — Kevin MacLeod (incompetech.com) — CC BY 4.0" },
    { id: "energetic-3", title: "Rocket Power", artist: "Kevin MacLeod", url: "audio/energetic-3.mp3", credit: "Rocket Power — Kevin MacLeod (incompetech.com) — CC BY 4.0" },
  ],
  classical: [  // culture
    { id: "classical-1", title: "Gymnopedie No 1", artist: "Kevin MacLeod", url: "audio/classical-1.mp3", credit: "Gymnopedie No 1 — Kevin MacLeod (incompetech.com) — CC BY 4.0" },
    { id: "classical-2", title: "Prelude in C (BWV 846)", artist: "Kevin MacLeod", url: "audio/classical-2.mp3", credit: "Prelude in C - BWV 846 — Kevin MacLeod (incompetech.com) — CC BY 4.0" },
    { id: "classical-3", title: "Music Box Theme", artist: "Kevin MacLeod", url: "audio/classical-3.mp3", credit: "Music Box Theme — Kevin MacLeod (incompetech.com) — CC BY 4.0" },
  ],
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
      ${tracks.length ? `<p class="inv-music-credit">🎵 Royalty-free, instrumental — Kevin MacLeod (incompetech.com), Creative Commons Attribution 4.0 лицензтэй, арилжааны хэрэглээ зөвшөөрөгдсөн.</p>` : ""}
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
  toggle.title = "Хөгжим асаах/унтраах" + (music.credit ? " · " + music.credit : "");
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
