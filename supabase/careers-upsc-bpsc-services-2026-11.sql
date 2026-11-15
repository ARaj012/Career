-- Careers reached through UPSC's Civil Services Examination and BPSC's Combined Competitive Examination.
-- Sources (read 15 Nov 2026):
--   UPSC CSE 2026 notification (list of 23 services; eligibility, age, attempts, stages):
--     https://www.upsc.gov.in/sites/default/files/Notif-CSP-2026-Engl-060226Rev.pdf
--   BPSC Integrated 72nd Combined (Preliminary) Competitive Examination advertisement (posts, pay levels,
--   minimum ages; graduate degree; maximum age 37 / 40 / 42 by category on 01.08.2026):
--     https://bpsc.bihar.gov.in/wp-content/uploads/BPSC_content/Notices/Advertisement-Integrated-72th-CCE-PT_BPSC-20260505-p1euvo.pdf
-- Pay: entry basic pay of the 7th Pay Commission pay matrix for the stated level (Level 10 = ₹56,100,
-- Level 9 = ₹53,100, Level 7 = ₹44,900 a month); dearness and other allowances are extra.

begin;

-- ---------------------------------------------------------------- UPSC Civil Services
with src as (select 'https://www.upsc.gov.in/sites/default/files/Notif-CSP-2026-Engl-060226Rev.pdf'::text as url),
facts as (
  select
    jsonb_build_array(
      jsonb_build_object('text', 'A candidate must have attained the age of 21 years and must not have attained the age of 32 years on the 1st of August, 2026 i.e., the candidate must have been born not earlier than 2nd August, 1994 and not later than 1st August, 2005.', 'source_url', url),
      jsonb_build_object('text', 'A candidate must hold a Graduate degree of any of the Universities incorporated by an Act of the central or State Legislature in India or other educational institutions established by an Act of Parliament or declared to be deemed as a University under Section 3 of the University Grants Commission Act, 1956 or possess an equivalent qualification.', 'source_url', url),
      jsonb_build_object('text', 'Every candidate appearing at the examination, who is otherwise eligible, shall be permitted six (6) attempts at the CSE.', 'source_url', url)
    ) as common,
    jsonb_build_object('text', 'For the Indian Administrative Service, the Indian Foreign Service and the Indian Police Service, a candidate must be a citizen of India.', 'source_url', url) as nat_ais,
    jsonb_build_object('text', 'For other services, a candidate must be either:— (a) a citizen of India, or (b) a subject of Nepal, or (c) a subject of Bhutan, or (d) a Tibetan refugee who came over to India before 1st January, 1962 with the intention of permanently settling in India,', 'source_url', url) as nat_other,
    jsonb_build_array(jsonb_build_object('text', 'The Civil Services Examination will consist of two successive stages (i) Civil Services (Preliminary) Examination (Objective type) for the selection of candidates for the Main Examination; and (ii) Civil Services (Main) Examination (Written and Interview) for the selection of candidates for the various Services and posts noted above.', 'source_url', url)) as steps,
    url
  from src
),
svc(slug, title, description, grp, ais, demand) as (values
  ('ias-officer', 'IAS Officer (Indian Administrative Service)', 'Runs the administration of districts, states and Union ministries — as Sub-Divisional Magistrate, District Collector, Secretary and above. The first of the 23 services filled through UPSC''s Civil Services Examination; Group A, starting at Pay Level 10 (basic ₹56,100 a month) plus allowances.', 'A', true, 9.5),
  ('ips-officer', 'IPS Officer (Indian Police Service)', 'Leads police forces in the states and central organisations — from Assistant Superintendent of Police to Director General. Recruited through UPSC''s Civil Services Examination; an All India Service starting at Pay Level 10 (basic ₹56,100 a month) plus allowances.', 'A', true, 9.3),
  ('indian-audit-accounts-service-officer', 'Indian Audit and Accounts Service (IA&AS) Officer', 'Audits the accounts of the Union and State governments and public bodies for the Comptroller and Auditor General of India. A Group A service recruited through UPSC''s Civil Services Examination, starting at Pay Level 10 (basic ₹56,100 a month).', 'A', false, 7.5),
  ('indian-civil-accounts-service-officer', 'Indian Civil Accounts Service (ICAS) Officer', 'Manages payments, accounts and financial reporting of Union ministries under the Controller General of Accounts. A Group A service recruited through UPSC''s Civil Services Examination, starting at Pay Level 10 (basic ₹56,100 a month).', 'A', false, 7.0),
  ('indian-corporate-law-service-officer', 'Indian Corporate Law Service (ICLS) Officer', 'Regulates companies under the Companies Act for the Ministry of Corporate Affairs — registrars of companies, inspections and investigations. A Group A service recruited through UPSC''s Civil Services Examination, starting at Pay Level 10 (basic ₹56,100 a month).', 'A', false, 7.0),
  ('indian-defence-accounts-service-officer', 'Indian Defence Accounts Service (IDAS) Officer', 'Handles the accounts, pay and audit of the Army, Navy, Air Force and defence establishments under the Controller General of Defence Accounts. A Group A service recruited through UPSC''s Civil Services Examination, starting at Pay Level 10 (basic ₹56,100 a month).', 'A', false, 7.0),
  ('indian-defence-estates-service-officer', 'Indian Defence Estates Service (IDES) Officer', 'Manages defence land and administers cantonment boards for the Ministry of Defence. A Group A service recruited through UPSC''s Civil Services Examination, starting at Pay Level 10 (basic ₹56,100 a month).', 'A', false, 6.5),
  ('indian-information-service-officer', 'Indian Information Service (IIS) Officer', 'The Government of India''s media and communication cadre — Press Information Bureau, All India Radio, Doordarshan and other media units. A Group A service recruited through UPSC''s Civil Services Examination, starting at Pay Level 10 (basic ₹56,100 a month).', 'A', false, 7.0),
  ('indian-postal-service-officer', 'Indian Postal Service Officer', 'Manages India Post''s postal, banking and logistics operations in divisions, regions and circles. A Group A service recruited through UPSC''s Civil Services Examination, starting at Pay Level 10 (basic ₹56,100 a month).', 'A', false, 7.0),
  ('indian-pt-accounts-finance-service-officer', 'Indian P&T Accounts and Finance Service Officer', 'Handles finance and accounts of the Department of Telecommunications and the Department of Posts. A Group A service recruited through UPSC''s Civil Services Examination, starting at Pay Level 10 (basic ₹56,100 a month).', 'A', false, 6.5),
  ('indian-railway-protection-force-officer', 'Indian Railway Protection Force Service Officer', 'Commands the Railway Protection Force, which protects railway property, passengers and goods. A Group A service recruited through UPSC''s Civil Services Examination, starting at Pay Level 10 (basic ₹56,100 a month).', 'A', false, 7.0),
  ('irs-income-tax-officer', 'IRS (Income Tax) Officer', 'Assesses and collects direct taxes and investigates tax evasion for the Central Board of Direct Taxes — Assistant Commissioner of Income Tax and above. Group A, recruited through UPSC''s Civil Services Examination, starting at Pay Level 10 (basic ₹56,100 a month).', 'A', false, 8.5),
  ('irs-customs-indirect-taxes-officer', 'IRS (Customs & Indirect Taxes) Officer', 'Administers GST, customs and central excise for the Central Board of Indirect Taxes and Customs — Assistant Commissioner and above. Group A, recruited through UPSC''s Civil Services Examination, starting at Pay Level 10 (basic ₹56,100 a month).', 'A', false, 8.3),
  ('indian-trade-service-officer', 'Indian Trade Service Officer', 'Works on foreign trade policy, export promotion and import licensing in the Directorate General of Foreign Trade. A Group A (Grade III) service recruited through UPSC''s Civil Services Examination.', 'A', false, 6.5),
  ('afhq-civil-service-officer', 'Armed Forces Headquarters Civil Service Officer', 'Section Officer in the civilian administration of the Ministry of Defence''s integrated headquarters. A Group B service recruited through UPSC''s Civil Services Examination.', 'B', false, 6.0),
  ('danics-officer', 'DANICS Officer (Delhi & UT Civil Service)', 'Civil administration in Delhi and the Union Territories of Andaman & Nicobar Islands, Lakshadweep, Daman & Diu and Dadra & Nagar Haveli — SDM, Deputy Secretary and similar posts. A Group B service recruited through UPSC''s Civil Services Examination.', 'B', false, 7.0),
  ('danips-officer', 'DANIPS Officer (Delhi & UT Police Service)', 'Police officer (ACP / DSP rank) in Delhi and the Union Territories of Andaman & Nicobar Islands, Lakshadweep, Daman & Diu and Dadra & Nagar Haveli. A Group B service recruited through UPSC''s Civil Services Examination.', 'B', false, 7.0),
  ('pondicherry-civil-police-service-officer', 'Pondicherry Civil / Police Service Officer (PONDICS / PONDIPS)', 'Civil administration (PONDICS) or police (PONDIPS) officer in the Union Territory of Puducherry. Group B services recruited through UPSC''s Civil Services Examination.', 'B', false, 6.0)
)
insert into public.careers (title, slug, description, category, avg_salary_min, avg_salary_max, salary_currency, growth_level, competition_level, work_life_balance, demand_score, is_trending,
                            official_body, official_url, source_urls, automation_enabled, eligibility, how_to_enter, facts_source_url, verified_at)
select s.title, s.slug, s.description, 'Government', case when s.grp = 'A' then 673200 end, null, 'INR', 'Medium', 'Very High', 3, s.demand, s.slug in ('ias-officer', 'ips-officer'),
       'Union Public Service Commission (UPSC)', 'https://upsc.gov.in/examinations/active-exams', array[f.url], true,
       f.common || jsonb_build_array(case when s.ais then f.nat_ais else f.nat_other end), f.steps, f.url, now()
from svc s cross join facts f
where not exists (select 1 from public.careers c where c.slug = s.slug);

-- Existing civil-services careers: name them after the service and give them the same official facts
update public.careers set title = 'IFS Officer (Indian Foreign Service)'
where slug = 'ifs-officer' and title = 'IFS Officer';
update public.careers set title = 'Indian Railway Management Service (IRMS) Officer',
  description = 'Runs Indian Railways'' traffic, personnel and accounts functions. Since 2023 the IRMS (Traffic), (Personnel) and (Accounts) streams are filled through UPSC''s Civil Services Examination as Group A services, starting at Pay Level 10 (basic ₹56,100 a month).'
where slug = 'railway-officer';
with f as (select 'https://www.upsc.gov.in/sites/default/files/Notif-CSP-2026-Engl-060226Rev.pdf'::text as url)
update public.careers c set
  official_body = 'Union Public Service Commission (UPSC)',
  official_url = coalesce(c.official_url, 'https://upsc.gov.in/examinations/active-exams'),
  automation_enabled = true,
  eligibility = (select eligibility from public.careers where slug = case when c.slug = 'ifs-officer' then 'ias-officer' else 'irs-income-tax-officer' end),
  how_to_enter = (select how_to_enter from public.careers where slug = 'ias-officer'),
  facts_source_url = f.url, verified_at = now()
from f
where c.slug in ('ifs-officer', 'irs-officer', 'railway-officer') and coalesce(jsonb_array_length(c.eligibility), 0) = 0;

-- Links to the Civil Services Examination
insert into public.career_exams (career_id, exam_id, importance)
select c.id, e.id, 'Mandatory'
from public.careers c, public.exams e
where e.slug = 'upsc-cse'
  and c.slug in ('ias-officer', 'ips-officer', 'indian-audit-accounts-service-officer', 'indian-civil-accounts-service-officer', 'indian-corporate-law-service-officer',
                 'indian-defence-accounts-service-officer', 'indian-defence-estates-service-officer', 'indian-information-service-officer', 'indian-postal-service-officer',
                 'indian-pt-accounts-finance-service-officer', 'indian-railway-protection-force-officer', 'irs-income-tax-officer', 'irs-customs-indirect-taxes-officer',
                 'indian-trade-service-officer', 'afhq-civil-service-officer', 'danics-officer', 'danips-officer', 'pondicherry-civil-police-service-officer', 'railway-officer')
  and not exists (select 1 from public.career_exams x where x.career_id = c.id and x.exam_id = e.id);

-- ---------------------------------------------------------------- BPSC Combined Competitive Examination
with post(slug, title, description, level, demand) as (values
  ('bihar-administrative-service-officer', 'SDM / Deputy Collector (Bihar Administrative Service)', 'Sub-Divisional Officer / Senior Deputy Collector in the Bihar Administrative Service — runs sub-divisions and district administration, revenue and law and order. 100 posts in BPSC''s Integrated 72nd CCE; Pay Level 9 (entry basic ₹53,100 a month); minimum age 22.', 9, 9.0),
  ('bihar-police-dsp', 'DSP (Bihar Police Service)', 'Deputy Superintendent of Police in the Home Department (Police) — leads police sub-divisions in Bihar. 22 posts in BPSC''s Integrated 72nd CCE; Pay Level 9 (entry basic ₹53,100 a month); minimum age 20.', 9, 8.8),
  ('bihar-state-tax-assistant-commissioner', 'Assistant Commissioner of State Tax (Bihar Finance Service)', 'Administers GST and state taxes in Bihar''s Commercial Taxes Department. 76 posts in BPSC''s Integrated 72nd CCE; Pay Level 9 (entry basic ₹53,100 a month); minimum age 22.', 9, 8.0),
  ('bihar-education-service-officer', 'Bihar Education Service Officer (Administration)', 'Education administrator in the Administration sub-cadre of the Bihar Education Service, Education Department. Recruited through BPSC''s Integrated 72nd CCE; Pay Level 9 (entry basic ₹53,100 a month); minimum age 22.', 9, 6.5),
  ('bihar-assistant-registrar-cooperative', 'Assistant Registrar, Cooperative Societies (Bihar)', 'Registers and supervises cooperative societies for Bihar''s Cooperative Department. Recruited through BPSC''s Integrated 72nd CCE; Pay Level 9 (entry basic ₹53,100 a month); minimum age 22.', 9, 6.0),
  ('bihar-labour-superintendent', 'Labour Superintendent (Bihar)', 'Enforces labour laws for Bihar''s Labour Resources Department. Recruited through BPSC''s Integrated 72nd CCE; Pay Level 9 (entry basic ₹53,100 a month); minimum age 22.', 9, 6.0),
  ('bihar-probation-officer', 'Probation Officer (Bihar Home Department, Prisons)', 'Supervises offenders on probation for the Prisons wing of Bihar''s Home Department. Recruited through BPSC''s Integrated 72nd CCE; Pay Level 9 (entry basic ₹53,100 a month); minimum age 21.', 9, 5.5),
  ('bihar-cdpo', 'Child Development Project Officer (Bihar)', 'Runs Integrated Child Development Services (anganwadi) projects for Bihar''s Social Welfare Department. Recruited with BPSC''s Integrated 72nd CCE (graduate degree, with Home Science, Psychology, Sociology or Labour & Social Welfare as the Mains optional); Pay Level 9 (entry basic ₹53,100 a month); minimum age 21.', 9, 6.5),
  ('bihar-financial-administrative-officer', 'Financial Administrative Officer (Bihar Financial Administration Service)', 'Financial administration in Bihar''s Finance Department. Recruited with BPSC''s Integrated 72nd CCE (graduate degree in Commerce, Economics, Mathematics or Statistics); Pay Level 9 (entry basic ₹53,100 a month); minimum age 22.', 9, 6.5),
  ('bihar-revenue-officer', 'Revenue Officer (Bihar Revenue Service)', 'Land revenue and land records at block and circle level for Bihar''s Revenue and Land Reforms Department — the largest group in BPSC''s Integrated 72nd CCE (365 posts). Pay Level 7 (entry basic ₹44,900 a month); minimum age 21.', 7, 7.5),
  ('bihar-rural-development-officer', 'Rural Development Officer (Bihar Rural Development Service)', 'Implements rural development schemes at block level for Bihar''s Rural Development Department. 65 posts in BPSC''s Integrated 72nd CCE; Pay Level 7 (entry basic ₹44,900 a month); minimum age 21.', 7, 7.0),
  ('bihar-block-panchayati-raj-officer', 'Block Panchayati Raj Officer (Bihar Panchayat Service)', 'Supervises gram panchayats and their schemes at block level for Bihar''s Panchayati Raj Department. 70 posts in BPSC''s Integrated 72nd CCE; Pay Level 7 (entry basic ₹44,900 a month); minimum age 21.', 7, 6.5),
  ('bihar-municipal-executive-officer', 'Municipal Executive Officer (Bihar)', 'Executive head of urban local bodies for Bihar''s Urban Development and Housing Department. 54 posts in BPSC''s Integrated 72nd CCE; Pay Level 7 (entry basic ₹44,900 a month); minimum age 21.', 7, 6.5),
  ('bihar-cooperative-extension-officer', 'Cooperative Extension Officer (Bihar)', 'Promotes and supervises cooperative societies at block level for Bihar''s Cooperative Department. 130 posts in BPSC''s Integrated 72nd CCE; Pay Level 7 (entry basic ₹44,900 a month); minimum age 21.', 7, 6.0),
  ('bihar-labour-enforcement-officer', 'Labour Enforcement Officer (Bihar)', 'Enforces labour and migrant-worker laws for Bihar''s Labour Resources and Migrant Workers Welfare Department. 56 posts in BPSC''s Integrated 72nd CCE; Pay Level 7 (entry basic ₹44,900 a month); minimum age 21.', 7, 6.0),
  ('bihar-supply-inspector', 'Supply Inspector (Bihar Supply Service)', 'Oversees the public distribution system and consumer protection for Bihar''s Food and Consumer Protection Department. 31 posts in BPSC''s Integrated 72nd CCE; Pay Level 7 (entry basic ₹44,900 a month); minimum age 21.', 7, 6.0)
)
insert into public.careers (title, slug, description, category, avg_salary_min, avg_salary_max, salary_currency, growth_level, competition_level, work_life_balance, demand_score, is_trending,
                            official_body, official_url, source_urls, automation_enabled)
select p.title, p.slug,
       p.description || ' Eligibility: a graduate degree; maximum age on 1 August 2026 is 37 for unreserved men, 40 for unreserved women and BC/EBC candidates, and 42 for SC/ST candidates (Bihar domicile needed for reservation).',
       'Government', case p.level when 9 then 637200 when 7 then 538800 end, null, 'INR', 'Medium', 'Very High', 3, p.demand, p.slug in ('bihar-administrative-service-officer', 'bihar-police-dsp'),
       'Bihar Public Service Commission (BPSC)', 'https://bpsc.bihar.gov.in/advertisement/',
       array['https://bpsc.bihar.gov.in/wp-content/uploads/BPSC_content/Notices/Advertisement-Integrated-72th-CCE-PT_BPSC-20260505-p1euvo.pdf'], true
from post p
where not exists (select 1 from public.careers c where c.slug = p.slug);

insert into public.career_exams (career_id, exam_id, importance)
select c.id, e.id, 'Mandatory'
from public.careers c, public.exams e
where e.slug = 'bpsc'
  and (c.slug like 'bihar-%' or c.slug = 'state-psc-officer')
  and not exists (select 1 from public.career_exams x where x.career_id = c.id and x.exam_id = e.id);

commit;
