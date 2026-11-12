/* TV TOUCH v1.1 — diagnóstico local e voluntário, sem telemetria/remessa de relatórios. */
(() => {
  'use strict';
  const el = id => document.getElementById(id);
  const STATION_KEY = 'tvtouch:station-label:v1';
  const state = { base: {}, storage: {}, touchPeak: null, fps: null, motion: null };
  const val = (value, fallback='Não informado pelo navegador') => value === null || value === undefined || value === '' ? fallback : String(value);
  const supported = truth => truth ? 'Disponível' : 'Não detectado';
  const tile = (heading, value, note='') => {
    const outer = document.createElement('div'); outer.className='diag-data';
    const lbl=document.createElement('span');lbl.textContent=heading;
    const main=document.createElement('strong');main.textContent=val(value);
    outer.append(lbl,main);
    if(note){const small=document.createElement('small');small.textContent=note;outer.appendChild(small);}
    return outer;
  };
  function browserName(ua) {
    if (/SamsungBrowser\/([\d.]+)/i.test(ua)) return `Samsung Internet ${RegExp.$1}`;
    if (/EdgA?\/([\d.]+)/i.test(ua)) return `Microsoft Edge ${RegExp.$1}`;
    if (/Firefox\/([\d.]+)/i.test(ua)) return `Firefox ${RegExp.$1}`;
    if (/Chrome\/([\d.]+)/i.test(ua)) return `Chrome ${RegExp.$1}`;
    return 'Navegador não identificado';
  }
  function checkGl(name) {
    try {const c=document.createElement('canvas');const gl=c.getContext(name,{powerPreference:'low-power'});
      if(!gl)return false;
      const ext=gl.getExtension('WEBGL_lose_context');if(ext)ext.loseContext();return true;
    } catch {return false;}
  }
  function currentBase() {
    const net=navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const size=window.visualViewport;
    const w=Math.round(size?.width || innerWidth),h=Math.round(size?.height || innerHeight);
    return {
      browser:browserName(navigator.userAgent || ''), os:/Android\s*([\d.]+)/i.test(navigator.userAgent || '') ? `Android ${RegExp.$1}` : val(navigator.platform,'Sistema não informado'),
      language:navigator.language || 'Não informado', timezone:Intl.DateTimeFormat().resolvedOptions().timeZone || 'Não informado',
      screenPixels:`${screen.width} × ${screen.height}`, viewport:`${w} × ${h}`, pixelRatio:Number((devicePixelRatio||1).toFixed(2)),
      orientation:screen.orientation?.type || (w>h?'Horizontal':'Vertical'), touchPoints:navigator.maxTouchPoints ?? null,
      cpuThreads:navigator.hardwareConcurrency ?? null, ramApproxGiB:navigator.deviceMemory ?? null,
      onlineHint:navigator.onLine, networkType:net?.type || null, effectiveType:net?.effectiveType || null,
      rttApproxMs:typeof net?.rtt==='number'?net.rtt:null, downlinkApproxMbps:typeof net?.downlink==='number'?net.downlink:null,
      saveData:net?.saveData ?? null, secureContext:isSecureContext, webgl:checkGl('webgl'), webgl2:checkGl('webgl2'),
      webgpu:!!navigator.gpu, fullscreen:!!document.documentElement.requestFullscreen,
      serviceWorker:'serviceWorker' in navigator, installPwa:'serviceWorker' in navigator && isSecureContext,
      geolocationSupported:!!navigator.geolocation, motionEventSupported:'DeviceMotionEvent' in window,
      pointerEvents:'PointerEvent' in window, storageEstimate:!!navigator.storage?.estimate,
      wakeLock:!!navigator.wakeLock, webShare:!!navigator.share,
      reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,
      darkMode:matchMedia('(prefers-color-scheme: dark)').matches,
      highContrast:matchMedia('(prefers-contrast: more)').matches,
      colorDepth:screen.colorDepth || null,
      standalone:matchMedia('(display-mode: standalone)').matches
    };
  }
  function renderOverview() {
    const b=state.base;
    const values=[
      ['Sistema',b.os],['Navegador',b.browser],['Tela reportada',`${b.screenPixels} px`],
      ['Área útil do navegador',`${b.viewport} px`],['Escala de pixels',`${b.pixelRatio}×`],
      ['Toques simultâneos (informados)',val(b.touchPoints)],['Processadores lógicos',val(b.cpuThreads)],
      ['Memória aproximada',b.ramApproxGiB?`${b.ramApproxGiB} GiB`:'Não exposta pelo navegador'],
      ['Orientação',b.orientation],['Armazenamento usado (origem)',state.storage.used],
      ['Armazenamento disponível (estimativa)',state.storage.quota],
      ['Idioma',b.language]
    ];
    el('diagOverview').replaceChildren(...values.map(v=>tile(...v)));
  }
  function renderCapabilities() {
    const b=state.base;
    const entries=[
      ['Toque e gestos',b.pointerEvents && b.touchPoints>0],['WebGL 3D',b.webgl],['WebGL 2',b.webgl2],
      ['WebGPU',b.webgpu],['Tela cheia via página',b.fullscreen],['Cache offline (PWA)',b.installPwa],
      ['Acesso à posição com permissão',b.geolocationSupported && b.secureContext],
      ['Eventos de movimento',b.motionEventSupported && b.secureContext],['Impedir bloqueio da tela (Wake Lock)',b.wakeLock],
      ['Compartilhamento nativo',b.webShare],['Instalado como aplicativo',b.standalone]
    ];
    const root=el('diagCapabilities');root.replaceChildren();
    entries.forEach(([name,ok])=>{const row=document.createElement('div');row.className='diag-capability';const label=document.createElement('span');label.textContent=name;const result=document.createElement('strong');result.className=ok?'diag-yes':'diag-no';result.textContent=supported(ok);row.append(label,result);root.appendChild(row);});
  }
  function suggestions() {
    const b=state.base, messages=[];
    if(b.touchPoints === 0)messages.push('O navegador não informa suporte ao toque. Verifique se está aberto na própria TV, e não em um computador.');
    else if(b.touchPoints === 1)messages.push('O navegador indica somente um toque: prefira ações de arrastar e tocar, sem pinça.');
    else if(b.touchPoints >= 2)messages.push(`O navegador informa até ${b.touchPoints} toques. Faça o teste real de múltiplos dedos para confirmar.`);
    if(state.touchPeak !== null)messages.push(`Teste real: ${state.touchPeak} toque(s) simultâneo(s) reconhecido(s) nesta sessão.`);
    if(!b.webgl)messages.push('Sem WebGL detectado: priorize atividades Canvas 2D e simuladores simples.');
    if(b.webgl)messages.push('WebGL detectado: ferramentas de geometria e mapas 3D poderão ser testadas.');
    if((b.ramApproxGiB !== null && b.ramApproxGiB <= 2) || (b.cpuThreads!==null && b.cpuThreads<=2))messages.push('Capacidade reduzida informada: animações decorativas serão suavizadas e o portal deve priorizar atividades leves.');
    if(b.saveData || ['slow-2g','2g'].includes(b.effectiveType))messages.push('Rede econômica ou lenta: prefira recursos locais e evite vídeos simultâneos de alta resolução.');
    if(b.reducedMotion)messages.push('Preferência por movimento reduzido: evite animações automáticas desnecessárias.');
    if(state.fps !== null)messages.push(`Fluidez medida: ${state.fps} FPS neste teste simples.${state.fps<24?' Considere reduzir efeitos visuais.':''}`);
    if(!b.secureContext)messages.push('Abra pelo GitHub Pages com HTTPS para habilitar localização, sensores e PWA.');
    if(!b.onlineHint)messages.push('O navegador indica ausência de rede. Atividades próprias em cache podem funcionar offline.');
    if(!messages.length)messages.push('Configuração adequada para iniciar os testes de toque, desenho e recursos externos.');
    const root=el('diagRecommendations');root.replaceChildren();messages.forEach(v=>{const p=document.createElement('p');p.textContent='• '+v;root.appendChild(p);});
    const economical=b.reducedMotion || b.saveData || (b.ramApproxGiB!==null && b.ramApproxGiB<=2) || (b.cpuThreads!==null && b.cpuThreads<=2);
    document.documentElement.classList.toggle('diag-economy',!!economical);
  }
  function networkInfo(){
    const b=state.base;
    const info=[`Indicador de conectividade: ${b.onlineHint?'online (não garante acesso à internet)':'offline'}`];
    if(b.networkType)info.push(`Tipo informado: ${b.networkType}`);
    if(b.effectiveType)info.push(`Classe estimada: ${b.effectiveType}`);
    if(b.rttApproxMs!==null)info.push(`Latência aproximada: ${b.rttApproxMs} ms`);
    if(b.downlinkApproxMbps!==null)info.push(`Vazão estimada: ${b.downlinkApproxMbps} Mbps`);
    el('diagNetworkInfo').textContent=info.join(' · ');
  }
  function refresh() {
    state.base=currentBase();renderOverview();renderCapabilities();networkInfo();suggestions();
    if(navigator.storage?.estimate){navigator.storage.estimate().then(v=>{
      const fmt=n=>typeof n==='number'?`${(n/1024/1024).toFixed(1)} MB`:'Não informado';
      state.storage={used:fmt(v.usage),quota:fmt(v.quota)};renderOverview();
    }).catch(()=>{});} else {state.storage={used:'Não informado',quota:'Não informado'};}
  }
  function initTouchTest(){
    const start=el('diagStartTouch'),zone=el('diagTouchZone'),result=el('diagTouchResult');
    let current=new Set(),peak=0, timer=null;
    const remove=e=>{current.delete(e.pointerId);};
    zone.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'&&e.pointerType!=='pen')return;e.preventDefault();current.add(e.pointerId);peak=Math.max(peak,current.size);result.textContent=`${current.size} toque(s) agora • máximo ${peak}`;});
    ['pointerup','pointercancel','pointerleave'].forEach(event=>zone.addEventListener(event,remove));
    start.addEventListener('click',()=>{
      if(timer)return;current.clear();peak=0;zone.hidden=false;start.disabled=true;result.textContent='Toque com vários dedos na área destacada.';
      timer=setTimeout(()=>{timer=null;zone.hidden=true;start.disabled=false;state.touchPeak=peak;result.textContent=peak?`Máximo detectado: ${peak} toque(s) simultâneos.`:'Nenhum toque detectado; tente novamente na TV.';suggestions();window.dispatchEvent(new CustomEvent('tvt:measurement',{detail:{type:'touch_peak',value:peak,attempts:1,failures:0}}));},8000);
    });
  }
  function initFpsTest(){
    const button=el('diagStartFps'),out=el('diagFpsResult'),bar=el('diagFpsProgress');
    button.addEventListener('click',()=>{
      if(document.hidden){out.textContent='Deixe o portal visível para testar.';return;}
      button.disabled=true;bar.style.width='0%';out.textContent='Medindo fluidez...';let began=null,frames=0;
      function frame(now){
        if(began===null){began=now;requestAnimationFrame(frame);return;}
        frames++;const duration=now-began;bar.style.width=`${Math.min(duration/2200*100,100)}%`;
        if(duration<2200){requestAnimationFrame(frame);return;}
        state.fps=Math.round(frames/(duration/1000));button.disabled=false;
        out.textContent=`${state.fps} FPS médios (aproximação; pode ser limitado à frequência da tela).`;
        suggestions();
        window.dispatchEvent(new CustomEvent('tvt:measurement',{detail:{type:'fps',value:state.fps,attempts:1,failures:0}}));
      }
      requestAnimationFrame(frame);
    });
  }
  function initLocation(){
    el('diagLocation').addEventListener('click',()=>{
      const out=el('diagLocationResult');
      if(!isSecureContext || !navigator.geolocation){out.textContent='Geolocalização indisponível neste navegador ou fora de HTTPS.';return;}
      if(!confirm('Autorizar uma consulta de localização somente nesta sessão? Será mostrada uma posição aproximada, não armazenada e não incluída no relatório.'))return;
      out.textContent='Solicitando permissão e posição ao Android...';
      navigator.geolocation.getCurrentPosition(pos=>{
        const c=pos.coords;out.textContent=`Posição aproximada: ${c.latitude.toFixed(2)}, ${c.longitude.toFixed(2)} · precisão declarada pelo sistema: ~${Math.round(c.accuracy)} m. Não armazenada.`;
      },e=>{out.textContent=`Posição não obtida: ${e.code===1?'permissão negada':e.code===2?'localização indisponível':'tempo esgotado'}.`;},{enableHighAccuracy:false,timeout:9000,maximumAge:60000});
    });
  }
  function initIp(){
    el('diagPublicIp').addEventListener('click',async()=>{
      if(!confirm('Esta ação consultará o serviço externo api64.ipify.org, que receberá o endereço IP público da conexão. O TV TOUCH não armazenará nem exportará o resultado. Continuar?'))return;
      const out=el('diagIpResult');out.textContent='Consultando serviço externo...';
      try{const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),7000);
        let response;try{response=await fetch('https://api64.ipify.org?format=json',{signal:controller.signal,cache:'no-store'});}finally{clearTimeout(timeout);}
        if(!response.ok)throw Error('Erro HTTP');const data=await response.json();
        if(!/^([0-9a-f:.]+)$/i.test(String(data.ip||'')))throw Error('Resposta inválida');
        out.textContent=`IP público observado pelo serviço: ${data.ip}. Visível somente nesta sessão.`;
      }catch{out.textContent='Consulta indisponível. Verifique a conexão e o bloqueio a serviços externos.';}
    });
  }
  function initMotion(){
    const button=el('diagMotion'),out=el('diagMotionResult');
    button.addEventListener('click',async()=>{
      if(!isSecureContext || !window.DeviceMotionEvent){out.textContent='Eventos de movimento indisponíveis.';return;}
      if(typeof DeviceMotionEvent.requestPermission==='function'){
        try{if(await DeviceMotionEvent.requestPermission()!=='granted'){out.textContent='Permissão negada.';return;}}
        catch {out.textContent='Permissão de sensores não concedida.';return;}
      }
      let count=0;button.disabled=true;out.textContent='Aguardando eventos durante 8 segundos...';
      const read=()=>{count++;};window.addEventListener('devicemotion',read,{passive:true});
      setTimeout(()=>{window.removeEventListener('devicemotion',read);state.motion=count>0?'Eventos detectados':'Sem eventos detectados';out.textContent=`${state.motion} (${count} recebidos). Nenhum valor de sensor foi gravado.`;button.disabled=false;},8000);
    });
  }
  function safeReport(){
    const b=state.base;
    return {
      application:'TV TOUCH • AGV',schema:1,version:'1.1.0',generatedAt:new Date().toISOString(),
      stationLabel:el('diagStation').value || null,
      device:{browser:b.browser,operatingSystem:b.os,language:b.language,timezone:b.timezone,
        screenPixels:b.screenPixels,viewportPixels:b.viewport,pixelRatio:b.pixelRatio,orientation:b.orientation,
        maxTouchPointsReported:b.touchPoints,logicalProcessorsReported:b.cpuThreads,memoryApproxGiB:b.ramApproxGiB,
        colorDepth:b.colorDepth},
      compatibilities:{touchPointerEvents:b.pointerEvents,webgl:b.webgl,webgl2:b.webgl2,webgpu:b.webgpu,fullscreen:b.fullscreen,
        pwa:b.installPwa,wakeLock:b.wakeLock,geolocationApi:b.geolocationSupported,motionApi:b.motionEventSupported},
      connectivityEstimates:{onlineHint:b.onlineHint,networkType:b.networkType,effectiveType:b.effectiveType,
        rttApproxMs:b.rttApproxMs,downlinkApproxMbps:b.downlinkApproxMbps,saveData:b.saveData},
      preferences:{reducedMotion:b.reducedMotion,highContrast:b.highContrast,darkMode:b.darkMode},
      tests:{multitouchPeak:state.touchPeak,fpsApprox:state.fps,motionSupport:state.motion},
      privacy:{collectedStudentData:false,transmittedAutomatically:false,includesPublicIP:false,
        includesPrivateIP:false,includesMAC:false,includesCoordinates:false,includesSensorReadings:false}
    };
  }
  function initExport(){
    el('diagExport').addEventListener('click',()=>{
      const data=JSON.stringify(safeReport(),null,2),url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
      const a=document.createElement('a');a.href=url;a.download=`tv-touch-diagnostico-${(el('diagStation').value||'painel').toLowerCase().replace(/\s+/g,'-')}-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
      el('diagSaveStatus').textContent='Arquivo preparado. Se a TV bloquear downloads, use “Copiar resumo”.';
    });
    el('diagCopy').addEventListener('click',async()=>{
      const b=state.base;
      const text=`TV TOUCH • AGV — ${el('diagStation').value||'Painel não identificado'}\nSistema: ${b.os}\nNavegador: ${b.browser}\nTela: ${b.screenPixels}\nÁrea útil: ${b.viewport}\nToques informados: ${val(b.touchPoints)}\nToques testados: ${val(state.touchPeak,'Não testado')}\nWebGL: ${supported(b.webgl)}\nMemória aproximada: ${val(b.ramApproxGiB)} GiB\nFPS: ${val(state.fps,'Não testado')}\nDados de rede identificáveis e localização: omitidos.`;
      try {if(!navigator.clipboard?.writeText)throw Error();await navigator.clipboard.writeText(text);el('diagSaveStatus').textContent='Resumo copiado para a área de transferência.';}
      catch{el('diagSaveStatus').textContent='Cópia indisponível neste navegador. Exporte o JSON.';}
    });
  }
  function initStation(){
    const combo=el('diagStation');
    try{const saved=localStorage.getItem(STATION_KEY);if([...combo.options].some(o=>o.value===saved))combo.value=saved||'';}catch{}
    el('diagSaveStation').addEventListener('click',()=>{
      try {if(combo.value)localStorage.setItem(STATION_KEY,combo.value);else localStorage.removeItem(STATION_KEY);
        el('diagSaveStatus').textContent='Identificação salva neste navegador.';window.dispatchEvent(new Event('tvt:station-change'));
      } catch{el('diagSaveStatus').textContent='Armazenamento local indisponível; identificação válida nesta sessão.';}
    });
    el('diagClear').addEventListener('click',()=>{
      if(!confirm('Apagar a identificação do equipamento salva neste navegador? Favoritos e desenhos não serão afetados.'))return;
      try{localStorage.removeItem(STATION_KEY);}catch{}combo.value='';el('diagSaveStatus').textContent='Identificação apagada neste navegador.';window.dispatchEvent(new Event('tvt:station-change'));
    });
  }
  if(!el('page-diagnostico'))return;
  initStation();initTouchTest();initFpsTest();initLocation();initIp();initMotion();initExport();refresh();
  window.addEventListener('resize',()=>{state.base=currentBase();renderOverview();suggestions();});
  window.addEventListener('online',refresh);window.addEventListener('offline',refresh);
})();
