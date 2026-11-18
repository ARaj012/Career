-- IIM Kozhikode: fees, placements and accreditation from the institute's own documents (read 18 Nov 2026)
--   Fee structure 2026-28 (PGP, PGP-Finance, PGP-LSM):
--     https://iimk.ac.in/uploads/programsmenu/PGP%20Fee%20Structure%202026-28_20260507095700.pdf
--     Each year ₹11,75,000 (tuition 7,00,000; library 95,000; hostel 45,000; IT/infrastructure 1,20,000;
--     books 1,15,000; others) = ₹23,50,000 for two years; plus a refundable ₹25,000 caution deposit,
--     ₹2,000 students' welfare fund, and ₹40,000 mess/activities deposit each term (refunded on actuals).
--   Final Placements Reports 2023, 2024, 2025: https://www.iimk.ac.in/final-placements
--   Accreditation: https://www.iimk.ac.in/accreditation-and-ranking (AMBA since 2010, EQUIS since 2021)
-- The site previously showed ₹17.5-18 lakh (no source) and a NAAC "A+" that IIMK does not publish.

begin;

update public.colleges set
  annual_fees_min = 1175000,
  annual_fees_max = 1175000,
  fee_note = 'per year for PGP, PGP-Finance and PGP-LSM (2026-28): ₹23.5 lakh for the two years, plus a refundable ₹25,000 caution deposit and ₹40,000 mess deposit each term',
  fees_source_url = 'https://iimk.ac.in/uploads/programsmenu/PGP%20Fee%20Structure%202026-28_20260507095700.pdf',
  fees_verified_at = now(),
  naac_grade = null,
  about = 'Established in 1996, IIM Kozhikode is an Institute of National Importance in Kerala, ranked 3rd in NIRF Management for the third year running (2025). Its MBA programmes are accredited by AMBA and EQUIS. In the 2025 final placements the highest CTC was ₹81 LPA, with a ₹28.18 LPA mean and ₹27.50 LPA median across 561 students.',
  why_join = 'Choose IIM Kozhikode for its NIRF top-3 ranking, AMBA and EQUIS accreditation and strong outcomes — the 2025 final placements drew 169 recruiters, with a ₹81 LPA highest CTC, ₹28.18 LPA mean and ₹27.50 LPA median across 561 students.',
  best_known_for = array['₹81 LPA highest CTC, ₹28.18 LPA mean (Final Placements 2025)', '169 recruiters for 561 students in 2025, including 57 new recruiters', 'AMBA and EQUIS accredited ("double crown")', 'NIRF Management rank 3 for three consecutive years']
where slug = 'iim-kozhikode';

-- Programme fees
update public.college_courses k set
  annual_fees_min = 1175000, annual_fees_max = 1175000, total_fees = 2350000, duration_years = 2,
  fee_note = '₹11,75,000 a year (2026-28), ₹23,50,000 in all; refundable caution and mess deposits extra',
  source_url = 'https://iimk.ac.in/uploads/programsmenu/PGP%20Fee%20Structure%202026-28_20260507095700.pdf',
  verified_at = now()
from public.colleges c
where c.id = k.college_id and c.slug = 'iim-kozhikode' and k.source_type = 'official'
  and k.course_name in ('Post Graduate Programme (PGP)', 'Post Graduate Programme in Finance (PGP -Finance)', 'Post Graduate Programme in Liberal Studies & Management (PGP LSM)');

-- Unverified copy of the PGP row (the official "Post Graduate Programme (PGP)" row stays)
delete from public.college_courses k using public.colleges c
where c.id = k.college_id and c.slug = 'iim-kozhikode' and k.source_type = 'unverified'
  and k.course_name = 'Post Graduate Programme in Management (PGP)';

-- Final placements 2023-2025 from IIMK's reports (students = those who took part)
insert into public.college_placements (college_id, year, program_level, source_type, highest_package, average_package, median_package,
                                       total_eligible_students, students_placed, placement_rate, source_url, notes)
select c.id, v.yr, 'Course: PGP, PGP-Finance, PGP-LSM (final placements)', 'official_report', v.hi, v.mean, v.med, v.n, v.placed, v.rate, v.url, v.note
from public.colleges c, (values
  (2025, 8100000, 2818000, 2750000, 561, null::int, null::numeric, 'https://iimk.ac.in/uploads/userfiles/Final-Placements-Report-2025.pdf', 'IIM Kozhikode Final Placements Report 2025 (batch 2023-25): 169 recruiters, 57 new; 13 international offers. "Sought jobs" = students who took part.'),
  (2024, 7202000, 2805000, 2700000, 537, null, null, 'https://iimk.ac.in/uploads/userfiles/IIMK_Final_Placements_2024%20Report.pdf', 'IIM Kozhikode Final Placements Report 2024 (batch 2022-24): 156 recruiters. "Sought jobs" = students who took part.'),
  (2023, 6702000, 3102000, 2700000, 556, 556, 100, 'https://iimk.ac.in/uploads/userfiles/Final%20Placements%20Report%202023-2-1.pdf', 'IIM Kozhikode Final Placements Report 2023 (batch 2021-23): 100% placement, 559 offers from 123 recruiters.')
) as v(yr, hi, mean, med, n, placed, rate, url, note)
where c.slug = 'iim-kozhikode'
on conflict (college_id, year, program_level, source_type) do update set
  highest_package = excluded.highest_package, average_package = excluded.average_package, median_package = excluded.median_package,
  total_eligible_students = excluded.total_eligible_students, students_placed = excluded.students_placed,
  placement_rate = excluded.placement_rate, source_url = excluded.source_url, notes = excluded.notes;

-- The coaching-site rows these replace
delete from public.college_placements p using public.colleges c
where c.id = p.college_id and c.slug = 'iim-kozhikode' and p.source_type = 'unverified' and p.year in (2023, 2024, 2025);

commit;
