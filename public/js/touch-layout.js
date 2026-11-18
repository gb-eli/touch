/* Studio 3.6: a tela inicial deve caber entre o cabeçalho real e o dock fixo.
   Medição em pixels CSS, sem aplicar zoom nem interceptar gestos touch. */
(()=>{
 'use strict';
 const home=document.querySelector('.studio-home');
 const dock=document.querySelector('.sidebar');
 if(!home||!dock)return;
 const desktop=matchMedia('(min-width:900px) and (min-height:680px)');
 let task=0;
 function fit(){
  task=0;
  if(!desktop.matches||!document.body.classList.contains('studio-home-active')){
   home.style.removeProperty('--agv-touch-home-available-height');return;
  }
  const top=home.getBoundingClientRect().top;
  const bottom=Math.min(window.innerHeight,dock.getBoundingClientRect().top);
  const available=Math.max(280,Math.floor(bottom-top-12));
  home.style.setProperty('--agv-touch-home-available-height',available+'px');
 }
 function schedule(){
  if(task)cancelAnimationFrame(task);
  task=requestAnimationFrame(fit);
 }
 desktop.addEventListener?.('change',schedule);
 window.addEventListener('resize',schedule,{passive:true});
 window.visualViewport?.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('load',schedule,{once:true});
 window.addEventListener('hashchange',schedule);
 new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
 schedule();
})();
