
import { FC, useState } from 'react';
import { Location, addLocation, toggleLocationActive } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface LocationsListProps {
  locations: Location[];
  onLocationsChange: () => void;
}

const LocationsList: FC<LocationsListProps> = ({ locations, onLocationsChange }) => {
  const [newName, setNewName] = useState('');
  const [newCoordinates, setNewCoordinates] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await toggleLocationActive(id, active);
      onLocationsChange();
    } catch (error) {
      // Error already handled in API function
    }
  };

  const handleAddLocation = async () => {
    if (!newName.trim() || !newCoordinates.trim()) {
      toast.error("Please enter both name and coordinates");
      return;
    }

    const coordRegex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
    if (!coordRegex.test(newCoordinates)) {
      toast.error("Coordinates must be in format: lat,lon (e.g. 35.4937,-118.8591)");
      return;
    }

    try {
      await addLocation(newName, newCoordinates);
      setNewName('');
      setNewCoordinates('');
      setIsAdding(false);
      onLocationsChange();
      toast.success("Location added successfully");
    } catch (error) {
      // Error already handled in API function
    }
  };

  return (
    <Card className="border border-border w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Locations</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsAdding(!isAdding)}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isAdding && (
          <div className="space-y-4 mb-4 p-3 bg-muted/30 rounded-md">
            <div className="space-y-2">
              <Label htmlFor="location-name">Location Name</Label>
              <Input
                id="location-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Phoenix, AZ"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coordinates">Coordinates (lat,lon)</Label>
              <Input
                id="coordinates"
                value={newCoordinates}
                onChange={(e) => setNewCoordinates(e.target.value)}
                placeholder="e.g. 33.4484,-112.0740"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddLocation} size="sm">Add Location</Button>
              <Button onClick={() => setIsAdding(false)} variant="outline" size="sm">Cancel</Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {locations.map((location) => (
            <div
              key={location.id}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{location.name}</p>
                  <p className="text-xs text-muted-foreground">{location.coordinates}</p>
                </div>
              </div>
              <Switch
                checked={location.active}
                onCheckedChange={(checked) => handleToggle(location.id, checked)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationsList;
