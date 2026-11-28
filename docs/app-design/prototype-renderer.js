// Small orthographic software renderer for the interaction prototype.
// This previews 3D geometry; it never captures a camera or simulates AR tracking.
let canvas=null,ctx=null,stageW=0,stageH=0,scale=1,origin=[0,0];
function projectPoint(p){const q=projRaw(p,state.yaw);return[origin[0]+q[0]*scale,origin[1]+q[1]*scale]}
function poly(points,fill,stroke,width=1,dash=[]){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([])}
function drawWorld(){if(!canvas||!ctx||state.page!=='builder')return;const ratio=Math.min(devicePixelRatio||1,2);ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,stageW,stageH);scale=Math.min(stageW/12.5,stageH/10.4)*state.zoom;origin=[stageW*.5,stageH*.53];currentFaces=[];const eyeV=eye(state.yaw);
 for(let x=0;x<8;x++)for(let z=0;z<8;z++){const points=[[x-4,0,z-4],[x-3,0,z-4],[x-3,0,z-3],[x-4,0,z-3]].map(projectPoint);poly(points,(x+z)%2?'#e1eae3':'#e7eee7','#d0ded3',.65);currentFaces.push({points,target:{x,y:0,z},block:null})}
 const faces=[];for(const b of state.blocks)for(const f of cubeFaces(b))if(f.n.reduce((a,n,i)=>a+n*eyeV[i],0)>.01){if(has(b.x+f.n[0],b.y+f.n[1],b.z+f.n[2]))continue;faces.push({points:f.p.map(projectPoint),depth:f.p.reduce((a,p)=>a+p[0]*eyeV[0]+p[1]*eyeV[1]+p[2]*eyeV[2],0)/4,color:shade(byMaterial(b.material).color,f.f),block:b,n:f.n})}
 faces.sort((a,b)=>a.depth-b.depth);for(const f of faces){const b=f.block,selected=state.tool==='erase'&&state.selected&&posKey(b.x,b.y,b.z)===posKey(state.selected.x,state.selected.y,state.selected.z);poly(f.points,selected?'#d97a73':f.color,selected?'#9f3535':shade(f.color,.89),selected?1.6:.8);currentFaces.push({points:f.points,block:b,target:{x:b.x+f.n[0],y:b.y+f.n[1],z:b.z+f.n[2]}})}
 if(state.builderMission)for(const [x,y,z] of GOALS[state.builderMission])if(!has(x,y,z)){const b={x,y,z};for(const f of cubeFaces(b))if(f.n.reduce((a,n,i)=>a+n*eyeV[i],0)>.01){const points=f.p.map(projectPoint);poly(points,'#6b989b0b','#76a3a491',1.05,[3,3]);if(canPlace(b))currentFaces.push({points,block:null,target:b})}}
 if(state.target&&state.tool==='select'&&valid(state.target.x,state.target.y,state.target.z)){const good=canPlace(state.target);for(const f of cubeFaces(state.target))if(f.n.reduce((a,n,i)=>a+n*eyeV[i],0)>.01)poly(f.p.map(projectPoint),good?byMaterial(state.material).color+'62':'#cb66663a',good?'#426b45':'#b75151',1.6,[4,3])}
 ctx.font='9px "Segoe UI", sans-serif';ctx.fillStyle='#92a79a';ctx.textAlign='left';ctx.fillText('PRÉVIA INTERATIVA · SEM CÂMERA',15,stageH-10);
}
function inside(p,points){let c=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if(((a[1]>p[1])!==(b[1]>p[1]))&&(p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]))c=!c}return c}
function pickAt(x,y){const hit=currentFaces.slice().reverse().find(f=>inside([x,y],f.points)&&(state.tool!=='erase'||f.block));if(!hit){state.target=null;state.selected=null}else{state.target=hit.target;state.selected=hit.block?{x:hit.block.x,y:hit.block.y,z:hit.block.z}:null}updateBuilderUI();drawWorld()}
function setupRenderer(){canvas=$('#worldCanvas');ctx=canvas.getContext('2d');if(!ctx){toast('Não foi possível abrir o palco gráfico neste navegador.');return}const abort=new AbortController(),signal=abort.signal,pointers=new Map();let start=null,dragged=false,multi=false,lastDistance=0;
 const resize=()=>{if(!canvas)return;const rect=canvas.getBoundingClientRect();stageW=rect.width;stageH=rect.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(stageW*dpr);canvas.height=Math.round(stageH*dpr);drawWorld()};const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 const distance=()=>{const a=[...pointers.values()];return a.length>1?Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y):0};
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){start={x:e.clientX,y:e.clientY,lastX:e.clientX};dragged=false;multi=false}else{multi=true;lastDistance=distance()}},{signal});
 canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size>1){const d=distance();if(lastDistance)state.zoom=Math.max(.65,Math.min(1.75,state.zoom*d/lastDistance));lastDistance=d;multi=true;drawWorld();return}if(!start)return;if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>7)dragged=true;if(state.tool==='rotate'){state.yaw+=(e.clientX-start.lastX)*.009;drawWorld()}start.lastX=e.clientX},{signal});
 canvas.addEventListener('pointerup',e=>{pointers.delete(e.pointerId);if(!multi&&!dragged&&start&&state.tool!=='rotate'){const r=canvas.getBoundingClientRect();pickAt(e.clientX-r.left,e.clientY-r.top)}if(!pointers.size)start=null},{signal});
 canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);start=null;multi=true},{signal});
 canvas.addEventListener('wheel',e=>{e.preventDefault();state.zoom=Math.max(.65,Math.min(1.75,state.zoom*(e.deltaY>0?.94:1.06)));drawWorld()},{signal,passive:false});
 canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','PageUp','PageDown'].includes(e.key)){e.preventDefault();const p=state.target?{...state.target}:{x:3,y:0,z:3};if(e.key==='ArrowLeft')p.x--;if(e.key==='ArrowRight')p.x++;if(e.key==='ArrowUp')p.z--;if(e.key==='ArrowDown')p.z++;if(e.key==='PageUp')p.y++;if(e.key==='PageDown')p.y--;p.x=Math.max(0,Math.min(7,p.x));p.y=Math.max(0,Math.min(5,p.y));p.z=Math.max(0,Math.min(7,p.z));state.target=p;state.selected=has(p.x,p.y,p.z)?p:null;updateBuilderUI();drawWorld()}if(e.key==='Enter'&&state.tool!=='rotate'){e.preventDefault();place()}if(e.key==='Escape'){state.target=null;state.selected=null;updateBuilderUI();drawWorld()}},{signal});
 rendererCleanup=()=>{abort.abort();observer.disconnect();canvas=null;ctx=null};
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.nav){go(b.dataset.nav);return}const action=b.dataset.action,id=b.dataset.id;switch(action){
case 'new-free':startBuilder();break;
case 'mission':state.mission=id;go('mission');break;
case 'start-mission':startBuilder(state.mission);break;
case 'filter':state.filter=id;render();break;
case 'camera-info':cameraInfo();break;
case 'about':openModal('TV Touch, em construção.','<p><strong>Criar. Experimentar. Aprender.</strong></p><p>Esta é a alta fidelidade navegável do MVP. As telas, a manipulação de blocos e os projetos locais demonstram a experiência proposta.</p><p>O palco usa uma prévia 3D por software. Não é um APK, não ativa câmera e não comprova desempenho físico. Câmera, RA e interação corporal continuam em desenvolvimento.</p>',button('Entendi','modal-close','primary','check'));break;
case 'modal-close':closeModal();break;
case 'builder-back':go(state.builderMission?'mission':'home');break;
case 'tool':state.tool=id;updateBuilderUI();drawWorld();break;
case 'material':state.material=id;updateBuilderUI();drawWorld();break;
case 'place':place();break;
case 'undo':undo();break;
case 'redo':redo();break;
case 'zoom-in':state.zoom=Math.min(1.75,state.zoom*1.12);drawWorld();break;
case 'zoom-out':state.zoom=Math.max(.65,state.zoom/1.12);drawWorld();break;
case 'rotate-step':state.yaw+=Math.PI/6;drawWorld();break;
case 'save':saveDialog();break;
case 'save-confirm':confirmSave();break;
case 'leave-save':{const cb=state.pendingNav;state.pendingNav=null;saveDialog(cb);break}
case 'leave-discard':{const cb=state.pendingNav;state.pendingNav=null;state.dirty=false;closeModal();if(cb)cb();break}
case 'mission-result':if(progress().complete)go('result',{force:true});break;
case 'return-builder':go('builder',{force:true});break;
case 'other-mission':go('explore');break;
case 'open-project':{const p=projects.find(x=>x.id===id);if(p)startBuilder(null,p);break}
case 'export':exportProject(id);break;
case 'import':$('#importFile').click();break;
case 'rename':renameDialog(id);break;
case 'rename-confirm':{const name=$('#renameInput').value.trim();if(!name){$('#nameError').textContent='Escreva um nome para o projeto.';return}if(persistProjects(projects.map(p=>p.id===state.renameId?{...p,name,updated:Date.now()}:p))){closeModal();render();toast('Nome atualizado.')}break}
case 'delete':{const p=projects.find(x=>x.id===id);if(!p)return;state.deleteId=id;openModal('Excluir este projeto?','<p>“'+escapeHTML(p.name)+'” será removido deste navegador. Exporte uma cópia antes se quiser guardar a construção.</p>',button('Excluir projeto','delete-confirm','danger','trash')+button('Manter projeto','modal-close','secondary',null));break}
case 'delete-confirm':if(persistProjects(projects.filter(p=>p.id!==state.deleteId))){closeModal();render();toast('Projeto excluído deste navegador.')}break;
case 'reduced':settings.reduced=!settings.reduced;saveSettings();render();break;
}});
document.addEventListener('input',e=>{if(e.target.id==='activitySearch'){state.query=e.target.value;$('#activities').innerHTML=activityCards()}});
document.addEventListener('change',e=>{if(e.target.id==='profileSetting'){settings.profile=e.target.value;saveSettings()}if(e.target.id==='fpsSetting'){settings.fps=e.target.value;saveSettings();toast('Preferência guardada. O protótipo não mede FPS físico.')}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&$('#modal').open){if(e.target.id==='projectNameInput'){e.preventDefault();confirmSave()}if(e.target.id==='renameInput'){e.preventDefault();$('#modal [data-action="rename-confirm"]').click()}}});
$('#importFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>60000)throw Error('Este arquivo excede o limite de 60 KB.');const blocks=validateWorld(JSON.parse(await file.text())),name=file.name.replace(/\.json$/i,'').slice(0,60)||'Projeto importado',now=Date.now(),entry={id:'import-'+now.toString(36),name,updated:now,blocks};if(persistProjects([...projects,entry])){go('projects');toast('Projeto importado e salvo neste navegador.')}}catch(error){toast(error instanceof SyntaxError?'Não foi possível ler este JSON.':error.message)}finally{e.target.value=''}});
const requested=new URL(location.href).searchParams.get('screen');
if(requested==='builder')startBuilder();else if(requested&&pageFunctions[requested]&&requested!=='result')go(requested,{force:true});else render();
