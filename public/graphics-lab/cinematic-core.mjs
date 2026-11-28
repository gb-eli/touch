export const presets=Object.freeze({
 off:Object.freeze({name:'Original',bloom:0,threshold:1.2,ao:0,vignette:0,saturation:1,contrast:1,warmth:0,aa:0}),
 studio:Object.freeze({name:'Estúdio',bloom:.14,threshold:1.45,ao:.24,vignette:.12,saturation:1.03,contrast:1.04,warmth:0,aa:1}),
 cinema:Object.freeze({name:'Cinema',bloom:.28,threshold:1.2,ao:.36,vignette:.34,saturation:.92,contrast:1.12,warmth:.12,aa:1}),
 technical:Object.freeze({name:'Técnico',bloom:0,threshold:1.5,ao:.32,vignette:0,saturation:1,contrast:1.02,warmth:0,aa:1})
});
export function resolveEffects({preset='studio',strength=1,quality='auto',index=2,width=1,height=1,supported=true}={}){
 const p=presets[preset]||presets.off,s=Number.isFinite(strength)?Math.min(1.5,Math.max(0,strength)):1;
 const reason=!supported?'unsupported':preset==='off'||!presets[preset]||s===0?'off':quality==='eco'?'eco':quality==='auto'&&index<=1?'adaptive':width*height>4000000?'pixel-budget':null;
 if(reason)return {...presets.off,enabled:false,reason};
 const lite=quality==='auto'&&index===2;
 return {enabled:true,reason:null,name:p.name,bloom:lite?0:p.bloom*s,threshold:p.threshold,ao:lite?0:p.ao*s,vignette:p.vignette*s,saturation:1+(p.saturation-1)*s,contrast:1+(p.contrast-1)*s,warmth:p.warmth*s,aa:p.aa};
}
export function targetSizes(width,height){
 const w=Math.max(1,Math.floor(width)),h=Math.max(1,Math.floor(height));
 return {width:w,height:h,bloomWidth:Math.max(1,Math.ceil(w/4)),bloomHeight:Math.max(1,Math.ceil(h/4))};
}
