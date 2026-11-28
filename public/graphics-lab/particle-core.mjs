// Deterministic particle simulation, independent of Three.js and the DOM.
export const CAPACITY=1536, SEED=2026, IMPACT_DURATION=1.4;
const TAU=Math.PI*2;
export const effects=Object.freeze({
 off:{name:'Desativado',color:0xffffff,additive:false,emission:1},
 energy:{name:'Energia orbital',color:0x47cfff,additive:true,emission:3.4},
 sparks:{name:'Faíscas',color:0xff9a32,additive:true,emission:4.5},
 mist:{name:'Névoa',color:0x9fb9cf,additive:false,emission:1},
 trail:{name:'Trilha luminosa',color:0x62caff,additive:true,emission:3.2},
 hologram:{name:'Varredura holográfica',color:0x40efcf,additive:true,emission:2.5},
 impact:{name:'Onda de impacto',color:0xffbd58,additive:true,emission:4}
});
export function particleBudget(quality,index=2,density=1){
 const max=quality==='eco'?96:quality==='balanced'?640:quality==='ultra'?1536:[96,192,384,640,1024][Math.min(4,Math.max(0,index))]||384;
 return Math.min(CAPACITY,Math.max(0,Math.floor(max*Math.min(1,Math.max(0,Number.isFinite(density)?density:1)))));
}
export function createPool(capacity=CAPACITY,seed=SEED){
 const n=Math.min(CAPACITY,Math.max(1,Math.floor(capacity)||1));let state=seed>>>0||1;
 const rnd=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};
 const random=new Float32Array(n*5);for(let i=0;i<random.length;i++)random[i]=rnd();
 return {capacity:n,seed,random,positions:new Float32Array(n*3),sizes:new Float32Array(n),opacity:new Float32Array(n)};
}
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const fract=v=>v-Math.floor(v);
export function fillParticles(pool,id,time,count,intensity=1){
 if(!Object.hasOwn(effects,id))throw Error('Efeito desconhecido');
 const n=id==='off'?0:Math.min(pool.capacity,Math.max(0,Math.floor(count)||0)),t=Math.max(0,Number.isFinite(time)?time:0),power=clamp(Number.isFinite(intensity)?intensity:1,0,1.5);
 for(let i=0;i<n;i++){
  const k=i*5,a=pool.random[k],b=pool.random[k+1],c=pool.random[k+2],d=pool.random[k+3],e=pool.random[k+4];
  let x=0,y=0,z=0,size=.025,alpha=1;
  if(id==='energy'){
   const angle=a*TAU+t*(.55+b*.75),rad=.77+c*.34;
   x=Math.cos(angle)*rad;y=(b-.5)*.80+Math.sin(angle*2+d*TAU)*.12;z=Math.sin(angle)*rad;
   size=.014+d*.03;alpha=.35+.65*Math.pow(.5+.5*Math.sin(t*4+e*TAU),2);
  }else if(id==='sparks'){
   const life=.45+b*.85,p=fract(t/life+a),age=p*life,angle=c*TAU;
   const rad=.52+age*(.35+d*.65);x=Math.cos(angle)*rad;z=Math.sin(angle)*rad;
   y=-.72+age*(1.25+e*1.4)-age*age*1.15;
   size=.012+d*.024;alpha=Math.pow(1-p,1.4)*Math.min(1,p*12);
  }else if(id==='mist'){
   const life=3+b*3,p=fract(t/life+a),angle=c*TAU+p*.9,rad=.60+d*.45+p*.15;
   x=Math.cos(angle)*rad;y=-.8+p*1.55;z=Math.sin(angle)*rad;
   size=.11+p*.14+e*.06;alpha=Math.sin(p*Math.PI)*.12;
  }else if(id==='trail'){
   const lane=i%3,p=(i%192)/192,angle=t*1.6+lane*TAU/3-p*2.9,rad=.94+lane*.07;
   x=Math.cos(angle)*rad;y=Math.sin(angle*.9+lane*1.8)*.47;z=Math.sin(angle)*rad;
   x+=(a-.5)*.045;y+=(b-.5)*.045;z+=(c-.5)*.045;
   size=.012+(1-p)*.035;alpha=(1-p)*(1-p)*(.65+d*.35);
  }else if(id==='hologram'){
   const band=fract(t*.36),angle=a*TAU,rad=.88+.13*Math.sin(b*Math.PI);
   x=Math.cos(angle)*rad;z=Math.sin(angle)*rad;y=-.83+band*1.66+(c-.5)*.10;
   size=.013+d*.021;alpha=(.3+.7*e)*Math.sin(band*Math.PI);
  }else if(id==='impact'){
   const p=clamp(t/IMPACT_DURATION,0,1),angle=a*TAU,rad=.17+p*1.14+(b-.5)*.09;
   x=Math.cos(angle)*rad;z=Math.sin(angle)*rad;y=-.62+Math.sin(p*Math.PI)*.35*(c-.5);
   size=.022+d*.035;alpha=Math.pow(1-p,1.5)*Math.min(1,p*18)*(.45+.55*e);
  }
  pool.positions[i*3]=x;pool.positions[i*3+1]=y;pool.positions[i*3+2]=z;
  pool.sizes[i]=size;pool.opacity[i]=clamp(alpha*power,0,1);
 }
 return n;
}
