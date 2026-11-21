/* TV TOUCH Studio 4.0 — immersive landscape control deck.
 * Progressively enhances the existing portal. Never replaces/removes a
 * working route, touch handler or feature; portrait stays on original layout. */
(() => {
  'use strict';
  function init(){
    const home=document.querySelector('.studio-home');
    const grid=home?.querySelector('.studio-tiles');
    const drawer=home?.querySelector('.home-bottom');
    const heading=drawer?.querySelector('.home-bottom-title');
    if(!home||!grid||!drawer||!heading||grid.querySelector('.deck-app-tile'))return;
    const button=document.createElement('button');
    button.type='button';
    button.className='studio-tile deck-app-tile';
    button.id='agvDeckApps';
    button.setAttribute('aria-controls','agvDeckDrawer');
    button.setAttribute('aria-expanded','false');
    button.setAttribute('aria-label','Abrir mais experiências e ferramentas');
    button.innerHTML='<span class="tile-top"><span class="tile-index">ACESSO RÁPIDO</span>'+
      '<span class="tile-corner" aria-hidden="true">↗</span></span>'+
      '<span class="deck-app-icon" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>'+
      '<span class="tile-content"><strong>Mais experiências</strong><small>Oficina, Arcade e ferramentas</small></span>';
    grid.appendChild(button);
    drawer.id='agvDeckDrawer';
    drawer.setAttribute('role','region');
    drawer.setAttribute('aria-label','Outras experiências do TV TOUCH');
    heading.textContent='Mais experiências';
    const closeButton=document.createElement('button');
    closeButton.type='button';
    closeButton.className='deck-drawer-close';
    closeButton.setAttribute('aria-label','Fechar mais experiências');
    closeButton.title='Fechar';
    closeButton.textContent='×';
    closeButton.hidden=true;
    heading.appendChild(closeButton);
    const backdrop=document.createElement('div');
    backdrop.className='deck-backdrop';
    backdrop.hidden=true;
    home.appendChild(backdrop);
    let opened=false;
    function close(restoreFocus=false){
      if(!opened)return;
      opened=false;
      drawer.classList.remove('deck-open');
      backdrop.hidden=true;closeButton.hidden=true;
      button.setAttribute('aria-expanded','false');
      if(restoreFocus && button.offsetParent!==null)button.focus({preventScroll:true});
    }
    function open(){
      if(opened){close(true);return;}
      if(!document.body.classList.contains('agv-landscape-app'))return;
      opened=true;
      drawer.classList.add('deck-open');
      backdrop.hidden=false;closeButton.hidden=false;
      button.setAttribute('aria-expanded','true');
      closeButton.focus({preventScroll:true});
    }
    button.addEventListener('click',open);
    backdrop.addEventListener('click',()=>close(true));
    closeButton.addEventListener('click',()=>close(true));
    drawer.addEventListener('click',event=>{
      if(event.target.closest('a,button[data-go],button[data-tool]'))close(false);
    });
    document.addEventListener('keydown',event=>{
      if(!opened)return;
      if(event.key==='Escape'){event.preventDefault();close(true);return;}
      if(event.key==='Tab'){
        const controls=[closeButton,...drawer.querySelectorAll('a,button:not([hidden])')]
          .filter(el=>el.getClientRects().length>0&&!el.disabled);
        if(controls.length){
          const first=controls[0],last=controls[controls.length-1];
          if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
          else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
        }
      }
    });
    window.addEventListener('tvt:page-change',()=>close(false));
    window.addEventListener('hashchange',()=>close(false));
    const media=window.matchMedia('(orientation: landscape) and (min-width:760px)');
    media.addEventListener?.('change',e=>{if(!e.matches)close(false)});
    // The new layout is activated only after the DOM has been enhanced.
    // This class is also an explicit QA signal.
    document.body.classList.add('agv-deck-ready');
    window.AGVTControlDeck=Object.freeze({isOpen:()=>opened,close:()=>close(false)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
