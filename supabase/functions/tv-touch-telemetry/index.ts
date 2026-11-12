// Edge Function pública de ingestão. O banco NÃO permite acesso anon às tabelas.
// O cliente nunca conhece uma service_role ou chave sb_secret.
import { createClient } from 'npm:@supabase/supabase-js@2.112.3';

const apiUrl = Deno.env.get('SUPABASE_URL') || '';
const adminSecret = (() => {
  try {return JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}').default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';}
  catch {return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';}
})();
const allowedOrigin = Deno.env.get('TVT_ALLOWED_ORIGIN') || '';
const rateSalt = Deno.env.get('TVT_RATE_SALT') || '';
const ready = apiUrl.length>0 && adminSecret.length>0 && allowedOrigin.startsWith('https://') && rateSalt.length>=24;
const admin=ready ? createClient(apiUrl,adminSecret,{auth:{autoRefreshToken:false,persistSession:false}}) : null;
const stations = new Set(['TV TOUCH 01','TV TOUCH 02','TV TOUCH 03']);
const subjects:Record<string,string[]> = {
  comum:['Língua Portuguesa','Matemática','História','Geografia','Ciências','Biologia','Física','Química','Arte','Educação Física','Língua Inglesa','Língua Espanhola','Filosofia','Sociologia','Outro componente curricular'],
  tecnica:['Desenvolvimento de Sistemas','Introdução à Programação','Programação Front-End','Programação Mobile','Banco de Dados','Análise de Sistemas','Redes de Computadores','Informática Empresarial','Inovação e Empreendedorismo','Administração','Logística','Operações Portuárias','Segurança do Trabalho','Outro componente técnico'],
  interdisciplinar:['Projeto Integrador','Feira de Ciências','Projeto Interdisciplinar','Formação de Professores']
};
const types=new Set(['http_latency_ms','fps','touch_peak','page_load_ms']);
const events=new Set(['tool_open','resource_open','page_load']);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const itemId=/^[a-z0-9_-]{2,50}$/;
const headers=(origin:string)=>({
  'Access-Control-Allow-Origin':origin,
  'Access-Control-Allow-Headers':'apikey, content-type',
  'Access-Control-Allow-Methods':'POST, GET, OPTIONS',
  'Vary':'Origin',
  'Cache-Control':'no-store'
});
const reply=(obj:object,status:number,origin:string)=>Response.json(obj,{status,headers:headers(origin)});
const hash = async (input:string) => {
  const encoder=new TextEncoder();
  const key=await crypto.subtle.importKey('raw',encoder.encode(rateSalt),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const data=await crypto.subtle.sign('HMAC',key,encoder.encode(input));
  return Array.from(new Uint8Array(data),b=>b.toString(16).padStart(2,'0')).join('');
};

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get('origin') || '';
  if(origin!==allowedOrigin)return reply({error:'Origem não autorizada'},403,allowedOrigin || 'null');
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:headers(origin)});
  if(!ready || !admin)return reply({error:'Backend sem configuração completa'},503,origin);
  if(req.method==='GET' && new URL(req.url).searchParams.has('health')){
    return reply({ok:true,service:'tv-touch-telemetry'},200,origin);
  }
  if(req.method!=='POST')return reply({error:'Método não permitido'},405,origin);
  const size=Number(req.headers.get('content-length') || 0);
  if(size>2500)return reply({error:'Corpo muito grande'},413,origin);
  let body:Record<string,unknown>;
  try{body=await req.json();if(!body||Array.isArray(body)||typeof body!=='object')throw Error();}
  catch{return reply({error:'JSON inválido'},400,origin);}
  if(JSON.stringify(body).length>2500)return reply({error:'Corpo muito grande'},413,origin);
  try{
    // Limitação por origem aproximada da requisição. Em redes NAT várias TVs compartilham o limite.
    // X-Forwarded-For depende da infraestrutura; não substitui proteção contra abuso avançado.
    const remote=req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const fingerprint=await hash(`${remote}|${new Date().toISOString().slice(0,10)}`);
    const {data:accepted,error:limitError}=await admin.rpc('tvt_check_rate',{p_hash:fingerprint,p_max_hits:100});
    if(limitError)throw limitError;
    if(!accepted)return reply({error:'Limite temporário de requisições'},429,origin);
    const kind=body.kind;
    if(kind==='start'){
      const station=String(body.station||''),area=String(body.area||''),discipline=String(body.discipline||'');
      if(!stations.has(station)||!subjects[area]?.includes(discipline))return reply({error:'Aula inválida'},400,origin);
      const d=(body.device && typeof body.device==='object'&&!Array.isArray(body.device))?body.device as Record<string,unknown>:{};
      const cleanNumber=(value:unknown,max:number)=>Number.isInteger(value)&&Number(value)>=0&&Number(value)<=max?Number(value):null;
      const sessionId=crypto.randomUUID();
      const {error}=await admin.from('tvt_sessions').insert({
        id:sessionId,station,area,discipline,
        os:String(d.os||'Outro').slice(0,40),browser:String(d.browser||'Outro').slice(0,40),
        screen_width:cleanNumber(d.width,32767),screen_height:cleanNumber(d.height,32767),
        touch_limit:cleanNumber(d.touchLimit,100),webgl:typeof d.webgl==='boolean'?d.webgl:null
      });
      if(error)throw error;
      return reply({ok:true,sessionId},200,origin);
    }
    const sessionId=String(body.sessionId || '');
    if(!uuid.test(sessionId))return reply({error:'Sessão inválida'},400,origin);
    if(kind==='heartbeat'){
      const {error}=await admin.from('tvt_sessions').update({last_seen_at:new Date().toISOString()}).eq('id',sessionId);
      if(error)throw error;
      return reply({ok:true},200,origin);
    }
    if(kind==='event'){
      const event=String(body.event||''),item=String(body.item||'');
      if(!events.has(event)||!itemId.test(item))return reply({error:'Evento inválido'},400,origin);
      const {error}=await admin.from('tvt_events').insert({session_id:sessionId,event_type:event,item_id:item});
      if(error)return reply({error:'Sessão não encontrada'},400,origin);
      return reply({ok:true},200,origin);
    }
    if(kind==='metric'){
      const type=String(body.type||''),value=body.value;
      const attempts=Number(body.attempts),failures=Number(body.failures);
      if(!types.has(type)|| !Number.isInteger(attempts)||attempts<1||attempts>10 ||
        !Number.isInteger(failures)||failures<0||failures>attempts ||
        (value!==null&&(typeof value!=='number'||!Number.isFinite(value)||value<0||value>120000)))
        return reply({error:'Métrica inválida'},400,origin);
      const {error}=await admin.from('tvt_metrics').insert({session_id:sessionId,metric_type:type,metric_value:value,attempts,failures});
      if(error)return reply({error:'Sessão não encontrada'},400,origin);
      return reply({ok:true},200,origin);
    }
    return reply({error:'Operação inválida'},400,origin);
  }catch(err){
    console.error('tv-touch-telemetry:',err instanceof Error?err.message:'Erro do banco');
    return reply({error:'Não foi possível salvar a métrica'},500,origin);
  }
});
