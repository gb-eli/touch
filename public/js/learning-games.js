/* TV TOUCH / jogos pedagógicos locais. Nunca coleta nomes ou pontuações de estudantes. */
(() => {
  'use strict';
  const grid=document.getElementById('memoryGrid');
  const reset=document.getElementById('memoryReset');
  const movesOut=document.getElementById('memoryMoves');
  const matchesOut=document.getElementById('memoryMatches');
  const message=document.getElementById('memoryMessage');
  const shapes=[
    {id:'orbita',name:'Órbita',glyph:'◎',color:'#5b46e8'},
    {id:'cubo',name:'Cubo',glyph:'⬡',color:'#2e83d3'},
    {id:'onda',name:'Onda',glyph:'∿',color:'#00768d'},
    {id:'delta',name:'Delta',glyph:'△',color:'#d254a1'},
    {id:'estrela',name:'Estrela',glyph:'✳',color:'#c56f24'},
    {id:'anel',name:'Anel',glyph:'◉',color:'#42805c'}
  ];
  const memory={selected:[],matched:new Set(),turns:0,locked:false,pending:null};
  const shuffle=arr=>{for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;};
  function memoryReset(){
    clearTimeout(memory.pending);memory.pending=null;memory.selected=[];memory.matched.clear();memory.turns=0;memory.locked=false;
    movesOut.textContent='0';matchesOut.innerHTML='0 <small>/ 6 pares</small>';
    message.textContent='Toque em duas cartas para começar.';
    const cards=shuffle([...shapes,...shapes].map((s,i)=>({...s,uid:i})));
    grid.innerHTML=cards.map(s=>`<button type="button" class="memory-card" data-pair="${s.id}" aria-label="Revelar carta" aria-pressed="false"><span class="memory-inner"><span class="memory-front" aria-hidden="true">✳</span><span class="memory-back" style="--card-color:${s.color}" aria-hidden="true"><span class="memory-glyph">${s.glyph}</span><span class="memory-name">${s.name}</span></span></span></button>`).join('');
  }
  function flip(card){
    if(memory.locked||card.classList.contains('is-open')||card.classList.contains('is-matched'))return;
    card.classList.add('is-open');card.setAttribute('aria-pressed','true');card.setAttribute('aria-label',card.querySelector('.memory-name').textContent);
    memory.selected.push(card);
    if(memory.selected.length!==2)return;
    memory.turns++;movesOut.textContent=String(memory.turns);
    const [a,b]=memory.selected;memory.locked=true;
    if(a.dataset.pair===b.dataset.pair){
      a.classList.add('is-matched');b.classList.add('is-matched');memory.matched.add(a.dataset.pair);
      memory.selected=[];memory.locked=false;
      matchesOut.innerHTML=`${memory.matched.size} <small>/ 6 pares</small>`;
      message.textContent=memory.matched.size===6?`Concluído em ${memory.turns} jogadas. Inicie outra rodada.`:'Par encontrado. Continue.';
      if(memory.matched.size===6)window.dispatchEvent(new CustomEvent('tvt:tool-open',{detail:{id:'memoria-completed'}}));
    }else{
      message.textContent='Não combinam. Observe e tente novamente.';
      memory.pending=setTimeout(()=>{
        for(const el of memory.selected){el.classList.remove('is-open');el.setAttribute('aria-pressed','false');el.setAttribute('aria-label','Revelar carta');}
        memory.selected=[];memory.locked=false;memory.pending=null;
      },840);
    }
  }
  grid?.addEventListener('click',e=>{const b=e.target.closest('.memory-card');if(b)flip(b);});
  reset?.addEventListener('click',memoryReset);
  if(grid)memoryReset();

  const canvas=document.getElementById('physicsCanvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const gravityInput=document.getElementById('physicsGravity');
  const gravityText=document.getElementById('physicsGravityValue');
  const info=document.getElementById('physicsInfo');
  const physics={active:false,raf:0,balls:[],pointer:null,last:0};
  const palette=['#64f6ff','#bb80ff','#bbff56','#ffad52','#ff5996'];
  const rand=(a,b)=>a+Math.random()*(b-a);
  function bounds(){return {w:canvas.clientWidth||600,h:canvas.clientHeight||420};}
  function resize(){const {w,h}=bounds(),dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
  function addBall(x,y,vx=rand(-4,4),vy=rand(-5,0)){
    const {w,h}=bounds(),r=rand(15,29);
    physics.balls.push({x:Math.max(r,Math.min(w-r,x??rand(40,w-40))),y:Math.max(r,Math.min(h-r,y??rand(35,h*.55))),vx,vy,r,color:palette[Math.floor(rand(0,palette.length))]});
    if(physics.balls.length>26)physics.balls.shift();
    info.textContent=`${physics.balls.length} esfera(s) em movimento`;
  }
  function update(dt){
    const {w,h}=bounds();const gravity=Number(gravityInput.value)/9.8*.23;
    for(const ball of physics.balls){
      ball.vy+=gravity*dt;ball.vx*=Math.pow(.998,dt);ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
      if(ball.x-ball.r<0){ball.x=ball.r;ball.vx=Math.abs(ball.vx)*.82;}
      if(ball.x+ball.r>w){ball.x=w-ball.r;ball.vx=-Math.abs(ball.vx)*.82;}
      if(ball.y-ball.r<0){ball.y=ball.r;ball.vy=Math.abs(ball.vy)*.82;}
      if(ball.y+ball.r>h){ball.y=h-ball.r;ball.vy=-Math.abs(ball.vy)*.77;if(Math.abs(ball.vy)<.38)ball.vy=0;}
    }
  }
  function draw(){
    const {w,h}=bounds();ctx.clearRect(0,0,w,h);
    const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#0b1b38');bg.addColorStop(.65,'#0a1740');bg.addColorStop(1,'#0b1229');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#6479a420';ctx.lineWidth=1;const gap=Math.max(30,Math.round(w/22));
    for(let x=0;x<w;x+=gap){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
    for(let y=0;y<h;y+=gap){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    const line=ctx.createLinearGradient(0,h,w,h);line.addColorStop(0,'#19d9ee');line.addColorStop(.5,'#af78ff');line.addColorStop(1,'#b7ff52');ctx.fillStyle=line;ctx.fillRect(0,h-5,w,5);
    for(const b of physics.balls){
      const g=ctx.createRadialGradient(b.x-b.r*.34,b.y-b.r*.42,b.r*.08,b.x,b.y,b.r);
      g.addColorStop(0,'#f5fbff');g.addColorStop(.2,b.color);g.addColorStop(1,'#101732');
      ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fillStyle=g;ctx.shadowColor=b.color;ctx.shadowBlur=b.r*.75;ctx.fill();ctx.shadowBlur=0;
      ctx.beginPath();ctx.ellipse(b.x,h-9,b.r*.88,5,0,0,Math.PI*2);ctx.fillStyle='#00000030';ctx.fill();
    }
    if(physics.pointer){const p=physics.pointer;ctx.beginPath();ctx.setLineDash([9,7]);ctx.moveTo(p.startX,p.startY);ctx.lineTo(p.x,p.y);ctx.strokeStyle='#b8ff5c';ctx.lineWidth=3;ctx.stroke();ctx.setLineDash([]);}
  }
  function frame(t){if(!physics.active||document.hidden)return;let dt=Math.min(2,(t-physics.last)/16.67||1);physics.last=t;update(dt);draw();physics.raf=requestAnimationFrame(frame);}
  function toggle(on){physics.active=on;cancelAnimationFrame(physics.raf);physics.raf=0;if(on){resize();if(!physics.balls.length)for(let i=0;i<5;i++)addBall();physics.last=performance.now();physics.raf=requestAnimationFrame(frame);}}
  function point(e){const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();if(physics.pointer)return;canvas.setPointerCapture(e.pointerId);const p=point(e);physics.pointer={id:e.pointerId,startX:p.x,startY:p.y,x:p.x,y:p.y};});
  canvas.addEventListener('pointermove',e=>{if(e.pointerId!==physics.pointer?.id)return;e.preventDefault();const p=point(e);physics.pointer.x=p.x;physics.pointer.y=p.y;});
  const end=e=>{const p=physics.pointer;if(!p||p.id!==e.pointerId)return;const d=point(e);addBall(p.startX,p.startY,(p.startX-d.x)*.06,(p.startY-d.y)*.06);physics.pointer=null;};
  canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',e=>{if(physics.pointer?.id===e.pointerId)physics.pointer=null;});
  gravityInput.addEventListener('input',()=>{gravityText.textContent=Number(gravityInput.value).toFixed(1).replace('.',',');});
  document.getElementById('physicsAdd').addEventListener('click',()=>addBall());
  document.getElementById('physicsClear').addEventListener('click',()=>{physics.balls=[];info.textContent='Toque e arraste para lançar';draw();});
  window.addEventListener('tvt:page-change',e=>toggle(e.detail?.page==='fisica'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(physics.raf);else if(physics.active)toggle(true);});
  window.addEventListener('resize',()=>{if(physics.active)resize();});
})();