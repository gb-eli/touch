/* TV TOUCH AGV — Indicadores 1.3. Sem coleta no painel ou credenciais privilegiadas no browser. */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const cfg = window.TV_TOUCH_CONFIG || {};
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.supabaseUrl || '') &&
    typeof cfg.publishableKey === 'string' && cfg.publishableKey.length > 15;
  const STATIONS = ['TV TOUCH 01', 'TV TOUCH 02', 'TV TOUCH 03'];
  const TOOL_NAMES = Object.freeze({
    earth:'Google Earth',geogebra:'GeoGebra 3D',phet:'PhET Simulações',nasa:'NASA Eyes',
    polypad:'Polypad',arts:'Google Arts & Culture',sketchfab:'Sketchfab 3D',
    geogeometry:'GeoGebra Geometria',earthmaps:'Google Earth Projetos',
    nasamissions:'NASA Interativos',arthistory:'Arts & Culture',phhtml:'PhET HTML5',
    porto360:'Portos em 360°',navio360:'Navios em 360°',oceano360:'Oceanos em 360°',
    historia360:'História em 360°',espaco360:'Espaço em 360°',museus360:'Museus em 360°',
    natureza360:'Natureza em 360°',industrias360:'Indústrias em 360°',
    desenho:'Quadro digital',solidos:'Sólidos 3D',encaixe:'Encaixe de formas',porto:'Desafio portuário'
  });
  const AREAS = Object.freeze({comum:'Formação geral',tecnica:'Formação técnica',interdisciplinar:'Interdisciplinar'});
  const COLORS = ['#18b8a8','#577fda','#e9a566'];
  const num = v => Number.isFinite(Number(v)) ? Number(v) : 0;
  const fmt = (v,opts) => new Intl.NumberFormat('pt-BR',opts).format(num(v));
  const str = v => String(v ?? '');
  const safe = v => str(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const asArray = x => Array.isArray(x) ? x : [];
  let client = null;
  let mode = 'locked';
  let report = null;
  let loading = false;

  window.TVTouchAdmin = Object.freeze({ getClient: () => mode === 'live' ? client : null, isDemo: () => mode === 'demo' });
  const adminStateEvent = () => window.dispatchEvent(new Event('tvt:admin-state'));
  const setMessage = (text,error=false) => {
    $('authMessage').textContent = text;
    $('authMessage').className = `auth-message${error ? ' error' : ''}`;
  };
  const setPill = (text,kind='') => {
    $('livePill').className = `pill ${kind}`;
    $('livePill').innerHTML = `<i></i>${safe(text)}`;
  };
  const setLoading = (busy,message='') => {
    loading = busy;
    $('loadStatus').textContent = message;
    $('refreshButton').disabled = busy;
    $('exportButton').disabled = busy || !report;
    $('periodFilter').disabled = busy;
    $('stationFilter').disabled = busy;
  };
  const displayDashboard = () => {
    $('authView').hidden = true;
    $('dashboard').hidden = false;
    $('demoNotice').hidden = mode !== 'demo';
    $('signoutButton').textContent = mode === 'demo' ? 'Sair da prévia' : 'Encerrar sessão';
    setPill(mode==='demo' ? 'Dados simulados' : 'Dados protegidos','' + (mode==='demo'?'demo':'connected'));
    adminStateEvent();
    window.scrollTo({top:0,behavior:'instant'});
  };
  const displayLogin = () => {
    mode = 'locked';
    report = null;
    $('dashboard').hidden = true;
    $('authView').hidden = false;
    $('password').value = '';
    setPill('Acesso restrito');
    adminStateEvent();
  };
  const checkAdmin = async userId => {
    const {data,error} = await client.from('tvt_admins').select('user_id').eq('user_id',userId).maybeSingle();
    if(error) throw error;
    return Boolean(data?.user_id === userId);
  };

  async function initClient(){
    if (!configured) {
      setMessage('Conexão não configurada. Configure telemetria-config.js para ativar o login. A demonstração está disponível.');
      return null;
    }
    if (client) return client;
    try {
      const module = await import('https://esm.sh/@supabase/supabase-js@2.112.3');
      client = module.createClient(cfg.supabaseUrl.replace(/\/$/,''),cfg.publishableKey,{
        auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:false}
      });
      return client;
    } catch {
      setMessage('Não foi possível carregar a biblioteca de autenticação. Verifique a internet da TV e tente novamente.',true);
      return null;
    }
  }

  async function signIn(e){
    e.preventDefault();
    if(loading) return;
    const email = $('email').value.trim();
    const password = $('password').value;
    $('loginButton').disabled = true;
    setMessage('Autenticando e verificando a autorização...');
    try {
      if(!await initClient()) return;
      const {data,error} = await client.auth.signInWithPassword({email,password});
      if(error) throw error;
      if(!data?.user?.id || !await checkAdmin(data.user.id)){
        await client.auth.signOut();
        setMessage('Conta autenticada, mas sem permissão para visualizar indicadores. Solicite ao responsável pelo Supabase que autorize seu usuário.',true);
        return;
      }
      mode='live';displayDashboard();await refresh();
    } catch(err){setMessage(`Não foi possível entrar: ${err?.message || 'verifique suas credenciais'}`,true);}
    finally{$('loginButton').disabled=false;}
  }

  async function refresh(){
    if (loading) return;
    setLoading(true,mode === 'demo'?'Gerando dados fictícios...':'Consultando indicadores agregados...');
    try {
      const days = Number($('periodFilter').value);
      const station = $('stationFilter').value || null;
      if(mode === 'demo'){
        report = demoReport(days,station);
      } else if(mode === 'live' && client){
        const {data,error} = await client.rpc('tvt_admin_dashboard',{p_days:days,p_station:station});
        if(error) throw error;
        if(!data || typeof data !== 'object') throw Error('Resposta inválida do banco');
        report = data;
      } else throw Error('É necessário autenticar-se');
      render(report);
      $('updatedAt').textContent = new Intl.DateTimeFormat('pt-BR', {dateStyle:'short',timeStyle:'short'}).format(new Date());
      setLoading(false,'');
    }catch(err){
      setLoading(false,`Falha ao consultar indicadores: ${err?.message || 'erro de conexão'}. Os dados anteriores, se houver, permanecem exibidos.`);
    }
  }

  function render(data){
    const s = data.summary || {};
    $('metricSessions').textContent=fmt(s.sessions);
    $('metricOpens').textContent=fmt(s.toolOpens);
    $('metricPanels').textContent=`${fmt(s.activePanels)} / 3`;
    $('metricMinutes').textContent= `${fmt(s.averageMinutes,{maximumFractionDigits:1})} min`;
    $('networkLatency').textContent=s.httpLatencyMs == null ? 'Sem dados' : `${fmt(s.httpLatencyMs,{maximumFractionDigits:1})} ms`;
    $('networkAttempts').textContent=fmt(s.httpAttempts);
    const errors = num(s.httpFailures), attempts=num(s.httpAttempts);
    $('networkErrors').textContent=fmt(errors);
    $('networkPercent').textContent=attempts ? `${fmt(errors*100/attempts,{maximumFractionDigits:1})}% das tentativas` : 'Sem testes registrados';
    $('networkGraphics').textContent= s.averageFps == null && s.touchPeak == null ? 'Sem testes' :
      `${s.averageFps==null ? '—' : fmt(s.averageFps,{maximumFractionDigits:1})} / ${s.touchPeak==null ? '—' : fmt(s.touchPeak)}`;
    $('chartPeriod').textContent=`Últimos ${num(data.days)} dias`;
    renderTrend(asArray(data.daily),num(data.days));
    renderAreas(asArray(data.areas),s.sessions);
    renderRanking('disciplinesList',asArray(data.disciplines).slice(0,6).map(x=>({label:x.name,count:x.sessions,sub:AREAS[x.area]||x.area})),false);
    renderRanking('toolsList',asArray(data.tools).slice(0,6).map(x=>({label:TOOL_NAMES[x.name]||x.name,count:x.opens,sub:x.event==='tool_open'?'Atividade própria':'Recurso externo'})),true);
    renderDevices(asArray(data.stations),asArray(data.network));
    renderNetwork(asArray(data.network));
  }

  const keyDate = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  function renderTrend(rows,days){
    const dataMap = new Map(rows.map(x=>[str(x.date),num(x.sessions)]));
    const today=new Date();
    const values=[];
    for(let offset=days-1;offset>=0;offset--){const d=new Date(today.getFullYear(),today.getMonth(),today.getDate()-offset);values.push({date:keyDate(d),count:dataMap.get(keyDate(d))||0});}
    const w=740,h=245,left=38,right=16,top=16,bottom=29;
    const pw=w-left-right,ph=h-top-bottom,max=Math.max(1,...values.map(x=>x.count));
    const x=i=>left+(i/Math.max(1,values.length-1))*pw;
    const y=v=>top+ph-(v/max)*ph;
    const points=values.map((v,i)=>`${x(i).toFixed(1)},${y(v.count).toFixed(1)}`).join(' ');
    const area=`${left},${top+ph} ${points} ${left+pw},${top+ph}`;
    const ticks=[0,.25,.5,.75,1].map(f=>{
      const yy=y(f*max).toFixed(1),val=Math.round(f*max);
      return `<line x1="${left}" y1="${yy}" x2="${w-right}" y2="${yy}" stroke="#e8eff1" stroke-dasharray="4 5"/><text x="${left-9}" y="${Number(yy)+4}" text-anchor="end" fill="#a1afb8" font-size="12">${val}</text>`;
    }).join('');
    const interval=Math.max(1,Math.floor(values.length/5));
    const labels=values.map((v,i)=>i%interval===0 || i===values.length-1 ? `<text x="${x(i).toFixed(1)}" y="${h-4}" text-anchor="middle" fill="#94a6b1" font-size="11">${v.date.slice(8,10)}/${v.date.slice(5,7)}</text>`:'').join('');
    $('trendChart').innerHTML=`<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15b7ad" stop-opacity=".22"/><stop offset="1" stop-color="#15b7ad" stop-opacity="0"/></linearGradient></defs>${ticks}<polygon points="${area}" fill="url(#trendFill)"/><polyline points="${points}" stroke="#0fa9a4" fill="none" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>${labels}</svg>`;
    $('trendChart').setAttribute('aria-label',`Sessões diárias nos últimos ${days} dias. Total: ${fmt(values.reduce((n,v)=>n+v.count,0))} sessões.`);
  }

  function renderAreas(areas,total){
    const value=num(total),map=new Map(areas.map(x=>[x.name,num(x.sessions)]));
    const groups=['comum','tecnica','interdisciplinar'];
    let cursor=0;
    const segments=groups.map((name,i)=>{const n=map.get(name)||0;const start=cursor;cursor+=value?n*100/value:0;return `${COLORS[i]} ${start}% ${cursor}%`;});
    $('areaDonut').style.background=value?`conic-gradient(${segments.join(',')})`:'conic-gradient(#dfe8ed 0 100%)';
    $('areaTotal').textContent=fmt(value);
    $('areaLegend').innerHTML=groups.map((name,i)=>`<div class="area-item"><i style="background:${COLORS[i]}"></i><div>${safe(AREAS[name])}<strong>${fmt(map.get(name)||0)} · ${value?fmt((map.get(name)||0)*100/value,{maximumFractionDigits:1}):'0'}%</strong></div></div>`).join('');
  }

  function renderRanking(id,items,alternate){
    if(!items.length){$(id).innerHTML='<div class="empty">Ainda não há registros para este período e filtro.</div>';return;}
    const max=Math.max(1,...items.map(x=>num(x.count)));
    $(id).innerHTML=items.map(x=>{
      const share=Math.min(100,num(x.count)*100/max);
      return `<div><div class="rank-top"><strong>${safe(x.label)}</strong><span>${fmt(x.count)}</span></div><div class="rank-meta">${safe(x.sub||'')}</div><div class="rank-track"><div class="rank-fill ${alternate?'alt':''}" style="width:${share.toFixed(1)}%"></div></div></div>`;
    }).join('');
  }

  function renderDevices(stations,network){
    const counts=new Map(stations.map(x=>[x.name,x]));
    const net=new Map(network.map(x=>[x.name,x]));
    const max=Math.max(1,...stations.map(x=>num(x.sessions)));
    $('deviceCards').innerHTML=STATIONS.map(station=>{
      const stats=counts.get(station)||{},n=net.get(station)||{};
      const latency=n.latencyMs==null?'—':`${fmt(n.latencyMs,{maximumFractionDigits:1})} ms`;
      const peak=n.touchPeak==null?'Não testado':`${fmt(n.touchPeak)} dedos`;
      const pct=(num(stats.sessions)*100/max).toFixed(1);
      return `<article class="device-card"><div class="device-title"><span>${safe(station)}</span><span class="tv-icon">▣</span></div><strong>${fmt(stats.sessions)}</strong><span>sessões registradas</span><div class="device-swatch"><div style="width:${pct}%"></div></div><div class="device-details"><div class="device-line"><span>Latência HTTP média</span><b>${latency}</b></div><div class="device-line"><span>Multitoque máximo</span><b>${peak}</b></div><div class="device-line"><span>Duração média</span><b>${stats.minutes==null?'—':fmt(stats.minutes,{maximumFractionDigits:1})+' min'}</b></div></div></article>`;
    }).join('');
  }

  function renderNetwork(rows){
    const byStation=new Map(rows.map(x=>[x.name,x]));
    const measured=rows.filter(x=>x.latencyMs!=null);
    const max=Math.max(1,...measured.map(x=>num(x.latencyMs)));
    $('networkStationRows').innerHTML=STATIONS.map(station=>{
      const row=byStation.get(station)||{};
      const latency=row.latencyMs==null?null:num(row.latencyMs);
      const width=latency==null?0:Math.min(100,latency/max*100);
      return `<div class="network-row"><strong>${safe(station)}</strong><div class="network-track"><div style="width:${width.toFixed(1)}%"></div></div><span>${latency==null?'Sem amostra':fmt(latency,{maximumFractionDigits:1})+' ms'}</span></div>`;
    }).join('');
  }

  function csvCell(value){
    let s = str(value);
    if(/^[=+\-@\t\r]/.test(s))s=`'${s}`;
    return `"${s.replace(/"/g,'""')}"`;
  }
  function exportCsv(){
    if(!report)return;
    const rows=[['TV TOUCH AGV','Indicadores agregados'],['Modo',mode==='demo'?'DEMONSTRAÇÃO FICTÍCIA':'SUPABASE'],['Período em dias',report.days],['TV',report.stationFilter||'Todas'],[],['RESUMO','Valor']];
    Object.entries(report.summary||{}).forEach(([name,value])=>rows.push([name,value]));
    rows.push([],['USO POR DIA','Sessões']);
    asArray(report.daily).forEach(x=>rows.push([x.date,x.sessions]));
    rows.push([],['DISCIPLINA','Área','Sessões']);
    asArray(report.disciplines).forEach(x=>rows.push([x.name,AREAS[x.area]||x.area,x.sessions]));
    rows.push([],['FERRAMENTA','Aberturas','Sessões distintas']);
    asArray(report.tools).forEach(x=>rows.push([TOOL_NAMES[x.name]||x.name,x.opens,x.uniqueSessions]));
    rows.push([],['TV','Sessões','Minutos médios']);
    asArray(report.stations).forEach(x=>rows.push([x.name,x.sessions,x.minutes]));
    rows.push([],['TV','Latência HTTP (ms)','Tentativas','Falhas','FPS','Toques']);
    asArray(report.network).forEach(x=>rows.push([x.name,x.latencyMs,x.attempts,x.failures,x.fps,x.touchPeak]));
    const csv='\ufeff'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`tv-touch-indicadores-${report.days}d${mode==='demo'?'-demonstracao':''}.csv`;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function demoReport(days,station){
    const now=new Date();
    const chosen=station?[station]:STATIONS;
    const totals=Object.fromEntries(chosen.map(s=>[s,0]));
    const daily=[];
    for(let i=days-1;i>=0;i--){
      const date=new Date(now.getFullYear(),now.getMonth(),now.getDate()-i);
      const dayKey=keyDate(date);let total=0;
      chosen.forEach((s,idx)=>{
        const seed=(i*7 + STATIONS.indexOf(s)*11 + date.getDay()*3);
        const n=(date.getDay()===0||date.getDay()===6)?(seed%2):(2+seed%7);
        totals[s]+=n;total+=n;
      });
      daily.push({date:dayKey,sessions:total});
    }
    const sessions=Object.values(totals).reduce((a,b)=>a+b,0);
    const stations=chosen.map((name,i)=>({name,sessions:totals[name],minutes:29+(i*7)}));
    const subjects=[['Matemática','comum',.23],['Operações Portuárias','tecnica',.21],['Programação Front-End','tecnica',.16],['Geografia','comum',.13],['História','comum',.11],['Projeto Integrador','interdisciplinar',.09],['Física','comum',.07]];
    const disciplines=subjects.map(([name,area,part])=>({name,area,sessions:Math.round(sessions*part)}));
    const areas=['comum','tecnica','interdisciplinar'].map(name=>({name,sessions:disciplines.filter(d=>d.area===name).reduce((v,d)=>v+d.sessions,0)}));
    const usage=[['earth','resource_open',.35],['solidos','tool_open',.31],['geogebra','resource_open',.22],['desenho','tool_open',.19],['porto360','resource_open',.14],['encaixe','tool_open',.12],['phet','resource_open',.08]];
    const tools=usage.map(([name,event,v])=>({name,event,opens:Math.round(sessions*v),uniqueSessions:Math.round(sessions*v*.65)}));
    const network=chosen.map(name=>{
      const i=STATIONS.indexOf(name);
      return {name,latencyMs:Math.round((68+i*39)*10)/10,attempts:totals[name]*3,failures:Math.round(totals[name]*(i+1)/24),fps:Math.round(58-i*3),touchPeak:10-i*2};
    });
    const attempts=network.reduce((n,x)=>n+x.attempts,0),failures=network.reduce((n,x)=>n+x.failures,0);
    const weighted=attempts?network.reduce((n,x)=>n+x.latencyMs*x.attempts,0)/attempts:null;
    return {days,stationFilter:station,generatedAt:new Date().toISOString(),summary:{sessions,activePanels:chosen.length,averageMinutes:36.4,toolOpens:tools.reduce((n,x)=>n+x.opens,0),httpLatencyMs:weighted, httpAttempts:attempts,httpFailures:failures, averageFps:network.reduce((n,x)=>n+x.fps,0)/network.length,touchPeak:Math.max(...network.map(x=>x.touchPeak))},daily,stations,disciplines,areas,tools,network};
  }

  async function logout(){
    if(mode==='live'&&client) await client.auth.signOut().catch(()=>{});
    displayLogin();
    setMessage(configured?'Entre com sua conta administrativa.':'Configure a conexão Supabase para ativar o login.');
  }

  $('loginForm').addEventListener('submit',signIn);
  $('demoButton').addEventListener('click',()=>{mode='demo';displayDashboard();refresh();});
  $('leaveDemo').addEventListener('click',logout);
  $('signoutButton').addEventListener('click',logout);
  $('refreshButton').addEventListener('click',refresh);
  $('periodFilter').addEventListener('change',refresh);
  $('stationFilter').addEventListener('change',refresh);
  $('exportButton').addEventListener('click',exportCsv);
  if(!configured)setMessage('Conexão ainda não configurada. A demonstração funciona offline; a visualização real requer Supabase.',false);
  else setMessage('Entre com sua conta administrativa. A sessão não é armazenada neste dispositivo.');
})();
