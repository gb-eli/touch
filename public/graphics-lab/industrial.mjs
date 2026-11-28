import * as THREE from 'three';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js';
import {catalog,finishes,detailProfiles,partsFor} from './industrial-core.mjs';
// Each group owns its geometry and material cache. Do not share GPU resources across groups.
export function createIndustrial(id,quality='balanced'){
 const p=detailProfiles[quality]||detailProfiles.balanced,parts=partsFor(id),root=new THREE.Group(),geometries=new Map(),materials=new Map();
 root.name=catalog[id].name;
 try{
 for(const part of parts){
  const key=part.kind+':'+part.dimensions.join(',');
  if(!geometries.has(key)){
   const d=part.dimensions;let g;
   switch(part.kind){
    case 'box':g=new RoundedBoxGeometry(d[0],d[1],d[2],p.bevel,d[3]);break;
    case 'cylinder':g=new THREE.CylinderGeometry(d[0],d[1],d[2],p.segments);break;
    case 'torus':g=new THREE.TorusGeometry(d[0],d[1],Math.max(8,p.segments/4),p.segments);break;
    case 'hemisphere':g=new THREE.SphereGeometry(d[0],p.segments,p.segments/2,0,Math.PI*2,0,Math.PI/2);break;
    default:throw Error('Geometria inválida');
   }
   geometries.set(key,g);
  }
  if(!materials.has(part.finish)){
   const options={...finishes[part.finish]};
   if(options.attenuationColor!==undefined)options.attenuationColor=new THREE.Color(options.attenuationColor);
   if(part.finish==='glass')options.side=THREE.DoubleSide;
   materials.set(part.finish,new THREE.MeshPhysicalMaterial(options));
  }
  const mesh=new THREE.Mesh(geometries.get(key),materials.get(part.finish));
  mesh.position.fromArray(part.position);mesh.rotation.set(...part.rotation);
  mesh.castShadow=part.finish!=='glass';mesh.receiveShadow=part.finish!=='glass';root.add(mesh);
 }
 return root;
 }catch(e){for(const g of geometries.values())g.dispose();for(const m of materials.values())m.dispose();throw e;}
}
