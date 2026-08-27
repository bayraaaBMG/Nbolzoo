let currentUbFilter = "all";
let currentRegion = "all";
let currentMovieFilter = "all";
let currentMovieCinemaTab = "all";
let currentMovieGenre = "all";
let currentMovieSort = "rating";
let currentMovieSearch = "";
let userLikes = new Set();
let userPostLikes = new Set();
let userHelpfulVotes = new Set(); // postId-ууд: currentUser "👍 Хэрэгтэй" гэж тэмдэглэсэн
let savedPostsSet = new Set();    // postId-ууд: currentUser "Save" хийсэн community post
let followingSet = new Set();     // uid-ууд: currentUser дагаж буй хэрэглэгчид
let currentPage = 1;
const itemsPerPage = 12;
let currentAimagId = null;

const cardColors = ["#CAF0F8","#E8F4F8","#FAECE7","#E0E7FF","#FEF3C7","#D1FAE5","#FCE7F3","#E0F2FE"];
function getColor(id) { return cardColors[id % cardColors.length]; }

// ===== IMAGE DATABASE =====
const WK = "https://upload.wikimedia.org/wikipedia/commons/thumb/";
const US = "https://images.unsplash.com/photo-";
const IMG = {
  // Mongolia — Wikipedia Commons
  ub:       WK+"0/03/Jugder_001.jpg/500px-Jugder_001.jpg",
  khuvsgul: WK+"a/a9/Khuvsgul.jpg/500px-Khuvsgul.jpg",
  gobi:     WK+"7/79/Gobi_Desert.jpg/500px-Gobi_Desert.jpg",
  terelj:   WK+"b/b6/Gorkhi-Terelj_National_Park.jpg/500px-Gorkhi-Terelj_National_Park.jpg",
  bayanzag: WK+"d/d7/Flaming_cliffs_5.jpg/500px-Flaming_cliffs_5.jpg",
  orkhon:   WK+"6/63/Orchon-mongolei.JPG/500px-Orchon-mongolei.JPG",
  erdene:   WK+"4/4c/%C5%9Awi%C4%85tynia_Zachodnia_w_klasztorze_Erdene_Dzuu_01.jpg/500px-%C5%9Awi%C4%85tynia_Zachodnia_w_klasztorze_Erdene_Dzuu_01.jpg",
  altai:    WK+"2/2b/GoraBeluha.jpg/500px-GoraBeluha.jpg",
  hustai:   WK+"b/b9/Khustain_Nuruu_National_Park.jpg/500px-Khustain_Nuruu_National_Park.jpg",
  genghis:  WK+"9/93/Genghis_Khan_Equestrian_Statue%2C_photo_by_Vaiz_Ha.jpg/500px-Genghis_Khan_Equestrian_Statue%2C_photo_by_Vaiz_Ha.jpg",
  steppe:   WK+"0/0a/Tree_on_the_Mongolian_steppe_%28June_1997%29.jpg/500px-Tree_on_the_Mongolian_steppe_%28June_1997%29.jpg",
  // Улаанбаатар — тодорхой газрын бодит зураг (өмнөх "erdene"/"ub" зэрэг буруу/ерөнхий
  // орлуулгыг засах зорилготой, доор IDEA_IMG_RULES-д ашиглана)
  zaisanphoto:      WK+"2/23/Zaisan_Memorial_in_Ulaanbaatar%2C_Mongolia.jpg/500px-Zaisan_Memorial_in_Ulaanbaatar%2C_Mongolia.jpg",
  gandanphoto:      WK+"f/ff/Gandantegchinlen_Monastery_%282024%29.jpg/500px-Gandantegchinlen_Monastery_%282024%29.jpg",
  dashchoilinphoto: WK+"1/19/Dashchoilin_Monastery.jpg/500px-Dashchoilin_Monastery.jpg",
  manzushirphoto:   WK+"d/d9/Manzushir_Monastery.jpg/500px-Manzushir_Monastery.jpg",
  choijinphoto:     WK+"a/ac/UB-Csojdzsin00.jpg/500px-UB-Csojdzsin00.jpg",
  // Activities — Unsplash (free, no attribution required)
  coffee:   US+"1511632765486-a01980e01a18?w=420&h=200&fit=crop&auto=format",
  park:     US+"1441974231531-c6227db76b6e?w=420&h=200&fit=crop&auto=format",
  museum:   US+"1554907984-15263bfd63bd?w=420&h=200&fit=crop&auto=format",
  cinema:   US+"1489599849927-2ee91cede3ba?w=420&h=200&fit=crop&auto=format",
  skating:  WK+"9/91/Skating%2C_man%2C_woman%2C_ice-skating_rink%2C_winter%2C_smile%2C_free_time_Fortepan_14348.jpg/500px-Skating%2C_man%2C_woman%2C_ice-skating_rink%2C_winter%2C_smile%2C_free_time_Fortepan_14348.jpg",
  spa:      US+"1544161515-4ab6ce6db874?w=420&h=200&fit=crop&auto=format",
  hiking:   US+"1551632811-561732d1e306?w=420&h=200&fit=crop&auto=format",
  dinner:   US+"1414235077428-338989a2e8c0?w=420&h=200&fit=crop&auto=format",
  bookshop: US+"1507003211169-0a1dd7228f2d?w=420&h=200&fit=crop&auto=format",
  pottery:  US+"1565193566173-7a0ee3dbe261?w=420&h=200&fit=crop&auto=format",
  yoga:     US+"1544367567-0f2fcb009e0b?w=420&h=200&fit=crop&auto=format",
  bowling:  US+"1535131749006-b7f58c99034b?w=420&h=200&fit=crop&auto=format",
  music:    US+"1514525253161-7a46d19cd819?w=420&h=200&fit=crop&auto=format",
  fitness:  US+"1534438327276-14e5300c3a48?w=420&h=200&fit=crop&auto=format",
  cooking:  US+"1556909114-f6e7ad7d3136?w=420&h=200&fit=crop&auto=format",
  theater:  US+"1507924538820-ede94a04019d?w=420&h=200&fit=crop&auto=format",
  bar:      US+"1574126154517-d1e0d89ef734?w=420&h=200&fit=crop&auto=format",
  couple:   US+"1516589178581-6cd7833ae3b2?w=420&h=200&fit=crop&auto=format",
  boardgame:US+"1611996575749-79a3a250f948?w=420&h=200&fit=crop&auto=format",
  archery:  US+"1508193638397-1c4234db14d8?w=420&h=200&fit=crop&auto=format",
  art:      US+"1561214115-f2f134cc4912?w=420&h=200&fit=crop&auto=format",
  // 365 санааны тусгай, яг тохирсон зурагнууд — Wikimedia Commons (нийтийн эзэмшлийн/CC зөвшөөрөлтэй)
  koreanbbq: WK+"6/63/Korean_BBQ_Seoul.jpg/500px-Korean_BBQ_Seoul.jpg",
  ramen: WK+"c/c3/Shoyu_Ramen%EF%BC%88Tokyo_Ramen%EF%BC%89_-_01.jpg/500px-Shoyu_Ramen%EF%BC%88Tokyo_Ramen%EF%BC%89_-_01.jpg",
  pho: WK+"5/52/Bowl_of_Meatball_pho.jpg/500px-Bowl_of_Meatball_pho.jpg",
  kebab: WK+"5/5b/Lula_kebab_2.jpg/500px-Lula_kebab_2.jpg",
  pizza: WK+"5/57/Neapolitan_pizza_at_Trappica_(48701940197).jpg/500px-Neapolitan_pizza_at_Trappica_(48701940197).jpg",
  dimsum: WK+"8/81/Chinese_DimSum_(9023590541).jpg/500px-Chinese_DimSum_(9023590541).jpg",
  steak: WK+"2/2b/Beef_fillet_steak_with_mushrooms.jpg/500px-Beef_fillet_steak_with_mushrooms.jpg",
  seafood: WK+"a/ae/Plateau_van_zeevruchten.jpg/500px-Plateau_van_zeevruchten.jpg",
  khachapuri: WK+"0/08/Old_Tbilisi%2C_Georgian_khachapuri%2C_Georgia.jpg/500px-Old_Tbilisi%2C_Georgian_khachapuri%2C_Georgia.jpg",
  burrito: WK+"6/60/Burrito.JPG/500px-Burrito.JPG",
  tomyum: WK+"e/e8/Tom_yam_kung_maenam.jpg/500px-Tom_yam_kung_maenam.jpg",
  buuz: WK+"a/a2/Buuz.jpg/500px-Buuz.jpg",
  croissant: WK+"2/2a/Croissant-Petr_Kratochvil.jpg/500px-Croissant-Petr_Kratochvil.jpg",
  cheesecake: WK+"e/ea/Baked_cheesecake_with_raspberries_and_blueberries.jpg/500px-Baked_cheesecake_with_raspberries_and_blueberries.jpg",
  waffle: WK+"5/5b/Waffles_with_Strawberries.jpg/500px-Waffles_with_Strawberries.jpg",
  macaron: WK+"1/11/VanillaMacaron.jpg/500px-VanillaMacaron.jpg",
  bubbletea: WK+"a/a2/Bubble_Tea.png/500px-Bubble_Tea.png",
  churro: WK+"c/c6/Chocolate_con_churros_(27343655726).jpg/500px-Chocolate_con_churros_(27343655726).jpg",
  doughnut: WK+"a/a5/Glazed-Donut.jpg/500px-Glazed-Donut.jpg",
  icecream: WK+"2/2e/Ice_cream_with_whipped_cream%2C_chocolate_syrup%2C_and_a_wafer_(cropped).jpg/500px-Ice_cream_with_whipped_cream%2C_chocolate_syrup%2C_and_a_wafer_(cropped).jpg",
  crepe: WK+"0/09/Crepes_dsc07085.jpg/500px-Crepes_dsc07085.jpg",
  hotpot: WK+"9/91/Hot_Pot.jpg/500px-Hot_Pot.jpg",
  honey: WK+"c/cc/Runny_hunny.jpg/500px-Runny_hunny.jpg",
  escaperoom: WK+"b/b1/Tulleys_Farm_Outfitter_Escape_Room.jpg/500px-Tulleys_Farm_Outfitter_Escape_Room.jpg",
  trampoline: WK+"c/cc/Hometrampoline.jpg/500px-Hometrampoline.jpg",
  gokart: WK+"a/a9/Kosmic_TS28.JPG/500px-Kosmic_TS28.JPG",
  paintball: WK+"2/2e/NAdo-JTF3.jpg/500px-NAdo-JTF3.jpg",
  darts: WK+"f/fb/Darts_in_a_dartboard.jpg/500px-Darts_in_a_dartboard.jpg",
  tabletennis: WK+"5/58/Mondial_Ping_-_Men's_Singles_-_Round_4_-_Kenta_Matsudaira-Vladimir_Samsonov_-_57.jpg/500px-Mondial_Ping_-_Men's_Singles_-_Round_4_-_Kenta_Matsudaira-Vladimir_Samsonov_-_57.jpg",
  lasertag: WK+"b/bb/Fort_Bliss_laser_tag_120705-A-WO769-016_(cropped).jpg/500px-Fort_Bliss_laser_tag_120705-A-WO769-016_(cropped).jpg",
  climbing: WK+"a/a7/Grimpeurs_Voiron_2b.jpg/500px-Grimpeurs_Voiron_2b.jpg",
  archery2: WK+"3/3e/Archery_competition.jpg/500px-Archery_competition.jpg",
  equestrian: WK+"f/fa/Horse_riding_in_coca_cola_arena_-_melbourne_show_2005.jpg/500px-Horse_riding_in_coca_cola_arena_-_melbourne_show_2005.jpg",
  boxing: WK+"6/6b/US_Navy_030327-N-9693M-002_Lt._Cmdr._Philip_Creider%2C_left%2C_shows_Aviation_Machinist_Mate_3rd_Class_Gaspar_Vazquez_how_to_work_a_speed_bag.jpg/500px-US_Navy_030327-N-9693M-002_Lt._Cmdr._Philip_Creider%2C_left%2C_shows_Aviation_Machinist_Mate_3rd_Class_Gaspar_Vazquez_how_to_work_a_speed_bag.jpg",
  skateboard2: WK+"c/c0/BackSmithGrind.jpg/500px-BackSmithGrind.jpg",
  icehockey: WK+"3/39/Pittsburgh_Penguins%2C_Washington_Capitals%2C_Bryan_Rust_(33744033514).jpg/500px-Pittsburgh_Penguins%2C_Washington_Capitals%2C_Bryan_Rust_(33744033514).jpg",
  basketball: WK+"0/06/Steph_Curry_(51915116957).jpg/500px-Steph_Curry_(51915116957).jpg",
  badminton2: WK+"f/fd/Olympics_2012_Mixed_Doubles_Final.jpg/500px-Olympics_2012_Mixed_Doubles_Final.jpg",
  tennis2: WK+"9/94/2013_Australian_Open_-_Guillaume_Rufin.jpg/500px-2013_Australian_Open_-_Guillaume_Rufin.jpg",
  football: WK+"4/42/Football_in_Bloomington%2C_Indiana%2C_1995.jpg/500px-Football_in_Bloomington%2C_Indiana%2C_1995.jpg",
  volleyball: WK+"b/b0/Brasil_vence_a_Fran%C3%A7a_no_v%C3%B4lei_masculino_1037987-15.08.2016_ffz-6369.jpg/500px-Brasil_vence_a_Fran%C3%A7a_no_v%C3%B4lei_masculino_1037987-15.08.2016_ffz-6369.jpg",
  armwrestling: WK+"c/cb/Armwrestle.jpg/500px-Armwrestle.jpg",
  foosball: WK+"c/c8/Baby_foot_artlibre_jnl.jpg/500px-Baby_foot_artlibre_jnl.jpg",
  minigolf: WK+"e/e3/Minigolf.jpg/500px-Minigolf.jpg",
  golfsim: WK+"4/45/New_Sports_Simulator_(6917965).jpg/500px-New_Sports_Simulator_(6917965).jpg",
  calligraphy: WK+"3/3c/Letter_by_Ouyang_Xiu.jpg/500px-Letter_by_Ouyang_Xiu.jpg",
  chocolate: WK+"1/11/Three_Bars_(1).jpg/500px-Three_Bars_(1).jpg",
  candle: WK+"a/aa/LA2_Skultuna_kontorsljusstake.jpg/500px-LA2_Skultuna_kontorsljusstake.jpg",
  soap: WK+"9/9b/Handmade_soap_cropped_and_simplified.jpg/500px-Handmade_soap_cropped_and_simplified.jpg",
  tattoo: WK+"e/e6/Anchor_tattoo_and_sketch.jpg/500px-Anchor_tattoo_and_sketch.jpg",
  sculpture: WK+"d/d4/Dying_gaul.jpg/500px-Dying_gaul.jpg",
  weaving: WK+"5/5e/Warp_and_weft_2.jpg/500px-Warp_and_weft_2.jpg",
  origami: WK+"1/10/Cranes_made_by_Origami_paper.jpg/500px-Cranes_made_by_Origami_paper.jpg",
  improv: WK+"2/22/69-04-culture-comedy-improv-AngelicaSchwartz2_1000_667_90.jpg/500px-69-04-culture-comedy-improv-AngelicaSchwartz2_1000_667_90.jpg",
  darkroom: WK+"f/f8/UCHSPhotoDarkRoom9.10.09ByLuigiNovi1.jpg/500px-UCHSPhotoDarkRoom9.10.09ByLuigiNovi1.jpg",
  speakeasy: WK+"0/00/21Club.JPG/500px-21Club.JPG",
  nightclub: WK+"3/32/Wikipedia_space_ibiza(03).jpg/500px-Wikipedia_space_ibiza(03).jpg",
  whisky: WK+"a/a2/Whiskyhogmanay2010.jpg/500px-Whiskyhogmanay2010.jpg",
  karaoke: WK+"a/a0/%E5%8D%A1%E6%8B%89OK.jpg/500px-%E5%8D%A1%E6%8B%89OK.jpg",
  winebar: WK+"0/0a/HK_SOHO_60310_18.jpg/500px-HK_SOHO_60310_18.jpg",
  cocktail: WK+"8/80/15-09-26-RalfR-WLC-0084.jpg/500px-15-09-26-RalfR-WLC-0084.jpg",
  beergarden: WK+"a/a8/Hofbraeukeller_5906.JPG/500px-Hofbraeukeller_5906.JPG",
  dinosaur: WK+"c/c5/Sinosauropteryxfossil.jpg/500px-Sinosauropteryxfossil.jpg",
  circus: WK+"8/8c/Barnum_%26_Bailey_clowns_and_geese2.jpg/500px-Barnum_%26_Bailey_clowns_and_geese2.jpg",
  ballet: WK+"3/3a/Edgar_Degas_-_La_Classe_de_danse.jpg/500px-Edgar_Degas_-_La_Classe_de_danse.jpg",
  puppetry: WK+"c/ca/Swanage_Punch_%26_Judy.JPG/500px-Swanage_Punch_%26_Judy.JPG",
  standup: WK+"2/2e/Jesus_is_coming.._Look_Busy_(George_Carlin).jpg/500px-Jesus_is_coming.._Look_Busy_(George_Carlin).jpg",
  fashionshow: WK+"1/1e/Diane_von_F%C3%BCrstenberg_Spring-Summer_2014_06.jpg/500px-Diane_von_F%C3%BCrstenberg_Spring-Summer_2014_06.jpg",
  naadam: WK+"d/d9/Naadam_Festival_2024_Opening_Ceremony.jpg/500px-Naadam_Festival_2024_Opening_Ceremony.jpg",
  vinyl: WK+"e/ee/Vinilos_distintos_tama%C3%B1os.jpg/500px-Vinilos_distintos_tama%C3%B1os.jpg",
  kayak: WK+"4/43/Woman_kayaking_on_a_turquoise_lake_(51125937521).jpg/500px-Woman_kayaking_on_a_turquoise_lake_(51125937521).jpg",
  sup: WK+"4/43/J%C3%A9r%C3%A9my-Massi%C3%A8re_stand-up-paddle_biscarrosse-2.JPG/500px-J%C3%A9r%C3%A9my-Massi%C3%A8re_stand-up-paddle_biscarrosse-2.JPG",
  fishing: WK+"d/d7/Mete_(fiske)_-_Ystad-2018.jpg/500px-Mete_(fiske)_-_Ystad-2018.jpg",
  fountain: WK+"f/f5/Fountains_Collage.jpg/500px-Fountains_Collage.jpg",
  balloon: WK+"8/8a/2006_Ojiya_balloon_festival_011.jpg/500px-2006_Ojiya_balloon_festival_011.jpg",
  astronomy: WK+"2/22/Astronomy_Amateur_3_V2.jpg/500px-Astronomy_Amateur_3_V2.jpg",
  camping: WK+"7/73/Tent_camping_along_the_Sulayr_trail_in_La_Taha%2C_Sierra_Nevada_National_Park_(DSCF5147).jpg/500px-Tent_camping_along_the_Sulayr_trail_in_La_Taha%2C_Sierra_Nevada_National_Park_(DSCF5147).jpg",
  deptstore: WK+"c/cd/Bon_March%C3%A9%2C_Paris_-_interior_view.JPG/500px-Bon_March%C3%A9%2C_Paris_-_interior_view.JPG",
  vintageclothes: WK+"0/00/Vintage_shops%2C_Dublin.jpg/500px-Vintage_shops%2C_Dublin.jpg",
  fleamarket: WK+"1/12/Puces_de_Montsoreau.jpg/500px-Puces_de_Montsoreau.jpg",
  farmersmarket: WK+"e/ea/Farmers_and_Artisans_Market_at_Farmington_-_Michigan.jpg/500px-Farmers_and_Artisans_Market_at_Farmington_-_Michigan.jpg",
  xmasmarket: WK+"8/8d/Christkindlesmarkt_nuernberg.jpg/500px-Christkindlesmarkt_nuernberg.jpg",
  icesculpture: WK+"c/cb/Ice_sculpture_in_Quebec_city_downtown.jpg/500px-Ice_sculpture_in_Quebec_city_downtown.jpg",
  fireworks: WK+"4/4e/New_Year's_Eve_on_Sydney_Harbour.jpg/500px-New_Year's_Eve_on_Sydney_Harbour.jpg",
  sukhbaatarsq: WK+"c/c9/Chinggis_Square.jpg/500px-Chinggis_Square.jpg",
  tuulriver: WK+"e/ea/Tuul_River_Mongolia.JPG/500px-Tuul_River_Mongolia.JPG",
  blueskytower: WK+"d/d0/Felh%C5%91karcol%C3%B3_a_f%C5%91t%C3%A9ren_(Skyscraper_on_the_central_square)_-_panoramio.jpg/500px-Felh%C5%91karcol%C3%B3_a_f%C5%91t%C3%A9ren_(Skyscraper_on_the_central_square)_-_panoramio.jpg",
  zanabazarmuseum: WK+"d/dc/The_Fine_Arts_Zanabazar_Museum.jpg/500px-The_Fine_Arts_Zanabazar_Museum.jpg",
  bogdkhanuul: WK+"e/e0/Bogd_Khan_Uul_Mount_view_from_Ulan_Bator%2C_Mongolia.JPG/500px-Bogd_Khan_Uul_Mount_view_from_Ulan_Bator%2C_Mongolia.JPG",
};

// Аймаг тус бүрийн өөрийн (Wikipedia-гийн тухайн аймгийн өгүүллийн зурагнаас авсан) жинхэнэ зураг —
// өмнө нь ганцхан 11 ерөнхий зургийг 21 аймагт давхардуулан ашигладаг байсныг сольсон.
const aimagImgDB = {
  "Архангай":    {u: WK+"4/4f/A_view_of_Arhangay.jpg/500px-A_view_of_Arhangay.jpg",                                                            s: "Wikipedia CC"},
  "Баян-Өлгий":  {u: WK+"0/09/Tavan_Bogd_Mountain.jpg/500px-Tavan_Bogd_Mountain.jpg",                                                          s: "Wikipedia CC"},
  "Баянхонгор":  {u: WK+"3/3e/Nomgon_from_the_west.jpg/500px-Nomgon_from_the_west.jpg",                                                        s: "Wikipedia CC"},
  "Говьсүмбэр":  {u: WK+"c/cb/At_Choir_Mongolia_%2811532660476%29.jpg/500px-At_Choir_Mongolia_%2811532660476%29.jpg",                          s: "Wikipedia CC"},
  "Булган":      {u: WK+"5/5b/Amarbayasgalant_monastery_temple_01.JPG/500px-Amarbayasgalant_monastery_temple_01.JPG",                          s: "Wikipedia CC"},
  "Говь-Алтай":  {u: WK+"3/32/Sutai_Mount%2C_Altai_Mountains._-_panoramio.jpg/500px-Sutai_Mount%2C_Altai_Mountains._-_panoramio.jpg",          s: "Wikipedia CC"},
  "Дархан-Уул":  {u: WK+"7/79/Darkhan.jpg/500px-Darkhan.jpg",                                                                                  s: "Wikipedia CC"},
  "Дорноговь":   {u: WK+"1/16/Gobi%2C_krajobraz_pustyni_%2820%29.jpg/500px-Gobi%2C_krajobraz_pustyni_%2820%29.jpg",                            s: "Wikipedia CC"},
  "Дорнод":      {u: WK+"b/b6/Bars_Hota_Mongolia.jpg/500px-Bars_Hota_Mongolia.jpg",                                                            s: "Wikipedia CC"},
  "Дундговь":    {u: WK+"9/91/S%C3%BCmKh%C3%B6khBurd.jpg/500px-S%C3%BCmKh%C3%B6khBurd.jpg",                                                    s: "Wikipedia CC"},
  "Завхан":      {u: WK+"6/69/Har_Nuur.jpg/500px-Har_Nuur.jpg",                                                                                s: "Wikipedia CC"},
  "Орхон":       {u: WK+"8/8a/Erdenet_02.jpg/500px-Erdenet_02.jpg",                                                                            s: "Wikipedia CC"},
  "Өвөрхангай":  {u: WK+"e/ec/ErdeneZuuMonasteryMongolia.JPG/500px-ErdeneZuuMonasteryMongolia.JPG",                                            s: "Wikipedia CC"},
  "Өмнөговь":    {u: WK+"9/90/OmnogoviLandscape.jpg/500px-OmnogoviLandscape.jpg",                                                              s: "Wikipedia CC"},
  "Сүхбаатар":   {u: WK+"b/b8/Steppe01-Obo.jpg/500px-Steppe01-Obo.jpg",                                                                        s: "Wikipedia CC"},
  "Сэлэнгэ":     {u: WK+"b/b5/Selenga.jpg/500px-Selenga.jpg",                                                                                  s: "Wikipedia CC"},
  "Төв":         {u: WK+"3/3c/Zuunmod_%282025%29.jpg/500px-Zuunmod_%282025%29.jpg",                                                            s: "Wikipedia CC"},
  "Увс":         {u: WK+"3/36/Uvs_n%C3%BAr.JPG/500px-Uvs_n%C3%BAr.JPG",                                                                        s: "Wikipedia CC"},
  "Ховд":        {u: WK+"d/d9/The_Buyant_River.jpg/500px-The_Buyant_River.jpg",                                                                s: "Wikipedia CC"},
  "Хөвсгөл":     {u: WK+"c/c8/Burentogtokh.jpg/500px-Burentogtokh.jpg",                                                                        s: "Wikipedia CC"},
  "Хэнтий":      {u: WK+"5/50/Kherlen_River.jpg/500px-Kherlen_River.jpg",                                                                      s: "Wikipedia CC"},
};

function getAimagImg(a) {
  return aimagImgDB[a.name] || {u: IMG.steppe, s: "Wikipedia CC"};
}

// Wonder type image mapping
const wonderTypeImgDB = {
  lake:      {u: IMG.khuvsgul, s: "Wikipedia CC"},
  mountain:  {u: IMG.altai,    s: "Wikipedia CC"},
  desert:    {u: IMG.gobi,     s: "Wikipedia CC"},
  volcano:   {u: IMG.khuvsgul, s: "Wikipedia CC"},
  cave:      {u: IMG.bayanzag, s: "Wikipedia CC"},
  temple:    {u: IMG.erdene,   s: "Wikipedia CC"},
  waterfall: {u: IMG.orkhon,   s: "Wikipedia CC"},
  rock:      {u: IMG.bayanzag, s: "Wikipedia CC"},
  ruins:     {u: IMG.erdene,   s: "Wikipedia CC"},
  steppe:    {u: IMG.steppe,   s: "Wikipedia CC"},
  canyon:    {u: IMG.bayanzag, s: "Wikipedia CC"},
  river:     {u: IMG.orkhon,   s: "Wikipedia CC"},
  spring:    {u: IMG.khuvsgul, s: "Wikipedia CC"},
  nomad:     {u: IMG.steppe,   s: "Wikipedia CC"},
  historic:  {u: IMG.erdene,   s: "Wikipedia CC"},
  nature:    {u: IMG.terelj,   s: "Wikipedia CC"},
};

// category → нэрлэсэн түлхүүр үг олдоогүй үед ашиглах агуулгын хувьд тохирсон нөөц зураг
// (365 санааны аль нь ч зурагтай алдуулгүй харагдана)
const CATEGORY_FALLBACK_IMG = {
  "кафе":      {u: IMG.coffee,   s: "Unsplash"},
  "ресторан":  {u: IMG.dinner,   s: "Unsplash"},
  "кино":      {u: IMG.cinema,   s: "Unsplash"},
  "урлаг":     {u: IMG.art,      s: "Unsplash"},
  "музей":     {u: IMG.museum,   s: "Unsplash"},
  "парк":      {u: IMG.park,     s: "Unsplash"},
  "худалдаа":  {u: IMG.ub,       s: "Wikipedia CC"},
  "хөгжим":    {u: IMG.music,    s: "Unsplash"},
  "тоглоом":   {u: IMG.boardgame,s: "Unsplash"},
  "spa":       {u: IMG.spa,      s: "Unsplash"},
  "усан":      {u: IMG.hiking,   s: "Unsplash"},
  "өвлийн":    {u: IMG.skating,  s: "Unsplash"},
  "идэвхтэй":  {u: IMG.fitness,  s: "Unsplash"},
  "ном":       {u: IMG.bookshop, s: "Unsplash"},
};

// idea.title-д тохирох ЯГ зургийг оноох дараалсан дүрмүүд — ХАМГИЙН ТОДОРХОЙ нь эхэнд.
// Массив бүр [key1, key2, ...] орсон бол эхний тохирсон мөрийг ашиглана.
// [triggers, IMG түлхүүр, эх сурвалж]
const IDEA_IMG_RULES = [
  // --- Монголын тодорхой газрууд (ерөнхий UB зургаас илүү оновчтой) ---
  [["сүхбаатарын хөшөө", "сүхбаатарын талбай"], "sukhbaatarsq", "Wikipedia CC"],
  [["туулын хөндий", "туулын эрэг", "туул голоор", "туул голын", "sup бордтой туул", "каякаар голын", "тэнгисийн голоор", "загас барих аялал голын", "голын эрэгт лаа", "голын эрэг дагуу пикник", "аварга гүүрэн доогуурх"], "tuulriver", "Wikipedia CC"],
  [["blue sky tower"], "blueskytower", "Wikipedia CC"],
  [["занабазарын дүрслэх"], "zanabazarmuseum", "Wikipedia CC"],
  [["манзуширын хийд"], "manzushirphoto", "Wikipedia CC"],
  [["богд уулын ар тал", "богд ууланд тахил", "богд уулын түвдийн", "богд уулаар аялах", "богдын хаалганаас"], "bogdkhanuul", "Wikipedia CC"],
  [["зайсан"], "zaisanphoto", "Wikipedia CC"],
  [["мижид жанрайсэг", "гандан хийдэд залбирах"], "gandanphoto", "Wikipedia CC"],
  [["дашчойлин хийдэд"], "dashchoilinphoto", "Wikipedia CC"],
  [["чойжин ламын музейд", "чойжин ламын музей"], "choijinphoto", "Wikipedia CC"],

  // --- Хоол/амт төрлүүд (ерөнхий "ресторан" зургаас илүү оновчтой) ---
  [["солонгос барбекю"], "koreanbbq", "Unsplash"],
  [["рамен"], "ramen", "Wikipedia CC"],
  [["фо газарт", "вьетнам фо"], "pho", "Wikipedia CC"],
  [["кебаб"], "kebab", "Wikipedia CC"],
  [["пицца"], "pizza", "Wikipedia CC"],
  [["dim sum"], "dimsum", "Wikipedia CC"],
  [["стейк газарт"], "steak", "Wikipedia CC"],
  [["далайн хоолны"], "seafood", "Wikipedia CC"],
  [["хачапури", "georgian ресторан"], "khachapuri", "Wikipedia CC"],
  [["буррито"], "burrito", "Wikipedia CC"],
  [["тайландын том яамны", "том ям"], "tomyum", "Wikipedia CC"],
  [["бууз идэх", "буузны тэмцээн"], "buuz", "Wikipedia CC"],
  [["café du monde", "croissant"], "croissant", "Wikipedia CC"],
  [["cheesecake"], "cheesecake", "Wikipedia CC"],
  [["waffle"], "waffle", "Wikipedia CC"],
  [["macaron"], "macaron", "Wikipedia CC"],
  [["bubble tea"], "bubbletea", "Wikipedia CC"],
  [["churros"], "churro", "Wikipedia CC"],
  [["донат газарт", "24 цагийн donut"], "doughnut", "Wikipedia CC"],
  [["айсны газарт", "гар хийцийн зайрмаг"], "icecream", "Wikipedia CC"],
  [["крепийн газарт"], "crepe", "Wikipedia CC"],
  [["the bull hot pot"], "hotpot", "Wikipedia CC"],
  [["зөгийн бал"], "honey", "Unsplash"],

  // --- Тоглоом/идэвхтэй үйл ажиллагаа (тодорхой төрөл) ---
  [["escape room"], "escaperoom", "Wikipedia CC"],
  [["трамплин парк"], "trampoline", "Wikipedia CC"],
  [["картинг"], "gokart", "Wikipedia CC"],
  [["пейнтболын"], "paintball", "Wikipedia CC"],
  [["дартсны бар"], "darts", "Wikipedia CC"],
  [["ширээний теннисний"], "tabletennis", "Wikipedia CC"],
  [["лазер таг"], "lasertag", "Wikipedia CC"],
  [["хиймэл авиралтын", "уулын явган аялалын клубт"], "climbing", "Wikipedia CC"],
  [["сур харваа", "archery"], "archery2", "Wikipedia CC"],
  [["морь унах клубт"], "equestrian", "Wikipedia CC"],
  [["бокс клубт"], "boxing", "Wikipedia CC"],
  [["skateboard паркт"], "skateboard2", "Wikipedia CC"],
  [["хоккейн тоглолт"], "icehockey", "Wikipedia CC"],
  [["сагсан бөмбөгийн тоглолт"], "basketball", "Wikipedia CC"],
  [["бадминтоны клубт", "бадьмингтон"], "badminton2", "Wikipedia CC"],
  [["теннисний клубт"], "tennis2", "Wikipedia CC"],
  [["хөл бөмбөгийн талбайд", "хагас марафоны"], "football", "Wikipedia CC"],
  [["волейболын нээлттэй"], "volleyball", "Wikipedia CC"],
  [["гар барианы клубт"], "armwrestling", "Wikipedia CC"],
  [["хөлбөмбөгийн симулятортой"], "foosball", "Wikipedia CC"],
  [["мини-гольфын"], "minigolf", "Wikipedia CC"],
  [["индор голфын"], "golfsim", "Wikipedia CC"],

  // --- Гар урлал/сургалт ---
  [["каллиграфийн"], "calligraphy", "Wikipedia CC"],
  [["chocolate making"], "chocolate", "Wikipedia CC"],
  [["лаа хийх сургалт"], "candle", "Wikipedia CC"],
  [["шампунь", "сабон хийх"], "soap", "Wikipedia CC"],
  [["татуировкатай студид"], "tattoo", "Wikipedia CC"],
  [["скульптур хийх"], "sculpture", "Wikipedia CC"],
  [["нэхмэлийн хичээлд"], "weaving", "Wikipedia CC"],
  [["оригами", "ромбо"], "origami", "Wikipedia CC"],
  [["импровизацийн театрын"], "improv", "Wikipedia CC"],
  [["хар цагаан лаборатори"], "darkroom", "Wikipedia CC"],

  // --- Шөнийн амьдрал ---
  [["speakeasy"], "speakeasy", "Wikipedia CC"],
  [["dj тоглолттой клубт"], "nightclub", "Wikipedia CC"],
  [["whisky bar"], "whisky", "Wikipedia CC"],
  [["караокед", "караокений", "mongolyrics"], "karaoke", "Wikipedia CC"],
  [["wine bar"], "winebar", "Wikipedia CC"],
  [["cocktail making", "rooftop bar-т коктейл"], "cocktail", "Wikipedia CC"],
  [["beer garden"], "beergarden", "Wikipedia CC"],

  // --- Музей/соёл ---
  [["үлэг гүрвэлийн"], "dinosaur", "Wikipedia CC"],
  [["үндэсний циркийн"], "circus", "Wikipedia CC"],
  [["удэт-д балетын"], "ballet", "Wikipedia CC"],
  [["хүүхэлдэйн театрт"], "puppetry", "Wikipedia CC"],
  [["стэндап шоу"], "standup", "Wikipedia CC"],
  [["fashion show"], "fashionshow", "Wikipedia CC"],
  [["наадамын бөх"], "naadam", "Wikipedia CC"],
  [["виниль дэлгүүрт"], "vinyl", "Wikipedia CC"],

  // --- Гадаа/ус ---
  [["каякаар"], "kayak", "Wikipedia CC"],
  [["sup бордтой"], "sup", "Wikipedia CC"],
  [["мөсөн дээр загас барих"], "fishing", "Wikipedia CC"],
  [["усан оргилуурын"], "fountain", "Wikipedia CC"],
  [["агаарын бөмбөлгөн нисэлт", "бөмбөлөг илгээх"], "balloon", "Wikipedia CC"],
  [["одон орон ажиглах", "од харах"], "astronomy", "Wikipedia CC"],
  [["майхан барьж хонох"], "camping", "Wikipedia CC"],

  // --- Нэмэлт тодруулга: латин үсэгтэй нэр/цөөн дутуу тохирсон title-үүд ---
  [["кофе", "матча", "цайны газарт", "caffe bene"], "coffee", "Unsplash"],
  [["opera", "mongolian theatre"], "theater", "Wikipedia CC"],
  [["симфони", "танго бүжгийн", "live music бар", "салса бүжгийн", "silent disco"], "music", "Unsplash"],
  [["уран зохиолын", "талархлын дэвтэр"], "bookshop", "Unsplash"],
  [["билльярд"], "boardgame", "Unsplash"],
  [["нүүрний арчилгаа", "флоат спа", "уламжлалт зочид буудлын спа", "медитацийн төвд", "усан бассейнд"], "spa", "Unsplash"],
  [["sky resort"], "skating", "Unsplash"],
  [["слэклайн", "дасгал хийх спорт заалны", "гимнастикийн клубт"], "fitness", "Unsplash"],
  [["гар урлалын зах", "загварын шоу-руумд", "гудамжны урлагийг", "үндэсний костюмтой"], "art", "Unsplash"],
  [["терраса бар"], "bar", "Unsplash"],
  [["зурах + дарс"], "art", "Unsplash"],
  [["керамик урлалын"], "pottery", "Unsplash"],
  [["гурил боловсруулах", "гэртээ орой хоол хийж"], "cooking", "Unsplash"],
  [["соёолжны урлалын"], "park", "Unsplash"],
  [["оддын зураг"], "astronomy", "Wikipedia CC"],
  [["зочид буудлын өрөөнд өглөөний хоол"], "croissant", "Wikipedia CC"],
  [["central tower"], "blueskytower", "Wikipedia CC"],
  [["нэг жилийн ойгоо тэмдэглэх"], "dinner", "Unsplash"],
  [["хүнсний машины наадамд", "олон нийтийн зах зээлээр", "зах зээлээр алхах", "зах зээлд", "улирлын жимс түүх"], "farmersmarket", "Wikipedia CC"],
  [["цэцгийн наадамд", "хиймэл шувуу хөөрүүлэх"], "park", "Wikipedia CC"],
  [["шинэ жилийн галт"], "fireworks", "Wikipedia CC"],
  [["mcs плазагийн"], "deptstore", "Wikipedia CC"],
  [["гастробарт", "route 22"], "bar", "Unsplash"],
  [["пастийн газарт"], "pizza", "Wikipedia CC"],
  [["бургер газарт"], "dinner", "Unsplash"],
  [["гриль газарт"], "steak", "Wikipedia CC"],
  [["салатны газарт"], "dinner", "Unsplash"],
  [["амттангийн газарт", "печенийн газарт"], "cheesecake", "Wikipedia CC"],
  [["brunch", "buffet"], "croissant", "Wikipedia CC"],
  [["cat cafe"], "coffee", "Unsplash"],
  [["night market"], "farmersmarket", "Wikipedia CC"],
  [["rosewood kitchen"], "pizza", "Wikipedia CC"],

  // --- Худалдаа ---
  [["улсын их дэлгүүрт", "ikea-маягийн"], "deptstore", "Wikipedia CC"],
  [["vintage clothing"], "vintageclothes", "Wikipedia CC"],
  [["наран тууль зах"], "fleamarket", "Wikipedia CC"],
  [["органик зах"], "farmersmarket", "Wikipedia CC"],

  // --- Улирлын баяр ---
  [["christmas market"], "xmasmarket", "Wikipedia CC"],
  [["мөсөн баримлын"], "icesculpture", "Wikipedia CC"],
  [["шинэ жилийн галт цэцэг"], "fireworks", "Wikipedia CC"],

  // --- Ерөнхий ангиллууд (өмнөх тодорхой дүрмүүдэд тохирохгүй бол) ---
  // "хотын", "талбай" зэрэг хэт өргөн trigger-үүдийг эндээс хассан: тэдгээр нь хөл бөмбөгийн
  // талбай, музейн нэр дэх "хотын" гэх мэт огт өөр санааг музей/спорт зэрэг зөв ангиллаас нь
  // "хулгайлж" Жугдэрийн зурагт буруу оноодог байсан тул зөвхөн жинхэнэ давхцлын эрсдэлгүй,
  // өөр тодорхой зураг олдоогүй хоёр trigger үлдээв ("хотхон", "энхтайваны гүүр").
  [["хотхон", "энхтайваны гүүр"], "ub", "Wikipedia CC"],
  [["музей", "heritage", "чойжин", "монгол cos", "галерей", "gallery"], "museum", "Unsplash"],
  // Тодорхой нэргүй/ховор хийд, сүм, овоо, шүтээн (Дамбадаржаа, Сэргэлэн, Сум-Ард, Оточ
  // Манрамба, Гэсэр сүм, Хятадын шүтээн, Бурхан багшийн цэцэрлэг, Тахилтын даваа г.м) —
  // эдгээрт зориулсан бодит Wikipedia зураг олдоогүй тул "erdene" (Хархорин дахь Эрдэнэ
  // зуу хийд — өөр, 400км зайд орших ТОДОРХОЙ ондоо газар!) гэсэн буруу тодорхой мэдэгдэл
  // өгөхийн оронд Гандантэгчэнлин хийдийн бодит зургийг ерөнхий "УБ-ын Буддын хийд" төлөөлөл
  // болгон ашиглана — үнэн ч хамгийн тохирох, худал тодорхой мэдэгдэл биш.
  [["гандан", "хийд", "залбир", "шүтээн", "хөшөө", "будда", "сүм", "тахил", "овоо"], "gandanphoto", "Wikipedia CC"],
  [["богд уул", "уулд алх", "уулын", "аялал", "хайк", "даваа", "толгод"], "hiking", "Unsplash"],
  [["art", "үзэсгэлэн", "экспо"], "art", "Unsplash"],
  [["кино", "theatre", "кинотеатр", "шангри"], "cinema", "Unsplash"],
  [["кофешоп", "кафе", "café", "tom n", "stupa cafe", "coffee"], "coffee", "Unsplash"],
  [["internom", "ном", "библиотек"], "bookshop", "Unsplash"],
  [["жүжиг", "опера", "театр", "цирк"], "theater", "Unsplash"],
  [["ресторан", "хархорум 14", "цаатан", "гуанз", "кари"], "dinner", "Unsplash"],
  [["skybar", "sky bar", "шөнийн", "bar-т", " bar"], "bar", "Unsplash"],
  [["карао", "хөгжим", "дуу ", "jazz", "концерт"], "music", "Unsplash"],
  [["боулинг"], "bowling", "Unsplash"],
  [["ice", "гулгуур", "зимний"], "skating", "Unsplash"],
  [["spa", "массаж", "тайвшрал", "саун", "wellness"], "spa", "Unsplash"],
  [["парк", "зугаал", "алхалт", "цэцэрлэг", "хүрээлэн", "ногоон бүс", "эрэг", "гүүр"], "park", "Unsplash"],
  [["савлуур", "шавар"], "pottery", "Unsplash"],
  [["ёг", "yoga", "йог"], "yoga", "Unsplash"],
  [["мастер класс", "хоол хийх", "жигнэ"], "cooking", "Unsplash"],
  [["фитнес", "бэлтгэл", "гүйлт", "бокс", "cross-fit"], "fitness", "Unsplash"],
  [["усан спорт", "усан мотоцикл"], "kayak", "Wikipedia CC"],
  [["board game", "тоглоом", "тоглох", "vr "], "boardgame", "Unsplash"],
  [["хос", "байгаль", "гэрэл зураг"], "couple", "Unsplash"],
];

// idea.title-аас тохирох зургийг оноох. Аль ч дүрэм тохирохгүй бол category-гоор
// нөөц зураг сонгоно (category заавал биш) — ингэснээр 365 идея бүр зурагтай харагдана.
function getIdeaImg(title, category) {
  const t = title.toLowerCase();
  for (const [triggers, imgKey, src] of IDEA_IMG_RULES) {
    if (triggers.some(k => t.includes(k))) return {u: IMG[imgKey], s: src};
  }
  if (category && CATEGORY_FALLBACK_IMG[category]) return CATEGORY_FALLBACK_IMG[category];
  return {u: IMG.couple, s: "Unsplash"};
}

// idea-ийн байршил (location badge + Google Maps query) -аа title/desc/feeling дэх бодит
// газрын нэр, venue, эсвэл title-д шууд бичигдсэн дүүргээс тодорхойлно — index%9 гэх мэт
// санамсаргүй эргэлтээс ОГТ хамаарахгүй тул badge, map хоёр үргэлж зөрөхгүй нийцнэ.
// mapQuery === null бол зураг зураг (map) огт харуулахгүй — ямар ч бодит газар тодорхойгүй
// (гэрийн болзоо, хувийн үйл явдал гэх мэт) идэяд зохиомол байршил зохиохгүй.
const HOME_TRIGGERS = [
  [["гэртээ"], "Гэртээ"],
  [["гэрт лаа", "гэрт романтик", "гэрийн террас", "гэрийн тавилга", "гэрийн буузны", "гэр цэвэрлэ"], "Гэртээ"],
  [["орон сууцны дээвэр"], "Гэрийнхээ дээвэр дээр"],
  [["цонхны дэргэд"], "Гэртээ"],
  [["100 шалтгааны хайрцаг", "тусгай гэгээтэй гайхшруулах", "time capsule", "гэрэл зургийн хайрцаган дотор", "bucket list", "гэр бүлийн зургийн цомгоо", "марафон", "оддын зураг бэлэглэх", "drone-оор хамт видео", "хосын гар хээ", "хосын дуртай хөгжмийн жагсаалт", "хосын ирээдүйн зорилго", "хосын зан чанарын тест", "талархлын дэвтэр", "хосын нэрэмжит одон"], "Тэдэнд тохиромжтой хаана ч"],
  [["анхны танилцсан газраа"], "Тэдний онцгой дурсамжит газар"],
  [["шинэ хот, дүүрэг судлах", "нар мандахыг хамт харах", "хур борооны дараа", "цасан хүн барих", "хиймэл шувуу хөөрүүлэх", "тэнгэрт хийсэх бөмбөлөг"], "Аль ч тохиромжтой газар"],
  [["гэрийн эргэн тойрны"], "Хорооллын дундаа"],
  [["цагаан сарын зочлолт"], "Гэртээ / төрөл төрөгсдийн гэрт"],
  [["хотын гэрэлтсэн шөнийн харагдац"], "Өндөр цэгээс хотын харагдац"],
];

const LOCATION_RULES = [
// ---- TIER A: well-known real UB landmarks / geography (exact, high confidence) ----
[["зайсан"], "УБ · Зайсан толгой", "Zaisan Memorial, Ulaanbaatar"],
[["сүхбаатарын талбай", "сүхбаатарын хөшөө"], "УБ · Сүхбаатарын талбай", "Sukhbaatar Square (Chinggis Square), Ulaanbaatar"],
[["явуухулан"], "УБ · Б.Явуухулангийн парк", "B. Yavuukhulan Park, Ulaanbaatar"],
[["найрамдал парк", "найрамдалын парк", "найрамдал паркт", "найрамдал паркийн", "зөгийн бал музей"], "УБ · Найрамдал парк", "Nairamdal Park (National Amusement Park), Ulaanbaatar"],
[["ботаникийн цэцэрлэг"], "УБ · Үндэсний ботаникийн цэцэрлэг", "National Botanical Garden, Ulaanbaatar"],
[["манзуширын хийд", "манзушир"], "УБ · Богд уул, Манзуширын хийдийн балгас", "Manzushir Monastery ruins, Bogd Khan Mountain, Ulaanbaatar"],
[["түвдийн даваа"], "УБ · Богд уул, Түвдийн даваа", "Tuvdiin Davaa, Bogd Khan Mountain, Ulaanbaatar"],
[["хандгайтын ам", "хандгайт"], "УБ · Богд уул, Хандгайтын ам", "Khandgait Valley, Bogd Khan Mountain, Ulaanbaatar"],
[["богдын хаалганаас", "богдын хаалга", "тэрэлжийн зам"], "УБ · Богдын хаалга (Тэрэлж чиглэл)", "Bogd Khaalga, Terelj road, Ulaanbaatar"],
[["богд уулын ар тал", "богд уул", "богд ууланд тахил"], "УБ · Богд уулын дархан цаазат газар", "Bogd Khan Mountain, Ulaanbaatar"],
[["тэрэлж"], "Тэрэлжийн байгалийн цогцолборт", "Gorkhi-Terelj National Park"],
[["туулын хөндий", "туул гол", "туулын эрэг", "аварга гүүр"], "УБ · Туул голын эрэг", "Tuul River, Ulaanbaatar"],
[["чингисийн хүрээлэнгийн ногоон бүс"], "УБ · Чингисийн хүрээлэнгийн ногоон бүс", "Chinggis Khaan area green zone, Ulaanbaatar"],
[["хүннү мол"], "УБ · Хүннү Молл орчим", "Khunnu Mall, Ulaanbaatar"],
[["улиастайн давaa", "улиастайн даваа"], "УБ · Улиастайн даваа", "Uliastai Davaa, Ulaanbaatar"],
[["хужирбулан"], "Хужирбулан (хотын ойролцоо)", "Khujirbulan, Ulaanbaatar"],
[["сансрын хүрээлэн"], "УБ · Сансрын хүрээлэнгийн орчим", "Geophysics Research Institute area, Ulaanbaatar"],
[["тахилтын даваа"], "УБ · Тахилтын даваа", "Takhiltyn Davaa, Ulaanbaatar"],
[["20-р хоро"], "УБ · 20-р хороолол", "20th khoroolol, Ulaanbaatar"],
[["найман овоо"], "УБ · Найман овоо", "Naiman Ovoo, Ulaanbaatar"],
[["энхтайваны гүүр"], "УБ · Энхтайваны гүүр", "Enkhtaivan Bridge, Ulaanbaatar"],
[["мижид жанрайсэг", "гандан"], "УБ · Гандантэгчэнлин хийд", "Gandantegchinlen Monastery, Ulaanbaatar"],
[["дашчойлин"], "УБ · Дашчойлин хийд", "Dashchoilin Monastery, Ulaanbaatar"],
[["дамбадаржаа"], "УБ · Дамбадаржаа хийд", "Dambadarjaa Monastery, Ulaanbaatar"],
[["сум-ард"], "Багахангай · Сум-Ард хийд", "Sum Ard Monastery, Bagakhangai, Ulaanbaatar"],
[["оточ манрамб"], "УБ · Оточ Манрамбын хийд", "Otoch Manramba Monastery, Ulaanbaatar"],
[["төв шүтээний сүм"], "УБ · Төв шүтээний сүм", "Central Buddhist Temple, Ulaanbaatar"],
[["далай эжийн хийд"], "УБ · Далай эжийн хийд", "Dalai Eej Monastery, Ulaanbaatar"],
[["сэргэлэн хийд"], "УБ · Сэргэлэн хийд", "Sergelen Monastery, Ulaanbaatar"],
[["богдын өвлийн ордон"], "УБ · Богдын өвлийн ордон музей", "Bogd Khaan Winter Palace Museum, Ulaanbaatar"],
[["чойжин ламын музей"], "УБ · Чойжин Ламын музей", "Choijin Lama Temple Museum, Ulaanbaatar"],
[["чингисийн музей"], "УБ · Чингис хааны үндэсний музей", "Chinggis Khaan National Museum, Ulaanbaatar"],
[["чингисийн талбайн музей", "засгийн ордны музей"], "УБ · Засгийн газрын ордон", "Government Palace, Sukhbaatar Square, Ulaanbaatar"],
[["бурхан багшийн цэцэрлэг"], "УБ · Бурхан Багшийн цэцэрлэг", "Buddha Park, Ulaanbaatar"],
[["хятадын тахилын шүтээн"], "УБ · Хятад ястны шүтээний өргөө", "Chinese temple, Ulaanbaatar"],
[["анхны шашны музей"], "УБ · Шашны түүхийн музей", "Museum of Religion, Ulaanbaatar"],
[["1921 оны хувьсгалын музей"], "УБ · 1921 оны хувьсгалын музей", "1921 Revolution Museum, Ulaanbaatar"],
[["улаанбаатар хотын түүхийн музей", "улаанбаатар хотын музей"], "УБ · Улаанбаатар хотын музей", "Ulaanbaatar City Museum, Ulaanbaatar"],
[["хэлмэгдэгсдийн музей"], "УБ · Улс төрийн хэлмэгдэгсдийн музей", "Museum of Victims of Political Persecution, Ulaanbaatar"],
[["байгалийн түүхийн музей", "үлэг гүрвэл"], "УБ · Байгалийн түүхийн музей", "Mongolian Natural History Museum, Ulaanbaatar"],
[["үндэсний түүхийн музей"], "УБ · Монголын үндэсний түүхийн музей", "National Museum of Mongolia, Ulaanbaatar"],
[["занабазар"], "УБ · Занабазарын дүрслэх урлагийн музей", "Zanabazar Museum of Fine Arts, Ulaanbaatar"],
[["976 art gallery"], "УБ · 976 Art Gallery", "976 Art Gallery, Ulaanbaatar"],
[["улаан-од галерей"], "УБ · Улаан-Од галерей", "Red Ger Art Gallery, Ulaanbaatar"],
[["ардын урлалын музей"], "УБ · Ардын урлалын музей", "Mongolian Arts and Crafts Museum, Ulaanbaatar"],
[["монгол костюм музей"], "УБ · Монгол костюм музей", "Mongolian Costume Museum, Ulaanbaatar"],
[["философийн музей"], "УБ · Философийн музей", "Philosophy Museum, Ulaanbaatar"],
[["шуудангийн музей"], "УБ · Шуудангийн музей", "Postal Museum, Ulaanbaatar"],
[["мөнгөний музей", "зоос музей"], "УБ · Мөнгөний музей", "Money Museum, Ulaanbaatar"],
[["face gallery"], "УБ · Face Gallery", "Face Gallery, Ulaanbaatar"],
[["мон-тайп"], "УБ · Мон-Тайп үсгийн музей", "Mongolian script museum, Ulaanbaatar"],
[["ботаникийн музей"], "УБ · Ботаникийн музей", "Botanical Museum, Ulaanbaatar"],
[["play gallery"], "УБ · Play Gallery", "Play Gallery, Ulaanbaatar"],
[["онгоцны музей"], "УБ · Онгоцны музей", "Aviation Museum, Ulaanbaatar"],
[["жуковын өргөн чөлөө"], "УБ · Жуковын өргөн чөлөө", "Zhukov Avenue, Ulaanbaatar"],
[["энхтайваны өргөн чөлөө", "энхтайван"], "УБ · Энхтайваны өргөн чөлөө", "Enkhtaivan Avenue, Ulaanbaatar"],
[["гэсэр сүм"], "УБ · Гэсэр сүм", "Geser Temple, Ulaanbaatar"],
[["mcs плаза"], "УБ · MCS Плаза", "MCS Plaza, Ulaanbaatar"],
[["толгойт"], "УБ · Толгойт", "Tolgoit, Ulaanbaatar"],
[["яармаг"], "УБ · Яармаг", "Yarmag, Ulaanbaatar"],
[["их сургуулийн гудамж"], "УБ · Их сургуулийн гудамж", "National University street, Ulaanbaatar"],
[["нисэхийн гудамж"], "УБ · Нисэхийн гудамж", "Niseh street, Ulaanbaatar"],
[["урт цагаан"], "УБ · Урт цагааны гудамж", "Urtcagaan street, Ulaanbaatar"],
[["blue sky tower"], "УБ · Blue Sky Tower", "Blue Sky Tower, Ulaanbaatar"],
[["central tower"], "УБ · Central Tower", "Central Tower, Ulaanbaatar"],
[["sky resort", "snowboard"], "УБ · Sky Resort (Богд уулын хормой)", "Sky Resort, Ulaanbaatar"],
[["зимний парк", "ice skating"], "УБ · Зимний парк", "Zimniy Park ice rink, Ulaanbaatar"],
[["шонхор кампус"], "УБ · Шонхор кампусын парк", "Shonkhor campus park, Ulaanbaatar"],
[["эв нэгдлийн хүрээлэн"], "УБ · Эв нэгдлийн хүрээлэнгийн парк", "Ev Negdel park, Ulaanbaatar"],
[["үндэсний номын сан", "номын сангийн уншлагын"], "УБ · Монголын үндэсний номын сан", "National Library of Mongolia, Ulaanbaatar"],
[["нүүрсний уурхайн музей"], "Налайх · Нүүрсний уурхайн музей", "Nalaikh coal mine museum, Ulaanbaatar"],
[["100 айл"], "УБ · 100 айлын парк", "100 ail park, Ulaanbaatar"],
[["наадамын бөх", "бөхийн барилдаан"], "УБ · Төв цэнгэлдэх хүрээлэн", "National Sports Stadium, Ulaanbaatar"],

// ---- TIER A2: generic river references (Tuul is UB's defining river) ----
[["голын эрэг", "гол дагуу", "голын дагуу", "гол дээр", "каяк", "sup борд", "тэнгисийн эрэг", "тэнгисийн зам", "тэнгисийн гол"], "УБ · Туул голын эрэг", "Tuul River, Ulaanbaatar"],

// ---- TIER B: district literally named in the title (extracted verbatim — always accurate).
// Titles use the genitive form "X дүүргийн" (e.g. "Хан-Уул дүүргийн"), so triggers match that
// inflected stem, not the bare nominative "дүүрэг" which never actually appears in the text. ----
[["баянгол дүүргийн"], "УБ · Баянгол дүүрэг", "Bayangol district, Ulaanbaatar"],
[["багахангай дүүргийн"], "УБ · Багахангай дүүрэг", "Bagakhangai district, Ulaanbaatar"],
[["баянзүрх дүүргийн"], "УБ · Баянзүрх дүүрэг", "Bayanzurkh district, Ulaanbaatar"],
[["налайх дүүргийн"], "УБ · Налайх дүүрэг", "Nalaikh district, Ulaanbaatar"],
[["багануур дүүргийн"], "УБ · Багануур дүүрэг", "Baganuur district, Ulaanbaatar"],
[["сонгинохайрхан дүүргийн"], "УБ · Сонгинохайрхан дүүрэг", "Songinokhairkhan district, Ulaanbaatar"],
[["хан-уул дүүргийн"], "УБ · Хан-Уул дүүрэг", "Khan-Uul district, Ulaanbaatar"],
[["сүхбаатар дүүргийн"], "УБ · Сүхбаатар дүүрэг", "Sukhbaatar district, Ulaanbaatar"],
[["чингэлтэй дүүргийн"], "УБ · Чингэлтэй дүүрэг", "Chingeltei district, Ulaanbaatar"],
[["13-р хоро"], "УБ · 13-р хороолол", "13th khoroolol, Ulaanbaatar"],

// ---- TIER C: real named venues (use the venue's own name — Google resolves the address,
// so no district needs to be guessed) ----
[["café camino", "camino"], "УБ · Café Camino", "Cafe Camino, Ulaanbaatar"],
[["caffe bene"], "УБ · Caffe Bene", "Caffe Bene, Ulaanbaatar"],
[["tom n toms"], "УБ · Tom N Toms Coffee", "Tom N Toms Coffee, Ulaanbaatar"],
[["internom"], "УБ · Internom номын дэлгүүр", "Internom bookstore, Ulaanbaatar"],
[["café du monde"], "УБ · Café du Monde маягийн кафе", "French cafe, Ulaanbaatar"],
[["хархорум 14"], "УБ · Хархорум 14", "Kharkhorum 14 restaurant, Ulaanbaatar"],
[["skybar mongolia", "skybar"], "УБ · Skybar Mongolia", "Skybar Mongolia, Ulaanbaatar"],
[["цаатан ресторан"], "УБ · Цаатан ресторан", "Tsaatan restaurant, Ulaanbaatar"],
[["mongolyrics"], "УБ · Mongolyrics ресторан", "Mongolyrics restaurant, Ulaanbaatar"],
[["arig anya"], "УБ · Arig Anya ресторан", "Arig Anya restaurant, Ulaanbaatar"],
[["the bull hot pot"], "УБ · The Bull Hot Pot", "The Bull Hot Pot, Ulaanbaatar"],
[["modern nomads"], "УБ · Modern Nomads", "Modern Nomads restaurant, Ulaanbaatar"],
[["veranda"], "УБ · Veranda ресторан", "Veranda restaurant, Ulaanbaatar"],
[["rosewood kitchen"], "УБ · Rosewood Kitchen + Enoteca", "Rosewood Kitchen Enoteca, Ulaanbaatar"],
[["route 22"], "УБ · Route 22 гастробар", "Route 22 gastrobar, Ulaanbaatar"],
[["fat cat jazz club", "fat cat"], "УБ · Fat Cat Jazz Club", "Fat Cat Jazz Club, Ulaanbaatar"],
[["upaint studio", "upaint"], "УБ · Upaint Studio", "Upaint Studio, Ulaanbaatar"],
[["shangri-la"], "УБ · Shangri-La Centre", "Shangri-La Centre, Ulaanbaatar"],
[["mongolian theatre"], "УБ · Монголын Үндэсний театр", "Mongolian National Theatre, Ulaanbaatar"],
[["mongolian opera", "удэт"], "УБ · Улсын дуурь бүжгийн эрдмийн театр", "State Opera and Ballet Theatre, Ulaanbaatar"],
[["үндэсний циркийн"], "УБ · Улсын цирк", "Mongolian State Circus, Ulaanbaatar"],
[["хүүхэлдэйн театр"], "УБ · Хүүхэлдэйн театр", "Puppet Theatre, Ulaanbaatar"],
[["симфони найрал хөгжим", "филармони"], "УБ · Улсын филармони", "Mongolian State Philharmonic, Ulaanbaatar"],
[["soyol wellness"], "УБ · Soyol Wellness Center", "Soyol Wellness Center, Ulaanbaatar"],
[["park bowling"], "УБ · Park Bowling", "Park Bowling, Ulaanbaatar"],

// ---- TIER D: broad category words -> honest category search (not a fabricated address,
// a live Google Maps search for that kind of place near Ulaanbaatar) ----
[["кафе", "coffee", "кофе", "матча", "espresso", "cafe"], "УБ · Кафе", "Cafe, Ulaanbaatar"],
[["ресторан", "гуанз", "restaurant", "hot pot", "барбекю", "стейк", "рамен", "фо ", "кебаб", "пицца", "dim sum", "далайн хоол", "буррито", "хачапури", "паст", "бургер", "гриль", "салат", "бууз", "кари", "halal", "тайландын том яамны", "дегустаци", "нэг жилийн ойгоо тэмдэглэх"], "УБ · Ресторан", "Restaurant, Ulaanbaatar"],
[["амттан", "торт", "зайрмаг", "brunch", "waffle", "cheesecake", "печени", "bubble tea", "креп", "macaron", "донат", "churros", "honey house"], "УБ · Амттангийн газар", "Dessert cafe, Ulaanbaatar"],
[["кино театр", "кино клуб", "кино наадам"], "УБ · Кино театр", "Cinema, Ulaanbaatar"],
[["боулинг"], "УБ · Боулингийн төв", "Bowling, Ulaanbaatar"],
[["escape room"], "УБ · Escape room", "Escape room, Ulaanbaatar"],
[["vr тоглоом"], "УБ · VR тоглоомын төв", "VR gaming center, Ulaanbaatar"],
[["трамплин"], "УБ · Трамплин парк", "Trampoline park, Ulaanbaatar"],
[["картинг"], "УБ · Картингийн зам", "Karting track, Ulaanbaatar"],
[["билльярд"], "УБ · Билльярдын клуб", "Billiards club, Ulaanbaatar"],
[["дартс"], "УБ · Дартсны бар", "Darts bar, Ulaanbaatar"],
[["ширээний теннис"], "УБ · Ширээний теннисний клуб", "Table tennis club, Ulaanbaatar"],
[["лазер таг"], "УБ · Лазер таг", "Laser tag, Ulaanbaatar"],
[["пейнтбол"], "УБ · Пейнтболын талбай", "Paintball field, Ulaanbaatar"],
[["аркад тоглоом"], "УБ · Аркад тоглоомын төв", "Arcade, Ulaanbaatar"],
[["cat cafe"], "УБ · Cat Cafe", "Cat cafe, Ulaanbaatar"],
[["board game", "куб-тоглоом", "тоглоомын өрөөнд", "карт тоглох"], "УБ · Board game кафе", "Board game cafe, Ulaanbaatar"],
[["trivia"], "УБ · Trivia шөнийн бар", "Trivia night bar, Ulaanbaatar"],
[["speed dating"], "УБ · Speed dating venue", "Speed dating event venue, Ulaanbaatar"],
[["индор голфын симулятор", "гольф симулятор"], "УБ · Гольф симулятор", "Golf simulator, Ulaanbaatar"],
[["мини-гольф"], "УБ · Мини-гольфын талбай", "Mini golf, Ulaanbaatar"],
[["spa", "спа", "массаж", "саун", "флоат спа", "нүүрний арчилгаа"], "УБ · Спа төв", "Spa, Ulaanbaatar"],
[["йогийн студи", "йога"], "УБ · Йогийн студи", "Yoga studio, Ulaanbaatar"],
[["медитацийн төв"], "УБ · Медитацийн төв", "Meditation center, Ulaanbaatar"],
[["каяк", "усан спорт", "усан мотоцикл"], "УБ · Туул голын эрэг", "Tuul River water sports, Ulaanbaatar"],
[["цанаар гулгах"], "УБ · Цанын бааз", "Ski resort, Ulaanbaatar"],
[["авиралтын хана", "climbing"], "УБ · Авиралтын танхим", "Climbing gym, Ulaanbaatar"],
[["морь унах"], "УБ · Морин спортын клуб", "Horse riding club, Ulaanbaatar"],
[["сур харваа"], "УБ · Сур харваа сургалт", "Archery range, Ulaanbaatar"],
[["усан бассейн"], "УБ · Усан бассейн", "Swimming pool, Ulaanbaatar"],
[["фитнес клуб", "cross-fit"], "УБ · Фитнес клуб", "Fitness club, Ulaanbaatar"],
[["бокс клуб"], "УБ · Боксын клуб", "Boxing club, Ulaanbaatar"],
[["skateboard"], "УБ · Скэйтбордын парк", "Skate park, Ulaanbaatar"],
[["хоккей"], "УБ · Мөсөн хоккейн талбай", "Ice hockey rink, Ulaanbaatar"],
[["сагсан бөмбөг"], "УБ · Сагсан бөмбөгийн заал", "Basketball arena, Ulaanbaatar"],
[["бадминтон", "бадьминтон", "бадьмингтон"], "УБ · Бадминтоны клуб", "Badminton club, Ulaanbaatar"],
[["теннисний клуб"], "УБ · Теннисний клуб", "Tennis club, Ulaanbaatar"],
[["хөл бөмбөг"], "УБ · Хөл бөмбөгийн талбай", "Football field, Ulaanbaatar"],
[["уулын дугуй", "mountain bike"], "УБ · Богд уулын дугуйн зам", "Mountain bike trail, Bogd Khan Mountain, Ulaanbaatar"],
[["марафон"], "УБ · Гүйлтийн зам", "Running route, Ulaanbaatar"],
[["слэклайн"], "УБ · Цэцэрлэгт хүрээлэн", "City park, Ulaanbaatar"],
[["фрисби"], "УБ · Цэцэрлэгт хүрээлэн", "City park, Ulaanbaatar"],
[["хөвөгч усан онгоц"], "УБ · Туул голын эрэг", "Tuul River, Ulaanbaatar"],
[["гар барианы клуб", "arm wrestling"], "УБ · Гар барианы клуб", "Arm wrestling club, Ulaanbaatar"],
[["волейбол"], "УБ · Волейболын клуб", "Volleyball club, Ulaanbaatar"],
[["хөлбөмбөгийн симулятор", "foosball"], "УБ · Foosball бар", "Foosball bar, Ulaanbaatar"],
[["явган аялалын клуб"], "УБ · Явган аялалын клуб", "Hiking club, Ulaanbaatar"],
[["gymnastic", "гимнастик"], "УБ · Гимнастикийн клуб", "Gymnastics club, Ulaanbaatar"],
[["дугуйгаар хотын гудамж"], "УБ хотын гудамж (дугуйн зам)", "Cycling route, Ulaanbaatar"],
[["спорт заалны"], "УБ · Спорт заал", "Sports hall, Ulaanbaatar"],
[["татуировка"], "УБ · Тату студи", "Tattoo studio, Ulaanbaatar"],
[["аутдор упражнение"], "УБ · Нээлттэй фитнес талбай", "Outdoor fitness area, Ulaanbaatar"],
[["ном унших клуб"], "УБ · Номын клуб", "Book club venue, Ulaanbaatar"],
[["их дэлгүүр"], "УБ · Улсын их дэлгүүр", "State Department Store, Ulaanbaatar"],
[["наран тууль"], "УБ · Наран Туул зах", "Naran Tuul market, Ulaanbaatar"],
[["гар урлалын зах", "гар урлалын дэлгүүр", "гар урлалын материал"], "УБ · Гар урлалын зах", "Handicraft market, Ulaanbaatar"],
[["виниль дэлгүүр"], "УБ · Виниль дэлгүүр", "Vinyl record shop, Ulaanbaatar"],
[["vintage clothing"], "УБ · Vintage clothing дэлгүүр", "Vintage clothing shop, Ulaanbaatar"],
[["номын дэлгүүр"], "УБ · Номын дэлгүүр", "Bookstore, Ulaanbaatar"],
[["органик зах"], "УБ · Органик зах", "Organic market, Ulaanbaatar"],
[["загварын шоу-руум"], "УБ · Загварын шоу-рум", "Fashion showroom, Ulaanbaatar"],
[["ikea"], "УБ · Гэр ахуйн бараа дэлгүүр", "Home goods store, Ulaanbaatar"],
[["үнэртний дэлгүүр", "perfume"], "УБ · Үнэртний дэлгүүр", "Perfume boutique, Ulaanbaatar"],
[["rooftop bar", "дээвэр дээрх"], "УБ · Rooftop bar", "Rooftop bar, Ulaanbaatar"],
[["wine bar", "дарсны амталгаа", "дарс амтлах", "дарсны цуглуулга"], "УБ · Wine bar", "Wine bar, Ulaanbaatar"],
[["speakeasy"], "УБ · Speakeasy бар", "Speakeasy bar, Ulaanbaatar"],
[["караоке"], "УБ · Караоке", "Karaoke, Ulaanbaatar"],
[["live music бар"], "УБ · Live music бар", "Live music bar, Ulaanbaatar"],
[["cocktail making", "коктейл"], "УБ · Cocktail bar", "Cocktail bar, Ulaanbaatar"],
[["салса бүжиг"], "УБ · Бүжгийн клуб", "Dance club, Ulaanbaatar"],
[["beer garden", "шар айраг"], "УБ · Beer garden", "Beer garden, Ulaanbaatar"],
[["night market"], "УБ · Шөнийн зах", "Night market, Ulaanbaatar"],
[["терраса бар"], "УБ · Терраса бар", "Terrace bar, Ulaanbaatar"],
[["dj тоглолт", "клубт бүжиглэх"], "УБ · Клуб", "Nightclub, Ulaanbaatar"],
[["whisky bar"], "УБ · Whisky bar", "Whisky bar, Ulaanbaatar"],
[["cinema bar"], "УБ · Cinema bar", "Cinema bar, Ulaanbaatar"],
[["party-д оролцох"], "УБ · Тематик party", "Themed party venue, Ulaanbaatar"],
[["шавар савлуур", "керамик урлал"], "УБ · Керамикийн студи", "Ceramics studio, Ulaanbaatar"],
[["хоолны мастер класс", "гурил боловсруулах", "бэйкинг"], "УБ · Хоолны студи", "Cooking class, Ulaanbaatar"],
[["зурах + дарс", "paint & wine"], "УБ · Upaint Studio", "Paint and wine studio, Ulaanbaatar"],
[["гэрэл зургийн студи"], "УБ · Гэрэл зургийн студи", "Photo studio, Ulaanbaatar"],
[["дарс хийх мастер класс"], "УБ · Дарс хийх студи", "Winemaking class, Ulaanbaatar"],
[["каллиграфи"], "УБ · Каллиграфийн студи", "Calligraphy class, Ulaanbaatar"],
[["соёолж", "bonsai"], "УБ · Ботаникийн студи", "Bonsai studio, Ulaanbaatar"],
[["танго бүж"], "УБ · Бүжгийн студи", "Tango dance studio, Ulaanbaatar"],
[["кино хийх workshop"], "УБ · Кино студи", "Filmmaking workshop, Ulaanbaatar"],
[["chocolate making"], "УБ · Шоколадны студи", "Chocolate making class, Ulaanbaatar"],
[["нэхмэл"], "УБ · Нэхмэлийн студи", "Weaving studio, Ulaanbaatar"],
[["латте art"], "УБ · Латте арт сургалт", "Latte art class, Ulaanbaatar"],
[["оригами"], "УБ · Урлалын студи", "Craft studio, Ulaanbaatar"],
[["лаа хийх"], "УБ · Лаа хийх студи", "Candle making studio, Ulaanbaatar"],
[["сабон хийх", "шампунь"], "УБ · Гар хийцийн студи", "Soap making studio, Ulaanbaatar"],
[["хар цагаан лаборатори"], "УБ · Фото лаборатори", "Darkroom photo lab, Ulaanbaatar"],
[["скульптур"], "УБ · Урлагийн студи", "Sculpture studio, Ulaanbaatar"],
[["импровизаци", "impro comedy"], "УБ · Театрын студи", "Improv theatre, Ulaanbaatar"],
[["комеди клуб", "стэндап"], "УБ · Комеди клуб", "Comedy club, Ulaanbaatar"],
[["fashion show"], "УБ · Загварын үзэсгэлэн", "Fashion show venue, Ulaanbaatar"],
[["уран зохиолын үдэшлэг"], "УБ · Номын клуб", "Literary event, Ulaanbaatar"],
[["rock концерт"], "УБ · Концертын танхим", "Concert hall, Ulaanbaatar"],
[["инди кино"], "УБ · Инди кино театр", "Independent cinema, Ulaanbaatar"],
[["агаарын бөмбөлгөн"], "УБ · Агаарын бөмбөлгөний нислэг", "Hot air balloon ride, Ulaanbaatar"],
[["гэрэлт чимэглэлийн үзэсгэлэн"], "УБ · Гэрэлт чимэглэлийн үзэсгэлэн", "Winter lights exhibition, Ulaanbaatar"],
[["жимс түүх ферм"], "УБ орчмын жимсний ферм", "Fruit picking farm near Ulaanbaatar"],
[["silent disco"], "УБ · Silent disco", "Silent disco event, Ulaanbaatar"],
[["хотын зах зээлээр", "хотын зах"], "УБ · Орон нутгийн зах", "Local market, Ulaanbaatar"],
[["street art", "гудамжны урлаг"], "УБ хотын төв", "Street art, Ulaanbaatar"],
[["усан оргилуур", "фонтан"], "УБ хотын төв · Фонтан талбай", "Fountain square, Ulaanbaatar city center"],
[["мөсөн дээр загас"], "УБ орчмын загасчлалын газар", "Ice fishing spot near Ulaanbaatar"],
[["christmas market"], "УБ · Christmas market", "Christmas market, Ulaanbaatar"],
[["мөсөн баримал"], "УБ · Мөсөн баримлын үзэсгэлэн", "Ice sculpture exhibition, Ulaanbaatar"],
[["кофены наадам"], "УБ · Кофены наадам", "Coffee festival, Ulaanbaatar"],
[["хүнсний машины наадам", "food truck"], "УБ · Food truck festival", "Food truck festival, Ulaanbaatar"],
[["цэцгийн наадам"], "УБ · Цэцгийн наадам", "Flower festival, Ulaanbaatar"],
[["тансаг зочид буудал", "staycation", "зочид буудлын өрөөнд"], "УБ · Тансаг зочид буудал", "Hotel, Ulaanbaatar"],
[["үндэсний костюмтой зураг", "дээл өмсөж"], "УБ · Гэрэл зургийн студи", "Traditional costume photo studio, Ulaanbaatar"],
[["робот үзэсгэлэн"], "УБ · Технологийн үзэсгэлэн", "Technology exhibition, Ulaanbaatar"],
[["үндэсний паркаар"], "УБ · Цэцэрлэгт хүрээлэн", "City park, Ulaanbaatar"],
[["асаны шёрюугийн цэцэрлэг"], "УБ · Орон нутгийн цэцэрлэгт хүрээлэн", "Neighborhood park, Ulaanbaatar"],
[["хорооллын ойт цэцэрлэг"], "УБ · Хорооллын ойт цэцэрлэг", "Neighborhood forested park, Ulaanbaatar"],
[["шинэ парк газраар"], "УБ · Шинэ хотхоны ногоон бүс", "New district green zone, Ulaanbaatar"],
[["5-р цэцэрлэгт хүрээлэн"], "УБ · 5-р цэцэрлэгт хүрээлэн", "5th micro-district park, Ulaanbaatar"],
];

// title/desc/feeling бүгдээс тохирох газрыг хайна (олон санааны бодит газар нь title биш
// desc/feeling-д байдаг тул). Match олдохгүй бол зохиомол дүүрэг зохиохгүй, ерөнхий "Улаанбаатар
// хот" + map-гүй болно.
function getIdeaLocation(title, desc, feeling) {
  const t = (title + " " + (desc||"") + " " + (feeling||"")).toLowerCase();
  for (const [triggers, label] of HOME_TRIGGERS) {
    if (triggers.some(k => t.includes(k))) return { label, mapQuery: null };
  }
  for (const [triggers, label, mapQuery] of LOCATION_RULES) {
    if (triggers.some(k => t.includes(k))) return { label, mapQuery };
  }
  return { label: "Улаанбаатар хот", mapQuery: null };
}

// "Юу авч явах вэ?" — очих газрын ТӨРЛӨӨС хамаарсан packing list (пикник, ууланд алхах,
// усан спорт, музей/кино, гар урлал гэх мэт), ганц идея бүрт биш category-аар бүлэглэсэн.
// Кафе/ресторан/гэрийн идея зэрэгт заавал зүйл санал болгохгүй — хоосон массив буцаана.
const ITEMS_RULES = [
  [["майхан барьж хонох", "нэг өдрийн аялал"], ["Ус", "Тав тухтай алхалтын гутал", "Дулаан хувцас", "Унтлагын уут", "Гар чийдэн", "Powerbank"]],
  [["пикник"], ["Пикникийн дэвсгэр", "Ус/ундаа", "Хөнгөн зууш", "Нойтон/хуурай салфетка", "Хогийн уут", "Нарны тос"]],
  [["цанаар гулгах", "snowboard", "ice skating", "гулгуур", "мөсөн дээр загас", "мөсөн баримал", "цасан хүн"], ["Дулаан хувцас, куртка", "Бээлий", "Малгай, шарф", "Дулаан оймс", "Халуун ундаа (термос)"]],
  [["богд уул", "тэрэлж", "авирах", "алхах", "толгод", "өндөрлөг", "давaa", "даваа", "ойт хэсэг", "уулын бэлд", "уулын хормой", "уулаар аялах"], ["Ус", "Тав тухтай алхалтын гутал", "Нарны тос", "Малгай", "Жижиг үүргэвч", "Powerbank"]],
  [["каяк", "sup борд", "усан спорт", "усан мотоцикл", "хөвөгч усан онгоц", "завиар", "загас барих"], ["Сэлэлгийн хувцас", "Алчуур", "Нарны тос", "Солих хувцас", "Ус"]],
  [["фитнес", "бокс клуб", "cross-fit", "теннис", "бадминтон", "хөл бөмбөг", "волейбол", "скейтборд", "skateboard", "climbing", "авиралтын хана", "гар барианы", "гимнастик", "trampoline", "морь унах", "сур харваа", "дугуй", "уралдах", "картинг", "хоккей"], ["Тав тухтай спорт хувцас, гутал", "Ус", "Алчуур"]],
  [["музей", "кино", "театр", "дуурь", "цирк", "тайз", "концерт", "үзэсгэлэн", "наадам", "фестиваль", "жүжиг", "шоу"], ["Тасалбар/захиалгаа баталгаажуулах", "Утас", "Powerbank"]],
  [["хичээл", "мастер класс", "студид", "сургалт", "workshop"], ["Тав тухтай хувцас (бохирдож болзошгүй)", "Урьдчилан цаг захиалах"]],
  [["spa", "спа", "массаж", "саун", "флоат"], ["Сэлгэх хувцас", "Ус уух сав"]],
  [["дэлгүүр", "зах", "shopping", "mall"], ["Бэлэн мөнгө/карт", "Эко уут"]],
  [["тансаг", "skybar", "дегустаци", "chef's tasting", "veranda", "rooftop"], ["Ширээ урьдчилан захиалах"]],
  [["хийд", "сүм", "шүтээн", "тахил", "залбир", "овоо", "мөргөл"], ["Тав тухтай, даруухан хувцас", "Гутлаа хялбар тайлж болохоор", "Жижиг мөнгө (тахил өргөх бол)", "Утас"]],
  [["парк", "цэцэрлэг", "гүүр", "эрэг", "алхах", "зугаал", "гудамж", "хүрээлэн"], ["Тав тухтай гутал", "Ус", "Powerbank"]],
  [["гэрэл зураг", "галерей", "дурсгалт"], ["Утас/камер", "Powerbank"]],
];

// Хамгийн сүүлчийн, ерөнхий "гарч явахад хэрэгтэй" жагсаалт — зөвхөн idea-д бодит очих газар
// (mapQuery) байгаа тохиолдолд ашиглана; гэрийн/тодорхойгүй үйл явдалд юу ч санал болгохгүй.
const DEFAULT_OUTING_ITEMS = ["Утас", "Powerbank", "Бэлэн мөнгө/карт"];

function getIdeaItems(title, desc, feeling, hasVenue) {
  const t = (title + " " + (desc||"") + " " + (feeling||"")).toLowerCase();
  for (const [triggers, items] of ITEMS_RULES) {
    if (triggers.some(k => t.includes(k))) return items;
  }
  return hasVenue ? DEFAULT_OUTING_ITEMS : [];
}

function imgTag(url, credit, cls, style) {
  const cred = credit === "Wikipedia CC"
    ? `<span class="card-img-credit">© Wikipedia CC</span>`
    : `<span class="card-img-credit">Unsplash</span>`;
  return `<img src="${url}" loading="lazy" alt="" class="${cls||''}" style="${style||''}" onerror="this.parentNode.removeChild(this)">${cred}`;
}

// Google Maps — API key шаардахгүй энгийн embed + шинэ tab-д нээх холбоос.
// query нь газрын нэр (жишээ: "Тэрхийн цагаан нуур, Архангай").
function mapEmbedHtml(query) {
  const q = encodeURIComponent(query + " Монгол");
  return `
    <div class="map-embed-wrap">
      <iframe src="https://www.google.com/maps?q=${q}&output=embed" loading="lazy" style="width:100%;height:220px;border:0;border-radius:10px;display:block;" allowfullscreen title="${query} — газрын зураг"></iframe>
      <a href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener" class="map-open-link">🗺 Google Maps дээр нээх →</a>
    </div>`;
}

// YouTube — тодорхой видео ID биш ХАЙЛТЫН холбоос ашиглана (movies.js-ийн trailer линктэй ижил арга барил),
// учир нь тодорхой video ID хугацааны явцад устах/хаагдах эрсдэлтэй, харин хайлтын холбоос үргэлж ажиллана.
function youtubeSearchHtml(query, label) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  return `<a href="${url}" target="_blank" rel="noopener" class="youtube-search-link">▶ ${label || "YouTube-с жишээ бичлэг үзэх"}</a>`;
}

// Кино/аймаг/хуудас бүр өөрийн HTML файл, өөрийн URL-тай тул
// navigate() зүгээр л тухайн файл руу шилждэг (жинхэнэ browser navigation).
const NAV_FILE_MAP = { home: "index.html", "aimag-detail": "aimags.html" };
function navigate(page, param) {
  const file = NAV_FILE_MAP[page] || page + ".html";
  if (param === undefined || param === null || param === "") { location.href = file; return; }
  const key = page === "expert" ? "section" : "id";
  location.href = file + "?" + key + "=" + encodeURIComponent(param);
}

// Зураг ачаалахад алдаа гарвал (эвдэрсэн URL, сервер унтарсан г.м) нэг удаа ерөнхий
// нөөц зураг руу автоматаар шилжинэ; тэр ч бас ачаалахгүй бол зургийг арилгана.
function imgFallback(el) {
  if (el.dataset.fallbackDone) { el.remove(); return; }
  el.dataset.fallbackDone = "1";
  el.src = IMG.couple;
}

function renderCard(idea) {
  const isLiked = userLikes.has(idea.id);
  const imgInfo = getIdeaImg(idea.title, idea.category);
  const badge = idea.day === 1
    ? '<div class="card-badge gold" style="z-index:3">⭐ Шинэ жил</div>'
    : '';
  const imageContent = imgInfo
    ? `<img src="${imgInfo.u}" loading="lazy" alt="${idea.title}" class="card-bg-img" onerror="imgFallback(this)">
       <div class="card-img-overlay"></div>
       <span class="card-emoji-over">${idea.emoji}</span>
       <span class="card-img-credit">${imgInfo.s==="Wikipedia CC"?"© Wikipedia CC":"Unsplash"}</span>`
    : idea.emoji;
  return `
    <div class="card" onclick="openIdeaModal(${idea.id})">
      <div class="card-image" style="background: ${getColor(idea.id)}; overflow:hidden;">
        ${imageContent}
        ${badge}
      </div>
      <div class="card-body">
        <div class="card-day">📅 ${idea.day}-р өдөр</div>
        <div class="card-location">${idea.location}</div>
        <div class="card-title">${idea.title}</div>
        <div class="card-desc">${idea.desc}</div>
        <div class="card-feeling">💝 ${idea.feeling.substring(0, 80)}...</div>
        <div class="card-footer">
          <span class="card-price">${idea.priceText}</span>
          <span class="card-likes ${isLiked?'liked':''}" onclick="event.stopPropagation();toggleLike(${idea.id})">
            ${isLiked?'❤️':'🤍'} ${idea.likes + (isLiked?1:0)}
          </span>
        </div>
      </div>
    </div>`;
}

function openIdeaModal(id) {
  const idea = allUbIdeas.find(i => i.id === id);
  if(!idea) return;
  const imgInfo = getIdeaImg(idea.title, idea.category);
  const isLiked = userLikes.has(idea.id);
  const imgHtml = imgInfo
    ? `<div class="modal-image" style="background:${getColor(idea.id)};position:relative;overflow:hidden;padding:0;">
        <img src="${imgInfo.u}" loading="lazy" alt="${idea.title}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="imgFallback(this)">
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.2);"></div>
        <span style="position:relative;z-index:1;font-size:56px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.5));">${idea.emoji}</span>
        <span class="card-img-credit" style="z-index:2;">${imgInfo.s==="Wikipedia CC"?"© Wikipedia CC":"Unsplash"}</span>
      </div>`
    : `<div class="modal-image" style="background:${getColor(idea.id)}">${idea.emoji}</div>`;
  document.getElementById("modalContent").innerHTML = `
    <div class="modal-header">
      <h2 style="font-size: 20px;">${idea.title}</h2>
      <button class="modal-close" onclick="closeModal()" type="button" aria-label="Хаах">×</button>
    </div>
    <div class="modal-body">
      ${imgHtml}
      <div class="modal-meta">
        <div class="modal-meta-item">📅 <strong>${idea.day}-р өдөр</strong></div>
        <div class="modal-meta-item">📍 <strong>${idea.location}</strong></div>
        <div class="modal-meta-item">💸 <strong>${idea.priceText}</strong></div>
        <div class="modal-meta-item">❤️ <strong>${idea.likes + (isLiked?1:0)}</strong></div>
      </div>
      ${idea.mapQuery ? mapEmbedHtml(idea.mapQuery) : ''}
      <p style="margin-bottom: 16px; line-height: 1.7;">${idea.desc}</p>
      <div class="feeling-box">
        <h4>💝 Энэ болзоонд танд төрөх мэдрэмж:</h4>
        <p>${idea.feeling}</p>
      </div>
      ${idea.items && idea.items.length ? `
      <div class="items-box">
        <h4>🎒 Очихдоо юу авч явах вэ?</h4>
        <ul>${idea.items.map(it => `<li>${it}</li>`).join('')}</ul>
      </div>` : ''}
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn ${isLiked?'btn-accent':'btn-primary'}" style="flex:1;min-width:120px" type="button" onclick="toggleLike(${idea.id});this.className='btn ${isLiked?'btn-primary':'btn-accent'}';this.textContent='${isLiked?'🤍 Хадгалах':'❤️ Хадгалсан'}'">
          ${isLiked?'❤️ Хадгалсан':'🤍 Хадгалах'}
        </button>
        <button class="btn btn-ghost" style="flex:1;min-width:120px" type="button" onclick="shareIdea('${idea.title.replace(/'/g,'').replace(/"/g,'')}', ${idea.id})">🔗 Хуваалцах</button>
      </div>
    </div>`;
  document.getElementById("modal").classList.add("show");
}

function closeModal() { document.getElementById("modal").classList.remove("show"); }

function openBookingModal(ideaId, customTitle) {
  const idea = ideaId ? allUbIdeas.find(i => i.id === ideaId) : null;
  const title = customTitle || (idea ? idea.title : "Болзооны захиалга");
  const price = idea ? idea.priceText : "Тохиролцоогоор";
  document.getElementById("modalContent").innerHTML = `
    <div class="modal-header">
      <h3>📅 Захиалга — ${title}</h3>
      <button class="modal-close" onclick="closeModal()" type="button" aria-label="Хаах">×</button>
    </div>
    <div class="modal-body">
      <p style="color:var(--text-light);font-size:13px;margin-bottom:16px;">Доорх мэдээллийг бөглөснөөр манай баг 24 цагийн дотор холбоо барина.</p>
      <div class="booking-form">
        <input type="text" id="bkName" placeholder="Таны нэр *" required>
        <input type="tel" id="bkPhone" placeholder="Утасны дугаар * (+976)" required>
        <input type="email" id="bkEmail" placeholder="И-мэйл хаяг">
        <input type="date" id="bkDate" min="${new Date().toISOString().split('T')[0]}">
        <select id="bkPeople">
          <option value="2">2 хүн (хос)</option>
          <option value="3">3 хүн</option>
          <option value="4">4 хүн (хосуудын бүлэг)</option>
        </select>
        <textarea id="bkNote" placeholder="Нэмэлт тайлбар (тусгай хүсэлт гэх мэт)..." rows="2"></textarea>
        <div style="background:var(--primary-extra-soft);padding:10px 14px;border-radius:8px;font-size:13px;">
          💰 Ойролцоо зардал: <strong>${price}</strong>
        </div>
        <button class="btn btn-primary" type="button" onclick="submitBooking('${title.replace(/'/g,'')}')">✅ Захиалга илгээх</button>
      </div>
    </div>`;
  document.getElementById("modal").classList.add("show");
}

function submitBooking(title) {
  const name = document.getElementById("bkName")?.value.trim();
  const phone = document.getElementById("bkPhone")?.value.trim();
  if(!name || !phone) return showToast("⚠️ Нэр болон утасны дугаараа оруулна уу");
  document.getElementById("modalContent").innerHTML = `
    <div class="modal-header">
      <h3>✅ Захиалга амжилттай</h3>
      <button class="modal-close" onclick="closeModal()" type="button" aria-label="Хаах">×</button>
    </div>
    <div class="modal-body">
      <div class="booking-success">
        <span class="tick">🎉</span>
        <h3 style="font-size:20px;margin-bottom:8px;">Баярлалаа, ${name}!</h3>
        <p style="color:var(--text-light);margin-bottom:16px;font-size:14px;">
          <strong>${title}</strong> болзооны захиалга бүртгэгдлээ.<br>
          Бид 24 цагийн дотор <strong>${phone}</strong> дугаарт залгана.
        </p>
        <div style="background:var(--primary-extra-soft);padding:14px;border-radius:10px;font-size:13px;text-align:left;">
          📱 WhatsApp/Viber-ээр мессеж илгээж болно<br>
          📧 info@nbolzoo.mn-д имэйл илгээж болно
        </div>
        <button class="btn btn-primary" style="margin-top:16px;width:100%" type="button" onclick="closeModal()">Хаах</button>
      </div>
    </div>`;
  showToast("🎉 Захиалга амжилттай илгээгдлээ!");
}

function shareIdea(title, id) {
  const url = `${window.location.origin}${window.location.pathname}${id ? '#idea-'+id : ''}`;
  const text = `NBolzoo — ${title} 💕\n${url}`;
  if(navigator.share) {
    navigator.share({title: 'NBolzoo', text: title, url}).catch(()=>{});
  } else if(navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast("🔗 Холбоос хуулагдлаа!")).catch(()=>{});
  } else {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta);
    ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
    showToast("🔗 Холбоос хуулагдлаа!");
  }
}

async function toggleLike(id) {
  // Нэвтрээгүй хэрэглэгчид "амжилттай хадгаллаа" гэсэн худал мессеж үзүүлж болохгүй —
  // Firestore рүү бичихгүй тул refresh хиймэгц алга болно. Тиймээс эхлээд нэвтрэхийг санал болгоно.
  if (!currentUser) {
    showToast("Хадгалах боломжтой болгохын тулд нэвтэрнэ үү.");
    if (typeof openAuth === "function") openAuth("login");
    return;
  }
  const wasLiked = userLikes.has(id);
  if(wasLiked) { userLikes.delete(id); showToast("🤍 Хадгалсан санаанаас хасагдлаа"); }
  else { userLikes.add(id); showToast("❤️ Хадгалсан санаанд нэмэгдлээ"); }
  // Page бүр зөвхөн өөрийн container-тай тул тухайн element байгаа эсэхээр шалгана
  // (олон page нэг DOM дотор хамт байдаг байсан хуучин SPA-ийн арга барил биш).
  if(document.getElementById("ubGrid")) renderUbIdeas();
  if(document.getElementById("featuredGrid")) renderFeatured();
  if(document.getElementById("savedGrid")) renderSaved();

  if (currentUser && db) {
    const savedId = currentUser.uid + "_" + id;
    try {
      if (wasLiked) {
        await db.collection("saved").doc(savedId).delete();
      } else {
        const idea = (typeof allUbIdeas !== "undefined") ? allUbIdeas.find(i => i.id === id) : null;
        await db.collection("saved").doc(savedId).set({
          uid: currentUser.uid, ideaId: id, ideaTitle: idea ? idea.title : "",
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch(e) { console.warn("saved sync error:", e); }
  }
}

function performSearch() {
  const q = document.getElementById("searchInput").value.toLowerCase();
  if(!q) return showToast("Хайх үг оруулна уу");
  const ubResults = allUbIdeas.filter(i => i.title.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q) || i.location.toLowerCase().includes(q));
  const aimagResults = aimagsClean.filter(a => a.name.toLowerCase().includes(q));
  showToast(`🔍 "${q}" - ${ubResults.length + aimagResults.length} үр дүн олдлоо`);
  if(ubResults.length > 0) {
    navigate('ub');
    setTimeout(() => {
      document.getElementById("ubGrid").innerHTML = ubResults.slice(0,12).map(renderCard).join("");
      document.getElementById("ubPagination").innerHTML = `<span style="padding: 8px 14px; color: var(--text-light);">"${q}" гэсэн хайлтаар ${ubResults.length} санаа олдлоо</span>`;
    }, 300);
  }
}

document.querySelectorAll('[data-ub-filter]').forEach(c => {
  c.addEventListener("click", e => {
    document.querySelectorAll('[data-ub-filter]').forEach(x => x.classList.remove("active"));
    e.target.classList.add("active");
    currentUbFilter = e.target.dataset.ubFilter;
    currentPage = 1;
    renderUbIdeas();
  });
});

document.querySelectorAll('[data-region]').forEach(c => {
  c.addEventListener("click", e => {
    document.querySelectorAll('[data-region]').forEach(x => x.classList.remove("active"));
    e.target.classList.add("active");
    currentRegion = e.target.dataset.region;
    renderAimags();
  });
});

// Cinema genre chips handled via onclick in HTML

// Бодит Firebase Authentication (Google/Email) нь js/auth.js файлд байгаа бөгөөд
// currentUser, openAuth, doAuth, logoutUser зэрэг бүгд тэнд тодорхойлогдоно.

function openMobileMenu() {
  document.getElementById("mobileNavDrawer").classList.add("open");
  document.getElementById("mobileOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeMobileMenu() {
  document.getElementById("mobileNavDrawer").classList.remove("open");
  document.getElementById("mobileOverlay").classList.remove("open");
  document.body.style.overflow = "";
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  if(existing) existing.remove();
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// Хэрэглэгчийн бичсэн текстийг innerHTML-д аюулгүй оруулахын тулд escape хийнэ (XSS сэргийлэлт).
// Мөн quote тэмдэгтийг escape хийдэг тул text node болон attribute (жишээ нь src="...") хоёрын
// аль алинд нь аюулгүй ашиглаж болно.
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ===== PWA: 100% сонголтоор апп суулгах (автомат prompt/popup ОГТ ҮГҮЙ) =====
// Chrome/Edge/Android "beforeinstallprompt" event-ийг үргэлж preventDefault() хийж browser-ийн
// автомат mini-infobar-ыг зогсооно; хэрэглэгч зөвхөн доорх "📲 Апп суулгах" товчийг ӨӨРӨӨ
// дарахад л bodит install prompt (invDeferredInstallPrompt.prompt()) дуудагдана. Энэ event
// огт garahagvi бол (Safari/iOS, аль хэдийн суулгасан, эсвэл installability criteria
// хангаагүй) — товч ЯМАР Ч НӨХЦӨЛД гарч ирэхгүй, сайт browser дээр өмнөх шигээ ажиллана.
let invDeferredInstallPrompt = null;

function pwaShowInstallButtons() {
  if (document.getElementById("pwaInstallBtn")) return; // давхардуулахгүй
  const navActions = document.querySelector(".nav-actions");
  if (navActions) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "pwaInstallBtn";
    btn.className = "btn btn-ghost";
    btn.style.cssText = "font-size:13px;padding:8px 12px;";
    btn.textContent = "📲 Апп суулгах";
    btn.onclick = pwaTriggerInstall;
    navActions.insertBefore(btn, navActions.firstChild);
  }
  const mobileActions = document.querySelector(".mobile-nav-actions");
  if (mobileActions) {
    const btn2 = document.createElement("button");
    btn2.type = "button";
    btn2.id = "pwaInstallBtnMobile";
    btn2.className = "btn btn-ghost";
    btn2.style.cssText = "width:100%;margin-top:8px;";
    btn2.textContent = "📲 Апп суулгах";
    btn2.onclick = pwaTriggerInstall;
    mobileActions.appendChild(btn2);
  }
}

function pwaHideInstallButtons() {
  const b1 = document.getElementById("pwaInstallBtn");
  if (b1) b1.remove();
  const b2 = document.getElementById("pwaInstallBtnMobile");
  if (b2) b2.remove();
}

async function pwaTriggerInstall() {
  if (!invDeferredInstallPrompt) return;
  invDeferredInstallPrompt.prompt();
  try { await invDeferredInstallPrompt.userChoice; } catch (e) { /* хэрэглэгч цуцалсан ч алдаа биш */ }
  invDeferredInstallPrompt = null;
  pwaHideInstallButtons();
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  invDeferredInstallPrompt = event;
  pwaShowInstallButtons();
});

window.addEventListener("appinstalled", () => {
  invDeferredInstallPrompt = null;
  pwaHideInstallButtons();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

