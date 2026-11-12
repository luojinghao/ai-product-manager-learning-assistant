import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
export const documents = [
 { id: 'D1', org: 'east', active: true, title: '延期处置规范 v2', text: '交货延期时，采购员在一个工作日内确认新的交期并记录影响。', keywords: ['交货','延期','交期','处置'] },
 { id: 'D2', org: 'east', active: true, title: '供应商准入规范 v1', text: '新供应商提交营业执照与质量材料，采购和质量部门共同审批。', keywords: ['供应商','准入','新增','材料','审批'] },
 { id: 'D3', org: 'west', active: true, title: '西区价格附件', text: '西区演示采购价为每箱 180 元。', keywords: ['西区','价格','采购价','每箱'] },
 { id: 'D4', org: 'east', active: false, title: '延期处置规范 v1（已失效）', text: '旧规则要求五天内确认交期。', keywords: ['延期','交期','确认'] },
];
export const cases = [
 { question: '交货延期怎么处置？', org: 'east', expected: 'D1' },
 { question: '新增供应商要什么材料？', org: 'east', expected: 'D2' },
 { question: '西区采购价是多少？', org: 'east', expected: null },
 { question: '明天天气怎样？', org: 'east', expected: null },
 { question: '交期确认需要多久？', org: 'east', expected: 'D1' },
];
export function retrieve(question, org) {
 return documents.filter(d => d.org === org && d.active).map(d => ({ ...d, score: d.keywords.filter(k => question.includes(k)).length })).filter(d => d.score > 0).sort((a,b) => b.score-a.score).slice(0,2);
}
export function answer(question, org) {
 const evidence=retrieve(question,org);
 return evidence.length ? { status:'evidence', documentId:evidence[0].id, answer:evidence[0].text, source:evidence[0].title } : { status:'declined', documentId:null, answer:'没有找到有效且有权访问的资料，请补充依据或转人工。' };
}
export function evaluateKnowledge(){
 const results=cases.map(c=>({question:c.question,expected:c.expected,...answer(c.question,c.org)}));
 return { method:'本地关键词检索基线，直接摘录证据；未调用 LLM 或 Embedding。', data:'全部为虚构制度，5 条冒烟样例，不代表生产质量。', passed:results.filter(r=>r.documentId===r.expected).length,total:results.length,results,next:'扩充至少 30 题，加入否定、歧义、冲突、注入和多跳；再对照混合检索与真实生成。' };
}
if(process.argv[1] && fileURLToPath(import.meta.url)===resolve(process.argv[1]))console.log(JSON.stringify(evaluateKnowledge(),null,2));
