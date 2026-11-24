-- Scholarships tied to the exams, colleges and careers on the site (added 21 Nov 2026).
-- Every figure was read on the official source given in application_url / how_to_apply:
--   AICTE PG (GATE/CEED), Bihar SC/ST and EBC civil-services incentives, Free Coaching for SC/OBC,
--   PM's Scholarship (KSB), INSPIRE Fellowship, ICAR NTS-PG  -> myscheme.gov.in (Govt of India)
--   CSIR JRF -> csirhrdg.res.in; UGC JRF -> ugc.gov.in; ICAR NTS-UG -> NSP FAQ (scholarships.gov.in)
--   IIT fee waiver -> IIT Kanpur fee FAQ (Jul 2025) + IIT Mandi remission guidelines
--   ISI stipends -> ISI Admission Notice 2026-27; CMI -> cmi.ac.in B.Sc / M.Sc pages

insert into public.scholarships
  (slug, name, provider, description, category, level, field_of_study, state, country,
   amount_min, amount_max, amount_type, eligibility_criteria, required_documents, how_to_apply,
   application_url, is_active, automation_enabled, verified_at)
values
-- ── Exam-linked ─────────────────────────────────────────────────────────────
('aicte-pg-scholarship-gate-ceed',
 'AICTE PG Scholarship for GATE/CEED Qualified Students',
 'All India Council for Technical Education (AICTE), Ministry of Education',
 $$₹12,400 a month for up to 24 months (or the course length, if shorter) for full-time M.E., M.Tech, M.Arch and M.Des students admitted with a valid GATE or CEED score to an AICTE-approved institution, within its approved intake. Final-year students of dual-degree programmes get it from the 9th semester for one year. Scholars are expected to give 8–10 hours a week to teaching or research work assigned by the institute.$$,
 'merit', 'postgraduate', array['Engineering','Technology','Design','Architecture'], 'All States', 'India',
 12400, 12400, 'monthly',
 $$Must have qualified the GATE or CEED with a valid score at the time of admission; admitted as a full-time student to an AICTE-approved M.E., M.Tech, M.Arch or M.Des programme within the approved intake (AICTE adds 10% extra for EWS admissions); not for foreign, sponsored or management-quota students; paused while you receive other financial assistance; not for anyone who already had this scholarship from AICTE or a centrally funded institute such as an IIT or NIT.$$,
 array['Aadhaar card (mandatory)','Passport-size photograph','Proof of age','Mark sheets and degree certificates','GATE/CEED scorecard','Caste certificate (if applicable)','Disability certificate (if applicable)','Income certificate (if applicable)','Bank account details (no joint, no-frill or Jan Dhan accounts)'],
 $$1. After admission, your institute uploads eligible PG students' details on the AICTE PG Scholarship portal and gives you a Unique ID.
2. Log in at https://pgscholarship.aicte-india.org/ with that Unique ID.
3. Upload scanned copies (JPG/JPEG) of your original documents.
4. Your institute verifies your details and approves your candidature.
5. The scholarship is paid every month by DBT to your Aadhaar-linked bank account.$$,
 'https://pgscholarship.aicte-india.org/', true, true, now()),

('csir-jrf-net-fellowship',
 'CSIR Junior Research Fellowship (CSIR-UGC NET)',
 'Council of Scientific & Industrial Research (CSIR-HRDG), Government of India',
 $$Fellowship for candidates who qualify for JRF in the Joint CSIR-UGC NET in a science subject and join a PhD: ₹37,000 a month for the first two years, then ₹42,000 a month as SRF (NET) after an assessment, plus a contingency grant of ₹20,000 a year. HRA follows the host institute's rules (not paid to hostel residents). Total JRF + SRF tenure is up to five years (revised guidelines, effective 1 March 2023).$$,
 'merit', 'phd', array['Chemical Sciences','Earth Sciences','Life Sciences','Mathematical Sciences','Physical Sciences'], 'All States', 'India',
 37000, 42000, 'monthly',
 $$Must have qualified for JRF in the Joint CSIR-UGC NET (Chemical, Earth, Life, Mathematical or Physical Sciences); register for a full-time PhD at a recognised university or institute; upgrade to SRF after two years depends on a three-member assessment committee.$$,
 array['CSIR-UGC NET JRF award letter','PhD admission/registration letter','Joining report from the host institute','Aadhaar card','Bank account details'],
 $$1. Qualify for JRF in the Joint CSIR-UGC NET, held by NTA every June and December (https://csirnet.nta.nic.in).
2. Get admission to a PhD programme at a recognised university, institute or lab.
3. Activate the fellowship with CSIR-HRDG through your host institute as set out in your award letter and the guidelines at https://csirhrdg.res.in/Home/Index/1/Default/3384/60.
4. After two years, the institute's three-member committee assesses you for upgrade to SRF.$$,
 'https://csirhrdg.res.in/Home/Index/1/Default/3384/60', true, true, now()),

('ugc-jrf-net-fellowship',
 'UGC Junior Research Fellowship (NET-JRF)',
 'University Grants Commission (UGC)',
 $$UGC fellowship for NET-JRF qualified candidates doing an M.Phil or PhD in humanities, social sciences (including languages) and sciences: JRF ₹37,000 a month for two years, then SRF ₹42,000 a month. Contingency: ₹10,000 a year (JRF) and ₹20,500 (SRF) in humanities and social sciences; ₹12,000 and ₹25,000 for science scholars. Tenure is 5 years or until thesis submission, whichever is earlier; 11,750 slots.$$,
 'merit', 'phd', array['Humanities','Social Sciences','Languages','Commerce','Science'], 'All States', 'India',
 37000, 42000, 'monthly',
 $$Must have qualified NET-JRF (UGC NET) or the UGC-CSIR joint test; register for an M.Phil or PhD at a university, institution or college within two years of the result or the award letter.$$,
 array['UGC NET JRF e-certificate / award letter','PhD or M.Phil registration letter','Joining report from the university','Aadhaar card','Bank account details'],
 $$1. Qualify for JRF in UGC NET, held by NTA every June and December (https://ugcnet.nta.nic.in/).
2. Register for an M.Phil or PhD within two years of the result or award letter.
3. Join the fellowship through your university, which processes it on UGC's fellowship portal.
Scheme details: https://www.ugc.gov.in/Fellowship/stu_Fellowship1$$,
 'https://www.ugc.gov.in/Fellowship/stu_Fellowship1', true, true, now()),

('inspire-fellowship-phd',
 'INSPIRE Fellowship (PhD)',
 'Department of Science and Technology (DST), Government of India',
 $$DST fellowship for a full-time PhD in basic or applied sciences, including engineering, medicine, agriculture, veterinary science and pharmacy. Fellows join as JRF and can be upgraded to SRF after two years (or after one year with a first-author paper in an international peer-reviewed journal). Tenure up to five years. Also pays HRA as per Government of India norms, a contingency grant of up to ₹20,000 a year, and allows research internships of up to 18 months in India or abroad.$$,
 'merit', 'phd', array['Science','Engineering','Medicine','Agricultural Science','Veterinary Science','Pharmacy'], 'All States', 'India',
 null, null, 'stipend',
 $$Must have secured 1st rank at the post-graduate level in a basic or applied science course at a recognised university (not an autonomous college), with at least 70% aggregate and a batch of 7 or more students, or 1st rank in medicine at graduate/PG level, or be an INSPIRE scholar with at least 70% aggregate in M.Sc / integrated M.S.; for a full-time PhD only; selection by DST's Subject Expert Committee on a competitive basis; not for distance-mode degrees or anyone holding another fellowship.$$,
 array['1st rank certificate in the INSPIRE format (not a provisional certificate or mark sheet)','PhD admission letter from the host institute','Mark sheets','Research proposal','Aadhaar card'],
 $$1. Apply online at https://www.online-inspire.gov.in/ when DST opens the fellowship call.
2. Upload the rank certificate in DST's INSPIRE format and your PhD admission letter.
3. DST's Subject Expert Committee reviews academic merit, the research proposal, the supervisor and the host institute.
4. The fellowship is paid through your host institute every month.$$,
 'https://www.online-inspire.gov.in/', true, true, now()),

('icar-national-talent-scholarship-ug',
 'ICAR National Talent Scholarship (UG)',
 'Indian Council of Agricultural Research (ICAR)',
 $$₹3,000 a month for the whole degree for students admitted through CUET (ICAR-UG) to an ICAR All India Quota seat at an agricultural university outside their home state. There is no separate application: every student admitted this way is eligible.$$,
 'merit', 'undergraduate', array['Agriculture','Agricultural Science','Horticulture','Forestry','Allied Sciences'], 'All States', 'India',
 3000, 3000, 'monthly',
 $$Must have qualified CUET (ICAR-UG) and taken an ICAR All India Quota seat at an agricultural university outside the home state; students admitted through a state university's own entrance test are not eligible; continuation needs an OGPA/CGPA of at least 7.00 out of 10 (6.50 for SC/ST), good conduct and punctuality.$$,
 array['ICAR award letter (if asked)','Aadhaar card','Bank account details'],
 $$1. Take an ICAR All India Quota seat through CUET (ICAR-UG) counselling at a university outside your home state — you become eligible automatically.
2. When asked, complete your details on the National Scholarship Portal (https://scholarships.gov.in) and upload the ICAR award letter.
3. Keep an OGPA of at least 7.00 (6.50 for SC/ST) to keep receiving it.
Official FAQ: https://scholarships.gov.in/public/FAQ/FAQsforICAR_NTS-UG_3103.pdf$$,
 'https://scholarships.gov.in', true, true, now()),

('icar-national-talent-scholarship-pg',
 'ICAR National Talent Scholarship (PG)',
 'Indian Council of Agricultural Research (ICAR)',
 $$₹3,000 a month for master's students at an ICAR-recognised agricultural university outside their state of domicile, renewed each year on academic performance and conduct. No contingency grant.$$,
 'merit', 'postgraduate', array['Agriculture','Agricultural Science','Horticulture','Veterinary Science','Allied Sciences'], 'All States', 'India',
 3000, 3000, 'monthly',
 $$Must have qualified the ICAR entrance examination for PG admission and joined an approved master's course at an agricultural university outside the home state; study whole-time without any job, even part-time; no other scholarship during the course; must not change the subject allotted or leave within a month of admission; merit and good conduct certified by the head of the institution.$$,
 array['Photograph','Signature','Thumb impression'],
 $$1. Apply for the ICAR PG entrance examination online at https://icar.nta.ac.in (only online forms are accepted).
2. Take admission to a master's programme at an agricultural university outside your home state.
3. The scholarship is awarded for one year at a time and renewed on good academic performance and conduct.$$,
 'https://icar.nta.ac.in', true, true, now()),

-- ── Civil services and competitive exams ─────────────────────────────────────
('bihar-sc-st-civil-sewa-protsahan-yojana',
 'Bihar SC/ST Civil Sewa Protsahan Yojana',
 'Scheduled Caste & Scheduled Tribe Welfare Department, Government of Bihar',
 $$One-time help to prepare for the mains and interview: ₹1,00,000 for clearing the UPSC Civil Services preliminary exam and ₹50,000 for clearing the BPSC Combined Competitive preliminary exam.$$,
 'government', 'undergraduate,postgraduate', array['All Streams'], 'Bihar', 'India',
 50000, 100000, 'fixed',
 $$Must be a permanent resident of Bihar; must belong to the Scheduled Caste (SC) or Scheduled Tribe (ST) category; must have passed the preliminary examination of the UPSC Civil Services Examination or the BPSC Combined Competitive Examination; available only once per candidate; not for those already employed in a government department, PSU or state-funded institution, or anyone who got the same incentive from another source.$$,
 array['Passport-size photograph','Scanned signature','Aadhaar card','Self-attested admit card','Proof of passing the preliminary exam','Residence/domicile certificate','Caste certificate','Bank account details or cancelled cheque'],
 $$1. Open the Bihar Civil Seva Protsahan portal: https://bcebconline.bihar.gov.in/cspy/EBCscholarship/Index.aspx
2. Click New Registration, read the guidelines and register to get a registration ID and password.
3. Log in as Applicant, fill the form and upload your documents.
4. Check everything and make the final submission (no edits after that); print the submitted form.$$,
 'https://bcebconline.bihar.gov.in/cspy/EBCscholarship/Index.aspx', true, true, now()),

('bihar-ebc-civil-seva-protsahan-yojana',
 'Bihar EBC Civil Seva Protsahan Yojana',
 'Backward Classes & Extremely Backward Classes Welfare Department, Government of Bihar',
 $$One-time incentive for clearing the preliminary (first) stage of a competitive exam: ₹1,00,000 for UPSC Civil Services; ₹75,000 for UPSC Engineering, Economic or Statistical Service; ₹50,000 for the Combined Geo-Scientist exam, CDS, CAPF, NDA & Naval Academy written exam, CBI Dy. SP, BPSC Combined Competitive prelims, Bihar Judicial Service prelims and other states' PSC prelims; ₹30,000 for RBI Grade B, SBI/IBPS bank PO, LIC AAO, SSC CGL and Railway Recruitment Board technical/graduate-level prelims.$$,
 'government', 'undergraduate,postgraduate', array['All Streams'], 'Bihar', 'India',
 30000, 100000, 'fixed',
 $$Must be a permanent resident of Bihar; must belong to the Extremely Backward Class (EBC) category; must have passed the preliminary examination of an eligible competitive exam (UPSC Civil Services, IES/ISS, CDS, NDA, CAPF, BPSC, Bihar Judicial Service, RBI Grade B, bank PO, LIC AAO, SSC CGL or RRB); not for those already employed in a government department, PSU or state-funded institution, or anyone who got the same incentive from another source.$$,
 array['Passport-size photograph','Scanned signature','Aadhaar card','Admit card','Proof of passing the preliminary exam','Residence certificate','Caste certificate','Bank account details'],
 $$1. Open the Bihar Civil Seva Protsahan portal: https://bcebconline.bihar.gov.in/cspy/EBCscholarship/Index.aspx
2. Click New Registration, read the guidelines and register to get a registration ID and password.
3. Log in as Applicant, fill the form and upload your documents.
4. Check everything and make the final submission (no edits after that); print the submitted form. Use Request Query on the portal if you face a problem.$$,
 'https://bcebconline.bihar.gov.in/cspy/EBCscholarship/Index.aspx', true, true, now()),

('free-coaching-scheme-sc-obc',
 'Free Coaching Scheme for SC and OBC Students',
 'Department of Social Justice & Empowerment, Government of India (through Dr. Ambedkar Foundation and empanelled Central Universities)',
 $$Free coaching at an empanelled Central University for competitive and entrance exams, plus a stipend of ₹4,000 a month for up to 12 months and ₹15,000 for clearing the mains of central or state civil services. Course fees are paid up to: civil services (UPSC/State PSC) ₹75,000; JEE/NEET ₹75,000; IES ₹75,000; CA-CPT/GATE ₹75,000; banking, insurance, PSU or CLAT ₹50,000; CAT/CMAT ₹50,000; SSC/RRB ₹40,000; GRE/GMAT/SAT/IELTS/TOEFL ₹35,000; commercial pilot licence courses ₹30,000; NDA/CDS ₹20,000. 3,500 students a year, 70% SC and 30% OBC, with 30% of seats for women.$$,
 'government', 'class_11_12,undergraduate,postgraduate', array['All Streams'], 'All States', 'India',
 4000, 4000, 'monthly',
 $$Must belong to the Scheduled Caste (SC) or Other Backward Class (OBC) category (beneficiaries of the PM CARES Children Scheme also qualify, with no caste or income limit); total family income ₹8 lakh per annum or less; for exams taken after Class 12, be in or have passed Class 12 with at least 50% in Class 10; for graduate-level exams, be in the final year or have a degree with at least 50% in Class 12; can be used at most twice; not while using another coaching scheme.$$,
 array['Caste certificate','Income certificate','Class 10 and 12 mark sheets','Degree or final-year proof (for graduate-level exams)','Aadhaar card','Aadhaar-linked bank account'],
 $$1. Watch for the advertisement from an empanelled Central University inviting applications for the coaching programme.
2. Apply online to that university (offline applications are not accepted).
3. Attend the coaching in person; the stipend is paid by DBT to your Aadhaar-linked bank account.
Scheme guidelines: https://socialjustice.gov.in/writereaddata/UploadFile/84931739961630.pdf$$,
 'https://socialjustice.gov.in/writereaddata/UploadFile/84931739961630.pdf', true, false, now()),

-- ── Career-linked (defence families) ─────────────────────────────────────────
('pm-scholarship-scheme-ex-servicemen-wards',
 'PM''s Scholarship Scheme for Wards of Ex-Servicemen (KSB)',
 'Kendriya Sainik Board, Department of Ex-Servicemen Welfare, Ministry of Defence',
 $$₹2,500 a month for boys and ₹3,000 a month for girls (paid once a year) for the length of a first professional degree — BE/B.Tech, MBBS, BDS, B.Pharm, BBA, BCA, B.Ed, BA LLB and other courses on KSB's approved list, plus MBA and MCA. 5,500 new scholarships every year, split equally between boys and girls, with priority for wards of personnel killed or disabled in action.$$,
 'government', 'undergraduate,postgraduate', array['Engineering','Medical','Dental','Pharmacy','Management','Law','Education','Technical'], 'All States', 'India',
 2500, 3000, 'monthly',
 $$Only for dependent wards and widows of ex-servicemen and ex-Coast Guard personnel; admitted to the first year of an approved professional course this year (no lateral entry); minimum 60% marks in the minimum educational qualification (Class 12, diploma or graduation, counting all subjects); master's courses other than MBA/MCA are not covered; one course only.$$,
 array['Ex-serviceman identity/discharge proof','Admission proof for the first year','Mark sheet of the qualifying exam (60%+)','Aadhaar card','Bank account details'],
 $$1. Apply online on the KSB portal: http://online.ksb.gov.in/ in the first year of your course.
2. Get the application verified as the portal directs.
3. Selected students are paid once a year through ECS into their bank account.
List of approved courses: https://ksb.gov.in/writereaddata/DownLoad/List_of_Authorised_professional_degree_courses_under_PMSS.pdf$$,
 'http://online.ksb.gov.in/', true, true, now()),

-- ── College-linked ───────────────────────────────────────────────────────────
('iit-tuition-fee-waiver',
 'IIT Tuition Fee Waiver (B.Tech / BS)',
 'Indian Institutes of Technology (IITs)',
 $$IITs waive B.Tech/BS tuition fees: SC, ST and PwD students pay no tuition at all, and other students get a full waiver if family income is below ₹1 lakh a year or a two-thirds waiver if it is between ₹1 lakh and ₹5 lakh. It applies for the four years of the course and is claimed from the institute each year. Checked against IIT Kanpur's fee FAQ (July 2025) and IIT Mandi's remission guidelines — confirm details on your own IIT's fee page.$$,
 'need_based', 'undergraduate', array['Engineering','Technology','Science'], 'All States', 'India',
 null, null, 'annual',
 $$Only for students admitted to an IIT (B.Tech, BS or similar undergraduate programme); SC/ST/PwD students are exempt from tuition fees on their category certificate; other students need a family income below ₹5 lakh per annum — full waiver below ₹1 lakh, two-thirds waiver between ₹1 lakh and ₹5 lakh; a valid income proof and affidavit must be submitted every year; an EWS certificate alone does not count.$$,
 array['Family income certificate from the Revenue Dept/DC/SDM/Tehsildar (or the family ITR, as your IIT asks)','Notarised affidavit in the institute''s format','Caste or disability certificate (for SC/ST/PwD)'],
 $$1. At admission/registration, upload your income proof and the waiver affidavit on your IIT's student portal or give them to the academic/DoSA office.
2. Use a fresh income certificate (issued on or after 1 April of the current financial year) every year.
3. If you paid the full fee before your proof was accepted, claim the refund from the institute.
IIT Kanpur FAQ: https://iitk.ac.in/dosa/data/FAQ_FOR_FEES_AND_DUES_ISSUES-18-07-25.pdf · IIT Mandi guidelines: https://academics.iitmandi.ac.in/pdf/fees/General_guidelines_for_tuition_fee_remission.pdf$$,
 'https://iitk.ac.in/dosa/data/FAQ_FOR_FEES_AND_DUES_ISSUES-18-07-25.pdf', true, false, now()),

('isi-student-stipends',
 'ISI Student Stipends (B.Stat, B.Math, M.Stat, M.Math, M.Tech)',
 'Indian Statistical Institute (ISI)',
 $$ISI pays a monthly stipend to deserving students who meet the minimum academic standard: ₹5,000 for B.Stat and B.Math; ₹8,000 for M.Stat, M.Math, MS (Quantitative Economics), MS (QMBA) and MS (Library & Information Science); ₹12,400 for M.Tech in Computer Science, Cryptology & Security, and Quality, Reliability & Operations Research; ₹3,000 for PGDSMA students from the North-East states. B.SDS and PGDSCG have full tuition waivers for SC/ST/PwBD students and full or partial waivers by family income. JRFs get ₹37,000 a month. (ISI Admission Notice 2026-27.)$$,
 'merit', 'undergraduate,postgraduate', array['Statistics','Mathematics','Computer Science','Technology','Quantitative Economics','Data Science'], 'All States', 'India',
 5000, 12400, 'stipend',
 $$Only for students admitted to the Indian Statistical Institute through the ISI Admission Test (M.Tech also admits GATE scorers above a threshold through an interview); the stipend goes to deserving students who satisfy the minimum academic qualification.$$,
 array['ISI admission offer','Bank account details'],
 $$1. Apply for the ISI Admission Test at https://admission.isical.ac.in/ (applications usually open in February; the test is in May).
2. Once admitted, the stipend for your programme is paid every month while you meet the academic standard.$$,
 'https://admission.isical.ac.in/', true, true, now()),

('cmi-scholarships',
 'CMI Scholarships (B.Sc and M.Sc)',
 'Chennai Mathematical Institute (CMI)',
 $$About 35 B.Sc scholarships a year, each a full waiver of the ₹1,25,000-a-semester tuition plus ₹5,000 a month. For M.Sc Mathematics and Computer Science, full tuition waivers for roughly as many students as recent batches, and a limited number of fellowships of ₹6,000 a month. Partial and full tuition waivers are also given on financial need.$$,
 'merit', 'undergraduate,postgraduate', array['Mathematics','Computer Science','Physics','Data Science'], 'All States', 'India',
 5000, 6000, 'monthly',
 $$Only for students admitted to Chennai Mathematical Institute through the CMI entrance examination; scholarships are decided at admission and reviewed every semester on academic performance; need-based partial or full tuition waivers depend on the family's financial background.$$,
 array['CMI admission offer','Family income proof (for need-based waivers)','Bank account details'],
 $$1. Take the CMI entrance examination (held in May at centres across India).
2. Scholarships are decided at the time of admission — no separate application.
3. For a need-based fee waiver, ask CMI's office with proof of family income.
Details: https://www.cmi.ac.in/teaching/bsc.php and https://www.cmi.ac.in/teaching/msc.php$$,
 'https://www.cmi.ac.in/teaching/bsc.php', true, true, now())
on conflict (slug) do nothing;

-- ── Link them to the colleges they apply at ──────────────────────────────────
-- Institute-specific awards
insert into public.college_scholarships (college_id, scholarship_id, match_type, relevance_note)
select c.id, s.id, 'field_specific',
       case s.slug
         when 'iit-tuition-fee-waiver' then 'Fee waiver for B.Tech/BS students at ' || c.name
         when 'isi-student-stipends'   then 'Monthly stipend for ISI students at ' || c.name
         else 'Scholarship for students admitted to ' || c.name end
from public.colleges c
join public.scholarships s on
     (s.slug = 'iit-tuition-fee-waiver' and c.slug ~ '^iit-')
  or (s.slug = 'isi-student-stipends'   and c.slug ~ '^isi-')
  or (s.slug = 'cmi-scholarships'       and c.slug = 'cmi-chennai')
on conflict (college_id, scholarship_id) do nothing;

-- AICTE PG scholarship: AICTE-approved engineering institutions (same set as AICTE Pragati,
-- leaving out IITs, NITs, IIITs, IISc and IISERs, which are not AICTE-approved)
insert into public.college_scholarships (college_id, scholarship_id, match_type, relevance_note)
select c.id, n.id, 'national', 'Open to eligible students nationwide, including at ' || c.name
from public.college_scholarships p
join public.scholarships ps on ps.id = p.scholarship_id and ps.slug = 'aicte-pragati-scholarship-girls'
join public.colleges c on c.id = p.college_id and c.slug !~ '^(iit-|nit-|iiit|iisc|iiser)'
cross join public.scholarships n
where n.slug = 'aicte-pg-scholarship-gate-ceed'
on conflict (college_id, scholarship_id) do nothing;

-- PM's Scholarship (KSB): professional-course colleges (same set as the CAPF wards scheme)
insert into public.college_scholarships (college_id, scholarship_id, match_type, relevance_note)
select p.college_id, n.id, 'national', 'Open to eligible students nationwide, including at ' || c.name
from public.college_scholarships p
join public.scholarships ps on ps.id = p.scholarship_id and ps.slug = 'pm-scholarship-capf-assam-rifles-wards'
join public.colleges c on c.id = p.college_id
cross join public.scholarships n
where n.slug = 'pm-scholarship-scheme-ex-servicemen-wards'
on conflict (college_id, scholarship_id) do nothing;

-- ICAR National Talent Scholarships: agricultural universities in the ICAR-AU system
insert into public.college_scholarships (college_id, scholarship_id, match_type, relevance_note)
select c.id, s.id, 'national', 'For ICAR All India Quota students from other states at ' || c.name
from public.colleges c
join public.scholarships s on
     (s.slug = 'icar-national-talent-scholarship-ug'
        and c.slug in ('aau-jorhat','angrau-guntur','ccshau-hisar','gbpuat-pantnagar','kau-thrissur','ouat-bhubaneswar','pau-ludhiana','tnau-coimbatore'))
  or (s.slug = 'icar-national-talent-scholarship-pg'
        and c.slug in ('aau-jorhat','angrau-guntur','ccshau-hisar','gbpuat-pantnagar','kau-thrissur','ouat-bhubaneswar','pau-ludhiana','tnau-coimbatore','iari-delhi','ivri-bareilly'))
on conflict (college_id, scholarship_id) do nothing;
