
import { FC, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart2, Droplets, MapPin, Mountain, Sun, Thermometer, Wind } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import ScoreCard from '@/components/ScoreCard';
import ResultsCard from '@/components/ResultsCard';
import ComparisonChart from '@/components/ComparisonChart';
import MonthlyDataChart from '@/components/MonthlyDataChart';
import ElevationMap from '@/components/ElevationMap';
import { AnalysisResults, CombinedResult, MonthlyData, SolarResult, WindResult, fetchMonthlyData } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LocationState {
  results: AnalysisResults;
}

const Results: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [activeTab, setActiveTab] = useState('combined');
  const [bestSolar, setBestSolar] = useState<SolarResult | null>(null);
  const [bestWind, setBestWind] = useState<WindResult | null>(null);
  const [bestHybrid, setBestHybrid] = useState<CombinedResult | null>(null);
  const [monthlySolarData, setMonthlySolarData] = useState<MonthlyData | null>(null);

  useEffect(() => {
    // Get results from location state or redirect to dashboard
    const state = location.state as LocationState;
    if (!state || !state.results) {
      navigate('/');
      return;
    }

    setResults(state.results);

    // Find best locations
    if (state.results.solar && state.results.solar.length > 0) {
      const bestSolar = state.results.solar.reduce((prev, current) => 
        prev.solar_score > current.solar_score ? prev : current
      );
      setBestSolar(bestSolar);
      
      // Fetch monthly data for best solar location
      fetchMonthlySolarData(bestSolar.location);
    }

    if (state.results.wind && state.results.wind.length > 0) {
      const bestWind = state.results.wind.reduce((prev, current) => 
        prev.wind_score > current.wind_score ? prev : current
      );
      setBestWind(bestWind);
    }

    if (state.results.combined && state.results.combined.length > 0) {
      const bestHybrid = state.results.combined.reduce((prev, current) => 
        prev.hybrid_score > current.hybrid_score ? prev : current
      );
      setBestHybrid(bestHybrid);
    }
  }, [location, navigate]);

  const fetchMonthlySolarData = async (locationName: string) => {
    // This would normally fetch from API but we'll use the mock data in the API module
    const coordinates = "33.4484,-112.0740"; // Default to Phoenix
    const data = await fetchMonthlyData(locationName, coordinates);
    if (data) {
      setMonthlySolarData(data);
    }
  };

  if (!results) {
    return (
      <div className="container max-w-7xl py-6">
        <div className="flex justify-center items-center h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Loading Results...</h2>
            <p className="text-muted-foreground">
              If you're seeing this message for too long, please return to the dashboard and run analysis again.
            </p>
            <Button 
              variant="outline" 
              className="mt-6"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-6 space-y-8">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          className="mr-4"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <PageHeader
          title="Analysis Results"
          description="Review detailed site assessments for renewable energy potential"
          icon={<BarChart2 className="h-8 w-8" />}
        />
      </div>

      {bestSolar && bestWind && bestHybrid && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScoreCard
            title="Best Solar Location"
            score={bestSolar.solar_score}
            icon={<Sun className="h-5 w-5 text-solar" />}
            description={bestSolar.location}
            gradient="solar-gradient"
            secondaryMetric={{
              label: "Daily Output",
              value: `${Math.round(bestSolar.estimated_daily_output_kwh).toLocaleString()} kWh`
            }}
          />
          
          <ScoreCard
            title="Best Wind Location"
            score={bestWind.wind_score}
            icon={<Wind className="h-5 w-5 text-wind" />}
            description={bestWind.location}
            gradient="wind-gradient"
            secondaryMetric={{
              label: "Daily Output",
              value: `${Math.round(bestWind.estimated_daily_output_kwh).toLocaleString()} kWh`
            }}
          />
          
          <ScoreCard
            title="Best Hybrid Location"
            score={bestHybrid.hybrid_score}
            icon={<BarChart2 className="h-5 w-5 text-geo" />}
            description={bestHybrid.location}
            gradient="geo-gradient"
            secondaryMetric={{
              label: "Combined Daily Output",
              value: `${Math.round(bestHybrid.solar_output + bestHybrid.wind_output).toLocaleString()} kWh`
            }}
          />
        </div>
      )}

      <Tabs defaultValue="combined" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full sm:w-[400px] mb-6">
          <TabsTrigger value="combined">Combined</TabsTrigger>
          <TabsTrigger value="solar">Solar</TabsTrigger>
          <TabsTrigger value="wind">Wind</TabsTrigger>
        </TabsList>
        
        <TabsContent value="combined" className="space-y-6">
          {results.combined && results.combined.length > 0 && (
            <>
              <ComparisonChart data={results.combined} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResultsCard
                  title="Hybrid Energy Score"
                  description="Combined solar and wind potential"
                  data={results.combined}
                  dataKey="hybrid_score"
                  barColor="#10b981"
                  tooltipLabel="Hybrid Score"
                  maxValue={100}
                />
                
                <ResultsCard
                  title="Total Energy Output"
                  description="Estimated daily output in kWh"
                  data={results.combined.map(item => ({
                    ...item,
                    total_output: item.solar_output + item.wind_output
                  }))}
                  dataKey="total_output"
                  barColor="#8b5cf6"
                  tooltipLabel="Total Output"
                  tooltipUnit=" kWh"
                />
              </div>
              
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle>Key Findings</CardTitle>
                  <CardDescription>Summary of location analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bestSolar && (
                    <div>
                      <h3 className="text-lg font-medium flex items-center">
                        <Sun className="h-5 w-5 text-solar mr-2" /> Best Location for Solar Farms
                      </h3>
                      <p className="text-muted-foreground pl-7">
                        <strong>{bestSolar.location}</strong> - Estimated daily output: {Math.round(bestSolar.estimated_daily_output_kwh).toLocaleString()} kWh, 
                        Suitability score: {bestSolar.solar_score.toFixed(1)}, 
                        Elevation: {Math.round(bestSolar.elevation_meters)} meters
                      </p>
                    </div>
                  )}
                  
                  {bestWind && (
                    <div>
                      <h3 className="text-lg font-medium flex items-center">
                        <Wind className="h-5 w-5 text-wind mr-2" /> Best Location for Wind Farms
                      </h3>
                      <p className="text-muted-foreground pl-7">
                        <strong>{bestWind.location}</strong> - Estimated daily output: {Math.round(bestWind.estimated_daily_output_kwh).toLocaleString()} kWh, 
                        Suitability score: {bestWind.wind_score.toFixed(1)}, 
                        Elevation: {Math.round(bestWind.elevation_meters)} meters
                      </p>
                    </div>
                  )}
                  
                  {bestHybrid && (
                    <div>
                      <h3 className="text-lg font-medium flex items-center">
                        <BarChart2 className="h-5 w-5 text-geo mr-2" /> Best Location for Hybrid Installation
                      </h3>
                      <p className="text-muted-foreground pl-7">
                        <strong>{bestHybrid.location}</strong> - Hybrid score: {bestHybrid.hybrid_score.toFixed(1)}, 
                        Solar output: {Math.round(bestHybrid.solar_output).toLocaleString()} kWh, 
                        Wind output: {Math.round(bestHybrid.wind_output).toLocaleString()} kWh, 
                        Elevation: {Math.round(bestHybrid.elevation_meters)} meters
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="solar" className="space-y-6">
          {results.solar && results.solar.length > 0 && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResultsCard
                  title="Solar Suitability Score"
                  description="Ranked by overall solar potential"
                  data={results.solar}
                  dataKey="solar_score"
                  barColor="#f97316"
                  tooltipLabel="Solar Score"
                  maxValue={100}
                />
                
                <ResultsCard
                  title="Estimated Solar Energy Production"
                  description="Daily output in kilowatt-hours"
                  data={results.solar}
                  dataKey="estimated_daily_output_kwh"
                  barColor="#fdba74"
                  tooltipLabel="Daily Output"
                  tooltipUnit=" kWh"
                />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ResultsCard
                  title="Solar Irradiance"
                  description="Average irradiance in W/m²"
                  data={results.solar}
                  dataKey="avg_solar_irradiance"
                  barColor="#fcd34d"
                  tooltipLabel="Average Irradiance"
                  tooltipUnit=" W/m²"
                />
                
                <ResultsCard
                  title="Average Temperature"
                  description="In degrees celsius"
                  data={results.solar}
                  dataKey="avg_temperature"
                  barColor="#fb923c"
                  tooltipLabel="Temperature"
                  tooltipUnit="°C"
                />
                
                <ResultsCard
                  title="Elevation vs Solar Score"
                  description="Impact of elevation on solar potential"
                  data={results.solar}
                  dataKey="elevation_meters"
                  barColor="#a5b4fc"
                  tooltipLabel="Elevation"
                  tooltipUnit="m"
                />
              </div>
              
              {bestSolar && monthlySolarData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <MonthlyDataChart 
                    data={monthlySolarData}
                    title="Monthly Solar Potential"
                    locationName={bestSolar.location}
                    lineColor="#f97316"
                    yAxisLabel="kWh/m²/day"
                  />
                  
                  <ElevationMap
                    title="Top Solar Location Terrain"
                    locationName={bestSolar.location}
                    imgUrl="phx.png" // Placeholder image
                  />
                </div>
              )}
              
              {bestSolar && (
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle>Solar Analysis Details</CardTitle>
                    <CardDescription>Technical data for top solar location</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center text-muted-foreground">
                          <Sun className="h-4 w-4 mr-2" />
                          <span>Irradiance</span>
                        </div>
                        <span className="text-xl font-medium">
                          {bestSolar.avg_solar_irradiance.toFixed(0)} W/m²
                        </span>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center text-muted-foreground">
                          <Thermometer className="h-4 w-4 mr-2" />
                          <span>Temperature</span>
                        </div>
                        <span className="text-xl font-medium">
                          {bestSolar.avg_temperature.toFixed(1)}°C
                        </span>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center text-muted-foreground">
                          <Droplets className="h-4 w-4 mr-2" />
                          <span>Humidity</span>
                        </div>
                        <span className="text-xl font-medium">
                          {bestSolar.avg_humidity.toFixed(0)}%
                        </span>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>Location</span>
                        </div>
                        <span className="text-xl font-medium">
                          {bestSolar.location}
                        </span>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center text-muted-foreground">
                          <Mountain className="h-4 w-4 mr-2" />
                          <span>Elevation</span>
                        </div>
                        <span className="text-xl font-medium">
                          {bestSolar.elevation_meters.toFixed(0)} meters
                        </span>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center text-muted-foreground">
                          <BarChart2 className="h-4 w-4 mr-2" />
                          <span>Derate Factor</span>
                        </div>
                        <span className="text-xl font-medium">
                          {bestSolar.pvwatts_derate ? bestSolar.pvwatts_derate.toFixed(3) : "N/A"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="wind" className="space-y-6">
          {results.wind && results.wind.length > 0 && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResultsCard
                  title="Wind Suitability Score"
                  description="Ranked by overall wind potential"
                  data={results.wind}
                  dataKey="wind_score"
                  barColor="#0ea5e9"
                  tooltipLabel="Wind Score"
                  maxValue={100}
                />
                
                <ResultsCard
                  title="Estimated Wind Energy Production"
                  description="Daily output in kilowatt-hours"
                  data={results.wind}
                  dataKey="estimated_daily_output_kwh"
                  barColor="#7dd3fc"
                  tooltipLabel="Daily Output"
                  tooltipUnit=" kWh"
                />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ResultsCard
                  title="Average Wind Speed"
                  description="In meters per second"
                  data={results.wind}
                  dataKey="avg_wind_speed"
                  barColor="#38bdf8"
                  tooltipLabel="Wind Speed"
                  tooltipUnit=" m/s"
                />
                
                <ResultsCard
                  title="Maximum Wind Gust"
                  description="In meters per second"
                  data={results.wind}
                  dataKey="max_wind_gust"
                  barColor="#0284c7"
                  tooltipLabel="Max Gust"
                  tooltipUnit=" m/s"
                />
                
                <ResultsCard
                  title="Wind Stability"
                  description="Lower values indicate more consistent wind"
                  data={results.wind}
                  dataKey="wind_stability"
                  barColor="#93c5fd"
                  tooltipLabel="Stability"
                />
              </div>
              
              {bestWind && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResultsCard
                    title="Elevation vs Wind Score"
                    description="Impact of elevation on wind potential"
                    data={results.wind}
                    dataKey="elevation_meters"
                    barColor="#a5b4fc"
                    tooltipLabel="Elevation"
                    tooltipUnit="m"
                  />
                  
                  <ElevationMap
                    title="Top Wind Location Terrain"
                    locationName={bestWind.location}
                    imgUrl="aml.png" // Placeholder image
                  />
                </div>
              )}
              
              {bestWind && (
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle>Wind Analysis Details</CardTitle>
                    <CardDescription>Technical data for top wind location</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center text-muted-foreground">
                          <Wind className="h-4 w-4 mr-2" />
                          <span>Average Wind Speed</span>
                        </div>
                        <span className="text-xl font-medium">
                          {bestWind.avg_wind_speed.toFixed(1)} m/s
                        </span>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center text-muted-foreground">
                          <Wind className="h-4 w-4 mr-2" />
                          <span>Max Wind Gust</span>
                        </div>
                        <span className="text-xl font-medium">
                          {bestWind.max_wind_gust.toFixed(1)} m/s
                        </span>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>Location</span>
                        </div>
                        <span className="text-xl font-medium">
                          {bestWind.location}
                        </span>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center text-muted-foreground">
                          <Mountain className="h-4 w-4 mr-2" />
                          <span>Elevation</span>
                        </div>
                        <span className="text-xl font-medium">
                          {bestWind.elevation_meters.toFixed(0)} meters
                        </span>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center text-muted-foreground">
                          <BarChart2 className="h-4 w-4 mr-2" />
                          <span>Wind Stability</span>
                        </div>
                        <span className="text-xl font-medium">
                          {bestWind.wind_stability.toFixed(1)}
                        </span>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center text-muted-foreground">
                          <Wind className="h-4 w-4 mr-2" />
                          <span>Wind Direction</span>
                        </div>
                        <span className="text-xl font-medium">
                          {bestWind.wind_direction.toFixed(0)}°
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Results;
