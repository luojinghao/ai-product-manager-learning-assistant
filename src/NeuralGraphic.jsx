import React from 'react';
export default function NeuralGraphic() {
 const layers=[[70,[65,130,195]],[190,[35,98,162,225]],[310,[65,130,195]],[430,[98,162]]];
 return <svg className="neural" viewBox="0 0 500 270" role="img" aria-label="神经网络：输入特征经过隐藏层得到预测输出">{layers.slice(0,-1).flatMap(([x,ys],i)=>ys.flatMap((y,j)=>layers[i+1][1].map((ny,k)=><path key={[i,j,k].join('-')} className="signal" style={{animationDelay:(i+j+k)*.16+'s'}} d={'M'+x+' '+y+'L'+layers[i+1][0]+' '+ny}/>)))}{layers.map(([x,ys],i)=><g key={x}>{ys.map((y,j)=><g key={y}><circle className={'node node-'+i} cx={x} cy={y} r="13"/><circle className="pulse" cx={x} cy={y} r="18" style={{animationDelay:(i+j)*.35+'s'}}/></g>)}<text x={x} y="260" textAnchor="middle">{['输入特征','隐藏层','特征组合','预测输出'][i]}</text></g>)}</svg>;
}
