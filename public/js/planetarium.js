/* TV TOUCH / Planetário WebGL nativo — sem CDN, com fallback Canvas 2D.
   Renderização ilustrativa: modelos e proporções não estão em escala astronômica. */
(() => {
  'use strict';
  const canvas = document.getElementById('cosmosCanvas');
  if (!canvas) return;
  const status = document.getElementById('cosmosStatus');
  const zoomInput = document.getElementById('cosmosZoom');
  const zoomValue = document.getElementById('cosmosZoomValue');
  const motionButton = document.getElementById('cosmosMotion');
  const data = {
    earth: { name: 'Terra', desc: 'Oceanos, continentes e nuvens. É o único planeta conhecido com vida.', kind: 1 },
    mars: { name: 'Marte', desc: 'Planeta rochoso com coloração avermelhada, crateras e atmosfera rarefeita.', kind: 2 },
    jupiter: { name: 'Júpiter', desc: 'Gigante gasoso com faixas de nuvens e grandes tempestades.', kind: 3 },
    saturn: { name: 'Saturno', desc: 'Gigante gasoso com anéis formados principalmente por partículas de gelo e rocha.', kind: 4 },
    neptune: { name: 'Netuno', desc: 'Gigante de gelo, azul devido à absorção de luz pelo metano da atmosfera.', kind: 5 }
  };
  const state = {planet:'earth', rotX:-.16, rotY:.6, zoom:1, auto:true, active:false, pointers:new Map(), lastTime:0, gl:null, renderer:null, fallback:null};
  const vert = `attribute vec3 aPos; attribute vec2 aUv; uniform vec2 uRot; uniform float uZoom; uniform float uAspect; uniform float uRing; varying vec3 vNormal; varying vec2 vUv; varying vec3 vPoint;
  void main(){
    vec3 p=aPos;
    if(uRing>.5){float t=.42; p=vec3(p.x,p.y*cos(t)-p.z*sin(t),p.y*sin(t)+p.z*cos(t));}
    float cx=cos(uRot.x),sx=sin(uRot.x),cy=cos(uRot.y),sy=sin(uRot.y);
    p=vec3(p.x,p.y*cx-p.z*sx,p.y*sx+p.z*cx);
    p=vec3(p.x*cy+p.z*sy,p.y,-p.x*sy+p.z*cy);
    vNormal=normalize(p); vUv=aUv; vPoint=p;
    float depth=4.55/uZoom-p.z;
    gl_Position=vec4(p.x*2.9/uAspect,p.y*2.9,depth-2.0,depth);
  }`;
  const frag = `precision mediump float;
  uniform int uKind;uniform float uRing;uniform float uTime;
  varying vec3 vNormal;varying vec2 vUv;varying vec3 vPoint;
  float rnd(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
  float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(mix(rnd(i),rnd(i+vec3(1,0,0)),f.x),mix(rnd(i+vec3(0,1,0)),rnd(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(rnd(i+vec3(0,0,1)),rnd(i+vec3(1,0,1)),f.x),mix(rnd(i+vec3(0,1,1)),rnd(i+vec3(1,1,1)),f.x),f.y),f.z);}
  float fbm(vec3 p){float v=0.;float a=.5;for(int i=0;i<4;i++){v+=noise3(p)*a;p=p*2.07+8.31;a*=.5;}return v;}
  void main(){
    if(uRing>.5){float r=vUv.x;float edge=smoothstep(1.28,1.37,r)*(1.-smoothstep(2.05,2.18,r));
      float band=.62+.30*sin(r*92.)+.12*sin(r*210.);
      vec3 col=mix(vec3(.33,.22,.18),vec3(.90,.77,.58),clamp(band,0.,1.));
      gl_FragColor=vec4(col*clamp(.65+dot(vNormal,normalize(vec3(-.5,.7,1.)))*.35,.45,1.),edge*.87);return;}
    vec3 p=normalize(vNormal);float n=fbm(p*3.8+vec3(uTime*.0003));vec3 color=vec3(.1,.3,.8);
    if(uKind==1){float land=smoothstep(.49,.62,fbm(p*3.0+vec3(4.,2.,9.)));
      color=mix(mix(vec3(.01,.09,.25),vec3(.04,.37,.61),n),mix(vec3(.08,.27,.11),vec3(.47,.41,.21),n),land);
      color=mix(color,vec3(.92,.96,1.),smoothstep(.79,.94,abs(p.y))*.85);
      color=mix(color,vec3(.87,.94,1.),smoothstep(.64,.77,fbm(p*16.+vec3(7.)))*.45);
    }else if(uKind==2){float cr=noise3(p*29.);color=mix(vec3(.28,.065,.037),vec3(.89,.34,.15),smoothstep(.13,.8,n));
      color*=1.-.27*smoothstep(.79,.93,cr);color=mix(color,vec3(.91,.70,.56),smoothstep(.83,.96,abs(p.y))*.32);
    }else if(uKind==3){float b=sin(p.y*39.+sin(p.x*3.)*1.5+n*2.9);float t=smoothstep(-.5,.65,b);
      color=mix(vec3(.51,.19,.13),vec3(.92,.78,.56),t);color=mix(color,vec3(.95,.87,.74),smoothstep(.53,.82,n)*.32);
      color*=.87+.13*sin(p.y*78.);
    }else if(uKind==4){float b=sin(p.y*49.+n*2.);color=mix(vec3(.53,.40,.26),vec3(.91,.78,.53),smoothstep(-.8,.75,b));
      color+=vec3(.07,.04,.01)*sin(p.y*91.);
    }else{float b=sin(p.y*35.+n*6.);color=mix(vec3(.012,.08,.35),vec3(.09,.43,.88),smoothstep(-.9,.9,b));color+=n*.09;}
    float diffuse=max(.06,dot(p,normalize(vec3(-.50,.59,.78))));
    float shade=.18+diffuse*.92;float rim=pow(1.-max(0.,p.z),3.);
    vec3 lit=color*shade+vec3(.23,.34,.58)*rim*.11;
    float spec=pow(max(0.,dot(reflect(-normalize(vec3(-.50,.59,.78)),p),vec3(0.,0.,1.))),28.);
    lit+=vec3(.65,.75,1.)*spec*.17;
    gl_FragColor=vec4(lit,1.);
  }`;
  function meshSphere(){
    const verts=[], indices=[],rows=52,cols=104;
    for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){
      const t=y/rows*Math.PI,a=x/cols*Math.PI*2;
      verts.push(Math.sin(t)*Math.cos(a),Math.cos(t),Math.sin(t)*Math.sin(a),x/cols,y/rows);
    }
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=y*(cols+1)+x,b=a+cols+1;indices.push(a,b,a+1,b,b+1,a+1);}
    return {verts:new Float32Array(verts),indices:new Uint16Array(indices)};
  }
  function meshRing(){
    const verts=[],indices=[],sides=128;
    for(let i=0;i<=sides;i++)for(const r of [1.29,2.2]){
      const a=i/sides*Math.PI*2;verts.push(r*Math.cos(a),0,r*Math.sin(a),r,i/sides);
    }
    for(let i=0;i<sides;i++){const v=i*2;indices.push(v,v+1,v+2,v+1,v+3,v+2);}
    return {verts:new Float32Array(verts),indices:new Uint16Array(indices)};
  }
  function compile(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
  function createWebGL(){
    const gl=canvas.getContext('webgl',{alpha:false,antialias:true,preserveDrawingBuffer:false,powerPreference:'high-performance'});
    if(!gl) return null;
    try{
      const program=gl.createProgram();gl.attachShader(program,compile(gl,gl.VERTEX_SHADER,vert));gl.attachShader(program,compile(gl,gl.FRAGMENT_SHADER,frag));gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);const sphere=meshSphere(),ring=meshRing();
      const makeBuffers=data=>{const pos=gl.createBuffer(),idx=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,pos);gl.bufferData(gl.ARRAY_BUFFER,data.verts,gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,idx);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,data.indices,gl.STATIC_DRAW);return{pos,idx,count:data.indices.length};};
      const buffers={sphere:makeBuffers(sphere),ring:makeBuffers(ring)};
      const u={rot:gl.getUniformLocation(program,'uRot'),zoom:gl.getUniformLocation(program,'uZoom'),aspect:gl.getUniformLocation(program,'uAspect'),kind:gl.getUniformLocation(program,'uKind'),ring:gl.getUniformLocation(program,'uRing'),time:gl.getUniformLocation(program,'uTime')};
      const attr={pos:gl.getAttribLocation(program,'aPos'),uv:gl.getAttribLocation(program,'aUv')};
      gl.enableVertexAttribArray(attr.pos);gl.enableVertexAttribArray(attr.uv);
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
      function render(now){
        const w=Math.min(1400,Math.max(2,Math.round(canvas.clientWidth*Math.min(devicePixelRatio||1,1.3))));
        const h=Math.min(900,Math.max(2,Math.round(canvas.clientHeight*Math.min(devicePixelRatio||1,1.3))));
        if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
        gl.clearColor(.012,.021,.06,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        gl.useProgram(program);gl.uniform2f(u.rot,state.rotX,state.rotY);gl.uniform1f(u.zoom,state.zoom);gl.uniform1f(u.aspect,w/h);gl.uniform1i(u.kind,data[state.planet].kind);gl.uniform1f(u.time,now);
        function draw(which,isRing){const b=buffers[which];gl.bindBuffer(gl.ARRAY_BUFFER,b.pos);gl.vertexAttribPointer(attr.pos,3,gl.FLOAT,false,20,0);gl.vertexAttribPointer(attr.uv,2,gl.FLOAT,false,20,12);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b.idx);gl.uniform1f(u.ring,isRing?1:0);gl.drawElements(gl.TRIANGLES,b.count,gl.UNSIGNED_SHORT,0);}
        draw('sphere',false);
        if(state.planet==='saturn'){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);draw('ring',true);gl.depthMask(true);gl.disable(gl.BLEND);}
      }
      return render;
    }catch(e){console.warn('TV TOUCH WebGL',e);return null;}
  }
  function createFallback(){
    const ctx=canvas.getContext('2d');if(!ctx) return()=>{};
    const colors={earth:['#67d7ff','#0075bc','#07133d'],mars:['#ffd09a','#a44225','#3c1123'],jupiter:['#fff4d6','#d8995f','#5c251e'],saturn:['#ffe3a8','#bd9663','#563326'],neptune:['#85bdff','#125fd8','#07134e']};
    return now=>{
      const w=canvas.width=Math.max(2,canvas.clientWidth),h=canvas.height=Math.max(2,canvas.clientHeight);ctx.fillStyle='#030817';ctx.fillRect(0,0,w,h);
      const cx=w/2,cy=h/2,r=Math.min(w,h)*.30*state.zoom;const c=colors[state.planet];
      const g=ctx.createRadialGradient(cx-r*.35,cy-r*.4,r*.04,cx,cy,r);g.addColorStop(0,c[0]);g.addColorStop(.42,c[1]);g.addColorStop(1,c[2]);
      ctx.save();ctx.translate(cx,cy);ctx.rotate(state.rotX*.3);if(state.planet==='saturn'){ctx.beginPath();ctx.ellipse(0,0,r*1.7,r*.39,-.28,0,Math.PI*2);ctx.strokeStyle='#dab88aa6';ctx.lineWidth=r*.14;ctx.stroke();}ctx.restore();
      ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=g;ctx.shadowBlur=r*.32;ctx.shadowColor=c[1];ctx.fill();ctx.shadowBlur=0;
      status.textContent='Modo 2D compatível';
    };
  }
  function ensureRenderer(){
    if(state.renderer) return;
    state.renderer=createWebGL()||createFallback();
    if(state.renderer && canvas.getContext('webgl')) status.textContent='3D / WebGL';
  }
  function setPlanet(id){
    if(!data[id])return;state.planet=id;
    document.getElementById('planetName').textContent=data[id].name;
    document.getElementById('planetFacts').textContent=data[id].desc;
    document.querySelectorAll('[data-planet]').forEach(b=>b.classList.toggle('active',b.dataset.planet===id));
    renderOnce();
  }
  function setZoom(value){state.zoom=Math.max(.65,Math.min(1.9,value));zoomInput.value=Math.round(state.zoom*100);zoomValue.textContent=`${Math.round(state.zoom*100)}%`;renderOnce();}
  function renderOnce(){if(state.active){ensureRenderer();state.renderer(performance.now());}}
  let raf=0;
  function frame(t){if(!state.active||document.hidden)return;if(state.auto&&!matchMedia('(prefers-reduced-motion: reduce)').matches)state.rotY+=Math.min(.03,(t-state.lastTime||17)/14000);state.lastTime=t;state.renderer?.(t);raf=requestAnimationFrame(frame);}
  function activate(on){state.active=on;cancelAnimationFrame(raf);raf=0;if(on){ensureRenderer();state.lastTime=0;raf=requestAnimationFrame(frame);}}
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});});
  canvas.addEventListener('pointermove',e=>{
    if(!state.pointers.has(e.pointerId))return;e.preventDefault();const old=state.pointers.get(e.pointerId);
    if(state.pointers.size===1){state.rotY+=(e.clientX-old.x)*.008;state.rotX=Math.max(-1.1,Math.min(1.1,state.rotX+(e.clientY-old.y)*.006));}
    else if(state.pointers.size===2){const other=[...state.pointers.entries()].find(([key])=>key!==e.pointerId)?.[1];if(other){const before=Math.hypot(old.x-other.x,old.y-other.y),after=Math.hypot(e.clientX-other.x,e.clientY-other.y);if(before>10)setZoom(state.zoom*after/before);}}
    state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});renderOnce();
  });
  const release=e=>state.pointers.delete(e.pointerId);
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
  canvas.addEventListener('wheel',e=>{e.preventDefault();setZoom(state.zoom*(e.deltaY<0?1.07:.93));},{passive:false});
  zoomInput.addEventListener('input',()=>setZoom(Number(zoomInput.value)/100));
  motionButton.addEventListener('click',()=>{state.auto=!state.auto;motionButton.textContent=state.auto?'Pausar giro':'Girar automaticamente';});
  document.getElementById('cosmosReset').addEventListener('click',()=>{state.rotX=-.16;state.rotY=.6;setZoom(1);});
  document.getElementById('planetList').addEventListener('click',e=>{const b=e.target.closest('[data-planet]');if(b)setPlanet(b.dataset.planet);});
  window.addEventListener('tvt:page-change',e=>activate(e.detail?.page==='cosmos'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(raf);else if(state.active)activate(true);});
  setPlanet('earth');
  window.TVTouchPlanetarium={activate};
})();