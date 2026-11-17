(() => {
  'use strict';
  const canvas=document.getElementById('arcadeCanvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const W=960,H=540,TAU=Math.PI*2;
  const physics=window.AGVArcadePhysics;
  if(!physics)throw new Error('Motor de física do Arcade indisponível');
  const MAX_PIXELS=3840*2160,MAX_DPR=4;
  const $=id=>document.getElementById(id);
  const configuration={
    snake:{title:'Snake',category:'ESTRATÉGIA',help:'Deslize o dedo ou use as setas para guiar a cobra e pegar as frutas.',score:'Frutas'},
    pong:{title:'Pong',category:'REFLEXO',help:'Mova a raquete com o dedo ou com ↑ e ↓. Primeiro a cinco pontos vence.',score:'Você × CPU'},
    basket:{title:'Basquete',category:'TRAJETÓRIA',help:'Arraste da bola para cima e na direção da cesta; solte para arremessar.',score:'Cestas / tentativas'},
    pool:{title:'Sinuca',category:'ÂNGULOS',help:'Arraste da bola branca na direção desejada para dar a tacada. Encaçape as coloridas.',score:'Bolas encaçapadas'}
  };
  let game='snake',state,playing=false,ended=false,mode3d=false,lastTime=0,raf=0,press=null,directionHold=null;
  let qualityFactor=1,slowFrames=0,fastFrames=0;
  let soundEnabled=false;
  const gameExperience=window.AGVGameExperience;
  const gameSession=gameExperience?.createSession('arcade',{root:document.getElementById('arcadeStage')});
  const sparks=[];
  const motionReduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true||
    document.body.classList.contains('agv-quiet-mode');
  function effect(type){
    const event=type==='end'?'win':type;
    gameSession?.emit(event,{target:type==='end'?$('arcadeMessage'):null,visual:type==='end'});
  }
  function burst(x,y,color='#ff9b68',amount=10){
    if(motionReduced()||navigator.connection?.saveData===true)return;
    const count=Math.min(22,amount);
    for(let i=0;i<count&&sparks.length<66;i++){
      const angle=Math.PI*2*i/count+Math.random()*.2,speed=85+Math.random()*170;
      sparks.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
        life:.38+Math.random()*.15,max:.53,color});
    }
  }
  function tickSparks(dt){
    for(let i=sparks.length-1;i>=0;i--){
      const p=sparks[i];p.life-=dt;
      if(p.life<=0){sparks.splice(i,1);continue}
      p.x+=p.vx*dt;p.y+=p.vy*dt;
      p.vx*=Math.pow(.92,dt*60);p.vy*=Math.pow(.92,dt*60);
    }
  }
  function paintSparks(){
    if(!sparks.length)return;ctx.save();
    for(const p of sparks){
      ctx.globalAlpha=Math.max(0,Math.min(1,p.life/p.max));
      ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,2.8,0,TAU);ctx.fill();
    }
    ctx.restore();
  }
  async function toggleSound(){
    const button=$('arcadeSound');
    soundEnabled=await gameExperience?.setSound(!soundEnabled)===true;
    button.setAttribute('aria-pressed',String(soundEnabled));
    button.textContent=soundEnabled?'♫ Som ligado':'♫ Som desligado';
    if(soundEnabled)effect('start');
  }

  const rand=(min,max)=>min+Math.random()*(max-min);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const clear=()=>{ctx.clearRect(0,0,W,H)};
  const text=(value,x,y,size=24,color='#fff')=>{ctx.fillStyle=color;ctx.font='800 '+size+'px system-ui';ctx.textAlign='center';ctx.fillText(value,x,y)};
  function resizeCanvas(){
    const rect=canvas.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const deviceRatio=Math.max(1,Math.min(MAX_DPR,window.devicePixelRatio||1));
    const pixelRatio=deviceRatio*qualityFactor;
    const budget=Math.min(1,Math.sqrt(MAX_PIXELS/(rect.width*rect.height*pixelRatio*pixelRatio)));
    const width=Math.max(2,Math.round(rect.width*pixelRatio*budget));
    const height=Math.max(2,Math.round(rect.height*pixelRatio*budget));
    if(canvas.width===width&&canvas.height===height)return;
    canvas.width=width;canvas.height=height;
    ctx.setTransform(width/W,0,0,height/H,0,0);
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    const info=$('arcadeResolution');
    if(info)info.textContent=width+' × '+height+' px'+(qualityFactor<1?' · desempenho adaptativo':' · alta definição');
    if(state)draw();
  }
  function updateScore(value){
    if($('arcadeScore').textContent===String(value))return;
    $('arcadeScore').textContent=String(value);
    if(playing)effect('score');
  }
  function message(value){const el=$('arcadeMessage');el.textContent=value;el.hidden=false}
  function hideMessage(){$('arcadeMessage').hidden=true}
  function drawField(color='#071421') {
    const fill=ctx.createLinearGradient(0,0,W,H);
    fill.addColorStop(0,mode3d?'#0c2b42':color);
    fill.addColorStop(1,mode3d?'#06101d':'#0b1b2b');
    ctx.fillStyle=fill;ctx.fillRect(0,0,W,H);
    ctx.strokeStyle=mode3d?'#7be0ff17':'#7be0ff0e';ctx.lineWidth=1;
    for(let x=0;x<W;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
    for(let y=0;y<H;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
  }
  function ball(x,y,r,color){
    ctx.save();
    if(mode3d){ctx.shadowColor='#000c';ctx.shadowBlur=r;ctx.shadowOffsetY=r*.55}
    ctx.beginPath();ctx.arc(x,y,r,0,TAU);
    if(mode3d){const g=ctx.createRadialGradient(x-r*.35,y-r*.42,1,x,y,r*1.1);g.addColorStop(0,'#f7ffff');g.addColorStop(.18,color);g.addColorStop(1,'#102030');ctx.fillStyle=g}
    else ctx.fillStyle=color;
    ctx.fill();ctx.shadowColor='transparent';ctx.strokeStyle='#ffffff66';ctx.lineWidth=1.8;ctx.stroke();
    ctx.restore();
  }
  function block(x,y,w,h,color){
    ctx.fillStyle=color;ctx.fillRect(x,y,w,h);
    if(mode3d){
      ctx.fillStyle='#ffffff55';ctx.fillRect(x,y,w,4);
      ctx.fillStyle='#00000066';ctx.fillRect(x+w-5,y,5,h);
      ctx.fillStyle='#00000055';ctx.fillRect(x,y+h-5,w,5);
    }
  }
  const nextFood=()=> {
    const occupied=new Set(state.body.map(p=>p.x+','+p.y));
    const choices=[];
    for(let y=0;y<14;y++)for(let x=0;x<24;x++)if(!occupied.has(x+','+y))choices.push({x,y});
    return choices.length?choices[Math.floor(Math.random()*choices.length)]:null;
  };
  function initSnake(){
    state={body:[{x:7,y:7},{x:6,y:7},{x:5,y:7}],dir:{x:1,y:0},next:{x:1,y:0},food:null,clock:0,score:0};
    state.food=nextFood();updateScore(0);
  }
  function setSnakeDirection(key){
    const dirs={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
    const dir=dirs[key];if(!dir)return;
    if(dir.x!==-state.dir.x||dir.y!==-state.dir.y)state.next=dir;
  }
  function updateSnake(dt){
    state.clock+=dt;
    const tick=Math.max(.075,.15-state.score*.003);
    if(state.clock<tick)return;
    state.clock=0;state.dir=state.next;
    const head={x:state.body[0].x+state.dir.x,y:state.body[0].y+state.dir.y};
    const eating=state.food&&head.x===state.food.x&&head.y===state.food.y;
    const segments=eating?state.body:state.body.slice(0,-1);
    if(head.x<0||head.x>=24||head.y<0||head.y>=14||segments.some(p=>p.x===head.x&&p.y===head.y)){finish('Fim de jogo! Você pegou '+state.score+' frutas.');return}
    state.body.unshift(head);if(eating){state.score++;burst(120+(head.x+.5)*30,60+(head.y+.5)*30,'#adff8a',12);updateScore(state.score);state.food=nextFood();if(!state.food)finish('Tabuleiro completo!')}else state.body.pop();
  }
  function drawSnake(){
    drawField();
    const sx=120,sy=60,cell=30;
    ctx.fillStyle=mode3d?'#0e3040':'#0c2830';ctx.fillRect(sx-4,sy-4,728,428);
    ctx.strokeStyle='#346b78';ctx.strokeRect(sx-4,sy-4,728,428);
    ctx.strokeStyle='#ffffff0d';
    for(let c=1;c<24;c++){ctx.beginPath();ctx.moveTo(sx+c*cell,sy);ctx.lineTo(sx+c*cell,sy+420);ctx.stroke()}
    for(let r=1;r<14;r++){ctx.beginPath();ctx.moveTo(sx,sy+r*cell);ctx.lineTo(sx+720,sy+r*cell);ctx.stroke()}
    if(state.food){ball(sx+(state.food.x+.5)*cell,sy+(state.food.y+.5)*cell,12,'#ff8870');}
    state.body.forEach((p,i)=>{
      const x=sx+p.x*cell+2,y=sy+p.y*cell+2;
      if(mode3d){ctx.fillStyle='#043c37';ctx.fillRect(x+4,y+6,26,26)}
      block(x,y,26,26,i===0?'#c9fb79':'#3bc5a6');
    });
    text('TOQUE NAS SETAS OU DESLIZE PARA MOVER',480,32,15,'#a4d8ed');
  }
  function serve(direction=1){
    state.ball={x:480,y:270,vx:direction*rand(340,400),vy:rand(-160,160),r:13};
    state.leftY=214;state.rightY=214;
  }
  function initPong(){state={leftY:214,rightY:214,left:0,right:0,ball:null,manualDirection:0};serve(Math.random()<.5?1:-1);updateScore('0 × 0')}
  function updatePong(dt){
    const p=state.ball;
    state.leftY=clamp(state.leftY+(state.manualDirection*540)*dt,20,H-132);
    const target=p.y-56;
    state.rightY=clamp(state.rightY+clamp(target-state.rightY,-380*dt,380*dt),20,H-132);
    p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.y<p.r||p.y>H-p.r){p.y=clamp(p.y,p.r,H-p.r);p.vy*=-1}
    if(p.vx<0&&p.x-p.r<78&&p.x>50&&p.y>state.leftY-6&&p.y<state.leftY+118){
      p.x=78+p.r;p.vx=Math.abs(p.vx)*1.06;p.vy+=(p.y-state.leftY-56)*3.1;burst(p.x,p.y,'#70e8ff',7);effect('hit');
    }
    if(p.vx>0&&p.x+p.r>882&&p.x<910&&p.y>state.rightY-6&&p.y<state.rightY+118){
      p.x=882-p.r;p.vx=-Math.abs(p.vx)*1.06;p.vy+=(p.y-state.rightY-56)*3;burst(p.x,p.y,'#ffad81',7);effect('hit');
    }
    p.vx=clamp(p.vx,-750,750);p.vy=clamp(p.vy,-520,520);
    if(p.x<-30||p.x>W+30){
      if(p.x<-30)state.right++;else state.left++;
      updateScore(state.left+' × '+state.right);
      if(state.left>=5||state.right>=5){finish(state.left>state.right?'Você venceu!':'A CPU venceu!');return;}
      serve(p.x<-30?1:-1);
    }
  }
  function drawPong(){
    drawField('#070f1f');
    ctx.setLineDash([15,18]);ctx.strokeStyle='#abd7eb66';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(480,18);ctx.lineTo(480,522);ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle='#abd7eb55';ctx.lineWidth=4;ctx.beginPath();ctx.arc(480,270,66,0,TAU);ctx.stroke();
    block(50,state.leftY,27,112,'#75ecff');block(883,state.rightY,27,112,'#ffb46c');ball(state.ball.x,state.ball.y,13,'#fff9bb');
    text('VOCÊ',110,37,17,'#81e9ff');text('CPU',846,37,17,'#ffb46c');
  }
  function initBasket(){
    state={x:210,y:440,vx:0,vy:0,shots:0,points:0,air:false,scored:false,
      reset:0,aim:null,lastRimAt:0};
    updateScore('0 / 0');
  }
  function resetBasketBall(){
    Object.assign(state,{x:210,y:440,vx:0,vy:0,air:false,scored:false,reset:0,aim:null});
  }
  function throwBasket(dx,dy){
    if(state.air||Math.hypot(dx,dy)<18)return;
    const shot=physics.basketLaunch(dx,dy);
    state.vx=shot.vx;state.vy=shot.vy;
    state.air=true;state.shots++;
    updateScore(state.points+' / '+state.shots);
    gameSession?.emit('move',{visual:false});
  }
  function updateBasket(dt){
    if(!state.air)return;
    // Passos curtos preservam colisões no aro em displays de alta taxa.
    const steps=Math.max(1,Math.ceil(dt/.008));
    const step=dt/steps;
    for(let i=0;i<steps;i++){
      const result=physics.basketStep(state,step);
      Object.assign(state,result.ball);
      if(result.rim&&performance.now()-state.lastRimAt>100){
        state.lastRimAt=performance.now();effect('hit');
        burst(state.x,state.y,'#ff9466',5);
      }
      if(result.scored&&!state.scored){
        state.scored=true;state.points++;
        burst(state.x,state.y,'#9cffa8',18);
        updateScore(state.points+' / '+state.shots);
        state.reset=.9;
      }
      if(result.floor&&!state.reset)state.reset=.6;
      if((state.x>1020||state.x<-60)&&!state.reset)state.reset=.5;
    }
    if(state.reset>0){
      state.reset-=dt;
      if(state.reset<=0)resetBasketBall();
    }
  }
  function drawBasket(){
    drawField('#10253a');
    ctx.fillStyle='#223b57';ctx.fillRect(0,486,960,54);
    ctx.strokeStyle='#7493ae55';ctx.lineWidth=5;ctx.beginPath();ctx.arc(450,490,320,Math.PI,TAU);ctx.stroke();
    ctx.fillStyle='#dce9ff';ctx.fillRect(808,126,14,173);
    ctx.fillStyle='#c3d6e7';ctx.fillRect(804,125,80,108);ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.strokeRect(804,125,80,108);
    // Aro aberto no centro: a bola atravessa a cesta de verdade.
    ctx.strokeStyle='#fc785e';ctx.lineWidth=8;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(691,237);ctx.lineTo(700,237);
    ctx.moveTo(794,237);ctx.lineTo(803,237);ctx.stroke();
    ctx.strokeStyle='#b7cde2';ctx.lineWidth=2;
    for(let i=0;i<6;i++){const x=700+i*19;ctx.beginPath();ctx.moveTo(x,240);ctx.lineTo(744+(i-2.5)*9,292);ctx.stroke();}
    ctx.beginPath();ctx.moveTo(701,264);ctx.lineTo(791,264);ctx.stroke();
    if(state.aim&&!state.air&&press){
      const shot=physics.basketLaunch(state.aim.x-press.x,state.aim.y-press.y);
      const forecast=physics.basketPreview(state.x,state.y,shot.vx,shot.vy);
      ctx.fillStyle=forecast.scored?'#93ffbc':'#7fe9ff';
      for(let i=2;i<forecast.points.length;i+=2){
        const p=forecast.points[i];
        ctx.globalAlpha=.4+.55*i/forecast.points.length;
        ctx.beginPath();ctx.arc(p.x,p.y,Math.min(5,1.5+i/9),0,TAU);ctx.fill();
      }
      ctx.globalAlpha=1;
      const power=Math.min(1,Math.hypot(state.aim.x-press.x,state.aim.y-press.y)/560);
      ctx.fillStyle='#21172e';ctx.fillRect(52,478,224,14);
      ctx.fillStyle=forecast.scored?'#99ffae':'#ff9868';ctx.fillRect(54,480,220*power,10);
      text('FORÇA',87,467,13,'#fff1f8');
    }
    ball(state.x,state.y,24,'#f88c37');
    ctx.strokeStyle='#622a12';ctx.lineWidth=2;ctx.beginPath();ctx.arc(state.x,state.y,23,Math.PI*.5,Math.PI*1.5);ctx.stroke();ctx.beginPath();ctx.moveTo(state.x-22,state.y);ctx.lineTo(state.x+22,state.y);ctx.stroke();
    text('ARRASTE A BOLA EM DIREÇÃO À CESTA',315,57,17,'#bde6ff');
    text('ESPAÇO = ARREMESSO DE EXEMPLO',315,87,14,'#8fbdd7');
  }
  const pockets=physics.TABLE.pockets;
  function initPool(){
    const balls=[{x:292,y:270,vx:0,vy:0,r:12,color:'#fff',cue:true,pocketed:false}];
    const colors=['#ffd54d','#54ceff','#fc6f76','#9c83fb','#ffb67d','#4bd6a0','#f7a4ee','#f7f7f7','#88c6ff','#f3ca72'];
    let k=0;
    for(let row=0;row<4;row++)for(let column=0;column<=row;column++){
      balls.push({x:652+row*24,y:270-row*12+column*24,vx:0,vy:0,r:12,color:colors[k++],cue:false,pocketed:false});
    }
    state={balls,pocketed:0,aim:null,moving:false,shots:0};
    updateScore(0);
  }
  function isMoving(){return state.balls.some(b=>!b.pocketed&&Math.hypot(b.vx,b.vy)>8)}
  function shootPool(dx,dy){
    const cue=state.balls[0];
    if(isMoving()||cue.pocketed)return;
    const length=Math.hypot(dx,dy);if(length<18)return;
    const factor=Math.min(850,length*2.7)/length;
    cue.vx=dx*factor;cue.vy=dy*factor;
    state.shots++;
  }
  function updatePool(dt){
    const outcome=physics.poolStep(state.balls,dt);
    for(const ball of outcome.pocketed){
      burst(ball.x,ball.y,ball.color,9);
      state.pocketed++;
      updateScore(state.pocketed);
    }
    if(outcome.collisions)effect('hit');
    if(outcome.bounces&&state.shots)gameSession?.emit('hit',{audio:false,visual:false});
    if(state.pocketed===10){finish('Mesa limpa! Todas as bolas foram encaçapadas.');return}
    if(state.balls[0].pocketed&&!isMoving()){
      const placed=physics.cueRespawn(state.balls);
      if(placed)gameSession?.emit('reset',{audio:false,visual:false});
    }
  }
  function drawPool(){
    drawField('#070f1c');
    ctx.fillStyle=mode3d?'#a86b35':'#74502d';ctx.fillRect(72,55,816,430);
    ctx.fillStyle=mode3d?'#155c55':'#14634e';ctx.fillRect(100,83,760,374);
    ctx.strokeStyle='#91d4a0';ctx.lineWidth=4;ctx.strokeRect(100,83,760,374);
    for(const p of pockets){ctx.fillStyle='#020910';ctx.beginPath();ctx.arc(p.x,p.y,26,0,TAU);ctx.fill();}
    ctx.strokeStyle='#ffffff23';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(280,84);ctx.lineTo(280,456);ctx.stroke();
    const cue=state.balls[0];
    if(state.aim&&!isMoving()&&!cue.pocketed){
      const guide=physics.poolGuide(cue,state.aim,state.balls);
      if(guide){
        ctx.setLineDash([9,8]);ctx.strokeStyle=guide.hit?'#adffa7':'#fff1b0';
        ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cue.x,cue.y);
        ctx.lineTo(guide.x,guide.y);ctx.stroke();ctx.setLineDash([]);
        ctx.strokeStyle='#f9dab3';ctx.lineWidth=8;ctx.lineCap='round';
        const dx=state.aim.x-cue.x,dy=state.aim.y-cue.y,len=Math.hypot(dx,dy)||1;
        const ux=dx/len,uy=dy/len;
        ctx.beginPath();ctx.moveTo(cue.x-ux*32,cue.y-uy*32);
        ctx.lineTo(cue.x-ux*(95+55*guide.power),cue.y-uy*(95+55*guide.power));ctx.stroke();
        ctx.fillStyle='#1d192a';ctx.fillRect(340,493,280,12);
        ctx.fillStyle='#ff9a62';ctx.fillRect(342,495,276*guide.power,8);
        text('FORÇA DA TACADA',480,521,14,'#e5dcf9');
      }
    }
    for(const b of state.balls)if(!b.pocketed){ball(b.x,b.y,b.r,b.color);if(b.cue){ctx.strokeStyle='#8492a3';ctx.beginPath();ctx.arc(b.x,b.y,3,0,TAU);ctx.stroke()}}
    text('ARRASTE A BOLA BRANCA PARA MIRAR E TACAR',480,31,16,'#c0dfef');
  }
  function draw(){clear();if(game==='snake')drawSnake();else if(game==='pong')drawPong();else if(game==='basket')drawBasket();else drawPool();paintSparks()}
  function finish(info){
    playing=false;ended=true;
    const lost=info.includes('A CPU venceu');
    gameSession?.transition(lost?'lose':'win');
    burst(W/2,H/2,'#ff986a',22);
    message(info+' Toque em Jogar para reiniciar.');
    gameSession?.emit(lost?'lose':'win',{target:$('arcadeMessage')});
    $('arcadePlay').textContent='▶ Jogar novamente';
  }
  function update(dt){if(game==='snake')updateSnake(dt);else if(game==='pong')updatePong(dt);else if(game==='basket')updateBasket(dt);else updatePool(dt)}
  function schedule(){if(!raf)raf=requestAnimationFrame(frame)}
  function frame(now){
    raf=0;
    const elapsed=lastTime?now-lastTime:0;
    const dt=clamp(elapsed/1000,0,.035);
    lastTime=now;
    if(playing&&elapsed>0){
      if(elapsed>36)slowFrames++;else if(elapsed<23)fastFrames++;
      if(slowFrames+fastFrames>=110){
        if(slowFrames>=55&&qualityFactor>.7){qualityFactor=Math.max(.7,qualityFactor-.15);resizeCanvas()}
        else if(fastFrames>=95&&qualityFactor<1){qualityFactor=Math.min(1,qualityFactor+.05);resizeCanvas()}
        slowFrames=0;fastFrames=0;
      }
    }
    if(playing)update(dt);
    if(playing||sparks.length)tickSparks(dt);
    draw();
    if(playing||sparks.length)schedule();
  }
  function initialize(){
    gameSession?.transition('reset');
    playing=false;ended=false;press=null;directionHold=null;sparks.length=0;
    if(game==='snake')initSnake();else if(game==='pong')initPong();else if(game==='basket')initBasket();else initPool();
    const cfg=configuration[game];
    $('arcadeTitle').textContent=cfg.title;
    $('arcadeCategory').textContent=cfg.category;
    $('arcadeHelp').textContent=cfg.help;
    $('arcadeScoreLabel').textContent=cfg.score;
    $('arcadeKeypad').hidden=(game==='basket'||game==='pool');
    $('arcadePlay').textContent='▶ Jogar';
    message('Toque em Jogar para começar.');
    draw();
  }
  function selectGame(next){
    if(!configuration[next])return;
    game=next;initialize();
    document.querySelectorAll('[data-game]').forEach(b=>{const active=b.dataset.game===next;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
  }
  function togglePlay(){
    if(ended)initialize();
    playing=!playing;
    const action=playing?(gameSession?.state==='paused'?'resume':'start'):'pause';
    gameSession?.transition(action);
    gameSession?.emit(action,{audio:action!=='start'});
    $('arcadePlay').textContent=playing?'Ⅱ Pausar':'▶ Jogar';
    if(playing){hideMessage();lastTime=0;schedule()}
    else{message('Pausado. Toque em Jogar para continuar.');draw()}
    canvas.focus({preventScroll:true});
  }
  function changeMode(next){
    mode3d=next==='3d';
    document.body.classList.toggle('mode-3d',mode3d);
    $('arcade2d').setAttribute('aria-pressed',String(!mode3d));
    $('arcade3d').setAttribute('aria-pressed',String(mode3d));
    try{localStorage.setItem('tvt:arcade:view:v1',next)}catch{}
    draw();
  }
  function coordinates(e){
    const rect=canvas.getBoundingClientRect();
    return{x:(e.clientX-rect.left)*W/rect.width,y:(e.clientY-rect.top)*H/rect.height};
  }
  canvas.addEventListener('pointerdown',e=>{
    e.preventDefault();
    const p=coordinates(e);
    press={x:p.x,y:p.y,id:e.pointerId};
    if(canvas.setPointerCapture)try{canvas.setPointerCapture(e.pointerId)}catch{}
    if(game==='pong'&&playing)state.leftY=clamp(p.y-56,20,H-132);
  });
  canvas.addEventListener('pointermove',e=>{
    if(game==='pong'&&playing&&press?.id===e.pointerId)state.leftY=clamp(coordinates(e).y-56,20,H-132);
    if(!press||press.id!==e.pointerId)return;
    const p=coordinates(e);
    if(game==='basket'&&!state.air)state.aim=p;
    if(game==='pool'&&!isMoving())state.aim=p;
  });
  canvas.addEventListener('pointerup',e=>{
    if(!press||press.id!==e.pointerId)return;
    const end=coordinates(e),dx=end.x-press.x,dy=end.y-press.y;
    if(game==='snake'){
      if(Math.abs(dx)>24||Math.abs(dy)>24)setSnakeDirection(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));
    }else if(game==='basket'&&playing){
      if(Math.hypot(press.x-state.x,press.y-state.y)<95)throwBasket(dx,dy);
      state.aim=null;
    }else if(game==='pool'&&playing){
      const cue=state.balls[0];
      if(Math.hypot(press.x-cue.x,press.y-cue.y)<100)shootPool(dx,dy);
      state.aim=null;
    }
    press=null;
  });
  canvas.addEventListener('pointercancel',()=>{press=null;if(state){state.aim=null}});
  const keyMap={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
  function control(direction){
    if(game==='snake')setSnakeDirection(direction);
    if(game==='pong')state.manualDirection=direction==='up'?-1:direction==='down'?1:0;
  }
  document.addEventListener('keydown',e=>{
    if(e.target?.closest?.('button, a, input, textarea, select'))return;
    if(keyMap[e.key]){e.preventDefault();control(keyMap[e.key])}
    if(e.code==='Space'){e.preventDefault();if(game==='basket'&&playing)throwBasket(520,-230);else if(game==='pool'&&playing)shootPool(320,0);else if(!e.repeat)togglePlay()}
  });
  document.addEventListener('keyup',e=>{if(game==='pong'&&keyMap[e.key])state.manualDirection=0});
  document.querySelectorAll('[data-direction]').forEach(btn=>{
    btn.addEventListener('click',()=>control(btn.dataset.direction));
    btn.addEventListener('pointerdown',()=>{if(game==='pong')control(btn.dataset.direction)});
    for(const event of ['pointerup','pointercancel','pointerleave'])btn.addEventListener(event,()=>{if(game==='pong')state.manualDirection=0});
  });
  document.querySelectorAll('[data-game]').forEach(btn=>btn.addEventListener('click',()=>selectGame(btn.dataset.game)));
  $('arcade2d').addEventListener('click',()=>changeMode('2d'));
  $('arcade3d').addEventListener('click',()=>changeMode('3d'));
  $('arcadePlay').addEventListener('click',togglePlay);
  $('arcadeSound')?.addEventListener('click',toggleSound);
  $('arcadeRestart').addEventListener('click',initialize);
  $('arcadeFullscreen').addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen?.();else $('arcadeStage').requestFullscreen?.().catch(()=>message('Tela cheia indisponível neste navegador.'))});
  document.addEventListener('visibilitychange',()=>{lastTime=0;slowFrames=0;fastFrames=0;if(document.hidden&&playing){playing=false;$('arcadePlay').textContent='▶ Jogar';message('Jogo pausado ao sair desta página.')}});
  window.addEventListener('resize',resizeCanvas,{passive:true});
  document.addEventListener('fullscreenchange',()=>requestAnimationFrame(resizeCanvas));
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(resizeCanvas).observe(canvas);
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);soundEnabled=false;gameSession?.dispose();},{once:true});
  try{mode3d=localStorage.getItem('tvt:arcade:view:v1')==='3d'}catch{}
  resizeCanvas();initialize();changeMode(mode3d?'3d':'2d');
  try{
    const requested=new URLSearchParams(location.search).get('game');
    if(configuration[requested])selectGame(requested);
  }catch{}
  schedule();
})();