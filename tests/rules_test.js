// Security rules-ийг Firebase emulator-гүйгээр шалгах хязгаартай боловч утга учиртай
// шалгалтууд: бүтэц зөв эсэх, шинэ collection бүр хамрагдсан эсэх, устгах/хориглох
// эрхийг moderator-т ОЛГОХГҮЙ байгаа эсэх, frontend матриц болон rules зөрөөгүй эсэх.
// ЭНЭ НЬ БОДИТ ДҮРМИЙН ТЕСТ БИШ — эмулятор дээр ажиллуулаагүй. Зөвхөн статик шалгалт.
const fs = require('fs');
let pass = 0, fail = 0;
function t(name, ok, detail) {
  if (ok) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? ' -> ' + detail : '')); }
}

// Файлууд Windows CRLF-тэй тул шалгахын өмнө мөрийн төгсгөлийг нэгтгэнэ —
// эс бөгөөс indexOf('{\n') зэрэг шалгалт худал сөрөг үр дүн өгнө.
const read = f => fs.readFileSync(f, 'utf8').split('\r\n').join('\n');
const fr = read('firestore.rules');
const sr = read('storage.rules');

// --- 1. Бүтцийн бүрэн бүтэн байдал ---
[['firestore.rules', fr], ['storage.rules', sr]].forEach(([n, s]) => {
  let d = 0, dip = 0;
  for (const c of s) { if (c === '{') d++; else if (c === '}') { d--; if (d < 0) dip++; } }
  t(n + ' braces balanced', d === 0 && dip === 0, 'depth=' + d);
  t(n + ' declares rules_version 2', /rules_version\s*=\s*'2'/.test(s));
});

// --- 2. Шинэ collection бүр дүрэмтэй ---
['contentOverrides', 'services', 'siteSettings', 'bannerEvents'].forEach(c => {
  t('firestore covers ' + c, new RegExp('match /' + c + '/').test(fr));
});
['services/{uid}', 'cms/'].forEach(p => {
  t('storage covers ' + p, sr.includes('match /' + p));
});

// --- 3. Role helper-үүд байгаа ---
['staffRole()', 'isStaffAtLeastAdmin()', 'isStaffOwner()', 'isModerator()'].forEach(f => {
  t('firestore defines ' + f, fr.includes('function ' + f));
});
t('storage defines isStaffAtLeastAdmin()', sr.includes('function isStaffAtLeastAdmin()'));

// --- 4. Устгах/хориглох эрх нь moderator-т БАЙХГҮЙ ---
function blockFor(name) {
  const i = fr.indexOf('match /' + name + '/');
  if (i < 0) return '';
  // match /posts/{postId} { ... } — замын доторх {postId} нь блокийн хаалт БИШ, тиймээс
  // мөрийн төгсгөлд байгаа нээх хаалтаас эхэлж тоолно.
  const open = fr.indexOf('{\n', i);
  if (open < 0) return '';
  let d = 0;
  for (let j = open; j < fr.length; j++) {
    if (fr[j] === '{') d++;
    else if (fr[j] === '}') { d--; if (d === 0) return fr.slice(i, j + 1); }
  }
  return fr.slice(i);
}

[['posts', 'delete'], ['comments', 'delete'], ['users', 'delete'], ['services', 'delete']].forEach(([col, op]) => {
  const b = blockFor(col);
  const line = (b.match(new RegExp('allow ' + op + ':[^;]*;')) || [''])[0];
  t(col + '.' + op + ' requires admin+', line.includes('isStaffAtLeastAdmin'), line.trim().slice(0, 90));
});
t('users.update (ban) requires admin+', /allow update: if isOwner\(uid\) \|\| \(isStaffAtLeastAdmin\(\)/.test(fr));

// --- 5. Moderator НУУХ эрхтэй үлдсэн ---
t('posts allows moderator hidden-only update', /isModerator\(\)[^;]*hasOnly\(\['hidden'\]\)/.test(blockFor('posts')));
t('comments hidden-toggle open to all staff', /allow update: if isAdmin\(\)[^;]*hasOnly\(\['hidden'\]\)/.test(blockFor('comments')));

// --- 6. Owner хамгаалалт хэвээр ---
t('owner doc can never be deleted', /resource\.data\.role != 'owner'/.test(fr));
t('owner email cannot be banned', /'bbayraaa20@gmail\.com' && request\.resource\.data\.banned == true/.test(fr));
t('admins in-place update still forbidden', /match \/admins\/\{uid\}[\s\S]*?allow update: if false/.test(fr));
t('admin cannot delete another admin', /staffRole\(\) == 'admin' && resource\.data\.role == 'moderator'/.test(blockFor('admins')));
t('admin cannot grant admin role', !/staffRole\(\) == 'admin'[^;]*role == 'admin'/.test(blockFor('admins')));

// --- 7. services нь өөрөө зөвшөөрөх боломжгүй ---
const svcBlock = blockFor('services');
t('service create forces status pending', /request\.resource\.data\.status == 'pending'/.test(svcBlock));
t('service owner cannot change own status', /request\.resource\.data\.status == resource\.data\.status/.test(svcBlock));
t('only approved services are public', /resource\.data\.status == 'approved'/.test(svcBlock));

// --- 8. bannerEvents нь зөвхөн нэмэгддэг ---
const beBlock = blockFor('bannerEvents');
t('bannerEvents is append-only', /allow update, delete: if false/.test(beBlock));
t('bannerEvents readable by staff only', /allow read: if isAdmin\(\)/.test(beBlock));

// --- 9. Frontend матриц болон rules зөрөөгүй эсэх ---
const roles = read('js/roles.js');
const modStart = roles.indexOf('moderator: [');
const modBlock = roles.slice(modStart, roles.indexOf(']', modStart));
[['content.edit', 'contentOverrides'], ['banners.manage', 'banners'], ['settings.theme', 'siteSettings']].forEach(([perm, col]) => {
  const inMatrix = modBlock.includes('"' + perm + '"');
  const block = blockFor(col);
  t('moderator lacks ' + perm + ' in BOTH layers',
    !inMatrix && block.includes('isStaffAtLeastAdmin'),
    'matrix=' + inMatrix + ' rules=' + block.includes('isStaffAtLeastAdmin'));
});

// --- 10. Owner email нь rules болон auth.js хооронд зөрөөгүй ---
const authSrc = read('js/auth.js');
const ruleEmail = (fr.match(/request\.auth\.token\.email == '([^']+)'/) || [])[1];
const authEmail = (authSrc.match(/OWNER_EMAIL\s*=\s*"([^"]+)"/) || [])[1];
t('owner email in sync between rules and auth.js', !!ruleEmail && ruleEmail === authEmail,
  'rules=' + ruleEmail + ' auth=' + authEmail);

console.log('\nrules (static checks only, NOT emulator-verified): ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
