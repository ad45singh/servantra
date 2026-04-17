import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useFavoriteVendor = (vendorId: string | undefined) => {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  const isValidUUID = (id: string) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(id);
  };

  useEffect(() => {
    if (!user || !vendorId) return;
    
    const check = async () => {
      if (!isValidUUID(vendorId) || !isValidUUID(user.id)) {
        // Fallback for dummy data
        const localFav = localStorage.getItem(`fav_${vendorId}`);
        if (localFav) setIsFavorite(true);
        return;
      }

      try {
        const { data, error } = await (supabase.from("favorite_vendors" as any) as any)
          .select("id")
          .eq("customer_id", user.id)
          .eq("vendor_id", vendorId)
          .maybeSingle();
        
        if (error && !error.message.includes("does not exist")) {
          console.error("Error checking favorite:", error);
        } else if (data) {
          setIsFavorite(true);
          setFavoriteId(data.id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    check();
  }, [user, vendorId]);

  const toggleFavorite = async () => {
    if (!user || !vendorId || loading) return;
    setLoading(true);
    try {
      if (!isValidUUID(vendorId) || !isValidUUID(user.id)) {
        // Handle dummy data locally
        if (isFavorite) {
          localStorage.removeItem(`fav_${vendorId}`);
          setIsFavorite(false);
          toast.success("Removed from favorites");
        } else {
          localStorage.setItem(`fav_${vendorId}`, "true");
          setIsFavorite(true);
          toast.success("Added to favorites ❤️");
        }
        return;
      }

      if (isFavorite && favoriteId) {
        await (supabase.from("favorite_vendors" as any) as any).delete().eq("id", favoriteId);
        setIsFavorite(false);
        setFavoriteId(null);
        toast.success("Removed from favorites");
      } else {
        const { data, error } = await (supabase.from("favorite_vendors" as any) as any)
          .insert({ customer_id: user.id, vendor_id: vendorId })
          .select()
          .single();
        if (error) throw error;
        setIsFavorite(true);
        setFavoriteId(data.id);
        toast.success("Added to favorites ❤️");
      }
    } catch (err: any) {
      if (err.message?.includes("does not exist")) {
        toast.error("Database table missing. Please set up 'favorite_vendors'.");
      } else {
        toast.error(err.message || "Failed to update");
      }
    } finally {
      setLoading(false);
    }
  };

  return { isFavorite, loading, toggleFavorite };
};
