-- Career completeness, part 1: ratings, skills and exam links (19 Nov 2026).
-- Ratings use the existing scales: growth/competition Low|Medium|High|Very High,
-- work_life_balance 1-5, demand_score 1-10. They are editorial judgements, like the
-- ratings already on the other 157 careers.

begin;

-- ── Ratings for the 30 careers that had none ──────────────────────────────────
update public.careers c set growth_level = v.g, competition_level = v.comp, work_life_balance = v.wlb, demand_score = v.d
from (values
  ('air-force-agniveer',         'Medium',    'Very High', 3, 7.5),
  ('navy-agniveer',              'Medium',    'Very High', 3, 7.5),
  ('coast-guard-navik',          'Medium',    'High',      3, 7.0),
  ('cisf-constable',             'Medium',    'Very High', 3, 7.5),
  ('crpf-constable',             'Medium',    'Very High', 2, 7.5),
  ('footwear-designer',          'High',      'Medium',    4, 7.0),
  ('kvs-teacher',                'Medium',    'Very High', 4, 7.5),
  ('commercial-pilot',           'Very High', 'High',      2, 8.5),
  ('merchant-navy-officer',      'High',      'High',      2, 8.0),
  ('bank-it-officer',            'High',      'High',      4, 7.5),
  ('cost-management-accountant', 'High',      'High',      3, 7.8),
  ('investment-adviser',         'High',      'Medium',    4, 7.5),
  ('lic-aao',                    'Medium',    'Very High', 4, 7.0),
  ('mutual-fund-distributor',    'High',      'Low',       4, 7.0),
  ('research-analyst',           'High',      'High',      3, 7.8),
  ('stock-broker',               'Medium',    'High',      2, 7.0),
  ('loco-pilot',                 'Medium',    'Very High', 2, 7.0),
  ('patent-agent',               'High',      'Medium',    4, 7.5),
  ('chef',                       'High',      'High',      2, 7.8),
  ('pastry-chef',                'High',      'Medium',    3, 7.5),
  ('cinematographer',            'High',      'High',      2, 7.0),
  ('film-editor',                'High',      'Medium',    3, 7.5),
  ('sound-designer',             'High',      'Medium',    3, 7.0),
  ('audiologist',                'High',      'Low',       4, 7.5),
  ('clinical-psychologist',      'Very High', 'High',      4, 8.5),
  ('prosthetist-orthotist',      'High',      'Low',       4, 7.0),
  ('yoga-instructor',            'High',      'Medium',    4, 7.5),
  ('forensic-scientist',         'High',      'High',      3, 7.5),
  ('meteorologist',              'Medium',    'High',      4, 6.5),
  ('nuclear-scientist-barc',     'Medium',    'Very High', 4, 7.0)
) as v(slug, g, comp, wlb, d)
where c.slug = v.slug and c.growth_level is null;

-- ── Skills the list did not have ──────────────────────────────────────────────
insert into public.skills (name, type, description)
select v.name, v.type, v.descr from (values
  ('Flight Operations', 'Technical', 'Flying an aircraft safely: procedures, instruments, weather and air traffic rules'),
  ('Navigation', 'Technical', 'Plotting and following a route by sea or air using charts and instruments'),
  ('Seamanship', 'Technical', 'Ship handling, watchkeeping, cargo and safety at sea'),
  ('Culinary Arts', 'Technical', 'Cooking techniques, kitchen operations and menu planning'),
  ('Baking & Pastry', 'Technical', 'Breads, cakes, desserts and confectionery techniques'),
  ('Food Safety & Hygiene', 'Technical', 'Safe food handling, storage and kitchen hygiene standards'),
  ('Sound Engineering', 'Technical', 'Recording, mixing and mastering audio'),
  ('Acting & Performance', 'Technical', 'Voice, movement and expression for stage and screen'),
  ('Music', 'Technical', 'Musical theory, an instrument or vocals'),
  ('Yoga Practice', 'Technical', 'Asanas, pranayama and safe instruction of yoga'),
  ('Sports Training', 'Technical', 'Planning training, technique correction and match preparation'),
  ('Nutrition Science', 'Technical', 'Diet planning, food composition and clinical nutrition'),
  ('Audiometry', 'Technical', 'Hearing tests and fitting of hearing aids'),
  ('Rehabilitation', 'Technical', 'Restoring movement and function after injury or disability'),
  ('Atmospheric Science', 'Technical', 'Weather systems, climate data and forecasting models'),
  ('Nuclear Physics', 'Technical', 'Reactor physics, radiation and nuclear materials'),
  ('Forensic Analysis', 'Technical', 'Analysing crime-scene evidence: chemicals, DNA, fingerprints, documents'),
  ('Financial Markets', 'Technical', 'How shares, bonds, mutual funds and derivatives are traded and regulated'),
  ('Cost Accounting', 'Technical', 'Costing, budgeting and cost control in organisations'),
  ('Banking Operations', 'Technical', 'Accounts, loans, payments and customer service in a bank'),
  ('Sales', 'Soft', 'Understanding a client''s needs and persuading them'),
  ('Footwear Design', 'Technical', 'Designing shoes: lasts, patterns, materials and comfort'),
  ('Machinery Operation', 'Technical', 'Operating and monitoring heavy machines and locomotives safely'),
  ('Decision Making', 'Soft', 'Making sound decisions quickly, often under pressure')
) as v(name, type, descr)
where not exists (select 1 from public.skills s where s.name = v.name);

-- ── Skills for the 41 careers that had none ───────────────────────────────────
insert into public.career_skills (career_id, skill_id, importance)
select c.id, s.id, v.imp
from (values
  ('air-force-agniveer', 'Physical Fitness', 'Must Have'), ('air-force-agniveer', 'Discipline', 'Must Have'), ('air-force-agniveer', 'Teamwork', 'Must Have'), ('air-force-agniveer', 'Physics', 'Good To Have'), ('air-force-agniveer', 'Mathematics', 'Good To Have'), ('air-force-agniveer', 'Communication', 'Good To Have'),
  ('navy-agniveer', 'Physical Fitness', 'Must Have'), ('navy-agniveer', 'Discipline', 'Must Have'), ('navy-agniveer', 'Teamwork', 'Must Have'), ('navy-agniveer', 'Seamanship', 'Good To Have'), ('navy-agniveer', 'Physics', 'Good To Have'), ('navy-agniveer', 'Mathematics', 'Good To Have'),
  ('coast-guard-navik', 'Physical Fitness', 'Must Have'), ('coast-guard-navik', 'Discipline', 'Must Have'), ('coast-guard-navik', 'Seamanship', 'Must Have'), ('coast-guard-navik', 'Teamwork', 'Must Have'), ('coast-guard-navik', 'Navigation', 'Good To Have'), ('coast-guard-navik', 'Mathematics', 'Good To Have'),
  ('cisf-constable', 'Physical Fitness', 'Must Have'), ('cisf-constable', 'Discipline', 'Must Have'), ('cisf-constable', 'Security', 'Must Have'), ('cisf-constable', 'Teamwork', 'Must Have'), ('cisf-constable', 'Attention to Detail', 'Good To Have'), ('cisf-constable', 'Law Enforcement', 'Good To Have'),
  ('crpf-constable', 'Physical Fitness', 'Must Have'), ('crpf-constable', 'Discipline', 'Must Have'), ('crpf-constable', 'Law Enforcement', 'Must Have'), ('crpf-constable', 'Teamwork', 'Must Have'), ('crpf-constable', 'Conflict Resolution', 'Good To Have'), ('crpf-constable', 'Integrity', 'Good To Have'),
  ('paramilitary-force-officer-capf', 'Leadership', 'Must Have'), ('paramilitary-force-officer-capf', 'Physical Fitness', 'Must Have'), ('paramilitary-force-officer-capf', 'Law Enforcement', 'Must Have'), ('paramilitary-force-officer-capf', 'Discipline', 'Must Have'), ('paramilitary-force-officer-capf', 'Decision Making', 'Good To Have'), ('paramilitary-force-officer-capf', 'Communication', 'Good To Have'), ('paramilitary-force-officer-capf', 'Integrity', 'Good To Have'),
  ('central-civil-services-officer-group-a', 'Public Administration', 'Must Have'), ('central-civil-services-officer-group-a', 'Policy Implementation', 'Must Have'), ('central-civil-services-officer-group-a', 'Leadership', 'Must Have'), ('central-civil-services-officer-group-a', 'Analytical Thinking', 'Must Have'), ('central-civil-services-officer-group-a', 'Writing', 'Good To Have'), ('central-civil-services-officer-group-a', 'Integrity', 'Good To Have'), ('central-civil-services-officer-group-a', 'Communication', 'Good To Have'),
  ('ssc-government-assistant-clerk', 'Documentation', 'Must Have'), ('ssc-government-assistant-clerk', 'Digital Literacy', 'Must Have'), ('ssc-government-assistant-clerk', 'Attention to Detail', 'Must Have'), ('ssc-government-assistant-clerk', 'Mathematics', 'Good To Have'), ('ssc-government-assistant-clerk', 'Communication', 'Good To Have'), ('ssc-government-assistant-clerk', 'Excel', 'Good To Have'),
  ('loco-pilot', 'Machinery Operation', 'Must Have'), ('loco-pilot', 'Attention to Detail', 'Must Have'), ('loco-pilot', 'Safety Management', 'Must Have'), ('loco-pilot', 'Discipline', 'Must Have'), ('loco-pilot', 'Physics', 'Good To Have'), ('loco-pilot', 'Problem Solving', 'Good To Have'),
  ('kvs-teacher', 'Teaching', 'Must Have'), ('kvs-teacher', 'Subject Expertise', 'Must Have'), ('kvs-teacher', 'Lesson Planning', 'Must Have'), ('kvs-teacher', 'Classroom Management', 'Must Have'), ('kvs-teacher', 'Communication', 'Good To Have'), ('kvs-teacher', 'Patience', 'Good To Have'), ('kvs-teacher', 'Educational Psychology', 'Good To Have'),
  ('sports-coach', 'Sports Training', 'Must Have'), ('sports-coach', 'Physical Fitness', 'Must Have'), ('sports-coach', 'Leadership', 'Must Have'), ('sports-coach', 'Communication', 'Must Have'), ('sports-coach', 'Exercise Science', 'Good To Have'), ('sports-coach', 'Mentoring', 'Good To Have'), ('sports-coach', 'Psychology', 'Good To Have'),
  ('footwear-designer', 'Footwear Design', 'Must Have'), ('footwear-designer', 'Sketching', 'Must Have'), ('footwear-designer', 'CAD Software', 'Must Have'), ('footwear-designer', 'Creativity', 'Must Have'), ('footwear-designer', 'Trend Analysis', 'Good To Have'), ('footwear-designer', 'Prototyping', 'Good To Have'), ('footwear-designer', 'Materials Science', 'Good To Have'),
  ('agricultural-engineer', 'Mechanical Design', 'Must Have'), ('agricultural-engineer', 'Crop Science', 'Must Have'), ('agricultural-engineer', 'AutoCAD', 'Good To Have'), ('agricultural-engineer', 'Problem Solving', 'Must Have'), ('agricultural-engineer', 'Fieldwork', 'Good To Have'), ('agricultural-engineer', 'Environmental Science', 'Good To Have'),
  ('textile-engineer', 'Fabric Knowledge', 'Must Have'), ('textile-engineer', 'Manufacturing Processes', 'Must Have'), ('textile-engineer', 'Chemistry', 'Must Have'), ('textile-engineer', 'Materials Science', 'Good To Have'), ('textile-engineer', 'Problem Solving', 'Good To Have'), ('textile-engineer', 'Safety Management', 'Good To Have'),
  ('commercial-pilot', 'Flight Operations', 'Must Have'), ('commercial-pilot', 'Navigation', 'Must Have'), ('commercial-pilot', 'Physics', 'Must Have'), ('commercial-pilot', 'Decision Making', 'Must Have'), ('commercial-pilot', 'Communication', 'Must Have'), ('commercial-pilot', 'Attention to Detail', 'Good To Have'), ('commercial-pilot', 'Teamwork', 'Good To Have'),
  ('merchant-navy-officer', 'Seamanship', 'Must Have'), ('merchant-navy-officer', 'Navigation', 'Must Have'), ('merchant-navy-officer', 'Safety Management', 'Must Have'), ('merchant-navy-officer', 'Leadership', 'Good To Have'), ('merchant-navy-officer', 'Physical Fitness', 'Good To Have'), ('merchant-navy-officer', 'Mathematics', 'Good To Have'),
  ('bank-clerk-associate', 'Banking Operations', 'Must Have'), ('bank-clerk-associate', 'Customer Service', 'Must Have'), ('bank-clerk-associate', 'Attention to Detail', 'Must Have'), ('bank-clerk-associate', 'Mathematics', 'Good To Have'), ('bank-clerk-associate', 'Digital Literacy', 'Good To Have'), ('bank-clerk-associate', 'Communication', 'Good To Have'),
  ('bank-probationary-officer-po', 'Banking Operations', 'Must Have'), ('bank-probationary-officer-po', 'Leadership', 'Must Have'), ('bank-probationary-officer-po', 'Customer Service', 'Must Have'), ('bank-probationary-officer-po', 'Risk Assessment', 'Good To Have'), ('bank-probationary-officer-po', 'Data Analysis', 'Good To Have'), ('bank-probationary-officer-po', 'Communication', 'Good To Have'), ('bank-probationary-officer-po', 'Sales', 'Good To Have'),
  ('bank-it-officer', 'Networking', 'Must Have'), ('bank-it-officer', 'Databases', 'Must Have'), ('bank-it-officer', 'Network Security', 'Must Have'), ('bank-it-officer', 'Programming', 'Good To Have'), ('bank-it-officer', 'System Administration', 'Good To Have'), ('bank-it-officer', 'Banking Operations', 'Good To Have'),
  ('lic-aao', 'Administration', 'Must Have'), ('lic-aao', 'Customer Service', 'Must Have'), ('lic-aao', 'Risk Assessment', 'Good To Have'), ('lic-aao', 'Communication', 'Must Have'), ('lic-aao', 'Documentation', 'Good To Have'), ('lic-aao', 'Leadership', 'Good To Have'),
  ('cost-management-accountant', 'Cost Accounting', 'Must Have'), ('cost-management-accountant', 'Accounting', 'Must Have'), ('cost-management-accountant', 'Taxation', 'Good To Have'), ('cost-management-accountant', 'Financial Reporting', 'Must Have'), ('cost-management-accountant', 'Excel', 'Good To Have'), ('cost-management-accountant', 'Auditing', 'Good To Have'),
  ('investment-adviser', 'Financial Markets', 'Must Have'), ('investment-adviser', 'Financial Modeling', 'Good To Have'), ('investment-adviser', 'Risk Assessment', 'Must Have'), ('investment-adviser', 'Communication', 'Must Have'), ('investment-adviser', 'Ethics', 'Must Have'), ('investment-adviser', 'Regulatory Knowledge', 'Good To Have'),
  ('research-analyst', 'Financial Modeling', 'Must Have'), ('research-analyst', 'Valuation', 'Must Have'), ('research-analyst', 'Financial Markets', 'Must Have'), ('research-analyst', 'Data Analysis', 'Must Have'), ('research-analyst', 'Excel', 'Good To Have'), ('research-analyst', 'Writing', 'Good To Have'),
  ('stock-broker', 'Financial Markets', 'Must Have'), ('stock-broker', 'Sales', 'Must Have'), ('stock-broker', 'Risk Assessment', 'Must Have'), ('stock-broker', 'Communication', 'Good To Have'), ('stock-broker', 'Regulatory Knowledge', 'Good To Have'), ('stock-broker', 'Data Analysis', 'Good To Have'),
  ('mutual-fund-distributor', 'Financial Markets', 'Must Have'), ('mutual-fund-distributor', 'Sales', 'Must Have'), ('mutual-fund-distributor', 'Communication', 'Must Have'), ('mutual-fund-distributor', 'Ethics', 'Good To Have'), ('mutual-fund-distributor', 'Networking (Professional)', 'Good To Have'), ('mutual-fund-distributor', 'Regulatory Knowledge', 'Good To Have'),
  ('patent-agent', 'IP Law', 'Must Have'), ('patent-agent', 'Writing', 'Must Have'), ('patent-agent', 'Legal Research', 'Must Have'), ('patent-agent', 'Attention to Detail', 'Must Have'), ('patent-agent', 'Analytical Thinking', 'Good To Have'), ('patent-agent', 'Subject Expertise', 'Good To Have'),
  ('business-manager', 'Leadership', 'Must Have'), ('business-manager', 'Strategic Thinking', 'Must Have'), ('business-manager', 'Project Management', 'Must Have'), ('business-manager', 'Negotiation', 'Good To Have'), ('business-manager', 'Data Analysis', 'Good To Have'), ('business-manager', 'Communication', 'Must Have'),
  ('chef', 'Culinary Arts', 'Must Have'), ('chef', 'Food Safety & Hygiene', 'Must Have'), ('chef', 'Creativity', 'Must Have'), ('chef', 'Teamwork', 'Good To Have'), ('chef', 'Leadership', 'Good To Have'), ('chef', 'Hospitality Management', 'Good To Have'),
  ('pastry-chef', 'Baking & Pastry', 'Must Have'), ('pastry-chef', 'Food Safety & Hygiene', 'Must Have'), ('pastry-chef', 'Creativity', 'Must Have'), ('pastry-chef', 'Attention to Detail', 'Must Have'), ('pastry-chef', 'Culinary Arts', 'Good To Have'), ('pastry-chef', 'Visual Design', 'Good To Have'),
  ('cinematographer', 'Cinematography Knowledge', 'Must Have'), ('cinematographer', 'Visual Communication', 'Must Have'), ('cinematographer', 'Creativity', 'Must Have'), ('cinematographer', 'Storytelling', 'Good To Have'), ('cinematographer', 'Teamwork', 'Good To Have'), ('cinematographer', 'Video Editing', 'Good To Have'),
  ('film-editor', 'Video Editing', 'Must Have'), ('film-editor', 'Storytelling', 'Must Have'), ('film-editor', 'Attention to Detail', 'Must Have'), ('film-editor', 'Creativity', 'Good To Have'), ('film-editor', 'Sound Engineering', 'Good To Have'), ('film-editor', 'Visual Communication', 'Good To Have'),
  ('sound-designer', 'Sound Engineering', 'Must Have'), ('sound-designer', 'Music', 'Must Have'), ('sound-designer', 'Creativity', 'Must Have'), ('sound-designer', 'Attention to Detail', 'Good To Have'), ('sound-designer', 'Storytelling', 'Good To Have'), ('sound-designer', 'Physics', 'Good To Have'),
  ('performing-artist', 'Acting & Performance', 'Must Have'), ('performing-artist', 'Creativity', 'Must Have'), ('performing-artist', 'Public Speaking', 'Must Have'), ('performing-artist', 'Music', 'Good To Have'), ('performing-artist', 'Physical Fitness', 'Good To Have'), ('performing-artist', 'Storytelling', 'Good To Have'),
  ('audiologist', 'Audiometry', 'Must Have'), ('audiologist', 'Patient Care', 'Must Have'), ('audiologist', 'Diagnosis', 'Must Have'), ('audiologist', 'Rehabilitation', 'Good To Have'), ('audiologist', 'Patient Counseling', 'Good To Have'), ('audiologist', 'Empathy', 'Good To Have'),
  ('clinical-psychologist', 'Psychology', 'Must Have'), ('clinical-psychologist', 'Counseling', 'Must Have'), ('clinical-psychologist', 'Diagnosis', 'Must Have'), ('clinical-psychologist', 'Empathy', 'Must Have'), ('clinical-psychologist', 'Research Methodology', 'Good To Have'), ('clinical-psychologist', 'Ethics', 'Good To Have'),
  ('dietitian-nutritionist', 'Nutrition Science', 'Must Have'), ('dietitian-nutritionist', 'Patient Counseling', 'Must Have'), ('dietitian-nutritionist', 'Biology', 'Must Have'), ('dietitian-nutritionist', 'Chemistry', 'Good To Have'), ('dietitian-nutritionist', 'Communication', 'Good To Have'), ('dietitian-nutritionist', 'Empathy', 'Good To Have'),
  ('prosthetist-orthotist', 'Rehabilitation', 'Must Have'), ('prosthetist-orthotist', 'Anatomy', 'Must Have'), ('prosthetist-orthotist', 'Medical Device Design', 'Must Have'), ('prosthetist-orthotist', 'Manual Dexterity', 'Must Have'), ('prosthetist-orthotist', 'Patient Care', 'Good To Have'), ('prosthetist-orthotist', 'Materials Science', 'Good To Have'),
  ('yoga-instructor', 'Yoga Practice', 'Must Have'), ('yoga-instructor', 'Teaching', 'Must Have'), ('yoga-instructor', 'Anatomy', 'Good To Have'), ('yoga-instructor', 'Physical Fitness', 'Must Have'), ('yoga-instructor', 'Communication', 'Good To Have'), ('yoga-instructor', 'Patience', 'Good To Have'),
  ('forensic-scientist', 'Forensic Analysis', 'Must Have'), ('forensic-scientist', 'Lab Techniques', 'Must Have'), ('forensic-scientist', 'Chemistry', 'Must Have'), ('forensic-scientist', 'Molecular Biology', 'Good To Have'), ('forensic-scientist', 'Attention to Detail', 'Must Have'), ('forensic-scientist', 'Documentation', 'Good To Have'), ('forensic-scientist', 'Investigation', 'Good To Have'),
  ('meteorologist', 'Atmospheric Science', 'Must Have'), ('meteorologist', 'Physics', 'Must Have'), ('meteorologist', 'Mathematics', 'Must Have'), ('meteorologist', 'Data Analysis', 'Must Have'), ('meteorologist', 'Programming', 'Good To Have'), ('meteorologist', 'Statistics', 'Good To Have'),
  ('nuclear-scientist-barc', 'Nuclear Physics', 'Must Have'), ('nuclear-scientist-barc', 'Physics', 'Must Have'), ('nuclear-scientist-barc', 'Mathematics', 'Must Have'), ('nuclear-scientist-barc', 'Research Methodology', 'Good To Have'), ('nuclear-scientist-barc', 'Safety Management', 'Must Have'), ('nuclear-scientist-barc', 'Programming', 'Good To Have')
) as v(slug, skill, imp)
join public.careers c on c.slug = v.slug
join public.skills s on s.name = v.skill
where not exists (select 1 from public.career_skills x where x.career_id = c.id and x.skill_id = s.id);

-- ── Exam links where an exam on the site really leads to the career ───────────
insert into public.career_exams (career_id, exam_id, importance)
select c.id, e.id, v.imp
from (values
  ('agricultural-engineer', 'jee-main', 'Preferred'), ('agricultural-engineer', 'icar-aieea', 'Preferred'),
  ('textile-engineer', 'jee-main', 'Preferred'),
  ('pastry-chef', 'nchmct-jee', 'Preferred'),
  ('physiotherapist', 'neet-ug', 'Preferred'), ('physiotherapist', 'ipu-cet', 'Optional'),
  ('clinical-psychologist', 'cuet-ug', 'Preferred'), ('clinical-psychologist', 'cuet-pg', 'Preferred'),
  ('dietitian-nutritionist', 'cuet-ug', 'Preferred'), ('dietitian-nutritionist', 'cuet-pg', 'Optional'),
  ('forensic-scientist', 'cuet-ug', 'Preferred'), ('forensic-scientist', 'cuet-pg', 'Preferred'),
  ('meteorologist', 'jam', 'Preferred'), ('meteorologist', 'gate', 'Preferred'), ('meteorologist', 'csir-net', 'Optional'),
  ('actuary', 'cuet-ug', 'Optional'),
  ('historian', 'cuet-ug', 'Preferred'), ('historian', 'cuet-pg', 'Preferred'), ('historian', 'ugc-net', 'Preferred'),
  ('footwear-designer', 'nift-entrance', 'Optional')
) as v(slug, exam, imp)
join public.careers c on c.slug = v.slug
join public.exams e on e.slug = v.exam
where not exists (select 1 from public.career_exams x where x.career_id = c.id and x.exam_id = e.id);

commit;
