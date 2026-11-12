import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
export function createPurchaseWorkflow(){
 const orders=new Map([['PO-001',{id:'PO-001',org:'east',quantity:20,unit:'箱',status:'delayed',supplier:'演示供应商'}]]);
 const executions=new Map();const audit=[];
 function readOrder(id,org){const order=orders.get(id);if(!order||order.org!==org)throw new Error('订单不存在或无权访问');return {...order};}
 function draft(id,org){const order=readOrder(id,org);if(order.status!=='delayed')throw new Error('仅处理延期订单');return {orderId:id,org,recipient:'simulation-only',body:'请确认订单 '+id+'（'+order.quantity+order.unit+'）新的交期。',status:'awaiting-confirmation'};}
 function execute(draftValue,{actorOrg,confirmed=false,key}){
  if(!confirmed)throw new Error('需要确认，未执行');if(!key||typeof key!=='string')throw new Error('缺少幂等键');
  const order=readOrder(draftValue.orderId,actorOrg);
  if(draftValue.org!==actorOrg||draftValue.recipient!=='simulation-only'||draftValue.status!=='awaiting-confirmation')throw new Error('参数不合法');
  const fingerprint=JSON.stringify({order:order.id,org:actorOrg,body:draftValue.body});
  if(executions.has(key)){const previous=executions.get(key);if(previous.fingerprint!==fingerprint)throw new Error('幂等键冲突');return {...previous.result,reused:true};}
  const result={status:'simulated-sent',orderId:order.id,messageId:'SIM-'+(executions.size+1),reused:false};
  executions.set(key,{fingerprint,result});audit.push({event:'simulated-send',orderId:order.id,actorOrg,key});return result;
 }
 return {readOrder,draft,execute,audit};
}
export function demo(){const flow=createPurchaseWorkflow();const item=flow.draft('PO-001','east');const outcomes=[];for(const [label,options]of [['unconfirmed',{actorOrg:'east',key:'demo'}],['confirmed',{actorOrg:'east',confirmed:true,key:'demo'}],['retry',{actorOrg:'east',confirmed:true,key:'demo'}],['unauthorized',{actorOrg:'west',confirmed:true,key:'other'}]]){try{outcomes.push({label,...flow.execute(item,options)});}catch(e){outcomes.push({label,status:'blocked',reason:e.message});}}return {method:'确定性工作流 + 模拟工具；未连接模型、ERP 或邮箱，没有真实发送。',outcomes,audit:flow.audit,next:'接入模型时只让模型提出工具意图，保留服务端权限、确认、幂等、预算和审计；先只读试点。'};}
if(process.argv[1] && fileURLToPath(import.meta.url)===resolve(process.argv[1]))console.log(JSON.stringify(demo(),null,2));
