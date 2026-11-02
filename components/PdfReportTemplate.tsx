import React, { useEffect, useState } from 'react';
import { RIASEC_INFO } from '../constants';
import { RIASECKey, RIASECScores } from '../types';
import RiasecIcon from './RiasecIcon';

interface PdfReportTemplateProps {
  scores: RIASECScores;
  aiAnalysis: string;
  studentName: string;
  studentGrade: string;
  generatedAt?: Date | string | number;
}

const CATEGORY_STYLES: Record<
  RIASECKey,
  {
    hex: string;
    badgeBg: string;
    badgeText: string;
    cardBorder: string;
    cardBg: string;
  }
> = {
  R: {
    hex: '#10b981',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-emerald-700',
    cardBorder: 'border-emerald-200',
    cardBg: 'bg-emerald-50/60',
  },
  I: {
    hex: '#3b82f6',
    badgeBg: 'bg-blue-600',
    badgeText: 'text-blue-700',
    cardBorder: 'border-blue-200',
    cardBg: 'bg-blue-50/60',
  },
  A: {
    hex: '#ec4899',
    badgeBg: 'bg-pink-600',
    badgeText: 'text-pink-700',
    cardBorder: 'border-pink-200',
    cardBg: 'bg-pink-50/60',
  },
  S: {
    hex: '#f59e0b',
    badgeBg: 'bg-amber-500',
    badgeText: 'text-amber-700',
    cardBorder: 'border-amber-200',
    cardBg: 'bg-amber-50/60',
  },
  E: {
    hex: '#ef4444',
    badgeBg: 'bg-red-600',
    badgeText: 'text-red-700',
    cardBorder: 'border-red-200',
    cardBg: 'bg-red-50/60',
  },
  C: {
    hex: '#6366f1',
    badgeBg: 'bg-indigo-600',
    badgeText: 'text-indigo-700',
    cardBorder: 'border-indigo-200',
    cardBg: 'bg-indigo-50/60',
  },
};

const ARABIC_RANKS = ['١', '٢', '٣', '٤', '٥', '٦'];

const renderFormattedInline = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
};

const resolveValidDate = (value?: Date | string | number): Date => {
  if (value !== undefined && value !== null) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
};

const PdfReportTemplate = React.forwardRef<HTMLDivElement, PdfReportTemplateProps>(
  ({ scores, aiAnalysis, studentName, studentGrade, generatedAt }, ref) => {
    const [reportDate, setReportDate] = useState<Date>(() => resolveValidDate(generatedAt));

    useEffect(() => {
      setReportDate(resolveValidDate(generatedAt));
    }, [generatedAt]);

    useEffect(() => {
      const refreshReportDate = () => setReportDate(new Date());
      window.addEventListener('beforeprint', refreshReportDate);
      window.addEventListener('bowsalti:prepare-pdf', refreshReportDate);
      return () => {
        window.removeEventListener('beforeprint', refreshReportDate);
        window.removeEventListener('bowsalti:prepare-pdf', refreshReportDate);
      };
    }, []);

    const orderedKeys: RIASECKey[] = ['R', 'I', 'A', 'S', 'E', 'C'];
    const sortedCategories = (Object.entries(scores) as [RIASECKey, number][]).sort(
      ([, a], [, b]) => b - a
    );
    const topTwo = sortedCategories.slice(0, 2);
    const hollandCode = sortedCategories
      .slice(0, 3)
      .map(([k]) => k)
      .join('');

    const formattedHeaderDate = reportDate.toLocaleDateString('ar-JO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const issueDate = reportDate.toLocaleDateString('ar-JO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const currentYear = reportDate.getFullYear();
    const monthNum = String(reportDate.getMonth() + 1).padStart(2, '0');
    const dayNum = String(reportDate.getDate()).padStart(2, '0');
    const numericDate = `${dayNum}/${monthNum}/${currentYear}`;
    const isoDate = `${currentYear}-${monthNum}-${dayNum}`;

    // Hexagon Radar SVG geometry (pure presentation attributes for exact html2canvas + print output)
    const cx = 120;
    const cy = 115;
    const maxRadius = 76;
    const ringLevels = [0.25, 0.5, 0.75, 1];

    const getPoint = (index: number, radiusRatio: number) => {
      const angleDeg = -90 + index * 60;
      const angleRad = (angleDeg * Math.PI) / 180;
      return {
        x: Number((cx + maxRadius * radiusRatio * Math.cos(angleRad)).toFixed(2)),
        y: Number((cy + maxRadius * radiusRatio * Math.sin(angleRad)).toFixed(2)),
      };
    };

    const scorePolygonPoints = orderedKeys
      .map((key, idx) => {
        const ratio = Math.max(0.08, Math.min(1, scores[key] / 25));
        const pt = getPoint(idx, ratio);
        return `${pt.x},${pt.y}`;
      })
      .join(' ');

    const parsedAiBlocks = (aiAnalysis || '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return (
      <div
        ref={ref}
        dir="rtl"
        className="w-[794px] print:w-full bg-white text-slate-900 font-sans px-9 pt-6 pb-8 print:px-2 print:py-2 tracking-normal"
      >
        {/* Top Page Header (رأس الصفحة): Automatically displays the current date upon PDF creation */}
        <header
          data-pdf-page-header="true"
          className="pb-3.5 mb-5 border-b border-slate-200 flex items-center justify-between gap-4 text-xs"
        >
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <span className="font-black text-emerald-700">بوصلتي</span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span>مدرسة أحمد اللوزي الثانوية للبنين</span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="text-slate-500">التقرير المهني والأكاديمي</span>
          </div>

          <div className="flex items-center gap-2 text-slate-600 shrink-0">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#059669"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="font-medium text-slate-500">تاريخ التقرير:</span>
            <time dateTime={isoDate} className="font-black text-slate-900 tabular-nums">
              {formattedHeaderDate}
            </time>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span dir="ltr" className="font-bold text-emerald-700 tabular-nums">
              {numericDate}
            </span>
          </div>
        </header>

        {/* Block 1: Official School Header & Student Metadata */}
        <div data-pdf-block="true" className="pb-6 mb-6 border-b-2 border-emerald-600">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shrink-0">
                ب
              </div>
              <div className="space-y-1 text-right">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900">بوصلتي — التمكين المهني الذكي</h1>
                </div>
                <p className="text-sm font-bold text-emerald-700">
                  مدرسة أحمد اللوزي الثانوية للبنين
                </p>
                <p className="text-xs text-slate-500">
                  إشراف: لجنة التوجيه والإرشاد · قسم الإرشاد النفسي والتربوي
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-left shrink-0 space-y-1">
              <div className="text-xs font-black text-emerald-700 text-right">
                وثيقة تحليل الميول المهنية
              </div>
              <div className="text-[11px] text-slate-500 text-right">
                تاريخ الإصدار: <span className="font-bold text-slate-800 tabular-nums">{issueDate}</span>
              </div>
              <div className="text-[11px] text-slate-500 text-right">
                رمز هولاند الثلاثي:{' '}
                <span className="font-black text-emerald-700 tabular-nums">
                  {hollandCode}
                </span>
              </div>
            </div>
          </div>

          {/* Student Info Strip */}
          <div className="mt-5 grid grid-cols-3 gap-4 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-right">
            <div>
              <span className="block text-[11px] text-slate-500 font-medium">اسم الطالب</span>
              <span className="text-sm font-black text-slate-900">
                {studentName.trim() || 'طالب مدرسة أحمد اللوزي الثانوية'}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-500 font-medium">الصف / الفرع الأكاديمي</span>
              <span className="text-sm font-black text-slate-900">
                {studentGrade.trim() || 'الصف الحادي عشر'}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-500 font-medium">أداة القياس المعتمدة</span>
              <span className="text-sm font-black text-emerald-700">
                مقياس هولاند العالمي (RIASEC)
              </span>
            </div>
          </div>
        </div>

        {/* Block 2: Radar Chart + Top Two Dominant Traits */}
        <div data-pdf-block="true" className="mb-7">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-2 h-6 bg-emerald-600 rounded-full"></span>
            <h2 className="text-lg font-black text-slate-900">
              ملخص البصمة المهنية والأنماط السائدة
            </h2>
          </div>

          <div className="grid grid-cols-12 gap-5 items-stretch">
            {/* Hexagon Radar Card */}
            <div className="col-span-5 bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center">
              <div className="text-xs font-bold text-slate-600 mb-2">
                المخطط السداسي لتوزيع الميول
              </div>
              <svg width="240" height="230" viewBox="0 0 240 230">
                {/* Grid Rings */}
                {ringLevels.map((lvl, idx) => {
                  const pts = orderedKeys
                    .map((_, i) => {
                      const p = getPoint(i, lvl);
                      return `${p.x},${p.y}`;
                    })
                    .join(' ');
                  return (
                    <polygon
                      key={idx}
                      points={pts}
                      fill={lvl === 1 ? '#ffffff' : 'none'}
                      fillOpacity={lvl === 1 ? '0.6' : '0'}
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Axes */}
                {orderedKeys.map((_, idx) => {
                  const outer = getPoint(idx, 1);
                  return (
                    <line
                      key={idx}
                      x1={cx}
                      y1={cy}
                      x2={outer.x}
                      y2={outer.y}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Student Score Polygon */}
                <polygon
                  points={scorePolygonPoints}
                  fill="#10b981"
                  fillOpacity="0.25"
                  stroke="#059669"
                  strokeWidth="2.5"
                />

                {/* Vertex Dots & ASCII Codes */}
                {orderedKeys.map((key, idx) => {
                  const ratio = Math.max(0.08, Math.min(1, scores[key] / 25));
                  const pt = getPoint(idx, ratio);
                  const lbl = getPoint(idx, 1.24);
                  return (
                    <g key={key}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="4"
                        fill={CATEGORY_STYLES[key].hex}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={lbl.x}
                        cy={lbl.y}
                        r="11"
                        fill={CATEGORY_STYLES[key].hex}
                      />
                      <text
                        x={lbl.x}
                        y={lbl.y + 4}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        {key}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div className="grid grid-cols-3 gap-x-2 gap-y-1.5 mt-2 w-full px-1 text-[10px] text-slate-700">
                {orderedKeys.map((k) => (
                  <div key={k} className="flex items-center gap-1 font-medium">
                    <RiasecIcon type={k} size="xs" variant="bare" />
                    <span className="truncate">
                      <strong className="text-slate-900">{k}:</strong> {RIASEC_INFO[k].label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Two Patterns */}
            <div className="col-span-7 flex flex-col justify-between gap-3.5">
              {topTwo.map(([key, score], idx) => {
                const percent = Math.round((score / 25) * 100);
                const st = CATEGORY_STYLES[key];
                return (
                  <div
                    key={key}
                    className={`rounded-2xl border p-4 text-right flex flex-col justify-between flex-1 ${st.cardBorder} ${st.cardBg}`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <RiasecIcon type={key} size="md" className="bg-white" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-white font-black text-[11px] ${st.badgeBg}`}
                            >
                              {ARABIC_RANKS[idx]}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500">
                              {idx === 0 ? 'النمط المهني الأول (الأكثر هيمنة)' : 'النمط المهني الثاني (المساند)'}
                            </span>
                          </div>
                          <h3 className="text-base font-black text-slate-900 mt-0.5">
                            النمط {RIASEC_INFO[key].label} ({key})
                          </h3>
                          <span className={`text-[10px] font-bold ${st.badgeText}`}>
                            {RIASEC_INFO[key].traitTag}
                          </span>
                        </div>
                      </div>
                      <div className="text-left shrink-0">
                        <span className={`text-xl font-black tabular-nums ${st.badgeText}`}>
                          {percent}%
                        </span>
                        <span className="block text-[10px] text-slate-500 font-bold tabular-nums">
                          {score} من 25 درجة
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {RIASEC_INFO[key].desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Block 3: Complete Breakdown of All 6 RIASEC Dimensions */}
        <div data-pdf-block="true" className="mb-7">
          <div className="flex items-center gap-2.5 mb-3.5">
            <span className="w-2 h-6 bg-emerald-600 rounded-full"></span>
            <h2 className="text-lg font-black text-slate-900">
              التوزيع التفصيلي لأنماط هولاند الستة
            </h2>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="divide-y divide-slate-100">
              {sortedCategories.map(([key, score], idx) => {
                const percent = Math.round((score / 25) * 100);
                const barWidth = Math.max(2, percent);
                return (
                  <div key={key} className="px-4 py-2.5 flex items-center gap-3.5">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {ARABIC_RANKS[idx]}
                    </span>
                    <RiasecIcon type={key} size="sm" />
                    <div className="w-44 shrink-0 text-right">
                      <div className="leading-tight">
                        <span className="font-black text-xs text-slate-900">
                          {RIASEC_INFO[key].label}
                        </span>{' '}
                        <span className="text-[11px] font-bold text-slate-400">({key})</span>
                      </div>
                      <span className="block text-[10px] text-slate-500 font-medium truncate">
                        {RIASEC_INFO[key].traitTag}
                      </span>
                    </div>
                    <div className="flex-1">
                      <svg width="100%" height="10" viewBox="0 0 200 10" preserveAspectRatio="none">
                        <rect x="0" y="0" width="200" height="10" rx="5" fill="#f1f5f9" />
                        <rect
                          x={200 - barWidth * 2}
                          y="0"
                          width={barWidth * 2}
                          height="10"
                          rx="5"
                          fill={CATEGORY_STYLES[key].hex}
                        />
                      </svg>
                    </div>
                    <div className="w-24 shrink-0 flex items-center justify-end gap-2 text-left tabular-nums">
                      <span className="text-[11px] text-slate-500 font-medium">{score}/25</span>
                      <span className="text-xs font-black text-slate-900 w-10 text-left">
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Block 4+: AI Strategic Career & Academic Guidance */}
        <div
          data-pdf-block="true"
          data-pdf-heading="true"
          className="pt-2 mb-3 flex items-center justify-between border-b border-slate-200 pb-2.5"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-6 bg-emerald-600 rounded-full"></span>
            <h2 className="text-lg font-black text-slate-900">
              التحليل المهني والتوصيات الأكاديمية الذكية
            </h2>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
            متوائم مع سوق العمل الأردني ورؤية 2026
          </span>
        </div>

        <div className="space-y-2.5 mb-8">
          {parsedAiBlocks.length > 0 ? (
            parsedAiBlocks.map((line, idx) => {
              if (line.startsWith('###')) {
                const headingText = line.replace(/^#+\s*/, '').replace(/\*\*/g, '');
                return (
                  <div
                    key={idx}
                    data-pdf-block="true"
                    data-pdf-heading="true"
                    className="pt-3 pb-1"
                  >
                    <h3 className="text-sm font-black text-emerald-800 bg-emerald-50/80 border border-emerald-200 px-3.5 py-2 rounded-xl text-right">
                      {headingText}
                    </h3>
                  </div>
                );
              }

              if (line.startsWith('##') || (line.startsWith('**') && line.endsWith('**'))) {
                const subText = line.replace(/^#+\s*/, '').replace(/\*\*/g, '');
                return (
                  <div
                    key={idx}
                    data-pdf-block="true"
                    data-pdf-heading="true"
                    className="pt-2"
                  >
                    <h4 className="text-xs font-black text-slate-900 text-right">{subText}</h4>
                  </div>
                );
              }

              if (line.startsWith('-') || line.startsWith('•') || line.startsWith('* ')) {
                const itemText = line.replace(/^[-•*]\s*/, '');
                return (
                  <div
                    key={idx}
                    data-pdf-block="true"
                    className="flex items-start gap-2.5 pr-2 text-right"
                  >
                    <span className="text-emerald-600 font-bold text-xs mt-0.5 shrink-0">◆</span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {renderFormattedInline(itemText)}
                    </p>
                  </div>
                );
              }

              return (
                <div key={idx} data-pdf-block="true" className="text-right">
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {renderFormattedInline(line)}
                  </p>
                </div>
              );
            })
          ) : (
            <div
              data-pdf-block="true"
              className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 leading-relaxed text-right"
            >
              تشير نتائج القياس إلى تميزك في النمط{' '}
              <strong className="font-bold text-slate-900">{RIASEC_INFO[topTwo[0][0]].label}</strong>{' '}
              يليه النمط{' '}
              <strong className="font-bold text-slate-900">{RIASEC_INFO[topTwo[1][0]].label}</strong>
              . يُنصح بمناقشة هذه المؤشرات مع المرشد التربوي لاختيار المسار الأكاديمي والمهني الأنسب.
            </div>
          )}
        </div>

        {/* Final Block: Counselor Review Box & Official School Footer */}
        <div data-pdf-block="true" className="pt-4 border-t border-slate-200 space-y-4">
          <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-right">
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">
                ملاحظات وتوصيات المرشد التربوي:
              </span>
              <div className="h-8 border-b border-dashed border-slate-300"></div>
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">
                توقيع المرشد التربوي / اعتماد المدرسة:
              </span>
              <div className="h-8 border-b border-dashed border-slate-300"></div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <span>منصة بوصلتي للتمكين المهني الذكي · مدرسة أحمد اللوزي الثانوية للبنين</span>
            <span className="tabular-nums">العام الدراسي {currentYear}</span>
          </div>
        </div>
      </div>
    );
  }
);

PdfReportTemplate.displayName = 'PdfReportTemplate';

export default PdfReportTemplate;
