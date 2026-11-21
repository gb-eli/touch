'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('public/index.html');
const css=read('public/css/studio-control-deck.css');
const js=read('public/js/studio-control-deck.js');
const sw=read('public/service-worker.js');

test('Studio 4.0 uses deliberately asymmetric cinematic stage (not old equal 3x2 cards)',()=>{
  assert.match(css,/grid-template-columns:minmax\(0,1\.34fr\) repeat\(2,minmax\(0,\.50fr\)\)/);
  assert.match(css,/grid-template-rows:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css,/\.studio-tiles>\.tile-cosmos\{\s*grid-column:1!important;grid-row:1\/4!important/);
  assert.match(css,/orbit-showcase\.svg/);
  assert.match(css,/\.deck-app-tile\{\s*grid-column:3!important;grid-row:3!important/);
  assert.ok(fs.existsSync(path.join(root,'public/assets/orbit-showcase.svg')));
  const svg=read('public/assets/orbit-showcase.svg');
  assert.match(svg,/viewBox="0 0 1160 900"/);
  assert.match(svg,/radialGradient id="planet"/);
});

test('Six canonical experiences keep their existing routes and event hooks',()=>{
  for(const token of [
    'class="studio-tile tile-cosmos" data-go="cosmos"',
    'class="studio-tile tile-board" data-tool="desenho"',
    'class="studio-tile tile-solids" data-tool="solidos"',
    'class="studio-tile tile-memory" data-go="memoria"',
    'class="studio-tile tile-video" data-go="videos"',
    'class="studio-tile tile-calibration" data-go="diagnostico"'
  ])assert.ok(html.includes(token),token);
  assert.match(js,/grid\.appendChild\(button\)/);
  assert.match(js,/drawer\.classList\.add\('deck-open'\)/);
  assert.match(js,/drawer\.classList\.remove\('deck-open'\)/);
  assert.match(js,/event\.key==='Escape'/);
  assert.match(js,/event\.key==='Tab'/);
  assert.match(js,/aria-expanded/);
  assert.doesNotMatch(js,/removeChild|replaceChildren|innerHTML\s*=\s*''/);
});

test('Landscape preserves all eight secondary tools via focusable overlay, not duplicate second nav',()=>{
  const old=read('public/js/experience-intro.js');
  assert.ok(old.includes("shortcuts.querySelector('.agv-arcade-shortcut"));
  assert.ok(old.includes("shortcuts.querySelector('[data-touch-replay]')"));
  assert.match(css,/\.home-bottom:not\(\.deck-open\)\{/);
  assert.match(css,/\.home-bottom\.deck-open\{/);
  assert.match(css,/min-height:48px!important/);
  assert.match(js,/backdrop\.addEventListener\('click'/);
  assert.match(js,/closeButton\.focus/);
});

test('High-contrast deliberate palette, no externally fetched backgrounds',()=>{
  for(const color of ['#03070c','#ff571b','#04e4f5','#c9ff25']){
    assert.ok(css.includes(color),color+' must occur in the palette');
  }
  assert.doesNotMatch(css,/https?:\/\//);
  assert.match(css,/prefers-reduced-motion: reduce/);
  assert.match(css,/orientation:landscape/);
  assert.ok(css.indexOf('Oficina & Arcade')>0);
});

test('Studio 4.0 assets are loaded last and precached for offline TV use',()=>{
  const pos=html.indexOf('css/studio-control-deck.css?v=4.0.0');
  assert.ok(pos>html.indexOf('css/touch-vivid.css'));
  assert.match(html,/js\/studio-control-deck\.js\?v=4\.0\.0/);
  assert.match(html,/<title>AGV TOUCH Studio 4\.0/);
  assert.match(sw,/tvtouch-studio-v4\.0\.0-control-deck/);
  for(const p of ['./css/studio-control-deck.css','./js/studio-control-deck.js','./assets/orbit-showcase.svg']){
    assert.ok(sw.includes(p),p+' must be offline');
  }
});
