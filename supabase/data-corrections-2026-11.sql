-- Data corrections, November 2026 (already applied to the live project)

-- 1. Old unverified placement rows typed in lakhs ("8" for 8 LPA) were shown as "₹8".
--    Packages are stored in rupees per year everywhere else.
update public.college_placements set average_package = average_package * 100000
  where source_type = 'unverified' and average_package > 0 and average_package < 1000;
update public.college_placements set median_package = median_package * 100000
  where source_type = 'unverified' and median_package > 0 and median_package < 1000;
update public.college_placements set highest_package = highest_package * 100000
  where source_type = 'unverified' and highest_package > 0 and highest_package < 1000;

-- 2. Gauhati University's placement page gives one "Package" per department and year,
--    not a highest package; keep the official placed counts, drop the mislabelled figure.
update public.college_placements p set highest_package = null
  from public.colleges c
  where c.id = p.college_id and c.name = 'Gauhati University' and p.source_type = 'official_report';

-- 3. Hand-typed course-total figures that were stored as yearly fees.
update public.college_courses cc set total_fees = cc.annual_fees_min, annual_fees_min = null, annual_fees_max = null
  from public.colleges c
  where c.id = cc.college_id and c.name = 'Sri Ramachandra Institute of Higher Education'
    and cc.course_name = 'MBBS' and cc.source_type = 'unverified' and cc.annual_fees_min = 15000000;
update public.colleges set annual_fees_max = null
  where name = 'OP Jindal Global University' and annual_fees_max = 7750000 and fees_verified_at is null;

-- 4. IBPS is an exam body: ₹850 is its exam application fee, not a yearly fee.
update public.colleges set annual_fees_min = null, annual_fees_max = null
  where name = 'Institute of Banking Personnel Selection' and annual_fees_min = 850 and fees_verified_at is null;
