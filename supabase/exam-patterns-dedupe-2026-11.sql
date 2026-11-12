-- Duplicate exam_pattern rows (they showed up as extra "Stage" tabs) and the unsourced NAAC "A+"
-- on ISI Kolkata (a labelled "Not NAAC-graded" note shows instead).

-- ---------------------------------------------------------------------------------------
-- APPLIED 13 Nov 2026 with the owner's OK (migration exam_patterns_dedupe_2026_11).
begin;

delete from public.exam_pattern where id in (
  '0ad4b60a-f4ae-45c4-ad52-5921dd5e57f6', -- ca-final overview duplicating Group 1 / Group 2
  'ff5d80fb-e49b-47a7-85e6-4efc5b1757a7', -- ca-intermediate overview duplicating Group 1 / Group 2
  '739e50ca-527b-4798-8c19-29e31cb9bf94', -- ca-foundation second copy of the same pattern
  'a974b3dd-eda9-4b19-a35c-ea10cfb73126', -- cs-foundation pattern of a programme ICSI discontinued in 2020
  '983d3d4f-c6e0-4cac-8c40-27631af1d191', -- gmat second copy of the Focus Edition pattern
  '32912afa-4358-460a-a234-07419282966c', -- irda-am older Phase I (superseded by "Phase 1")
  '672b2472-3214-4354-bfa3-9f70239c6d2b', -- irda-am older Phase II (superseded by "Phase 2")
  '9a6740d8-0097-4e4d-9b74-6fc3dd55004b', -- usmle overview duplicating Step 1 / Step 2 CK / Step 3
  'c43e2586-5a21-42f8-8039-d5bc62bd963c', -- amu-mbbs older copy without total marks
  '2491baa7-7300-4e29-9ec3-8734cf36a08d', -- bhu-pmt older copy with no figures
  'd8a261d5-337f-4b21-9529-61c871555d17', -- cfa-level1 older copy without total marks
  '30524a42-6de0-410d-9a84-6f3755c37a5b', -- nmat older copy without total marks
  '9b65fc4f-6fac-4446-87b1-2a6e6412cc3b', -- pgimer older copy with no figures
  '0ec19aa9-56b4-44ce-a01d-efc648ea2215', -- frm-part1 identical copy
  '0a92a752-2b02-491a-a87f-00816c451a98', -- nchmct-jee identical copy
  '6fd309fc-6491-48b3-8ec6-3782732522db'  -- neet-mds identical copy
);

-- ISI centres: no NAAC grade on record (shown instead as a labelled note, see supabase/estimates/colleges.py)
update public.colleges set naac_grade = null where slug = 'isi-kolkata' and naac_grade = 'A+';

commit;

-- ---------------------------------------------------------------------------------------
-- NOT YET APPLIED: proposed by the pattern-verification session on 12 Nov 2026 after checking
-- each against the official source (see exam-patterns-verify-2026-11.sql; the kept row was
-- updated). Run only after the owner approves.
begin;

delete from public.exam_pattern where id in (
  '2b6a4dde-623a-4891-a03f-42fc65d49e84', -- cma-foundation: 400 one-mark questions, 3 h, -0.25 (ICMAI Dec 2026: 200 MCQs x 2 marks, no negative)
  '0996a004-dba5-4054-bae7-ae0ca88fe667', -- mat: 200 questions in 150 min (AIMA: 150 questions in 120 min)
  '7a4d25ae-cddb-4827-a00e-6abbf07347f0', -- kiitee: second copy of the B.Tech pattern (kept row 53716e45)
  '74d234da-99e2-4526-a3a4-1b602b413ec3', -- cseet: remote-proctored 200-mark format, ended January 2026 (ICSI)
  '1a8c48de-559d-4969-a0a1-a05fc7428666'  -- bhu-llb: old BHU UET law paper; BHU now admits via CUET-UG / CUET-PG (named stages)
);

commit;
