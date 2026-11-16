/* AGV TOUCH Studio 3.3 — motor local de respostas de jogo.
   Não utiliza rede, telemetria, dados pessoais ou áudio de terceiros. */
(() => {
  'use strict';
  if(window.AGVGameExperience)return;
  const EVENTS=Object.freeze(['start','pause','resume','reset','hit','correct','wrong','score','win','lose','draw','select','move']);
  const STATE_NEXT=Object.freeze({
    idle:Object.freeze({start:'playing',reset:'idle'}),
    playing:Object.freeze({pause:'paused',win:'completed',lose:'completed',draw:'completed',reset:'idle'}),
    paused:Object.freeze({resume:'playing',reset:'idle'}),
    completed:Object.freeze({start:'playing',reset:'idle'})
  });
  const NOTES=Object.freeze({
    start:[410,.13,'sine'],pause:[270,.09,'sine'],resume:[440,.12,'sine'],reset:[350,.10,'sine'],
    hit:[290,.07,'sine'],correct:[680,.16,'triangle'],wrong:[165,.15,'sawtooth'],
    score:[830,.14,'triangle'],win:[910,.28,'triangle'],lose:[200,.22,'sine'],
    draw:[420,.18,'triangle'],select:[390,.07,'sine'],move:[470,.09,'sine']
  });
  const windowsNow=()=>typeof performance!=='undefined'&&performance.now?performance.now():Date.now();
  const prefersQuiet=()=>Boolean(
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ||
    document.body?.classList?.contains('agv-quiet-mode') ||
    navigator.connection?.saveData ||
    document.visibilityState==='hidden'
  );
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  let soundEnabled=false,audio=null,lastSoundAt=-1000,activeFx=0;
  const MAX_ACTIVE=24,FINISH_MS=650;
  const sessions=new Set();

  async function setSound(allow){
    if(!allow){soundEnabled=false;return false;}
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC){soundEnabled=false;return false;}
    try{
      if(!audio||audio.state==='closed')audio=new AC();
      if(audio.state==='suspended')await audio.resume();
      soundEnabled=audio.state==='running';
      return soundEnabled;
    }catch{soundEnabled=false;return false}
  }
  function tone(hz=400,kind='sine',duration=.15){
    if(!soundEnabled||!audio||audio.state!=='running'||document.visibilityState==='hidden')return false;
    const t=windowsNow();
    if(t-lastSoundAt<65)return false;
    lastSoundAt=t;
    try{
      const freq=clamp(Number(hz)||400,80,1400);
      const length=clamp(Number(duration)||.15,.055,.38);
      const oscillator=audio.createOscillator(),gain=audio.createGain(),time=audio.currentTime;
      oscillator.type=['sine','triangle','square','sawtooth'].includes(kind)?kind:'sine';
      oscillator.frequency.setValueAtTime(freq,time);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(80,freq*.78),time+length);
      gain.gain.setValueAtTime(.0001,time);
      gain.gain.exponentialRampToValueAtTime(.032,time+.012);
      gain.gain.exponentialRampToValueAtTime(.0001,time+length);
      oscillator.connect(gain);gain.connect(audio.destination);
      oscillator.start(time);oscillator.stop(time+length+.02);
      return true;
    }catch{return false}
  }
  function play(event){
    const note=NOTES[event];return note?tone(note[0],note[2],note[1]):false;
  }
  function visualize(event,target){
    if(!target||prefersQuiet()||activeFx>=MAX_ACTIVE||!target.isConnected)return false;
    if(typeof target.appendChild!=='function')return false;
    const amount=['win','score','correct'].includes(event)?6:event==='wrong'?3:2;
    const remaining=Math.min(amount,MAX_ACTIVE-activeFx);
    if(!remaining)return false;
    target.classList.add('agv33-effect-root');
    for(let i=0;i<remaining;i++){
      const dot=document.createElement('span');
      dot.className='agv33-effect agv33-effect-'+event;
      dot.setAttribute('aria-hidden','true');
      dot.style.setProperty('--agv33-angle',((i/remaining)*360+Math.random()*16).toFixed(0)+'deg');
      dot.style.setProperty('--agv33-distance',(22+Math.random()*36).toFixed(0)+'px');
      dot.style.setProperty('--agv33-x',(35+Math.random()*30).toFixed(0)+'%');
      dot.style.setProperty('--agv33-y',(35+Math.random()*30).toFixed(0)+'%');
      activeFx++;
      let removed=false;
      const remove=()=>{
        if(removed)return;
        removed=true;activeFx=Math.max(0,activeFx-1);
        dot.remove();
      };
      dot.addEventListener('animationend',remove,{once:true});
      target.appendChild(dot);
      setTimeout(remove,FINISH_MS);
    }
    return true;
  }
  function emit(type,{target=null,visual=true,audio:withAudio=true}={}){
    if(!EVENTS.includes(type))return false;
    if(visual)visualize(type,target);
    if(withAudio)play(type);
    return true;
  }
  function createSession(id,{root=null}={}){
    if(typeof id!=='string'||!/^[a-z0-9-]{1,48}$/.test(id))
      throw new TypeError('Identificador de experiência inválido.');
    let state='idle',rounds=0,disposed=false;
    const session={
      get id(){return id;},
      get state(){return state;},
      get rounds(){return rounds;},
      transition(action){
        if(disposed)return false;
        const next=STATE_NEXT[state]?.[action];
        if(!next)return false;
        state=next;
        if(action==='start')rounds++;
        return true;
      },
      emit(type,options={}){
        if(disposed)return false;
        return emit(type,{target:root,...options});
      },
      dispose(){disposed=true;sessions.delete(session);}
    };
    sessions.add(session);
    return Object.freeze(session);
  }
  function stop(){
    soundEnabled=false;
    for(const session of [...sessions])session.dispose();
    if(audio){try{void audio.close()?.catch?.(()=>{})}catch{}audio=null}
  }
  window.addEventListener('pagehide',stop,{once:true});
  window.AGVGameExperience=Object.freeze({
    events:EVENTS,
    createSession,
    emit,
    tone,
    setSound,
    soundEnabled:()=>soundEnabled,
    prefersQuiet,
    stop
  });
})();
