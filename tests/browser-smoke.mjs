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
      if(pageName==='portal'){
        const skip=page.locator('#tvtEntrySkip');
        if(await skip.isVisible())await skip.click({timeout:3500}).catch(()=>{});
        await page.waitForTimeout(180);
        if(!profile.smokeOnly){
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
          const portoFeedback=await page.locator('#quizFeedback').textContent();
          const portoDiagnostic=await page.evaluate(()=>({
            activeTool:window.TVTouchNavigation?.activeTool?.(),
            feedbackHidden:document.getElementById('quizFeedback')?.hidden,
            feedbackHTML:document.getElementById('quizFeedback')?.innerHTML,
            question:document.getElementById('quizQuestion')?.textContent,
            answers:[...document.querySelectorAll('#quizAnswers [data-answer]')].map(el=>({
              id:el.dataset.answer,disabled:el.disabled,classes:el.className
            })),
            page:window.TVTouchNavigation?.current?.()
          }));
          console.log('PORTO DIAGNOSTIC',profile.name,JSON.stringify({portoDiagnostic,errors}));
          assert.match(portoFeedback,/Resposta correta/);
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
        await page.locator('#arcadeRestart').click();
      }
      if(pageName==='oficina'&&!profile.smokeOnly){
        console.log('SMOKE OFICINA',profile.name);
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
        note(profile.name+' Blocos toque e arraste','pass');
      }
      if(profile.smokeOnly&&pageName==='arcade'){
        const buffer=await page.locator('#arcadeCanvas').evaluate(c=>{
          const r=c.getBoundingClientRect();
          return {pixels:c.width*c.height,width:c.width,height:c.height,
            cssWidth:Math.round(r.width),cssHeight:Math.round(r.height)};
        });
        note('tv-3840 Arcade canvas buffer','pass',JSON.stringify(buffer));
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
