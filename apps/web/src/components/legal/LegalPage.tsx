import Link from 'next/link'
import SectionNav from '@/components/SectionNav'
import { CONTACT_EMAIL } from '@/lib/brand'

export type LegalSection = { id: string; label: string; title: string; body: React.ReactNode }

/** Shared layout for the Privacy Policy and Terms of Use: plain, readable, with "On this page" links */
export default function LegalPage({ title, updated, intro, sections, other }: {
  title: string
  updated: string
  intro: React.ReactNode
  sections: LegalSection[]
  other: { href: string; label: string }
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <header className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">Last updated {updated}</p>
          <div className="mt-4 text-gray-700 leading-relaxed space-y-3">{intro}</div>
        </header>

        <SectionNav
          sections={sections.map(({ id, label }) => ({ id, label }))}
          className="-mx-4 px-4 sm:-mx-6 sm:px-6 bg-gray-50 mb-4"
        />

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="p-5 sm:p-7 scroll-mt-32">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">{s.title}</h2>
              <div className="text-gray-700 leading-relaxed space-y-3 text-[15px] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-indigo-600 [&_a]:underline [&_a]:underline-offset-2">
                {s.body}
              </div>
            </section>
          ))}
        </div>

        <p className="text-sm text-gray-500 mt-6">
          See also our <Link href={other.href} className="text-indigo-600 hover:underline">{other.label}</Link>.
        </p>
      </div>
    </div>
  )
}

/** How to reach us: the contact email. Until it is set, a visible reminder shows while developing. */
export function Contact() {
  if (CONTACT_EMAIL) return <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
  return process.env.NODE_ENV === 'development'
    ? <mark className="bg-amber-100 text-amber-800 px-1 rounded">contact email (set NEXT_PUBLIC_CONTACT_EMAIL)</mark>
    : <>the Snova team</>
}
