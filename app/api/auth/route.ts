import { NextRequest } from 'next/server';
import { authConfigured,databaseClient } from '@/lib/supabase/server';
import { boundedJSON,json,sameOrigin } from '@/lib/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const hits=new Map<string,{count:number;expires:number}>();
export async function GET(){if(!authConfigured())return json({configured:false,user:null});try{const db=await databaseClient();const {data,error}=await db.auth.getUser();return json({configured:true,user:error||!data.user?null:{id:data.user.id,email:data.user.email}});}catch{return json({error:'账户服务暂时不可用。'},503);}}
export async function POST(req:NextRequest){
 if(!sameOrigin(req))return json({error:'请从本站提交账户操作。'},403);
 if(!authConfigured())return json({error:'账户服务尚未配置，请由管理员连接 Supabase。'},503);
 const now=Date.now();for(const[k,v]of hits)if(v.expires<=now)hits.delete(k);const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'local';const h=hits.get(ip)||{count:0,expires:now+60000};if(h.count>=10||hits.size>=10000)return json({error:'操作频繁，请一分钟后再试。'},429);h.count++;hits.set(ip,h);
 let body:unknown;try{body=await boundedJSON(req,4096);}catch{return json({error:'请求格式有误或内容过长。'},400);}if(!body||typeof body!=='object')return json({error:'请求格式有误。'},400);
 const {action,email,password}=body as Record<string,unknown>;
 if(!['login','signup','logout','reset','update-password'].includes(String(action)))return json({error:'不支持的账户操作。'},400);
 if(['login','signup','reset'].includes(String(action))&&(typeof email!=='string'||email.length>254||!/^\S+@\S+\.\S+$/.test(email)))return json({error:'请填写有效的邮箱地址。'},400);
 if(['login','signup','update-password'].includes(String(action))&&(typeof password!=='string'||password.length>128||password.length<(action==='login'?1:8)))return json({error:'密码应为8～128位。'},400);
 try{
  const db=await databaseClient();
  const configuredSite=process.env.SITE_URL?.trim();let origin:string;
  try{const site=new URL(configuredSite||req.headers.get('origin')!);if(configuredSite&&(!['http:','https:'].includes(site.protocol)||site.username||site.password))throw Error();origin=site.origin;}catch{return json({error:'站点地址配置有误。'},503);}
  if(action==='logout'){const {error}=await db.auth.signOut({scope:'local'});return error?json({error:'退出失败，请重试。'},502):json({ok:true});}
  if(action==='login'){const {data,error}=await db.auth.signInWithPassword({email:(email as string).trim(),password:password as string});if(error)return json({error:error.code==='email_not_confirmed'?'请先点击验证邮件中的链接，再登录。':'邮箱或密码不正确，或服务暂时不可用。'},401);return json({ok:true,user:{id:data.user.id,email:data.user.email}});}
  if(action==='signup'){const {data,error}=await db.auth.signUp({email:(email as string).trim(),password:password as string,options:{emailRedirectTo:origin+'/auth/callback'}});if(error)return json({error:error.status===429?'注册或邮件发送过于频繁，请稍后再试。':'注册未完成，请检查密码要求或稍后重试。'},400);return json({ok:true,signedIn:!!data.session,message:'如该邮箱可注册，验证邮件已发送。请检查收件箱和垃圾邮件。'});}
  if(action==='reset'){const {error}=await db.auth.resetPasswordForEmail((email as string).trim(),{redirectTo:origin+'/auth/callback?next=recovery'});if(error)return json({error:'重置邮件暂时无法发送，请稍后重试。'},502);return json({ok:true,message:'如果该邮箱已注册，你会收到重置密码邮件。'});}
  const {data:{user},error:identityError}=await db.auth.getUser();if(identityError||!user)return json({error:'请先登录，或重新打开密码重置邮件。'},401);
  const {error}=await db.auth.updateUser({password:password as string});return error?json({error:'修改失败，请换一个符合要求的新密码或重新验证。'},400):json({ok:true,message:'密码已更新。'});
 }catch{return json({error:'账户服务连接失败，请稍后重试。'},502);}
}
