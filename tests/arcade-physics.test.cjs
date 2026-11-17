'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('public/js/arcade-physics.js');
const mod={exports:{}};
vm.runInNewContext(source,{module:mod});
const physics=mod.exports;
const finiteBall=b=>[b.x,b.y,b.vx,b.vy].every(Number.isFinite);
test('Lançamento do Basquete limita velocidades e preserva controle do gesto',()=>{
  const a=physics.basketLaunch(350,-360);
  const b=physics.basketLaunch(9500,-8000);
  assert.ok(a.vx>0&&a.vy<0);
  assert.ok(b.vx<=880&&b.vy>=-980);
});
test('Prévia do Basquete usa a mesma integração de 120 Hz que a jogada',()=>{
  for(const [dx,dy] of [[330,-360],[430,-320],[250,-200]]){
    const v=physics.basketLaunch(dx,dy);
    const preview=physics.basketPreview(210,440,v.vx,v.vy);
    let ball={x:210,y:440,...v},scored=false;
    for(let i=0;i<318;i++){
      const result=physics.basketStep(ball,1/120);
      ball=result.ball;
      if(result.scored){scored=true;break}
      if(ball.x>980||ball.x<-20||result.floor)break;
    }
    assert.equal(preview.scored,scored,dx+' '+dy);
  }
});
test('A cesta só marca quando a bola cruza o aro aberto na descida',()=>{
  const good=physics.basketStep({x:746,y:234,vx:0,vy:440},.01);
  const bad=physics.basketStep({x:610,y:234,vx:0,vy:440},.01);
  const goingUp=physics.basketStep({x:746,y:234,vx:0,vy:-90},.01);
  assert.equal(good.scored,true);
  assert.equal(bad.scored,false);
  assert.equal(goingUp.scored,false);
});
test('A colisão com a borda do aro altera a trajetória sem NaN',()=>{
  const hit=physics.basketStep({x:680,y:237,vx:400,vy:0},.025);
  assert.equal(hit.rim,true);
  assert.ok(hit.ball.vx<0);
  assert.ok(finiteBall(hit.ball));
});
test('Bola toca piso e rebate com energia reduzida',()=>{
  const result=physics.basketStep({x:450,y:459,vx:150,vy:230},.03);
  assert.equal(result.floor,true);
  assert.ok(result.ball.vy<0);
  assert.ok(result.ball.vx<150);
});
test('Colisão de sinuca transfere velocidade entre bolas em subpassos',()=>{
  const balls=[
    {x:300,y:270,vx:800,vy:0,r:12,cue:true,pocketed:false},
    {x:340,y:270,vx:0,vy:0,r:12,cue:false,pocketed:false}
  ];
  const result=physics.poolStep(balls,.035);
  assert.ok(result.collisions>0);
  assert.ok(balls[1].vx>0);
  assert.ok(balls.every(finiteBall));
});
test('Caçapa remove bola quando ela entra na região da abertura',()=>{
  const balls=[{x:112,y:96,vx:-10,vy:-10,r:12,cue:false,pocketed:false}];
  const result=physics.poolStep(balls,.016);
  assert.equal(balls[0].pocketed,true);
  assert.equal(result.pocketed.length,1);
});
test('Branca é recolocada sem se sobrepor às outras bolas',()=>{
  const cue={x:98,y:82,vx:0,vy:0,r:12,cue:true,pocketed:true};
  const other={x:288,y:270,vx:0,vy:0,r:12,cue:false,pocketed:false};
  assert.equal(physics.cueRespawn([cue,other]),true);
  assert.equal(cue.pocketed,false);
  assert.ok(Math.hypot(cue.x-other.x,cue.y-other.y)>24);
});
test('Guia de tacada prevê a primeira bola na direção da mira',()=>{
  const cue={x:280,y:270,r:12,pocketed:false};
  const other={x:440,y:270,r:12,pocketed:false};
  const guide=physics.poolGuide(cue,{x:700,y:270},[cue,other]);
  assert.equal(guide.hit,true);
  assert.ok(guide.x>400&&guide.x<440);
  assert.ok(guide.power>0);
  assert.equal(physics.poolGuide(cue,{x:280,y:270},[cue,other]),null);
});
test('Movimento permanece finito após várias iterações',()=>{
  const b=[{x:350,y:270,vx:700,vy:550,r:12,cue:true,pocketed:false},
    {x:600,y:290,vx:0,vy:0,r:12,cue:false,pocketed:false}];
  for(let i=0;i<450;i++)physics.poolStep(b,1/120);
  assert.ok(b.every(finiteBall));
});
test('Páginas carregam motor antes do Arcade e novo visual de bloco',()=>{
  const arcade=read('public/arcade.html'),oficina=read('public/oficina.html');
  assert.ok(arcade.indexOf('js/arcade-physics.js')<arcade.indexOf('js/arcade.js'));
  assert.match(arcade,/js\/arcade-physics\.js\?v=3\.4\.0/);
  assert.match(oficina,/css\/agv34-interactions\.css\?v=3\.4\.0/);
  const blocks=read('public/js/oficina.js');
  assert.match(blocks,/state\.lastChange=\{col:to,row:state\.columns\[to\]\.length-1,kind:'move'\}/);
  assert.match(blocks,/landed/);
});
