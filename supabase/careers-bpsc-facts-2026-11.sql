-- BPSC career facts and exam eligibility from the Integrated 72nd CCE advertisement (in Hindi; lines are
-- faithful English translations, marked "translated": true so the site says so), and a UPSC CSE correction.
-- Source: https://bpsc.bihar.gov.in/wp-content/uploads/BPSC_content/Notices/Advertisement-Integrated-72th-CCE-PT_BPSC-20260505-p1euvo.pdf
--   p.3 §2 educational qualification; p.5 §4 age limits; p.3-4 §3 reservation; p.6 §5 physical fitness, §6 fee,
--   Part I preliminary examination.

begin;

with src as (select 'https://bpsc.bihar.gov.in/wp-content/uploads/BPSC_content/Notices/Advertisement-Integrated-72th-CCE-PT_BPSC-20260505-p1euvo.pdf'::text as url),
items as (
  select
    jsonb_build_object('text', 'A graduate degree from a recognised university, or a pass in an equivalent examination, is mandatory.', 'source_url', url, 'translated', true) as edu,
    jsonb_build_object('text', 'Age on 01.08.2026: minimum 20, 21 or 22 years depending on the post; maximum 37 years for unreserved men, 40 years for unreserved women and for Backward Class and Extremely Backward Class candidates (men and women), and 42 years for Scheduled Caste and Scheduled Tribe candidates (men and women).', 'source_url', url, 'translated', true) as age,
    jsonb_build_object('text', 'Reservation benefits are given only to original (domicile) residents of Bihar; candidates from outside Bihar compete as unreserved.', 'source_url', url, 'translated', true) as domicile,
    jsonb_build_object('text', 'Candidates for the Bihar Police Service must also meet the physical test rules published in Appendix ''A'' of the advertisement, and every candidate must be found fit by the medical board.', 'source_url', url, 'translated', true) as police,
    jsonb_build_object('text', 'Child Development Project Officer: a graduate degree from a recognised university, with one of Home Science, Psychology, Sociology or Labour and Social Welfare chosen as the optional subject for the Main examination.', 'source_url', url, 'translated', true) as cdpo,
    jsonb_build_object('text', 'Financial Administrative Officer: a graduate degree in Commerce, Economics, Mathematics or Statistics from a recognised university or an institution affiliated to it.', 'source_url', url, 'translated', true) as fao,
    jsonb_build_array(
      jsonb_build_object('text', 'Apply online on the Commission''s website, https://bpsc.bihar.gov.in; the fee is ₹100 for each examination applied for.', 'source_url', url, 'translated', true),
      jsonb_build_object('text', 'Preliminary examination: one objective General Studies paper of 150 marks and two hours, with one-third negative marking. It only screens candidates — ten times the number of vacancies are selected for the Main examination.', 'source_url', url, 'translated', true),
      jsonb_build_object('text', 'Main (written) examination, followed by an interview (personality test); certificates are verified at the interview and the final merit list decides the post allotted.', 'source_url', url, 'translated', true)
    ) as steps,
    url
  from src
)
update public.careers c set
  eligibility = case
    when c.slug = 'bihar-cdpo' then jsonb_build_array(i.cdpo, i.age, i.domicile)
    when c.slug = 'bihar-financial-administrative-officer' then jsonb_build_array(i.fao, i.age, i.domicile)
    when c.slug = 'bihar-police-dsp' then jsonb_build_array(i.edu, i.age, i.domicile, i.police)
    else jsonb_build_array(i.edu, i.age, i.domicile) end,
  how_to_enter = i.steps,
  facts_source_url = i.url,
  verified_at = now()
from items i
where c.slug like 'bihar-%' and coalesce(jsonb_array_length(c.eligibility), 0) = 0;

-- BPSC CCE eligibility record (none existed)
insert into public.exam_eligibility (exam_id, min_percentage, class_required, stream_required, age_min, age_max, nationality)
select e.id, null, 'Graduate', 'Any', 20, 37, 'Indian'
from public.exams e
where e.slug = 'bpsc' and not exists (select 1 from public.exam_eligibility x where x.exam_id = e.id);

-- UPSC CSE: the notification asks only for a graduate degree, with no minimum percentage
update public.exam_eligibility x set min_percentage = null
from public.exams e
where e.id = x.exam_id and e.slug = 'upsc-cse' and x.min_percentage is not null;

commit;
