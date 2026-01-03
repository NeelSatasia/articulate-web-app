create or replace function public.handle_user_sync()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (user_uid, user_email, user_name)
  values (
    new.id,                        
    new.email,                     
    new.raw_user_meta_data->>'full_name' 
  )
  on conflict (user_uid) do update
  set
    user_email = excluded.user_email,
    user_name = excluded.user_name;
  
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_user_sync();

create trigger on_auth_user_updated
  after update on auth.users
  for each row execute procedure public.handle_user_sync();