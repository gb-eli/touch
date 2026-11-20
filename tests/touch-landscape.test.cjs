const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('Studio 3.7: os tres ambientes carregam o mesmo controle de tela cheia',()=>{
  for(const page of ['public/index.html','public/oficina.html','public/arcade.html']){
    const html=read(page);
    assert.match(html,/touch-fullscreen\.js\?v=3\.7\.0/);
    assert.match(html,/touch-layout\.js\?v=3\.7\.0/);
    assert.match(html,/touch-vivid\.css\?v=3\.8\.0/);
    assert.match(html,/data-touch-fullscreen/);
  }
});

test('Tela cheia nativa cobre o documento e mantem saida visivel',()=>{
  const js=read('public/js/touch-fullscreen.js');
  assert.match(js,/root\.requestFullscreen/);
  assert.match(js,/document\.exitFullscreen/);
  assert.match(js,/agvFullscreenExit/);
  assert.match(js,/fullscreenchange/);
  assert.match(js,/aria-pressed/);
  assert.doesNotMatch(js,/location\.reload|style\.zoom/);
  assert.doesNotMatch(read('public/js/arcade.js'),/arcadeStage'\)\.requestFullscreen/);
  assert.doesNotMatch(read('public/js/oficina.js'),/stage\.requestFullscreen/);
});

test('Paisagem segue visualViewport, sem altura arbitraria 680px',()=>{
  const js=read('public/js/touch-layout.js');
  assert.match(js,/visualViewport/);
  assert.match(js,/agv-landscape-app/);
  assert.match(js,/--agv-live-vh/);
  assert.match(js,/--agv-touch-home-available-height/);
  const css=read('public/css/touch-vivid.css');
  assert.match(css,/orientation:landscape/);
  assert.match(css,/min-width:760px/);
  assert.match(css,/max-height:620px/);
  assert.match(css,/agv-live-vh/);
  assert.match(css,/agv-fullscreen-exit/);
  assert.match(css,/prefers-reduced-motion/);
});

test('Contraste da paleta e cache da interface permanecem locais',()=>{
  const css=read('public/css/touch-vivid.css');
  for(const color of ['#00e5ff','#986bff','#ff4ab8','#ffae24','#1cffb9'])
    assert.ok(css.includes(color),color+' preserva acento vibrante');
  assert.doesNotMatch(css,/https?:\/\//);
  const sw=read('public/service-worker.js');
  assert.match(sw,/tvtouch-studio-v3\.8\.0-landscape-gesture-qa/);
  assert.ok(sw.includes('./css/touch-vivid.css'));
  assert.ok(sw.includes('./js/touch-fullscreen.js'));
});

test('Studio 3.7.1: onboarding nao duplica Arcade e preserva reteste de toque',()=>{
  const js=read('public/js/experience-intro.js');
  assert.match(js,/shortcuts\.querySelector\('\.agv-arcade-shortcut/);
  assert.match(js,/shortcuts\.querySelector\('\[data-touch-replay\]'/);
  assert.match(js,/replay\.addEventListener\('click',open\)/);
  const css=read('public/css/touch-vivid.css');
  assert.match(css,/grid-template-columns:repeat\(8,minmax\(0,1fr\)\)/);
  assert.match(css,/min-height:clamp\(115px,36dvh,225px\)/);
  assert.match(css,/\.voxel-mini:not\(\[open\]\)/);
  assert.match(css,/\.voxel-access-grid:not\(\[open\]\)/);
});
