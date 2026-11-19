-- Subject weights for the 41 careers that had none, so the Get Advice recommender can
-- suggest them. Same scale as the existing weights (0.50 = useful, 0.95 = essential):
-- how much each Class 11-12 subject prepares a student for the career, based on the
-- subjects its entrance exam or qualifying degree tests.

insert into public.career_subject_weights (career_id, subject_id, weight)
select c.id, s.id, v.weight
from (values
  -- Defence / armed forces
  ('air-force-agniveer', 'Physics', 0.85), ('air-force-agniveer', 'Mathematics', 0.85), ('air-force-agniveer', 'English', 0.70), ('air-force-agniveer', 'Physical Education', 0.75),
  ('navy-agniveer', 'Physics', 0.80), ('navy-agniveer', 'Mathematics', 0.80), ('navy-agniveer', 'Physical Education', 0.80), ('navy-agniveer', 'English', 0.60),
  ('coast-guard-navik', 'Physics', 0.75), ('coast-guard-navik', 'Mathematics', 0.75), ('coast-guard-navik', 'Physical Education', 0.80), ('coast-guard-navik', 'English', 0.60),
  ('cisf-constable', 'Physical Education', 0.90), ('cisf-constable', 'English', 0.55), ('cisf-constable', 'Mathematics', 0.55),
  ('crpf-constable', 'Physical Education', 0.90), ('crpf-constable', 'English', 0.55), ('crpf-constable', 'Mathematics', 0.55),
  ('paramilitary-force-officer-capf', 'Physical Education', 0.85), ('paramilitary-force-officer-capf', 'Political Science', 0.75), ('paramilitary-force-officer-capf', 'History', 0.65), ('paramilitary-force-officer-capf', 'English', 0.70),
  -- Government
  ('central-civil-services-officer-group-a', 'Political Science', 0.85), ('central-civil-services-officer-group-a', 'Economics', 0.75), ('central-civil-services-officer-group-a', 'History', 0.75), ('central-civil-services-officer-group-a', 'Geography', 0.70), ('central-civil-services-officer-group-a', 'English', 0.70),
  ('ssc-government-assistant-clerk', 'Mathematics', 0.80), ('ssc-government-assistant-clerk', 'English', 0.80), ('ssc-government-assistant-clerk', 'Political Science', 0.55),
  ('loco-pilot', 'Physics', 0.85), ('loco-pilot', 'Mathematics', 0.80), ('loco-pilot', 'English', 0.50),
  ('kvs-teacher', 'English', 0.85), ('kvs-teacher', 'Psychology', 0.70), ('kvs-teacher', 'Mathematics', 0.60), ('kvs-teacher', 'Sociology', 0.55),
  -- Finance and banking
  ('bank-probationary-officer-po', 'Mathematics', 0.90), ('bank-probationary-officer-po', 'English', 0.85), ('bank-probationary-officer-po', 'Economics', 0.75),
  ('bank-clerk-associate', 'Mathematics', 0.85), ('bank-clerk-associate', 'English', 0.80), ('bank-clerk-associate', 'Economics', 0.55),
  ('bank-it-officer', 'Computer Science', 0.95), ('bank-it-officer', 'Mathematics', 0.80), ('bank-it-officer', 'English', 0.65),
  ('lic-aao', 'Mathematics', 0.85), ('lic-aao', 'English', 0.80), ('lic-aao', 'Economics', 0.70),
  ('cost-management-accountant', 'Accountancy', 0.95), ('cost-management-accountant', 'Mathematics', 0.85), ('cost-management-accountant', 'Economics', 0.80), ('cost-management-accountant', 'Business Studies', 0.70),
  ('investment-adviser', 'Economics', 0.90), ('investment-adviser', 'Mathematics', 0.80), ('investment-adviser', 'Accountancy', 0.75), ('investment-adviser', 'Business Studies', 0.70),
  ('research-analyst', 'Economics', 0.90), ('research-analyst', 'Mathematics', 0.90), ('research-analyst', 'Accountancy', 0.75),
  ('stock-broker', 'Economics', 0.85), ('stock-broker', 'Mathematics', 0.80), ('stock-broker', 'Business Studies', 0.75), ('stock-broker', 'Accountancy', 0.60),
  ('mutual-fund-distributor', 'Economics', 0.80), ('mutual-fund-distributor', 'Business Studies', 0.80), ('mutual-fund-distributor', 'English', 0.65), ('mutual-fund-distributor', 'Mathematics', 0.60),
  -- Engineering and transport
  ('agricultural-engineer', 'Physics', 0.85), ('agricultural-engineer', 'Mathematics', 0.85), ('agricultural-engineer', 'Biology', 0.70), ('agricultural-engineer', 'Chemistry', 0.65),
  ('textile-engineer', 'Chemistry', 0.85), ('textile-engineer', 'Physics', 0.80), ('textile-engineer', 'Mathematics', 0.80),
  ('commercial-pilot', 'Physics', 0.95), ('commercial-pilot', 'Mathematics', 0.90), ('commercial-pilot', 'English', 0.75),
  ('merchant-navy-officer', 'Physics', 0.90), ('merchant-navy-officer', 'Mathematics', 0.90), ('merchant-navy-officer', 'Chemistry', 0.65), ('merchant-navy-officer', 'English', 0.70),
  -- Research and science
  ('nuclear-scientist-barc', 'Physics', 0.95), ('nuclear-scientist-barc', 'Mathematics', 0.90), ('nuclear-scientist-barc', 'Chemistry', 0.80),
  ('meteorologist', 'Physics', 0.90), ('meteorologist', 'Mathematics', 0.90), ('meteorologist', 'Geography', 0.75), ('meteorologist', 'Computer Science', 0.60),
  ('forensic-scientist', 'Chemistry', 0.90), ('forensic-scientist', 'Biology', 0.85), ('forensic-scientist', 'Physics', 0.65),
  -- Medical and health
  ('audiologist', 'Biology', 0.90), ('audiologist', 'Physics', 0.75), ('audiologist', 'Chemistry', 0.65), ('audiologist', 'Psychology', 0.60),
  ('clinical-psychologist', 'Psychology', 0.95), ('clinical-psychologist', 'Biology', 0.70), ('clinical-psychologist', 'Sociology', 0.65), ('clinical-psychologist', 'English', 0.60),
  ('dietitian-nutritionist', 'Biology', 0.90), ('dietitian-nutritionist', 'Chemistry', 0.85), ('dietitian-nutritionist', 'Physical Education', 0.55),
  ('prosthetist-orthotist', 'Biology', 0.85), ('prosthetist-orthotist', 'Physics', 0.85), ('prosthetist-orthotist', 'Chemistry', 0.60), ('prosthetist-orthotist', 'Mathematics', 0.60),
  ('yoga-instructor', 'Physical Education', 0.95), ('yoga-instructor', 'Biology', 0.70), ('yoga-instructor', 'Psychology', 0.55),
  -- Education and sport
  ('sports-coach', 'Physical Education', 0.95), ('sports-coach', 'Biology', 0.65), ('sports-coach', 'Psychology', 0.60),
  -- Law
  ('patent-agent', 'Physics', 0.80), ('patent-agent', 'Chemistry', 0.80), ('patent-agent', 'English', 0.85), ('patent-agent', 'Biology', 0.65), ('patent-agent', 'Political Science', 0.55),
  -- Management and hospitality
  ('business-manager', 'Business Studies', 0.90), ('business-manager', 'Economics', 0.85), ('business-manager', 'Accountancy', 0.70), ('business-manager', 'English', 0.70), ('business-manager', 'Mathematics', 0.60),
  ('chef', 'Chemistry', 0.60), ('chef', 'Biology', 0.55), ('chef', 'Business Studies', 0.55), ('chef', 'Fine Arts', 0.65),
  ('pastry-chef', 'Chemistry', 0.65), ('pastry-chef', 'Fine Arts', 0.70), ('pastry-chef', 'Business Studies', 0.50),
  -- Design, media and performing arts
  ('footwear-designer', 'Fine Arts', 0.95), ('footwear-designer', 'Mathematics', 0.55), ('footwear-designer', 'Business Studies', 0.55),
  ('cinematographer', 'Fine Arts', 0.85), ('cinematographer', 'Physics', 0.65), ('cinematographer', 'English', 0.60),
  ('film-editor', 'Fine Arts', 0.85), ('film-editor', 'Computer Science', 0.70), ('film-editor', 'English', 0.65),
  ('sound-designer', 'Physics', 0.75), ('sound-designer', 'Fine Arts', 0.80), ('sound-designer', 'Computer Science', 0.65),
  ('performing-artist', 'Fine Arts', 0.95), ('performing-artist', 'English', 0.70), ('performing-artist', 'Physical Education', 0.60)
) as v(slug, subject, weight)
join public.careers c on c.slug = v.slug
join public.subjects s on s.name = v.subject
where not exists (select 1 from public.career_subject_weights w where w.career_id = c.id and w.subject_id = s.id);
