import {t,tr as msg,language} from './i18n.js?v=7';
import {parseQuote,QUOTE_MAX_AGE_MS} from './market-model.js?v=7';
export const PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=orbs&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true';
export function initMarketPrice() {
  const box=document.getElementById('market'),price=document.getElementById('market-price'),change=document.getElementById('market-change'),status=document.getElementById('market-status');
  let quote=null,busy=false,controller=null;
  function unavailable(key){box.dataset.state='unavailable';price.textContent='—';change.hidden=true;status.textContent=t(key);box.removeAttribute('title');}
  async function refresh(){
    if(busy || document.hidden)return;
    busy=true;controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);
    try{
      const response=await fetch(PRICE_URL,{signal:controller.signal,cache:'no-store'});
      if(!response.ok)throw new Error('quote unavailable');
      quote=parseQuote(await response.json());
      price.textContent='$'+quote.price.toLocaleString('en-US',{minimumFractionDigits:4,maximumFractionDigits:4});
      change.hidden=quote.change===null;
      if(quote.change!==null){const pct=Number(quote.change.toFixed(2));change.textContent=(pct>0?'+':'')+pct.toFixed(2)+'%';change.dataset.direction=pct>0?'up':pct<0?'down':'flat';change.title=t('24시간');change.setAttribute('aria-label',t('24시간')+' '+change.textContent);}
      const date=new Date(quote.updatedAt);
      status.textContent=msg`시세 갱신 ${date.toLocaleTimeString(language,{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}`;
      box.dataset.state='live';box.title='ORBS / USD · CoinGecko · '+date.toISOString();
    }catch{quote=null;unavailable('가격 조회 불가');}
    finally{clearTimeout(timeout);busy=false;controller=null;}
  }
  const refreshTimer=setInterval(refresh,60000);
  const staleTimer=setInterval(()=>{if(quote&&Date.now()-quote.updatedAt>QUOTE_MAX_AGE_MS){quote=null;unavailable('가격 갱신 필요');}},15000);
  const onVisible=()=>{if(!document.hidden){if(quote&&Date.now()-quote.updatedAt>QUOTE_MAX_AGE_MS)unavailable('가격 갱신 필요');refresh();}};
  document.addEventListener('visibilitychange',onVisible);
  const onPageShow=event=>{if(event.persisted)onVisible();};
  window.addEventListener('pageshow',onPageShow);
  window.addEventListener('pagehide',event=>{if(event.persisted)return;clearInterval(refreshTimer);clearInterval(staleTimer);document.removeEventListener('visibilitychange',onVisible);window.removeEventListener('pageshow',onPageShow);controller?.abort();});
  refresh();
}
