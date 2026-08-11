// ===== ТОГЛООМ (games hub) =====
// Room-based тоглоомууд Firestore-ийн gameRooms/{code} баримт дээр onSnapshot-оор бодит
// цагийн синк хийдэг. "Host authority" зарчим: зөвхөн room.hostUid == currentUser.uid үед
// л шинэ асуулт үүсгэх/дүгнэх зэрэг төлөв шилжилтийг бичнэ (өрсөлдөх бичилтээс сэргийлнэ).
// Ганцаарчилсан тоглоомууд (Memory, Quiz, Personality, Roulette, Guess, Challenge) room
// огт хэрэггүй, зөвхөн клиент дээрээ л явна.

// ---------- ТОГЛООМЫН КАТАЛОГ ----------
const GAME_CATALOG = {
  knowme:         { label: "Намайг хэр сайн мэдэх вэ?", emoji: "❤️", mode: "couple", engine: "guess", rounds: 6 },
  compat:         { label: "Бидний нийцэл",              emoji: "🧠", mode: "couple", engine: "match", rounds: 8 },
  wyr:            { label: "Аль нь дээр вэ?",            emoji: "🤔", mode: "couple", engine: "match", rounds: 8 },
  whosmore:       { label: "Хэн нь илүү?",               emoji: "🧠", mode: "couple", engine: "vote", rounds: 8 },
  truthdare:      { label: "Үнэн үү? Даалгавар уу?",     emoji: "💬", mode: "couple", engine: "cards" },
  memories:       { label: "Бидний дурсамж",             emoji: "🥰", mode: "couple", engine: "cards" },
  lovequestions:  { label: "Хайрын асуултууд",           emoji: "💌", mode: "couple", engine: "cards" },
  questionbox:    { label: "Асуултын хайрцаг",           emoji: "📦", mode: "couple", engine: "cards" },
  coupleroulette: { label: "Болзооны Roulette",          emoji: "🎲", mode: "couple", engine: "wheel" },
  draw:           { label: "Хамт зур",                   emoji: "🎨", mode: "couple", engine: "drawrate" },
  whoami:         { label: "Who Am I?",                  emoji: "🎭", mode: "group", engine: "whoami" },
  mostlikely:     { label: "Хэн хамгийн...?",             emoji: "😂", mode: "group", engine: "vote", rounds: 8 },
  quizbattle:     { label: "Quiz Battle",                emoji: "🧠", mode: "group", engine: "quiz", rounds: 8 },
  grouptruthdare: { label: "Truth or Dare",              emoji: "🔥", mode: "group", engine: "cards" },
  drawguess:      { label: "Draw & Guess",               emoji: "🖌", mode: "group", engine: "pictionary", rounds: 6 },
  werewolf:       { label: "Werewolf / Mafia",           emoji: "🐺", mode: "group", engine: "soon" },
  songguess:      { label: "Дуу таах",                   emoji: "🎵", mode: "group", engine: "soon" },
};

const SOLO_GAMES = {
  memory:      { label: "Memory",                  emoji: "🧩" },
  lovequiz:    { label: "Love Quiz",                emoji: "🧠" },
  personality: { label: "Love Personality Test",    emoji: "❤️" },
  roulette:    { label: "Болзооны санаа Roulette",  emoji: "🎯" },
  guess:       { label: "Таах тоглоом",             emoji: "❓" },
  challenge:   { label: "Random Challenge",         emoji: "🎲" },
  question:    { label: "Random Question",          emoji: "🔮" },
  letter:      { label: "Ирээдүйн хосдоо захиа",    emoji: "💌" },
  reaction:    { label: "Хурдны шалгалт",           emoji: "⚡" },
  puzzle2048:  { label: "2048",                     emoji: "🔢" },
  flagguess:   { label: "Улсын туг таах",           emoji: "🌍" },
};

// ---------- АСУУЛТ/ПРОМПТ САНГУУД ----------
const Q_KNOWME = [
  { q: "Миний дуртай өнгө?", opts: ["Улаан", "Хөх", "Ногоон", "Шар"] },
  { q: "Амралтын өдрийг хэрхэн өнгөрөөх дуртай вэ?", opts: ["Гэртээ амрах", "Найзуудтайгаа гарах", "Байгальд явах", "Кино үзэх"] },
  { q: "Хамгийн дуртай улирал?", opts: ["Өвөл", "Хавар", "Зун", "Намар"] },
  { q: "Стресстэй үед юу хийдэг вэ?", opts: ["Ном унших", "Хөгжим сонсох", "Явган алхах", "Унтах"] },
  { q: "Аялахдаа юуг илүүд үздэг вэ?", opts: ["Уулархаг газар", "Тэнгисийн эрэг", "Хот", "Хөдөө"] },
  { q: "Өглөө эсвэл орой — аль цагтаа илүү эрч хүчтэй вэ?", opts: ["Өглөө", "Орой", "Хоёул адилхан", "Аль нь ч биш"] },
  { q: "Хамгийн дуртай хоолны төрөл?", opts: ["Монгол хоол", "Ази хоол", "Итали хоол", "Тайван хоол"] },
  { q: "Чөлөөт цагаараа юу хийхэд дуртай вэ?", opts: ["Кино үзэх", "Ном унших", "Спорт хийх", "Найзуудтай уулзах"] },
  { q: "Аль амьтан илүү таалагддаг вэ?", opts: ["Нохой", "Муур", "Хоёул адилхан", "Аль нь ч биш"] },
  { q: "Мөнгөө юунд зарцуулах дуртай вэ?", opts: ["Хувцас", "Аялал", "Хоол", "Хадгаламж"] },
];

const Q_COMPAT = [
  { q: "Идеал амралтын өдөр?", opts: ["Гэртээ кино үзэх", "Гадаа аялах", "Найзуудтай цуглах", "Дэлгүүр хэсэх"] },
  { q: "Мөнгөө хэрхэн зарцуулах нь дээр вэ?", opts: ["Хадгалах", "Аялалд зарцуулах", "Хувцас, гоо сайхан", "Дурсамжинд зарцуулах"] },
  { q: "Хэдэн хүүхэдтэй болмоор байна?", opts: ["0", "1", "2", "3+"] },
  { q: "Аль хотод амьдармаар байна вэ?", opts: ["Улаанбаатар", "Гадаад орон", "Жижиг тайван хот", "Хамаагүй, хамт л бол"] },
  { q: "Гэрийн тэжээвэр амьтан авах уу?", opts: ["Тийм, нохой", "Тийм, муур", "Үгүй", "Бусад амьтан"] },
  { q: "Асуудал гарвал хэрхэн шийддэг вэ?", opts: ["Шууд ярилцах", "Цаг гаргаад тайван бодох", "Хошин зантайгаар", "Бичгээр илэрхийлэх"] },
  { q: "Романтик орой гэдэг чинь?", opts: ["Гэртээ хоол хийх", "Ресторанд очих", "Од харах", "Кино үзэх"] },
  { q: "Аялахдаа юуг илүүд үздэг вэ?", opts: ["Төлөвлөгөөтэй", "Санаандгүй", "Тансаг", "Адал явдалтай"] },
];

const Q_WYR = [
  { q: "Алийг сонгох вэ?", opts: ["Далайн эрэг 🏖️", "Уул 🏔️"] },
  { q: "Алийг сонгох вэ?", opts: ["Кино 🎬", "Ресторан 🍽️"] },
  { q: "Алийг сонгох вэ?", opts: ["Өглөө ☀️", "Орой 🌙"] },
  { q: "Алийг сонгох вэ?", opts: ["Кофе ☕", "Цай 🍵"] },
  { q: "Алийг сонгох вэ?", opts: ["Ном 📖", "Кино 🎬"] },
  { q: "Алийг сонгох вэ?", opts: ["Хот 🏙️", "Хөдөө 🌾"] },
  { q: "Алийг сонгох вэ?", opts: ["Зун ☀️", "Өвөл ❄️"] },
  { q: "Алийг сонгох вэ?", opts: ["Аялал ✈️", "Гэртээ амрах 🏠"] },
  { q: "Алийг сонгох вэ?", opts: ["Инээдтэй кино 😂", "Айдас кино 👻"] },
  { q: "Алийг сонгох вэ?", opts: ["Шөнийн хүн 🌙", "Өглөөний хүн ☀️"] },
];

const CARDS_TRUTHDARE = [
  { type: "truth", text: "Анх намайг харахад юу бодсон бэ?" },
  { type: "dare", text: "30 секунд намайг магтаарай" },
  { type: "truth", text: "Миний ямар зуршил чамд хамгийн эвгүй санагддаг вэ?" },
  { type: "dare", text: "Дуртай дуунаасаа нэг мөр дуулаарай" },
  { type: "truth", text: "Хамгийн их эмзэглэсэн мөчөө хуваалц" },
  { type: "dare", text: "Намайг ирээдүйд юу болно гэж бодож байгаагаа дүрсэлж үзүүлээрэй" },
  { type: "truth", text: "Нууцаар харж явдаг сериал байна уу?" },
  { type: "dare", text: "Хамгийн сайхан комплиментаа хэл" },
  { type: "truth", text: "Хамгийн ичсэн мөчөө хуваалц" },
  { type: "dare", text: "Нүдээ аниад 10 секунд намайг тэвэр" },
];

// Улсын кодоор жинхэнэ туг зурагтай (flagcdn.com) харуулна — Unicode flag emoji нь Windows
// дээр (macOS/iOS-с ялгаатай) огт харагддаггүй тул зөвхөн код хадгалж, imgTag-аар зурна.
const FLAG_BANK = [
  { code: "mn", name: "Монгол" }, { code: "kr", name: "Өмнөд Солонгос" }, { code: "jp", name: "Япон" },
  { code: "cn", name: "Хятад" }, { code: "ru", name: "Орос" }, { code: "us", name: "АНУ" },
  { code: "fr", name: "Франц" }, { code: "de", name: "Герман" }, { code: "it", name: "Итали" },
  { code: "es", name: "Испани" }, { code: "gb", name: "Их Британи" }, { code: "tr", name: "Турк" },
  { code: "br", name: "Бразил" }, { code: "ca", name: "Канад" }, { code: "au", name: "Австрали" },
  { code: "in", name: "Энэтхэг" }, { code: "th", name: "Тайланд" }, { code: "vn", name: "Вьетнам" },
  { code: "mx", name: "Мексик" }, { code: "gr", name: "Грек" }, { code: "nl", name: "Нидерланд" },
  { code: "se", name: "Швед" }, { code: "ch", name: "Швейцарь" }, { code: "ae", name: "ХАЭ" },
  { code: "eg", name: "Египет" }, { code: "za", name: "Өмнөд Африк" }, { code: "sg", name: "Сингапур" },
  { code: "pt", name: "Португал" }, { code: "ar", name: "Аргентин" }, { code: "kz", name: "Казахстан" },
];
function flagImgUrl(code) { return `https://flagcdn.com/w320/${code}.png`; }

const CARDS_MEMORIES = [
  "Бидний анхны уулзалт ямар байсан бэ?",
  "Хамт хийсэн хамгийн хөгжилтэй зүйл юу байсан бэ?",
  "Бидний анхны зөрчил юу байсан бэ, яаж эвлэрсэн бэ?",
  "Чиний надад өгсөн хамгийн дурсамжтай бэлэг юу вэ?",
  "Ирээдүйд бидэнд юу тохиолдоосой гэж хамгийн их хүсдэг вэ?",
  "Хамт авсан хамгийн дуртай зургаа санаж байна уу?",
  "Анх \"би чамд хайртай\" гэж хэзээ хэлсэн бэ?",
];

const CARDS_LOVEQ = [
  "Хайр гэж чиний хувьд юу гэсэн үг вэ?",
  "Бидний харилцаанд юу хамгийн чухал вэ?",
  "10 жилийн дараа бид хаана байх бол?",
  "Намайг юу нь хамгийн их баясгадаг вэ?",
  "Бид хоёрын хамгийн том ялгаа юу вэ, яагаад тэр нь ажилладаг вэ?",
  "Хамт байхдаа хамгийн их сэтгэл хангалуун байдаг мөч?",
  "Хайртай хүндээ хэзээ ч хэлж амжаагүй зүйл байна уу?",
];

const WHOAMI_IDENTITIES = [
  "Чингис хаан", "Хайрын Бурхан", "Аварга шоу хост", "Кино од", "Ертөнцийг аварсан баатар",
  "Робот", "Ид шидтэн", "Хунтайж", "Хунтайж эмэгтэй", "Musician од", "Нууц агент", "Супер хироо",
];

const PROMPTS_MOSTLIKELY = [
  "Хэн хамгийн их хоцордог вэ?", "Хэн хамгийн их инээдэг вэ?", "Хэн хамгийн их унтдаг вэ?",
  "Хэн хамгийн их мөнгө зарцуулдаг вэ?", "Хэн хамгийн романтик вэ?", "Хэн хамгийн зоригтой вэ?",
  "Хэн хамгийн их ярьдаг вэ?", "Хэн хамгийн намуухан вэ?", "Хэн хамгийн муу тогооч вэ?",
  "Хэн хамгийн сайн найз вэ?",
];

const Q_QUIZBATTLE = [
  { q: "Хайрын хормон гэж юуг нэрлэдэг вэ?", opts: ["Окситоцин", "Адреналин", "Инсулин", "Мелатонин"], correct: 0 },
  { q: "Монголд уламжлалт ёсоор онцгой зочинд юу бэлэглэдэг вэ?", opts: ["Алт", "Бөгж", "Хадаг", "Цэцэг"], correct: 2 },
  { q: "Дэлхийд хамгийн олноороо хийгддэг хурим ямар сард болдог вэ (баруунд)?", opts: ["Зун", "Өвөл", "Хавар", "Намар"], correct: 0 },
  { q: "Улаанбаатарт хосуудын хамгийн алдартай уулзах цэг аль нь вэ?", opts: ["Богд уул", "Зайсан толгой", "Найрамдал парк", "Гандан хийд"], correct: 1 },
  { q: "\"Валентины өдөр\" хэдэн сарын хэдэнд байдаг вэ?", opts: ["2-р сарын 14", "3-р сарын 8", "5-р сарын 1", "1-р сарын 1"], correct: 0 },
  { q: "Хосуудын дунд хамгийн түгээмэл хийдэг нэгдсэн хобби аль нь вэ?", opts: ["Хамт кино үзэх", "Хамт код бичих", "Хамт мод тарих", "Хамт зогсох"], correct: 0 },
  { q: "Гэрлэлтийн бөгжийг ямар гарт зүүдэг уламжлалтай вэ?", opts: ["Зүүн гар", "Баруун гар", "Аль ч гар", "Хоёр гарт"], correct: 0 },
  { q: "Монгол ёсоор хосын нэгдэлийг юу гэж нэрлэдэг вэ?", opts: ["Хуримлах", "Айлчлах", "Наадах", "Цуглаан"], correct: 0 },
];

// ---------- ГАНЦААРЧИЛСАН ТОГЛООМЫН АГУУЛГА ----------
const PERSONALITY_QUESTIONS = [
  { q: "Болзооны төгс орой гэвэл?", opts: [
    { t: "Од харж, гар барин алхах", trait: "romantic" },
    { t: "Шинэ газар хамт нээх аялал", trait: "adventurous" },
    { t: "Гэртээ хоол хийж, ярилцах", trait: "caring" },
    { t: "Тоглоом тоглож, инээлдэх", trait: "playful" },
  ]},
  { q: "Хайртай хүндээ юу бэлэглэдэг вэ?", opts: [
    { t: "Гар хийцийн, утга учиртай бэлэг", trait: "romantic" },
    { t: "Хамтдаа хийх аялал", trait: "adventurous" },
    { t: "Хэрэгтэй, практик зүйл", trait: "caring" },
    { t: "Хөгжилтэй, гэнэтийн зүйл", trait: "playful" },
  ]},
  { q: "Маргаан гарвал юу хийдэг вэ?", opts: [
    { t: "Хайр дурлалын үгээр эвлэрдэг", trait: "romantic" },
    { t: "Хамт хаа нэгтээ явж толилдог", trait: "adventurous" },
    { t: "Тайван ярилцаж, шийдэл олдог", trait: "caring" },
    { t: "Инээдтэй зүйл хийж уур тайлдаг", trait: "playful" },
  ]},
  { q: "Ирээдүйн гэр бүлийн амьдралаа хэрхэн төсөөлдөг вэ?", opts: [
    { t: "Хайр дүүрэн, дотно гэр бүл", trait: "romantic" },
    { t: "Дэлхийг хамт үзсэн гэр бүл", trait: "adventurous" },
    { t: "Тогтвортой, дэмжлэгтэй гэр бүл", trait: "caring" },
    { t: "Инээд хөөртэй, эрч хүчтэй гэр бүл", trait: "playful" },
  ]},
  { q: "Хамгийн их баярладаг мөч?", opts: [
    { t: "Хайртай хүнээсээ \"хайртай\" гэдгийг сонсох", trait: "romantic" },
    { t: "Хамт шинэ зүйл эхлэх мөч", trait: "adventurous" },
    { t: "Хайртай хүндээ туслах боломж олдох", trait: "caring" },
    { t: "Хамт инээж хөгжих мөч", trait: "playful" },
  ]},
];
const PERSONALITY_RESULTS = {
  romantic:    { title: "💕 Романтик зүрх", desc: "Чи жижиг дохио зангаа, дулаахан үгэнд их ач холбогдол өгдөг. Гар бичмэл захидал, лаа асаасан орой чиний хэлээр ярьдаг хайрын хэл." },
  adventurous: { title: "🌍 Адал явдалт сэтгэл", desc: "Чи хайраа шинэ туршлагаар илэрхийлдэг. Хамт аялж, шинэ газар нээх нь чиний хувьд хайрын хамгийн гүн илэрхийлэл." },
  caring:      { title: "🤗 Халамжтай зүрх", desc: "Чи жижиг анхаарал халамжаараа хайраа харуулдаг. Хажууд байж, дэмждэг, найдвартай хамтрагч чи." },
  playful:     { title: "🎈 Хөгжилтэй сүнс", desc: "Чи инээд, зугаагаар харилцаагаа тэжээдэг. Чамтай хамт байх бүр л хөгжилтэй адал явдал." },
};

const GUESS_ROUNDS = [
  { clues: ["💐", "💍", "🎊", "❤️"], answer: "хурим", hint: "5 үсэгтэй, баярын арга хэмжээ" },
  { clues: ["🌅", "🏔", "📸", "💑"], answer: "аялал", hint: "5 үсэгтэй, хамт хийдэг зүйл" },
  { clues: ["☕", "📖", "🌳", "😌"], answer: "тайван болзоо", hint: "хоёр үгтэй" },
  { clues: ["💌", "✍️", "❤️", "📮"], answer: "захидал", hint: "хуучин үеийн харилцах арга" },
  { clues: ["🎂", "🕯️", "🎁", "🎉"], answer: "төрсөн өдөр", hint: "хоёр үгтэй, жил бүр тохиолддог" },
  { clues: ["🌙", "⭐", "🔭", "💫"], answer: "од харах", hint: "хоёр үгтэй, шөнийн болзоо" },
];

const RANDOM_CHALLENGES = [
  "Хайртай хүндээ яг одоо \"чи миний өдрийг гэрэлтүүлдэг\" гэж бич",
  "5 минутын дотор хамтдаа хийх зураг авах санаа бод",
  "Хайртай хүнийхээ хамгийн сайхан 3 чанарыг нэрлэ",
  "Дараагийн 24 цагт нэг гэнэтийн эелдэг зүйл хий",
  "Хамт хийж үзээгүй 1 зүйлээ бод, санал болго",
  "Хайртай хүндээ дуртай дуунаасаа нэг мөр илгээ",
  "Өнөөдөр анх удаа хийсэн зүйлээ бод, хуваалц",
  "5 секундэд хайртай хүнийхээ талаар 3 зүйл бод",
];

const UB_IDEA_WHEEL = [
  { emoji: "☕", label: "Кофе шоп болзоо" },
  { emoji: "🌳", label: "Парк алхалт" },
  { emoji: "🎬", label: "Кино театр" },
  { emoji: "🍽", label: "Оройн хоол" },
  { emoji: "🏛", label: "Музей үзэх" },
  { emoji: "🎨", label: "Урлагийн галерей" },
  { emoji: "⛸", label: "Гулгуурын парк" },
  { emoji: "🎳", label: "Боулинг" },
];

// ---------- ХЭН НЬ ИЛҮҮ? (couple vote engine) ----------
const PROMPTS_WHOSMORE = [
  "Хэн нь түрүүлж уучлалт гуйдаг вэ?", "Хэн нь илүү романтик вэ?", "Хэн нь илүү атаархуу вэ?",
  "Хэн нь илүү тэвчээртэй вэ?", "Хэн нь илүү санаачлагатай вэ?", "Хэн нь илүү зохион байгуулалттай вэ?",
  "Хэн нь илүү сэтгэл хөдлөлөө нуудаг вэ?", "Хэн нь илүү өглөөнд эрч хүчтэй вэ?",
];

// ---------- АСУУЛТЫН ХАЙРЦАГ (сэдвээр ангилсан "cards" сан) ----------
const QUESTIONBOX_CATEGORIES = {
  fun:         { label: "Хөгжилтэй", emoji: "😄", items: [
    "Чи бага байхдаа юу болмоор байсан бэ?", "Хамгийн инээдтэй дурсамж чинь юу вэ?",
    "Чи ямар superpower авмаар байна?", "Чиний хамгийн хачин зуршил юу вэ?",
    "Хамгийн сүүлд юунд их инээсэн бэ?",
  ]},
  interesting: { label: "Сонирхолтой", emoji: "💡", items: [
    "Чи амьдралдаа хамгийн их сурсан зүйл юу вэ?", "Чамайг гайхшруулсан хамгийн сүүлийн зүйл юу вэ?",
    "Чи ямар ур чадвар сурмаар байна?", "Чи ямар улс орон зочилмоор байна вэ, яагаад?",
    "Чиний дуртай ном/кино юу вэ, яагаад дуртай вэ?",
  ]},
  deep:        { label: "Гүнзгий", emoji: "🌊", items: [
    "Чи юунаас хамгийн их айдаг вэ?", "Аз жаргал гэж чиний хувьд юу гэсэн үг вэ?",
    "Чи амьдралдаа юуг хамгийн их эрхэмлэдэг вэ?", "Чи хэн байхыг хүсдэг вэ, яагаад?",
    "Хамгийн хэцүү сургамж чинь юу байсан бэ?",
  ]},
  romantic:    { label: "Романтик", emoji: "💕", items: CARDS_LOVEQ,
  },
};

// ---------- БОЛЗООНЫ ROULETTE (couple room, шууд микро-даалгавар) ----------
const COUPLE_ROULETTE_DARES = [
  { emoji: "📵", label: "10 минут утсаа хаяад ярилц" },
  { emoji: "😘", label: "Хамт байгаа хүнээ үнс" },
  { emoji: "🎵", label: "Хамт дуртай дуугаа сонс" },
  { emoji: "🤗", label: "1 минут чимээгүй тэврэлд" },
  { emoji: "📸", label: "Хамт хөгжилтэй зураг ав" },
  { emoji: "💃", label: "Хамт 30 секунд бүжигл" },
  { emoji: "✍️", label: "Бие биедээ мессеж бич (гар утсаа биш, цаасан дээр)" },
  { emoji: "😂", label: "Инээдтэй дуураймал үзүүл" },
  { emoji: "🍫", label: "Бие биенээ амттан хооллуул" },
  { emoji: "🌟", label: "Хайртай хүнийхээ нэг гайхалтай чанарыг хэл" },
];

// ---------- ХАМТ ЗУР (couple drawrate) ----------
const DRAW_TOPICS = [
  "Манай хайр", "Хамгийн сайхан болзоо", "Ирээдүйн гэр", "Хамтдаа аялах газар",
  "Манай гэрийн тэжээвэр амьтан", "Хамгийн дуртай хоол", "Хамтдаа хийсэн адал явдал", "Хайрын бэлэг",
];

// ---------- DRAW & GUESS (group pictionary) ----------
const PICTIONARY_WORDS = [
  "зүрх", "хайр", "хурим", "цэцэг", "нар", "уул", "загас", "гэр", "морь", "од",
  "хос", "бөгж", "тэнгис", "цас", "муур", "нохой", "мод", "нар", "сар", "далавч",
];

// ---------- ГАНЦААРЧИЛСАН: RANDOM QUESTION ----------
const SOLO_RANDOM_QUESTIONS = [
  "Чи хэнтэй хамгийн их цаг өнгөрөөхийг хүсдэг вэ, яагаад?",
  "Аз жаргалтай байхын тулд чамд юу хамгийн их хэрэгтэй вэ?",
  "Чи 5 жилийн дараа хаана байхыг хүсдэг вэ?",
  "Хайр гэдэг чиний хувьд яаж мэдрэгддэг вэ?",
  "Чи өөрийнхөө ямар чанарт хамгийн их бахархдаг вэ?",
  "Чи хамгийн сүүлд хэнд талархсан бэ, юуны төлөө?",
  "Чиний хамгийн том мөрөөдөл юу вэ?",
  "Чи болзоо/харилцаанаас юу хамгийн их хайдаг вэ?",
  "Чиний амьдралыг өөрчилсөн нэг мөч байна уу?",
  "Чи өнөөдөр өөртөө ямар нэг сайхан зүйл хийсэн үү?",
];

// ---------- ТЭЖ ХЭРЭГЛЭГДЭХ ХЭЛБЭР ----------
let currentRoom = null;      // { id, ...room data } — сүүлд ирсэн snapshot
let roomUnsub = null;
let soloState = {};          // ганцаарчилсан тоглоомын явцын мэдээлэл

function gameRoot() { return document.getElementById("gamesRoot"); }

function initGamesPage() {
  renderGamesHome();
}

function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function randomCode6() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// ================= ГЛАВНЫ ХУУДАС =================
function renderGamesHome() {
  if (roomUnsub) { roomUnsub(); roomUnsub = null; }
  currentRoom = null;
  gameRoot().innerHTML = `
    <h1 style="margin-bottom:6px;">🎮 Тоглоомын өрөө</h1>
    <p style="color:var(--text-light);margin-bottom:24px;">Хосоороо, ганцаараа, олуулаа тоглож, бие биенээ илүү таньж, ярилцаж, инээцгээе.</p>

    <div class="game-mode-grid">
      <div class="game-mode-card" onclick="renderRoomSetup('couple')">
        <div class="game-mode-emoji">💑</div>
        <h3>Хосоороо тоглох</h3>
        <p>Хоёулаа өөрийн утаснаасаа room-д нэгдэж, бодит цагийн хосын тоглоом тоглоно.</p>
      </div>
      <div class="game-mode-card" onclick="renderSoloHome()">
        <div class="game-mode-emoji">👤</div>
        <h3>Ганцаараа тоглох</h3>
        <p>Room хэрэггүй, шууд эхэлж болно.</p>
      </div>
      <div class="game-mode-card" onclick="renderRoomSetup('group')">
        <div class="game-mode-emoji">👥</div>
        <h3>Олуулаа тоглох</h3>
        <p>4-10 найзаа room код хуваалцаад хамт тоглоцгоо.</p>
      </div>
    </div>

    <div class="game-featured-card game-anim-in" onclick="renderCoupleChallenge()">
      <div class="game-featured-emoji">💕</div>
      <div>
        <h3>7 хоногийн Couple Challenge</h3>
        <p>Өдөр бүр нэг жижиг challenge — streak цуглуулж, хамтдаа дурсамж бүтээгээрэй.</p>
      </div>
      <span class="game-featured-arrow">→</span>
    </div>`;
}

// ================= 7 ХОНОГИЙН COUPLE CHALLENGE =================
async function renderCoupleChallenge() {
  if (typeof currentUser === "undefined" || !currentUser) {
    showToast("⚠️ Эхлээд нэвтэрнэ үү");
    if (typeof openAuth === "function") openAuth("login");
    return;
  }
  gameRoot().innerHTML = `<div style="text-align:center;padding:60px 0;color:var(--text-light);">Ачааллаж байна...</div>`;
  try {
    await loadCoupleData();
  } catch (e) {
    console.warn("renderCoupleChallenge loadCoupleData error:", e);
    gameRoot().innerHTML = `
      <a class="back-btn" onclick="renderGamesHome()">← Буцах</a>
      <div class="game-round-card game-anim-in" style="text-align:center;">
        <div style="font-size:44px;">⚠️</div>
        <h2>Ачаалахад алдаа гарлаа</h2>
        <p class="game-round-sub">${escapeHtml(e.message || "Дахин оролдоно уу")}</p>
        <button class="btn btn-primary" type="button" style="width:100%;margin-top:10px;" onclick="renderCoupleChallenge()">🔄 Дахин оролдох</button>
      </div>`;
    return;
  }
  if (!currentCouple) {
    gameRoot().innerHTML = `
      <a class="back-btn" onclick="renderGamesHome()">← Буцах</a>
      <div class="game-round-card game-anim-in" style="text-align:center;">
        <div style="font-size:44px;">💕</div>
        <h2>7 хоногийн Couple Challenge</h2>
        <p class="game-round-sub">Энэ feature-г ашиглахын тулд эхлээд хосоо холбох хэрэгтэй. Профайл цэснээс "💑 Хосын дурсамж" хэсэгт ороод кодоор холбогдоорой.</p>
        <button class="btn btn-primary" type="button" style="width:100%;margin-top:10px;" onclick="openProfileModal()">Профайл руу очих</button>
      </div>`;
    return;
  }
  renderChallengeBoard();
}

function renderChallengeBoard() {
  const state = getChallengeState() || {};
  const hasStarted = !!state.startedAt;
  const completedDays = state.completedDays || {};
  const doneCount = Object.keys(completedDays).length;
  const allDone = doneCount >= 7;
  const nextDay = CHALLENGE_DAYS.find(d => !completedDays[d.day]);

  gameRoot().innerHTML = `
    <a class="back-btn" onclick="renderGamesHome()">← Буцах</a>
    <h2 style="margin:10px 0 4px;">💕 7 хоногийн Couple Challenge</h2>
    <p style="color:var(--text-light);margin-bottom:16px;">Өдөр бүр нэг жижиг challenge хийж, хамтдаа дурсамж бүтээгээрэй.</p>
    ${!hasStarted ? `
      <div class="game-round-card game-anim-in" style="text-align:center;">
        <button class="btn btn-primary" type="button" style="width:100%" onclick="handleStartChallenge()">🚀 Challenge эхлүүлэх</button>
      </div>` : `
      <div class="game-challenge-progress">
        <div class="game-challenge-streak">🔥 ${doneCount} / 7 өдөр</div>
        <div class="game-challenge-bar"><div class="game-challenge-bar-fill" style="width:${(doneCount / 7) * 100}%;"></div></div>
      </div>
      <div class="game-challenge-days">
        ${CHALLENGE_DAYS.map(d => `
          <div class="game-challenge-day ${completedDays[d.day] ? "is-done" : ""}">
            <div class="game-challenge-day-num">${d.day}</div>
            <div class="game-challenge-day-emoji">${d.emoji}</div>
            <div class="game-challenge-day-title">${escapeHtml(d.title)}</div>
            ${completedDays[d.day]
              ? '<div class="game-challenge-check">✅</div>'
              : (nextDay && d.day === nextDay.day ? `<button class="btn btn-primary" type="button" style="width:100%;margin-top:6px;font-size:12px;padding:8px;" onclick="handleMarkDay(${d.day})">Дуусгасан ✓</button>` : "")}
          </div>`).join("")}
      </div>
      ${allDone ? `
        <div class="game-round-card game-anim-in game-challenge-badge" style="text-align:center;margin-top:16px;">
          <div style="font-size:52px;">🏆</div>
          <h2>Challenge Champion!</h2>
          <p class="game-round-sub">7 хоногийн challenge-г амжилттай дуусгалаа 🎉</p>
          <button class="btn btn-ghost" type="button" style="width:100%;margin-top:10px;" onclick="handleResetChallenge()">🔄 Дахин эхлүүлэх</button>
        </div>` : ""}
    `}`;
}

async function handleStartChallenge() {
  try { await startCoupleChallenge(); renderChallengeBoard(); showToast("🚀 Challenge эхэллээ!"); }
  catch (e) { console.warn("handleStartChallenge error:", e); showToast("⚠️ Алдаа гарлаа: " + (e.message || "")); }
}
async function handleMarkDay(day) {
  try { await markChallengeDay(day); renderChallengeBoard(); showToast("✅ Challenge дууслаа!"); }
  catch (e) { console.warn("handleMarkDay error:", e); showToast("⚠️ Алдаа гарлаа: " + (e.message || "")); }
}
async function handleResetChallenge() {
  try { await resetCoupleChallenge(); renderChallengeBoard(); }
  catch (e) { console.warn("handleResetChallenge error:", e); showToast("⚠️ Алдаа гарлаа: " + (e.message || "")); }
}

// ================= ROOM ҮҮСГЭХ / НЭГДЭХ =================
function renderRoomSetup(mode) {
  if (typeof currentUser === "undefined" || !currentUser) {
    showToast("⚠️ Тоглохын тулд эхлээд нэвтэрнэ үү");
    if (typeof openAuth === "function") openAuth("login");
    return;
  }
  const isCouple = mode === "couple";
  gameRoot().innerHTML = `
    <a class="back-btn" onclick="renderGamesHome()">← Буцах</a>
    <h2 style="margin:10px 0 4px;">${isCouple ? "💑 Хосоороо тоглох" : "👥 Олуулаа тоглох"}</h2>
    <p style="color:var(--text-light);margin-bottom:20px;">${isCouple ? "Room үүсгээд хосдоо линк/код явуулаарай." : "Room үүсгээд 4-10 найзтайгаа код хуваалцаарай."}</p>
    <div class="game-setup-grid">
      <div class="game-setup-card">
        <h3>➕ Room үүсгэх</h3>
        <p>Та host болно, тоглоомоо сонгож эхлүүлнэ.</p>
        <button class="btn btn-primary" type="button" style="width:100%" onclick="handleCreateRoom('${mode}')">Room үүсгэх</button>
      </div>
      <div class="game-setup-card">
        <h3>🔑 Room-д нэгдэх</h3>
        <p>Найзынхаа явуулсан 6 оронтой кодыг оруулаарай.</p>
        <input type="text" id="joinRoomCode" maxlength="6" placeholder="жишээ: A7K92P" style="text-transform:uppercase;text-align:center;font-size:20px;letter-spacing:3px;font-weight:700;">
        <button class="btn btn-ghost" type="button" style="width:100%;margin-top:10px;" onclick="handleJoinRoom()">Нэгдэх</button>
      </div>
    </div>
    <div id="roomSetupStatus" style="min-height:20px;margin-top:14px;font-size:13px;color:var(--text-light);"></div>`;
}

async function handleCreateRoom(mode) {
  const statusEl = document.getElementById("roomSetupStatus");
  if (statusEl) statusEl.textContent = "Room үүсгэж байна...";
  try {
    const code = await createGameRoom(mode);
    subscribeRoom(code);
  } catch (e) {
    if (statusEl) statusEl.textContent = "⚠️ Алдаа: " + e.message;
  }
}

async function createGameRoom(mode) {
  if (!db) throw new Error("Firebase холбогдоогүй байна");
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode6();
    const ref = db.collection("gameRooms").doc(code);
    const snap = await ref.get();
    if (snap.exists) continue;
    await ref.set({
      code, mode, hostUid: currentUser.uid, gameType: null, engine: null,
      status: "lobby",
      players: { [currentUser.uid]: { name: currentUser.name || "Хэрэглэгч", photoURL: currentUser.photoURL || "", score: 0, joinedAt: Date.now() } },
      round: 0, totalRounds: 0, roundData: null, answers: {}, phase: "lobby",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return code;
  }
  throw new Error("Room үүсгэхэд алдаа гарлаа, дахин оролдоно уу");
}

async function handleJoinRoom() {
  const input = document.getElementById("joinRoomCode");
  const statusEl = document.getElementById("roomSetupStatus");
  const code = (input?.value || "").trim().toUpperCase();
  if (!code) { if (statusEl) statusEl.textContent = "⚠️ Код оруулна уу"; return; }
  if (statusEl) statusEl.textContent = "Нэгдэж байна...";
  try {
    await joinGameRoom(code);
    subscribeRoom(code);
  } catch (e) {
    if (statusEl) statusEl.textContent = "⚠️ " + e.message;
  }
}

async function joinGameRoom(code) {
  if (!db) throw new Error("Firebase холбогдоогүй байна");
  const ref = db.collection("gameRooms").doc(code);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Room олдсонгүй. Кодоо шалгана уу");
  const room = snap.data();
  if (room.players && room.players[currentUser.uid]) return; // already in
  const maxPlayers = room.mode === "couple" ? 2 : 10;
  const count = Object.keys(room.players || {}).length;
  if (count >= maxPlayers) throw new Error("Room дүүрсэн байна");
  if (room.status !== "lobby") throw new Error("Тоглоом аль хэдийн эхэлсэн байна");
  await ref.update({
    [`players.${currentUser.uid}`]: { name: currentUser.name || "Хэрэглэгч", photoURL: currentUser.photoURL || "", score: 0, joinedAt: Date.now() },
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

function subscribeRoom(code) {
  if (roomUnsub) { roomUnsub(); roomUnsub = null; }
  gameRoot().innerHTML = `<div style="text-align:center;padding:60px 0;color:var(--text-light);">Room-д холбогдож байна...</div>`;
  roomUnsub = db.collection("gameRooms").doc(code).onSnapshot(snap => {
    if (!snap.exists) {
      showToast("⚠️ Room хаагдсан байна");
      renderGamesHome();
      return;
    }
    currentRoom = { id: snap.id, ...snap.data() };
    renderRoomView();
  }, err => {
    console.warn("room snapshot error:", err);
    showToast("⚠️ Room-той холбогдоход алдаа гарлаа");
  });
}

function isHost() { return currentRoom && currentUser && currentRoom.hostUid === currentUser.uid; }

async function leaveRoom() {
  if (roomUnsub) { roomUnsub(); roomUnsub = null; }
  if (currentRoom && db && currentUser) {
    try {
      if (isHost()) {
        await db.collection("gameRooms").doc(currentRoom.id).delete();
      } else {
        const players = { ...currentRoom.players };
        delete players[currentUser.uid];
        await db.collection("gameRooms").doc(currentRoom.id).update({ players });
      }
    } catch (e) { console.warn("leaveRoom error:", e); }
  }
  currentRoom = null;
  renderGamesHome();
}

function copyRoomCode() {
  if (!currentRoom) return;
  const url = `${location.origin}${location.pathname}`;
  const text = `NBolzoo тоглоомд нэгдээрэй! Код: ${currentRoom.code}\n${url}`;
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => showToast("🔗 Хуулагдлаа!"));
}

// ================= ROOM ДОТООД ХАРАГДАЦ =================
function renderRoomView() {
  if (!currentRoom) return;
  if (currentRoom.status === "lobby") return renderLobby();
  if (currentRoom.status === "playing") return renderGamePlay();
  if (currentRoom.status === "finished") return renderResults();
}

function renderLobby() {
  const players = Object.entries(currentRoom.players || {});
  const catalogList = Object.entries(GAME_CATALOG).filter(([, g]) => g.mode === currentRoom.mode);
  gameRoot().innerHTML = `
    <a class="back-btn" onclick="leaveRoom()">← Room-оос гарах</a>
    <div class="game-room-code-box">
      <div class="game-room-code-label">ROOM КОД</div>
      <div class="game-room-code">${escapeHtml(currentRoom.code)}</div>
      <button class="btn btn-ghost" type="button" onclick="copyRoomCode()">🔗 Хуулах / Хуваалцах</button>
    </div>
    <h3 style="margin:20px 0 10px;">👥 Тоглогчид (${players.length}${currentRoom.mode === "couple" ? "/2" : "/10"})</h3>
    <div class="game-player-list">
      ${players.map(([uid, p]) => `
        <div class="game-player-chip ${uid === currentRoom.hostUid ? "is-host" : ""}">
          <div class="avatar" style="width:32px;height:32px;font-size:13px;">${p.photoURL ? `<img src="${escapeHtml(p.photoURL)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : escapeHtml((p.name || "?").charAt(0))}</div>
          <span>${escapeHtml(p.name)}</span>
          ${uid === currentRoom.hostUid ? '<span class="game-host-badge">👑 Host</span>' : ""}
        </div>`).join("")}
    </div>
    ${isHost() ? `
      <h3 style="margin:24px 0 10px;">🎮 Тоглоом сонгох</h3>
      <div class="game-catalog-grid">
        ${catalogList.map(([id, g]) => `
          <div class="game-catalog-card ${g.engine === "soon" ? "is-soon" : ""}" onclick="${g.engine === "soon" ? "" : `handleStartGame('${id}')`}">
            <div class="game-catalog-emoji">${g.emoji}</div>
            <div class="game-catalog-label">${escapeHtml(g.label)}</div>
            ${g.engine === "soon" ? '<div class="game-soon-badge">Тун удахгүй</div>' : ""}
          </div>`).join("")}
      </div>
      ${currentRoom.mode === "couple" && players.length < 2 ? '<p style="color:var(--text-light);font-size:13px;margin-top:10px;">⏳ Хоёулаа room-д нэгдмэгц тоглоом эхлүүлж болно.</p>' : ""}
    ` : `<p style="color:var(--text-light);margin-top:20px;">⏳ Host тоглоомоо сонгохыг хүлээж байна...</p>`}
  `;
}

async function handleStartGame(gameType) {
  if (!isHost() || !currentRoom) return;
  const g = GAME_CATALOG[gameType];
  if (!g || g.engine === "soon") return;
  const players = Object.keys(currentRoom.players || {});
  if (currentRoom.mode === "couple" && players.length < 2) { showToast("⚠️ Хосдоо хүлээгээрэй, хоёулаа room-д нэгдэх хэрэгтэй"); return; }
  if (currentRoom.mode === "group" && players.length < 3) { showToast("⚠️ Дор хаяж 3 тоглогч хэрэгтэй"); return; }

  const updates = { gameType, engine: g.engine, status: "playing", round: 0, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };

  if (g.engine === "whoami") {
    const ids = shuffleArr(WHOAMI_IDENTITIES).slice(0, players.length);
    const newPlayers = { ...currentRoom.players };
    players.forEach((uid, i) => { newPlayers[uid] = { ...newPlayers[uid], secretIdentity: ids[i], guessed: false, guessedAt: null }; });
    updates.players = newPlayers;
    updates.phase = "playing";
  } else if (g.engine === "cards") {
    updates.roundData = gameType === "questionbox" ? { category: null, cardIndex: 0 } : { cardIndex: 0 };
    updates.phase = "playing";
  } else if (g.engine === "wheel") {
    updates.roundData = { resultIdx: null, spinCount: 0 };
    updates.phase = "playing";
  } else if (g.engine === "drawrate") {
    updates.roundData = { topic: DRAW_TOPICS[Math.floor(Math.random() * DRAW_TOPICS.length)], drawings: {}, ratings: {} };
    updates.phase = "drawing";
  } else if (g.engine === "pictionary") {
    updates.totalRounds = g.rounds || 6;
    updates.roundData = buildPictionaryRound(0);
    updates.phase = "drawing";
  } else {
    updates.totalRounds = g.rounds || 8;
    updates.answers = {};
    updates.roundData = buildRoundData(gameType, 0);
    updates.phase = "answering";
  }

  await db.collection("gameRooms").doc(currentRoom.id).update(updates);
}

function buildRoundData(gameType, roundIdx) {
  if (gameType === "knowme") {
    const bank = Q_KNOWME[roundIdx % Q_KNOWME.length];
    const playerUids = Object.keys(currentRoom.players);
    const answerer = playerUids[roundIdx % playerUids.length];
    return { q: bank.q, opts: bank.opts, answererUid: answerer };
  }
  if (gameType === "compat") {
    const bank = Q_COMPAT[roundIdx % Q_COMPAT.length];
    return { q: bank.q, opts: bank.opts };
  }
  if (gameType === "wyr") {
    const bankWyr = Q_WYR[roundIdx % Q_WYR.length];
    return { q: bankWyr.q, opts: bankWyr.opts };
  }
  if (gameType === "mostlikely") {
    return { q: PROMPTS_MOSTLIKELY[roundIdx % PROMPTS_MOSTLIKELY.length] };
  }
  if (gameType === "whosmore") {
    return { q: PROMPTS_WHOSMORE[roundIdx % PROMPTS_WHOSMORE.length] };
  }
  if (gameType === "quizbattle") {
    const bank = Q_QUIZBATTLE[roundIdx % Q_QUIZBATTLE.length];
    return { q: bank.q, opts: bank.opts, correct: bank.correct };
  }
  return {};
}

// ================= ТОГЛООМЫН ЯВЦ (engine-ээр салгасан) =================
function renderGamePlay() {
  const g = GAME_CATALOG[currentRoom.gameType];
  if (!g) return renderLobby();
  if (g.engine === "cards") return renderCardsEngine(g);
  if (g.engine === "whoami") return renderWhoAmIEngine();
  if (g.engine === "wheel") return renderWheelRoomEngine(g);
  if (g.engine === "drawrate") return renderDrawRateEngine(g);
  if (g.engine === "pictionary") return renderPictionaryEngine(g);
  return renderRoundEngine(g);
}

function playerName(uid) { return (currentRoom.players[uid] && currentRoom.players[uid].name) || "?"; }

// ---- Асуулт/сонголт-суурьтай төрлүүд: guess / match / vote / quiz ----
function renderRoundEngine(g) {
  const rd = currentRoom.roundData || {};
  const myAnswer = (currentRoom.answers || {})[currentUser.uid];
  const allAnswered = Object.keys(currentRoom.players).every(uid => (currentRoom.answers || {})[uid] !== undefined);
  const isReveal = currentRoom.phase === "reveal";

  let questionHtml = "";
  let optionsHtml = "";

  if (g.engine === "guess") {
    const amAnswerer = rd.answererUid === currentUser.uid;
    questionHtml = amAnswerer
      ? `<h2>${escapeHtml(rd.q)}</h2><p class="game-round-sub">Энэ бол чиний асуулт — үнэн хариултаа сонго 👇</p>`
      : `<h2>${escapeHtml(playerName(rd.answererUid))}-ийн тухай: ${escapeHtml(rd.q)}</h2><p class="game-round-sub">Тэдний хариултыг таагаарай 👇</p>`;
    optionsHtml = (rd.opts || []).map((opt, i) => `
      <div class="game-opt ${myAnswer === i ? "picked" : ""}" onclick="submitRoundAnswer(${i})">${escapeHtml(opt)}</div>`).join("");
  } else if (g.engine === "match") {
    questionHtml = `<h2>${escapeHtml(rd.q)}</h2>`;
    if (rd.opts) {
      optionsHtml = rd.opts.map((opt, i) => `<div class="game-opt ${myAnswer === i ? "picked" : ""}" onclick="submitRoundAnswer(${i})">${escapeHtml(opt)}</div>`).join("");
    } else {
      optionsHtml = `
        <div class="game-opt ${myAnswer === "A" ? "picked" : ""}" onclick="submitRoundAnswer('A')">Сонголт А</div>
        <div class="game-opt ${myAnswer === "B" ? "picked" : ""}" onclick="submitRoundAnswer('B')">Сонголт Б</div>`;
    }
  } else if (g.engine === "vote") {
    questionHtml = `<h2>${escapeHtml(rd.q)}</h2><p class="game-round-sub">Хэнийг сонгох вэ?</p>`;
    optionsHtml = Object.keys(currentRoom.players).map(uid => `
      <div class="game-opt ${myAnswer === uid ? "picked" : ""}" onclick="submitRoundAnswer('${uid}')">${escapeHtml(uid === currentUser.uid ? "Би" : playerName(uid))}</div>`).join("");
  } else if (g.engine === "quiz") {
    questionHtml = `<h2>${escapeHtml(rd.q)}</h2>`;
    optionsHtml = (rd.opts || []).map((opt, i) => `
      <div class="game-opt ${myAnswer === i ? "picked" : ""} ${isReveal ? (i === rd.correct ? "correct" : (myAnswer === i ? "wrong" : "")) : ""}" onclick="submitRoundAnswer(${i})">${escapeHtml(opt)}</div>`).join("");
  }

  const scoreRows = Object.entries(currentRoom.players).sort((a, b) => (b[1].score || 0) - (a[1].score || 0))
    .map(([uid, p]) => `<div class="game-score-row"><span>${escapeHtml(p.name)}</span><b>${p.score || 0}</b></div>`).join("");

  gameRoot().innerHTML = `
    <a class="back-btn" onclick="leaveRoom()">← Room-оос гарах</a>
    <div class="game-round-progress">Асуулт ${currentRoom.round + 1} / ${currentRoom.totalRounds}</div>
    <div class="game-round-card">
      ${questionHtml}
      <div class="game-opts">${optionsHtml}</div>
      ${isReveal ? renderRevealBlock(g, rd) : ""}
    </div>
    ${isHost() ? `
      <button class="btn btn-primary" type="button" style="width:100%;margin-top:16px;" onclick="${isReveal ? "hostNextRound()" : "hostRevealRound()"}" ${!isReveal && !allAnswered ? "disabled" : ""}>
        ${isReveal ? (currentRoom.round + 1 >= currentRoom.totalRounds ? "Дүгнэлт харах →" : "Дараагийн асуулт →") : (allAnswered ? "Дүгнэх →" : "Хүлээж байна...")}
      </button>` : `<p style="color:var(--text-light);text-align:center;margin-top:16px;">${isReveal ? "Host дараагийн алхмыг хүлээж байна..." : (myAnswer !== undefined ? "✅ Хариулсан! Бусдыг хүлээж байна..." : "Хариултаа сонгоно уу 👆")}</p>`}
    <h4 style="margin:24px 0 8px;">🏆 Оноо</h4>
    <div class="game-score-list">${scoreRows}</div>`;
}

function renderRevealBlock(g, rd) {
  const answers = currentRoom.answers || {};
  if (g.engine === "guess") {
    const answererAns = answers[rd.answererUid];
    const rows = Object.keys(currentRoom.players).filter(uid => uid !== rd.answererUid).map(uid => {
      const correct = answers[uid] === answererAns;
      return `<div class="game-reveal-row">${escapeHtml(playerName(uid))}: ${escapeHtml((rd.opts || [])[answers[uid]] || "—")} ${correct ? "✅" : "❌"}</div>`;
    }).join("");
    return `<div class="game-reveal-box"><b>${escapeHtml(playerName(rd.answererUid))}-ийн үнэн хариулт:</b> ${escapeHtml((rd.opts || [])[answererAns] || "—")}<br>${rows}</div>`;
  }
  if (g.engine === "match") {
    const uids = Object.keys(currentRoom.players);
    const vals = uids.map(uid => answers[uid]);
    const allSame = vals.every(v => v === vals[0]);
    const rows = uids.map(uid => `<div class="game-reveal-row">${escapeHtml(playerName(uid))}: ${escapeHtml(rd.opts ? (rd.opts[answers[uid]] || "—") : (answers[uid] === "A" ? "Сонголт А" : "Сонголт Б"))}</div>`).join("");
    return `<div class="game-reveal-box">${rows}<br><b>${allSame ? "🎉 Нийцэлтэй!" : "🤷 Өөр өөр хариулт"}</b></div>`;
  }
  if (g.engine === "vote") {
    const tally = {};
    Object.values(answers).forEach(votedUid => { tally[votedUid] = (tally[votedUid] || 0) + 1; });
    const winner = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
    return `<div class="game-reveal-box"><b>🏆 ${winner ? escapeHtml(playerName(winner[0])) : "—"}</b> хамгийн олон санал авлаа! (${winner ? winner[1] : 0} санал)</div>`;
  }
  if (g.engine === "quiz") {
    const correctCount = Object.keys(currentRoom.players).filter(uid => answers[uid] === rd.correct).length;
    return `<div class="game-reveal-box">✅ Зөв хариулт: <b>${escapeHtml((rd.opts || [])[rd.correct])}</b><br>${correctCount} хүн зөв хариулав</div>`;
  }
  return "";
}

async function submitRoundAnswer(value) {
  if (!currentRoom || currentRoom.phase !== "answering") return;
  try {
    const updates = { [`answers.${currentUser.uid}`]: value, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    const g = GAME_CATALOG[currentRoom.gameType];
    if (g && g.engine === "quiz") updates[`answerTimes.${currentUser.uid}`] = Date.now();
    await db.collection("gameRooms").doc(currentRoom.id).update(updates);
  } catch (e) { console.warn("submitRoundAnswer error:", e); }
}

async function hostRevealRound() {
  if (!isHost() || !currentRoom) return;
  const g = GAME_CATALOG[currentRoom.gameType];
  const rd = currentRoom.roundData || {};
  const answers = currentRoom.answers || {};
  const newPlayers = { ...currentRoom.players };

  if (g.engine === "guess") {
    const answererAns = answers[rd.answererUid];
    Object.keys(currentRoom.players).forEach(uid => {
      if (uid !== rd.answererUid && answers[uid] === answererAns) {
        newPlayers[uid] = { ...newPlayers[uid], score: (newPlayers[uid].score || 0) + 1 };
      }
    });
  } else if (g.engine === "match") {
    const uids = Object.keys(currentRoom.players);
    const vals = uids.map(uid => answers[uid]);
    if (vals.every(v => v === vals[0])) {
      uids.forEach(uid => { newPlayers[uid] = { ...newPlayers[uid], score: (newPlayers[uid].score || 0) + 1 }; });
    }
  } else if (g.engine === "vote") {
    Object.values(answers).forEach(votedUid => {
      if (newPlayers[votedUid]) newPlayers[votedUid] = { ...newPlayers[votedUid], score: (newPlayers[votedUid].score || 0) + 1 };
    });
  } else if (g.engine === "quiz") {
    const times = currentRoom.answerTimes || {};
    const correctUids = Object.keys(currentRoom.players)
      .filter(uid => answers[uid] === rd.correct)
      .sort((a, b) => (times[a] || Infinity) - (times[b] || Infinity));
    correctUids.forEach((uid, i) => {
      const bonus = i === 0 ? 15 : i === 1 ? 12 : 10; // хурдны шагнал: хамгийн түрүүнд зөв хариулсанд илүү оноо
      newPlayers[uid] = { ...newPlayers[uid], score: (newPlayers[uid].score || 0) + bonus };
    });
  }

  await db.collection("gameRooms").doc(currentRoom.id).update({
    players: newPlayers, phase: "reveal", answerTimes: {}, updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

async function hostNextRound() {
  if (!isHost() || !currentRoom) return;
  const nextRound = currentRoom.round + 1;
  if (nextRound >= currentRoom.totalRounds) {
    await db.collection("gameRooms").doc(currentRoom.id).update({ status: "finished", phase: "finished", updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    return;
  }
  await db.collection("gameRooms").doc(currentRoom.id).update({
    round: nextRound, roundData: buildRoundData(currentRoom.gameType, nextRound), answers: {}, phase: "answering",
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

// ---- Карт-суурьтай төрлүүд: truthdare / memories / lovequestions / grouptruthdare / questionbox (scoring-гүй) ----
function cardsBankFor(gameType, category) {
  if (gameType === "truthdare" || gameType === "grouptruthdare") return CARDS_TRUTHDARE;
  if (gameType === "memories") return CARDS_MEMORIES;
  if (gameType === "lovequestions") return CARDS_LOVEQ;
  if (gameType === "questionbox") return (QUESTIONBOX_CATEGORIES[category] || {}).items || [];
  return CARDS_LOVEQ;
}

function renderCardsEngine(g) {
  const rd = currentRoom.roundData || {};
  if (currentRoom.gameType === "questionbox" && !rd.category) return renderQuestionboxCategoryPicker();

  const bank = cardsBankFor(currentRoom.gameType, rd.category);
  const idx = rd.cardIndex || 0;
  const card = bank[idx % bank.length];
  const isTruthDare = typeof card === "object";
  gameRoot().innerHTML = `
    <a class="back-btn" onclick="leaveRoom()">← Room-оос гарах</a>
    <div class="game-round-card game-cards-card game-anim-in">
      <div class="game-eyebrow">${g.emoji} ${escapeHtml(g.label)}</div>
      ${isTruthDare ? `<div class="game-card-type">${card.type === "truth" ? "🗣 ҮНЭН" : "🔥 ДААЛГАВАР"}</div>` : ""}
      <h2>${escapeHtml(isTruthDare ? card.text : card)}</h2>
      <button class="btn btn-primary" type="button" style="width:100%;margin-top:20px;" onclick="advanceCard()">Дараагийн карт →</button>
      <button class="btn btn-ghost" type="button" style="width:100%;margin-top:10px;" onclick="finishCardsGame()">Дуусгах 🎉</button>
    </div>`;
}

function renderQuestionboxCategoryPicker() {
  gameRoot().innerHTML = `
    <a class="back-btn" onclick="leaveRoom()">← Room-оос гарах</a>
    <div class="game-round-card game-anim-in" style="text-align:center;">
      <div class="game-eyebrow">📦 Асуултын хайрцаг</div>
      <h2>Ямар төрлийн асуулт сонирхож байна вэ?</h2>
      <div class="game-opts">
        ${Object.entries(QUESTIONBOX_CATEGORIES).map(([key, cat]) => `
          <div class="game-opt" onclick="pickQuestionboxCategory('${key}')">${cat.emoji} ${escapeHtml(cat.label)}</div>`).join("")}
      </div>
    </div>`;
}

async function pickQuestionboxCategory(category) {
  if (!currentRoom) return;
  await db.collection("gameRooms").doc(currentRoom.id).update({
    roundData: { category, cardIndex: 0 }, updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

async function advanceCard() {
  if (!currentRoom) return;
  const rd = currentRoom.roundData || {};
  const idx = (rd.cardIndex || 0) + 1;
  await db.collection("gameRooms").doc(currentRoom.id).update({
    roundData: { ...rd, cardIndex: idx }, updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}
async function finishCardsGame() {
  if (!currentRoom) return;
  await db.collection("gameRooms").doc(currentRoom.id).update({ status: "finished", phase: "finished", updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
}

// ---- Болзооны Roulette (couple room, шууд синк хийсэн дугуй) ----
function renderWheelRoomEngine(g) {
  const rd = currentRoom.roundData || {};
  const hasResult = rd.resultIdx !== null && rd.resultIdx !== undefined;
  gameRoot().innerHTML = `
    <a class="back-btn" onclick="leaveRoom()">← Room-оос гарах</a>
    <div class="game-round-card game-anim-in" style="text-align:center;">
      <div class="game-eyebrow">${g.emoji} ${escapeHtml(g.label)}</div>
      <h2>Дугуйгаа эргүүлээд шууд даалгавраа аваарай!</h2>
      <div class="game-wheel-wrap">
        <div class="game-wheel-pointer">▼</div>
        <div class="game-wheel" id="roomWheel"></div>
      </div>
      ${hasResult
        ? `<div class="game-wheel-result-text game-anim-pop">${COUPLE_ROULETTE_DARES[rd.resultIdx].emoji} ${escapeHtml(COUPLE_ROULETTE_DARES[rd.resultIdx].label)}</div>
           <button class="btn btn-primary" type="button" style="width:100%;margin-top:12px;" onclick="spinRoomWheel()">🎡 Дахин эргүүлэх</button>`
        : `<button class="btn btn-primary" type="button" style="width:100%;margin-top:12px;" onclick="spinRoomWheel()">🎡 Эргүүл!</button>`}
      <button class="btn btn-ghost" type="button" style="width:100%;margin-top:10px;" onclick="finishCardsGame()">Дуусгах 🎉</button>
    </div>`;
  gameSetupWheel("roomWheel", COUPLE_ROULETTE_DARES);
  if (hasResult) {
    const n = COUPLE_ROULETTE_DARES.length, segAngle = 360 / n;
    const targetCenter = rd.resultIdx * segAngle + segAngle / 2;
    const el = document.getElementById("roomWheel");
    if (el) { el.style.transition = "none"; el.style.transform = `rotate(${360 - targetCenter}deg)`; }
  }
}

async function spinRoomWheel() {
  if (!currentRoom) return;
  const el = document.getElementById("roomWheel");
  if (el && el.dataset.spinning === "1") return;
  const n = COUPLE_ROULETTE_DARES.length;
  const idx = Math.floor(Math.random() * n);
  if (el) {
    el.dataset.spinning = "1";
    const segAngle = 360 / n;
    const targetCenter = idx * segAngle + segAngle / 2;
    const finalRotation = 5 * 360 + (360 - targetCenter);
    el.style.transition = "transform 3s cubic-bezier(.17,.67,.16,1)";
    el.style.transform = `rotate(${finalRotation}deg)`;
  }
  setTimeout(async () => {
    const spinCount = ((currentRoom.roundData || {}).spinCount || 0) + 1;
    await db.collection("gameRooms").doc(currentRoom.id).update({
      roundData: { resultIdx: idx, spinCount },
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  }, el ? 3100 : 0);
}

// ---- Who Am I? (нууц дүр, honor-system таах) ----
function renderWhoAmIEngine() {
  const players = currentRoom.players;
  const others = Object.entries(players).filter(([uid]) => uid !== currentUser.uid);
  const me = players[currentUser.uid] || {};
  gameRoot().innerHTML = `
    <a class="back-btn" onclick="leaveRoom()">← Room-оос гарах</a>
    <div class="game-round-card">
      <div class="game-eyebrow">🎭 Who Am I?</div>
      <h2>Бусдын духан дээрх нэрийг чи харна, гэхдээ өөрийнхөө нэрийг ХАРАХГҮЙ!</h2>
      <p class="game-round-sub">Тийм/Үгүй асуулт асууж, чи хэн болохоо тааварлаарай.</p>
      <div class="game-whoami-list">
        ${others.map(([uid, p]) => `<div class="game-whoami-row"><span>${escapeHtml(p.name)}</span><b>${escapeHtml(p.secretIdentity || "?")}</b></div>`).join("")}
      </div>
      ${me.guessed
        ? `<div class="game-reveal-box">✅ Чи тааллаа! Чиний хариулт: <b>${escapeHtml(me.secretIdentity)}</b></div>`
        : `<button class="btn btn-primary" type="button" style="width:100%;margin-top:16px;" onclick="markWhoAmIGuessed()">🙋 Би тааллаа!</button>`}
      ${isHost() ? `<button class="btn btn-ghost" type="button" style="width:100%;margin-top:10px;" onclick="finishCardsGame()">Тоглоом дуусгах 🎉</button>` : ""}
    </div>`;
}

async function markWhoAmIGuessed() {
  if (!currentRoom) return;
  await db.collection("gameRooms").doc(currentRoom.id).update({
    [`players.${currentUser.uid}.guessed`]: true,
    [`players.${currentUser.uid}.guessedAt`]: Date.now(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

// ---- Хамтын зурах самбар (canvas) — Хамт зур / Draw & Guess хоёул ашиглана ----
function waitingScreen(text) {
  return `<a class="back-btn" onclick="leaveRoom()">← Room-оос гарах</a>
  <div class="game-round-card game-anim-in" style="text-align:center;">
    <div class="game-spinner"></div>
    <p class="game-round-sub" style="margin-top:14px;">${escapeHtml(text)}</p>
  </div>`;
}

function drawToolbarHtml(canvasId) {
  const colors = ["#1B263B", "#E8536E", "#0077B6", "#2E9E5B", "#E3A857"];
  return `
    <div class="game-draw-toolbar">
      ${colors.map(c => `<span class="game-draw-color" style="background:${c}" onclick="gameSetCanvasColor('${canvasId}','${c}')"></span>`).join("")}
      <button type="button" class="btn btn-ghost" style="padding:6px 12px;font-size:12px;" onclick="gameClearCanvas('${canvasId}')">🧹 Цэвэрлэх</button>
    </div>`;
}

function gameSetupCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.lineWidth = 4; ctx.strokeStyle = "#1B263B";
  let drawing = false, last = null;
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const pt = e.touches ? e.touches[0] : e;
    return { x: (pt.clientX - rect.left) * (canvas.width / rect.width), y: (pt.clientY - rect.top) * (canvas.height / rect.height) };
  }
  function start(e) { drawing = true; last = getPos(e); e.preventDefault(); }
  function move(e) {
    if (!drawing) return;
    const p = getPos(e);
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last = p; e.preventDefault();
  }
  function end() { drawing = false; }
  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", move);
  canvas.addEventListener("mouseup", end);
  canvas.addEventListener("mouseleave", end);
  canvas.addEventListener("touchstart", start, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  canvas.addEventListener("touchend", end);
}
function gameSetCanvasColor(canvasId, color) {
  const canvas = document.getElementById(canvasId);
  if (canvas) canvas.getContext("2d").strokeStyle = color;
}
function gameClearCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
function gameCanvasToBlob(canvasId) {
  return new Promise(resolve => {
    const canvas = document.getElementById(canvasId);
    canvas.toBlob(blob => resolve(blob), "image/jpeg", 0.7);
  });
}

// ---- Хамт зур (couple drawrate: хоёул зурна, дараа нь бие биенээ үнэлнэ) ----
function renderDrawRateEngine(g) {
  const rd = currentRoom.roundData || {};
  const myUid = currentUser.uid;
  const uids = Object.keys(currentRoom.players);
  const partnerUid = uids.find(u => u !== myUid);
  const drawings = rd.drawings || {};
  const ratings = rd.ratings || {};

  if (!drawings[myUid]) {
    gameRoot().innerHTML = `
      <a class="back-btn" onclick="leaveRoom()">← Room-оос гарах</a>
      <div class="game-round-card game-anim-in" style="text-align:center;">
        <div class="game-eyebrow">${g.emoji} Хамт зур</div>
        <h2>Сэдэв: ${escapeHtml(rd.topic)}</h2>
        <canvas id="drawCanvas" width="300" height="240" class="game-draw-canvas"></canvas>
        ${drawToolbarHtml("drawCanvas")}
        <button class="btn btn-primary" type="button" style="width:100%;margin-top:14px;" id="drawSubmitBtn" onclick="submitDrawing()">✅ Илгээх</button>
      </div>`;
    gameSetupCanvas("drawCanvas");
    return;
  }
  if (Object.keys(drawings).length < uids.length) { gameRoot().innerHTML = waitingScreen("Хосынхоо зургийг хүлээж байна... ⏳"); return; }

  if (!ratings[partnerUid]) {
    gameRoot().innerHTML = `
      <a class="back-btn" onclick="leaveRoom()">← Room-оос гарах</a>
      <div class="game-round-card game-anim-in" style="text-align:center;">
        <div class="game-eyebrow">${escapeHtml(playerName(partnerUid))}-ийн зураг</div>
        <h2>Сэдэв: ${escapeHtml(rd.topic)}</h2>
        <img src="${escapeHtml(drawings[partnerUid])}" class="game-draw-preview" alt="зураг">
        <p class="game-round-sub">Оноо өг (1-5) ⭐</p>
        <div class="game-star-row">${[1, 2, 3, 4, 5].map(n => `<span class="game-star" onclick="rateDrawing(${n})">⭐</span>`).join("")}</div>
      </div>`;
    return;
  }
  if (Object.keys(ratings).length < uids.length) { gameRoot().innerHTML = waitingScreen("Хосын үнэлгээг хүлээж байна... ⏳"); return; }

  gameRoot().innerHTML = `
    <a class="back-btn" onclick="leaveRoom()">← Room-оос гарах</a>
    <div class="game-round-card game-anim-in" style="text-align:center;">
      <div class="game-eyebrow">🎨 Сэдэв: ${escapeHtml(rd.topic)}</div>
      <div class="game-draw-reveal-grid">
        ${uids.map(uid => `
          <div>
            <img src="${escapeHtml(drawings[uid])}" class="game-draw-preview" alt="зураг">
            <div style="margin-top:6px;font-weight:600;">${escapeHtml(playerName(uid))}</div>
            <div>${"⭐".repeat(ratings[uid] || 0)}</div>
          </div>`).join("")}
      </div>
      <button class="btn btn-ghost" type="button" style="width:100%;margin-top:16px;" onclick="finishCardsGame()">Дуусгах 🎉</button>
    </div>`;
  if (isHost()) applyDrawRateScores();
}

async function submitDrawing() {
  const btn = document.getElementById("drawSubmitBtn");
  if (btn) { btn.disabled = true; btn.textContent = "Илгээж байна..."; }
  try {
    const blob = await gameCanvasToBlob("drawCanvas");
    const path = `gameRooms/${currentRoom.id}/drawings/${currentUser.uid}_${Date.now()}.jpg`;
    const url = await uploadBlobToStorage(path, blob);
    await db.collection("gameRooms").doc(currentRoom.id).update({
      [`roundData.drawings.${currentUser.uid}`]: url, updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    showToast("⚠️ Зураг илгээхэд алдаа гарлаа: " + e.message);
    if (btn) { btn.disabled = false; btn.textContent = "✅ Илгээх"; }
  }
}

async function rateDrawing(stars) {
  if (!currentRoom) return;
  const uids = Object.keys(currentRoom.players);
  const partnerUid = uids.find(u => u !== currentUser.uid);
  await db.collection("gameRooms").doc(currentRoom.id).update({
    [`roundData.ratings.${partnerUid}`]: stars, updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

async function applyDrawRateScores() {
  const rd = currentRoom.roundData || {};
  if (rd.scored) return;
  const ratings = rd.ratings || {};
  const newPlayers = { ...currentRoom.players };
  Object.entries(ratings).forEach(([uid, stars]) => {
    if (newPlayers[uid]) newPlayers[uid] = { ...newPlayers[uid], score: (newPlayers[uid].score || 0) + stars };
  });
  await db.collection("gameRooms").doc(currentRoom.id).update({
    players: newPlayers, "roundData.scored": true, updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

// ---- Draw & Guess (group pictionary: нэг хүн зурна, бусад нь таана) ----
function buildPictionaryRound(roundIdx) {
  const uids = Object.keys(currentRoom.players);
  const drawerUid = uids[roundIdx % uids.length];
  const word = PICTIONARY_WORDS[Math.floor(Math.random() * PICTIONARY_WORDS.length)];
  return { drawerUid, word, drawingURL: null, correctGuessers: [] };
}

function renderPictionaryEngine(g) {
  const rd = currentRoom.roundData || {};
  const amDrawer = rd.drawerUid === currentUser.uid;
  const scoreRows = Object.entries(currentRoom.players).sort((a, b) => (b[1].score || 0) - (a[1].score || 0))
    .map(([uid, p]) => `<div class="game-score-row"><span>${escapeHtml(p.name)}</span><b>${p.score || 0}</b></div>`).join("");

  if (!rd.drawingURL) {
    if (amDrawer) {
      gameRoot().innerHTML = `
        <a class="back-btn" onclick="leaveRoom()">← Room-оос гарах</a>
        <div class="game-round-progress">Үг ${currentRoom.round + 1} / ${currentRoom.totalRounds}</div>
        <div class="game-round-card game-anim-in" style="text-align:center;">
          <div class="game-eyebrow">🖌 Чи зурагч!</div>
          <h2>Чиний зурах үг: <b>${escapeHtml(rd.word)}</b></h2>
          <canvas id="drawCanvas" width="300" height="240" class="game-draw-canvas"></canvas>
          ${drawToolbarHtml("drawCanvas")}
          <button class="btn btn-primary" type="button" style="width:100%;margin-top:14px;" id="drawSubmitBtn" onclick="submitPictionaryDrawing()">✅ Дуусгаад харуулах</button>
        </div>`;
      gameSetupCanvas("drawCanvas");
    } else {
      gameRoot().innerHTML = waitingScreen(`${escapeHtml(playerName(rd.drawerUid))} зурж байна... 🎨`);
    }
    return;
  }

  const myGuessedCorrectly = (rd.correctGuessers || []).includes(currentUser.uid);
  const guessListHtml = (rd.correctGuessers || []).map((uid, i) => `<div class="game-reveal-row">${i + 1}. ${escapeHtml(playerName(uid))} ✅</div>`).join("");

  gameRoot().innerHTML = `
    <a class="back-btn" onclick="leaveRoom()">← Room-оос гарах</a>
    <div class="game-round-progress">Үг ${currentRoom.round + 1} / ${currentRoom.totalRounds}</div>
    <div class="game-round-card game-anim-in" style="text-align:center;">
      <div class="game-eyebrow">🖌 ${escapeHtml(playerName(rd.drawerUid))} зурж байна</div>
      <img src="${escapeHtml(rd.drawingURL)}" class="game-draw-preview" alt="зураг">
      ${amDrawer
        ? `<p class="game-round-sub">Нууц үг: <b>${escapeHtml(rd.word)}</b></p>`
        : (myGuessedCorrectly
          ? `<div class="game-reveal-box">✅ Чи зөв тааллаа!</div>`
          : `<input type="text" id="pictGuessInput" placeholder="Юу вэ?" style="width:100%;padding:12px;border:2px solid var(--border);border-radius:10px;margin:10px 0;">
             <button class="btn btn-primary" type="button" style="width:100%;" onclick="submitPictionaryGuess()">Таах</button>
             <div id="pictGuessStatus" style="margin-top:8px;font-weight:600;"></div>`)}
      ${guessListHtml ? `<div class="game-reveal-box" style="margin-top:14px;">${guessListHtml}</div>` : ""}
    </div>
    ${isHost() ? `<button class="btn btn-primary" type="button" style="width:100%;margin-top:16px;" onclick="hostNextPictionaryRound()">${currentRoom.round + 1 >= currentRoom.totalRounds ? "Дүгнэлт харах →" : "Дараагийн үг →"}</button>` : ""}
    <h4 style="margin:24px 0 8px;">🏆 Оноо</h4>
    <div class="game-score-list">${scoreRows}</div>`;
}

async function submitPictionaryDrawing() {
  const btn = document.getElementById("drawSubmitBtn");
  if (btn) { btn.disabled = true; btn.textContent = "Илгээж байна..."; }
  try {
    const blob = await gameCanvasToBlob("drawCanvas");
    const path = `gameRooms/${currentRoom.id}/drawings/${currentUser.uid}_${Date.now()}.jpg`;
    const url = await uploadBlobToStorage(path, blob);
    await db.collection("gameRooms").doc(currentRoom.id).update({
      "roundData.drawingURL": url, updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    showToast("⚠️ Алдаа: " + e.message);
    if (btn) { btn.disabled = false; btn.textContent = "✅ Дуусгаад харуулах"; }
  }
}

async function submitPictionaryGuess() {
  const input = document.getElementById("pictGuessInput");
  const val = (input?.value || "").trim().toLowerCase();
  const statusEl = document.getElementById("pictGuessStatus");
  if (!currentRoom || !val) return;
  const roomRef = db.collection("gameRooms").doc(currentRoom.id);
  try {
    const wasCorrect = await db.runTransaction(async (tx) => {
      const snap = await tx.get(roomRef);
      const room = snap.data();
      const rd = room.roundData || {};
      if (val !== (rd.word || "").toLowerCase()) return false;
      const correctGuessers = [...(rd.correctGuessers || [])];
      if (correctGuessers.includes(currentUser.uid)) return true;
      correctGuessers.push(currentUser.uid);
      const points = correctGuessers.length === 1 ? 15 : correctGuessers.length === 2 ? 10 : 5;
      const newPlayers = { ...room.players };
      newPlayers[currentUser.uid] = { ...newPlayers[currentUser.uid], score: (newPlayers[currentUser.uid].score || 0) + points };
      if (correctGuessers.length === 1 && newPlayers[rd.drawerUid]) {
        newPlayers[rd.drawerUid] = { ...newPlayers[rd.drawerUid], score: (newPlayers[rd.drawerUid].score || 0) + 5 };
      }
      tx.update(roomRef, { "roundData.correctGuessers": correctGuessers, players: newPlayers, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      return true;
    });
    if (!wasCorrect && statusEl) { statusEl.textContent = "❌ Буруу байна, дахин оролдоорой"; statusEl.style.color = "var(--accent)"; }
  } catch (e) { console.warn("submitPictionaryGuess error:", e); }
}

async function hostNextPictionaryRound() {
  if (!isHost() || !currentRoom) return;
  const nextRound = currentRoom.round + 1;
  if (nextRound >= currentRoom.totalRounds) {
    await db.collection("gameRooms").doc(currentRoom.id).update({ status: "finished", phase: "finished", updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    return;
  }
  await db.collection("gameRooms").doc(currentRoom.id).update({
    round: nextRound, roundData: buildPictionaryRound(nextRound), updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

// ================= ДҮГНЭЛТ / ЯЛАГЧ =================
const GAME_NON_SCORED_ENGINES = ["cards", "wheel"];

function renderResults() {
  const g = GAME_CATALOG[currentRoom.gameType] || {};
  const players = Object.entries(currentRoom.players || {});

  if (GAME_NON_SCORED_ENGINES.includes(g.engine)) {
    gameRoot().innerHTML = `
      <a class="back-btn" onclick="leaveRoom()">← Room-оос гарах</a>
      <div class="game-round-card game-anim-in" style="text-align:center;">
        <div style="font-size:52px;margin-bottom:6px;">💕</div>
        <h2>Сайхан цаг өнгөрөөлөө!</h2>
        <p class="game-round-sub">Бие биенээ илүү таньж, ярилцаж чадсанд баярлалаа.</p>
        ${isHost() ? `<button class="btn btn-primary" type="button" style="width:100%;margin-top:20px;" onclick="playAgain()">🔄 Өөр тоглоом сонгох</button>` : ""}
        <button class="btn btn-ghost" type="button" style="width:100%;margin-top:10px;" onclick="leaveRoom()">Room-оос гарах</button>
      </div>`;
    return;
  }

  let ranked;
  if (g.engine === "whoami") {
    ranked = players.slice().sort((a, b) => {
      const at = a[1].guessedAt || Infinity, bt = b[1].guessedAt || Infinity;
      return at - bt;
    });
  } else {
    ranked = players.slice().sort((a, b) => (b[1].score || 0) - (a[1].score || 0));
  }
  const medals = ["🥇", "🥈", "🥉"];
  gameRoot().innerHTML = `
    <a class="back-btn" onclick="leaveRoom()">← Room-оос гарах</a>
    <div class="game-round-card game-anim-in" style="text-align:center;">
      <div class="game-trophy-anim">🏆</div>
      <h2>Тоглоом дууслаа!</h2>
      <div class="game-leaderboard">
        ${ranked.map(([uid, p], i) => `
          <div class="game-leaderboard-row ${i === 0 ? "is-winner" : ""}" style="animation-delay:${i * 0.08}s">
            <span>${medals[i] || (i + 1) + "."}</span>
            <span>${escapeHtml(p.name)}</span>
            <b>${g.engine === "whoami" ? (p.guessedAt ? "✅ Тааллаа" : "❌ Таагаагүй") : (p.score || 0) + " оноо"}</b>
          </div>`).join("")}
      </div>
      ${isHost() ? `<button class="btn btn-primary" type="button" style="width:100%;margin-top:20px;" onclick="playAgain()">🔄 Өөр тоглоом сонгох</button>` : ""}
      <button class="btn btn-ghost" type="button" style="width:100%;margin-top:10px;" onclick="leaveRoom()">Room-оос гарах</button>
    </div>`;
}

async function playAgain() {
  if (!isHost() || !currentRoom) return;
  const resetPlayers = {};
  Object.entries(currentRoom.players).forEach(([uid, p]) => { resetPlayers[uid] = { ...p, score: 0, guessed: false, guessedAt: null, secretIdentity: null }; });
  await db.collection("gameRooms").doc(currentRoom.id).update({
    status: "lobby", phase: "lobby", gameType: null, engine: null, round: 0, totalRounds: 0,
    roundData: null, answers: {}, players: resetPlayers, updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

// ================= ГАНЦААРЧИЛСАН ТОГЛООМУУД (room шаардахгүй) =================
function renderSoloHome() {
  gameRoot().innerHTML = `
    <a class="back-btn" onclick="renderGamesHome()">← Буцах</a>
    <h2 style="margin:10px 0 4px;">👤 Ганцаараа тоглох</h2>
    <p style="color:var(--text-light);margin-bottom:20px;">Room хэрэггүй, шууд эхэлж болно.</p>
    <div class="game-catalog-grid">
      ${Object.entries(SOLO_GAMES).map(([id, g]) => `
        <div class="game-catalog-card" onclick="startSoloGame('${id}')">
          <div class="game-catalog-emoji">${g.emoji}</div>
          <div class="game-catalog-label">${escapeHtml(g.label)}</div>
        </div>`).join("")}
    </div>`;
}

function startSoloGame(id) {
  if (id === "memory") return renderSoloMemory();
  if (id === "lovequiz") return renderSoloQuiz();
  if (id === "personality") return renderSoloPersonality();
  if (id === "roulette") return renderSoloRoulette();
  if (id === "guess") return renderSoloGuess();
  if (id === "challenge") return renderSoloChallenge();
  if (id === "question") return renderSoloRandomQuestion();
  if (id === "letter") return renderSoloLetter();
  if (id === "reaction") return renderSoloReaction();
  if (id === "puzzle2048") return renderSolo2048();
  if (id === "flagguess") return renderSoloFlagGuess();
}

// ---- Memory ----
function renderSoloMemory() {
  soloState = { flipped: [], matched: 0 };
  const emojiSet = ["❤️", "🌸", "✨", "🎁", "🎵", "😍", "🔥", "💎"];
  const deck = shuffleArr([...emojiSet, ...emojiSet]);
  gameRoot().innerHTML = `
    <a class="back-btn" onclick="renderSoloHome()">← Буцах</a>
    <h2 style="margin:10px 0 16px;">🧩 Memory</h2>
    <div class="game-solo-mem-grid" id="soloMemGrid">
      ${deck.map((e, i) => `
        <div class="game-solo-mem-card" id="soloMemCard${i}" data-emoji="${e}" onclick="flipSoloMemCard(${i})">
          <div class="game-solo-mem-inner"><div class="game-solo-mem-back">💌</div><div class="game-solo-mem-front">${e}</div></div>
        </div>`).join("")}
    </div>
    <p id="soloMemStatus" style="text-align:center;color:var(--text-light);margin-top:14px;">Хосуудыг олоорой!</p>`;
}
function flipSoloMemCard(idx) {
  const card = document.getElementById("soloMemCard" + idx);
  if (!card || card.classList.contains("flipped") || card.classList.contains("matched") || soloState.lock) return;
  card.classList.add("flipped");
  soloState.flipped.push(idx);
  if (soloState.flipped.length < 2) return;
  soloState.lock = true;
  const [i1, i2] = soloState.flipped;
  const c1 = document.getElementById("soloMemCard" + i1), c2 = document.getElementById("soloMemCard" + i2);
  if (c1.dataset.emoji === c2.dataset.emoji) {
    c1.classList.add("matched"); c2.classList.add("matched");
    soloState.matched++; soloState.flipped = []; soloState.lock = false;
    if (soloState.matched === 8) document.getElementById("soloMemStatus").textContent = "🎉 Бүгдийг олллоо!";
  } else {
    setTimeout(() => {
      c1.classList.remove("flipped"); c2.classList.remove("flipped");
      soloState.flipped = []; soloState.lock = false;
    }, 800);
  }
}

// ---- Love Quiz ----
function renderSoloQuiz() {
  soloState = { idx: 0, score: 0 };
  renderSoloQuizQuestion();
}
function renderSoloQuizQuestion() {
  const q = Q_QUIZBATTLE[soloState.idx];
  gameRoot().innerHTML = `
    <a class="back-btn" onclick="renderSoloHome()">← Буцах</a>
    <div class="game-round-progress">Асуулт ${soloState.idx + 1} / ${Q_QUIZBATTLE.length} · Оноо: ${soloState.score}</div>
    <div class="game-round-card">
      <h2>${escapeHtml(q.q)}</h2>
      <div class="game-opts" id="soloQuizOpts">
        ${q.opts.map((o, i) => `<div class="game-opt" onclick="answerSoloQuiz(${i})">${escapeHtml(o)}</div>`).join("")}
      </div>
    </div>`;
}
function answerSoloQuiz(i) {
  const q = Q_QUIZBATTLE[soloState.idx];
  const opts = document.querySelectorAll("#soloQuizOpts .game-opt");
  opts.forEach((el, idx) => {
    el.style.pointerEvents = "none";
    if (idx === q.correct) el.classList.add("correct");
    else if (idx === i) el.classList.add("wrong");
  });
  if (i === q.correct) soloState.score++;
  setTimeout(() => {
    soloState.idx++;
    if (soloState.idx >= Q_QUIZBATTLE.length) {
      gameRoot().innerHTML = `
        <a class="back-btn" onclick="renderSoloHome()">← Буцах</a>
        <div class="game-round-card" style="text-align:center;">
          <div style="font-size:52px;">🏆</div>
          <h2>Дуусгалаа!</h2>
          <p class="game-round-sub">Таны оноо: <b>${soloState.score} / ${Q_QUIZBATTLE.length}</b></p>
          <button class="btn btn-primary" type="button" style="width:100%;margin-top:14px;" onclick="renderSoloQuiz()">🔄 Дахин тоглох</button>
        </div>`;
    } else renderSoloQuizQuestion();
  }, 1200);
}

// ---- Love Personality Test ----
function renderSoloPersonality() {
  soloState = { idx: 0, traits: { romantic: 0, adventurous: 0, caring: 0, playful: 0 } };
  renderSoloPersonalityQuestion();
}
function renderSoloPersonalityQuestion() {
  const q = PERSONALITY_QUESTIONS[soloState.idx];
  gameRoot().innerHTML = `
    <a class="back-btn" onclick="renderSoloHome()">← Буцах</a>
    <div class="game-round-progress">Асуулт ${soloState.idx + 1} / ${PERSONALITY_QUESTIONS.length}</div>
    <div class="game-round-card">
      <h2>${escapeHtml(q.q)}</h2>
      <div class="game-opts">
        ${q.opts.map((o, i) => `<div class="game-opt" onclick="answerSoloPersonality('${o.trait}')">${escapeHtml(o.t)}</div>`).join("")}
      </div>
    </div>`;
}
function answerSoloPersonality(trait) {
  soloState.traits[trait]++;
  soloState.idx++;
  if (soloState.idx >= PERSONALITY_QUESTIONS.length) {
    const top = Object.entries(soloState.traits).sort((a, b) => b[1] - a[1])[0][0];
    const result = PERSONALITY_RESULTS[top];
    gameRoot().innerHTML = `
      <a class="back-btn" onclick="renderSoloHome()">← Буцах</a>
      <div class="game-round-card" style="text-align:center;">
        <h2>${result.title}</h2>
        <p class="game-round-sub">${escapeHtml(result.desc)}</p>
        <button class="btn btn-primary" type="button" style="width:100%;margin-top:14px;" onclick="renderSoloPersonality()">🔄 Дахин тоглох</button>
      </div>`;
  } else renderSoloPersonalityQuestion();
}

// ---- Болзооны санаа Roulette (өөрийн бие даасан дугуй, invite.js-ээс хамааралгүй) ----
function renderSoloRoulette() {
  gameRoot().innerHTML = `
    <a class="back-btn" onclick="renderSoloHome()">← Буцах</a>
    <h2 style="margin:10px 0 16px;">🎯 Болзооны санаа Roulette</h2>
    <div class="game-round-card" style="text-align:center;">
      <div class="game-wheel-wrap">
        <div class="game-wheel-pointer">▼</div>
        <div class="game-wheel" id="soloWheel"></div>
      </div>
      <button class="btn btn-primary" type="button" onclick="gameSpinWheel()">🎡 Эргүүл!</button>
      <div id="soloWheelResult"></div>
    </div>`;
  gameSetupWheel("soloWheel", UB_IDEA_WHEEL);
}
function gameSetupWheel(wheelId, segments) {
  const el = document.getElementById(wheelId);
  if (!el) return;
  const n = segments.length;
  const colors = ["#ffd3e0", "#ffe8cc", "#d3f8e2", "#d3e4ff", "#f3d3ff", "#fff3d3"];
  const gradient = segments.map((s, i) => `${colors[i % colors.length]} ${i * (360 / n)}deg ${(i + 1) * (360 / n)}deg`).join(", ");
  el.style.background = `conic-gradient(${gradient})`;
  el.innerHTML = segments.map((s, i) => {
    const angle = (i + 0.5) * (360 / n);
    return `<span class="game-wheel-label" style="transform:rotate(${angle}deg) translate(0,-72px) rotate(${-angle}deg);">${s.emoji}</span>`;
  }).join("");
  el.style.transform = "rotate(0deg)";
  el.dataset.spinning = "0";
}
function gameSpinWheel() {
  const el = document.getElementById("soloWheel");
  if (!el || el.dataset.spinning === "1") return;
  el.dataset.spinning = "1";
  const segments = UB_IDEA_WHEEL;
  const n = segments.length;
  const idx = Math.floor(Math.random() * n);
  const segAngle = 360 / n;
  const targetCenter = idx * segAngle + segAngle / 2;
  const finalRotation = 5 * 360 + (360 - targetCenter);
  el.style.transition = "transform 3s cubic-bezier(.17,.67,.16,1)";
  el.style.transform = `rotate(${finalRotation}deg)`;
  setTimeout(() => {
    const resEl = document.getElementById("soloWheelResult");
    if (resEl) resEl.innerHTML = `<div class="game-wheel-result-text">${segments[idx].emoji} ${escapeHtml(segments[idx].label)}</div>`;
    el.dataset.spinning = "0";
  }, 3100);
}

// ---- Таах тоглоом ----
function renderSoloGuess() {
  soloState = { round: shuffleArr(GUESS_ROUNDS)[0], clueIdx: 1 };
  renderSoloGuessState();
}
function renderSoloGuessState() {
  const r = soloState.round;
  gameRoot().innerHTML = `
    <a class="back-btn" onclick="renderSoloHome()">← Буцах</a>
    <h2 style="margin:10px 0 16px;">❓ Таах тоглоом</h2>
    <div class="game-round-card" style="text-align:center;">
      <p class="game-round-sub">${escapeHtml(r.hint)}</p>
      <div style="font-size:44px;margin:16px 0;">${r.clues.slice(0, soloState.clueIdx).join(" ")}</div>
      <input type="text" id="soloGuessInput" placeholder="Хариултаа бичнэ үү..." style="width:100%;padding:12px;border:2px solid var(--border);border-radius:10px;font-size:15px;margin-bottom:12px;">
      <button class="btn btn-primary" type="button" style="width:100%;" onclick="checkSoloGuess()">Шалгах</button>
      ${soloState.clueIdx < r.clues.length ? `<button class="btn btn-ghost" type="button" style="width:100%;margin-top:10px;" onclick="revealSoloClue()">Дараагийн дохио (+1 clue)</button>` : ""}
      <div id="soloGuessStatus" style="margin-top:12px;font-weight:600;"></div>
    </div>`;
}
function revealSoloClue() { soloState.clueIdx = Math.min(soloState.clueIdx + 1, soloState.round.clues.length); renderSoloGuessState(); }
function checkSoloGuess() {
  const val = (document.getElementById("soloGuessInput").value || "").trim().toLowerCase();
  const statusEl = document.getElementById("soloGuessStatus");
  if (val === soloState.round.answer.toLowerCase()) {
    statusEl.innerHTML = `✅ Зөв! Хариулт: <b>${escapeHtml(soloState.round.answer)}</b>`;
    statusEl.style.color = "var(--primary)";
  } else {
    statusEl.textContent = "❌ Буруу байна, дахин оролдоорой";
    statusEl.style.color = "var(--accent)";
  }
}

// ---- Random Challenge ----
function renderSoloChallenge() {
  const challenge = RANDOM_CHALLENGES[Math.floor(Math.random() * RANDOM_CHALLENGES.length)];
  gameRoot().innerHTML = `
    <a class="back-btn" onclick="renderSoloHome()">← Буцах</a>
    <h2 style="margin:10px 0 16px;">🎲 Random Challenge</h2>
    <div class="game-round-card" style="text-align:center;">
      <div style="font-size:44px;">🎲</div>
      <h2>${escapeHtml(challenge)}</h2>
      <button class="btn btn-primary" type="button" style="width:100%;margin-top:16px;" onclick="renderSoloChallenge()">🔄 Дараагийн challenge</button>
    </div>`;
}

// ---- Random Question (өөртөө эргэцүүлэх, тоглоом хамтрагч хэрэггүй) ----
function renderSoloRandomQuestion() {
  const q = SOLO_RANDOM_QUESTIONS[Math.floor(Math.random() * SOLO_RANDOM_QUESTIONS.length)];
  gameRoot().innerHTML = `
    <a class="back-btn" onclick="renderSoloHome()">← Буцах</a>
    <h2 style="margin:10px 0 16px;">🔮 Random Question</h2>
    <div class="game-round-card game-anim-in" style="text-align:center;">
      <div style="font-size:44px;">🔮</div>
      <h2>${escapeHtml(q)}</h2>
      <button class="btn btn-primary" type="button" style="width:100%;margin-top:16px;" onclick="renderSoloRandomQuestion()">🔄 Дараагийн асуулт</button>
    </div>`;
}

// ---- Ирээдүйн хосдоо захиа (хувийн, Firestore-д хадгалагдана) ----
function renderSoloLetter() {
  gameRoot().innerHTML = `
    <a class="back-btn" onclick="renderSoloHome()">← Буцах</a>
    <h2 style="margin:10px 0 4px;">💌 Ирээдүйн хосдоо захиа</h2>
    <p style="color:var(--text-light);margin-bottom:16px;">Ирээдүйн хосдоо (эсвэл өөртөө) юу хэлмээр байгаагаа бичээрэй. Хадгалснаар дараа дахин уншиж болно.</p>
    <div class="game-round-card game-anim-in">
      <textarea id="letterInput" rows="8" style="width:100%;padding:12px;border:2px solid var(--border);border-radius:10px;font-family:inherit;font-size:14px;resize:vertical;" placeholder="Хайрт минь..."></textarea>
      <div id="letterStatus" style="min-height:18px;font-size:13px;margin-top:8px;"></div>
      <button class="btn btn-primary" type="button" style="width:100%;margin-top:10px;" onclick="saveSoloLetter()">💾 Хадгалах</button>
      <button class="btn btn-ghost" type="button" style="width:100%;margin-top:10px;" onclick="renderMyLetters()">📖 Миний хадгалсан захидлууд</button>
    </div>`;
}

async function saveSoloLetter() {
  const input = document.getElementById("letterInput");
  const statusEl = document.getElementById("letterStatus");
  const text = (input?.value || "").trim();
  if (!text) { if (statusEl) statusEl.textContent = "⚠️ Юм бичнэ үү"; return; }
  if (typeof currentUser === "undefined" || !currentUser) {
    if (typeof openAuth === "function") openAuth("login");
    return;
  }
  if (statusEl) statusEl.textContent = "Хадгалж байна...";
  try {
    await db.collection("futureLetters").add({
      ownerUid: currentUser.uid, text, createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    if (statusEl) statusEl.textContent = "✅ Хадгаллаа!";
    showToast("💌 Захиа хадгалагдлаа");
    input.value = "";
  } catch (e) {
    if (statusEl) statusEl.textContent = "⚠️ Алдаа: " + e.message;
  }
}

async function renderMyLetters() {
  if (typeof currentUser === "undefined" || !currentUser) { if (typeof openAuth === "function") openAuth("login"); return; }
  gameRoot().innerHTML = `
    <a class="back-btn" onclick="renderSoloLetter()">← Буцах</a>
    <h2 style="margin:10px 0 16px;">📖 Миний захидлууд</h2>
    <div id="lettersList" style="color:var(--text-light);">Ачааллаж байна...</div>`;
  try {
    const snap = await db.collection("futureLetters").where("ownerUid", "==", currentUser.uid).orderBy("createdAt", "desc").limit(30).get();
    const list = document.getElementById("lettersList");
    if (!list) return;
    if (snap.empty) { list.innerHTML = `<div class="game-round-card" style="text-align:center;color:var(--text-light);">Захидал хараахан алга байна.</div>`; return; }
    list.innerHTML = snap.docs.map(doc => {
      const d = doc.data();
      const when = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().toLocaleDateString("mn-MN") : "";
      return `
      <div class="game-round-card game-anim-in" style="margin-bottom:12px;text-align:left;">
        <div style="font-size:12px;color:var(--text-light);margin-bottom:6px;">${escapeHtml(when)}</div>
        <p style="white-space:pre-line;">${escapeHtml(d.text)}</p>
        <button class="btn btn-ghost" type="button" style="margin-top:8px;font-size:12px;padding:6px 12px;" onclick="deleteSoloLetter('${doc.id}')">🗑 Устгах</button>
      </div>`;
    }).join("");
  } catch (e) {
    const list = document.getElementById("lettersList");
    if (list) list.innerHTML = `⚠️ Ачаалахад алдаа гарлаа: ${escapeHtml(e.message)}`;
  }
}

async function deleteSoloLetter(id) {
  try {
    await db.collection("futureLetters").doc(id).delete();
    renderMyLetters();
  } catch (e) { showToast("⚠️ Устгахад алдаа гарлаа"); }
}

// ---- Улсын туг таах (bored.com-ы Trivia Quiz-с санаа авсан) ----
function renderSoloFlagGuess() {
  soloState = { idx: 0, score: 0, order: shuffleArr(FLAG_BANK).slice(0, 8) };
  renderSoloFlagGuessQuestion();
}
function renderSoloFlagGuessQuestion() {
  const { idx, order } = soloState;
  const correct = order[idx];
  const distractors = shuffleArr(FLAG_BANK.filter(f => f.name !== correct.name)).slice(0, 3);
  const opts = shuffleArr([correct, ...distractors]);
  gameRoot().innerHTML = `
    <a class="back-btn" onclick="renderSoloHome()">← Буцах</a>
    <div class="game-round-progress">Асуулт ${idx + 1} / ${order.length} · Оноо: ${soloState.score}</div>
    <div class="game-round-card game-anim-in" style="text-align:center;">
      <img class="game-flag-img game-anim-pop" src="${flagImgUrl(correct.code)}" alt="flag" onerror="this.style.display='none'">
      <h2>Энэ аль улсын туг вэ?</h2>
      <div class="game-opts" id="soloFlagOpts">
        ${opts.map(o => `<div class="game-opt" onclick="answerSoloFlag('${escapeHtml(o.name).replace(/'/g,"\\'")}')">${escapeHtml(o.name)}</div>`).join("")}
      </div>
    </div>`;
}
function answerSoloFlag(name) {
  const { idx, order } = soloState;
  const correct = order[idx];
  const isCorrect = name === correct.name;
  document.querySelectorAll("#soloFlagOpts .game-opt").forEach(el => {
    el.style.pointerEvents = "none";
    if (el.textContent === correct.name) el.classList.add("correct", "game-anim-pop");
    else if (el.textContent === name) el.classList.add("wrong", "game-anim-shake");
  });
  if (isCorrect) soloState.score++;
  setTimeout(() => {
    soloState.idx++;
    if (soloState.idx >= order.length) {
      gameRoot().innerHTML = `
        <a class="back-btn" onclick="renderSoloHome()">← Буцах</a>
        <div class="game-round-card game-anim-pop" style="text-align:center;">
          <div class="game-trophy-anim">🌍</div>
          <h2>Дуусгалаа!</h2>
          <p class="game-round-sub">Таны оноо: <b>${soloState.score} / ${order.length}</b></p>
          <button class="btn btn-primary" type="button" style="width:100%;margin-top:14px;" onclick="renderSoloFlagGuess()">🔄 Дахин тоглох</button>
        </div>`;
    } else renderSoloFlagGuessQuestion();
  }, 1000);
}

// ---- Хурдны шалгалт / Reaction Time (bored.com-ы Mini Games-с санаа авсан) ----
// Ганц утсаа хосоороо дамжуулж, хэн хурдан дарж байгаагаа өрсөлдөж болно.
let reactionTimeoutId = null;
function renderSoloReaction() {
  soloState = { phase: "idle", best: soloState && soloState.best };
  renderReactionScreen("Хурдаа шалгаарай!", "Дарахад бэлэн болмогц дэлгэц ногоон болно. Хэт эрт бүү дар!", "btn-primary", "startReactionRound()");
}
function renderReactionScreen(title, sub, btnClass, onclick, bg, pulse) {
  gameRoot().innerHTML = `
    <a class="back-btn" onclick="clearTimeout(reactionTimeoutId);renderSoloHome()">← Буцах</a>
    <h2 style="margin:10px 0 4px;">⚡ Хурдны шалгалт</h2>
    ${soloState.best ? `<p style="color:var(--text-light);margin-bottom:10px;">🏆 Хамгийн сайн: <b>${soloState.best} ms</b></p>` : ""}
    <div class="game-reaction-box game-anim-pop${pulse ? " game-reaction-flash" : ""}" style="${bg ? `background:${bg};` : ""}" onclick="${onclick || ""}">
      <div class="game-reaction-title">${escapeHtml(title)}</div>
      <p class="game-reaction-sub">${escapeHtml(sub)}</p>
    </div>`;
}
function startReactionRound() {
  soloState.phase = "waiting";
  renderReactionScreen("Хүлээж байна...", "Ногоон болтол хүлээгээрэй", "btn-ghost", "earlyClickReaction()", "#e8e8f0");
  const delay = 1200 + Math.random() * 2800;
  reactionTimeoutId = setTimeout(() => {
    if (soloState.phase !== "waiting") return;
    soloState.phase = "ready";
    soloState.readyAt = Date.now();
    renderReactionScreen("ОДОО ДАР!", "", "btn-primary", "clickReaction()", "#2ecc71", true);
  }, delay);
}
function earlyClickReaction() {
  clearTimeout(reactionTimeoutId);
  soloState.phase = "idle";
  renderReactionScreen("Хэтэрхий яаравчилсан! 😅", "Ногоон болохыг хүлээгээд дараарай", "btn-primary", "startReactionRound()", "#ff6b6b");
}
function clickReaction() {
  const ms = Date.now() - soloState.readyAt;
  soloState.phase = "idle";
  if (!soloState.best || ms < soloState.best) soloState.best = ms;
  renderReactionScreen(`${ms} ms`, "Дахин туршиж үзэх үү?", "btn-primary", "startReactionRound()", "#fff");
}

// ---- 2048 (bored.com-ы Puzzle Games-с санаа авсан) ----
let game2048KeyHandler = null;
function cleanup2048() {
  if (game2048KeyHandler) { document.removeEventListener("keydown", game2048KeyHandler); game2048KeyHandler = null; }
}
function renderSolo2048() {
  cleanup2048();
  soloState = { grid: Array.from({length:4},()=>Array(4).fill(0)), score: 0, over: false, won: false };
  add2048Tile(); add2048Tile();
  game2048KeyHandler = (e) => {
    const map = { ArrowLeft:"left", ArrowRight:"right", ArrowUp:"up", ArrowDown:"down" };
    if (map[e.key]) { e.preventDefault(); move2048(map[e.key]); }
  };
  document.addEventListener("keydown", game2048KeyHandler);
  render2048();
}
function add2048Tile() {
  const empty = [];
  soloState.grid.forEach((row, r) => row.forEach((v, c) => { if (!v) empty.push([r, c]); }));
  if (!empty.length) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  soloState.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  soloState.newTile = r * 4 + c;
}
function slideMergeRow(row) {
  let vals = row.filter(v => v);
  let gained = 0;
  for (let i = 0; i < vals.length - 1; i++) {
    if (vals[i] === vals[i+1]) { vals[i] *= 2; gained += vals[i]; vals.splice(i+1, 1); }
  }
  while (vals.length < 4) vals.push(0);
  return { row: vals, gained };
}
function move2048(dir) {
  if (soloState.over) return;
  const g = soloState.grid;
  let changed = false, gained = 0;
  const getRow = (i, rev) => {
    let r;
    if (dir === "left" || dir === "right") r = [...g[i]];
    else r = [0,1,2,3].map(k => g[k][i]);
    return rev ? r.reverse() : r;
  };
  const setRow = (i, arr, rev) => {
    const finalArr = rev ? [...arr].reverse() : arr;
    if (dir === "left" || dir === "right") { if (JSON.stringify(g[i]) !== JSON.stringify(finalArr)) changed = true; g[i] = finalArr; }
    else { [0,1,2,3].forEach(k => { if (g[k][i] !== finalArr[k]) changed = true; g[k][i] = finalArr[k]; }); }
  };
  const reversed = dir === "right" || dir === "down";
  for (let i = 0; i < 4; i++) {
    const { row, gained: g2 } = slideMergeRow(getRow(i, reversed));
    gained += g2;
    setRow(i, row, reversed);
  }
  if (!changed) return;
  soloState.score += gained;
  add2048Tile();
  if (g.some(row => row.some(v => v === 2048)) && !soloState.won) soloState.won = true;
  soloState.over = !has2048Moves();
  render2048();
}
function has2048Moves() {
  const g = soloState.grid;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    if (!g[r][c]) return true;
    if (c < 3 && g[r][c] === g[r][c+1]) return true;
    if (r < 3 && g[r][c] === g[r+1][c]) return true;
  }
  return false;
}
function render2048() {
  const g = soloState.grid;
  gameRoot().innerHTML = `
    <a class="back-btn" onclick="cleanup2048();renderSoloHome()">← Буцах</a>
    <h2 style="margin:10px 0 4px;">🔢 2048</h2>
    <p style="color:var(--text-light);margin-bottom:10px;">Оноо: <b>${soloState.score}</b>${soloState.won ? " · 🎉 2048-д хүрлээ!" : ""}</p>
    <div class="game-2048-grid">
      ${g.map((row, r) => row.map((v, c) => `<div class="game-2048-cell${(r*4+c)===soloState.newTile ? " game-anim-pop" : ""}" data-val="${v}">${v || ""}</div>`).join("")).join("")}
    </div>
    <div class="game-2048-controls">
      <div></div><button class="btn btn-ghost" type="button" onclick="move2048('up')">↑</button><div></div>
      <button class="btn btn-ghost" type="button" onclick="move2048('left')">←</button>
      <button class="btn btn-ghost" type="button" onclick="move2048('down')">↓</button>
      <button class="btn btn-ghost" type="button" onclick="move2048('right')">→</button>
    </div>
    ${soloState.over ? `<div class="game-round-card" style="text-align:center;margin-top:14px;"><h3>Тоглоом дууслаа</h3><button class="btn btn-primary" type="button" style="width:100%;margin-top:10px;" onclick="renderSolo2048()">🔄 Дахин тоглох</button></div>` : ""}`;
}
