'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const js=read('public/js/oficina.js');
test('Soltar um bloco resolve o destino pela coordenada do toque',()=>{
 const handler=js.slice(js.indexOf("board.addEventListener('pointerup'"),js.indexOf("board.addEventListener('click'"));
 assert.match(handler,/document\.elementFromPoint\(e\.clientX,e\.clientY\)/);
 assert.match(handler,/Number\(col\.dataset\.column\)!==state\.dragFrom/);
 assert.match(handler,/moveBlock\(state\.dragFrom,Number\(col\.dataset\.column\)\)/);
 assert.match(handler,/e\.pointerId!==state\.dragPointerId/);
});
test('O clique sintético depois do arraste não cria bloco duplicado',()=>{
 assert.match(js,/suppressUntil:0/);
 assert.match(js,/state\.suppressUntil=Date\.now\(\)\+380/);
 assert.match(js,/if\(Date\.now\(\)<state\.suppressUntil\)return/);
 assert.doesNotMatch(js,/state\.suppress=true;setTimeout/);
});
test('Cancelamento de toque limpa captura e não deixa peça presa',()=>{
 assert.match(js,/document\.addEventListener\('pointercancel'/);
 assert.match(js,/state\.dragMaterial=null;state\.dragFrom=null;state\.dragPointerId=null/);
 assert.match(js,/board\.classList\.remove\('oficina-grabbing'\)/);
});
test('CPU bloqueia tabuleiro durante processamento e anuncia estado',()=>{
 assert.match(js,/state\.thinking=true;\s*renderTtt\(\)/);
 assert.match(js,/aria-busy="\x27\+String\(state\.thinking\)/);
 assert.match(js,/state\.over\|\|mark\|\|state\.thinking\?'disabled'/);
});
test('Tela cheia é um gesto explícito, reversível e com fallback Android',()=>{
 const html=read('public/oficina.html'),css=read('public/css/oficina.css');
 assert.match(html,/id="oficinaFullscreen"/);
 assert.match(js,/fullscreenButton\.addEventListener\('click'/);
 assert.match(js,/document\.exitFullscreen\?/);
 assert.match(js,/stage\.requestFullscreen\?/);
 assert.match(js,/document\.addEventListener\('fullscreenchange'/);
 assert.match(css,/\.oficina-panel:fullscreen/);
 assert.match(css,/\.oficina-panel:fullscreen::after/);
 assert.match(css,/Desenvolvido por Gabriel Elienai/);
});
test('CSS usa um modo de toque que permite arraste e mantém acessibilidade',()=>{
 const css=read('public/css/oficina.css');
 assert.match(css,/\.oficina-palette button\{touch-action:none/);
 assert.match(css,/\.oficina-column:focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
 assert.doesNotThrow(()=>new vm.Script(js,{filename:'oficina.js'}));
});
