/* AGV TOUCH 3.5 | Modelo voxel puro: sem DOM, rede ou dependências. */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.AGVVoxels=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const SIZE=8,HEIGHT=6,MAX_BLOCKS=256,HISTORY=40;
 const MATERIALS=Object.freeze([
 ['grass','Grama','#51b95b'],['dirt','Terra','#966240'],
 ['sand','Areia','#e1be76'],['stone','Pedra','#8f9da8'],
 ['lava','Lava','#ff6337'],['ice','Gelo','#87e8f9'],
 ['wood','Madeira','#b98044'],['brick','Tijolos','#cd705b'],
 ['crystal','Cristal','#aa79f9']].map(([id,label,color])=>Object.freeze({id,label,color})));
 const IDS=new Set(MATERIALS.map(m=>m.id));
 const key=(x,y,z)=>x+','+y+','+z;
 const valid=(x,y,z)=>Number.isInteger(x)&&Number.isInteger(y)&&Number.isInteger(z)&&x>=0&&x<SIZE&&z>=0&&z<SIZE&&y>=0&&y<HEIGHT;
 const goals=Object.freeze({
  free:[],tower:[{x:3,y:0,z:3},{x:3,y:1,z:3},{x:3,y:2,z:3},{x:3,y:3,z:3},{x:3,y:4,z:3}],
  stairs:[{x:2,y:0,z:3},{x:3,y:0,z:3},{x:3,y:1,z:3},{x:4,y:0,z:3},{x:4,y:1,z:3},{x:4,y:2,z:3}],
  bridge:[{x:2,y:0,z:3},{x:4,y:0,z:3},{x:2,y:1,z:3},{x:3,y:1,z:3},{x:4,y:1,z:3}],
  symmetry:[{x:2,y:0,z:2},{x:5,y:0,z:2},{x:2,y:1,z:2},{x:5,y:1,z:2},{x:3,y:0,z:3},{x:4,y:0,z:3}]
 });
 const clone=b=>({x:b.x,y:b.y,z:b.z,material:b.material});
 function createWorld(){
  const map=new Map(),undoStack=[],redoStack=[];let revision=0;
  const snapshot=()=>[...map.values()].map(clone);
  function restore(blocks){map.clear();for(const b of blocks)map.set(key(b.x,b.y,b.z),clone(b));revision++}
  function history(){undoStack.push(snapshot());if(undoStack.length>HISTORY)undoStack.shift();redoStack.length=0}
  const has=(x,y,z)=>map.has(key(x,y,z));
  function canPlace(x,y,z){
   if(!valid(x,y,z)||has(x,y,z)||map.size>=MAX_BLOCKS)return false;
   if(y===0)return true;
   return [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].some(([a,b,c])=>has(x+a,y+b,z+c));
  }
  function add(x,y,z,material){
   if(!IDS.has(material)||!canPlace(x,y,z))return false;
   history();map.set(key(x,y,z),{x,y,z,material});revision++;return true;
  }
  function remove(x,y,z){if(!has(x,y,z))return false;history();map.delete(key(x,y,z));revision++;return true}
  function move(from,to){
   if(!from||!to||!has(from.x,from.y,from.z)||!valid(to.x,to.y,to.z)||has(to.x,to.y,to.z))return false;
   const original=map.get(key(from.x,from.y,from.z));
   map.delete(key(from.x,from.y,from.z));
   const okay=canPlace(to.x,to.y,to.z);
   map.set(key(from.x,from.y,from.z),original);
   if(!okay)return false;
   history();map.delete(key(from.x,from.y,from.z));
   map.set(key(to.x,to.y,to.z),{...to,material:original.material});revision++;return true;
  }
  function clear(){if(!map.size)return false;history();map.clear();revision++;return true}
  function undo(){if(!undoStack.length)return false;redoStack.push(snapshot());restore(undoStack.pop());return true}
  function redo(){if(!redoStack.length)return false;undoStack.push(snapshot());restore(redoStack.pop());return true}
  function load(data){
   if(typeof data==='string'){if(data.length>60000)return false;try{data=JSON.parse(data)}catch{return false}}
   if(!data||data.version!==1||!Array.isArray(data.blocks)||data.blocks.length>MAX_BLOCKS)return false;
   const next=new Map();
   for(const b of data.blocks){
    if(!b||!valid(b.x,b.y,b.z)||!IDS.has(b.material)||next.has(key(b.x,b.y,b.z)))return false;
    next.set(key(b.x,b.y,b.z),clone(b));
   }
   history();restore([...next.values()]);return true;
  }
  function progress(mission){
   const required=goals[mission]||goals.free;
   const done=required.filter(p=>has(p.x,p.y,p.z)).length;
   return {done,total:required.length,complete:required.length>0&&done===required.length};
  }
  return Object.freeze({
   get revision(){return revision},get count(){return map.size},get blocks(){return snapshot()},
   get canUndo(){return undoStack.length>0},get canRedo(){return redoStack.length>0},
   has,canPlace,add,remove,move,clear,undo,redo,
   get(x,y,z){const b=map.get(key(x,y,z));return b?clone(b):null},
   serialize(){return JSON.stringify({version:1,blocks:snapshot()})},load,progress
  });
 }
 function boxHit(origin,dir,b){
  const c={x:b.x-(SIZE-1)/2,y:b.y+.5,z:b.z-(SIZE-1)/2};
  let near=-Infinity,far=Infinity,normal=null;
  for(const axis of ['x','y','z']){
   const min=c[axis]-.5,max=c[axis]+.5,v=dir[axis],o=origin[axis];
   if(Math.abs(v)<1e-8){if(o<min||o>max)return null;continue}
   const a=(min-o)/v,z=(max-o)/v,n=Math.min(a,z),f=Math.max(a,z);
   if(n>near){near=n;normal={x:0,y:0,z:0};normal[axis]=v>0?-1:1}
   far=Math.min(far,f);if(near>far)return null;
  }
  if(far<0)return null;
  return {distance:near>=0?near:far,normal,block:{x:b.x,y:b.y,z:b.z}};
 }
 function raycast(origin,direction,blocks){
  const m=Math.hypot(direction.x,direction.y,direction.z)||1;
  const dir={x:direction.x/m,y:direction.y/m,z:direction.z/m};let nearest=null;
  for(const b of blocks){
   const h=boxHit(origin,dir,b);
   if(h&&h.distance>0&&(!nearest||h.distance<nearest.distance))nearest=h;
  }
  const floor=dir.y<-.00001?-origin.y/dir.y:Infinity;
  if(floor>0&&(!nearest||floor<nearest.distance)){
   const x=Math.floor(origin.x+dir.x*floor+SIZE/2),z=Math.floor(origin.z+dir.z*floor+SIZE/2);
   if(valid(x,0,z))return{distance:floor,normal:{x:0,y:1,z:0},block:null,target:{x,y:0,z}};
  }
  if(!nearest)return null;
  const p=nearest.block,n=nearest.normal,target={x:p.x+n.x,y:p.y+n.y,z:p.z+n.z};
  return{...nearest,target:valid(target.x,target.y,target.z)?target:null};
 }
 return Object.freeze({SIZE,HEIGHT,MAX_BLOCKS,MATERIALS,goals,key,valid,createWorld,raycast});
});