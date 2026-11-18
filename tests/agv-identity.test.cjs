'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pages=['index.html','arcade.html','admin.html'];
test('Identidade e crédito permanente nas três entradas',()=>{
 for(const page of pages){
  const html=read('public/'+page);
  assert.match(html,/css\/agv-identity\.css\?v=2\.9\.0/);
  assert.match(html,/js\/site-synapses\.js\?v=3\.1\.0/);
  assert.match(html,/class="agv-dev-credit"/);
  assert.match(html,/Desenvolvido por <strong>Gabriel Elienai<\/strong>/);
 }
});
test('Marca AGV TOUCH e qualidade Arcade preservadas',()=>{
 assert.match(read('public/index.html'),/<h1 id="homeTitle">AGV <span>TOUCH\.<\/span>/);
 assert.match(read('public/arcade.html'),/js\/arcade\.js\?v=3\.4\.0/);
 assert.match(read('public/arcade.html'),/id="arcadeCanvas"/);
});
test('Som no botão Começar agora e ausência de vídeo',()=>{
 const code=read('public/js/experience-intro.js');
 assert.match(code,/'tvt:entry:v3'/);
 assert.match(code,/tvtEntryStart'\)\.addEventListener\('click',\(\)=>\{ void addMusic\(\); beginCalibration\(\); \}\)/);
 assert.doesNotMatch(code,/youtube\.com|<iframe/i);
 assert.match(code,/getByteFrequencyData/);
 assert.match(code,/createMediaElementSource/);
});
test('Calibração não fecha automaticamente',()=>{
 const code=read('public/js/experience-intro.js');
 assert.doesNotMatch(code,/setTimeout\(finishCalibration,5200\)/);
 assert.match(code,/tvtCalFinish/);
 assert.match(code,/tvtReplay/);
});
test('Arte vetorial, acessibilidade e fullscreen',()=>{
 const art=read('public/assets/agv-synapse-crystal.svg');
 assert.ok((art.match(/<polygon /g)||[]).length>=200);
 assert.match(art,/<clipPath/);
 const css=read('public/css/agv-identity.css');
 assert.match(css,/#agvCrystalBackdrop/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/pointer-events:none/);
 assert.match(css,/:fullscreen::after/);
});
test('Performance limitada, reduzida e pausa',()=>{
 const code=read('public/js/site-synapses.js');
 for(const term of ['2073600','visibilitychange','doc.hidden','.arcade-shell','navigator.connection?.saveData'])assert.ok(code.includes(term),term);
});
test('Cache offline inclui os novos ativos',()=>{
 const cache=read('public/service-worker.js');
 for(const asset of ['agv-identity.css','site-synapses.js','agv-synapse-crystal.svg'])assert.ok(cache.includes(asset),asset);
 assert.match(cache,/tvtouch-studio-v3\.6\.0-tablet-materials/);
});
test('JS alterado passa no parser',()=>{
 for(const file of ['public/js/site-synapses.js','public/js/experience-intro.js','public/service-worker.js']){
  assert.doesNotThrow(()=>new vm.Script(read(file),{filename:file}));
 }
});
