create table if not exists public.nexus_custom_nodes (
  id uuid primary key default gen_random_uuid(),
  n8n_type text not null unique,
  nexus_id text not null unique,
  name text not null,
  description text not null default '',
  category text not null default 'utility',
  icon text not null default '⚙️',
  color text not null default '#a3a3a3',
  inputs jsonb not null default '[]'::jsonb,
  outputs jsonb not null default '[]'::jsonb,
  fields jsonb not null default '[]'::jsonb,
  credentials jsonb default '[]'::jsonb,
  executor text not null default 'noop',
  tags jsonb default '[]'::jsonb,
  definition jsonb not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.nexus_custom_nodes is 'Dynamically generated Nexus node definitions from n8n node types.';

-- Enable RLS
alter table public.nexus_custom_nodes enable row level security;

-- Allow read access to all authenticated users
create policy "Allow authenticated read" on public.nexus_custom_nodes
  for select to authenticated using (true);

-- Allow admin/owner write access
create policy "Allow admin write" on public.nexus_custom_nodes
  for all to authenticated using (
    exists (
      select 1 from public.users where id = auth.uid() and role in ('ADMIN', 'OWNER')
    )
  );
