
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SunIcon, WindIcon } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl text-center">
        <h1 className="text-4xl sm:text-6xl font-bold text-primary mb-6">
          Renewable Energy Site Selection System
        </h1>
        
        <p className="text-lg sm:text-xl text-muted-foreground mb-8">
          Identify optimal locations for wind farms and solar panel installations using 
          advanced geospatial and weather data analysis. Maximize energy production 
          and efficiency with data-driven insights.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-md">
            <SunIcon className="w-16 h-16 mx-auto text-orange-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Solar Analysis</h2>
            <p className="text-muted-foreground mb-4">
              Evaluate locations based on solar irradiance, temperature, humidity, 
              elevation, and other factors that affect solar panel efficiency.
            </p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-md">
            <WindIcon className="w-16 h-16 mx-auto text-blue-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Wind Analysis</h2>
            <p className="text-muted-foreground mb-4">
              Assess wind speeds, direction, stability, and elevation to determine 
              the best locations for wind turbine installations.
            </p>
          </div>
        </div>
        
        <Button 
          onClick={() => navigate('/dashboard')} 
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white text-lg px-8 py-6 h-auto"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default Index;
