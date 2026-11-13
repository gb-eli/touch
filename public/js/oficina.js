(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const board=$('oficinaBoard'),tools=$('oficinaTools'),status=$('oficinaStatus');
  if(!board||!tools)return;
  const names={
    blocks:['CRIAR · MATERIAIS','Blocos texturizados','Escolha um material, empilhe, arraste e crie estruturas.'],
    pattern:['PRECISÃO · TOQUE','Conexões neurais','Observe uma sequência de pontos e reconstrua o caminho.'],
    ttt:['ESTRATÉGIA · TURNOS','Jogo da velha','Duas pessoas ou contra a máquina, com jogadas variadas.'],
    checkers:['ESTRATÉGIA · TABULEIRO','Damas','Capture peças, promova damas e pense antes de mover.'],
    puzzle:['CRIATIVIDADE · IMAGEM','Quebra-cabeça','Monte uma imagem ou escolha uma foto do seu dispositivo.']
  };
  const materialNames={grass:'Grama',dirt:'Terra',sand:'Areia',stone:'Pedra',lava:'Lava',ice:'Gelo',wood:'Madeira',brick:'Tijolo',crystal:'Cristal'};
  const choice=[...document.querySelectorAll('[data-oficina]')];
  let game='blocks',state=null,controller=null,asyncId=0,started=0,clockTimer=0,thinkingTimer=0,sound=false,audioCtx=null,photoURL=null;
  const rand=n=>Math.floor(Math.random()*n);
  const shuffle=a=>{const out=[...a];for(let i=out.length-1;i>0;i--){const j=rand(i+1);[out[i],out[j]]=[out[j],out[i]];}return out};
  const safe=n=>String(n).padStart(2,'0');
  const elapsed=()=>started?Math.floor((Date.now()-started)/1000):0;
  function updateClock(){const t=elapsed();$('oficinaClock').textContent=safe(Math.floor(t/60))+':'+safe(t%60)}
  function setStatus(message,kind=''){status.textContent=message;status.className='oficina-status'+(kind?' '+kind:'')}
  function animate(kind='oficina-flash'){
    board.classList.remove('oficina-flash','oficina-shake');
    void board.offsetWidth;
    board.classList.add(kind);
  }
  function playTone(hz=360,kind='sine'){
    if(!sound)return;
    try{
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
      audioCtx??=new AC();
      if(audioCtx.state==='suspended')void audioCtx.resume();
      const osc=audioCtx.createOscillator(),gain=audioCtx.createGain(),start=audioCtx.currentTime;
      osc.type=kind;osc.frequency.setValueAtTime(hz,start);osc.frequency.exponentialRampToValueAtTime(Math.max(80,hz*.65),start+.16);
      gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.045,start+.014);gain.gain.exponentialRampToValueAtTime(.0001,start+.24);
      osc.connect(gain);gain.connect(audioCtx.destination);osc.start(start);osc.stop(start+.25);
    }catch{}
  }
  $('oficinaSound').addEventListener('click',()=>{
    sound=!sound;
    $('oficinaSound').setAttribute('aria-pressed',String(sound));
    $('oficinaSound').textContent=sound?'♫ Efeitos sonoros ligados':'♫ Ativar efeitos sonoros';
    if(sound)playTone(680);
  });
  function button(label,action,selected=false){
    const b=document.createElement('button');b.type='button';b.textContent=label;
    if(selected)b.setAttribute('aria-pressed','true');
    b.addEventListener('click',action);tools.appendChild(b);return b;
  }
  function select(label,options,value,change){
    const l=document.createElement('label');l.textContent=label;
    const field=document.createElement('select');
    options.forEach(([key,name])=>{const opt=document.createElement('option');opt.value=key;opt.textContent=name;field.appendChild(opt)});
    field.value=value;field.addEventListener('change',()=>change(field.value));l.appendChild(field);tools.appendChild(l);return field;
  }
  function cleanup(){
    if(controller){controller.abort();controller=null}
    if(thinkingTimer)clearTimeout(thinkingTimer);thinkingTimer=0;
    if(clockTimer)clearInterval(clockTimer);clockTimer=0;
    asyncId++;
  }
  function start(next){
    if(!names[next])return;
    cleanup();game=next;started=Date.now();updateClock();clockTimer=setInterval(updateClock,1000);
    const [category,title,help]=names[next];
    $('oficinaCategory').textContent=category;$('oficinaTitle').textContent=title;$('oficinaHelp').textContent=help;
    choice.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.oficina===game)));
    tools.replaceChildren();board.replaceChildren();board.classList.remove('oficina-shake','oficina-flash');
    controller=new AbortController();
    if(game==='blocks')initializeBlocks();
    if(game==='pattern')initializePattern();
    if(game==='ttt')initializeTtt();
    if(game==='checkers')initializeCheckers();
    if(game==='puzzle')initializePuzzle();
    try{history.replaceState(null,'',location.pathname+'?game='+game)}catch{}
  }
  choice.forEach(b=>b.addEventListener('click',()=>start(b.dataset.oficina)));
  $('oficinaRestart').addEventListener('click',()=>start(game));
  const fullscreenButton=$('oficinaFullscreen'),stage=$('oficinaStage');
  if(fullscreenButton&&stage){
    fullscreenButton.addEventListener('click',()=>{
      const expanded=document.fullscreenElement===stage;
      const action=expanded?document.exitFullscreen?.bind(document):stage.requestFullscreen?.bind(stage);
      if(!action){setStatus('Este navegador não disponibiliza tela cheia para a atividade.','warn');return;}
      try{
        Promise.resolve(action()).catch(()=>{
          setStatus('O Android não permitiu expandir esta atividade. Use a visualização normal.','warn');
        });
      }catch{
        setStatus('Não foi possível ativar a tela cheia neste navegador.','warn');
      }
    });
    document.addEventListener('fullscreenchange',()=>{
      const expanded=document.fullscreenElement===stage;
      fullscreenButton.textContent=expanded?'⤢ Sair da tela cheia':'⛶ Tela cheia';
      fullscreenButton.setAttribute('aria-pressed',String(expanded));
      fullscreenButton.setAttribute('aria-label',expanded?'Sair da tela cheia':'Expandir a atividade em tela cheia');
    });
  }
  // === MATERIAIS E CONSTRUÇÃO ===
  const goals=[[2,3,4,2,1,3,1,2],[1,2,3,4,4,3,2,1],[3,1,3,1,3,1,3,1],[2,2,2,2,2,2,2,2]];
  function initializeBlocks(){
    state={columns:Array.from({length:8},()=>[]),material:'grass',source:null,dragFrom:null,dragMaterial:null,mode:'free',goal:goals[rand(goals.length)],history:[],suppressUntil:0,dragPointerId:null};
    button('Construção livre',()=>{state.mode='free';state.source=null;renderBlocks()},true);
    button('Desafio de alturas',()=>{state.mode='goal';state.goal=goals[rand(goals.length)];renderBlocks()});
    button('↶ Desfazer',()=>{
      const snap=state.history.pop();
      if(snap){state.columns=snap;state.source=null;renderBlocks();setStatus('Última ação desfeita.')}
    });
    button('Limpar blocos',()=>{saveBlocks();state.columns=Array.from({length:8},()=>[]);renderBlocks();setStatus('Área limpa. Monte outra estrutura.')});
    const palette=document.createElement('div');palette.className='oficina-palette';palette.setAttribute('aria-label','Materiais para construção');
    for(const [id,name] of Object.entries(materialNames)){
      const chip=document.createElement('button');chip.type='button';chip.dataset.material=id;
      chip.innerHTML='<span class="oficina-swatch" data-material="'+id+'" aria-hidden="true"></span><strong>'+name+'</strong>';
      chip.addEventListener('click',()=>{state.material=id;state.source=null;renderPalette()});
      chip.addEventListener('pointerdown',()=>{state.dragMaterial=id});
      palette.appendChild(chip);
    }
    tools.appendChild(palette);
    const target=document.createElement('div');target.id='oficinaBlockGoal';target.className='oficina-goal';tools.appendChild(target);
    const signal=controller.signal;
    document.addEventListener('pointerup',e=>{
      if(game!=='blocks'||!state.dragMaterial)return;
      const hit=typeof document.elementFromPoint==='function'?
        document.elementFromPoint(e.clientX,e.clientY):e.target;
      const column=hit?.closest?.('[data-column]');
      if(column){
        state.material=state.dragMaterial;
        state.suppressUntil=Date.now()+380;
        addBlock(Number(column.dataset.column));
      }
      state.dragMaterial=null;
    },{signal});
    document.addEventListener('pointercancel',()=>{
      if(game!=='blocks')return;
      state.dragMaterial=null;state.dragFrom=null;state.dragPointerId=null;
      board.classList.remove('oficina-grabbing');
    },{signal});
    board.addEventListener('pointerdown',e=>{
      const tile=e.target.closest('.oficina-cube');
      if(!tile)return;
      const col=Number(tile.closest('[data-column]').dataset.column);
      if(Number(tile.dataset.row)!==state.columns[col].length-1)return;
      state.dragFrom=col;
      state.dragPointerId=e.pointerId;
      board.classList.add('oficina-grabbing');
    },{signal});
    board.addEventListener('pointerup',e=>{
      if(state.dragFrom===null||e.pointerId!==state.dragPointerId)return;
      // Em Android a captura implícita mantém e.target na origem;
      // a coluna real é a que está sob o dedo na hora de soltar.
      const hit=typeof document.elementFromPoint==='function'?
        document.elementFromPoint(e.clientX,e.clientY):e.target;
      const col=hit?.closest?.('[data-column]');
      if(col&&Number(col.dataset.column)!==state.dragFrom){
        state.suppressUntil=Date.now()+380;
        moveBlock(state.dragFrom,Number(col.dataset.column));
      }
      state.dragFrom=null;state.dragPointerId=null;
      board.classList.remove('oficina-grabbing');
    },{signal});
    board.addEventListener('click',e=>{
      if(Date.now()<state.suppressUntil)return;
      const c=e.target.closest('[data-column]');if(!c)return;
      const col=Number(c.dataset.column);
      if(state.source!==null&&state.source!==col){moveBlock(state.source,col);return}
      if(state.source===col){state.source=null;renderBlocks();setStatus('Seleção cancelada.');return}
      const tile=e.target.closest('.oficina-cube');
      if(tile&&Number(tile.dataset.row)===state.columns[col].length-1){state.source=col;renderBlocks();setStatus('Bloco selecionado. Toque em outra coluna para mover.');return}
      addBlock(col);
    },{signal});
    board.addEventListener('keydown',e=>{
      if(e.key!=='Enter'&&e.key!==' ')return;
      const c=e.target.closest('[data-column]');if(!c)return;
      e.preventDefault();
      const col=Number(c.dataset.column);
      if(state.source!==null&&state.source!==col)moveBlock(state.source,col);else addBlock(col);
    },{signal});
    renderBlocks();setStatus('Selecione um material e toque em uma coluna. Também pode mover o bloco superior entre colunas.');
  }
  function saveBlocks(){state.history.push(state.columns.map(c=>[...c]));if(state.history.length>30)state.history.shift()}
  function addBlock(col){
    if(state.columns[col].length>=6){setStatus('Essa coluna já alcançou a altura máxima de seis blocos.','warn');playTone(160);return}
    saveBlocks();state.columns[col].push(state.material);state.source=null;renderBlocks();playTone(420);checkBlockGoal();
  }
  function moveBlock(from,to){
    if(from===to)return;
    if(!state.columns[from].length||state.columns[to].length>=6){setStatus('Movimento não permitido: escolha uma coluna com espaço.','warn');return}
    saveBlocks();
    state.columns[to].push(state.columns[from].pop());
    state.source=null;renderBlocks();playTone(530);checkBlockGoal();
  }
  function renderPalette(){
    tools.querySelectorAll('[data-material]').forEach(b=>{
      if(!b.matches('button'))return;
      b.setAttribute('aria-pressed',String(b.dataset.material===state.material));
    });
  }
  function renderBlocks(){
    if(state.mode==='goal'){
      tools.querySelectorAll('button').forEach(b=>{if(b.textContent==='Construção livre'||b.textContent==='Desafio de alturas')b.setAttribute('aria-pressed',String(b.textContent==='Desafio de alturas'))});
    }else tools.querySelectorAll('button').forEach(b=>{if(b.textContent==='Construção livre'||b.textContent==='Desafio de alturas')b.setAttribute('aria-pressed',String(b.textContent==='Construção livre'))});
    const target=$('oficinaBlockGoal');if(target)target.textContent=state.mode==='goal'?'Missão — alturas: '+state.goal.join(' · ')+' (da esquerda para a direita)':'Construção livre — 8 colunas × 6 andares · 9 materiais';
    board.innerHTML='<div class="oficina-builder" id="oficinaBlockBoard" role="group" aria-label="Área de construção de oito colunas">'+state.columns.map((blocks,index)=>{
      const contents=blocks.map((mat,row)=>'<span class="oficina-cube'+(state.source===index&&row===blocks.length-1?' grabbed':'')+'" data-material="'+mat+'" data-row="'+row+'" aria-hidden="true"></span>').join('');
      return '<div role="button" tabindex="0" class="oficina-column'+(state.mode==='goal'?' target':'')+'" data-column="'+index+'" aria-label="Coluna '+(index+1)+', '+blocks.length+' blocos">'+contents+'</div>';
    }).join('')+'</div>';
    renderPalette();
  }
  function checkBlockGoal(){
    if(state.mode!=='goal')return;
    if(state.columns.every((c,i)=>c.length===state.goal[i])){
      animate();setStatus('Desafio concluído! Todas as colunas estão na altura indicada.','success');playTone(840,'triangle');
      const target=$('oficinaBlockGoal');if(target)target.textContent='✓ Padrão concluído. Escolha outro desafio para continuar.';
    }else setStatus('Progresso: '+state.columns.filter((c,i)=>c.length===state.goal[i]).length+' de 8 colunas na altura desejada.');
  }
  // === CONEXÕES / CAMINHO DE PONTOS ===
  const position=i=>({x:17+(i%3)*33,y:17+Math.floor(i/3)*33});
  function randomPattern(){
    const len=4+rand(3),out=[rand(9)];
    while(out.length<len){const possibilities=Array.from({length:9},(_,i)=>i).filter(i=>!out.includes(i));out.push(possibilities[rand(possibilities.length)])}
    return out;
  }
  function initializePattern(){
    state={target:randomPattern(),trace:[],preview:true,locked:true,dragging:false,tries:0};
    button('Mostrar sequência',()=>previewPattern(),true);
    button('Nova sequência',()=>{state.target=randomPattern();state.tries=0;previewPattern()});
    button('Apagar traçado',()=>{state.trace=[];state.locked=false;drawPattern();setStatus('Traçado limpo. Comece pelo primeiro ponto.')});
    board.innerHTML='<div class="oficina-pattern" id="oficinaPattern" role="group" aria-label="Painel de nove pontos">'+
      '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path id="oficinaPatternLine"></path></svg>'+
      Array.from({length:9},(_,i)=>'<button type="button" data-dot="'+i+'" aria-label="Ponto '+(i+1)+'" style="left:'+(17+i%3*33)+'%;top:'+(17+Math.floor(i/3)*33)+'%">'+(i+1)+'</button>').join('')+'</div>';
    const panel=$('oficinaPattern'),signal=controller.signal;
    panel.addEventListener('pointerdown',e=>{
      const target=e.target.closest('[data-dot]');if(!target||state.preview)return;
      state.dragging=true;try{panel.setPointerCapture(e.pointerId)}catch{}
      recordDot(Number(target.dataset.dot));
    },{signal});
    panel.addEventListener('pointermove',e=>{
      if(!state.dragging||state.preview)return;
      const r=panel.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*100,y=(e.clientY-r.top)/r.height*100;
      for(let i=0;i<9;i++){const p=position(i);if(Math.hypot(x-p.x,y-p.y)<9){recordDot(i);break}}
    },{signal});
    panel.addEventListener('pointerup',()=>{state.dragging=false},{signal});
    panel.addEventListener('pointercancel',()=>{state.dragging=false},{signal});
    panel.addEventListener('click',e=>{
      const dot=e.target.closest('[data-dot]');if(dot&&!state.preview)recordDot(Number(dot.dataset.dot));
    },{signal});
    previewPattern();
  }
  function drawPattern(){
    if(game!=='pattern')return;
    const used=state.preview?state.target:state.trace;
    $('oficinaPatternLine').setAttribute('d',used.map((n,i)=>{const p=position(n);return(i?' L ':'M ')+p.x+' '+p.y}).join(''));
    board.querySelectorAll('[data-dot]').forEach(b=>b.classList.toggle('active',used.includes(Number(b.dataset.dot))));
  }
  function previewPattern(){
    if(thinkingTimer)clearTimeout(thinkingTimer);
    state.trace=[];state.preview=true;state.locked=true;drawPattern();
    setStatus('Observe a sequência iluminada. Ela desaparecerá para você repetir o desenho.');
    const token=asyncId;
    thinkingTimer=setTimeout(()=>{if(token!==asyncId||game!=='pattern')return;state.preview=false;state.locked=false;drawPattern();setStatus('Agora é sua vez: conecte os pontos na ordem observada. Pode arrastar ou tocar um por um.');},2300);
  }
  function recordDot(n){
    if(state.locked||state.preview)return;
    if(state.trace.at(-1)===n)return;
    if(state.trace.includes(n))return;
    const expected=state.target[state.trace.length];
    if(expected!==n){
      state.tries++;state.trace=[];animate('oficina-shake');drawPattern();setStatus('Caminho diferente. Tente novamente a partir do primeiro ponto.','warn');playTone(170);return;
    }
    state.trace.push(n);drawPattern();playTone(300+n*32);
    if(state.trace.length===state.target.length){
      state.locked=true;animate();setStatus('Conexão completa! Sequência de '+state.trace.length+' pontos em '+(state.tries+1)+' tentativa(s).','success');playTone(950,'triangle');
    }else setStatus('Conexões: '+state.trace.length+' / '+state.target.length+'. Continue a linha.');
  }
  // === JOGO DA VELHA ===
  const tttLines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const tttWin=cells=>{for(const line of tttLines){const [a,b,c]=line;if(cells[a]&&cells[a]===cells[b]&&cells[b]===cells[c])return {winner:cells[a],line}}return cells.every(Boolean)?{winner:'draw',line:[]}:null};
  function initializeTtt(){
    state={cells:Array(9).fill(null),turn:'X',mode:'cpu',over:false,scores:{X:0,O:0,draw:0},thinking:false};
    select('Partida', [['cpu','Contra a máquina'],['local','Duas pessoas']],state.mode,v=>{state.mode=v;resetTtt();});
    button('Nova rodada',resetTtt);
    renderTtt();setStatus('Você joga com X. Toque em qualquer casa para começar.');
  }
  function resetTtt(){if(thinkingTimer)clearTimeout(thinkingTimer);state.cells=Array(9).fill(null);state.turn='X';state.over=false;state.thinking=false;renderTtt();setStatus('Nova rodada. Vez de X.')}
  function moveTtt(index){
    if(state.over||state.thinking||state.cells[index])return;
    state.cells[index]=state.turn;playTone(state.turn==='X'?480:630);finishTtt();
  }
  function finishTtt(){
    const outcome=tttWin(state.cells);
    if(outcome){
      state.over=true;
      state.scores[outcome.winner]=(state.scores[outcome.winner]||0)+1;
      renderTtt(outcome.line);
      if(outcome.winner==='draw')setStatus('Empate! Uma rodada bem disputada.','success');
      else setStatus((outcome.winner==='X'?'X':'O')+' venceu esta rodada!','success');
      animate();playTone(930,'triangle');return;
    }
    state.turn=state.turn==='X'?'O':'X';
    if(state.mode==='cpu'&&state.turn==='O'){
      state.thinking=true;
      renderTtt();
      setStatus('A máquina está avaliando suas possibilidades…');
      const token=asyncId;thinkingTimer=setTimeout(()=>{
        if(token!==asyncId||game!=='ttt'||state.over)return;
        state.thinking=false;const move=chooseTtt();
        if(move!==null){state.cells[move]='O';playTone(540);finishTtt();}
      },400+rand(510));
    }else{
      renderTtt();
      setStatus('Vez de '+state.turn+'. Escolha uma casa.');
    }
  }
  function chooseTtt(){
    const free=state.cells.map((x,i)=>x===null?i:-1).filter(i=>i>=0);
    if(!free.length)return null;
    const find=mark=>free.find(i=>{const temp=[...state.cells];temp[i]=mark;return tttWin(temp)?.winner===mark});
    if(Math.random()<.68){const win=find('O');if(win!==undefined)return win;const block=find('X');if(block!==undefined)return block;}
    if(Math.random()<.62&&free.includes(4))return 4;
    return free[rand(free.length)];
  }
  function renderTtt(wins=[]){
    board.innerHTML='<div class="oficina-grid3" role="grid" aria-label="Jogo da velha">'+state.cells.map((mark,i)=>
      '<button type="button" role="gridcell" data-square="'+i+'" class="'+(wins.includes(i)?'winning ':'')+(mark==='X'?'mark-x':mark==='O'?'mark-o':'')+'" aria-label="Casa '+(i+1)+': '+(mark||'vazia')+'" '+(state.over||mark||state.thinking?'disabled':'')+'>'+(mark||'')+'</button>'
    ).join('')+'</div>';
    board.querySelectorAll('[data-square]').forEach(b=>b.addEventListener('click',()=>moveTtt(Number(b.dataset.square)),{signal:controller.signal}));
    const info=tools.querySelector('.oficina-score')||document.createElement('div');info.className='oficina-score';
    info.innerHTML='<b>X: '+state.scores.X+'</b><b>O: '+state.scores.O+'</b><b>Empates: '+state.scores.draw+'</b>';
    if(!info.parentElement)tools.appendChild(info);
  }
  // === DAMAS ===
  const inBounds=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
  const side=p=>p>0?'w':'b';
  function initCheckersBoard(){
    const arr=Array(64).fill(0);
    for(let r=0;r<3;r++)for(let c=0;c<8;c++)if((r+c)%2===1)arr[r*8+c]=-1;
    for(let r=5;r<8;r++)for(let c=0;c<8;c++)if((r+c)%2===1)arr[r*8+c]=1;
    return arr;
  }
  function movesFor(b,index,capturesOnly=false){
    const piece=b[index];if(!piece)return[];
    const r=Math.floor(index/8),c=index%8,dirs=Math.abs(piece)===2?[-1,1]:[piece>0?-1:1];
    const moves=[];
    for(const dy of dirs)for(const dx of [-1,1]){
      const nr=r+dy,nc=c+dx;
      if(!inBounds(nr,nc))continue;
      const j=nr*8+nc;
      if(!b[j]&&!capturesOnly)moves.push({from:index,to:j,capture:-1});
      if(b[j]&&side(b[j])!==side(piece)&&inBounds(nr+dy,nc+dx)){
        const dest=(nr+dy)*8+nc+dx;if(!b[dest])moves.push({from:index,to:dest,capture:j});
      }
    }
    return moves;
  }
  function legalMoves(b,turn,forced=-1){
    let moves=[];
    b.forEach((piece,i)=>{if(piece&&side(piece)===turn&&(forced<0||forced===i))moves.push(...movesFor(b,i,forced>=0))});
    if(moves.some(m=>m.capture>=0))return moves.filter(m=>m.capture>=0);
    return forced>=0?[]:moves;
  }
  function initializeCheckers(){
    state={cells:initCheckersBoard(),turn:'w',selected:-1,forced:-1,mode:'cpu',over:false,thinking:false,scores:{w:0,b:0}};
    select('Partida',[['cpu','Contra a máquina'],['local','Duas pessoas']],state.mode,v=>{state.mode=v;resetCheckers()});
    button('Nova partida',resetCheckers);
    renderCheckers();setStatus('Suas peças são coral. Capture é obrigatório e damas promovidas podem voltar.');
  }
  function resetCheckers(){if(thinkingTimer)clearTimeout(thinkingTimer);state.cells=initCheckersBoard();state.turn='w';state.selected=-1;state.forced=-1;state.over=false;state.thinking=false;renderCheckers();setStatus('Nova partida: coral começa.')}
  function checkersPlay(move){
    const s=state,piece=s.cells[move.from];
    s.cells[move.to]=piece;s.cells[move.from]=0;
    if(move.capture>=0)s.cells[move.capture]=0;
    const lastRow=Math.floor(move.to/8);
    if(Math.abs(piece)===1&&((piece>0&&lastRow===0)||(piece<0&&lastRow===7)))s.cells[move.to]=piece>0?2:-2;
    if(move.capture>=0&&legalMoves(s.cells,s.turn,move.to).length){
      s.forced=move.to;s.selected=move.to;renderCheckers();playTone(620);
      if(s.mode==='cpu'&&s.turn==='b')scheduleCheckersAI();
      else setStatus('Captura adicional obrigatória com a mesma peça.');
      return;
    }
    s.forced=-1;s.selected=-1;s.turn=s.turn==='w'?'b':'w';
    playTone(move.capture>=0?730:370);
    const possible=legalMoves(s.cells,s.turn);
    if(!possible.length){
      s.over=true;state.scores[s.turn==='w'?'b':'w']++;
      setStatus('Partida concluída: '+(s.turn==='w'?'azul':'coral')+' venceu!','success');animate();renderCheckers();return;
    }
    renderCheckers();
    if(s.turn==='b'&&s.mode==='cpu'){s.thinking=true;setStatus('A máquina está analisando os movimentos…');scheduleCheckersAI()}
    else setStatus('Vez '+(s.turn==='w'?'das peças coral':'das peças azuis')+'.'+(possible.some(m=>m.capture>=0)?' Há uma captura obrigatória.':''));
  }
  function scheduleCheckersAI(){
    const token=asyncId;
    if(thinkingTimer)clearTimeout(thinkingTimer);
    thinkingTimer=setTimeout(()=>{
      if(token!==asyncId||game!=='checkers'||state.over||state.turn!=='b')return;
      const options=legalMoves(state.cells,'b',state.forced);
      if(!options.length){state.over=true;setStatus('Coral venceu a partida!','success');return}
      const score=m=>m.capture>=0?10+(Math.floor(m.to/8)===7?8:0):((m.to%8)>=2&&(m.to%8)<=5?3:0)+Math.floor(m.to/8);
      let move;
      if(Math.random()<.66){const best=Math.max(...options.map(score));const ranked=options.filter(m=>score(m)===best);move=ranked[rand(ranked.length)];}
      else move=options[rand(options.length)];
      state.thinking=false;checkersPlay(move);
    },400+rand(530));
  }
  function pressCheckers(i){
    const s=state;if(s.over||s.thinking)return;
    if(s.mode==='cpu'&&s.turn==='b')return;
    const moves=legalMoves(s.cells,s.turn,s.forced);
    if(s.selected>=0){
      const m=moves.find(m=>m.from===s.selected&&m.to===i);
      if(m){checkersPlay(m);return;}
    }
    if(moves.some(m=>m.from===i)){s.selected=i;renderCheckers();setStatus('Peça selecionada. Toque na casa destacada.');}
    else{setStatus('Movimento inválido. Se houver captura, ela é obrigatória.','warn');animate('oficina-shake');}
  }
  function renderCheckers(){
    const s=state,valid=legalMoves(s.cells,s.turn,s.forced),destinations=valid.filter(m=>m.from===s.selected).map(m=>m.to);
    const html=s.cells.map((p,i)=>{
      const r=Math.floor(i/8),c=i%8,isDark=(r+c)%2===1;
      const cls=(isDark?'dark':'light')+(i===s.selected?' select':'')+(!p&&destinations.includes(i)?' legal':'');
      const piece=p?'<span class="piece '+(p>0?'player':'cpu')+(Math.abs(p)===2?' king':'')+'"></span>':'';
      return '<button type="button" data-checker="'+i+'" class="'+cls+'" aria-label="Linha '+(r+1)+', coluna '+(c+1)+': '+(p?(p>0?'peça coral':'peça azul')+(Math.abs(p)===2?' promovida':''):'vazia')+'" '+(!isDark?'disabled':'')+'>'+piece+'</button>';
    }).join('');
    board.innerHTML='<div class="oficina-dama" role="grid" aria-label="Tabuleiro de damas, oito por oito">'+html+'</div>';
    board.querySelectorAll('[data-checker]').forEach(b=>b.addEventListener('click',()=>pressCheckers(Number(b.dataset.checker)),{signal:controller.signal}));
    const count=s.cells.reduce((a,p)=>{if(p>0)a[0]++;else if(p<0)a[1]++;return a},[0,0]);
    const info=tools.querySelector('.oficina-score')||document.createElement('div');info.className='oficina-score';info.innerHTML='<b>Coral: '+count[0]+'</b><b>Azul: '+count[1]+'</b>';
    if(!info.parentElement)tools.appendChild(info);
  }
  // === QUEBRA-CABEÇA COM FOTO LOCAL ===
  function initializePuzzle(){
    state={n:3,order:[],pick:-1,moves:0,completed:false,img:photoURL||'assets/agv-synapse-crystal.svg'};
    select('Dificuldade',[['3','3 × 3 · Iniciante'],['4','4 × 4 · Avançado']],String(state.n),v=>{state.n=Number(v);resetPuzzle()});
    button('Misturar',resetPuzzle);
    const label=document.createElement('label');label.textContent='Usar uma foto';
    const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';
    input.setAttribute('aria-label','Escolher uma foto do dispositivo para o quebra-cabeça');
    input.addEventListener('change',e=>{
      const file=e.target.files?.[0];if(!file)return;
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12*1024*1024){
        setStatus('Escolha JPG, PNG ou WebP com até 12 MB.','warn');return
      }
      if(photoURL)URL.revokeObjectURL(photoURL);
      photoURL=URL.createObjectURL(file);state.img=photoURL;resetPuzzle();
      setStatus('Foto carregada apenas neste navegador, sem enviar para servidores.');
    });label.appendChild(input);tools.appendChild(label);
    resetPuzzle();
  }
  function resetPuzzle(){
    const len=state.n**2;state.order=shuffle(Array.from({length:len},(_,i)=>i));
    if(state.order.every((v,i)=>i===v)) [state.order[0],state.order[1]]=[state.order[1],state.order[0]];
    state.pick=-1;state.moves=0;state.completed=false;renderPuzzle();
    setStatus('Selecione duas peças para trocar de posição. Você também pode utilizar sua própria foto.');
  }
  function swapPuzzle(index){
    if(state.completed)return;
    if(state.pick===-1){state.pick=index;renderPuzzle();setStatus('Agora escolha a segunda peça para trocar.');return}
    if(state.pick===index){state.pick=-1;renderPuzzle();return}
    [state.order[state.pick],state.order[index]]=[state.order[index],state.order[state.pick]];
    state.moves++;state.pick=-1;playTone(410);renderPuzzle();
    if(state.order.every((v,i)=>i===v)){state.completed=true;setStatus('Quebra-cabeça concluído em '+state.moves+' trocas!','success');playTone(870,'triangle');animate();}
    else setStatus('Trocas: '+state.moves+'. Continue até reconstruir a imagem.');
  }
  function renderPuzzle(){
    const n=state.n,image=state.img;
    const grid=document.createElement('div');grid.className='oficina-puzzle';grid.style.setProperty('--n',String(n));grid.style.setProperty('--slice-size',(n*100)+'%');
    grid.setAttribute('role','group');grid.setAttribute('aria-label','Quebra-cabeça de '+n*n+' peças');
    state.order.forEach((tile,i)=>{
      const item=document.createElement('button');item.type='button';
      const col=tile%n,row=Math.floor(tile/n);
      item.className=(state.pick===i?'selected ':'')+(tile===i?'correct':'');
      item.style.backgroundImage='url("'+image+'")';
      item.style.setProperty('--pos-x',(col/(n-1)*100)+'%');
      item.style.setProperty('--pos-y',(row/(n-1)*100)+'%');
      item.setAttribute('aria-label','Posição '+(i+1)+': peça '+(tile+1));
      item.addEventListener('click',()=>swapPuzzle(i),{signal:controller.signal});
      grid.appendChild(item);
    });
    board.replaceChildren(grid);
  }
  // Iniciar sem exigir login nem salvar dados dos alunos.
  window.addEventListener('pagehide',()=>{
    cleanup();if(photoURL)URL.revokeObjectURL(photoURL);if(audioCtx)audioCtx.close().catch(()=>{});
  },{once:true});
  let initial='blocks';
  try{const g=new URLSearchParams(location.search).get('game');if(names[g])initial=g}catch{}
  start(initial);
  window.AGVTouchPlayground=Object.freeze({
    activities:Object.keys(names),
    rules:Object.freeze({tttWin,legalMoves,movesFor,initCheckersBoard,randomPattern,goals})
  });
})();
