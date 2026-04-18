create table if not exists public.deleted_vendors_log (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid not null,
  vendor_name text,
  service_id uuid,
  service_name text,
  reason text not null,
  deleted_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.deleted_vendors_log enable row level security;

create policy "Admins can view and insert deleted vendor logs"
  on public.deleted_vendors_log
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );
