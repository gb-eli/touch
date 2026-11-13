(() => {
  'use strict';
  const KEY = 'tvt:entry:v2';
  const maxTargets = 4;
  const themes = [
    {name:'Ícones', items:[['◆','square'],['✳','circle'],['●','circle'],['✦','square'],['▲','square']]},
    {name:'Símbolos', items:[['⬡','square'],['✦','square'],['◆','square'],['●','circle'],['▲','square']]},
    {name:'Formas', items:[['●','circle'],['■','square'],['◆','square'],['▰','rectangle'],['▲','square']]}
  ];
  let overlay, gameTimer = 0, current = 0, times = [], startedAt = 0;
  let audioFile = null, soundContext = null, analyser = null, audioElement = null, soundURL = null, soundOn = false, nodes = [], raf = 0, visualCanvas = null, visualContext = null, sampleData = null;
  let lowEnergy = 0, midEnergy = 0, highEnergy = 0, beatEnergy = 0;
  let stepAt = 0, theme, points = [];
  const $ = id => document.getElementById(id);
  function markSeen() { try { sessionStorage.setItem(KEY,'done'); } catch {} }
  function seen() { try { return sessionStorage.getItem(KEY)==='done'; } catch { return false; } }
  function shuffle(items) {
    const out = [...items];
    for (let i=out.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [out[i],out[j]]=[out[j],out[i]]; }
    return out;
  }
  function cleanTimers() { clearTimeout(gameTimer); }
  function stopMusic() {
    soundOn=false;
    if (audioElement) { audioElement.pause(); audioElement.removeAttribute('src'); audioElement.load(); audioElement=null; }
    if (soundURL) { URL.revokeObjectURL(soundURL); soundURL=null; }
    for (const node of nodes) { try { node.stop(); } catch {} }
    nodes=[];
    if (soundContext) { soundContext.close().catch(()=>{});soundContext=null; }
    analyser=null;sampleData=null;
    const button=$('tvtSoundToggle');
    if (button) {button.textContent='♫ ATIVAR SOM';button.setAttribute('aria-pressed','false');}
  }
  function synthAudio(ctx,output) {
    const base=ctx.currentTime+.05, duration=26.5;
    const layer=ctx.createGain();layer.gain.setValueAtTime(.0001,base);
    layer.gain.exponentialRampToValueAtTime(.065,base+3.5);
    layer.gain.setValueAtTime(.065,base+20);
    layer.gain.exponentialRampToValueAtTime(.0001,base+duration);
    layer.connect(output);
    for (const hz of [55,82.41,110,164.81]) {
      const oscillator=ctx.createOscillator(),gain=ctx.createGain();
      oscillator.type=hz===55?'sine':'triangle';oscillator.frequency.value=hz;
      gain.gain.value=hz===55?.40:.13;
      oscillator.connect(gain);gain.connect(layer);oscillator.start(base);
      oscillator.stop(base+duration);nodes.push(oscillator);
    }
    const impacts=[.2,1.1,2.8,5.35,7.05,10.95,12.99,15.24,16.94,18.94,20.34,21.14,21.94,22.5];
    for(let i=0;i<impacts.length;i++){
      const t=base+impacts[i],osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.type='sine';osc.frequency.setValueAtTime(120,t);
      osc.frequency.exponentialRampToValueAtTime(40,t+.27);
      gain.gain.setValueAtTime(.0001,t);
      gain.gain.linearRampToValueAtTime(i>7?.23:.12,t+.012);
      gain.gain.exponentialRampToValueAtTime(.0001,t+.44);
      osc.connect(gain);gain.connect(output);
      osc.start(t);osc.stop(t+.46);nodes.push(osc);
    }
  }
  async function addMusic() {
    if (soundOn) return;
    const AC=window.AudioContext||window.webkitAudioContext;
    if (!AC) { setSoundStatus('ÁUDIO INDISPONÍVEL NESTE NAVEGADOR'); return; }
    try {
      soundContext=new AC();
      analyser=soundContext.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=.76;
      sampleData=new Uint8Array(analyser.frequencyBinCount);
      if (audioFile) {
        audioElement=new Audio();
        soundURL=URL.createObjectURL(audioFile);
        audioElement.src=soundURL;audioElement.preload='auto';
        const source=soundContext.createMediaElementSource(audioElement);
        source.connect(analyser);analyser.connect(soundContext.destination);
        audioElement.addEventListener('ended',stopMusic,{once:true});
        await soundContext.resume();await audioElement.play();
        setSoundStatus('FREQUÊNCIAS DA TRILHA LOCAL EM ANÁLISE');
      } else {
        const gain=soundContext.createGain();gain.gain.value=.48;
        gain.connect(analyser);analyser.connect(soundContext.destination);
        await soundContext.resume();synthAudio(soundContext,gain);
        setSoundStatus('SOUND DESIGN ORIGINAL · ÁUDIO ATIVO');
      }
      soundOn=true;
      const button=$('tvtSoundToggle');
      if(button){button.textContent='◖ SILENCIAR';button.setAttribute('aria-pressed','true');}
    } catch { stopMusic();setSoundStatus('TOQUE NOVAMENTE PARA ATIVAR O ÁUDIO'); }
  }
  function setSoundStatus(label) { const node=$('tvtSoundStatus');if(node)node.textContent=label; }
  function paintScene(time) {
    if(!overlay||!visualCanvas||!visualContext)return;
    const c=visualCanvas,g=visualContext,r=c.getBoundingClientRect();
    if(r.width&&r.height){
      const dpr=Math.min(2,window.devicePixelRatio||1);
      if(c.width!==Math.round(r.width*dpr)||c.height!==Math.round(r.height*dpr)){
        c.width=Math.round(r.width*dpr);c.height=Math.round(r.height*dpr);
        g.setTransform(dpr,0,0,dpr,0,0);
      }
      const w=r.width,h=r.height,x=w/2,y=h/2,R=Math.min(w,h)*.225;
      g.clearRect(0,0,w,h);
      const band=(min,max)=>{
        if(!sampleData||!soundContext||!analyser)return 0;
        const bin=soundContext.sampleRate/analyser.fftSize;
        let value=0,n=0;
        for(let z=Math.max(1,Math.floor(min/bin));z<Math.min(sampleData.length,Math.ceil(max/bin));z++){value+=sampleData[z];n++;}
        return n?value/n/255:0;
      };
      if(soundOn&&analyser){
        analyser.getByteFrequencyData(sampleData);
        lowEnergy=lowEnergy*.64+band(30,190)*.36;
        midEnergy=midEnergy*.65+band(190,1800)*.35;
        highEnergy=highEnergy*.66+band(1800,7000)*.34;
      }else{lowEnergy*=.93;midEnergy*=.93;highEnergy*=.93;}
      beatEnergy=Math.max(lowEnergy,midEnergy*.82,highEnergy*.68);
      const quiet=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const pulse=1+(quiet?0:beatEnergy*.24+Math.sin(time*.0017)*.025);
      const haze=g.createRadialGradient(x,y,1,x,y,R*2.1);
      haze.addColorStop(0,'rgba(255,85,29,'+(0.12+beatEnergy*.28)+')');
      haze.addColorStop(.55,'rgba(161,59,255,'+(0.11+midEnergy*.21)+')');
      haze.addColorStop(1,'rgba(6,1,16,0)');
      g.fillStyle=haze;g.fillRect(0,0,w,h);
      for(let ring=0;ring<3;ring++){
        g.beginPath();g.arc(x,y,R*(1+ring*.25)*pulse,0,Math.PI*2);
        g.strokeStyle=ring===0?'rgba(255,115,56,.85)':'rgba(182,65,255,.25)';
        g.lineWidth=ring===0?3:1.3;g.stroke();
      }
      for(let i=0;i<80;i++){
        const a=(i/80)*Math.PI*2-Math.PI/2+(quiet?0:time*.00005);
        const sample=sampleData?.[4+i*3]||0;
        const length=9+sample/255*R*.43+beatEnergy*R*.12;
        const start=R*1.38;
        g.beginPath();g.moveTo(x+Math.cos(a)*start,y+Math.sin(a)*start);
        g.lineTo(x+Math.cos(a)*(start+length),y+Math.sin(a)*(start+length));
        g.strokeStyle=['#ff702c','#9d4fff','#ffbf67','#d13dff'][i%4];
        g.lineWidth=i%5===0?3:1.5;g.stroke();
      }
      const core=g.createRadialGradient(x-R*.3,y-R*.4,R*.02,x,y,R*.87);
      core.addColorStop(0,'#ff8540');core.addColorStop(.34,'#f34a21');
      core.addColorStop(.77,'#851acf');core.addColorStop(1,'#180a26');
      g.beginPath();g.arc(x,y,R*.82*pulse,0,Math.PI*2);
      g.fillStyle=core;g.fill();
    }
    raf=requestAnimationFrame(paintScene);
  }
  function installScene(){
    cancelAnimationFrame(raf);
    overlay.insertAdjacentHTML('afterbegin','<div class="tvt-entry-header"><strong>TV<span>/</span>TOUCH.</strong><em>ALBERTO GOMES VEIGA · LAB INTERATIVO</em><button type="button" id="tvtExit">PULAR ↗</button></div><div class="tvt-scene-art" aria-hidden="true"><canvas id="tvtEnergyCanvas"></canvas><div class="tvt-scene-core"><span>AGV / LAB</span><strong>TOUCH</strong><small>INTERACTIVE DISPLAY</small></div></div><div class="tvt-entry-status" id="tvtSoundStatus">ENERGIA CRIATIVA EM MOVIMENTO</div><div class="tvt-sound-dock"><button type="button" class="tvt-sound-toggle" aria-pressed="false" id="tvtSoundToggle">♫ ATIVAR SOM</button><label class="tvt-local-file" for="tvtAudioUpload">ÁUDIO LOCAL <input id="tvtAudioUpload" type="file" accept="audio/*"></label></div>');
    $('tvtExit').addEventListener('click',complete);
    $('tvtSoundToggle').addEventListener('click',()=>{if(soundOn)stopMusic();else addMusic();});
    $('tvtAudioUpload').addEventListener('change',event=>{
      const next=event.target.files?.[0];
      if(!next)return;
      if(!next.type.startsWith('audio/')){setSoundStatus('SELECIONE UM ARQUIVO DE ÁUDIO');return;}
      audioFile=next;
      setSoundStatus('TRILHA LOCAL: '+next.name.slice(0,30).toUpperCase());
      if(soundOn){stopMusic();addMusic();}
    });
    if(soundOn){$('tvtSoundToggle').textContent='◖ SILENCIAR';$('tvtSoundToggle').setAttribute('aria-pressed','true');}
    visualCanvas=$('tvtEnergyCanvas');visualContext=visualCanvas.getContext('2d');
    raf=requestAnimationFrame(paintScene);
  }
  function showWelcome() {
    cleanTimers();
    overlay.innerHTML='<div class="tvt-entry-card"><p class="tvt-entry-kicker">STUDIO 2.8 / EXPERIÊNCIA IMERSIVA</p><h2>A TELA<br><span>GANHA</span><br>VIDA.</h2><p class="tvt-entry-description">Seu próximo universo começa na ponta dos dedos. Ative a experiência, teste os toques e entre no laboratório.</p><div class="tvt-entry-actions"><button type="button" class="tvt-entry-main" id="tvtEntryStart">COMEÇAR AGORA ↗</button><button type="button" class="tvt-entry-secondary" id="tvtEntrySkip">IR DIRETO AO PORTAL</button></div><div class="tvt-entry-rail">GEOMETRIA 3D <i></i> MÚSICA <i></i> JOGOS <i></i> CRIAÇÃO</div></div>';
    installScene();
    $('tvtEntryStart').addEventListener('click',()=>{ addMusic(); beginCalibration(); });
    $('tvtEntrySkip').addEventListener('click',complete);
    $('tvtEntryStart').focus();
  }
  function open() {
    if (overlay) return;
    document.documentElement.dataset.tvtIntro='active';
    overlay=document.createElement('div');
    overlay.className='tvt-entry';
    overlay.id='tvtEntryOverlay';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','TV TOUCH: abertura e calibração opcional');
    document.body.appendChild(overlay);
    showWelcome();
  }
  function complete() {
    cleanTimers();
    markSeen();
    document.documentElement.dataset.tvtIntro='done';
    stopMusic();cancelAnimationFrame(raf);raf=0;
    overlay?.remove();
    overlay=null;visualCanvas=null;visualContext=null;
    document.querySelector('#homeTitle')?.focus?.();
  }
  function placeTarget() {
    if (!overlay) return;
    const positions = window.innerWidth < 700
      ? [{x:.08,y:.22},{x:.68,y:.22},{x:.08,y:.54},{x:.08,y:.73}]
      : [{x:.08,y:.20},{x:.78,y:.20},{x:.12,y:.68},{x:.58,y:.56}];
    const spot = points[current];
    const entry = theme.items[current % theme.items.length];
    const target = document.createElement('button');
    target.type='button';
    target.className='tvt-cal-target '+entry[1];
    target.textContent=entry[0];
    target.setAttribute('aria-label','Toque no alvo '+(current+1)+' de '+maxTargets);
    $('tvtCalStage').querySelector('.tvt-cal-target')?.remove();
    $('tvtCalStage').appendChild(target);
    const pos=positions[spot];
    const w=target.offsetWidth, h=target.offsetHeight;
    let left=Math.round(Math.min(window.innerWidth-w-9,Math.max(9,window.innerWidth*pos.x)));
    let top=Math.round(Math.min(window.innerHeight-h-8,Math.max(92,window.innerHeight*pos.y)));
    const player=null;
    const overlaps=(x,y)=>player&&x<player.right+12&&x+w>player.left-12&&y<player.bottom+12&&y+h>player.top-12;
    if(overlaps(left,top)){
      const alternatives=[{x:.08,y:.52},{x:.08,y:.35},{x:.7,y:.35},{x:.08,y:.68},{x:.45,y:.42}];
      const available=alternatives.map(item=>({x:Math.round(Math.min(window.innerWidth-w-9,Math.max(9,window.innerWidth*item.x))),y:Math.round(Math.min(window.innerHeight-h-8,Math.max(92,window.innerHeight*item.y)))})).find(item=>!overlaps(item.x,item.y));
      if(available){left=available.x;top=available.y;}
    }
    target.style.left=left+'px';
    target.style.top=top+'px';
    stepAt=performance.now();
    target.addEventListener('click',()=>{
      times.push(Math.round(performance.now()-stepAt));
      current++;
      $('tvtCalCounter').textContent=current+' / '+maxTargets;
      $('tvtCalProgress').style.width=(100*current/maxTargets)+'%';
      if (current===maxTargets) finishCalibration(); else placeTarget();
    },{once:true});
    target.focus({preventScroll:true});
  }
  function beginCalibration() {
    cleanTimers();
    current=0;times=[];startedAt=performance.now();
    const selected=themes[Math.floor(Math.random()*themes.length)];
    theme={name:selected.name,items:shuffle(selected.items)};
    points=shuffle([0,1,2,3]);
    overlay.innerHTML='<div class="tvt-cal-stage" id="tvtCalStage"><div class="tvt-cal-top"><strong>TOQUE NOS SÍMBOLOS</strong><p>Encontre e toque cada alvo no seu ritmo.</p><div class="tvt-entry-progress"><div class="tvt-entry-progress-fill" id="tvtCalProgress" style="width:0%"></div></div></div><div class="tvt-cal-bottom"><span class="tvt-cal-counter" id="tvtCalCounter">0 / '+maxTargets+'</span><button type="button" id="tvtCalFinish">ENCERRAR TESTE</button><button type="button" id="tvtCalSkip">PULAR</button></div></div>';
    installScene();
    $('tvtCalFinish').addEventListener('click',finishCalibration);
    $('tvtCalSkip').addEventListener('click',complete);
    placeTarget();
    // Sem prazo automático: os alvos permanecem disponíveis até o usuário terminar.
  }
  function finishCalibration() {
    clearTimeout(gameTimer);
    if (!overlay) return;
    const count=times.length;
    const mean=count?Math.round(times.reduce((a,b)=>a+b,0)/count):0;
    const total=Math.max(0,(performance.now()-startedAt)/1000);
    const description=count===maxTargets?'Os quatro pontos responderam nesta verificação.':count?'Você acionou '+count+' de '+maxTargets+' pontos. Pode testar outra vez ou continuar.':'Nenhum ponto foi acionado. Isso não significa, por si só, defeito na tela.';
    const headline=count===maxTargets?'TOQUE<br><span>VALIDADO.</span>':count?'TESTE<br><span>INCOMPLETO.</span>':'NÃO<br><span>REALIZADO.</span>';
    overlay.innerHTML='<div class="tvt-entry-card tvt-entry-result"><p class="tvt-entry-kicker">TOUCH CHECK / RESULTADO</p><h2>'+headline+'</h2><p class="tvt-entry-description">'+description+'</p><div class="tvt-cal-result"><div class="tvt-cal-stat">PONTOS<strong>'+count+' / '+maxTargets+'</strong></div><div class="tvt-cal-stat">REAÇÃO MÉDIA<strong>'+(mean?mean+' ms':'—')+'</strong></div><div class="tvt-cal-stat">DURAÇÃO<strong>'+total.toFixed(1)+' s</strong></div></div><div class="tvt-entry-actions"><button type="button" class="tvt-entry-main" id="tvtFinish">ABRIR TV TOUCH ↗</button><button type="button" class="tvt-entry-secondary" id="tvtReplay">REPETIR</button><button type="button" class="tvt-entry-secondary" id="tvtArcadeNow">ARCADE ↗</button></div><p class="tvt-entry-info">Mede o tempo de reação da pessoa, não a latência do sensor físico.</p></div>';
    installScene();
    window.dispatchEvent(new CustomEvent('tvt:calibration-complete',{detail:{theme:theme.name,hits:count,total:maxTargets,averageReactionMs:mean}}));
    $('tvtFinish').addEventListener('click',complete);
    $('tvtReplay').addEventListener('click',beginCalibration);
    $('tvtArcadeNow').addEventListener('click',()=>{complete();window.location.href='arcade.html';});
    $('tvtFinish').focus();
    // Os resultados permanecem visíveis até uma escolha explícita.
  }
  function setup() {
    const shortcuts=document.querySelector('.home-shortcuts');
    if (shortcuts) {
      const games=document.createElement('a');
      games.href='arcade.html';
      games.className='tvt-arcade-link';
      games.textContent='🎮 Arcade · Pong, Snake, Basquete e Sinuca';
      games.style.cssText='display:inline-flex;align-items:center;min-height:52px;padding:12px 18px;border:1px solid #ff5823;border-radius:6px;background:#1d111c;color:#fff;text-decoration:none;font-weight:850';
      shortcuts.prepend(games);
      const replay=document.createElement('button');
      replay.type='button';
      replay.textContent='◎ Testar toques';
      replay.addEventListener('click',open);
      shortcuts.appendChild(replay);
    }
    if (!seen() && (!location.hash || location.hash==='#inicio')) open();
  }
  document.addEventListener('keydown',event=>{
    if (event.key==='Escape' && overlay) { event.preventDefault();complete(); }
  });
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',setup,{once:true}); else setup();
})();