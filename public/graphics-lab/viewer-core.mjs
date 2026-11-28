export const MAX_GLB=16*1024*1024, MAX_HDR=8*1024*1024;
export const presets={
 studio:{ambient:[.12,.14,.18],panels:[[.12,.25,16,60,[1,.96,.9]],[.62,.38,9,32,[.58,.77,1]],[.86,.18,12,75,[1,1,1]]]},
 warm:{ambient:[.16,.10,.065],panels:[[.2,.39,23,95,[1,.54,.23]],[.7,.23,6,22,[.42,.64,1]]]},
 contrast:{ambient:[.035,.045,.06],panels:[[.24,.28,28,110,[.8,.9,1]],[.74,.42,15,85,[1,.76,.46]]]}
};
export function studioPixels(id,width=512,height=256){
 const p=presets[id];if(!p)throw Error('Ambiente desconhecido');const result=new Float32Array(width*height*4);
 const lamps=p.panels.map(([u,v,power,focus,color])=>[Math.cos(u*2*Math.PI)*Math.sin(v*Math.PI),Math.cos(v*Math.PI),Math.sin(u*2*Math.PI)*Math.sin(v*Math.PI),power,focus,color]);
 for(let y=0;y<height;y++){const theta=(y+.5)/height*Math.PI,sy=Math.cos(theta),r=Math.sin(theta);
 for(let x=0;x<width;x++){const phi=(x+.5)/width*2*Math.PI,dx=Math.cos(phi)*r,dz=Math.sin(phi)*r,i=(y*width+x)*4;
 for(let c=0;c<3;c++)result[i+c]=p.ambient[c]*(.65+.35*Math.max(sy,0));
 for(const [lx,ly,lz,power,focus,color] of lamps){const energy=power*Math.exp(focus*(Math.min(1,dx*lx+sy*ly+dz*lz)-1));for(let c=0;c<3;c++)result[i+c]+=energy*color[c];}result[i+3]=1;}}
 return result;
}
export function validateGLB(buffer,decode=b=>new TextDecoder('utf-8',{fatal:true}).decode(b)){
 if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<20||buffer.byteLength>MAX_GLB)throw Error('GLB deve ter até 16 MB.');
 const d=new DataView(buffer);if(d.getUint32(0,true)!==0x46546c67||d.getUint32(4,true)!==2||d.getUint32(8,true)!==buffer.byteLength)throw Error('Cabeçalho GLB 2.0 inválido.');
 const n=d.getUint32(12,true);if(!n||n%4||n>2*1024*1024||20+n>buffer.byteLength||d.getUint32(16,true)!==0x4e4f534a)throw Error('Bloco JSON inválido.');
 const j=JSON.parse(decode(new Uint8Array(buffer,20,n)));if(j.asset?.version!=='2.0')throw Error('Somente glTF 2.0.');
 let bin=0,offset=20+n;
 while(offset<buffer.byteLength){if(offset+8>buffer.byteLength)throw Error('Bloco GLB incompleto.');const len=d.getUint32(offset,true),type=d.getUint32(offset+4,true);if(len%4||offset+8+len>buffer.byteLength)throw Error('Bloco GLB inválido.');if(type===0x004e4942){if(bin)throw Error('Múltiplos blocos binários.');bin=len;}offset+=8+len;}
 const stack=[j];while(stack.length){const v=stack.pop();if(!v||typeof v!=='object')continue;for(const [k,value] of Object.entries(v)){if(k==='uri')throw Error('Use um GLB autocontido, sem arquivos ou URLs externos.');if(value&&typeof value==='object')stack.push(value);}}
 const buffers=j.buffers||[];if(buffers.length>1||buffers.some(b=>!Number.isInteger(b.byteLength)||b.byteLength<0||b.byteLength>bin))throw Error('Buffer binário inválido.');
 const unsupported=['KHR_draco_mesh_compression','KHR_texture_basisu','EXT_meshopt_compression'];if((j.extensionsUsed||[]).some(e=>unsupported.includes(e)))throw Error('Modelo comprimido não suportado nesta versão.');
 if((j.nodes||[]).length>1500||(j.meshes||[]).length>500||(j.images||[]).length>24)throw Error('Modelo excede o limite de complexidade.');
 let count=0;for(const a of j.accessors||[]){if(!Number.isInteger(a.count)||a.count<0)throw Error('Accessor inválido.');count+=a.count;}if(count>2000000)throw Error('Modelo excede o limite de dados geométricos.');
 return j;
}
export function validateHDR(buffer,decode=b=>new TextDecoder().decode(b)){
 if(!(buffer instanceof ArrayBuffer)||!buffer.byteLength||buffer.byteLength>MAX_HDR)throw Error('HDR deve ter até 8 MB.');
 const h=decode(new Uint8Array(buffer,0,Math.min(buffer.byteLength,4096)));const match=h.match(/(?:^|\n)-Y\s+(\d+)\s+\+X\s+(\d+)\r?\n/);
 if(!/^#\?(RADIANCE|RGBE)/.test(h)||!h.includes('FORMAT=32-bit_rle_rgbe')||!match)throw Error('Formato Radiance RGBE não reconhecido.');
 const height=Number(match[1]),width=Number(match[2]);if(width<1||height<1||width>2048||height>1024||width!==height*2)throw Error('Use panorama 2:1 de até 2048 × 1024.');
 return {width,height};
}
