const fs=require('fs'), vm=require('vm');
const ctx={console,db:null,currentUser:null,firebase:null};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('js/cms.js','utf8'),ctx);
const {cmsApply}=ctx;
let pass=0,fail=0;
function t(name,got,want){
  const g=JSON.stringify(got),w=JSON.stringify(want);
  if(g===w){pass++;console.log('  ok  '+name);}
  else{fail++;console.log('  FAIL '+name+'\n       got  '+g+'\n       want '+w);}
}
const base=[{id:1,title:'A'},{id:2,title:'B'},{id:3,title:'C'}];

t('no override = identity', cmsApply(base,null,'id'), base);
t('empty override = identity', cmsApply(base,{hidden:[],order:[],edits:{},added:[]},'id'), base);
t('hide one', cmsApply(base,{hidden:[2]},'id').map(x=>x.id), [1,3]);
t('hide by string id', cmsApply(base,{hidden:['2']},'id').map(x=>x.id), [1,3]);
t('edit field', cmsApply(base,{edits:{2:{title:'B2'}}},'id')[1].title, 'B2');
t('edit preserves other fields', cmsApply([{id:1,title:'A',desc:'d'}],{edits:{1:{title:'X'}}},'id')[0], {id:1,title:'A',desc:'d',title:'X'});
t('reorder pins to front', cmsApply(base,{order:[3,1]},'id').map(x=>x.id), [3,1,2]);
t('partial order keeps rest', cmsApply(base,{order:[2]},'id').map(x=>x.id), [2,1,3]);
t('added item appended', cmsApply(base,{added:[{id:9,title:'N'}]},'id').map(x=>x.id), [1,2,3,9]);
t('added overrides same id', cmsApply(base,{added:[{id:2,title:'REPLACED'}]},'id').find(x=>x.id===2).title, 'REPLACED');
t('added then hidden', cmsApply(base,{added:[{id:9}],hidden:[9]},'id').map(x=>x.id), [1,2,3]);
t('added then reordered', cmsApply(base,{added:[{id:9,title:'N'}],order:[9]},'id').map(x=>x.id), [9,1,2,3]);
t('combined all four', cmsApply(base,{added:[{id:9,title:'N'}],hidden:[1],edits:{2:{title:'E'}},order:[9,3]},'id').map(x=>x.id+':'+x.title), ['9:N','3:C','2:E']);
t('custom idKey', cmsApply([{day:1},{day:2}],{hidden:[1]},'day').map(x=>x.day), [2]);
t('input array not mutated', (()=>{const c=[{id:1},{id:2}];cmsApply(c,{hidden:[1],order:[2]},'id');return c.map(x=>x.id);})(), [1,2]);
t('malformed added ignored', cmsApply(base,{added:[null,{noId:1}]},'id').map(x=>x.id), [1,2,3]);
t('unknown order ids ignored', cmsApply(base,{order:[99]},'id').map(x=>x.id), [1,2,3]);
t('edits on hidden item is no-op', cmsApply(base,{hidden:[2],edits:{2:{title:'Z'}}},'id').map(x=>x.id), [1,3]);

console.log('\ncmsApply: '+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
