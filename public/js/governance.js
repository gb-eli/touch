/* Políticas remotas: controle de exibição, não barreira de segurança para sites externos. */
(() => {
  'use strict';
  const cfg = window.TV_TOUCH_CONFIG || {};
  const valid = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.supabaseUrl || '') && typeof cfg.publishableKey === 'string' && cfg.publishableKey.length > 15;
  const STATIONS = ['TV TOUCH 01','TV TOUCH 02','TV TOUCH 03'];
  const DEFAULT_PROFILE = Object.freeze({rotation_sensitivity:1,brush_sensitivity:1,drag_threshold_px:12});
  let station = STATIONS[0];
  try {station = localStorage.getItem('tvtouch:station-label:v1') || STATIONS[0];} catch {}
  let features = new Map();
  let profile = {...DEFAULT_PROFILE};
  let synced = false;
  const origin = valid ? cfg.supabaseUrl.replace(/\/$/,'') : '';
  const apiHeaders = valid ? {apikey:cfg.publishableKey} : {};
  const notice = () => document.getElementById('governanceNotice');
  function notify(message) { const el=notice(); if(!el)return;el.textContent=message;el.hidden=false;setTimeout(()=>el.hidden=true,5000); }
  function available(key) { return features.get(key)!==false; }
  function classify(el) {
    const tool=el.closest('[data-tool]'); if(tool) return 'tool_'+tool.dataset.tool;
    const resource=el.closest('[data-visit-resource],[data-open-resource]'); if(resource) return 'resource_'+(resource.dataset.visitResource||resource.dataset.openResource);
    const nav=el.closest('[data-page],[data-go]'); if(nav){const page=nav.dataset.page||nav.dataset.go;return ['videos','laboratorio','diagnostico','cosmos','memoria','fisica'].includes(page)?'module_'+page:null;}
    return null;
  }
  async function fetchTable(table,columns,query='') {
    const url=`${origin}/rest/v1/${table}?select=${encodeURIComponent(columns)}${query}`;
    const response=await fetch(url,{headers:apiHeaders,mode:'cors',cache:'no-store'});
    if(!response.ok)throw Error(`HTTP ${response.status} em ${table}`);
    return response.json();
  }
  async function reload() {
    if(!valid) return;
    try {
      const [flags,profiles]=await Promise.all([
        fetchTable('tvt_features','id,enabled'),
        fetchTable('tvt_device_profiles','station,rotation_sensitivity,brush_sensitivity,drag_threshold_px',`&station=eq.${encodeURIComponent(station)}`)
      ]);
      features = new Map(flags.map(x=>[x.id,x.enabled===true]));
      const source=profiles[0]||DEFAULT_PROFILE;
      profile={rotation_sensitivity:Number(source.rotation_sensitivity)||1,brush_sensitivity:Number(source.brush_sensitivity)||1,drag_threshold_px:Number(source.drag_threshold_px)||12};
      synced=true;
      try {localStorage.setItem('tvtouch:governance-cache:v1',JSON.stringify({features:[...features],station,profile,time:Date.now()}));} catch {}
      refreshVisuals();
    } catch (error) {
      if(!synced) {try{const cached=JSON.parse(localStorage.getItem('tvtouch:governance-cache:v1')||'null');if(cached && Date.now()-cached.time<86400000){features=new Map(cached.features);if(cached.station===station)profile=cached.profile;refreshVisuals();}}catch{}}
      console.warn('Política TV TOUCH indisponível; utilizando preferências locais válidas, quando houver.',error);
    }
  }
  function refreshVisuals(){
    document.querySelectorAll('[data-tool],[data-visit-resource],[data-open-resource],[data-page],[data-go]').forEach(el=>{
      const key=classify(el);if(!key)return;
      const blocked=!available(key);
      el.classList.toggle('tvt-disabled',blocked);
      el.setAttribute('aria-disabled',String(blocked));
      if('disabled' in el)el.disabled=blocked;
    });
    const current=document.querySelector('.page.active')?.id.replace('page-','');
    if(['videos','laboratorio','diagnostico','cosmos','memoria','fisica'].includes(current)&&!available('module_'+current)){
      document.querySelector('[data-page="inicio"]')?.click();
    }
  }
  window.addEventListener('tvt:station-selected',e=>{if(STATIONS.includes(e.detail?.station)){station=e.detail.station;profile={...DEFAULT_PROFILE};reload();}});
  document.addEventListener('click',event=>{const key=classify(event.target);if(key&&!available(key)) {event.preventDefault();event.stopImmediatePropagation();notify('Atividade temporariamente desativada pela administração.');}},true);
  const observer=new MutationObserver(()=>{if(features.size)refreshVisuals();});
  document.addEventListener('DOMContentLoaded',()=>{observer.observe(document.body,{childList:true,subtree:true});refreshVisuals();reload();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)reload();});
  window.TVTouchCalibration=Object.freeze({rotation:()=>profile.rotation_sensitivity,brush:()=>profile.brush_sensitivity,drag:()=>profile.drag_threshold_px});
  window.TVTouchGovernance=Object.freeze({reload,available});
})();
