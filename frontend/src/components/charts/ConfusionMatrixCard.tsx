import React from 'react'
import { ChartCard } from './ChartCard'

interface ConfusionMatrixProps {
  confusionMatrix?: {
    threshold: number
    true_positive: number
    false_positive: number
    true_negative: number
    false_negative: number
    total_samples: number
  }
  source?: string
  loading?: boolean
  error?: string | null
}

export const ConfusionMatrixCard: React.FC<ConfusionMatrixProps> = ({
  confusionMatrix,
  source,
  loading,
  error
}) => {
  const isEmpty = !confusionMatrix

  const tp = confusionMatrix?.true_positive || 0
  const fp = confusionMatrix?.false_positive || 0
  const tn = confusionMatrix?.true_negative || 0
  const fn = confusionMatrix?.false_negative || 0
  const total = confusionMatrix?.total_samples || (tp + fp + tn + fn) || 1

  const precision = (tp + fp) > 0 ? (tp / (tp + fp) * 100).toFixed(2) : '0.00'
  const recall = (tp + fn) > 0 ? (tp / (tp + fn) * 100).toFixed(2) : '0.00'
  const accuracy = total > 0 ? ((tp + tn) / total * 100).toFixed(2) : '0.00'
  const specificity = (tn + fp) > 0 ? (tn / (tn + fp) * 100).toFixed(2) : '0.00'

  return (
    <ChartCard
      title="Model Confusion Matrix"
      subtitle={`Evaluated at Classification Threshold = ${confusionMatrix?.threshold || 0.50}`}
      explanation={`Evaluation results computed on ${total.toLocaleString()} test flights. Class 1 = Delayed (ArrDel15=1), Class 0 = On-Time.`}
      source={source || "SKYHOUR Test Evaluation Engine"}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      badgeText={`N = ${total.toLocaleString()}`}
    >
      <div className="py-2 space-y-4">
        {/* 2x2 Grid Matrix */}
        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
          {/* True Negative */}
          <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-center">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">True Negative (TN)</span>
            <span className="text-2xl font-black text-slate-100 block my-1">{tn.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400">Correctly predicted On-Time</span>
          </div>

          {/* False Positive */}
          <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl text-center">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">False Positive (FP)</span>
            <span className="text-2xl font-black text-slate-100 block my-1">{fp.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400">False Alarm (Predicted Delay)</span>
          </div>

          {/* False Negative */}
          <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl text-center">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">False Negative (FN)</span>
            <span className="text-2xl font-black text-slate-100 block my-1">{fn.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400">Missed Delay Warning</span>
          </div>

          {/* True Positive */}
          <div className="p-4 bg-blue-950/40 border border-blue-800/60 rounded-xl text-center">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">True Positive (TP)</span>
            <span className="text-2xl font-black text-slate-100 block my-1">{tp.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400">Correctly predicted Delay</span>
          </div>
        </div>

        {/* Derived Operational Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-center">
          <div className="p-2 bg-slate-950/60 rounded-lg">
            <span className="text-[10px] text-slate-400 font-semibold block">Precision</span>
            <span className="text-sm font-bold text-emerald-400">{precision}%</span>
          </div>
          <div className="p-2 bg-slate-950/60 rounded-lg">
            <span className="text-[10px] text-slate-400 font-semibold block">Recall (Sensitivity)</span>
            <span className="text-sm font-bold text-rose-400">{recall}%</span>
          </div>
          <div className="p-2 bg-slate-950/60 rounded-lg">
            <span className="text-[10px] text-slate-400 font-semibold block">Specificity</span>
            <span className="text-sm font-bold text-blue-400">{specificity}%</span>
          </div>
          <div className="p-2 bg-slate-950/60 rounded-lg">
            <span className="text-[10px] text-slate-400 font-semibold block">Overall Accuracy</span>
            <span className="text-sm font-bold text-purple-400">{accuracy}%</span>
          </div>
        </div>
      </div>
    </ChartCard>
  )
}
