/* TV TOUCH — Experience Host: lazy loading, lifecycle e isolamento. Sem backend. */
(() => {
  'use strict';
  const ENTRY=Object.freeze({
    piano:()=>import('../experiences/piano/index.js')
  });
  let current=null,revision=0;
  function allowed(id){
    const g=window.TVTouchGovernance;
    return !g || (g.available('module_laboratorio')!==false && g.available('module_'+id)!==false);
  }
  function showError(root,message){
    if(!root)return;
    root.replaceChildren();
    const box=document.createElement('div');box.className='piano-loading';box.setAttribute('role','alert');
    const text=document.createElement('p');text.textContent=message;
    const retry=document.createElement('button');retry.type='button';retry.className='piano-next';retry.textContent='Tentar novamente';retry.addEventListener('click',()=>open('piano'));
    box.append(text,retry);root.append(box);
  }
  function close(){
    revision++;
    const prev=current;current=null;
    if(!prev)return;
    prev.controller.abort();
    try{prev.instance?.unmount?.();}catch(err){console.warn('Falha ao encerrar experiência',err);}
    prev.root?.replaceChildren();
  }
  async function open(id){
    if(!ENTRY[id])return;
    if(!allowed(id)){
      document.querySelector('[data-page="inicio"]')?.click();
      return;
    }
    if(current?.id===id)return;
    close();
    const root=document.getElementById('pianoMount'),controller=new AbortController();
    const token=revision;
    if(!root)return;
    root.innerHTML='<div class="piano-loading" role="status">Carregando piano…</div>';
    const record={id,root,controller,instance:null};
    current=record;
    try{
      const mod=await ENTRY[id]();
      if(controller.signal.aborted||current!==record||token!==revision)return;
      if(typeof mod.mount!=='function')throw Error('Experiência sem função de abertura.');
      const instance=await mod.mount({
        root,signal:controller.signal,
        emit:(type,detail)=>{if(!controller.signal.aborted)window.dispatchEvent(new CustomEvent('tvt:experience-event',{detail:{type, ...detail}}));}
      });
      if(controller.signal.aborted||current!==record||token!==revision){instance?.unmount?.();return;}
      record.instance=instance;
      if(document.hidden)instance?.pause?.();
    }catch(error){
      if(controller.signal.aborted||current!==record||token!==revision)return;
      console.warn('Falha no módulo de experiência',error);
      showError(root,'Não foi possível abrir o piano. Tente novamente ou volte ao início.');
    }
  }
  function route(page){
    if(page==='piano')open(page);
    else close();
  }
  window.addEventListener('tvt:page-change',event=>route(event.detail?.page));
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)current?.instance?.pause?.();
    else current?.instance?.resume?.();
  });
  window.addEventListener('pagehide',close);
  document.addEventListener('DOMContentLoaded',()=>{
    const page=document.querySelector('.page.active')?.id.replace('page-','');
    if(page==='piano')route(page);
  },{once:true});
  // No caso de este script defer iniciar depois que app.js já navegou via hash.
  if(document.readyState!=='loading'){
    const page=document.querySelector('.page.active')?.id.replace('page-','');
    if(page==='piano')route(page);
  }
  window.TVTouchExperiences=Object.freeze({open,close,active:()=>current?.id||null});
})();
