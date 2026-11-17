/* AGV TOUCH Studio 3.4 — física determinística leve, independente de Canvas/DOM.
   Mantém os jogos bidimensionais; suporte 4K depende do renderizador adaptativo. */
(() => {
  'use strict';
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const G=720;
  const HOOP=Object.freeze({y:237,left:700,right:794,rimRadius:8,ballRadius:24});
  function basketLaunch(dx,dy){
    const x=Number(dx)||0,y=Number(dy)||0;
    return {vx:clamp(x*1.12,120,880),vy:clamp(y*1.9,-980,-170)};
  }
  function basketStep(ball,dt){
    const n={...ball};
    const step=clamp(dt,0,.05);
    const previousY=n.y;
    n.vy+=G*step;
    n.x+=n.vx*step;n.y+=n.vy*step;
    let rim=false,scored=false,floor=false;
    // Impactos elásticos com as bordas do aro; a parte central permanece aberta.
    for(const rx of [HOOP.left,HOOP.right]){
      const dx=n.x-rx,dy=n.y-HOOP.y;
      const limit=HOOP.rimRadius+HOOP.ballRadius,dist=Math.hypot(dx,dy);
      if(dist<limit&&dist>1e-5){
        const nx=dx/dist,ny=dy/dist,normal=n.vx*nx+n.vy*ny;
        n.x=rx+nx*(limit+.2);n.y=HOOP.y+ny*(limit+.2);
        if(normal<0){
          n.vx-=1.46*normal*nx;n.vy-=1.46*normal*ny;rim=true;
        }
      }
    }
    // Cruza o plano da cesta na DESCIDA, com centro inteiramente no vão.
    scored=!rim&&previousY<HOOP.y&&n.y>=HOOP.y&&n.vy>0&&
      n.x>HOOP.left+HOOP.ballRadius&&n.x<HOOP.right-HOOP.ballRadius;
    if(n.y>=462){n.y=462;if(n.vy>0){n.vy=-n.vy*.36;n.vx*=.78;floor=true;}}
    return {ball:n,scored,rim,floor};
  }
  function basketPreview(x,y,vx,vy,{duration=2.65,step=.045}={}){
    let ball={x,y,vx,vy},scored=false;
    const points=[{x,y}];
    for(let time=0;time<duration;time+=step){
      const result=basketStep(ball,step);
      ball=result.ball;points.push({x:ball.x,y:ball.y});
      if(result.scored){scored=true;break}
      if(ball.x>980||ball.x<-20||(result.floor&&ball.y>=462))break;
    }
    return {points,scored};
  }

  const TABLE=Object.freeze({left:112,right:848,top:95,bottom:445,pocketRadius:25,
    pockets:Object.freeze([{x:98,y:82},{x:480,y:82},{x:862,y:82},
      {x:98,y:458},{x:480,y:458},{x:862,y:458}])});
  function pocketFor(ball){
    return TABLE.pockets.find(p=>Math.hypot(ball.x-p.x,ball.y-p.y)<TABLE.pocketRadius)||null;
  }
  function poolStep(balls,dt){
    // Quatro a oito sub-passos evitam atravessar bolas de 24 px em tacadas rápidas.
    const steps=clamp(Math.ceil(clamp(dt,0,.05)/.007),1,8),h=clamp(dt,0,.05)/steps;
    const out={pocketed:[],scratch:false,collisions:0,bounces:0};
    for(let k=0;k<steps;k++){
      const active=balls.filter(b=>!b.pocketed);
      const damp=Math.exp(-2.05*h);
      for(const b of active){
        b.x+=b.vx*h;b.y+=b.vy*h;
        b.vx*=damp;b.vy*=damp;
        if(Math.hypot(b.vx,b.vy)<5){b.vx=0;b.vy=0}
        if(pocketFor(b)){
          b.pocketed=true;b.vx=0;b.vy=0;
          if(b.cue)out.scratch=true;else out.pocketed.push(b);
          continue;
        }
        const x=clamp(b.x,TABLE.left,TABLE.right);
        const y=clamp(b.y,TABLE.top,TABLE.bottom);
        if(x!==b.x){b.x=x;b.vx=-b.vx*.82;out.bounces++}
        if(y!==b.y){b.y=y;b.vy=-b.vy*.82;out.bounces++}
      }
      for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){
        const a=active[i],b=active[j];
        if(a.pocketed||b.pocketed)continue;
        const dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy)||1e-5;
        const limit=a.r+b.r;if(dist>=limit)continue;
        const nx=dx/dist,ny=dy/dist,push=(limit-dist+.01)/2;
        a.x-=nx*push;a.y-=ny*push;b.x+=nx*push;b.y+=ny*push;
        const velocity=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
        if(velocity<0){
          const impulse=-(1+.94)*velocity/2;
          a.vx-=impulse*nx;a.vy-=impulse*ny;
          b.vx+=impulse*nx;b.vy+=impulse*ny;out.collisions++;
        }
      }
    }
    return out;
  }
  function cueRespawn(balls){
    const cue=balls[0];
    const others=balls.filter(b=>!b.cue&&!b.pocketed);
    const spots=[{x:288,y:270},{x:245,y:270},{x:200,y:270},{x:260,y:210},
      {x:260,y:330},{x:175,y:200},{x:175,y:340}];
    const pos=spots.find(p=>others.every(b=>Math.hypot(b.x-p.x,b.y-p.y)>cue.r+b.r+2));
    if(!pos)return false;
    Object.assign(cue,pos,{vx:0,vy:0,pocketed:false});
    return true;
  }
  function poolGuide(cue,aim,balls){
    const dx=aim.x-cue.x,dy=aim.y-cue.y,length=Math.hypot(dx,dy);
    if(length<2)return null;
    const ux=dx/length,uy=dy/length;
    let end=300,hit=null;
    for(const other of balls){
      if(other===cue||other.pocketed)continue;
      const ox=other.x-cue.x,oy=other.y-cue.y;
      const along=ox*ux+oy*uy,perp=ox*oy*0+(ox*ox+oy*oy)-along*along;
      const limit=cue.r+other.r;
      if(along<0||perp>limit*limit)continue;
      const distance=along-Math.sqrt(Math.max(0,limit*limit-perp));
      if(distance>=0&&distance<end){end=distance;hit=other}
    }
    // Guia curta: não revela tacadas completas após múltiplos rebotes.
    return {x:cue.x+ux*end,y:cue.y+uy*end,hit:!!hit,power:clamp(length/240,0,1)};
  }
  const api=Object.freeze({G,HOOP,TABLE,basketLaunch,basketStep,basketPreview,
    poolStep,cueRespawn,poolGuide});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window!=='undefined')window.AGVArcadePhysics=api;
})();