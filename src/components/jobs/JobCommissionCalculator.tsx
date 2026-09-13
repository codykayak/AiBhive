import { useMemo, useState } from 'react';
import { Calculator, Target } from 'lucide-react';
import {
  COMMISSION_RATE,
  JobListing,
  TARGET_MONTHLY_COMMISSION,
  monthlyCommission,
} from '../../content/jobListings';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDealValue(job: JobListing, value: number): string {
  if (job.calculator.dealFormat === 'currencyMonthly') {
    return `${formatCurrency(value)}/mo`;
  }
  return formatCurrency(value);
}

type Props = {
  job: JobListing;
};

export function JobCommissionCalculator({ job }: Props) {
  const { calculator } = job;
  const [dealSize, setDealSize] = useState(calculator.dealDefault);
  const [count, setCount] = useState(calculator.countDefault);

  const commission = useMemo(
    () => monthlyCommission(job, dealSize, count),
    [job, dealSize, count]
  );
  const perClose = monthlyCommission(job, dealSize, 1);
  const progress = Math.min(100, (commission / TARGET_MONTHLY_COMMISSION) * 100);

  return (
    <section
      className="glass-card rounded-2xl border border-bee-amber/25 p-6 md:p-8"
      aria-labelledby="commission-calculator-heading"
    >
      <div className="flex items-start gap-3 mb-6">
        <Calculator className="w-6 h-6 text-bee-amber shrink-0 mt-0.5" aria-hidden />
        <div>
          <h2 id="commission-calculator-heading" className="text-2xl font-bold text-white">
            Commission calculator
          </h2>
          <p className="text-slate-400 text-sm mt-1 leading-relaxed">
            25% flat on every close. Drag the sliders to see what your month looks like.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <label htmlFor={`deal-${job.slug}`} className="text-slate-300 font-semibold">
              {calculator.dealLabel}
            </label>
            <span className="text-bee-amber font-bold">{formatDealValue(job, dealSize)}</span>
          </div>
          <input
            id={`deal-${job.slug}`}
            type="range"
            min={calculator.dealMin}
            max={calculator.dealMax}
            step={calculator.dealStep}
            value={dealSize}
            onChange={(e) => setDealSize(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>{formatDealValue(job, calculator.dealMin)}</span>
            <span>{formatDealValue(job, calculator.dealMax)}</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <label htmlFor={`count-${job.slug}`} className="text-slate-300 font-semibold">
              {calculator.countLabel}
            </label>
            <span className="text-bee-amber font-bold">{count}</span>
          </div>
          <input
            id={`count-${job.slug}`}
            type="range"
            min={calculator.countMin}
            max={calculator.countMax}
            step={1}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>{calculator.countMin}</span>
            <span>{calculator.countMax}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-black/40 border border-white/10 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Per close</p>
          <p className="text-xl font-bold text-white">{formatCurrency(perClose)}</p>
          <p className="text-xs text-slate-500 mt-1">{Math.round(COMMISSION_RATE * 100)}% commission</p>
        </div>
        <div className="rounded-xl bg-black/40 border border-bee-amber/30 p-4 sm:col-span-2">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Estimated monthly</p>
          <p className="text-3xl font-extrabold text-bee-amber">{formatCurrency(commission)}</p>
          <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-bee-amber transition-all duration-300"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progress toward ${formatCurrency(TARGET_MONTHLY_COMMISSION)} monthly target`}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Target: {formatCurrency(TARGET_MONTHLY_COMMISSION)}/mo at ~20 hrs/week
          </p>
        </div>
      </div>

      <p className="mt-5 text-sm text-slate-400 flex gap-2 items-start">
        <Target className="w-4 h-4 text-bee-amber shrink-0 mt-0.5" aria-hidden />
        {calculator.targetHint}
      </p>
    </section>
  );
}
