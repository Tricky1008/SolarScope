import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import type { MonthlyGeneration } from '../types';

interface Props {
  data: MonthlyGeneration[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-slate-blue/30 rounded-lg px-3 py-2 text-sm shadow-lg">
        <p className="text-text-secondary text-xs">{label}</p>
        <p className="text-solar-orange font-bold font-data">{payload[0].value.toLocaleString()} kWh</p>
      </div>
    );
  }
  return null;
};

// Season-based color coding
function barColor(month: string, isMax: boolean): string {
  if (isMax) return '#FF6B1A'; // Solar Orange for peak
  const summer = ['Mar', 'Apr', 'May', 'Jun'];
  const monsoon = ['Jul', 'Aug', 'Sep'];
  if (summer.includes(month)) return '#FF9A5C';     // Solar Orange Light
  if (monsoon.includes(month)) return '#0A84FF';     // Electric Blue
  return '#0057B8';                                   // Sky Dark
}

export default function MonthlyChart({ data }: Props) {
  const maxVal = Math.max(...data.map(d => d.kwh));

  return (
    <div role="img" aria-label="Monthly solar generation bar chart">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="month"
            tick={{ fill: '#8BA7C2', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#8BA7C2', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,107,26,0.08)' }} />
          <Bar dataKey="kwh" radius={[4, 4, 0, 0]} animationDuration={800} animationEasing="ease-out">
            {data.map((entry) => (
              <Cell
                key={entry.month}
                fill={barColor(entry.month, entry.kwh === maxVal)}
                opacity={0.9}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
