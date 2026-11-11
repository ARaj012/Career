# Expected application windows for scholarships whose providers have not published a dated
# deadline we could read. Labelled on the site; shown only where no official deadline is stored.
# Matched by scholarship name.

NSP_SRC = ("Careers360", "https://school.careers360.com/articles/nsp-scholarship-last-date-2026-27")
NSP = "2026-27 cycle: the National Scholarship Portal opened around 1 June 2026 and the last date for most schemes was about 31 October 2026 (dates are often extended into November–December; check scholarships.gov.in).\nNext cycle: expected to open around June 2027."
NSP_DEC = "2026-27 cycle: open on the National Scholarship Portal from around June 2026, with the last date expected around mid-December 2026 (check scholarships.gov.in).\nNext cycle: expected to open around June 2027."
STATE = "Based on when this state's scholarship portal usually opens and closes in recent years; the department announces exact dates each year."

def nsp(name, text=NSP):
    return (name, "deadline", "secondary", text, "Based on the National Scholarship Portal's 2026-27 schedule as reported by education news sites.", *NSP_SRC)

def state(name, window):
    return (name, "deadline", "estimate", window, STATE)

SCHOLARSHIPS = [
  # ---- Central schemes on the National Scholarship Portal ----
  nsp("AICTE Pragati Scholarship for Girls"),
  nsp("AICTE Saksham Scholarship for Specially-Abled Students"),
  nsp("AICTE Swanath Scholarship Scheme"),
  nsp("Central Sector Scheme of Scholarship (CSSS)"),
  nsp("Central Sector Scheme of Scholarship for College and University Students"),
  nsp("Ishan Uday Scholarship Scheme", NSP_DEC),
  nsp("PG Indira Gandhi Scholarship for Single Girl Child", NSP_DEC),
  nsp("PG Scholarship Scheme for SC/ST Students in Professional Courses", NSP_DEC),
  nsp("Merit-cum-Means Scholarship for Minorities"),
  nsp("PM Scholarship Scheme for CAPF/Assam Rifles Wards"),
  nsp("PM YASASVI (Young Achievers Scholarship Award Scheme for Vibrant India)"),
  nsp("Top Class Education Scheme for SC Students"),
  nsp("Top Class Education Scheme for Students with Disabilities"),
  nsp("Post Matric Scholarship for OBC Students", NSP + "\nMany states take these applications on their own portals instead."),
  nsp("Post Matric Scholarship for SC Students", NSP + "\nMany states take these applications on their own portals instead."),
  nsp("Post Matric Scholarship for ST Students", NSP + "\nMany states take these applications on their own portals instead."),
  nsp("Post-Matric Scholarship for Andaman & Nicobar Students (NSP)"),
  nsp("Post-Matric Scholarship for Arunachal Pradesh Students (NSP)"),
  nsp("Post-Matric Scholarship for Chandigarh Students (NSP)"),
  nsp("Post-Matric Scholarship for Dadra & Nagar Haveli and Daman & Diu Students (NSP)"),
  nsp("Post-Matric Scholarship for Ladakh Students (NSP)"),
  nsp("Post-Matric Scholarship for Lakshadweep Students (NSP)"),
  nsp("Post-Matric Scholarship for Manipur Students (NSP)"),
  nsp("Post-Matric Scholarship for Meghalaya Students (NSP)"),
  nsp("Post-Matric Scholarship for Sikkim Students (NSP)"),
  nsp("Post-Matric Scholarship for Tripura Students (NSP)"),
  nsp("J&K Post-Matric Scholarship Scheme"),

  ("Begum Hazrat Mahal National Scholarship", "deadline", "discontinued",
   "No longer a separate scheme: the Ministry of Minority Affairs told Parliament it was merged into the Pre-Matric and Post-Matric Scholarship Schemes for Minorities from 2022-23. Girls from minority communities should apply under those schemes on the National Scholarship Portal.",
   None, "Rajya Sabha (Ministry of Minority Affairs reply)", "https://rsdebate.nic.in/bitstream/123456789/752723/1/PQ_266_16122024_U2350_p516_p516.pdf"),

  # ---- Other central schemes with their own process ----
  ("National Fellowship for Persons with Disabilities", "deadline", "estimate", "No separate application: since 2022 the fellowship is awarded through UGC-NET (JRF) results for candidates with disabilities. Apply for UGC-NET in its June or December session.", "Based on how UGC now awards this fellowship."),
  ("National Overseas Scholarship (NOS) for SC/ST/DNT Students", "deadline", "estimate", "Applications usually open around February–April each year on the NOS portal (nosmsje.gov.in), for courses starting that academic year.", "Based on the scheme's application windows in recent years."),
  ("PM-Vidyalaxmi (Central Sector Interest Subsidy)", "deadline", "estimate", "No fixed deadline: apply on the PM-Vidyalaxmi portal when you take an education loan from a participating bank (usually around admission time, June–September).", "Based on how the scheme works."),
  ("Prime Minister's Research Fellowship (PMRF)", "deadline", "estimate", "Two entry cycles a year (May and December). Applications are usually invited about 2–3 months before each cycle — roughly February–March and August–September — through the PMRF portal or your institute.", "Based on PMRF's application cycles in recent years."),
  ("Khelo India Athlete Scholarship", "deadline", "estimate", "No application: athletes are selected for the Khelo India scheme by the Sports Authority of India based on performance at Khelo India Games and national events.", "Based on how the scheme selects athletes."),
  ("Scholarship to Young Artistes in Different Cultural Fields", "deadline", "estimate", "Applications are usually invited once a year, around June–August, through CCRT (ccrtindia.gov.in).", "Based on the scheme's advertisements in recent years."),
  ("Bihar Student Credit Card Scheme", "deadline", "estimate", "No fixed deadline: apply any time through the 7 Nishchay / MNSSBY portal and the District Registration & Counselling Centre once you have admission.", "Based on how the scheme works."),

  # ---- State portals ----
  state("Aikyashree Scholarship (West Bengal)", "Post-matric applications usually open around July–August and close around October–November on the WBMDFC portal."),
  state("Andhra Pradesh Jnanabhumi Post-Matric Scholarship", "Students usually register through their college around August–December; fees are reimbursed under Jagananna Vidya Deevena / the state's current scheme."),
  state("Assam DHE Post-Matric Scholarship", "Applications usually open around October and close around December on the state scholarship portal."),
  state("Chhattisgarh Post-Matric Scholarship", "Applications usually open around August and close around November on the state post-matric portal."),
  state("Delhi Post-Matric Scholarship (e-District Portal)", "Applications usually open around August–September and close around December on the e-District portal."),
  state("Digital Gujarat Post-Matric Scholarship", "Applications usually open around August–September and close around December on Digital Gujarat."),
  state("Goa Post-Matric Scholarship", "Applications usually open around September and close around December."),
  state("Haryana Har-Chhatravratti Scholarship", "Applications usually open around September–October and close around January on the Har-Chhatravratti portal."),
  state("HP ePASS Scholarship", "Applications usually open around October and close around January on HP ePASS."),
  state("Jharkhand e-Kalyan Post-Matric Scholarship", "Applications usually open around September and close around December on e-Kalyan."),
  state("Karnataka SSP Post-Matric Scholarship", "Applications usually open around August–September and close around December–January on the SSP portal."),
  state("Kerala e-Grantz Post-Matric Scholarship", "Students usually apply through their institution on e-Grantz around September–December."),
  state("MahaDBT Post-Matric Scholarship (Maharashtra)", "Applications usually open around July–August on MahaDBT and close around December–March (often extended)."),
  state("Mizoram Scholarship Board Portal", "Applications usually open around June–July and close around August–September on the Mizoram Scholarship Board portal."),
  state("MP Post-Matric Scholarship (Scholarship Portal 2.0)", "Applications usually open around August–September and close around January–February on Scholarship Portal 2.0."),
  state("Nagaland Common Scholarship Portal", "Applications usually open around July and close around October."),
  state("Odisha State Scholarship (e-Medhabruti & Post-Matric)", "Applications usually open around September and close around January on the State Scholarship Portal."),
  state("Puducherry Post-Matric Scholarship", "Applications usually open around September and close around December."),
  state("Punjab Post-Matric Scholarship", "Applications usually open around September and close around January on the Punjab scholarship portal."),
  state("Rajasthan Post-Matric Scholarship (SJE Portal)", "Applications usually open around September–October and close around January on the SJE/SSO portal."),
  state("Tamil Nadu Adi Dravidar & Tribal Welfare Post-Matric Scholarship", "Students usually apply through their institution around August–December."),
  state("Telangana ePASS Post-Matric Scholarship", "Applications usually open around July–August and close around December on Telangana ePASS (often extended)."),
  state("UP Scholarship (Saksham Portal)", "Applications usually open around July and close around October–November, with institution verification after that."),
  state("Uttarakhand Higher Education Scholarship Portal", "Applications usually open around September and close around January."),
]
