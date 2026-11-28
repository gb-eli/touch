const {chromium}=require("playwright");
const fs=require("fs");
const path=require("path");
const assert=require("node:assert/strict");
(async()=>{
    const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||"/usr/bin/google-chrome",args:["--no-sandbox"]});
    const file="file://"+path.resolve("docs/app-design/03-studio-prism-high-fidelity.html");
    const dir=path.resolve(process.env.TV_TOUCH_PRISM_OUTPUT||"browser-artifacts/prism");
    fs.mkdirSync(dir,{recursive:true});
    let checks=0;
    try{
        for(const [width,height,name] of [[360,780,"compact-360"],[412,915,"s25-412"],[844,390,"landscape-844"],[1366,768,"desktop-1366"]]){
            const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
            const errors=[],requests=[];
            page.on("pageerror",err=>errors.push(err.message));
            page.on("console",msg=>{if(msg.type()==="error")errors.push(msg.text());});
            page.on("request",request=>{if(!request.url().startsWith("file:"))requests.push(request.url());});
            await page.goto(file);
            await page.locator(".page.active#home").waitFor();
            assert.equal(await page.locator(".bottomnav").isVisible(),width<=650);
            checks++;
            const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
            assert.ok(overflow<=1,"Horizontal clipping at "+name+": "+overflow);checks++;
            const home=await page.locator(".hero").boundingBox();
            assert.ok(home&&home.width>180&&home.x>=0&&home.x+home.width<=width+1,"Hero clipped "+name);checks++;
            await page.locator("#desktopnav [data-page=library]").evaluate(el=>el.click());
            await page.locator(".page.active#library").waitFor();
            assert.equal(await page.locator("#templates .card").count(),6);checks++;
            await page.locator("#templates .card button").first().click();
            await page.locator(".page.active#builder").waitFor();
            const count=await page.locator("#builder-count").innerText();
            assert.match(count,/\d+ blocos/);checks++;
            await page.locator(".dock .place").click();
            const after=await page.locator("#builder-count").innerText();
            assert.notEqual(after,count);checks++;
            await page.getByRole("button",{name:"Salvar",exact:true}).last().click();
            await page.locator(".page.active#projects").waitFor();
            assert.equal(await page.locator("#project-cards .card").count(),1);checks++;
            await page.locator("#project-cards .star").click();
            await page.locator("#fav-btn").click();
            assert.equal(await page.locator("#project-cards .card").count(),1);checks++;
            await page.locator("#desktopnav [data-page=explore]").evaluate(el=>el.click());
            await page.locator(".page.active#explore").waitFor();
            assert.equal(await page.locator("#missions .card").count(),4);checks++;
            await page.screenshot({path:path.join(dir,name+".png"),fullPage:true});
            assert.deepEqual(errors,[],"JS/console error "+name);checks++;
            assert.deepEqual(requests,[],"Network request from offline prototype "+name);checks++;
            await page.close();
        }
        fs.writeFileSync(path.join(dir,"report.json"),JSON.stringify({status:"passed",checks,viewports:["360x780","412x915","844x390","1366x768"],externalRequests:0,consoleErrors:0},null,2));
        console.log("Studio Prism prototype passed: "+checks+" browser assertions");
    } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
