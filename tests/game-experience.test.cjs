'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('public/js/game-experience.js');
function harness({reduced=false,saveData=false,hidden=false}={}){
  let now=1000,created=0,sounds=0;
  const timers=[];
  const listeners={};
  class FakeAudioContext{
    constructor(){created++;this.state='running';this.currentTime=0;this.destination={}}
    createOscillator(){
      return {type:'sine',frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},
        connect(){},start(){sounds++},stop(){}};
    }
    createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}}
    resume(){this.state='running';return Promise.resolve()}
    close(){this.state='closed';return Promise.resolve()}
  }
  function target(){
    return{isConnected:true,children:[],classList:{add(){}},
      appendChild(c){this.children.push(c)},style:{},
      getAttribute(){return null}};
  }
  const document={
    body:{classList:{contains:()=>false}},
    visibilityState:hidden?'hidden':'visible',
    addEventListener(k,fn){listeners[k]=fn},
    querySelectorAll(){return []},
    createElement(){return{className:'',attrs:{},style:{setProperty(){}},
      setAttribute(k,v){this.attrs[k]=v},addEventListener(){},
      remove(){this.removed=true}}}
  };
  const window={
    matchMedia:()=>({matches:reduced}),
    AudioContext:FakeAudioContext,
    addEventListener(k,fn){listeners[k]=fn}
  };
  const sandbox={window,document,navigator:{connection:{saveData}},
    performance:{now:()=>now},setTimeout(fn){timers.push(fn);return timers.length}};
  vm.runInNewContext(source,sandbox);
  return {api:window.AGVGameExperience,target,document,window,listeners,
    tick(ms=100){now+=ms},flush(){for(const fn of timers.splice(0))fn()},
    get contexts(){return created},get soundCount(){return sounds}};
}
test('Motor registra eventos e expõe apenas API pública local',()=>{
  const env=harness(),api=env.api;
  assert.equal(typeof api.createSession,'function');
  assert.equal(typeof api.setSound,'function');
  assert.equal(api.soundEnabled(),false);
  assert.ok(Object.isFrozen(api));
  for(const event of ['start','pause','resume','reset','hit','correct','wrong','score','win','lose','draw','select','move'])
    assert.ok(api.events.includes(event),event);
  assert.doesNotMatch(source,/fetch\(|localStorage|XMLHttpRequest|sendBeacon|geolocation/);
});
test('Máquina de estados não aceita transições inválidas nem continua após dispose',()=>{
  const {api,target}=harness();
  const session=api.createSession('snake',{root:target});
  assert.equal(session.state,'idle');
  assert.equal(session.transition('pause'),false);
  assert.equal(session.transition('start'),true);
  assert.equal(session.state,'playing');
  assert.equal(session.rounds,1);
  assert.equal(session.transition('start'),false);
  assert.equal(session.transition('pause'),true);
  assert.equal(session.state,'paused');
  assert.equal(session.transition('resume'),true);
  assert.equal(session.transition('win'),true);
  assert.equal(session.state,'completed');
  assert.equal(session.transition('resume'),false);
  assert.equal(session.transition('reset'),true);
  assert.equal(session.transition('start'),true);
  assert.equal(session.rounds,2);
  session.dispose();
  assert.equal(session.transition('pause'),false);
  assert.equal(session.emit('hit'),false);
});
test('Identificador não aceita strings arbitrárias e eventos desconhecidos são rejeitados',()=>{
  const {api}=harness();
  assert.throws(()=>api.createSession('../token'),/Identificador/);
  assert.equal(api.emit('unknown'),false);
});
test('Áudio começa desligado e somente é autorizado após comando explícito',async()=>{
  const env=harness(),api=env.api;
  assert.equal(api.tone(440),false);
  assert.equal(env.contexts,0);
  assert.equal(await api.setSound(true),true);
  assert.equal(env.contexts,1);
  assert.equal(api.soundEnabled(),true);
  assert.equal(api.tone(440),true);
  assert.equal(env.soundCount,1);
  assert.equal(api.tone(450),false,'rate-limit');
  env.tick();
  assert.equal(api.emit('correct',{visual:false}),true);
  assert.equal(env.soundCount,2);
  assert.equal(await api.setSound(false),false);
  env.tick();
  assert.equal(api.tone(440),false);
  assert.equal(env.soundCount,2);
});
test('Efeitos são limitados, descartados e respeitam as preferências',()=>{
  const env=harness(),api=env.api,root=env.target();
  for(let i=0;i<50;i++)assert.equal(api.emit('win',{target:root,audio:false}),true);
  assert.equal(root.children.length,24,'budget of active particles');
  env.flush();
  assert.equal(root.children.filter(x=>!x.removed).length,0);
  const reduced=harness({reduced:true}), quiet=harness({saveData:true});
  const a=reduced.target(),b=quiet.target();
  reduced.api.emit('win',{target:a,audio:false});
  quiet.api.emit('correct',{target:b,audio:false});
  assert.equal(a.children.length,0);
  assert.equal(b.children.length,0);
});
test('Troca de visibilidade impede som oculto e o encerramento libera sessões',async()=>{
  const env=harness(),api=env.api;
  const session=api.createSession('checkers');
  await api.setSound(true);
  env.document.visibilityState='hidden';
  assert.equal(api.tone(390),false);
  api.stop();
  assert.equal(api.soundEnabled(),false);
  assert.equal(session.transition('start'),false);
});
test('A integração compartilha o motor entre Arcade, Oficina, Memória, Encaixe e Porto',()=>{
  const arcade=read('public/js/arcade.js'),oficina=read('public/js/oficina.js'),
    games=read('public/js/learning-games.js'),app=read('public/js/app.js');
  assert.match(arcade,/createSession\('arcade'/);
  assert.match(arcade,/gameExperience\?\.setSound/);
  assert.match(oficina,/createSession\('oficina-'/);
  assert.match(oficina,/gameExperience\?\.tone/);
  assert.match(games,/createSession\('memory'/);
  assert.match(games,/memorySession\?\.emit\('wrong'/);
  assert.match(app,/createSession\('encaixe'/);
  assert.match(app,/createSession\('porto'/);
  assert.match(app,/quizSession\?\.emit\(right\?'correct':'wrong'/);
  assert.match(app,/\$\$\('\[data-answer\]'\)\.forEach/);
});
test('Páginas de jogos carregam motor antes dos próprios módulos',()=>{
  for(const [page,app] of [['index','js/app.js'],['arcade','js/arcade.js'],['oficina','js/oficina.js']]){
    const html=read('public/'+page+'.html');
    assert.match(html,/css\/game-experience\.css\?v=3\.3\.0/);
    assert.match(html,/js\/game-experience\.js\?v=3\.3\.0/);
    assert.ok(html.indexOf('js/game-experience.js')<html.indexOf(app),page+' load order');
  }
  const home=read('public/index.html');
  assert.equal((home.match(/data-agv-game-sound/g)||[]).length,2);
});
test('PWA guarda novo motor, CSS e scripts versionados sem fazer precache do admin',()=>{
  const sw=read('public/service-worker.js');
  assert.match(sw,/tvtouch-studio-v4\.0\.0-control-deck/);
  assert.match(sw,/\.\/js\/game-experience\.js/);
  assert.match(sw,/\.\/css\/game-experience\.css/);
  assert.doesNotMatch(sw,/"\.\/admin\.html"/);
  assert.doesNotThrow(()=>new vm.Script(source));
});
