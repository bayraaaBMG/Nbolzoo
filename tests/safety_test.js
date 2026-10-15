// Нийгэмлэгийн аюулгүй байдал: мэдэгдэх (report) + хаах (block).
//
// Report нь АДМИНД хандана — шийдвэр гартал хугацаа шаардана.
// Block нь ХЭРЭГЛЭГЧ ӨӨРӨӨ шууд авах арга хэмжээ. Хоёулаа хэрэгтэй.
const fs = require('fs');
let pass = 0, fail = 0;
const t = (n, ok, d) => { ok ? (pass++, console.log('  ok  ' + n)) : (fail++, console.log('  FAIL ' + n + (d ? ' -> ' + d : ''))); };

const comm = fs.readFileSync('js/community.js', 'utf8');
const rules = fs.readFileSync('firestore.rules', 'utf8').split('\r\n').join('\n');
const auth = fs.readFileSync('js/auth.js', 'utf8');

// --- Мэдэгдэх ---
t('report modal exists', /function openReportModal/.test(comm));
t('posts can be reported', /openReportModal\('post'/.test(comm));
t('comments can be reported', /openReportModal\('comment'/.test(comm));
t('reports are stored for admin triage', /collection\("reports"\)/.test(comm));
t('you cannot report your own post', /!isOwn\) \? `<div class="post-action" onclick="openReportModal\('post'/.test(comm));

// --- Хаах ---
t('blockUser exists', /function blockUser/.test(comm));
t('unblockUser exists', /function unblockUser/.test(comm));
t('block list is viewable', /function renderBlockedList/.test(comm));
t('block is reachable from the report modal', /blockUser\('\$\{targetAuthorId\}'\)/.test(comm));
t('block is reachable from the profile', /renderBlockedList\(\)/.test(auth));
t('blocks load on sign-in', /loadBlockedUsers/.test(auth));
t('you cannot block yourself', /targetUid === currentUser\.uid\) return/.test(comm));
t('blocking asks for confirmation', /confirm\(`\$\{targetName/.test(comm));

// --- Хаалт БОДИТООР үйлчилдэг эсэх ---
t('blocked authors are filtered from the feed', /!isBlocked\(p\.authorId\)/.test(comm));
t('blocked authors are filtered from comments', /!isBlocked\(c\.authorId\)/.test(comm));
t('feed refreshes right after blocking', /blockedSet\.add\(targetUid\);[\s\S]{0,160}loadPosts\(\)/.test(comm));

// --- Дүрэм ---
const blockBlock = rules.slice(rules.indexOf('match /blocks/'), rules.indexOf('match /ideaReviews/'));
t('blocks collection has rules', blockBlock.length > 0);
t('only the owner reads their blocks', /allow read: if isSignedIn\(\) && resource\.data\.uid == request\.auth\.uid/.test(blockBlock));
t('doc id prevents duplicate blocks', /blockId == request\.auth\.uid \+ '_' \+ request\.resource\.data\.targetUid/.test(blockBlock));
t('self-blocking is rejected at the rules layer', /targetUid != request\.auth\.uid/.test(blockBlock));
t('blocks cannot be edited', /allow update: if false/.test(blockBlock));
t('only the owner can unblock', /allow delete: if isSignedIn\(\) && resource\.data\.uid == request\.auth\.uid/.test(blockBlock));

// --- Хоосон төлөв: дараагийн алхам санал болгодог эсэх ---
t('community empty states use the rich helper', /emptyState\(/.test(comm));
t('community empty states suggest next steps', /Бүх нийтлэл үзэх|Санаа хайх/.test(comm));
const svc = fs.readFileSync('js/services.js', 'utf8');
t('services empty states use the rich helper', /emptyState\(/.test(svc));
t('services empty state offers registration', /Үйлчилгээ бүртгүүлэх/.test(svc));

// --- Брэндийн нэгдмэл байдал: киноны хуудас ---
const css = fs.readFileSync('css/style.css', 'utf8');
const cine = css.slice(css.indexOf('.cinema-page {'), css.indexOf('/* Keep genre-tag'));
t('cinema page no longer hardcodes a dark background', !/#0d0d1a/i.test(cine));
t('cinema page no longer uses the off-brand gold', !/#e2b714/i.test(cine));
t('cinema page uses theme variables', (cine.match(/var\(--/g) || []).length > 40);
['js/movies.js', 'movies.html'].forEach(f => {
  t('no inline cinema gold in ' + f, !/e2b714/i.test(fs.readFileSync(f, 'utf8')));
});

console.log('\nsafety + consistency: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
