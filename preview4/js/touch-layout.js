/* AGV TOUCH Studio 3.7: viewport VISÍVEL do navegador, inclusive em paisagem curta. */
(() => {
  'use strict';
  const home=document.querySelector('.studio-home');
  const dock=document.querySelector('.sidebar');
  const header=document.querySelector('.topbar,.oficina-header,.arcade-header');
  let task=0;
  function fit(){
    task=0;
    const viewport=window.visualViewport;
    const height=Math.max(0,Math.floor(Math.min(window.innerHeight,viewport?.height||window.innerHeight)));
    const width=Math.max(0,Math.floor(Math.min(window.innerWidth,viewport?.width||window.innerWidth)));
    const landscape=width>=760&&height>=350&&width/Math.max(height,1)>=1.35;
    document.body.classList.toggle('agv-landscape-app',landscape);
    document.documentElement.style.setProperty('--agv-live-vh',height+'px');
    if(header)document.documentElement.style.setProperty('--agv-header-h',Math.ceil(header.getBoundingClientRect().height)+'px');
    if(!home)return;
    if(!landscape||!document.body.classList.contains('studio-home-active')){
      home.style.removeProperty('--agv-touch-home-available-height');
      return;
    }
    const top=home.getBoundingClientRect().top;
    const bottom=dock?Math.min(height,dock.getBoundingClientRect().top):height;
    const available=Math.max(140,Math.floor(bottom-top-9));
    home.style.setProperty('--agv-touch-home-available-height',available+'px');
  }
  function schedule(){
    if(task)cancelAnimationFrame(task);
    task=requestAnimationFrame(fit);
  }
  window.addEventListener('resize',schedule,{passive:true});
  window.visualViewport?.addEventListener('resize',schedule,{passive:true});
  window.visualViewport?.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('orientationchange',schedule,{passive:true});
  window.addEventListener('agv:fullscreenchange',schedule);
  window.addEventListener('load',schedule,{once:true});
  window.addEventListener('hashchange',schedule);
  new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
  if(typeof ResizeObserver!=='undefined'){
    const observer=new ResizeObserver(schedule);
    if(header)observer.observe(header);
    if(dock)observer.observe(dock);
  }
  schedule();
})();
