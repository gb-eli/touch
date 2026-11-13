/* TV TOUCH | Piano multitoque — teste com Node nativo, sem bibliotecas. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const source=fs.readFileSync(path.join(__dirname,'../public/experiences/piano/index.js'),'utf8')
  .replace('export function mount','function mount');
class FakeElement {
  constructor(id,dataset={}){
    this.id=id;this.dataset=dataset;this.handlers={};this.attributes={};this.textContent='';this.innerHTML='';this.style={};
    const state=new Set();
    this.classList={add:k=>state.add(k),remove:k=>state.delete(k),toggle:(k,on)=>on?state.add(k):state.delete(k),contains:k=>state.has(k)};
  }
  addEventListener(kind,callback){this.handlers[kind]=callback}
  setAttribute(key,value){this.attributes[key]=String(value)}
  closest(selector){return selector==='[data-midi]'&&this.dataset.midi?this:null}
  setPointerCapture(id){this.pointerId=id}
  hasPointerCapture(id){return this.pointerId===id}
  releasePointerCapture(id){if(this.pointerId===id)this.pointerId=null}
}
function setup({audio=true}={}){
  const ids=['pianoKeys','pianoLed','pianoNow','pianoVolume','pianoVolumeValue','pianoMute','pianoAudioStatus','pianoGoalName','pianoGoalHint','pianoGoalList','pianoFeedback','pianoGoalNext','pianoGoalReset'];
  const els=new Map(ids.map(id=>[id,new FakeElement(id)])),keys=new Map();
  const listeners=new Map(),emissions=[],stats={starts:0,stops:0,closed:0};
  let markup='';
  const root={
    get innerHTML(){return markup},
    set innerHTML(html){markup=html;for(const match of html.matchAll(/data-midi="(\d+)"/g)){keys.set(Number(match[1]),new FakeElement('note'+match[1],{midi:match[1]}));}},
    querySelector(sel){return sel[0]==='#'?els.get(sel.slice(1)):null},
    querySelectorAll(sel){
      if(sel==='[data-midi]')return [...keys.values()];
      if(sel==='[data-timbre]')return ['soft','bright','glass'].map(t=>new FakeElement(t,{timbre:t}));
      return [];
    },
    replaceChildren(){markup=''}
  };
  class Audio {
    constructor(){this.currentTime=0;this.state='running';this.destination={}}
    createOscillator(){return {frequency:{setValueAtTime(){}},connect(){},start(){stats.starts++},stop(){stats.stops++},disconnect(){}}}
    createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){},cancelScheduledValues(){}},connect(){},disconnect(){}}}
    resume(){return Promise.resolve()}
    close(){stats.closed++;return Promise.resolve()}
  }
  const win={...(audio?{AudioContext:Audio}:{}),addEventListener(k,fn){listeners.set('window:'+k,fn)}};
  const doc={hidden:false,addEventListener(k,fn){listeners.set('document:'+k,fn)},elementFromPoint(){return null}};
  const mount=new Function('window','document',source+';return mount')(win,doc);
  const instance=mount({root,signal:{addEventListener(){}},emit:(type,detail)=>emissions.push({type,...detail})});
  const down=(midi,id=midi)=>els.get('pianoKeys').handlers.pointerdown({target:keys.get(midi),pointerType:'touch',pointerId:id,button:0,preventDefault(){}});
  const up=(id)=>els.get('pianoKeys').handlers.pointerup({pointerId:id});
  const click=id=>els.get(id).handlers.click({currentTarget:els.get(id)});
  return {root,keys,els,down,up,click,doc,listeners,emissions,stats,instance};
}
test('24 notas, acorde simultâneo, soltar dedos e encerrar áudio',()=>{
  const p=setup();
  assert.equal(p.keys.size,24);
  [60,64,67].forEach(x=>p.down(x));
  assert.equal(p.stats.starts,3);
  assert.deepEqual(p.emissions.map(x=>x.type),['mission:complete']);
  assert.match(p.els.get('pianoFeedback').textContent,/1 de 3/);
  [60,64,67].forEach(x=>p.up(x));
  assert.equal(p.stats.stops,3);
  p.instance.unmount();
  assert.equal(p.stats.closed,1);
  assert.equal(p.root.innerHTML,'');
});
test('modo silencioso não dispara vozes e aba oculta encerra sons',()=>{
  const p=setup();
  p.click('pianoMute');
  p.down(62);assert.equal(p.stats.starts,0);p.up(62);
  p.click('pianoMute');
  p.down(62);assert.equal(p.stats.starts,1);
  p.doc.hidden=true;p.listeners.get('document:visibilitychange')();
  assert.equal(p.stats.stops,1);
  p.instance.unmount();
  assert.equal(p.stats.closed,1);
});
test('sem Web Audio: tecla e missão continuam visuais',()=>{
  const p=setup({audio:false});
  [60,64,67].forEach(x=>p.down(x));
  assert.equal(p.stats.starts,0);
  assert.equal(p.emissions.length,1);
  assert.match(p.els.get('pianoAudioStatus').textContent,/indisponível/);
  p.instance.unmount();
});
