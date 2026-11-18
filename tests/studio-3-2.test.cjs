'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pages=['public/index.html','public/arcade.html','public/oficina.html','public/admin.html'];
test('Studio 3.2 aparece nas quatro portas e é carregado após as folhas legadas',()=>{
  for(const name of pages){
    const html=read(name);
    const link='css/agv-design-system.css?v=3.2.0';
    const feedback='js/agv-touch-feedback.js?v=3.2.0';
    assert.ok(html.includes(link),name+' missing design');
    assert.ok(html.includes(feedback),name+' missing feedback');
    assert.ok(html.lastIndexOf(link)>html.lastIndexOf('agv-ux.css'),name+' not final stylesheet');
    assert.match(html,/Desenvolvido por <strong>Gabriel Elienai<\/strong>/);
  }
  assert.match(read('public/index.html'),/AGV TOUCH \/ STUDIO 3\.2/);
});
test('Tokens usam alta saturação, contraste e estados com semântica preservada',()=>{
  const css=read('public/css/agv-design-system.css');
  for(const hex of ['#06050b','#ff6436','#70e8ff','#b16bfa','#fffaf9'])
    assert.ok(css.includes(hex),hex);
  for(const marker of ['.studio-tile','.resource-card','.lab-card','.discovery-card','.piano-section','.arcade-panel','.oficina-panel','.metric-card','.auth-card'])
    assert.ok(css.includes(marker),marker);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/pointer:coarse/);
  assert.match(css,/max-width:480px/);
  assert.match(css,/min-width:1900px/);
});
test('Contraste dos pares de texto principais permanece acima de 4.5:1',()=>{
  const luminance=hex=>{
    const ch=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
    return .2126*ch[0]+.7152*ch[1]+.0722*ch[2];
  };
  for(const [fg,bg] of [['#fffaf9','#171026'],['#fffaf9','#120d20'],['#210d16','#ff7042'],['#081627','#70e8ff']]){
    const a=luminance(fg),b=luminance(bg);
    const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    assert.ok(ratio>=4.5,fg+' on '+bg+' = '+ratio.toFixed(2));
  }
});
test('Toque reativo não requer login, respeita movimento reduzido e limita partículas',()=>{
  const js=read('public/js/agv-touch-feedback.js');
  assert.match(js,/addEventListener\('pointerdown',pulse,\{passive:true\}\)/);
  assert.match(js,/prefers-reduced-motion: reduce/);
  assert.match(js,/saveData/);
  assert.match(js,/agv-quiet-mode/);
  assert.match(js,/const LIMIT=7/);
  assert.match(js,/target\.appendChild\(point\)/);
  assert.match(js,/point\.remove\(\)/);
  assert.doesNotMatch(js,/fetch\(|localStorage|navigator\.geolocation/);
});
test('Arcade tem áudio próprio opcional ativado por clique, sem áudio de terceiros',()=>{
  const html=read('public/arcade.html');
  const js=read('public/js/arcade.js');
  assert.match(html,/id="arcadeSound" aria-pressed="false"/);
  assert.match(js,/\$\('arcadeSound'\)\?\.addEventListener\('click',toggleSound\)/);
  assert.match(js,/soundEnabled=false/);
  const engine=read('public/js/game-experience.js');
  assert.match(js,/gameExperience\?\.setSound/);
  assert.match(engine,/new AC\(\)/);
  assert.match(engine,/audio\.createOscillator\(\)/);
  assert.doesNotMatch(js,/youtube\.com|<iframe|Dolby|unfold/i);
});
test('Partículas do Arcade são limitadas e não retiram o suporte 4K',()=>{
  const js=read('public/js/arcade.js');
  assert.match(js,/MAX_PIXELS=3840\*2160/);
  assert.match(js,/sparks\.length<66/);
  assert.match(js,/Math\.min\(22,amount\)/);
  assert.match(js,/function paintSparks\(\)/);
  assert.match(js,/if\(playing\|\|sparks\.length\)schedule\(\)/);
  assert.match(js,/navigator\.connection\?\.saveData/);
});
test('Jogo da velha e damas animam apenas a jogada recente',()=>{
  const js=read('public/js/oficina.js'),css=read('public/css/agv-design-system.css');
  assert.match(js,/lastMove:-1/);assert.match(js,/lastMoved:-1/);
  assert.match(js,/agv32-last-mark/);assert.match(js,/just-moved/);
  assert.match(css,/\.oficina-grid3 button\.agv32-last-mark/);
  assert.match(css,/\.oficina-dama \.piece\.just-moved/);
});
test('Cache do PWA atualiza sem incluir controle administrativo no pré-cache',()=>{
  const sw=read('public/service-worker.js');
  assert.match(sw,/tvtouch-studio-v3\.7\.1-canvas-landscape/);
  for(const asset of ['agv-design-system.css','agv-touch-feedback.js','arcade.js','oficina.js'])
    assert.ok(sw.includes(asset));
  assert.doesNotMatch(sw,/"\.\/admin\.html"/);
});
test('Arquivos JavaScript e CSS possuem sintaxe estrutural válida',()=>{
  for(const file of ['public/js/arcade.js','public/js/oficina.js','public/js/agv-touch-feedback.js','public/service-worker.js'])
    assert.doesNotThrow(()=>new vm.Script(read(file),{filename:file}));
  const css=read('public/css/agv-design-system.css');
  const stripped=css.replace(/\/\*[\s\S]*?\*\//g,'').replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,'');
  let depth=0,min=0;
  for(const c of stripped){if(c==='{')depth++;if(c==='}')depth--;min=Math.min(min,depth)}
  assert.equal(depth,0);assert.equal(min,0);
});
