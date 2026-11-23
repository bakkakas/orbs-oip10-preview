const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const base=process.argv[2]||'http://127.0.0.1:8237/';
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});let checks=0;
try{
const {legacyCopy}=await import('../site/legacy-copy.js');
for(const lang of ['ko','en','ja']){
 const context=await browser.newContext();await context.route('https://api.coingecko.com/api/v3/simple/price?**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({orbs:{usd:.00759,usd_24h_change:2,last_updated_at:Math.floor(Date.now()/1000)}})}));
 await context.addInitScript(({lang,old})=>{const key='orbs-oip10-preview-copy-v1'+(lang==='ko'?'':'-'+lang);if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({'history-description':old,'hero-description':'My own description'}));},{lang,old:legacyCopy[lang]['history-description'][0]});
 const page=await context.newPage();await page.goto(base+'?lang='+lang,{waitUntil:'networkidle'});
 assert.notEqual(await page.locator('[data-copy=history-description]').innerText(),legacyCopy[lang]['history-description'][0]);checks++;
 assert.equal(await page.locator('[data-copy=hero-description]').innerText(),'My own description');checks++;
 const key='orbs-oip10-preview-copy-v1'+(lang==='ko'?'':'-'+lang);assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),{version:2,overrides:{'hero-description':'My own description'}});checks++;
 // Simulate a cached old HTML document; the manifest must recover the same selected language.
 let staleServed=false;await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document'||staleServed)return route.fallback();
  staleServed=true;const response=await route.fetch();let body=await response.text();body=body.replace(/(<meta name="release" content=")[^"]+/, '$10000000000000000');await route.fulfill({response,body});
 });
 await page.goto(base+'?lang='+lang);await page.waitForURL(url=>url.searchParams.has('v'));await page.waitForLoadState('networkidle');
 assert.equal(await page.locator('html').getAttribute('lang'),lang);checks++;
 assert.equal(new URL(page.url()).searchParams.get('v'),await page.locator('meta[name=release]').getAttribute('content'));checks++;
 assert.equal(await page.locator('#history-body tr').count(),6);checks++;
 assert.equal(await page.locator('#market-price').innerText(),'$0.0076');checks++;
 await page.locator('#language').selectOption(lang==='en'?'ja':'en');await page.waitForURL(url=>url.searchParams.get('lang')===(lang==='en'?'ja':'en'));await page.waitForLoadState('networkidle');
 assert.equal(await page.locator('#history-body tr').count(),6);checks++;
 await context.close();
}
console.log(JSON.stringify({checks,languages:['ko','en','ja'],legacyDefaultsMigrated:true,customEditsPreserved:true,staleEntryRecovery:true}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
