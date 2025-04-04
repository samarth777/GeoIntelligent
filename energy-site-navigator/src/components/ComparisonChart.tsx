
import { FC } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CombinedResult } from '@/lib/api';

interface ComparisonChartProps {
  data: CombinedResult[];
}

const ComparisonChart: FC<ComparisonChartProps> = ({ data }) => {
  const sortedData = [...data].sort((a, b) => b.hybrid_score - a.hybrid_score);
  
  return (
    <Card className="border border-border">
      <CardHeader className="pb-2">
        <CardTitle>Energy Type Comparison</CardTitle>
        <CardDescription>Compare solar vs wind potential across locations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={sortedData}
              margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis 
                type="category" 
                dataKey="location" 
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  const formattedName = name === 'solar_score' 
                    ? 'Solar Score' 
                    : name === 'wind_score' 
                      ? 'Wind Score' 
                      : 'Hybrid Score';
                  return [`${value.toFixed(1)}/100`, formattedName];
                }}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '12px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
                }}
              />
              <Legend />
              <Bar dataKey="solar_score" name="Solar Score" fill="#f97316" />
              <Bar dataKey="wind_score" name="Wind Score" fill="#0ea5e9" />
              <Bar dataKey="hybrid_score" name="Hybrid Score" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComparisonChart;
