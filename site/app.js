import {t,tr as msg,initLanguage} from './i18n.js?v=7';
import {TARGET,WEEKLY_USD,records,cumulative,progressPercent,filterRecords,transactionLink,shortHash,completedRecords,latestCompleted,exampleTotalSupply,PLANNED_ROUNDS,TEMPORARY_ADDRESS,TEMPORARY_ADDRESS_URL} from './model.js?v=7';
initLanguage();
const $ = id => document.getElementById(id);
const fmt = (v,d=2) => v.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
$('burned').textContent=fmt(cumulative);
$('percent').textContent=fmt(progressPercent)+'%';
$('progress-fill').style.width=Math.min(100,progressPercent)+'%';
$('progress').setAttribute('aria-valuenow',String(progressPercent));
$('progress').setAttribute('aria-valuetext',msg`예시 ${fmt(progressPercent)}%, ${fmt(cumulative)} ORBS`);
$('copy-contract').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText($('contract-address').textContent);$('contract-message').textContent=t('임시 ORBS 스테이킹 주소를 복사했어. 실제 소각 주소가 아니야.');}
 catch{$('contract-message').textContent=t('자동 복사를 사용할 수 없어. 위 주소를 선택해서 복사해 줘.');}
});
$('total-supply').textContent=fmt(exampleTotalSupply);
$('latest-reference-price').textContent=latestCompleted?'$'+fmt(latestCompleted.twap,6):'—';
$('latest-round-label').textContent=latestCompleted?msg`최근 완료: ${latestCompleted.week}회차`:t('완료된 회차 없음');
$('completed-rounds').textContent=`${completedRecords.length} / ${PLANNED_ROUNDS}`;
function addText(tag,text,parent,cls){const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;parent.append(el);return el;}
function openDialog(title){$('dialog-title').textContent=title;$('dialog-body').replaceChildren();$('detail-dialog').showModal();return $('dialog-body');}
function detail(week){
  const r=records.find(r=>r.week===week);const body=openDialog(msg`예시 ${String(week).padStart(2,'0')}주차 · 계산 근거`);
  addText('p',t('가상 주차이며 실제 날짜 또는 거래를 의미하지 않아.'),body);
  const dl=document.createElement('dl');body.append(dl);
  const pairs=[[t('상태'),r.status==='complete'?t('완료 · 온체인 미연동'):t('대기 · 누적량에서 제외')],[t('주간 기준 금액'),'$'+fmt(WEEKLY_USD)],[t('가격 관측 구간'),t('해당 회차 직전 7일 · 시작/종료 시각 미확정')],[t('7일 TWAP'),r.twap===null?t('미정 · 가격 없음'):'$'+fmt(r.twap,6)+t(' / ORBS · 가정값')],[t('계산식'),r.amount===null?t('TWAP 확정 전 계산하지 않음'):`$${fmt(WEEKLY_USD)} ÷ $${fmt(r.twap,6)} = ${fmt(r.amount)} ORBS`],[t('거래 해시 / 블록 / 체인'),t('미연동 · 실제 거래 정보 없음')],[t('가격 소스 / ABI / 이벤트'),t('미확정')]];
  for(const [k,v] of pairs){addText('dt',k,dl);addText('dd',v,dl);}
  addText('p',t('표시값은 소수점 2자리 반올림. 누적 계산은 반올림 전 값을 사용해. 실제 연동에서는 이벤트 수량과 공식 정밀도를 기준으로 검증해.'),body,'dialog-note');
}
function renderTable(){
 const rows=filterRecords('complete',$('week-filter').value,$('sort-filter').value);$('history-body').replaceChildren();
 for(const r of rows){const row=document.createElement('tr');
 const dateCell=document.createElement('td');dateCell.dataset.label=t('날짜 / 회차');
 const dateLabel=r.date.slice(2).replaceAll('-','.');
 const button=addText('button',msg`${dateLabel} (${r.week}회차)`,dateCell,'history-date');
 button.setAttribute('aria-label',msg`예시 ${r.week}주차 상세 보기`);button.addEventListener('click',()=>detail(r.week));
 row.append(dateCell);
 const priceCell=document.createElement('td');priceCell.dataset.label=t('7일 기준가격');
 addText('span',r.twap===null?'—':'$'+fmt(r.twap,6),priceCell);row.append(priceCell);
 const amountCell=document.createElement('td');amountCell.dataset.label=t('소각 수량');
 addText('strong',r.amount===null?'—':fmt(r.amount)+' ORBS',amountCell);row.append(amountCell);
 const txCell=document.createElement('td');txCell.dataset.label=t('트랜잭션');const url=transactionLink(r.transactionHash);
 if(url){const link=addText('a',shortHash(r.transactionHash)+' ↗',txCell,'transaction-link');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.title=r.transactionHash;link.setAttribute('aria-label',msg`Etherscan에서 트랜잭션 ${r.transactionHash} 보기`);}
 else{const link=addText('a',TEMPORARY_ADDRESS.slice(0,8)+'…'+TEMPORARY_ADDRESS.slice(-6)+' ↗',txCell,'transaction-link temporary-transaction');link.href=TEMPORARY_ADDRESS_URL;link.target='_blank';link.rel='noopener noreferrer';link.title=TEMPORARY_ADDRESS+' · '+t('임시 스테이킹 주소 · 실제 거래 아님');link.setAttribute('aria-label',t('Etherscan에서 임시 스테이킹 주소 보기'));}
 row.append(txCell);$('history-body').append(row);}
 $('row-count').textContent=msg`예시 ${rows.length}건 / 전체 ${completedRecords.length}건`;$('empty').hidden=rows.length!==0;
}
for(const id of ['week-filter','sort-filter'])$(id).addEventListener('change',renderTable);
renderTable();
$('close-dialog').addEventListener('click',()=>$('detail-dialog').close());
$('detail-dialog').addEventListener('click',e=>{if(e.target===$('detail-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('alert-preview').addEventListener('click',()=>{const body=openDialog(t('Telegram 알림 미리보기'));addText('p','Telegram',body);addText('p',t('[미리보기 · 실제 발송 없음]'),body,'dialog-note');const r=records[5];addText('p',msg`예시 6주차 소각 완료: ${fmt(r.amount)} ORBS`,body);addText('p',msg`적용 TWAP: $${fmt(r.twap,6)} / ORBS · 기준 금액: $${fmt(WEEKLY_USD)}`,body);addText('p',msg`예시 누적: ${fmt(cumulative)} / ${fmt(TARGET,0)} ORBS (${fmt(progressPercent)}%)`,body);addText('p',t('실제 서비스에서는 확정 거래 링크·소각 시각·가격 구간을 함께 제공해. 지금은 거래가 없어 링크를 만들지 않았어.'),body);});

import {initCopyEditor} from './copy-editor.js?v=7';
initCopyEditor();

import {initMarketPrice} from './market-price.js?v=7';
initMarketPrice();
