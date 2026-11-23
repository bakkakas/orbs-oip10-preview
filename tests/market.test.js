import test from 'node:test';
import assert from 'node:assert/strict';
import {parseQuote,QUOTE_MAX_AGE_MS} from '../site/market-model.js';
import {transactionLink,shortHash,records} from '../site/model.js';
const now=1795422125000;
const payload=(extra={})=>({orbs:{usd:.00603087,usd_24h_change:.457306,last_updated_at:now/1000,...extra}});
test('live quote preserves raw USD and percentage-point change',()=>{assert.deepEqual(parseQuote(payload(),now),{price:.00603087,change:.457306,updatedAt:now});});
test('missing daily change is unknown, not zero',()=>{assert.equal(parseQuote(payload({usd_24h_change:null}),now).change,null);assert.equal(parseQuote(payload({usd_24h_change:-2.4}),now).change,-2.4);});
test('bad, stale and future quotes never masquerade as current price',()=>{for(const usd of [0,-1,NaN,Infinity,'0.01',null])assert.throws(()=>parseQuote(payload({usd}),now));for(const ts of [null,'123',NaN,now/1000-301,now/1000+61])assert.throws(()=>parseQuote(payload({last_updated_at:ts}),now));assert.throws(()=>parseQuote({},now));assert.equal(parseQuote(payload(),now+QUOTE_MAX_AGE_MS).price,.00603087);});
test('only valid full EVM transaction hashes receive exact explorer URLs',()=>{const hash='0x'+'ab12'.repeat(16);assert.equal(transactionLink(hash),'https://etherscan.io/tx/'+hash);assert.equal(shortHash(hash),'0xab12ab…12ab12');for(const bad of [null,'0x2135bsd....1233ze','javascript:alert(1)','0x'+'ab'.repeat(20),'0x'+'z'.repeat(64)])assert.equal(transactionLink(bad),null);});
test('sample dates do not invent transaction hashes',()=>{assert.equal(records[0].date,'2026-11-13');assert.equal(records[6].date,'2026-12-25');assert.ok(records.every(r=>r.transactionHash===null));});

test('summary uses initial supply minus cumulative and latest completed round only',async()=>{const m=await import('../site/model.js');assert.equal(m.INITIAL_SUPPLY,10000000000);assert.equal(m.exampleTotalSupply,m.INITIAL_SUPPLY-m.cumulative);assert.equal(m.exampleTotalSupply.toFixed(2),'9837587007.04');assert.equal(m.completedRecords.length,6);assert.equal(m.PLANNED_ROUNDS,52);assert.equal(m.latestCompleted.week,6);assert.equal(m.latestCompleted.twap,m.completedRecords.at(-1).twap);assert.ok(m.completedRecords.every(r=>r.status==='complete'));assert.equal(m.TEMPORARY_ADDRESS_URL,'https://etherscan.io/address/'+m.TEMPORARY_ADDRESS);});
