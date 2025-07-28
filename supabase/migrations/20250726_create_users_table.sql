create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text check (role in ('admin', 'user')) default 'user',
  created_at timestamp with time zone default now()
);
