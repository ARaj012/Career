-- Scholarships checked against official sources (25 Nov 2026).
-- Sources read:
--   NSP scheme guidelines (scholarships.gov.in/public/schemeGuidelines/…):
--     CSSS_GUIDLINES_07022024_updated.pdf (PM-USP CSSS), Guidelines_ISHAN UDAY_2324.pdf,
--     Guidelines_NATIONAL_SCHOLARSHIP_FOR_POSTGRADUATE_STUDIES_UGC_2324.pdf,
--     Top_Class_Education_Scheme_2018.pdf (now "Top Class Scholarship for SC Students, applicable from 2025-26"),
--     DEPDGuidelines_1.pdf (DEPwD umbrella scheme, OM of 25 Sep 2024),
--     AICTE_2010/2011/2012/2013/3038_G.pdf (Pragati, Saksham, Swanath — Swanath May 2025),
--     HP_state_scheme/…Post Matric Scholarship Scheme for ST Students (Ministry of Tribal Affairs, rates from 1-4-2022),
--     TRIPURA_PMS_OBC.pdf (central Post-Matric for OBC, EBC and DNT), FAQ/FAQonPMSSS.pdf (MHA PMSS)
--   myscheme.gov.in/schemes/pmssc (Post Matric Scholarship for SC, rates from 2021-22)
--   dosje.gov.in: PM-YASASVI page (five sub-schemes), NOS guidelines 2025-26 (cloudfront PDF), NOS portal nos.dosje.gov.in
--   PIB releases on Khelo India athlete scholarship (₹6.28 lakh a year incl. ₹10,000 a month out-of-pocket allowance)
--   NSP 2026-27 "Schemes on NSP" list (no Ministry of Minority Affairs scheme listed)
-- Not confirmed, left unverified: Merit-cum-Means (minorities) — flagged on its page; Reliance Foundation (site not loading).

-- ── Central schemes ──────────────────────────────────────────────────────────
update public.scholarships set amount_type = 'annual', amount_min = 50000, amount_max = 50000, amount_note = 'Every year of the course: up to 4 years for a degree, 3 for a diploma',
  description = $$AICTE scholarship for girls in technical education: ₹50,000 every year of the course (up to 4 years for a degree, 3 for a diploma; one year less if you join the second year by lateral entry), paid as a lump sum for college fees, a computer, books and equipment. 5,000 scholarships a year for degree students and 5,000 for diploma students, plus every eligible girl from the 13 UTs and North-Eastern states.$$,
  eligibility_criteria = $$Must be a girl student admitted to the first year of an AICTE-approved degree or diploma course (or the second year by lateral entry); at most two girls per family; family income up to ₹8 lakh a year.$$,
  verified_at = now(), updated_at = now()
where slug = 'aicte-pragati-scholarship-girls';

update public.scholarships set amount_type = 'annual', amount_min = 50000, amount_max = 50000, amount_note = 'Every year of the course: up to 4 years for a degree, 3 for a diploma',
  description = $$AICTE scholarship for specially-abled students in technical education: ₹50,000 every year of the course (up to 4 years for a degree, 3 for a diploma; one year less after lateral entry), paid as a lump sum for college fees, a computer, books and equipment. Every eligible student gets it — there is no cap on numbers.$$,
  eligibility_criteria = $$Must have a benchmark disability of 40% or more; admitted to the first year of an AICTE-approved degree or diploma course (or the second year by lateral entry); family income up to ₹8 lakh a year.$$,
  verified_at = now(), updated_at = now()
where slug = 'aicte-saksham-scholarship';

update public.scholarships set amount_type = 'annual', amount_min = 50000, amount_max = 50000, amount_note = 'Every remaining year of the course (up to 4 years for a degree, 3 for a diploma)',
  description = $$AICTE scholarship for orphans, children who lost a parent to Covid-19, wards of Armed Forces and Central Paramilitary personnel martyred in action, and students whose parent has a critical illness or was severely disabled or killed in an accident: ₹50,000 every year for the rest of the course. 2,000 scholarships a year — 1,000 for degree and 1,000 for diploma students.$$,
  eligibility_criteria = $$Must be an orphan, have lost one or both parents to Covid-19, be a ward of Armed Forces or Central Paramilitary personnel martyred in action, or have a parent with a critical life-threatening illness or who died or was severely disabled (over 80%) in an accident; family income up to ₹8 lakh a year; studying a degree or diploma course at an AICTE-approved institution; not receiving another central, state or AICTE scholarship.$$,
  verified_at = now(), updated_at = now()
where slug = 'aicte-swanath-scholarship-scheme';

update public.scholarships set amount_type = 'annual', amount_min = 12000, amount_max = 20000,
  amount_note = '₹12,000 a year for the first three years of graduation, ₹20,000 a year for PG (and the 4th year of B.Tech/B.E.)',
  description = $$Ministry of Education scholarship (PM-USP CSSS) for meritorious students from low-income families: ₹12,000 a year for the first three years of graduation and ₹20,000 a year at postgraduate level; B.Tech/B.E. students get ₹20,000 in the 4th year and five-year integrated courses in the 4th and 5th years. Up to 82,000 new scholarships a year, divided among the state boards (50% for girls).$$,
  eligibility_criteria = $$Must have scored above the 80th percentile of successful candidates in your stream in the Class 12 board exam (the top 20 percentile); family income up to ₹4.5 lakh a year; studying a regular degree course (not diploma or distance) at a recognised college; not receiving any other merit or state scholarship, fee waiver or reimbursement; renewal each year needs 50% marks and 75% attendance.$$,
  name = 'Central Sector Scheme of Scholarship for College and University Students (PM-USP CSSS)',
  verified_at = now(), updated_at = now()
where slug = 'central-sector-scheme-college-university-students';

-- The same scheme was listed twice
update public.scholarships set is_active = false, updated_at = now()
where slug = 'central-sector-scheme-of-scholarship-csss';

update public.scholarships set amount_type = 'monthly', amount_min = 8000, amount_max = 8000,
  amount_note = '₹8,000 a month for 10 months a year (₹80,000 a year) for the whole UG course',
  description = $$UGC scholarship for students from the North-Eastern states: ₹8,000 a month for 10 months a year, for the whole of a first undergraduate degree. 10,000 scholarships a year, half for arts, humanities, social sciences, law and management and half for science, engineering, medicine, agriculture and other technical courses, chosen on state-wise Class 12 merit.$$,
  eligibility_criteria = $$Must hold a valid domicile certificate of a North Eastern state; family income below ₹4.5 lakh a year; admitted to a first UG degree in regular, full-time mode (not open, distance or part-time; not management quota); renewed each year on passing.$$,
  verified_at = now(), updated_at = now()
where slug = 'ishan-uday-scholarship-scheme';

update public.scholarships set amount_type = 'monthly', amount_min = 10000, amount_max = 10000,
  amount_note = '₹10,000 a month paid to you, within a ₹6.28 lakh-a-year package that also pays for coaching, training, food, lodging and schooling',
  description = $$Sports Authority of India support for Khelo India Athletes at accredited Khelo India academies: ₹6.28 lakh a year per athlete, of which ₹1.20 lakh (₹10,000 a month) is an out-of-pocket allowance paid into the athlete's bank account and the rest covers coaching, training, food, lodging and education.$$,
  eligibility_criteria = $$Only for athletes selected as Khelo India Athletes — through the Khelo India Games and SAI's talent identification — and training at an accredited Khelo India academy; there is no separate application.$$,
  how_to_apply = $$1. Compete in the Khelo India Games or SAI talent identification trials in your sport.
2. Athletes selected as Khelo India Athletes are placed at accredited academies and receive the support automatically.
3. Keep your bank account Aadhaar-linked for the monthly allowance.
More: https://www.kheloindia.gov.in$$,
  application_url = 'https://www.kheloindia.gov.in', verified_at = now(), updated_at = now()
where slug = 'khelo-india-athlete-scholarship';

update public.scholarships set amount_min = null, amount_max = null,
  amount_note = 'Not listed on the National Scholarship Portal for 2026-27 — confirm with the Ministry of Minority Affairs before applying',
  updated_at = now()
where slug = 'merit-cum-means-scholarship-minorities';

update public.scholarships set amount_type = 'monthly', amount_min = 37000, amount_max = 42000,
  amount_note = '₹37,000 a month for two years, then ₹42,000, plus a contingency grant and ₹2,000 a month escort/reader allowance',
  description = $$Department of Empowerment of Persons with Disabilities fellowship for M.Phil/PhD scholars with benchmark disabilities: ₹37,000 a month (JRF) for two years, then ₹42,000 (SRF), plus a yearly contingency grant and ₹2,000 a month for an escort or reader. 200 fellowships a year — 150 selected through UGC NET-JRF and 50 through the joint CSIR-UGC NET-JRF. Up to five years.$$,
  eligibility_criteria = $$Must have a benchmark disability of 40% or more; must have qualified the UGC NET-JRF or the joint CSIR-UGC NET-JRF; registered for a full-time M.Phil or PhD at a UGC-recognised university or institution; no income ceiling; only one fellowship at a time.$$,
  level = 'phd', verified_at = now(), updated_at = now()
where slug = 'national-fellowship-persons-with-disabilities';

update public.scholarships set amount_type = 'annual', amount_min = null, amount_max = null,
  amount_note = 'Full tuition plus US$15,400 a year living allowance (£9,900 in the UK); also US$1,500 a year contingency, visa fee, medical insurance and economy air fare',
  description = $$Ministry of Social Justice scholarship for a Master's degree or PhD abroad: full tuition, US$15,400 a year living allowance (£9,900 in the UK), US$1,500 contingency (£1,100), visa fee, medical insurance and economy air fare, paid through the Indian Mission. 125 scholarships a year — 115 for SC, 6 for denotified, nomadic and semi-nomadic tribes, 4 for landless agricultural labourers and traditional artisans — with 30% for women.$$,
  eligibility_criteria = $$Must belong to SC, DNT, landless agricultural labourer or traditional artisan families; family income up to ₹8 lakh a year; age below 35 years; at least 60% marks in the qualifying degree; must have an unconditional offer for a Master's or PhD from a foreign university in the top 500 of the QS World University Rankings.$$,
  how_to_apply = $$1. Get an unconditional admission offer from a top-500 QS-ranked foreign university.
2. Apply on the NOS portal: https://nos.dosje.gov.in/auth/sign-in
3. Candidates are ranked by the QS rank of their university; selected students get a provisional award letter.
Scheme details: https://www.dosje.gov.in/schemes-and-services/national-overseas-scholarship-nos-for-sc-etc-candidates/$$,
  application_url = 'https://nos.dosje.gov.in/auth/sign-in', verified_at = now(), updated_at = now()
where slug = 'national-overseas-scholarship-sc-st';

-- Replaced by UGC's National Scholarship for Postgraduate Studies (added below)
update public.scholarships set is_active = false, updated_at = now()
where slug in ('pg-indira-gandhi-scholarship-single-girl-child', 'pg-scholarship-sc-st-professional-courses');

update public.scholarships set amount_type = 'monthly', amount_min = 2500, amount_max = 3000,
  amount_note = 'Girls ₹3,000 and boys ₹2,500 a month, paid once a year, for up to 5 years',
  description = $$Prime Minister's Scholarship Scheme (National Defence Fund) for wards and widows of CAPF and Assam Rifles personnel, and wards of State/UT police killed in terror or Naxal attacks: ₹3,000 a month for girls and ₹2,500 for boys, paid yearly, for the length of a first professional degree. 2,000 new scholarships a year for CAPF & AR (1,000 boys, 1,000 girls) and 500 for State/UT police.$$,
  eligibility_criteria = $$Applicant is a ward or widow of CAPF/Assam Rifles personnel (killed or disabled in service, gallantry awardees, or serving and retired PBOR), or a ward of State/UT police martyred in terror or Naxal attacks; minimum 60% marks in Class 12, diploma or graduation; first year of a first professional degree (BE, B.Tech, MBBS, BDS, BBA, BCA, B.Pharm, B.Sc Nursing etc.) or lateral entry to the second year; at most two children per family; not receiving any other scholarship; renewal needs 50% each year.$$,
  verified_at = now(), updated_at = now()
where slug = 'pm-scholarship-capf-assam-rifles-wards';

update public.scholarships set amount_type = 'annual', amount_min = 2500, amount_max = 13500,
  amount_note = 'Plus full course fees fixed by the state. Yearly allowance: ₹13,500 (hostel) / ₹7,000 (day) for professional degrees down to ₹4,000 / ₹2,500 for Class 11–12; 10% more for students with disabilities',
  description = $$Centrally sponsored scholarship for Scheduled Caste students after Class 10, paid by your home state or UT: compulsory non-refundable fees including tuition (as fixed by the state's fee committee) plus a yearly academic allowance — ₹13,500 for hostellers / ₹7,000 for day scholars in professional degree courses, ₹9,500 / ₹6,500 in other professional courses, ₹6,000 / ₹3,000 in BA, B.Sc, B.Com and similar, and ₹4,000 / ₹2,500 for Class 11–12 and other non-degree courses.$$,
  eligibility_criteria = $$Must belong to the Scheduled Caste (SC) category of the state or UT of domicile; family income up to ₹2.5 lakh a year; passed Class 10 or higher; studying a recognised course after Class 10 in India; a second course at the same level is not covered.$$,
  verified_at = now(), updated_at = now()
where slug = 'post-matric-scholarship-sc-students';

update public.scholarships set amount_type = 'annual', amount_min = 2300, amount_max = 12000,
  amount_note = 'Plus full course fees (private-college caps: ₹2.5 lakh a year for engineering, ₹6 lakh for MBBS/MD/MS, ₹1 lakh for others). Yearly allowance ₹2,300–₹12,000 by course and hostel/day',
  description = $$Centrally sponsored scholarship of the Ministry of Tribal Affairs for Scheduled Tribe students after Class 10, paid by the home state: course fees as fixed by the state (for private colleges up to ₹2.5 lakh a year for engineering, ₹6 lakh for MBBS/MD/MS and ₹1 lakh for other courses) plus a monthly stipend — ₹1,200 for hostellers / ₹550 for day scholars in professional degrees, ₹820 / ₹530 in BA/B.Sc/B.Com and similar, ₹570 / ₹300 in ITI and polytechnic courses, ₹380 / ₹230 for Class 11–12. Students with disabilities get ₹800 / ₹600 a month more.$$,
  eligibility_criteria = $$Must belong to the Scheduled Tribe (ST) category; family income up to ₹2.5 lakh a year (no income limit for orphans supported by a guardian); passed Class 10 or higher; studying a recognised course after Class 10 in India.$$,
  verified_at = now(), updated_at = now()
where slug = 'post-matric-scholarship-st-students';

update public.scholarships set amount_type = 'annual', amount_min = 5000, amount_max = 20000,
  amount_note = 'Total a year including the tuition fee part: ₹20,000 for professional degrees, ₹13,000 other professional, ₹8,000 BA/B.Sc/B.Com, ₹5,000 Class 11–12',
  name = 'PM YASASVI Post-Matric Scholarship for OBC, EBC and DNT Students',
  description = $$Centrally sponsored post-matric scholarship under PM YASASVI for OBC, EBC and DNT students, paid by the home state: ₹20,000 a year for professional degree and PG courses (₹10,000 academic allowance + ₹10,000 tuition), ₹13,000 for other professional courses, ₹8,000 for BA/B.Sc/B.Com and similar, and ₹5,000 for Class 11–12 and other non-degree courses. States may top up the allowance.$$,
  eligibility_criteria = $$Must belong to the OBC, EBC or DNT category; family income up to ₹2.5 lakh a year; passed Class 10 or higher; studying a recognised course after Class 10 in India.$$,
  verified_at = now(), updated_at = now()
where slug = 'post-matric-scholarship-obc-students';

update public.scholarships set name = 'PM YASASVI Top Class School Education (OBC, EBC, DNT)',
  level = 'school', amount_type = 'annual', amount_min = 75000, amount_max = 125000,
  amount_note = 'Up to ₹75,000 a year in Class 9–10 and ₹1,25,000 in Class 11–12, for school fees, hostel and other charges',
  description = $$Part of PM YASASVI: pays the tuition, hostel and other school charges of OBC, EBC and DNT students in schools identified as Top Class Schools — up to ₹75,000 a year in Class 9–10 and ₹1,25,000 a year in Class 11–12. Selection is on the marks of the previous class (there is no entrance test any more); 30% of scholarships are for girls.$$,
  eligibility_criteria = $$Must belong to the OBC, EBC or DNT category; annual household income below ₹2.5 lakh; studying in Class 9, 10, 11 or 12 in a school identified as a Top Class School under the scheme; selected on merit by the marks of the previous class.$$,
  how_to_apply = $$1. Apply on the National Scholarship Portal: https://scholarships.gov.in with the marks of your previous class.
2. Your school's nodal officer verifies the application online, and the state confirms it.
3. State-wise merit lists are made separately for boys and girls in each class; money is paid by DBT.
Scheme details: https://www.dosje.gov.in/schemes-and-services/pm-young-achievers-scholarship-award-scheme-for-vibrant-india-for-obcs-and-others-pm-yasasvi/$$,
  verified_at = now(), updated_at = now()
where slug = 'pm-yasasvi-scholarship';

update public.scholarships set amount_type = 'annual', amount_min = 41000, amount_max = 86000,
  amount_note = 'Plus full tuition and non-refundable fees (up to ₹2 lakh a year at private institutes). ₹86,000 in the first year, ₹41,000 a year after',
  description = $$Ministry of Social Justice scholarship for SC students in notified top institutions (NAAC A++, top-100 NIRF, Institutes of National Importance and similar): full tuition and non-refundable fees (capped at ₹2 lakh a year at private institutes) plus an academic allowance of ₹86,000 in the first year and ₹41,000 every year after, for living costs, books and a laptop. About 1,900 new scholarships a year, 30% for girls; continues to the end of the course if you are promoted each year.$$,
  eligibility_criteria = $$Must belong to the Scheduled Caste (SC) category; family income up to ₹8 lakh a year; admitted to a full-time course at a notified top-class institution through its normal selection; fresh awards only in the first year; if more eligible students than slots, the top students by admission merit are chosen.$$,
  verified_at = now(), updated_at = now()
where slug = 'top-class-education-scheme-sc-students';

update public.scholarships set amount_type = 'monthly', amount_min = 1500, amount_max = 3000,
  amount_note = 'Plus tuition up to ₹1.9 lakh a year, ₹5,000 a year for books, ₹2,000 a month special allowance, and one-time ₹45,000 for a laptop and ₹30,000 for assistive devices',
  level = 'undergraduate,postgraduate',
  description = $$DEPwD scholarship for students with benchmark disabilities in graduate and postgraduate degree or diploma courses at institutes notified by the Department: tuition and admission fees up to ₹1.9 lakh a year, ₹3,000 a month maintenance for hostellers (₹1,500 for day scholars), ₹2,000 a month special allowance, ₹5,000 a year for books, and one-time grants of ₹45,000 for a laptop and ₹30,000 for aids and assistive devices. 300 scholarships a year including renewals.$$,
  eligibility_criteria = $$Must have a benchmark disability of 40% or more; family income up to ₹8 lakh a year; admitted to a full-time graduate or postgraduate degree/diploma at an institute notified by the Department of Empowerment of Persons with Disabilities (not distance or part-time); can be awarded only once.$$,
  verified_at = now(), updated_at = now()
where slug = 'top-class-education-scheme-students-disabilities';

-- ── New, from the same official sources ─────────────────────────────────────
insert into public.scholarships
  (slug, name, provider, description, category, level, field_of_study, state, country,
   amount_min, amount_max, amount_type, amount_note, eligibility_criteria, required_documents, how_to_apply,
   application_url, is_active, automation_enabled, verified_at)
values
('ugc-national-scholarship-postgraduate-studies',
 'UGC National Scholarship for Postgraduate Studies',
 'University Grants Commission (UGC)',
 $$UGC scholarship for a first postgraduate degree in India: ₹15,000 a month for 10 months a year, for two years. 10,000 scholarships a year under the government reservation policy, 30% for women (filled first by single, twin or fraternal girl children), and half for arts, humanities, social sciences, law and management, half for science, engineering, medicine and other technical courses. It replaces UGC's earlier PG Indira Gandhi (single girl child) and PG scholarship for SC/ST in professional courses.$$,
 'merit', 'postgraduate', array['All Streams'], 'All States', 'India',
 15000, 15000, 'monthly', '₹15,000 a month for 10 months a year (₹1.5 lakh a year) for two years',
 $$Must be admitted to the first year of a first PG degree in regular, full-time mode at an eligible university, college or institution; age below 30 years at admission; must hold a recognised UG degree; selection on UG marks (single, twin or fraternal girl children fill the women's slots first).$$,
 array['UG degree / mark sheets','PG admission proof','Caste/category certificate (if applicable)','Single girl child affidavit (if applicable)','Aadhaar-linked bank account'],
 $$1. Apply on the National Scholarship Portal: https://scholarships.gov.in in the first year of your PG course.
2. Your institution verifies the application on NSP.
3. Selection is on all-India merit of UG marks; money is paid by DBT for 10 months a year.$$,
 'https://scholarships.gov.in', true, true, now()),

('pm-yasasvi-top-class-college-obc',
 'PM YASASVI Top Class College Education (OBC, EBC, DNT)',
 'Department of Social Justice & Empowerment, Government of India',
 $$Part of PM YASASVI: for OBC, EBC and DNT students admitted to institutions notified by the Ministry of Social Justice. Pays full tuition and non-refundable fees (up to ₹2 lakh a year at private institutes; ₹3.72 lakh for commercial pilot training), ₹3,000 a month for living costs, ₹5,000 a year for books and stationery, and up to ₹45,000 once for a computer or laptop.$$,
 'government', 'undergraduate,postgraduate', array['All Streams'], 'All States', 'India',
 3000, 3000, 'monthly', 'Plus full tuition (up to ₹2 lakh a year at private institutes), ₹5,000 a year for books and up to ₹45,000 once for a laptop',
 $$Must belong to the OBC, EBC or DNT category; family income up to ₹2.5 lakh a year; admitted to a full-time course at a notified top-class institution under the scheme, within its scholarship slots and merit criteria; not more than two siblings in a family.$$,
 array['Category certificate','Income certificate','Admission proof and rank','Fee details','Aadhaar-linked bank account'],
 $$1. Apply on the National Scholarship Portal: https://scholarships.gov.in with your income, category, admission rank and fee details.
2. Your institution verifies the application.
3. Scholarships go to eligible students within the slots given to each institution and course.
Scheme details and institution slots: https://www.dosje.gov.in/schemes-and-services/pm-young-achievers-scholarship-award-scheme-for-vibrant-india-for-obcs-and-others-pm-yasasvi/$$,
 'https://scholarships.gov.in', true, true, now())
on conflict (slug) do nothing;

-- The new PG scholarship goes wherever the scholarships it replaces were listed
insert into public.college_scholarships (college_id, scholarship_id, match_type, relevance_note)
select distinct cs.college_id, n.id, 'national', 'Open to eligible students nationwide, including at ' || c.name
from public.college_scholarships cs
join public.scholarships o on o.id = cs.scholarship_id and o.slug = 'pg-indira-gandhi-scholarship-single-girl-child'
join public.colleges c on c.id = cs.college_id
cross join public.scholarships n where n.slug = 'ugc-national-scholarship-postgraduate-studies'
on conflict (college_id, scholarship_id) do nothing;

-- ── State and UT portals ─────────────────────────────────────────────────────
-- These portals mainly pay the central post-matric scholarships above, whose rates are
-- the same everywhere; state schemes on them have their own rules. The old guessed
-- ranges ("₹3,000–₹40,000") and unconfirmed state income limits are replaced.
update public.scholarships set amount_min = null, amount_max = null, amount_type = 'annual',
  amount_note = 'Depends on the scheme. Central post-matric scholarships through this portal pay course fees plus a yearly allowance of ₹2,500–₹13,500 (SC) or ₹2,300–₹12,000 (ST), or ₹5,000–₹20,000 a year in all (OBC, EBC, DNT). State schemes set their own amounts',
  eligibility_criteria = 'Must be domiciled in ' || state || $$. For the central post-matric scholarships paid through this portal, must belong to the Scheduled Caste (SC), Scheduled Tribe (ST), OBC, EBC or DNT category (scheme-dependent) with family income up to ₹2.5 lakh a year under the central schemes, and be studying a recognised course after Class 10. State schemes on the portal have their own categories and income limits.$$,
  updated_at = now()
where is_active and state <> 'All States' and amount_type <> 'loan'
  and slug not in ('bihar-sc-st-civil-sewa-protsahan-yojana', 'bihar-ebc-civil-seva-protsahan-yojana', 'aikyashree-scholarship-west-bengal');

-- The central rates above are confirmed; the portal links were checked on 24 Nov 2026
update public.scholarships set verified_at = now()
where is_active and state <> 'All States' and amount_type <> 'loan' and verified_at is null
  and slug not in ('bihar-sc-st-civil-sewa-protsahan-yojana', 'bihar-ebc-civil-seva-protsahan-yojana', 'aikyashree-scholarship-west-bengal',
                   'digital-gujarat-post-matric-scholarship');

-- Aikyashree is West Bengal's own minority scheme; its amounts were not confirmed
update public.scholarships set amount_min = null, amount_max = null,
  amount_note = 'Amounts are set by the West Bengal scheme and depend on the course — check the NSP-WB portal',
  updated_at = now()
where slug = 'aikyashree-scholarship-west-bengal';

-- Begum Hazrat Mahal was subsumed into the minority pre-/post-matric schemes from 2022-23 (Lok Sabha answer, Feb 2024)
update public.scholarships set is_active = false, updated_at = now() where slug = 'begum-hazrat-mahal-national-scholarship';

-- HP: the schemes listed for Himachal on NSP's 2026-27 state list (state's ePASS portal was not reachable)
update public.scholarships set description = $$Himachal Pradesh's post-matric scholarships — the centrally sponsored SC, ST and OBC post-matric schemes and the state's own schemes (such as Mukhya Mantri Protsahan Yojana, Kalpana Chawla and Swami Vivekanand scholarships) — listed for Himachal students on the National Scholarship Portal, covering fees and allowances from Class 11 onward, including UG, PG, diploma and professional courses.$$, updated_at = now()
where slug = 'hp-epass-scholarship';

-- NOS moved to its new portal; Ishan Uday is run by UGC
update data_estimates set value_text = replace(value_text, 'NOS portal (nosmsje.gov.in)', 'NOS portal (nos.dosje.gov.in)'), updated_at = now()
where entity = 'scholarship' and value_text like '%nosmsje.gov.in%';
update public.scholarships set provider = 'University Grants Commission (UGC), Ministry of Education', updated_at = now()
where slug = 'ishan-uday-scholarship-scheme';
