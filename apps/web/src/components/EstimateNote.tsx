import { AlertTriangle, ExternalLink, Info } from 'lucide-react'
import type { Estimate } from '@/lib/estimates'

const LABEL: Record<Estimate['kind'], string> = {
  estimate: 'Approximate estimate · not officially verified',
  secondary: 'From a non-official source · not officially verified',
  discontinued: 'No longer conducted',
}

/**
 * Shows a detail the official website does not publish, always labelled for what it is.
 * `title` names the detail ("Expected dates"); `bare` drops the card frame when the
 * note sits inside an existing section.
 */
export default function EstimateNote({ estimate, title, bare = false }: { estimate: Estimate; title?: string; bare?: boolean }) {
  const discontinued = estimate.kind === 'discontinued'
  const tone = discontinued ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-amber-50 border-amber-200 text-amber-900'
  const Icon = discontinued ? Info : AlertTriangle
  return (
    <div className={`${bare ? '' : 'rounded-xl border p-3 sm:p-4'} ${bare ? '' : tone}`}>
      <p className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${discontinued ? 'text-gray-600' : 'text-amber-700'}`}>
        <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
        {LABEL[estimate.kind]}
      </p>
      {title && <p className="mt-2 text-sm font-medium text-gray-900">{title}</p>}
      <p className="mt-1 text-sm whitespace-pre-line">{estimate.value_text}</p>
      {estimate.basis && <p className="mt-2 text-xs text-gray-500">How this was estimated: {estimate.basis}</p>}
      {estimate.kind === 'secondary' && (estimate.source_name || estimate.source_url) && (
        <p className="mt-2 text-xs text-gray-500">
          Source:{' '}
          {estimate.source_url ? (
            <a href={estimate.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 underline hover:text-gray-700">
              {estimate.source_name ?? new URL(estimate.source_url).hostname}
              <ExternalLink className="w-3 h-3" aria-hidden />
            </a>
          ) : (
            estimate.source_name
          )}
        </p>
      )}
      {!discontinued && (
        <p className="mt-2 text-xs text-gray-500">Check the official website before relying on it. It is replaced as soon as the official figure is published.</p>
      )}
    </div>
  )
}
