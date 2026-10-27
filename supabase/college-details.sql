-- =====================================================================
-- College details from official sources (run after automation-v2.sql)
-- Safe to re-run.
--
-- Every course, cutoff and placement row records where it came from:
--   official / nirf / official_report  = read from an official source with evidence
--   unverified                         = typed by hand or copied from third-party sites
-- retire_replaced_unverified() deletes an old value once an official one replaces it.
-- =====================================================================

-- Courses: where each course/fee came from
alter table public.college_courses add column if not exists source_type text not null default 'unverified';
alter table public.college_courses add column if not exists source_url text;
alter table public.college_courses add column if not exists verified_at timestamptz;
alter table public.college_courses add column if not exists total_fees integer;
alter table public.college_courses add column if not exists fee_note text;
alter table public.college_courses drop constraint if exists college_courses_source_type_check;
alter table public.college_courses add constraint college_courses_source_type_check check (source_type in ('official', 'unverified'));

-- Cutoffs: official counselling data carries round, quota and opening rank
alter table public.college_exam_cutoffs add column if not exists source_type text not null default 'unverified';
alter table public.college_exam_cutoffs add column if not exists source_url text;
alter table public.college_exam_cutoffs add column if not exists program_name text;
alter table public.college_exam_cutoffs add column if not exists round text;
alter table public.college_exam_cutoffs add column if not exists quota text;
alter table public.college_exam_cutoffs add column if not exists opening_rank integer;
alter table public.college_exam_cutoffs drop constraint if exists college_exam_cutoffs_source_type_check;
alter table public.college_exam_cutoffs add constraint college_exam_cutoffs_source_type_check check (source_type in ('official', 'unverified'));
-- Replacing a hand-typed course must not delete the cutoffs attached to it
alter table public.college_exam_cutoffs drop constraint if exists college_exam_cutoffs_course_id_fkey;
alter table public.college_exam_cutoffs add constraint college_exam_cutoffs_course_id_fkey foreign key (course_id) references public.college_courses(id) on delete set null;

-- Colleges: provenance of the text and fee fields, and institute-run scholarships
alter table public.colleges add column if not exists admission_source_url text;
alter table public.colleges add column if not exists admission_verified_at timestamptz;
alter table public.colleges add column if not exists fees_source_url text;
alter table public.colleges add column if not exists fees_verified_at timestamptz;
alter table public.colleges add column if not exists institute_scholarships jsonb not null default '[]'::jsonb;
alter table public.colleges add column if not exists details_checked_at timestamptz;

-- Delete each old (unverified) value once an official value replaces it.
create or replace function public.retire_replaced_unverified() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  n_place_fields int; n_place_rows int; n_courses int; n_cutoffs int;
begin
  -- Placements: NIRF replaces median / rate / counts for that college and year;
  -- an official placement report replaces average / highest for that year
  update college_placements u set
    median_package = null, placement_rate = null, students_placed = null, total_eligible_students = null,
    average_package = case when exists (select 1 from college_placements o where o.college_id = u.college_id and o.year = u.year and o.source_type = 'official_report' and o.average_package is not null) then null else u.average_package end,
    highest_package = case when exists (select 1 from college_placements o where o.college_id = u.college_id and o.year = u.year and o.source_type = 'official_report' and o.highest_package is not null) then null else u.highest_package end
  where u.source_type = 'unverified'
    and exists (select 1 from college_placements o where o.college_id = u.college_id and o.year = u.year and o.source_type <> 'unverified')
    and (u.median_package is not null or u.placement_rate is not null or u.students_placed is not null or u.total_eligible_students is not null
         or exists (select 1 from college_placements o where o.college_id = u.college_id and o.year = u.year and o.source_type = 'official_report'
                    and ((o.average_package is not null and u.average_package is not null) or (o.highest_package is not null and u.highest_package is not null))));
  get diagnostics n_place_fields = row_count;

  delete from college_placements u
  where u.source_type = 'unverified'
    and u.median_package is null and u.average_package is null and u.highest_package is null
    and u.placement_rate is null and u.students_placed is null and coalesce(u.top_recruiters, '') = ''
    and exists (select 1 from college_placements o where o.college_id = u.college_id and o.year = u.year and o.source_type <> 'unverified');
  get diagnostics n_place_rows = row_count;

  -- Courses: a hand-typed course goes once an official course of the same programme exists
  -- (names compared without spaces/punctuation; one may extend the other, e.g. "B.Tech" vs "B.Tech CSE")
  delete from college_courses u
  where u.source_type = 'unverified'
    and exists (
      select 1 from college_courses o
      where o.college_id = u.college_id and o.source_type = 'official'
        and length(regexp_replace(lower(o.course_name), '[^a-z0-9]', '', 'g')) >= 4
        and (regexp_replace(lower(o.course_name), '[^a-z0-9]', '', 'g') = regexp_replace(lower(u.course_name), '[^a-z0-9]', '', 'g')
          or regexp_replace(lower(u.course_name), '[^a-z0-9]', '', 'g') like regexp_replace(lower(o.course_name), '[^a-z0-9]', '', 'g') || '%'));
  get diagnostics n_courses = row_count;

  -- Cutoffs: an official cutoff for the same college, exam and year replaces the old ones
  delete from college_exam_cutoffs u
  where u.source_type = 'unverified'
    and exists (select 1 from college_exam_cutoffs o where o.college_id = u.college_id and o.exam_id = u.exam_id and o.year = u.year and o.source_type = 'official');
  get diagnostics n_cutoffs = row_count;

  return jsonb_build_object('placement_rows_trimmed', n_place_fields, 'placement_rows_deleted', n_place_rows, 'courses_deleted', n_courses, 'cutoffs_deleted', n_cutoffs);
end $$;
revoke all on function public.retire_replaced_unverified() from public, anon, authenticated;

notify pgrst, 'reload schema';
