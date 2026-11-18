'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const code=read('public/js/voxel-world.js'),sandbox={module:{exports:{}}};
vm.runInNewContext(code,sandbox,{filename:'voxel-world.js'});
const v=sandbox.module.exports;
test('Modelo oferece 8x8x6, nove texturas autorais e no máximo 256 blocos',()=>{
 assert.equal(v.SIZE,8);assert.equal(v.HEIGHT,6);assert.equal(v.MAX_BLOCKS,256);
 assert.equal(v.MATERIALS.length,9);
 for(const x of ['grass','dirt','sand','stone','lava','ice','wood','brick','crystal'])
  assert.ok(v.MATERIALS.some(m=>m.id===x),x);
});
test('Encaixe em grade rejeita limites, duplicatas e blocos suspensos',()=>{
 const w=v.createWorld();
 assert.equal(w.add(3,0,3,'grass'),true);
 assert.equal(w.add(3,0,3,'wood'),false);
 assert.equal(w.add(3,3,3,'stone'),false);
 assert.equal(w.add(-1,0,3,'stone'),false);
 assert.equal(w.add(3,6,3,'stone'),false);
 assert.equal(w.add(3,1,3,'wood'),true);
 assert.equal(w.add(4,1,3,'wood'),true);
 assert.equal(w.count,3);
 assert.equal(w.has(4,1,3),true);
});
test('Desfazer/refazer são reversíveis e não alteram objeto anterior',()=>{
 const w=v.createWorld();
 w.add(0,0,0,'sand');w.add(0,1,0,'ice');
 assert.equal(w.undo(),true);assert.equal(w.count,1);
 assert.equal(w.redo(),true);assert.equal(w.count,2);
 w.undo();w.add(1,0,0,'wood');
 assert.equal(w.canRedo,false);
 assert.equal(w.get(0,0,0).material,'sand');
});
test('Mover exige destino livre e conectado sem duplicar blocos',()=>{
 const w=v.createWorld();
 w.add(2,0,2,'brick');w.add(3,0,2,'crystal');
 assert.equal(w.move({x:2,y:0,z:2},{x:3,y:0,z:2}),false);
 assert.equal(w.move({x:2,y:0,z:2},{x:4,y:5,z:4}),false);
 assert.equal(w.move({x:2,y:0,z:2},{x:4,y:0,z:2}),true);
 assert.equal(w.count,2);assert.equal(w.has(2,0,2),false);
 assert.equal(w.get(4,0,2).material,'brick');
 w.undo();assert.equal(w.has(2,0,2),true);
});
test('Quatro missões especificam coordenadas e detectam conclusão',()=>{
 for(const key of ['tower','stairs','bridge','symmetry']){
  const w=v.createWorld();
  const blocks=v.goals[key];
  const pending=[...blocks].sort((a,b)=>a.y-b.y);
  for(const b of pending){
   assert.equal(w.add(b.x,b.y,b.z,'stone'),true,key+' '+JSON.stringify(b));
  }
  const p=w.progress(key);
  assert.equal(p.done,p.total);
  assert.equal(p.complete,true);
 }
 assert.equal(v.createWorld().progress('free').complete,false);
});
test('Salvar/carregar JSON é explícito, local e rejeita dados inválidos',()=>{
 const w=v.createWorld();w.add(3,0,3,'grass');
 const json=w.serialize(),next=v.createWorld();
 assert.equal(next.load(json),true);assert.equal(next.count,1);
 const original=next.serialize();
 assert.equal(next.load('x invalid'),false);
 assert.equal(next.load(JSON.stringify({version:1,blocks:[{x:99,y:0,z:2,material:'wood'}]})),false);
 assert.equal(next.load(JSON.stringify({version:1,blocks:[{x:3,y:0,z:3,material:'unknown'}]})),false);
 assert.equal(next.load(JSON.stringify({version:1,blocks:Array(260).fill({x:0,y:0,z:0,material:'grass'})})),false);
 assert.equal(next.serialize(),original);
});
test('Raycast acerta o piso e uma face 3D, fora da grade não coloca',()=>{
 const floor=v.raycast({x:0,y:10,z:0},{x:0,y:-1,z:0},[]);
 assert.equal(floor.target.x,4);assert.equal(floor.target.y,0);assert.equal(floor.target.z,4);
 const w=v.createWorld();w.add(4,0,4,'stone');
 const hit=v.raycast({x:0.5,y:8,z:.5},{x:0,y:-1,z:0},w.blocks);
 assert.equal(hit.block.x,4);assert.equal(hit.block.y,0);
 assert.equal(hit.target.y,1);
 assert.equal(v.raycast({x:100,y:4,z:100},{x:0,y:-1,z:0},w.blocks),null);
});
test('Limpar mantém histórico e arquivos não usam upload, rede ou credenciais',()=>{
 const w=v.createWorld();w.add(0,0,0,'dirt');w.clear();
 assert.equal(w.count,0);w.undo();assert.equal(w.count,1);
 const view=read('public/js/voxel-builder-ui.js');
 for(const forbidden of ['fetch(','XMLHttpRequest','sendBeacon','geolocation','client_secret'])
  assert.ok(!view.includes(forbidden),forbidden);
 assert.match(view,/localStorage\.setItem\(KEY,world\.serialize\(\)\)/);
});
test('HTML mostra modo WebGL novo e alternativa 2D sem modificar jogos antigos',()=>{
 const html=read('public/oficina.html'),js=read('public/js/oficina.js');
 assert.match(html,/data-oficina="builder3d"/);
 assert.match(html,/data-oficina="blocks"/);
 const first=['voxel-world.js','voxel-renderer.js','voxel-builder-ui.js','oficina.js'];
 let last=0;
 for(const x of first){
  const now=html.indexOf('js/'+x);
  assert.ok(now>last,'script order '+x);last=now;
 }
 assert.match(js,/initial='builder3d'/);
 assert.match(js,/voxelMount\?\.dispose\(\)/);
});
test('Renderer WebGL contém projeção, iluminação, mapa de materiais e fallback',()=>{
 const source=read('public/js/voxel-renderer.js');
 assert.doesNotThrow(()=>new vm.Script(source));
 for(const term of ["getContext('webgl'","gl.DEPTH_TEST","gl.TRIANGLES",
   "webglcontextlost","webglcontextrestored","ResizeObserver",
   "3200000","pointerdown","pointermove","pointerup","lostpointercapture"])
  assert.ok(source.includes(term),term);
 assert.match(source,/Math\.min\(window\.devicePixelRatio\|\|1,2\)/);
 assert.ok(!source.includes('https://'));
 assert.match(source,/UNPACK_FLIP_Y_WEBGL,false/,'material index must match atlas row');
});
test('PWA inclui modelo, renderer e UI sem login',()=>{
 const sw=read('public/service-worker.js');
 assert.match(sw,/tvtouch-studio-v3\.7\.0-landscape-vivid/);
 for(const p of ['voxel-world.js','voxel-renderer.js','voxel-builder-ui.js','voxel-builder.css'])
  assert.ok(sw.includes(p),p);
 assert.doesNotMatch(sw,/"\.\/admin\.html"/);
});
