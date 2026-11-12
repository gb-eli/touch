/* TV TOUCH AGV — telemetria pedagógica mínima, sem login e somente após opção do docente. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const STATION_KEY = 'tvtouch:station-label:v1';
  const SUBJECTS = Object.freeze({
    comum: [
      'Língua Portuguesa','Matemática','História','Geografia','Ciências','Biologia',
      'Física','Química','Arte','Educação Física','Língua Inglesa','Língua Espanhola',
      'Filosofia','Sociologia','Outro componente curricular'
    ],
    tecnica: [
      'Desenvolvimento de Sistemas','Introdução à Programação','Programação Front-End',
      'Programação Mobile','Banco de Dados','Análise de Sistemas','Redes de Computadores',
      'Informática Empresarial','Inovação e Empreendedorismo','Administração',
      'Logística','Operações Portuárias','Segurança do Trabalho','Outro componente técnico'
    ],
    interdisciplinar: [
      'Projeto Integrador','Feira de Ciências','Projeto Interdisciplinar','Formação de Professores'
    ]
  });
  const cfg = window.TV_TOUCH_CONFIG || {};
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.supabaseUrl || '') &&
    typeof cfg.publishableKey === 'string' && cfg.publishableKey.length > 15;
  const endpoint = configured ? `${cfg.supabaseUrl.replace(/\/$/,'')}/functions/v1/${cfg.functionName || 'tv-touch-telemetry'}` : '';
  let context = null;
  let serverSession = null;
  let ongoing = false;
  let heartbeatTimer;
  let networkTimer;
  const label = {comum:'Formação geral',tecnica:'Formação técnica',interdisciplinar:'Interdisciplinar'};
  function setStatus(msg){$('lessonState').textContent=msg;}
  function selectStation(){
    try {const saved=localStorage.getItem(STATION_KEY);if(['TV TOUCH 01','TV TOUCH 02','TV TOUCH 03'].includes(saved))$('lessonStation').value=saved;}
    catch { /* Se o navegador bloquear o armazenamento, a seleção continua disponível. */ }
  }
  function selectArea(){
    const area=$('lessonArea').value,sel=$('lessonDiscipline');
    sel.replaceChildren();
    const placeholder=new Option(area?'Selecione a disciplina':'Primeiro escolha uma área','');
    sel.append(placeholder);
    (SUBJECTS[area]||[]).forEach(name=>sel.append(new Option(name,name)));
    sel.disabled=!SUBJECTS[area];
  }
  function setContext(){
    const text=context ? `${label[context.area]} · ${context.discipline} · ${context.station}` : 'Escolha a disciplina para organizar o uso do TV TOUCH. O registro de métricas é opcional.';
    $('lessonContextText').textContent=text;
    $('lessonChip').textContent=context?`📘 ${context.discipline}`:'📘 Definir aula';
    $('lessonChip').title=context?`${text} · ${serverSession?'Métricas habilitadas':'Sem métricas'}`:'Selecionar disciplina';
  }
  function openDialog(){
    selectStation();
    setStatus(configured ? 'A integração está configurada. A coleta somente começa se você autorizar.' : 'Modo local: configure telemetria-config.js e publique a Edge Function para enviar métricas.');
    if(!$('lessonDialog').open)$('lessonDialog').showModal();
  }
  function closeDialog(){if($('lessonDialog').open)$('lessonDialog').close();}
  async function call(payload, timeout=5500){
    if(!configured)throw Error('Integração não configurada');
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeout);
    try {
      const res=await fetch(endpoint,{method:'POST',mode:'cors',cache:'no-store',headers:{'Content-Type':'application/json','apikey':cfg.publishableKey},body:JSON.stringify(payload),signal:controller.signal});
      if(!res.ok)throw Error(`Servidor: HTTP ${res.status}`);
      return await res.json();
    } finally {clearTimeout(timer);}
  }
  async function send(event){
    if(!serverSession || !context || !navigator.onLine)return;
    try{await call({...event,sessionId:serverSession},4000);}catch{/* O modo aula continua; falhas de transporte não bloqueiam o professor. */}
  }
  function deviceMeta(){
    const ua=navigator.userAgent || '';
    const os=(ua.match(/Android\s+\d+(?:\.\d+)?/)||[])[0] || (ua.includes('Windows')?'Windows':'Outro');
    const browser=(ua.match(/(?:Chrome|Firefox|EdgA|SamsungBrowser)\/[\d.]+/)||[])[0]||'Outro';
    return {
      os:os.slice(0,40),browser:browser.slice(0,40),
      width:Math.min(32767,Math.max(0,Math.floor(screen.width))),
      height:Math.min(32767,Math.max(0,Math.floor(screen.height))),
      touchLimit:typeof navigator.maxTouchPoints==='number'?Math.min(100,Math.max(0,navigator.maxTouchPoints)):null,
      webgl:(()=>{try{const canvas=document.createElement('canvas');return Boolean(canvas.getContext('webgl'));}catch{return false;}})()
    };
  }
  async function begin(optIn){
    const area=$('lessonArea').value,discipline=$('lessonDiscipline').value,station=$('lessonStation').value;
    if(!SUBJECTS[area]?.includes(discipline) || !['TV TOUCH 01','TV TOUCH 02','TV TOUCH 03'].includes(station)){
      setStatus('Selecione a área, a disciplina e a TV para iniciar.');return;
    }
    context={area,discipline,station};serverSession=null;
    clearInterval(heartbeatTimer);clearInterval(networkTimer);
    try{localStorage.setItem(STATION_KEY,station);}catch{}
    const diag=$('diagStation');if(diag)diag.value=station;
    setContext();
    window.dispatchEvent(new CustomEvent('tvt:station-selected',{detail:{station}}));
    if(!optIn){setStatus('Aula iniciada sem telemetria. Nenhum evento de uso será enviado.');closeDialog();return;}
    if(!configured){setStatus('Aula iniciada em modo local. Para ativar a coleta, configure o Supabase.');closeDialog();return;}
    if(!navigator.onLine){setStatus('Aula iniciada offline, sem coleta remota.');closeDialog();return;}
    if(ongoing)return;
    ongoing=true;setStatus('Iniciando sessão no Supabase...');
    try{
      const answer=await call({kind:'start',station,area,discipline,device:deviceMeta()});
      if(!answer?.sessionId)throw Error('Sessão não confirmada pelo servidor');
      serverSession=answer.sessionId;
      setContext();setStatus('Métricas anônimas habilitadas para esta aula.');closeDialog();
      send({kind:'event',event:'page_load',item:'home'});
      const nav=performance.getEntriesByType?.('navigation')?.[0];
      if(nav && Number.isFinite(nav.duration))send({kind:'metric',type:'page_load_ms',value:Math.round(nav.duration),attempts:1,failures:0});
      heartbeatTimer=setInterval(()=>{if(!document.hidden)send({kind:'heartbeat'});},120000);
      networkTimer=setInterval(()=>{if(!document.hidden)checkNetwork(true);},300000);
      checkNetwork(true);
    }catch(err){setStatus(`Aula iniciada, mas a coleta remota falhou (${err?.message||'erro'}). O portal funciona normalmente.`);}
    finally{ongoing=false;}
  }
  async function checkNetwork(automatic=false){
    const display=$('lessonNetworkResult');
    if(!configured){display.textContent='Servidor não configurado';return;}
    if(!navigator.onLine){display.textContent='O dispositivo informa estar offline';return;}
    if(!automatic)display.textContent='Medindo 3 requisições HTTP...';
    let ok=0,fail=0,sum=0;
    for(let i=0;i<3;i++){
      const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),4000);
      const start=performance.now();
      try{
        const r=await fetch(`${endpoint}?health=1&n=${i}`,{method:'GET',mode:'cors',cache:'no-store',signal:controller.signal});
        if(!r.ok)throw Error(String(r.status));
        sum+=performance.now()-start;ok++;
      }catch{fail++;}
      finally{clearTimeout(timer);}
    }
    const avg=ok?Math.round(sum/ok):null;
    display.textContent=`HTTP: ${avg===null?'sem resposta':avg+' ms de média'} · ${fail}/3 falhas (${Math.round(fail/3*100)}%). Não é ping ICMP nem perda de pacotes.`;
    if(serverSession)send({kind:'metric',type:'http_latency_ms',value:avg,attempts:3,failures:fail});
  }
  $('lessonArea').addEventListener('change',selectArea);
  $('lessonForm').addEventListener('submit',e=>{e.preventDefault();begin($('lessonTelemetry').checked);});
  $('lessonNoTelemetry').addEventListener('click',()=>{begin(false);});
  $('lessonClose').addEventListener('click',closeDialog);
  $('lessonOpen').addEventListener('click',openDialog);
  $('lessonChip').addEventListener('click',openDialog);
  $('lessonTestNetwork').addEventListener('click',()=>checkNetwork(false));
  window.addEventListener('tvt:station-change',selectStation);
  window.addEventListener('tvt:tool-open',e=>send({kind:'event',event:'tool_open',item:e.detail.id}));
  window.addEventListener('tvt:resource-open',e=>send({kind:'event',event:'resource_open',item:e.detail.id}));
  window.addEventListener('tvt:measurement',e=>{
    const d=e.detail||{};if(['touch_peak','fps'].includes(d.type))send({kind:'metric',type:d.type,value:d.value,attempts:1,failures:0});
  });
  setContext();selectStation();
  setTimeout(()=>{if(!context && !document.hidden && !$('resourceDialog').open)openDialog();},1100);
})();
