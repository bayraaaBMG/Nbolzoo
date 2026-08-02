function sendQuickReply(text) {
  document.getElementById("chatInput").value = text;
  sendMessage();
}

function sendMessage() {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if(!text) return;
  
  const messages = document.getElementById("chatMessages");
  document.querySelectorAll(".quick-replies").forEach(q => q.remove());
  
  messages.insertAdjacentHTML("beforeend", `<div class="message user">${text}</div>`);
  input.value = "";
  messages.scrollTop = messages.scrollHeight;
  
  setTimeout(() => {
    let response = "";
    let quickReplies = "";
    const lower = text.toLowerCase();

    if(lower.includes("ном") || lower.includes("дотогшоо") || lower.includes("тайван")) {
      response = "Тайван, оюуны хосуудад яг тохирох 3 санаа:<br><br>📚 <strong>Internom Premium</strong> — кофе ууж, ном сонгож уншсан хэсгээ хуваалцах (~40,000₮)<br>🎨 <strong>Чойжин ламын музей</strong> — соёлын гүнзгий яриатай болзоо (~30,000₮)<br>🌳 <strong>Богд уулын ар тал</strong> — ойн замаар алхаж, амилах (~20,000₮)<br><br>Та хэд хоносон хосоо юу?";
      quickReplies = `<div class="quick-replies"><div class="quick-reply" onclick="sendQuickReply('Шинэ танилцсан')">Шинэ танилцсан</div><div class="quick-reply" onclick="sendQuickReply('1 жил болсон')">1+ жил</div><div class="quick-reply" onclick="sendQuickReply('50,000₮ хүртэл төсөв')">Хямд газар хайж байна</div></div>`;
    } else if(lower.includes("аял") || lower.includes("гадагшаа") || lower.includes("байгаль")) {
      response = "Аяллын сонирхолтой хосуудад шилдэг санаа:<br><br>🏔 <strong>Хөвсгөл нуур</strong> — 3 хоног, мартагдашгүй (~200,000₮/хүн)<br>🏛 <strong>Хархорин + Эрдэнэ зуу</strong> — 2 хоног, түүхэн (~150,000₮/хүн)<br>🐎 <strong>Тэрэлж адууны аялал</strong> — 1 өдөр, адреналин (~80,000₮)<br>🌋 <strong>Хорго галт уул</strong> — Архангайн гайхамшиг<br><br>Аль аймаг руу явах сонирхолтой вэ?";
      quickReplies = `<div class="quick-replies"><div class="quick-reply" onclick="navigate('aimags');closeMobileMenu && closeMobileMenu()">21 аймаг үзэх →</div><div class="quick-reply" onclick="sendQuickReply('Архангай')">🏔 Архангай</div><div class="quick-reply" onclick="sendQuickReply('Хөвсгөл')">🌊 Хөвсгөл</div></div>`;
    } else if(lower.includes("урлаг") || lower.includes("бүтээлч") || lower.includes("зур")) {
      response = "Бүтээлч хосуудад онцгой санаа:<br><br>🎨 <strong>Шавар савлуурын дугаа</strong> — хосоор сав хийх (~80,000₮)<br>🖼 <strong>Зурах + дарс үдэш</strong> — Upaint Studio (~120,000₮)<br>🎭 <strong>Mongolian Theatre жүжиг</strong> — сонгодог (~80,000₮)<br>📸 <strong>Хосын гэрэл зургийн сесс</strong> — дурсамж (~150,000₮)<br><br>Хэзээ явах вэ?";
      quickReplies = `<div class="quick-replies"><div class="quick-reply" onclick="sendQuickReply('Энэ амралтын өдөр')">Амралтын өдөр</div><div class="quick-reply" onclick="sendQuickReply('Ажлын өдөр оройд')">Ажлын өдөр оройд</div></div>`;
    } else if(lower.includes("спорт") || lower.includes("идэвхтэй") || lower.includes("дугуй")) {
      response = "Идэвхтэй хосуудад зориулсан санаа:<br><br>⛸ <strong>Зимний паркт гулгуур</strong> — өвлийн хөгжилтэй (~25,000₮)<br>🚵 <strong>Богд уулын аялал</strong> — 2-3 цаг (~0₮)<br>🏊 <strong>Хосын усан спорт</strong> — (~90,000₮)<br>🐎 <strong>Тэрэлжийн адуу</strong> — мартагдашгүй (~180,000₮)<br>🎯 <strong>Archery болон лазер таг</strong> — (~60,000₮)";
      quickReplies = `<div class="quick-replies"><div class="quick-reply" onclick="navigate('ub')">УБ-ын санаа харах →</div></div>`;
    } else if(lower.includes("хоол") || lower.includes("ресторан") || lower.includes("кафе") || lower.includes("кофе")) {
      response = "УБ-ын хамгийн дурлагдсан ресторанууд:<br><br>🍷 <strong>Skybar Mongolia</strong> — шөнийн хотын тойм, романтик (~120,000₮)<br>🥩 <strong>Хархорум 14</strong> — жинхэнэ Монгол хоол (~90,000₮)<br>🎵 <strong>Mongolyrics</strong> — амьд хөгжим + хоол (~110,000₮)<br>☕ <strong>Internom + кофе</strong> — тайван, ном (~40,000₮)<br>🌿 <strong>Vegetarian ресторан</strong> — эрүүл (~70,000₮)";
      quickReplies = `<div class="quick-replies"><div class="quick-reply" onclick="sendQuickReply('Хямд газар хайж байна')">Хямд хоол</div><div class="quick-reply" onclick="sendQuickReply('Романтик ресторан хайж байна')">Романтик</div></div>`;
    } else if(lower.includes("шинэ танилцсан") || lower.includes("анхны болзоо") || lower.match(/\d+\s*сар/)) {
      response = "Анхны болзоонд хамгийн чухал зүйл — тайван орчин, ярих боломж.<br><br>✨ <strong>Кофе + парк</strong> — тайван, ярилцлагатай (~40,000₮)<br>🎨 <strong>Музей эсвэл үзэсгэлэн</strong> — ярих сэдэвтэй (~30,000₮)<br>🌳 <strong>Богд уулд алхах</strong> — байгальд тайван (~0₮)<br><br>⚠️ Анхны болзоонд 💡 зөвлөгөө: Ярих эсвэл сонсох аль ихийг хийх вэ?";
      quickReplies = `<div class="quick-replies"><div class="quick-reply" onclick="navigate('expert','mistakes')">7 алдааг мэдэх</div><div class="quick-reply" onclick="navigate('expert','checklist')">Болзооны жагсаалт</div></div>`;
    } else if(lower.includes("1 жил") || lower.includes("удаан") || lower.includes("ойрын")) {
      response = "Удаан хамт байсан хосуудад дурсамж сэргээх санаа:<br><br>🔄 <strong>Reset болзоо</strong> — шинэ газар, шинэ туршлага<br>❓ <strong>247 асуулт тоглоом</strong> — нэг нэгнийгээ дахин мэдэх<br>🎁 <strong>Бэлэг гайхшруулах</strong> — хүлээгдэхгүй байгаа зүйл<br>🌄 <strong>Аймаг руу аялах</strong> — хот орчноос алслах<br><br>Сүүлд хамт ямар сайхан юм хийсэн бэ?";
      quickReplies = `<div class="quick-replies"><div class="quick-reply" onclick="navigate('expert','reset')">Reset санаа харах</div><div class="quick-reply" onclick="navigate('gifts')">Бэлгийн санаа</div></div>`;
    } else if(lower.includes("50,000") || lower.includes("хямд") || lower.includes("үнэгүй")) {
      const freeIdeas = allUbIdeas.filter(i => i.price === 0).slice(0,3);
      const cheapIdeas = allUbIdeas.filter(i => i.price > 0 && i.price <= 50000).slice(0,3);
      response = `Хямд төсөвт тохирох шилдэг санаа:<br><br>🆓 <strong>Үнэгүй:</strong><br>${freeIdeas.map(i=>`• ${i.title}`).join("<br>")}<br><br>💸 <strong>50,000₮ хүртэл:</strong><br>${cheapIdeas.map(i=>`• ${i.title} (~${i.priceText})`).join("<br>")}`;
      quickReplies = `<div class="quick-replies"><div class="quick-reply" onclick="navigate('ub')">Бүх санаа харах →</div></div>`;
    } else if(lower.includes("100,000") || lower.includes("200,000")) {
      response = "Дунд зэрэг төсөвт тохирох шилдэг санаа:<br><br>🎨 <strong>Шавар савлуурын дугаа</strong> — 80,000₮<br>🎤 <strong>Mongolian Opera</strong> — 80,000₮<br>⛸ <strong>Зимний парк + хоол</strong> — 90,000₮<br>🎭 <strong>Theatre + dinner</strong> — 150,000₮<br>🏊 <strong>SPA + массаж</strong> — 200,000₮<br><br>Хэзээ явах вэ?";
    } else if(lower.includes("романтик") || lower.includes("гэнэтийн") || lower.includes("гайхшруул")) {
      response = "Хосыгоо гайхшруулах санаа:<br><br>🎈 <strong>Агаарын бөмбөлгөн нисэлт</strong> — мартагдашгүй (~400,000₮)<br>⭐ <strong>Оддын зураг бэлэглэх</strong> — анх уулзсан өдрийн тэнгэр (~80,000₮)<br>🕯 <strong>Гэрт тусгай гэгээтэй гайхшруулах</strong> — хямд<br>🌹 <strong>Дарс + сар харах</strong> — Зайсан (~80,000₮)<br>💌 <strong>100 шалтгааны хайрцаг</strong> — гар хийцийн бэлэг (~30,000₮)";
      quickReplies = `<div class="quick-replies"><div class="quick-reply" onclick="navigate('gifts')">Бэлгийн санаа →</div></div>`;
    } else {
      response = "Сонирхолтой! Та болон хосынхоо тухай илүү мэдье:<br><br>Хосоо юу хийхэд хамгийн их дуртай вэ?";
      quickReplies = `<div class="quick-replies"><div class="quick-reply" onclick="sendQuickReply('Гэртээ чимэглэлтэй, тайван')">🏠 Гэртээ</div><div class="quick-reply" onclick="sendQuickReply('Гадаа байгаль, идэвхтэй')">🌿 Гадаа</div><div class="quick-reply" onclick="sendQuickReply('Ресторан, хоол хүнс')">🍽 Хоол</div><div class="quick-reply" onclick="sendQuickReply('Аялал, шинэ газар')">✈ Аялал</div></div>`;
    }

    messages.insertAdjacentHTML("beforeend", `<div class="message ai">${response}</div>${quickReplies}`);
    messages.scrollTop = messages.scrollHeight;
  }, 600);
}
