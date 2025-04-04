
import { FC } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onAnalyze: () => void;
  isLoading?: boolean;
}

const DateRangePicker: FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onAnalyze,
  isLoading = false
}) => {
  return (
    <Card className="border border-border">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Analysis Date Range</h3>
          </div>
          
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="text"
                placeholder="YYYY-MM-DDTHH"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Format: YYYY-MM-DDTHH</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="text"
                placeholder="YYYY-MM-DDTHH"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Format: YYYY-MM-DDTHH</p>
            </div>
            
            <Button 
              onClick={onAnalyze} 
              className="w-full mt-2" 
              disabled={isLoading}
            >
              {isLoading ? "Analyzing..." : "Run Analysis"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DateRangePicker;
