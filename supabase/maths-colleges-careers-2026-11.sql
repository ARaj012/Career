-- Mathematics colleges, careers and exams (November 2026)
--
-- Every fact below was read from the institution's own documents:
--   ISI   Admission Notice 2026-27  https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf
--         Prospectus 2026-27        https://admission.isical.ac.in/Documents/IsiAdmission2026/ISI-Prospectus-2026-27.pdf
--         Deposits and Fees 2026    https://admission.isical.ac.in/Documents/IsiAdmission2026/Deposits-and-Fees-2026.pdf
--         Other centres             https://www.isical.ac.in/static/about/campus_life/other-centres
--   CMI   Admissions page and Information Brochure 2026 (cmi.ac.in; read from the Internet Archive
--         copy because cmi.ac.in did not accept connections when this was prepared)
--   UPSC  IES/ISS Examination Notice 07/2026 and Annual Calendar 2027 (upsc.gov.in)
--   TIFR-CAM  https://www.math.tifrbng.res.in/en/about
--   HRI   https://www.hri.res.in/about/ and https://www.hri.res.in/~mathgradp/
-- Re-runnable: inserts skip existing slugs, child rows are replaced for these institutions.



-- ======================================================================
-- Colleges
-- ======================================================================
insert into public.colleges (name, slug, type, city, state, country, established_year, website_url,
  annual_fees_min, annual_fees_max, fee_note, about, admission_process, academic_highlights, why_join,
  best_known_for, campus_life, institute_scholarships, automation_enabled,
  verified_at, admission_source_url, admission_verified_at, fees_source_url, fees_verified_at,
  nirf_rank, nirf_year, nirf_category, nirf_note)
values
-- Chennai Mathematical Institute
($t$Chennai Mathematical Institute$t$, 'cmi-chennai', 'Deemed', 'Chennai', 'Tamil Nadu', 'India', 1989, 'https://www.cmi.ac.in',
 250000, 500000,
 $t$Tuition ₹1,25,000 per semester (two semesters a year) for B.S. (Hons) and M.Sc. Mathematics / Computer Science; ₹2,50,000 per semester for M.Sc. Data Science; no tuition for PhD. Hostel and mess: ₹31,310 per semester. Tuition waivers by family income (B.S.: 100% up to ₹8 lakh, 50% up to ₹12 lakh a year).$t$,
 $t$Chennai Mathematical Institute (CMI), founded in 1989 by Professor C. S. Seshadri, is a university under Section 3 of the UGC Act (recognised in December 2006) and one of India's leading centres for research and teaching in the mathematical sciences. Its main campus is in the SIPCOT IT Park at Siruseri, on the outskirts of Chennai. From 2026 it offers a 4-year B.S. (Hons) in Mathematics, Mathematics and Computer Science, or Mathematics and Physics (with a B.Sc. exit after 3 years and an optional Data Science minor), M.Sc. programmes in Mathematics, Computer Science and Data Science, and PhD programmes in Mathematics, Computer Science and Physics. CMI receives major support from the Department of Atomic Energy through the National Board for Higher Mathematics.$t$,
 $t$Admission to every programme is through CMI's written entrance examination (2026: applications 2 March–4 April, exam on 2 May at centres across India). There is one common exam for all B.S. (Hons) programmes; the subject is chosen after admission. Students who reached the IMO/EGMO training camp, the Physics OCSC, or the IOI training camp (or won gold/silver at INOI) in Class 11 or 12 can be exempted from the B.S. exam. M.Sc. Mathematics and all PhD programmes add an interview; PhD Mathematics applicants with an NBHM PhD fellowship can go straight to the interview.$t$,
 $t$All courses are taught by active researchers; the B.S. core is two years of algebra, analysis, calculus, probability and either computer science or physics, then a specialisation. Exchange agreements with École Normale Supérieure (Paris) and ENS Paris-Saclay, research internships at ANU, and the CNRS joint laboratory ReLaX hosted at CMI since 2017.$t$,
 $t$Choose CMI if you want a research-style mathematics education from Class 12 onwards: small batches, researchers as teachers, and graduates who go on to PhDs at Berkeley, MIT, Princeton, ENS-Paris and TIFR or to quantitative jobs — CMI reports that students seeking campus placement are typically all placed, with average packages of ₹18–20 lakh a year in recent years.$t$,
 array['Research-led B.S./M.Sc. in mathematics, computer science and physics','Founded in 1989 by Prof. C. S. Seshadri, FRS','Exchanges with ENS Paris and ENS Paris-Saclay','Average campus package ₹18–20 lakh a year (CMI brochure 2026)'],
 $t$A fully residential campus for B.S. and M.Sc. Mathematics/Computer Science students in the SIPCOT IT Park, Siruseri; a second campus for the Dr F C Kohli Centre is due to open in 2026. The CMI Arts Initiative runs regular cultural programmes.$t$,
 $j$[{"name":"Full tuition-fee scholarship (B.S.)","detail":"About 30–35 scholarships with a full waiver of tuition fees for four years; a limited number of fellowships of ₹5,000 a month.","source_url":"https://www.cmi.ac.in/admissions/brochure/2026/cmi-brochure-2026.pdf"},{"name":"Income-based fee waiver","detail":"B.S.: annual family income up to ₹8 lakh gets a 100% tuition waiver and up to ₹12 lakh a 50% waiver. M.Sc.: 40% and 25% respectively.","source_url":"https://www.cmi.ac.in/admissions/brochure/2026/cmi-brochure-2026.pdf"},{"name":"M.Sc. scholarships","detail":"Full tuition waivers for two years (roughly as many as students admitted in recent batches) and a limited number of fellowships of ₹6,000 a month.","source_url":"https://www.cmi.ac.in/admissions/brochure/2026/cmi-brochure-2026.pdf"},{"name":"PhD stipend","detail":"No tuition; ₹37,000 a month for the first two years and ₹42,000 for the next three, plus ₹10,000 a year contingency grant.","source_url":"https://www.cmi.ac.in/admissions/brochure/2026/cmi-brochure-2026.pdf"}]$j$::jsonb,
 true, now(), 'https://www.cmi.ac.in/admissions/', now(), 'https://www.cmi.ac.in/admissions/brochure/2026/cmi-brochure-2026.pdf', now(),
 null, null, null, null),

-- ISI Delhi Centre
($t$Indian Statistical Institute Delhi$t$, 'isi-delhi', 'Government', 'New Delhi', 'Delhi', 'India', 1974, 'https://www.isid.ac.in',
 0, 205000,
 $t$M.Stat, M.Math and MS (QE) charge no tuition and pay a stipend of ₹8,000 a month. B.SDS (Hons): ₹1,00,000 tuition + ₹2,500 other fees per semester, with full waivers for SC/ST/PwBD and full or partial waivers by family income. Admission deposits (refundable on joining): seat acceptance ₹20,000 (₹12,000 reserved categories) plus ₹5,000 caution and ₹1,500 medical insurance.$t$,
 $t$The Delhi Centre of the Indian Statistical Institute — an Institution of National Importance under the ISI Act, 1959 — was started in 1974 and moved to its present campus in 1975. In 2026-27 it teaches the first year of the Master of Statistics, the Master of Mathematics (18 seats), the MS in Quantitative Economics (35 seats), the 4-year Bachelor of Statistical Data Science (25 seats, taught jointly with Kolkata and Bengaluru), and research fellowships in Statistics, Mathematics and Quantitative Economics.$t$,
 $t$M.Stat, M.Math and MS (QE): bachelor's degree of three or more years in any discipline; written ISI Admission Test (10 May 2026) followed by an interview. B.SDS (Hons): Class 12 in 2025 or 2026 with Mathematics and English and at least 75% aggregate (65% SC/ST/PwBD), selected on JEE Main or CUET-UG (Mathematics and English) scores. Applications (except B.SDS) ran 12 February–26 March 2026 on admission.isical.ac.in.$t$,
 $t$Some of India's leading statisticians, mathematicians and economists have taught at the Delhi Centre; ISI reports close to 100% placement for its master's programmes, with campus interviews also held at Delhi.$t$,
 $t$Choose ISI Delhi for a tuition-free, stipend-paying master's in statistics, mathematics or quantitative economics in the capital, with the M.Stat first year here and the second year at the Kolkata headquarters.$t$,
 array['Tuition-free M.Stat / M.Math / MS (QE) with ₹8,000 monthly stipend','MS in Quantitative Economics (35 seats)','Institution of National Importance (ISI Act, 1959)'],
 null,
 $j$[{"name":"Monthly stipend","detail":"₹8,000 a month for M.Stat, M.Math and MS (QE) students who meet the academic requirements.","source_url":"https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf"},{"name":"B.SDS fee waiver","detail":"Full tuition waiver for SC/ST/PwBD candidates, and full or partial waivers based on family income.","source_url":"https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf"}]$j$::jsonb,
 true, now(), 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf', now(), 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf', now(),
 null, null, null, null),

-- ISI Bengaluru Centre
($t$Indian Statistical Institute Bengaluru$t$, 'isi-bangalore', 'Government', 'Bengaluru', 'Karnataka', 'India', 1978, 'https://www.isibang.ac.in',
 0, 205000,
 $t$B.Math (Hons): no tuition, stipend ₹5,000 a month. MS (QMBA) and MS (LIS): no tuition, stipend ₹8,000 a month. B.SDS (Hons): ₹1,00,000 tuition + ₹2,500 other fees per semester, with waivers for SC/ST/PwBD and by family income. Refundable admission deposits: seat acceptance ₹20,000 (₹12,000 reserved categories) plus caution deposit and ₹1,500 medical insurance.$t$,
 $t$The Bengaluru Centre of the Indian Statistical Institute began work in September 1978 and was formally declared a centre of ISI in September 1996. It is the only place where ISI teaches the 3-year Bachelor of Mathematics (Hons), and it also runs the MS in Library and Information Science, the first year of the MS in Quality Management and Business Analytics (second year in Hyderabad), the B.SDS (Hons) with Kolkata and Delhi, and research fellowships in Statistics, Mathematics, Computer Science, QROR and Library Science.$t$,
 $t$B.Math (Hons): Class 12 with Mathematics and English; two written tests (multiple-choice and descriptive mathematics at the 10+2 level) in the ISI Admission Test, then an interview. Up to 5 supernumerary seats for INMO awardees (IMOTC 2025/2026) selected by interview alone. Master's programmes need a bachelor's degree of three or more years in any discipline. B.SDS uses JEE Main / CUET-UG scores.$t$,
 $t$Known for mathematics and statistics, statistical quality control and operations research, library and information science, and quantitative economics. B.Math graduates get direct admission to ISI's M.Math.$t$,
 $t$Choose ISI Bengaluru for ISI's only Bachelor of Mathematics: a stipend-paying, research-style undergraduate degree that leads straight into the M.Math.$t$,
 array['ISI''s only B.Math (Hons) programme','Stipend ₹5,000 a month for B.Math students','MS in Library and Information Science'],
 null,
 $j$[{"name":"Monthly stipend","detail":"₹5,000 a month for B.Math (Hons) and ₹8,000 a month for MS (QMBA) and MS (LIS), for students meeting the academic requirements.","source_url":"https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf"}]$j$::jsonb,
 true, now(), 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf', now(), 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf', now(),
 null, null, null, null),

-- ISI Chennai Centre
($t$Indian Statistical Institute Chennai$t$, 'isi-chennai', 'Government', 'Chennai', 'Tamil Nadu', 'India', 2008, 'https://www.isichennai.res.in',
 0, 0,
 $t$The 2026-27 admission notice lists no tuition fee for the PG Diploma in Statistical Methods and Analytics; refundable deposits of ₹6,000 plus ₹1,500 medical insurance are paid on admission. No hostel is provided for PGDSMA students.$t$,
 $t$The Chennai Centre of the Indian Statistical Institute came into being on 26 July 2008. It offers the one-year Post-Graduate Diploma in Statistical Methods and Analytics (25 seats), a part-time certificate course in Statistical Quality Control, and doctoral research in Statistics, Computer Science, Mathematical Programming and Statistical Quality Control.$t$,
 $t$PGDSMA: a 3-year bachelor's degree in any discipline with Mathematics as a subject, or a B.E./B.Tech (or equivalent such as AMIE); selection through the ISI Admission Test and interview.$t$,
 null,
 $t$A one-year, practical route into statistics and analytics for graduates who studied mathematics.$t$,
 array['PG Diploma in Statistical Methods and Analytics (25 seats)','Doctoral research in Statistics and Computer Science'],
 null, '[]'::jsonb,
 true, now(), 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf', now(), 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Deposits-and-Fees-2026.pdf', now(),
 null, null, null, null),

-- ISI North-East Centre, Tezpur
($t$Indian Statistical Institute North-East Centre Tezpur$t$, 'isi-tezpur', 'Government', 'Tezpur', 'Assam', 'India', 2011, 'https://www.isine.ac.in',
 0, 0,
 $t$The 2026-27 admission notice lists no tuition fee for PGDSMA; students domiciled in the North-East states get a stipend of ₹3,000 a month. Refundable deposits of ₹6,000 plus ₹1,500 medical insurance on admission. No hostel is provided for PGDSMA students.$t$,
 $t$The North-East Centre of the Indian Statistical Institute at Tezpur, Assam, was inaugurated on 23 July 2011 as ISI's fourth centre. It runs the one-year Post-Graduate Diploma in Statistical Methods and Analytics, with half of its seats reserved for students domiciled in the North-East states, and research fellowships in Quantitative Economics and Physics and Applied Mathematics.$t$,
 $t$PGDSMA: a 3-year bachelor's degree in any discipline with Mathematics as a subject, or a B.E./B.Tech; selection through the ISI Admission Test and interview. 50% of seats are reserved for North-East domiciles (separate domicile channel).$t$,
 null,
 $t$ISI's statistics training in the North-East, with half the seats and a stipend reserved for students from the region.$t$,
 array['PGDSMA with 50% seats for North-East domiciles','₹3,000 monthly stipend for North-East domiciles'],
 null,
 $j$[{"name":"North-East stipend","detail":"₹3,000 a month for PGDSMA students domiciled in the North-East states of India.","source_url":"https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf"}]$j$::jsonb,
 true, now(), 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf', now(), 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Deposits-and-Fees-2026.pdf', now(),
 null, null, null, null),

-- TIFR Centre for Applicable Mathematics
($t$TIFR Centre for Applicable Mathematics$t$, 'tifr-cam-bengaluru', 'Government', 'Bengaluru', 'Karnataka', 'India', null, 'https://www.math.tifrbng.res.in',
 0, 0,
 $t$No tuition: all PhD and Integrated PhD students receive a scholarship and an annual contingency grant.$t$,
 $t$The Centre for Applicable Mathematics (CAM) is part of the Tata Institute of Fundamental Research, a National Centre of the Government of India under the Department of Atomic Energy and a deemed university. It grew out of the TIFR Centre on the IISc campus founded in the 1970s by TIFR's School of Mathematics, and moved to Yelahanka, Bengaluru, as CAM in 2007. Research covers partial differential equations, probability, complex analysis and computational science.$t$,
 $t$PhD (for students with a master's degree) and Integrated PhD (for students with a bachelor's degree) in Mathematics, through the TIFR Graduate School admissions (GS-2027 applications open now).$t$,
 $t$Research in PDEs (elliptic, parabolic, hyperbolic, Navier–Stokes), probability and stochastic analysis, several complex variables, and scientific computing and machine learning; an annual summer internship programme for bachelor's students.$t$,
 $t$Choose TIFR-CAM if you want a funded PhD in analysis, PDEs, probability or computational mathematics at one of India's top research institutes.$t$,
 array['Funded PhD and Integrated PhD in mathematics','Partial differential equations and their applications','Part of TIFR (Department of Atomic Energy)'],
 null, '[]'::jsonb,
 true, now(), 'https://www.math.tifrbng.res.in/en/about', now(), 'https://www.math.tifrbng.res.in/en/about', now(),
 17, 2025, 'Research', 'Ranked as Tata Institute of Fundamental Research (parent institute)'),

-- Harish-Chandra Research Institute
($t$Harish-Chandra Research Institute$t$, 'hri-prayagraj', 'Government', 'Prayagraj', 'Uttar Pradesh', 'India', 1975, 'https://www.hri.res.in',
 0, 0,
 $t$HRI's M.Sc. and Ph.D. are research programmes awarded through the Homi Bhabha National Institute; see the admission pages for current stipend details.$t$,
 $t$The Harish-Chandra Research Institute (HRI) in Prayagraj (Allahabad) is dedicated to research in Mathematics and Theoretical Physics. It started in 1975 on an endowment from the B.S. Mehta Trust, Calcutta, and was called the Mehta Research Institute until October 2001. As a Constituent Institution of the Homi Bhabha National Institute (HBNI) it runs M.Sc. and Ph.D. programmes in mathematics (algebra, analysis, geometry, number theory) and I.Ph.D., M.Sc. and Ph.D. programmes in physics.$t$,
 $t$M.Sc. Mathematics: B.Sc. (3-year), B.Tech/B.E. or B.S. (4-year) with at least 55%; screening through the national NBHM Scholarship Written Test (usually January) above HRI's cut-off, then HRI's own written test (group theory, linear algebra, real analysis, Riemann integration, point-set topology, metric spaces). Ph.D. Mathematics: M.Sc./M.Tech/M.Phil. (55%+) or a 4-year B.S. with one year of research; NBHM test or CSIR-UGC NET (JRF) above HRI's cut-off, then an online interview (usually April–May).$t$,
 $t$Faculty awards include a Dirac Medal, five Bhatnagar Awards and a Padma Bhushan; around fifty alumni hold faculty positions at leading Indian institutions.$t$,
 $t$Choose HRI for a research-focused M.Sc. or Ph.D. in pure mathematics, degrees from HBNI, and a small institute where students work closely with faculty.$t$,
 array['Research in algebra, analysis, geometry and number theory','HBNI M.Sc. and Ph.D. in mathematics','Around fifty alumni in faculty positions in India'],
 null, '[]'::jsonb,
 true, now(), 'https://www.hri.res.in/~mathgradp/msc/msc.html', now(), null, null,
 null, null, null, null)
on conflict (slug) do nothing;

-- ISI Kolkata: admission and fee facts from the 2026-27 notice
update public.colleges set
  fee_note = $t$Degree programmes (except B.SDS and PGDSCG) charge no tuition and pay stipends: B.Stat ₹5,000, M.Stat/M.Math/MS (QE) ₹8,000, M.Tech ₹12,400 a month; JRF ₹37,000 a month. B.SDS (Hons): ₹1,00,000 tuition + ₹2,500 other fees per semester; PGDSCG: ₹25,000 tuition + ₹25,000 other fees per semester (waivers for SC/ST/PwBD and by family income).$t$,
  annual_fees_min = 0, annual_fees_max = 205000,
  admission_process = $t$B.Stat (Hons): Class 12 with Mathematics and English; two written tests in the ISI Admission Test (10 May 2026), then an interview; up to 5 extra seats for INMO awardees by interview. M.Stat, M.Math, MS (QE): bachelor's degree of three or more years in any discipline, written test and interview (ISI's B.Stat/B.Math graduates get direct admission to M.Stat/M.Math). M.Tech (CS, CrS, QROR): written test and interview, or direct interview with a valid GATE score above the selection committee's threshold. B.SDS: JEE Main or CUET-UG scores.$t$,
  admission_source_url = 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf', admission_verified_at = now(),
  fees_source_url = 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf', fees_verified_at = now(),
  institute_scholarships = $j$[{"name":"Monthly stipends","detail":"B.Stat ₹5,000; M.Stat, M.Math, MS (QE) ₹8,000; M.Tech (CS, CrS, QROR) ₹12,400 a month for students meeting the academic requirements.","source_url":"https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf"},{"name":"Junior Research Fellowship","detail":"₹37,000 a month for JRFs in Statistics, Mathematics, Quantitative Economics, Computer Science and other areas.","source_url":"https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf"}]$j$::jsonb
where slug = 'isi-kolkata';

-- ======================================================================
-- Exams
-- ======================================================================
insert into public.exams (name, slug, conducting_body, exam_level, frequency, mode, official_url, description, automation_enabled)
values
($t$UPSC IES/ISS$t$, 'upsc-ies-iss', 'Union Public Service Commission', 'National', 'Annual', 'Offline', 'https://upsc.gov.in/examinations/active-exams',
 $t$The Indian Economic Service / Indian Statistical Service Examination is UPSC's combined exam for Junior Time Scale officers of the IES and ISS (2026 vacancies: 16 IES, 28 ISS). For the ISS it has a written part of 1,000 marks — General English, General Studies and four Statistics papers (two objective, two descriptive) — followed by a 200-mark viva voce. Candidates need a bachelor's degree with Statistics, Mathematical Statistics or Applied Statistics in every year of the course, or a master's in one of them, and must be 21–30 years old on 1 August of the exam year.$t$,
 true),
($t$CMI Entrance Exam$t$, 'cmi-entrance', 'Chennai Mathematical Institute', 'National', 'Annual', 'Offline', 'https://www.cmi.ac.in/admissions/',
 $t$Chennai Mathematical Institute's written entrance examination for its B.S. (Hons), M.Sc. and Ph.D. programmes, held at about 37 centres across India in early May. One common paper serves all B.S. (Hons) programmes; M.Sc. Mathematics and Ph.D. candidates are also interviewed. National olympiad camp students (IMOTC/EGMOTC, Physics OCSC, IOITC) can be exempted from the B.S. exam.$t$,
 true)
on conflict (slug) do nothing;

insert into public.exam_schedules (exam_id, year, session, registration_start, registration_end, exam_date_start, exam_date_end, result_date, source_url, data_status, verified_at)
select e.id, v.year, 'Default', v.rs::date, v.re::date, v.es::date, v.ee::date, null, v.src, v.status, now()
from (values
  ('upsc-ies-iss', 2026, '2026-02-11', '2026-03-03', '2026-06-19', null, 'https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf', 'verified'),
  ('upsc-ies-iss', 2027, '2027-02-10', '2027-03-02', '2027-06-18', '2027-06-20', 'https://www.upsc.gov.in/sites/default/files/Calendar-Year-2027-Engl-200526_0.pdf', 'tentative'),
  ('cmi-entrance', 2026, '2026-03-02', '2026-04-04', '2026-05-02', '2026-05-02', 'https://www.cmi.ac.in/admissions/', 'verified')
) v(slug, year, rs, re, es, ee, src, status)
join public.exams e on e.slug = v.slug
on conflict (exam_id, year, session) do nothing;

-- ======================================================================
-- Careers (facts quoted from the official documents; pay that no official
-- body publishes is added separately as a labelled estimate)
-- ======================================================================
insert into public.careers (title, slug, description, category, salary_currency, growth_level, competition_level, work_life_balance, demand_score, is_trending,
  official_body, official_url, eligibility, how_to_enter, official_pay, facts_source_url, verified_at, facts_read_at, automation_enabled)
values
($t$Mathematician$t$, 'mathematician',
 $t$Proves new theorems and develops mathematical theory and methods — in algebra, analysis, geometry, number theory, probability or applied mathematics — working mainly at research institutes and universities, and increasingly in industry research labs.$t$,
 'Research', 'INR', 'Medium', 'Very High', 4, 6, false,
 'Indian Statistical Institute', 'https://admission.isical.ac.in/',
 $j$[{"text":"3-year Bachelor of Mathematics (Hons) [B Math (Hons)] : Successful completion of 10+2 years of Higher Secondary Education (or its equivalent) with Mathematics and English as subjects. The programme is offered at Bengaluru.","source_url":"https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf"},{"text":"2-year Master of Mathematics [M Math] : Must have a bachelor’s degree of three or more years’ duration, in any discipline. The programme is offered at Kolkata and Delhi.","source_url":"https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf"},{"text":"(b) Mathematics : (i) an M Math/ M Stat degree from ISI, or (ii) an MA/ M Sc or equivalent degree in Mathematics or, (iii) an ME/ M Tech degree or equivalent with Mathematics as a subject.","source_url":"https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf"}]$j$::jsonb,
 $j$[{"text":"Selection of candidates will be based on their performance in written test(s) and/or interviews, as applicable, conducted by the institute subject to satisfying the minimum academic qualification.","source_url":"https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf"},{"text":"Candidates who have been awarded a Junior Research Fellowship in the five aforementioned areas by NBHM/ CSIR/ UGC/ ICMR/DBT/Inspire based on a nationally conducted written Test, may be selected for admission to the PhD programme of ISI based on a separate written test followed by an interview conducted by the relevant JRF selection committee of the institute.","source_url":"https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf"}]$j$::jsonb,
 $t$Research fellowship (JRF) at ISI: ₹37,000 a month (2026-27 admission notice).$t$,
 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf', now(), now(), false),

($t$Statistician$t$, 'statistician',
 $t$Designs surveys and experiments, builds statistical models and draws reliable conclusions from data for government statistical systems, research institutes, pharma, finance and technology companies.$t$,
 'Research', 'INR', 'High', 'High', 4, 7, true,
 'Indian Statistical Institute', 'https://admission.isical.ac.in/',
 $j$[{"text":"3-year Bachelor of Statistics (Hons) [B Stat (Hons)] : Successful completion of 10+2 years of Higher Secondary Education (or its equivalent) with Mathematics and English as subjects. The programme is offered at Kolkata.","source_url":"https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf"},{"text":"2-year Master of Statistics [M Stat] : Must have a bachelor’s degree of three or more years’ duration, in any discipline. The first year of the programme is offered at Delhi.","source_url":"https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf"}]$j$::jsonb,
 $j$[{"text":"Selection of candidates will be based on their performance in written test(s) and/or interviews, as applicable, conducted by the institute subject to satisfying the minimum academic qualification.","source_url":"https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf"},{"text":"(b) A candidate for the Indian Statistical Service must have obtained a Bachelor's Degree with Statistics/Mathematical Statistics/Applied Statistics as one of the subjects or a Master's degree in Statistics/Mathematical Statistics/Applied Statistics","source_url":"https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf"}]$j$::jsonb,
 $t$Stipend while studying at ISI: B.Stat ₹5,000 and M.Stat ₹8,000 a month (2026-27 admission notice).$t$,
 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf', now(), now(), false),

($t$Indian Statistical Service Officer$t$, 'indian-statistical-service-officer',
 $t$A Group A officer of the Government of India's statistical system (Ministry of Statistics and Programme Implementation and other ministries) who runs national surveys, price and production statistics and the data behind policy. Recruited through UPSC's IES/ISS examination — 28 ISS vacancies in 2026.$t$,
 'Government', 'INR', 'Medium', 'Very High', 4, 6, false,
 'Union Public Service Commission (UPSC)', 'https://upsc.gov.in/examinations/active-exams',
 $j$[{"text":"(b) A candidate for the Indian Statistical Service must have obtained a Bachelor's Degree with Statistics/Mathematical Statistics/Applied Statistics as one of the subjects or a Master's degree in Statistics/Mathematical Statistics/Applied Statistics from a University incorporated by an Act of the Central or State Legislature in India or other Educational Institutes established by an Act of Parliament or declared to be deemed as University under Section 3 of the University Grants Commission Act, 1956 or a Foreign University approved by the Central Government from time to time.","source_url":"https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf"},{"text":"The study of Statistics should be in all the years of Bachelor Degree Course.","source_url":"https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf"},{"text":"A candidate must have attained the age of 21 years and must not have attained the age of 30 years on 1st August, 2026","source_url":"https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf"}]$j$::jsonb,
 $j$[{"text":"Part I- Written examination carrying a maximum of 1000 marks in the subjects as shown below. Part II- Viva voce of such candidates as may be called by the Commission carrying a maximum of 200 marks.","source_url":"https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf"},{"text":"Statistics I & II will be of Objective Type Questions (80 questions with maximum marks of 200 in each paper) to be attempted in 120 minutes.","source_url":"https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf"}]$j$::jsonb,
 null,
 'https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf', now(), now(), false),

($t$Quantitative Analyst$t$, 'quantitative-analyst',
 $t$Builds mathematical and statistical models to price securities, measure risk and design trading strategies at banks, hedge funds, high-frequency trading firms and fintechs. Combines probability, stochastic calculus, statistics and programming.$t$,
 'Finance', 'INR', 'High', 'Very High', 3, 8, true,
 null, null, '[]'::jsonb, '[]'::jsonb, null, null, null, null, false),

($t$Cryptographer$t$, 'cryptographer',
 $t$Designs and analyses the mathematical algorithms that keep data and communications secure — encryption, digital signatures, post-quantum schemes — for defence and government agencies, banks, and technology and security companies.$t$,
 'Technology', 'INR', 'High', 'High', 4, 7, true,
 'Indian Statistical Institute', 'https://admission.isical.ac.in/',
 $j$[{"text":"2-year Master of Technology in Cryptology and Security [M Tech (CrS)] : Must have (i) a 4-year B E / B Tech (or equivalent) degree in any stream or, (ii) a master's degree in any subject and have passed Mathematics at the 10+2 level.","source_url":"https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf"}]$j$::jsonb,
 $j$[{"text":"A candidate with a valid GATE score above a threshold (to be decided by the Selection Committee) in his/her own subject is eligible for admission through direct interview.","source_url":"https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf"},{"text":"Selection of candidates will be based on their performance in written test(s) and/or interviews, as applicable, conducted by the institute subject to satisfying the minimum academic qualification.","source_url":"https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf"}]$j$::jsonb,
 $t$Stipend during ISI's M.Tech (CrS): ₹12,400 a month (2026-27 admission notice).$t$,
 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf', now(), now(), false),

($t$Operations Research Analyst$t$, 'operations-research-analyst',
 $t$Uses optimisation, probability models, simulation and statistics to improve decisions — supply chains, scheduling, pricing, logistics, reliability and quality — in manufacturing, airlines, e-commerce, consulting and government.$t$,
 'Management', 'INR', 'High', 'Medium', 4, 7, false,
 'Indian Statistical Institute', 'https://admission.isical.ac.in/',
 $j$[{"text":"(i) a Master's Degree in Statistics with Physics and Chemistry at the (10+2) level; or (ii) a Master's Degree in Operations Research / Mathematics & Computing, with adequate knowledge of Statistics & Probability at post‐graduate level, and Physics and Chemistry at the (10+2) level; or (iii) a B E / B Tech degree.","source_url":"https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf"}]$j$::jsonb,
 $j$[{"text":"A candidate with a valid GATE score above a threshold (to be decided by the Selection Committee) in Statistics GATE Test Paper for Statistics Stream and any Engineering/Technology GATE Test Paper for Engineering Stream is eligible for admission through direct interview.","source_url":"https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf"}]$j$::jsonb,
 $t$Stipend during ISI's M.Tech (QROR): ₹12,400 a month (2026-27 admission notice).$t$,
 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf', now(), now(), false)
on conflict (slug) do nothing;

-- Skills
insert into public.career_skills (career_id, skill_id, importance)
select c.id, s.id, v.imp
from (values
  ('mathematician','Mathematics','Must Have'),('mathematician','Research','Must Have'),('mathematician','Problem Solving','Must Have'),('mathematician','Critical Thinking','Must Have'),('mathematician','Writing','Good To Have'),('mathematician','Teaching','Good To Have'),('mathematician','Programming','Optional'),
  ('statistician','Statistics','Must Have'),('statistician','Mathematics','Must Have'),('statistician','Data Analysis','Must Have'),('statistician','Research Methodology','Must Have'),('statistician','Python','Good To Have'),('statistician','SQL','Good To Have'),('statistician','Data Visualization','Good To Have'),
  ('indian-statistical-service-officer','Statistics','Must Have'),('indian-statistical-service-officer','Mathematics','Must Have'),('indian-statistical-service-officer','Data Analysis','Must Have'),('indian-statistical-service-officer','Policy Analysis','Good To Have'),('indian-statistical-service-officer','Public Administration','Good To Have'),('indian-statistical-service-officer','Writing','Good To Have'),
  ('quantitative-analyst','Mathematics','Must Have'),('quantitative-analyst','Statistics','Must Have'),('quantitative-analyst','Programming','Must Have'),('quantitative-analyst','Python','Must Have'),('quantitative-analyst','Financial Modeling','Good To Have'),('quantitative-analyst','Risk Assessment','Good To Have'),('quantitative-analyst','Machine Learning','Good To Have'),('quantitative-analyst','C++/C#','Good To Have'),
  ('cryptographer','Mathematics','Must Have'),('cryptographer','Cryptography','Must Have'),('cryptographer','Algorithms','Must Have'),('cryptographer','Programming','Must Have'),('cryptographer','Network Security','Good To Have'),('cryptographer','Problem Solving','Must Have'),
  ('operations-research-analyst','Mathematics','Must Have'),('operations-research-analyst','Statistics','Must Have'),('operations-research-analyst','Problem Solving','Must Have'),('operations-research-analyst','Data Analysis','Must Have'),('operations-research-analyst','Python','Good To Have'),('operations-research-analyst','Excel','Good To Have'),('operations-research-analyst','Logistics Management','Optional')
) v(slug, skill, imp)
join public.careers c on c.slug = v.slug
join public.skills s on s.name = v.skill
on conflict do nothing;

-- Class 12 subjects
insert into public.career_subject_weights (career_id, subject_id, weight)
select c.id, s.id, v.w
from (values
  ('mathematician','Mathematics',1.0),('mathematician','Physics',0.5),('mathematician','Computer Science',0.4),
  ('statistician','Mathematics',1.0),('statistician','Economics',0.5),('statistician','Computer Science',0.5),
  ('indian-statistical-service-officer','Mathematics',1.0),('indian-statistical-service-officer','Economics',0.6),
  ('quantitative-analyst','Mathematics',1.0),('quantitative-analyst','Computer Science',0.7),('quantitative-analyst','Economics',0.5),
  ('cryptographer','Mathematics',1.0),('cryptographer','Computer Science',0.8),
  ('operations-research-analyst','Mathematics',1.0),('operations-research-analyst','Economics',0.5),('operations-research-analyst','Computer Science',0.5)
) v(slug, subject, w)
join public.careers c on c.slug = v.slug
join public.subjects s on s.name = v.subject
on conflict (career_id, subject_id) do nothing;

-- Entrance exams
insert into public.career_exams (career_id, exam_id, importance)
select c.id, e.id, v.imp
from (values
  ('mathematician','isi-admission-test','Preferred'),('mathematician','cmi-entrance','Preferred'),('mathematician','jam','Preferred'),('mathematician','tifr-gs','Preferred'),('mathematician','csir-net','Preferred'),('mathematician','olympiads','Optional'),
  ('statistician','isi-admission-test','Preferred'),('statistician','jam','Preferred'),('statistician','upsc-ies-iss','Optional'),('statistician','ssc-cgl','Optional'),('statistician','csir-net','Optional'),
  ('indian-statistical-service-officer','upsc-ies-iss','Mandatory'),
  ('quantitative-analyst','isi-admission-test','Preferred'),('quantitative-analyst','cmi-entrance','Preferred'),('quantitative-analyst','jee-advanced','Preferred'),('quantitative-analyst','cat','Optional'),
  ('cryptographer','isi-admission-test','Preferred'),('cryptographer','gate','Preferred'),
  ('operations-research-analyst','isi-admission-test','Preferred'),('operations-research-analyst','gate','Preferred'),('operations-research-analyst','cat','Optional')
) v(slug, exam, imp)
join public.careers c on c.slug = v.slug
join public.exams e on e.slug = v.exam
on conflict do nothing;

-- ======================================================================
-- Programmes (official intake and fees for 2026-27)
-- ======================================================================
-- New institutions: replace their programme list. ISI Kolkata's existing rows are updated in
-- place (a cutoff record points at one of them), and only the missing programmes are added.
delete from public.college_courses
where college_id in (select id from public.colleges where slug in ('cmi-chennai','isi-delhi','isi-bangalore','isi-chennai','isi-tezpur','tifr-cam-bengaluru','hri-prayagraj'));

update public.college_courses cc set course_name = v.new_name
from public.colleges c, (values
  ('B.Stat (Hons.)', 'B.Stat (Hons)'),
  ('BSDS', 'B.SDS (Hons) — Statistical Data Science'),
  ('M.Tech (CS and CrS)', 'M.Tech (Computer Science)')
) v(old_name, new_name)
where c.id = cc.college_id and c.slug = 'isi-kolkata' and cc.course_name = v.old_name;

drop table if exists maths_courses;
create temporary table maths_courses as
select col.id as college_id, car.id as career_id, v.course, v.deg, v.yrs::numeric as yrs, v.fmin::int as fmin, v.fmax::int as fmax, v.seats::int as seats, v.note,
  case v.s
    when 'N' then 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Admission-Notice-2026.pdf'
    when 'B' then 'https://www.cmi.ac.in/admissions/brochure/2026/cmi-brochure-2026.pdf'
    when 'T' then 'https://www.math.tifrbng.res.in/en/about'
    when 'H' then 'https://www.hri.res.in/~mathgradp/'
  end as src
from (values
  -- ISI Kolkata
  ('isi-kolkata','statistician','B.Stat (Hons)','Undergraduate',3,0,0,63,'N','No tuition; stipend ₹5,000 a month. 63 gender-neutral seats plus 16 supernumerary seats for women and up to 5 for INMO awardees.'),
  ('isi-kolkata','statistician','M.Stat (second year; both years for ISI B.Stat graduates)','Postgraduate',2,0,0,null,'N','No tuition; stipend ₹8,000 a month. Test-channel students do the first year at Delhi.'),
  ('isi-kolkata','mathematician','M.Math','Postgraduate',2,0,0,18,'N','No tuition; stipend ₹8,000 a month.'),
  ('isi-kolkata',null,'MS (Quantitative Economics)','Postgraduate',2,0,0,21,'N','No tuition; stipend ₹8,000 a month.'),
  ('isi-kolkata',null,'M.Tech (Computer Science)','Postgraduate',2,0,0,45,'N','No tuition; stipend ₹12,400 a month. 30 seats via ISI test, 15 via GATE.'),
  ('isi-kolkata','cryptographer','M.Tech (Cryptology and Security)','Postgraduate',2,0,0,26,'N','No tuition; stipend ₹12,400 a month. 20 via ISI test, 5 via GATE, 1 Government-sponsored.'),
  ('isi-kolkata','operations-research-analyst','M.Tech (Quality, Reliability and Operations Research)','Postgraduate',2,0,0,34,'N','No tuition; stipend ₹12,400 a month. 24 via ISI test, 8 via GATE, 2 Government-sponsored.'),
  ('isi-kolkata','statistician','B.SDS (Hons) — Statistical Data Science','Undergraduate',4,205000,205000,25,'N','₹1,00,000 tuition + ₹2,500 other fees per semester; waivers for SC/ST/PwBD and by family income.'),
  ('isi-kolkata',null,'PG Diploma in Statistical and Computational Genomics','Diploma',1,100000,100000,20,'N','₹25,000 tuition + ₹25,000 other fees per semester; waivers available.'),
  -- ISI Delhi
  ('isi-delhi','statistician','M.Stat (first year)','Postgraduate',2,0,0,38,'N','No tuition; stipend ₹8,000 a month. First year at Delhi, second year at Kolkata.'),
  ('isi-delhi','mathematician','M.Math','Postgraduate',2,0,0,18,'N','No tuition; stipend ₹8,000 a month.'),
  ('isi-delhi',null,'MS (Quantitative Economics)','Postgraduate',2,0,0,35,'N','No tuition; stipend ₹8,000 a month.'),
  ('isi-delhi','statistician','B.SDS (Hons) — Statistical Data Science','Undergraduate',4,205000,205000,25,'N','₹1,00,000 tuition + ₹2,500 other fees per semester; waivers for SC/ST/PwBD and by family income.'),
  -- ISI Bengaluru
  ('isi-bangalore','mathematician','B.Math (Hons)','Undergraduate',3,0,0,63,'N','No tuition; stipend ₹5,000 a month. 63 gender-neutral seats plus 16 supernumerary seats for women and up to 5 for INMO awardees.'),
  ('isi-bangalore','statistician','B.SDS (Hons) — Statistical Data Science','Undergraduate',4,205000,205000,25,'N','₹1,00,000 tuition + ₹2,500 other fees per semester; waivers for SC/ST/PwBD and by family income.'),
  ('isi-bangalore','operations-research-analyst','MS (Quality Management and Business Analytics)','Postgraduate',2,0,0,20,'N','No tuition; stipend ₹8,000 a month. First year at Bengaluru, second at Hyderabad.'),
  ('isi-bangalore',null,'MS (Library and Information Science)','Postgraduate',2,0,0,12,'N','No tuition; stipend ₹8,000 a month.'),
  -- ISI Chennai and Tezpur
  ('isi-chennai','statistician','PG Diploma in Statistical Methods and Analytics','Diploma',1,0,0,25,'N','No tuition listed; refundable deposits on admission. No hostel.'),
  ('isi-tezpur','statistician','PG Diploma in Statistical Methods and Analytics','Diploma',1,0,0,36,'N','18 open seats plus 18 reserved for North-East domiciles; stipend ₹3,000 a month for North-East domiciles. No hostel.'),
  -- CMI
  ('cmi-chennai','mathematician','B.S. (Hons) Mathematics','Undergraduate',4,250000,250000,null,'B','₹1,25,000 per semester; 30–35 full-tuition scholarships; income-based waivers. B.Sc. exit after 3 years.'),
  ('cmi-chennai','quantitative-analyst','B.S. (Hons) Mathematics and Computer Science','Undergraduate',4,250000,250000,null,'B','₹1,25,000 per semester; 30–35 full-tuition scholarships; income-based waivers. B.Sc. exit after 3 years.'),
  ('cmi-chennai','mathematician','B.S. (Hons) Mathematics and Physics','Undergraduate',4,250000,250000,null,'B','₹1,25,000 per semester; 30–35 full-tuition scholarships; income-based waivers. B.Sc. exit after 3 years.'),
  ('cmi-chennai','mathematician','M.Sc. Mathematics','Postgraduate',2,250000,250000,null,'B','₹1,25,000 per semester; full-tuition scholarships for about as many students as are admitted; fellowships ₹6,000 a month.'),
  ('cmi-chennai','cryptographer','M.Sc. Computer Science','Postgraduate',2,250000,250000,null,'B','₹1,25,000 per semester; full-tuition scholarships; fellowships ₹6,000 a month.'),
  ('cmi-chennai','quantitative-analyst','M.Sc. Data Science','Postgraduate',2,500000,500000,null,'B','₹2,50,000 per semester; income-based waivers (40% up to ₹8 lakh, 25% up to ₹12 lakh family income). No hostel.'),
  ('cmi-chennai','mathematician','Ph.D. Mathematics','Doctoral',5,0,0,null,'B','No tuition; stipend ₹37,000 a month (years 1–2) and ₹42,000 (years 3–5).'),
  ('cmi-chennai',null,'Ph.D. Computer Science','Doctoral',5,0,0,null,'B','No tuition; stipend ₹37,000 a month (years 1–2) and ₹42,000 (years 3–5).'),
  ('cmi-chennai',null,'Ph.D. Physics','Doctoral',5,0,0,null,'B','No tuition; stipend ₹37,000 a month (years 1–2) and ₹42,000 (years 3–5).'),
  -- TIFR-CAM
  ('tifr-cam-bengaluru','mathematician','Ph.D. Mathematics','Doctoral',null,0,0,null,'T','No tuition; all students receive a scholarship and annual contingency grant. Admission through TIFR GS.'),
  ('tifr-cam-bengaluru','mathematician','Integrated Ph.D. Mathematics','Integrated',null,0,0,null,'T','For bachelor''s graduates; scholarship and annual contingency grant. Admission through TIFR GS.'),
  -- HRI
  ('hri-prayagraj','mathematician','M.Sc. Mathematics (HBNI)','Postgraduate',2,null,null,null,'H','Research-oriented; master''s thesis in the fourth semester. Screening via NBHM test, then HRI written test.'),
  ('hri-prayagraj','mathematician','Ph.D. Mathematics (HBNI)','Doctoral',null,null,null,null,'H','Via NBHM test or CSIR-UGC NET (JRF) above HRI''s cut-off, then interview.')
) v(slug, career, course, deg, yrs, fmin, fmax, seats, s, note)
join public.colleges col on col.slug = v.slug
left join public.careers car on car.slug = v.career;

-- Existing rows (ISI Kolkata) take the official values
update public.college_courses cc set career_id = m.career_id, degree_type = m.deg, duration_years = m.yrs,
  annual_fees_min = m.fmin, annual_fees_max = m.fmax, total_seats = m.seats, mode = 'Full-Time',
  source_type = 'official', source_url = m.src, verified_at = now(), fee_note = m.note
from maths_courses m
where cc.college_id = m.college_id and cc.course_name = m.course;

insert into public.college_courses (college_id, career_id, course_name, degree_type, duration_years, annual_fees_min, annual_fees_max, total_seats, mode, source_type, source_url, verified_at, fee_note)
select m.college_id, m.career_id, m.course, m.deg, m.yrs, m.fmin, m.fmax, m.seats, 'Full-Time', 'official', m.src, now(), m.note
from maths_courses m
where not exists (select 1 from public.college_courses cc where cc.college_id = m.college_id and cc.course_name = m.course);

drop table if exists maths_courses;
