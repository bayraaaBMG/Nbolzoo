// ===== FIREBASE + TMDB CONFIG =====
const TMDB = "https://image.tmdb.org/t/p/w342";
const movies = [
  {id:1, emoji:"💕", title:"La La Land", year:"2016", genres:["romantic","drama"], rating:"8.5", duration:"128 мин", lang:"dubbed", trending:true, dateAdded:"2024-01-01", poster:TMDB+"/k68nPLbIST6NP96JmTxmZijQTHh.jpg", trailer:"https://www.youtube.com/embed/0pdqf4P9MB8", watchUrl:"", director:"Damien Chazelle", desc:"Жазз хөгжимчин болон жүжигчин тэмүүлж яваа хоёрын хайрын түүх. Лос-Анжелес хотод мөрөөдлөө биелүүлэхийн тулд хайрыг золиослох уу?", why:"Хамтдаа үзэж хэн юуг эрхэмлэдгийг ярилцахад тохиромжтой"},
  {id:2, emoji:"🤣", title:"Crazy Stupid Love", year:"2011", genres:["comedy","romantic"], rating:"7.4", duration:"118 мин", lang:"dubbed", trending:false, dateAdded:"2024-01-02", poster:TMDB+"/hU0E130sBGnMJTOcfgnEoKFvzVB.jpg", trailer:"https://www.youtube.com/embed/2fFJOKdQZ24", watchUrl:"", director:"Glenn Ficarra", desc:"Гэрлэсэн хүн хайраа алдаж, залуу womanizer-аар сургуулилж, харин тэр ч гэсэн жинхэнэ хайраа хайдаг.", why:"Хайрын олон хэлбэрийг инээдэмтэйгээр харуулсан"},
  {id:3, emoji:"🚗", title:"Fast X", year:"2023", genres:["action"], rating:"7.0", duration:"141 мин", lang:"dubbed", trending:true, dateAdded:"2024-01-03", poster:TMDB+"/fiVW06jE7z9YnO4trhaMEdclSiC.jpg", trailer:"https://www.youtube.com/embed/32RAq6JoN-w", watchUrl:"", director:"Louis Leterrier", desc:"Домиником Торреттогийн баг хамгийн аюултай дайснаа — Данте-г устгахаар нэгддэг.", why:"Адреналин дүүрэн, хамтдаа хоол идэж үзэхэд хөгжилтэй"},
  {id:4, emoji:"😂", title:"The Hangover", year:"2009", genres:["comedy"], rating:"7.7", duration:"100 мин", lang:"dubbed", trending:false, dateAdded:"2024-01-04", poster:TMDB+"/uluhlXubGu1VxU63boQeRx5v7p9.jpg", trailer:"https://www.youtube.com/embed/t6bNmMNMXAg", watchUrl:"", director:"Todd Phillips", desc:"Лас Вегас дахь мартагдашгүй bachelor party-н дараа гурван найз нар юу болсныг санахгүй сэрнэ.", why:"Хамтдаа инээж, хурдтай цаг өнгөрүүлэхэд төгс"},
  {id:5, emoji:"🌸", title:"Your Name (Kimi no Na wa)", year:"2016", genres:["animation","romantic"], rating:"8.4", duration:"106 мин", lang:"dubbed", trending:true, dateAdded:"2024-01-05", poster:TMDB+"/q719jXXEzOoYaps6babgKnONONX.jpg", trailer:"https://www.youtube.com/embed/xU47nhruN-Q", watchUrl:"", director:"Makoto Shinkai", desc:"Хоёр өсвөр насны хүүхэд биеийг нь солилцдог мөрөөдлийн дараа нэг нэгнийхээ хайрыг эрэлхийлнэ.", why:"Гэнэтийн эрч хүчтэй, уйлмаар гайхалтай анимэ"},
  {id:6, emoji:"💖", title:"The Notebook", year:"2004", genres:["romantic","drama"], rating:"7.8", duration:"123 мин", lang:"dubbed", trending:false, dateAdded:"2024-01-06", poster:TMDB+"/qom1SZSENdmHFNZBXbtTFsvke5.jpg", trailer:"https://www.youtube.com/embed/FC6biTjEyZw", watchUrl:"", director:"Nick Cassavetes", desc:"Ядуу залуу болон баян охины зуны хайр жилүүдийг давж мөнх хэвээр байна.", why:"Сонгодог романтик кино — хамт уйлахад тохиромжтой"},
  {id:7, emoji:"🎭", title:"Joker", year:"2019", genres:["drama"], rating:"8.4", duration:"122 мин", lang:"dubbed", trending:false, dateAdded:"2024-01-07", poster:TMDB+"/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg", trailer:"https://www.youtube.com/embed/zAGVQLHvwOY", watchUrl:"", director:"Todd Phillips", desc:"Артур Флек хэмээх инээдмийн жүжигчин аажим аажмаар нийгэмд хортой Жокер болж хувирдаг.", why:"Гүн агуулгатай, яриа өдөөх кино"},
  {id:8, emoji:"🦸", title:"Spider-Man: Across the Spider-Verse", year:"2023", genres:["animation","action"], rating:"8.6", duration:"140 мин", lang:"dubbed", trending:true, dateAdded:"2024-01-08", poster:TMDB+"/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg", trailer:"https://www.youtube.com/embed/cqGjhVmlZTY", watchUrl:"", director:"Joaquim Dos Santos", desc:"Майлс Моралес олон ертөнцийг дамнасан баатарлаг аяллаар гарч, өөрийн хувь заяагаа тодруулна.", why:"Визуал урлаг + хамтдаа гайхшрахад тохиромжтой"},
  {id:9, emoji:"👗", title:"Barbie", year:"2023", genres:["comedy","romantic"], rating:"6.9", duration:"114 мин", lang:"dubbed", trending:true, dateAdded:"2024-01-09", poster:TMDB+"/iuFNMS8vlbZxOkIGOS2ROSkR3WC.jpg", trailer:"", watchUrl:"", director:"Greta Gerwig", desc:"Барби орчлонгийн хамгийн тэгш хэмтэй ертөнцөөс реал ертөнцөд ирж, өөрийгөө нээн олдог хөгжилтэй кино.", why:"Инээдтэй, ухаалаг — хамтдаа дуулж, хөгжилтэй өнгөрүүлэхэд тохиромжтой"},
  {id:10, emoji:"🌌", title:"Interstellar", year:"2014", genres:["drama","action"], rating:"8.7", duration:"169 мин", lang:"dubbed", trending:true, dateAdded:"2024-01-10", poster:TMDB+"/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", trailer:"https://www.youtube.com/embed/zSWdZVtXT7E", watchUrl:"", director:"Christopher Nolan", desc:"Хүн төрөлхтний оршин тогтноход зориулан нэгэн эцэг сансрын хугацааны уртыг туулна.", why:"Гайхалтай харагдалт + гүн гүнзгий яриа өдөөдөг"},
  {id:11, emoji:"🎪", title:"The Greatest Showman", year:"2017", genres:["drama","romantic"], rating:"7.6", duration:"105 мин", lang:"dubbed", trending:false, dateAdded:"2024-01-11", poster:TMDB+"/b6REaZ0IxgJPnzxXWIJf9bIHKKG.jpg", trailer:"https://www.youtube.com/embed/AHKoSgJPSc4", watchUrl:"", director:"Michael Gracey", desc:"Циркийн хаан П.Т. Барнумын амьдрал, мөрөөдөл, хайр, хүлцлийн тухай дуурьт кино.", why:"Дуутай, урам зоригтой — хамтдаа дуулахад бэлэн болно"},
  {id:12, emoji:"🏰", title:"Frozen II", year:"2019", genres:["animation"], rating:"6.8", duration:"103 мин", lang:"dubbed", trending:false, dateAdded:"2024-01-12", poster:TMDB+"/xJWPZIYOEFIjZpBL7SVBGnzn58b.jpg", trailer:"https://www.youtube.com/embed/Zi4LMpSDccc", watchUrl:"", director:"Chris Buck", desc:"Элса өөрийн хүчний эх үүсвэрийг мэдэхийн тулд аюултай аялалд гарна.", why:"Хялбархан хамтдаа үзэх — тайвшруулсан, гоё дуутай"},
  {id:13, emoji:"🚀", title:"Avatar: The Way of Water", year:"2022", genres:["action","drama"], rating:"7.6", duration:"192 мин", lang:"dubbed", trending:true, dateAdded:"2024-01-13", poster:TMDB+"/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg", trailer:"", watchUrl:"", director:"James Cameron", desc:"Сэлли гэр бүл далайн гүнд амьдардаг На'Ви аймагт нэгдэж, шинэ аюулаас дэлхийгээ хамгаалдаг.", why:"Гайхалтай дүрслэл — IMAX-т хамтдаа үзэх хамгийн тохиромжтой кино"},
  {id:14, emoji:"🎵", title:"A Star Is Born", year:"2018", genres:["romantic","drama"], rating:"7.6", duration:"136 мин", lang:"dubbed", trending:false, dateAdded:"2024-01-14", poster:TMDB+"/wrFpXMNBRj2PBiN4Z5kix51XaIZ.jpg", trailer:"https://www.youtube.com/embed/nSbzyEJ8X9E", watchUrl:"", director:"Bradley Cooper", desc:"Алдартай хөгжимчин шинэ дуурын авьяастан охинтой танилцаж хайр үүснэ — гэвч алдар нэр хайрыг гэмтээдэг.", why:"Хөгжим + хайрын зовлон — сэтгэлд хүрдэг"},
  {id:15, emoji:"🌹", title:"Pride & Prejudice", year:"2005", genres:["romantic","drama"], rating:"7.8", duration:"129 мин", lang:"dubbed", trending:false, dateAdded:"2024-01-15", poster:TMDB+"/7wOFJr8hq2tPqB4R5J4ZFiJRCXq.jpg", trailer:"https://www.youtube.com/embed/1dqPcN8z6lo", watchUrl:"", director:"Joe Wright", desc:"19-р зуунд нэр хүнд ба хайрын хооронд сонголт хийж яваа Элизабет Беннет ба Дарсигийн түүх.", why:"Ухаалаг, сэтгэл зүйн романтик — ярилцлага өдөөдөг"},
  {id:16, emoji:"🎭", title:"Oppenheimer", year:"2023", genres:["drama","action"], rating:"8.3", duration:"180 мин", lang:"dubbed", trending:true, dateAdded:"2024-01-16", poster:TMDB+"/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", trailer:"", watchUrl:"", director:"Christopher Nolan", desc:"Атомын бөмбөгийг зохион бүтээсэн Роберт Оппенгеймерийн амьдрал, мөрөөдөл, харамсал.", why:"Гүн агуулгатай — хамтдаа бодолцох, ярилцахад хамгийн тохиромжтой"},
  {id:17, emoji:"😎", title:"The Grand Budapest Hotel", year:"2014", genres:["comedy","drama"], rating:"8.1", duration:"100 мин", lang:"dubbed", trending:false, dateAdded:"2024-01-17", poster:TMDB+"/eWdyYQreja6JKAzB8LRTF4KZLUT.jpg", trailer:"https://www.youtube.com/embed/1Fg5iWmQjwk", watchUrl:"", director:"Wes Anderson", desc:"Алдарт зочид буудлын консьерж ба хулгайч болж яваа жаалхан хүүхдийн адал явдалт тансаг комеди.", why:"Гоё визуал, хошин шог — хөнгөн хамтдаа үзэхэд тохиромжтой"},
  {id:18, emoji:"🐝", title:"My Big Fat Greek Wedding", year:"2002", genres:["comedy","romantic"], rating:"6.6", duration:"95 мин", lang:"dubbed", trending:false, dateAdded:"2024-01-18", poster:TMDB+"/9rRUtnJWI1QgO9DEzPFQmXlKBHJ.jpg", trailer:"https://www.youtube.com/embed/fYmVFWcqJRM", watchUrl:"", director:"Joel Zwick", desc:"Грек гэр бүлийн хосын болзооны турбулент аялал — тусламж гуйхгүйгээр гэрлэхэд хэцүү байна.", why:"Гэр бүл + хайрын инээдэмтэй дүрслэл"},
  {id:19, emoji:"💫", title:"Eternal Sunshine of the Spotless Mind", year:"2004", genres:["romantic","drama"], rating:"8.3", duration:"108 мин", lang:"dubbed", trending:false, dateAdded:"2024-01-19", poster:TMDB+"/5MwkWH9tYHv3oSd1zqMO8fBELxN.jpg", trailer:"https://www.youtube.com/embed/07-QBnEkgXU", watchUrl:"", director:"Michel Gondry", desc:"Тархины дурсамжийг устгах технологи ашиглан хайраа мартах гэсэн хосын түүх.", why:"Хайрын утга учрыг гүн бодуулдаг — ярилцахад тохиромжтой"},
  {id:20, emoji:"🎬", title:"Parasite", year:"2019", genres:["drama"], rating:"8.6", duration:"132 мин", lang:"dubbed", trending:true, dateAdded:"2024-01-20", poster:TMDB+"/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", trailer:"https://www.youtube.com/embed/5xH0HfJHsaY", watchUrl:"", director:"Bong Joon-ho", desc:"Ядуу гэр бүл баян гэрт аажимдаа нэвтэрч, тэнд нуугдаж байсан нууцыг илрүүлнэ.", why:"Хамтдаа тааны авч, яриа дэлгэхэд маш сайн"},
  {id:21, emoji:"🌺", title:"Mamma Mia!", year:"2008", genres:["comedy","romantic"], rating:"6.4", duration:"108 мин", lang:"dubbed", trending:false, dateAdded:"2024-01-21", poster:TMDB+"/aLVkiINlIeCkcZIzb7XHzPYgO6L.jpg", trailer:"https://www.youtube.com/embed/sxRrSCi5Nk0", watchUrl:"", director:"Phyllida Lloyd", desc:"Охин гэрлэлтийнхээ өмнө гурван эрэгтэйн аль нь эцэг болохыг мэдэхийн тулд урьжээ.", why:"ABBA дуунуудтай хамтдаа дуулах гайхалтай кино"},
  {id:22, emoji:"🐉", title:"How to Train Your Dragon", year:"2010", genres:["animation","action"], rating:"8.1", duration:"98 мин", lang:"dubbed", trending:false, dateAdded:"2024-01-22", poster:TMDB+"/ygGmAO60t8GyqUKE0xQpOPMrSzM.jpg", trailer:"https://www.youtube.com/embed/oKiYuIsPxYk", watchUrl:"", director:"Dean DeBlois", desc:"Викингийн хүү луутай найздаж, хоёр тал бие биенийхээ тухай ойлголцдог.", why:"Бүх насны хүмүүст тохирох — дотно, урам зоригтой"},
  {id:23, emoji:"🌃", title:"Lost in Translation", year:"2003", genres:["romantic","drama"], rating:"7.7", duration:"102 мин", lang:"dubbed", trending:false, dateAdded:"2024-01-23", poster:TMDB+"/sn3MDKABzJ1kCGXkBZzY9bXI4zr.jpg", trailer:"https://www.youtube.com/embed/NZRIAYqFW2U", watchUrl:"", director:"Sofia Coppola", desc:"Токиод тус тустаа нэвтрэрхэн явсан хоёр Америк хоорондоо нандин нөхөрлөл олно.", why:"Тайван, нарийн — хамтдаа удаан суулт хийхэд тохиромжтой"},
  {id:24, emoji:"🌈", title:"Silver Linings Playbook", year:"2012", genres:["romantic","comedy","drama"], rating:"7.7", duration:"122 мин", lang:"dubbed", trending:false, dateAdded:"2024-01-24", poster:TMDB+"/zNGPOFM6B5cRQFME9fHGxpHpIoQ.jpg", trailer:"https://www.youtube.com/embed/QGgCNWvGogI", watchUrl:"", director:"David O. Russell", desc:"Сэтгэцийн асуудалтай хоёр хүн бийр тоглолтоор нэг нэгнийгээ засахад тусалдаг.", why:"Буруу байдалаасаа хайр олох — сэтгэлд хүрдэг"},
  {id:25, emoji:"🚀", title:"Guardians of the Galaxy", year:"2014", genres:["action","comedy"], rating:"8.0", duration:"121 мин", lang:"dubbed", trending:false, dateAdded:"2024-01-25", poster:TMDB+"/r7vmZjiyZw9rpJMQJdXpjd9geoY.jpg", trailer:"https://www.youtube.com/embed/d96cjJhvlMA", watchUrl:"", director:"James Gunn", desc:"Тохиромжгүй баатруудын бүлэг сансраас дэлхийг аврахаар нэгддэг.", why:"Хөгжилтэй, эрч хүчтэй — хамтдаа хоол идэж үзэхэд тохиромжтой"},
  {id:26, emoji:"🕷", title:"Spider-Man: No Way Home", year:"2021", genres:["action","comedy"], rating:"8.2", duration:"148 мин", lang:"dubbed", trending:true, dateAdded:"2024-01-26", poster:TMDB+"/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg", trailer:"", watchUrl:"", director:"Jon Watts", desc:"Питер Паркер дэлхийн нийгэмлэгийг хамарсан нууцаа устгахын тулд олон ертөнцийн хувилбаруудтайгаа нүүр тулдаг.", why:"Хөгжилтэй, сэтгэл хөдлөм — хамтдаа баясаж, уйлахад тохиромжтой"},
  {id:27, emoji:"✨", title:"Everything Everywhere All at Once", year:"2022", genres:["action","comedy","drama"], rating:"7.8", duration:"139 мин", lang:"dubbed", trending:true, dateAdded:"2024-01-27", poster:TMDB+"/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg", trailer:"https://www.youtube.com/embed/wxN1T1uxQ2g", watchUrl:"", director:"Daniels", desc:"Эхнэр нь зэрэгцэх олон ертөнцийг дамнан оршин тогтнохын тулд тэмцэнэ.", why:"Уйлуулж, инээлгэж, гайхшруулна — мартагдашгүй туршлага"},
  {id:28, emoji:"🎨", title:"Amélie", year:"2001", genres:["romantic","comedy"], rating:"8.3", duration:"122 мин", lang:"dubbed", trending:false, dateAdded:"2024-01-28", poster:TMDB+"/nBNZadXqJSdt05SHLqgT0HuC5Gm.jpg", trailer:"https://www.youtube.com/embed/Bclz4HyVhI0", watchUrl:"", director:"Jean-Pierre Jeunet", desc:"Парисын нэгэн нутгийн хүүхэн бусдын аз жаргалд нөлөөлж, өөрийнхөө хайрыг олдог.", why:"Дуртай хүнд дотно мэдрэмж өгдөг — гоё, хүч чадалтай"},
  {id:29, emoji:"🧊", title:"Frozen", year:"2013", genres:["animation"], rating:"7.4", duration:"102 мин", lang:"dubbed", trending:false, dateAdded:"2024-01-29", poster:TMDB+"/kgwjIb2JDHRhNk13lmSxiClFjVk.jpg", trailer:"https://www.youtube.com/embed/TbQm5doF_Uc", watchUrl:"", director:"Chris Buck", desc:"Элса хааны хүч нь хот мөсөн хааны нутаг болгоход дүүгийнх нь Анна аврах аяллад гарна.", why:"Сонгодог анимэшн — Let It Go хамтдаа дуулаарай"},
  {id:30, emoji:"🌿", title:"Spirited Away", year:"2001", genres:["animation","drama"], rating:"8.6", duration:"125 мин", lang:"dubbed", trending:true, dateAdded:"2024-01-30", poster:TMDB+"/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", trailer:"https://www.youtube.com/embed/ByXuk9QqQkk", watchUrl:"", director:"Hayao Miyazaki", desc:"Охин хачирхалтай сүнснүүдийн ертөнцөд орж, ах эцэг эхийгээ аврахаар тэмцэнэ.", why:"Хамгийн шагналтай анимэ — дүрслэл нь гайхалтай"},
  // 🇲🇳 МОНГОЛ КИНО
  {id:31, emoji:"🏹", title:"Монгол (Чингис хааны залуу нас)", year:"2007", genres:["mongolian","action","drama"], rating:"7.7", duration:"126 мин", lang:"mongolian", trending:true, dateAdded:"2024-02-01", poster:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Mongol_film.jpg/300px-Mongol_film.jpg", trailer:"https://www.youtube.com/embed/1j-3wfHHAZs", watchUrl:"", director:"Sergei Bodrov", desc:"Чингис хааны залуу насыг дүрсэлсэн алдарт Монгол-Казак-Герман хамтарсан кино. Тэсэх тэвчих, хайрын хүч хамгийн том хүч.", why:"Монголын түүхийг хамтдаа мэдэхэд, бахархал төрүүлдэг"}
];
// TODO: Replace with your TMDB API key (free at https://www.themoviedb.org/settings/api)
const TMDB_KEY = "YOUR_TMDB_API_KEY";

var firebaseMovies = [];
var tmdbSearchResults = [];

// firebase-init.js аль хэдийн db/auth/storage-г эхлүүлсэн байгаа тул зөвхөн кино ачаална
function initFirebase() {
  loadMoviesFromFirebase();
}

function loadMoviesFromFirebase() {
  if (!db) return;
  try {
    db.collection("movies").orderBy("dateAdded", "desc").onSnapshot(snap => {
      firebaseMovies = snap.docs.map(doc => ({ ...doc.data(), _dbId: doc.id, _user: true }));
      renderMovies();
    }, err => console.warn("Firestore load error:", err));
  } catch(e) {
    console.warn("loadMoviesFromFirebase error:", e);
  }
}

async function saveMovieToFirebase(movie) {
  if (!db) return null;
  try {
    const docRef = await db.collection("movies").add(movie);
    return docRef.id;
  } catch(e) {
    console.warn("saveMovieToFirebase error:", e);
    return null;
  }
}

async function deleteMovieFromFirebase(dbId) {
  if (!db || !dbId) return;
  try {
    await db.collection("movies").doc(dbId).delete();
  } catch(e) {
    console.warn("deleteMovieFromFirebase error:", e);
  }
}

async function doTMDBSearch() {
  const q = (document.getElementById("tmdbSearchInput").value || "").trim();
  if (!q) return;
  const btn = document.getElementById("tmdbSearchBtn");
  const resultsEl = document.getElementById("tmdbResults");
  btn.textContent = "...";
  btn.disabled = true;
  try {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}&language=en-US&page=1`;
    const res = await fetch(url);
    const data = await res.json();
    tmdbSearchResults = (data.results || []).slice(0, 8);
    if (!tmdbSearchResults.length) {
      resultsEl.innerHTML = '<div style="padding:12px;color:rgba(255,255,255,0.4);font-size:13px;text-align:center">Олдсонгүй</div>';
    } else {
      resultsEl.innerHTML = tmdbSearchResults.map((m, i) => {
        const poster = m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : "";
        const year = (m.release_date || "").slice(0, 4);
        const imgHtml = poster
          ? `<img src="${poster}" alt="" loading="lazy">`
          : `<div style="width:36px;height:54px;background:#1a1a2e;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:18px">🎬</div>`;
        return `<div class="tmdb-result-item" onclick="selectTMDBResult(${i})">
          ${imgHtml}
          <div class="tmdb-result-info">
            <div class="tmdb-result-title">${m.title || m.original_title}</div>
            <div class="tmdb-result-meta">${year} · ⭐ ${m.vote_average ? m.vote_average.toFixed(1) : "?"}</div>
          </div>
        </div>`;
      }).join("");
    }
    resultsEl.style.display = "block";
  } catch(e) {
    resultsEl.innerHTML = '<div style="padding:12px;color:#e55;font-size:13px;text-align:center">API алдаа — TMDB_KEY шалгана уу</div>';
    resultsEl.style.display = "block";
  }
  btn.textContent = "Хайх";
  btn.disabled = false;
}

const TMDB_GENRE_MAP = {
  28:"action", 12:"action", 16:"animation", 35:"comedy", 80:"drama",
  18:"drama", 10749:"romantic", 27:"drama", 878:"action", 10751:"animation",
  14:"drama", 36:"drama", 10402:"drama", 9648:"drama", 37:"action"
};

function selectTMDBResult(idx) {
  const m = tmdbSearchResults[idx];
  if (!m) return;
  const year = (m.release_date || "").slice(0, 4);
  const rating = m.vote_average ? m.vote_average.toFixed(1) : "";
  const poster = m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "";
  const genres = [...new Set((m.genre_ids || []).map(id => TMDB_GENRE_MAP[id]).filter(Boolean))];
  document.getElementById("amTitle").value = m.title || m.original_title || "";
  document.getElementById("amYear").value = year;
  document.getElementById("amRating").value = rating;
  document.getElementById("amPoster").value = poster;
  document.getElementById("amGenres").value = genres.join(", ") || "drama";
  const overviewEl = document.getElementById("amDesc");
  if (overviewEl && m.overview) overviewEl.value = m.overview;
  document.getElementById("tmdbResults").style.display = "none";
  document.getElementById("tmdbSearchInput").value = "";
}

// ===== CINEMA / MOVIES =====
const GL = {romantic:"💕 Романтик", comedy:"😄 Инээдмийн", action:"💥 Адал явдалт", drama:"🎭 Драм", animation:"🎨 Анимэшн", mongolian:"🇲🇳 Монгол"};
const POSTER_BG = {romantic:"linear-gradient(135deg,#3d1a3a,#6b2060)", comedy:"linear-gradient(135deg,#3d2a00,#7a5200)", action:"linear-gradient(135deg,#0a1a3a,#1a3a6a)", drama:"linear-gradient(135deg,#1a0a2a,#3a1a4a)", animation:"linear-gradient(135deg,#0a2a3a,#1a4a6a)", mongolian:"linear-gradient(135deg,#0a2a0a,#1a4a1a)"};
const LANG_LABEL = {dubbed:"🎙 Монгол хадмал", mongolian:"🇲🇳 Монгол хэлээр", original:"🌐 Эх хэлээр"};

function allMovies() { return [...movies, ...firebaseMovies]; }

function getFilteredMovies() {
  let list = allMovies();
  const tab = currentMovieCinemaTab;
  if(tab === "trending") list = list.filter(m => m.trending);
  else if(tab === "mongolian") list = list.filter(m => m.lang === "mongolian");
  else if(tab === "dubbed") list = list.filter(m => m.lang === "dubbed");
  if(currentMovieGenre !== "all") list = list.filter(m => m.genres.includes(currentMovieGenre));
  const q = currentMovieSearch.trim().toLowerCase();
  if(q) list = list.filter(m => m.title.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q));
  const sort = currentMovieSort;
  if(sort === "rating") list.sort((a,b) => parseFloat(b.rating) - parseFloat(a.rating));
  else if(sort === "year-desc") list.sort((a,b) => parseInt(b.year) - parseInt(a.year));
  else if(sort === "year-asc") list.sort((a,b) => parseInt(a.year) - parseInt(b.year));
  else if(sort === "added") list.sort((a,b) => (b.dateAdded||"").localeCompare(a.dateAdded||""));
  return list;
}

function cinePosterHtml(m, cls) {
  const bg = POSTER_BG[m.genres[0]] || "linear-gradient(135deg,#1a1a2e,#2a2a4e)";
  const textFallback = `<div class="cine-poster-fallback cine-poster-text" style="display:none;background:${bg};flex-direction:column;gap:6px;padding:14px;text-align:center">
    <div style="font-size:32px">${m.emoji}</div>
    <div style="font-size:11px;font-weight:700;color:#fff;line-height:1.3;word-break:break-word">${m.title}</div>
    <div style="font-size:10px;color:rgba(255,255,255,0.45)">${m.year}</div>
  </div>`;
  const noImgFallback = `<div class="cine-poster-fallback cine-poster-text" style="background:${bg};flex-direction:column;gap:6px;padding:14px;text-align:center">
    <div style="font-size:32px">${m.emoji}</div>
    <div style="font-size:11px;font-weight:700;color:#fff;line-height:1.3;word-break:break-word">${m.title}</div>
    <div style="font-size:10px;color:rgba(255,255,255,0.45)">${m.year}</div>
  </div>`;
  if(m.poster) {
    return `<img class="cine-poster-img ${cls||''}" src="${m.poster}" alt="${m.title}" loading="lazy"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">${textFallback}`;
  }
  return noImgFallback;
}

function renderMovies() {
  try {
  const list = getFilteredMovies();
  const count = document.getElementById("movieCount");
  if(count) count.textContent = `${list.length} кино олдлоо`;
  const grid = document.getElementById("movieGrid");
  if(!grid) return;
  if(!list.length) {
    grid.innerHTML = `<div class="cinema-no-results" style="grid-column:1/-1">
      <div style="font-size:48px;margin-bottom:12px">🎬</div>
      <p>Тохирох кино олдсонгүй</p>
      <button type="button" class="cinema-add-btn" style="margin-top:16px" onclick="clearMovieSearch()">Шүүлтүүр арилгах</button>
    </div>`;
    return;
  }
  grid.innerHTML = list.map(m => {
    const langCls = `lang-${m.lang||"dubbed"}`;
    const langLabel = (m.lang === "mongolian") ? "MN" : (m.lang === "original") ? "ORG" : "HАД";
    const genreFirst = GL[m.genres[0]] || m.genres[0];
    return `<div class="cine-card" onclick="openMovieDetail(${m.id})">
      <div class="cine-poster-wrap">
        ${cinePosterHtml(m)}
        <div class="cine-rating-badge">⭐ ${m.rating}</div>
        <div class="cine-lang-badge ${langCls}">${langLabel}</div>
        <div class="cine-play-btn">▶</div>
      </div>
      <div class="cine-info">
        <div class="cine-movie-title">${m.title}</div>
        <div class="cine-meta"><span>${m.year}</span><span>·</span><span>${m.duration||''}</span></div>
        <span class="cine-genre-pill">${genreFirst}</span>
      </div>
    </div>`;
  }).join("");
  } catch(err) {
    console.error("renderMovies error:", err);
    const grid = document.getElementById("movieGrid");
    if(grid) grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:rgba(255,255,255,0.5)">
      <div style="font-size:40px;margin-bottom:12px">⚠️</div>
      <p>Кино ачааллахад алдаа гарлаа. Хуудсыг дахин ачааллаарай.</p>
      <p style="font-size:12px;margin-top:8px;color:rgba(255,255,255,0.3)">${err.message}</p>
    </div>`;
  }
}

function openMovieDetail(id) {
  const m = allMovies().find(x => x.id === id);
  if(!m) return;
  const overlay = document.getElementById("movieDetailOverlay");
  const content = document.getElementById("movieDetailContent");
  const bg = POSTER_BG[m.genres[0]] || "linear-gradient(135deg,#1a1a2e,#2a2a4e)";
  const langLabel = LANG_LABEL[m.lang] || "🎙 Монгол хадмал";
  const similarList = allMovies().filter(x => x.id !== m.id && x.genres.some(g => m.genres.includes(g))).slice(0,6);
  content.innerHTML = `
    <div class="cinema-detail-topbar">
      <button type="button" class="cinema-back-btn" onclick="closeMovieDetail()">← Буцах</button>
      <span style="color:rgba(255,255,255,0.5); font-size:13px">Кино дэлгэрэнгүй</span>
      <div></div>
    </div>
    <div class="cinema-detail-banner" style="background:${bg}">
      ${m.poster ? `<img class="cinema-detail-banner-img" src="${m.poster}" alt="${m.title}" onerror="this.style.display='none'">` : ''}
      <div class="cinema-detail-banner-gradient"></div>
      ${!m.poster ? `<div class="cinema-detail-banner-emoji">${m.emoji}</div>` : ''}
    </div>
    <div class="cinema-detail-body">
      <div class="cinema-detail-header">
        <div class="cinema-detail-poster-thumb">
          ${cinePosterHtml(m)}
        </div>
        <div class="cinema-detail-title-block">
          <h1 class="cinema-detail-title">${m.title}</h1>
          <div class="cinema-detail-badges">
            <span class="cinema-detail-rating">⭐ ${m.rating}/10</span>
            <span class="cine-lang-badge lang-${m.lang||'dubbed'}" style="position:static">${langLabel}</span>
          </div>
          <div class="cinema-detail-meta">${m.year} · ${m.duration||''} ${m.director ? '· ' + m.director : ''}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
            ${m.genres.map(g=>`<span class="cine-genre-pill">${GL[g]||g}</span>`).join("")}
          </div>
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:4px">
        <a href="${m.watchUrl || 'https://lolokino.buzz/?s=' + encodeURIComponent(m.title)}" target="_blank" rel="noopener" class="cinema-watch-btn">▶ Lolokino-д үзэх</a>
        <button type="button" class="cinema-watchlist-btn" onclick="toggleMovieWatchlist(${m.id})">
          <span id="wlIcon${m.id}">${movieWatchlist.has(m.id)?'✓':'+'}</span> Watchlist
        </button>
      </div>
      <div class="cinema-detail-section">
        <h4>Тайлбар</h4>
        <p class="cinema-detail-desc">${m.desc}</p>
      </div>
      <div class="cinema-detail-section">
        <h4>💑 Яагаад хосуудад тохиромжтой вэ?</h4>
        <p class="cinema-detail-desc" style="color:#e2b714">${m.why||'Хамтдаа үзэхэд тохиромжтой кино'}</p>
      </div>
      <div class="cinema-detail-section">
        <h4>🎬 Trailer</h4>
        <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(m.title + ' official trailer')}" target="_blank" rel="noopener" class="cinema-yt-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1C4.5 20.5 12 20.5 12 20.5s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/></svg>
          YouTube-д trailer харах
        </a>
      </div>
      ${similarList.length ? `
      <div class="cinema-detail-section">
        <h4>Төстэй кинонууд</h4>
        <div class="cinema-similar-grid">
          ${similarList.map(s => `
            <div class="cine-card" onclick="openMovieDetail(${s.id})" style="cursor:pointer">
              <div class="cine-poster-wrap" style="aspect-ratio:2/3">
                ${cinePosterHtml(s)}
                <div class="cine-rating-badge">⭐ ${s.rating}</div>
              </div>
              <div class="cine-info">
                <div class="cine-movie-title">${s.title}</div>
                <div class="cine-meta">${s.year}</div>
              </div>
            </div>`).join("")}
        </div>
      </div>` : ''}
      ${(currentUser && currentUser.isAdmin) ? `<div style="margin-top:24px;text-align:center">
        <button type="button" class="btn btn-outline" style="border-color:#ef4444;color:#ef4444" onclick="adminDeleteMovie('${m._dbId||''}', ${id})">🗑 Устгах (админ)</button>
      </div>` : ''}
    </div>`;
  overlay.style.display = "block";
  overlay.scrollTop = 0;
  document.body.style.overflow = "hidden";
}

function closeMovieDetail() {
  document.getElementById("movieDetailOverlay").style.display = "none";
  document.body.style.overflow = "";
}

function setCinemaTab(tab, el) {
  currentMovieCinemaTab = tab;
  document.querySelectorAll(".cinema-tab").forEach(t => t.classList.remove("active"));
  if(el) el.classList.add("active");
  renderMovies();
}

function setMovieGenre(genre, el) {
  currentMovieGenre = genre;
  document.querySelectorAll(".cchip").forEach(c => c.classList.remove("active"));
  if(el) el.classList.add("active");
  renderMovies();
}

function setMovieSort(val) {
  currentMovieSort = val;
  renderMovies();
}

function filterAndRenderMovies() {
  const inp = document.getElementById("movieSearchInput");
  currentMovieSearch = inp ? inp.value : "";
  const clr = document.getElementById("movieSearchClear");
  if(clr) clr.style.display = currentMovieSearch ? "block" : "none";
  renderMovies();
}

function clearMovieSearch() {
  currentMovieSearch = "";
  currentMovieCinemaTab = "all";
  currentMovieGenre = "all";
  currentMovieSort = "rating";
  const inp = document.getElementById("movieSearchInput");
  if(inp) inp.value = "";
  const clr = document.getElementById("movieSearchClear");
  if(clr) clr.style.display = "none";
  document.querySelectorAll(".cinema-tab").forEach((t,i)=>t.classList.toggle("active",i===0));
  document.querySelectorAll(".cchip").forEach((c,i)=>c.classList.toggle("active",i===0));
  const sel = document.getElementById("movieSortSelect");
  if(sel) sel.value = "rating";
  renderMovies();
}

let movieWatchlist = new Set(JSON.parse(localStorage.getItem("nbolzoo_watchlist")||"[]"));
function toggleMovieWatchlist(id) {
  if(movieWatchlist.has(id)) movieWatchlist.delete(id);
  else movieWatchlist.add(id);
  localStorage.setItem("nbolzoo_watchlist", JSON.stringify([...movieWatchlist]));
  const ic = document.getElementById("wlIcon"+id);
  if(ic) ic.textContent = movieWatchlist.has(id) ? "✓" : "+";
  showToast(movieWatchlist.has(id) ? "✅ Watchlist-д нэмэгдлээ!" : "🗑 Watchlist-аас хасагдлаа");
}

function openAddMovieModal() {
  const ov = document.getElementById("addMovieOverlay");
  if(ov) { ov.style.display = "block"; document.body.style.overflow = "hidden"; }
}

function closeAddMovieModal() {
  const ov = document.getElementById("addMovieOverlay");
  if(ov) { ov.style.display = "none"; document.body.style.overflow = ""; }
}

// Нийтийн "Кино нэмэх" товч нь каталогт шууд ормогүй, харин хянагдах хүсэлт (movieSuggestions)
// болж илгээгддэг — админ dashboard-оос зөвшөөрснөөр л жинхэнэ каталогт (movies) орно.
// Иймээр урьд нь болсон зохиомол/буруу кино автоматаар нэмэгдэх асуудал давтагдахгүй.
async function submitAddMovie() {
  if (!currentUser) { showToast("⚠️ Кино санал болгохын тулд эхлээд нэвтэрнэ үү"); openAuth("login"); return; }
  const title = document.getElementById("amTitle").value.trim();
  const desc = document.getElementById("amDesc").value.trim();
  if (!title) { showToast("⚠️ Киноны нэр заавал бөглөнө үү"); return; }
  const genreRaw = document.getElementById("amGenres").value;
  const genres = genreRaw ? genreRaw.split(",").map(g=>g.trim()).filter(Boolean) : ["drama"];
  const suggestion = {
    emoji:"🎬",
    title, year: document.getElementById("amYear").value||"2024",
    rating: document.getElementById("amRating").value||"7.0",
    duration: document.getElementById("amDuration").value||"",
    lang: document.getElementById("amLang").value||"dubbed",
    poster: document.getElementById("amPoster").value.trim()||"",
    watchUrl: document.getElementById("amWatchUrl").value.trim()||"",
    genres, desc: desc||"",
    why: document.getElementById("amWhy").value.trim()||"Хамтдаа үзэхэд тохиромжтой",
    submittedBy: currentUser.uid, submittedByName: currentUser.name, status: "pending",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  const statusEl = document.getElementById("addMovieStatus");
  const submitBtn = document.getElementById("submitMovieBtn");
  if (statusEl) statusEl.textContent = "";
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Илгээж байна..."; }
  try {
    await db.collection("movieSuggestions").add(suggestion);
    if (statusEl) statusEl.innerHTML = '<span style="color:#4caf50">✅ Санал илгээгдлээ — админ хянасны дараа каталогт орно</span>';
    setTimeout(() => {
      closeAddMovieModal();
      showToast(`✅ "${title}" таны саналд нэмэгдлээ, хянагдана`);
    }, 900);
    ["amTitle","amYear","amPoster","amRating","amDuration","amWatchUrl","amGenres","amDesc","amWhy"].forEach(id=>{
      const el = document.getElementById(id); if(el) el.value="";
    });
  } catch(e) {
    if (statusEl) statusEl.innerHTML = '<span style="color:#e55">⚠️ Илгээхэд алдаа гарлаа</span>';
    console.warn("submitAddMovie error:", e);
  }
  if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "✓ Нэмэх"; }
}

// Зөвхөн админ — movies.html дэлгэрэнгүй харагдацаас шууд устгах
async function adminDeleteMovie(dbId, id) {
  if (!currentUser || !currentUser.isAdmin) return;
  if (!dbId) { showToast("⚠️ Энэ бол суурь кино — зөвхөн Firestore-д нэмэгдсэн киног устгах боломжтой"); return; }
  if (!confirm("Энэ киног каталогоос устгах уу?")) return;
  await deleteMovieFromFirebase(dbId);
  closeMovieDetail();
  showToast("🗑 Кино устгагдлаа");
}

function openMovieModal(id) { openMovieDetail(id); }

