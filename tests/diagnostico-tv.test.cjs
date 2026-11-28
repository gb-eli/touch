'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const script=read('public/js/diagnostico.js');

const start=script.indexOf('  function touchGuidance(');
const end=script.indexOf('\n  function suggestions()',start);
assert.ok(start>=0&&end>start,'função de recomendação deve existir');
const guidance=vm.runInNewContext(script.slice(start,end)+'\n touchGuidance;',Object.create(null));
const pinchStart=script.indexOf('  function pinchDirection(');
const pinchEnd=script.indexOf('\n  function initTouchTest()',pinchStart);
assert.ok(pinchStart>0&&pinchEnd>pinchStart,'medição de pinça deve existir');
const pinchDirection=vm.runInNewContext(script.slice(pinchStart,pinchEnd)+'\n pinchDirection;',Object.create(null));

test('TV informa 1 toque, mas observa 16: diagnóstico prioriza medição real',()=>{
  const messages=guidance(1,16).join(' ');
  assert.match(messages,/16 contatos simultâneos observados/);
  assert.match(messages,/navegador informa 1/);
  assert.match(messages,/teste a pinça/i);
  assert.doesNotMatch(messages,/sem pinça|somente um toque: prefira/i);
});

test('Sem teste prático, navegador informa 1: não veta multitoque',()=>{
  const msg=guidance(1,null).join(' ');
  assert.match(msg,/pode subestimar/i);
  assert.match(msg,/Execute o teste/i);
  assert.doesNotMatch(msg,/sem pinça/i);
});

test('Tentativa negativa, parcial e multitoque reportado geram avisos adequados',()=>{
  assert.match(guidance(1,0)[0],/não registrou contatos/);
  assert.match(guidance(1,1)[0],/apenas 1 contato/);
  assert.match(guidance(10,2)[0],/2 contatos simultâneos observados/);
  assert.match(guidance(5,null)[0],/ainda não confirmados/);
});

test('Reprocessa o resumo e capacidades ao terminar o teste de 8 segundos',()=>{
  assert.match(script,/state\.touchPeak=peak;state\.pinchDirections=\[\.\.\.gestures\]\.sort\(\)/);
  assert.match(script,/renderOverview\(\);renderCapabilities\(\)/);
  assert.match(script,/Toques simultâneos \(informados\)/);
  assert.match(script,/Toques simultâneos \(testados\)/);
  assert.match(script,/Pinça \(teste prático\)/);
  assert.match(script,/pinchDirections:state\.pinchDirections/);
  assert.match(script,/state\.touchPeak>0/);
  assert.match(script,/maxTouchPointsReported:b\.touchPoints/);
  assert.match(script,/multitouchPeak:state\.touchPeak/);
});

test('1280x720 horizontal possui rolagem interna e espaço para dock',()=>{
  const css=read('public/css/diagnostico-tv.css');
  assert.match(css,/#page-diagnostico\.active\) main#conteudo/);
  assert.match(css,/overflow-y:auto!important/);
  assert.match(css,/padding-bottom:clamp\(110px,16dvh,178px\)/);
  assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  const html=read('public/index.html');
  assert.match(html,/css\/diagnostico-tv\.css\?v=3\.8\.0/);
  assert.match(html,/js\/diagnostico\.js\?v=3\.8\.0/);
  const sw=read('public/service-worker.js');
  assert.match(sw,/tvtouch-studio-v3\.8\.0-tech-news-v2/);
  assert.ok(sw.includes('./css/diagnostico-tv.css'));
});

test('pinça: reconhece afastar e aproximar sem depender de maxTouchPoints',()=>{
  assert.equal(pinchDirection(100,150),'afastar');
  assert.equal(pinchDirection(100,65),'aproximar');
  assert.equal(pinchDirection(100,113),null);
  assert.equal(pinchDirection(100,84),null);
  assert.equal(pinchDirection(0,55),null);
  assert.equal(pinchDirection(Number.NaN,150),null);
});

test('captura local de gesto nao grava coordenadas nem altera permissoes',()=>{
  assert.match(script,/zone\.addEventListener\('pointermove'/);
  assert.match(script,/positions\.size!==2/);
  assert.match(script,/e\.pointerType==='touch'/);
  assert.match(script,/state\.pinchDirections=null/);
  assert.match(script,/Pinça não observada nesta tentativa/);
  assert.doesNotMatch(script,/localStorage\.setItem\(['"]pinch/i);
  const css=read('public/css/diagnostico-tv.css');
  assert.match(css,/\.diag-touch-zone:not\(\[hidden\]\)/);
  assert.match(css,/touch-action:none/);
});
