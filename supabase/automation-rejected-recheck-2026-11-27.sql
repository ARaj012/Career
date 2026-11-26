-- Re-check of rejected automation changes, 27 November 2026
--
-- 19 rejected changes ("Would change a value that was already verified") that might have
-- added information were re-checked against their official sources. Only single facts that
-- the official page states word for word are added; proposals were not approved wholesale,
-- because several also carried broken fragments or would have dropped verified facts.
--
-- Added (6 facts):
--   * CMA: ICSI Foundation exemption            -- icmai.in/ClntStudents/CourseEligibility
--   * Commercial Pilot: merit-based selection    -- igrua.gov.in/selection-procedure
--   * Nuclear Scientist (BARC): starting pay      -- barc.gov.in/careers/officers.html (also in the brochure)
--   * Nuclear Scientist (BARC): two-step selection, guaranteed employment, 3-year service bond
--                                                 -- barc.gov.in/careers/barc_ts_OCES_DGFS_brochure.pdf (OCES/DGFS-2026)
-- Kept rejected (reasons appended to each proposal below).
-- Each insert is skipped if the fact is already there, so this file can be run again safely.

-- CMA: insert the ICSI exemption after "passed Class 10" (page order)
update public.careers set
  eligibility = jsonb_insert(eligibility, '{1}', jsonb_build_object(
    'text', 'Any candidate who has passed the Foundation Examination conducted by the Institute of Company Secretaries of India will be exempted from the Foundation Course & vice versa',
    'source_url', 'https://www.icmai.in/ClntStudents/CourseEligibility')),
  verified_at = now()
where id = '9df6bdd5-95e3-40d1-8909-76c0beae9e0e'
  and not eligibility::text like '%Institute of Company Secretaries of India will be exempted%';

-- Commercial Pilot: insert merit-based selection after "Pilot Aptitude Test and Interview"
update public.careers set
  how_to_enter = jsonb_insert(how_to_enter, '{2}', jsonb_build_object(
    'text', 'The selection of candidates for Ab-initio to CPL Course is done as per merit compiled after Online Test, Pilot Aptitude Test and the Interview.',
    'source_url', 'https://igrua.gov.in/selection-procedure')),
  verified_at = now()
where id = 'e6842444-9ae7-477e-8c36-3d12d775bb86'
  and not how_to_enter::text like '%done as per merit compiled%';

-- Nuclear Scientist (BARC): official starting pay
update public.careers set
  official_pay = 'Appointment in all the units shall be as a Scientific Officer ''C'' (SO/C) in the Level 10 - ₹ 56,100 of the 7th Central Pay Commission Pay Matrix',
  official_pay_min = 56100,
  verified_at = now()
where id = '24a24d0b-fd16-42d1-b60c-075ea9cbe460' and official_pay is null;

-- Nuclear Scientist (BARC): selection, employment and bond from the OCES/DGFS-2026 brochure
update public.careers set
  how_to_enter = how_to_enter || jsonb_build_array(
    jsonb_build_object('text', 'Selection to OCES/DGFS-2026 programme is a two-step process: 1. Screening to short-list candidates followed by 2. selection interviews of the short-listed candidates.',
                       'source_url', 'https://www.barc.gov.in/careers/barc_ts_OCES_DGFS_brochure.pdf'),
    jsonb_build_object('text', 'Successful completion of the Training schemes guarantees employment as Scientific Officer',
                       'source_url', 'https://www.barc.gov.in/careers/barc_ts_OCES_DGFS_brochure.pdf'),
    jsonb_build_object('text', 'Selected candidates for OCES-2026 are required to execute an agreement and a Personal Indemnity Bond to serve DAE for at least three years after completion of training.',
                       'source_url', 'https://www.barc.gov.in/careers/barc_ts_OCES_DGFS_brochure.pdf')),
  verified_at = now()
where id = '24a24d0b-fd16-42d1-b60c-075ea9cbe460'
  and not how_to_enter::text like '%two-step process%';

-- Record the outcome on each re-checked proposal (shown on the admin Rejected tab)
update public.automation_proposals p set reason = p.reason || ' | Re-checked 27 Nov 2026: ' || v.note
from (values
  ('cb36cd60-6532-480e-8b4a-8b057e90cab0'::uuid, 'the ICSI exemption was confirmed on the ICMAI page and added; the other facts were already on the site'),
  ('b14e598d-ac74-4827-ab28-8f426d3f04c8'::uuid, 'everything here is already on the site'),
  ('4687ef1d-270e-42f7-affb-8c00cfa93f56'::uuid, 'merit-based selection was confirmed on igrua.gov.in and added; eligibility was already on the site; the other lines were cut-off fragments'),
  ('55083ca8-15a2-43e5-8671-8fddd5cbfd10'::uuid, 'merit-based selection was added from the newer proposal; the rest is already on the site'),
  ('5c77673e-a985-4880-b7b0-d6ef512718de'::uuid, 'pay, two-step selection, guaranteed employment and the service bond were confirmed and added; the age limits apply to KSKRA, not OCES/DGFS, so they were left out'),
  ('2a85f98f-0c22-4940-9db3-afed7e128b75'::uuid, 'dates are for the past FTII-ET 2025-26 cycle, so not added'),
  ('0c5f5cef-044e-4f93-a248-551ebc3471b6'::uuid, 'the ST scholarship is already on the site; the admission text was garbled'),
  ('c76ddc96-d50a-45e8-abc6-acb6b7585ae4'::uuid, 'the extra scholarships are national schemes, not the institute''s own; the admission text is for foreign students only'),
  ('6396d9f6-6b14-48ca-94e7-637b6b57aa98'::uuid, 'Rs 40,000 is the professional fee of the A.H.D.P. diploma, not the main programme'),
  ('bfe897e6-462b-41b9-b9e5-1eed478db11f'::uuid, 'NTA extended the last date to 31 October 2026 (public notice of 27.10.2026, repeated on 01.11.2026), so 31 October is correct'),
  ('9bf54f35-0b1c-4805-bb8f-01da73f4dd6c'::uuid, 'Rs 2 lakh a year is the research grant, not the monthly fellowship')
) as v(id, note)
where p.id = v.id and p.reason not like '%Re-checked 27 Nov 2026%';

-- Cinematographer: "How to enter" held only a broken fragment ("Result of Paper-I of Stage-1
-- for all", a line from the prospectus's dates table). Replaced with the selection process as the
-- FTII prospectus states it (section "Stages of Selection Process ...", pages 59-60). The
-- cycle-specific dates are left out because that entrance cycle is over.
update public.careers set
  how_to_enter = jsonb_build_array(
    jsonb_build_object('text', 'Stage-1: Written Test with two papers (Paper-I Objective and Paper II Subjective)',
                       'source_url', 'https://ftii.ac.in/api/serve/2026/03/16/Admission_Prospectus_FTII-ET-2025-26.pdf'),
    jsonb_build_object('text', 'Stage-2: Mixed Format Assessment-Practical, Analytical, Performance & Interaction',
                       'source_url', 'https://ftii.ac.in/api/serve/2026/03/16/Admission_Prospectus_FTII-ET-2025-26.pdf'),
    jsonb_build_object('text', 'Candidates qualifying in Stage-1 (Written Test) must appear for further Stage-2 of the examination.',
                       'source_url', 'https://ftii.ac.in/api/serve/2026/03/16/Admission_Prospectus_FTII-ET-2025-26.pdf'),
    jsonb_build_object('text', 'The final merit list will be prepared on the basis of cumulative performance in Stage-1 and Stage-2 with 25% and 75% weightage respectively, subject to fulfillment of terms and conditions mentioned in the prospectus.',
                       'source_url', 'https://ftii.ac.in/api/serve/2026/03/16/Admission_Prospectus_FTII-ET-2025-26.pdf')),
  verified_at = now()
where id = 'bf7f54f4-65f2-4721-8fab-5645c76b8e21'
  and how_to_enter::text like '%Result of Paper-I of Stage-1 for all%';

-- RESTORE (undo the added facts)
-- update public.careers set how_to_enter = '[{"text": "Result of Paper-I of Stage-1 for all", "source_url": "https://ftii.ac.in/api/serve/2026/03/16/Admission_Prospectus_FTII-ET-2025-26.pdf"}]'::jsonb where id = 'bf7f54f4-65f2-4721-8fab-5645c76b8e21';
-- update public.careers set eligibility = (select jsonb_agg(e) from jsonb_array_elements(eligibility) e where e->>'text' not like '%Institute of Company Secretaries of India will be exempted%') where id = '9df6bdd5-95e3-40d1-8909-76c0beae9e0e';
-- update public.careers set how_to_enter = (select jsonb_agg(e) from jsonb_array_elements(how_to_enter) e where e->>'text' not like '%done as per merit compiled%') where id = 'e6842444-9ae7-477e-8c36-3d12d775bb86';
-- update public.careers set official_pay = null, official_pay_min = null,
--   how_to_enter = (select jsonb_agg(e) from jsonb_array_elements(how_to_enter) e where e->>'source_url' <> 'https://www.barc.gov.in/careers/barc_ts_OCES_DGFS_brochure.pdf')
--   where id = '24a24d0b-fd16-42d1-b60c-075ea9cbe460';
