-- Fill the relationships that drive career pages, recommendations and exam pages (15 Nov 2026):
-- 1. Skills and Class 11-12 subject weights for the UPSC / BPSC service careers added on 15 Nov.
-- 2. Exams that were linked to no career, linked to the careers they lead to.
-- Only names already in public.skills / public.subjects and slugs already in public.careers are used.

begin;

-- ---------------------------------------------------------------- 1. skills
with m(slug, skill, importance) as (values
  -- shared core for every civil-services post
  ('*civil', 'Public Administration', 'Must Have'), ('*civil', 'Integrity', 'Must Have'), ('*civil', 'Decision Making', 'Must Have'),
  ('*civil', 'Communication', 'Must Have'), ('*civil', 'Policy Implementation', 'Good To Have'), ('*civil', 'Leadership', 'Good To Have'),
  ('*civil', 'Critical Thinking', 'Good To Have'), ('*civil', 'Writing', 'Good To Have'),
  -- service-specific
  ('ias-officer', 'Policy Analysis', 'Must Have'), ('ias-officer', 'Leadership', 'Must Have'), ('ias-officer', 'Conflict Resolution', 'Good To Have'),
  ('ips-officer', 'Law Enforcement', 'Must Have'), ('ips-officer', 'Criminal Law', 'Must Have'), ('ips-officer', 'Physical Fitness', 'Must Have'), ('ips-officer', 'Investigation', 'Good To Have'),
  ('danips-officer', 'Law Enforcement', 'Must Have'), ('danips-officer', 'Criminal Law', 'Must Have'), ('danips-officer', 'Physical Fitness', 'Must Have'),
  ('pondicherry-civil-police-service-officer', 'Law Enforcement', 'Good To Have'),
  ('bihar-police-dsp', 'Law Enforcement', 'Must Have'), ('bihar-police-dsp', 'Criminal Law', 'Must Have'), ('bihar-police-dsp', 'Physical Fitness', 'Must Have'), ('bihar-police-dsp', 'Investigation', 'Good To Have'),
  ('indian-railway-protection-force-officer', 'Law Enforcement', 'Must Have'), ('indian-railway-protection-force-officer', 'Security', 'Must Have'), ('indian-railway-protection-force-officer', 'Physical Fitness', 'Good To Have'),
  ('indian-audit-accounts-service-officer', 'Auditing', 'Must Have'), ('indian-audit-accounts-service-officer', 'Accounting', 'Must Have'), ('indian-audit-accounts-service-officer', 'Attention to Detail', 'Must Have'),
  ('indian-civil-accounts-service-officer', 'Accounting', 'Must Have'), ('indian-civil-accounts-service-officer', 'Financial Reporting', 'Must Have'),
  ('indian-defence-accounts-service-officer', 'Accounting', 'Must Have'), ('indian-defence-accounts-service-officer', 'Auditing', 'Good To Have'),
  ('indian-pt-accounts-finance-service-officer', 'Accounting', 'Must Have'), ('indian-pt-accounts-finance-service-officer', 'Financial Reporting', 'Good To Have'),
  ('bihar-financial-administrative-officer', 'Accounting', 'Must Have'), ('bihar-financial-administrative-officer', 'Financial Reporting', 'Must Have'),
  ('indian-corporate-law-service-officer', 'Corporate Law', 'Must Have'), ('indian-corporate-law-service-officer', 'Regulatory Knowledge', 'Must Have'),
  ('irs-income-tax-officer', 'Taxation', 'Must Have'), ('irs-income-tax-officer', 'Tax Law', 'Must Have'), ('irs-income-tax-officer', 'Investigation', 'Good To Have'),
  ('irs-customs-indirect-taxes-officer', 'Taxation', 'Must Have'), ('irs-customs-indirect-taxes-officer', 'Regulatory Knowledge', 'Must Have'),
  ('bihar-state-tax-assistant-commissioner', 'Taxation', 'Must Have'), ('bihar-state-tax-assistant-commissioner', 'Tax Law', 'Good To Have'),
  ('indian-defence-estates-service-officer', 'Urban Planning', 'Good To Have'), ('indian-defence-estates-service-officer', 'Regulatory Knowledge', 'Good To Have'),
  ('indian-information-service-officer', 'Content Writing', 'Must Have'), ('indian-information-service-officer', 'Social Media', 'Good To Have'), ('indian-information-service-officer', 'Public Speaking', 'Good To Have'),
  ('indian-postal-service-officer', 'Logistics Management', 'Must Have'), ('indian-postal-service-officer', 'Customer Service', 'Good To Have'),
  ('indian-trade-service-officer', 'Negotiation', 'Must Have'), ('indian-trade-service-officer', 'Policy Analysis', 'Good To Have'),
  ('afhq-civil-service-officer', 'Administration', 'Must Have'), ('afhq-civil-service-officer', 'Documentation', 'Must Have'),
  ('danics-officer', 'Administration', 'Must Have'), ('pondicherry-civil-police-service-officer', 'Administration', 'Must Have'),
  ('bihar-administrative-service-officer', 'Leadership', 'Must Have'), ('bihar-administrative-service-officer', 'Conflict Resolution', 'Good To Have'),
  ('bihar-revenue-officer', 'Documentation', 'Must Have'), ('bihar-revenue-officer', 'Regulatory Knowledge', 'Good To Have'),
  ('bihar-rural-development-officer', 'Project Management', 'Must Have'), ('bihar-rural-development-officer', 'Fieldwork', 'Good To Have'),
  ('bihar-block-panchayati-raj-officer', 'Project Management', 'Good To Have'), ('bihar-block-panchayati-raj-officer', 'Fieldwork', 'Good To Have'),
  ('bihar-municipal-executive-officer', 'Urban Planning', 'Good To Have'), ('bihar-municipal-executive-officer', 'Project Management', 'Good To Have'),
  ('bihar-cooperative-extension-officer', 'Fieldwork', 'Must Have'), ('bihar-assistant-registrar-cooperative', 'Regulatory Knowledge', 'Must Have'),
  ('bihar-labour-enforcement-officer', 'Regulatory Knowledge', 'Must Have'), ('bihar-labour-enforcement-officer', 'Investigation', 'Good To Have'),
  ('bihar-labour-superintendent', 'Regulatory Knowledge', 'Must Have'), ('bihar-supply-inspector', 'Investigation', 'Good To Have'),
  ('bihar-education-service-officer', 'Educational Systems Knowledge', 'Must Have'),
  ('bihar-cdpo', 'Social Work Practice', 'Must Have'), ('bihar-cdpo', 'Empathy', 'Good To Have'),
  ('bihar-probation-officer', 'Counseling', 'Must Have'), ('bihar-probation-officer', 'Social Work Practice', 'Good To Have')
),
targets as (
  select c.id as career_id, c.slug from public.careers c
  where c.slug in ('ias-officer','ips-officer','indian-audit-accounts-service-officer','indian-civil-accounts-service-officer','indian-corporate-law-service-officer',
    'indian-defence-accounts-service-officer','indian-defence-estates-service-officer','indian-information-service-officer','indian-postal-service-officer',
    'indian-pt-accounts-finance-service-officer','indian-railway-protection-force-officer','irs-income-tax-officer','irs-customs-indirect-taxes-officer',
    'indian-trade-service-officer','afhq-civil-service-officer','danics-officer','danips-officer','pondicherry-civil-police-service-officer')
     or c.slug like 'bihar-%'
),
wanted as (
  select distinct on (t.career_id, s.id) t.career_id, s.id as skill_id, m.importance
  from targets t
  join m on m.slug = t.slug or m.slug = '*civil'
  join public.skills s on s.name = m.skill
  -- a service-specific "Must Have" wins over the shared default
  order by t.career_id, s.id, (m.slug = '*civil'), m.importance
)
insert into public.career_skills (career_id, skill_id, importance)
select w.career_id, w.skill_id, w.importance from wanted w
where not exists (select 1 from public.career_skills x where x.career_id = w.career_id and x.skill_id = w.skill_id);

-- ---------------------------------------------------------------- 1b. subject weights (Class 11-12 subjects that suit the career)
with m(kind, subject, weight) as (values
  ('admin', 'Political Science', 0.85), ('admin', 'History', 0.80), ('admin', 'Geography', 0.70), ('admin', 'Economics', 0.70), ('admin', 'English', 0.65), ('admin', 'Sociology', 0.60),
  ('police', 'Political Science', 0.75), ('police', 'Sociology', 0.70), ('police', 'Physical Education', 0.70), ('police', 'History', 0.65), ('police', 'Psychology', 0.60),
  ('finance', 'Accountancy', 0.85), ('finance', 'Economics', 0.85), ('finance', 'Mathematics', 0.70), ('finance', 'Business Studies', 0.65),
  ('social', 'Sociology', 0.85), ('social', 'Psychology', 0.80), ('social', 'Political Science', 0.65), ('social', 'Economics', 0.55),
  ('media', 'English', 0.85), ('media', 'Political Science', 0.70), ('media', 'History', 0.60),
  ('trade', 'Economics', 0.85), ('trade', 'Business Studies', 0.75), ('trade', 'Geography', 0.60), ('trade', 'Mathematics', 0.55)
),
kind(slug, k) as (values
  ('ias-officer','admin'), ('danics-officer','admin'), ('pondicherry-civil-police-service-officer','admin'), ('afhq-civil-service-officer','admin'),
  ('indian-defence-estates-service-officer','admin'), ('indian-postal-service-officer','admin'),
  ('bihar-administrative-service-officer','admin'), ('bihar-revenue-officer','admin'), ('bihar-rural-development-officer','admin'), ('bihar-block-panchayati-raj-officer','admin'),
  ('bihar-municipal-executive-officer','admin'), ('bihar-education-service-officer','admin'), ('bihar-supply-inspector','admin'), ('bihar-cooperative-extension-officer','admin'),
  ('bihar-assistant-registrar-cooperative','admin'), ('bihar-labour-superintendent','admin'), ('bihar-labour-enforcement-officer','admin'),
  ('ips-officer','police'), ('danips-officer','police'), ('bihar-police-dsp','police'), ('indian-railway-protection-force-officer','police'),
  ('indian-audit-accounts-service-officer','finance'), ('indian-civil-accounts-service-officer','finance'), ('indian-defence-accounts-service-officer','finance'),
  ('indian-pt-accounts-finance-service-officer','finance'), ('irs-income-tax-officer','finance'), ('irs-customs-indirect-taxes-officer','finance'),
  ('bihar-state-tax-assistant-commissioner','finance'), ('bihar-financial-administrative-officer','finance'), ('indian-corporate-law-service-officer','finance'),
  ('bihar-cdpo','social'), ('bihar-probation-officer','social'),
  ('indian-information-service-officer','media'), ('indian-trade-service-officer','trade')
)
insert into public.career_subject_weights (career_id, subject_id, weight)
select c.id, s.id, m.weight
from kind k join public.careers c on c.slug = k.slug join m on m.kind = k.k join public.subjects s on s.name = m.subject
where not exists (select 1 from public.career_subject_weights x where x.career_id = c.id and x.subject_id = s.id);

-- ---------------------------------------------------------------- 2. exams → the careers they lead to
with m(exam, careers, importance) as (values
  -- engineering entrance tests
  ('aeee', 'software-engineer,electronics-engineer,mechanical-engineer', 'Preferred'), ('ap-eamcet', 'software-engineer,civil-engineer,mechanical-engineer,electrical-engineer', 'Preferred'),
  ('bitsat', 'software-engineer,electronics-engineer,mechanical-engineer,chemical-engineer', 'Preferred'), ('comedk', 'software-engineer,civil-engineer,mechanical-engineer,electrical-engineer', 'Preferred'),
  ('gujcet', 'software-engineer,civil-engineer,mechanical-engineer', 'Preferred'), ('hpcet', 'software-engineer,civil-engineer,mechanical-engineer', 'Optional'),
  ('kcet', 'software-engineer,civil-engineer,mechanical-engineer,electrical-engineer', 'Preferred'), ('keam', 'software-engineer,civil-engineer,mechanical-engineer,electrical-engineer', 'Preferred'),
  ('kiitee', 'software-engineer,electronics-engineer,mechanical-engineer', 'Optional'), ('ojee', 'software-engineer,civil-engineer,mechanical-engineer', 'Optional'),
  ('srmjeee', 'software-engineer,electronics-engineer,mechanical-engineer', 'Optional'), ('tnea', 'software-engineer,civil-engineer,mechanical-engineer,electrical-engineer', 'Preferred'),
  ('ts-eamcet', 'software-engineer,civil-engineer,mechanical-engineer,electrical-engineer', 'Preferred'), ('upsee', 'software-engineer,civil-engineer,mechanical-engineer', 'Optional'),
  ('viteee', 'software-engineer,electronics-engineer,mechanical-engineer', 'Optional'), ('ugee-iiit-hyderabad', 'software-engineer,ai-ml-engineer,data-scientist', 'Preferred'),
  ('pessat', 'software-engineer,electronics-engineer', 'Optional'), ('manipal-met', 'software-engineer,doctor-mbbs,pharmacist', 'Optional'),
  -- medicine and dentistry
  ('amu-mbbs', 'doctor-mbbs', 'Preferred'), ('bhu-pmt', 'doctor-mbbs', 'Optional'), ('jipmer', 'doctor-mbbs', 'Optional'), ('pgimer', 'doctor-mbbs', 'Preferred'),
  ('neet-pg', 'doctor-mbbs', 'Preferred'), ('ini-cet', 'doctor-mbbs', 'Preferred'), ('fmge', 'doctor-mbbs', 'Preferred'), ('usmle', 'doctor-mbbs', 'Optional'),
  ('neet-mds', 'dentist', 'Preferred'), ('mns', 'nursing', 'Preferred'), ('niper-jee', 'pharmacist,clinical-researcher', 'Preferred'),
  -- law
  ('bhu-llb', 'lawyer,legal-advisor', 'Optional'), ('du-llb', 'lawyer,legal-advisor,public-prosecutor', 'Preferred'), ('mh-cet-law', 'lawyer,corporate-lawyer', 'Preferred'),
  ('slat', 'lawyer,corporate-lawyer', 'Optional'), ('lsat-india', 'lawyer,corporate-lawyer', 'Optional'),
  -- accountancy and finance
  ('ca-intermediate', 'chartered-accountant', 'Mandatory'), ('ca-final', 'chartered-accountant', 'Mandatory'),
  ('cfa-level1', 'financial-analyst,investment-banker,research-analyst', 'Preferred'), ('frm-part1', 'financial-analyst,quantitative-analyst', 'Preferred'),
  ('cs-foundation', 'legal-advisor,corporate-lawyer', 'Optional'), ('cseet', 'legal-advisor,corporate-lawyer', 'Optional'),
  -- management
  ('mat', 'business-manager,marketing-manager,hr-manager', 'Optional'), ('xat', 'business-manager,marketing-manager,hr-manager,product-manager', 'Preferred'),
  ('snap', 'business-manager,marketing-manager', 'Optional'), ('nmat', 'business-manager,marketing-manager,product-manager', 'Preferred'),
  ('mah-mba-cet', 'business-manager,marketing-manager,hr-manager', 'Preferred'), ('tancet', 'business-manager', 'Optional'), ('ts-icet', 'business-manager', 'Optional'),
  ('tissnet', 'social-worker,hr-manager', 'Preferred'), ('npat', 'business-manager,marketing-manager', 'Optional'),
  -- government jobs
  ('ssc-mts', 'ssc-government-assistant-clerk', 'Mandatory'), ('ssc-steno', 'ssc-government-assistant-clerk', 'Mandatory'), ('epfo-ssa', 'ssc-government-assistant-clerk', 'Preferred'),
  ('ssc-je', 'civil-engineer,electrical-engineer,mechanical-engineer', 'Preferred'), ('rrb-je', 'civil-engineer,electrical-engineer,mechanical-engineer', 'Preferred'),
  ('ssc-cpo', 'paramilitary-force-officer-capf', 'Preferred'), ('ib-acio', 'intelligence-officer', 'Mandatory'),
  ('cisf-constable', 'cisf-constable', 'Mandatory'), ('crpf-constable', 'crpf-constable', 'Mandatory'),
  ('rbi-assistant', 'bank-clerk-associate', 'Preferred'), ('lic-ado', 'lic-aao', 'Optional'),
  ('kpsc', 'state-psc-officer', 'Mandatory'), ('mppsc', 'state-psc-officer', 'Mandatory'), ('mpsc', 'state-psc-officer', 'Mandatory'),
  ('rpsc-ras', 'state-psc-officer', 'Mandatory'), ('tnpsc-group1', 'state-psc-officer', 'Mandatory'),
  ('rimc-entrance-exam', 'army-officer,navy-officer,airforce-officer', 'Optional'),
  -- design, arts, research, teaching, agriculture, economics
  ('ceed', 'product-designer,ui-ux-designer,graphic-designer', 'Preferred'), ('uceed', 'product-designer,ui-ux-designer,graphic-designer', 'Preferred'),
  ('nsd-entrance-exam', 'performing-artist,film-director', 'Preferred'), ('iksv-aptitude-test', 'performing-artist', 'Optional'),
  ('jest', 'research-scientist,academic-researcher', 'Preferred'), ('iisc-bs', 'research-scientist,academic-researcher', 'Preferred'),
  ('inspire', 'research-scientist', 'Optional'), ('kvpy', 'research-scientist', 'Optional'),
  ('rie-cee', 'school-teacher', 'Preferred'), ('ouat-entrance', 'agricultural-scientist,agronomist', 'Preferred'), ('pau-cet', 'agricultural-scientist,agronomist', 'Preferred'),
  ('fri-entrance-exam', 'environmental-scientist,forest-officer', 'Optional'), ('mse-entrance-test', 'economist', 'Preferred'),
  ('xic-oet', 'journalist', 'Preferred'), ('cuet-ug', 'economist,journalist,psychologist', 'Optional'), ('cuet-pg', 'economist,academic-researcher', 'Optional')
)
insert into public.career_exams (career_id, exam_id, importance)
select distinct c.id, e.id, m.importance
from m
cross join lateral unnest(string_to_array(m.careers, ',')) as cs(slug)
join public.exams e on e.slug = m.exam
join public.careers c on c.slug = cs.slug
where not exists (select 1 from public.career_exams x where x.career_id = c.id and x.exam_id = e.id);

commit;

-- 3. Official bodies for careers that had none (sites checked to respond, 15 Nov 2026)
update public.careers set official_body = 'Airports Authority of India (AAI)', official_url = 'https://www.aai.aero/en/careers/recruitment', automation_enabled = true
where slug = 'air-traffic-controller' and official_url is null;
update public.careers set official_body = 'Election Commission of India', official_url = 'https://www.eci.gov.in/', automation_enabled = true
where slug = 'election-commissioner' and official_url is null;
update public.careers set official_body = 'National Council for Hotel Management and Catering Technology (NCHMCT)', official_url = 'https://www.nchm.gov.in/', automation_enabled = true
where slug = 'hotel-manager' and official_url is null;
insert into public.career_exams (career_id, exam_id, importance)
select c.id, e.id, 'Preferred' from public.careers c, public.exams e
where c.slug = 'hotel-manager' and e.slug = 'nchmct-jee'
  and not exists (select 1 from public.career_exams x where x.career_id = c.id and x.exam_id = e.id);
