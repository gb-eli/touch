/* TV TOUCH — renderer geométrico 2.4. Canvas2D, sem WebGL/CDN.
   Projeção 3D com sombreamento por face e textura procedural aproximada (não PBR). */
(() => {
'use strict';
const MATERIALS=Object.freeze({
  ceramic:{label:'Cerâmica',base:'#decfbd',grain:'smooth'},
  steel:{label:'Aço escovado',base:'#a4bdc1',grain:'brushed'},
  wood:{label:'Madeira',base:'#c18a50',grain:'wood'},
  stone:{label:'Pedra',base:'#9aa6a0',grain:'stone'},
  grass:{label:'Gramado',base:'#4f9c4a',grain:'grass'},
  sand:{label:'Areia',base:'#d8bb82',grain:'sand'},
  dirt:{label:'Terra',base:'#8c6040',grain:'dirt'},
  lava:{label:'Lava',base:'#c14b2a',grain:'lava'},
  ice:{label:'Gelo',base:'#9ce2ed',grain:'ice'},
  brick:{label:'Tijolos',base:'#bf6d54',grain:'brick'},
  crystal:{label:'Cristal',base:'#806fc3',grain:'crystal'}
});
const QUALITY=Object.freeze({eco:{lat:8,lon:14,cyl:16,dpr:1,pixels:900000},
  balanced:{lat:13,lon:22,cyl:28,dpr:1.5,pixels:1850000},
  high:{lat:20,lon:32,cyl:42,dpr:2,pixels:3200000}});
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
function geometry(name='cubo',quality='balanced'){
  const q=QUALITY[quality]||QUALITY.balanced;
  if(name==='cubo'||name==='prisma'){
    const [x,y,z]=name==='cubo'?[1,1,1]:[1.42,.82,.9];
    return {vertices:[[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]],
      faces:[[0,1,2,3],[4,5,6,7],[0,4,7,3],[1,5,6,2],[3,2,6,7],[0,1,5,4]]};
  }
  if(name==='piramide')return {vertices:[[-1.13,-.9,-1.13],[1.13,-.9,-1.13],[1.13,-.9,1.13],[-1.13,-.9,1.13],[0,1.42,0]],
    faces:[[0,1,2,3],[0,1,4],[1,2,4],[2,3,4],[3,0,4]]};
  if(name==='cilindro'){
    const n=q.cyl,vertices=[],faces=[];
    for(let y of [-1.08,1.08])for(let i=0;i<n;i++){const a=2*Math.PI*i/n;vertices.push([Math.cos(a),y,Math.sin(a)]);}
    faces.push([...Array(n).keys()].reverse(),Array.from({length:n},(_,i)=>n+i));
    for(let i=0;i<n;i++)faces.push([i,(i+1)%n,n+(i+1)%n,n+i]);
    return {vertices,faces};
  }
  if(name==='esfera'){
    const lat=q.lat,lon=q.lon,vertices=[[0,1.12,0]],faces=[];
    for(let row=1;row<lat;row++){
      const theta=row*Math.PI/lat;
      for(let col=0;col<lon;col++){const phi=col*Math.PI*2/lon;vertices.push([1.12*Math.sin(theta)*Math.cos(phi),1.12*Math.cos(theta),1.12*Math.sin(theta)*Math.sin(phi)]);}
    }
    const south=vertices.length;vertices.push([0,-1.12,0]);
    for(let i=0;i<lon;i++)faces.push([0,1+i,1+(i+1)%lon]);
    for(let row=0;row<lat-2;row++){
      const a=1+row*lon,b=1+(row+1)*lon;
      for(let i=0;i<lon;i++)faces.push([a+i,b+i,b+(i+1)%lon,a+(i+1)%lon]);
    }
    const last=1+(lat-2)*lon;
    for(let i=0;i<lon;i++)faces.push([last+i,south,last+(i+1)%lon]);
    return {vertices,faces};
  }
  return geometry('cubo',quality);
}
const subtract=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const normalize=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);};
function rotate(v,rx,ry){
  const [x,y,z]=v;const cy=Math.cos(rx),sy=Math.sin(rx);
  const ya=y*cy-z*sy,za=y*sy+z*cy;
  return [x*Math.cos(ry)+za*Math.sin(ry),ya,-x*Math.sin(ry)+za*Math.cos(ry)];
}
function normal(a,b,c,center){
  let n=normalize(cross(subtract(b,a),subtract(c,a)));
  if(dot(n,center)<0)n=n.map(v=>-v);
  return n;
}
function project(v,cx,cy,scale){
  const pers=4.85/(4.85-v[2]);return{x:cx+v[0]*scale*pers,y:cy-v[1]*scale*pers,z:v[2]};
}
function colorScale(hex,brightness){
  const s=hex.slice(1),k=clamp(brightness,0,1.4);
  const rgb=[0,2,4].map(i=>parseInt(s.slice(i,i+2),16));
  const c=rgb.map(n=>Math.round(clamp(n*k,0,255)));
  return 'rgb('+c.join(',')+')';
}
const patternCache=new Map();
function grain(ctx,kind){
  if(kind==='smooth')return null;
  if(patternCache.has(kind))return patternCache.get(kind);
  const cv=document.createElement('canvas');cv.width=cv.height=72;
  const g=cv.getContext('2d');if(!g)return null;
  g.clearRect(0,0,72,72);
  let seed=Array.from(kind).reduce((a,c)=>((a*31+c.charCodeAt(0))>>>0),913);
  const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  if(kind==='brushed'){
    for(let i=0;i<120;i++){
      g.strokeStyle=rnd()>.4?'rgba(255,255,255,.19)':'rgba(0,0,0,.18)';
      g.lineWidth=.4+rnd()*.8;const y=rnd()*72;
      g.beginPath();g.moveTo(0,y);g.lineTo(72,y+rnd()*2-1);g.stroke();
    }
  } else if(kind==='wood'){
    for(let i=0;i<38;i++){
      g.strokeStyle=rnd()>.5?'rgba(54,22,4,.29)':'rgba(255,247,210,.35)';
      g.lineWidth=.6+rnd()*2;const y=rnd()*72;
      g.beginPath();g.moveTo(0,y);
      g.bezierCurveTo(24,y+rnd()*8-4,48,y+rnd()*8-4,72,y+rnd()*6-3);
      g.stroke();
    }
  } else if(kind==='brick'){
    g.strokeStyle='rgba(238,214,193,.66)';g.lineWidth=3;
    for(let y=0;y<=72;y+=18){g.beginPath();g.moveTo(0,y);g.lineTo(72,y);g.stroke();
      for(let x=(Math.round(y/18)%2?0:16);x<=72;x+=32){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+18);g.stroke()}
    }
  } else if(kind==='lava'){
    g.fillStyle='rgba(18,9,20,.68)';g.fillRect(0,0,72,72);
    for(let i=0;i<42;i++){
      const x=rnd()*72,y=rnd()*72;
      g.strokeStyle=i%3?'rgba(255,105,28,.8)':'rgba(255,235,94,.8)';
      g.lineWidth=1.2+rnd()*4;g.beginPath();g.moveTo(x,y);g.lineTo(x+7+rnd()*17,y+4+rnd()*15);g.stroke();
    }
  } else if(kind==='grass'){
    for(let i=0;i<180;i++){
      const x=rnd()*72,y=rnd()*72;
      g.fillStyle=rnd()>.5?'rgba(172,241,91,.56)':'rgba(12,57,25,.52)';
      g.fillRect(x,y,2+rnd()*6,1+rnd()*4);
    }
  } else if(kind==='ice'||kind==='crystal'){
    for(let i=0;i<56;i++){
      const x=rnd()*72,y=rnd()*72;
      g.strokeStyle=kind==='ice'?'rgba(248,255,255,.58)':'rgba(255,235,255,.66)';
      g.lineWidth=.8+rnd()*1.4;g.beginPath();g.moveTo(x,y);
      g.lineTo(x+4+rnd()*18,y-4-rnd()*10);g.lineTo(x+5+rnd()*14,y+10+rnd()*13);g.closePath();g.stroke();
    }
  } else {
    for(let i=0;i<280;i++){
      const shade=rnd()>.5?'rgba(255,255,255,.27)':'rgba(18,20,21,.30)';
      g.fillStyle=shade;g.fillRect(rnd()*72,rnd()*72,.7+rnd()*(kind==='sand'?1.9:4),.7+rnd()*(kind==='sand'?1.9:4));
    }
  }
  const result=ctx.createPattern(cv,'repeat');patternCache.set(kind,result);return result;
}
function resize(canvas,quality){
  const q=QUALITY[quality]||QUALITY.balanced;
  const rect=canvas.getBoundingClientRect();const width=rect.width,height=rect.height;
  if(width<2||height<2)return null;
  const dpr=Math.min(q.dpr,window.devicePixelRatio||1,Math.sqrt(q.pixels/(width*height)));
  const w=Math.max(2,Math.round(width*dpr)),h=Math.max(2,Math.round(height*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  return {w,h,dpr};
}
function render(ctx,canvas,options={}){
  const quality=QUALITY[options.quality]?options.quality:'balanced';
  const size=resize(canvas,quality);if(!size)return null;
  const {w,h,dpr}=size;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,w,h);
  const cx=w/2,cy=h*.49,scale=Math.min(w,h)*.285*clamp(options.zoom||1,.65,1.8);
  const rx=clamp(options.rotX||0,-1.52,1.52),ry=options.rotY||0;
  const material=MATERIALS[options.material]||MATERIALS.ceramic;
  // Fundo de referência, usado para perceber perspectiva sem painéis decorativos.
  ctx.lineWidth=Math.max(1,dpr);
  ctx.strokeStyle='rgba(183,200,184,.095)';
  const gap=w/16;
  for(let i=1;i<16;i++){ctx.beginPath();ctx.moveTo(i*gap,h*.12);ctx.lineTo(i*gap,h*.89);ctx.stroke();}
  for(let i=1;i<9;i++){ctx.beginPath();ctx.moveTo(w*.06,i*h/10);ctx.lineTo(w*.94,i*h/10);ctx.stroke();}
  // Sombra de contato no plano abaixo do objeto.
  ctx.save();ctx.fillStyle='rgba(0,0,0,.22)';
  ctx.beginPath();ctx.ellipse(cx,cy+scale*1.38,scale*1.07,scale*.17,0,0,Math.PI*2);ctx.fill();ctx.restore();
  const mesh=geometry(options.shape,quality),rot=mesh.vertices.map(v=>rotate(v,rx,ry)),screen=rot.map(v=>project(v,cx,cy,scale));
  const light=normalize([-.48,.80,1.05]),faces=[];
  for(let i=0;i<mesh.faces.length;i++){
    const indices=mesh.faces[i],p3=indices.map(n=>rot[n]),center=p3[0].map((_,k)=>p3.reduce((sum,p)=>sum+p[k],0)/p3.length);
    const n=normal(p3[0],p3[1],p3[2],center);
    if(dot(n,subtract([0,0,4.85],center))<=0)continue;
    faces.push({indices,center,n,index:i,z:center[2]});
  }
  faces.sort((a,b)=>a.z-b.z);
  const pattern=grain(ctx,material.grain);
  for(const face of faces){
    const pts=face.indices.map(n=>screen[n]);
    ctx.beginPath();for(let j=0;j<pts.length;j++)j?ctx.lineTo(pts[j].x,pts[j].y):ctx.moveTo(pts[j].x,pts[j].y);ctx.closePath();
    const intensity=.47+.54*Math.max(0,dot(face.n,light));
    const variation=options.shape==='esfera'?1:1+Math.sin(face.index*7.11)*.04;
    ctx.fillStyle=colorScale(material.base,intensity*variation);ctx.fill();
    if(pattern){
      ctx.save();ctx.clip();ctx.globalAlpha=['grass','lava','ice','crystal','brick'].includes(material.grain)?.52:material.grain==='wood'?.33:.40;ctx.fillStyle=pattern;
      const minx=Math.min(...pts.map(v=>v.x)),miny=Math.min(...pts.map(v=>v.y));
      const maxx=Math.max(...pts.map(v=>v.x)),maxy=Math.max(...pts.map(v=>v.y));
      ctx.fillRect(minx,miny,maxx-minx,maxy-miny);ctx.restore();
    }
    if(options.shape!=='esfera'&&options.shape!=='cilindro'){
      ctx.strokeStyle='rgba(255,252,237,.36)';ctx.lineWidth=1.3*dpr;ctx.stroke();
    } else if(quality==='high'){
      ctx.strokeStyle='rgba(255,255,255,.035)';ctx.lineWidth=.6*dpr;ctx.stroke();
    }
  }
  if(options.shape==='esfera'){
    // Reflexo especular suave sobre a esfera inteira; ilustração de material, não fotografia.
    ctx.save();ctx.beginPath();ctx.arc(cx-scale*.23,cy-scale*.33,scale*.33,0,Math.PI*2);
    const g=ctx.createRadialGradient(cx-scale*.23,cy-scale*.33,0,cx-scale*.23,cy-scale*.33,scale*.33);
    g.addColorStop(0,'rgba(255,255,255,.20)');g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g;ctx.fill();ctx.restore();
  }
  return {quality,material:options.material||'ceramic',visibleFaces:faces.length,vertices:mesh.vertices.length,pixels:w*h};
}
window.TVTouchGeometry=Object.freeze({geometry,render,MATERIALS,QUALITY});
})();