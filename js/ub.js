
// 365 ИДЕАГ УЛААНБААТАРТ
const districts = ["Сүхбаатар", "Чингэлтэй", "Баянзүрх", "Хан-Уул", "Сонгинохайрхан", "Баянгол", "Налайх", "Багануур", "Багахангай"];
const categories = [
  {emoji: "☕", name: "кафе"},
  {emoji: "🍴", name: "ресторан"},
  {emoji: "🎬", name: "кино"},
  {emoji: "🎨", name: "урлаг"},
  {emoji: "🏛", name: "музей"},
  {emoji: "🌳", name: "парк"},
  {emoji: "🛍", name: "худалдаа"},
  {emoji: "🎤", name: "хөгжим"},
  {emoji: "🎳", name: "тоглоом"},
  {emoji: "💆", name: "spa"},
  {emoji: "🍷", name: "ресторан"},
  {emoji: "🏊", name: "усан"},
  {emoji: "⛸", name: "өвлийн"},
  {emoji: "🚲", name: "идэвхтэй"},
  {emoji: "📚", name: "ном"}
];

const ubIdeaTemplates = [
  {title: "Зайсан өндөрлөгт нар жаргахыг харах", desc: "Хотын тойм харагдах уулан дээр хосоор", price: 25000, feeling: "Романтик, мартагдашгүй мөч. Хот нь алтан өнгөтэй болоход хайраа гэрчлэх."},
  {title: "Сүхбаатарын талбайд алхах", desc: "Төв талбайд хосоор зугаалах", price: 0, feeling: "Тайван, нандин. Энгийн боловч хосын дотно мөч."},
  {title: "Чойжин ламын музейд", desc: "Соёлын дурсгалт газар үзэх", price: 30000, feeling: "Соёлтой, оюуны болзоо."},
  {title: "Гандан хийдэд залбирах", desc: "Хосоор бурхан тахих", price: 10000, feeling: "Сүнсэн нэгдэл, хайрын мөнхийн гэрээ."},
  {title: "Богд уулын ар талд алхах", desc: "Ойн тарни замаар хосоор", price: 20000, feeling: "Цэвэр агаар, тайван."},
  {title: "Богино хугацааны ART экспод", desc: "Шинэ урлагийн үзэсгэлэн", price: 40000, feeling: "Шинэлэг, бүтээлч."},
  {title: "Шангри-Ла кино театрт", desc: "Шинэ кино, поп корн", price: 50000, feeling: "Сонгодог романтик."},
  {title: "Tom N Toms кофешопт", desc: "Шинэ кофешоп туршиж үзэх", price: 35000, feeling: "Тав тухтай ярилцлага."},
  {title: "Internom номын дэлгүүрт", desc: "Хосоор ном сонгох", price: 60000, feeling: "Оюуны нандин мөч."},
  {title: "Mongolian Theatre жүжиг", desc: "Уламжлалт жүжиг үзэх", price: 80000, feeling: "Соёлтой үдэшлэг."},
  {title: "Хархорум 14 рестораны үдэш", desc: "Жинхэнэ Монгол хоол", price: 90000, feeling: "Уламжлалт, дотно."},
  {title: "Skybar Mongolia дээр", desc: "Шөнийн хотын тойм", price: 120000, feeling: "Романтик, өндөр харагдалт."},
  {title: "Караокед хосоор дуулах", desc: "Хосоор дуу дуулах шөнө", price: 60000, feeling: "Хошин, инээдэмтэй."},
  {title: "Боулинг тоглох", desc: "Шангри-Ла боулинг", price: 70000, feeling: "Хөгжилтэй, өрсөлдөөнтэй."},
  {title: "Ice skating Зимний паркт", desc: "Гулгуурын аялал хосоор", price: 25000, feeling: "Хүүхэд шиг инээх."},
  {title: "Цаатан рестораны үдэш", desc: "Орчин үеийн хоол", price: 100000, feeling: "Шинэлэг туршлага."},
  {title: "Үндэсний паркаар хосоор", desc: "Алхалт, гэрэл зураг", price: 0, feeling: "Тайван, тав тухтай."},
  {title: "Хан-Уул дүүргийн SPA", desc: "Хосын массаж, тайвшралт", price: 200000, feeling: "Тайван, эрүүл мэнд."},
  {title: "Шавар савлуурын дугаа", desc: "Хосоор сав хийх", price: 80000, feeling: "Бүтээлч, дурсамжтай."},
  {title: "Mongolian Heritage үзэсгэлэн", desc: "Уламжлалт хувцас", price: 50000, feeling: "Соёлтой, бахархалтай."},
  {title: "Шонхор кампусын парк", desc: "Хосоор алхалт", price: 0, feeling: "Тогтмол нандин мөч."},
  {title: "Эв нэгдлийн хүрээлэнгийн парк", desc: "Хүүхдийн талбайд алхах", price: 5000, feeling: "Хүүхэд шиг хөгжилтэй."},
  {title: "Mongol Costumes музей", desc: "Хувцасны түүх үзэх", price: 35000, feeling: "Уламжлалт, баялаг."},
  {title: "Mongolyrics шөнийн ресторан", desc: "Амьд хөгжимтэй", price: 110000, feeling: "Романтик, хөгжимтэй."},
  {title: "Хосын фитнес хичээллэх", desc: "Хосоор бэлтгэл", price: 40000, feeling: "Эрүүл, идэвхтэй."},
  {title: "Vegetarian рестораны туршилт", desc: "Шинэ хооллох газар", price: 70000, feeling: "Шинэлэг, эрүүл."},
  {title: "Stupa Cafe ёгын талбай", desc: "Ёг хичээллэх", price: 50000, feeling: "Тайван, нэгдмэл."},
  {title: "Хархорум 14 хоолны мастер класс", desc: "Хосоор хоол хийх сурах", price: 150000, feeling: "Бүтээлч, хамтын."},
  {title: "Чулууны зэвсгийн музей", desc: "Эртний зэр зэвсэг", price: 30000, feeling: "Эртний түүх."},
  {title: "Mongolian Opera үзэх", desc: "Дуурийн жүжиг", price: 80000, feeling: "Соёлтой, гайхалтай."},
];

const allUbIdeas = [];
for(let i = 0; i < 365; i++) {
  const tmpl = ubIdeaTemplates[i % ubIdeaTemplates.length];
  const dist = districts[i % districts.length];
  const cat = categories[i % categories.length];
  allUbIdeas.push({
    id: i + 1,
    day: i + 1,
    emoji: cat.emoji,
    title: tmpl.title,
    desc: tmpl.desc,
    location: `УБ · ${dist} дүүрэг`,
    price: tmpl.price,
    priceText: tmpl.price === 0 ? "Үнэгүй" : `~${tmpl.price.toLocaleString()}₮`,
    feeling: tmpl.feeling,
    likes: Math.floor(Math.random() * 2000) + 100,
    category: cat.name,
    season: i < 90 ? "winter" : i < 180 ? "spring" : i < 270 ? "summer" : "autumn"
  });
}

function renderUbIdeas() {
  let filtered = allUbIdeas;
  if(currentUbFilter === "winter") filtered = allUbIdeas.filter(i => i.season === "winter");
  else if(currentUbFilter === "spring") filtered = allUbIdeas.filter(i => i.season === "spring");
  else if(currentUbFilter === "summer") filtered = allUbIdeas.filter(i => i.season === "summer");
  else if(currentUbFilter === "autumn") filtered = allUbIdeas.filter(i => i.season === "autumn");
  else if(currentUbFilter === "cheap") filtered = allUbIdeas.filter(i => i.price > 0 && i.price <= 50000);
  else if(currentUbFilter === "free") filtered = allUbIdeas.filter(i => i.price === 0);
  
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const pageItems = filtered.slice(start, start + itemsPerPage);
  
  document.getElementById("ubGrid").innerHTML = pageItems.length ? pageItems.map(renderCard).join("") :
    '<div class="empty-state">Энэ ангилалд санаа байхгүй байна</div>';
  
  let paginationHtml = `<button type="button" onclick="changeUbPage(${currentPage-1})" ${currentPage===1?'disabled':''}>‹ Өмнөх</button>`;
  const startP = Math.max(1, currentPage - 2);
  const endP = Math.min(totalPages, startP + 4);
  for(let i = startP; i <= endP; i++) {
    paginationHtml += `<button type="button" onclick="changeUbPage(${i})" class="${i===currentPage?'active':''}">${i}</button>`;
  }
  paginationHtml += `<button type="button" onclick="changeUbPage(${currentPage+1})" ${currentPage===totalPages?'disabled':''}>Дараах ›</button>`;
  paginationHtml += `<span style="padding: 8px 14px; color: var(--text-light); font-size: 13px;">${filtered.length} санаа</span>`;
  
  document.getElementById("ubPagination").innerHTML = paginationHtml;
}

function changeUbPage(p) {
  if(p < 1) return;
  currentPage = p;
  renderUbIdeas();
  document.getElementById("page-ub").scrollIntoView({behavior:"smooth"});
}

