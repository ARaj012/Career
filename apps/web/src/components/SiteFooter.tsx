import Link from 'next/link'
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand'

const COLUMNS: { head: string; links: [string, string][] }[] = [
  { head: 'Explore', links: [['/careers', 'Careers'], ['/colleges', 'Colleges'], ['/exams', 'Exams'], ['/scholarships', 'Scholarships']] },
  { head: 'Tools', links: [['/recommend', 'Career matches'], ['/scholarships/match', 'Scholarship matcher'], ['/colleges/value', 'Fees vs placements'], ['/papers', 'Previous papers']] },
  { head: BRAND_NAME, links: [['/blog', 'Blog'], ['/pricing', 'Pricing'], ['/my-exams', 'My exams'], ['/dashboard', 'Dashboard']] },
]

/** The footer on every student-facing page */
export default function SiteFooter() {
  return (
    <footer className="bg-gray-900 text-gray-400 px-4 sm:px-6 pt-12 pb-8">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <p className="text-white text-lg font-bold">{BRAND_NAME}</p>
          <p className="text-sm mt-1">{BRAND_TAGLINE}</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.head}>
            <p className="text-white text-sm font-semibold mb-3">{col.head}</p>
            <ul className="space-y-2 text-sm">
              {col.links.map(([href, label]) => (
                <li key={href}><Link href={href} className="hover:text-white transition">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between gap-2 text-xs">
        <p>© 2026 {BRAND_NAME} · Built for Indian students</p>
        <p>Data from official sources: NIRF, exam boards and scholarship portals</p>
      </div>
    </footer>
  )
}
