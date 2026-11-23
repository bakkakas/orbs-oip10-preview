import {readdir,readFile,mkdir,writeFile,cp,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
export async function build(source='site',output='dist') {
  async function files(dir) {
    const result=[];
    for (const entry of await readdir(dir,{withFileTypes:true})) {
      const file=path.join(dir,entry.name);
      result.push(...(entry.isDirectory()?await files(file):[file]));
    }
    return result.sort();
  }
  const names=await files(source), hash=createHash('sha256');
  for(const name of names)hash.update(path.relative(source,name)).update(await readFile(name));
  const version=hash.digest('hex').slice(0,16);
  await rm(output,{recursive:true,force:true});await mkdir(output,{recursive:true});
  await cp(source,output,{recursive:true});
  for(const name of names.filter(n=>/\.(html|js|css)$/.test(n))) {
    let text=(await readFile(name,'utf8')).replace(/\?v=[\w.-]+/g,`?v=${version}`);
    if(name.endsWith('index.html'))text=text.replace('</head>',`<meta name="release" content="${version}"><script type="module" src="release.js?v=${version}"></script></head>`);
    await writeFile(path.join(output,path.relative(source,name)),text);
  }
  await writeFile(path.join(output,'release.json'),JSON.stringify({version})+'\n');
  return version;
}
if(process.argv[1]===new URL(import.meta.url).pathname)console.log('Built release',await build());
