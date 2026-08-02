function renderSaved() {
  const saved = allUbIdeas.filter(i => userLikes.has(i.id));
  const el = document.getElementById("savedGrid");
  if(!el) return;
  const loginNudge = !currentUser
    ? `<div class="saved-login-nudge" style="grid-column:1/-1;margin-bottom:16px;">
        🔒 Нэвтэрвэл хадгалсан санаанууд тань бүх төхөөрөмж дээр синк хийгдэнэ.
        <a onclick="openAuth('login')" style="cursor:pointer;text-decoration:underline;">Нэвтрэх</a>
      </div>`
    : "";
  if(saved.length === 0) {
    el.innerHTML = loginNudge + `<div class="saved-empty" style="grid-column:1/-1">
      <span class="icon">❤️</span>
      <h3>Хадгалсан санаа байхгүй байна</h3>
      <p>УБ 365 болон аймгийн санаануудаас ❤️ дарж хадгалаарай</p>
      <button class="btn btn-primary" style="margin-top:16px" onclick="navigate('ub')" type="button">365 санаа харах →</button>
    </div>`;
  } else {
    el.innerHTML = loginNudge + saved.map(idea => renderCard(idea)).join("");
  }
}

