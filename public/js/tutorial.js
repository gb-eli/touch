/* TV TOUCH — Tutorial primeiro acesso; sem banco ou rastreamento. */
(() => {
  'use strict';
  const d=document.getElementById('tvtTutorial');
  if(!d)return;
  const $=id=>document.getElementById(id);
  const key='tvt:tutorial:v2.1';
  const steps=[
    ['BEM-VINDO','Sua próxima aula começa aqui.','Escolha uma atividade e toque na tela. O portal funciona sem cadastro.','Os cinco cartões da tela inicial são atalhos para experiências.'],
    ['01 / ESCOLHA','Um toque para começar.','Abra o Universo 3D, o Quadro, as Formas, a Memória ou os Vídeos 360°.','Na faixa Mais atividades você encontra jogos, laboratório e biblioteca.'],
    ['02 / INTERAJA','Gire. Arraste. Aproxime.','Use um dedo para girar objetos e dois para ampliar quando a experiência permitir.','Os controles por botões continuam disponíveis; os testes de toque ficam em Diagnóstico.'],
    ['03 / DESAFIE','Proponha uma missão.','Encontre pares no jogo da memória, compare sólidos ou ajuste a gravidade de uma esfera.','A disciplina e a coleta de métricas são opcionais.']
  ];
  let step=0,lastFocus=null;
  const primary=$('tvtTourPrimary'),secondary=$('tvtTourSecondary');
  const finished=()=>{try{localStorage.setItem(key,'done');}catch{}};
  const seen=()=>{try{return localStorage.getItem(key)==='done';}catch{return false;}};
  function render(){
    const s=steps[step];d.dataset.step=String(step);
    $('tvtTourEyebrow').textContent=s[0];
    $('tvtTutorialTitle').textContent=s[1];
    $('tvtTourDescription').textContent=s[2];
    $('tvtTourNote').textContent=s[3];
    $('tvtTourCounter').textContent=(step+1)+' / '+steps.length;
    $('tvtTourProgress').style.width=(100*(step+1)/steps.length)+'%';
    primary.textContent=step===0?'Ver tutorial':step===steps.length-1?'Ir para ferramentas':'Continuar';
    secondary.textContent=step===0?'Ir para ferramentas':'Voltar';
  }
  function close(){
    finished();if(d.open)d.close();else d.removeAttribute('open');
    if(lastFocus?.isConnected)lastFocus.focus();
  }
  function open(manual=false){
    if(!manual&&seen())return;
    if([...document.querySelectorAll('dialog[open]')].some(el=>el!==d))return;
    step=0;lastFocus=document.activeElement;render();
    if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');
    primary.focus();
  }
  primary.addEventListener('click',()=>{if(step===steps.length-1)close();else{step++;render();primary.focus();}});
  secondary.addEventListener('click',()=>{if(step===0)close();else{step--;render();secondary.focus();}});
  $('tvtTourClose').addEventListener('click',close);
  d.addEventListener('cancel',finished);
  d.addEventListener('close',finished);
  $('tvtTourOpenHome')?.addEventListener('click',()=>open(true));
  $('tvtTourOpenTop')?.addEventListener('click',()=>open(true));
  window.addEventListener('load',()=>{
    if(location.hash&&location.hash!=='#inicio')return;
    setTimeout(()=>{if(!document.hidden)open(false);},650);
  },{once:true});
  window.TVTouchTutorial=Object.freeze({open:()=>open(true)});
})();