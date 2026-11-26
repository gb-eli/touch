const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const S=require('../public/studio5/studio.js');
test('routes are validated',()=>{for(const r of S.routes)assert.equal(S.route('#'+r),r);assert.equal(S.route('#bad'),'inicio')});
test('all legacy destinations are real local files',()=>{for(const r of S.catalogue.filter(x=>x.kind==='legacy')){let target=r.url.split(/[?#]/)[0];if(target.endsWith('/'))target+='index.html';assert.ok(fs.existsSync(path.resolve(__dirname,'../public/studio5',target)),r.name)}});
test('small angle period',()=>assert.ok(Math.abs(S.period(2,9.81)-2.837)<.005));
test('pendulum numerical energy remains bounded',()=>{const s={length:2,g:9.81,theta:Math.PI/6,omega:0},e=S.energy(s);for(let i=0;i<10000;i++)S.step(s,.005);assert.ok(Math.abs(S.energy(s)-e)/e<.025)});
test('clean entry has one stylesheet and script, no legacy intro or background animation',()=>{const h=fs.readFileSync(path.join(__dirname,'../public/studio5/index.html'),'utf8');assert.equal((h.match(/rel="stylesheet"/g)||[]).length,1);assert.equal((h.match(/<script /g)||[]).length,1);assert.doesNotMatch(h,/tvtIntro|site-synapses/);});
