function updateHeroStats() {
  const freeCount = allUbIdeas.filter(i => i.price === 0).length;
  const statNums = document.querySelectorAll(".hero-stat-num");
  if(statNums[0]) statNums[0].textContent = allUbIdeas.length + (aimagsClean.length * 9);
  if(statNums[1]) statNums[1].textContent = allUbIdeas.length;
  if(statNums[2]) statNums[2].textContent = aimagsClean.length;
  if(statNums[3]) statNums[3].textContent = aimagsClean.length * 9;
}

function renderFeatured() {
  const featured = allUbIdeas.slice(0, 8);
  document.getElementById("featuredGrid").innerHTML = featured.map(idea => renderCard(idea)).join("");
}

function renderFeaturedAimags() {
  const featured = aimagsClean.slice(0, 8);
  document.getElementById("featuredAimags").innerHTML = featured.map(renderAimagCard).join("");
}

function openRandomIdea() {
  const idea = allUbIdeas[Math.floor(Math.random() * allUbIdeas.length)];
  openIdeaModal(idea.id);
}

