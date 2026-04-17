import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Star, MapPin, Clock, Share2, MessageCircle, ChevronRight, Camera, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavoriteVendor } from "@/hooks/useFavoriteVendor";
import { cn } from "@/lib/utils";

const VendorProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [v, setV] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isFavorite, loading: favLoading, toggleFavorite } = useFavoriteVendor(id);
  const [selectedService, setSelectedService] = useState(0);

  useEffect(() => {
    const fetchVendor = async () => {
      if (!id) return;
      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", id).single();
      const { data: services } = await supabase.from("vendor_services").select("*").eq("vendor_id", id).eq("active", true);
      
      if (profile) {
        setV({
          id: profile.user_id,
          name: profile.full_name || "Vendor",
          avatar: profile.avatar_url ? null : (profile.full_name ? profile.full_name[0].toUpperCase() : "?"),
          avatar_url: profile.avatar_url,
          coverColor: "from-primary to-primary/70",
          rating: 4.8,
          reviews: 0,
          experience: 5,
          distance: "1.2 km",
          bio: "Professional service provider available for booking.",
          services: (services && services.length > 0) ? services.map((s: any) => ({
            name: s.name,
            category: s.category,
            price: `₹${s.price}`,
            duration: s.duration || "1 hr"
          })) : [
            { name: "General Service", category: "Plumbing", price: "₹500", duration: "1 hr" }
          ],
          availability: [
            { day: "Mon", hours: "9 AM - 6 PM", active: true },
            { day: "Tue", hours: "9 AM - 6 PM", active: true },
            { day: "Wed", hours: "9 AM - 6 PM", active: true },
            { day: "Thu", hours: "9 AM - 6 PM", active: true },
            { day: "Fri", hours: "9 AM - 6 PM", active: true },
            { day: "Sat", hours: "10 AM - 4 PM", active: true },
            { day: "Sun", hours: "Closed", active: false },
          ],
          gallery: [],
          customerReviews: []
        });
      }
      setLoading(false);
    };
    fetchVendor();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!v) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Vendor not found</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-28 max-w-lg mx-auto">
      {/* Cover + Back */}
      <div className={`relative h-44 bg-gradient-to-br ${v.coverColor}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 z-10">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-card/80 backdrop-blur-sm hover:bg-card transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={toggleFavorite}
              disabled={favLoading}
              className="p-2 rounded-xl bg-card/80 backdrop-blur-sm hover:bg-card transition-colors"
            >
              <Heart className={cn("w-5 h-5 transition-colors", isFavorite ? "fill-destructive text-destructive" : "text-foreground")} />
            </button>
            <button className="p-2 rounded-xl bg-card/80 backdrop-blur-sm hover:bg-card transition-colors">
              <Share2 className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
        {/* Avatar */}
        <div className="absolute -bottom-10 left-4">
          <div className="w-20 h-20 rounded-2xl bg-card shadow-elevated flex items-center justify-center text-2xl font-heading font-bold text-primary border-4 border-background overflow-hidden">
            {v.avatar_url ? <img src={v.avatar_url} alt="" className="w-full h-full object-cover" /> : v.avatar}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pt-14 space-y-6">
        <div>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-heading font-bold text-foreground">{v.name}</h1>
                <span className={cn(
                  "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                  v.is_online !== false ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                )}>
                  {v.is_online !== false && <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>}
                  {v.is_online !== false ? "Available" : "Offline"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{v.services[0]?.category || "Service Provider"} · {v.experience} yrs experience</p>
            </div>
            <div className="flex items-center gap-1 bg-secondary/10 px-2.5 py-1 rounded-lg">
              <Star className="w-4 h-4 fill-secondary text-secondary" />
              <span className="text-sm font-heading font-bold text-foreground">{v.rating}</span>
              <span className="text-xs text-muted-foreground">({v.reviews})</span>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs">{v.distance} away</span>
          </div>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{v.bio}</p>
        </div>

        {/* Services */}
        <section>
          <h2 className="text-base font-heading font-semibold text-foreground mb-3">Services & Pricing</h2>
          <div className="bg-card rounded-xl shadow-card overflow-hidden divide-y divide-border">
            {v.services.map((s, i) => (
              <button
                key={i}
                onClick={() => setSelectedService(i)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 transition-all text-left",
                  selectedService === i ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-muted/50"
                )}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {s.duration}
                  </p>
                </div>
                <span className="text-sm font-heading font-bold text-foreground">{s.price}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Availability */}
        <section>
          <h2 className="text-base font-heading font-semibold text-foreground mb-3">Availability</h2>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {v.availability.map((a) => (
              <div
                key={a.day}
                className={`flex-shrink-0 w-16 text-center py-2.5 rounded-xl border transition-all ${
                  a.active ? "bg-card border-border shadow-card" : "bg-muted border-transparent opacity-50"
                }`}
              >
                <p className="text-xs font-semibold text-foreground">{a.day}</p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{a.hours}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Gallery */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-heading font-semibold text-foreground">Past Work</h2>
            <span className="text-xs text-muted-foreground">{v.gallery.length} photos</span>
          </div>
          {v.gallery.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {v.gallery.map((img: any, i: number) => (
              <div
                key={i}
                className={`aspect-square rounded-xl ${img.bg} flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}
              >
                <Camera className="w-5 h-5 text-muted-foreground/50" />
              </div>
            ))}
          </div>
          ) : (
            <div className="text-center py-6 bg-muted/30 rounded-xl border border-dashed border-border">
              <p className="text-xs text-muted-foreground">No photos added yet.</p>
            </div>
          )}
        </section>

        {/* Reviews */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-heading font-semibold text-foreground">Reviews</h2>
            <button className="text-xs font-medium text-primary hover:underline">See All</button>
          </div>
          {v.customerReviews.length > 0 ? (
          <div className="space-y-3">
            {v.customerReviews.map((r: any, i: number) => (
              <div key={i} className="bg-card rounded-xl p-4 shadow-card">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-heading font-semibold text-accent-foreground">
                    {r.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground">{r.date}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        className={`w-3 h-3 ${j < r.rating ? "fill-secondary text-secondary" : "text-border"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
          ) : (
            <div className="text-center py-6 bg-muted/30 rounded-xl border border-dashed border-border">
              <p className="text-xs text-muted-foreground">No reviews yet.</p>
            </div>
          )}
        </section>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border p-4">
        <div className="max-w-lg mx-auto flex gap-3">
          <Button variant="outline" size="lg" className="flex-shrink-0">
            <MessageCircle className="w-5 h-5" />
          </Button>
          <Button size="lg" className="flex-1" onClick={() => {
            const s = v.services[selectedService];
            const price = parseInt(s.price.replace(/[₹,]/g, ""));
            navigate("/book", { state: { category: s.category || "Plumbing", service: { name: s.name, price, duration: s.duration } } });
          }}>
            Book Now <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VendorProfile;
