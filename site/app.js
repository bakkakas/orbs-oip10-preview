import {TARGET,WEEKLY_USD,calculateBurn,records,cumulative,progressPercent,filterRecords,sanitizeChannels} from './model.js?v=3';
const $ = id => document.getElementById(id);
const fmt = (v,d=2) => v.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
$('burned').textContent=fmt(cumulative);
$('percent').textContent=fmt(progressPercent)+'%';
$('progress-fill').style.width=Math.min(100,progressPercent)+'%';
$('progress').setAttribute('aria-valuenow',String(progressPercent));
$('progress').setAttribute('aria-valuetext',`예시 ${fmt(progressPercent)}%, ${fmt(cumulative)} ORBS`);
$('copy-contract').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText($('contract-address').textContent);$('contract-message').textContent='임시 ORBS 스테이킹 주소를 복사했어. 실제 소각 주소가 아니야.';}
 catch{$('contract-message').textContent='자동 복사를 사용할 수 없어. 위 주소를 선택해서 복사해 줘.';}
});
function simulate(){
  const raw=$('twap').value.trim();
  const price=raw===''?NaN:Number(raw);
  const amount=calculateBurn(price);
  const valid=amount!==null;
  $('twap').setAttribute('aria-invalid',String(!valid));
  $('twap-error').textContent=valid?'':'$0.000001 이상 $1,000 이하의 유효한 가격을 입력해 줘. 0이나 빈 값으로는 계산할 수 없어.';
  $('sim-amount').textContent=valid?fmt(amount):'—';
  $('sim-share').textContent=valid?`전체 목표의 ${fmt(amount/TARGET*100,3)}%에 해당해. 누적 예시에는 합산하지 않아.`:'가격을 입력하면 계산 결과가 표시돼.';
  if(valid && amount>TARGET-cumulative) $('sim-share').textContent+=' 이 계산값은 예시 잔여량을 초과해. 실제 마지막 소각의 잔량 제한 규칙은 미확정이야.';
  if(valid) $('twap-range').value=String(Math.max(.005,Math.min(.1,price)));
  $('twap-range').setAttribute('aria-valuetext',`슬라이더 범위의 가격 ${$('twap-range').value} USD / ORBS`);
}
$('twap').addEventListener('input',simulate);
$('twap-range').addEventListener('input',()=>{$('twap').value=Number($('twap-range').value).toFixed(6);simulate();});
for(const b of document.querySelectorAll('[data-price]'))b.addEventListener('click',()=>{$('twap').value=Number(b.dataset.price).toFixed(6);simulate();});
$('reset-sim').addEventListener('click',()=>{$('twap').value='0.020000';simulate();});
simulate();
function addText(tag,text,parent,cls){const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;parent.append(el);return el;}
function openDialog(title){$('dialog-title').textContent=title;$('dialog-body').replaceChildren();$('detail-dialog').showModal();return $('dialog-body');}
function detail(week){
  const r=records.find(r=>r.week===week);const body=openDialog(`예시 ${String(week).padStart(2,'0')}주차 · 계산 근거`);
  addText('p','가상 주차이며 실제 날짜 또는 거래를 의미하지 않아.',body);
  const dl=document.createElement('dl');body.append(dl);
  const pairs=[['상태',r.status==='complete'?'완료 예시 · 온체인 검증 아님':'대기 예시 · 누적량에서 제외'],['주간 기준 금액','$'+fmt(WEEKLY_USD)],['가격 관측 구간','해당 예시 주차 직전 7일 · 실제 시작/종료 시각 미확정'],['7일 TWAP',r.twap===null?'미정 · 가격 없음':'$'+fmt(r.twap,6)+' / ORBS · 가정값'],['계산식',r.amount===null?'TWAP 확정 전 계산하지 않음':`$${fmt(WEEKLY_USD)} ÷ $${fmt(r.twap,6)} = ${fmt(r.amount)} ORBS`],['거래 해시 / 블록 / 체인','미연동 · 실제 거래 정보 없음'],['가격 소스 / ABI / 이벤트','미확정']];
  for(const [k,v] of pairs){addText('dt',k,dl);addText('dd',v,dl);}
  addText('p','표시값은 소수점 2자리 반올림. 누적 계산은 반올림 전 값을 사용해. 실제 연동에서는 이벤트 수량과 공식 정밀도를 기준으로 검증해.',body,'dialog-note');
}
function renderTable(){
 const rows=filterRecords($('status-filter').value,$('week-filter').value,$('sort-filter').value);$('history-body').replaceChildren();
 for(const r of rows){const tr=document.createElement('tr');
 const values=[['주차',`예시 ${String(r.week).padStart(2,'0')}주차`],['직전 7일 TWAP',r.twap===null?'미정':'$'+fmt(r.twap,6)],['소각량 / ORBS',r.amount===null?'—':fmt(r.amount)],['상태',r.status==='complete'?'완료 예시':'대기 예시']];
 for(const [label,value] of values){const td=document.createElement('td');td.dataset.label=label;addText(label==='소각량 / ORBS'?'strong':'span',value,td,label==='상태'?'state '+r.status:undefined);tr.append(td);}
 const td=document.createElement('td');td.dataset.label='계산 근거';const button=addText('button','상세 보기 ↗',td);button.setAttribute('aria-label',`예시 ${r.week}주차 상세 보기`);button.addEventListener('click',()=>detail(r.week));tr.append(td);$('history-body').append(tr);}
 $('row-count').textContent=`예시 ${rows.length}건 / 전체 ${records.length}건`;$('empty').hidden=rows.length!==0;
}
for(const id of ['status-filter','week-filter','sort-filter'])$(id).addEventListener('change',renderTable);
renderTable();
$('close-dialog').addEventListener('click',()=>$('detail-dialog').close());
$('detail-dialog').addEventListener('click',e=>{if(e.target===$('detail-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
const KEY='orbs-oip10-preview-channels-v1';
const inputs=[...document.querySelectorAll('input[name=channel]')];
try{const raw=localStorage.getItem(KEY);if(raw!==null){const channels=sanitizeChannels(JSON.parse(raw));inputs.forEach(i=>i.checked=channels.includes(i.value));$('prefs-status').textContent='이 브라우저에 저장된 체험용 선택을 불러왔어. 실제 구독은 아니야.';}}catch{$('prefs-status').textContent='저장된 선택을 불러오지 못했어. 기본값으로 체험할 수 있어.';}
function channels(){return inputs.filter(i=>i.checked).map(i=>i.value);}
inputs.forEach(i=>i.addEventListener('change',()=>{$('prefs-status').textContent='선택을 변경했어. 저장 버튼을 누르면 이 브라우저에만 기억해.';}));
$('alert-form').addEventListener('submit',e=>{e.preventDefault();try{localStorage.setItem(KEY,JSON.stringify(channels()));$('prefs-status').textContent=channels().length?'체험용 선택을 이 브라우저에 저장했어. 실제 알림 구독·발송은 없어.':'수신 채널 없음으로 저장했어. 실제 구독은 없어.';}catch{$('prefs-status').textContent='브라우저 저장소를 사용할 수 없어 저장하지 못했어. 이 화면에서만 체험할 수 있어.';}});
$('clear-prefs').addEventListener('click',()=>{try{localStorage.removeItem(KEY);inputs.forEach(i=>i.checked=i.value==='telegram');$('prefs-status').textContent='저장된 선택을 지웠어. 기본 예시(Telegram)로 돌아왔어.';}catch{$('prefs-status').textContent='저장소에 접근할 수 없어 삭제 여부를 확인하지 못했어.';}});
$('alert-preview').addEventListener('click',()=>{const body=openDialog('소각 알림 메시지 예시');const names={telegram:'Telegram',email:'이메일',push:'웹 푸시'};const selected=channels();addText('p',`선택한 채널: ${selected.length?selected.map(c=>names[c]).join(', '):'없음'}`,body);addText('p','[체험용 예시 · 실제 발송 없음]',body,'dialog-note');const r=records[5];addText('p',`예시 6주차 소각 완료: ${fmt(r.amount)} ORBS`,body);addText('p',`적용 TWAP: $${fmt(r.twap,6)} / ORBS · 기준 금액: $${fmt(WEEKLY_USD)}`,body);addText('p',`예시 누적: ${fmt(cumulative)} / ${fmt(TARGET,0)} ORBS (${fmt(progressPercent)}%)`,body);addText('p','실제 서비스에서는 확정 거래 링크·소각 시각·가격 구간을 함께 제공해. 지금은 거래가 없어 링크를 만들지 않았어.',body);});

import {initCopyEditor} from './copy-editor.js?v=2';
initCopyEditor();
