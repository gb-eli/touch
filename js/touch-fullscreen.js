/* AGV TOUCH Studio 3.7 — tela cheia real de todo o aplicativo, nunca só do canvas. */
(() => {
  'use strict';
  const root=document.documentElement;
  let noticeTimeout=0;
  const active=()=>Boolean(document.fullscreenElement||document.webkitFullscreenElement);
  const exit=document.createElement('button');
  exit.type='button';
  exit.id='agvFullscreenExit';
  exit.className='agv-fullscreen-exit';
  exit.setAttribute('data-touch-fullscreen','');
  exit.setAttribute('aria-label','Sair da tela cheia');
  exit.textContent='⤢ Sair da tela cheia';
  exit.hidden=true;
  const message=document.createElement('div');
  message.id='agvFullscreenNotice';
  message.className='agv-fullscreen-notice';
  message.setAttribute('role','status');
  message.setAttribute('aria-live','polite');
  message.hidden=true;
  document.body.append(exit,message);
  function inform(text){
    message.textContent=text;
    message.hidden=false;
    clearTimeout(noticeTimeout);
    noticeTimeout=setTimeout(()=>{message.hidden=true;},6500);
  }
  function sync(){
    const expanded=active();
    document.body.classList.toggle('agv-is-fullscreen',expanded);
    for(const button of document.querySelectorAll('[data-touch-fullscreen]')){
      button.setAttribute('aria-pressed',String(expanded));
      button.setAttribute('aria-label',expanded?'Sair da tela cheia':'Ativar tela cheia');
      button.title=expanded?'Sair da tela cheia':'Ativar tela cheia';
      const label=button.querySelector('[data-fullscreen-label]');
      if(label)label.textContent=expanded?'Sair da tela cheia':'Tela cheia';
    }
    exit.hidden=!expanded;
    window.dispatchEvent(new CustomEvent('agv:fullscreenchange',{detail:{expanded}}));
  }
  async function toggle(){
    try{
      if(active()){
        const leave=document.exitFullscreen?.bind(document)||document.webkitExitFullscreen?.bind(document);
        if(!leave)throw Error('exit-unavailable');
        await Promise.resolve(leave());
      }else{
        const enter=root.requestFullscreen?.bind(root)||root.webkitRequestFullscreen?.bind(root);
        if(!enter){inform('Este navegador não oferece tela cheia por botão. Use as opções da TV ou instale o aplicativo na tela inicial.');return false;}
        await Promise.resolve(enter());
      }
      sync();
      return true;
    }catch{
      inform('O navegador bloqueou a tela cheia. Tente após tocar na página ou use o modo de tela cheia da TV.');
      sync();
      return false;
    }
  }
  // Delegação: controles continuam funcionando após reinicializações de atividades.
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-touch-fullscreen]');
    if(!button||button.disabled)return;
    event.preventDefault();
    toggle();
  });
  document.addEventListener('fullscreenchange',sync);
  document.addEventListener('webkitfullscreenchange',sync);
  document.addEventListener('fullscreenerror',()=>inform('Tela cheia não autorizada neste dispositivo.'));
  window.AGVTouchFullscreen=Object.freeze({toggle,isActive:active,sync});
  sync();
})();
