-- =====================================================================
-- Official exam syllabus and official exam cutoffs (qualifying marks).
-- Old hand-typed rows stay, labelled unverified. An official cutoff for
-- the same exam and year replaces them (retire_replaced_unverified).
-- Safe to run more than once.
-- =====================================================================

-- Syllabus: official units read from the conducting body's syllabus / bulletin.
-- The older rows (focus areas with estimated weightage) stay 'unverified'.
alter table public.exam_syllabus add column if not exists source_type text not null default 'unverified';
alter table public.exam_syllabus add column if not exists source_url text;
alter table public.exam_syllabus add column if not exists verified_at timestamptz;
alter table public.exam_syllabus add column if not exists added_at timestamptz;   -- null = in the first official list we read
alter table public.exam_syllabus add column if not exists sort_order integer;
alter table public.exam_syllabus drop constraint if exists exam_syllabus_source_type_check;
alter table public.exam_syllabus add constraint exam_syllabus_source_type_check check (source_type in ('official', 'unverified'));

alter table public.exams add column if not exists syllabus_checked_at timestamptz;
alter table public.exams add column if not exists syllabus_source_url text;
alter table public.exams add column if not exists syllabus_verified_at timestamptz;
-- Latest official change: {"date":"…","added":[{"subject","topic"}],"removed":[…],"source_url":"…"}
alter table public.exams add column if not exists syllabus_changes jsonb;

-- Cutoffs: qualifying marks / percentiles published by the conducting body
alter table public.exam_national_cutoffs add column if not exists source_type text not null default 'unverified';
alter table public.exam_national_cutoffs add column if not exists verified_at timestamptz;
alter table public.exam_national_cutoffs drop constraint if exists exam_national_cutoffs_source_type_check;
alter table public.exam_national_cutoffs add constraint exam_national_cutoffs_source_type_check check (source_type in ('official', 'unverified'));
alter table public.exams add column if not exists cutoffs_checked_at timestamptz;

-- Same function as in college-details.sql, plus exam cutoffs
create or replace function public.retire_replaced_unverified() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  n_place_fields int; n_place_rows int; n_courses int; n_cutoffs int; n_exam_cutoffs int;
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
  delete from college_courses u
  where u.source_type = 'unverified'
    and exists (
      select 1 from college_courses o
      where o.college_id = u.college_id and o.source_type = 'official'
        and length(regexp_replace(lower(o.course_name), '[^a-z0-9]', '', 'g')) >= 4
        and (regexp_replace(lower(o.course_name), '[^a-z0-9]', '', 'g') = regexp_replace(lower(u.course_name), '[^a-z0-9]', '', 'g')
          or regexp_replace(lower(u.course_name), '[^a-z0-9]', '', 'g') like regexp_replace(lower(o.course_name), '[^a-z0-9]', '', 'g') || '%'));
  get diagnostics n_courses = row_count;

  -- College cutoffs: an official cutoff for the same college, exam and year replaces the old ones
  delete from college_exam_cutoffs u
  where u.source_type = 'unverified'
    and exists (select 1 from college_exam_cutoffs o where o.college_id = u.college_id and o.exam_id = u.exam_id and o.year = u.year and o.source_type = 'official');
  get diagnostics n_cutoffs = row_count;

  -- Exam cutoffs: an official cutoff for the same exam and year replaces the old ones
  delete from exam_national_cutoffs u
  where u.source_type = 'unverified'
    and exists (select 1 from exam_national_cutoffs o where o.exam_id = u.exam_id and o.year = u.year and o.source_type = 'official');
  get diagnostics n_exam_cutoffs = row_count;

  return jsonb_build_object('placement_rows_trimmed', n_place_fields, 'placement_rows_deleted', n_place_rows, 'courses_deleted', n_courses,
                            'cutoffs_deleted', n_cutoffs, 'exam_cutoffs_deleted', n_exam_cutoffs);
end $$;
revoke all on function public.retire_replaced_unverified() from public, anon, authenticated;

notify pgrst, 'reload schema';
