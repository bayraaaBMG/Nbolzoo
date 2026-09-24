const fs = require('fs'), vm = require('vm');
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('js/roles.js', 'utf8'), ctx);

let pass = 0, fail = 0;
function t(name, got, want) {
  if (got === want) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('  FAIL ' + name + ' -> got ' + got + ', want ' + want); }
}
function as(role) { ctx.currentUser = role ? { adminRole: role, uid: 'u' } : null; }

// --- nbRole ---
as(null);        t('signed out -> no role', ctx.nbRole(), null);
ctx.currentUser = { uid: 'u', adminRole: null }; t('plain user -> no role', ctx.nbRole(), null);
ctx.currentUser = { uid: 'u', adminRole: 'hacker' }; t('bogus role rejected', ctx.nbRole(), null);
as('owner');     t('owner role', ctx.nbRole(), 'owner');
as('moderator'); t('moderator role', ctx.nbRole(), 'moderator');

// --- dashboard access ---
as(null);        t('signed out cannot open dashboard', ctx.nbCan('dashboard.view'), false);
as('moderator'); t('moderator can open dashboard', ctx.nbCan('dashboard.view'), true);

// --- MODERATOR: may hide, may NOT delete/ban/configure ---
as('moderator');
t('mod can hide content',        ctx.nbCan('moderation.hide'), true);
t('mod can see reports',         ctx.nbCan('moderation.reports'), true);
t('mod CANNOT delete content',   ctx.nbCan('moderation.delete'), false);
t('mod CANNOT ban users',        ctx.nbCan('users.ban'), false);
t('mod CANNOT edit content',     ctx.nbCan('content.edit'), false);
t('mod CANNOT hide CMS content', ctx.nbCan('content.hide'), false);
t('mod CANNOT manage banners',   ctx.nbCan('banners.manage'), false);
t('mod CANNOT review services',  ctx.nbCan('services.review'), false);
t('mod CANNOT change theme',     ctx.nbCan('settings.theme'), false);
t('mod CANNOT change nav',       ctx.nbCan('settings.navigation'), false);
t('mod CANNOT grant roles',      ctx.nbCan('roles.grant'), false);
t('mod may read users',          ctx.nbCan('users.read'), true);

// --- ADMIN ---
as('admin');
t('admin can delete content',    ctx.nbCan('moderation.delete'), true);
t('admin can ban',               ctx.nbCan('users.ban'), true);
t('admin can edit content',      ctx.nbCan('content.edit'), true);
t('admin can manage banners',    ctx.nbCan('banners.manage'), true);
t('admin can change theme',      ctx.nbCan('settings.theme'), true);
t('admin CANNOT delete users',   ctx.nbCan('users.delete'), false);
t('admin CANNOT grant admin',    ctx.nbCan('roles.grantAdmin'), false);

// --- OWNER ---
as('owner');
t('owner can delete users',      ctx.nbCan('users.delete'), true);
t('owner can grant admin',       ctx.nbCan('roles.grantAdmin'), true);

// --- role assignment hierarchy ---
as('owner');
t('owner may assign admin',      ctx.nbCanAssignRole('admin'), true);
t('owner may assign moderator',  ctx.nbCanAssignRole('moderator'), true);
t('owner may NOT assign owner',  ctx.nbCanAssignRole('owner'), false);
as('admin');
t('admin may assign moderator',  ctx.nbCanAssignRole('moderator'), true);
t('admin may NOT assign admin',  ctx.nbCanAssignRole('admin'), false);
t('admin may NOT assign owner',  ctx.nbCanAssignRole('owner'), false);
as('moderator');
t('mod may NOT assign anything', ctx.nbCanAssignRole('moderator'), false);
as(null);
t('signed out may NOT assign',   ctx.nbCanAssignRole('moderator'), false);

// --- who may manage whom (owner is untouchable by anyone) ---
as('owner');
t('owner cannot manage owner',   ctx.nbCanManageUserWithRole('owner'), false);
t('owner can manage admin',      ctx.nbCanManageUserWithRole('admin'), true);
t('owner can manage plain user', ctx.nbCanManageUserWithRole(null), true);
as('admin');
t('admin cannot manage owner',   ctx.nbCanManageUserWithRole('owner'), false);
t('admin cannot manage admin',   ctx.nbCanManageUserWithRole('admin'), false);
t('admin can manage moderator',  ctx.nbCanManageUserWithRole('moderator'), true);
t('admin can manage plain user', ctx.nbCanManageUserWithRole(null), true);
as('moderator');
t('mod cannot manage anyone',    ctx.nbCanManageUserWithRole(null), false);


// --- Admin UI нь эрхгүй товчийг зурахгүй байгаа эсэх (эх кодын шалгалт) ---
// "Дарахад л алдаа өгдөг" товч харуулах нь буруу UX бөгөөд эрхийн загварыг
// төөрөгдүүлнэ. Устгах бүх товч nbCan() -ийн ард байх ёстой.
const adminSrc = require('fs').readFileSync('js/admin.js', 'utf8');
[
  ['adminDeletePost', 'moderation.delete'],
  ['adminDeleteComment', 'moderation.delete'],
  ['adminDeleteBanner', 'banners.manage'],
  ['adminToggleBannerActive', 'banners.manage'],
].forEach(([fn, perm]) => {
  // Товчны мөрөөс өмнөх 400 тэмдэгтэд тохирох эрхийн шалгалт байх ёстой
  const i = adminSrc.indexOf('onclick="' + fn);
  const before = i > 0 ? adminSrc.slice(Math.max(0, i - 400), i) : '';
  const gated = /nbCan\(|canManage/.test(before);
  if (gated) { pass++; console.log('  ok  ' + fn + ' button is permission-gated'); }
  else { fail++; console.log('  FAIL ' + fn + ' button is NOT permission-gated'); }
});
console.log('\nroles (incl. UI gating): ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
