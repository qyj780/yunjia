import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export function authConfigured(){return !!process.env.SUPABASE_URL?.trim() && !!process.env.SUPABASE_PUBLISHABLE_KEY?.trim();}
export async function databaseClient(){
 if(!authConfigured())throw new Error('AUTH_NOT_CONFIGURED');
 const jar=await cookies();
 return createServerClient(process.env.SUPABASE_URL!.trim(),process.env.SUPABASE_PUBLISHABLE_KEY!.trim(),{
  cookieOptions:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'},
  cookies:{getAll:()=>jar.getAll(),setAll:values=>{for(const {name,value,options}of values)jar.set(name,value,options);}},
 });
}
