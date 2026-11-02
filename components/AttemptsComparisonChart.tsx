import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { RIASEC_INFO } from '../constants';
import { QuizAttempt, RIASECKey } from '../types';
import RiasecIcon from './RiasecIcon';

interface AttemptsComparisonChartProps {
  attempts: QuizAttempt[];
  onClearPreviousAttempts: () => void;
  onRetakeQuiz: () => void;
}

type ChartMode = 'bar' | 'radar' | 'line';
type MetricMode = 'percent' | 'raw';

const ORDERED_KEYS: RIASECKey[] = ['R', 'I', 'A', 'S', 'E', 'C'];

const ATTEMPT_PALETTE = [
  { stroke: '#6366f1', fill: '#6366f1' }, // Indigo
  { stroke: '#f59e0b', fill: '#f59e0b' }, // Amber
  { stroke: '#ec4899', fill: '#ec4899' }, // Pink
  { stroke: '#2563eb', fill: '#3b82f6' }, // Blue (immediately previous)
  { stroke: '#059669', fill: '#10b981' }, // Emerald (latest)
];

const toArabicNumerals = (num: number): string => {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num)
    .split('')
    .map((ch) => (ch >= '0' && ch <= '9' ? digits[Number(ch)] : ch))
    .join('');
};

const formatAttemptTimestamp = (iso: string): string => {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  const datePart = parsed.toLocaleDateString('ar-JO', {
    month: 'short',
    day: 'numeric',
  });
  const timePart = parsed.toLocaleTimeString('ar-JO', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart} · ${timePart}`;
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    dataKey?: string;
  }>;
  label?: string;
  unitSuffix: string;
}

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  unitSuffix,
}) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      dir="rtl"
      className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl px-4 py-3 shadow-xl text-right min-w-[190px]"
    >
      <div className="text-xs font-black text-slate-900 pb-2 mb-2 border-b border-slate-100">
        {label}
      </div>
      <div className="space-y-1.5">
        {payload.map((entry, idx) => (
          <div
            key={`${entry.dataKey || idx}`}
            className="flex items-center justify-between gap-4 text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: entry.color || '#059669' }}
              />
              <span className="font-bold text-slate-700 truncate">{entry.name}</span>
            </div>
            <span className="font-black text-slate-900 tabular-nums shrink-0">
              {entry.value}
              {unitSuffix}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AttemptsComparisonChart: React.FC<AttemptsComparisonChartProps> = ({
  attempts,
  onClearPreviousAttempts,
  onRetakeQuiz,
}) => {
  const [chartMode, setChartMode] = useState<ChartMode>('bar');
  const [metricMode, setMetricMode] = useState<MetricMode>('percent');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);

  // Keep latest up to 4 attempts selected by default whenever attempts list grows
  useEffect(() => {
    if (attempts.length === 0) {
      setSelectedIds([]);
      return;
    }
    const defaultSlice = attempts.slice(-4).map((a) => a.id);
    setSelectedIds(defaultSlice);
  }, [attempts.length]);

  useEffect(() => {
    if (!confirmClear) return;
    const timer = window.setTimeout(() => setConfirmClear(false), 5000);
    return () => window.clearTimeout(timer);
  }, [confirmClear]);

  const activeAttempts = useMemo(() => {
    const filtered = attempts.filter((a) => selectedIds.includes(a.id));
    if (filtered.length >= 2) return filtered;
    return attempts.slice(-Math.min(2, attempts.length));
  }, [attempts, selectedIds]);

  const getColorForAttempt = (attemptId: string) => {
    const idxInActive = activeAttempts.findIndex((a) => a.id === attemptId);
    const total = activeAttempts.length;
    if (idxInActive === total - 1) {
      return ATTEMPT_PALETTE[ATTEMPT_PALETTE.length - 1]; // Always Emerald for latest selected
    }
    if (idxInActive === total - 2) {
      return ATTEMPT_PALETTE[ATTEMPT_PALETTE.length - 2]; // Royal Blue for immediately preceding
    }
    return ATTEMPT_PALETTE[idxInActive % (ATTEMPT_PALETTE.length - 2)];
  };

  const toMetricValue = (rawScore: number): number => {
    return metricMode === 'percent' ? Math.round((rawScore / 25) * 100) : rawScore;
  };

  // Data for BarChart & RadarChart (X/Angle = 6 Holland dimensions)
  const categoryComparisonData = useMemo(() => {
    return ORDERED_KEYS.map((key) => {
      const row: Record<string, string | number> = {
        key,
        label: RIASEC_INFO[key].label,
      };
      activeAttempts.forEach((attempt) => {
        row[`attempt_${attempt.id}`] = toMetricValue(attempt.scores[key]);
      });
      return row;
    });
  }, [activeAttempts, metricMode]);

  // Data for LineChart (X = chronological attempts, Lines = 6 Holland dimensions)
  const timelineProgressionData = useMemo(() => {
    return activeAttempts.map((attempt, idx) => {
      const isLatest = attempt.id === attempts[attempts.length - 1]?.id;
      const row: Record<string, string | number> = {
        attemptLabel: isLatest
          ? `المحاولة ${toArabicNumerals(attempt.attemptNumber)} (الحالية)`
          : `المحاولة ${toArabicNumerals(attempt.attemptNumber)}`,
        shortLabel: `محاولة ${toArabicNumerals(attempt.attemptNumber)}`,
        index: idx,
      };
      ORDERED_KEYS.forEach((key) => {
        row[key] = toMetricValue(attempt.scores[key]);
      });
      return row;
    });
  }, [activeAttempts, attempts, metricMode]);

  const toggleAttemptSelection = (id: string) => {
    setSelectedIds((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        if (prev.length <= 2) return prev; // Keep at least 2 attempts for meaningful comparison
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  if (attempts.length < 2) {
    return (
      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-right shadow-sm">
        <div className="space-y-1">
          <div className="text-xs font-bold text-slate-400">
            سجل تتبع التطور المهني · المحاولة {toArabicNumerals(1)} محفوظة
          </div>
          <h3 className="text-lg font-black text-slate-900">
            مقارنة النتائج عبر المحاولات المتعددة
          </h3>
          <p className="text-sm text-slate-500 font-light leading-relaxed">
            تم حفظ نتيجتك الحالية كمرجع أساسي. عند إعادة الاختبار مستقبلاً، سيظهر هنا تلقائياً رسم بياني مقارن يوضح تطور ميولك المهنية الستة عبر كل محاولة.
          </p>
        </div>
        <button
          type="button"
          onClick={onRetakeQuiz}
          className="px-5 py-3 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-xl font-bold text-sm transition-colors whitespace-nowrap shrink-0"
        >
          إعادة المقياس للمقارنة
        </button>
      </div>
    );
  }

  const latestAttempt = attempts[attempts.length - 1];
  const previousAttempt = attempts[attempts.length - 2];
  const unitSuffix = metricMode === 'percent' ? '%' : ' / 25';
  const maxAxisValue = metricMode === 'percent' ? 100 : 25;

  return (
    <section className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-10 shadow-xl shadow-slate-200/30 space-y-8 text-right">
      {/* Header & Interactive Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
            <span>سجل التقدم المهني</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              إجمالي المحاولات: {toArabicNumerals(attempts.length)}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              الرمز السابق: <strong className="text-slate-700">{previousAttempt.dominantCode}</strong>
            </span>
            <span aria-hidden="true">←</span>
            <span>
              الرمز الحالي: <strong className="text-emerald-700">{latestAttempt.dominantCode}</strong>
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
            مقارنة نتائجك مع المحاولات السابقة
          </h3>
          <p className="text-sm text-slate-500 font-light leading-relaxed max-w-2xl">
            تحليل بصري مقارن يوضح تغير درجات ميولك المهنية الستة بين محاولتك الحالية ومحاولاتك السابقة لمساعدتك على رصد استقرار اختياراتك.
          </p>
        </div>

        {/* Interactive Chart Type & Unit Segmented Controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setChartMode('bar')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                chartMode === 'bar'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              أعمدة مقارنة
            </button>
            <button
              type="button"
              onClick={() => setChartMode('radar')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                chartMode === 'radar'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              تراكب الرادار
            </button>
            <button
              type="button"
              onClick={() => setChartMode('line')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                chartMode === 'line'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              مسار التطور
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setMetricMode('percent')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                metricMode === 'percent'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              نسبة مئوية (%)
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('raw')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                metricMode === 'raw'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              درجات (٢٥)
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Attempt Filter Bar & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 ml-1 whitespace-nowrap">
            المحاولات المعروضة:
          </span>
          {attempts.map((attempt) => {
            const isSelected = activeAttempts.some((a) => a.id === attempt.id);
            const isLatest = attempt.id === latestAttempt.id;
            const palette = isSelected
              ? getColorForAttempt(attempt.id)
              : { stroke: '#94a3b8', fill: '#cbd5e1' };

            return (
              <button
                key={attempt.id}
                type="button"
                onClick={() => toggleAttemptSelection(attempt.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-slate-50 border-slate-300 text-slate-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: palette.fill }}
                />
                <span>
                  المحاولة {toArabicNumerals(attempt.attemptNumber)}
                  {isLatest ? ' (الحالية)' : ''}
                </span>
                <span className="text-slate-300" aria-hidden="true">
                  ·
                </span>
                <span className="text-[11px] font-medium text-slate-500 tabular-nums">
                  {formatAttemptTimestamp(attempt.timestamp)}
                </span>
              </button>
            );
          })}
        </div>

        {/* History Reset Control (Inline Two-Step Confirmation) */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="text-xs font-bold text-slate-400 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors whitespace-nowrap shrink-0"
            >
              مسح سجل المحاولات السابقة
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-1.5">
              <span className="text-xs font-bold text-rose-800 whitespace-nowrap">
                الإبقاء على النتيجة الحالية فقط؟
              </span>
              <button
                type="button"
                onClick={() => {
                  setConfirmClear(false);
                  onClearPreviousAttempts();
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                تأكيد
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-2 py-1 text-slate-600 hover:text-slate-900 text-xs font-bold whitespace-nowrap shrink-0"
              >
                إلغاء
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Recharts Canvas (dir="ltr" prevents SVG coordinate offset bugs in RTL browsers) */}
      <div
        dir="ltr"
        className="w-full h-[340px] sm:h-[400px] bg-slate-50/60 border border-slate-100 rounded-3xl p-3 sm:p-6"
      >
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'bar' ? (
            <BarChart
              data={categoryComparisonData}
              margin={{ top: 16, right: 12, left: 4, bottom: 8 }}
              barGap={6}
              barCategoryGap="22%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                reversed
                tick={{ fill: '#334155', fontSize: 13, fontWeight: 700 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                orientation="right"
                domain={[0, maxAxisValue]}
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => (metricMode === 'percent' ? `${val}%` : `${val}`)}
              />
              <Tooltip
                cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                content={<CustomChartTooltip unitSuffix={unitSuffix} />}
              />
              {activeAttempts.map((attempt) => {
                const palette = getColorForAttempt(attempt.id);
                const isLatest = attempt.id === latestAttempt.id;
                const seriesLabel = isLatest
                  ? `المحاولة ${toArabicNumerals(attempt.attemptNumber)} (الحالية)`
                  : `المحاولة ${toArabicNumerals(attempt.attemptNumber)}`;
                return (
                  <Bar
                    key={attempt.id}
                    dataKey={`attempt_${attempt.id}`}
                    name={seriesLabel}
                    fill={palette.fill}
                    radius={[8, 8, 0, 0]}
                    maxBarSize={34}
                  />
                );
              })}
            </BarChart>
          ) : chartMode === 'radar' ? (
            <RadarChart cx="50%" cy="50%" outerRadius="76%" data={categoryComparisonData}>
              <PolarGrid stroke="#cbd5e1" />
              <PolarAngleAxis
                dataKey="label"
                tick={{ fill: '#1e293b', fontSize: 13, fontWeight: 700 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, maxAxisValue]}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
              />
              <Tooltip content={<CustomChartTooltip unitSuffix={unitSuffix} />} />
              {activeAttempts.map((attempt) => {
                const palette = getColorForAttempt(attempt.id);
                const isLatest = attempt.id === latestAttempt.id;
                const seriesLabel = isLatest
                  ? `المحاولة ${toArabicNumerals(attempt.attemptNumber)} (الحالية)`
                  : `المحاولة ${toArabicNumerals(attempt.attemptNumber)}`;
                return (
                  <Radar
                    key={attempt.id}
                    name={seriesLabel}
                    dataKey={`attempt_${attempt.id}`}
                    stroke={palette.stroke}
                    strokeWidth={isLatest ? 3 : 2}
                    strokeDasharray={isLatest ? undefined : '5 3'}
                    fill={palette.fill}
                    fillOpacity={isLatest ? 0.32 : 0.1}
                  />
                );
              })}
            </RadarChart>
          ) : (
            <LineChart
              data={timelineProgressionData}
              margin={{ top: 16, right: 20, left: 12, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="shortLabel"
                reversed
                tick={{ fill: '#334155', fontSize: 12, fontWeight: 700 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                padding={{ left: 20, right: 20 }}
              />
              <YAxis
                orientation="right"
                domain={[0, maxAxisValue]}
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => (metricMode === 'percent' ? `${val}%` : `${val}`)}
              />
              <Tooltip content={<CustomChartTooltip unitSuffix={unitSuffix} />} />
              {ORDERED_KEYS.map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={RIASEC_INFO[key].label}
                  stroke={RIASEC_INFO[key].color}
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 2, fill: '#ffffff' }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* LineChart Legend when in Timeline mode */}
      {chartMode === 'line' && (
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600">
          {ORDERED_KEYS.map((key) => (
            <div key={key} className="inline-flex items-center gap-1.5 font-bold">
              <span
                className="w-3 h-1 rounded-full"
                style={{ backgroundColor: RIASEC_INFO[key].color }}
              />
              <span>{RIASEC_INFO[key].label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Direct Delta Summary: Current Attempt vs Immediately Previous Attempt */}
      <div className="pt-2 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h4 className="text-sm sm:text-base font-black text-slate-800">
            مقدار التغير بين المحاولة الحالية والمحاولة السابقة مباشرة (المحاولة{' '}
            {toArabicNumerals(previousAttempt.attemptNumber)})
          </h4>
          <span className="text-xs text-slate-400 font-medium">
            يوضح الفرق ارتفاع أو انخفاض كل ميل مهني مقارنة بآخر اختبار سابق
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ORDERED_KEYS.map((key) => {
            const currVal = toMetricValue(latestAttempt.scores[key]);
            const prevVal = toMetricValue(previousAttempt.scores[key]);
            const diff = currVal - prevVal;
            const unitText = metricMode === 'percent' ? '%' : '';

            return (
              <div
                key={key}
                className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3.5 space-y-2.5 text-right"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <RiasecIcon type={key} size="xs" />
                    <span className="text-xs font-black text-slate-800 truncate">
                      {RIASEC_INFO[key].label}
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between gap-2 pt-1 border-t border-slate-200/60">
                  <div>
                    <span className="text-lg font-black text-slate-900 tabular-nums">
                      {currVal}
                      {unitText}
                    </span>
                    <span className="block text-[11px] text-slate-400 font-medium tabular-nums">
                      السابق: {prevVal}
                      {unitText}
                    </span>
                  </div>

                  <div className="text-left shrink-0">
                    {diff > 0 ? (
                      <span className="text-xs font-black text-emerald-700 tabular-nums block">
                        ▲ +{diff}
                        {unitText}
                      </span>
                    ) : diff < 0 ? (
                      <span className="text-xs font-black text-amber-700 tabular-nums block">
                        ▼ {diff}
                        {unitText}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 tabular-nums block">
                        — مستقر
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AttemptsComparisonChart;
