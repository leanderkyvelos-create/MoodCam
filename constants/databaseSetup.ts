
export const SQL_SETUP_SCRIPT = `
-- 1. Create Tables (Idempotent)
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  name text,
  handle text,
  avatar_url text,
  region text,
  location text,
  friends jsonb default '[]'::jsonb,
  incoming_requests jsonb default '[]'::jsonb,
  outgoing_requests jsonb default '[]'::jsonb,
  settings jsonb default '{"theme": "dark", "language": "en", "privateAccount": true}'::jsonb
);

create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  image_src text,
  mood jsonb,
  region text,
  location text,
  is_public boolean default false,
  likes jsonb default '[]'::jsonb,
  comments jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references profiles(id),
  receiver_id uuid references profiles(id),
  content text,
  shared_post_id uuid references posts(id),
  created_at timestamptz default now()
);

-- 2. Ensure Columns Exist (Safe for updates)
do $$ 
begin
  alter table profiles add column if not exists region text;
  alter table profiles add column if not exists location text;
  alter table posts add column if not exists region text;
  alter table posts add column if not exists location text;
  alter table posts add column if not exists is_public boolean default false;
  alter table messages add column if not exists shared_post_id uuid references posts(id);
exception
  when others then null;
end $$;

-- 3. Security Policies (RLS)
alter table profiles enable row level security;
alter table posts enable row level security;
alter table messages enable row level security;

-- Drop old policies to prevent duplicates/errors
do $$ 
begin
  drop policy if exists "Public profiles" on profiles;
  drop policy if exists "Users insert own profile" on profiles;
  drop policy if exists "Users update own profile" on profiles;
  
  drop policy if exists "Public posts" on posts;
  drop policy if exists "Users create posts" on posts;
  drop policy if exists "Users update own posts" on posts;
  
  drop policy if exists "Users can read messages" on messages;
  drop policy if exists "Users can send messages" on messages;
end $$;

-- Recreate Policies
create policy "Public profiles" on profiles for select using (true);
create policy "Users insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);

create policy "Public posts" on posts for select using (true);
create policy "Users create posts" on posts for insert with check (auth.uid() = user_id);
create policy "Users update own posts" on posts for update using (auth.uid() = user_id);

create policy "Users can read messages" on messages 
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages" on messages 
  for insert with check (auth.uid() = sender_id);

-- 4. ROBUST FRIEND REQUEST FUNCTIONS (RPC)

-- Function to SEND a request
create or replace function send_friend_request(target_user_id uuid)
returns void as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'Not logged in'; end if;
  if current_user_id = target_user_id then raise exception 'Cannot add self'; end if;

  -- 1. Update sender (me): Add to outgoing
  update public.profiles
  set outgoing_requests = (
    select jsonb_agg(distinct elem)
    from jsonb_array_elements_text(coalesce(outgoing_requests, '[]'::jsonb) || to_jsonb(target_user_id::text)) elem
  )
  where id = current_user_id;

  -- 2. Update receiver (them): Add to incoming
  update public.profiles
  set incoming_requests = (
    select jsonb_agg(distinct elem)
    from jsonb_array_elements_text(coalesce(incoming_requests, '[]'::jsonb) || to_jsonb(current_user_id::text)) elem
  )
  where id = target_user_id;
end;
$$ language plpgsql security definer;

-- Function to ACCEPT a request
create or replace function accept_friend_request(requester_user_id uuid)
returns void as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'Not logged in'; end if;

  -- 1. Add to my friends, remove from incoming
  update public.profiles
  set 
    friends = (
      select jsonb_agg(distinct elem)
      from jsonb_array_elements_text(coalesce(friends, '[]'::jsonb) || to_jsonb(requester_user_id::text)) elem
    ),
    incoming_requests = (
      select coalesce(jsonb_agg(elem), '[]'::jsonb)
      from jsonb_array_elements_text(coalesce(incoming_requests, '[]'::jsonb)) elem
      where elem != requester_user_id::text
    )
  where id = current_user_id;

  -- 2. Add to their friends, remove from outgoing
  update public.profiles
  set 
    friends = (
      select jsonb_agg(distinct elem)
      from jsonb_array_elements_text(coalesce(friends, '[]'::jsonb) || to_jsonb(current_user_id::text)) elem
    ),
    outgoing_requests = (
      select coalesce(jsonb_agg(elem), '[]'::jsonb)
      from jsonb_array_elements_text(coalesce(outgoing_requests, '[]'::jsonb)) elem
      where elem != current_user_id::text
    )
  where id = requester_user_id;
end;
$$ language plpgsql security definer;

-- 5. Auto-Profile Trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, handle, avatar_url, region, location, settings)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'New User'),
    coalesce(new.raw_user_meta_data->>'handle', 'user_' || substr(new.id::text, 1, 6)),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    coalesce(new.raw_user_meta_data->>'region', 'GLOBAL'),
    coalesce(new.raw_user_meta_data->>'location', 'Unknown'),
    coalesce(new.raw_user_meta_data->'settings', '{"theme": "dark", "language": "en", "privateAccount": true}'::jsonb)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
`;
