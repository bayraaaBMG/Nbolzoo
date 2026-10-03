// Үнэлгээний систем. ХАМГИЙН ЧУХАЛ ШАЛГАЛТ: зохиомол тоо, хуурамч үнэлгээ,
// "4.8 ★ (1,240)" гэх мэт санаанаасаа гаргасан өгөгдөл ОГТ байхгүй эсэх.
const fs = require('fs'), vm = require('vm');
let pass = 0, fail = 0;
const t = (n, ok, d) => { ok ? (pass++, console.log('  ok  ' + n)) : (fail++, console.log('  FAIL ' + n + (d ? ' -> ' + d : ''))); };

const src = fs.readFileSync('js/reviews.js', 'utf8');
const rules = fs.readFileSync('firestore.rules', 'utf8').split('\r\n').join('\n');

// --- 1. Зохиомол өгөгдөл байхгүй ---
t('no Math.random anywhere', !/Math\.random/.test(src));
t('no hardcoded rating numbers', !/(rating|average)\s*[:=]\s*[0-9]/.test(src));
t('no seeded/sample review array', !/sampleReview|fakeReview|demoReview|SEED/i.test(src));
t('empty state is stated honestly', /Хараахан үнэлгээ алга/.test(src));
t('average is null when there are no ratings', /average:\s*rated\.length\s*\?/.test(src));

// --- 2. Нэг хүн нэг удаа — дүрмээр албадсан эсэх ---
const block = rules.slice(rules.indexOf('match /ideaReviews/'), rules.indexOf('match /siteSettings/'));
t('rules exist for ideaReviews', block.length > 0);
t('doc id is uid_ideaId (one review per person)', /reviewId == request\.auth\.uid \+ '_' \+ string\(request\.resource\.data\.ideaId\)/.test(block));
t('rating must be an int', /rating is int/.test(block));
t('rating is bounded 1..5', /rating >= 1 && request\.resource\.data\.rating <= 5/.test(block));
t('text length is capped', /text\.size\(\) <= 500/.test(block));
t('author cannot set the hidden flag', /!\('hidden' in request\.resource\.data\)/.test(block));
t('author cannot change hidden on update', /hasAny\(\['hidden', 'uid', 'ideaId'\]\)/.test(block));
t('staff may change ONLY hidden', /isAdmin\(\) && request\.resource\.data\.diff\(resource\.data\)\.affectedKeys\(\)\.hasOnly\(\['hidden'\]\)/.test(block));
t('banned users cannot review', /!isBanned\(\)/.test(block));
t('owner or admin+ may delete', /resource\.data\.uid == request\.auth\.uid \|\| isStaffAtLeastAdmin\(\)/.test(block));

// --- 3. Нуусан үнэлгээ дундажид ОРОХГҮЙ ---
t('hidden reviews are filtered out', /filter\(r => !r\.hidden\)/.test(src));
t('only valid ratings count toward the average', /rating >= 1 && r\.rating <= REVIEW_STARS/.test(src));

// --- 4. XSS ---
t('review text is escaped', /escapeHtml\(r\.text\)/.test(src));
t('reviewer name is escaped', /escapeHtml\(r\.name/.test(src));
t('own review text is escaped', /escapeHtml\(data\.mine\.text\)/.test(src));

// --- 5. Дундаж тооцоолох логик бодитоор зөв эсэх ---
const ctx = { console: { log() {}, warn() {} }, Math, Date, JSON, Set, Map,
  document: { getElementById: () => null }, currentUser: null, db: null };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(src + '\n;this.REVIEW_STARS=REVIEW_STARS;this.starsHtml=starsHtml;', ctx);
t('REVIEW_STARS is 5', ctx.REVIEW_STARS === 5);
t('starsHtml renders 5 stars', (ctx.starsHtml(3, false, 1).match(/★/g) || []).length === 5);
t('starsHtml marks the right number lit', (ctx.starsHtml(3, false, 1).match(/class="star on"/g) || []).length === 3);
t('starsHtml with null lights none', (ctx.starsHtml(null, false, 1).match(/class="star on"/g) || []).length === 0);
t('interactive stars are buttons with labels', /aria-label="\d од"/.test(ctx.starsHtml(0, true, 1)));

// --- 6. Admin модерац ---
const admin = fs.readFileSync('js/admin.js', 'utf8');
t('admin can hide a review', /adminToggleReviewHidden/.test(admin));
t('admin delete is permission-gated', /nbCan\("moderation\.delete"\)[\s\S]{0,400}adminDeleteReview|adminDeleteReview[\s\S]{0,200}nbCan\("moderation\.delete"\)/.test(admin));
t('review actions are logged', /review_hide|review_delete/.test(admin));
t('reviews tab is registered', /id: "reviews"/.test(admin));

// --- 7. Хуудсанд холбогдсон эсэх ---
['index.html', 'ub.html', 'saved.html', 'aimags.html'].forEach(p => {
  t('reviews.js loaded on ' + p, fs.readFileSync(p, 'utf8').includes('js/reviews.js'));
});
t('modal has a review slot', /ideaReviewSlot/.test(fs.readFileSync('js/core.js', 'utf8')));

console.log('\nreviews: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
