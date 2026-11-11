# Estimates for career details no official body publishes here: the usual route in and
# expected pay. Shown labelled "Approximate estimate · not officially verified", only where
# the official facts / salary are missing. Matched by career slug.

R = "Based on the usual eligibility and entry routes for this career in India."
P = "Based on typical pay reported for this role in India in recent years; varies with employer, city and experience."
G = "Based on the 7th Pay Commission pay level for this post plus usual allowances; in-hand pay depends on city and deductions."

def route(slug, text):
    return (slug, "how_to_enter", "estimate", text, R)

def pay(slug, text, lo=None, hi=None, basis=P):
    return (slug, "salary", "estimate", text, basis, None, None, lo, hi)

CAREERS = [
  # ---------------- Engineering & technology ----------------
  route("aerospace-engineer", "Eligibility: Class 12 with Physics, Chemistry and Maths.\nRoute: B.Tech/B.E. in Aerospace or Aeronautical Engineering (via JEE Main/Advanced or state CETs) → jobs at HAL, ISRO, DRDO, airlines' MRO or private aerospace firms; M.Tech via GATE helps for research roles."),
  route("agricultural-engineer", "Eligibility: Class 12 with PCM (some colleges accept PCB).\nRoute: B.Tech in Agricultural Engineering (state agricultural university CETs or ICAR quota via CUET-UG) → jobs in farm machinery, irrigation, food processing, or state agriculture departments."),
  route("ai-ml-engineer", "Eligibility: Class 12 with Maths.\nRoute: B.Tech/B.E. in CSE, AI/ML or Data Science (JEE Main, state CETs) → strong Python, statistics and ML projects → software/AI roles; an M.Tech or MS helps for research teams."),
  route("biomedical-engineer", "Eligibility: Class 12 with PCM (PCB accepted by some colleges).\nRoute: B.Tech in Biomedical Engineering → roles in medical device firms, hospitals' clinical engineering or R&D; M.Tech via GATE for design/research roles."),
  route("blockchain-developer", "Eligibility: Class 12; a computing degree (B.Tech CSE, BCA, B.Sc CS) is usual.\nRoute: learn programming (Solidity, Rust, Go), cryptography basics and smart contracts → build projects/open-source contributions → developer roles in fintech and Web3 firms."),
  route("chemical-engineer", "Eligibility: Class 12 with PCM.\nRoute: B.Tech in Chemical Engineering (JEE Main/Advanced or state CETs) → process, plant or R&D roles in refineries, pharma and chemicals; PSU jobs via GATE."),
  route("civil-engineer", "Eligibility: Class 12 with PCM.\nRoute: B.Tech/B.E. in Civil Engineering → site, design or planning roles with builders and consultancies; government roles via SSC JE, state AE/JE exams, UPSC ESE or PSUs via GATE."),
  route("cloud-architect", "Eligibility: a degree in CSE/IT (B.Tech, BCA/MCA) is usual.\nRoute: 3–6 years in software, DevOps or systems roles → cloud certifications (AWS, Azure, Google Cloud) → solution architect roles."),
  route("cybersecurity-analyst", "Eligibility: a degree in CSE/IT or a related field.\nRoute: networking and security fundamentals → certifications such as CompTIA Security+, CEH or OSCP → SOC analyst roles, moving to incident response, pentesting or security engineering."),
  route("data-engineer", "Eligibility: a degree in CSE/IT, maths or statistics.\nRoute: SQL, Python and big-data tools (Spark, Kafka, cloud warehouses) → data engineering roles, often after a start in software or analytics."),
  route("data-scientist", "Eligibility: a degree in CSE, maths, statistics or economics.\nRoute: statistics, Python/R, SQL and machine learning → analyst or junior data scientist roles; a master's (M.Tech, M.Sc Statistics/Data Science) helps."),
  route("devops-engineer", "Eligibility: a degree in CSE/IT is usual.\nRoute: Linux, scripting, CI/CD, Docker/Kubernetes and a cloud platform → system administrator or developer roles moving into DevOps/SRE."),
  route("electrical-engineer", "Eligibility: Class 12 with PCM.\nRoute: B.Tech/B.E. in Electrical (or EEE) → power, manufacturing or design roles; PSU jobs (NTPC, PGCIL) via GATE; state electricity boards and UPSC ESE."),
  route("electronics-engineer", "Eligibility: Class 12 with PCM.\nRoute: B.Tech/B.E. in Electronics & Communication → semiconductor, embedded, telecom roles; PSUs (BEL, ISRO, DRDO) via GATE or their own tests."),
  route("full-stack-developer", "Eligibility: no fixed degree, though B.Tech CSE/BCA/MCA is common.\nRoute: HTML/CSS/JavaScript, a frontend framework (React), a backend (Node/Java/Python) and databases → portfolio projects → developer roles."),
  route("game-developer", "Eligibility: a degree in CSE or game design/development is common.\nRoute: C++/C#, a game engine (Unity or Unreal) and maths for games → published projects/game jams → studio roles."),
  route("mechanical-engineer", "Eligibility: Class 12 with PCM.\nRoute: B.Tech/B.E. in Mechanical Engineering → design, manufacturing or maintenance roles; PSU jobs via GATE; UPSC ESE for central engineering services."),
  route("metallurgical-engineer", "Eligibility: Class 12 with PCM.\nRoute: B.Tech in Metallurgical/Materials Engineering → steel, aluminium, automotive or defence materials roles; PSUs (SAIL, NMDC) via GATE."),
  route("robotics-engineer", "Eligibility: Class 12 with PCM.\nRoute: B.Tech in Mechanical, Electronics, Mechatronics or Robotics → embedded systems, control and programming (ROS) → automation and robotics roles; M.Tech helps."),
  route("software-engineer", "Eligibility: Class 12 (Maths helps); B.Tech/B.E. CSE/IT, BCA/MCA or B.Sc CS are common.\nRoute: data structures, algorithms and one or two languages → internships/projects → campus or off-campus placement."),
  route("textile-engineer", "Eligibility: Class 12 with PCM.\nRoute: B.Tech in Textile Technology/Engineering → production, quality or R&D roles in textile mills and apparel firms."),
  route("ui-ux-designer", "Eligibility: no fixed degree; B.Des (via UCEED, NID DAT, NIFT) or a design course is common.\nRoute: design fundamentals, user research and tools (Figma) → a strong portfolio → product design roles."),
  route("product-designer", "Eligibility: B.Des (UCEED, NID DAT, NIFT entrance) or an engineering/design degree.\nRoute: industrial or digital product design portfolio → design studios or product companies; M.Des via CEED for advanced roles."),
  route("product-manager", "Eligibility: usually a degree in engineering or business; an MBA is common.\nRoute: a few years in engineering, design, analytics or consulting → associate product manager roles → product manager."),

  # ---------------- Science & research ----------------
  route("academic-researcher", "Eligibility: a master's degree in the subject (55%+).\nRoute: qualify CSIR/UGC-NET (JRF), GATE or JEST → PhD → postdoctoral research → faculty or scientist positions."),
  route("agricultural-scientist", "Eligibility: B.Sc Agriculture or a related degree, then M.Sc.\nRoute: ICAR AIEEA-PG for M.Sc, ICAR AICE-JRF/SRF for PhD → ASRB's ARS exam for scientist posts in ICAR institutes."),
  route("agronomist", "Eligibility: B.Sc (Hons) Agriculture (via ICAR quota/CUET-UG or state agricultural university tests).\nRoute: M.Sc Agronomy → agronomist roles with agri-businesses, state agriculture departments or research institutes."),
  route("agricultural-extension-officer", "Eligibility: B.Sc Agriculture/Horticulture.\nRoute: state Agriculture Department recruitment through the state PSC or subordinate services board (posts such as Agricultural Extension Officer/ADO)."),
  route("biotech-researcher", "Eligibility: B.Sc/B.Tech in Biotechnology or life sciences, then M.Sc.\nRoute: DBT-BET, CSIR-NET or GATE (Life Sciences) for a JRF → PhD → research roles in institutes or biotech companies."),
  route("clinical-researcher", "Eligibility: a degree in life sciences, pharmacy, nursing or medicine.\nRoute: a clinical research course or PG diploma (GCP training) → clinical research associate/coordinator roles with CROs, pharma companies or hospitals."),
  route("defence-scientist-drdo", "Eligibility: B.E./B.Tech (first class) or M.Sc.\nRoute: valid GATE score → DRDO's Scientist 'B' recruitment through RAC (written exam/interview)."),
  route("environmental-scientist", "Eligibility: B.Sc in environmental science, chemistry or life sciences.\nRoute: M.Sc Environmental Science → roles with pollution control boards, consultancies (EIA) or research institutes; NET/PhD for research."),
  route("food-technologist", "Eligibility: Class 12 with PCM/PCB.\nRoute: B.Tech/B.Sc in Food Technology → quality, production or R&D roles in food companies; FSSAI recruitment for food safety officers."),
  route("horticulturist", "Eligibility: B.Sc (Hons) Horticulture.\nRoute: state horticulture departments (via PSC exams), nurseries, agri-businesses; M.Sc/PhD for research."),
  route("nanotech-researcher", "Eligibility: B.Tech/M.Sc in physics, chemistry, materials or nanotechnology.\nRoute: M.Tech/M.Sc in Nanotechnology → PhD via GATE/NET/JEST → research roles in institutes and industry R&D."),
  route("research-scientist", "Eligibility: a master's degree in science or engineering.\nRoute: NET/GATE/JEST for a fellowship → PhD → postdoc → scientist posts in CSIR, DRDO, ISRO, ICMR or industry R&D."),
  route("space-scientist", "Eligibility: B.Tech/M.Sc in engineering, physics or related fields (first class).\nRoute: ISRO Centralised Recruitment Board (ICRB) exams for Scientist/Engineer 'SC', or study at IIST (via JEE Advanced) for direct absorption."),
  route("archaeologist", "Eligibility: a degree in history, archaeology or anthropology.\nRoute: M.A./PG diploma in Archaeology (e.g. Institute of Archaeology, ASI) → UGC-NET → ASI posts through UPSC or state archaeology departments."),
  route("historian", "Eligibility: B.A./M.A. in History.\nRoute: UGC-NET → PhD → teaching or research posts; roles in archives, museums and publishing."),
  route("economist", "Eligibility: B.A./B.Sc in Economics (Maths helps).\nRoute: M.A./M.Sc Economics (DSE, JNU, MSE, ISI) → Indian Economic Service via UPSC, RBI Grade B (DEPR), research firms or policy institutes."),
  route("linguist", "Eligibility: B.A. in languages or linguistics.\nRoute: M.A. Linguistics → UGC-NET/PhD → roles in academia, language technology (NLP), translation and lexicography."),
  route("policy-analyst", "Eligibility: a degree in economics, political science, law or public policy.\nRoute: master's in public policy or economics → think tanks, government fellowships (e.g. LAMP, CM fellowships) and consultancies."),

  # ---------------- Medicine & health ----------------
  route("dentist", "Eligibility: Class 12 with PCB (50%; 40% reserved categories).\nRoute: NEET-UG → BDS (5 years incl. internship) → register with the state dental council; MDS via NEET-MDS."),
  route("doctor-mbbs", "Eligibility: Class 12 with PCB (50%; 40% reserved categories).\nRoute: NEET-UG → MBBS (5.5 years incl. internship) → NExT/registration with NMC/state council; MD/MS via NEET-PG."),
  route("nursing", "Eligibility: Class 12 with PCB and English (usually 45–50%).\nRoute: B.Sc Nursing (many colleges use NEET-UG or state tests) or GNM diploma → registration with the state nursing council."),
  route("pharmacist", "Eligibility: Class 12 with PCB or PCM.\nRoute: D.Pharm (2 years) or B.Pharm (4 years) → registration with the State Pharmacy Council (under the Pharmacy Council of India rules)."),
  route("physiotherapist", "Eligibility: Class 12 with PCB.\nRoute: BPT (4.5 years incl. internship) → registration with the state/allied health council; MPT for specialisation."),
  route("psychologist", "Eligibility: B.A./B.Sc in Psychology.\nRoute: M.A./M.Sc Psychology → counselling roles; for clinical practice, an RCI-recognised M.Phil/Professional Diploma in Clinical Psychology."),
  route("audiologist", "Eligibility: Class 12 with PCB (or PCM at some colleges).\nRoute: BASLP (4 years) at an RCI-recognised college → registration with the Rehabilitation Council of India; MASLP for specialisation."),
  route("clinical-psychologist", "Eligibility: M.A./M.Sc Psychology.\nRoute: RCI-recognised M.Phil in Clinical Psychology (or the newer professional programmes) → RCI registration as a Clinical Psychologist."),
  route("prosthetist-orthotist", "Eligibility: Class 12 with PCB/PCM.\nRoute: BPO (4.5 years incl. internship) at an RCI-recognised institute → RCI registration."),
  route("dietitian-nutritionist", "Eligibility: Class 12 (Science preferred).\nRoute: B.Sc/M.Sc in Food & Nutrition or Dietetics → internship → Registered Dietitian exam of the Indian Dietetic Association."),
  route("speech-language-pathologist", "Eligibility: Class 12 with PCB/PCM.\nRoute: BASLP at an RCI-recognised college → RCI registration; MASLP for specialisation."),
  route("yoga-instructor", "Eligibility: Class 12; a yoga degree/diploma helps.\nRoute: B.Sc/M.Sc Yoga or a certified course → Yoga Certification Board (Ministry of AYUSH) certification such as Yoga Protocol Instructor or Wellness Instructor."),

  # ---------------- Law ----------------
  route("lawyer", "Eligibility: Class 12 (any stream) for the 5-year LL.B, or a graduate degree for the 3-year LL.B.\nRoute: CLAT/AILET/state CETs → LL.B → enrol with a State Bar Council → pass the All India Bar Examination to practise."),
  route("constitutional-lawyer", "Eligibility: LL.B (5-year or 3-year).\nRoute: enrol with a Bar Council and pass AIBE → practise under senior advocates in High Courts/Supreme Court; LL.M in constitutional law helps."),
  route("corporate-lawyer", "Eligibility: LL.B, ideally from an NLU (via CLAT).\nRoute: internships at law firms → associate roles at law firms or in-house legal teams; Bar enrolment and AIBE for practice."),
  route("criminal-lawyer", "Eligibility: LL.B.\nRoute: Bar Council enrolment and AIBE → practise in trial courts under a senior advocate; later High Court practice."),
  route("cyber-lawyer", "Eligibility: LL.B; a technology background helps.\nRoute: Bar enrolment and AIBE → specialise via cyber law/IT law diplomas → roles in firms, companies and government."),
  route("environmental-lawyer", "Eligibility: LL.B.\nRoute: Bar enrolment and AIBE → work before the National Green Tribunal, with NGOs or firms; LL.M in environmental law helps."),
  route("family-lawyer", "Eligibility: LL.B.\nRoute: Bar enrolment and AIBE → practise in family courts under a senior advocate."),
  route("human-rights-lawyer", "Eligibility: LL.B.\nRoute: Bar enrolment and AIBE → work with legal aid bodies, NGOs or commissions; LL.M in human rights helps."),
  route("ip-lawyer", "Eligibility: LL.B (a science/engineering degree helps for patents).\nRoute: Bar enrolment and AIBE → IP firms; patent work also needs the Patent Agent Examination."),
  route("tax-lawyer", "Eligibility: LL.B (a commerce background helps).\nRoute: Bar enrolment and AIBE → practise before tax tribunals or join firms; CA/CS adds value."),
  route("legal-advisor", "Eligibility: LL.B.\nRoute: experience at a firm or in litigation → in-house legal advisor roles in companies, banks or PSUs (PSU legal posts via CLAT-PG scores or their own exams)."),
  route("notary", "Eligibility: a practising advocate with at least 10 years' practice (7 for reserved categories, women and some others).\nRoute: apply to the central or state government under the Notaries Act, 1952."),
  route("public-prosecutor", "Eligibility: LL.B and usually 7 years' practice as an advocate (assistant posts need less).\nRoute: Assistant Public Prosecutor exams by state PSCs, or appointment by the state/central government."),

  # ---------------- Government & civil services ----------------
  route("central-civil-services-officer-group-a", "Eligibility: any bachelor's degree; age 21–32 (relaxed for reserved categories).\nRoute: UPSC Civil Services Examination (Prelims → Mains → Interview)."),
  route("customs-officer", "Eligibility: any bachelor's degree.\nRoute: Inspector (Customs/CGST) through SSC CGL; IRS (Customs & Indirect Taxes) through the UPSC Civil Services Examination."),
  route("diplomat", "Eligibility: any bachelor's degree; age 21–32.\nRoute: UPSC Civil Services Examination → Indian Foreign Service (needs a high rank)."),
  route("election-commissioner", "Not a recruitment post: Election Commissioners are appointed by the President, usually from senior IAS officers. The route is the IAS (UPSC Civil Services) and decades of service."),
  route("forest-officer", "Eligibility: a bachelor's degree in science, engineering or agriculture.\nRoute: UPSC Indian Forest Service exam (prelims shared with CSE) or state forest service exams through state PSCs."),
  route("ifs-officer", "Eligibility: any bachelor's degree.\nRoute: UPSC Civil Services Examination → Indian Foreign Service."),
  route("intelligence-officer", "Eligibility: any bachelor's degree.\nRoute: Intelligence Bureau ACIO exam (MHA), or IPS through the UPSC Civil Services Examination."),
  route("irs-officer", "Eligibility: any bachelor's degree.\nRoute: UPSC Civil Services Examination → IRS (Income Tax) or IRS (Customs & Indirect Taxes)."),
  route("municipal-commissioner", "Usually an IAS officer (via UPSC CSE) or a state civil service officer (via the state PSC) posted to a municipal corporation."),
  route("railway-officer", "Eligibility: a bachelor's degree (engineering for technical posts).\nRoute: UPSC Civil Services Examination for IRMS, or UPSC ESE for engineering services; non-officer posts via RRB exams."),
  route("ssc-government-assistant-clerk", "Eligibility: Class 12 for CHSL posts; a degree for CGL posts.\nRoute: SSC CHSL (LDC/JSA) or SSC CGL (Assistant/ASO)."),
  route("state-psc-officer", "Eligibility: any bachelor's degree; age limits vary by state.\nRoute: the state PSC's combined civil services exam (Prelims → Mains → Interview)."),
  route("policy-analyst", "Eligibility: a degree in economics, political science, law or public policy.\nRoute: master's in public policy or economics → think tanks, government fellowships and consultancies."),

  # ---------------- Defence & security ----------------
  route("air-force-agniveer", "Eligibility: Class 12 (Maths, Physics, English with 50%) or a 3-year engineering diploma; age 17.5–21.\nRoute: Agnipath (Agniveervayu) online test → physical fitness and medical tests → 4-year engagement; up to 25% may be retained."),
  route("airforce-officer", "Eligibility: Class 12 with PCM for NDA; a degree for AFCAT/CDS.\nRoute: NDA (after Class 12), AFCAT or CDS (after graduation), or NCC Special Entry → SSB interview → medical → training."),
  route("army-officer", "Eligibility: Class 12 for NDA/TES; a degree for CDS/OTA.\nRoute: NDA, CDS, TES (Class 12 PCM + JEE Main), NCC Special Entry or TGC (engineers) → SSB interview → training."),
  route("cisf-constable", "Eligibility: Class 12 (for GD posts in recent drives; Class 10 for tradesmen); age 18–23.\nRoute: CISF recruitment notice (or SSC GD for some posts) → physical, written and medical tests."),
  route("coast-guard-navik", "Eligibility: Class 12 with Maths and Physics for Navik (GD); Class 10 for Navik (DB); age 18–22.\nRoute: Coast Guard Enrolled Personnel Test (CGEPT) → physical and medical tests."),
  route("crpf-constable", "Eligibility: Class 10; age 18–23.\nRoute: SSC GD Constable exam → physical efficiency/standard tests → medical."),
  route("indian-coast-guard-officer", "Eligibility: a degree (with Maths and Physics to Class 12 for General Duty).\nRoute: Coast Guard Assistant Commandant exam (CGCAT) → preliminary and final selection boards → medical."),
  route("military-intelligence-officer", "Officers are drawn from the Army (via NDA, CDS etc.) and posted to the Intelligence Corps after commissioning."),
  route("navy-agniveer", "Eligibility: Class 12 with Maths and Physics (for SSR) or Class 10 (for MR); age 17.5–21.\nRoute: Agnipath (Navy) online test → physical fitness test → medical → 4-year engagement."),
  route("navy-officer", "Eligibility: Class 12 with PCM for NDA/10+2 B.Tech; a degree for CDS/SSC entry.\nRoute: NDA, Navy 10+2 B.Tech (via JEE Main), CDS or graduate Short Service entries → SSB interview → training."),
  route("paramilitary-force-officer-capf", "Eligibility: any bachelor's degree; age 20–25.\nRoute: UPSC CAPF (Assistant Commandants) exam → physical tests → interview/personality test."),
  route("territorial-army-officer", "Eligibility: a graduate with a civilian job or self-employment; age 18–42.\nRoute: Territorial Army officer exam → preliminary interview board → SSB → medical."),
  route("loco-pilot", "Eligibility: Class 10 + ITI, or a diploma/degree in engineering; age 18–30.\nRoute: RRB Assistant Loco Pilot (ALP) exam (CBT 1, CBT 2, aptitude test) → training → promotion to Loco Pilot."),
  route("kvs-teacher", "Eligibility: PRT — Class 12 + D.El.Ed/B.El.Ed with CTET Paper I; TGT — degree + B.Ed with CTET Paper II; PGT — master's + B.Ed.\nRoute: KVS recruitment exam when notified (or CBSE-run combined teacher recruitment)."),

  # ---------------- Banking, finance & business ----------------
  route("actuary", "Eligibility: Class 12 with Maths/Statistics (85%+ in Maths for direct entry).\nRoute: Actuarial Common Entrance Test (ACET) of the Institute of Actuaries of India → clear the IAI's actuarial papers → Fellow."),
  route("bank-clerk-associate", "Eligibility: any bachelor's degree; age 20–28.\nRoute: IBPS Clerk or SBI Junior Associate exams (Prelims → Mains → local language test)."),
  route("bank-probationary-officer-po", "Eligibility: any bachelor's degree; age 20–30.\nRoute: IBPS PO or SBI PO exams (Prelims → Mains → Interview)."),
  route("business-manager", "Eligibility: a bachelor's degree; an MBA is common.\nRoute: CAT/XAT/GMAT/MAT/CMAT → MBA → management trainee roles; or rise through a company's operations or sales."),
  route("chartered-accountant", "Eligibility: Class 12 (CA Foundation) or a graduate with the required marks (direct entry to Intermediate).\nRoute: ICAI's CA Foundation → Intermediate → 2-year articleship → CA Final → ICAI membership."),
  route("entrepreneur", "No fixed eligibility. Common path: a degree (often engineering or business), a few years' work experience, then a startup — often via incubators (IIT/IIM incubators, Startup India) and early-stage funding."),
  route("financial-analyst", "Eligibility: a degree in commerce, economics, finance or engineering.\nRoute: an MBA (Finance), CFA or FRM → analyst roles in banks, investment firms or corporate finance."),
  route("hr-manager", "Eligibility: any bachelor's degree.\nRoute: MBA/PGDM in HR (via CAT, XAT or TISS/XLRI admissions) → HR executive roles → HR manager."),
  route("investment-banker", "Eligibility: a degree in commerce, economics or engineering.\nRoute: an MBA from a top B-school (via CAT/GMAT) or CA/CFA → analyst/associate roles in investment banks."),
  route("marketing-manager", "Eligibility: any bachelor's degree.\nRoute: MBA/PGDM in Marketing (CAT, XAT, MAT, CMAT) → brand, sales or digital marketing roles → manager."),
  route("chef", "Eligibility: Class 12 (any stream).\nRoute: B.Sc Hospitality & Hotel Administration (NCHM JEE for IHMs) or a culinary diploma/degree → commis chef in hotel kitchens → chef de partie → sous chef → head chef."),
  route("hotel-manager", "Eligibility: Class 12 (any stream) with English.\nRoute: B.Sc Hospitality & Hotel Administration (via NCHM JEE for IHMs) or BHM → management trainee programmes in hotel chains."),

  # ---------------- Media, arts & design ----------------
  route("content-creator", "No fixed eligibility. Build skills in writing, video and editing, publish consistently on a platform (YouTube, Instagram, blogs) and grow an audience; brand deals and platform revenue follow."),
  route("fashion-designer", "Eligibility: Class 12 (any stream).\nRoute: B.Des in Fashion Design via the NIFT entrance, NID DAT, UCEED or private design school tests → portfolio → design house or own label."),
  route("film-director", "Eligibility: Class 12 or a degree.\nRoute: FTII/SRFTI (via JET) or other film schools, or assisting directors on sets → short films → feature work."),
  route("graphic-designer", "Eligibility: Class 12 (any stream).\nRoute: B.Des/B.F.A. or a design diploma → tools (Adobe Suite, Figma) and a portfolio → studio or agency roles."),
  route("interior-designer", "Eligibility: Class 12 (any stream).\nRoute: B.Des/B.Sc in Interior Design (NID, CEPT, private schools) or a diploma → internships → design firms or own practice."),
  route("journalist", "Eligibility: Class 12 (any stream).\nRoute: BJMC or a degree, then PG diploma (IIMC, ACJ, Xavier's) → reporting internships → newsroom roles."),
  route("performing-artist", "No fixed eligibility. Formal training (NSD, music/dance universities such as IKSV, or a guru) plus auditions and stage work."),
  route("textile-designer", "Eligibility: Class 12 (any stream).\nRoute: B.Des in Textile Design via NIFT/NID entrances or private schools → textile mills, export houses or fashion brands."),

  # ---------------- Education & social ----------------
  route("curriculum-developer", "Eligibility: a subject degree plus B.Ed/M.Ed.\nRoute: teaching experience → curriculum roles in boards, publishers or edtech firms."),
  route("edtech-entrepreneur", "No fixed eligibility. Usual path: teaching or tech experience → a learning product → incubators and funding."),
  route("education-consultant", "Eligibility: a degree; M.Ed or counselling qualifications help.\nRoute: teaching or admissions counselling experience → consultancies or independent practice."),
  route("educational-psychologist", "Eligibility: M.A./M.Sc Psychology (educational/school psychology).\nRoute: school counselling roles; RCI-recognised qualifications for assessment work."),
  route("librarian", "Eligibility: a bachelor's degree.\nRoute: B.Lib.I.Sc and M.Lib.I.Sc → UGC-NET for college/university librarian posts; KVS/NVS/school librarian posts via their exams."),
  route("online-course-creator", "No fixed eligibility. Subject expertise, teaching ability and video skills → publish on platforms (Udemy, YouTube, own site)."),
  route("professor", "Eligibility: a master's degree with 55% (50% for reserved categories).\nRoute: UGC-NET (or CSIR-NET/SLET) → Assistant Professor posts; a PhD is needed for promotion and many universities."),
  route("school-principal", "Eligibility: a master's degree with B.Ed and usually 8–15 years' teaching experience.\nRoute: promotion from senior teacher, or KVS/NVS/state principal recruitment exams."),
  route("social-worker", "Eligibility: a bachelor's degree (BSW preferred).\nRoute: MSW (TISS via CUET-PG, Delhi School of Social Work, Nirmala Niketan) → NGOs, CSR, hospitals and government schemes."),
  route("special-education-teacher", "Eligibility: Class 12 for D.Ed (Special Education); a degree for B.Ed (Special Education).\nRoute: RCI-recognised D.Ed/B.Ed Special Education → RCI registration → schools and inclusive education programmes."),
  route("sports-coach", "Eligibility: Class 12; sports achievements help.\nRoute: B.P.Ed/M.P.Ed (e.g. LNIPE) or NIS Patiala coaching diploma → coaching posts with SAI, schools, clubs."),

  # ---------------- Other ----------------
  route("air-traffic-controller", "Eligibility: B.Sc with Physics and Maths, or B.E./B.Tech.\nRoute: Airports Authority of India Junior Executive (ATC) exam → voice and background tests → training."),
  route("architect", "Eligibility: Class 12 with PCM (50%).\nRoute: NATA or JEE Main Paper 2 → B.Arch (5 years) → registration with the Council of Architecture."),

  # ---------------- Expected pay (careers with no salary on file) ----------------
  pay("air-force-agniveer", "₹30,000 a month in year 1 rising to ₹40,000 in year 4 (about ₹21,000–28,000 in hand after the Agniveer Corpus Fund contribution), plus about ₹10 lakh Seva Nidhi on exit after 4 years.", 360000, 480000, "Based on the Agnipath scheme's published pay structure."),
  pay("navy-agniveer", "₹30,000 a month in year 1 rising to ₹40,000 in year 4 (about ₹21,000–28,000 in hand after the Agniveer Corpus Fund contribution), plus about ₹10 lakh Seva Nidhi on exit after 4 years.", 360000, 480000, "Based on the Agnipath scheme's published pay structure."),
  pay("audiologist", "About ₹2.5–5 lakh a year at entry; ₹6–12 lakh a year with experience or private practice.", 250000, 1200000),
  pay("bank-it-officer", "Scale I officer: basic about ₹48,480 a month; gross about ₹80,000–90,000 a month with DA and allowances (about ₹9–11 lakh a year).", 900000, 1100000, "Based on the 12th Bipartite Settlement pay scale for JMGS-I officers plus usual allowances."),
  pay("chef", "About ₹2–4 lakh a year as a commis/junior chef; ₹6–15 lakh as sous or head chef in good hotels; executive chefs ₹20 lakh+.", 200000, 1500000),
  pay("cinematographer", "Assistants earn about ₹1.5–4 lakh a year; established cinematographers are paid per project (roughly ₹50,000 to several lakh per project).", 150000, 1000000),
  pay("cisf-constable", "Pay Level 3 (basic ₹21,700–69,100); about ₹35,000–40,000 a month gross at entry with allowances.", 420000, 480000, G),
  pay("crpf-constable", "Pay Level 3 (basic ₹21,700–69,100); about ₹35,000–40,000 a month gross at entry with allowances.", 420000, 480000, G),
  pay("coast-guard-navik", "Navik (GD) Pay Level 3 (basic ₹21,700); about ₹35,000–40,000 a month gross with allowances.", 420000, 480000, G),
  pay("clinical-psychologist", "About ₹4–7 lakh a year at entry for RCI-registered clinical psychologists; ₹8–15 lakh+ with experience or private practice.", 400000, 1500000),
  pay("commercial-pilot", "First officers at Indian airlines earn about ₹1–2 lakh a month (₹12–25 lakh a year); captains about ₹4–8 lakh a month.", 1200000, 9600000),
  pay("cost-management-accountant", "About ₹6–12 lakh a year for newly qualified CMAs; ₹15–30 lakh in senior finance roles.", 600000, 3000000),
  pay("film-editor", "About ₹2–5 lakh a year starting; experienced editors ₹8–20 lakh a year or per-project fees.", 200000, 2000000),
  pay("footwear-designer", "About ₹3–5 lakh a year starting; ₹8–15 lakh with experience.", 300000, 1500000),
  pay("forensic-scientist", "Government Scientific Assistant/Officer posts: Pay Level 6–10 (about ₹35,000–1,00,000 a month gross); private labs about ₹3–8 lakh a year.", 300000, 1200000),
  pay("investment-adviser", "About ₹4–8 lakh a year as an associate; independent fee-based advisers often earn ₹10–30 lakh+ depending on clients.", 400000, 3000000),
  pay("kvs-teacher", "PRT Level 6 (basic ₹35,400), TGT Level 7 (₹44,900), PGT Level 8 (₹47,600) plus DA and HRA — roughly ₹55,000–85,000 a month gross.", 660000, 1020000, G),
  pay("lic-aao", "Basic pay about ₹53,600 a month (scale up to ₹1,02,090); gross about ₹85,000–95,000 a month in metro cities.", 1000000, 1150000, "Based on LIC's AAO pay scale in its recent notifications plus usual allowances."),
  pay("loco-pilot", "Assistant Loco Pilot: Pay Level 2 (basic ₹19,900); with running allowance usually about ₹35,000–50,000 a month.", 420000, 600000, G),
  pay("merchant-navy-officer", "Deck/engine cadets get a stipend; junior officers about US$2,000–5,000 a month; captains/chief engineers about US$10,000–15,000 a month (often tax-free for NRIs).", None, None),
  pay("meteorologist", "IMD Scientist-B: Pay Level 10 (basic ₹56,100), about ₹1 lakh a month gross; private weather firms about ₹4–10 lakh a year.", 400000, 1200000),
  pay("mutual-fund-distributor", "Commission-based: trail commission is roughly 0.5–1% a year of the assets managed — about ₹5–10 lakh a year on ₹10 crore of client assets.", None, None),
  pay("nuclear-scientist-barc", "Scientific Officer (C): Pay Level 10 (basic ₹56,100), about ₹1 lakh+ a month gross after training; a monthly stipend is paid during training.", 1200000, 1400000, G),
  pay("pastry-chef", "About ₹2–4 lakh a year starting; ₹6–12 lakh for pastry chefs in premium hotels.", 200000, 1200000),
  pay("patent-agent", "About ₹4–8 lakh a year at entry in IP firms; ₹12–25 lakh+ with experience.", 400000, 2500000),
  pay("prosthetist-orthotist", "About ₹2.5–5 lakh a year starting; ₹6–10 lakh with experience.", 250000, 1000000),
  pay("research-analyst", "About ₹5–10 lakh a year at entry; ₹15–30 lakh+ for senior analysts.", 500000, 3000000),
  pay("sound-designer", "About ₹2–5 lakh a year starting; experienced designers ₹8–20 lakh a year or per project.", 200000, 2000000),
  pay("stock-broker", "Dealers about ₹3–6 lakh a year; senior dealers/relationship managers ₹8–15 lakh plus incentives.", 300000, 1500000),
  pay("yoga-instructor", "About ₹2–4 lakh a year starting (₹15,000–35,000 a month); senior certified trainers ₹6–12 lakh; private classes ₹500–2,000 a session.", 200000, 1200000),
]

# policy-analyst appears twice above; keep the first
_seen = set()
CAREERS = [r for r in CAREERS if not ((r[0], r[1]) in _seen or _seen.add((r[0], r[1])))]
