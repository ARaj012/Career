# College details with no official figures on file: what happens after the course (placements,
# or what replaces them), how admission is decided (cutoffs), and fees. Labelled on the site;
# shown only where the official value is missing. Matched by college slug.

PL = "Based on typical outcomes reported for this institution and similar ones in recent years; varies by programme and year."
AD = "Based on how this institution has admitted students in recent years; check the current prospectus."
PAYG = "Based on the official pay level for this post plus usual allowances."
FEL = "Based on the national fellowship rates revised in 2023 (JRF ₹37,000 and SRF ₹42,000 a month, plus HRA)."

def pl(slug, text, basis=PL):
    return (slug, "placements", "estimate", text, basis)

def cut(slug, text, basis=AD):
    return (slug, "college_cutoffs", "estimate", text, basis)

OFFICER = "No placements: cadets are commissioned as officers on completing training. A Lieutenant (or equivalent) starts at Pay Level 10 (basic ₹56,100) plus Military Service Pay of ₹15,500 — about ₹1 lakh a month gross."
PHD = "No campus placements: PhD students receive a fellowship (about ₹37,000 a month as JRF and ₹42,000 as SRF, plus HRA). Graduates usually go on to postdoctoral positions, faculty jobs or industry research."
ARTS = "No formal placement cell for most students. Graduates usually work as performing/visual artists, teachers or in media and design; starting earnings commonly range ~₹2–5 lakh a year and vary widely."

COLLEGES = [
  # ---- Defence academies ----
  pl("nda-pune", "No placements: after 3 years at NDA, cadets go to IMA, INA or AFA for pre-commission training and are then commissioned. " + OFFICER.split(': ', 1)[1], PAYG),
  pl("ima-dehradun", OFFICER, PAYG),
  pl("ina-ezhimala", OFFICER, PAYG),
  pl("ota-chennai", OFFICER, PAYG),
  pl("cme-pune", OFFICER + " CME trains officers of the Corps of Engineers.", PAYG),
  pl("mceme-secunderabad", OFFICER + " MCEME trains officers of the EME corps.", PAYG),
  pl("afa-hyderabad", OFFICER.replace("Lieutenant (or equivalent)", "Flying Officer"), PAYG),
  cut("afa-hyderabad", "No college cutoff: entry is through NDA (UPSC), AFCAT or CDS, then the SSB interview and medicals. NDA's final merit usually needs roughly 650–720 marks out of 1,800 (written + SSB)."),
  cut("cme-pune", "No college cutoff: officers come through NDA, CDS, TES (Class 12 PCM + JEE Main) or TGT entries, then the SSB interview."),
  cut("mceme-secunderabad", "No college cutoff: officers come through NDA, CDS, TES (Class 12 PCM + JEE Main) or TGT entries, then the SSB interview."),
  cut("ota-chennai", "No college cutoff: entry through CDS (OTA) or Short Service Commission entries (e.g. JAG, NCC), then the SSB interview."),
  pl("rimc-dehradun", "No placements: RIMC is a school (Class 8–12). Many cadets go on to the NDA and are commissioned as officers.", AD),
  cut("rimc-dehradun", "Admission to Class 8 through the RIMC entrance (written test in English, Maths and General Knowledge, then a viva and medical), held twice a year."),

  # ---- Research institutes (PhD) ----
  *[pl(s, PHD, FEL) for s in ["tifr-mumbai", "ncbs-bangalore", "imsc-chennai", "sinp-kolkata", "jncasr-bangalore", "nias-bangalore", "wihg-dehradun", "ncpor-goa", "nih-roorkee", "csir-delhi"]],
  cut("ncbs-bangalore", "No published cutoff: PhD admission through the NCBS/JGEEBILS entrance test and interviews."),
  cut("imsc-chennai", "No published cutoff: PhD admission through the IMSc entrance (or JEST/GATE/NET) and interviews."),
  cut("sinp-kolkata", "No published cutoff: PhD admission through JEST, GATE or NET followed by SINP's interviews."),
  cut("jncasr-bangalore", "No published cutoff: admission through JNCASR's entrance/interviews, with NET/GATE/JEST used for PhD programmes."),
  cut("nias-bangalore", "No published cutoff: PhD admission through NIAS's written test and interview."),
  cut("wihg-dehradun", "No published cutoff: PhD positions need a NET/GATE fellowship, then WIHG's interview."),
  cut("ncpor-goa", "No published cutoff: PhD positions need a CSIR/UGC-NET fellowship, then NCPOR's interview."),
  cut("nih-roorkee", "No published cutoff: research positions are filled through advertisements and interviews."),
  cut("csir-delhi", "CSIR is a research council, not a college: PhD positions at its labs need a CSIR-NET JRF (or GATE), then each lab's interview."),
  pl("wii-dehradun", "Small batches; most M.Sc Wildlife Science graduates join research projects, NGOs, forest departments or PhD programmes, typically at about ₹4–8 lakh a year (or a fellowship)."),
  cut("wii-dehradun", "No published cutoff: admission through WII's entrance test and interview for a small number of M.Sc seats."),
  cut("tifr-mumbai", "No published cutoff: admission through the TIFR GS test (December) and interviews."),

  # ---- Medical (no placements) ----
  pl("aiims-mangalagiri", "No placements: MBBS graduates do a 1-year paid internship, then take NEET-PG/INI-CET for postgraduate seats or work as medical officers (about ₹8–15 lakh a year in government service)."),
  pl("aiims-nagpur", "No placements: MBBS graduates do a 1-year paid internship, then take NEET-PG/INI-CET for postgraduate seats or work as medical officers (about ₹8–15 lakh a year in government service)."),
  pl("jipmer-karaikal", "No placements: MBBS graduates do a 1-year paid internship, then take NEET-PG/INI-CET for postgraduate seats or work as medical officers (about ₹8–15 lakh a year in government service)."),
  pl("national-institute-ayurveda-jaipur", "No campus placements: BAMS graduates usually join government AYUSH medical officer posts (through state PSCs), hospitals or private practice, typically at about ₹4–8 lakh a year."),
  pl("rajuvas-bikaner", "No campus placements: most B.V.Sc graduates join state animal husbandry departments as Veterinary Officers (through the state PSC), the dairy/pharma industry or private practice — typically about ₹4–8 lakh a year."),
  cut("rajuvas-bikaner", "B.V.Sc admission is through NEET-UG: 15% of seats by the VCI all-India counselling and 85% by the state's counselling; state-quota seats usually need a NEET score well above the qualifying mark."),
  cut("mafsu-nagpur", "B.V.Sc admission is through NEET-UG: 15% of seats by the VCI all-India counselling and 85% by Maharashtra's counselling."),

  # ---- Professional bodies (not colleges) ----
  pl("icai-delhi", "ICAI runs campus placement drives for newly qualified CAs twice a year; average offers have typically been about ₹12–13 lakh a year, with top offers ₹25–30 lakh+."),
  pl("icsi-delhi", "ICSI runs placement support for newly qualified Company Secretaries; typical starting offers are about ₹5–8 lakh a year."),
  pl("icmai-delhi", "ICMAI runs campus placements for newly qualified CMAs; typical offers are about ₹8–12 lakh a year."),
  pl("iibf-mumbai", "IIBF is a professional body that runs certifications for bankers; it does not run placements."),
  pl("ibps", "IBPS is a recruitment agency that conducts bank exams, not a college: it has no students, courses, fees or placements."),
  cut("ibps", "Not applicable: IBPS conducts the PO, Clerk, SO and RRB exams; see those exams for their cutoffs."),
  ("ibps", "fees", "estimate", "Not applicable: IBPS is a recruitment agency, not a college. It charges only exam application fees (about ₹850; ₹175 for SC/ST/PwD).", "Based on IBPS's recent exam notifications."),
  cut("iibf-mumbai", "Not applicable: IIBF certifications are open to bank employees and graduates by registration; there is no admission cutoff."),

  # ---- Government training / national bodies ----
  pl("barc-training", "No placements: OCES/DGFS trainees who complete the course are absorbed as Scientific Officers (C) at Pay Level 10 (basic ₹56,100) — about ₹1 lakh a month gross.", PAYG),
  pl("lbsnaa-mussoorie", "Not a college: LBSNAA trains officers already selected through the UPSC Civil Services Examination. IAS officers start at Pay Level 10 (basic ₹56,100).", PAYG),
  cut("lbsnaa-mussoorie", "Not applicable: officer trainees come through the UPSC Civil Services Examination."),
  pl("iipa-delhi", "No placements: IIPA's main programmes (such as APPPA) train serving government officers."),
  cut("iipa-delhi", "Not applicable: most participants are serving officers nominated by their departments."),
  pl("niepa-delhi", "No campus placements: M.Phil/PhD scholars usually move into academia, policy research or education administration."),
  cut("niepa-delhi", "No published cutoff: admission through NIEPA's entrance test and interview."),
  pl("ncert-delhi", "No placements: NCERT is a national council; its Regional Institutes of Education train teachers, who usually join schools through TET/KVS/state recruitment."),
  cut("ncert-delhi", "Admission to NCERT's teacher-education programmes is through the RIE Common Entrance Examination (RIE CEE)."),
  pl("rie-bhubaneswar", "No formal placements for most: B.Ed/B.Sc.B.Ed graduates usually become teachers through CTET/state TET and KVS/NVS/state recruitment (government teachers start around ₹45,000–60,000 a month gross)."),
  pl("sai-national", "Not a college: the Sports Authority of India runs coaching and training centres."),
  cut("sai-national", "Not applicable: athletes are selected for SAI centres through trials and performance."),
  pl("nsnis-patiala", "No campus placements: diploma/PG coaching graduates usually become coaches with SAI, state sports departments, schools or clubs (about ₹3–7 lakh a year)."),
  cut("nsnis-patiala", "No published cutoff: admission through an entrance test, sports-skill test and sporting achievements."),
  pl("cee-ahmedabad", "Small programmes; graduates usually join environmental education, NGOs or sustainability roles (about ₹3–6 lakh a year)."),
  cut("cee-ahmedabad", "No published cutoff: admission by application and interview."),
  pl("ignou-delhi", "No campus placements for most programmes: IGNOU is an open university and most learners study while working."),
  cut("ignou-delhi", "No entrance or cutoff for most programmes: admission on meeting the eligibility (a few programmes such as B.Ed and MBA have entrance tests)."),

  # ---- Engineering colleges ----
  pl("jntuh-college-of-engineering", "B.Tech placements: average roughly ₹6–10 lakh a year, with top offers around ₹30–50 lakh in CSE/IT."),
  pl("jntucek-kakinada", "B.Tech placements: average roughly ₹4–7 lakh a year, with top offers around ₹15–30 lakh."),
  pl("usict-ggsipu", "B.Tech placements: average roughly ₹6–10 lakh a year, with top offers around ₹20–40 lakh in CSE/IT."),
  pl("vssut-burla", "B.Tech placements: average roughly ₹5–8 lakh a year, with top offers around ₹15–30 lakh."),
  pl("gec-kannur", "B.Tech placements: average roughly ₹3–5 lakh a year, with top offers around ₹10–20 lakh."),
  pl("cucek-kuttanad", "B.Tech placements: average roughly ₹3–5 lakh a year; a smaller share of students is placed than at the main CUSAT campus."),

  # ---- Universities, colleges and other institutions ----
  pl("ashoka-university", "Placements are optional for liberal arts students; those who take part typically get about ₹8–12 lakh a year (consulting, research, policy, media); many go on to master's programmes."),
  cut("ashoka-university", "No cutoff: holistic admission using the Ashoka Aptitude Assessment, essays, school record and an interview."),
  pl("amity-psychology-noida", "Placements: roughly ₹3–5 lakh a year in HR, counselling support and research roles; most clinical careers need further study (M.Phil/RCI)."),
  pl("amity-sports-noida", "Placements: roughly ₹2.5–4 lakh a year as coaches, fitness trainers and in sports management."),
  cut("amity-psychology-noida", "No published cutoff: admission mainly on Class 12 marks (often 60–70%+) plus Amity's interview/assessment."),
  cut("amity-sports-noida", "No published cutoff: admission on Class 12 marks plus a fitness/skill assessment."),
  pl("magadh-university", "Limited campus placements; where available, offers are typically about ₹2–3.5 lakh a year. Most graduates prepare for government exams or further study."),
  cut("magadh-university", "Admission mainly on Class 12 merit lists (some courses use entrance tests)."),
  pl("gcfa-chennai", ARTS),
  pl("msu-finearts-baroda", ARTS),
  pl("kalakshetra-chennai", ARTS),
  pl("iksv-khairagarh", ARTS),
  pl("nsd-delhi", "No formal placements: graduates work in theatre (including NSD's repertory), film, television and teaching; earnings vary widely."),
  pl("sna-delhi", "Not a degree college: Sangeet Natak Akademi supports and recognises performing arts; it does not run placements."),
  pl("ftii-pune", "No formal placements: graduates mostly freelance or join film/TV productions; early earnings commonly range ~₹3–10 lakh a year and vary widely."),
  pl("du-law-faculty", "No formal placements for most students: LL.B graduates usually join litigation (often ₹15,000–40,000 a month at the start) or law firms and companies (about ₹6–15 lakh a year)."),
  pl("niper-ahmedabad", "M.Pharm/M.S. (Pharm) placements: average roughly ₹5–8 lakh a year in pharma R&D, regulatory and quality roles."),
  pl("niper-kolkata", "M.Pharm/M.S. (Pharm) placements: average roughly ₹5–8 lakh a year in pharma R&D, regulatory and quality roles."),
  cut("niper-ahmedabad", "Admission through NIPER JEE rank; seats in popular departments usually go within roughly the top few hundred ranks."),
  cut("niper-kolkata", "Admission through NIPER JEE rank; seats in popular departments usually go within roughly the top few hundred to 1,000 ranks."),
  cut("niper-mohali", "Admission through NIPER JEE rank; the Mohali campus usually fills within roughly the top few hundred ranks."),

  cut("acj-chennai", "No published cutoff: admission through ACJ's entrance test and an interview."),
  cut("ajkmcrc-delhi", "No published cutoff: admission through Jamia's entrance test and an interview for a small number of seats."),
  cut("amity-law-delhi", "No published cutoff: admission through CLAT or Amity's own test, with Class 12 marks."),
  cut("amrita-pharmacy-kochi", "No published cutoff: admission on Class 12 marks through Amrita's admission process (a minimum of about 50–60% in PCB/PCM)."),
  cut("amu-law", "Admission through the AMU law entrance (merit list); half of the seats are reserved for AMU's internal students."),
  cut("azim-premji-university", "No published cutoff: admission through the university's National Entrance Test and an interview."),
  cut("bangalore-university", "UG admission is mainly on Class 12 merit through affiliated colleges; PG admission uses the university's entrance/merit lists."),
  cut("cswnn-mumbai", "No published cutoff: BSW/MSW admission on merit and the college's entrance/interview."),
  cut("ddu-gorakhpur", "Admission on merit lists and the university's entrance tests (CUET for some programmes)."),
  cut("diat-pune", "M.Tech admission mainly on GATE score; sponsored candidates from DRDO/defence take an interview."),
  cut("dssw-delhi", "MSW admission is through CUET-PG scores; popular seats usually need a high score."),
  cut("gauhati-university", "Admission on Class 12 / graduation merit and entrance tests or CUET for some programmes."),
  cut("gcfa-chennai", "No published cutoff: admission through an aptitude test/portfolio review for fine arts programmes."),
  cut("igidr-mumbai", "No published cutoff: admission through IGIDR's written test and interview."),
  cut("iksv-khairagarh", "No published cutoff: admission through a practical/aptitude test and interview in the chosen art."),
  cut("ivri-bareilly", "Admission through ICAR AIEEA-PG (M.V.Sc/M.Sc) and ICAR AICE-JRF/SRF (PhD) ranks."),
  cut("kalakshetra-chennai", "No published cutoff: admission through an audition/practical test and interview."),
  cut("mafsu-nagpur", "B.V.Sc admission is through NEET-UG: 15% of seats by the VCI all-India counselling and 85% by Maharashtra's counselling."),
  cut("mic-manipal", "No published cutoff: admission through MAHE's online test/merit and an interview."),
  cut("msu-finearts-baroda", "No published cutoff: admission through the faculty's aptitude/practical test."),
  cut("mumbai-university", "Admission is through merit lists at affiliated colleges; popular colleges' cutoffs for B.Com/B.Sc are often 85–95% in Class 12."),
  cut("nsd-delhi", "No published cutoff: admission through a preliminary audition, then a workshop and interview."),
  cut("ocld-delhi", "No published cutoff: admission through applications, aptitude assessments and multiple interviews by the Oberoi group."),
  cut("patna-university", "Admission through Patna University's entrance tests and merit lists."),
  cut("pearl-academy-delhi", "No published cutoff: admission through Pearl's entrance test (PAT) and an interview/portfolio review."),
  cut("presidency-college-chennai", "Admission on Class 12 merit; popular B.Sc/B.A. courses usually need about 90%+ in the relevant subjects."),
  cut("ranchi-university", "Admission on merit lists (CUET for some programmes)."),
  cut("rbu-kolkata", "Admission on Class 12 merit and practical/aptitude tests for performing and visual arts."),
  cut("sid-pune", "No published cutoff: admission through SEED (Symbiosis Entrance Exam for Design), then a studio test and interview."),
  cut("sna-delhi", "Not applicable: Sangeet Natak Akademi is a national academy, not a degree college."),
  cut("srfti-kolkata", "No published cutoff: admission through JET, then orientation and interview."),
  cut("srips-coimbatore", "Admission on Class 12 marks (usually PCB) through the institute's counselling."),
  cut("tnpesu-chennai", "Admission on Class 12 merit plus physical fitness and sports achievement."),
  cut("wgsha-manipal", "No published cutoff: admission through MAHE's online test/merit and an interview."),
  cut("rimc-dehradun", "Admission to Class 8 through the RIMC entrance (written test in English, Maths and General Knowledge, then a viva and medical), held twice a year."),
  cut("ncbs-bangalore", "No published cutoff: PhD admission through the NCBS/JGEEBILS entrance test and interviews."),

  ("techno-india-university", "fees", "estimate", "B.Tech tuition is roughly ₹1–1.6 lakh a year; other UG programmes roughly ₹60,000–1.2 lakh a year.", "Based on typical fees for private engineering universities in Kolkata."),

  # ---- ISI centres: ISI files one NIRF return for the whole institute, so no centre-wise official counts ----
  *[(s, "naac_grade", "secondary", "Not NAAC-graded",
     "ISI is an Institution of National Importance under the ISI Act, 1959. Neither its website nor its 2024-25 Annual "
     "Report mentions a NAAC grade, and a college profile states it has not been accredited by NAAC. NAAC's own register "
     "could not be reached to confirm.",
     "Aakash college profile", "https://www.aakash.ac.in/college/indian-statistical-institute")
    for s in ["isi-kolkata", "isi-delhi", "isi-bangalore", "isi-chennai", "isi-tezpur"]],
  ("isi-delhi", "total_students", "estimate",
   "About 140–200 degree students in 2026-27 (B.SDS, M.Stat first year, M.Math and MS (QE)), plus PhD/JRF research scholars.",
   "ISI's Prospectus 2026-27 gives the Delhi Centre 25 B.SDS seats a year (started 2024, so three batches), 35 MS (QE) seats "
   "a year (two batches), 18 M.Math seats (first batch) and the first year of the 38-seat M.Stat — about 200 students if "
   "every seat is filled. ISI's Annual Report 2024-25 shows enrolment below the seat count (41 MS (QE) students joined "
   "against 56 seats), so the lower end allows for that. ISI files one NIRF return for all its centres, so there is no "
   "official Delhi-only figure.",
   "ISI Prospectus 2026-27", "https://admission.isical.ac.in/Documents/IsiAdmission2026/ISI-Prospectus-2026-27.pdf", 140, 200),
  ("isi-delhi", "enrollment", "estimate",
   "About 140–200 degree students at the Delhi Centre in 2026-27, up from roughly 100–140 in 2024-25 as the B.SDS batches "
   "(from 2024) and the M.Math batch (from 2026) were added.",
   "Worked out from the Delhi Centre's seats in ISI's prospectus and the programmes ISI's annual reports list for Delhi "
   "(M.Stat and MS (QE) throughout; B.SDS from 2024-25; M.Math from 2026-27). ISI reports student strength to NIRF only "
   "for the whole institute (1,241 students in 2024-25).",
   "ISI Prospectus 2026-27", "https://admission.isical.ac.in/Documents/IsiAdmission2026/ISI-Prospectus-2026-27.pdf", 140, 200),
  ("isi-delhi", "placements", "estimate",
   "Expected median of about ₹15–20 lakh a year for M.Stat and MS (QE) graduates who take jobs; a large share go on to PhDs instead.",
   "ISI's own figures for the same programmes at Kolkata in 2024-25: M.Stat 38 of 38 job-seekers placed, median ₹20 lakh "
   "(highest ₹50 lakh); MS (QE) 10 of 10, median ₹15.5 lakh (Annual Report 2024-25). ISI's NIRF 2026 return gives a "
   "₹22.5 lakh median for all its two-year PG graduates of 2024-25. ISI Delhi's placement page could not be reached and "
   "no Delhi-only figures are published.",
   "ISI Annual Report 2024-25", "https://www.isical.ac.in/isical_web/files/about/publications/annual-reports/Annual_Report_2024-25.pdf", 1500000, 2000000),
]

# drop accidental duplicates (keep the first)
_seen = set()
COLLEGES = [r for r in COLLEGES if not ((r[0], r[1]) in _seen or _seen.add((r[0], r[1])))]
