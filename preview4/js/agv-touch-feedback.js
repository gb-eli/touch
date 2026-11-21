/* AGV TOUCH Studio 3.2 — touch feedback: somente DOM, sem dados pessoais. */
(() => {
  'use strict';
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
  const quiet=()=>document.body?.classList.contains('agv-quiet-mode')===true;
  const saveData=()=>navigator.connection?.saveData===true;
  let active=0;
  const LIMIT=7;
  function pulse(event){
    if(active>=LIMIT||reduced()||quiet()||saveData())return;
    if(event.pointerType==='mouse'&&event.button!==0)return;
    const target=event.target?.closest?.(
      '.arcade-game, .oficina-choices button, .oficina-grid3 button, .oficina-panel-actions button,'+
      '.arcade-actions button, .arcade-keypad button, .oficina-links a, .agv32-action,'+
      '.home-shortcuts button, .home-shortcuts a, .studio-tile, .nav-item, .lab-card,'+
      '.tvt-arcade-link, .oficina-palette button'
    );
    if(!target||target.matches(':disabled')||target.getAttribute('aria-disabled')==='true')return;
    if(target.closest('.tvt-entry, .agv-command-dialog, .piano-keys'))return;
    const rect=target.getBoundingClientRect();
    if(rect.width<1||rect.height<1)return;
    const point=document.createElement('span');
    point.className='agv32-touch-wave';
    point.setAttribute('aria-hidden','true');
    point.style.setProperty('--wave-x',Math.max(0,Math.min(rect.width,event.clientX-rect.left))+'px');
    point.style.setProperty('--wave-y',Math.max(0,Math.min(rect.height,event.clientY-rect.top))+'px');
    target.classList.add('agv32-touchable');
    active++;
    let finished=false;
    const stop=()=>{
      if(finished)return;
      finished=true;active=Math.max(0,active-1);
      point.remove();
    };
    point.addEventListener('animationend',stop,{once:true});
    target.appendChild(point);
    window.setTimeout(stop,560);
  }
  document.addEventListener('pointerdown',pulse,{passive:true});
})();
