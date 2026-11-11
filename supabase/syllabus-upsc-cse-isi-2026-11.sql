-- Official syllabus for UPSC CSE and the ISI B.Stat/B.Math test (UGA/UGB).
-- Sources (read 12 Nov 2026):
--   UPSC CSE: Notification CSP 2026, Section III "Syllabi for the Examination"
--             https://www.upsc.gov.in/sites/default/files/Notif-CSP-2026-Engl-060226Rev.pdf
--   ISI:      https://admission.isical.ac.in/Syllabus/BStat-BMath-Syllabus-UGA-UGB-2026.pdf
-- Optional-subject syllabi (Mains Papers VI and VII) are not copied; the notification lists them.

begin;

delete from public.exam_syllabus
where source_type = 'official'
  and exam_id in (select id from public.exams where slug in ('upsc-cse', 'isi-admission-test'));

-- The ISI topic estimates had two empty headings (no topic, no weightage)
-- that showed as "0 focus areas" on the roadmap.
delete from public.exam_syllabus
where exam_id = (select id from public.exams where slug = 'isi-admission-test')
  and coalesce(source_type, '') <> 'official' and topic is null and weightage is null;

-- The UPSC topic estimates are Prelims GS Paper I topics.
update public.exam_syllabus set stage = 'Prelims'
where exam_id = (select id from public.exams where slug = 'upsc-cse')
  and coalesce(source_type, '') <> 'official' and stage is null;

insert into public.exam_syllabus (exam_id, subject, topic, stage, source_type, source_url, verified_at, added_at, sort_order)
select e.id, v.subject, v.topic, v.stage, 'official', s.src, now(), now(), v.ord
from (values
  -- UPSC CSE — Prelims
  ('upsc-cse', 'Prelims', 'Paper I — General Studies (200 marks, 2 hours)', 'Current events of national and international importance', 'U', 1),
  ('upsc-cse', 'Prelims', 'Paper I — General Studies (200 marks, 2 hours)', 'History of India and Indian National Movement', 'U', 2),
  ('upsc-cse', 'Prelims', 'Paper I — General Studies (200 marks, 2 hours)', 'Indian and World Geography — physical, social and economic geography of India and the world', 'U', 3),
  ('upsc-cse', 'Prelims', 'Paper I — General Studies (200 marks, 2 hours)', 'Indian Polity and Governance — Constitution, political system, Panchayati Raj, public policy, rights issues', 'U', 4),
  ('upsc-cse', 'Prelims', 'Paper I — General Studies (200 marks, 2 hours)', 'Economic and Social Development — sustainable development, poverty, inclusion, demographics, social sector initiatives', 'U', 5),
  ('upsc-cse', 'Prelims', 'Paper I — General Studies (200 marks, 2 hours)', 'General issues on environmental ecology, biodiversity and climate change (no subject specialisation needed)', 'U', 6),
  ('upsc-cse', 'Prelims', 'Paper I — General Studies (200 marks, 2 hours)', 'General Science', 'U', 7),
  ('upsc-cse', 'Prelims', 'Paper II — CSAT (200 marks, 2 hours, qualifying at 33%)', 'Comprehension', 'U', 8),
  ('upsc-cse', 'Prelims', 'Paper II — CSAT (200 marks, 2 hours, qualifying at 33%)', 'Interpersonal skills including communication skills', 'U', 9),
  ('upsc-cse', 'Prelims', 'Paper II — CSAT (200 marks, 2 hours, qualifying at 33%)', 'Logical reasoning and analytical ability', 'U', 10),
  ('upsc-cse', 'Prelims', 'Paper II — CSAT (200 marks, 2 hours, qualifying at 33%)', 'Decision making and problem solving', 'U', 11),
  ('upsc-cse', 'Prelims', 'Paper II — CSAT (200 marks, 2 hours, qualifying at 33%)', 'General mental ability', 'U', 12),
  ('upsc-cse', 'Prelims', 'Paper II — CSAT (200 marks, 2 hours, qualifying at 33%)', 'Basic numeracy and data interpretation — charts, graphs, tables, data sufficiency (Class X level)', 'U', 13),
  -- UPSC CSE — Mains
  ('upsc-cse', 'Mains', 'Qualifying papers — Indian Language and English (not counted for ranking)', 'Comprehension of passages, précis writing, usage and vocabulary, short essays; translation for the Indian language paper (Matriculation standard)', 'U', 14),
  ('upsc-cse', 'Mains', 'Paper I — Essay', 'Essays on multiple topics; credit for orderly arrangement of ideas and effective, exact, concise expression', 'U', 15),
  ('upsc-cse', 'Mains', 'Paper II — GS I: Indian Heritage and Culture, History and Geography of the World and Society', 'Indian culture — art forms, literature and architecture from ancient to modern times', 'U', 16),
  ('upsc-cse', 'Mains', 'Paper II — GS I: Indian Heritage and Culture, History and Geography of the World and Society', 'Modern Indian history from the mid-18th century; the Freedom Struggle and its contributors; post-independence consolidation and reorganisation', 'U', 17),
  ('upsc-cse', 'Mains', 'Paper II — GS I: Indian Heritage and Culture, History and Geography of the World and Society', 'World history from the 18th century — industrial revolution, world wars, colonisation and decolonisation, political philosophies', 'U', 18),
  ('upsc-cse', 'Mains', 'Paper II — GS I: Indian Heritage and Culture, History and Geography of the World and Society', 'Indian society — diversity, role of women, population, poverty, urbanisation, globalisation, social empowerment, communalism, regionalism, secularism', 'U', 19),
  ('upsc-cse', 'Mains', 'Paper II — GS I: Indian Heritage and Culture, History and Geography of the World and Society', 'Physical geography of the world, distribution of natural resources, location of industries, geophysical phenomena and changes in geographical features', 'U', 20),
  ('upsc-cse', 'Mains', 'Paper III — GS II: Governance, Constitution, Polity, Social Justice and International Relations', 'Indian Constitution — evolution, features, amendments, basic structure; comparison with other countries', 'U', 21),
  ('upsc-cse', 'Mains', 'Paper III — GS II: Governance, Constitution, Polity, Social Justice and International Relations', 'Union and States, federalism and devolution; separation of powers; Parliament, State legislatures, Executive and Judiciary; Representation of People''s Act', 'U', 22),
  ('upsc-cse', 'Mains', 'Paper III — GS II: Governance, Constitution, Polity, Social Justice and International Relations', 'Constitutional, statutory, regulatory and quasi-judicial bodies', 'U', 23),
  ('upsc-cse', 'Mains', 'Paper III — GS II: Governance, Constitution, Polity, Social Justice and International Relations', 'Government policies and development; NGOs and SHGs; welfare schemes for vulnerable sections; health, education and human resources; poverty and hunger', 'U', 24),
  ('upsc-cse', 'Mains', 'Paper III — GS II: Governance, Constitution, Polity, Social Justice and International Relations', 'Governance, transparency, accountability, e-governance, citizens'' charters; role of civil services in a democracy', 'U', 25),
  ('upsc-cse', 'Mains', 'Paper III — GS II: Governance, Constitution, Polity, Social Justice and International Relations', 'India and its neighbourhood; bilateral, regional and global groupings; Indian diaspora; international institutions and fora', 'U', 26),
  ('upsc-cse', 'Mains', 'Paper IV — GS III: Technology, Economic Development, Biodiversity, Environment, Security and Disaster Management', 'Indian economy — planning, resource mobilisation, growth, employment, inclusive growth, government budgeting, liberalisation, industrial policy, infrastructure, investment models', 'U', 27),
  ('upsc-cse', 'Mains', 'Paper IV — GS III: Technology, Economic Development, Biodiversity, Environment, Security and Disaster Management', 'Agriculture — cropping patterns, irrigation, marketing, farm subsidies and MSP, PDS and food security, food processing, land reforms', 'U', 28),
  ('upsc-cse', 'Mains', 'Paper IV — GS III: Technology, Economic Development, Biodiversity, Environment, Security and Disaster Management', 'Science and technology — applications, achievements of Indians, IT, space, computers, robotics, nano- and bio-technology, IPR', 'U', 29),
  ('upsc-cse', 'Mains', 'Paper IV — GS III: Technology, Economic Development, Biodiversity, Environment, Security and Disaster Management', 'Conservation, pollution, environmental impact assessment; disaster management', 'U', 30),
  ('upsc-cse', 'Mains', 'Paper IV — GS III: Technology, Economic Development, Biodiversity, Environment, Security and Disaster Management', 'Internal security — extremism, external state and non-state actors, cyber security, money-laundering, border areas, organised crime and terrorism, security forces', 'U', 31),
  ('upsc-cse', 'Mains', 'Paper V — GS IV: Ethics, Integrity and Aptitude', 'Ethics and human interface; human values from great leaders, reformers and administrators; attitude', 'U', 32),
  ('upsc-cse', 'Mains', 'Paper V — GS IV: Ethics, Integrity and Aptitude', 'Aptitude and foundational values for civil service; emotional intelligence; moral thinkers and philosophers of India and the world', 'U', 33),
  ('upsc-cse', 'Mains', 'Paper V — GS IV: Ethics, Integrity and Aptitude', 'Public service values and ethics in public administration; probity in governance, RTI, codes of ethics and conduct, corruption', 'U', 34),
  ('upsc-cse', 'Mains', 'Paper V — GS IV: Ethics, Integrity and Aptitude', 'Case studies on the above', 'U', 35),
  ('upsc-cse', 'Mains', 'Papers VI and VII — Optional subject (Papers I and II)', 'One optional subject from the list in the notification; standard roughly honours-degree level (bachelor''s level for engineering, medical science and law)', 'U', 36),
  -- ISI B.Stat / B.Math — UGA and UGB share one syllabus
  ('isi-admission-test', null, 'B.Stat / B.Math — UGA and UGB: Algebra', 'Sets, primes, factorisation and divisibility, rational and irrational numbers', 'I', 1),
  ('isi-admission-test', null, 'B.Stat / B.Math — UGA and UGB: Algebra', 'Permutations and combinations, basic probability, mathematical induction, recurrence relations, binomial theorem, logarithms', 'I', 2),
  ('isi-admission-test', null, 'B.Stat / B.Math — UGA and UGB: Algebra', 'Polynomials — remainder theorem, quadratic equations and expressions, relations between roots and coefficients', 'I', 3),
  ('isi-admission-test', null, 'B.Stat / B.Math — UGA and UGB: Algebra', 'Arithmetic and geometric progressions; AM–GM–HM inequalities; complex numbers; matrices and determinants', 'I', 4),
  ('isi-admission-test', null, 'B.Stat / B.Math — UGA and UGB: Geometry', 'Plane geometry; 2-D geometry in Cartesian and polar coordinates; lines, angles and distances; locus; area of a triangle', 'I', 5),
  ('isi-admission-test', null, 'B.Stat / B.Math — UGA and UGB: Geometry', 'Circle, parabola, ellipse and hyperbola with their tangents and normals; mensuration', 'I', 6),
  ('isi-admission-test', null, 'B.Stat / B.Math — UGA and UGB: Trigonometry', 'Measures of angles, trigonometric and inverse trigonometric functions, identities and addition formulae, trigonometric equations', 'I', 7),
  ('isi-admission-test', null, 'B.Stat / B.Math — UGA and UGB: Trigonometry', 'Properties of triangles; heights and distances', 'I', 8),
  ('isi-admission-test', null, 'B.Stat / B.Math — UGA and UGB: Calculus', 'Sequences — bounded, monotone, limits; functions (one-one, onto); limits and continuity', 'I', 9),
  ('isi-admission-test', null, 'B.Stat / B.Math — UGA and UGB: Calculus', 'Derivatives and methods of differentiation; slope, tangents and normals; maxima and minima; curve sketching', 'I', 10),
  ('isi-admission-test', null, 'B.Stat / B.Math — UGA and UGB: Calculus', 'Methods of integration, definite and indefinite integrals, area under curves; first-order first-degree homogeneous differential equations', 'I', 11)
) as v(slug, stage, subject, topic, srckey, ord)
join public.exams e on e.slug = v.slug
cross join lateral (select case v.srckey
  when 'U' then 'https://www.upsc.gov.in/sites/default/files/Notif-CSP-2026-Engl-060226Rev.pdf'
  else 'https://admission.isical.ac.in/Syllabus/BStat-BMath-Syllabus-UGA-UGB-2026.pdf' end as src) s;

update public.exams set
  syllabus_source_url = 'https://www.upsc.gov.in/sites/default/files/Notif-CSP-2026-Engl-060226Rev.pdf',
  syllabus_verified_at = now(), syllabus_read_at = now()
where slug = 'upsc-cse';

update public.exams set
  syllabus_source_url = 'https://admission.isical.ac.in/Syllabus/BStat-BMath-Syllabus-UGA-UGB-2026.pdf',
  syllabus_verified_at = now(), syllabus_read_at = now()
where slug = 'isi-admission-test';

commit;
