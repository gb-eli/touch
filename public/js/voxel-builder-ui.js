/* AGV TOUCH 3.5 | Interface do construtor volumétrico. Armazenamento só por ação explícita. */
(()=>{
 'use strict';
 const V=window.AGVVoxels,R=window.AGVVoxelRenderer;
 if(!V||!R)return;
 const KEY='agv-touch:builder3d:v1';
 const MISSIONS=[
  ['free','Construção livre','Toque na grade para colocar blocos, gire o cenário e invente sua estrutura.'],
  ['tower','Torre de 5 níveis','Monte cinco blocos na coluna X4 · Z4, um sobre o outro.'],
  ['stairs','Escadaria','Construa três degraus crescentes da esquerda para a direita.'],
  ['bridge','Ponte','Erga dois pilares e conecte as extremidades com uma travessa.'],
  ['symmetry','Simetria','Reproduza o mesmo padrão dos dois lados do eixo central.']
 ];
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function mount({tools,board,onStatus=()=>{},onFallback=()=>{},onEvent=()=>{}}){
  const world=V.createWorld();let mission='free',material='grass',mode='place',completed=false,disposed=false;
  const root=document.createElement('div');
  root.className='voxel-workspace';
  root.innerHTML=[
   '<div class="voxel-toolbar" role="group" aria-label="Controles de construção">',
    '<fieldset class="voxel-edit-mode"><legend>Editar</legend>',
     '<button type="button" data-voxel-mode="place" aria-pressed="true">＋ Colocar</button>',
     '<button type="button" data-voxel-mode="move" aria-pressed="false">↔ Mover</button>',
     '<button type="button" data-voxel-mode="erase" aria-pressed="false">− Remover</button>',
     '</fieldset>',
    '<details class="voxel-project-details"><summary>⋯ Projeto</summary><fieldset class="voxel-project-actions"><legend>Projeto</legend>',
     '<button type="button" data-voxel-action="undo">↶ Desfazer</button>',
     '<button type="button" data-voxel-action="redo">↷ Refazer</button>',
     '<button type="button" data-voxel-action="save">Salvar aqui</button>',
     '<button type="button" data-voxel-action="load">Carregar</button>',
     '<button type="button" data-voxel-action="clear">Limpar</button>',
     '<button type="button" data-voxel-action="2d">Modo 2D</button>',
    '</fieldset></details>',
    '<label>Desafio <select id="voxelMission" aria-label="Selecionar desafio 3D">',
     ...MISSIONS.map(([id,title])=>'<option value="'+id+'">'+escape(title)+'</option>'),
     '</select></label>',
   '</div>',
   '<div class="voxel-materials" role="group" aria-label="Selecione uma textura">',
   ...V.MATERIALS.map(m=>'<button type="button" data-voxel-material="'+m.id+
    '" aria-pressed="'+String(m.id===material)+'"><span class="voxel-material-dot" aria-hidden="true" style="--voxel-color:'+m.color+
    '"></span>'+escape(m.label)+'</button>'),
   '</div>'
  ].join('');
  tools.classList.add('voxel-active');board.classList.add('voxel-active');
  tools.appendChild(root);
  const scene=document.createElement('div');scene.className='voxel-scene';scene.dataset.mode='place';
  scene.innerHTML=[
   '<canvas id="voxelCanvas" class="voxel-canvas" tabindex="0" aria-label="Construção tridimensional: toque para colocar um bloco; deslize para girar; use dois dedos para aproximar"></canvas>',
   '<div class="voxel-hud" aria-live="polite"><strong id="voxelCounter">0 blocos · 8 × 8 × 6</strong>',
   '<small id="voxelMissionStatus">Construção livre</small><span class="voxel-progress" aria-hidden="true"><i id="voxelProgress"></i></span></div>',
   '<div class="voxel-overlay" aria-label="Controles de câmera">',
   '<button type="button" data-voxel-camera="left" aria-label="Girar a câmera para a esquerda">↶</button>',
   '<button type="button" data-voxel-camera="right" aria-label="Girar a câmera para a direita">↷</button>',
   '<button type="button" data-voxel-camera="minus" aria-label="Afastar a câmera">−</button>',
   '<button type="button" data-voxel-camera="plus" aria-label="Aproximar a câmera">＋</button>',
   '<button type="button" data-voxel-camera="reset" aria-label="Centralizar a câmera">⌂</button>',
   '</div>'
  ].join('');
  const instructions=document.createElement('div');instructions.className='voxel-help';
  instructions.innerHTML='<strong>Controles:</strong> toque para posicionar · arraste para girar · pinça para zoom · modo Mover: escolha origem e destino';
  const mini=document.createElement('details');mini.className='voxel-mini';
  mini.innerHTML='<summary>🎯 Objetivo e mapa do desafio</summary><div class="voxel-mini-content"><div><h3 id="voxelMissionTitle">Construção livre</h3><p id="voxelMissionDescription">Use a grade para construir.</p></div><div class="voxel-plan" id="voxelPlan" aria-label="Mapa superior do desafio"></div></div>';
  const accessible=document.createElement('details');accessible.className='voxel-access-grid';
  accessible.innerHTML='<summary>Posicionar por coordenadas (acessível por teclado)</summary><div class="voxel-quick-grid" role="group" aria-label="Posições X e Z"></div>';
  board.append(scene,instructions,mini,accessible);
  const canvas=scene.querySelector('canvas'),counter=scene.querySelector('#voxelCounter'),
   missionStatus=scene.querySelector('#voxelMissionStatus'),bar=scene.querySelector('#voxelProgress'),
   title=mini.querySelector('#voxelMissionTitle'),description=mini.querySelector('#voxelMissionDescription'),
   plan=mini.querySelector('#voxelPlan'),quickGrid=accessible.querySelector('.voxel-quick-grid');
  for(let z=0;z<V.SIZE;z++)for(let x=0;x<V.SIZE;x++){
   const b=document.createElement('button');b.type='button';
   b.dataset.voxelCell=x+','+z;b.textContent=(x+1)+'·'+(z+1);
   b.setAttribute('aria-label','Coluna X'+(x+1)+' Z'+(z+1)+'. Colocar ou selecionar bloco.');
   quickGrid.appendChild(b);
  }
  function announce(message,kind=''){if(!disposed)onStatus(message,kind)}
  function updatePlan(){
   const targets=V.goals[mission]||[];
   const heights=new Map();
   for(const {x,y,z} of targets){
    const k=x+','+z;heights.set(k,Math.max(heights.get(k)||0,y+1));
   }
   plan.replaceChildren();
   for(let z=0;z<V.SIZE;z++)for(let x=0;x<V.SIZE;x++){
    const k=x+','+z,h=heights.get(k)||0,t=document.createElement('span');
    t.dataset.target=String(h>0);t.textContent=h||'';
    t.title='X'+(x+1)+' Z'+(z+1)+(h?' · até nível '+h:'');
    plan.appendChild(t);
   }
  }
  const renderStatus=()=>{
   if(disposed)return;
   const p=world.progress(mission);
   counter.textContent=world.count+' blocos · 8 × 8 × 6';
   missionStatus.textContent=p.total?p.done+' / '+p.total+' posições do desafio':'Construção livre';
   bar.style.width=(p.total?p.done/p.total*100:0)+'%';
   for(const name of ['undo','redo']){
    const b=root.querySelector('[data-voxel-action="'+name+'"]');
    b.disabled=name==='undo'?!world.canUndo:!world.canRedo;
   }
   if(p.complete&&!completed){
    completed=true;announce('Desafio concluído! Sua estrutura corresponde ao modelo.','success');
    onEvent('win');
   }else if(!p.complete)completed=false;
  };
  const renderer=R.create(canvas,world,{
   onStatus:announce,
   onChange(action){
    renderStatus();
    if(action==='add'||action==='move')onEvent('correct');
    else if(action==='remove')onEvent('move');
   }
  });
  if(!renderer){
   announce('WebGL indisponível. Abrindo a construção 2D.','warn');
   queueMicrotask(onFallback);
   return{dispose(){disposed=true;tools.classList.remove('voxel-active');board.classList.remove('voxel-active')}};
  }
  function chooseMode(next){
   if(!['place','move','erase'].includes(next))return;
   mode=next;renderer.setMode(next);scene.dataset.mode=next;
   root.querySelectorAll('[data-voxel-mode]').forEach(b=>
    b.setAttribute('aria-pressed',String(b.dataset.voxelMode===next)));
   announce(next==='place'?'Toque para encaixar blocos.':
    next==='move'?'Toque no bloco de origem e depois no destino.':'Toque num bloco para removê-lo.');
  }
  function chooseMaterial(next){
   material=next;renderer.setMaterial(next);chooseMode('place');
   root.querySelectorAll('[data-voxel-material]').forEach(b=>
    b.setAttribute('aria-pressed',String(b.dataset.voxelMaterial===next)));
   announce('Material escolhido: '+V.MATERIALS.find(m=>m.id===next)?.label+'.');
  }
  function missionChanged(value){
   mission=value;completed=false;
   const m=MISSIONS.find(item=>item[0]===mission)||MISSIONS[0];
   title.textContent=m[1];description.textContent=m[2];
   updatePlan();renderStatus();announce(m[2]);
  }
  root.addEventListener('click',event=>{
   const b=event.target.closest('button');if(!b)return;
   if(b.dataset.voxelMode){chooseMode(b.dataset.voxelMode);return}
   if(b.dataset.voxelMaterial){chooseMaterial(b.dataset.voxelMaterial);return}
   let action=b.dataset.voxelAction,result=false;
   if(action==='2d'){onFallback();return}
   if(action==='undo')result=world.undo();
   if(action==='redo')result=world.redo();
   if(action==='clear')result=world.clear();
   if(action==='save'){
    try{localStorage.setItem(KEY,world.serialize());announce('Projeto salvo neste navegador.','success')}
    catch{announce('Armazenamento indisponível neste navegador.','warn')}
    return;
   }
   if(action==='load'){
    let saved;try{saved=localStorage.getItem(KEY)}catch{}
    result=Boolean(saved)&&world.load(saved);
    if(!result)announce('Não existe projeto salvo ou ele é inválido.','warn');
   }
   if(result){renderer.refresh();renderStatus();announce('Projeto atualizado.','success')}
  });
  root.querySelector('#voxelMission').addEventListener('change',e=>missionChanged(e.target.value));
  scene.querySelector('.voxel-overlay').addEventListener('click',event=>{
   const b=event.target.closest('[data-voxel-camera]');if(!b)return;
   const c=b.dataset.voxelCamera;
   if(c==='left')renderer.rotate(-Math.PI/7);
   if(c==='right')renderer.rotate(Math.PI/7);
   if(c==='minus')renderer.zoom(2);
   if(c==='plus')renderer.zoom(-2);
   if(c==='reset')renderer.resetCamera();
  });
  quickGrid.addEventListener('click',e=>{
   const b=e.target.closest('[data-voxel-cell]');if(!b)return;
   const [x,z]=b.dataset.voxelCell.split(',').map(Number);
   let y=0;while(y<V.HEIGHT&&world.has(x,y,z))y++;
   if(mode==='erase'&&y>0){
    if(world.remove(x,y-1,z)){renderer.refresh();renderStatus();announce('Bloco removido.')}
   }else if(mode==='place'&&y<V.HEIGHT&&world.add(x,y,z,material)){
    renderer.refresh();renderStatus();announce('Bloco colocado em X'+(x+1)+' Z'+(z+1)+'.','success');
   }else announce('Selecione Colocar/Remover ou escolha uma coluna com espaço.','warn');
  });
  const signal=()=>{
   renderer.dispose();
  };
  missionChanged('free');renderStatus();
  announce('Construção 3D pronta. Selecione um material e toque na grade.','success');
  return{dispose(){disposed=true;signal();tools.classList.remove('voxel-active');board.classList.remove('voxel-active')}};
 }
 window.AGVVoxelBuilder=Object.freeze({mount});
})();