-- Run this in the Supabase SQL editor.

create table if not exists public.proposal_responses (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  session_id     text        not null,
  event_type     text        not null check (event_type in ('no', 'yes', 'reason')),
  attempt_number integer     not null,
  button_label   text,
  reason         text,
  user_agent     text
);

create index if not exists proposal_responses_session_idx
  on public.proposal_responses (session_id, created_at);

alter table public.proposal_responses enable row level security;

-- The website only ever inserts. Anyone with the anon key may insert,
-- nobody with the anon key may read, update, or delete.
drop policy if exists "anon can insert responses" on public.proposal_responses;
create policy "anon can insert responses"
  on public.proposal_responses
  for insert
  to anon
  with check (true);

-- Handy view: how many "no"s did it take before each "yes"?
create or replace view public.proposal_summary as
select
  session_id,
  min(created_at)                                          as started_at,
  count(*) filter (where event_type = 'no')                as no_count,
  bool_or(event_type = 'yes')                              as said_yes,
  max(reason) filter (where event_type = 'reason')         as reason
from public.proposal_responses
group by session_id
order by started_at desc;
