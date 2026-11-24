-- Scholarships shown on exam and career pages (added 24 Nov 2026).
-- exam_scholarships: awards you earn or use through an exam (GATE -> AICTE PG scholarship,
--   UPSC prelims -> Bihar incentive, JEE/NEET -> free coaching ...). Each note says how.
-- career_scholarships: awards for the studies that lead into a career. A career page also
--   shows the scholarships of the exams that lead into that career.

create table if not exists public.exam_scholarships (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  scholarship_id uuid not null references public.scholarships(id) on delete cascade,
  relevance_note text not null,
  created_at timestamptz not null default now(),
  unique (exam_id, scholarship_id)
);
create table if not exists public.career_scholarships (
  id uuid primary key default gen_random_uuid(),
  career_id uuid not null references public.careers(id) on delete cascade,
  scholarship_id uuid not null references public.scholarships(id) on delete cascade,
  relevance_note text not null,
  created_at timestamptz not null default now(),
  unique (career_id, scholarship_id)
);
create index if not exists exam_scholarships_scholarship on public.exam_scholarships (scholarship_id);
create index if not exists career_scholarships_scholarship on public.career_scholarships (scholarship_id);
alter table public.exam_scholarships enable row level security;
alter table public.career_scholarships enable row level security;
create policy "Public can read exam scholarships" on public.exam_scholarships for select using (true);
create policy "Service role can manage exam scholarships" on public.exam_scholarships for all using (auth.role() = 'service_role');
create policy "Public can read career scholarships" on public.career_scholarships for select using (true);
create policy "Service role can manage career scholarships" on public.career_scholarships for all using (auth.role() = 'service_role');

-- ── Exam links ───────────────────────────────────────────────────────────────
insert into public.exam_scholarships (exam_id, scholarship_id, relevance_note)
select e.id, s.id, v.note
from (values
  ('gate', 'aicte-pg-scholarship-gate-ceed', 'A valid GATE score at admission gets you ₹12,400 a month during an M.E./M.Tech at an AICTE-approved institute'),
  ('ceed', 'aicte-pg-scholarship-gate-ceed', 'A valid CEED score at admission gets you ₹12,400 a month during an M.Des at an AICTE-approved institute'),
  ('csir-net', 'csir-jrf-net-fellowship', 'Qualifying for JRF in CSIR NET pays ₹37,000 a month for the first two years of your PhD, then ₹42,000'),
  ('ugc-net', 'ugc-jrf-net-fellowship', 'Qualifying for JRF in UGC NET pays ₹37,000 a month for the first two years of your M.Phil/PhD, then ₹42,000'),
  ('inspire', 'inspire-scholarship-higher-education', 'The INSPIRE scholarship itself, for B.Sc / integrated M.Sc students in the natural sciences'),
  ('inspire', 'inspire-fellowship-phd', 'INSPIRE scholars with 70%+ in their M.Sc can move on to the INSPIRE PhD fellowship'),
  ('icar-aieea', 'icar-national-talent-scholarship-ug', 'An ICAR All India Quota seat at a university outside your home state pays ₹3,000 a month for the whole degree'),
  ('icar-aieea', 'icar-national-talent-scholarship-pg', 'A master''s seat through the ICAR PG exam at a university outside your home state pays ₹3,000 a month'),
  ('isi-admission-test', 'isi-student-stipends', 'Admission through this test brings a stipend of ₹5,000–₹12,400 a month, depending on the programme'),
  ('cmi-entrance', 'cmi-scholarships', 'Top performers get a full tuition waiver plus ₹5,000 a month (B.Sc) — decided at admission'),
  ('jee-advanced', 'iit-tuition-fee-waiver', 'If you join an IIT: no tuition for SC/ST/PwD students, a full or two-thirds waiver for family income under ₹5 lakh'),
  ('jee-main', 'free-coaching-scheme-sc-obc', 'SC and OBC students (family income up to ₹8 lakh) can get free JEE coaching worth up to ₹75,000 plus ₹4,000 a month'),
  ('jee-advanced', 'free-coaching-scheme-sc-obc', 'SC and OBC students (family income up to ₹8 lakh) can get free JEE coaching worth up to ₹75,000 plus ₹4,000 a month'),
  ('neet-ug', 'free-coaching-scheme-sc-obc', 'SC and OBC students (family income up to ₹8 lakh) can get free NEET coaching worth up to ₹75,000 plus ₹4,000 a month'),
  ('gate', 'free-coaching-scheme-sc-obc', 'SC and OBC students (family income up to ₹8 lakh) can get free GATE coaching worth up to ₹75,000 plus ₹4,000 a month'),
  ('ca-foundation', 'free-coaching-scheme-sc-obc', 'SC and OBC students (family income up to ₹8 lakh) can get free CA Foundation coaching worth up to ₹75,000 plus ₹4,000 a month'),
  ('clat', 'free-coaching-scheme-sc-obc', 'SC and OBC students (family income up to ₹8 lakh) can get free CLAT coaching worth up to ₹50,000 plus ₹4,000 a month'),
  ('cat', 'free-coaching-scheme-sc-obc', 'SC and OBC students (family income up to ₹8 lakh) can get free CAT coaching worth up to ₹50,000 plus ₹4,000 a month'),
  ('gmat', 'free-coaching-scheme-sc-obc', 'SC and OBC students (family income up to ₹8 lakh) can get free GMAT coaching worth up to ₹35,000 plus ₹4,000 a month'),
  ('upsc-cse', 'free-coaching-scheme-sc-obc', 'SC and OBC students (family income up to ₹8 lakh) can get free civil services coaching worth up to ₹75,000, ₹4,000 a month, and ₹15,000 on clearing the mains'),
  ('upsc-ies-iss', 'free-coaching-scheme-sc-obc', 'SC and OBC students (family income up to ₹8 lakh) can get free IES coaching worth up to ₹75,000 plus ₹4,000 a month'),
  ('nda', 'free-coaching-scheme-sc-obc', 'SC and OBC students (family income up to ₹8 lakh) can get free NDA coaching worth up to ₹20,000 plus ₹4,000 a month'),
  ('cds', 'free-coaching-scheme-sc-obc', 'SC and OBC students (family income up to ₹8 lakh) can get free CDS coaching worth up to ₹20,000 plus ₹4,000 a month'),
  ('upsc-cse', 'bihar-sc-st-civil-sewa-protsahan-yojana', 'Bihar SC/ST candidates get ₹1,00,000 on clearing the UPSC prelims'),
  ('bpsc', 'bihar-sc-st-civil-sewa-protsahan-yojana', 'Bihar SC/ST candidates get ₹50,000 on clearing the BPSC prelims'),
  ('upsc-cse', 'bihar-ebc-civil-seva-protsahan-yojana', 'Bihar EBC candidates get ₹1,00,000 on clearing the UPSC prelims'),
  ('upsc-ies-iss', 'bihar-ebc-civil-seva-protsahan-yojana', 'Bihar EBC candidates get ₹75,000 on clearing the first stage'),
  ('bpsc', 'bihar-ebc-civil-seva-protsahan-yojana', 'Bihar EBC candidates get ₹50,000 on clearing the BPSC prelims'),
  ('cds', 'bihar-ebc-civil-seva-protsahan-yojana', 'Bihar EBC candidates get ₹50,000 on clearing the written exam'),
  ('nda', 'bihar-ebc-civil-seva-protsahan-yojana', 'Bihar EBC candidates get ₹50,000 on clearing the written exam'),
  ('capf-ac', 'bihar-ebc-civil-seva-protsahan-yojana', 'Bihar EBC candidates get ₹50,000 on clearing the written exam'),
  ('rbi-grade-b', 'bihar-ebc-civil-seva-protsahan-yojana', 'Bihar EBC candidates get ₹30,000 on clearing the prelims'),
  ('sbi-po', 'bihar-ebc-civil-seva-protsahan-yojana', 'Bihar EBC candidates get ₹30,000 on clearing the prelims'),
  ('ibps-po', 'bihar-ebc-civil-seva-protsahan-yojana', 'Bihar EBC candidates get ₹30,000 on clearing the prelims'),
  ('lic-aao', 'bihar-ebc-civil-seva-protsahan-yojana', 'Bihar EBC candidates get ₹30,000 on clearing the prelims'),
  ('ssc-cgl', 'bihar-ebc-civil-seva-protsahan-yojana', 'Bihar EBC candidates get ₹30,000 on clearing the first stage'),
  ('rrb-ntpc', 'bihar-ebc-civil-seva-protsahan-yojana', 'Bihar EBC candidates get ₹30,000 on clearing the first stage'),
  ('rrb-je', 'bihar-ebc-civil-seva-protsahan-yojana', 'Bihar EBC candidates get ₹30,000 on clearing the first stage'),
  ('uppsc', 'bihar-ebc-civil-seva-protsahan-yojana', 'Bihar EBC candidates get ₹50,000 on clearing another state''s PSC prelims'),
  ('mppsc', 'bihar-ebc-civil-seva-protsahan-yojana', 'Bihar EBC candidates get ₹50,000 on clearing another state''s PSC prelims'),
  ('mpsc', 'bihar-ebc-civil-seva-protsahan-yojana', 'Bihar EBC candidates get ₹50,000 on clearing another state''s PSC prelims'),
  ('kpsc', 'bihar-ebc-civil-seva-protsahan-yojana', 'Bihar EBC candidates get ₹50,000 on clearing another state''s PSC prelims'),
  ('rpsc-ras', 'bihar-ebc-civil-seva-protsahan-yojana', 'Bihar EBC candidates get ₹50,000 on clearing another state''s PSC prelims'),
  ('tnpsc-group1', 'bihar-ebc-civil-seva-protsahan-yojana', 'Bihar EBC candidates get ₹50,000 on clearing another state''s PSC prelims')
) as v(exam_slug, scholarship_slug, note)
join public.exams e on e.slug = v.exam_slug
join public.scholarships s on s.slug = v.scholarship_slug
on conflict (exam_id, scholarship_id) do nothing;

-- Free coaching also covers state PSC, SSC, railway, banking, insurance and PSU exams
insert into public.exam_scholarships (exam_id, scholarship_id, relevance_note)
select e.id, s.id, case
    when e.slug in ('bpsc','uppsc','mppsc','mpsc','kpsc','rpsc-ras','tnpsc-group1')
      then 'SC and OBC students (family income up to ₹8 lakh) can get free State PSC coaching worth up to ₹75,000, ₹4,000 a month, and ₹15,000 on clearing the mains'
    when e.slug ~ '^(ssc-|rrb-)'
      then 'SC and OBC students (family income up to ₹8 lakh) can get free SSC/RRB coaching worth up to ₹40,000 plus ₹4,000 a month'
    else 'SC and OBC students (family income up to ₹8 lakh) can get free banking/insurance coaching worth up to ₹50,000 plus ₹4,000 a month' end
from public.exams e
cross join public.scholarships s
where s.slug = 'free-coaching-scheme-sc-obc'
  and e.slug in ('bpsc','uppsc','mppsc','mpsc','kpsc','rpsc-ras','tnpsc-group1',
                 'ssc-cgl','ssc-chsl','ssc-mts','ssc-gd','ssc-cpo','ssc-je','ssc-steno',
                 'rrb-ntpc','rrb-je','rrb-alp','rrb-group-d',
                 'sbi-po','sbi-clerk','ibps-po','ibps-clerk','ibps-so','rbi-grade-b','rbi-assistant',
                 'nabard-grade-a','sebi-grade-a','lic-aao','lic-ado','irda-am')
on conflict (exam_id, scholarship_id) do nothing;

-- ── Career links (the studies that lead into the career) ─────────────────────
insert into public.career_scholarships (career_id, scholarship_id, relevance_note)
select c.id, s.id, v.note
from (values
  ('Engineering', 'aicte-pragati-scholarship-girls', 'For girls in an engineering degree or diploma'),
  ('Engineering', 'aicte-saksham-scholarship', 'For students with a disability in an engineering degree or diploma'),
  ('Engineering', 'aicte-swanath-scholarship-scheme', 'For orphans and wards of martyrs in an engineering degree or diploma'),
  ('Engineering', 'aicte-pg-scholarship-gate-ceed', 'For an M.Tech after a valid GATE score'),
  ('Technology', 'aicte-pragati-scholarship-girls', 'For girls in an engineering degree or diploma'),
  ('Technology', 'aicte-saksham-scholarship', 'For students with a disability in an engineering degree or diploma'),
  ('Technology', 'aicte-swanath-scholarship-scheme', 'For orphans and wards of martyrs in an engineering degree or diploma'),
  ('Technology', 'aicte-pg-scholarship-gate-ceed', 'For an M.Tech after a valid GATE score'),
  ('Research', 'inspire-scholarship-higher-education', 'For a B.Sc / integrated M.Sc in the natural sciences'),
  ('Research', 'inspire-fellowship-phd', 'For a PhD after a 1st rank in your master''s'),
  ('Research', 'csir-jrf-net-fellowship', 'For a PhD in the sciences after CSIR NET'),
  ('Research', 'prime-ministers-research-fellowship-pmrf', 'For a PhD at a participating institute such as an IIT, IISc or IISER')
) as v(category, scholarship_slug, note)
join public.careers c on c.category = v.category
join public.scholarships s on s.slug = v.scholarship_slug
on conflict (career_id, scholarship_id) do nothing;

insert into public.career_scholarships (career_id, scholarship_id, relevance_note)
select c.id, s.id, v.note
from (values
  ('agricultural-extension-officer', 'icar-national-talent-scholarship-ug', 'For a B.Sc Agriculture on an ICAR All India Quota seat outside your home state'),
  ('agronomist', 'icar-national-talent-scholarship-ug', 'For a B.Sc Agriculture on an ICAR All India Quota seat outside your home state'),
  ('horticulturist', 'icar-national-talent-scholarship-ug', 'For a B.Sc Horticulture on an ICAR All India Quota seat outside your home state'),
  ('food-technologist', 'icar-national-talent-scholarship-ug', 'For a food technology degree on an ICAR All India Quota seat outside your home state'),
  ('agricultural-engineer', 'icar-national-talent-scholarship-ug', 'For an agricultural engineering degree on an ICAR All India Quota seat outside your home state'),
  ('agricultural-scientist', 'icar-national-talent-scholarship-ug', 'For a B.Sc Agriculture on an ICAR All India Quota seat outside your home state'),
  ('agricultural-scientist', 'icar-national-talent-scholarship-pg', 'For an M.Sc at an agricultural university outside your home state'),
  ('agronomist', 'icar-national-talent-scholarship-pg', 'For an M.Sc at an agricultural university outside your home state'),
  ('horticulturist', 'icar-national-talent-scholarship-pg', 'For an M.Sc at an agricultural university outside your home state'),
  ('statistician', 'isi-student-stipends', 'B.Stat and M.Stat students at ISI get ₹5,000–₹8,000 a month'),
  ('actuary', 'isi-student-stipends', 'B.Stat and M.Stat students at ISI get ₹5,000–₹8,000 a month'),
  ('data-scientist', 'isi-student-stipends', 'ISI students in statistics, data science and M.Tech CS get ₹5,000–₹12,400 a month'),
  ('quantitative-analyst', 'isi-student-stipends', 'B.Stat, M.Stat and MS (QE) students at ISI get ₹5,000–₹8,000 a month'),
  ('economist', 'isi-student-stipends', 'MS (Quantitative Economics) students at ISI get ₹8,000 a month'),
  ('cryptographer', 'isi-student-stipends', 'M.Tech Cryptology & Security students at ISI get ₹12,400 a month'),
  ('mathematician', 'isi-student-stipends', 'B.Math and M.Math students at ISI get ₹5,000–₹8,000 a month'),
  ('mathematician', 'cmi-scholarships', 'B.Sc and M.Sc Mathematics students at CMI: full tuition waivers and ₹5,000–₹6,000 a month'),
  ('data-scientist', 'cmi-scholarships', 'Scholarships for B.Sc Mathematics & Computer Science at CMI'),
  ('cryptographer', 'cmi-scholarships', 'Scholarships for B.Sc / M.Sc Mathematics & Computer Science at CMI'),
  ('professor', 'ugc-jrf-net-fellowship', 'NET-JRF pays ₹37,000–₹42,000 a month during your PhD'),
  ('academic-researcher', 'ugc-jrf-net-fellowship', 'NET-JRF pays ₹37,000–₹42,000 a month during your PhD'),
  ('historian', 'ugc-jrf-net-fellowship', 'NET-JRF pays ₹37,000–₹42,000 a month during your PhD'),
  ('linguist', 'ugc-jrf-net-fellowship', 'NET-JRF pays ₹37,000–₹42,000 a month during your PhD'),
  ('archaeologist', 'ugc-jrf-net-fellowship', 'NET-JRF pays ₹37,000–₹42,000 a month during your PhD'),
  ('economist', 'ugc-jrf-net-fellowship', 'NET-JRF pays ₹37,000–₹42,000 a month during your PhD'),
  ('professor', 'csir-jrf-net-fellowship', 'For science faculty: CSIR NET-JRF pays ₹37,000–₹42,000 a month during your PhD'),
  ('performing-artist', 'ccrt-scholarship-young-artistes-cultural-fields', 'For young artists training in classical, folk and other cultural fields')
) as v(career_slug, scholarship_slug, note)
join public.careers c on c.slug = v.career_slug
join public.scholarships s on s.slug = v.scholarship_slug
on conflict (career_id, scholarship_id) do nothing;

-- Career-specific links (ISI, CMI, ICAR, UGC JRF …) are listed before the ones made for a whole category
alter table public.career_scholarships add column if not exists sort_order smallint not null default 0;
update public.career_scholarships cs set sort_order = 1
from public.scholarships s
where s.id = cs.scholarship_id
  and s.slug in ('aicte-pragati-scholarship-girls','aicte-saksham-scholarship','aicte-swanath-scholarship-scheme',
                 'aicte-pg-scholarship-gate-ceed','inspire-scholarship-higher-education','inspire-fellowship-phd',
                 'csir-jrf-net-fellowship','prime-ministers-research-fellowship-pmrf')
  and cs.relevance_note not like 'For science faculty%';
