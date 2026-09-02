-- Adds the optional free-text message captured on the reason screen.
-- Run this in the Supabase SQL editor on an existing project.

alter table public.proposal_responses
  add column if not exists message text;

create or replace view public.proposal_summary as
select
  session_id,
  min(created_at)                                          as started_at,
  count(*) filter (where event_type = 'no')                as no_count,
  bool_or(event_type = 'yes')                              as said_yes,
  max(reason) filter (where event_type = 'reason')         as reason,
  max(message) filter (where event_type = 'reason')        as message
from public.proposal_responses
group by session_id
order by started_at desc;
