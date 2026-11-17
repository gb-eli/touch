/* AGV TOUCH Studio 3.5 — WebGL1; 3D real, sem CDN ou shaders externos. */
(()=>{
 'use strict';
 const V=window.AGVVoxels;if(!V)return;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const norm=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n)};
 const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
 const FACES=[
  {dir:[1,0,0],v:[[.5,-.5,-.5],[.5,-.5,.5],[.5,.5,.5],[.5,.5,-.5]]},
  {dir:[-1,0,0],v:[[-.5,-.5,.5],[-.5,-.5,-.5],[-.5,.5,-.5],[-.5,.5,.5]]},
  {dir:[0,1,0],v:[[-.5,.5,-.5],[.5,.5,-.5],[.5,.5,.5],[-.5,.5,.5]]},
  {dir:[0,-1,0],v:[[-.5,-.5,.5],[.5,-.5,.5],[.5,-.5,-.5],[-.5,-.5,-.5]]},
  {dir:[0,0,1],v:[[.5,-.5,.5],[-.5,-.5,.5],[-.5,.5,.5],[.5,.5,.5]]},
  {dir:[0,0,-1],v:[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5]]}
 ];
 const order=[0,1,2,0,2,3];
 function matrixP(aspect){
  const f=1/Math.tan(.84/2),n=.08,far=150,z=1/(n-far);
  return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+n)*z,-1,0,0,2*far*n*z,0]);
 }
 function matrixV(eye,target){
  const f=norm(sub(target,eye)),r=norm(cross(f,[0,1,0])),u=cross(r,f);
  return new Float32Array([r[0],u[0],-f[0],0,r[1],u[1],-f[1],0,
   r[2],u[2],-f[2],0,-dot(r,eye),-dot(u,eye),dot(f,eye),1]);
 }
 function program(gl){
  const shaders=[
   ['VERTEX_SHADER',[
    'attribute vec3 aPos;attribute vec3 aNorm;attribute vec2 aUV;',
    'uniform mat4 uP;uniform mat4 uV;varying vec2 vUV;varying float vLight;',
    'void main(){gl_Position=uP*uV*vec4(aPos,1.);vUV=aUV;',
    'vLight=.34+.66*max(dot(normalize(aNorm),normalize(vec3(.45,.82,.48))),0.);}'
   ].join('\n')],
   ['FRAGMENT_SHADER',[
    'precision mediump float;uniform sampler2D uTex;uniform float uLine;',
    'varying vec2 vUV;varying float vLight;',
    'void main(){if(uLine>.5){gl_FragColor=vec4(.46,.88,1.,1.);return;}',
    'vec4 c=texture2D(uTex,vUV);gl_FragColor=vec4(c.rgb*vLight,1.);}'
   ].join('\n')]
  ];
  const p=gl.createProgram();
  for(const [type,src] of shaders){
   const s=gl.createShader(gl[type]);gl.shaderSource(s,src);gl.compileShader(s);
   if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));
   gl.attachShader(p,s);gl.deleteShader(s);
  }
  gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));
  return{p,position:gl.getAttribLocation(p,'aPos'),normal:gl.getAttribLocation(p,'aNorm'),
   uv:gl.getAttribLocation(p,'aUV'),projection:gl.getUniformLocation(p,'uP'),
   view:gl.getUniformLocation(p,'uV'),texture:gl.getUniformLocation(p,'uTex'),
   line:gl.getUniformLocation(p,'uLine')};
 }
 function atlas(gl){
  const c=document.createElement('canvas');c.width=c.height=512;
  const ctx=c.getContext('2d');ctx.fillStyle='#0e0c1e';ctx.fillRect(0,0,512,512);
  V.MATERIALS.forEach(({id,color},i)=>{
   const x=(i%3)*128,y=Math.floor(i/3)*128;ctx.fillStyle=color;ctx.fillRect(x,y,128,128);
   let seed=9811*(i+1);
   const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   for(let j=0;j<1100;j++){
    const a=x+rand()*128,b=y+rand()*128;
    ctx.fillStyle=rand()>.5?'#ffffff26':'#0000002c';
    ctx.fillRect(a,b,1+rand()*3,id==='grass'?2+rand()*3:1+rand()*2);
   }
   if(['wood','brick','lava','ice','crystal'].includes(id)){
    ctx.strokeStyle=id==='lava'?'#ffc45a':'#1810236b';ctx.lineWidth=id==='brick'?3:1.5;
    for(let k=0;k<10;k++){
     const yy=y+k*14;
     ctx.beginPath();
     if(id==='ice'||id==='crystal'||id==='lava'){
      ctx.moveTo(x+rand()*120,yy);ctx.lineTo(x+rand()*120,yy+(rand()-.5)*90);
     }else{ctx.moveTo(x,yy);ctx.lineTo(x+128,yy+(rand()-.5)*5)}
     ctx.stroke();
    }
    if(id==='brick')for(let row=0;row<9;row++)for(let col=0;col<4;col++){
     const xx=x+col*40+row%2*20-20,yy=y+row*14;
     ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx,yy+14);ctx.stroke();
    }
   }
  });
  const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.generateMipmap(gl.TEXTURE_2D);return t;
 }
 const vec=(out,p,n,uv)=>out.push(p[0],p[1],p[2],n[0],n[1],n[2],uv[0],uv[1]);
 const line=(out,a,b)=>{vec(out,a,[0,1,0],[0,0]);vec(out,b,[0,1,0],[0,0])};
 function meshFor(world){
  const out=[],materials=new Map(V.MATERIALS.map((m,i)=>[m.id,i]));
  for(const b of world.blocks){
   const x=b.x-3.5,y=b.y+.5,z=b.z-3.5;
   const n=materials.get(b.material)||0,c=n%3,r=Math.floor(n/3);
   const u0=(c*128+2)/512,u1=(c*128+126)/512;
   const v0=(r*128+2)/512,v1=(r*128+126)/512;
   for(const face of FACES){
    const [a,d,e]=face.dir;
    if(world.has(b.x+a,b.y+d,b.z+e))continue;
    for(const i of order){
     const q=face.v[i],uv=[i===0||i===3?u0:u1,i<2?v0:v1];
     vec(out,[x+q[0],y+q[1],z+q[2]],face.dir,uv);
    }
   }
  }
  return new Float32Array(out);
 }
 function gridData(){
  const out=[];
  for(let i=-4;i<=4;i++){
   line(out,[i,.016,-4],[i,.016,4]);line(out,[-4,.016,i],[4,.016,i]);
  }
  return new Float32Array(out);
 }
 function outlineData(b){
  if(!b)return new Float32Array(0);
  const x=b.x-3.5,y=b.y+.5,z=b.z-3.5,q=.51;
  const verts=[[x-q,y-q,z-q],[x+q,y-q,z-q],[x+q,y-q,z+q],[x-q,y-q,z+q],
   [x-q,y+q,z-q],[x+q,y+q,z-q],[x+q,y+q,z+q],[x-q,y+q,z+q]];
  const out=[];
  for(const [a,b] of [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]])line(out,verts[a],verts[b]);
  return new Float32Array(out);
 }
 function create(canvas,world,{onStatus=()=>{},onChange=()=>{}}={}){
  let gl,p,tex,buffers,observer,lost=false,disposed=false,raf=0,dirty=true,count=0;
  let yaw=.72,pitch=.69,zoom=19,mode='place',material='grass',selected=null,hover=null;
  const focus=[0,2.1,0],pointers=new Map(),abort=new AbortController();
  let origin=null,pinch=0,pinchZoom=19,afterMulti=false;
  const eye=()=>[Math.sin(yaw)*Math.cos(pitch)*zoom,focus[1]+Math.sin(pitch)*zoom,
     Math.cos(yaw)*Math.cos(pitch)*zoom];
  function ray(clientX,clientY){
   const rect=canvas.getBoundingClientRect(),x=2*(clientX-rect.left)/rect.width-1,
     y=1-2*(clientY-rect.top)/rect.height,at=eye();
   const f=norm(sub(focus,at)),r=norm(cross(f,[0,1,0])),u=cross(r,f),
     spread=Math.tan(.84/2),aspect=rect.width/rect.height;
   const dir=norm([0,1,2].map(i=>f[i]+r[i]*x*aspect*spread+u[i]*y*spread));
   return V.raycast({x:at[0],y:at[1],z:at[2]},{x:dir[0],y:dir[1],z:dir[2]},world.blocks);
  }
  function init(){
   gl=canvas.getContext('webgl',{alpha:false,antialias:true,depth:true,powerPreference:'low-power'});
   if(!gl)return false;
   p=program(gl);tex=atlas(gl);
   buffers={mesh:gl.createBuffer(),grid:gl.createBuffer(),outline:gl.createBuffer()};
   gl.bindBuffer(gl.ARRAY_BUFFER,buffers.grid);gl.bufferData(gl.ARRAY_BUFFER,gridData(),gl.STATIC_DRAW);
   gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);dirty=true;
   return true;
  }
  function useBuffer(buffer,data){
   gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
   if(data)gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
   gl.enableVertexAttribArray(p.position);
   gl.enableVertexAttribArray(p.normal);
   gl.enableVertexAttribArray(p.uv);
   gl.vertexAttribPointer(p.position,3,gl.FLOAT,false,32,0);
   gl.vertexAttribPointer(p.normal,3,gl.FLOAT,false,32,12);
   gl.vertexAttribPointer(p.uv,2,gl.FLOAT,false,32,24);
  }
  function invalidate(rebuild=false){
   dirty=dirty||rebuild;
   if(!raf&&!lost&&!disposed)raf=requestAnimationFrame(draw);
  }
  function draw(){
   raf=0;if(disposed||lost||!canvas.isConnected)return;
   const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
   const dpr=Math.min(window.devicePixelRatio||1,2);
   const scale=dpr*Math.min(1,Math.sqrt(3200000/(r.width*r.height*dpr*dpr)));
   const w=Math.max(1,Math.floor(r.width*scale)),h=Math.max(1,Math.floor(r.height*scale));
   if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
   gl.viewport(0,0,w,h);gl.clearColor(.032,.022,.065,1);
   gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.useProgram(p.p);gl.uniformMatrix4fv(p.projection,false,matrixP(w/h));
   gl.uniformMatrix4fv(p.view,false,matrixV(eye(),focus));
   gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.uniform1i(p.texture,0);
   if(dirty){const m=meshFor(world);count=m.length/8;
     gl.bindBuffer(gl.ARRAY_BUFFER,buffers.mesh);gl.bufferData(gl.ARRAY_BUFFER,m,gl.DYNAMIC_DRAW);dirty=false}
   gl.uniform1f(p.line,0);useBuffer(buffers.mesh);
   if(count)gl.drawArrays(gl.TRIANGLES,0,count);
   gl.uniform1f(p.line,1);useBuffer(buffers.grid);gl.drawArrays(gl.LINES,0,36);
   const sel=mode==='move'?(selected||hover?.target):mode==='erase'?hover?.block:hover?.target;
   const outline=outlineData(sel);
   if(outline.length){useBuffer(buffers.outline,outline);gl.drawArrays(gl.LINES,0,outline.length/8)}
  }
  function change(action){invalidate(true);onChange(action,world)}
  function tap(hit){
   if(mode==='erase'){
    if(hit?.block&&world.remove(hit.block.x,hit.block.y,hit.block.z)){
     change('remove');onStatus('Bloco removido.','success');
    }else onStatus('Toque sobre o bloco que deseja remover.','warning');
   }else if(mode==='move'){
    if(!selected){
     if(hit?.block){selected=hit.block;onStatus('Origem selecionada: toque no destino ou arraste.');invalidate()}
     else onStatus('Escolha o bloco de origem.','warning');
    }else if(hit?.block&&V.key(...Object.values(hit.block))===V.key(...Object.values(selected))){
     selected=null;onStatus('Seleção cancelada.');invalidate();
    }else if(hit?.target&&world.move(selected,hit.target)){
     selected=null;change('move');onStatus('Bloco reposicionado.','success');
    }else onStatus('Destino ocupado, desconectado ou fora da grade.','warning');
   }else if(hit?.target&&world.add(hit.target.x,hit.target.y,hit.target.z,material)){
    change('add');onStatus('Bloco encaixado em XYZ.','success');
   }else onStatus('Escolha uma posição livre ligada à construção.','warning');
  }
  function down(e){
   if(e.pointerType==='mouse'&&e.button!==0)return;
   e.preventDefault();try{canvas.setPointerCapture(e.pointerId)}catch{}
   pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(pointers.size===1){origin={x:e.clientX,y:e.clientY,time:performance.now(),moved:false};afterMulti=false}
   if(pointers.size===2){
    afterMulti=true;origin=null;const [a,b]=[...pointers.values()];
    pinch=Math.hypot(a.x-b.x,a.y-b.y)||1;pinchZoom=zoom;
   }
  }
  function move(e){
   if(!pointers.has(e.pointerId))return;
   const p0=pointers.get(e.pointerId),dx=e.clientX-p0.x,dy=e.clientY-p0.y;
   p0.x=e.clientX;p0.y=e.clientY;
   if(pointers.size>=2){
    const [a,b]=[...pointers.values()];
    zoom=clamp(pinchZoom*pinch/(Math.hypot(a.x-b.x,a.y-b.y)||1),8,32);invalidate();return;
   }
   if(origin&&Math.hypot(e.clientX-origin.x,e.clientY-origin.y)>9)origin.moved=true;
   if(mode==='move'&&selected){hover=ray(e.clientX,e.clientY);invalidate();return}
   if(origin?.moved){yaw-=dx*.006;pitch=clamp(pitch+dy*.006,.19,1.45);invalidate()}
  }
  function up(e){
   if(!pointers.has(e.pointerId))return;
   const single=pointers.size===1;
   const tapped=single&&!afterMulti&&origin&&!origin.moved&&
    Math.hypot(e.clientX-origin.x,e.clientY-origin.y)<10&&performance.now()-origin.time<700;
   const hit=tapped?ray(e.clientX,e.clientY):null;
   pointers.delete(e.pointerId);
   if(!pointers.size){origin=null;afterMulti=false}
   else{origin=null;afterMulti=true}
   if(tapped)tap(hit);hover=null;invalidate();
  }
  function cancel(e){pointers.delete(e.pointerId);origin=null;afterMulti=true;hover=null;invalidate()}
  const signal=abort.signal;
  try{if(!init())return null}catch(e){onStatus('WebGL não disponível: use o construtor 2D.','warning');return null}
  canvas.addEventListener('pointerdown',down,{signal});
  canvas.addEventListener('pointermove',move,{signal});
  canvas.addEventListener('pointerup',up,{signal});
  canvas.addEventListener('pointercancel',cancel,{signal});
  canvas.addEventListener('lostpointercapture',cancel,{signal});
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom*Math.exp(e.deltaY*.0012),8,32);invalidate()},{signal,passive:false});
  canvas.addEventListener('contextmenu',e=>e.preventDefault(),{signal});
  canvas.addEventListener('webglcontextlost',e=>{
   e.preventDefault();lost=true;if(raf)cancelAnimationFrame(raf);raf=0;
   onStatus('Visualização 3D interrompida. Use o construtor 2D ou aguarde.','warning');
  },{signal});
  canvas.addEventListener('webglcontextrestored',()=>{
   try{lost=false;init();invalidate(true);onStatus('WebGL restaurado.','success')}
   catch{lost=true;onStatus('Não foi possível restaurar o 3D. Use o modo 2D.','warning')}
  },{signal});
  if('ResizeObserver'in window){observer=new ResizeObserver(()=>invalidate());observer.observe(canvas)}
  else window.addEventListener('resize',()=>invalidate(),{signal});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)invalidate()},{signal});
  invalidate(true);
  return Object.freeze({
   get mode(){return mode},get camera(){return{yaw,pitch,zoom}},get supported(){return !lost},
   setMode(value){if(['place','move','erase'].includes(value)){mode=value;selected=null;hover=null;invalidate()}},
   setMaterial(value){if(V.MATERIALS.some(m=>m.id===value)){material=value;selected=null;mode='place';invalidate()}},
   rotate(value){yaw+=value;invalidate()},zoom(value){zoom=clamp(zoom+value,8,32);invalidate()},
   resetCamera(){yaw=.72;pitch=.69;zoom=19;invalidate()},
   refresh:()=>invalidate(true),
   dispose(){
    disposed=true;abort.abort();observer?.disconnect();
    if(raf)cancelAnimationFrame(raf);
    if(gl&&!lost){for(const b of Object.values(buffers))gl.deleteBuffer(b);
     gl.deleteTexture(tex);gl.deleteProgram(p.p)}
   }
  });
 }
 window.AGVVoxelRenderer=Object.freeze({create});
})();