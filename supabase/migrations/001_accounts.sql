-- 在你自己的 Supabase 项目 SQL Editor 执行。
-- 密码与邮箱由 Supabase Auth 管理，不保存在业务表中。
begin;
create table if not exists public.user_vaults (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null,
 revision integer not null default 1 check (revision > 0),
 updated_at timestamptz not null default now(),
 constraint vault_size check (octet_length(payload::text) <= 3145728),
 constraint vault_shape check (
  jsonb_typeof(payload)='object' and payload @> '{"version":1}'::jsonb
  and jsonb_typeof(payload->'readings')='array'
  and jsonb_typeof(payload->'profiles')='array'
  and jsonb_typeof(payload->'chats')='array'
  and jsonb_typeof(payload->'settings')='object'
  and payload ?& array['version','readings','profiles','chats','settings']
 )
);
alter table public.user_vaults enable row level security;
drop policy if exists vault_owner_read on public.user_vaults;
create policy vault_owner_read on public.user_vaults for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.user_vaults from anon, authenticated;
grant select on public.user_vaults to authenticated;

-- 唯一写入入口：身份取自已验证JWT，不接受客户端user_id。
-- 原子版本检查防止不同设备静默覆盖。
create or replace function public.save_user_vault(p_payload jsonb,p_expected_revision integer)
returns integer language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid(); new_revision integer;
begin
 if actor is null then raise exception 'UNAUTHENTICATED'; end if;
 if p_expected_revision is null or p_expected_revision<0 then raise exception 'INVALID_REVISION'; end if;
 if p_expected_revision=0 then
  insert into public.user_vaults(user_id,payload) values(actor,p_payload)
  on conflict(user_id) do nothing returning revision into new_revision;
 else
  update public.user_vaults set payload=p_payload,revision=revision+1,updated_at=now()
  where user_id=actor and revision=p_expected_revision returning revision into new_revision;
 end if;
 if new_revision is null then raise exception 'VERSION_CONFLICT'; end if;
 return new_revision;
end;
$$;
revoke all on function public.save_user_vault(jsonb,integer) from public,anon;
grant execute on function public.save_user_vault(jsonb,integer) to authenticated;
commit;
