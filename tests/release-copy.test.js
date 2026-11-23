import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {build} from '../scripts/build.mjs';
import {copyOverrides,savedCopy} from '../site/copy-storage.js';
import {legacyCopy} from '../site/legacy-copy.js';
import {translations} from '../site/translations.js';
for(const lang of ['ko','en','ja'])test(`${lang}: old defaults update, actual edits survive`,()=>{
 const defaults={'hero-description':'New release description','hero-title':'New title'};
 const old={'hero-description':legacyCopy[lang]['hero-description'][0],'hero-title':'My custom title'};
 assert.deepEqual(copyOverrides(old,defaults,lang),{'hero-title':'My custom title'});
 const saved=savedCopy({...defaults,'hero-title':'My custom title'},defaults);
 assert.deepEqual(saved,{version:2,overrides:{'hero-title':'My custom title'}});
 assert.deepEqual(copyOverrides(saved,{...defaults,'hero-description':'Next release'},lang),{'hero-title':'My custom title'});
 assert.deepEqual(savedCopy(defaults,defaults),{version:2,overrides:{}});
});
test('release hash propagates automatically through all imports after any source edit',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'orbs-release-'));try{
 const source=path.join(dir,'site'),output=path.join(dir,'dist');await cp('site',source,{recursive:true});
 const a=await build(source,output);assert.equal(await build(source,output),a);
 const file=path.join(source,'model.js');await writeFile(file,(await readFile(file,'utf8'))+'\n// next release\n');
 const b=await build(source,output);assert.notEqual(a,b);
 for(const name of ['index.html','app.js','i18n.js','copy-editor.js','copy-storage.js','market-price.js']){
 const content=await readFile(path.join(output,name),'utf8');const refs=[...content.matchAll(/\?v=([\w.-]+)/g)].map(x=>x[1]);assert.ok(refs.length>0);assert.ok(refs.every(v=>v===b),name);
 }
 assert.equal(JSON.parse(await readFile(path.join(output,'release.json'),'utf8')).version,b);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('every dictionary entry has English and Japanese translations',()=>{
 for(const [key,value] of Object.entries(translations))for(const lang of ['en','ja'])assert.ok(typeof value[lang]==='string'&&value[lang].length>0,`${lang}: ${key}`);
});
