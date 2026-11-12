import { SimpleLinearRegression } from 'ml-regression-simple-linear';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
export const series=[42,45,47,43,48,52,50,56,54,60,62,59,64,67,65,70,72,69,76,78,75,82,84,81];
export function backtest(){
 const rows=[];
 for(let end=12;end<series.length;end++){
  const train=series.slice(0,end);
  const model=new SimpleLinearRegression(train.map((_,i)=>i+1),train);
  rows.push({week:end+1,actual:series[end],lastValue:train.at(-1),seasonal4:train.at(-4),linear:Number(Math.max(0,model.predict(end+1)).toFixed(2))});
 }
 const mae=key=>rows.reduce((s,r)=>s+Math.abs(r[key]-r.actual),0)/rows.length;
 const rmse=key=>Math.sqrt(rows.reduce((s,r)=>s+(r[key]-r.actual)**2,0)/rows.length);
 // This is a one-period cost proxy, not a multi-period inventory simulator.
 const cost=key=>rows.reduce((s,r)=>s+Math.max(0,r.actual-r[key])*8+Math.max(0,r[key]-r.actual)*2,0);
 return {data:'24 周合成销量；前 12 周起步，逐周扩展训练，仅用过去预测下一周。',metrics:['lastValue','seasonal4','linear'].map(key=>({model:key,MAE:Number(mae(key).toFixed(3)),RMSE:Number(rmse(key).toFixed(3)),onePeriodCostProxy:Number(cost(key).toFixed(2))})),assumptions:'单周期近似：缺货 8 元/件，剩余 2 元/件；没有考虑交期、批量、库存结转和真实现金。',rows,next:'替换为有授权数据；加入交期、促销和断货；做多期库存仿真与试点。合成数据上的结果不能当作生产收益。'};
}
if(process.argv[1] && fileURLToPath(import.meta.url)===resolve(process.argv[1]))console.log(JSON.stringify(backtest(),null,2));
