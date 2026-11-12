import test from 'node:test';
import assert from 'node:assert/strict';
import { chapters, allLessons, stages } from '../src/curriculum.js';
import { initialState, validateBackup, searchLessons } from '../src/learning.js';
test('all five stages contain independently authored lessons with actionable evidence',()=>{
 assert.equal(chapters.length,20); const list=allLessons(); assert.equal(list.length,80); assert.equal(new Set(list.map(l=>l.id)).size,80);
 for(const stage of stages.keys())assert.ok(chapters.some(c=>c.stage===stage));
 for(const l of list){for(const key of ['idea','explanation','example','formula','task'])assert.ok(l[key].trim().length>0,l.id+' '+key);assert.ok(l.flow.length>=3);assert.equal(l.quiz.options.length,3);assert.ok(l.quiz.answer>=0&&l.quiz.answer<3);assert.ok(l.quiz.why.length>15);assert.ok(l.chapter.resource[1].startsWith('https://'));}
 assert.equal(new Set(list.map(l=>l.explanation)).size,80);
});
test('restore rejects invalid data before touching saved progress',()=>{
 const good={...initialState,completed:['linear-0'],notes:{'linear-0':'测试笔记'},answers:{'linear-0':1}};
 assert.deepEqual(validateBackup(good).completed,['linear-0']);
 assert.deepEqual(validateBackup({...good,completed:['linear-0','linear-0']}).completed,['linear-0']);
 assert.deepEqual(validateBackup({...good,projects:{knowledge:{text:'draft',checked:[1,1,2]}}}).projects.knowledge.checked,[1,2]);
 assert.throws(()=>validateBackup({...good,projects:{unknown:{text:'draft',checked:[]}}}));
 for(const bad of [{},{...good,completed:['unknown']},{...good,notes:{'linear-0':42}},{...good,answers:{'linear-0':8}},{...good,projects:{test:{text:null,checked:[]}}}])assert.throws(()=>validateBackup(bad));
});
test('course lookup finds actual source material and supports empty result',()=>{
 assert.ok(searchLessons('RAG').some(l=>l.chapter.id==='retrieval'));assert.ok(searchLessons('梯度').some(l=>l.chapter.id==='optimization'));assert.equal(searchLessons('xyz-no-match-987').length,0);assert.deepEqual(searchLessons(''),[]);
});
