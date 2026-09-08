import { NextRequest } from 'next/server';
import { authConfigured,databaseClient } from '@/lib/supabase/server';
import { boundedJSON,json,sameOrigin } from '@/lib/http';
import { validateBackup } from '@/lib/local-data';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function identity(){if(!authConfigured())return {failure:json({error:'数据库尚未配置。'},503)};const db=await databaseClient();const {data:{user},error}=await db.auth.getUser();if(error||!user)return {failure:json({error:'请先登录。'},401)};return {db,user};}
export async function GET(){try{const access=await identity();if(access.failure)return access.failure;const {data,error}=await access.db!.from('user_vaults').select('payload,revision,updated_at').eq('user_id',access.user!.id).maybeSingle();if(error)return json({error:'云端数据无法读取，请确认已执行建表脚本。'},502);return json({vault:data,ownerId:access.user!.id});}catch{return json({error:'数据库连接失败。'},502);}}
export async function PUT(req:NextRequest){if(!sameOrigin(req))return json({error:'请从本站保存云端数据。'},403);try{const access=await identity();if(access.failure)return access.failure;let input:unknown;try{input=await boundedJSON(req,3*1024*1024);}catch{return json({error:'数据格式错误或超过3MB。'},400);}if(!input||typeof input!=='object'||!('payload'in input)||!('revision'in input)||!Number.isSafeInteger(input.revision)||Number(input.revision)<0)return json({error:'保存请求无效。'},400);if(!('ownerId' in input)||input.ownerId!==access.user!.id)return json({error:'登录账户已变化，请刷新页面后重试。'},409);try{validateBackup(input.payload);}catch{return json({error:'备份内容未通过校验。'},400);}
 const {data,error}=await access.db!.rpc('save_user_vault',{p_payload:input.payload,p_expected_revision:input.revision});if(error){if(error.message.includes('VERSION_CONFLICT'))return json({error:'云端记录已被另一设备更新，请重新读取云端状态后再决定是否覆盖。'},409);return json({error:'云端保存失败，请确认建表脚本已执行且数据不超过3MB。'},502);}return json({revision:data});
 }catch{return json({error:'数据库连接失败。'},502);}}
