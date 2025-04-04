
import { FC } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from 'lucide-react';

interface ElevationMapProps {
  title: string;
  locationName: string;
  imgUrl?: string;
}

const ElevationMap: FC<ElevationMapProps> = ({ title, locationName, imgUrl }) => {
  return (
    <Card className="border border-border overflow-hidden h-full">
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>Elevation map for {locationName}</CardDescription>
      </CardHeader>
      <CardContent className="p-0 relative">
        {imgUrl ? (
          <div className="w-full h-[300px] relative">
            <img 
              src={imgUrl} 
              alt={`Elevation map for ${locationName}`} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 map-gradient pointer-events-none"></div>
          </div>
        ) : (
          <div className="w-full h-[300px] bg-muted/30 flex flex-col items-center justify-center p-6 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Elevation map not available</p>
            <p className="text-sm text-muted-foreground mt-2">
              The elevation data for this location could not be loaded.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ElevationMap;
