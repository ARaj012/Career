-- Official pay for the BPSC careers, from the pay levels printed in BPSC's Integrated 72nd
-- Combined Competitive Examination advertisement (Table I and Table II, "वेतनमान" column):
-- https://bpsc.bihar.gov.in/wp-content/uploads/BPSC_content/Notices/Advertisement-Integrated-72th-CCE-PT_BPSC-20260505-p1euvo.pdf
-- Starting basic pay of each level is from the 7th Pay Commission pay matrix that Bihar follows:
-- Level 9 = ₹53,100, Level 7 = ₹44,900 a month.

update public.careers c set
  official_pay = v.pay,
  official_pay_min = v.basic
from (values
  ('bihar-administrative-service-officer',  'Pay Level 9 (starting basic pay ₹53,100 a month), plus dearness allowance, HRA and other allowances', 53100),
  ('bihar-police-dsp',                      'Pay Level 9 (starting basic pay ₹53,100 a month), plus dearness allowance, HRA and other allowances', 53100),
  ('bihar-state-tax-assistant-commissioner','Pay Level 9 (starting basic pay ₹53,100 a month), plus dearness allowance, HRA and other allowances', 53100),
  ('bihar-labour-superintendent',           'Pay Level 9 (starting basic pay ₹53,100 a month), plus dearness allowance, HRA and other allowances', 53100),
  ('bihar-assistant-registrar-cooperative', 'Pay Level 9 (starting basic pay ₹53,100 a month), plus dearness allowance, HRA and other allowances', 53100),
  ('bihar-education-service-officer',       'Pay Level 9 (starting basic pay ₹53,100 a month), plus dearness allowance, HRA and other allowances', 53100),
  ('bihar-probation-officer',               'Pay Level 9 (starting basic pay ₹53,100 a month), plus dearness allowance, HRA and other allowances', 53100),
  ('bihar-cdpo',                            'Pay Level 9 (starting basic pay ₹53,100 a month), plus dearness allowance, HRA and other allowances', 53100),
  ('bihar-financial-administrative-officer','Pay Level 9 (starting basic pay ₹53,100 a month), plus dearness allowance, HRA and other allowances', 53100),
  ('bihar-municipal-executive-officer',     'Pay Level 7 (starting basic pay ₹44,900 a month), plus dearness allowance, HRA and other allowances', 44900),
  ('bihar-rural-development-officer',       'Pay Level 7 (starting basic pay ₹44,900 a month), plus dearness allowance, HRA and other allowances', 44900),
  ('bihar-revenue-officer',                 'Pay Level 7 (starting basic pay ₹44,900 a month), plus dearness allowance, HRA and other allowances', 44900),
  ('bihar-block-panchayati-raj-officer',    'Pay Level 7 (starting basic pay ₹44,900 a month), plus dearness allowance, HRA and other allowances', 44900),
  ('bihar-cooperative-extension-officer',   'Pay Level 7 (starting basic pay ₹44,900 a month), plus dearness allowance, HRA and other allowances', 44900),
  ('bihar-labour-enforcement-officer',      'Pay Level 7 (starting basic pay ₹44,900 a month), plus dearness allowance, HRA and other allowances', 44900),
  ('bihar-supply-inspector',                'Pay Level 7 (starting basic pay ₹44,900 a month), plus dearness allowance, HRA and other allowances', 44900)
) as v(slug, pay, basic)
where c.slug = v.slug and c.official_pay is null;
