
import { FC } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MonthlyData } from '@/lib/api';

interface MonthlyDataChartProps {
  data: MonthlyData;
  title: string;
  locationName: string;
  lineColor: string;
  yAxisLabel: string;
}

const MonthlyDataChart: FC<MonthlyDataChartProps> = ({ 
  data, 
  title, 
  locationName, 
  lineColor,
  yAxisLabel
}) => {
  // Convert the monthly data object to an array format for recharts
  const chartData = Object.entries(data).map(([month, value]) => ({
    month,
    value
  }));
  
  return (
    <Card className="border border-border">
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>Monthly data for {locationName}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis 
                label={{ 
                  value: yAxisLabel, 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }} 
              />
              <Tooltip 
                formatter={(value: number) => [value.toFixed(2), yAxisLabel]}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '12px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                name={yAxisLabel}
                stroke={lineColor} 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyDataChart;
