-- Creator economy profile fields + self-update policy.
-- Additive and idempotent.

alter table public.users
  add column if not exists bio text,
  add column if not exists website text,
  add column if not exists github_username text,
  add column if not exists twitter_username text,
  add column if not exists linkedin_url text,
  add column if not exists discord_url text;

-- Allow users to update their own profile row (no UPDATE policy existed before,
-- so profile edits were silently blocked by RLS).
drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
