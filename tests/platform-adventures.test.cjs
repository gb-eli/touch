const test=require('node:test');const assert=require('node:assert/strict');const E=require('../public/js/platform-adventures.js');
test('2D move and jump',()=>{const s=E.create();s.status='playing';E.step(s,{right:true},1/60);assert.ok(s.p.x>2);E.step(s,{jump:true},1/60);assert.ok(s.p.y>0);assert.equal(s.p.ground,false)});
test('3D moves independently along depth',()=>{const s=E.create('3d');s.status='playing';E.step(s,{up:true},1/60);assert.ok(s.p.z<0);assert.equal(s.p.x,2)});
test('fall respawns and consumes one life',()=>{const s=E.create();s.status='playing';s.p.y=-6;E.step(s,{},1/60);assert.equal(s.lives,2);assert.equal(s.p.x,2)});
test('goal finishes stage',()=>{const s=E.create('3d');s.status='playing';s.p.x=s.end;s.p.z=s.goalZ;E.step(s,{},1/60);assert.equal(s.status,'won')});
test('second stage differs from first',()=>{assert.notDeepEqual(E.create('2d',0).platforms,E.create('2d',1).platforms)});
test('crystal is collected once',()=>{const s=E.create();s.status='playing';const g=s.gems[0];s.p.x=g.x;s.p.z=g.z;s.p.y=g.y-.45;E.step(s,{},1/60);assert.equal(s.score,10);E.step(s,{},1/60);assert.equal(s.score,10)});
test('airborne player cannot double jump',()=>{const s=E.create();s.status='playing';E.step(s,{jump:true},1/60);const vy=s.p.vy;E.step(s,{jump:true},1/60);assert.ok(s.p.vy<vy)});
test('no lives ends game',()=>{const s=E.create();s.status='playing';s.lives=1;s.p.y=-6;E.step(s,{},1/60);assert.equal(s.status,'lost')});

test('four worlds each have unique layouts and names',()=>{assert.equal(E.worlds.length,4);assert.equal(new Set(E.worlds.map(w=>w.name)).size,4);for(const mode of ['2d','3d'])for(let i=0;i<4;i++){const s=E.create(mode,i);assert.ok(s.end>60);assert.ok(s.platforms.length>6);assert.equal(!!s.boss,i===3)}});
test('next world retains score and lives, final world ends campaign',()=>{const s=E.create();s.status='won';s.score=170;s.lives=2;const n=E.next(s);assert.equal(n.stage,1);assert.equal(n.score,170);assert.equal(n.lives,2);const f=E.create('3d',3);f.status='won';assert.equal(E.next(f),null)});
test('boss blocks exit until defeated',()=>{const s=E.create('2d',3);s.status='playing';s.p.x=s.end;E.step(s,{},1/60);assert.equal(s.status,'playing');s.boss.hp=0;E.step(s,{},1/60);assert.equal(s.status,'won')});
test('landing on boss causes damage and bounce',()=>{const s=E.create('3d',3);s.status='playing';Object.assign(s.p,{x:s.boss.x,y:1.37,z:s.boss.z,vy:-3,ground:false});E.step(s,{},1/60);assert.equal(s.boss.hp,2);assert.ok(s.p.vy>0);assert.equal(s.score,100)});
test('fall during invulnerability still respawns',()=>{const s=E.create();s.status='playing';s.invincible=1;s.p.y=-7;E.step(s,{},1/60);assert.equal(s.lives,2);assert.equal(s.p.y,0)});
