'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=file=>fs.readFileSync(path.resolve(__dirname,'..',file),'utf8');

test('UX/UI Studio 3.0 em todos os três HTML de entrada',()=>{
  for(const file of ['public/index.html','public/arcade.html','public/admin.html']){
    const html=read(file);
    assert.match(html,/css\/agv-identity\.css\?v=2\.9\.0/);
    assert.match(html,/css\/agv-ux\.css\?v=3\.1\.0/);
    assert.match(html,/js\/site-synapses\.js\?v=3\.1\.0/);
    assert.match(html,/js\/platform-ux\.js\?v=3\.1\.0/);
    assert.match(html,/Desenvolvido por <strong>Gabriel Elienai<\/strong>/);
  }
});

test('Navegação contextual, busca global, teclado, contraste e toque',()=>{
  const script=read('public/js/platform-ux.js');
  const ux=read('public/css/agv-ux.css');
  for(const s of ['O que deseja abrir?', 'Ctrl', 'agvExperienceBar','agvCommandDialog','agvCommandInput','agvContextBack','agvContextHome','agvContextFind','agvQuietMotion','aria-pressed','ArrowDown','ArrowUp','Escape'])
    assert.ok(script.includes(s)||((s==='Ctrl')&&script.includes('event.ctrlKey')),s);
  assert.match(script,/role='|aria-label/);
  assert.match(ux,/:focus-visible/);
  assert.match(ux,/@media\(pointer:coarse\)/);
  assert.match(ux,/@media\(max-width:700px\)/);
  assert.match(ux,/@media\(min-width:1900px\)/);
  assert.match(ux,/prefers-reduced-motion/);
  assert.match(ux,/\.agv-command-dialog::backdrop/);
});

test('Pesquisa encontra todas as áreas, jogos e módulos pedagógicos',()=>{
  const script=read('public/js/platform-ux.js');
  for(const id of ['inicio','biblioteca','videos','laboratorio','guia','favoritos','diagnostico','piano','cosmos','memoria','fisica','desenho','solidos','encaixe','porto','snake','pong','basket','pool','admin']){
    assert.ok(script.includes("id:'"+id+"'"),id);
  }
});

test('Rotas internas e links diretos para módulos e jogos',()=>{
  const app=read('public/js/app.js');
  const game=read('public/js/arcade.js');
  assert.match(app,/window\.TVTouchNavigation=Object\.freeze/);
  assert.match(app,/new URLSearchParams\(location\.search\)\.get\('tool'\)/);
  assert.match(game,/new URLSearchParams\(location\.search\)\.get\('game'\)/);
  assert.match(read('public/js/platform-ux.js'),/window\.TVTouchNavigation\.tool\(id\)/);
});

test('Estilos globais respeitam telas e preservam recursos',()=>{
  const css=read('public/css/agv-ux.css');
  for(const selector of ['.piano-instrument','.piano-section','#tool-solidos','#tool-desenho','.arcade-scene','.arcade-game','.metric-card','.control-group','.studio-experience','.resource-card','.lab-card','.agv-quiet-mode'])
    assert.ok(css.includes(selector),selector);
  assert.ok(!css.includes('.arcade-scene canvas{display:none}'));
  assert.match(css,/body\.studio-ui\[data-theme=light\] \.searchbox input/);
  assert.match(read('public/arcade.html'),/id="arcadeCanvas"/);
});

test('Modo reduzido interrompe desenho e persiste preferência',()=>{
  const site=read('public/js/site-synapses.js');
  const global=read('public/js/platform-ux.js');
  assert.match(site,/agv:motion-change/);
  assert.match(site,/window\.cancelAnimationFrame\(raf\)/);
  assert.match(site,/enabled=!\(reduced\(\)\|\|saving\(\)\|\|quiet\(\)\)/);
  assert.match(global,/localStorage\.setItem\(key/);
  assert.match(global,/agv:motion-change/);
});

test('Som ao clicar e motor Arcade 4K preservados',()=>{
  const intro=read('public/js/experience-intro.js');
  const arcade=read('public/js/arcade.js');
  assert.match(intro,/void addMusic\(\); beginCalibration\(\)/);
  assert.match(intro,/getByteFrequencyData/);
  assert.doesNotMatch(intro,/youtube\.com|<iframe/i);
  assert.match(arcade,/3840\*2160/);
  assert.match(arcade,/ctx\.setTransform\(width\/W/);
});

test('Assets offline e scripts compilam',()=>{
  const sw=read('public/service-worker.js');
  assert.match(sw,/tvtouch-studio-v3\.6\.0-tablet-materials/);
  for(const file of ['agv-ux.css','platform-ux.js','agv-synapse-crystal.svg','arcade.js'])
    assert.ok(sw.includes(file),file);
  for(const file of ['public/js/platform-ux.js','public/js/site-synapses.js','public/js/app.js','public/js/arcade.js','public/service-worker.js'])
    assert.doesNotThrow(()=>new vm.Script(read(file),{filename:file}));
});
