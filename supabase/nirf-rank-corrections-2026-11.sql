-- NIRF rank corrections, November 2026
--
-- 65 colleges carried a rank with no year (typed by hand, mostly from magazine
-- rankings; NIRF does not rank hotel management, fashion, design or media
-- institutes at all). Each was checked against every NIRF 2025 list on
-- nirfindia.org, including the 101-150 / 151-200 / 201-300 band pages.
--   * 11 are in a NIRF 2025 band  -> nirf_band set, nirf_rank cleared
--   *  2 are ranked under their parent university -> rank + note
--   * 52 are not in any NIRF 2025 list -> rank cleared
-- The previous values are in the RESTORE block at the end.

alter table public.colleges add column if not exists nirf_band text;
alter table public.colleges add column if not exists nirf_note text;
comment on column public.colleges.nirf_band is 'NIRF rank band (e.g. 101-150) when the institute is ranked beyond the numbered list';
comment on column public.colleges.nirf_note is 'How the NIRF rank applies, e.g. ranked under the parent university';

-- In a NIRF 2025 rank band
update public.colleges c set nirf_rank = null, nirf_band = v.band, nirf_year = 2025, nirf_category = v.cat, nirf_note = null
from (values
  ('4f363fbc-0187-49bc-b44b-52f882b5a6f5'::uuid, 'University',  '101-150'), -- Pondicherry University
  ('899d0953-11fa-486a-9a0a-bb1a3266b74b'::uuid, 'Engineering', '101-150'), -- IIIT Allahabad
  ('3f846fd8-09ea-4b6f-8ca8-85eec6859aa4'::uuid, 'Engineering', '101-150'), -- VJTI
  ('ecb4f6af-6f13-4766-be9e-c1c8edb4d571'::uuid, 'Engineering', '101-150'), -- Siddaganga Institute of Technology
  ('98e612f6-4195-46b2-bde7-aa9077960593'::uuid, 'Engineering', '101-150'), -- RV College of Engineering
  ('292c615e-03a3-429a-9cee-f5cfae7a5443'::uuid, 'Engineering', '151-200'), -- BMS College of Engineering
  ('93e0dd92-5655-48bf-8eb7-de5516ed70dc'::uuid, 'Engineering', '201-300'), -- DA-IICT
  ('8ec7fa41-77df-4091-90f4-8758297ebcbb'::uuid, 'Management',  '101-150'), -- LBSIM Delhi
  ('64078bc0-0169-4190-b78f-75a08cba592b'::uuid, 'Pharmacy',    '101-150'), -- Bombay College of Pharmacy
  ('1a707bb7-21dd-46e4-9667-153d5cb87f61'::uuid, 'College',     '101-150'), -- College of Social Work Nirmala Niketan
  ('fcc5563b-5006-49e0-abda-f55e80b08c65'::uuid, 'Overall',     '151-200')  -- IISER Thiruvananthapuram
) v(id, cat, band) where c.id = v.id;

-- Ranked under the parent university (Amrita Vishwa Vidyapeetham, whose medical and pharmacy schools are in Kochi)
update public.colleges set nirf_rank = 9, nirf_band = null, nirf_year = 2025, nirf_category = 'Medical',
  nirf_note = 'Ranked as Amrita Vishwa Vidyapeetham (parent university)' where id = '542e61e5-0a76-49d3-8efb-a72e1841d772';
update public.colleges set nirf_rank = 14, nirf_band = null, nirf_year = 2025, nirf_category = 'Pharmacy',
  nirf_note = 'Ranked as Amrita Vishwa Vidyapeetham (parent university)' where id = 'c3daeffe-ebf9-4030-94a0-9365cc201c41';

-- Not in any NIRF 2025 list: the year-less number was not a NIRF rank
update public.colleges set nirf_rank = null, nirf_category = null, nirf_note = null
where nirf_year is null and nirf_rank is not null and id in (
  'bdbaa32d-88c4-49e8-a66c-ab4aaa16a949','0bbeea3c-e2e3-4cab-b6b3-c30e83361213','20d33783-23ed-4af3-9513-245b90ff5b06',
  '027a4cfe-9fd8-4aa4-86e6-8ea5b2c06c05','593b2aac-b671-4b65-bc20-3115952b19a9','db9fbaed-40ac-47cb-ab12-940071d0995c',
  '7bdc5451-f3c6-4e56-bc6d-5f6c23c3b6c8','9136dcab-54c3-46bf-80d7-baedf86a5479','910477ae-f98e-4db8-a015-962a619202bb',
  '47917a40-d72c-4a45-85d9-4c35b95a7462','dca7f0a9-9240-4700-bc4f-bde3d1ce9ccd','d338b1d2-42b0-427f-9ff7-59ed6430b1b7',
  'e2ad4d70-2f18-477a-aa04-2211348f99b1','01251de8-74c2-4ef7-9cdf-9dc14f1d3354','055a48a0-8805-482a-b1a2-dbcdc5465af1',
  '8d8a87ff-7d65-4338-acae-42cc37306546','4f95f63b-cd92-4172-ba03-d34a7812128c','10df7f1c-96b1-4d62-8e98-89651383e313',
  'd104c24d-c221-4f63-ab50-c9381ca08ff8','64a50af1-3290-4f85-a776-18e88eb4a06e','07b4a338-8545-4dd9-8b19-c7d3fb61dc41',
  '6492e035-019d-48d3-98bf-df3aec4a873e','e2e9c6a6-30fd-4f46-995a-ad45380d2545','e5b6f1c1-ddb2-4ccf-bb04-ff31a57f573e',
  '2ca23f9b-c768-4eb5-8159-1cf6c3c7eb2f','8b000299-b262-4743-b6e9-9b252a9003ab','65db51d3-3d19-4765-8120-a21d7d9fb74f',
  '2dffe127-3958-4190-88ac-08e36b273265','a12a62b7-299f-4b05-a26c-2ac446e4429b','0f201f25-f541-4b48-941a-d3b6f75e483a',
  'c4a1c63d-f229-429d-b5ac-cc8ac8c6ba71','8c8c9154-d71e-40cb-a49c-0e3665eb78f7','89c9a35d-9711-462c-9db3-41e239d63efe',
  '0c07bdfb-04df-4f48-b490-ed45c7d71a89','9df7ce58-5eda-4861-a0a9-24a2aa60b2cd','278d1d63-1c5c-4925-a41d-664075ad56d7',
  '136cec3f-0f8f-448e-bbaa-4b27f09cc507','948ac152-d20f-4cbc-be00-fb72432c3c20','5ce2dcd8-37e2-47ba-bd82-f393fcd1c57f',
  '809b0597-cacd-421b-9a81-6d420d21b84f','6a023858-3878-4dc2-b954-bd4e18d1f0d0','6277700d-c7b7-4ac2-a92a-ce4cc0971ee1',
  '6a91be98-3fb0-4ddd-95a1-63a4ac00ea2f','c98dac5a-8f31-4267-8194-1e44077121ea','f11d543d-85bd-492f-8ab0-ed5480ac7b7e',
  'b8d13ec0-ad03-42ed-9e3b-0f4c9fa876f2','69dcee8a-9300-42b8-a955-251b2840aad4','5a611a67-d5ec-4079-a086-3d9277584b0c',
  '61437689-f5e6-4972-a183-24c1d0bb53a5','71edd7cc-ed60-4713-a936-6255c7d774f4','ff5193f8-d7d8-4679-a6a2-cc7c586dc6ec',
  '53b4a744-57ae-444c-af1f-c7cee748bd41'
);

-- BHU Faculty of Law: not in the NIRF 2025 Law list; #16 is the university's Research rank
update public.colleges set nirf_rank = null where id = '22b38e4b-d40b-45e1-8fa9-4b1d99ad4feb' and nirf_year is null;
-- restore: update public.colleges set nirf_rank = 16 where id = '22b38e4b-d40b-45e1-8fa9-4b1d99ad4feb';

-- The 65 review items are settled by the above
update public.automation_proposals set status = 'rejected', reviewed_at = now(), reviewed_by = 'nirf-check-2026-11'
where status = 'pending' and label like '%not in the NIRF%';

-- RESTORE (previous values; nirf_year and nirf_category were null for all 65)
-- update public.colleges c set nirf_rank = v.r, nirf_year = null, nirf_category = null, nirf_band = null, nirf_note = null from (values
--  ('bdbaa32d-88c4-49e8-a66c-ab4aaa16a949'::uuid,6),('0bbeea3c-e2e3-4cab-b6b3-c30e83361213',4),('292c615e-03a3-429a-9cee-f5cfae7a5443',67),
--  ('64078bc0-0169-4190-b78f-75a08cba592b',4),('20d33783-23ed-4af3-9513-245b90ff5b06',20),('027a4cfe-9fd8-4aa4-86e6-8ea5b2c06c05',4),
--  ('593b2aac-b671-4b65-bc20-3115952b19a9',10),('fcc5563b-5006-49e0-abda-f55e80b08c65',27),('ecb4f6af-6f13-4766-be9e-c1c8edb4d571',101),
--  ('db9fbaed-40ac-47cb-ab12-940071d0995c',7),('7bdc5451-f3c6-4e56-bc6d-5f6c23c3b6c8',6),('98e612f6-4195-46b2-bde7-aa9077960593',69),
--  ('9136dcab-54c3-46bf-80d7-baedf86a5479',25),('93e0dd92-5655-48bf-8eb7-de5516ed70dc',53),('910477ae-f98e-4db8-a015-962a619202bb',5),
--  ('47917a40-d72c-4a45-85d9-4c35b95a7462',7),('dca7f0a9-9240-4700-bc4f-bde3d1ce9ccd',8),('542e61e5-0a76-49d3-8efb-a72e1841d772',10),
--  ('d338b1d2-42b0-427f-9ff7-59ed6430b1b7',3),('e2ad4d70-2f18-477a-aa04-2211348f99b1',8),('01251de8-74c2-4ef7-9cdf-9dc14f1d3354',5),
--  ('8ec7fa41-77df-4091-90f4-8758297ebcbb',19),('055a48a0-8805-482a-b1a2-dbcdc5465af1',2),('8d8a87ff-7d65-4338-acae-42cc37306546',180),
--  ('4f95f63b-cd92-4172-ba03-d34a7812128c',35),('10df7f1c-96b1-4d62-8e98-89651383e313',13),('d104c24d-c221-4f63-ab50-c9381ca08ff8',38),
--  ('64a50af1-3290-4f85-a776-18e88eb4a06e',1),('07b4a338-8545-4dd9-8b19-c7d3fb61dc41',15),('6492e035-019d-48d3-98bf-df3aec4a873e',3),
--  ('e2e9c6a6-30fd-4f46-995a-ad45380d2545',2),('e5b6f1c1-ddb2-4ccf-bb04-ff31a57f573e',6),('2ca23f9b-c768-4eb5-8159-1cf6c3c7eb2f',7),
--  ('1a707bb7-21dd-46e4-9667-153d5cb87f61',6),('8b000299-b262-4743-b6e9-9b252a9003ab',2),('65db51d3-3d19-4765-8120-a21d7d9fb74f',4),
--  ('4f363fbc-0187-49bc-b44b-52f882b5a6f5',35),('2dffe127-3958-4190-88ac-08e36b273265',8),('a12a62b7-299f-4b05-a26c-2ac446e4429b',6),
--  ('899d0953-11fa-486a-9a0a-bb1a3266b74b',34),('0f201f25-f541-4b48-941a-d3b6f75e483a',8),('c4a1c63d-f229-429d-b5ac-cc8ac8c6ba71',5),
--  ('8c8c9154-d71e-40cb-a49c-0e3665eb78f7',9),('89c9a35d-9711-462c-9db3-41e239d63efe',225),('0c07bdfb-04df-4f48-b490-ed45c7d71a89',6),
--  ('9df7ce58-5eda-4861-a0a9-24a2aa60b2cd',1),('278d1d63-1c5c-4925-a41d-664075ad56d7',5),('136cec3f-0f8f-448e-bbaa-4b27f09cc507',5),
--  ('948ac152-d20f-4cbc-be00-fb72432c3c20',12),('5ce2dcd8-37e2-47ba-bd82-f393fcd1c57f',1),('809b0597-cacd-421b-9a81-6d420d21b84f',1),
--  ('6a023858-3878-4dc2-b954-bd4e18d1f0d0',2),('6277700d-c7b7-4ac2-a92a-ce4cc0971ee1',5),('3f846fd8-09ea-4b6f-8ca8-85eec6859aa4',125),
--  ('c3daeffe-ebf9-4030-94a0-9365cc201c41',5),('6a91be98-3fb0-4ddd-95a1-63a4ac00ea2f',22),('c98dac5a-8f31-4267-8194-1e44077121ea',8),
--  ('f11d543d-85bd-492f-8ab0-ed5480ac7b7e',6),('b8d13ec0-ad03-42ed-9e3b-0f4c9fa876f2',5),('69dcee8a-9300-42b8-a955-251b2840aad4',5),
--  ('5a611a67-d5ec-4079-a086-3d9277584b0c',2),('61437689-f5e6-4972-a183-24c1d0bb53a5',3),('71edd7cc-ed60-4713-a936-6255c7d774f4',7),
--  ('ff5193f8-d7d8-4679-a6a2-cc7c586dc6ec',14),('53b4a744-57ae-444c-af1f-c7cee748bd41',4)
-- ) v(id, r) where c.id = v.id;
