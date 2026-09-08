import { NextRequest,NextResponse } from 'next/server';
import { databaseClient } from '@/lib/supabase/server';
export async function GET(req:NextRequest){
 const code=req.nextUrl.searchParams.get('code');
 const destination=new URL('/account',process.env.SITE_URL?.trim() || req.nextUrl.protocol+'//'+(req.headers.get('host')||req.nextUrl.host));
 try{if(!code)throw Error();const db=await databaseClient();const {error}=await db.auth.exchangeCodeForSession(code);if(error)throw error;if(req.nextUrl.searchParams.get('next')==='recovery')destination.searchParams.set('mode','update-password');else destination.searchParams.set('confirmed','1');}
 catch{destination.searchParams.set('error','confirmation');}
 const response=NextResponse.redirect(destination);response.headers.set('Cache-Control','private, no-store');return response;
}
