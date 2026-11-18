export const TARGET = 507540603;
export const WEEKLY_USD = 67307.69;
export function calculateBurn(price) {
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0.000001 || price > 1000) return null;
  return WEEKLY_USD / price;
}
export const records = [0.018, 0.021, 0.0195, 0.024, 0.022, 0.02].map((twap, i) => ({week:i+1, twap, amount:calculateBurn(twap), status:'complete'}));
records.push({week:7,twap:null,amount:null,status:'pending'});
export const cumulative = records.filter(r=>r.status==='complete').reduce((sum,r)=>sum+r.amount,0);
export const progressPercent = cumulative / TARGET * 100;
export function filterRecords(status='all', period='all', order='desc') {
  return records.filter(r=>(status==='all'||r.status===status)&&(period==='all'||(period==='recent'?r.week>=5:r.week<5))).sort((a,b)=>order==='asc'?a.week-b.week:b.week-a.week);
}
export function sanitizeChannels(value) {
  return Array.isArray(value) ? [...new Set(value.filter(v=>['telegram','email','push'].includes(v)))] : ['telegram'];
}
