-- Official fee notices, batch 2 (read 19 Nov 2026). Same rule as batch 1: "per year" = tuition +
-- recurring academic charges for a general-category student; hostel, mess, one-time fees and
-- refundable deposits are named in the note, not counted.
--
--   IIT Hyderabad https://iith.ac.in/academics/assets/files/fee/2026/jan-jun-2026/Fee_Structure_Jul-Dec2026Semester_15.05-1.pdf
--                 UG newly enrolled July 2026: tuition 1,00,000 + 14,675 + 1,000 welfare a semester; insurance 1,888 a year
--   NIT Rourkela  https://www.nitrkl.ac.in/docs/Announcement/10072026175144558.pdf
--                 B.Tech 2026-27: tuition 62,500 + other 5,000 + activity 2,000 + medical 2,000 a semester
--   NIT Calicut   https://nitc.ac.in/imgserver/uploads/attachments/nit-calicut-fee-structure-for-ug-for-the-ay-2026-27-b-stylecolorrednewb_2337_0.pdf
--                 B.Tech 2026-27 batch: tuition 62,500 a semester; other fees 19,100 (monsoon) + 6,400 (winter)
--   NITK Surathkal https://www.nitk.ac.in/document/attachments/9831/Fees_Structure_removed.pdf (scanned circular, 24.06.2026)
--                 B.Tech: 82,780 + 65,320 day-scholar recurring a year; first year 1,00,850 + 68,140 with one-time fees
--   IIM Indore    https://iimidr.ac.in/programmes/academic-programmes/post-graduate-programme-in-management-pgp/feestructure/
--                 PGP 2026-28 (Indian, via CAT): course fee 12,00,000 a year
--   NLSIU         https://www.nls.ac.in/programme/ba-llb-hons/   UG AY 2026-27: tuition & facilities 3,18,200 + housing 1,32,800
--   NALSAR        https://nalsar.ac.in/wp-content/uploads/2026/05/3-Fee-Structure-B.A-LLB-Hons.pdf
--                 BA LLB 1st year 2026-27: tuition 1,65,000 + academic 15,000 + user charges 67,000 (total 3,17,000)
--   NUJS          https://www.nujs.edu/wp-content/uploads/2026/03/BA-BSc-CLAT-Balance-Fee-Payment.pdf (scanned)
--                 BA LLB: 1,31,700 + 1,30,200 a year (₹13,29,500 over 10 semesters); hostel & mess 35,000 a semester
--   IISc          http://bs-ug.iisc.ac.in/assets/Fee-Structure-Circular-AY-2026-27.pdf
--                 from AY 2026-27: BS (Research) 85,800 a year; B.Tech 2,05,800 a year (excl. deposits)
--   JIPMER        https://jipmer.edu.in/sites/default/files/MBBS%20PROSPECTUS%202026-27.pdf
--                 MBBS: 14,920 at admission, 6,770 each later year; hostel 12,000 a year (double room)

begin;

update public.colleges c set
  annual_fees_min = v.lo, annual_fees_max = v.hi, fee_note = v.note,
  fees_source_url = v.url, fees_verified_at = now()
from (values
  ('iit-hyderabad', 233238, 233238, 'B.Tech per year (July 2026 entry): ₹1,00,000 tuition + ₹15,675 institute charges each semester + ₹1,888 medical insurance; hostel ₹18,000 and mess about ₹14,430 a semester extra; one-time ₹19,000 incl. ₹6,000 refundable deposit. SC/ST/PH pay no tuition',
     'https://iith.ac.in/academics/assets/files/fee/2026/jan-jun-2026/Fee_Structure_Jul-Dec2026Semester_15.05-1.pdf'),
  ('nit-rourkela', 143000, 143000, 'B.Tech per year (2026-27): ₹62,500 tuition + ₹9,000 other charges each semester; hostel seat rent and hall fee ₹10,000 and mess advance ₹30,000 a semester extra; one-time ₹25,000 incl. ₹10,000 caution money. SC/ST/PH pay no tuition',
     'https://www.nitrkl.ac.in/docs/Announcement/10072026175144558.pdf'),
  ('nit-calicut', 150500, 150500, 'B.Tech per year (2026-27 batch, family income above ₹5 lakh): ₹62,500 tuition each semester + ₹25,500 other fees; one-time ₹61,000 incl. ₹20,000 caution deposit; hostel extra. SC/ST/PwD pay no tuition',
     'https://nitc.ac.in/imgserver/uploads/attachments/nit-calicut-fee-structure-for-ug-for-the-ay-2026-27-b-stylecolorrednewb_2337_0.pdf'),
  ('nit-surathkal', 148100, 148100, 'B.Tech per year (2026-27): ₹62,500 tuition each semester + other fees, ₹1,48,100 a year for a day scholar; first year ₹1,68,990 with one-time fees; hostel rent ₹9,260 a semester extra. SC/ST/PwD pay no tuition',
     'https://www.nitk.ac.in/document/attachments/9831/Fees_Structure_removed.pdf'),
  ('iim-indore', 1200000, 1200000, 'per year for the two-year PGP 2026-28 (Indian students via CAT): ₹24,00,000 course fee in all, plus ₹11,800 alumni fee; ₹50,000 refundable caution deposit and ₹54,000 mess deposit extra',
     'https://iimidr.ac.in/programmes/academic-programmes/post-graduate-programme-in-management-pgp/feestructure/'),
  ('nlsiu-bangalore', 318200, 451000, 'BA LLB (Hons.) AY 2026-27: ₹3,18,200 tuition and facilities a year, ₹4,51,000 with housing and meals; one-time ₹13,900 admission fee and ₹23,700 refundable deposit',
     'https://www.nls.ac.in/programme/ba-llb-hons/'),
  ('nalsar-hyderabad', 247000, 247000, 'BA LLB (Hons.) first year 2026-27: ₹1,65,000 tuition + ₹15,000 academic charges + ₹67,000 room, utilities and services; mess advance ₹40,000, one-time ₹10,000 and ₹20,000 refundable deposits make ₹3,17,000. Tuition rises ₹5,000 a year',
     'https://nalsar.ac.in/wp-content/uploads/2026/05/3-Fee-Structure-B.A-LLB-Hons.pdf'),
  ('nujs-kolkata', 261900, 261900, 'BA LLB (Hons.) per year: ₹80,000 tuition and ₹50,200 other fees each semester + ₹1,500 insurance a year — ₹13,29,500 over five years; hostel and food ₹35,000 a semester extra; first semester adds ₹20,000 admission fee and deposit',
     'https://www.nujs.edu/wp-content/uploads/2026/03/BA-BSc-CLAT-Balance-Fee-Payment.pdf'),
  ('iisc-bangalore', 85800, 205800, 'per year from AY 2026-27: BS (Research) ₹85,800 (₹80,000 tuition); B.Tech ₹2,05,800 (₹2,00,000 tuition); refundable deposits extra in the first year. SC/ST/PwD pay no tuition',
     'http://bs-ug.iisc.ac.in/assets/Fee-Structure-Circular-AY-2026-27.pdf'),
  ('jipmer-puducherry', 6770, 6770, 'MBBS per year after the first: ₹6,770 (₹1,200 tuition); ₹14,920 at admission incl. ₹5,000 admission fee and ₹3,000 caution deposit; hostel ₹12,000 a year (double room) plus ₹6,000 establishment charge',
     'https://jipmer.edu.in/sites/default/files/MBBS%20PROSPECTUS%202026-27.pdf')
) as v(slug, lo, hi, note, url)
where c.slug = v.slug;

-- B.Tech / BA LLB / MBBS / PGP rows at these institutes
update public.college_courses k set
  annual_fees_min = c.annual_fees_min, annual_fees_max = c.annual_fees_max,
  fee_note = 'Per year, from the official fee notice; hostel and mess extra',
  source_url = c.fees_source_url, verified_at = now()
from public.colleges c
where c.id = k.college_id and (
     (c.slug in ('iit-hyderabad','nit-rourkela','nit-calicut','nit-surathkal') and k.course_name ilike 'B.Tech%')
  or (c.slug in ('nlsiu-bangalore','nalsar-hyderabad') and k.course_name ~* '^b\.?a\.?,? ?ll\.?b')
  or (c.slug = 'nujs-kolkata' and k.course_name in ('B.A. LL.B. (Hons.)', 'BA.LL.B.'))
  or (c.slug = 'jipmer-puducherry' and k.course_name = 'MBBS'));

update public.college_courses k set
  annual_fees_min = 1200000, annual_fees_max = 1200000, total_fees = 2400000, duration_years = 2,
  fee_note = '₹12,00,000 a year for PGP 2026-28 (Indian students); alumni fee and deposits extra',
  source_url = 'https://iimidr.ac.in/programmes/academic-programmes/post-graduate-programme-in-management-pgp/feestructure/', verified_at = now()
from public.colleges c
where c.id = k.college_id and c.slug = 'iim-indore' and k.course_name = 'Post Graduate Programme in Management (PGP)';

update public.college_courses k set
  annual_fees_min = 205800, annual_fees_max = 205800,
  fee_note = '₹2,00,000 tuition + ₹5,800 other fees a year from AY 2026-27; deposits extra',
  source_url = 'http://bs-ug.iisc.ac.in/assets/Fee-Structure-Circular-AY-2026-27.pdf', verified_at = now()
from public.colleges c
where c.id = k.college_id and c.slug = 'iisc-bangalore' and k.course_name = 'B.Tech Mathematics and Computing';

commit;
