/* TV TOUCH — Piano multitoque | experiência isolada, sem contas ou bibliotecas. */
const NOTE_NAMES=['Dó','Dó♯','Ré','Ré♯','Mi','Fá','Fá♯','Sol','Sol♯','Lá','Lá♯','Si'];
const WHITE_STEPS=new Set([0,2,4,5,7,9,11]);
const MISSIONS=[
  {notes:[60,64,67],name:'Dó + Mi + Sol',hint:'Toque as três notas ao mesmo tempo para formar Dó maior.'},
  {notes:[62,65,69],name:'Ré + Fá + Lá',hint:'Agora forme Ré menor. Compare o som com o acorde anterior.'},
  {notes:[60,65,69],name:'Dó + Fá + Lá',hint:'Encontre uma nova combinação. Escute como o acorde muda.'}
];
const frequency=midi=>440*Math.pow(2,(midi-69)/12);
const label=midi=>NOTE_NAMES[midi%12]+' '+(Math.floor(midi/12)-1);

export function mount({root,signal,emit=()=>{}}){
  let ctx=null, muted=false, volume=.30, timbre='soft', missionIndex=0, done=new Set();
  const voices=new Map(), keys=new Map(), contacts=new Map();
  let destroyed=false, audioFailed=false;
  const whiteKeys=[],blackKeys=[];
  let whiteIndex=0;
  for(let midi=60;midi<=83;midi++){
    const step=midi%12,isWhite=WHITE_STEPS.has(step);
    const name=label(midi);
    if(isWhite){
      whiteKeys.push('<button type="button" class="piano-key piano-white" data-midi="'+midi+'" aria-label="Tocar '+name+'" aria-pressed="false"><span>'+NOTE_NAMES[step]+'</span><small>'+(midi===60?'C4':midi===72?'C5':'')+'</small></button>');
      whiteIndex++;
    } else {
      blackKeys.push('<button type="button" class="piano-key piano-black" data-midi="'+midi+'" aria-label="Tocar '+name+'" aria-pressed="false" style="left:'+((whiteIndex/14)*100).toFixed(4)+'%"><span>'+NOTE_NAMES[step]+'</span></button>');
    }
  }
  root.innerHTML='<div class="piano-layout">'+
    '<section class="piano-instrument" aria-label="Instrumento musical interativo">'+
      '<div class="piano-bar"><div class="piano-mark"><span class="piano-led" id="pianoLed"></span><span>PIANO TOUCH / 24 NOTAS</span></div><div class="piano-now">Nota: <strong id="pianoNow">—</strong></div></div>'+
      '<div class="piano-keys" id="pianoKeys" role="group" aria-label="Teclado musical de duas oitavas; toque em várias notas para fazer um acorde">'+
        '<div class="piano-white-row">'+whiteKeys.join('')+'</div>'+blackKeys.join('')+
      '</div>'+
      '<div class="piano-footer"><span><strong>1 dedo</strong> toca uma nota</span><span><strong>2 ou mais</strong> fazem acordes</span><span><strong>A–J</strong> também funcionam no teclado físico</span></div>'+
    '</section>'+
    '<aside class="piano-panel" aria-label="Controles e desafio do piano">'+
      '<div class="piano-section"><h2>Som</h2><div class="piano-timbres" role="group" aria-label="Selecionar timbre">'+
        '<button type="button" data-timbre="soft" aria-pressed="true">Suave</button><button type="button" data-timbre="bright" aria-pressed="false">Vibrante</button><button type="button" data-timbre="glass" aria-pressed="false">Cristal</button>'+
      '</div><label class="piano-volume">Volume <output id="pianoVolumeValue">30%</output><input type="range" id="pianoVolume" min="0" max="75" value="30" step="5"></label>'+
      '<button type="button" id="pianoMute" class="piano-subbutton" aria-pressed="false">Silenciar</button><p id="pianoAudioStatus" class="piano-audio-status" role="status" aria-live="polite">O som começa após o primeiro toque.</p></div>'+
      '<div class="piano-section piano-challenge"><div class="piano-label">DESAFIO DE ACORDES</div><h2 id="pianoGoalName">Dó + Mi + Sol</h2>'+
      '<p id="pianoGoalHint">Toque as três notas ao mesmo tempo.</p><div class="piano-goal-list" id="pianoGoalList"></div>'+
      '<p class="piano-feedback" id="pianoFeedback" role="status" aria-live="polite">0 de 3 acordes completados</p>'+
      '<div class="piano-actions"><button type="button" id="pianoGoalNext" class="piano-next">Próximo acorde</button><button type="button" id="pianoGoalReset" class="piano-subbutton">Reiniciar</button></div></div>'+
    '</aside></div>';
  const get=id=>root.querySelector('#'+id),stage=get('pianoKeys');
  const allKeys=[...root.querySelectorAll('[data-midi]')];
  for(const el of allKeys)keys.set(Number(el.dataset.midi),el);
  const status=get('pianoAudioStatus'),feedback=get('pianoFeedback');
  const readActive=()=>[...contacts.values()];
  const activePitches=()=>new Set(readActive().map(x=>x.midi));
  function updateVisual(midi){
    const el=keys.get(midi);if(!el)return;
    const on=readActive().some(v=>v.midi===midi);
    el.classList.toggle('playing',on);el.setAttribute('aria-pressed',String(on));
    get('pianoLed').classList.toggle('active',contacts.size>0);
    get('pianoNow').textContent=contacts.size?label(readActive().at(-1).midi):'—';
  }
  function renderMission(){
    const m=MISSIONS[missionIndex];
    get('pianoGoalName').textContent=m.name;
    get('pianoGoalHint').textContent=m.hint;
    get('pianoGoalList').innerHTML=m.notes.map(note=>'<span>'+label(note)+'</span>').join('');
    get('pianoGoalNext').textContent=missionIndex===MISSIONS.length-1?'Primeiro acorde':'Próximo acorde';
    feedback.textContent=done.size+' de '+MISSIONS.length+' acordes completados';
  }
  function checkMission(){
    const goal=MISSIONS[missionIndex];
    if(done.has(missionIndex))return;
    const pitches=activePitches();
    if(goal.notes.every(n=>pitches.has(n))){
      done.add(missionIndex);
      feedback.textContent='Acorde completo! '+done.size+' de '+MISSIONS.length+' concluídos.';
      feedback.classList.add('success');
      emit('mission:complete',{id:'piano-touch',mission:missionIndex+1,total:MISSIONS.length});
    }
  }
  function audioContext(){
    if(ctx||audioFailed||muted||destroyed)return ctx;
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC){audioFailed=true;status.textContent='Áudio indisponível. Use as teclas no modo visual.';return null;}
    try{
      ctx=new AC();
      status.textContent='Áudio ativado. Toque em mais de uma tecla para fazer acordes.';
    }catch{
      audioFailed=true;status.textContent='O navegador bloqueou o áudio. O jogo visual continua disponível.';
    }
    return ctx;
  }
  function startSound(id,midi){
    if(muted||volume<=0)return;
    const ac=audioContext();if(!ac)return;
    try{
      if(ac.state==='suspended')ac.resume().catch(()=>{status.textContent='Toque novamente para liberar o áudio.';});
      const now=ac.currentTime,base=ac.createOscillator(),amp=ac.createGain();
      base.type=timbre==='glass'?'sine':timbre==='bright'?'sawtooth':'triangle';
      base.frequency.setValueAtTime(frequency(midi),now);
      amp.gain.setValueAtTime(0.0001,now);
      amp.gain.exponentialRampToValueAtTime(Math.max(.0002,volume*(timbre==='bright'?.33:.47)),now+.035);
      const sustain=timbre==='glass'?.22:timbre==='bright'?.28:.32;
      amp.gain.setTargetAtTime(Math.max(.0002,volume*sustain),now+.045,.11);
      base.connect(amp);amp.connect(ac.destination);base.start(now);
      voices.set(id,{osc:base,gain:amp});
    }catch{
      audioFailed=true;status.textContent='O som falhou; o teclado visual continua funcionando.';
    }
  }
  function stopSound(id){
    const voice=voices.get(id);if(!voice)return;
    voices.delete(id);
    try{
      const now=ctx.currentTime;
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setTargetAtTime(.0001,now,.045);
      voice.osc.stop(now+.2);
      voice.osc.onended=()=>{try{voice.osc.disconnect();voice.gain.disconnect();}catch{}};
    }catch{
      try{voice.osc.stop();voice.osc.disconnect();voice.gain.disconnect();}catch{}
    }
  }
  function startContact(id,midi){
    if(destroyed||!keys.has(midi))return;
    if(contacts.get(id)?.midi===midi)return;
    stopContact(id);
    contacts.set(id,{midi});
    updateVisual(midi);
    startSound(id,midi);
    checkMission();
  }
  function stopContact(id){
    const contact=contacts.get(id);if(!contact)return;
    contacts.delete(id);stopSound(id);updateVisual(contact.midi);
  }
  function releaseAll(){
    for(const id of [...contacts.keys()])stopContact(id);
    for(const id of [...voices.keys()])stopSound(id);
  }
  function keyAt(x,y){const hit=document.elementFromPoint?.(x,y);const el=hit?.closest?.('[data-midi]');return el&&stage.contains(el)?Number(el.dataset.midi):null;}
  function pointerDown(e){
    const key=e.target.closest?.('[data-midi]');
    if(!key||(e.pointerType==='mouse'&&e.button!==0))return;
    e.preventDefault();
    const id='ptr:'+e.pointerId;
    try{stage.setPointerCapture(e.pointerId);}catch{}
    startContact(id,Number(key.dataset.midi));
  }
  function pointerMove(e){
    const id='ptr:'+e.pointerId;if(!contacts.has(id))return;
    e.preventDefault();
    const midi=keyAt(e.clientX,e.clientY);
    if(midi===null)stopContact(id);
    else startContact(id,midi);
  }
  function pointerEnd(e){stopContact('ptr:'+e.pointerId);try{if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);}catch{}}
  const keyMap={a:60,w:61,s:62,e:63,d:64,f:65,t:66,g:67,y:68,h:69,u:70,j:71,k:72};
  function keyDown(e){
    if(e.ctrlKey||e.altKey||e.metaKey||['INPUT','SELECT','TEXTAREA'].includes(e.target?.tagName))return;
    const midi=keyMap[e.key?.toLowerCase()];if(midi===undefined)return;
    e.preventDefault();if(!e.repeat)startContact('kbd:'+e.code,midi);
  }
  function keyUp(e){stopContact('kbd:'+e.code);}
  function blur(){releaseAll();}
  function visibility(){if(document.hidden)releaseAll();}
  stage.addEventListener('pointerdown',pointerDown,{signal});
  stage.addEventListener('pointermove',pointerMove,{signal});
  stage.addEventListener('pointerup',pointerEnd,{signal});
  stage.addEventListener('pointercancel',pointerEnd,{signal});
  stage.addEventListener('lostpointercapture',pointerEnd,{signal});
  window.addEventListener('keydown',keyDown,{signal});
  window.addEventListener('keyup',keyUp,{signal});
  window.addEventListener('blur',blur,{signal});
  document.addEventListener('visibilitychange',visibility,{signal});
  root.querySelectorAll('[data-timbre]').forEach(el=>el.addEventListener('click',()=>{
    timbre=el.dataset.timbre;
    root.querySelectorAll('[data-timbre]').forEach(button=>button.setAttribute('aria-pressed',String(button===el)));
  },{signal}));
  get('pianoVolume').addEventListener('input',e=>{
    volume=Number(e.target.value)/100;
    get('pianoVolumeValue').textContent=e.target.value+'%';
    if(volume===0)releaseAll();
  },{signal});
  get('pianoMute').addEventListener('click',e=>{
    muted=!muted;releaseAll();e.currentTarget.setAttribute('aria-pressed',String(muted));
    e.currentTarget.textContent=muted?'Ativar som':'Silenciar';
    status.textContent=muted?'Modo silencioso: teclas e desafios continuam ativos.':'Som liberado no próximo toque.';
  },{signal});
  get('pianoGoalNext').addEventListener('click',()=>{
    missionIndex=(missionIndex+1)%MISSIONS.length;feedback.classList.remove('success');renderMission();
  },{signal});
  get('pianoGoalReset').addEventListener('click',()=>{
    done=new Set();missionIndex=0;feedback.classList.remove('success');releaseAll();renderMission();
  },{signal});
  renderMission();
  function unmount(){
    if(destroyed)return;destroyed=true;releaseAll();
    for(const {osc,gain} of voices.values()){try{osc.stop();osc.disconnect();gain.disconnect();}catch{}}
    voices.clear();contacts.clear();
    if(ctx){try{ctx.close().catch(()=>{});}catch{}ctx=null;}
    root.replaceChildren();
  }
  signal?.addEventListener('abort',unmount,{once:true});
  return {pause:releaseAll,resume:()=>{},unmount};
}
