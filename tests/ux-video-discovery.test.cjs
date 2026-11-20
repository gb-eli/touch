/* TV TOUCH · Auditoria 2.5 — testes do catálogo e navegação. Nenhuma dependência NPM. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'public/js/app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'public/css/product-interface.css'),'utf8');
const sw=fs.readFileSync(path.join(root,'public/service-worker.js'),'utf8');
const art=fs.readFileSync(path.join(root,'public/assets/immersive-scenes.svg'),'utf8');
const videoIds=['porto360','navio360','oceano360','historia360','espaco360','museus360','natureza360','industrias360'];
function harness(){
  const start=app.indexOf('const VIDEO_TOPICS='),end=app.indexOf('function card(resource)',start);
  assert.ok(start>=0&&end>start,'Videos have their own component');
  const fragment=app.slice(start,end);
  const views={videoCards:{innerHTML:''},videoCount:{textContent:''}};
  const buttons=['Todos','Portos','Natureza','Ciência','Cultura','Tecnologia'].map(videoFilter=>({
    dataset:{videoFilter},attrs:{},setAttribute(k,v){this.attrs[k]=v;}
  }));
  const videos=videoIds.map(id=>({id,name:id,url:'https://www.youtube.com/results?search_query='+id,description:'Explorar tema'}));
  const compiler=new Function('VIDEOS','favorites','html','$','$$',
    'let activeVideoTopic="Todos";'+fragment+
    ';return {renderVideos,videoCard,change:v=>{activeVideoTopic=v;renderVideos();},topics:VIDEO_TOPICS};');
  const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
  const api=compiler(videos,new Set(),esc,id=>views[id.slice(1)],()=>buttons);
  return {api,views,buttons};
}
test('o catálogo separa buscas temáticas de vídeos comprovados',()=>{
  const {api,views}=harness();api.renderVideos();
  assert.match(views.videoCount.textContent,/8 temas disponíveis/);
  assert.match(views.videoCount.textContent,/não vídeos homologados/);
  assert.equal((views.videoCards.innerHTML.match(/class="discovery-card discovery-topic-/g)||[]).length,8);
  assert.equal((views.videoCards.innerHTML.match(/data-visit-resource=/g)||[]).length,8);
  assert.equal((views.videoCards.innerHTML.match(/data-open-resource=/g)||[]).length,8);
  assert.ok(!views.videoCards.innerHTML.includes('thumbnailUrl'));
});
test('filtros mostram subconjuntos corretos e deixam seleção explícita',()=>{
  const {api,views,buttons}=harness();
  const expect={Portos:2,Natureza:2,Cultura:2,'Ciência':1,Tecnologia:1,Todos:8};
  for(const [topic,n] of Object.entries(expect)){
    api.change(topic);
    assert.equal((views.videoCards.innerHTML.match(/class="discovery-card discovery-topic-/g)||[]).length,n);
    assert.equal(buttons.filter(b=>b.attrs['aria-pressed']==='true').length,1);
    assert.equal(buttons.find(b=>b.attrs['aria-pressed']==='true').dataset.videoFilter,topic);
  }
});
test('nav móvel reduz sete destinos a cinco e mantém rota Mais',()=>{
  assert.match(html,/data-page="mais"/);
  assert.match(html,/id="page-mais"/);
  assert.match(html,/data-go="favoritos"/);
  assert.match(html,/data-go="guia"/);
  assert.match(html,/data-go="diagnostico"/);
  assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(css,/\.resource-grid,body\.studio-ui \.lab-grid\{grid-template-columns:1fr!important\}/);
  assert.ok(!html.includes('href="#videoCategories"'),'No hash route collision');
});
test('capas são ilustrações distintas, sem apresentar falsas miniaturas',()=>{
  for(const type of ['port','ship','sea','history','space','museum','forest','industry']){
    assert.ok(art.includes('<symbol id="'+type+'"'));
  }
  assert.ok(app.includes('não é miniatura de um vídeo'));
  assert.ok(html.includes('não são vídeos 360° homologados'));
  assert.match(sw,/tvtouch-studio-v3\.8\.0-landscape-gesture-qa/);
  assert.ok(sw.includes('immersive-scenes.svg'));
});

test('tokens de texto e ações mantêm contraste mínimo em Black, Claro e Vivo',()=>{
  const palettes=[
    ['#f9fbf7','#0c1115'],['#172a30','#f4f4f0'],['#fbfcf6','#10232c'],
    ['#182b2b','#f2b84b'],['#182b2b','#eab04c'],['#182b2b','#ffd072'],
    ['#cbd9d5','#0c1115'],['#455b60','#f4f4f0']
  ];
  const chan=s=>{const v=parseInt(s,16)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;};
  const lum=hex=>{const h=hex.slice(1);return .2126*chan(h.slice(0,2))+.7152*chan(h.slice(2,4))+.0722*chan(h.slice(4,6));};
  for(const [text,bg] of palettes){
    const a=lum(text),b=lum(bg),contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    assert.ok(contrast>=4.5,'Low contrast '+text+' on '+bg+': '+contrast.toFixed(2));
  }
  assert.ok(css.includes('--brand-accent:#eab04c'));
});
