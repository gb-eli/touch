import * as THREE from 'three';
import {CAPACITY,SEED,IMPACT_DURATION,effects,createPool,fillParticles,particleBudget} from './particle-core.mjs';
const vertex=`
 attribute float particleSize;
 attribute float particleOpacity;
 uniform float pixelScale,worldScale,maxPointSize;
 varying float vOpacity;
 void main(){
  vec4 mv=modelViewMatrix*vec4(position,1.0);
  gl_Position=projectionMatrix*mv;
  gl_PointSize=clamp(particleSize*worldScale*pixelScale/max(-mv.z,.1),1.,maxPointSize);
  vOpacity=particleOpacity;
 }
`;
const fragment=`
 uniform vec3 tint;
 uniform float emission,softness;
 varying float vOpacity;
 void main(){
  float r=length(gl_PointCoord*2.-1.);
  float falloff=1.-smoothstep(softness,1.,r);
  float a=falloff*vOpacity;
  if(a<.004)discard;
  vec3 c=tint*emission;
  gl_FragColor=vec4(c,a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }
`;
export class ParticleEngine{
 constructor(renderer,scene){
  this.scene=scene;this.renderer=renderer;this.pool=createPool(CAPACITY,SEED);this.id='off';this.time=0;this.running=false;this.count=0;this.disposed=false;this.intensity=1;this.density=1;this.lastUpdateKey='';
  const g=this.geometry=new THREE.BufferGeometry();
  for(const [name,array,size] of [['position',this.pool.positions,3],['particleSize',this.pool.sizes,1],['particleOpacity',this.pool.opacity,1]])g.setAttribute(name,new THREE.BufferAttribute(array,size).setUsage(THREE.DynamicDrawUsage));
  g.setDrawRange(0,0);
  const gl=renderer.getContext(),range=gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
  this.material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{tint:{value:new THREE.Color(0xffffff)},emission:{value:1},softness:{value:.1},pixelScale:{value:1},worldScale:{value:1},maxPointSize:{value:Math.min(96,range?.[1]||16)}},transparent:true,depthTest:true,depthWrite:false,toneMapped:true,blending:THREE.AdditiveBlending});
  this.points=new THREE.Points(g,this.material);this.points.frustumCulled=false;this.points.visible=false;this.points.renderOrder=20;scene.add(this.points);
 }
 select(id){if(!Object.hasOwn(effects,id))return;this.id=id;this.time=0;this.running=id!=='off';const p=effects[id];this.material.uniforms.tint.value.setHex(p.color);this.material.uniforms.emission.value=p.emission;this.material.uniforms.softness.value=id==='mist'?0:.14;this.material.blending=p.additive?THREE.AdditiveBlending:THREE.NormalBlending;this.material.needsUpdate=true;this.points.visible=id!=='off';}
 setRunning(running){if(this.id==='off')return;if(this.id==='impact'&&this.time>=IMPACT_DURATION&&running)this.time=0;this.running=!!running;}
 restart(){if(this.id==='off')return;this.time=0;this.running=true;}
 get active(){return !this.disposed&&this.running&&this.id!=='off';}
 update(dt,{quality='auto',index=2,density=1,intensity=1,radius=1,camera}={}){
  if(this.disposed)return;this.density=density;this.intensity=intensity;
  if(this.active)this.time+=Math.min(.05,Math.max(0,Number.isFinite(dt)?dt:0));
  if(this.id==='impact'&&this.time>=IMPACT_DURATION){this.time=IMPACT_DURATION;this.running=false;}
  const count=this.id==='off'||intensity<=0||this.id==='impact'&&this.time>=IMPACT_DURATION?0:particleBudget(quality,index,density);
  const scale=Math.max(.5,Math.min(3.5,radius));this.points.scale.setScalar(scale);
  this.material.uniforms.worldScale.value=scale;
  this.material.uniforms.pixelScale.value=this.renderer.domElement.height*(camera?.projectionMatrix.elements[5]||1)*.5;
  const key=[this.id,this.time,count,intensity].join(':');if(key===this.lastUpdateKey)return;this.lastUpdateKey=key;this.count=fillParticles(this.pool,this.id,this.time,count,intensity);this.geometry.setDrawRange(0,this.count);this.points.visible=this.count>0;
  if(this.count)for(const name of ['position','particleSize','particleOpacity']){const a=this.geometry.getAttribute(name);a.clearUpdateRanges();a.addUpdateRange(0,this.count*a.itemSize);a.needsUpdate=true;}
 }
 snapshot(){return {preset:this.id,playing:this.active,particles:this.count,density:this.density,intensity:this.intensity,seed:this.pool.seed,simulationTime:Math.round(this.time*1000)/1000,pointSizeLimit:this.material.uniforms.maxPointSize.value};}
 dispose(){if(this.disposed)return;this.disposed=true;this.running=false;this.scene.remove(this.points);this.geometry.dispose();this.material.dispose();}
}
