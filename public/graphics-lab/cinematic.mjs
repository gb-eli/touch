import * as THREE from 'three';
import {targetSizes} from './cinematic-core.mjs';
const vertex=`
 varying vec2 vUv;
 void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}
`;
const bright=`
 varying vec2 vUv;
 uniform sampler2D source;
 uniform vec2 texel;
 uniform float threshold;
 void main(){
  vec3 c=(texture2D(source,vUv+texel*vec2(-1.,-1.)).rgb+texture2D(source,vUv+texel*vec2(1.,-1.)).rgb+texture2D(source,vUv+texel*vec2(-1.,1.)).rgb+texture2D(source,vUv+texel*vec2(1.,1.)).rgb)*.25;
  float l=max(c.r,max(c.g,c.b));
  gl_FragColor=vec4(c*max(0.,l-threshold)/max(l,.0001),1.);
 }
`;
const blur=`
 varying vec2 vUv;
 uniform sampler2D source;
 uniform vec2 stepUV;
 void main(){
  vec3 c=texture2D(source,vUv).rgb*.227027;
  c+=(texture2D(source,vUv+stepUV*1.384615).rgb+texture2D(source,vUv-stepUV*1.384615).rgb)*.316216;
  c+=(texture2D(source,vUv+stepUV*3.230769).rgb+texture2D(source,vUv-stepUV*3.230769).rgb)*.070270;
  gl_FragColor=vec4(c,1.);
 }
`;
const output=`
 varying vec2 vUv;
 uniform sampler2D sceneColor;
 uniform sampler2D sceneDepth;
 uniform sampler2D bloomMap;
 uniform vec2 texel;
 uniform float nearPlane,farPlane,bloomAmount,aoAmount,vignette,saturation,contrast,warmth,edgeAA;
 float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
 float viewDepth(vec2 uv){float d=texture2D(sceneDepth,uv).r;return nearPlane*farPlane/max(farPlane-d*(farPlane-nearPlane),.0001);}
 float neighborAO(vec2 uv,float center){
  float d=texture2D(sceneDepth,uv).r;
  if(d>=.999999)return 0.;
  float delta=center-viewDepth(uv);
  return smoothstep(.012,.10,delta)*(1.-smoothstep(.12,.45,delta));
 }
 void main(){
  vec3 c=texture2D(sceneColor,vUv).rgb;
  if(edgeAA>.5){
   vec3 n=texture2D(sceneColor,vUv+vec2(0.,texel.y)).rgb,s=texture2D(sceneColor,vUv-vec2(0.,texel.y)).rgb;
   vec3 e=texture2D(sceneColor,vUv+vec2(texel.x,0.)).rgb,w=texture2D(sceneColor,vUv-vec2(texel.x,0.)).rgb;
   float lo=min(lum(c),min(min(lum(n),lum(s)),min(lum(e),lum(w))));
   float hi=max(lum(c),max(max(lum(n),lum(s)),max(lum(e),lum(w))));
   float edge=smoothstep(.06,.20,(hi-lo)/max(hi,.10));
   vec3 across=abs(lum(n)-lum(s))>abs(lum(e)-lum(w))?(n+s)*.5:(e+w)*.5;
   c=mix(c,across,edge*.28);
  }
  if(aoAmount>.001&&texture2D(sceneDepth,vUv).r<.999999){
   float center=viewDepth(vUv),r=clamp(32./max(center,1.),2.,7.);
   vec2 d=texel*r;
   float occ=neighborAO(vUv+vec2(d.x,0.),center)+neighborAO(vUv-vec2(d.x,0.),center)+neighborAO(vUv+vec2(0.,d.y),center)+neighborAO(vUv-vec2(0.,d.y),center);
   occ+=neighborAO(vUv+d*.707,center)+neighborAO(vUv-d*.707,center)+neighborAO(vUv+vec2(d.x,-d.y)*.707,center)+neighborAO(vUv+vec2(-d.x,d.y)*.707,center);
   c*=1.-clamp(occ*.125*aoAmount,0.,.55);
  }
  if(bloomAmount>.001)c+=texture2D(bloomMap,vUv).rgb*bloomAmount;
  c=mix(vec3(lum(c)),c,saturation);
  c*=vec3(1.+warmth*.18,1.,1.-warmth*.18);
  c=max(vec3(0.),(c-vec3(.18))*contrast+vec3(.18));
  vec2 uv=vUv*2.-1.;
  c*=1.-clamp(vignette,0.,.7)*smoothstep(.35,1.45,dot(uv,uv));
  gl_FragColor=vec4(c,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }
`;
const U=value=>({value});
const material=(fragmentShader,uniforms,toneMapped=false)=>new THREE.ShaderMaterial({vertexShader,fragmentShader,uniforms,toneMapped,depthTest:false,depthWrite:false,blending:THREE.NoBlending});
export class CinematicPipeline{
 constructor(renderer){
  this.renderer=renderer;this.supported=renderer.extensions.has('EXT_color_buffer_float');this.failed=false;this.targets=[];this.width=0;this.height=0;
  this.quadScene=new THREE.Scene();this.quadCamera=new THREE.Camera();this.geometry=new THREE.PlaneGeometry(2,2);
  this.bright=material(bright,{source:U(null),texel:U(new THREE.Vector2()),threshold:U(1.2)});
  this.blur=material(blur,{source:U(null),stepUV:U(new THREE.Vector2())});
  this.output=material(output,{sceneColor:U(null),sceneDepth:U(null),bloomMap:U(null),texel:U(new THREE.Vector2()),nearPlane:U(.05),farPlane:U(100),bloomAmount:U(0),aoAmount:U(0),vignette:U(0),saturation:U(1),contrast:U(1),warmth:U(0),edgeAA:U(0)},true);
  this.quad=new THREE.Mesh(this.geometry,this.output);this.quad.frustumCulled=false;this.quadScene.add(this.quad);
 }
 release(){for(const target of this.targets){target.dispose();}this.targets=[];this.width=0;this.height=0;
  this.bright.uniforms.source.value=null;this.blur.uniforms.source.value=null;for(const k of ['sceneColor','sceneDepth','bloomMap'])this.output.uniforms[k].value=null;
 }
 allocate(width,height,withBloom){
  if(this.width===width&&this.height===height&&this.targets.length===(withBloom?3:1))return;
  this.release();const size=targetSizes(width,height);
  const make=(w,h,depth)=>{const t=new THREE.WebGLRenderTarget(w,h,{type:THREE.HalfFloatType,format:THREE.RGBAFormat,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:depth,stencilBuffer:false,generateMipmaps:false});this.targets.push(t);if(depth){t.depthTexture=new THREE.DepthTexture(w,h,THREE.UnsignedIntType);t.depthTexture.minFilter=t.depthTexture.magFilter=THREE.NearestFilter;}return t;};
  make(size.width,size.height,true);if(withBloom){make(size.bloomWidth,size.bloomHeight,false);make(size.bloomWidth,size.bloomHeight,false);}
  const gl=this.renderer.getContext();for(const t of this.targets){this.renderer.setRenderTarget(t);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Framebuffer HDR indisponível');}
  this.renderer.setRenderTarget(null);this.width=width;this.height=height;
 }
 pass(mat,target){this.quad.material=mat;this.renderer.setRenderTarget(target);this.renderer.render(this.quadScene,this.quadCamera);}
 render(scene,camera,settings){
  const r=this.renderer;
  if(!settings.enabled||!this.supported||this.failed){this.release();r.setRenderTarget(null);r.info.reset();r.render(scene,camera);return {active:false};}
  const oldReset=r.info.autoReset,oldError=r.debug.onShaderError;let shaderFailed=false;
  try{
   r.debug.onShaderError=(...args)=>{shaderFailed=true;if(typeof oldError==='function')oldError(...args);};
   r.info.autoReset=false;r.info.reset();
   const width=r.domElement.width,height=r.domElement.height,withBloom=settings.bloom>.001;
   this.allocate(width,height,withBloom);
   const [base,a,b]=this.targets;
   r.setRenderTarget(base);r.render(scene,camera);
   if(withBloom){const u=this.bright.uniforms;u.source.value=base.texture;u.texel.value.set(1/width,1/height);u.threshold.value=settings.threshold;this.pass(this.bright,a);
    const v=this.blur.uniforms;v.source.value=a.texture;v.stepUV.value.set(1/a.width,0);this.pass(this.blur,b);v.source.value=b.texture;v.stepUV.value.set(0,1/b.height);this.pass(this.blur,a);}
   const u=this.output.uniforms;u.sceneColor.value=base.texture;u.sceneDepth.value=base.depthTexture;u.bloomMap.value=withBloom?a.texture:base.texture;u.texel.value.set(1/width,1/height);u.nearPlane.value=camera.near;u.farPlane.value=camera.far;u.bloomAmount.value=settings.bloom;u.aoAmount.value=settings.ao;u.vignette.value=settings.vignette;u.saturation.value=settings.saturation;u.contrast.value=settings.contrast;u.warmth.value=settings.warmth;u.edgeAA.value=settings.aa;
   this.pass(this.output,null);if(shaderFailed)throw Error('Falha de compilação de shader');return {active:true,passes:withBloom?5:2};
  }catch(e){this.failed=true;r.setRenderTarget(null);this.release();r.info.reset();r.debug.onShaderError=oldError;r.render(scene,camera);return {active:false,error:String(e?.message||e)};}
  finally{r.info.autoReset=oldReset;r.debug.onShaderError=oldError;r.setRenderTarget(null);}
 }
 dispose(){this.release();this.geometry.dispose();this.bright.dispose();this.blur.dispose();this.output.dispose();}
}
