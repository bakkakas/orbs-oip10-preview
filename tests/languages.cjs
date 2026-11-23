const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.argv[2]||'http://127.0.0.1:8898/';
let checks=0;function check(value,message){assert.ok(value,message);checks++;console.log('PASS',message);}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const errors=[];fs.mkdirSync('artifacts',{recursive:true});
 try {
 for(const width of [1440,390,320]){
 const context=await browser.newContext({viewport:{width,height:900}});await context.route('https://api.coingecko.com/api/v3/simple/price?**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({orbs:{usd:.006,usd_24h_change:1.25,last_updated_at:Math.floor(Date.now()/1000)}})}));const page=await context.newPage();page.setDefaultTimeout(7000);
 page.on('pageerror',e=>(errors.push(e.message),console.error(e.message)));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});
 await page.goto(base,{waitUntil:'networkidle'});
 for(const lang of ['ko','en','ja']){
 if(await page.locator('#language').inputValue()!==lang){await page.locator('#language').selectOption(lang);await page.waitForURL('**lang='+lang);await page.waitForLoadState('networkidle');}
 check(await page.locator('html').getAttribute('lang')===lang,`${width} ${lang} document language`);
 check(await page.locator('.brand').innerText()==='ORBS\nToken Burn Tracker',`${width} ${lang} brand`);
 check(await page.locator('h1').innerText()==='ORBS Season 1 Tokenomics',`${width} ${lang} season title`);
 check(await page.locator('h1').evaluate(el=>el.scrollWidth<=el.clientWidth && el.getBoundingClientRect().height<parseFloat(getComputedStyle(el).lineHeight)*1.5),`${width} ${lang} title fits one line`);
 check(await page.locator('#contract-address').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=19),`${width} ${lang} prominent address`);
 check(await page.locator('#percent').innerText()==='32.00%',`${width} ${lang} progress preserved`);
 check(await page.locator('.brand-mark').evaluate(el=>el.complete&&el.naturalWidth>0),`${width} ${lang} official ORBS asset loaded`);
 check(await page.locator('#explorer img').evaluate(el=>el.complete&&el.naturalWidth>0),`${width} ${lang} official Etherscan asset loaded`);
 check(await page.locator('#explorer').getAttribute('href')==='https://etherscan.io/address/0x01D59Af68E2dcb44e04C50e05F62E7043F2656C3',`${width} ${lang} exact explorer link`);
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width} ${lang} no overflow`);
 if(lang!=='ko')check(!/[가-힣]/.test(await page.locator('body').innerText()),`${width} ${lang} no untranslated Korean`);
 await page.locator('#history-body button').first().click();if(lang!=='ko')check(!/[가-힣]/.test(await page.locator('#detail-dialog').innerText()),`${width} ${lang} first completed detail translated`);await page.locator('#close-dialog').click();
 await page.locator('#history-body button').nth(1).click();if(lang!=='ko')check(!/[가-힣]/.test(await page.locator('#detail-dialog').innerText()),`${width} ${lang} complete detail translated`);await page.locator('#close-dialog').click();
 await page.locator('#alert-preview').click();if(lang!=='ko')check(!/[가-힣]/.test(await page.locator('#detail-dialog').innerText()),`${width} ${lang} alert translated`);await page.locator('#close-dialog').click();
 await page.locator('#edit-copy').click();if(lang!=='ko')check(!/[가-힣]/.test(await page.locator('#copy-dialog').innerText()),`${width} ${lang} editor translated`);
 const field=page.locator('#copy-field-hero-description');await field.fill('Edited '+lang);await page.locator('#copy-form button[type=submit]').click();await page.reload({waitUntil:'networkidle'});
 check(await page.locator('[data-copy=hero-description]').innerText()==='Edited '+lang,`${width} ${lang} edited copy persists`);
 await page.locator('#edit-copy').click();await page.locator('#reset-copy').click();await page.locator('#copy-form button[type=submit]').click();
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`artifacts/${base.startsWith('https')?'live':'local'}-${lang}-${width}.png`,fullPage:true});
 }
 await context.grantPermissions(['clipboard-read','clipboard-write']);await page.locator('#copy-contract').click();check(await page.evaluate(()=>navigator.clipboard.readText())==='0x01D59Af68E2dcb44e04C50e05F62E7043F2656C3',`${width} icon copies exact address`);
 // Language selection persists on the canonical URL, and one language cannot overwrite another's copy.
 await page.locator('#edit-copy').click();await page.locator('#copy-field-hero-description').fill('Japanese only');await page.locator('#copy-form button[type=submit]').click();
 await page.goto(base,{waitUntil:'networkidle'});check(await page.locator('html').getAttribute('lang')==='ja',`${width} language persists without query`);
 await page.locator('#language').selectOption('en');await page.waitForURL('**lang=en');await page.waitForLoadState('networkidle');check(!(await page.locator('[data-copy=hero-description]').innerText()).includes('Japanese only'),`${width} language copy isolation`);
 await context.close();
 }
 check(errors.length===0,'no console/page errors: '+errors.join('; '));console.log(JSON.stringify({checks,base,widths:[1440,390,320],languages:['ko','en','ja'],errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
