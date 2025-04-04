
import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import DateRangePicker from '@/components/DateRangePicker';
import LocationsList from '@/components/LocationsList';
import { 
  AnalysisResults, 
  Location, 
  fetchLocations, 
  runAnalysis 
} from '@/lib/api';
import { ArrowRight, BarChart2, MapPin, Sun, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Dashboard: FC = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [startDate, setStartDate] = useState<string>("2023-01-01T00");
  const [endDate, setEndDate] = useState<string>("2023-12-31T23");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLocations();
      setLocations(data);
    } catch (error) {
      console.error("Error loading locations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const results = await runAnalysis(startDate, endDate);
      setResults(results);
      navigate('/results', { state: { results } });
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container max-w-7xl py-6 space-y-8">
      <PageHeader
        title="Renewable Energy Site Selection"
        description="Analyze potential locations for optimal solar and wind energy production."
        icon={<Sun className="h-8 w-8" />}
      />

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onAnalyze={handleAnalyze}
            isLoading={isAnalyzing}
          />
          
          <LocationsList
            locations={locations}
            onLocationsChange={loadLocations}
          />
        </div>

        <div className="md:col-span-2">
          <Card className="h-full border border-border">
            <CardContent className="p-6 flex flex-col items-center justify-center h-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 w-full">
                <div className="flex flex-col items-center justify-center p-6 bg-orange-50 rounded-lg text-center">
                  <Sun className="h-12 w-12 text-solar mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Solar Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Evaluate locations for solar irradiance, temperature patterns, and optimal panel placement.
                  </p>
                </div>
                
                <div className="flex flex-col items-center justify-center p-6 bg-blue-50 rounded-lg text-center">
                  <Wind className="h-12 w-12 text-wind mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Wind Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Measure wind speed, consistency, and topographical advantages for turbine placement.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center max-w-md">
                <BarChart2 className="h-16 w-16 text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-2">Ready to Find Optimal Sites?</h2>
                <p className="text-muted-foreground mb-6">
                  Select your locations of interest, set the date range for analysis, 
                  and click Run Analysis to discover the best renewable energy sites.
                </p>
                
                <Button 
                  size="lg" 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || locations.filter(l => l.active).length === 0}
                  className="gap-2"
                >
                  {isAnalyzing ? "Analyzing..." : "Run Analysis"} 
                  <ArrowRight className="h-4 w-4" />
                </Button>
                
                {locations.filter(l => l.active).length === 0 && (
                  <p className="text-sm text-destructive mt-2">
                    Please enable at least one location to analyze
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
