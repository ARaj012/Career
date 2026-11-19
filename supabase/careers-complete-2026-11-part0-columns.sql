-- Career completeness, part 0: per-career content that replaces the old category templates
-- on the career page (applied as migrations on 19 Nov 2026).

alter table public.careers
  add column if not exists path_steps text[],
  add column if not exists top_employers text[],
  add column if not exists related_college_slugs text[];

comment on column public.careers.path_steps is 'Step-by-step route into this career, written for this career (shown when there is no official route from the governing body)';
comment on column public.careers.top_employers is 'Typical employers or places of work for this career';
comment on column public.careers.related_college_slugs is 'Colleges that train for this career, used when its entrance exams do not already point to colleges';
