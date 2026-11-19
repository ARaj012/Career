-- Career completeness, part 4: the last twelve one-line descriptions, expanded.
update public.careers c set description = v.d
from (values
  ('air-force-agniveer', 'Serve in the Indian Air Force for four years under the Agnipath scheme as an Agniveervayu, in technical or non-technical trades. You get military training, a monthly package and a Seva Nidhi lump sum at the end; up to 25% of each batch can be selected for regular service.'),
  ('navy-agniveer', 'Serve in the Indian Navy as a sailor for four years under the Agnipath scheme (Agniveer SSR or MR), on ships, submarines and shore establishments. You get naval training, a monthly package and a Seva Nidhi lump sum; up to 25% of each batch can continue in regular service.'),
  ('coast-guard-navik', 'Serve on Indian Coast Guard ships, aircraft and stations as a sailor (Navik General Duty or Domestic Branch), protecting India''s coast, rescuing people at sea and stopping smuggling and pollution. A permanent central government job with regular promotions.'),
  ('bank-it-officer', 'Run and secure the technology systems of public sector banks as a Specialist Officer (IT): core banking software, networks, data centres, cybersecurity and digital payments. Recruited mainly through the IBPS SO exam, with the job security and pay scale of a bank officer.'),
  ('biomedical-engineer', 'Applies engineering to medicine: designs and maintains medical devices such as imaging machines, implants, monitors and prosthetics, and works with doctors to improve diagnosis and treatment. Jobs are in device companies, hospitals and research labs.'),
  ('electronics-engineer', 'Designs and develops electronic circuits, chips, embedded systems and communication devices, from smartphones and satellites to medical and automotive electronics. India''s semiconductor push is creating many new jobs in this field.'),
  ('chef', 'Plans menus and cooks professionally in hotels, restaurants, airlines and cruise ships, managing a kitchen team, food costs and hygiene. Chefs start as trainees or commis and rise to sous chef, head chef and executive chef; many open their own restaurants.'),
  ('pastry-chef', 'Bakes breads, cakes, desserts, chocolates and confectionery professionally in hotels, bakeries and patisseries, combining precise technique with creative presentation. Many pastry chefs go on to run their own bakery or cake studio.'),
  ('cinematographer', 'Plans and shoots the visual look of films, series and advertisements as the director of photography: chooses cameras, lenses, lighting and camera movement, and leads the camera and lighting crew to bring the director''s vision to the screen.'),
  ('film-editor', 'Assembles shot footage into the final film, series or advertisement, shaping its story, pace and rhythm, and works closely with the director, sound and visual effects teams in post-production.'),
  ('footwear-designer', 'Designs shoes, sandals and leather products for brands, from trend research and sketches to patterns, material choice and production-ready samples, balancing style, comfort and cost.'),
  ('investment-adviser', 'Gives personalised advice on investments (mutual funds, shares, bonds, insurance and retirement planning) to clients for a fee, as a SEBI-registered investment adviser who must act in the client''s interest rather than earn commissions.')
) as v(slug, d)
where c.slug = v.slug;

-- NCHMCT JEE has no cutoff data on the site, so point hospitality careers to the IHMs
update public.careers set related_college_slugs = array['ihm-pusa','ihm-mumbai','ihm-bangalore','ihm-chennai','ihm-kolkata','ihm-hyderabad','ihm-delhi']
where slug in ('chef', 'pastry-chef', 'hotel-manager');

-- Historians and archaeologists both analyse historical sources and archives
insert into public.career_skills (career_id, skill_id, importance)
select c.id, s.id, v.imp from (values ('historian','Historical Analysis','Must Have'), ('archaeologist','Archival Analysis','Good To Have')) v(slug, skill, imp)
join public.careers c on c.slug = v.slug join public.skills s on s.name = v.skill
where not exists (select 1 from public.career_skills x where x.career_id = c.id and x.skill_id = s.id);
