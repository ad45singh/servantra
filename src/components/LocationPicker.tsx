import { MapPin, ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const LocationPicker = () => {
  const [locationName, setLocationName] = useState("Bengaluru");
  const [detecting, setDetecting] = useState(false);

  const detect = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || "Current Location";
          setLocationName(city);
          toast.success(`Location set to ${city}`);
        } catch {
          setLocationName("Current Location");
        }
        setDetecting(false);
      },
      () => {
        toast.error("Location access denied");
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <button onClick={detect} className="flex items-center gap-1.5 text-foreground hover:opacity-80 transition-opacity">
      {detecting ? (
        <Loader2 className="w-4 h-4 text-primary animate-spin" />
      ) : (
        <MapPin className="w-4 h-4 text-primary" />
      )}
      <span className="text-sm font-heading font-semibold truncate max-w-[100px]">{locationName}</span>
      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
    </button>
  );
};
