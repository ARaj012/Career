-- Scholarship apply links fixed on 24 Nov 2026.
-- Every link was opened from India: portals that no longer exist (DNS), or whose
-- security certificate browsers reject, were swapped for the current official page.
--   online.ksb.gov.in (gone)            -> ksb.gov.in "How to apply" (register/login on the main KSB site)
--   aicte-pragati-saksham-gov.in (gone) -> National Scholarship Portal, where AICTE Pragati/Saksham now run
--   pgscholarship.aicte-india.org       -> pgscholarship.aicte.gov.in (where it redirects)
--   wbmdfcscholarship.in (down)         -> nspwb.wbmdfc.org (NSP-WB, the current Aikyashree portal)
--   scholarships.mizoram.gov.in (down)  -> msb.mizoram.gov.in (Mizoram Scholarship Board)
--   hpepass.cgg.gov.in (down)           -> National Scholarship Portal (HP state and central schemes are listed there)
--   bcebconline.bihar.gov.in (certificate rejected) -> the scheme pages on myScheme (Govt of India), which link to it
--   icar.nta.ac.in (certificate rejected)           -> ICAR NTS-PG page on myScheme; exam via exams.nta.nic.in
--   socialjustice.gov.in guideline PDF (503)        -> Free Coaching page on myScheme
--   tcs.dosje.gov.in, yet.nta.ac.in (gone)          -> National Scholarship Portal (text only; the button already used it)
-- Still failing for everyone and left unchanged (no other official site): digitalgujarat.gov.in, cmi.ac.in

update public.scholarships set application_url = 'https://pgscholarship.aicte.gov.in/',
  how_to_apply = replace(how_to_apply, 'https://pgscholarship.aicte-india.org/', 'https://pgscholarship.aicte.gov.in/')
where slug = 'aicte-pg-scholarship-gate-ceed';

update public.scholarships set application_url = 'https://ksb.gov.in/how-apply-scholarship.htm',
  application_deadline = '2026-12-31T23:59:59+05:30',
  how_to_apply = $$1. Register on the Kendriya Sainik Board website: https://ksb.gov.in/registration.htm (the ex-serviceman's details, PPO number, ID card number and Aadhaar are needed).
2. Log in at https://ksb.gov.in/KSBAdmin/Login.aspx and fill in the New Application for PMSS in the first year of your course. Paper applications are not accepted.
3. Upload the documents listed on KSB's "How to apply" page: https://ksb.gov.in/how-apply-scholarship.htm
4. Make sure the status changes from "New" to submitted; 2026-27 applications close on 31 December 2026.
5. Selected students are paid once a year into their bank account.
List of approved courses: https://ksb.gov.in/writereaddata/DownLoad/List_of_Authorised_professional_degree_courses_under_PMSS.pdf$$
where slug = 'pm-scholarship-scheme-ex-servicemen-wards';

update public.scholarships set application_url = 'https://scholarships.gov.in',
  how_to_apply = replace(how_to_apply, '1. Visit the official application portal: https://www.aicte-pragati-saksham-gov.in',
    '1. Apply on the National Scholarship Portal: https://scholarships.gov.in (AICTE''s Pragati and Saksham schemes now run there; scheme details: https://www.aicte.gov.in/schemes/students-development-schemes)')
where slug in ('aicte-pragati-scholarship-girls', 'aicte-saksham-scholarship');

update public.scholarships set application_url = 'https://nspwb.wbmdfc.org/',
  how_to_apply = replace(how_to_apply, 'https://wbmdfcscholarship.in', 'https://nspwb.wbmdfc.org/ (NSP-WB)')
where slug = 'aikyashree-scholarship-west-bengal';

update public.scholarships set application_url = 'https://msb.mizoram.gov.in',
  how_to_apply = replace(how_to_apply, 'scholarships.mizoram.gov.in', 'https://msb.mizoram.gov.in (Mizoram Scholarship Board)')
where slug = 'mizoram-scholarship-board-portal';

update public.scholarships set application_url = 'https://scholarships.gov.in',
  how_to_apply = replace(how_to_apply, '1. Visit the official portal at hpepass.cgg.gov.in.',
    '1. Apply on the National Scholarship Portal: https://scholarships.gov.in, where Himachal Pradesh''s state and central post-matric schemes are listed (the state''s older HP ePASS portal was not reachable when checked on 24 Nov 2026).')
where slug = 'hp-epass-scholarship';

update public.scholarships set application_url = 'https://www.myscheme.gov.in/schemes/mmajeajcspy',
  how_to_apply = replace(how_to_apply, '1. Open the Bihar Civil Seva Protsahan portal: https://bcebconline.bihar.gov.in/cspy/EBCscholarship/Index.aspx',
    '1. Open the scheme page on myScheme (https://www.myscheme.gov.in/schemes/mmajeajcspy) and use its Apply link to reach the Bihar Civil Seva Protsahan portal (bcebconline.bihar.gov.in). If your browser warns about that portal''s security certificate, ask the SC & ST Welfare Department office before entering details.')
where slug = 'bihar-sc-st-civil-sewa-protsahan-yojana';

update public.scholarships set application_url = 'https://www.myscheme.gov.in/schemes/mmapvcspy',
  how_to_apply = replace(how_to_apply, '1. Open the Bihar Civil Seva Protsahan portal: https://bcebconline.bihar.gov.in/cspy/EBCscholarship/Index.aspx',
    '1. Open the scheme page on myScheme (https://www.myscheme.gov.in/schemes/mmapvcspy) and use its Apply link to reach the Bihar Civil Seva Protsahan portal (bcebconline.bihar.gov.in). If your browser warns about that portal''s security certificate, ask the BC & EBC Welfare Department office before entering details.')
where slug = 'bihar-ebc-civil-seva-protsahan-yojana';

update public.scholarships set application_url = 'https://www.myscheme.gov.in/schemes/nts-pg',
  how_to_apply = replace(how_to_apply, '1. Apply for the ICAR PG entrance examination online at https://icar.nta.ac.in (only online forms are accepted).',
    '1. Apply online for the ICAR PG entrance examination run by NTA — find the current link on https://exams.nta.nic.in (only online forms are accepted). Scheme details: https://www.myscheme.gov.in/schemes/nts-pg')
where slug = 'icar-national-talent-scholarship-pg';

update public.scholarships set application_url = 'https://www.myscheme.gov.in/schemes/fcssos',
  how_to_apply = replace(how_to_apply, 'Scheme guidelines: https://socialjustice.gov.in/writereaddata/UploadFile/84931739961630.pdf',
    'Scheme details: https://www.myscheme.gov.in/schemes/fcssos')
where slug = 'free-coaching-scheme-sc-obc';

update public.scholarships set
  how_to_apply = replace(how_to_apply, '1. Visit the official application portal: https://tcs.dosje.gov.in',
    '1. Apply on the National Scholarship Portal: https://scholarships.gov.in')
where slug = 'top-class-education-scheme-sc-students';

update public.scholarships set
  how_to_apply = replace(how_to_apply, '1. Visit the official application portal: https://yet.nta.ac.in',
    '1. Apply on the National Scholarship Portal: https://scholarships.gov.in')
where slug = 'pm-yasasvi-scholarship';

update public.scholarships set
  how_to_apply = replace(how_to_apply, 'https://csirhrdg.res.in/Home/Index/1/Default/3384/60.', 'https://csirhrdg.res.in/Home/Index/1/Default/3384/60')
where slug = 'csir-jrf-net-fellowship';

-- Only the links changed, so verified_at (which vouches for the whole record) is left alone
update public.scholarships set updated_at = now()
where slug in ('aicte-pg-scholarship-gate-ceed','pm-scholarship-scheme-ex-servicemen-wards','aicte-pragati-scholarship-girls',
  'aicte-saksham-scholarship','aikyashree-scholarship-west-bengal','mizoram-scholarship-board-portal','hp-epass-scholarship',
  'bihar-sc-st-civil-sewa-protsahan-yojana','bihar-ebc-civil-seva-protsahan-yojana','icar-national-talent-scholarship-pg',
  'free-coaching-scheme-sc-obc','top-class-education-scheme-sc-students','pm-yasasvi-scholarship','csir-jrf-net-fellowship');
