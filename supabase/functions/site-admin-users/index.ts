import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const headers = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json'};
const reply = (status:number,body:object) => new Response(JSON.stringify(body),{status,headers});
Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response(null,{headers});
  if(req.method!=='POST')return reply(405,{error:'Método não permitido.'});
  try {
    const authorization=req.headers.get('Authorization');
    if(!authorization?.startsWith('Bearer '))return reply(401,{error:'Entre novamente no painel.'});
    const url=Deno.env.get('SUPABASE_URL')!;
    const caller=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
    const {data:{user},error:authError}=await caller.auth.getUser();
    if(authError||!user)return reply(401,{error:'Entre novamente no painel.'});
    if(user.email?.toLowerCase()!=='diretoria@institutovert.com.br')return reply(403,{error:'Somente a diretoria pode liberar usuários.'});
    const {data:member,error:memberError}=await caller.from('digital_card_admins').select('user_id').eq('user_id',user.id).maybeSingle();
    if(memberError||!member)return reply(403,{error:'Acesso administrativo necessário.'});
    let body;try{body=await req.json();}catch{return reply(400,{error:'Solicitação inválida.'});}
    const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
    if(body.action!=='invite'||email.length>254||!/^\S+@\S+\.\S+$/.test(email)||email==='diretoria@institutovert.com.br')return reply(400,{error:'Informe o e-mail válido do novo administrador.'});
    const {data:existing,error:lookupError}=await caller.rpc('site_admin_account',{p_email:email});
    if(lookupError)return reply(403,{error:'Não foi possível verificar a autorização.'});
    let invited=false;
    if(!existing?.confirmed){
      const admin=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
      const {error}=await admin.auth.admin.inviteUserByEmail(email,{redirectTo:'https://institutovert.app/admin'});
      if(error)return reply(error.status===429?429:400,{error:error.status===429?'Aguarde antes de enviar outro convite.':'O provedor não enviou o convite. Confira o e-mail e tente novamente. Nenhum novo acesso foi liberado.'});
      invited=true;
    }
    const {error}=await caller.rpc('site_admin_access',{p_email:email,p_enabled:true});
    if(error)return reply(409,{error:invited?'O convite foi enviado, mas a autorização falhou. Tente liberar este e-mail novamente.':'Não foi possível liberar o acesso.'});
    return reply(200,{ok:true,invited,message:invited?'Convite enviado por e-mail. O usuário precisa aceitar para entrar.':'Acesso liberado para a conta existente. Ela pode entrar com sua senha ou usar Primeiro acesso.'});
  }catch{return reply(500,{error:'Não foi possível concluir. Tente novamente.'});}
});
