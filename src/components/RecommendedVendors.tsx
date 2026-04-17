import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Vendor = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  category: string;
};

const RecommendedVendors = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // Get profiles that are vendors, joined with their first service category
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "vendor")
        .limit(10);

      if (!roles || roles.length === 0) { setLoading(false); return; }

      const vendorIds = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", vendorIds)
        .limit(8);

      // Get primary service category for each vendor
      const { data: services } = await supabase
        .from("vendor_services")
        .select("vendor_id, category")
        .in("vendor_id", vendorIds)
        .eq("active", true);

      const categoryMap: Record<string, string> = {};
      services?.forEach((s) => {
        if (!categoryMap[s.vendor_id]) categoryMap[s.vendor_id] = s.category;
      });

      const merged = (profiles || []).map((p) => ({
        ...p,
        category: categoryMap[p.user_id] || "Service Provider",
      }));

      setVendors(merged);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel("recommended-vendors")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, () => fetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "vendor_services" }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) {
    return (
      <section>
        <h2 className="text-lg font-heading font-semibold text-foreground mb-4">Recommended For You</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-44 h-28 bg-card rounded-xl shadow-card animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (vendors.length === 0) return null;

  return (
    <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-heading font-semibold text-foreground">Recommended For You</h2>
        <button onClick={() => navigate("/search")} className="text-sm font-medium text-primary hover:underline">See All</button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {vendors.map((vendor) => (
          <div
            key={vendor.user_id}
            onClick={() => navigate(`/vendor-profile/${vendor.user_id}`)}
            className="flex-shrink-0 w-44 bg-card rounded-xl p-3.5 shadow-card hover:shadow-elevated transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-heading font-semibold text-primary overflow-hidden">
                {vendor.avatar_url ? (
                  <img src={vendor.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  (vendor.full_name || "?")[0]?.toUpperCase()
                )}
              </div>
              <span className={cn("ml-auto px-2 py-0.5 text-[10px] font-semibold rounded-full", (vendor as any).is_online !== false ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                {(vendor as any).is_online !== false ? "Active" : "Offline"}
              </span>
            </div>
            <h4 className="text-sm font-heading font-semibold text-foreground truncate">{vendor.full_name || "Vendor"}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{vendor.category}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 fill-secondary text-secondary" />
                <span className="text-xs font-semibold text-foreground">New</span>
              </div>
              {vendor.city && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <div className="flex items-center gap-0.5 text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="text-xs truncate">{vendor.city}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecommendedVendors;
