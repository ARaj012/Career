import { BadgeCheck, ClipboardCheck, ExternalLink, FileBadge, IndianRupee, ListOrdered } from 'lucide-react'

type Item = { text: string; source_url: string }

export interface OfficialCareerFactsProps {
  title: string
  officialBody: string | null
  officialUrl: string | null
  eligibility: Item[] | null
  howToEnter: Item[] | null
  licence: string | null
  officialPay: string | null
  sourceUrl: string | null
  verifiedAt: string | null
}

/**
 * How to enter a career, in the official body's own words. Every line is a
 * sentence copied from its website by the automation, so nothing is paraphrased.
 */
export default function OfficialCareerFacts({
  title, officialBody, officialUrl, eligibility, howToEnter, licence, officialPay, sourceUrl, verifiedAt,
}: OfficialCareerFactsProps) {
  const elig = eligibility ?? []
  const steps = howToEnter ?? []
  if (!elig.length && !steps.length && !licence && !officialPay) {
    if (!officialBody || !officialUrl) return null
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">How to become a {title}</h2>
        <p className="text-sm text-gray-600">
          Entry rules are set by{' '}
          <a href={officialUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{officialBody}</a>.
          We are still reading them from its official website.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
        <h2 className="text-lg font-semibold text-gray-900">How to become a {title}</h2>
        {sourceUrl && (
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline">
            <BadgeCheck className="w-3.5 h-3.5" /> Official{officialBody ? ` · ${officialBody}` : ''} <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-5">
        In the official body&apos;s own words{verifiedAt ? `, checked ${new Date(verifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}.
      </p>

      <div className="space-y-5">
        {elig.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2"><ClipboardCheck className="w-4 h-4 text-indigo-500" /> Who can apply</h3>
            <ul className="space-y-2">
              {elig.map((e) => (
                <li key={e.text} className="text-sm text-gray-700 leading-relaxed pl-4 border-l-2 border-indigo-200">{e.text}</li>
              ))}
            </ul>
          </section>
        )}

        {steps.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2"><ListOrdered className="w-4 h-4 text-indigo-500" /> The route in</h3>
            <ol className="space-y-2">
              {steps.map((s, i) => (
                <li key={s.text} className="flex gap-3 text-sm text-gray-700 leading-relaxed">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                  <span>{s.text}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {(licence || officialPay) && (
          <div className="grid sm:grid-cols-2 gap-3">
            {licence && (
              <div className="rounded-xl bg-purple-50 border border-purple-100 p-4">
                <p className="text-xs font-semibold text-purple-800 flex items-center gap-1.5 mb-1"><FileBadge className="w-4 h-4" /> Licence / registration</p>
                <p className="text-sm text-purple-950 leading-relaxed">{licence}</p>
              </div>
            )}
            {officialPay && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5 mb-1"><IndianRupee className="w-4 h-4" /> Official pay</p>
                <p className="text-sm text-emerald-950 leading-relaxed">{officialPay}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
