
import { FC } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ScoreCardProps {
  title: string;
  score: number;
  icon: JSX.Element;
  description: string;
  gradient: string;
  secondaryMetric?: { label: string; value: string | number };
}

const ScoreCard: FC<ScoreCardProps> = ({
  title,
  score,
  icon,
  description,
  gradient,
  secondaryMetric
}) => {
  return (
    <Card className="border border-border overflow-hidden">
      <div className={`h-2 ${gradient}`} />
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          <div className="p-2 rounded-full bg-muted/50">{icon}</div>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold">{score.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground mb-1">/100</span>
          </div>
          {secondaryMetric && (
            <div className="text-sm text-muted-foreground">
              {secondaryMetric.label}: <span className="font-medium">{typeof secondaryMetric.value === 'number' ? secondaryMetric.value.toLocaleString() : secondaryMetric.value}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreCard;
