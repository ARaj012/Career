-- Scholarship amounts in plain words (24 Nov 2026).
-- amount_note: one line under the amount when the money is not a single figure —
-- a fee waiver, different rates per programme or exam, or a stipend plus a waiver.
-- When a scholarship has no figure at all (fee waivers), the note is shown as the amount.
-- Every note restates figures already on the record, read from the official sources
-- listed in scholarships-exams-colleges-2026-11.sql.

alter table public.scholarships add column if not exists amount_note text;

update public.scholarships s set amount_note = v.note
from (values
  ('iit-tuition-fee-waiver', 'Tuition fee waiver: full for SC/ST/PwD students and for family income under ₹1 lakh; two-thirds for family income of ₹1–5 lakh'),
  ('inspire-fellowship-phd', 'Monthly fellowship at DST''s JRF rate, then the SRF rate after upgrade, plus HRA and up to ₹20,000 a year for research costs'),
  ('cmi-scholarships', 'Plus a full tuition waiver (tuition is ₹1,25,000 a semester). ₹5,000 a month for B.Sc, ₹6,000 for M.Sc fellowships'),
  ('isi-student-stipends', '₹5,000 a month for B.Stat/B.Math, ₹8,000 for M.Stat, M.Math and MS, ₹12,400 for M.Tech'),
  ('free-coaching-scheme-sc-obc', 'Plus free coaching: fees paid up to ₹20,000–₹75,000 depending on the exam, and ₹15,000 for clearing the civil services mains'),
  ('pm-scholarship-scheme-ex-servicemen-wards', 'Boys ₹2,500 and girls ₹3,000 a month (₹30,000 / ₹36,000 a year), paid once a year'),
  ('bihar-sc-st-civil-sewa-protsahan-yojana', 'One-time award: ₹1,00,000 for clearing UPSC prelims, ₹50,000 for BPSC prelims'),
  ('bihar-ebc-civil-seva-protsahan-yojana', 'One-time award, depending on the exam whose prelims you clear (₹1,00,000 for UPSC Civil Services)'),
  ('csir-jrf-net-fellowship', '₹37,000 a month for the first two years, then ₹42,000 as SRF, plus ₹20,000 a year for research costs'),
  ('ugc-jrf-net-fellowship', '₹37,000 a month for the first two years, then ₹42,000 as SRF, plus a yearly contingency grant'),
  ('aicte-pg-scholarship-gate-ceed', 'For up to 24 months of the M.E./M.Tech/M.Arch/M.Des')
) as v(slug, note)
where s.slug = v.slug;

-- College scholarship pages read this view; expose the note there too
create or replace view public.college_scholarships_detail with (security_invoker = true) as
 SELECT cs.id AS link_id, cs.college_id, c.slug AS college_slug, c.name AS college_name, c.state AS college_state,
    cs.scholarship_id, s.name AS scholarship_name, s.slug AS scholarship_slug, s.provider, s.category, s.level,
    s.field_of_study, s.amount_type, s.amount_min, s.amount_max, s.application_deadline, s.application_url,
    s.eligibility_criteria, s.required_documents, s.how_to_apply, s.state AS scholarship_state,
    cs.match_type, cs.relevance_note, s.amount_note
   FROM college_scholarships cs
     JOIN colleges c ON c.id = cs.college_id
     JOIN scholarships s ON s.id = cs.scholarship_id
  WHERE s.is_active = true;
