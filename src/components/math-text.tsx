import { Fragment, useMemo } from 'react'
import katex from 'katex'

import { cn } from '@/lib/utils'

function renderMath(tex: string, displayMode: boolean) {
  // Matrices always use square brackets, even if AI output asks for round ones.
  const normalised = tex.replace(/\{pmatrix\}/g, '{bmatrix}')
  return katex.renderToString(normalised, { displayMode, throwOnError: false, strict: 'ignore' })
}

/** Splits text on $$...$$ and $...$ and renders the maths with KaTeX. Supports **bold**. */
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$|\*\*[^*]+?\*\*)/g)
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`
    if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
      return <span key={key} className="block my-2" dangerouslySetInnerHTML={{ __html: renderMath(part.slice(2, -2), true) }} />
    }
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      return <span key={key} dangerouslySetInnerHTML={{ __html: renderMath(part.slice(1, -1), false) }} />
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>
    }
    return <Fragment key={key}>{part}</Fragment>
  })
}

export function MathText({ text, className }: { text: string; className?: string }) {
  const content = useMemo(() => renderInline(text, 'm'), [text])
  return <span className={className}>{content}</span>
}

/** Multi-paragraph variant for tutor replies: blank lines become paragraphs. */
export function MathBlock({ text, className }: { text: string; className?: string }) {
  const paragraphs = useMemo(() => text.split(/\n{2,}/).filter(Boolean), [text])
  return (
    <div className={cn('space-y-3 leading-relaxed', className)}>
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {renderInline(p, `p${i}`)}
        </p>
      ))}
    </div>
  )
}
