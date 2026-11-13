(() => {
  'use strict';
  const doc=document;
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  const saving=()=>navigator.connection?.saveData===true;
  const mobile=()=>window.innerWidth<700;
  const seed={value:22391};
  function rand(){seed.value=(seed.value*48271)%2147483647;return seed.value/2147483647;}
  let canvas,ctx,width=0,height=0,raf=0,last=0,nodes=[],edges=[],bursts=[],enabled=false;
  const T=6.283185307179586;
  function initialize(){
    if(doc.getElementById('agvSynapseField'))return;
    canvas=doc.createElement('canvas');canvas.id='agvSynapseField';
    canvas.setAttribute('aria-hidden','true');
    canvas.setAttribute('role','presentation');
    const backdrop=doc.createElement('div');backdrop.id='agvCrystalBackdrop';backdrop.setAttribute('aria-hidden','true');
    doc.body.insertBefore(backdrop,doc.body.firstChild);
    doc.body.insertBefore(canvas,backdrop.nextSibling);
    ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
    if(!ctx)return;
    layout();
    window.addEventListener('resize',layout,{passive:true});
    doc.addEventListener('visibilitychange',visibility);
    doc.addEventListener('pointerdown',spark,{passive:true});
    if(reduced()||saving()){draw(0);return}
    enabled=true;raf=window.requestAnimationFrame(frame);
  }
  function layout(){
    if(!canvas||!ctx)return;
    width=window.innerWidth;height=window.innerHeight;
    const scale=Math.min(window.devicePixelRatio||1,1.4);
    const density=Math.min(scale,Math.sqrt(2073600/Math.max(1,width*height)));
    canvas.width=Math.max(1,Math.round(width*density));
    canvas.height=Math.max(1,Math.round(height*density));
    ctx.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);
    const count=mobile()?29:Math.min(78,Math.max(45,Math.round(width*height/23000)));
    nodes=[];
    for(let i=0;i<count;i++){
      nodes.push({x:rand()*width,y:rand()*height,vx:(rand()-.5)*.30,vy:(rand()-.5)*.30,r:rand()*2+0.7,phase:rand()*T,light:rand()>.72});
    }
    edges=[];
    const distance=mobile()?115:Math.min(210,width*.16);
    for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
      const dx=nodes[i].x-nodes[j].x,dy=nodes[i].y-nodes[j].y;
      if(dx*dx+dy*dy<distance*distance&&rand()>.48)edges.push([i,j]);
    }
    draw(0);
  }
  function visibility(){
    if(doc.hidden&&raf){window.cancelAnimationFrame(raf);raf=0;return}
    if(!doc.hidden&&enabled&&!raf){last=0;raf=window.requestAnimationFrame(frame)}
  }
  function spark(event){
    if(reduced()||saving()||doc.hidden||doc.documentElement.dataset.tvtIntro==='active')return;
    if(!event.target?.closest?.('button, a, .studio-tile, .resource-card, [data-nav], [data-go]'))return;
    if(event.target.closest('.arcade-scene, canvas, input, select, textarea'))return;
    const x=event.clientX,y=event.clientY;
    for(let i=0;i<9;i++){
      const angle=rand()*T,speed=1+rand()*2.7;
      bursts.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1,orange:i%2===0});
    }
    if(bursts.length>96)bursts=bursts.slice(-96);
  }
  function draw(time){
    if(!ctx||!width||!height)return;
    ctx.clearRect(0,0,width,height);
    const active=!reduced()&&!saving()&&doc.documentElement.dataset.tvtIntro!=='active';
    const drift=active?time*.0004:0;
    const coords=nodes.map(n=>({
      x:n.x+Math.sin(drift+n.phase)*9,
      y:n.y+Math.cos(drift*.75+n.phase)*10
    }));
    ctx.save();
    ctx.lineWidth=0.85;
    for(let k=0;k<edges.length;k++){
      const [a,b]=edges[k],p=coords[a],q=coords[b];
      ctx.strokeStyle=k%7===0?'rgba(255,102,65,.23)':'rgba(118,199,255,.15)';
      ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
    }
    for(let i=0;i<coords.length;i++){
      const n=nodes[i],p=coords[i],alpha=.19+(.5+.5*Math.sin(drift*1.8+n.phase))*.25;
      ctx.beginPath();ctx.arc(p.x,p.y,n.r,0,T);
      ctx.fillStyle=n.light?'rgba(255,143,112,'+alpha+')':'rgba(155,220,255,'+alpha+')';
      ctx.fill();
      if(i%8===0){
        const r=mobile()?8:14,dx=Math.cos(n.phase)*r,dy=Math.sin(n.phase)*r;
        ctx.beginPath();ctx.moveTo(p.x-dx,p.y-dy);ctx.lineTo(p.x+r,p.y-r*.65);ctx.lineTo(p.x+dx*.35,p.y+r);
        ctx.closePath();
        ctx.fillStyle=i%16===0?'rgba(255,116,90,.09)':'rgba(152,140,255,.08)';
        ctx.fill();
        ctx.strokeStyle='rgba(208,230,255,.15)';
        ctx.stroke();
      }
    }
    if(active){
      for(let i=bursts.length-1;i>=0;i--){
        const b=bursts[i];b.x+=b.vx;b.y+=b.vy;b.life-=.035;
        if(b.life<=0){bursts.splice(i,1);continue}
        ctx.fillStyle=b.orange?'rgba(255,125,70,'+b.life+')':'rgba(112,230,255,'+b.life+')';
        ctx.beginPath();ctx.arc(b.x,b.y,Math.max(.3,2*b.life),0,T);ctx.fill();
      }
    }
    ctx.restore();
  }
  function frame(now){
    raf=0;
    if(doc.hidden)return;
    const interval=doc.querySelector('.arcade-shell')?90:34;
    if(!last||now-last>=interval){draw(now);last=now}
    raf=window.requestAnimationFrame(frame);
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
})();
