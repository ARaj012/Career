-- Official fee notices, batch 3 (read 19 Nov 2026). Same rule as batches 1-2.
--
--   BITS Pilani   https://admissions.bits-pilani.ac.in/FD/FD_fee.html
--                 First Degree AY 2026-27: tuition 2,91,500 a semester (Pilani, Goa, Hyderabad); admission 64,100
--   VIT Vellore   https://vit.ac.in/admission/ug/fee-structure   B.Tech 2026-27 tuition a year by scholarship category:
--                 Group A 1,73,000-3,95,000; Group B 1,95,000-4,90,000; Group C 2,07,000-4,29,000 (Category 0 = nil)
--   NIT Warangal  https://nitw.ac.in/api/static/files/ug_2026_2026-7-18-22-10-35.pdf
--                 B.Tech 2026: tuition 62,500 a semester; other fee 12,500 a year (+30,000 one-time in year 1);
--                 hostel 31,000 + mess advance 15,000 in the odd semester
--   IIT Indore    https://academic.iiti.ac.in/fee/fee/2026/UGFees2026.pdf (13 Jul 2026)
--                 tuition 1,00,000 + 6,300 a semester + 1,600 insurance a year; accommodation 16,000 a semester
--   IIT (ISM)     https://www.iitism.ac.in/storage/files/fee-details-ug-admission-2026.pdf
--                 tuition 1,00,000 a semester; first-semester total 1,65,900 (other fees 41,400, mess 19,500, JoSAA 5,000).
--                 The detailed sheet is an image the reader cannot decode, so only tuition is counted per year.
--   IIM Raipur    https://iimraipur.ac.in/fee-structure_mba/   PGP 2026-28 academic fees 9,41,000 (yr 1) + 9,00,000 (yr 2)
--   IIM Trichy    https://www.iimtrichy.ac.in/en/fees_pgpm-hr   PGPM & PGPM-HR 2026-28: ₹19.5 lakh (excl. caution, mess)
--   IIM Ranchi    https://iimranchi.ac.in/media/2026/04/Fee-Structure-and-Withdrawal-Policy.pdf (scanned, 28.04.2026)
--                 MBA/MBA-HRM/MBA-BA 2026-28: 19,20,000 (term I 3,45,000 incl. deposit and alumni fee; 3,15,000 after)
--   IIM Rohtak    https://www.iimrohtak.ac.in/panel/assets/images/programme-fee/17670761259967.pdf
--                 PGP 2026-28: 8,95,000 a year + placement facility 40,000 + development 10,000 a year; mess 48,000 a year
--   IIM Udaipur   https://mba.iimu.ac.in/mba-2026-28-batch-fee-structure-regular-and-international/
--                 MBA 2026-28 tuition: 1,00,000 + 2,60,700 + 3,30,000 + 3,30,000 (yr 1) and 3 x 3,00,000 (yr 2)

begin;

update public.colleges c set
  annual_fees_min = v.lo, annual_fees_max = v.hi, fee_note = v.note,
  fees_source_url = v.url, fees_verified_at = now()
from (values
  ('bits-pilani', 583000, 583000, 'B.E./M.Sc./B.Pharm. per year (2026-27 admits): ₹2,91,500 tuition each semester, rising 5% a year; one-time admission fee ₹64,100; hostel ₹36,000 and mess/other advances ₹22,000 a semester extra',
     'https://admissions.bits-pilani.ac.in/FD/FD_fee.html'),
  ('vit-vellore', 173000, 490000, 'B.Tech tuition per year (2026-27) depends on the branch group and the scholarship category your VITEEE rank earns: ₹1,73,000-₹3,95,000 (Group A), ₹1,95,000-₹4,90,000 (Group B), ₹2,07,000-₹4,29,000 (Group C); Category 0 pays no tuition; ₹5,000 refundable caution deposit; hostel extra',
     'https://vit.ac.in/admission/ug/fee-structure'),
  ('nit-warangal', 137500, 137500, 'B.Tech per year (2026 batch): ₹62,500 tuition each semester + ₹12,500 other fee; first year adds ₹30,000 one-time; hostel ₹31,000 and mess advance ₹15,000 in the odd semester. SC/ST/PwD pay no tuition',
     'https://nitw.ac.in/api/static/files/ug_2026_2026-7-18-22-10-35.pdf'),
  ('iit-indore', 214200, 214200, 'B.Tech/B.S. per year (2026 entry): ₹1,00,000 tuition + ₹6,300 institute charges each semester + ₹1,600 insurance; accommodation ₹16,000 and dining about ₹17,000 a semester extra; one-time ₹8,100 + ₹10,000 deposit. SC/ST/PwD pay no tuition',
     'https://academic.iiti.ac.in/fee/fee/2026/UGFees2026.pdf'),
  ('iit-dhanbad', 200000, 200000, 'B.Tech tuition per year (2026 admission): ₹1,00,000 each semester; the first semester totals ₹1,65,900 with ₹41,400 other fees, ₹19,500 mess and ₹5,000 JoSAA charge. SC/ST/PwD pay no tuition',
     'https://www.iitism.ac.in/storage/files/fee-details-ug-admission-2026.pdf'),
  ('iim-raipur', 900000, 941000, 'PGP 2026-28 academic fees: ₹9,41,000 in year 1 and ₹9,00,000 in year 2; lodging ₹70,500 a year, mess ₹16,620 a term, insurance ₹1,500 a year and ₹30,000 caution deposit extra',
     'https://iimraipur.ac.in/fee-structure_mba/'),
  ('iim-trichy', 975000, 975000, 'per year for PGPM / PGPM-HR 2026-28: ₹19,50,000 in all (₹1,00,000 acceptance + ₹2,25,000 in term I, ₹3,25,000 each later term); mess ₹24,000 a term and ₹30,000 caution deposit extra',
     'https://www.iimtrichy.ac.in/en/fees_pgpm-hr'),
  ('iim-ranchi', 945000, 975000, 'MBA / MBA-HRM / MBA-BA 2026-28: ₹19,20,000 in all — ₹9,75,000 in year 1 (incl. ₹20,000 caution deposit and ₹10,000 alumni fee) and ₹9,45,000 in year 2; mess ₹27,000 a term plus GST extra',
     'https://iimranchi.ac.in/media/2026/04/Fee-Structure-and-Withdrawal-Policy.pdf'),
  ('iim-rohtak', 945000, 945000, 'PGP 2026-28 per year: ₹8,95,000 programme fee + ₹40,000 placement facility + ₹10,000 development charge; mess ₹48,000 a year; first year adds ₹6,500 alumni fee and ₹10,000 caution money',
     'https://www.iimrohtak.ac.in/panel/assets/images/programme-fee/17670761259967.pdf'),
  ('iim-udaipur', 900000, 1020700, 'MBA 2026-28 tuition: ₹10,20,700 in year 1 (incl. ₹1,00,000 paid on accepting the offer) and ₹9,00,000 in year 2; hostel about ₹25,000 and mess ₹24,000-28,000 a term extra; ₹20,000 caution deposit and ₹5,000 alumni fee',
     'https://mba.iimu.ac.in/mba-2026-28-batch-fee-structure-regular-and-international/')
) as v(slug, lo, hi, note, url)
where c.slug = v.slug;

update public.college_courses k set
  annual_fees_min = c.annual_fees_min, annual_fees_max = c.annual_fees_max,
  fee_note = 'Per year, from the official fee notice; hostel and mess extra',
  source_url = c.fees_source_url, verified_at = now()
from public.colleges c
where c.id = k.college_id and (
     (c.slug in ('nit-warangal','iit-indore') and k.course_name ilike 'B.Tech%')
  or (c.slug = 'iit-dhanbad' and k.course_name = 'B.Tech')
  or (c.slug = 'iim-raipur' and k.course_name = 'Post Graduate Programme in Management (PGP)')
  or (c.slug = 'iim-trichy' and k.course_name in ('Post Graduate Programme in Management (MBA)', 'Post Graduate Programme in Management (PGPM)', 'Post-Graduate Programme in Management Human Resources (MBA-HR)', 'Post Graduate Programme in Management - Human Resource Management (PGPM-HR)'))
  or (c.slug = 'iim-ranchi' and k.course_name in ('Master of Business Administration (MBA)', 'MBA-BA', 'MBA-HRM'))
  or (c.slug = 'iim-rohtak' and k.course_name in ('Master of Business Administration', 'Post Graduate Programme in Management (PGP)'))
  or (c.slug = 'iim-udaipur' and k.course_name = 'Master of Business Administration (MBA)'));

commit;
