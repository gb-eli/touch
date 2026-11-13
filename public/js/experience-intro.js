(() => {
  'use strict';
  const KEY = 'tvt:entry:v1';
  const VIDEO = 'HZS5a3cm7zU';
  const maxTargets = 4;
  const themes = [
    {name:'Frutas', items:[['🍎','circle'],['🍉','rectangle'],['🍓','square'],['🍌','rectangle'],['🍊','circle']]},
    {name:'Esportes', items:[['⚽','circle'],['🏀','circle'],['🏐','circle'],['🎾','circle'],['🏈','rectangle']]},
    {name:'Formas', items:[['●','circle'],['■','square'],['◆','square'],['▰','rectangle'],['▲','square']]}
  ];
  let overlay, music, gameTimer = 0, current = 0, times = [], startedAt = 0;
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
    if (!music) return;
    music.remove();
    music = null;
  }
  function addMusic() {
    if (music) return;
    music = document.createElement('aside');
    music.className='tvt-music';
    music.setAttribute('aria-label','Player de trilha sonora');
    music.innerHTML='<div class="tvt-music-head"><strong>🔊 Dolby Atmos · Unfold</strong><button type="button" class="tvt-music-close" aria-label="Parar a trilha">✕</button></div><div class="tvt-music-frame"></div><small>Se não iniciar, toque em ▶ no vídeo. Requer internet.</small>';
    document.body.appendChild(music);
    music.querySelector('button').addEventListener('click',stopMusic);
    const iframe = document.createElement('iframe');
    iframe.title='Trailer Dolby Atmos: Unfold — player oficial YouTube';
    iframe.src='https://www.youtube.com/embed/'+VIDEO+'?autoplay=1&playsinline=1&controls=1&rel=0';
    iframe.allow='autoplay; encrypted-media; picture-in-picture';
    iframe.referrerPolicy='strict-origin-when-cross-origin';
    iframe.loading='eager';
    iframe.allowFullscreen=true;
    music.querySelector('.tvt-music-frame').appendChild(iframe);
  }
  function showWelcome() {
    cleanTimers();
    overlay.innerHTML='<div class="tvt-entry-card"><p class="tvt-entry-kicker">COLÉGIO ESTADUAL ALBERTO GOMES VEIGA</p><h2>O futuro começa com <span>um toque.</span></h2><p class="tvt-entry-description">Bem-vindo ao TV TOUCH. Comece com uma experiência sonora e um desafio rápido para testar os pontos de toque da tela.</p><div class="tvt-entry-actions"><button type="button" class="tvt-entry-main" id="tvtEntryStart">▶ Iniciar experiência</button><button type="button" class="tvt-entry-secondary" id="tvtEntrySkip">Entrar sem testar</button></div><p class="tvt-entry-info">Desafio opcional de até 5 segundos · Sem cadastro ou coleta de dados pessoais</p></div>';
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
    overlay?.remove();
    overlay=null;
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
    const player=music?.getBoundingClientRect();
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
    overlay.innerHTML='<div class="tvt-cal-stage" id="tvtCalStage"><div class="tvt-cal-top"><strong>🎯 Toque nos alvos que aparecerem</strong><p>Categoria aleatória: '+theme.name+' · Teste visual de resposta ao toque</p><div class="tvt-entry-progress"><div class="tvt-entry-progress-fill" id="tvtCalProgress" style="width:0%"></div></div></div><div class="tvt-cal-bottom"><span class="tvt-cal-counter" id="tvtCalCounter">0 / '+maxTargets+'</span><button type="button" id="tvtCalSkip">Pular teste</button></div></div>';
    $('tvtCalSkip').addEventListener('click',complete);
    placeTarget();
    gameTimer=setTimeout(finishCalibration,5200);
  }
  function finishCalibration() {
    clearTimeout(gameTimer);
    if (!overlay) return;
    const count=times.length;
    const mean=count?Math.round(times.reduce((a,b)=>a+b,0)/count):0;
    const total=Math.min(5.2,(performance.now()-startedAt)/1000);
    const description=count===maxTargets?'Todos os alvos foram acionados.':'Teste parcial. Se algum ponto não respondeu, verifique no Diagnóstico.';
    overlay.innerHTML='<div class="tvt-entry-card"><p class="tvt-entry-kicker">VERIFICAÇÃO CONCLUÍDA</p><h2>Pronto para <span>explorar.</span></h2><p class="tvt-entry-description">'+description+'</p><div class="tvt-cal-result"><div class="tvt-cal-stat">Alvos acionados<strong>'+count+' / '+maxTargets+'</strong></div><div class="tvt-cal-stat">Resposta média observada<strong>'+(mean?mean+' ms':'—')+'</strong></div></div><p class="tvt-entry-info">Duração: '+total.toFixed(1)+' s. Essa medida inclui o tempo da pessoa para encontrar e tocar o alvo; não mede a latência física do sensor.</p><div class="tvt-entry-actions"><button type="button" class="tvt-entry-main" id="tvtFinish">Entrar no portal</button><button type="button" class="tvt-entry-secondary" id="tvtReplay">Repetir teste</button><button type="button" class="tvt-entry-secondary" id="tvtArcadeNow">🎮 Ver jogos</button></div></div>';
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
      games.style.cssText='display:inline-flex;align-items:center;min-height:48px;padding:10px 15px;border-radius:12px;background:#1b4167;color:#eefbff;text-decoration:none;font-weight:750';
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