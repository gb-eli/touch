export const AUTO_SCALES=Object.freeze([.65,.8,1,1.25,1.5]);
export const BENCHMARK=Object.freeze({warmupMs:2000,measureMs:10000});
export function summarize(intervals,submit=[]){
 const valid=intervals.filter(v=>Number.isFinite(v)&&v>0),cpu=submit.filter(v=>Number.isFinite(v)&&v>=0);
 if(!valid.length)return null;
 const sorted=[...valid].sort((a,b)=>a-b),mean=valid.reduce((a,b)=>a+b,0)/valid.length;
 const round=v=>Math.round(v*100)/100;
 return {samples:valid.length,elapsedMs:round(mean*valid.length),fps:round(1000/mean),meanFrameMs:round(mean),p95FrameMs:round(sorted[Math.ceil(sorted.length*.95)-1]),maxFrameMs:round(sorted[sorted.length-1]),meanSubmitMs:cpu.length?round(cpu.reduce((a,b)=>a+b,0)/cpu.length):null};
}
export function createAdaptive(index=2){return {index:Math.max(0,Math.min(AUTO_SCALES.length-1,index)),low:0,high:0};}
export function adapt(state,stats){
 if(!stats||stats.samples<10)return {...state,low:0,high:0};
 let low=stats.fps<28||stats.p95FrameMs>50?state.low+1:0;
 let high=stats.fps>=50&&stats.p95FrameMs<=25?state.high+1:0;
 let index=state.index;
 if(low>=2){index=Math.max(0,index-1);low=high=0;}
 else if(high>=3){index=Math.min(AUTO_SCALES.length-1,index+1);low=high=0;}
 return {index,low,high};
}
export function effectiveDpr(mode,device,width,height,index=2,maxTexture=4096){
 const manual={eco:1,balanced:1.5,ultra:2},d=Number.isFinite(device)&&device>0?device:1;
 const w=Math.max(1,width),h=Math.max(1,height),hardware=Math.max(1,maxTexture)/Math.max(w,h);
 const cap=mode==='auto'?Math.min(AUTO_SCALES[index]||1,Math.sqrt(4000000/(w*h))):manual[mode]||1;
 return Math.min(d,cap,hardware);
}
export function benchmarkPhase(elapsed){return elapsed<BENCHMARK.warmupMs?'warmup':elapsed<BENCHMARK.warmupMs+BENCHMARK.measureMs?'measure':'done';}
