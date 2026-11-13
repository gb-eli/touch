'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('public/js/oficina.js');
const tttPart=source.slice(source.indexOf('  const tttLines='),source.indexOf('  function initializeTtt()'));
const ttt=new Function(tttPart+';return {tttWin}')();
const checkersPart=source.slice(source.indexOf('  const inBounds='),source.indexOf('  function initializeCheckers()'));
const damas=new Function(checkersPart+';return {initCheckersBoard,movesFor,legalMoves}')();
test('Oficina registra cinco atividades acessíveis em sua navegação',()=>{
  const page=read('public/oficina.html');
  for(const id of ['blocks','pattern','ttt','checkers','puzzle'])assert.match(page,new RegExp('data-oficina="'+id+'"'));
  assert.match(page,/id="oficinaStage"/);assert.match(page,/id="oficinaStatus" role="status" aria-live="polite"/);
  assert.match(page,/Desenvolvido por <strong>Gabriel Elienai<\/strong>/);
});
test('Jogo da velha detecta vitória horizontal, diagonal, empate e tabuleiro incompleto',()=>{
  assert.deepEqual(ttt.tttWin(['X','X','X',null,null,null,null,null,null]),{winner:'X',line:[0,1,2]});
  assert.deepEqual(ttt.tttWin(['O',null,'X',null,'O','X','X',null,'O']),{winner:'O',line:[0,4,8]});
  assert.deepEqual(ttt.tttWin(['X','O','X','X','O','O','O','X','X']),{winner:'draw',line:[]});
  assert.equal(ttt.tttWin(['X',null,null,null,null,null,null,null,null]),null);
});
test('Tabuleiro inicial de damas possui 24 peças em casas escuras',()=>{
  const cells=damas.initCheckersBoard();
  assert.equal(cells.length,64);
  assert.equal(cells.filter(x=>x===1).length,12);
  assert.equal(cells.filter(x=>x===-1).length,12);
  for(let i=0;i<64;i++)if(cells[i])assert.equal((Math.floor(i/8)+i%8)%2,1);
  assert.equal(damas.legalMoves(cells,'w').length,7);
});
test('Capturas são obrigatórias e multicaputura fica restrita à mesma peça',()=>{
  const b=Array(64).fill(0);
  b[5*8]=1;b[5*8+4]=1;b[4*8+1]=-1;b[2*8+3]=-1;
  const options=damas.legalMoves(b,'w');
  assert.equal(options.length,1);
  assert.deepEqual(options[0],{from:40,to:26,capture:33});
  const next=[...b];next[40]=0;next[33]=0;next[26]=1;
  assert.deepEqual(damas.legalMoves(next,'w',26),[{from:26,to:12,capture:19}]);
});
test('Dama promovida pode retroceder em movimento diagonal',()=>{
  const b=Array(64).fill(0);b[3*8+2]=2;
  const moves=damas.legalMoves(b,'w');
  assert.equal(moves.length,4);
  assert.ok(moves.some(x=>x.to===2*8+1));
  assert.ok(moves.some(x=>x.to===4*8+3));
});
test('Materiais procedurais aparecem no jogo de blocos e no laboratório 3D',()=>{
  const engine=read('public/js/geometry-lab.js'),css=read('public/css/oficina.css'),html=read('public/index.html');
  for(const name of ['grass','dirt','sand','stone','lava','ice','wood','brick','crystal']){
    assert.ok(css.includes('[data-material='+name+']'),name);
    assert.ok(engine.includes(name+':{label:'),name);
    assert.match(html,new RegExp('data-material="'+name+'"'));
  }
  assert.match(source,/moveBlock\(state.dragFrom/);assert.match(source,/document\.elementFromPoint/);
  assert.match(source,/oficinaBlockGoal/);
});
test('Quebra-cabeça de imagens funciona localmente, sem upload e com tamanhos 3x3/4x4',()=>{
  assert.match(source,/input\.type='file'/);
  assert.match(source,/URL\.createObjectURL\(file\)/);
  assert.match(source,/URL\.revokeObjectURL\(photoURL\)/);
  assert.match(source,/state\.n\*\*2/);
  assert.match(source,/--slice-size/);
  assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|sendBeacon/);
});
test('Integração com home, laboratório, Arcade, busca e cache offline',()=>{
  const home=read('public/index.html'),arcade=read('public/arcade.html');
  const ux=read('public/js/platform-ux.js'),sw=read('public/service-worker.js');
  assert.match(home,/href="oficina\.html"/);
  assert.match(arcade,/href="oficina\.html"/);
  for(const id of ['blocks','pattern','ttt','checkers','puzzle'])assert.ok(ux.includes("id:'"+id+"',type:'playground'"));
  for(const asset of ['./oficina.html','./css/oficina.css','./js/oficina.js'])assert.ok(sw.includes(asset));
});
test('Fontes JS adicionadas possuem sintaxe válida e acessibilidade de movimento',()=>{
  for(const file of ['public/js/oficina.js','public/js/geometry-lab.js','public/js/platform-ux.js','public/service-worker.js'])
    assert.doesNotThrow(()=>new vm.Script(read(file),{filename:file}));
  const css=read('public/css/oficina.css');
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/touch-action:manipulation/);
  assert.match(css,/:focus-visible/);
});
