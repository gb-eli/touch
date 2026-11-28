export const materials = [
  {
    "id": "titanium",
    "name": "Titânio",
    "color": 8754076,
    "metal": 1,
    "rough": 0.28,
    "pattern": 0
  },
  {
    "id": "wood",
    "name": "Madeira",
    "color": 12155459,
    "metal": 0,
    "rough": 0.62,
    "pattern": 1
  },
  {
    "id": "granite",
    "name": "Granito",
    "color": 9542561,
    "metal": 0,
    "rough": 0.78,
    "pattern": 2
  },
  {
    "id": "carbon",
    "name": "Carbono",
    "color": 4344146,
    "metal": 0.1,
    "rough": 0.34,
    "pattern": 3
  },
  {
    "id": "ceramic",
    "name": "Cerâmica",
    "color": 15227672,
    "metal": 0,
    "rough": 0.22,
    "pattern": 4
  },
  {
    "id": "brick",
    "name": "Tijolo",
    "color": 12080434,
    "metal": 0,
    "rough": 0.89,
    "pattern": 5
  },
  {
    "id": "concrete",
    "name": "Concreto",
    "color": 11777196,
    "metal": 0,
    "rough": 0.86,
    "pattern": 6
  },
  {
    "id": "gold",
    "name": "Latão",
    "color": 13608017,
    "metal": 1,
    "rough": 0.24,
    "pattern": 0
  },
  {
    "id": "copper",
    "name": "Cobre",
    "color": 12744272,
    "metal": 1,
    "rough": 0.36,
    "pattern": 0
  },
  {
    "id": "slate",
    "name": "Ardósia",
    "color": 5860217,
    "metal": 0,
    "rough": 0.76,
    "pattern": 2
  },
  {
    "id": "enamel",
    "name": "Esmalte",
    "color": 36022,
    "metal": 0,
    "rough": 0.18,
    "pattern": 4
  },
  {
    "id": "rubber",
    "name": "Borracha",
    "color": 3159099,
    "metal": 0,
    "rough": 0.95,
    "pattern": 6
  }
];
materials.push({id:"fabric",name:"Tecido técnico",color:0xe2e2e2,metal:0,rough:.82,pattern:6},{id:"paint",name:"Pintura automotiva",color:0xd4251d,metal:.3,rough:.4,pattern:4});
export const detailed = {
 wood:{color:"wood-color.jpg",normal:"wood-normal.jpg",rough:"wood-rough.jpg",repeat:3,tint:0xffffff,normalScale:.85},
 carbon:{normal:"carbon-normal.png",ao:"carbon-ao.png",repeat:3,tint:0x313741,normalScale:1.2,anisotropy:.5},
 fabric:{color:"fabric-color.png",normal:"fabric-normal.png",rough:"fabric-orm.png",repeat:10,tint:0xffffff,normalScale:.7,sheen:1},
 paint:{normal:"paint-normal.png",repeat:3,tint:0xd4251d,normalScale:.2,clearcoat:1}
};
export const profiles = {eco:{size:256,dpr:1,segments:24,shadow:0},balanced:{size:512,dpr:1.5,segments:48,shadow:1024},ultra:{size:1024,dpr:2,segments:64,shadow:2048}};
export const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export function grain(x,y,seed=0){let n=Math.imul(x+seed*13,374761393)+Math.imul(y+seed*7,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
export function surface(pattern,x,y,size){const u=x/size,v=y/size,n=grain(x,y,pattern),s=(a)=>Math.sin(a);
switch(pattern){
case 0:return clamp(.63+.19*s(v*size*1.7)+.07*n,0,1);
case 1:return clamp(.50+.18*s((u+.025*s(v*23)+.013*s(v*55))*110)+.13*s((u+.014*s(v*37))*239)+.08*n,0,1);
case 2:return clamp(.45+.39*n+.11*s(u*127)*s(v*111),0,1);
case 3:{let a=Math.floor(u*32),b=Math.floor(v*32),p=(a+b)%2;return .28+.30*p+.13*s((p?u:v)*size*2.2);}
case 4:return .78+.035*n;
case 5:{let row=Math.floor(v*8),bx=(u*4+(row%2)*.5)%1,by=(v*8)%1;return bx<.035||by<.075?.16:.55+.20*n+.07*s(u*80)*s(v*61);}
default:return clamp(.52+.24*n+.10*s(u*63)*s(v*79),0,1);
}}
export function selectMaterial(id){return materials.find(m=>m.id===id)||materials[0]}
