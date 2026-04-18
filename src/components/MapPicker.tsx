import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, Navigation } from "lucide-react";
import { toast } from "sonner";
import type { AddressFields } from "./AddressForm";

// Fix leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapPickerProps {
  onLocationSelect: (address: Partial<AddressFields>) => void;
}

const LocationMarker = ({ position, setPosition }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
};

export const MapPicker = ({ onLocationSelect }: MapPickerProps) => {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`);
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const street = addr.road || addr.street || "";
        const area = addr.suburb || addr.neighbourhood || addr.residential || "";
        const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || "";
        const pincode = addr.postcode || "";
        const country = addr.country || "India";

        onLocationSelect({
          street,
          area,
          city,
          pincode,
          country
        });
        toast.success("Address auto-filled from map!");
      }
    } catch (err) {
      toast.error("Failed to get address details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (position) {
      // Debounce the reverse geocoding slightly
      const timeout = setTimeout(() => {
        reverseGeocode(position.lat, position.lng);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [position]);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition(new L.LatLng(latitude, longitude));
        setDetecting(false);
      },
      (err) => {
        toast.error("Failed to get current location. Please allow access.");
        setDetecting(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-xs font-medium text-muted-foreground block flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" /> Select on Map
        </label>
        <button
          type="button"
          onClick={handleCurrentLocation}
          className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
          disabled={detecting}
        >
          {detecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
          Use My Location
        </button>
      </div>
      
      <div className="h-48 w-full rounded-xl overflow-hidden border border-border relative z-0">
        <MapContainer
          center={[28.6139, 77.2090]} // Default to New Delhi
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>
        
        {loading && (
          <div className="absolute inset-0 z-[1000] bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground text-center">Tap anywhere on the map to set location</p>
    </div>
  );
};
