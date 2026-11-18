-- Official fee notices, read 18-19 Nov 2026, for colleges whose fee banner had no source.
-- "Per year" = tuition + the institute's recurring semester/term charges for a general-category
-- student; hostel, mess, one-time admission fees and refundable deposits are left out and named
-- in the note. Every IIT exempts SC/ST/PwD students from tuition and remits it fully below ₹1 lakh
-- family income (2/3 between ₹1-5 lakh).
--
--   IIT Bombay   https://acad.iitb.ac.in/sites/default/files/New_Entrants_fee_structure_2026.pdf
--                tuition 1,00,000 + other 8,150 = 1,08,150 per semester (Autumn 2026-27)
--   IIT Madras   https://fees.iitm.ac.in/assets/circular/fees_structure_2026_admission_ug_pg.pdf
--                tuition 1,00,000 + 5,500 per semester + 2,402 insurance a year; seat rent 7,500/sem extra
--   IIT Delhi    https://academics.iitd.ac.in/wp-content/uploads/2026/07/UG-26_compressed.pdf
--                tuition 1,00,000 + other 6,250 per semester; hostel seat rent 8,600
--   IIT Kanpur   https://www.iitk.ac.in/dosa/data/Fee-Structure-for-New-UG-for-2026-2027-1st-07-07-26.pdf (scanned)
--                tuition 1,00,000 + semester fee 13,855 (incl. seat rent, hall charges); MEC 13,360
--   IIT Kharagpur https://inductionprogram.iitkgp.ac.in/docs/UG_Guidelines2026.pdf (marked tentative)
--                tuition 1,00,000 + academic charges 4,300 per semester; first-semester total 1,61,481 with hostel & mess
--   IIT Roorkee  https://iitr.ac.in/Academics/static/Institute_Fee/2026-27/UGIst.pdf
--                tuition 1,00,000 per semester + semester charges 11,300 (Autumn) and 9,800 (Spring)
--   NIT Trichy   https://www.nitt.edu/home/academics/fees_section/ug_courses_fee_structure/B.Tech%202026.pdf
--                tuition 62,500 per semester + annual fee 27,750 (year 1); one-time 35,300
--   IIM Bangalore https://www.iimb.ac.in/programmes/pgp/financial-aid-scholarships
--                PGP 2026-28 (domestic) ₹26,00,000 for 2 years + ₹30,000 caution deposit
--   IIM Lucknow  https://www.iiml.ac.in/sites/default/files/2026-05/Fee%20Structure_2026-28.pdf (scanned)
--                PGP 2026-28: year 1 ₹10,75,000, year 2 ₹9,75,000 (+ ₹20,000 deposits, ₹5,000 alumni; mess at actuals)

begin;

update public.colleges c set
  annual_fees_min = v.lo, annual_fees_max = v.hi, fee_note = v.note,
  fees_source_url = v.url, fees_verified_at = now()
from (values
  ('iit-bombay', 216300, 216300, 'B.Tech/B.S./B.Des. per year (2026 entry): ₹1,00,000 tuition + ₹8,150 institute charges each semester; one-time ₹16,000 + ₹10,000 refundable deposits; hostel and mess extra. SC/ST/PwD pay no tuition; income-based remission for others',
     'https://acad.iitb.ac.in/sites/default/files/New_Entrants_fee_structure_2026.pdf'),
  ('iit-madras', 213402, 213402, 'B.Tech/B.S. per year (2026 entry): ₹1,00,000 tuition + ₹5,500 institute charges each semester + ₹2,402 medical insurance; seat rent ₹7,500 a semester and mess extra; one-time ₹21,000 + ₹5,000 caution deposit. SC/ST/PwD pay no tuition',
     'https://fees.iitm.ac.in/assets/circular/fees_structure_2026_admission_ug_pg.pdf'),
  ('iit-delhi', 212500, 212500, 'B.Tech/Dual Degree per year (2026 entry): ₹1,00,000 tuition + ₹6,250 other charges each semester; hostel seat rent ₹8,600 and mess extra; one-time ₹8,150 + ₹8,000 refundable deposits. SC/ST/PwD pay no tuition',
     'https://academics.iitd.ac.in/wp-content/uploads/2026/07/UG-26_compressed.pdf'),
  ('iit-kanpur', 227710, 227710, 'B.Tech/B.S. per year (2026 batch, hosteller): ₹1,00,000 tuition + ₹13,855 semester fee (includes seat rent and hall charges) each semester; mess establishment ₹13,360, one-time ₹5,200 + ₹26,000 refundable deposits. SC/ST/PwD pay no tuition',
     'https://www.iitk.ac.in/dosa/data/Fee-Structure-for-New-UG-for-2026-2027-1st-07-07-26.pdf'),
  ('iit-kharagpur', 208600, 208600, 'B.Tech/B.Arch per year (2026 entry, tentative): ₹1,00,000 tuition + ₹4,300 academic charges each semester; hall, hostel and mess charges extra (first-semester total with hostel and mess ₹1,61,481). SC/ST/PwD pay no tuition',
     'https://inductionprogram.iitkgp.ac.in/docs/UG_Guidelines2026.pdf'),
  ('iit-roorkee', 221100, 221100, 'B.Tech/B.Arch first year 2026-27: ₹1,00,000 tuition each semester + semester charges ₹11,300 (Autumn) and ₹9,800 (Spring); hostel ₹7,500 a semester and mess extra; one-time ₹6,000 + ₹3,000 deposits. SC/ST/PwD pay no tuition',
     'https://iitr.ac.in/Academics/static/Institute_Fee/2026-27/UGIst.pdf'),
  ('nit-trichy', 152750, 152750, 'B.Tech first year (2026 batch, open category): ₹62,500 tuition each semester + ₹27,750 annual fee; one-time ₹35,300 (incl. refundable deposits); hostel and mess extra. SC/ST/PwD pay no tuition',
     'https://www.nitt.edu/home/academics/fees_section/ug_courses_fee_structure/B.Tech%202026.pdf'),
  ('iim-bangalore', 1300000, 1300000, 'per year for the two-year PGP (MBA) 2026-28, domestic: ₹26,00,000 in all, covering tuition, course material, hostel room rent and insurance; ₹30,000 caution deposit extra',
     'https://www.iimb.ac.in/programmes/pgp/financial-aid-scholarships'),
  ('iim-lucknow', 975000, 1075000, 'PGP 2026-28: ₹10,75,000 in year 1 (incl. ₹1,00,000 admission fee) and ₹9,75,000 in year 2 — ₹20,50,000 in all; ₹20,000 refundable deposits and ₹5,000 alumni fee extra, mess at actuals',
     'https://www.iiml.ac.in/sites/default/files/2026-05/Fee%20Structure_2026-28.pdf')
) as v(slug, lo, hi, note, url)
where c.slug = v.slug;

-- B.Tech rows at these institutes carried a guessed ₹1.8 lakh; same official fee as above
update public.college_courses k set
  annual_fees_min = c.annual_fees_min, annual_fees_max = c.annual_fees_max,
  fee_note = 'Institute fee per year (2026 entry), from the official fee notice; hostel and mess extra',
  source_url = c.fees_source_url, verified_at = now()
from public.colleges c
where c.id = k.college_id
  and c.slug in ('iit-bombay','iit-madras','iit-delhi','iit-kanpur','iit-kharagpur','iit-roorkee','nit-trichy')
  and (k.course_name ilike 'B.Tech%' or k.course_name ilike '%Bachelor of Technology%');

-- IIM Bangalore PGP
update public.college_courses k set
  annual_fees_min = 1300000, annual_fees_max = 1300000, total_fees = 2600000, duration_years = 2,
  fee_note = '₹26,00,000 for 2026-28 (domestic); ₹30,000 caution deposit extra',
  source_url = 'https://www.iimb.ac.in/programmes/pgp/financial-aid-scholarships', verified_at = now()
from public.colleges c
where c.id = k.college_id and c.slug = 'iim-bangalore'
  and k.course_name in ('Master of Business Administration (MBA), Two-year fulltime programme (PGP)', 'MBA (PGP)');

-- IIM Lucknow PGP
update public.college_courses k set
  annual_fees_min = 975000, annual_fees_max = 1075000, total_fees = 2050000, duration_years = 2,
  fee_note = '₹10,75,000 in year 1, ₹9,75,000 in year 2 (2026-28); deposits and mess extra',
  source_url = 'https://www.iiml.ac.in/sites/default/files/2026-05/Fee%20Structure_2026-28.pdf', verified_at = now()
from public.colleges c
where c.id = k.college_id and c.slug = 'iim-lucknow'
  and k.course_name = 'Post Graduate Programme in Management (PGP)';

commit;
