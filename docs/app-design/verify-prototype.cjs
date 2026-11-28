const path=require('path');
const {pathToFileURL}=require('url');
let playwright;
try{playwright=require('playwright')}catch{playwright=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules','playwright'))}
const {chromium}=playwright;
const fs=require('fs');
const assert=require('assert');
const base=pathToFileURL(path.join(__dirname,'02-high-fidelity.html')).href;
const out=path.resolve(process.env.TV_TOUCH_PROTOTYPE_OUTPUT||path.join(__dirname,'evidence'))+path.sep;
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||(fs.existsSync('/tmp/chromium')?'/tmp/chromium':undefined),args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1280,height:720},reducedMotion:'reduce',acceptDownloads:true});
 const p=await context.newPage(),errors=[],consoleErrors=[],externalRequests=[],checks=[],viewportChecks=[];
 p.on('pageerror',e=>errors.push(e.message));
 p.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text())});
 p.on('request',request=>{if(/^https?:/.test(request.url()))externalRequests.push(request.url())});
 async function capture(filename,fullPage=false){
  await p.waitForFunction(()=>!document.querySelector('#toast').classList.contains('visible'));
  await p.mouse.move(1,1);
  await p.screenshot({path:out+filename,animations:'disabled',fullPage});
 }
 async function assertVisibleTarget(locator,label,minSize=48){
  const target=await locator.evaluate(el=>{
   const r=el.getBoundingClientRect();
   let left=Math.max(0,r.left),top=Math.max(0,r.top),right=Math.min(innerWidth,r.right),bottom=Math.min(innerHeight,r.bottom);
   for(let parent=el.parentElement;parent;parent=parent.parentElement){
    const style=getComputedStyle(parent),bounds=parent.getBoundingClientRect();
    if(/^(auto|scroll|hidden|clip)$/.test(style.overflowX)){left=Math.max(left,bounds.left+parent.clientLeft);right=Math.min(right,bounds.left+parent.clientLeft+parent.clientWidth)}
    if(/^(auto|scroll|hidden|clip)$/.test(style.overflowY)){top=Math.max(top,bounds.top+parent.clientTop);bottom=Math.min(bottom,bounds.top+parent.clientTop+parent.clientHeight)}
   }
   const insetX=Math.min(8,r.width/4),insetY=Math.min(8,r.height/4);
   const points=[[r.left+r.width/2,r.top+r.height/2],[r.left+insetX,r.top+insetY],[r.right-insetX,r.top+insetY],[r.left+insetX,r.bottom-insetY],[r.right-insetX,r.bottom-insetY]];
   return {width:r.width,height:r.height,visibleWidth:Math.max(0,right-left),visibleHeight:Math.max(0,bottom-top),uncovered:points.every(([x,y])=>{const hit=document.elementFromPoint(x,y);return hit===el||el.contains(hit)})};
  });
  assert.ok(target.width>=minSize&&target.height>=minSize,label+' keeps a touch-sized target: '+JSON.stringify(target));
  assert.ok(target.visibleWidth>=target.width-1&&target.visibleHeight>=target.height-1,label+' must fit its viewport and clipping ancestors: '+JSON.stringify(target));
  assert.ok(target.uncovered,label+' must not be covered by another control');
  return target;
 }
 async function assertLandscapeToolbar(){
  const tools=p.locator('.tools .tool');assert.equal(await tools.count(),5);
  for(let i=0;i<5;i++)await assertVisibleTarget(tools.nth(i),'Landscape toolbar control '+(i+1));
 }
 await p.goto(base);
 await capture('00-high-home-empty-desktop.png');
 assert.equal(await p.locator('h1').innerText(),'Pronto para criar.');
 await p.locator('[data-action="new-free"]').first().click();
 const box=await p.locator('canvas').boundingBox();
 await p.mouse.click(box.x+box.width*.5,box.y+box.height*.53);
 assert.equal(await p.evaluate(()=>state.blocks.length),0);
 assert.equal(await p.locator('#placeBtn').isEnabled(),true);
 await p.locator('#placeBtn').click();
 assert.equal(await p.evaluate(()=>state.blocks.length),1);
 await p.locator('#undoBtn').click();assert.equal(await p.evaluate(()=>state.blocks.length),0);
 await p.locator('#redoBtn').click();assert.equal(await p.evaluate(()=>state.blocks.length),1);
 checks.push('Selecionar não cria; confirmação, desfazer e refazer corretos.');
 await p.locator('[data-action="save"]').click();await p.locator('[data-action="save-confirm"]').click();
 assert.match(await p.locator('#nameError').innerText(),/Escreva/);
 await p.locator('#projectNameInput').fill('Minha primeira ideia');
 await p.evaluate(()=>{window.__storageOriginal=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===KEYS.projects)throw new DOMException('QA quota exceeded','QuotaExceededError');return window.__storageOriginal.call(this,k,v)}});
 await p.locator('[data-action="save-confirm"]').click();
 assert.equal(await p.locator('#modal').isVisible(),true);
 assert.equal(await p.evaluate(()=>state.dirty),true);
 assert.equal(await p.evaluate(()=>state.projectId),null);
 assert.equal(await p.evaluate(()=>projects.length),0);
 assert.match(await p.locator('#toast').innerText(),/Não foi possível salvar/);
 await p.evaluate(()=>{Storage.prototype.setItem=window.__storageOriginal;delete window.__storageOriginal});
 checks.push('Falha forçada do localStorage mantém alterações, diálogo aberto e zero projetos; nenhum falso sucesso.');
 await p.locator('[data-action="save-confirm"]').click();
 await p.locator('.main-nav [data-nav="projects"]').click();
 assert.equal(await p.locator('.project-card').count(),1);
 await p.reload();
 await p.locator('.main-nav [data-nav="projects"]').click();assert.equal(await p.locator('.project-card').count(),1);
 await p.locator('[data-action="rename"]').click();await p.locator('#renameInput').fill('Ideia renomeada');await p.locator('[data-action="rename-confirm"]').click();
 assert.match(await p.locator('.project-card').innerText(),/Ideia renomeada/);
 const [download]=await Promise.all([p.waitForEvent('download'),p.locator('[data-action="export"]').click()]);
 const json=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(json.version,1);assert.equal(json.blocks.length,1);
 checks.push('Nome obrigatório, salvar, persistir após reload, renomear e exportar JSON verificados.');
 const fixture=await p.evaluate(()=>({version:1,blocks:HERO_BLOCKS}));
 await p.locator('#importFile').setInputFiles({name:'Ateliê de cores.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
 await p.waitForFunction(()=>projects.length===2);
 await p.locator('#importFile').setInputFiles({name:'invalido.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,blocks:[{x:9,y:0,z:0,material:'grass'}]}))});
 await p.waitForFunction(()=>document.querySelector('#toast').textContent.includes('inválidos'));
 assert.equal(await p.evaluate(()=>projects.length),2);
 checks.push('Importação válida aceita; posição fora da grade rejeitada sem alterar projetos.');
 await p.locator('.main-nav [data-nav="explore"]').click();
 await capture('04-high-explore-desktop.png');
 await p.locator('[data-action="mission"][data-id="bridge"]').click();
 await capture('05-high-mission-desktop.png');
 await p.locator('[data-action="start-mission"]').click();
 for(const sequence of [['ArrowLeft'],['ArrowRight'],['ArrowLeft','PageUp'],['PageUp'],['ArrowRight','PageUp']]){
  await p.locator('canvas').focus();await p.keyboard.press('Escape');
  for(const key of sequence)await p.keyboard.press(key);
  assert.equal(await p.locator('#placeBtn').isEnabled(),true);
  await p.locator('#placeBtn').click();
 }
 assert.deepEqual(await p.evaluate(()=>progress()),{done:5,total:5,complete:true});
 await capture('06-high-builder-mission-desktop.png');
 await p.locator('#missionResultBtn').click();
 await capture('07-high-result-desktop.png');
 await p.locator('.main-nav [data-nav="home"]').click();assert.equal(await p.locator('#modal').isVisible(),true);
 await p.locator('[data-action="leave-save"]').click();await p.locator('[data-action="save-confirm"]').click();
 assert.equal(await p.locator('h1').innerText(),'Pronto para criar.');
 checks.push('Missão ponte 5/5, resultado real e proteção de saída com alterações verificados.');
 await p.locator('.main-nav [data-nav="projects"]').click();
 await capture('08-high-projects-desktop.png');
 await p.locator('.main-nav [data-nav="settings"]').click();
 await capture('09-high-settings-desktop.png');
 await p.locator('#profileSetting').selectOption('tv');assert.equal(await p.locator('body').evaluate(el=>el.classList.contains('profile-tv')),true);
 await p.locator('#profileSetting').selectOption('auto');
 checks.push('Perfil TV altera controles e pode retornar ao automático.');
 for(const view of [{name:'desktop',width:1280,height:720},{name:'mobile',width:412,height:915},{name:'landscape',width:844,height:390}]){
  await p.setViewportSize({width:view.width,height:view.height});
  await p.evaluate(()=>go('home',{force:true}));
  await capture('03-high-home-'+view.name+'.png');
  viewportChecks.push(await p.evaluate(()=>({screen:state.page,viewport:innerWidth+'×'+innerHeight,contentWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth})));
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await p.evaluate(()=>go('explore',{force:true}));
  await capture('04-high-explore-'+view.name+'.png');
  viewportChecks.push(await p.evaluate(()=>({screen:state.page,viewport:innerWidth+'×'+innerHeight,contentWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth})));
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await p.evaluate(()=>{const item=projects.find(p=>p.name==='Ateliê de cores');startBuilder(null,item)});
  await capture('10-high-builder-'+view.name+'.png');
  viewportChecks.push(await p.evaluate(()=>({screen:state.page,viewport:innerWidth+'×'+innerHeight,contentWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth})));
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const buttonBox=await p.locator('#placeBtn').boundingBox();assert.ok(buttonBox.x>=0&&buttonBox.x+buttonBox.width<=view.width+1);assert.ok(buttonBox.y>=0&&buttonBox.y+buttonBox.height<=view.height+1);
  if(view.name==='landscape'){
   const stageBox=await p.locator('.stage').boundingBox(),panelBox=await p.locator('.builder-panel').boundingBox();
   assert.ok(stageBox.height>=view.height*.65,'Landscape scene needs usable height');
   assert.ok(stageBox.x+stageBox.width<=panelBox.x+1,'Landscape controls must sit beside the scene');
   await assertVisibleTarget(p.locator('#placeBtn'),'Landscape confirmation');
   await assertLandscapeToolbar();
   viewportChecks.push({screen:'builder-layout',viewport:'844×390',stageHeight:stageBox.height,stageWidth:stageBox.width,confirmHeight:buttonBox.height,controlsBesideScene:true});
   await p.evaluate(()=>startBuilder('bridge'));
   await capture('11-high-builder-mission-landscape.png');
   await assertVisibleTarget(p.locator('#placeBtn'),'Mission confirmation before scrolling');
   await assertLandscapeToolbar();
   for(const sequence of [['ArrowLeft'],['ArrowRight'],['ArrowLeft','PageUp'],['PageUp'],['ArrowRight','PageUp']]){
    await p.locator('canvas').focus();await p.keyboard.press('Escape');
    for(const key of sequence)await p.keyboard.press(key);
    assert.equal(await p.locator('#placeBtn').isEnabled(),true);
    await assertVisibleTarget(p.locator('#placeBtn'),'Mission confirmation with a selected position');
    await p.locator('#placeBtn').click();
   }
   assert.deepEqual(await p.evaluate(()=>progress()),{done:5,total:5,complete:true});
   await p.locator('.builder-panel').evaluate(el=>{el.scrollTop=el.scrollHeight});
   await capture('12-high-builder-mission-complete-landscape.png');
   await assertVisibleTarget(p.locator('#placeBtn'),'Mission confirmation after scrolling');
   await assertVisibleTarget(p.locator('#missionResultBtn'),'Completed mission result');
   await assertLandscapeToolbar();
   viewportChecks.push({screen:'builder-mission',viewport:'844×390',completedPositions:5,confirmationVisibleAtBothScrollEnds:true,toolbarTargetsVisible:5,resultReachable:true});
  }
  await p.evaluate(()=>go('projects',{force:true}));
  await capture('08-high-projects-'+view.name+'.png');
  viewportChecks.push(await p.evaluate(()=>({screen:state.page,viewport:innerWidth+'×'+innerHeight,contentWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth})));
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await p.evaluate(()=>go('settings',{force:true}));
  await capture('09-high-settings-'+view.name+'.png');
  if(view.name==='mobile'){await p.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));await capture('09-high-settings-detail-mobile.png')}
  viewportChecks.push(await p.evaluate(()=>({screen:state.page,viewport:innerWidth+'×'+innerHeight,contentWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth})));
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 }
 checks.push('Home, explorar, construtor, projetos e ajustes sem rolagem horizontal em 1280×720, 412×915 e 844×390; painel lateral, confirmação sem recorte, cinco ferramentas visíveis e missão concluída em paisagem curta.');
 assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);assert.deepEqual(externalRequests,[]);
 checks.push('Nenhum erro JavaScript ou de console; nenhuma requisição HTTP/HTTPS externa.');
 const report={status:'passed',checks,errors,consoleErrors,externalRequests,viewportChecks,viewports:['1280×720','412×915','844×390'],examples:'As construções das capturas foram criadas ou importadas em contexto isolado de QA; não são dados de usuários e não acompanham o estado inicial.',scope:'Protótipo HTML; não certifica hardware, APK, RA ou câmera.',generatedAt:new Date().toISOString()};
 fs.writeFileSync(out+'prototype-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
