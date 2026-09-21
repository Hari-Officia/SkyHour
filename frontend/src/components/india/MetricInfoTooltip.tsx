import { useState } from 'react'
import { Info, X } from 'lucide-react'

interface MetricInfoProps {
  title: string
  formula: string
  inputs: string
  normalization: string
  interpretation: string
}

export function MetricInfoTooltip({ title, formula, inputs, normalization, interpretation }: MetricInfoProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="metric-info-btn"
        title={`Explain ${title}`}
        onClick={e => {
          e.stopPropagation()
          setOpen(true)
        }}
      >
        <Info size={13} />
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="glass-panel modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{title} — Methodology & Formula</h3>
              <button type="button" className="close-btn" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div className="info-block">
                <span className="lbl">FORMULA</span>
                <code className="code-block">{formula}</code>
              </div>

              <div className="info-block">
                <span className="lbl">INPUT PARAMETERS</span>
                <p>{inputs}</p>
              </div>

              <div className="info-block">
                <span className="lbl">NORMALIZATION</span>
                <p>{normalization}</p>
              </div>

              <div className="info-block">
                <span className="lbl">ANALYTICAL INTERPRETATION</span>
                <p>{interpretation}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
