-- CLI login requests table
create table if not exists public.cli_login_requests (
  id uuid default gen_random_uuid() primary key,
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied', 'expired')),
  user_id uuid references auth.users on delete cascade,
  email text,
  expires_at timestamptz not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Index for token lookups
create index if not exists cli_login_requests_token_idx on public.cli_login_requests(token);
create index if not exists cli_login_requests_user_id_idx on public.cli_login_requests(user_id);

-- Enable RLS
alter table public.cli_login_requests enable row level policy;

-- Policy: anyone can insert (for creating login requests)
create policy "Anyone can create login requests" on public.cli_login_requests
  for insert with check (true);

-- Policy: users can read their own login requests
create policy "Users can read own login requests" on public.cli_login_requests
  for select using (auth.uid() = user_id);

-- Policy: users can update their own login requests
create policy "Users can update own login requests" on public.cli_login_requests
  for update using (auth.uid() = user_id);

-- Policy: service role can manage all (for the auth approval flow)
create policy "Service role can manage all login requests" on public.cli_login_requests
  for all using (auth.role() = 'service_role');

-- Function to update updated_at
create or replace function public.update_cli_login_requests_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
drop trigger if exists update_cli_login_requests_updated_at on public.cli_login_requests;
create trigger update_cli_login_requests_updated_at
  before update on public.cli_login_requests
  for each row
  execute function public.update_cli_login_requests_updated_at();
