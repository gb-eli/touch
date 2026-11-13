(() => {
  'use strict';
  const doc=document;
  const atPortal=!!doc.getElementById('conteudo');
  const atArcade=!!doc.querySelector('.arcade-shell');
  const atAdmin=!!doc.querySelector('.content-wrap');
  const key='agv:motion:quiet:v1';
  const shortcuts=[
    {id:'inicio',type:'page',group:'Navegar',name:'Início',detail:'Visão geral e acesso às experiências'},
    {id:'laboratorio',type:'page',group:'Navegar',name:'Laboratório',detail:'Ferramentas interativas por disciplina'},
    {id:'biblioteca',type:'page',group:'Navegar',name:'Biblioteca digital',detail:'Pesquise recursos e orientações'},
    {id:'videos',type:'page',group:'Navegar',name:'Vídeos 360°',detail:'Experiências imersivas e curadoria'},
    {id:'favoritos',type:'page',group:'Navegar',name:'Favoritos',detail:'Seus recursos salvos neste navegador'},
    {id:'guia',type:'page',group:'Navegar',name:'Guia do professor',detail:'Ideias de atividades para a aula'},
    {id:'diagnostico',type:'page',group:'Navegar',name:'Diagnóstico da tela',detail:'Rede, precisão e recursos touch'},
    {id:'piano',type:'page',group:'Experimentar',name:'Piano multitoque',detail:'Notas, timbres e acordes'},
    {id:'cosmos',type:'page',group:'Experimentar',name:'Universo 3D',detail:'Planetas e exploração espacial'},
    {id:'memoria',type:'page',group:'Experimentar',name:'Jogo da memória',detail:'Associação visual e raciocínio'},
    {id:'fisica',type:'page',group:'Experimentar',name:'Física 2D',detail:'Trajetórias e gravidade'},
    {id:'desenho',type:'tool',group:'Experimentar',name:'Quadro digital',detail:'Desenho, anotação e explicações'},
    {id:'solidos',type:'tool',group:'Experimentar',name:'Sólidos geométricos',detail:'Visualize e gire figuras em 3D'},
    {id:'encaixe',type:'tool',group:'Experimentar',name:'Desafio de encaixe',detail:'Jogo com formas e níveis'},
    {id:'porto',type:'tool',group:'Experimentar',name:'Desafio portuário',detail:'Problemas e decisões no porto'},
    {id:'snake',type:'game',group:'Arcade',name:'Snake',detail:'Direção e estratégia'},
    {id:'pong',type:'game',group:'Arcade',name:'Pong',detail:'Reflexo e coordenação'},
    {id:'basket',type:'game',group:'Arcade',name:'Basquete',detail:'Ângulo, força e trajetória'},
    {id:'pool',type:'game',group:'Arcade',name:'Sinuca',detail:'Colisões e geometria'},
    {id:'admin',type:'admin',group:'Gerenciar',name:'Painel administrativo',detail:'Acesso restrito aos responsáveis'}
  ];
  const contexts={
    inicio:['PAINEL INTERATIVO','Selecione uma experiência ou procure uma atividade.'],
    laboratorio:['FERRAMENTAS DA AULA','Escolha uma atividade criada para a tela touch.'],
    biblioteca:['RECURSOS E CURADORIA','Use os filtros ou procure por tema e disciplina.'],
    videos:['EXPLORAÇÃO 360°','Confira o conteúdo externo antes de exibir à turma.'],
    favoritos:['ACESSO RÁPIDO','Seus recursos favoritos ficam neste navegador.'],
    guia:['ROTEIROS DE AULA','Prepare uma pergunta, explore e converse com a turma.'],
    diagnostico:['VERIFICAÇÃO TOUCH','Teste resposta, rede e recursos do equipamento.'],
    atividade:['ATIVIDADE EM ANDAMENTO','Use os controles da atividade e retorne quando terminar.'],
    cosmos:['CIÊNCIAS · 3D','Arraste para girar e aproxime para observar os planetas.'],
    memoria:['RACIOCÍNIO','Vire duas cartas e encontre os pares.'],
    fisica:['FÍSICA INTERATIVA','Experimente diferentes lançamentos e gravidades.'],
    piano:['ARTES · MÚSICA','Experimente acordes com um ou mais dedos.'],
    mais:['CONFIGURAÇÕES','Explore ferramentas complementares e ajuda.']
  };
  const clean=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const $=id=>doc.getElementById(id);
  let dialog=null,list=null,search=null,bar=null,page='inicio',historyPages=[],items=[],lastFocus=null;
  function button(id,text,label){
    const el=doc.createElement('button');el.type='button';el.id=id;el.className='agv-command-button';el.textContent=text;
    if(label)el.setAttribute('aria-label',label);
    return el;
  }
  function setMotion(quiet){
    doc.body.classList.toggle('agv-quiet-mode',quiet);
    try{localStorage.setItem(key,quiet?'1':'0')}catch{}
    const b=$('agvQuietMotion');if(b){b.textContent=quiet?'Ativar efeitos visuais':'Reduzir efeitos';b.setAttribute('aria-pressed',String(quiet))}
    doc.dispatchEvent(new CustomEvent('agv:motion-change',{detail:{quiet}}));
  }
  function motionIsQuiet(){return doc.body.classList.contains('agv-quiet-mode')}
  function render(values){
    if(!list)return;
    list.replaceChildren();
    const fragment=doc.createDocumentFragment();
    let lastGroup=null;
    values.forEach((item,i)=>{
      if(lastGroup!==item.group){
        lastGroup=item.group;
        const heading=doc.createElement('div');heading.className='agv-command-group';heading.textContent=item.group;fragment.appendChild(heading);
      }
      const btn=doc.createElement('button');btn.type='button';btn.className='agv-command-option';
      btn.dataset.agvIndex=String(i);btn.dataset.agvType=item.type;btn.dataset.agvTarget=item.id;
      const name=doc.createElement('strong');name.textContent=item.name;
      const desc=doc.createElement('small');desc.textContent=item.detail;
      const arrow=doc.createElement('span');arrow.setAttribute('aria-hidden','true');arrow.textContent='↗';
      btn.append(name,desc,arrow);
      fragment.appendChild(btn);
    });
    if(!values.length){
      const empty=doc.createElement('p');empty.className='agv-command-empty';empty.textContent='Nenhum resultado. Experimente outro termo.';fragment.appendChild(empty);
    }
    list.appendChild(fragment);
    items=values;
    const count=$('agvCommandCount');if(count)count.textContent=values.length+' '+(values.length===1?'resultado':'resultados');
  }
  function filter(value){
    const query=clean(value.trim());
    const values=query?shortcuts.filter(item=>clean(item.name+' '+item.detail+' '+item.group).includes(query)):shortcuts;
    render(values);
  }
  function navigate(item){
    if(!item)return;
    if(dialog?.open)dialog.close();
    const type=item.type,id=item.id;
    if(type==='admin'){window.location.assign('admin.html');return}
    if(type==='game'){
      if(atArcade){
        const button=doc.querySelector('[data-game="'+id+'"]');button?.click();
        $('arcadeTitle')?.scrollIntoView?.({behavior:'instant',block:'center'});
      }else window.location.assign('arcade.html?game='+encodeURIComponent(id));
      return;
    }
    if(atPortal&&window.TVTouchNavigation){
      if(type==='tool')window.TVTouchNavigation.tool(id);
      else window.TVTouchNavigation.go(id);
      return;
    }
    if(type==='tool')window.location.assign('index.html?tool='+encodeURIComponent(id));
    else window.location.assign('index.html#'+encodeURIComponent(id));
  }
  function openFinder(){
    if(!dialog)return;
    lastFocus=doc.activeElement;
    search.value='';
    filter('');
    if(typeof dialog.showModal==='function')dialog.showModal();
    else {dialog.hidden=false;dialog.setAttribute('open','');}
    search.focus();
  }
  function closeFinder(){
    if(!dialog)return;
    if(typeof dialog.close==='function'&&dialog.open)dialog.close();
    else{dialog.hidden=true;dialog.removeAttribute('open');}
  }
  function createDialog(){
    dialog=doc.createElement('dialog');
    dialog.id='agvCommandDialog';dialog.className='agv-command-dialog';
    dialog.setAttribute('aria-labelledby','agvCommandTitle');
    dialog.innerHTML='<div class="agv-command-head"><div><span class="agv-command-kicker">AGV TOUCH / ACESSO RÁPIDO</span><h2 id="agvCommandTitle">O que deseja abrir?</h2></div><button type="button" id="agvCommandClose" aria-label="Fechar busca">✕</button></div><label class="agv-command-search"><span aria-hidden="true">⌕</span><input type="search" id="agvCommandInput" placeholder="Busque atividades, jogos, ferramentas..." autocomplete="off" aria-label="Pesquisar todas as ferramentas"></label><div id="agvCommandList" class="agv-command-list" aria-label="Resultados de navegação"></div><div class="agv-command-footer"><span id="agvCommandCount" role="status">0 resultados</span><button type="button" id="agvQuietMotion" aria-pressed="false">Reduzir efeitos</button><span>ESC para fechar</span></div>';
    doc.body.appendChild(dialog);
    list=$('agvCommandList');search=$('agvCommandInput');
    $('agvCommandClose').addEventListener('click',closeFinder);
    $('agvQuietMotion').addEventListener('click',()=>setMotion(!motionIsQuiet()));
    dialog.addEventListener('click',event=>{
      if(event.target===dialog){closeFinder();return}
      const target=event.target.closest('[data-agv-index]');
      if(target)navigate(items[Number(target.dataset.agvIndex)]);
    });
    dialog.addEventListener('close',()=>{
      lastFocus?.focus?.({preventScroll:true});
    });
    search.addEventListener('input',()=>filter(search.value));
    search.addEventListener('keydown',event=>{
      if(event.key==='ArrowDown'){
        event.preventDefault();list.querySelector('.agv-command-option')?.focus();
      }
      if(event.key==='Enter'&&items.length){event.preventDefault();navigate(items[0]);}
    });
    list.addEventListener('keydown',event=>{
      const buttons=[...list.querySelectorAll('.agv-command-option')];
      const index=buttons.indexOf(doc.activeElement);
      if(event.key==='ArrowDown'){event.preventDefault();buttons[Math.min(buttons.length-1,index+1)]?.focus();}
      if(event.key==='ArrowUp'){event.preventDefault();if(index<=0)search.focus();else buttons[index-1]?.focus();}
    });
  }
  function currentRoute(next){
    if(!atPortal)return;
    const fresh=next||doc.querySelector('.page.active')?.id.replace('page-','')||'inicio';
    if(page!==fresh){historyPages.push(page);if(historyPages.length>15)historyPages.shift();}
    page=fresh;
    if(!bar)return;
    const desc=contexts[page]||contexts.inicio;
    $('agvContextType').textContent=desc[0];
    $('agvContextHelp').textContent=desc[1];
    $('agvContextHome').hidden=page==='inicio';
    $('agvContextBack').hidden=page==='inicio';
    const trail=$('agvContextTrail');
    const active=doc.querySelector('.page.active [aria-labelledby]')||doc.querySelector('.page.active');
    const heading=active?.querySelector?.('h1');
    trail.textContent=heading?.textContent?.trim()||({inicio:'AGV TOUCH',atividade:'Atividade'}[page]||page);
    trail.title=trail.textContent;
    bar.dataset.page=page;
  }
  function back(){
    if(!window.TVTouchNavigation)return;
    let prev=historyPages.pop()||'inicio';
    if(prev==='atividade')prev='laboratorio';
    const before=page;
    window.TVTouchNavigation.go(prev);
    if(before!==page&&historyPages[historyPages.length-1]===before)historyPages.pop();
  }
  function createContextBar(){
    const main=$('conteudo');if(!main)return;
    bar=doc.createElement('div');bar.id='agvExperienceBar';bar.className='agv-experience-bar';
    bar.setAttribute('aria-label','Navegação contextual');
    const copy=doc.createElement('div');copy.className='agv-context-copy';
    copy.innerHTML='<span id="agvContextType">PAINEL INTERATIVO</span><strong id="agvContextTrail">AGV TOUCH</strong><small id="agvContextHelp">Selecione uma experiência.</small>';
    const actions=doc.createElement('div');actions.className='agv-context-actions';
    const backBtn=button('agvContextBack','← Voltar','Retornar à página anterior');
    const homeBtn=button('agvContextHome','⌂ Início','Voltar à tela inicial');
    const searchBtn=button('agvContextFind','⌕ Encontrar atividade','Abrir busca de ferramentas');
    searchBtn.classList.add('agv-context-primary');
    backBtn.addEventListener('click',back);
    homeBtn.addEventListener('click',()=>window.TVTouchNavigation?.go('inicio'));
    searchBtn.addEventListener('click',openFinder);
    actions.append(backBtn,homeBtn,searchBtn);
    bar.append(copy,actions);
    main.insertBefore(bar,main.firstChild);
    currentRoute();
    window.addEventListener('tvt:page-change',e=>currentRoute(e.detail?.page));
  }
  function addOpenButton(){
    if(atPortal){createContextBar();return}
    const target=atArcade?doc.querySelector('.arcade-header'):doc.querySelector('.header-actions');
    if(!target)return;
    const btn=button('agvGlobalFind','⌕ Explorar','Pesquisar todas as ferramentas AGV TOUCH');
    btn.classList.add('agv-global-find');btn.addEventListener('click',openFinder);
    target.appendChild(btn);
  }
  function setup(){
    try{if(localStorage.getItem(key)==='1')doc.body.classList.add('agv-quiet-mode')}catch{}
    createDialog();addOpenButton();
    doc.addEventListener('keydown',event=>{
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
        event.preventDefault();
        if(dialog?.open)closeFinder();else openFinder();
      }
      if(event.key==='Escape'&&dialog?.hasAttribute('open')&&!dialog.open)closeFinder();
    });
    doc.addEventListener('pointerdown',event=>{
      if(event.button>0)return;
      const target=event.target?.closest?.('button, a, [role="button"]');
      if(!target||target.closest('.agv-command-dialog')||target.closest('.tvt-entry'))return;
      target.classList.add('agv-pressed');
      const clear=()=>target.classList.remove('agv-pressed');
      target.addEventListener('pointerup',clear,{once:true});
      target.addEventListener('pointercancel',clear,{once:true});
    },{passive:true});
    if(atPortal)currentRoute();
    window.AGVTouchUX=Object.freeze({openFinder,navigate,quiet:motionIsQuiet,setMotion});
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',setup,{once:true});
  else setup();
})();
