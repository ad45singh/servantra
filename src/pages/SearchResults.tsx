import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, Star, MapPin, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type VendorResult = {
  id: string;
  name: string;
  service: string;
  searchString?: string;
  rating: number;
  reviews: number;
  distance: number;
  price: string;
  available: boolean;
  avatar: string;
  experience: number;
};

type SortOption = "relevance" | "price" | "rating" | "distance";

const sortLabels: Record<SortOption, string> = {
  relevance: "Relevance",
  price: "Price",
  rating: "Rating",
  distance: "Distance",
};

const ratingFilters = [4.5, 4.0, 3.5];

const SearchResults = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [minRating, setMinRating] = useState<number | null>(null);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [allVendors, setAllVendors] = useState<VendorResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);

      // Only fetch admin-approved vendors
      const { data: approvedProfiles } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("approval_status", "approved");

      if (!approvedProfiles || approvedProfiles.length === 0) {
        setAllVendors([]);
        setLoading(false);
        return;
      }

      const approvedIds = approvedProfiles.map((p) => p.user_id);

      // Skip user_roles query because it gets blocked by RLS for normal customers.
      // If they are an approved profile with active services, they are a vendor.
      const vendorIds = approvedIds;
      
      const [profilesRes, servicesRes] = await Promise.all([
        supabase.from("profiles").select("*").in("user_id", vendorIds),
        supabase.from("vendor_services").select("*").in("vendor_id", vendorIds).eq("active", true),
      ]);

      const servicesMap: Record<string, any[]> = {};
      servicesRes.data?.forEach((s) => {
        if (!servicesMap[s.vendor_id]) servicesMap[s.vendor_id] = [];
        servicesMap[s.vendor_id].push(s);
      });

      const vendors: VendorResult[] = (profilesRes.data || [])
        .filter(p => servicesMap[p.user_id] && servicesMap[p.user_id].length > 0) // Only include profiles that actually have active services
        .map((p) => {
        const vendorServices = servicesMap[p.user_id] || [];
        const primaryService = vendorServices[0];
        const allServicesString = vendorServices.map((s) => `${s.category} ${s.name}`).join(" ");
        return {
          id: p.user_id,
          name: p.full_name || "Vendor",
          service: primaryService ? primaryService.category : "Service Provider",
          searchString: allServicesString,
          rating: 4.8,
          reviews: 0,
          distance: 1.2,
          price: primaryService ? `₹${primaryService.price}` : "Contact",
          available: (p as any).is_online !== false,
          avatar: p.avatar_url ? p.avatar_url : (p.full_name ? p.full_name[0].toUpperCase() : "?"),
          experience: 5,
        };
      });

      setAllVendors(vendors);
      setLoading(false);
    };

    fetchVendors();

    // Realtime: re-fetch when approval status changes or services update
    const channel = supabase
      .channel("search-vendors-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, fetchVendors)
      .on("postgres_changes", { event: "*", schema: "public", table: "vendor_services" }, fetchVendors)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, fetchVendors)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = allVendors
    .filter((v) => {
      if (query) {
        const q = query.toLowerCase();
        if (
          !v.name.toLowerCase().includes(q) &&
          !v.service.toLowerCase().includes(q) &&
          !v.searchString?.toLowerCase().includes(q)
        ) return false;
      }
      if (minRating && v.rating < minRating) return false;
      if (availableOnly && !v.available) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":   return b.rating - a.rating;
        case "distance": return a.distance - b.distance;
        case "price":    return a.price.localeCompare(b.price);
        default:         return b.reviews - a.reviews;
      }
    });

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3 space-y-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search services or vendors..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn("p-2 rounded-xl transition-colors", showFilters ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground")}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {(Object.keys(sortLabels) as SortOption[]).map((opt) => (
            <button
              key={opt}
              onClick={() => setSortBy(opt)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                sortBy === opt ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {sortLabels[opt]}
            </button>
          ))}
          <button
            onClick={() => setAvailableOnly(!availableOnly)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
              availableOnly ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            Available Now
          </button>
        </div>

        {showFilters && (
          <div className="pb-2 animate-slide-up">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Minimum Rating</p>
            <div className="flex gap-2">
              {ratingFilters.map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(minRating === r ? null : r)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                    minRating === r ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Star className="w-3 h-3" /> {r}+
                </button>
              ))}
              {minRating && (
                <button onClick={() => setMinRating(null)} className="text-xs text-primary font-medium px-2">Clear</button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Results */}
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">{filtered.length} vendors found</p>
            {filtered.map((vendor) => (
              <button
                key={vendor.id}
                onClick={() => navigate(`/vendor-profile/${vendor.id}`)}
                className="w-full flex items-start gap-3.5 bg-card rounded-xl p-4 shadow-card hover:shadow-elevated transition-all text-left hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-heading font-bold text-primary flex-shrink-0 overflow-hidden">
                  {vendor.avatar.length === 1
                    ? vendor.avatar
                    : <img src={vendor.avatar} alt="" className="w-full h-full object-cover" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-heading font-semibold text-foreground truncate">{vendor.name}</h3>
                    {vendor.available && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-success/10 text-success rounded-full flex-shrink-0 ml-2">
                        Available
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{vendor.service} · {vendor.experience} yrs exp</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-secondary text-secondary" />
                      <span className="text-xs font-semibold text-foreground">{vendor.rating}</span>
                      <span className="text-xs text-muted-foreground">({vendor.reviews})</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="text-xs">{vendor.distance} km</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground ml-auto">{vendor.price}</span>
                  </div>
                </div>
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-heading font-semibold text-foreground">No vendors found</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
