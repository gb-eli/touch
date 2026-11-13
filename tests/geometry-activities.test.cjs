/* TV TOUCH / Studio 2.4 — testes nativos, sem dependências npm. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');

const geometrySource=fs.readFileSync(path.join(__dirname,'../public/js/geometry-lab.js'),'utf8');
const appSource=fs.readFileSync(path.join(__dirname,'../public/js/app.js'),'utf8');
class Context2D {
  beginPath(){} moveTo(){} lineTo(){} closePath(){} stroke(){} fill(){} save(){} restore(){}
  clip(){} fillRect(){} clearRect(){} ellipse(){} arc(){} setTransform(){} bezierCurveTo(){}
  createPattern(){return {id:'pattern'}}
  createRadialGradient(){return {addColorStop(){}}}
}
function geometryHarness(){
  const win={devicePixelRatio:2};
  const document={createElement(type){assert.equal(type,'canvas');return {getContext(){return new Context2D()}};}};
  new Function('window','document',geometrySource)(win,document);
  return win.TVTouchGeometry;
}
class Element {
  constructor(id,dataset={}){
    this.id=id;this.dataset=dataset;this.style={setProperty(){}};
    this.attrs={};this.textContent='';this.removed=false;this.handlers={};
    const classes=new Set();
    this.classList={add:x=>classes.add(x),remove:x=>classes.delete(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x),contains:x=>classes.has(x)};
  }
  addEventListener(event,callback){this.handlers[event]=callback}
  setAttribute(name,value){this.attrs[name]=String(value)}
  remove(){this.removed=true}
  setPointerCapture(id){this.lastCapture=id}
  closest(sel){return sel==='[data-piece]'&&this.dataset.piece?this:sel==='[data-slot]'&&this.dataset.slot?this:null}
}
function puzzleHarness(){
  const ids=['puzzleSlots','puzzlePieces','puzzleProgress','puzzleMistakes','puzzleMessage','puzzleLevelName','puzzleNext','puzzleHint','resetPuzzle'];
  const els=new Map(ids.map(id=>[id,new Element(id)])),pieces=new Map(),slots=new Map();
  const levels=[1,2,3].map(i=>new Element('level'+i,{puzzleLevel:String(i)}));
  const listeners=new Map(),events=[],ghosts=[];
  let pointerSlot=null;
  Object.defineProperty(els.get('puzzleSlots'),'innerHTML',{set(html){slots.clear();for(const m of html.matchAll(/data-slot="([^"]+)"/g))slots.set(m[1],new Element('slot'+m[1],{slot:m[1]}));}});
  Object.defineProperty(els.get('puzzlePieces'),'innerHTML',{set(html){pieces.clear();for(const m of html.matchAll(/data-piece="([^"]+)"/g))pieces.set(m[1],new Element('piece'+m[1],{piece:m[1]}));}});
  const $=selector=>selector[0]==='#'?els.get(selector.slice(1)):
    selector.startsWith('[data-slot')?slots.get(selector.match(/"([^"]+)"/)[1]):
    selector.startsWith('[data-piece')?pieces.get(selector.match(/"([^"]+)"/)[1]):null;
  const $$=selector=>selector==='[data-piece]'?[...pieces.values()]:selector==='[data-slot]'?[...slots.values()]:
    selector==='[data-puzzle-level]'?levels:[];
  const doc={
    addEventListener(type,fn){listeners.set('document:'+type,fn)},
    elementFromPoint(){return slots.get(pointerSlot)||null},
    createElement(){return new Element('ghost')},
    body:{appendChild(el){ghosts.push(el)}}
  };
  const win={TVTouchCalibration:{drag:()=>12},dispatchEvent(e){events.push(e.detail)},addEventListener(t,fn){listeners.set('window:'+t,fn)}};
  const start=appSource.indexOf('/* ENCAIXE:'),end=appSource.indexOf('/* QUIZ PORTUÁRIO:',start);
  assert.ok(start>=0&&end>start);
  const fragment=appSource.slice(start,end);
  const customEvent=function Event(type,options){this.detail=options.detail};
  const api=new Function('$','$$','window','document','CustomEvent','setTimeout','clearTimeout',
    fragment+';return {resetPuzzle,attemptMatch,initPuzzle,setLevel:v=>puzzleLevel=v,getWrong:()=>puzzleMistakes,isDone:()=>puzzleDone,getDragCount:()=>puzzleDrags.size}')( $, $$, win, doc, customEvent,()=>0,()=>{});
  return {api,els,levels,slots,pieces,listeners,events,ghosts,setPointerSlot:id=>{pointerSlot=id}};
}
test('malhas de cinco sólidos com índices válidos nos três níveis',()=>{
  const engine=geometryHarness();
  for(const type of ['cubo','prisma','piramide','cilindro','esfera'])
    for(const quality of ['eco','balanced','high']){
      const mesh=engine.geometry(type,quality);
      assert.ok(mesh.vertices.length>3&&mesh.faces.length>3);
      assert.ok(mesh.faces.every(f=>f.length>=3&&f.every(i=>Number.isInteger(i)&&i>=0&&i<mesh.vertices.length)));
    }
  assert.equal(engine.geometry('esfera','balanced').faces.length,286);
});
test('60 combinações de material/forma/qualidade respeitam orçamento de pixels',()=>{
  const engine=geometryHarness(),ctx=new Context2D();
  const canvas={width:0,height:0,getBoundingClientRect(){return {width:1920,height:1080}}};
  for(const type of ['cubo','prisma','piramide','cilindro','esfera'])
    for(const q of ['eco','balanced','high'])
      for(const mat of ['ceramic','steel','wood','stone']){
        const out=engine.render(ctx,canvas,{shape:type,quality:q,material:mat,rotX:.45,rotY:.7,zoom:1});
        assert.ok(out.visibleFaces>0);
        assert.ok(out.pixels<=engine.QUALITY[q].pixels*1.005);
      }
});
test('encaixe: níveis de 4, 6 e 8 peças, erros e conclusão única',()=>{
  const p=puzzleHarness();
  for(let i=1;i<=3;i++){
    p.api.setLevel(i);p.api.resetPuzzle();const total=[4,6,8][i-1],ids=[...p.slots.keys()];
    assert.equal(p.slots.size,total);assert.equal(p.pieces.size,total);
    assert.equal(p.api.attemptMatch(ids[1],ids[0]),false);
    assert.equal(p.api.getWrong(),1);
    for(const id of ids)assert.equal(p.api.attemptMatch(id,id),true);
    assert.equal(p.api.isDone(),true);assert.equal(p.api.attemptMatch(ids[0],ids[0]),false);
  }
  assert.equal(p.events.length,3);
  assert.deepEqual(p.events.map(e=>e.level),[1,2,3]);
});
test('encaixe: dois toques independentes arrastam duas peças sem deixar fantasmas',()=>{
  const p=puzzleHarness();p.api.initPuzzle();p.api.resetPuzzle();
  const ids=[...p.pieces.keys()];
  for(let i=0;i<2;i++){
    p.els.get('puzzlePieces').handlers.pointerdown({target:p.pieces.get(ids[i]),pointerId:i+1,clientX:15+i*90,clientY:15,button:0,pointerType:'touch'});
    p.listeners.get('document:pointermove')({pointerId:i+1,clientX:100+i*100,clientY:120,preventDefault(){}});
  }
  assert.equal(p.api.getDragCount(),2);
  for(let i=0;i<2;i++){
    p.setPointerSlot(ids[i]);
    p.listeners.get('document:pointerup')({pointerId:i+1,clientX:100+i*100,clientY:120});
  }
  assert.equal(p.api.getDragCount(),0);
  assert.equal(p.els.get('puzzleProgress').textContent,'2 / 4');
  assert.ok(p.ghosts.every(x=>x.removed));
});
