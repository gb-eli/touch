const test=require('node:test');const assert=require('node:assert/strict');const E=require('../public/js/platform-adventures.js');
test('2D move and jump',()=>{const s=E.create();s.status='playing';E.step(s,{right:true},1/60);assert.ok(s.p.x>2);E.step(s,{jump:true},1/60);assert.ok(s.p.y>0);assert.equal(s.p.ground,false)});
test('3D moves independently along depth',()=>{const s=E.create('3d');s.status='playing';E.step(s,{up:true},1/60);assert.ok(s.p.z<0);assert.equal(s.p.x,2)});
test('fall respawns and consumes one life',()=>{const s=E.create();s.status='playing';s.p.y=-6;E.step(s,{},1/60);assert.equal(s.lives,2);assert.equal(s.p.x,2)});
test('goal finishes stage',()=>{const s=E.create('3d');s.status='playing';s.p.x=s.end;s.p.z=s.goalZ;E.step(s,{},1/60);assert.equal(s.status,'won')});
test('second stage differs from first',()=>{assert.notDeepEqual(E.create('2d',0).platforms,E.create('2d',1).platforms)});
