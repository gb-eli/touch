import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public');
const out=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../browser-artifacts');
await mkdir(out,{recursive:true});
const contentType={
  '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml',
  '.json':'application/json','.webmanifest':'application/manifest+json',
  '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp',
  '.woff2':'font/woff2'
};
const server=createServer(async(req,res)=>{
  try{
    const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const full=path.resolve(root,'.'+(name==='/'?'/index.html':name));
    if(full!==root&&!full.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
    const data=await readFile(full);
    res.writeHead(200,{'Content-Type':contentType[path.extname(full)]||'application/octet-stream',
      'Cache-Control':'no-store','Access-Control-Allow-Origin':'http://127.0.0.1'});
    res.end(data);
  }catch{res.writeHead(404);res.end('not found')}
});
await new Promise((resolve,reject)=>{
  server.once('error',reject);server.listen(0,'127.0.0.1',resolve);
});
const origin='http://127.0.0.1:'+server.address().port;
const report={origin,checks:[],issues:[]};
const note=(label,result,detail='')=>report.checks.push({label,result,detail});
let browser;
try{
  browser=await chromium.launch({channel:'chrome',headless:true,
    args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
  for(const profile of [
    {name:'mobile-390',width:390,height:844,scale:1},
    {name:'landscape-844',width:844,height:390,scale:1,smokeOnly:true},
    {name:'landscape-1024',width:1024,height:600,scale:1,smokeOnly:true},
    {name:'browser-1366',width:1366,height:630,scale:1,smokeOnly:true},
    {name:'wa86f-css-1280',width:1280,height:720,scale:3,smokeOnly:true},
    {name:'desktop-1920',width:1920,height:1080,scale:1},
    {name:'tv-3840',width:3840,height:2160,scale:1,smokeOnly:true}
  ]){
    const ctx=await browser.newContext({viewport:{width:profile.width,height:profile.height},
      deviceScaleFactor:profile.scale,serviceWorkers:'block',colorScheme:'dark'});
    await ctx.route('**/*',route=>{
      if(new URL(route.request().url()).origin===origin)return route.continue();
      return route.abort();
    });
    for(const [pageName,url] of [
      ['portal','/index.html'],['arcade','/arcade.html'],
      ['oficina','/oficina.html'],['admin','/admin.html']
    ]){
      const page=await ctx.newPage();
      page.setDefaultTimeout(8500);
      // Testes de jogos não devem disputar foco com a abertura automática do tutorial.
      if(pageName==='portal')await page.addInitScript(()=>{
        try{localStorage.setItem('tvt:tutorial:v2.1','done');sessionStorage.setItem('tvt:entry:v3','done')}catch{}
      });
      console.log('SMOKE START',profile.name,pageName);
      const errors=[];
      page.on('pageerror',e=>errors.push(String(e)));
      const response=await page.goto(origin+url,{waitUntil:'domcontentloaded',timeout:20000});
      assert.equal(response.status(),200,pageName+' HTTP status');
      await page.waitForTimeout(350);
      console.log('SMOKE LOADED',profile.name,pageName);
      const layout=await page.evaluate(()=>{
        const viewport=innerWidth;
        const offenders=[...document.querySelectorAll('body *')].map(el=>({
          el,rect:el.getBoundingClientRect()
        })).filter(({rect})=>rect.width>0&&rect.height>0&&rect.right>viewport+4)
          .sort((a,b)=>b.rect.right-a.rect.right).slice(0,14)
          .map(({el,rect})=>({tag:el.tagName,id:el.id,
            classes:String(el.className||'').slice(0,120),
            x:Math.round(rect.x),width:Math.round(rect.width),
            right:Math.round(rect.right),
            position:getComputedStyle(el).position,
            overflow:getComputedStyle(el).overflow}));
        return {viewport,scrollWidth:document.documentElement.scrollWidth,
          credit:!!document.querySelector('.agv-dev-credit'),
          stylesheet:[...document.styleSheets].some(x=>x.href?.includes('agv-design-system.css')),
          offenders};
      });
      assert.equal(layout.credit,true,pageName+' credit');
      assert.equal(layout.stylesheet,true,pageName+' design system');
      if(pageName!=='admin'){
        assert.equal(await page.evaluate(()=>typeof window.AGVGameExperience?.createSession),'function',
          pageName+' shared game engine');
      }
      const overflow=Math.max(0,layout.scrollWidth-layout.viewport);
      if(overflow>16)report.issues.push({pageName,profile:profile.name,
        type:'horizontal-overflow',pixels:overflow});
      note(profile.name+' '+pageName+' loaded','pass',JSON.stringify(layout));
      if((profile.width>=1920||(profile.width>=760&&profile.height<=650))&&['portal','oficina','arcade'].includes(pageName)){
        const fit=await page.evaluate(name=>{
          const selector=name==='portal'?'.studio-home':name==='oficina'?'.oficina-panel':'.arcade-panel';
          const rect=document.querySelector(selector)?.getBoundingClientRect();
          return {top:rect?.top,bottom:rect?.bottom,viewport:innerHeight,
            docHeight:document.documentElement.scrollHeight,
            tileRows:[...document.querySelectorAll('.studio-tiles > .studio-tile')].map(t=>Math.round(t.getBoundingClientRect().height)),
            tileCount:document.querySelectorAll('.studio-tiles > .studio-tile').length,
            calibrator:!!document.querySelector('.tile-calibration[data-go="diagnostico"]')};
        },pageName);
        assert.ok(fit.top>=-1&&fit.bottom<=fit.viewport+2,
          pageName+' painel deve caber verticalmente na tela do tablet: '+JSON.stringify(fit));
        if(pageName==='portal'){
          assert.equal(fit.tileCount,6,'início deve mostrar 6 blocos na tela');
          assert.ok(fit.top<=Math.max(105,fit.viewport*.08),'a barra contextual não pode consumir o topo: '+JSON.stringify(fit));
          assert.ok(Math.min(...fit.tileRows)>=65,'cartões devem ser realmente utilizáveis em paisagem: '+JSON.stringify(fit));
          assert.equal(fit.calibrator,true,'acesso ao diagnóstico do touch deve estar na tela inicial');
        }
        note(profile.name+' '+pageName+' app sem deslocamento do painel','pass',JSON.stringify(fit));
        const landscape=await page.evaluate(name=>{
          const root=name==='portal'?document.querySelector('.studio-home'):
            name==='oficina'?document.querySelector('#oficinaMain'):document.querySelector('.arcade-shell .arcade-panel');
          const rect=root?.getBoundingClientRect();
          const dock=name==='portal'?document.querySelector('.sidebar')?.getBoundingClientRect():null;
          const tiles=name==='portal'?document.querySelector('.studio-tiles')?.getBoundingClientRect():null;
          return {active:document.body.classList.contains('agv-landscape-app'),
            h:innerHeight,w:innerWidth,rootTop:rect?.top,rootBottom:rect?.bottom,
            dockTop:dock?.top,tilesBottom:tiles?.bottom,
            bodyOverflow:getComputedStyle(document.body).overflow};
        },pageName);
        assert.equal(landscape.active,true,'paisagem app ativa: '+JSON.stringify(landscape));
        assert.ok(landscape.rootBottom<=landscape.h+3,'app cabe na viewport real: '+JSON.stringify(landscape));
        if(pageName==='portal'){
          assert.ok(landscape.tilesBottom<=landscape.dockTop-2,'cartões não podem ficar atrás do dock: '+JSON.stringify(landscape));
          assert.equal(landscape.bodyOverflow,'hidden','home sem rolagem em paisagem');
        }
        note(profile.name+' '+pageName+' visual viewport real','pass',JSON.stringify(landscape));
      }
      if(pageName==='portal'&&profile.width>=760&&profile.height<=720){
        const targets=await page.evaluate(()=>{
          const list=selector=>[...document.querySelectorAll(selector)]
            .map(el=>Math.round(el.getBoundingClientRect().height));
          return {
            shortcuts:list('.home-shortcuts > button, .home-shortcuts > a'),
            navbar:list('.sidebar .nav-item'),
            fullscreen:list('#fullscreenButton'),
            theme:list('.theme-switch button'),
            header:list('.topbar'),
            authorCreditDisplay:getComputedStyle(document.querySelector('body > .agv-dev-credit')).display
          };
        });
        for(const key of ['shortcuts','navbar','fullscreen','theme']){
          assert.ok(targets[key].length>0,'missing touch controls '+key);
          assert.ok(Math.min(...targets[key])>=44,
            'touch targets >=44 CSS px '+key+': '+JSON.stringify(targets));
        }
        assert.ok(targets.header[0]>=56,'topbar accommodates targets: '+JSON.stringify(targets));
        assert.equal(targets.authorCreditDisplay,'none',
          'author credit must not cover bottom dock in landscape: '+JSON.stringify(targets));
        note(profile.name+' landscape >=44px hit targets and dock clearance','pass',JSON.stringify(targets));
      }
      if(pageName==='portal'&&profile.width>=760&&profile.height<=650){
        const shortcuts=await page.evaluate(()=>{
          const root=document.querySelector('.home-shortcuts');
          const items=[...root.querySelectorAll(':scope > button, :scope > a')];
          const rects=items.map(el=>el.getBoundingClientRect());
          return {
            count:items.length,
            arcades:items.filter(el=>el.matches('a[href="arcade.html"]')).length,
            replays:items.filter(el=>el.matches('[data-touch-replay]')).length,
            tops:rects.map(r=>Math.round(r.top)),
            minHeight:Math.min(...rects.map(r=>r.height)),
            bottoms:rects.map(r=>Math.round(r.bottom))
          };
        });
        assert.equal(shortcuts.count,8,'launcher deve ter 8 atalhos sem Arcade duplicado: '+JSON.stringify(shortcuts));
        assert.equal(shortcuts.arcades,1,'somente um Arcade');
        assert.equal(shortcuts.replays,1,'reabrir teste de toque permanece disponível');
        assert.ok(Math.max(...shortcuts.tops)-Math.min(...shortcuts.tops)<=3,
          'atalhos precisam ficar em uma unica linha na paisagem: '+JSON.stringify(shortcuts));
        assert.ok(shortcuts.minHeight>=27,'alvos touch nao podem ficar pequenos: '+JSON.stringify(shortcuts));
        note(profile.name+' launcher 8 atalhos em uma linha','pass',JSON.stringify(shortcuts));
      }
      if(pageName==='oficina'&&profile.width>=760&&profile.height<=650){
        const scene=await page.evaluate(()=>{
          const rect=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};
          return {scene:rect(document.querySelector('.voxel-scene')),
            canvas:rect(document.querySelector('#voxelCanvas')),
            panel:rect(document.querySelector('.oficina-panel')),
            closed:document.querySelectorAll('.oficina-board.voxel-active > details:not([open])').length,
            visibleTop:rect(document.querySelector('.voxel-scene')).y};
        });
        assert.ok(scene.canvas.height>=115,
          'canvas 3D exige area visivel util mesmo no tablet horizontal: '+JSON.stringify(scene));
        assert.ok(scene.scene.height>=115,
          'a cena nao pode colapsar por controles: '+JSON.stringify(scene));
        assert.ok(scene.canvas.bottom<=scene.panel.bottom-12,
          'canvas 3D precisa estar dentro do painel: '+JSON.stringify(scene));
        assert.equal(scene.closed,2,'mapa e coordenadas ficam recolhidos por padrao');
        note(profile.name+' canvas 3D ocupa area util','pass',JSON.stringify(scene));
      }
      if(['portal','oficina','arcade'].includes(pageName)&&profile.width>=760&&profile.height<=650){
        const toggleId=pageName==='portal'?'#fullscreenButton':pageName==='oficina'?'#oficinaFullscreen':'#arcadeFullscreen';
        assert.equal(await page.locator(toggleId).getAttribute('data-touch-fullscreen'),'','controle de tela cheia disponível');
        await page.locator(toggleId).click();
        await page.waitForTimeout(120);
        assert.equal(await page.evaluate(()=>document.fullscreenElement===document.documentElement),true,
          'a tela cheia deve expandir a interface toda: '+pageName);
        assert.equal(await page.locator('#agvFullscreenExit').isVisible(),true,'saída de tela cheia acessível');
        await page.locator('#agvFullscreenExit').click();
        await page.waitForTimeout(80);
        assert.equal(await page.evaluate(()=>Boolean(document.fullscreenElement)),false,'sair da tela cheia restaura o navegador');
        note(profile.name+' '+pageName+' tela cheia real / sair','pass');
      }
      if(pageName==='portal'){
        const skip=page.locator('#tvtEntrySkip');
        if(await skip.isVisible())await skip.click({timeout:3500}).catch(()=>{});
        await page.waitForTimeout(180);
        if(!profile.smokeOnly){
          // O tutorial segue disponível e testável pelo comando explícito.
          await page.evaluate(()=>window.TVTouchTutorial.open());
          assert.equal(await page.locator('#tvtTutorial').evaluate(el=>el.open),true);
          await page.locator('#tvtTourClose').click();
          assert.equal(await page.locator('#tvtTutorial').evaluate(el=>el.open),false);
          note(profile.name+' Tutorial abre e fecha','pass');
          await page.evaluate(()=>window.TVTouchNavigation.go('memoria'));
          const portalSound=page.locator('#page-memoria [data-agv-game-sound]');
          await portalSound.click();
          assert.equal(await portalSound.getAttribute('aria-pressed'),'true');
          const pair=await page.locator('#memoryGrid [data-pair]').first().getAttribute('data-pair');
          await page.locator('#memoryGrid [data-pair="'+pair+'"]').nth(0).click();
          await page.locator('#memoryGrid [data-pair="'+pair+'"]').nth(1).click();
          assert.match(await page.locator('#memoryMessage').textContent(),/Par encontrado|Concluído/);
          note(profile.name+' Memória: som e par correto','pass');
          await page.evaluate(()=>window.TVTouchNavigation.tool('encaixe'));
          const piece=await page.locator('#puzzlePieces [data-piece]').first().getAttribute('data-piece');
          await page.locator('#puzzlePieces [data-piece="'+piece+'"]').click();
          await page.locator('#puzzleSlots [data-slot="'+piece+'"]').click();
          assert.match(await page.locator('#puzzleMessage').textContent(),/Encaixe correto|Nível completo/);
          note(profile.name+' Encaixe: resposta correta','pass');
          await page.evaluate(()=>window.TVTouchNavigation.tool('porto'));
          await page.locator('#quizAnswers [data-answer="1"]').click();
          assert.match(await page.locator('#quizFeedback').textContent(),/Resposta correta/);

          note(profile.name+' Porto: feedback pedagógico','pass');
          await page.evaluate(()=>window.TVTouchNavigation.go('inicio'));
        }
      }
      if(pageName==='arcade'&&!profile.smokeOnly){
        console.log('SMOKE ARCADE',profile.name);
        assert.equal(await page.locator('#arcadeCanvas').count(),1);
        assert.equal(await page.locator('#arcadeSound').count(),1);
        await page.locator('#arcadePlay').click();
        await page.waitForTimeout(120);
        const status=await page.locator('#arcadePlay').textContent();
        note(profile.name+' Arcade inicia','pass',status?.trim());
        await page.locator('#arcadeSound').click();
        const sound=await page.locator('#arcadeSound').getAttribute('aria-pressed');
        note(profile.name+' Arcade sound UI','pass','aria-pressed='+sound);
        assert.equal(await page.evaluate(()=>window.AGVGameExperience.soundEnabled()),true);
        assert.equal(await page.evaluate(()=>typeof window.AGVArcadePhysics?.poolStep),'function');
        await page.locator('#arcadeRestart').click();
        await page.locator('[data-game="basket"]').click();
        await page.locator('#arcadePlay').click();
        const arcadeCanvas=page.locator('#arcadeCanvas');
        await arcadeCanvas.scrollIntoViewIfNeeded();
        const court=await arcadeCanvas.boundingBox();
        assert.ok(court,'basket canvas rect');
        const fromX=court.x+court.width*210/960,fromY=court.y+court.height*440/540;
        await page.mouse.move(fromX,fromY);
        await page.mouse.down();
        await page.mouse.move(fromX+court.width*330/960,fromY-court.height*360/540,{steps:12});
        await page.mouse.up();
        assert.match(await page.locator('#arcadeScore').textContent(),/\/ 1/,
          'basket throw registered');
        note(profile.name+' Basquete: drag e arremesso','pass');
        await page.locator('[data-game="pool"]').click();
        await page.locator('#arcadePlay').click();
        assert.equal(await page.evaluate(()=>window.AGVArcadePhysics.TABLE.pockets.length),6);
        note(profile.name+' Sinuca: motor de caçapas carregado','pass');
      }
      if(pageName==='oficina'&&!profile.smokeOnly){
        console.log('SMOKE OFICINA',profile.name);
        await page.locator('[data-oficina="builder3d"]').click();
        assert.equal(await page.locator('#voxelCanvas').count(),1);
        await page.waitForTimeout(320);
        const webgl=await page.locator('#voxelCanvas').evaluate(c=>({
          available:!!c.getContext('webgl'),w:c.width,h:c.height
        }));
        assert.equal(webgl.available,true,'WebGL deve iniciar no Chrome de CI');
        assert.ok(webgl.w*webgl.h>10000,'Canvas 3D desenhado');
        const canvasRect=await page.locator('#voxelCanvas').boundingBox();
        assert.ok(canvasRect.width>Math.min(900,profile.width*.75),
          'Canvas 3D deve preencher horizontalmente a Oficina');
        note(profile.name+' Construção 3D WebGL','pass',JSON.stringify(webgl));
        await page.locator('[data-voxel-material="stone"]').click();
        await page.locator('.voxel-access-grid summary').click();
        const spot=page.locator('[data-voxel-cell="3,3"]');
        await spot.click();await spot.click();
        assert.match(await page.locator('#voxelCounter').textContent(),/^2 blocos/);
        await page.locator('.voxel-project-details summary').click();
        await page.locator('[data-voxel-action="undo"]').click();
        assert.match(await page.locator('#voxelCounter').textContent(),/^1 blocos/);
        await page.locator('[data-voxel-action="redo"]').click();
        await page.locator('[data-voxel-action="save"]').click();
        await page.locator('[data-voxel-action="clear"]').click();
        assert.match(await page.locator('#voxelCounter').textContent(),/^0 blocos/);
        await page.locator('[data-voxel-action="load"]').click();
        await page.locator('.voxel-project-details summary').click();
        assert.match(await page.locator('#voxelCounter').textContent(),/^2 blocos/);
        await page.locator('#voxelMission').selectOption('tower');
        await spot.click();await spot.click();await spot.click();
        assert.match(await page.locator('#voxelMissionStatus').textContent(),/5 \/ 5/);
        note(profile.name+' Construção 3D: histórico, persistência explícita e missão','pass');
        await page.locator('.voxel-access-grid summary').click();
        await page.locator('#voxelCanvas').scrollIntoViewIfNeeded();
        await page.waitForTimeout(180);
        await page.screenshot({path:path.join(out,profile.name+'-builder3d.png'),
          animations:'disabled',fullPage:false});
        await page.locator('.voxel-project-details summary').click();
        await page.locator('[data-voxel-action="2d"]').click();
        assert.equal(await page.locator('[data-column]').count(),8,'fallback 2D acessível');
        note(profile.name+' Construção 3D para 2D','pass');
        await page.locator('#oficinaSound').click();
        assert.equal(await page.evaluate(()=>window.AGVGameExperience.soundEnabled()),true);
        await page.locator('[data-oficina="ttt"]').click();
        assert.equal((await page.locator('#oficinaTitle').textContent()).trim(),'Jogo da velha');
        await page.locator('[data-square="0"]').click();
        await page.waitForTimeout(1100);
        const marks=await page.locator('.mark-x, .mark-o').count();
        assert.equal(marks,2,'CPU respondeu ao jogador');
        note(profile.name+' Jogo da Velha 2 turnos','pass');
        await page.locator('[data-oficina="checkers"]').click();
        assert.equal(await page.locator('[data-checker]').count(),64);
        note(profile.name+' Damas 64 casas','pass');
        await page.locator('[data-oficina="puzzle"]').click();
        assert.equal(await page.locator('.oficina-puzzle button').count(),9);
        note(profile.name+' Quebra-cabeça 3x3','pass');
        await page.locator('[data-oficina="pattern"]').click();
        assert.equal(await page.locator('[data-dot]').count(),9);
        note(profile.name+' Conexões nove pontos','pass');
        await page.locator('[data-oficina="blocks"]').click();
        assert.equal(await page.locator('[data-column]').count(),8);
        await page.locator('[data-column="0"]').click();
        assert.equal(await page.locator('[data-column="0"] .oficina-cube').count(),1);
        const source=await page.locator('[data-column="0"] .oficina-cube').boundingBox();
        const dest=await page.locator('[data-column="1"]').boundingBox();
        assert.ok(source&&dest,'block drag coordinates available');
        await page.mouse.move(source.x+source.width/2,source.y+source.height/2);
        await page.mouse.down();
        await page.mouse.move(dest.x+dest.width/2,dest.y+dest.height/2,{steps:8});
        await page.mouse.up();
        assert.equal(await page.locator('[data-column="1"] .oficina-cube').count(),1,
          'bloco movido de coluna no mouse');
        assert.equal(await page.locator('[data-column="1"] .oficina-cube.landed').count(),1,
          'somente último bloco recebe animação');
        note(profile.name+' Construção: animação localizada','pass');
        note(profile.name+' Blocos toque e arraste','pass');
      }
      if(profile.name==='tv-3840'&&pageName==='oficina'){
        assert.equal(await page.locator('#voxelCanvas').count(),1);
        await page.evaluate(()=>{
          document.querySelector('[data-voxel-cell="3,3"]')?.click();
        });
        await page.waitForTimeout(350);
        const buffer=await page.locator('#voxelCanvas').evaluate(c=>({
          webgl:!!c.getContext('webgl'),pixels:c.width*c.height,
          width:c.width,height:c.height
        }));
        assert.equal(buffer.webgl,true,'WebGL 4K obrigatório');
        assert.ok(buffer.pixels>10000&&buffer.pixels<=3200000,
          'Orçamento GPU do construtor deve permanecer <= 3,2 MP');
        const rect=await page.locator('#voxelCanvas').boundingBox();
        assert.ok(rect.width>1200,'Cena 3D muito estreita para a TV 4K');
        note('tv-3840 WebGL voxel buffer','pass',JSON.stringify(buffer));
      }
      if(profile.name==='tv-3840'&&pageName==='arcade'){
        const buffer=await page.locator('#arcadeCanvas').evaluate(c=>{
          const r=c.getBoundingClientRect();
          return {pixels:c.width*c.height,width:c.width,height:c.height,
            cssWidth:Math.round(r.width),cssHeight:Math.round(r.height)};
        });
        assert.ok(buffer.pixels<=3840*2160,'Canvas deve respeitar limite de 4K');
        note('tv-3840 Arcade canvas buffer','pass',JSON.stringify(buffer));
      }
      if(pageName==='portal'&&profile.name==='wa86f-css-1280'){
        await page.evaluate(()=>window.TVTouchNavigation.go('diagnostico'));
        await page.waitForTimeout(260);
        // Interações simuladas validam o código. Não equivalem ao toque físico na WA86F.
        await page.evaluate(()=>{
          const zone=document.querySelector('#diagTouchZone');
          document.querySelector('#diagStartTouch').click();
          const send=(name,id,x)=>zone.dispatchEvent(new PointerEvent(name,{
            bubbles:true,cancelable:true,pointerType:'touch',pointerId:id,
            clientX:x,clientY:120
          }));
          send('pointerdown',11,100);
          send('pointerdown',12,200);
          send('pointermove',11,40);   // afastar
          send('pointermove',11,130);  // aproximar
          send('pointerup',11,130);
          send('pointerup',12,200);
        });
        await page.waitForTimeout(8100);
        const pinch=await page.evaluate(()=>({
          result:document.querySelector('#diagTouchResult').textContent,
          pinchCard:[...document.querySelectorAll('#diagOverview .diag-data')]
            .find(card=>card.textContent.includes('Pinça (teste prático)'))?.textContent,
          recommendation:document.querySelector('#diagRecommendations').textContent
        }));
        assert.match(pinch.result,/Máximo detectado: 2 toque/);
        assert.match(pinch.result,/Pinça observada: afastar e aproximar/);
        assert.match(pinch.pinchCard||'',/afastar e aproximar/);
        assert.match(pinch.recommendation,/Movimentos de pinça observados/);
        note('WA86F layout: pinça bidirecional simulada no Chrome, NÃO validada na TV','pass',JSON.stringify(pinch));
        const diagnostic=await page.evaluate(()=>{
          const area=document.querySelector('main#conteudo');
          const last=document.querySelector('#page-diagnostico > .notice:last-child');
          const dock=document.querySelector('.sidebar');
          area.scrollTop=area.scrollHeight;
          return new Promise(resolve=>requestAnimationFrame(()=>{
            resolve({
              screen:[innerWidth,innerHeight],
              ratio:devicePixelRatio,
              overflowY:getComputedStyle(area).overflowY,
              scrollTop:area.scrollTop,
              scrollHeight:area.scrollHeight,
              clientHeight:area.clientHeight,
              lastBottom:last.getBoundingClientRect().bottom,
              dockTop:dock.getBoundingClientRect().top,
              visible:document.querySelector('#page-diagnostico').classList.contains('active'),
              css:!![...document.styleSheets].find(s=>s.href?.includes('diagnostico-tv.css'))
            });
          }));
        });
        assert.deepEqual(diagnostic.screen,[1280,720],'configuracao CSS da TV observada');
        assert.equal(diagnostic.ratio,3,'escala 3x identificada');
        assert.equal(diagnostic.visible,true,'rota de diagnostico visivel');
        assert.equal(diagnostic.css,true,'correcao da TV carregada');
        assert.equal(diagnostic.overflowY,'auto','diagnostico deve rolar dentro do app');
        assert.ok(diagnostic.scrollHeight>diagnostic.clientHeight+200,
          'diagnostico longo deve continuar rolavel: '+JSON.stringify(diagnostic));
        assert.ok(diagnostic.scrollTop>100,'rolagem interna deve chegar ao final: '+JSON.stringify(diagnostic));
        assert.ok(diagnostic.lastBottom<=diagnostic.dockTop-9,
          'ultimo aviso deve ficar acima do dock: '+JSON.stringify(diagnostic));
        note('wa86f CSS 1280x720 DPR3: diagnostico ate o fim, sem sobreposicao','pass',JSON.stringify(diagnostic));
      }
      const large=profile.smokeOnly===true;
      await page.screenshot({path:path.join(out,profile.name+'-'+pageName+(large?'.jpg':'.png')),
        type:large?'jpeg':'png',quality:large?78:undefined,
        animations:'disabled',fullPage:false,timeout:large?45000:12000});
      console.log('SMOKE SCREENSHOT',profile.name,pageName);
      if(errors.length)report.issues.push({pageName,profile:profile.name,type:'runtime-errors',errors});
      await page.close();
      console.log('SMOKE COMPLETE',profile.name,pageName);
    }
    await ctx.close();
  }
  assert.deepEqual(report.issues.filter(x=>x.type==='runtime-errors'),[],
    'JavaScript errors present in browser');
  assert.deepEqual(report.issues.filter(x=>x.type==='horizontal-overflow'),[],
    'Horizontal overflow present in browser');
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
  await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
