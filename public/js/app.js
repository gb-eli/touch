/* TV TOUCH | AGV — JavaScript puro, sem dependências de terceiros. */
'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const html = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const youtubeSearch = term => `https://www.youtube.com/results?search_query=${encodeURIComponent(term)}`;
const CATEGORIES = ['Todos', 'Portos', 'Tecnologia', 'História', 'Geografia', 'Matemática', 'Ciências', 'Arte', 'Interdisciplinar'];
const RESOURCES = [
  {id:'earth',name:'Google Earth',provider:'Google',icon:'🌍',tone:'blue',type:'Exploração 3D / mapas',categories:['Geografia','Portos','História'],description:'Voe pelo planeta, observe relevos, cidades e paisagens em três dimensões.',url:'https://earth.google.com/web/',lesson:'Localize Paranaguá, identifique o Porto de Paranaguá e compare áreas urbanas, portuárias e ambientais.'},
  {id:'geogebra',name:'GeoGebra 3D',provider:'GeoGebra',icon:'⬡',tone:'violet',type:'Geometria 3D',categories:['Matemática','Tecnologia'],description:'Crie, gire e investigue sólidos, coordenadas, superfícies e funções em 3D.',url:'https://www.geogebra.org/3d',lesson:'Construa um cubo, observe arestas e vértices e discuta como o volume varia com a dimensão.'},
  {id:'phet',name:'PhET Simulações',provider:'Universidade do Colorado Boulder',icon:'⚡',tone:'orange',type:'Simulações científicas',categories:['Ciências','Matemática'],description:'Experimentos digitais de física, química, biologia e matemática em português.',url:'https://phet.colorado.edu/pt_BR/',lesson:'Escolha uma simulação de circuitos, faça uma hipótese e peça à turma para testar o resultado.'},
  {id:'nasa',name:'NASA Eyes',provider:'NASA',icon:'🪐',tone:'blue',type:'Exploração espacial 3D',categories:['Ciências','Geografia','Tecnologia'],description:'Explore planetas, missões espaciais e objetos astronômicos em modelos 3D.',url:'https://science.nasa.gov/eyes/',lesson:'Compare distâncias e movimentos dos planetas e peça que os estudantes expliquem a órbita de um satélite.'},
  {id:'polypad',name:'Polypad',provider:'Amplify / Desmos Classroom',icon:'▦',tone:'green',type:'Manipulativos matemáticos',categories:['Matemática','Arte'],description:'Peças, formas e representações digitais para construir e investigar conceitos.',url:'https://polypad.amplify.com/p',lesson:'Monte padrões com blocos geométricos e peça que a turma identifique simetrias e frações.'},
  {id:'arts',name:'Google Arts & Culture',provider:'Google Arts & Culture',icon:'🏛️',tone:'orange',type:'Museus e patrimônios',categories:['História','Arte','Geografia'],description:'Visite museus e lugares históricos em panoramas e coleções digitais.',url:'https://artsandculture.google.com/project/streetviews?hl=pt-BR',lesson:'Visite um museu virtual, escolha um objeto histórico e investigue sua origem e função social.'},
  {id:'sketchfab',name:'Sketchfab — Modelos 3D',provider:'Sketchfab',icon:'🧊',tone:'violet',type:'Visualização de modelos',categories:['Tecnologia','Portos','Arte','História'],description:'Explore modelos 3D publicados por criadores; alguns têm licenças e condições específicas.',url:'https://sketchfab.com/3d-viewer',lesson:'Investigue um modelo de navio ou equipamento portuário, identificando suas partes e aplicações.'},
  {id:'geogeometry',name:'GeoGebra Geometria',provider:'GeoGebra',icon:'📐',tone:'green',type:'Geometria 2D',categories:['Matemática','Arte'],description:'Construa polígonos, ângulos, transformações, simetrias e figuras planas.',url:'https://www.geogebra.org/geometry',lesson:'Desenhe triângulos e quadriláteros, meça ângulos e descubra quais características permanecem.'},
  {id:'earthmaps',name:'Google Earth — Projetos',provider:'Google',icon:'📍',tone:'blue',type:'Mapas e narrativas',categories:['Geografia','História','Portos'],description:'Crie pontos, trajetos e histórias geográficas com mapas e imagens.',url:'https://earth.google.com/web/',lesson:'Marque o trajeto de uma carga entre porto, rodovia e centro de distribuição.'},
  {id:'nasamissions',name:'NASA — Jogos e interativos',provider:'NASA',icon:'🚀',tone:'violet',type:'Ciências / interativos',categories:['Ciências','Tecnologia'],description:'Portal oficial com experiências interativas sobre espaço e pesquisas.',url:'https://www.nasa.gov/interactives/',lesson:'Escolha uma missão espacial, identifique seu objetivo científico e apresente uma descoberta.'},
  {id:'arthistory',name:'Arts & Culture — Explorar',provider:'Google Arts & Culture',icon:'🎨',tone:'orange',type:'Acervo digital',categories:['História','Arte','Interdisciplinar'],description:'Explore obras, artistas, períodos e temas históricos em alta resolução.',url:'https://artsandculture.google.com/explore?hl=pt-BR',lesson:'Compare duas obras de períodos distintos e identifique diferenças de cor, técnica e contexto.'},
  {id:'phhtml',name:'PhET — HTML5',provider:'Universidade do Colorado Boulder',icon:'🧪',tone:'green',type:'Simulações para navegador',categories:['Ciências','Matemática','Tecnologia'],description:'Lista de simulações com filtro HTML5, úteis para testar no navegador da TV.',url:'https://phet.colorado.edu/pt_BR/simulations/filter?locale=pt_BR&type=html',lesson:'Em duplas, altere apenas uma variável e registre o que aconteceu com o experimento.'}
];
const VIDEOS = [
  {id:'porto360',name:'Terminais e portos em 360°',provider:'Pesquisa no YouTube',icon:'⚓',tone:'blue',type:'Busca de vídeo 360°',categories:['Portos','Tecnologia'],description:'Pesquise passeios imersivos por navios, cais, guindastes e terminais de contêineres.',url:youtubeSearch('container port 360 VR terminal tour'),lesson:'Peça que os estudantes identifiquem as operações e os equipamentos vistos em um terminal.'},
  {id:'navio360',name:'Passeio por um navio 360°',provider:'Pesquisa no YouTube',icon:'🚢',tone:'green',type:'Busca de vídeo 360°',categories:['Portos','Geografia'],description:'Busque vídeos com visão 360° de conveses, embarcações e operações marítimas.',url:youtubeSearch('cargo ship 360 VR deck tour'),lesson:'Compare as partes da embarcação e identifique os pontos de atenção de segurança.'},
  {id:'oceano360',name:'Fundo do mar em 360°',provider:'Pesquisa no YouTube',icon:'🐠',tone:'blue',type:'Busca de vídeo 360°',categories:['Ciências','Geografia'],description:'Explore o ambiente submarino e observe ecossistemas marinhos.',url:youtubeSearch('underwater ocean 360 VR coral reef'),lesson:'Peça que a turma identifique espécies, habitat e possíveis ameaças ao ambiente marinho.'},
  {id:'historia360',name:'Passeios históricos 360°',provider:'Pesquisa no YouTube',icon:'🏛️',tone:'orange',type:'Busca de vídeo 360°',categories:['História','Arte'],description:'Busque reconstruções e visitas históricas em panorama imersivo.',url:youtubeSearch('ancient rome 360 VR tour'),lesson:'Compare espaços históricos com as cidades atuais e discuta funções sociais.'},
  {id:'espaco360',name:'Espaço e planetas em 360°',provider:'Pesquisa no YouTube',icon:'🪐',tone:'violet',type:'Busca de vídeo 360°',categories:['Ciências','Geografia'],description:'Pesquise experiências imersivas sobre astronautas, espaço e sistema solar.',url:youtubeSearch('space solar system 360 VR video'),lesson:'Apresente as diferenças entre planetas rochosos e gasosos, pedindo evidências visuais.'},
  {id:'museus360',name:'Museus e galerias 360°',provider:'Pesquisa no YouTube',icon:'🖼️',tone:'orange',type:'Busca de vídeo 360°',categories:['História','Arte'],description:'Descubra visitas virtuais a museus e ambientes culturais.',url:youtubeSearch('museum tour 360 VR'),lesson:'Escolha uma obra, peça aos alunos que a descrevam e contextualizem seu período histórico.'},
  {id:'natureza360',name:'Florestas e natureza 360°',provider:'Pesquisa no YouTube',icon:'🌳',tone:'green',type:'Busca de vídeo 360°',categories:['Ciências','Geografia'],description:'Observe florestas, montanhas e biomas em diferentes regiões.',url:youtubeSearch('rainforest nature 360 VR video'),lesson:'Discuta clima, fauna e biodiversidade a partir das características do ambiente.'},
  {id:'industrias360',name:'Indústrias em 360°',provider:'Pesquisa no YouTube',icon:'🏭',tone:'violet',type:'Busca de vídeo 360°',categories:['Tecnologia','Portos'],description:'Busque visitas por fábricas, armazéns e linhas de produção.',url:youtubeSearch('factory warehouse 360 VR tour'),lesson:'Mapeie entradas, processos, saídas, logística e pontos de melhoria operacional.'}
];
const resourcesById = Object.fromEntries([...RESOURCES, ...VIDEOS].map(x => [x.id,x]));
const pageTitles = {inicio:'Início',biblioteca:'Biblioteca de ferramentas',videos:'Vídeos 360°',laboratorio:'Laboratório interativo',favoritos:'Meus favoritos',guia:'Guia do professor',diagnostico:'Diagnóstico da TV',atividade:'Atividade',cosmos:'Universo 3D',memoria:'Memória',fisica:'Física 2D',mais:'Mais opções',piano:'Piano multitoque'};
const FAVORITE_KEY = 'tvtouch:favorite-resource-ids:v1';
let favorites = new Set();
try {const saved = JSON.parse(localStorage.getItem(FAVORITE_KEY) || '[]'); if (Array.isArray(saved)) favorites = new Set(saved.filter(id => resourcesById[id]));} catch { /* Navegadores com armazenamento restrito */ }
let currentPage = 'inicio', activeCategory = 'Todos', activeVideoTopic = 'Todos', activeTool = null, lastPage = 'laboratorio';

function studioResourceIcon(resource) {
  const symbols={
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18M12 3c-5 5-5 13 0 18"/>',
    cube:'<path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10"/>',
    flask:'<path d="M9 2h6M10 2v7l-6 10a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L14 9V2M7 17h10"/>',
    image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m4 18 6-5 3 3 3-4 5 6"/>',
    movie:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 6 3-6 3z"/>',
    boxes:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'
  };
  const id=resource.id;
  const type=['earth','earthmaps'].includes(id)?'globe':['geogebra','sketchfab','nasa'].includes(id)?'cube':['phet','phhtml'].includes(id)?'flask':['arts','arthistory','museus360','historia360'].includes(id)?'image':['polypad','geogeometry'].includes(id)?'boxes':'movie';
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${symbols[type]}</svg>`;
}

const VIDEO_TOPICS=Object.freeze({porto360:'Portos',navio360:'Portos',oceano360:'Natureza',historia360:'Cultura',espaco360:'Ciência',museus360:'Cultura',natureza360:'Natureza',industrias360:'Tecnologia'});
const VIDEO_SCENES=Object.freeze({porto360:'port',navio360:'ship',oceano360:'sea',historia360:'history',espaco360:'space',museus360:'museum',natureza360:'forest',industrias360:'industry'});
const VIDEO_SHORT=Object.freeze({
  porto360:'Navios, guindastes e operações no cais',
  navio360:'Convés, embarcações e rotas marítimas',
  oceano360:'Vida subaquática, corais e ecossistemas',
  historia360:'Sítios históricos e reconstruções',
  espaco360:'Planetas, astronautas e estações espaciais',
  museus360:'Obras de arte e espaços culturais',
  natureza360:'Florestas, montanhas e biodiversidade',
  industrias360:'Fábricas, processos e logística'
});
const TOPIC_CLASSES=Object.freeze({Portos:'portos',Natureza:'natureza',Cultura:'cultura','Ciência':'ciencia',Tecnologia:'tecnologia'});
function videoCard(r){
  const fav=favorites.has(r.id),topic=VIDEO_TOPICS[r.id],scene=VIDEO_SCENES[r.id];
  return [
    '<article class="discovery-card discovery-topic-',TOPIC_CLASSES[topic],'">',
    '<div class="discovery-poster"><svg viewBox="0 0 600 340" role="img" aria-label="Ilustração do tema ',html(r.name),'; não é miniatura de um vídeo"><use href="assets/immersive-scenes.svg#',scene,'"/></svg>',
    '<span class="discovery-topic-label">',html(topic),'</span>',
    '<button type="button" class="star-button discovery-favorite" data-favorite="',html(r.id),'" aria-pressed="',fav,'" aria-label="',fav?'Remover dos':'Adicionar aos',' favoritos: ',html(r.name),'">',fav?'★':'☆','</button></div>',
    '<div class="discovery-card-content"><div class="discovery-card-kicker">BUSCA ORIENTADA <span aria-hidden="true">/</span> YOUTUBE</div>',
    '<h3>',html(r.name),'</h3><p>',html(VIDEO_SHORT[r.id]||r.description),'</p>',
    '<div class="discovery-card-actions"><button type="button" data-open-resource="',html(r.id),'" class="discovery-lesson">Roteiro da aula</button>',
    '<a data-visit-resource="',html(r.id),'" href="',html(r.url),'" target="_blank" rel="noopener noreferrer" class="discovery-search">Pesquisar <span aria-hidden="true">↗</span></a>',
    '</div></div></article>'
  ].join('');
}
function renderVideos(){
  const visible=activeVideoTopic==='Todos'?VIDEOS:VIDEOS.filter(r=>VIDEO_TOPICS[r.id]===activeVideoTopic);
  $('#videoCards').innerHTML=visible.map(videoCard).join('');
  $('#videoCount').textContent=visible.length+' '+(visible.length===1?'tema disponível':'temas disponíveis')+' · Pesquisas externas, não vídeos homologados';
  $$('[data-video-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.videoFilter===activeVideoTopic)));
}
function card(resource) {
  if(VIDEO_TOPICS[resource.id])return videoCard(resource);
  const fav = favorites.has(resource.id);
  return `<article class="resource-card"><div class="card-top"><div class="resource-icon ${html(resource.tone)}" aria-hidden="true">${studioResourceIcon(resource)}</div><button class="star-button" type="button" data-favorite="${html(resource.id)}" aria-pressed="${fav}" aria-label="${fav?'Remover dos':'Adicionar aos'} favoritos: ${html(resource.name)}">${fav?'★':'☆'}</button></div><div class="resource-body"><span class="resource-origin">${html(resource.provider)}</span><h3>${html(resource.name)}</h3><p>${html(resource.description)}</p><div class="chips">${resource.categories.slice(0,3).map(cat=>`<span class="chip">${html(cat)}</span>`).join('')}</div></div><div class="card-bottom"><span class="card-type">${html(resource.type)}</span><button class="card-open" type="button" data-open-resource="${html(resource.id)}">Conhecer →</button></div></article>`;
}
function renderLibrary() {
  const query = ($('#resourceSearch').value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const list = RESOURCES.filter(r => (activeCategory === 'Todos' || r.categories.includes(activeCategory)) && [r.name,r.provider,r.description,...r.categories].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query));
  $('#libraryCards').innerHTML = list.length ? list.map(card).join('') : `<div class="empty-state"><div>⌕</div><h3>Nenhuma ferramenta encontrada</h3><p>Tente buscar outra palavra ou escolha outra disciplina.</p></div>`;
  $('#libraryCount').textContent = `${list.length} ${list.length===1?'recurso encontrado':'recursos encontrados'}`;
}
function renderFavorites() {
  const list = [...RESOURCES,...VIDEOS].filter(r => favorites.has(r.id));
  $('#favoritesCards').innerHTML = list.map(card).join('');
  $('#favoritesEmpty').hidden = list.length > 0;
}
function toggleFavorite(id) {
  if (!resourcesById[id]) return;
  favorites.has(id) ? favorites.delete(id) : favorites.add(id);
  try {localStorage.setItem(FAVORITE_KEY, JSON.stringify([...favorites]));} catch { /* funcional nesta sessão */ }
  renderLibrary(); renderFavorites(); $('#featuredCards').innerHTML = RESOURCES.slice(0,3).map(card).join(''); renderVideos();
}
function openResource(id) {
  const r = resourcesById[id]; if (!r) return;
  const isSearch = VIDEOS.some(v=>v.id===id);
  $('#dialogContent').innerHTML = `<div class="dialog-header"><span class="resource-icon ${html(r.tone)}" aria-hidden="true">${studioResourceIcon(r)}</span><div><p>${html(r.provider)} • ${html(r.type)}</p><h2 id="dialogTitle">${html(r.name)}</h2></div></div><p class="dialog-description">${html(r.description)}</p><div class="dialog-lesson"><strong>💡 Proposta para a aula</strong><p>${html(r.lesson)}</p></div><div class="dialog-actions"><a class="button primary" data-visit-resource="${html(r.id)}" href="${html(r.url)}" target="_blank" rel="noopener noreferrer">${isSearch?'Abrir pesquisa no YouTube ↗':'Abrir ferramenta ↗'}</a><button class="button ghost" type="button" data-favorite="${html(r.id)}">${favorites.has(r.id)?'★ Remover favorito':'☆ Salvar favorito'}</button></div><p class="dialog-note">${isSearch?'Pesquisas podem exibir vídeos que não são 360°. Verifique antes de usar.':'Você acessará o site original. Algumas funções podem exigir internet, conta ou navegador compatível.'}</p>`;
  const dialog = $('#resourceDialog');
  if (!dialog.open) dialog.showModal();
}
function closeMenu() { $('.sidebar').classList.remove('open'); $('#mobileOverlay').hidden=true; $('#menuButton').setAttribute('aria-expanded','false'); }
function go(page, {hash=true}={}) {
  if (!pageTitles[page]) page='inicio';
  const controlled=['videos','laboratorio','diagnostico','cosmos','memoria','fisica','piano'];
  if(controlled.includes(page) && (window.TVTouchGovernance?.available(page==='piano'?'module_laboratorio':'module_'+page)===false || (page==='piano'&&window.TVTouchGovernance?.available('module_piano')===false))){
    const notice=document.getElementById('governanceNotice');
    if(notice){notice.textContent='Atividade desativada pela administração.';notice.hidden=false;setTimeout(()=>{notice.hidden=true;},5000);}
    page='inicio';
  }
  if (currentPage !== 'atividade' && page === 'atividade') lastPage=currentPage;
  currentPage=page;
  document.body.classList.toggle('studio-home-active',page==='inicio');
  if(['cosmos','memoria','fisica','piano'].includes(page))window.dispatchEvent(new CustomEvent('tvt:tool-open',{detail:{id:page}}));
  $$('.page').forEach(e=>e.classList.toggle('active',e.id === `page-${page}`));
  $$('.nav-item').forEach(e=>{ const active = e.dataset.page === page || (page==='atividade'&&e.dataset.page==='laboratorio') || (e.dataset.page==='mais'&&['favoritos','guia','diagnostico'].includes(page)); e.classList.toggle('active',active); active?e.setAttribute('aria-current','page'):e.removeAttribute('aria-current'); });
  $('#breadcrumb').textContent=pageTitles[page];
  closeMenu();
  if (hash) history.replaceState(null,'',`#${page}`);
  window.scrollTo({top:0,behavior:'instant'});
  if (page==='favoritos') renderFavorites();
  if (page==='atividade' && activeTool==='solidos') requestAnimationFrame(drawSolid);
  if (page==='atividade' && activeTool==='desenho') requestAnimationFrame(resizeDrawingCanvas);
  window.dispatchEvent(new CustomEvent('tvt:page-change',{detail:{page,tool:page==='atividade'?activeTool:null}}));
}
function launchTool(tool) {
  if (!['desenho','solidos','encaixe','porto'].includes(tool)) return;
  activeTool=tool;
  window.dispatchEvent(new CustomEvent('tvt:tool-open', {detail:{id:tool}}));
  $$('.activity-pane').forEach(p=>p.hidden=p.id!==`tool-${tool}`);
  $('#activityTitle').textContent={desenho:'Quadro de desenho',solidos:'Sólidos geométricos 3D',encaixe:'Desafio de encaixe',porto:'Decisões no porto'}[tool];
  go('atividade');
  if (tool==='desenho') requestAnimationFrame(resizeDrawingCanvas);
  if (tool==='solidos'){solidState.lastFrame=0;requestAnimationFrame(drawSolid);}
  if (tool==='encaixe' && !puzzleStarted) resetPuzzle();
  if (tool==='porto' && !quizStarted) resetQuiz();
}

function startShell() {
  $('#todayDate').textContent=new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(new Date());
  const connection=()=>{ const online=navigator.onLine;$('#connectionText').textContent=online?'Rede ativa':'Sem rede';$('#connectionDot').classList.toggle('offline',!online);};
  connection();window.addEventListener('online',connection);window.addEventListener('offline',connection);
  $('#featuredCards').innerHTML=RESOURCES.slice(0,3).map(card).join('');
  renderVideos();
  $('#libraryFilters').innerHTML=CATEGORIES.map(c=>`<button type="button" class="filter-button ${c==='Todos'?'active':''}" data-category="${html(c)}" aria-pressed="${c==='Todos'}">${html(c)}</button>`).join('');
  renderLibrary();renderFavorites();
  document.addEventListener('click',e=>{
    const outbound=e.target.closest('[data-visit-resource]');
    if(outbound) window.dispatchEvent(new CustomEvent('tvt:resource-open', {detail:{id:outbound.dataset.visitResource}}));
    const videoScroll=e.target.closest('[data-video-scroll]');if(videoScroll){document.getElementById(videoScroll.dataset.videoScroll)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});return;}
    const colorPause=e.target.closest('[data-more-color-pause]');if(colorPause){document.querySelector('[data-color-pause]')?.click();return;}
    const videoFilter=e.target.closest('[data-video-filter]');if(videoFilter){activeVideoTopic=videoFilter.dataset.videoFilter;renderVideos();return;}
    const full=e.target.closest('[data-more-fullscreen]');if(full){$('#fullscreenButton').click();return;}
    const goBtn=e.target.closest('[data-go]');if(goBtn){go(goBtn.dataset.go);return;}
    const nav=e.target.closest('[data-page]');if(nav){go(nav.dataset.page);return;}
    const tool=e.target.closest('[data-tool]');if(tool){launchTool(tool.dataset.tool);return;}
    const open=e.target.closest('[data-open-resource]');if(open){openResource(open.dataset.openResource);return;}
    const fav=e.target.closest('[data-favorite]');if(fav){const id=fav.dataset.favorite;toggleFavorite(id);if($('#resourceDialog').open)openResource(id);return;}
    const filter=e.target.closest('[data-category]');if(filter){activeCategory=filter.dataset.category;$$('[data-category]').forEach(btn=>{const active=btn===filter;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',active);});renderLibrary();}
  });
  $('#moreTutorial')?.addEventListener('click',()=>document.getElementById('tvtTourOpenTop')?.click());
  $('#resourceSearch').addEventListener('input',renderLibrary);
  $('#backToLab').addEventListener('click',()=>go(lastPage));
  $('#menuButton').addEventListener('click',()=>{const open=$('.sidebar').classList.toggle('open');$('#mobileOverlay').hidden=!open;$('#menuButton').setAttribute('aria-expanded',String(open));});
  $('#mobileOverlay').addEventListener('click',closeMenu);
  $('#fullscreenButton').addEventListener('click',async()=>{
    try {if(document.fullscreenElement) await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else alert('Este navegador não oferece tela cheia pelo site. Use o modo de tela cheia do navegador ou da TV.');}
    catch{alert('A TV ou navegador bloqueou o modo de tela cheia. Tente pelas opções do navegador.');}
  });
  window.addEventListener('hashchange',()=>{const target=location.hash.slice(1);if(target !== 'atividade'&&pageTitles[target])go(target,{hash:false});});
  // Não reabre atividades via hash sem inicializar o módulo correto.
  const initial=location.hash.slice(1);go(pageTitles[initial]&&initial!=='atividade'?initial:'inicio',{hash:!location.hash});
  if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
}

/* DESENHO: pixels armazenados em snapshots, com redimensionamento sem perda. */
const drawState={color:'#15253a',size:6,eraser:false,active:false,history:[],index:-1,point:null};
const drawingCanvas=$('#drawingCanvas'),dctx=drawingCanvas.getContext('2d',{willReadFrequently:false});
function drawingSnapshot(){
  const data=drawingCanvas.toDataURL('image/png');
  drawState.history=drawState.history.slice(0,drawState.index+1);
  drawState.history.push(data);
  if(drawState.history.length>16)drawState.history.shift();
  drawState.index=drawState.history.length-1;updateHistoryButtons();
}
function restoreDrawing(data){if(!data)return;const image=new Image();image.onload=()=>{dctx.clearRect(0,0,drawingCanvas.width,drawingCanvas.height);dctx.drawImage(image,0,0,drawingCanvas.width,drawingCanvas.height);};image.src=data;}
function updateHistoryButtons(){$('#undoButton').disabled=drawState.index<=0;$('#redoButton').disabled=drawState.index>=drawState.history.length-1;}
function resizeDrawingCanvas(){
  if($('#tool-desenho').hidden) return;
  const rect=drawingCanvas.getBoundingClientRect();const w=Math.max(1,Math.round(rect.width*devicePixelRatio)),h=Math.max(1,Math.round(rect.height*devicePixelRatio));
  if(drawingCanvas.width===w && drawingCanvas.height===h)return;
  const old=document.createElement('canvas');old.width=drawingCanvas.width;old.height=drawingCanvas.height;if(old.width&&old.height)old.getContext('2d').drawImage(drawingCanvas,0,0);
  drawingCanvas.width=w;drawingCanvas.height=h;dctx.fillStyle='#ffffff';dctx.fillRect(0,0,w,h);
  if(old.width&&old.height){dctx.drawImage(old,0,0,w,h);/* novo tamanho não invalida histórico anterior */}
  if(drawState.history.length===0)drawingSnapshot();
}
function drawPoint(evt){const rect=drawingCanvas.getBoundingClientRect();return{x:(evt.clientX-rect.left)*drawingCanvas.width/rect.width,y:(evt.clientY-rect.top)*drawingCanvas.height/rect.height};}
function stroke(from,to){dctx.lineCap='round';dctx.lineJoin='round';dctx.strokeStyle=drawState.eraser?'#ffffff':drawState.color;dctx.lineWidth=drawState.size*(window.TVTouchCalibration?.brush() ?? 1)*drawingCanvas.width/Math.max(1,drawingCanvas.clientWidth)*(drawState.eraser?3:1);dctx.beginPath();dctx.moveTo(from.x,from.y);dctx.lineTo(to.x,to.y);dctx.stroke();}
function startDrawing(e){if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();drawingCanvas.setPointerCapture(e.pointerId);drawState.active=true;drawState.point=drawPoint(e);stroke(drawState.point,drawState.point);}
function moveDrawing(e){if(!drawState.active)return;e.preventDefault();const point=drawPoint(e);stroke(drawState.point,point);drawState.point=point;}
function endDrawing(){if(!drawState.active)return;drawState.active=false;drawState.point=null;drawingSnapshot();}
function initDrawing(){
  const colors=['#15253a','#f5495e','#f49a38','#f4ca42','#36a366','#288ddb','#8863e8','#ed76b9'];
  $('#paintColors').innerHTML=colors.map((color,i)=>`<button class="paint-color" type="button" style="--paint:${color}" data-paint="${color}" aria-label="Cor ${i+1}" aria-pressed="${i===0}"></button>`).join('');
  $$('.paint-color').forEach(btn=>btn.addEventListener('click',()=>{drawState.color=btn.dataset.paint;drawState.eraser=false;$$('.paint-color').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));updatePaintTools();}));
  const updatePaintTools=()=>{$('#brushTool').classList.toggle('active',!drawState.eraser);$('#eraserTool').classList.toggle('active',drawState.eraser);};
  $('#brushTool').onclick=()=>{drawState.eraser=false;updatePaintTools();};$('#eraserTool').onclick=()=>{drawState.eraser=true;updatePaintTools();};
  $('#brushSize').oninput=e=>{drawState.size=Number(e.target.value);$('#brushSizeOut').textContent=drawState.size;};
  drawingCanvas.addEventListener('pointerdown',startDrawing);drawingCanvas.addEventListener('pointermove',moveDrawing);drawingCanvas.addEventListener('pointerup',endDrawing);drawingCanvas.addEventListener('pointercancel',endDrawing);drawingCanvas.addEventListener('lostpointercapture',endDrawing);
  $('#undoButton').onclick=()=>{if(drawState.index>0)restoreDrawing(drawState.history[--drawState.index]);updateHistoryButtons();};
  $('#redoButton').onclick=()=>{if(drawState.index<drawState.history.length-1)restoreDrawing(drawState.history[++drawState.index]);updateHistoryButtons();};
  $('#clearCanvas').onclick=()=>{if(!confirm('Limpar todo o desenho? Você poderá desfazer.'))return;dctx.fillStyle='#fff';dctx.fillRect(0,0,drawingCanvas.width,drawingCanvas.height);drawingSnapshot();};
  $('#saveDrawing').onclick=()=>{const a=document.createElement('a');a.download=`TV-TOUCH-desenho-${new Date().toISOString().slice(0,10)}.png`;a.href=drawingCanvas.toDataURL('image/png');a.click();};
  if('ResizeObserver' in window)new ResizeObserver(()=>requestAnimationFrame(resizeDrawingCanvas)).observe($('.canvas-outer'));
}

/* SOLIDOS 3D: projeção perspectiva implementada com Canvas 2D, sem WebGL ou CDN. */
const solidCanvas=$('#solidCanvas'),sctx=solidCanvas.getContext('2d');
const solidState={shape:'cubo',rotX:-.30,rotY:.54,zoom:1,auto:false,pointers:new Map(),lastFrame:0,material:'ceramic',quality:'balanced',raf:0};
const FORMATIONS={
  cubo:{name:'Cubo',facts:['6 faces','12 arestas','8 vértices'],text:'Todas as faces são quadrados congruentes.',question:'Quais faces você não consegue ver desta posição?'},
  prisma:{name:'Prisma retangular',facts:['6 faces','12 arestas','8 vértices'],text:'As faces são retângulos; um cubo é um caso particular.',question:'Quais dimensões podem ser diferentes em um prisma retangular?'},
  piramide:{name:'Pirâmide quadrangular',facts:['5 faces','8 arestas','5 vértices'],text:'Uma base quadrada e quatro faces triangulares.',question:'Por que a pirâmide tem menos vértices que o cubo?'},
  cilindro:{name:'Cilindro',facts:['2 bases circulares','1 superfície lateral curva','Não é poliedro'],text:'O cilindro não possui faces poligonais como um cubo.',question:'Por que um cilindro pode rolar e um cubo não?'},
  esfera:{name:'Esfera',facts:['1 superfície curva','0 arestas','0 vértices'],text:'Uma esfera não tem faces planas, arestas ou vértices.',question:'Por que a esfera rola em qualquer direção?'}
};
function solidGeometry(shape){
  if(shape==='cubo'||shape==='prisma'){
    const [x,y,z]=shape==='cubo'?[1,1,1]:[1.45,.76,.9];
    return {vertices:[[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]],faces:[[0,1,2,3],[4,5,6,7],[0,4,7,3],[1,5,6,2],[3,2,6,7],[0,1,5,4]]};
  }
  if(shape==='piramide')return {vertices:[[-1.1,-1,-1.1],[1.1,-1,-1.1],[1.1,-1,1.1],[-1.1,-1,1.1],[0,1.25,0]],faces:[[0,1,2,3],[0,1,4],[1,2,4],[2,3,4],[3,0,4]]};
  if(shape==='esfera'){
    const segments=14,rings=9,vertices=[[0,1.1,0]],faces=[];
    for(let row=1;row<rings;row++)for(let col=0;col<segments;col++){
      const theta=row*Math.PI/rings,phi=col*Math.PI*2/segments;
      vertices.push([1.1*Math.sin(theta)*Math.cos(phi),1.1*Math.cos(theta),1.1*Math.sin(theta)*Math.sin(phi)]);
    }
    const bottom=vertices.length;vertices.push([0,-1.1,0]);
    for(let i=0;i<segments;i++)faces.push([0,1+i,1+(i+1)%segments]);
    for(let row=0;row<rings-2;row++){
      const a=1+row*segments,b=1+(row+1)*segments;
      for(let i=0;i<segments;i++)faces.push([a+i,b+i,b+(i+1)%segments,a+(i+1)%segments]);
    }
    const last=1+(rings-2)*segments;
    for(let i=0;i<segments;i++)faces.push([last+i,bottom,last+(i+1)%segments]);
    return {vertices,faces};
  }
  const n=24,vertices=[],faces=[];for(let i=0;i<n;i++){const a=Math.PI*2*i/n;vertices.push([Math.cos(a),-1,Math.sin(a)]);}for(let i=0;i<n;i++){const a=Math.PI*2*i/n;vertices.push([Math.cos(a),1,Math.sin(a)]);}faces.push(Array.from({length:n},(_,i)=>i));faces.push(Array.from({length:n},(_,i)=>n+i));for(let i=0;i<n;i++)faces.push([i,(i+1)%n,n+(i+1)%n,n+i]);return{vertices,faces};
}
function projectPoint(v,cx,cy,scale){const [x,y,z]=v;const y1=y*Math.cos(solidState.rotX)-z*Math.sin(solidState.rotX),z1=y*Math.sin(solidState.rotX)+z*Math.cos(solidState.rotX);const x2=x*Math.cos(solidState.rotY)+z1*Math.sin(solidState.rotY),z2=-x*Math.sin(solidState.rotY)+z1*Math.cos(solidState.rotY);const k=4.9/(4.9-z2);return{x:cx+x2*scale*k,y:cy+y1*scale*k,z:z2};}
function renderSolid(){
  if($('#tool-solidos').hidden)return;
  if(window.TVTouchGeometry){window.TVTouchGeometry.render(sctx,solidCanvas,{shape:solidState.shape,rotX:solidState.rotX,rotY:solidState.rotY,zoom:solidState.zoom,material:solidState.material,quality:solidState.quality});return;}
  const rect=solidCanvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);if(w<2||h<2)return;
  if(solidCanvas.width!==w||solidCanvas.height!==h){solidCanvas.width=w;solidCanvas.height=h;}
  sctx.clearRect(0,0,w,h);const cx=w/2,cy=h/2,scale=Math.min(w,h)*.29*solidState.zoom;
  // Fundo com linhas discretas de referência
  sctx.strokeStyle='#3d6b8259';sctx.lineWidth=1*dpr;const grid=Math.min(w,h)/10;
  for(let i=-4;i<=4;i++){sctx.beginPath();sctx.moveTo(cx+i*grid,cy+h*.38);sctx.lineTo(cx+i*grid*.35,cy+h*.19);sctx.stroke();}
  const shape=solidGeometry(solidState.shape),points=shape.vertices.map(v=>projectPoint(v,cx,cy,scale));
  const faces=shape.faces.map((indices,i)=>({indices,z:indices.reduce((sum,ind)=>sum+points[ind].z,0)/indices.length,i})).sort((a,b)=>a.z-b.z);
  for(const face of faces){const p=face.indices.map(i=>points[i]);sctx.beginPath();p.forEach((v,i)=>i?sctx.lineTo(v.x,v.y):sctx.moveTo(v.x,v.y));sctx.closePath();const light=Math.round(48+Math.max(0,face.z+2)*9);sctx.fillStyle=`hsla(${185+face.i%3*17},78%,${Math.min(light,78)}%,.84)`;sctx.fill();sctx.lineWidth=2*dpr;sctx.strokeStyle='#c2f8ffb8';sctx.stroke();}
  // Vértices visíveis com ponto iluminado
  if(solidState.shape!=='cilindro')for(const p of points){sctx.beginPath();sctx.arc(p.x,p.y,3.7*dpr,0,Math.PI*2);sctx.fillStyle='#e6feff';sctx.fill();}
}
function drawSolid(time=0){
  solidState.raf=0;
  if(currentPage!=='atividade'||activeTool!=='solidos'||document.hidden)return;
  if(solidState.auto&&solidState.lastFrame){
    const delta=Math.max(0,Math.min(40,time-solidState.lastFrame));
    solidState.rotY+=delta*.00065;
  }
  solidState.lastFrame=time;renderSolid();
  if(solidState.auto)solidState.raf=requestAnimationFrame(drawSolid);
}
function updateSolidInfo(){const s=FORMATIONS[solidState.shape];$('#modelFacts').innerHTML=`<div class="stats">${s.facts.map(f=>`<span class="stat">${html(f)}</span>`).join('')}</div><strong>${s.name}:</strong> ${s.text}`;$('#modelQuestion').textContent=s.question;$$('[data-shape]').forEach(b=>{const active=b.dataset.shape===solidState.shape;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});}
function initSolids(){
  updateSolidInfo();
  $$('[data-shape]').forEach(button=>button.addEventListener('click',()=>{
    solidState.shape=button.dataset.shape;updateSolidInfo();renderSolid();
  }));
  $$('[data-material]').forEach(button=>button.addEventListener('click',()=>{
    solidState.material=button.dataset.material;
    $$('[data-material]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    $('#modelMaterialName').textContent=window.TVTouchGeometry?.MATERIALS[solidState.material]?.label||'Cerâmica';
    renderSolid();
  }));
  $$('[data-graphics-quality]').forEach(button=>button.addEventListener('click',()=>{
    solidState.quality=button.dataset.graphicsQuality;
    $$('[data-graphics-quality]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    renderSolid();
  }));
  $('#modelZoom').addEventListener('input',e=>{
    solidState.zoom=Number(e.target.value)/100;
    $('#zoomOut').textContent=e.target.value+'%';
    renderSolid();
  });
  const stopAuto=()=>{
    solidState.auto=false;solidState.lastFrame=0;
    cancelAnimationFrame(solidState.raf);solidState.raf=0;
    $('#rotateModel').textContent='Girar automaticamente';
  };
  $('#rotateModel').onclick=()=>{
    if(solidState.auto){stopAuto();return;}
    solidState.auto=true;solidState.lastFrame=0;
    $('#rotateModel').textContent='Parar rotação';
    if(!document.hidden)solidState.raf=requestAnimationFrame(drawSolid);
  };
  $('#resetModel').onclick=()=>{
    stopAuto();solidState.rotX=-.3;solidState.rotY=.54;solidState.zoom=1;
    $('#modelZoom').value=100;$('#zoomOut').textContent='100%';
    renderSolid();
  };
  solidCanvas.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    e.preventDefault();try{solidCanvas.setPointerCapture(e.pointerId);}catch{}
    solidState.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  });
  solidCanvas.addEventListener('pointermove',e=>{
    if(!solidState.pointers.has(e.pointerId))return;
    e.preventDefault();const prev=solidState.pointers.get(e.pointerId),dx=e.clientX-prev.x,dy=e.clientY-prev.y;
    if(solidState.pointers.size===1){
      const factor=window.TVTouchCalibration?.rotation()??1;
      solidState.rotY+=dx*.008*factor;
      solidState.rotX=Math.min(1.52,Math.max(-1.52,solidState.rotX+dy*.008*factor));
    } else if(solidState.pointers.size===2){
      const other=[...solidState.pointers.entries()].find(([id])=>id!==e.pointerId)?.[1];
      if(other){const before=Math.hypot(prev.x-other.x,prev.y-other.y);
        const after=Math.hypot(e.clientX-other.x,e.clientY-other.y);
        if(before>8)solidState.zoom=Math.min(1.8,Math.max(.65,solidState.zoom*after/before));
        $('#modelZoom').value=Math.round(solidState.zoom*100);
        $('#zoomOut').textContent=Math.round(solidState.zoom*100)+'%';
      }
    }
    solidState.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});renderSolid();
  });
  const release=e=>solidState.pointers.delete(e.pointerId);
  for(const type of ['pointerup','pointercancel','lostpointercapture'])solidCanvas.addEventListener(type,release);
  solidCanvas.addEventListener('wheel',e=>{
    e.preventDefault();solidState.zoom=Math.min(1.8,Math.max(.65,solidState.zoom*(e.deltaY<0?1.06:.94)));
    $('#modelZoom').value=Math.round(solidState.zoom*100);
    $('#zoomOut').textContent=Math.round(solidState.zoom*100)+'%';renderSolid();
  },{passive:false});
  solidCanvas.addEventListener('keydown',e=>{
    const step=.13* (window.TVTouchCalibration?.rotation()??1);
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key)){
      e.preventDefault();
      if(e.key==='ArrowLeft')solidState.rotY-=step;
      if(e.key==='ArrowRight')solidState.rotY+=step;
      if(e.key==='ArrowUp')solidState.rotX=Math.min(1.52,solidState.rotX+step);
      if(e.key==='ArrowDown')solidState.rotX=Math.max(-1.52,solidState.rotX-step);
      if(e.key==='+'||e.key==='=')solidState.zoom=Math.min(1.8,solidState.zoom*1.08);
      if(e.key==='-')solidState.zoom=Math.max(.65,solidState.zoom*.92);
      $('#modelZoom').value=Math.round(solidState.zoom*100);
      $('#zoomOut').textContent=Math.round(solidState.zoom*100)+'%';
      renderSolid();
    }
  });
  if('ResizeObserver' in window)new ResizeObserver(()=>requestAnimationFrame(renderSolid)).observe($('.model-stage'));
  window.addEventListener('tvt:page-change',event=>{
    if(event.detail?.page!=='atividade'||activeTool!=='solidos'){stopAuto();solidState.pointers.clear();}
    else renderSolid();
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(solidState.raf);solidState.raf=0;solidState.pointers.clear();}else if(solidState.auto&&currentPage==='atividade'&&activeTool==='solidos'){solidState.lastFrame=0;solidState.raf=requestAnimationFrame(drawSolid);}});
}

/* ENCAIXE: níveis progressivos e interação multi-pointer sem dependências. */
const PIECES=[
  {id:'circle',name:'Círculo',color:'#49b3c5',clip:'circle(48% at 50% 50%)'},
  {id:'square',name:'Quadrado',color:'#e4ab5a',clip:'inset(0 0 0 0 round 5px)'},
  {id:'triangle',name:'Triângulo',color:'#b58de3',clip:'polygon(50% 0,100% 100%,0 100%)'},
  {id:'diamond',name:'Losango',color:'#62b990',clip:'polygon(50% 0,100% 50%,50% 100%,0 50%)'},
  {id:'hexagon',name:'Hexágono',color:'#d69457',clip:'polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)'},
  {id:'pentagon',name:'Pentágono',color:'#64a7b7',clip:'polygon(50% 0,100% 38%,82% 100%,18% 100%,0 38%)'},
  {id:'trapezoid',name:'Trapézio',color:'#cd7e82',clip:'polygon(28% 0,72% 0,100% 100%,0 100%)'},
  {id:'octagon',name:'Octógono',color:'#8e9ec8',clip:'polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)'}
];
const PUZZLE_LEVELS=[
  {id:1,name:'Primeiros encaixes',ids:['circle','square','triangle','hexagon']},
  {id:2,name:'Mais formas',ids:['circle','square','triangle','diamond','hexagon','pentagon']},
  {id:3,name:'Sem pistas escritas',ids:PIECES.map(p=>p.id)}
];
let puzzleStarted=false,puzzleLevel=1,puzzleMatched=new Set(),puzzleSelected=null;
let puzzleMistakes=0,puzzleDone=false,puzzleSuppressClickUntil=0,puzzleHintTimer=0;
const puzzleDrags=new Map();
const puzzlePiecesForLevel=()=>PUZZLE_LEVELS[puzzleLevel-1].ids.map(id=>PIECES.find(p=>p.id===id));
function puzzleShuffle(items){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function shapeMarkup(p){return '<span class="piece-shape" style="--piece-color:'+p.color+';--clip:'+p.clip+'" aria-hidden="true"></span>';}
function cancelPuzzleDrag(id){
  const drag=puzzleDrags.get(id);if(!drag)return;
  drag.ghost?.remove();puzzleDrags.delete(id);
}
function cancelPuzzleDrags(){for(const id of [...puzzleDrags.keys()])cancelPuzzleDrag(id);}
function resetPuzzle(){
  cancelPuzzleDrags();clearTimeout(puzzleHintTimer);puzzleHintTimer=0;puzzleStarted=true;puzzleMatched=new Set();puzzleSelected=null;puzzleMistakes=0;puzzleDone=false;
  const pieces=puzzlePiecesForLevel(),hard=puzzleLevel===3;
  $('#puzzleSlots').innerHTML=puzzleShuffle(pieces).map(p=>
    '<button type="button" class="puzzle-slot" data-slot="'+p.id+'" aria-label="Encaixar '+p.name+'">'+shapeMarkup(p)+
    '<span>'+(hard?'':p.name)+'</span></button>').join('');
  $('#puzzlePieces').innerHTML=puzzleShuffle(pieces).map(p=>
    '<button type="button" class="puzzle-piece" data-piece="'+p.id+'" aria-label="Mover '+p.name+'">'+shapeMarkup(p)+
    '<span class="piece-caption">'+p.name+'</span></button>').join('');
  $('#puzzleSlots').style.setProperty('--puzzle-columns',String(Math.min(pieces.length,4)));
  $('#puzzlePieces').style.setProperty('--puzzle-columns',String(Math.min(pieces.length,4)));
  $('#puzzleLevelName').textContent=PUZZLE_LEVELS[puzzleLevel-1].name;
  $('#puzzleNext').disabled=true;
  $$('[data-puzzle-level]').forEach(b=>{const active=Number(b.dataset.puzzleLevel)===puzzleLevel;b.setAttribute('aria-pressed',String(active));b.classList.toggle('active',active);});
  updatePuzzle('Escolha uma peça e toque na sombra correspondente, ou arraste até ela.');
}
function updatePuzzle(message){
  const total=puzzlePiecesForLevel().length;
  $('#puzzleProgress').textContent=puzzleMatched.size+' / '+total;
  $('#puzzleMistakes').textContent=String(puzzleMistakes);
  $('#puzzleMessage').textContent=message;
  $$('[data-piece]').forEach(el=>el.classList.toggle('active',el.dataset.piece===puzzleSelected));
  $$('[data-slot]').forEach(el=>el.classList.toggle('selected',!!puzzleSelected&&el.dataset.slot===puzzleSelected));
}
function attemptMatch(pieceId,slotId){
  if(!pieceId||!slotId||puzzleMatched.has(slotId)||puzzleMatched.has(pieceId)||!puzzlePiecesForLevel().some(x=>x.id===pieceId))return false;
  const slot=$('[data-slot="'+slotId+'"]');
  if(pieceId!==slotId){
    puzzleMistakes++;
    updatePuzzle('Essa peça não corresponde à sombra. Compare o número de lados e tente novamente.');
    return false;
  }
  puzzleMatched.add(pieceId);$('[data-piece="'+pieceId+'"]')?.remove();
  slot?.classList.add('matched');slot?.setAttribute('aria-label',PIECES.find(x=>x.id===slotId).name+' encaixado');
  puzzleSelected=null;
  if(puzzleMatched.size===puzzlePiecesForLevel().length&&!puzzleDone){
    puzzleDone=true;$('#puzzleNext').disabled=puzzleLevel===3;
    updatePuzzle(puzzleLevel===3?'Todas as formas encaixadas. Você concluiu os três níveis.':'Nível completo. Continue para o próximo desafio.');
    window.dispatchEvent(new CustomEvent('tvt:activity-completed',{detail:{id:'encaixe',level:puzzleLevel,errors:puzzleMistakes}}));
  }else updatePuzzle('Encaixe correto. Continue com outra forma.');
  return true;
}
function initPuzzle(){
  $('#resetPuzzle').addEventListener('click',resetPuzzle);
  $$('[data-puzzle-level]').forEach(button=>button.addEventListener('click',()=>{
    puzzleLevel=Number(button.dataset.puzzleLevel)||1;resetPuzzle();
  }));
  $('#puzzleNext').addEventListener('click',()=>{if(!puzzleDone||puzzleLevel>=3)return;puzzleLevel++;resetPuzzle();});
  $('#puzzleHint').addEventListener('click',()=>{
    const p=puzzlePiecesForLevel().find(x=>!puzzleMatched.has(x.id));if(!p)return;
    puzzleSelected=p.id;updatePuzzle('Dica: '+p.name+'. Procure uma sombra com o mesmo contorno.');
    $('[data-slot="'+p.id+'"]')?.classList.add('hint');
    clearTimeout(puzzleHintTimer);puzzleHintTimer=setTimeout(()=>$('[data-slot="'+p.id+'"]')?.classList.remove('hint'),1600);
  });
  $('#puzzleSlots').addEventListener('click',e=>{
    const target=e.target.closest('[data-slot]');if(target&&puzzleSelected)attemptMatch(puzzleSelected,target.dataset.slot);
  });
  $('#puzzlePieces').addEventListener('click',e=>{
    if(Date.now()<puzzleSuppressClickUntil){e.preventDefault();return;}
    const p=e.target.closest('[data-piece]');if(!p)return;
    puzzleSelected=p.dataset.piece;
    updatePuzzle('Peça: '+PIECES.find(x=>x.id===puzzleSelected).name+'. Toque na sombra que combina.');
  });
  $('#puzzlePieces').addEventListener('pointerdown',e=>{
    const p=e.target.closest('[data-piece]');if(!p||(e.pointerType==='mouse'&&e.button!==0)||puzzleMatched.has(p.dataset.piece))return;
    puzzleDrags.set(e.pointerId,{x:e.clientX,y:e.clientY,piece:p.dataset.piece,ghost:null});
    try{p.setPointerCapture(e.pointerId);}catch{}
  });
  document.addEventListener('pointermove',e=>{
    const drag=puzzleDrags.get(e.pointerId);if(!drag)return;
    const moved=Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>(window.TVTouchCalibration?.drag()??12);
    if(!moved&&!drag.ghost)return;
    e.preventDefault();
    if(!drag.ghost){
      const p=PIECES.find(x=>x.id===drag.piece);
      const ghost=document.createElement('div');ghost.className='piece-ghost';ghost.innerHTML=shapeMarkup(p);
      document.body.appendChild(ghost);drag.ghost=ghost;
    }
    drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';
  },{passive:false});
  document.addEventListener('pointerup',e=>{
    const drag=puzzleDrags.get(e.pointerId);if(!drag)return;
    const dragged=!!drag.ghost;
    cancelPuzzleDrag(e.pointerId);
    if(!dragged)return;
    puzzleSuppressClickUntil=Date.now()+350;
    const slot=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-slot]');
    if(slot)attemptMatch(drag.piece,slot.dataset.slot);
    else{puzzleSelected=drag.piece;updatePuzzle('Escolha uma sombra para a peça selecionada.');}
  });
  document.addEventListener('pointercancel',e=>cancelPuzzleDrag(e.pointerId));
  document.addEventListener('lostpointercapture',e=>cancelPuzzleDrag(e.pointerId));
  window.addEventListener('tvt:page-change',e=>{
    if(e.detail?.page!=='atividade'||activeTool!=='encaixe'){cancelPuzzleDrags();clearTimeout(puzzleHintTimer);puzzleHintTimer=0;}
  });
}
/* QUIZ PORTUÁRIO: situações fictícias, não substituem treinamento normativo. */
const QUIZ=[
  {q:'Antes de iniciar uma atividade no cais, um trabalhador observa alguém sem o EPI exigido. Qual atitude é mais adequada?',options:['Ignorar porque a tarefa está atrasada.','Orientar a interromper a exposição ao risco e comunicar o responsável.','Permitir o trabalho e registrar apenas no fim do turno.'],correct:1,explain:'Segurança vem antes da produtividade. Os EPIs aplicáveis dependem da atividade, da análise de riscos e das normas locais.'},
  {q:'Um contêiner chegou ao terminal, mas a identificação no sistema não confere. O que fazer?',options:['Registrar a divergência e confirmar os dados antes de movimentar.','Trocar a etiqueta para acelerar o embarque.','Embarcar sem conferir, pois o destino está próximo.'],correct:0,explain:'A rastreabilidade depende da identificação correta, da conferência de documentos e do registro das divergências.'},
  {q:'O pátio está congestionado e duas equipes querem usar a mesma área de movimentação. Qual é a prioridade?',options:['A equipe que chegou primeiro passa sem avisar.','Executar os dois movimentos ao mesmo tempo.','Coordenar a operação, sinalizar e garantir a separação segura das atividades.'],correct:2,explain:'Planejamento, comunicação e sinalização reduzem conflitos e riscos em áreas operacionais.'},
  {q:'Um navio precisa de informações sobre a previsão de atracação. Qual dado deve ser consultado?',options:['Somente a cor dos contêineres.','Programação do terminal e condições operacionais atualizadas.','Número de pessoas na sala de aula.'],correct:1,explain:'A programação envolve disponibilidade do berço, condições operacionais, janelas e informações logísticas relevantes.'},
  {q:'Após observar um incidente sem lesão, o que a equipe deve fazer?',options:['Não comentar, porque ninguém se machucou.','Continuar e apagar os registros.','Comunicar, registrar e apoiar a avaliação do ocorrido para prevenir repetição.'],correct:2,explain:'Registrar incidentes e quase acidentes ajuda a identificar causas e melhorar processos e barreiras de proteção.'}
];
let quizStarted=false,quizIndex=0,quizCorrect=0,quizAnswered=false;
function resetQuiz(){quizStarted=true;quizIndex=0;quizCorrect=0;renderQuiz();}
function renderQuiz(){quizAnswered=false;const q=QUIZ[quizIndex];$('#quizStep').textContent=`SITUAÇÃO ${quizIndex+1} DE ${QUIZ.length}`;$('#quizProgressBar').style.width=`${quizIndex/QUIZ.length*100}%`;$('#quizQuestion').textContent=q.q;$('#quizScore').textContent=`Acertos: ${quizCorrect}`;$('#quizFeedback').hidden=true;$('#quizNext').hidden=true;$('#quizAnswers').innerHTML=q.options.map((opt,i)=>`<button type="button" class="quiz-answer" data-answer="${i}">${String.fromCharCode(65+i)}. ${html(opt)}</button>`).join('');}
function initQuiz(){
  $('#quizAnswers').addEventListener('click',e=>{const btn=e.target.closest('[data-answer]');if(!btn||quizAnswered)return;quizAnswered=true;const answer=Number(btn.dataset.answer),q=QUIZ[quizIndex],right=answer===q.correct;if(right)quizCorrect++;$$('[data-answer]').forEach(b=>{b.disabled=true;if(Number(b.dataset.answer)===q.correct)b.classList.add('correct');else if(b===btn)b.classList.add('wrong');});$('#quizFeedback').hidden=false;$('#quizFeedback').textContent=`${right?'✓ Resposta correta!':'ⓘ Vamos aprender com a situação.'} ${q.explain}`;$('#quizNext').hidden=false;$('#quizNext').textContent=quizIndex===QUIZ.length-1?'Ver resultado →':'Próxima situação →';$('#quizScore').textContent=`Acertos: ${quizCorrect}`;$('#quizProgressBar').style.width=`${(quizIndex+1)/QUIZ.length*100}%`;});
  $('#quizNext').onclick=()=>{quizIndex++;if(quizIndex===QUIZ.length){$('#quizStep').textContent='DESAFIO CONCLUÍDO';$('#quizQuestion').textContent=`Você acertou ${quizCorrect} de ${QUIZ.length} situações!`;$('#quizAnswers').innerHTML='<p style="color:#b9cad8">Discuta com a turma quais decisões aumentam a segurança e a eficiência operacional.</p>';$('#quizFeedback').hidden=true;$('#quizNext').textContent='↺ Jogar novamente';$('#quizNext').hidden=false;$('#quizNext').onclick=()=>{resetQuiz();initQuizNextHandler();};}else renderQuiz();};
}
function initQuizNextHandler(){ /* substitui o handler reatribuído ao terminar */ $('#quizNext').onclick=()=>{quizIndex++;if(quizIndex===QUIZ.length){finishQuiz();}else renderQuiz();}; }
function finishQuiz(){ $('#quizStep').textContent='DESAFIO CONCLUÍDO';$('#quizQuestion').textContent=`Você acertou ${quizCorrect} de ${QUIZ.length} situações!`;$('#quizAnswers').innerHTML='<p style="color:#b9cad8">Discuta com a turma quais decisões aumentam a segurança e a eficiência operacional.</p>';$('#quizFeedback').hidden=true;$('#quizNext').textContent='↺ Jogar novamente';$('#quizNext').hidden=false;$('#quizNext').onclick=()=>{resetQuiz();initQuizNextHandler();}; }

startShell();initDrawing();initSolids();initPuzzle();initQuiz();
window.TVTouchNavigation=Object.freeze({
  go:(page)=>go(page),
  tool:(tool)=>launchTool(tool),
  current:()=>currentPage,
  activeTool:()=>activeTool
});
try{
  const tool=new URLSearchParams(location.search).get('tool');
  if(['desenho','solidos','encaixe','porto'].includes(tool)){
    requestAnimationFrame(()=>{
      launchTool(tool);
      history.replaceState(null,'',location.pathname+'#atividade');
    });
  }
}catch{}
