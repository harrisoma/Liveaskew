-- New guides contain eight looks. Preserve existing seven-look jobs and their receipts.
alter table public.weekly_guides drop constraint weekly_guides_look_ids_check;
alter table public.weekly_guides add constraint weekly_guides_look_ids_check
  check (cardinality(look_ids) in (7, 8));
