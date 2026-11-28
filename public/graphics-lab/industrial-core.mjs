// Original procedural showcase library. Dimensions are normalized visualization units, not engineering specifications.
export const finishes={
 steel:{color:0xa9b5c2,metalness:1,roughness:.34,anisotropy:.65},
 chrome:{color:0xe0e7ee,metalness:1,roughness:.16},
 graphite:{color:0x303944,metalness:.65,roughness:.48},
 brass:{color:0xc68d42,metalness:1,roughness:.30},
 polymer:{color:0x1e3c50,metalness:0,roughness:.38,clearcoat:.35,clearcoatRoughness:.25},
 rubber:{color:0x202125,metalness:0,roughness:.94},
 glass:{color:0xdaf4ff,metalness:0,roughness:.07,transmission:1,ior:1.46,thickness:.22,attenuationColor:0x98d9f4,attenuationDistance:2},
 enamel:{color:0xc24219,metalness:.18,roughness:.24,clearcoat:1,clearcoatRoughness:.13},
 optical:{color:0x195d7c,metalness:.18,roughness:.15,clearcoat:1},
};
export const catalog={
 turbine:{name:'Turbina industrial',description:'Pás, anéis e cubo em ligas metálicas.'},
 piston:{name:'Pistão mecânico',description:'Corpo metálico, anéis, haste e acabamento chanfrado.'},
 sensor:{name:'Sensor óptico',description:'Carcaça, lente transmissiva e componentes internos.'},
 wheel:{name:'Roda de tração',description:'Borracha, raios, cubo e sulcos de aderência.'}
};
export const detailProfiles={eco:{segments:24,bevel:2,shadow:0},balanced:{segments:48,bevel:3,shadow:1024},ultra:{segments:64,bevel:4,shadow:2048}};
const V=[0,0,0],R=[0,0,0],X=[Math.PI/2,0,0],TAU=2*Math.PI;
export function partsFor(id){
 if(!Object.hasOwn(catalog,id))throw Error('Objeto desconhecido');
 const a=[];const part=(kind,dimensions,finish,position=V,rotation=R)=>a.push({kind,dimensions,finish,position:[...position],rotation:[...rotation]});
 const cylinder=(r1,r2,h,m,p=V,q=R)=>part('cylinder',[r1,r2,h],m,p,q);
 const ring=(r,t,m,p=V,q=R)=>part('torus',[r,t],m,p,q);
 const box=(w,h,d,b,m,p=V,q=R)=>part('box',[w,h,d,b],m,p,q);
 if(id==='turbine'){
   ring(1.28,.12,'steel');ring(1.28,.065,'chrome',[0,0,.17]);ring(1.28,.065,'graphite',[0,0,-.17]);
   cylinder(.43,.43,.42,'graphite',V,X);cylinder(.30,.39,.24,'chrome',[0,0,.27],X);cylinder(.14,.14,.12,'brass',[0,0,.45],X);
   for(let i=0;i<12;i++){const t=i*TAU/12;box(.25,.72,.17,.055,'steel',[Math.cos(t)*.79,Math.sin(t)*.79,0],[0,.35,t-Math.PI/2+.28]);}
   for(let i=0;i<8;i++){const t=i*TAU/8;cylinder(.043,.043,.055,'brass',[Math.cos(t)*.33,Math.sin(t)*.33,.37],X);}
 }else if(id==='piston'){
   cylinder(.67,.67,1.0,'steel',[0,.46,0]);cylinder(.70,.70,.10,'chrome',[0,1.0,0]);cylinder(.59,.59,.16,'graphite',[0,-.12,0]);
   for(let i=0;i<3;i++)ring(.655,.035,'graphite',[0,.57+i*.15,0],X);
   cylinder(.32,.32,.40,'chrome',[0,-.38,0]);box(.40,.83,.26,.08,'steel',[0,-.88,0]);ring(.28,.13,'steel',[0,-1.40,0]);ring(.19,.035,'brass',[0,-1.40,.09]);cylinder(.20,.20,.14,'chrome',[0,.14,.62],X);cylinder(.20,.20,.14,'chrome',[0,.14,-.62],X);
 }else if(id==='sensor'){
   cylinder(.85,.85,.23,'graphite',[0,-.72,0]);cylinder(.72,.85,.13,'enamel',[0,-.54,0]);cylinder(.55,.55,.76,'polymer',[0,-.13,0]);
   cylinder(.36,.36,.20,'chrome',[0,.35,0]);cylinder(.26,.26,.09,'optical',[0,.48,0]);
   for(let i=0;i<8;i++){const t=i*TAU/8;box(.065,.37,.065,.015,'brass',[Math.cos(t)*.43,.12,Math.sin(t)*.43]);}
   part('hemisphere',[.68],'glass',[0,.37,0]);ring(.64,.04,'chrome',[0,.37,0],X);
   for(let i=0;i<4;i++){const t=i*TAU/4;cylinder(.055,.055,.05,'chrome',[Math.cos(t)*.70,-.57,Math.sin(t)*.70]);}
 }else{
   ring(1.04,.31,'rubber');ring(.75,.085,'steel',[0,0,.18]);ring(.75,.075,'steel',[0,0,-.18]);
   cylinder(.32,.32,.52,'graphite',V,X);cylinder(.24,.24,.08,'chrome',[0,0,.30],X);
   for(let i=0;i<6;i++){const t=i*TAU/6;box(.19,.53,.18,.06,'chrome',[Math.cos(t)*.51,Math.sin(t)*.51,0],[0,0,t-Math.PI/2]);cylinder(.045,.045,.06,'brass',[Math.cos(t)*.22,Math.sin(t)*.22,.36],X);}
   for(let i=0;i<24;i++){const t=i*TAU/24;box(.11,.10,.38,.022,'rubber',[Math.cos(t)*1.30,Math.sin(t)*1.30,0],[0,0,t]);}
 }
 return a;
}
