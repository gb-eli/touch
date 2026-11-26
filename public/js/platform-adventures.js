'use strict';
const engine=(function platformEngine(){
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const overlap=(p,b)=>p.x+.34>b.x&&p.x-.34<b.x+b.w&&p.z+.34>b.z&&p.z-.34<b.z+b.d;
  const worlds=[
    {name:"Vale Solar",sky:["#0a274d","#1b83bd","#f58a39"],sun:"#ffdc53",hills:["#397cab","#21527d","#102f46"],grass:"#83ed39",earth:"#a95222",stone:"#efab35"},
    {name:"Floresta Esmeralda",sky:["#041d2b","#087b71","#afd62f"],sun:"#e9ff64",hills:["#286d55","#12533f","#062d31"],grass:"#29e49a",earth:"#5d4827",stone:"#bdac48"},
    {name:"Cume Glacial",sky:["#101c50","#3c7ccd","#71d7e8"],sun:"#e5faff",hills:["#5684bb","#325586","#142e53"],grass:"#bdfaff",earth:"#32669f",stone:"#62b3dc"},
    {name:"Fortaleza Vulcânica",sky:["#160e29","#722340","#ff5121"],sun:"#ffb82e",hills:["#76333b","#43223a","#21162c"],grass:"#ffb42a",earth:"#672738",stone:"#de5831"}
  ];
  const levels=[
    [[0,10],[12,8],[22,10],[34,8],[44,12],[58,10],[70,11]],
    [[0,8],[10,8],[20,7],[29,10],[41,7],[50,11],[63,9],[74,10]],
    [[0,9],[11,6],[19,8],[29,6],[37,9],[48,7],[57,8],[67,12]],
    [[0,10],[12,7],[21,9],[32,7],[41,10],[53,8],[63,8],[73,18]]
  ];
  function world(mode,stage=0){
    const is3=mode==="3d";
    const platforms=[],gems=[],enemies=[];
    const add=(x,y,w,h,zz=-2,d=4)=>platforms.push({x,y,w,h,z:zz,d});
    const gem=(x,y,zz=0)=>gems.push({x,y,z:zz,taken:false});
    // Each segment is independently traversable by jumping; alternate 3D lanes.
    const blocks=levels[stage];
    blocks.forEach(([x,w],i)=>{
      const lane=is3?(i%3===1?1.8:i%3===2?-1.5:0):0;
      add(x,-1,w,1,lane-(is3?2.2:1),is3?4.4:2);
      for(let k=1;k<w-1;k+=2)gem(x+k,0.8,lane);
      if(i>0&&i<blocks.length-1){
        const bx=x+Math.min(3,w-2);
        add(bx,0,2,1.3,lane-.8,1.6);
        gem(bx+1,2.0,lane);
        enemies.push({x:x+w-2,y:0,z:lane,lo:x+w-3,hi:x+w-.8,dir:1,dead:false});
      }
    });
    const end=blocks.at(-1),goalZ=is3?((blocks.length-1)%3===1?1.8:(blocks.length-1)%3===2?-1.5:0):0;
    const boss=stage===3?{x:end[0]+10,z:goalZ,lo:end[0]+5,hi:end[0]+14,dir:-1,hp:3,cooldown:0}:null;
    return {platforms,gems,enemies,end:end[0]+end[1]-1,goalZ,boss};
  }
  function create(mode="2d",stage=0){
    stage=clamp(Math.floor(stage)||0,0,levels.length-1);
    return {mode,stage,...world(mode,stage),p:{x:2,y:0,z:0,vx:0,vy:0,vz:0,ground:true,facing:1},score:0,lives:3,checkpoint:{x:2,z:0},status:"ready",time:0,invincible:0,events:[]};
  }
  function damage(s,fall=false){
    if(s.invincible>0&&!fall)return;
    s.events.push("damage");
    s.lives--;
    if(s.lives<=0){s.status="lost";return}
    Object.assign(s.p,{x:s.checkpoint.x,z:s.checkpoint.z,y:0,vx:0,vy:0,vz:0,ground:true});s.invincible=1.5;
  }
  function step(s,input,dt){
    if(s.status!=="playing")return s;
    dt=clamp(dt,0,.04);const p=s.p,three=s.mode==="3d";
    s.time+=dt;s.invincible=Math.max(0,s.invincible-dt);
    const x=(input.right?1:0)-(input.left?1:0),z=three?((input.down?1:0)-(input.up?1:0)):0;
    const norm=Math.hypot(x,z)||1,spd=input.run?7.8:5.8;
    p.vx=x/norm*spd;p.vz=z/norm*spd;if(x)p.facing=Math.sign(x);
    if(input.jump&&p.ground){p.vy=9.4;p.ground=false;s.events.push("jump");}
    const prevY=p.y,oldX=p.x,oldZ=p.z;
    p.x=clamp(p.x+p.vx*dt,.4,s.end+1);p.z=three?clamp(p.z+p.vz*dt,-5,5):0;
    for(const b of s.platforms){
      if(b.y>=0&&overlap(p,b)&&prevY<b.y+b.h-.04&&prevY+.85>b.y){
        p.x=oldX;p.z=oldZ;break;
      }
    }
    p.vy-=18*dt;p.y+=p.vy*dt;p.ground=false;
    for(const b of s.platforms){
      const top=b.y+b.h;
      if(overlap(p,b)&&p.vy<=0&&prevY>=top-.06&&p.y<=top){
        p.y=top;p.vy=0;p.ground=true;
        if(b.y===-1&&p.x>b.x+1.1&&p.x<b.x+b.w-1&&p.x>s.checkpoint.x+8)
          s.checkpoint={x:b.x+.85,z:b.z+b.d/2};
        break;
      }
    }
    if(p.y< -5){damage(s,true);return s;}
    for(const g of s.gems)if(!g.taken&&Math.hypot(p.x-g.x,p.y+.45-g.y,p.z-g.z)<.85){g.taken=true;s.score+=10;s.events.push("gem");}
    for(const e of s.enemies)if(!e.dead){
      e.x+=e.dir*1.25*dt;if(e.x>e.hi||e.x<e.lo){e.x=clamp(e.x,e.lo,e.hi);e.dir*=-1}
      if(Math.abs(p.x-e.x)<.62&&Math.abs(p.z-e.z)<.6&&p.y<.8&&p.y+.85>0){
        if(p.vy< -1&&prevY>=.6){e.dead=true;p.vy=5.6;s.score+=50;s.events.push("stomp");}
        else damage(s);
      }
    }
    const boss=s.boss;
    if(boss&&boss.hp>0&&s.status==="playing"){
      boss.cooldown=Math.max(0,boss.cooldown-dt);
      boss.x+=boss.dir*(1.45+(3-boss.hp)*.65)*dt;
      if(boss.x<boss.lo||boss.x>boss.hi){boss.x=clamp(boss.x,boss.lo,boss.hi);boss.dir*=-1;}
      if(Math.abs(p.x-boss.x)<.95&&Math.abs(p.z-boss.z)<.9&&p.y<1.35&&p.y+.85>0){
        if(boss.cooldown===0&&p.vy<0&&prevY>=1.28){
          boss.hp--;boss.cooldown=.9;p.y=1.35;p.vy=7.2;s.score+=boss.hp===0?300:100;s.events.push("stomp");
        }else if(boss.cooldown===0)damage(s);
      }
    }
    if(s.status==="playing"&&p.x>=s.end-.45&&Math.abs(p.z-s.goalZ)<1.3&&p.y>=-.1&&(!boss||boss.hp===0)){s.status="won";s.events.push("win");}
    return s;
  }
  function next(s){if(s.status!=="won"||s.stage>=levels.length-1)return null;const n=create(s.mode,s.stage+1);n.score=s.score;n.lives=s.lives;return n;}
  return {create,step,next,worlds};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=engine;
else (function platformUI(E){
  const $=id=>document.getElementById(id),canvas=$("game"),ctx=canvas.getContext("2d"),keys=new Set(),touch=new Map();
  let s=E.create(),last=0,acc=0,W=1280,H=720,mode="2d",stage=0,paused=false,dirty=true,sound=false,audio=null;
  const inputs=()=>Object.fromEntries(["left","right","up","down","jump","run"].map(k=>[k,keys.has(k)||[...touch.values()].includes(k)]));
  function resize(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;const scale=Math.min(devicePixelRatio||1,1.6,Math.sqrt(1450000/(r.width*r.height)));canvas.width=Math.round(r.width*scale);canvas.height=Math.round(r.height*scale);W=canvas.width;H=canvas.height;dirty=true;}
  new ResizeObserver(resize).observe(canvas);resize();
  function reset(m=mode,n=stage,carry=null){mode=m;stage=n;s=carry||E.create(mode,stage);dirty=true;paused=false;clear();document.querySelectorAll("[data-mode]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.mode===mode)));$("gameTitle").textContent=mode==="2d"?"Salto Solar":"Ilhas do Horizonte";$("hint").textContent=mode==="2d"?"Corra, pule e recolha cristais.":"Explore as três dimensões. Use ↑ ↓ para mudar de faixa.";document.body.classList.toggle("mode3",mode==="3d");update();}
  function play(){if(s.status==="won"){const next=E.next(s);reset(mode,next?next.stage:0,next);s.status="playing"}else if(s.status==="lost"){reset(mode,0);s.status="playing"}else{s.status="playing";paused=false}update();canvas.focus({preventScroll:true});}
  function update(){
    dirty=true;$("score").textContent=String(s.score).padStart(3,"0");$("life").textContent="♥ ".repeat(Math.max(0,s.lives)).trim()||"—";$("stage").textContent=`${stage+1}/${E.worlds.length} · ${E.worlds[stage].name.toUpperCase()}`;
    const active=s.status==="playing"&&!paused; $("overlay").hidden=active;
    $("message").textContent=paused?"Pausa":s.status==="won"?(stage===E.worlds.length-1?"Aventura concluída!":"Fase concluída!"):s.status==="lost"?"Tente de novo":mode==="2d"?"Salto Solar":"Ilhas do Horizonte";
    $("play").textContent=paused?"Continuar":s.status==="won"?(stage===E.worlds.length-1?"Jogar novamente":"Próxima fase"):s.status==="lost"?"Tentar novamente":"Jogar";
    $("pause").textContent=paused?"Continuar":"Pausar";
  }
  function tone(type){
    if(!sound||!audio||audio.state!=="running")return;
    const notes={jump:[340,620,.13],gem:[780,1320,.13],stomp:[175,95,.17],damage:[160,70,.25],win:[440,880,.4]};
    const n=notes[type];if(!n)return;
    const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;
    o.type=type==="gem"?"sine":"triangle";o.frequency.setValueAtTime(n[0],t);o.frequency.exponentialRampToValueAtTime(n[1],t+n[2]);g.gain.setValueAtTime(.08,t);g.gain.exponentialRampToValueAtTime(.001,t+n[2]);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+n[2]);
  }
  $("audio").onclick=async()=>{try{if(!sound){const A=window.AudioContext||window.webkitAudioContext;if(!A)throw Error("unsupported");audio=audio||new A();await audio.resume();sound=true}else sound=false;$("audio").setAttribute("aria-pressed",String(sound));$("audio").textContent=sound?"Som ligado":"Som desligado"}catch{$("audio").textContent="Som indisponível"}};
  document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>reset(b.dataset.mode,0)));
  $("play").onclick=play;$("reset").onclick=()=>reset();$("pause").onclick=()=>{if(s.status!=="playing")return;paused=!paused;clear();update()};
  $("full").onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$("hint").textContent="Tela cheia indisponível neste navegador."}};
  document.addEventListener("fullscreenchange",()=>{$("full").textContent=document.fullscreenElement?"Sair da tela cheia":"Tela cheia";resize()});
  const keyMap={ArrowLeft:"left",a:"left",ArrowRight:"right",d:"right",ArrowUp:"up",w:"up",ArrowDown:"down",s:"down"," ":"jump",Shift:"run"};
  document.addEventListener("keydown",e=>{if(e.target.matches("button,a")&&(e.key===" "||e.key==="Enter"))return;let k=keyMap[e.key];if(k){e.preventDefault();keys.add(k)}if(e.key==="Escape"&&s.status==="playing"&&!document.fullscreenElement){paused=true;clear();update()}});
  document.addEventListener("keyup",e=>{if(keyMap[e.key])keys.delete(keyMap[e.key])});
  document.querySelectorAll("[data-control]").forEach(b=>{
    b.addEventListener("pointerdown",e=>{if(s.status!=="playing"||paused)return;e.preventDefault();touch.set(e.pointerId,b.dataset.control);try{b.setPointerCapture(e.pointerId)}catch{}b.classList.add("held")});
    for(const ev of ["pointerup","pointercancel","lostpointercapture"])b.addEventListener(ev,e=>{touch.delete(e.pointerId);if(![...touch.values()].includes(b.dataset.control))b.classList.remove("held")});
  });
  const clear=()=>{keys.clear();touch.clear();document.querySelectorAll(".held").forEach(b=>b.classList.remove("held"))};
  window.addEventListener("blur",clear);document.addEventListener("visibilitychange",()=>{if(document.hidden){clear();if(s.status==="playing"){paused=true;update()}}});
  function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
  function poly(points,color){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=color;ctx.fill()}
  function sky(){
    const theme=E.worlds[stage],grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,theme.sky[0]);grad.addColorStop(.65,theme.sky[1]);grad.addColorStop(1,theme.sky[2]);rect(0,0,W,H,grad);
    ctx.fillStyle=theme.sun;ctx.beginPath();ctx.arc(W*.78,H*.23,H*.105,0,Math.PI*2);ctx.fill();
    for(let layer=0;layer<3;layer++){
      const off=s.p.x*(layer+1)*9;const pts=[[0,H]];
      for(let x=-80;x<W+100;x+=65)pts.push([x,H*(.47+layer*.12)+Math.sin((x+off)/120+layer*2)*H*.09+Math.cos((x+off)/48)*H*.035]);pts.push([W,H]);poly(pts,theme.hills[layer]);
    }
  }
  function draw2(){
    sky();const scale=Math.min(W/18,H/8),ox=W*.27-s.p.x*scale,ground=H*.76;
    const X=x=>ox+x*scale,Y=y=>ground-y*scale;
    const theme=E.worlds[stage];
    for(const b of s.platforms){const x=X(b.x),y=Y(b.y+b.h),w=b.w*scale,h=b.h*scale;if(x+w<0||x>W)continue;
      rect(x,y,w,h,b.y<0?theme.earth:theme.stone);rect(x,y,w,Math.max(4,scale*.13),b.y<0?theme.grass:"#ffca47");
      if(b.y<0)for(let i=0;i<b.w;i++){const px=x+(i+.5)*scale,py=y+scale*.13;poly([[px-scale*.32,py],[px-scale*.13,py-scale*.24],[px,py-scale*.09],[px+scale*.13,py-scale*.28],[px+scale*.28,py]],theme.grass);}
      for(let i=0;i<b.w;i++){rect(x+i*scale+1,y+scale*.23,scale-3,Math.max(2,h-scale*.3),"#00000022");rect(x+i*scale+2,y+h-3,scale-5,2,"#ed9a5466")}
    }
    for(const g of s.gems)if(!g.taken){const x=X(g.x),y=Y(g.y)+Math.sin(s.time*3+g.x)*scale*.09,r=scale*.23;poly([[x,y-r],[x+r*.7,y],[x,y+r],[x-r*.7,y]],"#ffe14a");poly([[x,y-r],[x,y+r],[x-r*.7,y]],"#ff9b17")}
    for(const e of s.enemies)if(!e.dead){const x=X(e.x),y=Y(.65);rect(x-scale*.3,y,scale*.6,scale*.65,"#bd2763");rect(x-scale*.2,y+scale*.12,scale*.13,scale*.13,"#fff");rect(x+scale*.06,y+scale*.12,scale*.13,scale*.13,"#fff");rect(x-scale*.35,Y(0)-scale*.12,scale*.23,scale*.12,"#44234e");rect(x+scale*.12,Y(0)-scale*.12,scale*.23,scale*.12,"#44234e")}
    if(s.boss&&s.boss.hp>0){const b=s.boss,x=X(b.x),y=Y(1.35);ctx.fillStyle=b.cooldown>0?"#ffd14a":"#f64a36";ctx.beginPath();ctx.roundRect(x-scale*.8,y,scale*1.6,scale*1.35,scale*.22);ctx.fill();rect(x-scale*.52,y+scale*.36,scale*.34,scale*.24,"#fff4d8");rect(x+scale*.18,y+scale*.36,scale*.34,scale*.24,"#fff4d8");rect(x-scale*.75,y-scale*.25,scale*1.5,scale*.11,"#201727");rect(x-scale*.75,y-scale*.25,scale*1.5*b.hp/3,scale*.11,"#ffdb43");}
    const gx=X(s.end);rect(gx,Y(3),scale*.09,scale*3,"#edfaff");poly([[gx,Y(3)],[gx+scale*1.2,Y(2.65)],[gx,Y(2.3)]],"#00eac8");
    const p=s.p,x=X(p.x),y=Y(p.y+.85),w=scale*.58,h=scale*.85;if(s.invincible<=0||Math.floor(s.time*12)%2===0){rect(x-w*.5,y+h*.27,w,h*.52,"#00c8d8");rect(x-w*.46,y,w*.92,h*.35,"#ff9b22");rect(x-w*.3,y+h*.08,w*.6,h*.18,"#faffd2");const stride=p.ground&&Math.abs(p.vx)>.1?Math.sin(s.time*20)*h*.12:0;rect(x-w*.5,y+h*.79+stride,w*.43,h*.21,"#ecf9ff");rect(x+w*.07,y+h*.79-stride,w*.43,h*.21,"#ecf9ff");rect(x-w*.35,y+h*.42,w*.7,h*.12,"#092b39")}
  }
  function draw3(){
    sky();
    // Genuine three-axis world geometry, projected with perspective onto Canvas 2D.
    // Camera is fixed in orientation and follows the player; no external 3D runtime.
    const p=s.p,camera={x:p.x-6.8,y:6.5,z:p.z+8.7};
    const norm=v=>{const l=Math.hypot(...v);return v.map(x=>x/l)};
    const f=norm([7,-5.1,-8.7]),right=norm([-f[2],0,f[0]]);
    const up=[right[1]*f[2]-right[2]*f[1],right[2]*f[0]-right[0]*f[2],right[0]*f[1]-right[1]*f[0]];
    const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),focal=Math.min(W,H)*1.05;
    function project(v){const d=[v[0]-camera.x,v[1]-camera.y,v[2]-camera.z],z=dot(d,f);if(z<=.7)return null;return [W*.48+dot(d,right)*focal/z,H*.5-dot(d,up)*focal/z,z]}
    const faces=[];
    function box(x,y,z,w,h,d,colors){const v=[[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z],[x,y,z+d],[x+w,y,z+d],[x+w,y+h,z+d],[x,y+h,z+d]];
      const indices=[[0,1,2,3],[4,5,6,7],[0,4,7,3],[1,5,6,2],[3,2,6,7],[0,1,5,4]];
      const normals=[[0,0,-1],[0,0,1],[-1,0,0],[1,0,0],[0,1,0],[0,-1,0]];
      indices.forEach((ids,i)=>{const center=ids.reduce((a,k)=>a.map((n,j)=>n+v[k][j]/4),[0,0,0]);if(dot(normals[i],[camera.x-center[0],camera.y-center[1],camera.z-center[2]])<=0)return;const q=ids.map(k=>project(v[k]));if(q.some(t=>!t))return;faces.push({points:q,depth:q.reduce((n,t)=>n+t[2],0)/4,color:colors[i%colors.length]})});
    }
    for(const b of s.platforms){if(b.x+b.w<p.x-10||b.x>p.x+33)continue;box(b.x,b.y,b.z,b.w,b.h,b.d,b.y<0?[E.worlds[stage].earth,E.worlds[stage].earth,E.worlds[stage].earth,E.worlds[stage].earth,E.worlds[stage].grass,"#332a38"]:["#b46e35",E.worlds[stage].stone,"#8c5134","#c7914f",E.worlds[stage].stone,"#6d482f"])}
    for(const g of s.gems)if(!g.taken&&Math.abs(g.x-p.x)<24){const y=g.y+.09*Math.sin(s.time*3+g.x);box(g.x-.17,y-.17,g.z-.17,.34,.34,.34,["#ffac12","#ffd345","#c58100","#ffef70","#fff9a4"])}
    for(const e of s.enemies)if(!e.dead&&Math.abs(e.x-p.x)<26)box(e.x-.32,0,e.z-.32,.64,.7,.64,["#a72057","#e94f79","#7f123e","#d72a60","#ff8da5"]);
    if(s.boss&&s.boss.hp>0&&Math.abs(s.boss.x-p.x)<26){const b=s.boss;box(b.x-.75,0,b.z-.65,1.5,1.35,1.3,["#8d1e25","#f64a36","#a62228","#dc3b29","#ffbb36"]);box(b.x-.48,.81,b.z+.66,.3,.21,.03,["#fff6d5"]);box(b.x+.18,.81,b.z+.66,.3,.21,.03,["#fff6d5"]);}
    if(s.end-p.x<30){box(s.end,0,s.goalZ,.12,3,.12,["#eaffff"]);box(s.end,2.35,s.goalZ,.12,.65,1.15,["#00c79e","#00f5bf","#008c78","#a0ffe1"])}
    if(s.invincible<=0||Math.floor(s.time*12)%2===0){box(p.x-.32,p.y,p.z-.3,.64,.53,.6,["#008baf","#00e5dc","#006b94","#00bcb8","#87fff3"]);box(p.x-.28,p.y+.53,p.z-.27,.56,.37,.54,["#df7013","#ffac25","#b95109","#ffba4e","#fff1a6"]);box(p.x-.19,p.y+.61,p.z+.275,.38,.15,.025,["#162837","#e8faff"])}
    faces.sort((a,b)=>b.depth-a.depth);for(const face of faces){poly(face.points,face.color);ctx.strokeStyle="#04192330";ctx.lineWidth=1;ctx.stroke()}
    if(s.boss&&s.boss.hp>0){const q=project([s.boss.x,1.65,s.boss.z]);if(q){const w=Math.max(20,Math.min(90,focal/q[2]*1.45));rect(q[0]-w/2,q[1],w,6,"#201727");rect(q[0]-w/2,q[1],w*s.boss.hp/3,6,"#ffdb43");}}
  }
  function frame(now){const dt=last?Math.min(.08,(now-last)/1000):0;last=now;if(s.status==="playing"&&!paused){acc+=dt;while(acc>=1/60){E.step(s,inputs(),1/60);acc-=1/60;}if(s.status!=="playing"){clear();update()}}else acc=0;
    if(s.events.length){s.events.splice(0).forEach(tone)}
    if(dirty||(s.status==="playing"&&!paused)){if(mode==="3d")draw3();else draw2();dirty=false;}
    const score=String(s.score).padStart(3,"0"),life="♥ ".repeat(Math.max(0,s.lives)).trim()||"—";if($("score").textContent!==score)$("score").textContent=score;if($("life").textContent!==life)$("life").textContent=life;requestAnimationFrame(frame)}
  reset();requestAnimationFrame(frame);
})(engine);
