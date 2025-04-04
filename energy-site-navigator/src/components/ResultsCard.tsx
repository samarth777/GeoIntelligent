
import { FC } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ResultsCardProps {
  title: string;
  description: string;
  data: any[];
  dataKey: string;
  nameKey?: string;
  barColor: string;
  tooltipLabel?: string;
  tooltipUnit?: string;
  maxValue?: number;
}

const ResultsCard: FC<ResultsCardProps> = ({
  title,
  description,
  data,
  dataKey,
  nameKey = 'location',
  barColor,
  tooltipLabel = 'Score',
  tooltipUnit = '',
  maxValue
}) => {
  // Sort data by the data key for better visualization
  const sortedData = [...data].sort((a, b) => b[dataKey] - a[dataKey]);
  
  return (
    <Card className="border border-border">
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={sortedData}
              margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                domain={[0, maxValue || 'auto']}
                tickFormatter={(value) => `${value}${tooltipUnit}`}
              />
              <YAxis 
                type="category" 
                dataKey={nameKey} 
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}${tooltipUnit}`, tooltipLabel]}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '12px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
                }}
              />
              <Legend />
              <Bar dataKey={dataKey} fill={barColor} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsCard;
