import test from 'node:test';
import assert from 'node:assert/strict';
import { answer,evaluateKnowledge } from '../examples/knowledge.js';
import { backtest,series } from '../examples/forecast.js';
import { createPurchaseWorkflow } from '../examples/agent.js';
test('knowledge example never retrieves unauthorized or expired sources',()=>{assert.equal(answer('西区采购价','east').status,'declined');assert.equal(answer('交期确认','east').documentId,'D1');assert.equal(evaluateKnowledge().passed,5);});
test('forecast backtest does not use future labels',()=>{const before=backtest();const saved=series[23];series[23]=9999;const after=backtest();assert.deepEqual(before.rows.slice(0,-1),after.rows.slice(0,-1));assert.equal(before.rows.at(-1).linear,after.rows.at(-1).linear);series[23]=saved;assert.equal(before.rows.length,12);});
test('workflow blocks cross-org, requires confirmation and does not duplicate execution',()=>{const f=createPurchaseWorkflow();assert.throws(()=>f.draft('PO-001','west'));const d=f.draft('PO-001','east');assert.throws(()=>f.execute(d,{actorOrg:'east',key:'a'}));assert.equal(f.audit.length,0);const first=f.execute(d,{actorOrg:'east',confirmed:true,key:'a'});const retry=f.execute(d,{actorOrg:'east',confirmed:true,key:'a'});assert.equal(first.messageId,retry.messageId);assert.equal(retry.reused,true);assert.equal(f.audit.length,1);assert.throws(()=>f.execute({...d,body:'changed'},{actorOrg:'east',confirmed:true,key:'a'}));});
