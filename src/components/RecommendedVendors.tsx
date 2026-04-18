import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Vendor = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  category: string;
  is_online?: boolean;
};

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(" ");

const RecommendedVendors = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApprovedVendors = async () => {
      // Step 1: get profiles that are admin-approved
      const { data: approvedProfiles } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("approval_status", "approved");

      if (!approvedProfiles || approvedProfiles.length === 0) {
        setVendors([]);
        setLoading(false);
        return;
      }

      const approvedIds = approvedProfiles.map((p) => p.user_id);

      // Skip querying user_roles (it's blocked by RLS for customers)
      // Since only vendors have vendor_services anyway, we can just query services for approvedIds
      const vendorIds = approvedIds;

      // Step 3: fetch profiles + active services
      const [profilesRes, servicesRes] = await Promise.all([
        supabase.from("profiles").select("*").in("user_id", vendorIds).limit(8),
        supabase.from("vendor_services").select("vendor_id, category").in("vendor_id", vendorIds).eq("active", true),
      ]);

      const categoryMap: Record<string, string> = {};
      servicesRes.data?.forEach((s) => {
        if (!categoryMap[s.vendor_id]) categoryMap[s.vendor_id] = s.category;
      });

      const merged: Vendor[] = (profilesRes.data || []).map((p) => ({
        user_id: p.user_id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        city: p.city,
        category: categoryMap[p.user_id] || "Service Provider",
        is_online: (p as any).is_online,
      }));

      setVendors(merged);
      setLoading(false);
    };

    fetchApprovedVendors();

    // Realtime: fires whenever admin approves/suspends a vendor (profiles UPDATE),
    // a vendor's role changes (user_roles), or vendor updates their services.
    // Customer site updates instantly — no refresh needed.
    const channel = supabase
      .channel("recommended-vendors-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, fetchApprovedVendors)
      .on("postgres_changes", { event: "*",      schema: "public", table: "user_roles" }, fetchApprovedVendors)
      .on("postgres_changes", { event: "*",      schema: "public", table: "vendor_services" }, fetchApprovedVendors)
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
        <button onClick={() => navigate("/search")} className="text-sm font-medium text-primary hover:underline">
          See All
        </button>
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
              <span className={cn(
                "ml-auto px-2 py-0.5 text-[10px] font-semibold rounded-full",
                vendor.is_online !== false ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
              )}>
                {vendor.is_online !== false ? "Active" : "Offline"}
              </span>
            </div>
            <h4 className="text-sm font-heading font-semibold text-foreground truncate">
              {vendor.full_name || "Vendor"}
            </h4>
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
