const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.argv[2] || 'http://127.0.0.1:8899/';
let checks=0;const check=(condition,message)=>{assert.ok(condition,message);checks++;console.log('PASS '+checks+' '+message);};
(async()=>{
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const errors=[];const outside=[];fs.mkdirSync('artifacts',{recursive:true});
try{
for(const width of [1440,390,320]){
 const context=await browser.newContext({viewport:{width,height:900},isMobile:width<600,hasTouch:width<600});
 const page=await context.newPage();page.setDefaultTimeout(7000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});page.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('data:'))outside.push(r.url());});
 const response=await page.goto(base,{waitUntil:'networkidle'});check(response.status()===200,'HTTP 200');
 await page.locator('#burned').filter({hasText:/[0-9]/}).waitFor();
 check(await page.locator('#sim-amount').innerText()==='3,365,384.50','initial formula');
 check(await page.locator('#history-body tr').count()===7,'all seven illustrative rows');
 check(await page.locator('#explorer').getAttribute('href')==='https://etherscan.io/address/0x01D59Af68E2dcb44e04C50e05F62E7043F2656C3','temporary staking explorer link');

 check((await page.locator('.temporary-contract').innerText()).includes('실제 소각 컨트랙트가 아님'),'temporary contract disclosure');
 const title=page.locator('[data-copy=hero-title]');const originalTitle=await title.innerText();
 await page.locator('#edit-copy').click();
 check((await page.locator('#copy-scope').innerText()).includes('이 브라우저의 현재 언어에만'),'local-only scope');
 const titleField=page.locator('#copy-field-hero-title');
 await titleField.fill('편집 취소');await page.locator('#cancel-copy').click();check(await title.innerText()===originalTitle,'cancel leaves live copy unchanged');
 await page.locator('#edit-copy').click();await titleField.fill('<img src=x onerror=alert(1)> 시즌 1');
 await page.getByRole('button',{name:'저장하고 적용',exact:true}).click();await page.reload({waitUntil:'networkidle'});
 check(await title.innerText()==='<img src=x onerror=alert(1)> 시즌 1','edited text survives reload literally');
 check(await title.locator('img').count()===0,'copy is plain text, never interpreted HTML');
 check(await page.locator('#percent').innerText()==='32.00%' ,'editing retains 32% sample progress');
 check(await page.locator('#burned').innerText()==='162,412,992.96','sample amount matches 32%');
 check(await page.locator('#progress-fill').evaluate(el=>el.style.width)==='32%','filled bar matches 32%');
 await page.locator('#edit-copy').click();const downloaded=page.waitForEvent('download');await page.locator('#export-copy').click();const file=await downloaded;check(file.suggestedFilename()==='orbs-preview-copy.json','copy export download');
 const exported=JSON.parse(fs.readFileSync(await file.path(),'utf8'));check(exported.copy['hero-title'].includes('시즌 1'),'export contains edited copy');
 await page.locator('#reset-copy').click();await page.getByRole('button',{name:'저장하고 적용',exact:true}).click();await page.reload({waitUntil:'networkidle'});check(await title.innerText()===originalTitle,'reset restores default persistently');
 check(await page.locator('#progress-fill').evaluate(el=>getComputedStyle(el,'::after').animationName)==='burn-shimmer','shimmer on filled bar');
 await page.emulateMedia({reducedMotion:'reduce'});check(await page.locator('#progress-fill').evaluate(el=>getComputedStyle(el,'::after').animationName)==='none','reduced motion disables shimmer');await page.emulateMedia({reducedMotion:'no-preference'});
 const initialProgress=await page.locator('#percent').innerText();
 await context.grantPermissions(['clipboard-read','clipboard-write']);await page.locator('#copy-contract').click();check(await page.evaluate(()=>navigator.clipboard.readText())==='0x01D59Af68E2dcb44e04C50e05F62E7043F2656C3','copy exact temporary staking address');
 await page.locator('[data-price="0.01"]').click();check(await page.locator('#sim-amount').innerText()==='6,730,769.00','preset formula');
 check(await page.locator('#percent').innerText()===initialProgress,'simulator does not mutate cumulative');
 for(const val of ['', '0','-0.02','1001']){await page.locator('#twap').fill(val);check(await page.locator('#sim-amount').innerText()==='—','invalid price clears result '+val);}
 await page.locator('#twap').fill('0.000001');check((await page.locator('#sim-share').innerText()).includes('초과'),'excess burn warning');
 await page.locator('#reset-sim').click();check(await page.locator('#sim-amount').innerText()==='3,365,384.50','reset');
 await page.locator('#twap-range').focus();await page.keyboard.press('ArrowRight');check(await page.locator('#twap').inputValue()==='0.020500','keyboard range interaction');
 await page.locator('#reset-sim').click();
 await page.locator('#status-filter').selectOption('pending');check(await page.locator('#history-body tr').count()===1,'pending filter');
 await page.locator('#week-filter').selectOption('early');check(await page.locator('#empty').isVisible(),'empty intersection state');
 await page.locator('#status-filter').selectOption('complete');check(await page.locator('#history-body tr').count()===4,'early complete filter');
 await page.locator('#week-filter').selectOption('recent');check(await page.locator('#history-body tr').count()===2,'recent complete filter');
 await page.locator('#sort-filter').selectOption('asc');check((await page.locator('#history-body tr').first().innerText()).includes('05주차'),'sort');
 await page.getByRole('button',{name:'예시 5주차 상세 보기',exact:true}).click();check(await page.locator('#detail-dialog').isVisible(),'details open');
 check((await page.locator('#dialog-body').innerText()).includes('$0.002658'),'row-specific TWAP');
 check((await page.locator('#dialog-body').innerText()).includes('실제 거래 정보 없음'),'no fake transaction');
 await page.keyboard.press('Escape');check(!await page.locator('#detail-dialog').isVisible(),'escape closes dialog');
 await page.locator('input[value=email]').check();await page.locator('input[value=telegram]').uncheck();await page.getByRole('button',{name:'이 브라우저에 선택 저장',exact:true}).click();check((await page.locator('#prefs-status').innerText()).includes('실제 알림 구독·발송은 없음'),'save disclosure');
 await page.reload({waitUntil:'networkidle'});check(await page.locator('input[value=email]').isChecked(),'preference persists');check(!await page.locator('input[value=telegram]').isChecked(),'unchecked preference persists');
 await page.locator('#alert-preview').click();check((await page.locator('#dialog-body').innerText()).includes('선택한 채널: 이메일'),'alert preview respects channels');check((await page.locator('#dialog-body').innerText()).includes('실제 발송 없음'),'no send promise');await page.locator('#close-dialog').click();
 await page.locator('input[value=email]').uncheck();await page.getByRole('button',{name:'이 브라우저에 선택 저장',exact:true}).click();check((await page.locator('#prefs-status').innerText()).includes('수신 채널 없음'),'no channels supported');
 await page.locator('#clear-prefs').click();check(await page.evaluate(()=>localStorage.getItem('orbs-oip10-preview-channels-v1'))===null,'clear removes preference');
 check(await page.locator('#sources a').count()===2,'two proposal sources');
 check((await page.locator('#sources a').first().getAttribute('href'))==='https://blog.naver.com/orbskorea/224463916574','exact explainer link');
 check((await page.locator('#sources a').last().getAttribute('href')).endsWith('0xd2af1ee80124e22afb73b4f8871f27abdb8c4008335900b2af1387db3abfed0d'),'exact Snapshot link');
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal page overflow '+width);
 check(await page.locator('a[href*="etherscan"]').count()===1,'only requested temporary explorer link');
 await page.reload({waitUntil:'networkidle'});await page.evaluate(()=>window.scrollTo(0,0));
 if(width!==320)await page.screenshot({path:`artifacts/${base.startsWith('https')?'live':'local'}-${width}.png`,fullPage:true});
 await context.close();
}
check(errors.length===0,'no console or page errors: '+errors.join('; '));
check(outside.length===0,'no third-party requests or notification calls: '+outside.join('; '));
console.log(JSON.stringify({base,checks,widths:[1440,390,320],errors,externalRequests:outside,temporaryContextsClosed:true},null,2));
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
