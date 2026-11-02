
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { RIASECScores } from '../types';
import { RIASEC_INFO } from '../constants';

interface CareerChartProps {
  scores: RIASECScores;
}

const CareerChart: React.FC<CareerChartProps> = ({ scores }) => {
  // الحد الأقصى للدرجة لكل نمط هو 25 (5 أسئلة * 5 درجات)
  const data = [
    { subject: RIASEC_INFO.R.label, A: scores.R, fullMark: 25 },
    { subject: RIASEC_INFO.I.label, A: scores.I, fullMark: 25 },
    { subject: RIASEC_INFO.A.label, A: scores.A, fullMark: 25 },
    { subject: RIASEC_INFO.S.label, A: scores.S, fullMark: 25 },
    { subject: RIASEC_INFO.E.label, A: scores.E, fullMark: 25 },
    { subject: RIASEC_INFO.C.label, A: scores.C, fullMark: 25 },
  ];

  return (
    <div className="w-full h-[300px] md:h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12 }} />
          <Radar
            name="الميول المهنية"
            dataKey="A"
            stroke="#059669"
            fill="#10b981"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CareerChart;
