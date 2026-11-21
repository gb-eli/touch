/* Gestão remota: requer sessão autenticada + autorização RLS no Supabase. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const info=$('controlStatus');
  const allowedStations=['TV TOUCH 01','TV TOUCH 02','TV TOUCH 03'];
  let profileRows=[];
  let busy=false;
  const status=(msg,err=false)=>{info.textContent=msg;info.classList.toggle('error',err)};
  const client=()=>window.TVTouchAdmin?.getClient();
  const setDemo=()=>{
    const live=Boolean(client());
    $('calibrationForm').querySelectorAll('select,input,button').forEach(el=>el.disabled=!live);
    $('featureToggles').querySelectorAll('input').forEach(el=>el.disabled=!live);
    if(!live)status(window.TVTouchAdmin?.isDemo()?'Modo demonstração: alterações desabilitadas.':'Entre como administrador para editar as configurações.');
    return live;
  };
  const val=(x)=>Number(x).toFixed(2)+'×';
  function updateLabels(){ $('rotationOut').textContent=val($('rotationSensitivity').value);$('brushOut').textContent=val($('brushSensitivity').value);$('dragOut').textContent=$('dragThreshold').value+' px'; }
  function chooseStation(){
    const s=$('profileStation').value;const item=profileRows.find(x=>x.station===s)||{rotation_sensitivity:1,brush_sensitivity:1,drag_threshold_px:12};
    $('rotationSensitivity').value=item.rotation_sensitivity;
    $('brushSensitivity').value=item.brush_sensitivity;
    $('dragThreshold').value=item.drag_threshold_px;
    updateLabels();
  }
  async function load(){
    if(!setDemo()){$('featureToggles').replaceChildren();return;}
    status('Consultando configuração do Supabase...');
    try{
      const db=client();
      const [fs,pr]=await Promise.all([
        db.from('tvt_features').select('id,label,category,enabled').order('category').order('label'),
        db.from('tvt_device_profiles').select('station,rotation_sensitivity,brush_sensitivity,drag_threshold_px')
      ]);
      if(fs.error)throw fs.error;if(pr.error)throw pr.error;
      profileRows=pr.data||[];
      $('featureToggles').replaceChildren();
      for(const item of fs.data||[]){
        const label=document.createElement('label');label.className='feature-line';
        const copy=document.createElement('span');copy.textContent=item.label;
        const meta=document.createElement('small');meta.textContent=item.category;
        const inner=document.createElement('span');inner.className='feature-meta';inner.append(copy,meta);
        const input=document.createElement('input');input.type='checkbox';input.checked=item.enabled;
        input.setAttribute('aria-label',`Habilitar ${item.label}`);
        input.addEventListener('change',async()=>{
          if(busy)return;busy=true;input.disabled=true;const desired=input.checked;
          const {error}=await db.from('tvt_features').update({enabled:desired,updated_at:new Date().toISOString()}).eq('id',item.id);
          if(error){input.checked=!desired;status(`Falha ao atualizar ${item.label}: ${error.message}`,true);}else status(`${item.label}: ${desired?'liberado':'bloqueado'}. As TVs aplicam a alteração na próxima sincronização.`);
          busy=false;input.disabled=false;
        });
        label.append(inner,input);$('featureToggles').append(label);
      }
      chooseStation();status(`${fs.data?.length||0} controles carregados. A configuração é aplicada de forma remota.`);
    }catch(error){status(`Falha ao carregar controles: ${error.message||'sem resposta'}`,true);}
  }
  async function save(e){
    e.preventDefault(); if(!setDemo()||busy)return;
    const station=$('profileStation').value;
    if(!allowedStations.includes(station))return;
    const payload={rotation_sensitivity:Number($('rotationSensitivity').value),brush_sensitivity:Number($('brushSensitivity').value),drag_threshold_px:Number($('dragThreshold').value),updated_at:new Date().toISOString()};
    busy=true;$('saveCalibration').disabled=true;
    const {data,error}=await client().from('tvt_device_profiles').update(payload).eq('station',station).select('station,rotation_sensitivity,brush_sensitivity,drag_threshold_px').single();
    if(error)status(`Não foi possível salvar: ${error.message}`,true);
    else{profileRows=profileRows.filter(r=>r.station!==station).concat(data);status(`Perfil ${station} salvo. Teste a resposta de toque diretamente no equipamento.`);}
    busy=false;$('saveCalibration').disabled=false;
  }
  $('profileStation').addEventListener('change',chooseStation);
  ['rotationSensitivity','dragThreshold','brushSensitivity'].forEach(id=>$(id).addEventListener('input',updateLabels));
  $('calibrationForm').addEventListener('submit',save);
  window.addEventListener('tvt:admin-state',load);
  updateLabels();setDemo();
})();
